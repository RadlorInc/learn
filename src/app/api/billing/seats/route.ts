import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../../_rateLimit'
import { stripeClient } from '@/infra/stripe'
import { HOLDS_SEATS, MAX_SEATS, subscriptionRow, totalCents, type Cadence } from '@/core/billing'
import { sinkError } from '@/infra/errorSink'
import { ConfigMissing, adultFromBearer } from '@/features/consent/server'

/**
 * Add ONE seat to the caller's OWN subscription (founder, 2026-10-01: a family whose seats are all in use adds a child
 * by adding a seat, in the app). Body `{ confirm: false }` (or none) = a preview that changes nothing: the plan's
 * cadence and the renewal total before and after. `{ confirm: true }` = Stripe sets the quantity to one more and
 * invoices the prorated difference now (`always_invoice`) on the card on file.
 *
 * ⚠️ `pending_if_incomplete`, NOT `error_if_incomplete` (founder, 2026-10-01): when the bank asks the parent to approve
 * the payment (3-D Secure — an OTP in India, often SCA in the UK/EU, rare in the US), or the card is declined, Stripe
 * does NOT change the quantity: the update waits as `pending_update` until the invoice is paid, and expires on its own if
 * it never is. The answer is then `{ pay_url }` (Stripe's hosted invoice page), where the parent approves or pays with
 * another card; once paid Stripe applies the quantity and the webhook (customer.subscription.updated) seats the child.
 * So an unpaid seat can never exist.
 *
 * ⚠️ THE SUBSCRIPTION IS FOUND FROM THE TOKEN, NEVER FROM THE BODY — the same rule as /api/billing/cancel.
 * ⚠️ A TARGET, NOT AN INCREMENT, AT STRIPE: the update is keyed `seat-<sub>-<new quantity>`, so a double tap or a
 * retried request asks for the same quantity again instead of adding two seats.
 * The row and the seats are written here from what Stripe returned (subscriptionRow + materialize_seats, as the
 * webhook does), so the new seat — and the child it is filled with (20261001150000) — is there at once.
 */
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (overLimit(callerKey(req, 'billing-seats'), 10, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  let adult
  try { adult = await adultFromBearer(req) } catch (e) {
    if (e instanceof ConfigMissing) return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })
    throw e
  }
  if (!adult) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const confirm = ((await req.json().catch(() => ({}))) as { confirm?: unknown }).confirm === true

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const mine = `${url}/rest/v1/subscriptions?account_id=eq.${encodeURIComponent(adult.id)}`

  const r = await fetch(`${mine}&select=id,stripe_subscription_id`, { headers, cache: 'no-store' }).catch(() => null)
  if (!r || !r.ok) return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  const own = ((await r.json().catch(() => [])) as { id?: string; stripe_subscription_id?: string | null }[])[0]
  if (!own?.id || !own.stripe_subscription_id) return NextResponse.json({ error: 'no_subscription' }, { status: 404 })

  const stripe = stripeClient()
  if (!stripe) return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })

  const sub = await stripe.subscriptions.retrieve(own.stripe_subscription_id)
  // Only a plan in good standing grows: a past-due one would pile a new charge on an unpaid one.
  if (sub.status !== 'active' || sub.cancel_at_period_end) return NextResponse.json({ error: 'not_active' }, { status: 409 })
  const item = sub.items.data[0]
  const seats = item?.quantity ?? 0
  if (!item || seats >= MAX_SEATS) return NextResponse.json({ error: 'at_most', seats }, { status: 409 })
  const cadence: Cadence = item.price?.recurring?.interval === 'year' ? 'annual' : 'monthly'
  const preview = { seats, cadence, renewalCents: totalCents(seats, cadence), newRenewalCents: totalCents(seats + 1, cadence) }
  if (!confirm) return NextResponse.json({ ok: true, preview })

  const log = (what: string) => sinkError({
    at: new Date().toISOString(), source: 'server', message: `billing seats: ${what}`, routePath: '/api/billing/seats',
  }).catch(() => {})
  let updated
  try {
    updated = await stripe.subscriptions.update(sub.id, {
      items: [{ id: item.id, quantity: seats + 1 }],
      proration_behavior: 'always_invoice',
      payment_behavior: 'pending_if_incomplete',
      expand: ['latest_invoice'],
    }, { idempotencyKey: `seat-${sub.id}-${seats + 1}` })
  } catch (e) {
    // Stripe refused the request outright: nothing changed there, so nothing is written here either. Stripe's own text
    // goes to error_events for the founder; the parent gets the plain sentence SeatsFull shows for `payment_failed`.
    await log(`stripe refused the seat update for ${sub.id}: ${(e instanceof Error ? e.message : String(e)).slice(0, 300)}`)
    return NextResponse.json({ error: 'payment_failed' }, { status: 402 })
  }

  // Not paid yet (the bank wants the parent's approval, or the card was declined): the quantity is NOT changed until it
  // is, so nothing is written here — the parent finishes on Stripe's page and the webhook does the rest.
  if (updated.pending_update) {
    const inv = updated.latest_invoice
    const payUrl = inv && typeof inv !== 'string' ? inv.hosted_invoice_url : null
    if (!payUrl) return NextResponse.json({ error: 'payment_failed' }, { status: 402 })
    return NextResponse.json({ ok: true, pay_url: payUrl })
  }

  const row = subscriptionRow(updated)
  // The seat is bought at Stripe; a failed write here only waits for the webhook, which writes the same thing.
  const w = await fetch(mine, {
    method: 'PATCH', cache: 'no-store', headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ status: row.status, seats_paid: row.seats_paid }),
  }).catch(() => null)
  if (!w || !w.ok) await log(`row write failed ${w?.status ?? 'network'} for ${sub.id}`)
  const m = await fetch(`${url}/rest/v1/rpc/materialize_seats`, {
    method: 'POST', cache: 'no-store', headers, body: JSON.stringify({ p_subscription_id: own.id, p_seats: row.seats_paid }),
  }).catch(() => null)
  if (!m || !m.ok) await log(`materialize_seats failed ${m?.status ?? 'network'} for ${sub.id}`)

  return NextResponse.json({ ok: true, seats: row.seats_paid })
}
