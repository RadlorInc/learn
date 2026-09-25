'use client'
/**
 * "Your subscription" on /parent/plan — the state, and the in-app way to cancel it (docs/legal/01 §4).
 * Two taps: Cancel subscription → Yes, cancel. No reason asked, no offer in the way.
 * The state shown is the `subscriptions` row (see /api/billing/cancel for why that is the one source).
 */
import { useEffect, useState } from 'react'
import { HOLDS_SEATS } from '@/core/billing'
import { endDate, endsLine } from '@/features/billing/cancelNotice'
import { cancelMySubscription, getMySubscription, type MySubscription } from '@/data/repositories/billing'

const card: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: '18px 16px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }
const p: React.CSSProperties = { fontSize: 14, lineHeight: 1.55, color: '#083d85', margin: '0 0 10px' }
const btn: React.CSSProperties = { minHeight: 44, padding: '0 18px', borderRadius: 999, cursor: 'pointer', fontWeight: 800, fontSize: 14, background: '#fff', color: '#083d85', border: '2px solid rgba(8,61,133,.2)', marginRight: 8, marginTop: 6 }

export function SubscriptionCard() {
  const [sub, setSub] = useState<MySubscription | null | undefined | 'loading'>('loading')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => { getMySubscription().then(setSub) }, [])

  async function cancel() {
    setBusy(true); setNote(null)
    const out = await cancelMySubscription()
    setBusy(false); setConfirming(false)
    if (out.ok) {
      setSub(s => (s && s !== 'loading' ? { ...s, cancel_at_period_end: true, current_period_end: out.current_period_end ?? s.current_period_end } : s))
      setNote(out.emailed ? 'We have emailed you a confirmation.' : 'Your subscription is cancelled. We could not send the confirmation email — this screen is your confirmation.')
      return
    }
    if (out.error === 'no_subscription') { setSub(null); return }
    setNote(out.error === 'billing_not_configured'
      ? 'Cancelling is not switched on yet. Email support@radlor.com and we will cancel it for you.'
      : 'Something went wrong and nothing has changed. Try again, or email support@radlor.com.')
  }

  let body: React.ReactNode
  if (sub === 'loading') body = <p style={p}>Loading…</p>
  else if (sub === undefined) body = <p style={p}>We could not load your subscription. Please try again.</p>
  else if (!sub || !HOLDS_SEATS.has(sub.status)) body = <p style={p}>You do not have a subscription, so there is nothing to cancel.</p>
  else if (sub.cancel_at_period_end) body = <p style={p} data-testid="plan-ends"><strong>{endsLine(sub.current_period_end)}</strong></p>
  else if (confirming) body = <>
    <p style={p}><strong>Cancel your subscription?</strong></p>
    <p style={p}>
      You will not be charged again. Your plan stays active until{' '}
      {endDate(sub.current_period_end) ?? 'the end of the period you have paid for'}, then ends.
      Your account and your children&rsquo;s profiles stay open. Cancelling does not issue a refund by itself.
    </p>
    <button style={{ ...btn, background: '#DC2626', color: '#fff', border: 'none' }} disabled={busy} onClick={cancel}>
      {busy ? 'Cancelling…' : 'Yes, cancel my subscription'}
    </button>
    <button style={btn} disabled={busy} onClick={() => setConfirming(false)}>Keep my subscription</button>
  </>
  else body = <>
    <p style={p}>
      {sub.seats_paid} {sub.seats_paid === 1 ? 'child' : 'children'}.
      {endDate(sub.current_period_end) ? ` Renews on ${endDate(sub.current_period_end)}.` : ''}
    </p>
    <button style={btn} onClick={() => setConfirming(true)}>Cancel subscription</button>
  </>

  return (
    <section style={card} aria-label="Your subscription">
      <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 10px', color: '#083d85' }}>Your subscription</h2>
      {body}
      {note && <p style={{ ...p, margin: '10px 0 0' }}>{note}</p>}
    </section>
  )
}
