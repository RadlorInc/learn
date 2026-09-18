/** g5m1-t3's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring, hop } from '../../../chalk'

type At = [number, string?]
type C = 'w' | 'y' | 'b' | 'r' | 'd'
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
/** 10 with a small raised number: the base centred on x, the exponent up and to its right (the chalk face has no ² ³ ⁶). */
const pow = (at: At, e: string, x: number, y: number, s = 40, c: C = 'w', ce: C = 'y'): ChalkMark[] =>
  [write(at, '10', x, y, s, c), write(at, e, x + s * 0.72, y - s * 0.45, Math.max(20, Math.round(s * 0.6)), ce)]

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Zeros are hard to count
  [
    write([0, 'zeros'], '1,000,000', 300, 80, 44),
    write([0, 'glance'], '6 zeros?', 300, 130, 26, 'd'),
    write([1, 'write'], '10,000,000', 300, 210, 44, 'r'),
    write([1, 'many'], '7 zeros', 300, 260, 26, 'd'),
    write([1, '10'], '10 times too big!', 300, 330, 30, 'r'),
  ],
  // The big idea
  [
    ...pow([0, 'small'], '3', 140, 90, 44), ring([0, 'top'], 172, 70, 18, 20, 'y'),
    write([0, '10s'], '= 10 × 10 × 10', 380, 90, 36),
    write([0, 'multiply'], 'three 10s', 380, 135, 24, 'd'),
    write([1, 'zeros'], '= 1,000', 380, 200, 36, 'y'), write([1, 'zeros'], '3 zeros', 520, 245, 26, 'y'),
    write([1, 'slide'], '3 places to slide', 300, 290, 30, 'y'),
    ...[[380, 330], [330, 280], [280, 230]].map(([a, b]) => ({ ...hop([1, 'slide'], a, b, 355, 'b'), quick: true })),
  ],
  // Count the 10s
  [
    ...[['short', 90], ['long', 280], ['number', 490]].map(([t, x]) => ({ ...write([0, 'count'], t as string, x as number, 45, 22, 'd'), quick: true })),
    write([0, '10'], '10 × 10', 280, 110, 34), write([0, 'two'], 'two 10s', 280, 150, 22, 'd'),
    ...pow([0, '10²'], '2', 80, 110),
    write([1, '10'], '10 × 10 × 10', 280, 200, 34), write([1, 'three'], 'three 10s', 280, 240, 22, 'd'),
    ...pow([1, '10³'], '3', 80, 200),
    { ...write([2, 'column'], '100', 490, 110, 34, 'y'), quick: true }, write([2, 'column'], '1,000', 490, 200, 34, 'y'),
    write([2, 'zero'], 'each 10 → one more zero', 300, 330, 28, 'b'),
  ],
  // The city the short way
  [
    line([0, 'city'], [[440, 390], [440, 330], [470, 330], [470, 300], [505, 300], [505, 345], [530, 345], [530, 315], [565, 315], [565, 390]], 'd'),
    ...[['1', 160], [',', 182], ['0', 205], ['0', 235], ['0', 265], [',', 287], ['0', 310], ['0', 340], ['0', 370]]
      .map(([t, x]) => ({ ...write([0, '1,000,000'], t as string, x as number, 90, 44), quick: true })),
    ring([0, '1'], 160, 90, 18, 26, 'd'),
    ...[205, 235, 265, 310, 340, 370].map((x, i) => ({ ...write([0, 'Count'], String(i + 1), x, 145, 24, 'y'), quick: true })),
    write([0, 'Count'], '6 zeros', 480, 145, 26, 'y'),
    write([1, '10s'], '10 × 10 × 10 × 10 × 10 × 10', 300, 220, 28),
    ...pow([1, '10⁶'], '6', 250, 300, 48), write([1, 'people'], 'people', 370, 305, 30),
  ],
  // It says how far to slide
  [
    ...pow([1, 'small'], '3', 120, 80, 40), write([1, 'places'], '→ 3 places', 290, 80, 30, 'y'),
    write([2, '45'], '45 × 10', 140, 180, 34), write([2, '45'], '3', 212, 160, 22, 'y'),
    arrow([2, 'left'], [560, 180], [440, 180], 'r'), write([2, 'left'], '= 45,000', 320, 180, 34),
    write([2, '62,000'], '62,000 ÷ 10', 160, 290, 34), write([2, '62,000'], '3', 266, 270, 22, 'y'),
    arrow([2, 'right'], [440, 290], [560, 290], 'b'), write([2, 'right'], '= 62', 340, 290, 34),
  ],
  // One thing not to do
  [
    ...warn([0, 'Careful']),
    ...pow([1, '10³'], '3', 120, 190), write([1, '3'], '= 10 × 3', 290, 190, 36, 'r'), cross([1, '3'], 215, 165, 150, 50),
    ...pow([2, 'three'], '3', 100, 290, 40, 'y'), write([2, 'three'], '= 10 × 10 × 10', 300, 290, 34, 'y'),
  ],
]

