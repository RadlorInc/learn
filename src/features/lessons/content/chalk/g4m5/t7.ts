/** g4m5-t7's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'
import { poly, place, corners, sideTicks, type At, type Pt } from '../g3m6/t5'
import { dashed } from './t5'
// Colours across these boards: blue = a pair of parallel sides (one arrow for the first pair, two for the second),
// yellow = the name it earns, white marks = square corners and equal sides, coral = the mix-up.

const r1 = (n: number) => Math.round(n * 10) / 10
/** The parallel-side mark: `n` small arrowheads in the middle of side a→b, pointing from a to b. */
const chev = ([beat, at]: At, a: Pt, b: Pt, n = 1, c: ChalkColor = 'b'): ChalkMark => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
  return { beat, at, c, w: 3, d: Array.from({ length: n }, (_, k) => {
    const o = 5 + k * 10 - (n - 1) * 5, tx = mx + ux * o, ty = my + uy * o
    return `M${r1(tx - ux * 10 + uy * 8)} ${r1(ty - uy * 10 - ux * 8)} L${r1(tx)} ${r1(ty)} L${r1(tx - ux * 10 - uy * 8)} ${r1(ty - uy * 10 + ux * 8)}`
  }).join(' ') }
}
/** Both pairs of a four-sided shape's sides marked (corners 0,1,2,3 clockwise from top left): top/bottom one arrow, left/right two. */
const pairs = (at: At, p: Pt[], second = true): ChalkMark[] => [
  chev(at, p[0], p[1]), chev(at, p[3], p[2]),
  ...(second ? [chev(at, p[0], p[3], 2), chev(at, p[1], p[2], 2)] : []),
]
const side = (at: At, a: Pt, b: Pt, c: ChalkColor = 'b'): ChalkMark => ({ ...line(at, [a, b], c), w: 4.5 })

const TABLE: Pt[] = [[0, 0], [4, 0], [4, 2.5], [0, 2.5]], SHELF: Pt[] = [[0, 0], [4, 0], [5, 2.5], [1, 2.5]]
const LAMP: Pt[] = [[0, 0], [6, 0], [4.5, 2.5], [1.5, 2.5]], RHOMB: Pt[] = [[1.5, 0], [4.5, 0], [3, 2.6], [0, 2.6]]
const S2 = [place(TABLE, 24, 80, 36), place(SHELF, 192, 80, 36), place([[0, 0], [5, 0], [4, 2.5], [1, 2.5]], 396, 80, 36)]
const mid = (p: Pt[]) => (Math.min(...p.map(q => q[0])) + Math.max(...p.map(q => q[0]))) / 2
const BIG = place(TABLE, 60, 120, 50)
const SH = place(SHELF, 40, 60, 70)
const LA = place(LAMP, 40, 50, 45), MEET: Pt = [40 + 3 * 45, 50 + 5 * 45]
const TB = place(TABLE, 50, 70, 50), SQ = place([[0, 0], [1, 0], [1, 1], [0, 1]], 380, 70, 125)
const SH7 = place(SHELF, 50, 215, 36), RH = place(RHOMB, 360, 205, 40)

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Four sides is not a name
  [
    ...S2.map(p => ({ ...poly([0, 'All'], p), quick: true })),
    ...S2.map(p => ({ ...write([0, '4'], '4 sides', mid(p), 205, 22, 'd'), quick: true })),
    write([1, 'name'], '4 sides is not a name', 300, 270, 30),
    write([2, 'parallel'], 'which sides are parallel?', 300, 340, 30, 'b'),
  ],
  // The big idea: parallel pairs first, then sides and corners
  [
    poly([0, 'Count'], BIG), ...pairs([0, 'pairs'], BIG),
    write([0, 'parallel'], '1. parallel pairs', 440, 150, 28, 'b'),
    write([0, 'check'], '2. sides and corners', 440, 215, 28), corners([0, 'corners'], BIG, [0, 1, 2, 3], 'w', 13),
    write([0, 'name'], 'the best name', 440, 285, 32, 'y'),
  ],
  // Two pairs
  [
    poly([0, 'shelf'], SH),
    side([1, 'Top'], SH[0], SH[1]), side([1, 'bottom'], SH[3], SH[2]), chev([1, 'parallel'], SH[0], SH[1]), chev([1, 'parallel'], SH[3], SH[2]),
    write([1, '1'], '1 pair', 500, 110, 30, 'b'),
    side([2, 'Left'], SH[0], SH[3]), side([2, 'right'], SH[1], SH[2]), chev([2, 'parallel'], SH[0], SH[3], 2), chev([2, 'parallel'], SH[1], SH[2], 2),
    write([2, '2'], '2 pairs', 500, 180, 30, 'b'),
    write([3, 'parallelogram'], 'parallelogram', 300, 320, 38, 'y'),
  ],
  // Only one pair
  [
    poly([0, 'lampshade'], LA),
    side([1, 'Top'], LA[0], LA[1]), side([1, 'bottom'], LA[3], LA[2]), chev([1, 'parallel'], LA[0], LA[1]), chev([1, 'parallel'], LA[3], LA[2]),
    dashed([2, 'lean'], LA[3], MEET, 'd'), dashed([2, 'lean'], LA[2], MEET, 'd'),
    ring([2, 'meet'], MEET[0], MEET[1], 8, 8, 'd'), write([2, 'meet'], 'they meet', MEET[0] + 90, MEET[1] + 10, 24, 'd'),
    write([3, '1'], 'just 1 pair', 470, 110, 30, 'b'),
    write([3, 'trapezoid'], 'trapezoid', 470, 190, 40, 'y'),
  ],
  // Then check the corners
  [
    poly([0, 'table'], TB),
    ...pairs([1, '2'], TB), corners([1, 'square'], TB, [0, 1, 2, 3], 'w', 14),
    write([2, 'rectangle'], 'rectangle', 150, 250, 34, 'y'),
    poly([3, 'equal'], SQ), sideTicks([3, 'equal'], SQ, [0, 1, 2, 3], 'w'), corners([3, 'equal'], SQ, [0, 1, 2, 3], 'w', 14),
    write([3, 'square'], 'square', 442, 250, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'leaning'], 'it leans → rhombus', 300, 150, 30), cross([1, 'rhombus'], 150, 128, 300, 44),
    poly([2, 'EQUAL'], RH), sideTicks([2, 'EQUAL'], RH, [0, 1, 2, 3], 'w'),
    write([2, 'sides'], '4 equal sides → rhombus', 440, 345, 24, 'y'),
    poly([2, 'shelf'], SH7), write([2, 'match'], "sides don't match", 150, 345, 24, 'd'),
  ],
]
