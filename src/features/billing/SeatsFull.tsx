'use client'
/**
 * A paying family with every seat in use cannot add another child (founder, 2026-10-01): "+ Add a child" shows this
 * instead of the add sheet. Seats are per child (core/billing LADDER, MAX_SEATS); a child added past them would only
 * get the free trial. There is no in-app way to add a seat yet, so the way on is an email.
 */
import { useEffect, useState } from 'react'
import { HOLDS_SEATS, MAX_SEATS } from '@/core/billing'
import { getMySubscription } from '@/data/repositories/billing'
import { PAYWALL_ENABLED } from '@/features/billing/useTopicGate'
import { SUPPORT_EMAIL } from '@/app/site'
import { dbtn, dghost } from '@/features/dashboard/Helpers'

/** The number of paid seats, or null when there is no paid plan (or the paywall is off, or we could not find out). */
export function usePaidSeats(): number | null {
  const [seats, setSeats] = useState<number | null>(null)
  useEffect(() => {
    if (!PAYWALL_ENABLED) return
    getMySubscription().then(s => setSeats(s && HOLDS_SEATS.has(s.status) ? s.seats_paid : null))
  }, [])
  return seats
}

export function SeatsFullDialog({ seats, onClose }: { seats: number; onClose: () => void }) {
  const most = seats >= MAX_SEATS
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="seats-title" onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,61,133,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--paper-soft)', borderRadius: 18, padding: 24, maxWidth: 440, width: '100%', boxSizing: 'border-box' }}>
        <h3 id="seats-title" style={{ margin: '0 0 8px', fontSize: 20, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          You have used all {seats} {seats === 1 ? 'seat' : 'seats'}
        </h3>
        <p style={{ margin: '0 0 18px', lineHeight: 1.5, color: 'var(--ink)' }}>
          {most
            ? `Your plan covers ${MAX_SEATS} children, the most one plan can have, and every seat has a child in it.`
            : `Your plan covers ${seats} ${seats === 1 ? 'child' : 'children'}, and every seat has a child in it. To add another child, add a seat to your plan: email us and we will add it.`}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" style={dghost} onClick={onClose}>Not now</button>
          {!most && <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Add a seat to my Radlic plan')}`} style={dbtn}>Email us to add a seat</a>}
        </div>
      </div>
    </div>
  )
}
