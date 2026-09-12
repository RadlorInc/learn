'use client'

/**
 * Where a child signs in as themselves.
 *
 * ⚠️ THE CHILD TYPES THREE THINGS AND NONE OF THEM IS AN EMAIL: their class code, their own name,
 * and a password. The address their account actually carries is synthesized from the first two and
 * is never shown — see `/api/child/signup`, which is the only place a child account is created.
 *
 * ⚠️ FIRST TIME IS AN EXPLICIT TOGGLE, NOT A GUESS. Trying to sign in and falling back to signup on
 * failure would mean a mistyped password silently creating a second account, and it would also tell
 * an anonymous caller which children exist. The child says which they are.
 *
 * ⚠️ Deliberately NOT linked from the adult `/auth` page's main path — a parent looking for their
 * own login must not land here. It is reached from the small "I'm a student" link, and by the class
 * code a teacher writes on the board.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/data/supabase/client'

const MIN = 6

/** Every refusal the route can return, in words a nine-year-old can act on. */
const SAYS: Record<string, string> = {
  no_class:        'No class has that code. Check it with your teacher.',
  no_child:        'That name is not on this class list. Type it the way your teacher wrote it.',
  ambiguous_name:  'There is more than one person with that name in this class — ask your teacher to help.',
  already_claimed: 'Somebody has already set a password for this name. If that was not you, tell your teacher.',
  weak_password:   `Make the password at least ${MIN} letters or numbers.`,
  rate_limited:    'Too many tries. Wait a minute and try again.',
  not_configured:  'Sign-in is not switched on yet. Tell your teacher.',
}

export default function ChildAuthPage() {
  const router = useRouter()
  const [firstTime, setFirstTime] = useState(false)
  const [joinCode, setJoinCode]   = useState('')
  const [name, setName]           = useState('')
  const [password, setPassword]   = useState('')
  const [busy, setBusy]           = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function go(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!joinCode.trim() || !name.trim()) { setError('Fill in your class code and your name.'); return }
    if (firstTime && password.length < MIN) { setError(SAYS.weak_password); return }
    setBusy(true)
    try {
      let email: string
      if (firstTime) {
        const res = await fetch('/api/child/signup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ joinCode, name, password }),
        })
        // ⚠️ `fetch` does not throw on 4xx — read `ok` or a refusal reads as success. This repo has
        // already shipped that exact bug once, in /api/lead.
        const out = await res.json().catch(() => ({}))
        if (!res.ok || !out?.ok) { setError(SAYS[out?.error] ?? 'Could not set that up. Try again.'); return }
        email = out.email
      } else {
        const res = await fetch(`/api/child/signup?joinCode=${encodeURIComponent(joinCode)}&name=${encodeURIComponent(name)}`)
        const out = await res.json().catch(() => ({}))
        if (!res.ok || !out?.ok) { setError(SAYS[out?.error] ?? 'Could not sign you in. Try again.'); return }
        email = out.email
      }

      const { error: signInError } = await createClient().auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(firstTime
          ? 'Your account was made but signing in failed. Try "I have been here before".'
          : 'That password did not match. Check it, or ask your teacher to help.')
        return
      }
      router.replace('/menu')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: '#57524B', marginBottom: 6 }
  const input: React.CSSProperties = {
    width: '100%', padding: '13px 15px', fontSize: 16, fontWeight: 600, border: '2px solid #e5e7eb',
    borderRadius: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16,
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                   padding: '24px 18px', background: 'var(--paper, #FBF7F0)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 22, padding: '28px 24px',
                    boxShadow: '0 8px 40px rgba(61,37,22,0.10)' }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 6px', color: '#1a1a1a' }}>
          {firstTime ? 'Make your password' : 'Hello again!'}
        </h1>
        <p style={{ fontSize: 14.5, color: '#57524B', margin: '0 0 20px', lineHeight: 1.5 }}>
          {firstTime
            ? 'Your teacher gave you a class code. Type it, then your name, then pick a password you can remember.'
            : 'Type your class code, your name and your password.'}
        </p>

        <form onSubmit={go}>
          <label style={label} htmlFor="code">Class code</label>
          <input id="code" value={joinCode} autoFocus autoCapitalize="characters" autoCorrect="off"
                 onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(null) }}
                 placeholder="ABC234" maxLength={12}
                 style={{ ...input, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.18em' }} />

          <label style={label} htmlFor="name">Your name</label>
          <input id="name" value={name} onChange={e => { setName(e.target.value); setError(null) }}
                 placeholder="The way your teacher writes it" maxLength={60} style={input} />

          <label style={label} htmlFor="pw">Password</label>
          <input id="pw" type="password" value={password} autoComplete={firstTime ? 'new-password' : 'current-password'}
                 onChange={e => { setPassword(e.target.value); setError(null) }}
                 placeholder={firstTime ? `At least ${MIN} letters or numbers` : ''} style={input} />

          {error && (
            <p role="alert" style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#B91C1C',
                                     background: '#FEF2F2', borderRadius: 12, padding: '10px 13px', lineHeight: 1.45 }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} style={{
            width: '100%', padding: 15, borderRadius: 50, border: 'none', fontSize: 16.5, fontWeight: 800,
            cursor: busy ? 'wait' : 'pointer', color: busy ? '#9ca3af' : '#fff',
            background: busy ? '#e5e7eb' : 'linear-gradient(135deg,#F26B2C 0%,#e05a1f 100%)',
          }}>
            {busy ? 'One moment…' : firstTime ? 'Set my password' : 'Go'}
          </button>
        </form>

        <button onClick={() => { setFirstTime(f => !f); setError(null) }} style={{
          display: 'block', margin: '16px auto 0', background: 'none', border: 'none', padding: 4,
          fontSize: 13.5, fontWeight: 700, color: '#F26B2C', cursor: 'pointer',
        }}>
          {firstTime ? 'I have been here before' : 'This is my first time'}
        </button>

        <p style={{ textAlign: 'center', margin: '18px 0 0', fontSize: 12.5, color: '#8C857B' }}>
          Are you a grown-up? <Link href="/auth" style={{ color: '#F26B2C', fontWeight: 700 }}>Sign in here</Link>
        </p>
      </div>
    </main>
  )
}
