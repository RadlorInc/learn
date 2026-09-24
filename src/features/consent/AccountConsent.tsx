'use client'
/**
 * The account consent on screen: the notice (or the re-ask) → B1 → "Waiting for your permission".
 * Shared by the dashboard (C2, where a signup tick sends B1 by itself) and "+ Add a child" (C3, where
 * anything short of a granted, current consent shows this instead of the sheet).
 *
 *   granted & current      → the caller's `granted` render (the add sheet), or nothing on the dashboard
 *   pending, link working  → WAITING, with "Send the email again"
 *   granted, not current   → REASK + the notice → a new account request
 *   none, never asked      → with a signup tick for the CURRENT notice and `auto`: B1 at once;
 *   none, after a withdrawal / decline / expiry → the notice only (never an automatic email)
 *                            otherwise the notice, and B1 only after "I'm the parent… — continue"
 */
import { useEffect, useState } from 'react'
import { PROPOSED, REASK, WAITING, NOTICE, type Lang, type L } from './copy'
import { readAccountConsent, requestAccountConsent, daysLeft, type AccountConsent } from './consentState'
import { Notice, S } from './Notice'
import { Md } from './Md'

export type Granted = Extract<AccountConsent, { k: 'granted' }>
export type View =
  | { k: 'loading' } | { k: 'notice' } | { k: 'reask' } | { k: 'sending'; reask?: boolean }
  | { k: 'waiting'; email: string; days: number } | { k: 'error'; stale?: boolean } | Granted

export function useAccountConsent({ lang }: { lang: Lang }) {
  const [view, setView] = useState<View>({ k: 'loading' })

  async function ask(reask?: boolean) {
    setView({ k: 'sending', reask })
    const r = await requestAccountConsent(lang)
    setView(r.ok ? { k: 'waiting', email: r.email, days: r.days } : { k: 'error', stale: r.error === 'stale' })
  }

  useEffect(() => {
    let live = true
    void readAccountConsent().then(s => {
      if (!live) return
      if (s.k === 'granted') return setView(s)
      if (s.k === 'pending') return setView({ k: 'waiting', email: s.email, days: daysLeft(s.until) })
      if (s.k === 'reask') return setView({ k: 'reask' })
      if (s.k === 'error') return setView({ k: 'error' })
      setView({ k: 'notice' })
    })
    return () => { live = false }
  }, [])

  return { view, ask: () => ask(view.k === 'reask') }
}

/** Every non-granted state as one block of content. Pure: the preview route renders it with made-up states. */
export function ConsentPanel({ lang, view, onAsk, onClose }: { lang: Lang; view: View; onAsk: () => void; onClose?: () => void }) {
  const t = (x: L) => x[lang]
  if (view.k === 'loading') return <p style={S.p}>…</p>
  if (view.k === 'granted') return null
  if (view.k === 'notice' || view.k === 'reask' || view.k === 'sending') {
    const reask = view.k === 'reask' || (view.k === 'sending' && view.reask)
    return (
      <div data-consent={reask ? 'reask' : 'account-notice'}>
        {reask && (
          <div style={{ marginBottom: 18 }}>
            <h3 style={S.h3}>{t(REASK.heading)}</h3>
            <p style={S.p}>{t(REASK.body)}</p>
          </div>
        )}
        <Notice lang={lang} busy={view.k === 'sending'} onContinue={onAsk} onClose={onClose} />
      </div>
    )
  }
  if (view.k === 'waiting') return (
    <div data-consent="waiting">
      <h3 style={S.h3}>{t(WAITING.heading)}</h3>
      <p style={S.p}><Md s={t(WAITING.body).replace('{email}', view.email).replace('{days}', String(view.days))} /></p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        <button type="button" onClick={onAsk} style={S.ghost}>{t(WAITING.resend)}</button>
        {onClose && <button type="button" onClick={onClose} style={S.ghost}>{t(NOTICE.tertiary)}</button>}
      </div>
    </div>
  )
  return (
    <div data-consent="error">
      <p role="alert" style={{ ...S.p, color: '#93000A', fontWeight: 700 }}>{t(view.stale ? PROPOSED.stale : PROPOSED.error)}</p>
      {onClose && <button type="button" onClick={onClose} style={S.ghost}>{t(NOTICE.tertiary)}</button>}
    </div>
  )
}

/** The dashboard's card: C2. Renders nothing once the account consent is granted and current. */
export function AccountConsentCard({ lang }: { lang: Lang }) {
  const { view, ask } = useAccountConsent({ lang })
  const [hidden, setHidden] = useState(false)
  if (hidden || view.k === 'granted' || view.k === 'loading') return null
  return (
    <section data-t="account-consent" style={{ background: 'var(--paper-soft)', border: '2px solid var(--card-border)', borderRadius: 20, padding: '22px 20px', marginBottom: 20 }}>
      <ConsentPanel lang={lang} view={view} onAsk={ask} onClose={() => setHidden(true)} />
    </section>
  )
}
