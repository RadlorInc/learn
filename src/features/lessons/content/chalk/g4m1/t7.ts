/** g4m1-t7's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, arrow, cross, span } from '../../../chalk'
import { q, warn, type At } from './t5'

/** A number line from x 80 to 520 with a tick and a dim label at each of `labels` (evenly spread). */
const numline = (at: At, y: number, labels: string[]): ChalkMark[] => {
  const x = (i: number) => 80 + (440 * i) / (labels.length - 1)
  return q([
    { ...line(at, [[60, y], [540, y]], 'd'), d: `M60 ${y} H540` + labels.map((_, i) => ` M${x(i)} ${y - 10} v20`).join('') },
    ...labels.map((t, i) => write(at, t, x(i), y + 32, 22, 'd')),
  ])
}
/** A dot on a number line. */
const dot = (at: At, x: number, y: number, c: ChalkColor = 'w'): ChalkMark => ring(at, x, y, 5, 5, c)
const tick = (at: At, x: number, y: number): ChalkMark => line(at, [[x, y], [x + 12, y + 14], [x + 36, y - 20]], 'b')

// Colours: white = the numbers Maya has, yellow = a round number and the round answer, coral = the slip and the warning,
// blue = the check that came out close.
export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Doing it again is slow
  [
    write([0, 'add'], '4,875 + 2,960 =', 230, 70, 34), write([0, 'add'], '6,835', 445, 70, 34),
    write([0, 'again'], 'add it again?', 300, 130, 26, 'd'),
    ring([1, 'slipped'], 445, 70, 56, 28, 'd'), write([1, 'twice'], 'same slip, twice', 300, 210, 30, 'r'),
    write([2, 'quicker'], 'a quicker check', 300, 310, 36),
  ],
  // The big idea: round, do the round math, check if far
  [
    write([0, 'Round'], '4,875', 130, 55, 30), arrow([0, 'Round'], [180, 55], [250, 55], 'd'), write([0, 'Round'], '5,000', 310, 55, 30, 'y'),
    write([0, 'number'], '2,960', 130, 105, 30), arrow([0, 'number'], [180, 105], [250, 105], 'd'), write([0, 'number'], '3,000', 310, 105, 30, 'y'),
    write([0, 'math'], '5,000 + 3,000 = 8,000', 300, 165, 30, 'y'),
    ...numline([0, 'answer'], 280, ['6,000', '7,000', '8,000', '9,000']),
    ring([0, 'that'], 373, 280, 8, 8, 'y'),
    dot([0, 'answer'], 202, 280, 'r'), write([0, 'answer'], '6,835', 202, 250, 22, 'r'),
    span([0, 'far'], 202, 373, 205, 'r'),
    write([0, 'check'], 'check!', 470, 205, 28, 'r'),
  ],
  // Round each number
  [
    write([0, 'thousand'], 'nearest thousand', 300, 35, 26, 'd'),
    ...numline([1, '4,875'], 120, ['4,000', '4,500', '5,000']), dot([1, '4,875'], 465, 120), write([1, '4,875'], '4,875', 450, 85, 24),
    arrow([1, 'closer'], [470, 108], [512, 108], 'y'), ring([1, '5,000'], 520, 152, 36, 18, 'y'),
    ...numline([2, '2,960'], 270, ['2,000', '2,500', '3,000']), dot([2, '2,960'], 502, 270), write([2, '2,960'], '2,960', 470, 235, 24),
    ring([2, '3,000'], 520, 302, 36, 18, 'y'),
  ],
  // Add the round numbers
  [
    write([0, 'round'], '5,000', 330, 80, 44, 'y'), write([0, 'numbers'], '+', 200, 140, 44), write([0, 'numbers'], '3,000', 330, 140, 44, 'y'),
    line([1, '5,000'], [[180, 172], [410, 172]]), write([1, '8,000'], '8,000', 330, 215, 44, 'y'),
  ],
  // Compare
  [
    ...numline([0, 'compare'], 220, ['6,000', '7,000', '8,000', '9,000']),
    dot([0, '6,835'], 202, 220, 'r'), write([0, '6,835'], '6,835', 202, 180, 26, 'r'),
    ring([0, '8,000'], 373, 252, 36, 18, 'y'),
    span([1, 'more'], 202, 373, 120, 'r'), write([1, 'away'], 'more than 1,000 away', 288, 75, 26, 'r'),
    dot([2, '7,835'], 349, 220), write([2, '7,835'], '7,835', 340, 180, 26),
    tick([2, 'close'], 390, 185),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'CHOP'], '4,875', 110, 160, 32), arrow([1, 'CHOP'], [160, 160], [220, 160], 'r'), write([1, '4,000'], '4,000', 270, 160, 32, 'r'),
    cross([1, '4,000'], 235, 138, 72, 44),
    write([1, 'closer'], 'closer to 5,000', 460, 160, 28, 'y'),
    write([2, 'both'], '4,000 + 2,000 = 6,000', 300, 245, 32, 'r'),
    write([2, 'fine'], '6,835 looks fine?', 300, 315, 30, 'r'),
  ],
]
