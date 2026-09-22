/** g8m4-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A −5..5 grid pinned at (0, 0). Yellow = the quarter turn, blue = the arms and the half turn. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, arrow, cross, ring, clock } from '../../../chalk'
import { warn } from '../g3m1/t1'
import { grid, tri, name, type At, type Pt } from './t1'

const G = (at: At) => grid(at, 160, 200, 28, -5, 5)
const { p } = G([0])
const O = p(0, 0), A = p(3, 1), B = p(4, 1), C = p(3, 3)
const Q = [p(-1, 3), p(-1, 4), p(-3, 3)]          // a quarter turn counterclockwise
const H = [p(-3, -1), p(-4, -1), p(-3, -3)]       // a half turn
const ABC = (at: At): ChalkMark[] => [tri(at, [A, B, C]), name(at, 'A', A, 0, 16), name(at, 'B', B, 14, 12), name(at, 'C', C, 0, -16)]
/** The counterclockwise arc about (0, 0) from one point to another, with a small head. */
const turn = ([beat, at]: At, [x1, y1]: Pt, [x2, y2]: Pt, c: ChalkColor = 'y'): ChalkMark => {
  const r = Math.round(Math.hypot(x1 - O[0], y1 - O[1]))
  return { beat, at, c, d: `M${x1} ${y1} A${r} ${r} 0 0 0 ${x2} ${y2} M${x2 + 13} ${y2 - 5} L${x2} ${y2} L${x2 + 10} ${y2 + 10}` }
}

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Counting squares will not work: each corner has its own circle
  [
    ...G([0, 'count']).marks, ...ABC([0, 'count']), write([0, 'count'], 'count squares?', 455, 80, 28),
    line([1, 'swings'], [O, A], 'd'), line([1, 'swings'], [O, C], 'd'),
    ring([1, 'circle'], O[0], O[1], 89, 89, 'd'), ring([1, 'circle'], O[0], O[1], 119, 119, 'b'),
    write([2, 'far'], 'far: a long trip', 455, 170, 26, 'b'), write([2, 'close'], 'close: a short trip', 455, 210, 26, 'd'),
    write([2, 'no'], 'no single count', 455, 280, 30, 'r'),
  ],
  // The big idea: a quarter turn sends (x, y) to (−y, x)
  [
    ...G([0, 'quarter']).marks, ...ABC([0, 'quarter']), ring([0, 'around'], O[0], O[1], 7, 7),
    turn([0, 'counterclockwise'], A, Q[0]), tri([0, 'sends'], Q, 'y'),
    write([0, 'sends'], '(x, y) → (−y, x)', 455, 90, 32, 'y'),
  ],
  // Follow A: 3 right, 1 up turns into 1 left, 3 up
  [
    ...G([0, 'Follow']).marks, ...ABC([0, 'Follow']),
    ring([0, 'A,'], A[0], A[1], 10, 10), write([0, '(3,'], 'A (3, 1)', 455, 70, 30),
    line([0, 'right'], [O, p(3, 0)], 'b', 4), line([0, 'up'], [p(3, 0), A], 'b', 4),
    write([0, 'up'], '3 right, 1 up', 455, 110, 24, 'b'),
    line([1, 'arm'], [O, A]), turn([1, 'quarter'], A, Q[0]),
    clock([1, 'clock'], 400, 175, 22), write([1, 'backward'], 'backward', 490, 175, 24, 'd'),
    line([2, 'left'], [O, p(-1, 0)], 'b', 4), line([2, 'up'], [p(-1, 0), Q[0]], 'b', 4),
    write([2, 'up'], '1 left, 3 up', 455, 240, 24, 'b'),
    ring([2, 'So'], Q[0][0], Q[0][1], 10, 10), name([2, 'is'], 'A′', Q[0], -14, -14, 'y'),
    write([2, 'is'], 'A′ (−1, 3)', 455, 300, 36, 'y'),
  ],
  // Swap, then change a sign: row by row, no grid
  [
    write([0, 'numbers'], 'A (3, 1) → A′ (−1, 3)', 300, 45, 30),
    write([1, 'swapped'], '(3, 1)', 100, 130, 30), write([1, 'swapped'], 'swap', 205, 100, 20, 'd'), arrow([1, 'swapped'], [160, 130], [245, 130], 'd'),
    write([1, 'places'], '(1, 3)', 300, 130, 30, 'b'),
    write([1, 'sign'], 'sign', 395, 100, 20, 'd'), arrow([1, 'sign'], [355, 130], [435, 130], 'd'), write([1, 'sign'], '(−1, 3)', 500, 130, 30, 'y'),
    write([2, 'B'], 'B', 40, 215, 24, 'd'), write([2, '(4,'], '(4, 1)', 100, 215, 30), arrow([2, 'swaps'], [160, 215], [245, 215], 'd'),
    write([2, 'swaps'], '(1, 4)', 300, 215, 30, 'b'), arrow([2, 'gives'], [355, 215], [435, 215], 'd'), write([2, 'gives'], '(−1, 4)', 500, 215, 30, 'y'),
    write([3, 'C'], 'C', 40, 300, 24, 'd'), write([3, '(3,'], '(3, 3)', 100, 300, 30), arrow([3, 'goes'], [160, 300], [245, 300], 'd'),
    write([3, 'goes'], '(3, 3)', 300, 300, 30, 'b'), arrow([3, 'goes'], [355, 300], [435, 300], 'd'), write([3, 'goes'], '(−3, 3)', 500, 300, 30, 'y'),
    write([3, 'Same'], 'same rule', 300, 360, 26, 'd'),
  ],
  // A half turn: nothing swaps, both signs change
  [
    ...G([0, 'turn']).marks, ...ABC([0, 'turn']),
    line([0, 'faces'], [A, H[0]], 'd'), tri([0, 'faces'], H, 'b'),
    write([1, 'half'], 'half turn = 180°', 455, 80, 28),
    write([2, 'Both'], '(x, y) → (−x, −y)', 455, 150, 28, 'b'),
    ring([3, 'goes'], H[0][0], H[0][1], 10, 10), name([3, 'goes'], 'A′', H[0], 18, 16, 'y'),
    write([3, 'goes'], 'A′ (−3, −1)', 455, 230, 34, 'y'),
  ],
  // One thing not to do: a swap alone never turned it
  [
    ...warn([0, 'mix']),
    write([1, 'swap'], '(3, 1) → (1, 3)', 300, 160, 34), cross([1, 'STOP'], 325, 142, 100, 36),
    write([2, 'half'], 'only half the job', 300, 215, 26, 'r'),
    write([3, 'goes'], '(3, 1) → (−1, 3)', 300, 290, 38, 'y'),
  ],
]
