'use client'

/**
 * A child's first sign-in with the TEMPORARY password their teacher printed (a class list, 2026-09-18): they choose
 * their own before seeing their lessons. `enterAsChild` and /modules send them here while the flag is set; setting
 * the new password clears it (`setOwnPassword`), and they go on to /modules.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession, mustChangePassword, setOwnPassword } from '@/data/auth'
import { CHILD_MIN_PASSWORD, usernameFromEmail } from '@/core/childLogin'

const C = { page: 'var(--paper)', card: 'var(--paper-soft)', edge: 'var(--card-border)', ink: 'var(--ink)', ink2: 'var(--ink-soft)', accent: 'var(--milo-orange)' } as const
const field: React.CSSProperties = { padding: '12px 14px', fontSize: 16, minHeight: 44, border: `2px solid ${C.edge}`, borderRadius: 12, background: '#fff', color: C.ink, outline: 'none', width: '100%', boxSizing: 'border-box' }

export default function NewPasswordPage() {
  const router = useRouter()
  const [who, setWho] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession()
      if (!session) { router.replace('/auth'); return }
      if (!(await mustChangePassword())) { router.replace('/modules'); return }   // nothing to change
      setWho(usernameFromEmail(session.user.email) ?? session.user.email ?? '')
    })().catch(() => setError("Couldn't connect — check your connection and try again"))
  }, [router])

  async function submit() {
    if (password.length < CHILD_MIN_PASSWORD) { setError(`Use at least ${CHILD_MIN_PASSWORD} letters or numbers`); return }
    if (password !== confirm) { setError('The two passwords are different — type it again'); return }
    setSaving(true); setError(null)
    try {
      const { error } = await setOwnPassword(password)
      if (error) {
        setError(/different from the old/i.test(error.message) ? 'Pick a new password, not the one your teacher gave you' : error.message)
        setSaving(false); return
      }
      router.replace('/modules')
    } catch {
      setError("Couldn't connect — check your connection and try again"); setSaving(false)
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: C.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 400, background: C.card, border: `1.5px solid ${C.edge}`, borderRadius: 20, padding: '28px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 44, textAlign: 'center' }}>🔑</div>
        <h1 style={{ margin: 0, textAlign: 'center', fontSize: 24, fontWeight: 900, color: C.ink, fontFamily: 'var(--font-display)' }}>Make your own password</h1>
        <p style={{ margin: 0, textAlign: 'center', fontSize: 15, color: C.ink2, lineHeight: 1.45 }}>
          Your teacher gave you a password to start. Now pick one only you know{who ? <>, for <strong style={{ color: C.ink }}>{who}</strong></> : null}.
        </p>
        {error && <div role="alert" style={{ background: '#FFF1F0', border: '1.5px solid #F0B4AE', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#93000A', fontWeight: 600 }}>{error}</div>}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 700, color: C.ink2 }}>
          New password
          <input type="password" autoComplete="new-password" value={password} placeholder={`At least ${CHILD_MIN_PASSWORD} letters or numbers`}
            onChange={e => { setPassword(e.target.value); setError(null) }} style={field} disabled={saving || who === null} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 700, color: C.ink2 }}>
          Type it again
          <input type="password" autoComplete="new-password" value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(null) }} onKeyDown={e => e.key === 'Enter' && submit()} style={field} disabled={saving || who === null} />
        </label>
        <button onClick={submit} disabled={saving || who === null}
          style={{ minHeight: 48, borderRadius: 50, border: 'none', background: 'var(--accent-fill)', color: 'var(--on-accent-fill)', fontSize: 17, fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save and start'}
        </button>
      </div>
    </main>
  )
}
