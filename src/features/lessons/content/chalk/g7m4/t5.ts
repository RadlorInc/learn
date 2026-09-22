/** g7m4-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Two roads crossing at (CX, CY), each 25° off level, so the left/right angles are 50° and top/bottom 130°.
 *  Yellow is the 50° pair / the answer, blue the 130° pair, coral the mix-up. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, cross, ring } from '../../../chalk'

type At = [number, string?]
const CX = 190, CY = 205, R = 165
const rad = (deg: number) => (deg * Math.PI) / 180
const pt = (deg: number, r = R): [number, number] => [Math.round(CX + r * Math.cos(rad(deg))), Math.round(CY - r * Math.sin(rad(deg)))]
/** Road A runs 25° → 205°, road B runs −25° → 155°. */
const roadA = (at: At, c: ChalkColor = 'w') => line(at, [pt(205), pt(25)], c)
const roadB = (at: At, c: ChalkColor = 'w') => line(at, [pt(155), pt(-25)], c)
const roads = (at: At): ChalkMark[] => [roadA(at), roadB(at)]
/** An arc inside the angle from a1 to a2 (degrees, counter-clockwise). */
const arc = ([beat, at]: At, a1: number, a2: number, c: ChalkColor, r = 42): ChalkMark => {
  const [x1, y1] = pt(a1 + 7, r), [x2, y2] = pt(a2 - 7, r)   // a gap at each road, so four arcs never read as a circle
  return { beat, at, c, d: `M${x1} ${y1} A${r} ${r} 0 0 0 ${x2} ${y2}` }
}
const RIGHT: [number, number] = [-25, 25], TOP: [number, number] = [25, 155], LEFT: [number, number] = [155, 205], BOTTOM: [number, number] = [205, 335]
/** The angle's size, written inside it. */
const lab = (at: At, where: 'r' | 'l' | 't' | 'b', t: string, c: ChalkColor = 'w'): ChalkMark => {
  const p = { r: [CX + 88, CY], l: [CX - 88, CY], t: [CX, CY - 72], b: [CX, CY + 72] }[where]
  return write(at, t, p[0], p[1], 28, c)
}
/** The right-hand column: working, one line under another. */
const col = (at: At, i: number, t: string, c: ChalkColor = 'w', s = 30): ChalkMark => write(at, t, 470, 90 + 60 * i, s, c)

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Four angles at one crossing
  [
    ...roads([0, 'cross']),
    ...([[CX + 42, CY, '1'], [CX, CY - 40, '2'], [CX - 42, CY, '3'], [CX, CY + 40, '4']] as const).map(([x, y, t]) => write([0, 'four'], t, x, y, 20, 'd')),
    lab([1, '50°'], 'r', '50°'), lab([1, 'across'], 'l', '?', 'y'),
    roadB([2, 'straight'], 'y'), col([2, '180°'], 1, 'a straight line', 'd', 24), col([2, '180°'], 2, '= 180°', 'y', 34),
  ],
  // The big idea: across is equal
  [
    ...roads([0, 'cross']),
    arc([0, 'across'], ...RIGHT, 'y', 70), arc([0, 'across'], ...LEFT, 'y', 70),
    arc([0, 'equal'], ...TOP, 'b', 30), arc([0, 'equal'], ...BOTTOM, 'b', 30),
    arc([0, 'equal'], ...TOP, 'b', 38), arc([0, 'equal'], ...BOTTOM, 'b', 38),
  ],
  // Next door makes a straight line
  [
    ...roads([0, 'Look']), lab([0, '50°'], 'r', '50°'), arc([0, 'top'], ...TOP, 'b'),
    roadB([1, 'straight'], 'y'), col([1, '180°'], 0, '50 + ? = 180'),
    col([2, '130'], 1, '180 − 50 = 130', 'y'), lab([2, 'angle'], 't', '130°', 'b'),
  ],
  // Across comes out the same
  [
    ...roads([0, 'left']), lab([0, 'left'], 'r', '50°'), lab([0, 'left'], 't', '130°', 'b'), arc([0, 'left'], ...LEFT, 'y'),
    roadA([0, 'road'], 'y'),
    col([1, '180°'], 0, '130 + ? = 180'),
    col([2, '50'], 1, '180 − 130 = 50', 'y'), lab([2, 'angle'], 'l', '50°', 'y'),
    ring([3, 'same'], CX - 88, CY, 34, 22), ring([3, 'across'], CX + 88, CY, 34, 22), col([3, 'across'], 3, '50° = 50°', 'y', 34),
  ],
  // Copy it across
  [
    ...roads([0, 'faster']), lab([0, 'Yes'], 'r', '50°'), lab([0, 'Yes'], 't', '130°', 'b'),
    lab([1, 'both'], 'l', '50°', 'y'), col([1, 'both'], 1, 'left = right', 'y'),
    lab([2, 'both'], 'b', '130°', 'b'), col([2, 'both'], 2, 'top = bottom', 'b'),
  ],
  // One thing not to do
  [
    line([0, 'mix'], [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write([0, 'mix'], '!', 300, 68, 36, 'r'),
    write([1, '180'], '180 − 50 = 130', 300, 165, 36), cross([1, 'NEXT'], 344, 142, 64, 46),
    write([1, 'door'], '130° is next door', 300, 222, 24, 'd'),
    write([2, 'copies'], 'across from 50°:  50°', 300, 300, 38, 'y'),
  ],
]
