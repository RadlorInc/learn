/** g7m5-t4's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The spinner of 10 equal parts (4 blue, 3 red, 2 green, 1 yellow); yellow is the answer, coral the mix-up. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, box, cross } from '../../../chalk'

type At = [number, string?]
const COLORS = ['blue', 'red', 'blue', 'green', 'red', 'blue', 'yellow', 'red', 'blue', 'green']
const TONE: Record<string, ChalkColor> = { blue: 'b', red: 'r', green: 'd', yellow: 'y' }
const pt = (cx: number, cy: number, r: number, a: number) =>
  [+(cx + r * Math.cos(a)).toFixed(1), +(cy + r * Math.sin(a)).toFixed(1)] as const
const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / 10
/** Part i of the spinner as a closed wedge. */
const wedge = (cx: number, cy: number, r: number, i: number) => {
  const [x0, y0] = pt(cx, cy, r, ang(i)), [x1, y1] = pt(cx, cy, r, ang(i + 1))
  return `M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z`
}
/** The spinner: each part washed in its colour (only `only` if given), then the outline and the ten cuts. */
export const spinner = ([beat, at]: At, cx: number, cy: number, r: number, only?: string[]): ChalkMark[] => [
  ...COLORS.map((c, i) => ({ c, i })).filter(({ c }) => !only || only.includes(c))
    .map(({ c, i }): ChalkMark => ({ beat, at, d: wedge(cx, cy, r, i), c: TONE[c], wash: true, quick: true })),
  { beat, at, c: 'w', d: `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`
    + COLORS.map((_, i) => { const [x, y] = pt(cx, cy, r, ang(i)); return ` M${cx} ${cy} L${x} ${y}` }).join('') },
]
/** The middle of part i, `k` of the way out. */
const mid = (cx: number, cy: number, r: number, i: number, k = 0.62) => pt(cx, cy, r * k, ang(i + 0.5))
/** A small letter in every part naming its colour (b, r, g, y), for the screens about colours. */
const letters = (at: At, cx: number, cy: number, r: number): ChalkMark[] =>
  COLORS.map((c, i) => { const [x, y] = mid(cx, cy, r, i, 0.7); return { ...write(at, c[0], x, y, 24, TONE[c]), quick: true } })
const dotAt = ([beat, at]: At, x: number, y: number): ChalkMark => ({ beat, at, c: 'y', w: 6, d: `M${x - 3} ${y} a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0` })
const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Four colors does not mean 1/4
  [
    ...spinner([0, 'colors'], 150, 175, 115), ...letters([0, 'colors'], 150, 175, 115),
    write([0, 'colors'], 'blue', 60, 345, 22, 'b'), write([0, 'colors'], 'red', 118, 345, 22, 'r'),
    write([0, 'colors'], 'green', 180, 345, 22, 'd'), write([0, 'colors'], 'yellow', 255, 345, 22, 'y'),
    write([0, '4?'], '1 out of 4?', 445, 70, 32, 'r'),
    write([1, 'Blue'], 'blue: 4 parts', 445, 150, 30, 'b'),
    write([1, 'yellow'], 'yellow: 1 part', 445, 200, 30, 'y'),
    write([2, 'parts'], 'count parts,', 445, 275, 32, 'y'), write([2, 'colors'], 'not colors', 445, 320, 32, 'y'),
  ],
  // The big idea: the ways it can happen over all the equal ways, from 0 to 1
  [
    ...spinner([0, 'chance'], 150, 190, 120, ['blue']),
    write([0, 'happen'], 'ways it can happen', 445, 80, 26),
    line([0, 'over'], [[330, 108], [560, 108]]),
    write([0, 'equal'], 'all the equal ways', 445, 138, 26),
    line([0, 'number'], [[330, 270], [560, 270]]), line([0, 'number'], [[330, 258], [330, 282]]), line([0, 'number'], [[560, 258], [560, 282]]),
    write([0, '0'], '0', 330, 310, 30, 'y'), write([0, '1'], '1', 560, 310, 30, 'y'),
  ],
  // Count the ways: 4 blue parts out of 10
  [
    ...spinner([0, 'Count'], 150, 190, 125),
    ...[0, 2, 5, 8].map((p, k) => { const [x, y] = mid(150, 190, 125, p); return write([0, String(k + 1)], String(k + 1), x, y, 34, 'y') }),
    write([1, '10'], '10 equal parts', 445, 110, 30),
    write([2, 'out'], 'blue: 4 out of 10', 445, 200, 28, 'b'),
    write([2, '4/10'], '= 4/10', 445, 270, 44, 'y'),
  ],
  // Write it as a decimal
  [
    write([0, '4/10'], '4/10', 200, 70, 40), write([0, 'tenths'], '= four tenths', 370, 70, 32),
    box([1, 'decimal'], 180, 160, 110, 80), box([1, 'decimal'], 310, 160, 110, 80),
    write([1, 'decimal'], 'ones', 235, 140, 22, 'd'), write([1, 'decimal'], 'tenths', 365, 140, 22, 'd'),
    write([1, 'place'], '4', 365, 200, 44, 'y'),
    write([1, '0.4'], '0', 235, 200, 44, 'y'), dotAt([1, '0.4'], 300, 226), write([1, '0.4'], '0.4', 520, 200, 40, 'y'),
    write([2, 'same'], '4/10 = 0.4', 300, 310, 40, 'y'),
    write([2, 'ways'], 'one chance, two ways to write it', 300, 365, 22, 'd'),
  ],
  // And not blue?
  [
    ...spinner([0, 'What'], 140, 175, 110), ...letters([0, 'What'], 140, 175, 110),
    write([0, 'parts'], 'not blue: 6 parts', 440, 60, 28),
    write([1, '6/10'], '6/10 = 0.6', 440, 120, 32),
    write([2, '0.4'], '0.4 + 0.6 = 1', 440, 200, 34, 'y'),
    write([2, 'somewhere'], 'it always lands somewhere', 440, 245, 22, 'd'),
    write([3, 'purple'], 'purple?', 140, 340, 30, 'd'),
    write([3, '0'], 'chance = 0', 440, 340, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'NOT'], 'blue over not blue = 4/6', 300, 150, 28, 'r'), cross([1, 'gives'], 406, 128, 72, 44),
    ...spinner([2, 'all'], 110, 285, 80, ['blue']),
    write([2, 'all'], 'blue over all 10', 380, 250, 30, 'y'),
    write([2, '4/10'], '= 4/10 = 0.4', 380, 310, 34, 'y'),
  ],
]
