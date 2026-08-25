'use client'
/**
 * The pricing screen. PARENT SIDE ONLY — this is the one place in the product where a price appears.
 *
 * ⚠️ EVERY NUMBER ON THIS PAGE IS DERIVED FROM `src/core/billing.ts`. Typing "$12.98" here would be
 * a second copy of the ladder, and the day it drifts a parent is quoted one figure and charged
 * another. `totalCents` is the same function the ladder's own gate drives against hand-computed
 * totals, so this page cannot disagree with what Stripe bills without that gate going red.
 *
 * ⚠️ NO COUNTDOWN, NO FAKE SCARCITY, NO DARK PATTERNS — founder's call, and gated: the module may
 * contain no timer at all (`chapterGate.test.ts`). A product for children does not manufacture
 * urgency at their parents.
 */
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/data/supabase/client'
import { LADDER, MAX_SEATS, totalCents, type Cadence } from '@/core/billing'

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`
const SEATS = Array.from({ length: MAX_SEATS }, (_, i) => i + 1)

export default function PlanPage() {
  const [cadence, setCadence] = useState<Cadence>('monthly')
  const [seats, setSeats] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function checkout() {
    setBusy(true); setError(null)
    try {
      // ⚠️ The account comes from the TOKEN at the route, never from this body — see
      // src/app/api/checkout/route.ts. Sending it from here would be a number a browser can change.
      const { data } = await createClient().auth.getSession()
      const token = data.session?.access_token
      if (!token) { setError('Please sign in again.'); return }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ seats, cadence }),
      })
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok || !body.url) {
        // 503 is the ordinary state until the founder has run scripts/stripe-products — say so
        // plainly rather than showing a parent a crash.
        setError(body.error === 'billing_not_configured'
          ? 'Checkout is not switched on yet. Nothing has been charged.'
          : 'Something went wrong starting checkout. Nothing has been charged.')
        return
      }
      window.location.href = body.url
    } finally { setBusy(false) }
  }

  return (
    <main style={{ minHeight: '100dvh', background: '#FCEAB6', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Link href="/parent" style={{ fontSize: 13, fontWeight: 700, color: '#8a7a63', textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontSize: 24, margin: '12px 0 6px', color: '#3c2a14' }}>Milo for your family</h1>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: '#6b5a42', margin: '0 0 20px' }}>
          One subscription covers up to {MAX_SEATS} children. The check that finds your child&rsquo;s
          starting point is always free, and so is the first chapter of every level.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {(['monthly', 'annual'] as Cadence[]).map(c => (
            <button key={c} onClick={() => setCadence(c)} style={{
              flex: 1, padding: '10px 12px', borderRadius: 50, cursor: 'pointer', fontWeight: 800, fontSize: 14,
              border: cadence === c ? 'none' : '1.5px solid #d9c9a8',
              background: cadence === c ? '#F26B2C' : 'transparent', color: cadence === c ? '#fff' : '#6b5a42',
            }}>{c === 'monthly' ? 'Monthly' : 'Yearly'}</button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: '18px 16px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#3c2a14', marginBottom: 8 }}>
            <span>First child</span><strong>{usd(LADDER[cadence].first)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#3c2a14' }}>
            <span>Each additional child</span><strong>{usd(LADDER[cadence].extra)}</strong>
          </div>
          <p style={{ fontSize: 12, color: '#8a7a63', margin: '12px 0 0', lineHeight: 1.5 }}>
            {cadence === 'monthly' ? 'Per month.' : 'Per year.'} Up to {MAX_SEATS} children on one
            subscription. Cancel whenever you like — your child keeps everything they have already done.
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: '18px 16px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px', color: '#1a1a1a' }}>How many children?</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {SEATS.map(n => (
              <button key={n} onClick={() => setSeats(n)} style={{
                flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', fontWeight: 800, fontSize: 16,
                border: seats === n ? '2px solid #F26B2C' : '1.5px solid #e5e7eb',
                background: seats === n ? '#FFF3EC' : '#fff', color: '#1a1a1a',
              }}>{n}</button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 15, color: '#3c2a14' }}>
            <span>{seats} {seats === 1 ? 'child' : 'children'}</span>
            <strong style={{ fontSize: 22 }}>{usd(totalCents(seats, cadence))}</strong>
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 700, margin: '0 0 12px' }}>{error}</p>}

        <button onClick={checkout} disabled={busy} style={{
          width: '100%', background: '#F26B2C', color: '#fff', fontWeight: 800, fontSize: 16,
          border: 'none', borderRadius: 50, padding: '14px 26px', cursor: busy ? 'default' : 'pointer',
          opacity: busy ? 0.6 : 1,
        }}>{busy ? 'Opening checkout…' : `Continue — ${usd(totalCents(seats, cadence))}`}</button>

        <p style={{ fontSize: 12, color: '#8a7a63', margin: '14px 0 0', lineHeight: 1.5, textAlign: 'center' }}>
          Payment is handled by Stripe. We never see your card details.
        </p>
      </div>
    </main>
  )
}
