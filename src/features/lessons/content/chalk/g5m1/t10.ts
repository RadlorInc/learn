/** g5m1-t10's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, cross, ring } from '../../../chalk'

type At = [number, string]
const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))
/** A number digit by digit in its columns, ones at `ones`, 36 apart; `rtl` writes the ones first, the way it is worked out. */
const num = (at: At, n: string, ones: number, y: number, c: ChalkColor = 'w', s = 40, rtl = false): ChalkMark[] => {
  const ms = [...n].map((d, i) => write(at, d, ones - (n.length - 1 - i) * 36, y, s, c))
  return rtl ? ms.reverse() : ms
}
const warn = (at: At, cx = 300): ChalkMark[] => [line(at, [[cx, 15], [cx + 35, 75], [cx - 35, 75], [cx, 15]], 'r'), write(at, '!', cx, 52, 30, 'r')]
/** 231 over × 123 and the rule, ones column at x 330 (tens 294, hundreds 258, thousands 222, ten-thousands 186). */
const setup = (at: At, top = 70, low = 120, rule = 145, s = 40): ChalkMark[] => q([
  ...num(at, '231', 330, top, 'w', s), write(at, '×', 222, low, s), ...num(at, '123', 330, low, 'w', s), line(at, [[200, rule], [350, rule]]),
])
/** Short dim dashes where a row's digits will go. */
const dashes = (at: At, xs: number[], y: number): ChalkMark => ({ ...line(at, [[0, 0]], 'd'), d: xs.map(x => `M${x - 11} ${y} h22`).join(' '), w: 3 })

// Colours: the ones row blue, the tens row yellow, the hundreds row coral where its 0s are the point.
export const T10: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two rows are not enough
  [
    write([0, '23'], '× 23', 160, 60, 32),
    write([0, 'ones'], 'ones row', 160, 140, 28, 'b'), write([0, 'tens'], 'tens row', 160, 190, 28, 'y'),
    line([1, 'But'], [[300, 30], [300, 280]], 'd'),
    write([1, '123'], '× 123', 440, 60, 32), write([1, 'digits'], '3 digits', 440, 100, 24, 'd'),
    ring([1, 'hundred'], 440, 60, 12, 20, 'r'), write([1, 'hundred'], '?', 505, 60, 32, 'r'),
    ...q([write([2, 'It'], 'ones row', 440, 140, 28, 'b'), write([2, 'It'], 'tens row', 440, 190, 28, 'y')]),
    write([2, 'own'], 'hundreds row', 440, 240, 28, 'r'),
  ],
  // The big idea
  [
    ...q([...num([0, 'Make'], '231', 400, 45, 'w', 34), write([0, 'Make'], '×', 292, 90, 34), ...num([0, 'Make'], '123', 400, 90, 'w', 34),
      line([0, 'Make'], [[270, 112], [420, 112]])]),
    ring([0, 'digit'], 364, 90, 56, 22, 'b'),
    ...q([write([0, 'bottom'], 'row 1', 180, 145, 24, 'b'), write([0, 'bottom'], 'row 2', 180, 190, 24, 'y'), write([0, 'bottom'], 'row 3', 180, 235, 24, 'r')]),
    dashes([0, 'bottom'], [328, 364, 400], 158), dashes([0, 'bottom'], [292, 328, 364], 203), dashes([0, 'bottom'], [256, 292, 328], 248),
    write([0, 'new'], '0', 400, 190, 34, 'r'),
    write([0, '0'], '0', 364, 235, 34, 'r'), write([0, '0'], '0', 400, 235, 34, 'r'),
    write([0, 'add'], '+', 232, 212, 34), line([0, 'rows'], [[222, 270], [420, 270]]),
  ],
  // The ones row
  [
    ...setup([0, 'Start']),
    ring([0, 'ones'], 330, 120, 16, 24, 'b'), write([0, '231'], '231 × 3', 110, 185, 24, 'd'),
    write([1, '1'], '1 × 3 = 3', 500, 120, 24, 'd'), write([1, '1'], '3', 330, 185, 40, 'b'),
    write([1, '9'], '3 × 3 = 9', 500, 160, 24, 'd'), write([1, '9'], '9', 294, 185, 40, 'b'),
    write([1, '6'], '2 × 3 = 6', 500, 200, 24, 'd'), write([1, '6'], '6', 258, 185, 40, 'b'),
    ring([1, '693'], 294, 185, 62, 28, 'b'),
  ],
  // The tens row
  [
    ...setup([0, 'Next']), ...q([...num([0, 'Next'], '693', 330, 185, 'b'), write([0, 'Next'], 'ones row', 110, 185, 24, 'b')]),
    ring([0, '2'], 294, 120, 16, 24, 'y'), write([0, 'tens'], '2 tens', 480, 120, 30, 'y'),
    write([0, '0'], '0', 330, 230, 40, 'r'),
    write([1, '231'], '231 × 2 = 462', 480, 290, 24, 'd'), ...num([1, '462'], '462', 294, 230, 'y', 40, true),
    ring([1, '4,620'], 276, 230, 80, 28, 'y'), write([1, 'row'], 'tens row', 110, 230, 24, 'y'),
  ],
  // The hundreds row, then add. Rows closer together here, to leave room for the sum.
  [
    ...setup([0, 'Last'], 60, 105, 128, 34),
    ...q([...num([0, 'Last'], '693', 330, 180, 'b', 34), ...num([0, 'Last'], '4620', 330, 218, 'y', 34)]),
    ring([0, '1'], 258, 105, 15, 21, 'r'), write([0, 'hundred'], '1 hundred', 500, 105, 24, 'r'),
    write([0, '0s'], '0', 330, 256, 34, 'r'), write([0, '0s'], '0', 294, 256, 34, 'r'),
    write([1, '231'], '231 × 1 = 231', 500, 256, 24, 'd'), ...num([1, '231'], '231', 258, 256, 'w', 34, true),
    ring([1, '23,100'], 258, 256, 106, 21, 'r'),
    write([2, 'Add'], '+', 150, 218, 34), line([2, 'Add'], [[135, 279], [350, 279]]),
    write([2, '28,413'], '3', 330, 312, 34, 'y'), write([2, '28,413'], '1', 294, 312, 34, 'y'), write([2, '28,413'], '1', 258, 148, 20, 'd'),
    write([2, '28,413'], '4', 258, 312, 34, 'y'), write([2, '28,413'], '1', 222, 148, 20, 'd'),
    write([2, '28,413'], '8', 222, 312, 34, 'y'), write([2, '28,413'], '2', 186, 312, 34, 'y'),
    write([2, 'bottles'], '28,413 bottles', 480, 350, 26, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'hundreds'], 'hundreds row', 222, 100, 24, 'd'), ...num([1, 'row'], '231', 222, 150),
    ...num([1, 'TWO'], '00', 294, 150, 'r'), ring([1, '0s'], 276, 150, 36, 26, 'r'),
    ...q(num([2, '123'], '123', 182, 240, 'w', 36)).map((m, i) => i === 0 ? { ...m, c: 'y' as const } : m),
    ring([2, 'hundred'], 110, 240, 15, 24, 'y'), write([2, 'hundred'], '→ 1 hundred', 320, 240, 28, 'y'),
    write([2, '23,100'], '23,100', 200, 330, 36, 'y'),
    write([2, '231'], '231', 430, 330, 36, 'r'), cross([2, '231'], 398, 296, 64, 68),
  ],
]
