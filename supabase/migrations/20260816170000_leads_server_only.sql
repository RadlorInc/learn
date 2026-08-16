-- Close the anonymous INSERT surface on diagnostic_leads (launch-plan finding #9).
--
-- The 2026-07-04 migration opened it deliberately and said so: "standard email-capture pattern …
-- spam is the inherent tradeoff of public capture". The tradeoff was real, and the mitigation it
-- named ("Supabase Auth rate limits") does not apply — this is a PostgREST table write, not an auth
-- call, so nothing was rate-limiting it at all. Anyone with the public anon key (which is public by
-- design, it ships in the JS bundle) could POST this table for ever, for free.
--
-- Capture now goes through `/api/lead`, which rate-limits by IP and validates the address. That
-- route authenticates with the service-role key where one is set, so revoking anon here does not
-- break it.
--
-- ⚠️ ORDER DOES NOT MATTER, ON PURPOSE. The route works with or without this migration, so it can
-- ship first and this can be applied whenever — there is no window where lead capture is broken.
-- What this migration buys is closing the OLD path, which otherwise stays open beside the new one.
--
-- ⚠️ IF NO SERVICE-ROLE KEY IS SET IN THE DEPLOYMENT, DO NOT APPLY THIS YET: the route falls back to
-- the anon key, and revoking the grant would then silently stop lead capture (the client treats it as
-- best-effort and never reports a failure). Set SUPABASE_SERVICE_ROLE_KEY in Vercel first, confirm a
-- lead lands, then apply.

revoke insert on public.diagnostic_leads from anon;

drop policy if exists "diagnostic_leads: insert" on public.diagnostic_leads;

-- `authenticated` keeps the policy: a signed-in parent starting a checkup for a second child is a
-- real path, it is not anonymous, and it is already rate-limited by having to hold a session.
create policy "diagnostic_leads: insert" on public.diagnostic_leads
  for insert to authenticated
  with check (char_length(email) between 3 and 254);

-- Unchanged and restated so the whole story is in one file: still no SELECT/UPDATE/DELETE policy and
-- no SELECT grant, so nobody can read or enumerate leads through the API.
