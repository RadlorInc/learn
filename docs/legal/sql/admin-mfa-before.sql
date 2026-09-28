-- ADMIN TWO-STEP VERIFICATION — BEFORE the migration 20260928200000 (read-only; counts and booleans only — no names,
-- emails or ids). Run it in the SQL editor BEFORE merging, and again right before approving the production-db run.
-- Expected: every row without INFO says PASS.
--   · A FAIL in a STOP-CHECK row about admin_assert means production's function is not the repo's: do NOT apply.
--   · A FAIL in "every admin has a verified authenticator" means applying now would lock that admin out of /admin
--     (the enrol page included): finish /admin/mfa first (docs/runbooks/admin-access.md), then run this again.
-- Rehearsed on the repo's schema by src/__tests__/adminRequiresAal2.test.ts.
select 'STOP-CHECK admin_assert() is the repo''s body (20260905150000)' as check,
       case when (select md5(prosrc) from pg_proc where oid = 'public.admin_assert()'::regprocedure) = '58c770f2aa23d2e8546ca9d8e42ddd7b' then 'PASS' else 'FAIL' end as result
union all select 'STOP-CHECK admin_assert() is SECURITY DEFINER with search_path=public',
       case when (select prosecdef and array_to_string(proconfig, ',') = 'search_path=public' from pg_proc where oid = 'public.admin_assert()'::regprocedure) then 'PASS' else 'FAIL' end
union all select 'STOP-CHECK every admin has a verified authenticator (and there is at least one admin)',
       case when exists (select 1 from public.admin_users)
             and not exists (select 1 from public.admin_users a
                              where not exists (select 1 from auth.mfa_factors f
                                                 where f.user_id = a.user_id and f.factor_type = 'totp' and f.status = 'verified'))
            then 'PASS' else 'FAIL' end
union all select 'ledger does NOT yet have 20260928200000',
       case when not exists (select 1 from supabase_migrations.schema_migrations where version = '20260928200000') then 'PASS' else 'FAIL' end
union all select 'EXECUTE on admin_assert(): authenticated yes, anon no',
       case when has_function_privilege('authenticated', 'public.admin_assert()', 'execute')
             and not has_function_privilege('anon', 'public.admin_assert()', 'execute') then 'PASS' else 'FAIL' end
union all select 'INFO admins', (select count(*)::text from public.admin_users)
union all select 'INFO admins with a verified authenticator',
       (select count(*)::text from public.admin_users a
         where exists (select 1 from auth.mfa_factors f where f.user_id = a.user_id and f.factor_type = 'totp' and f.status = 'verified'))
union all select 'INFO accounts that are NOT admins and have any authenticator (nothing in the app enrols one: expect 0)',
       (select count(distinct f.user_id)::text from auth.mfa_factors f where f.user_id not in (select user_id from public.admin_users));
