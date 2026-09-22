/**
 * g5m3-t1's chalkboards: index = screen index (0 is Screen 1, which has none).
 * Colours: white = the pizzas and their cuts, blue wash = one friend's slices, yellow = the result, coral = the mistake,
 * dim = labels. A pizza is a bar; every slice of a bar is truly the same width.
 */
import type { ChalkMark } from '../../../chalk'
import { write, arrow, cross, person } from '../../../chalk'
import { bar, shade, cut, fr, expr, warn, type At } from '../g4m4/t1'

/** Three pizzas as bars, x..x+w, one under another, `gap` apart. */
const pizzas = (at: At, x: number, y: number, w: number, h: number, gap: number, n = 1): ChalkMark[] =>
  [0, 1, 2].map(i => ({ ...bar(at, x, y + i * gap, w, h, n), quick: i < 2 }))
/** The cuts into 4, down all three pizzas. */
const cuts = (at: At, x: number, y: number, w: number, h: number, gap: number): ChalkMark[] =>
  [0, 1, 2].flatMap(i => [1, 2, 3].map(k => cut(at, x + (w * k) / 4, y + i * gap, y + i * gap + h, 'w')))

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not even one each
  [
    ...pizzas([0, 'pizzas'], 60, 50, 260, 50, 70),
    ...[400, 450, 500, 550].map(x => ({ ...person([0, 'friends'], x, 230, 80), quick: true })),
    write([1, 'whole'], 'a whole pizza each?', 300, 290, 28),
    write([1, 'No'], 'no', 480, 290, 28, 'r'),
    write([1, 'more'], '4 friends, 3 pizzas', 300, 335, 24, 'd'),
    write([2, 'less'], 'each share < 1 pizza', 300, 375, 28, 'y'),
  ],
  // The big idea: sharing 3 among 4 is 3/4
  [
    ...[0, 1, 2].flatMap(i => [bar([0, 'division'], 60, 40 + i * 52, 200, 38, 4), shade([0, 'division'], 60, 40 + i * 52, 200, 38, 4, 1)]),
    ...expr([0, '3'], '3 ÷ 4', 160, 280, 48),
    arrow([0, 'same'], [255, 280], [345, 280]),
    bar([0, '3/4'], 360, 92, 200, 38, 4), shade([0, '3/4'], 360, 92, 200, 38, 4, 3, 0, 'y'),
    ...fr([0, '3/4'], '3/4', 460, 280, 52, 'y'),
  ],
  // Cut every pizza
  [
    ...pizzas([0, 'pizza'], 60, 40, 360, 55, 72),
    ...cuts([0, 'slices'], 60, 40, 360, 55, 72),
    ...[1, 2, 3, 4].map(i => ({ ...person([1, 'friend'], 465 + (i - 1) * 34, 190, 60), quick: true })),
    write([1, 'friend'], '4 friends → 4 slices', 300, 280, 28),
    ...[0, 1, 2].flatMap(i => [0, 1, 2, 3].flatMap(k => fr([2, '1/4'], '1/4', 105 + 90 * k, 67 + 72 * i, 20, 'd').map(m => ({ ...m, quick: true })))),
    ...expr([2, 'pizza'], 'every slice = 1/4 of a pizza', 300, 345, 28, 'y'),
  ],
  // One slice from each pizza
  [
    ...pizzas([0, 'Now'], 60, 40, 360, 55, 72, 4),
    person([0, 'friend'], 520, 200, 110),
    ...[0, 1, 2].map(i => shade([1, 'slice'], 60, 40 + i * 72, 360, 55, 4, 1, 3)),
    ...[0, 1, 2].map(i => ({ ...arrow([1, 'each'], [430, 67 + i * 72], [490, 140]), quick: i < 2 })),
    ...expr([2, '1/4'], '3 slices of 1/4', 300, 320, 38, 'b'),
  ],
  // Put the slices together
  [
    bar([0, 'Push'], 120, 50, 360, 70, 4),
    shade([0, 'together'], 120, 50, 360, 70, 4, 3),
    person([0, 'together'], 545, 125, 80),
    ...fr([1, '3/4'], '3/4', 65, 85, 34, 'y'),
    ...expr([1, '3/4'], '3 slices of 1/4 = 3/4 of a pizza', 300, 190, 28),
    ...expr([2, '4'], '3 ÷ 4 = 3/4', 300, 290, 52, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...expr([1, 'FLIP'], '3 ÷ 4 = 4/3', 150, 190, 40, 'r'),
    cross([1, '4/3'], 60, 140, 180, 100),
    write([2, 'whole'], 'more than 1 pizza each', 150, 275, 22, 'r'),
    ...expr([2, 'top'], '3 ÷ 4 = 3/4', 450, 190, 40, 'y'),
    write([2, 'top'], 'what you share → on top', 450, 275, 22, 'y'),
  ],
]
