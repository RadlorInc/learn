/** g4m3-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: a carried ten blue, a digit of the answer yellow, the mistake coral. Columns: hundreds x 264, tens 312, ones 360. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, ring } from '../../../chalk'
import { warn, tick, q, seq, num, type At } from './t1'

const O = 360, T = 312, H = 264, CY = 62, AY = 235
/** 164 over × 3 and the line, ones column at `ones`. */
const setup = (at: At, ones = O, s = 44, gap = 48, y = 110): ChalkMark[] => q([
  ...num(at, '164', ones, y, 'w', s, false, gap), write(at, '×', ones - 3 * gap, y + 55, s), ...num(at, '3', ones, y + 55, 'w', s, false, gap),
  line(at, [[ones - 3.6 * gap, y + 80], [ones + 0.8 * gap, y + 80]]),
])
const carry = (at: At, x: number, c: 'b' | 'd' = 'b') => write(at, '1', x, CY, 26, c)
const note = (at: At, t: string, y: number) => write(at, t, 500, y, 26, 'd')

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // A shorter way to write it
  [
    ...seq(60, 36, [[[0, '164'], '164 ='], [[0, '100'], '100'], [[0, '60'], '+ 60'], [[0, '4'], '+ 4']]),
    tick([1, 'works'], 470, 60),
    ...q([write([1, 'lot'], '100 × 3', 150, 130, 28), write([1, 'lot'], '60 × 3', 150, 175, 28), write([1, 'lot'], '4 × 3', 150, 220, 28)]),
    box([1, 'writing'], 70, 105, 160, 140, 'd'), write([1, 'writing'], 'a lot to write', 380, 175, 26, 'd'),
    write([2, 'shorter'], 'shorter way?', 170, 320, 28, 'y'),
    ...setup([2, 'Stack'], 520, 34, 30, 275), arrow([2, 'columns'], [270, 320], [410, 310], 'y'),
  ],
  // The big idea: start at the ones, move left, carry the ten up to the next place
  [
    ...q([write([0, 'Start'], 'H', H, 22, 20, 'd'), write([0, 'Start'], 'T', T, 22, 20, 'd'), write([0, 'Start'], 'O', O, 22, 20, 'd')]),
    ...setup([0, 'Start']),
    ring([0, 'ones'], O, 138, 20, 58, 'w'),
    arrow([0, 'left'], [385, 300], [250, 300], 'd'), write([0, 'left'], 'move left', 318, 335, 22, 'd'),
    write([0, '10'], '10 or more?', 490, 160, 24, 'd'),
    box([0, 'write'], 344, 213, 32, 44, 'y'), write([0, 'write'], 'ones here', 490, 235, 22, 'y'),
    box([0, 'carry'], 297, 45, 30, 34, 'b'), arrow([0, 'carry'], [430, 62], [336, 62], 'b'), write([0, 'carry'], 'the ten', 490, 62, 22, 'b'),
  ],
  // The ones
  [
    ...setup([0, 'Ones']), ring([0, 'Ones'], O, 138, 20, 58, 'w'),
    note([0, '12'], '4 × 3 = 12', 110),
    note([1, 'ten'], '1 ten, 2 ones', 165), write([1, 'Write'], '2', O, AY, 44, 'y'),
    carry([2, 'Carry'], T), ring([2, 'top'], T, CY, 14, 18, 'b'), arrow([2, 'tens'], [440, 140], [345, 70], 'b'),
  ],
  // The tens
  [
    ...setup([0, 'Now']), ...q([carry([0, 'Now'], T), write([0, 'Now'], '2', O, AY, 44, 'y')]),
    ring([0, 'tens'], T, 138, 20, 58, 'w'),
    note([0, '18'], '6 × 3 = 18', 110), ring([0, 'carried'], T, CY, 14, 18, 'b'), note([0, '19'], '18 + 1 = 19', 160),
    write([1, '9'], '9', T, AY, 44, 'y'), carry([1, 'carry'], H), ring([1, 'hundreds'], H, CY, 14, 18, 'b'),
  ],
  // The hundreds
  [
    ...setup([0, 'Last']), ...q([carry([0, 'Last'], T), carry([0, 'Last'], H), write([0, 'Last'], '2', O, AY, 44, 'y'), write([0, 'Last'], '9', T, AY, 44, 'y')]),
    ring([0, 'hundreds'], H, 138, 20, 58, 'w'),
    note([0, '3'], '1 × 3 = 3', 110), ring([0, 'carried'], H, CY, 14, 18, 'b'), note([0, '4'], '3 + 1 = 4', 160),
    write([0, '4'], '4', H, AY, 44, 'y'),
    ring([1, '492'], T, AY, 66, 30, 'y'), write([1, 'crayons'], '492 crayons', 300, 330, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...setup([1, 'FORGET'], 200, 38, 32, 160),
    ...num([2, '382'], '382', 200, 280, 'r', 38, true, 32), cross([2, '382'], 116, 255, 110, 50),
    ...setup([2, 'Multiply'], 480, 38, 32, 160),
    ...q([write([2, 'carry'], '1', 416, 116, 26, 'b'), write([2, 'carry'], '1', 448, 116, 26, 'b')]),
    ...num([2, 'carry'], '492', 480, 280, 'y', 38, true, 32), tick([2, 'carry'], 520, 280),
  ],
]
