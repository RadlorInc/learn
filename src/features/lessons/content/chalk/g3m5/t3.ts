/** g3m5-t3's chalkboards: three pieces of 4 is 3/4. */
import type { ChalkMark } from '../../../chalk'
import { write, cells, wash, span, ring, cross } from '../../../chalk'
import { warn } from '../g3m1/t1'
import { stacked } from './t1'

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // More than one piece
  [
    cells([0, '1'], 80, 60, 320, 70, 4), wash([0, '1'], 80, 60, 80, 70, 'y'),
    ...stacked([0, '1/4'], [0, '1/4'], [0, '1/4'], '1', '4', 500, 95, 40),
    cells([1, 'ate'], 80, 200, 320, 70, 4), wash([1, '3'], 80, 200, 240, 70, 'y'),
    write([2, 'write'], '?', 500, 235, 56, 'y'),
  ],
  // The big idea
  [
    cells([0, 'bottom'], 60, 150, 320, 70, 4),
    span([0, 'all'], 60, 380, 255, 'b'),
    ...stacked(null, [0, 'all'], [0, 'all'], '', '4', 490, 200, 48),
    wash([0, 'have'], 60, 150, 240, 70, 'y'),
    write([0, 'have'], '3', 490, 167, 48, 'y'),
  ],
  // The bottom is still 4
  [
    cells([0, 'whole'], 100, 60, 400, 80, 1),
    { beat: 1, at: 'cut', c: 'w', d: 'M200 60 v80 M300 60 v80 M400 60 v80' },
    ...[0, 1, 2, 3].map(i => ({ ...write([1, '4'], String(i + 1), 150 + 100 * i, 170, 24, 'b'), quick: true })),
    write([1, 'No'], 'still 4 pieces', 300, 220, 28, 'b'),
    ...stacked(null, [2, 'bottom'], [2, 'bottom'], '', '4', 300, 295, 48),
  ],
  // Count the pieces you have
  [
    cells([0, '4'], 100, 60, 400, 80, 4),
    ...stacked(null, [0, 'bottom'], [0, 'bottom'], '', '4', 300, 290, 48),
    ...['1', '2', '3'].flatMap((n, i) => [wash([1, n], 100 + 100 * i, 60, 100, 80, 'y'), write([1, n], n, 150 + 100 * i, 170, 26, 'y')]),
    write([2, 'top'], '3', 300, 257, 48, 'y'), write([2, 'top'], 'the pieces you have', 450, 257, 22, 'd'),
  ],
  // Write it
  [
    ...stacked([0, '3/4'], [0, '3/4'], [0, '3/4'], '3', '4', 300, 105, 56),
    write([1, 'three'], 'three fourths', 300, 210, 34),
    cells([2, '4'], 100, 270, 400, 70, 4), wash([2, 'part'], 100, 270, 300, 70, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    cells([1, 'piece'], 60, 150, 280, 60, 4), wash([1, 'piece'], 60, 150, 210, 60, 'y'),
    ring([1, 'LEFT'], 305, 180, 46, 44, 'r'),
    ...stacked([1, 'bottom'], [1, 'bottom'], [1, 'bottom'], '3', '1', 480, 180, 44, 'r', 'r'),
    cross([1, 'bottom'], 440, 140, 80, 80),
    write([2, 'left'], '1 left', 305, 250, 26, 'r'),
    span([2, '4'], 60, 340, 290, 'b'), write([2, '4'], '4 pieces in all', 200, 330, 26, 'b'),
    ...stacked([2, '3/4'], [2, '3/4'], [2, '3/4'], '3', '4', 480, 320, 48),
  ],
]
