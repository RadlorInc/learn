'use client'
/**
 * The parent PIN, asked before a change that matters: game time, Ask Radlor, a login, sharing, deleting (founder, 6–8 Nov 2026). The rest of the dashboard
 * opens without it; until then every /parent screen sat behind it (2026-09-17).
 *
 * ⚠️ A SCREEN GATE, NOT A DATA BOUNDARY (see the migration's threat model). It checks nothing itself: the server holds
 * the PIN and counts wrong tries.
 *
 * Passes straight through when: nobody is signed in; the account is a child's own login (the database refuses their
 * change anyway); or the PIN functions are not in the database yet, so a deploy that lands before its migration
 * cannot stop every parent changing a setting.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { getCurrentSession } from '@/data/auth'
import { getMyRole, getPinStatus, verifyPin, setPin, requestPinReset, type ErrorKind } from '@/data/repositories'
import { errorWording } from '@/shared/ui/errorWording'

type Stage = 'loading' | 'open' | 'enter' | 'create' | 'error'

const time = (iso?: string | null) => iso ? new Date(iso).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : ''

/** After a right PIN, further changes on the same card within this time do not ask again (a limit, then a switch). */
export const PIN_STAYS_OPEN_MS = 5 * 60_000

/** `confirm(change)` runs the change once the PIN is right; render `dialog` beside the controls. A new card asks again. */
export function usePinConfirm() {
  const [pending, setPending] = useState<(() => void) | null>(null)
  const openUntil = useRef(0)
  const confirm = (change: () => void) => {
    if (Date.now() < openUntil.current) change()
    else setPending(() => change)
  }
  const dialog = pending && <ParentPinGate onCancel={() => setPending(null)} onOpen={() => {
    openUntil.current = Date.now() + PIN_STAYS_OPEN_MS
    setPending(null); pending()
  }} />
  return { confirm, dialog }
}

/** `preview` shows a stage without asking the server — for /ui-preview only; submitting does nothing useful there. */
export function ParentPinGate({ children, preview, onOpen, onCancel }: { children?: ReactNode; preview?: 'enter' | 'create'; onOpen?: () => void; onCancel?: () => void }) {
  const [stage, setStage] = useState<Stage>(preview ?? 'loading')
  const [pin, setPinText] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failKind, setFailKind] = useState<ErrorKind>('other')
  // Same PIN for both adult roles; only the words follow the role — a teacher is not a "parent" (2026-09-18).
  const [teacher, setTeacher] = useState(false)

  async function load() {
    setStage('loading'); setMsg(null)
    if (!(await getCurrentSession())) { setStage('open'); return }
    // A failed read is not "an adult with no role" (BUG-07): show the gate's own could-not-open screen.
    let role
    try { role = await getMyRole() } catch { setStage('error'); return }
    if (role === 'learner') { setStage('open'); return }
    setTeacher(role === 'teacher')
    const s = await getPinStatus()
    if (s.state === 'unavailable') setStage('open')
    else if (s.state === 'error') { setFailKind(s.kind); setStage('error') }
    else if (s.state === 'none') setStage('create')
    else {
      setStage('enter')
      if (s.locked_until) setMsg(`Too many wrong tries. Try again after ${time(s.locked_until)}.`)
      if (s.reset_at) setNote(`A PIN reset was requested. Your PIN will be removed ${time(s.reset_at)}. Entering your PIN cancels it.`)
    }
  }
  useEffect(() => { if (!preview) load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (stage === 'open') onOpen?.() }, [stage]) // eslint-disable-line react-hooks/exhaustive-deps

  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 4)

  async function submit() {
    setMsg(null)
    if (pin.length !== 4) { setMsg('Enter 4 digits.'); return }
    if (stage === 'create' && confirm !== pin) { setMsg('The two PINs do not match.'); return }
    setBusy(true)
    const r = stage === 'create' ? await setPin(pin) : await verifyPin(pin)
    setBusy(false)
    if (r.ok) {
      if ('reset_cancelled' in r && r.reset_cancelled) window.alert('Someone asked to reset your PIN. Entering your PIN cancelled that.')
      setStage('open'); return
    }
    setPinText(''); setConfirm('')
    if (r.error === 'locked') setMsg(`Too many wrong tries. Try again after ${time(r.locked_until)}.`)
    else if (r.error === 'wrong') setMsg(`Wrong PIN. ${r.tries_left} ${r.tries_left === 1 ? 'try' : 'tries'} left before it locks.`)
    else if (r.error === 'no_pin') await load()
    else setMsg(errorWording(r.kind ?? 'other', 'Could not check the PIN. Check your connection and try again.'))
  }

  async function forgot() {
    if (!window.confirm('Reset your PIN? For safety it is removed 24 hours from now, and entering your PIN before then cancels the reset. After that you can set a new one. We will email you that a reset was asked for.')) return
    setBusy(true)
    const r = await requestPinReset()
    setBusy(false)
    setNote(r.ok ? `Your PIN will be removed ${time(r.reset_at)}. Then you can set a new one.` : 'Could not request a reset. Try again.')
  }

  if (stage === 'open') return <>{children}</>
  if (stage === 'loading') return <div style={page} aria-busy="true" />

  return (
    <div style={page}>
      <div role="dialog" aria-modal="true" aria-labelledby="pin-title" style={card}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <h1 id="pin-title" style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          {stage === 'create' ? `Set a ${teacher ? 'teacher' : 'parent'} PIN` : stage === 'error' ? 'Could not check the PIN' : `Enter your ${teacher ? 'teacher' : 'parent'} PIN`}
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
          {stage === 'create' ? `Choose 4 digits. We ask for it before changes that matter, like game time, Ask Radlor, a login, sharing a child or deleting a profile, so a ${teacher ? 'student' : 'child'} on this device cannot make them.`
            : stage === 'error' ? errorWording(failKind, 'Check your connection and try again.')
            : 'Only a grown-up can change this setting.'}
        </p>

        {stage === 'error' ? <button type="button" onClick={load} style={btn}>Try again</button> : <>
          <input aria-label={stage === 'create' ? 'New PIN' : 'PIN'} value={pin} onChange={e => { setPinText(digits(e.target.value)); setMsg(null) }}
            onKeyDown={e => e.key === 'Enter' && submit()} type="password" inputMode="numeric" autoComplete="off" maxLength={4} autoFocus
            placeholder="••••" style={field} />
          {stage === 'create' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>Type it again
              <input value={confirm} onChange={e => { setConfirm(digits(e.target.value)); setMsg(null) }}
                onKeyDown={e => e.key === 'Enter' && submit()} type="password" inputMode="numeric" autoComplete="off" maxLength={4}
                placeholder="••••" style={field} />
            </label>
          )}
          {msg && <div role="alert" style={{ fontSize: 14, fontWeight: 700, color: '#B42318' }}>{msg}</div>}
          {note && <div role="status" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{note}</div>}
          <button type="button" disabled={busy} onClick={submit} style={btn}>{busy ? 'Checking…' : stage === 'create' ? 'Save PIN' : 'Confirm'}</button>
          {stage === 'enter' && <button type="button" disabled={busy} onClick={forgot} style={link}>Forgot PIN?</button>}
        </>}
        <Link href="/rights" style={{ ...link, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Need help, or want to withdraw permission or download your data?</Link>
        <button type="button" onClick={onCancel} style={link}>Cancel</button>
      </div>
    </div>
  )
}

const page: CSSProperties = { position: 'fixed', inset: 0, zIndex: 1000, overflowY: 'auto', background: 'rgb(8 61 133 / 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'var(--font-body)' }
const card: CSSProperties = { background: 'var(--paper-soft)', border: '1.5px solid var(--card-border)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }
const field: CSSProperties = { padding: '12px 14px', fontSize: 28, letterSpacing: 12, textAlign: 'center', minHeight: 56, border: '2px solid var(--card-border)', borderRadius: 12, background: '#fff', color: 'var(--ink)', boxSizing: 'border-box', width: '100%' }
const btn: CSSProperties = { background: 'var(--accent-fill)', color: 'var(--on-accent-fill)', border: 'none', borderRadius: 12, padding: '12px 16px', minHeight: 48, fontSize: 16, fontWeight: 800, cursor: 'pointer' }
const link: CSSProperties = { background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44, textDecoration: 'underline' }
