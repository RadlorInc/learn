// @vitest-environment node
/**
 * /api/consent/school (migration 20261113130000): a teacher states their school's permission. The caller is the
 * token's account, never a body field; nothing is written without the tick, a school name and the current notice; an
 * old database is "not ready". Expected values written by hand.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const TEACHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const calls: { fn: string; args: Record<string, unknown> }[] = []
let who: string | null = TEACHER
let rpcErr: { status: number; code?: string } | null = null

vi.mock('@/features/consent/server', async orig => {
  const real = await orig<typeof import('@/features/consent/server')>()
  return {
    ...real,
    requireConfig: () => {},
    adultFromBearer: async () => (who ? { id: who, email: 't@x.test', firstName: 'Sam' } : null),
    rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => { calls.push({ fn, args }); if (rpcErr) throw rpcErr; return 'consent-1' }),
  }
})

const post = async (body: unknown) => {
  const { POST } = await import('@/app/api/consent/school/route')
  return POST(new Request('http://x/api/consent/school', { method: 'POST', body: JSON.stringify(body), headers: { authorization: 'Bearer t', 'x-forwarded-for': `10.7.0.${Math.random() * 250 | 0}` } }))
}
const GOOD = { school: '  Lincoln Elementary ', agree: true, noticeVersion: 'notice-v8' }

beforeEach(() => { calls.length = 0; who = TEACHER; rpcErr = null })

describe('POST /api/consent/school', () => {
  it('records the school consent for the TOKEN\'s account, with the trimmed school name and the current notice', async () => {
    const r = await post({ ...GOOD, teacher: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' })   // a body id is ignored
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, id: 'consent-1' })
    expect(calls).toHaveLength(1)
    expect(calls[0].fn).toBe('consent_grant_school')
    expect(calls[0].args).toMatchObject({ p_teacher: TEACHER, p_school_name: 'Lincoln Elementary', p_notice_version: 'notice-v8' })
  })

  it('signed out → 401, nothing written', async () => {
    who = null
    expect((await post(GOOD)).status).toBe(401)
    expect(calls).toEqual([])
  })

  it('no tick, no school name, a too-long name or an old notice → refused before anything is written', async () => {
    expect((await post({ ...GOOD, agree: false })).status).toBe(400)
    expect((await post({ ...GOOD, agree: 'yes' })).status).toBe(400)
    expect((await post({ ...GOOD, school: ' x ' })).status).toBe(400)
    expect((await post({ ...GOOD, school: 'a'.repeat(121) })).status).toBe(400)
    expect((await post({ ...GOOD, school: 42 })).status).toBe(400)
    expect((await post({ ...GOOD, noticeVersion: 'notice-v4' })).status).toBe(409)
    expect(calls).toEqual([])
  })

  it('the database says this account is not a teacher (P0C03) → 403 not_eligible', async () => {
    rpcErr = { status: 400, code: 'P0C03' }
    const r = await post(GOOD)
    expect(r.status).toBe(403)
    expect(await r.json()).toEqual({ error: 'not_eligible' })
  })

  it('a database without the function (PGRST202) → 503 not_ready', async () => {
    rpcErr = { status: 404, code: 'PGRST202' }
    const r = await post(GOOD)
    expect(r.status).toBe(503)
    expect(await r.json()).toEqual({ error: 'not_ready' })
  })
})
