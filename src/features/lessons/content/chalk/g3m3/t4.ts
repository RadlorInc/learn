/** g3m3-t4's chalkboards (7s): index = screen index (0 is Screen 1, which has none). A sticker is a small circle; a row is a day. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cross } from '../../../chalk'
import { dots, warn, tick } from '../g3m1/t1'
import { rows, type Shape } from './t3'

const sticker = (r: number): Shape => (at, pts, c) => dots(at, pts, r, c)
const S = sticker(10)

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // 7s are tricky
  [
    write([0, '7s'], 'by 7s:  7, 14,', 270, 70, 32), write([0, 'tricky'], '?', 405, 70, 40, 'r'),
    write([1, '5s'], 'by 5s:  5, 10, 15, 20', 300, 170, 30), write([1, '2s'], 'by 2s:  2, 4, 6, 8', 300, 225, 30),
    write([2, 'Yes'], 'yes', 280, 320, 38, 'y'), tick([2, 'Yes'], 335, 318),
  ],
  // The big idea: 5 groups and 2 groups
  [
    write([0, '7'], '7 groups', 450, 45, 26, 'd'),
    ...rows(sticker(11), [0, '5'], 150, 50, 40, 0, 5, 'b'), write([0, '5'], '5 groups', 450, 130, 32, 'b'),
    line([0, '2'], [[120, 230], [260, 230]], 'd', 2),
    ...rows(sticker(11), [0, '2'], 150, 50, 40, 5, 7), write([0, '2'], '2 groups', 450, 290, 32),
    write([0, 'add'], '+', 450, 210, 40, 'y'),
  ],
  // Five days
  [
    ...rows(S, [0, 'Look'], 120, 55, 36, 0, 7, 'd'),
    box([0, 'first'], 100, 40, 112, 174, 'b'),
    write([1, 'days'], '5 days of 3', 420, 110, 32, 'b'),
    write([2, '5'], '5 × 3', 380, 200, 40, 'b'), write([2, '15'], '= 15', 490, 200, 40, 'b'),
  ],
  // Two days
  [
    ...rows(S, [0, 'Now'], 120, 55, 36, 0, 5, 'b'), write([0, 'Now'], '15', 280, 127, 32, 'b'),
    ...rows(S, [0, 'left'], 120, 55, 36, 5, 7), box([0, 'left'], 100, 219, 112, 68),
    write([1, 'days'], '2 days of 3', 420, 253, 32),
    write([2, '2'], '2 × 3', 250, 345, 40), write([2, '6'], '= 6', 340, 345, 40),
  ],
  // Add the two parts
  [
    ...rows(sticker(8), [0, 'two'], 90, 55, 30, 0, 5, 'b'), write([0, 'parts'], '15', 210, 115, 30, 'b'),
    ...rows(sticker(8), [0, 'parts'], 90, 55, 30, 5, 7), write([0, 'parts'], '6', 210, 220, 30),
    write([1, '15'], '15 + 6', 360, 130, 40), write([1, '21'], '= 21', 485, 130, 40, 'y'),
    write([2, '7'], '7 × 3', 360, 250, 48), write([2, '21'], '= 21', 480, 250, 48, 'y'),
    write([2, 'stickers'], '21 stickers', 430, 330, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ONE'], '7 × 3 = 15 + 3', 165, 175, 34, 'r'), cross([1, 'end'], 40, 150, 250, 50),
    ...rows(sticker(6), [2, '5'], 408, 140, 22, 0, 5, 'b'), write([2, '5'], '15', 520, 184, 26, 'b'),
    ...rows(sticker(6), [2, '2'], 408, 140, 22, 5, 7), write([2, '2'], '6', 520, 261, 26),
    write([2, 'both'], '7 × 3 = 15 + 6', 440, 330, 34, 'y'), tick([2, 'more'], 440, 372),
  ],
]
