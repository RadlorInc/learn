/** g6m5-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the small kit t2–t5 share. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, cross, ring, chalkWidth } from '../../../chalk'

type Pt = [number, number]
type At = [beat: number, at?: string]
export const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
/** The warning triangle at the top of a "one thing not to do" board. */
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
/** Many small circles (marbles) drawn as ONE stroke. */
export const dots = ([beat, at]: At, pts: Pt[], r = 9, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: pts.map(([x, y]) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`).join(' ') })
export const row = (x: number, y: number, n: number, gap: number): Pt[] => Array.from({ length: n }, (_, i) => [x + i * gap, y])
/** A sack, tied at the neck (`open` leaves the tie off), centred on cx, `h` tall from `top`. */
export const bag = ([beat, at]: At, cx: number, top: number, w: number, h: number, open = false, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `M${cx - 18} ${top} L${cx - 26} ${top + 22} Q${cx - w / 2} ${top + 42} ${cx - w / 2} ${top + h * 0.62}`
    + ` Q${cx - w / 2} ${top + h} ${cx} ${top + h} Q${cx + w / 2} ${top + h} ${cx + w / 2} ${top + h * 0.62}`
    + ` Q${cx + w / 2} ${top + 42} ${cx + 26} ${top + 22} L${cx + 18} ${top}` + (open ? '' : ` Z M${cx - 30} ${top + 22} h60`) })

/**
 * An expression written token by token, centred on x: each token is `'3'`, `['4', 'b']`, or a power `'4^2'` (the chalk face
 * has no ² ³, so the small number is written raised). A token may carry its own word: `['5', 'y', 'five']`.
 */
export type Tok = string | [string, ChalkColor?, string?]
export function expr(at: At, toks: Tok[], x: number, y: number, s = 40): ChalkMark[] {
  const parts = toks.map(t => (typeof t === 'string' ? [t, 'w', undefined] : [t[0], t[1] ?? 'w', t[2]]) as [string, ChalkColor, string | undefined])
  const wOf = (t: string) => { const [b, e] = t.split('^'); return e ? chalkWidth(b, s) * 0.9 + chalkWidth(e, s * 0.6) : chalkWidth(b, s) }
  const gap = s * 0.25, total = parts.reduce((a, [t]) => a + wOf(t), 0) + gap * (parts.length - 1)
  let cx = x - total / 2
  return parts.flatMap(([t, c, w]) => {
    const [b, e] = t.split('^'), a: At = w ? [at[0], w] : at, bw = chalkWidth(b, s)
    const out = [write(a, b, cx + bw / 2, y, s, c)]
    if (e) out.push(write(a, e, cx + bw * 0.9 + chalkWidth(e, s * 0.6) / 2, y - s * 0.42, Math.round(s * 0.6), c))
    cx += wOf(t) + gap
    return out
  })
}
/** "= answer" with the answer in yellow, and a ring round the answer at `ringAt` (a later word) when given. */
export function answer(at: At, ans: string, x: number, y: number, s = 48, ringAt?: At): ChalkMark[] {
  const w = chalkWidth(ans, s)
  return [write(at, '=', x - w / 2 - s * (ringAt ? 0.8 : 0.55), y, s), write(at, ans, x, y, s, 'y'),
    ...(ringAt ? [ring(ringAt, x, y, w / 2 + s * 0.3, s * 0.62, 'y')] : [])]
}

// Colours across this topic: the bag's number (n, then 5) blue · the total yellow · the mix-up coral · labels dim.
export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // No number to write yet
  [
    dots([0, 'loose'], row(400, 150, 3, 34)), write([0, '3'], '3', 434, 205, 34),
    bag([1, 'closed'], 170, 70, 150, 170), write([1, 'bag'], '?', 170, 175, 56, 'b'),
    ...expr([2, 'total'], [['?', 'b'], '+', '3'], 300, 320, 44), write([2, 'number'], 'not one number yet', 300, 370, 24, 'd'),
  ],
  // The big idea: a letter for the number, then the number in its place
  [
    bag([0, 'letter'], 150, 40, 140, 150), write([0, 'letter'], 'n', 150, 140, 52, 'b'),
    q(dots([0, 'number'], row(265, 140, 3, 30))),
    write([0, 'once'], 'n = 5', 460, 115, 36, 'b'),
    ...expr([0, 'put'], [['n', 'b'], '+', '3'], 150, 290, 44), arrow([0, 'where'], [235, 290], [335, 290], 'd'),
    ...expr([0, 'is'], [['5', 'b'], '+', '3'], 430, 290, 44),
  ],
  // Call the bag n
  [
    bag([0, 'bag'], 170, 40, 150, 160), write([0, 'n'], 'n', 170, 145, 56, 'b'),
    write([1, 'many'], 'n = how many are inside', 300, 250, 28, 'b'),
    dots([2, '3'], row(300, 150, 3, 34)), write([2, 'more'], '3', 334, 195, 28),
    ...expr([2, "that's"], ['n', '+', '3'], 300, 330, 48).map(m => ({ ...m, c: 'y' as const })),
  ],
  // Open the bag
  [
    bag([0, 'open'], 150, 40, 150, 160, true),
    dots([0, 'count'], [[120, 130], [150, 130], [180, 130], [135, 165], [165, 165]], 10, 'b'), write([0, '5'], '5', 150, 235, 34, 'b'),
    write([1, 'is'], 'n = 5', 430, 90, 44, 'b'),
    ...expr([2, 'see'], [['n', 'b'], '+', '3'], 430, 190, 40), arrow([2, 'put'], [430, 222], [430, 270], 'd'),
    ...expr([2, '5'], [['5', 'b'], '+', '3'], 430, 310, 40),
  ],
  // Work it out
  [
    ...expr([0, 'n'], [['n', 'b'], '+', '3'], 300, 70, 44), arrow([0, 'becomes'], [300, 100], [300, 140], 'd'),
    ...expr([0, '5'], [['5', 'b'], '+', '3'], 300, 180, 44),
    ...answer([1, '8'], '8', 310, 270, 56),
    dots([1, 'marbles'], row(209, 350, 8, 26), 9, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'mean'], 'n = marbles', 300, 175, 40, 'r'), cross([1, 'marbles'], 185, 174, 230, 22),
    write([2, 'number'], 'n = a number', 300, 265, 40, 'y'), write([2, 'bag'], 'how many are in the bag', 300, 330, 28, 'y'),
  ],
]
