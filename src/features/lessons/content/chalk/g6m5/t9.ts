/** g6m5-t9's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: white = the number line, dim = labels, yellow = the numbers that work (the dot and the colored line),
 *  coral = "does not work" and the mistake. Number line 0–10 from g3m2-t6: step i is at X(i). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, cross } from '../../../chalk'
import { X, numberLine, warn } from '../g3m2/t6'

type At = [beat: number, at?: string]

/** The line with every whole number 0–10 under it. `gap` leaves the line and tick out where an open dot will sit,
 *  so the dot reads as empty rather than as a circle with a cross in it. */
const nl = (at: At, y: number, s = 22, gap?: number): ChalkMark[] => [
  ...(gap === undefined ? numberLine(at, y) : [
    { ...line(at, [[40, y], [X(gap) - 10, y]], 'w', 3), quick: true }, { ...line(at, [[X(gap) + 10, y], [560, y]], 'w', 3), quick: true },
    { ...line(at, [[0, 0]]), d: Array.from({ length: 11 }, (_, i) => i).filter(i => i !== gap).map(i => `M${X(i)} ${y - 8} v16`).join(' '), w: 2, quick: true },
  ]),
  ...Array.from({ length: 11 }, (_, i) => ({ ...write(at, String(i), X(i), y + 34, s, 'd'), quick: true })),
]
const circle = (at: At, i: number, y: number, r: number, w: number, c: ChalkColor): ChalkMark =>
  ({ beat: at[0], at: at[1], c, w, d: `M${X(i) - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0` })
/** An empty circle: the number itself does not work. */
const open = (at: At, i: number, y: number, c: ChalkColor = 'y') => circle(at, i, y, 10, 3.6, c)
/** A filled-in dot: the number itself works. */
const filled = (at: At, i: number, y: number, c: ChalkColor = 'y') => circle(at, i, y, 5, 11, c)
/** The colored line from step i to the end of the line (not over the dot's middle when the dot is open). */
const ray = (at: At, i: number, y: number, dir: 1 | -1, fromOpen: boolean, c: ChalkColor = 'y'): ChalkMark => {
  const x1 = X(i) + dir * (fromOpen ? 10 : 0), x2 = dir > 0 ? X(10) : X(0)
  return { beat: at[0], at: at[1], c, w: 7, d: `M${x1} ${y} H${x2}` }
}
/** The arrow at the end: the colored line keeps going. */
const head = (at: At, y: number, dir: 1 | -1, c: ChalkColor = 'y'): ChalkMark =>
  ({ ...arrow(at, [dir > 0 ? X(10) : X(0), y], [dir > 0 ? 578 : 22, y], c), w: 6 })

export const T9: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too many to list
  [
    write([0, '4,'], '4,', 150, 60, 36), write([0, '5,'], '5,', 205, 60, 36), write([0, '6,'], '6,', 260, 60, 36),
    write([0, 'half.'], '3 1/2', 350, 60, 36),
    write([1, 'never'], 'they never stop', 300, 125, 28, 'd'),
    write([1, '100.'], '100, 101, 102', 300, 172, 30, 'd'),
    write([2, 'every'], 'every one?', 300, 235, 34, 'y'),
    ...nl([2, 'line.'], 305),
  ],
  // The big idea
  [
    write([0, 'x'], 'x > 3', 300, 65, 48),
    ...nl([0, 'number'], 230, 22, 3),
    arrow([0, 'bigger'], [X(5), 160], [X(9), 160], 'd'), write([0, 'bigger'], 'bigger', X(7), 130, 26, 'd'),
    open([0, 'open'], 3, 230),
    ray([0, 'arrow'], 3, 230, 1, true), head([0, 'right.'], 230, 1),
  ],
  // An open dot at 3
  [
    ...nl([0, 'Start'], 245, 22, 3),
    write([0, 'work?'], '3 > 3 ?', 300, 60, 40),
    write([1, 'No,'], 'no', 440, 60, 40, 'r'),
    write([1, 'more'], '3 is not more than 3', 300, 125, 28, 'd'),
    open([2, 'open,'], 3, 245),
    write([2, 'empty'], 'open dot: 3 does not work', 300, 350, 28, 'd'),
  ],
  // An arrow to the right
  [
    ...nl([0], 230, 22, 3), { ...open([0], 3, 230), quick: true },
    arrow([0, 'Bigger'], [X(4), 150], [X(9), 150], 'd'), write([0, 'right.'], 'bigger', X(6.5), 118, 28, 'd'),
    ray([1, 'color'], 3, 230, 1, true),
    head([2, 'arrow,'], 230, 1),
    write([2, 'never'], 'it never stops', 440, 330, 28, 'd'),
  ],
  // When the number works too
  [
    write([0, 'x'], 'x ≤ 5', 200, 65, 44), write([0, 'less.'], '5 or less', 420, 65, 32, 'd'),
    ...nl([0, 'less.'], 230),
    filled([1, 'fill'], 5, 230),
    arrow([2, 'smaller,'], [X(4), 150], [X(1), 150], 'd'), write([2, 'smaller,'], 'smaller', X(2.5), 118, 28, 'd'),
    ray([2, 'color'], 5, 230, -1, false), head([2, 'left.'], 230, -1),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...nl([1, "Don't"], 185, 20),
    filled([1, 'fill'], 3, 185, 'r'), ray([1, 'dot'], 3, 185, 1, false, 'd'), cross([1, 'dot'], X(3) - 22, 163, 44, 44),
    write([1, 'x'], 'x > 3', 100, 70, 36),
    ...nl([2, 'The'], 300, 20, 3),
    open([2, 'open.'], 3, 300), ray([2, 'open.'], 3, 300, 1, true), head([2, 'open.'], 300, 1),
  ],
]
