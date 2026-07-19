import { describe, it, expect } from 'vitest'
import { ruling } from '@/features/chapters/teen/games/Leaderboard'

/**
 * The 15–16 signed-numbers chapter grades × and ÷ on the RULING the child builds
 * (how many cards, applied or revoked) rather than on a number they dialled. That
 * is only fair if the ruling is forced: exactly one (count, direction) pair may
 * reach the answer. If someone widens the card values later and two rulings start
 * hitting the same swing, a correct child could be marked wrong — this is the
 * gate for that, and for the two-negatives case the whole rebuild exists to show.
 */
const MAX_COUNT = 12 // the loader's ceiling

describe('Leaderboard ruling bench', () => {
  it('produces a swing equal to the arithmetic answer (×)', () => {
    for (let a = -8; a <= 8; a++) for (let b = -6; b <= 6; b++) {
      if (a === 0 || b === 0) continue
      const r = ruling(a, b, false)
      expect(r.signedCount).toBe(a)
      expect(r.swing).toBe(a * b)
    }
  })

  it('recovers the quotient as the signed card count (÷)', () => {
    for (let b = -6; b <= 6; b++) for (let q = -6; q <= 6; q++) {
      if (b === 0 || q === 0) continue
      const r = ruling(b * q, b, true)
      expect(r.signedCount).toBe(q)
      expect(r.swing).toBe(b * q) // reaches the target swing exactly
    }
  })

  it('admits exactly one ruling per task — no correct child can be marked wrong', () => {
    for (let a = -8; a <= 8; a++) for (let b = -6; b <= 6; b++) {
      if (a === 0 || b === 0) continue
      const { swing } = ruling(a, b, false)
      let solutions = 0
      for (let c = 1; c <= MAX_COUNT; c++) for (const d of [1, -1]) if (d * c * b === swing) solutions++
      expect(solutions).toBe(1)
    }
  })

  it('makes two negatives produce a positive swing — revoking a penalty lifts the score', () => {
    for (let a = -8; a <= -1; a++) for (let b = -6; b <= -1; b++) {
      expect(ruling(a, b, false).swing).toBeGreaterThan(0)
    }
  })
})
