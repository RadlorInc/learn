/** g5m2-t3's chalkboards: index = screen index (0 is Screen 1, which has none). Colours as in t1; a dim ✕ = a slice eaten. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, ring, cross } from '../../../chalk'
import { pizza, cuts, slices, inSlice } from '../g3m5/t5to8'
import { fr, row, lay, place, crossRow, warn, type At, type Tok } from './t1'

/** A pizza cut into `n`, with `k` slices on it (every pizza on these boards is the same size). */
const cutPizza = (at: At, cx: number, cy: number, r: number, n: number, k: number, c: ChalkColor = 'b'): ChalkMark[] =>
  [pizza(at, cx, cy, r), { ...cuts(at, cx, cy, r, n), quick: true }, ...(k ? [slices(at, cx, cy, r, n, k, 0, c)] : [])]
/** A small dim ✕ on slice `i` of `n`: that slice is eaten. */
const eaten = (at: At, cx: number, cy: number, r: number, i: number, n: number): ChalkMark => {
  const [x, y] = inSlice(cx, cy, r * 0.58, i, n)
  return { ...cross(at, x - 13, y - 13, 26, 26, 'd'), quick: true }
}
/** The cut that turns a pizza's right half into two fourths: centre to 3 o'clock. */
const halfCut = (at: At, cx: number, cy: number, r: number): ChalkMark => line(at, [[cx, cy], [cx + r, cy]], 'w', 4)

const A = 170, B = 430, Y = 130, R = 85   // the two pizzas of screens 2 and 3

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // The pieces don't match
  [
    ...cutPizza([0, 'fourths'], A, Y, R, 4, 3), ...fr([0, 'fourths'], '3', '4', A, 262, 28, 'd'),
    ...cutPizza([0, 'half'], B, Y, R, 2, 1), ...fr([0, 'half'], '1', '2', B, 262, 28, 'd'),
    write([1, 'take'], 'take 1 piece from 3?', 300, 325, 30),
    write([1, 'Not'], 'not yet', 300, 368, 28),
    write([2, 'half'], 'big', 555, Y, 24, 'd'), write([2, 'fourth'], 'small', 45, Y, 24, 'd'),
  ],
  // The big idea: cut to the same size, then take away pieces
  [
    ...cutPizza([0, 'Make'], A, Y, R, 4, 3), ...fr([0, 'Make'], '3', '4', A, 262, 28, 'd'),
    ...cutPizza([0, 'Make'], B, Y, R, 2, 1), ...fr([0, 'Make'], '1', '2', B, 262, 28, 'd'),
    halfCut([0, 'same'], B, Y, R),
    eaten([0, 'take'], A, Y, R, 0, 4), eaten([0, 'take'], A, Y, R, 1, 4),
  ],
  // Make the pieces match
  [
    ...cutPizza([0, 'Cut'], 170, 170, 110, 2, 1), halfCut([0, 'middle'], 170, 170, 110),
    ...[0, 1].flatMap(i => { const [x, y] = inSlice(170, 170, 62, i, 4); return fr([1, 'fourths'], '1', '4', x, y, 24) }),
    ...row([[[2, 'half'], ['1', '2']], [[2, 'eat'], '='], [[2, '2'], ['2', '4'], 'y']], 450, 170, 48),
  ],
  // Take away pieces
  [
    ...cutPizza([0, 'Now'], 190, 190, 125, 4, 3),
    eaten([0, '2'], 190, 190, 125, 0, 4), eaten([0, '2'], 190, 190, 125, 1, 4),
    slices([1, 'left'], 190, 190, 125, 4, 1, 2, 'y', true),
    ...fr([1, '1'], '1', '4', 460, 190, 60, 'y'),
  ],
  // The bottom number stays
  ((): ChalkMark[] => {
    const P: At = [0, 'bottom'], toks: Tok[] = [[P, ['3', '4']], [P, '−'], [P, ['2', '4']], [P, '='], [P, ['1', '4']]]
    const L = lay(toks, 300, 42), a = L[4].x, y = 90
    return [
      ...place(toks.slice(0, 4), L, y, 42),
      ...[0, 2].map(i => ({ ...ring([0, 'bottom'], L[i].x, y + 26, 21, 21, 'd'), quick: true })),
      { ...line([0, 'stays'], [[a - 19, y], [a + 19, y]], 'y'), quick: true }, write([0, 'stays'], '4', a, y + 26, 42, 'y'),
      write([1, '1/4'], '1', a, y - 26, 42, 'y'),
      ...row([[[1, 'So'], ['3', '4']], [[1, 'So'], '−'], [[1, 'So'], ['1', '2']], [[1, 'So'], '='], [[1, '1/4'], ['1', '4'], 'y']], 300, 215, 40),
      ...cutPizza([1, 'pizza'], 300, 330, 48, 4, 1, 'y'),
    ]
  })(),
  // One thing not to do
  (() => {
    const W: At = [1, 'TAKE'], wrong: Tok[] = [[W, ['3', '4'], 'r'], [W, '−', 'r'], [W, ['1', '2'], 'r'], [W, '=', 'r'], [W, ['2', '2'], 'r']]
    return [
      ...warn([0, 'mix']),
      ...row(wrong, 300, 180, 40), crossRow([1, 'not'], wrong, 300, 180, 3, 4, 40),
      ...row([[[2, '2/2'], ['2', '2'], 'r'], [[2, '2/2'], '=', 'r']], 62, 320, 34), pizza([2, 'whole'], 155, 320, 45, 'r'), slices([2, 'whole'], 155, 320, 45, 1, 1, 0, 'r'),
      ...row([[[2, '1/4'], ['3', '4'], 'y'], [[2, '1/4'], '−', 'y'], [[2, '1/4'], ['1', '2'], 'y'], [[2, '1/4'], '=', 'y'], [[2, '1/4'], ['1', '4'], 'y']], 405, 320, 40),
    ]
  })(),
]
