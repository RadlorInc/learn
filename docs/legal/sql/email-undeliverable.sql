-- EMAIL_UNDELIVERABLE: SEE ONE ADDRESS'S LISTING, AND LIFT IT (the founder runs it in the Supabase SQL editor — the
-- agent never does). Used from docs/runbooks/support.md → Email bounces. Table: migration 20261007000000.
--
-- The table holds sha256(lower(btrim(address))) in hex, never the address, so each query hashes the one placeholder,
-- '<address>' — the address the parent wrote from. Run the queries one at a time. Paste results to the agent in chat
-- only, never into a PR, issue or file.
--
-- Checked on a throwaway supabase/postgres 17 container with migration 20261007000000, 2026-10-06: query 1 found a row
-- the app's own code had hashed (address typed with other case and spaces), and no row for an unlisted address;
-- query 2 removed that row and answered "true".

-- ── 1. Is this address listed? (read-only) ──────────────────────────────────────────────────────────────────────
-- Answers: are we refusing to email this address, why, and since when?
--   no row                → we are NOT blocking it. If they still get nothing, look in Resend → Emails / Suppressions.
--   reason = 'bounced'    → an email to it bounced permanently (no such mailbox, a typo). first_at / last_at say when.
--   reason = 'complained' → the recipient marked one of our emails as spam. Lift only on a written request from it.
--   expires               → when the nightly prune deletes the listing by itself (12 months after last_at).
select reason, first_at, last_at, last_at + interval '12 months' as expires
  from public.email_undeliverable
 where email_sha256 = encode(sha256(convert_to(lower(btrim('<address>')), 'UTF8')), 'hex');

-- ── 2. Lift it (WRITES; only after support.md's step 3 holds) ───────────────────────────────────────────────────────
-- Answers: was exactly one listing removed?
--   one row "true"  → lifted. Now remove the address in Resend → Suppressions too, or Resend keeps dropping it.
--   no row          → it was not listed (or the address has a typo here): nothing changed.
delete from public.email_undeliverable
 where email_sha256 = encode(sha256(convert_to(lower(btrim('<address>')), 'UTF8')), 'hex')
returning true as lifted;
