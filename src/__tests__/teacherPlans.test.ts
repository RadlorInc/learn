// @vitest-environment node
/**
 * Who has paid (migration 20260918120000), driven in the repo's real schema (baseline + every migration) as the roles a
 * browser actually has. The property that matters is that NO CLIENT CAN WRITE IT — a teacher who could mark themselves
 * paid would unlock modules for their class — and it is asserted with its positive twin: the same callers CAN read
 * exactly the rows the app needs (a teacher their own; a child the adult who created them).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const PAID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'      // a paid teacher
const FREE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'      // a free teacher (no row)
const KID_OF_PAID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const KID_OF_FREE = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const STRANGER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
let db: PGlite

beforeAll(async () => {
  ({ db } = await loadSchema())
  const users = [PAID, FREE, KID_OF_PAID, KID_OF_FREE, STRANGER].map((id, i) => `('${id}', 'u${i}@x.test', now())`).join(',')
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ${users}`)
  await db.exec(`insert into public.teacher_plans (teacher_id, paid) values ('${PAID}', true)`)
  for (const [teacher, kid] of [[PAID, KID_OF_PAID], [FREE, KID_OF_FREE]]) {
    const l = (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
      values ('Kid', 0, '9-11', '${teacher}', '${await grantedConsent(db, teacher)}', '${FIXTURE_NOTICE}') returning id`)).rows[0].id
    await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${l}', '${kid}', 'self')`)
  }
}, 120_000)

async function as(uid: string | null, sql: string, role = 'authenticated'): Promise<{ rows?: Record<string, unknown>[]; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try { return { rows: (await db.query<Record<string, unknown>>(sql)).rows } }
  catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}
const paidSeenBy = async (uid: string, teacher: string) =>
  (await as(uid, `select paid from public.teacher_plans where teacher_id = '${teacher}'`)).rows?.map(r => r.paid)

describe('teacher_plans', () => {
  it('NO client can write it: a free teacher cannot make themselves paid, a paid one cannot edit their row', async () => {
    const tries = [
      await as(FREE, `insert into public.teacher_plans (teacher_id, paid) values ('${FREE}', true)`),
      await as(PAID, `update public.teacher_plans set paid = true where teacher_id = '${PAID}'`),
      await as(PAID, `delete from public.teacher_plans where teacher_id = '${PAID}'`),
      await as(null, `insert into public.teacher_plans (teacher_id, paid) values ('${FREE}', true)`, 'anon'),
    ]
    for (const t of tries) expect(t.err ?? 'ALLOWED').toMatch(/permission denied/)
    // And nothing changed.
    const all = (await db.query<{ teacher_id: string; paid: boolean }>(`select teacher_id, paid from public.teacher_plans order by 1`)).rows
    expect(all).toEqual([{ teacher_id: PAID, paid: true }])
  })

  it('a teacher reads their OWN row (positive twin of the refusals above), and a free teacher has none', async () => {
    expect(await paidSeenBy(PAID, PAID)).toEqual([true])
    expect(await paidSeenBy(FREE, FREE)).toEqual([])
  })

  it("a signed-in child reads the row of the adult who CREATED them — and no other teacher's", async () => {
    expect(await paidSeenBy(KID_OF_PAID, PAID)).toEqual([true])
    expect(await paidSeenBy(KID_OF_FREE, PAID)).toEqual([])      // a free teacher's child cannot borrow the paid row
  })

  it('a stranger and anon see nothing', async () => {
    expect(await paidSeenBy(STRANGER, PAID)).toEqual([])
    expect((await as(null, `select paid from public.teacher_plans`, 'anon')).err ?? 'ALLOWED').toMatch(/permission denied/)
  })

  it('a class keeps its exercises as a list — anything else is refused', async () => {
    const g = (await db.query<{ id: string }>(`insert into public.grades (name, grade, created_by) values ('5-A', 5, '${FREE}') returning id`)).rows[0].id
    expect((await as(FREE, `update public.grades set exercises = '[{"id":"x","module":"g5m2","level":2,"count":10,"seed":7}]' where id = '${g}' returning id`)).rows).toHaveLength(1)
    expect((await as(FREE, `update public.grades set exercises = '{"not":"a list"}' where id = '${g}'`)).err ?? 'ALLOWED').toMatch(/grades_exercises_is_array/)
  })
})
