-- N8 · AFTER applying 20260926101000_admin_activation.sql. READ-ONLY — for Rafi in the Supabase SQL editor.

-- P1. Posture. EXPECTED: 1 row: definer = true, config = {search_path=public},
--     acl = the same shape as B2's siblings (authenticated=X, service_role=X, postgres=X; NO anon, no bare =X).
select p.oid::regprocedure, p.prosecdef as definer, p.proconfig as config, p.proacl as acl
from pg_proc p where p.oid = 'public.admin_activation(int)'::regprocedure;

-- P2. Execute from the API roles. EXPECTED: anon_exec = false, authenticated_exec = true.
select has_function_privilege('anon', 'public.admin_activation(int)', 'execute')          as anon_exec,
       has_function_privilege('authenticated', 'public.admin_activation(int)', 'execute') as authenticated_exec;

-- P3. The guard holds in the SQL editor (you run as postgres, auth.uid() is NULL, so you are not an admin).
--     EXPECTED: ERROR 42501 "not an administrator". If this returns a result, STOP — the guard is not running.
select public.admin_activation(1);

-- P4. The number, computed the same way the function does but readable here (the editor cannot pass
--     admin_assert). Per signup week: eligible / added / activated / too_new, with NO suppression (you are the
--     admin; the floor applies to the page). EXPECTED: activated <= added <= eligible on every row.
--     Positive control: a family you know signed up >= 7 days ago and whose child did a lesson in week one
--     must be counted in `activated` for its week — check that week's count is >= 1.
with acct as (
  select p.id, p.created_at, date_trunc('week', p.created_at at time zone 'America/New_York')::date cw
  from public.profiles p
  where not p.is_internal and p.role is distinct from 'teacher' and p.role is distinct from 'learner'
    and p.created_at > now() - interval '84 days'),
per as (
  select a.cw, a.created_at <= now() - interval '7 days' as eligible,
    exists (select 1 from public.learners l where l.created_by = a.id and l.created_at < a.created_at + interval '7 days') as added,
    exists (select 1 from public.learners l where l.created_by = a.id and (
      exists (select 1 from public.lesson_progress lp where lp.learner_id = l.id and lp.updated_at < a.created_at + interval '7 days')
      or exists (select 1 from public.point_events pe where pe.learner_id = l.id and pe.reason <> 'game'
                  and pe.created_at < a.created_at + interval '7 days'))) as activated
  from acct a)
select cw as cohort_week,
       count(*) filter (where eligible) as eligible, count(*) filter (where not eligible) as too_new,
       count(*) filter (where eligible and added) as added, count(*) filter (where eligible and activated) as activated
from per group by cw order by cw;

-- P5. On the page: sign in to /admin → Funnel & retention. EXPECTED: an "Activation — first 7 days, lessons"
--     card whose Eligible / Added / Activated / Too new columns equal P4's for each week, with cohorts below
--     ADMIN_MIN_COHORT (default 5) showing — in Added and Activated. A 0 must show as 0, not —.
