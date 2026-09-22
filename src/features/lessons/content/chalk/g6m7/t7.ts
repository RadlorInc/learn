/**
 * g6m7-t7's chalkboards: index = screen index (0 is Screen 1, which has none).
 * The prize spinner: 8 equal parts, clockwise from the top red, blue, red, green, blue, red, yellow, blue
 * (3 red, 3 blue, 1 green, 1 yellow), each part named in it. Colours across t7: white = the spinner and all the parts,
 * yellow = the red parts, the ways to win (and the chance that answers), coral = the mistake, dim = labels.
 */
import type { ChalkMark } from '../../../chalk'
import { write, line, ring, cross, arrow } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const PARTS = ['red', 'blue', 'red', 'green', 'blue', 'red', 'yellow', 'blue']
const RED = [0, 2, 5]
const pt = (cx: number, cy: number, r: number, deg: number): [number, number] =>
  [Math.round(cx + r * Math.cos((deg * Math.PI) / 180)), Math.round(cy + r * Math.sin((deg * Math.PI) / 180))]
const a0 = (i: number) => -90 + 45 * i

/** The spinner at (cx, cy): the circle, its 8 cuts, and each part's colour written in it. */
const spinner = (cx: number, cy: number, r: number) => ({
  draw: (at: At): ChalkMark[] => [
    q({ beat: at[0], at: at[1], d: `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`
      + PARTS.map((_, i) => ` M${cx} ${cy} L${pt(cx, cy, r, a0(i)).join(' ')}`).join('') }),
    ...PARTS.map((p, i) => { const [x, y] = pt(cx, cy, r * 0.66, a0(i) + 22.5); return q(write(at, p, x, y, 20, 'd')) }),
  ],
  /** Part i filled with a wash. */
  part: (at: At, i: number, c: 'y' | 'r' | 'b' = 'y'): ChalkMark => {
    const [x1, y1] = pt(cx, cy, r, a0(i)), [x2, y2] = pt(cx, cy, r, a0(i + 1))
    return q({ beat: at[0], at: at[1], c, wash: true, d: `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2} Z` })
  },
  /** A number just outside part i. */
  num: (at: At, i: number, t: string): ChalkMark => { const [x, y] = pt(cx, cy, r + 24, a0(i) + 22.5); return write(at, t, x, y, 28, 'y') },
  pointer: (at: At): ChalkMark => arrow(at, [cx, cy], pt(cx, cy, r * 0.42, a0(1) + 22.5)),
})

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Win or lose is not half and half
  (() => {
    const S = spinner(420, 215, 140)
    return [
      write([0, 'win'], 'win', 90, 80, 34, 'y'), write([0, 'lose'], 'or lose', 190, 80, 34),
      write([1, '1/2'], '1/2 ?', 140, 170, 40), cross([1, 'No'], 90, 140, 110, 60),
      ...S.draw([2, 'spinner']), ...RED.map(i => S.part([2, 'Red'], i)),
    ]
  })(),
  // The big idea: ways it can happen over all the ways
  (() => {
    const S = spinner(170, 210, 140)
    return [
      ...S.draw([0, 'chance']), ...RED.map(i => S.part([0, 'happen'], i)),
      write([0, 'ways'], 'ways it', 450, 120, 28, 'y'), write([0, 'happen'], 'can happen', 450, 160, 28, 'y'),
      line([0, 'over'], [[350, 200], [550, 200]], 'w', 4),
      write([0, 'all'], 'all the ways', 450, 245, 28),
    ]
  })(),
  // Count the ways to win
  (() => {
    const S = spinner(210, 205, 145)
    return [
      ...S.draw([0, 'First']),
      S.part([1, '1'], 0), S.num([1, '1'], 0, '1'),
      S.part([1, '2'], 2), S.num([1, '2'], 2, '2'),
      S.part([1, '3'], 5), S.num([1, '3'], 5, '3'),
      write([1, 'ways'], '3 ways to win', 480, 205, 28, 'y'),
    ]
  })(),
  // Count all the ways
  (() => {
    const S = spinner(190, 205, 150)
    return [
      ...S.draw([0, 'part']), S.pointer([0, 'arrow']),
      write([1, 'red'], '3 red', 470, 70, 28), write([1, 'blue'], '3 blue', 470, 120, 28),
      write([1, 'green'], '1 green', 470, 170, 28), write([1, 'yellow'], '1 yellow', 470, 220, 28),
      line([1, '8'], [[400, 252], [540, 252]], 'd', 2), write([1, '8'], '8 parts', 470, 290, 30, 'y'),
    ]
  })(),
  // Write it as a fraction
  [
    line([0, 'fraction'], [[250, 200], [350, 200]], 'w', 4),
    write([0, 'win'], 'ways to win', 130, 145, 26, 'd'), write([0, 'top'], '3', 300, 150, 50, 'y'),
    write([1, 'All'], 'all the ways', 130, 255, 26, 'd'), write([1, 'bottom'], '8', 300, 255, 50),
    write([2, 'red'], 'chance of red =', 250, 350, 32), write([2, '3/8'], '3/8', 420, 350, 40, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'red'], 'red', 70, 165, 24, 'd'), write([1, 'red'], '3', 170, 165, 44, 'r'),
    line([1, 'over'], [[140, 200], [200, 200]], 'r', 4),
    write([1, 'NOT'], 'not red', 70, 238, 24, 'd'), write([1, 'NOT'], '5', 170, 238, 44, 'r'),
    cross([2, '3/5'], 125, 135, 90, 130),
    write([2, 'Red'], '3', 420, 165, 44, 'y'), line([2, 'over'], [[390, 200], [450, 200]], 'y', 4),
    write([2, 'every'], 'all parts', 530, 238, 24, 'd'), write([2, '8'], '8', 420, 238, 44, 'y'),
    write([2, 'Red'], 'red', 520, 165, 24, 'd'),
  ],
]
