/** g3m4-t3's chalkboards: index = screen index (0 is Screen 1, which has none). The 3 by 5 piece is blue, the 3 by 2 piece white, the cut and the total yellow. */
import type { ChalkMark } from '../../../chalk'
import { write, line, wash, cross } from '../../../chalk'
import { tiles, warn, tick, type At } from './t1'

// The rug: 3 rows of 7 tiles. `u` px, top-left (x, y); the cut is after 5 tiles.
const rug = (at: At, x: number, y: number, u: number, c: 'w' | 'y' = 'w') => tiles(at, x, y, 3, 7, u, c)
const cut = (at: At, x: number, y: number, u: number) => line(at, [[x + 5 * u, y - 14], [x + 5 * u, y + 3 * u + 14]], 'y', 6)
const pieces = (a: At, b: At, x: number, y: number, u: number): ChalkMark[] =>
  [wash(a, x, y, 5 * u, 3 * u, 'b'), wash(b, x + 5 * u, y, 2 * u, 3 * u, 'w')]
const U = 56, X = 104, Y = 70

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // A fact you may not know
  [
    rug([0], X, Y, U),
    write([0, '3'], '3', 80, 154, 26, 'd'), write([0, '7'], '7', 300, 45, 26, 'd'),
    write([0, '7'], '3 × 7', 250, 300, 40),
    write([1, 'know'], '= ?', 350, 300, 40, 'd'),
    write([2, '5'], '3 × 5', 200, 360, 34, 'b'), write([2, '2'], '3 × 2', 400, 360, 34),
  ],
  // The big idea
  [
    rug([0], X, Y, U),
    cut([0, 'Cut'], X, Y, U),
    ...pieces([0, 'two'], [0, 'smaller'], X, Y, U),
    { ...write([0, 'each'], '3 × 5', 244, 305, 36, 'b'), quick: true }, write([0, 'each'], '3 × 2', 440, 305, 36),
    write([0, 'add'], '+', 342, 305, 36),
  ],
  // Cut the rug
  [
    rug([0], X, Y, U),
    cut([0, 'cut'], X, Y, U), write([0, '5'], '5', 244, 40, 26, 'd'),
    ...pieces([1, 'two'], [1, 'rugs'], X, Y, U),
    write([2, '5'], '3 by 5', 244, 305, 34, 'b'),
    { ...write([2, '2'], '2', 440, 40, 26, 'd'), quick: true }, write([2, '2'], '3 by 2', 440, 305, 34),
  ],
  // Find each piece
  [
    rug([0], X, Y, U), cut([0], X, Y, U), ...pieces([0], [0], X, Y, U),
    write([1, '5'], '3 × 5', 200, 300, 36, 'b'), write([1, '15'], '= 15', 290, 300, 36, 'b'),
    write([2, '2'], '3 × 2', 200, 355, 36), write([2, '6'], '= 6', 281, 355, 36),
  ],
  // Add the pieces
  [
    rug([0], 160, 30, 40), cut([0], 160, 30, 40), ...pieces([0, 'together'], [0, 'together'], 160, 30, 40),
    write([1, '15'], '15 +', 220, 220, 40, 'b'), write([1, '6'], '6', 290, 220, 40), write([1, '21'], '= 21', 360, 220, 40, 'y'),
    write([1, 'So'], '3 × 7 = 21', 300, 285, 40, 'y'),
    write([2, 'units'], '21 square units', 300, 350, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    rug([1, 'STOP'], 40, 150, 26), wash([1, 'piece'], 40, 150, 130, 78, 'r'),
    write([2, '15'], '3 × 5 = 15', 131, 280, 32, 'r'),
    cross([2, 'part'], 32, 142, 198, 94), write([2, 'part'], 'only part', 131, 325, 24, 'r'),
    rug([2, 'Add'], 378, 150, 26), ...pieces([2, 'Add'], [2, 'other'], 378, 150, 26),
    write([2, '21'], '15 + 6 = 21', 455, 280, 32, 'y'), tick([2, '21'], 552, 280),
  ],
]
