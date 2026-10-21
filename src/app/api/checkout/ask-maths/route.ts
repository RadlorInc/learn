import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { callerKey, overLimit } from '../../_rateLimit'
import { stripeClient } from '@/infra/stripe'
import { SITE_URL } from '@/app/site'
import { ASK_MATHS_ON } from '@/features/askMaths/stream'

/**
 * POST /api/checkout/ask-maths {renewalConsent: true} with the parent's token: a Stripe Checkout Session for Ask maths,
 * the add-on (docs/product/ask-maths.md) — its OWN subscription, one per account, on the same Stripe customer as the
 * plan. The webhook writes `addon_subscriptions` from it (`metadata.product = 'ask_maths'`), never `subscriptions`.
 *
 * The same rules as /api/checkout, for the same reasons (read its header): the account comes from the token
 * (`/auth/v1/user`), never the body; the renewal box must be ticked; the account is stamped on the subscription's
 * metadata; the customer is reused, or made under the same idempotency key as the plan's, so a family has one; and
 * two tabs end with at most one payable session — Stripe is asked AFTER this session exists.
 */
export const dynamic = 'force-dynamic'

const PRODUCT = 'ask_maths'
/** A live add-on, or its first payment still going through. */
const LIVE = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete'])
const isAddon = (m: Stripe.Metadata | null | undefined) => m?.product === PRODUCT

export async function POST(req: Request) {
  if (!ASK_MATHS_ON()) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (overLimit(callerKey(req, 'checkout-ask-maths'), 10, 60_000)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  if (body.renewalConsent !== true) return NextResponse.json({ error: 'renewal_consent_required' }, { status: 400 })
  const renewalConsentAt = new Date().toISOString()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!supabaseUrl || !anon || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const who = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } }).catch(() => null)
  if (!who || !who.ok) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const user = (await who.json().catch(() => null)) as { id?: string; email?: string } | null
  if (!user?.id) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const price = process.env.STRIPE_PRICE_ASK_MATHS
  const stripe = stripeClient()
  if (!stripe || !price) return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })

  // The add-on row and the plan's customer, read with the parent's own token (RLS: their rows only). Fails closed.
  const read = (path: string) => fetch(`${supabaseUrl}/rest/v1/${path}`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } })
    .then(r => (r.ok ? r.json() : null)).catch(() => null)
  const [addon, plan] = await Promise.all([
    read(`addon_subscriptions?account_id=eq.${user.id}&product=eq.${PRODUCT}&select=stripe_customer_id,status`),
    read(`subscriptions?account_id=eq.${user.id}&select=stripe_customer_id`),
  ])
  if (!Array.isArray(addon) || !Array.isArray(plan)) return NextResponse.json({ error: 'lookup_failed' }, { status: 503 })
  const [mine] = addon as { stripe_customer_id?: string | null; status?: string }[]
  if (mine?.status && LIVE.has(mine.status)) return NextResponse.json({ error: 'already_subscribed' }, { status: 409 })
  const accountId = user.id
  const stored = mine?.stripe_customer_id || (plan as { stripe_customer_id?: string | null }[])[0]?.stripe_customer_id || null
  const customer: string = stored
    || await stripe.customers.create({ email: user.email, metadata: { account_id: accountId } }, { idempotencyKey: `checkout-customer-${accountId}` }).then(c => c.id)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', customer, line_items: [{ price, quantity: 1 }], client_reference_id: accountId,
    metadata: { product: PRODUCT },
    subscription_data: { metadata: { account_id: accountId, product: PRODUCT, renewal_consent_at: renewalConsentAt } },
    success_url: `${SITE_URL}/parent?ask=added`, cancel_url: `${SITE_URL}/parent?ask=cancelled`,
  })
  const refuse = async (error: string, status: number, id = session.id) => {
    await stripe.checkout.sessions.expire(id).catch(() => {})
    return NextResponse.json({ error }, { status })
  }
  let subs: Stripe.Subscription[], listed: Stripe.Checkout.Session[]
  try {
    const [s, l] = await Promise.all([stripe.subscriptions.list({ customer, status: 'all', limit: 100 }), stripe.checkout.sessions.list({ customer, limit: 100 })])
    subs = s.data; listed = l.data
  } catch { return refuse('lookup_failed', 503) }
  if (subs.some(s => isAddon(s.metadata) && LIVE.has(s.status))) return refuse('already_subscribed', 409)
  const open = listed.filter(s => s.status === 'open' && isAddon(s.metadata))
  if (!open.some(s => s.id === session.id)) open.push(session)
  const keep = open.reduce((a, b) => (b.created > a.created || (b.created === a.created && b.id > a.id) ? b : a))
  const gone = (id: string) => stripe.checkout.sessions.expire(id).then(() => true,
    () => stripe.checkout.sessions.retrieve(id).then(s => s.status === 'expired', () => false))
  const done = await Promise.all(open.filter(s => s.id !== keep.id).map(s => gone(s.id)))
  if (done.includes(false)) return refuse('checkout_conflict', 409, keep.id)
  return NextResponse.json({ ok: true, url: keep.url })
}
