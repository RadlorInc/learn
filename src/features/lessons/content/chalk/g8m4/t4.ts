/** g8m4-t4's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A 0..8 grid with (0, 0) at the bottom left. White = the triangle, yellow = twice as big, blue = only slid. */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'
import { grid, tri, name, type At } from './t1'

const G = (at: At) => grid(at, 40, 360, 36, 0, 8)
const { p } = G([0])
const O = p(0, 0), A = p(2, 1), B = p(4, 1), C = p(2, 3)
const A2 = p(4, 2), B2 = p(8, 2), C2 = p(4, 6)
const ABC = (at: At): ChalkMark[] => [tri(at, [A, B, C]), name(at, 'A', A, -14, 14), name(at, 'B', B, 12, 14), name(at, 'C', C, -14, -10)]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding does not stretch: +2 only slides it
  [
    ...G([0, 'add']).marks, ...ABC([0, 'add']), write([0, 'add'], 'add 2?', 470, 90, 32),
    arrow([1, 'slides'], B, p(6, 3), 'd'), tri([1, 'slides'], [p(4, 3), p(6, 3), p(4, 5)], 'b'),
    write([1, 'size'], 'same size', 470, 160, 30, 'b'),
    write([2, 'twice'], 'every side × 2', 470, 240, 32, 'y'),
  ],
  // The big idea: multiply every point, out from (0, 0)
  [
    ...G([0, 'stretch']).marks, ...ABC([0, 'stretch']), ring([0, '(0,'], O[0], O[1], 8, 8),
    line([0, 'multiply'], [O, A2], 'd'), line([0, 'multiply'], [O, B2], 'd'), line([0, 'multiply'], [O, C2], 'd'),
    tri([0, 'number'], [A2, B2, C2], 'y'), write([0, 'number'], '(x, y) → (2x, 2y)', 470, 80, 26, 'y'),
  ],
  // Multiply one corner: (2, 1) → (4, 2), on the same line from (0, 0)
  [
    ...G([0, 'Start']).marks, ...ABC([0, 'Start']),
    ring([0, 'A,'], A[0], A[1], 10, 10), write([0, '(2,'], 'A (2, 1)', 470, 80, 30),
    write([1, 'Multiply'], '(2 × 2, 1 × 2)', 470, 140, 28), write([1, 'get'], '= (4, 2)', 470, 190, 32, 'y'),
    ring([1, 'get'], A2[0], A2[1], 10, 10),
    name([2, 'lands'], 'A′', A2, 14, 14, 'y'), line([2, 'line'], [O, A2], 'y'),
    write([2, 'twice'], 'twice as far', 470, 260, 28, 'y'),
  ],
  // Every corner: B and C double too, and the bottom goes from 2 to 4
  [
    ...G([0, 'other']).marks, ...ABC([0, 'other']), name([0, 'other'], 'A′', A2, 14, 14, 'y'),
    write([1, 'B'], 'B (4, 1) → (8, 2)', 470, 70, 24), write([1, 'C'], 'C (2, 3) → (4, 6)', 470, 110, 24),
    tri([1, 'C'], [A2, B2, C2], 'y'),
    write([2, 'bottom'], '2', 148, 342, 22), write([2, '4.'], '4', 256, 306, 24, 'y'),
    write([2, '4.'], 'bottom: 2 → 4', 470, 190, 28),
    write([3, 'twice'], 'every side × 2', 470, 250, 30, 'y'),
  ],
  // Shrinking works the same way: × 1/2
  [
    write([0, 'shrink'], 'shrink?', 300, 60, 32),
    write([1, '1/2,'], '(8 × 1/2, 2 × 1/2)', 300, 135, 32), write([1, 'back'], '= (4, 1)', 300, 190, 36, 'y'),
    write([2, 'grows'], 'bigger than 1: grows', 300, 270, 30, 'y'),
    write([2, 'shrinks'], 'smaller than 1: shrinks', 300, 325, 30, 'b'),
  ],
  // One thing not to do: twice as big is not + 2
  [
    ...warn([0, 'mix']),
    write([1, 'add'], '(2, 1) → (4, 3)', 300, 160, 34),
    cross([2, 'slides'], 330, 142, 100, 36), write([2, 'slides'], 'only slides it', 300, 212, 26, 'r'),
    write([3, 'becomes'], '(2, 1) → (4, 2)', 300, 290, 38, 'y'),
  ],
]
