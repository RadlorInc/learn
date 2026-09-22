/** g5m4-t5's chalkboards: index = screen index (0 is Screen 1, which has none). t4's decimal columns, taking away. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross, arrow } from '../../../chalk'
import { q, warn, C, L, row, sign, rule, digit, small, colRing, note, pointDown, mini, miniSum, type At, type Col } from './t4'

const heads = (at: At, y = L.head): ChalkMark[] => q(['ones', 'tenths', 'hundredths'].map((h, i) => write(at, h, [C.O, C.t, C.h][i], y, 18, 'd')))
const stack = (at: At, hy = L.head): ChalkMark[] => [...heads(at, hy), ...row(at, '5.2', L.a), ...row(at, '1.35', L.b), ...q([sign(at, '−'), rule(at)])]
/** A slash through a digit that is traded: a big one in the top number, or a small one above it. */
const slash = (at: At, col: Col, y: number = L.a, big = true): ChalkMark =>
  line(at, big ? [[C[col] - 16, y + 22], [C[col] + 16, y - 22]] : [[C[col] - 11, y + 13], [C[col] + 11, y - 13]], 'b')
/** Screen 5 and 6 need two small rows above the numbers, so the heads go higher. */
const HY = 22
const zero = (at: At): ChalkMark => digit(at, '0', 'h', 'b', L.a)
const firstTrade = (at: At): ChalkMark[] => [slash(at, 't'), small(at, '1', 't'), slash(at, 'h'), small(at, '10', 'h')]
const secondTrade = (at: At): ChalkMark[] => [slash(at, 'O'), small(at, '4', 'O'), slash(at, 't', L.s1, false), small(at, '11', 't', L.s2)]

// Colours: yellow = the answer and the point coming down, blue = the 0 put in and every trade, coral = the empty
// place and the slip, dim = labels and the working.
export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // A place is empty
  [
    ...stack([0, 'Line']), colRing([0, 'hundredths'], 'h'),
    ring([1, '5'], C.h, L.b, 20, 26, 'w'), write([1, 'nothing'], '?', C.h, L.a, 44, 'r'),
    note([2, 'away'], '? − 5', 160, 'r', 30),
  ],
  // The big idea
  [
    ...heads([0, 'Line']), ...row([0, 'Line'], '5.2', L.a), ...row([0, 'points'], '1.35', L.b),
    { ...line([0, 'points'], [[C.P, 100], [C.P, 215]], 'd'), w: 2 },
    ring([0, 'empty'], C.h, L.a, 24, 28, 'r'), zero([0, '0']),
    sign([0, 'away'], '−'), rule([0, 'away']), note([0, 'whole'], '520 − 135', 165),
  ],
  // Fill it with a 0
  [
    ...stack([0, 'Look']), note([0, '5.20'], '5.2 = 5.20', 135, 'w', 26),
    ring([1, 'write'], C.h, L.a, 24, 28, 'r'), zero([1, '0']),
  ],
  // Take away from the right
  [
    ...stack([0, 'Hundredths'], HY), { ...zero([0, 'Hundredths']), quick: true },
    colRing([0, 'Hundredths'], 'h'), note([0, 'go'], '0 − 5 ?', 110, 'r'), ...firstTrade([0, 'tenth']),
    note([1], '10 − 5 = 5', 155), digit([1], '5', 'h'),
    colRing([2, 'Tenths'], 't'), note([2, 'go'], '1 − 3 ?', 200, 'r'), ...secondTrade([2, 'one']),
    note([3], '11 − 3 = 8', 245), digit([3], '8', 't'),
  ],
  // Bring the point down
  [
    ...stack([0, 'Then'], HY), ...q([zero([0, 'Then']), ...firstTrade([0, 'Then']), ...secondTrade([0, 'Then']), digit([0, 'Then'], '5', 'h'), digit([0, 'Then'], '8', 't')]),
    colRing([0, 'ones'], 'O'), note([0, '4'], '4 − 1 = 3', 110), digit([0, '3'], '3', 'O'),
    ...pointDown([1, 'comes']),
    write([1, '3.85'], '3.85 liters left', 300, 350, 36, 'y'),
  ],
  // One thing not to do
  (() => {
    const A = mini(70), B = mini(370)
    return [
      ...warn([0, 'mix']),
      ...miniSum([1, 'bring'], A, '5.2', '1.35', '−', 150),
      arrow([1, 'DOWN'], [A.h, 212], [A.h, 238], 'r'), write([1, 'DOWN'], '5', A.h, 262, 32, 'r'),
      ...row([2, '3.95'], '3.9', 262, 'r', A, 32), cross([2, '3.95'], A.O - 22, 240, A.h - A.O + 44, 44),
      ...miniSum([2, 'Write'], B, '5.2', '1.35', '−', 150), write([2, '0'], '0', B.h, 150, 32, 'b'),
      ...row([2, '3.85'], '3.85', 262, 'y', B, 32),
    ]
  })(),
]
