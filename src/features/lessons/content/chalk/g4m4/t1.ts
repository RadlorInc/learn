/**
 * g4m4-t1's chalkboards (index = screen index; 0 is Screen 1, which has none), and the shapes t2–t5 draw with.
 * Colours across g4m4-t1..t5: white = the bars, their cuts and the fractions' names, blue wash = the pieces you have,
 * yellow = the result (and the cut that matters), coral = the mistake, dim = labels.
 * Bars that are compared are the same length, and every piece of a bar is truly the same width.
 */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cells, wash, arrow, cross, chalkWidth } from '../../../chalk'
export { warn, tick } from '../g3m1/t1'
import { warn } from '../g3m1/t1'

export type At = [number, string?]

/** A bar at (x, y) cut into `n` equal pieces. */
export const bar = (at: At, x: number, y: number, w: number, h: number, n: number, c: ChalkColor = 'w'): ChalkMark => cells(at, x, y, w, h, n, c)
/** `k` pieces of a bar cut into `n`, from piece `from`, washed. */
export const shade = (at: At, x: number, y: number, w: number, h: number, n: number, k: number, from = 0, c: ChalkColor = 'b'): ChalkMark =>
  ({ ...wash(at, x + (w * from) / n, y, (w * k) / n, h, c), quick: true })
/** A straight cut down a bar, at x, from y1 to y2. */
export const cut = (at: At, x: number, y1: number, y2: number, c: ChalkColor = 'y'): ChalkMark => ({ ...line(at, [[x, y1], [x, y2]], c, 4), quick: true })

const isFrac = (t: string) => /^[\d?]+\/\d+$/.test(t)
const fracW = (t: string, s: number) => { const [a, b] = t.split('/'); return Math.max(a.length, b.length) * s * 0.5 + s * 0.3 }
/** A fraction with a real fraction bar: the top number, the bar, the bottom number, centred on (x, y). */
export const fr = (at: At, t: string, x: number, y: number, s = 34, c: ChalkColor = 'w'): ChalkMark[] => {
  const [a, b] = t.split('/'), h = fracW(t, s) / 2
  return [{ ...write(at, a, x, y - s * 0.62, s, c), quick: true }, { ...line(at, [[x - h, y], [x + h, y]], c, 3), quick: true }, write(at, b, x, y + s * 0.62, s, c)]
}
/** Where each word of a row like "2/8 + 3/8 = 5/8" sits when the row is centred on cx. */
export const layout = (text: string, cx: number, s: number) => {
  const toks = text.split(' '), gap = s * 0.35, ws = toks.map(t => (isFrac(t) ? fracW(t, s) : chalkWidth(t, s)))
  let x = cx - (ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1)) / 2
  return toks.map((t, i) => { const c = x + ws[i] / 2; x += ws[i] + gap; return { t, x: c } })
}
/** A row of fractions and signs, the fractions stacked, all going up at one word. */
export const expr = (at: At, text: string, cx: number, y: number, s = 34, c: ChalkColor = 'w'): ChalkMark[] => {
  const ms = layout(text, cx, s).flatMap(({ t, x }) => (isFrac(t) ? fr(at, t, x, y, s, c) : [write(at, t, x, y, s, c)]))
  return ms.map((m, i) => (i < ms.length - 1 ? { ...m, quick: true } : m))
}

// The bar of this topic: x 120–480, cut into 2 or 4.
const X = 120, W = 360

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // The numbers look different
  [
    ...fr([0, '1/2'], '1/2', 200, 90, 48), ...fr([0, '2/4'], '2/4', 400, 90, 48),
    write([0, 'different'], 'different numbers', 300, 175, 24, 'd'),
    write([1, 'more'], 'who ate more?', 300, 230, 32),
    bar([1, 'bar'], X, 290, W, 60, 2),
  ],
  // The big idea: cut every piece, multiply the top and the bottom
  [
    bar([0, 'Cut'], 150, 45, 300, 70, 2), shade([0, 'Cut'], 150, 45, 300, 70, 2, 1),
    cut([0, 'smaller'], 225, 33, 127), cut([0, 'smaller'], 375, 33, 127),
    ...fr([0, 'multiply'], '1/2', 180, 265, 48),
    arrow([0, 'top'], [215, 235], [385, 235]), write([0, 'top'], '× 2', 300, 205, 28),
    arrow([0, 'bottom'], [215, 295], [385, 295]), write([0, 'bottom'], '× 2', 300, 330, 28),
    ...fr([0, 'bottom'], '2/4', 420, 265, 48, 'y'),
  ],
  // Cut every piece
  [
    ...fr([0, '1/2'], '1/2', 65, 150, 34), bar([0, 'pieces'], X, 110, W, 80, 2), shade([0, 'shaded'], X, 110, W, 80, 2, 1),
    cut([1, 'cut'], 210, 98, 202), cut([1, 'middle'], 390, 98, 202),
    write([1, 'middle'], '2 pieces', 210, 240, 24, 'd'), write([1, 'middle'], '2 pieces', 390, 240, 24, 'd'),
  ],
  // Count the new pieces
  [
    bar([0, 'Now'], X, 60, W, 70, 4),
    ...[1, 2, 3, 4].map(i => ({ ...write([0, '4'], String(i), X + 45 + 90 * (i - 1), 155, 22, 'd'), quick: true })),
    shade([0, 'shaded'], X, 60, W, 70, 4, 2), ...fr([0, '2/4'], '2/4', 65, 95, 32),
    bar([1, 'before'], X, 190, W, 70, 2), shade([1, 'before'], X, 190, W, 70, 2, 1), ...fr([1, 'before'], '1/2', 65, 225, 32),
    { ...line([1, 'before'], [[300, 45], [300, 275]], 'y', 4) },
    write([1, 'before'], 'same amount', 300, 320, 32, 'y'),
  ],
  // Top and bottom both change
  [
    ...fr([0, 'numbers'], '1/2', 130, 150, 56),
    { ...line([1, 'bottom'], [[448, 150], [492, 150]]), quick: true },
    arrow([1, '4'], [175, 185], [420, 185]), write([1, '4'], '4', 470, 185, 56, 'y'),
    write([1, '4'], '× 2', 300, 215, 28),
    arrow([2, 'top'], [175, 115], [420, 115]), write([2, 'top'], '2', 470, 115, 56, 'y'),
    write([2, 'top'], '× 2', 300, 85, 28),
    ...expr([3, '2/4'], '1/2 = 2/4', 300, 295, 40, 'y'),
    write([3, 'same'], 'the same amount', 300, 368, 26, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...expr([1, 'bottom'], '1/2 = 1/4', 160, 180, 44, 'r'), cross([1, 'not'], 70, 125, 180, 110),
    bar([2, 'smaller'], 60, 265, 200, 34, 2), shade([2, 'smaller'], 60, 265, 200, 34, 2, 1), ...fr([2, 'smaller'], '1/2', 290, 282, 20),
    bar([2, 'smaller'], 60, 318, 200, 34, 4), shade([2, 'smaller'], 60, 318, 200, 34, 4, 1), ...fr([2, 'smaller'], '1/4', 290, 335, 20),
    ...expr([2, 'Multiply'], '1/2 = 2/4', 440, 185, 40, 'y'),
    write([2, 'same'], 'top × 2', 450, 270, 24, 'y'), write([2, 'number'], 'bottom × 2', 450, 310, 24, 'y'),
  ],
]
