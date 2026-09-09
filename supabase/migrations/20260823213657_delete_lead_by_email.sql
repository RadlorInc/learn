-- Honour a "delete my email" request from a lead, on the day it arrives.
--
-- The privacy copy says: "If you gave us an email for the free check and never made an account,
-- write to us and we will delete it." That was true in intent and impossible in practice —
-- diagnostic_leads has no SELECT policy and no parent-facing control, so honouring it meant
-- hand-writing SQL under time pressure against a table holding real prospect emails. This is the
-- tool, built before it is needed rather than during the first request.
--
-- Case-insensitive and whitespace-tolerant, because the address in a support email will not
-- match the stored casing. Returns the number of rows removed so the reply to the person can be
-- specific ("removed" vs "we had nothing for that address") instead of a guess.
--
-- ⚠️ SERVICE-ROLE ONLY, same posture as prune_diagnostic_leads. Postgres gives a SECURITY
-- DEFINER function PUBLIC EXECUTE by default and Supabase exposes every public-schema function
-- at /rest/v1/rpc/<name> — without the REVOKE below, an anonymous caller could delete any lead
-- by guessing addresses, or enumerate which addresses exist from the return value. That is V19,
-- and it is why the REVOKE is part of the same migration rather than a follow-up.
create or replace function public.delete_lead_by_email(p_email text)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare n integer;
begin
  if p_email is null or length(btrim(p_email)) < 3 then
    raise exception 'an email address is required' using errcode = '22023';
  end if;
  delete from public.diagnostic_leads where lower(email) = lower(btrim(p_email));
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.delete_lead_by_email(text) from public, anon, authenticated;
