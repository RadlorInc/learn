/** g3m2-t4's chalkboards: index = screen index (0 is Screen 1, which has none). The apples weigh 700 grams. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, cross, ring, hand, onClock } from '../../../chalk'
import { dots, warn, type At } from '../g3m1/t1'

// A kitchen-scale dial, 0 to 1,000 grams round 300°: a mark every 100, a number every 200. Blue is what ONE mark is
// worth; yellow is the reading. The dial sits on the left; words go on the right (x ≈ 470).
const DX = 190, DY = 215, DR = 140
const pos = (v: number) => v / 100 - 5          // clock position of a value: 0 at seven o'clock, 1,000 at five
const at = (v: number, r: number) => onClock(DX, DY, r, pos(v))
export const dial = ([beat, w]: At): ChalkMark[] => [
  { beat, at: w, c: 'w', quick: true, d: `M${DX - DR} ${DY} a${DR} ${DR} 0 1 0 ${DR * 2} 0 a${DR} ${DR} 0 1 0 ${-DR * 2} 0 M${DX - 3} ${DY} h6` },
  { beat, at: w, c: 'w', w: 2.4, quick: true, d: Array.from({ length: 11 }, (_, i) => `M${at(i * 100, DR - 4).join(' ')} L${at(i * 100, DR - (i % 2 ? 16 : 24)).join(' ')}`).join(' ') },
  ...[0, 200, 400, 600, 800, 1000].map(v => ({ ...write([beat, w], String(v), ...at(v, DR - 48), 22, 'd'), quick: true })),
]
const needle = (a: At, v = 700) => hand(a, DX, DY, pos(v), DR - 22, 'w', 4)
const ringVal = (a: At, v: number, c: ChalkColor = 'y') => ring(a, ...at(v, DR - 48), 26, 18, c)
/** A jump just outside the rim, from one mark to the next. */
const jump = ([beat, w]: At, v1: number, v2: number, c: ChalkColor = 'b'): ChalkMark => {
  const [x1, y1] = at(v1, DR + 8), [x2, y2] = at(v2, DR + 8), [qx, qy] = at((v1 + v2) / 2, DR + 30)
  return { beat, at: w, c, d: `M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}` }
}

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not every mark has a number
  [
    ...dial([0, 'Look']), needle([0, 'needle']), ringVal([0, '600'], 600, 'd'), ringVal([0, '800'], 800, 'd'),
    write([1, 'there'], '?', ...at(700, DR + 26), 34, 'y'),
    write([1, 'say'], 'how heavy?', 470, 150, 32),
    write([2, 'worth'], '1 mark = ?', 470, 250, 34, 'b'),
  ],
  // The big idea: what one mark is worth, then count to the needle
  [
    ...dial([0]), needle([0]),
    jump([0, 'mark'], 0, 100), write([0, 'worth'], '?', ...at(50, DR + 34), 26, 'b'), write([0, 'worth'], '1 mark = ?', 470, 150, 34, 'b'),
    ringVal([0, 'count'], 600), jump([0, 'marks'], 600, 700, 'y'), write([0, 'needle'], 'count to', 470, 250, 32, 'y'),
    write([0, 'needle'], 'the needle', 470, 292, 32, 'y'),
  ],
  // What is one mark worth?
  [
    ...dial([0]), needle([0], 700),
    ringVal([0, '0'], 0), ringVal([0, '200'], 200),
    jump([1, 'jumps'], 0, 100), jump([1, 'jumps'], 100, 200), write([1, 'mark'], '2 jumps', 470, 120, 32, 'b'),
    write([2, 'make'], '2 jumps = 200', 470, 200, 30, 'b'),
    write([2, '100'], '100', ...at(50, DR + 36), 22, 'b'), write([2, '100'], '100', ...at(150, DR + 36), 22, 'b'),
    write([2, 'grams'], '1 mark = 100 g', 470, 280, 32, 'b'), line([2, 'grams'], [[365, 305], [575, 305]], 'b', 2.5),
  ],
  // Count to the needle
  [
    ...dial([0]), needle([0]),
    ringVal([0, '600'], 600), write([0, '600'], '600', 470, 110, 36),
    jump([1, 'mark'], 600, 700), write([1, '100'], '+ 100', 470, 165, 32, 'b'), write([1, '700'], '= 700', 470, 220, 36, 'y'),
    write([2, 'grams'], '700 grams', 470, 300, 38, 'y'), box([2, 'grams'], 380, 265, 180, 70, 'y'),
  ],
  // Grams or kilograms?
  [
    dots([0, 'apples'], [[110, 120], [140, 112], [170, 120], [125, 145], [155, 145]], 14), write([0, 'grams'], 'grams', 140, 200, 32, 'y'),
    // a dog: body, legs, tail, then its head, ear and nose
    { beat: 1, at: 'dog', c: 'w', d: 'M370 120 H490 Q505 120 505 135 V150 Q505 165 490 165 H370 Q355 165 355 150 V135 Q355 120 370 120 Z'
      + ' M372 165 v38 M395 165 v38 M465 165 v38 M488 165 v38 M357 128 Q335 118 330 92' },
    { ...ring([1, 'dog'], 522, 106, 24, 20), quick: true },
    { beat: 1, at: 'dog', c: 'w', d: 'M506 94 L500 70 L520 86 M545 110 h4' },
    write([1, 'kilograms'], 'kilograms', 440, 250, 32, 'y'),
    write([2, '1,000'], '1 kg = 1,000 g', 300, 335, 40, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'gram'], '1 mark = 1 g', 160, 170, 30, 'r'), write([1, '601'], '600 + 1 = 601', 430, 170, 30, 'r'),
    cross([1, '601'], 60, 150, 200, 40), cross([1, '601'], 325, 150, 210, 40),
    write([2, 'grams'], '1 mark = 100 g', 160, 280, 30, 'y'), write([2, '700'], '600 + 100 = 700', 430, 280, 30, 'y'),
  ],
]
