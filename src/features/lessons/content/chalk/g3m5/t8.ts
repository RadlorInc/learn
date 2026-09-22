/** g3m5-t8's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, cells, cross, ring, span } from '../../../chalk'
import { shade, warn, type At } from './t5to8'

const X = 150, W = 360
const bar = (at: At, y: number, n: number, k: number, h = 50): ChalkMark[] => [cells(at, X, y, W, h, n), shade(at, X, y, W, h, n, k)]
const label = (at: At, t: string, y: number): ChalkMark => ({ ...write(at, t, 90, y, 28, 'd'), quick: true })

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // Bigger number, smaller piece
  [
    write([0, '8'], '8 is bigger than 3', 300, 55, 32),
    write([1, '1/8'], '1/8 bigger than 1/3?', 300, 120, 32, 'r'), cross([1, 'No'], 140, 98, 320, 44),
    ...bar([2, 'bigger'], 190, 8, 1), label([2, 'bigger'], '1/8', 215),
    ...bar([2, 'bigger'], 270, 3, 1), label([2, 'bigger'], '1/3', 295),
    ring([2, 'smaller'], 172, 215, 36, 38, 'y'), write([2, 'piece'], 'smaller piece', 300, 360, 28, 'y'),
  ],
  // The big idea
  [
    ...bar([0, 'take'], 80, 3, 0), label([0, 'take'], '1/3', 105),
    ...bar([0, 'take'], 180, 8, 0), label([0, 'take'], '1/8', 205),
    shade([0, 'same'], X, 80, W, 50, 3, 1), shade([0, 'same'], X, 180, W, 50, 8, 1),
    write([0, 'fewer'], 'fewer pieces', 330, 155, 22, 'd'),
    ring([0, 'more'], 210, 105, 76, 40, 'y'),
    write([0, 'bigger'], 'bigger pieces', 300, 310, 34, 'y'),
  ],
  // Cut into 3
  [
    line([0, 'bar'], [[120, 140], [480, 140], [480, 220], [120, 220], [120, 140]]),
    line([0, '3'], [[240, 140], [240, 220]]), line([0, '3'], [[360, 140], [360, 220]]),
    span([1, 'big'], 120, 240, 260, 'y'), write([1, 'big'], 'big', 180, 300, 32, 'y'),
  ],
  // Cut into 8
  [
    cells([0, 'Now'], 120, 60, 360, 60, 3), write([0, 'Now'], '3', 75, 90, 28, 'd'),
    cells([0, '8'], 120, 180, 360, 60, 8), write([0, '8'], '8', 75, 210, 28, 'd'),
    span([1, 'smaller'], 120, 165, 265, 'y'),
    write([2, 'cuts'], 'more cuts → smaller pieces', 300, 340, 28, 'y'),
  ],
  // Take 2 of each
  [
    cells([0, 'Take'], X, 60, W, 56, 3), cells([0, 'each'], X, 160, W, 56, 8),
    shade([0, '2'], X, 60, W, 56, 3, 2), shade([0, '2'], X, 160, W, 56, 8, 2),
    label([0, '2/3'], '2/3', 88), label([0, '2/8'], '2/8', 188),
    ring([1, 'bigger'], 270, 88, 136, 42, 'y'),
    write([2, '2/3'], '2/3 > 2/8', 300, 310, 44, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'BIGGER'], '1/8 > 1/3', 300, 150, 36, 'r'), cross([1, 'number'], 215, 128, 170, 44),
    ...bar([2, 'cuts'], 200, 8, 1, 40), label([2, 'cuts'], '1/8', 220),
    ...bar([2, 'cuts'], 255, 3, 1, 40), label([2, 'cuts'], '1/3', 275),
    write([2, '1/3'], '1/3 > 1/8', 300, 345, 38, 'y'),
  ],
]
