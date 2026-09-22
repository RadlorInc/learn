/** g5m5-t4's chalkboards: index = screen index (0 is Screen 1, which has none). The chest: a big box 4 × 2 × 3 (blue) with a
 * small box 2 × 2 × 1 (white) on the left of its top. Totals yellow, the mistake coral. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, cross, wash, line } from '../../../chalk'
import { block, warn, tick, type At } from './t1'

/** The chest with its front bottom-left corner at (x, y). */
const chest = (a: At, b: At, x: number, y: number, u: number, grid = true, big: ChalkColor = 'b', small: ChalkColor = 'w'): ChalkMark[] =>
  [block(a, x, y, 4, 2, 3, u, big, grid, 2), block(b, x, y - 3 * u, 2, 2, 1, u, small, grid)]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // It is not one box
  [
    ...chest([0], [0], 170, 320, 50, false, 'w', 'w'),
    write([0, 'length'], '?', 270, 352, 32), write([0, 'height'], '?', 138, 220, 32),
    wash([1, 'two'], 170, 170, 200, 150, 'b'), wash([1, 'boxes'], 170, 120, 100, 50, 'w'),
    write([1, 'sizes'], 'small', 480, 115, 28), write([1, 'sizes'], 'big', 480, 250, 28, 'b'),
  ],
  // The big idea: each box, then add
  [
    ...chest([0, 'boxes'], [0, 'joined'], 188, 330, 45),
    write([0, 'each'], '?', 230, 372, 36, 'b'), write([0, 'add'], '+', 300, 372, 36), write([0, 'add'], '?', 370, 372, 36),
  ],
  // The big box first
  [
    block([0], 110, 170, 2, 2, 1, 50, 'd', false),
    block([0, 'big'], 110, 320, 4, 2, 3, 50, 'b', true, 2),
    write([1, 'long'], '4 ft', 210, 350, 26), write([1, 'wide'], '2 ft', 400, 318, 26), write([1, 'tall'], '3 ft', 72, 245, 26),
    write([2, '24'], '4 × 2 × 3 = 24', 480, 200, 28, 'b'), write([2, 'feet'], 'cubic feet', 480, 240, 24, 'd'),
  ],
  // Then the small box
  [
    block([0], 110, 330, 4, 2, 3, 50, 'd', false, 2),
    block([0, 'small'], 110, 180, 2, 2, 1, 50),
    write([1, 'long'], '2 ft', 160, 204, 24), write([1, 'wide'], '2 ft', 300, 166, 22), write([1, 'tall'], '1 ft', 76, 155, 24),
    write([2, '4'], '2 × 2 × 1 = 4', 475, 230, 28), write([2, 'feet'], 'cubic feet', 475, 268, 24, 'd'),
  ],
  // Put them back together
  [
    ...chest([0, 'together'], [0, 'together'], 80, 330, 45),
    write([1, '24'], '24', 390, 210, 36, 'b'), write([1, '4'], '+ 4', 450, 210, 36), write([1, '28'], '= 28', 525, 210, 36, 'y'),
    write([1, 'holds'], '28 cubic feet', 455, 280, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...chest([1], [1], 50, 320, 35, false, 'w', 'w'),
    line([1, 'tallest'], [[38, 180], [38, 320]], 'r'), write([1, 'tallest'], '4', 22, 250, 26, 'r'),
    wash([2, 'empty'], 120, 180, 70, 35, 'r'), block([2, 'empty'], 120, 215, 2, 2, 1, 35, 'r', false),
    write([2, '32'], '4 × 2 × 4 = 32', 140, 365, 28, 'r'),
    cross([2, 'counts'], 35, 345, 210, 40),
    ...chest([2, 'Find'], [2, 'each'], 360, 320, 35, true, 'y', 'y'),
    write([2, 'add'], '24 + 4 = 28', 428, 365, 28, 'y'), tick([2, 'add'], 540, 365),
  ],
]
