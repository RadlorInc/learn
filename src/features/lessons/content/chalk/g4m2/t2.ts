/** g4m2-t2's chalkboards: index = screen index (0 is Screen 1, which has none). Tiles white, a pair yellow, a short row coral. */
import type { ChalkMark } from '../../../chalk'
import { write, box, arrow, cross } from '../../../chalk'
import { tiles, loose, warn, tick } from '../g3m4/t1'

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // One rectangle is not all of them
  [
    tiles([0, 'way'], 200, 55, 3, 4, 48),
    write([0, 'rows'], '3', 175, 127, 28), write([0, '4'], '4', 296, 33, 28),
    write([1, 'other'], 'other rectangles too?', 300, 245, 28, 'b'),
    loose([2, 'Guess'], [[110, 300], [150, 318], [205, 296], [240, 330], [95, 345]], 30),
    write([2, 'miss'], 'miss one?', 430, 330, 30, 'r'),
  ],
  // The big idea
  [
    tiles([0, 'rectangle'], 150, 75, 2, 6, 50),
    write([0, 'pair'], '2', 125, 125, 30, 'y'), write([0, 'pair'], '6', 300, 52, 30, 'y'),
    write([0, 'multiply'], '2 × 6', 255, 260, 44, 'y'), write([0, 'total'], '= 12', 375, 260, 44, 'y'),
    write([0, 'total'], 'every tile used', 300, 330, 26, 'd'),
  ],
  // 1 row, then 2 rows
  [
    tiles([0, '1'], 84, 45, 1, 12, 36), write([0, 'is'], '1 × 12', 300, 115, 34, 'y'),
    tiles([1, 'rows'], 192, 160, 2, 6, 36), write([1, 'is'], '2 × 6', 300, 270, 34, 'y'),
    tick([2, 'use'], 370, 115), tick([2, 'use'], 358, 270),
    write([2, 'pairs'], '2 pairs', 300, 345, 34, 'y'),
  ],
  // 3 rows
  [
    tiles([0, 'rows'], 80, 60, 3, 4, 40), write([0, 'rows'], '3', 58, 120, 26), write([0, 'rows'], '4', 160, 40, 26),
    write([0, "That's"], '3 × 4', 138, 230, 34, 'y'), write([0, '12'], '= 12', 232, 230, 34, 'y'),
    tiles([1, 'rows'], 400, 40, 4, 3, 40, 'b'),
    arrow([1, 'turned'], [270, 120], [380, 120], 'b'), write([1, 'turned'], '4 × 3', 460, 230, 34, 'b'),
    write([1, 'turned'], 'same one, turned', 300, 300, 30, 'b'),
    write([2, 'twice'], 'count it once', 300, 355, 30),
  ],
  // 5 in a row comes up short
  [
    tiles([0, 'try'], 190, 40, 3, 5, 44, 'w', (r, c) => r === 2 && c >= 2),
    write([0, 'row'], '5', 450, 62, 26), write([0, '10'], '10', 450, 106, 26), write([0, '2'], '2', 450, 150, 26),
    box([1, 'short'], 278, 128, 132, 44, 'r'), write([1, 'short'], 'short', 344, 150, 22, 'r'),
    write([1, 'not'], '5 is not in a pair', 300, 215, 28, 'r'),
    write([2, 'pairs'], '3 pairs for 12', 300, 275, 30, 'y'),
    write([2, '1'], '1 × 12', 140, 340, 34, 'y'), write([2, '6'], '2 × 6', 300, 340, 34, 'y'), write([2, '4'], '3 × 4', 455, 340, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, "Don't"], '2 × 6', 235, 150, 32), write([1, "Don't"], '3 × 4', 365, 150, 32),
    write([1, 'FORGET'], '= 2 pairs', 300, 198, 30, 'r'), cross([1, 'row'], 225, 178, 150, 40),
    tiles([2, 'row'], 120, 245, 1, 12, 30, 'y'),
    write([2, '12'], '1 × 12', 270, 318, 34, 'y'), tick([2, 'pair'], 330, 318),
    write([2, 'number'], 'every number: 1 × itself', 300, 365, 26, 'y'),
  ],
]
