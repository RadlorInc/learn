import { NextResponse } from 'next/server'
import { callerKey, overLimit } from '../../_rateLimit'
import { SITE_URL } from '@/app/site'
import { NOTICE_VERSION } from '@/features/consent/copy'
import { PENDING_TTL_DAYS } from '@/features/consent/config'
import { renderConfirm, renderSignup } from '@/features/consent/email'
import { firstNameOf } from '@/features/consent/firstName'
import {
  ConfigMissing, requireConfig, PRIVACY_VERSION, TERMS_VERSION, generateSignupLink, hashToken, newToken, rpc, sendEmail, type RpcError,
} from '@/features/consent/server'

/**
 * EMAIL-AND-PASSWORD SIGN-UP, WITH ONE EMAIL (founder, 2026-09-25: "they will receive only one mail").
 *
 * The browser used to call `supabase.auth.signUp`, which sent Supabase's own confirmation email; a parent then got
 * the consent request (B1) as a second email. Now the account is created here, Supabase sends nothing, and WE send
 * one email: for a parent, B0 — B1's words, and a link that confirms the address and opens the consent page; for a
 * teacher, B0t — the confirmation alone. A Google sign-in never comes here (it has no confirmation email) and still
 * gets B1 from the dashboard.
 *
 * ⚠️ The confirmation token rides in the QUERY (Supabase's `token_hash`, which the confirm page must read on load) and
 * the consent token in the FRAGMENT, exactly as B1's link carries it: never sent to a server, never in a log.
 * ⚠️ Rate-limited like every public write: this route creates accounts and sends email on an anonymous request.
 */
export async function POST(req: Request) {
  if (overLimit(callerKey(req, 'signup'), 5, 10 * 60_000)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const role = body.role === 'teacher' ? 'teacher' : body.role === 'parent' ? 'parent' : null
  const firstName = firstNameOf({ first_name: body.firstName })
  const lang = body.lang === 'es' ? 'es' : 'en'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 6 || !role || !firstName) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  try {
    requireConfig()
    const link = await generateSignupLink(email, password, { first_name: firstName, role })
    if (!link.ok) {
      // V10 REVERSED (founder, 2026-09-22): an existing account is said plainly, as the old signUp path did.
      if (link.reason === 'exists') return NextResponse.json({ error: 'exists' }, { status: 409 })
      return NextResponse.json({ error: link.reason, message: link.message }, { status: 400 })
    }
    // The role the account was FIRST created with wins: re-sending must not turn a teacher's sign-up into a consent.
    const asParent = (link.metadata.role ?? role) === 'parent'
    const confirm = `${SITE_URL}/auth/confirm?th=${encodeURIComponent(link.hashedToken)}`
    const key = `signup-${link.userId}-${link.hashedToken.slice(0, 16)}`

    if (asParent) {
      const token = newToken()
      let row: { consent_id: string } | undefined
      try {
        ;[row] = await rpc<{ consent_id: string }[]>('consent_request_at_signup', {
          p_parent: link.userId, p_notice_version: NOTICE_VERSION, p_privacy_version: PRIVACY_VERSION,
          p_terms_version: TERMS_VERSION, p_lang: lang, p_token_hash: hashToken(token), p_ttl: `${PENDING_TTL_DAYS} days`,
        })
      } catch (e) {
        // A database without 20260926090000 has no such function (PGRST202): fall back to a confirmation-only email,
        // and the parent is asked from the dashboard as before. Anything else is a real failure.
        if ((e as RpcError).code !== 'PGRST202') throw e
      }
      if (row) {
        const id = await sendEmail('transactional', email, renderSignup(lang, `${confirm}#t=${token}`, firstName), key)
        await rpc('consent_record_request_sent', { p_id: row.consent_id, p_provider_id: id })
        return NextResponse.json({ ok: true })
      }
    }
    await sendEmail('transactional', email, renderConfirm(lang, confirm), key)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ConfigMissing) {
      console.error('[auth/signup] not configured: missing', e.message)
      return NextResponse.json({ error: 'not_configured' }, { status: 503 })
    }
    // console, not reportCrash: see features/consent/server.ts. An account created without its email is re-sent by
    // signing up again (generate_link issues a new token for an unconfirmed address).
    console.error('[auth/signup] failed', e)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
