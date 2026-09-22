/** g3m3-t8's chalkboards: index = screen index (0 is Screen 1, which has none). A bundle = 10 straws tied together. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, ring, cross } from '../../../chalk'
import { warn, tick, type At } from '../g3m1/t1'

/** Bundles of straws standing from y1 (top) to y2, one stroke: three straws and a tie each. */
const bundles = ([beat, at]: At, xs: number[], y1: number, y2: number, c: ChalkColor = 'w', quick = true): ChalkMark => ({
  beat, at, c, quick, w: 2.6,
  d: xs.map(x => [-4, 0, 4].map(dx => `M${x + dx} ${y1} V${y2}`).join(' ') + ` M${x - 7} ${(y1 + y2) / 2 - 10} h14`).join(' '),
})
/** A cup (open at the top, top edge at y) holding `n` bundles. */
const cup = (at: At, x: number, y: number, n = 4, c: ChalkColor = 'w'): ChalkMark[] => {
  const xs = Array.from({ length: n }, (_, i) => x + (i - (n - 1) / 2) * 20)
  return [bundles(at, xs, y - 50, y + 45, c), { beat: at[0], at: at[1], c, quick: true, d: `M${x - 50} ${y} L${x - 40} ${y + 60} H${x + 40} L${x + 50} ${y}` }]
}
const CX = [120, 300, 480]
const cups = (at: At, y: number, n = 4) => CX.flatMap(x => cup(at, x, y, n))

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // 40 is a big jump
  [
    ...cups([0, 'Each'], 140),
    write([0, '10'], '10 straws in each bundle', 300, 45, 24, 'd'),
    ...CX.map(x => ({ ...write([0, '40'], '40', x, 235, 28), quick: true })),
    write([1, '40s'], '40 + 40 + 40', 280, 290, 32), write([1, 'hard'], 'hard', 480, 290, 30, 'r'),
    write([2, 'faster'], 'faster way?', 170, 355, 32, 'y'), write([2, 'bundles'], 'count bundles', 430, 355, 32, 'y'),
  ],
  // The big idea (a smaller example: 2 cups of 3 tens)
  [
    ...[200, 400].flatMap(x => cup([0, 'multiply'], x, 120, 3)),
    write([0, 'count'], '2 × 3 tens', 220, 270, 36), write([0, 'many'], '= 6 tens', 400, 270, 36),
    write([0, 'number'], '= 60', 370, 335, 40, 'y'),
  ],
  // Count the bundles
  [
    ...cups([0, 'Look'], 110),
    ...CX.map(x => ({ ...write([0, '4'], '4 bundles', x, 205, 22, 'd'), quick: true })),
    ...['4', '8', '12'].flatMap((n, i) => [ring([1, n], CX[i], 115, 62, 78, 'y'), write([1, n], n, CX[i], 265, 40, 'y')]),
    write([2, 'bundles'], '12 bundles', 300, 345, 40, 'y'),
  ],
  // 12 bundles of ten
  [
    ...cups([0], 120),
    write([0, '3'], '3 × 4', 250, 270, 44), write([0, '12'], '= 12', 370, 270, 44, 'y'),
    ring([1, 'bundle'], CX[0] - 30, 115, 13, 55, 'b'), write([1, 'ten'], '1 bundle = 1 ten', 300, 40, 26, 'b'),
    write([1, 'tens'], '12 tens', 300, 345, 40, 'y'),
  ],
  // 12 tens is 120
  [
    write([0, '12'], '12 tens = ?', 300, 45, 34),
    bundles([1, '10'], Array.from({ length: 10 }, (_, i) => 60 + i * 30), 95, 180),
    write([1, '100'], '100', 195, 220, 34),
    bundles([1, '2'], [440, 470], 95, 180, 'b'), write([1, '20'], '20', 455, 220, 34, 'b'),
    write([2, '120'], '100 + 20 = 120', 300, 290, 44, 'y'),
    write([2, 'straws'], '3 × 40 = 120 straws', 300, 355, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'stop'], '3 × 40 = 12', 160, 185, 36, 'r'), cross([1, 'straws'], 60, 160, 200, 50),
    write([1, 'bundles'], '12 bundles', 450, 185, 32, 'b'),
    write([2, '10'], '1 bundle = 10 straws', 450, 235, 22, 'b'),
    write([2, '120'], '3 × 40 = 120', 290, 320, 44, 'y'), tick([2, '120'], 440, 320),
  ],
]
