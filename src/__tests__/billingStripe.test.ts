import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  LADDER, MAX_SEATS, clampSeats, graduatedTiers, subscriptionRow, totalCents, type Cadence,
} from '@/core/billing'
import { stripeClient, __resetStripe } from '@/infra/stripe'

/**
 * BILLING — STAGE 2b. The price ladder, the row the webhook writes, and the webhook itself DRIVEN
 * end to end against a stubbed Stripe and a stubbed PostgREST.
 *
 * ⚠️ WHY DRIVEN AND NOT READ. Every property this endpoint is sold on — idempotent, order-
 * independent, convergent on replay — is invisible in the source: the code for "uses the event's
 * payload" and "re-fetches from Stripe" look equally reasonable, and only delivering a STALE event
 * against a CHANGED subscription tells them apart. The one thing a source check adds is at the
 * bottom, and it is the thing a driven test cannot see: that the test-mode refusal still exists.
 */

const ACC = '11111111-2222-3333-4444-555555555555'
const SUPA = 'https://db.example'
const SECRET = 'whsec_stage2b'
const ENV = { ...process.env }

// ─────────────────────────────────────────────────────────────────────────────
//  1. THE LADDER — asserted against HAND-COMPUTED totals.
// ─────────────────────────────────────────────────────────────────────────────
describe('the price ladder', () => {
  /**
   * ⚠️ THESE NUMBERS ARE THE FOUNDER'S, TYPED OUT, NOT DERIVED FROM `LADDER`. A test that computed
   * `first + extra * (n-1)` would restate the implementation and pass on any typo in it — the
   * ladder would define what is correct instead of being checked against it. That is the whole
   * difference between a check and a restatement, and it is why the totals were asked for
   * separately when the prices were.
   */
  const EXPECTED: Record<Cadence, Record<number, number>> = {
    monthly: { 1: 799, 2: 1298, 3: 1797, 4: 2296 },
    annual: { 1: 6399, 2: 10398, 3: 14397, 4: 18396 },
  }

  for (const cadence of ['monthly', 'annual'] as Cadence[]) {
    for (const seats of [1, 2, 3, 4]) {
      it(`${seats} seat(s) ${cadence} costs $${(EXPECTED[cadence][seats] / 100).toFixed(2)}`, () => {
        expect(totalCents(seats, cadence)).toBe(EXPECTED[cadence][seats])
      })
    }
  }

  it('is GRADUATED in shape: one tier for the first seat, then everything else', () => {
    // ⚠️ The tier list is what Stripe is handed. `up_to: 'inf'` on the last tier is founder's call —
    // the 4-seat cap lives in the app so it stays changeable without a new product.
    for (const c of ['monthly', 'annual'] as Cadence[]) {
      const t = graduatedTiers(c)
      expect(t.map(x => x.up_to)).toEqual([1, 'inf'])
      expect(t[0].unit_amount).toBe(LADDER[c].first)
      expect(t[1].unit_amount).toBe(LADDER[c].extra)
      // A LADDER THAT GOES UP would make graduated the expensive option and volume the cheap one,
      // which is the reverse of the assumption the tiers_mode warning rests on.
      expect(t[1].unit_amount).toBeLessThan(t[0].unit_amount)
    }
  })

  it('the annual price is a real discount on twelve months, both tiers', () => {
    // Not a number check so much as a sanity one: an annual ladder that costs MORE than monthly is
    // a typo nobody notices until a parent does the arithmetic on a pricing page.
    expect(LADDER.annual.first).toBeLessThan(LADDER.monthly.first * 12)
    expect(LADDER.annual.extra).toBeLessThan(LADDER.monthly.extra * 12)
  })

  it('clamps seats to 0..4 rather than throwing', () => {
    expect(clampSeats(7)).toBe(MAX_SEATS)
    expect(clampSeats(-2)).toBe(0)
    expect(clampSeats(2.7)).toBe(2)
    expect(clampSeats(undefined)).toBe(0)
    expect(clampSeats(NaN)).toBe(0)
    expect(clampSeats('3')).toBe(0)      // a string quantity is not a quantity
    expect(totalCents(9, 'monthly')).toBe(2296)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
//  2. THE ROW THE WEBHOOK WRITES.
// ─────────────────────────────────────────────────────────────────────────────
const PERIOD_START = 1_767_225_600          // 2026-01-01T00:00:00Z
const PERIOD_END = 1_769_904_000
const SUB = (over: Record<string, unknown> = {}, item: Record<string, unknown> = {}) => ({
  id: 'sub_123',
  object: 'subscription',
  status: 'active',
  cancel_at_period_end: false,
  customer: 'cus_9',
  metadata: { account_id: ACC },
  items: {
    object: 'list',
    data: [{
      id: 'si_1', quantity: 2,
      current_period_start: PERIOD_START, current_period_end: PERIOD_END,
      ...item,
    }],
  },
  ...over,
})

describe('subscriptionRow', () => {
  it('reads the period off the ITEM, not off the subscription', () => {
    // ⚠️ THE TRAP THIS BAND OF THE STRIPE API MOVED. `current_period_start/end` left the
    // subscription object in 2025-03-31.basil and live on the item. Reading the old place is
    // `undefined` in JS — no error, both periods null — and a null `current_period_start` silently
    // deletes BOTH the grace window and `reassign_learner_seat`'s one-per-period limit. So the
    // fixture puts a DIFFERENT value in the old place and the item's must be the one that wins.
    const row = subscriptionRow(SUB({ current_period_start: 1, current_period_end: 2 }) as never)
    expect(row.current_period_start).toBe(new Date(PERIOD_START * 1000).toISOString())
    expect(row.current_period_end).toBe(new Date(PERIOD_END * 1000).toISOString())
  })

  it('an ACTIVE subscription holds its seats', () => {
    const row = subscriptionRow(SUB() as never)
    expect(row).toMatchObject({
      account_id: ACC, stripe_customer_id: 'cus_9', stripe_subscription_id: 'sub_123',
      status: 'active', seats_paid: 2, grace_until: null, cancel_at_period_end: false,
    })
  })

  it('C7 — a quantity above the ceiling clamps instead of failing the write', () => {
    // ⚠️ NOT COSMETIC. `subscriptions.seats_paid` carries `check (between 0 and 4)`, so a 7 written
    // straight through would REJECT THE ROW and lose the whole event — the exact outcome
    // materialize_seats' own clamp exists to avoid, arriving one layer earlier.
    expect(subscriptionRow(SUB({}, { quantity: 7 }) as never).seats_paid).toBe(4)
  })

  it('C4 — an unknown status releases the seats, it does not error', () => {
    // Fails CLOSED, matching is_chapter_entitled's allow-list. A status we have never met means we
    // do not know they are paying.
    const row = subscriptionRow(SUB({ status: 'something_new_from_stripe' }) as never)
    expect(row.status).toBe('something_new_from_stripe')
    expect(row.seats_paid).toBe(0)
    expect(row.grace_until).toBeNull()
  })

  it('C5 — a cancelled subscription releases every seat', () => {
    expect(subscriptionRow(SUB({ status: 'canceled' }) as never).seats_paid).toBe(0)
    expect(subscriptionRow(SUB({ status: 'incomplete_expired' }) as never).seats_paid).toBe(0)
  })

  it('C6 — past_due KEEPS the seats and gets a 7-day window from the period start', () => {
    const row = subscriptionRow(SUB({ status: 'past_due' }) as never)
    expect(row.seats_paid, 'a failed card must not stop a child mid-week').toBe(2)
    expect(row.grace_until).toBe(new Date((PERIOD_START + 7 * 86_400) * 1000).toISOString())
  })

  it('the grace window is DERIVED, so a replayed event cannot extend it', () => {
    // ⚠️ THE AT-LEAST-ONCE TRAP. `now() + 7 days` would move the deadline forward every time Stripe
    // redelivered, turning a 7-day grace into an unbounded one with nothing on screen to show for
    // it. Asserted by computing it at two different "nows" and requiring the same answer.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-05T00:00:00Z'))
    const a = subscriptionRow(SUB({ status: 'unpaid' }) as never).grace_until
    vi.setSystemTime(new Date('2026-03-05T00:00:00Z'))
    const b = subscriptionRow(SUB({ status: 'unpaid' }) as never).grace_until
    vi.useRealTimers()
    expect(a).toBe(b)
  })

  it('takes the account only from a well-formed uuid in the metadata', () => {
    expect(subscriptionRow(SUB({ metadata: {} }) as never).account_id).toBeNull()
    expect(subscriptionRow(SUB({ metadata: { account_id: 'me' } }) as never).account_id).toBeNull()
    expect(subscriptionRow(SUB({ metadata: null }) as never).account_id).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
//  3. THE WEBHOOK, DRIVEN.
// ─────────────────────────────────────────────────────────────────────────────
type Call = { url: string; method: string; body: string; headers: Record<string, string> }

/** Route every outbound call: api.stripe.com answers with `sub`, PostgREST answers per path. */
function stubNetwork(opts: {
  sub?: Record<string, unknown>
  inserted?: unknown[]          // what the billing_events insert returns ([] = duplicate)
  processedAt?: string | null   // what the duplicate look-up finds
} = {}) {
  const calls: Call[] = []
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  vi.stubGlobal('fetch', vi.fn(async (input: unknown, init: RequestInit = {}) => {
    const url = String(input)
    calls.push({ url, method: (init.method ?? 'GET').toUpperCase(), body: String(init.body ?? ''),
                 headers: (init.headers ?? {}) as Record<string, string> })

    if (url.startsWith('https://api.stripe.com/v1/subscriptions/')) return json(opts.sub ?? SUB())
    if (url.includes('/rest/v1/billing_events')) {
      if ((init.method ?? 'GET').toUpperCase() === 'POST') return json(opts.inserted ?? [{ id: 'be_1' }], 201)
      // 204 must carry a null body — `new Response('null', {status:204})` is a TypeError.
      if ((init.method ?? 'GET').toUpperCase() === 'PATCH') return new Response(null, { status: 204 })
      return json([{ processed_at: opts.processedAt ?? null }])
    }
    if (url.includes('/rest/v1/subscriptions')) return json([{ id: 'sub-row-1' }], 201)
    if (url.includes('/rest/v1/rpc/materialize_seats')) return json(2)
    if (url.includes('/auth/v1/user')) return json({ id: ACC, email: 'p@example.com' })
    return json({ unexpected: url }, 500)
  }))
  return calls
}

/** A real, correctly-signed delivery — the signature is generated with the SDK's own helper, so a
 *  test never depends on our own reading of the scheme. */
async function deliver(type: string, object: Record<string, unknown>, sig?: string) {
  const { POST } = await import('@/app/api/stripe/webhook/route')
  const payload = JSON.stringify({ id: 'evt_1', object: 'event', type, created: 1, data: { object } })
  const header = sig ?? stripeClient()!.webhooks.generateTestHeaderString({ payload, secret: SECRET })
  return POST(new Request('https://x/api/stripe/webhook', {
    method: 'POST', body: payload, headers: { 'stripe-signature': header },
  }))
}

const post = (calls: Call[], fragment: string) =>
  calls.filter(c => c.url.includes(fragment) && c.method === 'POST')

describe('the Stripe webhook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    __resetStripe()
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPA
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    process.env.STRIPE_SECRET_KEY = 'sk_test_stage2b'
    process.env.STRIPE_WEBHOOK_SECRET = SECRET
  })
  afterEach(() => { process.env = { ...ENV }; vi.unstubAllGlobals(); __resetStripe() })

  it('C8 — an unsigned delivery is rejected, and NOTHING is written', async () => {
    const calls = stubNetwork()
    const res = await deliver('checkout.session.completed', { subscription: 'sub_123' }, 't=1,v1=deadbeef')
    expect(res.status).toBe(400)
    // ⚠️ The status alone would pass on a handler that wrote the row and THEN checked the
    // signature. The claim is that an unverifiable body reaches nothing.
    expect(calls, `it called out to: ${calls.map(c => c.url).join(', ')}`).toEqual([])
  })

  it('C8b — a signature from the WRONG secret is rejected too', async () => {
    const calls = stubNetwork()
    const payload = JSON.stringify({ id: 'evt_1', object: 'event', type: 'x', created: 1, data: { object: {} } })
    const header = stripeClient()!.webhooks.generateTestHeaderString({ payload, secret: 'whsec_someone_else' })
    const res = await deliver('checkout.session.completed', { subscription: 'sub_123' }, header)
    expect(res.status).toBe(400)
    expect(calls).toEqual([])
  })

  it('C1 — a completed checkout writes the subscription and reconciles its seats', async () => {
    const calls = stubNetwork()
    const res = await deliver('checkout.session.completed', { id: 'cs_1', subscription: 'sub_123' })
    expect(res.status).toBe(200)

    const [upsert] = post(calls, '/rest/v1/subscriptions')
    expect(upsert, 'no subscription upsert happened').toBeTruthy()
    expect(JSON.parse(upsert.body)).toMatchObject({
      account_id: ACC, stripe_subscription_id: 'sub_123', status: 'active', seats_paid: 2,
    })
    // ⚠️ ON CONFLICT ON THE ACCOUNT. Without it a second purchase by the same family inserts a
    // SECOND subscription row and entitlement starts depending on which one is read.
    expect(upsert.url).toContain('on_conflict=account_id')
    expect(upsert.body).not.toContain('"id"')     // never write our own primary key

    const [seats] = post(calls, 'rpc/materialize_seats')
    expect(seats, 'the seats were never materialised — entitlement would be dead').toBeTruthy()
    expect(JSON.parse(seats.body)).toEqual({ p_subscription_id: 'sub-row-1', p_seats: 2 })

    // …and the event is closed, which is what stops the next delivery redoing it.
    const patch = calls.find(c => c.method === 'PATCH' && c.url.includes('billing_events'))
    expect(patch).toBeTruthy()
    expect(JSON.parse(patch!.body).processed_at).toBeTruthy()
  })

  it('C2 — the SAME event delivered twice does nothing the second time', async () => {
    const calls = stubNetwork({ inserted: [], processedAt: '2026-01-01T00:00:00Z' })
    const res = await deliver('checkout.session.completed', { subscription: 'sub_123' })
    expect(await res.json()).toEqual({ duplicate: true })
    expect(post(calls, '/rest/v1/subscriptions')).toEqual([])
    expect(post(calls, 'rpc/materialize_seats')).toEqual([])
    expect(calls.filter(c => c.url.startsWith('https://api.stripe.com'))).toEqual([])
  })

  it('a delivery that logged the event and then DIED is retried, not swallowed', async () => {
    // ⚠️ THE HALF OF IDEMPOTENCY THAT IS EASY TO GET BACKWARDS. Keyed on the row EXISTING, this
    // event would be skipped for ever having done nothing at all — a subscription paid for and
    // never applied, and no error anywhere. Keyed on `processed_at`, the retry finishes the job.
    const calls = stubNetwork({ inserted: [], processedAt: null })
    const res = await deliver('checkout.session.completed', { subscription: 'sub_123' })
    expect(res.status).toBe(200)
    expect(post(calls, 'rpc/materialize_seats').length).toBe(1)
  })

  it('C3 — a stale event writes CURRENT state, because it re-fetches from Stripe', async () => {
    // ⚠️ THE ORDER-INDEPENDENCE PROPERTY, AND THE ONLY TEST THAT CAN SEE IT. The delivery carries an
    // OLD copy of the subscription saying 4 seats and `active`; Stripe currently says 1 seat and
    // `past_due`. A handler that trusted `event.data.object` would write 4 — restoring a state the
    // parent has already left, from an event Stripe merely retried late.
    const calls = stubNetwork({ sub: SUB({ status: 'past_due' }, { quantity: 1 }) })
    const stale = SUB({ status: 'active' }, { quantity: 4 })
    const res = await deliver('customer.subscription.updated', stale as Record<string, unknown>)
    expect(res.status).toBe(200)

    const row = JSON.parse(post(calls, '/rest/v1/subscriptions')[0].body)
    expect(row.seats_paid, 'the stale payload was written instead of current state').toBe(1)
    expect(row.status).toBe('past_due')
    expect(row.grace_until).toBeTruthy()
    expect(JSON.parse(post(calls, 'rpc/materialize_seats')[0].body).p_seats).toBe(1)
  })

  it('C5 — a deleted subscription releases the seats without touching the learner', async () => {
    const calls = stubNetwork({ sub: SUB({ status: 'canceled' }) })
    await deliver('customer.subscription.deleted', { id: 'sub_123' })
    expect(JSON.parse(post(calls, '/rest/v1/subscriptions')[0].body).seats_paid).toBe(0)
    expect(JSON.parse(post(calls, 'rpc/materialize_seats')[0].body).p_seats).toBe(0)
    // Nothing in this path may reach a learner row. The seat is released; the child's record is not
    // ours to take away — reads are deliberately never gated.
    expect(calls.some(c => c.url.includes('/rest/v1/learner'))).toBe(false)
  })

  it('a subscription created outside our checkout is logged and closed, never retried for ever', async () => {
    const calls = stubNetwork({ sub: SUB({ metadata: {} }) })
    const res = await deliver('customer.subscription.updated', { id: 'sub_123' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ignored: 'no_account_metadata' })
    expect(post(calls, '/rest/v1/subscriptions')).toEqual([])
    // It is a 200 so Stripe stops redelivering — retrying cannot invent an account — but it is LOUD.
    expect(console.error).toHaveBeenCalled()
  })

  it('an event about nothing we bill on is closed without a Stripe round-trip', async () => {
    const calls = stubNetwork()
    const res = await deliver('customer.updated', { id: 'cus_9' })
    expect(await res.json()).toEqual({ ignored: 'customer.updated' })
    expect(calls.filter(c => c.url.startsWith('https://api.stripe.com'))).toEqual([])
  })

  it('a failed database write returns 5xx and does NOT close the event', async () => {
    // The redelivery is the recovery, and it only happens if we say the delivery failed.
    stubNetwork()
    vi.stubGlobal('fetch', vi.fn(async (input: unknown, init: RequestInit = {}) => {
      const url = String(input)
      if (url.startsWith('https://api.stripe.com/v1/subscriptions/')) {
        return new Response(JSON.stringify(SUB()), { headers: { 'Content-Type': 'application/json' } })
      }
      if (url.includes('/rest/v1/billing_events') && (init.method ?? '').toUpperCase() === 'POST') {
        return new Response(JSON.stringify([{ id: 'be_1' }]), { status: 201, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.includes('/rest/v1/subscriptions')) return new Response('permission denied', { status: 403 })
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }))
    const res = await deliver('checkout.session.completed', { subscription: 'sub_123' })
    expect(res.status).toBe(500)
  })

  it('answers 503 rather than crashing while no keys are configured', async () => {
    delete process.env.STRIPE_SECRET_KEY
    __resetStripe()
    stubNetwork()
    const { POST } = await import('@/app/api/stripe/webhook/route')
    const res = await POST(new Request('https://x/api/stripe/webhook', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(503)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
//  4. CHECKOUT.
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    __resetStripe()
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPA
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    process.env.STRIPE_SECRET_KEY = 'sk_test_stage2b'
    process.env.STRIPE_PRICE_MONTHLY = 'price_m'
    process.env.STRIPE_PRICE_ANNUAL = 'price_a'
  })
  afterEach(() => { process.env = { ...ENV }; vi.unstubAllGlobals(); __resetStripe() })

  const checkout = async (body: unknown, auth = 'Bearer token-abc') => {
    const { POST } = await import('@/app/api/checkout/route')
    return POST(new Request('https://x/api/checkout', {
      method: 'POST', body: JSON.stringify(body),
      headers: auth ? { authorization: auth } : {},
    }))
  }

  function stubCheckout(opts: { userOk?: boolean; customerId?: string | null; staleCustomer?: boolean } = {}) {
    const { userOk = true, customerId = null, staleCustomer = false } = opts
    const calls: Call[] = []
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    vi.stubGlobal('fetch', vi.fn(async (input: unknown, init: RequestInit = {}) => {
      const url = String(input)
      calls.push({ url, method: (init.method ?? 'GET').toUpperCase(), body: String(init.body ?? ''),
                   headers: (init.headers ?? {}) as Record<string, string> })
      if (url.includes('/auth/v1/user')) {
        return userOk ? json({ id: ACC, email: 'p@example.com' }) : json({ msg: 'invalid token' }, 401)
      }
      // The account's own subscription row — where a Stripe customer id would already be.
      if (url.includes('/rest/v1/subscriptions')) {
        return json(customerId ? [{ stripe_customer_id: customerId }] : [])
      }
      if (url.includes('/v1/checkout/sessions')) {
        // A stale stored id: Stripe answers `resource_missing` the FIRST time and succeeds on the
        // retry that drops it.
        const sent = new URLSearchParams(String(init.body ?? ''))
        if (staleCustomer && sent.get('customer')) {
          return json({ error: { type: 'invalid_request_error', code: 'resource_missing',
                                 message: 'No such customer' } }, 400)
        }
        return json({ id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' })
      }
      return json({ unexpected: url }, 500)
    }))
    return calls
  }

  it('refuses a caller with no token', async () => {
    stubCheckout()
    expect((await checkout({ seats: 2 }, '')).status).toBe(401)
  })

  it('⚠️ refuses a token Supabase rejects — a 401 body is not a user', async () => {
    // `fetch` does not throw on 4xx, so an unchecked `res.json()` here yields `{}` and an `id` of
    // undefined — an unauthenticated caller reaching checkout with an account of "undefined".
    stubCheckout({ userOk: false })
    expect((await checkout({ seats: 2 })).status).toBe(401)
  })

  it('refuses zero seats rather than selling a subscription for nobody', async () => {
    stubCheckout()
    expect((await checkout({ seats: 0 })).status).toBe(400)
    expect((await checkout({})).status).toBe(400)
  })

  it('takes the account from the TOKEN, never from the body', async () => {
    // ⚠️ THE TRUST BOUNDARY OF THE WHOLE BILLING SURFACE. A caller who can name the account they are
    // buying for can put a child of theirs on somebody else's subscription.
    const calls = stubCheckout()
    const res = await checkout({ seats: 3, account_id: '99999999-9999-9999-9999-999999999999' })
    expect(res.status).toBe(200)
    const session = calls.find(c => c.url.includes('/v1/checkout/sessions'))!
    const form = new URLSearchParams(session.body)
    expect(form.get('client_reference_id')).toBe(ACC)
    expect(form.get('subscription_data[metadata][account_id]')).toBe(ACC)
    expect(session.body).not.toContain('99999999')
  })

  it('sends the seat count as the QUANTITY on one tiered price', async () => {
    const calls = stubCheckout()
    await checkout({ seats: 3, cadence: 'annual' })
    const form = new URLSearchParams(calls.find(c => c.url.includes('/v1/checkout/sessions'))!.body)
    expect(form.get('line_items[0][price]')).toBe('price_a')
    expect(form.get('line_items[0][quantity]')).toBe('3')
    expect(form.get('mode')).toBe('subscription')
    // ⚠️ NO TRIAL — founder's call, Stage 1 §1. A trial added here is money nobody decided to lose.
    expect(session_has_trial(calls)).toBe(false)
  })

  it('clamps a request for more seats than we sell', async () => {
    const calls = stubCheckout()
    await checkout({ seats: 40 })
    const form = new URLSearchParams(calls.find(c => c.url.includes('/v1/checkout/sessions'))!.body)
    expect(form.get('line_items[0][quantity]')).toBe(String(MAX_SEATS))
  })


  it('reuses the Stripe CUSTOMER this account already has', async () => {
    // ⚠️ NOT COSMETIC, AND NOT OUR PROBLEM ALONE. A parent who cancels and resubscribes would get a
    // SECOND customer object: harmless to us, because everything keys on `account_id`, and not
    // harmless to Stripe — their payment history splits across both and the billing portal has to
    // pick one. "Which of your two customers is this parent" is a support question with no good
    // answer, and it gets worse every month it exists.
    const calls = stubCheckout({ customerId: 'cus_existing' })
    await checkout({ seats: 1 })
    const form = new URLSearchParams(calls.find(c => c.url.includes('/v1/checkout/sessions'))!.body)
    expect(form.get('customer')).toBe('cus_existing')
    // ⚠️ `customer` and `customer_email` are mutually exclusive — a session carrying both is
    // rejected by Stripe, so this pair is the check, not the first line alone.
    expect(form.get('customer_email')).toBeNull()
  })

  it('starts a new customer when the account has none', async () => {
    // The positive control for the case above: without it, "reuses the customer" is equally
    // satisfied by a route that always sends a `customer` field, including an empty one.
    const calls = stubCheckout({ customerId: null })
    await checkout({ seats: 1 })
    const form = new URLSearchParams(calls.find(c => c.url.includes('/v1/checkout/sessions'))!.body)
    expect(form.get('customer')).toBeNull()
    expect(form.get('customer_email')).toBe('p@example.com')
  })

  it('looks the customer up with the PARENT\'S OWN token, never the service role', async () => {
    // ⚠️ `subscriptions` grants SELECT to `authenticated` behind an owner-scoped policy, so RLS
    // guarantees this read can only return their own row. The service-role key bypasses every
    // policy in the database, and this is a route a logged-in stranger can reach — so the check is
    // that the key never appears in ANY outbound call, which is what catches the day somebody
    // "fixes" this lookup by reaching for it.
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-sentinel'
    const calls = stubCheckout({ customerId: 'cus_existing' })
    await checkout({ seats: 1 })
    const lookup = calls.find(c => c.url.includes('/rest/v1/subscriptions'))!
    expect(lookup.url).toContain(`account_id=eq.${ACC}`)
    expect(lookup.headers.Authorization).toBe('Bearer token-abc')
    expect(JSON.stringify(calls)).not.toContain('service-role-sentinel')
  })

  it('a stored customer id that has gone missing does not kill the purchase', async () => {
    // Deleted in the dashboard, or belonging to the other mode after a test/live switch. Without
    // the retry this family simply cannot buy, and the reason is visible only in a server log.
    const calls = stubCheckout({ customerId: 'cus_deleted', staleCustomer: true })
    const res = await checkout({ seats: 1 })
    expect(res.status).toBe(200)
    const sessions = calls.filter(c => c.url.includes('/v1/checkout/sessions'))
    expect(sessions.length, 'it did not retry').toBe(2)
    expect(new URLSearchParams(sessions[1].body).get('customer_email')).toBe('p@example.com')
  })

  it('answers 503 while no price is configured', async () => {
    delete process.env.STRIPE_PRICE_MONTHLY
    stubCheckout()
    expect((await checkout({ seats: 1 })).status).toBe(503)
  })
})

const session_has_trial = (calls: Call[]) =>
  calls.some(c => c.url.includes('/v1/checkout/sessions') && /trial/.test(c.body))

// ─────────────────────────────────────────────────────────────────────────────
//  5. THE ONE THING A DRIVEN TEST CANNOT SEE: that the refusal still exists.
// ─────────────────────────────────────────────────────────────────────────────
describe('test mode is enforced in code, not in discipline', () => {
  beforeEach(() => { __resetStripe() })
  afterEach(() => { process.env = { ...ENV }; __resetStripe() })

  it('C9 — a LIVE secret key is refused outright', () => {
    // ⚠️ DRIVEN, not a grep for the prefix. This is the whole of the founder's hard constraint for
    // Stage 2: nothing in this stage may be able to take a real card. B12 (no backup of the
    // children's data) is open, and `billing_config.enforced` gates ACCESS, not PAYMENT — so it is
    // not a safety net here and must not be sold as one.
    process.env.STRIPE_SECRET_KEY = 'sk_live_realmoney'
    expect(() => stripeClient()).toThrow(/test mode only/i)
  })

  it('a test key is accepted, and no key at all is a quiet null', () => {
    // Positive control. Without it the check above passes just as happily on a function that throws
    // for every input, which would be a billing surface that can never be configured at all.
    process.env.STRIPE_SECRET_KEY = 'sk_test_ok'
    expect(stripeClient()).toBeTruthy()
    __resetStripe()
    delete process.env.STRIPE_SECRET_KEY
    expect(stripeClient()).toBeNull()
  })

  it('no price id is hard-coded anywhere in the source', () => {
    // A `price_...` literal in the repo is a product this code can point at without anyone choosing
    // to — which is exactly how a test build reaches a live product.
    const src = ['src/app/api/checkout/route.ts', 'src/app/api/stripe/webhook/route.ts',
                 'src/core/billing.ts', 'src/infra/stripe.ts', 'scripts/stripe-products.mts']
      .map(f => readFileSync(join(__dirname, '../..', f), 'utf8')).join('\n')
    expect(src).not.toMatch(/['"]price_[A-Za-z0-9]{6,}['"]/)
    // …and the prefix search is not blind: it finds one when there IS one.
    expect(`const p = 'price_1QabcdefGHIJ'`).toMatch(/['"]price_[A-Za-z0-9]{6,}['"]/)
  })
})
