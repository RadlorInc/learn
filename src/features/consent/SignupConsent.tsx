'use client'
/**
 * Consent-once, C2: what `/auth` shows ABOVE the signup controls. Document 03's signup screen: a heading,
 * a summary, the full notice on request, an UNTICKED box, and what happens next. The page keeps both
 * signup buttons disabled until `ok` — the box ticked, or "Continue as a teacher" (which records nothing).
 */
import { useState } from 'react'
import { SIGNUP, type Lang, type L } from './copy'
import { Notice, P, S } from './Notice'

export function SignupConsent({ lang, ticked, onTick, teacher, onTeacher }: {
  lang: Lang; ticked: boolean; onTick: (on: boolean) => void; teacher: boolean; onTeacher: () => void
}) {
  const t = (x: L) => x[lang]
  const [full, setFull] = useState(false)
  return (
    <div data-consent="signup" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: P.ink, lineHeight: 1.35 }}>{t(SIGNUP.heading)}</h2>
      <p style={{ ...S.p, fontSize: 13.5, margin: 0 }}>{t(SIGNUP.summary)}</p>
      <button type="button" onClick={() => setFull(v => !v)} aria-expanded={full}
        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: '12px 0', margin: '-6px 0', minHeight: 44, color: P.accent, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', textDecoration: 'underline' }}>
        {t(SIGNUP.readFull)}
      </button>
      {full && <div style={{ maxHeight: 360, overflowY: 'auto', border: `1.5px solid ${P.edge}`, borderRadius: 12, padding: '14px 14px 4px' }}><Notice lang={lang} /></div>}
      {!teacher && (
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.45, color: P.ink, fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}>
          <input type="checkbox" checked={ticked} onChange={e => onTick(e.target.checked)}
            style={{ width: 22, height: 22, flex: '0 0 auto', marginTop: 1, accentColor: '#F26B2C' }} />
          <span>{t(SIGNUP.tick)}</span>
        </label>
      )}
      {!teacher && <p style={{ ...S.p, fontSize: 13, margin: 0 }}>{t(SIGNUP.next)}</p>}
      {!teacher && (
        <p style={{ ...S.p, fontSize: 13, margin: 0 }}>
          {t(SIGNUP.teacher)}{' '}
          <button type="button" onClick={onTeacher}
            style={{ background: 'none', border: 'none', padding: '12px 4px', margin: '-12px -4px', minHeight: 44, color: P.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
            {t(SIGNUP.teacherButton)}
          </button>
        </p>
      )}
    </div>
  )
}
