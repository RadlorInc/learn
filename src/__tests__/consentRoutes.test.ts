// @vitest-environment node
/**
 * THE CONSENT ROUTES — the ordering and the links, which the database cannot see.
 *
 * `consentFlow.test.ts` proves the database refuses a grant without B3. What only the route can get
 * right is the ORDER (B3 is scheduled, and its id recorded, before anything is granted), the DELAY
 * (B3 is due a day later — the wording says "Yesterday"), the LINK inside B3 (it must lead to the
 * withdrawal screen with the same token), and that no link can change anything on a GET, because
 * mail scanners open every link in every email.
 *
 * ⚠️ Every assertion names its own mechanism: the call ORDER is read off a log, not inferred from
 * the final state, because "granted and has a B3 id" is also what a grant-then-schedule race would
 * leave behind on a good day.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const log: string[] = []
let lookup: Record<string, unknown> | null
let grantAnswer = 'granted'
const sent: { to: string; subject: string; html: string; key: string; at?: Date }[] = []

vi.mock('@/features/consent/server', async orig => {
  const real = await orig<typeof import('@/features/consent/server')>()
  return {
    ...real,
    requireConfig: () => {},
    userFromBearer: async () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    rpc: vi.fn(async (fn: string) => {
      log.push(`rpc:${fn}`)
      if (fn === 'consent_lookup') return lookup ? [lookup] : []
      if (fn === 'consent_grant') return grantAnswer
      if (fn === 'consent_withdraw') return 'withdrawn'
      if (fn === 'consent_request') return [{ consent_id: 'c1', email: 'p@x.test' }]
      return null
    }),
    sendEmail: vi.fn(async (kind: string, to: string, m: { subject: string; html: string }, key: string, at?: Date) => {
      if (kind !== 'transactional') throw new Error(`consent emails are transactional (docs/legal/09 §1), sent as ${kind}`)
      log.push(`send:${m.subject.slice(0, 12)}`); sent.push({ to, subject: m.subject, html: m.html, key, at }); return `re_${sent.length}`
    }),
    cancelEmail: vi.fn(async (id: string) => { log.push(`cancel:${id}`); return true }),
  }
})

const TOKEN = 'A'.repeat(43)
const post = async (body: unknown) => {
  const { POST } = await import('@/app/api/consent/respond/route')
  return (await POST(new Request('http://x/api/consent/respond', { method: 'POST', body: JSON.stringify(body), headers: { 'x-forwarded-for': `10.0.0.${Math.random() * 250 | 0}` } }))).json()
}
const pending = (over: Record<string, unknown> = {}) => ({
  consent_id: 'c1', state: 'pending', lang: 'en', expired: false, email: 'p@x.test',
  learner_id: null, second_email_provider_id: null, second_notice_scheduled_for: null, ...over,
})

beforeEach(() => { log.length = 0; sent.length = 0; grantAnswer = 'granted'; lookup = pending(); delete process.env.CONSENT_SECOND_NOTICE_DELAY_MINUTES })

describe('grant', () => {
  it('schedules B3 FIRST, a day ahead, and only then grants — with that B3\'s id', async () => {
    const t0 = Date.now()
    expect((await post({ t: TOKEN, action: 'grant' })).status).toBe('granted')
    expect(log).toEqual(['rpc:consent_lookup', 'send:Confirming t', 'rpc:consent_grant'])

    const b3 = sent[0]
    // ⚠️ Asserted, not dereferenced. The first draft read `b3.at!.getTime()`, so with B3 sent at once it
    // went red on a TypeError — and `npm run break` refused to certify that (exit 4: red for the wrong
    // reason). A check that only catches a defect by crashing on it says nothing about what it found.
    expect(b3.at, 'B3 was sent immediately — it must be SCHEDULED, a day after the grant').toBeInstanceOf(Date)
    const delay = b3.at!.getTime() - t0
    expect(delay, 'B3 must be due a day after the grant — its first word is "Yesterday"').toBeGreaterThanOrEqual(24 * 3600_000 - 5_000)
    expect(delay).toBeLessThan(24 * 3600_000 + 60_000)
    expect(b3.key, 'B3 carries an idempotency key, or a double click schedules two').toBe('consent-c1-b3')

    const { rpc } = await import('@/features/consent/server')
    const grantArgs = (rpc as unknown as { mock: { calls: [string, Record<string, unknown>][] } }).mock.calls.find(c => c[0] === 'consent_grant')![1]
    expect(grantArgs.p_second_provider_id).toBe('re_1')
  })

  it('B3\'s link is the withdrawal screen, carrying the same token', async () => {
    await post({ t: TOKEN, action: 'grant' })
    expect(sent[0].html).toContain(`/consent/withdraw#t=${TOKEN}`)
    expect(sent[0].html).not.toContain('/consent/respond')
  })

  it('a grant that loses a race to expiry cancels the B3 it scheduled', async () => {
    grantAnswer = 'expired'
    expect((await post({ t: TOKEN, action: 'grant' })).status).toBe('expired')
    expect(log).toEqual(['rpc:consent_lookup', 'send:Confirming t', 'rpc:consent_grant', 'cancel:re_1'])
  })

  it('a repeat click schedules nothing new and cancels nothing', async () => {
    lookup = pending({ state: 'granted' })
    expect((await post({ t: TOKEN, action: 'grant' })).status).toBe('already_granted')
    expect(log).toEqual(['rpc:consent_lookup'])
  })

  it('an expired link is marked expired and no B3 is ever scheduled for it', async () => {
    lookup = pending({ expired: true })
    grantAnswer = 'expired'
    expect((await post({ t: TOKEN, action: 'grant' })).status).toBe('expired')
    expect(sent).toHaveLength(0)
  })
})

describe('withdraw', () => {
  it('withdraws, and cancels a B3 that has not gone out yet', async () => {
    lookup = pending({ state: 'granted', second_email_provider_id: 're_b3', second_notice_scheduled_for: new Date(Date.now() + 3600_000).toISOString() })
    expect((await post({ t: TOKEN, action: 'withdraw' })).status).toBe('withdrawn')
    expect(log).toEqual(['rpc:consent_lookup', 'rpc:consent_withdraw', 'cancel:re_b3'])
  })
  it('does not try to cancel a B3 that has already been sent', async () => {
    lookup = pending({ state: 'granted', second_email_provider_id: 're_b3', second_notice_scheduled_for: new Date(Date.now() - 1000).toISOString() })
    await post({ t: TOKEN, action: 'withdraw' })
    expect(log).toEqual(['rpc:consent_lookup', 'rpc:consent_withdraw'])
  })
})

describe('no link changes anything on a GET — mail scanners open them all', () => {
  it('neither consent route answers GET at all', async () => {
    expect((await import('@/app/api/consent/respond/route') as Record<string, unknown>).GET).toBeUndefined()
    expect((await import('@/app/api/consent/request/route') as Record<string, unknown>).GET).toBeUndefined()
  })
  it('a lookup — what the page does on arrival — calls nothing that writes', async () => {
    await post({ t: TOKEN, action: 'lookup' })
    expect(log).toEqual(['rpc:consent_lookup'])
  })
})

describe('request', () => {
  const req = async (body: unknown) => {
    const { POST } = await import('@/app/api/consent/request/route')
    return POST(new Request('http://x/api/consent/request', { method: 'POST', body: JSON.stringify(body), headers: { authorization: 'Bearer x', 'x-forwarded-for': `10.1.0.${Math.random() * 250 | 0}` } }))
  }
  it('refuses a notice the server is not showing — nothing written, nothing sent', async () => {
    const r = await req({ noticeVersion: 'notice-v0', lang: 'en' })
    expect(r.status).toBe(409)
    expect(log).toEqual([])
  })
  it('sends B1 to the ACCOUNT\'s address with both links, then records that it went', async () => {
    const r = await req({ noticeVersion: 'notice-v3', lang: 'en' })
    expect(r.status).toBe(200)
    expect(log).toEqual(['rpc:consent_request', 'send:Please confi', 'rpc:consent_record_request_sent'])
    expect(sent[0].to).toBe('p@x.test')
    expect(sent[0].at, 'B1 goes now, not later').toBeUndefined()
    expect(sent[0].html).toMatch(/\/consent\/respond#t=[A-Za-z0-9_-]{43}"/)
    expect(sent[0].html).toMatch(/\/consent\/respond#t=[A-Za-z0-9_-]{43}&amp;choice=decline"/)
  })
})

describe('"Yesterday" and the delay are one decision', () => {
  it('B3 still opens with "Yesterday" — if that changes, this binding must be re-thought, not deleted', async () => {
    const { B3 } = await import('@/features/consent/copy')
    expect(B3.yesterday.en.startsWith('Yesterday')).toBe(true)
  })
  it('in production, a delay that would make "Yesterday" false is refused', async () => {
    const { secondNoticeDelayMs } = await import('@/features/consent/config')
    vi.stubEnv('NODE_ENV', 'production')
    try {
      process.env.CONSENT_SECOND_NOTICE_DELAY_MINUTES = '60'
      expect(() => secondNoticeDelayMs()).toThrow(/Yesterday/)
      process.env.CONSENT_SECOND_NOTICE_DELAY_MINUTES = '3000'
      expect(() => secondNoticeDelayMs()).toThrow(/Yesterday/)
      // Positive twin: the default, and the attorney's plausible range, are accepted.
      delete process.env.CONSENT_SECOND_NOTICE_DELAY_MINUTES
      expect(secondNoticeDelayMs()).toBe(24 * 3600_000)
      process.env.CONSENT_SECOND_NOTICE_DELAY_MINUTES = '2000'
      expect(secondNoticeDelayMs()).toBe(2000 * 60_000)
    } finally { vi.unstubAllEnvs() }
  })
})
