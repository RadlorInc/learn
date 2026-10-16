-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- CLOSING THE ACCOUNT, OR WITHDRAWING CONSENT FOR EVERY CHILD, CANCELS THE PLAN AND REFUNDS THE UNUSED PART.
-- (Founder's decision, 6 October 2026; docs/legal/01 §4 and §5; docs/runbooks/billing.md.)
--
-- Stripe cannot be called from SQL, so the money moves on a server (`drainBillingCancellations`,
-- src/features/billing/closeRefund.ts). What this file does is make the REQUEST durable, in the same
-- transaction as the close or the withdrawal, exactly as 20260923200000 does for B3:
--
--   · closing the account deletes `subscriptions` (account_id … on delete cascade), and with it the only copy
--     of the Stripe subscription id. A trigger AFTER DELETE captures that id into `billing_cancellations`, a
--     table with no foreign key the cascade cannot reach — whatever path deleted the row: "Close your
--     account", the operator SQL, the auth dashboard.
--   · withdrawing for every child keeps the account, so nothing is deleted to trigger on. The one function
--     both withdraw-all doors run (`consent_withdraw_account`: Account → Withdraw…, and the account B3 link)
--     queues the account's subscription. A per-child withdrawal does NOT (not decided; out of scope).
--
-- `queued_at` is the moment the request was actioned: the refund is calculated from it, not from whenever
-- Stripe was reachable. The close is never blocked or rolled back by Stripe: a deletion request has a legal
-- deadline, a refund can wait for a retry. A row the server could not settle stays due, is retried by every
-- drain (the dashboard right after, the daily cron) and is flagged in the ops digest until it is settled.
--
-- The table holds Stripe's subscription id and nothing that names a family: no account id, no email. It
-- outlives the account on purpose (declared in src/core/accountDeletion.ts SURVIVORS).
--
-- DEPLOY ORDER: EITHER. App first: the drain gets PGRST202 and does nothing; closes and withdrawals behave as
-- before (no automatic cancel), and the webhook acknowledges events for a closed account either way. This file
-- first: the queue fills and waits; nothing reads it until the app ships. Rows queued in between are drained
-- by the first drain after the app is live, with the refund still counted from `queued_at`.
--
-- ⚠️⚠️ SECURITY CHANGES, CALLED OUT.
--   · NEW SECURITY DEFINER function `billing_queue_cancel_on_delete()` (the trigger function). DEFINER because a
--     cascade from `auth.users` runs as whichever role deleted the user (the auth admin, from the dashboard),
--     which has no rights on the queue — as INVOKER it would make deleting a user FAIL. search_path pinned;
--     EXECUTE revoked from public, anon, authenticated (it returns `trigger`, so it cannot be called anyway).
--   · REDEFINED SECURITY DEFINER function `consent_withdraw_account(uuid)`: copied from 20260926100600 (its last
--     definition); the one added line is marked `-- CHANGED`. DEFINER, search_path, owner unchanged; its revoke
--     (public, anon, authenticated, service_role) is repeated verbatim.
--   · Two INVOKER functions for the drain, EXECUTE for service_role only.
--   · The new table: RLS on, NO policies, every privilege revoked from public, anon, authenticated and
--     service_role; service_role then gets SELECT and UPDATE only (the drain reads and records; the inserts
--     come only from the two DEFINER functions above).
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

create table if not exists public.billing_cancellations (
  stripe_subscription_id text primary key,   -- ⚠️ NO FOREIGN KEY: it must outlive the subscriptions row
  queued_because text not null check (queued_because in ('account_closed', 'consent_withdrawn')),
  queued_at      timestamptz not null default now(),   -- when the request was actioned: the refund counts from here
  attempted_at   timestamptz,
  -- null = not tried yet · 'done: …' (cancelled at Stripe; what was refunded, or why nothing was) · 'error: …'
  -- (Stripe unreachable or refused; retried by the next drain and flagged in the ops digest).
  result         text
);
comment on table public.billing_cancellations is
  'Stripe subscriptions to cancel now and refund pro rata, queued by account close / withdraw-all. Service role only. No link to an account.';

alter table public.billing_cancellations enable row level security;
revoke all on public.billing_cancellations from public, anon, authenticated, service_role;
grant select, update on public.billing_cancellations to service_role;

-- ── 1. Account close: the subscriptions row is deleted, the id is captured ───────────────────────
create or replace function public.billing_queue_cancel_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.stripe_subscription_id is not null then
    insert into public.billing_cancellations (stripe_subscription_id, queued_because)
    values (old.stripe_subscription_id, 'account_closed')
    on conflict (stripe_subscription_id) do nothing;   -- already queued by a withdrawal: keep its earlier time
  end if;
  return null;
end
$$;
revoke all on function public.billing_queue_cancel_on_delete() from public, anon, authenticated;

drop trigger if exists trg_billing_queue_cancel_on_delete on public.subscriptions;
create trigger trg_billing_queue_cancel_on_delete
  after delete on public.subscriptions
  for each row execute function public.billing_queue_cancel_on_delete();

-- ── 2. Withdraw for every child: the account stays, its subscription is queued ───────────────────
-- Copied from 20260926100600 (its last definition).
create or replace function public.consent_withdraw_account(p_parent uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  k uuid;
begin
  for k in select id from public.learners where created_by = p_parent loop
    perform public.delete_child_data(k, 'withdraw_consent_account');   -- FND-15: names its path
  end loop;
  update public.parental_consents set state = 'withdrawn', withdrawn_at = now()
   where parent_id = p_parent and state = 'granted';
  update public.parental_consents set state = 'expired'
   where parent_id = p_parent and state = 'pending';
  insert into public.billing_cancellations (stripe_subscription_id, queued_because) select stripe_subscription_id, 'consent_withdrawn' from public.subscriptions where account_id = p_parent and stripe_subscription_id is not null on conflict (stripe_subscription_id) do nothing;   -- CHANGED
end
$$;
revoke all on function public.consent_withdraw_account(uuid) from public, anon, authenticated, service_role;

-- ── 3. The drain's two calls. INVOKER: service_role's table grants are all they need. ────────────
/** What still needs doing: never tried, or the last try failed. */
create or replace function public.billing_cancellations_due()
returns table (stripe_subscription_id text, queued_because text, queued_at timestamptz)
language sql
stable
set search_path = public, pg_temp
as $$
  select q.stripe_subscription_id, q.queued_because, q.queued_at from public.billing_cancellations q
   where q.result is null or q.result like 'error:%'
   order by q.queued_at;
$$;

/** Record one outcome. Never overwrites a settled one, so a late, failed drain cannot reopen a 'done'. */
create or replace function public.billing_cancellation_record(p_subscription_id text, p_result text)
returns void
language sql
set search_path = public, pg_temp
as $$
  update public.billing_cancellations
     set attempted_at = now(), result = p_result
   where stripe_subscription_id = p_subscription_id
     and (result is null or result like 'error:%');
$$;

revoke all on function public.billing_cancellations_due() from public, anon, authenticated;
grant execute on function public.billing_cancellations_due() to service_role;
revoke all on function public.billing_cancellation_record(text, text) from public, anon, authenticated;
grant execute on function public.billing_cancellation_record(text, text) to service_role;
