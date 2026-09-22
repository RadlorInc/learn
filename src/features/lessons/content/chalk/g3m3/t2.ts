/** g3m3-t2's chalkboards (×1): index = screen index (0 is Screen 1, which has none). A cookie is a small circle. */
import type { ChalkMark } from '../../../chalk'
import { write, line, ring, arrow, cross } from '../../../chalk'
import { dots, warn, tick } from '../g3m1/t1'
import { plates, each } from './t1'

// Six plates, 90 apart, one cookie on each.
const PX = [75, 165, 255, 345, 435, 525]
const on = (y: number): [number, number][] => PX.map(x => [x, y])

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Do we have to count?
  [
    ...plates([0, 'count'], PX, 110, 38, 18), dots([0, 'cookies'], on(110), 9),
    ...each([0, 'one'], ['1', '2', '3', '4', '5', '6'], PX, 160, 22, 'd'),
    write([1, 'without'], 'without counting?', 300, 250, 32),
    ring([2, 'plates'], 300, 110, 272, 40, 'y'),
    write([2, 'plates'], 'look at the plates', 300, 330, 30, 'y'),
  ],
  // The big idea: 1 in each, so the total is the number of groups
  [
    ...plates([0, 'group'], PX, 90, 38, 18), dots([0, 'group'], on(90), 9),
    ...each([0, '1'], '1', PX, 145, 26, 'b'),
    write([0, 'total'], '6 cookies', 195, 230, 34, 'y'), write([0, 'groups'], '= 6 plates', 385, 230, 34, 'y'),
    write([0, 'times'], '6 × 1 = 6', 300, 320, 42),
  ],
  // Count by 1s
  [
    ...plates([0, 'plate'], PX, 160, 38, 18), dots([0, 'plate'], on(160), 9),
    ...['1', '2', '3', '4', '5', '6'].map((n, i) => write([1, n], n, PX[i], 95, 34, 'y')),
    write([2, 'plates'], 'counting cookies = counting plates', 300, 250, 24, 'd'),
    write([3, '6'], '6 cookies', 300, 325, 42, 'y'), line([3, '6'], [[210, 360], [390, 360]], 'y', 2.5),
  ],
  // 6 groups of 1
  [
    ...plates([0, 'plates'], PX, 70, 38, 18), dots([0, 'plates'], on(70), 9),
    write([0, 'of'], '6 plates of 1', 240, 150, 30), write([0, 'make'], 'make 6', 430, 150, 30, 'y'),
    write([1, 'write'], '6 × 1', 250, 245, 50), write([1, '1'], '= 6', 365, 245, 50, 'y'),
    arrow([2, 'stays'], [205, 285], [400, 285], 'y'), write([2, 'stays'], 'the 6 stays 6', 305, 330, 28, 'y'),
  ],
  // Turn it around
  [
    ring([0, 'plate'], 300, 120, 160, 46, 'd'), dots([0, 'cookies'], [195, 237, 279, 321, 363, 405].map(x => [x, 120] as [number, number]), 13),
    write([1, 'Still'], 'still 6 cookies', 300, 225, 34, 'y'),
    write([2, 'So'], '1 × 6', 250, 320, 50), write([2, 'too'], '= 6', 365, 320, 50, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'Times'], '6 × 1', 150, 160, 40), write([1, 'ADD'], '6 + 1', 360, 160, 40, 'r'),
    write([2, '7'], '= 7', 460, 160, 40, 'r'), cross([2, '7'], 305, 135, 190, 50),
    dots([2, 'extra'], [[190, 225]], 12, 'r'), write([2, 'extra'], '1 extra cookie', 320, 225, 26, 'r'),
    ...plates([2, 'plates'], PX, 290, 36, 16, 'y'), dots([2, 'plates'], on(290), 8, 'y'),
    write([2, 'is'], '6 × 1 = 6', 280, 360, 34, 'y'), tick([2, 'is'], 390, 358),
  ],
]
