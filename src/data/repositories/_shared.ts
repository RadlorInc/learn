'use client'

/**
 * Shared internals for the repository layer. NOT part of the public API —
 * the barrel (index.ts) does not re-export `db` or `classifySyncError`.
 */
import { createClient } from '@/data/supabase/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function db(): any {
  return createClient()
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
const NON_RETRYABLE_CODES = new Set([
  '23503', // foreign_key_violation     — learner_id not in learners
  '42501', // insufficient_privilege    — RLS: not owned by this account
  '23502', // not_null_violation
  '23514', // check_violation
  '22P02', // invalid_text_representation — malformed uuid
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
