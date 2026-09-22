/** g8m2-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The taxi line y = 2x + 1 on a grid at the left (x 0–4, y 0–10); the equation and words on the right.
 *  Blue is the slope (the step), yellow the crossing point and results, coral the mix-up, dim the axes. */
import type { ChalkMark } from '../../../chalk'
import { write, line, ring, cross } from '../../../chalk'
import { warn } from '../g7m1/t1'
import { graph, q } from './t1'

type At = [number, string?]
const { X, Y, axes, dot, seg, stair } = graph(70, 370, 55, 26)
const grid = (at: At) => axes(at, [1, 2, 3, 4], [2, 4, 6, 8, 10])
const taxi = (at: At) => seg(at, [[0, 1], [4.5, 10]])
const C = 440   // centre of the words column
/** 'y = 2x + 1' (or any 10-character equation) centred on cx at size s; the x centre of character i. */
const chr = (cx: number, s: number, i: number, n = 10) => cx - (n * s * 0.5) / 2 + s * 0.5 * (i + 0.5)

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two numbers, two jobs
  [
    write([0, 'equation'], 'y = 2x + 1', C, 70, 44),
    ring([0, '2'], chr(C, 44, 4), 70, 15, 26, 'b'), ring([0, '1'], chr(C, 44, 9), 70, 15, 26, 'y'),
    ...grid([1, 'graph']), taxi([1, 'graph']),
    write([1, 'jobs'], 'two jobs', C, 170, 32, 'y'),
    write([1, 'Which'], 'which is which?', C, 225, 28),
  ],
  // The big idea: m is the step, b is the crossing
  [
    ...grid([0, 'In']), taxi([0, 'In']),
    write([0, 'In'], 'y = mx + b', C, 70, 40),
    ring([0, 'front'], chr(C, 40, 4), 70, 15, 24, 'b'), write([0, 'slope'], 'slope', chr(C, 40, 4), 125, 24, 'b'),
    ...stair([0, 'slope'], [0, 'slope'], 1, 3, 1, 2),
    ring([0, 'plain'], chr(C, 40, 9), 70, 15, 24, 'y'), write([0, 'crosses'], 'crossing', 165, 348, 24, 'y'),
    ...dot([0, 'crosses'], 0, 1, 'y'), ring([0, 'y-axis'], X(0), Y(1), 18, 18, 'y'),
  ],
  // Start at x = 0
  [
    ...grid([0]), taxi([0]),
    write([0, 'Try'], 'x = 0', C, 70, 36),
    write([0, 'miles'], 'no miles yet', C, 120, 24, 'd'),
    write([1, '2'], 'y = 2 × 0 + 1', C, 180, 30),
    write([1, '1'], 'y = 1', C, 235, 36, 'y'),
    ...dot([2, 'crosses'], 0, 1, 'y'), write([2, '0'], '(0, 1)', 125, 330, 22, 'y'),
    write([2, 'get'], '$1 to get in', C, 310, 30, 'y'),
  ],
  // The number in front of x
  [
    ...grid([0]), taxi([0]), ...dot([0], 0, 1, 'y'),
    seg([0, 'across'], [[0, 1], [1, 1]], 'b'), write([0, 'across'], '1', X(0.5), Y(1) + 18, 20, 'b'),
    seg([1, 'climbs'], [[1, 1], [1, 3]], 'y'), write([1, 'climbs'], '2', X(1) + 16, Y(2), 22, 'y'),
    write([1, 'climbs'], 'each 1 across: up 2', C, 100, 26, 'y'),
    ...dot([1, '3'], 1, 3),
    ...stair([1, 'then'], [1, '5'], 1, 3, 1, 2), ...dot([1, '5'], 2, 5),
    write([2, 'slope'], 'slope = 2', C, 190, 36, 'y'),
    write([2, 'mile'], '$2 a mile', C, 250, 30),
  ],
  // Read any equation — a table: equation | slope | crosses at
  [
    write([0, 'equation'], 'y = mx + b', 150, 90, 30, 'd'), write([0, 'equation'], 'slope', 370, 90, 28, 'd'),
    write([0, 'equation'], 'crosses at', 510, 90, 28, 'd'), line([0, 'equation'], [[40, 120], [580, 120]], 'd'),
    write([1, 'y'], 'y = 3x + 4', 150, 170, 34), write([1, 'climbs'], '3', 370, 170, 36, 'b'), write([1, 'crosses'], '4', 510, 170, 36, 'y'),
    write([2, 'y'], 'y = x + 5', 150, 250, 34),
    write([2, 'lone'], 'x means 1x', 150, 305, 24, 'b'),
    write([2, 'climbs'], '1', 370, 250, 36, 'b'), write([2, 'crosses'], '5', 510, 250, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'In'], 'y = 2x + 1', 300, 145, 40),
    write([1, 'cross'], 'crosses at 2', 300, 205, 32, 'r'), cross([1, '2'], 410, 187, 36, 36),
    ring([2, 'stuck'], chr(300, 40, 4), 145, 15, 24, 'b'), write([2, 'slope'], 'slope 2', 190, 290, 32, 'b'),
    ring([2, 'plain'], chr(300, 40, 9), 145, 15, 24, 'y'), write([2, 'crossing'], 'crosses at 1', 420, 290, 32, 'y'),
  ],
]
