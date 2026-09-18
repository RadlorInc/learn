/** g5m1-t2's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cells, arrow, cross, ring, clock } from '../../../chalk'

type At = [number, string?]
type C = 'w' | 'y' | 'b' | 'd'
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
/** A place chart row: `x` are the column centres, digits fill from column `from`. */
const row = (at: At, X: number[], from: number, ds: string, y: number, c: C = 'w', s = 34): ChalkMark[] =>
  [...ds].map((d, i) => ({ ...write(at, d, X[from + i], y, s, c), quick: true }))
const heads = (at: At, X: number[], names: string[], y: number): ChalkMark[] =>
  names.map((h, i) => ({ ...write(at, h, X[i], y, 20, 'd'), quick: true }))

// Four columns (Th H T O), 90 wide, x 120–480.
const X4 = [165, 255, 345, 435]
// Five columns (TTh Th H T O), 90 wide, x 90–540.
const X5 = [135, 225, 315, 405, 495]
const H5 = ['TTh', 'Th', 'H', 'T', 'O']

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too many to add
  [
    write([0, '37'], '37 + 37 + 37 + 37 + ...', 300, 70, 30),
    write([0, 'thousand'], '1,000 times!', 300, 120, 28, 'r'),
    clock([0, 'day'], 230, 200, 30), write([0, 'day'], 'all day...', 340, 200, 26, 'd'),
    write([1, 'faster'], 'faster way', 200, 300, 30, 'y'),
    write([1, 'dividing'], '× and ÷', 430, 300, 34),
  ],
  // The big idea
  [
    write([0, '10'], '10', 130, 60, 36), write([0, '100'], '100', 300, 60, 36), write([0, '1,000'], '1,000', 470, 60, 36),
    ...[['1 zero', 130], ['2 zeros', 300], ['3 zeros', 470]].map(([t, x]) => ({ ...write([0, '1,000'], t as string, x as number, 105, 22, 'y'), quick: true })),
    write([1, 'places'], 'zeros = places to slide', 300, 160, 26, 'y'),
    write([1, 'digit'], '37', 300, 240, 40),
    arrow([1, 'left'], [262, 240], [110, 240], 'r'), write([1, 'multiply'], '× multiply', 180, 285, 26, 'r'),
    arrow([1, 'right'], [338, 240], [490, 240], 'b'), write([1, 'divide'], '÷ divide', 420, 285, 26, 'b'),
  ],
  // One zero, one place
  [
    write([0, '10'], '10', 120, 60, 40), ring([0, 'zero'], 131, 60, 14, 22, 'y'), write([0, 'zero'], '1 zero', 230, 60, 26, 'y'),
    write([1, '37'], '37 × 10', 400, 60, 36),
    ...heads([1, '3'], X4, ['Th', 'H', 'T', 'O'], 112), cells([1, '3'], 120, 130, 360, 60, 4),
    write([1, '3'], '37', 65, 160, 28), ...row([1, '3'], X4, 2, '3', 160), ...row([1, '7'], X4, 3, '7', 160),
    cells([1, 'place'], 120, 230, 360, 60, 4),
    arrow([1, 'left'], [345, 192], [262, 228], 'r'), arrow([1, 'left'], [435, 192], [352, 228], 'r'),
    ...row([1, 'left'], X4, 1, '37', 260, 'y'),
    ring([2, 'ones'], 435, 260, 32, 24, 'd'), ...row([2, '0'], X4, 3, '0', 260, 'y'),
    write([2, '370'], '370', 65, 260, 28, 'y'), write([2, '370'], '= 370', 530, 60, 36, 'y'),
  ],
  // More zeros, more places
  [
    ...heads([0, 'Now'], X5, H5, 45), cells([0, 'Now'], 90, 60, 450, 50, 5), ...row([0, 'Now'], X5, 3, '37', 85, 'd'),
    write([0, '100'], '37 × 100', 230, 280, 30),
    cells([0, 'slide'], 90, 120, 450, 50, 5), ...row([0, 'places'], X5, 1, '3700', 145, 'y'),
    write([0, '3,700'], '= 3,700', 370, 280, 30, 'y'),
    write([1, '1,000'], '37 × 1,000', 230, 325, 30),
    cells([1, 'slide'], 90, 180, 450, 50, 5), ...row([1, 'places'], X5, 0, '37000', 205, 'y'),
    write([1, '37,000'], '= 37,000', 385, 325, 30, 'y'),
    write([2, 'beads'], '37,000 beads', 300, 370, 28, 'y'), box([2, 'beads'], 200, 352, 200, 36, 'y'),
  ],
  // Dividing slides right
  [
    write([0, '37,000'], '37,000', 150, 60, 36, 'y'),
    ...heads([0, '37,000'], X5, H5, 95), cells([0, '37,000'], 90, 110, 450, 55, 5), ...row([0, '37,000'], X5, 0, '37000', 137),
    write([0, '1,000'], '÷ 1,000', 310, 60, 36),
    ring([1, 'zeros'], 405, 137, 125, 26, 'b'),
    cells([1, 'slides'], 90, 210, 450, 55, 5),
    arrow([1, 'right'], [135, 168], [398, 208], 'b'), arrow([1, 'right'], [225, 168], [488, 208], 'b'),
    ...row([1, 'right'], X5, 3, '37', 237, 'b'),
    arrow([2, 'end'], [545, 137], [588, 137], 'r'),
    write([2, '37'], '= 37', 450, 60, 36, 'y'),
    write([2, 'bag'], '37 beads in each bag', 300, 330, 28, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'watch']),
    write([1, 'divide'], '÷', 150, 175, 44),
    write([1, 'left'], 'slide left', 330, 170, 30, 'r'), arrow([1, 'left'], [400, 205], [260, 205], 'r'),
    cross([1, 'left'], 245, 145, 170, 80),
    write([2, 'smaller'], 'number gets smaller', 300, 270, 28, 'b'),
    arrow([2, 'right'], [200, 325], [400, 325], 'y'), write([2, 'right'], 'slide right', 300, 365, 28, 'y'),
  ],
]
