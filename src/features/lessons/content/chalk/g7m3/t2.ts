/** g7m3-t2's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The number outside sits left of a box of two cells, one per part inside; yellow is a product, blue the reach. */
import type { ChalkMark } from '../../../chalk'
import { write, line, cells, arrow, cross, ring } from '../../../chalk'
import { warn } from './t1'

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // You cannot work inside first
  [
    write([0, 'parentheses'], '3(x − 4)', 300, 70, 44), write([0, 'first'], 'inside first?', 300, 130, 26, 'd'),
    line([1, 'x'], [[266, 100], [376, 100]], 'b'), write([1, 'number'], 'x − 4 = one number?', 300, 205, 30),
    write([1, 'know'], 'x = ?', 300, 265, 32, 'r'),
    write([2, 'way'], 'another way', 300, 340, 32, 'y'),
  ],
  // The big idea: the outside number reaches every part, sign and all
  [
    write([0, 'outside'], '3', 100, 230, 48), { ...cells([0, 'outside'], 170, 170, 360, 120, 2), quick: true },
    write([0, 'outside'], 'x', 260, 145, 30), write([0, 'outside'], '−4', 440, 145, 30),
    arrow([0, 'multiplies'], [125, 215], [240, 215], 'b'), arrow([0, 'every'], [125, 250], [420, 250], 'b'),
    ring([0, 'sign'], 440, 145, 34, 24, 'y'), write([0, 'along'], 'the − comes along', 300, 350, 30, 'y'),
  ],
  // Multiply every part
  [
    write([0, '3'], '3', 100, 150, 44), cells([0, '3'], 160, 90, 360, 120, 2),
    write([0, 'both'], 'x', 250, 65, 30), write([0, 'both'], '−4', 430, 65, 30),
    arrow([0, 'reach'], [120, 125], [195, 125], 'b'), arrow([0, 'inside'], [120, 170], [380, 170], 'b'),
    write([1, '3x'], '3x', 250, 150, 40, 'y'),
    write([2, '−12'], '−12', 430, 150, 40, 'y'), write([2, 'tickets'], '4 off each ticket', 430, 240, 22, 'd'),
    write([3, 'So'], '3(x − 4)', 200, 330, 36), write([3, '12'], '= 3x − 12', 390, 330, 36, 'y'),
  ],
  // Now a negative outside
  [
    write([0, 'negative'], 'negative outside', 300, 45, 26, 'd'),
    write([1, 'Try'], '−2(x − 4)', 300, 105, 40),
    write([1, 'Try'], '−2', 100, 250, 44, 'b'), cells([1, 'Try'], 160, 195, 360, 110, 2),
    write([1, 'Try'], 'x', 250, 170, 26), write([1, 'Try'], '−4', 430, 170, 26),
    arrow([2, 'reaches'], [130, 250], [200, 250], 'b'), write([2, '−2x'], '−2x', 250, 250, 40, 'y'),
    write([2, '−2x'], 'the − comes along', 300, 355, 26, 'd'),
  ],
  // Negative times negative
  [
    write([0, 'Next'], '−2', 100, 170, 44, 'b'), { ...cells([0, 'Next'], 160, 115, 360, 110, 2), quick: true },
    write([0, 'Next'], 'x', 250, 92, 26), write([0, 'Next'], '−4', 430, 92, 26), write([0, 'Next'], '−2x', 250, 170, 40, 'y'),
    arrow([0, '−4'], [130, 200], [380, 200], 'b'),
    write([1, 'positive'], 'negative × negative = positive', 300, 45, 24, 'd'), write([1, '8'], '+8', 430, 170, 40, 'y'),
    write([2, 'So'], '−2(x − 4)', 190, 320, 36), write([2, '8'], '= −2x + 8', 395, 320, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'DROP'], '−2(x − 4) = −2x − 8', 300, 170, 34, 'r'), cross([1, 'sign'], 414, 150, 54, 40),
    write([2, '8'], '−2 × (−4) = 8', 300, 255, 32, 'y'),
    write([2, 'So'], '−2(x − 4) = −2x + 8', 300, 330, 34, 'y'),
  ],
]
