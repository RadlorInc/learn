/** g8m6-t4's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The two-way table is drawn as a grid (dim) with its labels; a count goes in its box as she says it,
 *  yellow for a total she has just added, blue for the box she is asking about, coral for the mix-up. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, wash, cross, line } from '../../../chalk'

type At = [number, string?]
/** Grid geometry: a label column, then three columns; a header row, then three rows. */
const X0 = 40, LW = 130, CW = 130, HH = 40, RH = 45
export const colX = (c: number) => X0 + LW + CW * c + CW / 2          // c: 0 likes, 1 does not, 2 total
export const rowY = (y0: number, r: number) => y0 + HH + RH * r + RH / 2  // r: 0 grade 7, 1 grade 8, 2 total
/** The empty grid, one traced line. */
export const grid = (at: At, y0: number): ChalkMark => {
  const right = X0 + LW + CW * 3, bottom = y0 + HH + RH * 3
  const hs = [y0, y0 + HH, y0 + HH + RH, y0 + HH + RH * 2, bottom].map(y => `M${X0} ${y} H${right}`)
  const vs = [X0, X0 + LW, X0 + LW + CW, X0 + LW + CW * 2, right].map(x => `M${x} ${y0} V${bottom}`)
  return { beat: at[0], at: at[1], c: 'd', w: 2.4, d: [...hs, ...vs].join(' ') }
}
export const HEADS = ['likes pizza', 'does not', 'total']
export const heads = (at: At, y0: number, c: ChalkColor = 'd'): ChalkMark[] =>
  HEADS.map((h, i) => ({ ...write(at, h, colX(i), y0 + HH / 2, 22, c), quick: true }))
export const rowLabels = (at: At, y0: number, c: ChalkColor = 'd'): ChalkMark[] =>
  ['grade 7', 'grade 8', 'total'].map((h, i) => ({ ...write(at, h, X0 + LW / 2, rowY(y0, i), 22, c), quick: true }))
/** A count in box (row r, column c). */
export const val = (at: At, y0: number, r: number, c: number, t: string, col: ChalkColor = 'w'): ChalkMark =>
  ({ ...write(at, t, colX(c), rowY(y0, r), 28, col), quick: true })
/** The whole table frame: grid, column heads, row labels. */
export const frame = (at: At, y0: number): ChalkMark[] => [grid(at, y0), ...heads(at, y0), ...rowLabels(at, y0)]
/** A thin wash over one box. */
export const box1 = (at: At, y0: number, r: number, c: number, col: ChalkColor): ChalkMark =>
  wash(at, X0 + LW + CW * c + 4, y0 + HH + RH * r + 4, CW - 8, RH - 8, col)
/** A wash along row r (label and all), or down column c (head and all). */
export const rowWash = (at: At, y0: number, r: number, col: ChalkColor): ChalkMark =>
  wash(at, X0 + 4, y0 + HH + RH * r + 4, LW + CW * 3 - 8, RH - 8, col)
export const colWash = (at: At, y0: number, c: number, col: ChalkColor): ChalkMark =>
  wash(at, X0 + LW + CW * c + 4, y0 + 4, CW - 8, HH + RH * 3 - 8, col)
/** The coral warning sign at the top of Screen 7. */
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]

const Y = 20   // table top on the working boards (bottom at 195)

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two counts are not enough
  [
    ...frame([0], Y),
    val([1, '27'], Y, 2, 0, '27'), val([1, '20'], Y, 0, 2, '20'),
    box1([2, 'many'], Y, 0, 0, 'b'), val([2, 'many'], Y, 0, 0, '?', 'b'),
    write([2, 'cannot'], '27 and 20 alone cannot tell you', 300, 270, 28, 'r'),
  ],
  // The big idea: one question in the rows, one in the columns, each box fits both
  [
    grid([0], 60),
    ...rowLabels([0, 'rows'], 60, 'b'),
    ...heads([0, 'columns'], 60, 'w'),
    box1([0, 'box'], 60, 0, 0, 'y'),
    write([0, 'both'], 'grade 7 and likes pizza', 300, 300, 28, 'y'),
  ],
  // Fill one box
  [
    ...frame([0], Y),
    write([1, '12'], '12 students: grade 7, like pizza', 300, 250, 26),
    rowWash([2, 'row'], Y, 0, 'b'), colWash([2, 'column'], Y, 0, 'b'),
    val([2, 'column'], Y, 0, 0, '12', 'y'),
    write([2, 'column'], 'row meets column', 300, 320, 28, 'y'),
  ],
  // Add across
  [
    ...frame([0], Y),
    val([0], Y, 0, 0, '12'), val([0], Y, 0, 1, '8'), val([0], Y, 1, 0, '15'), val([0], Y, 1, 1, '5'),
    write([1, 'make'], '12 + 8 = 20', 300, 250, 32), val([1, '20'], Y, 0, 2, '20', 'y'),
    write([2, 'make'], '15 + 5 = 20', 300, 320, 32), val([2, '20'], Y, 1, 2, '20', 'y'),
  ],
  // Add down
  [
    ...frame([0], Y),
    val([0], Y, 0, 0, '12'), val([0], Y, 0, 1, '8'), val([0], Y, 1, 0, '15'), val([0], Y, 1, 1, '5'),
    val([0], Y, 0, 2, '20'), val([0], Y, 1, 2, '20'),
    write([1, 'make'], '12 + 15 = 27', 160, 245, 30), val([1, '27'], Y, 2, 0, '27', 'y'),
    write([2, 'make'], '8 + 5 = 13', 160, 300, 30), val([2, '13'], Y, 2, 1, '13', 'y'),
    write([3, 'make'], '27 + 13 = 40', 440, 245, 30), val([3, '40'], Y, 2, 2, '40', 'y'),
    write([3, 'same'], '20 + 20 = 40', 440, 300, 30),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ADD'], '20 + 27 = 47 students', 300, 150, 32), cross([1, 'column'], 135, 112, 330, 76),
    write([2, 'twice'], 'the 12 get counted twice', 300, 220, 28, 'r'),
    write([3, '40'], '20 + 20 = 40 students', 300, 300, 34, 'y'),
  ],
]
