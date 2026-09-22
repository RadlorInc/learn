/** g8m3-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: white = the table and the working, blue = what repeats, yellow = what is paid once and the rule, coral = the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, box, arrow, hop, ring, cross, ticks } from '../../../chalk'
import { warn } from '../g5m1/t17'
import { q, tgrid, dip } from './t4'

type At = [beat: number, at?: string]
// The months table: label column 40–160, months 0–3 in columns 100 wide, top at y.
const MX = (i: number) => 210 + 100 * i
const months = (at: At, y: number): ChalkMark[] => [
  q(tgrid(at, 40, y, 120, 100, 4, 55)),
  q(write(at, 'months', 100, y + 27, 24, 'd')), ...[0, 1, 2, 3].map(i => q(write(at, String(i), MX(i), y + 27, 28, 'd'))),
  q(write(at, 'cost $', 100, y + 82, 26)),
]

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too many months to list
  [
    write([0, '35,'], '35', 130, 110, 34),
    q(hop([0, '45,'], 150, 230, 85, 'b')), q(write([0, '45,'], '+10', 190, 38, 22, 'b')), write([0, '45,'], '45', 250, 110, 34),
    q(hop([0, '55,'], 270, 350, 85, 'b')), q(write([0, '55,'], '+10', 310, 38, 22, 'b')), write([0, '55,'], '55', 370, 110, 34),
    arrow([0, 'goes.'], [410, 110], [480, 110], 'd'),
    write([1, '24'], 'month 24 = ?', 300, 195, 34),
    ticks([1, 'long'], 60, 262, 480, 24),
    write([1, 'list.'], '24 steps of +10', 300, 300, 22, 'd'),
    write([2, 'rule'], 'one rule, one line', 300, 355, 34, 'y'),
  ],
  // The big idea: repeats → in front of x, paid once → added on
  [
    write([0, 'amount'], 'y =', 160, 210, 46),
    write([0, 'repeats'], 'repeats', 265, 105, 26, 'b'), arrow([0, 'repeats'], [265, 125], [265, 165], 'b'),
    box([0, 'front'], 225, 175, 80, 70, 'b'), write([0, 'front'], 'x', 330, 210, 46),
    write([0, 'added'], '+', 375, 210, 46), box([0, 'added'], 405, 175, 80, 70, 'y'),
    arrow([0, 'on.'], [445, 300], [445, 255], 'y'), write([0, 'on.'], 'paid once', 445, 325, 26, 'y'),
  ],
  // What you pay once
  [
    write([0, '$25.'], '$25', 300, 60, 44, 'y'),
    write([0, 'one'], 'paid one time', 300, 118, 26, 'd'),
    ...months([1, 'months,'], 170),
    ...[1, 2, 3].map(i => q(write([1, 'months,'], '?', MX(i), 252, 28, 'd'))),
    write([1, '$25.'], '25', MX(0), 252, 32, 'y'), ring([1, '$25.'], MX(0), 252, 30, 22, 'y'),
  ],
  // What repeats
  [
    ...months([0, 'Now'], 30), write([0, 'Now'], '25', MX(0), 112, 30, 'y'),
    ...[0, 1, 2].map(i => q(dip([0, 'adds'], MX(i) + 12, MX(i + 1) - 12, 150))),
    ...[0, 1, 2].map(i => q(write([0, '$10.'], '+10', MX(i) + 50, 200, 24, 'b'))),
    write([1, 'times'], '10 × x', 220, 262, 36),
    write([1, '10x.'], '→ 10x', 390, 262, 40, 'b'),
    ring([2, '3'], MX(3), 57, 22, 22, 'b'),
    write([2, '30,'], '10 × 3 = 30', 170, 340, 30),
    write([2, '55.'], '30 + 25 = 55', 430, 340, 30), write([2, '55.'], '55', MX(3), 112, 32, 'y'),
  ],
  // Put it together
  [
    write([0, 'cost'], 'cost =', 150, 60, 32), write([0, 'times'], '10 × months', 300, 60, 32), write([0, 'plus'], '+ 25', 450, 60, 32),
    write([1, 'y'], 'y is the cost', 180, 125, 24, 'd'), write([1, 'x'], 'x is the months', 420, 125, 24, 'd'),
    write([1, '25.'], 'y = 10x + 25', 300, 200, 50, 'y'),
    write([2, '24'], '10 × 24 + 25', 250, 295, 34),
    write([2, '265.'], '= 265', 420, 295, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'MULTIPLY'], 'y = 25x + 10', 280, 170, 40, 'r'),
    cross([1, 'months.'], 440, 150, 40, 40),
    write([2, 'added'], '+ 25', 390, 262, 42, 'y'), write([2, 'added'], 'once', 390, 318, 22, 'd'),
    write([2, 'front'], 'y = 10x', 250, 262, 42, 'y'), write([2, 'front'], 'repeats', 268, 318, 22, 'd'),
  ],
]
