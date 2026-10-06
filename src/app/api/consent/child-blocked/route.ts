import { NextResponse } from 'next/server'
import { sinkHandled } from '@/infra/errorSink'
import { callerKey, overLimit } from '../../_rateLimit'
import { SITE_URL } from '@/app/site'
import { NOTICE_VERSION } from '@/features/consent/copy'
import { PENDING_TTL_DAYS } from '@/features/consent/config'
import { renderB1 } from '@/features/consent/email'
import {
  ConfigMissing, requireConfig, PRIVACY_VERSION, TERMS_VERSION, hashToken, newToken, rpc, sendEmail, userFromBearer, Undeliverable, type RpcError,
} from '@/features/consent/server'

/**
 * A CHILD'S WRITE WAS REFUSED FOR CONSENT — SEND THE ADULT WHO ADDED THEM THE CONSENT EMAIL (B1, on the current notice).
 * Founder, 2026-09-28: "if a child is ever blocked for consent … the parent gets an email with the consent link".
 * Since notice-v7 the usual case is a Kindergarten / Grades 1–2 child whose parent agreed only to notice-v6; answering
 * this email upgrades the account consent and the child's queued answers go up (consent_grant, 20260928100000).
 *
 * WHO MAY ASK is read with the CALLER'S OWN token under RLS: only someone who can see this child (the child's own
 * login, or an adult on the child). WHAT happens is decided here, as the service role, and never from the body:
 *   · the child is refused by the gate (`consent_ok` false) → the adult who ADDED them gets B1;
 *   · not refused → nothing, unless the caller IS that adult (the correction card asking for the newer notice so a
 *     child can be moved into Kindergarten or Grades 1–2).
 * At most one working link: nothing is sent while a request on this notice is still open, or once the adult holds a
 * granted consent to it. Nothing about the child goes in the email; B1 is the same email every parent gets.
 */
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const json = (body: unknown, status = 200) => NextResponse.json(body, { status })

async function rest<T>(path: string, token: string, key: string): Promise<T | null> {
  const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}${path}`, { headers: { apikey: key, Authorization: `Bearer ${token}` }, cache: 'no-store' })
  return r.ok ? ((await r.json().catch(() => null)) as T) : null
}
const asService = <T>(path: string) => rest<T>(path, process.env.SUPABASE_SERVICE_ROLE_KEY!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: Request) {
  if (overLimit(callerKey(req, 'consent-child-blocked'), 10, 10 * 60_000)) return json({ error: 'rate_limited' }, 429)
  const body = await req.json().catch(() => ({}))
  const learnerId = typeof body?.learnerId === 'string' && UUID.test(body.learnerId) ? body.learnerId : null
  if (!learnerId) return json({ error: 'bad_request' }, 400)
  try {
    requireConfig()
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
    const who = await userFromBearer(req)
    if (!who) return json({ error: 'unauthenticated' }, 401)
    const seen = await rest<{ id: string; created_by: string }[]>(
      `/rest/v1/learners?id=eq.${learnerId}&select=id,created_by`, token, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const learner = seen?.[0]
    if (!learner) return json({ error: 'not_found' }, 404)

    const refused = !(await rpc<boolean>('consent_ok', { p_learner_id: learnerId }))
    if (!refused && who !== learner.created_by) return json({ ok: true, sent: false })

    const adult = learner.created_by
    const mine = await asService<{ state: string; expires_at: string }[]>(`/rest/v1/parental_consents?parent_id=eq.${adult}`
      + `&scope=eq.account&notice_version=eq.${NOTICE_VERSION}&state=in.(granted,pending)&select=state,expires_at`)
    if (mine === null) return json({ error: 'failed' }, 502)
    if (mine.some(c => c.state === 'granted')) return json({ ok: true, sent: false })
    if (mine.some(c => Date.parse(c.expires_at) > Date.now())) return json({ ok: true, sent: false, pending: true })

    const tok = newToken()
    let row: { consent_id: string; email: string }
    try {
      ;[row] = await rpc<{ consent_id: string; email: string }[]>('consent_request', {
        p_parent: adult, p_notice_version: NOTICE_VERSION, p_privacy_version: PRIVACY_VERSION, p_terms_version: TERMS_VERSION,
        p_lang: 'en', p_token_hash: hashToken(tok), p_ttl: `${PENDING_TTL_DAYS} days`, p_scope: 'account', p_ack_at: null,
        // The parent ticked nothing in the app — record no acknowledgement (20260928100000). A database without the argument
        // answers PGRST202, below: nothing is sent rather than a request that claims an "I agree".
        p_acked: false,
      })
    } catch (e) {
      const code = (e as RpcError).code
      if (code === 'P0C03') return json({ ok: true, sent: false })        // that adult cannot be asked (e.g. no confirmed email)
      if (code === 'PGRST202' || code === 'P0C04') return json({ error: 'not_ready' }, 503)
      throw e
    }
    let id: string
    try {
      id = await sendEmail('transactional', row.email, renderB1('en', `${SITE_URL}/consent/respond#t=${tok}`, null), `consent-${row.consent_id}-b1`)
    } catch (e) {
      // The adult's address hard-bounced or complained: nobody can be emailed, so the screen says to ask a grown-up.
      if (e instanceof Undeliverable) return json({ ok: true, sent: false })
      throw e
    }
    await rpc('consent_record_request_sent', { p_id: row.consent_id, p_provider_id: id })
    return json({ ok: true, sent: true })
  } catch (e) {
    if (e instanceof ConfigMissing) {
      console.error('[consent/child-blocked] not configured: missing', e.message)
      return json({ error: 'not_configured' }, 503)
    }
    console.error('[consent/child-blocked] failed', e)
    await sinkHandled('[consent/child-blocked] failed', e)
    return json({ error: 'failed' }, 502)
  }
}
