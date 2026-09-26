'use client'
/**
 * What happens when a 3–8 story chapter finishes.
 *
 * ⚠️⚠️ SINCE 2026-09-20 A CHAPTER RECORDS ITSELF EXACTLY AS A NEW-FLOW TOPIC DOES — founder's call,
 * *"unke data ka collection same abhi joh modules waalo ka hai wohi kardo"*. One row per chapter in
 * `lesson_progress` (keyed `c:<chapter>`, see `chapterKey`), points awarded by the database from
 * what changed, uploads queued by `lessonSync` and retried until they land.
 *
 * What went with it: `syncSession` and the `sessions` / `learner_progress` / `learner_stats` rows,
 * the XP / coins / stars economy in the zustand store, and the separate offline session queue. All
 * four were emptied in production on 2026-09-17 (`20260917112252`) and were being written to by
 * nobody else — two parallel progress systems, which is what this removes.
 *
 * The per-ANSWER half lives in `shared/hooks/useAdaptive`, the one function every chapter's every
 * answer already passes through. This hook owns only the end of the run: the chapter is `done`, and
 * the plan pointer moves.
 */

import { useCallback } from 'react'
import { ChapterType } from '@/data/supabase/types'
import { chapterKey } from '@/core/chapters'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { markLessonDone } from '@/infra/storage/lessonProgress'
import { loadStanding } from '@/infra/storage/lessonStanding'
import { saveStanding } from '@/infra/storage/lessonStanding'
import { syncLesson, flushLessonSync } from '@/infra/storage/lessonSync'
import { FRESH } from '@/features/lessons/adaptive'
import { advanceAfterChapter } from '@/infra/storage/activePlan'
import { track } from '@/infra/analytics'

export function useChapterSync(_chapter?: ChapterType) {
  const finishAndSync = useCallback(async (
    chapter:  ChapterType,
    correct:  number,
    wrong:    number,
    phase:    'lesson' | 'practice' = 'practice',
    mastered = false,
  ) => {
    // No learner = nobody to record to — the same early return this function has always had.
    const learner = getActiveLearner()
    if (!learner) return

    const key = chapterKey(chapter)

    /**
     * ⚠️ THE PLAN POINTER FIRST, BEFORE ANYTHING THAT CAN AWAIT. It is local and must advance for a
     * child playing offline. It used to live in `/game`'s `handleComplete`, which was never invoked
     * — both registry factories dropped the prop — so chapters scored and no plan ever moved.
     * ⚠️ PRACTICE ONLY: a lesson completion is not a plan step.
     * ⚠️ BEST-EFFORT: bookkeeping must never cost a child the progress recorded below.
     */
    if (phase === 'practice') {
      try {
        track('practice_complete', { chapter, correct, wrong, mastered })
        advanceAfterChapter(learner.id, chapter)
      } catch { /* never let bookkeeping undo the run */ }
    }

    /**
     * `done` is the chapter's "lesson_done" — worth its once-only bonus the first time, and once
     * only in the DATABASE rather than in a flag a re-play could clear. `mastered` is carried from
     * the run itself (the early finish at the top tier), which is stronger evidence than the
     * standing's own last answer.
     */
    markLessonDone(learner.id, key)
    const standing = loadStanding(learner.id, key) ?? FRESH
    if (mastered && !standing.mastered) saveStanding(learner.id, key, { ...standing, mastered: true })
    syncLesson(learner.id, key)
    await flushLessonSync()
  }, [])

  // `/game` mounts this hook only to drain the queue on open, exactly as it did before.
  const flushQueue = useCallback(async () => { await flushLessonSync() }, [])

  return { finishAndSync, flushQueue }
}
