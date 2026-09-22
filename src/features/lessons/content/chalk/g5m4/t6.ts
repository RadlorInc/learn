/** g5m4-t6's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, ring, clock } from '../../../chalk'

type At = [number, string?]
type C = 'w' | 'y' | 'b' | 'r' | 'd'
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
/** A number written in fixed place columns, its point at x = `px` (a number with no point ends just left of px). */
const dec = (at: At, t: string, px: number, y: number, s = 38, c: C = 'w'): ChalkMark[] => {
  const step = s * 0.55, p = t.includes('.') ? t.indexOf('.') : t.length
  return [...t].map((ch, i) => ({ ...write(at, ch, i === p ? px : i < p ? px - step * (p - i - 0.4) : px + step * (i - p - 0.4), y, s, c), quick: true }))
}

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding takes a while
  [
    write([0, '1.25'], '1.25 + 1.25 + 1.25', 300, 70, 32), write([0, 'three'], '3 times', 300, 115, 24, 'd'),
    write([1, '9'], '1.25 + 1.25 + 1.25 + 1.25 + 1.25', 300, 180, 26, 'd'),
    write([1, 'them'], '+ 1.25 + 1.25 + 1.25 + 1.25', 300, 220, 26, 'd'), write([1, 'them'], '9 times', 300, 262, 24, 'd'),
    clock([2, 'faster'], 200, 330, 28), write([2, 'faster'], 'faster way?', 360, 330, 32, 'y'),
  ],
  // The big idea: break into parts, multiply each, add
  [
    box([0, 'Break'], 80, 60, 440, 60),
    line([0, 'wholes'], [[260, 60], [260, 120]]), write([0, 'wholes'], 'wholes', 170, 90, 26),
    line([0, 'tenths'], [[390, 60], [390, 120]]), write([0, 'tenths'], 'tenths', 325, 90, 24),
    write([0, 'hundredths'], 'hundredths', 455, 90, 22),
    ...[170, 325, 455].flatMap(x => [arrow([0, 'multiply'], [x, 130], [x, 185]), write([0, 'multiply'], '×', x, 210, 34)]),
    line([0, 'add'], [[170, 240], [300, 295]], 'y'), line([0, 'add'], [[325, 240], [300, 295]], 'y'), line([0, 'add'], [[455, 240], [300, 295]], 'y'),
    write([0, 'add'], '+ add them', 300, 330, 30, 'y'),
  ],
  // Break 1.25 apart
  [
    ...dec([0, '1.25'], '1.25', 300, 70, 48),
    line([1, 'whole'], [[276, 100], [170, 140]], 'd', 2), write([1, 'whole'], '1 whole', 150, 160, 26),
    line([1, 'tenths'], [[329, 100], [320, 140]], 'd', 2), write([1, 'tenths'], '2 tenths', 320, 160, 26),
    line([1, 'hundredths'], [[358, 100], [470, 140]], 'd', 2), write([1, 'hundredths'], '5 hundredths', 480, 160, 26),
    write([2, '1.25'], '1.25 =', 140, 260, 34), write([2, '1'], '1', 215, 260, 34),
    write([2, '0.2'], '+ 0.2', 290, 260, 34), write([2, '0.05'], '+ 0.05', 410, 260, 34),
  ],
  // Multiply each part
  [
    ...dec([0, 'part'], '1', 250, 80), ...dec([0, 'part'], '0.2', 250, 170), ...dec([0, 'part'], '0.05', 250, 260),
    ...[80, 170, 260].map(y => ({ ...write([0, '3'], '3 ×', 130, y, 38), quick: true })),
    write([1, '1'], '=', 340, 80, 38), ...dec([1, '1'], '3', 430, 80),
    write([1, 'tenths'], '6 tenths', 430, 208, 22, 'd'), write([1, '0.6'], '=', 340, 170, 38), ...dec([1, '0.6'], '0.6', 430, 170),
    write([2, '15'], '15 hundredths', 430, 298, 22, 'd'), write([2, '0.15'], '=', 340, 260, 38), ...dec([2, '0.15'], '0.15', 430, 260),
  ],
  // Add the parts, points lined up
  [
    ...dec([0, 'parts'], '3', 300, 70, 40), ...dec([0, 'parts'], '0.6', 300, 120, 40), ...dec([0, 'parts'], '0.15', 300, 170, 40),
    write([1, 'add'], '+', 210, 170, 40), line([1, 'add'], [[205, 198], [380, 198]]),
    ...dec([1, '3.75'], '3.75', 300, 232, 40, 'y'),
    write([2, 'smoothies'], '3 smoothies', 190, 330, 28, 'd'),
    write([2, '$3.75'], '$3.75', 400, 330, 36, 'y'), box([2, '$3.75'], 345, 305, 110, 50, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '1.25'], '3 × 1.25', 250, 170, 36), write([1, '375'], '= 375', 380, 170, 36), cross([1, '375'], 335, 148, 90, 44),
    write([2, '$1'], '$1 each', 190, 250, 30), arrow([2, '$3'], [255, 250], [315, 250], 'd'), write([2, '$3'], 'about $3', 390, 250, 30),
    write([2, '$3.75'], '3 × 1.25 = 3.75', 300, 330, 36, 'y'), ring([2, '$3.75'], 300, 330, 150, 30, 'y'),
  ],
]
