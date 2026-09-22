/** g5m2-t4's chalkboards: index = screen index (0 is Screen 1, which has none). Colours as in t1. */
import type { ChalkMark } from '../../../chalk'
import { write, span, box, arrow } from '../../../chalk'
import { row, crossRow, bar, recut, warn, type At, type Tok } from './t1'

// A hike as wholes and pieces: every bar is the same length (200), a whole bar at x 120, the pieces at x 350.
const WX = 120, PX = 350, BW = 200
const hike = (atL: At, atW: At, atP: At, whole: string, top: string, bot: string, n: number, k: number, y: number, h = 60): ChalkMark[] => [
  ...row([[atL, whole, 'd'], [atL, [top, bot], 'd']], 55, y + h / 2, 26),
  ...bar(atW, WX, y, BW, h, 1, 1),
  ...bar(atP, PX, y, BW, h, n, k),
]
const two = (at: At, atW: At = at, atP: At = at): ChalkMark[] =>
  [...hike(at, atW, atP, '1', '1', '2', 2, 1, 50), ...hike(at, atW, atP, '1', '3', '4', 4, 3, 150)]

// Screens 4–6 use long bars: x 150–450.
const X = 150, W = 300

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Wholes and pieces
  [
    ...two([0, 'Look'], [0, 'wholes'], [0, 'pieces']),
    span([0, 'different'], PX + 4, PX + BW / 2 - 4, 128, 'd'), span([0, 'different'], PX + 4, PX + BW / 4 - 4, 228, 'd'),
    arrow([1, 'wholes'], [WX + BW / 2, 300], [WX + BW / 2, 250], 'y'), write([1, 'wholes'], 'first', WX + BW / 2, 330, 30, 'y'),
    arrow([1, 'after'], [PX + BW / 2, 300], [PX + BW / 2, 250], 'd'), write([1, 'after'], 'after', PX + BW / 2, 330, 30, 'd'),
  ],
  // The big idea: wholes, then pieces, then trade
  [
    ...two([0, 'Add']),
    write([0, 'wholes'], '1 + 1', WX + BW / 2, 270, 30),
    ...row([[[0, 'pieces'], ['1', '2']], [[0, 'pieces'], '+'], [[0, 'pieces'], ['3', '4']]], PX + BW / 2, 270, 28),
    ...row([[[0, 'trade'], ['4', '4'], 'y'], [[0, 'trade'], '→', 'y'], [[0, 'whole'], '1 more whole', 'y']], 300, 350, 28),
  ],
  // Add the wholes
  [
    ...bar([0, 'whole'], X, 50, W, 60, 1, 1), write([0, 'whole'], '1', 100, 80, 32, 'd'),
    ...bar([0, 'and'], X, 140, W, 60, 1, 1), write([0, 'and'], '1', 100, 170, 32, 'd'),
    write([0, 'make'], '1 + 1 =', 270, 270, 40), write([0, '2'], '2', 378, 270, 44, 'y'),
    box([1, 'Keep'], 353, 240, 50, 60, 'y'), write([1, 'later'], 'keep for later', 300, 350, 26, 'd'),
  ],
  // Add the pieces
  [
    ...bar([0, 'pieces'], X, 40, W, 55, 2, 1), ...row([[[0, 'pieces'], ['1', '2'], 'd']], 100, 67, 26),
    recut([0, 'Cut'], X, 40, W, 55, 2, 2), ...row([[[0, '2/4'], ['2', '4'], 'y']], 500, 67, 26),
    ...bar([0, 'pieces'], X, 120, W, 55, 4, 3), ...row([[[0, 'pieces'], ['3', '4'], 'd']], 100, 147, 26),
    ...row([[[1, '2'], ['2', '4']], [[1, '3'], '+'], [[1, '3'], ['3', '4']], [[1, 'make'], '='], [[1, '5'], ['5', '4'], 'y']], 300, 250, 40),
    write([2, '4'], '4 fourths = 1 whole', 300, 350, 28, 'd'),
  ],
  // Trade for a whole
  [
    ...bar([0, '4'], X, 40, W, 55, 4, 4), write([0, 'whole'], '= 1', 500, 67, 34, 'y'),
    ...bar([0, 'left'], X, 120, W, 55, 4, 1), ...row([[[0, 'left'], ['1', '4'], 'y']], 500, 147, 26),
    ...row([[[1, '2'], '2'], [[1, '2'], '+'], [[1, 'wholes'], '1'], [[1, 'wholes'], ['1', '4']], [[1, 'wholes'], '='],
      [[1, '3'], '3', 'y'], [[1, '3'], ['1', '4'], 'y']], 300, 260, 40),
    write([1, 'miles'], 'miles', 300, 350, 28, 'y'),
  ],
  // One thing not to do
  (() => {
    const B: At = [1, 'ADD'], wrong: Tok[] = [[B, ['1', '2'], 'r'], [B, '+', 'r'], [B, ['3', '4'], 'r'], [B, '=', 'r'], [B, ['4', '6'], 'r']]
    return [
      ...warn([0, 'mix']),
      ...row(wrong, 300, 180, 40), crossRow([1, 'not'], wrong, 300, 180, 3, 4, 40),
      ...row([[[2, 'match'], ['2', '4'], 'y'], [[2, 'match'], '+', 'y'], [[2, 'match'], ['3', '4'], 'y'], [[2, 'add'], '=', 'y'], [[2, 'add'], ['5', '4'], 'y']], 300, 320, 40),
    ]
  })(),
]
