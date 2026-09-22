/**
 * g6m4-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the 100-grid t2 draws with.
 * Colours across g6m4-t1..t4: blue = the shaded / known part, yellow = the result, coral = the mix-up, dim = labels.
 */
import type { ChalkMark } from '../../../chalk'
import { write, box, wash, cross } from '../../../chalk'
import { grid, fill } from '../g4m6/t5to7'
import { warn } from '../g3m2/t6'

export type At = [number, string?]
export const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))
// The wall: a true 10 × 10 grid, 26-wide squares, from (40, 70) to (300, 330). Words go on the right, centred on TX.
export const GX = 40, GY = 70, GS = 260, TX = 450

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // 35 tiles of what?
  [
    write([0, '35'], '35 tiles', 300, 45, 36),
    box([1, 'wall'], 60, 110, 480, 50), wash([1, 'most'], 60, 110, 336, 50, 'b'),
    write([1, 'most'], '35 out of 50', 300, 185, 24),
    box([1, '1,000'], 60, 220, 480, 50), wash([1, 'hardly'], 60, 220, 17, 50, 'b'),
    write([1, 'hardly'], '35 out of 1,000', 300, 295, 24),
    write([2, 'out'], 'out of how many?', 300, 350, 34, 'y'),
  ],
  // The big idea: 35 out of 100 is 35%
  [
    grid([0, 'out'], GX, GY, GS), write([0, '100'], '100 squares', TX, 100, 26, 'd'),
    ...fill([0, 'tiles'], GX, GY, GS, 35), write([0, 'tiles'], '35 out of 100', TX, 180, 30, 'b'),
    write([0, 'is'], '= 35%', TX, 260, 48, 'y'),
  ],
  // One tile out of 100
  [
    grid([0, 'wall'], GX, GY, GS), write([0, '100'], '100 tiles', TX, 100, 28, 'd'),
    wash([1, 'One'], GX, GY, 26, 26, 'b'), write([1, 'out'], '1 out of 100', TX, 165, 28, 'b'),
    write([1, 'write'], '= 1%', TX, 212, 36, 'y'),
    box([2, 'whole'], GX - 4, GY - 4, GS + 8, GS + 8, 'y'), write([2, 'out'], '100 out of 100', TX, 280, 28),
    write([2, 'or'], '= 100%', TX, 328, 36, 'y'),
  ],
  // Count the painted tiles
  [
    grid([0, 'count'], GX, GY, GS),
    ...fill([1, '10'], GX, GY, GS, 10), write([1, '10'], '10,', 380, 100, 30),
    ...fill([1, '20'], GX, GY, GS, 10, 'b', 10), write([1, '20'], '20,', 440, 100, 30),
    ...fill([1, '30'], GX, GY, GS, 10, 'b', 20), write([1, '30'], '30', 500, 100, 30),
    ...fill([1, '5'], GX, GY, GS, 5, 'b', 30), write([1, '5'], '+ 5', 450, 150, 30),
    write([1, 'makes'], '= 35', TX, 200, 30),
    write([2, 'out'], '35 out of 100', TX, 265, 28, 'b'), write([2, "That's"], '= 35%', TX, 320, 44, 'y'),
  ],
  // The tiles still bare
  [
    grid([0, 'And'], GX, GY, GS), ...q(fill([0, 'And'], GX, GY, GS, 35)),
    ...fill([0, 'bare'], GX, GY, GS, 65, 'd', 35), write([0, 'bare'], 'bare?', TX, 100, 30, 'd'),
    write([1, 'leaves'], '100 − 35 = 65', TX, 160, 30), write([1, "That's"], '65% bare', TX, 210, 30, 'd'),
    write([2, 'make'], '35% + 65% = 100%', TX, 285, 28), write([2, 'whole'], 'the whole wall', TX, 335, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'EMPTY'], '65% done', 300, 165, 40, 'r'), cross([1, 'tiles'], 215, 140, 170, 50),
    write([2, 'paint'], '65 still to paint', 300, 235, 28, 'd'),
    write([2, 'done'], '35% done', 300, 310, 48, 'y'),
  ],
]
