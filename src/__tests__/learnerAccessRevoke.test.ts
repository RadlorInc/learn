// @vitest-environment node
/**
 * SEC-02 — A VIEWER'S ACCESS TO A CHILD CAN BE TAKEN AWAY, AND STAYS AWAY.
 *
 * Before 20260926100000 every DELETE on `learner_access` by a signed-in user failed with 42P17 (the delete
 * policy read `learners`, whose select policy reads `learner_access` again), so neither the owner nor the
 * viewer's own "remove myself" could end a viewer's access. And a viewer removed by hand could set their
 * still-valid ACCEPTED invite back to 'pending' and self-grant again.
 *
 * Every refusal here is paired with the write that must still SUCCEED: a policy that refused every delete
 * would pass a refusal-only suite and is exactly the outage this finding was.
 * The queries are the ones the app sends: `removeMyselfFromLearner` (learners.ts) and `acceptInvite` (invites.ts).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const VIEWER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const STRANGER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const FRESH = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const EMAIL: Record<string, string> = { [OWNER]: 'o@x.test', [VIEWER]: 'v@x.test', [CHILD]: 'kid@learner.x.test', [STRANGER]: 's@x.test', [FRESH]: 'f@x.test' }

let db: PGlite
let consent = ''

async function as<T = Record<string, unknown>>(uid: string, sql: string): Promise<{ rows?: T[]; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid}', false), set_config('test.jwt', '{"email":"${EMAIL[uid]}"}', false)`)
  await db.exec('set role authenticated')
  try { return { rows: (await db.query<T>(sql)).rows } } catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}

/** A child with an owner, an invited viewer (invite ACCEPTED, still inside its 7 days), a child login, and one progress row. */
async function family(): Promise<string> {
  const kid = (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
    values ('Ana', 0, '9-11', '${OWNER}', '${consent}', '${FIXTURE_NOTICE}') returning id`)).rows[0].id
  await db.exec(`
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${kid}', '${OWNER}', 'owner') on conflict do nothing;
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${kid}', '${VIEWER}', 'viewer'), ('${kid}', '${CHILD}', 'self');
    insert into public.learner_invites (learner_id, invited_by, invited_email, status, expires_at)
      values ('${kid}', '${OWNER}', 'v@x.test', 'accepted', now() + interval '6 days');
    insert into public.lesson_progress (learner_id, lesson_id, done, level, streak, mastered) values ('${kid}', 'g3m1-t1', true, 1, 0, false);`)
  return kid
}

/** Read as the table owner — what is really stored, whatever the caller was allowed to see. */
const rowsFor = async (kid: string) => (await db.query<{ parent_id: string }>(
  `select parent_id from public.learner_access where learner_id = '${kid}' order by parent_id`)).rows.map(r => r.parent_id)
const viewerSees = async (kid: string) =>
  (await as<{ n: number }>(VIEWER, `select count(*)::int as n from public.lesson_progress where learner_id = '${kid}'`)).rows?.[0].n

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ${Object.entries(EMAIL).map(([id, e]) => `('${id}', '${e}', now())`).join(', ')}`)
  consent = await grantedConsent(db, OWNER)
}, 120_000)

describe('SEC-02: revoking a viewer', () => {
  it('the owner CAN remove a viewer, and the viewer then reads nothing', async () => {
    const kid = await family()
    expect(await viewerSees(kid), 'positive control: the viewer reads the child before removal').toBe(1)
    const r = await as(OWNER, `delete from public.learner_access where learner_id = '${kid}' and parent_id = '${VIEWER}'`)
    expect(r.err).toBeUndefined()
    expect(await rowsFor(kid)).toEqual([OWNER, CHILD].sort())
    expect(await viewerSees(kid)).toBe(0)
  })

  it('a viewer CAN remove themselves (removeMyselfFromLearner)', async () => {
    const kid = await family()
    const r = await as(VIEWER, `delete from public.learner_access where learner_id = '${kid}' and parent_id = '${VIEWER}'`)
    expect(r.err).toBeUndefined()
    expect(await rowsFor(kid)).toEqual([OWNER, CHILD].sort())
  })

  it('a stranger, the viewer and the child login delete nobody else\'s row, and the child cannot remove their own login', async () => {
    const kid = await family()
    const all = [OWNER, VIEWER, CHILD].sort()
    for (const [who, target] of [[STRANGER, VIEWER], [STRANGER, OWNER], [VIEWER, OWNER], [VIEWER, CHILD], [CHILD, VIEWER], [CHILD, OWNER], [CHILD, CHILD]]) {
      await as(who, `delete from public.learner_access where learner_id = '${kid}' and parent_id = '${target}'`)
      expect(await rowsFor(kid), `${EMAIL[who]} deleting ${EMAIL[target]}'s row`).toEqual(all)
    }
  })

  it('the owner cannot delete their own owner row', async () => {
    const kid = await family()
    await as(OWNER, `delete from public.learner_access where learner_id = '${kid}' and parent_id = '${OWNER}'`)
    expect(await rowsFor(kid)).toContain(OWNER)
  })

  it('a removed viewer cannot re-open their accepted invite and self-grant again', async () => {
    const kid = await family()
    // removed by hand (as the table owner), so this case measures the replay alone, not the delete policy
    await db.exec(`delete from public.learner_access where learner_id = '${kid}' and parent_id = '${VIEWER}'`)
    const reopen = await as(VIEWER, `update public.learner_invites set status = 'pending' where learner_id = '${kid}' and invited_email = 'v@x.test'`)
    expect(reopen.err ?? 'ALLOWED').toContain('invite status can only move forward')
    const [{ status }] = (await db.query<{ status: string }>(`select status::text from public.learner_invites where learner_id = '${kid}'`)).rows
    expect(status).toBe('accepted')
    await as(VIEWER, `insert into public.learner_access (learner_id, parent_id, access_role) values ('${kid}', '${VIEWER}', 'viewer')`)
    expect(await rowsFor(kid)).not.toContain(VIEWER)
    expect(await viewerSees(kid)).toBe(0)
  })

  it('a FRESH invite is still accepted the way acceptInvite does it (grant, then flip to accepted)', async () => {
    const kid = await family()
    const sent = await as(OWNER, `insert into public.learner_invites (learner_id, invited_by, invited_email, status, expires_at)
      values ('${kid}', '${OWNER}', 'f@x.test', 'pending', now() + interval '7 days') returning id`)
    expect(sent.err).toBeUndefined()
    const id = (sent.rows as { id: string }[])[0].id
    const grant = await as(FRESH, `insert into public.learner_access (learner_id, parent_id, access_role) values ('${kid}', '${FRESH}', 'viewer')
      on conflict (learner_id, parent_id) do nothing`)
    expect(grant.err).toBeUndefined()
    const flip = await as(FRESH, `update public.learner_invites set status = 'accepted' where id = '${id}' returning status::text`)
    expect(flip.rows).toEqual([{ status: 'accepted' }])
    expect(await rowsFor(kid)).toContain(FRESH)
  })
})
