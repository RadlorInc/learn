/** g7m2-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Yellow is a positive answer / what matters, blue a negative one, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, arrow, cross, ring } from '../../../chalk'
import { warn } from './t5'

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Is it just 3?
  [
    write([0, 'know'], '12 ÷ 4 =', 270, 60, 38), write([0, 'know'], '3', 375, 60, 38),
    ring([0, 'just'], 375, 60, 24, 28, 'y'), write([0, 'just'], '?', 420, 60, 34, 'y'),
    write([1, 'plain'], 'plain 3', 190, 150, 30), arrow([1, 'gained'], [260, 150], [320, 150], 'd'),
    write([1, 'gained'], 'gained 3 a game', 440, 150, 28),
    write([2, 'lost'], 'lost 12 points', 190, 250, 30, 'b'), arrow([2, 'lost'], [300, 250], [345, 250], 'd'),
    write([2, 'minus'], 'answer needs a −', 470, 250, 26, 'b'),
  ],
  // The big idea: ÷ follows the × rule
  [
    write([0, 'rule'], '÷ uses the same rule as ×', 300, 50, 30),
    write([0, 'same'], 'same signs', 160, 130, 26, 'd'),
    write([0, 'same'], '+ ÷ +  →  +', 160, 190, 32, 'y'), write([0, 'same'], '− ÷ −  →  +', 160, 250, 32, 'y'),
    write([0, 'different'], 'different signs', 440, 130, 26, 'd'),
    write([0, 'different'], '+ ÷ −  →  −', 440, 190, 32, 'b'), write([0, 'different'], '− ÷ +  →  −', 440, 250, 32, 'b'),
  ],
  // Undo a multiplication
  [
    write([0, 'Dividing'], '−12 ÷ 4 = ?', 300, 55, 36), arrow([0, 'around'], [300, 85], [300, 125], 'd'),
    write([0, 'around'], 'turn it around', 420, 105, 22, 'd'),
    write([1, 'times'], '4 × ? = −12', 300, 160, 36),
    write([2, '4'], '4 × (−3) = −12', 300, 235, 36), write([2, 'So'], '−12 ÷ 4 = −3', 300, 305, 38, 'b'),
    write([2, 'lost'], 'lost 3 points a game', 300, 360, 24, 'd'),
  ],
  // Two negatives
  [
    write([0, 'try'], '−12 ÷ (−4) = ?', 300, 60, 36),
    write([1, 'times'], '−4 × ? = −12', 300, 150, 36),
    write([2, 'because'], '−4 × 3 = −12', 300, 240, 36), write([2, 'So'], '−12 ÷ (−4) = 3', 300, 320, 40, 'y'),
  ],
  // Just check the signs
  [
    write([0, 'quick'], 'the same rule as ×', 300, 45, 26, 'd'),
    write([1, 'Divide'], '12 ÷ 4 = 3', 300, 105, 38),
    write([2, 'Same'], '−12 ÷ (−4)', 160, 190, 32), write([2, 'Same'], 'same signs', 160, 245, 24, 'y'),
    write([2, 'stays'], '3', 160, 315, 48, 'y'),
    write([2, 'Different'], '−12 ÷ 4', 440, 190, 32), write([2, 'Different'], 'different signs', 440, 245, 24, 'b'),
    write([2, "it's"], '−3', 440, 315, 48, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'minus'], '−12 ÷ (−4) =', 255, 165, 38), write([1, 'minus'], '−3', 415, 165, 38, 'r'), cross([1, 'one'], 390, 140, 50, 50),
    write([2, 'positive'], 'two negatives  →  +', 300, 245, 28, 'd'),
    write([2, 'is'], '−12 ÷ (−4) = 3', 300, 320, 40, 'y'),
  ],
]
