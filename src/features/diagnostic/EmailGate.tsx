'use client'
/**
 * The cold funnel's lead capture — the one screen where a STRANGER hands over an email address.
 * Lives outside the page so it can be rendered on its own (`consentLine.test.ts`); a Next page file
 * may export nothing but the page.
 */
import { useState } from 'react'
import { getLeadEmail } from '@/infra/storage/leadEmail'
import { PT, type Accent } from '@/features/chapters/story/preteen/kit'
import { ConsentLine } from '@/shared/ui/ConsentLine'

export
function EmailGate({ accent, short, onSubmit }: { accent: Accent; short?: boolean; onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState(() => getLeadEmail() ?? '')
  const [err, setErr] = useState<string | null>(null)
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const submit = () => { if (!valid) { setErr('Please enter a valid email'); return } onSubmit(email.trim()) }
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440, background: PT.panel, backdropFilter: 'blur(8px)', border: `1px solid ${accent.base}66`, borderRadius: 20, padding: short ? '22px 20px' : '30px 28px', boxShadow: `0 0 30px ${accent.base}22, 0 18px 40px rgba(0,0,0,0.5)`, textAlign: 'center' }}>
        <div style={{ fontFamily: PT.mono, fontSize: 11, letterSpacing: 2.5, color: accent.base, textTransform: 'uppercase', marginBottom: 10 }}>One quick thing</div>
        <h1 style={{ margin: '0 0 8px', fontFamily: PT.sans, fontWeight: 700, fontSize: short ? 22 : 26, color: PT.ink }}>Where should we send the results?</h1>
        <p style={{ margin: '0 0 20px', fontFamily: PT.sans, fontSize: 14.5, lineHeight: 1.5, color: PT.inkMute }}>Enter your email so we can save your child&apos;s starting point and plan. No spam — just the results.</p>
        <input
          type="email" inputMode="email" autoFocus value={email} placeholder="you@example.com"
          onChange={e => { setEmail(e.target.value); if (err) setErr(null) }}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          style={{ width: '100%', boxSizing: 'border-box', padding: '15px 16px', borderRadius: 12, border: `1.5px solid ${err ? '#e0483f' : PT.lineStrong}`, background: 'rgba(255,255,255,0.06)', color: PT.ink, fontFamily: PT.sans, fontSize: 17, outline: 'none', textAlign: 'center' }}
        />
        {err && <div style={{ marginTop: 8, fontFamily: PT.sans, fontSize: 13, color: '#ff8a80' }}>{err}</div>}
        <button onClick={submit} disabled={!valid} style={{ marginTop: 16, width: '100%', padding: 16, borderRadius: 50, border: 'none', cursor: valid ? 'pointer' : 'not-allowed', background: valid ? accent.base : PT.line, color: valid ? '#06121f' : PT.inkMute, fontFamily: PT.sans, fontWeight: 800, fontSize: 17, boxShadow: valid ? `0 0 22px ${accent.base}66` : 'none', transition: 'all .16s ease' }}>Start the check →</button>
        {/* Consent record: the documents are on screen at the moment of submission, in the page's own
            palette — the component's defaults are /auth's warm ink and orange. */}
        <ConsentLine color={PT.inkSoft} linkColor={accent.base} />
        {/* Said already on the age picker's eyebrow; on a short frame (640×320) the card is 345px
            with it and clips both ends, 316px without. The consent line stays, this goes. */}
        {!short && <p style={{ margin: '12px 0 0', fontFamily: PT.sans, fontSize: 11.5, color: PT.inkMute }}>Free · takes about ten minutes</p>}
      </div>
    </div>
  )
}
