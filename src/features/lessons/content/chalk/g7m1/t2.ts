/** g7m1-t2's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Minutes (x) along the top, gallons (y) underneath. Yellow is the one number and the rule, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, box, ring, cross } from '../../../chalk'
import { table, warn } from './t1'

const P = [['minutes x', '2', '4', '6'], ['gallons y', '5', '10', '15']]

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // The table stops
  [
    ...table([0, 'table'], 40, 60, P, 150, 70),
    write([1, '20'], '20', 435, 60, 26, 'b'), write([1, '20'], '?', 435, 104, 28, 'b'),
    write([1, '100'], '100', 505, 60, 26, 'b'), write([1, '100'], '?', 505, 104, 28, 'b'),
    write([1, 'longer'], 'a longer and longer table?', 300, 200, 28, 'd'),
    write([2, 'rule'], 'one rule for any x', 300, 290, 36, 'y'),
  ],
  // The big idea: one number from y ÷ x, then x × that number
  [
    write([0, 'Find'], 'y ÷ x =', 250, 110, 40), box([0, 'always'], 330, 82, 70, 56, 'y'),
    write([0, 'always'], 'always the same', 300, 180, 26, 'd'),
    write([0, 'multiply'], 'x ×', 225, 280, 40), box([0, 'multiply'], 265, 252, 70, 56, 'y'), write([0, 'get'], '= y', 385, 280, 40),
  ],
  // Divide y by x
  [
    ...table([0, 'Take'], 110, 50, P, 150, 90),
    write([1, '5'], '5 ÷ 2 =', 250, 170, 32), write([1, '2'], '2.5', 390, 170, 32, 'y'),
    write([1, '10'], '10 ÷ 4 =', 250, 225, 32), write([1, '4'], '2.5', 390, 225, 32, 'y'),
    write([1, '15'], '15 ÷ 6 =', 250, 280, 32), write([1, '6'], '2.5', 390, 280, 32, 'y'),
    ring([2, 'same'], 390, 225, 36, 84),
    write([2, 'adds'], '2.5 gallons each minute', 300, 355, 30, 'y'),
  ],
  // Check it backwards
  [
    write([0, 'Multiply'], 'minutes × 2.5', 300, 60, 32),
    write([1, '2'], '2 × 2.5 =', 260, 140, 32), write([1, '5'], '5', 360, 140, 32, 'y'),
    write([1, '4'], '4 × 2.5 =', 260, 200, 32), write([1, '10'], '10', 365, 200, 32, 'y'),
    write([1, '6'], '6 × 2.5 =', 260, 260, 32), write([1, '15'], '15', 365, 260, 32, 'y'),
    write([2, 'back'], 'the gallons come back', 300, 340, 30),
  ],
  // Write the rule
  [
    write([0, 'gallons'], 'gallons = 2.5 × minutes', 300, 60, 30),
    write([0, 'write'], 'y = 2.5x', 300, 140, 52, 'y'),
    write([1, '2.5'], '2.5 × 20 =', 235, 240, 36), write([1, '50'], '50 gallons', 445, 240, 36, 'y'),
    write([2, 'longer'], 'no longer table needed', 300, 330, 28, 'd'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'flip'], 'x ÷ y:  2 ÷ 5 = 0.4', 300, 150, 32, 'r'),
    write([1, 'MINUTES'], 'minutes for each gallon', 300, 195, 24, 'r'), cross([1, 'MINUTES'], 150, 118, 300, 100),
    write([2, 'top'], 'y ÷ x:  5 ÷ 2 = 2.5', 300, 275, 36, 'y'),
    write([2, 'gallons'], 'gallons for each minute', 300, 325, 26, 'y'),
  ],
]
