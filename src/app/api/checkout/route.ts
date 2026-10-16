import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { callerKey, overLimit } from '../_rateLimit'
import { stripeClient } from '@/infra/stripe'
import { HOLDS_SEATS, MAX_SEATS, clampSeats, type Cadence } from '@/core/billing'
import { SITE_URL } from '@/app/site'
import { sinkError } from '@/infra/errorSink'

/**
 * Start a Stripe Checkout Session for N seats. Which Stripe mode (test or live) a deployment may use is decided in
 * one place, `stripeClient()` in src/infra/stripe.ts — not here.
 *
 * ⚠️ ONE SUBSCRIPTION PER ACCOUNT. The webhook keeps one row per account, so a second live subscription would charge
 * the family twice and overwrite the first one's row. A family whose plan still holds seats is refused (409); a
 * second child is added with /api/billing/seats instead. Before any row exists (two tabs), Stripe is asked — below.
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

/** A subscription that holds seats, or whose first payment is still in progress (`incomplete`, up to 23 h). */
const LIVE = new Set([...HOLDS_SEATS, 'incomplete'])

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
  // The parent ticked "I agree to the automatic renewal terms shown above" next to the button (plan/page.tsx). No
  // tick, no session: an auto-renewing charge needs affirmative consent first (California's ARL; ATTORNEY-PACKET C1).
  if (body.renewalConsent !== true) return NextResponse.json({ error: 'renewal_consent_required' }, { status: 400 })
  const renewalConsentAt = new Date().toISOString()

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

  /**
   * ⚠️ REUSE THE STRIPE CUSTOMER THIS ACCOUNT ALREADY HAS. A parent who cancels and resubscribes
   * would otherwise end up with TWO customer objects — which is harmless to US, because everything
   * keys on `account_id`, and is not harmless to Stripe: their payment history splits across both,
   * and the billing portal has to pick one to send them to. *"Which of your two customers is this
   * parent"* is a support question with no good answer, and it gets worse every month it exists.
   * Cheap now, awkward later.
   *
   * ⚠️ AND IT IS READ WITH THE PARENT'S OWN TOKEN, NOT THE SERVICE ROLE. `subscriptions` grants
   * SELECT to `authenticated` behind an owner-scoped policy, so RLS guarantees this can only ever
   * return their own row — and checkout needs no service-role key at all, which keeps the one key
   * that bypasses every policy out of the request path a logged-in stranger can reach.
   */
  // ⚠️ FAILS CLOSED: this read is also the double-subscription check, so "could not look" is not "has none".
  const owned = await fetch(
    `${supabaseUrl}/rest/v1/subscriptions?account_id=eq.${user.id}&select=stripe_customer_id,status`,
    { headers: { apikey: anon, Authorization: `Bearer ${token}` } },
  ).then(r => (r.ok ? r.json() : null)).catch(() => null)
  if (!Array.isArray(owned)) return NextResponse.json({ error: 'lookup_failed' }, { status: 503 })
  const [mine] = owned as { stripe_customer_id?: string | null; status?: string }[]
  if (mine?.status && HOLDS_SEATS.has(mine.status)) return NextResponse.json({ error: 'already_subscribed' }, { status: 409 })
  const stored = mine?.stripe_customer_id || null

  const params = {
    mode: 'subscription' as const,
    line_items: [{ price, quantity: seats }],
    client_reference_id: user.id,
    // The consent's time travels with the subscription, so Stripe holds the record of when they agreed.
    subscription_data: { metadata: { account_id: user.id, renewal_consent_at: renewalConsentAt } },
    // No trial — founder's call, Stage 1 §1.
    // Back to the plan screen, which reads `billing=success` to say "activating" until the webhook has written the row.
    success_url: `${SITE_URL}/parent/plan?billing=success`,
    cancel_url: `${SITE_URL}/parent?billing=cancelled`,
  }

  /**
   * ⚠️ TWO TABS. The row above is written by the webhook AFTER payment, so two tabs — or a double click across a slow
   * return — both pass it, and each used to get its own payable Checkout Session: pay both, two subscriptions. So
   * Stripe itself is asked, on ONE customer per account:
   *   1. No stored customer → create one under an idempotency key derived from the account, so two concurrent first
   *      checkouts get the SAME customer (Stripe replays the first answer; the SDK retries the 409 Stripe gives while
   *      the first is still in flight). ponytail: Stripe keeps a key about 24 h, so an account with no row that comes
   *      back a day later gets a second, empty customer — store the id at creation if that clutter ever matters.
   *   2. Create the session, THEN list the customer's subscriptions and sessions. After, not before: a check made
   *      before the create misses a tab that pays in between.
   *   3. A live subscription (with `incomplete`: a first payment still going through) → expire ours, 409.
   *   4. Of the OPEN sessions, keep the NEWEST and expire the rest. Every request agrees on "newest", and the last
   *      request to list sees every session, so at most one stays payable — the latest plan asked for. Expired, not
   *      reused: reusing an open one would hand tab 2 tab 1's seat count. A tab left holding an expired session gets
   *      Stripe's "expired" page and starts again; it cannot pay.
   *   5. An expire Stripe refuses for a session that is not then `expired` (it was just paid, or Stripe did not
   *      answer) → expire the keeper too, 409. Already expired by the other tab's request is fine.
   * A Stripe read that fails → expire ours, 503: "could not look" is not "has none".
   */
  const accountId = user.id
  const newCustomer = () => stripe.customers.create(
    { email: user.email, metadata: { account_id: accountId } },
    { idempotencyKey: `checkout-customer-${accountId}` },
  ).then(c => c.id)
  let customer = stored || await newCustomer()

  let session
  try {
    session = await stripe.checkout.sessions.create({ ...params, customer })
  } catch (e) {
    // ⚠️ A STORED CUSTOMER ID CAN GO STALE — deleted in the dashboard, or belonging to the other
    // mode after a test/live switch. Stripe answers `resource_missing`, and without this the parent
    // simply cannot buy, with the reason visible only in a server log. Retry once on a new customer:
    // a duplicate customer is the thing this block exists to avoid, and it is still far better than
    // a checkout that is dead for one family and healthy for everyone else.
    if (!stored || (e as { code?: string })?.code !== 'resource_missing') throw e
    await sinkError({
      at: new Date().toISOString(),
      source: 'server',
      message: `checkout: stored stripe_customer_id ${stored} is gone — starting a new customer`,
      routePath: '/api/checkout',
    }).catch(() => {})
    customer = await newCustomer()
    session = await stripe.checkout.sessions.create({ ...params, customer })
  }

  const own = session
  const refuse = async (error: string, status: number, id = own.id) => {
    await stripe.checkout.sessions.expire(id).catch(() => {})
    return NextResponse.json({ error }, { status })
  }
  let subs: Stripe.Subscription[], listed: Stripe.Checkout.Session[]
  try {
    const [s, l] = await Promise.all([
      stripe.subscriptions.list({ customer, status: 'all', limit: 100 }),
      stripe.checkout.sessions.list({ customer, limit: 100 }),
    ])
    subs = s.data
    listed = l.data
  } catch {
    return refuse('lookup_failed', 503)
  }
  if (subs.some(s => LIVE.has(s.status))) return refuse('already_subscribed', 409)

  const open = listed.filter(s => s.status === 'open')
  if (!open.some(s => s.id === own.id)) open.push(own)
  const keep = open.reduce((a, b) => (b.created > a.created || (b.created === a.created && b.id > a.id) ? b : a))
  // A refused expire is fine only if the session is now expired (the other tab's request got there first).
  const gone = (id: string) => stripe.checkout.sessions.expire(id).then(() => true,
    () => stripe.checkout.sessions.retrieve(id).then(s => s.status === 'expired', () => false))
  const done = await Promise.all(open.filter(s => s.id !== keep.id).map(s => gone(s.id)))
  if (done.includes(false)) return refuse('checkout_conflict', 409, keep.id)

  return NextResponse.json({ url: keep.url })
}
