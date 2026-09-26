-- OPS-04 / OPS-07 / FND-11 — AFTER applying 20260926100300_ops_digest.sql. READ-ONLY, for Rafi in the SQL editor.
-- (The migration's own closing assertions already refused to commit if any of P1–P3 were false.)

-- P1. The drain now retries refused rows.
--   retries_refused : must be true
select pg_get_functiondef('public.consent_b3_due()'::regprocedure) like '%refused:%' as retries_refused;

-- P2. ops_digest's posture.
--   definer        : true (it must read cron.job_run_details)
--   search_path    : true = pinned
--   anon_exec / auth_exec : must both be false
--   service_exec   : must be true (the cron route calls it as service_role)
--   result_type    : integers, one boolean and text[] of job names — nothing else
select p.prosecdef as definer,
       exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%') as search_path,
       has_function_privilege('anon', p.oid, 'execute')          as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
       has_function_privilege('service_role', p.oid, 'execute')  as service_exec,
       pg_get_function_result(p.oid)                              as result_type
from pg_proc p where p.oid = 'public.ops_digest()'::regprocedure;

-- P3. What tomorrow's email will say. One row of counts; cron_readable must be true on Supabase
--     (false = pg_cron's run log could not be read, and the two cron columns mean nothing).
--     POSITIVE CONTROL: cron_jobs_failing lists any job with no run in 26 h, so if pg_cron were
--     silently stopped every job name would appear here.
select * from public.ops_digest();
