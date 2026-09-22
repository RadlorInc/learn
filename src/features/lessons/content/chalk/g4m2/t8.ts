/** g4m2-t8's chalkboards: index = screen index (0 is Screen 1, which has none). A page holds 4 stickers. Yellow = full pages, blue = left over, coral = the slip. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, box, ring, cross } from '../../../chalk'
import { warn, tick, dots, type At } from '../g3m1/t1'

type Pt = [number, number]
// 14 stickers in a row, a small gap after every 4 (one page each).
const SX = Array.from({ length: 16 }, (_, i) => 60 + i * 30 + Math.floor(i / 4) * 16)
const stickers = (at: At, y: number, from = 0, to = 14, c: ChalkColor = 'w'): ChalkMark =>
  dots(at, SX.slice(from, to).map((x): Pt => [x, y]), 9, c)
/** The box of page k (stickers 4k..4k+3) round the row at y. */
const page = (at: At, k: number, y: number, c: ChalkColor = 'y'): ChalkMark => box(at, SX[4 * k] - 14, y - 22, SX[4 * k + 3] - SX[4 * k] + 28, 44, c)
/** The two left over, ringed. */
const left = (at: At, y: number) => ring(at, (SX[12] + SX[13]) / 2, y, 36, 22, 'b')

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // It does not come out even
  [
    write([0, 'count'], '14 stickers', 300, 45, 28, 'd'), stickers([0, 'count'], 100),
    ...['4', '8', '12'].map((n, k) => write([0, n], n, SX[4 * k + 3], 145, 28)),
    write([0, '16'], '16', SX[15], 145, 28, 'r'),
    write([1, 'past'], '16 is past 14', 300, 220, 32, 'r'),
    write([2, 'even'], 'not even', 300, 290, 32),
    write([2, 'What'], 'what now?', 300, 345, 32),
  ],
  // The big idea (a smaller example: 7 in groups of 3)
  [
    dots([0, 'Make'], [150, 180, 210, 280, 310, 340, 430].map((x): Pt => [x, 110]), 10),
    box([0, 'full'], 128, 86, 104, 48, 'y'), box([0, 'full'], 258, 86, 104, 48, 'y'),
    write([0, 'groups'], 'full groups', 245, 175, 28, 'y'),
    ring([0, 'left'], 430, 110, 28, 26, 'b'), write([0, 'few'], 'too few', 430, 175, 28, 'b'),
    write([0, 'another'], 'for another group', 430, 215, 22, 'b'),
  ],
  // Fill the pages
  [
    stickers([0, 'Look'], 100),
    page([0, 'page'], 0, 100), write([0, 'full'], 'full', SX[1] + 15, 160, 26, 'y'),
    page([1, '8'], 1, 100), page([1, '12'], 2, 100),
    ...['4', '8', '12'].map((n, k) => write([1, n], n, SX[4 * k + 1] + 15, 210, 30, 'y')),
    write([1, 'pages'], '3 full pages', 300, 300, 38, 'y'),
  ],
  // What is left
  [
    stickers([0, '3'], 100), ...[0, 1, 2].map(k => ({ ...page([0, '3'], k, 100), quick: true })),
    write([0, '12'], '12 used', 245, 170, 26, 'y'),
    left([0, 'hand'], 100), write([0, 'hand'], '2 in your hand', 300, 235, 30, 'b'),
    write([1, 'needs'], 'a page needs 4', 300, 300, 28, 'd'),
    write([1, 'over'], '2 left over', 300, 355, 34, 'b'),
  ],
  // 3 pages, 2 left
  [
    stickers([0, 'So'], 90), ...[0, 1, 2].map(k => ({ ...page([0, 'So'], k, 90), quick: true })),
    write([0, '14'], '14 ÷ 4', 300, 175, 38),
    write([0, 'pages'], '3 full pages', 200, 245, 34, 'y'), left([0, 'over'], 90), write([0, 'over'], '2 left over', 430, 245, 34, 'b'),
    ...[0, 1, 2].flatMap(k => [
      { ...box([1, 'fill'], 150 + k * 110, 290, 80, 70, 'y'), quick: true },
      dots([1, 'fill'], [[-15, -15], [15, -15], [-15, 15], [15, 15]].map(([dx, dy]): Pt => [190 + k * 110 + dx, 325 + dy]), 8, 'w'),
    ]),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '6'], '2 pages, 6 left', 160, 175, 32, 'r'), cross([1, 'left'], 45, 150, 230, 50),
    write([1, 'another'], '6 = 1 more page + 2', 440, 185, 26, 'b'),
    write([2, "That's"], '3 pages, 2 left', 280, 310, 42, 'y'), tick([2, "That's"], 450, 310),
  ],
]
