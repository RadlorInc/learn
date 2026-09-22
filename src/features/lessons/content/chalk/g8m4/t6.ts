/** g8m4-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The roof triangle has its real angles: 50° at the left, 60° at the right, 70° at the top. Each corner keeps its colour
 *  (left yellow, top white, right blue) so the torn-off corners can be followed onto the straight line. */
import type { ChalkMark } from '../../../chalk'
import { write, line, ring, cross } from '../../../chalk'
import { warn } from '../g7m3/t1'
import { arc, q, type At } from './helpers-t6-t9'

type Pt = [number, number]
/** The 50°/60° triangle on a base from (x, y), `w` wide: [left, right, top]. */
const roof = (x: number, y: number, w: number): [Pt, Pt, Pt] => {
  const ta = Math.tan((50 * Math.PI) / 180), tb = Math.tan((60 * Math.PI) / 180), cx = (w * tb) / (ta + tb)
  return [[x, y], [x + w, y], [Math.round(x + cx), Math.round(y - cx * ta)]]
}
const outline = (at: At, [a, b, c]: [Pt, Pt, Pt]) => line(at, [a, b, c, a])
/** The three corners' arcs, in their colours. */
const corners = (at: At, [a, b, c]: [Pt, Pt, Pt], r = 30): ChalkMark[] => [
  q(arc(at, a[0], a[1], r, 0, 50, 'y')), q(arc(at, b[0], b[1], r, 120, 180, 'b')), arc(at, c[0], c[1], r - 6, 230, 300, 'w'),
]
/** Three wedges meeting at (x, y) on a straight line, in the corners' colours. */
const fan = (at: At, x: number, y: number, len: number): ChalkMark[] => {
  const ray = (a: number): Pt => [Math.round(x + len * Math.cos((a * Math.PI) / 180)), Math.round(y - len * Math.sin((a * Math.PI) / 180))]
  return [q(line(at, [ray(50), [x, y], ray(120)])), q(arc(at, x, y, 34, 0, 50, 'y')), q(arc(at, x, y, 30, 50, 120, 'w')), arc(at, x, y, 34, 120, 180, 'b')]
}

/** A small angle on its own: two arms and the arc between them, for "this angle = that + that". */
const wedge = (at: At, x: number, y: number, a0: number, a1: number, c: 'w' | 'y' | 'r'): ChalkMark[] => {
  const arm = (a: number): Pt => [Math.round(x + 44 * Math.cos((a * Math.PI) / 180)), Math.round(y - 44 * Math.sin((a * Math.PI) / 180))]
  return [q(line(at, [arm(a1), [x, y], arm(a0)], 'd')), arc(at, x, y, 22, a0, a1, c, 4)]
}

const S2 = roof(60, 330, 280), S5 = roof(60, 330, 280)
const [A5, B5, C5] = S5

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // No way to measure
  [
    outline([0], S2), write([0, 'measure'], '50°', 115, 308, 24), write([0, 'measure'], '60°', 288, 302, 24),
    write([0, 'corner'], '?', S2[2][0], S2[2][1] - 28, 34, 'y'), ring([0, 'corner'], S2[2][0], S2[2][1] - 26, 22, 24, 'y'),
    { beat: 1, at: 'protractor', c: 'd', w: 2.6, d: 'M410 170 A60 60 0 0 1 530 170 Z M470 170 v-12 M428 128 l8 8 M512 128 l-8 8' },
    cross([1, 'there'], 420, 110, 100, 70),
    write([2, 'rule'], 'find it with a rule', 455, 250, 26, 'y'),
  ],
  // The big idea: inside they make a straight line; outside = the two far ones
  (() => {
    const [a, b, c] = roof(40, 250, 230)
    return [
      outline([0, 'three'], [a, b, c]), ...corners([0, 'angles'], [a, b, c]),
      ...fan([0, '180°'], 470, 250, 110), q(line([0, '180°'], [[350, 250], [590, 250]])), write([0, '180°'], '180°', 470, 290, 30, 'y'),
      line([0, 'outside'], [b, [340, 250]]), arc([0, 'outside'], b[0], b[1], 40, 0, 120, 'r', 4.5),
      ring([0, 'far'], a[0] + 42, a[1] - 16, 24, 20, 'd'), ring([0, 'far'], c[0], c[1] + 40, 20, 24, 'd'),
      ...wedge([0, 'equals'], 150, 370, 0, 120, 'r'), write([0, 'equals'], '=', 225, 355, 32),
      ...wedge([0, 'two'], 280, 370, 0, 50, 'y'), write([0, 'far'], '+', 355, 355, 32),
      ...wedge([0, 'added'], 420, 332, 235, 305, 'w'),
    ]
  })(),
  // Tear off the corners
  (() => {
    const T = roof(40, 300, 230)
    return [
      outline([0, 'paper'], T),
      ...corners([1, 'corners'], T),
      ...fan([1, 'together'], 450, 300, 120),
      line([2, 'straight'], [[320, 300], [580, 300]], 'y'), write([2, '180°'], '180°', 450, 345, 32, 'y'),
    ]
  })(),
  // Take away from 180
  [
    outline([0], S5), write([0, 'Add'], '50°', 115, 308, 24), write([0, 'Add'], '60°', 288, 302, 24),
    write([0, 'Add'], '?', C5[0], C5[1] - 26, 30, 'y'),
    write([0, '110'], '50 + 60 = 110', 470, 110, 30),
    write([1, '180?'], '180 − 110', 440, 190, 30), write([1, '70'], '= 70', 552, 190, 30, 'y'),
    write([2, '70°'], '70°', C5[0] - 4, C5[1] + 50, 24, 'y'), write([2, 'top'], 'top angle = 70°', 470, 280, 30, 'y'),
  ],
  // The angle outside
  [
    outline([0], S5), q(write([0], '50°', 115, 308, 24)), q(write([0], '60°', 288, 302, 24)), write([0], '70°', C5[0] - 4, C5[1] + 50, 24),
    line([0, 'stretch'], [B5, [480, 330]], 'w'),
    arc([1, 'outside'], B5[0], B5[1], 40, 0, 120, 'r', 4.5), write([1, '120°'], '120°', 392, 270, 26, 'r'),
    write([1, '120°'], '180 − 60 = 120°', 440, 80, 30),
    ring([2, 'far'], A5[0] + 55, A5[1] - 22, 30, 22, 'y'), ring([2, 'far'], C5[0] - 4, C5[1] + 50, 26, 20, 'y'),
    write([2, '120'], '50 + 70 = 120', 440, 140, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'STOP'], '50 + 60 = 110', 300, 140, 34), write([1, '110'], 'top = 110°', 300, 200, 34, 'r'),
    cross([2, 'not'], 205, 178, 190, 46),
    write([2, 'away'], '180 − 110 = 70', 300, 275, 34, 'y'), write([2, '70°'], 'top = 70°', 300, 340, 34, 'y'),
  ],
]
