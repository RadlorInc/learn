/** g8m4-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The small sign top left, the big one (twice its size) along the bottom, the working top right.
 *  Yellow = the bottoms and the answer, blue = the check on a second pair. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, cross, ring } from '../../../chalk'
import { warn, tick } from '../g3m1/t1'
import { tri, type At, type Pt } from './t1'

// The lesson's triangle [[0, 0], [4, 0], [1.35, 1.5]]: bottom 4, right side 3, left side 2.
const shape = (ox: number, oy: number, k: number): Pt[] => [[ox, oy], [ox + 4 * k, oy], [ox + 1.35 * k, oy - 1.5 * k]]
const S = shape(40, 190, 40), L = shape(230, 345, 80)
const side = (at: At, [a, b]: [Pt, Pt], c: ChalkColor) => line(at, [a, b], c, 5)
const bottom = (t: Pt[]): [Pt, Pt] => [t[0], t[1]], right = (t: Pt[]): [Pt, Pt] => [t[1], t[2]], left = (t: Pt[]): [Pt, Pt] => [t[0], t[2]]
const lab = (at: At, t: string, x: number, y: number, c: ChalkColor = 'w'): ChalkMark => ({ ...write(at, t, x, y, 22, c), quick: true })
const small = (at: At, labels = true): ChalkMark[] =>
  [tri(at, S), ...(labels ? [lab(at, '4 ft', 120, 212), lab(at, '3 ft', 168, 142), lab(at, '2 ft', 44, 148)] : [])]
const big = (at: At, q: string | null = '? ft'): ChalkMark[] =>
  [tri(at, L), ...(q === null ? [] : [lab(at, '8 ft', 390, 372), lab(at, '6 ft', 480, 272), ...(q ? [lab(at, q, 250, 272)] : [])])]
/** A small arc marking the angle at corner `i` of triangle t. */
const angle = (at: At, t: Pt[], i: number, r: number, c: ChalkColor): ChalkMark => {
  const v = t[i], [p1, p2] = t.filter((_, j) => j !== i)
  const u = (q: Pt): Pt => { const d = Math.hypot(q[0] - v[0], q[1] - v[1]); return [v[0] + ((q[0] - v[0]) * r) / d, v[1] + ((q[1] - v[1]) * r) / d] }
  const s = u(p1), e = u(p2), sweep = (s[0] - v[0]) * (e[1] - v[1]) - (s[1] - v[1]) * (e[0] - v[0]) > 0 ? 1 : 0
  return { beat: at[0], at: at[1], c, w: 3, d: `M${s[0].toFixed(1)} ${s[1].toFixed(1)} A${r} ${r} 0 0 ${sweep} ${e[0].toFixed(1)} ${e[1].toFixed(1)}` }
}
const angles = (at: At): ChalkMark[] => (['y', 'b', 'w'] as ChalkColor[]).flatMap((c, i) => [angle(at, S, i, 14, c), angle(at, L, i, 26, c)])

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding does not match: +4 on the bottom, +3 on the side
  [
    ...small([0, 'side']), ...big([0, 'side']),
    write([1, '8.'], '4 → 8', 360, 60, 30), write([1, 'more'], '+ 4', 500, 60, 30, 'b'),
    write([2, '6,'], '3 → 6', 360, 115, 30), write([2, 'more'], '+ 3', 500, 115, 30, 'b'),
    write([3, 'Different'], 'not the same', 430, 170, 28, 'r'),
  ],
  // The big idea: same angles, every side times the same number
  [
    ...small([0, 'Triangles'], false), ...big([0, 'Triangles'], null), ...angles([0, 'angles']),
    write([0, 'multiplied'], 'every side ×', 430, 80, 30, 'y'), write([0, 'number'], 'the same number', 430, 125, 30, 'y'),
  ],
  // Match the corners: same angles, so the sides in the same place match
  [
    ...small([0, 'corners'], false), ...big([0, 'corners'], null),
    ...angles([1, 'angle']), write([1, 'angle'], 'same angles', 430, 80, 30),
    side([2, 'matches'], bottom(S), 'y'), side([2, 'matches'], bottom(L), 'y'),
    side([2, 'place'], right(S), 'b'), side([2, 'place'], right(L), 'b'),
    write([2, 'place'], 'same place, matching sides', 420, 140, 22, 'd'),
  ],
  // Find the number: 8 ÷ 4 = 2, checked on 3 × 2 = 6
  [
    ...small([0, 'Pick']), ...big([0, 'Pick']),
    side([0, 'bottoms,'], bottom(S), 'y'), side([0, 'bottoms,'], bottom(L), 'y'),
    write([1, '8'], '8 ÷ 4 = 2', 430, 60, 34, 'y'), write([1, 'times'], '2 times as long', 430, 102, 24, 'y'),
    side([2, 'second'], right(S), 'b'), side([2, 'second'], right(L), 'b'),
    write([2, '3'], '3 × 2 = 6', 410, 160, 34, 'b'), tick([2, 'says'], 510, 160, 'b'),
  ],
  // Multiply: the missing side matches the 2 ft side
  [
    ...small([0, 'Now']), ...big([0, 'Now'], ''), ring([0, 'side'], 284, 285, 16, 16), lab([0, 'side'], '?', 250, 272),
    side([1, 'matches'], left(S), 'y'), side([1, 'matches'], left(L), 'y'),
    write([2, 'So'], '2 × 2 = 4', 430, 70, 36, 'y'), lab([2, 'feet'], '4 ft', 232, 306, 'y'),
    write([2, 'feet'], '4 feet', 430, 120, 30, 'y'),
  ],
  // One thing not to do: do not add, multiply
  [
    ...warn([0, 'mix']),
    write([1, 'ADD'], '2 + 4 = 6 ft', 300, 165, 36), cross([2, 'different'], 330, 147, 82, 36),
    write([2, 'shape'], 'a different shape', 300, 215, 26, 'r'),
    write([3, '4'], '2 × 2 = 4 ft', 300, 295, 38, 'y'),
  ],
]
