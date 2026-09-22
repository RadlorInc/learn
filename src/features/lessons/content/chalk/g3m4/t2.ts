/** g3m4-t2's chalkboards: index = screen index (0 is Screen 1, which has none). Rows are blue, one row is yellow. */
import type { ChalkMark } from '../../../chalk'
import { write, wash, arrow, ring, clock, cross } from '../../../chalk'
import { tiles, warn, tick } from './t1'

// The garden: 3 rows of 5 tiles, 56 px, x 160–440, y 70–238.
const U = 56, X = 160, Y = 70
const RY = [0, 1, 2].map(r => Y + U / 2 + r * U), CX = [0, 1, 2, 3, 4].map(k => X + U / 2 + k * U)
const garden = (at: [number, string?] = [0]) => tiles(at, X, Y, 3, 5, U)

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // One by one is slow
  [
    garden(),
    ...Array.from({ length: 15 }, (_, i) => ({ ...write([0, 'one'], String(i + 1), CX[i % 5], RY[Math.floor(i / 5)], 20, 'd'), quick: true })),
    clock([1, 'long'], 110, 315, 26), write([1, 'time'], 'a long time', 260, 315, 28, 'r'),
    write([2, 'faster'], 'faster way?', 470, 315, 28, 'y'),
    ...RY.map(y => ({ ...arrow([2, 'rows'], [100, y], [148, y], 'b'), quick: true })),
  ],
  // The big idea
  [
    garden([0, 'rectangle']),
    arrow([0, 'rows'], [125, 75], [125, 232], 'b'), write([0, 'rows'], '3 rows', 65, 154, 24, 'b'),
    ring([0, 'one'], 300, RY[0], 160, 34, 'y'), write([0, 'one'], '5 in a row', 300, 38, 24, 'y'),
    write([0, 'row'], '3 × 5', 300, 315, 48, 'y'),
  ],
  // Count the rows
  [
    garden(),
    arrow([0, 'across'], [170, 45], [430, 45], 'b'),
    ...['1', '2', '3'].map((n, r) => write([1, n], n, 125, RY[r], 32, 'b')),
    write([2, 'rows'], '3 rows', 300, 315, 44, 'b'),
  ],
  // Count one row
  [
    garden(),
    ring([0, 'one'], 300, RY[0], 160, 34, 'y'),
    ...['1', '2', '3', '4', '5'].map((n, k) => write([1, n], n, CX[k], 40, 26, 'y')),
    write([2, 'tiles'], '5 in a row', 300, 315, 40, 'y'),
  ],
  // 3 rows of 5
  [
    garden(),
    ...['5', '10', '15'].flatMap((n, r) => [{ ...wash([0, n], X, Y + r * U, 5 * U, U, 'y'), quick: true }, write([0, n], n, 490, RY[r], 34, 'y')]),
    write([1, 'so'], '3 × 5 = 15', 300, 292, 42, 'y'),
    write([2, 'units'], '15 square units', 300, 355, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ADD'], '5 + 3', 130, 190, 40, 'r'),
    write([2, '8'], '= 8', 225, 190, 40, 'r'), cross([2, 'but'], 70, 160, 195, 60),
    tiles([2, 'rows'], 360, 140, 3, 5, 30, 'y'),
    write([2, 'multiply'], '3 × 5 = 15', 435, 290, 36, 'y'), tick([2, 'multiply'], 536, 290),
  ],
]
