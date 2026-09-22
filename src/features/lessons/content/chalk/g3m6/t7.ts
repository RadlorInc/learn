/** g3m6-t7's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'
import { poly, rectPts, type At } from './t5'
// Colours across these boards: yellow = the fence and its length, blue = the squares inside, coral = the mix-up.

/** The squares inside a w × h garden: its inside grid lines, one stroke. */
const inside = ([beat, at]: At, x: number, y: number, w: number, h: number, u: number, c: ChalkColor = 'b'): ChalkMark => ({
  beat, at, c, w: 2.4,
  d: [...Array.from({ length: w - 1 }, (_, i) => `M${x + (i + 1) * u} ${y} v${h * u}`), ...Array.from({ length: h - 1 }, (_, i) => `M${x} ${y + (i + 1) * u} h${w * u}`)].join(' ') || `M${x} ${y} h0`,
})
interface G { x: number; y: number; w: number; h: number }
const U = 40
const A: G = { x: 60, y: 130, w: 5, h: 1 }, B: G = { x: 380, y: 110, w: 4, h: 2 }, C: G = { x: 80, y: 120, w: 3, h: 3 }
const fence = (at: At, g: G, c: ChalkColor = 'y', u = U) => ({ ...poly(at, rectPts(g.x, g.y, g.w, g.h, u), c), w: 4, quick: true })
const grid = (at: At, g: G, u = U) => inside(at, g.x, g.y, g.w, g.h, u)
/** Side labels: top and left, or all four. */
const labels = (at: At, g: G, all = false, s = 22): ChalkMark[] => {
  const cx = g.x + (g.w * U) / 2, cy = g.y + (g.h * U) / 2, top = `${g.w} ft`, left = `${g.h} ft`
  const ls: [string, number, number][] = [[top, cx, g.y - s], [left, g.x - s * 1.25, cy]]
  if (all) ls.push([top, cx, g.y + g.h * U + s], [left, g.x + g.w * U + s * 1.25, cy])
  return ls.map(([t, x, y]) => ({ ...write(at, t, x, y, s, 'd'), quick: true }))
}
const midA = A.x + (A.w * U) / 2, midB = B.x + (B.w * U) / 2

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Same fence, same inside?
  [
    fence([0, 'fence'], A), fence([0, 'fence'], B), ...labels([0, 'fence'], A), ...labels([0, 'fence'], B),
    { ...write([0, 'fence'], '12 ft of fence', midA, 235, 22, 'y'), quick: true }, write([0, 'fence'], '12 ft of fence', midB, 235, 22, 'y'),
    write([0, 'inside'], 'same room inside?', 300, 305, 34),
    write([1, 'count'], '?', midA, 150, 30, 'b'), write([1, 'count'], '?', midB, 150, 30, 'b'),
  ],
  // The big idea: same fence, different inside
  [
    fence([0, 'gardens'], A, 'w'), fence([0, 'gardens'], B, 'w'),
    fence([0, 'fence'], A), fence([0, 'fence'], B),
    { ...write([0, 'fence'], 'same fence', midA, 220, 26, 'y'), quick: true }, write([0, 'fence'], 'same fence', midB, 220, 26, 'y'),
    grid([0, 'squares'], A), grid([0, 'squares'], B),
    write([0, 'inside'], 'different inside', 300, 310, 36, 'b'),
  ],
  // Walk the fence
  [
    fence([0, 'fences'], A, 'w'), fence([0, 'fences'], B, 'w'), ...labels([0, 'fences'], A, true, 20), ...labels([0, 'fences'], B, true, 20),
    fence([1, 'Walk'], A), write([1, '12'], '5 + 1 + 5 + 1 = 12', midA, 255, 26, 'y'),
    fence([2, 'wider'], B), write([2, '12'], '4 + 2 + 4 + 2 = 12', midB, 255, 26, 'y'),
    write([3, 'Both'], 'same fence: 12 ft', 300, 335, 34, 'y'),
  ],
  // Count the squares inside
  [
    fence([0], A), fence([0], B), ...labels([0], A), ...labels([0], B),
    grid([1, 'row'], A), write([1, 'squares'], '5 squares', midA, 225, 30, 'b'),
    grid([2, 'rows'], B), write([2, 'squares'], '8 squares', midB, 225, 30, 'b'),
    write([3, 'not'], 'same fence, not the same inside', 300, 320, 30),
  ],
  // One more garden
  [
    fence([0, 'garden'], C), ...labels([0, 'garden'], C, false, 24),
    write([0, '12'], '3 + 3 + 3 + 3 = 12 ft', 410, 140, 28, 'y'),
    grid([1, 'rows'], C), write([1, 'squares'], '9 squares', 410, 205, 32, 'b'),
    ...[['5', 320], ['8', 410], ['9', 500]].map(([t, x]) => ({ ...write([2, 'most'], t as string, x as number, 305, 40, 'b'), quick: true })),
    write([2, 'three'], 'squares in each garden', 410, 355, 22, 'd'), ring([2, 'three'], 500, 305, 30, 30, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'same'], 'same fence = same inside', 300, 160, 30), cross([1, 'NOT'], 110, 138, 380, 44),
    write([2, 'fence'], '12 ft of fence each', 300, 208, 22, 'd'),
    fence([2, 'fence'], { x: 60, y: 255, w: 5, h: 1 }, 'y', 20), fence([2, 'fence'], { x: 260, y: 245, w: 4, h: 2 }, 'y', 20), fence([2, 'fence'], { x: 450, y: 235, w: 3, h: 3 }, 'y', 20),
    { ...inside([2, '5'], 60, 255, 5, 1, 20), quick: true }, write([2, '5'], '5', 110, 310, 30, 'b'),
    { ...inside([2, '8'], 260, 245, 4, 2, 20), quick: true }, write([2, '8'], '8', 300, 310, 30, 'b'),
    { ...inside([2, '9'], 450, 235, 3, 3, 20), quick: true }, write([2, '9'], '9', 480, 310, 30, 'b'),
    write([2, 'count'], 'count the squares', 300, 362, 30, 'y'),
  ],
]
