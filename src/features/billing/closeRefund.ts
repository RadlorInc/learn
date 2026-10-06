/**
 * CLOSE OR WITHDRAW-ALL → CANCEL NOW, REFUND THE UNUSED PART (founder, 6 Oct 2026; docs/legal/01 §4, §5).
 * SERVER ONLY.
 *
 * The request is made durable by the DATABASE, in the same transaction as the close or the withdrawal
 * (migration 20261008000000: `billing_cancellations`). This drains it. Nothing here reads a request: the only
 * subscription ids it ever acts on are the ones that table holds, and only the account's own close or withdrawal
 * can put one there. So the route that calls it can stay open to a caller whose account no longer exists.
 *
 * ⚠️ FAILS TOWARD THE PARENT, NEVER TOWARD STRIPE BEING UP. A close or a withdrawal is never blocked by Stripe: it
 * has a legal deadline and has already committed when this runs. A row this cannot settle stays due, is retried by
 * the next drain (the dashboard right after, the daily cron) and is flagged in the ops digest until it is. The
 * refund is counted from `queued_at` — when the request was actioned — so a late retry never shrinks it.
 *
 * ⚠️ MONEY MOVES AT MOST ONCE, BY TWO LOCKS. (1) Stripe idempotency keys derived from the subscription and the
 * invoice (`close-cancel-<sub>`, `close-refund-<sub>-<invoice>`), with parameters that are a pure function of
 * Stripe's own records and `queued_at`, so two drains racing get Stripe's one answer. (2) Stripe's state: a
 * cancelled subscription is not cancelled again, and a payment that already carries a refund (ours or one made by
 * hand) is refunded NOTHING more — so a retry after the keys expire (about 24 h) cannot pay twice either.
 */
import type Stripe from 'stripe'
import { stripeClient } from '@/infra/stripe'
import { rpc, sendEmail, type RpcError } from '@/features/consent/server'
import { renderCancelledNow } from './subscriptionNotices'

const DAY = 86_400
/** docs/legal/01 §5: the satisfaction window. Within it the refund is the whole payment. */
const FULL_REFUND_DAYS = 14

/**
 * The refund for one payment, in cents, from Stripe's own numbers (unix seconds). Pro rata by FULL days left of
 * the period that payment covered, counted from the moment the request was actioned, rounded down to the cent;
 * the whole payment if the request came within 14 days of it (or before it: a charge after the request).
 */
export function unusedCents(p: { paid: number; start: number; end: number; paidAt: number; actioned: number }): number {
  if (!(p.paid > 0)) return 0
  if (p.actioned - p.paidAt <= FULL_REFUND_DAYS * DAY) return p.paid
  const days = Math.round((p.end - p.start) / DAY)
  const left = Math.min(days, Math.max(0, Math.floor((p.end - p.actioned) / DAY)))
  return days > 0 ? Math.floor((p.paid * left) / days) : 0
}

const ENDED = new Set(['canceled', 'incomplete_expired'])

/** One queued subscription: cancel it now, refund each paid invoice's unused part, email the parent. Throws on any
 *  Stripe failure (the caller records it as an error and the next drain retries — every step is safe to repeat). */
export async function cancelAndRefund(stripe: Stripe, subId: string, queuedAtIso: string): Promise<string> {
  const actioned = Math.floor(Date.parse(queuedAtIso) / 1000)
  const sub = await stripe.subscriptions.retrieve(subId)
  const cancelled = !ENDED.has(sub.status)
  if (cancelled) await stripe.subscriptions.cancel(subId, {}, { idempotencyKey: `close-cancel-${subId}` })

  // Every paid invoice, not only the latest: a seat added mid-period is its own invoice, and refunding only that one
  // would keep the period's main payment. Older invoices come out at 0 by the same rule (their period is over).
  const invoices = await stripe.invoices.list({ subscription: subId, status: 'paid', limit: 12, expand: ['data.payments'] })
  let refunded = 0
  const notes: string[] = []
  for (const inv of invoices.data) {
    const period = inv.lines?.data?.[0]?.period
    const want = unusedCents({
      paid: inv.amount_paid, start: period?.start ?? 0, end: period?.end ?? 0,
      paidAt: inv.status_transitions?.paid_at ?? 0, actioned,
    })
    if (want <= 0) continue
    const pay = inv.payments?.data?.find(p => p.status === 'paid')?.payment
    const pi = typeof pay?.payment_intent === 'string' ? pay.payment_intent : pay?.payment_intent?.id
    const ch = typeof pay?.charge === 'string' ? pay.charge : pay?.charge?.id
    const target = pi ? { payment_intent: pi } : ch ? { charge: ch } : null
    if (!target) throw new Error(`invoice ${inv.id} has no payment to refund`)
    const prior = await stripe.refunds.list({ ...target, limit: 100 })
    if (prior.data.some(r => r.status !== 'failed' && r.status !== 'canceled')) {
      notes.push(`${inv.id} already refunded, nothing more`)
      continue
    }
    await stripe.refunds.create(
      { ...target, amount: want, reason: 'requested_by_customer', metadata: { why: 'account_closed_or_consent_withdrawn', subscription: subId } },
      { idempotencyKey: `close-refund-${subId}-${inv.id}` },
    )
    refunded += want
    notes.push(`${inv.id} refunded ${want}`)
  }

  // The parent's confirmation (docs/legal/01 §4), to the address Stripe holds — the account may already be gone.
  // Only when something happened: an old plan that had already ended gets no email. `canceled_at` after the request
  // is a cancel of ours whose first attempt died before the email (Resend's key stops a second copy).
  if (cancelled || refunded > 0 || (sub.canceled_at ?? 0) >= actioned) {
    try {
      const c = await stripe.customers.retrieve(typeof sub.customer === 'string' ? sub.customer : sub.customer.id)
      const to = 'deleted' in c && c.deleted ? null : (c as Stripe.Customer).email
      if (!to) notes.push('no email on the Stripe customer')
      else await sendEmail('transactional', to, renderCancelledNow(refunded), `billing-close-${subId}`)
    } catch (e) {
      notes.push(`email not sent: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return `done: ${cancelled ? 'cancelled now' : `already ${sub.status}`}; refunded ${refunded}${notes.length ? `; ${notes.join('; ')}` : ''}`.slice(0, 500)
}

/** Settle every queued cancellation. Returns how many were due; null if the queue does not exist yet (PGRST202). */
export async function drainBillingCancellations(): Promise<number | null> {
  let due: { stripe_subscription_id: string; queued_at: string }[]
  try { due = await rpc('billing_cancellations_due', {}) } catch (e) {
    if ((e as RpcError)?.code === 'PGRST202') return null
    throw e
  }
  if (!due.length) return 0
  let stripe: Stripe | null = null, why = 'STRIPE_SECRET_KEY is not set'
  try { stripe = stripeClient() } catch (e) { why = e instanceof Error ? e.message : String(e) }
  let failed = 0
  for (const row of due) {
    let result: string
    try {
      if (!stripe) throw new Error(why)
      result = await cancelAndRefund(stripe, row.stripe_subscription_id, row.queued_at)
    } catch (e) {
      failed++
      result = `error: ${e instanceof Error ? e.message : String(e)}`.slice(0, 500)
    }
    await rpc('billing_cancellation_record', { p_subscription_id: row.stripe_subscription_id, p_result: result })
  }
  if (failed) console.error(`[billing] cancel/refund not done for ${failed} of ${due.length}; retried next drain, flagged in the ops digest`)
  return due.length
}
