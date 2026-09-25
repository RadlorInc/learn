// @vitest-environment node
/**
 * CONSENT-ONCE, THE ROUTES: the request asks for an ACCOUNT consent with the parent's tick time; an old
 * database is "not ready", not a crash; a grant the account no longer needs cancels the B3 it scheduled;
 * the lookup tells the withdrawal screen which consent it is looking at. And the export names the
 * attestation. Expected values written by hand.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const log: string[] = []
const calls: Record<string, Record<string, unknown>> = {}
let requestErr: { status: number; code?: string } | null = null
let grantAnswer = 'granted'
let lookupRow: Record<string, unknown> = {}

vi.mock('@/features/consent/server', async orig => {
  const real = await orig<typeof import('@/features/consent/server')>()
  return {
    ...real,
    requireConfig: () => {},
    userFromBearer: async () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    adultFromBearer: async () => ({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'p@x.test', firstName: 'Maya' }),
    rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => {
      log.push(`rpc:${fn}`); calls[fn] = args
      if (fn === 'consent_request') { if (requestErr) throw requestErr; return [{ consent_id: 'c1', email: 'p@x.test' }] }
      if (fn === 'consent_lookup') return [lookupRow]
      if (fn === 'consent_grant') return grantAnswer
      return null
    }),
    sendEmail: vi.fn(async (_k: string, _to: string, m: { subject: string }) => { log.push(`send:${m.subject.slice(0, 12)}`); return `re_${log.length}` }),
    cancelEmail: vi.fn(async (id: string) => { log.push(`cancel:${id}`); return true }),
    drainB3Cancellations: vi.fn(async () => 0),
    learnerName: vi.fn(async () => null),
  }
})

const TOKEN = 'A'.repeat(43)
const request = async (body: unknown) => {
  const { POST } = await import('@/app/api/consent/request/route')
  return POST(new Request('http://x/api/consent/request', { method: 'POST', body: JSON.stringify(body), headers: { authorization: 'Bearer x', 'x-forwarded-for': `10.9.0.${Math.random() * 250 | 0}` } }))
}
const respond = async (body: unknown) => {
  const { POST } = await import('@/app/api/consent/respond/route')
  return (await POST(new Request('http://x/api/consent/respond', { method: 'POST', body: JSON.stringify(body), headers: { 'x-forwarded-for': `10.8.0.${Math.random() * 250 | 0}` } }))).json()
}

beforeEach(() => {
  log.length = 0; for (const k of Object.keys(calls)) delete calls[k]
  requestErr = null; grantAnswer = 'granted'
  lookupRow = { consent_id: 'c1', state: 'pending', lang: 'en', expired: false, email: 'p@x.test', learner_id: null,
    second_email_provider_id: null, second_notice_scheduled_for: null, scope: 'account' }
})

describe('request: an ACCOUNT consent, stamped with the tick', () => {
  it('sends p_scope = account and the tick time it was given', async () => {
    const at = new Date(Date.now() - 3600_000).toISOString()
    const r = await request({ noticeVersion: 'notice-v6', lang: 'en', ackAt: at })
    expect(r.status).toBe(200)
    expect(calls.consent_request).toMatchObject({ p_scope: 'account', p_ack_at: at, p_notice_version: 'notice-v6' })
    expect(log).toEqual(['rpc:consent_request', 'send:Please confi', 'rpc:consent_record_request_sent'])
  })
  it('an implausible tick time is dropped (the database records now): future, too old, not a time', async () => {
    for (const ackAt of [new Date(Date.now() + 3600_000).toISOString(), new Date(Date.now() - 31 * 86_400_000).toISOString(), 'yesterday', 12345]) {
      await request({ noticeVersion: 'notice-v6', lang: 'en', ackAt })
      expect(calls.consent_request?.p_ack_at, `kept ${String(ackAt)}`).toBeNull()
    }
    await request({ noticeVersion: 'notice-v6', lang: 'en' })
    expect(calls.consent_request.p_ack_at).toBeNull()
  })
  it('a database without consent-once (PGRST202) → 503 not_ready, and no email', async () => {
    requestErr = { status: 404, code: 'PGRST202' }
    const r = await request({ noticeVersion: 'notice-v6', lang: 'en' })
    expect(r.status).toBe(503)
    expect(await r.json()).toEqual({ error: 'not_ready' })
    expect(log).toEqual(['rpc:consent_request'])
  })
  it('a stale notice is still refused before anything is written', async () => {
    const r = await request({ noticeVersion: 'notice-v4', lang: 'en' })
    expect(r.status).toBe(409)
    expect(log).toEqual([])
  })
})

describe('respond', () => {
  it('grant → already_consented: the B3 it just scheduled is cancelled', async () => {
    grantAnswer = 'already_consented'
    expect((await respond({ t: TOKEN, action: 'grant' })).status).toBe('already_consented')
    const b3 = log.find(l => l.startsWith('send:'))
    expect(b3, 'no B3 was scheduled before the grant').toBeDefined()
    expect(log.at(-1)).toMatch(/^cancel:re_/)
    expect(log).toEqual(['rpc:consent_lookup', 'send:Confirming t', 'rpc:consent_grant', `cancel:re_2`])
  })
  it('grant → granted cancels nothing (the positive twin)', async () => {
    expect((await respond({ t: TOKEN, action: 'grant' })).status).toBe('granted')
    expect(log.some(l => l.startsWith('cancel:'))).toBe(false)
  })
  it('lookup returns the consent\'s scope', async () => {
    expect(await respond({ t: TOKEN, action: 'lookup' })).toMatchObject({ status: 'pending', scope: 'account' })
    lookupRow = { ...lookupRow, scope: 'child' }
    expect(await respond({ t: TOKEN, action: 'lookup' })).toMatchObject({ scope: 'child' })
  })
})

describe('the export names the child\'s attestation', () => {
  it('who, when, which notice, how — from the learner row', async () => {
    const { buildExport } = await import('@/shared/ui/DataRights')
    const learner = { id: 'k', attested_by: 'p1', attested_at: '2026-09-24T10:00:00Z', attested_notice_version: 'notice-v6', attestation_method: 'checkbox' }
    const out = buildExport('Bea', { learner, stats: {}, progress: [], sessions: [] }) as Record<string, unknown>
    expect(out.parentalAttestation).toEqual({ attested_by: 'p1', attested_at: '2026-09-24T10:00:00Z', attested_notice_version: 'notice-v6', attestation_method: 'checkbox' })
  })
})
