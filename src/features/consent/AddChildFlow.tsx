'use client'
/**
 * What "+ Add a child" opens (consent-once, C3).
 *
 *   the account consent is granted and current → the add-a-child sheet, with the attestation
 *   anything else                               → the account consent panel (notice / waiting / re-ask)
 *
 * ⚠️ THERE IS NO OTHER PATH. The per-child consent flow is gone (the database refuses a child under a
 * per-child consent), and so is the "consent table missing → old sheet" fallback: the table exists on
 * every database this client can meet, and a branch that opens the sheet without consent is a way
 * round the gate waiting for somebody to revive it.
 */
import type { ReactNode } from 'react'
import { NOTICE, type Lang, type L } from './copy'
import { ConsentPanel, useAccountConsent, type Granted } from './AccountConsent'
import { P } from './Notice'

export type Attest = Omit<Granted, 'k'>

export function AddChildFlow({ lang, onClose, renderAdd }: {
  lang: Lang; onClose: () => void; renderAdd: (attest: Attest) => ReactNode
}) {
  const { view, ask } = useAccountConsent({ lang })
  const t = (x: L) => x[lang]
  if (view.k === 'granted') return <>{renderAdd({ id: view.id, noticeVersion: view.noticeVersion, confirmedAt: view.confirmedAt })}</>

  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={t(NOTICE.title)}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(61,37,22,0.45)' }} onClick={onClose}>
      <div className="sheet-card" style={{ background: P.card, padding: '28px 24px 40px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', boxSizing: 'border-box' }}
        onClick={e => e.stopPropagation()}>
        <ConsentPanel lang={lang} view={view} onAsk={ask} onClose={onClose} />
      </div>
    </div>
  )
}
