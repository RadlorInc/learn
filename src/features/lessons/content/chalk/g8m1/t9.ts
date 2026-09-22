/** g8m1-t9's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Yellow is the closer square and root, blue the number 20, coral the mix-up, dim the labels. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, arrow, cross, ring, span } from '../../../chalk'
import { warn, type At } from './t6'
import { root } from './t8'

/** Where v sits on a line that runs from `a` at x = 110 to `b` at x = 490. */
const X = (v: number, a: number, b: number) => 110 + ((v - a) * 380) / (b - a)
/** A line from 110 to 490 with a tick at each of `at` (values between a and b). */
const nl = ([beat, at]: At, y: number, a: number, b: number, ts: number[], c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `M100 ${y} H500` + ts.map(v => ` M${X(v, a, b)} ${y - 10} v20`).join('') })
const dot = ([beat, at]: At, x: number, y: number, c: ChalkColor = 'y'): ChalkMark =>
  ({ beat, at, c, w: 5, d: `M${x - 6} ${y} a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0` })
const SQ = Array.from({ length: 10 }, (_, i) => 16 + i)
const s = (v: number) => X(v, 16, 25)
/** √20 on the line from 4 to 5 (it is about 4.47). */
const r = (v: number) => X(v, 4, 5)
const ROOT20 = Math.sqrt(20)

export const T9: (ChalkMark[] | undefined)[] = [
  undefined,
  // No whole number works
  [
    write([0, '16'], '4 × 4 = 16', 160, 70, 36), write([0, 'small'], 'too small', 160, 120, 24, 'd'),
    write([1, '25'], '5 × 5 = 25', 440, 70, 36), write([1, 'big'], 'too big', 440, 120, 24, 'd'),
    write([2, '20'], '? × ? = 20', 300, 210, 44, 'y'),
    write([2, 'none'], 'no whole number works', 300, 268, 26, 'r'),
    arrow([2, 'close'], [150, 335], [245, 335], 'd'), arrow([2, 'close'], [450, 335], [355, 335], 'd'), write([2, 'close'], '?', 300, 335, 40, 'y'),
  ],
  // The big idea: between the squares, between their roots
  [
    nl([0, 'find'], 130, 16, 25, SQ),
    write([0, 'below'], '16', s(16), 170, 30, 'y'), write([0, 'above'], '25', s(25), 170, 30, 'y'),
    dot([0, 'number'], s(20), 130, 'b'), write([0, 'number'], '20', s(20), 170, 30, 'b'),
    nl([0, 'roots'], 280, 4, 5, [4, 5]), write([0, 'roots'], '4', r(4), 320, 32, 'y'), write([0, 'roots'], '5', r(5), 320, 32, 'y'),
    dot([0, 'nearer'], r(ROOT20), 280), ...root([0, 'nearer'], '20', r(ROOT20), 235, 28, 'y'),
  ],
  // The squares on each side
  [
    nl([0, 'which'], 110, 16, 25, SQ), dot([0, '20'], s(20), 110, 'b'), write([0, '20'], '20', s(20), 150, 30, 'b'),
    write([0, '16'], '16', s(16), 150, 30, 'y'), write([0, '25'], '25', s(25), 150, 30, 'y'),
    nl([1, 'between'], 250, 4, 5, [4, 5]), ...root([1, 'between'], '20', r(ROOT20), 205, 30, 'b'), write([1, 'between'], '?', r(ROOT20) + 40, 205, 30, 'b'),
    ...root([1, '4'], '16', r(4), 310, 32, 'y', '4'), ...root([1, '5'], '25', r(5), 310, 32, 'y', '5'),
  ],
  // Which square is closer?
  [
    nl([0, 'measure'], 180, 16, 25, SQ), write([0, 'measure'], '16', s(16), 220, 28), write([0, 'measure'], '20', s(20), 220, 28, 'b'),
    write([0, 'measure'], '25', s(25), 220, 28),
    span([0, '4'], s(16), s(20), 130, 'y'), write([0, '4'], '4 away', (s(16) + s(20)) / 2, 90, 26, 'y'),
    span([0, '5'], s(20), s(25), 130), write([0, '5'], '5 away', (s(20) + s(25)) / 2, 90, 26),
    ring([1, '16'], s(16), 220, 26, 22, 'y'),
    nl([1, 'so'], 320, 4, 5, [4, 5]), write([1, 'so'], '4', r(4), 360, 28, 'y'), write([1, 'so'], '5', r(5), 360, 28),
    dot([1, '4'], r(ROOT20), 320), ...root([1, '4'], '20', r(ROOT20), 275, 26, 'y'),
  ],
  // Check it
  [
    nl([0, 'halfway'], 110, 4, 5, [4, 4.5, 5]), write([0, '4'], '4', r(4), 150, 30), write([0, '5'], '5', r(5), 150, 30),
    write([0, '4.5'], '4.5', r(4.5), 150, 30, 'b'),
    write([1, '4.5'], '4.5 × 4.5 = 20.25', 300, 230, 40), write([1, 'more'], 'a little more than 20', 300, 280, 24, 'd'),
    dot([2, 'under'], r(ROOT20), 110), ...root([2, 'under'], '20', r(ROOT20) - 20, 60, 26, 'y'),
    ...root([2, 'nearer'], '20', 300, 350, 42, 'y', '< 4.5'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...root([1, 'halve'], '20', 300, 165, 40, 'r', '20 ÷ 2 = 10'), cross([1, 'number'], 415, 145, 50, 40),
    write([2, 'because'], '10 × 10 = 100', 300, 235, 30, 'd'),
    write([2, 'squares'], '16 < 20 < 25', 300, 310, 42, 'y'),
  ],
]
