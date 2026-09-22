/** g5m4-t8's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cells, cross, ring, ticks } from '../../../chalk'

type At = [number, string?]
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
const q = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))
// The ribbon: a tape x 60–540 cut into 3 equal pieces, centres 140 · 300 · 460.
const PIECES = [140, 300, 460]

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // It does not share evenly
  [
    write([0, 'Try'], '7.2 m', 300, 40, 26, 'd'), cells([0, 'Try'], 60, 65, 480, 50, 3),
    ...q(PIECES.map(x => write([0, '2'], '2 m', x, 90, 28))),
    write([0, '6'], '3 × 2 = 6', 300, 175, 32), write([0, 'left'], '1 m left', 220, 245, 30, 'b'),
    write([1, '0.2'], '+ 0.2 m', 380, 245, 30, 'b'), write([1, 'rest'], '?', 300, 325, 48, 'y'),
  ],
  // The big idea: count in tenths, share them, put the point back
  [
    box([0, 'Count'], 60, 60, 480, 45), ticks([0, 'tenths'], 60, 105, 480, 36), write([0, 'tenths'], 'count in tenths', 300, 145, 24, 'd'),
    cells([0, 'share'], 60, 190, 480, 45, 3, 'b'), write([0, 'equally'], 'share them', 300, 260, 26, 'b'),
    write([0, 'point'], '.', 300, 318, 60, 'y'), ring([0, 'point'], 300, 325, 26, 26, 'y'), write([0, 'back'], 'put the point back', 300, 370, 26, 'y'),
  ],
  // Count in tenths
  [
    cells([0, 'meter'], 60, 45, 300, 40, 10), write([0, 'meter'], '1 m', 30, 65, 22, 'd'),
    write([0, '10'], '= 10 tenths', 470, 65, 28),
    write([0, '7'], '7 m', 170, 150, 32), write([0, '70'], '= 70 tenths', 400, 150, 32),
    write([1, '2'], '0.2 m', 170, 205, 32), write([1, '2'], '= 2 tenths', 400, 205, 32),
    line([1, 'ribbon'], [[110, 240], [520, 240]], 'd', 2),
    write([1, '72'], '7.2 m', 170, 285, 34, 'y'), write([1, '72'], '= 72 tenths', 400, 285, 34, 'y'),
  ],
  // Share the tenths
  [
    write([0, '72'], '72 tenths', 300, 45, 26, 'd'), cells([0, 'shares'], 60, 70, 480, 55, 3),
    write([0, '24'], '72 ÷ 3 = 24', 300, 200, 36),
    ...q(PIECES.map(x => write([1, 'piece'], '24 tenths', x, 97, 24, 'b'))),
  ],
  // Put the point back
  [
    write([0, '24'], '24 tenths', 140, 60, 28, 'b'), write([0, 'wholes'], '= 2 wholes', 305, 60, 28), write([0, '4'], '+ 4 tenths', 470, 60, 28),
    write([1, '2.4'], '2.4', 300, 145, 56, 'y'), ring([1, '2.4'], 298, 158, 14, 14, 'y'),
    cells([1, 'piece'], 60, 215, 480, 50, 3), ...q(PIECES.map(x => write([1, 'piece'], '2.4 m', x, 240, 28, 'y'))),
    write([1, 'meters'], '7.2 ÷ 3 = 2.4', 300, 330, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '24'], '7.2 ÷ 3', 230, 170, 36), write([1, '24'], '= 24', 365, 170, 36),
    write([1, 'tenths'], '24 tenths, not meters', 300, 230, 26, 'b'), cross([1, 'meters'], 325, 148, 85, 44),
    write([2, '2.4'], '7.2 ÷ 3 = 2.4', 300, 320, 38, 'y'),
  ],
]
