/** g4m3-t7's chalkboards: index = screen index (0 is Screen 1, which has none). Answers yellow, the 2 left over blue. */
import type { ChalkMark } from '../../../chalk'
import { write, box, arrow, span, cross, ring, person } from '../../../chalk'
import { q, warn } from './t5'

type At = [number, string?]
type C = 'w' | 'y' | 'b' | 'r' | 'd'
// A van: a 70 × 44 body with two wheels, its top-left at (x, y). Six vans at x 30 · 110 · … · 430, y 120; slot 7 at x 512.
const VX = [30, 110, 190, 270, 350, 430], VY = 120
const van = (at: At, x: number, c: C = 'w'): ChalkMark => ({ beat: at[0], at: at[1], c,
  d: `M${x} ${VY} h70 v44 h-70 Z M${x + 8} ${VY + 44} a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M${x + 48} ${VY + 44} a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0` })
const four = (at: At, x: number) => write(at, '4', x + 35, VY + 22, 28)
const vans = (at: At, from = 0) => VX.slice(from).flatMap(x => [van(at, x), four(at, x)])
const two = (at: At, c: C = 'b') => [person(at, 532, 160, 38, 0.25, c), person(at, 562, 160, 38, 0.25, c)]

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // It does not come out even
  [
    write([0, '26'], '26 ÷ 4 =', 200, 80, 36), write([0, '6'], '6', 300, 80, 36), write([0, 'left'], '2 left over', 440, 80, 30, 'b'),
    write([1, 'order'], '6 vans and 2 left over?', 300, 180, 28, 'r'), write([1, 'Not'], 'not a number of vans', 300, 230, 24, 'd'),
    ring([2, '2'], 440, 80, 95, 28, 'y'), write([2, 'means'], 'what does the 2 mean?', 300, 320, 30, 'y'),
  ],
  // The big idea: divide, then the question decides
  [
    write([0, 'Divide'], '26 ÷ 4 = 6, 2 left over', 300, 45, 28),
    box([0, 'question'], 200, 85, 200, 50), write([0, 'question'], 'the question', 300, 110, 26),
    ...q([110, 300, 490].map(x => arrow([0, 'leftover'], [300, 140], [x, 215], 'd'))),
    write([0, 'add'], 'one more group', 110, 250, 24, 'y'), write([0, 'leave'], 'leave it out', 300, 250, 24, 'y'),
    write([0, 'answer'], "it's the answer", 480, 250, 24, 'y'),
  ],
  // Fill the vans
  [
    write([0, 'vans'], '4 children in each van', 300, 50, 26, 'd'), van([0, 'vans'], VX[0]), four([0, '4'], VX[0]),
    ...q(vans([1, '6'], 1)), span([1, '24'], 30, 500, 215), write([1, '24'], '24 children', 265, 255, 28),
    ...two([2, '2']), write([2, 'waiting'], '2 left', 547, 100, 22, 'b'),
  ],
  // Read the question
  [
    ...q([...vans([0, 'Now']), ...two([0, 'Now'])]),
    write([0, 'How'], 'How many vans do they need?', 300, 50, 26, 'd'),
    van([1, 'van'], 512, 'y'),
    write([2, '7'], '6 + 1 = 7 vans', 300, 260, 36, 'y'),
  ],
  // Three kinds of questions
  [
    ...q(write([0, 'So'], '26 ÷ 4 = 6, 2 left over', 300, 45, 26, 'd')),
    write([0, 'answer'], 'vans needed?', 220, 115, 28), write([0, '7'], '7', 470, 115, 36, 'y'),
    write([1, 'full'], 'vans full?', 220, 185, 28), write([1, '6'], '6', 470, 185, 36, 'y'),
    write([1, 'children'], 'children left over?', 220, 255, 28), write([1, '2'], '2', 470, 255, 36, 'y'),
    ring([2, 'three'], 470, 185, 34, 105, 'y'), write([2, 'question'], 'the question decides', 300, 355, 30),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'COPY'], '26 ÷ 4 = 6', 170, 170, 30), arrow([1, 'down'], [260, 170], [350, 170], 'r'),
    write([1, '6'], '6 vans', 430, 170, 32, 'r'), cross([1, '6'], 370, 150, 120, 40),
    write([2, 'behind'], '2 children left behind', 300, 235, 26, 'r'),
    write([2, 'Read'], 'read the question', 300, 295, 28, 'd'), write([2, 'decide'], '7 vans', 300, 350, 38, 'y'),
  ],
]
