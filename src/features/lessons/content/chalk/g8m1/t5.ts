/** g8m1-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The number written digit by digit, 52 apart, so the point and its jumps can be drawn between digits.
 *  Colours: the point, the jumps' count and the result yellow · each × 10 blue · the mix-up coral · labels dim. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, hop } from '../../../chalk'
import { expr, warn, strike } from './t1'

type At = [beat: number, at?: string]
const quick = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))
/** Digits spaced 52 apart from x0, at y. */
const digits = (at: At, ds: string, x0: number, y: number, c: ChalkColor = 'w'): ChalkMark[] =>
  [...ds].map((d, i) => write(at, d, x0 + 52 * i, y, 52, c))
/** The decimal point: a filled dot. */
const point = ([beat, at]: At, x: number, y: number): ChalkMark[] =>
  [{ beat, at, c: 'y', w: 7, d: `M${x - 2.5} ${y} a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0` }]

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Which is bigger? You have to count the zeros
  [
    write([0, '150,000,000'], '150,000,000', 280, 90, 48), write([0, '15,000,000?'], '15,000,000', 280, 180, 48),
    write([1, 'zeros'], '7 zeros', 510, 90, 24, 'd'), write([1, 'zeros'], '6 zeros', 510, 180, 24, 'd'),
    write([2, 'one'], 'one zero less', 300, 280, 30, 'r'), write([2, 'small'], '10 times smaller', 300, 335, 30, 'r'),
  ],
  // The big idea: a number from 1 up to 10, times 10 with the jumps as the exponent
  [
    write([0, 'big'], '150,000,000', 300, 80, 44),
    write([0, 'up'], '1.5', 230, 200, 48, 'y'), write([0, 'up'], '1 up to 10', 230, 260, 22, 'd'),
    ...expr([0, 'power'], [['×', 'b'], ['10^8', 'b']], 330, 200, 48),
    write([0, 'places'], '8 places', 380, 260, 24, 'y'),
    write([0, 'moved'], 'the point moved', 300, 340, 26, 'd'),
  ],
  // Make a number from 1 up to 10: the point goes after the first digit
  [
    ...digits([0, 'First'], '150000000', 90, 110), write([0, '10.'], 'from 1 up to 10', 300, 40, 24, 'd'),
    arrow([1, 'point'], [116, 190], [116, 150], 'y'), ...point([1, 'Right'], 116, 130),
    write([1, 'first'], 'after the first digit', 230, 215, 24, 'd'),
    arrow([2, 'becomes'], [300, 250], [300, 280], 'd'), write([2, '1.5.'], '1.5', 300, 330, 56, 'y'),
  ],
  // Count the jumps: 8 places, each one × 10
  [
    ...quick([...digits([0, 'Now'], '150000000', 90, 150), ...point([0, 'Now'], 116, 170)]),
    write([0, 'end'], 'end', 545, 200, 22, 'd'),
    ...Array.from({ length: 8 }, (_, i) => {
      const n = String(i + 1), x = 116 + 52 * i
      return [hop([1, n], x, x + 52, 118, 'y'), write([1, n], n, x + 26, 70, 24, 'y')]
    }).flat(),
    write([1, 'places'], '8 places', 150, 235, 28, 'y'), write([1, '10.'], '× 10 each jump', 420, 235, 28, 'b'),
    ...expr([2, 'So'], ['150,000,000', '=', ['1.5', 'y'], ['×', 'y'], ['10^8', 'y']], 300, 320, 40),
  ],
  // A smaller one: 4,200
  [
    ...digits([0, '4,200.'], '4200', 222, 120),
    ...point([1, 'point'], 248, 140), write([1, '4.2.'], '4.2', 300, 210, 44, 'y'),
    ...[0, 1, 2].map(i => hop([2, 'jumps'], 248 + 52 * i, 300 + 52 * i, 88, 'y')),
    write([2, '3'], '3 places', 480, 70, 26, 'y'),
    ...expr([2, 'so'], ['4,200', '=', ['4.2', 'y'], ['×', 'y'], ['10^3', 'y']], 300, 310, 44),
  ],
  // One thing not to do: counting every digit
  [
    ...warn([0, 'mix']),
    write([1, 'ALL'], '150,000,000', 300, 140, 40), write([1, '9'], '9 digits', 500, 140, 24, 'r'),
    ...expr([1, 'not'], ['=', '1.5', '×', '10^9'], 300, 205, 40).map(m => ({ ...m, c: 'r' as const })),
    ...strike([1, '10⁹.'], 205, 395, 205),
    line([2, 'after'], [[222, 165], [410, 165]], 'y'), write([2, '8,'], '8 digits', 515, 205, 24, 'y'),
    ...expr([2, "it's"], ['=', '1.5', '×', ['10^8', 'y']], 300, 300, 44),
  ],
]
