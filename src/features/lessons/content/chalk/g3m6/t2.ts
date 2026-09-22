/** g3m6-t2's chalkboards: index = screen index (0 is Screen 1, which has none). Bars white, reading across yellow, what a line counts by blue. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, arrow, ring, cross } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
// The fruit graph at true scale: 0 to 40 up the side, 36 px for every 5 kids. Apples 20, Grapes 35, Pears 15.
const BASE = 340, Y = (v: number) => BASE - v * 7.2
const BAR: Record<string, [x: number, v: number]> = { Apples: [140, 20], Grapes: [220, 35], Pears: [300, 15] }
/** `end` = where the lines up the graph stop (short, where she writes a count beside the bar). */
const axis = (at: At, end = 380): ChalkMark[] => [
  q({ beat: at[0], at: at[1], c: 'd', w: 1.5, d: Array.from({ length: 8 }, (_, i) => `M110 ${Y(5 * (i + 1))} H${end}`).join(' ') }),
  q({ beat: at[0], at: at[1], c: 'w', d: `M110 ${Y(40) - 12} V${BASE} H390` }),
]
const num = (at: At, v: number, c: ChalkColor = 'w') => q(write(at, String(v), 85, Y(v), 20, c))
const nums = (at: At) => [0, 5, 10, 15, 20, 25, 30, 35, 40].map(v => num(at, v))
const bar = (at: At, name: string): ChalkMark[] => {
  const [x, v] = BAR[name]
  return [box(at, x, Y(v), 50, BASE - Y(v)), q(write(at, name, x + 25, 368, 20, 'd'))]
}
/** Yellow along the top of a bar, then straight across to the side. */
const topOf = (at: At, name: string) => { const [x, v] = BAR[name]; return line(at, [[x - 4, Y(v)], [x + 54, Y(v)]], 'y', 5) }
const across = (at: At, name: string) => { const [x, v] = BAR[name]; return arrow(at, [x - 6, Y(v)], [116, Y(v)], 'y') }
const ringNum = (at: At, v: number) => ring(at, 85, Y(v), 20, 15, 'y')

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // The lines do not count by 1
  [
    ...axis([0, 'Count'], 274), ...bar([0, 'grapes'], 'Grapes'),
    ...Array.from({ length: 7 }, (_, i) => q(write([0, '7'], String(i + 1), 290, Y(5 * (i + 1)), 18))),
    write([1, 'kids'], '7 kids?', 495, 110, 30, 'r'), cross([1, 'No'], 435, 90, 120, 40),
    num([2, '0'], 0), num([2, '5'], 5), num([2, '10'], 10), num([2, '15'], 15),
    ...[20, 25, 30, 35, 40].map(v => num([2, 'Every'], v)),
    write([2, 'kids'], '1 line = 5 kids', 495, 230, 24, 'b'),
  ],
  // The big idea: top of the bar, straight across, and what the numbers count by
  [
    ...axis([0, 'Go']), ...nums([0, 'Go']), ...bar([0, 'bar'], 'Grapes'),
    topOf([0, 'top'], 'Grapes'), across([0, 'straight'], 'Grapes'), ringNum([0, 'numbers'], 35),
    write([0, 'count'], 'counts by 5s', 495, 180, 28, 'b'),
  ],
  // Across to the side
  [
    ...axis([0, 'Put']), ...nums([0, 'Put']), ...bar([0, 'grapes'], 'Grapes'), topOf([0, 'bar'], 'Grapes'),
    across([1, 'across'], 'Grapes'), ringNum([1, '35'], 35),
    write([2, 'kids'], 'Grapes: 35 kids', 495, 150, 24, 'y'),
  ],
  // Now the pears
  [
    ...axis([0, 'Now']), ...nums([0, 'Now']), ...bar([0, 'pears'], 'Pears'),
    topOf([1, 'Top'], 'Pears'), across([1, 'across'], 'Pears'),
    ringNum([2, '15'], 15), write([2, 'kids'], 'Pears: 15 kids', 495, 250, 24, 'y'),
  ],
  // How many more?
  [
    ...axis([0, 'So']), ...nums([0, 'So']), ...bar([0, 'grapes'], 'Grapes'), ...bar([0, 'pears'], 'Pears'),
    write([1, '35'], '35', 245, Y(35) - 20, 24, 'y'), write([1, '15'], '15', 325, Y(15) - 20, 24, 'y'),
    line([2, 'more'], [[300, Y(15)], [272, Y(15)]], 'b', 2),
    { beat: 2, at: 'more', c: 'b', d: `M280 ${Y(35)} H292 M286 ${Y(35)} V${Y(15)} M280 ${Y(15)} H292` },
    write([2, '35'], '35 − 15', 455, 200, 32), write([2, '20'], '= 20', 550, 200, 32, 'y'),
    write([2, 'kids'], '20 more kids', 495, 270, 28, 'y'),
  ],
  // One thing not to do: a small copy of the grapes bar, 30 px a line
  [
    ...warn([0, 'mix']),
    q({ beat: 1, at: 'lines', c: 'd', w: 1.5, d: Array.from({ length: 7 }, (_, i) => `M110 ${360 - 30 * (i + 1)} H204`).join(' ') }),
    q({ beat: 1, at: 'lines', d: 'M110 138 V360 H250' }), box([1, 'lines'], 150, 150, 50, 210),
    ...Array.from({ length: 7 }, (_, i) => q(write([1, 'ONES'], String(i + 1), 218, 360 - 30 * (i + 1), 18, 'r'))),
    write([1, 'ONES'], 'Grapes: 7', 440, 190, 32, 'r'),
    ...Array.from({ length: 7 }, (_, i) => q(write([2, '5'], String(5 * (i + 1)), 85, 360 - 30 * (i + 1), 20, 'y'))),
    write([2, '35'], 'Grapes: 35', 440, 290, 32, 'y'), cross([2, 'not'], 362, 170, 156, 42),
  ],
]
