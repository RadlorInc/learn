/** g3m1-t7's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, ring, cross, box, person } from '../../../chalk'
import { apples, fullBag, eqn, type At } from './t5to8'

const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
// 12 apples in a row, a little gap after every 3; G = the centre of each 3.
const AX = Array.from({ length: 12 }, (_, i) => 90 + i * 34 + Math.floor(i / 3) * 20)
const G = [0, 1, 2, 3].map(g => AX[3 * g + 1])
const row = (at: At, y: number) => apples(at, AX.map(x => [x, y] as [number, number]))
const group = (at: At, g: number, y: number) => ring(at, G[g], y, 52, 28, 'y')

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // This time it's different
  [
    ...[90, 150, 210].map(x => ({ ...person([0, 'friends'], x, 160, 70, 0.25, 'd'), quick: true })),
    write([0, 'friends'], 'we knew: 3 friends', 150, 205, 22, 'd'),
    line([1, 'This'], [[300, 60], [300, 230]], 'd', 2),
    ...fullBag([1, 'each'], 440, 90), write([1, 'bag'], 'we know: 3 in each bag', 440, 205, 22, 'b'),
    write([2, 'missing'], '? bags', 300, 310, 48, 'y'),
  ],
  // The big idea
  [
    row([0, 'Division'], 150),
    group([0, 'groups'], 0, 150), write([0, 'size'], '3 in a group', G[0], 100, 22, 'y'),
    write([0, 'make'], 'how many groups?', 300, 270, 34, 'y'),
  ],
  // Fill one bag
  [
    row([0], 80), group([0, '3'], 0, 80),
    arrow([0, 'bag'], [G[0], 112], [G[0], 160], 'y'), ...fullBag([0, 'bag'], G[0], 170, 'y'),
    write([1, 'one'], '1 bag', G[0], 270, 28, 'y'),
    ring([1, '9'], (AX[3] + AX[11]) / 2, 80, 178, 30, 'b'), write([1, 'left'], '9 left', 368, 145, 28, 'b'),
  ],
  // Keep filling
  [
    row([0], 70), group([0], 0, 70), ...fullBag([0], G[0], 130), write([0], '1', G[0], 228, 28),
    ...(['Two', 'three', 'four'] as const).flatMap((w, i) =>
      [group([1, w], i + 1, 70), ...fullBag([1, w], G[i + 1], 130), write([1, w], String(i + 2), G[i + 1], 228, 28)]),
    write([2, 'left'], 'no apples left', 300, 320, 28, 'd'),
  ],
  // How many bags?
  (() => {
    const e = eqn([1, 'write'], ['12', '÷', '3', '=', '4'], 300, 265, 52, 'w', { 4: 'y' })
    return [
      ...G.flatMap((x, g) => [...fullBag([0, 'Count'], x, 40), { ...write([0, 'Count'], String(g + 1), x, 135, 24, 'd'), quick: true }]),
      write([0, '4'], '4 bags', 300, 185, 32, 'y'),
      ...e.marks,
      write([2, 'make'], '4 bags of 3 = 12', 300, 345, 30, 'b'),
    ]
  })(),
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'NOT'], '3 bags', 170, 180, 40, 'r'), cross([1, 'bag'], 105, 155, 130, 50),
    write([2, '3'], '3 in each bag', 170, 245, 24, 'd'),
    write([2, '4'], '4 bags', 430, 180, 40, 'y'), box([2, '4'], 360, 150, 140, 60, 'y'),
  ],
]

