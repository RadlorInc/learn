/** g8m1-t2's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: the top 2s white, the bottom 2s blue · what is left and the results yellow · the mix-up coral · labels dim. */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, ring } from '../../../chalk'
import { expr, warn, before, tick, strike } from './t1'

// Five 2s on top at s = 44 centred on 300 (2s at 168, 234, 300, 366, 432); three on the bottom centred on 234, so its
// 2s sit right under the first three on top (168, 234, 300).
const TOP: Parameters<typeof expr>[1] = ['2', '×', '2', '×', '2', '×', '2', '×', '2']
const BOT: Parameters<typeof expr>[1] = [['2', 'b'], ['×', 'b'], ['2', 'b'], ['×', 'b'], ['2', 'b']]
const quick = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Dividing the small numbers does not even give a whole number
  [
    ...expr([0, 'Could'], ['2^5', '÷', ['2^3', 'b']], 300, 70, 48),
    write([0, 'divide'], '5 ÷ 3 ?', 300, 150, 40, 'r'),
    write([1, 'whole'], 'not a whole number', 300, 205, 28, 'r'), ...strike([1, 'it'], 225, 375, 150),
    write([2, '32'], '32 ÷ 8', 150, 310, 40),
    ...expr([2, 'help'], ['2^20', '÷', '2^17', '=', ['?', 'r']], 410, 310, 44),
  ],
  // The big idea: top over bottom, the base kept, top minus bottom
  [
    ...expr([0, 'divide'], ['2^5'], 180, 120, 56), line([0, 'divide'], [[130, 160], [230, 160]]),
    ...expr([0, 'divide'], [['2^3', 'b']], 180, 215, 56),
    arrow([0, 'keep'], [255, 165], [320, 165], 'd'), write([0, 'keep'], '2', 380, 180, 72, 'y'),
    write([0, 'subtract'], '5 − 3', 450, 145, 36, 'y'),
    write([0, 'top'], 'top', 80, 110, 22, 'd'), write([0, 'bottom'], 'bottom', 70, 215, 22, 'd'),
  ],
  // Write it as a fraction: five 2s over three 2s
  [
    ...expr([0, 'division'], ['2^5', '÷', ['2^3', 'b']], 300, 60, 40), line([0, 'fraction'], [[140, 200], [460, 200]]),
    ...expr([1, 'Five'], TOP, 300, 160, 44), write([1, 'Five'], 'five 2s', 530, 160, 22, 'd'),
    ...expr([2, 'three'], BOT, 234, 250, 44), write([2, 'three'], 'three 2s', 530, 250, 22, 'b'),
  ],
  // Cancel in pairs: 3 pairs go, 2 twos are left on top
  [
    ...quick(expr([0, 'Now'], TOP, 300, 90, 44)), line([0, 'Now'], [[140, 130], [460, 130]]), ...quick(expr([0, 'Now'], BOT, 234, 175, 44)),
    ring([0, 'pair'], 168, 132, 24, 64, 'b'), write([0, '1'], '2 ÷ 2 = 1', 470, 185, 30, 'd'),
    line([1, 'cancel'], [[152, 108], [184, 70]], 'd'), line([1, 'cancel'], [[218, 108], [250, 70]], 'd'), line([1, 'cancel'], [[284, 108], [316, 70]], 'd'),
    line([1, 'cancel'], [[152, 193], [184, 155]], 'd'), line([1, 'cancel'], [[218, 193], [250, 155]], 'd'), line([1, 'cancel'], [[284, 193], [316, 155]], 'd'),
    ring([1, 'left'], 399, 88, 52, 30, 'y'),
    write([2, "That's"], '5 − 3 = 2', 300, 255, 34, 'y'),
    ...expr([2, 'so'], ['2^5', '÷', ['2^3', 'b'], '=', ['2^2', 'y', '2²']], 300, 335, 44),
  ],
  // Check it: 4 teams — then any base
  [
    ...expr([0, '2²'], ['2^2', '=', '4'], 150, 70, 44), write([0, 'too'], '32 ÷ 8 = 4', 400, 70, 40),
    tick([0, 'So'], 540, 75), write([0, 'teams'], '4 teams', 300, 150, 40, 'y'),
    ...before(expr([1, 'base'], ['7^6', '÷', ['7^2', 'b'], '=', ['7^4', 'y', '7⁴']], 300, 260, 48), 2),
    write([1, 'because'], '6 − 2 = 4', 300, 335, 34, 'y'),
  ],
  // One thing not to do: dividing the small numbers
  [
    ...warn([0, 'mix']),
    ...expr([1, '2⁶'], ['2^6', '÷', '2^3', '=', '2^2'], 300, 170, 48).map(m => ({ ...m, c: 'r' as const })),
    ...strike([1, 'not'], 192, 408, 168),
    write([2, 'instead'], '6 − 3 = 3', 300, 250, 34, 'y'),
    ...expr([2, "it's"], ['2^6', '÷', ['2^3', 'b'], '=', ['2^3', 'y']], 300, 325, 48),
  ],
]
