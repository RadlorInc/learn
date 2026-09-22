/** g8m6-t1's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The study cloud (hours 0–6 across, scores 40–100 up) on the left; words on the right.
 *  Yellow is the rising pattern and results, blue the falling one, coral the mix-up, dim the axes. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring } from '../../../chalk'
import { warn } from '../g7m1/t1'

type At = [number, string?]
type Pt = [number, number]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })

/** A scatter plot with its corner at board (ox, oy): x 0..xMax over w px, y yMin..yMax over h px. Shared by t1–t3. */
export const scatter = (ox: number, oy: number, w: number, h: number, xMax: number, yMin: number, yMax: number) => {
  const X = (x: number) => ox + (w * x) / xMax, Y = (y: number) => oy - (h * (y - yMin)) / (yMax - yMin)
  const B = ([x, y]: Pt): Pt => [X(x), Y(y)]
  return {
    X, Y,
    /** The axes, numbered (dim) at `xs` / `ys`, labelled `xl` under and `yl` over. */
    axes: (at: At, xs: number[], ys: number[], xl: string, yl: string): ChalkMark[] => [
      line(at, [[ox, oy - h - 12], [ox, oy], [ox + w + 12, oy]], 'd'),
      ...xs.map(n => q(write(at, String(n), X(n), oy + 18, 18, 'd'))),
      ...ys.map(n => q(write(at, String(n), ox - 20, Y(n), 18, 'd'))),
      q(write(at, xl, ox + w / 2, oy + (xs.length ? 42 : 22), 20, 'd')),
      q(write(at, yl, ox + 30, oy - h - 28, 20, 'd')),
    ],
    /** Chalk dots at the data points, all in one go. */
    dots: (at: At, pts: Pt[], c: ChalkColor = 'w', r = 5): ChalkMark[] => {
      const d = pts.map(p => B(p)).map(([x, y]) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`).join(' ')
      return [{ beat: at[0], at: at[1], d, c, wash: true, quick: true }, { beat: at[0], at: at[1], d, c, quick: true }]
    },
    seg: (at: At, a: Pt, b: Pt, c: ChalkColor = 'w', w?: number) => line(at, [B(a), B(b)], c, w),
    arr: (at: At, a: Pt, b: Pt, c: ChalkColor = 'y') => arrow(at, B(a), B(b), c),
    ring: (at: At, x: number, y: number, rx: number, ry: number, c: ChalkColor = 'y') => ring(at, X(x), Y(y), rx, ry, c),
  }
}

const STUDY: Pt[] = [[1, 55], [1, 60], [2, 62], [2, 70], [3, 68], [3, 75], [4, 78], [4, 82], [5, 85], [5, 90], [6, 92]]
const S = scatter(70, 320, 270, 260, 6, 40, 100)
const cloud = (at: At, pts = STUDY): ChalkMark[] => [...S.axes(at, [1, 2, 3, 4, 5, 6], [50, 70, 90], 'hours studied', 'score'), ...S.dots(at, pts)]
const C = 475   // centre of the words column

/** A small cloud with no numbers, in a 200 × 150 box whose bottom-left is (x0, y0); `up` = rising, else falling. */
const RISE: Pt[] = [[.1, .15], [.2, .3], [.3, .2], [.4, .45], [.5, .38], [.6, .6], [.7, .55], [.8, .78], [.9, .85]]
const mini = (at: At, x0: number, y0: number, up: boolean, c: ChalkColor = 'w') => {
  const m = scatter(x0, y0, 200, 150, 1, 0, 1)
  return { m, marks: [line(at, [[x0, y0 - 160], [x0, y0], [x0 + 210, y0]], 'd'), ...m.dots(at, RISE.map(([x, y]) => [x, up ? y : 1 - y] as Pt), c)] }
}

const up1 = mini([0, 'cloud'], 50, 300, true), down1 = mini([0, 'falls'], 340, 300, false)
const wrong = mini([1, 'fall'], 50, 290, false), right = mini([2, 'Falling'], 340, 290, false)

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two dots cannot settle it
  [
    ...cloud([0, 'Can']),
    S.ring([1, 'This'], 2, 70, 16, 14, 'y'), write([1, '70'], '2 hours → 70', C, 110, 26, 'y'),
    S.ring([1, 'more'], 3, 68, 16, 14, 'b'), write([1, '68'], '3 hours → 68', C, 165, 26, 'b'),
    write([2, 'two'], 'two dots can', C, 245, 28, 'r'), write([2, 'anything'], 'show anything', C, 290, 28, 'r'),
  ],
  // The big idea: rises = positive, falls = negative
  [
    ...up1.marks, arrow([0, 'right'], [200, 60], [400, 60], 'd'), write([0, 'right'], 'left to right', 300, 35, 22, 'd'),
    up1.m.arr([0, 'rises'], [0.05, 0.05], [0.98, 0.98], 'y'), write([0, 'positive'], 'positive', 150, 345, 32, 'y'),
    ...down1.marks, down1.m.arr([0, 'falls'], [0.05, 0.95], [0.98, 0.02], 'b'), write([0, 'negative'], 'negative', 440, 345, 32, 'b'),
  ],
  // Read the study cloud
  [
    ...cloud([0, 'Now']), arrow([0, 'right'], [390, 80], [560, 80], 'd'),
    S.ring([1, '1'], 1, 57.5, 14, 22, 'b'), write([1, '60'], '1 hour: 55, 60', C, 150, 26, 'b'),
    S.ring([1, '6'], 6, 92, 16, 14, 'y'), write([1, '92'], '6 hours: 92', C, 200, 26, 'y'),
    S.arr([2, 'climb'], [0.4, 48], [5.5, 96], 'y'), write([2, 'climb'], 'both go up', C, 265, 28),
    write([2, 'positive'], 'positive', C, 320, 36, 'y'),
  ],
  // Falling, or no shape at all
  ...(() => {
    const L = scatter(60, 260, 210, 190, 8, 5, 11), R = scatter(345, 260, 210, 190, 11, 50, 100)
    return [[
      ...L.axes([0, 'More'], [], [], 'screen time', 'sleep'),
      ...L.dots([0, 'less'], [[1, 10], [2, 9.5], [2, 9], [3, 9], [4, 8], [4, 8.5], [5, 7.5], [6, 7], [6, 6.5], [7, 6]]),
      L.arr([1, 'fall'], [0.6, 10.8], [7.6, 5.4], 'b'), write([1, 'negative'], 'negative', 165, 340, 32, 'b'),
      ...R.axes([2, 'shoe'], [], [], 'shoe size', 'score'),
      ...R.dots([2, 'scattered'], [[5, 80], [6, 60], [6, 90], [7, 70], [7, 85], [8, 65], [8, 95], [9, 75], [10, 62], [10, 88]]),
      write([3, 'pattern'], 'no pattern', 450, 340, 32),
    ]]
  })(),
  // A dot far from the rest
  [
    ...cloud([0, 'Look']), ...S.dots([0, 'here'], [[1, 95]], 'y', 6), S.ring([0, 'here'], 1, 95, 16, 14, 'y'),
    write([0, '95'], '1 hour → 95', C, 100, 26, 'y'),
    write([1, 'far'], 'far from the rest', C, 160, 24),
    S.arr([2, 'rises'], [0.4, 48], [5.5, 96], 'w'), write([2, 'rises'], 'still rises', C, 260, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...wrong.marks, write([1, 'call'], 'no pattern', 150, 340, 30, 'r'), cross([1, 'NO'], 236, 324, 32, 32),
    ...right.marks, right.m.arr([2, 'Falling'], [0.05, 0.95], [0.98, 0.02], 'b'),
    write([2, 'negative'], 'negative', 440, 340, 32, 'y'),
  ],
]
