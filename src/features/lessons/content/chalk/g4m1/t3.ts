/** g4m1-t3's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cells, arrow, cross, ring } from '../../../chalk'

type At = [number, string?]
// Colours: yellow = the place that decides and the answer, blue = a place that is the same, coral = the trap, dim = labels.
const warn = (at: At): ChalkMark[] => [line(at, [[300, 25], [345, 100], [255, 100], [300, 25]], 'r'), write(at, '!', 300, 75, 40, 'r')]
const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))

// The chart: labels at x 60, five columns (TTh Th H T O) 90 wide from x 100 to 550; A's row y 80–150, B's y 150–220.
const C = [145, 235, 325, 415, 505]
const HEADS = ['TTh', 'Th', 'H', 'T', 'O']
const heads = (at: At) => q(HEADS.map((h, i) => write(at, h, C[i], 55, 20, 'd')))
const grid = (at: At) => q([cells(at, 100, 80, 450, 70, 5), cells(at, 100, 150, 450, 70, 5), write(at, 'A', 60, 115, 28, 'd'), write(at, 'B', 60, 185, 28, 'd')])
const digits = (at: At) => q([...[...'48250'].map((d, i) => write(at, d, C[i], 115, 38)), ...[...'46980'].map((d, i) => write(at, d, C[i], 185, 38))])
const chart = (at: At) => [...heads(at), ...grid(at), ...digits(at)]
const column = (at: At, i: number, c: ChalkColor) => ring(at, C[i], 150, 34, 80, c)

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Big digits can trick you
  [
    write([0, 'City'], 'B', 70, 100, 30, 'd'),
    ...q([['4', 150], ['6', 210], [',', 240], ['9', 270], ['8', 330], ['0', 390]].map(([d, x]) => write([0, 'City'], d as string, x as number, 100, 60))),
    ring([0, '9'], 270, 102, 24, 36, 'r'), ring([0, '8'], 330, 102, 24, 36, 'r'),
    write([0, 'Big'], 'big digits', 300, 205, 28, 'r'),
    write([1, 'more'], 'does B have more?', 300, 265, 30),
    ...q([write([2, 'small'], 'hundreds', 270, 158, 18, 'd'), write([2, 'small'], 'tens', 332, 158, 18, 'd')]),
    write([2, 'trick'], 'can trick you', 300, 335, 30, 'r'),
  ],
  // The big idea
  [
    ...chart([0, 'Line']),
    arrow([0, 'left'], [110, 262], [290, 262], 'd'),
    column([0, 'differ'], 1, 'y'),
    write([0, 'decides'], 'decides', 235, 305, 28, 'y'),
  ],
  // Line up the places
  [
    ...grid([0, 'chart']),
    ...digits([1, 'digit']), ...heads([1, 'place']),
    ...q(C.map(x => arrow([2, 'down'], [x, 234], [x, 274], 'd'))),
  ],
  // Start at the left
  [
    ...chart([0, 'Start']),
    arrow([0, 'left'], [C[0], 302], [C[0], 244]),
    column([1, '4'], 0, 'b'), write([1, 'same'], 'same', C[0], 330, 26, 'b'), arrow([1, 'keep'], [185, 330], [215, 330], 'b'),
    column([2, '8'], 1, 'y'), write([2, 'different'], 'different', 292, 330, 26, 'y'),
  ],
  // The first difference decides
  [
    write([0, '8'], '8 thousands', 150, 60, 28, 'y'), write([0, 'more'], '>', 300, 60, 36), write([0, '6'], '6 thousands', 450, 60, 28),
    write([1, 'A'], 'City A has more', 300, 130, 30, 'y'),
    write([1, '48,250'], '48,250 > 46,980', 300, 195, 40, 'y'),
    ...q([['4', 230, 'y'], ['8', 260, 'y'], [',', 280, 'd'], ['2', 300, 'd'], ['5', 330, 'd'], ['0', 360, 'd']]
      .map(([d, x, c]) => write([2, 'digits'], d as string, x as number, 280, 36, c as ChalkColor))),
    ...q([['4', 230, 'w'], ['6', 260, 'w'], [',', 280, 'd'], ['9', 300, 'd'], ['8', 330, 'd'], ['0', 360, 'd']]
      .map(([d, x, c]) => write([2, 'digits'], d as string, x as number, 335, 36, c as ChalkColor))),
    line([2, 'matter'], [[286, 282], [374, 282]], 'd'), line([2, 'matter'], [[286, 337], [374, 337]], 'd'),
    write([2, 'matter'], "don't matter", 480, 308, 24, 'd'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'FIRST'], '9,870 > 10,200', 300, 150, 36, 'r'), cross([1, 'digits'], 165, 128, 270, 46),
    ...q(HEADS.map((h, i) => write([2, '9,870'], h, 180 + 60 * i, 200, 20, 'd'))),
    ...q([...'9870'].map((d, i) => write([2, '9,870'], d, 240 + 60 * i, 240, 34))),
    ring([2, 'no'], 180, 240, 22, 24, 'b'),
    ...q([...'10200'].map((d, i) => write([3, '10,200'], d, 180 + 60 * i, 290, 34))),
    ring([3, 'does'], 180, 290, 20, 24, 'y'),
    write([3, 'bigger'], '9,870 < 10,200', 300, 350, 36, 'y'),
  ],
]
