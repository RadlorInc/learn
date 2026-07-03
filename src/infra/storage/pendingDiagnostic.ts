/**
 * Pending diagnostic — carries a diagnostic result taken by a LOGGED-OUT parent (the cold-traffic
 * front door) through sign-up, so it can be saved against the learner they create right after.
 *
 * Flow: /diagnostic report (no active learner) → "Save this plan, create a free account" stashes the
 * result here → /auth → parent creates a learner → parent page replays it via saveDiagnostic(). This
 * is the capture-at-peak-intent step: the highest-emotion moment (the report) becomes the signup.
 *
 * The replay only fires when the created learner's age band matches the diagnostic's band (a 9–11 plan
 * is meaningless on a 3–5 learner). So the consume is a PEEK-then-CONSUME-on-match handshake, NOT a
 * blind one-shot read: a band MISMATCH must LEAVE the result stashed (the parent may be adding a
 * different-aged sibling first, then the diagnosed child) — otherwise the capture is silently lost and
 * unrecoverable. A TTL guards against a months-old stash wrongly attaching to an unrelated new learner.
 */
import type { DiagnosticPayload } from '@/data/repositories'

const KEY = 'milo_pending_diagnostic'
const TTL_MS = 14 * 24 * 60 * 60 * 1000   // 14 days — long enough to survive a delayed signup, short enough to not resurrect stale captures
/** Everything saveDiagnostic needs except the learnerId (assigned once the learner is created). */
export type PendingDiagnostic = Omit<DiagnosticPayload, 'learnerId'> & { childName?: string }
interface StoredPending extends PendingDiagnostic { savedAt?: number }

export function stashPendingDiagnostic(p: PendingDiagnostic): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...p, savedAt: Date.now() } satisfies StoredPending)) } catch { /* storage unavailable — non-fatal */ }
}

/** Read the raw stored record if present and not expired; clears + returns null when stale. */
function readFresh(): StoredPending | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as StoredPending
    if (p.savedAt != null && Date.now() - p.savedAt > TTL_MS) { localStorage.removeItem(KEY); return null }
    return p
  } catch { return null }
}

/** Read WITHOUT clearing — lets the caller decide whether it actually matches before consuming it.
 *  This is what prevents silent capture loss on a band mismatch. */
export function peekPendingDiagnostic(): PendingDiagnostic | null {
  return readFresh()
}

/** Read + CLEAR the pending diagnostic (one-shot, so a stale result never replays twice).
 *  Call this ONLY once you've confirmed the result is being consumed (a band match). */
export function takePendingDiagnostic(): PendingDiagnostic | null {
  const p = readFresh()
  if (p) { try { localStorage.removeItem(KEY) } catch { /* ignore */ } }
  return p
}

export function clearPendingDiagnostic(): void {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

export function hasPendingDiagnostic(): boolean {
  return readFresh() != null
}
