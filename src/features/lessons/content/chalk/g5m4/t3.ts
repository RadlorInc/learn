/** g5m4-t3's chalkboards: index = screen index (0 is Screen 1, which has none). g3m2's number line, 3.2 to 3.3 in hundredths. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross, arrow, box } from '../../../chalk'
import { X, numberLine, label, dot as spot } from '../g3m2/t6'
import { q, warn, dot, numAt, type At } from './t1'

/** One-step hops above the line from step a to step b, either way. */
const arcs = (at: At, a: number, b: number, y: number, c: ChalkColor): ChalkMark => {
  const dir = Math.sign(b - a)
  const d = Array.from({ length: Math.abs(b - a) }, (_, k) => {
    const x1 = X(a + k * dir), x2 = X(a + (k + 1) * dir)
    return `M${x1} ${y} Q${(x1 + x2) / 2} ${y - 34} ${x2} ${y} M${x2 - dir * 9} ${y - 9} L${x2} ${y} L${x2 - dir} ${y - 12}`
  }).join(' ')
  return { beat: at[0], at: at[1], c, d }
}
/** A price-tag outline, its left edge at x, its middle at y. */
const tag = (at: At, x: number, y: number, w: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat: at[0], at: at[1], c, d: `M${x} ${y - 40} H${x + w} L${x + w + 40} ${y} L${x + w} ${y + 40} H${x} Z M${x + w + 8} ${y} a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0` })
const ends = (at: At, y: number): ChalkMark[] => q([label(at, '3.2', 0, y, 'd'), label(at, '3.3', 10, y, 'd')])

// Colours: yellow = the closer number and the rounded answer, blue = halfway, dim = the ends and the longer way, coral = the chop.
export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too many places
  [
    tag([0, 'tag'], 180, 85, 220),
    box([0, 'one'], 230, 60, 40, 50), dot([0, 'point'], 290, 104), box([0, 'point'], 310, 60, 40, 50, 'y'),
    ...numAt([1, '3.27'], '3.27', 250, 205, 48),
    { ...line([1, 'two'], [[0, 0]], 'r'), d: 'M281 240 h22 M308 240 h22', w: 3 }, write([1, 'two'], '2 places', 450, 205, 28, 'r'),
    write([2, '3.2'], '3.2', 200, 310, 44), write([2, 'or'], 'or', 300, 310, 30, 'd'), write([2, '3.3'], '3.3', 400, 310, 44),
  ],
  // The big idea
  [
    ...numberLine([0, 'Find'], 140), ...ends([0, 'two'], 140),
    spot([0, 'sits'], 7, 140), write([0, 'sits'], '3.27', X(7), 92, 24),
    arcs([0, 'closer'], 7, 10, 140, 'y'), ring([0, 'closer'], X(10), 182, 28, 20, 'y'),
    spot([0, 'halfway'], 5, 140, 'b'), label([0, 'halfway'], 'halfway', 5, 140, 'b', 22),
    arrow([0, 'up'], [X(5), 262], [X(10), 262], 'y'), write([0, 'up'], 'round up', X(7.5), 300, 26, 'y'),
  ],
  // Find halfway
  [
    ...numberLine([0, 'Look'], 190), spot([0, '3.27'], 7, 190), write([0, '3.27'], '3.27', X(7), 150, 26),
    label([0, '3.2'], '3.2', 0, 190), label([0, '3.3'], '3.3', 10, 190),
    spot([1, 'Halfway'], 5, 190, 'b'), write([1, 'Halfway'], 'halfway', X(5), 150, 24, 'b'), label([1, '3.25'], '3.25', 5, 190, 'b'),
  ],
  // Which is closer?
  [
    ...numberLine([0, 'So'], 200), ...ends([0, 'So'], 200), ...q([spot([0, 'So'], 5, 200, 'b'), label([0, 'So'], '3.25', 5, 200, 'b', 22)]),
    spot([0, '3.27'], 7, 200), label([0, '3.27'], '3.27', 7, 200),
    write([0, 'Past'], 'past halfway', 350, 300, 26, 'b'),
    arcs([1, 'Up'], 7, 10, 200, 'y'), write([1, '3'], '3 hundredths', X(8.5), 130, 24, 'y'),
    arcs([2, 'Back'], 7, 0, 200, 'd'), write([2, '7'], '7 hundredths', X(3.5), 130, 24, 'd'),
  ],
  // Round it
  [
    ...numberLine([0, '3.3'], 110), ...ends([0, '3.3'], 110), ...q([spot([0, '3.3'], 7, 110), write([0, '3.3'], '3.27', X(7), 72, 24)]),
    ring([0, 'closer'], X(10), 152, 28, 20, 'y'),
    write([0, 'up'], '3.27 → 3.3', 300, 235, 44, 'y'),
    tag([1, 'tag'], 200, 325, 160, 'y'), write([1, 'meters'], '3.3 m', 280, 325, 40, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...numAt([1, 'CHOP'], '3.27', 160, 165, 48), line([1, 'digit'], [[216, 190], [242, 140]], 'r'),
    write([1, '3.2'], '→ 3.2', 370, 165, 48, 'r'), cross([1, '3.2'], 315, 135, 115, 60),
    write([2, '3.3'], '3.27 → 3.3', 300, 300, 48, 'y'),
  ],
]
