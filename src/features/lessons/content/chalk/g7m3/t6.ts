/** g7m3-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: white = the working and the number line, blue = what is done to both sides, yellow = the answers, coral = too few. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, ring, cross } from '../../../chalk'
import { q, warn } from '../g5m1/t17'

type At = [beat: number, at?: string]

/** A number line 0..10 from x = 60 to 540 at height y (48 per step). */
export const nx = (n: number) => 60 + 48 * n
const numline = (at: At, y: number): ChalkMark[] => [
  q({ ...line(at, [[40, y], [560, y]]), d: `M40 ${y} H560` + Array.from({ length: 11 }, (_, i) => ` M${nx(i)} ${y} v10`).join('') }),
  ...Array.from({ length: 11 }, (_, i) => q(write(at, String(i), nx(i), y + 32, 22, 'd'))),
]
/** A filled dot (a tiny ring drawn thick) and an open dot. */
const dot = (at: At, n: number, y: number, c: ChalkColor = 'y'): ChalkMark => ({ ...ring(at, nx(n), y, 3, 3, c), w: 9 })
const open = (at: At, n: number, y: number, c: ChalkColor = 'y'): ChalkMark => ({ ...ring(at, nx(n), y, 9, 9, c), w: 4 })
/** The answer arrow, from just past n to the right end. */
const ray = (at: At, n: number, y: number): ChalkMark => ({ ...arrow(at, [nx(n) + 12, y], [575, y], 'y'), w: 6 })

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Lots of answers
  [
    write([0, 'enough?'], '2x + 3 > 11', 300, 45, 36), ...numline([0, 'weeks'], 310),
    write([1, '13,'], '2 × 5 + 3 = 13', 250, 110, 32), write([1, 'more'], '> 11', 420, 110, 32, 'y'),
    dot([1, 'works.'], 5, 310),
    dot([2, '6,'], 6, 310), dot([2, '10,'], 10, 310), write([2, '100.'], '100 too', 520, 260, 24, 'y'),
    write([3, 'equation'], 'equation: 1 answer', 250, 175, 28, 'd'),
    write([3, 'many'], 'this: too many to list', 250, 220, 28, 'y'),
  ],
  // The big idea: solve like an equation, keep the sign, every number on one side
  [
    q(write([0, 'Solve'], '2x + 3', 190, 70, 44)), q(write([0, 'Solve'], '>', 300, 70, 44)), write([0, 'Solve'], '11', 390, 70, 44),
    write([0, 'equation'], 'solve it like =', 300, 140, 28, 'd'),
    ring([0, 'sign,'], 300, 70, 26, 30, 'y'), write([0, 'sign,'], 'keep it', 490, 70, 26, 'y'),
    q(line([0, 'answer'], [[40, 270], [560, 270]])),
    open([0, 'number'], 5, 270), ray([0, 'side'], 5, 270),
    write([0, 'side'], 'every number this side', 430, 225, 24, 'y'),
    write([0, 'end'], 'where you end up', 300, 320, 26, 'd'),
  ],
  // Take 3 off both sides
  [
    q(write([0, 'Start'], '2x + 3', 190, 60, 42)), q(write([0, 'Start'], '>', 300, 60, 42)), write([0, 'Start'], '11', 390, 60, 42),
    write([1, 'Take'], '− 3', 190, 115, 34, 'b'), write([1, 'both'], '− 3', 390, 115, 34, 'b'),
    line([1, 'sides.'], [[140, 142], [420, 142]], 'd', 2.5),
    q(write([1, 'becomes'], '2x', 190, 190, 42)), q(write([1, 'becomes'], '>', 300, 190, 42)), write([1, 'becomes'], '8', 390, 190, 42, 'y'),
    ring([2, 'sign'], 300, 60, 24, 28, 'y'), ring([2, 'sign'], 300, 190, 24, 28, 'y'),
    write([2, 'change.'], 'the sign stays', 300, 290, 34, 'y'),
  ],
  // Divide both sides by 2
  [
    q(write([0, 'Now'], '2x', 210, 55, 42)), q(write([0, 'Now'], '>', 300, 55, 42)), write([0, 'Now'], '8', 370, 55, 42),
    write([0, 'divide'], '÷ 2', 210, 108, 34, 'b'), write([0, 'sides'], '÷ 2', 370, 108, 34, 'b'),
    line([0, 'sides'], [[150, 133], [420, 133]], 'd', 2.5),
    q(write([1, 'so'], 'x', 210, 180, 42, 'y')), q(write([1, 'so'], '>', 300, 180, 42, 'y')), write([1, 'so'], '4', 370, 180, 42, 'y'),
    ...numline([2, 'number'], 290), open([2, 'open'], 4, 290),
  ],
  // Draw every answer
  [
    ...numline([0, 'Why'], 310), open([0, 'open,'], 4, 310, 'w'),
    write([1, '11,'], '2 × 4 + 3 = 11', 300, 50, 34),
    write([1, 'not'], '11 is not more than 11', 300, 105, 30, 'r'),
    write([2, 'out,'], '4 is out: open dot', 300, 165, 30, 'd'), open([2, 'out,'], 4, 310),
    ray([2, 'arrow'], 4, 310),
    write([3, 'That'], 'x > 4', 300, 235, 46, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'mean'], 'x > 4', 190, 160, 40), write([1, 'JUST'], 'just 5', 390, 160, 40, 'r'),
    cross([1, '5.'], 330, 138, 120, 44),
    ...numline([2, 'works,'], 300), open([2, 'works,'], 4, 300, 'w'),
    dot([2, 'works,'], 5, 300), dot([2, '6,'], 6, 300), write([2, '50,'], '50 too', 520, 250, 24, 'y'),
    ray([2, 'every'], 4, 300),
  ],
]
