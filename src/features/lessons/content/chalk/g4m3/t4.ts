/** g4m3-t4's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The garden 23 by 14, cut into 20 + 3 across and 10 + 4 down. Pieces washed blue and white in turn so all four show;
 *  the answer yellow, the mistake coral. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, wash, cross, ring } from '../../../chalk'
import { warn, tick, q, seq, num, type At } from './t1'

/** A garden at (x, y), `u` px a foot: its outline, cuts, washes and piece centres. */
const G = (x: number, y: number, u: number) => {
  const cx = x + 20 * u, cy = y + 10 * u, W = 23 * u, H = 14 * u
  const P = { a: [x + 10 * u, y + 5 * u], b: [cx + 1.5 * u, y + 5 * u], c: [x + 10 * u, cy + 2 * u], d: [cx + 1.5 * u, cy + 2 * u] } as const
  return {
    x, y, cx, cy, W, H, P,
    outline: (at: At) => box(at, x, y, W, H),
    across: (at: At) => line(at, [[x - 8, cy], [x + W + 8, cy]], 'w', 5),
    down: (at: At) => line(at, [[cx, y - 8], [cx, y + H + 8]], 'w', 5),
    wash: (at: At, k: 'a' | 'b' | 'c' | 'd', c: ChalkColor) => {
      const r = { a: [x, y, 20 * u, 10 * u], b: [cx, y, 3 * u, 10 * u], c: [x, cy, 20 * u, 4 * u], d: [cx, cy, 3 * u, 4 * u] }[k]
      return wash(at, r[0], r[1], r[2], r[3], c)
    },
    tops: (a20: At, a3: At, s = 26): ChalkMark[] => [write(a20, '20', x + 10 * u, y - 20, s, 'd'), write(a3, '3', cx + 1.5 * u, y - 20, s, 'd')],
    sides: (a10: At, a4: At, s = 26): ChalkMark[] => [write(a10, '10', x - 28, y + 5 * u, s, 'd'), write(a4, '4', x - 24, cy + 2 * u, s, 'd')],
    inP: (at: At, k: 'a' | 'b' | 'c' | 'd', t: string, s = 28, c: ChalkColor = 'w') => write(at, t, P[k][0], P[k][1], s, c),
  }
}
const checker = (g: ReturnType<typeof G>, at: At): ChalkMark[] =>
  q([g.wash(at, 'a', 'b'), g.wash(at, 'b', 'w'), g.wash(at, 'c', 'w'), g.wash(at, 'd', 'b')])

const g = G(150, 90, 13)      // x 150–449, y 90–272; cuts at x 410, y 220
const s6 = G(110, 90, 13)     // the same garden, moved left to make room for the sum
const s7 = G(60, 150, 10)     // small, for the warning

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Both numbers are big
  [
    write([0, 'Last'], '16 × 3', 150, 60, 36, 'd'),
    write([0, 'both'], '23 × 14', 420, 60, 40), ...q([ring([0, 'are'], 370, 60, 26, 26, 'b'), ring([0, 'are'], 470, 60, 26, 26, 'b')]),
    ...seq(150, 32, [[[1, 'Break'], '23 ='], [[1, 'only'], '20 + 3']]),
    write([1, 'need'], '20 × 14', 270, 230, 38), write([2, 'easier'], '= ?', 380, 230, 38, 'r'),
    ...seq(320, 32, [[[2, 'both'], '14 ='], [[2, 'both'], '10 + 4']]),
  ],
  // The big idea: both cut, every piece multiplied, all four added
  [
    write([0, 'Break'], '23 × 14', 300, 35, 32),
    g.outline([0, 'Break']),
    g.across([0, 'tens']), g.down([0, 'tens']), ...q([...g.tops([0, 'tens'], [0, 'ones']), ...g.sides([0, 'tens'], [0, 'ones'])]),
    ...q((['a', 'b', 'c', 'd'] as const).map(k => g.inP([0, 'multiply'], k, '×', 26, 'y'))),
    write([0, 'add'], '+', 525, 150, 34, 'y'), write([0, 'four'], 'all 4', 525, 195, 28, 'y'),
  ],
  // Break both apart
  [
    g.outline([0, '23']), write([0, '23'], '23', 300, 38, 26, 'd'), ...g.tops([0, '20'], [0, '3']),
    write([0, '14'], '14', 70, 181, 26, 'd'), ...g.sides([0, '10'], [0, '4']),
    g.across([1, 'across']), g.down([1, 'down']),
    ...checker(g, [2, 'four']),
  ],
  // Multiply every piece
  [
    g.outline([0]), g.across([0]), g.down([0]), ...checker(g, [0]), ...q([...g.tops([0], [0]), ...g.sides([0], [0])]),
    ...seq(315, 26, [[[0, '20'], '20 × 10'], [[0, '200'], '= 200']], 190), g.inP([0, '200'], 'a', '200', 32),
    ...seq(315, 26, [[[0, '3'], '3 × 10'], [[0, '30'], '= 30']], 440), g.inP([0, '30'], 'b', '30', 22),
    ...seq(362, 26, [[[1, '20'], '20 × 4'], [[1, '80'], '= 80']], 190), g.inP([1, '80'], 'c', '80', 26),
    ring([1, 'corner'], g.P.d[0], g.P.d[1], 26, 34, 'w'),
    ...seq(362, 26, [[[1, '3'], '3 × 4'], [[1, '12'], '= 12']], 440), g.inP([1, '12'], 'd', '12', 22),
  ],
  // Add all four pieces, in columns (ones at x 540)
  [
    s6.outline([0]), s6.across([0]), s6.down([0]), ...checker(s6, [0]),
    ...q([s6.inP([0], 'a', '200', 32), s6.inP([0], 'b', '30', 22), s6.inP([0], 'c', '80', 26), s6.inP([0], 'd', '12', 22)]),
    ...num([1, '200'], '200', 540, 75, 'w', 32, false, 28),
    ...num([1, '30'], '30', 540, 115, 'w', 32, false, 28),
    ...num([1, '80'], '80', 540, 155, 'w', 32, false, 28),
    write([1, '12'], '+', 460, 195, 32), ...num([1, '12'], '12', 540, 195, 'w', 32, false, 28),
    line([1, '322'], [[445, 218], [560, 218]]),
    ...q([write([1, '322'], '2', 540, 255, 32, 'y'), write([1, '322'], '1', 484, 45, 20, 'd'), write([1, '322'], '2', 512, 255, 32, 'y'),
      write([1, '322'], '3', 484, 255, 32, 'y')]),
    ...seq(315, 34, [[[2, '23'], '23 × 14'], [[2, '322'], '= 322', 'y']]),
    write([2, 'feet'], '322 square feet', 300, 365, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    s7.outline([1, 'multiply']), s7.across([1, 'multiply']), s7.down([1, 'multiply']),
    ...q([...s7.tops([1, 'multiply'], [1, 'multiply'], 22), ...s7.sides([1, 'multiply'], [1, 'multiply'], 22)]),
    s7.wash([1, 'tens'], 'a', 'w'), s7.inP([1, 'tens'], 'a', '200', 28),
    s7.wash([1, 'ones'], 'd', 'w'), s7.inP([1, 'ones'], 'd', '12', 20),
    s7.wash([2, 'out'], 'b', 'r'), s7.wash([2, 'out'], 'c', 'r'), s7.inP([2, 'out'], 'b', '30', 20, 'r'), s7.inP([2, 'out'], 'c', '80', 24, 'r'),
    write([2, '212'], '23 × 14 = 212', 450, 170, 28, 'r'), cross([2, '212'], 355, 150, 190, 40),
    write([2, 'Add'], '200 + 30 + 80 + 12', 450, 240, 24),
    write([2, '322'], '= 322', 450, 290, 34, 'y'), tick([2, '322'], 510, 290),
  ],
]
