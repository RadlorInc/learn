/** g7m2-t2's chalkboards: index = screen index (0 is Screen 1, which has none). Same number line as t1. */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring } from '../../../chalk'
import { nx, numLine, under, dot, jump, countHops, warn } from './t1'

/** Two drawn bars around a number, centred on x. */
const bars = (at: [number, string?], x: number, y: number, half: number, h = 34): ChalkMark[] =>
  [line(at, [[x - half, y - h], [x - half, y + h]]), line(at, [[x + half, y - h], [x + half, y + h]])]

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // The minus sign says which way, not how far
  [
    ...numLine([0, 'Ben'], 150), ...dot([0, 'Ben'], -5, 150, 'b'), write([0, 'Ben'], 'Ben', nx(-5), 105, 26, 'b'),
    under([0, '−5'], -5, 150, 'w'),
    write([1, 'walk'], 'walked −5 blocks?', 300, 250, 30, 'r'), line([1, 'No'], [[165, 252], [440, 244]], 'r', 4),
    ring([2, 'minus'], nx(-5), 182, 26, 18, 'r'),
    arrow([2, 'way'], [260, 335], [120, 335], 'b'), write([2, 'way'], 'which way', 190, 368, 22, 'b'),
    write([2, 'far'], 'how far?', 440, 340, 30, 'y'),
  ],
  // The big idea: count the steps to 0, drop the sign
  [
    ...numLine([0, 'number'], 180), ...dot([0, 'number'], -5, 180), under([0, 'number'], -5, 180, 'w'),
    write([0, 'never'], 'how far is never below 0', 300, 280, 24, 'd'),
    jump([0, 'steps'], -5, 0, 180), write([0, 'steps'], '5 steps', nx(-2.5), 70, 26, 'y'),
    write([0, 'drop'], '−5  →  5', 300, 345, 40, 'y'),
  ],
  // Count the steps from −5 to 0
  [
    ...numLine([0, 'finger'], 200), ...dot([0, 'finger'], -5, 200), under([0, 'finger'], -5, 200, 'w'),
    ...countHops(1, -5, 0, 200),
    write([2, 'steps'], '5 steps from 0', 300, 280, 28),
    write([2, 'Ben'], 'Ben: 5 blocks', 300, 340, 32, 'y'),
  ],
  // Ana is 5 away too
  [
    ...numLine([0, 'Now'], 190, [0, -5]), ...dot([0, 'Now'], -5, 190, 'd'), jump([0, 'Now'], -5, 0, 190, 'd'),
    write([0, 'Now'], 'Ben', nx(-5), 255, 22, 'd'), write([0, 'Now'], '5 steps', nx(-2.5), 80, 24, 'd'),
    ...dot([0, 'Ana'], 5, 190), under([0, 'Ana'], 5, 190, 'w'), write([0, 'Ana'], 'Ana', nx(5), 255, 22),
    jump([1, 'Count'], 5, 0, 190), write([1, 'steps'], '5 steps', nx(2.5), 80, 24, 'y'),
    write([2, 'same'], 'Ben: 5 blocks', 170, 330, 28, 'y'), write([2, 'same'], 'Ana: 5 blocks', 430, 330, 28, 'y'),
  ],
  // Two bars ask "how far from 0"
  [
    write([0, 'far'], 'how far from 0?', 300, 55, 30, 'd'),
    ...bars([1, 'bars'], 300, 160, 50), write([1, 'number'], '−5', 300, 160, 48),
    write([2, 'turn'], '= 5', 410, 160, 48, 'y'),
    ...bars([2, 'stays'], 260, 300, 32), write([2, 'stays'], '5', 260, 300, 44), write([2, 'stays'], '= 5', 350, 300, 44, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'NOT'], '|−4| = −4', 300, 170, 44, 'r'), cross([1, 'give'], 340, 145, 80, 50),
    write([2, "it's"], '|−4| = 4', 300, 300, 44, 'y'),
  ],
]
