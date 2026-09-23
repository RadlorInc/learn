-- READ-ONLY. Definitions only — no user data.
--   A. production's handle_new_user() and its auth.users trigger, in full (both differ from the repo)
--   B. every overload of touch_grades_updated_at / admin_learning / sync_recheck, fingerprinted against
--      the repo's final state (baseline + the 98 pre-2026-09-23 migrations) — an overload the repo does
--      not have shows as EXTRA
--   C. the complete statements of the 3 ledger rows that are not repo files, so they can be added to
--      the repo byte-for-byte
with expected(fn, def_md5, definer_config, exec_anon_auth_service) as (values
  ('admin_learning(integer)',                        '21094555b156fb6ca48cac4ceacc55a5', 'true / search_path=public',  'false/true/true'),
  ('sync_recheck(uuid,integer,text,boolean,uuid)',   '5871da3484227246e88962e59c2f3d5c', 'true / search_path=public',  'false/true/true'),
  ('touch_grades_updated_at()',                      '62f7f7f574ca922a3ede79f4c285b994', 'false / search_path=public', 'false/false/true')
),
actual as (
  select p.oid::regprocedure::text as fn, md5(pg_get_functiondef(p.oid)) as def_md5,
         p.prosecdef::text || ' / ' || coalesce(array_to_string(p.proconfig, ','), '') as definer_config,
         has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text
           || '/' || has_function_privilege('service_role', p.oid, 'EXECUTE')::text as exec_anon_auth_service
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('touch_grades_updated_at', 'admin_learning', 'sync_recheck')
)
select * from (
  select '0 DB' as section,
         format('public_tables=%s has_learners=%s ledger_rows=%s', (select count(*) from pg_tables where schemaname = 'public'),
                to_regclass('public.learners') is not null, (select count(*) from supabase_migrations.schema_migrations)) as name,
         null::text as status, null::text as expected, null::text as production
  union all
  select 'A handle_new_user', 'function definition', md5(pg_get_functiondef('public.handle_new_user()'::regprocedure)),
         'repo 20260908120000 = 2d03a8e3a8f5681bab165c50e15ce328; baseline-era = e3d885a0d6eeab9740ae5167de3f5dfc',
         pg_get_functiondef('public.handle_new_user()'::regprocedure)
  union all
  select 'A handle_new_user', 'trigger auth.users.on_auth_user_created', md5(pg_get_triggerdef(t.oid)),
         'repo 20260908120000 = b411227430bfc54cfd99da9eb4c3d8f6 (AFTER INSERT OR UPDATE OF email_confirmed_at); baseline-era = 786e53a33077b3a68f1ec248e238d18a (AFTER INSERT)',
         pg_get_triggerdef(t.oid)
    from pg_trigger t where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal
  union all
  select 'B functions', coalesce(e.fn, a.fn),
         case when a.fn is null then 'MISSING in production' when e.fn is null then 'EXTRA in production'
              when (a.def_md5, a.definer_config, a.exec_anon_auth_service) = (e.def_md5, e.definer_config, e.exec_anon_auth_service) then 'same'
              else 'DIFFERENT' end,
         e.def_md5 || ' | ' || e.definer_config || ' | ' || e.exec_anon_auth_service,
         a.def_md5 || ' | ' || a.definer_config || ' | ' || a.exec_anon_auth_service
    from expected e full join actual a on a.fn = e.fn
  union all
  select 'C ledger statements', m.version || '_' || m.name, md5(array_to_string(m.statements, E'\n')),
         coalesce(array_length(m.statements, 1), 0)::text || ' statement(s)', array_to_string(m.statements, E'\n')
    from supabase_migrations.schema_migrations m
   where m.version in ('20260629023502', '20260702113253', '20260905110530')
) r
order by section, name;
