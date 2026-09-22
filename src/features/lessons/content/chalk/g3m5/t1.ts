/** g3m5-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the bar and fraction shapes t2–t4 draw with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, span, ring, cross, person, wash } from '../../../chalk'
import { warn, tick } from '../g3m1/t1'

export type At = [number, string?]
// Colours in this module: y = the pieces you have / fair, b = all the pieces of the whole, r = warning, d = labels.

/** A bar cut at the given widths (fractions of the bar; any sizes, so an UNFAIR cut can be drawn), as one stroke. */
export const bar = ([beat, at]: At, x: number, y: number, w: number, h: number, parts: number[], c: ChalkColor = 'w'): ChalkMark => {
  const tot = parts.reduce((a, b) => a + b, 0)
  let cx = x
  const cuts = parts.slice(0, -1).map(p => { cx += (w * p) / tot; return ` M${Math.round(cx)} ${y} v${h}` }).join('')
  return { beat, at, c, d: `M${x} ${y} h${w} v${h} h${-w} Z${cuts}` }
}
/** Equal-width measuring spans under each of `n` equal cells: "every piece the same size". */
export const sameSpans = (at: At, x: number, y: number, w: number, n: number, c: ChalkColor = 'y'): ChalkMark[] =>
  Array.from({ length: n }, (_, i) => ({ ...span(at, x + (w * i) / n + 6, x + (w * (i + 1)) / n - 6, y, c), quick: true }))
/** A fraction written the grade-3 way, stacked: top number, a bar, bottom number. Each piece at its own word. */
export const stacked = (atTop: At | null, atLine: At, atBot: At | null, top: string, bot: string, x: number, y: number, s = 44,
  ct: ChalkColor = 'y', cb: ChalkColor = 'b'): ChalkMark[] => [
  { beat: atLine[0], at: atLine[1], c: 'w', d: `M${x - s * 0.45} ${y} H${x + s * 0.45}` },
  ...(atBot ? [write(atBot, bot, x, y + s * 0.68, s, cb)] : []),
  ...(atTop ? [write(atTop, top, x, y - s * 0.68, s, ct)] : []),
]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two pieces is not enough to know
  [
    bar([0, '2'], 80, 50, 360, 70, [1, 1]),
    { ...write([0, 'each'], 'you', 170, 85, 24, 'd'), quick: true }, write([0, 'each'], 'friend', 350, 85, 24, 'd'),
    bar([1, 'sandwich'], 80, 180, 360, 70, [3, 1]),
    write([1, 'big'], 'big', 215, 215, 26, 'r'), write([1, 'small'], 'small', 395, 215, 22, 'r'),
    { ...write([2, 'counting'], '2 pieces', 520, 85, 22, 'd'), quick: true }, write([2, 'counting'], '2 pieces', 520, 215, 22, 'd'),
    write([2, 'No'], 'counting is not enough', 300, 320, 30, 'r'),
  ],
  // The big idea: fair = every piece the same size
  [
    write([0, 'fair'], 'fair', 300, 70, 36, 'y'),
    bar([0, 'every'], 100, 120, 400, 80, [1, 1, 1, 1]),
    ...sameSpans([0, 'same'], 100, 235, 400, 4),
    write([0, 'size'], 'every piece the same size', 300, 300, 30, 'y'),
  ],
  // Cut down the middle
  [
    bar([0, 'sandwich'], 150, 50, 300, 80, [1]),
    { beat: 0, at: 'middle', c: 'y', w: 4, d: 'M300 38 V142' },
    ...sameSpans([1, 'both'], 150, 165, 300, 2),
    write([1, 'match'], 'they match', 300, 210, 28, 'y'),
    write([2, 'fair'], '2 fair pieces', 300, 265, 32, 'y'),
    write([2, 'you'], 'you', 225, 330, 26, 'b'), write([2, 'friend'], 'friend', 375, 330, 26, 'b'),
  ],
  // More friends, more cuts
  [
    ...[150, 250, 350, 450].map(x => ({ ...person([0, 'friends'], x, 135, 80, 0.25, 'd'), quick: true })),
    bar([1, 'cut'], 100, 170, 400, 70, [1, 1, 1, 1]),
    ...sameSpans([1, 'same'], 100, 265, 400, 4),
    wash([2, 'gets'], 100, 170, 100, 70, 'b'),
    write([2, '1'], '1 of 4 equal pieces', 300, 330, 30, 'b'),
  ],
  // Check with your eyes
  [
    bar([1, 'every'], 80, 60, 360, 70, [1, 1, 1]),
    ...sameSpans([1, 'matches'], 80, 155, 360, 3),
    write([1, 'fair'], 'fair', 510, 95, 32, 'y'), tick([1, 'fair'], 548, 95),
    bar([2, 'one'], 80, 220, 360, 70, [1.6, 0.7, 0.7]),
    ring([2, 'bigger'], 176, 255, 106, 48, 'r'),
    write([2, 'not'], 'not fair', 515, 255, 30, 'r'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    bar([1, 'COUNT'], 60, 140, 300, 60, [1.6, 0.8, 0.8, 0.8]),
    write([1, 'pieces'], '4 pieces', 440, 170, 26, 'r'), write([1, 'fair'], '= fair', 530, 170, 26, 'r'), cross([1, 'fair'], 492, 150, 76, 40),
    ring([2, 'bigger'], 111, 170, 58, 42, 'r'),
    bar([2, 'Every'], 60, 270, 300, 60, [1, 1, 1, 1], 'y'),
    write([2, 'same'], 'same size = fair', 475, 300, 24, 'y'),
  ],
]
