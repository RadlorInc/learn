/** g8m1-t8's chalkboards: index = screen index (0 is Screen 1, which has none). Also the root sign t9 uses.
 *  Yellow is the side (the answer), blue the cube's, coral the mix-up, dim the labels. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, cross, ring, span, chalkWidth } from '../../../chalk'
import { warn, type At } from './t6'

/**
 * "√n = ans" (or "∛n = ans" with `index` '3'), centred on x. The chalk face has no √, so the sign is drawn: a tick and a
 * roof over the number. `ans` may start with < or > instead of the =. `ansAt` puts "= ans" up at a later word; without `ans` only the root is written.
 */
export function root(at: At, n: string, x: number, y: number, s = 44, c: ChalkColor = 'w', ans?: string, ansAt: At = at, index?: string): ChalkMark[] {
  const nw = chalkWidth(n, s), tail = ans ? (/^[<>]/.test(ans) ? ans : `= ${ans}`) : '', tw = tail ? chalkWidth(tail, s) + s * 0.3 : 0
  const l = x - (30 + nw + tw) / 2 + 30, top = y - s * 0.55, bot = y + s * 0.42
  return [
    ...(index ? [write(at, index, l - 18, y - s * 0.32, Math.round(s * 0.42), c)] : []),
    { beat: at[0], at: at[1], c, d: `M${l - 28} ${y + 2} L${l - 19} ${y - 4} L${l - 9} ${bot} L${l - 1} ${top} H${l + nw + 6}` },
    write(at, n, l + 3 + nw / 2, y, s, c),
    ...(ans ? [write(ansAt, tail, l + 3 + nw + s * 0.3 + chalkWidth(tail, s) / 2, y, s, c)] : []),
  ]
}

/** A square of n × n tiles, drawn as one stroke. */
const grid = ([beat, at]: At, x: number, y: number, w: number, n: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `M${x} ${y} h${w} v${w} h${-w} Z` + Array.from({ length: n - 1 }, (_, i) => {
    const k = (w * (i + 1)) / n
    return ` M${x + k} ${y} v${w} M${x} ${y + k} h${w}`
  }).join('') })

/** A cube of n × n × n small cubes: the front face, the top and the right side, each ruled. */
const cube = ([beat, at]: At, x: number, y: number, w: number, n: number, c: ChalkColor = 'w'): ChalkMark => {
  const d = w * 0.4, r = (i: number) => (w * i) / n, rd = (i: number) => (d * i) / n
  const inner = Array.from({ length: n - 1 }, (_, j) => j + 1).map(i =>
    ` M${x + r(i)} ${y} v${w} M${x} ${y + r(i)} h${w}`                                     // front
    + ` M${x + r(i)} ${y} l${d} ${-d} M${x + rd(i)} ${y - rd(i)} h${w}`                   // top
    + ` M${x + w + rd(i)} ${y - rd(i)} v${w} M${x + w} ${y + r(i)} l${d} ${-d}`).join('')   // side
  return { beat, at, c, d: `M${x} ${y} h${w} v${w} h${-w} Z M${x} ${y} l${d} ${-d} h${w} v${w} l${-d} ${d} M${x + w} ${y} l${d} ${-d}` + inner }
}

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // Dividing will not find the side
  [
    write([0, 'half'], '25 ÷ 2 = 12.5', 300, 60, 40),
    write([1, 'long'], 'side = 12.5 tiles ?', 300, 135, 32),
    cross([2, 'no'], 268, 118, 66, 36), write([2, 'rows'], '12.5 × 12.5', 300, 210, 34, 'r'),
    write([2, 'more'], 'far more than 25', 300, 258, 24, 'd'),
    write([3, 'itself'], '? × ? = 25', 300, 335, 48, 'y'),
  ],
  // The big idea: undo the square, undo the cube
  [
    grid([0, 'squaring'], 80, 60, 150, 5), write([0, 'itself'], '? × ? = 25', 155, 280, 34, 'y'),
    cube([0, 'cubing'], 380, 110, 120, 3, 'b'), write([0, 'three'], '? × ? × ? = 27', 460, 280, 32, 'y'),
  ],
  // Back from 25
  [
    grid([0, 'square'], 60, 60, 160, 5), write([0, 'side'], '? × ? = 25', 420, 100, 40),
    write([1, '5'], '5 × 5 = 25', 420, 185, 40, 'y'), span([1, 'tiles'], 60, 220, 250, 'y'), write([1, 'tiles'], '5', 140, 285, 34, 'y'),
    ...root([2, 'write'], '25', 420, 300, 56, 'y', '5', [2, '25']),
  ],
  // Back from 27
  [
    cube([0, 'cube'], 60, 110, 130, 3, 'b'), write([0, 'side'], '? × ? × ? = 27', 425, 100, 34),
    write([1, '3'], '3 × 3 × 3 = 27', 425, 185, 34, 'y'), span([1, 'cubes'], 60, 190, 270, 'y'), write([1, 'cubes'], '3', 125, 310, 34, 'y'),
    ...root([2, 'small'], '27', 425, 300, 56, 'y', '3', [2, '27'], '3'),
  ],
  // Know your squares and cubes
  [
    write([0, 'know'], 'n', 95, 60, 26, 'd'), ...['1', '2', '3', '4', '5'].map((v, i) => write([0, 'know'], v, 220 + i * 75, 60, 30, 'd')),
    write([0, 'squares'], 'n × n', 95, 120, 26, 'd'), ...['1', '4', '9', '16', '25'].map((v, i) => write([0, 'squares'], v, 220 + i * 75, 120, 32)),
    write([0, 'cubes'], 'n × n × n', 95, 180, 26, 'd'), ...['1', '8', '27', '64', '125'].map((v, i) => write([0, 'cubes'], v, 220 + i * 75, 180, 32, 'b')),
    ring([1, '16'], 445, 120, 30, 24, 'y'), ...root([1, 'so'], '16', 160, 300, 48, 'y', '4'),
    ring([2, '64'], 445, 180, 30, 24, 'b'), ...root([2, 'so'], '64', 440, 300, 48, 'b', '4', [2, 'so'], '3'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'divide'], '36 ÷ 2 = 18', 300, 160, 40, 'r'), cross([1, '36'], 350, 140, 50, 42),
    write([2, 'far'], '18 × 18 is far more than 36', 300, 230, 26, 'd'),
    write([2, '6'], '6 × 6 = 36', 300, 285, 36, 'y'),
    ...root([2, 'so'], '36', 300, 350, 44, 'y', '6'),
  ],
]
