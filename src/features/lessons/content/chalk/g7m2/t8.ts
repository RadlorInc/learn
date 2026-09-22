/** g7m2-t8's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A thermometer on the left, −10 to 10 °C (15 px a degree); the working on the right. Yellow is warmer / the answer,
 *  blue colder, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, arrow, cross } from '../../../chalk'
import { warn } from './t5'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const Y = (v: number) => 195 - 15 * v
/** The thermometer with its reading at `v` (a mercury wash from the bottom up to v). */
const thermo = (at: At, v: number): ChalkMark[] => [
  box(at, 105, 35, 30, 320),
  { beat: at[0], at: at[1], quick: true, c: 'd', d: [-10, -5, 0, 5, 10].map(t => `M95 ${Y(t)} h10`).join(' ') },
  ...[-10, -5, 0, 5, 10].map(t => q(write(at, t < 0 ? '−' + -t : String(t), 70, Y(t), 22, 'd'))),
  wash(at, 110, Y(v), 20, 355 - Y(v), v < 0 ? 'b' : 'y'),
]

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // The words pick the sign
  [
    ...thermo([0, 'You'], -5),
    write([0, 'do'], '−5 − 8 = −13', 390, 65, 36),
    write([1, 'colder'], '−13 is colder', 390, 150, 30, 'b'), write([1, 'fit'], 'fits the story?', 390, 205, 28),
    write([2, 'warmer'], 'story: warmer', 390, 285, 32, 'y'), arrow([2, 'warmer'], [170, Y(-5)], [170, Y(-5) - 50], 'y'),
    write([2, 'words'], 'the words pick the way', 390, 345, 26, 'd'),
  ],
  // The big idea: which words are + and which are −
  [
    write([0, 'Up'], 'up', 170, 60, 30, 'y'), write([0, 'warmer'], 'warmer', 170, 110, 30, 'y'), write([0, 'gained'], 'gained', 170, 160, 30, 'y'),
    write([0, 'positive'], '+', 170, 225, 56, 'y'),
    write([0, 'down'], 'down', 430, 60, 30, 'b'), write([0, 'colder'], 'colder', 430, 110, 30, 'b'), write([0, 'lost'], 'lost', 430, 160, 30, 'b'),
    write([0, 'negative'], '−', 430, 225, 56, 'b'),
    write([0, 'sign'], '8 degrees warmer  →  +8', 300, 330, 30),
  ],
  // Write it with signs
  [
    ...thermo([0, 'start'], -5), write([0, 'start'], 'start: −5', 390, 70, 34, 'b'),
    write([1, 'Warmer'], 'warmer = up', 390, 140, 26, 'd'), write([1, 'change'], 'change: +8', 390, 195, 34, 'y'),
    write([2, 'math'], '−5 + 8', 390, 300, 50, 'y'),
  ],
  // Climb the thermometer
  [
    ...thermo([0, 'climb'], -5),
    arrow([0, 'Up'], [170, Y(-5)], [170, Y(0)], 'y'), write([0, 'Up'], '+5', 200, (Y(-5) + Y(0)) / 2, 24, 'y'),
    write([0, '0'], '−5 up 5  →  0', 400, 80, 32),
    write([1, '8'], '8 = 5 + 3', 400, 170, 34), write([1, 'left'], '3 left', 400, 220, 26, 'd'),
    arrow([2, 'Up'], [170, Y(0)], [170, Y(3)], 'y'), write([2, 'Up'], '+3', 200, (Y(0) + Y(3)) / 2, 24, 'y'),
    wash([2, 'at'], 110, Y(3), 20, Y(-5) - Y(3), 'y'), write([2, 'at'], '0 up 3  →  3', 400, 310, 34, 'y'),
  ],
  // Check it makes sense
  [
    write([0, 'sense'], 'does it make sense?', 390, 60, 32),
    ...thermo([1, 'Warmer'], 3), write([1, 'higher'], '3', 175, Y(3), 26, 'y'), write([1, 'higher'], '−5', 178, Y(-5), 26, 'b'),
    write([1, 'than'], '3 is higher than −5', 390, 185, 30, 'y'),
    write([2, "it's"], '3 °C at noon', 390, 300, 42, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'minus'], 'warmer:', 190, 165, 34, 'd'), write([1, 'minus'], '−5 − 8', 350, 165, 38, 'r'), cross([1, 'change'], 290, 140, 120, 50),
    write([2, 'Warmer'], 'warmer = add', 170, 245, 28, 'y'), write([2, 'Colder'], 'colder = take away', 420, 245, 28, 'b'),
    write([2, 'is'], '−5 + 8 = 3', 300, 325, 42, 'y'),
  ],
]
