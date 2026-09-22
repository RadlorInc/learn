/** g4m2-t6's chalkboards: index = screen index (0 is Screen 1, which has none). A ten rod = 10 cards. Blue = tens, yellow = the result, coral = the slip. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, box, ring, cross } from '../../../chalk'
import { warn, tick, type At } from '../g3m1/t1'

/** Ten rods (tall thin bars cut into 10) standing from y, `h` tall, one stroke. */
export const rods = ([beat, at]: At, xs: number[], y: number, h = 90, c: ChalkColor = 'b', quick = true): ChalkMark => ({
  beat, at, c, quick, w: 2.4,
  d: xs.map(x => `M${x - 6} ${y} h12 v${h} h-12 Z` + Array.from({ length: 9 }, (_, i) => ` M${x - 6} ${y + (h * (i + 1)) / 10} h12`).join('')).join(' '),
})
const three = (x: number) => [x - 22, x, x + 22]
/** A pack of cards: a box holding 3 ten rods. */
const pack = (at: At, x: number, y: number, c: ChalkColor = 'b'): ChalkMark[] =>
  [{ ...box(at, x - 40, y, 80, 110, 'w'), quick: true }, rods(at, three(x), y + 10, 90, c)]
const PX = [90, 230, 370, 510]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // 4 × 3 is not enough
  [
    write([0, '4'], '4 × 3 = 12', 300, 60, 36),
    ...pack([1, 'pack'], 160, 110), write([1, '30'], '30 cards', 330, 150, 32), write([1, 'not'], 'not 3', 330, 195, 28, 'd'),
    write([2, 'answer'], '4 × 30 = 12 ?', 300, 285, 34, 'r'),
    write([2, 'bigger'], 'much bigger', 300, 345, 32),
  ],
  // The big idea
  [
    write([0, '30'], '30', 110, 90, 44),
    rods([0, '3'], three(230), 45), write([0, 'tens'], '= 3 tens', 400, 90, 36, 'b'),
    write([0, 'multiply'], '4 × 3 tens', 300, 210, 36, 'b'),
    write([0, 'turn'], 'tens → a number', 300, 300, 36, 'y'),
  ],
  // See the tens
  [
    ...pack([0, 'pack'], PX[0], 50), write([0, 'tens'], '30 = 3 tens', PX[0] + 20, 200, 24, 'b'),
    ...PX.slice(1).flatMap(x => pack([1, 'packs'], x, 50)),
    write([1, 'groups'], '4 groups of 3 tens', 300, 300, 34, 'b'),
  ],
  // Multiply the tens
  [
    rods([0, 'multiply'], [0, 1, 2, 3].flatMap(g => three(100 + g * 133)), 40),
    write([0, '4'], '4 × 3 = 12', 300, 200, 36),
    write([0, "that's"], '12 tens', 300, 260, 40, 'y'),
    write([1, 'counting'], 'count tens, not ones', 300, 340, 30, 'b'),
  ],
  // Trade ten tens
  [
    write([0, 'How'], '12 tens = ?', 300, 40, 34),
    rods([0, 'tens'], Array.from({ length: 10 }, (_, i) => 60 + i * 30), 80),
    ring([0, 'hundred'], 195, 125, 180, 64, 'w'), write([0, 'hundred'], '100', 195, 215, 32),
    rods([1, '2'], [450, 480], 80), write([1, '20'], '20', 465, 215, 32, 'b'),
    write([1, '120'], '100 + 20 = 120', 300, 280, 40, 'y'),
    write([1, 'cards'], '120 cards', 300, 345, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '12'], '4 × 30 = 12', 160, 175, 36, 'r'), cross([1, '12'], 60, 150, 200, 50),
    write([1, 'tens'], 'drop the tens', 160, 225, 24, 'r'),
    write([2, 'tens'], '12 tens = 120', 450, 185, 32, 'b'),
    write([2, '120'], '4 × 30 = 120', 290, 310, 44, 'y'), tick([2, '120'], 440, 310),
  ],
]
