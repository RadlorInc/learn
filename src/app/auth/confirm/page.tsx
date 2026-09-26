'use client'
/**
 * Where the ONE sign-up email lands (founder, 2026-09-25): `/auth/confirm?th=<token_hash>` — plus `#t=<consent token>`
 * in a parent's email.
 *
 *   1. confirm the address (Supabase `verifyOtp`, type signup) — this signs the parent in, and the profile is created
 *      in the same step (handle_new_user fires on the confirmation);
 *   2. set the role chosen on the sign-up form (it rides in user_metadata, written by our server route), so there is
 *      no second "Parent or Teacher?" question;
 *   3. a parent goes straight to the consent page with the consent token (the box there IS the grant, as with B1);
 *      a teacher goes home.
 *
 * ⚠️ A USED OR EXPIRED CONFIRMATION LINK IS NOT A DEAD END FOR A PARENT. A second click finds the token spent; the
 * consent token in the fragment is still good, so the parent still reaches the consent page — the address was confirmed
 * by the click that came first, and the consent request carries its own seven-day window.
 * ⚠️ AN ADDRESS SIGNED UP MORE THAN ONCE GETS A NEW PASSWORD HERE (SEC-01, Rafi's N2). The server route replaced the
 * password with a random one when the second sign-up came in (`app_metadata.signup_count` > 1), because the first
 * sign-up may have been somebody else's. Whoever clicked THIS link holds the inbox, so they choose it now; leaving
 * without choosing is safe — nobody knows the random one, and "Forgot password" works.
 * ⚠️ BUT A FAILURE TO REACH THE AUTH SERVER IS NOT "ALREADY USED". It must not move on to the consent page: the address
 * would stay unconfirmed, and a parent who then gave consent could not sign in. Found by driving the page in a browser
 * (the local CSP blocked the call), which a script calling the API directly could never have shown.
 */
import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setPassword, verifyEmailToken } from '@/data/auth'
import { getMyRole, homeForRole, setMyRole } from '@/data/repositories'
import { makeT, useSavedLang } from '@/features/dashboard/i18n'

export default function ConfirmPage() {
  return <Suspense fallback={null}><Confirm /></Suspense>
}

function Confirm() {
  const router = useRouter()
  const th = useSearchParams().get('th')
  const t = makeT(useSavedLang())
  const ran = useRef(-1)
  const [failed, setFailed] = useState<'link' | 'network' | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [next, setNext] = useState<string | null>(null)   // set = ask for a new password, then go here
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (ran.current === attempt) return
    ran.current = attempt
    const consent = new URLSearchParams(window.location.hash.slice(1)).get('t')
    ;(async () => {
      const { data, error } = th ? await verifyEmailToken(th, 'signup').catch(e => ({ data: null, error: e })) : { data: null, error: { status: 403 } }
      if (error || !data?.user) {
        // Status 0 / no status = the request never got an answer: say so, and let the parent try again.
        const status = (error as { status?: number } | null)?.status
        if (!status) { setFailed('network'); return }
        if (consent) { router.replace(`/consent/respond#t=${consent}`); return }
        setFailed('link')
        return
      }
      const chosen = data.user.user_metadata?.role
      if ((chosen === 'parent' || chosen === 'teacher') && !(await getMyRole())) await setMyRole(chosen)
      const to = consent ? `/consent/respond#t=${consent}` : homeForRole(await getMyRole())
      if (Number(data.user.app_metadata?.signup_count) > 1) { setNext(to); return }
      router.replace(to)
    })()
  }, [th, router, attempt])

  async function savePassword() {
    if (pw.length < 6) { setPwError(t('Use at least 6 characters')); return }
    setSaving(true); setPwError(null)
    const { error } = await setPassword(pw).catch(() => ({ error: { message: '' } }))
    if (error) { setPwError(t('Couldn’t save it — try again')); setSaving(false); return }
    router.replace(next!)
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--paper)' }}>
      {next
        ? <form data-confirm="new-password" onSubmit={e => { e.preventDefault(); void savePassword() }}
            style={{ maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--ink)' }}>
            <p style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>{t('Choose your password')}</p>
            <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{t('This email address was used to sign up more than once, so to keep the account safe, please choose its password now.')}</p>
            <input type="password" autoComplete="new-password" aria-label={t('New password')} value={pw} disabled={saving}
              onChange={e => { setPw(e.target.value); setPwError(null) }}
              style={{ padding: '12px 14px', fontSize: 16, minHeight: 44, border: '2px solid var(--card-border)', borderRadius: 12 }} />
            {pwError && <p role="alert" style={{ margin: 0, color: '#93000A', fontWeight: 700 }}>{pwError}</p>}
            <button type="submit" disabled={saving}
              style={{ minHeight: 44, padding: '10px 20px', borderRadius: 50, border: 'none', fontWeight: 800, background: 'var(--accent-fill)', color: 'var(--on-accent-fill)', cursor: 'pointer' }}>
              {t('Save and continue')}</button>
          </form>
        : failed === 'network'
        ? <div style={{ maxWidth: 420, textAlign: 'center', color: 'var(--ink)' }}>
            <p style={{ fontWeight: 700 }}>{t('Couldn’t connect — check your connection and try again')}</p>
            <button type="button" onClick={() => { setFailed(null); setAttempt(a => a + 1) }}
              style={{ minHeight: 44, padding: '10px 20px', borderRadius: 50, border: 'none', fontWeight: 800, background: 'var(--accent-fill)', color: 'var(--on-accent-fill)', cursor: 'pointer' }}>
              {t('Try again')}</button>
          </div>
        : failed === 'link'
        ? <div style={{ maxWidth: 420, textAlign: 'center', color: 'var(--ink)' }}>
            <p style={{ fontWeight: 700 }}>{t('This link has expired or was already used.')}</p>
            <a href="/auth" style={{ fontWeight: 800, color: 'var(--milo-orange)' }}>{t('Sign in')}</a>
          </div>
        : <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-soft)' }}>{t('Signing you in…')}</p>}
    </main>
  )
}
