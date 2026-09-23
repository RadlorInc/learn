-- READ-ONLY. Run in production AFTER `migrate-prod` applied 20260923180000 + 20260923180100.
-- Expected: 11 rows, 1-8 and 11 PASS; 9-10 COMPARE against the numbers from r9-prune-before.sql.
-- A missing function, trigger or cron job prints FAIL (left joins), never a missing row.
with f as (
  select p.proname, p.prosecdef, array_to_string(p.proconfig, ',') as cfg,
         has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') as authd,
         pg_get_functiondef(p.oid) as def
    from pg_proc p where p.pronamespace = 'public'::regnamespace
     and p.proname in ('handle_new_user', 'prune_unconfirmed_users')
)
select * from (
  select 1 as n, 'ledger has both versions' as check_,
         case when (select count(*) from supabase_migrations.schema_migrations
                     where version in ('20260923180000', '20260923180100')) = 2 then 'PASS' else 'FAIL' end as result,
         'expected 2' as detail
  union all
  select 2, 'handle_new_user: DEFINER, search_path=public, no anon/authenticated EXECUTE',
         case when (prosecdef, cfg, anon, authd) is not distinct from (true, 'search_path=public', false, false) then 'PASS' else 'FAIL' end,
         format('definer=%s cfg=%s anon=%s authenticated=%s', prosecdef, cfg, anon, authd) from (select 1) one left join f on f.proname = 'handle_new_user'
  union all
  select 3, 'handle_new_user: only inserts once confirmed, idempotent',
         case when coalesce(def, '') like '%IF NEW.email_confirmed_at IS NOT NULL THEN%' and def like '%ON CONFLICT (id) DO NOTHING%' then 'PASS' else 'FAIL' end,
         'guard + on conflict present' from (select 1) one left join f on f.proname = 'handle_new_user'
  union all
  select 4, 'trigger fires on insert AND on update of email_confirmed_at',
         case when pg_get_triggerdef(t.oid) is not distinct from 'CREATE TRIGGER on_auth_user_created AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()'
              then 'PASS' else 'FAIL' end, coalesce(pg_get_triggerdef(t.oid), 'missing')
    from (select 1) one left join pg_trigger t on t.tgrelid = 'auth.users'::regclass and t.tgname = 'on_auth_user_created'
  union all
  select 5, 'prune_unconfirmed_users: DEFINER, search_path=public, no anon/authenticated EXECUTE',
         case when (prosecdef, cfg, anon, authd) is not distinct from (true, 'search_path=public', false, false) then 'PASS' else 'FAIL' end,
         format('definer=%s cfg=%s anon=%s authenticated=%s', prosecdef, cfg, anon, authd) from (select 1) one left join f on f.proname = 'prune_unconfirmed_users'
  union all
  select 6, 'prune_unconfirmed_users: predicate has all three conditions',
         case when coalesce(def, '') like '%email_confirmed_at is null%' and def like '%interval ''3 days''%'
                   and def like '%not exists (select 1 from public.learners l where l.created_by = u.id)%' then 'PASS' else 'FAIL' end,
         'unconfirmed + older than 3 days + no child' from (select 1) one left join f on f.proname = 'prune_unconfirmed_users'
  union all
  select 7, 'cron job prune-unconfirmed-users',
         case when (schedule, command, active) is not distinct from ('37 3 * * *', 'select public.prune_unconfirmed_users()', true) then 'PASS' else 'FAIL' end,
         format('schedule=%s command=%s active=%s', schedule, command, active)
    from (select 1) one left join cron.job j on j.jobname = 'prune-unconfirmed-users'
  union all
  select 8, 'no unconfirmed account older than 3 days without a child remains',
         case when count(*) = 0 then 'PASS' else 'FAIL' end, 'found ' || count(*)
    from auth.users u where u.email_confirmed_at is null and u.created_at < now() - interval '3 days'
     and not exists (select 1 from public.learners l where l.created_by = u.id)
  union all
  select 9, 'BEFORE: confirmed users — must equal the before-count', 'COMPARE',
         (select count(*) from auth.users where email_confirmed_at is not null)::text
  union all
  select 10, 'BEFORE: children — must equal the before-count', 'COMPARE', (select count(*) from public.learners)::text
  union all
  select 11, 'no profile without an auth user (cascade complete)',
         case when count(*) = 0 then 'PASS' else 'FAIL' end, 'found ' || count(*)
    from public.profiles p where not exists (select 1 from auth.users u where u.id = p.id)
) r order by n;
