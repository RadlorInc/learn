/** g6m7-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Towers 2, 6, 3, 5 at true scale; the
 * cubes are only ever moved, never made: 16 in the towers, 16 in the pile, 4 × 4 shared out. Yellow = the fair share,
 * blue = cubes that move, coral = the slip. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const H = [2, 6, 3, 5]
/** A tower of n cubes, u px each, w wide, standing on `base` at x. */
const tower = (at: At, x: number, base: number, n: number, u: number, w: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat: at[0], at: at[1], c, d: `M${x} ${base} v${-n * u} h${w} v${n * u}` + Array.from({ length: n - 1 }, (_, i) => ` M${x} ${base - (i + 1) * u} h${w}`).join('') })
/** The four towers, with the floor under them and (s > 0) each count written below. */
const towers = (at: At, xs: number[], base: number, u: number, w: number, hs = H, s = 22, c: ChalkColor = 'w'): ChalkMark[] => [
  q(line(at, [[xs[0] - 12, base], [xs.at(-1)! + w + 12, base]], 'd')),
  ...hs.map((n, i) => q(tower(at, xs[i], base, n, u, w, c))),
  ...(s ? hs.map((n, i) => q(write(at, String(n), xs[i] + w / 2, base + s + 2, s, 'd'))) : []),
]
/** A square pile of 16 cubes: 4 × 4, u px each. */
const pile = (at: At, x: number, y: number, u: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat: at[0], at: at[1], c, d: `M${x} ${y} h${4 * u} v${4 * u} h${-4 * u} Z` + [1, 2, 3].map(i => ` M${x + i * u} ${y} v${4 * u} M${x} ${y + i * u} h${4 * u}`).join('') })

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Picking one tower is not fair
  [
    ...towers([0, 'towers'], [80, 190, 300, 410], 330, 40, 60),
    write([1, 'tallest'], 'tallest', 220, 76, 22, 'b'), write([1, '6'], 'all 6?', 530, 150, 26),
    write([1, 'shortest'], 'shortest', 110, 236, 22, 'b'), write([1, '2'], 'all 2?', 530, 230, 26),
    line([2, 'Neither'], [[480, 150], [580, 150]], 'r', 4), line([2, 'Neither'], [[480, 230], [580, 230]], 'r', 4),
    write([2, 'same'], 'one number for all four', 300, 36, 26, 'y'),
  ],
  // The big idea: towers, one pile, equal towers
  [
    ...towers([0, 'Put'], [30, 72, 114, 156], 260, 22, 32, H, 0),
    arrow([0, 'together'], [202, 210], [238, 210], 'd'), pile([0, 'together'], 252, 172, 22),
    arrow([0, 'share'], [354, 210], [390, 210], 'd'),
    ...[0, 1, 2, 3].map(i => tower([0, 'equally'], 406 + 42 * i, 260, 4, 22, 32, 'y')),
    write([0, 'total'], 'total', 296, 300, 26, 'd'),
    write([0, 'fair'], 'fair share', 490, 300, 26, 'y'),
  ],
  // Put all the cubes together
  [
    ...towers([0, 'So'], [40, 92, 144, 196], 270, 30, 40),
    arrow([0, 'push'], [256, 180], [306, 180], 'd'), pile([0, 'pile'], 330, 150, 30),
    q(write([1, '2'], '2', 155, 350, 34)), q(write([1, '6'], '+ 6', 207, 350, 34)),
    q(write([1, '3'], '+ 3', 275, 350, 34)), q(write([1, '5'], '+ 5', 343, 350, 34)),
    write([1, '16'], '= 16', 419, 350, 34, 'y'), write([1, 'cubes'], '16 cubes', 390, 294, 26, 'y'),
  ],
  // Share them out: the 4 × 4 pile becomes 4 towers of 4
  [
    pile([0, 'There'], 40, 140, 30, 'd'), write([0, 'There'], '16', 100, 285, 24, 'd'),
    arrow([0, 'share'], [180, 200], [230, 200], 'd'),
    ...[0, 1, 2, 3].map(i => tower([0, 'equal'], 260 + 72 * i, 260, 4, 30, 50)),
    write([1, '16'], '16 ÷ 4', 285, 340, 34), write([1, '4'], '= 4', 375, 340, 34, 'y'),
    line([2, 'Every'], [[250, 140], [530, 140]], 'y', 4), write([2, 'tall'], '4 tall', 391, 108, 26, 'y'),
  ],
  // Check by moving cubes: 2 off the 6 onto the 2, 1 off the 5 onto the 3
  [
    ...towers([0, 'check'], [80, 200, 320, 440], 330, 40, 60),
    { beat: 1, at: 'cubes', d: 'M200 90 h60 v80 h-60 Z', c: 'b', wash: true },
    arrow([1, 'give'], [194, 132], [148, 196], 'b'), cross([1, 'give'], 212, 98, 36, 64, 'd'),
    box([1, 'them'], 80, 210, 60, 40, 'b'), box([1, 'them'], 80, 170, 60, 40, 'b'),
    { beat: 2, at: 'off', d: 'M440 130 h60 v40 h-60 Z', c: 'b', wash: true },
    arrow([2, 'give'], [434, 150], [388, 188], 'b'), cross([2, 'give'], 454, 136, 32, 28, 'd'),
    box([2, 'it'], 320, 170, 60, 40, 'b'),
    line([3, 'every'], [[66, 170], [514, 170]], 'y', 4), write([3, '4'], 'every tower is 4', 300, 40, 28, 'y'),
  ],
  // One thing not to do: 16 is the pile, not one tower
  [
    ...warn([0, 'mix']),
    write([1, 'total'], '2 + 6 + 3 + 5 = 16', 300, 160, 30),
    write([1, 'NOT'], 'each tower: 16', 300, 225, 30, 'r'), cross([1, 'tower'], 176, 196, 248, 58),
    write([2, '16'], '16 ÷ 4 = 4 each', 300, 310, 34, 'y'),
  ],
]
