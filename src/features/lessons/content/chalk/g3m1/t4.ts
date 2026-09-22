/** g3m1-t4's chalkboards: index = screen index (0 is Screen 1, which has none). Socks, hands and straw bundles in chalk. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, arrow, hop, cross } from '../../../chalk'
import { warn, type At } from './t1'

/** A pair of socks hanging from (x, y): two L shapes. */
const pair = (x: number): string => [x - 27, x + 3].map(s => `M${s} 84 h12 v26 q0 2 2 2 h8 q4 0 4 5 v2 q0 5 -5 5 h-17 q-4 0 -4 -4 Z`).join(' ')
const socks = ([beat, at]: At, xs: number[], c: ChalkColor = 'w'): ChalkMark => ({ beat, at, c, d: xs.map(pair).join(' ') })
/** A hand: palm and five fingers, palm centred at (x, y). */
const hands = ([beat, at]: At, xs: number[], y: number, c: ChalkColor = 'w'): ChalkMark => ({ beat, at, c, d: xs.map(x =>
  `M${x - 19} ${y} a19 19 0 1 0 38 0 a19 19 0 1 0 -38 0` + [[-13, 24], [-4, 30], [5, 30], [14, 24]].map(([dx, h]) => ` M${x + dx} ${y - 14} v${-h}`).join('') + ` M${x + 18} ${y - 4} l16 -16`).join(' ') })
/** A bundle of 10 straws tied in the middle, left edge at x. */
const bundles = ([beat, at]: At, xs: number[], y: number, c: ChalkColor = 'w'): ChalkMark => ({ beat, at, c, w: 2.4, d: xs.map(x =>
  Array.from({ length: 10 }, (_, i) => `M${x + i * 4.5} ${y} v50`).join(' ') + ` M${x - 4} ${y + 25} h49`).join(' ') })

const PX = [80, 170, 260, 350, 440, 530]
// Number line 0–12, 40 apart, from x = 60.
const NX = (n: number) => 60 + n * 40
const numberLine = (at: At, y: number): ChalkMark[] => [
  line(at, [[40, y], [560, y]], 'w', 3),
  { ...line(at, [[NX(0), y]]), d: Array.from({ length: 13 }, (_, n) => `M${NX(n)} ${y - 8} v16`).join(' '), w: 2 },
  write(at, '0', NX(0), y + 30, 24, 'd'),
]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // One by one is slow
  [
    line([0, 'You'], [[30, 82], [570, 82]], 'd', 2),
    socks([0, 'sock'], PX),
    ...PX.flatMap((x, p) => [x - 13, x + 13].map((sx, i) => ({ ...write([0, 'one'], String(p * 2 + i + 1), sx, 150, 20, 'd'), quick: true }))),
    ...PX.map(x => ({ ...ring([1, 'pairs'], x, 100, 40, 30, 'y'), quick: true })),
    write([1, 'faster'], 'faster way?', 250, 260, 36, 'y'), write([1, 'Yes'], 'yes', 420, 260, 36, 'y'),
  ],
  // The big idea
  [
    line([0, 'groups'], [[70, 82], [530, 82]], 'd', 2), socks([0, 'groups'], [165, 295, 425]),
    ...[165, 295, 425].map(x => ({ ...write([0, 'size'], '2', x, 150, 30, 'y'), quick: true })),
    line([0, 'jump'], [[70, 290], [530, 290]], 'w', 3),
    ...[['0', 100], ['2', 230], ['4', 360], ['6', 490]].map(([t, x]) => ({ ...write([0, 'jump'], t as string, x as number, 320, 22, 'd'), quick: true })),
    ...[100, 230, 360].map(x => hop([0, 'jump'], x, x + 130, 290, 'y')),
    ...[165, 295, 425].map(x => ({ ...arrow([0, 'whole'], [x, 172], [x, 225], 'b'), quick: true })),
    write([0, 'group'], '1 jump = 1 group', 300, 368, 30, 'y'),
  ],
  // Jump by 2s
  [
    ...numberLine([0, 'line'], 300),
    line([0, 'pair'], [[70, 82], [530, 82]], 'd', 2), socks([0, 'pair'], [100, 180, 260, 340, 420, 500]),
    ...['2', '4', '6', '8', '10', '12'].flatMap((n, i) => [hop([1, n], NX(2 * i), NX(2 * i + 2), 300, 'y'), write([1, n], n, NX(2 * i + 2), 330, 24, 'y')]),
  ],
  // How many jumps?
  [
    ...numberLine([0], 260),
    ...[0, 1, 2, 3, 4, 5].map(i => ({ ...hop([0], NX(2 * i), NX(2 * i + 2), 260, 'y'), quick: true })),
    ...[1, 2, 3, 4, 5, 6].map(j => ({ ...write([0, 'Count'], String(j), NX(2 * j - 1), 212, 24, 'b'), quick: true })),
    write([0, '6'], '6 jumps of 2', 300, 120, 34, 'b'),
    write([1, '12'], '12', NX(12), 290, 26, 'y'), ring([1, '12'], NX(12), 290, 22, 20, 'y'),
    write([2, 'So'], '6 × 2 = 12', 300, 355, 46, 'y'),
  ],
  // Hands and bundles
  [
    hands([0, 'hand'], [150, 300, 450], 100),
    ...['5', '10', '15'].map((n, i) => write([0, n], n, [150, 300, 450][i], 160, 32, 'y')),
    bundles([1, 'bundles'], [80, 210, 340, 470], 210),
    ...['10', '20', '30', '40'].map((n, i) => write([1, n], n, [100, 230, 360, 490][i], 300, 32, 'y')),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    hands([1, 'hands'], [150, 250, 350, 450], 180),
    write([1, 'STOP'], 'stop at 15', 300, 335, 34, 'r'), cross([1, '15'], 195, 305, 210, 60),
    ...['5', '10', '15', '20'].map((n, i) => write([2, n], n, 150 + i * 100, 245, 32, 'y')),
    ring([2, '20'], 450, 245, 30, 24, 'y'),
  ],
]
