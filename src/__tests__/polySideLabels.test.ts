/**
 * A shape's side label stands clear of the shape's own lines. A paid tester (g6m6-t3 practice, the L shape): "some
 * measurements are not visible properly because the figure goes through them". The labels were pushed away from the
 * shape's centre, which on an L shape's inner corner pushes them onto the shape.
 * Reads what the picture draws (the SVG's <path> and <text>), not the placement code; the label box is a deliberately
 * small estimate of the text (0.4 em a character, 0.6 em tall), written here and not taken from the renderer.
 */
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Pic } from '@/features/lessons/Pictures'
import { MODULES } from '@/features/lessons/modules'
import { LADDERS } from '@/features/lessons/ladders'
import { rng } from '@/features/lessons/adaptive'
import type { Picture } from '@/features/lessons/script'

type Pt = [number, number]
type Poly = Extract<Picture, { kind: 'poly' }>

/** The outline of each shape (its first <path>, "M x y L x y … Z") and every <text> with its place and words. */
function drawn(p: Picture) {
  const svg = renderToStaticMarkup(createElement(Pic, { p }))
  const outlines = [...svg.matchAll(/<path d="M ([^"]*?) Z"[^>]*stroke-width="5"/g)]
    .map(m => m[1].split(' L ').map(s => s.trim().split(/\s+/).map(Number) as Pt))
  const texts = [...svg.matchAll(/<text x="([^"]+)" y="([^"]+)" font-size="([^"]+)"[^>]*>(.*?)<\/text>/g)]
    .map(m => ({ x: +m[1], y: +m[2], s: +m[3], t: m[4].replace(/<[^>]+>/g, '') }))
  return { outlines, texts }
}
/** Does the segment a–b cross or touch the box? (Liang–Barsky clip.) */
function hits(a: Pt, b: Pt, x0: number, y0: number, x1: number, y1: number): boolean {
  let t0 = 0, t1 = 1
  const dx = b[0] - a[0], dy = b[1] - a[1]
  for (const [p, q] of [[-dx, a[0] - x0], [dx, x1 - a[0]], [-dy, a[1] - y0], [dy, y1 - a[1]]]) {
    if (p === 0) { if (q < 0) return false; continue }
    const r = q / p
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r } else { if (r < t0) return false; if (r < t1) t1 = r }
  }
  return true
}
/** Every side label (of a closed shape) whose box a line of its own shape runs through. */
function crossed(p: Poly): string[] {
  const { outlines, texts } = drawn(p)
  const bad: string[] = []
  p.shapes.forEach((sh, si) => {
    if (sh.open || !sh.sides) return
    const edges = outlines[si].map((q, i, all) => [q, all[(i + 1) % all.length]] as [Pt, Pt])
    for (const lab of sh.sides.filter((l): l is string => !!l)) {
      const tx = texts.find(t => t.t === lab)
      if (!tx) { bad.push(`${lab}: not drawn`); continue }
      const hw = lab.length * tx.s * 0.2, hh = tx.s * 0.3
      if (edges.some(([a, b]) => hits(a, b, tx.x - hw, tx.y - hh, tx.x + hw, tx.y + hh))) bad.push(lab)
    }
  })
  return bad
}

describe('poly side labels', () => {
  it('an L shape: every side label, the two inner ones too, is off the lines (written out by hand)', () => {
    // The tester's shape: 8 across, 3 up, then in to 5, up to 8 tall. Inner sides: "3 ft" across and "5 ft" up.
    const L: Poly = { kind: 'poly', shapes: [{ pts: [[0, 0], [8, 0], [8, 3], [5, 3], [5, 8], [0, 8]],
      sides: ['8 ft', '3 ft', '3 ft', '5 ft', '5 ft', '8 ft'], tone: 1 }] }
    expect(drawn(L).texts.map(t => t.t)).toEqual(['8 ft', '3 ft', '3 ft', '5 ft', '5 ft', '8 ft'])
    expect(crossed(L)).toEqual([])
  })

  it('every lesson and ladder poly picture keeps its side labels off its own lines', () => {
    const pics: [string, Poly][] = []
    for (const l of MODULES.flatMap(m => m.lessons)) {
      const all = [...l.screens.flatMap(s => s.pictures), l.turn.picture, l.turn.twin.picture, ...(l.practice ?? []).map(q => q.problem.picture)]
      all.forEach((p, i) => { if (p?.kind === 'poly') pics.push([`${l.id} #${i}`, p]) })
      LADDERS[l.id]?.forEach((lv, k) => { for (let seed = 1; seed <= 20; seed++) { const p = lv.make(rng(seed)).picture; if (p?.kind === 'poly') pics.push([`${l.id} L${k + 1} seed ${seed}`, p]) } })
    }
    expect(pics.length).toBeGreaterThan(100)
    const bad = pics.map(([where, p]) => [where, crossed(p)] as const).filter(([, b]) => b.length).map(([w, b]) => `${w}: ${b.join(', ')}`)
    expect(bad).toEqual([])
  })
})
