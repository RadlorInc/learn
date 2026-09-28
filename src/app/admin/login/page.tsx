'use client'
/**
 * ⚠️ NO `?k=<token>` GATE. The review tool used one and it was a mistake we had to undo; a URL is
 * shared, logged, and pasted. This is Supabase Auth, email + password, with self-signup OFF —
 * accounts are created by hand in the Supabase dashboard and listed in the `admin_users` table.
 *
 * Two-step verification: an account with a verified authenticator (set up at /admin/mfa) is asked
 * for its 6-digit code after the password, and only enters /admin once the session is aal2. The
 * admin layout sends an aal1 session back here, and this page opens on the code step. An account
 * without an authenticator signs in exactly as before and never sees the code step.
 */
import { useEffect, useState } from 'react'
import { signInWithEmail, needsSecondStep, verifiedTotpFactor, verifyTotp } from '@/data/auth'
import { signOut } from '@/data/repositories'

export default function AdminLogin() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [code, setCode] = useState('')
  const [step, setStep] = useState<'password' | 'code'>('password')
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)

  useEffect(() => { needsSecondStep().then(n => { if (n) setStep('code') }) }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null)
    const { error } = await signInWithEmail(email.trim(), pw)
    // ⚠️ ONE MESSAGE FOR EVERY FAILURE. Distinguishing "no such account" from "wrong password"
    // tells an attacker which emails exist here.
    if (error) { setBusy(false); setErr('Sign-in failed.'); return }
    const second = await needsSecondStep()
    setBusy(false)
    if (second) { setStep('code'); return }
    window.location.href = '/admin'
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null)
    const factorId = await verifiedTotpFactor()
    const { error } = factorId ? await verifyTotp(factorId, code.replace(/\s/g, '')) : { error: true }
    setBusy(false)
    if (error) { setErr('That code did not work. Try the next one.'); return }
    window.location.href = '/admin'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f3f9ff', fontFamily: 'ui-sans-serif, system-ui' }}>
      {step === 'password' ? (
        <form onSubmit={submit} style={card}>
          <h1 style={{ fontSize: 16, margin: '0 0 14px' }}>Sign in</h1>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
                 autoComplete="username" style={inp} />
          <input type="password" required value={pw} onChange={e => setPw(e.target.value)} placeholder="Password"
                 autoComplete="current-password" style={inp} />
          <button disabled={busy} style={{ ...inp, background: '#0b4fa8', color: '#fff', border: 0, cursor: 'pointer', marginBottom: 0 }}>
            {busy ? '…' : 'Sign in'}
          </button>
          {err && <p style={{ color: '#8a1c1c', fontSize: 12, marginBottom: 0 }}>{err}</p>}
        </form>
      ) : (
        <form onSubmit={submitCode} style={card} data-admin-step="code">
          <h1 style={{ fontSize: 16, margin: '0 0 6px' }}>Enter your code</h1>
          <p style={{ fontSize: 12, color: '#3d6fb8', margin: '0 0 12px' }}>The 6-digit code from your authenticator app.</p>
          <input id="admin-code" required value={code} onChange={e => setCode(e.target.value)} placeholder="123456"
                 inputMode="numeric" autoComplete="one-time-code" style={inp} />
          <button disabled={busy} style={{ ...inp, background: '#0b4fa8', color: '#fff', border: 0, cursor: 'pointer', marginBottom: 0 }}>
            {busy ? '…' : 'Continue'}
          </button>
          {err && <p style={{ color: '#8a1c1c', fontSize: 12, marginBottom: 0 }}>{err}</p>}
          {/* The app's one sign-out path (it clears the device's copies too; signOutClearsProgress.test.ts). It lands on /auth. */}
          <button type="button" onClick={() => signOut()}
                  style={{ background: 'none', border: 0, padding: 0, marginTop: 12, fontSize: 12, color: '#3d6fb8', cursor: 'pointer' }}>
            Sign out
          </button>
        </form>
      )}
    </div>
  )
}
const card: React.CSSProperties = { background: '#fff', border: '1px solid #d3e9f9', borderRadius: 10, padding: 24, width: 'min(320px, calc(100vw - 32px))', boxSizing: 'border-box' }
const inp: React.CSSProperties = { display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 10px', marginBottom: 10, border: '1px solid #d3e9f9', borderRadius: 6, fontSize: 14 }
