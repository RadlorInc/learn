/**
 * g4m4-t6's chalkboards: index = screen index (0 is Screen 1, which has none). Also the row-of-fractions helpers t7–t9 draw with.
 * Colours in t6–t9: white = the whole and its cuts, blue wash = the pieces you have, yellow = the result, coral = the
 * mistake, dim = labels and pieces taken away.
 */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cells, cross, ring, chalkWidth } from '../../../chalk'
import { pizza, cuts, slices, inSlice, shade, warn, type At } from '../g3m5/t5to8'
export type { At }

/** A stacked fraction with a real fraction bar, all three parts at one word. */
export const fr = (at: At, top: string, bot: string, x: number, y: number, s = 36, c: ChalkColor = 'w'): ChalkMark[] => {
  const half = Math.max(chalkWidth(top, s), chalkWidth(bot, s)) / 2 + s * 0.12
  return [
    { ...write(at, top, x, y - s * 0.62, s, c), quick: true },
    { ...line(at, [[x - half, y], [x + half, y]], c), quick: true },
    { ...write(at, bot, x, y + s * 0.62, s, c), quick: true },
  ]
}

/** One piece of a row: plain writing, or a fraction [top, bottom]; each at its own word and colour. */
export type Tok = [At, string | [string, string], ChalkColor?]
const tokW = (t: Tok[1], s: number) => typeof t === 'string' ? chalkWidth(t, s) : Math.max(chalkWidth(t[0], s), chalkWidth(t[1], s)) + s * 0.24
/** Where each piece of a row sits: centre x and width. */
export const lay = (toks: Tok[], cx: number, s = 36) => {
  const gap = s * 0.35, ws = toks.map(t => tokW(t[1], s)), total = ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1)
  let x = cx - total / 2
  return ws.map(w => { const c = x + w / 2; x += w + gap; return { x: c, w } })
}
/** A row of writing and stacked fractions, centred on cx, its fraction bars on y. */
export const row = (toks: Tok[], cx: number, y: number, s = 36): ChalkMark[] => {
  const at = lay(toks, cx, s)
  return toks.flatMap(([a, t, c = 'w'], i) => typeof t === 'string'
    ? [{ ...write(a, t, at[i].x, y, s, c), quick: true }]
    : fr(a, t[0], t[1], at[i].x, y, s, c))
}
/** A coral cross over pieces `from`..`to` of a row (a fraction row is taller than a line of writing). */
export const crossRow = (at: At, toks: Tok[], cx: number, y: number, from: number, to: number, s = 36): ChalkMark => {
  const L = lay(toks, cx, s), x1 = L[from].x - L[from].w / 2 - 6, x2 = L[to].x + L[to].w / 2 + 6
  return cross(at, x1, y - s * 1.1, x2 - x1, s * 2.2)
}
/** A pizza cut into `n`, with `k` slices on it. */
export const cutPizza = (at: At, cx: number, cy: number, r: number, n: number, k: number, atK: At = at): ChalkMark[] =>
  [pizza(at, cx, cy, r), { ...cuts(at, cx, cy, r, n), quick: true }, ...(k ? [slices(atK, cx, cy, r, n, k)] : [])]
/** A small dim ✕ on slice `i` of a pizza: that slice is eaten. */
export const eaten = (at: At, cx: number, cy: number, r: number, i: number, n: number): ChalkMark => {
  const [x, y] = inSlice(cx, cy, r * 0.62, i, n)
  return { ...cross(at, x - 12, y - 12, 24, 24, 'd'), quick: true }
}
export { shade, warn, cells, slices, pizza }

const PX = 450, PY = 175, PR = 110   // the pizza on screens 2, 4, 5
const B: At = [1, 'BOTTOM']
const minus: Tok[] = [[B, ['7', '8'], 'r'], [B, '−', 'r'], [B, ['3', '8'], 'r'], [B, '=', 'r'], [B, ['4', '0'], 'r']]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // The 8 is not a count
  [
    ...row([[[0, 'take'], ['7', '8']], [[0, 'take'], '−'], [[0, 'take'], ['3', '8']]], 150, 90, 40),
    ...row([[[1, 'bottom'], '8 − 8', 'r'], [[1, '0'], '= 0', 'r']], 150, 190, 34),
    write([1, '0'], 'no slices?', 150, 240, 26, 'r'),
    ...cutPizza([1, 'pizza'], PX, PY, PR, 8, 7),
    write([1, 'here'], 'still here', PX, 320, 24, 'd'),
    slices([2, 'big'], PX, PY, PR, 8, 1, 0, 'y', true),
    write([2, 'slice'], '8 = the size of a slice', 300, 370, 28, 'y'),
  ],
  // The big idea: take away pieces, keep the bottom
  [
    cells([0, 'pieces'], 100, 50, 400, 60, 8), shade([0, 'pieces'], 100, 50, 400, 60, 8, 7),
    ...[4, 5, 6].map(i => ({ ...cross([0, 'take'], 100 + 50 * i + 13, 62, 24, 36, 'd'), quick: true })),
    write([0, 'away'], '7 − 3', 300, 185, 40),
    line([0, 'keep'], [[245, 215], [355, 215]]), write([0, 'keep'], '8', 300, 245, 40),
    ring([0, 'bottom'], 300, 245, 44, 30, 'y'),
    write([0, 'number'], 'the bottom stays', 300, 320, 30, 'y'),
  ],
  // Start with 7 slices
  [
    ...fr([0, '7/8'], '7', '8', 130, 110, 44),
    ...cutPizza([0, 'slices'], PX, PY, PR, 8, 7, [0, 'tray']),
    write([0, 'tray'], '7 slices', 130, 200, 28, 'b'),
    slices([1, 'slice'], PX, PY, PR, 8, 1, 0, 'y', true),
    ...fr([1, 'eighth'], '1', '8', 130, 300, 40, 'y'), write([1, 'eighth'], 'each slice', 130, 370, 22, 'y'),
  ],
  // Take 3 away
  [
    ...cutPizza([0, 'Now'], PX, PY, PR, 8, 7),
    ...[4, 5, 6].map(i => eaten([0, 'eat'], PX, PY, PR, i, 8)),
    write([0, 'Take'], '7 − 3', 130, 110, 40), write([0, 'Take'], 'eaten: 3', 130, 170, 24, 'd'),
    slices([1, '4'], PX, PY, PR, 8, 4, 0, 'y', true),
    write([1, '4'], '4 slices left', 130, 280, 32, 'y'),
  ],
  // Count what is left
  [
    ...row([[[0, '7'], '7 slices'], [[0, 'take'], '−'], [[0, '3'], '3 slices'], [[0, 'leaves'], '='], [[0, '4'], '4 slices', 'y']], 300, 55, 30),
    cells([1, 'smaller'], 120, 110, 360, 50, 8), shade([1, 'smaller'], 120, 110, 360, 50, 8, 4),
    write([1, 'eighths'], 'still eighths', 300, 190, 26, 'd'),
    ...row([[[2, '7/8'], ['7', '8']], [[2, '7/8'], '−'], [[2, '3/8'], ['3', '8']], [[2, '4/8'], '='], [[2, '4/8'], ['4', '8'], 'y']], 300, 300, 44),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...row(minus, 300, 180, 36), crossRow([1, 'numbers'], minus, 300, 180, 3, 4, 36),
    ...row([[[2, 'eighths'], ['7', '8']], [[2, 'eighths'], '−'], [[2, 'eighths'], ['3', '8']], [[2, 'stays'], '=', 'y'], [[2, 'stays'], ['4', '8'], 'y']], 300, 320, 36),
  ],
]
