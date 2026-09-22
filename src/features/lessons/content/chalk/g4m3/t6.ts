/** g4m3-t6's chalkboards: index = screen index (0 is Screen 1, which has none). Digits on top yellow, what is left blue. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, ring } from '../../../chalk'
import { q, warn } from './t5'

type At = [number, string?]
type C = 'w' | 'y' | 'b' | 'r' | 'd'
// Long division, size 38: 3 outside the bracket, 372 in columns 30 px apart (x 230 · 260 · 290). Answer row y 40,
// 372 at 90, then the work rows 135 · 180 · 225 · 270 · 315 · 360. Notes on the right at x 470.
const X = [230, 260, 290], S = 38
const d = (at: At, ch: string, col: number, y: number, c: C = 'w') => write(at, ch, X[col], y, S, c)
const setup = (at: At): ChalkMark[] => q([
  write(at, '3', 150, 90, S), { beat: at[0], at: at[1], d: 'M190 112 Q204 88 190 64 H340' },
  d(at, '3', 0, 90), d(at, '7', 1, 90), d(at, '2', 2, 90),
])
const minus = (at: At, x: number, y: number) => write(at, '−', x, y, S)
/** Rows once the hundreds are done: 1 on top, − 3, the line, 0 and the 7 brought down. */
const hundredsDone = (at: At): ChalkMark[] => q([
  d(at, '1', 0, 40, 'y'), minus(at, 205, 135), d(at, '3', 0, 135), line(at, [[215, 155], [245, 155]]),
  d(at, '0', 0, 180, 'b'), d(at, '7', 1, 180, 'b'),
])
/** …and the tens: 2 on top, − 6, the line, 1 and the 2 brought down. */
const tensDone = (at: At): ChalkMark[] => q([
  d(at, '2', 1, 40, 'y'), minus(at, 235, 225), d(at, '6', 1, 225), line(at, [[245, 245], [275, 245]]),
  d(at, '1', 1, 270, 'b'), d(at, '2', 2, 270, 'b'),
])
const note = (at: At, t: string, y: number, c: C = 'w', s = 28) => write(at, t, 470, y, s, c)

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too big to break apart
  [
    ...setup([0, '372']), note([0, 'parts'], '300 + 72?', 70, 'd', 26),
    note([1, 'hard'], 'hard to find', 120, 'r', 26),
    ...q([0, 1, 2].map(i => box([2, 'digit'], X[i] - 14, 18, 28, 44, 'y'))),
    note([2, 'time'], 'one digit at a time', 190, 'y', 26),
  ],
  // The big idea: biggest place first, then divide, multiply, take away, bring down
  [
    ...setup([0, 'Share']), ring([0, 'biggest'], X[0], 90, 17, 24, 'y'),
    note([0, 'divide'], '1. divide', 70, 'w', 26), note([0, 'multiply'], '2. multiply', 120, 'w', 26),
    note([0, 'take'], '3. take away', 170, 'w', 26),
    note([0, 'bring'], '4. bring down', 220, 'b', 26), arrow([0, 'bring'], [X[1], 112], [X[1], 165], 'b'),
  ],
  // The hundreds
  [
    ...setup([0, 'Start']), ring([0, 'hundreds'], X[0], 90, 17, 24, 'y'),
    note([1, 'shared'], '3 ÷ 3 = 1', 70), d([1, 'top'], '1', 0, 40, 'y'),
    note([2, '1'], '1 × 3 = 3', 120), minus([2, 'and'], 205, 135), d([2, 'and'], '3', 0, 135), line([2, 'and'], [[215, 155], [245, 155]]),
    d([2, '0'], '0', 0, 180, 'b'),
    arrow([3, 'bring'], [X[1], 112], [X[1], 160], 'b'), d([3, '7'], '7', 1, 180, 'b'),
  ],
  // The tens
  [
    ...setup([0, 'Now']), ...hundredsDone([0, 'Now']), ring([0, 'tens'], X[1], 180, 16, 22, 'b'),
    note([0, 'fit'], 'how many 3s in 7?', 70, 'd', 26),
    note([1, 'because'], '2 × 3 = 6', 120), d([1, 'top'], '2', 1, 40, 'y'),
    minus([2, '6'], 235, 225), d([2, '6'], '6', 1, 225), line([2, '6'], [[245, 245], [275, 245]]),
    d([2, '1'], '1', 1, 270, 'b'),
    arrow([2, 'Bring'], [X[2], 112], [X[2], 250], 'b'), d([2, 'beside'], '2', 2, 270, 'b'),
    ring([2, '12'], 275, 270, 36, 24, 'b'), note([2, '12'], '12 to share', 270, 'b', 26),
  ],
  // The ones
  [
    ...setup([0, 'Last']), ...hundredsDone([0, 'Last']), ...tensDone([0, 'Last']),
    note([0, '12'], '12 ÷ 3 = 4', 70), d([0, 'top'], '4', 2, 40, 'y'),
    note([1, '4'], '4 × 3 = 12', 120), minus([1, 'and'], 235, 315), d([1, 'and'], '1', 1, 315), d([1, 'and'], '2', 2, 315),
    line([1, 'and'], [[245, 335], [305, 335]]), d([1, '0'], '0', 2, 360, 'b'),
    note([2, '372'], '372 ÷ 3 = 124', 250, 'y'), ring([2, '124'], X[1], 40, 52, 24, 'y'),
    note([2, 'stickers'], '124 stickers each', 310, 'y', 26),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, "Don't"], '372 ÷ 3 = 24', 300, 170, 34, 'r'), cross([1, 'hundreds'], 190, 150, 220, 40),
    ...q(['H', 'T', 'O'].map((h, i) => write([2, 'place'], h, 250 + 50 * i, 225, 22, 'd'))),
    ...['1', '2', '4'].map((n, i) => write([2, 'digit'], n, 250 + 50 * i, 262, 36, 'y')),
    write([2, '124'], '372 ÷ 3 = 124', 300, 340, 34, 'y'),
  ],
]
