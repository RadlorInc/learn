/** g5m1-t14's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, ring } from '../../../chalk'

type At = [number, string]
// Long division, size 40: 23 outside the bracket, the digits of 184 in columns 30 px apart (1 · 8 · 4 at x 250 · 280 · 310).
const C = [250, 280, 310], S = 40, Q = 70, D = 130
const digits = (at: At, t: string, y: number, from: number, c: 'w' | 'y' | 'b' | 'r' = 'w') =>
  [...t].map((ch, i) => ({ ...write(at, ch, C[from + i], y, S, c), quick: true }))
const setup = (at: At): ChalkMark[] => [
  { ...write(at, '23', 170, D, S), quick: true },
  { beat: at[0], at: at[1], d: 'M210 155 Q224 130 210 103 H350', quick: true },
  ...digits(at, '184', D, 0),
]
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]

export const T14: (ChalkMark[] | undefined)[] = [
  undefined,
  // The first digits are too small
  [
    ...setup([0, 'dividing']),
    line([0, 'digit'], [[238, 158], [262, 158]], 'b'), line([0, 'two'], [[238, 168], [292, 168]], 'y'),
    write([1, '1'], '23 in 1?', 150, 240, 30, 'b'), write([1, '1'], 'no', 290, 240, 30, 'r'),
    write([1, '18'], '23 in 18?', 150, 300, 30, 'y'), write([1, 'either'], 'no', 290, 300, 30, 'r'),
  ],
  // The big idea
  [
    ...setup([0, 'divide']),
    line([0, 'fit'], [[238, 160], [292, 160]], 'r'), write([0, 'fit'], 'does not fit', 265, 195, 24, 'r'),
    box([0, 'one'], 292, 45, 36, 46, 'y'), write([0, 'digit'], '1 digit', 430, Q, 26, 'y'),
    write([1, 'round'], '23 → 20', 140, 270, 30, 'b'), write([1, 'big'], 'too big', 330, 270, 30, 'r'),
    write([1, 'less'], 'try one less', 300, 340, 30, 'y'),
  ],
  // Only one digit
  [
    ...setup([0, '23']),
    ring([0, '18'], 263, D, 28, 24, 'r'), line([0, 'no'], [[272, Q], [288, Q]], 'r'), write([0, 'no'], 'no tens', 140, 60, 24, 'r'),
    box([1, 'one'], 292, 45, 36, 46, 'y'), arrow([1, 'up'], [372, 118], [338, 80], 'b'), write([1, 'up'], '?', C[2], Q, S, 'y'),
    ring([1, '4'], C[2] + 2, D, 15, 22, 'b'),
  ],
  // Guess with round numbers
  [
    ...setup([0, '23']),
    arrow([0, '20'], [170, 153], [170, 176], 'b'), write([0, '20'], '20', 170, 195, 32, 'b'),
    write([0, 'many'], '20s in 184?', 460, 130, 26, 'b'),
    write([1, '9'], '9 × 20 = 180', 470, 190, 28), write([1, 'guess'], '9', C[2], Q, S, 'y'),
    write([2, '9'], '9 × 23 = 207', 470, 250, 28), write([2, 'more'], '207 > 184', 470, 305, 28, 'r'),
    cross([2, 'big'], 296, 50, 28, 40), write([2, 'big'], 'too big', 470, 355, 28, 'r'),
  ],
  // Try one less
  [
    ...setup([0, 'try']),
    write([0, '8'], '8 × 23 = 184', 470, 130, 28, 'y'),
    write([0, '184'], '−', 225, 175, S), ...digits([0, '184'], '184', 175, 0),
    line([1, 'exactly'], [[230, 198], [330, 198]]), write([1, '0'], '0', C[2], 222, S, 'b'),
    write([1, 'Write'], '8', C[2], Q, S, 'y'),
    write([2, '184'], '184 ÷ 23 = 8', 200, 320, 38, 'y'), write([2, 'bunches'], '8 bunches', 470, 320, 30, 'y'),
    ring([2, 'bunches'], 470, 320, 80, 26, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'watch']),
    write([1, 'guess'], '184 ÷ 23 = 9', 300, 170, 34, 'r'), cross([1, 'big'], 190, 148, 220, 44),
    write([2, '9'], '9 × 23 = 207', 180, 250, 30), write([2, 'more'], '> 184', 330, 250, 30, 'r'),
    write([2, 'Try'], 'one less: 8', 300, 330, 34, 'y'),
  ],
]
