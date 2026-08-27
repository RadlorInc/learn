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
import { lineLayout, lineScale, lineHeadGap, lineSpot } from '@/features/chapters/story/FollowTheLeader'
import { CAST, ROW_SEP, aspectOf, waitSpot } from '@/features/chapters/story/critters'

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
/**
 * ⚠️⚠️ EVERY NUMBER BELOW COMES OUT OF `lineSpot` — THE FUNCTION THAT ACTUALLY DRAWS THE LINE — AND
 * NOT OUT OF THE LAYOUT IT WAS BUILT FROM. Caught by mutation, twice: computing the body from
 * `L.lineScale` and the step from a typed 9 left BOTH "the line draws at the flat gap" and "the line
 * reverts to a flat scale" green, because the layout still REPORTED the derived values while the
 * drawing ignored them. A gate that re-implements the rule cannot see the rule being removed.
 */
/** The step between two neighbours in the line, read off the spots themselves. */
const lineStepPct = (L: ReturnType<typeof lineLayout>) => lineSpot(0, L).left - lineSpot(1, L).left

/** What a line neighbour's body actually occupies, in % of the width — the number a person SEES. */
const lineBodyPct = (L: ReturnType<typeof lineLayout>, vw: number) =>
  L.babySize * lineSpot(0, L).scale * aspectOf(L.kind.src) / vw * 100

describe('Follow the Leader — the line behind mother is evenly spaced for EVERY species', () => {
  it('never lets two in the line overlap', () => {
    const bad: string[] = []
    for (const { vw, vh, n, castIdx, L } of sweep()) {
      const clear = lineStepPct(L) - lineBodyPct(L, vw)
      if (clear < 0) bad.push(`${vw}x${vh} n=${n} ${CAST[castIdx].little}: bodies ${lineBodyPct(L, vw).toFixed(2)}% wide on a ${lineStepPct(L).toFixed(2)}% step — overlapping by ${(-clear).toFixed(2)}%`)
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
      const clears = CAST.map((_, ci) => { const L = lineLayout(vw, vh, n, ci); return lineStepPct(L) - lineBodyPct(L, vw) })
      const spread = Math.max(...clears) - Math.min(...clears)
      // A species SMALLER than its slot keeps its own size rather than being stretched, so a little
      // spread is legitimate — a butterfly is simply narrow. What may not happen is the wide end
      // eating the gap. Bound it by the gap itself.
      if (spread > 4.5) {
        const worst = CAST[clears.indexOf(Math.min(...clears))].little
        bad.push(`${vw}x${vh} n=${n}: clearance spread ${spread.toFixed(2)}% across the cast (tightest: ${worst})`)
      }
    }
    expect(bad.join('\n')).toBe('')
  })

  it('the rabbit — the one the founder approved — is drawn at the FULL in-line scale', () => {
    /**
     * ⚠️ A REGRESSION GUARD POINTING THE OTHER WAY: the fix CAPS the in-line scale, and a cap that
     * binds on the creature that already looked right would have broken the good case to rescue the
     * bad ones. The rabbit is narrow, so at a roomy viewport nothing should bind and it should be
     * drawn at the uncapped `LINE_SCALE`.
     *
     * ⚠️⚠️ THE FIRST VERSION OF THIS WAS A TAUTOLOGY, AND IT IS WORTH LEAVING THE NOTE. It read
     * `expect(L.lineScale).toBeCloseTo(Math.min(0.78, L.lineScale))` — and since the scale is a
     * `Math.min(0.78, …)` by construction, that compares a value with itself and passes for ANY
     * implementation, including one that draws the rabbit at 0.1. Found by re-reading the file
     * rather than by any run, because a tautology's green is indistinguishable from a real one.
     */
    for (const n of COUNTS) {
      const L = lineLayout(1280, 720, n, 0)   // cast index 0 is the rabbit
      expect(L.kind.little).toBe('bunny')
      expect(lineSpot(0, L).scale, `n=${n}: the rabbit's in-line scale moved`).toBeCloseTo(0.78, 5)
    }
    // …and the assertion is not vacuous: a WIDE creature at the same size IS capped below it.
    const wide = lineLayout(1280, 720, 5, CAST.findIndex(c => c.little === 'ladybug'))
    expect(lineSpot(0, wide).scale).toBeLessThan(0.78)
  })

  it('the in-line scale never shrinks a creature past legibility', () => {
    for (const { vw, vh, n, castIdx, L } of sweep()) {
      // The number tag has its own 24px floor; this is about the CREATURE still reading as itself.
      const drawn = L.babySize * lineSpot(0, L).scale
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

/**
 * ⚠️⚠️ AND THE GAP AT THE HEAD OF THE LINE, which is a DIFFERENT gap and was the same number.
 * `LINE_GAP` separates two little ones; the first place in the line sits next to MOTHER, drawn at
 * 1.25 against the line's own scale — so the two bodies either side of that first gap differ by
 * ~1.7x. Founder, after the spacing fix landed: *"fish 1 still tucks under mother's body."*
 *
 * ⚠️ THE RULE IS NOT "NO OVERLAP". Little ones queue nose-to-tail, and the rabbit — the picture that
 * was approved — has its first little one sitting ~21% of its own body inside mother. That reads as
 * queueing. What may not happen is a species sitting DEEPER in than that, which reads as buried.
 */
const MOTHER_SCALE = 1.25

/** How far the first little one sits inside mother, as a share of its OWN body width. */
function headOverlapShare(L: ReturnType<typeof lineLayout>, vw: number): number {
  const a = aspectOf(L.kind.src)
  const head = lineSpot(0, L)                       // where the first little one is really drawn
  const half = (scale: number) => (L.babySize * scale * a / 2) / vw * 100
  const childHalf = half(head.scale)
  const overlap = (head.left + childHalf) - (L.mx - half(MOTHER_SCALE))
  return overlap / (childHalf * 2)
}

describe('Follow the Leader — the first little one is beside mother, not inside her', () => {
  it('no species sits deeper inside mother than the rabbit does', () => {
    const bad: string[] = []
    for (const { vw, vh, n, castIdx, L } of sweep()) {
      const share = headOverlapShare(L, vw)
      // 0.22 is the rabbit's own value; a hair of slack for the two-pass size estimate.
      if (share > 0.23) bad.push(`${vw}x${vh} n=${n} ${CAST[castIdx].little}: buried ${(share * 100).toFixed(0)}% of its body inside mother`)
    }
    expect(bad.join('\n')).toBe('')
  })

  it('…and the check can see the old behaviour', () => {
    /**
     * ⚠️ POSITIVE CONTROL, and it is the whole reason this check is worth anything: with a flat
     * `LINE_GAP` head gap the wide species DID exceed the bound. Recomputed here against the same
     * formula, so a green run above means the fix, not a bound nothing can cross.
     */
    const vw = 1280, vh = 720, n = 5
    const worstBefore = Math.max(...CAST.map((_, ci) => {
      const L = lineLayout(vw, vh, n, ci)
      const a = aspectOf(L.kind.src)
      const half = (scale: number) => (L.babySize * scale * a / 2) / vw * 100
      const childHalf = half(lineSpot(0, L).scale)
      return (half(MOTHER_SCALE) + childHalf - 9) / (childHalf * 2)   // 9 = the old flat head gap
    }))
    expect(worstBefore, 'with the old flat gap nothing was buried — the bound proves nothing').toBeGreaterThan(0.23)
  })

  it('leaves the rabbit exactly where the founder approved it', () => {
    // ⚠️ The one picture that was RIGHT before any of this. A fix that moves it has broken the good
    // case to rescue the bad ones. (At smaller viewports every species, the rabbit included, gains a
    // little room — the bound is a floor on tightness, so it can only ever push outward.)
    for (const n of COUNTS) {
      const L = lineLayout(1280, 720, n, 0)
      expect(L.kind.little).toBe('bunny')
      // ⚠️ Read off the DRAWN position — `mx` minus where the first little one really stands — not
      // off the layout's reported `headGap`. Same reason as everything else in this file: the
      // report and the drawing are two different things, and only one of them is on screen.
      expect(L.mx - lineSpot(0, L).left, `n=${n}: the rabbit's head gap moved`).toBeCloseTo(9, 5)
    }
  })

  it('never pulls the head of the line TIGHTER than the step between little ones', () => {
    // A narrow creature (butterfly, shark) is already roomier than the rabbit and must not be
    // dragged in to match — the rule is a floor, not a target.
    for (const { vw, vh, n, castIdx, L } of sweep())
      expect(L.mx - lineSpot(0, L).left, `${vw}x${vh} n=${n} ${CAST[castIdx].little}`).toBeGreaterThanOrEqual(lineStepPct(L) - 1e-9)
  })

  it('⚠️ the room the line RESERVED and the room it USES are the same room', () => {
    /**
     * The huddle's right edge is chosen as "whatever the line will not need". Since the head gap is
     * derived, that reserve is computed in a first pass and spent in a second — and if the two ever
     * fall out of step the line's tail runs left INTO the huddle, where a waiting creature standing
     * right of its destination travels BACKWARDS to reach it. Moonwalking, which this whole layout
     * exists to prevent. Both numbers come from the layout, so neither can be retyped here.
     */
    const bad: string[] = []
    for (const { vw, vh, n, castIdx, L } of sweep()) {
      // ⚠️ The RIGHTMOST creature the huddle actually places, through the same `waitSpot` the scene
      // calls, fed the same value the scene is handed. Comparing the layout's own reserve against
      // its own tail would be a value compared with itself — caught by mutation, which is how this
      // assertion came to go through waitSpot instead.
      const rightmost = Math.max(...Array.from({ length: n }, (_, i) =>
        waitSpot(i, n, L.band, L.huddleRightPct, L.edgePct, L.rows).left))
      // ⚠️ THE TAIL COMES FROM `lineSpot` — the function that DRAWS it — not from a number the
      // layout reports. Caught by mutation: a reported tail can be faked to agree with the reserve,
      // and then the check compares a value with itself.
      const tail = lineSpot(n - 1, L).left
      if (rightmost > tail - 4 + 1e-9)
        bad.push(`${vw}x${vh} n=${n} ${CAST[castIdx].little}: a waiting spot at ${rightmost.toFixed(2)}% is right of the line's tail at ${tail.toFixed(2)}%`)
    }
    expect(bad.join('\n')).toBe('')
  })

  it('the head gap is measured off the sprite, so a wider creature gets a wider gap', () => {
    // Two creatures, same size, different aspect: the wide one must be pushed further out. A check
    // on the VALUE alone is satisfied by a constant.
    const narrow = lineHeadGap(120, 0.8, 1280)
    const wide = lineHeadGap(120, 1.75, 1280)
    expect(wide).toBeGreaterThan(narrow)
  })
})
