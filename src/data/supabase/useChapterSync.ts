'use client'
/**
 * useChapterSync
 * Wraps finishChapter — updates local store instantly,
 * syncs to Supabase in background, queues if offline.
 */

import { useCallback } from 'react'
import { ChapterType } from '@/data/supabase/types'
import { useMiloStore } from '@/state/store'
import { getChapterLevel } from '@/infra/storage/chapterLevel'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { syncSession } from '@/data/repositories'
import { enqueueSession, flushQueue } from '@/infra/useOfflineSync'
import { advanceAfterChapter } from '@/infra/storage/activePlan'
import { deeperChapter } from '@/core/diagnosticEngine'
import { track } from '@/infra/analytics'


function randomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export function useChapterSync() {
  const finishChapter = useMiloStore(s => s.finishChapter)

  const finishAndSync = useCallback(async (
    chapter: ChapterType,
    correct: number,
    wrong:   number,
    phase:   'lesson' | 'practice' = 'practice',
    mastered = false,
  ) => {
    // 1. Update local store immediately — no delay for the child.
    //    Reuse the score it just computed instead of recomputing the formula.
    //    `mastered` (early finish at the top tier) forces the full 3 stars.
    const { stars, xp: xpEarned, coins: coinsEarned } = finishChapter(chapter, correct, wrong, mastered)

    // 2. Build payload
    const learner = getActiveLearner()
    if (!learner) return

    /**
     * 2a. THE PLAN POINTER AND THE COMPLETION EVENT — here, because this is the ONE function every
     * completion path already calls. It used to live in `/game`'s `handleComplete`, which reached a
     * chapter as `ChapterProps.onComplete` and was never invoked: both registry factories in
     * `ChapterPortal` drop that prop. So sessions were written and the plan never moved.
     *
     * ⚠️ BEFORE THE NETWORK, DELIBERATELY. The pointer is local and must advance for a child playing
     * offline; below this point the function can return early on `!navigator.onLine`.
     * ⚠️ PRACTICE ONLY — a lesson completion is not a plan step.
     * ⚠️ BEST-EFFORT — a storage or analytics failure must never cost a child their score, which has
     * already been written to the store above.
     */
    if (phase === 'practice') {
      try {
        track('practice_complete', { chapter, correct, wrong, mastered })
        const moved = advanceAfterChapter(learner.id, chapter, correct, wrong, mastered, deeperChapter)
        if (moved?.kind === 'revised') track('plan_revised_deeper', { from: chapter, to: moved.to, correct, wrong })
      } catch { /* scoring already landed; never let bookkeeping undo it */ }
    }

    const payload = {
      learnerId:    learner.id,
      chapter,
      phase,
      correctCount: correct,
      wrongCount:   wrong,
      starsEarned:  stars,
      xpEarned,
      coinsEarned,
      clientId:     randomId(),
      completedAt:  new Date().toISOString(),
      // The tier the run ended on, straight off the same per-device store both engines write after
      // every scored answer — so the row the server keeps and the row this device keeps agree.
      difficulty:   getChapterLevel(learner.id, chapter),
    }

    // 3. Try to sync — queue if offline or failed
    if (!navigator.onLine) {
      enqueueSession(payload)
      return
    }

    const outcome = await syncSession(payload)
    // Only queue for retry on a transient failure. A 'drop' (learner gone / not
    // owned) can never succeed, so queueing it would just loop forever.
    if (outcome === 'retry') {
      enqueueSession(payload)
    }
  }, [finishChapter])

  const flushOfflineQueue = useCallback(async () => {
    await flushQueue()
  }, [])

  return { finishAndSync, flushQueue: flushOfflineQueue }
}