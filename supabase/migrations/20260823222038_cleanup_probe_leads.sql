-- Remove the two probe rows written while verifying the leads path on 2026-08-24.
--
--   runbook-probe@example.com   — baseline: proved /api/lead still worked BEFORE the anon revoke
--   postapply-probe@example.com — proved /api/lead still worked AFTER it, via the service-role key
--
-- (attacker-probe@example.com never landed — that POST was the anon-key attack, and it is now
-- rejected with 42501, which is the whole point of 20260823221818_leads_server_only.)
--
-- ⚠️ DELIBERATELY THROUGH delete_lead_by_email() RATHER THAN A RAW DELETE. Two reasons: it is the
-- first real exercise of the tool built for docs/runbooks/data-requests.md, so the runbook is
-- proven rather than merely written; and a raw DELETE against a table holding real prospect
-- addresses is exactly the thing that function exists to stop anyone hand-writing.
--
-- Idempotent by construction: on any database where these rows do not exist it deletes 0 and
-- returns 0, so replaying the history from zero is unaffected.
do $$
declare removed int := 0; n int;
begin
  n := public.delete_lead_by_email('runbook-probe@example.com');   removed := removed + n;
  n := public.delete_lead_by_email('postapply-probe@example.com'); removed := removed + n;
  raise notice 'probe leads removed: %', removed;
end $$;
