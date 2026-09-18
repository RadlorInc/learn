/** g5m1-t8's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, box, cells, arrow, span, cross, ring, clock } from '../../../chalk'

type At = [number, string]
const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))
/** A number digit by digit in its columns, ones at `ones`, 36 apart; `rtl` writes the ones first, the way it is worked out. */
const num = (at: At, n: string, ones: number, y: number, c: ChalkColor = 'w', s = 40, rtl = false): ChalkMark[] => {
  const ms = [...n].map((d, i) => write(at, d, ones - (n.length - 1 - i) * 36, y, s, c))
  return rtl ? ms.reverse() : ms
}
const warn = (at: At, cx = 300): ChalkMark[] => [line(at, [[cx, 15], [cx + 35, 75], [cx - 35, 75], [cx, 15]], 'r'), write(at, '!', cx, 52, 30, 'r')]
const tick = (at: At, x: number, y: number): ChalkMark => line(at, [[x, y], [x + 12, y + 14], [x + 36, y - 20]], 'b')

// Colours: the tens part (20) yellow, the ones part (6) blue, on every screen.
export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two digits this time
  [
    write([0, '115'], '115', 130, 90, 40, 'y'), write([0, 'digit'], '× one digit', 290, 90, 30), tick([0, 'digit'], 395, 90),
    write([1, '26'], '115 × 26', 300, 190, 40), ring([1, 'digits'], 360, 190, 28, 26, 'r'), write([1, 'digits'], '2 digits', 490, 190, 26, 'r'),
    write([1, 'adding'], '115 + 115 + 115 + ...', 300, 270, 26),
    span([1, 'twenty-six'], 163, 437, 305, 'd'), write([1, 'twenty-six'], '26 times', 300, 335, 24, 'd'),
    clock([1, 'long'], 530, 300, 26),
  ],
  // The big idea
  [
    write([0, 'number'], '26', 300, 45, 36),
    box([0, 'tens'], 60, 80, 340, 60, 'y'), write([0, 'tens'], '20', 230, 110, 30, 'y'), write([0, 'tens'], 'tens', 230, 160, 22, 'd'),
    box([0, 'ones'], 400, 80, 140, 60, 'b'), write([0, 'ones'], '6', 470, 110, 30, 'b'), write([0, 'ones'], 'ones', 470, 160, 22, 'd'),
    ...q([write([1, 'each'], '× 115', 230, 205, 26), write([1, 'each'], '× 115', 470, 205, 26)]),
    box([1, 'add'], 195, 245, 70, 44, 'y'), write([1, 'add'], '+', 350, 267, 32), box([1, 'add'], 435, 245, 70, 44, 'b'),
    write([1, 'answers'], '= total', 350, 330, 30),
  ],
  // Break 26 apart
  [
    ...q([write([0, '26'], '2', 282, 60, 48, 'y'), write([0, '26'], '6', 318, 60, 48, 'b')]),
    arrow([0, 'tens'], [278, 88], [200, 118], 'y'), write([0, 'tens'], '2 tens', 170, 140, 28, 'y'),
    arrow([0, 'ones'], [322, 88], [400, 118], 'b'), write([0, 'ones'], '6 ones', 430, 140, 28, 'b'),
    write([1, 'boxes'], '26 boxes', 300, 180, 22, 'd'),
    cells([1, '20'], 40, 200, 400, 36, 20, 'y'), write([1, '20'], '20 boxes', 240, 258, 24, 'y'),
    cells([1, '6'], 450, 200, 120, 36, 6, 'b'), write([1, '6'], '6 boxes', 510, 258, 24, 'b'),
    write([1, '115'], 'each box: 115 books', 300, 320, 28),
  ],
  // Multiply by each part
  [
    { beat: 0, at: 'Start', d: 'M60 70 h480 v60 h-480 Z M400 70 v60', c: 'w', quick: true },
    ...q([write([0, 'Start'], '20', 230, 45, 26, 'y'), write([0, 'Start'], '6', 470, 45, 26, 'b'), write([0, 'Start'], '115', 33, 100, 26)]),
    write([0, '115'], '115 × 2 = 230', 300, 165, 28, 'd'),
    write([1, '10'], '20 = 10 × 2', 300, 210, 24, 'd'),
    write([1, '115'], '115 × 20', 240, 265, 30, 'y'),
    arrow([1, 'much'], [440, 178], [440, 248], 'd'), write([1, 'much'], '× 10', 488, 213, 26, 'd'),
    write([1, '2,300'], '= 2,300', 367, 265, 30, 'y'), write([1, '2,300'], '2,300', 230, 100, 30, 'y'),
    write([2, '6'], '115 × 6', 255, 330, 30, 'b'), write([2, '690'], '= 690', 360, 330, 30, 'b'), write([2, '690'], '690', 470, 100, 28, 'b'),
  ],
  // Add the two answers: in columns
  [
    ...num([0, '2,300'], '2300', 380, 70, 'y'),
    write([0, '690'], '+', 236, 125, 40), ...num([0, '690'], '690', 380, 125, 'b'),
    line([0, '2,990'], [[222, 152], [400, 152]]), ...num([0, '2,990'], '2990', 380, 195, 'w', 40, true),
    write([1, '115'], '115 × 26', 232, 280, 34), write([1, '2,990'], '= 2,990', 376, 280, 34, 'y'),
    write([1, 'books'], '2,990 books', 300, 345, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'slip']),
    write([1, '2'], '115 × 2', 420, 160, 34, 'r'),
    ...q([write([1, 'tens'], '2', 140, 170, 44, 'y'), write([1, 'tens'], '6', 176, 170, 44)]),
    ring([1, 'tens'], 140, 170, 18, 26, 'y'), write([1, 'tens'], 'tens', 140, 118, 22, 'd'),
    cross([1, 'place'], 355, 138, 130, 44),
    write([2, '20'], '2 tens = 20', 158, 250, 30, 'y'), write([2, '115'], '115 × 20', 420, 250, 34, 'y'),
  ],
]
