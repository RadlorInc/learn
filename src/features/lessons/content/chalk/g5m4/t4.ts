/** g5m4-t4's chalkboards: index = screen index (0 is Screen 1, which has none). Also the decimal columns t5 draws with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross, arrow } from '../../../chalk'
import { q, warn, dot, type At } from './t1'

export { q, warn, dot, type At }

/** Columns tens, ones, tenths, hundredths — the point sits on its own line between the ones and the tenths, so every
 *  number's point lands in one column. */
export type Cols = { T: number; O: number; P: number; t: number; h: number }
export const C: Cols = { T: 120, O: 195, P: 232, t: 270, h: 345 }
export type Col = 'T' | 'O' | 't' | 'h'
/** Row heights: heads, the small row(s) above for carries and trades, the two numbers, the rule, the answer. */
export const L = { head: 35, s1: 82, s2: 50, a: 135, b: 192, rule: 224, ans: 270 }

/** A decimal written into the columns on row y, point lined up; `shift` moves it right by whole columns (the slip). */
export const row = (at: At, t: string, y: number, c: ChalkColor = 'w', cols: Cols = C, s = 44, shift = 0): ChalkMark[] => {
  const [w, f = ''] = t.split('.')
  const X = [cols.T, cols.O, cols.t, cols.h], gap = cols.t - cols.O
  const out: ChalkMark[] = []
  ;[...w].reverse().forEach((d, i) => out.push(write(at, d, X[1 - i] + shift * gap, y, s, c)))
  if (t.includes('.')) out.push(dot(at, cols.P + shift * gap, y + s * 0.22, c))
  ;[...f].forEach((d, i) => out.push(write(at, d, X[2 + i] + shift * gap, y, s, c)))
  return q(out)
}
export const heads = (at: At): ChalkMark[] => q(['tens', 'ones', 'tenths', 'hundredths'].map((h, i) =>
  write(at, h, [C.T, C.O, C.t, C.h][i], L.head, 18, 'd')))
export const sign = (at: At, op: '+' | '−', cols: Cols = C, y = L.b, s = 44): ChalkMark => write(at, op, cols.T - (cols.O - cols.T) + 10, y, s)
export const rule = (at: At, y = L.rule, x1 = 40, x2 = 385): ChalkMark => line(at, [[x1, y], [x2, y]])
/** One digit into one column (the answer row unless `y` says otherwise). */
export const digit = (at: At, d: string, col: Col, c: ChalkColor = 'y', y = L.ans): ChalkMark => write(at, d, C[col], y, 44, c)
/** A small digit above a column: a carried 1, or a traded place's new value. */
export const small = (at: At, d: string, col: Col, y = L.s1, c: ChalkColor = 'b'): ChalkMark => write(at, d, C[col], y, 28, c)
/** A ring round one column, from the small row down through both numbers. */
export const colRing = (at: At, col: Col, c: ChalkColor = 'd'): ChalkMark => ring(at, C[col], (L.s1 + L.b) / 2 + 4, 26, 76, c)
export const note = (at: At, t: string, y: number, c: ChalkColor = 'd', s = 24): ChalkMark => write(at, t, 490, y, s, c)
/** The point coming straight down into the answer. */
export const pointDown = (at: At): ChalkMark[] => [arrow(at, [C.P, L.b + 22], [C.P, L.ans - 4], 'y'), dot(at, C.P, L.ans + 10, 'y')]

/** A small copy of the columns for Screen 7, with its tens at x. */
export const mini = (x: number): Cols => ({ T: x, O: x + 40, P: x + 60, t: x + 80, h: x + 120 })
/** A small sum on Screen 7: a over b (b shifted by `shift` columns), the sign and the rule, rows from y0. */
export const miniSum = (at: At, cols: Cols, a: string, b: string, op: '+' | '−', y0: number, shift = 0): ChalkMark[] => [
  ...row(at, a, y0, 'w', cols, 32), ...row(at, b, y0 + 45, 'w', cols, 32, shift),
  ...q([sign(at, op, cols, y0 + 45, 32), rule(at, y0 + 70, cols.T - 44, cols.h + 26)]),
]

const setup = (at: At, zero: ChalkColor = 'b'): ChalkMark[] => [...heads(at), ...row(at, '12.45', L.a), ...row(at, '3.7', L.b),
  ...q([digit(at, '0', 'h', zero, L.b), sign(at, '+'), rule(at)])]

// Colours: yellow = the answer and the point coming down, blue = a 0 put in an empty place and the carried 1,
// coral = the last digits lined up (the slip), dim = labels and the working.
export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // The last digits trick you
  [
    ...row([0, 'last'], '12.45', L.a), ...row([0, 'digits'], '3.7', L.b, 'w', C, 44, 1), ...q([sign([0, 'digits'], '+'), rule([0, 'digits'])]),
    ring([1, '7'], C.h, L.b, 20, 26, 'r'), write([1, 'tenths'], 'tenths', 440, L.b, 24, 'r'),
    ring([1, '5'], C.h, L.a, 20, 26, 'r'), write([1, 'hundredths'], 'hundredths', 460, L.a, 24, 'r'),
    write([2, 'off'], 'way off', 230, 300, 34, 'r'),
  ],
  // The big idea
  [
    ...heads([0, 'Line']), ...row([0, 'Line'], '12.45', L.a), ...row([0, 'points'], '3.7', L.b),
    { ...line([0, 'points'], [[C.P, 100], [C.P, 300]], 'd'), w: 2 },
    sign([0, 'add'], '+'), rule([0, 'add']), note([0, 'whole'], '1245 + 370', 165),
    ...pointDown([0, 'down']),
  ],
  // Line up the points
  [
    ...heads([0, 'Put']), ...row([0, 'Put'], '12.45', L.a), ...row([0, 'points'], '3.7', L.b),
    { ...line([0, 'under'], [[C.P, 100], [C.P, 215]], 'd'), w: 2 }, sign([0, 'other'], '+'), rule([0, 'other']),
    ring([1, 'no'], C.h, L.b, 24, 28, 'r'), digit([1, '3.70'], '0', 'h', 'b', L.b),
    note([2, 'same'], 'same places', 165),
  ],
  // Add from the right
  [
    ...setup([0, 'Add']),
    colRing([0, 'Hundredths'], 'h'), note([0, '0'], '5 + 0 = 5', 110), digit([0, '0'], '5', 'h'),
    colRing([1, 'Tenths'], 't'), note([1, '11'], '4 + 7 = 11', 155), digit([1, 'Write'], '1', 't'), small([1, 'carry'], '1', 'O'),
    colRing([2, 'Ones'], 'O'), note([2, '6'], '1 + 2 + 3 = 6', 200), digit([2, '6'], '6', 'O'),
    digit([2, 'just'], '1', 'T'),
  ],
  // Bring the point down
  [
    ...setup([0, 'Last']), ...q([small([0, 'Last'], '1', 'O'), digit([0, 'Last'], '1', 'T'), digit([0, 'Last'], '6', 'O'), digit([0, 'Last'], '1', 't'), digit([0, 'Last'], '5', 'h')]),
    ...pointDown([0, 'drops']),
    write([1, '16.15'], '16.15 pounds', 300, 350, 36, 'y'),
  ],
  // One thing not to do
  (() => {
    const A = mini(90), B = mini(390)
    return [
      ...warn([0, 'mix']),
      ...miniSum([1, 'LAST'], A, '12.45', '3.7', '+', 150, 1),
      ...row([1, '12.82'], '12.82', 260, 'r', A, 32), cross([1, '12.82'], A.T - 20, 238, 150, 44),
      ...miniSum([2, 'points'], B, '12.45', '3.7', '+', 150), write([2, 'points'], '0', B.h, 195, 32, 'b'),
      ...row([2, '16.15'], '16.15', 260, 'y', B, 32),
    ]
  })(),
]
