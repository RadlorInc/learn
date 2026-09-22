/** g3m1-t6's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, ring, cross, person } from '../../../chalk'
import { apples, eqn, type At } from './t5to8'

type Pt = [number, number]
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
const friends = (at: At, xs: number[], feet: number, h = 80): ChalkMark[] => xs.map(x => ({ ...person(at, x, feet, h), quick: true }))
/** Where friend x's k-th apple goes (k = 0..3), dealt round by round. */
const slot = (x: number, k: number, y = 190): Pt => [x + (k % 2 ? 15 : -15), y + (k >= 2 ? 28 : 0)]
const round = (at: At, xs: number[], k: number, y?: number) => apples(at, xs.map(x => slot(x, k, y)))
// The basket, with the 12 in it.
const basket = (at: At): ChalkMark[] => [line(at, [[30, 165], [42, 230], [118, 230], [130, 165], [30, 165]]), write(at, '12', 80, 197, 30)]
const DEAL = [250, 380, 510]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Fair means the same
  [
    ...friends([0, 'fair'], [150, 300, 450], 150),
    apples([1, '6'], [[124, 190], [150, 190], [176, 190], [124, 216], [150, 216], [176, 216]]), write([1, '6'], '6', 150, 256, 26),
    apples([1, '2'], [[287, 190], [313, 190]]), write([1, '2'], '2', 300, 256, 26),
    write([1, 'fair'], 'not fair', 450, 205, 30, 'r'),
    write([2, 'same'], 'the same number for every friend', 300, 330, 28, 'y'),
  ],
  // The big idea
  [
    write([0, 'total'], '12', 115, 85, 32),
    apples([0, 'total'], [0, 1, 2].flatMap(r => [70, 100, 130, 160].map(x => [x, 130 + r * 30] as Pt))),
    arrow([0, 'into'], [180, 160], [234, 160], 'd'),
    ...[290, 400, 510].map(x => ({ ...ring([0, 'groups'], x, 160, 48, 40, 'w'), quick: true })),
    write([0, 'know'], '3 groups', 400, 240, 26, 'b'),
    ...[290, 400, 510].map(x => ({ ...write([0, 'find'], '?', x, 160, 32, 'y'), quick: true })),
    write([0, 'each'], '? in each', 400, 300, 28, 'y'),
  ],
  // One for you, one for you
  [
    ...basket([0]), ...friends([0], DEAL, 150),
    round([0, 'friend'], DEAL, 0), write([0, 'round'], '1 round', 380, 285, 24, 'd'),
    round([1, 'again'], DEAL, 1), write([1, '2'], '2 each', 380, 335, 30, 'y'),
  ],
  // Keep going
  [
    ...basket([0]), ...friends([0], DEAL, 150), round([0], DEAL, 0), round([0], DEAL, 1),
    round([0, 'round'], DEAL, 2), round([0, 'until'], DEAL, 3),
    cross([0, 'empty'], 55, 175, 50, 42, 'd'), write([0, 'empty'], 'empty', 80, 262, 24, 'd'),
    ...(['One', 'two', 'three', 'four'] as const).map((w, k) => ring([1, w], ...slot(DEAL[0], k), 12, 12, 'y')),
    ...DEAL.map(x => ({ ...write([2, '4'], '4', x, 270, 30, 'y'), quick: true })),
    write([2, 'fair'], 'fair', 380, 340, 36, 'y'),
  ],
  // 12 shared by 3
  (() => {
    const e = eqn([1, 'write'], ['12', '÷', '3', '=', '4'], 300, 260, 56, 'w', { 4: 'y' })
    const under = (w: string, i: number, t: string, c: 'y' | 'b' | 'w'): ChalkMark[] =>
      [arrow([2, w], [e.xs[i], 330], [e.xs[i], 296], c), write([2, w], t, e.xs[i], 350, 24, c)]
    return [
      ...friends([0, 'friends'], [150, 300, 450], 130, 70),
      apples([0, 'friends'], [150, 300, 450].flatMap(x => [0, 1, 2, 3].map(k => slot(x, k, 162)))),
      write([0, 'each'], '4 each', 540, 175, 24, 'y'),
      ...e.marks,
      ...under('total', 0, 'total', 'y'), ...under('friends', 2, 'friends', 'b'), ...under('each', 4, 'each', 'w'),
    ]
  })(),
  // One thing not to do
  (() => {
    const good = eqn([2, 'total'], ['12', '÷', '3', '=', '4'], 430, 180, 40, 'y')
    return [
      ...warn([0, 'mix']),
      write([1, '3'], '3 ÷ 12', 170, 180, 40, 'r'), cross([1, '12'], 100, 150, 140, 60),
      ...good.marks, ring([2, 'first'], good.xs[0], 180, 34, 30, 'y'), write([2, 'first'], 'total first', 430, 250, 28, 'y'),
    ]
  })(),
]
