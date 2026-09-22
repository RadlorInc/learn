/**
 * g6m2-t7's chalkboards: index = screen index (0 is Screen 1, which has none).
 * Colours: white = the lines and the numbers counted, blue = the jumps, yellow = the result, coral = the mistake, dim = labels.
 * Both counts are drawn on lines of one scale (0 to 24 over x = 120..552), so a number both counts reach sits in one column.
 */
import type { ChalkMark } from '../../../chalk'
import { write, line, hop, cross, ring, ticks } from '../../../chalk'
import { warn, type At } from '../g4m4/t1'

const X0 = 120, U = 18
const x = (n: number) => X0 + U * n
/** A 0-to-24 line at y with a label at the left. */
const numLine = (at: At, y: number, label: string): ChalkMark[] => [
  { ...ticks(at, X0, y - 6, U * 24, 24, 12, 'w'), w: 2.5, quick: true },
  { ...write(at, '0', X0, y + 26, 20, 'd'), quick: true }, write(at, label, 62, y, 22, 'd'),
]
/** One jump of `step` landing on `to`, with the number it lands on under the line. */
const jump = (at: At, step: number, to: number, y: number, quick = false): ChalkMark[] => [
  { ...hop(at, x(to - step), x(to), y - 8, 'b'), quick },
  { ...write(at, String(to), x(to), y + 26, 20), quick },
]
const count = (at: At, step: number, y: number): ChalkMark[] =>
  Array.from({ length: 24 / step }, (_, i) => jump(at, step, step * (i + 1), y, true)).flat()

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // The packs do not match
  [
    ...numLine([0, 'Why'], 140, 'hot dogs'), ...jump([0, '6'], 6, 6, 140),
    ...numLine([1, 'Buns'], 280, 'buns'), ...jump([1, '4'], 4, 4, 280), ...jump([1, '4'], 4, 8, 280),
    { ...cross([1, '6'], x(6) - 9, 271, 18, 18), quick: true }, write([1, '6'], 'no 6', x(6), 334, 20, 'r'),
    write([2, 'both'], 'a number on both lines?', 330, 375, 28, 'y'),
  ],
  // The big idea: count by each, the first number both reach (2s and 3s, not the lesson's numbers)
  [
    { ...ticks([0, 'Count'], X0, 124, 432, 12, 12, 'w'), w: 2.5, quick: true }, write([0, 'Count'], 'by 2s', 62, 130, 22, 'd'),
    { ...ticks([0, 'Count'], X0, 254, 432, 12, 12, 'w'), w: 2.5 }, write([0, 'Count'], 'by 3s', 62, 260, 22, 'd'),
    ...[2, 4, 6, 8, 10, 12].flatMap(n => [{ ...hop([0, 'each'], X0 + 36 * (n - 2), X0 + 36 * n, 122, 'b'), quick: true }, { ...write([0, 'each'], String(n), X0 + 36 * n, 156, 20), quick: true }]),
    ...[3, 6, 9, 12].flatMap(n => [{ ...hop([0, 'each'], X0 + 36 * (n - 3), X0 + 36 * n, 252, 'b'), quick: true }, { ...write([0, 'each'], String(n), X0 + 36 * n, 286, 20), quick: true }]),
    ...[6, 12].map(n => ({ ...line([0, 'land'], [[X0 + 36 * n, 170], [X0 + 36 * n, 236]], 'd', 2), quick: true })),
    ring([0, 'smallest'], X0 + 36 * 6, 222, 22, 78, 'y'), write([0, 'smallest'], 'first', X0 + 36 * 6, 330, 28, 'y'),
  ],
  // Count by 6s
  [
    ...numLine([0, 'hot'], 200, 'hot dogs'),
    write([1, 'Count'], 'count by 6s', 300, 60, 30, 'b'),
    ...(['6', '12', '18', '24'] as const).flatMap(w => jump([1, w], 6, +w, 200)),
  ],
  // Count by 4s, on a line underneath
  [
    ...numLine([0, 'Now'], 130, 'hot dogs'), ...count([0, 'Now'], 6, 130),
    ...numLine([0, 'underneath'], 290, 'buns'),
    ...(['4', '8', '12', '16', '20', '24'] as const).flatMap(w => jump([1, w], 4, +w, 290)),
  ],
  // The first place both land
  [
    ...numLine([0, 'Which'], 110, 'hot dogs'), ...count([0, 'Which'], 6, 110),
    ...numLine([0, 'Which'], 250, 'buns'), ...count([0, 'Which'], 4, 250),
    ring([0, '12'], x(12), 190, 22, 76, 'y'),
    write([1, '12'], '12 of each', 300, 318, 36, 'y'),
    write([1, 'hot'], '2 packs of hot dogs', 180, 370, 24), write([1, 'buns'], '3 packs of buns', 435, 370, 24),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'MULTIPLY'], '6 × 4 = 24,', 200, 155, 32, 'r'), write([1, 'MULTIPLY'], 'so buy 24', 410, 155, 32, 'r'),
    write([2, '24'], 'by 6s', 62, 230, 20, 'd'), ...[6, 12, 18, 24].map(n => ({ ...write([2, '24'], String(n), x(n), 230, 26), quick: true })),
    write([2, '24'], 'by 4s', 62, 285, 20, 'd'), ...[4, 8, 12, 16, 20, 24].map(n => ({ ...write([2, '24'], String(n), x(n), 285, 26), quick: true })),
    ring([2, 'works'], x(24), 257, 24, 50, 'd'), cross([2, 'but'], 335, 135, 150, 40),
    ring([2, '12'], x(12), 257, 24, 50, 'y'),
    write([2, 'share'], 'buy 12 of each', 300, 355, 32, 'y'),
  ],
]
