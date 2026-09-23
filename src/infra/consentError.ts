/**
 * THE CLIENT HALF OF THE CONSENT GATE'S ERROR CONTRACT.
 *
 * ⚠️ WHY THIS EXISTS AT ALL. Before the gate was built, `analytics.ts` treated EVERY write failure
 * as transient: `if (error) return 0 // keep queued; try again later`. That is right for a dropped
 * connection and catastrophic for a consent refusal — the row can never be accepted, so the queue
 * would retry it for ever, no error would reach any screen or log, and a parent would watch their
 * child use an app that was saving nothing. Measured before this was written; it is the reason the
 * database raises a DISTINCT SQLSTATE rather than a generic one.
 *
 * ⚠️ `P0C01` IS A CONTRACT WITH `supabase/migrations/20260923120000_parental_consent.sql`. Both
 * ends are asserted together in `consentSurfaces.test.ts` — change one and that gate goes red.
 * PostgREST passes `code` through to the browser untouched, which is what makes this work at all.
 */
export const CONSENT_SQLSTATE = 'P0C01'

/**
 * True only for "this child has no granted consent". Deliberately NOT a message-substring match:
 * wording is edited, and a check that reads prose would start silently classifying refusals as
 * network blips the first time somebody rewords the raise.
 */
export function isConsentRefusal(error: unknown): boolean {
  return typeof error === 'object' && error !== null
    && (error as { code?: unknown }).code === CONSENT_SQLSTATE
}
