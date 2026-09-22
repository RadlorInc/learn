/**
 * g5m6-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 * Colours: white = the places, their pairs and the walk to them · blue = the number two places share, and the street it
 * puts them on · yellow = the subtraction and the blocks (the result) · coral = the mix-up.
 */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross, chalkWidth } from '../../../chalk'
import { warn } from '../g3m2/t6'
import { type At, type Grid, P, q, grid, dot, walk, pair } from './t4'

// The town map: 30 px a block, 0–10 each way. School (2, 3) at 120, 270 · Park (2, 8) at 120, 120 · Library (6, 1) at 240, 330.
const G: Grid = { ox: 60, oy: 360, u: 30, nx: 10, ny: 10 }
const place = (at: At, name: string, i: number, j: number, c: ChalkColor = 'w'): ChalkMark[] => {
  const [x, y] = P(G, i, j)
  return [q(dot(at, G, i, j, 'w')), write(at, name, x + 12 + chalkWidth(name, 20) / 2, y - 14, 20, c)]
}
const school = (at: At) => place(at, 'School', 2, 3), park = (at: At) => place(at, 'Park', 2, 8)
const map = (at: At) => [...grid(at, G), ...school(at), ...park(at)]
/** "School (2, 3)" on the right: the name, then the pair. */
const named = (at: At, name: string, a: string, b: string, y: number, ca: ChalkColor = 'w') => {
  const p = pair(at, 530, y, a, b, 30, ca)
  return { ...p, marks: [q(write(at, name, 432, y, 26)), ...p.marks] }
}
const street = (at: At) => ({ ...line(at, [P(G, 2, 3), P(G, 2, 8)], 'b'), w: 5 })
const numRing = (at: At, x: number, y: number, c: ChalkColor) => ring(at, x, y, 12, 18, c)

const s3 = named([0, 'pair'], 'School', '2', '3', 150), p3 = named([0, 'pair'], 'Park', '2', '8', 210)
const s4 = named([1, 'school'], 'School', '2', '3', 150), p4 = named([2, 'park'], 'Park', '2', '8', 210)
const s5 = named([0, 'Both'], 'School', '2', '3', 150), p5 = named([0, 'Both'], 'Park', '2', '8', 210)
// Screen 7: one street with its corners 3 to 8 up, 40 px apart, bottom to top.
const CY = (k: number) => 350 - 40 * k

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Easy to lose count
  [
    ...map([0, 'You']), ...place([0, 'You'], 'Library', 6, 1),
    { ...line([0, 'trace'], [[128, 262], [128, 128]], 'w'), w: 2 },
    q({ beat: 0, at: 'count', c: 'w', w: 2, d: [3, 4, 5, 6, 7, 8].map(j => `M112 ${P(G, 0, j)[1]} h16`).join(' ') }),
    write([1, 'skip'], 'skip one?', 480, 160, 28, 'r'), write([1, 'twice'], 'count one twice?', 480, 220, 24, 'r'),
    write([2, 'surer'], 'a surer way?', 480, 300, 28),
  ],
  // The big idea: a pair for each place; along one street, subtract
  [
    ...map([0, 'Every']), ...s3.marks, ...p3.marks,
    walk([0, 'across'], G, [0, 0], [2, 0]), walk([0, 'up'], G, [2, 0], [2, 3]),
    street([0, 'street']), write([0, 'subtract'], '8 − 3', 500, 290, 34, 'y'),
  ],
  // Name the places
  [
    ...map([0, 'Go']), walk([0, 'across'], G, [0, 0], [2, 0]), walk([0, 'up'], G, [2, 0], [2, 3]),
    ...s4.marks, ...p4.marks, walk([2, 'straight'], G, [2, 3], [2, 8]),
  ],
  // Walk the street
  [
    ...map([0, 'Both']), ...s5.marks, ...p5.marks,
    numRing([0, '2'], s5.ax, 150, 'b'), numRing([0, '2'], p5.ax, 210, 'b'), street([0, 'street']),
    numRing([1, 'up'], s5.bx, 150, 'y'), numRing([1, 'up'], p5.bx, 210, 'y'),
    write([1, '8'], '8 − 3', 470, 290, 34), write([1, '5'], '= 5', 555, 290, 34, 'y'),
    { beat: 2, at: 'blocks', c: 'y', d: `M92 ${P(G, 0, 3)[1]} h16 M92 ${P(G, 0, 8)[1]} h16 M100 ${P(G, 0, 3)[1]} V${P(G, 0, 8)[1]}` },
    write([2, 'blocks'], '5 blocks', 175, 195, 26, 'y'),
  ],
  // Find a place: the library's dot is on the map, its name is not
  [
    ...map([0, 'Now']), q(dot([0, 'Now'], G, 6, 1, 'w')),
    ...pair([0, '6'], 480, 150, '6', '1', 34).marks, write([0, '6'], '?', 550, 150, 34),
    walk([1, 'across'], G, [0, 0], [6, 0]), walk([1, 'up'], G, [6, 0], [6, 1]),
    ring([2, 'library'], 240, 330, 12, 12, 'y'), write([2, 'library'], 'Library', 297, 316, 22, 'y'),
    write([2, 'library'], 'Library', 480, 220, 30, 'y'),
  ],
  // One thing not to do: count the blocks, not the corners
  [
    ...warn([0, 'mix']),
    q({ ...line([1, 'count'], [[170, CY(0)], [170, CY(5)]]), w: 3 }),
    ...[0, 1, 2, 3, 4, 5].map(k => q(write([1, 'count'], String(k + 3), 132, CY(k), 22, 'd'))),
    ...[0, 1, 2, 3, 4, 5].map(k => q({ beat: 1, at: 'CORNERS', c: 'r' as ChalkColor, w: 6, d: `M165 ${CY(k)} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0` })),
    write([1, 'pass'], '6 blocks', 430, 180, 34, 'r'),
    ...[0, 1, 2, 3, 4].flatMap(k => [
      q({ beat: 2, at: 'blocks', c: 'y' as ChalkColor, w: 5, d: `M184 ${CY(k) - 8} V${CY(k + 1) + 8}` }),
      q(write([2, 'blocks'], String(k + 1), 206, CY(k) - 20, 22, 'y')),
    ]),
    write([2, '5'], '5 blocks', 430, 290, 34, 'y'), cross([2, 'not'], 355, 150, 150, 60),
  ],
]
