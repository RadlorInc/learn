import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { sinkError, sinkHandled } from '@/infra/errorSink'
import { markUndeliverable } from '@/features/consent/server'

/**
 * Resend's webhook: a BOUNCE or a SPAM COMPLAINT on an email we sent becomes one `error_events` row, so the ops digest's
 * `error_events_24h` counts it. Before this, a consent email that bounced was invisible: the parent simply never answered.
 *
 * ⚠️ THE ROW IS THE EVENT TYPE AND NOTHING ELSE: `[resend] email.bounced`. Resend's payload carries the recipient's
 * address, the subject and the bounce text; none of it is logged. Which address bounced is in the Resend dashboard
 * (Emails → filter by status), where it already is.
 *
 * ⚠️ AND A PERMANENT BOUNCE OR A COMPLAINT LISTS THE RECIPIENT (`email_undeliverable`, as a sha256 of the address —
 * never the address), so `sendEmail` mails it nothing again and its caller can say so. A bounce whose `bounce.type`
 * is not 'Permanent' (Resend's 'Transient' / 'Undetermined': a full mailbox, a greylist) lists nobody. If the write
 * fails the route answers 500 BEFORE recording the event, so Resend retries the whole delivery (the upsert is
 * idempotent); a table not there yet (migration pending) is not a failure — the event row is written and 200.
 *
 * ⚠️ SIGNED OR NOTHING. Resend signs with Svix: `svix-signature` holds `v1,<base64 HMAC-SHA256>` of
 * `<svix-id>.<svix-timestamp>.<raw body>`, keyed with the base64 part of the `whsec_…` secret. A few lines of
 * node:crypto, so no dependency. A timestamp more than 5 minutes off is refused (a replayed delivery).
 * Without `RESEND_WEBHOOK_SECRET` the route is inert: 503, nothing read, nothing written.
 */
export const dynamic = 'force-dynamic'

const TOLERANCE_S = 5 * 60
const RECORDED = new Set(['email.bounced', 'email.complained'])

function signed(secret: string, h: Headers, body: string): boolean {
  const id = h.get('svix-id'), ts = h.get('svix-timestamp'), sig = h.get('svix-signature')
  if (!id || !ts || !sig || !/^\d{1,12}$/.test(ts) || Math.abs(Date.now() / 1000 - Number(ts)) > TOLERANCE_S) return false
  const want = createHmac('sha256', Buffer.from(secret.replace(/^whsec_/, ''), 'base64')).update(`${id}.${ts}.${body}`).digest()
  // The header can carry several space-separated signatures while Resend rotates the secret; any one is enough.
  return sig.split(' ').some(part => {
    const [v, s] = part.split(',')
    const got = v === 'v1' && s ? Buffer.from(s, 'base64') : null
    return !!got && got.length === want.length && timingSafeEqual(got, want)
  })
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  const body = await req.text()
  if (!signed(secret, req.headers, body)) return NextResponse.json({ error: 'bad_signature' }, { status: 401 })
  let event: { type?: unknown; data?: { to?: unknown; bounce?: { type?: unknown } } } | null = null
  try { event = JSON.parse(body) } catch { /* signed but not JSON: nothing to record */ }
  const type = event?.type
  const reason = type === 'email.complained' ? 'complained'
    : type === 'email.bounced' && event?.data?.bounce?.type === 'Permanent' ? 'bounced' : null
  const to = Array.isArray(event?.data?.to) ? event.data.to.filter((x): x is string => typeof x === 'string' && x.includes('@')) : []
  if (reason) {
    try {
      for (const addr of to) await markUndeliverable(addr, reason)
    } catch (e) {
      await sinkHandled('[resend] could not list an undeliverable address', e)
      return NextResponse.json({ error: 'retry' }, { status: 500 })
    }
  }
  if (typeof type === 'string' && RECORDED.has(type)) {
    await sinkError({ at: new Date().toISOString(), source: 'server', message: `[resend] ${type}` })
  }
  return NextResponse.json({ ok: true })
}
