/** g8m2-t2's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The two points are a small table (Point 1 | Point 2, rows x and y) at the top; the working goes under it.
 *  Yellow is the rise and the answer, blue the run, coral the mix-up, dim labels. */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring, cells } from '../../../chalk'
import { table, col, warn } from '../g7m1/t1'
import { q } from './t1'

type At = [number, string?]
const PTS = [['', 'Point 1', 'Point 2'], ['x', '2', '6'], ['y', '3', '11']]
const TX = 150, TY = 45, NW = 60, W = 120
const pts = (at: At) => table(at, TX, TY, PTS, NW, W).map(q)
const c1 = col(TX, 1, NW, W), c2 = col(TX, 2, NW, W)   // 270, 390
const XR = TY + 44, YR = TY + 88                          // the x row and the y row

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // No squares to count
  [
    cells([0, 'counted'], 40, 60, 200, 40, 5, 'd'), cells([0, 'counted'], 40, 100, 200, 40, 5, 'd'), cells([0, 'counted'], 40, 140, 200, 40, 5, 'd'),
    arrow([0, 'across'], [60, 170], [180, 170], 'b'), arrow([0, 'up'], [180, 170], [180, 80], 'y'),
    ...table([1, 'Here'], 300, 90, PTS, NW, 110).map(q),
    cross([1, 'no'], 30, 50, 220, 140),
    write([1, 'count'], 'count what?', 150, 250, 30, 'r'),
    write([2, 'numbers'], 'the numbers tell us', 300, 330, 32, 'y'),
  ],
  // The big idea: Point 2 − Point 1, the y's over the x's
  [
    ...pts([0]),
    ring([0, 'y-values'], (c1 + c2) / 2, YR, 110, 22, 'y'),
    write([0, 'y-values'], 'y: Point 2 − Point 1', 300, 215, 28, 'y'),
    write([0, 'x-values'], 'x: Point 2 − Point 1', 300, 295, 28, 'b'),
    write([0, 'same'], 'same order', 300, 355, 24, 'd'),
    line([0, 'divide'], [[150, 255], [450, 255]]),
  ],
  // The rise is a subtraction
  [
    ...pts([0]),
    ring([0, '3'], c1, YR, 26, 22), ring([0, '11'], c2, YR, 30, 22),
    ring([1, 'Point'], c2, TY, 58, 22, 'b'),
    write([1, '11'], '11 − 3 =', 280, 225, 38), write([1, '8'], '8', 390, 225, 38, 'y'),
    arrow([2, 'up'], [470, 250], [470, 195], 'y'),
    write([2, 'rise'], 'rise = 8', 300, 310, 36, 'y'),
  ],
  // The run is a subtraction too
  [
    ...pts([0]), q(write([0], 'rise = 8', 490, 200, 26, 'y')),
    ring([0, '2'], c1, XR, 26, 22), ring([0, '6'], c2, XR, 26, 22),
    ring([1, 'Point'], c2, TY, 58, 22, 'b'),
    write([1, '6'], '6 − 2 =', 250, 250, 38), write([1, '4'], '4', 350, 250, 38, 'b'),
    write([2, 'run'], 'run = 4', 250, 330, 36, 'b'),
  ],
  // Divide
  [
    write([0, 'divide'], '(11 − 3) ÷ (6 − 2)', 300, 40, 28, 'd'),
    write([0, 'rise'], '8', 230, 105, 44, 'y'), line([0, 'by'], [[190, 140], [270, 140]]), write([0, 'run'], '4', 230, 180, 44, 'b'),
    write([0, '2'], '= 2', 330, 140, 44, 'y'),
    write([1, 'climbs'], 'up 2 for every 1 across', 300, 250, 30, 'y'),
    write([2, 'negative'], 'y goes down → negative', 250, 330, 26, 'b'),
    arrow([2, 'downhill'], [450, 300], [540, 370], 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '11'], '11 − 3', 190, 150, 32, 'r'), line([1, 'top'], [[130, 180], [250, 180]], 'r'),
    write([1, '2'], '2 − 6', 190, 210, 32, 'r'), write([1, 'gives'], '= −2', 310, 180, 32, 'r'),
    cross([1, 'gives'], 70, 162, 36, 36),
    write([2, 'climbs'], 'but it climbs', 190, 290, 24, 'y'),
    write([2, 'Point'], '11 − 3', 440, 150, 32, 'y'), line([2, 'Point'], [[380, 180], [500, 180]], 'y'),
    write([2, 'bottom'], '6 − 2', 440, 210, 32, 'y'), write([2, 'bottom'], '= 2', 545, 180, 32, 'y'),
    write([2, 'bottom'], 'Point 2 first, top and bottom', 300, 350, 26, 'y'),
  ],
]
