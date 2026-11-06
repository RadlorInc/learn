/**
 * POST /api/checkout/ask-maths: the add-on's own subscription, on the plan's customer, marked metadata.product =
 * ask_maths (the webhook routes on it), the account from the token, the renewal box required, and a live add-on
 * refused — in our row or in Stripe.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { __resetStripe } from '@/infra/stripe'

const ACC = '00000000-0000-4000-8000-0000000000aa'
type Call = { url: string; method: string; body: string }

function stub(o: { addonRow?: Record<string, unknown>[]; planCustomer?: string | null; stripeAddon?: string[] } = {}) {
  __resetStripe()
  const calls: Call[] = []
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } })
  vi.stubGlobal('fetch', vi.fn(async (input: unknown, init: RequestInit = {}) => {
    const url = String(input), method = (init.method ?? 'GET').toUpperCase()
    calls.push({ url, method, body: String(init.body ?? '') })
    if (url.includes('/auth/v1/user')) return json({ id: ACC, email: 'p@example.com' })
    if (url.includes('/rest/v1/addon_subscriptions')) return json(o.addonRow ?? [])
    if (url.includes('/rest/v1/subscriptions')) return json(o.planCustomer ? [{ stripe_customer_id: o.planCustomer }] : [])
    if (url.startsWith('https://api.stripe.com/v1/customers') && method === 'POST') return json({ id: 'cus_new', object: 'customer' })
    if (url.startsWith('https://api.stripe.com/v1/checkout/sessions') && method === 'POST' && !url.includes('/expire'))
      return json({ id: 'cs_1', object: 'checkout.session', status: 'open', created: 1, url: 'https://checkout.stripe.com/c/cs_1', metadata: { product: 'ask_maths' } })
    if (url.includes('/expire')) return json({ id: 'cs_1', object: 'checkout.session', status: 'expired' })
    if (url.startsWith('https://api.stripe.com/v1/subscriptions')) return json({ object: 'list', has_more: false,
      data: (o.stripeAddon ?? []).map((s, i) => ({ id: `sub_${i}`, object: 'subscription', status: s, metadata: { product: 'ask_maths' } })) })
    if (url.startsWith('https://api.stripe.com/v1/checkout/sessions')) return json({ object: 'list', has_more: false, data: [] })
    return json({ unexpected: url }, 500)
  }))
  return calls
}
async function buy(body: unknown, token = 'parent-token') {
  const { POST } = await import('@/app/api/checkout/ask-maths/route')
  return POST(new Request('https://radlic.test/api/checkout/ask-maths', { method: 'POST', body: JSON.stringify(body), headers: { authorization: `Bearer ${token}` } }))
}

describe('POST /api/checkout/ask-maths', () => {
  beforeEach(() => {
    vi.stubEnv('ASK_MATHS', 'on'); vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://db.example.test'); vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_x'); vi.stubEnv('STRIPE_PRICE_ASK_MATHS', 'price_ask')
  })
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); __resetStripe() })

  it('opens a session for one add-on on the PLAN\'s customer, marked as the add-on, for the token\'s account', async () => {
    const calls = stub({ planCustomer: 'cus_plan' })
    const res = await buy({ renewalConsent: true })
    expect(res.status).toBe(200); expect(await res.json()).toEqual({ ok: true, url: 'https://checkout.stripe.com/c/cs_1' })
    const sent = new URLSearchParams(calls.find(c => c.method === 'POST' && c.url.endsWith('/v1/checkout/sessions'))!.body)
    expect(sent.get('customer')).toBe('cus_plan')
    expect(sent.get('line_items[0][price]')).toBe('price_ask'); expect(sent.get('line_items[0][quantity]')).toBe('1')
    expect(sent.get('subscription_data[metadata][product]')).toBe('ask_maths')
    expect(sent.get('subscription_data[metadata][account_id]')).toBe(ACC)
    expect(calls.some(c => c.url.startsWith('https://api.stripe.com/v1/customers') && c.method === 'POST')).toBe(false)
  })
  it('no renewal tick: 400 and Stripe is never asked; switched off: 404', async () => {
    const calls = stub()
    expect((await buy({})).status).toBe(400)
    expect(calls.filter(c => c.url.includes('stripe.com'))).toEqual([])
    vi.stubEnv('ASK_MATHS', '')
    expect((await buy({ renewalConsent: true })).status).toBe(404)
  })
  it('a live add-on in our row: 409 before any session; a live one only in Stripe: the new session is expired, 409', async () => {
    let calls = stub({ addonRow: [{ status: 'active', stripe_customer_id: 'cus_plan' }] })
    expect((await buy({ renewalConsent: true })).status).toBe(409)
    expect(calls.some(c => c.url.endsWith('/v1/checkout/sessions') && c.method === 'POST')).toBe(false)
    calls = stub({ planCustomer: 'cus_plan', stripeAddon: ['active'] })
    const res = await buy({ renewalConsent: true })
    expect(res.status).toBe(409); expect(await res.json()).toEqual({ error: 'already_subscribed' })
    expect(calls.some(c => c.url.includes('/cs_1/expire'))).toBe(true)
  })
  it('a cancelled add-on in our row does not block buying it again', async () => {
    stub({ addonRow: [{ status: 'canceled', stripe_customer_id: 'cus_old' }] })
    expect((await buy({ renewalConsent: true })).status).toBe(200)
  })
})
