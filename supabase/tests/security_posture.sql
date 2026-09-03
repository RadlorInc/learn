-- The four schema-drift queries from docs/security.md § Schema drift check, as a runnable file.
-- Run against TWO databases and diff the outputs: same query, two instruments, must agree.
-- (The doc carried these as prose for six weeks, during which the baseline went stale.)
\pset footer off
\echo '== 1. RLS + policy count per table'
select c.relname, c.relrowsecurity as rls,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' order by 1;
\echo '== 2. Every access predicate'
select c.relname, p.polname, p.polcmd,
       array(select rolname from pg_roles where oid = any(p.polroles)) as roles,
       pg_get_expr(p.polqual, p.polrelid)      as using_expr,
       pg_get_expr(p.polwithcheck, p.polrelid) as check_expr
from pg_policy p join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' order by 1, 3, 2;
\echo '== 3. Function security posture'
select p.proname, p.prosecdef as definer,
       (p.proconfig is null or not exists (
          select 1 from unnest(p.proconfig) c where c like 'search_path=%')) as search_path_unpinned,
       coalesce(array_to_string(p.proacl::text[], ' | '), 'DEFAULT = PUBLIC EXECUTE') as acl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f' order by p.prosecdef desc, 1;
\echo '== 4. COLUMN-level grants (V12 lives here)'
select table_name, grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and grantee in ('anon','authenticated')
  and privilege_type in ('INSERT','UPDATE') order by 1, 2, 3;
\echo '== 5. Fingerprint'
select 'public tables'      as what, count(*) from pg_tables where schemaname='public'
union all select 'public functions', count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
union all select 'policies',         count(*) from pg_policies where schemaname='public'
union all select 'auth.users',       count(*) from auth.users
union all select 'auth.identities',  count(*) from auth.identities
union all select 'learners',         count(*) from public.learners
union all select 'chapters',         count(*) from public.chapters
union all select 'cron jobs',        count(*) from cron.job
-- ⚠️ Triggers were NOT in this fingerprint until 2026-09-03, and their absence let it report
-- "identical" on a restore that was missing `on_auth_user_created` on auth.users — i.e. one where
-- every FUTURE signup would get an auth row and no profile, silently, because the existing
-- profiles came across in the data dump. A schema dump does not carry triggers defined on a
-- MANAGED schema's tables, so this is exactly the class the diff has to be able to see.
-- Caught by the RLS suite, not by this file; it is here so the fingerprint cannot miss it again.
union all select 'triggers (auth)',  count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid
                                     join pg_namespace n on n.oid=c.relnamespace
                                     where not t.tgisinternal and n.nspname='auth'
union all select 'triggers (public)', count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid
                                     join pg_namespace n on n.oid=c.relnamespace
                                     where not t.tgisinternal and n.nspname='public'
-- sessions / learner_events deliberately ABSENT: they grow on their own (gameplay, and the
-- 03:17 prune), so a strict diff on them turns a correct restore red if a child is playing.
order by 1;
