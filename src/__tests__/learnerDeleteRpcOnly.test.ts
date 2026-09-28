// @vitest-environment node
/**
 * A learner row is deleted only through `delete_learner` (20260928160000): a signed-in client cannot
 * delete a `learners` row directly, not even its owner, and `delete_learner` still does the whole job —
 * the row, the child's own login, and a `deletion_log` entry.
 *
 * Both halves, driven as the real caller (`authenticated` with the owner's uid): the direct delete is
 * refused AND the row survives it; the RPC succeeds; the owner can still read and update the row.
 * Built on the real schema (baseline + every migration) in PGlite. Expected values written out here.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const KIDLOGIN = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
let db: PGlite

const q = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows
/** Runs `sql` as the signed-in owner; the error message, or null when it succeeded. */
const asOwner = async (sql: string): Promise<string | null> => {
  await db.exec(`select set_config('test.uid', '${OWNER}', false)`)
  await db.exec('set role authenticated')
  try { await db.query(sql); return null } catch (e) { return (e as Error).message } finally { await db.exec('reset role') }
}

async function child(name: string, withLogin: boolean): Promise<string> {
  const consent = await grantedConsent(db, OWNER)
  const [{ id }] = await q<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
    values ('${name}', 0, '6-8', '${OWNER}', '${consent}', '${FIXTURE_NOTICE}') returning id`)
  await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${id}', '${OWNER}', 'owner') on conflict do nothing`)
  if (withLogin) await db.exec(`
    insert into auth.users (id, email, email_confirmed_at) values ('${KIDLOGIN}', 'kid@learner.adaptivelearn.invalid', now());
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${id}', '${KIDLOGIN}', 'self');`)
  return id
}
/** Rows the owner sees, under RLS. */
const ownerSees = async (sql: string) => {
  await db.exec(`select set_config('test.uid', '${OWNER}', false)`)
  await db.exec('set role authenticated')
  try { return (await db.query(sql)).rows } finally { await db.exec('reset role') }
}
const exists = async (id: string) => (await q(`select 1 from public.learners where id = '${id}'`)).length === 1

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${OWNER}', 'o@x.test', now())`)
}, 120_000)

describe('a signed-in client cannot delete a learners row directly', () => {
  it("the owner's direct delete is refused, and the row is still there", async () => {
    const id = await child('Direct', false)
    expect(String(await asOwner(`delete from public.learners where id = '${id}'`)), "the direct delete was not refused").toMatch(/permission denied/)
    expect(await exists(id)).toBe(true)
  })
})

describe('delete_learner still deletes, completely (the paired half)', () => {
  it('the owner deletes through the RPC: row gone, child login gone, one deletion_log entry', async () => {
    const id = await child('ViaRpc', true)
    const logBefore = (await q(`select 1 from public.deletion_log where '${id}' = any(learner_ids)`)).length
    expect(await asOwner(`select public.delete_learner('${id}')`)).toBeNull()
    expect(await exists(id)).toBe(false)
    expect(await q(`select 1 from auth.users where id = '${KIDLOGIN}'`), "the child's own login survived").toEqual([])
    expect((await q(`select 1 from public.deletion_log where '${id}' = any(learner_ids)`)).length - logBefore).toBe(1)
  })

  it('the owner still reads and updates the row', async () => {
    const id = await child('Kept', false)
    expect(await asOwner(`update public.learners set display_name = 'Renamed' where id = '${id}'`)).toBeNull()
    expect(await q(`select display_name from public.learners where id = '${id}'`)).toEqual([{ display_name: 'Renamed' }])
    expect(await ownerSees(`select display_name from public.learners where id = '${id}'`)).toEqual([{ display_name: 'Renamed' }])
  })
})
