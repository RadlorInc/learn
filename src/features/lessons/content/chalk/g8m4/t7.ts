/** g8m4-t7's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The 3-4-5 triangle with a square on every side: the two small squares blue, the big one on the long side yellow. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, wash } from '../../../chalk'
import { warn } from '../g7m3/t1'
import { squares, q } from './helpers-t6-t9'

// Right angle at (116, 249), 32 px a block: the left side (3) runs up, the bottom side (4) runs right. Writing at x ≈ 470.
const F = squares(116, 249, 32, 3, 4)
/** The triangle and its three squares, already up (the start of a screen that continues the last one). */
const figure = (at: [number, string?]): ChalkMark[] => [
  q(F.triangle(at)), q(F.corner(at)), q(F.square(at, 'left')), q(F.square(at, 'bottom')), q(F.square(at, 'long')),
]

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding is too long: the park, the walk around the corner, and the path across
  [
    box([0], 60, 110, 240, 180, 'd'),
    write([0, 'add'], '4', 180, 325, 28), write([0, 'add'], '3', 330, 200, 28),
    write([0, '7'], '4 + 3 = 7', 470, 130, 32),
    arrow([1, 'walk'], [60, 290], [300, 290], 'r'), arrow([1, 'walk'], [300, 290], [300, 110], 'r'),
    write([1, 'long'], 'the long way', 470, 200, 28, 'r'),
    line([2, 'across'], [[60, 290], [300, 110]], 'y'),
    write([2, 'shorter'], 'shorter than 7', 470, 280, 28, 'y'),
  ],
  // The big idea: blue square + blue square = the yellow square
  [
    F.triangle([0, 'right']), F.corner([0, 'right']),
    F.fill([0, 'short'], 'left', 'b'), F.fill([0, 'short'], 'bottom', 'b'),
    F.square([0, 'short'], 'left', 'b'), F.square([0, 'short'], 'bottom', 'b'),
    wash([0, 'add'], 390, 100, 40, 40, 'b'), box([0, 'add'], 390, 100, 40, 40, 'b'), write([0, 'add'], '+', 460, 120, 34),
    wash([0, 'add'], 490, 95, 50, 50, 'b'), box([0, 'add'], 490, 95, 50, 50, 'b'),
    F.fill([0, 'long'], 'long', 'y'), F.square([0, 'long'], 'long', 'y'),
    write([0, 'get'], '=', 420, 230, 34), wash([0, 'long'], 460, 195, 70, 70, 'y'), box([0, 'long'], 460, 195, 70, 70, 'y'),
  ],
  // Build a square on each side
  [
    F.triangle([0]), F.corner([0]), write([0, 'Watch'], '3', 132, 205, 22, 'd'), write([0, 'Watch'], '4', 185, 234, 22, 'd'),
    F.square([0, 'square'], 'left'), F.square([0, 'square'], 'bottom'), F.square([0, 'square'], 'long'),
    F.grid([1, 'holds'], 'left'), F.label([1, '9'], 'left', '9', 40), write([1, '9'], '3 × 3 = 9', 470, 120, 30),
    F.grid([2, 'holds'], 'bottom'), F.label([2, '16'], 'bottom', '16', 40), write([2, '16'], '4 × 4 = 16', 470, 185, 30),
  ],
  // The small squares fill the big one
  [
    ...figure([0]), q(F.label([0], 'left', '9', 40, 'w')), q(F.label([0], 'bottom', '16', 40, 'w')),
    arrow([0, 'tip'], [60, 165], [150, 115], 'b'), arrow([0, 'tip'], [246, 292], [272, 196], 'b'),
    write([1, '25'], '9 + 16 = 25', 470, 140, 32),
    F.grid([2, 'holds'], 'long'), F.label([2, '25'], 'long', '25', 40),
    write([2, 'Not'], 'not one over', 470, 230, 26, 'd'), write([2, 'short'], 'not one short', 470, 275, 26, 'd'),
  ],
  // Undo the square
  [
    ...figure([0]), q(F.label([0], 'left', '9', 40, 'w')), q(F.label([0], 'bottom', '16', 40, 'w')), F.label([0, '25'], 'long', '25', 40),
    write([0, 'Which'], '? × ? = 25', 470, 120, 32),
    write([1, '5'], '5 × 5 = 25', 470, 190, 32, 'y'),
    write([2, 'blocks'], 'the path = 5 blocks', 450, 280, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'SIDES'], '3 + 4 = 7', 300, 150, 36),
    cross([2, 'walk'], 215, 128, 170, 44),
    write([2, 'squares'], '9 + 16 = 25', 300, 235, 36, 'y'), write([2, '5'], 'so 5 blocks', 300, 310, 34, 'y'),
  ],
]
