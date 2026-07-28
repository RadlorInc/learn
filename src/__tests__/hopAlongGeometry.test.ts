/**
 * HopAlong (skip counting — COUNT THE FAST WAY) layout, run and value invariants.
 *
 * Imports the SAME `fetchLayout` the scene renders from, rather than re-implementing the sizing
 * chain — a check that mirrors its own copy of the constants will agree with itself while the
 * screen it exists to protect falls apart (chapter 4's sweep does this and it is why a 1px button
 * overlap survived a clean run).
 *
 * The first version of this chapter's layout was hand-tuned and BOTH of its faults were caught by
 * eye rather than by arithmetic: the rightmost family hung off the frame, and the gathered crowd was
 * drawn straight over Milo. Those two are the first assertions below.
 */
import { describe, it, expect } from 'vitest'
import {
  RUN, DEMO_SLOTS, scoredSlot, makeFetch, fetchLayout, PAIRS_FOR_TEST,
} from '@/features/chapters/story/HopAlong'
import { SHEETS } from '@/features/chapters/story/canvas/sheets'

const SIZES: Array<[number, number]> = [
  [1024, 620], [1280, 800], [1512, 860], [1920, 900],
  [812, 375], [667, 375], [740, 360], [640, 320], [1024, 400],
]

/** Every (group, need) the generator can draw, at every difficulty. */
const CASES = ([1, 2, 3] as const).flatMap(d =>
  PAIRS_FOR_TEST[d].map(([group, need]) => ({
    d, group, need,
    families: need + (group >= 10 ? 1 : 2),
  })))

describe('HopAlong layout', () => {
  it('every waiting family sits FULLY inside the frame', () => {
    for (const [vw, vh] of SIZES) for (const c of CASES) {
      const L = fetchLayout(vw, vh, c)
      for (let k = 0; k < c.families; k++) {
        const left = L.famX(k) - L.clusterW / 2
        const right = L.famX(k) + L.clusterW / 2
        expect(left, `${vw}x${vh} g${c.group} fam${k} left edge`).toBeGreaterThanOrEqual(0)
        expect(right, `${vw}x${vh} g${c.group} fam${k} right edge`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('adjacent families are visibly SEPARATE, not merely non-overlapping', () => {
    // Six touching clusters read as one long row, and the child is counting families — so a gap of
    // zero is a wrong answer the chapter caused, not a cosmetic blemish.
    for (const [vw, vh] of SIZES) for (const c of CASES) {
      const L = fetchLayout(vw, vh, c)
      for (let k = 1; k < c.families; k++) {
        const gap = (L.famX(k) - L.clusterW / 2) - (L.famX(k - 1) + L.clusterW / 2)
        expect(gap, `${vw}x${vh} g${c.group} between fam${k - 1} and fam${k}`).toBeGreaterThanOrEqual(1.5)
      }
    }
  })

  it('no waiting family overlaps Milo, wherever he has hopped to', () => {
    for (const [vw, vh] of SIZES) for (const c of CASES) {
      const L = fetchLayout(vw, vh, c)
      const miloHalf = (L.miloPx * 0.62) / 2 / vw * 100
      for (let taken = 0; taken < c.families; taken++) {
        const miloX = L.miloAt(taken)
        // Families still waiting are those from `taken` on; he stands beside the one before.
        for (let k = taken; k < c.families; k++) {
          const gap = (L.famX(k) - L.clusterW / 2) - (miloX + miloHalf)
          expect(gap, `${vw}x${vh} g${c.group} taken${taken} fam${k}`).toBeGreaterThan(-0.001)
        }
      }
    }
  })

  it('Milo himself is fully on screen wherever he stands', () => {
    // He shipped at left:-2px on a 1024 frame because his start was a flat 5% — less than his own
    // half-width. Caught on screen, not by arithmetic, which is why this assertion exists.
    for (const [vw, vh] of SIZES) for (const c of CASES) {
      const L = fetchLayout(vw, vh, c)
      const half = (L.miloPx * 0.62) / 2 / vw * 100
      for (let taken = 0; taken <= c.need; taken++) {
        expect(L.miloAt(taken) - half, `${vw}x${vh} g${c.group} taken${taken}`).toBeGreaterThanOrEqual(0)
        expect(L.miloAt(taken) + half, `${vw}x${vh} g${c.group} taken${taken}`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('the gathered crowd never runs off the left edge', () => {
    for (const [vw, vh] of SIZES) for (const c of CASES) {
      const L = fetchLayout(vw, vh, c)
      const miloX = L.miloAt(c.need)                      // the furthest he ever gets
      const last = L.gotSpot(c.need * c.group - 1, miloX) // the furthest back of the crowd
      const halfKid = L.gotPx / 2 / vw * 100
      expect(last.left - halfKid, `${vw}x${vh} g${c.group} n${c.need}`).toBeGreaterThan(-0.001)
    }
  })

  it('EVERYONE clears the frame on the walk-off, including the tail of the line', () => {
    // "Let them pass by fully." A flat offset clears whoever is furthest right and strands the rest —
    // chapter 2 ended its rounds with half the family still standing in frame before this was
    // measured from the tail instead.
    for (const [vw, vh] of SIZES) for (const c of CASES) {
      const L = fetchLayout(vw, vh, c)
      const d = L.exitPct(c.need, c.group)
      const halfKid = (L.gotPx / 2 / vw) * 100
      const halfMilo = (L.miloPx * 0.62) / 2 / vw * 100
      // the furthest-back little one, and Milo himself, both end beyond the right edge
      const tail = L.gotSpot(c.need * c.group - 1, L.miloAt(c.need)).left
      expect(tail - halfKid + d, `${vw}x${vh} g${c.group} tail`).toBeGreaterThanOrEqual(100)
      expect(L.miloAt(c.need) - halfMilo + d, `${vw}x${vh} g${c.group} milo`).toBeGreaterThanOrEqual(100)
    }
  })

  it('a little one is never drawn too small to recognise', () => {
    for (const [vw, vh] of SIZES) for (const c of CASES) {
      const L = fetchLayout(vw, vh, c)
      expect(L.kidPx, `${vw}x${vh} g${c.group} n${c.need}`).toBeGreaterThanOrEqual(17)
    }
  })

  it('a family of ten is drawn 2x5, so ten reads as ten', () => {
    const L = fetchLayout(1024, 620, { group: 10, families: 4 })
    expect(L.cols).toBe(5)
  })

  it('the sign clears the headroom the hop sheet reserves', () => {
    // Milo's cell is tall enough to hold the airborne frames, so anything hung off the cell top
    // floats well above his head. headPx is the correction, and it must be a real offset.
    for (const [vw, vh] of SIZES) {
      const L = fetchLayout(vw, vh, { group: 5, families: 5 })
      expect(L.headPx).toBeGreaterThan(0)
      expect(L.headPx).toBeLessThan(L.miloPx * 0.5)
    }
  })
})

describe('HopAlong run', () => {
  it('never shows the same creature twice in one run', () => {
    const seen = RUN.map(s => s.item.img)
    expect(new Set(seen).size).toBe(RUN.length)
  })

  it('covers demo + guided + every scored round', () => {
    // 2 demo + 1 guided + 10 scored. A run shorter than this is what makes a chapter wrap round and
    // re-show the creature it opened with.
    expect(RUN.length).toBeGreaterThanOrEqual(DEMO_SLOTS + 1 + 10)
  })

  it('indexes scored rounds STRAIGHT — never modulo', () => {
    // Driven through the accessor the chapter itself calls. Reading RUN directly cannot see how the
    // chapter indexes it, which is exactly how a wrapped index walks through a data-only check.
    const imgs = Array.from({ length: 10 }, (_, r) => scoredSlot(r).item.img)
    expect(new Set(imgs).size).toBe(10)
    // and none of them is a creature the demo or the guided round already used
    const early = RUN.slice(0, DEMO_SLOTS + 1).map(s => s.item.img)
    for (const img of imgs) expect(early).not.toContain(img)
  })

  it('changes the setting between consecutive questions', () => {
    for (let i = 1; i < RUN.length; i++) expect(RUN[i].w.id).not.toBe(RUN[i - 1].w.id)
  })

  it('marks exactly the creatures that fly, and hovers them off the ground', () => {
    // The founder caught butterflies and dragonflies standing in the lawn: the `flier` flag existed
    // and was never read by the renderer. This asserts both halves — the flag is on the right
    // creatures, and it actually lifts them.
    //
    // The air/ground split is world1.tsx's `LOCO` table, which is the app's existing classification
    // ("a grounded scene needs a background whose painted ground is most of the frame… fliers are
    // exempt"). ⚠️ It files LADYBUG and ANT as CRAWLERS, not fliers — chapter 2 shipped a ladybug in
    // a sky band and it read as wrong immediately.
    const AIR = new Set(['butterfly', 'firefly', 'bee', 'dragonfly'])
    for (const s of RUN) {
      const name = s.item.img.split('/').pop()!.replace('_side.png', '')
      expect(!!s.item.flier, `${name} flier flag`).toBe(AIR.has(name))
    }
    const air = fetchLayout(1024, 620, { group: 5, families: 5, flier: true })
    const ground = fetchLayout(1024, 620, { group: 5, families: 5, flier: false })
    expect(ground.flyLift).toBe(0)
    expect(air.flyLift).toBeGreaterThan(air.miloPx * 0.3)   // genuinely up around his head
    expect(air.flyLift).toBeLessThan(air.miloPx * 0.84)     // not above the top of him
  })

  it('never casts a flier into a scene it would disappear against', () => {
    // Lifting the butterflies off the ground hid them in the flower bed instead — the countability
    // rule one layer along. `airOk` is measured (pixel variation at hovering height), so this is the
    // assertion that keeps the cast honest when someone reshuffles it.
    for (const s of RUN) if (s.item.flier) expect(s.w.airOk, `${s.item.one} in ${s.w.label}`).toBe(true)
  })

  it('every creature in the cast has a drawn cycle', () => {
    // A still creature standing beside a living one reads as broken art, so the cast is
    // all-or-nothing.
    for (const s of RUN) expect(SHEETS[s.item.img], s.item.img).toBeDefined()
  })
})

describe('HopAlong rounds', () => {
  it('always offers more families than he needs, so stopping is a real decision', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 200; i++) {
      const r = makeFetch(RUN[3], d)
      expect(r.families).toBeGreaterThan(r.need)
    }
  })

  it('the target is always the group size times the number of families needed', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 200; i++) {
      const r = makeFetch(RUN[3], d)
      expect(r.target).toBe(r.group * r.need)
    }
  })

  it('only ever counts in 2s, 5s or 10s', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 200; i++) {
      expect([2, 5, 10]).toContain(makeFetch(RUN[3], d).group)
    }
  })

  it('grows the target with difficulty', () => {
    const max = (d: 1 | 2 | 3) => Math.max(...PAIRS_FOR_TEST[d].map(([g, n]) => g * n))
    expect(max(2)).toBeGreaterThan(max(1))
    expect(max(3)).toBeGreaterThanOrEqual(max(2))
  })
})
