/** g3m6-t4's chalkboards: index = screen index (0 is Screen 1, which has none). The ✕s white, lengths that match blue, counts yellow. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, span, wash, ring, cross } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
// The 7 pencils, in the order of the list: 4 1/2, 5, 4, 4 1/2, 6, 5, 4 1/2 inches.
const LIST = ['4 1/2', '5', '4', '4 1/2', '6', '5', '4 1/2']
const LIST_X = [60, 145, 205, 275, 355, 425, 510]
const LABELS = ['4', '4 1/2', '5', '5 1/2', '6']
const col = (len: string) => LABELS.indexOf(len)
const list = (at: At, y: number, c: ChalkColor = 'w', s = 28) => LIST.map((t, i) => q(write(at, t, LIST_X[i], y, s, c)))

/** A line plot: the line and a tick at each length (x = xs), the lengths under it; ✕s stack `gap` apart from `y - gap`. */
const plot = (xs: number[], y: number, s: number, gap: number) => {
  const line = (at: At): ChalkMark => q({ beat: at[0], at: at[1], d: `M${xs[0] - 40} ${y} H${xs[4] + 40}` + xs.map(x => ` M${x} ${y} v12`).join('') })
  const label = (at: At, i: number, c: ChalkColor = 'w') => q(write(at, LABELS[i], xs[i], y + 35, s, c))
  const labels = (at: At) => LABELS.map((_, i) => label(at, i))
  const cy = (k: number) => y - gap * (k + 1)
  const xMark = (at: At, i: number, k: number, quick = true): ChalkMark => {
    const x = xs[i], h = gap * 0.34, m: ChalkMark = { beat: at[0], at: at[1], d: `M${x - h} ${cy(k) - h} L${x + h} ${cy(k) + h} M${x + h} ${cy(k) - h} L${x - h} ${cy(k) + h}` }
    return quick ? q(m) : m
  }
  /** Every pencil's ✕, in list order, each on top of the ones already above its length. */
  const all = (at: At, quick = true) => { const n = [0, 0, 0, 0, 0]; return LIST.map(t => xMark(at, col(t), n[col(t)]++, quick)) }
  return { line, label, labels, cy, xMark, all }
}
const BIG = plot([100, 200, 300, 400, 500], 300, 24, 32)
const COUNTS = [1, 3, 2, 0, 1]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // A list is hard to read
  [
    ...list([0, 'list'], 80),
    ...[0, 3, 6].map(i => ring([1, 'same'], LIST_X[i], 80, 44, 24, 'b')),
    write([1, 'longer'], 'longer than 5?', 300, 170, 30),
    BIG.line([2, 'picture']),
  ],
  // The big idea: one ✕ is one pencil, above its length; count them
  [
    BIG.line([0, 'Each']), ...BIG.labels([0, 'Each']),
    { beat: 0, at: 'one', d: 'M175 62 L205 92 M205 62 L175 92' }, write([0, 'measured'], '= 1 pencil', 300, 77, 30),
    ...BIG.all([0, 'above']),
    ...COUNTS.map((n, i) => write([0, 'count'], String(n), 100 + 100 * i, n ? BIG.cy(n - 1) - 36 : BIG.cy(0), 28, 'y')),
  ],
  // Put the lengths in order
  [
    BIG.line([0, 'line']),
    span([1, 'apart'], 100, 200, 255, 'd'), write([1, 'apart'], '1/2 inch', 150, 220, 22, 'd'),
    BIG.label([2, '4'], 0), BIG.label([2, '1/2'], 1), BIG.label([2, '5'], 2), BIG.label([2, '5'], 3), BIG.label([2, '6'], 4),
  ],
  // One ✕ for each pencil: each list item, then its ✕
  [
    BIG.line([0, 'Now']), ...BIG.labels([0, 'Now']), ...list([0, 'pencils'], 70, 'd', 26),
    ...BIG.all([1, 'one'], false).flatMap((m, i) => [q({ beat: 1, at: 'one', c: 'd', w: 2, d: `M${LIST_X[i] - 20} 94 H${LIST_X[i] + 20}` }), m]),
    write([2, 'all'], '7 in all', 470, 150, 32, 'y'),
  ],
  // Now count: to the right of 5
  [
    BIG.line([0, 'Which']), ...BIG.labels([0, 'Which']), ...BIG.all([0, 'Which']),
    wash([0, 'right'], 335, 185, 200, 108, 'y'),
    write([1, 'no'], '0', 400, BIG.cy(0), 30, 'y'),
    ring([1, '6'], 500, BIG.cy(0), 22, 22, 'y'), write([1, '6'], '1', 500, BIG.cy(0) - 44, 30, 'y'),
    write([2, 'pencil'], '1 pencil longer than 5 inches', 300, 110, 28, 'y'),
  ],
  // One thing not to do: a small copy of the plot
  (() => {
    const S = plot([90, 160, 230, 300, 370], 300, 20, 26)
    return [
      ...warn([0, 'mix']),
      S.line([1, "Don't"]), ...S.labels([1, "Don't"]), ...S.all([1, "Don't"]),
      ring([1, 'NUMBERS'], 160, 335, 32, 17, 'r'), write([1, 'NUMBERS'], '4 pencils?', 495, 190, 30, 'r'),
      cross([2, 'not'], 405, 168, 180, 44),
      ring([2, 'Count'], 160, S.cy(1), 20, 44, 'y'), write([2, 'many'], '3 pencils', 495, 290, 30, 'y'),
    ]
  })(),
]
