/**
 * `/api/child/signup` — the only place a child account is ever created or linked.
 *
 * ⚠️ IT HOLDS THE SERVICE ROLE, so what it REFUSES is the whole security story and none of it can
 * be checked by reading the file: a source grep cannot tell "looks up the roster" from "looks up
 * the roster and acts on the answer". This DRIVES the handler with every outbound call stubbed, the
 * pattern `leadRouteHonest.test.ts` established after exactly that distinction cost this repo a
 * silently dead lead funnel.
 *
 * ⚠️ THE CASE THAT MATTERS MOST IS THE LAST ONE. If the link fails after the account is created,
 * the child is left holding credentials that sign in to an empty app — a half-made account nobody
 * debugs. The route deletes the account back out; that rollback is asserted by watching for the
 * DELETE, not by trusting the code path.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET, POST } from '@/app/api/child/signup/route'
import { __resetRateLimit } from '@/app/api/_rateLimit'

const realFetch = globalThis.fetch
const realEnv = { ...process.env }

beforeEach(() => {
  __resetRateLimit()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://db.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_test'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  globalThis.fetch = realFetch
  process.env = { ...realEnv }
  vi.restoreAllMocks()
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function req(body: Record<string, unknown>, ip = '1.2.3.4'): any {
  return new Request('https://x.test/api/child/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

/** Every call the route can make, answerable per test. Records what was actually attempted. */
function stub(opts: {
  grades?: unknown[]
  learners?: unknown[]
  claimed?: unknown[]
  createStatus?: number
  linkStatus?: number
}) {
  const calls: { method: string; url: string }[] = []
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    calls.push({ method: init?.method ?? 'GET', url })
    const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status })

    if (url.includes('/rest/v1/grades'))          return json(opts.grades ?? [])
    if (url.includes('/rest/v1/learners'))        return json(opts.learners ?? [])
    if (url.includes('/rest/v1/learner_access'))  return json(opts.claimed ?? [])
    if (url.includes('/auth/v1/admin/users'))     return json({ id: 'child-uid' }, opts.createStatus ?? 200)
    if (url.includes('/rest/v1/profiles'))        return json({})
    return json({})
  }) as typeof fetch
  // learner_access is read (GET, the claimed check) and written (POST, the link) at the same path,
  // so the link's status has to be keyed on the method rather than the URL.
  const inner = globalThis.fetch
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    if (init?.method === 'POST' && url.includes('/rest/v1/learner_access')) {
      calls.push({ method: 'POST', url })
      return new Response('{}', { status: opts.linkStatus ?? 201 })
    }
    return inner(input, init)
  }) as typeof fetch
  return calls
}

const ROSTER = [{ id: 'learner-1', display_name: 'Aarav' }]
const GRADE  = [{ id: 'grade-1', age_group: '3-5' }]

describe('/api/child/signup refuses before it creates', () => {
  it('a join code that matches no class', async () => {
    const calls = stub({ grades: [] })
    const res = await POST(req({ joinCode: 'ZZZZZZ', name: 'Aarav', password: 'hunter2' }))
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: 'no_class' })
    // ⚠️ The point of the test: nothing was created. A refusal that still made an account would be
    // indistinguishable from success from the caller's side.
    expect(calls.some(c => c.url.includes('/auth/v1/admin/users'))).toBe(false)
  })

  it('a name that is not on that roster', async () => {
    const calls = stub({ grades: GRADE, learners: ROSTER })
    const res = await POST(req({ joinCode: 'ABC234', name: 'Somebody Else', password: 'hunter2' }))
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: 'no_child' })
    expect(calls.some(c => c.url.includes('/auth/v1/admin/users'))).toBe(false)
  })

  it('⚠️ TWO CHILDREN WITH THE SAME NAME — refuses rather than guessing', async () => {
    // Guessing would hand one child's account and progress to the other. There is no safe pick.
    const calls = stub({ grades: GRADE, learners: [
      { id: 'a', display_name: 'Aarav' }, { id: 'b', display_name: 'aarav' },
    ] })
    const res = await POST(req({ joinCode: 'ABC234', name: 'Aarav', password: 'hunter2' }))
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ error: 'ambiguous_name' })
    expect(calls.some(c => c.url.includes('/auth/v1/admin/users'))).toBe(false)
  })

  it('a child who has already been claimed — a claim is final', async () => {
    const calls = stub({ grades: GRADE, learners: ROSTER, claimed: [{ id: 'existing' }] })
    const res = await POST(req({ joinCode: 'ABC234', name: 'Aarav', password: 'hunter2' }))
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ error: 'already_claimed' })
    expect(calls.some(c => c.url.includes('/auth/v1/admin/users'))).toBe(false)
  })

  it('a password too short to be one', async () => {
    const calls = stub({ grades: GRADE, learners: ROSTER })
    const res = await POST(req({ joinCode: 'ABC234', name: 'Aarav', password: '123' }))
    expect(res.status).toBe(400)
    // Refused before the roster is even read, so a short password cannot be used to probe a class.
    expect(calls).toHaveLength(0)
  })

  it('no service-role key — refuses rather than falling back to the anon key', async () => {
    // ⚠️ /api/lead has an anon fallback for its own reasons. Here one would mean the roster was
    // readable from a browser, so a missing key must STOP the flow, not degrade it.
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const calls = stub({ grades: GRADE, learners: ROSTER })
    const res = await POST(req({ joinCode: 'ABC234', name: 'Aarav', password: 'hunter2' }))
    expect(res.status).toBe(503)
    expect(calls).toHaveLength(0)
  })
})

describe('/api/child/signup on the happy path', () => {
  it('creates the account, links it, and returns the synthesized address', async () => {
    // ⚠️ THE POSITIVE CONTROL. Every refusal above is satisfied completely by a route that refuses
    // everyone — the M6 trap. This is the half that proves a real child can get in.
    const calls = stub({ grades: GRADE, learners: ROSTER })
    const res = await POST(req({ joinCode: 'ABC234', name: 'aarav', password: 'hunter2' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, email: 'aarav.abc234@learner.milo.invalid' })

    const created = calls.find(c => c.url.includes('/auth/v1/admin/users') && c.method === 'POST')
    expect(created, 'no account was created on the happy path').toBeTruthy()
    const linked = calls.find(c => c.url.includes('/rest/v1/learner_access') && c.method === 'POST')
    expect(linked, 'the account was created but never linked to the learner').toBeTruthy()
  })

  it('⚠️ ROLLS THE ACCOUNT BACK when the link fails', async () => {
    // Without this the child holds working credentials for an app containing nothing of theirs,
    // and no error anywhere says why.
    const calls = stub({ grades: GRADE, learners: ROSTER, linkStatus: 403 })
    const res = await POST(req({ joinCode: 'ABC234', name: 'Aarav', password: 'hunter2' }))
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({ error: 'link_failed' })
    expect(
      calls.some(c => c.method === 'DELETE' && c.url.includes('/auth/v1/admin/users/child-uid')),
      'the orphaned account was left behind',
    ).toBe(true)
  })
})

describe('the GET half tells an anonymous caller nothing about who is in a class', () => {
  it('derives an address without reading the roster', async () => {
    const calls = stub({ grades: [], learners: [] })
    const res = await GET(Object.assign(
      new Request('https://x.test/api/child/signup?joinCode=abc234&name=Ana%20%20Maria',
        { headers: { 'x-forwarded-for': '9.9.9.9' } }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { nextUrl: new URL('https://x.test/api/child/signup?joinCode=abc234&name=Ana%20%20Maria') } as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any)
    expect(await res.json()).toMatchObject({ ok: true, email: 'ana-maria.abc234@learner.milo.invalid' })
    // ⚠️ Zero outbound calls is the assertion. A GET that checked the roster would answer "does
    // this child exist" to anybody who asked, which is a roster oracle with no password in front.
    expect(calls).toHaveLength(0)
  })
})
