'use client'
/**
 * Ask maths on a child's page (docs/product/ask-maths.md): the add-on for the family, the switch for this child (after
 * the disclosure, features/askMaths/disclosure.ts), the daily limit, and the questions of the last 30 days, each
 * answered one with its lesson to watch again. Only the adult who added the child changes anything — the database
 * checks (set_ask_maths, ask_maths_forget); anyone with access sees the questions.
 */
import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { addonActive, cancelAddon, forgetAskQuestions, getAddon, getAskQuestions, getAskSettings, setAskMaths, startAddonCheckout,
  type Addon, type AskQuestion, type AskSettings } from '@/data/repositories/askMaths'
import { DISCLOSURE, DISCLOSURE_VERSION } from '@/features/askMaths/disclosure'
import { AskPlayer } from '@/features/askMaths/AskPlayer'
import { ASK_MATHS_MONTHLY_CENTS } from '@/core/billing'
import { dbtn, dghost, dcard } from './Helpers'
import { useLang, useT } from './i18n'

const h2: CSSProperties = { margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--ink)' }
const soft: CSSProperties = { margin: 0, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.45 }
const LIMITS = [1, 3, 5, 10, 20]
const OUTCOME: Record<string, string> = {
  answered: 'Answered', not_maths: 'Not a maths question', personal: 'Had personal details: not kept', unsafe: 'Not answered: not a safe question',
  failed: 'Did not finish', pending: 'Being drawn',
}
const fill = (s: string, name: string) => s.replace(/\{name\}/g, name)

export function AskMathsCard({ id, name, band, owner }: { id: string; name: string; band: string; owner: boolean }) {
  const t = useT(), lang = useLang()
  const [settings, setSettings] = useState<AskSettings | null | undefined>(undefined)
  const [addon, setAddon] = useState<Addon | null | undefined>(undefined)
  const [questions, setQuestions] = useState<AskQuestion[] | null | undefined>(undefined)
  const [agree, setAgree] = useState(false)
  const [renew, setRenew] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [watch, setWatch] = useState<AskQuestion | null>(null)

  const [tick, setTick] = useState(0)                    // bumped after every change: read everything again
  const load = useCallback(async () => setTick(n => n + 1), [])
  useEffect(() => {
    let live = true
    Promise.all([getAskSettings(id), getAddon(), getAskQuestions(id)]).then(([s, a, q]) => {
      if (live) { setSettings(s); setAddon(a); setQuestions(q) }
    })
    return () => { live = false }
  }, [id, tick])

  if (band !== '9-11' && band !== '12-14') return <div style={{ ...dcard, maxWidth: 720 }}><h2 style={h2}>✏️ {t('Ask maths')}</h2>
    <p style={{ ...soft, marginTop: 8 }}>{t('Ask maths is for Grades 3–8.')}</p></div>

  const on = !!settings?.enabled, limit = settings?.daily_limit ?? 5, paid = addonActive(addon)
  const d = DISCLOSURE[lang]
  async function save(enabled: boolean, dailyLimit: number) {
    setBusy(true); setMsg('')
    const r = await setAskMaths(id, enabled, dailyLimit, enabled ? DISCLOSURE_VERSION : null)
    setBusy(false)
    if (!r.ok) setMsg(r.error === 'forbidden' ? t('Only the adult who added {name} can change it.', { name }) : t('Could not save. Check your connection and try again.'))
    else { setAgree(false); await load() }
  }
  async function buy() {
    setBusy(true); setMsg('')
    const r = await startAddonCheckout(renew)
    setBusy(false)
    if (r.ok && r.url) location.assign(r.url)
    else setMsg(t('Could not open the payment page. Try again.'))
  }
  async function stop() {
    setBusy(true); setMsg('')
    const r = await cancelAddon()
    setBusy(false)
    setMsg(r.ok ? t('Ask maths will stop at the end of the month you have paid for.') : t('Could not change it. Try again.'))
    await load()
  }
  async function forget() {
    setBusy(true); setMsg('')
    const n = await forgetAskQuestions(id)
    setBusy(false)
    setMsg(n === null ? t('Could not delete them. Try again.') : t('Deleted {n} questions.', { n }))
    setWatch(null); await load()
  }
  const price = `$${(ASK_MATHS_MONTHLY_CENTS / 100).toFixed(2)}`
  const day = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(lang === 'es' ? 'es' : 'en', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
      <section style={dcard} data-tour="ask-card">
        <h2 style={{ ...h2, marginBottom: 8 }}>✏️ {t('Ask maths')}</h2>
        <p style={soft}>{t('{name} types a maths question and watches a whiteboard lesson drawn and spoken for it.', { name })}</p>

        {addon === undefined || settings === undefined ? <p style={{ ...soft, marginTop: 10 }}>{t('Loading…')}</p>
          : !paid ? (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={soft}>{t('Ask maths is an add-on for your whole family: {price} a month.', { price })}</p>
              {owner ? <>
                <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, color: 'var(--ink)' }}>
                  <input type="checkbox" checked={renew} onChange={e => setRenew(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18 }} />
                  {t('I agree that Ask maths renews every month at {price} until I cancel. I can cancel here at any time.', { price })}
                </label>
                <button type="button" style={dbtn} disabled={busy || !renew} onClick={buy}>{t('Add Ask maths')}</button>
              </> : <p style={soft}>{t('Only the adult who added {name} can change it.', { name })}</p>}
            </div>
          ) : (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={soft}>{addon!.cancel_at_period_end ? t('Your Ask maths add-on ends on {day}.', { day: day(addon!.current_period_end) })
                : t('Your Ask maths add-on renews on {day}.', { day: day(addon!.current_period_end) })}</p>
              {!owner ? <p style={soft}>{on ? t('Ask maths is on for {name}.', { name }) : t('Ask maths is off for {name}.', { name })} {t('Only the adult who added {name} can change it.', { name })}</p>
                : on ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{t('Ask maths is on for {name}.', { name })}</span>
                    <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t('Questions a day')}
                      <select disabled={busy} value={limit} onChange={e => save(true, Number(e.target.value))}
                        style={{ minHeight: 44, borderRadius: 10, border: '1.5px solid var(--card-border)', padding: '0 10px', fontSize: 14, fontWeight: 700 }}>
                        {[...new Set([...LIMITS, limit])].sort((a, b) => a - b).map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                    <button type="button" style={dghost} disabled={busy} onClick={() => save(false, limit)}>{t('Turn off')}</button>
                  </div>
                ) : (
                  <div style={{ background: 'var(--paper)', border: '1.5px solid var(--card-border)', borderRadius: 14, padding: 14 }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--ink)' }}>{fill(d.title, name)}</h3>
                    <ul style={{ margin: '0 0 10px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {d.points.map(p => <li key={p} style={soft}>{fill(p, name)}</li>)}
                    </ul>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
                      <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18 }} />
                      {fill(d.agree, name)}
                    </label>
                    <button type="button" style={dbtn} disabled={busy || !agree} onClick={() => save(true, limit)}>{d.button}</button>
                  </div>
                )}
              {owner && !addon!.cancel_at_period_end && <button type="button" style={{ ...dghost, alignSelf: 'flex-start' }} disabled={busy} onClick={stop}>{t('Stop the add-on')}</button>}
            </div>
          )}
        {msg && <p role="status" style={{ ...soft, marginTop: 10, fontWeight: 700 }}>{msg}</p>}
      </section>

      <section style={dcard}>
        <h2 style={{ ...h2, marginBottom: 8 }}>{t('What {name} asked', { name })}</h2>
        <p style={{ ...soft, marginBottom: 10 }}>{t('Questions are deleted after 30 days.')}</p>
        {questions === undefined ? <p style={soft}>{t('Loading…')}</p>
          : questions === null ? <p style={soft}>{t('Could not load the questions. Refresh to try again.')}</p>
          : questions.length === 0 ? <p style={soft}>{t('No questions yet.')}</p>
          : <>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {questions.map(q => (
                <li key={q.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid var(--card-border)', paddingBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 700, minWidth: 90 }}>{day(q.asked_at)}</span>
                  <span style={{ flex: 1, minWidth: 180, color: 'var(--ink)', fontWeight: 700 }}>{q.question ?? '—'}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{t(OUTCOME[q.outcome] ?? q.outcome)}</span>
                  {q.outcome === 'answered' && q.script ? <button type="button" style={dghost} onClick={() => setWatch(watch?.id === q.id ? null : q)}>{watch?.id === q.id ? t('Close') : t('Watch')}</button> : null}
                </li>
              ))}
            </ul>
            {watch && <div style={{ marginTop: 12 }}><AskPlayer key={watch.id} script={watch.script as { els: unknown; steps: { say: string }[] }} /></div>}
            {owner && <button type="button" style={{ ...dghost, marginTop: 12 }} disabled={busy} onClick={forget}>{t('Delete all of {name}’s questions now', { name })}</button>}
          </>}
      </section>
    </div>
  )
}
