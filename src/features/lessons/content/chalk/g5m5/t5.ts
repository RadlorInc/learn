/** g5m5-t5's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, cross } from '../../../chalk'
import { warn, tiles } from '../g3m4/t1'
// Colours across these boards: white = the rug and its cuts, blue = the small tiles / the leftover piece,
// yellow = the result (a whole square foot, the area), coral = the gap and the mix-up, dim = labels.
// Drawn to proportion: 1 foot = 120 px, so a half is 60 px and the rug (2 1/2 × 1 1/2 ft) is 300 × 180.

/** The half-foot cuts across a rug 5 halves long and 3 halves wide, top-left at (x, y). */
const downCuts = (x: number, y: number) => [1, 2, 3, 4].map(i => [[x + 60 * i, y], [x + 60 * i, y + 180]] as [number, number][])
const acrossCuts = (x: number, y: number) => [1, 2].map(i => [[x, y + 60 * i], [x + 300, y + 60 * i]] as [number, number][])

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Big tiles leave a gap
  [
    box([0, 'Try'], 150, 90, 300, 180),
    write([0, 'Try'], '2 1/2 ft', 300, 62, 24, 'd'), write([0, 'Try'], '1 1/2 ft', 92, 180, 24, 'd'),
    { ...box([1, 'Two'], 150, 90, 120, 120), quick: true }, box([1, 'Two'], 270, 90, 120, 120),
    write([1, 'Two'], '1 ft', 210, 150, 26), write([1, 'Two'], '1 ft', 330, 150, 26),
    { ...wash([1, 'half'], 390, 90, 60, 180, 'r'), quick: true }, wash([1, 'half'], 150, 210, 240, 60, 'r'), write([1, 'left'], '1/2 ft left', 420, 305, 26, 'r'),
    write([2, 'gap'], '?', 420, 180, 44, 'r'),
  ],
  // The big idea: halves, 4 small tiles = 1 square foot
  [
    box([0, 'foot'], 80, 110, 200, 200), write([0, 'foot'], '1 ft', 180, 340, 24, 'd'),
    line([0, 'halves'], [[180, 110], [180, 310]]), line([0, 'halves'], [[80, 210], [280, 210]]),
    write([0, 'halves'], '1/2', 130, 88, 22, 'd'), write([0, 'halves'], '1/2', 230, 88, 22, 'd'),
    ...([[130, 160], [230, 160], [130, 260], [230, 260]] as [number, number][]).map(([x, y], i) => ({ ...write([0, 'count'], String(i + 1), x, y, 30, 'b'), quick: true })),
    write([0, '4'], '4 small tiles', 450, 170, 30),
    write([0, 'square'], '= 1 square foot', 450, 240, 30, 'y'),
  ],
  // Cut every foot in half
  [
    box([0, 'cut'], 150, 110, 300, 180),
    ...downCuts(150, 110).map(p => ({ ...line([1, 'top'], p), quick: true })), write([1, '5'], '5 halves', 300, 82, 26, 'b'),
    ...acrossCuts(150, 110).map(p => ({ ...line([1, 'side'], p), quick: true })), write([1, '3'], '3 halves', 82, 200, 24, 'b'),
    wash([2, 'tiles'], 150, 110, 300, 180, 'b'),
    write([2, 'gap'], 'no gap', 525, 200, 28, 'y'),
  ],
  // How big is one small tile?
  [
    box([0, 'small'], 120, 90, 220, 220), line([0, 'small'], [[230, 90], [230, 310]]), line([0, 'small'], [[120, 200], [340, 200]]),
    wash([0, 'tile'], 120, 90, 110, 110, 'b'),
    write([1, '1/2'], '1/2 ft', 175, 68, 22, 'd'), write([1, 'side'], '1/2 ft', 72, 145, 22, 'd'),
    ...([[175, 145], [285, 145], [175, 255], [285, 255]] as [number, number][]).map(([x, y], i) => ({ ...write([2, '4'], String(i + 1), x, y, 30, 'b'), quick: true })),
    write([2, 'square'], '4 tiles = 1 square foot', 230, 350, 28),
    write([2, 'one'], '1 tile', 470, 170, 30, 'b'),
    write([2, '1/4'], '= 1/4', 470, 225, 34, 'y'), write([2, '1/4'], 'square foot', 470, 270, 26, 'y'),
  ],
  // Count, then make square feet
  [
    tiles([0, 'Count'], 60, 80, 3, 5, 60),
    write([1, '15'], '3 × 5 = 15', 480, 100, 30), write([1, 'tiles'], 'small tiles', 480, 140, 24, 'd'),
    { ...box([2, '4'], 60, 80, 120, 120, 'y'), quick: true }, { ...box([2, '4'], 180, 80, 120, 120, 'y'), quick: true }, box([2, '4'], 60, 200, 240, 60, 'y'),
    { ...write([2, 'square'], '1', 90, 110, 30, 'y'), quick: true }, { ...write([2, 'square'], '2', 210, 110, 30, 'y'), quick: true }, write([2, 'square'], '3', 90, 230, 30, 'y'),
    wash([2, "that's"], 300, 80, 60, 180, 'b'), write([2, '15/4'], '= 15/4', 480, 205, 34),
    write([2, '3/4'], '3/4', 330, 290, 26, 'b'),
    write([2, '3/4'], '= 3 3/4', 480, 260, 36, 'y'), write([2, 'feet'], 'square feet', 480, 305, 26, 'y'),
    write([3, 'same'], '5/2 × 3/2', 300, 360, 30),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '15'], '15 square feet', 300, 160, 36), cross([1, 'NOT'], 180, 138, 240, 44),
    write([2, 'tile'], '1 tile = 1/4 square foot', 300, 240, 30, 'b'),
    write([2, 'rug'], '15 tiles = 3 3/4 square feet', 300, 320, 32, 'y'),
  ],
]
