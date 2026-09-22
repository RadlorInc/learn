/** g4m6-t5's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, ring, cross } from '../../../chalk'
import { grid, fill, chars, warn, type At } from './t5to7'

const q = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))
// Kim's grid on the left, Raj's on the right: true 10 × 10 grids, a column is a tenth.
const KIM = 70, RAJ = 330, GY = 80, GS = 200
const SK = 70, SR = 370, SY = 40, SS = 160
const both = (at: At): ChalkMark[] => q([
  grid(at, SK, SY, SS), ...fill(at, SK, SY, SS, 50),
  grid(at, SR, SY, SS), ...fill(at, SR, SY, SS, 40), ...fill(at, SR, SY, SS, 5, 'w', 40),
])

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // More digits, more juice?
  [
    write([0, "Kim's"], 'Kim', 176, 40, 24, 'd'), ...chars([0, "Kim's"], '0.5', [152, 174, 198], 100, 48),
    write([0, "Raj's"], 'Raj', 440, 40, 24, 'd'), ...chars([0, "Raj's"], '0.45', [400, 422, 446, 476], 100, 48),
    ring([1, 'longer'], 461, 100, 36, 32, 'r'), ring([1, '5'], 198, 100, 20, 32, 'r'),
    write([1, '45'], '45 > 5', 300, 185, 34, 'r'), write([1, 'Raj'], 'Raj drinks more?', 300, 240, 30),
    write([2, 'pieces'], 'after the point: pieces of 1 bottle', 300, 325, 26, 'b'),
  ],
  // The big idea: line up the points, the tenths decide
  [
    ...q([write([0, 'Line'], 'ones', 180, 55, 20, 'd'), write([0, 'Line'], 'tenths', 290, 55, 20, 'd'), write([0, 'Line'], 'hundredths', 380, 55, 20, 'd')]),
    ...chars([0, 'Line'], '0.5', [180, 230, 290], 120, 48), ...chars([0, 'points'], '0.45', [180, 230, 290, 380], 190, 48),
    line([0, 'points'], [[230, 80], [230, 228]], 'd', 2),
    arrow([0, 'left'], [140, 262], [440, 262], 'd'),
    ring([0, 'tenths'], 290, 155, 30, 64, 'y'), write([0, 'decide'], 'the tenths decide', 300, 320, 30, 'y'),
    ring([0, 'hundredths'], 380, 190, 30, 30, 'd'),
  ],
  // Tenths first
  [
    grid([0], KIM, GY, GS), grid([0], RAJ, GY, GS),
    box([0, 'column'], KIM, GY, GS / 10, GS, 'y'), write([0, 'column'], '1 column = 1 tenth', 300, 372, 24, 'd'),
    write([1, "Kim's"], 'Kim  0.5', 170, 50, 26), write([1, 'tenths'], '5 tenths', 170, 310, 28, 'b'),
    ...fill([1, 'columns'], KIM, GY, GS, 50),
    write([2, "Raj's"], 'Raj  0.45', 430, 50, 26), write([2, 'tenths'], '4 tenths', 430, 310, 28, 'b'),
    ...fill([2, 'tenths'], RAJ, GY, GS, 40), ...fill([2, 'loose'], RAJ, GY, GS, 5, 'w', 40),
    write([2, 'squares'], '+ 5 loose', 430, 340, 22),
  ],
  // Count the squares
  [
    ...both([0]), ring([0, 'loose'], SR + 72, SY + 40, 14, 46, 'd'),
    write([1, '50'], '50 squares', 150, 232, 26), write([1, '45'], '45 squares', 450, 232, 26),
    write([2, '0.50'], '0.5 = 0.50', 150, 290, 30),
    write([2, 'hundredths'], '50 hundredths', 150, 345, 26, 'y'), ring([2, 'beats'], 150, 345, 100, 26, 'y'),
    write([2, '45'], '0.45', 450, 290, 30), write([2, '45'], '45 hundredths', 450, 345, 26),
  ],
  // Say it with a sign
  [
    ...chars([0, '0.5'], '0.5', [152, 178, 206], 150, 56), { ...write([0, '0.5'], '>', 300, 150, 64, 'y'), quick: true },
    ...chars([0, '0.45'], '0.45', [386, 412, 440, 474], 150, 56),
    write([1, 'open'], 'open side', 300, 270, 26, 'd'), arrow([1, 'open'], [292, 248], [282, 196], 'd'),
    ring([1, 'bigger'], 180, 150, 60, 50, 'y'), write([1, 'bigger'], 'bigger', 180, 230, 26, 'y'),
    write([1, 'Kim'], 'Kim drinks more', 300, 345, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'pick'], 'more digits = bigger', 300, 165, 30, 'r'), cross([1, 'digits'], 140, 143, 320, 44),
    ...chars([2, 'Line'], '0.45', [160, 180, 202, 230], 250, 44), ...chars([2, 'points'], '0.5', [160, 180, 202], 315, 44),
    ring([2, '4'], 202, 282, 22, 60, 'y'), write([2, 'less'], '4 tenths < 5 tenths', 440, 282, 26, 'y'),
  ],
]
