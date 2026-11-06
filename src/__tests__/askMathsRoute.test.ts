/**
 * /api/ask-maths (docs/product/ask-maths.md): the database decides who may ask (ask_maths_begin, with the CALLER's
 * token), the whiteboard service is called from the server only (its secret never reaches a browser), the lesson is
 * passed on as it arrives, and every begun question is settled exactly once by ask_maths_finish (service role) —
 * answered with its lesson, the screen's verdict, or failed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseSse, scriptOf } from '@/features/askMaths/stream'

const work: Promise<unknown>[] = []
vi.mock('next/server', async (orig) => ({ ...(await orig<typeof import('next/server')>()), after: (f: () => Promise<unknown>) => { work.push(f()) } }))

const KID = '11111111-2222-4333-8444-555555555555'
const QID = '99999999-2222-4333-8444-555555555555'
const sse = (...events: [string, unknown][]) => events.map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join('')
const LESSON = sse(['accepted', { id: 'x' }], ['stage', { stage: 'writing' }], ['els', { els: { a: 'tape 1 2 3 4' } }],
  ['step', { i: 0, step: { say: 'Step 1: one', do: ['draw a'] } }], ['step', { i: 1, step: { say: 'Step 2: two', do: [] } }], ['done', { id: 'x' }])

describe('/api/ask-maths', () => {
  const calls: { url: string; init: RequestInit }[] = []
  let begin: () => Response, wb: () => Response
  beforeEach(() => {
    calls.length = 0; work.length = 0
    vi.stubEnv('ASK_MATHS', 'on')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://db.example.test')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key')
    vi.stubEnv('WHITEBOARD_URL', 'https://wb.example.test/')
    vi.stubEnv('WHITEBOARD_PARTNER_SECRET', 'partner-secret')
    begin = () => Response.json({ ok: true, id: QID, band: '12-14', left: 4 })
    wb = () => new Response(LESSON, { headers: { 'content-type': 'text/event-stream' } })
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      if (url.endsWith('/rpc/ask_maths_begin')) return begin()
      if (url.endsWith('/api/partner/maths')) return wb()
      if (url.endsWith('/rpc/ask_maths_finish')) return Response.json(true)
      return new Response('?', { status: 500 })
    }))
  })
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
  const ask = async (body: unknown, token: string | null = 'kid-token') => {
    const { POST } = await import('@/app/api/ask-maths/route')
    const res = await POST(new Request('https://radlic.test/api/ask-maths', { method: 'POST', body: JSON.stringify(body), headers: token ? { authorization: `Bearer ${token}` } : {} }))
    const text = await res.text(); await Promise.all(work)
    return { status: res.status, type: res.headers.get('content-type'), text }
  }
  const finishes = () => calls.filter(c => c.url.endsWith('/rpc/ask_maths_finish')).map(c => ({ auth: (c.init.headers as Record<string, string>).Authorization, ...JSON.parse(c.init.body as string) }))
  const sent = (suffix: string) => calls.find(c => c.url.endsWith(suffix))

  it('a lesson: begun with the CALLER\'s token, the service called with the secret and the band, streamed on, kept, settled once', async () => {
    const r = await ask({ learner: KID, question: '  What is a ratio?  ' })
    expect(r.status).toBe(200); expect(r.type).toBe('text/event-stream'); expect(r.text).toBe(LESSON)
    expect((sent('/rpc/ask_maths_begin')!.init.headers as Record<string, string>).Authorization).toBe('Bearer kid-token')
    expect(JSON.parse(sent('/rpc/ask_maths_begin')!.init.body as string)).toEqual({ p_learner: KID, p_question: 'What is a ratio?' })
    const call = sent('/api/partner/maths')!
    expect(call.url).toBe('https://wb.example.test/api/partner/maths')
    expect((call.init.headers as Record<string, string>).Authorization).toBe('Bearer partner-secret')
    expect(JSON.parse(call.init.body as string)).toEqual({ question: 'What is a ratio?', band: '6-8' })
    expect(finishes()).toEqual([{ auth: 'Bearer service-key', p_id: QID, p_outcome: 'answered', p_script: {
      els: { a: 'tape 1 2 3 4' }, steps: [{ say: 'Step 1: one', do: ['draw a'] }, { say: 'Step 2: two', do: [] }] } }])
  })
  it('the 9-11 band is sent as grades 3-5', async () => {
    begin = () => Response.json({ ok: true, id: QID, band: '9-11', left: 4 })
    await ask({ learner: KID, question: 'q' })
    expect(JSON.parse(sent('/api/partner/maths')!.init.body as string).band).toBe('3-5')
  })
  it('a stream that ends without done is settled as failed, with no lesson kept', async () => {
    wb = () => new Response(sse(['accepted', {}], ['els', { els: {} }], ['failed', { code: 'check_failed' }]), { headers: { 'content-type': 'text/event-stream' } })
    await ask({ learner: KID, question: 'q' })
    expect(finishes()).toEqual([{ auth: 'Bearer service-key', p_id: QID, p_outcome: 'failed', p_script: null }])
  })
  for (const verdict of ['not_maths', 'personal', 'unsafe'])
    it(`the screen says ${verdict}: 422 with it, and the row settled as ${verdict}`, async () => {
      wb = () => Response.json({ code: verdict }, { status: 422 })
      const r = await ask({ learner: KID, question: 'q' })
      expect(r.status).toBe(422); expect(JSON.parse(r.text)).toEqual({ error: verdict, left: 4 })
      expect(finishes().map(f => f.p_outcome)).toEqual([verdict])
    })
  it('the service is down: 503 unavailable, the row settled as failed (it does not count against the day)', async () => {
    wb = () => Response.json({ code: 'paused' }, { status: 503 })
    const r = await ask({ learner: KID, question: 'q' })
    expect(r.status).toBe(503); expect(finishes().map(f => f.p_outcome)).toEqual(['failed'])
  })
  it('a refusal from the database: 409 with its reason, and the service is never called', async () => {
    for (const error of ['off', 'not_entitled', 'limit', 'busy', 'band']) {
      calls.length = 0; begin = () => Response.json({ ok: false, error })
      const r = await ask({ learner: KID, question: 'q' })
      expect(r.status).toBe(409); expect(JSON.parse(r.text)).toEqual({ error })
      expect(sent('/api/partner/maths')).toBeUndefined()
    }
  })
  it('somebody else\'s child (42501): 403; no token: 401 and nothing is asked', async () => {
    begin = () => Response.json({ code: '42501' }, { status: 403 })
    expect((await ask({ learner: KID, question: 'q' })).status).toBe(403)
    calls.length = 0
    expect((await ask({ learner: KID, question: 'q' }, null)).status).toBe(401)
    expect(calls).toHaveLength(0)
  })
  it('bad input: 400 before anything is asked; switched off: 404', async () => {
    for (const b of [{ learner: 'nope', question: 'q' }, { learner: KID, question: '' }, { learner: KID, question: 'x'.repeat(301) }])
      expect((await ask(b)).status).toBe(400)
    expect(calls).toHaveLength(0)
    vi.stubEnv('ASK_MATHS', '')
    expect((await ask({ learner: KID, question: 'q' })).status).toBe(404)
  })
})

describe('parseSse / scriptOf', () => {
  it('reads whole events only, skips comments and broken ones, and rebuilds the lesson from els, els_add and steps in order', () => {
    const text = ': hb\n\n' + sse(['els', { els: { a: '1' }, drawings: { d: 1 } }], ['step', { i: 1, step: 'B' }]) + 'event: bad\ndata: {nope\n\n' +
      sse(['els_add', { els: { b: '2' } }], ['step', { i: 0, step: 'A' }]) + 'event: step\ndata: {"i":2'
    const ev = parseSse(text)
    expect(ev.map(e => e.event)).toEqual(['els', 'step', 'els_add', 'step'])
    expect(scriptOf(ev)).toEqual({ els: { a: '1', b: '2' }, drawings: { d: 1 }, steps: ['A', 'B'] })
  })
})
