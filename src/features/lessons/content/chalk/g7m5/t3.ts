/** g7m5-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Two dot plots on one scale, 3 to 9 inches, 70 apart. Class A white, Class B blue; yellow = the means and the gap,
 *  coral = comparing single plants. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, span, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const A = [0, 0, 1, 2, 3, 2, 1], B = [1, 2, 3, 2, 1, 0, 0]
/** Where v inches sits across the board. */
const nx = (v: number) => 90 + 70 * (v - 3)
/** The y of the k-th dot (0 = bottom) stacked on a plot whose line is at `base`. */
const dy = (base: number, k: number) => base - 14 - 20 * k
const circ = (x: number, y: number, r: number) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`
/** A dot plot: its line with a tick at every inch, the inches under it, the class's letter, and a dot per plant. */
const plot = (at: At, base: number, counts: number[], name: string, c: ChalkColor): ChalkMark[] => [
  { beat: at[0], at: at[1], c: 'd', quick: true, d: `M70 ${base} H530` + counts.map((_, i) => ` M${nx(i + 3)} ${base - 6} v12`).join('') },
  ...counts.map((_, i) => ({ ...write(at, String(i + 3), nx(i + 3), base + 22, 20, 'd'), quick: true })),
  { ...write(at, name, 30, base - 30, 30, c), quick: true },
  { beat: at[0], at: at[1], c, quick: true, d: counts.flatMap((n, i) => Array.from({ length: n }, (_, k) => circ(nx(i + 3), dy(base, k), 8))).join(' ') },
]
/** The balance point of a plot: a yellow upright through it. */
const mean = (at: At, v: number, base: number): ChalkMark => line(at, [[nx(v), base + 4], [nx(v), base - 76]], 'y', 4)

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // One plant does not tell you: pick single plants and either class can win
  [
    ...plot([0, 'Careful'], 150, A, 'A', 'w'), ...plot([0, 'Careful'], 300, B, 'B', 'b'),
    ring([0, '5'], nx(5), dy(150, 0), 14, 14, 'r'),
    ring([1, '7'], nx(7), dy(300, 0), 14, 14, 'r'),
    ring([2, 'other'], nx(9), dy(150, 0), 14, 14, 'y'), ring([2, 'other'], nx(3), dy(300, 0), 14, 14, 'y'),
    write([2, 'wins'], 'either class can win', 300, 362, 26, 'r'),
    write([3, 'number'], 'one number for each class', 300, 40, 26, 'y'),
  ],
  // The big idea: a mean for each plot, the gap between them, the spread of each
  [
    ...plot([0, 'two'], 140, A, 'A', 'w'), ...plot([0, 'two'], 310, B, 'B', 'b'),
    mean([0, 'means'], 7, 140), mean([0, 'means'], 5, 310),
    span([0, 'check'], nx(5), nx(7), 200, 'y'), write([0, 'check'], 'gap', nx(6), 222, 22, 'y'),
    span([0, 'spread'], nx(5), nx(9), 40, 'b'), span([0, 'spread'], nx(3), nx(7), 370, 'b'),
  ],
  // Find each mean: add each class up, then divide by 9
  [
    write([0, 'Add'], 'A:', 40, 70, 28), write([0, 'Add'], '5 + 6 + 6 + 7 + 7 + 7 + 8 + 8 + 9', 285, 70, 26),
    write([0, '63'], '= 63', 550, 70, 26, 'y'),
    write([1, 'adds'], 'B:', 40, 140, 28, 'b'), write([1, 'adds'], '3 + 4 + 4 + 5 + 5 + 5 + 6 + 6 + 7', 285, 140, 26, 'd'),
    write([1, '45'], '= 45', 550, 140, 26, 'y'),
    write([2, '9'], '9 plants in each class', 300, 210, 24, 'd'),
    write([3, '63'], 'A:', 150, 280, 28), write([3, '63'], '63 ÷ 9 =', 270, 280, 36), write([3, '7'], '7', 375, 280, 40, 'y'),
    write([3, '45'], 'B:', 150, 345, 28, 'b'), write([3, '45'], '45 ÷ 9 =', 270, 345, 36), write([3, '5.'], '5', 375, 345, 40, 'y'),
  ],
  // Find the gap: the two means on one line, 2 apart
  [
    { beat: 0, at: 'So', c: 'd', quick: true, d: 'M70 220 H530' + [3, 4, 5, 6, 7, 8, 9].map(v => ` M${nx(v)} 214 v12`).join('') },
    ...[3, 4, 5, 6, 7, 8, 9].map(v => ({ ...write([0, 'So'], String(v), nx(v), 245, 20, 'd'), quick: true })),
    { beat: 0, at: '7', c: 'y', d: circ(nx(7), 220, 9) }, write([0, '7'], 'A', nx(7), 175, 30),
    { beat: 0, at: '5', c: 'b', d: circ(nx(5), 220, 9) }, write([0, '5'], 'B', nx(5), 175, 30, 'b'),
    span([1, 'apart'], nx(5), nx(7), 120, 'y'), write([1, '2'], '2', nx(6), 92, 30, 'y'),
    write([1, '7'], '7 − 5 = 2', 300, 305, 36),
    write([2, 'taller'], "A's plants: 2 inches taller", 300, 360, 28, 'y'),
  ],
  // Is the gap big: each class spreads 4, the gap is 2, the plots overlap
  [
    ...plot([0, 'Is'], 140, A, 'A', 'w'), ...plot([0, 'Is'], 290, B, 'B', 'b'),
    span([1, '9'], nx(5), nx(9), 40, 'b'), span([1, '7'], nx(3), nx(7), 340, 'b'),
    write([2, '4'], '4', 552, 40, 28, 'b'), write([2, '4'], '4', 402, 340, 28, 'b'),
    { beat: 3, at: 'overlap', c: 'y', wash: true, d: `M${nx(5) - 12} 56 h${nx(7) - nx(5) + 24} v256 h${-(nx(7) - nx(5) + 24)} Z` },
    write([3, 'half'], '2 is half of 4', 470, 214, 24, 'y'),
    write([4, 'bit'], 'a bit taller', 480, 375, 26, 'y'),
  ],
  // One thing not to do: tallest against tallest, crossed out; means first
  [
    ...warn([0, 'mix']),
    write([1, 'TALLEST'], 'tallest: 9 beats 7', 270, 150, 30, 'r'),
    cross([2, 'not'], 430, 130, 40, 40),
    write([3, 'means'], 'means: 7 − 5 = 2', 300, 240, 32, 'y'),
    write([3, 'spread'], 'then check the spread', 300, 300, 28),
  ],
]
