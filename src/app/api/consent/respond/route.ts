import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../../_rateLimit'
import { SITE_URL } from '@/app/site'
import { secondNoticeDelayMs } from '@/features/consent/config'
import { renderB3 } from '@/features/consent/email'
import { ConfigMissing, requireConfig, cancelEmail, hashToken, looksLikeToken, rpc, sendEmail } from '@/features/consent/server'

interface Found {
  consent_id: string; state: string; lang: 'en' | 'es'; expired: boolean; email: string
  learner_id: string | null; second_email_provider_id: string | null; second_notice_scheduled_for: string | null
}

/**
 * Everything a link in B1 or B3 can do. The token IS the credential — it is how a parent reading the
 * email on a different device, not signed in, proves they hold that inbox — so this route needs no
 * session, and it is POST only: a GET that changed state would be triggered by every mail scanner
 * that prefetches links, granting consent that no parent gave.
 */
export async function POST(req: Request) {
  if (overLimit(callerKey(req, 'consent-respond'), 30, 10 * 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  const { t, action } = await req.json().catch(() => ({})) as { t?: unknown; action?: unknown }
  if (!looksLikeToken(t)) return NextResponse.json({ status: 'unknown' })
  const hash = hashToken(t)

  try {
    requireConfig()
    const [row] = await rpc<Found[]>('consent_lookup', { p_token_hash: hash })
    if (!row) return NextResponse.json({ status: 'unknown' })
    const lang = row.lang
    const ok = (status: string) => NextResponse.json({ status, lang })

    switch (action) {
      case 'lookup':
        return ok(row.expired ? 'expired' : row.state)

      case 'decline':
        return ok(await rpc<string>('consent_decline', { p_token_hash: hash }))

      case 'withdraw': {
        const s = await rpc<string>('consent_withdraw', { p_token_hash: hash })
        // B3 still waiting to go out would tell a parent who has just withdrawn "Yesterday you gave
        // permission". Cancelling is best-effort: the withdrawal has already committed either way.
        if (s === 'withdrawn' && row.second_email_provider_id && row.second_notice_scheduled_for
            && new Date(row.second_notice_scheduled_for) > new Date()) {
          await cancelEmail(row.second_email_provider_id)
        }
        return ok(s)
      }

      case 'grant': {
        if (row.state === 'granted') return ok('already_granted')
        if (row.state !== 'pending') return ok(row.state)
        // Out of its window: let the database mark it expired (it does so before anything else).
        if (row.expired) return ok(await rpc<string>('consent_grant', { p_token_hash: hash, p_second_provider_id: null, p_second_scheduled_for: null }))

        /**
         * ⚠️ B3 FIRST, GRANT SECOND. Without the second email this is not email-plus and the consent does
         * not stand, so it is scheduled BEFORE anything is granted, and the grant records its id in the
         * same statement — `parental_consents_email_plus_second_notice` refuses a grant without one. If
         * Resend is down, nothing is granted and the parent can simply click again.
         */
        const when = new Date(Date.now() + secondNoticeDelayMs())
        const withdraw = `${SITE_URL}/consent/withdraw#t=${t}`
        const b3 = await sendEmail(row.email, renderB3(lang, withdraw), `consent-${row.consent_id}-b3`, when)
        const s = await rpc<string>('consent_grant', { p_token_hash: hash, p_second_provider_id: b3, p_second_scheduled_for: when.toISOString() })
        // Lost a race to expiry or a decline: the email we just scheduled must never arrive. A repeat
        // click is 'already_granted', and because B3 carries an idempotency key its id IS the real
        // B3 — so that one is left alone.
        if (s !== 'granted' && s !== 'already_granted') await cancelEmail(b3)
        return ok(s)
      }
      default:
        return NextResponse.json({ error: 'bad_action' }, { status: 400 })
    }
  } catch (e) {
    if (e instanceof ConfigMissing) {
      console.error('[consent/respond] not configured: missing', e.message)
      return NextResponse.json({ error: 'not_configured', missing: e.message }, { status: 503 })
    }
    console.error('[consent/respond] failed', e)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
