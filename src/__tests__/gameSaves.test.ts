// @vitest-environment node
/**
 * The game save on the child's account (migration 20260919100000), driven in the repo's real schema as the roles a
 * browser has. Every refusal is paired with the same call working for the right account — "another family cannot
 * save" and "nobody can save" are the same green without the positive twin.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema } from './_schema'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const STRANGER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
let db: PGlite, L: string, OTHER: string, FRESH: string

beforeAll(async () => {
  ({ db } = await loadSchema())
  const users = [PARENT, CHILD, STRANGER].map((id, i) => `('${id}', 'u${i}@x.test', now())`).join(',')
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ${users}`)
  const learner = async (owner: string) => (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by)
    values ('Kid', 0, '9-11', '${owner}') returning id`)).rows[0].id
  L = await learner(PARENT)
  OTHER = await learner(STRANGER)
  FRESH = await learner(PARENT)          // a child with no save yet: the INSERT path, not the ON CONFLICT one
  // Creating a learner gives its creator an 'owner' access row (a trigger); the child's own login is added here.
  await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${L}', '${CHILD}', 'self')`)
}, 120_000)

async function as(uid: string | null, sql: string, role = 'authenticated'): Promise<{ rows?: Record<string, unknown>[]; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid ?? ''}', false)`)
  await db.exec(`set role ${role}`)
  try { return { rows: (await db.query<Record<string, unknown>>(sql)).rows } }
  catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}
// The statement PostgREST's upsert sends: every given column in the UPDATE too.
const upsert = (uid: string | null, learner: string, data: string, role = 'authenticated') =>
  as(uid, `insert into public.game_saves (learner_id, data) values ('${learner}', '${data}')
    on conflict (learner_id) do update set learner_id = excluded.learner_id, data = excluded.data`, role)
const read = async (uid: string, learner: string) => (await as(uid, `select data->>'n' n from public.game_saves where learner_id = '${learner}'`)).rows
const refused = (r: { err?: string }) => expect(r.err ?? 'ALLOWED').toMatch(/row-level security|permission denied|violates check/)

describe('game saves', () => {
  it('the child saves, and the save comes back on the account (a second save replaces the first)', async () => {
    expect((await upsert(CHILD, L, '{"n":"1"}')).err).toBeUndefined()
    expect((await upsert(CHILD, L, '{"n":"2"}')).err).toBeUndefined()
    expect(await read(CHILD, L)).toEqual([{ n: '2' }])
  })

  it('the parent who owns the child can read and save it too', async () => {
    expect(await read(PARENT, L)).toEqual([{ n: '2' }])
    expect((await upsert(PARENT, L, '{"n":"3"}')).err).toBeUndefined()
  })

  it('another family can neither read nor overwrite it — while they CAN save their own', async () => {
    expect(await read(STRANGER, L)).toEqual([])
    refused(await upsert(STRANGER, L, '{"n":"hacked"}'))
    refused(await as(STRANGER, `update public.game_saves set data = '{"n":"hacked"}' where learner_id = '${L}' returning 1`).then((r) => r.rows?.length ? { err: undefined } : { err: 'row-level security: 0 rows' }))
    // An UPDATE with no WHERE reads no column, so the read policy does not apply — only the update policy stands here.
    await as(STRANGER, `update public.game_saves set data = '{"n":"hacked"}'`)
    expect((await upsert(STRANGER, OTHER, '{"n":"mine"}')).err).toBeUndefined()
    expect(await read(PARENT, L)).toEqual([{ n: '3' }])
  })

  it('another family cannot start a FIRST save for a child — the parent can', async () => {
    refused(await upsert(STRANGER, FRESH, '{"n":"planted"}'))
    // A plain INSERT too: an upsert is ALSO held back by the read policy, so it cannot see the insert policy alone.
    refused(await as(STRANGER, `insert into public.game_saves (learner_id, data) values ('${FRESH}', '{"n":"planted"}')`))
    expect(await read(PARENT, FRESH)).toEqual([])
    expect((await upsert(PARENT, FRESH, '{"n":"first"}')).err).toBeUndefined()
  })

  it('a save cannot be moved onto a child the account has no access to', async () => {
    refused(await as(CHILD, `update public.game_saves set learner_id = '${OTHER}' where learner_id = '${L}'`))
  })

  it('anon reaches nothing, nobody deletes from a browser, and the save must be an object under 2 MB', async () => {
    refused(await as(null, `select * from public.game_saves`, 'anon'))
    refused(await upsert(null, L, '{"n":"x"}', 'anon'))
    refused(await as(CHILD, `delete from public.game_saves where learner_id = '${L}'`))
    refused(await upsert(CHILD, L, '[1,2]'))
    refused(await upsert(CHILD, L, JSON.stringify({ big: 'x'.repeat(2_000_001) })))
    expect(await read(PARENT, L)).toEqual([{ n: '3' }])
  })

  it('the save goes when the child is deleted', async () => {
    await db.exec(`delete from public.learners where id = '${OTHER}'`)
    expect((await db.query(`select 1 from public.game_saves where learner_id = '${OTHER}'`)).rows).toEqual([])
  })
})
