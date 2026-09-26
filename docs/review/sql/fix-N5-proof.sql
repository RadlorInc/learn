-- N5 — AFTER applying 20260926100800_consent_needs_confirmed_email.sql. READ-ONLY (SELECT only). Rafi runs it.

-- 1. Both bodies are the migration's, and the security posture did not move.
--    Expected md5 (PGlite, 2026-09-26):
--      consent_grant(text,text,timestamp with time zone)   cab8e71da0cbbbb685a7c3dc7b116d49
--      prune_unconfirmed_users()                           a8d0efdafc6e58ecd30e3ae78a6b7c15
--    definer true for both; config and owner exactly as the before-SQL showed; api_callable false for both.
select p.oid::regprocedure::text as fn, md5(p.prosrc) as md5, p.prosecdef as definer,
       array_to_string(p.proconfig, ',') as config, pg_get_userbyid(p.proowner) as owner,
       has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE') as api_callable,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as service_can_call
  from pg_proc p
 where p.oid in ('public.consent_grant(text, text, timestamptz)'::regprocedure, 'public.prune_unconfirmed_users()'::regprocedure)
 order by 1;
-- service_can_call: expect true for consent_grant (the consent page's server route calls it as service_role).

-- 2. The cron job still calls the prune by name. Expect one row, unchanged.
select jobname, schedule, command, active from cron.job where jobname = 'prune-unconfirmed-users';

-- 3. Live check (no SQL): sign up a NEW test parent, do NOT click the confirmation button, open the consent link a
--    second way (or wait for the confirmation link to expire) and tick the box → the page says "Please confirm your
--    email address first"; Resend shows the B3 it scheduled as Cancelled. Then confirm and tick → granted, one B3.
