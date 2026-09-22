/**
 * Chalk shapes for g4m6-t5..t7: a true 10 × 10 grid (one column = one tenth, one square = one hundredth), decimals
 * written digit by digit so the points line up, and coins. Colours across these three topics: blue = tenths (full
 * columns, dimes), white = hundredths (loose squares, pennies), yellow = the result, dim = labels, coral = the mix-up.
 */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { wash, write } from '../../../chalk'

export type At = [number, string?]
export { warn, tick } from '../g3m1/t1'

/** A 10 × 10 grid of side `s` at (x, y): the outline, then the 9 cuts each way, as one stroke. */
export const grid = ([beat, at]: At, x: number, y: number, s: number, c: ChalkColor = 'w'): ChalkMark => ({
  beat, at, c, w: 2.2,
  d: `M${x} ${y} h${s} v${s} h${-s} Z` + Array.from({ length: 9 }, (_, i) => ` M${x + (s * (i + 1)) / 10} ${y} v${s} M${x} ${y + (s * (i + 1)) / 10} h${s}`).join(''),
})

/** Squares `from`..`from + n` of that grid washed, counted down each column, left to right (full columns first). */
export const fill = (at: At, x: number, y: number, s: number, n: number, c: ChalkColor = 'b', from = 0): ChalkMark[] => {
  const k = s / 10, out: ChalkMark[] = []
  let i = from
  while (i < from + n) {
    const col = Math.floor(i / 10), top = i % 10, len = Math.min(10 - top, from + n - i)
    out.push({ ...wash(at, x + col * k, y + top * k, k, len * k, c), quick: true })
    i += len
  }
  return out
}

/** A number written one character at a time at the x's given, so rows line up on their points. */
export const chars = (at: At, t: string, xs: number[], y: number, s: number, c: ChalkColor | ChalkColor[] = 'w'): ChalkMark[] =>
  [...t].map((ch, i) => ({ ...write(at, ch, xs[i], y, s, Array.isArray(c) ? c[i] : c), quick: true }))

/** A coin: a circle (a dime is small, a penny smaller). */
export const coin = ([beat, at]: At, x: number, y: number, r: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, quick: true, d: `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0` })

/** A dollar bill with $1 on it. */
export const bill = ([beat, at]: At, x: number, y: number, c: ChalkColor = 'w'): ChalkMark[] => [
  { beat, at, c, quick: true, d: `M${x} ${y} h96 v50 h-96 Z` },
  { ...write([beat, at], '$1', x + 48, y + 25, 26, c), quick: true },
]
