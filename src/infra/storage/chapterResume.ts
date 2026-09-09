'use client'
/**
 * Per-learner, per-chapter MID-CHAPTER RESUME — where in the practice run the child was.
 *
 * ⚠️ WHY THIS EXISTS, AND WHY IT IS NOT MERELY A CONVENIENCE. A scored run reports NOTHING until
 * it finishes: `SkillBeat` calls `onComplete` once, at the end, and that single call is what writes
 * the session row, the stars and the XP. So a child who answered seven of ten questions and then
 * wandered off to another part of the site did not just lose their PLACE — they lost the seven
 * answers, the stars and the XP with them, and every screen showed the chapter as never played.
 * Reported by a student, 2026-08-27: *"none of my progress saved and I had to restart"*.
 *
 * `chapterLevel` already remembers the DIFFICULTY across sittings; this is its companion and
 * deliberately a separate key, because the two have opposite lifetimes. A tier is the child's
 * current fit and outlives any number of completed runs; a resume point describes ONE unfinished
 * run and must be destroyed the moment that run ends, or the next replay opens at question 8 of a
 * chapter nobody has started.
 *
 * Saved after every scored answer rather than on the way out, for the same reason the tier is:
 * there is no exit event for a closed tab, a killed app, or a flat battery, and those are exactly
 * the cases the child described.
 *
 * ⚠️ EXPIRES. A run abandoned a fortnight ago is not a run anybody is coming back to, and dropping
 * a returning child into the middle of a chapter they have forgotten is worse than restarting it.
 * Seven days, matching the diagnostic's own resume window.
 *
 * No learner (the logged-out /story and /demo previews) → nothing is stored and nothing resumes,
 * exactly as before.
 */
import type { ChapterType } from '@/data/supabase/types'
import { kv } from '@/infra/storage/kv'

const TTL_MS = 7 * 24 * 60 * 60 * 1000

/** One unfinished practice run. Short field names: this is written after every single answer. */
export interface ChapterResume {
  /** The next round to play — i.e. how many have been answered. */
  round: number
  correct: number
  wrong: number
  /** Question signatures already asked, so a resumed run does not re-ask one. */
  seen: string[]
  /** Coverage members already asked, so the mastery exit still cannot skip the closed set. */
  asked: string[]
  /** When it was written, for the TTL above. */
  at: number
}

const key = (learnerId: string, chapter: ChapterType) => `milo-chres-${learnerId}-${chapter}`

/** The unfinished run to resume, or null. Expired and malformed records read as null. */
export function getChapterResume(
  learnerId: string | undefined | null,
  chapter: ChapterType,
): ChapterResume | null {
  if (!learnerId) return null
  try {
    const raw = kv.get(key(learnerId, chapter))
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<ChapterResume>
    // A round of 0 is not a resume — nothing has been answered, so there is nothing to come back to.
    if (typeof v.round !== 'number' || v.round < 1) return null
    if (typeof v.at !== 'number' || Date.now() - v.at > TTL_MS) return null
    return {
      round: v.round,
      correct: typeof v.correct === 'number' ? v.correct : 0,
      wrong: typeof v.wrong === 'number' ? v.wrong : 0,
      seen: Array.isArray(v.seen) ? v.seen.filter(s => typeof s === 'string') : [],
      asked: Array.isArray(v.asked) ? v.asked.filter(s => typeof s === 'string') : [],
      at: v.at,
    }
  } catch {
    return null
  }
}

/** True if this chapter has an unfinished run — what a chapter asks to decide it opens at practice. */
export function hasChapterResume(
  learnerId: string | undefined | null,
  chapter: ChapterType,
): boolean {
  return getChapterResume(learnerId, chapter) !== null
}

/** Remember where the run is now. Call after every scored answer. */
export function setChapterResume(
  learnerId: string | undefined | null,
  chapter: ChapterType,
  run: Omit<ChapterResume, 'at'>,
): void {
  if (!learnerId) return
  try {
    kv.set(key(learnerId, chapter), JSON.stringify({ ...run, at: Date.now() }))
  } catch {
    /* best-effort */
  }
}

/**
 * Forget the run. Call the instant one ENDS — completed, mastered early, or abandoned by the child
 * choosing to start over. Leaving it behind is the one failure mode that is worse than not having
 * this at all: every future replay of a finished chapter would open near its end.
 */
export function clearChapterResume(
  learnerId: string | undefined | null,
  chapter: ChapterType,
): void {
  if (!learnerId) return
  try {
    kv.remove(key(learnerId, chapter))
  } catch {
    /* best-effort */
  }
}
