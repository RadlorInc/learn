/** g8m4-t1's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A grid with its two axes on the left, the numbers on the right. White = the triangle, yellow = where it lands. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, arrow, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'

export type At = [number, string?]
export type Pt = [number, number]

/** A grid of whole squares from `min` to `max` on both axes, origin at (ox, oy), `u` px a square. Returns the point mapper too. */
export function grid(at: At, ox: number, oy: number, u: number, min: number, max: number): { marks: ChalkMark[]; p: (x: number, y: number) => Pt } {
  const p = (x: number, y: number): Pt => [ox + x * u, oy - y * u]
  let d = ''
  for (let v = min; v <= max; v++) {
    const [x1, y1] = p(v, min), [, y2] = p(v, max), [a, b] = p(min, v), [c] = p(max, v)
    d += `M${x1} ${y1} V${y2} M${a} ${b} H${c} `
  }
  const nums: ChalkMark[] = []
  for (let v = min; v <= max; v++) {
    if (v === 0 || v % 2) continue
    const t = String(v).replace('-', '−'), [x] = p(v, 0), [, y] = p(0, v)
    nums.push({ ...write(at, t, x, oy + 16, 18, 'd'), quick: true }, { ...write(at, t, ox - 16, y, 18, 'd'), quick: true })
  }
  return {
    p,
    marks: [
      { beat: at[0], at: at[1], c: 'd', w: 1.2, d: d.trim(), quick: true },
      { ...line(at, [p(min, 0), p(max, 0)], 'w', 2.6), quick: true },
      { ...line(at, [p(0, min), p(0, max)], 'w', 2.6), quick: true },
      ...nums,
    ],
  }
}
/** A closed triangle (or any polygon) through the points. */
export const tri = (at: At, pts: Pt[], c: ChalkColor = 'w'): ChalkMark => line(at, [...pts, pts[0]], c)
/** A corner's name, `dx`/`dy` px away from it. */
export const name = (at: At, t: string, [x, y]: Pt, dx: number, dy: number, c: ChalkColor = 'd'): ChalkMark =>
  ({ ...write(at, t, x + dx, y + dy, 20, c), quick: true })

// 0 to 8, 36 px a square, origin at (40, 360): the grid fills the left half of the board.
const G = (at: At) => grid(at, 40, 360, 36, 0, 8)
const { p } = G([0])
const A = p(1, 1), B = p(3, 1), C = p(1, 3)
const A2 = p(5, 3), B2 = p(7, 3), C2 = p(5, 5)
const ABC = (at: At): ChalkMark[] => [tri(at, [A, B, C]), name(at, 'A', A, -14, 16), name(at, 'B', B, 12, 16), name(at, 'C', C, -14, -12)]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Dragging is not exact: where exactly? every corner needs a new spot
  [
    ...G([0, 'drag']).marks, tri([0, 'drag'], [A, B, C]),
    arrow([0, 'across'], p(2, 2), p(6, 4), 'd'), write([0, 'hope'], '?', 272, 196, 34, 'r'),
    write([1, 'exactly'], 'where exactly?', 470, 110, 30),
    ...[A, B, C].map(q => ({ ...ring([2, 'corner'], q[0], q[1], 10, 10), quick: true })),
    write([2, 'corner'], '3 corners', 470, 190, 28, 'y'), write([2, 'corner'], '3 new spots', 470, 230, 28, 'y'),
  ],
  // The big idea: three arrows, all the same length, all the same way
  [
    ...G([0, 'slide']).marks, ...ABC([0, 'slide']),
    arrow([0, 'point'], A, A2, 'y'), arrow([0, 'point'], B, B2, 'y'), arrow([0, 'point'], C, C2, 'y'),
    write([0, 'distance'], 'same distance', 470, 150, 30, 'y'),
    write([0, 'direction'], 'same direction', 470, 200, 30, 'y'), tri([0, 'direction'], [A2, B2, C2], 'y'),
  ],
  // Follow one corner: 4 right changes x, 2 up changes y
  [
    ...G([0, 'corner']).marks, ...ABC([0, 'corner']),
    ring([0, 'A'], A[0], A[1], 11, 11), write([0, '(1,'], 'A (1, 1)', 470, 80, 30),
    arrow([1, 'right'], A, p(5, 1), 'b'), write([1, '5'], 'x: 1 → 5', 470, 150, 30, 'b'),
    arrow([2, 'up'], p(5, 1), A2, 'b'), write([2, '3'], 'y: 1 → 3', 470, 210, 30, 'b'),
    ring([3, 'lands'], A2[0], A2[1], 11, 11), name([3, 'prime'], 'A′', A2, 16, -14, 'y'),
    write([3, 'prime'], 'A′ (5, 3)', 470, 290, 36, 'y'),
  ],
  // Every corner moves the same: B and C follow A
  [
    ...G([0, 'other']).marks, ...ABC([0, 'other']), arrow([0, 'other'], A, A2, 'd'),
    arrow([1, 'B'], B, B2, 'd'), write([1, 'B'], 'B (3, 1) → (7, 3)', 470, 80, 24),
    arrow([1, 'C'], C, C2, 'd'), write([1, 'C'], 'C (1, 3) → (5, 5)', 470, 125, 24),
    tri([1, 'C'], [A2, B2, C2], 'y'),
    write([2, 'Every'], 'every corner:', 470, 195, 24, 'd'), write([2, 'up'], '4 right, 2 up', 470, 232, 30, 'y'),
    write([3, 'same'], 'same triangle,', 470, 300, 28), write([3, 'moved'], 'just moved', 470, 340, 28),
  ],
  // Right and up add: the rule for every point
  [
    write([0, 'rule'], 'a rule for every point?', 300, 50, 32),
    arrow([1, 'Right'], [60, 125], [130, 125], 'b'), write([1, 'adds'], 'adds to x', 230, 125, 28),
    arrow([1, 'left'], [400, 125], [330, 125], 'b'), write([1, 'takes'], 'takes from x', 500, 125, 26),
    arrow([2, 'Up'], [95, 225], [95, 170], 'b'), write([2, 'adds'], 'adds to y', 230, 198, 28),
    arrow([2, 'down'], [365, 170], [365, 225], 'b'), write([2, 'takes'], 'takes from y', 500, 198, 26),
    write([3, 'right'], '4 right, 2 up', 300, 270, 26, 'd'),
    write([3, 'becomes'], '(x, y) → (x + 4, y + 2)', 300, 325, 36, 'y'),
  ],
  // One thing not to do: right/left is the FIRST number
  [
    ...warn([0, 'mix']),
    write([1, 'Right'], '(x, y)', 300, 160, 44),
    ring([1, 'FIRST'], 273, 160, 18, 22), write([1, 'FIRST'], 'right, left', 230, 205, 22, 'y'),
    ring([2, 'second'], 333, 160, 18, 22, 'b'), write([2, 'second'], 'up, down', 380, 205, 22, 'b'),
    write([3, '(5,'], '(1, 1) → (5, 3)', 300, 270, 34, 'y'),
    write([3, 'Not'], '(1, 1) → (3, 5)', 300, 330, 34), cross([3, 'Not'], 338, 312, 90, 36),
  ],
]
