/** g6m7-t4's chalkboards: index = screen index (0 is Screen 1, which has none). Sam's games 4, 11, 7, 15, 9 on a 0–20
 * line, 24 px a point. Yellow = the biggest and the gap, blue = the smallest, coral = the slip. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, wash, span, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const SAM = [4, 11, 7, 15, 9]
const X = (v: number) => 60 + 24 * v
/** A 0–20 line at y: a tick every point, a longer one and a number every 5. */
const numline = (at: At, y: number): ChalkMark[] => [
  q({ beat: at[0], at: at[1], c: 'd', w: 2.4, d: `M${X(0) - 14} ${y} H${X(20) + 14}` + Array.from({ length: 21 }, (_, v) => ` M${X(v)} ${y - (v % 5 ? 5 : 9)} v${v % 5 ? 10 : 18}`).join('') }),
  ...[0, 5, 10, 15, 20].map(v => q(write(at, String(v), X(v), y + 30, 20, 'd'))),
]
/** A game's dot on the line at y (k stacks a repeat above it). */
const dot = (at: At, v: number, y: number, k = 0, c: ChalkColor = 'w'): ChalkMark => {
  const cy = y - 14 - k * 18
  return q({ beat: at[0], at: at[1], c, w: 7, d: `M${X(v) - 3} ${cy} a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0` })
}
const dotRing = (at: At, v: number, y: number, c: ChalkColor) => ring(at, X(v), y - 14, 14, 14, c)
const sam = (at: At, y: number) => [...numline(at, y), ...SAM.map(v => dot(at, v, y))]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // His best game is not enough: another player with the same best, and no spread at all
  [
    ...sam([0], 150), write([0], 'Sam', 30, 60, 24, 'd'),
    dotRing([0, '15'], 15, 150, 'b'), write([0, '15'], 'best game', X(15), 100, 22, 'b'),
    span([1, 'apart'], X(4), X(15), 212, 'd'), write([1, 'apart'], 'how far apart?', X(9.5), 244, 22, 'd'),
    ...numline([2, 'player'], 340), write([2, 'player'], 'another player', 110, 280, 22, 'd'),
    ...[0, 1, 2, 3, 4].map(k => dot([2, '15'], 15, 340, k, 'b')),
  ],
  // The big idea: the biggest minus the smallest
  [
    ...sam([0, 'spread'], 220),
    dotRing([0, 'biggest'], 15, 220, 'y'), write([0, 'biggest'], 'biggest', X(15), 160, 24, 'y'),
    dotRing([0, 'smallest'], 4, 220, 'b'), write([0, 'smallest'], 'smallest', X(4), 160, 24, 'b'),
    span([0, 'smallest'], X(4), X(15), 110, 'y'),
    write([0, 'number'], 'biggest − smallest', 300, 330, 28, 'y'),
  ],
  // Find the two ends
  [
    ...sam([0, 'Start'], 220),
    dotRing([1, '4'], 4, 220, 'b'), write([1, '4'], 'smallest: 4', X(4), 150, 26, 'b'),
    dotRing([1, '15'], 15, 220, 'y'), write([1, '15'], 'biggest: 15', X(15), 150, 26, 'y'),
    wash([2, 'between'], X(4) + 16, 190, X(15) - X(4) - 32, 40, 'd'),
  ],
  // Measure the gap
  [
    ...sam([0], 190), q(dotRing([0], 4, 190, 'b')), q(dotRing([0], 15, 190, 'y')),
    span([0, 'far'], X(4), X(15), 110, 'y'),
    write([1, '15'], '15 − 4', 270, 300, 36), write([1, '11'], '= 11', 370, 300, 36, 'y'),
    write([2, 'points'], '11 points', X(9.5), 76, 28, 'y'),
  ],
  // A small gap: Kim's scores huddle
  [
    ...sam([0], 110), write([0], 'Sam', 30, 50, 22, 'd'), q(span([0], X(4), X(15), 160, 'd')),
    ...numline([0, 'Kim'], 290), write([0, 'Kim'], 'Kim', 30, 230, 22, 'b'),
    dot([0, '9'], 9, 290, 0, 'b'), dot([0, '10'], 10, 290, 0, 'b'), dot([0, '8'], 8, 290, 0, 'b'),
    dot([0, '11'], 11, 290, 0, 'b'), dot([0, '10'], 10, 290, 1, 'b'),
    span([1, 'gap'], X(8), X(11), 340, 'y'), write([1, '3'], '11 − 8 = 3', 470, 205, 28, 'y'),
    write([2, 'close'], 'close together', 470, 250, 22, 'd'),
  ],
  // One thing not to do: first and last are not the ends
  [
    ...warn([0, 'mix']),
    ...SAM.map((v, i) => q(write([1], String(v), 180 + 60 * i, 160, 34))),
    write([1, 'FIRST'], 'first', 180, 200, 20, 'r'), write([1, 'LAST'], 'last', 420, 200, 20, 'r'),
    write([1, '9'], '9 − 4 = 5', 280, 255, 32, 'r'), cross([1, '5'], 380, 238, 34, 34),
    ring([2, 'smallest'], 180, 160, 22, 24, 'b'), ring([2, 'biggest'], 360, 160, 24, 24, 'y'),
    write([2, '11'], '15 − 4 = 11', 280, 335, 34, 'y'),
  ],
]
