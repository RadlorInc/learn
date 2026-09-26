-- FND-15 — AFTER applying 20260926100600_deletion_audit_trail.sql. READ-ONLY (SELECT only). Rafi runs it.
-- Proves the log exists, is unreachable from the API, and every deletion path now writes to it.

-- 1. The table.  rls: expected true · policies: expected 0 (deny-all by design)
select c.relrowsecurity as rls,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
  from pg_class c where c.oid = 'public.deletion_log'::regclass;

-- 2. Who can touch it.  Expected: anon and authenticated all false; service_role select true, the rest false.
select r.role,
       has_table_privilege(r.role, 'public.deletion_log', 'select') as can_select,
       has_table_privilege(r.role, 'public.deletion_log', 'insert') as can_insert,
       has_table_privilege(r.role, 'public.deletion_log', 'update') as can_update,
       has_table_privilege(r.role, 'public.deletion_log', 'delete') as can_delete
  from (values ('anon'), ('authenticated'), ('service_role')) r(role);

-- 3. The functions (same query as the before file).
--    Expected: all eight definer = true; config identical to the before run; delete_child_data now appears as
--    (uuid, text) and NOT as (uuid); writes_log true for delete_child_data, delete_my_account and the three
--    prune functions (delete_learner / consent_withdraw* call delete_child_data, so they read false here and
--    their md5 changes only by the path argument).
select p.oid::regprocedure::text                     as fn,
       p.prosecdef                                   as definer,
       array_to_string(p.proconfig, ',')             as config,
       position('deletion_log' in p.prosrc) > 0      as writes_log,
       md5(p.prosrc)                                 as md5
  from pg_proc p
 where p.pronamespace = 'public'::regnamespace
   and p.proname in ('delete_child_data', 'delete_learner', 'consent_withdraw_account', 'consent_withdraw',
                     'delete_my_account', 'prune_unconfirmed_users', 'prune_error_events', 'prune_diagnostic_items')
 order by 1;

-- 4. EXECUTE on the new delete_child_data.  Expected: all three false (only the DEFINER callers reach it).
select has_function_privilege('anon',          'public.delete_child_data(uuid, text)', 'execute') as anon,
       has_function_privilege('authenticated', 'public.delete_child_data(uuid, text)', 'execute') as authenticated,
       has_function_privilege('service_role',  'public.delete_child_data(uuid, text)', 'execute') as service_role;

-- 5. The purge job.  writes_log: expected true · schedule: expected '17 3 * * *' (unchanged)
select jobname, schedule, position('deletion_log' in command) > 0 as writes_log
  from cron.job where jobname = 'purge-old-learner-events';

-- 6. After the next 03:17–03:37 run, or after any deletion: rows per path. Counts only — no ids are selected.
select path, actor_kind, count(*) as rows, min(at) as first, max(at) as last
  from public.deletion_log group by 1, 2 order by 1, 2;
