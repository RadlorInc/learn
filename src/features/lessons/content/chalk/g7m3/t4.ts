/** g7m3-t4's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A level scale is a beam on a post; blue is what is done to both sides, yellow what it leaves. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, ring } from '../../../chalk'
import { warn } from './t1'

type At = [number, string?]
/** A level scale: the beam at y, a post and a foot under it. */
const scale = (at: At, y: number): ChalkMark => line(at, [[130, y], [470, y], [300, y], [300, y + 50], [260, y + 50], [340, y + 50]], 'd')

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two things are stuck to x
  [
    write([0, 'x'], 'x', 300, 60, 44, 'y'),
    arrow([1, 'multiplied'], [300, 88], [300, 122], 'd'), write([1, 'multiplied'], '× 2', 370, 105, 26, 'b'), write([1, '2'], '2x', 300, 150, 40),
    arrow([1, 'added'], [300, 178], [300, 212], 'd'), write([1, 'added'], '+ 3', 370, 195, 26, 'b'), write([1, 'on'], '2x + 3', 300, 240, 40),
    write([2, 'step'], 'one step?', 180, 330, 30, 'r'), write([2, 'two'], 'two steps', 420, 330, 30, 'y'),
  ],
  // The big idea: undo + 3, then undo × 2, on both sides
  [
    write([0, 'Undo'], '2x + 3 = 11', 300, 60, 40),
    write([0, 'first'], '1st', 100, 140, 24, 'd'), write([0, 'adding'], '− 3', 235, 140, 30, 'b'),
    write([0, 'then'], '2nd', 100, 210, 24, 'd'), write([0, 'multiplying'], '÷ 2', 235, 210, 30, 'b'),
    write([0, 'both'], '− 3', 395, 140, 30, 'b'), write([0, 'sides'], '÷ 2', 395, 210, 30, 'b'),
    scale([0, 'each'], 300),
  ],
  // Take 3 off both sides
  [
    write([0, 'The'], '2x + 3 = 11', 300, 60, 40), ring([0, 'off'], 280, 60, 36, 26, 'b'),
    write([1, 'Take'], '− 3', 245, 115, 28, 'b'), write([1, 'both'], '− 3', 390, 115, 28, 'b'),
    write([2, '11'], '11 − 3', 270, 175, 30), write([2, '8'], '= 8', 355, 175, 30, 'y'),
    scale([1, 'level'], 265),
    write([2, 'now'], '2x', 200, 240, 36, 'y'), write([2, '2x'], '8', 400, 240, 36, 'y'),
    write([2, '2x'], '2x = 8', 300, 355, 34, 'y'),
  ],
  // Divide both sides by 2
  [
    write([0, '2'], '2x = 8', 300, 60, 40), ring([0, '2'], 251, 60, 14, 25, 'b'),
    box([1, 'bags'], 150, 110, 70, 60), write([1, 'bags'], 'x', 185, 140, 30), box([1, 'bags'], 240, 110, 70, 60), write([1, 'bags'], 'x', 275, 140, 30),
    write([1, '8'], '= 8', 370, 140, 34), ring([1, 'bag'], 185, 140, 44, 40, 'y'),
    write([1, 'is'], '8 ÷ 2', 260, 225, 32), write([1, '4'], '= 4', 360, 225, 32, 'y'),
    write([2, 'Divide'], '2x ÷ 2 = 8 ÷ 2', 300, 290, 30, 'b'), write([2, '4'], 'x = 4', 300, 350, 40, 'y'),
  ],
  // Check it
  [
    write([0, 'check'], '2x + 3 = 11', 300, 60, 36),
    write([1, '4'], 'x = 4', 300, 120, 30, 'b'),
    write([1, '2'], '2 × 4 + 3', 189, 195, 34), write([1, '8'], '= 8 + 3', 342, 195, 34), write([1, '11'], '= 11', 453, 195, 34, 'y'),
    write([2, 'match'], '11 = 11', 300, 265, 36, 'y'), write([2, 'marbles'], '4 marbles in each bag', 300, 340, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'JUST'], '2x + 3 = 11', 300, 160, 36), write([1, '2x'], '÷ 2', 219, 205, 26, 'r'),
    cross([2, 'too'], 195, 190, 50, 30),
    write([2, 'away'], 'take away 3: 2x = 8', 300, 270, 30, 'y'), write([2, 'divide'], 'then divide: x = 4', 300, 335, 30, 'y'),
  ],
]
