/** g3m6-t5's chalkboards: index = screen index (0 is Screen 1, which has none). Also the shape helpers t6–t7 draw with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cross, ring } from '../../../chalk'
import { warn, tick } from '../g3m1/t1'

export type At = [number, string?]
export type Pt = [number, number]
// Colours across these boards: yellow = a square corner, blue = an equal side, coral = the mix-up, dim = labels.

/** Unit shape `pts` (y down) scaled by `u`, top-left at (x, y). */
export const place = (pts: Pt[], x: number, y: number, u: number): Pt[] => pts.map(([a, b]) => [x + a * u, y + b * u])
/** A closed shape, traced corner to corner. */
export const poly = ([beat, at]: At, pts: Pt[], c: ChalkColor = 'w'): ChalkMark => ({ beat, at, c, d: `M${pts.map(p => p.join(' ')).join(' L')} Z` })
/** The rectangle `w` × `h` units, top-left at (x, y). */
export const rectPts = (x: number, y: number, w: number, h: number, u: number): Pt[] => place([[0, 0], [w, 0], [w, h], [0, h]], x, y, u)
const unit = ([ax, ay]: Pt, [bx, by]: Pt): Pt => { const l = Math.hypot(bx - ax, by - ay); return [(bx - ax) / l, (by - ay) / l] }
const r1 = (n: number) => Math.round(n * 10) / 10
/** The small square that marks a square corner, in each corner `idx` of `pts`. */
export const corners = ([beat, at]: At, pts: Pt[], idx: number[], c: ChalkColor = 'y', s = 11): ChalkMark => ({
  beat, at, c, w: 2.6, d: idx.map(i => {
    const p = pts[i], a = unit(p, pts[(i + pts.length - 1) % pts.length]), b = unit(p, pts[(i + 1) % pts.length])
    const q = (k: number, m: number): string => `${r1(p[0] + a[0] * s * k + b[0] * s * m)} ${r1(p[1] + a[1] * s * k + b[1] * s * m)}`
    return `M${q(1, 0)} L${q(1, 1)} L${q(0, 1)}`
  }).join(' '),
})
/** A small tick across the middle of each side `idx` (side i runs from corner i to corner i + 1). */
export const sideTicks = ([beat, at]: At, pts: Pt[], idx: number[], c: ChalkColor = 'b', k = 8): ChalkMark => ({
  beat, at, c, w: 2.6, d: idx.map(i => {
    const p = pts[i], q = pts[(i + 1) % pts.length], [ux, uy] = unit(p, q), mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2
    return `M${r1(mx - uy * k)} ${r1(my + ux * k)} L${r1(mx + uy * k)} ${r1(my - ux * k)}`
  }).join(' '),
})

// The four tiles (units, y down): a 3 × 3 square, a 5 × 3 rectangle, a leaning tile with 4 sides of 3, and one with none of that.
const SQ: Pt[] = [[0, 0], [3, 0], [3, 3], [0, 3]]
const RECT: Pt[] = [[0, 0], [5, 0], [5, 3], [0, 3]]
const LEAN: Pt[] = [[1.5, 0], [4.5, 0], [3, 2.6], [0, 2.6]]
const ODD: Pt[] = [[0, 0.5], [4, 0], [3.6, 2.5], [0.4, 2.2]]
const U = 27, XS = [32, 143, 309, 460]   // left edges, 30 px apart
const tiles = (cy: number) => [SQ, RECT, LEAN, ODD].map((p, i) => place(p, XS[i], cy - (Math.max(...p.map(q => q[1])) * U) / 2, U))
const drawTiles = (at: At, ts: Pt[][]) => ts.map(p => ({ ...poly(at, p), quick: true }))
const midX = (p: Pt[]) => (Math.min(...p.map(q => q[0])) + Math.max(...p.map(q => q[0]))) / 2

const T2 = tiles(140), T4 = tiles(275), TS = tiles(275)
// The table's little tiles (Screen 6), 14 px a unit, centred on x = 58.
const icon = (p: Pt[], cy: number) => { const w = Math.max(...p.map(q => q[0])), h = Math.max(...p.map(q => q[1])); return place(p, 58 - (w * 14) / 2, cy - (h * 14) / 2, 14) }
const ROW = [125, 210, 295]
const yes = (at: At, x: number, y: number, c: ChalkColor) => tick(at, x - 14, y, c)
const no = (at: At, x: number, y: number) => write(at, 'no', x, y, 26, 'd')

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // 4 sides is not enough
  [
    ...drawTiles([0, 'tile'], T2),
    ...T2.map(p => ({ ...write([0, '4'], '4 sides', midX(p), 215, 22, 'd'), quick: true })),
    write([2, 'No'], '4 sides is not enough', 300, 300, 32),
    write([2, 'closer'], 'look closer', 300, 350, 28, 'd'),
  ],
  // The big idea: the sides, and the corners
  [
    write([0, 'two'], 'check 2 things', 300, 45, 26, 'd'),
    poly([0, 'two'], rectPts(90, 110, 1, 1, 180)),
    { ...line([0, 'sides'], [[90, 110], [270, 110], [270, 290], [90, 290], [90, 110]], 'b'), w: 4.5 },
    write([0, 'sides'], '4 sides', 445, 145, 28, 'b'), write([0, 'length'], 'same length?', 445, 182, 28, 'b'),
    ...([[90, 110], [270, 110], [270, 290], [90, 290]] as Pt[]).map(([x, y]) => ({ ...ring([0, 'corners'], x, y, 15, 15, 'y'), quick: true })),
    write([0, 'corners'], '4 corners', 445, 255, 28, 'y'), write([0, 'square'], 'square corners?', 445, 292, 28, 'y'),
  ],
  // Look at the corners
  [
    ...drawTiles([0, 'corners'], T4),
    poly([1, 'book'], rectPts(95, 45, 1, 1.3, 90)), line([1, 'book'], [[110, 45], [110, 162]], 'd'),
    corners([1, 'mark'], rectPts(95, 45, 1, 1.3, 90), [2], 'y', 16),
    write([1, 'small'], '= square corner', 330, 105, 32, 'y'),
    corners([2, 'mark'], T4[0], [0, 1, 2, 3]), corners([2, 'mark'], T4[1], [0, 1, 2, 3]),
  ],
  // Look at the sides
  [
    ...drawTiles([0, 'sides'], TS),
    line([1, 'side'], [[80, 70], [230, 70]]), line([1, 'side'], [[80, 125], [230, 125]]),
    sideTicks([1, 'tick'], [[80, 70], [230, 70]], [0]), sideTicks([1, 'tick'], [[80, 125], [230, 125]], [0]),
    write([1, 'matches'], '= same length', 400, 98, 32, 'b'),
    sideTicks([2, 'first'], TS[0], [0, 1, 2, 3]), sideTicks([2, 'leaning'], TS[2], [0, 1, 2, 3]),
  ],
  // Put it together
  [
    write([0, 'tile'], '4 equal sides', 330, 50, 22, 'b'), write([0, 'tile'], '4 square corners', 495, 50, 20, 'y'),
    line([0, 'tile'], [[25, 82], [575, 82]], 'd', 2),
    poly([1, 'square'], icon(SQ, ROW[0])), write([1, 'square'], 'square', 180, ROW[0], 28),
    yes([1, 'sides'], 330, ROW[0], 'b'), yes([1, 'corners'], 495, ROW[0], 'y'),
    poly([2, 'rectangle'], icon(RECT, ROW[1])), write([2, 'rectangle'], 'rectangle', 180, ROW[1], 28),
    yes([2, 'corners'], 495, ROW[1], 'y'), no([2, 'not'], 330, ROW[1]),
    poly([3, 'leaning'], icon(LEAN, ROW[2])), write([3, 'leaning'], 'leaning tile', 180, ROW[2], 28),
    yes([3, 'sides'], 330, ROW[2], 'b'), no([3, 'not'], 495, ROW[2]),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'square'], 'a square is not a rectangle', 300, 165, 30), cross([1, 'rectangle'], 100, 140, 400, 50),
    poly([2, 'has'], rectPts(95, 225, 1, 1, 120)),
    corners([2, 'corners'], rectPts(95, 225, 1, 1, 120), [0, 1, 2, 3], 'y', 14),
    write([2, 'too'], 'a rectangle too', 400, 285, 34, 'y'),
  ],
]
