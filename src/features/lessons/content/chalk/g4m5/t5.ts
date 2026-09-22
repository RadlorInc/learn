/** g4m5-t5's chalkboards: index = screen index (0 is Screen 1, which has none). Also the line and angle helpers t6–t8 draw with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'
import { corners, type At, type Pt } from '../g3m6/t5'
// Colours across these boards: blue = what we check (the gap, the square corner), yellow = the name it earns, coral = the mix-up.

const r1 = (n: number) => Math.round(n * 10) / 10
const unit = ([ax, ay]: Pt, [bx, by]: Pt): Pt => { const l = Math.hypot(bx - ax, by - ay); return [(bx - ax) / l, (by - ay) / l] }
/** A line: arrowheads at both ends, since it goes on for ever. */
export const lineArrows = ([beat, at]: At, a: Pt, b: Pt, c: ChalkColor = 'w'): ChalkMark => {
  const [ux, uy] = unit(a, b), k = 13, head = (p: Pt, s: number) =>
    ` M${r1(p[0] - s * k * ux + k * 0.5 * uy)} ${r1(p[1] - s * k * uy - k * 0.5 * ux)} L${p.join(' ')} L${r1(p[0] - s * k * ux - k * 0.5 * uy)} ${r1(p[1] - s * k * uy + k * 0.5 * ux)}`
  return { beat, at, c, d: `M${a.join(' ')} L${b.join(' ')}` + head(b, 1) + head(a, -1) }
}
/** A dashed line from a to b. */
export const dashed = ([beat, at]: At, a: Pt, b: Pt, c: ChalkColor = 'w', dash = 12, gap = 9): ChalkMark => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), [ux, uy] = unit(a, b), parts: string[] = []
  for (let s = 0; s < len; s += dash + gap) {
    const e = Math.min(len, s + dash)
    parts.push(`M${r1(a[0] + ux * s)} ${r1(a[1] + uy * s)} L${r1(a[0] + ux * e)} ${r1(a[1] + uy * e)}`)
  }
  return { beat, at, c, w: 3, d: parts.join(' ') }
}
/** A measuring arrow straight up and down, from y1 to y2. */
export const vspan = ([beat, at]: At, x: number, y1: number, y2: number, c: ChalkColor = 'b'): ChalkMark =>
  ({ beat, at, c, w: 2.8, d: `M${x - 9} ${y1} h18 M${x - 9} ${y2} h18 M${x} ${y1} V${y2} M${x - 7} ${y1 + 11} L${x} ${y1} L${x + 7} ${y1 + 11} M${x - 7} ${y2 - 11} L${x} ${y2} L${x + 7} ${y2 - 11}` })
/** The arc that marks the angle at corner v between the sides to a and to b. */
export const arc = ([beat, at]: At, v: Pt, a: Pt, b: Pt, r = 26, c: ChalkColor = 'b'): ChalkMark => {
  const ta = Math.atan2(a[1] - v[1], a[0] - v[0]), tb = Math.atan2(b[1] - v[1], b[0] - v[0])
  let d = tb - ta
  while (d <= -Math.PI) d += 2 * Math.PI
  while (d > Math.PI) d -= 2 * Math.PI
  const p = (t: number) => `${r1(v[0] + r * Math.cos(t))} ${r1(v[1] + r * Math.sin(t))}`
  return { beat, at, c, w: 2.8, d: `M${p(ta)} A${r} ${r} 0 0 ${d > 0 ? 1 : 0} ${p(tb)}` }
}
/** The point `dist` from corner v along the middle of its angle (where the angle's label goes). */
export const inAngle = (v: Pt, a: Pt, b: Pt, dist: number): Pt => {
  const [ax, ay] = unit(v, a), [bx, by] = unit(v, b), [mx, my] = unit([0, 0], [ax + bx, ay + by])
  return [r1(v[0] + mx * dist), r1(v[1] + my * dist)]
}
/** A square-corner mark at v, between the sides to a and to b. */
export const sq = (at: At, a: Pt, v: Pt, b: Pt, c: ChalkColor = 'b', s = 16) => corners(at, [a, v, b], [1], c, s)

// Screen 4's rails and Screen 5's plus sign.
const RAIL1 = 110, RAIL2 = 200, PX = 200, PY = 200

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Cross or not
  [
    lineArrows([0, 'rails'], [50, 110], [270, 110]), lineArrows([0, 'rails'], [50, 190], [270, 190]),
    write([0, 'never'], 'never cross', 160, 240, 24, 'd'),
    lineArrows([0, 'plus'], [340, 150], [560, 150]), lineArrows([0, 'plus'], [450, 45], [450, 255]),
    write([0, 'does'], 'cross', 450, 290, 24, 'd'),
    write([1, 'name'], 'what is each one called?', 300, 350, 30),
    vspan([2, 'gap'], 120, 116, 184), write([2, 'gap'], 'gap', 175, 150, 26, 'b'),
    sq([2, 'corner'], [560, 150], [450, 150], [450, 45]), write([2, 'corner'], 'corner', 515, 110, 24, 'b'),
  ],
  // The big idea: same gap → parallel; a square corner → perpendicular
  [
    lineArrows([0, 'Lines'], [40, 140], [280, 140]), lineArrows([0, 'Lines'], [40, 220], [280, 220]),
    vspan([0, 'gap'], 90, 146, 214), { ...vspan([0, 'same'], 160, 146, 214), quick: true }, vspan([0, 'same'], 230, 146, 214),
    write([0, 'parallel'], 'parallel', 160, 320, 34, 'y'),
    lineArrows([0, 'cross'], [340, 180], [560, 180]), lineArrows([0, 'cross'], [450, 70], [450, 290]),
    sq([0, 'square'], [560, 180], [450, 180], [450, 70]),
    write([0, 'perpendicular'], 'perpendicular', 450, 330, 32, 'y'),
  ],
  // The same gap all the way
  [
    lineArrows([0, 'rails'], [40, RAIL1], [560, RAIL1]), lineArrows([0, 'rails'], [40, RAIL2], [560, RAIL2]),
    vspan([1, 'gap'], 120, RAIL1 + 6, RAIL2 - 6), vspan([1, 'here'], 300, RAIL1 + 6, RAIL2 - 6), vspan([1, 'here'], 480, RAIL1 + 6, RAIL2 - 6),
    write([1, 'same'], 'the same gap', 300, 250, 28, 'b'),
    write([2, 'never'], 'never meet', 300, 305, 30),
    write([3, 'parallel'], 'parallel', 300, 360, 38, 'y'),
  ],
  // Cross at a square corner
  [
    lineArrows([0, 'plus'], [45, PY], [355, PY]), lineArrows([0, 'plus'], [PX, 45], [PX, 355]),
    ...([['1', 245, 155], ['2', 155, 155], ['3', 155, 245], ['4', 245, 245]] as [string, number, number][])
      .map(([t, x, y]) => ({ ...write([1, '4'], t, x, y, 24, 'd'), quick: true })),
    write([1, 'square'], '4 square corners', 480, 120, 26),
    sq([2, 'small'], [355, PY], [PX, PY], [PX, 45], 'b', 22), write([2, 'square'], '= square corner', 480, 200, 26, 'b'),
    write([3, 'perpendicular'], 'perpendicular', 475, 300, 32, 'y'),
  ],
  // Neither
  [
    lineArrows([0, 'scissors'], [40, 144], [320, 256]), lineArrows([0, 'scissors'], [40, 256], [320, 144]),
    write([1, 'parallel'], 'not parallel', 465, 120, 28),
    arc([2, 'corners'], [180, 200], [320, 144], [40, 144], 34), arc([2, 'corners'], [180, 200], [320, 256], [320, 144], 44),
    write([2, 'square'], 'not square', 180, 110, 22, 'b'),
    write([2, 'perpendicular'], 'not perpendicular', 465, 190, 28),
    write([3, 'neither'], 'neither', 465, 290, 42, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'touching'], 'not touching = parallel', 300, 150, 30), cross([1, 'mean'], 115, 128, 370, 44),
    line([1, 'parallel'], [[40, 200], [320, 245]]), line([1, 'parallel'], [[40, 340], [320, 295]]),
    vspan([2, 'gap'], 70, 211, 329), vspan([2, 'smaller'], 290, 246, 294),
    dashed([2, 'meet'], [320, 245], [475, 270], 'y'), dashed([2, 'meet'], [320, 295], [475, 270], 'y'),
    ring([2, 'meet'], 475, 270, 9, 9, 'y'), write([2, 'farther'], 'they meet', 480, 320, 28, 'y'),
  ],
]
