/** g4m5-t2's chalkboards: index = screen index (0 is Screen 1, which has none). Also the angle helpers t3–t4 draw with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'
// Colours across these boards: white = the angle, blue = the square corner held up to it, yellow = its name, coral = the mix-up.

export type At = [number, string?]
export type Pt = [number, number]
const r1 = (n: number) => Math.round(n * 10) / 10
/** The point `r` from the corner (x, y) at `deg` — 0 points right, and it counts up the way a protractor does. */
export const pt = (x: number, y: number, deg: number, r: number): Pt =>
  [r1(x + r * Math.cos((deg * Math.PI) / 180)), r1(y - r * Math.sin((deg * Math.PI) / 180))]
const P = (p: Pt) => p.join(' ')
/** An angle of `deg` at its TRUE size, corner at (x, y): one stroke out of the first ray's tip, into the corner, out along the second. */
export const angle = ([beat, at]: At, x: number, y: number, deg: number, len: number, c: ChalkColor = 'w', from = 0): ChalkMark =>
  ({ beat, at, c, d: `M${P(pt(x, y, from, len))} L${x} ${y} L${P(pt(x, y, from + deg, len))}` })
/** One ray out of the corner at `deg`. */
export const ray = ([beat, at]: At, x: number, y: number, deg: number, len: number, c: ChalkColor = 'w', w?: number): ChalkMark =>
  ({ beat, at, c, w, d: `M${x} ${y} L${P(pt(x, y, deg, len))}` })
/** The arc that shows how wide an angle opens, from `from` to `to` degrees, `r` from the corner. */
export const arc = ([beat, at]: At, x: number, y: number, r: number, from: number, to: number, c: ChalkColor = 'w', w = 2.6): ChalkMark =>
  ({ beat, at, c, w, d: `M${P(pt(x, y, from, r))} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 0 ${P(pt(x, y, to, r))}` })
/** The little square that marks a square corner, between the rays at `from` and `from + 90`. */
export const sq = ([beat, at]: At, x: number, y: number, from = 0, s = 20, c: ChalkColor = 'b'): ChalkMark => {
  const a = pt(x, y, from, s), b = pt(x, y, from + 90, s)
  return { beat, at, c, w: 2.6, d: `M${P(a)} L${r1(a[0] + b[0] - x)} ${r1(a[1] + b[1] - y)} L${P(b)}` }
}
/** A square corner held up to an angle: the upright ray, thin, and its little square. */
const held = (at: At, x: number, y: number, len: number): ChalkMark[] => [ray(at, x, y, 90, len, 'b', 2.6), sq(at, x, y)]

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Long rays do not matter
  [
    angle([0, 'long'], 70, 300, 20, 460), write([0, 'rays'], 'long rays', 300, 345, 26, 'd'),
    arc([1, 'barely'], 70, 300, 90, 0, 20),
    write([2, 'wide'], 'how wide it opens', 300, 70, 34, 'y'),
  ],
  // The big idea: hold it up to a square corner
  [
    { ...line([0, 'corner'], [[270, 45], [270, 115], [340, 115]], 'b'), quick: true }, sq([0, 'corner'], 270, 115, 0, 16),
    angle([0, 'narrower'], 40, 300, 50, 130), ...held([0, 'narrower'], 40, 300, 110), write([0, 'acute'], 'acute', 110, 350, 32, 'y'),
    angle([0, 'same'], 240, 300, 90, 130), sq([0, 'same'], 240, 300), write([0, 'right'], 'right', 305, 350, 32, 'y'),
    angle([0, 'wider'], 460, 300, 130, 115), ...held([0, 'wider'], 460, 300, 110), write([0, 'obtuse'], 'obtuse', 490, 350, 32, 'y'),
  ],
  // A square corner
  [
    line([0, 'book'], [[70, 90], [230, 90], [230, 300], [70, 300], [70, 90]]), line([0, 'book'], [[88, 90], [88, 300]], 'd', 2.4),
    ring([0, 'book'], 70, 300, 18, 18, 'b'),
    angle([1, 'square'], 340, 300, 90, 220), write([1, 'right'], 'right angle', 450, 352, 32, 'y'),
    sq([1, 'marks'], 70, 300, 0, 24), sq([1, 'marks'], 340, 300, 0, 24),
  ],
  // Narrower
  [
    angle([0], 150, 320, 50, 280), ...held([0, 'corner'], 150, 320, 220),
    arc([1, 'less'], 150, 320, 70, 0, 50),
    write([1, 'narrower'], 'narrower', 470, 170, 30, 'd'), write([1, 'acute'], 'acute', 470, 225, 38, 'y'),
  ],
  // Wider
  [
    angle([0], 330, 320, 130, 230), arc([0, 'more'], 330, 320, 55, 0, 130),
    ...held([1, 'corner'], 330, 320, 210), arc([1, 'extra'], 330, 320, 100, 90, 130, 'w', 3.4), write([1, 'extra'], 'extra', 285, 185, 24, 'd'),
    write([2, 'Wider'], 'wider', 120, 250, 30, 'd'), write([2, 'obtuse'], 'obtuse', 120, 300, 38, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    angle([1, 'Long'], 40, 250, 25, 250),
    write([1, 'obtuse'], 'long rays, so obtuse', 165, 300, 24, 'r'), cross([1, 'obtuse'], 40, 282, 250, 36),
    angle([2, 'opening'], 480, 250, 130, 90), arc([2, 'opening'], 480, 250, 35, 0, 130),
    ...held([2, 'corner'], 480, 250, 80), write([2, 'corner'], 'wide opening, so obtuse', 440, 300, 24, 'y'),
  ],
]
