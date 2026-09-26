// @vitest-environment node
/**
 * SEC-17 (docs/review/SECURITY-AUDIT.md) — an error response to an anonymous caller carries ONLY its code.
 *
 * Property checked: on these error paths the JSON body is EXACTLY `{ error: '<code>' }` with the status the
 * client already relies on. It used to also carry the name of the missing env var (`missing: …`), the Stripe
 * signature library's error text (`detail: …`) or GoTrue's own message (`message: …`) — telling a prober which
 * secret is absent. The detail stays in the server log. The expected bodies are written out here by hand: the
 * codes are what `data/auth.ts`, `parent/page.tsx` and the consent pages read, so a change to one is a decision.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NOTICE_VERSION } from '@/features/consent/copy'

let signupLink: unknown = null
vi.mock('@/features/consent/server', async orig => {
  const real = await orig<typeof import('@/features/consent/server')>()
  // `lastSignupLinkAt` exists once #251 (SEC-04's cooldown) is merged; stubbed so this test is about the error body,
  // not about a network the test does not have. Harmless on a tree without it.
  return { ...real, generateSignupLink: vi.fn(async () => signupLink), lastSignupLinkAt: vi.fn(async () => null) }
})

const ENV = { ...process.env }
const CONFIG = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']
let n = 0
const req = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(url, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'x-forwarded-for': `10.9.${n >> 8 & 255}.${n++ & 255}`, ...headers } })
const read = async (r: Response) => ({ status: r.status, body: await r.json() })

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => { process.env = { ...ENV }; vi.restoreAllMocks() })

describe('a server with no consent configuration says only not_configured', () => {
  beforeEach(() => { for (const k of CONFIG) delete process.env[k] })

  const cases: [string, () => Promise<Response>][] = [
    ['consent/request', async () => (await import('@/app/api/consent/request/route')).POST(req('http://x/api/consent/request', { noticeVersion: NOTICE_VERSION }))],
    ['consent/respond', async () => (await import('@/app/api/consent/respond/route')).POST(req('http://x/api/consent/respond', { t: 'A'.repeat(43), action: 'grant' }))],
    ['consent/cancel-second-notice', async () => (await import('@/app/api/consent/cancel-second-notice/route')).POST(req('http://x/api/consent/cancel-second-notice', {}))],
    ['auth/signup', async () => (await import('@/app/api/auth/signup/route')).POST(req('http://x/api/auth/signup', { email: 'p@x.test', password: 'long-enough-1', role: 'parent', firstName: 'Maya' }))],
  ]
  for (const [name, call] of cases) {
    it(`${name}: 503 { error: 'not_configured' } and no variable name`, async () => {
      const { status, body } = await read(await call())
      expect(status).toBe(503)
      expect(body).toEqual({ error: 'not_configured' })
      for (const k of CONFIG) expect(JSON.stringify(body)).not.toContain(k)
    })
  }
})

describe('auth/signup does not echo the auth server\'s message', () => {
  it('weak password: 400 { error: \'weak_password\' } only', async () => {
    for (const k of CONFIG) process.env[k] = 'set'
    signupLink = { ok: false, reason: 'weak_password', message: 'UPSTREAM-SENTINEL: password is known to be weak' }
    const { POST } = await import('@/app/api/auth/signup/route')
    const { status, body } = await read(await POST(req('http://x/api/auth/signup', { email: 'p@x.test', password: 'long-enough-1', role: 'parent', firstName: 'Maya' })))
    expect(status).toBe(400)
    expect(body).toEqual({ error: 'weak_password' })
  })
})

describe('stripe/webhook does not echo the signature library\'s error', () => {
  it('bad signature: 400 { error: \'bad_signature\' } only', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://supa.test'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    process.env.STRIPE_SECRET_KEY = 'sk_test_sec17'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_sec17'
    const { __resetStripe } = await import('@/infra/stripe')
    __resetStripe()
    const { POST } = await import('@/app/api/stripe/webhook/route')
    const { status, body } = await read(await POST(req('http://x/api/stripe/webhook', '{"id":"evt_1"}', { 'stripe-signature': 't=1,v1=deadbeef' })))
    expect(status).toBe(400)
    expect(body).toEqual({ error: 'bad_signature' })
  })
})
