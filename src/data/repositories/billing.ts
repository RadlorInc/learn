'use client'
/**
 * Billing reads. Radlor is free since 13 Nov 2026: what is left is the read of a plan bought before then, so deleting
 * a child or withdrawing can say what happens to it (features/billing/paidSeats). Delete with the webhook once Stripe
 * has no subscription left.
 */
import { db } from '@/data/repositories/_shared'

export interface MySubscription {
  status: string
  seats_paid: number
  current_period_end: string | null
  cancel_at_period_end: boolean
}

/** This account's subscription row (RLS: owner can read), `null` when there is none, `undefined`
 *  when we could not find out — the screen must not say "no subscription" because the wifi dropped. */
export async function getMySubscription(): Promise<MySubscription | null | undefined> {
  try {
    const { data, error } = await db().from('subscriptions')
      .select('status,seats_paid,current_period_end,cancel_at_period_end').maybeSingle()
    return error ? undefined : (data ?? null)
  } catch { return undefined }
}
