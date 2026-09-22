/** g5m1-t20's chalkboards: index = screen index (0 is Screen 1, which has none). Seats per row blue, sold coral, empty yellow.
 *  The seat tape is 40..560 for 800 seats, so the 186 sold seats are the first 121 px (40..161). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, cells, arrow, span, cross, ring } from '../../../chalk'
import { q, warn } from './t17'

export const T20: (ChalkMark[] | undefined)[] = [
  undefined,
  // Three numbers, no sign yet
  [
    write([0, '32'], '32', 130, 70, 44), q(write([0, '32'], 'rows', 130, 115, 24, 'd')),
    write([0, '25'], '25', 300, 70, 44, 'b'), q(write([0, '25'], 'seats each', 300, 115, 24, 'd')),
    write([0, '186'], '186', 470, 70, 44, 'r'), q(write([0, '186'], 'sold', 470, 115, 24, 'd')),
    write([0, 'empty'], 'empty seats = ?', 300, 185, 34, 'y'),
    write([1, 'None'], 'none of them', 300, 245, 28, 'r'),
    write([1, 'sign'], '+ − × ÷ ?', 300, 300, 36, 'd'),
    write([1, 'different'], 'a different question', 300, 355, 28, 'r'),
  ],
  // The big idea
  [
    write([0, 'story'], 'the story', 300, 60, 24, 'd'), box([0, 'tape'], 60, 90, 480, 60),
    q(line([0, 'part'], [[360, 90], [360, 150]])), write([0, 'part'], 'part 1', 210, 120, 26, 'b'),
    arrow([0, 'time'], [250, 175], [410, 175], 'b'), write([0, 'time'], 'part 2', 450, 120, 26, 'b'),
    line([0, 'check'], [[90, 250], [110, 270], [145, 225]], 'y'),
    write([0, 'question'], 'what does the question ask?', 340, 250, 26, 'y'),
  ],
  // Part 1: all the seats
  [
    cells([0, '32'], 40, 110, 520, 50, 32), write([0, '32'], '32 rows', 300, 50, 28),
    arrow([0, '25'], [48, 165], [92, 198], 'b'), write([0, '25'], '1 row = 25 seats', 200, 212, 26, 'b'),
    write([1, '32'], '32 × 25 = 800', 300, 280, 40), ring([1, '800'], 400, 280, 36, 26, 'y'),
    span([1, 'theater'], 40, 560, 92, 'y'), write([1, 'seats'], '800 seats', 300, 350, 30, 'y'),
  ],
  // Part 2: take away the sold seats
  [
    box([0], 40, 90, 520, 60),
    line([0, '186'], [[161, 90], [161, 150]]), wash([0, '186'], 40, 90, 121, 60, 'r'), write([0, 'sold'], '186 sold', 100, 172, 22, 'r'),
    span([0, '800'], 40, 560, 62), write([0, '800'], '800 seats', 300, 30, 26),
    wash([1, 'empty'], 161, 90, 399, 60, 'y'), write([1, 'empty'], 'empty', 300, 120, 26, 'y'),
    cross([1, 'take'], 50, 95, 100, 50),
    write([1, '800'], '800 − 186 = 614', 300, 230, 40),
    write([1, '614'], '614', 470, 120, 30, 'y'), ring([1, '614'], 420, 230, 36, 26, 'y'),
  ],
  // Check what the question asks
  [
    write([0, 'question'], 'How many empty?', 300, 40, 30, 'y'), write([0, 'sold'], 'not sold', 300, 88, 26, 'r'),
    box([1, '614'], 161, 125, 399, 60, 'y'), write([1, '614'], '614 empty', 360, 155, 28, 'y'),
    box([1, '186'], 40, 125, 121, 60, 'r'), write([1, '186'], '186 sold', 100, 155, 22, 'r'),
    span([1, '800'], 40, 560, 210), write([1, '800'], '614 + 186 = 800', 300, 262, 36),
    write([2, '614'], '614 seats are empty', 300, 340, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'add'], '800 + 186', 170, 170, 36, 'r'), cross([1, 'seats'], 80, 150, 180, 40),
    box([2, 'part'], 40, 230, 520, 55), wash([2, 'part'], 40, 230, 121, 55, 'r'), line([2, 'part'], [[161, 230], [161, 285]]),
    write([2, 'part'], '186 sold', 100, 305, 22, 'r'), write([2, '800'], '800 seats', 300, 212, 24),
    cross([2, 'take'], 45, 235, 111, 45), write([2, 'away'], '800 − 186 = 614', 300, 355, 34, 'y'),
  ],
]
