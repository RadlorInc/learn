-- ⚠️ APPLY NOTE (added 2026-09-24, comment only — no statement below changed). This file first reached
-- `main` in #192 (5ab91bd), whose Deploy run went red on an unrelated test, so `migrate-prod` was skipped
-- and nothing was applied. `migrate-prod` runs only when a push's own range touches supabase/migrations/,
-- so the fix PR carries this comment on purpose: its merge is the push that offers this migration to
-- production, behind the `production-db` approval, after a fresh backup.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- B3 IS CANCELLED ON EVERY PATH WHERE A CONSENT STOPS BEING GRANTED — BY A QUEUE THE DATABASE FILLS.
--
-- B3 (the second email-plus message, "Yesterday you gave permission…") is handed to Resend at grant
-- time with `scheduled_at` a day ahead; its id is in `parental_consents.second_email_provider_id`.
-- Until this file only the email-link withdrawal cancelled it. Deleting the child from the dashboard
-- did not, and closing the account did not — and closing the account DELETES the consent row
-- (`parent_id … on delete cascade`), so the id was gone before anything could use it.
--
-- ⚠️ WHY A TRIGGER AND NOT "CALL THE CANCEL ROUTE FIRST". Resend cannot be called from SQL, so the
-- cancel itself must happen on a server. But cancelling BEFORE the deletion is wrong in both
-- directions: if the deletion then fails (a stale sign-in on account close is the COMMON case) a
-- consent that still stands has lost its second email, which email-plus requires; and cancelling
-- AFTER it loses the id on account close. So the id is captured IN THE SAME TRANSACTION as the state
-- change or delete, into a table with no foreign key that the cascade cannot reach — whatever path
-- ended the consent: the email link, "Delete <name>'s profile", "Close your account", a deletion in
-- the dashboard's auth screen, or a D6-style SQL clear. A server drains the queue afterwards
-- (`drainB3Cancellations` in src/features/consent/server.ts) and records each outcome here.
--
-- ⚠️ "EXPIRY" CANNOT END A GRANTED CONSENT, so it is not a path here. `consent_guard_update` allows
-- exactly one move out of `granted` (→ withdrawn), and `consent_expire_stale` touches only
-- `pending`. The trigger does not rely on that: it fires on ANY move out of `granted`.
--
-- DEPLOY ORDER: EITHER. Client first: the drain finds no function (PGRST202) and does nothing, and
-- the email-link withdrawal falls back to its old direct cancel. This file first: the queue fills
-- and waits for the client; nothing reads it until then.
--
-- ⚠️⚠️ SECURITY CHANGE, CALLED OUT: one new SECURITY DEFINER function, the trigger function below.
-- DEFINER because a cascade from `auth.users` runs as whichever role deleted the user (the auth
-- admin, from the dashboard), which has no rights on this table — as INVOKER it would make deleting
-- a user FAIL. search_path pinned; EXECUTE revoked from public, anon, authenticated (it returns
-- `trigger`, so it cannot be called over the API anyway). The two drain functions are INVOKER and
-- executable by service_role only; the table is invisible to anon and authenticated.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

create table if not exists public.consent_b3_cancellations (
  provider_id    text primary key,          -- Resend's id for the scheduled B3
  consent_id     uuid not null,             -- ⚠️ NO FOREIGN KEY: it must outlive the consent row
  scheduled_for  timestamptz not null,
  queued_at      timestamptz not null default now(),
  queued_because text not null check (queued_because in ('withdrawn', 'deleted')),
  attempted_at   timestamptz,
  -- null = not tried yet · 'cancelled' · 'refused: …' (Resend said no — already cancelled or sent;
  -- final, not retried) · 'error: …' (Resend unreachable or 5xx; retried by the next drain).
  cancel_result  text
);

alter table public.consent_b3_cancellations enable row level security;
revoke all on public.consent_b3_cancellations from public, anon, authenticated;
grant select, update on public.consent_b3_cancellations to service_role;
-- (On Supabase, default privileges also give service_role INSERT/DELETE on every new table; the server
-- uses only the two functions below. Measured on a local stack: anon/authenticated have nothing.)

create or replace function public.consent_queue_b3_cancel()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.state = 'granted'
     and old.second_email_provider_id is not null
     and old.second_notice_scheduled_for > now()
     and (tg_op = 'DELETE' or new.state is distinct from 'granted') then
    insert into public.consent_b3_cancellations (provider_id, consent_id, scheduled_for, queued_because)
    values (old.second_email_provider_id, old.id, old.second_notice_scheduled_for,
            case when tg_op = 'DELETE' then 'deleted' else 'withdrawn' end)
    on conflict (provider_id) do nothing;
  end if;
  return null;
end
$$;
revoke all on function public.consent_queue_b3_cancel() from public, anon, authenticated;

drop trigger if exists trg_consent_queue_b3_cancel on public.parental_consents;
create trigger trg_consent_queue_b3_cancel
  after update of state or delete on public.parental_consents
  for each row execute function public.consent_queue_b3_cancel();

-- Consents that stopped being granted before this file, whose B3 is still ahead (D6's, for one).
-- A B3 already cancelled by hand comes back from Resend as 'refused', which is recorded, not an error.
insert into public.consent_b3_cancellations (provider_id, consent_id, scheduled_for, queued_because)
select c.second_email_provider_id, c.id, c.second_notice_scheduled_for, 'withdrawn'
  from public.parental_consents c
 where c.state = 'withdrawn' and c.second_email_provider_id is not null
   and c.second_notice_scheduled_for > now()
on conflict (provider_id) do nothing;

-- ── The drain's two calls. INVOKER: service_role's table grants are all they need. ────────────────
/** What still needs a cancel: due in the future, never tried or last try failed transiently. */
create or replace function public.consent_b3_due()
returns table (provider_id text)
language sql
stable
set search_path = public, pg_temp
as $$
  select q.provider_id from public.consent_b3_cancellations q
   where q.scheduled_for > now()
     and (q.cancel_result is null or q.cancel_result like 'error:%')
   order by q.queued_at;
$$;

/** Record one outcome. Never overwrites a settled one, so two drains racing cannot turn a
 *  'cancelled' into the 'refused' the second cancel gets back. */
create or replace function public.consent_b3_record(p_provider_id text, p_result text)
returns void
language sql
set search_path = public, pg_temp
as $$
  update public.consent_b3_cancellations
     set attempted_at = now(), cancel_result = p_result
   where provider_id = p_provider_id
     and (cancel_result is null or cancel_result like 'error:%');
$$;

revoke all on function public.consent_b3_due() from public, anon, authenticated;
grant execute on function public.consent_b3_due() to service_role;
revoke all on function public.consent_b3_record(text, text) from public, anon, authenticated;
grant execute on function public.consent_b3_record(text, text) to service_role;
