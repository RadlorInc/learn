/** g4m4-t9's chalkboards: index = screen index (0 is Screen 1, which has none). A sandwich is a bar cut into 4; every sandwich the same size. */
import type { ChalkMark } from '../../../chalk'
import { write, person, arrow, ring, line } from '../../../chalk'
import { fr, row, crossRow, cells, shade, warn, type At, type Tok } from './t6'

const W = 150, H = 56, SX = [35, 225, 415]
/** A sandwich at (x, y) cut into 4, `k` pieces shaded from piece `from`. */
const sandwich = (at: At, x: number, y: number, k: number, c: 'b' | 'y' = 'b', from = 0): ChalkMark[] =>
  [cells(at, x, y, W, H, 4), ...(k ? [shade(at, x, y, W, H, 4, k, from, c)] : [])]

const wrong: Tok[] = [[[1, 'BOTTOM'], '3', 'r'], [[1, 'BOTTOM'], '×', 'r'], [[1, 'BOTTOM'], ['1', '4'], 'r'], [[1, 'too'], '=', 'r'], [[1, 'too'], ['3', '12'], 'r']]

export const T9: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not 3 × 4
  [
    write([0, '3'], '3', 150, 90, 48), ...fr([0, '1/4'], '1', '4', 450, 90, 44),
    write([0, 'same'], '?', 300, 90, 40, 'd'),
    ...[90, 150, 210].map(x => ({ ...person([1, 'friends'], x, 260, 80), quick: true })),
    write([1, 'friends'], 'friends', 150, 300, 24, 'd'),
    ...sandwich([1, 'size'], 375, 190, 1), write([1, 'piece'], 'each piece', 450, 280, 24, 'b'),
    write([2, 'multiply'], 'not 3 × 4', 300, 355, 32, 'r'),
  ],
  // The big idea: that many copies of one piece
  [
    ...row([[[0, 'whole'], '3'], [[0, 'times'], '×'], [[0, 'fraction'], ['1', '4']]], 300, 70, 40),
    ...SX.map(x => sandwich([0, 'copies'], x, 150, 1)).flat(),
    ...SX.map((x, i) => ({ ...write([0, 'count'], String(i + 1), x + W / 8, 235, 26, 'y'), quick: true })),
    write([0, 'count'], '3 × 1', 300, 290, 36, 'y'), line([0, 'keep'], [[250, 315], [350, 315]]),
    write([0, 'keep'], '4', 300, 345, 36), ring([0, 'size'], 300, 345, 34, 26, 'y'),
  ],
  // One copy for each friend
  [
    ...SX.map(x => ({ ...person([0, 'friend'], x + W / 2, 130, 90), quick: true })),
    ...SX.map(x => sandwich([0, 'piece'], x, 160, 1)).flat(),
    ...SX.flatMap(x => fr([0, '1/4'], '1', '4', x + W / 8, 262, 26, 'b')),
    ...row([[[1, 'copies'], '3 copies of', 'y'], [[1, '1/4'], ['1', '4'], 'y']], 300, 350, 30),
  ],
  // Push the pieces together
  [
    ...SX.map(x => sandwich([0, 'pieces'], x, 50, 1)).flat(),
    ...SX.map((x, i) => arrow([0, 'together'], [x + W / 8, 112], [225 + W / 8 + (W / 4) * i, 214], 'd')),
    ...sandwich([0, 'sandwich'], 225, 220, 0),
    shade([1, 'fill'], 225, 220, W, H, 4, 3, 0, 'b'),
    write([1, '4'], '3 of 4 parts', 300, 320, 30, 'y'),
    write([1, 'empty'], 'empty', 432, 248, 24, 'd'),
  ],
  // Write it
  [
    ...row([[[0, 'copies'], ['1', '4']], [[0, 'copies'], '+'], [[0, 'copies'], ['1', '4']], [[0, 'copies'], '+'], [[0, 'copies'], ['1', '4']],
      [[0, 'is'], '='], [[0, '3/4'], ['3', '4'], 'y']], 300, 75, 36),
    write([1, '3'], 'pieces: 1 → 3', 300, 170, 30, 'y'),
    write([1, 'same'], 'size: still fourths', 300, 220, 28, 'd'),
    ...row([[[2, '3'], '3'], [[2, '3'], '×'], [[2, '1/4'], ['1', '4']], [[2, '3/4'], '=', 'y'], [[2, '3/4'], ['3', '4'], 'y']], 300, 315, 42),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...row(wrong, 300, 170, 36), crossRow([1, 'too'], wrong, 300, 170, 3, 4, 36),
    cells([2, '3/12'], 60, 245, 200, 40, 12), shade([2, '3/12'], 60, 245, 200, 40, 12, 3, 0, 'r'),
    write([2, 'smaller'], 'much smaller', 160, 305, 22, 'r'),
    cells([2, 'fourths'], 340, 245, 200, 40, 4), shade([2, 'fourths'], 340, 245, 200, 40, 4, 3, 0, 'y'),
    ...row([[[2, 'fourths'], '3'], [[2, 'fourths'], '×'], [[2, 'fourths'], ['1', '4']], [[2, 'fourths'], '=', 'y'], [[2, 'fourths'], ['3', '4'], 'y']], 440, 345, 28),
  ],
]
