/** g5m1-t6's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, wash, arrow, cross, ring } from '../../../chalk'

type At = [number, string?]
type C = 'w' | 'y' | 'b' | 'r' | 'd'
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
/** A small cup, 44 wide and `h` tall, top-left at (x, y). */
const cup = (at: At, x: number, y: number, h = 50, c: C = 'w'): ChalkMark =>
  ({ ...line(at, [[x, y], [x + 6, y + h], [x + 38, y + h], [x + 44, y]], c), quick: true })
/** A jug, top-left at (x, y): a box w × h with a handle on its right. */
const jug = (at: At, x: number, y: number, w: number, h: number, c: C = 'w'): ChalkMark =>
  ({ beat: at[0], at: at[1], c, d: `M${x} ${y} L${x} ${y + h} L${x + w} ${y + h} L${x + w} ${y} M${x + w} ${y + h * 0.2} Q${x + w + 35} ${y + h * 0.2} ${x + w + 35} ${y + h * 0.5} Q${x + w + 35} ${y + h * 0.8} ${x + w} ${y + h * 0.8}` })

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two different units
  [
    jug([0, 'jug'], 80, 80, 100, 120), write([0, 'liters'], '2 L', 130, 145, 34, 'y'),
    cup([0, 'cups'], 398, 130, 70), write([0, 'milliliters'], '250 mL', 420, 230, 30, 'b'),
    write([1, 'divide'], '2 ÷ 250', 300, 290, 30, 'r'), cross([1, 'Not'], 240, 270, 120, 40),
    ring([1, 'different'], 130, 145, 40, 26, 'y'), ring([1, 'different'], 420, 230, 62, 24, 'b'),
    write([1, 'units'], 'different units', 300, 350, 30, 'r'),
  ],
  // The big idea
  [
    write([0, 'Change'], '1.', 50, 90, 32, 'd'),
    write([0, 'Change'], 'L', 130, 90, 36, 'y'), arrow([0, 'Change'], [155, 90], [215, 90]), write([0, 'Change'], 'mL', 250, 90, 36, 'b'),
    write([0, 'same'], 'same unit', 430, 90, 30, 'y'),
    write([0, 'solve'], '2.', 50, 200, 32, 'd'), write([0, 'solve'], 'solve the story', 250, 200, 30),
    line([0, 'step'], [[90, 330], [90, 300], [160, 300], [160, 270], [230, 270], [230, 240], [300, 240]]),
    write([0, 'step'], 'one step at a time', 440, 290, 28),
  ],
  // First, the same unit
  [
    write([0, '1'], '1 L', 100, 60, 32, 'y'), write([0, '1,000'], '= 1,000 mL', 240, 60, 32, 'b'),
    jug([0, 'jug'], 60, 140, 100, 140),
    line([1, '2'], [[60, 210], [160, 210]], 'd', 2),
    { ...write([1, '2'], '1,000 mL', 110, 175, 20, 'b'), quick: true }, write([1, '2'], '1,000 mL', 110, 245, 20, 'b'),
    write([1, '2'], '2 × 1,000', 400, 180, 34), write([1, '2,000'], '= 2,000 mL', 400, 235, 34, 'b'),
    cup([2, 'cups'], 240, 300, 60), write([2, 'cups'], '250 mL', 262, 380, 20, 'b'),
    write([2, 'milliliters'], 'both in mL', 440, 335, 30, 'y'),
  ],
  // Then, how many cups
  [
    ...[60, 120, 180, 240].map(x => cup([0, '4'], x, 60, 60)),
    ...[82, 142, 202, 262].map(x => ({ ...write([0, '250'], '250', x, 138, 20, 'b'), quick: true })),
    line([0, '1,000'], [[60, 160], [284, 160]], 'y'), write([0, '1,000'], '1,000 mL', 172, 188, 26, 'y'),
    ...[320, 380, 440, 500].map(x => cup([1, 'two'], x, 60, 60)),
    ...[342, 402, 462, 522].map(x => ({ ...write([1, 'two'], '250', x, 138, 20, 'b'), quick: true })),
    line([1, 'thousands'], [[320, 160], [544, 160]], 'y'), write([1, 'thousands'], '1,000 mL', 432, 188, 26, 'y'),
    write([1, '2'], '2 × 4 = 8', 270, 265, 36), write([1, 'cups'], 'cups', 410, 267, 30, 'y'),
    write([2, '2,000'], '2,000 ÷ 250', 250, 345, 36), write([2, 'asks'], '= 8', 410, 345, 36, 'y'),
  ],
  // Check the answer
  [
    write([0, 'check'], 'check:', 70, 45, 24, 'd'),
    ...[40, 106, 172, 238, 304, 370, 436, 502].map(x => cup([0, '8'], x, 80, 50)),
    ...[62, 128, 194, 260, 326, 392, 458, 524].map(x => ({ ...write([0, '250'], '250', x, 150, 20, 'b'), quick: true })),
    write([0, '2,000'], '8 × 250 = 2,000 mL', 300, 210, 32),
    write([1, '2'], '= 2 L', 300, 260, 32, 'y'),
    jug([1, 'jug'], 60, 295, 80, 85), wash([1, 'jug'], 60, 295, 80, 85, 'b'), write([1, 'jug'], 'whole jug', 250, 337, 28),
    write([1, 'nothing'], '0 left over', 440, 337, 28, 'd'),
    line([2, '8'], [[40, 172], [546, 172]], 'y'), write([2, 'cups'], '8 cups', 520, 42, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'math'], '2 L ÷ 250 mL', 300, 170, 34, 'r'), cross([1, 'units'], 190, 150, 220, 40),
    write([2, '2'], '2 L', 110, 260, 34, 'y'), arrow([2, 'into'], [150, 260], [220, 260]), write([2, '2,000'], '2,000 mL', 300, 260, 34, 'b'),
    write([2, 'divide'], '2,000 ÷ 250 = 8', 300, 340, 34, 'y'),
  ],
]
