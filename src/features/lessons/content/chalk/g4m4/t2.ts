/** g4m4-t2's chalkboards: index = screen index (0 is Screen 1, which has none). Colours as in ./t1. */
import type { ChalkMark } from '../../../chalk'
import { write, line, span, ring, cross } from '../../../chalk'
import { bar, shade, fr, expr, warn, type At } from './t1'

// Both pies are drawn as bars of the same length, x 130–490, so half is always at x = 310.
const X = 130, W = 360, HALF = 310
const pie = (at: At, y: number, n: number, k: number, h = 50): ChalkMark[] => [bar(at, X, y, W, h, n), shade(at, X, y, W, h, n, k)]
const half = (at: At, y1: number, y2: number): ChalkMark => line(at, [[HALF, y1], [HALF, y2]], 'w', 4)

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // The pieces are different
  [
    ...pie([0, '4/6'], 60, 8, 3), ...fr([0, '4/6'], '3/8', 75, 85, 30),
    ...pie([0, '4/6'], 150, 6, 4), ...fr([0, '4/6'], '4/6', 75, 175, 30),
    write([0, 'more'], '4 > 3', 548, 130, 30),
    span([1, 'Eighths'], X, X + W / 8, 40, 'd'), span([1, 'sixths'], X, X + W / 6, 222, 'd'),
    write([1, 'sizes'], 'different sizes', 300, 262, 26, 'd'),
    half([2, 'half'], 30, 222), ...fr([2, 'half'], '1/2', HALF, 330, 36),
  ],
  // The big idea: less than half, more than half
  [
    { ...line([0, 'less'], [[X, 70], [X + W, 70], [X + W, 130], [X, 130], [X, 70]]) }, { ...shade([0, 'less'], X, 70, W, 60, 20, 7), quick: false },
    write([0, 'less'], 'less', 70, 100, 24, 'd'),
    half([0, 'half'], 50, 250), write([0, 'half'], 'half', HALF, 280, 24, 'd'),
    { ...line([0, 'more'], [[X, 170], [X + W, 170], [X + W, 230], [X, 230], [X, 170]]) }, { ...shade([0, 'more'], X, 170, W, 60, 20, 14), quick: false },
    write([0, 'more'], 'more', 70, 200, 24, 'd'),
    ring([0, 'bigger'], 390, 200, 110, 46, 'y'), write([0, 'bigger'], 'bigger', 390, 330, 36, 'y'),
  ],
  // Is 3/8 more than half?
  [
    ...fr([0, '3/8'], '3/8', 75, 140, 32), bar([0, '8'], X, 110, W, 60, 8),
    half([0, 'half'], 85, 190), span([0, '4'], X, HALF, 92, 'd'), write([0, '4'], 'half = 4 pieces', 220, 66, 22, 'd'),
    shade([1, '3'], X, 110, W, 60, 8, 3), write([1, 'less'], '3 < 4', 300, 245, 34),
    ...expr([2, 'half'], '3/8 < 1/2', 300, 330, 36, 'y'),
  ],
  // Is 4/6 more than half?
  [
    ...fr([0, '4/6'], '4/6', 75, 140, 32), bar([0, '6'], X, 110, W, 60, 6),
    half([0, 'half'], 85, 190), span([0, '3'], X, HALF, 92, 'd'), write([0, '3'], 'half = 3 pieces', 220, 66, 22, 'd'),
    shade([1, '4'], X, 110, W, 60, 6, 4), write([1, 'more'], '4 > 3', 300, 245, 34),
    ...expr([2, 'half'], '4/6 > 1/2', 300, 330, 36, 'y'),
  ],
  // Put it together
  [
    ...pie([0, 'side'], 50, 8, 3), ...fr([0, 'side'], '3/8', 75, 75, 30),
    ...pie([0, 'side'], 140, 6, 4), ...fr([0, 'side'], '4/6', 75, 165, 30),
    half([0, 'half'], 32, 208),
    write([0, 'less'], 'less', 545, 75, 26, 'd'), write([0, 'more'], 'more', 545, 165, 26, 'd'),
    ring([1, 'past'], 370, 165, 72, 36, 'y'),
    ...expr([2, '4/6'], '3/8 < 4/6', 300, 285, 40, 'y'),
    write([2, 'friend'], 'your friend ate more', 300, 365, 26, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...expr([1, 'pick'], '3/8 > 4/6', 300, 160, 40, 'r'), cross([1, 'BIGGER'], 225, 110, 150, 100),
    bar([2, 'smaller'], X, 240, W, 28, 8), bar([2, 'smaller'], X, 274, W, 28, 6),
    span([2, 'smaller'], X, X + W / 8, 227, 'd'), write([2, 'smaller'], 'smaller', 545, 254, 24, 'd'),
    ...expr([2, 'half'], '3/8 < 1/2 < 4/6', 300, 350, 30, 'y'),
  ],
]
