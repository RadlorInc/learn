/** g8m4-t2's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A −5..5 grid on the left, numbers on the right. Yellow = the flip over the x-axis, blue = over the y-axis. */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'
import { grid, tri, name, type At } from './t1'

const G = (at: At) => grid(at, 160, 200, 28, -5, 5)
const { p } = G([0])
const A = p(2, 1), B = p(4, 1), C = p(2, 3)
const X = [p(2, -1), p(4, -1), p(2, -3)]        // over the x-axis
const Y = [p(-2, 1), p(-4, 1), p(-2, 3)]        // over the y-axis
const ABC = (at: At): ChalkMark[] => [tri(at, [A, B, C]), name(at, 'A', A, -12, -14), name(at, 'B', B, 14, -12), name(at, 'C', C, -14, -12)]
const xAxis = (at: At) => line(at, [p(-5, 0), p(5, 0)], 'b', 4)
const yAxis = (at: At) => line(at, [p(0, -5), p(0, 5)], 'b', 4)

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // A slide will not match: sliding down keeps it the same way up
  [
    ...G([0, 'Could']).marks, ...ABC([0, 'Could']),
    arrow([0, 'down'], p(5, 2), p(5, -2), 'd'),
    tri([1, 'comes'], [p(2, -3), p(4, -3), p(2, -1)], 'b'), write([1, 'way'], 'same way up', 455, 110, 28, 'b'),
    write([2, 'upside'], 'water: upside down', 455, 200, 26, 'y'),
    write([2, "can't"], "a slide can't do it", 455, 250, 26, 'r'),
  ],
  // The big idea: over the x-axis y changes sign, over the y-axis x changes sign
  [
    ...G([0, 'Flip']).marks, ...ABC([0, 'Flip']),
    xAxis([0, 'x-axis']), tri([0, 'y'], X, 'y'),
    write([0, 'y'], 'over the x-axis', 455, 90, 22, 'd'), write([0, 'sign'], 'y → −y', 455, 128, 32, 'y'),
    yAxis([0, 'y-axis']), tri([0, 'x'], Y, 'b'),
    write([0, 'x'], 'over the y-axis', 455, 210, 22, 'd'), write([0, 'x'], 'x → −x', 455, 248, 32, 'b'),
  ],
  // Same distance, other side: 1 above, 1 below
  [
    ...G([0, 'Look']).marks, ...ABC([0, 'Look']),
    ring([0, 'A'], A[0], A[1], 10, 10), write([0, '(2,'], 'A (2, 1)', 455, 80, 30),
    line([0, 'above'], [[A[0] + 10, A[1]], [A[0] + 10, 200]], 'y', 4), write([0, 'above'], '1', A[0] + 22, 186, 20, 'y'),
    line([1, 'below'], [[A[0] + 10, 200], [A[0] + 10, X[0][1]]], 'y', 4), write([1, 'below'], '1', A[0] + 22, 214, 20, 'y'),
    ring([1, 'down'], X[0][0], X[0][1], 10, 10),
    write([1, 'Same'], 'same distance,', 455, 170, 28), write([1, 'other'], 'other side', 455, 208, 28),
    name([2, 'becomes'], 'A′', X[0], -16, 14, 'y'), write([2, 'becomes'], 'A′ (2, −1)', 455, 290, 36, 'y'),
  ],
  // Only y changes: the list of three corners
  [
    ...G([0, 'other']).marks, ...ABC([0, 'other']),
    write([0, 'same'], 'A (2, 1) → (2, −1)', 455, 50, 24),
    write([1, 'B'], 'B (4, 1) → (4, −1)', 455, 90, 24),
    write([1, 'C'], 'C (2, 3) → (2, −3)', 455, 130, 24),
    tri([1, 'C'], X, 'y'),
    write([2, 'x'], 'x: stays', 455, 205, 28), write([2, 'y'], 'y: sign flips', 455, 245, 28, 'y'),
  ],
  // Flip over the y-axis: now x changes sign
  [
    ...G([0, 'flip']).marks, ...ABC([0, 'flip']), yAxis([0, 'y-axis']),
    arrow([1, 'swings'], [230, 72], [110, 72], 'd'), tri([1, 'left'], Y, 'b'),
    write([1, 'lands'], 'A (2, 1) → (−2, 1)', 455, 110, 26, 'b'),
    write([2, 'y'], 'y: stays', 455, 180, 28), write([2, 'x'], 'x: sign flips', 455, 220, 28, 'b'),
  ],
  // One thing not to do: over the x-axis, x does NOT change
  [
    ...warn([0, 'mix']),
    write([1, 'x-axis'], 'over the x-axis:', 300, 150, 28, 'd'),
    write([2, 'y'], 'only y changes', 300, 195, 32, 'y'),
    write([3, 'becomes'], '(2, 1) → (2, −1)', 300, 265, 34, 'y'),
    write([3, 'not'], '(2, 1) → (−2, 1)', 300, 330, 34), cross([3, 'not'], 322, 312, 108, 36),
  ],
]
