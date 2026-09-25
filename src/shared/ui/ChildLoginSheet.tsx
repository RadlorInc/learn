'use client'
/**
 * The adult who created a learner (parent or teacher) sets that child's username and password, changes them, or removes
 * the login. The server half, and every rule about who may, is /api/child-login.
 *
 * ⚠️ The password field is plain text on purpose: the adult is making it up FOR a child and has to read it back to them
 * or write it down. It is never stored or shown again — only the username is.
 */
import { useState, type CSSProperties } from 'react'
import { CHILD_MIN_PASSWORD, normalizeUsername } from '@/core/childLogin'
import { setChildLogin, removeChildLogin, type ChildLoginError } from '@/data/repositories'
import { useT } from '@/features/dashboard/i18n'

// Keys into the dashboard's dictionary (features/dashboard/i18n), so a Spanish-speaking parent reads them in Spanish.
const SAYS: Record<ChildLoginError, string> = {
  bad_username:    'Use 3–20 letters or numbers (a dot or _ is fine), starting with a letter or number.',
  weak_password:   'Make the password at least {n} characters.',
  password_rejected: 'This password is too easy to guess. Choose a different one: longer, and not a common one like 123456.',
  username_taken:  'That username is already taken. Try adding a number.',
  not_owner:       'Only the adult who added this learner can set their login.',
  not_configured:  'Child logins are not switched on yet on this server.',
  rate_limited:    'Too many tries. Wait a minute and try again.',
  unauthenticated: 'Your sign-in has expired. Sign in again, then try this.',
  failed:          'Could not save. Check your connection and try again.',
}

export function ChildLoginSheet({ learnerId, name, current, onClose, onChanged }: {
  learnerId: string; name: string; current: string | null
  onClose: () => void; onChanged: (username: string | null) => void
}) {
  const t = useT()
  const say = (e: ChildLoginError) => t(SAYS[e], { n: CHILD_MIN_PASSWORD })
  const [username, setUsername] = useState(current ?? '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function save() {
    setError(null)
    const u = normalizeUsername(username)
    if (!u) { setError(say('bad_username')); return }
    if (password.length < CHILD_MIN_PASSWORD) { setError(say('weak_password')); return }
    setBusy(true)
    const r = await setChildLogin(learnerId, u, password)
    setBusy(false)
    if (!r.ok) { setError(say(r.error)); return }
    onChanged(u)
    setDone(t('{name} can now sign in with username “{u}” and the password you just set.', { name, u }))
  }

  async function remove() {
    if (!confirm(t('Remove {name}’s login? They will not be able to sign in as themselves until you set a new one.', { name }))) return
    setBusy(true); setError(null)
    const r = await removeChildLogin(learnerId)
    setBusy(false)
    if (!r.ok) { setError(say(r.error)); return }
    onChanged(null)
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={t('{name}’s login', { name })} onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--paper-soft)', borderRadius: 20, padding: 22, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--ink)' }}>🔑 {t('{name}’s login', { name })}</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
          {current ? t('Username now: “{u}”. Enter a new password (and a new username if you want) to change it.', { u: current })
            : t('Give {name} a username and password so they can sign in on any device and go straight to their lessons.', { name })}
        </p>
        {done ? <>
          <div role="status" style={{ background: '#F2FAEC', border: '1.5px solid #BFE3A6', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#33610F', fontWeight: 700 }}>✅ {done}</div>
          <button type="button" onClick={onClose} style={btn}>{t('Done')}</button>
        </> : <>
          <label style={label}>{t('Username')}
            <input value={username} onChange={e => { setUsername(e.target.value); setError(null) }} autoCapitalize="none" spellCheck={false} autoComplete="off" placeholder={t('e.g. aarav7')} style={field} />
          </label>
          <label style={label}>{current ? t('New password') : t('Password')}
            <input value={password} onChange={e => { setPassword(e.target.value); setError(null) }} autoComplete="off" spellCheck={false} placeholder={t('At least {n} characters', { n: CHILD_MIN_PASSWORD })} style={field} />
          </label>
          {error && <div role="alert" style={{ fontSize: 14, fontWeight: 700, color: '#B42318' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" disabled={busy} onClick={save} style={btn}>{busy ? t('Saving…') : current ? t('Save changes') : t('Create login')}</button>
            <button type="button" disabled={busy} onClick={onClose} style={ghost}>{t('Cancel')}</button>
            {current && <button type="button" disabled={busy} onClick={remove} style={{ ...ghost, color: '#B42318' }}>{t('Remove login')}</button>}
          </div>
        </>}
      </div>
    </div>
  )
}

const label: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }
const field: CSSProperties = { padding: '12px 14px', fontSize: 15, minHeight: 44, border: '2px solid var(--card-border)', borderRadius: 12, boxSizing: 'border-box', color: 'var(--ink)', background: '#fff', fontWeight: 500 }
const btn: CSSProperties = { background: 'var(--accent-fill)', color: 'var(--on-accent-fill)', border: 'none', borderRadius: 12, padding: '10px 16px', minHeight: 44, fontSize: 15, fontWeight: 800, cursor: 'pointer' }
const ghost: CSSProperties = { ...btn, background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--card-border)' }

/**
 * Every child this adult created, each with its login status and a button to set or change it — so a parent or teacher
 * can give all of them passwords in one place. `logins` null = the lookup failed; the buttons still work.
 */
export function ChildLoginsList({ learners, logins, onLogins, title, blurb }: {
  learners: { id: string; name: string }[]
  logins: Record<string, string> | null
  onLogins: (next: Record<string, string>) => void
  title: string; blurb: string
}) {
  const [open, setOpen] = useState<{ id: string; name: string } | null>(null)
  if (learners.length === 0) return null
  return (
    <section style={{ background: 'var(--paper-soft)', border: '1.5px solid var(--card-border)', borderRadius: 16, padding: 16, margin: '0 0 24px' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{title}</h3>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.4 }}>{blurb}</p>
      <div className="card-grid">
        {learners.map(l => (
          <div key={l.id} style={{ background: '#fff', border: '1.5px solid var(--card-border)', borderRadius: 14, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{l.name}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{logins === null ? 'Login status unknown' : logins[l.id] ? `Username: ${logins[l.id]}` : 'No login yet'}</div>
            </div>
            <button type="button" onClick={() => setOpen(l)} style={{ ...btn, flexShrink: 0, fontSize: 13, padding: '9px 12px' }}>
              🔑 {logins?.[l.id] ? 'Change' : 'Set password'}
            </button>
          </div>
        ))}
      </div>
      {open && (
        <ChildLoginSheet learnerId={open.id} name={open.name} current={logins?.[open.id] ?? null} onClose={() => setOpen(null)}
          onChanged={u => { const n = { ...(logins ?? {}) }; if (u) n[open.id] = u; else delete n[open.id]; onLogins(n) }} />
      )}
    </section>
  )
}
