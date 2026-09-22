/** g4m4-t8's chalkboards: index = screen index (0 is Screen 1, which has none). A cup of flour is a bar cut into 4; every cup the same size. */
import type { ChalkMark } from '../../../chalk'
import { write, ring } from '../../../chalk'
import { row, crossRow, cells, shade, warn, type At, type Tok } from './t6'

const W = 160, H = 44
/** A cup of flour at (x, y): a bar cut into 4 fourths, `k` of them full. */
const cup = (at: At, x: number, y: number, k: number, c: 'b' | 'y' = 'b'): ChalkMark[] => [cells(at, x, y, W, H, 4), shade(at, x, y, W, H, 4, k, 0, c)]

const mixed = (a: At, w: string, t: string, c?: 'r' | 'y'): Tok[] => [[a, w, c], [a, [t, '4'], c]]
const wrong: Tok[] = [...mixed([1, 'BOTTOM'], '1', '1', 'r'), [[1, 'BOTTOM'], '+', 'r'], ...mixed([1, 'BOTTOM'], '1', '2', 'r'),
  [[1, 'numbers'], '=', 'r'], [[1, 'numbers'], '2', 'r'], [[1, 'numbers'], ['3', '8'], 'r']]

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // So many numbers
  [
    ...row([...mixed([0, 'numbers'], '1', '1'), [[0, 'numbers'], '+'], ...mixed([0, 'numbers'], '1', '2')], 300, 70, 38),
    ...cup([0, 'wholes'], 60, 150, 4), ...cup([0, 'wholes'], 60, 225, 4),
    ...cup([0, 'pieces'], 280, 150, 1), ...cup([0, 'pieces'], 280, 225, 2),
    write([0, 'amount'], 'bread', 520, 172, 24, 'd'), write([0, 'amount'], 'pancakes', 520, 247, 24, 'd'),
    write([1, 'Sort'], 'sort them', 300, 378, 24, 'd'),
    ring([2, 'Wholes'], 140, 210, 105, 72, 'w'), write([2, 'Wholes'], 'wholes', 140, 330, 28),
    ring([2, 'Pieces'], 360, 210, 105, 72, 'b'), write([2, 'Pieces'], 'pieces', 360, 330, 28, 'b'),
  ],
  // The big idea: wholes, then pieces, then together
  [
    ...cup([0, 'wholes'], 60, 50, 4), ...cup([0, 'wholes'], 60, 120, 4),
    write([0, 'wholes'], 'wholes', 140, 195, 24, 'd'),
    ...cup([0, 'pieces'], 380, 50, 1), ...cup([0, 'pieces'], 380, 120, 2),
    write([0, 'pieces'], 'pieces', 460, 195, 24, 'd'),
    write([0, 'together'], 'together', 300, 240, 26, 'y'),
    ...cup([0, 'together'], 40, 280, 4), ...cup([0, 'together'], 220, 280, 4), ...cup([0, 'together'], 400, 280, 3, 'y'),
  ],
  // Add the wholes
  [
    ...cup([0, 'bread'], 90, 80, 4), write([0, 'bread'], 'bread', 170, 160, 24, 'd'),
    ...cup([0, 'pancakes'], 350, 80, 4), write([0, 'pancakes'], 'pancakes', 430, 160, 24, 'd'),
    write([1, '1'], '1 + 1', 230, 260, 38), write([1, '2'], '= 2 whole cups', 400, 260, 32, 'y'),
  ],
  // Add the pieces
  [
    ...cup([0, '1/4'], 120, 50, 1), ...row([[[0, '1/4'], ['1', '4']]], 350, 72, 32),
    ...cup([0, '2/4'], 120, 130, 2), ...row([[[0, '2/4'], ['2', '4']]], 350, 152, 32),
    write([0, 'same'], 'same size pieces', 300, 215, 24, 'd'),
    ...cup([1, 'make'], 120, 260, 3, 'y'), ...row([[[1, '3/4'], ['3', '4'], 'y']], 350, 282, 32),
    write([1, '3/4'], 'of a cup', 460, 282, 24, 'y'),
  ],
  // Put them together
  [
    ...cup([0, '2'], 40, 60, 4), ...cup([0, '2'], 220, 60, 4), write([0, 'cups'], '2 whole cups', 200, 140, 24, 'd'),
    ...cup([0, '3/4'], 400, 60, 3, 'y'), ...row([[[0, '3/4'], ['3', '4'], 'y']], 480, 160, 30),
    ...row([...mixed([1, '1'], '1', '1'), [[1, '1'], '+'], ...mixed([1, '2/4'], '1', '2'), [[1, '2'], '=', 'y'], [[1, '2'], '2', 'y'], [[1, '3/4'], ['3', '4'], 'y']], 300, 290, 40),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...row(wrong, 300, 180, 36), crossRow([1, 'numbers'], wrong, 300, 180, 5, 7, 36),
    ...row([...mixed([2, 'Fourths'], '1', '1'), [[2, 'Fourths'], '+'], ...mixed([2, 'Fourths'], '1', '2'),
      [[2, 'stays'], '=', 'y'], [[2, 'stays'], '2', 'y'], [[2, 'stays'], ['3', '4'], 'y']], 300, 320, 36),
  ],
]
