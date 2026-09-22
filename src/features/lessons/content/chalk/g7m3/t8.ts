/** g7m3-t8's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: white = the bill and the working, blue = what is done to both sides, yellow = the letter and the answer,
 *  coral = a guess that misses / the mix-up, dim = labels. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, span, ring, cross, clock } from '../../../chalk'
import { q, warn } from '../g5m1/t17'

type At = [beat: number, at?: string]

/** The bill as a tape: the plan part (80..230) and the data part (230..520), from y, 56 high. */
const plan = (at: At, y: number, t = '20'): ChalkMark[] => [q(box(at, 80, y, 150, 56)), write(at, t, 155, y + 28, 32)]
const data = (at: At, y: number, t?: string): ChalkMark[] =>
  [q(wash(at, 230, y, 290, 56, 'y')), t ? q(box(at, 230, y, 290, 56)) : box(at, 230, y, 290, 56), ...(t ? [write(at, t, 375, y + 28, 32, 'y')] : [])]
const check = (at: At, x: number, y: number): ChalkMark => line(at, [[x - 14, y], [x - 3, y + 13], [x + 18, y - 14]], 'y', 5)

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // Guessing takes a while
  [
    write([0, 'Try'], 'try 3', 90, 80, 28, 'd'),
    write([1, '35.'], '20 + 3 × 5 = 35', 300, 80, 30), write([1, 'Too'], 'too low', 510, 80, 26, 'r'),
    write([1, '4,'], 'try 4', 90, 145, 28, 'd'),
    write([1, '40.'], '20 + 4 × 5 = 40', 300, 145, 30), write([1, 'Still'], 'too low', 510, 145, 26, 'r'),
    clock([2, 'slow.'], 300, 225, 28),
    write([2, 'way'], 'a way with no guessing?', 300, 310, 34, 'y'),
  ],
  // The big idea: a letter for what we don't know → an equation → solve
  [
    write([0, 'letter'], 'g', 300, 60, 52, 'y'), write([0, 'know,'], "the number we don't know", 300, 115, 26, 'd'),
    ...plan([0, 'story'], 160), ...data([0, 'story'], 160, '5g'),
    write([0, 'equation,'], '20 + 5g = 45', 300, 275, 42),
    write([0, 'solve'], 'then solve it', 300, 345, 30, 'y'),
  ],
  // Write the equation
  [
    write([0, 'Let'], 'g', 170, 55, 44, 'y'), write([0, 'gigabytes.'], '= number of gigabytes', 330, 55, 30, 'd'),
    ...data([1, 'Each'], 110), write([1, 'dollars,'], '5 dollars each', 375, 195, 24, 'd'), write([1, '5g.'], '5g', 375, 138, 34, 'y'),
    ...plan([2, 'plan.'], 110), write([2, 'plan.'], 'plan', 155, 195, 24, 'd'),
    span([2, 'bill'], 80, 520, 235), write([2, '45.'], '45', 300, 265, 30),
    write([2, '45.'], '20 + 5g = 45', 300, 335, 42, 'y'),
  ],
  // Solve it
  [
    q(write([0, 'solve'], '20 + 5g', 220, 55, 40)), q(write([0, 'solve'], '=', 320, 55, 40)), write([0, 'solve'], '45', 390, 55, 40),
    write([1, 'Take'], '− 20', 220, 105, 32, 'b'), write([1, 'both'], '− 20', 390, 105, 32, 'b'),
    line([1, 'sides.'], [[130, 130], [440, 130]], 'd', 2.5),
    q(write([1, 'so'], '5g', 220, 175, 40)), q(write([1, 'so'], '=', 320, 175, 40)), write([1, 'so'], '25', 390, 175, 40),
    write([2, 'Divide'], '÷ 5', 220, 225, 32, 'b'), write([2, 'sides'], '÷ 5', 390, 225, 32, 'b'),
    line([2, 'sides'], [[130, 250], [440, 250]], 'd', 2.5),
    q(write([2, 'and'], 'g', 220, 300, 44, 'y')), q(write([2, 'and'], '=', 320, 300, 44, 'y')), write([2, 'and'], '5', 390, 300, 44, 'y'),
    ring([2, '5.'], 305, 300, 120, 34, 'y'),
  ],
  // Check it in the story
  [
    ...plan([0, 'story?'], 40), ...data([0, 'story?'], 40),
    write([1, '25'], '5 × 5 = 25', 375, 68, 32, 'y'),
    span([2, 'Add'], 80, 520, 125), write([2, '45'], '20 + 25 = 45', 260, 175, 36),
    write([2, 'bill.'], 'the bill', 470, 175, 26, 'd'), check([2, 'bill.'], 540, 175),
    write([3, 'used.'], '5 gigabytes were used', 300, 280, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'EACH'], '5 dollars for each gigabyte', 300, 160, 30, 'd'), ring([1, 'gigabyte.'], 132, 160, 20, 24, 'y'),
    write([2, '5g,'], '20 + 5g', 430, 260, 40, 'y'),
    write([2, '20g.'], '5 + 20g', 170, 260, 40, 'r'), cross([2, '20g.'], 95, 253, 150, 14),
  ],
]
