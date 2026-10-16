// @vitest-environment node
/**
 * /api/tester forwards a paid tester's call to Radlor Ops and hands its answer back unchanged; it keeps nothing.
 * The Ops URL is written out by hand (the default when TESTER_API is unset).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { POST } from '@/app/api/tester/route'
import { __resetRateLimit } from '@/app/api/_rateLimit'

afterEach(() => { vi.unstubAllGlobals(); __resetRateLimit() })
const call = (body: string) => POST(new Request('http://x/api/tester', { method: 'POST', body, headers: { 'x-forwarded-for': '1.2.3.4' } }))

describe('/api/tester', () => {
  it('forwards the body to ops.radlor.com/api/radlic-tester and returns its status and body', async () => {
    const f = vi.fn(async () => new Response('{"module_id":"g3m1","reviewed":[]}', { status: 200 }))
    vi.stubGlobal('fetch', f)
    const r = await call('{"action":"open","token":"abc"}')
    expect(f).toHaveBeenCalledWith('https://ops.radlor.com/api/radlic-tester', expect.objectContaining({ method: 'POST', body: '{"action":"open","token":"abc"}' }))
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ module_id: 'g3m1', reviewed: [] })
  })
  it('passes a refusal through as it is (a dead link stays a 404)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"not_found"}', { status: 404 })))
    expect((await call('{"action":"open","token":"x"}')).status).toBe(404)
  })
  it('a 204 review comes back as 204', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })))
    expect((await call('{"action":"review"}')).status).toBe(204)
  })
  it('Ops unreachable is a 502, not a hang or a 200', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down') }))
    expect((await call('{}')).status).toBe(502)
  })
})
