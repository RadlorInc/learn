import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../_rateLimit'
import { stripeClient } from '@/infra/stripe'
import { MAX_SEATS, clampSeats, type Cadence } from '@/core/billing'
import { SITE_URL } from '@/app/site'

/**
 * Start a Stripe Checkout Session for N seats. **TEST MODE ONLY** — `stripeClient()` refuses a live
 * key outright, which is the whole of the stage's hard constraint (docs/billing-stage-2.md §0).
 *
 * ⚠️ THE ACCOUNT COMES FROM THE TOKEN, NEVER FROM THE BODY. This is the trust boundary of the whole
 * billing surface: a caller who can name the account they are buying for can seat a child on
 * somebody else's subscription. The access token is verified against Supabase itself rather than
 * decoded here — a JWT this route parsed is a JWT this route also has to verify the signature of,
 * and `/auth/v1/user` already does that correctly.
 *
 * ⚠️ AND THE ACCOUNT IS STAMPED ONTO THE SUBSCRIPTION'S METADATA, NOT ONLY ON THE SESSION.
 * `client_reference_id` rides on the checkout SESSION, and every later event
 * (`customer.subscription.updated`, `.deleted`) carries the subscription and not the session — so
 * without the metadata the webhook could only resolve the account for events that arrive AFTER the
 * one that created the row. That is an ordering dependency, and the webhook is explicitly
 * out-of-order. With it, every event names its own account and order stops mattering.
 */
export const dynamic = 'force-dynamic'

/** Ten a minute per IP. Buying is a once-a-year action; the headroom is for a card retry. */
const LIMIT = 10
const WINDOW_MS = 60_000

const PRICE_ENV: Record<Cadence, string> = {
  monthly: 'STRIPE_PRICE_MONTHLY',
  annual: 'STRIPE_PRICE_ANNUAL',
}

export async function POST(req: Request) {
  if (overLimit(callerKey(req, 'checkout'), LIMIT, WINDOW_MS)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const cadence: Cadence = body.cadence === 'annual' ? 'annual' : 'monthly'
  // ⚠️ CLAMP, THEN REFUSE ZERO. Clamping alone would turn a request for 0 seats into a paid
  // subscription for nobody; refusing alone would 400 on a fat-fingered 5 that we are happy to sell
  // 4 of. `seats` is the one number in this request that costs money, so it is bounded twice.
  const seats = clampSeats(body.seats)
  if (seats < 1) return NextResponse.json({ error: 'seats must be 1..' + MAX_SEATS }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!supabaseUrl || !anon || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const who = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` },
  }).catch(() => null)
  // ⚠️ `fetch` does not throw on 4xx — an unchecked `res.json()` on a 401 body yields `{}` and an
  // `id` of undefined, which is an unauthenticated caller reaching checkout.
  if (!who || !who.ok) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const user = (await who.json().catch(() => null)) as { id?: string; email?: string } | null
  if (!user?.id) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const price = process.env[PRICE_ENV[cadence]]
  const stripe = stripeClient()
  // Not configured is not an error the parent caused. 503 rather than 500, and nothing is logged as
  // a crash: this is the state of every environment until the founder runs scripts/stripe-products.
  if (!stripe || !price) return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: seats }],
    client_reference_id: user.id,
    // ponytail: a returning buyer gets a second Stripe CUSTOMER rather than reusing their first.
    // Harmless for us — the account_id is what everything keys on — and the upgrade is to look up
    // `subscriptions.stripe_customer_id` here once Stage 3 has a portal to link them from.
    customer_email: user.email,
    subscription_data: { metadata: { account_id: user.id } },
    // No trial — founder's call, Stage 1 §1.
    success_url: `${SITE_URL}/parent?billing=success`,
    cancel_url: `${SITE_URL}/parent?billing=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
