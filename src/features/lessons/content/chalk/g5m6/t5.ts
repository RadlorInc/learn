/**
 * g5m6-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 * Colours: white = the points and their pairs · blue = the number they share, and the line it puts them on ·
 * yellow = the numbers that differ, the subtraction and the distance (the result) · coral = the mix-up.
 */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross, span, hop, clock } from '../../../chalk'
import { warn } from '../g3m2/t6'
import { type At, type Grid, P, q, grid, dot, pair } from './t4'

// Step 36 px, 0–8 across and 0–6 up. A (2, 3) is at x 132, B (7, 3) at x 312, both at y 242.
const G: Grid = { ox: 60, oy: 350, u: 36, nx: 8, ny: 6 }
const Y3 = P(G, 0, 3)[1]
const point = (at: At, name: string, i: number, j: number): ChalkMark[] => {
  const [x, y] = P(G, i, j)
  return [dot(at, G, i, j, 'w'), write(at, name, x - 16, y + 22, 24)]
}
const AB = (at: At) => [...grid(at, G), ...point(at, 'A', 2, 3), ...point(at, 'B', 7, 3)]
/** "A (2, 3)" on the right, the name then the pair. */
const named = (at: At, name: string, a: string, b: string, y: number, x = 490, cb: ChalkColor = 'w') => {
  const p = pair(at, x, y, a, b, 32, 'w', cb)
  return { ...p, marks: [q(write(at, name, x - 60, y, 30)), ...p.marks] }
}
const PA = (at: At, y = 150, cb: ChalkColor = 'w', x?: number) => named(at, 'A', '2', '3', y, x, cb)
const PB = (at: At, y = 210, cb: ChalkColor = 'w', x?: number) => named(at, 'B', '7', '3', y, x, cb)
const across = (at: At, c: ChalkColor = 'b') => ({ ...line(at, [P(G, 0, 3), P(G, 8, 3)], c), w: 3 })
const numRing = (at: At, x: number, y: number, c: ChalkColor) => ring(at, x, y, 12, 19, c)

const a4 = PA([0, '2']), b4 = PB([0, '7'])
const a5 = PA([0, 'Which']), b5 = PB([0, 'Which'])
const a3 = PA([0, 'points']), b3 = PB([0, 'points'])
const a7 = PA([1, 'subtract'], 170, 'w', 120), b7 = PB([1, 'subtract'], 250, 'w', 120)

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Counting is slow
  [
    ...AB([0, 'You']),
    hop([0, 'step'], P(G, 2, 3)[0], P(G, 3, 3)[0], Y3), hop([0, 'step'], P(G, 3, 3)[0], P(G, 4, 3)[0], Y3),
    write([0, 'bench'], 'bench', 132, 296, 20), write([0, 'tree'], 'tree', 312, 296, 20),
    clock([1, 'ages'], 470, 160, 26), write([1, 'lose'], 'lost count?', 470, 235, 28, 'r'),
    write([2, 'faster'], 'a faster way?', 470, 310, 28),
  ],
  // The big idea: the shared number puts them on one line; subtract the other two
  [
    ...AB([0, 'When']), ...a3.marks, ...b3.marks,
    numRing([0, 'share'], a3.bx, 150, 'b'), numRing([0, 'share'], b3.bx, 210, 'b'),
    across([0, 'line']),
    numRing([0, 'other'], a3.ax, 150, 'y'), numRing([0, 'other'], b3.ax, 210, 'y'),
    write([0, 'numbers'], '7 − 2', 470, 300, 34, 'y'),
  ],
  // Find the number they share
  [
    ...grid([0, 'Point'], G), ...point([0, 'A'], 'A', 2, 3), ...a4.marks, ...point([0, 'B'], 'B', 7, 3), ...b4.marks,
    numRing([1, 'second'], a4.bx, 150, 'b'), numRing([1, 'second'], b4.bx, 210, 'b'), ring([1, '3'], 42, Y3, 14, 16, 'b'),
    across([2, 'line']),
  ],
  // Subtract the other numbers
  [
    ...AB([0, 'Which']), ...a5.marks, ...b5.marks, q(across([0, 'Which'])),
    numRing([0, '2'], a5.ax, 150, 'y'), ring([0, '2'], 132, 370, 13, 15, 'y'),
    numRing([0, '7'], b5.ax, 210, 'y'), ring([0, '7'], 312, 370, 13, 15, 'y'),
    write([1, '7'], '7 − 2', 450, 290, 34), write([1, '5'], '= 5', 540, 290, 34, 'y'),
    span([2, 'units'], 132, 312, 222, 'y'), write([2, 'units'], '5 units', 222, 190, 26, 'y'),
  ],
  // Check by counting
  [
    ...AB([0, "Let's"]), q(across([0, "Let's"])),
    ...['One', 'two', 'three', 'four', 'five'].flatMap((w, k) => {
      const x1 = P(G, 2 + k, 3)[0], x2 = P(G, 3 + k, 3)[0]
      return [hop([1, w], x1, x2, Y3, 'y'), q(write([1, w], String(k + 1), (x1 + x2) / 2, Y3 - 46, 20, 'y'))]
    }),
    write([2, 'units'], '5 units apart', 470, 200, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...a7.marks, ...b7.marks, numRing([1, 'MATCH'], a7.bx, 170, 'r'), numRing([1, 'MATCH'], b7.bx, 250, 'r'),
    write([2, '3'], '3 − 3', 330, 170, 32, 'r'), write([2, '0'], '= 0 apart', 470, 170, 32, 'r'),
    cross([2, 'not'], 392, 138, 156, 64),
    numRing([2, 'different'], a7.ax, 170, 'y'), numRing([2, 'different'], b7.ax, 250, 'y'),
    write([2, 'different'], '7 − 2', 330, 250, 32, 'y'), write([2, 'different'], '= 5 apart', 470, 250, 32, 'y'),
  ],
]
