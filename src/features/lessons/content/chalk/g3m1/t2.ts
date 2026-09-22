/** g3m1-t2's chalkboards: index = screen index (0 is Screen 1, which has none). Chairs are small squares. */
import type { ChalkMark } from '../../../chalk'
import { write, line, ring, arrow, cross } from '../../../chalk'
import { squares, grid, warn, tick, type At } from './t1'

// The hall: 3 rows of 5 chairs, 56 apart, first chair at (200, 90).
const CX = [200, 256, 312, 368, 424], RY = [90, 146, 202]
const row = (at: At, r: number, c: 'w' | 'y' | 'b' | 'd' = 'w'): ChalkMark => ({ ...squares(at, CX.map(x => [x, RY[r]]), 30, c), quick: true })
const hall = (at: At): ChalkMark[] => [0, 1, 2].map(r => row(at, r))
const JUMBLE: [number, number][] = [[60, 80], [120, 60], [180, 95], [240, 70], [90, 140], [150, 130], [215, 160], [55, 205],
  [120, 195], [190, 225], [250, 130], [80, 265], [150, 255], [230, 280], [260, 210]]

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // A jumble is hard to count
  [
    squares([0, 'jumbled'], JUMBLE, 26),
    write([1, 'miss'], 'missed some?', 155, 335, 28, 'r'),
    line([2, 'What'], [[300, 50], [300, 300]], 'd', 2),
    squares([2, 'rows'], grid(360, 100, 3, 5, 44), 26),
    write([2, 'faster'], 'much faster', 450, 335, 30, 'y'),
  ],
  // The big idea
  [
    ...hall([0, 'row']),
    arrow([0, 'rows'], [160, 80], [160, 215], 'b'), write([0, 'rows'], '3 rows', 90, 150, 28, 'b'),
    ring([0, 'one'], 312, 90, 150, 30, 'y'), write([0, 'one'], '5 in a row', 312, 42, 26, 'y'),
    write([0, 'multiply'], '3 × 5', 312, 300, 48, 'y'),
  ],
  // How many rows?
  [
    ...hall([0]),
    arrow([0, 'across'], [185, 48], [445, 48], 'y'),
    ...['1', '2', '3'].map((n, r) => write([1, n], n, 150, RY[r], 32, 'b')),
    write([2, 'rows'], '3 rows', 312, 300, 44, 'y'),
  ],
  // How many in a row?
  [
    ...hall([0]),
    ring([0, 'one'], 312, 90, 150, 30, 'y'),
    ...['1', '2', '3', '4', '5'].map((n, i) => write([1, n], n, CX[i], 40, 26, 'y')),
    write([2, 'chairs'], '5 chairs in each row', 312, 300, 36, 'y'),
  ],
  // 3 rows of 5
  [
    ...hall([0]),
    ...['5', '10', '15'].flatMap((n, r) => [line([0, n], [[180, RY[r] + 22], [444, RY[r] + 22]], 'y', 2.5), write([0, n], n, 500, RY[r], 34, 'y')]),
    write([1, 'rows'], '3 rows of 5', 250, 275, 32), write([1, '15'], '= 15', 395, 275, 32, 'y'),
    write([2, 'write'], '3 × 5 = 15', 312, 345, 46, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    squares([1, 'row'], [...grid(60, 150, 2, 5, 36), ...grid(60, 222, 1, 4, 36)], 22),
    ring([1, 'missing'], 204, 222, 12, 12, 'r'),
    write([1, 'NOT'], '3 × 5', 132, 300, 36, 'r'), cross([1, 'NOT'], 82, 278, 100, 45),
    squares([2, 'Every'], grid(380, 150, 3, 5, 36), 22, 'y'),
    write([2, 'number'], '3 × 5', 452, 300, 36, 'y'), tick([2, 'number'], 510, 300),
    ...['5', '5', '4'].map((n, r) => ({ ...write([2, 'Count'], n, 260, 150 + r * 36, 24, r === 2 ? 'r' : 'd'), quick: true })),
    ...['5', '5', '5'].map((n, r) => ({ ...write([2, 'check'], n, 560, 150 + r * 36, 24, 'y'), quick: true })),
  ],
]
