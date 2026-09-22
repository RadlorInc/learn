/**
 * Chalk shapes for g3m5-t5..t8: bars and pizzas cut into truly equal pieces. Colours across these four topics:
 * white = the whole and its cuts, blue wash = the pieces taken, yellow = the result, dim = labels, coral = the warning.
 */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { wash, write, line } from '../../../chalk'

export type At = [number, string?]
type Pt = [number, number]
export { warn, tick } from '../g3m1/t1'

/** `k` pieces of a bar (x, y, w, h) cut into `n`, starting at piece `from`, washed. */
export const shade = (at: At, x: number, y: number, w: number, h: number, n: number, k: number, from = 0, c: ChalkColor = 'b'): ChalkMark =>
  ({ ...wash(at, x + (w * from) / n, y, (w * k) / n, h, c), quick: true })

/** The point `i` of `n` equal steps round a circle, clockwise from 12 o'clock. */
const onPizza = (cx: number, cy: number, r: number, i: number, n: number): Pt => {
  const a = (i / n) * 2 * Math.PI - Math.PI / 2
  return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))]
}
const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`

/** A round pizza, not cut yet. */
export const pizza = ([beat, at]: At, cx: number, cy: number, r: number, c: ChalkColor = 'w'): ChalkMark => ({ beat, at, c, d: circle(cx, cy, r) })
/** The `n` equal cuts of a pizza, centre to crust. */
export const cuts = ([beat, at]: At, cx: number, cy: number, r: number, n: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: Array.from({ length: n }, (_, i) => `M${cx} ${cy} L${onPizza(cx, cy, r, i, n).join(' ')}`).join(' ') })
/** Slices `from`..`from + k` of a pizza cut into `n`: washed (taken), or traced as an outline. */
export const slices = ([beat, at]: At, cx: number, cy: number, r: number, n: number, k: number, from = 0, c: ChalkColor = 'b', traced = false): ChalkMark => {
  const d = k >= n ? circle(cx, cy, r)
    : `M${cx} ${cy} L${onPizza(cx, cy, r, from, n).join(' ')} A${r} ${r} 0 ${k / n > 0.5 ? 1 : 0} 1 ${onPizza(cx, cy, r, from + k, n).join(' ')} Z`
  return traced ? { beat, at, c, d } : { beat, at, c, d, wash: true, quick: true }
}
/** Where to write something in slice `i` of `n`, `rr` from the centre. */
export const inSlice = (cx: number, cy: number, rr: number, i: number, n: number): Pt => onPizza(cx, cy, rr, i + 0.5, n)

/** A fraction written the school way, top number over bottom number. */
export const frac = (at: At, top: number, bottom: number, x: number, y: number, s = 40, c: ChalkColor = 'w'): ChalkMark[] => [
  { ...write(at, String(top), x, y - s * 0.62, s, c), quick: true },
  { ...line(at, [[x - s * 0.4, y], [x + s * 0.4, y]], c), quick: true },
  { ...write(at, String(bottom), x, y + s * 0.62, s, c), quick: true },
]
