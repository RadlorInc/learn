/** g3m5-t2's chalkboards: one piece of 4 is 1/4. */
import type { ChalkMark } from '../../../chalk'
import { write, cells, wash, span, ring, cross } from '../../../chalk'
import { warn } from '../g3m1/t1'
import { stacked } from './t1'

/** The numbers 1..4 under the 4 cells of a bar from x, `w` wide, each at its own word of `beat`. */
const count = (beat: number, x: number, w: number, y: number, words = ['1', '2', '3', '4']): ChalkMark[] =>
  words.map((n, i) => write([beat, n], String(i + 1), x + (w * (i + 0.5)) / 4, y, 26, 'b'))

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // It is not just "1"
  [
    cells([0, 'You'], 100, 50, 400, 80, 4), wash([0, 'piece'], 100, 50, 100, 80, 'y'),
    write([1, 'not'], 'not 1 whole sandwich', 300, 185, 30, 'r'),
    write([2, 'piece'], '1 piece out of 4', 300, 265, 32, 'y'),
    write([2, '4'], '?', 300, 335, 50, 'y'),
  ],
  // The big idea
  [
    cells([0, '1'], 80, 100, 320, 70, 4), wash([0, '1'], 80, 100, 80, 70, 'y'),
    ...[0, 1, 2, 3].map(i => ({ ...write([0, '4'], String(i + 1), 120 + 80 * i, 195, 22, 'b'), quick: true })),
    ...stacked([0, '1/4'], [0, '1/4'], [0, '1/4'], '1', '4', 500, 135, 48),
    ring([0, 'bottom'], 500, 168, 26, 26, 'b'),
    span([0, 'all'], 80, 400, 240, 'b'), write([0, 'all'], 'all the equal pieces', 240, 285, 26, 'b'),
  ],
  // Count the equal pieces
  [
    cells([0, 'whole'], 100, 60, 400, 80, 1),
    { beat: 1, at: 'cut', c: 'w', d: 'M200 60 v80 M300 60 v80 M400 60 v80' },
    ...count(1, 100, 400, 170),
    span([2, 'whole'], 100, 500, 210, 'b'),
    ...stacked(null, [2, 'goes'], [2, 'bottom'], '', '4', 300, 290, 48),
    write([2, 'bottom'], 'all the pieces', 440, 323, 22, 'd'),
  ],
  // Count the piece you ate
  [
    cells([0, '4'], 100, 60, 400, 80, 4),
    ...stacked(null, [0, 'bottom'], [0, 'bottom'], '', '4', 300, 290, 48),
    wash([1, 'ate'], 100, 60, 100, 80, 'y'), write([1, '1'], '1 piece', 150, 170, 24, 'y'),
    write([2, 'top'], '1', 300, 257, 48, 'y'), write([2, 'top'], 'the piece you ate', 440, 257, 22, 'd'),
  ],
  // Write it
  [
    ...stacked([0, '1/4'], [0, '1/4'], [0, '1/4'], '1', '4', 300, 105, 56),
    write([1, 'one'], 'one fourth', 300, 210, 34),
    cells([2, '4'], 100, 270, 400, 70, 4), wash([2, 'part'], 100, 270, 100, 70, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    cells([1, 'LEFTOVER'], 60, 150, 280, 60, 4), wash([1, 'LEFTOVER'], 60, 150, 70, 60, 'y'),
    ring([1, 'bottom'], 235, 180, 100, 44, 'r'),
    write([2, 'left'], '3 left', 235, 250, 26, 'r'),
    write([2, '4'], '4 pieces in all', 200, 305, 26, 'b'),
    ...stacked([2, '1/4'], [2, '1/4'], [2, '1/4'], '1', '4', 480, 180, 48),
    ...stacked([2, '1/3'], [2, '1/3'], [2, '1/3'], '1', '3', 480, 320, 44, 'r', 'r'),
    cross([2, '1/3'], 440, 280, 80, 80),
  ],
]
