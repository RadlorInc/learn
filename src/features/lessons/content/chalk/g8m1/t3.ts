/** g8m1-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: the outside exponent (how many copies) blue · the product of the exponents and results yellow · the mix-up coral · labels dim. */
import type { ChalkMark } from '../../../chalk'
import { write, arrow, ring } from '../../../chalk'
import { expr, warn, pp, strike } from './t1'

const ringOut = (at: [number, string?], p: { ring: [number, number] }, c: 'b' | 'y' = 'b') => ring(at, p.ring[0], p.ring[1], 16, 20, c)

const s2 = pp([0, 'see'], '2', '3', '2', 300, 80, 56, 'w', 'b')
const s3 = pp([0, 'raise'], '2', '3', '2', 170, 160, 60, 'w', 'b')
const s4 = pp([0, 'What'], '2', '3', '2', 300, 80, 56, 'w', 'b')
const s7 = pp([1, 'not'], '2', '3', '2', 270, 170, 48, 'r')

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding the 3 and the 2 is tempting — but the outside 2 asks for two copies
  [
    ...s2.marks,
    write([0, 'add'], '3 + 2', 220, 165, 34, 'r'), ...expr([0, '2⁵'], [['2^5', 'r'], ['?', 'r']], 360, 165, 40),
    ringOut([1, 'outside'], s2), write([1, 'copies'], 'two copies', 470, 70, 26, 'b'),
    ...expr([1, 'multiplied'], ['2^3', '×', ['2^3', 'b']], 300, 250, 48),
    write([2, 'Count'], '2 × 2 × 2 × 2 × 2 × 2', 300, 320, 34, 'd'), write([2, 'five'], 'more than five', 300, 372, 24, 'r'),
  ],
  // The big idea: the base kept, the two small numbers multiplied
  [
    ...s3.marks, ringOut([0, 'another'], s3),
    arrow([0, 'keep'], [255, 165], [320, 165], 'd'), write([0, 'keep'], '2', 380, 180, 72, 'y'),
    write([0, 'multiply'], '3 × 2', 450, 145, 36, 'y'),
  ],
  // The outside 2 counts copies
  [
    ...s4.marks, ringOut([0, 'outside'], s4), write([0, 'Copies'], 'copies', 450, 60, 28, 'b'),
    ...expr([1, 'write'], ['2^3'], 170, 200, 48), write([1, 'write'], 'copy 1', 170, 250, 22, 'd'),
    ...expr([1, 'two'], [['2^3', 'b']], 430, 200, 48), write([1, 'two'], 'copy 2', 430, 250, 22, 'd'),
    write([1, 'multiply'], '×', 300, 200, 44),
    ...pp([2, 'So'], '2', '3', '2', 240, 335, 44, 'w', 'b').marks,
    ...expr([2, 'So'], ['=', '2^3', '×', ['2^3', 'b']], 380, 340, 44),
  ],
  // Count every 2: 3 in each copy, 2 copies, 6 in all
  [
    write([0, 'Now'], '2 × 2 × 2', 170, 80, 40), write([0, 'Now'], '×', 300, 80, 40), write([0, 'Now'], '2 × 2 × 2', 430, 80, 40, 'b'),
    write([0, '3'], '3 twos', 170, 130, 24, 'd'), write([0, '3'], '3 twos', 430, 130, 24, 'd'),
    write([0, 'copies'], '2 copies', 300, 180, 28, 'b'),
    write([1, '6'], '3 × 2 = 6 twos', 300, 250, 36, 'y'),
    ...pp([2, 'So'], '2', '3', '2', 280, 335, 48, 'w', 'b').marks,
    ...expr([2, 'So'], ['=', ['2^6', 'y']], 365, 340, 48),
  ],
  // A bigger one: three copies of 5⁴
  [
    ...pp([0, 'Try'], '5', '4', '3', 110, 85, 48, 'w', 'b').marks,
    ...expr([0, 'copies'], ['=', '5^4', '×', '5^4', '×', '5^4'], 330, 90, 40),
    write([1, '4'], '4 + 4 + 4 fives', 300, 190, 36),
    write([1, '12'], '4 × 3 = 12', 300, 255, 36, 'y'),
    ...pp([2, 'So'], '5', '4', '3', 275, 340, 48, 'w', 'b').marks,
    ...expr([2, 'So'], ['=', ['5^12', 'y']], 365, 345, 48),
  ],
  // One thing not to do: adding the small numbers
  [
    ...warn([0, 'mix']),
    ...s7.marks, ...expr([1, 'not'], ['=', '2^5'], 370, 175, 48).map(m => ({ ...m, c: 'r' as const })),
    ...strike([1, '2⁵'], 205, 410, 168),
    write([2, 'multiply'], '3 × 2 = 6', 300, 255, 34, 'y'),
    ...pp([2, "it's"], '2', '3', '2', 270, 330, 48, 'w', 'b').marks,
    ...expr([2, "it's"], ['=', ['2^6', 'y']], 370, 335, 48),
  ],
]
