'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUpWithEmail, signInWithEmail, signInWithGoogleOAuth, sendPasswordReset } from '@/data/auth'
import { getMyRole, homeForRole, enterAsChild } from '@/data/repositories'
import { loginEmail } from '@/core/childLogin'
import { getLeadEmail } from '@/infra/storage/leadEmail'
import { ConsentLine } from '@/shared/ui/ConsentLine'
import { LEGACY_CHAPTERS_HIDDEN } from '@/core/chapters'
import { makeT, saveLang, useSavedLang } from '@/features/dashboard/i18n'
import { APP_NAME } from '@/app/site'
import { firstNameOf } from '@/features/consent/firstName'

type Mode = 'login' | 'signup'

/* The adult surface's palette, read off globals.css rather than retyped as hex. These are the same
   values the Stitch parent-suite designs use — `page`/`card`/`cardBorder`/`textPrimary`/… were
   already in this repo under different names, so the design system did not have to be imported. */
const C = {
  page:   'var(--paper)',            // #FFF8EC
  card:   'var(--paper-soft)',       // #FFFEFA
  edge:   'var(--card-border)',      // #E7D8BE
  ink:    'var(--ink)',              // #3D2516
  ink2:   'var(--ink-soft)',         // #6F4E36
  ink3:   'var(--ink-muted)',        // #A0856E
  accent: 'var(--milo-orange)',      // #F26B2C
  hover:  'var(--milo-orange-hover)',// #DD5D22
} as const

const field: React.CSSProperties = {
  padding: '12px 14px', fontSize: 15, minHeight: 44,
  border: `2px solid ${C.edge}`, borderRadius: 12,
  outline: 'none', width: '100%', boxSizing: 'border-box',
  fontWeight: 500, color: C.ink, background: C.card,
  transition: 'border-color 0.15s',
}

/** A password box with a show/hide eye. Each box has its own toggle, so revealing one never reveals the other. */
function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const t = makeT(useSavedLang())
  const [shown, setShown] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input {...props} type={shown ? 'text' : 'password'} style={{ ...field, paddingRight: 48 }} />
      <button
        type="button"
        onClick={() => setShown(s => !s)}
        aria-label={shown ? t('Hide password') : t('Show password')}
        aria-pressed={shown}
        aria-controls={props.id}
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 46,   // 44px tap floor
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer', color: C.ink2,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {shown && <line x1="3" y1="3" x2="21" y2="21" />}
        </svg>
      </button>
    </div>
  )
}

export default function AuthPage() {
  const router = useRouter()
  const lang = useSavedLang(), t = makeT(lang)
  const [mode,     setMode]     = useState<Mode>('login')
  const [email,    setEmail]    = useState(() => getLeadEmail() ?? '')   // prefill from the checkup lead capture
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')   // signup only: the name the consent email greets
  const [confirm,  setConfirm]  = useState('')     // signup only: typed twice, compared before anything is sent
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)
  function reset() { setError(null); setSuccess(null) }

  async function handleEmailAuth() {
    if (!email.trim() || !password.trim()) {
      setError(mode === 'login' ? t('Please enter your email or username, and your password') : t('Please enter your email and password'))
      return
    }
    if (password.length < 6) {
      setError(t('Password must be at least 6 characters'))
      return
    }
    if (mode === 'signup' && !firstNameOf({ first_name: firstName })) {
      setError(t('Please enter your first name'))
      return
    }
    if (mode === 'signup' && confirm !== password) {
      setError(t('Passwords do not match'))
      return
    }

    setLoading(true); reset()

    try {
      if (mode === 'signup') {
        const { data, error } = await signUpWithEmail(
          email.trim(),
          password,
          `${window.location.origin}/auth/callback`,
          { first_name: firstNameOf({ first_name: firstName }) },
        )
        // V10 REVERSED (founder's call, 2026-09-22): say plainly that the email already has an account,
        // as most apps do. The cost is account enumeration — anyone can learn whether an address is
        // registered — accepted because a parent who forgot they signed up got "check your email" and
        // then nothing, with no way to know why.
        // ⚠️ Supabase does NOT return an error for an existing CONFIRMED address: it answers with a
        // fake user whose `identities` is EMPTY (measured on production). An existing UNCONFIRMED
        // address gets a real resend and a non-empty list, so "check your email" stays right for it.
        const exists = error
          ? /already|registered|exists/i.test(error.message)
          : data.user?.identities?.length === 0
        if (exists) {
          setMode('login'); setConfirm('')
          setError(t('This email already has an account. Sign in below, or tap “Forgot password?”'))
        } else if (error) {
          setError(error.message)
        } else {
          setSuccess(t('Check your email for a confirmation link!'))
        }
      } else {
        // A child types a username; `loginEmail` turns it into their account's address (core/childLogin.ts).
        const { error } = await signInWithEmail(loginEmail(email), password)
        if (error) {
          setError(
            error.message.includes('Invalid login')
              ? t('Incorrect email, username or password')
              : error.message
          )
        } else {
          // On-page password sign-in does NOT round-trip through /auth/callback, so
          // nothing else navigates — redirect here or the user is stranded on /auth.
          // Role-aware: teachers land on Grades; a role-less account lands on /parent (picker).
          // A child (profiles.role 'learner') goes to their own lessons, with their learner made active first.
          const role = await getMyRole()
          router.replace(role === 'learner' ? await enterAsChild() : homeForRole(role))
          return
        }
      }
    } catch {
      // A genuine network failure (offline / Supabase unreachable) throws rather than
      // returning { error } — without this the spinner would hang forever.
      setError(t('Couldn’t connect — check your connection and try again'))
    } finally {
      setLoading(false)
    }
  }

  async function signInWithGoogle() {
    setLoading(true); reset()
    try {
      const { error } = await signInWithGoogleOAuth(`${window.location.origin}/auth/callback`)
      if (error) { setError(error.message); setLoading(false) }
      // On success the browser navigates to Google — leave loading true.
    } catch {
      setError(t('Couldn’t connect — check your connection and try again'))
      setLoading(false)
    }
  }

  /**
   * ⚠️ THE SAME NEUTRAL MESSAGE WHETHER OR NOT THE ACCOUNT EXISTS. Reporting "no account with
   * that email" here would hand back exactly the enumeration answer V10 removed from signup —
   * and it is worse on this control, because it needs no password to probe with.
   */
  async function forgotPassword() {
    if (!email.trim()) { setError(t('Enter your email address first, then tap this again')); return }
    // A child's account has no mailbox; only the adult who set their login can change the password.
    if (!email.includes('@')) { setError(t('Children: ask your parent or teacher to set a new password for you.')); return }
    setLoading(true); reset()
    try {
      await sendPasswordReset(email.trim(), `${window.location.origin}/auth/set-password`)
    } catch { /* fall through to the same line: a thrown network error must not confirm the address either */ }
    setSuccess(t('If that email has an account, a reset link is on its way.'))
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.page, padding: 24, gap: 24,
      fontFamily: 'var(--font-body)',
    }}>
      <div className="adult-split">

        {/* The case for the product, for the half of the frame a laptop has spare. Hidden under
            900px by `.adult-aside` — a phone gets the form and nothing competing with it. */}
        <aside className="adult-aside">
          <span style={{
            display: 'inline-block', background: 'var(--milo-orange-soft)', color: C.ink,
            borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 800,
            letterSpacing: 0.3, textTransform: 'uppercase',
          }}>{t('Adaptive math · KG to grade 8')}</span>
          <h2 style={{
            fontSize: 38, lineHeight: 1.15, fontWeight: 900, color: C.ink,
            margin: '18px 0 14px', fontFamily: 'var(--font-display)', maxWidth: 520,
          }}>
            {t('Quiet insight into how your child actually learns.')}
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: C.ink2, margin: 0, maxWidth: 480 }}>
            {t('No vanity streaks or frantic countdowns. We track mathematical intuition step by step and report the real milestones straight to you.')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 26 }}>
            {[t('Curriculum aligned UK & US'), t('Private by default — no public profiles')].map(chip => (
              <span key={chip} style={{
                background: C.card, border: `1.5px solid ${C.edge}`, borderRadius: 999,
                padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: C.ink2,
              }}>{chip}</span>
            ))}
          </div>
        </aside>

        {/* The form half */}
        <div>
          {/* English or Spanish (founder, 2026-09-22). The same device setting as the parent dashboard's Account → Language. */}
          <div role="group" aria-label="Language · Idioma" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
            {([['en', 'English'], ['es', 'Español']] as const).map(([l, label]) => (
              <button key={l} type="button" lang={l} aria-pressed={lang === l} onClick={() => { saveLang(l); reset() }}
                style={{ padding: '6px 16px', minHeight: 44, borderRadius: 999, border: '2px solid', borderColor: lang === l ? C.accent : C.edge,
                  background: lang === l ? 'var(--milo-orange-soft)' : C.card, color: C.ink, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
          {/* The wordmark — plain text until there is a logo (the mascot image went with the Radlic rename). */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1 style={{
              fontSize: 28, fontWeight: 800,
              color: C.accent, margin: 0,
              fontFamily: 'var(--font-display)',
            }}>{APP_NAME}</h1>
            <p style={{ fontSize: 14, color: C.ink3, margin: '5px 0 0', fontWeight: 600 }}>
              {t('Adaptive math from KG to grade 8')}
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: C.card, borderRadius: 24,
            padding: '24px 22px',
            width: '100%',
            boxShadow: '0 6px 28px rgba(61,37,22,0.10)',
            display: 'flex', flexDirection: 'column', gap: 15,
            border: `2px solid ${C.edge}`,
            boxSizing: 'border-box',
          }}>

            {/* Mode toggle */}
            <div style={{
              display: 'flex', background: C.page,
              borderRadius: 12, padding: 4, gap: 4,
              border: `1.5px solid ${C.edge}`,
            }}>
              {(['login', 'signup'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setConfirm(''); reset() }}
                  style={{
                    // 44px tap floor. At `padding: '9px'` these measured 34px tall at every viewport —
                    // over WCAG AA's 24 but under the 44 this repo aims at, on the two controls that
                    // decide which form a parent is filling in.
                    flex: 1, padding: '9px', minHeight: 44,
                    borderRadius: 9, border: 'none',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    background: mode === m ? C.accent : 'transparent',
                    color: mode === m ? '#fff' : C.ink2,
                    transition: 'all 0.15s',
                  }}
                >
                  {m === 'login' ? t('Sign in') : t('Create account')}
                </button>
              ))}
            </div>

            {/* Error / Success messages */}
            {error && (
              <div role="alert" style={{
                background: '#FFF1F0', border: '1.5px solid #F0B4AE',
                borderRadius: 12, padding: '10px 14px',
                fontSize: 13, color: '#93000A', fontWeight: 600,
              }}>{error}</div>
            )}
            {success && (
              <div role="status" style={{
                background: '#F2FAEC', border: '1.5px solid #BFE3A6',
                borderRadius: 12, padding: '10px 14px',
                fontSize: 13, color: '#33610F', fontWeight: 600,
              }}>{success}</div>
            )}

            {mode === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="auth-first-name" style={{ fontSize: 13, fontWeight: 700, color: C.ink2 }}>{t('First name')}</label>
                <input
                  id="auth-first-name"
                  type="text"
                  value={firstName}
                  maxLength={40}
                  onChange={e => { setFirstName(e.target.value); reset() }}
                  onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                  autoComplete="given-name"
                  style={field}
                  onFocus={e => { e.target.style.borderColor = C.accent }}
                  onBlur={e => { e.target.style.borderColor = C.edge }}
                />
              </div>
            )}

            {/* Email input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="auth-email" style={{ fontSize: 13, fontWeight: 700, color: C.ink2 }}>
                {mode === 'login' ? t('Email or username') : t('Email address')}
              </label>
              <input
                id="auth-email"
                type={mode === 'login' ? 'text' : 'email'}
                placeholder={mode === 'login' ? t('you@example.com or username') : 'you@example.com'}
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={e => { setEmail(e.target.value); reset() }}
                onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                autoComplete={mode === 'login' ? 'username' : 'email'}
                style={field}
                onFocus={e => { e.target.style.borderColor = C.accent }}
                onBlur={e => { e.target.style.borderColor = C.edge }}
              />
            </div>

            {/* Password input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <label htmlFor="auth-password" style={{ fontSize: 13, fontWeight: 700, color: C.ink2 }}>
                  {t('Password')}
                </label>
                {mode === 'login' && (
                  <button
                    onClick={forgotPassword}
                    disabled={loading}
                    /* ⚠️ 44px OF HIT AREA WITHOUT 44px OF LAYOUT. Measured at 390px this control
                       was 14px tall — and unlike the Terms/Privacy links in the consent sentence
                       (inline text, which WCAG 2.5.8 exempts) this is a standalone control, so the
                       repo's 44px floor applies. Padding buys the target; the matching negative
                       margin gives the label row its height back, so the form does not grow. */
                    style={{
                      background: 'none', border: 'none',
                      padding: '15px 6px', margin: '-15px -6px',   // 14px line box + 30px = 44
                      fontSize: 12.5, fontWeight: 700, color: C.accent,
                      cursor: loading ? 'wait' : 'pointer', textDecoration: 'underline',
                    }}
                  >{t('Forgot password?')}</button>
                )}
              </div>
              <PasswordInput
                id="auth-password"
                placeholder={mode === 'signup' ? t('At least 6 characters') : '••••••••'}
                value={password}
                onChange={e => { setPassword(e.target.value); reset() }}
                onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                onFocus={e => { e.target.style.borderColor = C.accent }}
                onBlur={e => { e.target.style.borderColor = C.edge }}
              />
            </div>

            {/* Confirm password — signup only. A typo in a password nobody can see locks a parent out of
                the account they just made, and the only recovery is the email reset flow. */}
            {mode === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="auth-confirm" style={{ fontSize: 13, fontWeight: 700, color: C.ink2 }}>
                  {t('Confirm password')}
                </label>
                <PasswordInput
                  id="auth-confirm"
                  placeholder={t('Type it again')}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); reset() }}
                  onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                  autoComplete="new-password"
                  aria-label={t('Confirm password')}
                  onFocus={e => { e.target.style.borderColor = C.accent }}
                  onBlur={e => { e.target.style.borderColor = C.edge }}
                />
              </div>
            )}

            {/* COPPA/ToS: the documents are linked ABOVE the button, so they are on screen before the
                adult commits rather than after. This is the consent record — without it we cannot show
                that anyone was told what they were agreeing to. */}
            <ConsentLine lang={lang} />
            {/* Email auth button */}
            <button
              data-auth="email"
              onClick={handleEmailAuth}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', minHeight: 44,
                background: loading ? C.edge : C.accent,
                color: loading ? C.ink3 : '#fff',
                border: 'none', borderRadius: 50,
                fontSize: 16, fontWeight: 800,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(242,107,44,0.28)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = C.hover }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = C.accent }}
            >
              {loading ? t('Please wait…') : mode === 'login' ? t('Sign in') : t('Create account')}
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              color: C.ink3, fontSize: 13,
            }}>
              <div style={{ flex: 1, height: 1, background: C.edge }} />
              {t('or')}
              <div style={{ flex: 1, height: 1, background: C.edge }} />
            </div>

            {/* Google button */}
            <button
              data-auth="google"
              onClick={signInWithGoogle}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, width: '100%', padding: '13px 20px', minHeight: 44,
                background: C.card, border: `2px solid ${C.edge}`,
                borderRadius: 50, cursor: loading ? 'wait' : 'pointer',
                fontSize: 15, fontWeight: 700, color: C.ink,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.edge }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('Continue with Google')}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: C.ink3, margin: 0 }}>
              {t('Your child’s progress is saved securely to your account')}
            </p>
          </div>

          {/* Front door for cold traffic: try the diagnostic before making an account. */}
          {!LEGACY_CHAPTERS_HIDDEN && <a href="/diagnostic" style={{
            display: 'block', width: '100%', marginTop: 16,
            textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box',
            background: C.card, border: `2px dashed rgba(242,107,44,0.5)`, borderRadius: 18,
            padding: '14px 18px', color: C.accent, fontWeight: 700, fontSize: 15,
          }}>
            Not sure where they are? Take the free check →
            <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.ink3, marginTop: 3 }}>No account needed to start</span>
          </a>}
        </div>
      </div>
    </div>
  )
}
