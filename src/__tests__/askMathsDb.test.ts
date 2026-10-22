// @vitest-environment node
/**
 * Ask maths in the database (migration 20261021120000), driven in the repo's real schema as the roles a browser and
 * the server have. Every refusal is paired with the same call working for the right caller.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const VIEWER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const STRANGER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
let db: PGlite, L: string, YOUNG: string

beforeAll(async () => {
  ({ db } = await loadSchema())
  const users = [PARENT, CHILD, VIEWER, STRANGER].map((id, i) => `('${id}', 'u${i}@x.test', now())`).join(',')
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ${users}`)
  const consent = await grantedConsent(db, PARENT)
  const learner = async (band: string) => (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
    values ('Kid', 0, '${band}', '${PARENT}', '${consent}', '${FIXTURE_NOTICE}') returning id`)).rows[0].id
  L = await learner('9-11')
  YOUNG = await learner('6-8')
  await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${L}', '${CHILD}', 'self'), ('${L}', '${VIEWER}', 'viewer')`)
}, 120_000)

async function as(uid: string | null, sql: string, role = 'authenticated'): Promise<{ rows?: Record<string, unknown>[]; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try { return { rows: (await db.query<Record<string, unknown>>(sql)).rows } }
  catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}
const val = async (uid: string | null, sql: string, role?: string) => {
  const r = await as(uid, sql, role)
  if (r.err) return { err: r.err }
  return Object.values(r.rows![0])[0] as Record<string, unknown>
}
const set = (uid: string, learner: string, on: boolean, limit = 5, version: string | null = 'ask-maths-v1') =>
  val(uid, `select public.set_ask_maths('${learner}', ${on}, ${limit}, ${version === null ? 'null' : `'${version}'`})`)
const begin = (uid: string, learner: string, q = 'What is 3 x 4?') => val(uid, `select public.ask_maths_begin('${learner}', '${q}')`)
const forbidden = (r: { err?: string } | Record<string, unknown>) => expect((r as { err?: string }).err ?? 'ALLOWED').toMatch(/forbidden|permission denied/)
const entitle = (status: string) => db.exec(`insert into public.addon_subscriptions (account_id, product, status) values ('${PARENT}', 'ask_maths', '${status}')
  on conflict (account_id, product) do update set status = excluded.status`)

describe('the switch (set_ask_maths)', () => {
  it('only the owner sets it; the child, a viewer and a stranger are refused', async () => {
    forbidden(await set(CHILD, L, true))
    forbidden(await set(VIEWER, L, true))
    forbidden(await set(STRANGER, L, true))
    expect(await set(PARENT, L, false)).toEqual({ ok: true })
  })
  it('turning it ON needs the current disclosure version, and records who agreed and when', async () => {
    expect(await set(PARENT, L, true, 5, null)).toEqual({ ok: false, error: 'consent_required' })
    expect(await set(PARENT, L, true, 5, 'ask-maths-v0')).toEqual({ ok: false, error: 'consent_required' })
    expect(await set(PARENT, L, true, 3)).toEqual({ ok: true })
    const row = (await db.query<Record<string, unknown>>(`select enabled, daily_limit, consent_version, consented_by from public.ask_maths_settings where learner_id = '${L}'`)).rows[0]
    expect(row).toEqual({ enabled: true, daily_limit: 3, consent_version: 'ask-maths-v1', consented_by: PARENT })
  })
  it('a limit outside 1..20 is refused', async () => {
    expect(await set(PARENT, L, true, 0)).toEqual({ ok: false, error: 'bad_limit' })
    expect(await set(PARENT, L, true, 21)).toEqual({ ok: false, error: 'bad_limit' })
  })
  it('no browser writes the table directly — the family can read it', async () => {
    expect((await as(PARENT, `update public.ask_maths_settings set daily_limit = 20 where learner_id = '${L}'`)).err).toMatch(/permission denied/)
    expect((await as(CHILD, `insert into public.ask_maths_settings (learner_id, enabled) values ('${YOUNG}', false)`)).err).toMatch(/permission denied/)
    expect((await as(CHILD, `select enabled from public.ask_maths_settings where learner_id = '${L}'`)).rows).toEqual([{ enabled: true }])
    expect((await as(STRANGER, `select enabled from public.ask_maths_settings where learner_id = '${L}'`)).rows).toEqual([])
  })
})

describe('a question (ask_maths_begin)', () => {
  it('refused while the add-on is not paid for — an unknown or ended status counts as not paid', async () => {
    expect(await begin(CHILD, L)).toEqual({ ok: false, error: 'not_entitled' })
    await entitle('canceled'); expect(await begin(CHILD, L)).toEqual({ ok: false, error: 'not_entitled' })
    await entitle('something_new'); expect(await begin(CHILD, L)).toEqual({ ok: false, error: 'not_entitled' })
    await entitle('active')
  })
  it('the child asks: a pending row, the band, and how many are left today', async () => {
    const r = await begin(CHILD, L)
    expect(r).toMatchObject({ ok: true, band: '9-11', left: 2 })
    expect(typeof r.id).toBe('string')
  })
  it('one question at a time', async () => {
    expect(await begin(CHILD, L)).toEqual({ ok: false, error: 'busy' })
  })
  it('a stranger cannot ask for the child; anon cannot at all', async () => {
    forbidden(await begin(STRANGER, L))
    forbidden(await val(null, `select public.ask_maths_begin('${L}', 'x')`, 'anon'))
  })
  it('grades 3–8 only, and only when switched on', async () => {
    expect(await begin(PARENT, YOUNG)).toEqual({ ok: false, error: 'band' })
    await set(PARENT, L, false)
    await db.exec(`update public.ask_maths_questions set outcome = 'answered' where learner_id = '${L}'`)
    expect(await begin(CHILD, L)).toEqual({ ok: false, error: 'off' })
    await set(PARENT, L, true, 3)
  })
  it('the daily limit: failures on our side do not count, everything else does', async () => {
    await db.exec(`update public.ask_maths_questions set outcome = 'failed' where learner_id = '${L}'`)
    for (let i = 0; i < 3; i++) {
      expect(await begin(CHILD, L)).toMatchObject({ ok: true, left: 2 - i })
      await db.exec(`update public.ask_maths_questions set outcome = 'answered' where learner_id = '${L}' and outcome = 'pending'`)
    }
    expect(await begin(CHILD, L)).toEqual({ ok: false, error: 'limit' })
  })
  it('the question must be 1–300 characters', async () => {
    expect(await begin(CHILD, L, '   ')).toEqual({ ok: false, error: 'bad_question' })
    expect(await begin(CHILD, L, 'x'.repeat(301))).toEqual({ ok: false, error: 'bad_question' })
  })
})

describe('the outcome (ask_maths_finish) and forgetting', () => {
  let id: string
  beforeAll(async () => {
    await db.exec(`delete from public.ask_maths_questions where learner_id = '${L}'`)
    id = (await begin(CHILD, L, 'My name is Sam Lee at Oak School, what is 2+2?')).id as string
  })
  it('a browser cannot set an outcome; the server can, once', async () => {
    expect((await as(PARENT, `select public.ask_maths_finish('${id}', 'answered', '{}')`)).err).toMatch(/permission denied/)
    expect(await val(null, `select public.ask_maths_finish('${id}', 'personal', null)`, 'service_role')).toBe(true)
    expect(await val(null, `select public.ask_maths_finish('${id}', 'answered', '{}')`, 'service_role')).toBe(false)
  })
  it('a question with personal details is not kept', async () => {
    expect((await db.query(`select question, outcome from public.ask_maths_questions where id = '${id}'`)).rows).toEqual([{ question: null, outcome: 'personal' }])
  })
  it('an answered question keeps its lesson; any other outcome keeps none', async () => {
    await db.exec(`delete from public.ask_maths_questions where learner_id = '${L}'`)
    const a = (await begin(CHILD, L)).id
    await val(null, `select public.ask_maths_finish('${a}', 'answered', '{"els":{}}')`, 'service_role')
    const b = (await begin(CHILD, L)).id
    await val(null, `select public.ask_maths_finish('${b}', 'not_maths', '{"els":{}}')`, 'service_role')
    expect((await as(PARENT, `select outcome, script from public.ask_maths_questions where learner_id = '${L}' order by asked_at, outcome`)).rows)
      .toEqual(expect.arrayContaining([{ outcome: 'answered', script: { els: {} } }, { outcome: 'not_maths', script: null }]))
  })
  it('only the owner forgets them all, and the deletion is logged with counts only', async () => {
    forbidden(await val(CHILD, `select public.ask_maths_forget('${L}')`))
    forbidden(await val(VIEWER, `select public.ask_maths_forget('${L}')`))
    expect(await val(PARENT, `select public.ask_maths_forget('${L}')`)).toBe(2)
    expect((await db.query(`select count(*)::int n from public.ask_maths_questions where learner_id = '${L}'`)).rows).toEqual([{ n: 0 }])
    expect((await db.query(`select path, actor_id, row_counts from public.deletion_log where path = 'ask_maths_forget'`)).rows)
      .toEqual([{ path: 'ask_maths_forget', actor_id: PARENT, row_counts: { ask_maths_questions: 2 } }])
  })
  it('the add-on row: the account reads its own, nobody writes it from a browser', async () => {
    expect((await as(PARENT, `select status from public.addon_subscriptions`)).rows).toEqual([{ status: 'active' }])
    expect((await as(STRANGER, `select status from public.addon_subscriptions`)).rows).toEqual([])
    expect((await as(PARENT, `update public.addon_subscriptions set status = 'active'`)).err).toMatch(/permission denied/)
  })
})
