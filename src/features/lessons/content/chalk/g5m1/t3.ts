/** g5m1-t3's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring } from '../../../chalk'

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
    write([0, 'zeros'], '1,000,000', 300, 70, 44),
    write([0, 'Six'], '6 zeros?', 300, 120, 26, 'd'),
    write([1, 'many'], '10,000,000', 300, 195, 44, 'r'),
    write([1, 'many'], 'one zero too many', 300, 245, 24, 'd'),
    write([1, 'big'], '10 times too big', 300, 290, 30, 'r'),
    write([2, 'shorter'], 'a shorter way?', 300, 360, 30, 'y'),
  ],
  // The big idea: the small number counts the 10s, and the 10s are the zeros
  [
    ...pow([0, 'small'], '3', 140, 90, 44), ring([0, 'top'], 172, 70, 18, 20, 'y'),
    write([0, '10s'], '= 10 × 10 × 10', 380, 90, 36),
    write([0, 'multiply'], 'three 10s', 380, 140, 24, 'd'),
    write([0, 'zeros'], '= 1,000', 380, 230, 36, 'y'),
    write([0, 'write'], '3 zeros', 380, 280, 26, 'y'),
  ],
  // Count the 10s
  [
    ...[['short', 90], ['long', 280], ['number', 490]].map(([t, x]) => ({ ...write([0, 'Look'], t as string, x as number, 45, 22, 'd'), quick: true })),
    write([0, '10'], '10 × 10', 280, 110, 34), write([0, 'two'], 'two 10s', 280, 150, 22, 'd'),
    ...pow([0, '10²'], '2', 80, 110), write([0, '100'], '100', 490, 110, 34, 'y'),
    write([1, '10'], '10 × 10 × 10', 280, 210, 34), write([1, 'three'], 'three 10s', 280, 250, 22, 'd'),
    ...pow([1, '10³'], '3', 80, 210), write([1, '1,000'], '1,000', 490, 210, 34, 'y'),
    write([2, 'zero'], 'each 10 → one more zero', 300, 330, 28, 'b'),
  ],
  // The city the short way: count the six zeros aloud, one at a time
  [
    line([0, 'city'], [[440, 390], [440, 330], [470, 330], [470, 300], [505, 300], [505, 345], [530, 345], [530, 315], [565, 315], [565, 390]], 'd'),
    ...[['1', 160], [',', 182], ['0', 205], ['0', 235], ['0', 265], [',', 287], ['0', 310], ['0', 340], ['0', 370]]
      .map(([t, x]) => ({ ...write([0, '1,000,000'], t as string, x as number, 90, 44), quick: true })),
    ring([0, '1'], 160, 90, 18, 26, 'd'),
    ...['One', 'two', 'three', 'four', 'five', 'six'].map((w, i) => write([1, w], String(i + 1), [205, 235, 265, 310, 340, 370][i], 145, 24, 'y')),
    write([2, 'zeros'], '6 zeros', 480, 145, 26, 'y'),
    write([2, '10s'], '10 × 10 × 10 × 10 × 10 × 10', 300, 220, 28),
    ...pow([2, '10⁶'], '6', 200, 300, 48), write([2, 'people'], 'people', 320, 305, 30),
  ],
  // It says how far to slide
  [
    ...pow([0, 'small'], '3', 120, 80, 40), write([0, 'slide'], '→ slide 3 places', 320, 80, 30, 'y'),
    write([1, '45'], '45 × 10', 140, 190, 34), write([1, '45'], '3', 212, 170, 22, 'y'),
    arrow([1, 'left'], [560, 190], [460, 190], 'r'), write([1, '45,000'], '= 45,000', 330, 190, 34, 'y'),
    write([2, '62,000'], '62,000 ÷ 10', 160, 300, 34), write([2, '62,000'], '3', 266, 280, 22, 'y'),
    arrow([2, 'right'], [460, 300], [560, 300], 'b'), write([2, '62'], '= 62', 350, 300, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...pow([1, '10³'], '3', 110, 180), write([1, 'TIMES'], '= 10 × 3', 270, 180, 36, 'r'), write([1, '30'], '= 30', 420, 180, 36, 'r'),
    cross([1, '30'], 378, 160, 84, 40),
    ...pow([2, 'three'], '3', 90, 290, 40, 'y'), write([2, '10'], '= 10 × 10 × 10', 270, 290, 34, 'y'), write([2, '1,000'], '= 1,000', 460, 290, 34, 'y'),
  ],
]
