'use client'

/**
 * Where an invited tester chooses their own password.
 *
 * Supabase's dashboard "Invite user" mails a link built from the Invite template. That template
 * MUST point here and carry the token, i.e.
 *   {{ .SiteURL }}/auth/set-password?token_hash={{ .TokenHash }}&type=invite
 * Left as the stock `{{ .ConfirmationURL }}`, the link lands on the Site URL with the tokens in
 * the fragment: supabase-js picks them up, the person is signed in, and they never set a password
 * — so they can get in exactly once and never again. That is the whole reason this page exists.
 *
 * `type` is read from the query rather than hard-coded, so the same page serves a `recovery`
 * link if a reset flow is ever added; nothing else here is invite-specific.
 */

import { Suspense, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { getCurrentSession, verifyEmailToken, setPassword, logAuthEvent } from '@/data/auth'
import { getMyRole, homeForRole } from '@/data/repositories'

const MIN = 6

function SetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [ready,    setReady]    = useState(false)
  const [password, setPasswordV] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const ran = useRef(false)

  // Exchange the link's token for a session. Guarded with useOnceGuard's shape rather than the
  // hook itself: this effect must NOT re-run under StrictMode, because a token_hash is
  // single-use and the second verify would fail on a link that had just worked.
  useEffect(() => {
    if (ran.current) return
    ran.current = true

    async function establish() {
      // Clicking the link twice, or arriving already signed in, is not an error.
      if (await getCurrentSession()) { setReady(true); return }

      const tokenHash = params.get('token_hash')
      const type      = params.get('type') as EmailOtpType | null
      if (!tokenHash || !type) {
        setError('This link is missing its token. Ask for a fresh invite.')
        return
      }

      const { error } = await verifyEmailToken(tokenHash, type)
      if (error) {
        setError(
          error.message.toLowerCase().includes('expired')
            ? 'This invite link has expired. Ask for a fresh one.'
            : 'This invite link is not valid any more. Ask for a fresh one.',
        )
        return
      }
      setReady(true)
    }

    establish().catch(() => setError("Couldn't connect — check your connection and try again"))
  }, [params])

  async function submit() {
    if (password.length < MIN)  { setError(`Password must be at least ${MIN} characters`); return }
    if (password !== confirm)   { setError('The two passwords do not match'); return }

    setLoading(true); setError(null)
    try {
      const { data, error } = await setPassword(password)
      if (error) { setError(error.message); setLoading(false); return }
      if (data.user) void logAuthEvent('login', data.user.id)
      router.replace(homeForRole(await getMyRole()))
    } catch {
      setError("Couldn't connect — check your connection and try again")
      setLoading(false)
    }
  }

  const disabled = loading || !ready

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #FFF4D6 0%, #FCEAB6 100%)',
      padding: 24, gap: 28,
    }}>
      <div style={{ textAlign: 'center' }}>
        <Image
          src="/assets/characters/milo-happy.png"
          alt="Milo"
          width={90}
          height={90}
          priority
          style={{ objectFit: 'contain', marginBottom: 8 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <h1 style={{
          fontSize: 30, fontWeight: 800, color: '#F26B2C', margin: 0,
          fontFamily: 'var(--font-display)',
        }}>AdaptiveLearn</h1>
        <p style={{ fontSize: 15, color: '#888', margin: '6px 0 0', fontWeight: 500 }}>
          Choose a password for your account
        </p>
      </div>

      <div style={{
        background: '#fff', borderRadius: 24, padding: '28px 24px',
        width: '100%', maxWidth: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column', gap: 16,
        border: '3px solid var(--outline)',
      }}>
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1.5px solid #FCA5A5',
            borderRadius: 12, padding: '10px 14px',
            fontSize: 13, color: '#991B1B', fontWeight: 600,
          }}>❌ {error}</div>
        )}

        {!ready && !error && (
          <div style={{ fontSize: 14, color: '#888', fontWeight: 600, textAlign: 'center' }}>
            Checking your invite…
          </div>
        )}

        {[
          { label: 'New password',     value: password, set: setPasswordV, ac: 'new-password', ph: `At least ${MIN} characters` },
          { label: 'Confirm password', value: confirm,  set: setConfirm,   ac: 'new-password', ph: 'Type it again' },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{f.label}</label>
            <input
              type="password"
              placeholder={f.ph}
              value={f.value}
              disabled={disabled}
              onChange={e => { f.set(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoComplete={f.ac}
              style={{
                padding: '12px 14px', fontSize: 15,
                border: '2px solid #e5e7eb', borderRadius: 12,
                outline: 'none', width: '100%', boxSizing: 'border-box', fontWeight: 500,
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = '#F26B2C' }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb' }}
            />
          </div>
        ))}

        <button
          onClick={submit}
          disabled={disabled}
          style={{
            width: '100%', padding: '14px', minHeight: 44,
            background: disabled ? '#e5e7eb' : 'linear-gradient(135deg, #F26B2C 0%, #e05a1f 100%)',
            color: disabled ? '#9ca3af' : '#fff',
            border: 'none', borderRadius: 50,
            fontSize: 16, fontWeight: 800,
            cursor: loading ? 'wait' : disabled ? 'default' : 'pointer',
            boxShadow: disabled ? 'none' : '0 4px 16px rgba(242,107,44,0.3)',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Please wait...' : 'Set password and continue'}
        </button>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  // useSearchParams needs a Suspense boundary or `next build` fails on this route.
  return <Suspense fallback={null}><SetPasswordForm /></Suspense>
}
