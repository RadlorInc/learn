/** g6m4-t2's chalkboards: index = screen index (0 is Screen 1, which has none). Colours as t1. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, span, cross } from '../../../chalk'
import { grid, fill } from '../g4m6/t5to7'
import { warn, tick } from '../g3m1/t1'
import { q, GX, GY, GS, TX } from './t1'

// The grid cut into 4 equal parts: 5 × 5 blocks of 25 squares, 130 wide.
const H = GS / 2
const quarters = (at: [number, string?]): ChalkMark[] => [
  line(at, [[GX + H, GY], [GX + H, GY + GS]], 'w', 6), line(at, [[GX, GY + H], [GX + GS, GY + H]], 'w', 6),
]

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // They look nothing alike
  [
    write([0, '3/4'], '3/4', 130, 60, 44), write([0, '0.75'], '0.75', 300, 60, 44), write([0, '75%'], '75%', 470, 60, 44),
    write([0, 'digits'], 'different digits', 300, 120, 24, 'd'),
    write([1, 'same'], 'the same amount?', 300, 180, 32, 'y'),
    grid([2, 'grid'], 230, 225, 140), write([2, '100'], '100 squares', 480, 295, 24, 'd'),
  ],
  // The big idea: one grid, three ways to write it
  [
    grid([0, '100'], GX, GY, GS), ...fill([0, 'and'], GX, GY, GS, 75),
    write([0, 'write'], '75/100', TX, 100, 36), write([0, 'three'], '0.75', TX, 170, 36), write([0, 'ways'], '75%', TX, 240, 36),
    write([0, 'same'], 'all the same', TX, 320, 30, 'y'),
  ],
  // Make it out of 100
  [
    grid([0, 'Cut'], GX, GY, GS), ...quarters([0, '4']), write([0, 'parts'], '4 equal parts', TX, 95, 28, 'd'),
    write([1, '100'], '100 ÷ 4 = 25', TX, 155, 32), write([1, 'squares'], '1 part = 25 squares', TX, 205, 24),
    wash([2, 'Take'], GX, GY, H, GS, 'b'), wash([2, 'Take'], GX + H, GY, H, H, 'b'),
    ...q([[GX + H / 2, GY + H / 2], [GX + H / 2, GY + H * 1.5], [GX + H * 1.5, GY + H / 2]].map(([x, y]) => write([2, 'parts'], '25', x, y, 30))),
    write([2, '75'], '3 parts = 75 squares', TX, 265, 24, 'b'),
    write([2, '75/100'], '3/4 = 75/100', TX, 325, 36, 'y'),
  ],
  // Write it with a point
  [
    grid([0, 'Now'], GX, GY, GS), ...fill([0, 'columns'], GX, GY, GS, 75),
    write([1, 'full'], '7 full columns', TX, 110, 28, 'b'), write([1, '5'], '+ 5 squares', TX, 160, 28, 'b'),
    write([2, 'hundredths'], '75/100', TX, 235, 36), write([2, '0.75'], '= 0.75', TX, 300, 48, 'y'),
  ],
  // Write it as a percent
  [
    write([0, 'out'], '75 out of 100', 230, 60, 34), write([0, 'is'], '= 75%', 440, 60, 36, 'y'),
    box([1, '3/4'], 60, 140, 130, 80), write([1, '3/4'], '3/4', 125, 180, 40),
    write([1, '0.75'], '=', 212, 180, 30), box([1, '0.75'], 235, 140, 130, 80), write([1, '0.75'], '0.75', 300, 180, 40),
    write([1, '75%'], '=', 387, 180, 30), box([1, '75%'], 410, 140, 130, 80), write([1, '75%'], '75%', 475, 180, 40),
    span([1, 'amount'], 60, 540, 250, 'y'), write([1, 'amount'], 'one amount', 300, 285, 30, 'y'),
    tick([2, 'right'], 112, 345), tick([2, 'right'], 287, 345), tick([2, 'right'], 462, 345),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '3/4'], '3/4 =', 240, 175, 40), write([1, 'not'], '34%', 370, 175, 40, 'r'), cross([1, 'not'], 330, 150, 80, 50),
    write([2, '100'], '3/4 = 75/100', 245, 285, 36), write([2, 'or'], '= 75%', 425, 285, 36, 'y'),
  ],
]
