/** g3m3-t1's chalkboards (×0): index = screen index (0 is Screen 1, which has none). Also the plates t2 draws with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross } from '../../../chalk'
import { dots, warn, tick, type At } from '../g3m1/t1'

type Pt = [number, number]
/** Plates are flat rings, one quick mark each. */
export const plates = (at: At, xs: number[], y: number, rx: number, ry: number, c: ChalkColor = 'd'): ChalkMark[] =>
  xs.map(x => ({ ...ring(at, x, y, rx, ry, c), quick: true }))
/** Short words or numbers written one after another at each x (quick). */
export const each = (at: At, t: string | string[], xs: number[], y: number, s: number, c: ChalkColor = 'w'): ChalkMark[] =>
  xs.map((x, i) => ({ ...write(at, typeof t === 'string' ? t : t[i], x, y, s, c), quick: true }))

const PX = [90, 230, 370, 510]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Lots of plates
  [
    ...plates([0, 'plates'], PX, 120, 58, 26),
    write([1, 'cookies'], 'some cookies?', 300, 230, 32),
    ...each([2, 'empty'], '0', PX, 120, 30, 'y'),
    write([2, 'empty'], 'every plate is empty', 300, 320, 30, 'y'),
  ],
  // The big idea: empty groups add up to nothing
  [
    ...plates([0, 'Empty'], PX, 90, 58, 26), ...each([0, 'groups'], '0', PX, 90, 28, 'y'),
    write([0, 'add'], '0 + 0 + 0 + 0', 250, 175, 34), write([0, 'nothing'], '= 0', 405, 175, 34, 'y'),
    ...each([0, 'number'], ['4 × 0', '10 × 0', '100 × 0'], [130, 300, 470], 270, 30),
    ...each([0, 'is'], '= 0', [130, 300, 470], 325, 30, 'y'),
  ],
  // Count by 0s
  [
    ...plates([0, 'plate'], PX, 160, 58, 26),
    write([1, 'adds'], '+0', PX[0], 90, 30, 'b'), write([1, 'next'], '+0', PX[1], 90, 30, 'b'),
    write([1, 'and'], '+0', PX[2], 90, 30, 'b'), write([1, 'last'], '+0', PX[3], 90, 30, 'b'),
    ...each([2, '0'], '0', PX, 228, 30),
    write([3, 'Still'], 'still 0', 300, 315, 44, 'y'), line([3, 'Still'], [[220, 350], [380, 350]], 'y', 2.5),
  ],
  // 4 groups of 0
  [
    ...plates([0, 'groups'], [120, 240, 360, 480], 70, 46, 21),
    write([0, 'of'], '4 groups of 0', 240, 150, 30), write([0, 'make'], 'make 0', 430, 150, 30, 'y'),
    write([1, 'cookie'], 'not one cookie', 300, 215, 26, 'd'),
    write([2, 'write'], '4 × 0', 250, 305, 50), write([2, '0'], '= 0', 365, 305, 50, 'y'),
  ],
  // No plates at all
  [
    write([0, 'plates'], '0 plates', 150, 120, 34),
    dots([0, 'cookies'], [[340, 120], [385, 120], [430, 120], [475, 120]] as Pt[], 13),
    write([0, 'each'], '4 on each', 407, 170, 22, 'd'),
    cross([1, 'no'], 310, 95, 195, 50),
    write([1, 'put'], 'nowhere to put them', 300, 235, 26, 'd'),
    write([2, 'So'], '0 × 4', 250, 320, 50), write([2, 'too'], '= 0', 365, 320, 50, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '4'], '4 × 0 = 4', 300, 170, 40, 'r'), cross([1, 'NOT'], 205, 145, 190, 50),
    ...plates([2, 'Empty'], [150, 250, 350, 450], 255, 40, 18, 'y'),
    write([2, '0'], '4 × 0 = 0', 280, 335, 40, 'y'), tick([2, 'are'], 405, 333),
  ],
]
