'use client'
/**
 * Document 02 on screen, every line of it, in the order the document gives it — ONE component, used by
 * the signup page ("Read the full notice"), the dashboard (the account consent), the add-a-child sheet
 * (the attestation's "Read the notice you agreed to") and re-consent. A second copy of this markup is a
 * second place for the notice to drift from what the parent is recorded as having read.
 *
 * `onContinue` absent → read-only (no buttons): the signup page and the attestation link only SHOW it.
 */
import { NOTICE, type Lang, type L } from './copy'
import { Md } from './Md'

export const P = { card: 'var(--paper-soft)', ink: 'var(--ink)', ink2: 'var(--ink-soft)', ink3: 'var(--ink-muted)', edge: 'var(--card-border)', accent: 'var(--milo-orange)' }

export const S = {
  h3: { fontSize: 20, fontWeight: 800, margin: '0 0 12px', color: P.ink, fontFamily: 'var(--font-display)' },
  h4: { fontSize: 15, fontWeight: 800, margin: '20px 0 8px', color: P.ink },
  p:  { fontSize: 14, lineHeight: 1.55, color: P.ink2, margin: '0 0 10px' },
  ul: { fontSize: 14, lineHeight: 1.55, color: P.ink2, margin: '0 0 10px', paddingLeft: 20 },
  primary: { width: '100%', padding: 16, minHeight: 44, background: P.accent, color: '#fff', border: 'none', borderRadius: 50, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
  ghost: { padding: '12px 18px', minHeight: 44, background: 'transparent', color: P.ink, border: `1.5px solid ${P.edge}`, borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  danger: { width: '100%', padding: 16, minHeight: 48, background: '#991B1B', color: '#fff', border: 'none', borderRadius: 50, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
} as const

export function Notice({ lang, busy, onContinue, onClose }: { lang: Lang; busy?: boolean; onContinue?: () => void; onClose?: () => void }) {
  const t = (x: L) => x[lang]
  const N = NOTICE
  return (
    <div data-consent="notice">
      <h3 style={S.h3}>{t(N.title)}</h3>
      <p style={S.p}><Md s={t(N.intro)} /></p>

      <h4 style={S.h4}>{t(N.collectHeading)}</h4>
      {/* The table as stacked cards: three columns do not fit a 375px phone, and a sideways-scrolling
          notice is one a parent does not finish reading. Same cells, same order, all three shown. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {N.rows.map((row, i) => (
          <div key={i} style={{ border: `1px solid ${P.edge}`, borderRadius: 12, padding: '10px 12px' }}>
            {row.map((cell, j) => (
              <p key={j} style={{ ...S.p, margin: j ? '6px 0 0' : 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: P.ink3, display: 'block' }}>{t(N.columns[j])}</span>
                <Md s={t(cell)} />
              </p>
            ))}
          </div>
        ))}
      </div>
      <p style={{ ...S.p, marginTop: 12 }}><Md s={t(N.doNotAsk)} /></p>

      <h4 style={S.h4}>{t(N.useHeading)}</h4>
      <p style={S.p}><Md s={t(N.use)} /></p>
      <p style={S.p}><Md s={t(N.thirdParty)} /></p>
      <p style={S.p}><Md s={t(N.weDoNot)} /></p>
      <ul style={S.ul}>{N.weDoNotList.map((x, i) => <li key={i}><Md s={t(x)} /></li>)}</ul>

      <h4 style={S.h4}>{t(N.permissionHeading)}</h4>
      <p style={S.p}><Md s={t(N.permission)} /></p>
      <p style={S.p}><Md s={t(N.permissionHow)} /></p>

      <h4 style={S.h4}>{t(N.rightsHeading)}</h4>
      <p style={S.p}><Md s={t(N.rightsIntro)} /></p>
      <ul style={S.ul}>{N.rightsList.map((x, i) => <li key={i}><Md s={t(x)} /></li>)}</ul>
      <p style={S.p}><Md s={t(N.rightsHow)} /></p>

      <h4 style={S.h4}>{t(N.keepHeading)}</h4>
      <p style={S.p}><Md s={t(N.keep)} /></p>
      <h4 style={S.h4}>{t(N.protectHeading)}</h4>
      <p style={S.p}><Md s={t(N.protect)} /></p>
      <h4 style={S.h4}>{t(N.detailsHeading)}</h4>
      <p style={S.p}><Md s={t(N.details)} /></p>
      <h4 style={S.h4}>{t(N.contactHeading)}</h4>
      <p style={S.p}>{N.contact.map((l, i) => <span key={i} style={{ display: 'block' }}>{l}</span>)}</p>

      {onContinue && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onContinue} disabled={busy} style={S.primary}>{t(N.primary)}</button>
          <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ ...S.ghost, textAlign: 'center', textDecoration: 'none' }}>{t(N.secondary)}</a>
          {onClose && <button type="button" onClick={onClose} style={S.ghost}>{t(N.tertiary)}</button>}
        </div>
      )}
    </div>
  )
}
