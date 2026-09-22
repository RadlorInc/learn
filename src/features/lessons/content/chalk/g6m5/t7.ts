/** g6m5-t7's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: white = the scale and the working, blue = the "− 4" taken off, yellow = the result (x = 5, level), coral = the mistake. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross } from '../../../chalk'
import { q, warn } from '../g5m1/t17'

type At = [beat: number, at?: string]

/** A balance scale: beam at y, half-length w, a plate on a post at each end. Labels are written on separately. */
const scale = (at: At, cx: number, y: number, w = 170, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat: at[0], at: at[1], c, d: `M${cx - w} ${y} H${cx + w} M${cx} ${y} L${cx - 22} ${y + 45} L${cx + 22} ${y + 45} Z`
    + ` M${cx - w} ${y} V${y - 12} M${cx - w - 55} ${y - 12} H${cx - w + 55} M${cx + w} ${y} V${y - 12} M${cx + w - 55} ${y - 12} H${cx + w + 55}` })
/** A small scale tipped left-up (the left side got lighter), for "the scale tips". */
const tipped = (at: At, cx: number, y: number, c: ChalkColor): ChalkMark =>
  ({ beat: at[0], at: at[1], c, d: `M${cx - 70} ${y - 22} L${cx + 70} ${y + 22} M${cx} ${y} L${cx - 16} ${y + 34} L${cx + 16} ${y + 34} Z` })
const level = (at: At, cx: number, y: number, c: ChalkColor): ChalkMark =>
  ({ beat: at[0], at: at[1], c, d: `M${cx - 70} ${y} H${cx + 70} M${cx} ${y} L${cx - 16} ${y + 34} L${cx + 16} ${y + 34} Z` })
const check = (at: At, x: number, y: number): ChalkMark => line(at, [[x - 18, y], [x - 4, y + 16], [x + 22, y - 18]], 'y', 5)

/** "x + 4 = 9" in pieces with the = at 300, so the rows below line up under it. */
const E = { x: 190, plus: 225, four: 260, eq: 300, nine: 350 }
const xPlus4is9 = (at: At, y: number): ChalkMark[] => [
  q(write(at, 'x', E.x, y, 38)), q(write(at, '+', E.plus, y, 38)), q(write(at, '4', E.four, y, 38)),
  q(write(at, '=', E.eq, y, 38)), write(at, '9', E.nine, y, 38),
]

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Guessing is slow
  [
    q(scale([0], 300, 110)), q(write([0], 'x + 4', 130, 72, 34)), write([0], '9', 470, 72, 34),
    write([0, '7,'], '3 + 4 = 7', 200, 210, 34), write([0, 'light'], 'too light', 430, 210, 28, 'd'),
    write([1, '10,'], '6 + 4 = 10', 200, 265, 34), write([1, 'heavy'], 'too heavy', 430, 265, 28, 'd'),
    write([2, 'guessing?'], 'no guessing?', 300, 345, 34, 'y'),
  ],
  // The big idea: same off both sides, it stays level
  [
    q(scale([0], 300, 200)), q(write([0], 'x', 110, 160, 38)), q(write([0], '+ 4', 168, 160, 38)), write([0], '9', 470, 160, 38),
    ring([0, 'alone,'], 110, 160, 22, 26, 'y'),
    write([0, 'amount'], '− 4', 168, 105, 34, 'b'), write([0, 'both'], '− 4', 470, 105, 34, 'b'),
    write([0, 'level.'], 'it stays level', 300, 320, 34, 'y'),
  ],
  // Take 4 off both sides
  [
    q(scale([0], 300, 100)), q(write([0], 'x + 4', 130, 62, 34)), write([0], '9', 470, 62, 34),
    ...xPlus4is9([0, 'way'], 195),
    write([0, 'left.'], '− 4', E.four - 12, 245, 34, 'b'),
    tipped([1, 'tips.'], 130, 320, 'r'), write([1, 'tips.'], 'tips', 130, 375, 24, 'r'),
    write([2, 'right'], '− 4', E.nine - 12, 245, 34, 'b'),
    level([2, 'level.'], 470, 320, 'y'), write([2, 'level.'], 'level', 470, 375, 24, 'y'),
  ],
  // See what is left: the working on the left, the scale on the right
  [
    q(write([0, 'look'], 'x', 70, 60, 38)), q(write([0, 'look'], '+', 105, 60, 38)), q(write([0, 'look'], '4', 140, 60, 38)),
    q(write([0, 'look'], '=', 180, 60, 38)), q(write([0, 'look'], '9', 230, 60, 38)),
    q(write([0, 'look'], '− 4', 128, 115, 34, 'b')), q(write([0, 'look'], '− 4', 218, 115, 34, 'b')),
    line([0, 'side.'], [[45, 145], [275, 145]], 'd', 2.5),
    line([1, 'nothing,'], [[108, 130], [158, 42]], 'd', 2.5),
    write([1, 'alone.'], 'x', 70, 190, 38),
    write([2, '5.'], '5', 230, 190, 38, 'y'),
    write([3, 'So'], '=', 180, 190, 38), ring([3, '5.'], 150, 190, 100, 30, 'y'),
    scale([3, '5.'], 420, 300, 90), write([3, '5.'], 'x', 330, 262, 36), write([3, '5.'], '5', 510, 262, 36, 'y'),
  ],
  // Check it
  [
    ...xPlus4is9([0, 'Does'], 60),
    write([0, 'back'], '5', E.x, 150, 38, 'y'), q(line([0, 'x'], [[E.x, 122], [E.x, 88]], 'y')),
    q(write([1, '4'], '+', E.plus, 150, 38)), write([1, '4'], '4', E.four, 150, 38),
    q(write([1, '9,'], '=', E.eq, 150, 38)), write([1, '9,'], '9', E.nine, 150, 38),
    q(write([1, 'side'], '9', 250, 225, 38)), q(write([1, 'side'], '=', E.eq, 225, 38)), write([1, 'side'], '9', E.nine, 225, 38),
    check([2, 'match,'], 420, 225),
    write([2, 'marbles.'], '5 marbles in the bag', 300, 330, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    q(write([1, 'add'], 'x', 150, 175, 40, 'r')), q(write([1, 'add'], '=', 190, 175, 40, 'r')), write([1, 'add'], '9 + 4', 265, 175, 40, 'r'),
    write([2, '13.'], '= 13', 375, 175, 40, 'r'), cross([2, '13.'], 215, 150, 200, 50),
    q(write([3, 'Take'], 'x', 150, 280, 40, 'y')), q(write([3, 'Take'], '=', 190, 280, 40, 'y')), write([3, 'Take'], '9 − 4', 265, 280, 40, 'y'),
    write([3, '5.'], '= 5', 365, 280, 40, 'y'),
  ],
]
