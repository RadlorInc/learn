'use client'
/**
 * Consent-once, C2: what `/auth` shows ABOVE the signup controls. Document 03's signup screen: a heading,
 * a summary, a link to the Privacy Policy, an UNTICKED box, and what happens next. The page keeps both
 * signup buttons disabled until the box is ticked — by a parent or a teacher alike (since 2026-09-25).
 */
import { SIGNUP, type Lang, type L } from './copy'
import { P, S } from './Notice'

export function SignupConsent({ lang, ticked, onTick }: {
  lang: Lang; ticked: boolean; onTick: (on: boolean) => void
}) {
  const t = (x: L) => x[lang]
  return (
    <div data-consent="signup" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: P.ink, lineHeight: 1.35 }}>{t(SIGNUP.heading)}</h2>
      <p style={{ ...S.p, fontSize: 13.5, margin: 0 }}>{t(SIGNUP.summary)}</p>
      <a href="/legal/privacy" target="_blank" rel="noopener"
        style={{ alignSelf: 'flex-start', padding: '12px 0', margin: '-6px 0', minHeight: 44, boxSizing: 'border-box', color: P.accent, fontWeight: 700, fontSize: 13.5, textDecoration: 'underline' }}>
        {t(SIGNUP.readFull)}
      </a>
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.45, color: P.ink, fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}>
        <input type="checkbox" checked={ticked} onChange={e => onTick(e.target.checked)}
          style={{ width: 22, height: 22, flex: '0 0 auto', marginTop: 1, accentColor: '#F26B2C' }} />
        <span>{t(SIGNUP.tick)}</span>
      </label>
    </div>
  )
}
