/** g7m1-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Prices as bars drawn to scale ($1 = 16 px); yellow is the change and the answer, blue the choice, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, box, cells, wash, cross } from '../../../chalk'
import { warn } from './t5'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
/** Last year's $20 (y) and this year's $25 (y + 70), from x = 110. */
const bars = (at: At, y: number): ChalkMark[] => [
  q(write(at, 'before', 60, y + 25, 20, 'd')), q(box(at, 110, y, 320, 50)), q(write(at, '$20', 270, y + 25, 28)),
  q(write(at, 'after', 60, y + 95, 20, 'd')), q(box(at, 110, y + 70, 400, 50)), q(write(at, '$20', 270, y + 95, 28)),
  q({ ...box(at, 430, y + 70, 80, 50), c: 'd' }), q(write(at, '$25', 555, y + 95, 26)),
]
const extra = (at: At, y: number): ChalkMark[] => [wash(at, 430, y + 70, 80, 50, 'y'), write(at, '$5', 470, y + 95, 28, 'y')]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // $5 out of what?
  [
    ...bars([0], 40), ...extra([0, '$5'], 40),
    write([1, 'compares'], 'compare to what?', 300, 225, 26, 'd'),
    write([2, 'old'], '$5 out of $20 ?', 160, 290, 28, 'b'),
    write([2, 'new'], '$5 out of $25 ?', 440, 290, 28, 'b'),
    write([3, 'different'], '≠', 300, 290, 36, 'r'),
  ],
  // The big idea
  [
    ...bars([0, 'Find'], 40), ...extra([0, 'change'], 40),
    write([0, 'original'], 'original', 500, 65, 24, 'b'),
    write([0, '100'], 'change ÷ original × 100', 300, 290, 32, 'y'),
  ],
  // Find the change
  [
    ...bars([0, 'Start'], 40),
    write([1, '$25'], '$25 − $20 =', 270, 250, 34), write([1, '$5'], '$5', 410, 250, 34, 'y'),
    ...extra([2, 'piece'], 40), write([2, 'added'], 'added on', 470, 185, 22, 'y'),
  ],
  // Compare to the original
  [
    q(write([0, 'hold'], 'last year', 270, 45, 22, 'd')), box([0, 'hold'], 110, 70, 320, 60), q(write([0, 'hold'], '$20', 70, 100, 28)),
    wash([0, '$5'], 470, 70, 80, 60, 'y'), write([0, '$5'], '$5', 510, 100, 28, 'y'),
    cells([1, 'fit'], 110, 70, 320, 60, 4),
    ...[150, 230, 310, 390].map(x => q(write([1, 'Four'], '$5', x, 150, 24, 'b'))),
    write([1, 'Four'], '4 pieces', 270, 190, 24, 'b'),
    write([2, 'one'], '1 piece out of 4', 300, 250, 28),
    write([2, '5'], '5 ÷ 20 =', 250, 320, 36), write([2, '0.25'], '0.25', 365, 320, 36, 'y'),
  ],
  // Make it a percent
  [
    write([0, 'move'], '5 ÷ 20 = 0.25', 300, 60, 28, 'd'),
    write([1, '100'], '× 100', 300, 140, 36, 'b'),
    write([2, '0.25'], '0.25 × 100 =', 270, 230, 36), write([2, '25'], '25', 418, 230, 36, 'y'),
    write([2, 'up'], 'went up 25%', 300, 320, 42, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'NEW'], 'new price', 300, 135, 24, 'r'),
    write([1, '20%'], '5 ÷ 25 × 100 = 20%', 300, 185, 34, 'r'), cross([1, 'small'], 150, 165, 300, 40),
    write([2, 'started'], 'the price you started with', 300, 260, 24, 'd'),
    write([2, '25%'], '5 ÷ 20 × 100 = 25%', 300, 320, 38, 'y'),
  ],
]
