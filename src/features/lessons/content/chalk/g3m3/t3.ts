/** g3m3-t3's chalkboards (6s): index = screen index (0 is Screen 1, which has none). Also the tray t4 and t5 draw with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, ring, cross } from '../../../chalk'
import { squares, grid, warn, tick, type At } from '../g3m1/t1'

type Pt = [number, number]
export type Shape = (at: At, pts: Pt[], c: ChalkColor) => ChalkMark
/** Rows `from`..`to` (exclusive) of a 3-wide tray, `gap` apart, top-left object at (x, y): one quick mark per row. */
export const rows = (shape: Shape, at: At, x: number, y: number, gap: number, from: number, to: number, c: ChalkColor = 'w'): ChalkMark[] =>
  Array.from({ length: to - from }, (_, i) => ({ ...shape(at, grid(x, y + (from + i) * gap, 1, 3, gap), c), quick: true }))

// A muffin is a small square.
const muffin = (s: number): Shape => (at, pts, c) => squares(at, pts, s, c)
const M = muffin(30)

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // 6s are new
  [
    write([0, '5s'], '5s: 5, 10, 15, 20', 200, 70, 30), tick([0, 'heart'], 355, 68),
    write([1, 'what'], '6 × 3 = ?', 200, 170, 38),
    ...rows(M, [1, '6'], 440, 60, 44, 0, 6),
    write([1, 'new'], '6s: new', 200, 225, 26, 'd'),
    box([2, '5s'], 417, 37, 134, 222, 'b'),
    write([2, 'work'], '5s do most of the work', 200, 320, 26, 'b'),
  ],
  // The big idea: 5 groups, then one more
  [
    write([0, '6'], '6 groups', 450, 50, 28, 'd'),
    ...rows(muffin(34), [0, '5'], 170, 50, 50, 0, 5, 'b'), write([0, '5'], '5 groups', 450, 150, 32, 'b'),
    line([0, 'then'], [[135, 275], [305, 275]], 'd', 2),
    ...rows(muffin(34), [0, 'one'], 170, 50, 50, 5, 6), write([0, 'one'], '+ 1 more group', 450, 300, 30),
  ],
  // Five rows first
  [
    ...rows(M, [0, 'Look'], 120, 60, 44, 0, 6, 'd'),
    box([0, 'top'], 97, 37, 134, 222, 'b'),
    write([1, 'rows'], '5 rows of 3', 420, 110, 32, 'b'),
    write([2, '5'], '5 × 3', 380, 200, 40, 'b'), write([2, '15'], '= 15', 490, 200, 40, 'b'),
  ],
  // One more row
  [
    ...rows(M, [0, 'Now'], 120, 60, 44, 0, 5, 'b'), write([0, 'Now'], '15', 290, 148, 32, 'b'),
    ...rows(M, [0, 'left'], 120, 60, 44, 5, 6), box([0, 'left'], 95, 258, 138, 44),
    write([1, '3'], '3 more', 330, 280, 30),
    write([2, 'So'], '1 × 3 = 3', 300, 355, 40),
  ],
  // Put them together
  [
    ...rows(muffin(24), [0, '5'], 90, 60, 34, 0, 5, 'b'), write([0, '5'], '15', 225, 128, 30, 'b'),
    ...rows(muffin(24), [0, 'more'], 90, 60, 34, 5, 6), write([0, 'more'], '3', 225, 230, 30),
    write([1, '15'], '15 + 3', 360, 130, 40), write([1, '18'], '= 18', 485, 130, 40, 'y'),
    write([2, '6'], '6 × 3', 360, 300, 48), write([2, '18'], '= 18', 480, 300, 48, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ONE'], '6 × 3 = 15 + 1', 165, 175, 34, 'r'), cross([1, 'end'], 40, 150, 250, 50),
    M([2, 'row'], grid(386, 175, 1, 3, 44), 'w'), ring([2, 'whole'], 430, 175, 80, 30, 'y'),
    write([2, 'add'], '6 × 3 = 15 + 3', 430, 260, 34, 'y'), tick([2, 'add'], 430, 315),
  ],
]
