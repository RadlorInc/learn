/** g6m1-t2's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A recipe table: a label column, then one column per batch. Yellow is a new column worked out, blue is going back down,
 *  coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, cells, arrow, cross, ring } from '../../../chalk'
import { warn } from './t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
// Columns 120 wide from x = 190; rows: batches 50..100, flour 100..160, eggs 160..220.
const CX = (i: number) => 250 + 120 * i
const FY = 130, EY = 190, HY = 75
/** The empty table with `n` batch columns and its row names. */
const grid = (at: At, n: number): ChalkMark[] => [
  q(cells(at, 190, 50, 120 * n, 50, n, 'd')), q(cells(at, 190, 100, 120 * n, 60, n)), q(cells(at, 190, 160, 120 * n, 60, n)),
  q(write(at, 'batches', 115, HY, 22, 'd')), q(write(at, 'flour', 115, FY, 24)), q(write(at, 'eggs', 115, EY, 24)),
]
/** One column's numbers: batches, cups of flour, eggs. */
const col = (at: At, i: number, h: string, f: string, e: string, c: 'w' | 'y' | 'b' = 'w'): ChalkMark[] =>
  [q(write(at, h, CX(i), HY, 26, 'd')), q(write(at, f, CX(i), FY, 34, c)), q(write(at, e, CX(i), EY, 34, c))]

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding 1 to each changes it
  [
    write([0, 'What'], '3 cups flour', 150, 90, 28), write([0, 'What'], '2 eggs', 150, 160, 28),
    arrow([0, 'add'], [250, 90], [340, 90], 'r'), write([0, 'add'], '+ 1', 295, 62, 24, 'r'),
    arrow([0, 'add'], [250, 160], [340, 160], 'r'), write([0, 'add'], '+ 1', 295, 132, 24, 'r'),
    write([1, '4'], '4 cups flour', 460, 90, 28, 'r'), write([1, '3'], '3 eggs', 460, 160, 28, 'r'),
    write([2, 'No'], 'not the same recipe', 300, 250, 32, 'r'),
    write([2, 'less'], 'less flour for each egg', 300, 320, 26, 'd'),
  ],
  // The big idea: times 2 on both rows keeps the mix
  [
    write([0, 'Multiply'], 'flour', 110, 110, 26), write([0, 'Multiply'], 'eggs', 110, 210, 26),
    write([0, 'Multiply'], '3', 210, 110, 44), write([0, 'Multiply'], '2', 210, 210, 44),
    arrow([0, 'both'], [250, 110], [370, 110]), arrow([0, 'both'], [250, 210], [370, 210]),
    write([0, 'same'], '× 2', 310, 80, 26, 'y'), write([0, 'same'], '× 2', 310, 180, 26, 'y'),
    write([0, 'mix'], '6', 410, 110, 44, 'y'), write([0, 'mix'], '4', 410, 210, 44, 'y'),
    write([0, 'bigger'], 'same mix, just bigger', 300, 310, 32, 'y'),
  ],
  // Make 2 batches
  [
    ...grid([0, 'batches'], 2), ...col([0, 'batches'], 0, '1', '3', '2'), q(write([0, 'twice'], '2', CX(1), HY, 26, 'd')),
    write([1, 'flour'], 'flour', 160, 280, 24, 'd'), write([1, '3'], '3 × 2 =', 300, 280, 30), write([1, '6'], '6', 378, 280, 30, 'y'),
    q(write([1, '6'], '6', CX(1), FY, 34, 'y')),
    write([2, 'eggs'], 'eggs', 160, 340, 24, 'd'), write([2, '2'], '2 × 2 =', 300, 340, 30), write([2, '4'], '4', 378, 340, 30, 'y'),
    q(write([2, '4'], '4', CX(1), EY, 34, 'y')),
  ],
  // Make 3 batches
  [
    ...grid([0], 3), ...col([0], 0, '1', '3', '2'), ...col([0], 1, '2', '6', '4'), q(write([0, 'batches'], '3', CX(2), HY, 26, 'd')),
    write([1, '3'], '3 × 3 =', 170, 270, 30), write([1, '9'], '9', 245, 270, 30, 'y'), q(write([1, '9'], '9', CX(2), FY, 34, 'y')),
    write([1, 'Eggs'], '2 × 3 =', 410, 270, 30), write([1, '6'], '6', 485, 270, 30, 'y'), q(write([1, '6'], '6', CX(2), EY, 34, 'y')),
    ring([2, 'column'], CX(0), 135, 54, 98, 'y'), ring([2, 'column'], CX(1), 135, 54, 98, 'y'), ring([2, 'column'], CX(2), 135, 54, 98, 'y'),
    write([2, 'same'], 'same recipe', 300, 345, 32, 'y'),
  ],
  // You can go back down
  [
    arrow([0, 'backwards'], [400, 30], [240, 30], 'b'), ...grid([0, 'backwards'], 2),
    write([1, 'Divide'], 'divide both by the same number', 300, 290, 26, 'b'),
    ...col([2, '6'], 1, '2', '6', '4'),
    write([2, 'divided'], '÷ 2', 500, FY, 28, 'b'), write([2, 'divided'], '÷ 2', 500, EY, 28, 'b'),
    ...col([2, '3'], 0, '1', '3', '2', 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, "Don't"], '3 cups, 2 eggs', 300, 140, 30),
    write([1, 'Adding'], '+ 2', 110, 210, 30, 'r'), arrow([1, 'Adding'], [150, 210], [220, 210], 'r'),
    write([1, '5'], '5 cups, 4 eggs', 360, 210, 30, 'r'), cross([1, 'different'], 85, 188, 400, 44),
    write([2, 'Times'], '× 2', 110, 295, 30, 'y'), arrow([2, 'Times'], [150, 295], [220, 295], 'y'),
    write([2, '6'], '6 cups, 4 eggs', 360, 295, 30, 'y'), write([2, 'same'], 'same recipe', 360, 350, 24, 'd'),
  ],
]
