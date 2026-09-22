/** g4m4-t3's chalkboards: index = screen index (0 is Screen 1, which has none). Colours as in ./t1. */
import type { ChalkMark } from '../../../chalk'
import { write, line, span, ring, cross } from '../../../chalk'
import { bar, shade, cut, fr, expr, warn, type At } from './t1'

// Both ribbons are the same length, x 130–490: a fourth is 90 wide, an eighth 45.
const X = 130, W = 360
const ribbon = (at: At, y: number, n: number, k: number, h = 50): ChalkMark[] => [bar(at, X, y, W, h, n), shade(at, X, y, W, h, n, k)]
/** The cuts that turn every fourth into 2 eighths. */
const fourthsCut = (at: At, y: number, h = 50): ChalkMark[] => [0, 1, 2, 3].map(i => cut(at, X + 45 + 90 * i, y - 12, y + h + 12))

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Big pieces and small pieces
  [
    ...ribbon([0, '3/4'], 60, 4, 3), ...fr([0, '3/4'], '3/4', 75, 85, 30), write([0, '3/4'], 'Mia', 540, 85, 24, 'd'),
    ...ribbon([0, '5/8'], 150, 8, 5), ...fr([0, '5/8'], '5/8', 75, 175, 30), write([0, '5/8'], 'Leo', 540, 175, 24, 'd'),
    write([0, 'bigger'], '5 > 3', 300, 262, 30),
    span([1, 'fourth'], X, X + 90, 124, 'd'), write([1, 'big'], 'big', 250, 124, 22, 'd'),
    span([1, 'eighth'], X, X + 45, 214, 'd'), write([1, 'half'], 'small', 215, 214, 22, 'd'),
    write([2, 'yet'], 'not a fair count yet', 300, 330, 30, 'r'),
  ],
  // The big idea: cut until the pieces match, then compare the tops
  [
    ...ribbon([0, 'Cut'], 70, 4, 3), ...ribbon([0, 'both'], 180, 8, 5),
    ...fourthsCut([0, 'same'], 70),
    write([0, 'size'], 'same size pieces', 300, 300, 30, 'y'),
    span([0, 'compare'], X, X + 270, 142, 'y'), span([0, 'compare'], X, X + 225, 252, 'y'),
  ],
  // Cut the fourths
  [
    ...ribbon([0], 60, 4, 3), ...fr([0], '3/4', 75, 85, 30),
    ...ribbon([0, 'eighths'], 170, 8, 5), ...fr([0, 'eighths'], '5/8', 75, 195, 30),
    write([0, 'alone'], 'already small', 310, 250, 24, 'd'),
    ...fourthsCut([1, 'Cut'], 60),
    write([2, 'both'], '8 pieces', 545, 85, 22, 'd'), write([2, 'both'], '8 pieces', 545, 195, 22, 'd'),
    write([2, 'eighths'], 'both in eighths', 300, 320, 32, 'y'),
  ],
  // Count the eighths
  [
    bar([0, 'eighths'], X, 65, W, 70, 8), shade([0, 'shaded'], X, 65, W, 70, 8, 6),
    ...['One', 'two', 'three', 'four', 'five', 'six'].map((w, i) => write([0, w], String(i + 1), X + 22 + 45 * i, 100, 28)),
    ...fr([1, '6/8'], '6/8', 75, 100, 32, 'y'),
    ...ribbon([1, '3/4'], 190, 4, 3, 70), ...fr([1, '3/4'], '3/4', 75, 225, 32),
    line([1, 'smaller'], [[X + 270, 50], [X + 270, 275]], 'y', 4),
    ...expr([1, 'smaller'], '3/4 = 6/8', 300, 335, 38, 'y'),
  ],
  // Compare the tops
  [
    ...ribbon([0, 'pieces'], 55, 8, 6), ...fr([0, 'pieces'], '6/8', 75, 80, 30), write([0, 'pieces'], 'Mia', 540, 80, 24, 'd'),
    ...ribbon([0, 'match'], 140, 8, 5), ...fr([0, 'match'], '5/8', 75, 165, 30), write([0, 'match'], 'Leo', 540, 165, 24, 'd'),
    ring([1, 'more'], X + 247, 80, 32, 34, 'y'),
    ...expr([1, 'more'], '6/8 > 5/8', 300, 250, 34),
    ...expr([2, '3/4'], '3/4 > 5/8', 300, 340, 40, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...expr([1, 'compare'], '5/8 > 3/4', 300, 170, 40, 'r'), cross([1, 'BEFORE'], 225, 118, 150, 104),
    ...ribbon([2, 'smaller'], 232, 4, 3, 30), ...fr([2, 'smaller'], '3/4', 528, 247, 20),
    ...ribbon([2, 'smaller'], 280, 8, 5, 30), ...fr([2, 'smaller'], '5/8', 528, 295, 20),
    ...expr([2, 'compare'], '6/8 > 5/8', 300, 355, 30, 'y'),
  ],
]
