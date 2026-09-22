/** g7m5-t1's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The team's bar chart, the school as a grid of kids, the hat. Yellow = the fair sample, coral = the one kind of kid. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, box, wash, arrow, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const circ = (x: number, y: number, r: number) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`
/** Small dots, one per kid, as one stroke. */
const dots = ([beat, at]: At, pts: [number, number][], c: ChalkColor = 'w', r = 4): ChalkMark =>
  ({ beat, at, c, w: 2.4, d: pts.map(([x, y]) => circ(x, y, r)).join(' ') })
/** The 8 × 8 grid of kids in the school box, and the 8 picked from all over it. */
const GRID: [number, number][] = Array.from({ length: 64 }, (_, i) => [70 + 30 * (i % 8), 100 + 30 * Math.floor(i / 8)])
const PICKS = [[0, 1], [3, 0], [6, 2], [1, 4], [5, 5], [7, 6], [2, 7], [4, 3]].map(([i, j]) => [70 + 30 * i, 100 + 30 * j] as [number, number])
/** A hat, opening up, with its brim. */
const hat = ([beat, at]: At, x: number, y: number): ChalkMark =>
  ({ beat, at, c: 'w', d: `M${x - 90} ${y} L${x - 70} ${y + 150} L${x + 70} ${y + 150} L${x + 90} ${y}` + ` M${x - 90} ${y} a90 16 0 1 0 180 0 a90 16 0 1 0 -180 0` })
/** A little paper slip. */
const slip = ([beat, at]: At, x: number, y: number, c: ChalkColor = 'y'): ChalkMark => box([beat, at], x, y, 34, 20, c)

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Asking the basketball team: the team's bars, 16 of 20 basketball, one kind of kid
  [
    write([0, 'basketball'], 'basketball team: 20 kids', 230, 45, 24),
    line([1, 'Look'], [[55, 320], [415, 320]], 'd'),
    { ...box([1, 'Look'], 70, 295, 60, 25), quick: true }, { ...box([1, 'Look'], 250, 307, 60, 13), quick: true }, { ...box([1, 'Look'], 340, 307, 60, 13), quick: true },
    write([1, 'Look'], 'soccer', 100, 345, 20, 'd'), write([1, 'Look'], 'basketball', 190, 345, 20, 'd'),
    write([1, 'Look'], 'swim', 280, 345, 20, 'd'), write([1, 'Look'], 'other', 370, 345, 20, 'd'),
    box([1, '16'], 160, 120, 60, 200, 'y'), write([1, '16'], '16', 190, 98, 30, 'y'),
    write([2, 'school'], 'whole school?', 500, 150, 24),
    write([2, 'kind'], 'one kind', 500, 225, 28, 'r'), write([2, 'kind'], 'of kid', 500, 258, 28, 'r'),
  ],
  // The big idea: every kid in the school has the same chance, and the picks come from all over
  [
    write([0, 'everyone'], 'the whole school', 175, 50, 22, 'd'), box([0, 'everyone'], 45, 75, 260, 260, 'd'),
    { ...dots([0, 'everyone'], GRID), quick: true },
    ...PICKS.map(([x, y]) => ({ ...ring([0, 'chance'], x, y, 11, 11), quick: true })),
    write([0, 'chance'], 'same chance', 480, 110, 26, 'y'),
    arrow([0, 'picked'], [318, 205], [382, 205], 'd'), box([0, 'picked'], 400, 145, 160, 120, 'y'),
    dots([0, 'picked'], [0, 1, 2, 3, 4, 5, 6, 7].map(i => [430 + 33 * (i % 4), 185 + 40 * Math.floor(i / 4)] as [number, number]), 'y', 6),
    write([0, 'picked'], 'fair sample', 480, 300, 28, 'y'),
  ],
  // Names in a hat: all 400 go in, 20 come out without looking
  [
    hat([0, 'Put'], 180, 160), write([0, '400'], '400 names', 180, 245, 28),
    arrow([1, 'Pull'], [260, 150], [360, 100], 'd'),
    ...[[380, 60], [424, 60], [468, 60], [512, 60], [402, 90], [446, 90], [490, 90]].map(([x, y]) => ({ ...slip([1, '20'], x, y), quick: true })),
    write([1, '20'], '20 names', 465, 150, 30, 'y'), write([1, 'looking'], 'without looking', 465, 190, 22, 'd'),
    write([2, 'same'], 'every student: same chance', 300, 345, 30, 'y'),
    write([2, 'Nobody'], 'nobody left out', 465, 255, 26),
  ],
  // It looks like the school: 7/20 and 140/400 are both 35/100
  [
    write([0, 'hat'], 'hat:', 90, 90, 26, 'd'), write([0, '7'], '7/20', 230, 90, 36),
    write([1, '35'], '= 35/100', 385, 90, 36, 'y'),
    write([2, 'school'], 'school:', 90, 175, 26, 'd'), write([2, '140'], '140/400', 230, 175, 36),
    write([2, 'Also'], '= 35/100', 385, 175, 36, 'y'),
    write([3, 'small'], 'hat', 80, 262, 22, 'd'), box([3, 'small'], 120, 250, 100, 26), wash([3, 'small'], 120, 250, 35, 26, 'y'),
    write([3, 'big'], 'school', 80, 322, 22, 'd'), box([3, 'big'], 120, 304, 400, 36), wash([3, 'big'], 120, 304, 140, 36, 'y'),
    write([3, 'copy'], 'a little copy', 380, 262, 26, 'y'),
  ],
  // Ask who is left out: the team leaves 380 out, the hat leaves 0 out
  [
    write([0, 'Could'], 'could anyone never be picked?', 300, 45, 28),
    line([1, 'Ask'], [[300, 95], [300, 330]], 'd'),
    write([1, 'team'], 'the team', 150, 110, 28),
    { beat: 1, at: 'team', c: 'w', d: 'M40 205 a110 60 0 1 0 220 0 a110 60 0 1 0 -220 0' },
    { beat: 1, at: 'team', c: 'b', d: 'M120 205 a30 20 0 1 0 60 0 a30 20 0 1 0 -60 0' }, write([1, 'team'], '20', 150, 205, 20, 'b'),
    write([1, '380'], '380 left out', 150, 300, 30, 'r'),
    write([2, 'hat'], 'the hat', 450, 110, 28),
    { beat: 2, at: 'hat', c: 'w', d: 'M340 205 a110 60 0 1 0 220 0 a110 60 0 1 0 -220 0' },
    dots([2, 'hat'], [[390, 185], [430, 225], [470, 170], [510, 215], [450, 200], [375, 220], [530, 190], [420, 165]], 'y', 6),
    write([2, 'nobody'], '0 left out', 450, 300, 30, 'y'),
  ],
  // One thing not to do: big does not make it fair
  [
    ...warn([0, 'mix']),
    write([1, 'BIG'], 'big = fair?', 270, 150, 34, 'r'),
    write([2, 'fans'], '100 basketball fans', 300, 205, 28), write([2, 'pick'], 'they pick basketball', 300, 245, 24, 'd'),
    cross([2, 'still'], 385, 130, 40, 40),
    write([3, 'left'], 'who is left out?', 300, 320, 34, 'y'),
  ],
]
