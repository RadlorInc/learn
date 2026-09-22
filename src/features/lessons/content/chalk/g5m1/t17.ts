/** g5m1-t17's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, arrow, span, cross, ring } from '../../../chalk'

// ── Small shared pieces for t17–t20 (apples, marbles, parentheses, the warning sign) ──────────────
type Pt = [number, number]
type At = [beat: number, at?: string]
/** Many small circles (apples, pears, marbles) drawn as ONE stroke, so a whole row goes up as one mark. */
export const dots = ([beat, at]: At, pts: Pt[], r = 8, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: pts.map(([x, y]) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`).join(' ') })
export const row = (x: number, y: number, n: number, gap: number): Pt[] => Array.from({ length: n }, (_, i) => [x + i * gap, y])
export const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
/** A big curved ( or ) of height h, centred on y. */
export const paren = ([beat, at]: At, x: number, y: number, h: number, open: boolean, c: ChalkColor = 'r'): ChalkMark =>
  ({ beat, at, c, d: `M${x} ${y - h / 2} Q${open ? x - 30 : x + 30} ${y} ${x} ${y + h / 2}` })
/** The warning triangle at the top of a "one thing not to do" board. */
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]

const B3 = [45, 225, 405]   // three bags across the board, 150 wide
const bags3 = (at: At, y: number, h: number): ChalkMark[] => [
  ...B3.map(x => q(box(at, x, y, 150, h))),
  q(dots(at, B3.flatMap(x => row(x + 20, y + h / 2, 4, 22)), 8, 'y')),
  q(dots(at, B3.flatMap(x => row(x + 108, y + h / 2, 2, 22)), 8, 'b')),
]
const L3 = [90, 150, 210]   // the compare screen: three bags down each side

export const T17: (ChalkMark[] | undefined)[] = [
  undefined,
  // A long way to write it
  [
    ...bags3([0, 'piece'], 40, 80),
    write([0, '4'], '4 + 2 + 4 + 2 + 4 + 2', 300, 190, 36),
    span([1, 'long'], 111, 489, 225, 'd'), write([1, 'long'], 'long!', 300, 255, 24, 'd'),
    q(write([2, 'same'], '=', 210, 80, 36, 'r')), write([2, 'same'], '=', 390, 80, 36, 'r'),
    write([2, 'bag'], 'each bag', 230, 320, 30, 'y'), write([2, 'all'], '= 4 + 2', 355, 320, 30, 'y'),
  ],
  // The big idea: one bag held together, then 3 of it
  [
    paren([0, 'keep'], 215, 90, 100, true), paren([0, 'keep'], 385, 90, 100, false),
    q(dots([0, 'together'], row(235, 90, 4, 26), 10, 'y')), dots([0, 'together'], row(339, 90, 2, 26), 10, 'b'),
    write([0, '3'], '3 ×', 215, 205, 40, 'r'), write([0, '3'], '(4 + 2)', 340, 205, 40),
    ...bags3([0, 'times'], 250, 60),
    ...[120, 300, 480].map(x => q(write([0, 'much'], '4 + 2', x, 345, 24, 'd'))),
  ],
  // Keep one bag together
  [
    box([0, 'bag'], 150, 50, 300, 100),
    dots([0, 'apples'], row(190, 100, 4, 35), 14, 'y'), write([0, 'apples'], '4', 242, 175, 28, 'y'),
    dots([0, 'pears'], [[355, 100], [395, 100]], 14, 'b'), write([0, 'pears'], '2', 375, 175, 28, 'b'),
    write([0, 'so'], '4 + 2', 300, 235, 44),
    write([1, 'Put'], '(', 210, 235, 56, 'r'), write([1, 'around'], ')', 390, 235, 56, 'r'),
    arrow([1, 'whole'], [300, 305], [300, 268], 'y'), write([1, 'together'], 'one whole bag', 300, 325, 28, 'y'),
  ],
  // Three of the whole bag
  [
    ...bags3([0, 'bags'], 30, 70),
    q(write([0, 'same'], '=', 210, 65, 36, 'r')), write([0, 'same'], '=', 390, 65, 36, 'r'),
    write([0, 'write'], '3 ×', 215, 160, 40, 'r'), write([0, 'write'], '(4 + 2)', 340, 160, 40),
    write([1, 'times'], '3 times one bag', 300, 220, 26, 'y'),
    ...[120, 300, 480].map(x => q(write([2, '6'], '6', x, 118, 24, 'b'))),
    write([2, '6'], '= 3 × 6', 300, 280, 36), write([2, '18'], '= 18', 300, 340, 40, 'y'), ring([2, '18'], 300, 340, 60, 28, 'y'),
  ],
  // Compare without working it out
  [
    write([0, 'look'], '3 × 4 + 2', 450, 50, 34), write([0, 'same'], '?', 300, 50, 40, 'd'),
    ...L3.map(y => q(box([1, 'bags'], 350, y, 200, 50))),
    dots([1, 'apples'], L3.flatMap(y => row(375, y + 25, 4, 24)), 9, 'y'),
    dots([1, 'pears'], [[435, 285], [465, 285]], 9, 'b'), write([1, 'all'], 'just 2 in all', 450, 325, 24, 'b'),
    write([2, '3'], '3 × (4 + 2)', 150, 50, 34),
    ...L3.map(y => q(box([2, 'has'], 50, y, 200, 50))),
    q(dots([2, 'has'], L3.flatMap(y => row(75, y + 25, 4, 24)), 9, 'y')),
    dots([2, 'pears'], L3.flatMap(y => row(171, y + 25, 2, 24)), 9, 'b'),
    write([2, 'every'], '2 in every bag', 150, 290, 24, 'b'),
    ring([2, 'more'], 150, 50, 105, 28, 'y'), write([2, 'more'], 'more', 150, 345, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'DROP'], '3 × 4 + 2', 170, 160, 36, 'r'), cross([1, 'the'], 85, 140, 170, 40),
    ...[20, 113, 206].map(x => q(box([2, 'Without'], x, 200, 86, 50))),
    dots([2, 'Without'], [20, 113, 206].flatMap(x => row(x + 16, 225, 4, 18)), 7, 'y'),
    dots([2, 'pears'], [[135, 285], [165, 285]], 9, 'b'), write([2, 'all'], 'just 2', 150, 325, 24, 'r'),
    write([2, 'every'], '3 × (4 + 2)', 452, 160, 36, 'y'),
    ...[320, 410, 500].map(x => q(box([2, 'every'], x, 200, 84, 56))),
    q(dots([2, 'every'], [320, 410, 500].flatMap(x => row(x + 15, 216, 4, 18)), 7, 'y')),
    dots([2, 'bag'], [320, 410, 500].flatMap(x => row(x + 33, 240, 2, 18)), 7, 'b'),
    write([2, 'bag'], '2 in every bag', 452, 325, 24, 'y'),
  ],
]
