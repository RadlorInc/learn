-- ============================================================================
-- ADDRESSES WE MUST STOP MAILING: A PERMANENT BOUNCE OR A SPAM COMPLAINT — SERVICE ROLE ONLY.
--
-- Filled by /api/email/resend-webhook (a signed Resend event: `email.bounced` with `bounce.type`
-- 'Permanent', or `email.complained`). Read by `sendEmail` (src/features/consent/server.ts) before
-- EVERY send, transactional included: a listed address is not sent to, and the caller is told
-- (`Undeliverable`), so no screen says "we sent you an email" when none can arrive.
--
-- ⚠️ THE ADDRESS IS NOT STORED: only sha256(lower(btrim(address))), hex. Lookups need equality only.
-- An unsalted hash of an address is pseudonymous, not anonymous (anyone holding the address can
-- compute it) — it keeps the address out of the table, the backups and every SELECT * a person runs.
--
-- Not `email_suppressions`: that table is the CAN-SPAM list (commercial only, permanent, needs a
-- token per row, stores the address). This one binds all mail, can be lifted by an operator
-- (docs/runbooks/support.md → Email bounces), and expires: 12 months after the last event.
--
-- No foreign key and no account link: a bounce belongs to an address, often one no account ever
-- confirmed. So it outlives account deletion (declared in src/core/accountDeletion.ts SURVIVORS)
-- until the nightly prune removes it.
--
-- ⚠️ Deploy order: none needed (expand). Code first is fine: `sendEmail` treats a missing table as
-- "nothing listed" and sends as before; the webhook records the event row and answers 200 without it.
-- ⚠️ Security: a new table with RLS on and NO policies, revoked from public/anon/authenticated. No
-- function, no SECURITY DEFINER. The prune job is plain SQL run by pg_cron as its owner.
-- ============================================================================

create table public.email_undeliverable (
  email_sha256 text primary key check (email_sha256 ~ '^[0-9a-f]{64}$'),
  reason       text not null check (reason in ('bounced', 'complained')),
  first_at     timestamptz not null default now(),
  last_at      timestamptz not null default now()
);

comment on table public.email_undeliverable is
  'Hashed addresses that hard-bounced or complained; sendEmail sends nothing to them. Service role only. Pruned 12 months after last_at.';

-- RLS on with NO policies: no row is visible or writable to any client role. The absence is the mechanism.
alter table public.email_undeliverable enable row level security;
-- service_role too: Supabase's default privilege grants it EVERYTHING (delete, truncate) on a new table, and a
-- grant only adds (measured on a local supabase/postgres 17 container, 2026-10-06). Then exactly what the server
-- needs. No delete: lifting one is an operator's SQL-editor write (docs/legal/sql/email-undeliverable.sql).
revoke all on public.email_undeliverable from public, anon, authenticated, service_role;
grant select, insert, update on public.email_undeliverable to service_role;

select cron.schedule('prune-email-undeliverable', '47 3 * * *',
  $$delete from public.email_undeliverable where last_at < now() - interval '12 months'$$);
