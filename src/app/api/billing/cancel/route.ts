import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../../_rateLimit'
import { stripeClient } from '@/infra/stripe'
import { HOLDS_SEATS, subscriptionRow } from '@/core/billing'
import { sinkError } from '@/infra/errorSink'
import { ConfigMissing, adultFromBearer, sendEmail } from '@/features/consent/server'
import { renderCancelled } from '@/features/billing/cancelNotice'

/**
 * Cancel the caller's OWN subscription at the end of the period they have paid for.
 * docs/legal/01 §4 and docs/legal/12 §5 describe exactly this: no further charge, access until the
 * period ends, no refund by cancelling.
 *
 * ⚠️ THE SUBSCRIPTION IS FOUND FROM THE TOKEN, NEVER FROM THE BODY. The body is not read at all: the
 * account comes from the auth server, and the Stripe id from `subscriptions` WHERE account_id = that
 * account, read as the service role. A browser cannot name somebody else's subscription.
 *
 * ⚠️ ONE SOURCE OF TRUTH FOR THE SCREEN: the `subscriptions` row, which is only ever written from
 * Stripe's CURRENT object through `subscriptionRow` — by the webhook, and here from what
 * `subscriptions.update` returned, so the parent sees the new state now rather than whenever the
 * webhook lands. Both writers converge on Stripe's truth, so whichever arrives last is still right.
 *
 * Idempotent: a subscription already set to cancel is not updated again and no second email is sent.
 * Works while billing enforcement is off — it never reads `billing_config`; without a subscription row
 * (every account today) it answers `no_subscription` before Stripe is consulted.
 */
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (overLimit(callerKey(req, 'billing-cancel'), 10, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  let adult
  try { adult = await adultFromBearer(req) } catch (e) {
    if (e instanceof ConfigMissing) return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })
    throw e
  }
  if (!adult) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const mine = `${url}/rest/v1/subscriptions?account_id=eq.${encodeURIComponent(adult.id)}`

  const r = await fetch(`${mine}&select=stripe_subscription_id`, { headers, cache: 'no-store' }).catch(() => null)
  if (!r || !r.ok) return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  const subId = ((await r.json().catch(() => [])) as { stripe_subscription_id?: string | null }[])[0]?.stripe_subscription_id
  if (!subId) return NextResponse.json({ error: 'no_subscription' }, { status: 404 })

  const stripe = stripeClient()
  if (!stripe) return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })

  let sub = await stripe.subscriptions.retrieve(subId)
  if (!HOLDS_SEATS.has(sub.status)) return NextResponse.json({ error: 'no_subscription' }, { status: 404 })
  const already = sub.cancel_at_period_end
  if (!already) sub = await stripe.subscriptions.update(subId, { cancel_at_period_end: true })

  const row = subscriptionRow(sub)
  const log = (what: string) => sinkError({
    at: new Date().toISOString(), source: 'server', message: `billing cancel: ${what}`, routePath: '/api/billing/cancel',
  }).catch(() => {})

  // The cancellation is done at Stripe; a failed row write only delays the screen until the webhook.
  const w = await fetch(mine, {
    method: 'PATCH', cache: 'no-store', headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ status: row.status, cancel_at_period_end: row.cancel_at_period_end, current_period_end: row.current_period_end }),
  }).catch(() => null)
  if (!w || !w.ok) await log(`row write failed ${w?.status ?? 'network'} for ${sub.id}`)

  let emailed = false
  if (!already && adult.email) {
    try {
      await sendEmail(adult.email, renderCancelled(row.current_period_end), `billing-cancel-${sub.id}`)
      emailed = true
    } catch (e) {
      await log(`confirmation email failed for ${sub.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return NextResponse.json({
    ok: true, cancel_at_period_end: row.cancel_at_period_end, current_period_end: row.current_period_end,
    already, emailed,
  })
}
