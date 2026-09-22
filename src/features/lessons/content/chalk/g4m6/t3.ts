/** g4m6-t3's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, cross } from '../../../chalk'
import { warn } from '../g3m2/t6'
import { q, grid, shadeGrid } from './t1'

const S = 22, GX = 50
const colX = (c: number) => GX + S * (c + 0.5)
/** A grid with its first 5 columns shaded: 0.5, or 0.50. */
const half = (at: At, x: number, y: number, s: number): ChalkMark[] => [grid(at, x, y, s), ...shadeGrid(at, x, y, s, 0, 5)]
type At = [number, string?]

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // They look different
  [
    write([0, 'numbers'], '0.5', 190, 90, 52), write([0, 'numbers'], '0.50', 410, 90, 52),
    write([1, 'digits'], '2 digits', 190, 150, 24, 'd'), write([1, 'digits'], '3 digits', 410, 150, 24, 'd'),
    write([1, '50'], '50 is more than 5', 300, 220, 30),
    write([2, 'bigger'], '0.50 bigger than 0.5', 280, 300, 34), write([2, 'bigger'], '?', 475, 300, 44, 'y'),
  ],
  // The big idea: same shading, two names
  [
    ...half([0, '0.5'], 60, 90, 18), write([0, '0.5'], '0.5', 150, 320, 40, 'y'),
    ...half([0, '0.50'], 360, 90, 18), write([0, '0.50'], '0.50', 450, 320, 40, 'y'),
    write([0, 'same'], '=', 300, 180, 56, 'y'), write([0, 'space'], 'same space', 300, 370, 28, 'y'),
  ],
  // Count the columns
  [
    grid([0, 'count'], GX, 80, S), ...shadeGrid([0, 'shaded'], GX, 80, S, 0, 5),
    write([1, 'column'], '1 column = 1 tenth', 440, 120, 26),
    ...q([0, 1, 2, 3, 4].map(c => write([1, '5'], String(c + 1), colX(c), 60, 20, 'd'))),
    write([2, 'tenths'], '5 tenths', 440, 210, 36), write([2, '0.5'], '= 0.5', 440, 285, 44, 'y'),
  ],
  // Count the squares
  [
    grid([0, 'count'], GX, 90, S), ...shadeGrid([0, 'same'], GX, 90, S, 0, 5),
    write([1, '10'], '5 × 10', 440, 120, 32), write([1, '50'], '= 50 squares', 440, 170, 32),
    write([2, 'hundredths'], '50 hundredths', 440, 250, 32), write([2, '0.50'], '= 0.50', 440, 315, 44, 'y'),
  ],
  // Same space, two names
  [
    ...half([0, 'anything'], 220, 90, 16),
    write([0, 'move'], '5 tenths', 110, 170, 28), write([0, 'move'], '50 hundredths', 480, 170, 28),
    write([1, 'amount'], '0.5 = 0.50', 300, 305, 44, 'y'),
    write([2, 'both'], 'Ana and Ben: both right', 300, 365, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'call'], '0.50 > 0.5', 300, 165, 44, 'r'), cross([1, 'bigger'], 200, 140, 200, 50),
    ...half([2, 'tray'], 40, 215, 12), ...half([2, 'tray'], 440, 215, 12),
    write([2, 'same'], '0.50 = 0.5', 300, 275, 40, 'y'),
  ],
]
