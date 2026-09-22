/** g8m4-t9's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The towns at (1, 1) and (4, 5) on a grid 0–6; across blue, up white, the straight line yellow once it is found. */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring, hop } from '../../../chalk'
import { warn } from '../g7m3/t1'
import { makeGrid } from '../g5m6/t1'
import { q, type At } from './helpers-t6-t9'

// 0 at (60, 360), 50 px a mile, so the grid fills x 60–360; writing at x ≈ 495.
const G = makeGrid(60, 360, 50)
const { X, Y } = G
const A: [number, number] = [X(1), Y(1)], B: [number, number] = [X(4), Y(5)], C: [number, number] = [X(4), Y(1)]
/** The grid and the two towns. */
const towns = (at: At): ChalkMark[] => [
  ...G.draw(at), q(G.dot(at, 1, 1)), q(write(at, '(1, 1)', 105, 336, 20, 'y')), q(G.dot(at, 4, 5)), q(write(at, '(4, 5)', 308, 110, 20, 'y')),
]
const across = (at: At, c: 'b' | 'd' = 'b'): ChalkMark => ({ ...line(at, [A, C], c), w: 4 })
const up = (at: At, c: 'w' | 'd' = 'w'): ChalkMark => ({ ...line(at, [C, B], c), w: 4 })
const square = (at: At): ChalkMark => ({ beat: at[0], at: at[1], c: 'y', w: 2.5, d: `M${C[0] - 14} ${C[1]} V${C[1] - 14} H${C[0]}` })

export const T9: (ChalkMark[] | undefined)[] = [
  undefined,
  // The path is on a slant
  [
    ...towns([0, 'Draw']), line([0, 'path'], [A, B]),
    ring([1, 'middles'], X(2.5), Y(3), 16, 16, 'r'),
    write([2, 'count'], 'count squares?', 495, 150, 26, 'r'), cross([2, 'No'], 410, 132, 170, 36),
    write([2, 'slant'], 'a slant', 478, 220, 24), write([2, 'grid'], 'is not on the grid', 478, 260, 24),
  ],
  // The big idea: the right triangle between the points, its two short sides counted, then the long side
  [
    ...towns([0]), line([0, 'Draw'], [A, B], 'd'),
    q(across([0, 'triangle'])), up([0, 'triangle']), square([0, 'right']),
    ...[2, 3, 4].map(i => q(hop([0, 'count'], X(i - 1), X(i), Y(1), 'b'))),
    ...[2, 3, 4, 5].map(i => q(G.stepUp([0, 'short'], 4, i))),
    { ...line([0, 'long'], [A, B], 'y'), w: 5 },
  ],
  // Draw the triangle
  [
    ...towns([0]), line([0], [A, B], 'd'),
    { ...arrow([0, 'across'], A, C, 'b'), w: 4 }, { ...arrow([0, 'up'], C, B, 'w'), w: 4 },
    ring([1, 'corner'], C[0], C[1], 18, 18, 'y'),
    square([2, 'square']), write([2, 'triangle'], 'a right triangle', 478, 200, 26, 'y'),
  ],
  // Measure the short sides
  [
    ...towns([0]), line([0], [A, B], 'd'), q(across([0])), up([0]), square([0]),
    write([1, 'Across'], '4 − 1 = 3', 495, 130, 30, 'b'), write([1, '3.'], '3', 185, 335, 24, 'b'),
    write([1, 'Up'], '5 − 1 = 4', 495, 195, 30), write([1, 'Up'], '4', 283, 210, 24),
    write([2, 'miles'], '3 and 4 miles', 495, 280, 28, 'y'),
  ],
  // Find the long side
  [
    ...towns([0]), line([0], [A, B], 'd'), q(across([0])), q(up([0])), q(square([0])),
    q(write([0], '3', 185, 335, 24, 'b')), q(write([0], '4', 283, 210, 24)),
    write([1, 'add'], '9 + 16 = 25', 495, 120, 30), write([1, 'Which'], '? × ? = 25', 495, 180, 30),
    write([2, '25,'], '5 × 5 = 25', 495, 240, 30, 'y'),
    { ...line([2, 'apart'], [A, B], 'y'), w: 5 }, write([2, 'apart'], '5', 168, 192, 26, 'y'), write([2, 'miles'], '5 miles', 495, 310, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ADD'], '3 + 4 = 7 miles', 300, 150, 34),
    cross([2, 'walk'], 175, 128, 250, 44),
    write([2, 'corner'], 'the walk around the corner', 300, 215, 26, 'd'),
    write([2, 'miles'], 'straight line = 5 miles', 300, 300, 32, 'y'),
  ],
]
