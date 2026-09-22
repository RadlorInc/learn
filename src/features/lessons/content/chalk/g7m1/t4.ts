/** g7m1-t4's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  One hour is a bar cut into 4 quarters; the walk so far is the first quarter. Yellow is the distance in one hour,
 *  coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, cells, wash, span, cross } from '../../../chalk'
import { warn } from './t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const BX = 100, BW = 400, BH = 70
const mid = (k: number) => BX + (BW / 4) * k + BW / 8
/** The hour bar at height y, cut into quarters. */
const hour = (at: At, y: number): ChalkMark[] => [cells(at, BX, y, BW, BH, 4)]
/** The first quarter shaded, 1/2 mi inside it. */
const walked = (at: At, y: number): ChalkMark[] => [wash(at, BX, y, BW / 4, BH, 'y'), q(write(at, '1/2 mi', mid(0), y + BH / 2, 26))]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Fractions look strange
  [
    write([0, 'divide'], 'miles ÷ hours', 300, 70, 32, 'd'),
    write([1, '1/2'], '1/2 ÷ 1/4', 300, 160, 48),
    write([1, 'Strange'], '?', 445, 160, 44, 'b'),
    write([2, 'more'], 'more than 1/2', 180, 280, 30, 'b'),
    write([2, 'less'], 'or less?', 440, 280, 30, 'b'),
  ],
  // The big idea: how far in one whole hour
  [
    ...hour([0, 'time'], 150),
    ...walked([0, 'distance'], 150),
    write([0, 'distance'], '1/4 h', mid(0), 245, 22, 'd'),
    span([0, 'whole'], BX, BX + BW, 110),
    write([0, 'whole'], '1 whole hour: how far?', 300, 70, 30, 'y'),
  ],
  // Fill the hour
  [
    ...hour([0, 'bar'], 110),
    span([0, 'hour'], BX, BX + BW, 75), write([0, 'hour'], '1 hour', 300, 40, 26, 'd'),
    ...[0, 1, 2, 3].map(k => q(write([0, '4'], '1/4 h', mid(k), 205, 22, 'd'))),
    ...walked([1, 'fills'], 110),
    write([2, 'Yes'], 'a whole hour = 4 pieces', 300, 300, 30),
  ],
  // Add up the pieces
  [
    ...hour([0, 'Keep'], 90), ...walked([0, 'Keep'], 90),
    ...[1, 2, 3].map(k => q(write([0, 'adds'], '1/2 mi', mid(k), 125, 26))),
    write([1, '1/2'], '1/2 + 1/2 + 1/2 + 1/2', 270, 240, 34), write([1, '2'], '= 2', 490, 240, 34, 'y'),
    span([2, 'miles'], BX, BX + BW, 185, 'y'),
    write([2, 'hour'], '2 miles in 1 hour', 300, 330, 34, 'y'),
  ],
  // The same as dividing
  [
    write([0, '1/4'], '÷ 1/4', 200, 80, 36), write([0, 'same'], 'is the same as', 330, 80, 22, 'd'), write([0, '4'], '× 4', 460, 80, 36),
    write([1, '1/2'], '1/2 ÷ 1/4', 300, 170, 40),
    write([1, '4'], '= 1/2 × 4', 318, 230, 40),
    write([1, '2'], '= 2', 250, 290, 40, 'y'),
    write([2, 'miles'], '2 miles per hour', 300, 360, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'TIME'], 'time on top', 300, 125, 22, 'r'),
    write([1, '1/4'], '1/4 ÷ 1/2 = 1/2', 300, 170, 36, 'r'),
    write([1, 'hours'], 'hours for each mile', 300, 215, 22, 'r'), cross([1, 'hours'], 170, 112, 260, 118),
    write([2, 'top'], '1/2 ÷ 1/4 = 2', 300, 290, 40, 'y'),
    write([2, 'miles'], 'miles for each hour', 300, 340, 24, 'y'),
  ],
]
