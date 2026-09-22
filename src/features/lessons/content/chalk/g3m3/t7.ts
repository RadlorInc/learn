/** g3m3-t7's chalkboards: index = screen index (0 is Screen 1, which has none). White = the 5 rows, blue = the 2 rows. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cross } from '../../../chalk'
import { warn, tick, type At } from '../g3m1/t1'

type Pt = [number, number]
const G = 28
/** Carrots (a point-down triangle with two leaves), one stroke for the lot. */
const carrots = ([beat, at]: At, pts: Pt[], c: ChalkColor = 'w', quick = true): ChalkMark => ({
  beat, at, c, quick, w: 2.6,
  d: pts.map(([x, y]) => `M${x - 6} ${y - 7} h12 l-6 16 Z M${x} ${y - 7} l-4 -6 M${x} ${y - 7} l4 -6`).join(' '),
})
/** Rows r0..r1-1 of an 8-wide garden whose first carrot is at (x0, y0). */
const rows = (x0: number, y0: number, r0: number, r1: number): Pt[] =>
  Array.from({ length: (r1 - r0) * 8 }, (_, i) => [x0 + (i % 8) * G, y0 + (r0 + Math.floor(i / 8)) * G])
/** The 7 × 8 garden: the top 5 rows, then the bottom 2 (in `c2`). */
const garden = (at: At, x0: number, y0: number, c2: ChalkColor = 'b', at2: At = at): ChalkMark[] =>
  [carrots(at, rows(x0, y0, 0, 5)), carrots(at2, rows(x0, y0, 5, 7), c2)]
/** The cut between row 5 and row 6. */
const cut = (at: At, x0: number, y0: number) => line(at, [[x0 - 20, y0 + 4.5 * G], [x0 + 7 * G + 20, y0 + 4.5 * G]], 'y')

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too big to just know
  [
    ...garden([0, '7'], 120, 75, 'w'),
    write([0, '8'], '8 in a row', 218, 40, 22, 'd'), write([0, 'rows'], '7 rows', 60, 159, 22, 'd'),
    write([0, 'big'], '7 × 8', 470, 120, 46),
    ...['8', '16', '24'].map((n, i) => ({ ...write([1, 'row'], n, 370, 75 + i * G, 20, 'd'), quick: true })),
    write([1, 'slip'], 'slip?', 470, 210, 30, 'r'),
    write([2, 'smaller'], 'smaller?', 300, 330, 36, 'y'),
  ],
  // The big idea: break it, solve each part, add
  [
    ...garden([0, 'Break'], 110, 60),
    cut([0, 'two'], 110, 60),
    write([0, 'smaller'], '5 × 8', 450, 116, 36), write([0, 'smaller'], '2 × 8', 450, 214, 36, 'b'),
    tick([0, 'solve'], 520, 116), tick([0, 'solve'], 520, 214),
    write([0, 'add'], '+', 450, 165, 40, 'y'),
    write([0, 'add'], 'add the parts', 300, 320, 32, 'y'),
  ],
  // Cut it into two parts
  [
    ...garden([0, 'Look'], 140, 60),
    cut([0, 'Cut'], 140, 60),
    write([0, '5'], '5 rows', 62, 116, 24), write([0, '2'], '2 rows', 62, 214, 24, 'b'),
    write([0, '2'], '7 = 5 + 2', 300, 320, 40, 'y'),
    write([1, 'fact'], '5 × 8', 480, 116, 34), write([1, 'So'], '2 × 8', 480, 214, 34, 'b'),
  ],
  // Solve each part
  [
    ...garden([0], 120, 60), cut([0], 120, 60),
    write([0, '5'], '5 × 8', 400, 116, 36), write([0, '40'], '= 40', 510, 116, 36, 'y'),
    write([1, '2'], '2 × 8', 400, 214, 36, 'b'), write([1, '16'], '= 16', 510, 214, 36, 'y'),
  ],
  // Add the parts
  [
    ...garden([0], 120, 50), cut([0], 120, 50),
    { ...write([0], '40', 430, 106, 34, 'y'), quick: true }, { ...write([0], '16', 430, 204, 34, 'y'), quick: true },
    write([0, 'together'], '40 + 16', 250, 290, 48), write([1, '56'], '= 56', 410, 290, 48, 'y'),
    write([2, 'carrots'], '7 × 8 = 56 carrots', 300, 360, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    carrots([1, '2'], rows(70, 150 - 5 * G, 5, 7), 'b'),
    carrots([1, 'carrots'], [[420, 150], [450, 150]], 'r'), write([1, 'carrots'], 'just 2?', 435, 190, 24, 'r'),
    write([2, '42'], '40 + 2 = 42', 160, 305, 36, 'r'), cross([2, 'few'], 60, 280, 200, 50),
    write([2, 'holds'], '2 × 8 = 16', 440, 245, 30, 'b'),
    write([2, '16'], '40 + 16', 440, 305, 40, 'y'), tick([2, '16'], 530, 305),
  ],
]
