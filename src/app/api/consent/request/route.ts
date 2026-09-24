import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../../_rateLimit'
import { SITE_URL } from '@/app/site'
import { NOTICE_VERSION } from '@/features/consent/copy'
import { PENDING_TTL_DAYS } from '@/features/consent/config'
import { renderB1 } from '@/features/consent/email'
import {
  ConfigMissing, requireConfig, ackTime, PRIVACY_VERSION, TERMS_VERSION, hashToken, newToken, rpc, sendEmail, adultFromBearer, type RpcError,
} from '@/features/consent/server'

/**
 * The parent has read the notice (document 02) and pressed "I'm the parent or legal guardian —
 * continue". Record a PENDING consent stamped with what they were shown, and send B1.
 *
 * ⚠️ THE NOTICE VERSION IS THE BROWSER'S, CHECKED — NOT THE SERVER'S, ASSUMED. The app's pages are
 * cached by a service worker, so a parent can be reading yesterday's notice from yesterday's bundle.
 * Stamping the server's current version would record a notice they never saw; stamping whatever the
 * browser claims would let it write any string into the evidence. So the browser says what it
 * rendered, and anything but the current version is refused with "reload and read it again".
 */
export async function POST(req: Request) {
  if (overLimit(callerKey(req, 'consent-request'), 5, 10 * 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  const body = await req.json().catch(() => ({}))
  if (body?.noticeVersion !== NOTICE_VERSION) return NextResponse.json({ error: 'stale_notice' }, { status: 409 })
  const lang = body?.lang === 'es' ? 'es' : 'en'
  const ackAt = ackTime(body?.ackAt)

  try {
    requireConfig()
    const adult = await adultFromBearer(req)
    const parent = adult?.id
    if (!parent) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

    const token = newToken()
    let row: { consent_id: string; email: string }
    try {
      ;[row] = await rpc<{ consent_id: string; email: string }[]>('consent_request', {
        p_parent: parent, p_notice_version: NOTICE_VERSION, p_privacy_version: PRIVACY_VERSION,
        p_terms_version: TERMS_VERSION, p_lang: lang, p_token_hash: hashToken(token), p_ttl: `${PENDING_TTL_DAYS} days`,
        p_scope: 'account', p_ack_at: ackAt,
      })
    } catch (e) {
      if ((e as RpcError).code === 'P0C03') return NextResponse.json({ error: 'not_eligible' }, { status: 403 })
      // PostgREST resolves an RPC by its parameter NAMES: a database without consent-once (20260924100000)
      // has no consent_request(…, p_scope, p_ack_at) and answers PGRST202. Nothing was written; say so.
      if ((e as RpcError).code === 'PGRST202') return NextResponse.json({ error: 'not_ready' }, { status: 503 })
      throw e
    }

    // The token lives only in the URL FRAGMENT: never sent to a server, so never in an access log or
    // a Referer header. The page reads it and POSTs it; a mail scanner that prefetches the link sees a
    // page with buttons and changes nothing.
    const link = `${SITE_URL}/consent/respond#t=${token}`
    const id = await sendEmail('transactional', row.email, renderB1(lang, link, adult.firstName), `consent-${row.consent_id}-b1`)
    await rpc('consent_record_request_sent', { p_id: row.consent_id, p_provider_id: id })
    return NextResponse.json({ ok: true, email: row.email, days: PENDING_TTL_DAYS })
  } catch (e) {
    if (e instanceof ConfigMissing) {
      console.error('[consent/request] not configured: missing', e.message)
      return NextResponse.json({ error: 'not_configured', missing: e.message }, { status: 503 })
    }
    // console, not reportCrash: see server.ts. The pending row without a send record simply expires.
    console.error('[consent/request] failed', e)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
