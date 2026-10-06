import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripeClient } from '@/infra/stripe'
import { HOLDS_SEATS, subscriptionRow, totalCents } from '@/core/billing'
import { sinkError } from '@/infra/errorSink'
import { callerKey, overLimit } from '../../_rateLimit'
import { ConfigMissing, sendEmail, Undeliverable } from '@/features/consent/server'
import { renderRenewalReminder, renderSubscribed } from '@/features/billing/subscriptionNotices'

/**
 * The Stripe webhook. Signature-verified, idempotent, and ORDER-INDEPENDENT.
 *
 * ⚠️⚠️ THE THREE PROPERTIES OF THIS ENDPOINT ARE STRUCTURAL, NOT CHECKED — that is the whole design,
 * because none of them can be verified by looking at a green run:
 *
 *  1. **Idempotent.** `billing_events.stripe_event_id` is `unique`, so the DATABASE is the
 *     idempotency authority — not a Set in application memory, which a serverless instance forgets
 *     between invocations and which two concurrent instances do not share.
 *  2. **Order-independent.** Nothing here reads the event's own payload for state. It takes the
 *     subscription ID and RE-FETCHES the subscription from Stripe, so a late-delivered old event
 *     writes today's truth instead of yesterday's. There is no version column to compare and none
 *     is needed.
 *  3. **Convergent on replay.** The write is a full upsert plus `materialize_seats`, which is a
 *     reconciler given a TARGET. Delivering the same event twice, or ten times, ends in the same
 *     world.
 *
 * ⚠️ AND THE ONE PLACE THOSE THREE ARE NOT ENOUGH: a delivery that inserts the event row and then
 * DIES (a timeout, a deploy mid-request) would be skipped by (1) for ever, having done nothing. So
 * the skip is keyed on `processed_at`, not on the row's existence — a half-finished delivery is
 * retried, a finished one is not. Any failure below returns 5xx WITHOUT stamping `processed_at`,
 * which is what asks Stripe to redeliver.
 */
export const dynamic = 'force-dynamic'

const SUPA = () => process.env.NEXT_PUBLIC_SUPABASE_URL
/** ⚠️ SERVICE ROLE, WITH NO ANON FALLBACK. `subscriptions`, `subscription_seats` and
 *  `billing_events` are all deny-all to anon and authenticated by design; falling back would not
 *  even work, and if it ever did it would mean the paywall's own tables were writable from a
 *  browser. `/api/lead` has the fallback for a different reason and it is not a precedent. */
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY

const db = (path: string, init: RequestInit & { prefer?: string } = {}) =>
  fetch(`${SUPA()}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY()!,
      Authorization: `Bearer ${KEY()}`,
      'Content-Type': 'application/json',
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
  })

const fail = async (what: string, detail: string) => {
  await sinkError({
    at: new Date().toISOString(),
    source: 'server',
    message: `stripe webhook: ${what} — ${detail.slice(0, 300)}`,
    routePath: '/api/stripe/webhook',
  }).catch(() => {})
  // 500 so Stripe redelivers. `processed_at` is unstamped, so the redelivery does the work.
  return NextResponse.json({ error: what }, { status: 500 })
}

/**
 * ⚠️ WHAT THE EVENT LOG KEEPS — AN ALLOW-LIST, NEVER THE EVENT. `billing_events` survives account
 * deletion (`core/accountDeletion.ts` SURVIVORS) on the promise that it then "names nobody". The
 * raw event breaks that: a checkout session carries the parent's email, name, phone and address in
 * `customer_details`, plus our own account id in `client_reference_id`/`metadata`, and
 * `account_id → NULL` does nothing to a copy inside `payload` (MAP-02). Nothing in the app reads
 * `payload` back; this keeps Stripe's references (to find the event/subscription in Stripe) and
 * the amount the SURVIVORS line promises. Adding a field here is a privacy decision — never a
 * customer, email, name, address, phone, metadata or client_reference_id.
 */
function logPayload(event: Stripe.Event) {
  const o = event.data.object as {
    id?: string; subscription?: string | { id: string } | null; amount_total?: number | null; currency?: string | null
  }
  const sub = typeof o.subscription === 'string' ? o.subscription : (o.subscription?.id ?? null)
  return {
    id: event.id,
    type: event.type,
    created: event.created,
    object_id: o.id ?? null,
    subscription: sub ?? (event.type.startsWith('customer.subscription.') ? (o.id ?? null) : null),
    ...(typeof o.amount_total === 'number' ? { amount_total: o.amount_total, currency: o.currency ?? null } : {}),
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const stripe = stripeClient()
  if (!stripe || !secret || !SUPA() || !KEY()) {
    // Stripe retries a 503 for three days, and every one of those deliveries is a parent's payment not applied: say
    // which setting is missing (its NAME, never a value) where the founder looks — error_events, not only a log line.
    const missing = [!stripe && 'STRIPE_SECRET_KEY', !secret && 'STRIPE_WEBHOOK_SECRET',
      !SUPA() && 'NEXT_PUBLIC_SUPABASE_URL', !KEY() && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean).join(', ')
    await sinkError({
      at: new Date().toISOString(), source: 'server',
      message: `stripe webhook: not configured (${missing}) — delivery refused, Stripe will retry`,
      routePath: '/api/stripe/webhook',
    }).catch(() => {})
    return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })
  }

  // ⚠️ THE RAW TEXT, AND NOTHING PARSES IT BUT `constructEvent`. `req.json()` here would mean the
  // body had been interpreted before it was authenticated, and would also destroy the exact bytes
  // the signature is over — a re-serialised JSON object does not hash the same.
  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get('stripe-signature') ?? '', secret)
  } catch (e) {
    // SEC-17: the library's text stays in the log, not in the answer to an anonymous caller.
    console.warn('[stripe/webhook] bad signature:', e instanceof Error ? e.message : 'unverifiable')
    // ⚠️ A ROTATED OR MISTYPED STRIPE_WEBHOOK_SECRET LOOKS EXACTLY LIKE THIS, for every real delivery: paid and never
    // applied. So it reaches error_events — a fixed line, never the body or the header. The per-IP limit is what keeps a
    // scan of this public URL from filling the sink (a real misconfiguration still shows within the first minute).
    if (!overLimit(callerKey(req, 'webhook-bad-signature'), 3, 60_000)) {
      await sinkError({
        at: new Date().toISOString(), source: 'server',
        message: 'stripe webhook: signature did not verify — if Stripe is the sender, STRIPE_WEBHOOK_SECRET is wrong',
        routePath: '/api/stripe/webhook',
      }).catch(() => {})
    }
    return NextResponse.json({ error: 'bad_signature' }, { status: 400 })
  }

  // ── 1. Idempotency, in the database ────────────────────────────────────────
  const id = encodeURIComponent(event.id)
  const ins = await db('billing_events?on_conflict=stripe_event_id', {
    method: 'POST',
    prefer: 'resolution=ignore-duplicates,return=representation',
    body: JSON.stringify({ stripe_event_id: event.id, type: event.type, payload: logPayload(event) }),
  }).catch(() => null)
  if (!ins || !ins.ok) return fail('event log insert', ins ? await ins.text() : 'network')

  // ⚠️ WHAT THIS SHORT-CIRCUIT IS AND IS NOT WORTH. `resolution=ignore-duplicates` returns an EMPTY
  // representation when the row already existed, so an empty array means "seen before". If that ever
  // stopped being true, the effect would be a duplicate re-doing work — NOT a duplicate doing damage,
  // because everything below converges: the upsert writes the same row and `materialize_seats` takes
  // a TARGET. The skip is a saved round-trip; property (3) in the header is what makes C2 true.
  const inserted = (await ins.json().catch(() => [])) as unknown[]
  if (inserted.length === 0) {
    const seen = await db(`billing_events?stripe_event_id=eq.${id}&select=processed_at`).catch(() => null)
    const [row] = ((await seen?.json().catch(() => [])) ?? []) as { processed_at?: string | null }[]
    if (row?.processed_at) return NextResponse.json({ duplicate: true })
    // else: a previous delivery logged the event and never finished it. Fall through and finish it.
  }

  const done = (payload: Record<string, unknown>, account_id: string | null = null) =>
    db(`billing_events?stripe_event_id=eq.${id}`, {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: JSON.stringify({ processed_at: new Date().toISOString(), account_id }),
    }).then(() => NextResponse.json(payload))

  // ── 2. Which subscription is this event about? ─────────────────────────────
  // Deliberately only two families. `invoice.payment_failed` is NOT handled and does not need to
  // be: a failed renewal moves the subscription to `past_due`, which emits
  // `customer.subscription.updated`, and the grace window is DERIVED from the period rather than
  // stamped when the failure arrives. One code path, no second source of truth.
  //
  // `invoice.upcoming` is the third family, for ONE purpose: the annual renewal reminder (docs/legal/01 §3). Stripe
  // sends it N days before a renewal (30, set in the dashboard). ⚠️ From API 2025-03-31.basil the invoice names its
  // subscription under `parent.subscription_details`, not `subscription`; both are read.
  const object = event.data.object as {
    id?: string; subscription?: string | { id: string } | null
    parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null
    customer_details?: { email?: string | null } | null; customer_email?: string | null
    amount_total?: number | null; amount_due?: number | null
  }
  const ref = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : (v?.id ?? null))
  const subId =
    event.type === 'checkout.session.completed'
      ? ref(object.subscription)
      : event.type.startsWith('customer.subscription.')
        ? (object.id ?? null)
        : event.type === 'invoice.upcoming'
          ? (ref(object.parent?.subscription_details?.subscription) ?? ref(object.subscription))
          : null
  if (!subId) return done({ ignored: event.type })

  // ── 3. Stripe's CURRENT truth, not the event's copy of it ──────────────────
  let sub: Stripe.Subscription
  try {
    sub = await stripe.subscriptions.retrieve(subId)
  } catch (e) {
    return fail('subscription retrieve', e instanceof Error ? e.message : String(e))
  }

  const row = subscriptionRow(sub)
  if (!row.account_id) {
    // A subscription created outside our checkout (in the Stripe dashboard, say) carries no
    // account. There is nobody to entitle, and retrying will never produce one — so this is logged
    // LOUDLY and then closed, rather than redelivered for three days.
    await sinkError({
      at: new Date().toISOString(),
      source: 'server',
      message: `stripe webhook: subscription ${sub.id} has no account_id in metadata — not applied`,
      routePath: '/api/stripe/webhook',
    }).catch(() => {})
    return done({ ignored: 'no_account_metadata' })
  }

  // ── 4. Is this the account's CURRENT subscription? ─────────────────────────
  // ⚠️ ONE ROW PER ACCOUNT, SO A SECOND SUBSCRIPTION'S EVENT WOULD OVERWRITE THE FIRST. A parent who cancelled and
  // re-subscribed has an old subscription whose late `customer.subscription.deleted` would write `canceled`, 0 seats
  // over the new paid plan. So an event about a DIFFERENT subscription than the stored one is applied only if the
  // stored one no longer holds seats — asked of Stripe, not of the row, because a row whose own last event never
  // arrived would otherwise lock the family out of every plan after it.
  const cur = await db(`subscriptions?account_id=eq.${encodeURIComponent(row.account_id)}&select=stripe_subscription_id`)
    .catch(() => null)
  if (!cur || !cur.ok) return fail('subscription read', cur ? await cur.text() : 'network')
  const [stored] = (await cur.json().catch(() => [])) as { stripe_subscription_id?: string | null }[]
  if (stored?.stripe_subscription_id && stored.stripe_subscription_id !== sub.id) {
    let other: Stripe.Subscription
    try {
      other = await stripe.subscriptions.retrieve(stored.stripe_subscription_id)
    } catch (e) {
      return fail('stored subscription retrieve', e instanceof Error ? e.message : String(e))
    }
    if (HOLDS_SEATS.has(other.status)) {
      // Logged, because a LIVE second subscription here means the family is paying twice (docs/runbooks/billing.md).
      await sinkError({
        at: new Date().toISOString(), source: 'server',
        message: `stripe webhook: ${event.type} for ${sub.id} (${sub.status}) not applied — the account's current ` +
          `subscription is ${other.id} (${other.status})`,
        routePath: '/api/stripe/webhook',
      }).catch(() => {})
      return done({ ignored: 'not_current_subscription' }, row.account_id)
    }
  }

  // ── 5. The write. Upsert on the ACCOUNT, then reconcile the seats to it ────
  // ⚠️ ONE RETRY, ON 23505 ONLY. A checkout sends checkout.session.completed, invoice.paid and
  // customer.subscription.created within a second; two of them can insert the account's FIRST row at once, and the
  // loser fails on subscriptions_stripe_customer_id_key, which ON CONFLICT (account_id) does not arbitrate. By then the
  // winner's row exists, so the same upsert again takes the account_id path and updates it (measured on a local stack,
  // 6 Oct 2026). Anything else, or a second 23505, is a real failure and returns 5xx so Stripe redelivers.
  const upsert = () => db('subscriptions?on_conflict=account_id&select=id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: JSON.stringify(row),
  }).catch(() => null)
  let up = await upsert()
  if (up && up.status === 409) {
    const text = await up.text()
    if (!text.includes('"23505"')) return fail('subscription upsert', text)
    up = await upsert()
  }
  if (!up || !up.ok) return fail('subscription upsert', up ? await up.text() : 'network')
  const [saved] = (await up.json().catch(() => [])) as { id?: string }[]
  if (!saved?.id) return fail('subscription upsert', 'no row returned')

  // ⚠️ SEATS ARE RECONCILED, NEVER ADDED. `materialize_seats` takes a TARGET, so this line is safe
  // to run again — which it will be, because Stripe is at-least-once.
  const seats = await db('rpc/materialize_seats', {
    method: 'POST',
    body: JSON.stringify({ p_subscription_id: saved.id, p_seats: row.seats_paid }),
  }).catch(() => null)
  if (!seats || !seats.ok) return fail('materialize_seats', seats ? await seats.text() : 'network')

  // ── 6. The emails a subscription owes (docs/legal/01 §3) ───────────────────
  // ⚠️ IDEMPOTENT BY KEY, SO A FAILED SEND IS RETRIED, NOT SKIPPED. Each email's Resend key is fixed per subscription
  // (and per period for the reminder) and its payload is derived from this event and Stripe's current state, so a
  // redelivery re-sends the SAME message and Resend answers with the first one. A send failure therefore returns 5xx
  // like any other step and Stripe delivers again. A missing RESEND_API_KEY is configuration, not a moment: it is
  // logged loudly and the event is closed, because billing must never wait on email.
  const item = sub.items?.data?.[0]
  const interval = item?.price?.recurring?.interval
  let mail: { to: string; key: string; m: ReturnType<typeof renderSubscribed> } | null = null
  if (event.type === 'checkout.session.completed' && object.customer_details?.email && (interval === 'month' || interval === 'year')) {
    mail = {
      to: object.customer_details.email,
      key: `billing-ack-${sub.id}`,
      m: renderSubscribed({
        chargedCents: object.amount_total ?? 0,
        renewalCents: totalCents(row.seats_paid, interval === 'year' ? 'annual' : 'monthly'),
        interval: interval === 'year' ? 'year' : 'month', renewsIso: row.current_period_end, seats: row.seats_paid,
      }),
    }
  } else if (event.type === 'invoice.upcoming' && interval === 'year' && HOLDS_SEATS.has(sub.status) &&
             !sub.cancel_at_period_end && object.customer_email) {
    mail = {
      to: object.customer_email,
      key: `billing-renewal-${sub.id}-${row.current_period_end}`,
      m: renderRenewalReminder({ amountCents: object.amount_due ?? 0, renewsIso: row.current_period_end, seats: row.seats_paid }),
    }
  }
  if (mail) {
    try {
      await sendEmail('transactional', mail.to, mail.m, mail.key)
    } catch (e) {
      // A listed address (hard bounce / complaint) is final, not a retry: sendEmail already recorded it. A failure here
      // would make Stripe redeliver for days to an address that cannot receive it.
      if (!(e instanceof ConfigMissing) && !(e instanceof Undeliverable)) return fail('email', e instanceof Error ? e.message : String(e))
      if (e instanceof ConfigMissing) await sinkError({
        at: new Date().toISOString(), source: 'server',
        message: `stripe webhook: ${event.type} for ${sub.id} owed an email but ${e.message} is not set — not sent`,
        routePath: '/api/stripe/webhook',
      }).catch(() => {})
    }
  }

  return done({ ok: true, status: row.status, seats: row.seats_paid }, row.account_id)
}
