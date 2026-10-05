// @vitest-environment node
/**
 * `/api/health/db` — what an uptime checker hits to learn whether the app can reach its database. Checked, by hand:
 *   · a database that answers → 200 `{ db: true }`; one that errors, times out or is not configured → 503 `{ db: false }`;
 *   · the body is that one boolean and nothing else, even when the database's error carries text;
 *   · a burst of calls makes ONE database request (the 30 s hold), so the route cannot be used to load the database;
 *   · `/api/health` itself still makes no database call at all.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const ENV = { ...process.env }
let answer: () => Promise<Response>
let calls: string[]

beforeEach(() => {
  vi.resetModules() // a fresh 30 s hold for every test
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://db.example'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
  calls = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => { calls.push(`${init.method ?? 'GET'} ${url}`); return answer() }))
})
afterEach(() => { vi.unstubAllGlobals(); process.env = { ...ENV } })

const hit = async () => {
  const r = await (await import('@/app/api/health/db/route')).GET()
  return { status: r.status, body: await r.json() }
}

describe('/api/health/db', () => {
  it('reachable: 200 { db: true }, from one HEAD that returns no rows', async () => {
    answer = async () => new Response(null, { status: 200 })
    expect(await hit()).toEqual({ status: 200, body: { db: true } })
    expect(calls).toEqual(['HEAD https://db.example/rest/v1/error_events?select=id&limit=0'])
  })

  it('a database error: 503 { db: false }, and none of its text', async () => {
    answer = async () => new Response(JSON.stringify({ message: 'connection to 10.1.2.3 refused' }), { status: 503 })
    expect(await hit()).toEqual({ status: 503, body: { db: false } })
  })

  it('a network failure or timeout: 503 { db: false }', async () => {
    answer = async () => { throw new TypeError('fetch failed') }
    expect(await hit()).toEqual({ status: 503, body: { db: false } })
  })

  it('not configured: 503 { db: false } without calling anything', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    answer = async () => new Response(null, { status: 200 })
    expect(await hit()).toEqual({ status: 503, body: { db: false } })
    expect(calls).toEqual([])
  })

  it('ten calls in a row make one database request', async () => {
    answer = async () => new Response(null, { status: 200 })
    for (let i = 0; i < 10; i++) expect((await hit()).body).toEqual({ db: true })
    expect(calls).toHaveLength(1)
  })

  it('/api/health is unchanged: no database call', async () => {
    answer = async () => new Response(null, { status: 200 })
    const r = (await import('@/app/api/health/route')).GET()
    expect(r.status).toBe(200)
    expect(calls).toEqual([])
  })
})
