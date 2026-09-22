/** g8m1-t7's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Yellow is the front number and the answer, blue the powers of 10, coral the mix-up, dim the labels. */
import type { ChalkMark } from '../../../chalk'
import { write, arrow, cross } from '../../../chalk'
import { ex, warn } from './t6'

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too many zeros
  [
    write([0, 'long'], '30,000 × 2,000', 300, 70, 40), write([0, 'zeros'], 'count the zeros', 300, 125, 24, 'd'),
    write([1, 'works'], 'fine for small ones', 300, 170, 24, 'd'),
    ...ex([2, '3'], '3 × 10^{21}', 300, 235, 44), write([2, '3'], '?', 390, 235, 40, 'y'),
    write([2, '21'], '3,000,000,000,000,000,000,000', 300, 300, 26, 'r'),
    write([2, 'start'], '21 zeros', 300, 350, 26, 'd'),
  ],
  // The big idea
  [
    ...ex([0, 'multiply'], '(3 × 10^{4}) × (2 × 10^{3})', 300, 60, 40),
    ...ex([0, 'front'], '3 × 2', 170, 150, 40, 'y'), ...ex([0, 'exponents'], '10^{4 + 3}', 430, 150, 44, 'b'),
    ...ex([0, 'more'], '20 × 10^{7}', 150, 270, 40, 'r'), arrow([0, 'point'], [255, 270], [345, 270], 'd'),
    write([0, 'point'], 'point one place', 300, 225, 22, 'd'),
    ...ex([0, '1'], '2 × 10^{8}', 440, 270, 44, 'y'), write([0, '1'], 'exponent 7 + 1 = 8', 440, 330, 22, 'y'),
  ],
  // Multiply the front numbers
  [
    ...ex([0, 'multiply'], '(3 × 10^{4}) × (2 × 10^{3})', 300, 65, 40), write([0, 'matter'], 'any order', 300, 120, 24, 'd'),
    ...ex([1, 'together'], '(3 × 2) × (10^{4} × 10^{3})', 300, 200, 40),
    ...ex([2, 'then'], '3 × 2 = 6', 300, 300, 52, 'y'),
  ],
  // Add the exponents
  [
    ...ex([0, 'powers'], '6 × (10^{4} × 10^{3})', 300, 60, 40),
    write([1, 'base'], 'same base 10', 300, 120, 24, 'd'), ...ex([1, 'add'], '4 + 3 = 7', 300, 175, 44, 'b'),
    ...ex([2, 'makes'], '10^{7}', 300, 250, 48, 'b'),
    ...ex([2, 'screws'], '6 × 10^{7}', 300, 335, 56, 'y'),
  ],
  // When the front is 10 or more
  [
    ...ex([0, 'try'], '(4 × 10^{5}) × (5 × 10^{2})', 300, 55, 38),
    ...ex([1, '4'], '4 × 5 = 20', 160, 135, 34), ...ex([1, 'and'], '10^{5} × 10^{2} = 10^{7}', 430, 135, 34, 'b'),
    write([2, 'under'], '20 is not under 10', 300, 205, 28, 'r'),
    ...ex([3, '2'], '20 = 2 × 10^{1}', 160, 280, 34), ...ex([3, 'joins'], '10^{7} × 10^{1} = 10^{8}', 430, 280, 32, 'b'),
    ...ex([3, 'answer'], '2 × 10^{8}', 300, 355, 48, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...ex([1, 'stop'], '20 × 10^{7}', 300, 165, 44, 'r'), cross([1, '20'], 250, 150, 100, 32),
    write([2, 'under'], 'the front number stays under 10', 300, 240, 26, 'd'),
    ...ex([2, 'write'], '2 × 10^{8}', 300, 320, 52, 'y'),
  ],
]
