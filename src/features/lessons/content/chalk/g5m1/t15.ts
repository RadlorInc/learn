/** g5m1-t15's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, ring } from '../../../chalk'

type At = [number, string]
type C = 'w' | 'y' | 'b' | 'r'
// Long division, size 38: 13 outside the bracket, the digits of 312 in columns 30 px apart (3 · 1 · 2 at x 230 · 260 · 290).
// Rows: answer 40, 312 at 90, then 135 · 180 · 225 · 270 going down.
const X = [230, 260, 290], S = 38
const q = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))
const digits = (at: At, t: string, y: number, from: number, c: C = 'w') => [...t].map((ch, i) => write(at, ch, X[from + i], y, S, c))
const setup = (at: At): ChalkMark[] => q([
  write(at, '13', 150, 90, S), { beat: at[0], at: at[1], d: 'M190 112 Q204 88 190 64 H340' }, ...digits(at, '312', 90, 0),
])
/** The tens round as it stands once done: 2 up top, − 26, the line, 5 left. */
const tensDone = (at: At): ChalkMark[] => q([
  write(at, '2', X[1], 40, S, 'y'), write(at, '−', 205, 135, S), ...digits(at, '26', 135, 0), line(at, [[215, 155], [275, 155]]), write(at, '5', X[1], 180, S, 'b'),
])
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]

export const T15: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too much for one guess
  [
    ...setup([0, 'This']),
    write([0, 'fit'], '13 fits into 31', 470, 90, 24, 'b'), line([0, '31'], [[218, 115], [272, 115]], 'y'),
    box([1, 'tens'], 246, 18, 28, 44, 'y'), write([1, 'tens'], '?', X[1], 40, S, 'y'),
    box([1, 'ones'], 276, 18, 28, 44, 'b'), write([1, 'ones'], '?', X[2], 40, S, 'b'),
    write([1, 'guess'], 'not 1 guess', 470, 170, 26, 'r'),
  ],
  // The big idea
  [
    ...setup([0, 'Divide']),
    box([0, 'tens'], 246, 18, 28, 44, 'y'), write([0, 'tens'], 'divide the tens', 470, 70, 26, 'y'),
    write([0, 'take'], 'take away', 470, 115, 26),
    arrow([1, 'bring'], [X[2], 110], [X[2], 165], 'b'), write([1, 'bring'], 'bring down', 470, 160, 26, 'b'),
    box([1, 'ones'], 276, 18, 28, 44, 'b'), write([1, 'again'], 'divide again', 470, 205, 26, 'y'),
  ],
  // Divide the tens
  [
    ...setup([0, 'Start']),
    line([0, '31'], [[218, 115], [272, 115]], 'y'),
    write([0, '2'], '2 × 13 = 26', 470, 70, 28), write([0, '3'], '3 × 13 = 39', 470, 120, 28, 'r'), write([0, 'too'], 'too many', 470, 160, 24, 'r'),
    write([1, '2'], '2', X[1], 40, S, 'y'),
    write([1, 'Take'], '−', 205, 135, S), ...digits([1, 'Take'], '26', 135, 0), line([1, '26'], [[215, 155], [275, 155]]),
    write([1, '5'], '5', X[1], 180, S, 'b'),
  ],
  // Bring down the ones
  [
    ...setup([0, '5']), ...tensDone([0, '5']),
    ring([0, 'left'], X[1], 180, 16, 22, 'b'), arrow([0, 'bring'], [X[2], 110], [X[2], 160], 'b'), write([0, 'write'], '2', X[2], 180, S, 'b'),
    ring([1, '52'], 275, 180, 36, 24, 'y'), write([1, '52'], '52 to divide', 470, 180, 26, 'y'),
  ],
  // Divide the ones
  [
    ...setup([0, 'Round']), ...tensDone([0, 'Round']), ...q([write([0, 'Round'], '2', X[2], 180, S, 'b')]),
    write([0, '4'], '4 × 13 = 52', 470, 80, 28), write([0, 'write'], '4', X[2], 40, S, 'y'),
    write([1, 'Take'], '−', 232, 225, S), ...digits([1, 'Take'], '52', 225, 1), line([1, '52'], [[245, 245], [305, 245]]),
    write([1, '0'], '0', X[2], 270, S, 'b'),
    write([2, '312'], '312 ÷ 13 = 24', 470, 300, 28, 'y'), ring([2, '24'], 275, 40, 36, 24, 'y'),
    write([2, 'cartons'], '24 cartons', 470, 350, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'watch']),
    write([1, 'stop'], '312 ÷ 13 = 2, 5 left', 300, 170, 30, 'r'), cross([1, 'tens'], 150, 150, 300, 40),
    write([2, '2'], 'the 2 ones', 180, 250, 28, 'b'), arrow([2, 'down'], [180, 272], [180, 320], 'b'),
    write([2, 'done'], 'done: every digit down', 410, 340, 24, 'y'),
  ],
]
