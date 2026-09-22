/** g3m5-t6's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, cells, cross, ring } from '../../../chalk'
import { shade, pizza, cuts, slices, inSlice, frac, warn, type At } from './t5to8'

const X = 150, W = 360
const bar = (at: At, y: number, n: number, h = 56): ChalkMark[] => [cells(at, X, y, W, h, n), shade(at, X, y, W, h, n, n)]
const label = (at: At, t: string, y: number): ChalkMark => ({ ...write(at, t, 90, y, 28, 'd'), quick: true })
const cutPizza = (at: At, cx: number, cy: number, r: number, n: number): ChalkMark[] => [pizza(at, cx, cy, r), { ...cuts(at, cx, cy, r, n), quick: true }]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // It is not 4 pizzas
  [
    ...cutPizza([0, 'slices'], 150, 170, 100, 4), slices([0, 'eaten'], 150, 170, 100, 4, 4),
    write([0, 'eaten'], '4 slices eaten', 150, 310, 24, 'd'),
    write([1, 'pizzas'], '4 pizzas?', 445, 90, 32, 'r'),
    ...[360, 420, 480, 540].map(x => ({ ...pizza([1, 'pizzas'], x, 150, 18, 'r'), quick: true })),
    cross([1, 'No'], 340, 65, 210, 115),
    ring([2, 'one'], 150, 170, 116, 116, 'y'),
    write([2, 'one'], '1 pizza', 445, 250, 36, 'y'),
    write([2, '4'], 'cut into 4 slices', 445, 300, 24, 'd'),
  ],
  // The big idea: same top and bottom = every piece = 1 whole
  [
    { ...write([0, 'top'], '4', 110, 145, 48), quick: true },
    ...frac([0, 'bottom'], 4, 4, 110, 175, 48).slice(1),
    ring([0, 'same'], 110, 175, 42, 76, 'y'),
    ...cutPizza([0, 'all'], 340, 175, 110, 4), slices([0, 'pieces'], 340, 175, 110, 4, 4),
    write([0, 'whole'], '= 1 whole', 340, 345, 36, 'y'),
  ],
  // Count every slice
  [
    ...cutPizza([0, 'slices'], 200, 200, 130, 4),
    ...(['1/4', '2/4', '3/4', '4/4'] as const).flatMap((f, i) => {
      const [x, y] = inSlice(200, 200, 172, i, 4)
      return [slices([1, f], 200, 200, 130, 4, 1, i), { ...write([1, f], f, x, y, 30, i === 3 ? 'y' : 'w'), quick: true }]
    }),
    write([2, 'all'], 'all 4', 470, 180, 36, 'y'), write([2, 'slices'], 'of the 4 slices', 470, 230, 26, 'y'),
  ],
  // All the slices make 1 whole
  [
    ...cutPizza([0, 'pizza'], 160, 185, 110, 4), slices([0, 'pizza'], 160, 185, 110, 4, 4),
    write([1, 'nothing'], 'nothing left over', 160, 335, 26, 'd'),
    write([2, '4/4'], '4/4', 450, 120, 44),
    write([2, 'is'], '=', 450, 180, 44, 'y'),
    ring([2, 'whole'], 160, 185, 124, 124, 'y'), write([2, 'whole'], '1 whole', 450, 240, 40, 'y'),
  ],
  // Any whole works
  [
    ...bar([1, 'all'], 60, 6), label([1, '6/6'], '6/6', 88),
    ...bar([2, 'both'], 160, 2), label([2, '2/2'], '2/2', 188),
    write([3, 'whole'], '6/6 = 2/2 = 1 whole', 300, 300, 38, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '8/8'], '8/8 is more than 4/4', 300, 150, 32, 'r'), cross([1, '4/4'], 160, 128, 280, 44),
    ...bar([2, 'all'], 200, 8, 40), label([2, 'all'], '8/8', 220),
    ...bar([2, 'all'], 255, 4, 40), label([2, 'all'], '4/4', 275),
    write([2, 'whole'], '8/8 = 4/4 = 1', 300, 345, 38, 'y'),
  ],
]
