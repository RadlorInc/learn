// @vitest-environment node
/**
 * Class exercise results and the lock (migration 20260918140000), driven in the repo's real schema as the roles a
 * browser has. Every refusal is paired with the call that must work, made by the same role — "a locked exercise refuses
 * a result" and "no exercise accepts a result" are the same green without the positive twin.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent } from './_schema'

const TEACHER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OTHER_TEACHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const CHILD2 = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
let db: PGlite, L: string, L2: string, CLASS: string, OTHER_CLASS: string

beforeAll(async () => {
  ({ db } = await loadSchema())
  const users = [TEACHER, OTHER_TEACHER, CHILD, CHILD2].map((id, i) => `('${id}', 'u${i}@x.test', now())`).join(',')
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ${users}`)
  const ex = JSON.stringify([
    { id: 'open1', module: 'g5m2', level: 2, count: 3, seed: 1, open: true },
    { id: 'locked1', module: 'g5m2', level: 2, count: 3, seed: 2, open: false },
    { id: 'old1', module: 'g5m2', level: 2, count: 3, seed: 3 },           // made before locking existed
  ])
  CLASS = (await db.query<{ id: string }>(`insert into public.grades (name, grade, created_by, exercises) values ('5-A', 5, '${TEACHER}', '${ex}') returning id`)).rows[0].id
  OTHER_CLASS = (await db.query<{ id: string }>(`insert into public.grades (name, grade, created_by, exercises) values ('5-B', 5, '${TEACHER}', '${ex}') returning id`)).rows[0].id
  const learner = async (kid: string) => {
    const id = (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, grade_id, consent_id)
      values ('Kid', 0, '9-11', '${TEACHER}', '${CLASS}', '${await grantedConsent(db, TEACHER)}') returning id`)).rows[0].id
    await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${id}', '${kid}', 'self')`)
    return id
  }
  L = await learner(CHILD)
  L2 = await learner(CHILD2)
}, 120_000)

async function as(uid: string | null, sql: string, role = 'authenticated'): Promise<{ rows?: Record<string, unknown>[]; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try { return { rows: (await db.query<Record<string, unknown>>(sql)).rows } }
  catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}
const post = (uid: string, learner: string, exercise: string, klass = CLASS, outcomes = `'{first,second,worked}'`) =>
  as(uid, `insert into public.exercise_results (learner_id, class_id, exercise_id, outcomes) values ('${learner}', '${klass}', '${exercise}', ${outcomes})`)
const refused = (r: { err?: string }) => expect(r.err ?? 'ALLOWED').toMatch(/row-level security|permission denied|violates check/)

describe('exercise results', () => {
  it('the child posts a result for an OPEN exercise (and one made before locking existed)', async () => {
    expect((await post(CHILD, L, 'open1')).err).toBeUndefined()
    expect((await post(CHILD, L, 'old1')).err).toBeUndefined()
  })

  it('a LOCKED exercise refuses a result — even a hand-made request', async () => {
    // Specifically the policy — not a type error or a missing grant that would refuse the open one too.
    expect((await post(CHILD, L, 'locked1')).err ?? 'ALLOWED').toMatch(/row-level security/)
    expect((await post(CHILD, L, 'no-such-exercise')).err ?? 'ALLOWED').toMatch(/row-level security/)
  })

  it('a child cannot post for another child, into another class, or with a made-up outcome', async () => {
    refused(await post(CHILD, L2, 'open1'))
    refused(await post(CHILD, L, 'open1', OTHER_CLASS))
    refused(await post(CHILD, L, 'open1', CLASS, `'{perfect}'`))
    // Positive twin: CHILD2 CAN post for their own learner, so the first refusal was about ownership.
    expect((await post(CHILD2, L2, 'open1')).err).toBeUndefined()
  })

  it('only the child\'s own login posts — not the teacher, not anon', async () => {
    refused(await post(TEACHER, L, 'open1'))
    refused(await as(null, `insert into public.exercise_results (learner_id, class_id, exercise_id, outcomes) values ('${L}', '${CLASS}', 'open1', '{first}')`, 'anon'))
  })

  it('a result cannot be edited, deleted or back-dated', async () => {
    refused(await as(CHILD, `update public.exercise_results set outcomes = '{first,first,first}' where learner_id = '${L}'`))
    refused(await as(CHILD, `delete from public.exercise_results where learner_id = '${L}'`))
    refused(await as(CHILD, `insert into public.exercise_results (learner_id, class_id, exercise_id, outcomes, created_at) values ('${L}', '${CLASS}', 'open1', '{first}', '2020-01-01')`))
    const n = (await db.query<{ n: number }>(`select count(*)::int n from public.exercise_results`)).rows[0].n
    expect(n).toBe(3)                     // open1 + old1 by CHILD, open1 by CHILD2 — nothing else landed
  })

  it('the teacher reads their students\' results; another teacher sees none; a child sees only their own', async () => {
    const seen = async (uid: string) => ((await as(uid, `select learner_id from public.exercise_results order by 1`)).rows ?? []).map(r => r.learner_id)
    expect((await seen(TEACHER)).sort()).toEqual([L, L, L2].sort())
    expect(await seen(OTHER_TEACHER)).toEqual([])
    expect(await seen(CHILD)).toEqual([L, L])
  })
})
