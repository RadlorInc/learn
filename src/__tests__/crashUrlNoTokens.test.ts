import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * SEC-06: a crash on a page whose URL carries a credential must not carry that credential into
 * any crash sink (Vercel log line, `error_events` row, MONITORING_INGEST_URL).
 *
 * Property checked: for each capture point (browser `reportCrash`, public `/api/report-error`,
 * server `onRequestError`), none of the planted secret strings appears in anything sent or
 * logged, AND the path plus the allowlisted params still arrive (positive control — a sink that
 * dropped the whole URL, or the whole report, would also "contain no secret").
 * The expected strings are written out here by hand, not derived from the code.
 */
vi.mock('@/infra/storage/lastError', () => ({ recordError: () => {} }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => undefined }))

const SECRETS = ['SECRET_FRAG_T', 'SECRET_TH', 'SECRET_CODE', 'SECRET_ACCESS', 'SECRET_REFRESH', 'SECRET_TOKEN_HASH']
const DIRTY = '/consent/respond?th=SECRET_TH&code=SECRET_CODE&token_hash=SECRET_TOKEN_HASH&module=g3m1&id=g3m1-t2'
  + '#t=SECRET_FRAG_T&access_token=SECRET_ACCESS&refresh_token=SECRET_REFRESH'

const ENV = { ...process.env }
let logged: string[]
let sent: string[]

beforeEach(() => {
  vi.restoreAllMocks()
  logged = []
  sent = []
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => { logged.push(a.map(String).join(' ')) })
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://db.example'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
  process.env.MONITORING_INGEST_URL = 'https://sink.example/hook'
  vi.stubGlobal('fetch', vi.fn((url: string, init?: { body?: string }) => {
    sent.push(`${url} ${init?.body ?? ''}`)
    return Promise.resolve({ ok: true })
  }))
})
afterEach(() => { process.env = { ...ENV }; vi.unstubAllGlobals() })

function expectClean(where: string, blobs: string[]) {
  const all = blobs.join('\n')
  for (const s of SECRETS) expect(all, `${where} leaked ${s}`).not.toContain(s)
}

describe('SEC-06 — no URL credential reaches a crash sink', () => {
  it('browser reportCrash sends path + allowlisted params, no fragment, no token params', async () => {
    window.history.replaceState(null, '', DIRTY)
    expect(window.location.href, 'fixture: jsdom must actually hold the dirty URL').toContain('SECRET_FRAG_T')
    const { reportCrash } = await import('@/infra/reportCrash')
    reportCrash(new Error('boom-client'), 'react')
    expect(sent).toHaveLength(1)
    expectClean('reportCrash', sent)
    const body = JSON.parse(sent[0].slice(sent[0].indexOf(' ') + 1))
    expect(body.message).toBe('boom-client')
    expect(body.url).toBe('http://localhost:3000/consent/respond?module=g3m1&id=g3m1-t2')
  })

  it('/api/report-error scrubs a dirty url itself — the server does not trust the client', async () => {
    const { POST } = await import('@/app/api/report-error/route')
    const req = new Request('http://localhost/api/report-error', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
      body: JSON.stringify({ message: 'boom-route', url: `https://radlic.com${DIRTY}` }),
    })
    await POST(req)
    expectClean('/api/report-error', [...logged, ...sent])
    const row = sent.find(s => s.startsWith('https://db.example/rest/v1/error_events'))
    expect(row, 'error_events insert must still happen').toBeDefined()
    const stored = JSON.parse(row!.slice(row!.indexOf(' ') + 1))
    expect(stored.message).toBe('boom-route')
    expect(stored.url).toBe('https://radlic.com/consent/respond?module=g3m1&id=g3m1-t2')
    expect(sent.some(s => s.startsWith('https://sink.example/hook') && s.includes('boom-route'))).toBe(true)
  })

  it('server onRequestError scrubs request.path (which carries the query)', async () => {
    const { onRequestError } = await import('@/instrumentation')
    await onRequestError(
      Object.assign(new Error('boom-server'), { digest: 'd1' }),
      { path: '/auth/confirm?th=SECRET_TH&code=SECRET_CODE&module=g3m1', method: 'GET', headers: {} },
      { routerKind: 'App Router', routePath: '/auth/confirm', routeType: 'render', renderSource: 'react-server-components', revalidateReason: undefined },
    )
    expectClean('onRequestError', [...logged, ...sent])
    const line = logged.find(l => l.includes('boom-server'))
    expect(line, 'the console line must still be written').toBeDefined()
    expect(line).toContain('"path":"/auth/confirm?module=g3m1"')
  })
})
