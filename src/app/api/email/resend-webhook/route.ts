import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { sinkError } from '@/infra/errorSink'

/**
 * Resend's webhook: a BOUNCE or a SPAM COMPLAINT on an email we sent becomes one `error_events` row, so the ops digest's
 * `error_events_24h` counts it. Before this, a consent email that bounced was invisible: the parent simply never answered.
 *
 * ⚠️ THE ROW IS THE EVENT TYPE AND NOTHING ELSE: `[resend] email.bounced`. Resend's payload carries the recipient's
 * address, the subject and the bounce text; none of it is read, logged or stored. Which address bounced is in the
 * Resend dashboard (Emails → filter by status), where it already is.
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
  let type: unknown
  try { type = (JSON.parse(body) as { type?: unknown })?.type } catch { /* signed but not JSON: nothing to record */ }
  if (typeof type === 'string' && RECORDED.has(type)) {
    await sinkError({ at: new Date().toISOString(), source: 'server', message: `[resend] ${type}` })
  }
  return NextResponse.json({ ok: true })
}
