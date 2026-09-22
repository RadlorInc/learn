/** g6m2-t3's chalkboards: index = screen index (0 is Screen 1, which has none). The bed is drawn to scale: 2 1/2 by 1 1/2. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, wash, arrow } from '../../../chalk'
import { row, crossRow, fr, bar, warn, tick, ex, px, type At, type Tok } from './t1'

/** The bed, 2 1/2 × 1 1/2 units of u, top left (x, y): outline, the two cuts, and (with `labels`) its side lengths. */
const bed = (at: At, x: number, y: number, u: number, labels = true): ChalkMark[] => [
  box(at, x, y, 2.5 * u, 1.5 * u),
  { ...line(at, [[x + 2 * u, y], [x + 2 * u, y + 1.5 * u]]), quick: true },
  { ...line(at, [[x, y + u], [x + 2.5 * u, y + u]]), quick: !labels },
  ...(labels ? [
    { ...write(at, '2', x + u, y - 22, 26, 'd'), quick: true }, ...fr(at, '1', '2', x + 2.25 * u, y - 30, 20, 'd'),
    { ...write(at, '1', x - 25, y + u / 2, 26, 'd'), quick: true }, ...fr(at, '1', '2', x - 25, y + 1.25 * u, 20, 'd'),
  ] : []),
]
/** Part of the bed washed: 'big' (2 by 1), 'right' (1/2 by 1), 'bottom' (2 by 1/2), 'corner' (1/2 by 1/2). */
type Part = 'big' | 'right' | 'bottom' | 'corner'
const R: Record<Part, [number, number, number, number]> = { big: [0, 0, 2, 1], right: [2, 0, 0.5, 1], bottom: [0, 1, 2, 0.5], corner: [2, 1, 0.5, 0.5] }
const part = (at: At, p: Part, x: number, y: number, u: number, c: ChalkColor = 'b'): ChalkMark => {
  const [a, b, w, h] = R[p]
  return { ...wash(at, x + a * u, y + b * u, w * u, h * u, c), quick: true }
}
const mid = (p: Part, x: number, y: number, u: number): [number, number] => { const [a, b, w, h] = R[p]; return [x + (a + w / 2) * u, y + (b + h / 2) * u] }

const X = 70, Y = 75, U = 110
const sum4 = ex([3, 'Add'], '2 + 1/2 + 1 + 1/4')
const back6: Tok[] = [...ex([1, '12/4'], '15/4 = 12/4 +'), ...ex([1, '3/4'], '3/4')]
const wrong7: Tok[] = [[[1, 'wholes'], '2 × 1', 'r'], [[1, 'fractions'], '+', 'r'], ...ex([1, 'fractions'], '1/2 × 1/2', 'r'), ...ex([1, 'SEPARATELY'], '= 2 1/4', 'r')]

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two pieces go missing
  [
    ...bed([0, 'tempting'], X, Y, U),
    part([0, '2'], 'big', X, Y, U), write([0, 'and'], '2', ...mid('big', X, Y, U), 34),
    part([0, '1/2'], 'corner', X, Y, U), ...fr([0, '1/4'], '1', '4', ...mid('corner', X, Y, U), 18),
    ...row(ex([1, '2'], '2 1/4 ?'), 475, 120, 36),
    write([1, 'missing'], '?', ...mid('right', X, Y, U), 34, 'r'), write([1, 'missing'], '?', ...mid('bottom', X, Y, U), 34, 'r'),
    write([1, 'missing'], '2 parts missing', 475, 215, 26, 'r'),
  ],
  // The big idea: mixed numbers → fractions, then tops × tops and bottoms × bottoms
  [
    ...row(ex([0, 'Change'], '2 1/2 × 1 1/2'), 300, 65, 40),
    arrow([0, 'fraction'], [300, 110], [300, 150], 'd'),
    ...row(ex([0, 'fraction'], '5/2 × 3/2'), 300, 200, 40),
    write([0, 'tops'], '=', 225, 320, 40), write([0, 'tops'], '5 × 3', 300, 296, 36), line([0, 'tops'], [[250, 320], [350, 320]]),
    write([0, 'bottoms'], '2 × 2', 300, 346, 36),
  ],
  // Every part counts
  [
    ...bed([0, 'four'], X, Y, U),
    part([1, '2'], 'big', X, Y, U), write([1, '2'], '2', ...mid('big', X, Y, U), 34),
    part([1, '1/2'], 'right', X, Y, U), ...fr([1, '1/2'], '1', '2', ...mid('right', X, Y, U), 22),
    part([2, '2'], 'bottom', X, Y, U), write([2, '2'], '1', ...mid('bottom', X, Y, U), 30),
    part([2, 'corner'], 'corner', X, Y, U), ...fr([2, 'corner'], '1', '4', ...mid('corner', X, Y, U), 18),
    ...row(sum4, 470, 120, 30),
    ...row([[[3, '3'], '=', 'y'], ...ex([3, '3'], '3 3/4', 'y')], 470, 205, 42),
    write([3, 'square'], 'square yards', 470, 272, 24, 'd'),
  ],
  // Change to fractions
  [
    write([0, 'faster'], 'a faster way?', 280, 45, 30), tick([0, 'Yes'], 395, 45),
    ...[[30, 2], [130, 2], [230, 1]].flatMap(([x, k]) => bar([1, '2'], x, 95, 90, 45, 2, k, 'b', [1, 'halves'])),
    write([1, 'halves'], '5 halves', 175, 170, 22, 'd'),
    ...row([...ex([1, '2'], '2 1/2 ='), ...ex([1, '5/2'], '5/2')], 460, 118, 36),
    ...[[30, 2], [130, 1]].flatMap(([x, k]) => bar([2, '1'], x, 225, 90, 45, 2, k, 'b', [2, 'halves'])),
    write([2, 'halves'], '3 halves', 125, 300, 22, 'd'),
    ...row([...ex([2, '1'], '1 1/2 ='), ...ex([2, '3/2'], '3/2')], 460, 248, 36),
  ],
  // Multiply, then change back
  [
    ...row([...ex([0, '5/2'], '5/2 × 3/2 ='), ...ex([0, '15/4'], '15/4')], 300, 70, 40),
    ...row(back6, 300, 165, 38), write([1, 'wholes'], '3 wholes', px(back6, 300, 38, 2), 225, 22, 'd'),
    ...row([[[2, '3'], '=', 'y'], ...ex([2, '3'], '3 3/4', 'y')], 300, 300, 44),
    write([2, 'square'], 'square yards', 300, 372, 24, 'd'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...row(wrong7, 300, 170, 34), crossRow([1, 'SEPARATELY'], wrong7, 300, 170, 5, 7, 34),
    ...bed([2, 'leaves'], 80, 250, 60, false),
    part([2, 'leaves'], 'big', 80, 250, 60), part([2, 'leaves'], 'corner', 80, 250, 60),
    part([2, 'parts'], 'right', 80, 250, 60, 'r'), part([2, 'parts'], 'bottom', 80, 250, 60, 'r'),
    write([2, 'parts'], '?', 245 - 30, 280, 26, 'r'), write([2, 'parts'], '?', 140, 325, 26, 'r'),
    ...row(ex([2, 'fractions'], '5/2 × 3/2', 'y'), 430, 295, 40),
  ],
]
