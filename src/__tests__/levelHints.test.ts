/**
 * A practice level whose big idea does not fit gets its own Hint, carried on the drawn problem (tester notes: g6m1-t2
 * L5 "20:45 = x:63 is hard without an explanation"; g8m1-t1 L4, a work-backwards level whose hint said "add").
 * Drawn through the real ladders and `draw`, as practice does; the expected words are written here by hand.
 */
import { it, expect } from 'vitest'
import { ladderOf } from '@/features/lessons/ladders'
import { draw, rng } from '@/features/lessons/adaptive'

const hints = (id: string, level: number) => Array.from({ length: 20 }, (_, i) => draw(ladderOf(id)!, level, rng(i + 1)).hint)

it('g6m1-t2 L5 (scale down, then up) says to go down first', () => {
  for (const h of hints('g6m1-t2', 4)) expect(h).toMatch(/^Go down first: divide both numbers/)
})
it('g8m1-t1 L4 (missing exponent) says to take away, not add', () => {
  for (const h of hints('g8m1-t1', 3)) expect(h).toMatch(/take away the one you know/)
})
it('levels without their own hint keep the lesson-wide one', () => {
  for (const h of [...hints('g6m1-t2', 0), ...hints('g8m1-t1', 0)]) expect(h).toBeUndefined()
})
