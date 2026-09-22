/**
 * g6m2-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 * Colours: white = the amount you have (the tape, its cuts), blue = the size of one serving, yellow = the result,
 * coral = the mistake, dim = labels. The tape is 3 cups over 480 px: a cup is 160, a fourth is 40.
 */
import type { ChalkMark } from '../../../chalk'
import { write, line, cells, wash, span, hop, arrow, ring } from '../../../chalk'
import { row, crossRow, warn, type At, type Tok } from '../g4m4/t6'

const X0 = 60, CUP = 160, Q = 40
/** The 12 fourths as their own cuts, thin, inside a 3-cup tape at y. */
const fourthCuts = (at: At, y: number, h: number): ChalkMark[] =>
  Array.from({ length: 12 }, (_, i) => i).filter(i => i % 4 !== 0)
    .map(i => ({ ...line(at, [[X0 + Q * i, y], [X0 + Q * i, y + h]], 'w', 2), quick: true }))

const back: Tok[] = [[[1, 'backwards'], ['3', '4'], 'r'], [[1, 'backwards'], '÷', 'r'], [[1, 'backwards'], '3', 'r']]
const wrong7: Tok[] = [[[1, 'fraction'], ['3', '4'], 'r'], [[1, 'fraction'], '÷', 'r'], [[1, 'fraction'], '3', 'r'],
  [[2, 'gives'], '=', 'r'], [[2, 'gives'], ['1', '4'], 'r'], [[2, 'serving'], 'serving', 'r']]

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Which way round?
  [
    write([0, '3'], '3 cups', 170, 70, 34),
    ...row([[[0, '3/4'], ['3', '4'], 'b'], [[0, '3/4'], 'cup', 'b']], 420, 70, 34),
    write([0, 'first'], '? ÷ ?', 300, 160, 40),
    ...row(back, 220, 260, 36),
    write([1, 'less'], '→ less than 1 serving', 420, 260, 26, 'r'),
    ring([2, 'right'], 420, 260, 150, 30, 'r'),
  ],
  // The big idea: how many of this size fit in that amount? amount ÷ one size
  [
    wash([0, 'size'], X0, 45, 100, 40, 'b'), { ...cells([0, 'size'], X0, 45, 100, 40, 1, 'b'), quick: true },
    write([0, 'size'], 'one size', 230, 65, 24, 'b'),
    cells([0, 'amount'], X0, 175, 480, 50, 1), write([0, 'amount'], 'the amount', 300, 250, 24, 'd'),
    ...[0, 1, 2, 3].map(i => ({ ...hop([0, 'divide'], X0 + 100 * i, X0 + 100 * (i + 1), 170, 'b'), quick: true })),
    write([0, 'divide'], '?', 505, 140, 34, 'b'),
    write([0, 'start'], 'amount', 190, 320, 34), write([0, 'start'], '÷', 285, 320, 34), write([0, 'start'], 'one size', 385, 320, 34, 'b'),
    line([0, 'first'], [[135, 345], [245, 345]], 'y', 4), write([0, 'first'], 'first', 190, 372, 24, 'y'),
  ],
  // Draw the whole amount: 3 cups, cut into fourths
  [
    ...[0, 1, 2].map(i => ({ ...write([0, 'tape'], '1 cup', X0 + CUP * i + CUP / 2, 65, 22, 'd'), quick: true })),
    cells([0, 'tape'], X0, 90, 480, 60, 3), span([0, 'tape'], X0, 540, 180), write([0, 'tape'], '3 cups', 300, 208, 24, 'd'),
    ...fourthCuts([1, 'cut'], 90, 60),
    write([1, '4'], 'each cup = 4 fourths', 300, 258, 28),
    ...Array.from({ length: 12 }, (_, i) => ({ ...write([2, '12'], String(i + 1), X0 + Q * i + Q / 2, 120, 22, 'y'), quick: true })),
    write([2, 'fourths'], '3 cups = 12 fourths', 300, 330, 36, 'y'),
  ],
  // Mark off the servings: 3 fourths at a time
  [
    cells([0, 'One'], X0, 120, 480, 55, 12), ...[1, 2].map(i => ({ ...line([0, 'One'], [[X0 + CUP * i, 120], [X0 + CUP * i, 175]], 'w', 5), quick: true })),
    wash([0, '3'], X0, 120, 3 * Q, 55, 'b'),
    ...row([[[0, 'fourths'], '1 serving =', 'b'], [[0, 'fourths'], ['3', '4'], 'b'], [[0, 'fourths'], 'cup', 'b']], 300, 62, 28),
    ...(['time', '6', '9', '12'] as const).flatMap((w, i) => [
      span([1, w], X0 + 120 * i + 4, X0 + 120 * (i + 1) - 4, 200, 'b'),
      write([1, w], String(3 * (i + 1)), X0 + 120 * (i + 1) - 14, 232, 24, 'b'),
    ]),
    ...[0, 1, 2, 3].map(i => ({ ...write([2, '4'], String(i + 1), X0 + 120 * i + 60, 272, 30, 'y'), quick: true })),
    write([2, 'servings'], '4 servings', 300, 325, 38, 'y'),
    write([2, 'nothing'], 'nothing left over', 300, 368, 24, 'd'),
  ],
  // Write the division
  [
    cells([0, 'write'], 150, 30, 300, 35, 12), ...[0, 2].map(g => ({ ...wash([0, 'write'], 150 + 75 * g, 30, 75, 35, 'b'), quick: true })),
    ...row([[[1, 'fit'], 'how many'], [[1, 'fit'], ['3', '4'], 'b'], [[1, 'fit'], 'cups in 3 cups?']], 300, 128, 30),
    ...row([[[1, "That's"], '3'], [[1, "That's"], '÷'], [[1, "That's"], ['3', '4'], 'b']], 300, 222, 40),
    ...row([[[2, 'Flip'], '='], [[2, 'Flip'], '3'], [[2, 'Flip'], '×'], [[2, 'Flip'], ['4', '3'], 'b'],
      [[2, '12/3'], '='], [[2, '12/3'], ['12', '3']], [[2, 'servings'], '=', 'y'], [[2, 'servings'], '4 servings', 'y']], 300, 322, 36),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    arrow([1, 'FIRST'], [110, 190], [150, 190], 'r'),
    ...row(wrong7, 330, 190, 36), crossRow([2, 'cups'], wrong7, 330, 190, 3, 5, 36),
    ...row([[[2, 'amount'], '3', 'y'], [[2, 'amount'], '÷', 'y'], [[2, 'amount'], ['3', '4'], 'y'], [[2, '4'], '=', 'y'], [[2, '4'], '4 servings', 'y']], 300, 315, 38),
  ],
]
