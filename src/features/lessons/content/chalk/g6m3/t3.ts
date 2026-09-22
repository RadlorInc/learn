/** g6m3-t3's chalkboards: index = screen index (0 is Screen 1, which has none). Long division, 8.52 ÷ 4. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross, arrow } from '../../../chalk'
import { q, warn, dot, type At } from '../g5m4/t1'

/** The columns of 8.52 (the point between 8 and 5), and the rows of the working, top to bottom. */
const X = { a: 232, P: 262, b: 292, c: 334 }
type Col = 'a' | 'b' | 'c'
const Y = { q: 42, bar: 66, n: 95, m1: 135, r1: 153, n2: 181, m2: 221, r2: 239, n3: 267, m3: 307, r3: 325, n4: 353 }
const S = 34

const d = (at: At, t: string, col: Col, y: number, c: ChalkColor = 'w'): ChalkMark => write(at, t, X[col], y, S, c)
/** The house: the 4, the curve and the bar. */
const house = (at: At): ChalkMark[] => q([write(at, '4', 165, Y.n, S),
  { beat: at[0], at: at[1], c: 'w', d: `M195 ${Y.bar} Q214 ${Y.bar + 30} 195 ${Y.n + 25} M195 ${Y.bar} H390` }])
const dividend = (at: At): ChalkMark[] => q([d(at, '8', 'a', Y.n), dot(at, X.P, Y.n + 12), d(at, '5', 'b', Y.n), d(at, '2', 'c', Y.n)])
const topDot = (at: At): ChalkMark => dot(at, X.P, Y.q + 12, 'y')
/** "− 8" under the columns it takes away from (one digit per column, left to right). */
const minus = (at: At, t: string, cols: Col[], y: number): ChalkMark[] =>
  [write(at, '−', X[cols[0]] - 26, y, S), ...[...t].map((ch, i) => write(at, ch, X[cols[i]], y, S))]
const rule = (at: At, x1: number, x2: number, y: number): ChalkMark => line(at, [[x1, y], [x2, y]])
const note = (at: At, t: string, y: number, c: ChalkColor = 'd', s = 26): ChalkMark => write(at, t, 490, y, s, c)
const setup = (at: At): ChalkMark[] => [...house(at), ...dividend(at), { ...topDot(at), quick: true }]
/** Screen 5's working: 2 on top, − 8, 0, and the 5 brought down. */
const first = (at: At): ChalkMark[] => q([d(at, '2', 'a', Y.q, 'y'), ...minus(at, '8', ['a'], Y.m1), rule(at, 200, 252, Y.r1),
  d(at, '0', 'a', Y.n2), d(at, '5', 'b', Y.n2)])

// Colours: yellow = the answer on top and its point, blue = the point inside, coral = the slip, dim = the working.
export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // A point inside
  [
    ...house([0, 'divide']), ...dividend([1, '8.52']), ring([1, 'point'], X.P, Y.n + 12, 10, 13, 'b'),
    write([2, 'answer'], '?', 283, Y.q - 5, 40, 'y'),
  ],
  // The big idea
  [
    ...setup([0, 'Put']).slice(0, -1), ring([0, 'straight'], X.P, Y.n + 12, 10, 13, 'b'),
    arrow([0, 'above'], [X.P, Y.n - 12], [X.P, Y.q + 22], 'y'), topDot([0, 'above']),
    write([0, 'whole'], 'then 852 ÷ 4', 300, 250, 34, 'd'),
  ],
  // The point goes up first
  [
    ...house([0, 'Before']), ...dividend([0, 'Before']), topDot([0, 'point']),
    { ...line([1, 'above'], [[X.P, Y.n - 6], [X.P, Y.q + 20]], 'd'), w: 2 }, ring([1, '8.52'], X.P, Y.n + 12, 10, 13, 'b'),
    write([2, 'first'], 'point up first', 300, 250, 36, 'y'),
  ],
  // Divide the 8
  [
    ...setup([0, 'Start']), ring([0, '8'], X.a, Y.n, 17, 24, 'd'), note([0, '2'], '8 ÷ 4 = 2', Y.n),
    d([1, 'top'], '2', 'a', Y.q, 'y'), ...minus([1, '8,'], '8', ['a'], Y.m1), note([1, '8,'], '2 × 4 = 8', Y.m1),
    rule([1, '0'], 200, 252, Y.r1), d([1, '0'], '0', 'a', Y.n2), note([1, '0'], '8 − 8 = 0', Y.n2),
    arrow([2, 'down'], [X.b, Y.n + 22], [X.b, Y.n2 - 22], 'd'), d([2, '5'], '5', 'b', Y.n2),
  ],
  // Keep going
  [
    ...setup([0, '4']), ...first([0, '4']),
    d([0, 'one'], '1', 'b', Y.q, 'y'), ...minus([0, 'time'], '4', ['b'], Y.m2), rule([0, 'time'], 260, 312, Y.r2),
    d([0, '1'], '1', 'b', Y.n3), note([0, '1'], '5 − 4 = 1', Y.m2),
    arrow([1, 'down'], [X.c, Y.n + 22], [X.c, Y.n3 - 22], 'd'), d([1, '12.'], '2', 'c', Y.n3),
    d([1, 'three'], '3', 'c', Y.q, 'y'), note([1, 'three'], '12 ÷ 4 = 3', Y.n3),
    ...minus([1, 'nothing'], '12', ['b', 'c'], Y.m3), rule([1, 'nothing'], 260, 352, Y.r3), d([1, 'left'], '0', 'c', Y.n4),
    ring([2, '2.13'], 283, Y.q, 72, 24, 'y'), note([2, 'meters'], '2.13 m each', 355, 'y', 32),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'DROP'], '8.52 ÷ 4 =', 250, 170, 36), write([1, '213.'], '213', 390, 170, 36, 'r'), cross([1, '213.'], 350, 140, 85, 60),
    write([2, 'longer'], 'longer than the whole rope', 300, 240, 28, 'r'),
    write([2, '2.13.'], '8.52 ÷ 4 = 2.13', 300, 320, 38, 'y'),
  ],
]
