-- R0 / ARCHITECTURE.md — facts the migrations imply but only production can confirm.
-- NEEDS RAFI TO RUN (read-only; SELECTs only). Run each block separately in the Supabase SQL editor.
-- Nothing here writes. Paste the outputs back into docs/review/ARCHITECTURE.md §9 "Production confirmation".

-- ── 1. Tables in public: RLS on/forced, policy count, and whether the consent gate trigger is present.
--    Expect: every table carrying learner_id (except learner_access, learner_invites, subscription_seats,
--    parental_consents) has has_consent_gate = true. A learner_id table with false = an UNGATED child table.
--    A table with rls=true and policies=0 is deny-all to clients (intended for error_events, billing tables,
--    email_suppressions, admin tables; a BUG anywhere a browser reads/writes).
select c.relname,
       c.relrowsecurity                         as rls,
       c.relforcerowsecurity                    as rls_forced,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies,
       exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'learner_id'
                 and a.attnum > 0 and not a.attisdropped)          as has_learner_id,
       exists (select 1 from pg_trigger t where t.tgrelid = c.oid
                 and t.tgname = 'trg_enforce_child_consent' and not t.tgisinternal) as has_consent_gate,
       c.reltuples::bigint                      as approx_rows
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by has_learner_id desc, c.relname;

-- ── 2. Every trigger on public tables (the consent gate, learner cap, consent bind, B3 cancel queue, updated_at…).
--    Answers: which tables are gated and by what function; compare with ARCHITECTURE.md §6.
select c.relname as table_name, t.tgname, p.proname as function_name,
       pg_get_triggerdef(t.oid) as definition
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_proc p on p.oid = t.tgfoid
 where n.nspname in ('public') and not t.tgisinternal
 order by 1, 2;

-- ── 2b. Triggers on auth.users (profile creation on confirm, B3-cancel queue on delete, etc.).
select t.tgname, p.proname, pg_get_triggerdef(t.oid)
  from pg_trigger t join pg_proc p on p.oid = t.tgfoid
 where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal;

-- ── 3. Function posture: DEFINER, pinned search_path, who may EXECUTE.
--    Expect: no function with 'DEFAULT = PUBLIC EXECUTE'; every DEFINER pinned. Compare the EXECUTE list with
--    ARCHITECTURE.md §6 (service_role-only consent functions must NOT list authenticated/anon).
select p.proname,
       pg_get_function_identity_arguments(p.oid)  as args,
       p.prosecdef                                 as definer,
       (p.proconfig is null or not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')) as search_path_unpinned,
       coalesce(array_to_string(p.proacl::text[], ' | '), 'DEFAULT = PUBLIC EXECUTE') as acl,
       pg_get_userbyid(p.proowner)                 as owner
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prokind = 'f'
 order by p.prosecdef desc, p.proname;

-- ── 4. pg_cron jobs. Answers: which retention / consent jobs actually run and on what schedule.
--    Compare with ARCHITECTURE.md §7. (Requires the cron schema; if it errors, pg_cron is not installed.)
select jobid, jobname, schedule, active, command from cron.job order by jobname;

-- ── 4b. Did they run recently, and did they succeed? (last 14 days)
select j.jobname, d.status, count(*) as runs, max(d.start_time) as last_run
  from cron.job_run_details d join cron.job j on j.jobid = d.jobid
 where d.start_time > now() - interval '14 days'
 group by 1, 2 order by 1, 2;

-- ── 5. Column-level INSERT/UPDATE grants to client roles (the V12-style fixes live here).
select table_name, grantee, privilege_type, string_agg(column_name, ', ' order by column_name) as columns
  from information_schema.column_privileges
 where table_schema = 'public' and grantee in ('anon', 'authenticated')
   and privilege_type in ('INSERT', 'UPDATE')
 group by 1, 2, 3 order by 1, 2, 3;

-- ── 6. Table-level privileges held by anon (expect: nothing a child's data lives in).
select table_name, string_agg(privilege_type, ', ') as privs
  from information_schema.role_table_grants
 where table_schema = 'public' and grantee = 'anon'
 group by 1 order by 1;

-- ── 7. Ledger vs repo: which migration versions production has recorded (compare with supabase/migrations/).
select version, name from supabase_migrations.schema_migrations order by version desc limit 60;

-- ── 8. Outbound HTTP from the database (pg_net). Expect: none, or only what §7 of the doc lists.
select extname, extversion from pg_extension where extname in ('pg_net', 'http', 'pg_cron') order by 1;
