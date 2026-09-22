/** g5m3-t8's chalkboards: index = screen index (0 is Screen 1, which has none). The trail is a bar of 4 miles, x 60–540, 120 a mile. */
import type { ChalkMark } from '../../../chalk'
import { write, span } from '../../../chalk'
import { row, crossRow, cells, shade, warn, cut, bar, type At, type Tok, yel } from './t5'
import { tick } from '../g4m4/t1'

/** "1 mile" written in each mile of a trail at height y. */
const miles = (at: At, y: number): ChalkMark[] => [0, 1, 2, 3].map(i => ({ ...write(at, '1 mile', 120 + 120 * i, y, 20, 'd'), quick: true }))
const wrong7: Tok[] = [[[2, 'not'], ['1', '2'], 'r'], [[2, 'not'], '×', 'r'], [[2, 'not'], '4', 'r'], [[2, 'not'], '=', 'r'], [[2, 'not'], '2 stops', 'r']]

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // Same numbers, two questions
  [
    cells([0, 'same'], 60, 55, 480, 50, 4), span([0, 'miles'], 60, 540, 125, 'd'), write([0, 'miles'], '4 miles', 300, 155, 24, 'd'),
    ...bar([1, 'part'], 60, 200, 220, 45, 4, 3), write([1, 'part'], 'part of it', 170, 272, 26, 'b'),
    cells([1, 'pieces'], 320, 200, 220, 45, 8), write([1, 'along'], 'pieces along it', 430, 272, 26, 'b'),
    write([2, 'divide'], '×  or  ÷ ?', 300, 325, 32, 'd'),
    write([2, 'words'], 'the words tell you', 300, 372, 28, 'y'),
  ],
  // The big idea: part of an amount, or how many pieces fit?
  [
    cells([0, 'Draw'], 60, 45, 480, 50, 4), write([0, 'story'], 'the story', 300, 120, 24, 'd'),
    ...bar([0, 'part'], 60, 170, 210, 45, 4, 3), write([0, 'amount'], 'part of it', 165, 245, 26, 'b'), write([0, 'amount'], '×', 165, 310, 44, 'y'),
    cells([0, 'counting'], 330, 170, 210, 45, 8), write([0, 'fit'], 'how many fit', 435, 245, 26, 'b'), write([0, 'fit'], '÷', 435, 310, 44, 'y'),
  ],
  // Part of an amount: 3/4 of 4 miles
  [
    ...row([[[0, '3/4'], ['3', '4']], [[0, 'trail'], 'of the trail']], 220, 60, 34), write([0, 'multiply'], 'part → ×', 470, 60, 32),
    cells([1, 'Cut'], 60, 130, 480, 55, 1), ...[180, 300, 420].map(x => cut([1, 'parts'], x, 120, 195, 'w')), ...miles([1, 'parts'], 157),
    shade([1, 'take'], 60, 130, 480, 55, 4, 3),
    ...row([[[2, '3/4'], ['3', '4']], [[2, '3/4'], '×'], [[2, '3/4'], '4'], [[2, '3/4'], '='], [[2, '3'], '3 miles', 'y']], 300, 310, 40),
    span([2, 'miles'], 60, 420, 222, 'y'),
  ],
  // How many pieces fit: a stop every 1/2 mile
  [
    cells([0, 'story'], 60, 125, 480, 55, 4),
    ...row([[[0, 'every'], 'a stop every'], [[0, '1/2'], ['1', '2']], [[0, 'mile'], 'mile']], 300, 55, 32),
    ...[120, 240, 360, 480].map(x => cut([1, 'halves'], x, 125, 180, 'b')),
    write([1, 'holds'], '2 in each mile', 300, 250, 26, 'd'),
    ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ ...write([1, '8'], String(i), 60 + 60 * i - 8, 205, 20, 'y'), quick: true })),
    ...row([[[2, '4'], '4'], [[2, '4'], '÷'], [[2, '4'], ['1', '2']], [[2, '8'], '=', 'y'], [[2, '8'], '8', 'y'], [[2, 'stops'], 'water stops', 'y']], 300, 330, 36),
  ],
  // Check the size
  [
    cells([0, 'size'], 60, 45, 480, 45, 4), write([0, 'size'], '4 miles', 300, 115, 24, 'd'),
    write([1, 'Part'], 'part of 4 miles', 150, 195, 26), write([1, 'less'], '→ less than 4', 365, 195, 26), write([1, '3'], '3', 495, 195, 36, 'y'), tick([1, '3'], 518, 195),
    write([2, 'Counting'], 'halves in 4 miles', 150, 290, 26), write([2, 'more'], '→ more than 4', 365, 290, 26), write([2, '8'], '8', 495, 290, 36, 'y'), tick([2, '8'], 518, 290),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...row([[[1, 'NUMBERS'], '4 and', 'd'], [[1, 'NUMBERS'], ['1', '2'], 'd'], [[1, 'NUMBERS'], ' → ?', 'd']], 300, 155, 30),
    ...row(wrong7, 300, 240, 34), crossRow([2, 'not'], wrong7, 300, 240, 3, 4, 34),
    ...row(([[[2, "It's"], '4'], [[2, "It's"], '÷'], [[2, "It's"], ['1', '2']], [[2, '8'], '='], [[2, '8'], '8 stops']] as Tok[]).map(yel), 300, 335, 34),
  ],
]
