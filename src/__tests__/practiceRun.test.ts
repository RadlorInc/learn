// @vitest-environment node
/**
 * `lesson_progress.run` — where a child is in a topic's practice (migration 20260925100000), driven in the repo's real
 * schema as the roles a browser has. It is a new field about a child, so the founder's rule 3 applies: behind the
 * consent gate, deleted with one child and with a whole-account withdrawal. (Export: withdrawExportE2e.test.ts.)
 * Every refusal is paired with the same caller, or the rightful one, succeeding — a function nobody can call, or a
 * deletion that deletes everything, would pass a refusal-only check.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', GATED = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const KID = '11111111-1111-4111-8111-111111111111', SIB = '22222222-2222-4222-8222-222222222222'
const KID3 = '33333333-3333-4333-8333-333333333333'
const RUN = `'{"asked": 7, "recent": ["q1", "q2"], "current": {"from": "g3m2-t1", "problem": {"text": "q2", "answer": 2, "picture": {"kind": "eq", "text": ""}}}, "review": null}'`
let db: PGlite, consent3 = ''

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values
    ('${PARENT}', 'p@x.test', now()), ('${CHILD}', 'kid@learner.adaptivelearn.invalid', now()),
    ('${OTHER}', 'o@x.test', now()), ('${GATED}', 'g@x.test', now())`)
  const c1 = await grantedConsent(db, PARENT)
  consent3 = await grantedConsent(db, GATED)
  await db.exec(`
    insert into public.learners (id, display_name, created_by, age_group, consent_id, attested_notice_version) values
      ('${KID}', 'Kid', '${PARENT}', '3-5', '${c1}', '${FIXTURE_NOTICE}'),
      ('${SIB}', 'Sib', '${PARENT}', '3-5', '${c1}', '${FIXTURE_NOTICE}');
    insert into public.learners (id, display_name, created_by, age_group, consent_id, attested_notice_version) values
      ('${KID3}', 'Three', '${GATED}', '3-5', '${consent3}', '${FIXTURE_NOTICE}');
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${KID}', '${CHILD}', 'self');`)
}, 120_000)

async function as(uid: string | null, sql: string, role = 'authenticated'): Promise<{ v?: unknown; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try {
    const r = await db.query<Record<string, unknown>>(sql)
    return { v: r.rows[0] ? Object.values(r.rows[0])[0] : undefined }
  } catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}
const save = (uid: string | null, kid: string, lesson = 'g3m2-t1', role = 'authenticated') =>
  as(uid, `select public.save_practice_run('${kid}', '${lesson}', ${RUN})`, role)
const runOf = async (kid: string, lesson = 'g3m2-t1') =>
  (await db.query<{ run: { asked: number } | null }>(`select run from public.lesson_progress where learner_id = '${kid}' and lesson_id = '${lesson}'`)).rows[0]?.run ?? null

describe('save_practice_run', () => {
  it('the child\'s own login and the parent save it and read it back — another family and anon cannot', async () => {
    expect((await save(CHILD, KID)).err).toBeUndefined()
    expect((await as(PARENT, `select run->>'asked' from public.lesson_progress where learner_id = '${KID}'`)).v).toBe('7')
    expect((await save(PARENT, KID, 'g3m2-t2')).err).toBeUndefined()
    expect((await save(OTHER, KID)).err ?? 'ALLOWED').toMatch(/forbidden/)
    expect((await as(OTHER, `select count(*)::int from public.lesson_progress where learner_id = '${KID}'`)).v).toBe(0)
    expect((await save(null, KID, 'g3m2-t1', 'anon')).err ?? 'ALLOWED').toMatch(/permission denied/)
  })

  it('writes only the run: it cannot move a level, mastery, done or a point', async () => {
    await as(CHILD, `select public.record_lesson_progress('${KID}', 'g3m2-t3', false, 2, 1, false, null, null)`)
    const pts = async () => (await db.query<{ n: number }>(`select count(*)::int as n from public.point_events where learner_id = '${KID}'`)).rows[0].n
    const before = await pts()
    expect((await save(CHILD, KID, 'g3m2-t3')).err).toBeUndefined()
    const row = (await db.query<Record<string, unknown>>(`select level, streak, mastered, done from public.lesson_progress where learner_id = '${KID}' and lesson_id = 'g3m2-t3'`)).rows[0]
    expect(row).toEqual({ level: 2, streak: 1, mastered: false, done: false })
    expect(await pts()).toBe(before)
    expect((await runOf(KID, 'g3m2-t3'))?.asked).toBe(7)
    // …and record_lesson_progress, the other writer, leaves the run alone.
    await as(CHILD, `select public.record_lesson_progress('${KID}', 'g3m2-t3', false, 3, 0, false, null, null)`)
    expect((await runOf(KID, 'g3m2-t3'))?.asked).toBe(7)
  })

  it('a browser still cannot write lesson_progress directly — not even the run', async () => {
    expect((await as(CHILD, `update public.lesson_progress set run = '{}' where learner_id = '${KID}'`)).err ?? 'ALLOWED').toMatch(/permission denied/)
    expect((await as(CHILD, `select count(*)::int from public.lesson_progress where learner_id = '${KID}'`)).v).toBeGreaterThan(0)   // positive control: the read is allowed
  })

  it('is behind the consent gate: refused once the account\'s consent is withdrawn', async () => {
    expect((await save(GATED, KID3)).err).toBeUndefined()          // positive control: consent granted → saved
    await db.exec(`update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = '${consent3}'`)
    expect((await save(GATED, KID3, 'g3m2-t2')).err ?? 'ALLOWED').toMatch(/consent/i)
    expect(await runOf(KID3, 'g3m2-t2')).toBeNull()
  })
})

describe('deleted with the child', () => {
  it('deleting one child removes that child\'s run and leaves the sibling\'s', async () => {
    expect((await save(PARENT, SIB)).err).toBeUndefined()
    expect(await runOf(SIB)).not.toBeNull()                          // positive control: the row existed
    expect((await as(PARENT, `select public.delete_learner('${KID}')`)).err).toBeUndefined()
    expect((await db.query(`select 1 from public.lesson_progress where learner_id = '${KID}'`)).rows).toEqual([])
    expect(await runOf(SIB)).not.toBeNull()
  })

  it('withdrawing the whole account\'s consent removes every child\'s run', async () => {
    expect(await runOf(SIB)).not.toBeNull()
    expect((await as(PARENT, `select public.withdraw_my_consent()`)).err).toBeUndefined()
    expect((await db.query(`select 1 from public.lesson_progress where learner_id = '${SIB}'`)).rows).toEqual([])
  })
})
