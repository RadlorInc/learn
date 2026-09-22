/** g8m5-t1's chalkboards (volume of a cylinder): index = screen index (0 is Screen 1, which has none).
 *  A can is drawn as its top ring, two sides and the front half of its bottom; yellow is the circle and the result. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, cells, arrow, cross, ring } from '../../../chalk'

type At = [number, string?]
/** The front half of an ellipse (the part of a can's bottom you can see). */
const front = ([beat, at]: At, cx: number, y: number, rx: number, ry: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `M${cx - rx} ${y} a${rx} ${ry} 0 0 0 ${rx * 2} 0` })
/** A filled ellipse. */
export const disc = (at: At, cx: number, cy: number, rx: number, ry: number, c: ChalkColor = 'y'): ChalkMark =>
  ({ ...ring(at, cx, cy, rx, ry, c), wash: true })
/** A can standing upright: centre x, top and bottom y, half-width rx. */
export const can = (at: At, cx: number, top: number, bot: number, rx: number, ry = 22, c: ChalkColor = 'w'): ChalkMark[] => [
  ring(at, cx, top, rx, ry, c), line(at, [[cx - rx, top], [cx - rx, bot]], c), line(at, [[cx + rx, top], [cx + rx, bot]], c),
  front(at, cx, bot, rx, ry, c),
]
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Cubes leave gaps: a box counts in cubes, a round can leaves gaps
  [
    ...[80, 125, 170, 215].map(y => cells([0, 'box'], 60, y, 180, 45, 4)),
    write([0, 'count'], 'count them', 150, 300, 26, 'd'),
    ring([1, 'round'], 440, 170, 90, 90, 'w'),
    ...[110, 150, 190].map(y => cells([2, 'cubes'], 380, y, 120, 40, 3, 'd')),
    ring([2, 'gaps'], 440, 94, 20, 9, 'r'), ring([2, 'gaps'], 519, 170, 9, 20, 'r'), ring([2, 'gaps'], 361, 170, 9, 20, 'r'),
    write([2, 'gaps'], 'gaps', 440, 300, 28, 'r'),
    write([3, 'round'], 'a round space = ?', 300, 360, 30, 'y'),
  ],
  // The big idea: a stack of circles; one circle × the height
  [
    ...can([0, 'cylinder'], 150, 110, 310, 90, 24, 'd'),
    ...[260, 210, 160].map(y => ({ ...ring([0, 'stack'], 150, y, 90, 24), quick: true })),
    disc([0, 'circle'], 450, 110, 50, 50), ring([0, 'circle'], 450, 110, 50, 50),
    write([0, 'area'], 'one circle', 450, 195, 26, 'y'),
    write([0, 'multiply'], '× height', 450, 255, 32, 'b'),
    arrow([0, 'height'], [275, 310], [275, 110], 'b'),
  ],
  // The bottom circle: radius 2 in, 3.14 × 2 × 2 = 12.56
  [
    ...can([0, 'Start'], 150, 90, 300, 90, 24, 'd'), ring([0, 'bottom'], 150, 300, 90, 24),
    line([1, 'center'], [[150, 300], [240, 300]], 'b'), write([1, '2'], '2 in', 195, 350, 24, 'b'),
    write([1, 'radius'], 'r = 2 in', 440, 80, 28, 'b'),
    write([2, 'area'], 'circle = 3.14 × r × r', 430, 150, 26),
    write([3, '3.14'], '3.14 × 2 × 2', 440, 215, 30), write([3, '12.56'], '= 12.56 sq in', 440, 270, 30, 'y'),
    disc([3, 'layer'], 150, 300, 90, 24), write([3, 'layer'], 'one layer', 440, 340, 26, 'y'),
  ],
  // Stack the layers: 5 layers of 12.56 up a can 5 in tall
  [
    ...can([0, 'Now'], 150, 70, 330, 90, 22, 'd'), ring([0, 'circle'], 150, 330, 90, 22),
    arrow([0, 'up'], [265, 330], [265, 70], 'b'),
    ring([1, 'layer'], 150, 278, 90, 22), write([1, '12.56'], '1 layer = 12.56', 440, 100, 28, 'y'),
    write([2, 'layers'], 'how many?', 440, 180, 28, 'b'),
    ...[226, 174, 122].map(y => ({ ...ring([2, 'tall'], 150, y, 90, 22), quick: true })),
    write([2, 'tall'], '5 in', 265, 365, 24, 'b'),
    write([2, 'so'], '5 layers', 440, 260, 32, 'y'),
  ],
  // Put it together: 12.56 × 5 = 62.8, the same as 3.14 × 2 × 2 × 5
  [
    write([0, 'want'], '12.56 × 5', 250, 70, 34), write([1, '62.8'], '= 62.8', 395, 70, 34, 'y'),
    write([2, 'go'], '3.14 × 2 × 2 × 5', 300, 180, 36),
    line([2, 'circle'], [[165, 212], [370, 212]], 'y'), write([2, 'circle'], 'circle', 267, 245, 24, 'y'),
    line([2, 'height'], [[420, 212], [448, 212]], 'b'), write([2, 'height'], 'height', 434, 245, 24, 'b'),
    write([3, 'holds'], '62.8 cubic inches', 300, 330, 38, 'y'),
  ],
  // One thing not to do: 4 in across crossed; the radius is 2 in
  [
    ...warn([0, 'mix']),
    ring([1, 'distance'], 130, 230, 70, 70, 'w'), line([1, 'across'], [[60, 230], [200, 230]], 'r'),
    write([1, 'across'], '4 in', 130, 212, 24, 'r'),
    write([1, 'ALL'], '3.14 × 4 × 4 × 5', 410, 170, 30, 'r'), cross([1, 'across'], 285, 128, 250, 84),
    line([2, 'radius'], [[130, 230], [180, 280]], 'y'), write([2, 'radius'], '2 in', 200, 318, 24, 'y'),
    write([2, 'half'], '3.14 × 2 × 2 × 5', 410, 260, 32, 'y'), write([2, '2'], '= 62.8', 410, 320, 32, 'y'),
  ],
]
