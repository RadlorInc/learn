/** g4m5-t3's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, cross, ring, arrow } from '../../../chalk'
import { warn } from '../g3m1/t1'
import { angle, arc, ray, pt, type At } from './t2'
// Colours across these boards: white = the angle and the protractor, blue = lining it up, yellow = the count and the size, coral = the mix-up.

/** A protractor's half circle, flat side on the corner (x, y). */
const edge = ([beat, at]: At, x: number, y: number, R: number): ChalkMark =>
  ({ beat, at, c: 'w', quick: true, d: `M${x - R} ${y} A${R} ${R} 0 0 1 ${x + R} ${y} Z` })
/** A small mark every 10 degrees, a longer one every 30. */
const steps = ([beat, at]: At, x: number, y: number, R: number): ChalkMark => ({
  beat, at, c: 'w', w: 2, quick: true,
  d: Array.from({ length: 19 }, (_, i) => `M${pt(x, y, i * 10, R).join(' ')} L${pt(x, y, i * 10, R - (i % 3 ? 9 : 17)).join(' ')}`).join(' '),
})
/** Where the number for `deg` sits: inside the edge (or outside it, for the second row), lifted off the flat side at the ends. */
const numAt = (x: number, y: number, R: number, deg: number, outer = false) => {
  const [nx, ny] = pt(x, y, deg, outer ? R + 22 : R - 30)
  return [nx, deg % 180 ? ny : ny - 14] as const
}
/** The numbers 0, 30, … 180. The second row counts the other way, from the far end. */
const nums = ([beat, at]: At, x: number, y: number, R: number, outer = false, c: ChalkColor = 'w'): ChalkMark[] =>
  Array.from({ length: 7 }, (_, i) => {
    const [nx, ny] = numAt(x, y, R, i * 30, outer)
    return { ...write([beat, at], String(outer ? 180 - i * 30 : i * 30), nx, ny, 20, c), quick: true }
  })
const protractor = (at: At, x: number, y: number, R: number): ChalkMark[] => [edge(at, x, y, R), steps(at, x, y, R), ...nums(at, x, y, R)]

// The ramp: 40°, corner at (300, 340), on a protractor of radius 175.
const X = 300, Y = 340, R = 175
const ramp = (at: At, x = X, y = Y, r = R): ChalkMark => ({ ...angle(at, x, y, 40, r), quick: true })
/** Counting one step round the edge, to `deg`, and saying its number. */
const count = (at: At, deg: number): ChalkMark[] => {
  const [lx, ly] = pt(X, Y, deg, R + 32)
  return [arc(at, X, Y, R + 10, deg - 10, deg, 'y', 3.4), write(at, String(deg), lx, ly, 22, 'y')]
}

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Narrow is not exact
  [
    angle([1, 'two'], 60, 250, 20, 220), angle([1, 'two'], 340, 250, 70, 190),
    { ...write([1, 'narrow'], 'narrow', 170, 300, 26, 'd'), quick: true }, write([1, 'narrow'], 'narrow', 435, 300, 26, 'd'),
    write([1, 'same'], 'not the same', 300, 300, 26),
    write([2, 'number'], 'we need a number', 300, 360, 34, 'y'),
  ],
  // The big idea: middle on the corner, 0 on a ray, count up
  [
    ramp([0], X, 330, 170),
    ...protractor([0, 'protractor'], X, 330, 170),
    ring([0, 'corner'], X, 330, 13, 13, 'b'),
    ring([0, '0'], ...numAt(X, 330, 170, 0), 15, 15, 'b'),
    arc([0, 'count'], X, 330, 184, 0, 40, 'y', 4.5),
  ],
  // Line up the protractor
  [
    ramp([0]),
    edge([0, 'protractor'], X, Y, R), steps([0, 'marked'], X, Y, R), ...nums([0, 'degrees'], X, Y, R),
    ring([1, 'corner'], X, Y, 13, 13, 'b'), write([1, 'corner'], 'middle on the corner', 300, 55, 28, 'b'),
    ray([2, 'ray'], X, Y, 0, R, 'b', 5), ring([2, '0'], ...numAt(X, Y, R, 0), 15, 15, 'b'),
    write([2, '0'], '0 on one ray', 300, 110, 28, 'b'),
  ],
  // Count up from 0
  [
    ramp([0]), ...protractor([0], X, Y, R),
    ring([0, 'mark'], ...pt(X, Y, 10, R - 5), 11, 11, 'y'),
    ...count([1, 'ten'], 10), ...count([1, 'twenty'], 20), ...count([1, 'thirty'], 30), ...count([1, 'forty'], 40),
    ring([2, 'right'], ...pt(X, Y, 40, R + 32), 20, 20, 'y'),
  ],
  // Say how big
  [
    ramp([0], 190, 330, 150), ...protractor([0], 190, 330, 150),
    arc([0, 'open'], 190, 330, 55, 0, 40, 'y', 4), write([0, 'degrees'], '40 degrees', 460, 120, 34),
    write([1, 'circle'], '40°', 460, 230, 64, 'y'), arrow([1, 'high'], [540, 290], [506, 226], 'd'),
    write([1, 'degrees'], '° means degrees', 460, 320, 28, 'd'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ramp([1], 200, 340, 150), ...protractor([1], 200, 340, 150), ...nums([1, 'count'], 200, 340, 150, true, 'd'),
    ring([1, 'far'], ...numAt(200, 340, 150, 180, true), 16, 16, 'r'),
    ring([2, '0'], ...numAt(200, 340, 150, 0), 16, 16, 'y'),
    write([2, '40'], '40°', 480, 190, 44, 'y'),
    write([2, '140'], '140°', 480, 285, 44, 'r'), cross([2, '140'], 425, 262, 110, 46),
  ],
]
