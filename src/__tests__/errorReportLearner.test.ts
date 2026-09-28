import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * `/api/report-error` records a learner id only when the request's own session can read that
 * learner — asked of the database with the CALLER's token (RLS decides), never a service key.
 * Every report is still stored; an unproven id is just left off it.
 *
 * Both halves: a session that can read the learner keeps its attribution (a route that dropped
 * every id would pass the refusals), and the check is driven as the caller.
 */
const sunk: Array<{ learnerId?: string; message: string }> = []
vi.mock('@/infra/errorSink', () => ({ sinkError: (r: { learnerId?: string; message: string }) => { sunk.push(r) } }))

const CHILD = '3f2b8c1e-5d4a-4e7b-9c1d-2a6f8e0b4c11'
const OWNER_TOKEN = 'token-of-an-account-that-can-read-the-child'
const OTHER_TOKEN = 'token-of-an-account-that-cannot'

const ENV = { ...process.env }
let asked: Array<{ url: string; auth?: string }>

beforeEach(() => {
  sunk.length = 0
  asked = []
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://db.example'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
  vi.stubGlobal('fetch', vi.fn((url: string, init?: { headers?: Record<string, string> }) => {
    const auth = init?.headers?.Authorization
    asked.push({ url, auth })
    const readable = auth === `Bearer ${OWNER_TOKEN}` && url === `https://db.example/rest/v1/learners?id=eq.${CHILD}&select=id`
    return Promise.resolve(new Response(JSON.stringify(readable ? [{ id: CHILD }] : []), { status: 200 }))
  }))
})
afterEach(() => { process.env = { ...ENV }; vi.unstubAllGlobals() })

async function report(body: Record<string, unknown>, token?: string) {
  const { POST } = await import('@/app/api/report-error/route')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await POST(new Request('http://localhost/api/report-error', { method: 'POST', headers, body: JSON.stringify(body) }))
  expect(res.status).toBe(200)
  expect(sunk, 'every report is still stored').toHaveLength(1)
  return sunk[0]
}

describe('/api/report-error — learner attribution needs a session that can read the learner', () => {
  it('a report without a session is stored without the learner id', async () => {
    const r = await report({ message: 'boom', learnerId: CHILD })
    expect(r.message).toBe('boom')
    expect(r.learnerId).toBeUndefined()
  })

  it("a session that cannot read the learner: stored without the id", async () => {
    const r = await report({ message: 'boom', learnerId: CHILD }, OTHER_TOKEN)
    expect(r.learnerId).toBeUndefined()
  })

  it("a session that can read the learner keeps the id (positive control)", async () => {
    const r = await report({ message: 'boom', learnerId: CHILD }, OWNER_TOKEN)
    expect(r.learnerId).toBe(CHILD)
  })

  it("the database is asked with the caller's token, never the service key", async () => {
    await report({ message: 'boom', learnerId: CHILD }, OWNER_TOKEN)
    expect(asked).toEqual([{ url: `https://db.example/rest/v1/learners?id=eq.${CHILD}&select=id`, auth: `Bearer ${OWNER_TOKEN}` }])
  })

  it('a malformed id is not looked up at all', async () => {
    const r = await report({ message: 'boom', learnerId: `${CHILD}&select=*` }, OWNER_TOKEN)
    expect(r.learnerId).toBeUndefined()
    expect(asked).toEqual([])
  })
})

describe('reportCrash sends the stored session with the report', () => {
  beforeEach(() => { vi.resetModules() })

  it('with a stored session: an Authorization header carrying its access token', async () => {
    localStorage.setItem('milo-auth', JSON.stringify({ access_token: OWNER_TOKEN, refresh_token: 'r' }))
    const { reportCrash } = await import('@/infra/reportCrash')
    reportCrash(new Error('boom-client'), 'react')
    const sent = asked.find(a => a.url === '/api/report-error')
    expect(sent?.auth).toBe(`Bearer ${OWNER_TOKEN}`)
    localStorage.removeItem('milo-auth')
  })

  it('without one: no Authorization header, and the report still goes', async () => {
    localStorage.removeItem('milo-auth')
    const { reportCrash } = await import('@/infra/reportCrash')
    reportCrash(new Error('boom-client'), 'react')
    const sent = asked.filter(a => a.url === '/api/report-error')
    expect(sent).toHaveLength(1)
    expect(sent[0].auth).toBeUndefined()
  })
})
