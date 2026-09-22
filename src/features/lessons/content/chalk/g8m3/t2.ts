/** g8m3-t2's chalkboards: the rule is a machine (a box); blue is the input going in, yellow what comes out. */
import type { ChalkMark } from '../../../chalk'
import { write, box, arrow, cross, ring, span } from '../../../chalk'
import { warn } from './t1'

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // You cannot just look
  [
    box([0], 170, 120, 260, 90), write([0], '3 × input − 2', 300, 165, 30),
    write([0, '4'], '4', 95, 165, 38, 'b'), arrow([0, '4'], [118, 165], [162, 165], 'b'),
    arrow([0, 'out'], [438, 165], [482, 165]), write([0, 'out'], '?', 510, 165, 40, 'y'),
    write([1, 'guess'], 'no guessing', 300, 265, 30, 'd'),
    write([2, 'order'], 'follow the rule, in order', 300, 340, 32, 'y'),
  ],
  // The big idea: the input goes in the slot, multiply first, then subtract, out comes the output
  [
    write([0, 'Put'], '3 ×', 200, 180, 36), box([0, 'Put'], 235, 152, 56, 56), write([0, 'Put'], '− 2', 340, 180, 36),
    write([0, 'input'], '4', 263, 60, 38, 'b'), arrow([0, 'into'], [263, 82], [263, 145], 'b'), write([0, 'rule'], '4', 263, 180, 36, 'b'),
    span([0, 'multiply'], 172, 292, 235, 'y'), write([0, 'multiply'], 'first', 232, 272, 26, 'y'),
    write([0, 'subtract'], 'then', 340, 272, 26, 'd'),
    arrow([0, 'gives'], [380, 180], [440, 180]), write([0, 'output'], 'output', 505, 180, 28, 'y'),
  ],
  // Put the input in
  [
    write([0], 'output = 3 × input − 2', 300, 70, 34),
    write([0, '4'], 'input = 4', 170, 150, 30, 'b'),
    ring([1, 'input'], 366, 70, 44, 24, 'b'), arrow([1, '4'], [366, 98], [366, 215], 'b'),
    write([2, 'gives'], 'output = 3 × 4 − 2', 300, 250, 34), ring([2, '2'], 366, 250, 15, 22, 'b'),
  ],
  // Multiply first, then subtract
  [
    write([0], '3 × 4 − 2', 300, 60, 40), ring([0, 'times'], 260, 60, 13, 20, 'b'), ring([0, 'minus'], 340, 60, 13, 20, 'd'),
    span([1, 'Multiply'], 212, 288, 95, 'y'), write([1, '12'], '= 12 − 2', 300, 160, 40),
    write([2, '10'], '= 10', 300, 240, 40, 'y'),
    write([3, 'in'], '4 in', 200, 330, 32, 'b'), arrow([3, 'out'], [250, 330], [320, 330]), write([3, 'out'], '10 out', 390, 330, 32, 'y'),
  ],
  // A shorter way to write it
  [
    write([0, 'rule'], 'output = 3 × input − 2', 300, 55, 28, 'd'),
    write([1, 'looks'], 'f(x) = 3x − 2', 300, 130, 42),
    write([2, 'input'], 'x is the input', 170, 210, 28, 'b'), write([2, 'means'], '3x means 3 × x', 430, 210, 28, 'b'),
    write([3, 'asks'], 'f(4) = 3 × 4 − 2', 300, 285, 34), write([3, 'found'], 'f(4) = 10', 300, 355, 38, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'SUBTRACT'], '3 × 4 − 2 = 3 × 2 = 6', 300, 150, 32, 'r'), cross([1, 'multiply'], 302, 120, 168, 60),
    write([2, 'Multiply'], '3 × 4 − 2 = 12 − 2 = 10', 300, 250, 32, 'y'),
    write([2, 'first'], 'multiply first', 300, 325, 30, 'y'),
  ],
]
