/** g7m2-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A plus counter is a white ring with +, a minus counter a blue ring with −; a pair is ringed, a taken pair crossed. */
import type { ChalkMark } from '../../../chalk'
import { write, line, cross, ring } from '../../../chalk'
import { warn, type At } from './t1'

const counter = (at: At, x: number, y: number, plus: boolean): ChalkMark[] => [
  { ...ring(at, x, y, 20, 20, plus ? 'w' : 'b'), quick: true },
  { ...write(at, plus ? '+' : '−', x, y + 2, 32, plus ? 'w' : 'b'), quick: true },
]
const row = (at: At, n: number, y: number, plus: boolean, x0 = 160, gap = 70): ChalkMark[] =>
  Array.from({ length: n }, (_, i) => counter(at, x0 + i * gap, y, plus)).flat()
/** A tall ring round one plus-over-minus pair in column i. */
const pair = (at: At, i: number, y1: number, y2: number, c: 'w' | 'y' | 'd' = 'w', x0 = 160, gap = 70) =>
  ring(at, x0 + i * gap, (y1 + y2) / 2, 29, (y2 - y1) / 2 + 30, c)
/** A coral stroke through pair i: taken away. */
const gone = (at: At, i: number, y1: number, y2: number, x0 = 160, gap = 70) =>
  line(at, [[x0 + i * gap - 24, y2 + 34], [x0 + i * gap + 24, y1 - 34]], 'r', 4)

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding does not always make more
  [
    write([0, 'write'], '3 + (−5)', 300, 75, 48),
    write([1, '8'], '3 + 5 = 8 ?', 300, 175, 40, 'r'),
    line([2, 'No'], [[185, 178], [415, 172]], 'r', 4),
    write([2, 'lost'], 'you lost 5', 180, 290, 28, 'b'), write([2, 'up'], 'score goes down', 420, 290, 28),
  ],
  // The big idea: + and − make 0; pair, take away, count what is left
  [
    ...counter([0, 'plus'], 230, 70, true), ...counter([0, 'minus'], 300, 70, false),
    ring([0, 'cancel'], 265, 70, 72, 38, 'y'), write([0, '0'], '= 0', 385, 70, 36, 'y'),
    ...row([0, 'pair'], 3, 185, true), ...row([0, 'pair'], 5, 255, false),
    pair([0, 'up'], 0, 185, 255), pair([0, 'up'], 1, 185, 255), pair([0, 'up'], 2, 185, 255),
    gone([0, 'away'], 0, 185, 255), gone([0, 'away'], 1, 185, 255), gone([0, 'away'], 2, 185, 255),
    ring([0, 'left'], 405, 255, 62, 32, 'y'), write([0, 'left'], '?', 405, 330, 32, 'y'),
  ],
  // Pair them up
  [
    write([0, 'win'], 'win 3', 70, 100, 24), ...row([0, 'plus'], 3, 100, true),
    write([0, 'loss'], 'lose 5', 70, 180, 24, 'b'), ...row([0, 'minus'], 5, 180, false),
    pair([1, 'Win'], 0, 100, 180), write([1, '0'], '+1 and −1 make 0', 300, 285, 30),
    pair([2, '3'], 1, 100, 180), pair([2, '3'], 2, 100, 180), write([2, '3'], '3 pairs', 300, 345, 32, 'y'),
  ],
  // Take the pairs away
  [
    ...row([0, 'Each'], 3, 90, true), ...row([0, 'Each'], 5, 170, false),
    pair([0, 'pair'], 0, 90, 170, 'd'), pair([0, 'pair'], 1, 90, 170, 'd'), pair([0, 'pair'], 2, 90, 170, 'd'),
    write([0, '0'], '0', 160, 250, 26, 'd'), write([0, '0'], '0', 230, 250, 26, 'd'), write([0, '0'], '0', 300, 250, 26, 'd'),
    gone([0, 'away'], 0, 90, 170), gone([0, 'away'], 1, 90, 170), gone([0, 'away'], 2, 90, 170),
    ring([1, 'left'], 405, 170, 62, 32, 'y'), write([1, '2'], '2 minus counters', 405, 330, 30, 'y'),
  ],
  // Read what is left
  [
    ...row([0, 'minus'], 2, 85, false, 240), write([0, 'means'], '= −2', 400, 85, 44, 'y'),
    write([1, 'So'], '3 + (−5) = −2', 300, 200, 48, 'y'),
    write([2, 'down'], 'score went down by 2', 300, 315, 30),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ADD'], '3 + (−5) = 8', 300, 160, 40, 'r'), cross([1, '8'], 368, 140, 60, 42),
    ...counter([2, 'minus'], 230, 250, false), ...counter([2, 'plus'], 290, 250, true),
    ring([2, 'cancels'], 260, 250, 66, 36, 'y'), write([2, 'cancels'], '= 0', 380, 250, 34, 'y'),
    write([2, 'join'], '3 + (−5) = −2', 300, 345, 40, 'y'),
  ],
]
