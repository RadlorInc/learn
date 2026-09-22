/** g3m2-t2's chalkboards: index = screen index (0 is Screen 1, which has none). The clock reads 3:27. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, cross, clockFace, clockHop, hand, onClock } from '../../../chalk'
import { warn, type At } from '../g3m1/t1'
import { CX, CY, CR, ringNum, shortHand, putTogether } from './t1'

const H = 3 + 27 / 60, M = 27 / 5   // where the short and long hands point
/** The 60 little minute marks round the inside of the rim, as one stroke. */
const minuteMarks = (at: At, cx = CX, cy = CY, r = CR, c: ChalkColor = 'd'): ChalkMark => ({
  beat: at[0], at: at[1], c, w: 1.8, quick: true,
  d: Array.from({ length: 60 }, (_, i) => { const [a, b] = [onClock(cx, cy, r, i / 5), onClock(cx, cy, r - (i % 5 ? 9 : 14), i / 5)]; return `M${a.join(' ')} L${b.join(' ')}` }).join(' '),
})
/** One minute mark, gone over thick: the marks she is counting. */
const mark = (at: At, minute: number, c: ChalkColor = 'b', cx = CX, cy = CY, r = CR) =>
  line(at, [onClock(cx, cy, r + 4, minute / 5), onClock(cx, cy, r - 14, minute / 5)], c, 5)
const face = (at: At): ChalkMark[] => [...clockFace(at, CX, CY, CR), minuteMarks(at)]
/** The long hand runs out to the little marks here, since the marks are what she counts. */
const longHand = (at: At, c: ChalkColor = 'y', cx = CX, cy = CY, r = CR) => hand(at, cx, cy, M, r * 0.88, c)

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // The long hand is between numbers
  [
    ...face([0, 'Look']), shortHand([0, 'Look'], H, 'd'), longHand([0, 'long']),
    ringNum([0, '5'], 5, 'd'), ringNum([0, '6'], 6, 'd'), write([0, '6'], 'between 5 and 6', 470, 110, 28, 'd'),
    write([1, '5s'], 'by 5s:', 470, 190, 32, 'y'), write([1, 'there'], '25? 30?', 470, 240, 36, 'y'),
    write([1, 'own'], 'not on its own', 470, 305, 28, 'r'),
  ],
  // The big idea: 5s to the last number, then 1s
  [
    ...face([0]),
    ...[1, 2, 3, 4, 5].map(n => ({ ...write([0, '5s'], String(n * 5), ...onClock(CX, CY, CR + 28, n), 20, 'y'), quick: true })),
    write([0, '5s'], 'by 5s', 480, 140, 36, 'y'),
    longHand([0, 'long']), clockHop([0, 'passed'], CX, CY, CR + 8, 0, 5),
    mark([0, '1s'], 26), mark([0, '1s'], 27), write([0, '1s'], 'then by 1s', 480, 230, 34, 'b'),
    write([0, 'marks'], 'little marks', 480, 280, 26, 'b'),
  ],
  // Hour first, then 5s
  [
    ...face([0]), shortHand([0, 'short'], H), ringNum([0, '3'], 3, 'b'), write([0, 'hour'], 'Hour: 3', 480, 90, 36, 'b'),
    longHand([1, 'long']), ringNum([1, '5'], 5),
    ...(['Five', 'ten', 'fifteen', 'twenty', 'twenty-five'] as const).flatMap((w, i) => [
      clockHop([2, w], CX, CY, CR + 10, i, i + 1), write([2, w], String((i + 1) * 5), ...onClock(CX, CY, CR + 32, i + 0.5), 22, 'y')]),
    write([2, 'twenty-five'], 'so far: 25', 480, 200, 32, 'y'),
  ],
  // Count on by 1s
  [
    ...face([0]), shortHand([0], H, 'd'), longHand([0]), clockHop([0], CX, CY, CR + 10, 0, 5, 'd'),
    write([0, 'mark'], '1 little mark', 470, 80, 28, 'b'), write([0, 'minute'], '= 1 minute', 470, 118, 28, 'b'),
    write([1, '25'], '25', 420, 200, 36, 'y'),
    mark([1, 'Twenty-six'], 26), write([1, 'Twenty-six'], '26', 480, 200, 36, 'b'),
    mark([1, 'twenty-seven'], 27), write([1, 'twenty-seven'], '27', 540, 200, 36, 'b'),
    write([2, '27'], '27 minutes', 470, 290, 38, 'y'), box([2, 'minutes'], 375, 255, 190, 70, 'y'),
  ],
  // Put it together
  [
    ...putTogether('3', '27', [1, 'hour'], [1, 'dots'], [1, 'minutes'], [0, 'hour'], [0, '27']),
    write([2, 'bus'], 'the bus comes', 300, 355, 28, 'd'), line([2, '3:27'], [[190, 305], [450, 305]], 'y', 2.5),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...clockFace([1, 'number'], 150, 260, 110), minuteMarks([1, 'number'], 150, 260, 110),
    ringNum([1, 'number'], 5, 'r', 150, 260, 110), longHand([1, 'long'], 'y', 150, 260, 110),
    write([2, 'gives'], '3:25', 440, 190, 56, 'r'), cross([2, '3:25'], 385, 160, 110, 60),
    mark([2, 'marks'], 26, 'b', 150, 260, 110), mark([2, 'marks'], 27, 'b', 150, 260, 110),
    write([2, '3:27'], '3:27', 440, 310, 56, 'y'),
  ],
]
