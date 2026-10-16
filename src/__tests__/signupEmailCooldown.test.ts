// @vitest-environment node
/**
 * SEC-04 — `POST /api/auth/signup` sends AT MOST ONE email per address per 2 minutes, however many instances or IPs
 * the requests arrive on, and a request inside the window still answers `{ ok: true }` without re-issuing the link.
 *
 * The real route and the real `features/consent/server.ts` run; only the network is faked. The fake Supabase does
 * what a local stack was MEASURED doing on 2026-09-26: `generate_link` on an unconfirmed address sets
 * `confirmation_sent_at` to now and rotates the token; `admin/users?filter=` is a case-sensitive substring match.
 * Every POST comes from a new IP, so the per-IP limiter (per instance, unchanged) is never what stops a send.
 * Expected counts are written out by hand.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHash } from 'node:crypto'

type User = { id: string; email: string; email_confirmed_at: string | null; confirmation_sent_at: string; token: string }
let users: User[] = []
let emails: { to: string; subject: string }[] = []
let generateLinkCalls = 0
/** sha256 hex of addresses that hard-bounced, as the webhook lists them. */
const listed = new Set<string>()
let seq = 0

function fakeNetwork(input: unknown, init: RequestInit = {}): Response {
  const u = new URL(String(input))
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status })
  if (u.pathname === '/auth/v1/admin/generate_link') {
    generateLinkCalls++
    const b = JSON.parse(String(init.body))
    const email = String(b.email).toLowerCase()
    let user = users.find(x => x.email === email)
    if (user?.email_confirmed_at) return json({ error_code: 'email_exists' }, 422)
    if (!user) users.push(user = { id: `u${++seq}`, email, email_confirmed_at: null, confirmation_sent_at: '', token: '' })
    user.confirmation_sent_at = new Date().toISOString()
    user.token = `tok${++seq}`
    return json({ id: user.id, email, hashed_token: user.token, confirmation_sent_at: user.confirmation_sent_at, user_metadata: b.data })
  }
  // SEC-01/N2's password reset on a repeat sign-up (measured: it clears confirmation_sent_at and the token).
  const put = u.pathname.match(/^\/auth\/v1\/admin\/users\/(.+)$/)
  if (put && init.method === 'PUT') {
    const user = users.find(x => x.id === decodeURIComponent(put[1]))!
    user.confirmation_sent_at = ''; user.token = ''
    return json({ id: user.id })
  }
  if (u.pathname === '/auth/v1/admin/users') {
    const f = u.searchParams.get('filter') ?? ''
    return json({ users: users.filter(x => x.email.includes(f)).map(({ token: _t, ...x }) => x), aud: 'authenticated' })
  }
  // email_undeliverable (20261007000000): the hashes listed by the test; error_events takes sendEmail's skip row.
  if (u.pathname === '/rest/v1/email_undeliverable') return json(listed.has(String(u.searchParams.get('email_sha256')).replace(/^eq\./, '')) ? [{ reason: 'bounced' }] : [])
  if (u.pathname === '/rest/v1/error_events') return json(null, 201)
  if (u.pathname === '/rest/v1/rpc/consent_request_at_signup') return json([{ consent_id: `c${++seq}` }])
  if (u.pathname.startsWith('/rest/v1/rpc/')) return json(null)
  if (u.pathname === '/emails') {
    const b = JSON.parse(String(init.body))
    emails.push({ to: b.to[0], subject: b.subject })
    return json({ id: `re_${++seq}` })
  }
  throw new Error(`unexpected fetch ${u.pathname}`)
}

let ip = 0
const signUp = async (email: string, role = 'parent', extra: Record<string, unknown> = { adult: true }) => {
  const { POST } = await import('@/app/api/auth/signup/route')
  const r = await POST(new Request('http://x/api/auth/signup', {
    method: 'POST',
    headers: { 'x-forwarded-for': `10.44.${++ip >> 8 & 255}.${ip & 255}` },
    body: JSON.stringify({ email, password: 'correct-horse-1', role, firstName: 'Pat', lang: 'en', ...extra }),
  }))
  return { status: r.status, body: await r.json() }
}
const sentTo = (to: string) => emails.filter(m => m.to === to).length

const T0 = new Date('2026-09-26T10:00:00Z').getTime()
beforeEach(() => {
  users = []; emails = []; generateLinkCalls = 0; listed.clear()
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:1')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'svc')
  vi.stubEnv('RESEND_API_KEY', 'resend')
  vi.stubEnv('RESEND_API_URL', 'http://127.0.0.1:2')
  vi.stubGlobal('fetch', vi.fn(async (i: unknown, init?: RequestInit) => fakeNetwork(i, init)))
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('only an adult makes an account: the sign-up must say "I\'m 18 or older"', () => {
  it('without it — missing, false, or the string "true" — nothing is created and nothing is sent', async () => {
    for (const extra of [{}, { adult: false }, { adult: 'true' }, { adult: 1 }]) {
      expect(await signUp('kid@example.test', 'parent', extra), JSON.stringify(extra))
        .toEqual({ status: 400, body: { error: 'adult_required' } })
    }
    expect(generateLinkCalls, 'an account was created without the 18+ statement').toBe(0)
    expect(emails).toHaveLength(0)
  })

  it('positive control: the same request WITH it creates the account and sends its one email', async () => {
    expect(await signUp('kid@example.test', 'parent', { adult: true })).toEqual({ status: 200, body: { ok: true } })
    expect(generateLinkCalls).toBe(1)
    expect(sentTo('kid@example.test')).toBe(1)
  })
})

describe('SEC-04: one sign-up email per address per 2 minutes', () => {
  it('positive control: a first sign-up sends exactly one email', async () => {
    expect(await signUp('pat@example.test')).toEqual({ status: 200, body: { ok: true } })
    expect(sentTo('pat@example.test')).toBe(1)
  })

  it('a second sign-up for the same unconfirmed address 30 s later sends NOTHING, answers the same, and does not re-issue the link', async () => {
    await signUp('pat@example.test')
    const firstToken = users[0].token
    vi.setSystemTime(T0 + 30_000)
    expect(await signUp('pat@example.test')).toEqual({ status: 200, body: { ok: true } })
    expect(sentTo('pat@example.test')).toBe(1)
    expect(generateLinkCalls).toBe(1)
    expect(users[0].token).toBe(firstToken) // the link already in the inbox still works
  })

  it('ten sign-ups inside the window (each from a new IP) still send one; case and spaces do not dodge it', async () => {
    await signUp('pat@example.test')
    for (let i = 1; i <= 9; i++) {
      vi.setSystemTime(T0 + i * 10_000)
      await signUp(i % 2 ? '  PAT@Example.test ' : 'pat@example.test')
    }
    expect(emails.length).toBe(1) // every email, whatever spelling it was addressed to
  })

  it('positive control: after the window (2 min 1 s) a sign-up sends again', async () => {
    await signUp('pat@example.test')
    vi.setSystemTime(T0 + 121_000)
    expect(await signUp('pat@example.test')).toEqual({ status: 200, body: { ok: true } })
    expect(sentTo('pat@example.test')).toBe(2)
  })

  it('positive control: a different address is unaffected — including one that CONTAINS the first', async () => {
    // `filter` is a substring match, so `xpat@` is returned when looking up `pat@` — its send must not hold pat's.
    await signUp('xpat@example.test')
    vi.setSystemTime(T0 + 5_000)
    await signUp('pat@example.test')
    await signUp('other@example.test')
    expect(sentTo('xpat@example.test')).toBe(1)
    expect(sentTo('pat@example.test')).toBe(1)
    expect(sentTo('other@example.test')).toBe(1)
  })

  it('a FAILED send does not start the cooldown: a retry 30 s later sends, rather than answering ok with nothing sent', async () => {
    const real = fakeNetwork
    let down = true   // Resend refuses the first message, then recovers
    vi.stubGlobal('fetch', vi.fn(async (i: unknown, init?: RequestInit) =>
      down && new URL(String(i)).pathname === '/emails' ? new Response('{}', { status: 500 }) : real(i, init)))
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await signUp('pat@example.test')).toEqual({ status: 502, body: { error: 'failed' } })
    expect(sentTo('pat@example.test')).toBe(0)
    down = false
    vi.setSystemTime(T0 + 30_000)
    expect(await signUp('pat@example.test')).toEqual({ status: 200, body: { ok: true } })
    expect(sentTo('pat@example.test'), 'the retry answered ok but no email went').toBe(1)
    err.mockRestore()
  })

  it('a teacher sign-up is held the same way', async () => {
    await signUp('t@example.test', 'teacher')
    vi.setSystemTime(T0 + 30_000)
    await signUp('t@example.test', 'teacher')
    expect(sentTo('t@example.test')).toBe(1)
  })

  it('a CONFIRMED address still answers 409 exists, as today, and sends nothing', async () => {
    await signUp('pat@example.test')
    users[0].email_confirmed_at = new Date().toISOString()
    vi.setSystemTime(T0 + 10_000)
    expect(await signUp('pat@example.test')).toEqual({ status: 409, body: { error: 'exists' } })
    expect(sentTo('pat@example.test')).toBe(1)
  })

  it('if the lookup itself fails, sign-up still works (fails open, as today) — the cooldown never blocks a real parent', async () => {
    const real = fakeNetwork
    vi.stubGlobal('fetch', vi.fn(async (i: unknown, init?: RequestInit) =>
      new URL(String(i)).pathname === '/auth/v1/admin/users' ? new Response('{}', { status: 500 }) : real(i, init)))
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await signUp('pat@example.test')).toEqual({ status: 200, body: { ok: true } })
    expect(sentTo('pat@example.test')).toBe(1)
    expect(err).toHaveBeenCalledWith('[auth/signup] cooldown lookup failed', 500)
    err.mockRestore()
  })
})

describe('an adult\'s password: at least 8 characters, as Supabase Auth\'s minimum (2026-09-28)', () => {
  it('7 characters is refused with the same 400 as any short password, before any account or email; 8 goes through', async () => {
    expect(await signUp('seven@example.test', 'parent', { adult: true, password: 'abcdefg' })).toEqual({ status: 400, body: { error: 'invalid' } })
    expect([generateLinkCalls, emails.length], 'a 7-character sign-up reached Supabase or sent an email').toEqual([0, 0])
    expect(await signUp('eight@example.test', 'parent', { adult: true, password: 'abcdefgh' })).toEqual({ status: 200, body: { ok: true } })
    expect(generateLinkCalls, 'POSITIVE TWIN: the 8-character sign-up made its account').toBe(1)
  })
})

describe('an address that hard-bounced before (20261007000000): no email, and the form is told', () => {
  // The hash is computed here from the literal lowercase address, not by the code under test.
  const sha = (e: string) => createHash('sha256').update(e).digest('hex')
  it('422 "undeliverable" and nothing sent — twice (no silent "ok" from the cooldown); a corrected address goes through', async () => {
    listed.add(sha('typo@example.test'))
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await signUp('Typo@Example.test')).toEqual({ status: 422, body: { error: 'undeliverable' } })
    vi.setSystemTime(T0 + 10_000)
    expect(await signUp('typo@example.test'), 'a retry inside the cooldown must not pretend it sent').toEqual({ status: 422, body: { error: 'undeliverable' } })
    expect(sentTo('typo@example.test')).toBe(0)
    expect(await signUp('fixed@example.test'), 'POSITIVE TWIN: a different address is not blocked').toEqual({ status: 200, body: { ok: true } })
    expect(sentTo('fixed@example.test')).toBe(1)
    err.mockRestore()
  })
})
