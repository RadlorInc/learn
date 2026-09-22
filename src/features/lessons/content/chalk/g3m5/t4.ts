/** g3m5-t4's chalkboards: the whole from 0 to 1, cut into equal jumps. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, span, hop, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
// Colours: w = the line, b = the whole and its equal cuts, y = the jumps you take and where you land, r = warning, d = labels.
const X0 = 80, U = 110, Y = 200                   // 0 at x 80, each fourth 110 wide, 1 at x 520
const at4 = (k: number) => X0 + U * k
const path = (at: At, y = Y, x0 = X0, x1 = at4(4)): ChalkMark => ({ beat: at[0], at: at[1], c: 'w', d: `M${x0 - 10} ${y} H${x1 + 10} M${x0} ${y - 12} v24 M${x1} ${y - 12} v24` })
const cuts = (at: At, xs: number[], y = Y, c: ChalkColor = 'b'): ChalkMark => ({ beat: at[0], at: at[1], c, d: xs.map(x => `M${x} ${y - 10} v20`).join(' ') })
const hops = (at: At, xs: number[], y = Y, c: ChalkColor = 'y'): ChalkMark[] => xs.slice(1).map((x, i) => ({ ...hop(at, xs[i], x, y, c), quick: true }))
const dot = (at: At, x: number, y = Y, c: ChalkColor = 'y'): ChalkMark => ({ beat: at[0], at: at[1], c, w: 9, d: `M${x - 1} ${y} h2` })
const INNER = [at4(1), at4(2), at4(3)], ALL = [0, 1, 2, 3, 4].map(at4)

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // No pieces to hold
  [
    path([0, 'path']), write([0, 'home'], 'home', X0, 245, 24, 'd'), write([0, 'park'], 'park', at4(4), 245, 24, 'd'),
    write([1, 'pieces'], 'no pieces to pick up', 300, 100, 30, 'r'),
    cuts([2, '4'], INNER), write([2, 'parts'], '?', 300, 320, 56, 'y'),
  ],
  // The big idea
  [
    path([0, 'space']), write([0, '0'], '0', X0, 245, 28, 'd'), write([0, '1'], '1', at4(4), 245, 28, 'd'),
    span([0, 'whole'], X0, at4(4), 105, 'b'), write([0, 'whole'], 'one whole', 300, 68, 28, 'b'),
    cuts([0, 'cut'], INNER),
    ...hops([0, 'count'], ALL),
    ...[1, 2, 3, 4].map(k => ({ ...write([0, 'count'], String(k), at4(k) - U / 2, 150, 22, 'y'), quick: true })),
  ],
  // Cut the whole into 4 jumps
  [
    path([0, 'path']), write([0, '0'], '0', X0, 245, 28, 'd'), write([0, '1'], '1', at4(4), 245, 28, 'd'),
    span([0, 'whole'], X0, at4(4), 105, 'b'), write([0, 'whole'], 'one whole', 300, 68, 28, 'b'),
    cuts([1, 'Cut'], INNER),
    ...hops([2, 'Every'], ALL, Y, 'b'),
    ...[1, 2, 3, 4].map(k => ({ ...write([2, '1/4'], '1/4', at4(k) - U / 2, 150, 22, 'b'), quick: true })),
    write([2, '1/4'], 'each jump is 1/4', 300, 320, 32, 'b'),
  ],
  // Take 3 jumps
  [
    path([0, 'Put']), cuts([0, 'Put'], INNER), write([0, '0'], '0', X0, 245, 28, 'd'), ring([0, '0'], X0, Y, 18, 18, 'y'),
    ...['1/4', '2/4', '3/4'].flatMap((f, i) => [hop([1, f], at4(i), at4(i + 1), Y, 'y'), write([1, f], f, at4(i + 1), 245, 24, 'y')]),
    dot([2, 'land'], at4(3)), write([2, '3/4'], 'you land on 3/4', 300, 330, 34, 'y'),
  ],
  // Every mark has a name
  [
    path([0, 'Every']), cuts([0, 'Every'], INNER),
    ...([[0, '0'], [1, '1/4'], [2, '2/4'], [4, '1']] as const).map(([k, t]) => ({ ...write([0, 'name'], t, at4(k), 245, 24, 'd'), quick: true })),
    ...hops([1, 'jumps'], ALL.slice(0, 4)),
    dot([1, '3/4'], at4(3)), write([1, '3/4'], '3/4', at4(3), 245, 24, 'y'),
    write([2, 'number'], '3/4 is a number', 300, 320, 32, 'y'),
    write([2, '0'], 'like 0 and 1', 300, 365, 24, 'd'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    path([1, 'Jumps'], 180, 60, 380), cuts([1, 'Jumps'], [110, 230, 300], 180, 'r'),
    ...hops([1, 'DIFFERENT'], [60, 110, 230, 300, 380], 180, 'r'),
    cross([1, 'not'], 410, 162, 26, 26), write([1, 'fourths'], 'not fourths', 505, 175, 26, 'r'),
    path([2, 'Every'], 320, 60, 380), cuts([2, 'Every'], [140, 220, 300], 320),
    write([2, '0'], '0', 60, 360, 24, 'd'), write([2, '1'], '1', 380, 360, 24, 'd'),
    ...hops([2, 'jumps'], [60, 140, 220, 300], 320),
    dot([2, '3/4'], 300, 320), write([2, '3/4'], '3/4', 300, 360, 24, 'y'),
    write([2, 'same'], 'same size', 490, 315, 26, 'y'),
  ],
]
