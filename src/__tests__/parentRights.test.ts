// @vitest-environment node
/**
 * THE TWO PARENT RIGHTS ADDED 2026-09-23 — CORRECT, AND A COMPLETE COPY — DRIVEN AS THE REAL CALLERS.
 *
 * ⚠️ PAIRED, AS CLAUDE.md REQUIRES: every refusal has its positive twin, run as `authenticated` with the
 * owner's id, so "nobody can" and "only the owner can" cannot read as the same green.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent } from './_schema'

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const VIEWER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const STRANGER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
let db: PGlite
let kid = ''

async function as<T = Record<string, unknown>>(uid: string, sql: string): Promise<{ rows?: T[]; err?: string }> {
  await db.exec(`select set_config('test.uid', '${uid}', false)`)
  await db.exec('set role authenticated')
  try { return { rows: (await db.query<T>(sql)).rows } } catch (e) { return { err: (e as Error).message } } finally { await db.exec('reset role') }
}

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email) values ('${OWNER}', 'o@x.test'), ('${VIEWER}', 'v@x.test'), ('${STRANGER}', 's@x.test');
    insert into public.profiles (id, role) values ('${OWNER}', 'parent'), ('${VIEWER}', 'parent'), ('${STRANGER}', 'parent')
      on conflict (id) do update set role = excluded.role;`)
  const consent = await grantedConsent(db, OWNER)
  kid = (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id)
    values ('Ana', 0, '9-11', '${OWNER}', '${consent}') returning id`)).rows[0].id
  await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${kid}', '${OWNER}', 'owner') on conflict do nothing;
    insert into public.learner_access (learner_id, parent_id, access_role) values ('${kid}', '${VIEWER}', 'viewer');
    insert into public.error_events (source, message, learner_id) values ('client', 'boom', '${kid}');`)
}, 120_000)

describe('correct a child\'s name or grade', () => {
  it('the owner can — and the change is really stored', async () => {
    const r = await as(OWNER, `update public.learners set display_name = 'Anna', age_group = '12-14' where id = '${kid}' returning display_name, age_group`)
    expect(r.rows).toEqual([{ display_name: 'Anna', age_group: '12-14' }])
  })
  it('an invited viewer and a stranger change nothing', async () => {
    for (const uid of [VIEWER, STRANGER])
      expect((await as(uid, `update public.learners set display_name = 'X' where id = '${kid}' returning id`)).rows ?? []).toEqual([])
    const [{ display_name }] = (await db.query<{ display_name: string }>(`select display_name from public.learners where id = '${kid}'`)).rows
    expect(display_name).toBe('Anna')
  })
})

describe('correct the avatar, and nothing without live consent (R5)', () => {
  it('the owner can change the avatar — stored', async () => {
    const r = await as(OWNER, `update public.learners set avatar_index = 3 where id = '${kid}' returning avatar_index`)
    expect(r.rows).toEqual([{ avatar_index: 3 }])
  })
  it('another parent cannot change it', async () => {
    for (const uid of [VIEWER, STRANGER])
      expect((await as(uid, `update public.learners set avatar_index = 1 where id = '${kid}' returning id`)).rows ?? []).toEqual([])
    const [{ avatar_index }] = (await db.query<{ avatar_index: number }>(`select avatar_index from public.learners where id = '${kid}'`)).rows
    expect(avatar_index).toBe(3)
  })
  it('a child whose consent is no longer granted is refused — even for the owner', async () => {
    // A second child whose consent is then taken out of `granted` (withdrawal normally deletes the child; this is
    // the state in between, and the state a future bug could leave behind).
    const c2 = await grantedConsent(db, OWNER)
    const kid2 = (await db.query<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id)
      values ('Cy', 0, '9-11', '${OWNER}', '${c2}') returning id`)).rows[0].id
    await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role) values ('${kid2}', '${OWNER}', 'owner') on conflict do nothing`)
    // Positive twin first: while consent is granted the owner CAN edit this child.
    expect((await as(OWNER, `update public.learners set display_name = 'Cyd' where id = '${kid2}' returning display_name`)).rows).toEqual([{ display_name: 'Cyd' }])
    await db.exec(`update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = '${c2}'`)
    const r = await as(OWNER, `update public.learners set display_name = 'Z', avatar_index = 2 where id = '${kid2}' returning id`)
    expect(r.err ?? 'ALLOWED').toMatch(/no granted parental consent/)
    const [{ display_name }] = (await db.query<{ display_name: string }>(`select display_name from public.learners where id = '${kid2}'`)).rows
    expect(display_name).toBe('Cyd')
  })
})

describe('the export reads crash records and who can see the child — owner only', () => {
  it('the owner gets both sections, with the child\'s crash row and both adults', async () => {
    const r = await as<{ j: { crashRecords: { message: string }[]; access: { role: string }[] } }>(OWNER, `select public.export_child_records('${kid}') j`)
    expect(r.err).toBeUndefined()
    expect(r.rows![0].j.crashRecords.map(c => c.message)).toEqual(['boom'])
    expect(r.rows![0].j.access.map(a => a.role).sort()).toEqual(['owner', 'viewer'])
    expect(JSON.stringify(r.rows![0].j), 'an adult\'s email reached the export').not.toMatch(/@x\.test/)
  })
  it('a viewer and a stranger are refused by the ownership check', async () => {
    for (const uid of [VIEWER, STRANGER])
      expect((await as(uid, `select public.export_child_records('${kid}')`)).err ?? 'ALLOWED').toMatch(/not_owner/)
  })
  it('the crash table itself stays closed to the owner — the function is the only way in', async () => {
    expect((await as(OWNER, `select count(*)::int n from public.error_events`)).rows ?? [{ n: -1 }]).not.toEqual([{ n: 1 }])
  })
})
