/** g7m1-t1's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A table is hours along the top and pay underneath, the name column dim. Yellow is the steady answer, coral the mix-up. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring, wash, box, cells } from '../../../chalk'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })

/** A small table: `rows[0]` is the header; column 0 (the names) is `nameW` wide, every other column `w` wide.
 *  A line under the header and one after the names. Row centres are `h` apart from `y`. */
export const table = (at: At, x: number, y: number, rows: string[][], nameW = 120, w = 90, h = 44, s = 26, c: ChalkColor = 'w'): ChalkMark[] => {
  const cols = rows[0].length, right = x + nameW + w * (cols - 1)
  const cx = (j: number) => j === 0 ? x + nameW / 2 : x + nameW + w * (j - 1) + w / 2
  return [
    line(at, [[x, y + h / 2], [right, y + h / 2]], 'd'),
    line(at, [[x + nameW, y - h / 2 + 4], [x + nameW, y + h * (rows.length - 1) + h / 2 - 4]], 'd'),
    ...rows.flatMap((r, i) => r.map((t, j) => q(write(at, t, cx(j), y + h * i, j === 0 ? 22 : s, j === 0 ? 'd' : c)))),
  ]
}
/** The x centre of column `j` of a table drawn with the same x / nameW / w. */
export const col = (x: number, j: number, nameW = 120, w = 90) => x + nameW + w * (j - 1) + w / 2
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]

const A = [['hours', '1', '2', '3'], ['Job A', '$12', '$24', '$36']]
const B = [['hours', '1', '2', '3'], ['Job B', '$15', '$25', '$35']]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Both go up — so going up cannot tell them apart
  [
    ...table([0, 'A'], 80, 45, A),
    arrow([0, 'pay'], [215, 122], [465, 122]), write([0, 'pay'], 'goes up', 530, 122, 22, 'd'),
    ...table([1, 'B'], 80, 175, B),
    arrow([1, 'too'], [215, 252], [465, 252], 'b'), write([1, 'too'], 'goes up', 530, 252, 22, 'b'),
    write([1, 'same'], 'the same for every hour?', 300, 305, 28, 'y'),
    write([2, 'sharper'], 'going up is not the test', 300, 360, 26, 'r'),
  ],
  // The big idea: pay ÷ hours, all the same
  [
    ...table([0, 'Divide'], 80, 60, [...A, ['pay ÷ hours', '12', '12', '12']], 150),
    ring([0, 'same'], col(80, 2, 150), 148, 138, 26),
    write([0, 'steady'], 'all the same = one steady rate', 300, 260, 30, 'y'),
  ],
  // Check Job A
  [
    ...table([0, 'Job'], 110, 50, A),
    write([1, '12'], '12 ÷ 1 =', 260, 175, 32), write([1, '1'], '12', 385, 175, 32, 'y'),
    write([1, '24'], '24 ÷ 2 =', 260, 230, 32), write([1, '2'], '12', 385, 230, 32, 'y'),
    write([1, '36'], '36 ÷ 3 =', 260, 285, 32), write([1, '3'], '12', 385, 285, 32, 'y'),
    ring([2, 'Every'], 385, 230, 32, 84),
    write([2, 'pays'], '$12 every hour', 490, 345, 28, 'y'),
  ],
  // Check Job B
  [
    ...table([0, 'B'], 110, 50, B),
    write([1, '15'], '15 ÷ 1 =', 260, 175, 32), write([1, '1'], '15', 380, 175, 32, 'b'),
    write([1, '25'], '25 ÷ 2 =', 260, 235, 32), write([1, '2'], '12.5', 390, 235, 32, 'b'),
    ring([2, 'different'], 388, 205, 46, 60, 'r'),
    write([2, 'different'], 'different', 500, 205, 26, 'r'),
    write([2, 'not'], 'Job B: not the same each hour', 300, 330, 28),
  ],
  // Why Job B is different: the $5 is shared by more and more hours
  [
    ...[0, 1, 2].flatMap(i => {
      const y = 70 + i * 75
      return [
        q(write([0, 'extra'], `${i + 1} h`, 55, y + 25, 22, 'd')),
        wash([0, 'extra'], 90, y, 60, 50, 'b'), q(box([0, 'extra'], 90, y, 60, 50, 'b')), q(write([0, 'extra'], '$5', 120, y + 25, 22, 'b')),
        cells([0, 'then'], 150, y, 70 * (i + 1), 50, i + 1),
        ...Array.from({ length: i + 1 }, (_, k) => q(write([0, 'then'], '$10', 185 + 70 * k, y + 25, 22))),
        write([1, 'shared'], `$5 ÷ ${i + 1}`, 480, y + 25, 26, 'b'),
      ]
    }),
    write([1, 'changing'], 'each hour gets less of the $5', 300, 300, 26, 'b'),
    write([2, 'A'], 'Job A: $12 every hour', 300, 355, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '10'], 'up $10 each hour → steady', 300, 150, 30, 'r'), cross([1, 'NOT'], 120, 115, 360, 70),
    write([2, 'Divide'], 'pay ÷ hours: every answer the same?', 300, 240, 28, 'y'),
    write([2, 'match'], 'Job B: 15, then 12.5 → not steady', 300, 310, 28),
  ],
]
