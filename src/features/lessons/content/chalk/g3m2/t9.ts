/** g3m2-t9's chalkboards: index = screen index (0 is Screen 1, which has none). t8's columns, taking away. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, arrow, cross, cells } from '../../../chalk'
import { q, warn, type At } from './t6'
import { COL, ROW, stack, heads, digit, colRing, note, ones } from './t8'

/** A slash through the digit at (x, y): that digit is being changed. */
const slash = (at: At, x: number, y: number, c: ChalkColor = 'b'): ChalkMark => line(at, [[x - 16, y + 22], [x + 16, y - 22]], c)
/** The broken ten: the 5 tens slashed and a 4 above, the 2 ones slashed and a 12 above. */
const broken = (tensAt: At, onesAt: At): ChalkMark[] => [
  slash(tensAt, COL.T, ROW.a), write(tensAt, '4', COL.T, ROW.top, 30, 'b'),
  slash(onesAt, COL.O, ROW.a), write(onesAt, '12', COL.O + 4, ROW.top, 30, 'b'),
]
const setup = (at: At): ChalkMark[] => [...heads(at), ...stack(at, '352', '127', '−'), ...q(broken(at, at))]

// Colours as t8: yellow = a digit of the answer, blue = the broken ten (its 10 ones), dim = labels and the working,
// coral = the warning.
export const T9: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not enough ones
  [
    write([0, 'ones'], 'ones', 300, 40, 24, 'd'), write([0, '7'], 'take away 7', 300, 95, 36),
    ones([1, '2'], 268, 195, 2, 'w', 64, 44), write([1, 'only'], 'only 2', 470, 195, 30, 'd'),
    write([1, 'take'], '7 from 2 ?', 300, 300, 40, 'r'), cross([1, 'No'], 200, 270, 200, 60),
  ],
  // The big idea
  [
    ones([0, 'ones'], 440, 300, 2), write([0, 'enough'], 'not enough', 456, 250, 24, 'd'),
    cells([0, 'ten'], 110, 60, 320, 34, 10, 'b'), write([0, 'ten'], '1 ten', 510, 77, 30, 'b'),
    arrow([0, 'into'], [270, 110], [270, 250], 'b'),
    ones([0, '10'], 80, 300, 10, 'b'), write([0, '10'], '10 ones', 224, 355, 26, 'b'),
  ],
  // Break a ten
  [
    ...stack([0, '352'], '352', '127', '−').slice(0, 3), ...stack([0, '127'], '352', '127', '−').slice(3),
    ...heads([0, 'ones']), colRing([0, 'ones'], 'O'),
    ...broken([1, '5'], [2, '12']).slice(0, 1), { ...broken([1, '4'], [2, '12'])[1] },
    note([2, '10'], '1 ten = 10 ones', 110, 'd', 26), note([2, 'make'], '10 + 2 = 12', 160, 'b', 26),
    ...broken([1, '5'], [2, '12']).slice(2),
  ],
  // Take away the ones and tens
  [
    ...setup([0, 'Now']),
    note([0, '5'], '12 − 7 = 5', 110), digit([0, 'Write'], '5', 'O'),
    ring([1, 'Tens'], COL.T, (ROW.top + ROW.b) / 2, 28, 88, 'w'),
    note([1, '2'], '4 − 2 = 2', 160), digit([1, '2'], '2', 'T'),
  ],
  // Take away the hundreds
  [
    ...setup([0, 'Last']), ...q([digit([0, 'Last'], '5', 'O'), digit([0, 'Last'], '2', 'T')]),
    colRing([0, 'hundreds'], 'H'), note([0, '2'], '3 − 1 = 2', 110), digit([0, '2'], '2', 'H'),
    ring([1, '225'], COL.T, ROW.ans, 92, 32, 'y'), write([1, 'stickers'], '225 stickers', 270, 350, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'FLIP'], '7 − 2', 180, 165, 44, 'r'), cross([1, '2'], 115, 135, 130, 60),
    write([1, 'away'], 'take away 7', 440, 165, 32),
    write([2, '12'], '12 − 7', 300, 255, 44, 'y'),
    write([2, '225'], '352 − 127 = 225', 300, 340, 40, 'y'),
  ],
]
