'use client'
/**
 * useChapterSync
 * Wraps finishChapter — updates local store instantly,
 * syncs to Supabase in background, queues if offline.
 */

import { useCallback, useRef } from 'react'
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

/**
 * @param chapter the chapter currently on screen. Passing it ARMS the start clock; omitting it
 *   (as `/game` does, which only wants `flushQueue`) leaves `started_at` null — honestly unknown.
 *
 * ⚠️ THE CHAPTER IS A PARAMETER RATHER THAN A `markStart()` A CALLER MUST REMEMBER, DELIBERATELY.
 * This repo has already paid three months for a wire both ends believed in: `ChapterProps.onComplete`
 * was typed, passed and silently dropped, so no child's plan advanced. A separate "call me when the
 * chapter opens" function is that same shape waiting to happen — the hook that owns the END of the
 * measurement now owns the START, and there is nothing left to forget.
 */
export function useChapterSync(chapter?: ChapterType) {
  const finishChapter = useMiloStore(s => s.finishChapter)

  /**
   * Armed DURING RENDER, not in an effect. Effects run after paint, so an effect-set start would
   * miss everything the child does in the first frame — and this repo's own rule (chapter-craft §1)
   * is that per-run state is derived during render for exactly that reason. Re-running with the same
   * chapter is a no-op, so StrictMode's double render cannot move it.
   */
  const startRef = useRef<{ chapter: ChapterType; at: string } | null>(null)
  if (chapter && startRef.current?.chapter !== chapter) {
    startRef.current = { chapter, at: new Date().toISOString() }
  }

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
      // Only this chapter's own start counts. If the hook was mounted without a chapter, or the
      // child somehow finished a different one, we say nothing rather than guessing.
      startedAt:    startRef.current?.chapter === chapter ? startRef.current.at : undefined,
      // The tier the run ended on, straight off the same per-device store both engines write after
      // every scored answer — so the row the server keeps and the row this device keeps agree.
      difficulty:   getChapterLevel(learner.id, chapter),
    }

    // 3. Try to sync — queue if offline or failed
    if (!navigator.onLine) {
      enqueueSession(payload)
      return
    }

    // A replay of the SAME chapter must time itself, not inherit the finished run's clock. Cleared
    // here so the next render re-arms; `runKey` remounts the chapter, which guarantees that render.
    startRef.current = null

    const outcome = await syncSession(payload)
    // Only queue for retry on a transient failure. A 'drop' (learner gone / not
    // owned) can never succeed, so queueing it would just loop forever.
    if (outcome === 'retry') {
      enqueueSession(payload)
    }
  }, [finishChapter, chapter])

  const flushOfflineQueue = useCallback(async () => {
    await flushQueue()
  }, [])

  return { finishAndSync, flushQueue: flushOfflineQueue }
}