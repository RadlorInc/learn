/** g6m3-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Decimal columns to the thousandths. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross, arrow } from '../../../chalk'
import { q, warn, dot, type At } from '../g5m4/t1'

/** Columns tens, ones, tenths, hundredths, thousandths; the point sits halfway between ones and tenths,
 *  so every number's point lands in one column. */
type Cols = { T: number; O: number; P: number; t: number; h: number; th: number }
type Col = 'T' | 'O' | 't' | 'h' | 'th'
const C: Cols = { T: 80, O: 160, P: 200, t: 240, h: 330, th: 420 }
/** Rows: heads, two small rows for trades, the two numbers, the rule, the answer. */
const L = { head: 22, s2: 50, s1: 82, a: 135, b: 192, rule: 224, ans: 272 }

/** A decimal written into the columns on row y, point lined up; `shift` moves it right by whole columns. */
const row = (at: At, t: string, y: number, c: ChalkColor = 'w', cols: Cols = C, s = 44, shift = 0): ChalkMark[] => {
  const [w, f = ''] = t.split('.')
  const X = [cols.T, cols.O, cols.t, cols.h, cols.th], gap = cols.h - cols.t
  const out: ChalkMark[] = []
  ;[...w].reverse().forEach((d, i) => out.push(write(at, d, X[1 - i] + shift * gap, y, s, c)))
  if (t.includes('.')) out.push(dot(at, cols.P + shift * gap, y + s * 0.22, c))
  ;[...f].forEach((d, i) => out.push(write(at, d, X[2 + i] + shift * gap, y, s, c)))
  return q(out)
}
const heads = (at: At, y = L.head): ChalkMark[] => q(['tens', 'ones', 'tenths', 'hundredths', 'thousandths'].map((h, i) =>
  write(at, h, [C.T, C.O, C.t, C.h, C.th][i], y, 15, 'd')))
const sign = (at: At, cols: Cols = C, y = L.b, s = 44): ChalkMark => write(at, '−', cols.T - (cols.O - cols.T) * 0.6, y, s)
const rule = (at: At, y = L.rule, x1 = 25, x2 = 440): ChalkMark => line(at, [[x1, y], [x2, y]])
const digit = (at: At, d: string, col: Col, c: ChalkColor = 'y', y = L.ans): ChalkMark => write(at, d, C[col], y, 44, c)
const small = (at: At, d: string, col: Col, y = L.s1, c: ChalkColor = 'b'): ChalkMark => write(at, d, C[col], y, 26, c)
/** A slash through a traded digit: a big one in the top number, or a small one above it. */
const slash = (at: At, col: Col, y: number = L.a, big = true): ChalkMark =>
  line(at, big ? [[C[col] - 16, y + 22], [C[col] + 16, y - 22]] : [[C[col] - 11, y + 12], [C[col] + 11, y - 12]], 'b')
const colRing = (at: At, col: Col, c: ChalkColor = 'd'): ChalkMark => ring(at, C[col], (L.s1 + L.b) / 2 + 4, 28, 78, c)
const note = (at: At, t: string, y: number, c: ChalkColor = 'd', s = 22): ChalkMark => write(at, t, 520, y, s, c)
const zeros = (at: At): ChalkMark[] => [digit(at, '0', 'h', 'b', L.a), digit(at, '0', 'th', 'b', L.a)]
const stack = (at: At): ChalkMark[] => [...heads(at), ...row(at, '12.5', L.a), ...row(at, '3.875', L.b), ...q([sign(at), rule(at)])]
const trade1 = (at: At): ChalkMark[] => [slash(at, 't'), small(at, '4', 't'), slash(at, 'h'), small(at, '9', 'h'), slash(at, 'th'), small(at, '10', 'th')]
const trade2 = (at: At): ChalkMark[] => [slash(at, 'O'), small(at, '1', 'O'), slash(at, 't', L.s1, false), small(at, '14', 't', L.s2)]
const trade3 = (at: At): ChalkMark[] => [slash(at, 'T'), small(at, '0', 'T'), slash(at, 'O', L.s1, false), small(at, '11', 'O', L.s2)]

// Colours: yellow = the answer and the point coming down, blue = the 0s put in and every trade, coral = places that
// do not match and the slip, dim = labels and the working.
export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // The ends don't match
  [
    ...row([0, 'last'], '12.5', L.a, 'w', C, 44, 2), ...row([0, 'digits'], '3.875', L.b), ...q([sign([0, 'digits']), rule([0, 'digits'])]),
    ring([1, 'tenths'], C.th, L.a, 22, 26, 'r'), write([1, 'tenths'], 'tenths', 515, L.a, 22, 'r'),
    ring([1, 'thousandths'], C.th, L.b, 22, 26, 'r'), write([1, 'thousandths'], 'thousandths', 515, L.b, 22, 'r'),
    write([2, 'different'], 'different places', 300, 310, 34, 'r'),
  ],
  // The big idea
  [
    ...heads([0, 'Line']), ...row([0, 'Line'], '12.5', L.a), ...row([0, 'points'], '3.875', L.b),
    { ...line([0, 'points'], [[C.P, 100], [C.P, 215]], 'd'), w: 2 },
    ring([0, 'empty'], (C.h + C.th) / 2, L.a, 80, 28, 'r'), ...zeros([0, '0']),
    sign([0, 'away']), rule([0, 'away']), write([0, 'whole'], '12500 − 3875', 300, 320, 30, 'd'),
  ],
  // Fill the empty places
  [
    ...stack([0, 'Give']), ring([0, 'three'], (C.h + C.th) / 2, L.a, 80, 28, 'r'), ...zeros([0, '12.500']),
    write([0, '12.500'], '12.5 = 12.500', 300, 300, 32),
    write([1, 'change'], 'same amount', 300, 350, 28, 'b'),
  ],
  // Take away from the right
  [
    ...stack([0, 'Start']), ...q(zeros([0, 'Start'])),
    colRing([0, '0'], 'th'), note([0, 'go'], '0 − 5 ?', 110, 'r'),
    slash([1, 'tenth'], 't'), small([1, 'tenth'], '4', 't'), slash([1, 'hundredths'], 'h'), small([1, 'hundredths'], '9', 'h'),
    slash([1, 'thousandths'], 'th'), small([1, 'thousandths'], '10', 'th'),
    note([2, '5'], '10 − 5 = 5', 150), digit([2, '5'], '5', 'th'), note([2, '2'], '9 − 7 = 2', 190), digit([2, '2'], '2', 'h'),
    colRing([3, 'Tenths'], 't'), note([3, 'go'], '4 − 8 ?', 230, 'r'), ...trade2([3, 'trade']), note([3, '6'], '14 − 8 = 6', 270), digit([3, '6'], '6', 't'),
  ],
  // Bring the point down
  [
    ...stack([0, 'Ones']), ...q([...zeros([0, 'Ones']), ...trade1([0, 'Ones']), ...trade2([0, 'Ones']),
      digit([0, 'Ones'], '5', 'th'), digit([0, 'Ones'], '2', 'h'), digit([0, 'Ones'], '6', 't')]),
    colRing([0, 'Ones'], 'O'), note([0, 'go'], '1 − 3 ?', 150, 'r'), ...trade3([0, 'ten']), note([0, '8'], '11 − 3 = 8', 190), digit([0, '8'], '8', 'O'),
    arrow([1, 'comes'], [C.P, L.b + 22], [C.P, L.ans - 4], 'y'), dot([1, 'comes'], C.P, L.ans + 10, 'y'),
    write([1, '8.625'], '8.625 km left', 300, 350, 36, 'y'),
  ],
  // One thing not to do
  (() => {
    const A: Cols = { T: 80, O: 115, P: 132, t: 150, h: 185, th: 220 }, B: Cols = { T: 370, O: 405, P: 422, t: 440, h: 475, th: 510 }
    const mini = (at: At, cols: Cols) => [...row(at, '12.5', 150, 'w', cols, 32), ...row(at, '3.875', 195, 'w', cols, 32),
      ...q([sign(at, cols, 195, 32), rule(at, 220, cols.T - 50, cols.th + 25)])]
    return [
      ...warn([0, 'mix']),
      ...mini([1, 'bring'], A),
      arrow([1, 'DOWN'], [A.h, 208], [A.h, 240], 'r'), arrow([1, 'DOWN'], [A.th, 208], [A.th, 240], 'r'),
      ...row([2, '8.775'], '8.775', 265, 'r', A, 32), cross([2, '8.775'], A.O - 22, 243, A.th - A.O + 44, 44),
      ...mini([2, 'Fill'], B), write([2, 'zeros'], '0', B.h, 150, 32, 'b'), write([2, 'zeros'], '0', B.th, 150, 32, 'b'),
      ...row([2, '8.625'], '8.625', 265, 'y', B, 32),
    ]
  })(),
]
