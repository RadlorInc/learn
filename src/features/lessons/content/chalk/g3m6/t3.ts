/** g3m6-t3's chalkboards: index = screen index (0 is Screen 1, which has none). Whole inches yellow, the part of an inch blue. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, arrow, hop, ring, cross } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
/** A ruler of `n` inches, `u` px an inch, 0 at x0, top edge at y: the body, the inch marks and their numbers. */
const ruler = (at: At, x0: number, y: number, n: number, u: number): ChalkMark[] => [
  q(box(at, x0 - 15, y, n * u + 30, 70)),
  q({ beat: at[0], at: at[1], d: Array.from({ length: n + 1 }, (_, i) => `M${x0 + i * u} ${y} v30`).join(' ') }),
  ...Array.from({ length: n + 1 }, (_, i) => q(write(at, String(i), x0 + i * u, y + 52, 22))),
]
/** The marks between the inches: every half (18 px long) and, with `quarters`, every quarter (10 px). */
const minor = (at: At, x0: number, y: number, n: number, u: number, quarters = false): ChalkMark => ({
  beat: at[0], at: at[1], w: 2.4,
  d: Array.from({ length: n * 4 }, (_, i) => i).filter(i => i % 4 && (quarters || i % 2 === 0))
    .map(i => `M${x0 + (i * u) / 4} ${y} v${i % 2 ? 10 : 18}`).join(' '),
})
/** A crayon (or pencil) lying on the ruler from 0 to `end`, its point exactly at `end`. */
const crayon = (at: At, x0: number, end: number, y: number): ChalkMark =>
  ({ beat: at[0], at: at[1], d: `M${x0} ${y - 42} H${end - 24} L${end} ${y - 27} L${end - 24} ${y - 12} H${x0} Z M${end - 24} ${y - 42} V${y - 12}` })

// Screens 2–5: the half-inch ruler, 0 to 4, 110 px an inch, and the crayon 2 1/2 inches long.
const X0 = 80, U = 110, RY = 210, END = X0 + 2.5 * U
const halfRuler = (at: At) => [...ruler(at, X0, RY, 4, U), q(minor(at, X0, RY, 4, U))]
const x = (inches: number) => X0 + inches * U

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // It stops between two numbers
  [
    ...halfRuler([0, 'Look']), crayon([0, 'crayon'], X0, END, RY),
    arrow([0, 'stop'], [END, 95], [END, 158], 'b'),
    { beat: 1, at: 'between', c: 'b', d: `M${x(2)} ${RY + 85} v20 M${x(3)} ${RY + 85} v20 M${x(2)} ${RY + 95} H${x(3)}` },
    write([2, 'where'], 'exactly where?', 300, 355, 30, 'y'),
  ],
  // The big idea: whole inches from 0, then the part past the last one
  [
    ...halfRuler([0, 'Count']), q(crayon([0, 'Count'], X0, END, RY)),
    hop([0, 'whole'], x(0), x(1), 160, 'y'), hop([0, 'whole'], x(1), x(2), 160, 'y'),
    write([0, 'inches'], 'whole inches', x(1), 60, 28, 'y'), ring([0, '0'], x(0), RY + 52, 16, 16, 'y'),
    hop([0, 'part'], x(2), END, 160, 'b'), write([0, 'past'], 'part', END - 5, 95, 26, 'b'),
  ],
  // Whole inches first
  [
    ...halfRuler([0, 'Start']), ring([0, '0'], x(0), RY + 52, 16, 16, 'y'), crayon([0, 'crayon'], X0, END, RY),
    hop([1, '1'], x(0), x(1), 160, 'y'), hop([1, '2'], x(1), x(2), 160, 'y'), cross([1, '3'], x(3) - 11, 135, 22, 22),
    write([2, 'inches'], '2 whole inches', 200, 340, 30, 'y'), write([2, 'more'], '+ a bit more', 450, 340, 26, 'b'),
  ],
  // Then the part past the inch
  [
    ...halfRuler([0, 'Now']), q(crayon([0, 'Now'], X0, END, RY)), wash([0, 'inch'], x(2), RY, U, 70, 'b'),
    line([1, 'middle'], [[x(2.5), RY], [x(2.5), RY + 18]], 'y', 5),
    write([1, 'parts'], '1/2', x(2.25), RY + 95, 22, 'b'), write([1, 'parts'], '1/2', x(2.75), RY + 95, 22, 'b'),
    arrow([2, 'stops'], [END, 100], [END, 158], 'y'), write([2, 'half'], '+ 1/2 inch', 480, 120, 26, 'b'),
    write([3, 'long'], '2 1/2 inches', 300, 355, 34, 'y'),
  ],
  // Quarter inches: a new ruler, 0 to 3, 140 px an inch, and the pencil 1 3/4 inches long
  [
    ...ruler([0, 'rulers'], 90, RY, 3, 140), minor([0, '4'], 90, RY, 3, 140, true),
    ...[0, 1, 2, 3].map(i => q(write([0, '1/4'], '1/4', 90 + 17.5 + 35 * i, RY + 92, 20, 'b'))),
    crayon([1, 'pencil'], 90, 90 + 1.75 * 140, RY), hop([1, '1'], 90, 230, 160, 'y'),
    ...[0, 1, 2].map(i => hop([1, '3'], 230 + 35 * i, 265 + 35 * i, 160, 'b')),
    write([2, 'long'], '1 3/4 inches', 300, 355, 34, 'y'),
  ],
  // One thing not to do: a small ruler, 0 to 3, 100 px an inch
  [
    ...warn([0, 'mix']),
    ...ruler([1, "Don't"], 60, 200, 3, 100), q(minor([1, "Don't"], 60, 200, 3, 100)), q(crayon([1, "Don't"], 60, 310, 200)),
    ...[1, 2, 3, 4, 5].map(i => q(write([1, 'every'], String(i), 60 + 50 * i, 292, 20, 'r'))),
    write([1, 'WHOLE'], '5 inches', 480, 230, 30, 'r'),
    ...[0, 1, 2, 3, 4].map(i => hop([2, 'half'], 60 + 50 * i, 110 + 50 * i, 150, 'b')),
    write([2, "That's"], '2 1/2 inches', 480, 320, 30, 'y'), cross([2, 'not'], 412, 210, 136, 40),
  ],
]
