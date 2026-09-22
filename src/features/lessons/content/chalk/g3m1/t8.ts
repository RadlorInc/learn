/** g3m1-t8's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, ring, cross, box, hop } from '../../../chalk'
import { chairs, eqn, numLine, type At } from './t5to8'

const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
// A number line 0–20, 24 px a unit, from x = 60.
const px = (n: number) => 60 + n * 24
const COUNT = ['Four', 'eight', 'twelve', 'sixteen', 'twenty'] as const
// 4 rows of 5 chairs.
const ROWS = [0, 1, 2, 3].map(r => [0, 1, 2, 3, 4].map(c => [190 + c * 44, 60 + r * 44] as [number, number]))

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // A number is missing
  (() => {
    const e = eqn([1, 'missing'], ['4', '×', '?', '=', '20'], 300, 270, 52, 'w', { 2: 'y' })
    return [
      ...[60, 100, 140, 180].map(y => ({ ...line([0, 'rows'], [[80, y], [280, y]], 'd', 2.5), quick: true })),
      write([0, 'rows'], '4 rows', 180, 215, 26),
      write([0, '20'], '20 chairs', 440, 120, 32),
      ...e.marks, box([1, 'missing'], e.xs[2] - 24, 238, 48, 64, 'y'),
      write([1, 'row'], 'in each row', e.xs[2], 340, 24, 'y'),
    ]
  })(),
  // The big idea
  (() => {
    const a = eqn([0, 'Multiplication'], ['4', '×', '?', '=', '20'], 160, 120, 40, 'w', { 2: 'y' })
    const b = eqn([0, 'division'], ['20', '÷', '4', '=', '?'], 440, 120, 40, 'b', { 4: 'y' })
    return [
      ...a.marks, ...b.marks,
      arrow([0, 'partners'], [265, 100], [335, 100], 'd'), arrow([0, 'partners'], [335, 140], [265, 140], 'd'),
      write([0, 'partners'], 'partners', 300, 185, 22, 'd'),
      write([0, 'fact'], 'a times fact you know', 300, 300, 30),
      arrow([0, 'find'], [230, 275], [a.xs[2], 152]), arrow([0, 'find'], [370, 275], [b.xs[4], 152]),
      ring([0, 'missing'], a.xs[2], 120, 20, 26, 'y'), ring([0, 'missing'], b.xs[4], 120, 20, 26, 'y'),
    ]
  })(),
  // Count by 4s
  [
    numLine([0, '4s'], px(0), 220, 20, 24), write([0, '4s'], '0', px(0), 250, 24, 'd'),
    write([0, '20'], 'stop at 20', px(20) - 20, 80, 24, 'y'), arrow([0, '20'], [px(20), 100], [px(20), 205], 'y'),
    ...COUNT.flatMap((w, i) => [
      hop([1, w], px(4 * i), px(4 * i + 4), 220, 'y'),
      { ...write([1, w], String(4 * i + 4), px(4 * i + 4), 250, 24, 'y'), quick: true },
      { ...write([1, w], String(i + 1), px(4 * i + 2), 148, 20, 'd'), quick: true },
    ]),
    write([2, '5'], '5 jumps', 300, 330, 36, 'y'),
  ],
  // The missing number is 5
  (() => {
    const e = eqn([1, 'So'], ['4', '×', '5', '=', '20'], 300, 290, 48, 'w', { 2: 'y' })
    return [
      ...ROWS.map(r => chairs([0, 'rows'], r)),
      write([0, 'row'], '5 in each row', 510, 126, 24, 'y'),
      ...e.marks, ring([1, 'missing'], e.xs[2], 290, 22, 30, 'y'),
    ]
  })(),
  // One picture, four facts
  [
    line([0, 'numbers'], [[150, 70], [60, 310], [240, 310], [150, 70]], 'd'),
    write([0, '4'], '4', 100, 285, 34), write([0, '5'], '5', 200, 285, 34), write([0, '20'], '20', 150, 150, 34, 'y'),
    write([0, 'facts'], 'four facts', 430, 40, 22, 'd'),
    write([1, '4'], '4 × 5 = 20', 430, 90, 34), write([1, 'and'], '5 × 4 = 20', 430, 145, 34),
    write([2, '20'], '20 ÷ 4 = 5', 430, 225, 34, 'b'), write([2, 'and'], '20 ÷ 5 = 4', 430, 280, 34, 'b'),
  ],
  // One thing not to do
  (() => {
    const good = eqn([2, 'like'], ['20', '÷', '5', '=', '4'], 430, 180, 36, 'y')
    return [
      ...warn([0, 'mix']),
      write([1, 'divide'], '5 ÷ 20 = 4', 170, 180, 36, 'r'), cross([1, 'LAST'], 80, 152, 180, 56),
      write([2, 'total'], 'biggest number = total', 300, 270, 28, 'b'),
      ...good.marks, ring([2, 'like'], good.xs[0], 180, 26, 26, 'y'),
    ]
  })(),
]
