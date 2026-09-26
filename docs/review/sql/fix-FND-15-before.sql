-- FND-15 — BEFORE applying 20260926100600_deletion_audit_trail.sql. READ-ONLY (SELECT only). Rafi runs it.
-- Shows the defect: there is nowhere a deletion is recorded, and the deletion functions write nothing.

-- 1. Is there a deletion log?  log_table: NULL = no table exists (the defect). Expected before: NULL.
select to_regclass('public.deletion_log') as log_table;

-- 2. The deletion functions as they stand.
--    fn          : the function signature
--    definer     : SECURITY DEFINER (expected true for all eight — the migration must keep it)
--    config      : its pinned search_path (the migration must keep it byte-identical)
--    writes_log  : does the body mention deletion_log? Expected before: false for every row.
--    md5         : md5 of the body — compare with the proof query after, to see which bodies changed
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
-- Expected before: delete_child_data appears as (uuid) — ONE argument.
-- ⚠️ STOP-CHECK before applying. This migration REPLACES these bodies with the repo's copy plus the FND-15 lines,
-- so production's bodies must equal the repo's today. md5 of each body as the repo builds it (PGlite, 2026-09-26):
--   consent_withdraw(text)          71f7264f054039a956c7163f65aa012a
--   consent_withdraw_account(uuid)  1f47837a90c7d5f73a8141aee1dcb571
--   delete_child_data(uuid)         8173713aca5112d25940860610e2306f
--   delete_learner(uuid)            bc8d2f779feec562bae697632fab663d
--   delete_my_account(text)         9ed5e910843d0573020593897583561d   (= the md5 20260917090504 records for production)
--   prune_diagnostic_items()        e47251fc78dab0021c0cd82fab91dc2d
--   prune_error_events()            af3a0931e51d4cbdea2035a4082a98d2
--   prune_unconfirmed_users()       accd7ef284bf56d099eaf0bf2b1498bb
-- Any row that differs means production has a body the repo does not: do NOT apply; send the difference back.

-- 3. The purge job's command.  writes_log: expected before false.
select jobname, schedule, position('deletion_log' in command) > 0 as writes_log
  from cron.job where jobname = 'purge-old-learner-events';
