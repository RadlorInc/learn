/** g4m2-t5's chalkboards: index = screen index (0 is Screen 1, which has none). Yellow = the result, blue = the rule, coral = the slip. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, cells, arrow, cross } from '../../../chalk'
import { warn, tick, type At } from '../g3m1/t1'

// A place chart, five columns (TTh Th H T O), 90 wide, x 75–525.
const X = [120, 210, 300, 390, 480]
const HEAD = ['TTh', 'Th', 'H', 'T', 'O']
const heads = (at: At, y: number): ChalkMark[] => HEAD.map((h, i) => ({ ...write(at, h, X[i], y, 20, 'd'), quick: true }))
const chart = (at: At, y: number) => cells(at, 75, y, 450, 55, 5)
/** Digits `ds` in the chart from column `from`, one mark each. */
const row = (at: At, from: number, ds: string, y: number, c: ChalkColor = 'w'): ChalkMark[] =>
  [...ds].map((d, i) => ({ ...write(at, d, X[from + i], y, 34, c), quick: true }))
/** Each digit of 34 (tens and ones columns) slides `n` places left, from row y1 to row y2. */
const slides = (at: At, n: number, y1: number, y2: number): ChalkMark[] =>
  [3, 4].map(col => arrow(at, [X[col], y1], [X[col - n] + 6, y2], 'y'))

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Counting by 10s takes a while
  [
    write([0, '10s'], '10, 20, 30, 40, 50, ...', 300, 60, 30),
    write([0, '34'], '34 times', 300, 110, 28, 'd'),
    write([1, 'counting'], 'a lot of counting', 300, 160, 28, 'd'),
    write([2, 'faster'], 'faster way?', 300, 215, 32, 'y'),
    ...heads([2, 'digits'], 265), chart([2, 'digits'], 280), ...row([2, 'digits'], 3, '34', 307),
  ],
  // The big idea
  [
    write([0, '10'], '10', 130, 55, 36), write([0, '100'], '100', 300, 55, 36), write([0, '1,000'], '1,000', 470, 55, 36),
    ...[['1 zero', 130], ['2 zeros', 300], ['3 zeros', 470]].map(([t, x]) => ({ ...write([0, '1,000'], t as string, x as number, 100, 22, 'd'), quick: true })),
    write([0, 'slides'], '1 zero = 1 place', 300, 165, 30, 'b'),
    write([0, 'digit'], '34', 380, 255, 44),
    arrow([0, 'left'], [335, 255], [170, 255], 'y'), write([0, 'left'], 'left', 250, 300, 28, 'y'),
  ],
  // One zero, one place
  [
    write([0, '10'], '34 × 10', 170, 45, 34), write([0, 'zero'], '1 zero', 490, 45, 24, 'd'),
    ...heads([0, 'digit'], 95), chart([0, 'digit'], 110), ...row([0, 'digit'], 3, '34', 137),
    write([0, 'place'], '1 zero = 1 place', 300, 345, 28, 'b'),
    chart([0, 'left'], 210), ...slides([0, 'left'], 1, 168, 207),
    ...row([1, 'hundreds'], 2, '3', 237, 'y'), ...row([1, 'ones'], 3, '4', 237, 'y'),
    ...row([2, '0'], 4, '0', 237, 'y'), write([2, "That's"], '= 340', 330, 45, 34, 'y'),
  ],
  // Two zeros, two places
  [
    ...heads([0, 'Now'], 95), chart([0, 'Now'], 110), ...row([0, 'Now'], 3, '34', 137),
    write([0, '100'], '34 × 100', 170, 45, 34), write([0, 'zeros'], '2 zeros', 490, 45, 24, 'd'),
    chart([0, 'slides'], 210), ...slides([0, 'places'], 2, 168, 207),
    write([0, 'places'], '2 zeros = 2 places', 300, 345, 28, 'b'),
    ...row([1, 'thousands'], 1, '3', 237, 'y'), ...row([1, 'hundreds'], 2, '4', 237, 'y'),
    ...row([1, '0s'], 3, '00', 237, 'y'), write([1, '3,400'], '= 3,400', 350, 45, 34, 'y'),
  ],
  // Three zeros, three places
  [
    ...heads([0, 'And'], 95), chart([0, 'And'], 110), ...row([0, 'And'], 3, '34', 137),
    write([0, '1,000'], '34 × 1,000', 170, 45, 34), write([0, 'zeros'], '3 zeros', 505, 45, 24, 'd'),
    chart([0, 'places'], 210), ...slides([0, 'places'], 3, 168, 207),
    ...row([1, '34,000'], 0, '34000', 237, 'y'), write([1, '34,000'], '= 34,000', 370, 45, 34, 'y'),
    ...[['× 10 → 1', 120], ['× 100 → 2', 300], ['× 1,000 → 3', 480]].map(([t, x]) => ({ ...write([1, 'pattern'], t as string, x as number, 325, 26, 'b'), quick: true })),
    write([1, 'more'], 'one more zero, one more place', 300, 372, 24, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '340'], '34 × 100 = 340', 160, 175, 34, 'r'), write([1, 'slide'], '1 place', 160, 220, 26, 'r'),
    cross([1, 'ONE'], 40, 150, 240, 90),
    write([2, 'zeros'], '2 zeros', 450, 175, 30, 'b'), write([2, 'places'], '= 2 places', 450, 220, 30, 'b'),
    write([2, '3,400'], '34 × 100 = 3,400', 280, 320, 40, 'y'), tick([2, '3,400'], 465, 320),
  ],
]
