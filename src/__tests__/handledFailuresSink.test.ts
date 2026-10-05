// @vitest-environment node
/**
 * A route that CATCHES a failure and answers 5xx must still leave a row in `error_events`, or the ops digest's
 * `error_events_24h` reads 0 while sign-ups fail. Each route is DRIVEN against a Supabase and a Resend that fail every
 * call and put the parent's address and a child's name in their error messages. Checked, written out by hand:
 *   · the route answers 502 (or the child-login error it already had);
 *   · exactly one row reaches `error_events`, source 'server', its message starting with the route's tag;
 *   · the row carries no learner id, no stack, no url, and neither planted secret.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NOTICE_VERSION } from '@/features/consent/copy'

const SUPA = 'https://db.example'
const EMAIL = 'secret.parent@example.test'
const CHILD = 'Zebediah'
const LEARNER = '22222222-2222-2222-2222-222222222222'
const ENV = { ...process.env }
let rows: Record<string, unknown>[]

const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
// Every failure echoes personal data back, as Resend, GoTrue and PostgREST can.
const leak = { message: `bad ${EMAIL} ${CHILD}`, msg: `bad ${EMAIL}`, code: 'XX000', error_code: 'unexpected_failure' }

beforeEach(() => {
  rows = []
  vi.resetModules() // the in-memory rate limiter starts empty for every route
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPA
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
  process.env.RESEND_API_KEY = 'resend-key'
  process.env.RESEND_API_URL = 'https://resend.example'
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    const path = String(url).replace(SUPA, '')
    const method = init.method ?? 'GET'
    if (path === '/rest/v1/error_events' && method === 'POST') { rows.push(JSON.parse(String(init.body))); return new Response(null, { status: 201 }) }
    if (path === '/auth/v1/user') return res(200, { id: '11111111-1111-1111-1111-111111111111', email: EMAIL })
    if (path.startsWith('/rest/v1/learners?')) return res(200, [{ id: LEARNER, display_name: CHILD }])
    if (path.startsWith('/rest/v1/learner_access?') && method === 'GET') return res(200, [])
    return res(500, leak)
  }))
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); process.env = { ...ENV } })

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://x${path}`, { method: 'POST', headers: { 'x-forwarded-for': '10.7.0.1', authorization: 'Bearer t', ...headers }, body: JSON.stringify(body) })
const TOKEN = 'A'.repeat(43)

const cases: [string, string, () => Promise<Response>][] = [
  ['sign-up', '[auth/signup] failed', async () => (await import('@/app/api/auth/signup/route')).POST(
    post('/api/auth/signup', { email: EMAIL, password: 'correct-horse-1', role: 'parent', firstName: 'Pat', lang: 'en', adult: true }))],
  ['consent request', '[consent/request] failed', async () => (await import('@/app/api/consent/request/route')).POST(
    post('/api/consent/request', { noticeVersion: NOTICE_VERSION, lang: 'en' }))],
  ['consent respond', '[consent/respond] failed', async () => (await import('@/app/api/consent/respond/route')).POST(
    post('/api/consent/respond', { t: TOKEN, action: 'grant' }))],
  ['unsubscribe', '[email/unsubscribe] failed', async () => (await import('@/app/api/email/unsubscribe/route')).POST(
    new Request(`http://x/api/email/unsubscribe?t=${TOKEN}`, { method: 'POST', headers: { 'x-forwarded-for': '10.7.0.1' } }))],
  ['child login', '[child-login] create failed', async () => (await import('@/app/api/child-login/route')).POST(
    post('/api/child-login', { learnerId: LEARNER, username: 'zeb123', password: 'longenough1' }))],
]

describe('a handled server failure reaches error_events — by route and status only', () => {
  for (const [name, tag, run] of cases) {
    it(name, async () => {
      const r = await run()
      expect(r.status).toBe(502)
      expect(rows).toHaveLength(1)
      const row = rows[0]
      expect(row.source).toBe('server')
      expect(String(row.message).startsWith(tag)).toBe(true)
      expect(row.learner_id).toBeNull()
      expect(row.stack).toBeNull()
      expect(row.url).toBeNull()
      const all = JSON.stringify(row)
      for (const secret of [EMAIL, 'secret.parent', CHILD]) expect(all, `leaked ${secret}`).not.toContain(secret)
    })
  }

  it('keeps the shape that says what failed: our own "<word> <status>" lead, the class, the status and the code', async () => {
    const { sinkHandled } = await import('@/infra/errorSink')
    await sinkHandled('[x] failed', new Error(`generate_link 500: bad ${EMAIL}`))
    await sinkHandled('[x] failed', { status: 503, code: 'PGRST001', message: `bad ${EMAIL}` })
    expect(rows.map(x => x.message)).toEqual(['[x] failed · Error · generate_link 500', '[x] failed · status 503 · code PGRST001'])
  })
})
