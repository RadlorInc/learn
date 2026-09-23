/**
 * The words a parent sees after cancelling — on screen and in the confirmation email — in one place,
 * so the app and the email cannot tell them two different end dates.
 *
 * What they promise is what the build does (docs/legal/01 §4, docs/legal/12 §5): Stripe is told
 * `cancel_at_period_end: true`, so no further charge is made and the plan runs to the end of the
 * period already paid for. No refund is issued by cancelling; refunds are §5 of doc 01, by email.
 */

/** The period end as a date a parent reads. UTC, because it is the instant Stripe would have renewed. */
export const endDate = (iso: string | null): string | null =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : null

export const endsLine = (iso: string | null): string => {
  const d = endDate(iso)
  return d
    ? `Your plan ends on ${d}. You will not be charged again.`
    : 'Your plan ends at the end of the period you have paid for. You will not be charged again.'
}

/** docs/legal/09-email-compliance.md §5 — the standard transactional footer, verbatim. */
export const TRANSACTIONAL_FOOTER = [
  'This is a service message about your Milo account.',
  '',
  'Radlor Inc.',
  '254 Chapman Rd, Ste 208 #28608, Newark, DE 19702',
  'Questions: support@radlor.com',
].join('\n')

export function renderCancelled(endsIso: string | null): { subject: string; html: string; text: string } {
  const lines = [
    'Your Milo subscription is cancelled.',
    endsLine(endsIso),
    'Your account and your children’s profiles stay open. Cancelling does not delete anything; to delete your data, use Close your account in the app or write to support@radlor.com.',
    'Cancelling does not issue a refund by itself. Our Refund and Cancellation Policy explains when one is available: https://adaptivelearn.radlor.com/legal/refunds',
  ]
  const text = [...lines, TRANSACTIONAL_FOOTER].join('\n\n')
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const html =
    `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#2b2118;max-width:560px">` +
    lines.map(l => `<p style="margin:0 0 14px">${esc(l)}</p>`).join('') +
    `<p style="margin:22px 0 0;font-size:13px;color:#7a6a58;white-space:pre-line">${esc(TRANSACTIONAL_FOOTER)}</p></div>`
  return { subject: 'Your Milo subscription is cancelled', html, text }
}
