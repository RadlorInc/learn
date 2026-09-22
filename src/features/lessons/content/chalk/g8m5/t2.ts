/** g8m5-t2's chalkboards (volume of a cone): index = screen index (0 is Screen 1, which has none).
 *  The cup on Screen 2 points down, as she holds it; from Screen 3 a cone stands on its circle, like the can beside it. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, arrow, cross, ring, wash } from '../../../chalk'
import { can, disc, warn } from './t1'

type At = [number, string?]
/** A cone standing on its circle: centre x, base y, tip y, half-width rx. */
const cone = (at: At, cx: number, base: number, tip: number, rx: number, ry = 20, c: ChalkColor = 'w'): ChalkMark[] =>
  [ring(at, cx, base, rx, ry, c), line(at, [[cx - rx, base], [cx, tip], [cx + rx, base]], c)]
/** The inside of that cone, washed in a colour (water). */
const fill = ([beat, at]: At, cx: number, base: number, tip: number, rx: number, c: ChalkColor = 'b'): ChalkMark =>
  ({ beat, at, c, wash: true, d: `M${cx - rx} ${base} L${cx} ${tip} L${cx + rx} ${base} Z` })

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // It gets narrow: the circles shrink to a point, so no one circle to stack
  [
    ring([0, 'cup'], 150, 80, 100, 26, 'w'), line([0, 'cup'], [[50, 80], [150, 330], [250, 80]]),
    ...([[142, 75, 20], [205, 50, 13], [268, 25, 7]] as const).map(([y, rx, ry]) => ({ ...ring([1, 'smaller'], 150, y, rx, ry, 'b'), quick: true })),
    disc([1, 'point'], 150, 330, 6, 6), write([1, 'shrink'], 'circles shrink', 440, 110, 28, 'b'),
    write([2, 'stack'], 'stack one circle?', 440, 190, 28), write([2, 'No'], 'no', 440, 245, 32, 'r'),
    write([3, 'different'], 'every layer different', 440, 320, 26, 'y'),
  ],
  // The big idea: a cone is 1/3 of the can with the same bottom and height
  [
    ...cone([0, 'cone'], 120, 320, 90, 80),
    ...can([0, 'cylinder'], 330, 90, 320, 80, 20, 'd'),
    ...cone([0, 'same'], 330, 320, 90, 80, 20, 'y'),
    write([0, '1/3'], '1/3', 510, 160, 44, 'y'),
    write([0, 'divide'], '÷ 3', 510, 250, 40, 'y'),
  ],
  // Pour it in: one cone fills a third of the cylinder, 3 cones fill it
  [
    ...cone([0, 'Try'], 110, 300, 120, 60, 16),
    fill([1, 'Fill'], 110, 300, 120, 60),
    arrow([1, 'pour'], [185, 170], [300, 170], 'b'),
    ...can([1, 'cylinder'], 390, 120, 300, 60, 16),
    wash([2, 'third'], 330, 240, 120, 60, 'b'), line([2, 'third'], [[330, 240], [450, 240]], 'b'),
    write([2, 'third'], '1/3 full', 243, 215, 24, 'b'),
    wash([3, '3'], 330, 180, 120, 60, 'b'), line([3, '3'], [[330, 180], [450, 180]], 'b'),
    wash([3, 'fill'], 330, 120, 120, 60, 'b'),
    write([3, 'fill'], '3 cones fill it', 300, 365, 30, 'y'),
  ],
  // Find the cylinder first: 3.14 × 3 × 3 × 4 = 113.04
  [
    ...cone([0, 'cone'], 480, 150, 50, 40, 10, 'd'),
    ...can([1, 'cylinder'], 150, 110, 310, 80, 20),
    line([1, 'bottom'], [[150, 310], [230, 310]], 'b'), write([1, 'bottom'], '3 cm', 190, 355, 24, 'b'),
    line([1, 'height'], [[255, 110], [255, 310]], 'b'), write([1, 'height'], '4 cm', 292, 210, 24, 'b'),
    write([2, '3.14'], '3.14 × 3 × 3', 450, 220, 30), write([2, 'height'], '× 4', 450, 270, 30, 'b'),
    write([3, '113.04'], '= 113.04 cubic cm', 440, 335, 28, 'y'),
  ],
  // Take one third: 113.04 ÷ 3 = 37.68
  [
    ...cone([0, 'cone'], 130, 310, 100, 80),
    write([1, 'third'], '1/3 of 113.04', 420, 100, 30),
    write([2, 'divide'], '113.04 ÷ 3', 420, 180, 32), write([2, '37.68'], '= 37.68', 420, 235, 32, 'y'),
    fill([3, 'cup'], 130, 310, 100, 80), write([3, 'holds'], '37.68 cubic cm', 420, 325, 32, 'y'),
  ],
  // One thing not to do: stopping at the cylinder crossed; divide by 3
  [
    ...warn([0, 'mix']),
    write([1, 'STOP'], 'cup = 113.04', 300, 160, 32, 'r'), cross([1, 'cylinder'], 190, 118, 220, 84),
    write([2, 'divide'], 'cup = 113.04 ÷ 3', 300, 250, 32, 'y'), write([2, 'end'], '= 37.68', 300, 310, 32, 'y'),
  ],
]
