/** g5m5-t2's chalkboards: index = screen index (0 is Screen 1, which has none). One layer is 4 × 3 = 12 cubes, 2 layers make 24. */
import type { ChalkMark } from '../../../chalk'
import { write, cross } from '../../../chalk'
import { block, warn, tick } from './t1'

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too many to count one by one
  [
    block([0], 120, 300, 4, 3, 2, 55),
    ...['1', '2', '3'].map((n, i) => ({ ...write([0, 'one'], n, 147 + 55 * i, 272, 28, 'y'), quick: true })),
    write([1, 'back'], '?', 470, 150, 36, 'r'), write([1, 'underneath'], '?', 470, 280, 36, 'r'),
    write([2, 'place'], 'lost your place?', 200, 362, 28, 'r'),
    write([2, 'faster'], 'faster way', 450, 362, 28, 'y'),
  ],
  // The big idea: one layer, times the layers
  [
    block([0, 'layer'], 40, 290, 4, 3, 1, 40, 'y'),
    write([0, 'multiply'], '×', 310, 240, 44),
    block([0, 'layers'], 350, 290, 4, 3, 2, 40),
  ],
  // The bottom layer
  [
    block([0, 'bottom'], 110, 280, 4, 3, 1, 60),
    write([1, 'long'], '4', 230, 312, 30), write([1, 'wide'], '3', 412, 278, 30),
    write([2, '12'], '4 × 3 = 12', 300, 362, 36, 'y'),
  ],
  // The next layer is the same
  [
    block([0], 110, 330, 4, 3, 1, 50), write([0], '12', 430, 300, 30),
    block([0, 'top'], 110, 210, 4, 3, 1, 50),
    write([1, '12'], '12', 430, 180, 30, 'y'),
  ],
  // 2 layers of 12
  [
    block([0], 90, 290, 4, 3, 2, 50),
    { ...write([0, '12'], '12', 410, 195, 30), quick: true }, write([0, '12'], '12', 410, 245, 30),
    write([1, '24'], '12 × 2 = 24', 300, 362, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    block([1, 'layer'], 50, 300, 4, 3, 1, 35),
    write([2, '12'], '12 cubes', 145, 345, 30, 'r'),
    cross([2, 'only'], 80, 327, 130, 38),
    block([2, 'Multiply'], 350, 300, 4, 3, 2, 35, 'y'),
    write([2, '24'], '12 × 2 = 24', 425, 345, 30, 'y'), tick([2, '24'], 543, 345),
  ],
]
