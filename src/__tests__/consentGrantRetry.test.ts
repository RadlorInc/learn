// @vitest-environment node
/**
 * BUG-03 (docs/review/LATENT-BUGS.md) — /api/consent/respond 'grant' when something fails AFTER B3 was scheduled.
 *
 * Property: after any sequence of grant clicks, EXACTLY ONE B3 is live if the consent ended granted — and it is
 * the one the consent row records — and NONE is live if it did not. A click that follows a failed one grants.
 *
 * Real route, real `sendEmail`/`rpc`/`cancelEmail` (src/features/consent/server.ts); only the network is a
 * stand-in, and it is a small state machine rather than canned answers:
 *   · Resend: idempotency as documented (resend.com/docs/dashboard/emails/idempotency-keys, read 2026-09-26):
 *     same key + same payload → the original id; same key + DIFFERENT payload → 409 invalid_idempotent_request.
 *   · PostgREST: one consent row. consent_grant behaves as 20260924100000's does (already_granted without
 *     overwriting), and can be told to fail BEFORE committing or AFTER committing (a lost response).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://sb.test'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc'; process.env.RESEND_API_KEY = 're'
delete process.env.RESEND_API_URL; delete process.env.CONSENT_SECOND_NOTICE_DELAY_MINUTES

type Row = { state: string; second: string | null; secondAt: string | null }
let row: Row
let keys: Map<string, { body: string; id: string }>
let mail: Map<string, { at: string; cancelled: boolean }>
/** What the next consent_grant does wrong: fail before committing, commit then lose the response. */
let grantFault: ('before' | 'after')[]
let lookupFails: boolean
let queued: string[]

beforeEach(() => {
  row = { state: 'pending', second: null, secondAt: null }
  keys = new Map(); mail = new Map(); grantFault = []; lookupFails = false; queued = []
  let lookups = 0
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    const j = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status })
    const args = init.body ? JSON.parse(String(init.body)) : {}
    if (url.startsWith('https://api.resend.com/emails/') && url.endsWith('/cancel')) {
      const m = mail.get(url.split('/')[4]); if (!m) return j({ name: 'not_found' }, 404)
      m.cancelled = true; return j({ object: 'email' })
    }
    if (url === 'https://api.resend.com/emails') {
      const key = (init.headers as Record<string, string>)['Idempotency-Key']; const body = String(init.body)
      const prior = keys.get(key)
      if (prior) return prior.body === body ? j({ id: prior.id })
        : j({ name: 'invalid_idempotent_request', message: 'this idempotency key has already been used on a request that had a different payload' }, 409)
      const id = `re_${keys.size + 1}`; keys.set(key, { body, id })
      mail.set(id, { at: args.scheduled_at, cancelled: false })
      return j({ id })
    }
    if (url.endsWith('/rpc/consent_lookup')) {
      // The route's first lookup always works; `lookupFails` breaks the ones after it (Supabase fully down).
      if (lookupFails && lookups++ > 0) return j({ message: 'down' }, 503)
      return j([{ consent_id: 'c1', state: row.state, lang: 'en', expired: false, email: 'p@x.test', learner_id: null,
        second_email_provider_id: row.second, second_notice_scheduled_for: row.secondAt, scope: 'account' }])
    }
    if (url.endsWith('/rpc/consent_grant')) {
      const fault = grantFault.shift()
      if (fault === 'before') return j({ message: 'upstream timeout' }, 503)
      if (row.state === 'granted') return j('already_granted')
      row = { state: 'granted', second: args.p_second_provider_id, secondAt: args.p_second_scheduled_for }
      return fault === 'after' ? j({ message: 'upstream timeout' }, 504) : j('granted')
    }
    if (url.endsWith('/rpc/consent_withdraw')) {
      if (row.state === 'granted' && row.second) queued.push(row.second)
      row.state = 'withdrawn'; return j('withdrawn')
    }
    if (url.endsWith('/rpc/consent_b3_due')) return j(queued.splice(0).map(provider_id => ({ provider_id })))
    if (url.endsWith('/rpc/consent_b3_record')) return j(null)
    throw new Error(`unexpected fetch ${url}`)
  }))
})
afterEach(() => { vi.unstubAllGlobals() })

const TOKEN = 'B'.repeat(43)
const post = async (action: string) => {
  const { POST } = await import('@/app/api/consent/respond/route')
  const r = await POST(new Request('http://x/api/consent/respond', { method: 'POST', body: JSON.stringify({ t: TOKEN, action }),
    headers: { 'x-forwarded-for': `10.1.0.${Math.random() * 250 | 0}` } }))
  return { status: r.status, body: await r.json() }
}
const tick = () => new Promise(r => setTimeout(r, 5)) // the parent reloads: the clock moves, so scheduled_at does
const live = () => [...mail.entries()].filter(([, m]) => !m.cancelled).map(([id]) => id)
const DAY = 24 * 3600_000

describe('BUG-03 a grant that fails after B3 was scheduled', () => {
  it('the grant fails before committing: no B3 is left live, and the next click grants with exactly one', async () => {
    grantFault = ['before']
    expect((await post('grant')).status).toBe(502)
    const afterFailure = live()
    await tick()
    const t0 = Date.now()
    const second = await post('grant')
    expect({ liveAfterFailure: afterFailure, secondClick: second.body })
      .toEqual({ liveAfterFailure: [], secondClick: { status: 'granted', lang: 'en' } })
    expect(live()).toEqual([row.second])
    const due = Date.parse(mail.get(row.second!)!.at) - t0
    expect(due, 'B3 is due a day after the grant that stood').toBeGreaterThanOrEqual(DAY - 5_000)
    expect(due).toBeLessThan(DAY + 60_000)
  })

  it('the grant COMMITS but its response is lost: the recorded B3 is not cancelled, and a retry adds none', async () => {
    grantFault = ['after']
    expect((await post('grant')).status).toBe(502)
    expect(row.state).toBe('granted')
    expect(live(), 'the B3 the grant recorded must still go out').toEqual([row.second])
    await tick()
    expect((await post('grant')).body).toEqual({ status: 'already_granted', lang: 'en' })
    expect(live()).toEqual([row.second])
  })

  it('a double click: both answers are success, and one B3 — the recorded one — is live', async () => {
    const [a, b] = await Promise.all([post('grant'), post('grant')])
    expect([a.body.status, b.body.status].sort()).toEqual(['already_granted', 'granted'])
    expect(live()).toEqual([row.second])
  })

  it('if the database cannot be read after a failed grant, the B3 is LEFT (a recorded B3 must never be cancelled)', async () => {
    grantFault = ['after']; lookupFails = true
    expect((await post('grant')).status).toBe(502)
    expect(live()).toEqual([row.second])
  })

  it('CONTROL: the happy path schedules exactly one B3, a day ahead, and records it', async () => {
    const t0 = Date.now()
    expect((await post('grant')).body).toEqual({ status: 'granted', lang: 'en' })
    expect(live()).toEqual([row.second])
    expect(Date.parse(mail.get(row.second!)!.at) - t0).toBeGreaterThanOrEqual(DAY - 5_000)
  })

  it('CONTROL: withdrawal still cancels the B3 of a granted consent', async () => {
    await post('grant')
    expect(live()).toHaveLength(1)
    expect((await post('withdraw')).body).toEqual({ status: 'withdrawn', lang: 'en' })
    expect(live()).toEqual([])
  })

  it('a failed click, a successful one, then a withdrawal: nothing is left live', async () => {
    grantFault = ['before']
    await post('grant'); await tick(); await post('grant')
    expect(live()).toHaveLength(1)
    expect((await post('withdraw')).body).toEqual({ status: 'withdrawn', lang: 'en' })
    expect(live()).toEqual([])
  })
})
