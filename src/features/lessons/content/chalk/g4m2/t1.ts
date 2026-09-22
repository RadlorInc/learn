/** g4m2-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Ann's bar white, the copies blue, the result yellow. */
import type { ChalkMark } from '../../../chalk'
import { write, box, cells, span, ring, cross } from '../../../chalk'
import { dots, warn, tick, type At } from '../g3m1/t1'

// One sticker = 36 px. Ann's bar is 3 of them (108 px); Sam's is 4 copies of it, from x = 110 to 542.
const U = 36, X = 110, W = 3 * U
const ann = (at: At, y: number): ChalkMark[] => [
  write(at, 'Ann', 60, y + 22, 24, 'd'), cells(at, X, y, W, 44, 3),
]
const stickers = (at: At, x: number, y: number, c: 'w' | 'y' | 'b' = 'w') => dots(at, [0, 1, 2].map(i => [x + U / 2 + i * U, y + 22] as [number, number]), 8, c)
/** Copy `i` of Ann's bar in Sam's row: a small gap between copies, so each one reads as her bar again. */
const G = 8, cx = (i: number, u = U, x0 = X) => x0 + i * (3 * u + G)
const copy = (at: At, i: number, y: number, c: 'b' | 'y' = 'b', u = U, x0 = X): ChalkMark[] => u === U
  ? [cells(at, cx(i), y, W, 44, 3, c), stickers(at, cx(i), y, c)]
  : [cells(at, cx(i, u, x0), y, 3 * u, 26, 3, c)]
const END = cx(4) - G   // 566, the end of Sam's row

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding does not work
  [
    ...ann([0], 60), stickers([0], X, 60),
    write([0, 'add'], '3 + 4', 270, 170, 40), write([0, '7'], '= 7', 370, 170, 40),
    ring([1, '4'], 310, 170, 22, 28, 'r'), write([1, 'more'], 'not 4 more', 300, 232, 28, 'r'),
    write([2, 'Sam'], 'Sam', 60, 312, 24, 'd'), box([2, 'Sam'], X, 290, END - X, 44), write([2, 'what'], '?', (X + END) / 2, 312, 30),
    write([2, 'times'], '4 times over', (X + END) / 2, 368, 28, 'b'),
  ],
  // The big idea
  [
    ...ann([0, 'Times'], 60), stickers([0, 'Times'], X, 60),
    write([0, 'copies'], 'Sam', 60, 182, 24, 'd'), ...[0, 1, 2, 3].flatMap(i => copy([0, 'copies'], i, 160)),
    write([0, 'copies'], '4 copies of 3', (X + END) / 2, 238, 28, 'b'),
    write([0, 'is'], '4 × 3', 300, 320, 52, 'y'),
  ],
  // Draw Ann's bar
  [
    ...ann([0, "Ann's"], 90), stickers([0, 'stickers'], X, 90),
    span([1, 'size'], X, X + W, 168),
    write([1, 'copy'], 'copy this size', X + W / 2, 215, 28, 'b'),
  ],
  // Make 4 copies
  [
    ...ann([0], 70), stickers([0], X, 70),
    write([0, 'Sam'], 'Sam', 60, 212, 24, 'd'),
    ...['One', 'two', 'three', 'four'].flatMap((w, i) => [write([1, w], String(i + 1), cx(i) + W / 2, 165, 22, 'd'), ...copy([1, w], i, 190)]),
    span([2, 'copies'], X, END, 262, 'b'), write([2, 'copies'], '4 copies of 3', (X + END) / 2, 305, 30, 'b'),
  ],
  // Multiply
  [
    ...ann([0], 50), stickers([0], X, 50),
    write([0], 'Sam', 60, 162, 24, 'd'), ...[0, 1, 2, 3].flatMap(i => copy([0], i, 140).map(m => ({ ...m, quick: true }))),
    write([0, 'means'], '4 × 3', 250, 300, 44),
    ...['3', '6', '9', '12'].map((n, i) => write([1, n], n, cx(i) + W, 212, 26, n === '12' ? 'y' : 'w')),
    write([2, '12'], '= 12', 370, 300, 44, 'y'),
    write([2, 'stickers'], 'Sam has 12 stickers', 300, 360, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ADD'], 'Sam = 3 + 4', 150, 190, 34, 'r'),
    write([2, '7'], '= 7', 280, 190, 34, 'r'), cross([2, 'but'], 50, 165, 265, 50),
    ...[0, 1, 2, 3].flatMap(i => copy([2, 'copies'], i, 170, 'y', 17, 340).map(m => ({ ...m, quick: true }))),
    write([2, 'multiply'], 'Sam = 4 × 3', 395, 262, 28, 'y'), write([2, '12'], '= 12', 505, 262, 28, 'y'), tick([2, '12'], 545, 262),
  ],
]
