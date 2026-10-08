// @vitest-environment node
/**
 * "Forgot PIN?" emails the account that a reset was asked for — once per reset (founder, 2026-10-06).
 *
 * Driven through the real route handler. The network stand-in sends the route's PostgREST RPC calls into the repo's
 * real schema (baseline + every migration, PGlite) as `authenticated` with auth.uid() taken from the caller's token,
 * so "the reset started" and "already pending" are the real functions' answers. Resend is recorded.
 * ⚠️ Expected subject, recipient and key shape are typed out here, not imported from the route.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema } from './_schema'

const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const TOKENS: Record<string, { id: string; email: string }> = { 'tok-A': { id: A, email: 'a@x.test' }, 'tok-B': { id: B, email: 'b@x.test' } }
const ENV = { ...process.env }
let db: PGlite
let sent: { to: string[]; subject: string; text: string; key: string | null }[]
let rpcs: string[]

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function asUser(uid: string, sql: string): Promise<unknown> {
  await db.exec(`select set_config('test.uid', '${uid}', false)`)
  await db.exec('set role authenticated')
  try { return Object.values((await db.query<Record<string, unknown>>(sql)).rows[0])[0] } finally { await db.exec('reset role') }
}

async function network(input: unknown, init: RequestInit = {}): Promise<Response> {
  const url = String(input)
  const h = new Headers(init.headers)
  if (url.endsWith('/auth/v1/user')) {
    const who = TOKENS[(h.get('authorization') ?? '').replace(/^Bearer\s+/i, '')]
    return who ? json(who) : json({ msg: 'invalid JWT' }, 401)
  }
  const m = url.match(/\/rest\/v1\/rpc\/(\w+)$/)
  if (m) {
    const who = TOKENS[(h.get('authorization') ?? '').replace(/^Bearer\s+/i, '')]
    if (!who || h.get('apikey') !== 'anon-key') return json({ message: 'JWT required' }, 401)
    rpcs.push(m[1])
    return json(await asUser(who.id, `select public.${m[1]}()`))
  }
  if (url.includes('/rest/v1/email_undeliverable')) return json([])
  if (url.includes('/rest/v1/error_events')) return new Response(null, { status: 201 })
  if (url === 'https://api.resend.com/emails') {
    const b = JSON.parse(String(init.body))
    sent.push({ to: b.to, subject: b.subject, text: b.text, key: h.get('idempotency-key') })
    return json({ id: 'em_' + sent.length })
  }
  return json({ unexpected: url }, 500)
}

const post = async (token: string | null) => {
  const { POST } = await import('@/app/api/parent/pin-reset/route')
  const r = await POST(new Request('https://app.test/api/parent/pin-reset', { method: 'POST', headers: token ? { authorization: `Bearer ${token}`, 'x-forwarded-for': token } : {} }))
  return { status: r.status, body: await r.json() as Record<string, unknown> }
}

beforeAll(async () => {
  ({ db } = await loadSchema())
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${A}', 'a@x.test', now()), ('${B}', 'b@x.test', now())`)
  await asUser(A, `select public.set_parent_pin('4826')`)
}, 120_000)

beforeEach(() => {
  sent = []; rpcs = []
  Object.assign(process.env, { NEXT_PUBLIC_SUPABASE_URL: 'https://db.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key', SUPABASE_SERVICE_ROLE_KEY: 'service-key', RESEND_API_KEY: 're_test' })
  vi.stubGlobal('fetch', vi.fn(network))
})
afterEach(() => { vi.unstubAllGlobals(); process.env = { ...ENV } })

describe('Forgot PIN → one email per reset', () => {
  it('needs a signed-in session: no token, no reset and no email', async () => {
    expect((await post(null)).status).toBe(401)
    expect((await post('tok-forged')).status).toBe(401)
    expect(rpcs).toEqual([])
    expect(sent).toEqual([])
  })

  it('the first request starts the reset and sends one email to the account; a second sends nothing more', async () => {
    const first = await post('tok-A')
    expect(first.status).toBe(200)
    expect(first.body.ok).toBe(true)
    // The real function now reports the pending reset.
    expect((await asUser(A, `select public.parent_pin_status()`) as { reset_at: string | null }).reset_at).toBeTruthy()
    expect(sent).toHaveLength(1)
    expect(sent[0].to).toEqual(['a@x.test'])
    expect(sent[0].subject).toBe('Your Radlic parent PIN is being reset')
    expect(sent[0].text).toContain('If it was not you, open your Radlic dashboard and enter your PIN before then')
    expect(sent[0].text).not.toContain('4826')                       // never the PIN
    expect(sent[0].key).toBe(`pin-reset-${A}-${first.body.reset_at}`)

    const second = await post('tok-A')
    expect(second.body).toMatchObject({ ok: true, reset_at: first.body.reset_at, emailed: false })
    expect(sent).toHaveLength(1)
  })

  it('an account with no PIN: nothing to reset, no email', async () => {
    expect((await post('tok-B')).body.ok).toBe(false)
    expect(sent).toEqual([])
  })
})
