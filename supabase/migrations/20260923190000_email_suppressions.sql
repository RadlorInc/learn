-- ============================================================================
-- CAN-SPAM SUPPRESSION LIST (docs/legal/09 §7) — SERVICE ROLE ONLY.
--
-- One row per address that has been sent a COMMERCIAL email. `token` is the opaque random value in
-- that address's unsubscribe link (the address itself never goes in a URL), issued on the first
-- commercial email and reused after, so every email ever sent to the address carries a link that
-- still works. `suppressed_at` set = unsubscribed, permanently: nothing in the app clears it.
-- Transactional email (consent, security, receipts) never reads this table.
--
-- ⚠️ The token is stored as-is, not hashed as the consent tokens are: a consent token GRANTS
-- something, this one can only take an address off marketing, and the next email needs the same
-- link. The table is unreachable from the API for everyone but the server.
--
-- ⚠️ Deploy order: none needed. No commercial email is sent today; the code refuses to send one
-- (and the unsubscribe route answers 502) until this table exists, and transactional mail does not
-- depend on it.
-- ============================================================================

create table public.email_suppressions (
  email         text primary key check (email = lower(btrim(email)) and email <> ''),
  token         text not null unique check (token ~ '^[A-Za-z0-9_-]{43}$'),
  created_at    timestamptz not null default now(),
  suppressed_at timestamptz
);

comment on table public.email_suppressions is
  'CAN-SPAM suppression list (docs/legal/09 §7). suppressed_at set = no commercial email, ever. Service role only.';

-- RLS on with NO policies: no row is visible or writable to any client role. The absence is the mechanism.
alter table public.email_suppressions enable row level security;
revoke all on public.email_suppressions from public, anon, authenticated;
-- Explicit, so the server's access does not depend on a platform default privilege.
grant select, insert, update on public.email_suppressions to service_role;
