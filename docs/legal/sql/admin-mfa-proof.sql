-- ADMIN TWO-STEP VERIFICATION — PROOF after the migration 20261006120000 (read-only; counts and booleans only).
-- Expected: every row without INFO says PASS, and the INFO rows match the before-SQL's.
-- The behaviour itself (an aal1 admin refused, the same admin at aal2 served, a non-admin refused at aal2) is proved on
-- the repo's schema by src/__tests__/adminRequiresAal2.test.ts; on production the founder's check is to sign in at
-- /admin/login, give the code, and see /admin load.
select 'admin_assert() carries the aal2 check (the migration''s body)' as check,
       case when (select md5(prosrc) from pg_proc where oid = 'public.admin_assert()'::regprocedure) = 'e6087d9ae4f162a622d93e7e705f5d6a' then 'PASS' else 'FAIL' end as result
union all select 'admin_assert() still SECURITY DEFINER with search_path=public',
       case when (select prosecdef and array_to_string(proconfig, ',') = 'search_path=public' from pg_proc where oid = 'public.admin_assert()'::regprocedure) then 'PASS' else 'FAIL' end
union all select 'EXECUTE on admin_assert(): authenticated and service_role yes, anon no, PUBLIC no',
       case when has_function_privilege('authenticated', 'public.admin_assert()', 'execute')
             and has_function_privilege('service_role', 'public.admin_assert()', 'execute')
             and not has_function_privilege('anon', 'public.admin_assert()', 'execute')
             and not exists (select 1 from pg_proc p, aclexplode(p.proacl) x where p.oid = 'public.admin_assert()'::regprocedure and x.grantee = 0)
            then 'PASS' else 'FAIL' end
union all select 'ledger has 20261006120000',
       case when exists (select 1 from supabase_migrations.schema_migrations where version = '20261006120000') then 'PASS' else 'FAIL' end
union all select 'every admin has a verified authenticator',
       case when exists (select 1 from public.admin_users)
             and not exists (select 1 from public.admin_users a
                              where not exists (select 1 from auth.mfa_factors f
                                                 where f.user_id = a.user_id and f.factor_type = 'totp' and f.status = 'verified'))
            then 'PASS' else 'FAIL' end
union all select 'INFO admins', (select count(*)::text from public.admin_users)
union all select 'INFO admins with a verified authenticator',
       (select count(*)::text from public.admin_users a
         where exists (select 1 from auth.mfa_factors f where f.user_id = a.user_id and f.factor_type = 'totp' and f.status = 'verified'));
