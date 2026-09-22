/** g4m4-t5's chalkboards: index = screen index (0 is Screen 1, which has none). Colours as in ./t1. */
import type { ChalkMark } from '../../../chalk'
import { write, line, span, ring, cross } from '../../../chalk'
import { bar, shade, fr, expr, layout, warn, type At } from './t1'

// The pan: 8 pieces, 45 wide each, x 120–480.
const X = 120, W = 360, P = 45

// Where the 8s of "2/8 + 3/8" sit, written at (300, 90), size 56.
const [f1, , f2] = layout('2/8 + 3/8', 300, 56)
/** A short yellow line under (or over) every piece, all the same length: "every piece is the same size". */
const evenMarks = (at: At, y: number): ChalkMark[] => Array.from({ length: 8 }, (_, i) => ({ ...line(at, [[X + P * i + 7, y], [X + P * (i + 1) - 7, y]], 'y', 4), quick: true }))

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not every number is a count
  [
    ...expr([0, '2/8'], '2/8 + 3/8', 300, 90, 56),
    write([0, 'add'], 'add them all?', 300, 185, 26, 'd'),
    ring([1, '8'], f1.x, 127, 24, 24, 'y'), ring([1, '8'], f2.x, 127, 24, 24, 'y'),
    write([1, 'count'], 'not how many you ate', 300, 232, 24, 'r'),
    bar([2, 'size'], X, 270, W, 50, 8), span([2, 'piece'], X, X + P, 340, 'y'),
    write([2, 'piece'], 'the size of 1 piece', 320, 340, 24, 'y'),
  ],
  // The big idea: same-size pieces, add the pieces, keep the size
  [
    bar([0, 'pieces'], X, 90, W, 70, 8),
    ...evenMarks([0, 'size'], 180),
    shade([0, 'add'], X, 90, W, 70, 8, 2), shade([0, 'top'], X, 90, W, 70, 8, 3, 2),
    write([0, 'top'], '2 pieces + 3 pieces', 300, 255, 28),
    write([0, 'keep'], 'still eighths', 300, 320, 36, 'y'),
  ],
  // First, 2 pieces
  [
    bar([0, 'pan'], X, 110, W, 80, 8), write([0, 'equal'], '8 equal pieces', 300, 225, 24, 'd'),
    shade([1, '2'], X, 110, W, 80, 8, 2), ...fr([1, '2/8'], '2/8', X + P, 300, 40, 'y'),
  ],
  // Then 3 more
  [
    bar([0], X, 110, W, 80, 8), shade([0], X, 110, W, 80, 8, 2), ...fr([0], '2/8', X + P, 290, 34),
    shade([0, '3'], X, 110, W, 80, 8, 3, 2), ...fr([0, '3/8'], '3/8', X + 3.5 * P, 290, 34, 'y'),
    ...evenMarks([1, 'size'], 95),
    write([1, 'still'], 'still 8 pieces', 300, 225, 26, 'y'),
  ],
  // Count the pieces
  [
    bar([0, 'count'], X, 55, W, 70, 8), shade([0, 'count'], X, 55, W, 70, 8, 5),
    ...[1, 2, 3, 4, 5].map(i => ({ ...write([0, 'ate'], String(i), X + 22 + P * (i - 1), 90, 28), quick: true })),
    write([0, '5'], '2 + 3 = 5', 300, 175, 34),
    write([1, 'eighth'], 'each is still an eighth', 300, 228, 26, 'd'),
    ...expr([2, '2/8'], '2/8 + 3/8 = 5/8', 300, 315, 42, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...expr([1, '5/16'], '2/8 + 3/8 = 5/16', 300, 165, 38, 'r'), cross([1, '5/16'], 170, 120, 260, 92),
    bar([2, 'Sixteenths'], X, 222, W, 30, 16), shade([2, 'Sixteenths'], X, 222, W, 30, 16, 5), ...fr([2, 'Sixteenths'], '5/16', 528, 237, 20),
    bar([2, 'pan'], X, 270, W, 30, 8), shade([2, 'pan'], X, 270, W, 30, 8, 5), ...fr([2, 'pan'], '5/8', 528, 285, 20),
    ...expr([2, 'Keep'], '2/8 + 3/8 = 5/8', 300, 352, 30, 'y'),
  ],
]
