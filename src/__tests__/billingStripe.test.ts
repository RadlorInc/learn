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
    annual: { 1: 7599, 2: 12399, 3: 17199, 4: 21999 },
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
      price: { recurring: { interval: 'month' } },
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
  resendStatus?: number         // what Resend answers a send with
  stored?: string               // the stripe_subscription_id already on the account's row (none by default)
  others?: Record<string, Record<string, unknown>>  // Stripe's answer for a subscription other than `sub`
  upsertFails?: { status: number; body: unknown }[]  // answers to the subscription upserts, in order, before a success
  upsert?: { status: number; body: unknown }        // what PostgREST answers the subscriptions upsert with
} = {}) {
  const calls: Call[] = []
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  vi.stubGlobal('fetch', vi.fn(async (input: unknown, init: RequestInit = {}) => {
    const url = String(input)
    calls.push({ url, method: (init.method ?? 'GET').toUpperCase(), body: String(init.body ?? ''),
                 headers: (init.headers ?? {}) as Record<string, string> })

    if (url.startsWith('https://api.stripe.com/v1/subscriptions/')) {
      const id = url.slice('https://api.stripe.com/v1/subscriptions/'.length).split('?')[0]
      return json(opts.others?.[id] ?? opts.sub ?? SUB())
    }
    if (url === 'https://api.resend.com/emails') return json({ id: 'em_1' }, opts.resendStatus ?? 200)
    if (url.includes('/rest/v1/billing_events')) {
      if ((init.method ?? 'GET').toUpperCase() === 'POST') return json(opts.inserted ?? [{ id: 'be_1' }], 201)
      // 204 must carry a null body — `new Response('null', {status:204})` is a TypeError.
      if ((init.method ?? 'GET').toUpperCase() === 'PATCH') return new Response(null, { status: 204 })
      return json([{ processed_at: opts.processedAt ?? null }])
    }
    if (url.includes('/rest/v1/subscriptions')) {
      if ((init.method ?? 'GET').toUpperCase() === 'GET') return json(opts.stored ? [{ stripe_subscription_id: opts.stored }] : [])
      const fail = opts.upsertFails?.shift()
      if (fail) return json(fail.body, fail.status)
      if (opts.upsert) return json(opts.upsert.body, opts.upsert.status)
      return json([{ id: 'sub-row-1' }], 201)
    }
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
    process.env.RESEND_API_KEY = 're_test'
  })
  afterEach(() => { process.env = { ...ENV }; vi.unstubAllGlobals(); __resetStripe() })

  it('C8 — an unsigned delivery is rejected, and NOTHING is written', async () => {
    const calls = stubNetwork()
    const res = await deliver('checkout.session.completed', { subscription: 'sub_123' }, 't=1,v1=deadbeef')
    expect(res.status).toBe(400)
    // ⚠️ The status alone would pass on a handler that wrote the row and THEN checked the
    // signature. The claim is that an unverifiable body reaches nothing (but the error sink, below).
    const reached = calls.filter(c => !c.url.includes('/rest/v1/error_events'))
    expect(reached, `it called out to: ${reached.map(c => c.url).join(', ')}`).toEqual([])
  })

  it('C8b — a signature from the WRONG secret is rejected too', async () => {
    const calls = stubNetwork()
    const payload = JSON.stringify({ id: 'evt_1', object: 'event', type: 'x', created: 1, data: { object: {} } })
    const header = stripeClient()!.webhooks.generateTestHeaderString({ payload, secret: 'whsec_someone_else' })
    const res = await deliver('checkout.session.completed', { subscription: 'sub_123' }, header)
    expect(res.status).toBe(400)
    expect(calls.filter(c => !c.url.includes('/rest/v1/error_events'))).toEqual([])
  })

  it('B5 — a signature that does not verify reaches error_events: a fixed line, never the body or the header', async () => {
    // A rotated or mistyped STRIPE_WEBHOOK_SECRET fails EVERY real delivery this way: paid, never applied. Before
    // this it was a console.warn only, gone from Vercel's logs within the hour.
    const calls = stubNetwork()
    await deliver('checkout.session.completed', { subscription: 'sub_secret_123', customer_email: 'p@x.example' }, 't=1,v1=deadbeef')
    const sunk = post(calls, '/rest/v1/error_events')
    expect(sunk.length, 'the bad signature never reached error_events').toBe(1)
    expect(JSON.parse(sunk[0].body).message).toBe(
      'stripe webhook: signature did not verify — if Stripe is the sender, STRIPE_WEBHOOK_SECRET is wrong')
    for (const leak of ['sub_secret_123', 'p@x.example', 'deadbeef', SECRET]) expect(sunk[0].body).not.toContain(leak)
  })

  it('B5 — a webhook with a setting missing says WHICH one in error_events, never a value', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    const calls = stubNetwork()
    const res = await deliver('checkout.session.completed', { subscription: 'sub_123' }, 't=1,v1=deadbeef')
    expect(res.status).toBe(503)
    const sunk = post(calls, '/rest/v1/error_events')
    expect(sunk.length, 'the missing setting never reached error_events').toBe(1)
    expect(JSON.parse(sunk[0].body).message).toBe(
      'stripe webhook: not configured (STRIPE_WEBHOOK_SECRET) — delivery refused, Stripe will retry')
    expect(sunk[0].body).not.toContain('sk_test_stage2b')
    expect(sunk[0].body).not.toContain('service-key')
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

  // Seen on a local stack driven by Stripe test mode (6 Oct 2026): checkout.session.completed, invoice.paid and
  // customer.subscription.created arrive within a second; two of them insert the account's first row at once, and the
  // loser's upsert fails on subscriptions_stripe_customer_id_key (ON CONFLICT names only account_id) → 500.
  const RACE = { status: 409, body: { code: '23505', message: 'duplicate key value violates unique constraint "subscriptions_stripe_customer_id_key"' } }

  it('RACE — a first-row race (23505) is retried once and then applied: 200, seats reconciled, event closed', async () => {
    const calls = stubNetwork({ upsertFails: [RACE] })
    const res = await deliver('checkout.session.completed', { id: 'cs_1', subscription: 'sub_123' })
    expect(res.status).toBe(200)
    expect(post(calls, '/rest/v1/subscriptions').length, 'the upsert was not tried again').toBe(2)
    expect(post(calls, 'rpc/materialize_seats').length).toBe(1)
    expect(calls.some(c => c.method === 'PATCH' && c.url.includes('billing_events'))).toBe(true)
  })

  it('RACE — only once: a second 23505 is a real failure (500, Stripe redelivers), not a loop', async () => {
    const calls = stubNetwork({ upsertFails: [RACE, RACE] })
    const res = await deliver('checkout.session.completed', { id: 'cs_1', subscription: 'sub_123' })
    expect(res.status).toBe(500)
    expect(post(calls, '/rest/v1/subscriptions').length).toBe(2)
  })

  it('RACE — any other failure is not retried', async () => {
    const calls = stubNetwork({ upsertFails: [{ status: 400, body: { code: '22P02', message: 'invalid input syntax' } }] })
    const res = await deliver('checkout.session.completed', { id: 'cs_1', subscription: 'sub_123' })
    expect(res.status).toBe(500)
    expect(post(calls, '/rest/v1/subscriptions').length).toBe(1)
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

  it('B2 — a late event about an OLD subscription does not overwrite the plan the family has now', async () => {
    // The parent cancelled sub_123, re-subscribed as sub_new, and sub_123's `deleted` arrives afterwards. One row per
    // account: applying it would write `canceled`, 0 seats over the plan they are paying for.
    const calls = stubNetwork({
      sub: SUB({ status: 'canceled' }), stored: 'sub_new', others: { sub_new: SUB({ id: 'sub_new', status: 'active' }) },
    })
    const res = await deliver('customer.subscription.deleted', { id: 'sub_123' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ignored: 'not_current_subscription' })
    expect(post(calls, '/rest/v1/subscriptions'), 'the stale event overwrote the current subscription').toEqual([])
    expect(post(calls, 'rpc/materialize_seats')).toEqual([])
    expect(calls.some(c => c.method === 'PATCH' && c.url.includes('billing_events')), 'the event was left open').toBe(true)
    expect(JSON.parse(post(calls, '/rest/v1/error_events')[0].body).message).toContain('sub_new (active)')
  })

  it('B2 positive twin — a new subscription replaces one that has ENDED', async () => {
    const calls = stubNetwork({ stored: 'sub_old', others: { sub_old: SUB({ id: 'sub_old', status: 'canceled' }) } })
    await deliver('checkout.session.completed', { id: 'cs_2', subscription: 'sub_123' })
    expect(JSON.parse(post(calls, '/rest/v1/subscriptions')[0].body)).toMatchObject({
      account_id: ACC, stripe_subscription_id: 'sub_123', status: 'active', seats_paid: 2,
    })
    expect(JSON.parse(post(calls, 'rpc/materialize_seats')[0].body).p_seats).toBe(2)
  })

  it('B2 positive twin — the CURRENT subscription\'s own deletion is applied', async () => {
    const calls = stubNetwork({ sub: SUB({ status: 'canceled' }), stored: 'sub_123' })
    await deliver('customer.subscription.deleted', { id: 'sub_123' })
    expect(JSON.parse(post(calls, '/rest/v1/subscriptions')[0].body)).toMatchObject({ status: 'canceled', seats_paid: 0 })
    expect(JSON.parse(post(calls, 'rpc/materialize_seats')[0].body).p_seats).toBe(0)
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

  it('MAP-02 — the event log keeps no customer PII, only the Stripe references and the amount', async () => {
    // ⚠️ `billing_events` SURVIVES ACCOUNT DELETION (accountDeletion.ts SURVIVORS) on the promise
    // that it "names nobody". Storing the whole Stripe event broke that: a checkout session carries
    // the parent's email, name, address and phone in `customer_details`, and `account_id → NULL`
    // does nothing to a copy of them inside `payload`. Expected shape written out by hand — not
    // derived from the code under test.
    const calls = stubNetwork()
    const res = await deliver('checkout.session.completed', {
      id: 'cs_1', object: 'checkout.session', subscription: 'sub_123', customer: 'cus_9',
      client_reference_id: ACC, amount_total: 1298, currency: 'usd',
      customer_email: 'parent@family.example',
      customer_details: {
        email: 'parent@family.example', name: 'Pat Parent', phone: '+15551234567',
        address: { line1: '12 Elm Street', city: 'Springfield', postal_code: '12345', country: 'US' },
      },
      metadata: { account_id: ACC },
    })
    expect(res.status).toBe(200)

    const [log] = post(calls, '/rest/v1/billing_events')
    const body = JSON.parse(log.body)
    for (const pii of ['parent@family.example', 'Pat Parent', '+15551234567', '12 Elm Street', 'Springfield', '12345']) {
      expect(log.body, `the stored event still contains "${pii}"`).not.toContain(pii)
    }
    // …nor anything that joins the row back to the family once account_id is nulled.
    expect(log.body, 'our own account id is stored inside the payload').not.toContain(ACC)
    expect(body).toEqual({
      stripe_event_id: 'evt_1',
      type: 'checkout.session.completed',
      payload: {
        id: 'evt_1', type: 'checkout.session.completed', created: 1,
        object_id: 'cs_1', subscription: 'sub_123', amount_total: 1298, currency: 'usd',
      },
    })
    // Positive control: the entitlement write is unchanged by what we chose to log.
    expect(JSON.parse(post(calls, '/rest/v1/subscriptions')[0].body)).toMatchObject({
      account_id: ACC, stripe_subscription_id: 'sub_123', status: 'active', seats_paid: 2,
    })
    expect(JSON.parse(post(calls, 'rpc/materialize_seats')[0].body)).toEqual({ p_subscription_id: 'sub-row-1', p_seats: 2 })
  })

  it('MAP-02 — a subscription event logs the subscription id, not the customer or its metadata', async () => {
    const calls = stubNetwork()
    await deliver('customer.subscription.updated', {
      ...SUB(), customer: { id: 'cus_9', email: 'parent@family.example', name: 'Pat Parent',
        address: { line1: '12 Elm Street' } },
    })
    const [log] = post(calls, '/rest/v1/billing_events')
    for (const leak of ['parent@family.example', 'Pat Parent', '12 Elm Street', ACC]) {
      expect(log.body, `the stored event still contains "${leak}"`).not.toContain(leak)
    }
    expect(JSON.parse(log.body).payload).toEqual({
      id: 'evt_1', type: 'customer.subscription.updated', created: 1,
      object_id: 'sub_123', subscription: 'sub_123',
    })
    expect(post(calls, 'rpc/materialize_seats').length).toBe(1)
  })

  // ⚠️ AFTER "CLOSE YOUR ACCOUNT" (20261008000000): the close cancels and refunds at Stripe, and Stripe then sends
  // `customer.subscription.deleted` (and `charge.refunded`) for an account that no longer exists. PostgREST answers
  // the upsert with 409 / 23503 — `subscriptions.account_id` references auth.users — its real shape, typed out.
  const FK_GONE = { status: 409, body: { code: '23503', details: 'Key (account_id)=(…) is not present in table "users".', hint: null,
    message: 'insert or update on table "subscriptions" violates foreign key constraint "subscriptions_account_id_fkey"' } }

  it('an event for a CLOSED account is acknowledged and closed — no 500, no redelivery, naming nobody', async () => {
    const calls = stubNetwork({ sub: SUB({ status: 'canceled' }), upsert: FK_GONE })
    const res = await deliver('customer.subscription.deleted', { id: 'sub_123' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ignored: 'account_closed' })
    expect(post(calls, 'rpc/materialize_seats')).toEqual([])
    expect(post(calls, '/rest/v1/error_events'), 'an expected event is not an error').toEqual([])
    const patch = calls.find(c => c.method === 'PATCH' && c.url.includes('billing_events'))
    expect(JSON.parse(patch!.body)).toMatchObject({ account_id: null })
    expect(JSON.parse(patch!.body).processed_at).toBeTruthy()
  })

  it('positive twin — any OTHER refusal of the upsert is still a 500, so Stripe redelivers', async () => {
    const calls = stubNetwork({ upsert: { status: 409, body: { code: '23505', message: 'duplicate key value violates unique constraint' } } })
    const res = await deliver('customer.subscription.updated', { id: 'sub_123' })
    expect(res.status).toBe(500)
    expect(calls.some(c => c.method === 'PATCH' && c.url.includes('billing_events')), 'the event must stay open').toBe(false)
  })

  it('the refund\'s own event (charge.refunded) is closed without a Stripe round-trip or a write', async () => {
    const calls = stubNetwork({ upsert: FK_GONE })
    const res = await deliver('charge.refunded', { id: 'ch_1', object: 'charge', amount_refunded: 605 })
    expect(res.status).toBe(200)
    expect(calls.filter(c => c.url.startsWith('https://api.stripe.com'))).toEqual([])
    expect(post(calls, '/rest/v1/subscriptions')).toEqual([])
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
// ─────────────────────────────────────────────────────────────────────────────
//  THE EMAILS A SUBSCRIPTION OWES (docs/legal/01 §3). Every sentence, date and amount below is typed out by hand.
//  PERIOD_END is 2026-02-01T00:00:00Z.
// ─────────────────────────────────────────────────────────────────────────────
describe('the Stripe webhook sends the acknowledgement and the annual renewal reminder', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    __resetStripe()
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPA
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    process.env.STRIPE_SECRET_KEY = 'sk_test_stage2b'
    process.env.STRIPE_WEBHOOK_SECRET = SECRET
    process.env.RESEND_API_KEY = 're_test'
  })
  afterEach(() => { process.env = { ...ENV }; vi.unstubAllGlobals(); __resetStripe() })

  const sent = (calls: Call[]) => calls.filter(c => c.url === 'https://api.resend.com/emails' && c.method === 'POST')
  const closed = (calls: Call[]) => calls.some(c => c.method === 'PATCH' && c.url.includes('billing_events'))
  const CHECKOUT = { id: 'cs_1', subscription: 'sub_123', amount_total: 1298, customer_details: { email: 'parent@example.com' } }
  const UPCOMING = { object: 'invoice', parent: { subscription_details: { subscription: 'sub_123' } },
                     customer_email: 'parent@example.com', amount_due: 12399 }
  const ANNUAL = (over: Record<string, unknown> = {}) => SUB(over, { price: { recurring: { interval: 'year' } } })

  it('a completed checkout sends ONE acknowledgement: terms, renewal and how to cancel', async () => {
    const calls = stubNetwork()
    const res = await deliver('checkout.session.completed', CHECKOUT)
    expect(res.status).toBe(200)
    const mails = sent(calls)
    expect(mails).toHaveLength(1)
    const body = JSON.parse(mails[0].body)
    expect(body.to).toEqual(['parent@example.com'])
    expect(body.subject).toBe('Your Radlic subscription — confirmation and how to cancel')
    expect(body.text).toContain('Plan: Radlic Family, for 2 children.')
    expect(body.text).toContain('Charged today: $12.98.')
    expect(body.text).toContain('Renews: automatically, every month, next on February 1, 2026. Renewal amount: $12.98 (we do not charge sales tax).')
    expect(body.text).toContain('Account → Plan & billing → See plans → Cancel subscription, email support@radlor.com or call 1-888-812-9373')
    expect(body.text).toContain('https://radlic.com/legal/refunds')
    expect(body.text).not.toContain('permission')   // consent is the email-plus flow, not checkout
    expect(mails[0].headers['Idempotency-Key']).toBe('billing-ack-sub_123')
    expect(closed(calls)).toBe(true)
  })

  it('an annual plan: the acknowledgement says every 12 months and the annual renewal amount', async () => {
    const calls = stubNetwork({ sub: ANNUAL() })
    await deliver('checkout.session.completed', { ...CHECKOUT, amount_total: 12399 })
    const body = JSON.parse(sent(calls)[0].body)
    expect(body.text).toContain('Renews: automatically, every 12 months, next on February 1, 2026. Renewal amount: $123.99 (we do not charge sales tax).')
  })

  it('an annual renewal coming up sends the reminder, with the amount Stripe will charge and the date', async () => {
    const calls = stubNetwork({ sub: ANNUAL() })
    const res = await deliver('invoice.upcoming', UPCOMING)
    expect(res.status).toBe(200)
    const mails = sent(calls)
    expect(mails).toHaveLength(1)
    const body = JSON.parse(mails[0].body)
    expect(body.to).toEqual(['parent@example.com'])
    expect(body.subject).toBe('Your Radlic annual subscription renews soon')
    expect(body.text).toContain('Your Radlic annual subscription for 2 children renews automatically on February 1, 2026.')
    expect(body.text).toContain('You will be charged $123.99 for the next 12 months.')
    expect(body.text).toContain('Cancel subscription, email support@radlor.com or call 1-888-812-9373')
    // One reminder per renewal: the key carries the period, so next year's is a new message.
    expect(mails[0].headers['Idempotency-Key']).toBe('billing-renewal-sub_123-2026-02-01T00:00:00.000Z')
  })

  it('no reminder for a MONTHLY renewal — the policy promises it for annual plans only', async () => {
    const calls = stubNetwork()
    const res = await deliver('invoice.upcoming', UPCOMING)
    expect(res.status).toBe(200)
    expect(sent(calls)).toEqual([])
    expect(closed(calls)).toBe(true)
  })

  it('no reminder for an annual plan already cancelled — it will not renew', async () => {
    const calls = stubNetwork({ sub: ANNUAL({ cancel_at_period_end: true }) })
    await deliver('invoice.upcoming', UPCOMING)
    expect(sent(calls)).toEqual([])
  })

  it('no email for any other subscription event', async () => {
    const calls = stubNetwork()
    await deliver('customer.subscription.updated', { id: 'sub_123' })
    expect(sent(calls)).toEqual([])
  })

  it('a failed send answers 5xx and leaves the event OPEN, so Stripe redelivers (the key stops a double send)', async () => {
    const calls = stubNetwork({ resendStatus: 500 })
    const res = await deliver('checkout.session.completed', CHECKOUT)
    expect(res.status).toBe(500)
    expect(sent(calls)).toHaveLength(1)
    expect(closed(calls)).toBe(false)
  })

  it('no RESEND_API_KEY: billing still completes and the event closes; nothing is sent', async () => {
    delete process.env.RESEND_API_KEY
    const calls = stubNetwork()
    const res = await deliver('checkout.session.completed', CHECKOUT)
    expect(res.status).toBe(200)
    expect(sent(calls)).toEqual([])
    expect(post(calls, 'rpc/materialize_seats')).toHaveLength(1)
    expect(closed(calls)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
//  5. THE ONE THING A DRIVEN TEST CANNOT SEE: that the refusal still exists.
// ─────────────────────────────────────────────────────────────────────────────
describe('the key mode is pinned to the deployment, in code', () => {
  beforeEach(() => { __resetStripe() })
  afterEach(() => { process.env = { ...ENV }; __resetStripe() })

  it('C9 — a LIVE secret key is refused everywhere but Vercel Production', () => {
    // ⚠️ DRIVEN, not a grep for the prefix. A live key on a preview, staging or a laptop would charge
    // a real card from code nobody reviewed for production.
    process.env.STRIPE_SECRET_KEY = 'sk_live_realmoney'
    delete process.env.VERCEL_ENV
    expect(() => stripeClient()).toThrow(/sk_test_/)
    process.env.VERCEL_ENV = 'preview'
    expect(() => stripeClient()).toThrow(/sk_test_/)
  })

  it('C9b — Production takes ONLY a live key: a test key there sells access for test cards', () => {
    process.env.VERCEL_ENV = 'production'
    process.env.STRIPE_SECRET_KEY = 'sk_test_free'
    expect(() => stripeClient()).toThrow(/sk_live_/)
    process.env.STRIPE_SECRET_KEY = 'sk_live_ok'
    expect(stripeClient()).toBeTruthy()
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
    const src = ['src/app/api/stripe/webhook/route.ts',
                 'src/core/billing.ts', 'src/infra/stripe.ts', 'scripts/stripe-products.mts']
      .map(f => readFileSync(join(__dirname, '../..', f), 'utf8')).join('\n')
    expect(src).not.toMatch(/['"]price_[A-Za-z0-9]{6,}['"]/)
    // …and the prefix search is not blind: it finds one when there IS one.
    expect(`const p = 'price_1QabcdefGHIJ'`).toMatch(/['"]price_[A-Za-z0-9]{6,}['"]/)
  })
})
