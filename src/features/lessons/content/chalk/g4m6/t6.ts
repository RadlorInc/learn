/** g4m6-t6's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, box, wash, arrow, ring, cross } from '../../../chalk'
import { grid, fill, chars, warn } from './t5to7'

const q = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))
// The wall: a true 10 × 10 grid. Dad's tenths are blue columns, your hundredths are white squares.
const WX = 60, WY = 90, WS = 220

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Different sizes
  [
    write([0, '3'], '3/10', 150, 60, 36), write([0, '4'], '+  4/100', 285, 60, 36),
    write([0, '7'], '= 7 ?', 425, 60, 36, 'r'),
    grid([1], 80, 150, 200),
    write([1, 'tenth'], '1 tenth', 440, 190, 30, 'b'), wash([1, 'column'], 80, 150, 20, 200, 'b'), box([1, 'column'], 80, 150, 20, 200, 'b'),
    write([1, 'hundredth'], '1 hundredth', 440, 260, 30), wash([1, 'square'], 180, 150, 20, 20, 'w'), box([1, 'square'], 180, 150, 20, 20, 'w'),
    write([2, 'same'], 'not the same size', 440, 330, 26, 'r'),
  ],
  // The big idea: a tenth becomes 10 hundredths, then add
  [
    { ...wash([0, 'tenths'], 110, 80, 40, 200, 'b'), quick: true }, box([0, 'tenths'], 110, 80, 40, 200, 'b'),
    write([0, 'tenths'], '1 tenth', 130, 315, 24, 'b'),
    arrow([0, 'into'], [175, 180], [245, 180]),
    { ...wash([0, 'hundredths'], 270, 80, 40, 200, 'b'), quick: true },
    { beat: 0, at: 'hundredths', c: 'w', d: 'M270 80 h40 v200 h-40 Z' + Array.from({ length: 9 }, (_, i) => ` M270 ${100 + 20 * i} h40`).join('') },
    write([0, 'hundredths'], '10 hundredths', 290, 315, 24),
    write([0, 'same'], 'same size', 470, 150, 28), write([0, 'add'], 'then add', 470, 210, 34, 'y'),
  ],
  // Tenths into hundredths
  [
    grid([0], WX, WY, WS), box([0, 'column'], WX, WY, WS / 10, WS, 'y'),
    write([0, 'squares'], '10 squares', 455, 120, 28),
    write([1, 'tenth'], '1 tenth =', 455, 180, 28, 'b'), write([1, 'hundredths'], '10 hundredths', 455, 215, 28),
    ...fill([2, 'columns'], WX, WY, WS, 30),
    write([2, '30'], '30 squares', 455, 285, 26),
    write([2, '30/100'], '3/10 = 30/100', 300, 362, 32, 'y'),
  ],
  // Now add
  [
    ...q([grid([0], WX, WY, WS), ...fill([0], WX, WY, WS, 30)]),
    write([1, '30'], '30/100', 455, 130, 32, 'b'), ...fill([1, 'your'], WX, WY, WS, 4, 'w', 30),
    write([1, '4'], '+ 4/100', 455, 185, 32),
    write([2, '34'], '34 of 100', 170, 350, 28, 'y'), write([2, '34/100'], '= 34/100', 455, 245, 34, 'y'),
  ],
  // Write it with a point
  [
    write([0, '34/100'], '34/100', 150, 80, 38), write([0, 'point'], '=', 245, 80, 38),
    ...chars([0, '0.34'], '0.34', [320, 350, 385, 430], 80, 56),
    ...q([grid([1], 60, 160, 180), ...fill([1], 60, 160, 180, 30), ...fill([1], 60, 160, 180, 4, 'w', 30)]),
    ring([1, '3'], 385, 80, 20, 30, 'b'), write([1, 'columns'], '3 columns', 330, 300, 28, 'b'), arrow([1, 'columns'], [383, 115], [345, 275], 'b'),
    ring([1, '4'], 430, 80, 20, 30), write([1, 'squares'], '4 squares', 500, 200, 28), arrow([1, 'squares'], [436, 115], [490, 178]),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ADD'], '3/10 + 4/100', 220, 165, 32), write([1, 'bottom'], '= 7/110', 400, 165, 32, 'r'),
    cross([1, 'numbers'], 340, 143, 120, 44),
    write([2, 'sizes'], '10 and 100 = sizes of pieces', 300, 235, 24, 'd'),
    write([2, 'Change'], '3/10 = 30/100', 300, 290, 30, 'b'),
    write([2, 'first'], '30/100 + 4/100 = 34/100', 300, 345, 30, 'y'),
  ],
]
