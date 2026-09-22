/** g4m1-t4's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, hop, cross, ring } from '../../../chalk'

type At = [number, string?]
// Colours: yellow = the round number it goes to (the answer), blue = the middle / the digit that checks, white = the
// number being rounded, coral = the trap, dim = labels.
const warn = (at: At): ChalkMark[] => [line(at, [[300, 25], [345, 100], [255, 100], [300, 25]], 'r'), write(at, '!', 300, 75, 40, 'r')]
const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))

/** A number line from 36,000 to 37,000 in 10 steps of 100, 46 apart, from x = 70 to 530. `X(i)` is step i. */
const X = (i: number) => 70 + i * 46
const numberLine = (at: At, y: number): ChalkMark[] => q([
  line(at, [[50, y], [550, y]], 'w', 3),
  { ...line(at, [[0, 0]]), d: Array.from({ length: 11 }, (_, i) => `M${X(i)} ${y - 8} v16`).join(' '), w: 2 },
])
const label = (at: At, t: string, i: number, y: number, c: ChalkColor = 'd', s = 24) => write(at, t, X(i), y, s, c)
const ends = (at: At, y: number, c: ChalkColor = 'd') => q([label(at, '36,000', 0, y, c), label(at, '37,000', 10, y, c)])
const dot = ([beat, at]: At, i: number, y: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, w: 6, d: `M${X(i) - 5} ${y} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0` })
/** 36,x20 written one digit to a column, so its last three digits can be struck through. */
const NX = [90, 114, 132, 150, 174, 198]
const num = (at: At, t: string, y: number) => q([...t].map((d, i) => write(at, d, NX[i], y, 40)))

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Crossing out is not enough
  [
    ...num([0, 'cross'], '36,420', 70), line([0, 'three'], [[136, 72], [212, 72]], 'r'),
    write([1, 'becomes'], '→ 36,000', 350, 70, 40),
    ...num([2, '36,720'], '36,720', 145), line([2, 'becomes'], [[136, 147], [212, 147]], 'r'),
    write([2, '36,000'], '→ 36,000', 350, 145, 40, 'r'),
    write([3, 'right'], '?', 480, 145, 40, 'r'), cross([3, 'No'], 265, 122, 170, 46),
    ...numberLine([3, 'closer'], 270), ...ends([3, 'closer'], 308),
    dot([3, 'closer'], 7.2, 270), label([3, 'closer'], '36,720', 7.2, 308, 'w'),
    hop([3, 'closer'], X(7.2), X(10), 270, 'y'), ring([3, '37,000'], X(10), 308, 46, 20, 'y'),
  ],
  // The big idea
  [
    ...numberLine([0, 'number'], 110), dot([0, 'number'], 7.2, 110), label([0, 'number'], '36,720', 7.2, 148, 'w'),
    ...ends([0, 'two'], 148),
    hop([0, 'between'], X(7.2), X(10), 110, 'y'), ring([0, 'between'], X(10), 148, 46, 20, 'y'),
    ...numberLine([0, 'middle'], 280), ...ends([0, 'middle'], 318),
    dot([0, 'middle'], 5, 280, 'b'), label([0, 'middle'], '36,500', 5, 318, 'b'),
    hop([0, 'up'], X(5), X(10), 280, 'y'), ring([0, 'up'], X(10), 318, 46, 20, 'y'),
  ],
  // Find the two round thousands
  [
    ...numberLine([0, 'Look'], 200), dot([0, 'Look'], 4.2, 200), label([0, 'Look'], '36,420', 4.2, 162, 'w', 26),
    label([1, '36,000'], '36,000', 0, 240, 'w'), label([1, '37,000'], '37,000', 10, 240, 'w'),
    ring([2, 'ends'], X(0), 240, 46, 20, 'b'), ring([2, 'ends'], X(10), 240, 46, 20, 'b'),
  ],
  // Find the middle
  [
    ...numberLine([0, 'Now'], 200), ...ends([0, 'Now'], 240),
    line([0, '36,500'], [[X(5), 182], [X(5), 218]], 'b', 4), label([0, '36,500'], '36,500', 5, 162, 'b', 26),
    dot([1, '36,420'], 4.2, 200), label([1, '36,420'], '36,420', 4.2, 240, 'w'),
    hop([2, 'closer'], X(4.2), X(0), 200, 'y'), ring([2, '36,000'], X(0), 240, 46, 20, 'y'),
  ],
  // Round to the closer end
  [
    write([0, 'rounds'], '36,420 → 36,000', 300, 70, 40, 'y'),
    write([0, 'fans'], 'about 36,000 fans', 300, 140, 30),
    ...q([['3', 210], ['6', 250], [',', 275], ['4', 300], ['2', 340], ['0', 380]].map(([d, x]) => write([1, 'digit'], d as string, x as number, 240, 52))),
    write([1, 'thousands'], 'thousands', 250, 288, 18, 'd'),
    ring([1, '4'], 300, 242, 20, 32, 'b'),
    write([1, 'less'], 'less than 5 → down', 300, 345, 30),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'DOWN'], '36,500 → 36,000', 300, 150, 36, 'r'), cross([1, 'DOWN'], 160, 128, 280, 46),
    ...numberLine([2, '36,500'], 262), ...ends([2, '36,500'], 300),
    dot([2, '36,500'], 5, 262, 'b'), label([2, '36,500'], '36,500', 5, 300, 'b'),
    hop([2, 'up'], X(5), X(10), 262, 'y'),
    write([2, '37,000'], '36,500 → 37,000', 300, 360, 34, 'y'),
  ],
]
