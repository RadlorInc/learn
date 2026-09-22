/** g7m4-t3's chalkboards (area of a circle): index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, span, cross, ring } from '../../../chalk'

type At = [number, string?]
const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]
/** A grid of square tiles, cols × rows, each `s` wide, from (x, y). */
const tiles = ([beat, at]: At, x: number, y: number, cols: number, rows: number, s: number, c: 'w' | 'b' = 'w'): ChalkMark => ({
  beat, at, c, d: `M${x} ${y} h${cols * s} v${rows * s} h${-cols * s} Z`
    + Array.from({ length: cols - 1 }, (_, i) => ` M${x + s * (i + 1)} ${y} v${rows * s}`).join('')
    + Array.from({ length: rows - 1 }, (_, i) => ` M${x} ${y + s * (i + 1)} h${cols * s}`).join(''),
})
/** The circle's 8 slices laid in a row, points up and down: from x0, each slice base w, top at y, height h. */
const row = ([beat, at]: At, x0: number, y: number, w: number, h: number, c: 'w' | 'y' = 'w'): ChalkMark => ({
  beat, at, c, d: `M${x0} ${y + h}` + Array.from({ length: 9 }, (_, i) => ` L${x0 + (w * (i + 1)) / 2} ${i % 2 ? y + h : y}`).join('')
    + ` M${x0} ${y + h} H${x0 + 4 * w} M${x0 + w / 2} ${y} H${x0 + 4.5 * w}`,
})
/** 8 cuts through the middle of a circle, like a pizza. */
const cuts = ([beat, at]: At, cx: number, cy: number, r: number): ChalkMark => ({
  beat, at, c: 'w', d: [0, 1, 2, 3].map(i => {
    const a = (i * Math.PI) / 4, dx = Math.round(r * Math.cos(a)), dy = Math.round(r * Math.sin(a))
    return `M${cx - dx} ${cy - dy} L${cx + dx} ${cy + dy}`
  }).join(' '),
})

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Squares do not fit: tiles fill a rectangle, but leave gaps in a circle
  [
    tiles([0, 'rectangle'], 50, 80, 4, 3, 40), write([0, 'multiply'], '4 × 3 = 12 tiles', 130, 235, 24),
    ring([1, 'round'], 420, 170, 110, 110, 'w'), tiles([1, 'tiles'], 345, 95, 3, 3, 50, 'b'),
    ring([2, 'gaps'], 420, 77, 26, 12, 'r'), ring([2, 'gaps'], 513, 170, 12, 26, 'r'),
    ring([2, 'gaps'], 420, 263, 26, 12, 'r'), ring([2, 'gaps'], 327, 170, 12, 26, 'r'),
    write([2, 'gaps'], 'gaps', 540, 70, 24, 'r'),
    write([2, 'exact'], 'counting tiles: never exact', 300, 350, 28, 'r'),
  ],
  // The big idea: 3.14 squares of radius × radius
  [
    ring([0, 'area'], 180, 210, 130, 130, 'w'),
    write([0, '3.14'], '3.14 ×', 460, 90, 32, 'y'),
    line([0, 'radius'], [[180, 210], [310, 210]], 'b'), write([0, 'radius'], 'radius', 245, 236, 22, 'b'),
    box([0, 'uses'], 180, 80, 130, 130, 'y'), write([0, 'uses'], 'radius × radius', 455, 145, 26, 'y'),
    write([0, 'across'], 'not the whole way across', 440, 370, 22, 'r'),
  ],
  // Cut it into slices, lay them in a row
  [
    ring([0, 'pond'], 130, 130, 100, 100, 'w'), cuts([0, 'slices'], 130, 130, 100),
    row([1, 'row'], 120, 250, 80, 100),
    write([2, 'shape'], '?', 530, 300, 44, 'y'),
  ],
  // Almost a rectangle: long side half the way around, short side the radius
  [
    row([0, 'rectangle'], 140, 70, 80, 100), box([0, 'rectangle'], 160, 70, 320, 100, 'y'),
    span([1, 'long'], 160, 480, 200), write([1, 'half'], 'half the way around', 320, 235, 22, 'd'),
    write([1, '3.14'], '3.14 × 10', 262, 280, 28), write([1, '31.4'], '= 31.4 m', 392, 280, 28, 'y'),
    line([2, 'short'], [[110, 70], [110, 170]], 'b'), line([2, 'short'], [[100, 70], [120, 70]], 'b'), line([2, 'short'], [[100, 170], [120, 170]], 'b'),
    write([2, 'radius'], '10 m', 60, 120, 26, 'b'), write([2, 'radius'], 'the radius, 10 m', 320, 340, 28, 'b'),
  ],
  // Multiply the sides
  [
    box([0, 'sides'], 60, 60, 200, 70), write([0, 'sides'], '31.4 m', 160, 45, 22, 'y'), write([0, 'sides'], '10 m', 305, 95, 22, 'b'),
    write([0, '31.4'], '31.4 × 10', 255, 190, 32), write([0, '314'], '= 314', 382, 190, 32, 'y'),
    write([1, '3.14'], '= 3.14 × 10 × 10', 300, 260, 32),
    write([2, '314'], '314 square meters', 300, 340, 34, 'y'),
  ],
  // One thing not to do: 20 × 20 crossed, 10 × 10 in yellow
  [
    ...warn([0, 'mix']),
    write([1, '20'], '3.14 × 20 × 20', 300, 150, 32, 'r'), write([2, 'gives'], '= 1,256', 300, 200, 30, 'r'),
    cross([2, 'big'], 440, 132, 36, 36),
    write([2, 'radius'], '3.14 × 10 × 10 = 314', 300, 300, 32, 'y'),
  ],
]
