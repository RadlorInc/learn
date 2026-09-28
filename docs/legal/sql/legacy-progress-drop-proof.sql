-- LEGACY PROGRESS TABLES — PROOF after the migration 20260928170000 (read-only; counts and booleans only). Every row
-- should say PASS.
select 'ledger has 20260928170000' as check,
       case when exists (select 1 from supabase_migrations.schema_migrations where version = '20260928170000') then 'PASS' else 'FAIL' end as result
union all select 'learner_progress, learner_stats and learner_state are gone',
       case when not exists (select 1 from information_schema.tables where table_schema = 'public'
                             and table_name in ('learner_progress', 'learner_stats', 'learner_state')) then 'PASS' else 'FAIL' end
union all select 'no function in public names them',
       case when not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                             where n.nspname = 'public' and p.prosrc ~ '\mlearner_(progress|stats|state)\M') then 'PASS' else 'FAIL' end
union all select 'sync_session, sync_diagnostic, init_learner_stats, get_learner_bootstrap, get_insights_rollup are gone',
       case when not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
                             and p.proname in ('sync_session', 'sync_diagnostic', 'init_learner_stats', 'get_learner_bootstrap', 'get_insights_rollup')) then 'PASS' else 'FAIL' end
union all select 'no policy on sessions admits a write',
       case when not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sessions'
                             and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')) then 'PASS' else 'FAIL' end
union all select 'anon and authenticated hold no INSERT/UPDATE/DELETE on sessions, and authenticated still SELECTs it',
       case when not has_table_privilege('authenticated', 'public.sessions', 'INSERT') and not has_table_privilege('authenticated', 'public.sessions', 'UPDATE')
             and not has_table_privilege('authenticated', 'public.sessions', 'DELETE') and not has_table_privilege('anon', 'public.sessions', 'INSERT')
             and has_table_privilege('authenticated', 'public.sessions', 'SELECT') then 'PASS' else 'FAIL' end
union all select 'get_parent_dashboard() is the new body',
       case when (select md5(prosrc) from pg_proc where oid = 'public.get_parent_dashboard()'::regprocedure) = '3d9b363b90c0ed52579e9cf15c8e2219' then 'PASS' else 'FAIL' end
union all select 'delete_my_account(text) is the new body, still SECURITY DEFINER with search_path=public',
       case when (select md5(prosrc) = 'da235db87dc8e11c18bbf4f4b714ded2' and prosecdef and proconfig = array['search_path=public']
                  from pg_proc where oid = 'public.delete_my_account(text)'::regprocedure) then 'PASS' else 'FAIL' end
union all select 'authenticated can still call delete_my_account and get_parent_dashboard',
       case when has_function_privilege('authenticated', 'public.delete_my_account(text)', 'EXECUTE')
             and has_function_privilege('authenticated', 'public.get_parent_dashboard()', 'EXECUTE') then 'PASS' else 'FAIL' end
union all select 'the stats trigger on learners is gone',
       case when not exists (select 1 from pg_trigger where tgname = 'on_learner_created_stats') then 'PASS' else 'FAIL' end;
