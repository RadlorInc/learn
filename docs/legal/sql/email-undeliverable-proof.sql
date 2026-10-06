-- PROOF after migration 20261007000000_email_undeliverable (read-only; booleans and counts only — no hash, no
-- address; the founder runs it in the Supabase SQL editor on PRODUCTION — the agent never does).
-- Pre-registered (2026-10-06, before the result was seen): every row says PASS.
--   A FAIL on "ledger" → the migration did not apply; on RLS / policies / grants → the table is reachable by a role
--   it must not be (stop and tell the agent); on cron → entries will never expire (retention promise broken).
select 'ledger has 20261007000000' as check,
       case when exists (select 1 from supabase_migrations.schema_migrations where version = '20261007000000') then 'PASS' else 'FAIL' end as result
union all select 'table public.email_undeliverable exists',
       case when to_regclass('public.email_undeliverable') is not null then 'PASS' else 'FAIL' end
union all select 'RLS is on',
       case when (select relrowsecurity from pg_class where oid = to_regclass('public.email_undeliverable')) then 'PASS' else 'FAIL' end
union all select 'no policies (closed to every client role)',
       case when not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'email_undeliverable') then 'PASS' else 'FAIL' end
union all select 'anon and authenticated have no privilege at all',
       case when not exists (select 1 from information_schema.role_table_grants
                              where table_schema = 'public' and table_name = 'email_undeliverable'
                                and grantee in ('anon', 'authenticated', 'PUBLIC')) then 'PASS' else 'FAIL' end
union all select 'service_role: select, insert, update — and NOT delete or truncate',
       case when has_table_privilege('service_role', 'public.email_undeliverable', 'select')
             and has_table_privilege('service_role', 'public.email_undeliverable', 'insert')
             and has_table_privilege('service_role', 'public.email_undeliverable', 'update')
             and not has_table_privilege('service_role', 'public.email_undeliverable', 'delete')
             and not has_table_privilege('service_role', 'public.email_undeliverable', 'truncate') then 'PASS' else 'FAIL' end
union all select 'nightly prune job is scheduled',
       case when exists (select 1 from cron.job where jobname = 'prune-email-undeliverable' and active) then 'PASS' else 'FAIL' end
union all select 'INFO rows listed so far', (select count(*)::text from public.email_undeliverable);
