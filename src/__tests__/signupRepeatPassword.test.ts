// @vitest-environment node
/**
 * SEC-01 / Rafi's N2 — a password chosen at sign-up never survives a SECOND sign-up of the same unconfirmed address,
 * and the first sign-up's role and first name are kept.
 *
 * The attack (docs/review/SECURITY-AUDIT.md SEC-01): an attacker signs up a parent's address first; the parent signs up
 * later and confirms from their inbox; `generate_link` had kept the ATTACKER's password, so the attacker signed in.
 *
 * The real route and `features/consent/server.ts` run; only the network is faked, and the fake does what a local
 * Supabase stack was MEASURED doing on 2026-09-26 (review-scratch, CLI 2.116):
 *   generate_link on an unconfirmed address: keeps the FIRST password, REPLACES user_metadata with `data`, keeps
 *     app_metadata, rotates the token, stamps confirmation_sent_at (created_at unchanged);
 *   admin PUT users/{id}: sets the password, merges app_metadata, and CLEARS confirmation_sent_at — after which the
 *     outstanding token no longer verifies.
 * Expected values written out by hand.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type User = {
  id: string; email: string; password: string; created_at: string; confirmation_sent_at: string | null
  email_confirmed_at: string | null; token: string | null; user_metadata: Record<string, unknown>; app_metadata: Record<string, unknown>
}
let users: User[] = []
let emails: { to: string; body: string }[] = []
let seq = 0

function fakeNetwork(input: unknown, init: RequestInit = {}): Response {
  const u = new URL(String(input))
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status })
  const now = new Date().toISOString()
  if (u.pathname === '/auth/v1/admin/generate_link') {
    const b = JSON.parse(String(init.body))
    const email = String(b.email).toLowerCase()
    let user = users.find(x => x.email === email)
    if (user?.email_confirmed_at) return json({ error_code: 'email_exists' }, 422)
    if (!user) users.push(user = { id: `u${++seq}`, email, password: b.password, created_at: now, confirmation_sent_at: null,
      email_confirmed_at: null, token: null, user_metadata: {}, app_metadata: { provider: 'email' } })
    user.user_metadata = b.data
    user.confirmation_sent_at = now
    user.token = `tok${++seq}`
    return json({ id: user.id, email, hashed_token: user.token, created_at: user.created_at,
      confirmation_sent_at: user.confirmation_sent_at, user_metadata: user.user_metadata, app_metadata: user.app_metadata })
  }
  const put = u.pathname.match(/^\/auth\/v1\/admin\/users\/(.+)$/)
  if (put && init.method === 'PUT') {
    const user = users.find(x => x.id === decodeURIComponent(put[1]))!
    const b = JSON.parse(String(init.body))
    if (b.password) user.password = b.password
    user.app_metadata = { ...user.app_metadata, ...b.app_metadata }
    user.confirmation_sent_at = null
    user.token = null
    return json({ id: user.id })
  }
  if (u.pathname === '/auth/v1/admin/users') {
    const f = u.searchParams.get('filter') ?? ''
    return json({ users: users.filter(x => x.email.includes(f)).map(({ token: _t, password: _p, ...x }) => x) })
  }
  if (u.pathname === '/rest/v1/rpc/consent_request_at_signup') return json([{ consent_id: `c${++seq}` }])
  if (u.pathname.startsWith('/rest/v1/rpc/')) return json(null)
  if (u.pathname === '/emails') {
    const b = JSON.parse(String(init.body))
    emails.push({ to: b.to[0], body: b.text })
    return json({ id: `re_${++seq}` })
  }
  throw new Error(`unexpected fetch ${u.pathname}`)
}

let ip = 0
const signUp = async (email: string, password: string, role: string, firstName: string) => {
  const { POST } = await import('@/app/api/auth/signup/route')
  const r = await POST(new Request('http://x/api/auth/signup', {
    method: 'POST', headers: { 'x-forwarded-for': `10.45.${++ip >> 8 & 255}.${ip & 255}` },
    body: JSON.stringify({ email, password, role, firstName, lang: 'en' }),
  }))
  return r.status
}
/** The token in the newest email to `to` verifies only if it is the account's outstanding token. */
const newestLinkVerifies = (to: string) => {
  const last = emails.filter(m => m.to === to).at(-1)!
  const th = decodeURIComponent(last.body.match(/th=([^#\s&]+)/)![1])
  const user = users.find(x => x.email === to)!
  return user.token === th && user.confirmation_sent_at !== null
}

const T0 = new Date('2026-09-26T10:00:00Z').getTime()
beforeEach(() => {
  users = []; emails = []
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:1')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'svc')
  vi.stubEnv('RESEND_API_KEY', 'resend')
  vi.stubEnv('RESEND_API_URL', 'http://127.0.0.1:2')
  vi.stubGlobal('fetch', vi.fn(async (i: unknown, init?: RequestInit) => fakeNetwork(i, init)))
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })

const ADDR = 'parent@example.test'

describe('SEC-01 / N2 — repeat sign-up of an unconfirmed address', () => {
  it('POSITIVE CONTROL: a single sign-up keeps the chosen password and is counted as one', async () => {
    expect(await signUp(ADDR, 'owner-pw-1', 'parent', 'Alice')).toBe(200)
    const u = users[0]
    expect({ password: u.password, count: u.app_metadata.signup_count, verifies: newestLinkVerifies(ADDR) })
      .toEqual({ password: 'owner-pw-1', count: undefined, verifies: true })
  })

  it('attacker first, owner later: NEITHER password is on the account, count 2, and the owner’s emailed link still works', async () => {
    await signUp(ADDR, 'attacker-pw-1', 'teacher', 'Mallory')
    vi.setSystemTime(T0 + 10 * 60_000)   // past SEC-04's 2-minute cooldown
    expect(await signUp(ADDR, 'owner-pw-2', 'parent', 'Alice')).toBe(200)
    const u = users[0]
    expect(u.password).not.toBe('attacker-pw-1')
    expect(u.password).not.toBe('owner-pw-2')
    expect(u.password).toMatch(/^[A-Za-z0-9_-]{43}$/)   // 32 random bytes, nobody's choice
    expect(u.app_metadata.signup_count).toBe(2)
    expect(newestLinkVerifies(ADDR)).toBe(true)
  })

  it('the attacker re-registering after the owner resets it again (count 3) — the owner’s next link still works', async () => {
    await signUp(ADDR, 'attacker-pw-1', 'parent', 'Mallory')
    vi.setSystemTime(T0 + 10 * 60_000); await signUp(ADDR, 'owner-pw-2', 'parent', 'Alice')
    vi.setSystemTime(T0 + 20 * 60_000); await signUp(ADDR, 'attacker-pw-3', 'parent', 'Mallory')
    const u = users[0]
    expect([u.password === 'attacker-pw-1', u.password === 'attacker-pw-3', u.app_metadata.signup_count]).toEqual([false, false, 3])
    vi.setSystemTime(T0 + 30 * 60_000); await signUp(ADDR, 'owner-pw-4', 'parent', 'Alice')
    expect(newestLinkVerifies(ADDR)).toBe(true)
    expect(users[0].app_metadata.signup_count).toBe(4)
  })

  it('two sign-ups under a second apart (cooldown lookup still sees the first) — the first password is gone', async () => {
    await signUp(ADDR, 'attacker-pw-1', 'parent', 'Mallory')
    users[0].confirmation_sent_at = new Date(T0 - 10 * 60_000).toISOString()   // as if sent long ago: no cooldown
    vi.setSystemTime(T0 + 300)                                                // but the account is 0.3 s old
    await signUp(ADDR, 'owner-pw-2', 'parent', 'Alice')
    expect([users[0].password === 'attacker-pw-1', users[0].app_metadata.signup_count, newestLinkVerifies(ADDR)]).toEqual([false, 2, true])
  })

  it('the FIRST sign-up’s role and first name are kept (teacher first, parent second → still teacher, confirm-only email)', async () => {
    await signUp(ADDR, 'pw-teacher', 'teacher', 'Tess')
    vi.setSystemTime(T0 + 10 * 60_000)
    await signUp(ADDR, 'pw-parent', 'parent', 'Pat')
    expect(users[0].user_metadata).toEqual({ first_name: 'Tess', role: 'teacher' })
    // A teacher's email is the confirmation alone: no consent token in the fragment.
    expect(emails.map(m => /#t=/.test(m.body))).toEqual([false, false])
  })
})
