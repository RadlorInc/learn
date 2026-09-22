/** g6m2-t2's chalkboards: index = screen index (0 is Screen 1, which has none). Two liters are two bars of one length. */
import type { ChalkMark } from '../../../chalk'
import { write, cells, span } from '../../../chalk'
import { shade } from '../g5m3/t5'
import { row, crossRow, fr, bar, cut, warn, tick, ex, px, type At, type Tok } from './t1'

/** The two liters, x 60–280 and 320–540. */
const L1 = 60, L2 = 320, LW = 220
const liters = (at: At, y: number, h: number): ChalkMark[] => [{ ...cells(at, L1, y, LW, h, 1), quick: true }, cells(at, L2, y, LW, h, 1)]
const thirds = (at: At, y1: number, y2: number): ChalkMark[] =>
  [1, 2].flatMap(i => [cut(at, L1 + (LW * i) / 3, y1, y2, 'w'), cut(at, L2 + (LW * i) / 3, y1, y2, 'w')])

const flip3: Tok[] = ex([0, 'Dividing'], '2 ÷ 2/3')
const mult3: Tok[] = [[[0, 'multiplying'], '2'], [[0, 'multiplying'], '×'], [[0, 'flipped'], ['3', '2'], 'y']]
const fx = px(flip3, 300, 46, 2)
const five: Tok[] = [[[3, 'Times'], '× 3'], [[3, 'divided'], '÷ 2'], [[3, 'same'], '='], [[3, '3/2'], '×', 'y'], [[3, '3/2'], ['3', '2'], 'y']]
/** Screen 6 lays its two rows out by hand, wide enough for a label under each piece. */
const K = (i: number) => [140, 250, 360][i]
const rest6: Tok[] = [[[2, '6/2'], '='], [[2, '6/2'], ['6', '2']], [[2, '3'], '='], [[2, '3'], '3', 'y']]
const wrong7: Tok[] = [[[1, 'FIRST'], '=', 'r'], [[1, 'FIRST'], ['1', '2'], 'r'], [[1, 'FIRST'], '×', 'r'], [[1, 'FIRST'], ['2', '3'], 'r']]
const right7: Tok[] = [[[2, 'stays'], '=', 'y'], [[2, 'stays'], '2', 'y'], [[2, 'stays'], '×', 'y'], [[2, 'upside'], ['3', '2'], 'y']]

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Drawing gets slow
  [
    ...liters([0, 'liters'], 50, 60), ...thirds([0, 'thirds'], 50, 110),
    write([0, 'count'], 'then count', 300, 145, 24, 'd'),
    ...row(ex([1, '5/6'], '5/6 ÷ 4/9'), 300, 215, 42),
    write([1, 'forever'], 'too slow to draw', 300, 290, 26, 'd'),
    write([2, 'faster'], 'a faster way?', 280, 355, 32), tick([2, 'Yes'], 400, 355),
  ],
  // The big idea: ÷ a fraction = × that fraction flipped
  [
    ...row(flip3, 300, 85, 46),
    write([0, 'same'], 'is the same as', 300, 180, 26, 'd'),
    ...row(mult3, 300, 275, 46),
    { beat: 0, at: 'upside', c: 'b', d: `M${fx + 32} 100 C${fx + 80} 140 ${fx + 80} 225 ${fx + 32} 262 M${fx + 36} 248 L${fx + 32} 262 L${fx + 47} 262` },
    write([0, 'upside'], 'flip', fx + 110, 180, 26, 'b'),
  ],
  // The slow way first
  [
    ...liters([0, 'liter'], 50, 60), ...thirds([0, 'thirds'], 50, 110),
    shade([0, '6'], L1, 50, LW, 60, 3, 3), shade([0, '6'], L2, 50, LW, 60, 3, 3),
    write([0, '6'], '6 thirds', 300, 145, 26, 'd'),
    ...[[L1, L1 + (LW * 2) / 3], [L1 + (LW * 2) / 3, L2 + LW / 3], [L2 + LW / 3, L2 + LW]].map(([a, b]) => ({ ...span([1, 'groups'], a + 3, b - 3, 190), quick: true })),
    ...[['1', 133], ['2', 300], ['3', 467]].map(([n, x]) => ({ ...write([1, '3'], n as string, x as number, 228, 30, 'y'), quick: true })),
    write([1, 'bottles'], '3 bottles', 300, 310, 38, 'y'),
  ],
  // Where the flip comes from
  [
    ...[150, 310].flatMap(x => bar([0, 'did'], x, 30, 140, 40, 3, 3)),
    write([1, 'thirds'], 'cut in thirds', 190, 140, 28, 'd'), ...row(ex([1, '3'], '× 3'), 420, 140, 40),
    write([2, 'Grouping'], 'group by 2', 190, 215, 28, 'd'), ...row(ex([2, '2'], '÷ 2'), 420, 215, 40),
    ...row(five, 300, 320, 42),
  ],
  // Flip and multiply
  [
    write([0, 'shortcut'], '2', K(0), 80, 44), write([0, 'shortcut'], '÷', K(1), 80, 44), ...fr([0, 'shortcut'], '2', '3', K(2), 80, 44),
    write([1, 'Keep'], 'keep', K(0), 150, 22, 'd'), write([1, 'Keep'], '=', K(0) - 60, 235, 44), write([1, 'Keep'], '2', K(0), 235, 44),
    write([1, 'Change'], 'change', K(1), 150, 22, 'd'), write([1, 'Change'], '×', K(1), 235, 44),
    write([1, 'Flip'], 'flip', K(2), 150, 22, 'd'), ...fr([1, '3/2'], '3', '2', K(2), 235, 44),
    ...row(rest6, 485, 235, 44),
    write([2, 'Same'], 'same answer', 290, 335, 28, 'd'), tick([2, 'answer'], 400, 335),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...row(ex([1, "Don't"], '2 ÷ 2/3'), 170, 180, 40), ...row(wrong7, 400, 180, 40),
    crossRow([1, 'number'], wrong7, 400, 180, 0, 3, 40),
    ...row(right7, 400, 300, 40),
  ],
]
