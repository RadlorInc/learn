-- LEGACY PROGRESS TABLES — BEFORE the migration 20260928170000 (read-only; counts and booleans only). Run it in the SQL
-- editor BEFORE approving the production-db run, and keep the output. Every row without INFO should say PASS.
-- A FAIL in a STOP-CHECK means production's function is not the body this migration was written against: do NOT
-- approve; send the output back.
-- The get_parent_dashboard() hash is production's, measured 2026-09-29 (1021 characters). The repo's migration chain
-- builds a body that differs by one comment ("-- ⚠️ CHANGED" where production has "-- CHANGED"), so the repo's own
-- body FAILS this check on purpose; legacyProgressDropped.test.ts proves both halves.
-- What the INFO rows mean, decided before they are read: the three tables hold the retired chapter/XP economy (emptied
-- or zeroed on 2026-09-17). "rows with a value" should be 0; any other number is data the pre-migration backup keeps
-- and nothing in the app has read since 2026-09-20. It does not by itself stop the migration — send it back and decide.
select 'STOP-CHECK get_parent_dashboard() is production''s measured body' as check,
       case when (select md5(prosrc) from pg_proc where oid = 'public.get_parent_dashboard()'::regprocedure) = '59242e2e635a4186f7f29cecd579da2f' then 'PASS' else 'FAIL' end as result
union all select 'STOP-CHECK delete_my_account(text) is the repo''s body',
       case when (select md5(prosrc) from pg_proc where oid = 'public.delete_my_account(text)'::regprocedure) = '10b6fa96e86a85e7cd4a1b8ec0d2e879' then 'PASS' else 'FAIL' end
union all select 'STOP-CHECK exactly 7 functions in public name the three tables (the migration drops or redefines all 7)',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.prosrc ~ '\mlearner_(progress|stats|state)\M') = 7 then 'PASS' else 'FAIL' end
union all select 'ledger does NOT yet have 20260928170000',
       case when not exists (select 1 from supabase_migrations.schema_migrations where version = '20260928170000') then 'PASS' else 'FAIL' end
union all select 'INFO rows in learner_progress', (select count(*)::text from public.learner_progress)
union all select 'INFO rows in learner_state', (select count(*)::text from public.learner_state)
union all select 'INFO rows in learner_stats', (select count(*)::text from public.learner_stats)
union all select 'INFO learner_stats rows with a value (xp, coins or a last-played date) — expected 0',
       (select count(*)::text from public.learner_stats where total_xp <> 0 or total_coins <> 0 or last_played_at is not null)
union all select 'INFO sessions rows (the table stays, read-only)', (select count(*)::text from public.sessions)
union all select 'INFO the sessions insert policy exists (expected 1; the migration drops it)',
       (select count(*)::text from pg_policies where schemaname = 'public' and tablename = 'sessions' and policyname = 'sessions: parent can insert');
