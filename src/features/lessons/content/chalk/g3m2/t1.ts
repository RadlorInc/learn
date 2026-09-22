/** g3m2-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the clock pieces t2 draws with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, cross, ring, arrow, clockFace, hand, clockHop, onClock } from '../../../chalk'
import { warn, type At } from '../g3m1/t1'

// One colour per meaning, both clock topics: the short hand and the hour are blue, the long hand and the minutes yellow.
// The big clock sits on the left of the board; words go in the column on the right (x ≈ 470).
export const CX = 195, CY = 200, CR = 150
export const ringNum = (at: At, n: number, c: ChalkColor = 'y', cx = CX, cy = CY, r = CR) => ring(at, ...onClock(cx, cy, r * 0.8, n), r * 0.15, r * 0.15, c)
/** The short hand at hour position `h` (fractions allowed). */
export const shortHand = (at: At, h: number, c: ChalkColor = 'b', cx = CX, cy = CY, r = CR) => hand(at, cx, cy, h, r * 0.5, c, 7)
export const longHand = (at: At, n: number, c: ChalkColor = 'y', cx = CX, cy = CY, r = CR) => hand(at, cx, cy, n, r * 0.67, c)
/** "4" ":" "15" written big, the hour in blue and the minutes in yellow, with where each came from above it. */
export const putTogether = (h: string, m: string, first: At, dots: At, mins: At, labels: At, mAt: At): ChalkMark[] => [
  write(labels, `hour ${h}`, 150, 70, 34, 'b'), write(mAt, `${m} minutes`, 440, 70, 34, 'y'),
  arrow(first, [150, 100], [205, 185], 'b'), write(first, h, 230, 235, 110, 'b'),
  write(dots, ':', 305, 230, 110), arrow(mins, [440, 100], [400, 185], 'y'), write(mins, m, 390, 235, 110, 'y'),
]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // The numbers are not the minutes
  [
    ...clockFace([0, 'Look'], CX, CY, CR), shortHand([0, 'Look'], 4.25, 'd'),
    longHand([0, 'long'], 3), ringNum([0, '3'], 3),
    write([1, '3'], '3 minutes?', 470, 110, 34), cross([1, 'No'], 385, 85, 170, 50),
    write([2, 'numbers'], 'big numbers', 470, 220, 30, 'b'), write([2, 'hours'], '= hours', 470, 262, 30, 'b'),
    write([2, 'minutes'], 'not minutes', 470, 330, 30, 'r'),
  ],
  // The big idea: every number is 5 more minutes
  [
    ...clockFace([0], CX, CY, CR), longHand([0, 'long'], 3),
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => ({ ...write([0, '5s'], String(n * 5), ...onClock(CX, CY, CR + 24, n), 20, 'y'), quick: true })),
    clockHop([0, 'number'], CX, CY, CR - 45, 0, 1), write([0, 'number'], '1 number', 470, 140, 34),
    arrow([0, 'is'], [470, 170], [470, 220]), write([0, '5'], '5 more', 470, 255, 38, 'y'), write([0, 'minutes'], 'minutes', 470, 300, 34, 'y'),
  ],
  // Read the short hand first
  [
    ...clockFace([0], CX, CY, CR), shortHand([0, 'short'], 4.25),
    ringNum([1, '4'], 4, 'b'), write([1, '4'], 'just past 4', 470, 120, 30, 'b'),
    ringNum([1, '5'], 5, 'd'), write([1, 'yet'], 'not 5 yet', 470, 170, 28, 'd'),
    write([2, 'hour'], 'Hour:', 450, 270, 44), write([2, '4'], '4', 540, 270, 54, 'b'), line([2, '4'], [[395, 305], [575, 305]], 'w', 2.5),
  ],
  // Count by 5s
  [
    ...clockFace([0], CX, CY, CR), shortHand([0], 4.25, 'd'),
    longHand([0, 'long'], 3), ringNum([0, '12'], 12),
    ...([['Five', '5'], ['ten', '10'], ['fifteen', '15']] as const).flatMap(([w, n], i) => [
      clockHop([1, w], CX, CY, CR + 12, i, i + 1), write([1, w], n, ...onClock(CX, CY, CR + 32, i + 0.5), 26, 'y')]),
    ringNum([2, '3'], 3), write([2, '15'], '15 minutes', 470, 250, 40, 'y'), box([2, 'minutes'], 370, 215, 200, 70, 'y'),
  ],
  // Put it together
  [
    ...putTogether('4', '15', [1, 'hour'], [1, 'dots'], [1, 'minutes'], [0, 'hour'], [0, '15']),
    write([2, 'show'], 'your show starts', 300, 355, 28, 'd'), line([2, '4:15'], [[190, 305], [450, 305]], 'y', 2.5),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...clockFace([1, 'long'], 150, 260, 110, [12, 3, 6, 9]), longHand([1, 'long'], 3, 'y', 150, 260, 110),
    ringNum([1, '3'], 3, 'r', 150, 260, 110),
    write([2, 'would'], '4:03', 440, 190, 56, 'r'), cross([2, '4:03'], 385, 160, 110, 60),
    clockHop([2, '5s'], 150, 260, 122, 0, 3), arrow([2, "it's"], [265, 262], [365, 300], 'y'), write([2, '4:15'], '4:15', 440, 310, 56, 'y'),
  ],
]
