/** g4m4-t4's chalkboards: index = screen index (0 is Screen 1, which has none). Colours as in ./t1. */
import type { ChalkMark } from '../../../chalk'
import { write, arrow, ring, span, cross } from '../../../chalk'
import { bar, shade, cut, fr, expr, warn, type At } from './t1'

// The pan: 8 pieces, 45 wide each, x 120–480. Pieces on a plate are the same 45 wide.
const X = 120, W = 360, P = 45
const pan = (at: At, y: number, h = 60, k = 5): ChalkMark[] => [bar(at, X, y, W, h, 8), shade(at, X, y, W, h, 8, k)]
/** A plate (a flat dim ring) centred at x, with `k` pieces sitting on it. */
const plate = (at: At, x: number, y: number, k: number, h = 50): ChalkMark[] => [
  ring(at, x, y + h + 4, k * P / 2 + 40, 20, 'd'),
  bar(at, x - (k * P) / 2, y, k * P, h, k), shade(at, x - (k * P) / 2, y, k * P, h, k, k),
]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // One number, many pieces
  [
    ...fr([0, '5/8'], '5/8', 300, 80, 56),
    ring([0, 'plates'], 170, 330, 100, 22, 'd'), ring([0, 'plates'], 430, 330, 100, 22, 'd'),
    bar([1, 'really'], X, 170, W, 60, 8), shade([1, 'pieces'], X, 170, W, 60, 8, 5),
    write([1, 'pieces'], '5 pieces', 540, 200, 22, 'd'),
    arrow([1, 'moved'], [190, 240], [175, 300]), arrow([1, 'moved'], [300, 240], [420, 300]),
  ],
  // The big idea: a group of same-size pieces splits into smaller groups that add back
  [
    ...pan([0, 'group'], 50),
    cut([0, 'split'], X + 2 * P, 38, 122),
    ...plate([0, 'groups'], 190, 200, 2, 50), write([0, 'add'], '+', 300, 225, 40),
    ...plate([0, 'groups'], 420, 200, 3, 50),
    arrow([0, 'back'], [555, 285], [495, 135], 'y'), write([0, 'back'], 'the same 5 pieces', 300, 355, 28, 'y'),
  ],
  // Count the pieces
  [
    bar([0, 'Count'], X, 50, W, 70, 8),
    ...['One', 'two', 'three', 'four', 'five'].flatMap((w, i) => [shade([0, w], X, 50, W, 70, 8, 1, i), write([0, w], String(i + 1), X + 22 + P * i, 85, 28)]),
    span([1, '1/8'], X, X + P, 140, 'd'), ...fr([1, '1/8'], '1/8', X + 22, 188, 28),
    ...expr([2, '1/8'], '5/8 = 1/8 + 1/8 + 1/8 + 1/8 + 1/8', 300, 300, 32, 'y'),
  ],
  // Make two groups
  [
    ...pan([0, 'Put'], 45),
    arrow([0, 'Put'], [165, 115], [165, 208]), ...plate([0, 'plate'], 165, 215, 2),
    arrow([1, 'other'], [277, 115], [420, 208]), ...plate([1, 'second'], 420, 215, 3),
    write([2, 'moved'], 'still 5 pieces', 300, 355, 30, 'y'),
  ],
  // Write it as adding
  [
    ...plate([0, 'first'], 165, 45, 2), ...fr([0, '2/8'], '2/8', 165, 170, 34),
    ...plate([0, 'second'], 425, 45, 3), ...fr([0, '3/8'], '3/8', 425, 170, 34),
    write([0, '3/8'], '+', 295, 170, 36),
    ...pan([1, 'together'], 232, 50, 0), shade([1, 'pieces'], X, 232, W, 50, 8, 5),
    ...expr([2, '5/8'], '5/8 = 2/8 + 3/8', 300, 340, 38, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...expr([1, '2/4'], '5/8 = 2/4 + 3/4', 300, 170, 40, 'r'), cross([1, '3/4'], 190, 120, 220, 100),
    write([2, 'eighth'], 'every piece is still an eighth', 300, 250, 26, 'd'),
    ...expr([2, 'keep'], '5/8 = 2/8 + 3/8', 300, 325, 40, 'y'),
  ],
]
