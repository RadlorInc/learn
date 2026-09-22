/** g6m4-t7's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Three year columns across the board (centres 150, 300, 450). Colours: white the $500 you put in,
 *  blue one year's pay, yellow what it comes to, coral the mix-up, dim labels. */
import type { ChalkMark } from '../../../chalk'
import { write, box, wash, arrow, span, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const YX = [150, 300, 450]
/** Year n's column: its name on top, a box under it, and what goes in the box. */
const year = (at: At, i: number, y: number, what: string, c: 'w' | 'b' | 'y' | 'd' = 'b'): ChalkMark[] => [
  q(write(at, `year ${i + 1}`, YX[i], y, 22, 'd')), q(box(at, YX[i] - 60, y + 20, 120, 60, c === 'd' ? 'd' : 'w')),
  write(at, what, YX[i], y + 50, 32, c),
]
/** A $5 coin. */
const five = (at: At, x: number, y: number): ChalkMark[] => [
  q({ beat: at[0], at: at[1], c: 'b', d: `M${x - 27} ${y} a27 27 0 1 0 54 0 a27 27 0 1 0 -54 0` }), q(write(at, '$5', x, y, 24, 'b')),
]

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // How many dollars a year?
  [
    box([0, 'bank'], 80, 40, 170, 80), write([0, '$500'], '$500', 165, 80, 38),
    write([0, '4%'], 'pays 4%', 400, 65, 30, 'b'), write([0, 'year'], 'every year', 400, 105, 26, 'd'),
    write([1, 'dollars'], '4% of $500 = $ ?', 300, 175, 32, 'b'),
    ...[0, 1, 2].flatMap(i => year([1, 'years'], i, 235, '?', 'd')),
  ],
  // The big idea: one year, then times the years
  [
    ...year([0, 'one'], 0, 60, 'pays', 'b'),
    write([0, 'multiply'], '×', 300, 110, 48, 'y'),
    write([0, 'years'], 'the years', 440, 110, 34, 'y'),
    span([0, 'years'], 90, 510, 210, 'y'), write([0, 'years'], 'what the bank pays', 300, 250, 28, 'y'),
  ],
  // One year
  [
    write([0, 'one'], 'year 1', 300, 35, 24, 'd'), write([0, '1%'], '1% of $500 = ?', 300, 85, 32),
    write([1, '500'], '500 ÷ 100 = 5', 300, 150, 34), write([1, 'is'], '1% is $5', 300, 205, 30, 'b'),
    ...five([2, 'those'], 120, 280), ...five([2, 'those'], 190, 280), ...five([2, 'those'], 260, 280), ...five([2, 'those'], 330, 280),
    write([2, '$20'], '= $20', 440, 280, 38, 'b'), write([2, 'year'], 'a year', 440, 335, 26, 'd'),
  ],
  // Every year the same
  [
    ...year([0], 0, 50, '$20'),
    ...year([0, 'Year'], 1, 50, '$20').map((m, i) => (i === 2 ? { ...m, at: '$20' } : m)),
    write([0, 'same'], '4% of the same $500', 300, 190, 30, 'd'),
    ...year([1, 'Year'], 2, 50, '$20').map((m, i) => (i === 2 ? { ...m, at: '$20' } : m)),
    write([1, 'too'], 'the same every year', 300, 260, 30, 'b'),
  ],
  // Add up the years
  [
    ...[0, 1, 2].flatMap(i => year([0], i, 40, '$20').map(q)),
    write([0, 'years'], '3 × $20 =', 260, 200, 36), write([0, '$60'], '$60', 390, 200, 36, 'y'),
    span([0, '$60'], 90, 510, 145, 'y'),
    write([1, 'pays'], 'the bank pays $60', 300, 260, 30, 'y'),
    write([2, '$500'], '$500 + $60 =', 260, 335, 34), write([2, '$560'], '$560', 435, 335, 34, 'y'),
    ring([2, 'all'], 435, 335, 44, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'STOP'], '3 years: $20', 300, 165, 36, 'r'), cross([1, 'only'], 190, 140, 220, 50),
    write([2, '3'], '3 years:', 190, 250, 32), write([2, 'times'], '3 × $20', 330, 250, 32), write([2, '$60'], '= $60', 460, 250, 32, 'y'),
    ...[0, 1, 2].map(i => q(wash([2, '$60'], 200 + i * 70, 300, 60, 40, 'b'))),
    ...[0, 1, 2].map(i => q(write([2, '$60'], '$20', 230 + i * 70, 320, 22))),
  ],
]
