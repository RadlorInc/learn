/** g4m4-t7's chalkboards: index = screen index (0 is Screen 1, which has none). Every pizza the same size. */
import type { ChalkMark } from '../../../chalk'
import { write } from '../../../chalk'
import { row, crossRow, cutPizza, slices, pizza, warn, type Tok } from './t6'
import { cuts, inSlice } from '../g3m5/t5to8'

const R = 75, CY = 140, CX = [110, 300, 490]
/** Whole pizza `i` (all 4 slices on it). */
const whole = (at: [number, string?], i: number, cy = CY): ChalkMark[] => cutPizza(at, CX[i], cy, R, 4, 4)
const count = (at: [number, string?], i: number, cy = CY): ChalkMark[] =>
  [0, 1, 2, 3].map(k => { const [x, y] = inSlice(CX[i], cy, R * 0.55, k, 4); return { ...write(at, String(k + 1), x, y, 24, 'd'), quick: true } })

const wrong: Tok[] = [[[1, 'ADD'], '2', 'r'], [[1, 'ADD'], ['3', '4'], 'r'], [[1, '3'], '=', 'r'], [[1, '3'], ['5', '4'], 'r']]

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Pizzas, not slices
  [
    pizza([0, 'pizzas'], CX[0], CY, R), slices([0, 'pizzas'], CX[0], CY, R, 4, 4),
    pizza([0, 'pizzas'], CX[1], CY, R), slices([0, 'pizzas'], CX[1], CY, R, 4, 4),
    ...cutPizza([0, '3/4'], CX[2], CY, R, 4, 3),
    ...row([[[0, 'say'], '2'], [[0, 'say'], ['3', '4']]], 200, 320, 40),
    write([1, 'slices'], '= ? slices', 335, 320, 34),
    write([1, 'pizzas'], '2 pizzas', 205, 245, 24, 'd'),
    { ...cuts([2, 'inside'], CX[0], CY, R, 4, 'y'), quick: true }, cuts([2, 'inside'], CX[1], CY, R, 4, 'y'),
  ],
  // The big idea: count the pieces in the wholes, add the extra pieces
  [
    pizza([0, 'pieces'], 170, 150, 100), slices([0, 'pieces'], 170, 150, 100, 4, 4),
    { ...cuts([0, 'pieces'], 170, 150, 100, 4), quick: true },
    ...[0, 1, 2, 3].map(k => { const [x, y] = inSlice(170, 150, 55, k, 4); return { ...write([0, 'whole'], String(k + 1), x, y, 28, 'y'), quick: true } }),
    write([0, 'whole'], 'pieces in a whole', 170, 300, 24, 'd'),
    write([0, 'add'], '+', 300, 150, 44),
    ...cutPizza([0, 'extra'], 430, 150, 100, 4, 3),
    write([0, 'extra'], 'extra pieces', 430, 300, 24, 'b'),
  ],
  // Count the whole pizzas
  [
    ...whole([0, 'pizza'], 0), ...count([0, 'slices'], 0),
    ...row([[[0, '4/4'], ['4', '4']]], CX[0], 290, 36),
    ...whole([1, 'Two'], 1), ...count([1, 'Two'], 1),
    ...row([[[1, 'Two'], ['4', '4']]], CX[1], 290, 36),
    write([1, '8'], '4 + 4 = 8 slices', 300, 370, 30, 'y'),
  ],
  // Add the extra slices
  [
    ...whole([0, 'Now'], 0), ...whole([0, 'Now'], 1),
    write([0, 'Now'], '8 slices', 205, 245, 26, 'd'),
    ...cutPizza([0, 'part'], CX[2], CY, R, 4, 3, [0, '3']),
    write([0, 'slices'], '3 more', CX[2], 245, 26, 'b'),
    ...row([[[1, '8'], '8'], [[1, '3'], '+ 3'], [[1, '11'], '= 11 slices', 'y']], 300, 330, 38),
  ],
  // Write it both ways
  [
    ...cutPizza([0, 'slice'], 90, 90, 60, 4, 0), slices([0, 'slice'], 90, 90, 60, 4, 1),
    ...row([[[0, 'slice'], '1 slice'], [[0, 'fourth'], '='], [[0, 'fourth'], ['1', '4']]], 330, 90, 34),
    ...row([[[0, '11'], '11 slices'], [[0, '11/4'], '='], [[0, '11/4'], ['11', '4']]], 330, 200, 34),
    write([1, 'Same'], 'same pizza', 300, 262, 24, 'd'),
    ...row([[[2, '2'], '2', 'y'], [[2, '2'], ['3', '4'], 'y'], [[2, '11/4'], '=', 'y'], [[2, '11/4'], ['11', '4'], 'y']], 300, 330, 38),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...row(wrong, 300, 180, 36), crossRow([1, '3'], wrong, 300, 180, 2, 3, 36),
    write([2, 'whole'], '1 whole = 4 slices', 300, 260, 26, 'd'),
    ...row([[[2, 'and'], '4 + 4 + 3'], [[2, "That's"], '=', 'y'], [[2, '11/4'], ['11', '4'], 'y']], 300, 330, 36),
  ],
]
