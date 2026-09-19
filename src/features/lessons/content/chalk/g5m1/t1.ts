/** g5m1-t1's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, cells, wash, arrow, hop, cross, clock } from '../../../chalk'

type At = [number, string?]
// A place chart of four columns (Th H T O), 90 wide, from x = 120 to 480.
const X = [165, 255, 345, 435]
const heads = (at: At, y: number): ChalkMark[] =>
  ['Th', 'H', 'T', 'O'].map((h, i) => ({ ...write(at, h, X[i], y, 22, 'd'), quick: true }))
/** Digits into a row of the chart, from column `from` (0 = Th). */
const digits = (at: At, from: number, ds: string, y: number, c: 'w' | 'y' | 'b' = 'w'): ChalkMark[] =>
  [...ds].map((d, i) => ({ ...write(at, d, X[from + i], y, 38, c), quick: true }))
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding takes too long
  [
    { ...write([0, '40'], '40 + 40 + 40 + 40 + 40', 300, 60, 30), quick: true },
    write([0, '40'], '+ 40 + 40 + 40 + 40 + 40', 300, 105, 30),
    write([0, 'ten'], '(10 times)', 300, 148, 24, 'd'),
    clock([1, 'while'], 90, 215, 26), write([1, 'lose'], 'lost count?', 250, 215, 26, 'r'),
    write([2, 'faster'], 'faster way', 480, 215, 26, 'y'),
    cells([2, 'chart'], 120, 280, 360, 70, 4), ...heads([2, 'places'], 262),
    ...digits([2, 'places'], 2, '40', 315, 'y'),
  ],
  // The big idea: left = 10 times, right = 1/10
  [
    ...heads([0, 'Slide'], 45), cells([0, 'Slide'], 120, 70, 360, 60, 4), ...digits([0, 'Slide'], 2, '40', 100),
    write([0, 'Slide'], '40', 65, 100, 28),
    cells([0, 'left'], 120, 190, 360, 60, 4), arrow([0, 'left'], [345, 134], [262, 184], 'r'),
    ...digits([0, 'worth'], 1, '400', 220, 'y'), write([0, 'worth'], '400', 65, 220, 28, 'y'),
    write([0, '10'], '× 10', 540, 160, 32, 'r'),
    cells([1, 'One'], 120, 300, 360, 60, 4), arrow([1, 'right'], [262, 254], [340, 294], 'b'),
    ...digits([1, 'worth'], 2, '40', 330, 'b'), write([1, 'worth'], '40', 65, 330, 28, 'b'),
    write([1, '1/10'], '1/10', 540, 280, 30, 'b'),
  ],
  // Each place is 10 of the next
  [
    cells([0, 'places'], 60, 60, 480, 60, 4),
    ...['ones', 'tens', 'hundreds', 'thousands'].map((h, i) => ({ ...write([0, 'right'], h, 480 - 120 * i, 90, 22), quick: true })),
    arrow([0, 'right'], [520, 140], [80, 140], 'd'),
    write([1, 'ones'], '10 ones = 1 ten', 300, 190, 28), hop([1, 'ten'], 480, 360, 56, 'y'),
    write([1, 'tens'], '10 tens = 1 hundred', 300, 240, 28), hop([1, 'hundred'], 360, 240, 56, 'y'),
    write([1, 'hundreds'], '10 hundreds = 1 thousand', 300, 290, 28), hop([1, 'thousand'], 240, 120, 56, 'y'),
    write([2, 'left'], 'one place left', 230, 350, 30), write([2, '10'], '= × 10', 400, 350, 30, 'r'),
  ],
  // Slide the 4 to the left
  [
    write([0, '40'], '40', 65, 95, 28), ...heads([0, '40'], 35), cells([0, '40'], 120, 60, 360, 70, 4),
    ...digits([0, 'tens'], 2, '40', 95, 'y'), write([0, 'tens'], '4 tens', 535, 95, 22, 'y'),
    cells([1, 'slide'], 120, 190, 360, 70, 4), arrow([1, 'slide'], [345, 134], [262, 184], 'r'),
    ...digits([1, 'hundreds'], 1, '4', 225, 'y'), write([1, 'hundreds'], '4 hundreds', 255, 290, 24, 'y'),
    ...digits([1, '400'], 2, '00', 225, 'y'), write([1, '400'], '400', 65, 225, 28, 'y'),
    write([2, '10'], '× 10', 215, 158, 28, 'r'),
    write([2, 'carton'], '1 carton = 400 pencils', 300, 342, 30, 'y'),
  ],
  // Slide it back to the right
  [
    cells([0, 'One'], 60, 40, 480, 50, 10, 'y'), wash([0, 'box'], 60, 40, 48, 50, 'b'),
    write([0, 'box'], '1 box', 84, 112, 22, 'b'), write([0, '1/10'], '= 1/10', 170, 112, 22, 'b'),
    write([0, 'carton'], 'carton', 300, 112, 22, 'y'),
    ...heads([1, '400'], 145), cells([1, '400'], 120, 160, 360, 60, 4),
    ...digits([1, '400'], 1, '400', 190, 'y'), write([1, '400'], '400', 540, 190, 30, 'y'),
    cells([1, 'right'], 120, 270, 360, 60, 4), arrow([1, 'right'], [262, 224], [340, 266], 'b'),
    ...digits([1, 'tens'], 2, '40', 300, 'b'), write([1, '40'], '40', 540, 300, 30, 'b'),
    write([2, '1/10'], '1/10 of 400', 209, 368, 28), write([2, '40'], '= 40 pencils', 384, 368, 28, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'trap']),
    write([1, 'Ten'], '10 × 40', 180, 170, 36), write([1, 'add'], '= 50', 300, 170, 36, 'r'),
    cross([1, '10'], 262, 150, 76, 40),
    ...digits([2, 'slides'], 2, '40', 240).map(m => ({ ...m, x: m.x! - 25 })),
    arrow([2, 'every'], [320, 262], [236, 304], 'r'), arrow([2, 'every'], [410, 262], [326, 304], 'r'),
    ...digits([2, 'left'], 1, '400', 330, 'y').map(m => ({ ...m, x: m.x! - 25 })),
  ],
]
