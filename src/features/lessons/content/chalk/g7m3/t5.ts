/** g7m3-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: white = the boxes and the working, blue = what is done to both sides, yellow = the result, coral = the mix-up. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, span, ring, cross } from '../../../chalk'
import { q, warn } from '../g5m1/t17'

type At = [beat: number, at?: string]

/** A curved arrow under the writing, from the number outside (x1) up to a part inside (x2). */
const under = ([beat, at]: At, x1: number, x2: number, y: number, depth: number): ChalkMark =>
  ({ beat, at, c: 'b', d: `M${x1} ${y} Q${(x1 + x2) / 2} ${y + depth * 2} ${x2} ${y} M${x2 - 9} ${y + 11} L${x2} ${y} L${x2 + 5} ${y + 13}` })

/** A gift box: an x part and a 2 part, 140 wide, 60 high, from (x0, y). */
const giftBox = (at: At, x0: number, y: number, c: ChalkColor = 'w'): ChalkMark[] => [
  q(box(at, x0, y, 140, 60, c)), q(line(at, [[x0 + 95, y], [x0 + 95, y + 60]], c)),
  q(write(at, 'x', x0 + 47, y + 30, 34, c)), write(at, '2', x0 + 117, y + 30, 30, 'b'),
]
const BX = [80, 230, 380]
const boxes3 = (at: At, y: number): ChalkMark[] => BX.flatMap(x => giftBox(at, x, y))

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // The 2 is in every box
  [
    write([0, 'Can'], '3(x + 2) = 21', 300, 50, 40),
    write([0, 'away'], '21 − 2 ?', 300, 115, 34, 'r'),
    cross([1, 'quite.'], 235, 108, 130, 16),
    ...boxes3([2, 'box'], 180),
    ...BX.map((x, i) => ({ ...ring([2, '2s'], x + 117, 210, 22, 26, 'y'), quick: i < 2 })),
    span([2, '21.'], 80, 520, 275), write([2, '21.'], '21', 300, 315, 34),
  ],
  // The big idea: the parentheses are one group; ÷ 3 on both sides
  [
    q(write([0, 'parentheses'], '3', 150, 70, 48)), q(write([0, 'parentheses'], '(x + 2)', 262, 70, 48)), write([0, 'parentheses'], '= 21', 430, 70, 48),
    ring([0, 'group,'], 262, 70, 100, 38, 'y'), write([0, 'group,'], 'one group', 262, 140, 26, 'y'),
    write([0, 'divide'], '÷ 3', 230, 200, 36, 'b'), write([0, 'sides'], '÷ 3', 440, 200, 36, 'b'),
    line([0, 'outside'], [[140, 230], [460, 230]], 'd', 2.5),
    write([0, 'left.'], 'x + 2', 262, 285, 44, 'y'), write([0, 'left.'], '= ?', 400, 285, 44, 'y'),
  ],
  // Divide by 3
  [
    ...boxes3([0, 'box'], 40),
    box([0, 'thing.'], 72, 32, 156, 76, 'y'),
    span([1, 'make'], 80, 520, 135), write([1, '21,'], '21', 300, 170, 32),
    write([1, 'is'], '21 ÷ 3 =', 270, 240, 38), write([1, '7.'], '7', 380, 240, 40, 'y'),
    write([2, 'means'], 'x + 2 = 7', 300, 320, 44, 'y'),
  ],
  // Take the 2 away
  [
    q(box([0, 'box'], 150, 30, 300, 60)), q(line([0, 'box'], [[375, 30], [375, 90]])),
    write([0, 'chocolates'], 'x', 262, 60, 36), write([0, 'mints,'], '2', 412, 60, 32, 'b'),
    span([0, '7.'], 150, 450, 112), write([0, '7.'], '7', 300, 145, 32),
    q(write([1, 'Take'], 'x + 2', 230, 205, 40)), q(write([1, 'Take'], '=', 310, 205, 40)), write([1, 'Take'], '7', 370, 205, 40),
    cross([1, 'off'], 395, 38, 34, 44),
    write([1, 'both'], '− 2', 230, 250, 32, 'b'), write([1, 'sides.'], '− 2', 370, 250, 32, 'b'),
    line([1, 'sides.'], [[170, 275], [420, 275]], 'd', 2.5),
    q(write([1, 'so'], 'x', 230, 312, 40, 'y')), q(write([1, 'so'], '=', 310, 312, 40, 'y')), write([1, 'so'], '5', 370, 312, 40, 'y'),
    write([2, 'chocolates.'], '5 chocolates in each box', 300, 368, 28, 'y'),
  ],
  // Or multiply out first
  [
    q(write([0, 'another'], '3', 175, 50, 40)), q(write([0, 'another'], '(x + 2)', 255, 50, 40)), write([0, 'another'], '= 21', 380, 50, 40),
    under([1, 'x'], 177, 209, 78, 26), under([1, '2'], 177, 284, 78, 48),
    write([1, '3x,'], '3x', 200, 150, 40), write([1, '6.'], '+ 6', 265, 150, 40),
    write([2, '21.'], '= 21', 380, 150, 40),
    write([2, 'Take'], '− 6', 520, 150, 30, 'd'),
    write([2, '15.'], '3x = 15', 300, 225, 40),
    write([3, 'Then'], '÷ 3', 520, 225, 30, 'd'),
    write([3, 'answer,'], 'x = 5', 300, 305, 44, 'y'), ring([3, '5.'], 300, 305, 80, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ONLY'], '3(x + 2)', 180, 180, 38), write([1, 'x.'], '→ 3x + 2', 380, 180, 38, 'r'),
    cross([2, 'multiplies'], 300, 172, 160, 16),
    write([2, 'well,'], '3(x + 2)', 180, 270, 38), write([2, '6,'], '→ 3x + 6', 380, 270, 38, 'y'),
  ],
]
