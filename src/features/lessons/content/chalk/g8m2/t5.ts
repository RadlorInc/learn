/** g8m2-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A level scale (a tray beam on a triangle) with each side written on its half; the working goes under it.
 *  Blue is what comes off both sides, yellow the result, coral the mix-up, dim the old line. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross } from '../../../chalk'
import { warn } from '../g7m1/t1'
import { q } from './t1'

type At = [number, string?]
/** A level scale centred on cx with its beam at y; `left` and `right` written on the two halves at size s. */
const scale = (at: At, cx: number, y: number, left: string, right: string, s = 36, c: ChalkColor = 'w'): ChalkMark[] => [
  line(at, [[cx - 230, y - 16], [cx - 222, y], [cx + 222, y], [cx + 230, y - 16]], 'd'),
  line(at, [[cx, y], [cx - 28, y + 46], [cx + 28, y + 46], [cx, y]], 'd'),
  q(write(at, left, cx - 130, y - 30, s, c)), q(write(at, right, cx + 130, y - 30, s, c)),
]
/** The x centre of character i of text t written centred on cx at size s. */
const chr = (t: string, cx: number, s: number, i: number) => cx - ([...t].length * s * 0.5) / 2 + s * 0.5 * (i + 0.5)

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // x on both sides
  [
    write([0, 'Before'], '2x + 1 = 9', 300, 45, 30, 'd'), write([0, 'one'], 'x on one side', 300, 90, 24, 'd'),
    ...scale([1, 'bags'], 300, 200, '5x + 2', '3x + 10'),
    ring([1, 'both'], chr('5x + 2', 170, 36, 0.5), 170, 26, 24, 'b'), ring([1, 'both'], chr('3x + 10', 430, 36, 0.5), 170, 26, 24, 'b'),
    write([1, 'Which'], 'undo which first?', 300, 290, 28, 'y'),
    write([2, 'still'], 'x still on both sides', 300, 355, 28, 'r'),
  ],
  // The big idea: take the smaller x part off both sides
  [
    ...scale([0], 300, 170, '5x + 2', '3x + 10'),
    ring([0, 'smaller'], chr('3x + 10', 430, 36, 0.5), 140, 26, 24, 'b'),
    write([0, 'off'], '− 3x', 170, 240, 30, 'b'), write([0, 'off'], '− 3x', 430, 240, 30, 'b'),
    write([0, 'one'], 'x on one side', 300, 310, 32, 'y'),
    write([0, 'solve'], 'then solve what is left', 300, 365, 24, 'd'),
  ],
  // Take 3 bags off both sides
  [
    ...scale([0], 300, 150, '5x + 2', '3x + 10'),
    ring([0, 'fewer'], chr('3x + 10', 430, 36, 0.5), 120, 26, 24, 'b'),
    write([0, 'off'], '− 3x', 170, 220, 30, 'b'), write([0, 'off'], '− 3x', 430, 220, 30, 'b'),
    write([1, 'level'], 'still level', 300, 270, 24, 'd'),
    write([2, 'leaves'], '5x − 3x = 2x', 300, 315, 30),
    write([2, 'reads'], '2x + 2 = 10', 300, 368, 36, 'y'),
  ],
  // Solve what is left
  [
    write([0, 'Now'], '2x + 2 = 10', 300, 50, 36),
    write([1, 'off'], '− 2', chr('2x + 2 = 10', 300, 36, 2.5), 100, 30, 'b'), write([1, 'off'], '− 2', chr('2x + 2 = 10', 300, 36, 9.5), 100, 30, 'b'),
    write([1, '8'], '2x = 8', 300, 160, 36),
    write([2, 'Split'], '÷ 2', chr('2x = 8', 300, 36, 0.5), 210, 30, 'b'), write([2, 'Split'], '÷ 2', chr('2x = 8', 300, 36, 5), 210, 30, 'b'),
    write([2, 'holds'], '1 bag = 4 marbles', 300, 275, 30),
    write([2, 'so'], 'x = 4', 300, 345, 44, 'y'),
  ],
  // Check both sides
  [
    q(write([0], '5x + 2 = 3x + 10', 300, 45, 28, 'd')),
    write([0, 'Put'], 'x = 4', 300, 95, 30, 'y'),
    write([1, 'Left'], '5 × 4 + 2', 160, 160, 32), write([1, '22'], '= 22', 160, 210, 36, 'y'),
    write([1, 'Right'], '3 × 4 + 10', 440, 160, 32), write([1, '10'], '= 22', 440, 210, 36, 'y'),
    ...scale([2, 'scale'], 300, 320, '22', '22', 36, 'y'),
    ring([2, 'right'], 300, 95, 56, 24, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'makes'], '5x + 3x → 8x', 300, 145, 34, 'r'), cross([1, 'tips'], 432, 127, 36, 36),
    write([2, 'Take'], '5x + 2 = 3x + 10', 300, 235, 32),
    write([2, 'BOTH'], '− 3x', chr('5x + 2 = 3x + 10', 300, 32, 2.5), 282, 26, 'b'),
    write([2, 'BOTH'], '− 3x', chr('5x + 2 = 3x + 10', 300, 32, 12), 282, 26, 'b'),
    write([2, 'becomes'], '2x + 2 = 10', 300, 345, 38, 'y'),
  ],
]
