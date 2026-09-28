// @vitest-environment node
/**
 * 20260928170000 — the legacy progress tables are gone, nothing a client can reach still names them, and what the
 * app still uses works as the real caller (`authenticated`, the owner's uid).
 *
 * Refusals and their paired halves, on the real schema (baseline + every migration) in PGlite. Expected values
 * written out here by hand.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, grantedConsent, FIXTURE_NOTICE } from './_schema'

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
let db: PGlite
let kid: string

const q = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows
async function asOwner<T = Record<string, unknown>>(sql: string): Promise<{ rows?: T[]; error?: string }> {
  await db.exec(`select set_config('test.uid', '${OWNER}', false)`)
  await db.exec('set role authenticated')
  try { return { rows: (await db.query<T>(sql)).rows } } catch (e) { return { error: (e as Error).message } } finally { await db.exec('reset role') }
}

beforeAll(async () => {
  ({ db } = await loadSchema())
  // Supabase grants `authenticated` USAGE on schema auth; the shared prelude does not. A policy resolves auth.uid()
  // when it is created, so other tests never needed it — get_parent_dashboard is an INVOKER SQL function, resolved
  // as the caller at call time, so this one does.
  await db.exec('grant usage on schema auth to authenticated')
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${OWNER}', 'o@x.test', now())`)
  const consent = await grantedConsent(db, OWNER)
  ;[{ id: kid }] = await q<{ id: string }>(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
    values ('Kid', 0, '6-8', '${OWNER}', '${consent}', '${FIXTURE_NOTICE}') returning id`)
  await db.exec(`insert into public.sessions (learner_id, chapter, phase, correct_count, client_id)
    select '${kid}', id, 'practice', 3, 'seed' from public.chapters order by id limit 1`)
}, 120_000)

describe('gone', () => {
  it('learner_progress, learner_stats and learner_state no longer exist', async () => {
    expect(await q(`select table_name from information_schema.tables where table_schema = 'public'
      and table_name in ('learner_progress', 'learner_stats', 'learner_state')`)).toEqual([])
  })
  it('no function in public names them, and the legacy writers are gone', async () => {
    expect(await q(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and (p.prosrc ~ '\\mlearner_(progress|stats|state)\\M'
        or p.proname in ('sync_session', 'sync_diagnostic', 'init_learner_stats', 'get_learner_bootstrap', 'get_insights_rollup'))`)).toEqual([])
  })
  it('the owner cannot write sessions for their own child', async () => {
    const r = await asOwner(`insert into public.sessions (learner_id, chapter, phase, client_id)
      select '${kid}', id, 'practice', 'x' from public.chapters order by id limit 1`)
    expect(String(r.error), 'the write was not refused').toMatch(/permission denied/)
  })
})

describe('what the app still uses (the paired halves)', () => {
  it("the owner still reads their child's sessions", async () => {
    expect((await asOwner(`select correct_count from public.sessions where learner_id = '${kid}'`)).rows).toEqual([{ correct_count: 3 }])
  })
  it('get_parent_dashboard answers the owner: the learner, the role and sessions — no stats, no progress', async () => {
    const r = await asOwner<{ d: Array<Record<string, unknown>> }>(`select public.get_parent_dashboard() as d`)
    expect(r.error).toBeUndefined()
    const [entry] = r.rows![0].d
    expect(Object.keys(entry).sort()).toEqual(['learner', 'role', 'sessions'])
    expect(entry.role).toBe('owner')
    expect((entry.learner as { id: string }).id).toBe(kid)
    expect((entry.sessions as unknown[]).length).toBe(1)
  })
  it('adding a child still works (the stats trigger that ran on every insert is gone, not broken)', async () => {
    const consent = (await q<{ id: string }>(`select id from public.parental_consents where parent_id = '${OWNER}' limit 1`))[0].id
    const r = await asOwner(`insert into public.learners (display_name, avatar_index, age_group, created_by, consent_id, attested_notice_version)
      values ('Second', 1, '6-8', '${OWNER}', '${consent}', '${FIXTURE_NOTICE}') returning id`)
    expect(r.error).toBeUndefined()
    expect(r.rows).toHaveLength(1)
  })
})
