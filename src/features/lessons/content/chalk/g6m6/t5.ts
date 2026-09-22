/** g6m6-t5's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, cells, arrow, cross } from '../../../chalk'
import { block, DX, DY } from '../g5m5/t1'
import { warn, tick, type At } from '../g3m1/t1'
// Colours across these boards: white = the chest, blue = the pieces it is filled or cut into (1-foot cubes, half feet),
// yellow = the result, coral = the gap and the mix-up, dim = sizes.
// The chest is 2 1/2 ft long, 2 ft deep, 1 1/2 ft tall, always drawn to that proportion (a half foot is half a foot).

/** The chest, (x, y) its front bottom-left corner, `u` px to a foot. */
const chest = (at: At, x: number, y: number, u: number) => block(at, x, y, 2.5, 2, 1.5, u, 'w', false)

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Whole cubes do not fit
  [
    chest([0], 110, 330, 90),
    write([0], '2 1/2 ft', 222, 355, 22, 'd'), write([0], '1 1/2 ft', 58, 262, 22, 'd'), write([0], '2 ft', 412, 318, 22, 'd'),
    block([0, 'cubes'], 110, 330, 1, 1, 1, 90, 'b'),
    block([1, '2'], 200, 330, 1, 1, 1, 90, 'b'),
    wash([1, 'half'], 290, 240, 45, 90, 'r'), write([1, 'left'], '1/2 ft', 312, 382, 22, 'r'),
    write([2, 'gap'], '?', 312, 285, 36, 'r'),
    write([2, 'No'], "doesn't fit", 510, 180, 26, 'r'),
    write([3, 'miss'], 'space missed', 510, 240, 24, 'r'),
  ],
  // The big idea: length × width × height, fractions too
  [
    chest([0, 'Multiply'], 100, 280, 80),
    write([0, 'length'], 'length', 200, 305, 24, 'd'),
    write([0, 'width'], 'width', 405, 272, 24, 'd'),
    write([0, 'height'], 'height', 55, 220, 24, 'd'),
    write([0, 'fractions'], 'fractions too', 300, 360, 32, 'y'),
  ],
  // Write each edge as a fraction
  [
    write([0, 'Mixed'], '2 1/2', 70, 80, 30), write([0, 'Mixed'], '1 1/2', 70, 160, 30),
    cells([1, 'half'], 130, 60, 200, 40, 5, 'b'), write([1, '5/2'], '= 5/2', 385, 80, 32, 'b'),
    cells([2, 'half'], 130, 140, 120, 40, 3, 'b'), write([2, '3/2'], '= 3/2', 305, 160, 32, 'b'),
    chest([3, 'chest'], 220, 360, 60),
    write([3, 'edges'], '5/2 ft', 295, 382, 22, 'd'), write([3, 'edges'], '3/2 ft', 170, 315, 22, 'd'), write([3, 'edges'], '2 ft', 452, 352, 22, 'd'),
  ],
  // Multiply one step at a time
  [
    chest([0, 'Now'], 200, 350, 60),
    write([0, 'Now'], '5/2 ft', 275, 372, 20, 'd'), write([0, 'Now'], '3/2 ft', 132, 305, 20, 'd'), write([0, 'Now'], '2 ft', 437, 335, 20, 'd'),
    { beat: 1, at: 'width', c: 'b', wash: true, d: `M200 350 H350 L${350 + 2 * DX * 60} ${350 + 2 * DY * 60} H${200 + 2 * DX * 60} Z` },
    write([1, '5/2'], '5/2 × 2', 200, 70, 32), write([1, '10/2'], '= 10/2', 320, 70, 32), write([1, '5'], '= 5', 415, 70, 32),
    arrow([2, 'height'], [180, 350], [180, 265], 'b'),
    write([2, '5'], '5 × 3/2', 220, 150, 32), write([2, '15/2'], '= 15/2', 345, 150, 32),
  ],
  // Back to a mixed number
  [
    write([0, '15/2'], '15/2', 300, 50, 30),
    cells([0, 'halves'], 45, 80, 510, 50, 15, 'b'),
    box([1, 'whole'], 45, 80, 68, 50, 'y'),
    ...[1, 2, 3, 4, 5, 6].map(k => ({ ...box([1, '14'], 45 + 68 * k, 80, 68, 50, 'y'), quick: true })),
    ...[0, 1, 2, 3, 4, 5, 6].map(k => ({ ...write([1, '7'], String(k + 1), 79 + 68 * k, 158, 26, 'y'), quick: true })),
    write([1, 'half'], '1/2', 538, 158, 24, 'b'), wash([1, 'left'], 521, 80, 34, 50, 'b'),
    write([2, '7'], '15/2 = 7 1/2', 300, 235, 36),
    write([2, 'cubic'], '7 1/2 cubic feet', 300, 315, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    box([1, 'DROP'], 60, 150, 175, 105), line([1, 'DROP'], [[200, 150], [200, 255]]), line([1, 'DROP'], [[60, 185], [200, 185]]),
    { ...wash([1, 'halves'], 200, 150, 35, 105, 'r'), quick: true }, wash([1, 'halves'], 60, 150, 140, 35, 'r'),
    write([2, 'only'], '2 × 2 × 1 = 4', 430, 200, 32, 'r'), cross([2, 'leaves'], 322, 178, 216, 44),
    write([2, 'chunk'], 'left out', 148, 285, 24, 'r'),
    write([3, 'Keep'], '5/2 × 2 × 3/2 = 7 1/2', 290, 345, 32, 'y'), tick([3, 'Keep'], 482, 345),
  ],
]
