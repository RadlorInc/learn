/** g4m2-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Tiles white; a gap or short row coral; "only one rectangle" blue; "more than one" yellow. */
import type { ChalkMark } from '../../../chalk'
import { write, box, cross } from '../../../chalk'
import { tiles, warn, tick } from '../g3m4/t1'

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Some numbers will not fit
  [
    tiles([0, 'tries'], 188, 50, 2, 4, 56, 'w', (r, c) => r === 1 && c === 3),
    box([0, 'gap'], 356, 106, 56, 56, 'r'), write([0, 'empty'], 'empty', 480, 134, 26, 'r'),
    write([1, 'work'], '2 rows: no', 300, 215, 30, 'r'),
    tiles([2, 'second'], 160, 262, 1, 7, 40, 'b'),
    write([2, 'rectangle'], 'only this one?', 300, 345, 28, 'b'),
  ],
  // The big idea
  [
    write([0, 'only'], '7', 120, 80, 30), tiles([0, 'only'], 160, 60, 1, 7, 40),
    write([0, 'row'], 'only one rectangle', 300, 140, 28, 'b'),
    write([0, 'others'], '6', 60, 240, 30), tiles([0, 'others'], 90, 220, 1, 6, 36),
    tiles([0, 'more'], 400, 202, 2, 3, 36),
    write([0, 'more'], 'more than one', 300, 330, 30, 'y'),
  ],
  // Try 7
  [
    tiles([0, 'rows'], 40, 50, 2, 4, 40, 'w', (r, c) => r === 1 && c === 3), box([0, 'short'], 160, 90, 40, 40, 'r'),
    write([0, 'short'], '2 rows', 120, 160, 24, 'r'),
    tiles([1, 'rows'], 250, 50, 3, 3, 40, 'w', (r, c) => r === 2 && c >= 1), box([1, 'short'], 290, 130, 80, 40, 'r'),
    write([1, 'short'], '3 rows', 310, 200, 24, 'r'),
    write([1, '4'], '4, 5, 6 rows', 490, 90, 24, 'r'), write([1, '6'], 'short too', 490, 130, 24, 'r'),
    write([2, 'rectangle'], '7: one rectangle', 300, 265, 30, 'b'),
    tiles([2, 'long'], 160, 305, 1, 7, 40, 'b'),
  ],
  // Try 6
  [
    tiles([0, 'row'], 168, 50, 1, 6, 44), tick([0, 'works'], 450, 72),
    tiles([1, 'rows'], 234, 140, 2, 3, 44), tick([1, 'too'], 400, 184),
    write([2, 'more'], '6: more than one', 300, 300, 32, 'y'),
  ],
  // Two kinds of numbers
  [
    write([0, '7'], '7', 166, 45, 26), tiles([0, '7'], 40, 70, 1, 7, 36), write([0, 'one'], 'one rectangle', 166, 135, 26, 'b'),
    write([0, '6'], '6', 454, 38, 26), tiles([0, '6'], 400, 60, 2, 3, 36), write([0, 'more'], 'more than one', 454, 160, 26, 'y'),
    write([1, 'between'], '?', 300, 215, 40, 'd'), cross([1, 'No'], 282, 193, 36, 44),
    write([2, 'Every'], 'every number bigger than 1', 300, 280, 26, 'd'),
    write([2, 'one'], 'one rectangle', 165, 340, 30, 'b'), write([2, 'or'], 'or', 300, 340, 26, 'd'),
    write([2, 'other'], 'more than one', 435, 340, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'odd'], 'odd', 55, 190, 30, 'r'), write([1, 'rectangle'], '→ one rectangle', 205, 190, 30, 'r'),
    cross([1, 'rectangle'], 30, 165, 295, 50),
    write([2, '9'], '9', 450, 130, 30, 'y'), tiles([2, 'rows'], 390, 150, 3, 3, 40, 'y'),
    write([2, 'all'], '3 rows of 3', 450, 300, 28, 'y'), tick([2, 'all'], 530, 300),
    write([2, 'test'], 'test the rows', 300, 360, 30, 'y'),
  ],
]
