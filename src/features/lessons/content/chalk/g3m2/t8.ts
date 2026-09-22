/** g3m2-t8's chalkboards: index = screen index (0 is Screen 1, which has none). Also the column sums t9 draws with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, arrow, cross, cells } from '../../../chalk'
import { q, warn, type At } from './t6'

/** Columns: hundreds, tens, ones. Digits are written in fixed columns so every row lines up. */
export const COL = { H: 200, T: 260, O: 320 }
export const ROW = { head: 40, top: 88, a: 138, b: 196, rule: 226, ans: 272 }
const XS = [COL.H, COL.T, COL.O]
/** A three-digit number in the columns on row y. */
export const num = (at: At, n: string, y: number, c: ChalkColor = 'w', dx = 0): ChalkMark[] =>
  [...n].map((d, i) => write(at, d, XS[i] + dx, y, 44, c))
/** One digit into one column of the answer row. */
export const digit = (at: At, d: string, col: keyof typeof COL, c: ChalkColor = 'y', y = ROW.ans, dx = 0): ChalkMark => write(at, d, COL[col] + dx, y, 44, c)
export const heads = (at: At, dx = 0): ChalkMark[] => q(['H', 'T', 'O'].map((h, i) => write(at, h, XS[i] + dx, ROW.head, 22, 'd')))
/** a over b, the sign, and the rule. */
export const stack = (at: At, a: string, b: string, op: '+' | '−', dx = 0): ChalkMark[] => q([
  ...num(at, a, ROW.a, 'w', dx), write(at, op, 140 + dx, ROW.b, 44), ...num(at, b, ROW.b, 'w', dx),
  line(at, [[120 + dx, ROW.rule], [350 + dx, ROW.rule]]),
])
/** A ring round one column's two digits. */
export const colRing = (at: At, col: keyof typeof COL, c: ChalkColor = 'w'): ChalkMark => ring(at, COL[col], (ROW.a + ROW.b) / 2, 26, 62, c)
/** A side note on the right of the board. */
export const note = (at: At, t: string, y: number, c: ChalkColor = 'w', s = 28): ChalkMark => write(at, t, 480, y, s, c)
/** Small squares for ones, `gap` apart, starting at (x, y). */
export const ones = ([beat, at]: At, x: number, y: number, n: number, c: ChalkColor = 'w', gap = 32, s = 22): ChalkMark =>
  ({ beat, at, c, d: Array.from({ length: n }, (_, i) => `M${x + i * gap - s / 2} ${y - s / 2} h${s} v${s} h${-s} Z`).join(' ') })

// Colours: yellow = a digit of the answer, blue = the traded ten, dim = labels and the working, coral = the warning.
export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too many ones
  [
    ones([0, '6'], 70, 60, 6), write([0, '6'], '6 ones', 470, 60, 28),
    ones([0, '8'], 70, 110, 8), write([0, '8'], '8 ones', 470, 110, 28),
    write([0, '14'], '14 ones', 300, 170, 34),
    write([1, 'ones'], 'ones place', 170, 225, 22, 'd'), { ...line([1, 'place'], [[0, 0]], 'd'), d: 'M120 245 h100 v100 h-100 Z' },
    write([1, 'place'], '14', 170, 295, 44), cross([1, 'No'], 130, 262, 80, 66),
    write([1, 'digit'], 'one digit:', 420, 270, 28, 'y'), write([1, '9'], '0 to 9', 420, 315, 30, 'y'),
  ],
  // The big idea
  [
    write([0, 'ones'], 'ones', 55, 110, 22, 'd'),
    ones([0, 'ones'], 110, 60, 10), ones([0, 'ones'], 110, 110, 4),
    ring([0, '10'], 254, 60, 184, 30, 'b'),
    arrow([0, 'trade'], [300, 150], [300, 250], 'b'),
    cells([0, 'ten'], 150, 285, 300, 34, 10, 'b'), write([0, 'ten'], '1 ten', 520, 302, 30, 'b'),
  ],
  // Trade 10 ones for a ten
  [
    ...stack([0, '146'], '146', '128', '+').slice(0, 3), ...stack([0, '128'], '146', '128', '+').slice(3),
    ...heads([0, 'ones']), colRing([0, 'ones'], 'O'),
    note([1, '14'], '6 + 8 = 14', 110), note([1, 'ten'], '1 ten, 4 ones', 160, 'd', 26),
    digit([2, '4'], '4', 'O'), write([2, 'up'], '1', COL.T, ROW.top, 30, 'b'),
  ],
  // Add the tens
  [
    ...heads([0, 'Now']), ...stack([0, 'Now'], '146', '128', '+'), ...q([digit([0, 'Now'], '4', 'O'), write([0, 'Now'], '1', COL.T, ROW.top, 30, 'b')]),
    { ...ring([0, 'tens'], COL.T, (ROW.top + ROW.b) / 2, 28, 88, 'w') },
    ring([0, 'traded'], COL.T, ROW.top, 16, 20, 'b'),
    note([1, '7'], '1 + 4 + 2 = 7', 110), digit([1, 'tens'], '7', 'T'),
  ],
  // Add the hundreds
  [
    ...heads([0, 'Last']), ...stack([0, 'Last'], '146', '128', '+'),
    ...q([digit([0, 'Last'], '4', 'O'), digit([0, 'Last'], '7', 'T'), write([0, 'Last'], '1', COL.T, ROW.top, 30, 'b')]),
    colRing([0, 'hundreds'], 'H'), note([0, '2'], '1 + 1 = 2', 110), digit([0, '2'], '2', 'H'),
    ring([1, '274'], COL.T, ROW.ans, 92, 32, 'y'), write([1, 'books'], '274 books', 260, 350, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...stack([1, "Don't"], '146', '128', '+', -80), ring([1, 'traded'], COL.T - 80, ROW.top, 18, 22, 'r'),
    ...num([2, '264'], '264', ROW.ans, 'r', -80), cross([2, '264'], 90, ROW.ans - 26, 180, 52),
    ...stack([2, 'Add'], '146', '128', '+', 200), write([2, 'little'], '1', COL.T + 200, ROW.top, 30, 'b'),
    ...num([2, '274'], '274', ROW.ans, 'y', 200),
  ],
]
