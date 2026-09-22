/** g4m5-t6's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cross } from '../../../chalk'
import { warn, tick } from '../g3m1/t1'
import { poly, type At, type Pt } from '../g3m6/t5'
import { arc, inAngle, sq } from './t5'
// Colours across these boards: yellow = the biggest angle and the name it gives, blue = the angles we look at, coral = the mix-up.

/** A triangle on a base L units long, angle a at the left corner and b at the right, base left end at (x, y), u px a unit. Corners: left, right, top. */
const tri = (a: number, b: number, L: number, x: number, y: number, u: number): Pt[] => {
  const ta = Math.tan((a * Math.PI) / 180), tb = Math.tan((b * Math.PI) / 180)
  const px = a === 90 ? 0 : (L * tb) / (ta + tb), h = a === 90 ? L * tb : px * ta
  const r = (n: number) => Math.round(n * 10) / 10
  return [[x, y], [r(x + L * u), y], [r(x + px * u), r(y - h * u)]]
}
/** The arc at corner i of triangle t. */
const at3 = (at: At, t: Pt[], i: number, r = 26, c: ChalkColor = 'b') => arc(at, t[i], t[(i + 1) % 3], t[(i + 2) % 3], r, c)
/** An angle's label, `d` px into corner i. */
const lab = (at: At, t: Pt[], i: number, s: string, d: number, size = 22, c: ChalkColor = 'w') => {
  const [x, y] = inAngle(t[i], t[(i + 1) % 3], t[(i + 2) % 3], d)
  return write(at, s, x, y, size, c)
}
/** A lone angle, for comparing: vertex v, one arm along the ground, the other `deg` up from it. */
const wedge = (at: At, v: Pt, deg: number, len: number, c: ChalkColor): ChalkMark[] => {
  const b: Pt = [v[0] + len * Math.cos((deg * Math.PI) / 180), v[1] - len * Math.sin((deg * Math.PI) / 180)], a: Pt = [v[0] + len, v[1]]
  return [line(at, [b, v, a]), deg === 90 ? sq(at, a, v, b, c, 16) : arc(at, v, a, b, 22, c)]
}

// Screen 2's three triangles; Screen 3's right, obtuse and acute.
const S2 = [tri(60, 55, 4, 39, 200, 34), tri(90, 50, 4, 215, 200, 34), tri(25, 35, 5, 391, 200, 34)]
const S3 = [tri(90, 35, 4, 34, 240, 36), tri(25, 35, 5, 228, 240, 36), tri(70, 70, 3, 458, 240, 36)]
const mid = (t: Pt[]) => (t[0][0] + t[1][0]) / 2
const RIGHT = tri(90, 35, 6, 60, 320, 45), WIDE = tri(25, 35, 6, 75, 200, 75), ACUTE = tri(70, 70, 4, 80, 260, 40)
const SMALL = tri(25, 35, 6, 30, 330, 48)

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Counting won't sort them
  [
    ...S2.map(t => ({ ...poly([0, 'Count'], t), quick: true })),
    ...S2.map(t => ({ ...write([0, '3'], '3 sides', mid(t), 235, 22, 'd'), quick: true })),
    ...S2.map(t => ({ ...write([1, '3'], '3 corners', mid(t), 268, 22, 'd'), quick: true })),
    ...S2.flatMap(t => [0, 1, 2].map(i => ({ ...at3([2, 'angles'], t, i, 18), quick: true }))),
    write([2, 'size'], 'the size of the angles', 300, 340, 30, 'b'),
  ],
  // The big idea: the biggest angle names it
  [
    ...S3.map(t => ({ ...poly([0, 'Find'], t), quick: true })),
    sq([0, 'square'], S3[0][1], S3[0][0], S3[0][2], 'y'), write([0, 'square'], 'square', mid(S3[0]), 290, 22, 'd'),
    write([0, 'right'], 'right', mid(S3[0]), 335, 32, 'y'),
    at3([0, 'wider'], S3[1], 2, 18, 'y'), write([0, 'wider'], 'wider', mid(S3[1]), 290, 22, 'd'),
    write([0, 'obtuse'], 'obtuse', mid(S3[1]), 335, 32, 'y'),
    at3([0, 'narrower'], S3[2], 0, 20, 'y'), write([0, 'narrower'], 'narrower', mid(S3[2]), 290, 22, 'd'),
    write([0, 'acute'], 'acute', mid(S3[2]), 335, 32, 'y'),
  ],
  // A square corner
  [
    poly([0, 'Find'], RIGHT),
    sq([1, 'corner'], RIGHT[1], RIGHT[0], RIGHT[2], 'y', 22),
    lab([2, '90'], RIGHT, 0, '90°', 50, 26, 'y'), write([2, 'right'], 'right angle', 470, 170, 30),
    write([3, 'triangle'], 'right triangle', 470, 260, 34, 'y'),
  ],
  // Wider than a square corner
  [
    poly([0, 'Next'], WIDE),
    at3([0, '25'], WIDE, 0, 40), lab([0, '25'], WIDE, 0, '25°', 75),
    at3([0, '35'], WIDE, 1, 40), lab([0, '35'], WIDE, 1, '35°', 70),
    at3([0, '120'], WIDE, 2, 22), lab([0, '120'], WIDE, 2, '120°', 44),
    at3([1, 'biggest'], WIDE, 2, 22, 'y'), at3([1, '120'], WIDE, 2, 28, 'y'),
    ...wedge([2, 'wider'], [210, 330], 120, 80, 'y'), write([2, 'wider'], '120°', 245, 296, 22, 'y'),
    write([2, 'wider'], 'wider than', 345, 305, 22, 'd'),
    ...wedge([2, '90'], [410, 330], 90, 80, 'b'), write([2, '90'], '90°', 450, 300, 22, 'b'),
    tick([2, 'Yes'], 530, 300),
    write([3, 'obtuse'], 'obtuse triangle', 300, 372, 30, 'y'),
  ],
  // All narrow
  [
    poly([0, 'Last'], ACUTE),
    at3([0, '70'], ACUTE, 0, 26), lab([0, '70'], ACUTE, 0, '70°', 52),
    at3([0, '70'], ACUTE, 1, 26), lab([0, '70'], ACUTE, 1, '70°', 52),
    at3([0, '40'], ACUTE, 2, 26), lab([0, '40'], ACUTE, 2, '40°', 60, 20),
    at3([1, 'biggest'], ACUTE, 0, 32, 'y'), at3([1, 'biggest'], ACUTE, 1, 32, 'y'),
    ...wedge([1, 'narrower'], [340, 240], 70, 90, 'y'), write([1, 'narrower'], '70°', 380, 205, 22, 'y'),
    ...wedge([1, '90'], [470, 240], 90, 90, 'b'), write([1, '90'], '90°', 510, 210, 22, 'b'),
    write([2, 'acute'], 'acute triangle', 300, 330, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'name'], 'a small angle → acute', 300, 150, 30), cross([1, 'SMALL'], 130, 128, 340, 44),
    poly([1, 'Every'], SMALL),
    at3([1, 'small'], SMALL, 0, 40), lab([1, 'small'], SMALL, 0, '25°', 88, 20), at3([1, 'small'], SMALL, 1, 40), lab([1, 'small'], SMALL, 1, '35°', 80, 20),
    at3([2, 'biggest'], SMALL, 2, 18, 'y'), lab([2, 'biggest'], SMALL, 2, '120°', 42, 20, 'y'),
    write([2, 'names'], '120° → obtuse', 455, 290, 32, 'y'),
  ],
]
