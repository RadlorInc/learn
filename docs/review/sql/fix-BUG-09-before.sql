-- BUG-09 — BEFORE applying 20260926100100_prune_keeps_granted_consent.sql. READ-ONLY (SELECT only). Rafi runs it.
-- Builds on docs/review/sql/bugs-unconfirmed-granted.sql (the reviewer's query).

-- 1. Has the defect already had material? Consents that are (or were) granted, on accounts still unconfirmed.
--   at_risk_now        — granted/withdrawn consents whose parent is unconfirmed AND older than 3 days: the prune
--                        deletes these accounts (and the records) TONIGHT. >0 = apply before 03:37 UTC.
--   at_risk_later      — the same, but the account is younger than 3 days: deleted once it passes the cutoff.
--   positive_control   — every granted/withdrawn consent. Must be >0, or this is the wrong project/table.
select
  count(*) filter (where u.email_confirmed_at is null and u.created_at <  now() - interval '3 days') as at_risk_now,
  count(*) filter (where u.email_confirmed_at is null and u.created_at >= now() - interval '3 days') as at_risk_later,
  count(*)                                                                                        as positive_control
from public.parental_consents c
join auth.users u on u.id = c.parent_id
where c.state in ('granted', 'withdrawn');

-- 2. The current function (expect NO parental_consents guard), and its security posture.
--   has_consent_guard  — false before the migration.
--   definer            — expect true.   config — expect search_path=public.
--   api_callable       — expect false (anon/authenticated cannot execute it).
select pg_get_functiondef(p.oid) ~ 'parental_consents'                                   as has_consent_guard,
       p.prosecdef                                                                       as definer,
       array_to_string(p.proconfig, ',')                                                 as config,
       has_function_privilege('anon', p.oid, 'EXECUTE')
         or has_function_privilege('authenticated', p.oid, 'EXECUTE')                    as api_callable,
       pg_get_userbyid(p.proowner)                                                       as owner
from pg_proc p where p.oid = 'public.prune_unconfirmed_users()'::regprocedure;

-- 3. The cron job that calls it. Expect one row: schedule '37 3 * * *', command 'select public.prune_unconfirmed_users()', active.
select jobname, schedule, command, active from cron.job where jobname = 'prune-unconfirmed-users';
