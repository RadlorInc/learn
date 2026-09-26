-- N8 · BEFORE applying 20260926101000_admin_activation.sql. READ-ONLY — for Rafi in the Supabase SQL editor.
-- (The agent never queries production, not even read-only.)

-- B1. The function must not exist yet.
--     EXPECTED: 0 rows.
select oid::regprocedure from pg_proc where proname = 'admin_activation';

-- B2. Its three siblings, for comparison with P1 after the apply.
--     EXPECTED: 3 rows, each definer = true, config = {search_path=public},
--     acl containing authenticated=X and service_role=X and NO anon=X and no bare =X (PUBLIC).
select p.oid::regprocedure, p.prosecdef as definer, p.proconfig as config, p.proacl as acl
from pg_proc p where p.pronamespace = 'public'::regnamespace
  and p.proname in ('admin_overview', 'admin_learning', 'admin_funnel') order by 1;

-- B3. Does the old funnel see the lessons at all? (FND-04: expected to show the problem.)
--     EXPECTED: sessions_30d = 0 and chapter_open_30d = 0 while lesson_progress_30d > 0.
select
  (select count(*) from public.sessions        where completed_at > now() - interval '30 days') as sessions_30d,
  (select count(*) from public.learner_events  where event = 'chapter_open' and client_ts > now() - interval '30 days') as chapter_open_30d,
  (select count(*) from public.lesson_progress where updated_at  > now() - interval '30 days') as lesson_progress_30d;

-- B4. The role values the new unit depends on (NULL = never picked Parent/Teacher; counted as a family).
--     EXPECTED: a handful of rows among parent / teacher / learner / NULL. A value NOT in that list means the
--     unit definition in the migration is incomplete — stop and tell the agent.
select role, count(*) from public.profiles where not is_internal group by role order by 1;
