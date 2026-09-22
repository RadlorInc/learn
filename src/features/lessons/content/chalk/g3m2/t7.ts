/** g3m2-t7's chalkboards: index = screen index (0 is Screen 1, which has none). The t6 number line, one hop = 10. */
import type { ChalkMark } from '../../../chalk'
import { write, ring, cross, arrow, ticks } from '../../../chalk'
import { X, numberLine, label, dot, hops, warn } from './t6'

// Colours as t6: yellow = the closer hundred (the answer), white = the number being placed, dim = the longer way,
// blue = right in the middle.
export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // The hundreds are far apart
  [
    ...numberLine([0, '200'], 110), label([0, '200'], '200', 0, 110, 'd'), label([0, '300'], '300', 10, 110, 'd'),
    write([0, 'long'], 'a long way', 300, 50, 30, 'd'),
    ticks([0, 'Hopping'], X(0), 118, 480, 100, 8, 'd'),
    write([0, '1s'], 'by 1s', 300, 208, 30, 'r'), cross([0, 'day'], 255, 188, 90, 40),
    ...numberLine([1, 'Hop'], 320), label([1, 'Hop'], '200', 0, 320, 'd'), label([1, 'Hop'], '300', 10, 320, 'd'),
    hops([1, '10s'], 0, 10, 320), write([1, 'instead'], 'by 10s', 300, 262, 30, 'y'),
  ],
  // The big idea
  [
    ...numberLine([0, 'number'], 130), label([0, 'hundred'], '200', 0, 130, 'd'), label([0, 'hundred'], '300', 10, 130, 'd'),
    dot([0, 'closer'], 7, 130), write([0, 'closer'], '270', X(7), 95, 26), hops([0, 'closer'], 7, 10, 130),
    ring([0, 'closer'], X(10), 172, 30, 20, 'y'),
    ...numberLine([0, 'middle'], 300), label([0, 'middle'], '200', 0, 300, 'd'), label([0, 'middle'], '300', 10, 300, 'd'),
    dot([0, 'middle'], 5, 300, 'b'), write([0, 'middle'], '250', X(5), 265, 26, 'b'),
    hops([0, 'up'], 5, 10, 300), ring([0, 'up'], X(10), 342, 30, 20, 'y'),
  ],
  // Find the two hundreds
  [
    ...numberLine([0, 'Look'], 200), dot([0, '270'], 7, 200), label([0, '270'], '270', 7, 200),
    label([0, '200'], '200', 0, 200), write([0, 'more'], 'more than 200', 150, 300, 24, 'd'),
    label([0, '300'], '300', 10, 200), write([0, 'less'], 'less than 300', 450, 300, 24, 'd'),
    ring([1, 'between'], X(0), 242, 32, 20, 'y'), ring([1, 'between'], X(10), 242, 32, 20, 'y'),
  ],
  // Which hundred is closer?
  [
    ...numberLine([0, 'Count'], 190), label([0, 'Count'], '200', 0, 190, 'd'), label([0, 'Count'], '300', 10, 190, 'd'),
    dot([0, 'Count'], 7, 190), label([0, 'Count'], '270', 7, 190),
    write([0, '10'], '1 hop = 10', 300, 50, 24, 'd'),
    hops([0, 'up'], 7, 10, 190), write([0, '3'], '3 hops', X(8.5), 120, 28, 'y'),
    hops([1, 'back'], 7, 0, 190, 'd'), write([1, '7'], '7 hops', X(3.5), 280, 28, 'd'),
    ring([2, 'fewer'], X(8.5), 120, 58, 24, 'y'),
    write([2, 'about'], '270 → 300', 300, 345, 36, 'y'),
  ],
  // Right in the middle
  [
    ...numberLine([0, 'What'], 190), label([0, 'What'], '200', 0, 190, 'd'), label([0, 'What'], '300', 10, 190, 'd'),
    dot([0, '250'], 5, 190, 'b'), label([0, '250'], '250', 5, 190, 'b'),
    hops([1, '200'], 5, 0, 190, 'd'), write([1, '200'], '5 hops', X(2.5), 280, 28, 'd'),
    hops([1, '300'], 5, 10, 190, 'd'), write([1, '300'], '5 hops', X(7.5), 120, 28, 'd'),
    write([2, 'middle'], 'in the middle → up', 300, 55, 30, 'b'),
    write([2, 'rounds'], '250 → 300', 300, 345, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '329'], '329', 220, 160, 44), ring([1, 'LAST'], 245, 160, 17, 26, 'r'),
    write([1, '400'], '→ 400', 355, 160, 44, 'r'), cross([1, '400'], 170, 128, 250, 64),
    ...numberLine([2, 'hops'], 260), label([2, 'hops'], '300', 0, 260, 'd'), label([2, 'hops'], '400', 10, 260, 'd'),
    dot([2, '329'], 2.9, 260), label([2, '329'], '329', 2.9, 260), arrow([2, 'past'], [X(2.9), 232], [X(0) + 4, 232], 'y'),
    write([2, 'rounds'], '329 → 300', 300, 360, 40, 'y'),
  ],
]
