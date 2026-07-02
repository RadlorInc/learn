'use client'
/**
 * Checkup gate — the diagnostic ("checkup") is a MANDATORY, once-per-child step before a learner can
 * play. This module answers "has THIS child done their checkup?" for the gate.
 *
 * Source of truth is the DB (a diagnostic_sessions row for the learner — their account), with a local
 * cache for an instant gate. cache-first → falls back to the DB (which also re-populates the cache),
 * so the checkup follows a child across devices: a parent logging in on a NEW device passes the gate
 * from their account without retaking. On-track children (a completed checkup with no gap) still count
 * as "done" — getLatestGap returns a row for them too.
 */
import { getLatestGap } from './supabase/queries'

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
