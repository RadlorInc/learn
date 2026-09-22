/**
 * g5m3-t5's chalkboards: index = screen index (0 is Screen 1, which has none). Also the helpers t6–t8 draw with.
 * Colours in g5m3-t5..t8: white = the amount and its cuts, blue = the part you have / what you multiply by,
 * yellow = the result, coral = the mistake, dim = labels. Bars that are compared are drawn at one scale.
 */
import type { ChalkMark } from '../../../chalk'
import { write, line, span } from '../../../chalk'
import { row, crossRow, lay, cells, shade, warn, type At, type Tok } from '../g4m4/t6'
import { cut } from '../g4m4/t1'
export { row, crossRow, lay, cells, shade, warn, cut, type At, type Tok }

/** A bar cut into `n` equal cells, `k` of them washed from the left. */
export const bar = (at: At, x: number, y: number, w: number, h: number, n: number, k = 0, c: 'b' | 'y' = 'b', atK: At = at): ChalkMark[] =>
  [cells(at, x, y, w, h, n), ...(k ? [shade(atK, x, y, w, h, n, k, 0, c)] : [])]

const L2: Tok[] = [[[1, '3'], '3'], [[1, '3'], '×'], [[1, '8'], '8'], [[1, '24'], '='], [[1, '24'], '24', 'y']]
const R2: Tok[] = [[[2, '3/4'], ['3', '4']], [[2, '3/4'], '×'], [[2, '3/4'], '8'], [[2, 'happens'], '='], [[2, 'happens'], '?', 'y']]
const wrong7: Tok[] = [[[1, 'times'], ['3', '4'], 'r'], [[1, 'times'], '×', 'r'], [[1, 'times'], '8', 'r'], [[1, 'bigger'], 'bigger than 8', 'r']]
const right7: Tok[] = [[[2, 'multiply'], ['3', '4'], 'y'], [[2, 'multiply'], '×', 'y'], [[2, 'multiply'], '8', 'y'], [[2, 'smaller'], 'smaller than 8', 'y']]
/** The same piece of a row, in yellow (the result). */
export const yel = (t: Tok): Tok => [t[0], t[1], 'y']
/** A blue underline under the number she points at. */
const under = (at: At, cx: number, y: number, half: number): ChalkMark => line(at, [[cx - half, y], [cx + half, y]], 'b', 4)
const x = (toks: Tok[], cx: number, s: number, i: number) => lay(toks, cx, s)[i].x

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Times used to mean more
  [
    write([0, 'bigger'], '× → bigger', 300, 50, 32, 'd'),
    ...row(L2, 160, 150, 40), under([1, 'look'], x(L2, 160, 40, 0), 180, 14),
    write([1, 'more'], 'more than 1', x(L2, 160, 40, 0) + 20, 230, 22, 'd'),
    ...row(R2, 440, 150, 40).slice(0, -2), under([2, 'less'], x(R2, 440, 40, 0), 202, 18),
    write([2, 'less'], 'less than 1', x(R2, 440, 40, 0) + 10, 230, 22, 'd'), ...row(R2, 440, 150, 40).slice(-2),
    write([2, 'happens'], 'bigger or smaller?', 300, 330, 34, 'y'),
  ],
  // The big idea: less than 1 → part of the amount, more than 1 → more than all of it
  [
    ...bar([0, 'Multiply'], 200, 50, 240, 45, 8), write([0, 'Multiply'], '8', 150, 72, 30),
    ...row([[[0, 'less'], '×', 'b'], [[0, 'less'], ['3', '4'], 'b']], 140, 167, 30),
    ...bar([0, 'part'], 200, 145, 180, 45, 6, 6, 'y'), write([0, 'part'], 'less', 410, 168, 24, 'd'),
    { ...line([0, 'amount'], [[440, 35], [440, 305]], 'd', 2) },
    ...row([[[0, 'more'], '×', 'b'], [[0, 'more'], '1', 'b'], [[0, 'more'], ['1', '2'], 'b']], 130, 267, 30),
    ...bar([0, 'all'], 200, 245, 360, 45, 12, 12, 'y'), write([0, 'all'], 'more', 500, 325, 24, 'd'),
  ],
  // Times 1 keeps it the same
  [
    write([0, 'Start'], '1 × 8', 300, 45, 36),
    cells([0, 'recipe'], 60, 90, 480, 55, 8), write([0, 'recipe'], '1 recipe', 300, 170, 22, 'd'),
    ...bar([1, 'same'], 60, 205, 480, 55, 8, 8, 'y'), write([1, '8'], '8 cups', 300, 285, 30, 'y'),
    write([1, 'changes'], '× 1 → no change', 300, 350, 30),
  ],
  // Times less than 1: cut 8 into 4 parts, take 3
  [
    ...row([[[0, 'Now'], ['3', '4']], [[0, 'Now'], '×'], [[0, 'Now'], '8']], 180, 60, 36),
    write([0, 'less'], 'less than 1', 430, 60, 26, 'd'),
    cells([1, '8'], 60, 125, 480, 55, 8), ...[180, 300, 420].map(cx => cut([1, '4'], cx, 115, 190, 'w')),
    shade([1, 'take'], 60, 125, 480, 55, 4, 3),
    span([2, '6'], 60, 420, 215, 'y'), write([2, '6'], '6 cups', 240, 248, 28, 'y'),
    write([2, 'less'], 'less than 8', 430, 248, 28),
    span([2, '8'], 60, 540, 300, 'd'), write([2, '8'], '8 cups', 300, 332, 24, 'd'),
  ],
  // Times more than 1: all 8, and half of 8 again
  [
    ...row([[[0, 'Now'], '1'], [[0, 'Now'], ['1', '2']], [[0, 'Now'], '×'], [[0, 'Now'], '8']], 190, 60, 36),
    write([0, 'more'], 'more than 1', 440, 60, 26, 'd'),
    ...bar([1, 'all'], 60, 130, 320, 55, 8, 8), write([1, '8'], '8 cups', 220, 210, 24, 'd'),
    ...bar([1, 'half'], 380, 130, 160, 55, 4, 4), cut([1, 'half'], 380, 120, 195, 'w'), write([1, 'half'], 'half of 8', 460, 210, 24, 'd'),
    write([2, '8'], '8 + 4 =', 230, 295, 34), span([2, '12'], 60, 540, 245, 'y'), write([2, '12'], '12 cups', 390, 295, 34, 'y'),
    write([2, 'started'], 'more than 8', 300, 355, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...row(wrong7, 300, 175, 36), crossRow([1, 'bigger'], wrong7, 300, 175, 0, 3, 36),
    ...row(right7, 300, 295, 36).slice(0, -1), under([2, 'first'], x(right7, 300, 36, 0), 344, 16),
    write([2, 'less'], 'less than 1', x(right7, 300, 36, 0) + 20, 372, 22, 'd'), ...row(right7, 300, 295, 36).slice(-1),
  ],
]
