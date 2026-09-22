/**
 * g6m7-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 * The band's practice times: 2 kids at 10 minutes, 4 at 20, 5 at 30, 3 at 40, 1 at 50 (15 kids) — every ✕ drawn, one a kid.
 * The groups: 0–9: 3, 10–19: 6, 20–29: 8, 30–39: 4, 40–49: 2 — every bar at its true height.
 * Colours across t6: white = the ✕s and bars, yellow = the count that answers, coral = the mistake, dim = labels.
 */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, wash, ring, cross, clock } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const TIMES = ['10', '20', '30', '40', '50']
const COUNT = [2, 4, 5, 3, 1]

/** A plot of ✕s: the line at y, the times under it at xs, ✕s stacked `gap` apart. */
const plot = (xs: number[], y: number, gap: number, s = 24) => {
  const cy = (k: number) => y - gap * (k + 1) + gap * 0.2
  const x1 = (at: At, x: number, k: number, c: ChalkColor = 'w'): ChalkMark => {
    const h = gap * 0.32, m = cy(k)
    return q({ beat: at[0], at: at[1], c, d: `M${x - h} ${m - h} L${x + h} ${m + h} M${x + h} ${m - h} L${x - h} ${m + h}` })
  }
  return {
    cy, x1,
    axis: (at: At): ChalkMark[] => [
      q({ beat: at[0], at: at[1], d: `M${xs[0] - 45} ${y} H${xs[4] + 45}` + xs.map(x => ` M${x} ${y} v10`).join('') }),
      ...TIMES.map((t, i) => q(write(at, t, xs[i], y + 28, s, 'd'))),
    ],
    all: (at: At): ChalkMark[] => COUNT.flatMap((n, i) => Array.from({ length: n }, (_, k) => x1(at, xs[i], k))),
    /** The count over a stack. */
    top: (at: At, i: number, c: ChalkColor = 'y'): ChalkMark => write(at, String(COUNT[i]), xs[i], cy(COUNT[i] - 1) - gap * 0.95, 28, c),
  }
}
const BIG = plot([120, 210, 300, 390, 480], 340, 30)

// The bars: 0–9 … 40–49, 90 wide from x = 90, 22 px a kid, on the line at y = 345.
const HX = 90, HW = 90, HY = 345, HU = 22
const GROUPS = ['0–9', '10–19', '20–29', '30–39', '40–49'], BARS = [3, 6, 8, 4, 2]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // A long list is slow
  [
    ...['Ana · 30', 'Ben · 20', 'Cam · 40', 'Dee · 30'].map((t, i) => q(write([0, 'list'], t, 110, 45 + 38 * i, 26, 'd'))),
    write([0, 'time'], '+ 11 more kids', 110, 200, 24, 'd'),
    clock([1, 'slow'], 300, 110, 26), write([1, 'lose'], 'lost count?', 450, 110, 28, 'r'),
    ...(() => { const S = plot([160, 230, 300, 370, 440], 350, 22, 20); return [...S.axis([2, 'picture']), ...S.all([2, 'picture'])] })(),
  ],
  // The big idea: one ✕ = one thing; one bar counts its whole group
  [
    ...(() => {
      const S = plot([110, 210], 330, 30)
      return [
        q({ beat: 0, at: 'Each', d: 'M50 330 H270 M110 330 v10 M210 330 v10' }),
        q(write([0, 'Each'], '30', 110, 358, 24, 'd')), q(write([0, 'Each'], '40', 210, 358, 24, 'd')),
        ...[0, 1, 2, 3, 4].map(k => S.x1([0, 'Each'], 110, k)), ...[0, 1, 2].map(k => S.x1([0, 'Each'], 210, k)),
        ring([0, 'stands'], 110, S.cy(0), 18, 16, 'y'), write([0, 'thing'], '1 ✕ = 1 thing', 160, 90, 28, 'y'),
      ]
    })(),
    line([0, 'bar'], [[330, 330], [560, 330]]), box([0, 'bar'], 395, 330 - 8 * 20, 100, 8 * 20),
    write([0, 'counts'], '8', 445, 145, 30, 'y'), write([0, 'group'], '20–29', 445, 358, 24, 'd'),
    wash([0, 'everything'], 395, 170, 100, 160, 'y'),
  ],
  // Count the ✕s
  [
    ...BIG.axis([0, 'Look']), ...BIG.all([0, 'Look']),
    ring([0, 'kid'], 120, BIG.cy(0), 18, 16, 'y'), write([0, 'kid'], '1 ✕ = 1 kid', 300, 60, 30, 'y'),
    BIG.top([1, '5'], 2), BIG.top([1, '3'], 3), BIG.top([1, '1'], 4),
  ],
  // Add the stacks you need
  [
    ...BIG.axis([0, 'question']), ...BIG.all([0, 'question']),
    write([0, 'minutes'], '30 minutes or more', 150, 45, 26, 'd'),
    wash([0, 'more'], 255, 150, 270, 235, 'y'),
    ring([0, 'Yes'], 300, 368, 24, 18, 'y'),
    BIG.top([1, '30'], 2), BIG.top([1, '40'], 3), BIG.top([1, '50'], 4),
    write([2, '5'], '5 + 3 + 1', 380, 100, 30), write([2, '9'], '= 9 kids', 510, 100, 30, 'y'),
  ],
  // Bars for groups
  [
    q({ beat: 0, at: 'different', w: 2, d: 'M40 85 H560' }),
    ...[4, 12, 17, 23, 27, 33, 38, 45].map(t => {
      const x = 60 + t * 10
      return [q({ beat: 0, at: 'different', d: `M${x - 7} 63 L${x + 7} 77 M${x + 7} 63 L${x - 7} 77` }), q(write([0, 'different'], String(t), x, 107, 20, 'd'))]
    }).flat(),
    q({ beat: 1, at: 'groups', d: `M${HX} ${HY} H${HX + 5 * HW + 10} M${HX} ${HY} V${HY - 8 * HU - 10}` + [2, 4, 6, 8].map(n => ` M${HX - 8} ${HY - n * HU} h8`).join('') }),
    ...[0, 2, 4, 6, 8].map(n => q(write([1, 'groups'], String(n), HX - 25, HY - n * HU, 20, 'd'))),
    ...GROUPS.map((g, i) => q(write([1, 'groups'], g, HX + HW * i + HW / 2, HY + 25, 20, 'd'))),
    ...BARS.map((n, i) => q(box([1, 'bar'], HX + HW * i, HY - n * HU, HW, n * HU))),
    wash([2, '20–29'], HX + HW * 2, HY - 8 * HU, HW, 8 * HU, 'y'),
    { ...line([2, '8'], [[HX, HY - 8 * HU], [HX + HW * 2, HY - 8 * HU]], 'y', 2) },
    write([2, 'kids'], '8 kids', HX + HW * 2.5, HY - 8 * HU - 22, 26, 'y'),
  ],
  // One thing not to do
  (() => {
    const S = plot([140, 220, 300, 380, 460], 330, 24, 22)
    return [
      ...warn([0, 'mix']),
      ...S.axis([1, "Don't"]), ...S.all([1, "Don't"]),
      ring([1, 'NUMBERS'], 380, 356, 105, 20, 'r'),
      write([2, '3'], '3 kids?', 120, 150, 30, 'r'), cross([2, 'Count'], 70, 128, 100, 44),
      write([2, '9'], '9 kids', 480, 150, 30, 'y'),
    ]
  })(),
]
