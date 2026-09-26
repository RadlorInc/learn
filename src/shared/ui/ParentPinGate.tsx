'use client'
/**
 * Asks for the parent PIN before any /parent screen shows (founder, 2026-09-17). It lives in `app/parent/layout.tsx`,
 * so it is asked EVERY TIME the dashboard is opened — moving between /parent pages keeps it open, but leaving (to a
 * child's lessons, say) and coming back unmounts the layout and asks again.
 *
 * ⚠️ A SCREEN GATE, NOT A DATA BOUNDARY (see the migration's threat model). It checks nothing itself: the server holds
 * the PIN and counts wrong tries.
 *
 * Passes straight through when: nobody is signed in (the pages send them to /auth); the account is a child's own
 * login (the dashboard sends them to their lessons); or the PIN functions are not in the database yet, so a deploy
 * that lands before its migration cannot lock every parent out.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession } from '@/data/auth'
import { getMyRole, signOut, getPinStatus, verifyPin, setPin, requestPinReset } from '@/data/repositories'
import { makeT, useSavedLang, LangSwitch, type Lang } from '@/features/dashboard/i18n'

type Stage = 'loading' | 'open' | 'enter' | 'create' | 'error'
const time = (iso: string | null | undefined, lang: Lang) => iso ? new Date(iso).toLocaleString(lang === 'es' ? 'es-US' : [], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : ''
/** A message kept as its English key (+ a time / a count) and translated when SHOWN, so switching language never
 *  leaves one on screen in the other language. */
type Msg = { k: string; at?: string | null; n?: number }

/** `preview` shows a stage without asking the server — for /ui-preview only; submitting does nothing useful there. */
export function ParentPinGate({ children, preview }: { children: ReactNode; preview?: 'enter' | 'create' }) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>(preview ?? 'loading')
  const [pin, setPinText] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<Msg | null>(null)
  const [note, setNote] = useState<Msg | null>(null)
  const [busy, setBusy] = useState(false)
  // Same PIN for both adult roles; only the words follow the role — a teacher is not a "parent" (2026-09-18).
  const [teacher, setTeacher] = useState(false)
  // English or Spanish — the device's saved choice (the sign-in page and the dashboard share it), so a parent who picked
  // Español is not asked again. PARENTS ONLY: a teacher's PIN, like a teacher's dashboard, stays English.
  const saved = useSavedLang()
  const lang: Lang = teacher ? 'en' : saved
  const t = makeT(lang)
  const say = (m: Msg) => t(m.k, { time: time(m.at, lang), n: m.n ?? 0, tries: t(m.n === 1 ? 'try' : 'tries') })

  async function load() {
    setStage('loading'); setMsg(null)
    if (!(await getCurrentSession())) { setStage('open'); return }
    const role = await getMyRole().catch(() => null)
    if (role === 'learner') { setStage('open'); return }
    setTeacher(role === 'teacher')
    const s = await getPinStatus()
    if (s.state === 'unavailable') setStage('open')
    else if (s.state === 'error') setStage('error')
    else if (s.state === 'none') setStage('create')
    else {
      setStage('enter')
      if (s.locked_until) setMsg({ k: 'Too many wrong tries. Try again after {time}.', at: s.locked_until })
      if (s.reset_at) setNote({ k: 'A PIN reset was requested. Your PIN will be removed {time}. Entering your PIN cancels it.', at: s.reset_at })
    }
  }
  useEffect(() => { if (!preview) load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 4)

  async function submit() {
    setMsg(null)
    if (pin.length !== 4) { setMsg({ k: 'Enter 4 digits.' }); return }
    if (stage === 'create' && confirm !== pin) { setMsg({ k: 'The two PINs do not match.' }); return }
    setBusy(true)
    const r = stage === 'create' ? await setPin(pin) : await verifyPin(pin)
    setBusy(false)
    if (r.ok) {
      if ('reset_cancelled' in r && r.reset_cancelled) window.alert(t('Someone asked to reset your PIN. Entering your PIN cancelled that.'))
      setStage('open'); return
    }
    setPinText(''); setConfirm('')
    if (r.error === 'locked') setMsg({ k: 'Too many wrong tries. Try again after {time}.', at: r.locked_until })
    else if (r.error === 'wrong') setMsg({ k: 'Wrong PIN. {n} {tries} left before it locks.', n: r.tries_left })
    else if (r.error === 'no_pin') await load()
    else setMsg({ k: 'Could not check the PIN. Check your connection and try again.' })
  }

  async function forgot() {
    if (!window.confirm(t('Reset your PIN? For safety it is removed 24 hours from now, and entering your PIN before then cancels the reset. After that you can set a new one.'))) return
    setBusy(true)
    const r = await requestPinReset()
    setBusy(false)
    setNote(r.ok ? { k: 'Your PIN will be removed {time}. Then you can set a new one.', at: r.reset_at } : { k: 'Could not request a reset. Try again.' })
  }

  if (stage === 'open') return <>{children}</>
  if (stage === 'loading') return <div style={page} aria-busy="true" />

  return (
    <div style={page}>
      <div role="dialog" aria-labelledby="pin-title" style={card}>
        {!teacher && <LangSwitch lang={lang} style={{ justifyContent: 'center' }} />}
        <div style={{ fontSize: 40 }}>🔒</div>
        <h1 id="pin-title" style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          {stage === 'create' ? (teacher ? 'Set a teacher PIN' : t('Set a parent PIN')) : stage === 'error' ? t('Could not open the dashboard') : (teacher ? 'Enter your teacher PIN' : t('Enter your parent PIN'))}
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
          {stage === 'create' ? (teacher ? 'Choose 4 digits. We ask for it every time this dashboard opens, so a student on this device cannot get in.'
              : t('Choose 4 digits. We ask for it every time this dashboard opens, so a child on this device cannot get in.'))
            : stage === 'error' ? t('Check your connection and try again.')
            : t('This keeps the dashboard for grown-ups only.')}
        </p>

        {stage === 'error' ? <button type="button" onClick={load} style={btn}>{t('Try again')}</button> : <>
          <input aria-label={stage === 'create' ? t('New PIN') : 'PIN'} value={pin} onChange={e => { setPinText(digits(e.target.value)); setMsg(null) }}
            onKeyDown={e => e.key === 'Enter' && submit()} type="password" inputMode="numeric" autoComplete="off" maxLength={4} autoFocus
            placeholder="••••" style={field} />
          {stage === 'create' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>{t('Type it again|pin')}
              <input value={confirm} onChange={e => { setConfirm(digits(e.target.value)); setMsg(null) }}
                onKeyDown={e => e.key === 'Enter' && submit()} type="password" inputMode="numeric" autoComplete="off" maxLength={4}
                placeholder="••••" style={field} />
            </label>
          )}
          {msg && <div role="alert" style={{ fontSize: 14, fontWeight: 700, color: '#B42318' }}>{say(msg)}</div>}
          {note && <div role="status" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{say(note)}</div>}
          <button type="button" disabled={busy} onClick={submit} style={btn}>{busy ? t('Checking…') : stage === 'create' ? t('Save PIN') : t('Open dashboard')}</button>
          {stage === 'enter' && <button type="button" disabled={busy} onClick={forgot} style={link}>{t('Forgot PIN?')}</button>}
        </>}
        <button type="button" onClick={async () => { await signOut(); router.replace('/auth') }} style={link}>{t('Sign out')}</button>
      </div>
    </div>
  )
}

const page: CSSProperties = { minHeight: '100dvh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'var(--font-body)' }
const card: CSSProperties = { background: 'var(--paper-soft)', border: '1.5px solid var(--card-border)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }
const field: CSSProperties = { padding: '12px 14px', fontSize: 28, letterSpacing: 12, textAlign: 'center', minHeight: 56, border: '2px solid var(--card-border)', borderRadius: 12, background: '#fff', color: 'var(--ink)', boxSizing: 'border-box', width: '100%' }
const btn: CSSProperties = { background: 'var(--milo-orange)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 16px', minHeight: 48, fontSize: 16, fontWeight: 800, cursor: 'pointer' }
const link: CSSProperties = { background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44, textDecoration: 'underline' }
