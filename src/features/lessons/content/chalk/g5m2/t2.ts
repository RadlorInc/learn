/** g5m2-t2's chalkboards: index = screen index (0 is Screen 1, which has none). Colours as in t1. */
import type { ChalkMark } from '../../../chalk'
import { write, line, ring, span, arrow } from '../../../chalk'
import { fr, row, crossRow, bar, recut, warn, type At, type Tok } from './t1'

// Every bar is the same length: x 150–510.
const X = 150, W = 360
/** The two counting lists, one number at each word; the 12s stand in one column. */
const LX = [210, 280, 350, 450]
const list = (y: number, nums: [At, string][], cols: number[]): ChalkMark[] =>
  nums.map(([at, n], i) => ({ ...write(at, n, LX[cols[i]], y, 36), quick: true }))

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Thirds and fourths do not fit
  [
    ...bar([0, 'Thirds'], X, 50, W, 60, 3, 2), ...fr([0, 'Thirds'], '2', '3', 95, 80, 28, 'd'),
    ...bar([0, 'fourths'], X, 150, W, 60, 4, 1), ...fr([0, 'fourths'], '1', '4', 95, 180, 28, 'd'),
    ...[1, 2].map(i => ({ ...line([1, 'cut'], [[X + (W * i) / 3, 116], [X + (W * i) / 3, 144]], 'd', 2), quick: true })),
    write([1, 'No'], "the cuts don't line up", 300, 265, 28, 'd'),
    write([2, 'both'], 'one size for both?', 300, 330, 32),
  ],
  // The big idea: count by each bottom number, meet at the first number in both lists
  [
    ...fr([0, 'Count'], '2', '3', 80, 110, 32, 'd'), ...fr([0, 'Count'], '1', '4', 80, 230, 32, 'd'),
    ...list(120, [[[0, 'lists'], '3'], [[0, 'lists'], '6'], [[0, 'lists'], '9'], [[0, 'lists'], '12']], [0, 1, 2, 3]),
    ...list(240, [[[0, 'lists'], '4'], [[0, 'lists'], '8'], [[0, 'lists'], '12']], [0, 1, 3]),
    ring([0, 'first'], LX[3], 180, 42, 96, 'y'),
    write([0, 'fits'], 'twelfths', LX[3], 340, 32, 'y'),
  ],
  // Count by both
  [
    ...fr([0, 'Count'], '2', '3', 80, 110, 32, 'd'), write([0, '3s'], 'by 3s', 80, 180, 22, 'd'),
    ...list(120, [[[0, '3'], '3'], [[0, '6'], '6'], [[0, '9'], '9'], [[0, '12'], '12']], [0, 1, 2, 3]),
    ...fr([1, 'Now'], '1', '4', 80, 250, 32, 'd'), write([1, '4s'], 'by 4s', 80, 320, 22, 'd'),
    ...list(260, [[[1, '4'], '4'], [[1, '8'], '8'], [[1, '12'], '12']], [0, 1, 3]),
    ring([2, 'first'], LX[3], 190, 42, 106, 'y'),
    write([2, 'twelfths'], 'twelfths', 450, 360, 32, 'y'),
  ],
  // Cut into twelfths
  [
    ...bar([0, 'Cut'], X, 40, W, 60, 3, 2), recut([0, 'pieces'], X, 40, W, 60, 3, 4, 'd', 2.5),
    ...row([[[0, 'thirds'], ['2', '3']], [[0, 'become'], '='], [[0, '8'], ['8', '12'], 'y']], 330, 155, 34),
    ...bar([1, 'Cut'], X, 215, W, 60, 4, 1), recut([1, 'pieces'], X, 215, W, 60, 4, 3, 'd', 2.5),
    ...row([[[1, 'fourth'], ['1', '4']], [[1, 'becomes'], '='], [[1, 'twelfths'], ['3', '12'], 'y']], 330, 330, 34),
  ],
  // Now they match
  [
    ...bar([0, 'bars'], X, 70, W, 60, 12, 8), ...bar([0, 'bars'], X, 170, W, 60, 12, 3),
    span([1, 'bigger'], X + 4, X + (W * 2) / 3 - 4, 50, 'd'), span([1, 'bigger'], X + 4, X + W / 4 - 4, 250, 'd'),
    ...fr([2, 'names'], '8', '12', 555, 100, 26, 'y'), ...fr([2, 'names'], '3', '12', 555, 200, 26, 'y'),
    ...Array.from({ length: 11 }, (_, i) => ({ ...line([2, 'match'], [[X + (W * (i + 1)) / 12, 136], [X + (W * (i + 1)) / 12, 164]], 'y', 2), quick: true })),
    write([2, 'match'], 'the pieces match', 300, 355, 30, 'y'),
  ],
  // One thing not to do
  (() => {
    const B: At = [1, 'ONLY'], wrong: Tok[] = [[B, ['2', '3'], 'r'], [B, '=', 'r'], [B, ['2', '12'], 'r']]
    return [
      ...warn([0, 'mix']),
      ...row(wrong, 150, 185, 38), crossRow([1, 'not'], wrong, 150, 185, 1, 2, 38),
      ...bar([2, 'Cut'], 300, 290, 250, 50, 3, 2), recut([2, 'into'], 300, 290, 250, 50, 3, 4, 'd', 2.5),
      ...row([[[2, '2'], ['2', '3'], 'y'], [[2, 'become'], '=', 'y'], [[2, '8'], ['8', '12'], 'y']], 425, 185, 38),
      arrow([2, '8'], [425, 250], [425, 214], 'y'),
    ]
  })(),
]
