// @vitest-environment jsdom
/**
 * IN-APP CANCELLATION (docs/legal/01 §4, docs/legal/12 §5), DRIVEN END TO END.
 *
 * One faithful stand-in for the network: the auth server (token → account), PostgREST (a real filter
 * over an in-memory `subscriptions` table), Stripe (the SDK's own fetch client hitting api.stripe.com)
 * and Resend. The screen test renders the real card, whose fetch is routed into the real route
 * handler, and whose read comes from the same table the route wrote — so "the state renders" means
 * the database says so, not that the component remembered a click.
 *
 * ⚠️ Every expected sentence and date is typed out here, never imported from cancelNotice.ts: an
 * imported expectation would pass through any rewording of the promise a parent is shown.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { stripeClient, __resetStripe } from '@/infra/stripe'

const A = '11111111-2222-3333-4444-555555555555'
const B = '99999999-8888-4777-8666-555555555555'
const TOKENS: Record<string, { id: string; email: string }> = {
  'tok-A': { id: A, email: 'a@example.com' },
  'tok-B': { id: B, email: 'b@example.com' },
}
const PERIOD_END = 1_769_904_000                 // 2026-02-01T00:00:00Z
const ENV = { ...process.env }

type Row = { account_id: string; stripe_subscription_id: string; status: string; seats_paid: number; current_period_end: string | null; cancel_at_period_end: boolean }
let table: Row[]
let stripeSubs: Record<string, Record<string, unknown>>
let calls: { url: string; method: string; body: string }[]
let session: string | null

const stripeSub = (id: string, account: string) => ({
  id, object: 'subscription', status: 'active', cancel_at_period_end: false, customer: 'cus_' + id,
  metadata: { account_id: account },
  items: { object: 'list', data: [{ id: 'si_' + id, quantity: 2, current_period_start: PERIOD_END - 2_678_400, current_period_end: PERIOD_END }] },
})

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const hdr = (init: RequestInit, name: string) => new Headers(init.headers).get(name)

async function network(input: unknown, init: RequestInit = {}): Promise<Response> {
  const url = String(input instanceof Request ? input.url : input)
  const method = (init.method ?? 'GET').toUpperCase()
  calls.push({ url, method, body: String(init.body ?? '') })

  if (url === '/api/billing/cancel') {                     // the card → the real route
    const { POST } = await import('@/app/api/billing/cancel/route')
    return POST(new Request('https://app.test/api/billing/cancel', init))
  }
  if (url.endsWith('/auth/v1/user')) {
    const who = TOKENS[(hdr(init, 'authorization') ?? '').replace(/^Bearer\s+/i, '')]
    return who ? json(who) : json({ msg: 'invalid JWT' }, 401)
  }
  if (url.includes('/rest/v1/subscriptions')) {
    if (hdr(init, 'authorization') !== 'Bearer service-key') return json({ message: 'denied' }, 401)
    const f = new URL(url).searchParams.get('account_id')
    const hit = table.filter(r => !f || r.account_id === f.replace(/^eq\./, ''))  // PostgREST: no filter = every row
    if (method === 'PATCH') { hit.forEach(r => Object.assign(r, JSON.parse(String(init.body)))); return new Response(null, { status: 204 }) }
    return json(hit)
  }
  const m = url.match(/^https:\/\/api\.stripe\.com\/v1\/subscriptions\/([^/?]+)/)
  if (m) {
    const s = stripeSubs[m[1]]
    if (!s) return json({ error: { type: 'invalid_request_error', code: 'resource_missing' } }, 404)
    if (method === 'POST') {
      const form = new URLSearchParams(String(init.body))
      if (form.get('cancel_at_period_end') === 'true') s.cancel_at_period_end = true
    }
    return json(s)
  }
  if (url === 'https://api.resend.com/emails') return json({ id: 'em_' + calls.length })
  return json({ unexpected: url }, 500)
}

const cancelAs = async (token: string | null) => {
  const { POST } = await import('@/app/api/billing/cancel/route')
  return POST(new Request('https://app.test/api/billing/cancel', { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {} }))
}
const stripeWrites = () => calls.filter(c => c.url.startsWith('https://api.stripe.com') && c.method === 'POST')
const emails = () => calls.filter(c => c.url === 'https://api.resend.com/emails').map(c => JSON.parse(c.body))

vi.mock('@/data/supabase/client', () => ({
  createClient: () => ({
    auth: { getSession: async () => ({ data: { session: session ? { access_token: session } : null } }) },
    from: () => ({
      select: () => ({
        // RLS "owner can read": the signed-in account's row only.
        maybeSingle: async () => {
          const r = table.find(x => x.account_id === TOKENS[session ?? '']?.id)
          return { data: r ? { status: r.status, seats_paid: r.seats_paid, current_period_end: r.current_period_end, cancel_at_period_end: r.cancel_at_period_end } : null, error: null }
        },
      }),
    }),
  }),
}))

beforeEach(() => {
  __resetStripe()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  Object.assign(process.env, {
    NEXT_PUBLIC_SUPABASE_URL: 'https://db.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key', STRIPE_SECRET_KEY: 'sk_test_cancel', RESEND_API_KEY: 're_test',
  })
  table = [{ account_id: A, stripe_subscription_id: 'sub_A', status: 'active', seats_paid: 2, current_period_end: '2026-02-01T00:00:00.000Z', cancel_at_period_end: false }]
  stripeSubs = { sub_A: stripeSub('sub_A', A) }
  calls = []
  session = 'tok-A'
  vi.stubGlobal('fetch', vi.fn(network))
})
afterEach(() => { process.env = { ...ENV }; vi.unstubAllGlobals(); vi.restoreAllMocks(); __resetStripe() })

describe('POST /api/billing/cancel', () => {
  it('cancels the caller\'s own subscription at period end, records it, and emails the end date', async () => {
    expect(stripeClient()).not.toBeNull()
    const res = await cancelAs('tok-A')
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, cancel_at_period_end: true, current_period_end: '2026-02-01T00:00:00.000Z', emailed: true })

    const [w, ...more] = stripeWrites()
    expect(more).toEqual([])
    expect(w.url).toBe('https://api.stripe.com/v1/subscriptions/sub_A')
    expect(new URLSearchParams(w.body).get('cancel_at_period_end')).toBe('true')
    // cancel at period end — never an immediate cancel, never a refund
    expect(calls.some(c => c.method === 'DELETE' || c.url.includes('/v1/refunds'))).toBe(false)

    expect(table[0].cancel_at_period_end).toBe(true)

    const [mail, ...extra] = emails()
    expect(extra).toEqual([])
    expect(mail.to).toEqual(['a@example.com'])
    expect(mail.subject).toBe('Your Milo subscription is cancelled')
    expect(mail.text).toContain('Your plan ends on February 1, 2026. You will not be charged again.')
    expect(mail.text).toContain('This is a service message about your Milo account.\n\nRadlor Inc.\n254 Chapman Rd, Ste 208 #28608, Newark, DE 19702\nQuestions: support@radlor.com')
    expect(mail.html).toContain('February 1, 2026')
  })

  it('another parent cannot cancel someone else\'s subscription — with none of their own, nothing is touched', async () => {
    const res = await cancelAs('tok-B')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'no_subscription' })
    expect(calls.filter(c => c.url.startsWith('https://api.stripe.com'))).toEqual([])
    expect(stripeSubs.sub_A.cancel_at_period_end).toBe(false)
    expect(table[0].cancel_at_period_end).toBe(false)
    expect(emails()).toEqual([])
  })

  it('…and with one of their own, only theirs is cancelled', async () => {
    table.push({ account_id: B, stripe_subscription_id: 'sub_B', status: 'active', seats_paid: 1, current_period_end: '2026-02-01T00:00:00.000Z', cancel_at_period_end: false })
    stripeSubs.sub_B = stripeSub('sub_B', B)
    expect((await cancelAs('tok-B')).status).toBe(200)
    expect(stripeWrites().map(c => c.url)).toEqual(['https://api.stripe.com/v1/subscriptions/sub_B'])
    expect(stripeSubs.sub_A.cancel_at_period_end).toBe(false)
    expect(table.find(r => r.account_id === A)!.cancel_at_period_end).toBe(false)
    expect(emails().map(m => m.to)).toEqual([['b@example.com']])
  })

  it('is idempotent: cancelling twice updates Stripe once and emails once', async () => {
    await cancelAs('tok-A')
    const again = await cancelAs('tok-A')
    expect(again.status).toBe(200)
    expect(await again.json()).toMatchObject({ ok: true, already: true, cancel_at_period_end: true })
    expect(stripeWrites().length).toBe(1)
    expect(emails().length).toBe(1)
  })

  it('refuses a caller without a valid token, touching nothing', async () => {
    for (const t of [null, 'tok-forged']) {
      expect((await cancelAs(t)).status).toBe(401)
    }
    expect(calls.filter(c => !c.url.endsWith('/auth/v1/user'))).toEqual([])
  })

  it('works while billing is off: no Stripe key and no subscription says "no subscription", not a crash', async () => {
    delete process.env.STRIPE_SECRET_KEY; __resetStripe()
    table = []
    const res = await cancelAs('tok-A')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'no_subscription' })
  })
})

// ─────────────────────────────── the screen ───────────────────────────────
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function mount() {
  const { SubscriptionCard } = await import('@/features/billing/SubscriptionCard')
  const el = document.createElement('div'); document.body.appendChild(el)
  const root = createRoot(el)
  await act(async () => { root.render(createElement(SubscriptionCard)) })
  await act(async () => { await new Promise(r => setTimeout(r, 0)) })
  const click = async (label: string) => {
    const b = [...el.querySelectorAll('button')].find(x => x.textContent === label)
    if (!b) throw new Error(`no "${label}" button in: ${el.textContent}`)
    await act(async () => { b.click() })
    for (let i = 0; i < 5; i++) await act(async () => { await new Promise(r => setTimeout(r, 0)) })
  }
  return { el, click, done: () => { act(() => root.unmount()); el.remove() } }
}

describe('Plan → Your subscription', () => {
  it('Cancel subscription → confirm → the database says it ends, and the screen says so', async () => {
    const s = await mount()
    expect(s.el.textContent).toContain('Renews on February 1, 2026.')
    await s.click('Cancel subscription')
    expect(s.el.textContent).toContain('Cancel your subscription?')
    expect(s.el.textContent).toContain('You will not be charged again. Your plan stays active until February 1, 2026, then ends.')
    expect(stripeWrites()).toEqual([])                       // the first tap alone cancels nothing
    await s.click('Yes, cancel my subscription')
    expect(s.el.textContent).toContain('Your plan ends on February 1, 2026. You will not be charged again.')
    expect(s.el.textContent).toContain('We have emailed you a confirmation.')
    s.done()

    // A fresh visit reads the row the route wrote.
    expect(table[0].cancel_at_period_end).toBe(true)
    const again = await mount()
    expect(again.el.textContent).toContain('Your plan ends on February 1, 2026. You will not be charged again.')
    expect([...again.el.querySelectorAll('button')].map(b => b.textContent)).not.toContain('Cancel subscription')
    again.done()
  })

  it('with no subscription it says so and offers nothing to cancel', async () => {
    session = 'tok-B'
    const s = await mount()
    expect(s.el.textContent).toContain('You do not have a subscription, so there is nothing to cancel.')
    expect(s.el.querySelectorAll('button').length).toBe(0)
    s.done()
  })
})
