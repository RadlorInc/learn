/** g4m5-t8's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, hop, cross, ring } from '../../../chalk'
import { warn, tick } from '../g3m1/t1'
import { poly, rectPts, type Pt } from '../g3m6/t5'
import { dashed } from './t5'
// Colours across these boards: blue = the half that flips over, yellow = a fold that works, coral = the mix-up.

/** The paper house (4 wide, walls 3, roof point 5 up), u px a unit, bottom-left corner at (x, y). */
const house = (x: number, y: number, u: number): Pt[] => [[x, y], [x + 4 * u, y], [x + 4 * u, y - 3 * u], [x + 2 * u, y - 5 * u], [x, y - 3 * u]]
const H2 = house(60, 320, 50), H4 = house(80, 340, 50), H5 = house(80, 340, 50)
/** Screen 5: the top half folded down across the middle (y = 2.5 units), roof point landing on the bottom edge. */
const FLIP5: Pt[] = [[80, 215], [80, 240], [180, 340], [280, 240], [280, 215]]
// Screen 7: a 6 × 3 rectangle folded corner to corner — the bottom-left half flips over the diagonal and its corner lands at (2.4, −1.8).
const R7 = rectPts(345, 215, 6, 3, 36), FLIP7: Pt[] = [[345, 215], [561, 323], [345 + 2.4 * 36, 215 - 1.8 * 36]]

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // Looking is not enough
  [
    poly([0, 'fold'], H2), dashed([0, 'fold'], [160, 55], [160, 335]),
    write([0, 'works'], 'does it work?', 440, 120, 32, 'y'),
    hop([1, 'fold'], 110, 210, 190, 'b'),
    write([1, 'check'], 'check where', 440, 210, 28), write([1, 'part'], 'every part lands', 440, 250, 28),
  ],
  // The big idea: fold, and the halves land on each other
  [
    poly([0, 'fold'], H2), dashed([0, 'fold'], [160, 55], [160, 335]),
    { ...line([0, 'halves'], [[160, 320], [60, 320], [60, 170], [160, 70]], 'b'), w: 4.5 },
    hop([0, 'land'], 110, 210, 190, 'b'),
    write([0, 'exactly'], 'the halves match', 440, 180, 32, 'y'), tick([0, 'other'], 425, 240),
  ],
  // Fold it
  [
    poly([0, 'Fold'], H4), dashed([0, 'dashed'], [180, 75], [180, 355]), hop([0, 'line'], 130, 230, 220, 'b'),
    { ...line([1, 'Wall'], [[80, 340], [80, 190]], 'b'), w: 4.5 }, { ...line([1, 'wall'], [[280, 340], [280, 190]], 'b'), w: 4.5 },
    { ...line([1, 'roof'], [[80, 190], [180, 90]], 'b'), w: 4.5 }, { ...line([1, 'roof'], [[280, 190], [180, 90]], 'b'), w: 4.5 },
    write([2, 'Nothing'], 'nothing sticks out', 450, 170, 28),
    tick([2, 'works'], 380, 240), write([2, 'works'], 'it works', 480, 240, 34, 'y'),
  ],
  // Across the middle
  [
    poly([0, 'line'], H5), dashed([0, 'across'], [60, 215], [300, 215]),
    { ...line([1, 'Fold'], FLIP5, 'b'), w: 3.4 }, arrow([1, 'down'], [330, 130], [330, 290], 'b'),
    ring([2, 'point'], 180, 340, 13, 13, 'b'), ring([2, 'corners'], 80, 340, 13, 13, 'w'), ring([2, 'corners'], 280, 340, 13, 13, 'w'),
    write([3, 'match'], 'no match', 470, 170, 30),
    write([3, 'work'], 'does not work', 470, 240, 32, 'y'),
  ],
  // Count every fold line
  [
    write([0, 'more'], 'more than 1 fold line?', 300, 50, 28, 'd'),
    poly([1, 'rectangle'], rectPts(165, 110, 6, 3, 45)),
    dashed([2, 'Down'], [300, 95], [300, 260]), tick([2, 'works'], 312, 92),
    dashed([2, 'across'], [150, 177.5], [450, 177.5]), tick([2, 'across'], 462, 177),
    write([3, '2'], '2 fold lines', 300, 330, 38, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    poly([1, 'rectangle'], rectPts(45, 190, 6, 3, 30)), dashed([1, 'corner'], [45, 190], [225, 280]),
    cross([1, 'NOT'], 110, 210, 50, 50),
    poly([2, 'Fold'], [R7[0], R7[1], R7[2]], 'd'), poly([2, 'Fold'], FLIP7, 'b'),
    ring([2, 'stick'], FLIP7[2][0], FLIP7[2][1], 14, 14, 'r'), ring([2, 'stick'], R7[1][0], R7[1][1], 14, 14, 'r'),
    write([2, 'out'], 'fold it to check', 300, 365, 30, 'y'),
  ],
]
