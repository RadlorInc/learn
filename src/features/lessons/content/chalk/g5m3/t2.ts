/**
 * g5m3-t2's chalkboards: index = screen index (0 is Screen 1, which has none).
 * Colours: white = the 12 stickers and their parts, blue = one part, yellow = the parts you give and the result,
 * coral = the mistake, dim = labels. Every part holds exactly 4 stickers and is exactly a third of the strip.
 */
import type { ChalkMark } from '../../../chalk'
import { write, box, ring, cross } from '../../../chalk'
import { dots } from '../g3m1/t1'
import { shade, cut, fr, expr, warn, type At } from '../g4m4/t1'

/** 12 stickers in a strip x..x+w, y..y+h: the outline and the stickers, 4 to every third. */
const strip = (at: At, x: number, y: number, w: number, h: number, r = 10): ChalkMark[] => [
  { ...box(at, x, y, w, h), quick: true },
  dots(at, Array.from({ length: 12 }, (_, i) => [x + (w / 12) * (i + 0.5), y + h / 2] as [number, number]), r),
]
const thirds = (at: At, x: number, y: number, w: number, h: number): ChalkMark[] =>
  [1, 2].map(k => cut(at, x + (w * k) / 3, y - 8, y + h + 8, 'w'))

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not 2, and not 3
  [
    ...fr([0, '2/3'], '2/3', 60, 95, 30), write([0, '12'], 'of 12', 150, 95, 28),
    ...strip([0, '12'], 210, 70, 360, 50),
    write([0, '2'], '2 stickers?', 170, 190, 28, 'r'), write([0, '3'], '3 stickers?', 430, 190, 28, 'r'),
    cross([1, 'No'], 90, 165, 160, 50), cross([1, 'No'], 350, 165, 160, 50),
    ...expr([1, 'part'], '2/3 is a part of all 12', 300, 270, 28),
    write([2, 'part'], 'how big is one part?', 300, 355, 30),
  ],
  // The big idea: cut 12 into 3 equal parts, take 2
  [
    ...expr([0, '2/3'], '2/3 of 12', 300, 60, 36),
    ...strip([0, '12'], 60, 140, 480, 70, 12),
    ...thirds([0, 'cut'], 60, 140, 480, 70),
    write([0, 'parts'], '3 equal parts', 300, 250, 24, 'd'),
    shade([0, 'take'], 60, 140, 480, 70, 3, 2, 0, 'y'),
    write([0, 'them'], 'take 2', 220, 310, 32, 'y'),
  ],
  // Cut into 3 equal parts
  [
    ...fr([0, 'bottom'], '2/3', 70, 110, 44), ring([0, '3'], 70, 138, 24, 24, 'b'),
    write([0, 'parts'], 'how many parts', 70, 190, 20, 'b'),
    ...strip([1, 'stickers'], 150, 80, 420, 60),
    ...thirds([1, 'parts'], 150, 80, 420, 60),
    shade([2, 'part'], 150, 80, 420, 60, 3, 1),
    ...[0, 1, 2].map(k => ({ ...write([2, '4'], '4', 220 + 140 * k, 175, 28, 'b'), quick: k < 2 })),
    ...expr([2, '4'], '12 ÷ 3 = 4', 330, 290, 44),
  ],
  // Take 2 parts
  [
    ...strip([0, 'Now'], 150, 80, 420, 60), ...thirds([0, 'Now'], 150, 80, 420, 60),
    ...[0, 1, 2].map(k => ({ ...write([0, 'Now'], '4', 220 + 140 * k, 175, 28, 'd'), quick: true })),
    ...fr([0, 'top'], '2/3', 70, 110, 44), ring([0, '2'], 70, 83, 24, 24, 'y'),
    write([0, 'give'], 'parts to give', 70, 190, 20, 'y'),
    shade([1, 'Give'], 150, 80, 420, 60, 3, 2, 0, 'y'),
    write([1, '8'], '4 + 4 = 8', 360, 240, 32),
    ...expr([2, '8'], '2/3 of 12 = 8', 300, 320, 44, 'y'),
  ],
  // Two steps, every time
  [
    ...fr([0, 'two'], '2/3', 300, 70, 44),
    write([1, 'Divide'], '1.  ÷ the bottom → one part', 190, 180, 26),
    ...expr([1, '4'], '12 ÷ 3 = 4', 470, 180, 32),
    write([2, 'multiply'], '2.  × the top → the parts', 190, 280, 26),
    ...expr([2, '8'], '2 × 4 = 8', 470, 280, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...expr([1, 'STOP'], '2/3 of 12 = 4', 160, 180, 34, 'r'),
    cross([1, 'part'], 50, 140, 220, 80),
    { ...box([2, '1/3'], 60, 250, 200, 36), quick: true }, shade([2, '1/3'], 60, 250, 200, 36, 3, 1),
    ...[1, 2].map(k => cut([2, '1/3'], 60 + (200 * k) / 3, 244, 292, 'w')),
    write([2, '1/3'], 'only 1 part', 160, 320, 22, 'b'),
    ...expr([2, '8'], '2/3 of 12 = 8', 440, 180, 34, 'y'),
    { ...box([2, '8'], 340, 250, 200, 36), quick: true }, shade([2, '8'], 340, 250, 200, 36, 3, 2, 0, 'y'),
    ...[1, 2].map(k => cut([2, '8'], 340 + (200 * k) / 3, 244, 292, 'w')),
    write([2, '8'], '2 parts', 440, 320, 22, 'y'),
  ],
]
