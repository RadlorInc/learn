/** g6m6-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the shape helpers t2–t3 draw with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, cross } from '../../../chalk'
import { warn, tick } from '../g3m1/t1'
import { poly, corners, type At, type Pt } from '../g3m6/t5'
import { dashed } from '../g4m5/t5'
// Colours across these boards: blue = what we measure and the piece that moves, yellow = the result, coral = the mix-up.

/** Unit points (y UP, like the lesson's pictures) onto the board: x0 the left edge, yb the bottom line, u px a unit. */
export const on = (pts: Pt[], x0: number, yb: number, u: number): Pt[] => pts.map(([x, y]) => [x0 + x * u, yb - y * u])
/** A shape filled with a thin wash of colour. */
export const fill = (at: At, pts: Pt[], c: ChalkColor): ChalkMark => ({ ...poly(at, pts, c), wash: true })
/** The height: a dashed line from `top` straight down to `foot`, and the square-corner mark on the side toward `side`. */
export const height = (at: At, top: Pt, foot: Pt, side: Pt, c: ChalkColor = 'b'): ChalkMark[] =>
  [dashed(at, top, foot, c), { ...corners(at, [top, foot, side], [1], c, 13), quick: true }]

// The garden bed: base 6, height 4, leaning 3 (so its slanted side is 5). Cutting the triangle off the left end and
// moving it 6 to the right fills the gap at the right end exactly: the rectangle from x = 3 to 9.
const BED: Pt[] = [[0, 0], [6, 0], [9, 4], [3, 4]]
const LEFT: Pt[] = [[0, 0], [3, 0], [3, 4]]
const MOVED: Pt[] = [[6, 0], [9, 0], [9, 4]]
const RIGHT_END: Pt[] = [[6, 0], [9, 4], [6, 4]]
const RECT: Pt[] = [[3, 0], [9, 0], [9, 4], [3, 4]]
const HT: Pt[] = [[3, 4], [3, 0], [4, 0]]   // top, foot, and a point along the base (the side the corner mark goes)

/** Square tiles laid over the bed: every whole-unit line, cut off where it leaves the leaning shape. */
const tiles = (at: At, x0: number, yb: number, u: number): ChalkMark => {
  const seg = (a: Pt, b: Pt) => { const [p, q] = on([a, b], x0, yb, u); return `M${p.join(' ')} L${q.join(' ')}` }
  const rows = [1, 2, 3].map(y => seg([0.75 * y, y], [6 + 0.75 * y, y]))
  const cols = [1, 2, 3, 4, 5, 6, 7, 8].map(k => seg([k, Math.max(0, (k - 6) / 0.75)], [k, Math.min(4, k / 0.75)]))
  return { beat: at[0], at: at[1], c: 'd', w: 2, d: [...rows, ...cols].join(' ') }
}
const heightAt = (at: At, x0: number, yb: number, u: number, c: ChalkColor = 'b') => { const [t, f, s] = on(HT, x0, yb, u); return height(at, t, f, s, c) }

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Tiles don't fit
  [
    poly([0], on(BED, 120, 230, 40)), tiles([0, 'tiles'], 120, 230, 40),
    { ...fill([1, 'ends'], on(LEFT, 120, 230, 40), 'r'), quick: true }, fill([1, 'ends'], on(RIGHT_END, 120, 230, 40), 'r'),
    write([1, 'bits'], 'broken bits', 300, 285, 28, 'r'),
    write([2, 'better'], 'a better way?', 300, 345, 32),
  ],
  // The big idea: cut, slide, a rectangle → base × height
  [
    poly([0], on(BED, 120, 225, 40)),
    ...heightAt([0, 'Cut'], 120, 225, 40, 'w'),
    fill([0, 'triangle'], on(LEFT, 120, 225, 40), 'b'),
    arrow([0, 'slide'], [172, 258], [428, 258], 'b'),
    poly([0, 'other'], on(MOVED, 120, 225, 40), 'b'), fill([0, 'other'], on(MOVED, 120, 225, 40), 'b'),
    poly([0, 'rectangle'], on(RECT, 120, 225, 40), 'y'),
    write([0, 'base'], 'area = base × height', 300, 335, 34, 'y'),
  ],
  // Base and height
  [
    poly([0], on(BED, 98, 280, 45)),
    line([0, 'bottom'], on([[0, 0], [6, 0]], 98, 280, 45), 'b', 5), write([0, '6'], '6 cm', 233, 318, 28, 'b'),
    ...heightAt([1, 'height'], 98, 280, 45), write([1, '4'], '4 cm', 285, 190, 28, 'b'),
  ],
  // Cut and slide
  [
    poly([0], on(BED, 98, 250, 45)),
    ...heightAt([0, 'dashed'], 98, 250, 45, 'w'),
    fill([0, 'line'], on(LEFT, 98, 250, 45), 'b'),
    arrow([1, 'Slide'], [157, 285], [445, 285], 'b'),
    poly([1, 'other'], on(MOVED, 98, 250, 45), 'b'), fill([1, 'other'], on(MOVED, 98, 250, 45), 'b'),
    write([2, 'lost'], 'same ground', 300, 350, 32),
  ],
  // Now it's a rectangle
  [
    poly([0, 'rectangle'], on(RECT, 30, 240, 45)),
    poly([0, 'rectangle'], on(MOVED, 30, 240, 45), 'b'), fill([0, 'rectangle'], on(MOVED, 30, 240, 45), 'b'),
    write([0, '6'], '6 cm', 300, 272, 28), write([0, '4'], '4 cm', 482, 150, 28),
    write([1, '24'], '6 × 4 = 24', 225, 340, 36, 'y'), write([1, 'square'], 'square cm', 410, 340, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    poly([1, 'use'], on(BED, 50, 250, 22)),
    line([1, 'SLANTED'], on([[0, 0], [3, 4]], 50, 250, 22), 'r', 5), write([1, '5'], '5 cm', 48, 190, 24, 'r'),
    write([1, '30'], '6 × 5 = 30', 150, 310, 32, 'r'), cross([1, 'much'], 70, 290, 160, 40),
    poly([2, 'Use'], on(BED, 352, 250, 22)),
    ...heightAt([2, 'straight-up'], 352, 250, 22, 'y'), write([2, 'height'], '4 cm', 457, 205, 24, 'y'),
    write([2, '24'], '6 × 4 = 24', 450, 310, 32, 'y'), tick([2, '24'], 436, 355),
  ],
]
