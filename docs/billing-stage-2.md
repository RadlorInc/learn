# Billing — Stage 2 (Stripe). **TEST MODE ONLY, FOR THE WHOLE STAGE.**

Stage 1 (schema, RLS, entitlement) is applied to production and inert behind
`billing_config.enforced = false`. Stage 2 adds the money: products, checkout, the webhook, and the
seat materialiser Stage 1 deferred.

---

## 0. ⚠️⚠️ THE HARD CONSTRAINT — NOTHING IN THIS STAGE CAN TAKE A REAL CARD

Founder's call, 2026-08-25, and it governs every line below:

> **Stripe TEST MODE for the entire stage. No live keys, no live products, no live webhook endpoint,
> nothing that can charge a real person.**

Two reasons, both of which outrank convenience:

1. **B12 is still open.** There is no backup of the children's data. The first real payment is the
   moment losing that database stops being recoverable by apology.
2. **Checkout is the one piece that can charge someone before `enforced` has any say.** The flag
   gates ACCESS, not PAYMENT — a working checkout with live keys takes money whether or not the
   paywall is switched on. `enforced = false` is not a safety net for this stage, and must not be
   sold as one.

### The sequence for going live — in this order, no step skipped

| # | step | whose | why it is before the next one |
|---|---|---|---|
| 1 | **B12** — Supabase Pro, daily backups + PITR | founder | taking money without a recovery path is the line |
| 2 | the applied-schema **fingerprint check** re-run against production | either | proves prod still matches what the suite tested |
| 3 | **a test-mode purchase watched end to end** by the founder | founder | a checkout nobody has watched settle is a rollback nobody has run |
| 4 | live keys + live products + live webhook endpoint | founder | a deliberate act, never a side effect of a deploy |
| 5 | `billing_config.enforced = true` | founder | access last, after money is proven |

⚠️ **Steps 4 and 5 are separate.** Live keys with `enforced = false` means we can take money while
nothing is gated — which is the correct order (prove the payment path on real cards before removing
anyone's access), but only if step 5 actually follows.

### How test mode is enforced in code, not in discipline

- Keys come from `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`. **A gate asserts the configured key
  is a `sk_test_` key** and the app refuses to construct a Stripe client from a `sk_live_` one while
  the stage is open. A constant somebody has to remember is not a constraint.
- No price id is hard-coded; they come from config, so nothing in the repo can point at a live
  product by accident.

---

## 1. ✅ THE PRICE LADDER — RECORDED, AND IN ONE PLACE

Founder's amounts, 2026-08-25. **They live in [`src/core/billing.ts`](../src/core/billing.ts) and
nowhere else**, which is what makes them safe to change: no customers yet, and one file to edit.

| | first seat | each further seat |
|---|---|---|
| **monthly** | **$7.99** | **$4.99** |
| **annual** | **$63.99** | **$39.99** |

Graduated, never volume. Two tiers: `up_to: 1` then `up_to: 'inf'` — **the 4-seat cap lives in the
app, not in Stripe**, so changing it later is an app change rather than a new product.

⚠️ **These are DEVELOPMENT values.** The founder may revisit the amounts before live keys go in. The
SHAPE is settled and does not move.

### The totals, hand-computed — and why they are typed out rather than derived

| seats | monthly | annual |
|---|---|---|
| 1 | $7.99 | $63.99 |
| 2 | $12.98 | $103.98 |
| 3 | $17.97 | $143.97 |
| 4 | $22.96 | $183.96 |

⚠️ **The test types these numbers out.** A test computing `first + extra × (n − 1)` would restate the
implementation and pass on any typo in the ladder — the ladder would be *defining* what is correct
instead of being *checked against* it. That is the difference between a check and a restatement, and
it is why the totals were asked for separately from the ladder.

---

## 2. Graduated, and asserted as such

⚠️ **VOLUME AND GRADUATED PRICE THE SAME LADDER DIFFERENTLY, AND THE CHEAPER ONE IS THE WRONG ONE.**
Volume charges every seat at the tier the TOTAL lands in; graduated charges each seat at its own
tier. With any decreasing ladder, volume is cheaper — so a mis-set product does not error, it just
under-charges, quietly, for ever. The gate asserts `tiers_mode === 'graduated'` on the live price
object rather than on our config, because the config is not what Stripe bills from.

---

## 3. What Stage 2 built

| | | where |
|---|---|---|
| 2a | **the seat materialiser** — the reconciler that makes entitlement real | `20260825120000_seat_materialiser.sql` |
| 2b | **the price ladder**, in one place | `src/core/billing.ts` |
| 2b | **products + prices** (test mode), idempotent and self-verifying | `scripts/stripe-products.mts` |
| 2b | **checkout** — a Session for N seats | `src/app/api/checkout/route.ts` |
| 2b | **the webhook** — signature-verified, idempotent, order-independent | `src/app/api/stripe/webhook/route.ts` |

### The three properties of the webhook, and why each is STRUCTURAL

None of them can be seen in a green run, so each is built so that it cannot be got wrong rather than
checked afterwards:

1. **Idempotent** — `billing_events.stripe_event_id` is `unique`, so the DATABASE is the idempotency
   authority. Not a Set in application memory: a serverless instance forgets one between
   invocations, and two concurrent instances do not share one.
   ⚠️ **The skip is keyed on `processed_at`, not on the row existing.** A delivery that logs the
   event and then dies (a timeout, a deploy mid-request) must be retried — keyed on existence it
   would be skipped for ever, having done nothing, with no error anywhere. Every failure path below
   returns 5xx **without** stamping `processed_at`, which is what asks Stripe to redeliver.
2. **Order-independent** — nothing reads state out of the event's payload. The handler takes the
   subscription id and **re-fetches the subscription from Stripe**, so a late-delivered old event
   writes today's truth. No version column, and none needed.
3. **Convergent on replay** — the write is a full upsert plus `materialize_seats`, which is a
   reconciler given a TARGET. The same event delivered ten times ends in the same world.

⚠️ **The grace window is DERIVED, never stamped**: `grace_until = current_period_start + 7 days`.
`now() + 7 days` would move the deadline forward on every redelivery — an at-least-once channel
quietly turning a 7-day grace into an unbounded one.

⚠️ **`invoice.payment_failed` is deliberately NOT handled.** A failed renewal moves the subscription
to `past_due`, which emits `customer.subscription.updated`; with the grace derived from the period
there is nothing a second event could add but a second source of truth.

### ⚠️ The trap in this band of the Stripe API — `current_period_start` moved

From API version `2025-03-31.basil` (this SDK pins `2026-07-29.dahlia`) the period fields live on
the subscription **ITEM**, not on the subscription. Reading the old place is `undefined` in JS — no
error, both periods land null — and a null `current_period_start` silently deletes **both** the grace
window and `reassign_learner_seat`'s one-reassignment-per-period limit. The gate's fixture puts a
*different* value in the old place, so the item's value has to be the one that wins.

### ⚠️ One Stripe CUSTOMER per account, reused — not a nicety

Checkout looks up `subscriptions.stripe_customer_id` for the account and passes it back to Stripe.
Without it a parent who cancels and resubscribes ends up with **two customer objects**: harmless to
*us*, because everything keys on `account_id`, and not harmless to *Stripe* — their payment history
splits across both, and Stage 4's billing portal has to pick one to send them to. *"Which of your two
customers is this parent"* is a support question with no good answer, and it gets worse every month
it exists. Cheap now, awkward later; fixed before Stage 4 rather than after.

- ⚠️ `customer` and `customer_email` are **mutually exclusive** — a session carrying both is
  rejected, so it is a branch rather than two fields.
- ⚠️ The lookup uses **the parent's own token, never the service role.** `subscriptions` grants
  SELECT to `authenticated` behind an owner-scoped policy, so RLS guarantees the read can only
  return their own row — and the one key that bypasses every policy stays out of a request path a
  logged-in stranger can reach. Gated by a sentinel: the service-role key must appear in **no**
  outbound call from this route.
- ⚠️ A stored id **can go stale** (deleted in the dashboard, or belonging to the other mode after a
  test/live switch). Stripe answers `resource_missing`, and the route retries once as a new
  customer — a duplicate customer is better than a family that cannot buy for a reason visible only
  in a server log.

### Environment

| | |
|---|---|
| `STRIPE_SECRET_KEY` | **must be `sk_test_…`** — `stripeClient()` throws on anything else |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from the endpoint in the Stripe dashboard |
| `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` | printed by `scripts/stripe-products.mts` |

Unset, checkout and the webhook answer **503** and nothing else in the app notices — which is the
state of every environment until the founder runs the script.

⚠️ **The statement descriptor `RADLOR MILO` is an ACCOUNT setting, not a price one** (Stripe
dashboard → Settings → Public details). It belongs to step 4 of the go-live sequence.

⚠️ **`materialize_seats` carries a `grant execute … to service_role` that is REDUNDANT — recorded
here because it was first reported as a live defect and is not one.** Measured against production:
Supabase's default privileges grant `service_role=X/postgres` explicitly on functions in `public`
owned by `postgres`, and a REVOKE from `public, anon, authenticated` cannot remove it — four live
functions of identical shape (`enforce_learner_cap`, `enforce_grade_cap`, `enforce_grade_ownership`,
`prune_error_events`) all read `{postgres=X,service_role=X}` with `service_role_can_execute = true`.
The webhook could always have called it.

What was genuinely missing is the **assertion**: M6 says an account cannot call it, and is equally
satisfied by a function nobody at all can call. **M7 is the positive control**, driven as the role
that will really make the call. It has caught nothing, and the grant stays so that the property stops
depending on a platform default nobody in this repo controls.

## 4. Cases

| | |
|---|---|
| C1 | a `checkout.session.completed` creates the subscription row and its seats |
| C2 | the SAME event delivered twice changes nothing the second time (at-least-once is the contract) |
| C3 | an out-of-order event (`updated` before `completed`) does not lose the later state |
| C4 | an unknown `status` from Stripe fails CLOSED (Stage 1's allow-list) and does not error the write |
| C5 | a `deleted` subscription revokes seats without touching the child's record (reads stay open) |
| C6 | the 7-day grace: `past_due` keeps entitlement, expiry ends it |
| C7 | seats never exceed 4, and the materialiser cannot create a fifth |
| C8 | a webhook with a bad signature is rejected before anything is read from its body |
| C9 | the configured secret key is `sk_test_` for the whole stage |

**Where each is proven.** `src/__tests__/billingStripe.test.ts` DRIVES the routes end to end against
a stubbed Stripe and a stubbed PostgREST — a real signature from the SDK's own
`generateTestHeaderString`, so no test depends on our reading of the signing scheme.

| | proven by |
|---|---|
| C1 | driven — the upsert body, `on_conflict=account_id`, and `materialize_seats` called with the target |
| C2 | driven — a duplicate makes **no** writes and no Stripe round-trip |
| C3 | driven — a stale payload saying 4 seats / `active` against a Stripe saying 1 / `past_due`; we write 1 |
| C4 | driven — an unfamiliar status releases the seats and does not error |
| C5 | driven — `canceled` → 0 seats, and nothing in the path touches a learner row |
| C6 | driven — `past_due` keeps the seats; grace = period start + 7 days, unchanged on replay |
| C7 | driven — a quantity of 7 clamps to 4 **before** the row is written (`seats_paid` has a CHECK, so an unclamped 7 would fail the INSERT and lose the event) |
| C8 | driven — a bad signature 400s and the call list is **empty** |
| C9 | driven — `stripeClient()` throws on `sk_live_`, with a positive control that `sk_test_` is accepted |

**12 mutations planted against the source; 12 caught**, each by the check written for it — including
"trust the event payload instead of re-fetching" (C3), "key idempotency on the row existing" (the
retry), "verify the signature after logging the event" (C8), and "take the account from the request
body" (checkout's trust boundary).

---

## 5. Step 3 of the go-live sequence — the test-mode purchase, watched

This is the founder's, and it is the first time anybody sees money move. Everything below is test
mode; no real card is involved and none can be.

1. **Stripe dashboard → test mode ON** (the toggle top-right). Copy the **test** secret key
   (`sk_test_…`) into `.env.local` as `STRIPE_SECRET_KEY`. ⚠️ A live key is refused by the app, on
   purpose — if it throws, that is the guard working.
2. **Create the product and prices:**
   ```bash
   npx tsx scripts/stripe-products.mts --dry     # says what it would do, touches nothing
   npx tsx scripts/stripe-products.mts
   ```
   It prints `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` — put both in `.env.local`. Re-running is
   safe: it finds what exists and **verifies** it against the ladder rather than assuming it.
3. **Forward the webhook to the dev server** (Stripe CLI):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   It prints a `whsec_…` — that is `STRIPE_WEBHOOK_SECRET` for the local run. The deployed endpoint
   has its own, from the dashboard.
4. **Buy something.** Card `4242 4242 4242 4242`, any future expiry, any CVC.
5. **Watch these three, in this order** — the whole point of the step:
   - `stripe listen` shows `checkout.session.completed` → `200`;
   - `subscriptions` has one row for the account, `status = active`, `seats_paid = N`;
   - `subscription_seats` has **N rows**, indexes 1..N. ⚠️ This is the one that would be empty if the
     `service_role` grant were missing, and everything else would still look perfect.
6. **Then replay it** — `stripe events resend <evt_id>` — and check that nothing changed. That is the
   at-least-once contract, seen rather than argued.

⚠️ **What this step CANNOT show you** (say it out loud rather than reading a green run as more than
it is): the paywall itself. `billing_config.enforced` is `false`, so a seat grants nothing a
non-seat does not already have. Entitlement is exercised in `ci / rls-tests`, with the flag forced
ON, and nowhere else until step 5.
