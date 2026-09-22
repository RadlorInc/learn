/** g3m6-t6's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'
import { eqn } from '../g3m1/t5to8'
import { poly, rectPts, type At, type Pt } from './t5'
// Colours across these boards: yellow = the walk around the edge and its total, blue = the side with no number, coral = the mix-up.

/** Sam's 5 ft by 3 ft garden, `u` px a foot, top-left at (x, y), with its side labels (`bottom` replaces the bottom one). */
const garden = (at: At, x: number, y: number, u: number, s = 26, bottom = '5 ft', c: ChalkColor = 'w'): ChalkMark[] => [
  poly(at, rectPts(x, y, 5, 3, u), c),
  ...([['5 ft', x + 2.5 * u, y - s], ['3 ft', x + 5 * u + s * 1.3, y + 1.5 * u], ['3 ft', x - s * 1.3, y + 1.5 * u]] as [string, number, number][])
    .map(([t, lx, ly]) => ({ ...write(at, t, lx, ly, s, 'd'), quick: true })),
  { ...write(at, bottom, x + 2.5 * u, y + 3 * u + s, s, bottom === '?' ? 'b' : 'd'), quick: true },
]
const trace = (at: At, pts: Pt[], c: ChalkColor = 'y') => ({ ...line(at, [...pts, pts[0]], c), w: 4.5 })

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Around the edge
  [
    ...garden([0, 'fence'], 175, 80, 50),
    line([0, 'across'], [[175, 155], [425, 155]], 'd', 2.5), cross([0, 'middle'], 285, 140, 30, 30),
    trace([1, 'around'], rectPts(175, 80, 5, 3, 50)),
    write([2, 'whole'], 'how long is the whole edge?', 300, 330, 30, 'y'),
  ],
  // The big idea: add every side
  [
    poly([0, 'shape'], rectPts(175, 60, 5, 3, 50)),
    trace([0, 'around'], rectPts(160, 45, 5.6, 3.6, 50)), arrow([0, 'around'], [420, 45], [440, 45], 'y'),
    ...([['side', 300, 85], ['side', 390, 135], ['side', 300, 185], ['side', 210, 135]] as [string, number, number][])
      .map(([t, x, y]) => ({ ...write([0, 'sides'], t, x, y, 24, 'd'), quick: true })),
    write([0, 'added'], 'side + side + side + side', 300, 300, 32),
  ],
  // Walk around
  [
    poly([0, 'walk'], rectPts(175, 100, 5, 3, 50)), ring([0, 'corner'], 175, 100, 11, 11, 'y'),
    write([1, '5'], '5 ft', 300, 60, 30), arrow([1, 'across'], [185, 82], [415, 82], 'y'),
    write([1, '3'], '3 ft', 482, 175, 30), arrow([1, 'down'], [443, 110], [443, 240], 'y'),
    write([2, '5'], '5 ft', 300, 292, 30), arrow([2, 'back'], [415, 268], [185, 268], 'y'),
    write([2, '3'], '3 ft', 118, 175, 30), arrow([2, 'up'], [157, 240], [157, 110], 'y'),
    ring([3, 'started'], 175, 100, 22, 22, 'y'),
  ],
  // Add every side
  [
    ...garden([0, 'side'], 210, 45, 36, 24),
    ...([['1', 300, 70], ['2', 367, 99], ['3', 300, 128], ['4', 233, 99]] as [string, number, number][])
      .map(([t, x, y]) => ({ ...write([1, '4'], t, x, y, 22, 'd'), quick: true })),
    write([1, "It's"], '4 sides', 300, 218, 28),
    ...eqn([2], ['5', '+', '3', '+', '5', '+', '3', '=', '16'], 300, 280, 40, 'w', { 7: 'y', 8: 'y' }).marks
      .map((m, i) => (i >= 7 ? { ...m, at: '16' } : m)),
    write([3, 'fence'], '16 feet of fence', 300, 350, 34, 'y'),
  ],
  // A side with no number
  [
    ...garden([0, 'side'], 175, 70, 50, 26, '?'),
    arrow([1, 'across'], [300, 125], [300, 82], 'd'), arrow([1, 'across'], [300, 170], [300, 208], 'd'),
    write([1, 'same'], 'same length', 300, 146, 24, 'd'),
    { ...line([2, 'top'], [[175, 70], [425, 70]], 'y'), w: 4.5 }, { ...line([2, 'bottom'], [[175, 220], [425, 220]], 'y'), w: 4.5 },
    write([2, 'bottom'], '? = 5 ft', 300, 330, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...garden([1, 'add'], 340, 150, 36, 22),
    { ...line([1, 'TWO'], [[340, 150], [520, 150], [520, 258]], 'r'), w: 4.5 },
    write([2, '8'], '5 + 3 = 8', 150, 204, 34, 'r'), cross([2, 'halfway'], 70, 184, 160, 40),
    trace([2, 'all'], [[349, 159], [511, 159], [511, 249], [349, 249]]),
    write([2, '16'], '5 + 3 + 5 + 3 = 16', 300, 345, 34, 'y'),
  ],
]
