/** g5m5-t6's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, cross, ring } from '../../../chalk'
import { warn, tick } from '../g3m1/t1'
import { poly, place, corners, sideTicks, type At, type Pt } from '../g3m6/t5'
// Colours across these boards: white = the tiles and their marks (square corners, equal-side ticks), blue = a pair of
// sides running side by side (one arrow for the first pair, two for the second), yellow = the family name a tile earns,
// coral = the mix-up, dim = labels.

const r1 = (n: number) => Math.round(n * 10) / 10
/** The side-by-side mark: `n` small arrowheads in the middle of side a→b (as g4m5-t7 draws it). */
const chev = ([beat, at]: At, a: Pt, b: Pt, n = 1, c: ChalkColor = 'b'): ChalkMark => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
  return { beat, at, c, w: 3, d: Array.from({ length: n }, (_, k) => {
    const o = 5 + k * 10 - (n - 1) * 5, tx = mx + ux * o, ty = my + uy * o
    return `M${r1(tx - ux * 10 + uy * 8)} ${r1(ty - uy * 10 - ux * 8)} L${r1(tx)} ${r1(ty)} L${r1(tx - ux * 10 - uy * 8)} ${r1(ty - uy * 10 + ux * 8)}`
  }).join(' ') }
}
/** Both pairs of a four-sided shape (corners clockwise from top left): top/bottom one arrow, left/right two. */
const pairs = (at: At, p: Pt[]): ChalkMark[] => [chev(at, p[0], p[1]), chev(at, p[3], p[2]), chev(at, p[0], p[3], 2), chev(at, p[1], p[2], 2)]
const ALL4 = [0, 1, 2, 3]

// The shop's four tiles (units, y down), as Screen 1 shows them: a square, a rectangle, a rhombus, a leaning tile.
const SQ: Pt[] = [[0, 0], [3, 0], [3, 3], [0, 3]]
const RECT: Pt[] = [[0, 0], [5, 0], [5, 3], [0, 3]]
const RHOM: Pt[] = [[0, 0], [3, 0], [4.5, 2.6], [1.5, 2.6]]
const LEAN: Pt[] = [[0, 0], [4, 0], [5, 2.5], [1, 2.5]]
const ROW = [place(SQ, 30, 80, 24), place(RECT, 142, 80, 24), place(RHOM, 302, 80, 24), place(LEAN, 450, 80, 24)]
const [RS, RR, RH] = ROW
const row = (at: At) => ROW.map(p => ({ ...poly(at, p), quick: true }))

const BIG = place(SQ, 90, 100, 56)       // Screen 2's square tile
const BIG6 = place(SQ, 60, 90, 56)       // Screen 6's
const ICON = place(SQ, 276, 186, 16)     // the square inside the families (Screen 3)
const R7 = place(RECT, 150, 250, 26)     // Screen 7's rectangle, sides 5 and 3

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Which bin?
  [
    poly([0, 'square'], BIG),
    corners([1, 'corners'], BIG, ALL4, 'w', 16), write([1, 'rectangle'], 'rectangle?', 440, 130, 32),
    sideTicks([2, 'equal'], BIG, ALL4, 'w'), write([2, 'rhombus'], 'rhombus?', 440, 200, 32),
    write([3, 'both'], 'both?', 440, 280, 38, 'y'),
  ],
  // The big idea: families inside families
  [
    poly([0, 'shape'], ICON), corners([0, 'rule'], ICON, ALL4, 'w', 7), sideTicks([0, 'rule'], ICON, ALL4, 'w', 5),
    { ...ring([0, 'belongs'], 225, 225, 140, 100, 'y'), quick: true }, write([0, 'belongs'], 'rectangles', 160, 225, 24, 'y'),
    { ...ring([0, 'family'], 375, 225, 140, 100, 'y'), quick: true }, write([0, 'family'], 'rhombuses', 445, 225, 24, 'y'),
    write([0, 'name'], 'square', 300, 254, 20, 'y'),
    { ...ring([0, 'name'], 300, 215, 280, 170, 'y'), quick: true }, write([0, 'name'], 'parallelograms', 300, 90, 26, 'y'),
  ],
  // The biggest family
  [
    ...row([0, 'Start']),
    ...ROW.flatMap(p => pairs([1, 'pairs'], p).map(m => ({ ...m, quick: true }))),
    write([1, 'side'], '2 pairs, side by side', 300, 240, 30, 'b'),
    write([2, 'parallelograms'], 'all 4 are parallelograms', 300, 320, 34, 'y'),
  ],
  // Two smaller families
  [
    ...row([0, 'Add']),
    { ...corners([1, 'corners'], RS, ALL4, 'w', 10), quick: true }, corners([1, 'corners'], RR, ALL4, 'w', 10),
    write([1, 'corners'], '4 square corners →', 190, 240, 28), write([1, 'rectangle'], 'rectangle', 440, 240, 30, 'y'),
    { ...sideTicks([2, 'equal'], RS, ALL4, 'w', 6), quick: true }, sideTicks([2, 'equal'], RH, ALL4, 'w', 6),
    write([2, 'equal'], '4 equal sides →', 190, 310, 28), write([2, 'rhombus'], 'rhombus', 440, 310, 30, 'y'),
    write([3, 'both'], '?', 300, 370, 34, 'd'),
  ],
  // The square is in every family
  [
    poly([0, 'square'], BIG6), write([0, 'square'], 'square', 144, 290, 30, 'y'),
    corners([1, 'corners'], BIG6, ALL4, 'w', 16), sideTicks([1, 'equal'], BIG6, ALL4, 'w'),
    write([2, 'rectangle'], 'rectangle', 400, 110, 30, 'y'), tick([2, 'rectangle'], 520, 110, 'w'),
    write([2, 'rhombus'], 'rhombus', 400, 175, 30, 'y'), tick([2, 'rhombus'], 520, 175, 'w'),
    write([2, 'parallelogram'], 'parallelogram', 400, 240, 30, 'y'), tick([2, 'parallelogram'], 520, 240, 'w'),
    write([3, 'names'], '1 tile, 4 names', 300, 350, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'flip'], 'every rectangle is a square', 300, 150, 30), cross([1, 'around'], 100, 128, 400, 44),
    write([2, 'Every'], 'every square is a rectangle', 300, 215, 30, 'y'),
    poly([3, 'needs'], R7), corners([3, 'needs'], R7, ALL4, 'w', 12),
    write([3, 'equal'], '5', 215, 352, 24, 'd'), write([3, 'equal'], '3', 300, 290, 24, 'd'),
    write([3, 'sides'], 'sides not equal', 450, 290, 28),
  ],
]
