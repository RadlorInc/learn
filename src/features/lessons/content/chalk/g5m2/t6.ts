/** g5m2-t6's chalkboards: index = screen index (0 is Screen 1, which has none). One can is a bar 400 wide, so half a can is 200. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cells, cross, ring, span } from '../../../chalk'
import { q, fr, row, crossRow, mixed, shade, warn, type At, type Tok } from './t5'

const X = 100, W = 400
/** A can as a bar cut into `n`, `k` pieces washed blue, its fraction written on the left. */
const can = (at: At, y: number, n: number, k: number, h = 50): ChalkMark[] =>
  [cells(at, X, y, W, h, n), shade(at, X, y, W, h, n, k), ...fr(at, String(k), String(n), 55, y + h / 2, 26)]
/** A thin line at half the can, from y1 to y2. */
const half = (at: At, y1: number, y2: number): ChalkMark => q(line(at, [[X + W / 2, y1], [X + W / 2, y2]], 'w', 2.5))

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Hard to add
  [
    ...can([0, 'fifths'], 40, 5, 3, 44), ...can([0, 'sevenths'], 100, 7, 4, 44),
    q(cells([0, 'tiny'], X, 170, W, 34, 35, 'd')), write([0, 'tiny'], '35 tiny pieces', 300, 230, 24, 'd'),
    write([1, 'how'], 'how much?', 300, 285, 30), cross([1, 'No'], 225, 265, 150, 40),
    write([2, 'more'], 'more than 1 can?', 300, 355, 32, 'y'),
  ],
  // The big idea: two parts over half go past 1, two under half fall short
  [
    box([0, 'Compare'], X, 50, W, 44), q(line([0, 'Compare'], [[300, 50], [300, 94]])),
    q(write([0, '1/2'], 'half', 200, 72, 26, 'd')), q(write([0, '1/2'], 'half', 400, 72, 26, 'd')), write([0, 'Compare'], '1', 65, 72, 34, 'd'),
    q(line([0, 'Compare'], [[500, 40], [500, 360]], 'd', 2)),
    box([0, 'over'], X, 140, 240, 40), box([0, 'over'], 340, 140, 225, 40), shade([0, 'over'], X, 140, 465, 40, 1, 1),
    write([0, 'more'], 'more than 1', 300, 212, 28, 'y'), ring([0, 'more'], 532, 160, 42, 30, 'y'),
    box([0, 'under'], X, 250, 160, 40), box([0, 'under'], 260, 250, 170, 40), shade([0, 'under'], X, 250, 330, 40, 1, 1),
    write([0, 'less'], 'less than 1', 300, 322, 28, 'b'),
  ],
  // Check the first can: 3 of 5 against half of 5
  [
    ...can([0, 'Take'], 70, 5, 3, 60), half([0, 'Half'], 55, 145),
    ...row([...mixed([0, '2'], '2', '1', '2'), [[0, 'pieces'], 'pieces']], 300, 185, 28),
    ring([1, '3'], 220, 100, 128, 44), ...row([[[1, 'more'], '3'], [[1, 'more'], 'is more than'], ...mixed([1, 'more'], '2', '1', '2')], 300, 265, 30),
    ...row([[[2, '3/5'], ['3', '5'], 'y'], [[2, 'more'], 'is more than half', 'y']], 300, 345, 30),
  ],
  // Check the other can: 4 of 7 against half of 7
  [
    ...can([0, 'Now'], 70, 7, 4, 60), half([0, 'Half'], 55, 145),
    ...row([...mixed([0, '3'], '3', '1', '2'), [[0, 'half'], 'pieces']], 300, 185, 28),
    ring([1, '4'], X + (4 * W) / 14, 100, 124, 44), ...row([[[1, 'more'], '4'], [[1, 'more'], 'is more than'], ...mixed([1, 'more'], '3', '1', '2')], 300, 265, 30),
    ...row([[[2, '4/7'], ['4', '7'], 'y'], [[2, 'too'], 'is more than half', 'y']], 300, 345, 30),
  ],
  // Put them together: half + half is 1 can, and both are more than half
  [
    cells([0, 'Half'], X, 50, W, 44, 2), write([0, 'Half'], 'half', 200, 72, 26, 'd'), write([0, 'half'], 'half', 400, 72, 26, 'd'),
    span([0, 'exactly'], X, X + W, 120), write([0, '1'], '1 can', 300, 150, 26),
    q(line([0, '1'], [[500, 40], [500, 290]], 'd', 2)),
    cells([1, 'Both'], X, 200, 240, 44, 3), shade([1, 'Both'], X, 200, 240, 44, 1, 1),
    cells([1, 'cans'], 340, 200, (4 * W) / 7, 44, 4), shade([1, 'cans'], 340, 200, (4 * W) / 7, 44, 1, 1),
    ...fr([1, 'Both'], '3', '5', 220, 275, 24, 'd'), ...fr([1, 'cans'], '4', '7', 454, 275, 24, 'd'),
    ring([2, 'more'], 535, 222, 40, 34, 'y'), write([2, 'more'], 'more than 1 can', 300, 360, 32, 'y'),
  ],
  // One thing not to do: tops + tops, bottoms + bottoms
  (() => {
    const bad: Tok[] = [[[1, 'ADD'], ['3', '5'], 'r'], [[1, 'ADD'], '+', 'r'], [[1, 'ADD'], ['4', '7'], 'r'], [[1, 'gives'], '=', 'r'], [[1, '7/12'], ['7', '12'], 'r']]
    return [
      ...warn([0, 'mix']),
      ...row(bad, 190, 180, 34), write([1, 'less'], 'less than 1', 470, 180, 30, 'r'),
      crossRow([2, 'But'], bad, 190, 180, 3, 4, 34), cross([2, 'But'], 385, 160, 170, 40),
      ...row([[[2, 'each'], ['3', '5'], 'y'], [[2, 'each'], '+', 'y'], [[2, 'each'], ['4', '7'], 'y'], [[2, 'more'], 'is more than 1', 'y']], 300, 310, 34),
    ]
  })(),
]
