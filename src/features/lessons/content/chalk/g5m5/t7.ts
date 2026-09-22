/** g5m5-t7's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, box, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'
import type { At } from '../g3m6/t5'
import { vspan } from '../g4m5/t5'
// Colours across these boards: white = the cubes and boxes, blue = a flat square / one layer / the height,
// yellow = the unit the space is named in, coral = the mix-up, dim = labels.

// Boxes are drawn straight on with the depth going up and to the right: one unit of depth is 0.4 of an edge each way.
const K = 0.4
const f = (n: number) => Math.round(n * 10) / 10
const seg = (x1: number, y1: number, x2: number, y2: number) => `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`
/**
 * A box `l` cubes long, `w` deep and `h` high, every cube edge `e` px, the front bottom-left corner at (x, y):
 * the front, the top and the right side, each cut into its cubes. `solid` draws only the outside edges.
 */
const cubes = ([beat, at]: At, x: number, y: number, l: number, w: number, h: number, e: number, solid = false, c: ChalkColor = 'w'): ChalkMark => {
  const d = e * K, R = x + l * e, T = y - h * e, p: string[] = []
  const I = (n: number) => (solid ? [0, n] : Array.from({ length: n + 1 }, (_, i) => i))
  for (const i of I(l)) p.push(seg(x + i * e, y, x + i * e, T))                           // front: up
  for (const k of I(h)) p.push(seg(x, y - k * e, R, y - k * e))                           // front: across
  for (const i of I(l)) p.push(seg(x + i * e, T, x + i * e + w * d, T - w * d))           // top: back
  for (const j of I(w)) if (j) p.push(seg(x + j * d, T - j * d, R + j * d, T - j * d))    // top: across
  for (const k of I(h)) p.push(seg(R, y - k * e, R + w * d, y - k * e - w * d))           // side: back
  for (const j of I(w)) if (j) p.push(seg(R + j * d, y - j * d, R + j * d, T - j * d))    // side: up
  return { beat, at, c, d: p.join(' ') }
}
/** One cube with edge `e`, front bottom-left at (x, y). */
const cube = (at: At, x: number, y: number, e: number, c: ChalkColor = 'w') => cubes(at, x, y, 1, 1, 1, e, false, c)
/** A flat grid seen from the same angle: `l` squares across, `w` deep, front-left corner at (x, y). */
const floor = ([beat, at]: At, x: number, y: number, l: number, w: number, e: number, c: ChalkColor = 'b'): ChalkMark => {
  const d = e * K, p: string[] = []
  for (let i = 0; i <= l; i++) p.push(seg(x + i * e, y, x + i * e + w * d, y - w * d))
  for (let j = 0; j <= w; j++) p.push(seg(x + j * d, y - j * d, x + l * e + j * d, y - j * d))
  return { beat, at, c, d: p.join(' ') }
}
/** The front and side of a box's bottom layer, one cube high, washed. */
const layer = ([beat, at]: At, x: number, y: number, l: number, w: number, e: number, c: ChalkColor = 'b'): ChalkMark => {
  const d = e * K, R = x + l * e
  return { beat, at, c, wash: true, d: `M${x} ${y} H${R} L${f(R + w * d)} ${f(y - w * d)} V${f(y - e - w * d)} L${R} ${y - e} H${x} Z` }
}
/** A flat square seen from the box's angle (a sticker lying down), washed. */
const sticker = ([beat, at]: At, x: number, y: number, e: number, c: ChalkColor = 'b'): ChalkMark => {
  const d = e * K
  return { beat, at, c, wash: true, d: `M${x} ${y} h${e} l${f(d)} ${f(-d)} h${-e} Z` }
}

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Flat squares cannot fill it
  [
    sticker([0, 'square'], 70, 130, 70), floor([0, 'square'], 70, 130, 1, 1, 70),
    write([1, 'flat'], 'flat', 220, 115, 28, 'd'),
    floor([1, 'floor'], 60, 330, 3, 2, 45), write([1, 'floor'], 'a floor', 140, 370, 24, 'd'),
    cubes([2, 'box'], 350, 320, 3, 2, 2, 55, true), vspan([2, 'up'], 325, 210, 320),
    write([3, 'fill'], '?', 432, 265, 48, 'b'),
    write([3, 'No'], 'no height', 220, 160, 28, 'r'),
  ],
  // The big idea: space is measured in cubes
  [
    cube([0, 'cubes'], 70, 290, 150),
    write([0, 'unit'], '1', 145, 318, 26, 'd'), write([0, 'unit'], '1', 50, 215, 26, 'd'), write([0, 'unit'], '1', 82, 100, 26, 'd'),
    write([0, 'inch'], 'cubic inch', 450, 130, 32, 'y'),
    write([0, 'foot'], 'cubic foot', 450, 200, 32, 'y'),
    write([0, 'meter'], 'cubic meter', 450, 270, 32, 'y'),
  ],
  // A tiny cube and a big cube
  [
    cube([1, 'centimeter'], 120, 250, 22), write([1, 'centimeter'], '1 cm', 131, 280, 22, 'd'),
    write([1, 'centimeter'], 'cubic centimeter', 140, 170, 28, 'y'), write([1, 'fingertip'], 'a fingertip', 140, 330, 24, 'd'),
    cube([2, 'meter'], 330, 350, 170), write([2, 'meter'], '1 m', 415, 378, 22, 'd'),
    write([2, 'meter'], 'cubic meter', 444, 60, 28, 'y'),
    // a child sitting on the floor of the cube, knees up
    { beat: 2, at: 'sit', c: 'w', d: 'M398 280 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 M410 292 L404 344 L438 316 L448 346 M408 306 L434 318' },
  ],
  // Count in cubes
  [
    cubes([0, 'cube'], 60, 330, 3, 2, 2, 60), write([0, 'centimeter'], '1 cube = 1 cubic cm', 450, 100, 26),
    layer([1, 'layer'], 60, 330, 3, 2, 60), write([1, '6'], '1 layer: 3 × 2 = 6', 450, 170, 26),
    write([2, 'layers'], '2 layers: 6 × 2 = 12', 450, 240, 26),
    write([3, 'centimeters'], '12 cubic centimeters', 455, 320, 24, 'y'),
  ],
  // Pick a cube that fits
  [
    write([0, 'Which'], 'which cube?', 300, 50, 30, 'd'),
    cubes([1, 'small'], 70, 200, 2, 1, 1, 60, true), { beat: 1, at: 'small', c: 'w', d: 'M128 128 q22 -28 44 0' },
    write([1, 'lunch'], 'lunch box', 130, 240, 24, 'd'),
    cube([1, 'cube'], 225, 200, 16), write([1, 'inches'], 'cubic inches', 150, 320, 30, 'y'),
    box([2, 'big'], 330, 110, 170, 100), box([2, 'truck'], 500, 150, 60, 60),
    ring([2, 'truck'], 370, 222, 14, 14, 'w'), ring([2, 'truck'], 530, 222, 14, 14, 'w'),
    cube([2, 'truck'], 395, 190, 50), write([2, 'feet'], 'cubic feet', 445, 320, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'measure'], '12 square centimeters', 300, 160, 32), cross([1, 'SQUARE'], 125, 138, 350, 44),
    sticker([2, 'Squares'], 100, 280, 80), floor([2, 'floor'], 100, 280, 1, 1, 80), write([2, 'floor'], 'covers', 170, 320, 24, 'd'),
    cube([3, 'cubes'], 400, 300, 70), write([3, 'fill'], 'fills', 435, 330, 24, 'd'),
    write([3, 'centimeters'], '12 cubic centimeters', 300, 375, 30, 'y'),
  ],
]
