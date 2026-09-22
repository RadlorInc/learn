/** g7m2-t7's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A number line from −1 to 1 in fourths (60 px a fourth). Yellow is the answer / what matters, blue below 0, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, line, cells, wash, hop, arrow, cross, ring } from '../../../chalk'
import { warn } from './t5'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const X = (v: number) => 300 + 240 * v
/** The line at height y: the rule, a tick every fourth, and the labels named in `labels` (−1, 0 and 1 by default). */
const nline = (at: At, y: number, labels: number[] = [-1, 0, 1]): ChalkMark[] => [
  line(at, [[X(-1) - 20, y], [X(1) + 20, y]]),
  { ...line(at, []), d: Array.from({ length: 9 }, (_, i) => `M${X(-1) + 60 * i} ${y - 9} v18`).join(' '), quick: true },
  ...labels.map(v => q(write(at, v < 0 ? '−' + Math.abs(v) : String(v), X(v), y + 35, 24, 'd'))),
]
const dot = (at: At, v: number, y: number, c: 'y' | 'b' | 'w' = 'y'): ChalkMark => ring(at, X(v), y, 8, 8, c)

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Where did the frog start?
  [
    write([0, 'add'], '1/2 + 3/4 = 5/4', 300, 55, 34),
    ...nline([1, 'where'], 200), dot([1, 'frog'], -0.5, 200, 'b'), write([1, 'frog'], 'frog', X(-0.5), 160, 24, 'b'),
    write([2, 'Below'], '−1/2', X(-0.5), 250, 24, 'b'),
    write([2, 'carry'], "can't reach 5/4", 420, 320, 30, 'r'),
  ],
  // The big idea: a fraction, a decimal and a whole number, all left of 0
  [
    line([0, 'Negative'], [[40, 190], [560, 190]]),
    { beat: 0, at: 'Negative', quick: true, d: [-3, -2, -1, 0, 1].map(v => `M${420 + 120 * v} 181 v18`).join(' '), c: 'w' },
    ...[-2, -1, 0, 1].map(v => q(write([0, 'Negative'], v < 0 ? '−' + -v : String(v), 420 + 120 * v, 225, 22, 'd'))),
    ring([0, 'fractions'], 360, 190, 8, 8, 'b'), write([0, 'fractions'], '−1/2', 360, 150, 26, 'b'),
    ring([0, 'decimals'], 120, 190, 8, 8, 'b'), write([0, 'decimals'], '−2.5', 120, 150, 26, 'b'),
    ring([0, 'whole'], 60, 190, 8, 8, 'b'), write([0, 'whole'], '−3', 60, 150, 26, 'b'),
    write([0, 'keep'], 'keep the − sign', 300, 320, 34, 'y'),
  ],
  // Use the same bottom number
  [
    write([0, 'add'], '−1/2 + 3/4', 300, 55, 38), write([0, 'same'], 'bottoms must match', 300, 105, 24, 'd'),
    write([1, 'Is'], '−1/2', 95, 180, 26, 'b'), cells([1, 'Is'], 150, 160, 320, 40, 2), wash([1, 'Is'], 150, 160, 160, 40, 'b'),
    write([1, 'fourths'], 'fourths', 95, 240, 24, 'd'), cells([1, 'fourths'], 150, 220, 320, 40, 4),
    wash([1, 'Yes'], 150, 220, 160, 40, 'b'), write([1, 'is'], '= −2/4', 530, 240, 26, 'y'),
    write([2, 'match'], '−2/4 + 3/4', 300, 330, 40, 'y'),
  ],
  // Hop on the line
  [
    ...nline([0, 'Put'], 220, [-1, 1]), dot([0, 'finger'], -0.5, 220), write([0, 'finger'], '−2/4', X(-0.5), 262, 22, 'y'),
    write([1, 'Adding'], '+ 3/4  =  3 hops to the right', 300, 70, 28),
    hop([2, '1/4'], X(-0.5), X(-0.25), 205, 'y'), write([2, '1/4'], '−1/4', X(-0.25), 262, 22, 'y'),
    hop([2, '0'], X(-0.25), X(0), 205, 'y'), write([2, '0'], '0', X(0), 262, 22, 'y'),
    hop([2, '0'], X(0), X(0.25), 205, 'y'), write([2, '0'], '1/4', X(0.25), 262, 22, 'y'),
  ],
  // Where it lands
  [
    ...nline([0, 'frog'], 95), dot([0, 'lands'], 0.25, 95), write([0, 'lands'], '1/4', X(0.25), 55, 26, 'y'),
    wash([0, 'water'], X(-1) - 20, 75, 260, 40, 'b'), write([0, 'water'], 'water', X(-0.5), 50, 22, 'b'),
    write([1, 'So'], '−1/2 + 3/4 = 1/4', 300, 205, 38, 'y'),
    write([2, '2.5'], '−2.5 × 4', 240, 290, 36), write([2, "it's"], '= −10', 385, 290, 36, 'b'),
    write([2, 'different'], 'different signs', 300, 350, 24, 'd'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'minus'], '−1/2', 200, 165, 40), arrow([1, 'minus'], [250, 165], [320, 165], 'r'), write([1, 'fraction'], '1/2', 375, 165, 40, 'r'), cross([1, 'decimal'], 340, 140, 70, 50),
    write([2, 'left'], 'still left of 0', 300, 245, 28, 'd'),
    write([2, 'starts'], '−1/2 + 3/4 = 1/4', 300, 320, 40, 'y'),
  ],
]
