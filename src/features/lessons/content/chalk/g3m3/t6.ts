/** g3m3-t6's chalkboards: index = screen index (0 is Screen 1, which has none). Blue = the pretend 10th box. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, span, cross } from '../../../chalk'
import { warn, tick, type At } from '../g3m1/t1'

/** A box of 3 crayons, centred on (x, y), one stroke. */
export const crayonBox = ([beat, at]: At, x: number, y: number, c: ChalkColor = 'w', quick = true): ChalkMark => ({
  beat, at, c, quick,
  d: `M${x - 22} ${y - 30} h44 v60 h-44 Z` + [-12, 0, 12].map(dx => ` M${x + dx - 3.5} ${y + 24} v-34 l3.5 -8 l3.5 8 v34 Z`).join(''),
})
// Ten boxes in a row; the first 9 are real, the 10th is the pretend one.
const X = Array.from({ length: 10 }, (_, i) => 60 + 53 * i)
const nine = (at: At, y: number): ChalkMark[] => X.slice(0, 9).map(x => crayonBox(at, x, y))
const pretend = (at: At, y: number) => crayonBox(at, X[9], y, 'b', false)

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Counting by 3s is slow
  [
    ...nine([0, 'You'], 110),
    ...['3', '6', '9'].map((n, i) => ({ ...write([0, 'time'], n, X[i], 172, 24, 'd'), quick: true })),
    span([1, '9'], X[0] - 22, X[8] + 22, 205, 'd'), write([1, 'boxes'], '9 boxes', 272, 240, 26),
    write([1, 'track'], 'lose track?', 470, 280, 26, 'r'),
    write([2, 'faster'], 'faster way?', 170, 340, 32, 'y'),
    pretend([2, '10'], 110), write([2, 'instead'], '10 boxes', 450, 340, 32, 'b'),
  ],
  // The big idea: 10 groups, take away one group
  (() => {
    const toks = [['10 groups', 'then', 'w'], ['−', 'away', 'b'], ['1 group', 'one', 'b'], ['=', 'group', 'y'], ['9 groups', 'group', 'y']] as const
    const xs = [115, 215, 305, 390, 480]
    return [
      ...nine([0, '9'], 120), pretend([0, '10'], 120),
      span([0, '10'], X[0] - 22, X[9] + 22, 200, 'd'),
      cross([0, 'away'], X[9] - 26, 85, 52, 70, 'b'),
      ...toks.map(([t, w, c], i) => write([0, w], t, xs[i], 290, 30, c)),
    ]
  })(),
  // Pretend there are 10
  [
    ...nine([0, 'Look'], 110), pretend([0, 'pretend'], 110),
    span([0, '10'], X[0] - 22, X[9] + 22, 170, 'd'), write([0, 'boxes'], '10 boxes', 300, 205, 28),
    write([1, '10'], '10 ×', 220, 300, 50), write([1, '3'], '3', 310, 300, 50),
    write([1, '30'], '= 30', 400, 300, 50, 'y'),
  ],
  // Take the pretend box away
  [
    ...nine([0, 'But'], 110), { ...crayonBox([0, 'But'], X[9], 110, 'b') },
    span([0, '9'], X[0] - 22, X[8] + 22, 170, 'd'), write([0, 'boxes'], '9 boxes', 272, 205, 28),
    cross([1, 'go'], X[9] - 26, 75, 52, 70, 'b'),
    write([1, '3'], '− 3', X[9] - 10, 205, 30, 'b'), write([1, 'crayons'], '3 crayons go', 440, 290, 28, 'b'),
  ],
  // 30 take away 3
  [
    ...X.slice(0, 9).map(x => crayonBox([0], x, 85)), crayonBox([0], X[9], 85, 'b'), cross([0], X[9] - 26, 50, 52, 70, 'b'),
    write([0, '30'], '30', 190, 210, 56), write([0, 'away'], '−', 260, 210, 56, 'b'), write([0, '3'], '3', 320, 210, 56, 'b'),
    write([1, '27'], '= 27', 420, 210, 56, 'y'),
    write([2, 'boxes'], '9 × 3', 250, 320, 44), write([2, '27'], '= 27 crayons', 420, 320, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '1'], '30 − 1', 150, 190, 40, 'r'), write([1, '29'], '= 29', 260, 190, 40, 'r'), cross([1, '29'], 85, 165, 220, 50),
    crayonBox([2, 'pretend'], 450, 180, 'b', false), write([2, 'crayons'], '3 crayons', 450, 240, 24, 'b'),
    write([2, '27'], '30 − 3 = 27', 300, 320, 44, 'y'), tick([2, '27'], 440, 320),
  ],
]
