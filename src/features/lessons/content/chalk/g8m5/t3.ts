/** g8m5-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: white = the shapes and the working, blue = the radius / the water / the can around it, yellow = the result,
 *  dim = labels, coral = the mix-up. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cells, wash, arrow, cross } from '../../../chalk'
import { warn } from '../g8m3/t1'

type At = [beat: number, at?: string]
export const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })

const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0`
/** A ball: its outline and the front half of its middle line. */
export const ballM = ([beat, at]: At, cx: number, cy: number, r: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `${ell(cx, cy, r, r)} M${cx - r} ${cy} A${r} ${r * 0.22} 0 0 0 ${cx + r} ${cy}` })
/** A can standing up: the top rim, the two sides, the front of the bottom rim. */
export const canM = ([beat, at]: At, cx: number, top: number, bot: number, rx: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `${ell(cx, top, rx, rx * 0.22)} M${cx - rx} ${top} V${bot} A${rx} ${rx * 0.22} 0 0 0 ${cx + rx} ${bot} V${top}` })
/** An ice-cream cone, point down: the rim at y `rim`, the point at y `tip`. */
export const coneM = ([beat, at]: At, cx: number, rim: number, tip: number, rx: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `${ell(cx, rim, rx, rx * 0.22)} M${cx - rx} ${rim} L${cx} ${tip} L${cx + rx} ${rim}` })
/** Half a ball sitting on the line y `base`. */
export const domeM = ([beat, at]: At, cx: number, base: number, r: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `M${cx - r} ${base} A${r} ${r} 0 0 1 ${cx + r} ${base}` })
/** A measuring arrow standing up, with end stops. */
export const vspan = ([beat, at]: At, x: number, y1: number, y2: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `M${x - 10} ${y1} h20 M${x - 10} ${y2} h20 M${x} ${y1} V${y2} M${x - 8} ${y1 + 12} L${x} ${y1} L${x + 8} ${y1 + 12} M${x - 8} ${y2 - 12} L${x} ${y2} L${x + 8} ${y2 - 12}` })
/** Water filling a can to the brim, as a wash. */
const water = ([beat, at]: At, cx: number, top: number, bot: number, rx: number): ChalkMark =>
  ({ beat, at, c: 'b', wash: true, d: `M${cx - rx} ${top} V${bot} A${rx} ${rx * 0.22} 0 0 0 ${cx + rx} ${bot} V${top} A${rx} ${rx * 0.22} 0 0 0 ${cx - rx} ${top} Z` })

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // No bottom, no height
  [
    ballM([0, 'ball'], 150, 200, 100),
    write([0, 'bottom'], 'no flat bottom', 420, 110, 30),
    write([0, 'height.'], 'no straight height', 420, 165, 30),
    write([1, 'rule'], 'bottom × height', 420, 245, 28, 'd'),
    write([1, 'nothing'], '?', 548, 245, 36, 'r'),
    canM([2, 'can.'], 150, 100, 300, 100, 'b'),
  ],
  // The big idea: the ball is 2/3 of the can around it
  [
    ballM([0, 'ball'], 150, 190, 90),
    cells([0, '2/3'], 300, 150, 250, 56, 3),
    wash([0, '2/3'], 300, 150, 250 * 2 / 3, 56, 'y'),
    write([0, '2/3'], 'ball', 383, 232, 24, 'y'),
    canM([0, 'can'], 150, 100, 280, 90, 'b'),
    write([0, 'can'], 'can', 425, 124, 24, 'd'),
    write([0, 'volume'], '4/3 × 3.14 × r × r × r', 300, 350, 30, 'y'),
  ],
  // A can that fits around it
  [
    canM([0, 'can'], 190, 110, 310, 100, 'b'),
    ballM([0, 'ball'], 190, 210, 100),
    line([1, 'radius'], [[190, 210], [290, 210]], 'b'),
    write([1, '3'], '3 in', 240, 192, 26, 'b'),
    vspan([2, 'tall'], 340, 110, 310, 'd'),
    write([2, '3'], 'across = 3 × 2', 470, 170, 30),
    write([2, '6'], '6 in tall', 470, 240, 34, 'y'),
  ],
  // The ball fills 2/3
  [
    canM([0, 'can'], 150, 100, 300, 100),
    water([0, 'water,'], 150, 100, 300, 100),
    ballM([0, 'ball'], 150, 200, 100),
    arrow([1, 'spills'], [258, 90], [310, 140], 'b'),
    write([1, 'big'], 'spilled = ball', 450, 110, 30, 'b'),
    cells([2, 'spills?'], 330, 200, 240, 54, 3),
    write([2, 'spills?'], 'the can', 450, 176, 22, 'd'),
    wash([2, 'Two'], 330, 200, 160, 54, 'y'),
    write([2, 'thirds'], '2/3 spills', 410, 285, 24, 'y'),
    write([2, 'One'], '1/3 stays', 530, 285, 22, 'd'),
  ],
  // Work it out
  [
    write([0, 'can'], 'can', 60, 70, 24, 'd'),
    write([0, '3.14'], '3.14 × 3 × 3 × 6', 280, 70, 30),
    write([0, '169.56.'], '= 169.56', 490, 70, 30),
    write([1, 'ball'], 'ball', 60, 150, 24, 'd'),
    write([1, '169.56'], '169.56 ÷ 3 × 2', 280, 150, 30),
    write([1, '113.04.'], '= 113.04', 490, 150, 30, 'y'),
    write([2, 'faster'], 'faster', 60, 230, 22, 'd'),
    write([2, '4/3'], '4/3 × 3.14 × 3 × 3 × 3', 280, 230, 28),
    write([2, 'same'], '= 113.04', 500, 230, 28, 'y'),
    write([3, 'holds'], '113.04 cubic inches', 300, 330, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'twice,'], '4/3 × 3.14 × 3 × 3 = 37.68', 270, 170, 30, 'r'),
    cross([1, 'circle.'], 478, 150, 40, 40),
    write([2, 'three'], '4/3 × 3.14 × 3 × 3 × 3 = 113.04', 300, 265, 30, 'y'),
    write([2, 'times.'], 'the radius three times', 300, 325, 26, 'd'),
  ],
]
