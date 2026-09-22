/** g6m6-t3's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, cross } from '../../../chalk'
import { warn, tick } from '../g3m1/t1'
import { poly, type At, type Pt } from '../g3m6/t5'
import { dashed } from '../g4m5/t5'
import { on, fill, height } from './t1'
// Colours: blue = the rectangle piece, white = the roof piece, yellow = the total, coral = the mix-up.

// The wall: a rectangle 6 by 4 with a roof 3 tall on top, its peak over the middle. 24 + 9 = 33.
const HOUSE: Pt[] = [[0, 0], [6, 0], [6, 4], [3, 7], [0, 4]]
const RECT: Pt[] = [[0, 0], [6, 0], [6, 4], [0, 4]]
const ROOF: Pt[] = [[0, 4], [6, 4], [3, 7]]
const BOX: Pt[] = [[0, 0], [6, 0], [6, 7], [0, 7]]
const GAPS: Pt[][] = [[[0, 4], [3, 7], [0, 7]], [[6, 4], [6, 7], [3, 7]]]
const cut = (at: At, x0: number, yb: number, u: number): ChalkMark => { const [a, b] = on([[-0.4, 4], [6.4, 4]], x0, yb, u); return dashed(at, a, b, 'w') }
const pieces = (at: At, x0: number, yb: number, u: number): ChalkMark[] =>
  [{ ...fill(at, on(RECT, x0, yb, u), 'b'), quick: true }, fill(at, on(ROOF, x0, yb, u), 'w')]

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // No one rule fits
  [
    poly([0], on(HOUSE, 80, 330, 36)),
    write([0, 'rectangle'], 'a rectangle?', 450, 110, 30), write([0, 'No'], 'no', 450, 150, 28, 'd'),
    write([1, 'triangle'], 'a triangle?', 450, 215, 30), write([1, 'No'], 'no', 450, 255, 28, 'd'),
    write([2, 'rule'], 'no one rule fits', 450, 330, 30),
  ],
  // The big idea: cut into known pieces, find each, add
  [
    poly([0], on(HOUSE, 192, 290, 36)),
    cut([0, 'Cut'], 192, 290, 36),
    ...pieces([0, 'pieces'], 192, 290, 36),
    { ...write([0, 'area'], '?', 245, 345, 38, 'b'), quick: true }, write([0, 'area'], '?', 355, 345, 38),
    write([0, 'add'], '+', 300, 345, 38),
  ],
  // Cut it
  [
    poly([0], on(HOUSE, 80, 330, 36)),
    cut([0, 'across'], 80, 330, 36),
    fill([1, 'rectangle'], on(RECT, 80, 330, 36), 'b'), write([1, 'rectangle'], 'rectangle', 450, 260, 32, 'b'),
    fill([1, 'triangle'], on(ROOF, 80, 330, 36), 'w'), write([1, 'triangle'], 'triangle', 450, 140, 32),
  ],
  // Find each piece
  [
    poly([0], on(HOUSE, 75, 320, 34)), { ...cut([0], 75, 320, 34), quick: true }, ...pieces([0], 75, 320, 34),
    write([0, '6'], '6 m', 177, 350, 24, 'b'), write([0, '4'], '4 m', 45, 252, 24, 'b'),
    write([0, '24'], '6 × 4 = 24', 440, 255, 32, 'b'),
    ...height([1, '3'], ...on([[3, 7], [3, 4], [4, 4]], 75, 320, 34) as [Pt, Pt, Pt], 'w'), write([1, '3'], '3 m', 208, 150, 22),
    write([1, '9'], '1/2 × 6 × 3 = 9', 440, 150, 30),
  ],
  // Add the pieces
  [
    poly([0, 'pieces'], on(HOUSE, 216, 225, 28)), { ...cut([0, 'pieces'], 216, 225, 28), quick: true }, ...pieces([0, 'pieces'], 216, 225, 28),
    { ...write([0, 'together'], '24', 300, 169, 28, 'b'), quick: true }, write([0, 'together'], '9', 300, 90, 28),
    write([1, '24'], '24 +', 225, 280, 40, 'b'), write([1, '9'], '9', 295, 280, 40), write([1, '33'], '= 33', 365, 280, 40, 'y'),
    write([1, 'square'], '33 square meters', 300, 345, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    poly([1, 'draw'], on(HOUSE, 60, 300, 20)), poly([1, 'box'], on(BOX, 60, 300, 20), 'r'), write([1, 'box'], '7 m', 212, 230, 24, 'r'),
    write([1, '42'], '6 × 7 = 42', 130, 340, 30, 'r'),
    { ...fill([1, 'corners'], on(GAPS[0], 60, 300, 20), 'r'), quick: true }, fill([1, 'corners'], on(GAPS[1], 60, 300, 20), 'r'),
    cross([1, 'too'], 55, 320, 150, 40),
    poly([2, 'piece'], on(HOUSE, 390, 300, 20), 'y'), { ...cut([2, 'piece'], 390, 300, 20), quick: true },
    write([2, '33'], '24 + 9 = 33', 450, 330, 30, 'y'), tick([2, '33'], 436, 368),
  ],
]
