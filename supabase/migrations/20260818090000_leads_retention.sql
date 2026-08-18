-- Retention for `diagnostic_leads` — the last table holding child-adjacent PII with no bound.
--
-- Found by a red-team pass, and it was hit from three directions at once:
--   · a parent asking "delete everything about my child" — `deleteLearnerPermanently` drops the
--     `learners` row and every child table cascades off it, but a LEAD has no learner_id and no
--     user_id, so nothing cascades and no parent-facing control can see or remove it;
--   · a COPPA read — the row is {email, band}, i.e. a parent's address tied to a child's AGE BAND,
--     collected BEFORE any account exists, and "keep forever" is not a lawful default for that;
--   · the app's own published copy, which promises deletion "at any time" and cannot honour it here.
--
-- `error_events` and `learner_events` already prune at 90 days on this same 03:17 slot. Leads are
-- different in kind — a lead is a person who asked to hear back, so 90 days would delete the
-- funnel — hence 24 months: long enough that no real follow-up is lost, short enough to be a
-- retention period rather than "for ever".
--
-- ⚠️ NOT APPLIED TO PROD BY THIS COMMIT. Prod DDL is the founder's to run (see handoff).
-- ⚠️ AND THIS IS THE SMALLER HALF OF THE LEADS PROBLEM. The anon INSERT grant is still open, so
-- anyone holding the public anon key can POST /rest/v1/diagnostic_leads directly and skip
-- /api/lead's 6/min limit — reproduced, HTTP 201. Closing that is
-- `20260816170000_leads_server_only.sql`, which CANNOT be applied until SUPABASE_SERVICE_ROLE_KEY
-- is set in Vercel (the route falls back to the anon key, so revoking the grant first stops lead
-- capture dead and silently). Retention bounds how long the junk lives; it does not stop the junk.
create extension if not exists pg_cron;

create or replace function public.prune_diagnostic_leads()
returns void
language sql
security definer
set search_path to 'public'
as $$
  delete from public.diagnostic_leads where created_at < now() - interval '24 months';
$$;

-- Same lock-down the error-events prune got: the cron job runs as the table owner and needs none
-- of PostgREST's roles to be able to call this.
revoke all on function public.prune_diagnostic_leads() from public, anon, authenticated;

-- Idempotent: unschedule first so re-running this migration cannot stack duplicate jobs.
select cron.unschedule('prune-diagnostic-leads')
where exists (select 1 from cron.job where jobname = 'prune-diagnostic-leads');

select cron.schedule('prune-diagnostic-leads', '17 3 * * *', $$select public.prune_diagnostic_leads()$$);
