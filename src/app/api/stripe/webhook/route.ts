import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripeClient } from '@/infra/stripe'
import { subscriptionRow } from '@/core/billing'
import { sinkError } from '@/infra/errorSink'

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

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const stripe = stripeClient()
  if (!stripe || !secret || !SUPA() || !KEY()) {
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
    // Not sinkError: an unsigned POST to a public URL is a scan, not a crash, and logging it as one
    // would make a crash sink noisy exactly when somebody starts probing.
    return NextResponse.json(
      { error: 'bad_signature', detail: e instanceof Error ? e.message : 'unverifiable' },
      { status: 400 },
    )
  }

  // ── 1. Idempotency, in the database ────────────────────────────────────────
  const id = encodeURIComponent(event.id)
  const ins = await db('billing_events?on_conflict=stripe_event_id', {
    method: 'POST',
    prefer: 'resolution=ignore-duplicates,return=representation',
    body: JSON.stringify({ stripe_event_id: event.id, type: event.type, payload: event }),
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
  const object = event.data.object as { id?: string; subscription?: string | { id: string } | null }
  const subId =
    event.type === 'checkout.session.completed'
      ? typeof object.subscription === 'string'
        ? object.subscription
        : (object.subscription?.id ?? null)
      : event.type.startsWith('customer.subscription.')
        ? (object.id ?? null)
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

  // ── 4. The write. Upsert on the ACCOUNT, then reconcile the seats to it ────
  const up = await db('subscriptions?on_conflict=account_id&select=id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: JSON.stringify(row),
  }).catch(() => null)
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

  return done({ ok: true, status: row.status, seats: row.seats_paid }, row.account_id)
}
