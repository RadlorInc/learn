'use client'
/**
 * Where a commercial email's "Unsubscribe" link lands. ⚠️ NOTHING HAPPENS ON ARRIVAL, ONLY ON THE
 * PRESS: mail scanners open every link, so arriving here must not unsubscribe anyone (same reason as
 * /consent/respond). One button, no sign-in, no questions. The token is in the fragment, so it never
 * reaches a server log until the reader presses.
 */
import { useState } from 'react'

type State = 'ready' | 'busy' | 'unsubscribed' | 'unknown' | 'error'

export default function Page() {
  const [state, setState] = useState<State>('ready')
  async function go() {
    setState('busy')
    const t = new URLSearchParams(window.location.hash.slice(1)).get('t') ?? ''
    const r = await fetch(`/api/email/unsubscribe?t=${encodeURIComponent(t)}`, { method: 'POST' }).catch(() => null)
    const j = await r?.json().catch(() => null)
    setState(r?.ok && (j?.status === 'unsubscribed' || j?.status === 'unknown') ? j.status : 'error')
  }
  const box: React.CSSProperties = { maxWidth: 480, margin: '15vh auto 0', padding: '0 16px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }
  return (
    <main style={box} data-unsubscribe={state}>
      {state === 'unsubscribed' ? <>
        <h1>You are unsubscribed</h1>
        <p>We will not send this address updates or offers again. You will still get essential messages about your account, such as receipts and security notices.</p>
      </> : state === 'unknown' ? <>
        <h1>This link did not work</h1>
        <p>It may have been copied incompletely. Write to support@radlor.com and we will take your address off our list.</p>
      </> : <>
        <h1>Unsubscribe from Milo updates</h1>
        <p>Press the button and we will stop sending this address updates and offers. You will still get essential messages about your account.</p>
        <button type="button" onClick={go} disabled={state === 'busy'}
          style={{ font: 'inherit', padding: '12px 20px', borderRadius: 8, border: 0, background: '#1f2937', color: '#fff', cursor: 'pointer' }}>
          Unsubscribe
        </button>
        {state === 'error' && <p role="alert">Something went wrong. Please try again, or write to support@radlor.com.</p>}
      </>}
    </main>
  )
}
