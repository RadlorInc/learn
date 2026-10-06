/**
 * The two emails a subscription owes a parent under the Refund and Cancellation Policy (docs/legal/01 §3):
 *   · the acknowledgement, sent when the subscription starts — its terms, the renewal, and how to cancel
 *     (docs/legal/03 A3; California's Automatic Renewal Law asks for exactly this after the purchase);
 *   · the reminder before an ANNUAL renewal, sent when Stripe's `invoice.upcoming` arrives (set to 30 days ahead in
 *     the Stripe dashboard). Monthly plans get none: the policy promises it for annual renewals only.
 *
 * A3's draft also says "You also gave permission for us to collect information from your child". It is left out:
 * consent is the separate email-plus flow, not part of checkout, so at checkout it would not be true.
 * The cancel path is the one the policy (§4) and the app name. Amounts are what Stripe charged or will charge.
 */
import { TRANSACTIONAL_FOOTER, endDate } from './cancelNotice'

type Rendered = { subject: string; html: string; text: string }

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`
const children = (n: number) => `${n} ${n === 1 ? 'child' : 'children'}`
const HOW_TO_CANCEL =
  'How to cancel: sign in and go to Account → Plan & billing → See plans → Cancel subscription, or email support@radlor.com. ' +
  'Cancelling stops all future charges. Your plan continues until the end of the period you have paid for.'
const POLICY = 'Our Refund and Cancellation Policy: https://radlic.com/legal/refunds'

function render(subject: string, lines: string[]): Rendered {
  const text = [...lines, TRANSACTIONAL_FOOTER].join('\n\n')
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const html =
    `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#083D85;max-width:560px">` +
    lines.map(l => `<p style="margin:0 0 14px">${esc(l)}</p>`).join('') +
    `<p style="margin:22px 0 0;font-size:13px;color:#3D6FB8;white-space:pre-line">${esc(TRANSACTIONAL_FOOTER)}</p></div>`
  return { subject, html, text }
}

export function renderSubscribed(a: {
  chargedCents: number; renewalCents: number; interval: 'month' | 'year'; renewsIso: string | null; seats: number
}): Rendered {
  const every = a.interval === 'year' ? 'every 12 months' : 'every month'
  const on = endDate(a.renewsIso)
  return render('Your Radlic subscription — confirmation and how to cancel', [
    'Your Radlic subscription is active. Here are the details, for your records.',
    `Plan: Radlic Family, for ${children(a.seats)}.`,
    `Charged today: ${usd(a.chargedCents)}.`,
    `Renews: automatically, ${every}${on ? `, next on ${on}` : ''}. Renewal amount: ${usd(a.renewalCents)} (we do not charge sales tax).`,
    HOW_TO_CANCEL,
    POLICY,
  ])
}

export function renderRenewalReminder(a: { amountCents: number; renewsIso: string | null; seats: number }): Rendered {
  const on = endDate(a.renewsIso)
  return render('Your Radlic annual subscription renews soon', [
    `Your Radlic annual subscription for ${children(a.seats)} renews automatically${on ? ` on ${on}` : ' at the end of this year'}.`,
    `You will be charged ${usd(a.amountCents)} for the next 12 months.`,
    `If you do not want to continue, cancel before that date. ${HOW_TO_CANCEL}`,
    POLICY,
  ])
}

/** After "Close your account" or "Withdraw permission for all your children" (docs/legal/01 §4, §5): the plan stops
 *  today, not at period end, and the unused part is refunded. Sent by `drainBillingCancellations`. */
export function renderCancelledNow(refundCents: number): Rendered {
  return render('Your Radlic subscription is cancelled', [
    'Your Radlic subscription is cancelled from today. You will not be charged again.',
    refundCents > 0
      ? `We have refunded ${usd(refundCents)}, the part of your plan you had not used. It reaches your card within 10 business days.`
      : 'There is no unused part of your plan left to refund.',
    POLICY,
  ])
}
