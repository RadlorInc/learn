/** g3m6-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Stars white, the key blue, the count yellow. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, ring, cross } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
type Pt = [number, number]
const r1 = (n: number) => Math.round(n * 10) / 10
/** The 10 corners of a five-point star, from the top point, clockwise. */
const corners = (x: number, y: number, r: number): Pt[] => Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5, k = i % 2 ? r * 0.45 : r
  return [r1(x + k * Math.cos(a)), r1(y + k * Math.sin(a))]
})
const path = (p: Pt[]) => `M${p.map(q => q.join(' ')).join(' L')} Z`
const starD = (x: number, y: number, r: number) => path(corners(x, y, r))
/** The LEFT half of a star: bottom-centre corner round the left side to the top point, closed down the middle. */
const halfD = (x: number, y: number, r: number) => { const p = corners(x, y, r); return path([[x, p[5][1]], p[6], p[7], p[8], p[9], p[0]]) }
/** Whole stars in a row, as one stroke. */
const stars = ([beat, at]: At, xs: number[], y: number, r = 26, c: ChalkColor = 'w'): ChalkMark => ({ beat, at, c, d: xs.map(x => starD(x, y, r)).join(' ') })
/** Half a star: the left half in chalk, the missing right half only a faint outline, so it reads as HALF of a star. */
const half = ([beat, at]: At, x: number, y: number, r = 26, c: ChalkColor = 'w'): ChalkMark[] => {
  const p = corners(x, y, r)
  return [{ beat, at, c, d: halfD(x, y, r) }, { beat, at, c: 'd', w: 1.6, d: `M${p.slice(0, 6).map(q => q.join(' ')).join(' L')}` }]
}
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Counting stars is not enough
  [
    write([0, "Mia's"], 'Mia', 80, 90, 30), stars([0, "Mia's"], [180, 260, 340], 90),
    ...[1, 2, 3].map(n => q(write([0, '3'], String(n), 100 + 80 * n, 138, 20, 'd'))),
    write([1, 'books'], '3 books?', 480, 90, 30, 'r'), cross([1, 'No'], 410, 68, 140, 44),
    { beat: 2, at: 'under', c: 'd', w: 2, d: 'M40 180 H560' },
    stars([2, 'star'], [220], 260, 26, 'b'), write([2, '2'], '= 2 books', 340, 260, 32, 'b'),
  ],
  // The big idea: a star is 2, a half star is 1
  [
    stars([0, 'star'], [220], 70, 26, 'b'), write([0, '2'], '= 2 books', 340, 70, 32, 'b'),
    stars([0, 'stars'], [200, 300, 400], 215, 30),
    ...['2', '4', '6'].map((n, i) => write([0, '2s'], n, 200 + 100 * i, 155, 32, 'y')),
    ...half([0, 'half'], 250, 330, 30), write([0, '1'], '= 1', 330, 330, 32, 'y'),
  ],
  // Count by 2s
  [
    write([0, "Mia's"], 'Mia', 90, 130, 32), stars([0, 'row'], [200, 300, 400], 130, 32),
    write([1, '2s'], 'count by 2s', 300, 235, 30),
    ...['2', '4', '6'].flatMap((n, i) => [ring([2, n], 200 + 100 * i, 130, 40, 40, 'y'), write([2, n], n, 200 + 100 * i, 62, 32, 'y')]),
    write([2, 'books'], 'Mia read 6 books', 300, 320, 34, 'y'),
  ],
  // Half a star
  [
    write([0, 'Ava'], 'Ava', 90, 130, 32), stars([0, 'stars'], [200, 300], 130, 32), ...half([0, 'half'], 400, 130, 32),
    write([1, '2'], '2', 200, 62, 32, 'y'), write([1, '4'], '4', 300, 62, 32, 'y'),
    write([2, '1'], '+1', 392, 62, 32, 'y'),
    write([2, '5'], '2 + 2 + 1 = 5', 300, 240, 34, 'y'),
    write([2, 'books'], 'Ava read 5 books', 300, 320, 34, 'y'),
  ],
  // How many more?
  [
    write([0, 'Mia'], 'Mia', 80, 80, 30), stars([0, 'Mia'], [180, 260, 340], 80),
    write([0, 'Leo'], 'Leo', 80, 165, 30), stars([0, 'Leo'], [180, 260], 165),
    write([1, '6'], '6', 460, 80, 36, 'y'), write([1, 'So'], '4', 460, 165, 36, 'y'),
    write([2, 'subtract'], 'how many more → subtract', 300, 245, 28),
    write([2, '6'], '6 − 4', 265, 305, 36, 'y'), write([2, '2'], '= 2', 360, 305, 36, 'y'),
    write([2, 'books'], '2 more books', 300, 360, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    stars([1, 'star'], [110, 180, 250], 170), write([1, 'ONE'], '= 3 books', 400, 170, 34, 'r'),
    stars([2, "Mia's"], [110, 180, 250], 300), write([2, '6'], '= 6 books', 400, 300, 34, 'y'),
    cross([2, 'not'], 315, 148, 170, 44),
    ...['2', '4', '6'].map((n, i) => q(write([2, 'Every'], n, 110 + 70 * i, 245, 24, 'y'))),
  ],
]
