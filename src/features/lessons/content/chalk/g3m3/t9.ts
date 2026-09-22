/** g3m3-t9's chalkboards: index = screen index (0 is Screen 1, which has none). Blue = the 5 given away, yellow = what we find. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, box, arrow, ring, cross, span } from '../../../chalk'
import { warn, tick, type At } from '../g3m1/t1'

/** Pencils standing with their middle at y, one stroke. */
const pencils = ([beat, at]: At, xs: number[], y: number, c: ChalkColor = 'w', quick = true): ChalkMark => ({
  beat, at, c, quick, w: 2.6,
  d: xs.map(x => `M${x - 4} ${y + 24} V${y - 12} L${x} ${y - 22} L${x + 4} ${y - 12} V${y + 24} Z M${x - 4} ${y - 12} h8`).join(' '),
})
/** A pack of 4 pencils, centred on (x, y). */
const pack = (at: At, x: number, y: number): ChalkMark[] =>
  [pencils(at, [-21, -7, 7, 21].map(d => x + d), y), { ...box(at, x - 34, y - 32, 68, 64), quick: true }]
const PX = [150, 300, 450]
const packs = (at: At, y: number) => PX.flatMap(x => pack(at, x, y))
/** Sam's 12 pencils in a row. */
const RX = Array.from({ length: 12 }, (_, i) => 80 + i * 40)

export const T9: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not yet
  [
    ...packs([0, 'Can'], 110),
    write([0, '5'], '? − 5', 300, 230, 44), write([0, 'yet'], 'not yet', 480, 230, 28, 'r'),
    span([1, 'know'], 116, 484, 165, 'd'), write([1, 'pencils'], 'how many pencils?', 300, 305, 34, 'y'),
    ring([2, 'hides'], 300, 305, 170, 34, 'y'),
  ],
  // The big idea: the hidden question first, then the real one
  [
    box([0, 'hides'], 60, 120, 210, 100), write([0, 'question'], 'hidden', 165, 155, 30), write([0, 'question'], 'question', 165, 190, 30),
    write([0, 'answer'], 'step 1', 165, 255, 28, 'y'), tick([0, 'answer'], 225, 255),
    arrow([0, 'use'], [280, 170], [320, 170], 'y'),
    box([0, 'real'], 330, 120, 210, 100, 'y'), write([0, 'real'], 'real', 435, 155, 30, 'y'), write([0, 'real'], 'question', 435, 190, 30, 'y'),
    write([0, 'one'], 'step 2', 435, 255, 28, 'y'),
  ],
  // Step 1: how many did he buy?
  [
    write([0, 'pencils'], 'Step 1: how many pencils?', 300, 40, 30, 'd'),
    ...packs([1, '3'], 130),
    ...PX.map(x => ({ ...write([1, '4'], '4', x, 195, 26, 'd'), quick: true })),
    write([1, 'each'], '3 × 4', 250, 270, 48), write([1, '12'], '= 12', 370, 270, 48, 'y'),
    write([2, '12'], '12 pencils', 300, 350, 40, 'y'),
  ],
  // Step 2: take some away
  [
    write([0, 'question'], 'Step 2: how many left?', 300, 40, 30, 'd'),
    pencils([0], RX.slice(0, 7), 150), pencils([0], RX.slice(7), 150),
    write([0], '12 pencils', 300, 95, 22, 'd'),
    ring([1, '5'], 445, 150, 100, 42, 'b'), write([1, 'away'], '5 given away', 440, 215, 24, 'b'),
    write([1, '12'], '12 − 5', 300, 300, 48),
  ],
  // Put it together
  [
    pencils([0], RX.slice(0, 7), 130), pencils([0], RX.slice(7), 130, 'b'),
    write([0, '12'], '12 − 5', 250, 250, 48), cross([0, 'take'], 350, 100, 180, 60, 'b'),
    write([0, '7'], '= 7', 370, 250, 48, 'y'),
    ring([1, 'Sam'], 200, 130, 140, 42, 'y'), write([1, 'left'], '7 pencils left', 300, 340, 40, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'add'], '3 + 4', 110, 180, 36, 'r'), write([1, '5'], '− 5', 195, 180, 36, 'r'), write([1, '2'], '= 2', 265, 180, 36, 'r'),
    cross([1, '2'], 55, 158, 245, 45),
    write([2, '12'], '3 × 4 = 12', 450, 180, 36, 'y'),
    write([2, 'take'], '12 − 5', 450, 250, 40, 'y'), tick([2, 'take'], 530, 250),
  ],
]
