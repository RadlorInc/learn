'use client'
/**
 * A paying family with every seat in use cannot add another child (founder, 2026-10-01): "+ Add a child" shows this
 * instead of the add sheet. Seats are per child (core/billing LADDER, MAX_SEATS); a child added past them would only
 * get the free trial. The way on is "Add a seat" (/api/billing/seats): the renewal total before and after is shown
 * first, then Stripe charges the prorated difference now and the new seat goes to the next child added.
 */
import { useEffect, useState } from 'react'
import { HOLDS_SEATS, MAX_SEATS } from '@/core/billing'
import { addSeat, getMySubscription, type SeatPreview } from '@/data/repositories/billing'
import { PAYWALL_ENABLED } from '@/features/billing/useTopicGate'
import { dbtn, dghost } from '@/features/dashboard/Helpers'

/** The number of paid seats, or null when there is no paid plan (or the paywall is off, or we could not find out). */
export function usePaidSeats(): [number | null, (n: number) => void] {
  const [seats, setSeats] = useState<number | null>(null)
  useEffect(() => {
    if (!PAYWALL_ENABLED) return
    getMySubscription().then(s => setSeats(s && HOLDS_SEATS.has(s.status) ? s.seats_paid : null))
  }, [])
  return [seats, setSeats]
}

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`

const WHY: Record<string, string> = {
  not_active: 'Your plan is not active right now (a payment is due, or it is set to cancel), so a seat cannot be added.',
  at_most: `A plan covers at most ${MAX_SEATS} children.`,
  payment_failed: 'The payment did not go through, so nothing has changed. Check your card and try again.',
}

export function SeatsFullDialog({ seats, onClose, onAdded }: { seats: number; onClose: () => void; onAdded: (seats: number) => void }) {
  const most = seats >= MAX_SEATS
  const [preview, setPreview] = useState<SeatPreview | null>()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  useEffect(() => {
    if (most) return
    addSeat(false).then(r => {
      if (r.ok && r.preview) setPreview(r.preview)
      else { setPreview(null); setNote(!r.ok && WHY[r.error] ? WHY[r.error] : 'Could not load the price. Try again in a moment.') }
    })
  }, [most])

  async function buy() {
    setBusy(true); setNote(null)
    const r = await addSeat(true)
    setBusy(false)
    if (r.ok && r.seats) onAdded(r.seats)
    else setNote(!r.ok && WHY[r.error] ? WHY[r.error] : 'Something went wrong and nothing has changed. Try again.')
  }

  const per = preview?.cadence === 'annual' ? 'year' : 'month'
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="seats-title" onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,61,133,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--paper-soft)', borderRadius: 18, padding: 24, maxWidth: 460, width: '100%', boxSizing: 'border-box' }}>
        <h3 id="seats-title" style={{ margin: '0 0 8px', fontSize: 20, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          You have used all {seats} {seats === 1 ? 'seat' : 'seats'}
        </h3>
        <p style={{ margin: '0 0 12px', lineHeight: 1.5, color: 'var(--ink)' }}>
          {most
            ? `Your plan covers ${MAX_SEATS} children, the most one plan can have, and every seat has a child in it.`
            : `Your plan covers ${seats} ${seats === 1 ? 'child' : 'children'}, and every seat has a child in it. Add a seat to add another child.`}
        </p>
        {preview && (
          <p style={{ margin: '0 0 12px', lineHeight: 1.5, color: 'var(--ink)' }}>
            Your plan goes from <b>{usd(preview.renewalCents)}</b> to <b>{usd(preview.newRenewalCents)}</b> a {per}.
            Today you pay only for the rest of this {per}, on the card you already use.
          </p>
        )}
        {note && <p role="alert" style={{ margin: '0 0 12px', fontWeight: 800, color: '#B42318' }}>{note}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" style={dghost} onClick={onClose}>Not now</button>
          {!most && <button type="button" style={dbtn} disabled={!preview || busy} onClick={buy}>{busy ? 'Adding…' : 'Add a seat'}</button>}
        </div>
      </div>
    </div>
  )
}
