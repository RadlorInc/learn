// @vitest-environment node
/**
 * /admin metrics, against a fixture whose answers are worked out BY HAND.
 *
 * ⚠️ EVERY EXPECTED VALUE BELOW IS COMPUTED IN A COMMENT FROM THE FIXTURE, NOT BY RUNNING THE
 * QUERY UNDER TEST. A check that computes its expectation the same way the code does asserts that
 * the code equals itself, and passes on any bug. That is the single most important property of
 * this file — if a future reader "simplifies" these numbers by generating them, the check is gone.
 *
 * The fixture is deliberately awkward: an account that signed up and never returned, one active
 * across a week boundary, one whose two visits are SIX HOURS APART ON THE SAME DAY (which must
 * count as one day, not two), an internal account whose heavy activity must vanish entirely, and a
 * learner who replays one chapter (which must count as one chapter, not two).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MIG = readFileSync(resolve(__dirname, '../../supabase/migrations/20260905150000_admin_role_and_metrics.sql'), 'utf8')
const ADMIN = '000000aa-0000-4000-8000-000000000001'
const P = (n: number) => `000000a${n}-0000-4000-8000-000000000000`   // hex only
const L = (n: number) => `000000b${n}-0000-4000-8000-000000000000`   // hex only

const BASE = `
create schema if not exists auth;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
end $$;
-- ⚠️ NAME AND LABELS TAKEN FROM PRODUCTION (information_schema.columns.udt_name for
-- profiles.role, 2026-09-05), not invented. The first version of this fixture created a type
-- called \`profile_role\`, which does not exist anywhere — so the migration's \`alter type\`
-- succeeded here and failed on every real database. The gate below pins the name.
create type public.user_role as enum ('parent','learner','teacher');
create table public.profiles (id uuid primary key, role public.user_role default 'parent', display_name text not null default '', avatar_index smallint not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.learners (id uuid primary key, display_name text not null default '', avatar_index smallint not null default 0, created_by uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), age_group text not null default '3-5', grade_id uuid);
create table public.sessions (id uuid primary key default gen_random_uuid(), learner_id uuid not null, chapter text not null, phase text not null default 'practice', started_at timestamptz, completed_at timestamptz, correct_count smallint not null default 0, wrong_count smallint not null default 0, stars_earned smallint not null default 0, xp_earned int not null default 0, coins_earned int not null default 0, client_id text);
create table public.learner_events (id uuid primary key default gen_random_uuid(), learner_id uuid not null, event text not null, props jsonb not null default '{}', client_id text, client_ts timestamptz, created_at timestamptz not null default now());
create table public.chapters (id text primary key, name text not null default '', emoji text not null default '', sort_order int not null default 0, age_groups text[] not null default '{}', is_free boolean not null default false);
create table public.diagnostic_sessions (id uuid primary key default gen_random_uuid(), learner_id uuid not null, band text not null default '3-5', status text not null default 'completed', root_gap_skill text, second_gap_skill text, blocked_skills text[] not null default '{}', strengths text[] not null default '{}', working_level text, started_at timestamptz not null default now(), completed_at timestamptz, client_id uuid);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
insert into public.chapters (id) values ('counting'), ('numberOrder'), ('shapes');
`

/**
 * ── THE FIXTURE, in US Eastern. `mon()` is this week's Monday; everything hangs off it, so the
 * numbers below do not drift with the day the suite happens to run.
 *
 *  acct  internal  learner  band  events (session_start unless noted)        completed sessions
 *  ────  ────────  ───────  ────  ─────────────────────────────────────────  ──────────────────
 *  P1    no        L1       3-5   none                                        none
 *  P2    no        L2       3-5   MON-14d, MON-7d + chapter_open(counting)    none
 *  P3    no        L3       3-5   MON-14d 09:00 AND MON-14d 15:00 (SAME DAY)  counting
 *                                 + chapter_open(counting)
 *  P4    no        L4       3-5   MON-14d + chapter_open(counting)            none
 *  P5    no        L5       6-8   MON-7d + chapter_open x3                    counting, counting
 *                                                                             (REPLAY),
 *                                                                             numberOrder, shapes
 *  P6    YES       L6       3-5   MON-14d, MON-13d, MON-12d + 1 open          5 sessions
 */
const FIXTURE = `
insert into public.profiles (id, created_at) values
  ('${P(1)}', mon() - interval '14 days'), ('${P(2)}', mon() - interval '14 days'),
  ('${P(3)}', mon() - interval '14 days'), ('${P(4)}', mon() - interval '14 days'),
  ('${P(5)}', mon() - interval '14 days'), ('${P(6)}', mon() - interval '14 days'),
  ('${ADMIN}', mon() - interval '14 days');
update public.profiles set is_internal = true where id in ('${P(6)}', '${ADMIN}');
update public.profiles set role = 'admin'::public.user_role where id = '${ADMIN}';

insert into public.learners (id, created_by, age_group, created_at) values
  ('${L(1)}','${P(1)}','3-5', mon() - interval '14 days'),
  ('${L(2)}','${P(2)}','3-5', mon() - interval '14 days'),
  ('${L(3)}','${P(3)}','3-5', mon() - interval '14 days'),
  ('${L(4)}','${P(4)}','3-5', mon() - interval '14 days'),
  ('${L(5)}','${P(5)}','6-8', mon() - interval '14 days'),
  ('${L(6)}','${P(6)}','3-5', mon() - interval '14 days');

insert into public.learner_events (learner_id, event, props, client_ts) values
  ('${L(2)}','session_start','{}', mon() - interval '14 days' + interval '10 h'),
  ('${L(2)}','session_start','{}', mon() - interval '7 days'  + interval '10 h'),
  ('${L(2)}','chapter_open','{"chapter":"counting"}', mon() - interval '7 days' + interval '10 h'),
  ('${L(3)}','session_start','{}', mon() - interval '14 days' + interval '9 h'),
  ('${L(3)}','session_start','{}', mon() - interval '14 days' + interval '15 h'),
  ('${L(3)}','chapter_open','{"chapter":"counting"}', mon() - interval '14 days' + interval '9 h'),
  ('${L(4)}','session_start','{}', mon() - interval '14 days' + interval '11 h'),
  ('${L(4)}','chapter_open','{"chapter":"counting"}', mon() - interval '14 days' + interval '11 h'),
  ('${L(5)}','session_start','{}', mon() - interval '7 days' + interval '12 h'),
  ('${L(5)}','chapter_open','{"chapter":"counting"}',    mon() - interval '7 days' + interval '12 h'),
  ('${L(5)}','chapter_open','{"chapter":"numberOrder"}', mon() - interval '7 days' + interval '12 h'),
  ('${L(5)}','chapter_open','{"chapter":"shapes"}',      mon() - interval '7 days' + interval '12 h'),
  ('${L(6)}','session_start','{}', mon() - interval '14 days' + interval '9 h'),
  ('${L(6)}','session_start','{}', mon() - interval '13 days' + interval '9 h'),
  ('${L(6)}','session_start','{}', mon() - interval '12 days' + interval '9 h'),
  ('${L(6)}','chapter_open','{"chapter":"counting"}', mon() - interval '14 days' + interval '9 h');

insert into public.sessions (learner_id, chapter, completed_at) values
  ('${L(3)}','counting',    mon() - interval '14 days' + interval '9 h'),
  ('${L(5)}','counting',    mon() - interval '7 days' + interval '12 h'),
  ('${L(5)}','counting',    mon() - interval '7 days' + interval '13 h'),
  ('${L(5)}','numberOrder', mon() - interval '7 days' + interval '12 h'),
  ('${L(5)}','shapes',      mon() - interval '7 days' + interval '12 h'),
  ('${L(6)}','counting',    mon() - interval '14 days' + interval '9 h'),
  ('${L(6)}','numberOrder', mon() - interval '14 days' + interval '9 h'),
  ('${L(6)}','shapes',      mon() - interval '13 days' + interval '9 h'),
  ('${L(6)}','counting',    mon() - interval '12 days' + interval '9 h'),
  ('${L(6)}','numberOrder', mon() - interval '12 days' + interval '9 h');

insert into public.diagnostic_sessions (learner_id, status, completed_at) values
  ('${L(5)}','completed',   mon() - interval '7 days'),
  ('${L(2)}','in_progress', null),
  ('${L(6)}','completed',   mon() - interval '14 days');
`

let db: PGlite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let overview: any, learning: any, funnel: any

beforeAll(async () => {
  db = await PGlite.create()
  await db.exec(BASE)
  await db.exec(`create function mon() returns timestamptz language sql stable as $$
    select date_trunc('week', now() at time zone 'America/New_York') at time zone 'America/New_York' $$;`)
  await db.exec(MIG)
  await db.exec(FIXTURE)
  await db.exec(`select set_config('test.uid', '${ADMIN}', false)`)
  overview = (await db.query<Record<string, any>>(`select public.admin_overview(1)`)).rows[0].admin_overview
  learning = (await db.query<Record<string, any>>(`select public.admin_learning(1)`)).rows[0].admin_learning
  funnel   = (await db.query<Record<string, any>>(`select public.admin_funnel(1)`)).rows[0].admin_funnel
}, 90_000)

describe('the internal account disappears entirely', () => {
  it('accounts and learners exclude P6 and the admin', () => {
    // BY HAND: 7 profiles (P1..P6 + admin). P6 and the admin are is_internal.
    // in scope = P1..P5 = 5 accounts. Learners L1..L5 = 5 (L6 belongs to internal P6).
    expect(Number(overview.total_accounts)).toBe(5)
    expect(Number(overview.total_learners)).toBe(5)
    expect(Number(overview.internal_flagged)).toBe(2)
  })
  it("P6's five completed sessions are nowhere in the chapter counts", () => {
    // BY HAND: L6 completed counting x2, numberOrder x2, shapes x1. If any leaked, counting's
    // finished count would be 3 (L3, L5, L6) instead of 2.
    const counting = learning.chapter_funnel.find((c: { chapter: string }) => c.chapter === 'counting')
    expect(Number(counting.finished)).toBe(2)
  })
})

describe('chapters completed per learner', () => {
  it('mean and median, over BOTH denominators', () => {
    // BY HAND, distinct chapters completed: L1=0 L2=0 L3=1 L4=0 L5=3 (L5 replayed counting; still 1)
    //   all:     n=5  mean=(0+0+1+0+3)/5=0.80   sorted [0,0,0,1,3] -> median 0
    //   engaged: n=2  mean=(1+3)/2=2.00         sorted [1,3]       -> median 2
    const c = learning.chapters_per_learner
    expect(Number(c.n_all)).toBe(5)
    expect(Number(c.mean_all)).toBeCloseTo(0.80, 2)
    expect(Number(c.median_all)).toBe(0)
    expect(Number(c.n_engaged)).toBe(2)
    expect(Number(c.mean_engaged)).toBeCloseTo(2.00, 2)
    expect(Number(c.median_engaged)).toBe(2)
  })
  it('the histogram matches, and a replay is not a second chapter', () => {
    // BY HAND: done=0 -> L1,L2,L4 = 3 ;  done=1 -> L3 = 1 ;  done=3 -> L5 = 1
    expect(learning.chapters_histogram.map((h: { done: number; n: number }) => [Number(h.done), Number(h.n)]))
      .toEqual([[0, 3], [1, 1], [3, 1]])
  })
})

describe('chapters ranked started vs finished', () => {
  it('worst completion rate first', () => {
    // BY HAND:
    //   counting    started L2,L3,L4,L5 = 4 ; finished L3,L5 = 2 ; rate 0.5
    //   numberOrder started L5 = 1          ; finished L5 = 1     ; rate 1.0
    //   shapes      started L5 = 1          ; finished L5 = 1     ; rate 1.0
    // ordered by rate asc, then chapter: counting, numberOrder, shapes
    expect(learning.chapter_funnel.map((c: { chapter: string; started: number; finished: number }) =>
      [c.chapter, Number(c.started), Number(c.finished)]))
      .toEqual([['counting', 4, 2], ['numberOrder', 1, 1], ['shapes', 1, 1]])
  })
})

describe('the funnel', () => {
  it('four steps on one denominator, and the 6-hour session is ONE visit', () => {
    // BY HAND:
    //   account created      P1..P5                             = 5
    //   opened a chapter     P2,P3,P4,P5 (P1 has no events)     = 4
    //   completed a chapter  P3 (counting), P5 (three)          = 2
    //   came back another day  L2 has MON-14d and MON-7d -> P2  = 1
    //     ⚠️ L3's two visits are 09:00 and 15:00 on the SAME day. One day. P3 is NOT here.
    expect(funnel.steps.map((s: { n: number }) => Number(s.n))).toEqual([5, 4, 2, 1])
  })
})

describe('curriculum position', () => {
  it('splits by band with its own median', () => {
    // BY HAND: 3-5 = L1,L2,L3,L4 -> done [0,0,1,0], median 0, started 1 of 4 = 25%
    //          6-8 = L5          -> done [3],       median 3, started 1 of 1 = 100%
    expect(learning.curriculum_position.map((b: { band: string; learners: number; median_done: number; pct_started: number }) =>
      [b.band, Number(b.learners), Number(b.median_done), Number(b.pct_started)]))
      .toEqual([['3-5', 4, 0, 25], ['6-8', 1, 3, 100]])
  })
})

describe('diagnostic starts vs completions', () => {
  it('counts both, and excludes the internal one', () => {
    // BY HAND: in-scope rows are L5 completed and L2 in_progress. L6's completed row is internal.
    expect(Number(learning.diagnostic.completed)).toBe(1)
    expect(Number(learning.diagnostic.in_progress)).toBe(1)
  })
})

describe('cohort retention', () => {
  it('is a matrix by signup week, not one global number', () => {
    // BY HAND: all five in-scope learners were created in the week of MON-14d -> ONE cohort of 5.
    //   offset 0 (week of MON-14d): L2, L3, L4 active = 3
    //   offset 1 (week of MON-7d) : L2, L5 active     = 2
    //   offsets 2,3               : nobody -> no row emitted
    expect(funnel.cohorts).toHaveLength(1)
    expect(Number(funnel.cohorts[0].size)).toBe(5)
    expect(funnel.cohorts[0].weeks.map((w: { offset: number; n: number }) => [Number(w.offset), Number(w.n)]))
      .toEqual([[0, 3], [1, 2]])
  })
})

describe('the incomplete day is flagged', () => {
  it('returns today so the UI can mark it rather than let it read as a decline', () => {
    expect(overview.today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(overview.events_since).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('small-cell suppression', () => {
  /**
   * ⚠️ WITH ITS POSITIVE TWIN IN THE SAME TEST. "Everything is suppressed" and "suppression works"
   * look identical from outside — a function that returned NULL for every bucket would satisfy a
   * suppression-only check completely. So each case asserts BOTH that a small bucket disappears
   * AND that a big enough one survives.
   */
  it('a bucket below the threshold returns NULL, and one at it survives', async () => {
    // BY HAND, retention cohort of the week of MON-14d: offset 0 has 3 learners, offset 1 has 2.
    //   threshold 3 -> offset 0 (3) SURVIVES, offset 1 (2) is suppressed to null.
    //   threshold 4 -> both suppressed.
    const at3 = (await db.query<{ admin_funnel: any }>(`select public.admin_funnel(3)`)).rows[0].admin_funnel
    const w3 = new Map(at3.cohorts[0].weeks.map((w: any) => [Number(w.offset), w.n]))
    expect(w3.get(0)).toBe(3)      // ← the positive twin: not everything vanishes
    expect(w3.get(1)).toBeNull()   // ← 2 < 3, suppressed

    const at4 = (await db.query<{ admin_funnel: any }>(`select public.admin_funnel(4)`)).rows[0].admin_funnel
    const w4 = new Map(at4.cohorts[0].weeks.map((w: any) => [Number(w.offset), w.n]))
    expect(w4.get(0)).toBeNull()
    expect(w4.get(1)).toBeNull()
  })

  it('the cohort SIZE is not suppressed — it is not a per-day bucket', () => {
    // Deliberate: the denominator must stay visible or a suppressed row is unreadable.
    expect(Number(funnel.cohorts[0].size)).toBe(5)
  })

  it('DAU suppresses per day, and at threshold 1 nothing is suppressed', async () => {
    // BY HAND: on MON-14d, L2, L3 and L4 each had a session_start -> 3 distinct learners.
    // (L3's two events are the same learner, same day.) At threshold 4 that bucket disappears.
    const at4 = (await db.query<{ admin_overview: any }>(`select public.admin_overview(4)`)).rows[0].admin_overview
    expect(at4.dau.every((d: any) => d.n === null)).toBe(true)
    expect(overview.dau.some((d: any) => d.n !== null)).toBe(true)   // ← threshold 1: visible
  })
})

describe('authorisation', () => {
  /**
   * ⚠️ EACH CASE CARRIES ITS OWN POSITIVE CONTROL. A build that refused EVERYONE would pass a
   * refusal-only check — that is the one-sided-permission trap: "nobody unauthorised can call it"
   * and "nobody at all can call it" are the same green.
   */
  it('a signed-in NON-admin is refused with 42501, while the admin is served', async () => {
    await db.exec(`select set_config('test.uid', '${P(2)}', false)`)   // a plain parent
    await expect(db.query(`select public.admin_overview(1)`)).rejects.toThrow(/not an administrator/)

    await db.exec(`select set_config('test.uid', '${ADMIN}', false)`)  // the positive twin
    const ok = await db.query<{ admin_overview: any }>(`select public.admin_overview(1)`)
    expect(Number(ok.rows[0].admin_overview.total_accounts)).toBe(5)
  })

  it('a signed-out caller is refused too', async () => {
    await db.exec(`select set_config('test.uid', '', false)`)
    await expect(db.query(`select public.admin_learning(1)`)).rejects.toThrow(/not an administrator/)
    await db.exec(`select set_config('test.uid', '${ADMIN}', false)`)
  })

  it('all three functions are guarded — not just the one that was checked', async () => {
    await db.exec(`select set_config('test.uid', '${P(3)}', false)`)
    for (const fn of ['admin_overview', 'admin_learning', 'admin_funnel']) {
      await expect(db.query(`select public.${fn}(1)`)).rejects.toThrow(/not an administrator/)
    }
    await db.exec(`select set_config('test.uid', '${ADMIN}', false)`)
  })
})

describe('no query can return an identifier', () => {
  it('nothing in any payload looks like a uuid or an email', () => {
    // The structural claim: these are GROUP BY with aggregates, so a per-child row is not
    // expressible. This asserts the outcome as well, across all three payloads.
    const blob = JSON.stringify([overview, learning, funnel])
    expect(blob).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
    expect(blob).not.toMatch(/@/)
  })
})

describe('the migration names types that actually exist', () => {
  /**
   * ⚠️ THE CHECK THAT WOULD HAVE SAVED FIVE RED CI RUNS.
   *
   * `20260905150000` opened with `alter type public.profile_role add value 'admin'`. No such type
   * exists — production calls it `user_role` — so every real database answered
   * `type "public.profile_role" does not exist (SQLSTATE 42704)` and CI was red on main for five
   * commits. The local suite passed the entire time, because the fixture above CREATED a type
   * named `profile_role`: a hand-written fixture agreeing with the bug it was supposed to catch.
   *
   * So this does not test the fixture. It reads the enum name out of `baseline_schema.sql` — the
   * same file CI stages as its first migration — and requires the migration to use that name.
   * Derived from the thing CI actually applies, so it cannot drift with either side.
   */
  it("the enum altered by the migration is the one the baseline declares for profiles.role", () => {
    const baseline = readFileSync(resolve(__dirname, '../../supabase/schema/baseline_schema.sql'), 'utf8')
    // walk the profiles table body to its closing paren — not a character window
    const at = baseline.search(/create table if not exists public\.profiles\s*\(/i)
    expect(at, 'profiles is not in the baseline — this check has rotted').toBeGreaterThan(-1)
    const body = baseline.slice(at, baseline.indexOf(');', at))
    const roleType = body.match(/^\s*role\s+([a-z_][a-z0-9_]*)/im)?.[1]
    expect(roleType, 'could not read profiles.role type from the baseline').toBeTruthy()

    const altered = [...MIG.matchAll(/alter\s+type\s+(?:public\.)?([a-z_][a-z0-9_]*)\s+add\s+value/gi)]
      .map(m => m[1].toLowerCase())
    expect(altered.length, 'the migration no longer alters a type — has this check rotted?').toBe(1)
    expect(altered[0]).toBe(roleType!.toLowerCase())
  })

  it('positive control: the baseline really does declare a named type here', () => {
    // Without this, a baseline whose profiles block moved would make the check above vacuous by
    // returning undefined on both sides.
    const baseline = readFileSync(resolve(__dirname, '../../supabase/schema/baseline_schema.sql'), 'utf8')
    expect(baseline).toMatch(/create table if not exists public\.profiles/i)
    expect(baseline).toMatch(/^\s*role\s+user_role/im)
  })
})
