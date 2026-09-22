/** g6m6-t6's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, cross } from '../../../chalk'
import { pt, ray, arc, sq, type At } from '../g4m5/t2'
import { warn } from '../g3m1/t1'
// Colours across these boards: white = the floor and the board, blue = the 55° we know, yellow = the 180° and the
// angle found from it, coral = the mix-up, dim = the protractor. Every angle is drawn at its TRUE size, and the two
// parts on the line always meet at the board: 55° + 125° = 180°.

/** The floor (a straight line through (x, y)) and the board leaning at 55°. */
const floorAndBoard = (at: At, x: number, y: number, len: number): ChalkMark[] =>
  [line(at, [[60, y], [540, y]]), ray(at, x, y, 55, len)]
/** A wedge of the angle from `from` to `to` degrees, washed with colour. */
const wedge = ([beat, at]: At, x: number, y: number, r: number, from: number, to: number, c: ChalkColor): ChalkMark =>
  ({ beat, at, c, wash: true, quick: true, d: `M${x} ${y} L${pt(x, y, from, r).join(' ')} A${r} ${r} 0 0 0 ${pt(x, y, to, r).join(' ')} Z` })
const lbl = (at: At, t: string, x: number, y: number, deg: number, r: number, c: ChalkColor, s = 26): ChalkMark =>
  write(at, t, ...pt(x, y, deg, r), s, c)

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // No protractor needed
  [
    ...floorAndBoard([0], 300, 290, 230), arc([0], 300, 290, 60, 0, 55, 'b'), lbl([0], '55°', 300, 290, 27.5, 100, 'b'),
    { beat: 0, at: 'protractor', c: 'd', w: 2.6, d: 'M50 140 A60 60 0 0 1 170 140 Z M110 140 v-12 M68 98 l8 8 M152 98 l-8 8' },
    arc([0, 'other'], 300, 290, 60, 55, 180), lbl([0, 'other'], '?', 300, 290, 117.5, 95, 'w', 34),
    line([2, 'floor'], [[60, 290], [540, 290]], 'y'),
    write([2, 'straight'], 'straight line', 300, 335, 28, 'y'),
  ],
  // The big idea: side by side on a straight line = 180°
  [
    ...floorAndBoard([0, 'Angles'], 300, 300, 200),
    { ...arc([0, 'side'], 300, 300, 55, 0, 55, 'b'), quick: true }, arc([0, 'side'], 300, 300, 55, 55, 180),
    arc([0, '180°'], 300, 300, 150, 0, 180, 'y', 3.4), write([0, '180°'], '180°', 300, 120, 36, 'y'),
  ],
  // A straight line is a half turn
  [
    arrow([0, 'Face'], [300, 270], [520, 270]),
    arc([0, 'turn'], 300, 270, 110, 0, 180, 'y', 3.4),
    line([0, 'turn'], [[181, 256], [190, 270], [201, 257]], 'y'),
    arrow([0, 'other'], [300, 270], [80, 270]),
    write([1, 'half'], 'half turn', 250, 110, 32, 'y'), write([1, '180°'], '= 180°', 368, 110, 32, 'y'),
    write([2, 'straight'], 'straight line = half turn', 300, 330, 30),
  ],
  // The parts fill the line
  [
    ...floorAndBoard([0], 300, 290, 230),
    { ...arc([0, 'two'], 300, 290, 60, 0, 55, 'b'), quick: true }, arc([0, 'two'], 300, 290, 60, 55, 180),
    lbl([0, '55°'], '55°', 300, 290, 27.5, 100, 'b'), lbl([0, 'want'], '?', 300, 290, 117.5, 95, 'w', 34),
    wedge([1, 'fill'], 300, 290, 60, 0, 55, 'b'), wedge([1, 'fill'], 300, 290, 60, 55, 180, 'd'),
    arc([2, 'together'], 300, 290, 160, 0, 180, 'y', 3.4),
    write([2, '180°'], '55° + ? = 180°', 300, 345, 32, 'y'),
  ],
  // Take away the part you know
  [
    ...floorAndBoard([0], 300, 250, 200), arc([0], 300, 250, 60, 0, 55, 'b'),
    lbl([0, '55°'], '55°', 300, 250, 27.5, 100, 'b'),
    arc([0, 'left'], 300, 250, 60, 55, 180),
    arc([0, '180'], 300, 250, 150, 0, 180, 'y', 3.4), write([0, '180'], '180°', 190, 80, 28, 'y'),
    write([1, 'Take'], '180° − 55°', 240, 330, 34), write([1, '125'], '= 125°', 385, 330, 34, 'y'),
    lbl([2, '125°'], '125°', 300, 250, 117.5, 100, 'y', 28),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'take'], '90° − 55°', 230, 170, 34, 'r'), write([1, '35'], '= 35°', 375, 170, 34, 'r'),
    cross([1, '35'], 140, 148, 290, 44),
    line([2, 'straight'], [[150, 300], [450, 300]]),
    ray([2, 'square'], 300, 300, 90, 100), sq([2, 'square'], 300, 300, 0, 24),
    sq([2, 'two'], 300, 300, 90, 24),
    write([2, '180°'], '90° + 90° = 180°', 300, 360, 32, 'y'),
  ],
]
