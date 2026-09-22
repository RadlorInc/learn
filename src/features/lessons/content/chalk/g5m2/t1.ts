/**
 * g5m2-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the fraction and bar helpers t2–t4 draw with.
 * Colours in t1–t4: white = the whole and its cuts, blue wash = the pieces you have, yellow = the result, coral = the
 * mistake, dim = labels and pieces taken away.
 */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cells, cross, ring, span, chalkWidth } from '../../../chalk'
import { shade, warn, type At } from '../g3m5/t5to8'
export type { At }
export { warn }

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
export const row = (toks: Tok[], cx: number, y: number, s = 36): ChalkMark[] => place(toks, lay(toks, cx, s), y, s)
/** A row's pieces at positions already laid out (so part of a row can go up now and the rest later). */
export const place = (toks: Tok[], at: { x: number }[], y: number, s = 36): ChalkMark[] =>
  toks.flatMap(([a, t, c = 'w'], i) => typeof t === 'string'
    ? [{ ...write(a, t, at[i].x, y, s, c), quick: true }]
    : fr(a, t[0], t[1], at[i].x, y, s, c))
/** A coral cross over pieces `from`..`to` of a row. */
export const crossRow = (at: At, toks: Tok[], cx: number, y: number, from: number, to: number, s = 36): ChalkMark => {
  const L = lay(toks, cx, s), x1 = L[from].x - L[from].w / 2 - 6, x2 = L[to].x + L[to].w / 2 + 6
  return cross(at, x1, y - s * 1.1, x2 - x1, s * 2.2)
}

/** A bar cut into `n` equal pieces with `k` of them washed (the pieces you have). */
export const bar = (at: At, x: number, y: number, w: number, h: number, n: number, k: number, c: ChalkColor = 'b'): ChalkMark[] =>
  [cells(at, x, y, w, h, n), ...(k ? [shade(at, x, y, w, h, n, k, 0, c)] : [])]
/** Cut every one of a bar's `n` pieces into `m`: only the NEW cuts, as one stroke. */
export const recut = ([beat, at]: At, x: number, y: number, w: number, h: number, n: number, m: number, c: ChalkColor = 'w', w2 = 4): ChalkMark =>
  ({ beat, at, c, w: w2, d: Array.from({ length: n * m - 1 }, (_, i) => i + 1).filter(i => i % m).map(i => `M${x + (w * i) / (n * m)} ${y} v${h}`).join(' ') })

// Every bar is the same length, so pieces can be compared by eye: x 150–510.
const X = 150, W = 360
const tok = (at: At, t: Tok[1], c?: ChalkColor): Tok => [at, t, c]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // The pieces don't match
  [
    ...bar([0, 'half'], X, 50, W, 56, 2, 1), ...fr([0, 'half'], '1', '2', 95, 78, 28, 'd'), write([0, 'big'], 'big', 555, 78, 26, 'd'),
    ...bar([0, 'fourth'], X, 140, W, 56, 4, 1), ...fr([0, 'fourth'], '1', '4', 95, 168, 28, 'd'), write([0, 'small'], 'small', 555, 168, 24, 'd'),
    write([1, 'add'], '1 piece + 1 piece = ?', 300, 275, 32),
    write([1, 'Not'], 'not yet', 300, 325, 30),
    span([2, 'different'], X + 4, X + W / 2 - 4, 123), span([2, 'different'], X + 4, X + W / 4 - 4, 213),
    write([2, 'sizes'], 'different sizes', 300, 370, 28, 'd'),
  ],
  // The big idea: same-size pieces, then count them
  [
    ...bar([0, 'Make'], X, 60, W, 70, 2, 1), ...fr([0, 'Make'], '1', '2', 95, 95, 28, 'd'),
    ...bar([0, 'Make'], X, 190, W, 70, 4, 1), ...fr([0, 'Make'], '1', '4', 95, 225, 28, 'd'),
    recut([0, 'same'], X, 60, W, 70, 2, 2),
    ...[1, 2, 3].map(i => ({ ...line([0, 'size'], [[X + (W * i) / 4, 136], [X + (W * i) / 4, 184]], 'd', 2), quick: true })),
    write([0, 'add'], '+', 95, 160, 36, 'y'),
    ring([0, 'pieces'], X + W / 4, 95, W / 4 + 16, 48, 'y'), ring([0, 'pieces'], X + W / 8, 225, W / 8 + 16, 48, 'y'),
  ],
  // Make the pieces match
  [
    ...bar([0, 'Cut'], X, 60, W, 70, 2, 1), ...fr([0, 'Cut'], '1', '2', 95, 95, 30, 'd'),
    recut([0, 'middle'], X, 60, W, 70, 2, 2),
    write([1, '4'], '4 pieces', 330, 172, 24, 'd'),
    ...[0, 1, 2, 3].flatMap(i => fr([1, 'fourth'], '1', '4', X + W / 8 + (W * i) / 4, 95, 22)),
    line([2, 'amount'], [[X + W / 2, 46], [X + W / 2, 144]], 'd', 3),
    ...row([[[2, '1/2'], ['1', '2']], [[2, '1/2'], '='], [[2, '2/4'], ['2', '4'], 'y']], 300, 275, 48),
  ],
  // Same-size pieces
  [
    ...bar([0, 'both'], X, 40, W, 56, 4, 2), ...fr([0, 'both'], '2', '4', 95, 68, 28, 'd'),
    ...bar([0, 'both'], X, 120, W, 56, 4, 1), ...fr([0, 'both'], '1', '4', 95, 148, 28, 'd'),
    ...[0, 1, 2, 3].map(i => ({ ...span([0, 'same'], X + (W * i) / 4 + 6, X + (W * (i + 1)) / 4 - 6, 196, 'd'), quick: true })),
    cells([1, '2'], X, 240, W, 56, 4), shade([1, '2'], X, 240, W, 56, 4, 2), shade([1, '1'], X, 240, W, 56, 4, 1, 2),
    ...fr([1, '3'], '3', '4', 95, 268, 32, 'y'), write([1, '3'], '3 fourths', 330, 345, 32, 'y'),
  ],
  // The bottom number stays
  ((): ChalkMark[] => {
    const A: At = [0, 'Look'], toks: Tok[] = [[A, ['2', '4']], [A, '+'], [A, ['1', '4']], [A, '='], [A, ['3', '4']]]
    const L = lay(toks, 300, 44), a = L[4].x, y = 100
    return [
      ...place(toks.slice(0, 4), L, y, 44),
      ...[0, 2].map(i => ({ ...ring([0, 'bottom'], L[i].x, y + 28, 22, 22, 'd'), quick: true })),
      { ...line([0, 'stays'], [[a - 20, y], [a + 20, y]], 'y'), quick: true }, write([0, 'stays'], '4', a, y + 27, 44, 'y'),
      write([1, '3/4'], '3', a, y - 27, 44, 'y'),
      ...row([[[1, 'So'], ['1', '2']], [[1, 'So'], '+'], [[1, 'So'], ['1', '4']], [[1, 'So'], '='], [[1, '3/4'], ['3', '4'], 'y']], 300, 240, 40),
      ...row([[[1, 'ran'], 'you ran', 'd'], [[1, 'mile'], ['3', '4'], 'y'], [[1, 'mile'], 'mile', 'd']], 300, 345, 30),
    ]
  })(),
  // One thing not to do
  (() => {
    const B: At = [1, 'ADD'], wrong: Tok[] = [[B, ['1', '2'], 'r'], [B, '+', 'r'], [B, ['1', '4'], 'r'], [B, '=', 'r'], [B, ['2', '6'], 'r']]
    const R: At = [2, 'stays']
    return [
      ...warn([0, 'mix']),
      ...row(wrong, 300, 180, 40), crossRow([1, 'not'], wrong, 300, 180, 3, 4, 40),
      ...row([tok(R, ['1', '2'], 'y'), tok(R, '+', 'y'), tok(R, ['1', '4'], 'y'), tok(R, '=', 'y'), tok(R, ['3', '4'], 'y')], 300, 320, 40),
    ]
  })(),
]
