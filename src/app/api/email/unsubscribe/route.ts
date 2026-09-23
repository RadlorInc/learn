import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../../_rateLimit'
import { ConfigMissing, looksLikeToken, unsubscribe } from '@/features/consent/server'

/**
 * One-click unsubscribe from commercial email (CAN-SPAM; docs/legal/09 §7). The token in `?t=` is the
 * only credential — no sign-in, no questions. Two callers, one path:
 *   · a mail client honouring RFC 8058: POSTs `List-Unsubscribe=One-Click` to the List-Unsubscribe URL;
 *   · the page the footer link opens (/email/unsubscribe), when the reader presses its one button.
 * ⚠️ POST ONLY. Mail scanners fetch every link in a message; a GET that unsubscribed would take
 * addresses off the list that nobody asked to remove.
 */
export async function POST(req: Request) {
  if (overLimit(callerKey(req, 'email-unsubscribe'), 30, 10 * 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  const t = new URL(req.url).searchParams.get('t')
  if (!looksLikeToken(t)) return NextResponse.json({ status: 'unknown' })
  try {
    return NextResponse.json({ status: await unsubscribe(t) })
  } catch (e) {
    if (e instanceof ConfigMissing) {
      console.error('[email/unsubscribe] not configured: missing', e.message)
      return NextResponse.json({ error: 'not_configured' }, { status: 503 })
    }
    console.error('[email/unsubscribe] failed', e)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
