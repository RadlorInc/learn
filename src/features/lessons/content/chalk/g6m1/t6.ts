/** g6m1-t6's chalkboards: index = screen index (0 is Screen 1, which has none). Equal boxes, the boys' blue, the girls'
 *  white; what one box holds and the answer are yellow, the wrong move coral. */
import type { ChalkMark } from '../../../chalk'
import { write, line, cells, wash, arrow, span, cross, ring } from '../../../chalk'
import { q, warn } from './t5'

/** `k` copies of `t` written into `k` cells of width `w` starting at x. */
const inCells = (at: [number, string?], t: string, x: number, w: number, k: number, y: number, c: 'w' | 'y' | 'b' = 'y'): ChalkMark[] =>
  Array.from({ length: k }, (_, i) => q(write(at, t, x + w * i + w / 2, y, 30, c)))
/** 30 little heads, three rows of 10. */
const heads = (at: [number, string?]): ChalkMark => ({ beat: at[0], at: at[1], c: 'w', w: 2.5,
  d: Array.from({ length: 30 }, (_, i) => { const x = 165 + (i % 10) * 30, y = 120 + Math.floor(i / 10) * 30
    return `M${x - 9} ${y} a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0` }).join(' ') })

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not 3 girls
  [
    write([0, '3'], '3 girls?', 260, 55, 34), write([0, 'No'], 'No', 380, 55, 34, 'r'),
    heads([1, '30']), write([1, 'students'], '30 students', 300, 225, 28),
    write([2, 'every'], 'every 2 boys', 170, 320, 28, 'b'), arrow([2, 'there'], [270, 320], [335, 320]), write([2, 'girls'], '3 girls', 420, 320, 28),
  ],
  // The big idea: add the parts to count the boxes, share the whole, find one box
  [
    cells([0, 'parts'], 100, 170, 160, 60, 2, 'b'), q(write([0, 'parts'], 'boys', 180, 145, 22, 'b')),
    cells([0, 'parts'], 260, 170, 240, 60, 3), q(write([0, 'parts'], 'girls', 380, 145, 22, 'd')),
    write([0, 'boxes'], '2 + 3 = 5 boxes', 300, 60, 32),
    span([0, 'whole'], 100, 500, 265), write([0, 'whole'], 'the whole', 300, 300, 26),
    wash([0, 'one'], 100, 170, 80, 60, 'y'), write([0, 'holds'], '?', 140, 200, 32, 'y'),
    write([0, 'holds'], 'one box = ?', 300, 355, 28, 'y'),
  ],
  // Draw the boxes
  [
    cells([0, '2'], 150, 95, 160, 50, 2, 'b'), write([0, 'boys'], 'boys', 80, 120, 26, 'b'),
    cells([0, '3'], 150, 195, 240, 50, 3), write([0, 'girls'], 'girls', 80, 220, 26),
    write([1, 'same'], 'the same in every box', 300, 320, 30, 'y'),
    ...inCells([1, 'number'], '?', 150, 80, 2, 120, 'y'), ...inCells([1, 'number'], '?', 150, 80, 3, 220, 'y'),
  ],
  // Share the 30 students
  [
    cells([0, 'boxes'], 90, 135, 168, 60, 2, 'b'), cells([0, 'boxes'], 258, 135, 252, 60, 3),
    q(write([0, 'boxes'], 'boys', 174, 215, 22, 'b')), q(write([0, 'boxes'], 'girls', 384, 215, 22, 'd')),
    write([0, '5'], '2 + 3 = 5 boxes', 300, 40, 30),
    span([1, '30'], 90, 510, 110), write([1, 'students'], '30 students', 300, 82, 24),
    write([2, '6'], '30 ÷ 5 = 6', 300, 290, 36), ...inCells([2, 'each'], '6', 90, 84, 5, 165),
    write([2, 'box'], '6 in each box', 300, 345, 28, 'y'),
  ],
  // Count the girls
  [
    write([0, 'girls'], 'girls', 85, 75, 26), cells([0, 'girls'], 150, 50, 252, 50, 3), ...inCells([0, '6'], '6', 150, 84, 3, 75, 'w'),
    write([1, '3'], '3 × 6 = 18', 290, 150, 34), write([1, 'girls'], '18 girls', 495, 75, 30, 'y'),
    write([2, 'boys'], 'boys', 85, 245, 26, 'b'), cells([2, 'boys'], 150, 220, 168, 50, 2, 'b'), ...inCells([2, 'boys'], '6', 150, 84, 2, 245, 'b'),
    write([2, '12'], '2 × 6 = 12', 450, 245, 30, 'b'),
    write([2, '30'], '12 + 18 = 30', 290, 330, 34), line([2, '30'], [[430, 330], [445, 345], [470, 310]], 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'divide'], '30 ÷ 3', 300, 160, 36, 'r'), cross([1, 'JUST'], 240, 140, 120, 42),
    write([1, 'boys'], 'the boys are left out', 300, 210, 24, 'r'),
    cells([2, '5'], 100, 245, 160, 45, 2, 'b'), cells([2, '5'], 260, 245, 240, 45, 3), write([2, 'boxes'], '5 boxes', 300, 312, 22, 'd'),
    write([2, '6'], '30 ÷ 5 = 6', 170, 360, 30, 'y'), write([2, '18'], '3 × 6 = 18', 430, 360, 30, 'y'), ring([2, '18'], 488, 360, 24, 22, 'y'),
  ],
]
