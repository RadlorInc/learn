/** g8m2-t4's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The plant's line y = 2x + 3 on a grid at the left (x 0–3, y 0–10); the equation and words on the right.
 *  Yellow is the first dot, the climb and results, blue the step across, coral the mix-up, dim the axes. */
import type { ChalkMark } from '../../../chalk'
import { write, line, ring, cross } from '../../../chalk'
import { warn } from '../g7m1/t1'
import { graph, q } from './t1'

type At = [number, string?]
const { X, Y, axes, dot, seg, stair } = graph(70, 370, 70, 30)
const grid = (at: At) => axes(at, [1, 2, 3], [2, 4, 6, 8, 10])
const C = 450   // centre of the words column
const label = (at: At, t: string, x: number, y: number) => write(at, t, x, y, 22, 'y')

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // A table is slow
  [
    write([0, '0'], 'x = 0 → y = ?', 300, 50, 30), write([0, '1'], 'x = 1 → y = ?', 300, 100, 30),
    write([0, '2'], 'x = 2 → y = ?', 300, 150, 30),
    write([1, 'slow'], 'slow', 300, 215, 32, 'r'),
    write([1, 'Yes'], 'a faster way', 300, 265, 32, 'y'),
    write([2, 'equation'], 'y = 2x + 3', 300, 345, 40),
  ],
  // The big idea: first dot at b, then stairs of up ÷ across
  [
    ...grid([0, 'Put']),
    ...dot([0, 'dot'], 0, 3, 'y'), write([0, 'b'], 'b', X(0) + 26, Y(3) + 18, 26, 'y'),
    ...stair([0, 'step'], [0, 'step'], 0, 3, 1, 2),
    write([0, 'slope'], 'slope =', 390, 180, 28),
    ...stair([0, 'again'], [0, 'again'], 1, 5, 1, 2), ...dot([0, 'again'], 1, 5), ...dot([0, 'again'], 2, 7),
    write([0, 'across'], 'across', 500, 212, 26, 'b'), line([0, 'bottom'], [[455, 182], [545, 182]]),
    write([0, 'up'], 'up', 500, 150, 30, 'y'),
  ],
  // Start at b
  [
    ...grid([0]),
    write([0, 'In'], 'y = 2x + 3', C, 70, 36), ring([0, 'plain'], C + 81, 70, 16, 22, 'y'),
    ...dot([1, 'dot'], 0, 3, 'y'), label([1, '0'], '(0, 3)', 125, Y(3)),
    write([2, 'weeks'], 'week 0: 3 cm', C, 160, 30, 'y'),
  ],
  // Step by the slope
  [
    ...grid([0]), q(write([0], 'y = 2x + 3', C, 60, 30, 'd')), ...dot([0], 0, 3, 'y'), q(label([0], '(0, 3)', 125, Y(3) + 24)),
    write([0, 'up'], '2 up', C, 140, 32, 'y'), write([0, 'across'], '1 across', C, 195, 32, 'b'),
    seg([1, 'across'], [[0, 3], [1, 3]], 'b'), seg([1, 'up'], [[1, 3], [1, 5]], 'y'),
    ...dot([1, '5'], 1, 5), label([1, '5'], '(1, 5)', 180, Y(5) + 22),
    ...stair([2, 'again'], [2, 'same'], 1, 5, 1, 2), ...dot([2, '7'], 2, 7), label([2, '7'], '(2, 7)', 250, Y(7) + 22),
  ],
  // Join the dots
  [
    ...grid([0]), q(write([0], 'y = 2x + 3', C, 50, 30, 'd')),
    ...[[0, 3], [1, 5], [2, 7]].flatMap(([x, y]) => dot([0], x, y)),
    seg([0, 'line'], [[0, 3], [3.4, 9.8]], 'y'),
    ring([1, 'really'], X(2), Y(7), 20, 20, 'b'), write([1, 'really'], '(2, 7)?', X(2) + 70, Y(7) + 10, 22, 'b'),
    write([1, 'Put'], 'x = 2', C, 120, 32),
    write([2, '2'], '2 × 2 + 3 =', C - 20, 190, 32), write([2, '7'], '7', C + 90, 190, 32, 'y'),
    write([2, 'matches'], 'on the line', C, 255, 30, 'y'),
  ],
  // One thing not to do — left: first dot at the slope (crossed); right: at the plain number
  [
    ...warn([0, 'mix']),
    write([1], 'y = 2x + 3', 300, 140, 34),
    line([1, 'SLOPE'], [[70, 205], [70, 360], [240, 360]], 'd'),
    { beat: 1, at: 'SLOPE', c: 'r', wash: true, d: 'M63 310 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0' }, { beat: 1, at: 'SLOPE', c: 'r', d: 'M63 310 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0' },
    write([1, 'SLOPE'], '(0, 2)', 125, 310, 24, 'r'), cross([1, 'not'], 172, 292, 36, 36),
    line([2, 'first'], [[360, 205], [360, 360], [530, 360]], 'd'),
    { beat: 2, at: 'first', c: 'y', wash: true, d: 'M353 285 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0' }, { beat: 2, at: 'first', c: 'y', d: 'M353 285 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0' },
    write([2, 'plain'], '(0, 3)', 415, 300, 24, 'y'),
    line([2, 'stepping'], [[360, 285], [410, 285]], 'b'), line([2, 'stepping'], [[410, 285], [410, 235]], 'y'),
    write([2, 'stepping'], '2 = the step', 470, 225, 22, 'y'),
  ],
]
