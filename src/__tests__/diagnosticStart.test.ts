// @vitest-environment node
//   PGlite needs a real Response.arrayBuffer; the suite default is jsdom. This file touches no DOM.
/**
 * The diagnostic records that it STARTED.
 *
 * ⚠️ MEASURED ON PRODUCTION 2026-09-05: `diagnostic_sessions.completed_at` is NOT NULL DEFAULT
 * now(), and the row is only ever inserted by `sync_diagnostic`, which runs at COMPLETION. All 13
 * rows have `completed_at = started_at` EXACTLY, and all 13 are status='completed'. A child who
 * opens the probe and walks away writes nothing at all.
 *
 * So "how many start the check vs finish it" had no denominator — the query could only ever return
 * 100%. That is the one-valued-metric shape CLAUDE.md records: a number incapable of expressing the
 * comparison it claims to make, which is worse than no number because it gets acted on.
 *
 * Runs the REAL migrations. Schema derived from production's information_schema, not hand-written.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MIG = (f: string) => readFileSync(resolve(__dirname, '../../supabase/migrations', f), 'utf8')
const NEW = '20260905140000_diagnostic_records_its_start.sql'
const LEARNER = '22222222-2222-2222-2222-222222222222'
const PARENT  = '11111111-1111-1111-1111-111111111111'

/** Generated from production information_schema, 2026-09-05. */
const SCHEMA = `
create schema if not exists auth;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
end $$;
create table learner_access (id uuid not null default gen_random_uuid(), learner_id uuid not null, parent_id uuid not null, access_role text not null default 'viewer', granted_at timestamptz not null default now());
create table learner_progress (id uuid not null default gen_random_uuid(), learner_id uuid not null, chapter text not null, best_stars smallint not null default 0, total_xp integer not null default 0, total_sessions integer not null default 0, last_played_at timestamptz, current_level smallint not null default 1, updated_at timestamptz not null default now());
create table diagnostic_sessions (id uuid not null default gen_random_uuid(), learner_id uuid not null, band text not null, status text not null default 'completed'::text, root_gap_skill text, second_gap_skill text, blocked_skills text[] not null default '{}'::text[], strengths text[] not null default '{}'::text[], working_level text, started_at timestamptz not null default now(), completed_at timestamptz not null default now(), client_id uuid);
create unique index uq_diag_sessions_client on diagnostic_sessions (client_id) where client_id is not null;
create table diagnostic_items (id uuid not null default gen_random_uuid(), session_id uuid not null, skill_id text not null, correct boolean not null, ordinal integer not null default 0, created_at timestamptz not null default now());
create table diagnostic_plans (id uuid not null default gen_random_uuid(), learner_id uuid not null, session_id uuid, skill_sequence text[] not null default '{}', chapter_sequence text[] not null default '{}', active boolean not null default true, created_at timestamptz not null default now(), free_chapters text[] not null default '{}', revised_chapter text);
create table diagnostic_plan_progress (id uuid not null default gen_random_uuid(), plan_id uuid not null, skill_id text not null default '', chapter_id text not null, status text not null default 'todo', updated_at timestamptz not null default now());
create table diagnostic_rechecks (id uuid not null default gen_random_uuid(), session_id uuid, learner_id uuid, week int, skill_id text, gap_closed boolean, client_id uuid, created_at timestamptz not null default now());
create unique index uq_diag_recheck_client on diagnostic_rechecks (client_id) where client_id is not null;
create table learner_stats (learner_id uuid not null, total_xp int not null default 0, total_coins int not null default 0, current_level smallint not null default 1, last_played_at timestamptz, updated_at timestamptz not null default now());
create table learner_state (learner_id uuid not null, coins_spent int not null default 0, owned_items text[] not null default '{}', equipped_items jsonb not null default '{}', updated_at timestamptz not null default now());
create function auth.uid() returns uuid language sql stable as $$ select '${PARENT}'::uuid $$;
insert into learner_access (learner_id, parent_id) values ('${LEARNER}','${PARENT}');
`

/** The pre-2026-09-05 behaviour: insert at completion, nothing at start. */
const OLD_SYNC = `
create or replace function public.sync_diagnostic_old(p_learner_id uuid, p_band text, p_client_id uuid)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into public.diagnostic_sessions (learner_id, band, status, completed_at, client_id)
  values (p_learner_id, p_band, 'completed', now(), p_client_id)
  on conflict (client_id) where client_id is not null do nothing
  returning id into v_id;
  return v_id;
end; $$;`

let db: PGlite
beforeAll(async () => {
  db = await PGlite.create()
  await db.exec(SCHEMA)
  await db.exec(OLD_SYNC)
  await db.exec(MIG(NEW))
}, 60_000)

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

describe('diagnostic start/finish', () => {
  it('KNOWN-BAD CONTROL: the old path leaves NO trace of a probe that was abandoned', async () => {
    // A child opens the probe and walks away. Under the old code the ONLY write happens at
    // completion, so nothing is recorded — and "started" has no denominator.
    const before = await db.query<{ n: number }>(`select count(*)::int n from diagnostic_sessions`)
    // (an abandoned probe: no call at all is made)
    const after = await db.query<{ n: number }>(`select count(*)::int n from diagnostic_sessions`)
    expect(Number(after.rows[0].n)).toBe(Number(before.rows[0].n))

    // and a COMPLETED one under the old path stamps both timestamps at once — which is why all 13
    // production rows have completed_at = started_at exactly.
    await db.query(`select public.sync_diagnostic_old($1,'9-11',$2)`, [LEARNER, uuid(1)])
    const r = await db.query<{ same: boolean }>(
      `select (completed_at = started_at) same from diagnostic_sessions where client_id=$1`, [uuid(1)])
    expect(r.rows[0].same).toBe(true)
  })

  it('a start is recorded, in progress, with no completion time', async () => {
    await db.query(`select public.start_diagnostic($1,'9-11',$2)`, [LEARNER, uuid(2)])
    const r = await db.query<{ status: string; completed_at: string | null }>(
      `select status, completed_at from diagnostic_sessions where client_id=$1`, [uuid(2)])
    expect(r.rows[0].status).toBe('in_progress')
    expect(r.rows[0].completed_at).toBeNull()
  })

  it('finishing UPDATES that row rather than opening a second one', async () => {
    await db.query(
      `select public.sync_diagnostic($1,'9-11','frac.add',null,'{}','{}','L2','{}','{}',null,$2)`,
      [LEARNER, uuid(2)])
    const r = await db.query<{ n: number; status: string; root: string; positive: boolean }>(
      `select count(*)::int n, min(status) status, min(root_gap_skill) root,
              bool_and(completed_at > started_at) positive
         from diagnostic_sessions where client_id=$1`, [uuid(2)])
    expect(Number(r.rows[0].n)).toBe(1)            // ← one row, not two
    expect(r.rows[0].status).toBe('completed')
    expect(r.rows[0].root).toBe('frac.add')
    expect(r.rows[0].positive).toBe(true)          // a real elapsed duration, for the first time
  })

  it('starting twice with one id is idempotent — a reload is not a second attempt', async () => {
    const a = await db.query<{ start_diagnostic: string }>(`select public.start_diagnostic($1,'9-11',$2)`, [LEARNER, uuid(3)])
    const b = await db.query<{ start_diagnostic: string }>(`select public.start_diagnostic($1,'9-11',$2)`, [LEARNER, uuid(3)])
    expect(b.rows[0].start_diagnostic).toBe(a.rows[0].start_diagnostic)
    const r = await db.query<{ n: number }>(`select count(*)::int n from diagnostic_sessions where client_id=$1`, [uuid(3)])
    expect(Number(r.rows[0].n)).toBe(1)
  })

  it('an older bundle that never calls start still completes, by inserting', async () => {
    await db.query(
      `select public.sync_diagnostic($1,'6-8','add.100',null,'{}','{}','L1','{}','{}',null,$2)`,
      [LEARNER, uuid(4)])
    const r = await db.query<{ status: string }>(`select status from diagnostic_sessions where client_id=$1`, [uuid(4)])
    expect(r.rows[0].status).toBe('completed')
  })

  it('the funnel is finally answerable — and is NOT 100%', async () => {
    // Worked out by hand from every row written above:
    //   uuid(1) completed (old path)   uuid(2) started -> completed
    //   uuid(3) started, ABANDONED     uuid(4) completed (no start row)
    // starts recorded = uuid(2), uuid(3) = 2; of those, finished = uuid(2) = 1.
    const r = await db.query<{ started: number; finished: number }>(
      `select count(*)::int started,
              count(*) filter (where status='completed')::int finished
         from diagnostic_sessions where client_id in ($1,$2)`, [uuid(2), uuid(3)])
    expect(Number(r.rows[0].started)).toBe(2)
    expect(Number(r.rows[0].finished)).toBe(1)     // ← 50%, a value the old schema could not express
  })

  it('one family cannot complete another family\'s in-progress probe', async () => {
    // The completion UPDATE originally matched on client_id ALONE. The caller is authorised for
    // LEARNER, so a start row belonging to someone else must be untouchable even when its id is
    // known — RLS is this app's whole boundary and an RPC must not open a hole beside it.
    const OTHER = '33333333-3333-3333-3333-333333333333'
    await db.exec(`insert into diagnostic_sessions (learner_id, band, status, completed_at, client_id)
                   values ('${OTHER}', '3-5', 'in_progress', null, '${uuid(9)}')`)
    await db.query(
      `select public.sync_diagnostic($1,'9-11','STOLEN',null,'{}','{}','L3','{}','{}',null,$2)`,
      [LEARNER, uuid(9)])
    const r = await db.query<{ status: string; root: string | null; lid: string }>(
      `select status, root_gap_skill root, learner_id lid from diagnostic_sessions where client_id=$1`, [uuid(9)])
    expect(r.rows[0].status).toBe('in_progress')   // untouched
    expect(r.rows[0].root).toBeNull()
    expect(r.rows[0].lid).toBe(OTHER)
  })

  it('an in-progress row can never be "the latest diagnosis"', async () => {
    // The reader rule, which is the half that would have broken /menu: NULL sorts FIRST under DESC.
    const naive = await db.query<{ root: string | null }>(
      `select root_gap_skill root from diagnostic_sessions
        where learner_id=$1 order by completed_at desc limit 1`, [LEARNER])
    const fixed = await db.query<{ root: string | null }>(
      `select root_gap_skill root from diagnostic_sessions
        where learner_id=$1 and status='completed' order by completed_at desc limit 1`, [LEARNER])
    expect(naive.rows[0].root).toBeNull()          // ← the abandoned probe wins. The defect.
    expect(fixed.rows[0].root).not.toBeNull()
  })
})
