/** g7m3-t1's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A box of pens is a square with x in it, a loose pen a short stroke; yellow is the result, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, span, cross, ring, arrow } from '../../../chalk'

type At = [number, string?]
/** A box of x pens, centred on (x, y). */
export const bx = (at: At, x: number, y: number, c: 'w' | 'y' | 'b' = 'w'): ChalkMark[] =>
  [{ ...box(at, x - 20, y - 20, 40, 40, c), quick: true }, { ...write(at, 'x', x, y, 26, c), quick: true }]
/** `n` loose pens from x0, one stroke each. */
export const pens = (at: At, x0: number, y: number, n: number, gap = 14, c: 'w' | 'y' | 'b' = 'b'): ChalkMark[] =>
  Array.from({ length: n }, (_, i) => ({ ...line(at, [[x0 + i * gap, y - 18], [x0 + i * gap, y + 18]], c), quick: true }))
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // It is long and mixed up
  [
    write([0, 'line'], '3x + 5 + 2x − 1', 300, 60, 40),
    ...bx([1, 'Boxes'], 70, 150), ...bx([1, 'Boxes'], 120, 150), ...bx([1, 'Boxes'], 170, 150),
    ...pens([1, 'pens'], 215, 150, 5), ...bx([1, 'jumbled'], 320, 150), ...bx([1, 'jumbled'], 370, 150),
    ...pens([1, 'together'], 430, 150, 1), cross([1, 'together'], 418, 130, 24, 40),
    write([2, 'add'], '3x + 5', 230, 240, 36), write([2, 'number'], '= one number?', 390, 240, 30),
    write([2, 'No'], 'no', 530, 240, 30, 'r'),
    write([3, 'box'], 'pens in a box = ?', 300, 330, 30, 'b'),
  ],
  // The big idea: boxes with boxes, pens with pens, never a box with a pen
  [
    ...bx([0, 'x'], 90, 110), ...bx([0, 'x'], 140, 110), ...bx([0, 'x'], 190, 110), ring([0, 'parts'], 140, 110, 90, 42, 'y'),
    write([0, 'parts'], 'x parts', 140, 190, 26),
    ...pens([0, 'plain'], 380, 110, 5), ring([0, 'numbers'], 408, 110, 60, 42, 'y'),
    write([0, 'numbers'], 'plain numbers', 410, 190, 26, 'b'),
    ...bx([0, 'join'], 180, 300), write([0, 'join'], '+', 240, 300, 32), ...pens([0, 'join'], 285, 300, 3),
    cross([0, 'never'], 150, 268, 170, 64), write([0, 'plain'], 'never one lump', 470, 300, 28, 'r'),
  ],
  // Group the x parts
  [
    ...bx([0, 'boxes'], 90, 80), ...bx([0, 'boxes'], 140, 80), ...bx([0, 'boxes'], 190, 80),
    ...bx([0, 'boxes'], 400, 80), ...bx([0, 'boxes'], 450, 80),
    arrow([0, 'next'], [425, 125], [320, 170], 'd'),
    ...bx([0, 'other'], 200, 200), ...bx([0, 'other'], 250, 200), ...bx([0, 'other'], 300, 200),
    ...bx([0, 'other'], 350, 200), ...bx([0, 'other'], 400, 200),
    write([1, '3'], '3', 140, 35, 26, 'd'), write([1, '2'], '2', 425, 35, 26, 'd'),
    span([1, '5'], 180, 420, 245, 'y'), write([1, 'boxes'], '5 boxes', 300, 280, 28, 'y'),
    write([2, '3x'], '3x + 2x', 250, 345, 40), write([2, '5x'], '= 5x', 390, 345, 40, 'y'),
  ],
  // Group the plain numbers
  [
    ...pens([0, 'pens'], 220, 100, 5, 30, 'b'),
    write([1, '5'], '5', 140, 100, 32, 'd'),
    cross([1, 'away'], 330, 76, 20, 48), arrow([1, 'away'], [360, 100], [430, 100], 'r'), write([1, 'away'], '− 1', 480, 100, 30, 'r'),
    write([2, '5'], '5 − 1', 250, 230, 40), write([2, '4'], '= 4', 360, 230, 40, 'y'),
    ring([2, 'left'], 265, 100, 60, 36, 'y'), write([2, 'left'], 'loose pens left', 300, 300, 26, 'y'),
  ],
  // Put it together, and check with x = 2
  [
    write([0, 'line'], '3x + 5 + 2x − 1', 300, 55, 34), write([0, '5x'], '= 5x + 4', 300, 105, 36, 'y'),
    write([1, '2'], 'x = 2', 300, 165, 32, 'b'),
    write([2, 'long'], 'long', 80, 235, 24, 'd'), write([2, '6'], '6 + 5 + 4 − 1', 270, 235, 30), write([2, '14'], '= 14', 430, 235, 30, 'y'),
    write([3, 'short'], 'short', 80, 300, 24, 'd'), write([3, '10'], '10 + 4', 270, 300, 30), write([3, '14'], '= 14', 430, 300, 30, 'y'),
    ring([3, 'match'], 435, 268, 50, 62, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...bx([1, 'JOIN'], 220, 160, 'w'), write([1, 'JOIN'], '+', 275, 160, 32), ...pens([1, 'plain'], 310, 160, 5),
    write([1, 'number'], 'join?', 440, 160, 30, 'r'),
    write([2, '8x'], '3x + 5 = 8x', 300, 245, 36, 'r'), cross([2, '8x'], 322, 225, 82, 40),
    write([2, 'stays'], '3x + 5 stays 3x + 5', 300, 330, 34, 'y'),
  ],
]
