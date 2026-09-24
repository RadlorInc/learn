'use client'
/**
 * Document 03's "Withdraw permission for all your children" confirm screen, verbatim. One component for
 * both doors: Account settings (`withdraw_my_consent`) and B3's link on an account consent (`consent_withdraw`).
 */
import { useState, type CSSProperties } from 'react'
import { WITHDRAW, WITHDRAW_ALL, PROPOSED, type Lang, type L } from './copy'
import { withdrawAllConsent } from '@/data/repositories'
import { Md } from './Md'
import { S } from './Notice'

export function WithdrawAll({ lang, busy, onConfirm, onKeep }: { lang: Lang; busy?: boolean; onConfirm: () => void; onKeep: () => void }) {
  const t = (x: L) => x[lang]
  return (
    <div data-consent="withdraw-all">
      <h2 style={{ ...S.h3, fontSize: 22, lineHeight: 1.3 }}>{t(WITHDRAW_ALL.heading)}</h2>
      <p style={S.p}><Md s={t(WITHDRAW_ALL.body0)} /></p>
      <p style={S.p}><Md s={t(WITHDRAW_ALL.body1)} /></p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
        <button type="button" disabled={busy} onClick={onConfirm} style={S.danger}>{t(WITHDRAW_ALL.confirm)}</button>
        <button type="button" disabled={busy} onClick={onKeep} style={{ ...S.ghost, width: '100%' }}>{t(WITHDRAW.keep)}</button>
      </div>
    </div>
  )
}

/**
 * The Account view's own card for it (founder, 2026-09-24, prod check 2.8): it used to sit at the top of
 * /parent/account, and a parent who withdrew went on, still on that page, to close the whole account by
 * mistake. So it lives beside "Close your account", NOT on its page, looks nothing like it (no red until the
 * confirm itself), and on success `onDone` takes the parent back to the dashboard — never to the close page.
 */
export function WithdrawAllCard({ lang, style, onDone }: { lang: Lang; style: CSSProperties; onDone: () => void }) {
  const [st, setSt] = useState<'idle' | 'confirm' | 'busy' | 'error'>('idle')
  async function go() {
    setSt('busy')
    const r = await withdrawAllConsent()
    if (!r.ok) { setSt('error'); return }
    onDone()
  }
  return (
    <section style={style} data-tour="withdraw-all-card">
      {st === 'confirm' || st === 'busy'
        ? <WithdrawAll lang={lang} busy={st === 'busy'} onConfirm={go} onKeep={() => setSt('idle')} />
        : <>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>{WITHDRAW_ALL.heading[lang]}</h2>
            <p style={{ margin: '6px 0 12px', color: 'var(--ink-soft)' }}><Md s={WITHDRAW_ALL.body1[lang]} /></p>
            {st === 'error' && <p role="alert" style={{ margin: '0 0 12px', color: '#B42318', fontWeight: 700 }}>{PROPOSED.error[lang]}</p>}
            <button type="button" onClick={() => setSt('confirm')} style={S.ghost}>{WITHDRAW_ALL.heading[lang]}</button>
          </>}
    </section>
  )
}
