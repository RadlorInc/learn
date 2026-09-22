/** g4m6-t4's chalkboards: the space from 0 to 1 cut into 10 equal jumps (the number line of ../g3m2/t6). */
import type { ChalkMark } from '../../../chalk'
import { write, ring, cross } from '../../../chalk'
import { warn, numberLine, label, dot, hops, X } from '../g3m2/t6'
import { q } from './t1'

const one = (at: [number, string?], k: number, y: number, c: 'y' | 'b' = 'y') => hops(at, k, k + 1, y, c)

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Only two numbers
  [
    ...numberLine([0, 'line'], 200), label([0, '0'], '0', 0, 200), label([0, '1'], '1', 10, 200),
    dot([1, 'dot'], 6, 200), write([1, 'between'], 'between 0 and 1', 300, 320, 28, 'd'),
    write([2, 'names'], '?', X(6), 140, 52, 'y'),
  ],
  // The big idea
  [
    ...numberLine([0, 'Cut'], 230), label([0, '0'], '0', 0, 230), label([0, '1'], '1', 10, 230),
    write([0, 'equal'], '10 equal jumps', 300, 90, 30, 'b'), hops([0, 'jumps'], 0, 10, 230, 'b'),
    write([0, '0.1'], '0.1', X(0.5), 165, 24, 'y'), write([0, '0.1'], 'each jump = 0.1', 300, 340, 32, 'y'),
  ],
  // Count the jumps
  [
    ...numberLine([0, 'Count'], 220), hops([0, 'jumps'], 0, 10, 220, 'b'),
    label([0, '0'], '0', 0, 220), label([0, '1'], '1', 10, 220),
    ...q(Array.from({ length: 10 }, (_, k) => write([1, '10'], String(k + 1), X(k + 0.5), 165, 20, 'd'))),
    write([2, '0.1'], '1 jump = 0.1 of a mile', 300, 340, 30, 'y'),
  ],
  // Jump to the dot
  [
    ...numberLine([0, 'Now'], 210), label([0, 'Now'], '1', 10, 210, 'd'),
    label([0, '0'], '0', 0, 210), dot([0, 'dot'], 6, 210),
    ...[1, 2, 3, 4, 5, 6].flatMap(k => [one([1, `0.${k}`], k - 1, 210), label([1, `0.${k}`], `0.${k}`, k, 210, 'y', 22)]),
    write([2, '6'], '6 jumps', 300, 340, 34, 'y'),
  ],
  // Name the dot
  [
    ...numberLine([0, '6'], 190), label([0, '6'], '0', 0, 190), label([0, '6'], '1', 10, 190),
    hops([0, 'jumps'], 0, 6, 190), write([0, '0.1'], '6 jumps of 0.1', 300, 90, 32),
    dot([0, '0.6'], 6, 190), label([0, '0.6'], '0.6', 6, 190, 'y', 28),
    write([1, 'mile'], 'you walked 0.6 of a mile', 300, 330, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...numberLine([1, 'count'], 210), dot([1, 'count'], 6, 210),
    ...q([0, 1, 2, 3, 4, 5, 6].map(k => ring([1, 'marks'], X(k), 210, 9, 14, 'r'))),
    write([1, 'marks'], '7 marks → 0.7', 450, 140, 26, 'r'),
    label([1, 'start'], '0', 0, 210), write([1, 'start'], 'start', X(0), 290, 22, 'd'),
    cross([1, 'not'], 375, 120, 150, 40),
    hops([2, 'jumps'], 0, 6, 210), write([2, '0.6'], '6 jumps → 0.6', 300, 345, 32, 'y'),
  ],
]
