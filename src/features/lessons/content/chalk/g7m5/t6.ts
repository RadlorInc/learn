/** g7m5-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The coin-and-cube table: a label column 50–150, six columns 70 wide to 570; yellow is the pair we want. */
import type { ChalkMark } from '../../../chalk'
import { write, line, ring, cross } from '../../../chalk'

type At = [number, string?]
const COL = (n: number) => 150 + 70 * (n - 1) + 35   // centre of cube column n (1–6)
/** The grid: a header row 45 high, then heads and tails rows 60 high each, from `top`. */
const grid = ([beat, at]: At, top: number): ChalkMark => {
  const b = top + 165, rows = [top, top + 45, top + 105, b]
  return { beat, at, c: 'w', d: rows.map(y => `M50 ${y} H570`).join(' ') + ` M50 ${top} V${b} M150 ${top} V${b}`
    + Array.from({ length: 5 }, (_, i) => ` M${220 + 70 * i} ${top} V${b}`).join('') + ` M570 ${top} V${b}` }
}
const rowY = (top: number, r: 0 | 1) => top + 75 + 60 * r
const heads = (at: At, top: number) => [write(at, 'heads', 100, rowY(top, 0), 24), write(at, 'tails', 100, rowY(top, 1), 24)]
const nums = (at: At, top: number): ChalkMark[] => [1, 2, 3, 4, 5, 6].map(n => ({ ...write(at, String(n), COL(n), top + 24, 26, 'd'), quick: true }))
const pairs = (at: At, top: number, skip: string[] = []): ChalkMark[] => (['H', 'T'] as const).flatMap((s, r) => [1, 2, 3, 4, 5, 6]
  .filter(n => !skip.includes(s + n)).map(n => ({ ...write(at, s + n, COL(n), rowY(top, r as 0 | 1), 26), quick: true })))
const full = (at: At, top: number): ChalkMark[] => [grid(at, top), ...heads(at, top), ...nums(at, top), ...pairs(at, top)]
const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding the chances does not work
  [
    write([0, '1/2'], 'heads: 1/2', 160, 60, 32), write([0, '1/6'], 'a 5: 1/6', 430, 60, 32),
    write([0, 'add'], 'just add?', 300, 125, 28, 'r'),
    write([1, '4/6'], '1/2 + 1/6 = 4/6', 300, 195, 36),
    write([1, 'bigger'], 'bigger than both?', 300, 250, 28, 'r'),
    write([2, 'harder'], 'both at once = harder', 300, 330, 32, 'y'),
  ],
  // The big idea: every pair in a table, the pairs you want over all the pairs
  [
    grid([0, 'table'], 30), ...heads([0, 'table'], 30), ...nums([0, 'table'], 30),
    ring([0, 'want'], COL(5), rowY(30, 0), 30, 24, 'y'),
    write([0, 'want'], 'pairs you want', 300, 250, 28, 'y'),
    line([0, 'over'], [[180, 278], [420, 278]]),
    write([0, 'all'], 'all the pairs', 300, 308, 28),
  ],
  // Fill in every pair
  [
    write([0, 'coin'], 'coin', 100, 50, 24, 'd'),
    grid([0, 'table'], 80), ...heads([0, 'heads'], 80),
    write([1, 'cube'], 'cube', 360, 50, 24, 'd'), ...nums([1, 'through'], 80),
    write([2, 'together'], 'each box = one way they land', 300, 320, 26, 'd'),
    write([2, 'H1'], 'H1', COL(1), rowY(80, 0), 26), write([2, 'H2'], 'H2', COL(2), rowY(80, 0), 26),
    ...pairs([2, 'T6'], 80, ['H1', 'H2']),
  ],
  // Count all the pairs
  [
    ...full([0, 'boxes'], 50),
    write([1, 'rows'], '2 rows', 150, 290, 34), write([1, 'columns'], '× 6 columns', 300, 290, 34), write([1, '12'], '= 12', 436, 290, 34, 'y'),
    write([2, 'likely'], '12 pairs, each just as likely', 300, 355, 26, 'd'),
  ],
  // Find the pair you want
  [
    ...full([0, 'Now'], 30),
    ring([1, 'H5'], COL(5), rowY(30, 0), 30, 24, 'y'),
    write([2, '1/12'], '1 box out of 12 = 1/12', 300, 265, 34, 'y'),
    write([3, 'should'], '1/12 is less than 1/6 and 1/2', 300, 335, 26),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ADD'], '1/2 + 1/6 = 4/6', 300, 150, 34, 'r'), cross([1, 'chances'], 230, 126, 38, 46),
    write([2, 'table'], 'make the table', 300, 235, 30),
    write([2, 'count'], '1 pair out of 12 = 1/12', 300, 300, 34, 'y'),
  ],
]
