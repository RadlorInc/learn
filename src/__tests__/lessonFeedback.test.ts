// @vitest-environment node
/**
 * "Didn't get it?" feedback (migration 20260921053233), driven in the repo's real schema as the roles a browser has.
 * Every refusal is paired with the call that must work, made by the same role.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const STRANGER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
let db: PGlite, L: string

beforeAll(async () => {
  ({ db } = await loadSchema())
  const users = [PARENT, CHILD, STRANGER].map((id, i) => `('${id}', 'u${i}@x.test', now())`).join(',')
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ${users}`)
  L = (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id)
    values ('Kid', 0, '9-11', '${PARENT}', '${await grantedConsent(db, PARENT)}') returning id`)).rows[0].id
  await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${L}', '${CHILD}', 'self')`)
}, 120_000)

async function as(uid: string | null, sql: string, role = 'authenticated'): Promise<{ rows?: Record<string, unknown>[]; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try { return { rows: (await db.query<Record<string, unknown>>(sql)).rows } }
  catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}
const send = (uid: string | null, reasons = `'{fast,words}'`, role = 'authenticated', learner = L) =>
  as(uid, `insert into public.lesson_feedback (learner_id, lesson_id, screen, reasons) values ('${learner}', 'g5m1-t1', '3', ${reasons})`, role)

describe('lesson feedback', () => {
  it('the child’s own login and the parent can send it', async () => {
    expect((await send(CHILD)).err).toBeUndefined()
    expect((await send(PARENT, `'{broken}'`)).err).toBeUndefined()
  })

  it('a stranger cannot send for someone else’s child, and anon cannot send at all', async () => {
    expect((await send(STRANGER)).err ?? 'ALLOWED').toMatch(/row-level security/)
    expect((await send(null, `'{fast}'`, 'anon')).err ?? 'ALLOWED').toMatch(/permission denied/)
  })

  it('only the fixed reasons, at least one — there is no free text to send', async () => {
    expect((await send(CHILD, `'{i hate this}'`)).err ?? 'ALLOWED').toMatch(/violates check/)
    expect((await send(CHILD, `'{}'`)).err ?? 'ALLOWED').toMatch(/violates check/)
    expect((await as(CHILD, `insert into public.lesson_feedback (id, learner_id, lesson_id, screen, reasons)
      values (gen_random_uuid(), '${L}', 'g5m1-t1', '3', '{fast}')`)).err ?? 'ALLOWED').toMatch(/permission denied/)
  })

  it('the parent reads their child’s feedback (the export needs it); a stranger reads none', async () => {
    expect((await as(PARENT, 'select reasons from public.lesson_feedback')).rows).toHaveLength(2)
    expect((await as(STRANGER, 'select reasons from public.lesson_feedback')).rows).toHaveLength(0)
  })

  it('nobody can edit or delete a sent row', async () => {
    expect((await as(PARENT, `update public.lesson_feedback set reasons = '{math}'`)).err ?? 'ALLOWED').toMatch(/permission denied/)
    expect((await as(PARENT, 'delete from public.lesson_feedback')).err ?? 'ALLOWED').toMatch(/permission denied/)
  })
})
