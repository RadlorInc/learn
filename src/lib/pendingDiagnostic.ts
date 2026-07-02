/**
 * Pending diagnostic — carries a diagnostic result taken by a LOGGED-OUT parent (the cold-traffic
 * front door) through sign-up, so it can be saved against the learner they create right after.
 *
 * Flow: /diagnostic report (no active learner) → "Save this plan, create a free account" stashes the
 * result here → /auth → parent creates a learner → parent page replays it via saveDiagnostic(). This
 * is the capture-at-peak-intent step: the highest-emotion moment (the report) becomes the signup.
 */
import type { DiagnosticPayload } from './supabase/queries'

const KEY = 'milo_pending_diagnostic'
/** Everything saveDiagnostic needs except the learnerId (assigned once the learner is created). */
export type PendingDiagnostic = Omit<DiagnosticPayload, 'learnerId'> & { childName?: string }

export function stashPendingDiagnostic(p: PendingDiagnostic): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* storage unavailable — non-fatal */ }
}

/** Read + CLEAR the pending diagnostic (one-shot, so a stale result never replays twice). */
export function takePendingDiagnostic(): PendingDiagnostic | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    localStorage.removeItem(KEY)
    return JSON.parse(raw) as PendingDiagnostic
  } catch { return null }
}

export function hasPendingDiagnostic(): boolean {
  try { return localStorage.getItem(KEY) != null } catch { return false }
}
