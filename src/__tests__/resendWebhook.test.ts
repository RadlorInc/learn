// @vitest-environment node
/**
 * `/api/email/resend-webhook`: a signed bounce or complaint from Resend becomes one `error_events` row naming only the
 * event type. Checked, written out by hand:
 *   · the signature check accepts Svix's own published example (secret, id, timestamp, body and signature copied from
 *     Svix's verification docs, not computed by this repo) and refuses it with one byte changed, a wrong secret, a
 *     timestamp 6 minutes off, or no headers;
 *   · `email.bounced` / `email.complained` → one row `[resend] email.bounced`, with none of the payload's address,
 *     subject or bounce text; any other event type → no row;
 *   · without RESEND_WEBHOOK_SECRET: 503 and nothing written.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'node:crypto'

// Svix's documented example ("Verifying webhooks manually").
const SVIX_SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw'
const SVIX_ID = 'msg_p5jXN8AQM9LWM0D4loKWxJek'
const SVIX_TS = '1614265330'
const SVIX_BODY = '{"test": 2432232314}'
const SVIX_SIG = 'v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE='

const ENV = { ...process.env }
let rows: Record<string, unknown>[]

beforeEach(() => {
  rows = []
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://db.example'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
  process.env.RESEND_WEBHOOK_SECRET = SVIX_SECRET
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(Number(SVIX_TS) * 1000)
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    if (String(url).endsWith('/rest/v1/error_events')) rows.push(JSON.parse(String(init.body)))
    return new Response(null, { status: 201 })
  }))
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); process.env = { ...ENV } })

const deliver = async (body: string, headers: Record<string, string>) => {
  const { POST } = await import('@/app/api/email/resend-webhook/route')
  const r = await POST(new Request('http://x/api/email/resend-webhook', { method: 'POST', headers, body }))
  return r.status
}
const svixHeaders = (sig = SVIX_SIG, ts = SVIX_TS) => ({ 'svix-id': SVIX_ID, 'svix-timestamp': ts, 'svix-signature': sig })
/** A Resend event signed with the example secret — the same scheme the published example above proves. */
const signedEvent = (event: unknown) => {
  const body = JSON.stringify(event)
  const key = Buffer.from(SVIX_SECRET.slice('whsec_'.length), 'base64')
  const sig = createHmac('sha256', key).update(`${SVIX_ID}.${SVIX_TS}.${body}`).digest('base64')
  return { body, headers: svixHeaders(`v1,${sig}`) }
}
const bounce = (type: string) => ({
  type, created_at: '2026-10-05T10:00:00.000Z',
  data: { email_id: 'em_1', to: ['secret.parent@example.test'], subject: 'Consent for Zebediah', bounce: { message: 'mailbox secret.parent full' } },
})

describe('the signature', () => {
  it("accepts Svix's published example", async () => expect(await deliver(SVIX_BODY, svixHeaders())).toBe(200))
  it('refuses the same delivery with one byte of the body changed', async () =>
    expect(await deliver('{"test": 2432232315}', svixHeaders())).toBe(401))
  it('refuses a wrong secret', async () => {
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_' + Buffer.from('another secret entirely!').toString('base64')
    expect(await deliver(SVIX_BODY, svixHeaders())).toBe(401)
  })
  it('refuses a delivery 6 minutes old (replay)', async () => {
    vi.setSystemTime((Number(SVIX_TS) + 360) * 1000)
    expect(await deliver(SVIX_BODY, svixHeaders())).toBe(401)
  })
  it('refuses a delivery without headers', async () => expect(await deliver(SVIX_BODY, {})).toBe(401))
  it('accepts when any one of several signatures matches (secret rotation)', async () =>
    expect(await deliver(SVIX_BODY, svixHeaders(`v1,AAAA ${SVIX_SIG}`))).toBe(200))
  it('without RESEND_WEBHOOK_SECRET: 503 and nothing written', async () => {
    delete process.env.RESEND_WEBHOOK_SECRET
    const e = signedEvent(bounce('email.bounced'))
    expect(await deliver(e.body, e.headers)).toBe(503)
    expect(rows).toEqual([])
  })
})

describe('what is recorded', () => {
  for (const type of ['email.bounced', 'email.complained']) {
    it(`${type} → one row naming only the type`, async () => {
      const e = signedEvent(bounce(type))
      expect(await deliver(e.body, e.headers)).toBe(200)
      expect(rows).toHaveLength(1)
      expect(rows[0].message).toBe(`[resend] ${type}`)
      expect(rows[0].source).toBe('server')
      for (const secret of ['secret.parent', 'Zebediah', 'em_1', 'mailbox']) expect(JSON.stringify(rows[0])).not.toContain(secret)
    })
  }
  it('any other event (delivered, opened) → no row', async () => {
    for (const type of ['email.delivered', 'email.sent', 'email.opened']) {
      const e = signedEvent(bounce(type))
      expect(await deliver(e.body, e.headers)).toBe(200)
    }
    expect(rows).toEqual([])
  })
})
