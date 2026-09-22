/** g5m1-t15's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, ring } from '../../../chalk'

type At = [number, string?]
type C = 'w' | 'y' | 'b' | 'r'
// Long division, size 38: 13 outside the bracket, the digits of 312 in columns 30 px apart (3 · 1 · 2 at x 230 · 260 · 290).
// Rows: answer 40, 312 at 90, then 135 · 180 · 225 · 270 going down. `dy` moves the whole sum down (Screen 7).
const X = [230, 260, 290], S = 38
const q = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))
const digits = (at: At, t: string, y: number, from: number, c: C = 'w') => [...t].map((ch, i) => write(at, ch, X[from + i], y, S, c))
const setup = (at: At, dy = 0): ChalkMark[] => q([
  write(at, '13', 150, 90 + dy, S), { beat: at[0], at: at[1], d: `M190 ${112 + dy} Q204 ${88 + dy} 190 ${64 + dy} H340` },
  ...digits(at, '312', 90 + dy, 0),
])
/** The tens round as it stands once done: 2 up top, − 26, the line, 5 left. */
const tensDone = (at: At, dy = 0): ChalkMark[] => q([
  write(at, '2', X[1], 40 + dy, S, 'y'), write(at, '−', 205, 135 + dy, S), ...digits(at, '26', 135 + dy, 0),
  line(at, [[215, 155 + dy], [275, 155 + dy]]), write(at, '5', X[1], 180 + dy, S, 'b'),
])
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]

export const T15: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too much for one guess
  [
    ...setup([0, '312']), write([0, 'guess'], 'one guess?', 470, 60, 26, 'r'),
    line([1, '31'], [[218, 115], [272, 115]], 'y'), write([1, 'fits'], '13 fits into 31', 470, 115, 24, 'y'),
    box([1, 'tens'], 246, 18, 28, 44, 'y'), write([1, 'tens'], '?', X[1], 40, S, 'y'), write([1, 'tens'], 'tens', 212, 40, 22, 'y'),
    box([1, 'ones'], 276, 18, 28, 44, 'b'), write([1, 'ones'], '?', X[2], 40, S, 'b'), write([1, 'ones'], 'ones', 338, 40, 22, 'b'),
    write([2, 'one'], 'one at a time', 470, 190, 28, 'y'),
  ],
  // The big idea: tens first, bring down, divide again
  [
    ...setup([0, 'Divide']),
    box([0, 'tens'], 246, 18, 28, 44, 'y'), write([0, 'first'], '1. divide the tens', 460, 70, 26, 'y'),
    arrow([0, 'bring'], [X[2], 112], [X[2], 165], 'b'), write([0, 'bring'], '2. bring down the ones', 460, 125, 24, 'b'),
    box([0, 'again'], 276, 18, 28, 44, 'y'), write([0, 'again'], '3. divide again', 460, 180, 26, 'y'),
  ],
  // Divide the tens
  [
    ...setup([0, 'Start']), line([0, '31'], [[218, 115], [272, 115]], 'y'),
    write([0, '13s'], 'how many 13s?', 460, 60, 26, 'd'),
    write([1, '2'], '2 × 13 = 26', 460, 110, 28), write([1, '3'], '3 × 13 = 39', 460, 160, 28, 'r'), write([1, 'too'], 'too many', 460, 200, 24, 'r'),
    write([2, '2'], '2', X[1], 40, S, 'y'),
    write([2, 'take'], '−', 205, 135, S), ...digits([2, 'take'], '26', 135, 0), line([2, '26'], [[215, 155], [275, 155]]),
    write([2, '5'], '5', X[1], 180, S, 'b'),
  ],
  // Bring down the ones
  [
    ...setup([0]), ...tensDone([0]),
    ring([0, 'left'], X[1], 180, 16, 22, 'b'), write([0, 'left'], '5 tens left', 460, 180, 26, 'b'),
    arrow([1, 'Bring'], [X[2], 112], [X[2], 160], 'b'), write([1, 'ones'], '2', X[2], 180, S, 'b'),
    ring([1, '52'], 275, 180, 36, 24, 'y'), write([1, 'divide'], '52 to divide', 460, 240, 26, 'y'),
  ],
  // Divide the ones
  [
    ...setup([0, 'Round']), ...tensDone([0, 'Round']), ...q([write([0, 'Round'], '2', X[2], 180, S, 'b')]),
    write([0, '4'], '4 × 13 = 52', 460, 80, 28), write([0, 'write'], '4', X[2], 40, S, 'y'),
    write([1, 'Take'], '−', 232, 225, S), ...digits([1, 'Take'], '52', 225, 1), line([1, '52'], [[245, 245], [305, 245]]),
    write([1, '0'], '0', X[2], 270, S, 'b'),
    write([2, '312'], '312 ÷ 13 = 24', 460, 300, 28, 'y'), ring([2, '24'], 275, 40, 36, 24, 'y'),
    write([2, 'cartons'], '24 cartons', 460, 350, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...setup([1, 'STOP'], 150), ...tensDone([1, 'STOP'], 150),
    write([1, 'STOP'], 'stop here?', 470, 250, 28, 'r'), cross([1, 'tens'], 400, 230, 140, 40),
    arrow([2, 'down'], [X[2], 262], [X[2], 310], 'b'), write([2, 'down'], '2', X[2], 330, S, 'b'),
    write([2, 'done'], 'done when every', 470, 310, 24, 'y'), write([2, 'digit'], 'digit is down', 470, 345, 24, 'y'),
  ],
]
