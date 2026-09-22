/** g7m2-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Yellow is a positive answer / what matters, blue a negative one, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cross, ring } from '../../../chalk'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]
/** A pattern row: the product on the left, its answer on the right. Rows 55 apart from y = 50. */
const RY = (i: number) => 50 + 55 * i
const expr = (at: At, i: number, t: string): ChalkMark => write(at, t, 210, RY(i), 32)
const ans = (at: At, i: number, t: string, c: 'w' | 'y' | 'b' = 'w'): ChalkMark => write(at, t, 380, RY(i), 34, c)
const steps = (at: At, t: string, c: 'y' | 'b'): ChalkMark[] => [0, 1, 2, 3].map(i => q(write(at, t, 470, RY(i) + 27, 22, c)))

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // What about two minus signs?
  [
    write([0, 'is'], '3 × (−2)', 150, 60, 36),
    ...[0, 1, 2].map(i => q(box([0, 'groups'], 30 + 85 * i, 105, 70, 50))),
    ...[0, 1, 2].map(i => q(write([0, 'groups'], '−2', 65 + 85 * i, 130, 30, 'b'))),
    write([0, 'groups'], '3 groups of −2', 150, 195, 24, 'd'),
    write([1, 'could'], '−3 × (−2)', 450, 60, 36), write([1, 'mean'], '?', 450, 130, 48, 'y'),
    write([2, 'make'], '−3 groups', 450, 240, 32, 'r'), cross([2, 'anything'], 380, 222, 140, 36),
  ],
  // The big idea: same signs → +, different → −
  [
    write([0, 'Multiply'], 'multiply, then check the signs', 300, 50, 28),
    write([0, 'same'], 'same signs', 160, 130, 26, 'd'),
    write([0, 'same'], '+ × +  →  +', 160, 190, 32, 'y'), write([0, 'same'], '− × −  →  +', 160, 250, 32, 'y'),
    write([0, 'different'], 'different signs', 440, 130, 26, 'd'),
    write([0, 'different'], '+ × −  →  −', 440, 190, 32, 'b'), write([0, 'different'], '− × +  →  −', 440, 250, 32, 'b'),
  ],
  // Watch a pattern: 3 × n
  [
    expr([0, 'pattern'], 0, '3 × 2'), ans([0, '6'], 0, '6'),
    expr([0, 'and'], 1, '3 × 1'), ans([0, 'and'], 1, '3'),
    expr([1, 'down'], 2, '3 × 0'), ans([1, 'is'], 2, '0'),
    expr([1, '1'], 3, '3 × (−1)'), ans([1, '1'], 3, '−3'),
    expr([1, 'and'], 4, '3 × (−2)'), ans([1, 'and'], 4, '−6', 'b'),
    ...steps([2, 'drops'], '− 3', 'b'),
    ring([2, 'changed'], 380, RY(4), 34, 26, 'y'), write([2, 'changed'], 'score change: −6', 300, 350, 30, 'y'),
  ],
  // Now start with −3
  [
    expr([0, 'start'], 0, '−3 × 2'), ans([0, '6'], 0, '−6'),
    expr([0, 'and'], 1, '−3 × 1'), ans([0, 'and'], 1, '−3'),
    expr([1, 'going'], 2, '−3 × 0'), ans([1, 'is'], 2, '0'),
    expr([1, 'next'], 3, '−3 × (−1)'), expr([1, 'next'], 4, '−3 × (−2)'),
    ...steps([2, 'up'], '+ 3', 'y'),
    ans([2, 'So'], 3, '3', 'y'), ans([2, '6'], 4, '6', 'y'),
    ring([2, '6'], 380, RY(4), 30, 26, 'y'), write([2, '6'], '−3 × (−2) = 6', 300, 350, 30, 'y'),
  ],
  // Just check the signs
  [
    write([0, 'Multiply'], '3 × 2 = 6', 300, 55, 38), write([0, 'forget'], 'no signs yet', 300, 105, 24, 'd'),
    write([1, '3'], '3 × (−2)', 160, 175, 34), write([1, 'different'], 'different signs', 160, 230, 24, 'b'),
    write([1, "it's"], '−6', 160, 300, 48, 'b'),
    write([2, '3'], '−3 × (−2)', 440, 175, 34), write([2, 'same'], 'same signs', 440, 230, 24, 'y'),
    write([2, "it's"], '6', 440, 300, 48, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'bigger'], '−3 × (−2) =', 260, 165, 38), write([1, '6'], '−6', 410, 165, 38, 'r'), cross([1, '6'], 385, 140, 50, 50),
    write([2, 'Same'], 'same signs  →  +', 300, 245, 28, 'd'),
    write([2, "It's"], '−3 × (−2) = 6', 300, 320, 40, 'y'),
  ],
]
