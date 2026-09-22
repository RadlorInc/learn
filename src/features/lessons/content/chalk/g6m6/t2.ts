/** g6m6-t2's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross } from '../../../chalk'
import { warn, tick } from '../g3m1/t1'
import { poly, type Pt } from '../g3m6/t5'
import { on, fill, height } from './t1'
// Colours: blue = what we measure and the copy, yellow = the result (one flag, half), coral = the mix-up.

// The flag: base 6, height 4, top point over x = 2. Its copy, turned upside down (half a turn about the middle of the
// slanted side), fits that side exactly and makes the leaning shape 0,0 · 6,0 · 8,4 · 2,4: base 6, height 4.
const FLAG: Pt[] = [[0, 0], [6, 0], [2, 4]]
const COPY: Pt[] = [[6, 0], [8, 4], [2, 4]]
const UPSIDE: Pt[] = [[0, 4], [6, 4], [4, 0]]      // the copy on its own, before it is fitted
const BOX: Pt[] = [[0, 0], [6, 0], [6, 4], [0, 4]]
const LEFT_GAP: Pt[] = [[0, 0], [2, 4], [0, 4]]
const RIGHT_GAP: Pt[] = [[6, 0], [6, 4], [2, 4]]
const ht = (at: [number, string?], x0: number, yb: number, u: number, c: 'b' | 'w' | 'y' = 'b') => {
  const [t, f, s] = on([[2, 4], [2, 0], [3, 0]], x0, yb, u)
  return height(at, t, f, s, c)
}

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too much cloth
  [
    poly([0], on(FLAG, 180, 225, 40)), write([0, '4'], '6 × 4?', 300, 275, 32),
    poly([1, 'rectangle'], on(BOX, 180, 225, 40), 'd'),
    { ...fill([1, 'part'], on(LEFT_GAP, 180, 225, 40), 'r'), quick: true }, fill([1, 'part'], on(RIGHT_GAP, 180, 225, 40), 'r'),
    write([2, 'half'], 'exactly half', 300, 340, 34, 'y'),
  ],
  // The big idea: two copies make the leaning shape, so one is half
  [
    poly([0], on(FLAG, 140, 230, 40)),
    poly([0, 'copies'], on(COPY, 140, 230, 40), 'b'), fill([0, 'copies'], on(COPY, 140, 230, 40), 'b'),
    fill([0, 'half'], on(FLAG, 140, 230, 40), 'y'),
    write([0, 'base'], '1/2 × base × height', 300, 320, 34, 'y'),
  ],
  // Base and height
  [
    poly([0], on(FLAG, 165, 285, 45)),
    line([0, 'bottom'], on([[0, 0], [6, 0]], 165, 285, 45), 'b', 5), write([0, '6'], '6 in', 300, 322, 28, 'b'),
    ...ht([1, 'height'], 165, 285, 45), write([1, '4'], '4 in', 302, 200, 28, 'b'),
  ],
  // Make a copy
  [
    poly([0], on(FLAG, 30, 255, 34)),
    poly([0, 'upside'], on(UPSIDE, 372, 255, 34), 'b'),
    arrow([1, 'Fit'], [460, 100], [250, 100], 'b'),
    poly([1, 'slanted'], on(COPY, 30, 255, 34), 'b'), fill([1, 'slanted'], on(COPY, 30, 255, 34), 'b'),
    write([2, '6'], '6 in', 132, 290, 26), ...ht([2, '4'], 30, 255, 34, 'w'), write([2, '4'], '4 in', 132, 205, 24),
    write([2, 'shape'], 'two flags = one leaning shape', 300, 350, 30),
  ],
  // Take half
  [
    poly([0], on(FLAG, 140, 200, 40)), poly([0], on(COPY, 140, 200, 40), 'b'), fill([0], on(COPY, 140, 200, 40), 'b'),
    write([0, '24'], '6 × 4 = 24 square inches', 300, 255, 30),
    fill([1, 'half'], on(FLAG, 140, 200, 40), 'y'),
    write([1, '12'], '24 ÷ 2 = 12 square inches', 300, 330, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'STOP'], '6 × 4 = 24', 150, 150, 32, 'r'), cross([1, '24'], 70, 128, 160, 44),
    poly([2, 'two'], on(FLAG, 55, 300, 24)), poly([2, 'two'], on(COPY, 55, 300, 24), 'r'), fill([2, 'flags'], on(COPY, 55, 300, 24), 'r'),
    write([2, 'flags'], 'two flags', 150, 345, 26, 'r'),
    poly([2, 'half'], on(FLAG, 378, 300, 24)), fill([2, 'half'], on(FLAG, 378, 300, 24), 'y'),
    write([2, '12'], '1/2 × 6 × 4 = 12', 450, 150, 30, 'y'), tick([2, '12'], 436, 345),
  ],
]
