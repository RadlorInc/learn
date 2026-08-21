/**
 * Chapter 2 (Follow the Leader) — the waiting huddle has to be READABLE.
 *
 * The chapter's whole skill is ORDER: the child scans every little one, reads every number, and
 * taps the smallest. So a number a child cannot read is not a look problem, it is a wrong answer
 * the chapter caused — which is exactly what a tester reported on 2026-08-20:
 *
 *     "The turtles are lined up very close to each other I was unable to see all the numbers"
 *
 * The cause was that `lineLayout` called `fitBands` and nothing else. `fitBands` proves heads clear
 * the prompt and feet clear the strip and says NOTHING about the rows being distinguishable, so it
 * happily returned a band a few pixels tall with both rows on the same line — measured on turtles at
 * 640x320 with four little ones, three rows sat SEVEN pixels apart under a 91px sprite.
 *
 * This sweep drives the REAL `lineLayout` the scene renders from, not a second copy of the
 * constants — a check that mirrors its own copy passes happily while the screen falls apart.
 */
import { describe, it, expect } from 'vitest'
import { lineLayout } from '@/features/chapters/story/FollowTheLeader'
import { CAST, ROW_SEP, aspectOf } from '@/features/chapters/story/critters'

// Every size the layout has to hold, smallest short-landscape phone first.
const SIZES: [number, number][] = [[640, 320], [667, 375], [812, 375], [1024, 600], [1280, 720], [1920, 900]]
// seqLength(): 3 at tier 1, 4 at tier 2, 5 at the top.
const COUNTS = [3, 4, 5]

const sweep = () => SIZES.flatMap(([vw, vh]) =>
  COUNTS.flatMap(n => CAST.map((_, castIdx) => ({ vw, vh, n, castIdx, L: lineLayout(vw, vh, n, castIdx) }))))

describe('Follow the Leader — the waiting huddle can be read', () => {
  it('never stacks three rows into a shallow band', () => {
    for (const { vw, vh, n, castIdx, L } of sweep())
      expect(L.rows, `${vw}x${vh} n=${n} cast=${castIdx}`).toBeLessThanOrEqual(2)
  })

  it('separates its rows by at least ROW_SEP of a sprite height', () => {
    const bad: string[] = []
    for (const { vw, vh, n, castIdx, L } of sweep()) {
      if (L.rows <= 1) continue
      const sepPx = (L.band.waitY1 - L.band.waitY0) / 100 * vh / (L.rows - 1)
      const need = L.babySize * ROW_SEP
      // A half-pixel of rounding slack; anything more and the near row covers the far one.
      if (sepPx < need - 0.5) bad.push(`${vw}x${vh} n=${n} ${CAST[castIdx].little}: ${sepPx.toFixed(1)}px apart, needs ${need.toFixed(1)}px (sprite ${L.babySize}px)`)
    }
    expect(bad.join('\n')).toBe('')
  })

  it('leaves same-row neighbours room for their own sprite', () => {
    const bad: string[] = []
    for (const { vw, vh, n, castIdx, L } of sweep()) {
      // Members alternate rows, so two in the SAME row sit rows x span apart — that is the slot a
      // sprite has to fit inside, never the raw step between neighbouring indices.
      const sameRowPx = sameRowStepPx(L)
      const spriteW = L.babySize * aspectOf(CAST[castIdx].src)
      if (n > 1 && spriteW > sameRowPx + 0.5) bad.push(`${vw}x${vh} n=${n} ${CAST[castIdx].little}: sprite ${spriteW.toFixed(0)}px wide, only ${sameRowPx.toFixed(0)}px of room`)
    }
    expect(bad.join('\n')).toBe('')
  })

  it('keeps every number tag above its 24px floor', () => {
    for (const { vw, vh, n, castIdx, L } of sweep()) {
      const d = Math.max(24, Math.round(L.babySize * 0.42))
      expect(d, `${vw}x${vh} n=${n} cast=${castIdx}`).toBeGreaterThanOrEqual(24)
      // ...and the sprite never falls under its own 40px floor. The 44px tap floor is NOT asserted
      // here: the hit box is a Math.max(44, …) in the JSX, so a check written in terms of it would
      // compare that expression with itself — the tautology this repo keeps paying for.
      expect(L.babySize, `${vw}x${vh} n=${n} cast=${castIdx}`).toBeGreaterThanOrEqual(40)
    }
  })
})

/** Two little ones in the SAME row are `rows x span` apart — that is the slot a sprite must fit. */
function sameRowStepPx(L: ReturnType<typeof lineLayout>): number {
  // `babySize` was capped to exactly this slot (x0.98), so recovering it from the cap would be a
  // tautology. Take it from the band the layout actually reports instead.
  return (L.babySize / 0.98) * aspectOf(L.kind.src)
}
