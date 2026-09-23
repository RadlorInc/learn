/**
 * EVERY CONSENT TIMING, IN ONE PLACE.
 *
 * ⚠️ THE SECOND-EMAIL DELAY IS AN ENV VAR SO THE ATTORNEY CAN CHANGE IT WITHOUT A CODE CHANGE — but
 * it is not free. B3's fixed wording opens "Yesterday you gave permission…", which is only true if
 * B3 arrives a day later. So in production a delay outside [24h, 48h) is REFUSED at the moment of
 * granting, loudly, rather than sending a parent an email whose first sentence is false. Changing
 * the delay beyond a day therefore takes a wording change in docs/legal/03 as well — which is the
 * right amount of friction for a sentence in a legal notice. Outside production any delay is
 * allowed, because the end-to-end check cannot wait a day.
 */
const minutes = (name: string, fallback: number) => {
  const raw = process.env[name]
  const n = raw === undefined || raw === '' ? fallback : Number(raw)
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${name} must be a positive number of minutes, got "${raw}"`)
  return n
}

/** B3 goes out this long after the parent grants. docs/legal/03 §B3: "commonly 24 hours". */
export function secondNoticeDelayMs(): number {
  const m = minutes('CONSENT_SECOND_NOTICE_DELAY_MINUTES', 24 * 60)
  if (process.env.NODE_ENV === 'production' && (m < 24 * 60 || m >= 48 * 60)) {
    throw new Error(`CONSENT_SECOND_NOTICE_DELAY_MINUTES=${m} makes B3's "Yesterday you gave permission" ` +
      'false. Keep it in [1440, 2880) or change the wording in docs/legal/03 and src/features/consent/copy.ts first.')
  }
  return m * 60_000
}

/**
 * How long an unanswered request stays usable: SEVEN DAYS.
 *   · Long enough for a parent who is away over a weekend, or who does not check the account's
 *     inbox daily, to find the email and answer it — the same reason sign-up confirmation links
 *     are commonly valid for days, not hours.
 *   · Short enough that a link found in an old inbox months later cannot quietly grant consent to a
 *     notice that may since have changed. A late parent simply asks again, sees the current notice,
 *     and that is the version recorded.
 * After it, the row is `expired` and behaves exactly as no consent at all (see consentFlow.test.ts).
 */
export const PENDING_TTL_DAYS = 7

/** From address: radlor.com is the domain with Resend's DKIM record (`resend._domainkey`); the app's
 *  own subdomain has none, so it cannot be the sender. Replies go to a person. */
export const EMAIL_FROM = 'Milo <noreply@radlor.com>'
export const EMAIL_REPLY_TO = 'support@radlor.com'
