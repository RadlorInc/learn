/** g7m1-t7's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The shop's $20 as a bar; the 40% added on is the yellow piece at its end; coral is the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, box, cells, wash, cross, span } from '../../../chalk'
import { warn } from './t5'

const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not $60
  [
    q(box([0], 100, 50, 240, 50)), q(write([0], '$20', 220, 75, 28)),
    write([0, '40'], '+ 40%', 430, 75, 32, 'y'),
    write([1, 'mean'], '$20 + $40', 300, 160, 34, 'r'), cross([1, 'No'], 210, 140, 180, 40),
    write([2, '100'], 'out of 100', 300, 218, 26, 'd'), cells([2, '100'], 100, 240, 400, 45, 10),
    wash([3, '$40'], 100, 240, 160, 45, 'y'), write([3, '$40'], '$40', 180, 305, 26, 'y'),
    write([3, 'paid'], '40% = $40 of every $100', 300, 352, 28, 'y'),
  ],
  // The big idea: the price, and the percent added on the end
  [
    write([0, 'price'], 'price', 250, 95, 24, 'd'), box([0, 'price'], 100, 120, 300, 60), write([0, 'price'], '$20', 250, 150, 30),
    wash([0, 'add'], 400, 120, 120, 60, 'y'), box([0, 'add'], 400, 120, 120, 60, 'y'), write([0, 'add'], '+ 40%', 460, 150, 26, 'y'),
    span([0, 'on'], 100, 520, 215, 'y'), write([0, 'on'], 'tag', 310, 250, 30, 'y'),
  ],
  // Find the extra
  [
    q(write([0], '$20', 60, 115, 26)), q(box([0], 100, 90, 400, 50)),
    write([0, 'extra'], 'extra = ?', 300, 45, 26, 'd'),
    cells([1, '10%'], 100, 90, 400, 50, 10),
    ...Array.from({ length: 10 }, (_, i) => q(write([1, '$2'], '$2', 120 + i * 40, 115, 22, 'b'))),
    write([1, '$2'], '10% of $20 = $2', 300, 200, 30),
    wash([2, 'four'], 100, 90, 160, 50, 'y'),
    write([2, '4'], '4 × $2 =', 270, 280, 36), write([2, '$8'], '$8', 380, 280, 36, 'y'),
  ],
  // Add it on
  [
    q(box([0, 'add'], 100, 90, 320, 60)), q(write([0, 'add'], '$20', 260, 120, 30)),
    wash([0, 'extra'], 420, 90, 128, 60, 'y'), box([0, 'extra'], 420, 90, 128, 60, 'y'), write([0, 'extra'], '$8', 484, 120, 30, 'y'),
    write([0, 'paid'], 'shop paid', 260, 65, 22, 'd'),
    write([1, '$20'], '$20 + $8 =', 255, 230, 36), span([1, '$28'], 100, 548, 175, 'y'), write([1, '$28'], '$28', 402, 230, 36, 'y'),
    box([2, 'tag'], 225, 285, 150, 70, 'y'), write([2, 'tag'], '$28', 300, 320, 38, 'y'),
  ],
  // One step instead of two
  [
    q(box([1, '$20'], 100, 80, 300, 60)), q(write([1, '$20'], '$20', 250, 110, 30)),
    write([1, '100%'], '100%', 250, 165, 26, 'b'),
    wash([1, '40%'], 400, 80, 120, 60, 'y'), box([1, '40%'], 400, 80, 120, 60, 'y'), write([1, '40%'], '40%', 460, 165, 26, 'y'),
    span([2, '140%'], 100, 520, 55, 'y'), write([2, '140%'], '140%', 310, 26, 28, 'y'),
    write([3, '1.4'], '140% = 1.4', 300, 235, 32),
    write([3, 'so'], '1.4 × $20 =', 270, 310, 36), write([3, '$28'], '$28', 412, 310, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '$8'], 'tag = $8', 300, 155, 36, 'r'), cross([1, 'only'], 220, 135, 160, 40),
    write([1, 'extra'], 'only the extra', 300, 210, 24, 'd'),
    write([2, '$28'], '$20 + $8 = $28', 300, 290, 42, 'y'),
  ],
]
