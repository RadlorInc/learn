'use client'
/**
 * Consent-once, C2: what `/auth` shows ABOVE the signup controls. Document 03's signup screen: a heading,
 * a summary and a link to the Privacy Policy. No tick box since 2026-09-25 (founder's call): consent is the
 * email-plus flow the dashboard starts, after the parent has read the full notice there.
 */
import { SIGNUP, type Lang, type L } from './copy'
import { P, S } from './Notice'

export function SignupConsent({ lang }: { lang: Lang }) {
  const t = (x: L) => x[lang]
  return (
    <div data-consent="signup" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: P.ink, lineHeight: 1.35 }}>{t(SIGNUP.heading)}</h2>
      <p style={{ ...S.p, fontSize: 13.5, margin: 0 }}>{t(SIGNUP.summary)}</p>
      <a href="/legal/privacy" target="_blank" rel="noopener"
        style={{ alignSelf: 'flex-start', padding: '12px 0', margin: '-6px 0', minHeight: 44, boxSizing: 'border-box', color: P.accent, fontWeight: 700, fontSize: 13.5, textDecoration: 'underline' }}>
        {t(SIGNUP.readFull)}
      </a>
    </div>
  )
}
