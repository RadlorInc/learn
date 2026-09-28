import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../_rateLimit'
import { sinkError } from '@/infra/errorSink'

// Client-error sink. The browser ErrorBoundary POSTs here so client-side crashes (which
// instrumentation.ts's onRequestError does NOT see — that's server-only) reach the same place.
// Every sink lives in `infra/errorSink` so this route and the server's onRequestError cannot
// drift apart: Vercel logs always, the `error_events` table when a service-role key is set, and
// MONITORING_INGEST_URL when one is configured. Payload is bounded + field-picked so this public
// endpoint can't be used to amplify arbitrary data into any of them.
export const dynamic = 'force-dynamic'

const cap = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : undefined)

/** ⚠️ THIS ONE COSTS MONEY THE DAY MONITORING IS WIRED. Unlimited, it forwards every POST to
 *  MONITORING_INGEST_URL — so an open endpoint becomes an open billing line on someone else's
 *  service, and the log noise buries the real crash it exists to surface. 30/min is generous for a
 *  genuinely broken page (the boundary reports once per crash) and cheap for anyone else. */
const LIMIT = 30
const WINDOW_MS = 60_000

export async function POST(req: Request) {
  // Silent 200 rather than a 429: this is a crash reporter, and a browser that has just crashed
  // must not be handed an error to handle. Dropping the surplus is the whole point.
  if (overLimit(callerKey(req, 'err'), LIMIT, WINDOW_MS)) return NextResponse.json({ ok: true })
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const record = {
      at: new Date().toISOString(),
      source: 'client' as const,
      message: cap(body.message, 500) ?? 'unknown client error',
      stack: cap(body.stack, 2000),
      componentStack: cap(body.componentStack, 2000),
      url: cap(body.url, 500),
      ua: cap(req.headers.get('user-agent'), 300),
      // WHO. Turns the log from a pile of stack traces into something answerable when a parent
      // writes in: grep this id. A learner id is a UUID, not PII, and it joins to the owning
      // account in one hop. Kept only when the caller's own session can read that learner.
      learnerId: await readableLearner(req, cap(body.learnerId, 64)),
    }
    await sinkError(record)
  } catch {
    /* reporting must never fail the caller */
  }
  return NextResponse.json({ ok: true })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** `id` if the request's bearer token can read that learner under RLS (the caller's token, never a
 *  service key), else undefined: the report is still stored, without the id. */
async function readableLearner(req: Request, id: string | undefined): Promise<string | undefined> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!id || !UUID.test(id) || !token || !url || !anon) return undefined
  const r = await fetch(`${url}/rest/v1/learners?id=eq.${id}&select=id`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` },
  }).catch(() => null)
  const rows: unknown = r?.ok ? await r.json().catch(() => null) : null
  return Array.isArray(rows) && rows.length === 1 ? id : undefined
}
