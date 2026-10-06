// @vitest-environment node
/**
 * "Add a seat" (/api/billing/seats), driven against a stand-in network: the auth server (token → account), PostgREST
 * (an in-memory `subscriptions` table and the materialize_seats RPC) and Stripe (the SDK's own fetch to api.stripe.com).
 * Prices are typed out by hand (799 first, 499 each more, monthly), never imported from core/billing.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { __resetStripe } from '@/infra/stripe'

const A = '11111111-2222-3333-4444-555555555555'
const TOKENS: Record<string, string> = { 'tok-A': A, 'tok-B': '99999999-8888-4777-8666-555555555555' }
const ENV = { ...process.env }
let table: { id: string; account_id: string; stripe_subscription_id: string; status: string; seats_paid: number }[]
let sub: { status: string; cancel_at_period_end: boolean; quantity: number }
let calls: { url: string; method: string; body: string; idem: string | null }[]
let declines: boolean
let needsApproval: boolean   // the bank wants 3-D Secure: Stripe keeps the change pending

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } })
const stripeObj = (pending = false) => ({
  pending_update: pending ? { subscription_items: [{ id: 'si_A', quantity: sub.quantity + 1 }], expires_at: 1_790_000_000 } : null,
  latest_invoice: pending ? { id: 'in_P', object: 'invoice', status: 'open', hosted_invoice_url: 'https://invoice.stripe.com/i/test_pending' } : 'in_paid',
  id: 'sub_A', object: 'subscription', status: sub.status, cancel_at_period_end: sub.cancel_at_period_end, customer: 'cus_A',
  metadata: { account_id: A },
  items: { object: 'list', data: [{ id: 'si_A', quantity: sub.quantity, price: { recurring: { interval: 'month' } }, current_period_start: 1_767_225_600, current_period_end: 1_769_904_000 }] },
})

async function network(input: unknown, init: RequestInit = {}): Promise<Response> {
  const url = String(input instanceof Request ? input.url : input), method = (init.method ?? 'GET').toUpperCase()
  const h = new Headers(init.headers)
  calls.push({ url, method, body: String(init.body ?? ''), idem: h.get('idempotency-key') })
  if (url.endsWith('/auth/v1/user')) {
    const id = TOKENS[(h.get('authorization') ?? '').replace(/^Bearer\s+/i, '')]
    return id ? json({ id, email: 'a@example.com' }) : json({ msg: 'invalid JWT' }, 401)
  }
  if (url.includes('/rest/v1/subscriptions')) {
    const f = new URL(url).searchParams.get('account_id')?.replace(/^eq\./, '')
    const hit = table.filter(r => r.account_id === f)
    if (method === 'PATCH') { hit.forEach(r => Object.assign(r, JSON.parse(String(init.body)))); return new Response(null, { status: 204 }) }
    return json(hit)
  }
  if (url.endsWith('/rest/v1/rpc/materialize_seats')) return json(JSON.parse(String(init.body)).p_seats)
  if (url.startsWith('https://api.stripe.com/v1/subscriptions/sub_A')) {
    if (method === 'POST') {
      if (declines) return json({ error: { type: 'invalid_request_error', message: 'Refused.' } }, 400)
      if (needsApproval) return json(stripeObj(true))   // pending_if_incomplete: the quantity does NOT change yet
      sub.quantity = Number(new URLSearchParams(String(init.body)).get('items[0][quantity]'))
    }
    return json(stripeObj())
  }
  return json({ unexpected: url }, 500)
}

const post = async (token: string | null, body?: unknown) => {
  const { POST } = await import('@/app/api/billing/seats/route')
  const r = await POST(new Request('https://app.test/api/billing/seats', {
    method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body: body === undefined ? undefined : JSON.stringify(body),
  }))
  return { status: r.status, body: await r.json() as Record<string, unknown> }
}
const stripePosts = () => calls.filter(c => c.url.startsWith('https://api.stripe.com') && c.method === 'POST')

beforeEach(() => {
  __resetStripe()
  Object.assign(process.env, {
    NEXT_PUBLIC_SUPABASE_URL: 'https://db.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key', STRIPE_SECRET_KEY: 'sk_test_seats',
  })
  table = [{ id: 'row-A', account_id: A, stripe_subscription_id: 'sub_A', status: 'active', seats_paid: 2 }]
  sub = { status: 'active', cancel_at_period_end: false, quantity: 2 }
  calls = []; declines = false; needsApproval = false
  vi.stubGlobal('fetch', vi.fn(network))
})
afterEach(() => { process.env = { ...ENV }; vi.unstubAllGlobals(); __resetStripe() })

describe('POST /api/billing/seats', () => {
  it('a preview prices one more seat and changes nothing', async () => {
    const r = await post('tok-A')
    expect(r).toEqual({ status: 200, body: { ok: true, preview: { seats: 2, cadence: 'monthly', renewalCents: 1298, newRenewalCents: 1797 } } })
    expect(stripePosts()).toEqual([])
    expect(table[0].seats_paid).toBe(2)
  })
  it('confirm sets Stripe to one more seat, invoiced now, keyed to the target; the row and the seats follow', async () => {
    const r = await post('tok-A', { confirm: true })
    expect(r).toEqual({ status: 200, body: { ok: true, seats: 3 } })
    const [w, ...more] = stripePosts()
    expect(more).toEqual([])
    const form = new URLSearchParams(w.body)
    expect(form.get('items[0][id]')).toBe('si_A')
    expect(form.get('items[0][quantity]')).toBe('3')
    expect(form.get('proration_behavior')).toBe('always_invoice')
    expect(form.get('payment_behavior')).toBe('pending_if_incomplete')
    expect(form.get('expand[0]')).toBe('latest_invoice')
    expect(w.idem).toBe('seat-sub_A-3')
    expect(table[0].seats_paid).toBe(3)
    expect(JSON.parse(calls.find(c => c.url.endsWith('/rpc/materialize_seats'))!.body)).toEqual({ p_subscription_id: 'row-A', p_seats: 3 })
  })
  it('the bank wants approval (3-D Secure): Stripe\'s page is handed back and NO seat is written until it is paid', async () => {
    needsApproval = true
    const r = await post('tok-A', { confirm: true })
    expect(r).toEqual({ status: 200, body: { ok: true, pay_url: 'https://invoice.stripe.com/i/test_pending' } })
    expect(table[0].seats_paid).toBe(2)
    expect(calls.some(c => c.url.endsWith('/rpc/materialize_seats'))).toBe(false)
  })
  it('a request Stripe refuses changes nothing here', async () => {
    declines = true
    const r = await post('tok-A', { confirm: true })
    expect(r.status).toBe(402)
    // B7: Stripe's own text goes to error_events for the founder, not to the parent's screen.
    expect(r.body).toEqual({ error: 'payment_failed' })
    const sunk = calls.filter(c => c.url.endsWith('/rest/v1/error_events') && c.method === 'POST')
    expect(sunk.length, 'the refusal was never logged').toBe(1)
    expect(JSON.parse(sunk[0].body).message).toBe('billing seats: stripe refused the seat update for sub_A: Refused.')
    expect(table[0].seats_paid).toBe(2)
    expect(calls.some(c => c.url.endsWith('/rpc/materialize_seats'))).toBe(false)
  })
  it('refuses at four seats, and for a plan that is past due or set to cancel', async () => {
    sub.quantity = 4
    expect((await post('tok-A', { confirm: true })).body.error).toBe('at_most')
    sub.quantity = 2; sub.status = 'past_due'
    expect((await post('tok-A', { confirm: true })).body.error).toBe('not_active')
    sub.status = 'active'; sub.cancel_at_period_end = true
    expect((await post('tok-A', { confirm: true })).body.error).toBe('not_active')
    expect(stripePosts()).toEqual([])
  })
  it('a signed-out caller is refused, and an account without a plan has nothing to grow', async () => {
    expect((await post(null, { confirm: true })).status).toBe(401)
    expect((await post('tok-B', { confirm: true })).body.error).toBe('no_subscription')
    expect(stripePosts()).toEqual([])
  })
})
