/** g8m3-t3's chalkboards: a week row over a height row, then the points on a small graph.
 *  Blue is the x step, yellow the same step / the straight line, coral a step that changes or the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, line, cross, ring, cells } from '../../../chalk'
import { warn } from './t1'

type At = [number, string?]
type Pt = [number, number]
const X0 = 140, CW = 80
const cx = (i: number) => X0 + CW * i + CW / 2
/** One table row of 4 cells at y (50 tall) with its label and values. */
const row = (at: At, y: number, label: string, vals: string[], quickVals = true): ChalkMark[] => [
  cells(at, X0, y, 4 * CW, 50, 4, 'd'), write(at, label, X0 - 60, y + 25, 22, 'd'),
  ...vals.map((v, i) => ({ ...write(at, v, cx(i), y + 25, 30), quick: quickVals })),
]
/** Small axes with their corner at (x, y). */
const axes = (at: At, x: number, y: number, w: number, h: number): ChalkMark => line(at, [[x, y - h], [x, y], [x + w, y]], 'd')
const dot = (at: At, [x, y]: Pt, c: 'w' | 'y' | 'b' = 'w'): ChalkMark => ({ ...ring(at, x, y, 5, 5, c), quick: true })
const through = (at: At, pts: Pt[], c: 'y' | 'b' | 'r'): ChalkMark[] => pts.slice(1).map((p, i) => line(at, [pts[i], p], c))

// Plant A (1, 3, 5, 7) and Plant B (0, 1, 4, 9) on the graph under the table
const A4: Pt[] = [1, 3, 5, 7].map((h, i) => [190 + 90 * i, 375 - 18 * h])
const B4: Pt[] = [0, 1, 4, 9].map((h, i) => [190 + 90 * i, 375 - 15 * h])
// the two small graphs side by side on Screen 6
const A6: Pt[] = [1, 3, 5, 7].map((h, i) => [95 + 55 * i, 320 - 25 * h])
const B6: Pt[] = [0, 1, 4, 9].map((h, i) => [365 + 55 * i, 320 - 20 * h])
const between = (i: number) => X0 + CW * (i + 1)

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Both keep growing
  [
    ...row([0, 'both'], 40, 'week', ['0', '1', '2', '3']), ...row([0, 'both'], 90, 'A', ['1', '3', '5', '7']),
    ...row([0, 'both'], 140, 'B', ['0', '1', '4', '9']),
    line([1, 'taller'], [[495, 128], [495, 96], [485, 106], [495, 96], [505, 106]], 'b'),
    line([1, 'B'], [[495, 178], [495, 146], [485, 156], [495, 146], [505, 156]], 'b'),
    write([2, 'up'], 'going up?', 230, 255, 30, 'b'), write([2, 'No'], 'no', 360, 255, 30, 'r'),
    write([3, 'much'], 'how much each week?', 300, 335, 34, 'y'),
  ],
  // The big idea: equal x steps, the same y step, a straight line
  [
    ...[0, 1, 2].map(i => line([0, 'x'], [[130 + 120 * i, 330 - 60 * i], [250 + 120 * i, 330 - 60 * i]], 'b')),
    ...[0, 1, 2].map(i => write([0, 'equal'], '+1', 190 + 120 * i, 352 - 60 * i, 22, 'b')),
    ...[0, 1, 2].map(i => line([0, 'y'], [[250 + 120 * i, 330 - 60 * i], [250 + 120 * i, 270 - 60 * i]], 'y')),
    ...[0, 1, 2].map(i => write([0, 'same'], '+2', 227 + 120 * i, 308 - 60 * i, 22, 'y')),
    ...[0, 1, 2, 3].map(i => dot([0, 'points'], [130 + 120 * i, 330 - 60 * i])),
    line([0, 'straight'], [[100, 345], [530, 130]], 'y'),
  ],
  // Plant A: the same step
  [
    ...row([0, 'Plant'], 60, 'week', ['0', '1', '2', '3']),
    ...[0, 1, 2].map(i => write([0, 'up'], '+1', between(i), 42, 22, 'b')),
    ...row([1, 'height'], 110, 'A', ['1', '3', '5', '7']),
    ...[0, 1, 2].map(i => write([2, 'up'], '+2', between(i), 182, 22, 'y')),
    write([2, 'same'], 'same step', 530, 135, 22, 'y'),
    axes([3, 'Plot'], 160, 385, 330, 180), ...A4.map(p => dot([3, 'points'], p)),
    line([3, 'straight'], [[172, 364], [480, 241]], 'y'),
  ],
  // Plant B: the steps change
  [
    ...row([0, 'Plant'], 60, 'week', ['0', '1', '2', '3']), ...row([0, 'goes'], 110, 'B', ['0', '1', '4', '9']),
    write([1, 'No'], 'no', 525, 135, 30, 'r'),
    write([2, '1'], '+1', between(0), 182, 22, 'r'), write([2, '3'], '+3', between(1), 182, 22, 'r'),
    write([2, '5'], '+5', between(2), 182, 22, 'r'),
    axes([2, 'points'], 160, 385, 330, 180), ...B4.map(p => dot([2, 'points'], p)),
    ...through([2, 'bend'], B4, 'b'), write([2, 'upward'], 'bends', 530, 300, 26, 'b'),
  ],
  // Give it a name
  [
    axes([0, 'points'], 70, 340, 220, 230), ...A6.map(p => dot([0, 'points'], p)),
    line([0, 'straight'], [[80, 309], [275, 131]], 'y'), write([0, 'Plant'], 'Plant A', 180, 370, 24, 'd'),
    write([2, 'linear'], 'linear', 180, 70, 32, 'y'),
    axes([2, 'B'], 340, 340, 220, 230), ...B6.map(p => dot([2, 'B'], p)), ...through([2, 'B'], B6, 'b'),
    write([2, 'B'], 'Plant B', 450, 370, 24, 'd'), write([2, 'not'], 'not linear', 450, 70, 32, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'compare'], 'up 2, up 4, so not linear', 300, 140, 30, 'r'), cross([1, 'before'], 286, 118, 206, 44),
    write([1, 'CHECK'], 'x: 0, 1, 3', 170, 215, 30, 'b'), write([1, 'steps'], 'up 1, then up 2', 420, 215, 28, 'b'),
    write([2, 'twice'], 'y: 0, 2, 6', 170, 280, 30), write([2, 'twice'], 'up 2, then up 4', 420, 280, 28),
    write([2, 'straight'], '2 for each 1, still linear', 300, 350, 32, 'y'),
  ],
]
