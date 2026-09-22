/** g4m5-t1's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, box, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'
// Colours across these boards: white = the paths, yellow = the name the ends give it, coral = the mix-up, dim = labels.

type At = [number, string?]
/** A dot at the end of a path: a tiny ring drawn thick enough to read as solid. */
export const dot = (at: At, x: number, y: number, c: ChalkColor = 'w'): ChalkMark => ({ ...ring(at, x, y, 4, 4, c), w: 7 })
/** A thumb over the end of a path: a dim wash. */
const thumb = ([beat, at]: At, x: number, y: number): ChalkMark =>
  ({ beat, at, c: 'd', wash: true, quick: true, d: `M${x - 20} ${y} a20 28 0 1 0 40 0 a20 28 0 1 0 -40 0` })
/** A path with an arrow at both ends, from the middle out. */
const both = (at: At, x1: number, x2: number, y: number): ChalkMark[] =>
  [arrow(at, [(x1 + x2) / 2, y], [x2, y]), arrow(at, [(x1 + x2) / 2, y], [x1, y])]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // The middle looks the same
  [
    { ...line([0, 'paths'], [[150, 120], [450, 120]]), quick: true }, write([0, 'paths'], 'string', 80, 120, 24, 'd'),
    line([0, 'paths'], [[150, 220], [520, 220]]), write([0, 'paths'], 'beam', 80, 220, 24, 'd'),
    thumb([1, 'ends'], 150, 120), thumb([1, 'ends'], 450, 120), thumb([1, 'ends'], 150, 220), thumb([1, 'ends'], 520, 220),
    write([1, 'same'], 'same', 300, 170, 28, 'd'),
    write([2, 'apart'], '?', 300, 320, 48, 'y'),
  ],
  // The big idea: a dot stops, an arrow goes on
  [
    line([0, 'Look'], [[150, 170], [420, 170]]),
    dot([0, 'dot'], 150, 170), write([0, 'stops'], 'stops', 150, 230, 30),
    arrow([0, 'arrow'], [420, 170], [460, 170]), write([0, 'forever'], 'goes on forever', 430, 230, 30),
  ],
  // Dots at both ends
  [
    line([0, 'string'], [[150, 150], [450, 150]]), write([0, 'string'], 'string', 300, 105, 24, 'd'),
    { ...dot([0, 'dot'], 150, 150), quick: true }, dot([0, 'dot'], 450, 150),
    write([1, 'segment'], 'dot + dot = line segment', 300, 270, 32, 'y'),
  ],
  // A dot and an arrow
  [
    box([0, 'flashlight'], 50, 136, 50, 28), line([0, 'flashlight'], [[100, 130], [122, 120], [122, 180], [100, 170], [100, 130]]),
    dot([0, 'dot'], 140, 150),
    arrow([1, 'arrow'], [140, 150], [540, 150]),
    write([2, 'ray'], 'dot + arrow = ray', 300, 270, 32, 'y'),
  ],
  // Arrows at both ends
  [
    ...both([0, 'arrow'], 80, 520, 150),
    write([1, 'forever'], 'forever', 90, 205, 26, 'd'), write([1, 'forever'], 'forever', 510, 205, 26, 'd'),
    write([1, 'line'], 'arrow + arrow = line', 300, 290, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...both([1, 'path'], 70, 170, 200),
    write([1, 'long'], 'short, so a line segment', 385, 200, 24, 'r'), cross([1, 'looks'], 235, 180, 300, 40),
    ring([2, 'arrows'], 76, 200, 16, 16), ring([2, 'arrows'], 164, 200, 16, 16),
    write([2, 'line'], 'two arrows, so a line', 385, 290, 28, 'y'),
  ],
]
