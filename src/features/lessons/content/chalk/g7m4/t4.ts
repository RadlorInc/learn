/** g7m4-t4's chalkboards (angles that make 90° or 180°): index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, cross } from '../../../chalk'

type At = [number, string?]
type Pt = [number, number]
const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]
/** The point `r` from (x, y) at `deg` degrees, counted up from the right. */
const at = (x: number, y: number, r: number, deg: number): Pt =>
  [Math.round(x + r * Math.cos((deg * Math.PI) / 180)), Math.round(y - r * Math.sin((deg * Math.PI) / 180))]
/** A square corner at (x, y): one arm up, one arm right, and its little square. */
const corner = (a: At, x: number, y: number, len: number): ChalkMark[] =>
  [line(a, [[x, y - len], [x, y], [x + len, y]]), line(a, [[x, y - 18], [x + 18, y - 18], [x + 18, y]], 'd')]
/** A straight line through (x, y), `len` each way. */
const straight = (a: At, x: number, y: number, len: number): ChalkMark => line(a, [[x - len, y], [x + len, y]])
/** A ray from (x, y) at `deg`. */
const ray = (a: At, x: number, y: number, len: number, deg: number, c: ChalkColor = 'w'): ChalkMark => line(a, [[x, y], at(x, y, len, deg)], c)
/** An arc round (x, y) from `from` to `to` degrees. */
const arc = ([beat, w]: At, x: number, y: number, r: number, from: number, to: number, c: ChalkColor = 'y'): ChalkMark => {
  const [x1, y1] = at(x, y, r, from), [x2, y2] = at(x, y, r, to)
  return { beat, at: w, c, d: `M${x1} ${y1} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 0 ${x2} ${y2}` }
}
/** Writing at `deg`, `r` out from (x, y). */
const label = (a: At, t: string, x: number, y: number, r: number, deg: number, s = 24, c: ChalkColor = 'w'): ChalkMark => {
  const [px, py] = at(x, y, r, deg)
  return write(a, t, px, py, s, c)
}

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // What is the whole? A square corner and a straight line, each with a 35° part
  [
    ...corner([0, 'corner'], 80, 250, 180), ray([0, 'two'], 80, 250, 170, 35, 'b'),
    label([0, '35°'], '35°', 80, 250, 88, 15, 22, 'b'), label([0, 'know.'], '?', 80, 250, 80, 64, 30, 'y'),
    write([1, 'whole'], 'whole = ?', 300, 365, 28, 'y'),
    write([2, 'square'], 'square corner', 170, 300, 22, 'd'),
    straight([2, 'straight'], 450, 250, 120), ray([2, 'straight'], 450, 250, 120, 35, 'b'),
    label([2, 'straight'], '35°', 450, 250, 72, 14, 20, 'b'), label([2, 'straight'], '?', 450, 250, 60, 110, 30, 'y'),
    write([2, 'line'], 'straight line', 450, 300, 22, 'd'),
  ],
  // The big idea: 90° for a square corner, 180° for a straight line
  [
    ...corner([0, 'square'], 80, 260, 180), ray([0, 'fill'], 80, 260, 170, 50, 'b'),
    arc([0, '90°'], 80, 260, 60, 0, 90), write([0, '90°'], '90°', 170, 320, 34, 'y'),
    straight([0, 'straight'], 450, 260, 120), ray([0, 'straight'], 450, 260, 120, 60, 'b'),
    arc([0, '180°'], 450, 260, 60, 0, 180), write([0, '180°'], '180°', 450, 320, 34, 'y'),
  ],
  // The parts fill the corner: 35° + ? = 90°
  [
    ...corner([0, 'bracket'], 120, 330, 260), ray([0, 'brace'], 120, 330, 290, 35, 'b'),
    label([0, 'brace'], '35°', 120, 330, 130, 16, 28, 'b'), label([0, 'brace'], '?', 120, 330, 115, 64, 34, 'y'),
    arc([0, 'gap'], 120, 330, 70, 0, 90),
    write([1, '90°'], '35° + ? = 90°', 460, 110, 30, 'y'),
  ],
  // Take away the part you know: 90 − 35 = 55
  [
    ...corner([0, 'what'], 100, 300, 190), ray([0, 'what'], 100, 300, 180, 35, 'b'),
    label([0, '35?'], '35°', 100, 300, 92, 16, 22, 'b'), label([0, 'what'], '?', 100, 300, 78, 64, 28),
    write([0, 'whole'], 'whole: 90°', 440, 100, 28, 'd'),
    write([1, '90'], '90 − 35', 400, 200, 34), write([1, '55.'], '= 55', 508, 200, 34, 'y'),
    label([1, 'other'], '55°', 100, 300, 140, 64, 28, 'y'),
    write([1, 'other'], 'other angle: 55°', 400, 320, 30, 'y'),
  ],
  // A straight line starts at 180
  [
    straight([0, 'straight'], 300, 220, 240), ray([0, 'same'], 300, 220, 200, 35, 'b'),
    label([0, 'same'], '35°', 300, 220, 110, 16, 24, 'b'), label([0, 'line'], '?', 300, 220, 80, 140, 30, 'y'),
    arc([1, 'whole.'], 300, 220, 50, 0, 180, 'd'), write([1, '180.'], 'straight line = 180°', 300, 280, 26, 'd'),
    write([2, '180'], '180 − 35', 250, 340, 32), write([2, '145.'], '= 145', 373, 340, 32, 'y'),
    label([2, 'angle'], '145°', 300, 220, 150, 150, 26, 'y'),
  ],
  // One thing not to do: starting from 180 at a square corner
  [
    ...warn([0, 'mix']),
    ...corner([1, 'SQUARE'], 70, 330, 140), ray([1, 'SQUARE'], 70, 330, 140, 35, 'b'),
    write([1, '180'], '180° − 35° = 145°', 370, 160, 30, 'r'), cross([2, 'bigger'], 505, 142, 36, 36),
    write([2, 'Look'], '90° − 35° = 55°', 370, 260, 30, 'y'),
  ],
]
