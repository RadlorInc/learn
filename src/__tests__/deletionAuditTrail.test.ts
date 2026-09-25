// @vitest-environment node
/**
 * FND-15 — EVERY DELETION OF A CHILD'S DATA OR AN ACCOUNT LEAVES ONE RECORD: WHEN, WHICH PATH, WHO, WHICH
 * IDS, HOW MANY ROWS. docs/legal/READINESS.md "To build": "a record of who deleted which child's data, and
 * when" — decided after ~1,440 event rows left the database around 17 Sep with no record (docs/legal/04 §7).
 *
 * What it checks, and no more:
 *   · each path (dashboard delete, one-child withdrawal, account withdrawal, close account, the unconfirmed-user
 *     prune, the three retention jobs) writes EXACTLY one row per child / account / run, with the counts written
 *     out below by hand — never read back from the function that produced them;
 *   · the row survives the deletion it records (the account it names no longer exists);
 *   · the deletion itself still deletes what it did (the same zero-after checks consentDeletion.test.ts makes);
 *   · the log holds ids and numbers only (the column list is written out here) and nothing on the API can
 *     read, write or erase it — while service_role CAN read it (the positive twin of the refusals).
 * It does NOT check deletions made outside these functions (operator SQL, an owner's direct RLS delete of a
 * learners row) — the migration says so; nothing records those.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, applyFrom, legacyChild, grantedConsent, CONSENT_ONCE, FIXTURE_NOTICE } from './_schema'

const DOC06 = ['learners', 'learner_access', 'lesson_progress', 'point_events', 'learner_stats',
  'learner_events', 'lesson_feedback', 'game_settings', 'error_events'] as const

const P = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'        // deletes one child from the dashboard
const W = 'a1a1a1a1-aaaa-4aaa-8aaa-aaaaaaaaaaaa'        // withdraws for every child
const C = 'a2a2a2a2-aaaa-4aaa-8aaa-aaaaaaaaaaaa'        // closes the account
const L = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'        // a pre-consent-once family (per-child link)
const OTHER = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'    // a family nobody touches
const UNCONF = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'   // never confirmed, 5 days old
const KIDLOGIN = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

let db: PGlite
const q = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows
const as = async (role: string, uid: string | null, sql: string) => {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try { await db.query(sql); return null } catch (e) { return (e as Error).message } finally {
    await db.exec(`reset role; select set_config('test.uid', '', false)`)
  }
}

type Row = { path: string; actor_kind: string; actor_id: string | null; account_id: string | null; learner_ids: string[]; row_counts: Record<string, number> }
const logSince = async (mark: number) => q<Row>(`select path, actor_kind, actor_id, account_id, learner_ids, row_counts
  from public.deletion_log order by at, id offset ${mark}`)
const logCount = async () => Number((await q<{ n: number }>(`select count(*)::int n from public.deletion_log`))[0].n)

const consentOf: Record<string, string> = {}
async function child(name: string, parent: string, login: string | null = null) {
  const consent = consentOf[parent] ??= await grantedConsent(db, parent)
  const [{ id }] = await q<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
    values ('${name}', 0, '6-8', '${parent}', '${consent}', '${FIXTURE_NOTICE}') returning id`)
  await seedRows(id, parent, login)
  return id
}
/** One row in every table document 06 names — the same seed consentDeletion.test.ts uses. */
async function seedRows(id: string, parent: string, login: string | null) {
  await db.exec(`
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${id}', '${parent}', 'owner') on conflict do nothing;
    insert into public.lesson_progress (learner_id, lesson_id, done) values ('${id}', 'g3m1-t1', true);
    insert into public.point_events (learner_id, reason, points) values ('${id}', 'problem', 5);
    insert into public.learner_stats (learner_id) values ('${id}') on conflict do nothing;
    insert into public.learner_events (learner_id, event) values ('${id}', 'session_start');
    insert into public.lesson_feedback (learner_id, lesson_id, screen, reasons) values ('${id}', 'g3m1-t1', '2', array['picture']);
    insert into public.game_settings (learner_id) values ('${id}') on conflict do nothing;
    insert into public.error_events (source, message, learner_id) values ('client', 'boom', '${id}');`)
  if (login) await db.exec(`
    insert into auth.users (id, email, email_confirmed_at) values ('${login}', '${login}@learner.adaptivelearn.invalid', now());
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${id}', '${login}', 'self');`)
}
const countsFor = async (learner: string) => Object.fromEntries(await Promise.all(DOC06.map(async t =>
  [t, Number((await q<{ n: number }>(`select count(*)::int n from public.${t} where ${t === 'learners' ? 'id' : 'learner_id'} = '${learner}'`))[0].n)])))
const ZERO = Object.fromEntries(DOC06.map(t => [t, 0]))
/** Hand-written: what one seeded child's deletion must count (learner_access = owner row, + the 'self' row if a login). */
const SEEDED = (login: boolean) => ({ learners: 1, learner_access: login ? 2 : 1, lesson_progress: 1, point_events: 1,
  learner_stats: 1, learner_events: 1, lesson_feedback: 1, game_settings: 1, error_events: 1, child_logins: login ? 1 : 0 })

let legacy: { id: string; token: string }
beforeAll(async () => {
  // Up to consent-once, a legacy per-child family, then every migration from consent-once on — this one included.
  ({ db } = await loadSchema({ before: CONSENT_ONCE }))
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values
      ('${P}', 'p@x.test', now()), ('${W}', 'w@x.test', now()), ('${C}', 'c@x.test', now()),
      ('${L}', 'l@x.test', now()), ('${OTHER}', 'o@x.test', now());
    insert into public.profiles (id, role) values ('${P}', 'parent'), ('${W}', 'parent'), ('${C}', 'parent'), ('${L}', 'parent'), ('${OTHER}', 'parent')
      on conflict (id) do update set role = excluded.role;`)
  legacy = await legacyChild(db, L, 'Legacy')
  await seedRows(legacy.id, L, null)
  // The fixture's cron.schedule discards its command; keep it this once so the purge job's REAL command can be run.
  await db.exec(`create or replace function cron.schedule(n text, s text, c text) returns bigint language sql as
    $f$ delete from cron.job where jobname = n; insert into cron.job (jobid, jobname, schedule, command) values (1, n, s, c); select 1::bigint $f$`)
  await applyFrom(db, CONSENT_ONCE)
}, 180_000)

describe('the log exists, and holds ids and numbers only', () => {
  it('public.deletion_log exists (on main there is nowhere a deletion could be recorded)', async () => {
    expect(await q(`select to_regclass('public.deletion_log')::text r`)).toEqual([{ r: 'deletion_log' }])
  })

  it('its columns are exactly these — no name, email, answer or free text', async () => {
    const cols = await q<{ c: string; t: string }>(`select column_name c, data_type t from information_schema.columns
      where table_schema = 'public' and table_name = 'deletion_log' order by ordinal_position`)
    expect(cols).toEqual([
      { c: 'id', t: 'uuid' }, { c: 'at', t: 'timestamp with time zone' }, { c: 'path', t: 'text' },
      { c: 'actor_kind', t: 'text' }, { c: 'actor_id', t: 'uuid' }, { c: 'account_id', t: 'uuid' },
      { c: 'learner_ids', t: 'ARRAY' }, { c: 'row_counts', t: 'jsonb' }])
  })

  it('row_counts refuses anything but numbers, and path refuses anything but the six paths', async () => {
    const bad = async (sql: string) => db.query(sql).then(() => 'ACCEPTED', e => (e as Error).message)
    expect(await bad(`insert into public.deletion_log (path, actor_kind, row_counts) values ('retention', 'system', '{"learners": "Alice"}')`))
      .toMatch(/deletion_log_counts_only_numbers/)
    expect(await bad(`insert into public.deletion_log (path, actor_kind, row_counts) values ('because I said so', 'system', '{}')`))
      .toMatch(/check constraint/)
    // Positive control: a well-formed row IS accepted by the same statement shape (then removed).
    expect(await bad(`insert into public.deletion_log (path, actor_kind, row_counts) values ('retention', 'system', '{"learners": 1}')`)).toBe('ACCEPTED')
    await db.exec(`delete from public.deletion_log`)
  })
})

describe('each deletion path writes exactly one row, and still deletes what it did', () => {
  it('dashboard "Delete <name>\'s profile" → one delete_child row, signed-in parent as actor', async () => {
    const kid = await child('Deleted', P, KIDLOGIN)
    const mark = await logCount()
    expect(await as('authenticated', P, `select public.delete_learner('${kid}')`)).toBeNull()
    expect(await countsFor(kid)).toEqual(ZERO)
    expect(await q(`select 1 from auth.users where id = '${KIDLOGIN}'`)).toEqual([])
    const rows = await logSince(mark)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ path: 'delete_child', actor_kind: 'user', actor_id: P, account_id: P, learner_ids: [kid] })
    expect(rows[0].row_counts).toMatchObject(SEEDED(true))
  })

  it('one-child withdrawal link (pre-consent-once) → one withdraw_consent_child row, server as actor', async () => {
    const mark = await logCount()
    const [{ s }] = await q<{ s: string }>(`select public.consent_withdraw('${legacy.token}') s`)
    expect(s).toBe('withdrawn')
    expect(await countsFor(legacy.id)).toEqual(ZERO)
    const rows = await logSince(mark)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ path: 'withdraw_consent_child', actor_kind: 'service', actor_id: null, account_id: L, learner_ids: [legacy.id] })
    expect(rows[0].row_counts).toMatchObject(SEEDED(false))
  })

  it('Account → Withdraw for all children → one withdraw_consent_account row PER child; the other family untouched', async () => {
    const a = await child('A', W), b = await child('B', W), keep = await child('Kept', OTHER)
    const mark = await logCount()
    expect(await as('authenticated', W, `select public.withdraw_my_consent()`)).toBeNull()
    expect(await countsFor(a)).toEqual(ZERO)
    expect(await countsFor(b)).toEqual(ZERO)
    expect(Object.values(await countsFor(keep)).every(n => Number(n) > 0)).toBe(true)
    const rows = await logSince(mark)
    expect(rows).toHaveLength(2)
    expect(rows.map(r => r.learner_ids[0]).sort()).toEqual([a, b].sort())
    for (const r of rows) {
      expect(r).toMatchObject({ path: 'withdraw_consent_account', actor_kind: 'user', actor_id: W, account_id: W })
      expect(r.row_counts).toMatchObject(SEEDED(false))
    }
  })

  it('Account → Close your account → one close_account row, and the row outlives the account it names', async () => {
    const a = await child('CA', C), b = await child('CB', C)
    const mark = await logCount()
    const now = Math.floor(Date.now() / 1000)
    await db.exec(`select set_config('test.jwt', '${JSON.stringify({ email: 'c@x.test', iat: now, amr: [{ method: 'password', timestamp: now }] })}', false)`)
    expect(await as('authenticated', C, `select public.delete_my_account('c@x.test')`)).toBeNull()
    await db.exec(`select set_config('test.jwt', '', false)`)
    expect(await q(`select 1 from auth.users where id = '${C}'`), 'the account was not deleted').toEqual([])
    expect(await countsFor(a)).toEqual(ZERO)
    const rows = await logSince(mark)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ path: 'close_account', actor_kind: 'user', actor_id: C, account_id: C })
    expect([...rows[0].learner_ids].sort()).toEqual([a, b].sort())
    expect(rows[0].row_counts).toMatchObject({ learners: 2, learner_events: 2, error_events: 2, learner_stats: 2, child_logins: 0 })
  })

  it('the unconfirmed-user prune → one prune_unconfirmed row per run that deleted something, none when it deleted nothing', async () => {
    await db.exec(`insert into auth.users (id, email, created_at) values ('${UNCONF}', 'u@x.test', now() - interval '5 days')`)
    const mark = await logCount()
    await db.exec(`select public.prune_unconfirmed_users()`)
    expect(await q(`select 1 from auth.users where id = '${UNCONF}'`)).toEqual([])
    expect(await logSince(mark)).toEqual([{ path: 'prune_unconfirmed', actor_kind: 'system', actor_id: null, account_id: null, learner_ids: [], row_counts: { 'auth.users': 1 } }])
    await db.exec(`select public.prune_unconfirmed_users()`)
    expect(await logCount()).toBe(mark + 1)
  })

  it('the three retention jobs → one retention row each, counting what aged out; in-date rows kept', async () => {
    const kid = await child('Old rows', OTHER)
    await db.exec(`
      insert into public.learner_events (learner_id, event, created_at) values ('${kid}', 'old', now() - interval '91 days'), ('${kid}', 'old', now() - interval '100 days');
      insert into public.error_events (source, message, learner_id, at) values ('client', 'old', '${kid}', now() - interval '91 days');
      insert into public.diagnostic_sessions (learner_id, band) values ('${kid}', '6-8');
      insert into public.diagnostic_items (session_id, skill_id, correct, created_at)
        select id, 's', true, now() - interval '91 days' from public.diagnostic_sessions where learner_id = '${kid}';`)
    const [{ command }] = await q<{ command: string }>(`select command from cron.job where jobname = 'purge-old-learner-events'`)
    const mark = await logCount()
    await db.exec(command)
    await db.exec(`select public.prune_error_events()`)
    await db.exec(`select public.prune_diagnostic_items()`)
    expect((await logSince(mark)).map(r => [r.path, r.actor_kind, r.row_counts])).toEqual([
      ['retention', 'system', { learner_events: 2 }],
      ['retention', 'system', { error_events: 1 }],
      ['retention', 'system', { diagnostic_items: 1 }]])
    // In-date rows are untouched: the seed's own event and crash row are still there.
    expect(await countsFor(kid)).toMatchObject({ learner_events: 1, error_events: 1 })
  })
})

describe('nothing on the API can reach the log — and the server can read it', () => {
  it.each(['anon', 'authenticated'])('%s cannot select, insert or delete', async role => {
    for (const sql of [`select * from public.deletion_log`,
      `insert into public.deletion_log (path, actor_kind, row_counts) values ('retention', 'system', '{}')`,
      `delete from public.deletion_log`])
      expect(await as(role, P, sql), `${role}: ${sql}`).toMatch(/permission denied/)
  })
  it('service_role can read it, and cannot write or erase it', async () => {
    expect(await as('service_role', null, `select count(*) from public.deletion_log`)).toBeNull()
    expect(await as('service_role', null, `delete from public.deletion_log`)).toMatch(/permission denied/)
    expect(await as('service_role', null, `insert into public.deletion_log (path, actor_kind, row_counts) values ('retention', 'system', '{}')`)).toMatch(/permission denied/)
  })
})
