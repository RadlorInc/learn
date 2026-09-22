/** g4m3-t5's chalkboards: index = screen index (0 is Screen 1, which has none). Lengths/answers yellow, the ÷ 4 blue. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, ring } from '../../../chalk'

type At = [number, string?]
export const q = (ms: ChalkMark | ChalkMark[]): ChalkMark[] => (Array.isArray(ms) ? ms : [ms]).map(m => ({ ...m, quick: true }))
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]

// The rug, 4 feet wide, cut 4 : 1 into an 80 piece (x 120–408) and a 4 piece (x 408–480).
const rug = (at: At, y: number, h: number, cut: boolean, parts: boolean): ChalkMark[] => [
  box(at, 120, y, 360, h), write(at, '4 ft', 80, y + h / 2, 24, 'd'),
  ...(cut ? [line(at, [[408, y], [408, y + h]])] : []),
  ...(parts ? [write(at, '80', 264, y + h / 2, 34), write(at, '4', 444, y + h / 2, 34)] : []),
]

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not a fact you know
  [
    box([0, 'rug'], 120, 70, 360, 100), write([0, 'rug'], '84 sq ft', 300, 120, 30),
    write([0, 'wide'], '4 ft', 80, 120, 24, 'd'), write([0, 'length'], '? ft', 300, 45, 24, 'd'),
    write([0, '84'], 'length = 84 ÷ 4', 300, 225, 32),
    write([1, 'heart'], 'not a fact you know', 300, 285, 26, 'd'),
    write([2, 'big'], 'too big for one go', 300, 345, 28, 'r'),
  ],
  // The big idea: cut, divide each part, add
  [
    box([0, 'Break'], 120, 70, 360, 100), line([0, 'parts'], [[408, 70], [408, 170]], 'y'),
    arrow([0, 'divide'], [264, 175], [264, 235], 'b'), write([0, 'divide'], '÷ 4', 310, 205, 24, 'b'),
    arrow([0, 'divide'], [444, 175], [444, 235], 'b'), write([0, 'divide'], '÷ 4', 490, 205, 24, 'b'),
    write([0, 'add'], '?', 264, 265, 36, 'y'), write([0, 'add'], '+', 354, 265, 36, 'y'), write([0, 'add'], '?', 444, 265, 36, 'y'),
    write([0, 'answers'], '= the length', 354, 330, 30, 'y'),
  ],
  // Break 84 apart
  [
    write([0, '84'], '84', 190, 60, 36), write([0, '80'], '= 80 + 4', 300, 60, 36),
    write([1, 'share'], 'both share by 4 easily', 300, 115, 24, 'd'),
    box([2, 'rug'], 120, 170, 360, 110), write([2, 'rug'], '4 ft', 80, 225, 24, 'd'),
    line([2, 'cut'], [[408, 170], [408, 280]], 'y'),
    write([2, '80'], '80', 264, 225, 34), write([2, '4'], '4', 444, 225, 34),
  ],
  // Divide each part
  [
    ...q(rug([0, 'Share'], 80, 90, true, true)),
    write([1, '20'], '80 ÷ 4 = 20', 264, 230, 32), write([1, 'because'], '4 × 20 = 80', 264, 275, 24, 'd'),
    write([2, '1'], '4 ÷ 4 = 1', 470, 230, 32),
    write([3, '20'], '20 ft', 264, 50, 26, 'y'), write([3, 'foot'], '1 ft', 444, 50, 26, 'y'),
  ],
  // Add the lengths
  [
    ...q(rug([0, 'Now'], 80, 90, true, true)), ...q([write([0, 'Now'], '20 ft', 264, 50, 26, 'y'), write([0, 'Now'], '1 ft', 444, 50, 26, 'y')]),
    { beat: 0, at: 'together', c: 'w', d: 'M120 185 v20 M480 185 v20 M120 195 H480 M132 187 L120 195 L132 203 M468 187 L480 195 L468 203' },
    write([1, '20'], '20 + 1 =', 270, 250, 36), write([1, '21'], '21', 375, 250, 36, 'y'),
    write([2, '84'], '84 ÷ 4 = 21', 300, 310, 34, 'y'), write([2, 'long'], 'the rug is 21 ft long', 300, 360, 26, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '80'], '80 ÷ 4 = 20', 180, 170, 30), write([1, 'FORGET'], '4', 420, 170, 34, 'r'), ring([1, 'FORGET'], 420, 170, 22, 26, 'r'),
    write([2, '24'], '20 + 4 = 24', 180, 250, 30, 'r'), cross([2, 'long'], 90, 230, 180, 40),
    write([2, 'shared'], '4 ÷ 4 = 1', 420, 250, 30),
    write([2, '21'], '20 + 1 = 21', 300, 330, 36, 'y'),
  ],
]
