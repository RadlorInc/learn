-- LEARNER DELETE — BEFORE the migration 20260928160000 (read-only; counts and booleans only). Run it in the SQL editor
-- BEFORE approving the production-db run, and keep the output. Every row without INFO should say PASS.
-- The INFO rows say what the migration will change; the proof file expects the opposite.
select 'ledger does NOT yet have 20260928160000' as check,
       case when not exists (select 1 from supabase_migrations.schema_migrations where version = '20260928160000') then 'PASS' else 'FAIL' end as result
union all select 'delete_learner(uuid) exists and is SECURITY DEFINER',
       case when (select prosecdef from pg_proc where oid = 'public.delete_learner(uuid)'::regprocedure) then 'PASS' else 'FAIL' end
union all select 'authenticated can call delete_learner(uuid)',
       case when has_function_privilege('authenticated', 'public.delete_learner(uuid)', 'EXECUTE') then 'PASS' else 'FAIL' end
union all select 'INFO policies on learners that admit DELETE (expected 1; the migration drops it)',
       (select count(*)::text from pg_policies where schemaname = 'public' and tablename = 'learners' and cmd in ('DELETE', 'ALL'))
union all select 'INFO authenticated holds DELETE on learners (expected true; the migration revokes it)',
       has_table_privilege('authenticated', 'public.learners', 'DELETE')::text
union all select 'INFO policies on learners in total (expected 4)',
       (select count(*)::text from pg_policies where schemaname = 'public' and tablename = 'learners');
