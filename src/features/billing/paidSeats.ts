'use client'
/**
 * Radlic is free since 13 Nov 2026. A family that subscribed before then keeps its Stripe subscription until the
 * founder cancels it in Stripe; until then, deleting a child or withdrawing says what happens to that plan (refund).
 * Delete this, the webhook, the cancel route and closeRefund once Stripe shows no subscription left.
 */
import { useEffect, useState } from 'react'
import { HOLDS_SEATS } from '@/core/billing'
import { getMySubscription } from '@/data/repositories/billing'

/** The number of paid seats, or null when there is no paid plan (or we could not find out). */
export function usePaidSeats(): [number | null] {
  const [seats, setSeats] = useState<number | null>(null)
  useEffect(() => { getMySubscription().then(s => setSeats(s && HOLDS_SEATS.has(s.status) ? s.seats_paid : null)) }, [])
  return [seats]
}
