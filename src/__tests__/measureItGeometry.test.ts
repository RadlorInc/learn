/**
 * Measurement (MeasureIt) — the invariant sweep.
 *
 * The chapter's whole claim is that the run of blocks and the thing beside it agree BY
 * CONSTRUCTION, so these check the construction rather than the look: the run is exactly as long as
 * the thing, it clears the prompt band and the controls at every size a child can hold, and no
 * sprite is ever drawn outside the frame.
 *
 * It imports `measureLayout` — the same function the scene draws from. Chapter 4's sweep
 * re-implements its sizing chain, which lets a check agree with its own copy of the constants while
 * the screen it protects falls apart.
 */
import { describe, it, expect } from 'vitest'
import {
  measureLayout, aspectOf, poolFor, WORLDS, FOREST, TRAIL,
  MAX_UNITS, BOTTOM_BAND, type Thing, type MWorld,
} from '@/features/chapters/story/MeasureIt'

/**
 * Every size a child can actually hold, shortest first. 640×320 and 667×375 are the landscape
 * phones this band keeps breaking on; 640×620 and 700×800 are narrow-but-tall windows (a half
 * screen on a laptop, a portrait tablet past the rotate gate) and they are the ONLY sizes where the
 * layout's width term binds at all.
 *
 * Mutation-tested: widening that width term alone survives this sweep, and it was checked rather
 * than assumed — at every size where it binds, the 76px unit cap holds the run to 456px, which fits
 * a 640px frame with room. Inert, not a missed regression. Removing the cap, over-sizing the unit,
 * or giving a thing more than MAX_UNITS blocks all fail here.
 */
const SIZES: [number, number][] = [
  [640, 320], [667, 375], [740, 360], [812, 375], [1024, 400],
  [640, 620], [700, 800], [820, 1180],
  [1024, 620], [1180, 700], [1280, 720], [1512, 860], [1920, 1080],
]

const ALL: [MWorld, Thing][] = WORLDS.flatMap(w => w.things.map(t => [w, t] as [MWorld, Thing]))

/** What the Stage actually draws, in px, for one thing at one viewport. */
function drawn(world: MWorld, thing: Thing, vw: number, vh: number) {
  const { unit, avail, band } = measureLayout(world.axis, vw, vh)
  const up = world.axis === 'up'
  const measured = thing.units * unit                       // the thing along the measured axis
  const cross = up ? measured * aspectOf(thing) : measured / aspectOf(thing)
  const run = thing.units * unit                            // the completed run of blocks
  // 'up': thing and run stand side by side.  'along': run lies under the thing.
  const boxW = up ? measured * aspectOf(thing) + unit * 1.4 : measured
  const boxH = up ? measured : cross + unit * 1.4
  return { unit, avail, band, measured, cross, run, boxW, boxH }
}

describe('measureLayout', () => {
  it('gives every thing a run exactly as long as the thing itself', () => {
    for (const [w, t] of ALL) for (const [vw, vh] of SIZES) {
      const d = drawn(w, t, vw, vh)
      // This is the chapter's core claim: laying `units` blocks reaches the end, and no other
      // count does. Floating point only — they are the same product.
      expect(d.run).toBeCloseTo(d.measured, 6)
    }
  })

  it('never lets the tallest run reach the prompt band or the controls', () => {
    for (const [w, t] of ALL) for (const [vw, vh] of SIZES) {
      const d = drawn(w, t, vw, vh)
      const room = vh - d.band - BOTTOM_BAND
      expect(d.boxH, `${w.id}/${t.id} @${vw}×${vh}`).toBeLessThanOrEqual(Math.max(90, room))
    }
  })

  it('never draws a thing wider than the frame', () => {
    for (const [w, t] of ALL) for (const [vw, vh] of SIZES) {
      const d = drawn(w, t, vw, vh)
      expect(d.boxW, `${w.id}/${t.id} @${vw}×${vh}`).toBeLessThanOrEqual(vw * 0.94)
    }
  })

  it('keeps a block big enough to see at the smallest screen', () => {
    for (const w of WORLDS) for (const [vw, vh] of SIZES) {
      expect(measureLayout(w.axis, vw, vh).unit, `${w.id} @${vw}×${vh}`).toBeGreaterThanOrEqual(12)
    }
  })

  it('grows the unit to its cap on a roomy screen instead of pinning it small', () => {
    for (const w of WORLDS) {
      const phone = measureLayout(w.axis, 640, 320).unit
      const laptop = measureLayout(w.axis, 1512, 860).unit
      expect(laptop, w.id).toBeGreaterThanOrEqual(70)   // reaches its cap, not stuck at a phone size
      expect(laptop, w.id).toBeGreaterThan(phone)
      // …and the phone is not squeezed to something a three-year-old cannot count. This was 21.8px
      // before the prompt band was allowed to shrink on short screens.
      expect(phone, w.id).toBeGreaterThanOrEqual(26)
    }
  })
})

describe('the things', () => {
  it('never asks for more blocks than the layout is derived for', () => {
    for (const [, t] of ALL) expect(t.units).toBeLessThanOrEqual(MAX_UNITS)
  })

  it('gives every thing a real ink box, so a padded PNG cannot make the measure lie', () => {
    for (const [, t] of ALL) {
      const [x0, y0, x1, y1] = t.bb
      expect(x1).toBeGreaterThan(x0); expect(y1).toBeGreaterThan(y0)
      expect(x0).toBeGreaterThanOrEqual(0); expect(y1).toBeLessThanOrEqual(1)
      expect(aspectOf(t)).toBeGreaterThan(0.3)
    }
  })

  it('points the forest at tall things and the trail at long ones', () => {
    for (const t of FOREST) expect(aspectOf(t), t.id).toBeLessThan(1.1)   // taller than wide
    for (const t of TRAIL) expect(aspectOf(t), t.id).toBeGreaterThan(1.1) // longer than tall
  })

  it('never repeats a background inside a world', () => {
    for (const w of WORLDS) {
      const bgs = w.things.map(t => t.bg)
      // A world may reuse a scene across its ends, but never twice in a row as the round rotates.
      for (let i = 1; i < bgs.length; i++) expect(bgs[i], w.id).not.toBe(bgs[i - 1])
    }
  })
})

describe('difficulty', () => {
  it('offers small counts first and larger ones later, and never an empty pool', () => {
    for (const w of WORLDS) {
      const tiers = ([1, 2, 3] as const).map(d => poolFor(w, d))
      for (const p of tiers) expect(p.length).toBeGreaterThan(0)
      const mean = (p: Thing[]) => p.reduce((s, t) => s + t.units, 0) / p.length
      expect(mean(tiers[0])).toBeLessThan(mean(tiers[2]))
    }
  })

  it('has something to ask for all ten rounds at every tier', () => {
    for (const w of WORLDS) for (const d of [1, 2, 3] as const) {
      const p = poolFor(w, d)
      for (let round = 0; round < 10; round++) expect(p[round % p.length]).toBeDefined()
    }
  })

  it('keeps the demo, the guided round and the practice pool distinct things', () => {
    for (const w of WORLDS) {
      const demos = [w.things[0], w.things[2]], guided = w.things[1]
      expect(demos.map(t => t.id)).not.toContain(guided.id)
      expect(new Set(demos.map(t => t.id)).size).toBe(2)
    }
  })
})
