-- LEARNER DELETE — PROOF after the migration 20260928160000 (read-only; counts and booleans only). Every row should
-- say PASS.
select 'ledger has 20260928160000' as check,
       case when exists (select 1 from supabase_migrations.schema_migrations where version = '20260928160000') then 'PASS' else 'FAIL' end as result
union all select 'no policy on learners admits DELETE',
       case when not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'learners' and cmd in ('DELETE', 'ALL')) then 'PASS' else 'FAIL' end
union all select 'anon and authenticated hold no DELETE on learners',
       case when not has_table_privilege('authenticated', 'public.learners', 'DELETE')
             and not has_table_privilege('anon', 'public.learners', 'DELETE') then 'PASS' else 'FAIL' end
union all select 'authenticated still holds SELECT, INSERT and UPDATE on learners',
       case when has_table_privilege('authenticated', 'public.learners', 'SELECT')
             and has_table_privilege('authenticated', 'public.learners', 'INSERT')
             and has_table_privilege('authenticated', 'public.learners', 'UPDATE') then 'PASS' else 'FAIL' end
union all select 'authenticated can still call delete_learner(uuid)',
       case when has_function_privilege('authenticated', 'public.delete_learner(uuid)', 'EXECUTE') then 'PASS' else 'FAIL' end
union all select 'policies left on learners: 3 (select, insert, update)',
       case when (select count(*) from pg_policies where schemaname = 'public' and tablename = 'learners') = 3 then 'PASS' else 'FAIL' end;
