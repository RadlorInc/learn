/** g6m1-t1's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  A red bead is a filled white circle, a blue bead a blue ring; yellow is the answer, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, line, span, cross, ring } from '../../../chalk'

type At = [number, string?]
const R = 15
const disc = (x: number, y: number) => `M${x - R} ${y} a${R} ${R} 0 1 0 ${R * 2} 0 a${R} ${R} 0 1 0 ${-R * 2} 0`
/** Beads in a row from x0, `gap` apart: R = red (filled white), B = blue (blue ring). */
export const beads = ([beat, at]: At, x0: number, y: number, pattern: string, gap = 42): ChalkMark[] =>
  [...pattern].flatMap((k, i): ChalkMark[] => {
    const x = x0 + i * gap
    return k === 'R'
      ? [{ beat, at, d: disc(x, y), c: 'w' as const, wash: true, quick: true }, { beat, at, d: disc(x, y), c: 'w' as const, quick: true }]
      : [{ beat, at, d: disc(x, y), c: 'b' as const, quick: true }]
  })
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // "3 and 2" is not enough
  [
    ...beads([0, 'beads'], 111, 60, 'RRRBBRRRBB'),
    write([0, '3'], '3 and 2', 300, 135, 44),
    write([1, 'red'], 'red = ?', 300, 210, 32),
    write([2, 'color'], 'one color?', 170, 280, 28, 'b'), ...beads([2, 'color'], 128, 335, 'RRR'),
    write([2, 'all'], 'all the beads?', 430, 280, 28, 'b'), ...beads([2, 'all'], 346, 335, 'RRRBB'),
  ],
  // The big idea: part to part (top), part to whole (bottom)
  [
    ...beads([0, 'part'], 130, 60, 'RRR'), ...beads([0, 'part'], 130, 110, 'BB'),
    write([0, 'red'], '3 red', 330, 60, 28), write([0, 'blue'], '2 blue', 330, 110, 28, 'b'),
    write([0, 'blue'], '3 red to 2 blue', 300, 165, 30, 'y'),
    line([0, 'whole'], [[40, 205], [560, 205]], 'd'),
    ...beads([0, 'whole'], 216, 255, 'RRRBB'), span([0, 'whole'], 196, 404, 295, 'd'),
    ring([0, 'out'], 258, 255, 72, 28, 'y'),
    write([0, 'beads'], '3 red out of 5 beads', 300, 345, 30, 'y'),
  ],
  // Part to part
  [
    write([0, 'Red'], 'red', 150, 80, 26), ...beads([0, 'Red'], 240, 80, 'RRR', 50),
    write([0, 'blue'], 'blue', 150, 145, 26, 'b'), ...beads([0, 'blue'], 240, 145, 'BB', 50),
    write([1, '3'], '3', 470, 80, 40), write([1, '2'], '2', 470, 145, 40, 'b'),
    write([2, 'say'], '3 to 2', 300, 235, 36),
    write([2, 'dots'], '3 : 2', 300, 320, 56, 'y'),
  ],
  // Part to whole
  [
    ...beads([0, 'line'], 180, 90, 'RRRBB', 60),
    span([1, 'set'], 155, 445, 140, 'd'),
    write([1, '5'], '3 + 2 = 5 beads', 300, 195, 32),
    ring([2, '3'], 240, 90, 90, 34, 'y'),
    write([2, '5'], '3 out of 5', 300, 290, 44, 'y'),
    write([2, 'red'], 'are red', 300, 345, 26),
  ],
  // Order matters
  [
    write([0, 'words'], 'order of the words', 300, 60, 26, 'd'),
    write([0, 'numbers'], '= order of the numbers', 300, 100, 26, 'd'),
    write([1, 'Red'], 'red to blue', 200, 190, 32), write([1, '3'], '3 : 2', 440, 190, 44, 'y'),
    write([2, 'Blue'], 'blue to red', 200, 290, 32, 'b'), write([2, '2'], '2 : 3', 440, 290, 44, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...beads([1, 'ALL'], 216, 145, 'RRRBB'),
    write([1, '3'], 'red out of all = 3 : 2', 300, 245, 30, 'r'), cross([1, '2'], 130, 225, 340, 40),
    span([2, 'both'], 196, 404, 180, 'd'),
    write([2, '5'], 'red out of all = 3 out of 5', 300, 330, 30, 'y'),
  ],
]
