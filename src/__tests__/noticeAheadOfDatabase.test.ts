// @vitest-environment node
/**
 * THE APP'S NOTICE IS NEWER THAN THE DATABASE'S LIST — the normal window after a notice change here, because
 * `promote` moves `release` without waiting for the `production-db` approval (20260928100000, notice-v7).
 *
 * The database answers P0C04 "unknown notice version" to both ways of asking. Before this, the sign-up route threw
 * AFTER the account was created and sent no email at all, and the dashboard's request answered a bare 502. Now:
 *   · sign-up falls back to the confirmation-only email (the parent is asked from the dashboard, as for PGRST202);
 *   · the dashboard's request answers 503 `not_ready`, having written and sent nothing.
 *
 * The real routes and the real `features/consent/server.ts` run; only the network is faked, answering P0C04 the way
 * PostgREST relays a RAISE with an errcode (status 400, `{ code, message }`). Subjects are written out by hand.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NOTICE_VERSION } from '@/features/consent/copy'

let dbAnswer: 'known' | 'P0C04' | 'P0001' = 'known'
let emails: { to: string; subject: string }[] = []
let rpcs: string[] = []
let seq = 0

function fakeNetwork(input: unknown, init: RequestInit = {}): Response {
  const u = new URL(String(input))
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status })
  if (u.pathname === '/auth/v1/admin/generate_link') {
    const b = JSON.parse(String(init.body))
    return json({ id: 'u1', email: b.email, hashed_token: `tok${++seq}`, confirmation_sent_at: new Date().toISOString(), user_metadata: b.data })
  }
  if (u.pathname === '/auth/v1/admin/users') return json({ users: [], aud: 'authenticated' })
  if (u.pathname === '/auth/v1/user') return json({ id: 'u1', email: 'p@x.test', user_metadata: { first_name: 'Pat' } })
  const fn = u.pathname.match(/^\/rest\/v1\/rpc\/(.+)$/)?.[1]
  if (fn) {
    rpcs.push(fn)
    if (fn === 'consent_request_at_signup' || fn === 'consent_request') {
      if (dbAnswer === 'P0C04') return json({ code: 'P0C04', message: `unknown notice version ${NOTICE_VERSION}` }, 400)
      if (dbAnswer === 'P0001') return json({ code: 'P0001', message: 'something else broke' }, 400)
      return json([{ consent_id: `c${++seq}`, email: 'p@x.test' }])
    }
    return json(null)
  }
  if (u.pathname === '/emails') {
    const b = JSON.parse(String(init.body))
    emails.push({ to: b.to[0], subject: b.subject })
    return json({ id: `re_${++seq}` })
  }
  throw new Error(`unexpected fetch ${u.pathname}`)
}

let ip = 0
const xff = () => `10.77.${++ip >> 8 & 255}.${ip & 255}`
async function signUp() {
  const { POST } = await import('@/app/api/auth/signup/route')
  const r = await POST(new Request('http://x/api/auth/signup', { method: 'POST', headers: { 'x-forwarded-for': xff() },
    body: JSON.stringify({ email: `p${++seq}@x.test`, password: 'correct-horse-1', role: 'parent', firstName: 'Pat', lang: 'en', adult: true }) }))
  return { status: r.status, body: await r.json() }
}
async function ask() {
  const { POST } = await import('@/app/api/consent/request/route')
  const r = await POST(new Request('http://x/api/consent/request', { method: 'POST', headers: { authorization: 'Bearer x', 'x-forwarded-for': xff() },
    body: JSON.stringify({ noticeVersion: NOTICE_VERSION, lang: 'en' }) }))
  return { status: r.status, body: await r.json() }
}

beforeEach(() => {
  dbAnswer = 'known'; emails = []; rpcs = []
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:1')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'svc')
  vi.stubEnv('RESEND_API_KEY', 'resend')
  vi.stubEnv('RESEND_API_URL', 'http://127.0.0.1:2')
  vi.stubGlobal('fetch', vi.fn(async (i: unknown, init?: RequestInit) => fakeNetwork(i, init)))
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('sign-up while the database does not know the app\'s notice version', () => {
  it('control: when the database knows it, the parent gets the consent sign-up email', async () => {
    const r = await signUp()
    expect(r).toEqual({ status: 200, body: { ok: true } })
    expect(emails.map(e => e.subject)).toEqual(['Confirm your email and give permission for your children'])
  })
  it('P0C04: still 200, and the parent gets the confirmation-only email instead of nothing', async () => {
    dbAnswer = 'P0C04'
    const r = await signUp()
    expect(rpcs, 'the fake never reached the consent request — this saw nothing').toContain('consent_request_at_signup')
    expect(r).toEqual({ status: 200, body: { ok: true } })
    expect(emails.map(e => e.subject)).toEqual(['Confirm your email for Radlic'])
  })
  it('any other database error is still a failure, not a silent fallback', async () => {
    dbAnswer = 'P0001'
    const r = await signUp()
    expect(r.status).toBe(502)
    expect(emails).toEqual([])
  })
})

describe('asking from the dashboard while the database does not know the app\'s notice version', () => {
  it('control: when the database knows it, B1 goes out', async () => {
    const r = await ask()
    expect(r.status).toBe(200)
    expect(emails.map(e => e.subject)).toEqual(['Please confirm: permission for your children to use Radlic'])
  })
  it('P0C04: 503 not_ready, nothing sent', async () => {
    dbAnswer = 'P0C04'
    const r = await ask()
    expect(rpcs).toContain('consent_request')
    expect(r).toEqual({ status: 503, body: { error: 'not_ready' } })
    expect(emails).toEqual([])
  })
  it('any other database error is still 502 failed', async () => {
    dbAnswer = 'P0001'
    expect(await ask()).toEqual({ status: 502, body: { error: 'failed' } })
  })
})
