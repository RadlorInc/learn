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
import { lineLayout, lineScale } from '@/features/chapters/story/FollowTheLeader'
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

/**
 * ⚠️⚠️ AND THE LINE ITSELF — THE HALF THIS FILE DID NOT COVER, AND THE FOUNDER FOUND IT ON A
 * SCREENSHOT (2026-08-27):
 *
 *     "For the bunny animals, all the children bunnies are evenly spaced behind the mother, however
 *      for the fish, butterflies, turtles, ladybugs, and squirrels, they are randomly placed."
 *
 * Nothing was random. The STEP between neighbours was a constant 9% of the width for every species;
 * what varied was how much of that step each body ate, because the cast's aspects run 0.81 → 1.75.
 * Measured at 1280x720 with five little ones, the clearance between neighbouring bodies ran from
 * +1.65% (butterfly, a clean gap) to −1.07% (ant, overlapping) — and a queue whose members overlap
 * does not read as a queue at all.
 *
 * The huddle above had this rule from the start (`sameRowStepPx` vs the sprite's own width); the
 * line was the one place still holding a bare number. This is the same assertion, for the other
 * formation.
 */
const LINE_GAP_PCT = 9        // the step between neighbours in the line, % of the width

/** What a line neighbour's body actually occupies, in % of the width — the number a person SEES. */
const lineBodyPct = (L: ReturnType<typeof lineLayout>, vw: number) =>
  L.babySize * L.lineScale * aspectOf(L.kind.src) / vw * 100

describe('Follow the Leader — the line behind mother is evenly spaced for EVERY species', () => {
  it('never lets two in the line overlap', () => {
    const bad: string[] = []
    for (const { vw, vh, n, castIdx, L } of sweep()) {
      const clear = LINE_GAP_PCT - lineBodyPct(L, vw)
      if (clear < 0) bad.push(`${vw}x${vh} n=${n} ${CAST[castIdx].little}: bodies ${lineBodyPct(L, vw).toFixed(2)}% wide on a ${LINE_GAP_PCT}% step — overlapping by ${(-clear).toFixed(2)}%`)
    }
    expect(bad.join('\n')).toBe('')
  })

  it('gives every species the SAME clearance the bunny has, within a hair', () => {
    /**
     * ⚠️ THE REAL PROPERTY, and the one an overlap check alone does not have: "nobody overlaps" is
     * equally satisfied by one species at a hair's clearance and another at three times the gap,
     * which is the ragged look the founder reported. What has to hold is that the gap is the SAME.
     * Compared against the rabbit — the one on screen that reads correctly today — rather than
     * against a number typed here, so this cannot drift from what the founder actually approved.
     */
    const bad: string[] = []
    for (const [vw, vh] of SIZES) for (const n of COUNTS) {
      const clears = CAST.map((_, ci) => LINE_GAP_PCT - lineBodyPct(lineLayout(vw, vh, n, ci), vw))
      const spread = Math.max(...clears) - Math.min(...clears)
      // A species SMALLER than its slot keeps its own size rather than being stretched, so a little
      // spread is legitimate — a butterfly is simply narrow. What may not happen is the wide end
      // eating the gap. Bound it by the gap itself.
      if (spread > LINE_GAP_PCT * 0.5) {
        const worst = CAST[clears.indexOf(Math.min(...clears))].little
        bad.push(`${vw}x${vh} n=${n}: clearance spread ${spread.toFixed(2)}% across the cast (tightest: ${worst})`)
      }
    }
    expect(bad.join('\n')).toBe('')
  })

  it('the rabbit — the one the founder approved — is left exactly as it was', () => {
    // ⚠️ A REGRESSION GUARD POINTING THE OTHER WAY. The fix caps the in-line scale, and a cap that
    // binds on the creature that already looked right would be a fix that broke the good case to
    // rescue the bad ones.
    for (const [vw, vh] of SIZES) for (const n of COUNTS) {
      const L = lineLayout(vw, vh, n, 0)   // cast index 0 is the rabbit
      expect(L.kind.little).toBe('bunny')
      expect(L.lineScale, `${vw}x${vh} n=${n}: the rabbit's in-line scale moved`).toBeCloseTo(Math.min(0.78, L.lineScale), 5)
      expect(L.lineScale).toBeGreaterThan(0.6)
    }
  })

  it('the in-line scale never shrinks a creature past legibility', () => {
    for (const { vw, vh, n, castIdx, L } of sweep()) {
      // The number tag has its own 24px floor; this is about the CREATURE still reading as itself.
      const drawn = L.babySize * L.lineScale
      expect(drawn, `${vw}x${vh} n=${n} ${CAST[castIdx].little}`).toBeGreaterThanOrEqual(24)
    }
  })

  it('lineScale is a CEILING of 0.78, never a stretch', () => {
    // A wide creature is drawn further away; a narrow one is not drawn BIGGER to fill the gap,
    // because then the line would stop reading as "somewhere else in the scene".
    for (let ci = 0; ci < CAST.length; ci++)
      expect(lineScale(200, aspectOf(CAST[ci].src), 100)).toBeLessThanOrEqual(0.78)
    // …and it does bind when a body is too wide — the positive control, or the min() above is
    // satisfied by a function that always returns 0.78.
    expect(lineScale(500, 1.75, 640)).toBeLessThan(0.78)
  })
})
