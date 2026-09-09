'use client'
/**
 * ⚠️ NO `?k=<token>` GATE. The review tool used one and it was a mistake we had to undo; a URL is
 * shared, logged, and pasted. This is Supabase Auth, email + password, with self-signup OFF —
 * accounts are created by hand in the Supabase dashboard and given the `admin` role there.
 */
import { useState } from 'react'
import { signInWithEmail } from '@/data/auth'

export default function AdminLogin() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null)
    const { error } = await signInWithEmail(email.trim(), pw)
    setBusy(false)
    // ⚠️ ONE MESSAGE FOR EVERY FAILURE. Distinguishing "no such account" from "wrong password"
    // tells an attacker which emails exist here.
    if (error) { setErr('Sign-in failed.'); return }
    window.location.href = '/admin'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f7fa', fontFamily: 'ui-sans-serif, system-ui' }}>
      <form onSubmit={submit} style={{ background: '#fff', border: '1px solid #e3e8ef', borderRadius: 10, padding: 24, width: 320 }}>
        <h1 style={{ fontSize: 16, margin: '0 0 14px' }}>Sign in</h1>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
               autoComplete="username" style={inp} />
        <input type="password" required value={pw} onChange={e => setPw(e.target.value)} placeholder="Password"
               autoComplete="current-password" style={inp} />
        <button disabled={busy} style={{ ...inp, background: '#3d6fd1', color: '#fff', border: 0, cursor: 'pointer', marginBottom: 0 }}>
          {busy ? '…' : 'Sign in'}
        </button>
        {err && <p style={{ color: '#8a1c1c', fontSize: 12, marginBottom: 0 }}>{err}</p>}
      </form>
    </div>
  )
}
const inp: React.CSSProperties = { display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 10px', marginBottom: 10, border: '1px solid #d7dde5', borderRadius: 6, fontSize: 14 }
