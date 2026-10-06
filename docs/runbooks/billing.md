# Runbook: billing support

**Use this when:** a parent writes about money: a double charge, a refund, a dispute, a cancellation by email or post,
"I paid but it is still locked", a failed payment. Anything about money is **P1** in [support.md](support.md).

The policy is [../legal/01-refund-and-cancellation-policy.md](../legal/01-refund-and-cancellation-policy.md) (doc 01).
This file is **how**; if they disagree, doc 01 wins and this file gets fixed. How billing is built:
[../architecture.md](../architecture.md) §8.

## Who does what

- **The founder** acts in the Stripe dashboard: refunds, cancellations, disputes, resending events. Every movement of
  money is the founder's.
- **The agent** never touches Stripe, production or money. It reads what the founder pastes in chat, writes the
  read-only SQL ([../legal/sql/billing-lookup.sql](../legal/sql/billing-lookup.sql)), says what the results mean and
  drafts the reply. Paste results in chat only, never into the repo: they carry emails and Stripe ids.

## First, for every money message

1. **Founder.** Reply the same day ("Got it, looking now"). Log a general line in the contact log in
   [support.md](support.md) — no name, email, amount or Stripe id.
2. **Founder.** In Stripe: Customers → search the parent's email. Note the customer's **subscriptions** and
   **payments**. Run blocks 1, 3 and 5 of `billing-lookup.sql` with the parent's email.
3. **Agent.** Compare the two: the subscription id the app follows (block 1) against what Stripe shows.

## Double charge

Two payments for the same period, or two live subscriptions for one family.

1. **Agent.** From the founder's Stripe view and block 1: is it two **subscriptions** (two renewing plans) or two
   **payments** on one subscription (a retry that went through twice)? Block 5 showing *"not applied — the account's
   current subscription is …"* means a second subscription reached the webhook.
2. **Founder.** Two subscriptions: in Stripe, cancel the one that is **not** the `stripe_subscription_id` in block 1,
   **immediately** (not at period end), then refund its payment in full. Two payments on one subscription: refund the
   extra one in full. Doc 01 §5: duplicate charges are always refunded in full.
3. **Founder.** Run block 1 again: the row still names the subscription you kept, `status` active.
4. **Agent.** Draft the reply: what was doubled, that the extra charge is refunded in full, and that refunds reach the
   card in up to 10 business days (doc 01 §5).

The app refuses a second checkout while a plan holds seats (`/api/checkout` answers `already_subscribed`), and the plan
screen hides the checkout then. Before the webhook has written a row (two tabs, a double click), checkout asks Stripe:
one customer per account, a live subscription on it refuses, and only the newest open Checkout Session stays payable
(older ones are expired). A double can still come from Stripe itself, a subscription made by hand, or an account
whose row never got written that comes back more than a day later (a second customer; see architecture §8).

A parent who says "the payment page said expired": they had two tabs open and paid in the older one. Nothing was
charged; they start checkout again.

## Refund request

1. **Founder.** From Stripe: the date of the payment they mean, and whether it was the **first** payment of a new
   subscription or a **renewal**.
2. **Agent.** Apply doc 01 §5 and say which case it is:
   - first payment, request within 14 days of it → full refund;
   - renewal, request within 14 days of it, and the account **not used** since that charge → full refund. "Used" is
     not defined in doc 01 or measured by the app — an open question below; until it is answered, the founder decides;
   - a duplicate charge, a charge after a valid cancellation, or a purchase by a child without the parent's
     permission → always a full refund;
   - withdrawal of consent for every child, or closing the account → done automatically (see below);
   - anything else → no refund is owed by doc 01; the founder decides whether to give one. A state law may give more
     (doc 01 §5); if the parent cites one, the founder asks the attorney.
3. **Founder.** In Stripe: the payment → **Refund**. A refund does not cancel the plan: if they also want to stop, cancel
   too (next section). The agent never chooses an amount the policy does not fix.
4. **Agent.** Draft the reply: what is refunded, up to 10 business days to reach their card.

## Cancel request by email or post

Doc 01 §4 promises to act **within 2 business days** of receipt and confirm by email.

1. **Founder.** Check it comes from the account's own email (or, by post, matches the account). If it does not, reply
   to the account's email only.
2. **Founder.** In Stripe: the subscription → **Cancel** → **at the end of the current period** (what the in-app button
   does). Cancel *immediately* only when you are also refunding the whole period.
3. Stripe's event updates the app; run block 1 again and see `cancel_at_period_end` true.
4. **⚠️ The app sends NO confirmation email for a cancellation made in the dashboard** — only the in-app button
   (`/api/billing/cancel`) does. **Founder** replies by hand: "Your subscription is cancelled. You will not be charged
   again. Your plan stays active until <current_period_end>, then ends. Your account and your children's profiles stay
   open." Doc 01 §4 requires this confirmation.

A parent who cancelled and wants to stay before the period ends: in Stripe, the subscription → **Don't cancel**. The app
offers no checkout while the cancelled plan still holds seats, so this is the only way back before the period ends.

## Withdrawal of consent or closing the account

Decided 6 October 2026 (doc 01 §4, §5): **closing the account** and **withdrawing permission for every child** both
cancel the Stripe subscription **immediately** and refund the unused part, automatically. A withdrawal for **one**
child does not (not decided). How it is built: [../architecture.md](../architecture.md) §8.

**The rule** (`unusedCents` in `src/features/billing/closeRefund.ts`, applied to each paid invoice of the
subscription): payment × full days left in the period that invoice paid for, counted from the moment the request was
actioned (`billing_cancellations.queued_at`), ÷ days in that period, rounded down to the cent. Within 14 days of a
payment (or a payment made after the request), the whole payment. A $0 invoice, an ended period, or a payment that
already carries any refund (ours or one made by hand) → nothing more. Monthly and annual alike.

**What happens on its own:**
1. The close (`delete_my_account`, the operator SQL, or a dashboard deletion) or the withdraw-all
   (`consent_withdraw_account`) writes one row to `billing_cancellations` in the same transaction: Stripe's
   subscription id, why, and when. Nothing about Stripe can block or undo the close.
2. Right after, the app calls `/api/consent/cancel-second-notice` (the email-link withdrawal settles it in
   `/api/consent/respond`), which cancels the subscription at Stripe now (idempotency key `close-cancel-<sub>`),
   refunds each invoice's unused part (`close-refund-<sub>-<invoice>`), and emails the parent at the address on the
   Stripe customer: "cancelled from today", and the amount. The row's `result` becomes `done: …`.
3. If Stripe could not be reached or refused, `result` is `error: …`; every later drain retries (the daily cron at
   06:23 UTC) and the ops digest shows `!! billing_cancellations_owed: <n>` until it is settled. The refund stays counted
   from the original time.
4. Stripe then sends `customer.subscription.deleted` and `charge.refunded`. For a closed account the webhook closes
   them as `ignored: account_closed` (200), with no error row.

**Founder — the parent asks "did I get my refund?"** In Stripe: Customers → the parent's email → the subscription
(cancelled, with the date) and the payment's **Refunds**. The email told them the amount; refunds take up to 10
business days.

**Founder — the digest says `billing_cancellations_owed` is not 0** (the automatic refund failed):
1. SQL editor, read-only: `select stripe_subscription_id, queued_because, queued_at, result from public.billing_cancellations where result is null or result like 'error:%';`
   Paste nothing from it into the repo or an issue (Stripe ids). `result` says what failed.
2. A passing Stripe outage: nothing to do; it settles on the next drain (or run one now:
   `curl -s -X POST https://radlic.com/api/consent/cancel-second-notice`).
3. Otherwise do it by hand in Stripe: the subscription → **Cancel** → **immediately**; then each payment of the current
   period → **Refund** the amount the rule above gives, counted from `queued_at` (the agent works it out from the
   dates and amounts you paste). Then email the parent the amount (the Stripe customer's address).
4. Then run the drain once (the `curl` above, or wait for the cron). It finds the plan cancelled and each payment
   already refunded, refunds nothing more, and settles the row as `done: already canceled; … already refunded` — the
   digest stops flagging it. No database write by hand.

**A request by email** (close or withdraw-all): follow [data-requests.md](data-requests.md); the in-app control or
the operator SQL it names queues the cancel and refund like the app does. Do not refund in Stripe first: a payment
that already carries a refund is refunded nothing more, so the parent would get only what you gave by hand.

## Dispute or chargeback

1. **Founder.** Stripe emails you and the dispute appears under Payments → Disputes, with a deadline. Do not refund a
   disputed payment separately: the bank already holds the money, and a refund would pay the parent twice.
2. **Founder.** Decide: **accept** it (the money stays with the parent), or **counter** with evidence before the
   deadline: the renewal-terms tick (`renewal_consent_at` in the subscription's metadata in Stripe), the
   acknowledgement email sent at checkout, and the plan's dates.
3. **Founder.** Whether to keep the plan running is your call; a lost dispute does not cancel it on its own — cancel it
   in Stripe if the parent no longer wants it.
4. **Agent.** Can draft the evidence text from what the founder pastes.

## "I paid but it is still locked"

1. **Agent.** Ask the founder for block 1, block 3, block 4 and block 5.
2. **Read them:**
   - Block 1 `status` active with `seats_paid` ≥ 1 → billing is fine. The child's screen is stale: close and reopen the
     app ([support.md](support.md) diagnostic block). If seats show a `kid` of null in block 2, a seat is unused:
     the parent assigns it from the dashboard.
   - No row in block 1, and a row in block 4 for their subscription → the webhook received it and did not finish.
     **Founder**: in the Stripe dashboard, the radlic.com webhook endpoint → the event → **Resend**. Run block 1 again.
   - No row anywhere, and block 5 says *"signature did not verify"* or *"not configured"* → the webhook is refusing
     every delivery. Fix the named Vercel setting (`STRIPE_WEBHOOK_SECRET` must equal the endpoint's signing secret),
     then resend the failed events from the endpoint's page. Every family that paid in that window is affected.
   - Block 5 says *"has no account_id in metadata"* → see the next section.
3. **Agent.** Draft the reply once block 1 shows the plan.

## A subscription made by hand in the Stripe dashboard

The webhook knows which family a subscription belongs to **only** from the subscription's metadata `account_id`
(checkout writes it). A subscription created in the dashboard has none: the webhook logs *"has no account_id in
metadata — not applied"* and ignores it, for ever. The family pays and gets nothing.

- Avoid making one. If you must: on the subscription, add metadata `account_id` = the account's user id (Supabase →
  Authentication → Users → the parent's email → the id). Then resend the subscription's latest event (previous section).
- Never add an `account_id` you have not read off that parent's own user record.

## Failed payment and past due

- A failed renewal makes the subscription `past_due`. The app keeps the family's seats for **7 days from the start of
  the period** (`grace_until`, block 1), then access falls back to the free topics. Stripe retries the card on the
  schedule set in the Stripe dashboard's billing settings.
- Doc 01 §7 promises retries over 7 days **and an email**. The app sends no failed-payment email of its own; Stripe's
  customer emails for failed payments are a dashboard setting. The founder checks it is on — not measured from here.
- The app has no screen where a parent can update their card (open, waiting on a founder decision). Until it exists:
  **founder** sends the parent the hosted invoice link from the failed invoice in Stripe, where they can pay with
  another card. When it is paid, the subscription goes back to `active` and the app follows.

## Open questions for the founder

Not decided here. Until each is decided, the founder handles that case one by one.

1. **"Not used since the renewal charge"** (doc 01 §5, renewals): what counts as use — any child session, a sign-in?
   The app does not measure it for this purpose.
2. **Refunds outside doc 01's cases:** goodwill refunds, partial refunds — a rule, or case by case?
3. **Disputes:** counter by default, or accept under some amount?
4. **Stripe's failed-payment emails and retry schedule** (doc 01 §7): confirm they are on and match the 7 days.
5. **Withdrawal for ONE child of several:** keep the plan as it is, drop a seat (and refund it?), or nothing? Today
   nothing changes in billing.
6. **The withdraw-all screen** (doc 03's wording, `WITHDRAW_ALL` in `src/features/consent/copy.ts`) does not yet say
   that it cancels the plan and refunds the unused part; the close page does. A line for doc 03?
