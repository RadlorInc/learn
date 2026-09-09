/**
 * THE PRICE LADDER, AND THE ONLY PLACE IT IS WRITTEN DOWN.
 *
 * Founder's amounts, 2026-08-25. **Development values** — they may move before live keys go in,
 * which is safe precisely because they are here and nowhere else and there are no customers yet.
 * The SHAPE does not move: graduated tiering, never volume · 4 paid seats · USD · no trial.
 *
 * ⚠️ GRADUATED AND VOLUME PRICE THE SAME LADDER DIFFERENTLY, AND THE WRONG ONE DOES NOT ERROR — IT
 * UNDER-CHARGES, QUIETLY, FOR EVER. Volume charges every seat at the tier the TOTAL lands in;
 * graduated charges each seat at its own tier. With any decreasing ladder volume is cheaper, so a
 * product created with the wrong `tiers_mode` looks perfectly healthy. `scripts/stripe-products.mts`
 * asserts `tiers_mode === 'graduated'` on the LIVE price object rather than on this file, because
 * this file is not what Stripe bills from.
 *
 * ⚠️ THE LAST TIER IS `up_to: 'inf'` AND THE 4-SEAT CAP LIVES HERE, NOT IN STRIPE — founder's call,
 * so changing the cap is an app change rather than a new product. `clampSeats` is what enforces it,
 * and it is enforced again by `subscriptions.seats_paid check (between 0 and 4)`, again by
 * `materialize_seats`, and again by `subscription_seats.seat_index check (between 1 and 4)`.
 *
 * Pure: no React, no Supabase, no Stripe import. `src/__tests__/billingStripe.test.ts` drives it
 * against HAND-COMPUTED totals — deriving the expectation from this ladder would make a typo here
 * redefine what is correct instead of failing.
 */

export type Cadence = 'monthly' | 'annual'

/** Our cap, not Stripe's. See the header. */
export const MAX_SEATS = 4
export const CURRENCY = 'usd'

/** All amounts in CENTS — Stripe's unit, and the only one that cannot lose a half-penny. */
export const LADDER: Record<Cadence, { first: number; extra: number; interval: 'month' | 'year' }> = {
  monthly: { first: 799, extra: 499, interval: 'month' },
  annual: { first: 6399, extra: 3999, interval: 'year' },
}

/** The tier list handed to Stripe. `up_to: 1` is the FIRST seat; everything after it is `extra`. */
export const graduatedTiers = (c: Cadence): { up_to: number | 'inf'; unit_amount: number }[] => [
  { up_to: 1, unit_amount: LADDER[c].first },
  { up_to: 'inf', unit_amount: LADDER[c].extra },
]

/** 0..MAX_SEATS. ⚠️ CLAMPS, IT DOES NOT THROW — the same reasoning `subscriptions.status` carries
 *  no CHECK for: Stripe owns the quantity, and losing a webhook is worse than clamping one. It is
 *  also load-bearing rather than defensive, because `seats_paid` has a CHECK: a quantity of 7
 *  written straight through would fail the row INSERT and take the whole event with it. */
export const clampSeats = (n: unknown): number =>
  Math.min(Math.max(Math.trunc(typeof n === 'number' && Number.isFinite(n) ? n : 0), 0), MAX_SEATS)

/** What N seats cost per period, in cents. Graduated: seat 1 at `first`, the rest at `extra`. */
export const totalCents = (seats: number, c: Cadence): number => {
  const n = clampSeats(seats)
  return n === 0 ? 0 : LADDER[c].first + LADDER[c].extra * (n - 1)
}

// ─────────────────────────────────────────────────────────────────────────────
//  What the webhook writes, derived from a Stripe subscription. Pure, so the awkward cases
//  (out-of-order delivery, an unknown status, a dead subscription, the grace window) are drivable
//  without a network or a database.
// ─────────────────────────────────────────────────────────────────────────────

/** ⚠️ STRUCTURAL, NOT `import type Stripe` — this keeps `core` free of the SDK, and the real
 *  `Stripe.Subscription` satisfies it, so tsc still checks the call site in the webhook.
 *  ⚠️ `current_period_start/end` ARE ON THE ITEM, NOT THE SUBSCRIPTION, from API version
 *  2025-03-31.basil onward (this SDK pins 2026-07-29.dahlia). Reading them off the subscription
 *  compiles as `undefined` in JS and would silently null both periods — which would then silently
 *  delete the grace window and the one-reassignment-per-period limit, both of which read them. */
export interface StripeSubscriptionish {
  id: string
  status: string
  cancel_at_period_end: boolean
  customer: string | { id: string } | null
  metadata: Record<string, string> | null
  items: { data: Array<{ quantity?: number | null; current_period_start: number; current_period_end: number }> }
}

/** Statuses that still hold seats. ⚠️ ALLOW-LIST, so an unfamiliar status from Stripe releases the
 *  seats rather than keeping them — fails CLOSED, exactly as `is_chapter_entitled` does. */
const HOLDS_SEATS = new Set(['active', 'trialing', 'past_due', 'unpaid'])
/** The two statuses that get the grace window. Entitlement additionally requires `now <= grace_until`. */
const IN_GRACE = new Set(['past_due', 'unpaid'])
export const GRACE_DAYS = 7

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface SubscriptionRow {
  account_id: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string
  status: string
  seats_paid: number
  current_period_start: string | null
  current_period_end: string | null
  grace_until: string | null
  cancel_at_period_end: boolean
}

const iso = (unix: number | undefined | null): string | null =>
  typeof unix === 'number' && Number.isFinite(unix) ? new Date(unix * 1000).toISOString() : null

/**
 * A Stripe subscription → the row we store. Total, not incremental: this is what makes the webhook
 * order-independent (C3). The handler always re-fetches the CURRENT subscription from Stripe, so a
 * late-arriving old event writes today's truth rather than yesterday's.
 *
 * ⚠️ THE GRACE WINDOW IS DERIVED, NOT STAMPED. `grace_until = period_start + 7 days` is the same
 * answer however many times the event is replayed. Writing `now() + 7 days` instead would extend a
 * parent's grace every time Stripe retried a delivery — an at-least-once channel turning a 7-day
 * grace into an unbounded one, with nothing on screen to show for it.
 */
export function subscriptionRow(sub: StripeSubscriptionish): SubscriptionRow {
  const item = sub.items?.data?.[0]
  const start = iso(item?.current_period_start)
  const account = sub.metadata?.account_id ?? ''
  return {
    account_id: UUID.test(account) ? account : null,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : (sub.customer?.id ?? null),
    stripe_subscription_id: sub.id,
    status: sub.status,
    seats_paid: HOLDS_SEATS.has(sub.status) ? clampSeats(item?.quantity) : 0,
    current_period_start: start,
    current_period_end: iso(item?.current_period_end),
    grace_until:
      IN_GRACE.has(sub.status) && start
        ? new Date(new Date(start).getTime() + GRACE_DAYS * 86_400_000).toISOString()
        : null,
    cancel_at_period_end: !!sub.cancel_at_period_end,
  }
}
