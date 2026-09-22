/**
 * g5m6-t4's chalkboards: index = screen index (0 is Screen 1, which has none). Also the grid t5 and t6 draw with.
 * Colours in this topic: white = pattern A, the top number, going across · blue = pattern B, the bottom number, going up ·
 * yellow = the pair and its dot (the result) · coral = the mix-up.
 */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, ring, cross, cells } from '../../../chalk'
import { warn } from '../g3m2/t6'

export type At = [number, string?]
type Pt = [number, number]
export const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })

/** A grid at true, even spacing: `u` px a step, `nx` steps across and `ny` up from the corner at (ox, oy). */
export interface Grid { ox: number; oy: number; u: number; nx: number; ny: number }
export const P = (g: Grid, i: number, j: number): Pt => [g.ox + i * g.u, g.oy - j * g.u]
/** The grid: dim lines, the bottom and left edges bolder, 0… under the bottom edge and 1… up the left one. */
export const grid = (at: At, g: Grid): ChalkMark[] => {
  const [beat, w] = at, right = g.ox + g.nx * g.u, top = g.oy - g.ny * g.u
  const d = [...Array.from({ length: g.nx }, (_, i) => `M${g.ox + (i + 1) * g.u} ${g.oy} V${top}`),
    ...Array.from({ length: g.ny }, (_, j) => `M${g.ox} ${g.oy - (j + 1) * g.u} H${right}`)].join(' ')
  return [
    q({ beat, at: w, c: 'd', w: 1.5, d }),
    q({ beat, at: w, c: 'd', w: 3.4, d: `M${g.ox} ${top - 10} V${g.oy} H${right + 10}` }),
    ...Array.from({ length: g.nx + 1 }, (_, i) => q(write(at, String(i), g.ox + i * g.u, g.oy + 20, 20, 'd'))),
    ...Array.from({ length: g.ny }, (_, j) => q(write(at, String(j + 1), g.ox - 18, g.oy - (j + 1) * g.u, 20, 'd'))),
  ]
}
/** A dot on the grid at (i, j), exactly on the crossing. */
export const dot = (at: At, g: Grid, i: number, j: number, c: ChalkColor = 'y'): ChalkMark => {
  const [x, y] = P(g, i, j)
  return { beat: at[0], at: at[1], c, w: 6, d: `M${x - 5} ${y} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0` }
}
/** A walk along the grid lines from one crossing to the next, with an arrowhead. */
export const walk = (at: At, g: Grid, from: [number, number], to: [number, number], c: ChalkColor = 'w'): ChalkMark =>
  ({ ...arrow(at, P(g, ...from), P(g, ...to), c), w: 4 })
/**
 * A pair "(a, b)" written piece by piece, centred on x, so each number can have its own colour and be ringed.
 * `ax` and `bx` are where the two numbers sit.
 */
export const pair = (at: At, x: number, y: number, a: string, b: string, s = 30, ca: ChalkColor = 'w', cb: ChalkColor = 'w', cp: ChalkColor = 'w') => {
  const l = x - s, ax = l + 0.55 * s, bx = l + 1.45 * s
  const marks = [q(write(at, '(', l, y, s, cp)), q(write(at, a, ax, y, s, ca)), q(write(at, ',', l + 0.95 * s, y + 0.1 * s, s, cp)),
    q(write(at, b, bx, y, s, cb)), write(at, ')', l + 2 * s, y, s, cp)]
  return { marks, ax, bx }
}

// ── this topic ──
const A = ['0', '1', '2', '3'], B = ['0', '2', '4', '6']
/** One row of the pattern table: its name, then a cell per number. */
const row = (at: At, x: number, y: number, cw: number, h: number, name: string, ds: string[], c: ChalkColor): ChalkMark[] => [
  q(cells(at, x, y, cw * ds.length, h, ds.length)), q(write(at, name, x - 24, y + h / 2, 26, c)),
  ...ds.map((d, i) => q(write(at, d, x + cw * i + cw / 2, y + h / 2, 30, c))),
]
const table = (a: At, b: At, x: number, y: number, cw: number, h: number): ChalkMark[] =>
  [...row(a, x, y, cw, h, 'A', A, 'w'), ...row(b, x, y + h, cw, h, 'B', B, 'b')]
/** A pair coloured like its table: across number white, up number blue, the brackets yellow. */
const tpair = (at: At, x: number, y: number, a: string, b: string, s = 30) => pair(at, x, y, a, b, s, 'w', 'b', 'y').marks

const G2: Grid = { ox: 90, oy: 350, u: 30, nx: 6, ny: 6 }
const G3: Grid = { ox: 400, oy: 350, u: 40, nx: 3, ny: 4 }
const G5: Grid = { ox: 80, oy: 360, u: 40, nx: 4, ny: 7 }
const G7: Grid = { ox: 420, oy: 350, u: 40, nx: 3, ny: 3 }
const DOTS: [number, number][] = [[0, 0], [1, 2], [2, 4], [3, 6]]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Lists are not dots
  [
    ...table([0, 'A'], [0, 'B'], 150, 30, 70, 46),
    ...grid([1, 'grid'], G2), write([1, 'Where'], '?', 180, 260, 44, 'd'),
    write([2, 'two'], '1 dot = 2 numbers', 445, 190, 26, 'y'),
    walk([2, 'across'], G3, [-1, 1], [0, 1]), write([2, 'across'], 'across', 380, 340, 22),
    walk([2, 'up'], G3, [0, 1], [0, 3], 'b'), write([2, 'up'], 'up', 430, 270, 22, 'b'), dot([2, 'up'], G3, 0, 3),
  ],
  // The big idea: a column → a pair → a dot
  [
    ...table([0, 'Each'], [0, 'Each'], 100, 40, 60, 46), ...grid([0, 'Each'], G3),
    ring([0, 'column'], 190, 86, 26, 54, 'y'),
    arrow([0, 'pair'], [190, 146], [190, 176], 'y'), ...tpair([0, 'pair'], 190, 205, '1', '2', 32),
    write([0, 'top'], 'top → across', 190, 280, 26), walk([0, 'across'], G3, [0, 0], [1, 0]),
    write([0, 'bottom'], 'bottom → up', 190, 330, 26, 'b'), walk([0, 'up'], G3, [1, 0], [1, 2], 'b'), dot([0, 'up'], G3, 1, 2),
  ],
  // Make the pairs
  [
    ...table([0, 'Read'], [0, 'Read'], 100, 40, 100, 50),
    ...[150, 250, 350, 450].map(x => q(arrow([0, 'down'], [x, 150], [x, 185], 'y'))),
    ...tpair([1, '0'], 150, 222, '0', '0'), ...tpair([1, '1'], 250, 222, '1', '2'),
    ...tpair([1, '4'], 350, 222, '2', '4'), ...tpair([1, '6'], 450, 222, '3', '6'),
    write([2, 'pairs'], '4 columns → 4 pairs', 300, 320, 30, 'y'),
  ],
  // Plot each pair
  [
    ...grid([0, 'grid'], G5),
    ...tpair([0, 'grid'], 450, 110, '0', '0'), ...tpair([0, 'grid'], 450, 170, '1', '2'),
    ...tpair([0, 'grid'], 450, 230, '2', '4'), ...tpair([0, 'grid'], 450, 290, '3', '6'),
    ring([1, 'Take'], 450, 170, 50, 24, 'y'),
    walk([1, 'across'], G5, [0, 0], [1, 0]), walk([1, 'up'], G5, [1, 0], [1, 2], 'b'), dot([1, 'dot'], G5, 1, 2),
    dot([2, '0'], G5, 0, 0), dot([2, '4'], G5, 2, 4), dot([2, '6'], G5, 3, 6),
  ],
  // See the pattern
  [
    ...grid([0, 'Look'], G5), ...DOTS.map(([i, j]) => q(dot([0, 'dots'], G5, i, j))),
    { ...line([1, 'line'], [P(G5, 0, 0), P(G5, 3.5, 7)], 'y'), w: 2 },
    { beat: 2, at: 'across', c: 'w', w: 4, d: [0, 1, 2].map(i => `M${P(G5, i, 2 * i).join(' ')} H${P(G5, i + 1, 0)[0]}`).join(' ') },
    { beat: 2, at: 'up', c: 'b', w: 4, d: [1, 2, 3].map(i => `M${P(G5, i, 2 * i - 2).join(' ')} V${P(G5, 0, 2 * i)[1]}`).join(' ') },
    write([2, 'across'], '1 across', 440, 200, 30), write([2, 'up'], '2 up', 440, 260, 30, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    q(write([1, 'write'], 'A', 70, 170, 26)), q(write([1, 'write'], '1', 110, 170, 34)),
    q(write([1, 'write'], 'B', 70, 230, 26, 'b')), q(write([1, 'write'], '2', 110, 230, 34, 'b')),
    ...pair([1, 'FIRST'], 260, 170, '2', '1', 34, 'r', 'r', 'r').marks,
    ...tpair([2, 'make'], 260, 250, '1', '2', 34), cross([2, 'not'], 196, 140, 128, 58),
    ...grid([2, 'different'], G7), dot([2, 'different'], G7, 1, 2), dot([2, 'different'], G7, 2, 1, 'r'),
  ],
]
