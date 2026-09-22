/**
 * g5m2-t5's chalkboards: index = screen index (0 is Screen 1, which has none). Also the shared helpers t6–t8 draw with.
 * Colours in t5–t8: white = a whole and its cuts, blue wash = the pieces you have, dim = labels and pieces taken away,
 * yellow = the result, coral = the mistake. Every foot of ribbon is the same width, and a fourth is exactly a quarter of it.
 */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, cells, arrow, cross, ring, chalkWidth } from '../../../chalk'
import { shade, warn, type At } from '../g3m5/t5to8'
export { shade, warn, type At }

export const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })

/** A stacked fraction with a real fraction bar, all three parts at one word. */
export const fr = (at: At, top: string, bot: string, x: number, y: number, s = 36, c: ChalkColor = 'w'): ChalkMark[] => {
  const half = Math.max(chalkWidth(top, s), chalkWidth(bot, s)) / 2 + s * 0.12
  return [q(write(at, top, x, y - s * 0.62, s, c)), q(line(at, [[x - half, y], [x + half, y]], c)), q(write(at, bot, x, y + s * 0.62, s, c))]
}
/** One piece of a row: plain writing, or a fraction [top, bottom]; each at its own word and colour. */
export type Tok = [At, string | [string, string], ChalkColor?]
const tokW = (t: Tok[1], s: number) => typeof t === 'string' ? chalkWidth(t, s) : Math.max(chalkWidth(t[0], s), chalkWidth(t[1], s)) + s * 0.24
const lay = (toks: Tok[], cx: number, s: number) => {
  const gap = s * 0.35, ws = toks.map(t => tokW(t[1], s)), total = ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1)
  let x = cx - total / 2
  return ws.map(w => { const c = x + w / 2; x += w + gap; return { x: c, w } })
}
/** A row of writing and stacked fractions, centred on cx, its fraction bars on y. */
export const row = (toks: Tok[], cx: number, y: number, s = 36): ChalkMark[] => {
  const at = lay(toks, cx, s)
  return toks.flatMap(([a, t, c = 'w'], i) => typeof t === 'string' ? [q(write(a, t, at[i].x, y, s, c))] : fr(a, t[0], t[1], at[i].x, y, s, c))
}
/** A coral cross over pieces `from`..`to` of a row. */
export const crossRow = (at: At, toks: Tok[], cx: number, y: number, from: number, to: number, s = 36): ChalkMark => {
  const L = lay(toks, cx, s), x1 = L[from].x - L[from].w / 2 - 6, x2 = L[to].x + L[to].w / 2 + 6
  return cross(at, x1, y - s * 1.1, x2 - x1, s * 2.2)
}
/** "3 1/4" as two pieces of a row. */
export const mixed = (at: At, w: string, top: string, bot: string, c?: ChalkColor): Tok[] => [[at, w, c], [at, [top, bot], c]]

// ── The ribbon: 3 whole feet and 1 fourth, a foot 128 wide ──────────────────────────────────────
const F = 128, X0 = 92, H = 50
/** 3 whole feet and the fourth you have, washed blue. */
const ribbon = (at: At, y: number, blueAt: At = at): ChalkMark[] =>
  [cells(at, X0, y, 3 * F, H, 3), box(at, X0 + 3 * F, y, F / 4, H), shade(blueAt, X0 + 3 * F, y, F / 4, H, 1, 1)]
/** The same ribbon with the third foot cut into 4 fourths. */
const broken = (at: At, y: number): ChalkMark[] =>
  [cells(at, X0, y, 2 * F, H, 2), cells(at, X0 + 2 * F, y, F, H, 4), box(at, X0 + 3 * F, y, F / 4, H)]

const B5 = 64   // a fourth on screens 5–7: a foot is 256 there
export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not enough fourths
  [
    ...ribbon([0, 'Look'], 60, [0, 'fourths']), ring([0, 'fourths'], X0 + 3 * F + 16, 85, 28, 40, 'b'),
    ...row([[[0, 'cut'], 'cut off'], [[0, '3'], ['3', '4']]], 170, 200, 32),
    ...row([[[1, 'have'], 'you have'], [[1, '1'], ['1', '4'], 'b']], 430, 200, 32),
    write([2, 'take'], '3 pieces from 1 piece?', 300, 290, 30, 'r'),
    write([2, 'more'], 'more pieces?', 300, 350, 30),
  ],
  // The big idea: break a whole into pieces
  [
    ...ribbon([0, 'If'], 60), ring([0, 'enough'], X0 + 3 * F + 16, 85, 28, 40, 'r'),
    arrow([0, 'break'], [X0 + 2.5 * F, 120], [X0 + 2.5 * F, 190], 'y'),
    ...broken([0, 'whole'], 210), shade([0, 'pieces'], X0 + 2 * F, 210, F * 1.25, H, 5, 5),
    write([0, 'first'], 'more pieces', X0 + 2.6 * F, 300, 28, 'y'),
  ],
  // Break a whole
  [
    ...ribbon([0, 'So'], 50), ring([0, 'take'], X0 + 2.5 * F, 75, 64, 36),
    arrow([0, 'cut'], [X0 + 2.5 * F, 105], [X0 + 2.5 * F, 150], 'd'), ...broken([0, 'cut'], 160),
    write([1, '2'], '2 wholes', X0 + F, 245, 26, 'd'),
    shade([1, '5'], X0 + 2 * F, 160, F * 1.25, H, 5, 5), write([1, '5'], '5 fourths', X0 + 2.6 * F, 245, 26, 'b'),
    ...row([...mixed([2, '3'], '3', '1', '4'), [[2, 'same'], '='], ...mixed([2, '5/4'], '2', '5', '4', 'y')], 300, 335, 36),
  ],
  // Take away the pieces: 5 fourths, 3 go
  [
    ...fr([0, 'pieces'], '5', '4', 80, 110, 30, 'b'), cells([0, 'pieces'], 140, 80, 5 * B5, 60, 5), shade([0, 'pieces'], 140, 80, 5 * B5, 60, 5, 5),
    ...[0, 1, 2].map(i => q(cross([0, 'away'], 140 + i * B5 + 12, 92, B5 - 24, 36, 'd'))),
    ...row([[[0, '5'], ['5', '4']], [[0, '5'], '−'], [[0, '5'], ['3', '4']], [[1, '2'], '=', 'y'], [[1, '2'], ['2', '4'], 'y']], 300, 260, 36),
    ring([1, 'left'], 140 + 4 * B5, 110, B5 + 10, 44, 'y'),
  ],
  // Take away the wholes, then put it back together
  [
    cells([0, 'wholes'], 60, 50, 320, 50, 2), q(write([0, 'wholes'], '1', 140, 125, 28, 'd')), q(write([0, 'wholes'], '1', 300, 125, 28, 'd')),
    cells([0, 'Then'], 440, 50, 2 * B5 * 0.625, 50, 2), shade([0, 'Then'], 440, 50, 2 * B5 * 0.625, 50, 2, 2),
    ...fr([0, 'Then'], '2', '4', 480, 135, 24, 'd'),
    cross([0, 'take'], 240, 58, 120, 34, 'd'),
    ...row([[[0, '2'], '2'], [[0, 'take'], '−'], [[0, '1'], '1'], [[0, 'leaves'], '=', 'y'], [[0, 'leaves'], '1', 'y']], 300, 195, 36),
    box([1, 'together'], 180, 250, 160, 50, 'y'), cells([1, 'together'], 340, 250, 80, 50, 2, 'y'), shade([1, 'together'], 340, 250, 80, 50, 2, 2),
    ...row([...mixed([1, '1'], '1', '2', '4', 'y'), [[1, 'feet'], 'feet left', 'y']], 300, 350, 32),
  ],
  // One thing not to do: flipping the pieces
  (() => {
    const bad: Tok[] = [[[1, 'take'], ['3', '4'], 'r'], [[1, 'take'], '−', 'r'], [[1, 'take'], ['1', '4'], 'r'], [[1, 'gives'], '=', 'r'], ...mixed([1, 'gives'], '2', '2', '4', 'r')]
    return [
      ...warn([0, 'mix']),
      write([1, 'FLIP'], 'flip?', 90, 175, 30, 'r'),
      ...row(bad, 330, 175, 36),
      crossRow([2, 'not'], bad, 330, 175, 0, 5, 36),
      ...row([[[2, 'cutting'], 'take away'], [[2, 'cutting'], ['3', '4']]], 180, 285, 30),
      ...row([[[2, 'Break'], 'break 1 whole:', 'y'], ...mixed([2, 'Break'], '3', '1', '4', 'y'), [[2, 'first'], '=', 'y'], ...mixed([2, 'first'], '2', '5', '4', 'y')], 300, 355, 30),
    ]
  })(),
]
