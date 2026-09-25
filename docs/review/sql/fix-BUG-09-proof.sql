-- BUG-09 — AFTER applying 20260926100100_prune_keeps_granted_consent.sql. READ-ONLY (SELECT only). Rafi runs it.

-- 1. The live function carries the guard, and nothing else about it moved.
--   has_consent_guard  — expect true (the new `and not exists (… parental_consents … 'granted', 'withdrawn')` line).
--   definer            — expect true (unchanged).    config — expect search_path=public (unchanged).
--   api_callable       — expect false (unchanged).   owner — expect the same value section 2 of the before-SQL showed.
select pg_get_functiondef(p.oid) ~ 'parental_consents c where c\.parent_id = u\.id and c\.state in \(''granted'', ''withdrawn''\)'
                                                                                         as has_consent_guard,
       p.prosecdef                                                                       as definer,
       array_to_string(p.proconfig, ',')                                                 as config,
       has_function_privilege('anon', p.oid, 'EXECUTE')
         or has_function_privilege('authenticated', p.oid, 'EXECUTE')                    as api_callable,
       pg_get_userbyid(p.proowner)                                                       as owner
from pg_proc p where p.oid = 'public.prune_unconfirmed_users()'::regprocedure;

-- 2. The cron job still calls it by name. Expect one row, unchanged from the before-SQL's section 3.
select jobname, schedule, command, active from cron.job where jobname = 'prune-unconfirmed-users';

-- 3. After the next 03:37 UTC run: the job succeeded, and no granted/withdrawn consent vanished.
--   last_status        — expect 'succeeded' for the newest run after the apply.
select status as last_status, start_time from cron.job_run_details d
join cron.job j on j.jobid = d.jobid where j.jobname = 'prune-unconfirmed-users'
order by start_time desc limit 3;
--   granted_or_withdrawn_now — compare with positive_control from the before-SQL: it must not have gone DOWN
--                              because of the job (it can go up with new grants; a parent closing their own
--                              account also lowers it, so a drop means: look at who, before concluding).
select count(*) as granted_or_withdrawn_now from public.parental_consents where state in ('granted', 'withdrawn');
