/** g7m5-t2's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A tape of 10 equal parts, 3 of them pizza: the sample's tape and the school's are the same tape at two sizes.
 *  Yellow = the pizza share and the prediction, coral = stopping at 12. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, cells, arrow, cross } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
/** Just the 9 cuts that split a bar into 10 equal parts. */
const cuts = ([beat, at]: At, x: number, y: number, w: number, h: number): ChalkMark =>
  ({ beat, at, c: 'w', d: Array.from({ length: 9 }, (_, i) => `M${x + (w * (i + 1)) / 10} ${y} v${h}`).join(' ') })
/** "60" in each of the 10 parts. */
const sixties = (at: At, x: number, y: number, w: number, c: 'y' | 'd' = 'y'): ChalkMark[] =>
  Array.from({ length: 10 }, (_, i) => ({ ...write(at, '60', x + (w * (i + 0.5)) / 10, y, 22, c), quick: true }))

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // It is not just 12: 12 of the 40 asked, and 600 in the school
  [
    box([0, '12'], 60, 70, 480, 50), wash([0, 'pizza'], 60, 70, 144, 50, 'y'), line([0, 'pizza'], [[204, 70], [204, 120]]),
    write([0, 'pizza'], '12 pizza', 132, 95, 24, 'y'), write([0, 'pizza'], '28 other', 372, 95, 24, 'd'),
    box([1, 'whole'], 60, 210, 480, 60), write([1, 'pizza'], '12?', 280, 240, 32, 'r'),
    cross([1, 'No'], 318, 224, 32, 32),
    write([2, '40'], 'you asked 40', 300, 150, 24, 'd'), write([2, '600'], 'the school: 600', 300, 300, 24, 'd'),
    write([2, 'Lots'], 'lots more pizza fans', 300, 355, 28, 'y'),
  ],
  // The big idea: the sample's tape and the school's tape, same share shaded
  [
    write([0, 'sample'], 'sample', 300, 60, 22, 'd'), cells([0, 'small'], 200, 80, 200, 36, 10),
    line([0, 'copy'], [[200, 124], [70, 226]], 'd'), line([0, 'copy'], [[400, 124], [530, 226]], 'd'),
    cells([0, 'whole'], 60, 235, 480, 56, 10), write([0, 'group'], 'whole group', 300, 320, 22, 'd'),
    wash([0, 'same'], 200, 80, 60, 36, 'y'), wash([0, 'same'], 60, 235, 144, 56, 'y'),
    write([0, 'fraction'], 'same fraction', 300, 365, 30, 'y'),
  ],
  // Find the fraction: 12/40 = 3/10, then 3 of every 10
  [
    write([0, '12'], '12/40', 190, 80, 40),
    write([1, 'Divide'], 'both ÷ 4', 190, 135, 24, 'd'),
    write([1, '3'], '= 3/10', 320, 80, 40, 'y'),
    cells([2, '10'], 100, 200, 400, 50, 10), wash([2, '3'], 100, 200, 120, 50, 'y'),
    write([2, 'every'], 'every 10 kids', 300, 280, 22, 'd'),
    write([2, 'pizza'], '3 of every 10 pick pizza', 300, 340, 28, 'y'),
  ],
  // Stretch it to 600: the same tape, 10 parts of 60
  [
    cells([0, 'Same'], 220, 50, 160, 26, 10), wash([0, 'Same'], 220, 50, 48, 26, 'd'), write([0, 'Same'], 'sample', 150, 63, 22, 'd'),
    arrow([0, 'bigger'], [300, 90], [300, 145], 'd'), box([0, 'bigger'], 40, 170, 520, 60),
    cuts([1, 'Split'], 40, 170, 520, 60), write([1, '600'], '600 students', 300, 260, 24, 'd'),
    write([2, '600'], '600 ÷ 10 =', 270, 330, 36), write([2, '60,'], '60', 385, 330, 36, 'y'),
    ...sixties([2, 'part'], 40, 200, 520),
  ],
  // Count the pizza parts: 3 × 60 = 180
  [
    cells([0, '3'], 40, 90, 520, 60, 10), ...sixties([0, '3'], 40, 120, 520, 'd'),
    wash([0, 'pizza'], 40, 90, 156, 60, 'y'), write([0, 'pizza'], 'pizza', 118, 70, 22, 'y'),
    write([1, '3'], '3 × 60', 250, 240, 36), write([1, '180'], '= 180', 365, 240, 36, 'y'),
    write([2, 'about'], 'about 180 of 600 pick pizza', 300, 330, 28, 'y'),
  ],
  // One thing not to do: 12 is the sample's count, 180 is the school's
  [
    ...warn([0, 'mix']),
    write([1, 'STOP'], '600 kids: 12 like pizza', 260, 150, 28, 'r'), cross([1, 'sample'], 440, 130, 40, 40),
    write([2, '40'], '12 out of 40 = 3/10', 300, 225, 28),
    write([2, '180'], '600 kids: about 180', 300, 300, 34, 'y'),
  ],
]
