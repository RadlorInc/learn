/** g5m3-t7's chalkboards: index = screen index (0 is Screen 1, which has none). The pie is a bar, x 60–540: halves at 300, sixths every 80. */
import type { ChalkMark } from '../../../chalk'
import { write, span, person } from '../../../chalk'
import { row, crossRow, cells, shade, warn, cut, type At, type Tok, yel } from './t5'
import { fr } from '../g4m4/t6'

const X = 60, W = 480
/** The pie at height y: a bar cut in half, the left half (what is left) washed blue. */
const pie = (at: At, y: number, h: number): ChalkMark[] => [cells(at, X, y, W, h, 2), shade(at, X, y, W, h, 2, 1)]
/** Cuts at the given x's, down a bar at y. */
const cutsAt = (at: At, xs: number[], y: number, h: number, c: 'w' | 'y' | 'd' = 'w') => xs.map(x => cut(at, x, y - 8, y + h + 8, c))
const wrong7: Tok[] = [[[1, '1/2'], ['1', '2'], 'r'], [[1, '1/2'], '÷', 'r'], [[1, '1/2'], '3', 'r'], [[1, '3/2'], '=', 'r'], [[1, '3/2'], ['3', '2'], 'r']]
const third: Tok[] = [[[1, '1/3'], ['1', '3'], 'r'], [[1, 'pie'], 'of the pie?', 'r']]

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // A third of what?
  [
    ...pie([0, 'Each'], 55, 70), ...cutsAt([0, '3'], [140, 220], 55, 70),
    shade([0, 'pieces'], X, 55, W, 70, 6, 1, 0, 'y'),
    ...row(third, 300, 200, 38), crossRow([1, 'No'], third, 300, 200, 0, 1, 38),
    span([2, 'whole'], X, X + W, 290), write([2, 'pie'], 'how much of the whole pie?', 300, 340, 28, 'y'),
  ],
  // The big idea: cut the piece, give the whole the same cuts
  [
    { ...cells([0, 'share'], X, 70, W, 80, 2), quick: true }, shade([0, 'piece'], X, 70, W, 80, 2, 1),
    ...cutsAt([0, 'cut'], [140, 220], 70, 80),
    shade([0, 'one'], X, 70, W, 80, 6, 1, 0, 'y'),
    ...cutsAt([0, 'whole'], [380, 460], 70, 80, 'd'), span([0, 'whole'], X, X + W, 190),
    write([0, 'whole'], 'one share = ? of the whole', 300, 250, 28, 'y'),
  ],
  // Look at the whole pie
  [
    cells([0, 'whole'], X, 100, W, 90, 1), write([0, 'pie'], 'the whole pie', 300, 60, 26, 'd'),
    cut([1, '2'], 300, 90, 200, 'w'),
    ...fr([1, 'halves'], '1', '2', 180, 250, 30), ...fr([1, 'halves'], '1', '2', 420, 250, 30),
    shade([1, 'shaded'], X, 100, W, 90, 2, 1), write([1, 'left'], 'left over', 180, 330, 28, 'b'),
  ],
  // Cut the half into 3
  [
    ...pie([0, 'Now'], 150, 80), ...cutsAt([0, '3'], [140, 220], 150, 80),
    ...[100, 180, 260].map(x => ({ ...person([0, 'friend'], x, 132, 70), quick: true })),
    ...cutsAt([1, 'same'], [380, 460], 150, 80, 'y'),
    ...[1, 2, 3, 4, 5, 6].map(i => ({ ...write([2, '6'], String(i), 20 + 80 * i, 260, 24, 'd'), quick: true })),
    write([2, 'pieces'], '6 equal pieces', 300, 330, 32, 'y'),
  ],
  // One share of the whole
  [
    { ...cells([0, 'Each'], X, 60, W, 80, 6), quick: true }, shade([0, 'Each'], X, 60, W, 80, 6, 3),
    shade([0, '1'], X, 60, W, 80, 6, 1, 0, 'y'),
    ...row([[[1, '1/6'], ['1', '6'], 'y'], [[1, 'whole'], 'of the whole pie', 'y']], 300, 205, 34),
    ...row([[[2, 'So'], ['1', '2']], [[2, 'So'], '÷'], [[2, 'So'], '3'], [[2, '1/6'], '=', 'y'], [[2, '1/6'], ['1', '6'], 'y']], 300, 318, 42),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...row(wrong7, 300, 172, 40), crossRow([1, '3/2'], wrong7, 300, 172, 3, 4, 40),
    cells([2, 'share'], 40, 245, 240, 36, 6), shade([2, 'share'], 40, 245, 240, 36, 6, 1, 0, 'y'), ...fr([2, 'share'], '1', '6', 312, 263, 22, 'y'),
    cells([2, 'half'], 40, 305, 240, 36, 2), shade([2, 'half'], 40, 305, 240, 36, 2, 1), ...fr([2, 'half'], '1', '2', 312, 323, 22),
    ...row(([[[2, '1/6'], ['1', '2']], [[2, '1/6'], '÷'], [[2, '1/6'], '3'], [[2, '1/6'], '='], [[2, '1/6'], ['1', '6']]] as Tok[]).map(yel), 460, 293, 30),
  ],
]
