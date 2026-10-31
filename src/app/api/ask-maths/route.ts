import { after } from 'next/server'
import { callerKey, overLimit } from '../_rateLimit'
import { sinkError } from '@/infra/errorSink'
import { ASK_MATHS_ON, MAX_QUESTION, parseSse, scriptOf } from '@/features/askMaths/stream'

/**
 * POST /api/ask-maths {learner, question} with the signed-in token (the child's own login, or the parent's session the
 * child is using): Ask maths (docs/product/ask-maths.md). The route decides nothing about who may ask:
 *
 *   1. `ask_maths_begin` (as the caller) checks access, grade band, the parent's switch, the paid add-on, one at a
 *      time and the daily limit, and makes a 'pending' row — or refuses (403 forbidden / 409 {error}).
 *   2. The question goes, from this server only, to the askRadlor whiteboard service (`WHITEBOARD_URL`, Bearer
 *      `WHITEBOARD_PARTNER_SECRET`), which screens it and streams the lesson as server-sent events.
 *   3. Those events are passed to the browser as they come; the lesson is also kept, and `ask_maths_finish` (service
 *      role) records the outcome — after the browser has gone too (`after`), so a closed tab still settles the row.
 *
 * Answers: 404 when ASK_MATHS is not 'on'; 400 bad input; 401 no token; 403 not this caller's child; 409 a refusal
 * ({error: off | band | not_entitled | busy | limit}); 422 the screen's verdict ({error: not_maths | personal |
 * unsafe}); 503 {error: unavailable}; otherwise 200 text/event-stream.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const out = (body: object, status: number) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })
const BAND = { '9-11': '3-5', '12-14': '6-8' } as const

async function finish(id: string, outcome: string, script: unknown = null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const res = await fetch(`${url}/rest/v1/rpc/ask_maths_finish`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8000),
    headers: { apikey: key!, Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ p_id: id, p_outcome: outcome, p_script: script }),
  }).catch(() => null)
  if (!res?.ok) await sinkError({ at: new Date().toISOString(), source: 'server', routePath: '/api/ask-maths',
    message: `ask-maths: ask_maths_finish ${outcome} not recorded (${res ? res.status : 'network'}) — the row stays pending` }).catch(() => {})
}

export async function POST(req: Request) {
  if (!ASK_MATHS_ON()) return out({ error: 'not_found' }, 404)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const wb = process.env.WHITEBOARD_URL, secret = process.env.WHITEBOARD_PARTNER_SECRET, service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !wb || !secret || !service) return out({ error: 'unavailable' }, 503)
  if (overLimit(callerKey(req, 'ask-maths'), 20, 60_000)) return out({ error: 'busy' }, 429)

  const body = (await req.json().catch(() => null)) as { learner?: unknown; question?: unknown } | null
  const learner = typeof body?.learner === 'string' ? body.learner : '', question = typeof body?.question === 'string' ? body.question.trim() : ''
  if (!UUID.test(learner) || !question || [...question].length > MAX_QUESTION) return out({ error: 'bad_request' }, 400)
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return out({ error: 'unauthenticated' }, 401)

  // ── 1. The database decides ──
  const res = await fetch(`${url}/rest/v1/rpc/ask_maths_begin`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8000),
    headers: { apikey: anon, Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ p_learner: learner, p_question: question }),
  }).catch(() => null)
  if (!res) return out({ error: 'unavailable' }, 503)
  if (res.status === 401) return out({ error: 'unauthenticated' }, 401)
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { code?: string } | null
    // P0C01: the consent gate (the family's consent is not current) — the same "not available" the child sees.
    return err?.code === '42501' ? out({ error: 'forbidden' }, 403) : out({ error: 'unavailable' }, err?.code === 'P0C01' ? 409 : 503)
  }
  const begun = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; id?: string; band?: keyof typeof BAND; left?: number } | null
  if (!begun?.ok || !begun.id || !begun.band || !(begun.band in BAND)) return out({ error: begun?.error ?? 'unavailable' }, 409)
  const id = begun.id

  // ── 2. The whiteboard service ──
  const up = await fetch(`${wb.replace(/\/$/, '')}/api/partner/maths`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(280_000),
    headers: { Authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
    body: JSON.stringify({ question, band: BAND[begun.band] }),
  }).catch(() => null)
  if (!up || !up.ok || !up.body || !up.headers.get('content-type')?.startsWith('text/event-stream')) {
    const verdict = up?.status === 422 ? ((await up.json().catch(() => null)) as { code?: string } | null)?.code : null
    if (verdict === 'not_maths' || verdict === 'personal' || verdict === 'unsafe') {
      await finish(id, verdict)
      return out({ error: verdict, left: begun.left }, 422)
    }
    await finish(id, 'failed')
    if (up && up.status !== 503) await sinkError({ at: new Date().toISOString(), source: 'server', routePath: '/api/ask-maths',
      message: `ask-maths: the whiteboard service answered ${up.status}` }).catch(() => {})
    return out({ error: 'unavailable' }, 503)
  }

  // ── 3. Pass the lesson on as it comes, keep it, settle the row ──
  let ctrl: ReadableStreamDefaultController<Uint8Array> | null = null, gone = false
  const stream = new ReadableStream<Uint8Array>({ start(c) { ctrl = c }, cancel() { gone = true } })
  const reader = up.body.getReader(), dec = new TextDecoder()
  const work = (async () => {
    let text = ''
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        text += dec.decode(value, { stream: true })
        if (!gone) try { ctrl!.enqueue(value) } catch { gone = true }
      }
    } catch { /* the service went away: whatever arrived decides below */ }
    const events = parseSse(text), last = events.at(-1)?.event
    await finish(id, last === 'done' ? 'answered' : 'failed', last === 'done' ? scriptOf(events) : null)
    if (!gone) try { ctrl!.close() } catch {}
  })()
  after(() => work)
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no', 'X-Ask-Left': String(begun.left ?? '') } })
}
