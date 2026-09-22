/** g8m1-t6's chalkboards: index = screen index (0 is Screen 1, which has none). Also the small kit t7–t9 share.
 *  Yellow is the number the point lands on / the answer, blue the small number, coral the mix-up, dim the labels. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring, hop, chalkWidth } from '../../../chalk'
import { warn, q } from '../g6m5/t1'

export type At = [beat: number, at?: string]
export { warn, q }

/**
 * A line of math with raised exponents, centred on x: `'5.2 × 10^{−4}'`. The chalk face has no ⁻ ⁴, so each `^{…}` is
 * written small and raised. Written word by word, so an estimate that is off for one word cannot push the exponent
 * onto its base (one long string drifted by a whole digit on the rendered board).
 */
export function ex(at: At, str: string, x: number, y: number, s = 40, c: ChalkColor = 'w'): ChalkMark[] {
  const ss = Math.round(s * 0.6), sp = s * 0.4
  const parts: { t: string; sup: boolean; w: number }[] = []
  str.split(/\^\{([^}]*)\}/).forEach((seg, i) => {
    if (i % 2) { parts.push({ t: seg, sup: true, w: chalkWidth(seg, ss) * 0.9 + s * 0.04 }); return }
    for (const tok of seg.split(/( +)/)) if (tok) parts.push({ t: tok, sup: false, w: tok.trim() ? chalkWidth(tok, s) * 0.9 : sp * tok.length })
  })
  let cx = x - parts.reduce((a, p) => a + p.w, 0) / 2
  return parts.flatMap(p => {
    const m = p.t.trim() ? [write(at, p.t, cx + (p.sup ? s * 0.04 : 0) + (p.w - (p.sup ? s * 0.04 : 0)) / 2, p.sup ? y - s * 0.42 : y, p.sup ? ss : s, c)] : []
    cx += p.w
    return m
  })
}

/** A decimal written one character at a time on a fixed grid, so the point's hops land between its digits. */
export function dec(at: At, str: string, x: number, y: number, s = 52, c: ChalkColor = 'w') {
  const chars = [...str], ws = chars.map(ch => (ch === '.' ? s * 0.32 : s * 0.56))
  let cx = x - ws.reduce((a, b) => a + b, 0) / 2
  const mid: number[] = []
  const marks = chars.map((ch, i) => { mid.push(cx + ws[i] / 2); cx += ws[i]; return q(write(at, ch, mid[i], y, s, c)) })
  const right = (i: number) => mid[i] + ws[i] / 2
  /** The point moving right `n` places: one hop from the point over each digit it passes. */
  const hops = (hat: At, n: number, hc: ChalkColor = 'y') => {
    const p = chars.indexOf('.'), out: ChalkMark[] = []
    let from = mid[p]
    for (let k = 1; k <= n; k++) { const to = right(p + k); out.push(q(hop(hat, from, to, y - s * 0.5, hc))); from = to }
    return out
  }
  /** The x the k-th hop (1-based) lands over, for numbering them. */
  const hopMid = (k: number) => { const p = chars.indexOf('.'); return ((k === 1 ? mid[p] : right(p + k - 1)) + right(p + k)) / 2 }
  return { marks, mid, right, hops, hopMid }
}

const POLLEN = (at: At, x: number, y: number, s = 52, c: ChalkColor = 'w') => dec(at, '0.00052', x, y, s, c)

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // A positive exponent is too big
  [
    ...ex([0, 'big'], '1.5 × 10^{8}', 150, 75, 38), write([0, 'positive'], 'big number, + exponent', 150, 130, 22, 'd'),
    ...ex([1, 'could'], '5.2 × 10^{4}', 440, 75, 38), write([1, 'could'], '?', 520, 75, 38, 'y'),
    cross([2, 'no'], 385, 50, 115, 50), write([2, '52,000'], '= 52,000', 440, 130, 30, 'r'),
    write([2, 'grain'], 'grain: 0.00052', 250, 225, 36, 'b'), write([2, 'smaller'], '< 1', 430, 225, 38, 'y'),
    ...ex([3, 'new'], '5.2 × 10^{?}', 300, 320, 48, 'y'),
  ],
  // The big idea: hop the point right, count the hops, make them negative
  (() => {
    const d = POLLEN([0, 'smaller'], 190, 130, 52)
    return [
      ...d.marks, ...d.hops([0, 'right'], 4),
      arrow([0, 'make'], [305, 130], [385, 130], 'd'), write([0, '10'], '5.2', 450, 130, 52, 'y'),
      write([0, 'jumps'], '4 jumps', 215, 55, 24, 'd'),
      ...ex([0, 'negative'], '5.2 × 10^{−4}', 300, 270, 56, 'y'),
    ]
  })(),
  // Move the point right
  (() => {
    const d = POLLEN([0, '0.00052'], 300, 130, 60)
    return [
      ...d.marks, ...d.hops([0, 'right'], 4),
      ring([1, 'stop'], d.mid[5], 130, 22, 34, 'y'),
      arrow([1, 'reads'], [300, 175], [300, 225], 'd'), write([1, 'reads'], '5.2', 300, 265, 56, 'y'),
      ...(['1', '2', '3', '4'] as const).map((n, k) => write([2, n], n, d.hopMid(k + 1), 55, 24, 'd')),
      write([2, '4'], '4 jumps', 300, 345, 30, 'y'),
    ]
  })(),
  // Each jump divides by 10
  [
    write([0, 'back'], '5.2', 70, 70, 40, 'y'),
    write([1, 'divide'], '÷ 10  ÷ 10  ÷ 10  ÷ 10', 310, 70, 34), write([1, '0.00052'], '= 0.00052', 300, 135, 34, 'b'),
    ...ex([2, 'each'], '÷ 10  =  × 10^{−1}', 300, 215, 36),
    ...ex([2, 'four'], 'four of them  =  × 10^{−4}', 300, 280, 32),
    ...ex([3, 'so'], '0.00052 = 5.2 × 10^{−4}', 300, 355, 40, 'y'),
  ],
  // Another one
  (() => {
    const d = dec([0, '0.03'], '0.03', 240, 130, 60)
    return [
      ...d.marks, ...d.hops([1, 'jumps'], 2),
      write([1, '2'], '2 jumps', 240, 55, 24, 'd'),
      arrow([1, 'make'], [320, 130], [390, 130], 'd'), write([1, 'make'], '3', 430, 130, 60, 'y'),
      ...ex([2, 'so'], '0.03 = 3 × 10^{−2}', 300, 290, 48, 'y'),
    ]
  })(),
  // One thing not to do
  (() => {
    const d = POLLEN([1, 'count'], 300, 175, 44)
    return [
      ...warn([0, 'mix']),
      ...d.marks, line([1, 'zeros'], [[d.right(1), 205], [d.right(4), 205]], 'r'),
      ...ex([1, 'after'], '5.2 × 10^{−3}', 300, 252, 36, 'r'), cross([1, 'point'], 245, 236, 100, 30),
      ...d.hops([2, 'jumps'], 4),
      ...ex([2, 'past'], '5.2 × 10^{−4}', 300, 335, 44, 'y'),
    ]
  })(),
]
