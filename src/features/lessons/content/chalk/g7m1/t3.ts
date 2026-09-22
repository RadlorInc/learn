/** g7m1-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Weeks along the bottom, dollars up the side; Jo's dots are (1, 2) to (4, 8). Yellow is the line and the rate,
 *  coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, ring, cross } from '../../../chalk'
import { warn } from './t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const X = (x: number) => 80 + 80 * x
const Y = (y: number) => 350 - 28 * y
const R = 7
/** A chalk dot at graph point (x, y). */
const dot = (at: At, x: number, y: number, c: 'w' | 'y' = 'w'): ChalkMark[] => {
  const d = `M${X(x) - R} ${Y(y)} a${R} ${R} 0 1 0 ${R * 2} 0 a${R} ${R} 0 1 0 ${-R * 2} 0`
  return [{ beat: at[0], at: at[1], d, c, wash: true, quick: true }, { beat: at[0], at: at[1], d, c, quick: true }]
}
/** The two axes with weeks 1–5 and dollars 2–10 marked. */
const axes = (at: At): ChalkMark[] => [
  line(at, [[X(0), Y(10.6)], [X(0), Y(0)], [X(5.6), Y(0)]], 'd'),
  ...[1, 2, 3, 4, 5].map(n => q(write(at, String(n), X(n), Y(0) + 22, 20, 'd'))),
  ...[2, 4, 6, 8, 10].map(n => q(write(at, String(n), X(0) - 22, Y(n), 20, 'd'))),
  q(write(at, 'weeks', 540, 378, 20, 'd')), q(write(at, 'dollars', 130, 28, 20, 'd')),
]
const dots = (at: At) => [[1, 2], [2, 4], [3, 6], [4, 8]].flatMap(([x, y]) => dot(at, x, y))
/** The graph line y = 2x from x = a to x = b. */
const rule = (at: At, a: number, b: number, c: 'w' | 'y' = 'y') => line(at, [[X(a), Y(2 * a)], [X(b), Y(2 * b)]], c)

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Dots can fool you
  [
    ...axes([0, 'Look']), ...dots([0, 'dots']),
    arrow([0, 'climb'], [X(1) - 30, Y(2) - 50], [X(4) - 30, Y(8) - 50], 'b'),
    write([1, 'climb'], 'they climb,', 490, 220, 26), write([1, 'steady'], 'but steady?', 490, 260, 26),
    write([2, 'look'], 'what do we look for?', 470, 320, 24, 'y'),
  ],
  // The big idea: straight, through (0, 0), height at 1 is the rate
  [
    ...axes([0, 'graph']), ...dots([0, 'graph']),
    rule([0, 'straight'], 0, 4.8),
    ring([0, '0'], X(0), Y(0), 18, 18),
    write([0, '0'], '(0, 0)', 44, 316, 20, 'y'),
    line([0, 'height'], [[X(1), Y(0)], [X(1), Y(2)]], 'b'),
    write([0, 'rate'], 'the rate', X(1) + 65, Y(2) + 12, 22, 'y'),
  ],
  // Check one: a straight line
  [
    ...axes([0, 'Lay']), ...dots([0, 'Lay']),
    rule([0, 'ruler'], 0.6, 4.6, 'w'),
    write([1, 'Yes'], 'one straight line', 470, 250, 26, 'y'),
    write([1, 'bend'], 'no bend', 470, 295, 22, 'd'),
  ],
  // Check two: start at zero
  [
    ...axes([0, 'Now']), ...dots([0, 'Now']),
    ring([0, '0'], X(0), Y(0), 18, 18, 'b'),
    write([1, 'weeks'], '0 weeks, $0', 470, 250, 28),
    ...dot([1, '$0'], 0, 0, 'y'),
    rule([2, 'line'], 0, 4.8),
    write([2, 'corner'], '(0, 0)', 44, 316, 20, 'y'),
  ],
  // Read the rate at x = 1
  [
    ...axes([0, 'useful']), rule([0, 'useful'], 0, 4.8),
    ring([0, '1'], X(1), Y(0) + 22, 16, 16, 'b'),
    line([0, 'up'], [[X(1), Y(0)], [X(1), Y(2)]], 'b'),
    ...dot([1, '2'], 1, 2, 'y'), line([1, '2'], [[X(1), Y(2)], [X(0), Y(2)]], 'b'),
    write([1, 'week'], '$2 a week', 470, 250, 30, 'y'),
    write([2, 'rule'], 'y = 2x', 470, 320, 44, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    line([1, 'straight'], [[60, 130], [60, 340], [260, 340]], 'd'),
    line([1, 'starts'], [[60, 286], [240, 160]], 'r'),
    write([1, '3'], '(0, 3)', 100, 312, 22, 'r'),
    cross([1, 'saved'], 150, 140, 100, 190),
    write([2, 'changing'], 'y ÷ x changes', 160, 378, 22, 'r'),
    line([2, 'has'], [[340, 130], [340, 340], [540, 340]], 'd'),
    line([2, 'has'], [[340, 340], [520, 178]], 'y'),
    write([2, '0'], '(0, 0)', 390, 365, 22, 'y'),
  ],
]
