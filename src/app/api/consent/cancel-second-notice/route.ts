import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../../_rateLimit'
import { ConfigMissing, requireConfig, drainB3Cancellations } from '@/features/consent/server'

/**
 * Cancel every queued B3 (see `drainB3Cancellations`). Called by the dashboard right after "Delete
 * <name>'s profile" and "Close your account", and once a day by a Vercel cron as the backstop for
 * anything else that ended a consent (a deletion from SQL or the auth dashboard, a dropped request).
 *
 * ⚠️ NO SIGN-IN REQUIRED, ON PURPOSE. After "Close your account" the caller no longer exists, so a
 * session check would refuse exactly the call that matters most. It is safe to leave open because
 * the only thing it can do is cancel emails the DATABASE has already queued for cancelling — the
 * queue is written only by a trigger, and nothing a caller sends is read. The worst a stranger can
 * do is make a correct cancellation happen sooner; the rate limit stops them turning it into load.
 */
async function drain(req: Request) {
  if (overLimit(callerKey(req, 'consent-cancel-b3'), 10, 10 * 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  try {
    requireConfig()
    return NextResponse.json({ tried: await drainB3Cancellations() })
  } catch (e) {
    if (e instanceof ConfigMissing) return NextResponse.json({ error: 'not_configured', missing: e.message }, { status: 503 })
    console.error('[consent/cancel-second-notice] failed', e)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}

export const POST = drain
export const GET = drain   // Vercel cron sends GET
