/** g3m1-t3's chalkboards: index = screen index (0 is Screen 1, which has none). Muffins are circles on a tray. */
import type { ChalkMark } from '../../../chalk'
import { write, box, hop, cross } from '../../../chalk'
import { dots, grid, warn, tick, type At } from './t1'

type C = 'w' | 'y' | 'b' | 'd' | 'r'
/** A tray: `rows` × `cols` muffins `gap` apart, first at (x, y), with the tray drawn round them. */
const tray = (at: At, x: number, y: number, rows: number, cols: number, gap: number, r: number, c: C = 'w'): ChalkMark[] => [
  { ...box(at, x - gap / 2 - 4, y - gap / 2 - 4, cols * gap + 8, rows * gap + 8, 'd'), quick: true },
  dots(at, grid(x, y, rows, cols, gap), r, c),
]

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // It looks like a new problem
  [
    ...tray([0, 'Turn'], 70, 150, 2, 5, 40, 13),
    hop([0, 'Turn'], 270, 345, 170, 'y'),
    ...tray([0, 'rows'], 410, 90, 5, 2, 40, 13),
    write([1, 'number'], 'same number?', 300, 340, 34, 'y'),
  ],
  // The big idea
  [
    ...tray([0, 'rows'], 70, 130, 2, 5, 40, 13),
    hop([0, 'around'], 270, 345, 150, 'y'),
    ...tray([0, 'around'], 410, 70, 5, 2, 40, 13),
    write([0, '2'], '2 × 5', 150, 320, 38), write([0, 'and'], '5 × 2', 430, 320, 38),
    write([0, 'same'], '=', 290, 320, 46, 'y'), write([0, 'total'], 'same total', 290, 370, 28, 'y'),
  ],
  // 2 rows of 5
  [
    ...tray([0, 'tray'], 180, 110, 2, 5, 60, 18),
    write([0, 'rows'], '2 rows of 5', 300, 42, 30, 'd'),
    write([1, '5'], '5', 500, 110, 36, 'y'), write([1, '10'], '10', 500, 170, 36, 'y'),
    write([2, 'So'], '2 × 5 = 10', 300, 300, 46, 'y'),
  ],
  // Turn the tray
  [
    ...tray([0], 70, 150, 2, 5, 40, 13),
    hop([0, 'turn'], 270, 345, 170, 'y'),
    ...tray([0, 'turn'], 410, 90, 5, 2, 40, 13),
    write([1, 'fall'], 'none fall off', 150, 300, 28, 'd'), write([1, 'added'], 'none added', 450, 300, 28, 'd'),
    write([2, 'moves'], 'same muffins', 300, 360, 34, 'y'),
  ],
  // 5 rows of 2
  [
    ...tray([0, 'tray'], 200, 60, 5, 2, 55, 16),
    ...['2', '4', '6', '8', '10'].map((n, r) => write([0, n], n, 330, 60 + r * 55, 32, 'y')),
    write([1, 'So'], '5 × 2 = 10', 470, 130, 40, 'y'),
    write([2, 'Same'], '2 × 5 = 10', 470, 210, 40, 'd'),
    write([2, 'total'], 'same total', 470, 290, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'times'], '5 × 2 = 2 × 5', 280, 160, 38, 'y'), tick([1, 'times'], 440, 160),
    write([1, 'take'], '5 − 2 = 2 − 5', 280, 230, 38, 'r'), cross([1, 'away'], 150, 208, 260, 45),
    write([2, '3'], '5 − 2 = 3', 170, 310, 34), write([2, 'does'], '2 − 5 ?', 430, 310, 34, 'r'),
    write([2, 'same'], 'not the same', 300, 365, 28, 'r'),
  ],
]
