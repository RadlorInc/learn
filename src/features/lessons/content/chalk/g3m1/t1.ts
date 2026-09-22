/** g3m1-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the object shapes t2–t4 draw with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, arrow, cross, clock, hop } from '../../../chalk'

export type At = [number, string?]
type Pt = [number, number]
const circ = ([x, y]: Pt, r: number) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`
/** Many small circles (cookies, muffins, dots) as ONE stroke. */
export const dots = ([beat, at]: At, pts: Pt[], r: number, c: ChalkColor = 'w'): ChalkMark => ({ beat, at, c, d: pts.map(p => circ(p, r)).join(' ') })
/** Small squares (chairs) as one stroke. */
export const squares = ([beat, at]: At, pts: Pt[], s: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: pts.map(([x, y]) => `M${x - s / 2} ${y - s / 2} h${s} v${s} h${-s} Z`).join(' ') })
/** `rows` × `cols` points, `gap` apart, top-left point at (x, y). */
export const grid = (x: number, y: number, rows: number, cols: number, gap: number): Pt[] =>
  Array.from({ length: rows * cols }, (_, i) => [x + (i % cols) * gap, y + Math.floor(i / cols) * gap])
/** The warning triangle every Screen 7 opens with. */
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
export const tick = (at: At, x: number, y: number, c: ChalkColor = 'y'): ChalkMark => line(at, [[x, y], [x + 9, y + 11], [x + 28, y - 13]], c, 4)

// A plate is a flat ring; its 3 cookies sit on it in a row.
const PX = [90, 230, 370, 510]
const cookiesOn = (x: number, y: number, k = 1): Pt[] => [-27, 0, 27].map(dx => [x + dx * k, y])
const plate = (at: At, x: number, y: number, k = 1, c: ChalkColor = 'd'): ChalkMark => ring(at, x, y, 58 * k, 26 * k, c)
/** Plates, then their cookies. */
const plates = (at: At, y: number, xs = PX, k = 1, cookieAt: At = at, c: ChalkColor = 'd', cc: ChalkColor = 'w'): ChalkMark[] => [
  ...xs.map(x => ({ ...plate(at, x, y, k, c), quick: true })),
  dots(cookieAt, xs.flatMap(x => cookiesOn(x, y, k)), 9 * k, cc),
]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Counting one by one is slow
  [
    ...plates([0, 'You'], 110, PX, 1, [0, 'cookie']),
    ...PX.flatMap((x, p) => cookiesOn(x, 110).map(([cx], i) => ({ ...write([0, 'cookie'], String(p * 3 + i + 1), cx, 165, 20, 'd'), quick: true }))),
    clock([1, 'slow'], 120, 245, 28), write([1, 'lose'], 'lost your place?', 330, 245, 28, 'r'),
    write([2, 'faster'], 'faster way?', 300, 330, 34, 'y'),
    ...PX.map(x => ({ ...ring([2, 'plates'], x, 110, 66, 38, 'y'), quick: true })),
  ],
  // The big idea: a whole group at a time
  [
    ...plates([0, 'group'], 150),
    ...PX.map(x => ({ ...write([0, 'same'], '3', x, 215, 34, 'y'), quick: true })),
    write([0, 'number'], 'same number', 300, 265, 26, 'd'),
    ring([0, 'whole'], PX[0], 150, 66, 38, 'y'),
    ...PX.slice(1).map((x, i) => hop([0, 'time'], PX[i], x, 100, 'y')),
  ],
  // How many groups? How many in each?
  [
    ...plates([0, 'Look'], 130),
    ...PX.map(x => ring([0, 'group'], x, 130, 66, 38, 'y')),
    ...PX.map((x, i) => ({ ...write([1, 'plates'], String(i + 1), x, 70, 24, 'd'), quick: true })),
    write([1, 'groups'], '4 groups', 160, 260, 40, 'y'),
    dots([2, 'cookies'], cookiesOn(PX[0], 130), 9, 'b'),
    write([2, "That's"], '3 in each', 440, 260, 40, 'b'),
  ],
  // Count by 3s
  [
    ...plates([0], 170),
    ...['3', '6', '9', '12'].flatMap((n, i) => [ring([1, n], PX[i], 170, 66, 38, 'y'), write([1, n], n, PX[i], 95, 40, 'y')]),
    write([2, 'cookies'], '12 cookies', 300, 310, 40, 'y'), line([2, 'cookies'], [[200, 345], [400, 345]], 'y', 2.5),
  ],
  // 4 groups of 3
  [
    ...plates([0, 'groups'], 70, [120, 240, 360, 480], 0.8),
    write([0, '3'], '4 groups of 3', 240, 150, 30), write([0, '12'], 'make 12', 430, 150, 30, 'y'),
    write([1, 'write'], '4', 190, 235, 50), write([1, 'write'], '×', 245, 235, 50), write([1, 'write'], '3', 300, 235, 50),
    write([1, '12'], '= 12', 385, 235, 50, 'y'),
    arrow([2, 'first'], [190, 268], [160, 318], 'y'), write([2, 'groups'], 'groups', 145, 350, 30, 'y'),
    arrow([2, 'second'], [300, 268], [330, 318], 'b'), write([2, 'each'], 'in each', 360, 350, 30, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '4'], '4 × 3', 150, 160, 40), write([1, 'ADD'], '4 + 3', 360, 160, 40, 'r'),
    write([2, '7'], '= 7', 460, 160, 40, 'r'), cross([2, '7'], 305, 135, 190, 50),
    ...plates([2, 'plate'], 245, [110], 0.8, [2, 'plate'], 'r', 'r'),
    dots([2, 'cookies'], [[210, 245], [245, 245], [280, 245], [315, 245]], 8, 'r'),
    write([2, 'cookies'], '1 plate and 4 more', 470, 245, 24, 'r'),
    ...plates([2, 'whole'], 335, [120, 240, 360, 480], 0.8, [2, 'whole'], 'y', 'y'),
  ],
]
