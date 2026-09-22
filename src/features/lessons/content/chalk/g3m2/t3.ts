/** g3m2-t3's chalkboards: index = screen index (0 is Screen 1, which has none). The game runs 3:10 to 3:45. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, cross, ring, arrow, hop, span, clockFace, hand } from '../../../chalk'
import { warn, type At } from '../g3m1/t1'

// A line of times, 3:10 to 3:50: 12 px a minute, a tick every 5 minutes. The jumps are yellow, the total yellow too.
const X = (m: number) => 60 + (m - 10) * 12
const t = (m: number) => `3:${String(m).padStart(2, '0')}`
const timeline = ([beat, at]: At, y: number, to = 50): ChalkMark => ({
  beat, at, c: 'w', quick: true,
  d: `M${X(10)} ${y} H${X(to)}` + Array.from({ length: (to - 10) / 5 + 1 }, (_, i) => ` M${X(10 + i * 5)} ${y - 8} v16`).join(''),
})
const label = (at: At, m: number, y: number, c: ChalkColor = 'w') => write(at, t(m), X(m), y + 34, 24, c)
const jump = (at: At, m1: number, m2: number, y: number, n: string, c: ChalkColor = 'y'): ChalkMark[] =>
  [hop(at, X(m1), X(m2), y - 10, c), ...(n ? [write(at, n, (X(m1) + X(m2)) / 2, y - (m2 - m1 > 5 ? 56 : 42), 24, c)] : [])]
const dot = (at: At, m: number, y: number, c: ChalkColor = 'w') => ring(at, X(m), y, 7, 7, c)
/** A small clock face showing h:m. */
const smallClock = (at: At, cx: number, cy: number, h: number, m: number): ChalkMark[] => [
  ...clockFace(at, cx, cy, 58, [12, 3, 6, 9]), hand(at, cx, cy, h + m / 60, 28, 'w', 5), hand(at, cx, cy, m / 5, 42, 'w', 4)]

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // A clock does not show how long
  [
    ...smallClock([0, 'clock'], 120, 110, 3, 10), write([0, 'now'], '3:10', 120, 200, 28),
    arrow([1, 'long'], [200, 110], [400, 110], 'y'), write([1, 'long'], 'how long?', 300, 80, 28, 'y'),
    ...smallClock([1, 'something'], 480, 110, 3, 45), write([1, 'took'], '3:45', 480, 200, 28),
    { ...timeline([2, 'count'], 300, 45), quick: false }, write([2, 'count'], '3:10', X(10), 334, 22, 'd'), write([2, 'count'], '3:45', X(45), 334, 22, 'd'),
    span([2, 'between'], X(10), X(45), 262, 'y'),
  ],
  // The big idea: start, jump, add up the jumps
  [
    line([0, 'Start'], [[60, 260], [540, 260]]), dot([0, 'start'], 10, 260), write([0, 'start'], 'start', X(10), 300, 24, 'd'),
    ...jump([0, 'jump'], 10, 20, 260, ''), ...jump([0, 'jump'], 20, 30, 260, ''), ...jump([0, 'jump'], 30, 40, 260, ''),
    dot([0, 'end'], 40, 260), write([0, 'end'], 'end', X(40), 300, 24, 'd'),
    write([0, 'add'], '+', X(20), 190, 30, 'y'), write([0, 'add'], '+', X(30), 190, 30, 'y'),
    span([0, 'jumps'], X(10), X(40), 335, 'y'), write([0, 'jumps'], 'how long', 300, 370, 26, 'y'),
  ],
  // Jump by 10s
  [
    timeline([0, 'start'], 190), dot([0, '3:10'], 10, 190), label([0, '3:10'], 10, 190),
    ...[20, 30, 40].flatMap(m => [...jump([1, t(m)], m - 10, m, 190, '10'), label([1, t(m)], m, 190)]),
    write([2, '3'], '3 jumps of 10', 300, 290, 30), write([2, '30'], '= 30 minutes so far', 300, 332, 26, 'y'),
  ],
  // Jump the rest
  [
    timeline([0], 190), ...[10, 20, 30, 40].map(m => label([0], m, 190, 'd')),
    ...[20, 30, 40].flatMap(m => jump([0], m - 10, m, 190, '10', 'd')),
    dot([0, '3:40'], 40, 190, 'y'), dot([0, '3:45'], 45, 190), label([0, '3:45'], 45, 190),
    ...jump([1, 'jump'], 40, 45, 190, '5'), write([1, 'minutes'], '5 minutes', 300, 300, 32, 'y'),
  ],
  // Add up the jumps
  [
    timeline([0, 'add'], 170), label([0, 'add'], 10, 170, 'd'), write([0, 'add'], '3:45', X(45), 204, 24, 'd'),
    ...jump([0, 'jumps'], 10, 20, 170, '10', 'w'), ...jump([0, 'jumps'], 20, 30, 170, '10', 'w'),
    ...jump([0, 'jumps'], 30, 40, 170, '10', 'w'), ...jump([0, 'jumps'], 40, 45, 170, '5', 'w'),
    write([1, '30'], '10 + 10 + 10 = 30', 300, 250, 32), write([1, '35'], '30 + 5 = 35', 300, 298, 32),
    write([2, 'minutes'], '35 minutes', 300, 352, 36, 'y'), box([2, 'long'], 195, 325, 210, 54, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'end'], 'end time', 300, 150, 26, 'd'), write([1, '3:45'], '3:45', 300, 200, 56, 'r'), cross([1, '3:45'], 245, 172, 110, 58),
    write([2, 'long'], 'how long?', 300, 275, 30, 'd'), write([2, '35'], '35 minutes', 300, 335, 50, 'y'),
  ],
]
