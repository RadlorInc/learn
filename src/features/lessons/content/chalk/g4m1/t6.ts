/** g4m1-t6's chalkboards: index = screen index (0 is Screen 1, which has none). t5's columns, taking away across zeros. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, arrow, cross } from '../../../chalk'
import { q, warn, COL, ROW, stack, heads, digit, small, colRing, note, type At, type Col } from './t5'

/** A slash through the digit in one column of the top number: that digit is being changed. */
const slash = (at: At, col: Col, c: ChalkColor = 'b', y: number = ROW.a): ChalkMark => line(at, [[COL[col] - 16, y + 22], [COL[col] + 16, y - 22]], c)
const setup = (at: At): ChalkMark[] => [...heads(at), ...stack(at, '3005', '1247', '−')]
/** Every place broken: 3 → 2, both zeros → 9, the 5 → 15. */
const broken = (at: At): ChalkMark[] => q([
  slash(at, 'Th'), small(at, '2', 'Th'), slash(at, 'H'), small(at, '9', 'H'), slash(at, 'T'), small(at, '9', 'T'),
  slash(at, 'O'), small(at, '15', 'O'),
])

// Colours: blue = a broken place (its slash and its new value), yellow = a digit of the answer, dim = labels and the
// working, coral = the warning and the empty places.
export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Nothing next door
  [
    ...setup([0, 'Start']), colRing([0, 'ones'], 'O'),
    note([0, '5'], '7 from 5 ?', 110, 'r', 30), cross([0, 'No'], 405, 90, 140, 40),
    arrow([1, 'next'], [300, ROW.top], [258, ROW.top], 'd'),
    ring([2, '0'], COL.T, ROW.a, 18, 26, 'r'), ring([2, 'hundreds'], COL.H, ROW.a, 18, 26, 'r'),
  ],
  // The big idea: walk left past the zeros, break 1 there, each zero becomes 9
  (() => {
    const X = { Th: 180, H: 260, T: 340, O: 420 }, Y = 200
    const sl = (at: At, x: number) => line(at, [[x - 18, Y + 26], [x + 18, Y - 26]], 'b')
    return [
      ...q([write([0, 'place'], '3', X.Th, Y, 48), write([0, 'place'], '0', X.H, Y, 48), write([0, 'place'], '0', X.T, Y, 48), write([0, 'place'], '5', X.O, Y, 48)]),
      ring([0, 'zero'], X.T, Y, 20, 30, 'r'),
      arrow([0, 'left'], [420, 265], [185, 265], 'd'), ring([0, 'not'], X.Th, Y, 22, 32, 'w'),
      sl([0, 'break'], X.Th), write([0, 'there'], '2', X.Th, 130, 36, 'b'),
      sl([0, 'way'], X.H), sl([0, 'way'], X.T),
      write([0, '9'], '9', X.H, 130, 36, 'b'), write([0, '9'], '9', X.T, 130, 36, 'b'),
    ]
  })(),
  // Go to the first digit that is not zero
  [
    ...setup([0, 'Walk']), arrow([0, 'left'], [330, ROW.ans], [165, ROW.ans], 'd'),
    ring([0, 'zeros'], (COL.H + COL.T) / 2, ROW.a, 52, 26, 'r'), ring([0, '3'], COL.Th, ROW.a, 18, 26, 'w'),
    slash([1, 'Break'], 'Th'), write([1, 'hundreds'], '1 thousand = 10 hundreds', 300, 340, 26, 'd'),
    small([2, '2'], '2', 'Th'),
  ],
  // Keep breaking
  [
    ...setup([0, 'Now']), ...q([slash([0, 'Now'], 'Th'), small([0, 'Now'], '2', 'Th')]),
    write([0, 'tens'], '1 hundred = 10 tens', 300, 300, 26, 'd'),
    slash([1, '9'], 'H'), small([1, '9'], '9', 'H'),
    write([2, 'ones'], '1 ten = 10 ones', 300, 345, 26, 'd'),
    slash([3, '9'], 'T'), small([3, '9'], '9', 'T'), slash([3, 'ones'], 'O'), small([3, '15'], '15', 'O'),
  ],
  // Now take away
  [
    ...setup([0, 'Now']), ...broken([0, 'Now']),
    note([0, '15'], '15 − 7 = 8', 110), digit([0, '8'], '8', 'O'),
    note([0, '9'], '9 − 4 = 5', 150), digit([0, '5'], '5', 'T'),
    note([1, '9'], '9 − 2 = 7', 190), digit([1, '7'], '7', 'H'),
    note([1, '2'], '2 − 1 = 1', 230), digit([1, '1'], '1', 'Th'),
    ring([2, '1,758'], 240, ROW.ans, 125, 32, 'y'), write([2, 'left'], '$1,758 left', 300, 350, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'FLIP'], '7 − 5', 160, 165, 44, 'r'), cross([1, '5'], 100, 138, 120, 54),
    write([1, '2,242'], '2,242', 440, 165, 44, 'r'), cross([1, 'gives'], 375, 138, 130, 54),
    write([2, 'away'], 'take away 7', 300, 245, 32),
    write([2, 'first'], '3,005 − 1,247 = 1,758', 300, 330, 36, 'y'),
  ],
]
