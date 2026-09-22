/** g8m3-t1's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  An input/output table is two rows of cells; blue is an input she points at, yellow the result, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, line, cells, arrow, cross, ring } from '../../../chalk'

type At = [number, string?]
/** Centre x of cell `i` of a table starting at x0 with cells cw wide. */
export const cx = (i: number, x0 = 170, cw = 90) => x0 + cw * i + cw / 2
/** A two-row table (top row at y, rows 50 tall) with its row labels, and optional values in each row. */
export const table = (at: At, y: number, labels: [string, string], top: string[] = [], bottom: string[] = [], n = 4, x0 = 170, cw = 90): ChalkMark[] => [
  cells(at, x0, y, n * cw, 50, n, 'd'), cells(at, x0, y + 50, n * cw, 50, n, 'd'),
  write(at, labels[0], x0 - 65, y + 25, 22, 'd'), write(at, labels[1], x0 - 65, y + 75, 22, 'd'),
  ...top.map((v, i) => ({ ...write(at, v, cx(i, x0, cw), y + 25, 30), quick: true })),
  ...bottom.map((v, i) => ({ ...write(at, v, cx(i, x0, cw), y + 75, 30), quick: true })),
]
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]

const IO: [string, string] = ['input', 'output']

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // A pattern is not the test
  [
    ...table([0, 'table'], 40, IO, ['1', '2', '3', '4'], ['5', '2', '9', '2']),
    write([1, 'pattern'], 'a pattern?', 270, 205, 30, 'b'), arrow([1, 'up'], [375, 222], [405, 188], 'b'),
    cross([2, "isn't"], 190, 178, 162, 54),
    write([3, 'broken'], 'broken?', 200, 280, 30), write([3, 'No'], 'no', 330, 280, 30, 'y'),
    write([3, 'simpler'], 'a simpler question', 300, 350, 32, 'y'),
  ],
  // The big idea: one input, one output; one input, two outputs breaks it
  [
    ring([0, 'input'], 100, 170, 26, 26, 'b'), write([0, 'input'], 'A', 100, 170, 34, 'b'),
    arrow([0, 'exactly'], [132, 170], [195, 170]), write([0, 'output'], 'chips', 240, 170, 30, 'y'),
    write([0, 'output'], 'one output', 170, 320, 26, 'y'),
    line([0, 'so'], [[300, 70], [300, 330]], 'd'),
    ring([0, 'with'], 380, 170, 26, 26, 'b'), write([0, 'with'], 'A', 380, 170, 34, 'b'),
    arrow([0, 'two'], [410, 158], [460, 110]), arrow([0, 'two'], [410, 182], [460, 230]),
    write([0, 'different'], 'chips', 505, 100, 30), write([0, 'different'], 'cookie', 510, 240, 30),
    write([0, 'breaks'], 'two outputs', 450, 320, 26, 'r'),
  ],
  // Follow each input
  [
    ...table([0], 50, IO, ['1', '2', '3', '4']),
    write([1, '3'], '3', cx(0), 125, 30), write([1, '5'], '5', cx(1), 125, 30),
    write([2, '7'], '7', cx(2), 125, 30), write([2, '9'], '9', cx(3), 125, 30),
    write([3, 'once'], 'each input once', 300, 220, 28, 'b'), write([3, 'output'], 'one output each', 300, 275, 28, 'b'),
    write([3, 'function'], 'a function', 300, 345, 36, 'y'),
  ],
  // Look for a repeated input
  [
    ...table([0, 'watch'], 50, IO, ['1', '2', '2', '3'], ['4', '6', '8', '10']),
    ring([1, 'twice'], cx(1), 75, 24, 20, 'b'), ring([1, 'twice'], cx(2), 75, 24, 20, 'b'),
    ring([2, '6'], cx(1), 125, 24, 20, 'r'), ring([2, '8'], cx(2), 125, 24, 20, 'r'),
    write([2, '8'], '2 gives 6 and 8', 300, 210, 30, 'r'),
    write([3, 'chips'], 'A gives chips', 170, 280, 26, 'd'), write([3, 'cookie'], 'A gives a cookie', 430, 280, 26, 'd'),
    write([3, 'Not'], 'not a function', 300, 350, 34, 'r'),
  ],
  // The same output is fine
  [
    ...table([0], 50, IO, ['1', '2', '3', '4']),
    ...['5', '5', '5', '5'].map((v, i) => ({ ...write([0, '5'], v, cx(i), 125, 30), quick: true })),
    write([1, 'allowed'], 'allowed?', 250, 210, 30, 'b'), write([1, 'Yes'], 'yes', 380, 210, 30, 'y'),
    write([1, 'buttons'], 'A gives chips', 170, 275, 26, 'd'), write([1, 'snack'], 'B gives chips', 430, 275, 26, 'd'),
    write([2, 'function'], 'a function', 300, 345, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'OUTPUT'], '5, 5, 5, 5', 300, 145, 32), write([1, 'repeats'], 'so not a function', 300, 195, 30, 'r'),
    cross([1, 'repeats'], 180, 120, 240, 96),
    write([2, 'INPUT'], 'input 2 gives 6 and 8', 300, 265, 30, 'y'), write([2, 'breaks'], 'that breaks it', 300, 330, 32, 'y'),
  ],
]
