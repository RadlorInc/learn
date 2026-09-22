/** g5m2-t8's chalkboards: index = screen index (0 is Screen 1, which has none). The plot: 2 ✕ above 1/4, 3 above 2/4, 1 above 3/4. */
import type { ChalkMark } from '../../../chalk'
import { write, arrow, cross, ring, span } from '../../../chalk'
import { q, fr, row, crossRow, warn, type At, type Tok } from './t5'

const COUNTS = [2, 3, 1], TOPS = ['1', '2', '3']
/** A line plot with its ticks at xs, the fourths under them, ✕s stacked `gap` apart. */
const plot = (xs: number[], y: number, gap: number, s = 26) => {
  const cy = (k: number) => y - gap * (k + 1)
  const x1 = (at: At, i: number, k: number): ChalkMark => {
    const x = xs[i], h = gap * 0.3
    return { beat: at[0], at: at[1], d: `M${x - h} ${cy(k) - h} L${x + h} ${cy(k) + h} M${x + h} ${cy(k) - h} L${x - h} ${cy(k) + h}` }
  }
  return {
    cy,
    line: (at: At): ChalkMark => q({ beat: at[0], at: at[1], d: `M${xs[0] - 60} ${y} H${xs[2] + 60}` + xs.map(x => ` M${x} ${y} v12`).join('') }),
    labels: (at: At) => xs.flatMap((x, i) => fr(at, TOPS[i], '4', x, y + s * 1.75, s)),
    /** The ✕s above label i. */
    col: (at: At, i: number, quick = false) => Array.from({ length: COUNTS[i] }, (_, k) => quick ? q(x1(at, i, k)) : x1(at, i, k)),
    all: (at: At) => [0, 1, 2].flatMap(i => Array.from({ length: COUNTS[i] }, (_, k) => q(x1(at, i, k)))),
  }
}
const BIG = [150, 300, 450]
const P = plot(BIG, 290, 40)
/** A lone ✕ of the given size at (x, y). */
const xAt = (at: At, x: number, y: number, h = 12): ChalkMark => ({ beat: at[0], at: at[1], d: `M${x - h} ${y - h} L${x + h} ${y + h} M${x + h} ${y - h} L${x - h} ${y + h}` })

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // Just marks
  [
    write([0, 'list'], 'no list', 300, 60, 28, 'd'),
    ...P.all([0, 'marks']), P.line([0, 'line']), ...P.labels([0, 'line']),
    xAt([1, 'means'], 460, 90, 14), write([1, 'means'], '= ?', 510, 90, 32, 'y'),
  ],
  // The big idea: one ✕ is one thing, the number under it is how much it measured
  [
    { beat: 0, at: 'Each', d: 'M180 250 H420 M300 250 v12' }, xAt([0, 'Each'], 300, 205, 16),
    write([0, 'thing'], '1 thing', 440, 205, 30), arrow([0, 'thing'], [390, 205], [330, 205], 'd'),
    ...fr([0, 'number'], '3', '4', 300, 312, 30), ring([0, 'measured'], 300, 312, 30, 42, 'y'),
    write([0, 'measured'], 'how much it measured', 300, 378, 28, 'y'),
  ],
  // Each ✕ is one plant
  [
    P.line([0, 'Here']), ...P.labels([0, 'Here']),
    xAt([0, 'plant'], 230, 60, 12), write([0, 'plant'], '= 1 plant', 320, 60, 28),
    ...P.col([1, '2'], 0), write([1, 'plants'], '2 plants', BIG[0], 170, 24, 'b'),
    ...P.col([2, '3'], 1), write([2, 'plants'], '3 plants', BIG[1], 130, 24, 'b'),
    ...P.col([2, '1'], 2), write([2, 'plant'], '1 plant', BIG[2], 210, 24, 'b'),
  ],
  // Most and least
  [
    P.line([0, 'Which']), ...P.labels([0, 'Which']), ...P.all([0, 'Which']),
    arrow([0, 'right'], [340, 90], [500, 90], 'd'),
    ring([1, '3/4'], BIG[2], P.cy(0), 24, 24, 'b'), ring([1, '3/4'], BIG[2], 336, 24, 40, 'b'), write([1, '3/4'], 'most', BIG[2], 200, 28, 'b'),
    arrow([2, 'left'], [260, 90], [100, 90], 'd'),
    ring([2, '1/4'], BIG[0], 336, 24, 40, 'b'), write([2, 'least'], 'least', BIG[0], 160, 28, 'b'),
  ],
  // Take away: the gap between 3/4 and 1/4
  (() => {
    const S = plot(BIG, 230, 36)
    return [
      S.line([0, 'question']), ...S.labels([0, 'question']), ...S.all([0, 'question']),
      span([0, 'gap'], BIG[0], BIG[2], 70, 'y'), write([0, 'gap'], 'the gap', 300, 40, 26, 'y'),
      ...row([[[1, '3/4'], ['3', '4']], [[1, '3/4'], '−'], [[1, '1/4'], ['1', '4']], [[1, '2/4'], '=', 'y'], [[1, '2/4'], ['2', '4'], 'y']], 190, 345, 28),
      ...row([[[2, 'more'], ['2', '4'], 'y'], [[2, 'more'], 'inch more', 'y']], 450, 345, 28),
    ]
  })(),
  // One thing not to do: the number of ✕s is not how much they grew
  (() => {
    const S = plot([90, 175, 260], 280, 32, 24)
    const bad: Tok[] = [[[1, 'away'], '3 − 1 = 2 inches', 'r']]
    return [
      ...warn([0, 'mix']),
      S.line([1, 'COUNT']), ...S.labels([1, 'COUNT']), ...S.all([1, 'COUNT']),
      ...row(bad, 440, 160, 32), crossRow([2, 'count'], bad, 440, 160, 0, 0, 32),
      write([2, 'plants'], 'how many plants', 440, 235, 26, 'b'),
      ...row([[[2, 'grew'], ['3', '4'], 'y'], [[2, 'grew'], '−', 'y'], [[2, 'grew'], ['1', '4'], 'y'], [[2, 'grew'], '=', 'y'], [[2, 'grew'], ['2', '4'], 'y']], 440, 320, 30),
    ]
  })(),
]
