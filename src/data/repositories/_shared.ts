'use client'

/**
 * Shared internals for the repository layer. NOT part of the public API —
 * the barrel (index.ts) does not re-export `db` or `classifySyncError`.
 */
import { createClient } from '@/data/supabase/client'
import { CONSENT_SQLSTATE, isConsentRefusal } from '@/infra/consentError'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function db(): any {
  return createClient()
}

/**
 * After a deletion that may have ended a granted consent — "Delete <name>'s profile", "Close your
 * account" — ask the server to cancel the queued B3 ("Yesterday you gave permission…") now rather
 * than at the daily backstop. The DATABASE captured the email's id in the deletion's own transaction
 * (20260923200000), so nothing is lost if this call fails; it only decides how soon. Never throws.
 */
export async function cancelQueuedSecondNotices(): Promise<void> {
  try { await fetch('/api/consent/cancel-second-notice', { method: 'POST' }) } catch { /* the cron retries */ }
}

/**
 * Outcome of a sync attempt:
 *  - 'ok'    — saved (or already saved); remove from any queue
 *  - 'retry' — transient failure (network/server); keep queued and try later
 *  - 'drop'  — permanent failure (the row can never be accepted, e.g. the learner
 *              no longer exists or isn't owned by this account); discard the item
 *              so it doesn't loop forever in the offline queue
 */
export type SyncOutcome = 'ok' | 'retry' | 'drop'

// SQLSTATE codes that a retry can never fix — the payload is fundamentally
// rejected (missing FK target, RLS denial, bad data), not a transient hiccup.
// ⚠️ 42501 is only permanent for the account the item BELONGS to: a queue must never send another account's item
// (or send with no session), or this drops it (BUG-01). lessonSync.ts sends only the signed-in owner's items.
const NON_RETRYABLE_CODES = new Set([
  '23503', // foreign_key_violation     — learner_id not in learners
  '42501', // insufficient_privilege    — RLS: not owned by this account
  '23502', // not_null_violation
  '23514', // check_violation
  '22P02', // invalid_text_representation — malformed uuid
  // No granted parental consent for this child (the consent gate). Kept as 'retry' it stalled every later upload on the
  // device behind it (BUG-04); dropped, as analytics.ts drops it, the device keeps its own copy of the progress.
  CONSENT_SQLSTATE,
])

export function classifySyncError(error: { code?: string; message?: string }): SyncOutcome {
  const code = error?.code ?? ''
  if (code === '23505') return 'ok'               // unique_violation → already recorded
  if (NON_RETRYABLE_CODES.has(code)) return 'drop'
  // Fallback for drivers that don't surface a SQLSTATE on the error object.
  const msg = (error?.message ?? '').toLowerCase()
  if (msg.includes('foreign key') || msg.includes('row-level security')) return 'drop'
  return 'retry'
}

/**
 * What a failure means to the PERSON on the screen (BUG-10) — distinct from `classifySyncError`, which decides what a
 * queue does. "Check your connection" is only honest for 'network'; the others are known NOT to be the Wi-Fi:
 *  - 'consent' — P0C01, the child has no granted consent (the consent gate refused the write)
 *  - 'denied'  — 42501 / RLS: this account may not do this
 *  - 'expired' — the sign-in token is no longer accepted (PGRST301/PGRST303, HTTP 401, "JWT expired")
 *  - 'network' — the request never got an answer (fetch threw)
 *  - 'other'   — none of the above is known; callers keep their old wording for it.
 */
export type ErrorKind = 'network' | 'expired' | 'consent' | 'denied' | 'other'

export function classifyUserError(error: unknown): ErrorKind {
  if (isConsentRefusal(error)) return 'consent'
  const e = (typeof error === 'object' && error !== null ? error : {}) as { code?: unknown; message?: unknown; status?: unknown; name?: unknown }
  const code = String(e.code ?? ''), msg = String(e.message ?? '')
  if (code === '42501' || /row-level security/i.test(msg)) return 'denied'
  if (code === 'PGRST301' || code === 'PGRST303' || e.status === 401 || /jwt expired/i.test(msg)) return 'expired'
  // supabase-js reports a fetch that threw either by rethrowing it or as `{ message: 'TypeError: Failed to fetch', code: '' }`.
  if (e.name === 'AuthRetryableFetchError' || /failed to fetch|networkerror|load failed|network request failed/i.test(msg)) return 'network'
  return 'other'
}
