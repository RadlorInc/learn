/** g5m4-t2's chalkboards: index = screen index (0 is Screen 1, which has none). t1's decimal chart, two rows. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross, arrow } from '../../../chalk'
import { q, warn, heads, grid, dig, numAt, CX, type At } from './t1'

/** The chart with 0.4 over 0.389, each row headed by its number; digits come separately. */
const chart = (at: At, y: number): ChalkMark[] => [...heads(at, y - 20), ...q([...grid(at, y), ...grid(at, y + 60)])]
const labels = (at: At, y: number): ChalkMark[] => q([write(at, '0.4', 65, y + 30, 26), write(at, '0.389', 65, y + 90, 26)])
const top = (at: At, y: number, c: ChalkColor = 'w') => q([dig(at, '0', 0, y + 30, c), dig(at, '4', 1, y + 30, c)])
const low = (at: At, y: number, c: ChalkColor = 'w') => q(['0', '3', '8', '9'].map((d, i) => dig(at, d, i, y + 90, c)))
const zeros = (at: At, y: number) => q([dig(at, '0', 2, y + 30, 'b'), dig(at, '0', 3, y + 30, 'b')])
/** A ring round one column, both rows. */
const colRing = (at: At, i: number, y: number, c: ChalkColor): ChalkMark => ring(at, CX[i], y + 60, 40, 68, c)

// Colours: yellow = the place that decides and the answer, blue = zeros put in empty places, coral = the look-alike trap.
export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // More digits, bigger?
  [
    ...numAt([0, '0.389'], '0.389', 360, 80, 48),
    ring([0, 'digits'], 432, 80, 50, 34, 'b'),
    write([0, 'than'], '389 > 4', 300, 150, 30, 'd'), ...numAt([0, '4'], '0.4', 150, 80, 48),
    write([1, 'bigger'], 'bigger?', 430, 205, 30, 'r'),
    write([2, 'point'], '3 tenths, 8 hundredths, 9 thousandths', 300, 290, 24),
    write([2, 'whole'], 'not 389', 300, 345, 30, 'r'),
  ],
  // The big idea: line up, compare from the left, the first different place decides
  [
    ...chart([0, 'Line'], 80), ...labels([0, 'Line'], 80),
    ...top([0, 'places'], 80), ...low([0, 'places'], 80),
    arrow([0, 'left'], [130, 240], [530, 240], 'd'),
    colRing([0, 'different'], 1, 80, 'y'),
  ],
  // Line up the places
  [
    ...chart([0, 'chart'], 80), ...labels([0, 'numbers'], 80), ...top([0, 'under'], 80), ...low([0, 'under'], 80),
    ring([1, 'no'], 435, 110, 96, 26, 'r'), ...zeros([1, 'zeros'], 80),
    ...numAt([2, '0.400'], '0.4', 160, 285, 44), write([2, '0.400'], '=', 250, 285, 44),
    ...numAt([2, '0.400'], '0.400', 310, 285, 44, 'b'),
    write([2, 'amount'], 'the same amount', 300, 345, 26, 'd'),
  ],
  // Go from the left
  [
    ...chart([0, 'Start'], 70), ...labels([0, 'Start'], 70), ...top([0, 'Start'], 70), ...low([0, 'Start'], 70), ...zeros([0, 'Start'], 70),
    arrow([0, 'left'], [130, 225], [530, 225], 'd'),
    colRing([0, 'ones'], 0, 70, 'd'), write([0, 'match'], '0 = 0', CX[0], 265, 26, 'd'),
    colRing([1, 'tenths'], 1, 70, 'y'), write([1, 'No'], '4 ≠ 3', CX[1], 265, 26, 'y'),
    write([2, 'decide'], 'the tenths decide', 300, 335, 32, 'y'),
  ],
  // Say it with a sign
  [
    write([0, '4'], '4 tenths', 150, 70, 34), write([0, 'more'], '>', 300, 70, 38), write([0, '3'], '3 tenths', 450, 70, 34),
    write([1, 'write'], '0.4 > 0.389', 300, 165, 48, 'y'),
    { ...line([2, 'first'], [[80, 265], [480, 265]], 'y'), w: 7 }, write([2, 'first'], '0.4 m', 535, 265, 22, 'y'),
    { ...line([2, 'snail'], [[80, 315], [469, 315]], 'd'), w: 7 }, write([2, 'snail'], '0.389 m', 530, 315, 22, 'd'),
    write([2, 'wins'], 'the first snail wins', 280, 365, 26, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'number'], '0.389 > 0.4', 300, 160, 44, 'r'), cross([1, 'MORE'], 175, 130, 250, 60),
    ...numAt([2, 'Line'], '0.400', 240, 232, 40), ...numAt([2, 'Line'], '0.389', 240, 284, 40),
    ring([2, 'left'], 282, 258, 15, 46, 'y'),
    write([2, 'left'], '0.4 > 0.389', 300, 350, 40, 'y'),
  ],
]
