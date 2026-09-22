/** g3m4-t4's chalkboards: index = screen index (0 is Screen 1, which has none). The tall part is blue, the short part white, the cut and the total yellow. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, arrow, cross } from '../../../chalk'
import { tiles, warn, tick, type At } from './t1'

// The room: 5 rows of 6 tiles with the top-right 2 × 3 missing. Cut after 3 tiles: tall part 5 × 3, short part 3 × 3.
const room = (at: At, x: number, y: number, u: number, c: 'w' | 'y' = 'w') => tiles(at, x, y, 5, 6, u, c, (r, k) => r < 2 && k >= 3)
const cut = (at: At, x: number, y: number, u: number) => line(at, [[x + 3 * u, y + 2 * u - 12], [x + 3 * u, y + 5 * u + 12]], 'y', 6)
const parts = (a: At, b: At, x: number, y: number, u: number): ChalkMark[] =>
  [wash(a, x, y, 3 * u, 5 * u, 'b'), wash(b, x + 3 * u, y + 2 * u, 3 * u, 3 * u, 'w')]
const U = 40, X = 180, Y = 50
const RY = [0, 1, 2, 3, 4].map(r => Y + U / 2 + r * U)

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // It is not one rectangle
  [
    room([0], X, Y, U),
    ...RY.map(y => ({ ...arrow([1, 'rows'], [128, y], [168, y], 'b'), quick: true })),
    ...RY.slice(0, 2).map(y => ({ ...write([2, '3'], '3', 350, y, 28, 'y'), quick: true })),
    ...RY.slice(2).map(y => ({ ...write([2, '6'], '6', 460, y, 28, 'y'), quick: true })),
  ],
  // The big idea
  [
    room([0], X, Y, U),
    cut([0, 'Cut'], X, Y, U),
    ...parts([0, 'two'], [0, 'rectangles'], X, Y, U),
    { ...write([0, 'each'], '?', 240, 300, 36, 'b'), quick: true }, write([0, 'each'], '?', 360, 300, 36),
    write([0, 'add'], '+', 300, 300, 36),
  ],
  // Cut it into two rectangles
  [
    room([0], X, Y, U),
    cut([0, 'line'], X, Y, U), write([0, '3'], '3', 240, 30, 24, 'd'),
    ...parts([1, 'two'], [1, 'rectangles'], X, Y, U),
    write([2, 'tall'], 'tall', 240, 300, 32, 'b'), write([2, 'short'], 'short', 360, 300, 32),
  ],
  // Find each area
  [
    room([0], X, Y, U), cut([0], X, Y, U), ...parts([0], [0], X, Y, U),
    write([1, '5'], '5', 156, 150, 26, 'b'), write([1, '3'], '3', 240, 30, 24, 'b'),
    write([1, '15'], '5 × 3 = 15', 180, 310, 34, 'b'),
    { ...write([2, '3'], '3', 360, 110, 24), quick: true }, write([2, '3'], '3', 444, 190, 24),
    write([2, '9'], '3 × 3 = 9', 430, 310, 34),
  ],
  // Add the two parts
  [
    room([0], 210, 20, 30), cut([0], 210, 20, 30), ...parts([0, 'together'], [0, 'together'], 210, 20, 30),
    write([1, '15'], '15 +', 225, 230, 40, 'b'), write([1, '9'], '9', 295, 230, 40), write([1, '24'], '= 24', 365, 230, 40, 'y'),
    write([2, 'feet'], '24 square feet', 300, 310, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    room([1], 60, 140, 24),
    { ...write([1, 'sides'], '6', 132, 278, 24, 'r'), quick: true }, write([1, 'sides'], '5', 40, 200, 24, 'r'),
    write([1, '30'], '5 × 6 = 30', 132, 330, 30, 'r'),
    wash([1, 'corner'], 132, 140, 72, 48, 'r'), box([1, 'corner'], 132, 140, 72, 48, 'r'),
    cross([1, 'no'], 50, 305, 165, 50),
    room([2, 'part'], 380, 140, 24, 'y'),
    write([2, '24'], '15 + 9 = 24', 452, 330, 30, 'y'), tick([2, '24'], 545, 330),
  ],
]
