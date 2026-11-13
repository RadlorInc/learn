-- Radlic went free on 13 Nov 2026 (migration 20261113120000). Run in the Supabase SQL editor on production after the
-- migration, and again once every subscription is cancelled in Stripe. Read-only. No emails or ids are returned.

-- 1. Is the paywall off?
--    enforced = false → off, as intended.  true → the migration has not run (or was undone).  No row → the paywall
--    has never been on anywhere (also free).
select enforced, updated_at from public.billing_config;

-- 2. How many families still hold a plan the app knows about?
--    0 → nothing left to cancel: the agent may delete the webhook, the refund code and the billing tables.
--    More than 0 → cancel those subscriptions in Stripe (Subscriptions → Active), with a refund as the founder
--    decides; the webhook updates these rows, then run this again.
select count(*) as plans_still_holding_seats
from public.subscriptions
where status in ('active', 'trialing', 'past_due', 'unpaid');   -- HOLDS_SEATS in src/core/billing.ts
