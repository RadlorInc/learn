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
 * link — which is now a real flow: /auth's "Forgot password?" sends one here.
 */

import { Suspense, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { getCurrentSession, verifyEmailToken, setPassword } from '@/data/auth'
import { getMyRole, homeForRole } from '@/data/repositories'

const MIN = 6

const C = {
  page:   'var(--paper)',
  card:   'var(--paper-soft)',
  edge:   'var(--card-border)',
  ink:    'var(--ink)',
  ink2:   'var(--ink-soft)',
  ink3:   'var(--ink-muted)',
  accent: 'var(--milo-orange)',
  hover:  'var(--milo-orange-hover)',
} as const

const field: React.CSSProperties = {
  padding: '12px 14px', fontSize: 15, minHeight: 44,
  border: `2px solid ${C.edge}`, borderRadius: 12,
  outline: 'none', width: '100%', boxSizing: 'border-box',
  fontWeight: 500, color: C.ink, background: C.card,
  transition: 'border-color 0.15s',
}

/** The page frame. Shared by the form, the "checking" state and the dead-link state so all three
 *  are the same screen rather than three that happen to look similar. */
function Frame({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.page, padding: 24, gap: 22,
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <Image
          src="/assets/characters/milo-happy.png"
          alt="Milo"
          width={78}
          height={78}
          priority
          style={{ objectFit: 'contain', marginBottom: 6 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: C.accent, margin: 0,
          fontFamily: 'var(--font-display)',
        }}>AdaptiveLearn</h1>
        <p style={{ fontSize: 14, color: C.ink3, margin: '5px 0 0', fontWeight: 600 }}>
          {subtitle}
        </p>
      </div>

      {/* 420px is the design's own max — a password form has two fields and gains nothing from a
          laptop's width, so this one screen stays a column and only its PADDING responds. */}
      <div style={{
        background: C.card, borderRadius: 24, padding: '24px 22px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 6px 28px rgba(61,37,22,0.10)',
        display: 'flex', flexDirection: 'column', gap: 15,
        border: `2px solid ${C.edge}`, boxSizing: 'border-box',
      }}>
        {children}
      </div>
    </div>
  )
}

/** One live requirement. Neutral until met — a red cross on a field somebody has not finished
 *  typing into is a telling-off, not help. */
function Rule({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 12.5, fontWeight: 600,
      color: met ? '#33610F' : C.ink3,
    }}>
      <span aria-hidden="true" style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: met ? '#33610F' : 'transparent',
        border: met ? 'none' : `1.5px solid ${C.edge}`,
        color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1,
      }}>{met ? '✓' : ''}</span>
      {children}
    </li>
  )
}

function SetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [ready,    setReady]    = useState(false)
  const [invitee,  setInvitee]  = useState<string | null>(null)   // whose invite this link is
  const [password, setPasswordV] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [dead,     setDead]     = useState(false)   // the link itself is spent/invalid, not a form error
  const ran = useRef(false)

  // Exchange the link's token for a session. Guarded with useOnceGuard's shape rather than the
  // hook itself: this effect must NOT re-run under StrictMode, because a token_hash is
  // single-use and the second verify would fail on a link that had just worked.
  useEffect(() => {
    if (ran.current) return
    ran.current = true

    async function establish() {
      // Clicking the link twice, or arriving already signed in, is not an error.
      const existing = await getCurrentSession()
      if (existing) { setInvitee(existing.user?.email ?? null); setReady(true); return }

      const tokenHash = params.get('token_hash')
      const type      = params.get('type') as EmailOtpType | null
      if (!tokenHash || !type) {
        setError('This link is missing its token. Ask for a fresh invite.')
        setDead(true)
        return
      }

      const { error } = await verifyEmailToken(tokenHash, type)
      if (error) {
        setError(
          error.message.toLowerCase().includes('expired')
            ? 'This invite link has expired. Ask for a fresh one.'
            : 'This invite link is not valid any more. Ask for a fresh one.',
        )
        setDead(true)
        return
      }
      // The verify establishes the session, so the address is knowable now — and showing it is
      // what tells the reader WHICH account they are about to set a password on.
      setInvitee((await getCurrentSession())?.user?.email ?? null)
      setReady(true)
    }

    establish().catch(() => setError("Couldn't connect — check your connection and try again"))
  }, [params])

  async function submit() {
    if (password.length < MIN)  { setError(`Password must be at least ${MIN} characters`); return }
    if (password !== confirm)   { setError('The two passwords do not match'); return }

    setLoading(true); setError(null)
    try {
      const { error } = await setPassword(password)
      if (error) { setError(error.message); setLoading(false); return }
      // logged by the global listener (infra/AuthEventLogger) — see auth.ts
      router.replace(homeForRole(await getMyRole()))
    } catch {
      setError("Couldn't connect — check your connection and try again")
      setLoading(false)
    }
  }

  const disabled  = loading || !ready
  const longEnough = password.length >= MIN
  const matches    = password.length > 0 && password === confirm

  /**
   * ⚠️ A DEAD LINK IS ITS OWN SCREEN, NOT AN ERROR STRIP OVER A FORM THE READER CANNOT USE.
   * Rendered as a strip, the two password fields sat there disabled underneath — so the one thing
   * this reader has to do (get a new invite) was the one thing the screen did not offer.
   */
  if (dead) return (
    <Frame subtitle="This link can no longer be used">
      <div role="alert" style={{
        background: '#FFF1F0', border: '1.5px solid #F0B4AE', borderRadius: 12,
        padding: '14px 16px', fontSize: 13.5, color: '#93000A', fontWeight: 600, lineHeight: 1.5,
      }}>{error}</div>
      <p style={{ fontSize: 12.5, color: C.ink3, margin: 0, lineHeight: 1.5 }}>
        Invite and reset links expire so that an old email in somebody&apos;s inbox cannot be used
        to reach your family&apos;s account later.
      </p>
      <Link
        href="/auth"
        style={{
          display: 'block', textAlign: 'center', textDecoration: 'none',
          width: '100%', padding: '14px', minHeight: 44, boxSizing: 'border-box',
          background: C.accent, color: '#fff', borderRadius: 50,
          fontSize: 16, fontWeight: 800,
        }}
      >Back to sign in</Link>
    </Frame>
  )

  return (
    <Frame subtitle="Choose a password for your account">
      {error && (
        <div role="alert" style={{
          background: '#FFF1F0', border: '1.5px solid #F0B4AE',
          borderRadius: 12, padding: '10px 14px',
          fontSize: 13, color: '#93000A', fontWeight: 600,
        }}>{error}</div>
      )}

      {!ready && !error && (
        <div style={{ fontSize: 14, color: C.ink2, fontWeight: 600, textAlign: 'center', padding: '8px 0' }}>
          Checking your invite…
          <span style={{ display: 'block', fontSize: 12.5, color: C.ink3, fontWeight: 500, marginTop: 6, lineHeight: 1.5 }}>
            Connecting with your school or family portal. This only takes a moment.
          </span>
        </div>
      )}

      {/* Which account this is for. Only shown once the token really resolved — printed from the
          query string it would be a claim about a link nobody had verified yet. */}
      {ready && invitee && (
        <div style={{
          background: C.page, border: `1.5px solid ${C.edge}`, borderRadius: 12,
          padding: '10px 14px', fontSize: 12.5, color: C.ink2, fontWeight: 600,
        }}>
          Setting a password for <strong style={{ color: C.ink, wordBreak: 'break-all' }}>{invitee}</strong>
        </div>
      )}

      {[
        { id: 'sp-new',     label: 'New password',     value: password, set: setPasswordV, ph: `At least ${MIN} characters` },
        { id: 'sp-confirm', label: 'Confirm password', value: confirm,  set: setConfirm,   ph: 'Type it again' },
      ].map(f => (
        <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor={f.id} style={{ fontSize: 13, fontWeight: 700, color: C.ink2 }}>{f.label}</label>
          <input
            id={f.id}
            type="password"
            placeholder={f.ph}
            value={f.value}
            disabled={disabled}
            onChange={e => { f.set(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoComplete="new-password"
            style={field}
            onFocus={e => { e.target.style.borderColor = C.accent }}
            onBlur={e => { e.target.style.borderColor = C.edge }}
          />
        </div>
      ))}

      {/* The two rules, live. They are the SAME two conditions `submit` enforces — stated where
          they can be read before the button is pressed rather than only after it is. */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <Rule met={longEnough}>{MIN} or more characters</Rule>
        <Rule met={matches}>Both passwords match</Rule>
      </ul>

      <button
        onClick={submit}
        disabled={disabled}
        style={{
          width: '100%', padding: '14px', minHeight: 44,
          background: disabled ? C.edge : C.accent,
          color: disabled ? C.ink3 : '#fff',
          border: 'none', borderRadius: 50,
          fontSize: 16, fontWeight: 800,
          cursor: loading ? 'wait' : disabled ? 'default' : 'pointer',
          boxShadow: disabled ? 'none' : '0 4px 14px rgba(242,107,44,0.28)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = C.hover }}
        onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = C.accent }}
      >
        {loading ? 'Please wait...' : 'Set password and continue'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: C.ink3, margin: 0 }}>
        Your child&apos;s progress is saved securely to your account
      </p>
    </Frame>
  )
}

export default function SetPasswordPage() {
  // useSearchParams needs a Suspense boundary or `next build` fails on this route.
  return <Suspense fallback={null}><SetPasswordForm /></Suspense>
}
