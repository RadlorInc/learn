/** g3m5-t7's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, cells, arrow, ring, cross } from '../../../chalk'
import { shade, pizza, cuts, slices, inSlice, frac, warn, type At } from './t5to8'

// Ana's pizza on the left, Ben's on the right, the same size.
const A = 160, B = 440
const cutPizza = (at: At, cx: number, cy: number, r = 100): ChalkMark[] => [pizza(at, cx, cy, r), { ...cuts(at, cx, cy, r, 8), quick: true }]
const X = 150, W = 360
const bar = (at: At, y: number, k: number): ChalkMark[] => [cells(at, X, y, W, 56, 8), shade(at, X, y, W, 56, 8, k)]

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Both end in 8
  [
    write([0, 'Ana'], 'Ana', A, 55, 28, 'd'), ...frac([0, '3/8'], 3, 8, A, 150, 56),
    write([0, 'Ben'], 'Ben', B, 55, 28, 'd'), ...frac([0, '5/8'], 5, 8, B, 150, 56),
    ring([1, '8'], A, 185, 30, 30, 'y'), ring([1, '8'], B, 185, 30, 30, 'y'),
    write([1, 'more'], 'who ate more?', 300, 300, 34),
  ],
  // The big idea
  [
    ...bar([0, 'same'], 70, 0), ...frac([0, 'same'], 3, 8, 90, 98, 30),
    ...bar([0, 'same'], 170, 0), ...frac([0, 'same'], 5, 8, 90, 198, 30),
    shade([0, 'more'], X, 70, W, 56, 8, 3), shade([0, 'more'], X, 170, W, 56, 8, 5),
    ring([0, 'top'], 90, 80, 20, 20, 'y'), ring([0, 'top'], 90, 180, 20, 20, 'y'),
    write([0, 'numbers'], '5 pieces are more than 3', 300, 310, 30, 'y'),
  ],
  // Same-size slices
  [
    pizza([0, 'pizzas'], A, 180, 100), pizza([0, 'pizzas'], B, 180, 100),
    write([0, 'pizzas'], 'Ana', A, 310, 24, 'd'), write([0, 'pizzas'], 'Ben', B, 310, 24, 'd'),
    { ...cuts([1, '8'], A, 180, 100, 8), quick: true }, cuts([1, '8'], B, 180, 100, 8),
    slices([2, 'same'], A, 180, 100, 8, 1, 0, 'y', true), slices([2, 'same'], B, 180, 100, 8, 1, 0, 'y', true),
    write([2, 'size'], 'same size', 300, 360, 30, 'y'),
  ],
  // Count the slices
  [
    ...cutPizza([0, 'count'], A, 170), ...cutPizza([0, 'count'], B, 170),
    write([0, 'count'], 'Ana', A, 300, 24, 'd'), write([0, 'count'], 'Ben', B, 300, 24, 'd'),
    ...[0, 1, 2].flatMap(i => { const [x, y] = inSlice(A, 170, 66, i, 8); return [slices([1, '3'], A, 170, 100, 8, 1, i), { ...write([1, '3'], String(i + 1), x, y, 22), quick: true }] }),
    ...[0, 1, 2, 3, 4].flatMap(i => { const [x, y] = inSlice(B, 170, 66, i, 8); return [slices([1, '5'], B, 170, 100, 8, 1, i), { ...write([1, '5'], String(i + 1), x, y, 22), quick: true }] }),
    ring([2, 'Ben'], B, 170, 110, 110, 'y'), write([2, 'Ben'], 'Ben ate more', 300, 358, 32, 'y'),
  ],
  // Write it
  [
    ...frac([0, '5/8'], 5, 8, 200, 150, 60), { ...write([0, '5/8'], '>', 300, 150, 64, 'y'), quick: true },
    ...frac([0, '3/8'], 3, 8, 400, 150, 60),
    write([1, 'open'], 'open side', 300, 290, 26, 'd'), arrow([1, 'open'], [292, 268], [282, 196], 'd'),
    ring([1, 'bigger'], 200, 150, 50, 90, 'y'), write([1, 'bigger'], 'bigger', 200, 262, 26, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...cutPizza([1, 'count'], A, 235, 90), ...[0, 1, 2].map(i => slices([1, 'count'], A, 235, 90, 8, 1, i)),
    slices([1, 'LEFT'], A, 235, 90, 8, 5, 3, 'r', true),
    write([1, 'plate'], 'Ana', A, 350, 24, 'd'),
    write([2, 'left'], '5 left', 330, 175, 30, 'r'), cross([2, 'but'], 290, 155, 80, 40),
    write([2, '3'], 'Ana ate 3/8', 470, 230, 30, 'y'),
    write([2, 'each'], 'Ben ate 5/8', 470, 280, 30, 'y'),
  ],
]
