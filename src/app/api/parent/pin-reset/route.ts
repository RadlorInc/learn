import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../../_rateLimit'
import { sinkError } from '@/infra/errorSink'
import { ConfigMissing, adultFromBearer, sendEmail } from '@/features/consent/server'
import { transactionalEmail } from '@/features/billing/cancelNotice'

/**
 * "Forgot PIN?" (founder, 2026-10-06): starts the 24-hour PIN reset and emails the account's own address that one was
 * asked for, so a reset started by someone else (a child on the device) is noticed while it can still be cancelled.
 *
 * ⚠️ THE RESET IS THE SAME RPC AS BEFORE, CALLED AS THE CALLER: `request_parent_pin_reset` with the caller's own token,
 * so `auth.uid()` decides whose PIN — never the body (not read) and never the service role.
 *
 * ⚠️ ONE EMAIL PER RESET. The status is read first (as the caller): a reset already pending sends nothing, because the
 * RPC does not restart the clock either. Two requests racing past that read share one Resend idempotency key — the
 * account and the reset's own time — so Resend returns the first message rather than sending a second.
 * No PIN, code or link is in the email; the address comes from the auth server, `sendEmail` refuses a listed one.
 */
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (overLimit(callerKey(req, 'pin-reset'), 10, 60_000)) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  let adult
  try { adult = await adultFromBearer(req) } catch (e) {
    if (e instanceof ConfigMissing) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 })
    throw e
  }
  if (!adult) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const asCaller = async (fn: string): Promise<Record<string, unknown> | null> => {
    const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST', cache: 'no-store', body: '{}',
      headers: { apikey: anon, Authorization: req.headers.get('authorization')!, 'Content-Type': 'application/json' },
    }).catch(() => null)
    return r?.ok ? await r.json().catch(() => null) : null
  }

  const before = await asCaller('parent_pin_status')
  const out = await asCaller('request_parent_pin_reset')
  if (!out) return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 })
  const resetAt = typeof out.reset_at === 'string' ? out.reset_at : null
  if (out.ok !== true || !resetAt) return NextResponse.json({ ok: false })

  let emailed = false
  // `before` unreadable counts as "not pending": the idempotency key still stops a duplicate.
  if (!before?.reset_at && adult.email) {
    try {
      await sendEmail('transactional', adult.email, transactionalEmail('Your Radlic parent PIN is being reset', [
        'Someone asked to reset the parent PIN on your Radlic account, with “Forgot PIN?” on the PIN screen.',
        'For your child’s safety the PIN is removed 24 hours after the request. After that, a new PIN can be set.',
        'If this was you, there is nothing to do.',
        'If it was not you, open your Radlic dashboard and enter your PIN before then: that cancels the reset. Then tell us at support@radlor.com.',
      ]), `pin-reset-${adult.id}-${resetAt}`)
      emailed = true
    } catch (e) {
      await sinkError({ at: new Date().toISOString(), source: 'server', routePath: '/api/parent/pin-reset',
        message: `pin reset email not sent: ${e instanceof Error ? e.message : String(e)}` }).catch(() => {})
    }
  }
  return NextResponse.json({ ok: true, reset_at: resetAt, emailed })
}
