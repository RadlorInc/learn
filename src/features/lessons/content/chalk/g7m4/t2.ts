/** g7m4-t2's chalkboards (circumference): index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, span, cross, ring, ticks } from '../../../chalk'

type At = [number, string?]
const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]
/** A small filled chalk dot. */
const dot = ([beat, at]: At, x: number, y: number, c: 'w' | 'y' | 'r' = 'r'): ChalkMark[] => {
  const d = `M${x - 7} ${y} a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0`
  return [{ beat, at, d, c, wash: true, quick: true }, { beat, at, d, c, quick: true }]
}
/** A short upright tick on a line at x. */
const tick = (at: At, x: number, y: number, c: 'w' | 'b' | 'y' = 'b'): ChalkMark => line(at, [[x, y - 12], [x, y + 12]], c)

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Across is not around: the line across, half of it, and the edge a ruler cannot follow
  [
    ring([0, 'line'], 170, 200, 120, 120, 'w'), line([0, 'across'], [[50, 200], [290, 200]]),
    write([0, 'diameter'], 'diameter', 440, 90, 28), write([0, '10'], '10 cm', 110, 182, 24),
    line([1, 'center'], [[170, 200], [170, 320]], 'b'), write([1, 'radius'], 'radius = half', 440, 150, 28, 'b'),
    ring([2, 'around'], 170, 200, 132, 132, 'y'), write([2, 'around'], 'around = ?', 440, 215, 28, 'y'),
    ticks([2, 'ruler'], 360, 300, 200, 10, 12, 'd'), write([2, 'ruler'], 'ruler', 460, 340, 22, 'd'),
    write([2, 'Not'], "can't bend", 460, 270, 24, 'r'),
  ],
  // The big idea: the edge unrolled is about 3.14 widths
  [
    ring([0, 'circle'], 120, 140, 70, 70, 'w'), line([0, 'circle'], [[50, 140], [190, 140]], 'b'),
    line([0, 'around'], [[40, 300], [480, 300]], 'y'), write([0, 'around'], 'around', 260, 340, 24, 'y'),
    tick([0, 'across'], 40, 300), tick([0, 'across'], 180, 300), tick([0, 'across'], 320, 300), tick([0, 'across'], 460, 300),
    write([0, 'across'], 'around ≈ 3.14 × across', 400, 140, 28, 'y'),
  ],
  // Roll it out: a spot on the wheel, one turn along the ground
  [
    line([0, 'Watch'], [[30, 300], [570, 300]], 'd'),
    ring([0, 'wheel'], 100, 240, 60, 60, 'w'), ...dot([0, 'spot'], 100, 300),
    arrow([0, 'roll'], [170, 160], [410, 160]), ring([0, 'turn'], 477, 240, 60, 60, 'w'), ...dot([0, 'turn'], 477, 300),
    line([1, 'track'], [[100, 300], [477, 300]], 'y', 6),
    write([1, 'around'], 'one turn = the distance around', 290, 350, 26, 'y'),
  ],
  // A little more than 3: the width fits 3 times and a bit
  [
    line([0, 'track'], [[40, 110], [480, 110]], 'y', 5), write([0, 'track'], 'the distance around', 260, 72, 22, 'd'),
    span([0, '10'], 40, 180, 170), write([0, '10'], '10 cm', 110, 202, 22, 'b'),
    span([1, 'whole'], 180, 320, 170), span([1, 'whole'], 320, 460, 170),
    write([1, 'whole'], '10 cm', 250, 202, 22, 'b'), write([1, 'whole'], '10 cm', 390, 202, 22, 'b'),
    ...['1', '2', '3'].map((n, i) => ({ ...write([1, '3'], n, 110 + 140 * i, 240, 30, 'b'), quick: true })),
    ring([1, 'piece'], 470, 110, 22, 22, 'r'), write([1, 'piece'], 'a bit more', 510, 60, 22, 'r'),
    write([2, 'every'], 'every circle', 300, 295, 24, 'd'),
    write([2, '3.14'], 'around ≈ 3.14 × across', 300, 345, 32, 'y'),
  ],
  // Multiply: 10 × 3.14 = 31.4
  [
    ring([0, 'across'], 130, 180, 90, 90, 'w'), line([0, 'across'], [[40, 180], [220, 180]], 'b'), write([0, '10'], '10 cm', 130, 162, 24, 'b'),
    write([1, '10'], '10 × 3.14', 410, 150, 34), write([1, '31.4'], '= 31.4', 410, 205, 34, 'y'),
    write([2, 'rolls'], 'rolls 31.4 cm in one turn', 300, 335, 30, 'y'),
  ],
  // One thing not to do: 5 × 3.14 crossed; double first
  [
    ...warn([0, 'mix']),
    ring([1, 'radius'], 110, 220, 70, 70, 'w'), line([1, 'radius'], [[110, 220], [180, 220]], 'b'), write([1, 'radius'], '5 cm', 145, 202, 22, 'b'),
    write([1, 'straight'], '5 × 3.14', 360, 150, 32, 'r'), cross([1, 'DOUBLE'], 440, 132, 36, 36),
    write([2, 'Double'], '5 × 2 = 10', 360, 235, 30), line([2, 'Double'], [[40, 220], [110, 220]], 'y'),
    write([2, '31.4'], '10 × 3.14 = 31.4 cm', 360, 310, 30, 'y'),
  ],
]
