/** g4m6-t2's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, box, wash, ring, cross } from '../../../chalk'
import { warn } from '../g3m2/t6'
import { q, grid, shadeGrid, chart, point } from './t1'

// A big grid on the left: 22-wide squares from (40, y).
const S = 22, GX = 40
const colX = (c: number) => GX + S * (c + 0.5)

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Tenths are too big
  [
    grid([0, 'Remember'], GX, 70, S), ...shadeGrid([0, 'column'], GX, 70, S, 0, 1),
    write([0, 'tenth'], '1 column = 1 tenth', 430, 100, 26),
    ...shadeGrid([1, '25'], GX, 70, S, 1, 1, 5),
    write([1, 'more'], 'more than 2 columns', 430, 170, 26), write([1, 'less'], 'less than 3', 430, 215, 26),
    ring([2, 'extra'], colX(2), 70 + 2.5 * S, 17, 62, 'y'), write([2, 'squares'], '?', 430, 300, 60, 'y'),
  ],
  // The big idea: the second place after the point is hundredths
  [
    ...chart([0, 'second'], 105, 80, 130, 80, ['ones', 'tenths', 'hundredths']),
    point([0, 'point'], 235, 140),
    grid([0, '25/100'], 60, 210, 16), ...shadeGrid([0, '25/100'], 60, 210, 16, 0, 2, 5),
    write([0, '25/100'], '25/100', 400, 250, 38),
    ...q(['0', '2', '5'].map((d, i) => write([0, '0.25'], d, 170 + 130 * i, 122, 44, 'y'))),
    write([0, '0.25'], '= 0.25', 400, 320, 40, 'y'),
  ],
  // One square is one hundredth
  [
    grid([0, 'Now'], GX, 70, S), wash([0, 'square'], GX, 70, S, S, 'b'),
    write([1, '100'], '100 equal squares', 430, 110, 26, 'd'),
    write([1, 'hundredth'], '1 square = 1 hundredth', 430, 165, 26),
    write([2, '1/100'], '1/100', 370, 260, 38), write([2, '0.01'], '= 0.01', 490, 260, 38, 'y'),
  ],
  // Count the squares
  [
    grid([0, 'count'], GX, 90, S),
    ...shadeGrid([1, 'Ten'], GX, 90, S, 0, 1), write([1, 'Ten'], '10,', 370, 120, 32),
    ...shadeGrid([1, 'twenty'], GX, 90, S, 1, 1), write([1, 'twenty'], '20,', 430, 120, 32),
    ...shadeGrid([1, '5'], GX, 90, S, 2, 0, 5), write([1, '5'], '+ 5', 500, 120, 32),
    write([1, '25'], '= 25 squares', 440, 190, 32),
    write([2, 'hundredths'], '25 hundredths', 440, 280, 36, 'y'),
  ],
  // Write it with a point
  [
    write([0, 'fraction'], 'as a fraction:', 230, 50, 30, 'd'), write([0, '25/100'], '25/100', 390, 50, 40),
    ...chart([1, 'point'], 300, 150, 90, 70, ['ones', 'tenths', 'hundredths']), point([1, 'point'], 390, 205),
    ...q(['0', '2', '5'].map((d, i) => write([1, '0.25'], d, 345 + 90 * i, 187, 40, 'y'))),
    grid([2, '2'], GX, 110, S), ...shadeGrid([2, 'full'], GX, 110, S, 0, 2),
    ring([2, 'full'], 435, 187, 22, 28, 'b'), write([2, 'full'], '2 full columns', 435, 262, 22, 'b'),
    ...shadeGrid([2, 'extra'], GX, 110, S, 2, 0, 5),
    ring([2, 'extra'], 525, 187, 22, 28, 'b'), write([2, 'extra'], '5 extra squares', 480, 300, 22, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'write'], '25/100 =', 230, 160, 36), write([1, '2.5'], '2.5', 360, 160, 40, 'r'),
    cross([1, 'means'], 325, 135, 70, 50),
    box([1, 'whole'], 110, 205, 50, 50, 'r'), wash([1, 'whole'], 110, 205, 50, 50, 'r'),
    box([1, 'whole'], 175, 205, 50, 50, 'r'), wash([1, 'whole'], 175, 205, 50, 50, 'r'),
    box([1, 'sheets'], 240, 205, 50, 50, 'r'), wash([1, 'sheets'], 240, 205, 25, 50, 'r'),
    write([1, 'sheets'], 'more than 2 sheets', 450, 232, 24, 'r'),
    write([2, 'Hundredths'], '25/100 =', 230, 320, 36), write([2, '0.25'], '0.25', 370, 320, 44, 'y'),
  ],
]
