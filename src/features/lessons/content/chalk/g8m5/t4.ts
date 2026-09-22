/** g8m5-t4's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: white = the shapes and the working, blue = the split / halving, yellow = each result and the total,
 *  dim = labels, coral = the mix-up. Shape helpers are t3's. */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross } from '../../../chalk'
import { warn } from '../g8m3/t1'
import { q, ballM, canM, coneM, domeM, vspan } from './t3'

type At = [beat: number, at?: string]
/** The ice-cream cone: a cone, point down, with half a ball on its rim. */
const iceCream = (at: At, cx: number, rim: number, r: number, h: number): ChalkMark[] =>
  [q(coneM(at, cx, rim, rim + h, r)), domeM(at, cx, rim, r)]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two shapes in one
  [
    write([0, 'rule'], 'one rule?', 420, 90, 30),
    ...iceCream([0, 'whole'], 160, 200, 75, 100),
    write([0, 'No.'], 'no', 540, 90, 30, 'r'),
    line([1, 'split'], [[60, 200], [260, 200]], 'b'),
    write([2, 'cone.'], 'a cone', 430, 262, 32),
    arrow([2, 'cone.'], [375, 258], [215, 250]),
    write([3, 'half'], 'half a ball', 430, 150, 32),
    arrow([3, 'ball.'], [338, 150], [240, 165]),
  ],
  // The big idea: name each shape, its own rule, add the pieces
  [
    q(domeM([0, 'shape,'], 120, 210, 60)), line([0, 'shape,'], [[60, 210], [180, 210]]),
    coneM([0, 'shape,'], 320, 150, 260, 55),
    write([0, 'rule,'], 'ball ÷ 2', 120, 300, 26, 'd'),
    write([0, 'rule,'], 'cone rule', 320, 300, 26, 'd'),
    write([0, 'add'], '+', 220, 190, 40, 'y'),
    write([0, 'pieces.'], '= in all', 480, 200, 36, 'y'),
  ],
  // The cone part
  [
    coneM([0, 'cone'], 150, 110, 230, 90),
    line([0, 'cone'], [[150, 110], [240, 110]], 'b'),
    write([0, 'cone'], '3 cm', 195, 70, 24, 'b'),
    q(vspan([0, 'first.'], 272, 110, 230, 'd')), write([0, 'first.'], '4 cm', 314, 170, 24, 'd'),
    write([1, 'third'], '1/3 of the can', 460, 110, 30, 'y'),
    canM([1, 'can'], 150, 110, 230, 90, 'd'),
    write([2, '1/3'], '1/3 × 3.14 × 3 × 3 × 4', 260, 310, 28),
    write([2, '37.68.'], '= 37.68', 490, 310, 30, 'y'),
  ],
  // The half ball
  [
    domeM([0, 'scoop.'], 130, 150, 80),
    { beat: 0, at: 'ball', c: 'd', d: 'M50 150 A80 80 0 0 0 210 150 M50 150 A80 17.6 0 0 0 210 150' },
    write([1, '4/3'], '4/3 × 3.14 × 3 × 3 × 3', 250, 290, 28),
    write([1, '113.04.'], '= 113.04', 490, 290, 30),
    { beat: 2, at: 'half', c: 'y', wash: true, d: 'M50 150 A80 80 0 0 1 210 150 Z' },
    write([2, 'halve'], 'half = whole ÷ 2', 410, 130, 28, 'b'),
    write([3, '113.04'], '113.04 ÷ 2', 250, 355, 30),
    write([3, '56.52.'], '= 56.52', 460, 355, 30, 'y'),
  ],
  // Add the pieces
  [
    ...iceCream([0, 'pieces,'], 130, 170, 65, 100),
    write([1, 'cone,'], 'cone', 330, 110, 26, 'd'), write([1, 'cone,'], '37.68', 480, 110, 32),
    write([1, 'scoop.'], 'scoop', 330, 170, 26, 'd'), write([1, 'scoop.'], '56.52', 480, 170, 32),
    write([2, 'Add'], '+', 410, 170, 30),
    line([2, 'them.'], [[390, 200], [560, 200]]),
    write([2, '94.2.'], '94.2', 480, 235, 34, 'y'),
    write([3, 'all.'], '94.2 cubic cm in all', 300, 340, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'whole'], '37.68 + 113.04 = 150.72', 270, 165, 30, 'r'),
    cross([1, 'top.'], 460, 145, 40, 40),
    write([2, 'Halve'], '113.04 ÷ 2 = 56.52', 300, 245, 28, 'b'),
    write([2, 'add.'], '37.68 + 56.52 = 94.2', 300, 320, 32, 'y'),
  ],
]
