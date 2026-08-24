'use client'
/**
 * The diagnostic's half-finished run — DURABLE, per learner.
 *
 * ⚠️⚠️ THIS WAS sessionStorage UNTIL 2026-08-24, AND THE ARGUMENT FOR IT IS WORTH ANSWERING RATHER
 * THAN DELETING. It read: *a check abandoned days ago should start fresh (the child has moved on),
 * and a half-finished probe is not a result.* Both were true when the probe was short. It is now
 * 20–50 questions (accuracy over length, 2026-08-22), so "abandoned" stopped meaning "lost
 * interest" and started meaning "ran out of evening" — and starting from zero is then the most
 * expensive thing we can do to somebody who already answered thirty questions.
 *
 * The staleness concern is real and is answered with a TTL rather than by throwing the run away:
 * seven days, long enough for "tomorrow", short enough that a child has not moved on underneath it.
 *
 * ⚠️ THE KEY CARRIES THE LEARNER, so a sibling can no longer overwrite a sibling's run — which the
 * single global key did. That also makes the old `learner` equality check INERT (the record is
 * looked up BY that learner, so it cannot differ), and an inert clause reads as protection. The
 * field stays in the record for the save path; the check is gone.
 *
 * Two storage layers on purpose, and they answer different questions:
 *   · `kv` (IndexedDB) — WHAT the run was. Survives the tab, the browser, the night.
 *   · `sessionStorage` TAB_KEY — whether THIS TAB is the one that was mid-run. A same-tab reload
 *     resumes silently (the child never left); a new sitting gets OFFERED the resume, because
 *     dropping somebody into question 26 of a run they may not remember, with no route to a fresh
 *     check, is a dead end.
 */
import { kv } from '@/infra/storage/kv'
import type { ProbeState } from '@/core/diagnosticEngine'
import type { Band } from '@/core/skillGraph'

export const RESUME_TTL_MS = 7 * 24 * 60 * 60 * 1000
const TAB_KEY = 'milo_diag_tab'
const BANDS: string[] = ['3-5', '6-8', '9-11', '12-14', '15-16', '17-18']

export const resumeKey = (learnerId: string | null) => `milo-diag-resume-${learnerId ?? 'anon'}`

export interface DiagResume {
  band: Band; s: ProbeState; attempt: number; learner: string | null; savedAt: number
}

/** Is THIS tab the one that was mid-run? */
export function sameTab(): boolean {
  try { return sessionStorage.getItem(TAB_KEY) === '1' } catch { return false }
}

export function saveResume(learnerId: string | null, band: Band, s: ProbeState, attempt: number, now = Date.now()): void {
  try {
    kv.set(resumeKey(learnerId), JSON.stringify({ band, s, attempt, learner: learnerId, savedAt: now }))
    sessionStorage.setItem(TAB_KEY, '1')
  } catch { /* private mode / quota: a resume is a nicety, never a blocker */ }
}

export function readResume(learnerId: string | null, now = Date.now()): DiagResume | null {
  try {
    const r = JSON.parse(kv.get(resumeKey(learnerId)) || 'null')
    // Guard the shape: a stale or garbled entry must not crash the page a child is trying to start.
    if (!r || !BANDS.includes(r.band) || !Array.isArray(r.s?.asked)) return null
    // ⚠️ A MISSING `savedAt` IS EXPIRED, NOT FRESH. Anything written before the TTL existed carries
    // no timestamp, and reading an absent one as "now" would make the OLDEST runs the most durable.
    if (typeof r.savedAt !== 'number' || now - r.savedAt > RESUME_TTL_MS) return null
    return r as DiagResume
  } catch { return null }
}

export function clearResume(learnerId: string | null): void {
  try { kv.remove(resumeKey(learnerId)); sessionStorage.removeItem(TAB_KEY) } catch { /* nothing to clear */ }
}

/**
 * ⚠️ A RESUME IS NOT ALWAYS THE RIGHT ANSWER. Caught by driving it: with a 6–8 probe mid-flight,
 * opening `/diagnostic?band=12-14` restored the 6–8 run and ignored the URL entirely — a parent
 * following a band-specific link got half-finished questions from another check with nothing on
 * screen saying so. An explicit `?band=` is a deliberate instruction and a resume is a convenience,
 * so the instruction wins. (The sibling half of that rule now lives in the KEY — see above.)
 */
export function resumable(r: DiagResume | null, urlBand: string | null): boolean {
  return !!r && (!urlBand || urlBand === r.band)
}
