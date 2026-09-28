'use client'
/**
 * WHAT A CHILD SEES WHEN THE DATABASE WILL NOT KEEP THEIR ANSWERS YET (./childPause) — founder, 2026-09-28: a friendly
 * screen, no error words. It says three true things: the work is kept on this device, a grown-up has to say yes first,
 * and whether that grown-up has been sent a message. "Keep playing" closes it; the answers keep waiting on the device.
 *
 * Only on the pages a child plays on — an adult's dashboard can meet the same refusal while it pulls progress, and a
 * child's screen there would be wrong. Mounted once, in the root layout.
 */
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { consentPause, onConsentPause } from './childPause'

const CHILD_ROUTES = ['/modules', '/lesson', '/practice', '/game', '/play', '/story']

/** Wording approved by the founder, 2026-09-28. ⚠️ SPANISH IS AN UNREVIEWED DRAFT: the child screens have no language
 *  switch yet, so only `en` is shown (as in `features/lessons/sessionCopy.ts`). */
export const PAUSE_COPY = {
  en: {
    heading: 'Your work is safe on this device',
    sayYes: 'A grown-up needs to say yes before it goes to your account.',
    sent: 'We have sent them a message.',
    ask: 'Please ask them to open Radlic.',
    button: 'Keep playing',
  },
  es: {
    heading: 'Tu trabajo está a salvo en este dispositivo',
    sayYes: 'Una persona adulta tiene que decir que sí antes de que se guarde en tu cuenta.',
    sent: 'Ya le enviamos un mensaje.',
    ask: 'Pídele que abra Radlic.',
    button: 'Seguir jugando',
  },
} as const
const c = PAUSE_COPY.en

export function ConsentPause() {
  const path = usePathname() ?? ''
  const [pause, setPause] = useState(consentPause)
  const [closed, setClosed] = useState<string | null>(null)
  useEffect(() => onConsentPause(() => setPause(consentPause())), [])
  if (!pause || closed === pause.learnerId || !CHILD_ROUTES.some(r => path === r || path.startsWith(`${r}/`))) return null
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="consent-pause-h" data-consent-pause
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16, background: 'rgba(11,79,168,0.35)' }}>
      <div style={{ maxWidth: 420, width: '100%', background: 'var(--paper)', color: 'var(--ink)', borderRadius: 24, padding: '28px 24px', textAlign: 'center', boxShadow: '0 12px 40px rgba(11,79,168,0.25)' }}>
        <div aria-hidden="true" style={{ fontSize: 56, lineHeight: 1 }}>⭐</div>
        <h2 id="consent-pause-h" style={{ margin: '14px 0 8px', fontSize: 24, fontWeight: 900 }}>{c.heading}</h2>
        <p style={{ margin: '0 0 20px', fontSize: 18, lineHeight: 1.45 }}>
          {c.sayYes} {pause.told === 'sent' ? c.sent : c.ask}
        </p>
        <button type="button" onClick={() => setClosed(pause.learnerId)}
          style={{ minHeight: 48, padding: '12px 28px', borderRadius: 50, border: 'none', background: 'var(--accent-fill)', color: 'var(--on-accent-fill)', fontSize: 18, fontWeight: 800, cursor: 'pointer' }}>
          {c.button}
        </button>
      </div>
    </div>
  )
}
