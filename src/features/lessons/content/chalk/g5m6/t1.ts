/** g5m6-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Across blue, up white, the found point yellow, the mix-up coral. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, arrow, ring, cross as crossMark, hop } from '../../../chalk'
import { warn } from '../g3m1/t1'

export type At = [number, string?]
export const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

/** A grid 0…max both ways at true, even spacing: 0 at (ox, oy), `u` px a step. */
export const makeGrid = (ox: number, oy: number, u: number, max = 6) => {
  const X = (x: number) => ox + x * u, Y = (y: number) => oy - y * u
  const s = u >= 44 ? 20 : 18
  const draw = ([beat, at]: At): ChalkMark[] => [
    q({ beat, at, c: 'd', w: 1.5, d: range(1, max).map(i => `M${X(i)} ${Y(0)} V${Y(max)} M${X(0)} ${Y(i)} H${X(max)}`).join(' ') }),
    q({ beat, at, d: `M${X(0)} ${Y(max) - 14} V${Y(0)} H${X(max) + 14}` }),
    ...range(0, max).map(i => q(write([beat, at], String(i), X(i), Y(0) + s + 4, s, 'd'))),
    ...range(1, max).map(i => q(write([beat, at], String(i), X(0) - s, Y(i), s, 'd'))),
  ]
  /** A chalk dot on the crossing (x, y). */
  const dot = ([beat, at]: At, x: number, y: number, c: ChalkColor = 'y'): ChalkMark =>
    ({ beat, at, c, w: 12, d: `M${X(x) - 2} ${Y(y)} a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0` })
  const name = (at: At, t: string, x: number, y: number, c: ChalkColor = 'w') => write(at, t, X(x) + 24, Y(y) - 22, u >= 44 ? 24 : 20, c)
  const across = (at: At, from: number, to: number, y = 0, c: ChalkColor = 'b'): ChalkMark => ({ ...arrow(at, [X(from), Y(y)], [X(to), Y(y)], c), w: 5 })
  const up = (at: At, x: number, from: number, to: number, c: ChalkColor = 'w'): ChalkMark => ({ ...arrow(at, [X(x), Y(from)], [X(x), Y(to)], c), w: 5 })
  /** One counted step across (a hop over the bottom) or up (a hop bulging right). */
  const stepAcross = (at: At, i: number, c: ChalkColor = 'b') => hop(at, X(i - 1), X(i), Y(0), c)
  const stepUp = ([beat, at]: At, x: number, i: number, c: ChalkColor = 'w'): ChalkMark => {
    const x0 = X(x), y0 = Y(i - 1), y1 = Y(i)
    return { beat, at, c, d: `M${x0} ${y0} Q${x0 + u * 0.6} ${(y0 + y1) / 2} ${x0} ${y1} M${x0 + 10} ${y1 + 9} L${x0} ${y1} L${x0 + 12} ${y1 - 3}` }
  }
  const corner = (at: At, c: ChalkColor = 'b') => ring(at, X(0), Y(0), 15, 15, c)
  /** A dashed line: "right under it". */
  const dash = ([beat, at]: At, x: number, y0: number, y1: number): ChalkMark =>
    ({ beat, at, c: 'd', w: 2.5, d: range(1, Math.floor((Y(y1) - Y(y0)) / 16) - 1).map(k => `M${X(x)} ${Y(y0) + k * 16} v9`).join(' ') })
  return { X, Y, draw, dot, name, across, up, stepAcross, stepUp, corner, dash }
}

/** The teaching grid: 0 at (70, 345), 46 px a step, so 0–6 fills x 70–346; the right side (x 380–590) is for writing. */
export const G = makeGrid(70, 345, 46)
/** The small grid under Screen 7's warning sign: 0 at (70, 355), 36 px a step; write at x ≈ 455. */
export const S = makeGrid(70, 355, 36)
/** A pair written piece by piece, so each number can be ringed: `(a, b)` centred on x. */
export const pairAt = (x: number, s: number) => ({ a: x - s * 0.65, b: x + s * 0.65 })
export const pair = (at: At, a: string, b: string, x: number, y: number, s = 40, ca: ChalkColor = 'w', cb: ChalkColor = 'w'): ChalkMark[] => {
  const p = pairAt(x, s)
  return [q(write(at, '(', x - s * 1.3, y, s)), q(write(at, a, p.a, y, s, ca)), q(write(at, ',', x - s * 0.2, y + s * 0.15, s)),
    q(write(at, b, p.b, y, s, cb)), q(write(at, ')', x + s * 1.3, y, s))]
}
/** The mix-up crossed out, thin enough that what it crosses can still be read. */
export const cross = (at: At, x: number, y: number, w: number, h: number): ChalkMark => ({ ...crossMark(at, x, y, w, h), w: 3 })
export { warn }

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Pointing is not enough
  [
    ...G.draw([0, 'Could']), G.dot([0, 'point'], 3, 5, 'w'), G.name([0, 'point'], 'A', 3, 5),
    ring([0, 'middle'], G.X(3), G.Y(4), 88, 64, 'r'),
    ...[[2, 4], [4, 4], [3, 3], [2, 5], [4, 5]].map(([x, y]) => q(write([1, 'spots'], '?', G.X(x) + 14, G.Y(y) + 14, 22, 'r'))),
    write([2, 'two'], '2 numbers', 485, 150, 30),
    write([2, 'order'], 'in order', 485, 200, 30),
  ],
  // The big idea: across first, then up
  [
    ...G.draw([0, 'Go']),
    G.across([0, 'across'], 0, 3), G.up([0, 'up'], 3, 0, 5),
    write([0, '3'], '3 across', 485, 150, 30, 'b'), write([0, '5'], '5 up', 485, 200, 30),
    G.dot([0, 'point'], 3, 5), G.name([0, 'point'], 'A', 3, 5, 'y'), ...pair([0, 'point'], '3', '5', 485, 285, 44, 'y', 'y'),
  ],
  // Go across first
  [
    ...G.draw([0, 'Start']), G.dot([0, 'Start'], 3, 5, 'w'), G.name([0, 'Start'], 'A', 3, 5), G.corner([0, 'corner']),
    G.dash([1, 'under'], 3, 5, 0),
    G.stepAcross([2, 'One'], 1), G.stepAcross([2, 'two'], 2), G.stepAcross([2, 'three'], 3),
    G.across([2, 'across'], 0, 3), write([2, 'across'], '3 across', 485, 200, 30, 'b'),
  ],
  // Then go up
  [
    ...G.draw([0, 'Now']), G.dot([0, 'Now'], 3, 5, 'w'), G.name([0, 'Now'], 'A', 3, 5),
    q(G.across([0, 'Now'], 0, 3)), q(write([0, 'Now'], '3 across', 485, 150, 30, 'b')),
    G.stepUp([1, 'One'], 3, 1), G.stepUp([1, 'two'], 3, 2), G.stepUp([1, 'three'], 3, 3), G.stepUp([1, 'four'], 3, 4), G.stepUp([1, 'five'], 3, 5),
    G.up([2, 'land'], 3, 0, 5), ring([2, 'A'], G.X(3), G.Y(5), 17, 17, 'y'),
    write([2, 'up'], '5 up', 485, 200, 30),
  ],
  // Write the two numbers
  [
    ...G.draw([0, 'Two']), G.dot([0, 'Two'], 3, 5, 'w'), G.name([0, 'Two'], 'A', 3, 5),
    G.across([0, 'moves'], 0, 3), G.up([0, 'moves'], 3, 0, 5),
    write([0, 'numbers'], '3 across', 485, 100, 28, 'b'), write([0, 'numbers'], '5 up', 485, 145, 28),
    write([1, 'first'], '1st', 435, 205, 22, 'd'), write([1, 'first'], '3', 435, 245, 40, 'b'),
    write([1, 'second'], '2nd', 535, 205, 22, 'd'), write([1, 'second'], '5', 535, 245, 40),
    G.dot([2, 'A'], 3, 5), ...pair([2, 'at'], '3', '5', 485, 325, 44, 'y', 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...S.draw([1, "Don't"]), S.dot([1, "Don't"], 3, 5, 'w'), S.name([1, "Don't"], 'A', 3, 5),
    ...pair([1, 'UP'], '5', '3', 455, 175, 38, 'r', 'r'), cross([1, 'first'], 395, 148, 120, 54),
    S.across([2, '5'], 0, 5, 0, 'r'), S.up([2, 'up'], 5, 0, 3, 'r'), S.dot([2, 'spot'], 5, 3, 'r'),
    S.across([2, 'goes'], 0, 3), S.up([2, 'goes'], 3, 0, 5), S.dot([2, 'first'], 3, 5),
    write([2, 'first'], 'across first', 455, 285, 32, 'y'),
  ],
]
