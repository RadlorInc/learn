/** g5m1-t4's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, hop, cross, ring } from '../../../chalk'

type At = [number, string?]
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
/** A number line from x 80 to 520 at y, with its two end labels under it. */
const numLine = (at: At, y: number, a: string, b: string): ChalkMark[] => [
  line(at, [[80, y], [520, y]]), line(at, [[80, y - 10], [80, y + 10]]), line(at, [[520, y - 10], [520, y + 10]]),
  { ...write(at, a, 80, y + 25, 24), quick: true }, { ...write(at, b, 520, y + 25, 24), quick: true },
]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // The exact way takes time
  [
    write([0, '28'], '28 × 412', 300, 60, 40),
    ...[[200, 400, 100], [220, 380, 125], [200, 400, 150]].map(([a, b, y]) => ({ ...line([0, 'steps'], [[a, y], [b, y]], 'd', 2), quick: true })),
    write([1, 'exact'], 'exact', 140, 210, 28, 'd'), cross([1, 'exact'], 100, 190, 80, 40),
    write([1, 'about'], 'about how many?', 400, 210, 30, 'y'),
    write([2, '1,000'], '1,000?', 130, 320, 32), write([2, '10,000'], '10,000?', 300, 320, 32), write([2, '100,000'], '100,000?', 470, 320, 32),
  ],
  // The big idea
  [
    write([0, 'number'], '28 × 412', 300, 70, 40),
    arrow([0, 'close'], [240, 95], [240, 140], 'd'), arrow([0, 'close'], [350, 95], [350, 140], 'd'),
    write([0, 'round'], '30 × 400', 300, 175, 40, 'y'),
    write([1, 'fact'], '3 × 4 = 12', 200, 280, 34, 'b'),
    arrow([1, 'write'], [295, 280], [360, 280]), write([1, 'zeros'], '12,000', 430, 280, 34, 'y'), ring([1, 'zeros'], 452, 280, 32, 24, 'r'),
  ],
  // Round each number
  [
    write([0, 'Round'], 'round at the biggest place', 300, 40, 26, 'd'),
    ...numLine([1, '28'], 120, '20', '30'), line([1, '28'], [[432, 108], [432, 132]], 'y'), write([1, '28'], '28', 432, 145, 24, 'y'),
    hop([1, '2'], 432, 520, 118, 'y'), write([1, '2'], '2 away', 476, 72, 24, 'y'), ring([1, '30'], 520, 145, 22, 18, 'y'),
    ...numLine([2, '412'], 250, '400', '500'), line([2, '412'], [[133, 238], [133, 262]], 'b'), write([2, '412'], '412', 140, 275, 24, 'b'),
    hop([2, '12'], 133, 80, 248, 'b'), write([2, '12'], '12 away', 130, 210, 24, 'b'), ring([2, '400'], 80, 275, 28, 18, 'b'),
    write([3, '28'], '28 × 412', 170, 350, 32), write([3, 'close'], 'close to', 300, 350, 24, 'd'), write([3, '30'], '30 × 400', 430, 350, 32, 'y'),
  ],
  // Use a fact, then the zeros
  [
    write([0, '3'], '3 × 4 = 12', 300, 60, 38, 'b'),
    write([1, '30'], '30 × 400', 180, 160, 36), write([1, 'one'], '1 zero', 130, 205, 22, 'd'),
    write([1, 'two'], '2 zeros', 225, 205, 22, 'd'), write([1, 'three'], '→ 3 zeros', 420, 160, 28, 'r'),
    write([2, '12,000'], '12,000', 300, 270, 44, 'y'), ring([2, '12,000'], 333, 270, 36, 28, 'r'),
    write([2, 'eggs'], 'about 12,000 eggs', 300, 350, 30, 'y'),
  ],
  // Dividing works the same way
  [
    write([0, '2,380'], '2,380', 160, 60, 38), write([0, '58'], '÷ 58', 280, 60, 38),
    arrow([1, '58'], [295, 85], [295, 125], 'd'), write([1, 'ten'], 'nearest 10', 470, 60, 24, 'd'), write([1, '60'], '60', 295, 150, 38, 'y'),
    arrow([1, '2,380'], [160, 85], [160, 125], 'd'), write([1, 'hundred'], 'nearest 100', 470, 150, 24, 'd'),
    write([1, '2,400'], '2,400', 160, 150, 38, 'y'), write([1, '2,400'], '÷', 240, 150, 38, 'y'),
    write([2, '24'], '24 ÷ 6 = 4', 180, 240, 34, 'b'), write([2, '60'], '60 × 40 = 2,400', 420, 240, 34),
    write([2, 'crates'], 'about 40 crates', 300, 340, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'slip']),
    write([1, 'zeros'], '30 × 400 = 1,200', 300, 180, 34, 'r'), cross([1, 'zeros'], 335, 160, 105, 40),
    write([2, '30'], '30 × 400', 180, 280, 36), write([2, 'one'], '1 zero', 130, 330, 22, 'd'), write([2, 'two'], '2 zeros', 225, 330, 22, 'd'),
    write([2, 'three'], '= 12,000', 360, 280, 36, 'y'), ring([2, 'after'], 405, 280, 34, 24, 'r'),
  ],
]
