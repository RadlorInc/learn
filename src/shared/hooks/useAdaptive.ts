/**
 * useAdaptive — the React binding for the progression engine.
 * ─────────────────────────────────────────────────────────────
 * The RULES (promote, demote, hint, mastery) are pure and live in
 * `@/core/progression`. This file owns only what genuinely needs React: the
 * snapshot state, the synchronous ref, and the praise/encouragement strings,
 * which are presentation and are randomly picked.
 *
 * It sits in `shared/hooks` rather than `core/` because `core/` is the pure
 * domain layer and may not import a UI framework — gated by
 * `src/__tests__/layering.test.ts`.
 *
 * Usage inside a chapter:
 *   const ada = useAdaptive('counting')
 *   ada.record(true)          // after a correct answer
 *   ada.record(false)         // after a wrong answer
 *   ada.difficulty            // 1 | 2 | 3
 *   ada.shouldHint            // true → show extra visual hint
 *   ada.praise                // dynamic praise string
 *   ada.encouragement         // dynamic encouragement string
 * ─────────────────────────────────────────────────────────────
 */

import { useRef, useState, useCallback } from 'react'
import { type ChapterType } from '@/core/chapters'
import {
  type Difficulty,
  type Progress,
  initialProgress,
  step,
  isMastered,
} from '@/core/progression'

// Deliberately NOT re-exported: `Difficulty` and `MASTERY_STREAK` are domain and
// belong to `@/core/progression`. A convenience re-export here would put the
// domain behind a React hook, which is the barrel that `state/store.ts` was
// carrying and `src/__tests__/layering.test.ts` now forbids.

// What `record()` hands back, read synchronously by the practice loop the same
// tick (so an early-exit decision never races a stale render closure).
export interface RecordResult {
  difficulty: Difficulty
  streak:     number
  correct:    number
  wrong:      number
  mastered:   boolean
}

export interface AdaptiveState {
  difficulty:     Difficulty
  streak:         number      // consecutive correct answers
  sessionCorrect: number
  sessionWrong:   number
  shouldHint:     boolean     // true when child is struggling
  isOnFire:       boolean     // 3+ correct in a row
  mastered:       boolean     // top tier + MASTERY_STREAK in a row → can finish early
  praise:         string
  encouragement:  string
  record:         (correct: boolean) => RecordResult
  difficultyLabel: string
}

// ─── Praise / encouragement pools ────────────────────────────

const PRAISE = [
  ['Good job!', 'Nice!', 'You got it!', 'Correct!'],                           // level 1 — calm
  ['Great work!', 'Brilliant!', 'Well done!', 'That\'s right!'],               // level 2 — warm
  ['Amazing!', 'You\'re on fire! 🔥', 'Superstar! ⭐', 'Incredible! 🎉'],     // level 3 — excited
]

export const ENCOURAGEMENT = [
  ['Good try!', 'Nearly there!', 'Let\'s look again…', 'Almost!'],
  ['Not quite — but you\'re getting it!', 'Keep going!', 'Try again — you can do it!'],
  ['Oops! No worries — let\'s try another!', 'Keep practising!', 'Don\'t give up!'],
]

const ON_FIRE = [
  'Wow, you\'re on a roll! 🔥',
  'Three in a row! Amazing! ⭐',
  'You\'re unstoppable! 🚀',
  'Milo is so proud of you! 🦊',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Hook ────────────────────────────────────────────────────

type AdaptiveSnapshot = Progress & { praise: string; encouragement: string }

export function useAdaptive(chapter: ChapterType, initialDifficulty: Difficulty = 1): AdaptiveState {
  // All mutable counters live in ONE snapshot object that is mirrored in a ref.
  // The ref is the synchronous source of truth: when several record() calls land
  // in the same render tick (rapid taps), each one reads the previous call's
  // result from ref.current instead of a stale render closure. The old code read
  // streak/wrongStreak/difficulty from the closure and wrote them with plain
  // setters, so a fast second tap recomputed from stale values and could corrupt
  // promote/demote. Driving everything off the ref removes that hazard.
  //
  // `initialDifficulty` lets a chapter RESUME at the tier the child last left off
  // on (see infra/storage/chapterLevel). Default 1 = start easy (unchanged). The
  // engine stays pure — the caller loads/saves the level.
  const [snapshot, setSnapshot] = useState<AdaptiveSnapshot>(() => ({
    ...initialProgress(initialDifficulty),
    praise:        pick(PRAISE[Math.min(initialDifficulty - 1, 2)]),
    encouragement: pick(ENCOURAGEMENT[Math.min(initialDifficulty - 1, 2)]),
  }))
  const ref = useRef(snapshot)

  const record = useCallback((isCorrect: boolean): RecordResult => {
    const s = ref.current
    const p = step(s, isCorrect)
    const lvl = Math.min(p.difficulty - 1, 2)

    const next: AdaptiveSnapshot = {
      ...p,
      praise:        isCorrect ? (p.isOnFire ? pick(ON_FIRE) : pick(PRAISE[lvl])) : s.praise,
      encouragement: isCorrect ? s.encouragement : pick(ENCOURAGEMENT[lvl]),
    }
    ref.current = next   // synchronous — the next tap this tick reads the new values
    setSnapshot(next)    // re-render with the new values

    return {
      difficulty: p.difficulty,
      streak:     p.streak,
      correct:    p.correct,
      wrong:      p.wrong,
      mastered:   isMastered(p),
    }
  }, [])

  const difficultyLabel =
    snapshot.difficulty === 1 ? 'Starter ⭐' :
    snapshot.difficulty === 2 ? 'Getting there ⭐⭐' :
    'Champion ⭐⭐⭐'

  return {
    difficulty:     snapshot.difficulty,
    streak:         snapshot.streak,
    sessionCorrect: snapshot.correct,
    sessionWrong:   snapshot.wrong,
    shouldHint:     snapshot.shouldHint,
    isOnFire:       snapshot.isOnFire,
    mastered:       isMastered(snapshot),
    praise:         snapshot.praise,
    encouragement:  snapshot.encouragement,
    record,
    difficultyLabel,
  }
}
