/** g8m1-t4's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A row of powers of 2 over their values; each step right divides by 2 (a blue dip under the values).
 *  Colours: the ÷ 2 steps blue · the new values (1, 1/2, 1/4) yellow · the mix-up coral · labels dim. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, arrow } from '../../../chalk'
import { expr, warn, strike } from './t1'

type At = [beat: number, at?: string]
const quick = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))
/** A step from x1 to x2 that dips under the values row, arrowhead at x2, with "÷ 2" under it. */
const dip = ([beat, at]: At, x1: number, x2: number, y: number, h = 45, c: ChalkColor = 'b'): ChalkMark[] => [
  { beat, at, c, d: `M${x1 + 14} ${y} Q${(x1 + x2) / 2} ${y + h} ${x2 - 14} ${y} M${x2 - 28} ${y + 4} L${x2 - 14} ${y} L${x2 - 18} ${y + 14}` },
  write([beat, at], '÷ 2', (x1 + x2) / 2, y + h + 12, 24, c),
]
/** One column: the power on top, its value under it. */
const col = (at: At, pow: string, val: string, x: number, c: ChalkColor = 'w', s = 44): ChalkMark[] =>
  [...expr(at, [pow], x, 90, s), write(at, val, x, 180, s, c)]

// Four columns for 2³ … 2⁰ (130 apart); six for 2³ … 2⁻² (98 apart).
const X4 = [90, 220, 350, 480]
const X6 = [55, 153, 251, 349, 447, 545]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Zero 2s? A negative number of 2s? Counting stops working
  [
    ...expr([0, 'What'], ['2^0'], 120, 90, 56), write([0, 'Zero'], 'zero twos?', 360, 90, 34, 'r'),
    ...expr([1, '2⁻¹'], ['2^−1'], 120, 200, 56), write([1, 'negative'], 'a negative number of twos?', 380, 200, 28, 'r'),
    write([2, 'another'], 'another way?', 300, 320, 36, 'y'),
  ],
  // The big idea: each step down divides by the base, even past zero
  [
    ...col([0, 'exponent'], '2^3', '8', X4[0]), ...col([0, 'exponent'], '2^2', '4', X4[1]), ...col([0, 'exponent'], '2^1', '2', X4[2]),
    arrow([0, 'down'], [60, 40], [400, 40], 'd'), write([0, 'down'], 'exponent − 1 each step', 230, 350, 24, 'd'),
    ...dip([0, 'divide'], X4[0], X4[1], 205), ...dip([0, 'divide'], X4[1], X4[2], 205),
    ...dip([0, 'past'], X4[2], X4[3], 205), ...col([0, 'zero'], '2^0', '1', X4[3], 'y'),
  ],
  // Halve at each step
  [
    ...col([0, 'row'], '2^3', '8', X4[0]), ...col([0, 'row'], '2^2', '4', X4[1]), ...col([0, 'row'], '2^1', '2', X4[2]),
    arrow([0, 'right'], [60, 40], [400, 40], 'd'),
    write([1, 'drops'], '− 1', 155, 95, 26, 'd'), write([1, 'drops'], '− 1', 285, 95, 26, 'd'),
    write([1, 'divided'], '÷ 2 at every step', 300, 355, 30, 'b'),
    ...dip([2, '8'], X4[0], X4[1], 205), ...dip([2, 'and'], X4[1], X4[2], 205),
  ],
  // One step past 2¹: 2⁰ = 1, and any other base the same
  [
    ...quick([...col([0, 'Now'], '2^3', '8', X4[0]), ...col([0, 'Now'], '2^2', '4', X4[1]), ...col([0, 'Now'], '2^1', '2', X4[2]),
      ...dip([0, 'Now'], X4[0], X4[1], 205, 45, 'd'), ...dip([0, 'Now'], X4[1], X4[2], 205, 45, 'd')]),
    ...expr([0, 'down'], ['2^0'], X4[3], 90, 44),
    ...dip([1, '2'], X4[2], X4[3], 205), write([1, '1,'], '1', X4[3], 180, 44, 'y'),
    ...expr([1, '2⁰'], ['2^0', '=', ['1', 'y']], 150, 345, 40),
    ...expr([2, '5⁰'], ['5^0', '=', ['1', 'y']], 420, 345, 40),
  ],
  // Below zero: keep dividing by 2
  [
    ...quick(['2^3', '2^2', '2^1', '2^0'].flatMap((p, i) => col([0, 'One'], p, ['8', '4', '2', '1'][i], X6[i], 'w', 36))),
    ...quick([0, 1, 2].flatMap(i => dip([0, 'One'], X6[i], X6[i + 1], 205, 40, 'd'))),
    ...expr([0, 'step'], ['2^−1'], X6[4], 90, 36), ...dip([0, '1/2,'], X6[3], X6[4], 205, 40), write([0, '1/2,'], '1/2', X6[4], 180, 36, 'y'),
    ...expr([1, 'again'], ['2^−2'], X6[5], 90, 36), ...dip([1, '1/4.'], X6[4], X6[5], 205, 40), write([1, '1/4.'], '1/4', X6[5], 180, 36, 'y'),
    ...expr([2, 'divided'], ['2^−2', '=', '1 ÷ 2^2'], 250, 335, 44),
    ...expr([2, 'which'], ['=', ['1/4', 'y']], 425, 335, 44),
  ],
  // One thing not to do: a negative exponent does not give a negative number
  [
    ...warn([0, 'mix']),
    ...expr([1, 'answer'], ['2^−2', '=', '−4'], 300, 175, 48).map(m => ({ ...m, c: 'r' as const })),
    ...expr([2, '1/4,'], ['2^−2', '=', ['1/4', 'y']], 300, 275, 48), write([2, 'above'], 'a small number above 0', 300, 340, 26, 'y'),
    ...strike([2, 'not'], 222, 378, 175),
  ],
]
