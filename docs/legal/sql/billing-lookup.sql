-- BILLING LOOKUP FOR ONE FAMILY (read-only; for the founder to run in the Supabase SQL editor).
-- Used by docs/runbooks/billing.md. Replace '<parent email>' with the address the parent wrote from (it must be the
-- account's sign-in email). Nothing here writes. Paste the results back to the agent in chat, never into the repo.
-- Run one block at a time; each block says what its columns answer and what each result means.

-- ── 1. The family's subscription row (what the app believes) ─────────────────────────────────────────────────────
--   status                  Stripe's last word, as the webhook stored it. active / trialing / past_due / unpaid hold
--                           seats; canceled, incomplete_expired or anything else does not.
--   seats_paid              how many children the plan pays for (0–4).
--   stripe_subscription_id  the ONE subscription the app follows. Compare it with the subscriptions the Stripe
--                           dashboard shows for this customer: two live ones there = a double subscription.
--   current_period_end      when the paid period ends (renewal, or the end of a cancelled plan).
--   cancel_at_period_end    true = cancelled, still active until current_period_end.
--   grace_until             set only while past_due/unpaid: access continues until this time.
--   updated_at              when the webhook last wrote the row.
--   No row at all           = no webhook has ever been applied for this account (see block 3).
select s.status, s.seats_paid, s.stripe_customer_id, s.stripe_subscription_id,
       s.current_period_start, s.current_period_end, s.cancel_at_period_end, s.grace_until, s.updated_at
from public.subscriptions s
join auth.users u on u.id = s.account_id
where lower(u.email) = lower('<parent email>');

-- ── 2. The seats (who the plan covers) ────────────────────────────────────────────────────────────────────────────
--   seat_index     1–4.
--   kid            the first 8 characters of the child's id (no name is selected); null = a paid seat nobody uses.
--   Fewer rows than seats_paid in block 1 = the seats were not reconciled; ask the agent.
select ss.seat_index, left(ss.learner_id::text, 8) as kid, ss.assigned_at, ss.last_reassigned_at
from public.subscription_seats ss
join public.subscriptions s on s.id = ss.subscription_id
join auth.users u on u.id = s.account_id
where lower(u.email) = lower('<parent email>')
order by ss.seat_index;

-- ── 3. The Stripe events the webhook received for this family ─────────────────────────────────────────────────────
--   type           the Stripe event (checkout.session.completed, customer.subscription.updated/deleted, ...).
--   subscription   which Stripe subscription it was about (from the stored summary, not the raw event).
--   processed_at   null = received but NOT finished: Stripe is still retrying it, or gave up. Older than an hour and
--                  still null = "paid but locked"; resend it from the Stripe dashboard (runbook step).
--   ⚠️ An event is tied to the account only once it was processed, so a never-processed one is NOT in this block:
--   block 4 finds those.
select e.at, e.type, e.payload->>'subscription' as subscription, e.payload->>'amount_total' as amount_cents,
       e.processed_at, e.stripe_event_id
from public.billing_events e
join auth.users u on u.id = e.account_id
where lower(u.email) = lower('<parent email>')
order by e.at desc
limit 30;

-- ── 4. Every event in the last 7 days that was never finished (any family) ────────────────────────────────────────
--   Any row here is a payment or a change Stripe told us about that the app has not applied. Match the
--   `subscription` column against the subscription id in the Stripe dashboard to find the family.
--   No rows = every event received in the last 7 days was applied. (It cannot show an event that never ARRIVED —
--   a wrong webhook secret refuses them before they are logged; block 5 shows that.)
select e.at, e.type, e.payload->>'subscription' as subscription, e.stripe_event_id
from public.billing_events e
where e.processed_at is null and e.at > now() - interval '7 days'
order by e.at desc;

-- ── 5. What the billing routes logged in the last 7 days ──────────────────────────────────────────────────────────
--   "signature did not verify"           STRIPE_WEBHOOK_SECRET in Vercel does not match the Stripe endpoint's secret
--                                        (or someone probed the URL; one or two lines with no payments missing is that).
--   "not configured (...)"               the named setting is missing in Vercel; Stripe is retrying meanwhile.
--   "not applied — the account's current subscription is ..."
--                                        an event for a second subscription on an account that already has a live one:
--                                        likely a double subscription (runbook: double charge).
--   "has no account_id in metadata"      a subscription made by hand in the dashboard (runbook: hand-made subscription).
--   "billing seats: stripe refused ..."  an "add a child" payment Stripe refused; the text after the colon is Stripe's.
--   No rows                              nothing in billing failed loudly in 7 days (crashes elsewhere are not here).
select at, route_path, message
from public.error_events
where route_path in ('/api/stripe/webhook', '/api/checkout', '/api/billing/seats', '/api/billing/cancel')
  and at > now() - interval '7 days'
order by at desc
limit 50;
