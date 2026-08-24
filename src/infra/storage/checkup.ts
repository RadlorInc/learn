'use client'
/**
 * Checkup state — has THIS child done their checkup, and if not, have we already asked?
 *
 * ⚠️⚠️ THE CHECK WAS MANDATORY UNTIL 2026-08-24 AND IS NOW OPTIONAL. Founder's call, and the reason
 * is worth keeping because the earlier decision was argued the other way: forcing it was defensible
 * while a MIDDLE option existed (a shorter check). Measuring the short pass removed that option —
 * it misses a third to a half of gaps in the bands where it saves any time, and 17–18 has none at
 * all — so the real choice became "20–50 questions or nothing", and 20–50 questions between a
 * parent and their first look at the product is the worse trade.
 *
 * ⚠️ OPTIONAL MUST NOT MEAN PLANLESS. Skipping issues a `gradeStartPlan` (the band from the
 * beginning); the child is never dropped into a 72-chapter menu to fend for themselves.
 *
 * Source of truth is the DB (a diagnostic_sessions row for the learner — their account), with a local
 * cache for an instant gate. cache-first → falls back to the DB (which also re-populates the cache),
 * so the checkup follows a child across devices: a parent logging in on a NEW device passes the gate
 * from their account without retaking. On-track children (a completed checkup with no gap) still count
 * as "done" — getLatestGap returns a row for them too.
 */
import { getLatestGap } from '@/data/repositories'

const key = (learnerId: string) => `milo_checkup_done_${learnerId}`

/** Mark a child's checkup complete on this device (called when a diagnosis is persisted). */
export function markCheckupDone(learnerId: string): void {
  if (!learnerId) return
  try { localStorage.setItem(key(learnerId), '1') } catch { /* storage unavailable */ }
}

/** Instant, synchronous cache read — used to gate without a round-trip when we already know. */
export function isCheckupCached(learnerId: string): boolean {
  try { return localStorage.getItem(key(learnerId)) === '1' } catch { return false }
}

/** Authoritative check: cache first, then the account (DB). A DB hit re-populates the cache so the
 *  next gate on this device is instant. Returns false when signed out / no session found. */
export async function hasCheckup(learnerId: string): Promise<boolean> {
  if (!learnerId) return false
  if (isCheckupCached(learnerId)) return true
  const gap = await getLatestGap(learnerId)   // non-null ⇒ a diagnostic_sessions row exists for this child
  if (gap) { markCheckupDone(learnerId); return true }
  return false
}

export function clearCheckupCache(learnerId: string): void {
  try { localStorage.removeItem(key(learnerId)) } catch { /* ignore */ }
}

// ── The offer: asked, skipped, and how many times ────────────────────────────
const skipKey = (learnerId: string) => `milo_checkup_skips_${learnerId}`

/**
 * How many times this child's parent has been offered the check and passed on it.
 * 0 = never asked (or they took it) · 1 = skipped at signup, re-offer once · 2+ = never interrupt.
 */
export function checkupSkips(learnerId: string): number {
  if (!learnerId) return 0
  try { return parseInt(localStorage.getItem(skipKey(learnerId)) || '0', 10) || 0 } catch { return 0 }
}

/** Record a skip. Returns the new count. */
export function recordCheckupSkip(learnerId: string): number {
  const n = checkupSkips(learnerId) + 1
  try { localStorage.setItem(skipKey(learnerId), String(n)) } catch { /* storage unavailable */ }
  return n
}

/**
 * Should the parent be re-offered the check? ONCE, and only with evidence behind the ask: after the
 * child has finished a plan chapter, the parent has seen something work and is a different person
 * from the one who skipped at signup. A second decline retires it to the parent dashboard
 * (`findStartingPoint`), which is always there and never interrupts.
 */
export function shouldReoffer(learnerId: string, planChaptersDone: number): boolean {
  return checkupSkips(learnerId) === 1 && planChaptersDone >= 1
}

/**
 * ⚠️ THE SKIP IS DEVICE-LOCAL ON PURPOSE, and the cross-device hole closes itself. A parent who
 * skips on a phone and opens a tablet before the child plays anything is offered it again — one
 * tap, no harm. The moment the child plays ANY chapter, `isEstablished` is true on every device and
 * the offer never appears again, so the only exposed window is "skipped and played nothing yet".
 * Syncing it would mean a second write path that can disagree with the first, for that window.
 */
export function checkupSettled(learnerId: string): boolean {
  return isCheckupCached(learnerId) || checkupSkips(learnerId) > 0
}
