/**
 * g5m3-t4's chalkboards: index = screen index (0 is Screen 1, which has none).
 * Colours: white = the square meter and its cuts, blue = the rug, yellow = the result, coral = the mistake,
 * dim = labels. The square is truly square, cut into 2 equal rows and 4 equal columns, so the rug (1/2 by 3/4) is to scale.
 */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, span, cross } from '../../../chalk'
import { tiles } from '../g3m4/t1'
import { fr, expr, warn, type At } from '../g4m4/t1'

type Sq = { x: number; y: number; u: number }
const square = (at: At, q: Sq): ChalkMark => box(at, q.x, q.y, q.u, q.u)
const rowCut = (at: At, q: Sq): ChalkMark => line(at, [[q.x, q.y + q.u / 2], [q.x + q.u, q.y + q.u / 2]])
const colCuts = (at: At, q: Sq): ChalkMark[] =>
  [1, 2, 3].map(k => ({ ...line(at, [[q.x + (q.u * k) / 4, q.y], [q.x + (q.u * k) / 4, q.y + q.u]]), quick: k < 3 }))
const grid = (at: At, q: Sq): ChalkMark[] => [{ ...square(at, q), quick: true }, { ...rowCut(at, q), quick: true }, ...colCuts(at, q).map(m => ({ ...m, quick: true }))]
/** The rug: the top row, 3 columns across. */
const rug = (at: At, q: Sq, c: 'b' | 'y' = 'b'): ChalkMark => wash(at, q.x, q.y, (q.u * 3) / 4, q.u / 2, c)

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // No whole squares to count
  (() => {
    const q = { x: 340, y: 70, u: 220 }
    return [
      tiles([0, 'sides'], 50, 90, 2, 3, 60),
      write([0, 'meters'], '6 square meters', 140, 245, 24, 'd'),
      rug([1, 'rug'], q), square([1, 'meter'], q),
      write([1, 'meter'], '1 m', 450, 50, 22, 'd'), write([1, 'meter'], '1 m', 578, 180, 22, 'd'),
      write([2, 'whole'], 'not even 1 whole square', 450, 340, 26),
    ]
  })(),
  // The big idea: cut 1 square meter to match, count covered out of all
  (() => {
    const q = { x: 90, y: 70, u: 260 }
    return [
      square([0, 'meter'], q), write([0, 'meter'], '1 square meter', 220, 40, 24, 'd'),
      rowCut([0, 'sides'], q), ...colCuts([0, 'sides'], q),
      rug([0, 'rug'], q),
      write([0, 'covers'], '3 covered', 480, 150, 30, 'b'),
      write([0, 'all'], 'out of 8', 480, 230, 30, 'y'),
    ]
  })(),
  // Cut one square meter
  (() => {
    const q = { x: 80, y: 90, u: 260 }
    return [
      square([0, 'square'], q),
      write([0, 'meter'], '1 m', 210, 65, 24, 'd'), write([0, 'meter'], '1 m', 45, 220, 24, 'd'),
      ...expr([1, 'wide'], '1/2 m wide', 480, 130, 28), rowCut([1, 'rows'], q),
      ...expr([2, 'long'], '3/4 m long', 480, 215, 28), ...colCuts([2, 'columns'], q),
      write([2, '8'], '8 equal pieces', 480, 300, 28, 'y'),
    ]
  })(),
  // Lay the rug on it
  (() => {
    const q = { x: 90, y: 100, u: 260 }
    return [
      ...grid([0, 'Now'], q),
      write([0, 'Now'], '1 m', 220, 385, 22, 'd'), write([0, 'Now'], '1 m', 378, 230, 22, 'd'),
      { ...box([0, 'rug'], q.x, q.y, (q.u * 3) / 4, q.u / 2, 'b'), w: 5 },
      ...fr([1, 'row'], '1/2', 45, 165, 26, 'b'),
      span([1, 'columns'], q.x, q.x + (q.u * 3) / 4, 82, 'b'), ...fr([1, 'columns'], '3/4', q.x + (q.u * 3) / 8, 44, 22, 'b'),
      rug([2, 'covers'], q),
      write([2, 'pieces'], '3 pieces', 490, 165, 32, 'b'),
    ]
  })(),
  // Count the pieces
  (() => {
    const q = { x: 60, y: 30, u: 200 }
    return [
      ...grid([0, 'Count'], q), { ...rug([0, 'Count'], q), quick: true },
      ...[1, 2, 3].map(i => ({ ...write([0, '3'], String(i), q.x + 25 + 50 * (i - 1), q.y + 50, 26, 'y'), quick: i < 3 })),
      write([0, '8'], '3 out of 8', 430, 70, 32),
      ...fr([1, '3/8'], '3/8', 360, 170, 40, 'y'), write([1, 'meter'], 'of a square meter', 490, 170, 24, 'y'),
      ...expr([2, '3/8'], '1/2 × 3/4 = 3/8', 300, 300, 44, 'y'),
      write([2, 'side'], 'side × side', 300, 375, 24, 'd'),
    ]
  })(),
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...expr([1, 'ADD'], '1/2 + 3/4', 150, 185, 38, 'r'),
    box([1, 'edges'], 70, 250, 160, 107, 'd'),
    { ...line([1, 'edges'], [[70, 357], [70, 250], [230, 250]], 'r', 6) },
    cross([1, 'edges'], 60, 140, 180, 90),
    wash([2, 'covers'], 370, 250, 160, 107, 'y'), box([2, 'covers'], 370, 250, 160, 107, 'y'),
    ...expr([2, '3/8'], '1/2 × 3/4 = 3/8', 440, 185, 38, 'y'),
  ],
]
