/** g3m1-t5's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, hop, ring, cross } from '../../../chalk'
import { trike, car, numLine, tick, type At } from './t5to8'

const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
// A number line 0–12, 36 px a unit, from x = 90.
const U = 36, X0 = 90, px = (n: number) => X0 + n * U
const TX = [0, 1, 2, 3].map(i => px(3 * i + 1.5))   // a tricycle above each jump of 3
const CX = [0, 1, 2].map(i => px(4 * i + 2))        // a car above each jump of 4
const jump = (at: At, from: number, by: number, y: number): ChalkMark[] =>
  [hop(at, px(from), px(from + by), y, 'y'), { ...write(at, String(from + by), px(from + by), y + 32, 26, 'y'), quick: true }]

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // 3s are new
  [
    write([0, '2s'], 'by 2s:  2, 4, 6, 8', 300, 60, 28),
    write([0, '5s'], 'by 5s:  5, 10, 15, 20', 300, 115, 28),
    write([0, '10s'], 'by 10s:  10, 20, 30, 40', 300, 170, 28),
    write([1, '3s'], 'by 3s:  3, ?, ?, ?', 300, 245, 30, 'y'), write([1, 'new'], 'new', 510, 245, 24, 'b'),
    write([2, 'Yes'], 'yes, the same way', 280, 330, 30, 'y'), tick([2, 'Yes'], 445, 328),
  ],
  // The big idea
  [
    write([0, '3s'], '3s', 45, 160, 30), numLine([0, '3s'], X0, 160, 12, U), write([0, '3s'], '0', X0, 190, 20, 'd'),
    write([0, '4s'], '4s', 45, 320, 30, 'b'), numLine([0, '4s'], X0, 320, 12, U, 'b'), write([0, '4s'], '0', X0, 350, 20, 'd'),
    write([0, 'like'], 'just like 2s and 5s', 300, 40, 24, 'd'),
    ...[0, 3, 6, 9].flatMap(n => [{ ...hop([0, 'add'], px(n), px(n + 3), 160, 'y'), quick: true }, { ...write([0, 'add'], '+3', px(n + 1.5), 82, 22, 'y'), quick: true }]),
    ...[0, 4, 8].flatMap(n => [{ ...hop([0, 'every'], px(n), px(n + 4), 320, 'b'), quick: true }, { ...write([0, 'every'], '+4', px(n + 2), 222, 22, 'b'), quick: true }]),
  ],
  // Jump by 3s
  [
    ...TX.map(x => trike([0, 'tricycle'], x, 110)), write([0, 'wheels'], '3 each', 545, 110, 22, 'd'),
    numLine([0, 'jump'], X0, 290, 12, U), write([0, 'jump'], '0', X0, 322, 26, 'd'),
    ...(['Three', 'six', 'nine', 'twelve'] as const).flatMap((w, i) => [ring([1, w], TX[i], 105, 38, 34, 'y'), ...jump([1, w], 3 * i, 3, 290)]),
    write([2, '12'], '4 jumps of 3 = 12', 300, 370, 30, 'y'),
  ],
  // Now cars
  [
    ...CX.map(x => car([0, 'car'], x, 110)), write([0, 'wheels'], '4 each', 545, 110, 22, 'd'),
    numLine([0, 'Jump'], X0, 290, 12, U, 'b'), write([0, 'Jump'], '0', X0, 322, 26, 'd'),
    ...(['Four', 'eight', 'twelve'] as const).flatMap((w, i) => [ring([1, w], CX[i], 110, 44, 40, 'y'), ...jump([1, w], 4 * i, 4, 290)]),
    write([2, '12'], '3 jumps of 4 = 12', 300, 370, 30, 'y'),
  ],
  // Two facts
  [
    ...[70, 130, 190, 250].map(x => trike([1, 'tricycles'], x, 110, 0.75)), write([1, 'wheels'], '12 wheels', 160, 165, 24, 'd'),
    write([1, 'so'], '4 × 3 = 12', 440, 115, 40, 'y'),
    ...[85, 175, 265].map(x => car([2, 'cars'], x, 265, 0.75)), write([2, 'wheels'], '12 wheels', 175, 325, 24, 'd'),
    write([2, 'so'], '3 × 4 = 12', 440, 270, 40, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ADD'], '+1', 165, 170, 40, 'r'),
    write([2, 'gives'], '3, 4, 5, 6', 165, 240, 34, 'r'), cross([2, '6'], 80, 212, 170, 56),
    write([2, 'jump'], '+3', 435, 170, 40, 'y'),
    write([2, 'goes'], '3, 6, 9, 12', 435, 240, 34, 'y'), tick([2, 'goes'], 435, 300),
  ],
]
