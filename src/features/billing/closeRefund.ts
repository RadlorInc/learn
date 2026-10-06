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
 *
 * ONE CHILD OF SEVERAL (migration 20261008010000, `billing_seat_removals`): `removeSeatAndRefund` takes that child's
 * seat off the plan and refunds the seat's share by the same rule. Its refunds are tagged `seat_removed`, and the
 * close path above subtracts them, so a family that withdraws one child and later closes is refunded each part once.
 */
import type Stripe from 'stripe'
import { stripeClient } from '@/infra/stripe'
import { rpc, sendEmail, type RpcError } from '@/features/consent/server'
import { LADDER } from '@/core/billing'
import { renderCancelledNow, renderSeatRemoved } from './subscriptionNotices'

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

type Target = { payment_intent: string } | { charge: string }
/** The payment an invoice was paid with, as `refunds.create`/`refunds.list` take it. */
function paymentOf(inv: Stripe.Invoice): Target {
  const pay = inv.payments?.data?.find(p => p.status === 'paid')?.payment
  const pi = typeof pay?.payment_intent === 'string' ? pay.payment_intent : pay?.payment_intent?.id
  const ch = typeof pay?.charge === 'string' ? pay.charge : pay?.charge?.id
  if (pi) return { payment_intent: pi }
  if (ch) return { charge: ch }
  throw new Error(`invoice ${inv.id} has no payment to refund`)
}

/** What is already refunded on one payment. A one-child seat refund (ours, `why: seat_removed`) took one seat's
 *  share off the payment (`seat_paid`), and the rest of the payment is still refundable; any OTHER refund (a close's,
 *  or one made by hand) settles the payment: nothing more is refunded on it. */
async function refundedOn(stripe: Stripe, target: Target) {
  const live = (await stripe.refunds.list({ ...target, limit: 100 })).data.filter(r => r.status !== 'failed' && r.status !== 'canceled')
  const seats = live.filter(r => r.metadata?.why === 'seat_removed')
  return {
    seats: seats.map(r => r.metadata?.removal ?? ''),
    seatPaid: seats.reduce((s, r) => s + (Number(r.metadata?.seat_paid) || 0), 0),
    settled: live.length > seats.length,
  }
}

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
    const target = paymentOf(inv)
    const prior = await refundedOn(stripe, target)
    if (prior.settled) {
      notes.push(`${inv.id} already refunded, nothing more`)
      continue
    }
    // A seat already taken off this payment by a one-child withdrawal was refunded then: only the rest is unused now.
    const left = prior.seatPaid ? unusedCents({
      paid: inv.amount_paid - prior.seatPaid, start: period?.start ?? 0, end: period?.end ?? 0,
      paidAt: inv.status_transitions?.paid_at ?? 0, actioned,
    }) : want
    if (left <= 0) continue
    await stripe.refunds.create(
      { ...target, amount: left, reason: 'requested_by_customer', metadata: { why: 'account_closed_or_consent_withdrawn', subscription: subId } },
      { idempotencyKey: `close-refund-${subId}-${inv.id}` },
    )
    refunded += left
    notes.push(`${inv.id} refunded ${left}`)
  }

  // The parent's confirmation (docs/legal/01 §4), to the address Stripe holds — the account may already be gone.
  // Only when something happened: an old plan that had already ended gets no email. `canceled_at` after the request
  // is a cancel of ours whose first attempt died before the email (Resend's key stops a second copy).
  if (cancelled || refunded > 0 || (sub.canceled_at ?? 0) >= actioned) {
    await emailCustomer(stripe, sub, renderCancelledNow(refunded), `billing-close-${subId}`, notes)
  }
  return `done: ${cancelled ? 'cancelled now' : `already ${sub.status}`}; refunded ${refunded}${notes.length ? `; ${notes.join('; ')}` : ''}`.slice(0, 500)
}

/** To the address Stripe holds for the plan. A failure is a note on the row, never a reason to redo the money. */
async function emailCustomer(stripe: Stripe, sub: Stripe.Subscription, m: ReturnType<typeof renderCancelledNow>, key: string, notes: string[]) {
  try {
    const c = await stripe.customers.retrieve(typeof sub.customer === 'string' ? sub.customer : sub.customer.id)
    const to = 'deleted' in c && c.deleted ? null : (c as Stripe.Customer).email
    if (!to) notes.push('no email on the Stripe customer')
    else await sendEmail('transactional', to, m, key)
  } catch (e) {
    notes.push(`email not sent: ${e instanceof Error ? e.message : String(e)}`)
  }
}

/** Stripe metadata key marking that this removal already lowered the quantity (≤ 40 characters). */
const removedKey = (removal: string) => `rs_${removal.replace(/-/g, '')}`

/**
 * ONE CHILD WITHDRAWN (of several): take one seat off the plan and refund that seat's unused part (founder, 6 Oct
 * 2026; migration 20261008010000). `removal` is the queue row's id — the "child seat" — and keys everything at Stripe.
 *
 * The seat. Stripe bills seats as the QUANTITY of one graduated price (core/billing: seat 1 at `first`, every other
 * seat at `extra`), so what a family pays for its top seat is `extra` on the period's invoice; a seat added part-way
 * through (/api/billing/seats, `always_invoice`) was its own invoice for the rest of the period. Seats are refunded
 * last-in first-out: per billing period, the newest paid invoice that still has an unrefunded seat on it — a seat-add
 * invoice (`billing_reason: subscription_update`, one seat, its whole amount) or the period's own invoice (its seats
 * beyond the first, `extra` each, capped at what is left of the payment). The refund is `unusedCents` of that one
 * seat's share: full days left from `queued_at`, rounded down; the whole share within 14 days of the payment.
 *
 * The quantity goes down by one with `proration_behavior: 'none'` (we refund ourselves; Stripe must not also credit
 * it), and the same update writes a metadata marker, so a retry after the idempotency keys expire never lowers it
 * twice. A refund carries `removal` and `seat_paid` in its metadata: a retry finds it and pays nothing more, and a
 * later close refunds only what the seat refunds left (`refundedOn`).
 */
export async function removeSeatAndRefund(stripe: Stripe, subId: string, removal: string, queuedAtIso: string): Promise<string> {
  const actioned = Math.floor(Date.parse(queuedAtIso) / 1000)
  const sub = await stripe.subscriptions.retrieve(subId)
  if (ENDED.has(sub.status)) return `done: plan already ${sub.status}; nothing to remove`
  const item = sub.items.data[0]
  const qty = item?.quantity ?? 0
  const notes: string[] = []
  if (sub.metadata?.[removedKey(removal)]) notes.push('seat already removed')
  else if (!item || qty <= 1) return `done: ${qty} seat(s) on the plan, none removed`
  else {
    await stripe.subscriptions.update(subId, {
      items: [{ id: item.id, quantity: qty - 1 }], proration_behavior: 'none',
      metadata: { [removedKey(removal)]: String(actioned) },
    }, { idempotencyKey: `seat-remove-${subId}-${removal}` })
    notes.push(`seats ${qty} → ${qty - 1}`)
  }

  // Paid invoices whose period was still running when the request was actioned, newest first (Stripe's order).
  const invoices = (await stripe.invoices.list({ subscription: subId, status: 'paid', limit: 12, expand: ['data.payments'] }))
    .data.filter(inv => (inv.lines?.data?.[0]?.period?.end ?? 0) > actioned)
  const done = new Set<number>()   // billing periods (by end) this removal has a refund in, or was settled for
  const found: { inv: Stripe.Invoice; target: Target; prior: Awaited<ReturnType<typeof refundedOn>> }[] = []
  for (const inv of invoices) {
    const target = paymentOf(inv)
    const prior = await refundedOn(stripe, target)
    if (prior.seats.includes(removal)) done.add(inv.lines.data[0].period.end)
    found.push({ inv, target, prior })
  }
  let refunded = 0
  for (const { inv, target, prior } of found) {
    const { start, end } = inv.lines.data[0].period
    if (done.has(end) || prior.settled) continue
    const seatAdd = inv.billing_reason === 'subscription_update'
    const seatsOnIt = seatAdd ? 1 : inv.lines.data.reduce((n, l) => n + (l.quantity ?? 0), 0) - 1
    if (prior.seats.length >= seatsOnIt) continue
    const extra = LADDER[end - start > 40 * DAY ? 'annual' : 'monthly'].extra
    const share = Math.min(seatAdd ? inv.amount_paid : extra, inv.amount_paid - prior.seatPaid)
    if (share <= 0) continue
    done.add(end)
    const want = unusedCents({ paid: share, start, end, paidAt: inv.status_transitions?.paid_at ?? 0, actioned })
    if (want <= 0) { notes.push(`${inv.id}: no full day left`); continue }
    await stripe.refunds.create(
      { ...target, amount: want, reason: 'requested_by_customer',
        metadata: { why: 'seat_removed', subscription: subId, removal, seat_paid: String(share) } },
      { idempotencyKey: `seat-refund-${subId}-${removal}-${inv.id}` },
    )
    refunded += want
    notes.push(`${inv.id} refunded ${want} of ${share}`)
  }
  if (!notes.includes('seat already removed') || refunded > 0) {
    await emailCustomer(stripe, sub, renderSeatRemoved(refunded), `billing-seat-${removal}`, notes)
  }
  return `done: refunded ${refunded}; ${notes.join('; ')}`.slice(0, 500)
}

/** Rows still owed in a queue; null if its migration is not applied yet (PGRST202). */
async function dueIn<T>(fn: string): Promise<T[] | null> {
  try { return await rpc<T[]>(fn, {}) } catch (e) {
    if ((e as RpcError)?.code === 'PGRST202') return null
    throw e
  }
}

/** Settle every queued cancellation (close, withdraw-all, the last child) and then every queued seat removal (one
 *  child of several). Returns how many were due; null if the close queue does not exist yet (PGRST202). */
export async function drainBillingCancellations(): Promise<number | null> {
  const due = await dueIn<{ stripe_subscription_id: string; queued_at: string }>('billing_cancellations_due')
  if (due === null) return null
  const seats = (await dueIn<{ id: string; stripe_subscription_id: string; queued_at: string; superseded: boolean }>('billing_seat_removals_due')) ?? []
  if (!due.length && !seats.length) return 0
  let stripe: Stripe | null = null, why = 'STRIPE_SECRET_KEY is not set'
  try { stripe = stripeClient() } catch (e) { why = e instanceof Error ? e.message : String(e) }
  let failed = 0
  const settle = async (work: () => Promise<string>) => {
    try {
      if (!stripe) throw new Error(why)
      return await work()
    } catch (e) {
      failed++
      return `error: ${e instanceof Error ? e.message : String(e)}`.slice(0, 500)
    }
  }
  for (const row of due) {
    const result = await settle(() => cancelAndRefund(stripe!, row.stripe_subscription_id, row.queued_at))
    await rpc('billing_cancellation_record', { p_subscription_id: row.stripe_subscription_id, p_result: result })
  }
  // After the closes: a seat whose plan is queued whole was refunded with the plan (`refundedOn` counts only real refunds).
  for (const row of seats) {
    const result = row.superseded ? 'done: the whole plan was cancelled and refunded instead'
      : await settle(() => removeSeatAndRefund(stripe!, row.stripe_subscription_id, row.id, row.queued_at))
    await rpc('billing_seat_removal_record', { p_id: row.id, p_result: result })
  }
  if (failed) console.error(`[billing] cancel/refund not done for ${failed} of ${due.length + seats.length}; retried next drain, flagged in the ops digest`)
  return due.length + seats.length
}
