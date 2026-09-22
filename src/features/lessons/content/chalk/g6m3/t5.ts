/** g6m3-t5's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, ring } from '../../../chalk'

type At = [number, string?]
type C = 'w' | 'y' | 'b' | 'r'
// Long division, size 36: 24 outside the bracket, the dividend's digits in columns 28 px apart (x 185 · 213 · 241 · 269).
// Rows: answer at y 42, the dividend at 90, then 135 · 178 · 222 · 266 · 310 · 354 going down. Working on the right, x 355 … 565.
// Yellow = a digit of the answer, blue = a number brought down, coral = too big / the mix-up.
const X = [185, 213, 241, 269], S = 36, R = [135, 178, 222, 266, 310, 354]
const q = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))
const digits = (at: At, t: string, y: number, from: number, c: C = 'w') => [...t].map((ch, i) => write(at, ch, X[from + i], y, S, c))
const setup = (at: At, n = '5184'): ChalkMark[] =>
  q([write(at, '24', 110, 90, S), { beat: at[0], at: at[1], d: 'M150 112 Q164 88 150 64 H300' }, ...digits(at, n, 90, 0)])
/** Take away `t` under columns `from`…, on row `r`, with its line. */
const takeAway = (at: At, t: string, r: number, from: number): ChalkMark[] => [
  write(at, '−', X[from] - 26, R[r], S), ...digits(at, t, R[r], from), line(at, [[X[from] - 14, R[r] + 19], [X[from + t.length - 1] + 14, R[r] + 19]]),
]
const under = (at: At, from: number, to: number, c: C) => line(at, [[X[from] - 12, 114], [X[to] + 12, 114]], c)
const warn = (at: At): ChalkMark[] => [line(at, [[460, 30], [505, 105], [415, 105], [460, 30]], 'r'), write(at, '!', 460, 80, 40, 'r')]
/** Round 1 as it stands once done: 2 on top, − 48, 3, and the 8 brought down. */
const round1 = (at: At): ChalkMark[] => q([write(at, '2', X[1], 42, S, 'y'), ...takeAway(at, '48', 0, 0), ...digits(at, '38', R[1], 1, 'b')])

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too big to do at once
  [
    ...setup([0, '5,184']), write([0, 'heart'], 'by heart? no', 460, 70, 26, 'r'),
    write([1, '24'], '24 × ?', 460, 135, 28), write([1, 'tables'], 'not in the tables', 460, 175, 24, 'r'),
    write([2, 'start'], 'where to start?', 460, 240, 26),
    ...X.map(x => line([2, 'piece'], [[x - 11, 114], [x + 11, 114]], 'b')),
    write([2, 'time'], 'one piece at a time', 300, 320, 32, 'b'),
  ],
  // The big idea: one digit at a time, guess, multiply, take away, bring down
  [
    ...setup([0, 'Go']), box([0, 'digit'], X[1] - 14, 20, 28, 42, 'y'),
    write([0, 'guess'], 'guess', 450, 50, 30, 'y'), write([0, 'round'], '24 is about 20', 450, 88, 22, 'd'),
    write([0, 'multiply'], 'multiply', 450, 145, 30),
    write([0, 'take'], 'take away', 450, 200, 30),
    write([0, 'bring'], 'bring down', 450, 255, 30, 'b'), arrow([0, 'down'], [X[3], 112], [X[3], 160], 'b'),
    arrow([0, 'down'], [565, 255], [565, 60], 'd'),
    write([0, 'down'], 'again, for each digit', 450, 320, 24, 'd'),
  ],
  // The first digit
  [
    ...setup([0, '24']), ring([0, '5'], X[0], 90, 16, 22, 'r'), write([0, '5'], '24 in 5? no', 460, 55, 24, 'r'),
    under([0, '51'], 0, 1, 'b'),
    write([1, 'about'], '24 is about 20', 460, 105, 24, 'd'), write([1, 'holds'], 'two 20s in 51', 460, 140, 24, 'd'),
    write([1, 'try'], 'try 2', 460, 180, 28),
    write([2, '48'], '2 × 24 = 48', 460, 235, 28), write([2, 'fits'], '2', X[1], 42, S, 'y'), write([2, 'fits'], 'fits', 460, 275, 24, 'y'),
    ...takeAway([3, 'away'], '48', 0, 0), write([3, '3'], '3', X[1], R[1], S, 'b'),
  ],
  // Bring down, again
  [
    ...setup([0, 'Now']), ...q([write([0, 'Now'], '2', X[1], 42, S, 'y'), ...takeAway([0, 'Now'], '48', 0, 0), write([0, 'Now'], '3', X[1], R[1], S, 'b')]),
    arrow([0, 'down'], [X[2], 112], [X[2], 160], 'b'), write([0, '8'], '8', X[2], R[1], S, 'b'), ring([0, '38'], (X[1] + X[2]) / 2, R[1], 34, 22, 'b'),
    write([1, 'one'], '1 × 24 = 24', 460, 110, 28), write([1, 'top'], '1', X[2], 42, S, 'y'),
    ...takeAway([2, '24'], '24', 2, 1), ...digits([2, '14'], '14', R[3], 1, 'b'),
  ],
  // The last digit
  [
    ...setup([0, 'Bring']), ...round1([0, 'Bring']), ...q([write([0, 'Bring'], '1', X[2], 42, S, 'y'), ...takeAway([0, 'Bring'], '24', 2, 1),
      ...digits([0, 'Bring'], '14', R[3], 1, 'b')]),
    arrow([0, 'down'], [X[3], 112], [X[3], 248], 'b'), write([0, '4'], '4', X[3], R[3], S, 'b'), ring([0, '144'], X[2], R[3], 50, 22, 'b'),
    write([1, '7'], 'guess 7', 460, 60, 26), write([1, '168'], '7 × 24 = 168', 460, 100, 28, 'r'), write([1, 'big'], 'too big', 460, 140, 24, 'r'),
    write([2, '6'], 'try 6', 460, 195, 26), write([2, '144'], '6 × 24 = 144', 460, 235, 28), write([2, 'exactly'], '6', X[3], 42, S, 'y'),
    ...takeAway([2, 'exactly'], '144', 4, 1),
    write([3, 'Nothing'], '0', X[3], R[5], S, 'b'), ring([3, '216'], X[2], 42, 50, 24, 'y'), write([3, 'boxes'], '216 boxes', 460, 320, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...setup([1, '4,920'], '4920'),
    ...q([write([1, '12'], '2', X[1], 42, S, 'y'), ...takeAway([1, '12'], '48', 0, 0), ...digits([1, '12'], '12', R[1], 1, 'b')]),
    write([1, '12'], '24 in 12? no', 460, 160, 24, 'r'),
    box([1, 'SKIP'], X[2] - 14, 20, 28, 42, 'r'),
    write([2, '0'], '0', X[2], 42, S, 'y'), arrow([2, 'down'], [X[3], 112], [X[3], 160], 'b'), write([2, 'digit'], '0', X[3], R[1], S, 'b'),
    write([2, '205'], '5', X[3], 42, S, 'y'), write([2, '205'], '4,920 ÷ 24 = 205', 440, 245, 28, 'y'),
    write([2, '25'], '25', 440, 315, 34, 'r'), cross([2, '25'], 412, 295, 56, 40),
  ],
]
