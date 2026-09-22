/** g6m4-t3's chalkboards: index = screen index (0 is Screen 1, which has none). Colours as t1. */
import type { ChalkMark } from '../../../chalk'
import { write, box, wash, cells, span, cross, ring } from '../../../chalk'
import { warn, tick } from '../g3m1/t1'
import { q, type At } from './t1'

// The whole as a tape of 10 equal parts, 48 wide, x 60–540. `mid(k)` is the centre of part k (0–9), `end(k)` its right edge.
const mid = (k: number) => 84 + 48 * k, end = (k: number) => 108 + 48 * k
const tape = (at: At, y: number, h = 60): ChalkMark => cells(at, 60, y, 480, h, 10)
const inParts = (at: At, t: string, y: number, s = 20, c: 'w' | 'd' | 'b' = 'w'): ChalkMark[] =>
  q(Array.from({ length: 10 }, (_, k) => write(at, t, mid(k), y, s, c)))

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not out of 100
  [
    write([0, 'means'], '30% = 30 out of 100', 300, 50, 32),
    box([1, '100'], 60, 100, 480, 45), write([1, '100'], '$100', 300, 122, 26, 'd'),
    write([1, '30'], '30% of $100 = $30', 300, 180, 30),
    box([2, '80'], 60, 225, 384, 45), write([2, '80'], '$80', 252, 247, 26, 'd'),
    write([2, 'take'], '30% of $80 =', 270, 310, 30), write([2, 'that'], '?', 400, 310, 40, 'y'),
  ],
  // The big idea: 10 parts of 10%, take what the percent needs
  [
    write([0, 'whole'], 'the whole', 300, 70, 26, 'd'), box([0, 'whole'], 60, 110, 480, 60),
    tape([0, '10'], 110), ...inParts([0, 'worth'], '10%', 140),
    wash([0, 'take'], 60, 110, 144, 60, 'b'), span([0, 'many'], 60, 204, 205, 'y'),
    write([0, 'needs'], '30% = take 3 parts', 300, 270, 32, 'y'),
  ],
  // Cut into 10 parts
  [
    write([0, '80'], '$80', 300, 40, 30), span([0, '80'], 60, 540, 75),
    tape([0, '10'], 100), write([1, '80'], '80 ÷ 10 = 8', 300, 240, 34),
    ...inParts([1, 'so'], '$8', 130, 22),
    ring([2, 'One'], mid(0), 130, 24, 34, 'b'), ...inParts([2, 'is'], '10%', 185, 20, 'd'),
    write([2, 'so'], '10% of $80 = $8', 300, 320, 36, 'y'),
  ],
  // Take 3 parts
  [
    tape([0, '30%'], 80), ...inParts([0, '30%'], '$8', 110, 22),
    wash([0, '3'], 60, 80, 144, 60, 'b'), write([0, 'parts'], '30% = 3 parts', 300, 250, 30, 'b'),
    write([1, '8'], '8', end(0), 175, 28), write([1, '16'], '16', end(1), 175, 28), write([1, '24'], '24', end(2), 175, 28, 'y'),
    write([1, '24'], '3 × $8 = $24', 300, 320, 36, 'y'),
  ],
  // Check the answer
  [
    write([0, '80'], '30% of $80', 240, 80, 38), write([0, 'is'], '= $24', 430, 80, 38, 'y'),
    write([0, 'shelter'], 'for the shelter', 300, 135, 24, 'd'),
    write([1, 'less'], '$24 < $30', 280, 240, 44), tick([1, 'Yes'], 420, 240),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '30'], '30% of $80 =', 250, 165, 36), write([1, 'DOLLARS'], '$30', 420, 165, 36, 'r'),
    cross([1, 'DOLLARS'], 385, 140, 70, 50),
    write([2, '100'], '$30 is 30% of $100', 300, 240, 28, 'd'),
    write([2, '24'], '30% of $80 = $24', 300, 320, 40, 'y'),
  ],
]
