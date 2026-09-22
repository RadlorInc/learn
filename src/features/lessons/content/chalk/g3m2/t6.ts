/** g3m2-t6's chalkboards: index = screen index (0 is Screen 1, which has none). Also the number line t7 draws with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross } from '../../../chalk'

export type At = [number, string?]
export const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))
/** The warning triangle every Screen 7 opens with. */
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 25], [345, 100], [255, 100], [300, 25]], 'r'), write(at, '!', 300, 75, 40, 'r')]

/** A number line of 10 steps, 48 apart, from x = 60 to 540. `X(i)` is step i (0–10). */
export const X = (i: number) => 60 + i * 48
export const numberLine = (at: At, y: number, c: ChalkColor = 'w'): ChalkMark[] => q([
  line(at, [[40, y], [560, y]], c, 3),
  { ...line(at, [[0, 0]], c), d: Array.from({ length: 11 }, (_, i) => `M${X(i)} ${y - 8} v16`).join(' '), w: 2 },
])
/** A label under step i. */
export const label = (at: At, t: string, i: number, y: number, c: ChalkColor = 'w', s = 26): ChalkMark => write(at, t, X(i), y + 42, s, c)
/** A dot on step i. */
export const dot = (at: At, i: number, y: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat: at[0], at: at[1], c, w: 6, d: `M${X(i) - 5} ${y} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0` })
/** One-step hops from step a to step b: above the line going right, below it going left. */
export const hops = (at: At, a: number, b: number, y: number, c: ChalkColor = 'y'): ChalkMark => {
  const dir = Math.sign(b - a), up = dir > 0 ? -1 : 1
  const d = Array.from({ length: Math.abs(b - a) }, (_, k) => {
    const x1 = X(a + k * dir), x2 = X(a + (k + 1) * dir)
    return `M${x1} ${y} Q${(x1 + x2) / 2} ${y + up * 34} ${x2} ${y} M${x2 - dir * 9} ${y + up * 9} L${x2} ${y} L${x2 - dir * 1} ${y + up * 12}`
  }).join(' ')
  return { beat: at[0], at: at[1], c, d }
}

// Colours: yellow = the closer ten (the answer), white = the number being placed, dim = the longer way, blue = right in the middle.
export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // The first digit can fool you
  [
    write([0, '37'], '37', 250, 80, 56), ring([0, '3'], 240, 80, 20, 30, 'r'),
    write([0, '30'], '30 ?', 400, 80, 40, 'd'),
    cross([1, 'not'], 355, 50, 90, 60),
    write([1, 'closer'], 'which ten is closer?', 300, 170, 32, 'y'),
    ...numberLine([2, 'Use'], 270), label([2, 'line'], '30', 0, 270, 'd'), label([2, 'line'], '40', 10, 270, 'd'),
    dot([2, 'line'], 7, 270), label([2, 'line'], '37', 7, 270),
  ],
  // The big idea
  [
    ...numberLine([0, 'number'], 130), label([0, 'ten'], '30', 0, 130, 'd'), label([0, 'ten'], '40', 10, 130, 'd'),
    dot([0, 'closer'], 7, 130), write([0, 'closer'], '37', X(7), 95, 26), hops([0, 'closer'], 7, 10, 130),
    ring([0, 'closer'], X(10), 172, 24, 20, 'y'),
    ...numberLine([0, 'middle'], 300), label([0, 'middle'], '30', 0, 300, 'd'), label([0, 'middle'], '40', 10, 300, 'd'),
    dot([0, 'middle'], 5, 300, 'b'), write([0, 'middle'], '35', X(5), 265, 26, 'b'),
    hops([0, 'up'], 5, 10, 300), ring([0, 'up'], X(10), 342, 24, 20, 'y'),
  ],
  // Find the two tens
  [
    ...numberLine([0, 'Look'], 200), dot([0, '37'], 7, 200), label([0, '37'], '37', 7, 200),
    label([0, '30'], '30', 0, 200), write([0, 'more'], 'more than 30', 150, 300, 24, 'd'),
    label([0, '40'], '40', 10, 200), write([0, 'less'], 'less than 40', 450, 300, 24, 'd'),
    ring([1, 'between'], X(0), 242, 26, 20, 'y'), ring([1, 'between'], X(10), 242, 26, 20, 'y'),
  ],
  // Which ten is closer?
  [
    ...numberLine([0, 'Count'], 190), label([0, 'Count'], '30', 0, 190, 'd'), label([0, 'Count'], '40', 10, 190, 'd'),
    dot([0, 'Count'], 7, 190), label([0, 'Count'], '37', 7, 190),
    hops([0, 'up'], 7, 10, 190), write([0, '3'], '3 hops', X(8.5), 120, 28, 'y'),
    hops([1, 'back'], 7, 0, 190, 'd'), write([1, '7'], '7 hops', X(3.5), 280, 28, 'd'),
    ring([2, 'fewer'], X(8.5), 120, 58, 24, 'y'),
    write([2, 'about'], '37 → 40', 300, 345, 36, 'y'),
  ],
  // Right in the middle
  [
    ...numberLine([0, 'What'], 190), label([0, 'What'], '30', 0, 190, 'd'), label([0, 'What'], '40', 10, 190, 'd'),
    dot([0, '35'], 5, 190, 'b'), label([0, '35'], '35', 5, 190, 'b'),
    hops([1, '30'], 5, 0, 190, 'd'), write([1, '30'], '5 hops', X(2.5), 280, 28, 'd'),
    hops([1, '40'], 5, 10, 190, 'd'), write([1, '40'], '5 hops', X(7.5), 120, 28, 'd'),
    write([2, 'middle'], 'in the middle → up', 300, 55, 30, 'b'),
    write([2, 'rounds'], '35 → 40', 300, 345, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'KEEP'], '37', 230, 160, 44), ring([1, '3'], 223, 160, 17, 26, 'r'),
    write([1, '30'], '→ 30', 345, 160, 44, 'r'), cross([1, '30'], 180, 128, 230, 64),
    ...numberLine([2, 'hops'], 260), label([2, 'hops'], '30', 0, 260, 'd'), label([2, 'hops'], '40', 10, 260, 'd'),
    dot([2, 'hops'], 7, 260), hops([2, 'hops'], 7, 10, 260),
    write([2, '40'], '37 → 40', 300, 360, 40, 'y'),
  ],
]
