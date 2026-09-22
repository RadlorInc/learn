/** g8m2-t1's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The ramp is the line through (1, 1), (3, 4), (5, 7) on a small grid at the left; words on the right.
 *  Blue is across (the run), yellow is up (the rise) and the answer, coral the mix-up, dim the axes. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, cross } from '../../../chalk'
import { warn } from '../g7m1/t1'

type At = [number, string?]
type Pt = [number, number]
export const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })

/** A graph whose origin is at board (ox, oy), `u` px per x and `v` px per y. Shared by t1, t3, t4. */
export const graph = (ox: number, oy: number, u: number, v: number) => {
  const X = (x: number) => ox + u * x, Y = (y: number) => oy - v * y
  const P = ([x, y]: Pt): Pt => [X(x), Y(y)]
  return {
    X, Y,
    /** The two axes, with `xs` and `ys` numbered (dim). */
    axes: (at: At, xs: number[], ys: number[]): ChalkMark[] => [
      line(at, [[X(0), Y(Math.max(...ys) + 0.6)], [X(0), Y(0)], [X(Math.max(...xs) + 0.6), Y(0)]], 'd'),
      ...xs.map(n => q(write(at, String(n), X(n), Y(0) + 20, 20, 'd'))),
      ...ys.map(n => q(write(at, String(n), X(0) - 18, Y(n), 20, 'd'))),
    ],
    /** A chalk dot at graph point (x, y). */
    dot: (at: At, x: number, y: number, c: ChalkColor = 'w', r = 7): ChalkMark[] => {
      const d = `M${X(x) - r} ${Y(y)} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`
      return [{ beat: at[0], at: at[1], d, c, wash: true, quick: true }, { beat: at[0], at: at[1], d, c, quick: true }]
    },
    seg: (at: At, pts: Pt[], c: ChalkColor = 'w', w?: number) => line(at, pts.map(P), c, w),
    /** One stair from (x, y): `a` across (blue), then `b` up (yellow). */
    stair: (at: At, up: At, x: number, y: number, a: number, b: number): ChalkMark[] =>
      [line(at, [P([x, y]), P([x + a, y])], 'b'), line(up, [P([x + a, y]), P([x + a, y + b])], 'y')],
  }
}

const G = graph(70, 360, 45, 38)
const { X, Y, axes, dot, seg, stair } = G
const grid = (at: At) => axes(at, [1, 2, 3, 4, 5, 6], [2, 4, 6, 8])
const ramp = (at: At, c: ChalkColor = 'w') => seg(at, [[1 / 3, 0], [5.6, 7.9]], c)
const two = (at: At) => [...dot(at, 1, 1), ...dot(at, 3, 4)]
const C = 470   // centre of the words column

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // "Quite steep" is not a number
  [
    ...grid([0, 'steep']), ramp([0, 'steep']),
    write([0, 'quite'], '"quite steep"', C, 90, 28, 'd'),
    write([1, 'number'], 'steep = ?', C, 160, 36, 'y'),
    arrow([2, 'forever'], [X(5.2), Y(7.3)], [X(5.9), Y(8.3)], 'b'),
    write([2, 'forever'], 'goes on forever', C, 240, 26, 'b'),
    write([2, 'height'], 'height? no top', C, 290, 26, 'r'),
  ],
  // The big idea: across, then up, then up ÷ across
  [
    ...grid([0, 'Go']), ramp([0, 'Go']), ...two([0, 'Go']),
    seg([0, 'across'], [[1, 1], [3, 1]], 'b'),
    seg([0, 'up'], [[3, 1], [3, 4]], 'y'),
    line([0, 'divide'], [[410, 185], [530, 185]]),
    write([0, 'rise'], 'rise', C, 150, 34, 'y'), q(write([0, 'rise'], 'rise', X(3) + 34, Y(2.5), 22, 'y')),
    write([0, 'run'], 'run', C, 220, 34, 'b'), q(write([0, 'run'], 'run', X(2), Y(1) + 22, 22, 'b')),
  ],
  // Go across first
  [
    ...grid([0, 'Start']), ramp([0, 'Start']),
    ...dot([0, '1'], 1, 1, 'y'), write([0, '1'], '(1, 1)', 160, 342, 22, 'y'),
    seg([1, 'right'], [[1, 1], [3, 1]], 'b'),
    ...dot([1, 'under'], 3, 4), write([1, 'under'], '(3, 4)', 150, 195, 22),
    write([2, '2'], '2', X(2), Y(1) - 20, 26, 'b'),
    write([2, 'run'], 'across = run', C, 150, 30, 'b'),
    write([2, 'run'], 'run = 2', C, 210, 36, 'b'),
  ],
  // Then go up
  [
    ...grid([0]), ramp([0]), ...two([0]),
    q(seg([0], [[1, 1], [3, 1]], 'b')), q(write([0], 'run = 2', C, 150, 30, 'b')),
    seg([0, 'climb'], [[3, 1], [3, 4]], 'y'),
    write([1, '3'], '3', X(3) + 22, Y(2.5), 26, 'y'),
    write([1, 'rise'], 'up = rise', C, 220, 30, 'y'),
    write([1, 'rise'], 'rise = 3', C, 280, 36, 'y'),
  ],
  // Divide, and every stair agrees
  [
    ...grid([0]), ramp([0]), ...two([0]), ...stair([0], [0], 1, 1, 2, 3).map(q),
    write([0, 'divide'], 'rise ÷ run', C, 60, 26, 'd'),
    write([0, '3'], '3 ÷ 2 =', C - 30, 115, 34), write([0, '3/2'], '3/2', C + 75, 115, 34, 'y'),
    seg([1, 'next'], [[3, 4], [5, 4]], 'b'), write([1, 'across'], '2', X(4), Y(4) + 20, 22, 'b'),
    seg([1, 'up'], [[5, 4], [5, 7]], 'y'), write([1, 'up'], '3', X(5) + 18, Y(5.5), 22, 'y'), ...dot([1, 'again'], 5, 7),
    write([2, 'everywhere'], 'every stair: 3/2', C, 220, 28, 'y'),
    write([2, 'climbs'], '2 across → 3 up', C, 290, 26),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'DOWN'], '2 ÷ 3 = 2/3', 300, 150, 34, 'r'), cross([1, 'gentler'], 414, 132, 36, 36),
    write([2, 'Up'], 'up on top: rise ÷ run', 300, 240, 30),
    write([2, '3'], '3 ÷ 2 = 3/2', 300, 310, 40, 'y'),
  ],
]
