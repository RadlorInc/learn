/** g4m3-t8's chalkboards: index = screen index (0 is Screen 1, which has none). What we find yellow, the 38 sold blue. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cells, wash, arrow, span, cross, ring } from '../../../chalk'
import { q, warn } from './t5'

type At = [number, string?]
// The 4 boxes of 25: cells x 60–540. The 100 pencils as one bar, x 60–540, the 38 sold its first 182 px.
const boxes = (at: At, y: number, h: number, s = 32): ChalkMark[] => [
  cells(at, 60, y, 480, h, 4), ...q([120, 240, 360, 480].map(x => write(at, '25', x, y + h / 2, s))),
]

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two questions in one
  [
    write([0, '38'], '− 38 sold', 340, 120, 36, 'b'), write([0, 'Not'], '?', 200, 120, 56, 'y'),
    ring([1, 'what'], 200, 120, 34, 40, 'y'), write([1, 'never'], 'the story never says', 420, 210, 24, 'd'),
    arrow([2, 'hiding'], [215, 260], [205, 170], 'y'), write([2, 'hiding'], 'a hidden number', 260, 295, 34, 'y'),
  ],
  // The big idea: find the hidden number, then use it
  [
    box([0, 'hidden'], 60, 60, 160, 90, 'y'), write([0, 'hidden'], '?', 140, 105, 56, 'y'),
    write([0, 'first'], 'step 1: find it', 140, 200, 26, 'y'),
    arrow([0, 'use'], [230, 105], [350, 105], 'w'), write([0, 'answer'], 'step 2: use it', 450, 200, 26),
    box([0, 'question'], 360, 60, 180, 90), write([0, 'question'], 'the question', 450, 105, 26),
  ],
  // Step 1: the hidden number
  [
    write([0, 'Step'], 'step 1', 300, 40, 24, 'd'), ...boxes([0, '4'], 70, 70).map(m => ({ ...m, at: m.t ? '25' : '4' })),
    write([1, 'that'], '4 × 25 =', 260, 235, 40), write([1, '100'], '100', 385, 235, 40, 'y'),
    span([2, 'started'], 60, 540, 175, 'y'),
    write([2, 'pencils'], '100 pencils at the start', 300, 320, 30, 'y'),
  ],
  // Step 2: answer the question
  [
    write([0, 'Step'], 'step 2', 300, 40, 24, 'd'),
    box([0, '100'], 60, 80, 480, 70), write([0, '100'], '100 pencils', 300, 180, 26, 'y'),
    wash([1, '38'], 60, 80, 182, 70, 'b'), line([1, '38'], [[242, 80], [242, 150]], 'b'), write([1, 'sold'], '38 sold', 151, 115, 26, 'b'),
    write([1, '100'], '100 − 38 =', 260, 250, 36), write([1, '62'], '62', 395, 250, 36, 'y'),
    write([2, '62'], '62 left', 391, 115, 30, 'y'),
  ],
  // Check it makes sense
  [
    write([0, 'sense'], 'does 62 make sense?', 300, 40, 26, 'd'),
    write([1, '62'], '62 left', 391, 115, 30, 'y'), wash([1, '38'], 60, 80, 182, 70, 'b'), write([1, 'sold'], '38 sold', 151, 115, 26, 'b'),
    box([1, 'together'], 60, 80, 480, 70), line([1, 'together'], [[242, 80], [242, 150]], 'b'),
    write([1, '100'], '62 + 38 = 100', 300, 205, 36),
    ...boxes([2, 'boxes'], 250, 55, 26), write([2, 'fits'], 'it fits', 300, 355, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'STOP'], 'stop at 100', 300, 170, 32, 'r'), cross([1, 'one'], 200, 150, 200, 40),
    write([2, 'there'], '100 = pencils at the start', 300, 235, 28),
    write([2, 'left'], 'not the pencils left', 300, 280, 26, 'r'),
    write([2, 'Finish'], '100 − 38 = 62 left', 300, 345, 34, 'y'),
  ],
]
