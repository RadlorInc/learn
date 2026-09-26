import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../../_rateLimit'
import { ConfigMissing, requireConfig, drainB3Cancellations } from '@/features/consent/server'
import { fromCron, sendOpsDigest } from '@/features/ops/digest'

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
 *
 * The daily cron call ALSO sends the ops digest (src/features/ops/digest.ts) — only when the caller
 * proves it is the cron with `CRON_SECRET`, so a stranger cannot make it email anyone. The digest is
 * sent after the drain whether the drain worked or not, because a failed drain is what it reports.
 */
async function drain(req: Request) {
  if (overLimit(callerKey(req, 'consent-cancel-b3'), 10, 10 * 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  let res: NextResponse, outcome: string
  try {
    requireConfig()
    const tried = await drainB3Cancellations()
    outcome = tried === null ? 'queue missing (migration 20260923200000 not applied)' : String(tried)
    res = NextResponse.json({ tried })
  } catch (e) {
    if (e instanceof ConfigMissing) {
      outcome = `not configured (${e.message})`
      res = NextResponse.json({ error: 'not_configured', missing: e.message }, { status: 503 })
    } else {
      console.error('[consent/cancel-second-notice] failed', e)
      outcome = 'failed'
      res = NextResponse.json({ error: 'failed' }, { status: 502 })
    }
  }
  if (fromCron(req)) await sendOpsDigest(outcome)
  else if (!process.env.CRON_SECRET && req.headers.get('user-agent')?.startsWith('vercel-cron')) {
    console.warn('[ops-digest] skipped: CRON_SECRET is not set, so the cron cannot be told from a stranger')
  }
  return res
}

export const POST = drain
export const GET = drain   // Vercel cron sends GET
