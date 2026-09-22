/** g6m1-t7's chalkboards: index = screen index (0 is Screen 1, which has none). Lengths at true size, 1 inch = 10 px, so a
 *  foot is 120 px. × to the smaller unit is white, ÷ back to the bigger one blue, a result yellow, the wrong move coral. */
import type { ChalkMark } from '../../../chalk'
import { write, box, cells, arrow, cross, ticks } from '../../../chalk'
import { q, warn, rows, n } from './t5'

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Feet and inches are different sizes
  [
    cells([0, 'feet'], 60, 80, 480, 45, 4), write([0, 'feet'], '4 feet', 300, 50, 28),
    box([0, 'inches'], 60, 160, 40, 45, 'b'), write([0, 'inches'], '4 inches', 175, 183, 26, 'b'),
    write([0, 'No'], 'not the same', 420, 183, 26, 'r'),
    box([1, 'foot'], 60, 240, 120, 40), write([1, 'foot'], '1 foot', 120, 305, 24),
    box([1, 'inch'], 250, 240, 10, 40, 'b'), write([1, 'inch'], '1 inch', 255, 305, 24, 'b'),
    write([2, 'inches'], '1 foot = ? inches', 300, 360, 30, 'y'),
  ],
  // The big idea: 1 foot is 12 inches; × down to inches, ÷ back up to feet
  [
    box([0, 'foot'], 150, 80, 300, 50), write([0, 'foot'], '1 foot', 300, 105, 28),
    cells([0, '12'], 150, 180, 300, 50, 12, 'b'), write([0, 'inches'], '12 inches', 300, 255, 26, 'b'),
    arrow([0, 'multiply'], [115, 90], [115, 215]), write([0, 'multiply'], '× 12', 70, 155, 28),
    write([0, 'smaller'], 'to the smaller unit: ×', 175, 330, 24),
    arrow([0, 'divide'], [485, 215], [485, 90], 'b'), write([0, 'divide'], '÷ 12', 530, 155, 28, 'b'),
    write([0, 'back'], 'back: ÷', 470, 330, 24, 'b'),
  ],
  // Build the table
  [
    { beat: 0, at: '1', c: 'w', w: 2, d: 'M30 175 H500 M135 90 V260' },
    ...rows([0, '1'], 'feet', 'inches', 80, 130, 220), n([0, '1'], '1', 200, 130), n([0, '12'], '12', 200, 220),
    n([1, '2'], '2', 310, 130), n([1, '24'], '24', 310, 220), n([1, '3'], '3', 420, 130), n([1, '36'], '36', 420, 220),
    arrow([2, '12'], [215, 270], [295, 270], 'b'), write([2, '12'], '+ 12', 255, 300, 24, 'b'),
    arrow([2, 'more'], [325, 270], [405, 270], 'b'), write([2, 'more'], '+ 12', 365, 300, 24, 'b'),
  ],
  // Jump to 4 feet
  [
    { beat: 0, at: 'step', c: 'w', w: 2, d: 'M30 115 H545 M125 50 V185' },
    ...rows([0, 'step'], 'feet', 'inches', 75, 80, 150),
    ...[[190, '1', '12'], [290, '2', '24'], [390, '3', '36']].flatMap(([x, a, b]) =>
      [n([0, 'step'], a as string, x as number, 80), n([0, 'step'], b as string, x as number, 150)]),
    n([1, '4'], '4', 500, 80), write([1, '48'], '4 × 12 = 48', 300, 215, 34), n([1, 'inches'], '48', 500, 150, 'y'),
    write([2, 'shelf'], 'the shelf, 4 feet', 300, 258, 22, 'd'), cells([2, 'shelf'], 60, 280, 480, 40, 4),
    write([2, '48'], '48 inches', 300, 355, 30, 'y'),
  ],
  // Going back
  [
    q(write([0, 'inches'], 'inches', 65, 245, 24, 'd')), q(write([0, 'feet'], 'feet', 65, 130, 24, 'd')),
    arrow([0, 'back'], [520, 240], [520, 130], 'b'),
    write([1, 'divide'], '÷ 12', 560, 185, 26, 'b'),
    ticks([2, '36'], 120, 230, 360, 36, 12, 'w'), write([2, '36'], '36 inches', 300, 275, 26),
    write([2, '3'], '36 ÷ 12 = 3', 300, 345, 34),
    cells([2, 'feet'], 120, 110, 360, 40, 3, 'y'), write([2, 'feet'], '3 feet', 300, 80, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'smaller'], '4 feet → inches', 300, 150, 28, 'd'),
    write([1, 'DIVIDE'], '4 ÷ 12', 300, 205, 36, 'r'), cross([1, 'DIVIDE'], 240, 185, 120, 42),
    write([2, 'more'], 'smaller units, more of them', 300, 275, 26, 'b'),
    write([2, '48'], '4 × 12 = 48 inches', 300, 340, 34, 'y'),
  ],
]
