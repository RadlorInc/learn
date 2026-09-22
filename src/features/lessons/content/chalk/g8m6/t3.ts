/** g8m6-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The study cloud with its line y = 5x + 50 (hours 0–8, scores 40–100) on the left; working on the right.
 *  Blue is the x put in, yellow the prediction and the start, coral the mix-up, dim the axes. */
import type { ChalkMark } from '../../../chalk'
import { write, arrow, cross, box, ring } from '../../../chalk'
import { warn } from '../g7m1/t1'
import { scatter } from './t1'

type At = [number, string?]
type Pt = [number, number]
const PTS: Pt[] = [[1, 51], [1, 59], [2, 56], [2, 64], [3, 61], [3, 69], [4, 66], [4, 74], [5, 71], [5, 79]]
const S = scatter(70, 320, 256, 260, 8, 40, 100)
const cloud = (at: At): ChalkMark[] => [...S.axes(at, [1, 2, 3, 4, 5, 6, 7, 8], [50, 70, 90], 'hours studied', 'score'), ...S.dots(at, PTS),
  S.seg(at, [0, 50], [8, 90])]
const C = 475
/** The x centre of character i of an n-character string centred on cx at size s (chalk letters are ~s/2 wide). */
const chr = (cx: number, s: number, i: number, n: number) => cx - (n * s * 0.5) / 2 + s * 0.5 * (i + 0.5)

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // No dot at 6 hours
  [
    ...cloud([0, 'Find']), S.seg([0, '6'], [6, 40], [6, 98], 'b'), write([0, '6'], '6 hours', C, 90, 30, 'b'),
    write([0, 'dot'], 'a dot?', C, 145, 30),
    write([1, 'Nobody'], 'nobody at 6', C, 200, 28, 'r'),
    write([2, 'guess'], 'guess? no', C, 260, 28), write([2, 'line'], 'use the line', C, 315, 30, 'y'),
  ],
  // The big idea: x in, the rule, y out
  [
    box([0, 'rule'], 180, 150, 240, 100), write([0, 'rule'], 'the line', 300, 125, 22, 'd'),
    write([0, 'x'], 'x', 90, 200, 44, 'b'), arrow([0, 'x'], [120, 200], [170, 200], 'b'),
    write([0, 'equation'], 'y = 5x + 50', 300, 200, 36),
    arrow([0, 'y'], [430, 200], [480, 200], 'y'), write([0, 'y'], 'y', 510, 200, 44, 'y'),
    write([0, 'prediction'], 'the prediction', 470, 270, 26, 'y'),
  ],
  // The line as an equation
  [
    ...cloud([0, 'Where']), ...S.dots([0, '50'], [[0, 50]], 'y', 6), write([0, '50'], 'starts at 50', C, 90, 28, 'y'),
    S.seg([1, 'climbs'], [0, 50], [1, 50], 'b'), S.seg([1, 'climbs'], [1, 50], [1, 55], 'y'),
    S.seg([1, 'every'], [1, 55], [2, 55], 'b'), S.seg([1, 'every'], [2, 55], [2, 60], 'y'),
    write([1, 'hour'], 'up 5 each hour', C, 150, 28),
    write([2, 'equation'], 'y = 5x + 50', C, 230, 38, 'y'),
  ],
  // Put in 6 hours
  [
    ...cloud([0, 'Maya']), write([0, 'Maya'], 'y = 5x + 50', C, 60, 28, 'd'),
    S.seg([0, 'x'], [6, 40], [6, 80], 'b'), write([0, 'x'], 'x = 6', C, 110, 30, 'b'),
    write([1, '5'], 'y = 5 × 6 + 50', C, 165, 28), write([1, '30'], '= 30 + 50', C, 215, 28),
    write([1, '80'], '= 80', C, 265, 34, 'y'),
    ...S.dots([2, 'predict'], [[6, 80]], 'y', 7), write([2, 'score'], 'Maya: about 80', C, 330, 28, 'y'),
  ],
  // What the numbers mean
  [
    write([0, 'numbers'], 'y = 5x + 50', 300, 70, 44),
    ring([1, '5'], chr(300, 44, 4, 11) - 5, 70, 16, 28, 'b'), arrow([1, 'more'], [chr(300, 44, 4, 11), 104], [170, 160], 'b'),
    write([1, 'more'], '5 more points', 150, 190, 28, 'b'), write([1, 'hour'], 'each extra hour', 150, 235, 26, 'b'),
    ring([2, '50'], chr(300, 44, 9.5, 11), 70, 31, 29, 'y'), arrow([2, 'starts'], [chr(300, 44, 9.5, 11), 104], [440, 160], 'y'),
    write([2, 'starts'], 'where it starts', 450, 190, 28, 'y'), write([2, 'score'], 'score at 0 hours', 450, 235, 26, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, "Don't"], 'y = 5 × 6 = 30', 300, 150, 36), cross([1, 'STOP'], 444, 132, 36, 36),
    write([1, 'extra'], 'only the extra points', 300, 205, 24, 'r'),
    write([2, 'Add'], 'y = 5 × 6 + 50', 300, 275, 36), write([2, '80'], '= 80', 300, 335, 38, 'y'),
  ],
]
