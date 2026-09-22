/** g4m6-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the bar, grid and place chart t2–t4 draw with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, box, cells, wash, ring, cross } from '../../../chalk'
import { warn } from '../g3m2/t6'

export type At = [number, string?]
export const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))

// Colours across g4m6: b = the shaded part (strips, squares), y = the result (the number with a point), r = the mistake,
// d = labels, w = everything else.

/** The chocolate bar: 10 equal strips, 48 wide, x 60–540. `strip(k)` is the centre of strip k (0–9). */
export const strip = (k: number) => 84 + 48 * k
export const bar = (at: At, y: number, h = 60): ChalkMark => cells(at, 60, y, 480, h, 10)
export const shadeStrips = (at: At, from: number, n: number, y: number, h = 60, c: ChalkColor = 'b'): ChalkMark =>
  wash(at, 60 + 48 * from, y, 48 * n, h, c)

/** A 10 × 10 grid of `s`-wide squares, top left at (x, y), as one stroke. */
export const grid = (at: At, x: number, y: number, s: number, c: ChalkColor = 'w'): ChalkMark => ({
  beat: at[0], at: at[1], c, w: 2,
  d: `M${x} ${y} h${10 * s} v${10 * s} h${-10 * s} Z` + Array.from({ length: 9 }, (_, i) => ` M${x + s * (i + 1)} ${y} v${10 * s} M${x} ${y + s * (i + 1)} h${10 * s}`).join(''),
})
/** Full columns `from`… of a grid, then `extra` squares from the top of the next — the way the lesson's grid is shaded. */
export const shadeGrid = (at: At, x: number, y: number, s: number, from: number, cols: number, extra = 0, c: ChalkColor = 'b'): ChalkMark[] => [
  ...(cols ? [wash(at, x + from * s, y, cols * s, 10 * s, c)] : []),
  ...(extra ? [wash(at, x + (from + cols) * s, y, s, extra * s, c)] : []),
]

/** A place chart: columns `w` wide from x, headed by `names`, with the point drawn on the line after the first column. */
export const chart = (at: At, x: number, y: number, w: number, h: number, names: string[]): ChalkMark[] => [
  cells(at, x, y, w * names.length, h, names.length),
  ...q(names.map((n, i) => write(at, n, x + w * (i + 0.5), y - 18, 20, 'd'))),
]
export const point = (at: At, x: number, y: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat: at[0], at: at[1], c, w: 9, d: `M${x - 1} ${y} h2` })

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Numbers with a point
  [
    bar([0, 'this'], 40), shadeStrips([0, 'strips'], 0, 3, 40),
    write([0, '3/10'], '3 out of 10 = 3/10', 300, 140, 30),
    box([1, 'scale'], 190, 185, 220, 70),
    write([1, 'number'], '72', 255, 220, 40), write([1, 'number'], '4', 325, 220, 40), write([1, 'number'], 'lb', 368, 224, 26, 'd'),
    point([1, 'point'], 292, 230), ring([1, 'point'], 292, 229, 9, 11, 'y'),
    write([2, 'how'], '3/10', 255, 330, 40), write([2, 'point'], '= ?', 350, 330, 40, 'y'),
  ],
  // The big idea: the first place after the point is tenths
  [
    ...chart([0, 'first'], 180, 70, 120, 80, ['ones', 'tenths']),
    point([0, 'point'], 300, 130),
    bar([0, '3/10'], 200, 55), shadeStrips([0, '3/10'], 0, 3, 200, 55), write([0, '3/10'], '3/10', 120, 290, 30),
    write([0, '0.3'], '0', 240, 112, 44, 'y'), write([0, '0.3'], '3', 360, 112, 44, 'y'),
    write([0, '0.3'], '3/10 = 0.3', 300, 350, 38, 'y'),
  ],
  // One strip is one tenth
  [
    bar([0, 'Look'], 50), shadeStrips([0, 'strip'], 0, 1, 50),
    ...q(Array.from({ length: 10 }, (_, k) => write([1, '10'], String(k + 1), strip(k), 135, 20, 'd'))),
    write([1, 'tenth'], '1 strip = 1 tenth', 300, 200, 32),
    write([2, '1/10'], '1/10', 180, 290, 44), write([2, 'point'], 'or', 300, 290, 26, 'd'), write([2, '0.1'], '0.1', 410, 290, 44, 'y'),
  ],
  // Count the strips
  [
    bar([0, 'count'], 90), shadeStrips([0, 'strips'], 0, 3, 90),
    write([1, 'One'], '1', strip(0), 65, 28), write([1, 'two'], '2', strip(1), 65, 28), write([1, 'three'], '3', strip(2), 65, 28),
    ...q([0, 1, 2].map(k => write([2, 'tenth'], '1/10', strip(k), 180, 20, 'd'))),
    write([2, 'tenths'], '3 tenths', 300, 270, 44, 'y'),
  ],
  // Write it with a point
  [
    write([0, 'fraction'], 'as a fraction:', 230, 50, 30, 'd'), write([0, '3/10'], '3/10', 380, 50, 40),
    ...chart([1, 'point'], 180, 125, 120, 80, ['ones', 'tenths']), point([1, 'point'], 300, 185),
    write([1, '0.3'], '0', 240, 167, 44, 'y'), write([1, '0.3'], '3', 360, 167, 44, 'y'),
    ring([2, '0'], 240, 167, 26, 30, 'd'), write([2, 'whole'], 'no whole bar', 180, 250, 24, 'd'),
    ring([2, '3'], 360, 167, 26, 30, 'y'), write([2, 'after'], '3 tenths', 420, 250, 24, 'y'),
    bar([2, 'after'], 300, 45), shadeStrips([2, 'after'], 0, 3, 300, 45),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'write'], '3 tenths =', 220, 165, 36), write([1, '0.03'], '0.03', 380, 165, 40, 'r'),
    cross([1, 'pushes'], 335, 140, 90, 50),
    write([1, 'far'], 'one place too far', 300, 225, 24, 'r'),
    write([2, 'Tenths'], '3 tenths =', 220, 310, 36), write([2, '0.3'], '0.3', 370, 310, 44, 'y'),
  ],
]
