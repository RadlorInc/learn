/** g5m4-t9's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cells, arrow, span, cross, ring, ticks } from '../../../chalk'

type At = [number, string?]
type C = 'w' | 'y' | 'b' | 'r' | 'd'
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
const q = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))

// A place chart Th H T O | 1/10: whole-number cells x 110–430, the point in a gap at x 440, the tenths cell x 450–530.
const X = [150, 230, 310, 390, 490], PX = 440
const heads = (at: At, y: number) => q(['Th', 'H', 'T', 'O', '1/10'].map((h, i) => write(at, h, X[i], y, 20, 'd')))
const chart = (at: At, top: number): ChalkMark[] =>
  [cells(at, 110, top, 320, 55, 4), cells(at, 450, top, 80, 55, 1), write(at, '.', PX, top + 22, 44)]
const digits = (at: At, from: number, ds: string, top: number, c: C = 'w') => q([...ds].map((d, i) => write(at, d, X[from + i], top + 28, 36, c)))

export const T9: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two sizes of unit
  [
    span([0, 'kilometer'], 60, 540, 80), write([0, 'kilometer'], '1 km', 300, 45, 30),
    span([0, 'meter'], 60, 110, 185, 'b'), write([0, 'meter'], '1 m', 85, 215, 24, 'b'),
    ticks([0, '1,000'], 60, 100, 480, 48), write([0, '1,000'], '1,000 m in 1 km', 300, 140, 26, 'b'),
    write([1, 'trail'], '2.5 km = ? m', 300, 285, 34), write([1, 'fewer'], 'more meters', 300, 345, 30, 'y'),
  ],
  // The big idea: smaller unit → multiply, bigger unit → divide
  [
    box([0, 'To'], 150, 60, 300, 50), cells([0, 'To'], 150, 170, 300, 50, 10, 'b'),
    line([0, 'To'], [[150, 110], [150, 170]], 'd', 2), line([0, 'To'], [[450, 110], [450, 170]], 'd', 2),
    write([0, 'smaller'], 'smaller unit', 300, 250, 26, 'b'),
    arrow([0, 'multiply'], [115, 85], [115, 195]), write([0, 'multiply'], '×', 85, 140, 40),
    write([0, 'more'], 'more of them', 300, 290, 24, 'b'),
    write([0, 'bigger'], 'bigger unit', 300, 85, 26),
    arrow([0, 'divide'], [485, 195], [485, 85], 'b'), write([0, 'divide'], '÷', 515, 140, 40, 'b'),
    write([0, 'divide'], 'to smaller: ×', 175, 355, 26), write([0, 'divide'], 'to bigger: ÷', 425, 355, 26, 'b'),
  ],
  // Smaller unit, multiply
  [
    write([0, 'kilometers'], 'km', 200, 65, 36), arrow([0, 'meters'], [240, 65], [350, 65]), write([0, 'meters'], 'm', 390, 65, 36),
    write([0, 'smaller'], 'smaller unit', 390, 110, 24, 'b'),
    write([1, 'more'], 'more of them', 200, 190, 28, 'b'), arrow([1, 'multiply'], [300, 190], [370, 190]),
    write([1, 'multiply'], '×', 410, 192, 40), ring([1, 'multiply'], 410, 190, 26, 26),
    write([2, '1,000'], '1 km = 1,000 m', 300, 275, 32), write([2, 'by'], '× 1,000', 300, 345, 36, 'y'), box([2, 'by'], 225, 320, 150, 50, 'y'),
  ],
  // Slide the digits
  [
    ...heads([0, 'Times'], 40), ...chart([0, 'Times'], 55), ...digits([0, 'Times'], 3, '2', 55), ...digits([0, 'Times'], 4, '5', 55),
    write([0, 'Times'], '2.5', 60, 83, 24),
    ...q([[390, 150], [490, 230]].map(([a, b]) => arrow([0, 'left'], [a, 112], [b + 8, 157]))),
    ...chart([0, 'left'], 160),
    ...digits([1, 'thousands'], 0, '2', 160, 'y'), ...digits([1, 'hundreds'], 1, '5', 160, 'y'), ...digits([1, 'Zeros'], 2, '00', 160, 'y'),
    write([1, 'rest'], '2,500', 60, 188, 24, 'y'),
    write([2, '2.5'], '2.5 × 1,000', 220, 285, 32), write([2, '2,500'], '= 2,500', 385, 285, 32, 'y'),
    write([2, 'meters'], '2,500 m', 300, 350, 30, 'y'), box([2, 'meters'], 235, 327, 130, 46, 'y'),
  ],
  // And back again
  [
    write([0, '2,500'], '2.5 km = 2,500 m', 250, 65, 34), line([0, 'Yes'], [[430, 65], [445, 82], [475, 45]], 'y', 4),
    ticks([0, 'small'], 100, 115, 400, 50), write([0, 'lots'], 'small unit, lots of them', 300, 160, 24, 'b'),
    write([1, 'kilometers'], 'm → km: bigger unit', 300, 235, 30), write([1, 'Divide'], '÷', 490, 235, 36, 'b'),
    write([1, '2.5'], '2,500 ÷ 1,000 = 2.5', 300, 320, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'DIVIDE'], '2.5 ÷ 1,000', 210, 165, 32), write([1, '0.0025'], '= 0.0025 m', 400, 165, 32),
    cross([1, 'speck'], 120, 142, 380, 46),
    write([2, 'Smaller'], 'smaller unit, more of them', 300, 240, 26, 'b'),
    write([2, 'multiply'], '2.5 × 1,000 = 2,500 m', 300, 320, 34, 'y'),
  ],
]
