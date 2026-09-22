/** g7m4-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Sticks drawn 50 to a centimeter. White is the long stick, blue the two short ones, yellow a yes, coral a no. */
import type { ChalkMark } from '../../../chalk'
import { write, line, span, cross } from '../../../chalk'

type At = [number, string?]
const K = 50
/** A stick lying flat from x, `cm` long, with its length written under it. */
const flat = (at: At, x: number, y: number, cm: number, c: 'w' | 'b' = 'w', labelUp = false): ChalkMark[] => [
  line(at, [[x, y], [x + cm * K, y]], c, 6),
  write(at, `${cm} cm`, x + (cm * K) / 2, labelUp ? y - 26 : y + 30, 22, c === 'b' ? 'b' : 'd'),
]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Some sets do not close: 3 and 4 stood up on the ends of 9
  [
    write([0, 'three'], '3 cm,  4 cm,  9 cm', 300, 50, 30), write([0, 'triangle'], '?', 440, 50, 34, 'y'),
    ...flat([1, '9'], 75, 330, 9),
    line([1, 'two'], [[75, 330], [150, 200]], 'b', 6), write([1, 'two'], '3 cm', 66, 255, 22, 'b'),
    line([1, 'two'], [[525, 330], [425, 157]], 'b', 6), write([1, 'two'], '4 cm', 512, 235, 22, 'b'),
    write([2, 'reach'], "they can't meet", 290, 190, 26, 'r'),
  ],
  // The big idea: short + short must beat the longest
  [
    line([0, 'triangle'], [[240, 170], [360, 170], [283, 100], [240, 170]], 'y'),
    line([0, 'shorter'], [[150, 250], [294, 250]], 'b', 6), line([0, 'shorter'], [[306, 250], [500, 250]], 'b', 6),
    write([0, 'shorter'], 'short + short', 325, 222, 22, 'b'),
    line([0, 'longest'], [[150, 310], [450, 310]], 'w', 6), write([0, 'longest'], 'longest', 300, 340, 22, 'd'),
    line([0, 'longest'], [[450, 262], [450, 298]], 'y', 2), line([0, 'longest'], [[500, 262], [500, 310]], 'y', 2),
    write([0, 'longest'], 'more', 475, 360, 24, 'y'),
  ],
  // Lay them flat
  [
    ...flat([0, 'Why'], 75, 290, 9),
    line([0, 'flat'], [[75, 240], [225, 240]], 'b', 6), write([0, 'flat'], '3 cm', 150, 214, 22, 'b'),
    line([0, 'flat'], [[325, 240], [525, 240]], 'b', 6), write([0, 'flat'], '4 cm', 425, 214, 22, 'b'),
    write([1, '7'], '3 + 4 = 7', 300, 60, 36),
    write([2, 'less'], '7 < 9', 490, 60, 32, 'r'),
    span([2, 'gap'], 225, 325, 150, 'r'), write([2, 'gap'], '2 cm gap', 275, 118, 24, 'r'),
  ],
  // When it works: 3, 4, 5
  [
    ...flat([0, '5'], 175, 330, 5),
    write([1, '7'], '3 + 4 = 7', 170, 60, 34), write([1, 'more'], '7 > 5', 430, 60, 34, 'y'),
    line([2, 'lift'], [[175, 330], [265, 210]], 'b', 6), line([2, 'lift'], [[425, 330], [265, 210]], 'b', 6),
    write([2, 'lift'], '3 cm', 190, 260, 22, 'b'), write([2, 'lift'], '4 cm', 375, 260, 22, 'b'),
    write([2, 'point'], 'a triangle', 265, 165, 26, 'y'),
  ],
  // Just enough is not enough: 3, 4, 7
  [
    write([0, 'Try'], '3 cm,  4 cm,  7 cm', 300, 50, 28),
    write([1, '7'], '3 + 4 = 7', 300, 110, 34),
    ...flat([1, 'flat'], 125, 290, 7),
    line([1, 'flat'], [[125, 240], [271, 240]], 'b', 6), line([1, 'flat'], [[279, 240], [475, 240]], 'b', 6),
    write([1, 'flat'], '3 cm', 200, 214, 22, 'b'), write([1, 'flat'], '4 cm', 375, 214, 22, 'b'),
    write([2, 'Flat'], 'flat, not a triangle', 260, 360, 26, 'r'), write([2, 'no'], 'so no', 450, 360, 30, 'r'),
  ],
  // One thing not to do
  [
    line([0, 'mix'], [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write([0, 'mix'], '!', 300, 68, 36, 'r'),
    write([1, '9'], '9 + 3 = 12 > 4', 270, 160, 34), write([1, 'nothing'], 'so yes', 470, 160, 30, 'r'), cross([1, 'nothing'], 430, 142, 80, 38),
    write([2, 'shorter'], '3 + 4 = 7', 300, 250, 38, 'y'),
    write([2, 'longest'], '7 is less than 9, so no', 300, 310, 28, 'y'),
  ],
]
