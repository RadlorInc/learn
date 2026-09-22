/** g7m3-t7's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: white = the working and the number line, blue = the negatives / what is done to both sides,
 *  yellow = the turned sign and the answer, coral = the sign that no longer holds. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, ring, cross, hop } from '../../../chalk'
import { q, warn } from '../g5m1/t17'

type At = [beat: number, at?: string]

/** A number line −6..6 from x = 60 to 540 at height y (40 per step). */
const nx = (n: number) => 300 + 40 * n
const numline = (at: At, y: number): ChalkMark[] => [
  q({ ...line(at, [[40, y], [560, y]]), d: `M40 ${y} H560` + Array.from({ length: 13 }, (_, i) => ` M${nx(i - 6)} ${y} v10`).join('') }),
  ...Array.from({ length: 13 }, (_, i) => q(write(at, String(i - 6).replace('-', '−'), nx(i - 6), y + 32, 20, 'd'))),
]
const dot = (at: At, n: number, y: number, c: ChalkColor = 'y'): ChalkMark => ({ ...ring(at, nx(n), y, 3, 3, c), w: 9 })
const open = (at: At, n: number, y: number, c: ChalkColor = 'y'): ChalkMark => ({ ...ring(at, nx(n), y, 9, 9, c), w: 4 })
const ray = (at: At, n: number, y: number): ChalkMark => ({ ...arrow(at, [nx(n) + 12, y], [575, y], 'y'), w: 6 })
const check = (at: At, x: number, y: number): ChalkMark => line(at, [[x - 14, y], [x - 3, y + 13], [x + 18, y - 14]], 'y', 5)

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // The order turned around
  [
    write([0, 'Find'], '2 < 5', 300, 45, 34),
    ...numline([0, 'Find'], 280), dot([0, 'Find'], 2, 280, 'w'), dot([0, 'Find'], 5, 280, 'w'),
    dot([0, 'line.'], -2, 280, 'b'), dot([0, 'line.'], -5, 280, 'b'),
    hop([1, 'right'], nx(-5), nx(-2), 262, 'y'), write([1, 'bigger'], '−2 is bigger', 440, 195, 30, 'y'),
    write([2, 'true?'], '−2 < −5', 170, 115, 38, 'r'), cross([2, 'No.'], 105, 108, 130, 14),
    write([3, 'around.'], '−2 > −5', 430, 115, 38, 'y'),
  ],
  // The big idea: × or ÷ a negative, and the sign turns around
  [
    q(write([0, 'multiply'], '2', 240, 70, 48)), q(write([0, 'multiply'], '<', 300, 70, 48)), write([0, 'multiply'], '5', 360, 70, 48),
    arrow([0, 'negative'], [300, 105], [300, 185], 'b'), write([0, 'negative'], '× or ÷ a negative', 450, 145, 26, 'b'),
    q(write([0, 'flip'], '−2', 222, 230, 48)), q(write([0, 'flip'], '>', 300, 230, 48, 'y')), write([0, 'flip'], '−5', 378, 230, 48),
    ring([0, 'around.'], 300, 230, 26, 30, 'y'), write([0, 'around.'], 'the sign turns around', 300, 320, 32, 'y'),
  ],
  // Divide by −3
  [
    q(write([0, 'Solve'], '−3x', 220, 60, 42)), q(write([0, 'Solve'], '<', 300, 60, 42)), write([0, 'Solve'], '12', 370, 60, 42),
    write([1, 'divide'], '÷ (−3)', 220, 115, 30, 'b'), write([1, 'both'], '÷ (−3)', 370, 115, 30, 'b'),
    line([1, 'sides'], [[150, 140], [430, 140]], 'd', 2.5),
    q(write([2, '4'], 'x', 220, 190, 42)), q(write([2, '4'], '?', 300, 190, 42, 'r')), write([2, '4'], '−4', 370, 190, 42, 'y'),
    ring([3, 'sign'], 300, 190, 24, 28, 'y'), write([3, 'point?'], '> or < ?', 300, 280, 36, 'y'),
  ],
  // Flip the sign
  [
    q(write([0, 'You'], '−3x', 220, 50, 40)), q(write([0, 'You'], '<', 300, 50, 40)), write([0, 'You'], '12', 370, 50, 40),
    q(write([0, 'You'], '÷ (−3)', 220, 100, 28, 'b')), write([0, 'You'], '÷ (−3)', 370, 100, 28, 'b'),
    line([0, 'You'], [[150, 124], [430, 124]], 'd', 2.5),
    ring([0, 'negative,'], 300, 50, 22, 26, 'r'),
    q(write([0, 'flips'], 'x', 220, 170, 42)), q(write([0, 'flips'], '>', 300, 170, 42, 'y')), write([0, 'flips'], '−4', 370, 170, 42),
    ring([1, 'gives'], 300, 170, 24, 28, 'y'),
    ...numline([1, 'Mark'], 290), open([1, 'open'], -4, 290), ray([1, 'arrow'], -4, 290),
  ],
  // Check two numbers
  [
    ...numline([0, 'Does'], 310), q(open([0, 'Does'], -4, 310)), q(ray([0, 'Does'], -4, 310)),
    dot([1, 'Try'], 0, 310, 'w'), write([1, '12.'], '−3 × 0 = 0 < 12', 210, 70, 32), check([1, 'True.'], 370, 70),
    dot([2, 'try'], -5, 310, 'r'), write([2, '15,'], '−3 × (−5) = 15', 210, 145, 32),
    write([2, 'not'], 'not less than 12', 460, 145, 24, 'r'),
    write([3, 'work.'], 'past −4: they work', 300, 220, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    q(write([1, 'sign'], '−3x', 220, 170, 40)), q(write([1, 'sign'], '<', 300, 170, 40)), write([1, 'sign'], '12', 370, 170, 40),
    write([2, 'gives'], 'x > −4', 430, 260, 40, 'y'),
    write([2, 'not'], 'x < −4', 170, 260, 40, 'r'), cross([2, 'not'], 105, 253, 130, 14),
  ],
]
