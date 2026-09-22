/**
 * g6m2-t1's chalkboards (index = screen index; 0 is Screen 1, which has none), and the helpers t2–t4 draw with.
 * Colours across g6m2-t1..t4: white = bars, cuts and the numbers being worked on, blue wash = the amount you have,
 * yellow = the result, coral = the mistake, dim = labels. Bars that are compared are the same length, and every piece
 * of a bar is truly the same width.
 */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cells, cross, person, hop } from '../../../chalk'
import { row, crossRow, lay, fr, type At, type Tok } from '../g4m4/t6'
import { bar, cut, warn } from '../g5m3/t5'
import { tick } from '../g4m4/t1'
export { row, crossRow, lay, fr, bar, cut, warn, tick, type At, type Tok }

/** "2 1/4 ÷ 3/4" as row pieces, all at one word: every `a/b` becomes a stacked fraction. */
export const ex = (at: At, text: string, c?: ChalkColor): Tok[] =>
  text.split(' ').map(t => [at, /^\d+\/\d+$/.test(t) ? (t.split('/') as [string, string]) : t, c])
/** Where piece `i` of a row sits (its centre x). */
export const px = (toks: Tok[], cx: number, s: number, i: number) => lay(toks, cx, s)[i].x

// Screen 7: the tiny answer people expect, and the real one.
const wrong7 = ex([1, 'Dividing'], '3/4 ÷ 1/8 = 3/32', 'r')
// Screen 6: the check.
const check6: Tok[] = [[[1, 'eighths'], '6 eighths'], [[1, 'is'], '='], [[1, '6/8'], ['6', '8']], [[1, "that's"], '='], [[1, '3/4'], ['3', '4']]]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not a sharing problem
  [
    write([0, 'sharing'], 'usually: share', 150, 45, 26, 'd'),
    person([0, 'person'], 140, 195, 100), ...fr([0, 'person'], '1', '8', 215, 135, 26),
    cross([0, 'person'], 85, 80, 165, 130),
    ...row(ex([1, '3/4'], '3/4 ÷ 1/8'), 440, 95, 40),
    cells([1, 'servings'], 110, 320, 50, 40, 1), ...row(ex([1, 'servings'], '1/8'), 65, 340, 26),
    write([1, 'servings'], '1 serving', 235, 340, 22, 'd'),
    write([1, 'fit'], 'how many fit?', 440, 185, 30, 'y'),
    ...bar([1, 'fit'], 110, 240, 400, 50, 4, 3), ...row(ex([1, 'fit'], '3/4'), 65, 265, 26),
  ],
  // The big idea: cut both into the same size, then count how many fit
  [
    ...bar([0, 'Dividing'], 120, 70, 360, 60, 4, 3), ...row(ex([0, 'Dividing'], '3/4'), 75, 100, 28),
    cells([0, 'fraction'], 120, 225, 45, 60, 1), ...row(ex([0, 'fraction'], '1/8'), 75, 255, 28),
    write([0, 'many'], 'how many fit?', 370, 255, 32, 'y'),
    ...[165, 255, 345].map(x => cut([0, 'cut'], x, 70, 130, 'w')),
    ...[120, 165, 210].map(x0 => ({ ...hop([0, 'count'], x0, x0 + 45, 66, 'y'), quick: true })),
    ...['1', '2', '3'].map((n, i) => ({ ...write([0, 'count'], n, 142.5 + 45 * i, 162, 26, 'y'), quick: true })),
  ],
  // Cut into eighths
  [
    ...bar([0, 'Fourths'], 120, 40, 360, 55, 4, 3), ...row(ex([0, 'Fourths'], '3/4'), 75, 67, 28),
    ...bar([0, 'eighths'], 120, 125, 360, 55, 8, 1), ...row(ex([0, 'eighths'], '1/8'), 75, 152, 28),
    write([0, 'different'], 'different sizes', 300, 215, 26, 'd'),
    ...[165, 255, 345].map(x => cut([1, 'half'], x, 40, 95, 'w')),
    line([1, 'Now'], [[215, 215], [385, 215]], 'd'), write([1, 'Now'], 'same size now', 300, 255, 26),
    ...row([...ex([2, '3/4'], '3/4 ='), ...ex([2, '6/8'], '6/8', 'y')], 300, 330, 40),
  ],
  // Count the eighths
  [
    write([0, 'many'], 'how many?', 300, 100, 34, 'y'),
    ...bar([0, 'eighths'], 60, 160, 480, 80, 8, 6),
    ...['One', 'two', 'three', 'four', 'five', 'six'].map((w, i) => write([1, w], String(i + 1), 90 + 60 * i, 200, 36, 'y')),
  ],
  // Put it together
  [
    ...row([...ex([0, '3/4'], '3/4 ÷ 1/8 ='), ...ex([0, '6'], '6', 'y')], 300, 80, 44),
    write([0, 'servings'], '6 servings', 300, 170, 32, 'y'),
    ...row(check6, 300, 270, 38), tick([1, '3/4'], px(check6, 300, 38, 4) + 40, 270),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...row(wrong7, 300, 170, 38), crossRow([1, 'SMALLER'], wrong7, 300, 170, 3, 4, 38),
    ...bar([2, 'pieces'], 50, 240, 240, 45, 8, 6),
    ...[0, 1, 2, 3, 4, 5].map(i => ({ ...hop([2, 'fit'], 50 + 30 * i, 80 + 30 * i, 238, 'y'), quick: true })),
    ...row(ex([2, 'answer'], '3/4 ÷ 1/8 = 6', 'y'), 440, 262, 34),
    ...row([[[2, 'bigger'], 'bigger than', 'y'], [[2, '3/4'], ['3', '4'], 'y']], 300, 350, 30),
  ],
]
