/** Chalk objects for g3m1-t5..t8: wheels, apples, bags, chairs — plain shapes, counted exactly. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, chalkWidth } from '../../../chalk'

export type At = [number, string?]
type Pt = [number, number]
const circ = (x: number, y: number, r: number) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`
const mark = ([beat, at]: At, d: string, c: ChalkColor = 'w', quick = true): ChalkMark => ({ beat, at, d, c, quick })

/** A tricycle: one front wheel, two back wheels, a frame. `k` scales it. */
export const trike = (at: At, x: number, y: number, k = 1, c: ChalkColor = 'w') =>
  mark(at, `${circ(x, y - 18 * k, 9 * k)} ${circ(x - 16 * k, y + 8 * k, 9 * k)} ${circ(x + 16 * k, y + 8 * k, 9 * k)} M${x} ${y - 9 * k} L${x} ${y + 8 * k} M${x - 7 * k} ${y + 8 * k} H${x + 7 * k}`, c)
/** A car seen from above: a body and 4 wheels. */
export const car = (at: At, x: number, y: number, k = 1, c: ChalkColor = 'w') =>
  mark(at, `M${x - 20 * k} ${y - 28 * k} h${40 * k} v${56 * k} h${-40 * k} Z M${x - 20 * k} ${y - 12 * k} h${40 * k}`
    + [[-27, -17], [27, -17], [-27, 17], [27, 17]].map(([dx, dy]) => ` ${circ(x + dx * k, y + dy * k, 7 * k)}`).join(''), c)
/** Apples (small circles), one mark for the lot. */
export const apples = (at: At, pts: Pt[], c: ChalkColor = 'w', r = 9) => mark(at, pts.map(([x, y]) => circ(x, y, r)).join(' '), c)
/** An open bag, top edge at y. */
export const bag = (at: At, x: number, y: number, c: ChalkColor = 'w') =>
  mark(at, `M${x - 42} ${y} L${x - 34} ${y + 62} H${x + 34} L${x + 42} ${y}`, c)
/** A bag with its 3 apples in it. */
export const fullBag = (at: At, x: number, y: number, c: ChalkColor = 'w'): ChalkMark[] =>
  [bag(at, x, y, c), apples(at, [[x - 21, y + 42], [x, y + 42], [x + 21, y + 42]], c, 8)]
/** A chair: a small square with a back. */
export const chairs = (at: At, pts: Pt[], c: ChalkColor = 'w') =>
  mark(at, pts.map(([x, y]) => `M${x - 12} ${y - 12} h24 v24 h-24 Z M${x - 12} ${y - 17} h24`).join(' '), c)
/** A tick. */
export const tick = (at: At, x: number, y: number, c: ChalkColor = 'y') => mark(at, `M${x - 12} ${y} L${x - 3} ${y + 10} L${x + 14} ${y - 12}`, c, false)
/** A number line from x0, `n` units of `u` px, ticks down. */
export const numLine = (at: At, x0: number, y: number, n: number, u: number, c: ChalkColor = 'w') =>
  mark(at, `M${x0 - 10} ${y} H${x0 + n * u + 10}` + Array.from({ length: n + 1 }, (_, i) => ` M${x0 + i * u} ${y} v10`).join(''), c)

/**
 * An equation written token by token, so a piece can be coloured or ringed: `xs` are each token's centre.
 * Tokens sit a small gap apart; `cols` colours single tokens by index.
 */
export function eqn(at: At, toks: string[], cx: number, y: number, s: number, c: ChalkColor = 'w', cols: Record<number, ChalkColor> = {}) {
  const gap = s * 0.6, ws = toks.map(t => chalkWidth(t, s))
  let x = cx - (ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1)) / 2
  const xs = ws.map(w => { const m = x + w / 2; x += w + gap; return m })
  return { xs, marks: toks.map((t, i) => ({ ...write(at, t, xs[i], y, s, cols[i] ?? c), quick: true })) }
}
