/** g6m5-t4's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring, clock } from '../../../chalk'
import { warn, expr, answer } from './t1'

// Colours across this topic: the small raised number (how many) yellow · the answer yellow too, ringed · the mix-up coral ·
// the big number's label blue · labels dim.
export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Long to write
  [
    write([0, 'write'], '4 × 4 × 4', 300, 70, 44),
    write([1, 'six'], '4 × 4 × 4 × 4 × 4 × 4', 300, 160, 38),
    clock([2, 'slow'], 150, 265, 28), write([2, 'count'], 'how many 4s?', 360, 265, 32, 'r'),
  ],
  // The big idea: the small raised number counts the big ones
  [
    write([0, 'small'], '4', 140, 160, 96), write([0, 'raised'], '3', 178, 118, 52, 'y'),
    arrow([0, 'many'], [300, 70], [208, 104], 'y'), write([0, 'many'], 'how many', 380, 65, 28, 'y'),
    ...expr([0, '4'], ['=', '4', '×', '4', '×', '4'], 390, 175, 44), write([0, '4'], 'three 4s', 390, 235, 28, 'd'),
  ],
  // Read the small number
  [
    write([0, '4'], '4', 150, 130, 90), write([0, '3'], '3', 184, 90, 50, 'y'),
    arrow([1, 'multiply'], [150, 250], [150, 190], 'b'), write([1, 'multiply'], 'what you multiply', 150, 280, 24, 'b'),
    arrow([2, 'says'], [330, 88], [216, 88], 'y'), write([2, 'many'], 'how many', 400, 85, 28, 'y'),
    ...expr([2, '4'], ['=', '4', '×', '4', '×', '4'], 420, 190, 40), write([2, '4'], 'three 4s', 420, 245, 26, 'd'),
  ],
  // Multiply step by step
  [
    write([0, 'Multiply'], '4 × 4 × 4', 300, 70, 44), line([0, 'two'], [[200, 102], [310, 102]], 'b'),
    ...expr([0, '16'], ['=', '16', '×', '4'], 300, 160, 44),
    ...answer([1, '64'], '64', 310, 250, 52, [1, 'shop']),
    write([1, 'toys'], '64 toys', 300, 335, 30, 'y'),
  ],
  // Squared and cubed
  [
    ...expr([1, '5²'], ['5^2'], 70, 140, 48), ...expr([1, '5'], ['=', '5', '×', '5'], 205, 140, 36),
    ...answer([1, '25'], '25', 345, 140, 36), write([1, 'squared'], 'five squared', 480, 140, 28, 'b'),
    ...expr([2, '2³'], ['2^3'], 70, 260, 48), ...expr([2, '2'], ['=', '2', '×', '2', '×', '2'], 225, 260, 36),
    ...answer([2, '8'], '8', 365, 260, 36), write([2, 'cubed'], 'two cubed', 480, 260, 28, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...expr([1, '4³'], ['4^3'], 100, 185, 48), ...expr([1, 'not'], ['=', '4', '×', '3'], 250, 185, 44).map(m => ({ ...m, c: 'r' as const })),
    cross([1, '3'], 170, 186, 160, 20),
    ...expr([2, 'means'], ['4^3'], 100, 295, 48), ...expr([2, '4'], ['=', '4', '×', '4', '×', '4'], 270, 295, 40),
    ...answer([2, '64'], '64', 470, 295, 44),
  ],
]
