/** Helpers shared by g8m4-t6…t9's boards: an angle arc, and the right triangle with a square on every side. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write } from '../../../chalk'

export type At = [number, string?]
type Pt = [number, number]
export const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const r1 = (v: number) => Math.round(v * 10) / 10
const poly = (ps: Pt[]) => `M${ps.map(p => p.map(r1).join(' ')).join(' L')} Z`

/** An angle arc at (cx, cy), radius r, from a0° to a1° measured the math way (0° = right, counterclockwise, y up). */
export const arc = ([beat, at]: At, cx: number, cy: number, r: number, a0: number, a1: number, c: ChalkColor = 'y', w?: number): ChalkMark => {
  const p = (a: number): Pt => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)]
  const [x0, y0] = p(a0), [x1, y1] = p(a1)
  return { beat, at, c, w, d: `M${r1(x0)} ${r1(y0)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${r1(x1)} ${r1(y1)}` }
}

/**
 * A right triangle with its right angle at math (0, 0): the bottom side `b` long, the left side `a` long, `u` px a unit,
 * the right angle at board (ox, oy). Each side carries a square turned outward: `bottom`, `left` and `long`.
 */
export function squares(ox: number, oy: number, u: number, a: number, b: number) {
  const P = ([x, y]: Pt): Pt => [ox + x * u, oy - y * u]
  const tri: Pt[] = [[0, 0], [b, 0], [0, a]]
  const sq = {
    bottom: [[0, 0], [b, 0], [b, -b], [0, -b]] as Pt[],
    left: [[0, 0], [0, a], [-a, a], [-a, 0]] as Pt[],
    long: [[b, 0], [0, a], [a, a + b], [a + b, b]] as Pt[],
  }
  type Side = keyof typeof sq
  const centre = (s: Side): Pt => P(sq[s].reduce<Pt>((m, p) => [m[0] + p[0] / 4, m[1] + p[1] / 4], [0, 0]))
  return {
    P,
    triangle: ([beat, at]: At, c: ChalkColor = 'w'): ChalkMark => ({ beat, at, c, d: poly(tri.map(P)) }),
    /** The little square in the right-angle corner. */
    corner: ([beat, at]: At, c: ChalkColor = 'd'): ChalkMark => {
      const [x, y] = P([0, 0]), k = 12
      return { beat, at, c, w: 2.5, d: `M${x + k} ${y} V${y - k} H${x}` }
    },
    square: ([beat, at]: At, s: Side, c: ChalkColor = 'w'): ChalkMark => ({ beat, at, c, d: poly(sq[s].map(P)) }),
    fill: ([beat, at]: At, s: Side, c: ChalkColor): ChalkMark => ({ beat, at, c, wash: true, d: poly(sq[s].map(P)) }),
    /** The unit grid inside a square (one line per unit, dim): "holds this many little squares". */
    grid: ([beat, at]: At, s: Side): ChalkMark => {
      const [p0, p1, , p3] = sq[s], n = Math.round(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]))
      const e1: Pt = [(p1[0] - p0[0]) / n, (p1[1] - p0[1]) / n], e3: Pt = [(p3[0] - p0[0]) / n, (p3[1] - p0[1]) / n]
      const seg = (a: Pt, b: Pt) => { const [x0, y0] = P(a), [x1, y1] = P(b); return `M${r1(x0)} ${r1(y0)} L${r1(x1)} ${r1(y1)}` }
      const d: string[] = []
      for (let k = 1; k < n; k++) {
        d.push(seg([p0[0] + e3[0] * k, p0[1] + e3[1] * k], [p1[0] + e3[0] * k, p1[1] + e3[1] * k]))
        d.push(seg([p0[0] + e1[0] * k, p0[1] + e1[1] * k], [p3[0] + e1[0] * k, p3[1] + e1[1] * k]))
      }
      return { beat, at, c: 'd', w: 1.6, d: d.join(' ') }
    },
    /** Writing in the middle of a square. */
    label: (at: At, s: Side, t: string, size = 34, c: ChalkColor = 'y'): ChalkMark => { const [x, y] = centre(s); return write(at, t, r1(x), r1(y), size, c) },
    centre,
  }
}
