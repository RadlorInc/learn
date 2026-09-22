/** g8m3-t4's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: white = the tables and rules, blue = each step / where it starts, yellow = the speed and the result, coral = the mix-up. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, box, arrow, ring, cross } from '../../../chalk'
import { warn } from '../g5m1/t17'

type At = [beat: number, at?: string]
export const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })

/** A two-row table's lines: a label column `lw` wide, then `n` columns `cw` wide, rows `rh` high, top-left (x, y). */
export const tgrid = ([beat, at]: At, x: number, y: number, lw: number, cw: number, n: number, rh: number): ChalkMark => ({
  beat, at, c: 'd',
  d: `M${x} ${y} h${lw + cw * n} v${rh * 2} h${-(lw + cw * n)} Z M${x} ${y + rh} h${lw + cw * n}`
    + Array.from({ length: n }, (_, i) => ` M${x + lw + cw * i} ${y} v${rh * 2}`).join(''),
})
/** A small arrow dipping under a table row, from x1 to x2, with its label under it. */
export const dip = ([beat, at]: At, x1: number, x2: number, y: number, c: ChalkColor = 'b'): ChalkMark =>
  ({ beat, at, c, d: `M${x1} ${y} Q${(x1 + x2) / 2} ${y + 40} ${x2} ${y} M${x2 - 13} ${y + 4} L${x2} ${y} L${x2 - 3} ${y + 13}` })

// Ava's table: label column 40–160, weeks 0–3 in columns 100 wide.
const AX = (i: number) => 210 + 100 * i
const avaTable = (at: At, vals: boolean): ChalkMark[] => [
  q(tgrid(at, 40, 30, 120, 100, 4, 55)),
  q(write(at, 'weeks', 100, 57, 24, 'd')), ...[0, 1, 2, 3].map(i => q(write(at, String(i), AX(i), 57, 28, 'd'))),
  q(write(at, 'Ava $', 100, 112, 26)),
  ...(vals ? ['10', '16', '22', '28'].map((v, i) => q(write(at, v, AX(i), 112, 30))) : []),
]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not the same kind of picture
  [
    ...avaTable([0, 'table,'], true),
    q(write([0, 'rule.'], 'Ben:', 180, 205, 34, 'd')), write([0, 'rule.'], 'y = 8x + 2', 350, 205, 42),
    ring([1, '$10'], AX(0), 112, 30, 22, 'b'),
    ring([1, '$2'], 422, 205, 40, 28, 'b'),
    write([2, 'faster?'], 'Ava faster?', 300, 280, 32),
    write([2, 'grow.'], 'where you start ≠ how fast', 300, 345, 30, 'y'),
  ],
  // The big idea: up how much for each 1 step in x — the bigger one is faster
  [
    q(write([0, 'each'], 'Ava', 110, 100, 34)), write([0, 'each'], 'Ben', 110, 200, 34),
    q(write([0, 'step'], 'x + 1', 245, 100, 32, 'b')), write([0, 'step'], 'x + 1', 245, 200, 32, 'b'),
    q(arrow([0, 'x,'], [305, 100], [375, 100])), arrow([0, 'x,'], [305, 200], [375, 200]),
    q(write([0, 'x,'], 'up ?', 450, 100, 34)), write([0, 'x,'], 'up ?', 450, 200, 34),
    write([0, 'bigger'], 'bigger number', 300, 295, 34, 'y'),
    write([0, 'faster.'], '= grows faster', 300, 350, 32, 'y'),
  ],
  // Ava's table
  [
    ...avaTable([0, 'Ava'], false),
    write([0, '10,'], '10', AX(0), 112, 30), write([0, '16,'], '16', AX(1), 112, 30),
    write([0, '22,'], '22', AX(2), 112, 30), write([0, '28,'], '28', AX(3), 112, 30),
    dip([1, 'step?'], AX(0) + 12, AX(1) - 12, 150),
    write([1, '10'], '16 − 10 = 6', 300, 262, 34),
    write([1, '6,'], '+6', (AX(0) + AX(1)) / 2, 200, 24, 'b'),
    q(dip([1, 'every'], AX(1) + 12, AX(2) - 12, 150)), dip([1, 'every'], AX(2) + 12, AX(3) - 12, 150),
    q(write([1, 'every'], '+6', (AX(1) + AX(2)) / 2, 200, 24, 'b')), write([1, 'every'], '+6', (AX(2) + AX(3)) / 2, 200, 24, 'b'),
    write([2, 'week.'], 'Ava: up $6 a week', 300, 340, 36, 'y'),
  ],
  // Ben's rule
  [
    write([0, 'rule'], 'y = 8x + 2', 300, 55, 42),
    q(tgrid([1, 'weeks'], 110, 105, 110, 100, 3, 50)),
    q(write([1, 'weeks'], 'weeks', 165, 130, 24, 'd')), ...[0, 1, 2].map(i => q(write([1, 'weeks'], String(i), 270 + 100 * i, 130, 28, 'd'))),
    q(write([1, 'weeks'], 'Ben $', 165, 180, 26)),
    write([1, 'has'], '2', 270, 180, 30), write([1, '$10,'], '10', 370, 180, 30), write([1, '$18.'], '18', 470, 180, 30),
    q(dip([2, 'adds'], 282, 358, 215)), dip([2, 'adds'], 382, 458, 215),
    q(write([2, 'more,'], '+8', 320, 262, 24, 'b')), write([2, 'more,'], '+8', 420, 262, 24, 'b'),
    ring([2, 'front'], 281, 55, 16, 28, 'y'),
    write([3, 'week.'], 'Ben: up $8 a week', 300, 340, 36, 'y'),
  ],
  // Side by side
  [
    box([0, 'Ava'], 120, 188, 100, 132), q(write([0, 'Ava'], '6', 170, 254, 36)), write([0, 'Ava'], 'Ava', 170, 355, 28),
    box([0, '8.'], 380, 144, 100, 176), q(write([0, '8.'], '8', 430, 232, 36)), write([0, '8.'], 'Ben', 430, 355, 28),
    write([1, 'more'], '8 > 6', 300, 250, 38, 'y'),
    write([2, 'faster,'], 'Ben grows faster', 300, 75, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'pick'], 'Ava starts at $10 → faster', 265, 165, 30, 'r'),
    cross([1, 'higher.'], 488, 146, 40, 38),
    write([2, 'rule'], 'y = 8x + 2', 300, 250, 42),
    ring([2, 'starts.'], 374, 250, 36, 28, 'b'), write([2, 'starts.'], 'where he starts', 410, 312, 22, 'b'),
    ring([2, 'fast'], 281, 250, 16, 28, 'y'), write([2, 'fast'], 'how fast', 240, 312, 22, 'y'),
  ],
]
