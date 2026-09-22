/** g7m1-t8's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The guess and the real count as bars to scale (1 bean = 8 px); yellow is the gap and the answer, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, box, cells, wash, cross, span } from '../../../chalk'
import { warn } from './t5'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
/** The guess (45) on top at y, the real count (50) 60 px below, from x = 100. */
const bars = (at: At, y: number): ChalkMark[] => [
  q(write(at, 'guess', 55, y + 20, 20, 'd')), q(box(at, 100, y, 360, 40)), q(write(at, '45', 280, y + 20, 26)),
  q(write(at, 'real', 55, y + 80, 20, 'd')), q(box(at, 100, y + 60, 400, 40)), q(write(at, '50', 300, y + 80, 26)),
]
const gap = (at: At, y: number): ChalkMark => wash(at, 460, y, 40, 40, 'y')

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // 5 off is not always close
  [
    ...bars([0], 40), gap([0, '5'], 40), write([0, 'off'], '5 off', 545, 60, 24, 'y'),
    write([1, 'good'], 'good?', 300, 185, 30, 'd'),
    write([2, '50,'], '5 out of 50', 160, 245, 28), write([2, 'close'], 'close', 160, 290, 28, 'y'),
    write([2, '10,'], '5 out of 10', 440, 245, 28), write([2, 'way'], 'way off', 440, 290, 28, 'r'),
    write([3, 'alone'], 'the gap alone is not enough', 300, 350, 26, 'd'),
  ],
  // The big idea
  [
    ...bars([0, 'guess'], 40), gap([0, 'far'], 40),
    write([0, 'real'], 'real', 545, 120, 24, 'b'),
    write([0, '100'], 'gap ÷ real × 100', 300, 250, 36, 'y'),
  ],
  // How far off?
  [
    ...bars([0], 40), gap([0, 'gap'], 40),
    write([1, '50'], '50 − 45 =', 270, 200, 34), write([1, '5,'], '5', 370, 200, 34, 'y'),
    write([2, '55'], '55 − 50 =', 270, 270, 34, 'b'), write([2, 'still'], '5', 370, 270, 34, 'y'),
    write([3, 'side'], 'how far, not which side', 300, 345, 26, 'd'),
  ],
  // Compare to the real amount
  [
    wash([0, 'gap'], 100, 230, 40, 45, 'y'), write([0, 'gap'], 'gap', 60, 252, 22, 'y'), q(write([0, 'gap'], '5', 120, 252, 22, 'y')),
    q(write([0, 'real'], 'real', 55, 95, 20, 'd')), box([0, 'real'], 100, 70, 400, 50), q(write([0, 'real'], '50', 300, 45, 26)),
    cells([1, 'Cut'], 100, 70, 400, 50, 10),
    ...Array.from({ length: 10 }, (_, i) => q(write([1, 'pieces'], '5', 120 + i * 40, 95, 22, 'b'))),
    span([1, 'Ten'], 100, 500, 150, 'b'), write([1, 'Ten'], '10 pieces', 300, 185, 22, 'b'),
    write([2, 'one'], '1 piece out of 10', 400, 252, 28),
    write([2, '5'], '5 ÷ 50 =', 250, 320, 36), write([2, '0.1'], '0.1', 360, 320, 36, 'y'),
  ],
  // Make it a percent
  [
    write([0, 'step'], '5 ÷ 50 = 0.1', 300, 60, 28, 'd'),
    write([1, '100'], '× 100', 300, 140, 36, 'b'),
    write([2, '0.1'], '0.1 × 100 =', 270, 230, 36), write([2, '10,'], '10', 395, 230, 36, 'y'),
    write([2, 'off'], 'your guess: 10% off', 300, 320, 38, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'GUESS'], '5 ÷ 45', 300, 150, 38, 'r'), cross([1, 'checked'], 230, 130, 140, 40),
    write([1, 'stick'], 'the guess is being checked', 300, 205, 24, 'd'),
    write([2, 'real'], 'divide by the real count', 300, 265, 26, 'd'),
    write([2, '10%'], '5 ÷ 50 × 100 = 10%', 300, 325, 38, 'y'),
  ],
]
