/** g5m5-t3's chalkboards: index = screen index (0 is Screen 1, which has none). The tank: 5 ft long, 2 ft wide, 3 ft tall. */
import type { ChalkMark } from '../../../chalk'
import { write, cross, line } from '../../../chalk'
import { block, warn, tick } from './t1'

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // No cubes, but every edge
  [
    block([0], 130, 320, 5, 2, 3, 55, 'w', false),
    write([1, '5'], '5 ft', 267, 350, 28), write([1, '2'], '2 ft', 505, 310, 28), write([1, '3'], '3 ft', 90, 237, 28),
    write([2, 'fits'], '?', 267, 240, 44, 'y'),
  ],
  // The big idea: length × width × height
  [
    block([0], 150, 285, 5, 2, 3, 50, 'w', false),
    write([0, 'length'], 'length', 275, 313, 26), write([0, 'width'], 'width', 505, 280, 26), write([0, 'height'], 'height', 92, 210, 26),
    write([0, 'volume'], 'length × width × height', 300, 360, 28, 'y'),
  ],
  // The bottom is one layer
  [
    block([0], 120, 290, 5, 2, 3, 50, 'd', false),
    write([0, '5'], '5 ft', 245, 318, 26), write([0, '2'], '2 ft', 442, 298, 26),
    block([1, 'cover'], 120, 290, 5, 2, 1, 50),
    write([1, '10'], '5 × 2 = 10', 300, 358, 32, 'y'),
    write([2, 'layer'], '1 layer', 505, 235, 26),
  ],
  // The height is the layers
  [
    block([0], 100, 320, 5, 2, 3, 50, 'd', false),
    write([0, 'tall'], '3 ft', 62, 245, 26),
    block([0, 'stack'], 100, 320, 5, 2, 3, 50),
    write([1, 'ten'], '10', 445, 279, 30), write([1, 'twenty'], '20', 445, 229, 30), write([1, 'thirty'], '30', 445, 179, 32, 'y'),
  ],
  // Multiply all three
  [
    block([0], 180, 235, 5, 2, 3, 40, 'w', false),
    write([0], '5 ft', 280, 261, 24), write([0], '2 ft', 445, 230, 24), write([0], '3 ft', 145, 175, 24),
    write([0, 'three'], '5 × 2 × 3', 262, 305, 36),
    write([1, '30'], '= 30', 385, 305, 36, 'y'),
    write([1, 'feet'], '30 cubic feet', 300, 355, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    block([1], 60, 290, 5, 2, 3, 30, 'w', false),
    write([1, 'add'], '5 + 2 + 3 = 10', 150, 345, 30, 'r'),
    line([2, 'walks'], [[60, 200], [60, 290], [210, 290], [240, 271]], 'r', 6),
    cross([2, 'only'], 40, 325, 220, 40),
    block([2, 'fill'], 350, 290, 5, 2, 3, 30, 'y'),
    write([2, 'inside'], '5 × 2 × 3 = 30', 422, 345, 30, 'y'), tick([2, 'inside'], 545, 345),
  ],
]
