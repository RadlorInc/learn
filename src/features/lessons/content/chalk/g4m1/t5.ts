/** g4m1-t5's chalkboards: index = screen index (0 is Screen 1, which has none). Also the column sums t6 draws with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross, cells, arrow, hop, clock } from '../../../chalk'

export type At = [number, string?]
export const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))
/** The warning triangle every Screen 7 opens with. */
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 25], [345, 100], [255, 100], [300, 25]], 'r'), write(at, '!', 300, 75, 40, 'r')]

/** Four columns — thousands, hundreds, tens, ones — 60 apart. Digits sit in fixed columns so every row lines up. */
export const COL = { Th: 150, H: 210, T: 270, O: 330 }
export type Col = keyof typeof COL
export const ROW = { head: 40, top: 88, a: 138, b: 196, rule: 226, ans: 272 }
const XS = [COL.Th, COL.H, COL.T, COL.O]
/** A four-digit number in the columns on row y. */
export const num = (at: At, n: string, y: number, c: ChalkColor = 'w'): ChalkMark[] => [...n].map((d, i) => write(at, d, XS[i], y, 44, c))
/** One digit into one column (the answer row unless `y` says otherwise). */
export const digit = (at: At, d: string, col: Col, c: ChalkColor = 'y', y = ROW.ans): ChalkMark => write(at, d, COL[col], y, 44, c)
/** A small digit above a column: a carried 1, or a broken place's new value. */
export const small = (at: At, d: string, col: Col, c: ChalkColor = 'b', y = ROW.top): ChalkMark => write(at, d, COL[col], y, 30, c)
export const heads = (at: At): ChalkMark[] => q((['Th', 'H', 'T', 'O'] as const).map(h => write(at, h, COL[h], ROW.head, 22, 'd')))
/** a over b, the sign, and the rule. */
export const stack = (at: At, a: string, b: string, op: '+' | '−'): ChalkMark[] => q([
  ...num(at, a, ROW.a), write(at, op, 90, ROW.b, 44), ...num(at, b, ROW.b), line(at, [[70, ROW.rule], [360, ROW.rule]]),
])
/** A ring round one column, from the small row down through both numbers. */
export const colRing = (at: At, col: Col, c: ChalkColor = 'w'): ChalkMark => ring(at, COL[col], (ROW.top + ROW.b) / 2, 24, 88, c)
/** A working note on the right of the board. */
export const note = (at: At, t: string, y: number, c: ChalkColor = 'd', s = 26): ChalkMark => write(at, t, 475, y, s, c)

/** A smaller stack for Screen 7, columns 44 apart with the thousands at `ox`; rows start at y0. */
const mini = (ox: number, y0: number) => {
  const x = (i: number) => ox + i * 44
  const n = (at: At, t: string, y: number, c: ChalkColor = 'w') => [...t].map((d, i) => write(at, d, x(i), y, 36, c))
  return {
    x,
    stack: (at: At, a: string, b: string) => q([...n(at, a, y0 + 45), write(at, '+', ox - 44, y0 + 95, 36), ...n(at, b, y0 + 95),
      line(at, [[ox - 60, y0 + 120], [x(3) + 22, y0 + 120]])]),
    ans: (at: At, t: string, c: ChalkColor) => n(at, t, y0 + 160, c),
    carry: (at: At, i: number, c: ChalkColor = 'b') => write(at, '1', x(i), y0, 24, c),
  }
}

// Colours: yellow = a digit of the answer, blue = a carried 1, dim = labels and the working, coral = the warning.
export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too big to count on
  [
    write([0, '2,456'], '2,456', 300, 60, 40),
    write([0, 'one'], '2,457,  2,458,  2,459', 300, 120, 28, 'd'),
    clock([1, 'counts'], 150, 205, 28), write([1, '1,378'], '1,378 counts', 340, 205, 34, 'r'),
    write([2, 'faster'], 'a faster way', 300, 305, 36),
  ],
  // The big idea: one place at a time, from the ones; 10 or more carries 1 left
  [
    ...q((['Th', 'H', 'T', 'O'] as const).map((h, i) => write([0, 'place'], h, 165 + 90 * i, 205, 22, 'd'))),
    cells([0, 'place'], 120, 100, 360, 70, 4),
    arrow([0, 'starting'], [470, 245], [130, 245], 'd'), write([0, 'ones'], 'start', 530, 245, 24, 'd'),
    write([0, '10'], '1', 423, 135, 44), write([0, '10'], '4', 449, 135, 44),
    ring([0, 'carry'], 423, 135, 13, 22, 'b'), hop([0, 'carry'], 423, 350, 96, 'b'),
    write([0, 'left'], '1', 345, 62, 30, 'b'),
  ],
  // Start with the ones
  [
    ...heads([0, 'ones']), ...stack([0, '2,456'], '2456', '1378', '+').slice(0, 4), ...stack([0, '1,378'], '2456', '1378', '+').slice(4),
    colRing([1, 'right'], 'O'), note([1, '14'], '6 + 8 = 14', 110),
    digit([2, '4'], '4', 'O'), small([2, '1'], '1', 'T'),
  ],
  // Now the tens and hundreds
  [
    ...heads([0, 'Now']), ...stack([0, 'Now'], '2456', '1378', '+'), ...q([digit([0, 'Now'], '4', 'O'), small([0, 'Now'], '1', 'T')]),
    colRing([0, 'tens'], 'T'), note([0, '13'], '1 + 5 + 7 = 13', 110),
    digit([1, '3'], '3', 'T'), small([1, '1'], '1', 'H'),
    colRing([2, 'hundreds'], 'H'), note([2, '8'], '1 + 4 + 3 = 8', 160), digit([2, 'fits'], '8', 'H'),
  ],
  // Finish with the thousands
  [
    ...heads([0, 'Last']), ...stack([0, 'Last'], '2456', '1378', '+'),
    ...q([digit([0, 'Last'], '4', 'O'), digit([0, 'Last'], '3', 'T'), digit([0, 'Last'], '8', 'H'), small([0, 'Last'], '1', 'T'), small([0, 'Last'], '1', 'H')]),
    colRing([0, 'thousands'], 'Th'), note([0, '3'], '2 + 1 = 3', 110), digit([0, '3'], '3', 'Th'),
    ring([1, '3,834'], 240, ROW.ans, 125, 32, 'y'), write([1, 'visitors'], '3,834 visitors', 300, 350, 36, 'y'),
  ],
  // One thing not to do
  (() => {
    const L = mini(90, 140), R = mini(390, 140)
    return [
      ...warn([0, 'mix']),
      ...L.stack([1, 'FORGET'], '2456', '1378'), L.carry([1, 'carried'], 1), L.carry([1, 'carried'], 2),
      cross([2, 'Leave'], L.x(1) - 12, 128, 100, 24),
      ...L.ans([2, '3,724'], '3724', 'r'), cross([2, '3,724'], L.x(0) - 20, 275, L.x(3) - L.x(0) + 40, 50),
      ...R.stack([2, 'Add'], '2456', '1378'), R.carry([2, 'Add'], 1), R.carry([2, 'Add'], 2),
      ...R.ans([2, '3,834'], '3834', 'y'),
    ]
  })(),
]
