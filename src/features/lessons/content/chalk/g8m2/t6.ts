/** g8m2-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The equation on top, what is taken off in blue under it, what is left below. Yellow is the verdict, coral "never true". */
import type { ChalkMark } from '../../../chalk'
import { write, line, ring, cross, arrow } from '../../../chalk'

type At = [number, string?]
export const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
/** The watch-out sign, top centre. */
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]
/** "− 2x" under each side of a 15-character equation written at x 300, size 36, and a rule under it. */
const takeOff = (at: At, t: string, y: number): ChalkMark[] => [
  write(at, t, 195, y, 28, 'b'), write(at, t, 330, y, 28, 'b'), line(at, [[160, y + 24], [440, y + 24]], 'd'),
]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Something strange: B is always $2 more
  [
    q(write([0, 'hours'], 'hours', 150, 60, 22, 'd')), q(write([0, 'hours'], 'Shop A', 300, 60, 24)), q(write([0, 'hours'], 'Shop B', 450, 60, 24, 'b')),
    line([0, 'hours'], [[90, 82], [510, 82]], 'd'),
    write([0, '1'], '1', 150, 118, 30, 'd'), write([0, '$5'], '$5', 300, 118, 30), write([0, '$7'], '$7', 450, 118, 30, 'b'),
    write([1, '10'], '10', 150, 172, 30, 'd'), write([1, '$23'], '$23', 300, 172, 30), write([1, '$25'], '$25', 450, 172, 30, 'b'),
    write([2, 'more'], 'B is always $2 more', 300, 245, 28, 'b'),
    write([2, 'same'], 'the same, ever?', 300, 320, 32, 'y'),
  ],
  // The big idea: what is left tells you how many answers
  [
    write([0, 'off'], 'take the x parts off', 300, 40, 24, 'd'),
    write([0, 'left'], 'what is left?', 300, 95, 26, 'd'),
    write([0, 'means'], 'x = 4', 170, 165, 34), arrow([0, 'means'], [240, 165], [320, 165], 'd'), write([0, 'one'], 'one answer', 430, 165, 30, 'y'),
    write([0, 'never'], '3 = 5', 170, 240, 34, 'r'), arrow([0, 'never'], [240, 240], [320, 240], 'd'), write([0, 'none'], 'no answer', 430, 240, 30, 'r'),
    write([0, 'always'], '6 = 6', 170, 315, 34), arrow([0, 'always'], [240, 315], [320, 315], 'd'), write([0, 'works'], 'every number', 430, 315, 30, 'y'),
  ],
  // Nothing works: 3 = 5
  [
    write([0, 'Take'], '2x + 3 = 2x + 5', 300, 60, 36),
    ...takeOff([0, 'off'], '− 2x', 110),
    write([1, '3'], '3 = 5', 300, 180, 38),
    write([2, 'Never'], 'never true', 470, 180, 26, 'r'),
    write([3, 'no'], 'no answer', 300, 250, 34, 'y'),
    line([3, 'meet'], [[180, 375], [300, 300]]), line([3, 'meet'], [[250, 375], [370, 300]], 'b'),
    write([3, 'meet'], 'never meet', 480, 340, 24, 'd'),
  ],
  // Everything works: 6 = 6
  [
    write([0, 'try'], '2(x + 3) = 2x + 6', 300, 60, 36),
    write([1, 'becomes'], '2x + 6 = 2x + 6', 300, 130, 36),
    write([2, 'get'], '6 = 6', 300, 200, 38),
    write([3, 'No'], 'always true', 470, 200, 26, 'y'),
    write([3, 'works'], 'every number works', 300, 295, 36, 'y'),
  ],
  // Exactly one works: x = 4
  [
    write([0, 'usual'], '3x + 1 = 2x + 5', 300, 60, 36),
    ...takeOff([1, 'off'], '− 2x', 110),
    write([1, 'still'], 'x + 1 = 5', 300, 180, 36), ring([1, 'there'], 229, 180, 20, 24),
    write([2, '4'], 'x = 4', 300, 250, 40, 'y'),
    write([3, 'one'], 'one answer', 300, 325, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'leave'], '6 = 6, so x = 0', 270, 155, 34, 'r'), cross([1, 'NOT'], 450, 137, 36, 36),
    write([2, 'works'], '6 = 6 → every number works', 300, 250, 30, 'y'),
  ],
]
