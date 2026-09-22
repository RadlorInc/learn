/** g7m4-t1's chalkboards (scale drawings): index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cells, arrow, span, cross, person } from '../../../chalk'

type At = [number, string?]
const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]
/** `ts` written in the middle of each of n equal cells from x, all at once. */
const inCells = (at: At, ts: string[], x: number, w: number, y: number, s: number, c: 'w' | 'y' | 'b' | 'd' = 'w'): ChalkMark[] =>
  ts.map((t, i) => ({ ...write(at, t, x + (w * (i + 0.5)) / ts.length, y, s, c), quick: true }))

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // The map is shrunk: a 6 cm park, a person who could step over it
  [
    write([0, 'map'], 'map', 180, 45, 22, 'd'), box([0, 'park'], 60, 70, 240, 160),
    span([0, '6'], 60, 300, 262), write([0, '6'], '6 cm', 180, 294, 24),
    write([1, 'real'], 'real park: 6 cm?', 450, 70, 24, 'r'),
    person([1, 'step'], 450, 250, 110, 0.4), line([1, 'step'], [[425, 262], [475, 262]], 'r'),
    write([1, 'step'], '6 cm', 450, 288, 20, 'r'),
    write([2, 'same'], 'every length shrank the same', 300, 355, 26, 'y'),
  ],
  // The big idea: each 1 cm is the same real length; × one way, ÷ the other
  [
    cells([0, '1'], 120, 50, 360, 50, 3), ...inCells([0, '1'], ['1 cm', '1 cm', '1 cm'], 120, 360, 75, 22, 'd'),
    ...inCells([0, 'same'], ['50 m', '50 m', '50 m'], 120, 360, 130, 24, 'y'),
    write([0, 'drawing'], 'drawing', 110, 235, 28), write([0, 'real'], 'real', 490, 235, 28),
    arrow([0, 'multiply'], [180, 220], [430, 220], 'y'), write([0, 'multiply'], '× 50', 305, 195, 28, 'y'),
    arrow([0, 'divide'], [430, 270], [180, 270], 'b'), write([0, 'divide'], '÷ 50', 305, 305, 28, 'b'),
  ],
  // Read the rule: 1 cm = 50 m, then 2 cm and 3 cm
  [
    write([0, '50'], '1 cm = 50 m', 300, 50, 34, 'y'),
    cells([1, 'centimeter'], 90, 95, 420, 50, 3), ...inCells([1, 'centimeter'], ['1 cm', '1 cm', '1 cm'], 90, 420, 120, 22, 'd'), ...inCells([1, 'meters'], ['50 m', '50 m', '50 m'], 90, 420, 172, 24),
    span([2, '2'], 90, 370, 222), write([2, '100'], '2 cm = 100 m', 230, 256, 26),
    span([2, '3'], 90, 510, 300), write([2, '150'], '3 cm = 150 m', 300, 334, 26, 'y'),
  ],
  // Count the centimeters: 6 pieces of 50 m
  [
    box([0, 'park'], 60, 60, 480, 70), span([0, '6'], 60, 540, 155), write([0, 'map'], '6 cm on the map', 300, 188, 24, 'd'),
    cells([1, 'pieces'], 60, 60, 480, 70, 6), ...inCells([1, 'stands'], ['50', '50', '50', '50', '50', '50'], 60, 480, 95, 26, 'y'),
    write([2, '6'], '6 × 50', 250, 255, 36), write([2, '300'], '= 300', 358, 255, 36, 'y'),
    write([2, 'real'], 'real park: 300 m', 300, 335, 32, 'y'),
  ],
  // Go back the other way: 200 m cut into 50s
  [
    write([0, 'real'], 'real', 110, 50, 28, 'b'), arrow([0, 'map'], [170, 50], [420, 50], 'b'), write([0, 'map'], 'map', 480, 50, 28, 'b'),
    box([1, 'path'], 60, 95, 480, 60), span([1, '200'], 60, 540, 180), write([1, '200'], '200 m', 300, 212, 24),
    write([1, '50s'], 'how many 50s?', 300, 258, 26, 'd'),
    cells([2, '4'], 60, 95, 480, 60, 4), ...inCells([2, '4'], ['50', '50', '50', '50'], 60, 480, 125, 26, 'b'),
    write([2, '200'], '200 ÷ 50', 260, 310, 32), write([2, '4'], '= 4', 362, 310, 32, 'y'),
    write([2, 'path'], 'path: 4 cm on the map', 300, 360, 28, 'y'),
  ],
  // One thing not to do: 6 + 50 crossed, 6 × 50 in yellow
  [
    ...warn([0, 'mix']),
    write([1, 'ADD'], '6 + 50 = 56 m', 300, 150, 34, 'r'), cross([2, 'tiny'], 440, 132, 36, 36),
    cells([2, 'Each'], 120, 205, 360, 40, 6), ...inCells([2, 'Each'], ['50', '50', '50', '50', '50', '50'], 120, 360, 225, 20, 'd'),
    write([2, 'multiply'], '6 × 50 = 300 m', 300, 310, 36, 'y'),
  ],
]
