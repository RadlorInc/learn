/** g5m1-t16's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, ring } from '../../../chalk'

type At = [number, string?]
type C = 'w' | 'y' | 'b' | 'r'
// Long division, size 36: 24 outside the bracket, the digits of 1,176 in columns 28 px apart (1 · 1 · 7 · 6 at x 185 · 213 · 241 · 269).
// Rows: answer 42, 1176 at 90, then 135 · 178 · 222 · 266 going down. The working goes on the right, x 355 … 565.
const X = [185, 213, 241, 269], S = 36
const q = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))
const digits = (at: At, t: string, y: number, from: number, c: C = 'w') => [...t].map((ch, i) => write(at, ch, X[from + i], y, S, c))
const bracket = (at: At): ChalkMark => ({ beat: at[0], at: at[1], d: 'M150 112 Q164 88 150 64 H300' })
const setup = (at: At): ChalkMark[] => q([write(at, '24', 110, 90, S), bracket(at), ...digits(at, '1176', 90, 0)])
/** The first round as it stands once done: 4 over the 7, − 96, the line, 21, and the 6 brought down. */
const firstDone = (at: At): ChalkMark[] => q([
  write(at, '4', X[2], 42, S, 'y'), write(at, '−', 190, 135, S), ...digits(at, '96', 135, 1), line(at, [[200, 154], [255, 154]]),
  ...digits(at, '216', 178, 1, 'b'),
])
const under = (at: At, from: number, to: number, y: number, c: C) => line(at, [[X[from] - 10, y], [X[to] + 10, y]], c)
const warn = (at: At): ChalkMark[] => [line(at, [[460, 30], [505, 105], [415, 105], [460, 30]], 'r'), write(at, '!', 460, 80, 40, 'r')]

export const T16: (ChalkMark[] | undefined)[] = [
  undefined,
  // Where do you start?
  [
    ...setup([0, 'Where']), write([0, 'start'], 'where to start?', 460, 60, 26, 'y'),
    under([1, '11'], 0, 1, 114, 'r'), write([1, 'fit'], '24 in 11? no', 460, 115, 26, 'r'),
    box([2, 'left'], 199, 20, 28, 42, 'r'), write([2, 'left'], '?', X[1], 42, S, 'r'),
    write([2, 'off'], 'every digit 1 place off', 440, 180, 24, 'r'),
  ],
  // The big idea: start where 24 first fits, then one digit at a time
  [
    ...setup([0, 'Start']),
    under([0, 'fits'], 0, 2, 116, 'y'), write([0, 'fits'], '24 fits into 117', 460, 80, 26, 'y'),
    box([0, 'fits'], 227, 20, 28, 42, 'y'), write([0, 'fits'], 'start here', 330, 35, 22, 'y'),
    arrow([0, 'bring'], [X[3], 112], [X[3], 165], 'b'), write([0, 'time'], 'then one digit at a time', 440, 150, 24, 'b'),
  ],
  // Find where to start
  [
    ...setup([0, 'Does']),
    write([0, '1'], '1', 400, 70, 30, 'b'), write([0, 'No'], 'no', 510, 70, 30, 'r'),
    write([0, '11'], '11', 400, 120, 30, 'b'), write([0, '11'], 'no', 510, 120, 30, 'r'),
    write([1, '117'], '117', 400, 170, 30, 'y'), write([1, 'Yes'], 'yes', 510, 170, 30, 'y'), under([1, 'three'], 0, 2, 116, 'y'),
    box([2, 'answer'], 227, 20, 28, 42, 'y'), write([2, 'answer'], '?', X[2], 42, S, 'y'), ring([2, '7'], X[2], 90, 14, 22, 'b'),
  ],
  // Divide, take away, bring down
  [
    ...setup([0]), under([0, '117'], 0, 2, 116, 'y'),
    write([0, '24s'], 'how many 24s?', 460, 45, 24, 'd'),
    write([0, '4'], '4 × 24 = 96', 460, 95, 28), write([0, '5'], '5 × 24 = 120', 460, 140, 28, 'r'), write([0, 'too'], 'too many', 460, 178, 24, 'r'),
    write([1, 'Write'], '4', X[2], 42, S, 'y'),
    write([1, 'take'], '−', 190, 135, S), ...digits([1, '96'], '96', 135, 1), line([1, '96'], [[200, 154], [255, 154]]),
    ...digits([1, '21'], '21', 178, 1, 'b'),
    arrow([2, 'bring'], [X[3], 112], [X[3], 160], 'b'), write([2, '6'], '6', X[3], 178, S, 'b'), ring([2, '216'], X[2], 178, 44, 24, 'y'),
  ],
  // The last digit
  [
    ...setup([0, 'One']), ...firstDone([0, 'One']),
    write([0, '9'], '9 × 24 = 216', 460, 80, 28), write([0, 'write'], '9', X[3], 42, S, 'y'),
    write([1, '216'], '−', 190, 222, S), ...digits([1, '216'], '216', 222, 1), line([1, '0'], [[200, 242], [283, 242]]),
    write([1, '0'], '0', X[3], 266, S, 'b'), write([1, 'left'], 'no digits left', 460, 200, 26, 'd'),
    write([2, '1,176'], '1,176 ÷ 24 = 49', 460, 290, 28, 'y'), ring([2, '49'], 255, 42, 34, 24, 'y'),
    write([2, 'stickers'], '49 stickers', 460, 340, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...setup([1, "Don't"]), write([1, 'first'], '4', X[1], 42, S, 'r'), cross([1, 'second'], X[1] - 12, 26, 24, 32),
    write([1, 'goes'], '4', X[2], 42, S, 'y'), ring([1, 'goes'], X[2], 42, 16, 22, 'y'), under([1, 'LAST'], 0, 2, 116, 'y'),
    write([2, '490'], 'over the 1: 490', 300, 220, 30, 'r'), write([2, 'times'], '10 times too many', 300, 290, 28, 'r'),
  ],
]
