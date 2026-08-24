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

## 1. 🔴 BLOCKED — THE PRICE LADDER IS NOT RECORDED ANYWHERE

The SHAPE is settled and in `billing-stage-1.md` §1: **graduated tiering, never volume**, **4 paid
seats**, USD, Stripe Tax off. **The amounts are not.** Searched the repo: nothing.

⚠️ **This is the Stage-1 plan failing the same way twice.** That plan was agreed in chat, never
written down, and was unrecoverable by the time it was needed. The prices are in exactly that state
now, and the fix is the same one: **write them here the moment they are said.**

What is needed to finish §3 and §5:

| | |
|---|---|
| monthly, per graduated tier | seat 1 = ? · seats 2–3 = ? · seat 4 = ? (or whatever the breakpoints are) |
| annual | the same ladder, or a flat annual per seat? |
| annual discount | expressed how — a separate price, or a % off the monthly ladder? |

⚠️ **The totals test must NOT derive its expectations from the ladder it is testing.** Founder's
instruction is exact totals for 1–4 seats, monthly and annual, hand-computed — so a typo in the
ladder fails the test instead of silently redefining what is correct. That is the difference between
a check and a restatement.

---

## 2. Graduated, and asserted as such

⚠️ **VOLUME AND GRADUATED PRICE THE SAME LADDER DIFFERENTLY, AND THE CHEAPER ONE IS THE WRONG ONE.**
Volume charges every seat at the tier the TOTAL lands in; graduated charges each seat at its own
tier. With any decreasing ladder, volume is cheaper — so a mis-set product does not error, it just
under-charges, quietly, for ever. The gate asserts `tiers_mode === 'graduated'` on the live price
object rather than on our config, because the config is not what Stripe bills from.

---

## 3. What Stage 2 builds

1. **Products + prices** (test mode) — one product, monthly and annual prices, graduated tiers.
2. **Checkout** — a Session for N seats, `client_reference_id` = the account, descriptor
   `RADLOR MILO`, no trial.
3. **The webhook** — signature-verified, idempotent on `billing_events.stripe_event_id` (already
   `unique` in the Stage 1 schema, so the DB is the idempotency authority, not application memory).
4. **The seat materialiser** — nothing currently creates `subscription_seats` rows; the Stage 1
   tests insert them by hand. This is the gap that makes entitlement real.
5. **Totals** — exact expected amounts for 1–4 seats, monthly and annual. **Blocked on §1.**

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
