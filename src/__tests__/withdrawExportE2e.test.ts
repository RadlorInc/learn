// @vitest-environment node
/**
 * WITHDRAWAL BY THE B3 LINK, AND "DOWNLOAD A COPY" — END TO END, THROUGH THE REAL CODE, INTO THE REAL SCHEMA.
 *
 * Both are deployed on production and neither has ever run there. What already existed, and why this
 * file is not a duplicate of it:
 *   · `consentRoutes.test.ts` drives the route with `rpc()` MOCKED — it proves the call order, not that
 *     the calls do anything to a database.
 *   · `consentDeletion.test.ts` calls `consent_withdraw` in SQL directly, and seeds only document 06's
 *     nine tables — so its catalog sweep ("no learner_id table still holds the child") is vacuous for
 *     every OTHER table (sessions, diagnostic_*, exercise_results, learner_invites…): a zero after is
 *     proof of nothing when there was no row before.
 *   · `parentRights.test.ts` calls `export_child_records` in SQL; `exportCompleteness.test.ts` checks
 *     that `buildExport` has a KEY per table. Neither reads a single real row through the real export,
 *     and nothing anywhere checked the file for another family's data.
 *
 * ⚠️ THE ONLY THING REPLACED IS THE NETWORK. `fetch` is stubbed with a small PostgREST + Resend stand-in:
 * the route, `rpc()`, `cancelEmail()`, supabase-js, `getParentDashboard`, `getLearnerExportExtras` and
 * `buildExport` all run for real, and every request is executed in the repo's real schema AS THE ROLE
 * THE REAL SERVER WOULD USE — `service_role` for the service key, `authenticated` with `auth.uid()` = the
 * JWT's `sub` for a parent. Nothing runs as the superuser except seeding and the read-back.
 * The stand-in refuses anything it does not implement (an unknown filter operator, a column list), so a
 * change in how the app queries goes red here instead of being silently mistranslated.
 *
 * ⚠️ THE TABLE SET IS DERIVED FROM THE CATALOG (every table with `learner_id`, plus every table hanging
 * off one of those by foreign key), and every table in it must be SEEDED with a row for the child — so a
 * new child table fails here until somebody seeds it and decides what withdrawal and export do with it.
 * Document 06's hand-written list is checked against that set as well, from the document itself.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PGlite, Transaction } from '@electric-sql/pglite'
import { loadSchema, foreignKeys, grantedConsent } from './_schema'

const SUPA = 'http://supabase.test', RESEND = 'http://resend.test'
const SERVICE = 'service-key-for-tests', ANON = 'anon-key-for-tests'
const PARENT_A = 'a0a0a0a0-aaaa-4aaa-8aaa-aaaaaaaaaaaa', KIDLOGIN_A = 'a1a1a1a1-cccc-4ccc-8ccc-cccccccccccc'
const PARENT_B = 'b0b0b0b0-bbbb-4bbb-8bbb-bbbbbbbbbbbb', KIDLOGIN_B = 'b1b1b1b1-dddd-4ddd-8ddd-dddddddddddd'
const MARK_A = 'MARK-FAMILY-A-7f3c', MARK_B = 'MARK-FAMILY-B-91e2'

/** Document 06, "See the data" and "Delete" — written out from the document, not derived. */
const DOC06 = ['learners', 'learner_access', 'lesson_progress', 'point_events', 'learner_stats',
  'learner_events', 'lesson_feedback', 'game_settings', 'error_events']

let db: PGlite

// ─────────────────────────────── the network stand-in ───────────────────────────────
const resendCalls: { path: string; body: Record<string, unknown> | null }[] = []
let lock: Promise<unknown> = Promise.resolve()
/** One request at a time: role and auth.uid() are session state, and the export fires eleven at once. */
const serial = <T>(f: () => Promise<T>): Promise<T> => { const p = lock.then(f); lock = p.catch(() => {}); return p }

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwtFor = (sub: string) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
  sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, email: `${sub}@x.test` })}.sig`
const subOf = (jwt: string) => JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()).sub as string

async function asCaller<T>(auth: string | null, f: (tx: Transaction) => Promise<T>): Promise<T> {
  const tok = auth?.replace(/^Bearer\s+/i, '') ?? ''
  const [role, uid] = tok === SERVICE ? ['service_role', ''] : tok.split('.').length === 3 ? ['authenticated', subOf(tok)] : ['anon', '']
  return serial(() => db.transaction(async tx => {
    await tx.query(`select set_config('test.uid', $1, true), set_config('test.role', $2, true)`, [uid, role])
    await tx.exec(`set local role ${role}`)
    return f(tx)
  }))
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const ident = (s: string) => { if (!/^[a-z_]+$/.test(s)) throw new Error(`stand-in: bad identifier ${s}`); return s }

async function fakeFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
  const headers = new Headers(init.headers)
  const body = typeof init.body === 'string' && init.body ? JSON.parse(init.body) : null

  if (url.origin === RESEND) {
    resendCalls.push({ path: url.pathname, body })
    if (url.pathname === '/emails') return json({ id: `re_${resendCalls.length}` })
    if (/^\/emails\/[^/]+\/cancel$/.test(url.pathname)) return json({ object: 'email', id: url.pathname.split('/')[2] })
    return json({ message: 'stand-in: unknown resend path' }, 404)
  }
  if (url.origin !== SUPA) throw new Error(`stand-in: unexpected request to ${url.origin}`)

  if (url.pathname === '/auth/v1/user') {
    const tok = headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
    if (tok.split('.').length !== 3) return json({ message: 'invalid jwt' }, 401)
    const id = subOf(tok)
    return json({ id, aud: 'authenticated', role: 'authenticated', email: `${id}@x.test`, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() })
  }

  try {
    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/([a-z_]+)$/)
    if (rpc && init.method === 'POST') {
      const fn = ident(rpc[1]), args = Object.entries(body ?? {})
      const [{ retset }] = (await db.query<{ retset: boolean }>(`select proretset retset from pg_proc where proname = $1 and pronamespace = 'public'::regnamespace`, [fn])).rows
      const call = `public.${fn}(${args.map(([k], i) => `${ident(k)} => $${i + 1}`).join(', ')})`
      return await asCaller(headers.get('authorization'), async tx => {
        const vals = args.map(([, v]) => v === null || typeof v !== 'object' ? v : JSON.stringify(v))
        if (retset) return json((await tx.query(`select * from ${call}`, vals)).rows)
        return json((await tx.query<{ r: unknown }>(`select ${call} as r`, vals)).rows[0].r)
      })
    }
    const table = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/)
    if (table && (init.method ?? 'GET') === 'GET') {
      const t = ident(table[1]), where: string[] = [], vals: unknown[] = []
      let order = '', limit = ''
      for (const [k, v] of url.searchParams) {
        if (k === 'select') { if (v !== '*') throw new Error(`stand-in: select=${v} not implemented`); continue }
        if (k === 'order') { order = ' order by ' + v.split(',').map(o => { const [c, dir = 'asc', nulls] = o.split('.'); return `${ident(c)} ${dir === 'desc' ? 'desc' : 'asc'}${nulls === 'nullsfirst' ? ' nulls first' : nulls === 'nullslast' ? ' nulls last' : ''}` }).join(', '); continue }
        if (k === 'limit') { limit = ` limit ${Number(v)}`; continue }
        const eq = v.match(/^eq\.(.*)$/), inn = v.match(/^in\.\((.*)\)$/)
        if (eq) { vals.push(eq[1]); where.push(`${ident(k)}::text = $${vals.length}`) }
        else if (inn) { const xs = inn[1].split(','); where.push(`${ident(k)}::text in (${xs.map(x => { vals.push(x.replace(/^"|"$/g, '')); return `$${vals.length}` }).join(', ')})`) }
        else throw new Error(`stand-in: filter ${k}=${v} not implemented`)
      }
      const sql = `select * from public.${t}${where.length ? ' where ' + where.join(' and ') : ''}${order}${limit}`
      return await asCaller(headers.get('authorization'), async tx => json((await tx.query(sql, vals)).rows))
    }
    throw new Error(`stand-in: ${init.method ?? 'GET'} ${url.pathname} not implemented`)
  } catch (e) {
    const x = e as { code?: string; message: string }
    if (x.message.startsWith('stand-in:')) throw e
    return json({ code: x.code, message: x.message }, x.code === '42501' ? 403 : 400)
  }
}

// ─────────────────────────────── the catalog and the seed ───────────────────────────────
const q = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows

/** Every public table with a learner_id column, and every table hanging off one of them by key. */
async function childTables(): Promise<{ direct: string[]; hanging: Record<string, [col: string, parent: string]> }> {
  const direct = (await q<{ t: string }>(`select c.relname t from pg_class c
    join pg_namespace n on n.oid = c.relnamespace join pg_attribute a on a.attrelid = c.oid
    where n.nspname = 'public' and c.relkind = 'r' and a.attname = 'learner_id' and not a.attisdropped order by 1`)).map(r => r.t)
  const hanging: Record<string, [string, string]> = {}
  for (const fk of await foreignKeys(db)) {
    const [child, parent] = [fk.child.replace(/^public\./, ''), fk.parent.replace(/^public\./, '')]
    if (direct.includes(parent) && !direct.includes(child) && child !== 'learners') hanging[child] = [fk.childCols, parent]
  }
  return { direct, hanging }
}

interface Family { parent: string; kid: string; login: string; consent: string; sessions: string[]; plans: string[] }

/** A row in EVERY child table, each carrying the family's marker where the table has a free-text column. */
async function seedRows(f: Omit<Family, 'sessions' | 'plans'>, mark: string): Promise<Family> {
  const k = f.kid
  const [{ chapter }] = await q<{ chapter: string }>(`select id as chapter from public.chapters order by id limit 1`)
  const [{ grade }] = await q<{ grade: string }>(`insert into public.grades (created_by, name) values ('${f.parent}', '${mark} class') returning id as grade`)
  const [{ sub }] = await q<{ sub: string }>(`insert into public.subscriptions (account_id) values ('${f.parent}') returning id as sub`)
  const [{ ds }] = await q<{ ds: string }>(`insert into public.diagnostic_sessions (learner_id, band, root_gap_skill) values ('${k}', '6-8', '${mark}') returning id as ds`)
  const [{ dp }] = await q<{ dp: string }>(`insert into public.diagnostic_plans (learner_id, session_id, revised_chapter) values ('${k}', '${ds}', '${mark}') returning id as dp`)
  await db.exec(`
    insert into auth.users (id, email, email_confirmed_at) values ('${f.login}', '${f.login}@learner.adaptivelearn.invalid', now());
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${k}', '${f.login}', 'self');
    insert into public.learner_stats (learner_id) values ('${k}') on conflict do nothing;
    insert into public.learner_state (learner_id, owned_items) values ('${k}', array['${mark}']) on conflict do nothing;
    insert into public.learner_progress (learner_id, chapter) values ('${k}', '${chapter}');
    insert into public.sessions (learner_id, chapter, client_id, completed_at) values ('${k}', '${chapter}', '${mark}', now());
    insert into public.lesson_progress (learner_id, lesson_id, done) values ('${k}', 'g3m1-t1', true);
    insert into public.point_events (learner_id, reason, points, lesson_id) values ('${k}', 'problem', 5, 'g3m1-t1');
    insert into public.learner_events (learner_id, event, props) values ('${k}', 'session_start', '{"m":"${mark}"}');
    insert into public.lesson_feedback (learner_id, lesson_id, screen, reasons) values ('${k}', '${mark}', '2', array['picture']);
    insert into public.game_settings (learner_id, time_zone) values ('${k}', 'UTC') on conflict do nothing;
    insert into public.error_events (source, message, learner_id) values ('client', 'crash ${mark}', '${k}');
    insert into public.exercise_results (learner_id, class_id, exercise_id, outcomes) values ('${k}', '${grade}', '${mark}', array['first']);
    insert into public.learner_invites (learner_id, invited_by, invited_email) values ('${k}', '${f.parent}', 'grandma@x.test');
    insert into public.subscription_seats (subscription_id, seat_index, learner_id) values ('${sub}', 1, '${k}');
    insert into public.diagnostic_items (session_id, skill_id, correct) values ('${ds}', '${mark}', true);
    insert into public.diagnostic_rechecks (session_id, learner_id, week, skill_id, gap_closed) values ('${ds}', '${k}', 1, '${mark}', true);
    insert into public.diagnostic_plan_progress (plan_id, chapter_id, skill_id) values ('${dp}', '${chapter}', '${mark}');`)
  return { ...f, sessions: [ds], plans: [dp] }
}

/** Rows about one child, per table. `parental_consents` is left out: it is KEPT, asserted on its own. */
async function rowsAbout(f: Family) {
  const { direct, hanging } = await childTables()
  const out: Record<string, number> = {}
  const n = async (sql: string) => Number((await q<{ n: number }>(sql))[0].n)
  out.learners = await n(`select count(*)::int n from public.learners where id = '${f.kid}'`)
  for (const t of direct.filter(t => t !== 'parental_consents'))
    out[t] = await n(`select count(*)::int n from public.${t} where learner_id = '${f.kid}'`)
  for (const [t, [col, parent]] of Object.entries(hanging)) {
    const ids = parent === 'diagnostic_sessions' ? f.sessions : parent === 'diagnostic_plans' ? f.plans : null
    if (!ids) throw new Error(`${t} hangs off ${parent}; this seed does not know how to find the child's rows there — add it`)
    out[t] = await n(`select count(*)::int n from public.${t} where ${col}::text in (${ids.map(i => `'${i}'`).join(',')})`)
  }
  return out
}

let A: Family, B: Family
let b3Stored = '', token = ''
const kidTokenFromB3 = (html: string) => html.match(/\/consent\/withdraw#t=([A-Za-z0-9_-]{43})/)?.[1] ?? ''

beforeAll(async () => {
  ({ db } = await loadSchema())
  for (const [k, v] of Object.entries({ NEXT_PUBLIC_SUPABASE_URL: SUPA, NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON,
    SUPABASE_SERVICE_ROLE_KEY: SERVICE, RESEND_API_KEY: 're_for_tests', RESEND_API_URL: RESEND })) vi.stubEnv(k, v)
  vi.stubGlobal('fetch', fakeFetch)
  // CI runs Node 20, which has no global WebSocket, and supabase-js refuses to construct without one. Realtime is
  // never opened on this path; this only lets the app's own client be built.
  if (typeof globalThis.WebSocket === 'undefined') vi.stubGlobal('WebSocket', class {})
  // A parent's request calls auth.uid() as `authenticated` in an INVOKER function (get_parent_dashboard), which
  // needs USAGE on schema auth. Supabase grants it; the fixture's prelude does not. That the live dashboard
  // loads at all is the evidence production has it.
  await db.exec('grant usage on schema auth to anon, authenticated, service_role')
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${PARENT_A}', 'a@x.test', now()), ('${PARENT_B}', 'b@x.test', now());
    insert into public.profiles (id, role) values ('${PARENT_A}', 'parent'), ('${PARENT_B}', 'parent') on conflict (id) do update set role = excluded.role;`)

  // ── Family A: consent through the REAL routes — the notice, B1, the grant link, B3 ──
  const { NOTICE_VERSION } = await import('@/features/consent/copy')
  const { POST: request } = await import('@/app/api/consent/request/route')
  const { POST: respond } = await import('@/app/api/consent/respond/route')
  const r1 = await request(new Request('http://x/api/consent/request', { method: 'POST',
    headers: { authorization: `Bearer ${jwtFor(PARENT_A)}`, 'x-forwarded-for': '10.7.0.1' }, body: JSON.stringify({ noticeVersion: NOTICE_VERSION, lang: 'en' }) }))
  expect(r1.status, JSON.stringify(await r1.clone().json())).toBe(200)
  const b1Token = String(resendCalls[0].body?.html).match(/\/consent\/respond#t=([A-Za-z0-9_-]{43})/)?.[1] ?? ''
  const r2 = await respond(new Request('http://x/api/consent/respond', { method: 'POST', headers: { 'x-forwarded-for': '10.7.0.2' },
    body: JSON.stringify({ t: b1Token, action: 'grant' }) }))
  expect((await r2.json()).status).toBe('granted')
  token = kidTokenFromB3(String(resendCalls[1].body?.html))
  expect(token, 'B3 carries no withdrawal link').toHaveLength(43)
  const [consentA] = await q<{ id: string; b3: string }>(`select id, second_email_provider_id b3 from public.parental_consents where parent_id = '${PARENT_A}'`)
  b3Stored = consentA.b3
  expect(b3Stored, 'the grant did not store the B3 Resend returned').toBe('re_2')

  // The child, created as the parent under that consent (the gate refuses anything else).
  const kidA = await asCaller(`Bearer ${jwtFor(PARENT_A)}`, async tx => (await tx.query<{ id: string }>(`insert into public.learners
    (display_name, avatar_index, age_group, created_by, consent_id) values ('Ana ${MARK_A}', 0, '6-8', '${PARENT_A}', '${consentA.id}') returning id`)).rows[0].id)
  A = await seedRows({ parent: PARENT_A, kid: kidA, login: KIDLOGIN_A, consent: consentA.id }, MARK_A)

  // ── Family B: the control. Another parent, their own child, a row everywhere. ──
  const consentB = await grantedConsent(db, PARENT_B)
  const [{ id: kidB }] = await q<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id)
    values ('Bo ${MARK_B}', 0, '6-8', '${PARENT_B}', '${consentB}') returning id`)
  await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${kidB}', '${PARENT_B}', 'owner') on conflict do nothing`)
  B = await seedRows({ parent: PARENT_B, kid: kidB, login: KIDLOGIN_B, consent: consentB }, MARK_B)
}, 120_000)

afterAll(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe('the table set', () => {
  it('every child table in the catalog is seeded for both families — a new one fails here until someone decides', async () => {
    for (const f of [A, B]) {
      const before = await rowsAbout(f)
      const empty = Object.entries(before).filter(([, n]) => n === 0).map(([t]) => t)
      expect(empty, 'seed a row in these, or a zero after withdrawal proves nothing about them').toEqual([])
    }
  })
  it('document 06 names nothing the catalog does not have, and still names what it did', async () => {
    const doc = readFileSync(join(__dirname, '../../docs/legal/06-parent-rights-procedure.md'), 'utf8')
    const row = doc.split('\n').find(l => l.startsWith('| **Delete**'))
    expect(row, 'control: document 06 has no "Delete" row').toBeDefined()
    for (const t of DOC06) expect(row, `document 06 no longer names ${t}`).toContain('`' + t + '`')
    const tables = await rowsAbout(A)
    expect(DOC06.filter(t => !(t in tables))).toEqual([])
  })
})

// ⚠️ ORDER MATTERS: the export runs BEFORE the withdrawal deletes family A.
describe('"Download a copy" — the real export, as the owning parent', () => {
  let file: Record<string, unknown> = {}
  let text = ''

  /** Each catalog table → the section that carries it, and how a row is recognised in both places. */
  const SECTION: Record<string, [key: string, dbCol: string, fileCol: string]> = {
    learners: ['learner', 'id', 'id'], learner_stats: ['stats', 'learner_id', 'learner_id'],
    learner_progress: ['chapterProgress', 'id', 'id'], sessions: ['sessions', 'id', 'id'],
    learner_state: ['shopState', 'learner_id', 'learner_id'], learner_events: ['activityEvents', 'id', 'id'],
    diagnostic_sessions: ['placementChecks', 'id', 'id'], diagnostic_items: ['placementCheckAnswers', 'id', 'id'],
    diagnostic_plans: ['learningPlans', 'id', 'id'], diagnostic_plan_progress: ['learningPlanProgress', 'id', 'id'],
    diagnostic_rechecks: ['gapRechecks', 'id', 'id'], lesson_progress: ['lessonProgress', 'lesson_id', 'lesson_id'],
    point_events: ['points', 'id', 'id'], game_settings: ['gameSettings', 'learner_id', 'learner_id'],
    exercise_results: ['classExerciseResults', 'id', 'id'], lesson_feedback: ['lessonFeedback', 'id', 'id'],
    error_events: ['crashRecords', 'id', 'id'], learner_access: ['adultsWithAccess', 'parent_id', 'adult_id'],
  }
  /** Out of the file on purpose — the same three decisions `exportCompleteness.test.ts` records, with the reasons there. */
  const EXCLUDED = {
    parental_consents: "the adult's own consent record (their email); readable by them directly",
    learner_invites: "an invitation to another adult; holds a third party's email",
    subscription_seats: 'the account’s billing allocation; says nothing about the child',
  }

  beforeAll(async () => {
    const { createClient } = await import('@/data/supabase/client')
    const { error } = await createClient().auth.setSession({ access_token: jwtFor(PARENT_A), refresh_token: 'r' })
    expect(error).toBeNull()
    const { getParentDashboard } = await import('@/data/repositories/progress')
    const { getLearnerExportExtras } = await import('@/data/repositories/exportData')
    const { buildExport } = await import('@/shared/ui/DataRights')
    // Exactly what the button does: the bundle the dashboard loaded, plus the extras fetched at click time.
    const d = (await getParentDashboard())!.find(e => e.learner.id === A.kid)!
    expect(d, 'the dashboard did not return the parent\'s own child').toBeDefined()
    file = buildExport(d.learner.display_name, { learner: d.learner, stats: d.stats, progress: d.progress, sessions: d.sessions },
      await getLearnerExportExtras(A.kid)) as Record<string, unknown>
    text = JSON.stringify(file)
  }, 60_000)

  it('says it is complete — nothing was refused or capped', () => {
    expect(file.completeness).toEqual({ complete: true, notes: [] })
  })

  it('holds the child\'s rows from every catalog table except the three named exclusions', async () => {
    const { direct, hanging } = await childTables()
    const all = [...direct, ...Object.keys(hanging)]
    expect(all.filter(t => !(t in SECTION) && !(t in EXCLUDED)), 'a child table with no section and no reason').toEqual([])
    for (const t of Object.keys(SECTION)) {
      const [key, dbCol, fileCol] = SECTION[t]
      const where = t === 'learners' ? `id = '${A.kid}'`
        : t in hanging ? `${hanging[t][0]}::text in (${[...A.sessions, ...A.plans].map(i => `'${i}'`).join(',')})`
        : `learner_id = '${A.kid}'`
      const inDb = (await q<{ v: string }>(`select ${dbCol}::text v from public.${t} where ${where}`)).map(r => r.v).sort()
      const section = file[key]
      const inFile = (section == null ? [] : Array.isArray(section) ? section : [section]).map(r => String((r as Record<string, unknown>)[fileCol])).sort()
      expect(inDb.length, `${t}: no row for the child in the database — the comparison would be empty`).toBeGreaterThan(0)
      expect(inFile, `${t} → "${key}": the file does not hold the child's rows`).toEqual(inDb)
    }
  })

  it('the parent\'s requests really run under RLS — the other family\'s rows are refused, their own are not', async () => {
    // ⚠️ Without this pair, the leak check below could be passing only because the app filters by learner_id,
    // with the stand-in quietly running as a role that sees everything.
    const { createClient } = await import('@/data/supabase/client')
    const read = async (kid: string) => (await createClient().from('learner_events').select('*').eq('learner_id', kid)).data
    expect(await read(A.kid)).toHaveLength(1)
    expect(await read(B.kid)).toEqual([])
    expect(await q(`select 1 from public.learner_events where learner_id = '${B.kid}'`), 'control: B has the row').toHaveLength(1)
  })

  it('holds nothing of the other family — and the same search finds this family\'s marker', () => {
    expect(text, 'control: the search cannot find the family\'s own marker, so its silence below means nothing').toContain(MARK_A)
    expect(text).toContain(A.kid)
    for (const leak of [MARK_B, B.kid, PARENT_B, KIDLOGIN_B, B.consent, ...B.sessions, ...B.plans])
      expect(text, `the export carries the other family's ${leak}`).not.toContain(leak)
  })
})

describe('withdrawal from the B3 link — the real route, the real functions', () => {
  let bBefore: Record<string, number> = {}
  let status = ''
  beforeAll(async () => {
    bBefore = await rowsAbout(B)
    resendCalls.length = 0
    const { POST } = await import('@/app/api/consent/respond/route')
    const r = await POST(new Request('http://x/api/consent/respond', { method: 'POST', headers: { 'x-forwarded-for': '10.7.0.3' },
      body: JSON.stringify({ t: token, action: 'withdraw' }) }))
    status = (await r.json()).status
  }, 60_000)

  it('answers withdrawn', () => { expect(status).toBe('withdrawn') })

  it('deletes every row about the child in every child table', async () => {
    const after = await rowsAbout(A)
    expect(Object.entries(after).filter(([, n]) => n > 0).map(([t, n]) => `${t}: ${n}`), 'still holds the child').toEqual([])
  })

  it('deletes the child\'s own login', async () => {
    expect(await q(`select 1 from auth.users where id = '${KIDLOGIN_A}'`)).toEqual([])
  })

  it('keeps the consent record, withdrawn, pointing at nobody', async () => {
    const [rec] = await q<{ state: string; learner_id: string | null; withdrawn_at: Date | null }>(
      `select state, learner_id, withdrawn_at from public.parental_consents where id = '${A.consent}'`)
    expect(rec, 'the consent record — the evidence — went with the child').toBeDefined()
    expect(rec.state).toBe('withdrawn')
    expect(rec.learner_id).toBeNull()
    expect(rec.withdrawn_at).not.toBeNull()
  })

  it('cancels the scheduled B3 — the id the grant stored — and nothing else', () => {
    expect(resendCalls.map(c => c.path)).toEqual([`/emails/${b3Stored}/cancel`])
  })

  it('leaves the other family exactly as it was', async () => {
    expect(await rowsAbout(B)).toEqual(bBefore)
    expect(Object.values(bBefore).every(n => n > 0)).toBe(true)
    expect(await q(`select 1 from auth.users where id = '${KIDLOGIN_B}'`)).toHaveLength(1)
    expect((await q<{ state: string }>(`select state from public.parental_consents where id = '${B.consent}'`))[0].state).toBe('granted')
  })
})
