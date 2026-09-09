-- auth_events — durable login/logout history (structured account-access log).
--
-- WHY: Supabase keeps auth activity only in short-retention platform logs
-- (auth.audit_log_entries is empty on this project), and auth.users.last_sign_in_at
-- is latest-only. For a kids' product, "who accessed this account and when" is an
-- audit trail, not just a metric. History not captured is unrecoverable.
--
-- SHAPE mirrors learner_events: client-generated id for dedupe, insert-only from
-- the API. `signup` is NOT an event here — auth.users.created_at already records
-- it durably, and a pre-confirmation client has no session to insert with.
--
-- SECURITY: RLS on; authenticated may INSERT ONLY their own rows; nobody reads via
-- the API (no SELECT policy + revoked) — reads are service-role/dashboard only,
-- same posture as diagnostic_leads. Nothing sensitive is stored (no IP, no UA, no
-- tokens): user id + event + timestamp is the whole record.

create table public.auth_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  event      text not null check (event in ('login', 'logout')),
  client_id  uuid unique,                       -- client-side dedupe on retry
  created_at timestamptz not null default now()
);

create index auth_events_user_time on public.auth_events (user_id, created_at);

alter table public.auth_events enable row level security;

create policy "own inserts only" on public.auth_events
  for insert to authenticated
  with check (user_id = (select auth.uid()));

revoke all on public.auth_events from anon, authenticated;
grant insert on public.auth_events to authenticated;
