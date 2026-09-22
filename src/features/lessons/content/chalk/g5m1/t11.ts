/** g5m1-t11's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, arrow, span, cross, ring } from '../../../chalk'

type At = [number, string]
const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))
/** A number digit by digit in its columns, ones at `ones`, 36 apart; `rtl` writes the ones first, the way it is worked out. */
const num = (at: At, n: string, ones: number, y: number, c: ChalkColor = 'w', s = 38, rtl = false): ChalkMark[] => {
  const ms = [...n].map((d, i) => write(at, d, ones - (n.length - 1 - i) * 36, y, s, c))
  return rtl ? ms.reverse() : ms
}
const warn = (at: At, cx = 300): ChalkMark[] => [line(at, [[cx, 15], [cx + 35, 75], [cx - 35, 75], [cx, 15]], 'r'), write(at, '!', cx, 52, 30, 'r')]
const tick = (at: At, x: number, y: number): ChalkMark => line(at, [[x, y], [x + 12, y + 14], [x + 36, y - 20]], 'b')

// Colours: the estimate (16,000) blue everywhere, the real answer yellow, a slip coral.
export const T11: (ChalkMark[] | undefined)[] = [
  undefined,
  // One slip can go far
  [
    ...num([0, '406'], '406', 230, 55, 'w', 36),
    write([0, '35'], '×', 122, 100, 36), ...num([0, '35'], '35', 230, 100, 'w', 36), line([0, '35'], [[105, 122], [250, 122]]),
    write([1, 'lost'], 'a lost 0', 430, 80, 32, 'r'),
    line([1, 'throws'], [[60, 220], [540, 220]], 'd'),
    ring([1, 'answer'], 470, 220, 9, 9, 'y'), write([1, 'answer'], 'answer', 470, 185, 22, 'y'),
    arrow([1, 'off'], [455, 245], [150, 245], 'r'), ring([1, 'off'], 130, 220, 9, 9, 'r'),
    write([2, 'catch'], 'how to catch it?', 170, 320, 26, 'd'), write([2, 'Estimate'], 'estimate first', 430, 320, 30, 'y'),
  ],
  // The big idea
  [
    write([0, 'Estimate'], '1  estimate', 300, 60, 32, 'b'), write([0, 'round'], '(round numbers)', 300, 102, 24, 'd'),
    arrow([0, 'then'], [300, 125], [300, 158]),
    write([0, 'multiply'], '2  multiply', 300, 190, 32, 'y'), write([0, 'standard'], '(the standard way)', 300, 230, 24, 'd'),
    arrow([0, 'check'], [300, 252], [300, 285]), write([0, 'check'], '3  check', 300, 315, 32),
    write([0, 'close'], 'is it close?', 300, 356, 24, 'd'),
  ],
  // Estimate first
  [
    write([0, '406'], '406 × 35', 300, 60, 40),
    arrow([0, '400'], [250, 88], [250, 128], 'd'), write([0, '400'], '400', 250, 160, 36, 'b'),
    arrow([0, '40'], [360, 88], [360, 128], 'd'), write([0, '40'], '×', 305, 160, 36, 'b'), write([0, '40'], '40', 360, 160, 36, 'b'),
    write([1, '16,000'], '= 16,000', 475, 160, 36, 'b'),
    line([2, 'answer'], [[80, 300], [520, 300]], 'd'),
    ring([2, 'somewhere'], 400, 300, 60, 16, 'y'),
    line([2, 'near'], [[400, 288], [400, 312]], 'b'), write([2, '16,000'], 'near 16,000', 400, 345, 26, 'b'),
  ],
  // Multiply the standard way
  [
    ...q([...num([0, 'multiply'], '406', 330, 70), write([0, 'multiply'], '×', 222, 120, 38), ...num([0, 'multiply'], '35', 330, 120), line([0, 'multiply'], [[200, 145], [350, 145]])]),
    ring([0, 'ones'], 330, 120, 16, 24, 'y'), write([0, 'row'], 'ones row', 92, 185, 24, 'd'),
    write([0, '5'], '406 × 5 = 2,030', 475, 185, 24, 'd'), ...num([0, '2,030'], '2030', 330, 185, 'y', 38, true),
    ring([1, 'tens'], 294, 120, 16, 24, 'y'), write([1, 'row'], 'tens row', 92, 230, 24, 'd'), write([1, '0'], '0', 330, 230, 38, 'r'),
    write([1, '3'], '406 × 3 = 1,218', 475, 230, 24, 'd'),
    ...num([1, '1,218'], '1218', 294, 230, 'y', 38, true),
    ring([1, '12,180'], 258, 230, 102, 27, 'y'),
  ],
  // Add, then check
  [
    ...num([0, '2,030'], '2030', 300, 90),
    write([0, '12,180'], '+', 120, 140, 38), ...num([0, '12,180'], '12180', 300, 140),
    line([0, '14,210'], [[105, 165], [315, 165]]),
    write([0, '14,210'], '0', 300, 205, 38, 'y'), write([0, '14,210'], '1', 264, 205, 38, 'y'), write([0, '14,210'], '1', 228, 55, 22, 'd'),
    write([0, '14,210'], '2', 228, 205, 38, 'y'), write([0, '14,210'], '4', 192, 205, 38, 'y'), write([0, '14,210'], '1', 156, 205, 38, 'y'),
    write([1, 'check'], 'check', 470, 110, 26, 'd'),
    arrow([1, 'close'], [320, 205], [395, 205], 'd'), write([1, 'close'], 'close to', 470, 160, 26, 'd'),
    write([1, '16,000'], '16,000', 470, 205, 34, 'b'), tick([1, 'Yes'], 535, 200),
    write([2, 'toys'], '14,210 toys', 300, 320, 34, 'y'), ring([2, 'toys'], 300, 320, 110, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    line([1, 'far'], [[60, 200], [540, 200]], 'd'),
    line([1, 'estimate'], [[487, 188], [487, 212]], 'b'), write([1, 'estimate'], 'estimate', 487, 235, 22, 'd'),
    ring([2, '3,248'], 147, 200, 8, 8, 'r'), write([2, '3,248'], '3,248', 147, 165, 30, 'r'),
    span([2, 'nowhere'], 165, 470, 125, 'r'), write([2, '16,000'], '16,000', 487, 165, 30, 'b'),
    write([2, 'lost'], 'tens row: 1,218', 200, 300, 28, 'r'), cross([2, 'back'], 233, 282, 74, 36),
    write([2, 'fix'], '→ 12,180', 420, 300, 30, 'y'),
  ],
]
