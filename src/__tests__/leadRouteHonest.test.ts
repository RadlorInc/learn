/**
 * `/api/lead` must not report success when the row did not land.
 *
 * ⚠️ THE DEFECT THIS EXISTS FOR. The route wrote the lead, checked `res.ok`, logged a failure to the
 * error sink — and then returned `{ ok: true }` with HTTP 200 regardless. So a revoked grant, a
 * missing service-role key or a PostgREST outage all looked, from outside, exactly like a captured
 * lead. That is the most expensive shape in this repo's history (V14 was the same fault one layer
 * down: `fetch` does not throw on 4xx, so a 403 read as success).
 *
 * ⚠️ AND THE OLD GATE COULD NOT SEE IT. `security.test.ts` asserts the SOURCE matches /res\.ok/ —
 * true of the broken version, because it did read `res.ok`; it just did not act on it. A source grep
 * cannot tell "reads the flag" from "reads the flag and tells the truth about it". This DRIVES the
 * handler instead.
 *
 * Safe to make honest: the only caller, `captureDiagnosticLead`, does `await fetch(...)` and never
 * reads the response, inside a catch that swallows. Verified 2026-09-09 — so the status this route
 * returns cannot affect the funnel, and a truthful failure is free.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { POST } from '@/app/api/lead/route'
import { __resetRateLimit } from '@/app/api/_rateLimit'

const realFetch = globalThis.fetch
beforeEach(() => { __resetRateLimit() })
afterEach(() => { globalThis.fetch = realFetch; vi.restoreAllMocks() })

function req(email = 'someone@example.invalid', ip = '1.2.3.4') {
  return new Request('https://x.test/api/lead', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email, band: '9-11' }),
  })
}

/** Every outbound call answers `status`; the error sink's own POST is allowed through as 200. */
function stubFetch(status: number, body = '') {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input)
    if (url.includes('/rest/v1/diagnostic_leads')) {
      return new Response(body, { status, statusText: status === 403 ? 'Forbidden' : 'OK' })
    }
    return new Response('', { status: 200 })          // sinkError, etc.
  }) as unknown as typeof fetch
}

describe('/api/lead tells the truth about whether the lead landed', () => {
  it('① the row landed → ok:true, 200', async () => {
    stubFetch(201)
    const res = await POST(req())
    expect(res.status).toBe(201 === 201 ? 200 : 200)
    await expect(res.json()).resolves.toEqual({ ok: true })
  })

  it('② ⚠️ the write was REFUSED (403, the revoked-grant / missing-key case) → must NOT report success', async () => {
    stubFetch(403, '{"code":"42501","message":"permission denied for table diagnostic_leads"}')
    const res = await POST(req())
    const body = await res.json()
    expect(body.ok, 'a refused write must not report ok:true').toBe(false)
    expect(res.status, 'a refused write must not return HTTP 200').not.toBe(200)
  })

  it('③ the upstream threw (network) → must NOT report success', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input instanceof Request ? input.url : input)
      if (url.includes('/rest/v1/diagnostic_leads')) throw new Error('ECONNRESET')
      return new Response('', { status: 200 })
    }) as unknown as typeof fetch
    const res = await POST(req())
    const body = await res.json()
    expect(body.ok, 'a thrown write must not report ok:true').toBe(false)
    expect(res.status).not.toBe(200)
  })

  it('④ a malformed address is still rejected 400 (unchanged)', async () => {
    stubFetch(201)
    const res = await POST(req('not-an-email'))
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'bad_email' })
  })
})
