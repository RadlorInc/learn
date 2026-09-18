/**
 * Child logins (2026-09-17). The route is DRIVEN against a stubbed Supabase, because what it is sold on — the caller
 * comes from the token, ownership is asked with the caller's own token, a half-made account is rolled back — is
 * invisible in source. Expected values are written out by hand.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { normalizeUsername, childEmail, usernameFromEmail, loginEmail } from '@/core/childLogin'

describe('usernames and the address behind them', () => {
  it('accepts 3–20 lowercase letters, digits, dot, underscore, forgiving case and spaces', () => {
    expect(normalizeUsername(' Aarav7 ')).toBe('aarav7')
    expect(normalizeUsername('maya.k_2')).toBe('maya.k_2')
    expect(normalizeUsername('ab')).toBeNull()
    expect(normalizeUsername('_aarav')).toBeNull()
    expect(normalizeUsername('aarav 7')).toBeNull()
    expect(normalizeUsername('a'.repeat(21))).toBeNull()
    expect(normalizeUsername('aarav@x.com')).toBeNull()
  })
  it('maps a username to an unroutable address and back; an adult email is left alone', () => {
    expect(childEmail('aarav7')).toBe('aarav7@learner.adaptivelearn.invalid')
    expect(usernameFromEmail('aarav7@learner.adaptivelearn.invalid')).toBe('aarav7')
    expect(usernameFromEmail('mum@gmail.com')).toBeNull()
    expect(loginEmail('Aarav7')).toBe('aarav7@learner.adaptivelearn.invalid')
    expect(loginEmail(' mum@gmail.com ')).toBe('mum@gmail.com')
  })
})

const SUPA = 'https://db.example'
const PARENT = '11111111-1111-1111-1111-111111111111'
const LEARNER = '22222222-2222-2222-2222-222222222222'
const CHILD = '33333333-3333-3333-3333-333333333333'
const ENV = { ...process.env }

type Call = { method: string; path: string; auth: string | null; body: unknown }
let calls: Call[]
/** Scripted responses keyed by `METHOD path-prefix`; the first matching key wins. */
let script: [string, (c: Call) => Response][]

const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPA
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
  calls = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    const path = url.replace(SUPA, '')
    const headers = new Headers(init.headers)
    const c: Call = { method: init.method ?? 'GET', path, auth: headers.get('authorization'), body: init.body ? JSON.parse(String(init.body)) : undefined }
    calls.push(c)
    const hit = script.find(([k]) => `${c.method} ${path}`.startsWith(k))
    return hit ? hit[1](c) : res(500, { error: `unscripted ${c.method} ${path}` })
  }))
})
afterEach(() => { vi.unstubAllGlobals(); process.env = { ...ENV } })

// A fresh module each test so the in-memory rate limiter never carries over.
async function route() { vi.resetModules(); return import('@/app/api/child-login/route') }
const req = (method: string, body?: unknown, token = 'parent-token') => new Request('http://x/api/child-login', {
  method, headers: { authorization: `Bearer ${token}`, 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}` },
  body: body === undefined ? undefined : JSON.stringify(body),
})

const signedIn: [string, (c: Call) => Response] = ['GET /auth/v1/user', c => c.auth === 'Bearer parent-token' ? res(200, { id: PARENT }) : res(401, {})]
const owns: [string, (c: Call) => Response] = ['GET /rest/v1/learners', () => res(200, [{ id: LEARNER, display_name: 'Aarav' }])]
const noLogin: [string, (c: Call) => Response] = ['GET /rest/v1/learner_access', () => res(200, [])]
const hasLogin: [string, (c: Call) => Response] = ['GET /rest/v1/learner_access', () => res(200, [{ learner_id: LEARNER, parent_id: CHILD }])]
const adminCalls = () => calls.filter(c => c.path.startsWith('/auth/v1/admin') || (c.path.startsWith('/rest/v1/') && c.method !== 'GET'))

describe('/api/child-login', () => {
  it('refuses a caller whose token Supabase rejects, before touching anything else', async () => {
    script = [signedIn]
    const r = await (await route()).POST(req('POST', { learnerId: LEARNER, username: 'aarav7', password: 'secret1' }, 'forged'))
    expect(r.status).toBe(401)
    expect(calls.map(c => `${c.method} ${c.path}`)).toEqual(['GET /auth/v1/user'])
  })

  it('asks ownership with the CALLER\'S token and created_by = the caller, and refuses a learner they did not create', async () => {
    script = [signedIn, ['GET /rest/v1/learners', () => res(200, [])]]
    const r = await (await route()).POST(req('POST', { learnerId: LEARNER, username: 'aarav7', password: 'secret1' }))
    expect(r.status).toBe(403)
    const own = calls.find(c => c.path.startsWith('/rest/v1/learners'))!
    expect(own.auth).toBe('Bearer parent-token')   // never the service key: RLS must apply to this read
    expect(own.path).toBe(`/rest/v1/learners?select=id,display_name&created_by=eq.${PARENT}&id=eq.${LEARNER}`)
    expect(adminCalls()).toEqual([])
  })

  it('creates a pre-confirmed account, links it as self, and marks the profile learner', async () => {
    script = [signedIn, owns, noLogin,
      ['POST /auth/v1/admin/users', () => res(200, { id: CHILD })],
      ['POST /rest/v1/learner_access', () => res(201, {})],
      ['POST /rest/v1/profiles', () => res(201, {})]]
    const r = await (await route()).POST(req('POST', { learnerId: LEARNER, username: ' Aarav7', password: 'secret1' }))
    expect(await r.json()).toEqual({ ok: true, username: 'aarav7' })
    expect(adminCalls().map(c => [c.method, c.path, c.auth, c.body])).toEqual([
      ['POST', '/auth/v1/admin/users', 'Bearer service-key',
        { email: 'aarav7@learner.adaptivelearn.invalid', password: 'secret1', email_confirm: true, user_metadata: { full_name: 'Aarav', must_change_password: false } }],
      ['POST', '/rest/v1/learner_access', 'Bearer service-key', { learner_id: LEARNER, parent_id: CHILD, access_role: 'self' }],
      ['POST', '/rest/v1/profiles', 'Bearer service-key', { id: CHILD, role: 'learner', display_name: 'Aarav' }],
    ])
  })

  it('rolls the account back when the link fails — no login that signs in to nothing', async () => {
    script = [signedIn, owns, noLogin,
      ['POST /auth/v1/admin/users', () => res(200, { id: CHILD })],
      ['POST /rest/v1/learner_access', () => res(400, { message: 'violates check constraint' })],
      [`DELETE /auth/v1/admin/users/${CHILD}`, () => res(200, {})]]
    const r = await (await route()).POST(req('POST', { learnerId: LEARNER, username: 'aarav7', password: 'secret1' }))
    expect(r.status).toBe(502)
    expect(adminCalls().map(c => `${c.method} ${c.path}`)).toEqual([
      'POST /auth/v1/admin/users', 'POST /rest/v1/learner_access', `DELETE /auth/v1/admin/users/${CHILD}`,
    ])
  })

  it('changes an existing login in place instead of making a second account', async () => {
    script = [signedIn, owns, hasLogin, [`PUT /auth/v1/admin/users/${CHILD}`, () => res(200, { id: CHILD })]]
    const r = await (await route()).POST(req('POST', { learnerId: LEARNER, username: 'aarav8', password: 'newpass1' }))
    expect(await r.json()).toEqual({ ok: true, username: 'aarav8' })
    expect(adminCalls().map(c => [c.method, c.path, c.body])).toEqual([
      ['PUT', `/auth/v1/admin/users/${CHILD}`, { email: 'aarav8@learner.adaptivelearn.invalid', password: 'newpass1', email_confirm: true, user_metadata: { must_change_password: false } }],
    ])
  })

  it('a TEMPORARY password (class list) marks the child to choose their own, on a new login and on a changed one', async () => {
    script = [signedIn, owns, noLogin,
      ['POST /auth/v1/admin/users', () => res(200, { id: CHILD })],
      ['POST /rest/v1/learner_access', () => res(201, {})],
      ['POST /rest/v1/profiles', () => res(201, {})]]
    await (await route()).POST(req('POST', { learnerId: LEARNER, username: 'aarav7', password: 'tiger482', temporary: true }))
    expect(adminCalls()[0].body).toEqual({ email: 'aarav7@learner.adaptivelearn.invalid', password: 'tiger482', email_confirm: true, user_metadata: { full_name: 'Aarav', must_change_password: true } })

    calls = []
    script = [signedIn, owns, hasLogin, [`PUT /auth/v1/admin/users/${CHILD}`, () => res(200, { id: CHILD })]]
    await (await route()).POST(req('POST', { learnerId: LEARNER, username: 'aarav7', password: 'otter915', temporary: true }))
    expect(adminCalls().map(c => c.body)).toEqual([{ email: 'aarav7@learner.adaptivelearn.invalid', password: 'otter915', email_confirm: true, user_metadata: { must_change_password: true } }])

    // Only the literal `true` counts: a string "true" from a sloppy client is not a temporary password.
    calls = []
    await (await route()).POST(req('POST', { learnerId: LEARNER, username: 'aarav7', password: 'otter915', temporary: 'true' }))
    expect((adminCalls()[0].body as { user_metadata: unknown }).user_metadata).toEqual({ must_change_password: false })
  })

  it('reports a taken username as such, and rejects a bad username or short password before any write', async () => {
    script = [signedIn, owns, noLogin, ['POST /auth/v1/admin/users', () => res(422, { msg: 'A user with this email address has already been registered' })]]
    const r = await (await route()).POST(req('POST', { learnerId: LEARNER, username: 'aarav7', password: 'secret1' }))
    expect([r.status, await r.json()]).toEqual([409, { ok: false, error: 'username_taken' }])

    calls = []
    const bad = await (await route()).POST(req('POST', { learnerId: LEARNER, username: 'a b', password: 'secret1' }))
    const short = await (await route()).POST(req('POST', { learnerId: LEARNER, username: 'aarav7', password: '123' }))
    expect([bad.status, short.status]).toEqual([400, 400])
    expect(adminCalls()).toEqual([])
  })

  it('lists usernames for the caller\'s own learners, and removes a login by deleting the child\'s account', async () => {
    script = [signedIn, owns, hasLogin,
      [`GET /auth/v1/admin/users/${CHILD}`, () => res(200, { email: 'aarav7@learner.adaptivelearn.invalid' })],
      [`DELETE /auth/v1/admin/users/${CHILD}`, () => res(200, {})]]
    const g = await (await route()).GET(req('GET'))
    expect(await g.json()).toEqual({ ok: true, logins: { [LEARNER]: 'aarav7' } })
    expect(calls.find(c => c.path.startsWith('/rest/v1/learners'))!.path).toBe(`/rest/v1/learners?select=id,display_name&created_by=eq.${PARENT}`)

    calls = []
    const d = await (await route()).DELETE(req('DELETE', { learnerId: LEARNER }))
    expect(await d.json()).toEqual({ ok: true })
    expect(adminCalls().map(c => `${c.method} ${c.path}`)).toEqual([`DELETE /auth/v1/admin/users/${CHILD}`])
  })

  it('without the service key says not_configured and never falls back to the anon key', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    script = [signedIn, owns]
    const r = await (await route()).POST(req('POST', { learnerId: LEARNER, username: 'aarav7', password: 'secret1' }))
    expect([r.status, calls.length]).toEqual([503, 0])
  })
})
