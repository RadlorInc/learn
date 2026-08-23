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
-- ⚠️ APPLIED 2026-08-24, and only after the precondition was PROVED rather than assumed. The
-- warning this replaces read: "IF NO SERVICE-ROLE KEY IS SET IN THE DEPLOYMENT, DO NOT APPLY THIS
-- YET — the route falls back to the anon key, and revoking the grant would then silently stop lead
-- capture (the client treats it as best-effort and never reports a failure)."
--
-- That was a one-way door, so it got a real check instead of a guess. `SUPABASE_SERVICE_ROLE_KEY`
-- was confirmed bound in the PRODUCTION runtime by POSTing a probe to /api/report-error and reading
-- the row back out of error_events — `sinkError` has no anon fallback, so a row there can ONLY mean
-- the service-role key is present, which is a stronger proof than "a lead landed" (that path falls
-- back to anon and would have looked identical either way).
--
-- ⚠️ IT TOOK FOUR PROBES. The first three returned nothing: the variable existed in Vercel but was
-- not ticked for the PRODUCTION environment, and env vars bind at deploy time, so each check also
-- needed a fresh production deployment. "The deploy succeeded" is not evidence; the row is.
--
-- Verified after applying:
--   · anon key → POST /rest/v1/diagnostic_leads  →  HTTP 401, 42501 permission denied  (was 201)
--   · has_table_privilege('anon', 'diagnostic_leads', 'INSERT')  →  false
--   · POST /api/lead  →  200, and the row landed  (capture still works, via the service-role key)
--   · 1.15 MB of production-served JS across 22 chunks  →  zero `sb_secret_`, only the
--     `sb_publishable_` anon key that is public by design. Positive control: the grep DOES find
--     the anon key, so its silence on the secret one means something.

revoke insert on public.diagnostic_leads from anon;

drop policy if exists "diagnostic_leads: insert" on public.diagnostic_leads;

-- `authenticated` keeps the policy: a signed-in parent starting a checkup for a second child is a
-- real path, it is not anonymous, and it is already rate-limited by having to hold a session.
create policy "diagnostic_leads: insert" on public.diagnostic_leads
  for insert to authenticated
  with check (char_length(email) between 3 and 254);

-- Unchanged and restated so the whole story is in one file: still no SELECT/UPDATE/DELETE policy and
-- no SELECT grant, so nobody can read or enumerate leads through the API.
