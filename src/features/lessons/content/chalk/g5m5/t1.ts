/** g5m5-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the box-of-cubes drawing t2–t4 use. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, cross, wash, arrow } from '../../../chalk'
import { warn, tick, type At } from '../g3m1/t1'

export { warn, tick, type At }
type Pt = [number, number]
const r = (n: number) => Math.round(n * 10) / 10
const seg = (a: Pt, b: Pt) => `M${r(a[0])} ${r(a[1])} L${r(b[0])} ${r(b[1])}`
const upto = (n: number, all: boolean) => (all ? Array.from({ length: n + 1 }, (_, i) => i) : [0, n])
/** How far one cube of depth moves the drawing: right and up (a simple oblique view). */
export const DX = 0.5, DY = -0.32

/**
 * A box `l` cubes long, `w` deep and `h` tall, as ONE stroke: the front face, the top and the right side, each cut into
 * its cubes (`grid`) or just the outline. (x, y) is the front bottom-left corner, `u` one cube's edge. `topFrom` leaves
 * the top's first cubes out, where another box sits on them. `h = 0` draws a flat floor of tiles (the top only).
 */
export const block = ([beat, at]: At, x: number, y: number, l: number, w: number, h: number, u: number, c: ChalkColor = 'w',
  grid = true, topFrom = 0): ChalkMark => {
  const dx = DX * u, dy = DY * u, top = y - h * u, R = x + l * u, d: string[] = []
  if (h > 0) {
    for (const j of upto(h, grid)) d.push(seg([x, y - j * u], [R, y - j * u]))
    for (const i of upto(l, grid)) d.push(seg([x + i * u, y], [x + i * u, top]))
    for (const k of upto(w, grid)) if (k > 0) d.push(seg([R + k * dx, y + k * dy], [R + k * dx, top + k * dy]))
    for (const j of upto(h, grid)) if (j < h) d.push(seg([R, y - j * u], [R + w * dx, y - j * u + w * dy]))
  }
  for (const k of upto(w, grid)) if (k > 0 || h === 0) d.push(seg([x + k * dx + (k > 0 ? topFrom * u : 0), top + k * dy], [R + k * dx, top + k * dy]))
  for (const i of upto(l, grid)) if (i >= topFrom && (h === 0 || i < l)) d.push(seg([x + i * u, top], [x + i * u + w * dx, top + w * dy]))
  if (h > 0) d.push(seg([R, top], [R + w * dx, top + w * dy]))
  return { beat, at, c, d: d.join(' ') }
}
/** The top of one cube (column i, row k back from the front) of a box drawn by `block`, washed with colour. */
export const cubeTop = ([beat, at]: At, x: number, y: number, h: number, u: number, i: number, k: number, c: ChalkColor): ChalkMark => {
  const dx = DX * u, dy = DY * u, X = x + i * u + k * dx, Y = y - h * u + k * dy
  return { beat, at, c, wash: true, d: `M${r(X)} ${r(Y)} h${u} l${r(dx)} ${r(dy)} h${-u} Z` }
}

// The toy box: 3 cubes long, 2 deep, 2 tall. 12 cubes; 10 can be seen, 2 hide at the back of the bottom layer.
export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Flat tiles cannot fill it
  [
    block([0, 'Tiles'], 50, 290, 3, 2, 0, 50), write([0, 'floor'], 'flat floor', 125, 330, 24, 'd'),
    block([1, 'box'], 330, 300, 3, 2, 2, 50, 'w', false),
    arrow([1, 'up'], [305, 300], [305, 200], 'b'),
    write([1, 'fill'], '?', 430, 125, 40, 'y'),
    block([2, 'space'], 330, 300, 3, 2, 0, 50),
    wash([2, 'empty'], 330, 200, 150, 68, 'b'), write([2, 'empty'], 'empty', 405, 234, 24, 'b'),
  ],
  // The big idea: count the cubes that fill it
  [
    block([0, 'box'], 180, 290, 3, 2, 2, 60, 'w', false),
    block([0, 'cubes'], 180, 290, 3, 2, 2, 60),
    ...['1', '2', '3'].map((n, i) => ({ ...write([0, 'fill'], n, 210 + 60 * i, 260, 30, 'y'), quick: true })),
    write([0, 'gaps'], 'no gaps', 300, 345, 30, 'y'),
  ],
  // Every cube is the same
  [
    block([0, 'cube'], 110, 260, 1, 1, 1, 100),
    write([1, 'long'], '1', 160, 290, 28, 'y'), write([1, 'wide'], '1', 272, 252, 28, 'y'), write([1, 'tall'], '1', 88, 210, 28, 'y'),
    block([2, 'same'], 360, 300, 3, 2, 2, 50),
    write([2, 'gaps'], 'no gaps', 460, 345, 30, 'y'),
  ],
  // Count the cubes, layer by layer
  [
    block([0, 'bottom'], 90, 330, 3, 2, 1, 55), write([0, '6'], '6', 340, 300, 32),
    block([1, 'top'], 90, 210, 3, 2, 1, 55), write([1, 'more'], '6', 340, 180, 32),
    write([2, '12'], '6 + 6 = 12', 465, 245, 34, 'y'),
  ],
  // That number is the space inside
  [
    block([0], 100, 300, 3, 2, 2, 60),
    write([0, '12'], '12 cubes', 470, 200, 32, 'y'),
    write([1, 'space'], '= the space inside', 462, 255, 24),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    block([1, 'cubes'], 70, 310, 3, 2, 2, 45),
    write([2, '10'], '10 cubes', 160, 355, 30, 'r'),
    cross([2, 'more'], 98, 337, 124, 36),
    block([2, 'hide'], 360, 320, 3, 2, 1, 45), block([2, 'hide'], 360, 235, 3, 2, 1, 45),
    ...[0, 1].flatMap(i => { const m = cubeTop([2, 'back'], 360, 320, 1, 45, i, 1, 'y'); return [m, { ...m, wash: undefined }] }),
    write([2, '12'], '12 cubes', 450, 362, 30, 'y'), tick([2, '12'], 518, 362),
  ],
]
