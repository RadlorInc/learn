/** g5m6-t3's chalkboards: index = screen index (0 is Screen 1, which has none). Mia white, Leo blue, what you compare yellow, the guess coral. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cells, arrow, ring } from '../../../chalk'
import { q, warn, cross, type At } from './t1'

// Two rows under five weeks: columns 90 wide from x = 130, Mia's row y 65–115, Leo's y 125–175.
const X = [175, 265, 355, 445, 535]
const MIA = 90, LEO = 150
const MIA_N = ['0', '2', '4', '6', '8'], LEO_N = ['0', '6', '12', '18', '24']
const table = ([beat, at]: At): ChalkMark[] => [
  ...['start', 'wk 1', 'wk 2', 'wk 3', 'wk 4'].map((h, i) => q(write([beat, at], h, X[i], 42, 20, 'd'))),
  q(cells([beat, at], 130, 65, 450, 50, 5)), q(cells([beat, at], 130, 125, 450, 50, 5)),
  q(write([beat, at], 'Mia', 72, MIA, 26)), q(write([beat, at], 'Leo', 72, LEO, 26, 'b')),
]
const nums = (at: At, row: 'mia' | 'leo', from = 0, to = 4): ChalkMark[] => {
  const [ns, y, c]: [string[], number, ChalkColor] = row === 'mia' ? [MIA_N, MIA, 'w'] : [LEO_N, LEO, 'b']
  return ns.slice(from, to + 1).map((n, i) => q(write(at, n, X[from + i], y, 30, c)))
}
const num = (at: At, row: 'mia' | 'leo', i: number) => write(at, (row === 'mia' ? MIA_N : LEO_N)[i], X[i], row === 'mia' ? MIA : LEO, 30, row === 'mia' ? 'w' : 'b')
const column = (at: At, i: number) => ring(at, X[i], 120, 36, 64, 'y')

// Screen 2: the two savings as two lines from 0, Leo's climbing faster, and the gap between them growing.
const mia = (x: number) => 330 - ((x - 110) * 40) / 360, leo = (x: number) => 330 - ((x - 110) * 160) / 360
const gap = ([beat, at]: At, x: number): ChalkMark =>
  ({ beat, at, c: 'y', d: `M${x - 8} ${leo(x)} h16 M${x} ${leo(x)} V${mia(x)} M${x - 8} ${mia(x)} h16` })

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // A guess can fool you
  [
    write([0, 'ahead'], 'always 4 dollars ahead?', 300, 70, 32, 'r'),
    line([1, 'pulls'], [[110, 330], [470, mia(470)]]), write([1, 'pulls'], 'Mia', 525, mia(470), 26),
    line([1, 'pulls'], [[110, 330], [470, leo(470)]], 'b'), write([1, 'pulls'], 'Leo', 525, leo(470), 26, 'b'),
    gap([1, 'further'], 230), gap([1, 'further'], 350), gap([1, 'further'], 470),
  ],
  // The big idea
  [
    ...table([0, 'Follow']),
    write([0, 'rule'], 'add 2 each week', 170, 235, 24), write([0, 'rule'], 'add 6 each week', 430, 235, 24, 'b'),
    ...nums([0, 'step'], 'mia'), ...nums([0, 'time'], 'leo'),
    column([0, 'column'], 2),
  ],
  // Mia's rule
  [
    ...table([0, 'Mia']), ring([0, 'Mia'], 72, MIA, 34, 22, 'd'),
    num([1, '0'], 'mia', 0), write([1, 'adds'], 'Mia: add 2 every week', 300, 250, 28),
    num([2, '2'], 'mia', 1), num([2, '4'], 'mia', 2), num([2, '6'], 'mia', 3), num([2, '8'], 'mia', 4),
  ],
  // Leo's rule
  [
    ...table([0, 'Now']), ...nums([0, 'Now'], 'mia'),
    num([0, 'start'], 'leo', 0), write([0, 'adds'], 'Leo: add 6 every week', 300, 250, 28, 'b'),
    num([1, '6'], 'leo', 1), num([1, '12'], 'leo', 2), num([1, '18'], 'leo', 3), num([1, '24'], 'leo', 4),
  ],
  // Line them up
  [
    ...table([0, 'Now']), ...nums([0, 'Now'], 'mia'), ...nums([0, 'Now'], 'leo'),
    ...[1, 2, 3].map(i => q(arrow([0, 'down'], [X[i], 196], [X[i], 222], 'd'))),
    column([1, '6'], 1), column([1, '12'], 2), column([1, '18'], 3),
    write([2, '3'], '2 × 3 = 6', 140, 265, 24), write([2, '3'], '4 × 3 = 12', 300, 265, 24), write([2, '3'], '6 × 3 = 18', 460, 265, 24),
    write([2, "Mia's"], 'Leo = 3 × Mia', 300, 330, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'MORE'], 'always 4 more', 300, 165, 34, 'r'),
    write([2, '4'], '6 − 2 = 4', 175, 235, 30), write([2, '8'], '12 − 4 = 8', 425, 235, 30),
    cross([2, '8'], 185, 140, 230, 50),
    write([2, 'times'], 'always 3 times as much', 300, 320, 32, 'y'),
  ],
]
