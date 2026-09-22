/** g6m5-t3's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring } from '../../../chalk'
import { warn, expr, answer, dots, row } from './t1'

// Colours across this topic: a letter's value (n = 4, a = 6, b = 5) blue · the answer yellow · the mix-up coral · labels dim.
export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // The letter is in the way
  [
    write([0, '3n'], '3n + 2', 300, 80, 52), write([0, 'out'], '= ?', 432, 80, 40, 'd'),
    ring([1, 'letter'], 251, 82, 36, 30, 'b'), write([1, 'know'], '3n: not a number you know', 300, 170, 28, 'd'),
    write([2, 'find'], 'find n first', 300, 270, 40, 'b'),
  ],
  // The big idea: the number in place of its letter, then work it out
  [
    write([0, 'Put'], '3n + 2', 300, 70, 44), write([0, 'number'], 'n = 4', 490, 70, 30, 'b'),
    arrow([0, 'place'], [300, 105], [300, 150], 'd'),
    ...expr([0, 'letter'], ['3', '×', ['4', 'b'], '+', '2'], 300, 190, 44),
    arrow([0, 'do'], [300, 225], [300, 270], 'd'), write([0, 'math'], 'work it out', 300, 310, 30, 'y'),
  ],
  // Put the number in
  [
    (dots([0, 'cupcakes'], row(110, 60, 4, 36), 11)), write([0, 'n'], 'n = 4', 430, 60, 40, 'b'),
    write([1, '3n'], '3n', 200, 160, 44), write([1, 'means'], '=', 270, 160, 44), ...expr([1, 'means'], ['3', '×', 'n'], 380, 160, 44),
    write([2, 'put'], '3n + 2', 130, 270, 44), arrow([2, 'in'], [220, 270], [285, 270], 'd'),
    ...expr([2, '3'], ['3', '×', ['4', 'b'], '+', '2'], 420, 270, 44),
  ],
  // Do the math
  [
    ...expr([0, 'Multiply'], ['3', '×', ['4', 'b'], '+', '2'], 300, 70, 44),
    line([0, 'first'], [[212, 100], [318, 100]], 'y'),
    ...expr([0, '12'], ['=', '12', '+', '2'], 300, 160, 44),
    ...answer([1, '14'], '14', 310, 250, 52, [2, 'pay']), write([2, 'dollars'], '14 dollars', 300, 340, 30, 'y'),
  ],
  // Two letters work the same way
  [
    write([0, 'letters'], 'a + b', 300, 70, 52),
    write([1, '6'], 'a = 6', 190, 160, 36, 'b'), write([1, '5'], 'b = 5', 410, 160, 36, 'b'),
    ...expr([1, "it's"], [['6', 'b'], '+', ['5', 'b']], 300, 250, 52),
    ...answer([1, '11'], '11', 310, 330, 52),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'n'], 'n = 4', 300, 145, 30, 'b'),
    ...expr([1, '3n'], ['3n', ['=', 'r', 'not'], ['34', 'r', 'not']], 300, 215, 52), cross([1, 'not'], 210, 216, 180, 22),
    ...expr([2, "it's"], ['3n', ['=', 'w', '3'], ['3', 'w', '3'], ['×', 'w', '3'], ['4', 'b', '3'], ['=', 'w', '12'], ['12', 'y', '12']], 300, 310, 48),
  ],
]
