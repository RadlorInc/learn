/** g7m2-t1's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A number line from −9 to 9, 28 apart, 0 in the middle; yellow is the answer, blue the other side, coral the mix-up. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, arrow, cross } from '../../../chalk'

export type At = [number, string?]
const m = (v: number) => String(v).replace('-', '−')
/** Where the value v sits across the board. */
export const nx = (v: number) => 300 + 28 * v
/** The line, a tick at every whole number, and the numbers in `labels` written under it. */
export const numLine = (at: At, y: number, labels: number[] = [0]): ChalkMark[] => [
  { beat: at[0], at: at[1], c: 'w', d: `M36 ${y} H564` + Array.from({ length: 19 }, (_, i) => ` M${nx(i - 9)} ${y - (i === 9 ? 12 : 7)} v${i === 9 ? 24 : 14}`).join('') },
  ...labels.map(v => ({ ...under(at, v, y), quick: true })),
]
/** A number written under its tick. */
export const under = (at: At, v: number, y: number, c: ChalkColor = 'd', t = m(v)): ChalkMark => write(at, t, nx(v), y + 32, 22, c)
/** A filled dot on the line at v. */
export const dot = ([beat, at]: At, v: number, y: number, c: ChalkColor = 'w'): ChalkMark[] => {
  const x = nx(v), d = `M${x - 7} ${y} a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0`
  return [{ beat, at, d, c, wash: true, quick: true }, { beat, at, d, c, quick: true }]
}
/** A jump along the line from a to b, arched over it, arrowhead at b. */
export const jump = ([beat, at]: At, a: number, b: number, y: number, c: ChalkColor = 'y', h = 45): ChalkMark => {
  const x1 = nx(a), x2 = nx(b), xm = (x1 + x2) / 2, top = y - 2 * h
  const ang = Math.atan2(y - top, x2 - xm), k = 12
  const side = (s: number) => `${(x2 - k * Math.cos(ang + s)).toFixed(1)} ${(y - k * Math.sin(ang + s)).toFixed(1)}`
  return { beat, at, c, d: `M${x1} ${y} Q${xm} ${top} ${x2} ${y} M${side(0.5)} L${x2} ${y} L${side(-0.5)}` }
}
/** One-step hops from a towards b, each with its count written over it at the word that counts it. */
export const countHops = (beat: number, a: number, b: number, y: number, c: ChalkColor = 'y'): ChalkMark[] => {
  const dir = Math.sign(b - a)
  return Array.from({ length: Math.abs(b - a) }, (_, i) => {
    const f = a + dir * i, n = String(i + 1)
    return [jump([beat, n], f, f + dir, y, c, 16), write([beat, n], n, (nx(f) + nx(f + dir)) / 2, y - 38, 22, c)]
  }).flat()
}
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]
const wave = (at: At, x1: number, x2: number, y: number): ChalkMark =>
  ({ beat: at[0], at: at[1], c: 'b', d: `M${x1} ${y}` + Array.from({ length: Math.round((x2 - x1) / 40) }, (_, i) => (i ? ' t40 0' : ' q20 -10 40 0')).join('') })

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // 4 is not enough: bird up, fish down, both "4"
  [
    wave([0, 'water'], 60, 300, 200), write([0, 'water'], 'water', 335, 200, 20, 'b'),
    write([0, 'Both'], 'bird', 180, 60, 28), write([0, 'Both'], 'fish', 180, 340, 28),
    arrow([0, '4'], [180, 190], [180, 90]), write([0, '4'], '4 ft', 232, 140, 22, 'd'),
    arrow([0, '4'], [180, 210], [180, 310]), write([0, '4'], '4 ft', 232, 262, 22, 'd'),
    write([1, 'bird'], '4', 420, 90, 44), write([1, 'fish'], '4', 420, 310, 44),
    write([2, 'up'], 'up?', 500, 90, 26, 'r'), write([2, 'under'], 'down?', 500, 310, 26, 'r'),
    write([2, 'tell'], 'which is which?', 460, 200, 24, 'r'),
  ],
  // The big idea: 4 and −4, 4 steps each way from 0
  [
    ...numLine([0, 'number'], 210), ...dot([0, 'number'], 4, 210), under([0, 'number'], 4, 210, 'w'),
    ...dot([0, 'opposite'], -4, 210, 'b'), under([0, 'opposite'], -4, 210, 'b'),
    jump([0, 'same'], 0, 4, 210), jump([0, 'same'], 0, -4, 210),
    write([0, 'distance'], '4 steps', nx(2), 100, 24, 'y'), write([0, 'distance'], '4 steps', nx(-2), 100, 24, 'y'),
    write([0, 'sides'], 'left of 0', nx(-4), 320, 26, 'b'), write([0, 'sides'], 'right of 0', nx(4), 320, 26),
  ],
  // Count from 0 to the bird
  [
    ...numLine([0, 'water'], 220), write([0, 'number'], 'water', 300, 282, 20, 'b'),
    ...countHops(1, 0, 4, 220),
    ...dot([2, 'bird'], 4, 220, 'y'), under([2, 'bird'], 4, 220, 'y'), write([2, 'bird'], 'bird: 4', nx(4), 115, 32, 'y'),
  ],
  // The fish: 4 steps the other way, gets a minus sign
  [
    ...numLine([0, 'Now'], 200), ...dot([0, 'Now'], 4, 200, 'd'), under([0, 'Now'], 4, 200), write([0, 'Now'], 'bird', nx(4), 90, 24, 'd'),
    write([0, 'way'], 'which way?', 300, 295, 24, 'd'),
    jump([1, 'left'], 0, -4, 200, 'b'), write([1, 'left'], '4 steps', nx(-2), 90, 24, 'b'),
    write([2, 'minus'], 'left of 0 gets a −', 300, 345, 26),
    ...dot([2, 'fish'], -4, 200, 'y'), under([2, 'fish'], -4, 200, 'y'), write([2, 'fish'], 'fish: −4', nx(-4), 50, 30, 'y'),
  ],
  // Pairs: 7 and −7
  [
    write([0, 'opposites'], '4 and −4 are opposites', 300, 45, 28, 'y'),
    ...numLine([1, 'Try'], 180), ...dot([1, 'Try'], 7, 180), under([1, 'Try'], 7, 180, 'w'),
    jump([1, 'Go'], 0, 7, 180, 'd'), jump([1, 'way'], 0, -7, 180, 'y'),
    ...dot([1, 'land'], -7, 180, 'y'), under([1, 'land'], -7, 180, 'y'),
    write([1, 'land'], 'opposite of 7 = −7', 300, 280, 28),
    write([2, "it's"], 'opposite of −7 = 7', 300, 340, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'KEEP'], 'opposite of −5 = −5', 300, 140, 30, 'r'), cross([1, 'sign'], 380, 118, 80, 44),
    ...numLine([2, 'left'], 305), ...dot([2, 'left'], -5, 305, 'b'), under([2, 'left'], -5, 305, 'b'),
    jump([2, 'right'], 0, 5, 305, 'y', 30), ...dot([2, 'at'], 5, 305, 'y'), under([2, 'at'], 5, 305, 'y'),
    write([2, 'at'], 'opposite of −5 = 5', 300, 205, 30, 'y'),
  ],
]
