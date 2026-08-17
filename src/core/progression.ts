/**
 * The progression engine — promote, demote, hint, mastery.
 * ─────────────────────────────────────────────────────────────
 * Every chapter in every band runs on these rules. They decide the tier a child
 * sits at, when the hint scaffold appears, and when a run ends early on mastery.
 *
 * This file is PURE: no React, no store, no I/O. It used to live inside the
 * `useAdaptive` hook, where `calcDifficulty` was a private function and the hint
 * and mastery rules were inline in `record()` — so the single most consequential
 * rule set in the app had NO test that could reach it, only prose describing it
 * (`story/clock.ts` and `story/slice.ts` both narrate "promotes on 3 correct in a
 * row … ends at a streak of 6" in comments, and this repo's own craft doc calls a
 * comment asserting a rule is followed the most expensive kind of lie).
 *
 * The round-budget arithmetic the chapter spec is built on — roughly three
 * questions at L1, ONE at L2, TWO at L3 before mastery fires — is a CONSEQUENCE
 * of the constants here. Change one and that budget moves, which is why it is now
 * gated in `src/__tests__/progression.test.ts` rather than described.
 */

export type Difficulty = 1 | 2 | 3

// Demonstrated mastery: a child sitting at the hardest tier with this many
// correct in a row has clearly got it — the session can end early (with full
// stars) instead of grinding the repetitive tail. Reaching tier 3 already takes
// a strong streak, so this is "top tier AND a clean run on top of that".
export const MASTERY_STREAK = 6

/** The counters a run carries. Presentation (praise strings) is NOT in here. */
export interface Progress {
  difficulty:  Difficulty
  streak:      number      // consecutive correct answers
  wrongStreak: number
  correct:     number
  wrong:       number
  isOnFire:    boolean     // 3+ correct in a row
  shouldHint:  boolean     // true when the child is struggling
}

export function initialProgress(initialDifficulty: Difficulty = 1): Progress {
  return {
    difficulty:  initialDifficulty,
    streak:      0,
    wrongStreak: 0,
    correct:     0,
    wrong:       0,
    isOnFire:    false,
    shouldHint:  false,
  }
}

// ─── Difficulty rules ─────────────────────────────────────────
//
//  Promote:   3 correct in a row  AND  accuracy ≥ 80%
//  Demote:    2 wrong in a row    OR   accuracy < 40% after ≥ 4 questions
//  Hint:      2+ wrong in a row   OR   difficulty == 1 AND accuracy < 50%

export function nextDifficulty(
  current: Difficulty,
  streak: number,
  correct: number,
  total: number,
  wrongStreak: number,
): Difficulty {
  const accuracy = total > 0 ? correct / total : 1

  // Promote
  if (streak >= 3 && accuracy >= 0.8 && current < 3) {
    return (current + 1) as Difficulty
  }
  // Demote
  if ((wrongStreak >= 2 || (total >= 4 && accuracy < 0.4)) && current > 1) {
    return (current - 1) as Difficulty
  }
  return current
}

/** One answer applied to a run. Pure — same input, same output, always. */
export function step(p: Progress, isCorrect: boolean): Progress {
  const correct     = isCorrect ? p.correct + 1 : p.correct
  const wrong       = isCorrect ? p.wrong       : p.wrong + 1
  const streak      = isCorrect ? p.streak + 1  : 0
  const wrongStreak = isCorrect ? 0             : p.wrongStreak + 1
  const total       = correct + wrong
  const difficulty  = nextDifficulty(p.difficulty, streak, correct, total, wrongStreak)

  return {
    difficulty,
    streak,
    wrongStreak,
    correct,
    wrong,
    isOnFire:   streak >= 3,
    shouldHint: wrongStreak >= 2 || (difficulty === 1 && total >= 2 && correct / total < 0.5),
  }
}

/** Top tier plus a clean run on top of it → the chapter may end early. */
export function isMastered(p: Pick<Progress, 'difficulty' | 'streak'>): boolean {
  return p.difficulty === 3 && p.streak >= MASTERY_STREAK
}

// ─── Difficulty-aware number generators ───────────────────────
// These are the shared building blocks chapters call to get
// appropriate numbers for the current difficulty.

export function patternUnitLen(difficulty: Difficulty): number {
  // Patterns: how many distinct items in the repeating unit. A demotion makes
  // the unit shorter again (ABCD → ABC → AB), i.e. genuinely easier.
  if (difficulty === 1) return 2   // AB
  if (difficulty === 2) return 3   // ABC
  return 4                          // ABCD
}

export function matchTarget(difficulty: Difficulty): number {
  // Apple Basket: how many to put in the basket. Tiers step down clearly so a
  // demotion really does hand the child smaller numbers again.
  if (difficulty === 1) return Math.floor(Math.random() * 3) + 1   // 1–3
  if (difficulty === 2) return Math.floor(Math.random() * 4) + 3   // 3–6
  return Math.floor(Math.random() * 5) + 6                          // 6–10
}

export function seqLength(difficulty: Difficulty): number {
  if (difficulty === 1) return 3   // show 3 items
  if (difficulty === 2) return 4   // show 4 items
  return 5                          // show 5 items
}
