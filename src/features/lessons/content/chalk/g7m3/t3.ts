/** g7m3-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Going backwards from 6x + 9 to 3(2x + 3); yellow is what she has just found, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, box, arrow, cross, ring } from '../../../chalk'
import { warn } from './t1'

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Going backwards
  [
    write([0, 'parentheses'], '3(x − 4)', 160, 80, 34), arrow([0, 'multiplied'], [245, 80], [335, 80], 'd'),
    write([0, 'out'], '3x − 12', 420, 80, 34),
    arrow([1, 'backwards'], [335, 170], [245, 170], 'b'),
    write([2, '6x'], '6x + 9', 420, 170, 36, 'y'), write([2, 'parentheses'], '?(? + ?)', 160, 170, 36, 'b'),
    write([2, 'look'], 'what did it look like?', 300, 280, 28, 'd'),
  ],
  // The big idea
  [
    write([0, 'Find'], '6x + 9', 300, 60, 44),
    write([0, 'divides'], '÷ ?', 265, 140, 28, 'b'), write([0, 'part'], '÷ ?', 350, 140, 28, 'b'),
    write([0, 'outside'], '?', 190, 250, 50, 'y'), write([0, 'left'], '(___ + ___)', 350, 250, 40),
    write([0, 'biggest'], 'the biggest one', 300, 340, 26, 'd'),
  ],
  // A number that divides both
  [
    write([0, '6'], '6', 220, 70, 44), write([0, '9'], '9', 400, 70, 44),
    write([0, 'left'], 'nothing left over', 310, 125, 24, 'd'),
    write([1, '2'], '2', 90, 200, 34, 'b'), write([1, '6'], 'yes', 220, 200, 30, 'y'), write([1, 'not'], 'no', 400, 200, 30, 'r'),
    write([1, '3'], '3', 90, 270, 34, 'b'), write([1, 'both'], 'yes', 220, 270, 30, 'y'), write([1, 'both'], 'yes', 400, 270, 30, 'y'),
    ring([2, 'outside'], 90, 270, 28, 28, 'y'), write([2, 'bigger'], 'biggest', 525, 270, 24, 'd'),
    write([2, 'bags'], '3 bags', 300, 350, 34, 'y'),
  ],
  // What is left inside
  [
    { ...box([0, 'bag'], 80, 45, 120, 80), quick: true }, { ...box([0, 'bag'], 240, 45, 120, 80), quick: true }, box([0, 'bag'], 400, 45, 120, 80),
    write([1, '6x'], '6x ÷ 3', 250, 195, 32), write([1, '2x'], '= 2x', 370, 195, 32, 'y'),
    write([1, '9'], '9 ÷ 3', 250, 250, 32), write([1, '3'], '= 3', 370, 250, 32, 'y'),
    { ...write([2, 'erasers'], '2x + 3', 140, 85, 28, 'y'), quick: true }, { ...write([2, 'erasers'], '2x + 3', 300, 85, 28, 'y'), quick: true },
    write([2, 'erasers'], '2x + 3', 460, 85, 28, 'y'),
    write([2, "That's"], '3(2x + 3)', 300, 340, 40, 'y'),
  ],
  // Check by multiplying
  [
    write([0, 'check'], '3(2x + 3)', 300, 60, 40), arrow([0, 'out'], [300, 90], [300, 145], 'd'),
    write([1, '3'], '3 × 2x', 250, 190, 32), write([1, '6x'], '= 6x', 370, 190, 32, 'y'),
    write([1, 'and'], '3 × 3', 250, 250, 32), write([1, '9'], '= 9', 370, 250, 32, 'y'),
    write([2, '6x'], '6x + 9', 300, 335, 40, 'y'), ring([2, 'started'], 300, 335, 80, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ONLY'], '6x + 9', 300, 160, 40), ring([1, 'first'], 260, 160, 30, 28, 'r'),
    ring([2, '9'], 350, 160, 20, 28, 'y'),
    write([2, "It's"], '3(2x + 3)', 300, 245, 36, 'y'),
    write([2, 'not'], '3(2x + 9)', 300, 325, 36, 'r'), cross([2, 'not'], 346, 303, 34, 44),
  ],
]
