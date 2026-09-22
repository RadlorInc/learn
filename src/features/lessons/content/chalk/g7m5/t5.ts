/** g7m5-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A bar chart of heads and tails, 5 px a flip, with the expected count as a dashed line; yellow is what to expect. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, ring, arrow, cross } from '../../../chalk'

type At = [number, string?]
const bar = ([beat, at]: At, x: number, base: number, v: number, c: ChalkColor = 'w', w = 70): ChalkMark[] => [
  { beat, at, d: `M${x} ${base} v${-v * 5} h${w} v${v * 5}`, c, wash: true, quick: true },
  { beat, at, d: `M${x} ${base} v${-v * 5} h${w} v${v * 5}`, c },
]
/** A dashed level line at height v over the base. */
const dashed = ([beat, at]: At, x1: number, x2: number, base: number, v: number, c: ChalkColor = 'y'): ChalkMark =>
  ({ beat, at, c, w: 2.5, d: Array.from({ length: Math.floor((x2 - x1) / 16) }, (_, i) => `M${x1 + i * 16} ${base - v * 5} h9`).join(' ') })
const coin = (at: At, x: number, y: number, r = 40): ChalkMark[] => [ring(at, x, y, r, r, 'w'), write(at, 'H', x, y + 2, 36)]
const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]
/** 0.45 to 0.55 across the board, so 0.5 sits in the middle. */
const px = (v: number) => Math.round(80 + (v - 0.45) * 4400)
const dot = ([beat, at]: At, v: number, y: number, c: ChalkColor): ChalkMark[] => {
  const d = `M${px(v) - 7} ${y} a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0`
  return [{ beat, at, d, c, wash: true, quick: true }, { beat, at, d, c }]
}

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Guessing is not enough
  [
    ...coin([0, 'kid'], 130, 110, 50), write([0, 'kid'], '50 flips', 130, 195, 24, 'd'),
    write([0, '40'], '40 heads?', 440, 80, 32, 'r'),
    write([0, '10.'], '10 heads?', 440, 140, 32, 'r'),
    write([1, 'anything'], 'any number at all', 440, 200, 26, 'd'),
    arrow([2, 'coin'], [130, 220], [175, 290], 'y'),
    write([2, 'coin'], 'a number from the coin', 360, 320, 32, 'y'),
  ],
  // The big idea: expected = chance × tries, real lands near it
  [
    write([0, 'expect'], 'expected', 184, 65, 32, 'y'), write([0, 'chance'], '= chance', 320, 65, 32), write([0, 'tries'], '× tries', 456, 65, 32),
    line([0, 'results'], [[120, 340], [480, 340]], 'd'),
    ...bar([0, 'results'], 260, 340, 29),
    write([0, 'results'], 'real', 295, 368, 22, 'd'),
    dashed([0, 'near'], 150, 460, 340, 26),
    write([0, 'near'], 'expected', 520, 210, 22, 'y'),
    write([0, 'always'], 'near it, not always on it', 300, 130, 24, 'd'),
  ],
  // Find the expected count
  [
    ...coin([0, 'heads'], 110, 70, 40), write([0, '1/2'], 'heads: 1/2 chance', 360, 70, 32),
    write([1, '50'], '1/2 × 50', 250, 145, 36), write([1, '25'], '= 25', 380, 145, 36, 'y'),
    line([2, 'expect'], [[160, 350], [440, 350]], 'd'),
    ...bar([2, 'heads'], 200, 350, 25, 'y'), write([2, 'heads'], '25', 235, 208, 28, 'y'), write([2, 'heads'], 'heads', 235, 375, 20, 'd'),
    ...bar([2, 'tails'], 330, 350, 25, 'y'), write([2, 'tails'], '25', 365, 208, 28, 'y'), write([2, 'tails'], 'tails', 365, 375, 20, 'd'),
  ],
  // The real results: 27 and 23, near 25
  [
    line([0, 'Here'], [[160, 350], [440, 350]], 'd'),
    ...bar([0, '27'], 200, 350, 27), write([0, '27'], '27', 235, 198, 28), write([0, '27'], 'heads', 235, 375, 20, 'd'),
    ...bar([0, '23'], 330, 350, 23), write([0, '23'], '23', 365, 280, 28), write([0, '23'], 'tails', 365, 375, 20, 'd'),
    dashed([1, '25?'], 170, 440, 350, 25), write([1, '25?'], 'expected 25', 520, 225, 22, 'y'),
    write([1, 'more'], '2 more', 110, 210, 26, 'y'),
    write([2, 'wander'], 'real results wander a little', 300, 70, 28),
  ],
  // More flips, closer
  [
    write([0, '246'], '500 flips: 246 heads', 300, 45, 28),
    write([1, '0.54'], '27/50 = 0.54', 170, 115, 30, 'b'),
    write([1, '0.492'], '246/500 = 0.492', 420, 115, 30),
    line([2, 'closer'], [[60, 250], [540, 250]], 'd'),
    line([2, 'half'], [[px(0.5), 234], [px(0.5), 266]], 'y'), write([2, '0.5'], '0.5', px(0.5), 290, 26, 'y'),
    ...dot([2, '0.5'], 0.54, 250, 'b'), write([2, '0.5'], '0.54', px(0.54), 215, 22, 'b'),
    ...dot([2, '0.5'], 0.492, 250, 'w'), write([2, '0.5'], '0.492', px(0.492) - 30, 215, 22),
    ring([2, 'flips'], px(0.496), 250, 30, 20, 'y'),
    write([3, 'closer'], 'more tries, closer to the chance', 300, 350, 26, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'NOT'], 'real must equal expected', 300, 145, 30, 'r'), cross([1, 'equal'], 188, 122, 72, 46),
    write([2, 'mistake'], '27 heads: not a mistake', 300, 235, 28),
    write([2, 'Close'], '27 is close to 25', 300, 300, 36, 'y'),
  ],
]
