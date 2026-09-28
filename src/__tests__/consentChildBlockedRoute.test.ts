// @vitest-environment node
/**
 * POST /api/consent/child-blocked — the adult who added a child gets the consent email when that child is refused
 * (founder, 2026-09-28). The real route and the real `features/consent/server.ts` run; only the network is faked, and
 * it answers the way production does: the caller's token reads only learners RLS lets them see, `consent_ok` is the
 * gate, PostgREST relays a RAISE as `{ code, message }`. Every expectation is written out by hand.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const PARENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', CHILD = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const KID = '11111111-1111-4111-8111-111111111111', STRANGER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const w = { refused: true, open: [] as { state: string; expires_at: string }[], requestErr: null as null | { code: string }, sees: new Set([PARENT, CHILD]) }
let emails: { to: string; subject: string; html: string }[] = []
let calls: [string, Record<string, unknown>][] = []

function fakeNetwork(input: unknown, init: RequestInit = {}): Response {
  const u = new URL(String(input))
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status })
  const bearer = new Headers(init.headers).get('authorization')?.replace(/^Bearer /, '') ?? ''
  if (u.pathname === '/auth/v1/user') return bearer.startsWith('tok-') ? json({ id: bearer.slice(4) }) : json({}, 401)
  if (u.pathname === '/rest/v1/learners') {
    // RLS as the caller: a stranger sees nothing.
    return json(w.sees.has(bearer.slice(4)) && u.searchParams.get('id') === `eq.${KID}` ? [{ id: KID, created_by: PARENT }] : [])
  }
  if (u.pathname === '/rest/v1/parental_consents') {
    // The filter the route must send: this adult, account scope, the current notice, granted or pending.
    expect(Object.fromEntries(u.searchParams)).toMatchObject({ parent_id: `eq.${PARENT}`, scope: 'eq.account', notice_version: 'eq.notice-v7', state: 'in.(granted,pending)' })
    return json(w.open)
  }
  const fn = u.pathname.match(/^\/rest\/v1\/rpc\/(.+)$/)?.[1]
  if (fn) {
    const args = JSON.parse(String(init.body)); calls.push([fn, args])
    if (fn === 'consent_ok') return json(!w.refused)
    if (fn === 'consent_request') return w.requestErr ? json({ ...w.requestErr, message: 'x' }, 400) : json([{ consent_id: 'c-new', email: 'parent@x.test' }])
    return json(null)
  }
  if (u.pathname === '/emails') { const b = JSON.parse(String(init.body)); emails.push({ to: b.to[0], subject: b.subject, html: b.html }); return json({ id: 're_1' }) }
  throw new Error(`unexpected fetch ${u.pathname}`)
}

let ip = 0
async function ask(caller: string | null, learnerId: unknown = KID) {
  const { POST } = await import('@/app/api/consent/child-blocked/route')
  const r = await POST(new Request('http://x/api/consent/child-blocked', { method: 'POST',
    headers: { 'x-forwarded-for': `10.9.0.${++ip}`, ...(caller ? { authorization: `Bearer tok-${caller}` } : {}) }, body: JSON.stringify({ learnerId }) }))
  return { status: r.status, body: await r.json() }
}
const called = (fn: string) => calls.filter(c => c[0] === fn)

beforeEach(() => {
  w.refused = true; w.open = []; w.requestErr = null; w.sees = new Set([PARENT, CHILD]); emails = []; calls = []
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:1'); vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'svc'); vi.stubEnv('RESEND_API_KEY', 'resend'); vi.stubEnv('RESEND_API_URL', 'http://127.0.0.1:2')
  vi.stubGlobal('fetch', vi.fn(async (i: unknown, init?: RequestInit) => fakeNetwork(i, init)))
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('a refused child → the adult who added them gets the consent email', () => {
  it('the child\'s own login asks: B1 goes to the PARENT, with one consent link, on notice-v7, recording no "I agree"', async () => {
    expect(await ask(CHILD)).toEqual({ status: 200, body: { ok: true, sent: true } })
    expect(emails.map(e => [e.to, e.subject])).toEqual([['parent@x.test', 'Please confirm: permission for your children to use Radlic']])
    expect(emails[0].html.match(/\/consent\/respond#t=[A-Za-z0-9_-]{43}"/g), 'exactly one consent link').toHaveLength(1)
    expect(called('consent_request')[0][1]).toMatchObject({ p_parent: PARENT, p_notice_version: 'notice-v7', p_scope: 'account', p_acked: false })
    expect(called('consent_record_request_sent')).toHaveLength(1)
  })

  it('a link is already open on notice-v7: nothing is sent (one working link, not a pile)', async () => {
    w.open = [{ state: 'pending', expires_at: new Date(Date.now() + 86_400_000).toISOString() }]
    expect(await ask(CHILD)).toEqual({ status: 200, body: { ok: true, sent: false, pending: true } })
    expect(emails).toEqual([]); expect(called('consent_request')).toEqual([])
  })

  it('an EXPIRED link on notice-v7 does not count: a fresh one is sent', async () => {
    w.open = [{ state: 'pending', expires_at: new Date(Date.now() - 1000).toISOString() }]
    expect((await ask(CHILD)).body).toEqual({ ok: true, sent: true })
    expect(emails).toHaveLength(1)
  })

  it('the parent already agreed to notice-v7: nothing is sent', async () => {
    w.open = [{ state: 'granted', expires_at: new Date(Date.now() - 86_400_000).toISOString() }]
    expect((await ask(CHILD)).body).toEqual({ ok: true, sent: false })
    expect(emails).toEqual([])
  })

  it('the child is NOT refused: the child cannot trigger an email; the parent can (asking for the newer notice)', async () => {
    w.refused = false
    expect((await ask(CHILD)).body).toEqual({ ok: true, sent: false })
    expect(emails).toEqual([])
    expect((await ask(PARENT)).body).toEqual({ ok: true, sent: true })
    expect(emails).toHaveLength(1)
  })

  it('someone who cannot see the child gets 404 and nothing happens — the gate is not even asked', async () => {
    expect((await ask(STRANGER)).status).toBe(404)
    expect(emails).toEqual([]); expect(calls).toEqual([])
  })

  it('no sign-in → 401; a malformed id → 400; nothing sent', async () => {
    expect((await ask(null)).status).toBe(401)
    expect((await ask(CHILD, 'not-a-uuid')).status).toBe(400)
    expect(emails).toEqual([])
  })

  it('the adult cannot be asked (P0C03) → no email; a database without p_acked (PGRST202) → 503, no email', async () => {
    w.requestErr = { code: 'P0C03' }
    expect((await ask(CHILD)).body).toEqual({ ok: true, sent: false })
    w.requestErr = { code: 'PGRST202' }
    expect(await ask(CHILD)).toEqual({ status: 503, body: { error: 'not_ready' } })
    expect(emails).toEqual([])
  })
})
