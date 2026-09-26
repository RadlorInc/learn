/**
 * The progression engine, gated for the first time.
 *
 * These rules decide the tier every child sits at, in every chapter, in every band — and until
 * `core/progression.ts` was split out of the `useAdaptive` hook they were unreachable from a test:
 * `calcDifficulty` was a private function and the hint and mastery rules were inline inside a
 * `useCallback`. The only thing describing them was PROSE, in three separate files' comments.
 *
 * The last block is the one that matters most. `docs/chapter-craft.md` builds its whole "a tier is
 * not a difficulty knob, it is a ROUND BUDGET" argument on a specific claim — a child who answers
 * well gets about three questions at L1, exactly ONE at L2 and TWO at L3, and then the chapter ends.
 * That budget is a CONSEQUENCE of the constants here, not an independent fact, and it is what the
 * coverage machinery exists to work around. It is asserted rather than narrated now.
 */
import { describe, it, expect } from 'vitest'
import {
  initialProgress,
  nextDifficulty,
  step,
  type Difficulty,
} from '@/core/progression'
import { chapterMastery } from '@/features/lessons/adaptive'

/** Apply a run of answers, returning the difficulty each question was ANSWERED at (and mastery, fed as the hook does). */
function play(answers: readonly boolean[], start: Difficulty = 1) {
  let p = initialProgress(start)
  let m = { streak: 0, mastered: false }
  const answeredAt: Difficulty[] = []
  for (const a of answers) {
    answeredAt.push(p.difficulty)
    m = chapterMastery(m, p.difficulty, a, p.wrongStreak)
    p = step(p, a)
  }
  return { p, answeredAt, mastered: m.mastered }
}

describe('progression — promote', () => {
  it('promotes on 3 correct in a row at accuracy >= 80%', () => {
    expect(play([true, true, true]).p.difficulty).toBe(2)
  })

  it('does NOT promote on a 3-streak when accuracy is below 80%', () => {
    // 2 wrong then 3 right = 3/5 = 60%: the streak is met, the accuracy is not.
    const { p } = play([false, false, true, true, true])
    expect(p.streak).toBe(3)
    expect(p.difficulty).toBe(1)
  })

  it('never promotes past tier 3', () => {
    expect(play(Array(12).fill(true)).p.difficulty).toBe(3)
    expect(nextDifficulty(3, 99, 99, 99, 0)).toBe(3)
  })
})

describe('progression — demote', () => {
  it('demotes on 2 wrong in a row', () => {
    expect(nextDifficulty(3, 0, 8, 10, 2)).toBe(2)
  })

  it('demotes on accuracy < 40% once at least 4 questions are in', () => {
    expect(nextDifficulty(2, 0, 1, 4, 1)).toBe(1)      // 25% over 4 → demote
    expect(nextDifficulty(2, 0, 0, 3, 1)).toBe(2)      // same accuracy, only 3 answered → hold
  })

  it('never demotes below tier 1', () => {
    expect(nextDifficulty(1, 0, 0, 10, 9)).toBe(1)
  })
})

describe('progression — hint', () => {
  it('offers a hint after 2 wrong in a row, at any tier', () => {
    expect(play([false, false], 3).p.shouldHint).toBe(true)
  })

  it('offers a hint at tier 1 when accuracy drops below 50%', () => {
    const { p } = play([true, false, false])   // 1/3 at tier 1
    expect(p.difficulty).toBe(1)
    expect(p.shouldHint).toBe(true)
  })

  it('does not offer a hint on a clean run', () => {
    expect(play([true, true, true]).p.shouldHint).toBe(false)
  })
})

describe('progression — the round budget chapter-craft is built on', () => {
  it('a perfect run masters on the 6th question: 3 asked at L1, ONE at L2, TWO at L3', () => {
    const { mastered, answeredAt } = play(Array(6).fill(true))

    expect(mastered).toBe(true)
    expect(answeredAt).toEqual([1, 1, 1, 2, 3, 3])

    const asked = (d: Difficulty) => answeredAt.filter(x => x === d).length
    expect([asked(1), asked(2), asked(3)]).toEqual([3, 1, 2])
  })

  it('mastery cannot arrive before the 6th question, however well the child does', () => {
    for (let n = 1; n < 6; n++) {
      expect(play(Array(n).fill(true)).mastered).toBe(false)
    }
  })
})
