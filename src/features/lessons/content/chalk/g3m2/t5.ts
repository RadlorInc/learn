/** g3m2-t5's chalkboards: index = screen index (0 is Screen 1, which has none). The jug holds 500 milliliters. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, cross, ring, wash } from '../../../chalk'
import { warn, type At } from '../g3m1/t1'

// A measuring jug, 0 to 1,000 mL: a mark every 100, a number every 200 on the right of it. The juice is a blue wash;
// blue writing is what ONE mark is worth, yellow is the reading.
interface J { x: number; top: number; bot: number; w: number }
const BIG: J = { x: 110, top: 45, bot: 365, w: 140 }
const y = (j: J, v: number) => Math.round(j.bot - 12 - (v / 1000) * (j.bot - j.top - 40))
const jug = ([beat, at]: At, j = BIG, labels = true): ChalkMark[] => [
  { beat, at, c: 'w', quick: true, d: `M${j.x} ${j.top} V${j.bot} H${j.x + j.w} V${j.top} M${j.x} ${j.top + 40} C${j.x - 50} ${j.top + 40} ${j.x - 50} ${j.top + 150} ${j.x} ${j.top + 150}` },
  { beat, at, c: 'w', w: 2.4, quick: true, d: Array.from({ length: 11 }, (_, i) => `M${j.x + j.w} ${y(j, i * 100)} h${i % 2 ? -12 : -20}`).join(' ') },
  ...(labels ? [0, 200, 400, 600, 800, 1000].map(v => ({ ...write([beat, at], String(v), j.x + j.w + 34, y(j, v), 22, 'd'), quick: true })) : []),
]
const juice = (a: At, v = 500, j = BIG): ChalkMark[] =>
  [wash(a, j.x + 3, y(j, v), j.w - 6, j.bot - 3 - y(j, v), 'b'), line(a, [[j.x + 3, y(j, v)], [j.x + j.w - 3, y(j, v)]], 'w', 3)]
const ringVal = (a: At, v: number, c: ChalkColor = 'y') => ring(a, BIG.x + BIG.w + 34, y(BIG, v), 26, 16, c)
/** A jump up the jug, from one mark to the next, just right of the numbers. */
const up = ([beat, at]: At, v1: number, v2: number, c: ChalkColor = 'b'): ChalkMark =>
  ({ beat, at, c, d: `M324 ${y(BIG, v1)} Q348 ${(y(BIG, v1) + y(BIG, v2)) / 2} 324 ${y(BIG, v2)} M318 ${y(BIG, v2) + 10} L324 ${y(BIG, v2)} L334 ${y(BIG, v2) + 6}` })

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // The top is between numbers
  [
    ...jug([0, 'Look']), ...juice([0, 'juice']), ringVal([0, '400'], 400, 'd'), ringVal([0, '600'], 600, 'd'),
    write([1, 'line'], '?', 300, y(BIG, 500), 26, 'y'),
    write([1, 'much'], 'how much?', 470, 150, 32),
    write([2, 'worth'], '1 mark = ?', 470, 250, 34, 'b'),
  ],
  // The big idea: what one mark is worth, then count up to the top
  [
    ...jug([0]), ...juice([0]),
    up([0, 'mark'], 0, 100), write([0, 'worth'], '1 mark = ?', 470, 130, 34, 'b'),
    ringVal([0, 'count'], 400), up([0, 'marks'], 400, 500, 'y'), write([0, 'top'], 'count up', 470, 250, 32, 'y'),
    write([0, 'top'], 'to the top', 470, 292, 32, 'y'),
  ],
  // What is one mark worth?
  [
    ...jug([0]), ...juice([0]),
    ringVal([0, '0'], 0), ringVal([0, '200'], 200),
    up([1, 'jumps'], 0, 100), up([1, 'jumps'], 100, 200), write([1, 'mark'], '2 jumps', 470, 80, 32, 'b'),
    write([2, 'make'], '2 jumps = 200', 470, 140, 30, 'b'),
    write([2, '100'], '100', 380, y(BIG, 50), 22, 'b'), write([2, '100'], '100', 380, y(BIG, 150), 22, 'b'),
    write([2, 'milliliters'], '1 mark = 100 mL', 470, 210, 30, 'b'), line([2, 'milliliters'], [[360, 235], [580, 235]], 'b', 2.5),
  ],
  // Count up to the top
  [
    ...jug([0]), ...juice([0]),
    ringVal([0, '400'], 400), write([0, '400'], '400', 470, 110, 36),
    up([1, 'mark'], 400, 500), write([1, 'mark'], '+ 100', 470, 165, 32, 'b'), write([1, '500'], '= 500', 470, 220, 36, 'y'),
    write([2, 'milliliters'], '500 mL', 470, 300, 40, 'y'), box([2, 'juice'], 395, 265, 150, 70, 'y'),
  ],
  // Milliliters or liters?
  [
    { beat: 0, at: 'cup', c: 'w', d: 'M95 90 L110 175 H170 L185 90 Z' }, wash([0, 'cup'], 111, 115, 58, 58, 'b'),
    write([0, 'milliliters'], 'milliliters', 140, 215, 30, 'y'),
    { beat: 1, at: 'bucket', c: 'w', d: 'M370 70 L390 190 H510 L530 70 Z M370 70 Q450 10 530 70' }, wash([1, 'bucket'], 392, 95, 116, 92, 'b'),
    write([1, 'liters'], 'liters', 450, 230, 32, 'y'),
    write([2, '1,000'], '1 L = 1,000 mL', 300, 330, 40, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...jug([1, 'number'], { x: 70, top: 130, bot: 370, w: 110 }, false), ...juice([1, 'number'], 500, { x: 70, top: 130, bot: 370, w: 110 }),
    write([1, '400'], '400 mL', 420, 180, 50, 'r'), cross([1, '400'], 335, 150, 170, 60),
    write([2, 'top'], 'up to the top', 420, 250, 28, 'd'), write([2, '500'], '500 mL', 420, 310, 50, 'y'),
  ],
]
