/** g6m5-t5's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring, person } from '../../../chalk'
import { warn, expr, answer } from './t1'

const R = (ms: ChalkMark[]) => ms.map(m => ({ ...m, c: 'r' as const }))

// Colours across this topic: the step that goes first (parentheses, the underline) blue · the answer yellow ·
// the add-first answer coral once it is shown up · labels dim.
export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Which step goes first? One friend adds first
  [
    ...expr([0, 'friend'], ['2', '+', '3', '×', '4^2'], 300, 60, 44), line([0, 'adds'], [[215, 98], [312, 98]], 'd'),
    ...expr([0, '5'], ['=', '5', '×', '4^2'], 300, 150, 40),
    ...expr([0, '16'], ['=', '5', '×', '16'], 300, 215, 40),
    ...expr([0, '80'], ['=', '80'], 290, 280, 44),
    write([1, 'right'], '?', 370, 280, 50, 'r'),
    write([2, 'order'], 'one order for everyone', 300, 355, 30, 'y'),
  ],
  // The big idea: the order, top to bottom
  [
    write([0, 'Parentheses'], '1st', 170, 60, 26, 'd'), write([0, 'Parentheses'], '( )', 330, 60, 40, 'b'),
    write([0, 'exponents'], '2nd', 170, 135, 26, 'd'), ...expr([0, 'exponents'], ['4^2'], 330, 135, 40),
    write([0, 'and'], '3rd', 170, 210, 26, 'd'), write([0, 'and'], '×   ÷', 330, 210, 40),
    write([0, 'each'], '4th', 170, 285, 26, 'd'), write([0, 'each'], '+   −', 330, 285, 40),
    write([0, 'pair'], 'each pair', 110, 355, 24, 'd'), arrow([0, 'left'], [230, 355], [430, 355], 'y'),
    write([0, 'right'], 'left to right', 510, 355, 22, 'y'),
  ],
  // The small raised number first
  [
    ...expr([0, 'Any'], ['2', '+', '3', '×', '4^2'], 280, 70, 48), write([0, 'No'], 'no ( )', 500, 70, 28, 'd'),
    ring([1, '4²'], 360, 66, 28, 32, 'b'), write([1, '16'], '4 × 4 = 16', 352, 160, 34, 'b'),
    ...expr([2, "it's"], ['=', '2', '+', '3', '×', ['16', 'b']], 290, 260, 48),
  ],
  // Then ×, then +
  [
    write([0, 'Multiply'], '2 + 3 × 16', 300, 60, 48), line([0, 'next'], [[248, 92], [390, 92]], 'b'),
    ...expr([0, '48'], ['=', '2', '+', '48'], 300, 150, 48),
    ...answer([1, '50'], '50', 320, 240, 52),
    person([2, 'friend'], 470, 330, 80), ring([2, 'right'], 320, 240, 36, 32, 'y'),
  ],
  // Parentheses come first
  [
    ...expr([0, 'parentheses'], [['(', 'b'], '2', '+', '3', [')', 'b'], '×', '4^2'], 300, 60, 48),
    ...expr([0, '5'], ['=', '5', '×', '4^2'], 300, 145, 44),
    ...expr([1, '16'], ['=', '5', '×', '16'], 300, 225, 44),
    ...answer([1, '80'], '80', 310, 305, 48, [2, 'new']),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, "Don't"], '2 + 3 × 16', 300, 160, 40),
    ...R(expr([1, 'add'], ['=', '5', '×', '16', '=', '80'], 300, 220, 44)), cross([1, 'first'], 160, 222, 280, 22),
    line([2, 'Multiply'], [[255, 188], [370, 188]], 'y'),
    ...expr([2, '50'], ['=', '2', '+', '48', '=', ['50', 'y']], 300, 300, 40),
  ],
]
