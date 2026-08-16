import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../_rateLimit'

// Client-error sink. The browser ErrorBoundary POSTs here so client-side crashes (which
// instrumentation.ts's onRequestError does NOT see — that's server-only) reach the same place.
// Forwards to MONITORING_INGEST_URL (Sentry/Logtail/etc.) when configured; always lands in
// Vercel logs otherwise. Payload is bounded + field-picked so this public endpoint can't be
// used to amplify arbitrary data into the log/sink.
export const dynamic = 'force-dynamic'

const INGEST_URL = process.env.MONITORING_INGEST_URL
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
      source: 'client',
      message: cap(body.message, 500) ?? 'unknown client error',
      stack: cap(body.stack, 2000),
      componentStack: cap(body.componentStack, 2000),
      url: cap(body.url, 500),
      ua: cap(req.headers.get('user-agent'), 300),
      // WHO. Turns the log from a pile of stack traces into something answerable when a parent
      // writes in: grep this id. A learner id is a UUID, not PII, and it joins to the owning
      // account in one hop. Capped like every other field so this public endpoint stays bounded.
      learnerId: cap(body.learnerId, 64),
    }
    console.error('[milo.client-error]', JSON.stringify(record))
    if (INGEST_URL) {
      await fetch(INGEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }).catch(() => {})
    }
  } catch {
    /* reporting must never fail the caller */
  }
  return NextResponse.json({ ok: true })
}
