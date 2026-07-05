'use client'
/**
 * Per-learner, per-chapter DIFFICULTY MEMORY.
 *
 * The adaptive engine ramps easy→medium→hard within a single sitting and can end
 * the chapter early once a child masters the top tier. Without memory, every
 * replay restarts at EASY — so a child who last left off at medium has to grind
 * back up through easy questions, and the harder questions they were ready for
 * get pushed off the end again.
 *
 * We fix that by remembering the difficulty a child was on when they last stopped
 * a chapter (saved on every scored answer, so it's always the level they left at).
 * The next attempt STARTS at that level and climbs from there — the child resumes
 * at a difficulty that already matches them.
 *
 * Storage is the per-device kv (IndexedDB, localStorage fallback), keyed by
 * learner + chapter. No learner (e.g. the logged-out preview) → no memory, so it
 * always starts at easy — behaviour is unchanged there.
 */
import type { ChapterType } from '@/data/supabase/types'
import { kv } from '@/infra/storage/kv'

type Difficulty = 1 | 2 | 3

const key = (learnerId: string, chapter: ChapterType) => `milo-chlvl-${learnerId}-${chapter}`

/** The difficulty to START this chapter at (the level the child left off on), or 1. */
export function getChapterLevel(learnerId: string | undefined | null, chapter: ChapterType): Difficulty {
  if (!learnerId) return 1
  try {
    const raw = kv.get(key(learnerId, chapter))
    const n = raw ? parseInt(raw, 10) : 1
    return n === 3 ? 3 : n === 2 ? 2 : 1
  } catch {
    return 1
  }
}

/** Remember the difficulty the child is on now (call after each scored answer). */
export function setChapterLevel(learnerId: string | undefined | null, chapter: ChapterType, level: Difficulty): void {
  if (!learnerId) return
  try {
    kv.set(key(learnerId, chapter), String(level))
  } catch {
    /* best-effort */
  }
}
