-- ════════════════════════════════════════════════════════════════════════════════════════════════════
-- /admin ACTIVATION — the first /admin number that reads the lessons children actually use (N8; FND-04,
-- FND-05, ARC-01). Founder's decision 2026-09-26: "yes — read-only activation view from lesson_progress, no
-- new events."
-- ════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- WHY: `admin_learning` and `admin_funnel` count `sessions` and `learner_events.chapter_open`, which only the
-- hidden legacy chapters ever wrote. The live lessons write `lesson_progress` and `point_events` and nothing
-- else, so every outcome figure on /admin can only read 0 for the product that ships.
--
-- WHAT IT ADDS: ONE function, `admin_activation(p_min_cohort)`, returning aggregates only. It READS
-- `profiles`, `learners`, `lesson_progress` and `point_events` — all already stored and disclosed. Nothing new
-- is collected about a child: no table, no column, no event, no trigger, no change to any existing object.
--
-- ⚠️⚠️ SECURITY CHANGE, CALLED OUT: A NEW `SECURITY DEFINER` FUNCTION. It reads across every family, which no
-- RLS policy allows, exactly as its three siblings (`admin_overview/learning/funnel`, 20260905150000) do, and
-- is contained the same three ways:
--   1. its FIRST statement is `perform public.admin_assert()`, which raises 42501 for anyone not in
--      `admin_users`;
--   2. it returns json built from `count(*)` per signup week — no id, name or email is expressible;
--   3. `search_path` is pinned to `public`.
-- EXECUTE: revoked from public and anon; granted to authenticated and service_role — the siblings' grant,
-- verbatim. `authenticated` needs it because /api/admin/metrics forwards the CALLER'S token (never the
-- service role), so `admin_assert()` is what refuses a non-admin. All of this is asserted at the end.
--
-- DEPLOY ORDER: either. The page asks for `?page=activation`; before this is applied the RPC answers
-- PGRST202, the route answers 502 and ONLY the new card says "could not load" — the funnel card above it is
-- a separate request and is unaffected. Applying it first is invisible until the page ships.
--
-- ═══ PRE-REGISTERED: WHAT THE NUMBER MEANS (written before it has been run on production) ═══════════════
--
--   UNIT        a FAMILY ACCOUNT: a non-`is_internal` profile whose role is NOT 'teacher' and NOT 'learner'.
--               Teachers are a paused channel and child logins (`role = 'learner'`) are not sign-ups.
--               ⚠️ `role` IS NULL until an account picks one (handle_new_user writes no role), so NULL counts as
--               a family — "role = 'parent'" would silently drop every sign-up that never reached the picker,
--               which is part of what this number exists to see. `role` is a self-service UX label: a parent
--               who picked "Teacher" is not counted. This is a count, not an authorisation.
--   COHORT      signup week: ISO Monday, US Eastern — the same week the funnel's retention table uses.
--               Last 84 days (12 weeks), like its siblings.
--   ELIGIBLE    an account at least 7 full days old. A younger one has not had its week yet, so it is
--               reported separately as `too_new` and kept OUT of the denominator — otherwise the newest
--               cohort always reads as a drop.
--   ADDED       a child created by the account within 7 days of signup.
--   ACTIVATED   a child of the account did lesson work within 7 days of signup: a `lesson_progress` row
--               touched before day 7, OR a non-game `point_events` row created before day 7.
--               ⚠️ Why point_events too: `lesson_progress.updated_at` is the LAST touch, not the first — a
--               child who started on day 2 and kept going on day 9 has updated_at = day 9, so lesson_progress
--               alone would drop exactly the most engaged children. `point_events.created_at` is append-only
--               and every answered practice problem writes one (`record_lesson_progress`, reason 'problem').
--               Game-time spending ('game') is excluded: it is not lesson work.
--   NESTED      activated ⊆ added ⊆ eligible BY CONSTRUCTION (lesson work needs a child, which needs the
--               account), so `activated <= added <= eligible` is an invariant, checked on every page load.
--   SUPPRESSION a cohort whose ELIGIBLE size is below p_min_cohort returns NULL for added and activated. Below
--               the floor the whole cohort is withheld; at or above it, the counts are exact INCLUDING 0 —
--               a 0 is the most important value this can return and must never render as "suppressed".
--
--   HOW TO READ IT (decided now, not after seeing it):
--     · activated / eligible is the share of new families whose child did any lesson work in week one.
--     · added − activated = families who added a child and then nothing happened: an onboarding/first-lesson
--       problem, NOT a sign-up problem.
--     · eligible − added = families who never added a child: consent/add-child friction, not lesson quality.
--     · A low number is NOT evidence the lessons teach badly — this measures STARTING, not learning.
--       Mastery is not in it on purpose (mastery = a ladder position, FND-05).
--     · Beta cohorts are founder-invited families; do not compare them with later organic cohorts.
--   BLIND SPOTS: a child deleted (or a consent withdrawn) takes its rows with it, so its family can move from
--   activated to added-only after the fact. Play on a device that never synced (offline, signed-out) is invisible.

create or replace function public.admin_activation(p_min_cohort int default 5)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare v json; v_tz text := 'America/New_York';
begin
  perform public.admin_assert();
  with acct as (
    select a.id, a.created_at, date_trunc('week', a.created_at at time zone v_tz)::date cw
    from public.admin_scope_accounts a
    join public.profiles p on p.id = a.id
    where p.role is distinct from 'teacher' and p.role is distinct from 'learner'
      and a.created_at > now() - interval '84 days'),
  per_acct as (
    select a.cw,
           a.created_at <= now() - interval '7 days' as eligible,
           exists (select 1 from public.learners l
                    where l.created_by = a.id and l.created_at < a.created_at + interval '7 days') as added,
           exists (select 1 from public.learners l
                    where l.created_by = a.id
                      and (exists (select 1 from public.lesson_progress lp
                                    where lp.learner_id = l.id and lp.updated_at < a.created_at + interval '7 days')
                        or exists (select 1 from public.point_events pe
                                    where pe.learner_id = l.id and pe.reason <> 'game'
                                      and pe.created_at < a.created_at + interval '7 days'))) as activated
    from acct a),
  k as (
    select cw,
           count(*) filter (where eligible)               as eligible,
           count(*) filter (where not eligible)           as too_new,
           count(*) filter (where eligible and added)     as added,
           count(*) filter (where eligible and activated) as activated
    from per_acct group by cw)
  select json_build_object(
    'computed_at', now(),
    'cohorts', (
      select coalesce(json_agg(json_build_object(
               'cohort_week', cw::text, 'eligible', eligible, 'too_new', too_new,
               'added',     case when eligible >= p_min_cohort then added end,
               'activated', case when eligible >= p_min_cohort then activated end) order by cw), '[]'::json)
      from k),
    'min_cohort', p_min_cohort
  ) into v;
  return v;
end;
$$;
revoke all on function public.admin_activation(int) from public, anon;
grant execute on function public.admin_activation(int) to authenticated, service_role;

-- ── closing assertions: the posture above, measured on the object that was just created ──────────────
do $$
begin
  if not exists (select 1 from pg_proc where oid = 'public.admin_activation(int)'::regprocedure
                  and prosecdef and proconfig = array['search_path=public']
                  -- the guard must be the FIRST statement: a regex on `begin` + it, so a commented-out
                  -- `-- perform public.admin_assert();` does not satisfy it the way a substring search would
                  and prosrc ~ 'begin\s+perform public\.admin_assert\(\);') then
    raise exception 'admin_activation: not DEFINER with search_path=public, or does not call admin_assert() — rolled back';
  end if;
  if has_function_privilege('anon', 'public.admin_activation(int)', 'execute') then
    raise exception 'admin_activation is callable by anon — rolled back';
  end if;
  if not has_function_privilege('authenticated', 'public.admin_activation(int)', 'execute') then
    raise exception 'admin_activation is not callable by authenticated, so /admin cannot reach it — rolled back';
  end if;
end $$;
