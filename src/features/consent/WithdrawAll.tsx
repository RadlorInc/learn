'use client'
/**
 * Document 03's "Withdraw permission for all your children" confirm screen, verbatim. One component for
 * both doors: Account settings (`withdraw_my_consent`) and B3's link on an account consent (`consent_withdraw`).
 */
import { WITHDRAW, WITHDRAW_ALL, type Lang, type L } from './copy'
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
