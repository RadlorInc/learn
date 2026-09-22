/** g6m2-t4's chalkboards: index = screen index (0 is Screen 1, which has none). A pound of beef is a bar; all three the same length. */
import type { ChalkMark } from '../../../chalk'
import { write, arrow, span } from '../../../chalk'
import { shade } from '../g5m3/t5'
import { row, crossRow, fr, bar, cut, warn, ex, px, type At, type Tok } from './t1'

/** The three pounds, 150 wide, at x = 45, 215, 385. */
const PX = [45, 215, 385], PW = 150, Q = PW / 4
/** 2 1/4 pounds: the three outlines, the beef washed (two whole pounds and a fourth). */
const beef = (at: At, y: number, h: number, atWash: At = at): ChalkMark[] => [
  ...PX.flatMap(x => bar(at, x, y, PW, h, 1)),
  shade(atWash, PX[0], y, PW, h, 1, 1), shade(atWash, PX[1], y, PW, h, 1, 1), shade(atWash, PX[2], y, PW, h, 4, 1),
]
const fourths = (at: At, y: number, h: number): ChalkMark[] => PX.flatMap(x => [1, 2, 3].map(i => cut(at, x + Q * i, y, y + h, 'w')))

const big3 = ex([0, 'Change'], '2 1/4 ÷ 3/4')
const mx = (px(big3, 300, 42, 0) + px(big3, 300, 42, 1)) / 2, dx = px(big3, 300, 42, 3)
const rule5 = ex([0, 'rule'], '9/4 ÷ 3/4')
const flip5: Tok[] = [[[1, 'Flip'], '='], [[1, 'Flip'], ['9', '4']], [[1, '4/3'], '×'], [[1, '4/3'], ['4', '3']], [[1, '36/12'], '='], [[1, '36/12'], ['36', '12']]]
const wrong7 = ex([1, 'divide'], '2 1/4 ÷ 3/4 = 2 1/3', 'r')

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // The rule needs one fraction
  [
    write([0, 'flip'], 'flip and multiply', 300, 45, 30),
    ...bar([1, 'whole'], PX[0], 100, PW, 55, 1, 1), ...bar([1, 'whole'], PX[1], 100, PW, 55, 1, 1),
    write([1, 'number'], '2', 205, 185, 28, 'd'),
    ...bar([1, 'fraction'], PX[2], 100, PW, 55, 4, 1), ...fr([1, 'fraction'], '1', '4', 460, 190, 22, 'd'),
    ...row(ex([2, 'flip'], '2 1/4 ÷ 3/4'), 270, 280, 38), write([2, 'flip'], '?', 420, 280, 44, 'r'),
    write([2, 'yet'], 'not yet', 300, 355, 28, 'd'),
  ],
  // The big idea: one fraction first, then flip and multiply
  [
    ...row(big3, 300, 75, 42),
    arrow([0, 'fractions'], [mx, 125], [230, 195], 'd'), write([0, 'fractions'], 'one fraction', 230, 230, 26, 'd'),
    arrow([0, 'flip'], [dx, 125], [420, 180], 'b'), ...fr([0, 'flip'], '4', '3', 420, 235, 42, 'y'),
    write([0, 'multiply'], '×', 355, 235, 40),
  ],
  // Cut every pound into fourths
  [
    ...beef([0, '2'], 55, 60), ...fourths([0, 'fourths'], 55, 60),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ ...write([1, '8'], String(i + 1), PX[i < 4 ? 0 : 1] + Q * (i % 4) + Q / 2, 85, 26), quick: true })),
    write([1, 'fourths'], '8 fourths', 205, 150, 24, 'd'),
    write([1, 'extra'], '+ 1 fourth', 460, 150, 24, 'd'), write([1, '9'], '9', PX[2] + Q / 2, 85, 26, 'y'),
    ...row([...ex([2, '2'], '2 1/4 ='), ...ex([2, '9/4'], '9/4', 'y')], 300, 260, 46),
  ],
  // Now flip and multiply
  [
    ...row(rule5, 300, 65, 40),
    write([1, 'Flip'], 'flip', px(rule5, 300, 40, 2), 125, 22, 'b'),
    ...row(flip5, 300, 185, 40),
    ...row([[[2, '36/12'], ['36', '12']], [[2, 'is'], '='], [[2, '3'], '3', 'y']], 300, 285, 42),
    write([2, 'twelfths'], '12 twelfths = 1', 300, 365, 24, 'd'),
  ],
  // Check with the picture
  [
    ...beef([0, 'Look'], 70, 60, [0, '9']), ...fourths([0, 'Look'], 70, 60),
    write([0, 'fourths'], '9 fourths', 300, 38, 26, 'd'),
    ...[[PX[0], PX[0] + 3 * Q], [PX[0] + 3 * Q, PX[1] + 2 * Q], [PX[1] + 2 * Q, PX[2] + Q]].map(([a, b]) => ({ ...span([1, '3'], a + 3, b - 3, 165), quick: true })),
    ...[['1', 101], ['2', 224], ['3', 356]].map(([n, x]) => ({ ...write([1, "That's"], n as string, x as number, 205, 30, 'y'), quick: true })),
    write([1, 'patties'], '3 patties', 300, 295, 40, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...row(wrong7, 300, 170, 36), crossRow([1, 'SEPARATELY'], wrong7, 300, 170, 4, 6, 36),
    ...row([...ex([2, 'amount'], '2 1/4 ='), ...ex([2, '9/4'], '9/4', 'y')], 300, 290, 44),
  ],
]
