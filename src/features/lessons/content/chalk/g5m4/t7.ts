/** g5m4-t7's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cells, arrow, hop, cross, ring } from '../../../chalk'

type At = [number, string?]
type C = 'w' | 'y' | 'b' | 'r' | 'd'
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
const q = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))

// A place chart H T O | 1/10 1/100: whole-number cells x 110–350, the point in a gap at x 360, decimal cells x 370–530.
const X = [150, 230, 310, 410, 490], PX = 360
const heads = (at: At, y: number) => q(['H', 'T', 'O', '1/10', '1/100'].map((h, i) => write(at, h, X[i], y, 20, 'd')))
/** One chart row: the cells and the point, `top` its top edge. */
const chart = (at: At, top: number): ChalkMark[] =>
  [cells(at, 110, top, 240, 55, 3), cells(at, 370, top, 160, 55, 2), write(at, '.', PX, top + 22, 44)]
/** Digits into a row, from column `from` (0 = H), `top` the row's top edge. */
const digits = (at: At, from: number, ds: string, top: number, c: C = 'w') => q([...ds].map((d, i) => write(at, d, X[from + i], top + 28, 36, c)))

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding zeros does not work
  [
    write([0, 'numbers'], '37 × 100', 220, 70, 34), write([0, 'zeros'], '= 3,700', 360, 70, 34), ring([0, 'zeros'], 413, 70, 24, 22, 'd'),
    write([1, '2.36'], '2.36 × 100', 220, 160, 34), write([1, '2.3600'], '= 2.3600', 380, 160, 34),
    write([2, 'still'], '2.3600 = 2.36', 300, 250, 34), write([2, 'nothing'], 'no change', 300, 320, 30, 'r'),
    cross([2, 'nothing'], 315, 138, 135, 44),
  ],
  // The big idea: the point stays, the digits slide past it
  [
    write([0, '10'], '10', 130, 50, 34), write([0, '100'], '100', 300, 50, 34), write([0, '1,000'], '1,000', 470, 50, 34),
    ...q([['1 place', 130], ['2 places', 300], ['3 places', 470]].map(([t, x]) => write([0, '1,000'], t as string, x as number, 92, 22, 'y'))),
    ...chart([0, 'point'], 170), ring([0, 'point'], PX, 197, 20, 26, 'y'),
    write([0, 'slides'], 'digits slide past it', 300, 150, 22, 'd'),
    arrow([0, 'left'], [290, 265], [130, 265]), write([0, 'multiply'], '× multiply', 200, 310, 28),
    arrow([0, 'right'], [430, 265], [570, 265], 'b'), write([0, 'divide'], '÷ divide', 470, 310, 28, 'b'),
  ],
  // One place left
  [
    ...heads([0, 'place'], 100), ...chart([0, 'place'], 115), ...digits([0, 'place'], 2, '236', 115), write([0, 'place'], '2.36', 60, 143, 24),
    ...q([[490, 410], [410, 310], [310, 230], [230, 150]].map(([a, b]) => hop([0, 'right'], a, b, 84, 'd'))),
    write([0, 'right'], '× 10', 555, 60, 24, 'd'),
    write([1, '2.36'], '2.36 × 10', 240, 320, 32), ...chart([1, 'slides'], 215),
    ...q([310, 410, 490].map(x => arrow([1, 'left'], [x, 172], [x - (x === 410 ? 100 : 80) + 8, 212], 'w'))),
    ...digits([1, 'left'], 1, '23', 215, 'y'), ...digits([1, 'left'], 3, '6', 215, 'y'),
    write([2, '23.6'], '23.6', 60, 243, 24, 'y'), write([2, '23.6'], '= 23.6', 390, 320, 32, 'y'),
  ],
  // Two places left
  [
    write([0, '100'], '× 100', 200, 40, 30), write([0, '10'], '= × 10 × 10', 360, 40, 30),
    ...heads([1, 'every'], 90), ...chart([1, 'every'], 105), ...digits([1, 'every'], 2, '236', 105), write([1, 'every'], '2.36', 60, 133, 24),
    ...chart([1, 'two'], 215),
    ...q([[310, 150], [410, 230], [490, 310]].map(([a, b]) => arrow([1, 'left'], [a, 162], [b + 8, 212]))),
    ...digits([2, 'hundreds'], 0, '2', 215, 'y'), ...digits([2, 'hundreds'], 1, '3', 215, 'y'), ...digits([2, 'hundreds'], 2, '6', 215, 'y'),
    write([2, '236'], '236', 60, 243, 24, 'y'), write([2, '236'], '2.36 × 100 = 236', 300, 315, 30, 'y'),
    write([3, 'kilograms'], '236 kg', 300, 368, 28, 'y'), box([3, 'kilograms'], 240, 346, 120, 44, 'y'),
  ],
  // Dividing slides right
  [
    ...heads([0, '236'], 45), ...chart([0, '236'], 60), ...digits([0, '236'], 0, '236', 60), write([0, '236'], '236', 60, 88, 24),
    write([0, '236'], '236 ÷ 100', 240, 300, 32), ...chart([0, 'right'], 170),
    ...q([[150, 310], [230, 410], [310, 490]].map(([a, b]) => arrow([0, 'right'], [a, 117], [b - 8, 167], 'b'))),
    ...digits([1, 'ones'], 2, '2', 170, 'b'), ...digits([1, 'ones'], 3, '3', 170, 'b'), ...digits([1, 'ones'], 4, '6', 170, 'b'),
    write([2, '2.36'], '= 2.36', 390, 300, 32, 'y'), write([2, '2.36'], '2.36', 60, 198, 24, 'y'),
    write([2, 'bag'], 'one bag', 300, 355, 28, 'd'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'zeros'], '2.36 × 100', 220, 160, 34), write([1, '2.3600'], '= 2.3600', 380, 160, 34),
    cross([1, 'still'], 315, 138, 135, 44), write([1, '2.36'], 'still 2.36', 300, 215, 26, 'd'),
    arrow([2, 'Slide'], [370, 270], [230, 270], 'y'),
    write([2, 'digit'], 'slide every digit', 300, 305, 24, 'y'),
    write([2, '236'], '2.36 × 100 = 236', 300, 360, 34, 'y'),
  ],
]
