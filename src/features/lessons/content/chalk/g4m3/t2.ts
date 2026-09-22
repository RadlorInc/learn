/** g4m3-t2's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: the hundreds part blue, the tens and ones parts white, the answer yellow, the mistake coral. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, span, cross, ring, clock } from '../../../chalk'
import { warn, tick, q, seq, num } from './t1'

// The three parts side by side: 300 (x 60–330), 40 (330–450), 2 (450–540).
const PX = [195, 390, 495]
const partsRow = (at: [number, string?], y: number): ChalkMark[] => [
  { beat: at[0], at: at[1], d: `M60 ${y} h480 v60 h-480 Z M330 ${y} v60 M450 ${y} v60`, c: 'w', quick: true },
  ...q([write(at, '300', PX[0], y - 25, 26, 'b'), write(at, '40', PX[1], y - 25, 26), write(at, '2', PX[2], y - 25, 26), write(at, '6', 35, y + 30, 30)]),
]

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too big to count
  [
    write([0, '342'], '342 × 6', 290, 70, 44), write([0, 'not'], '= ?', 420, 70, 44, 'r'),
    write([1, 'add'], '342 + 342 + 342 + 342 + 342 + 342', 300, 150, 24),
    span([1, 'six'], 100, 500, 180, 'd'), write([1, 'six'], '6 times', 300, 210, 22, 'd'),
    clock([1, 'slow'], 250, 265, 22), write([1, 'slow'], 'slow', 320, 265, 26, 'r'),
    write([2, 'faster'], 'faster way?', 190, 340, 30, 'y'),
    ...q([write([2, 'place'], '3', 420, 340, 40), write([2, 'place'], '4', 470, 340, 40), write([2, 'place'], '2', 520, 340, 40)]),
    { beat: 2, at: 'place', d: 'M445 315 v50 M495 315 v50', c: 'd' },
  ],
  // The big idea
  [
    write([0, 'Break'], '342', 300, 42, 36),
    box([0, 'hundreds'], 60, 80, 270, 60, 'b'), write([0, 'hundreds'], '300', PX[0], 110, 30, 'b'), write([0, 'hundreds'], 'hundreds', PX[0], 160, 22, 'd'),
    box([0, 'tens'], 330, 80, 120, 60), write([0, 'tens'], '40', PX[1], 110, 30), write([0, 'tens'], 'tens', PX[1], 160, 22, 'd'),
    box([0, 'ones'], 450, 80, 90, 60), write([0, 'ones'], '2', PX[2], 110, 30), write([0, 'ones'], 'ones', PX[2], 160, 22, 'd'),
    ...q([write([0, 'multiply'], '× 6', PX[0], 205, 26, 'b'), write([0, 'multiply'], '× 6', PX[1], 205, 26), write([0, 'multiply'], '× 6', PX[2], 205, 26)]),
    box([0, 'add'], 165, 245, 60, 44, 'b'), write([0, 'add'], '+', 292, 267, 32),
    box([0, 'add'], 360, 245, 60, 44), write([0, 'add'], '+', 442, 267, 32), box([0, 'add'], 465, 245, 60, 44),
    write([0, 'parts'], '= 342 × 6', 345, 340, 30, 'y'),
  ],
  // Break 342 apart
  [
    ...q([write([0, '342'], '3', 264, 55, 48, 'b'), write([0, '342'], '4', 300, 55, 48), write([0, '342'], '2', 336, 55, 48)]),
    arrow([0, 'hundreds'], [258, 85], [160, 120], 'b'), write([0, 'hundreds'], '3 hundreds', 130, 145, 26, 'b'),
    write([0, '300'], '300', 130, 190, 34, 'b'),
    arrow([1, 'tens'], [300, 85], [300, 120]), write([1, 'tens'], '4 tens', 300, 145, 26),
    write([1, '40'], '40', 300, 190, 34),
    arrow([1, 'just'], [342, 85], [450, 120]), write([1, 'just'], '2 ones', 470, 145, 26), write([1, 'just'], '2', 470, 190, 34),
    ...seq(290, 38, [[[2, '342'], '342 ='], [[2, '300'], '300', 'b'], [[2, '40'], '+ 40'], [[2, '2'], '+ 2']]),
  ],
  // Multiply each part
  [
    ...partsRow([0], 70),
    ...seq(190, 28, [[[0, '300'], '300 × 6', 'b'], [[0, 'hundreds'], '= 18 hundreds', 'd'], [[0, '1,800'], '= 1,800', 'b']]),
    write([0, '1,800'], '1,800', PX[0], 100, 30, 'b'),
    ...seq(255, 28, [[[1, '40'], '40 × 6'], [[1, 'tens'], '= 24 tens', 'd'], [[1, '240'], '= 240']]),
    write([1, '240'], '240', PX[1], 100, 28),
    ...seq(320, 28, [[[2, '2'], '2 × 6'], [[2, '12'], '= 12']]), write([2, '12'], '12', PX[2], 100, 28),
  ],
  // Add all the parts, in columns (ones at x 360)
  [
    ...num([0, '1,800'], '1800', 360, 75, 'b'),
    ...num([0, '240'], '240', 360, 125),
    write([0, '12'], '+', 216, 175, 40), ...num([0, '12'], '12', 360, 175),
    line([0, '2,052'], [[200, 200], [380, 200]]),
    ...q([write([0, '2,052'], '2', 360, 240, 40, 'y'), write([0, '2,052'], '5', 324, 240, 40, 'y'), write([0, '2,052'], '0', 288, 240, 40, 'y'),
      write([0, '2,052'], '1', 252, 38, 22, 'd'), write([0, '2,052'], '2', 252, 240, 40, 'y')]),
    ...seq(305, 36, [[[1, '342'], '342 × 6'], [[1, '2,052'], '= 2,052', 'y']]),
    write([2, 'seats'], '2,052 seats', 300, 360, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...q([write([1, 'FORGET'], '3', 264, 150, 44, 'b'), write([1, 'FORGET'], '4', 300, 150, 44), write([1, 'FORGET'], '2', 336, 150, 44)]),
    ring([1, 'ones'], 336, 150, 18, 28, 'y'),
    write([2, 'Without'], '342 × 6 = 2,040', 300, 220, 32, 'r'), cross([2, '2,040'], 170, 198, 260, 44),
    write([2, 'Add'], '1,800 + 240 + 12', 300, 285, 32),
    write([2, '2,052'], '= 2,052', 300, 345, 36, 'y'), tick([2, '2,052'], 385, 345),
  ],
]
