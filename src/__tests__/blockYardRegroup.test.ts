/**
 * BlockYard (6–8 · additionTo100 / subtractionTo100) — the REGROUPING gate.
 *
 * The original chapter shipped two faults this file exists to make impossible again:
 *   ① regrouping happened by accident (39–50% of rounds at every tier, measured) and was never
 *      named, so difficulty grew only in magnitude and the skill the chapter is FOR was untaught;
 *   ② the taught method had no step for a carry, and every hand-picked demo example avoided one —
 *      so `52 − 17` told the child "now the ones", i.e. 2 − 7.
 *
 * It drives the SAME exported functions the scene renders from (`makeRound`, `loadPlan`,
 * `scoredSlot`, `spotOf`, `yardUnit`) rather than re-implementing them. A gate that reads a
 * chapter's DATA cannot see how the chapter INDEXES it — hence `scoredSlot`, not the RUN array.
 */
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  makeRound, needsRegroup, loadPlan, slotAt, scoredSlot, GUIDED_SLOT, DEMO_SLOTS,
  spotOf, queueOf, rodSpot, QUEUE_PER_ROW, MILO_X, RODS_X0, ONES_X0, ONES_COL,
  ROD_SEGMENTS, GROUND, groundOf, PAD_BAND, bannerBottom, yardUnit, rodBudget,
  MATERIALS, MAT_SAT, MAT_VAL, type Op,
} from '@/features/chapters/story/BlockYard'
import { hasSheet } from '@/features/chapters/story/critters'

const ASSETS = join(process.cwd(), 'public', 'assets')
const OPS: Op[] = ['+', '-']
const TIERS = [1, 2, 3] as const
const DRAWS = 600
/** Frames the chapter is expected to hold, widest to tightest. */
const FRAMES: Array<[number, number]> = [[1512, 900], [1280, 720], [1024, 620], [812, 375], [740, 360], [640, 320]]

const sample = (op: Op, d: 1 | 2 | 3) => Array.from({ length: DRAWS }, (_, i) => makeRound(op, d, i % 10))

describe('the question is always answerable in the yard and on the pad', () => {
  for (const op of OPS) for (const d of TIERS) {
    it(`${op} L${d}: answer is a TWO-DIGIT number`, () => {
      // The pad has exactly two windows. A 1- or 3-digit answer cannot be entered at all.
      for (const r of sample(op, d)) {
        expect(r.answer, `${r.a}${op}${r.b}`).toBeGreaterThanOrEqual(10)
        expect(r.answer, `${r.a}${op}${r.b}`).toBeLessThanOrEqual(99)
      }
    })

    it(`${op} L${d}: both operands fit the yard and the arithmetic is legal`, () => {
      for (const r of sample(op, d)) {
        expect(r.a).toBeGreaterThanOrEqual(10)
        expect(r.a).toBeLessThanOrEqual(99)
        expect(r.b).toBeGreaterThanOrEqual(1)
        if (op === '+') expect(r.a + r.b).toBeLessThanOrEqual(99)
        else expect(r.a).toBeGreaterThan(r.b)
        expect(r.answer).toBe(op === '+' ? r.a + r.b : r.a - r.b)
      }
    })

    it(`${op} L${d}: the round's own regroup flag is true`, () => {
      for (const r of sample(op, d)) expect(r.regroup).toBe(needsRegroup(op, r.a, r.b))
    })
  }
})

describe('difficulty grows the REGROUPING, not only the magnitude', () => {
  const rate = (op: Op, d: 1 | 2 | 3) => sample(op, d).filter(r => r.regroup).length / DRAWS

  for (const op of OPS) {
    it(`${op}: L3 ALWAYS regroups`, () => {
      expect(rate(op, 3)).toBe(1)
    })
    it(`${op}: the rate climbs L1 < L2 < L3`, () => {
      const [r1, r2, r3] = [rate(op, 1), rate(op, 2), rate(op, 3)]
      expect(r1).toBeGreaterThan(0.3)      // it must still HAPPEN at L1 — it is the skill
      expect(r2).toBeGreaterThan(r1)
      expect(r3).toBeGreaterThan(r2)
    })
  }
})

describe('the yard can actually perform every round it is given', () => {
  for (const op of OPS) for (const d of TIERS) {
    it(`${op} L${d}: no step asks for stock that is not there`, () => {
      for (const r of sample(op, d)) {
        const p = loadPlan(op, r.a, r.b)
        const why = `${r.a} ${op} ${r.b}`
        expect(p.start.onPlatform, why).toBeLessThanOrEqual(10)
        expect(p.start.carts, why).toBeLessThanOrEqual(9)

        if (op === '+') {
          const q = p as typeof p & { addCarts: number; fits: number; spill: number }
          // ones split between the ground and those still waiting, and the ground never holds >10
          expect(p.start.onPlatform + q.fits, why).toBeLessThanOrEqual(10)
          expect(q.spill, why).toBeGreaterThanOrEqual(0)
          // a trade happens at most once: a%10 + b%10 ≤ 18, so one rod is the most that can form
          expect(q.spill, why).toBeLessThan(10)
          const finalTens = p.start.carts + q.addCarts + (q.spill > 0 ? 1 : 0)
          const finalOnes = q.spill > 0 ? q.spill : p.start.onPlatform + q.fits
          expect(finalTens * 10 + finalOnes, why).toBe(r.answer)
        } else {
          const q = p as typeof p & { takeCarts: number; takeOnes: number; short: number }
          // when ones run short there must be a rod left to break, AND enough rods left after it
          if (q.short > 0) {
            expect(p.start.carts, why).toBeGreaterThan(q.takeCarts)
            expect(q.short, why).toBeLessThanOrEqual(10)
          }
          const broke = q.short > 0 ? 1 : 0
          const finalTens = p.start.carts - broke - q.takeCarts
          const finalOnes = (broke ? 10 + p.start.onPlatform - q.takeOnes : p.start.onPlatform - q.takeOnes)
          expect(finalTens, why).toBeGreaterThanOrEqual(0)
          expect(finalOnes, why).toBeGreaterThanOrEqual(0)
          expect(finalOnes, why).toBeLessThanOrEqual(10)
          expect(finalTens * 10 + finalOnes, why).toBe(r.answer)
        }
      }
    })
  }
})

describe('a rod is honestly ten, and it is ONE thing', () => {
  it('a rod draws exactly ten segments', () => {
    // ⚠️ The bundle must still SHOW its ten — otherwise "ten ones make one rod" is asserted rather
    // than seen. What it must NOT show is ten separable bodies: pass 2 drew five creature heads
    // above each bundle's rim, which invites exactly the recount that unitising is the absence of.
    expect(ROD_SEGMENTS).toBe(10)
  })

  it('a rod is EXACTLY ten cubes tall at every frame', () => {
    // ⚠️ THE ONE THAT MATTERS. The first attempt drew the rod at 0.55 of unit scale so it would
    // clear the prompt — so it stood five and a half cubes high beside the cubes it is made of, and
    // a child laying a rod against the ones reads the wrong number off it. That is a lie inside the
    // manipulative. The UNIT shrinks to make room; the rod never lies about its length.
    for (const [vw, vh] of FRAMES) {
      const { rodH, cube } = yardUnit(vw, vh)
      expect(rodH, `${vw}×${vh}`).toBe(cube * ROD_SEGMENTS)
    }
  })

  it('a standing rod always fits the room it has, at every frame', () => {
    for (const [vw, vh] of FRAMES) {
      const { rodH, cube } = yardUnit(vw, vh)
      const stands = rodH + cube * 0.24                          // + the rod's lit top face
      expect(stands, `${vw}×${vh}: rod ${stands.toFixed(0)}px in ${rodBudget(vh).toFixed(0)}px`)
        .toBeLessThanOrEqual(rodBudget(vh))
    }
  })

  it('nothing standing in the yard reaches up into the prompt banner', () => {
    // On a roomy frame the banner is centred over everything, so the rods must clear it. On a short
    // frame it moves aside to the LEFT of the yard — so there only the ONES sit under it, and they
    // are one cube tall.
    for (const [vw, vh] of FRAMES) {
      const { rodH, cube } = yardUnit(vw, vh)
      const under = vh < 470 ? cube * 1.24 : rodH + cube * 0.24
      const top = groundOf(vh) * vh - under
      expect(top, `${vw}×${vh}: top ${top.toFixed(0)} vs banner bottom ${bannerBottom(vh)}`)
        .toBeGreaterThan(bannerBottom(vh))
    }
  })
})

describe('everything the round can put on screen is actually ON the screen', () => {
  it('the spill never exceeds what the waiting pile has room for', () => {
    // spill = a%10 + b%10 − 10 ≤ 8, and the pile lays out 2 rows of QUEUE_PER_ROW.
    let worst = 0
    for (const op of OPS) for (const d of TIERS) for (const r of sample(op, d)) {
      const p = loadPlan(op, r.a, r.b)
      if (op === '+') worst = Math.max(worst, (p as typeof p & { spill: number }).spill)
    }
    expect(worst).toBeLessThanOrEqual(2 * QUEUE_PER_ROW)
  })

  it('every place a block can stand sits inside the frame', () => {
    // ⚠️ The first layout put the fourth waiting block at x = −3.6% and the eighth at −29%:
    // sliced by the left edge, or simply not drawn. A place is only a place if it is on screen.
    for (let i = 0; i < 10; i++) {
      expect(spotOf(i).x, `one ${i}`).toBeGreaterThan(3)
      expect(spotOf(i).x, `one ${i}`).toBeLessThan(97)
    }
    for (let j = 0; j < 2 * QUEUE_PER_ROW; j++) {
      expect(queueOf(j).x, `waiting ${j}`).toBeGreaterThan(2)
      expect(queueOf(j).x, `waiting ${j}`).toBeLessThan(97)
    }
    for (let k = 0; k < 9; k++) {                       // nine rods is the most an answer <100 needs
      expect(rodSpot(k).x, `rod ${k}`).toBeGreaterThan(3)
      expect(rodSpot(k).x, `rod ${k}`).toBeLessThan(97)
    }
  })

  it('the waiting pile reads as somewhere ELSE, not as more of the row', () => {
    // ⚠️ Measured on screen with 10 placed and 4 waiting at the same size on the same baseline: it
    // read as ONE row of fourteen, and the argument the whole chapter turns on — ten fit, the
    // eleventh does not — went with it. Depth is the cue: further back, higher and smaller.
    const w = queueOf(0), one = spotOf(0)
    expect(one.x - w.x).toBeGreaterThan(5)          // a real gap, not a slightly wider column
    expect(w.scale).toBeLessThan(0.9)               // and visibly smaller
    expect(w.lift).toBeGreaterThan(one.lift + 2)    // and further up the frame — the cues agree
  })

  it('the ones, Milo and the rod row do not sit on each other', () => {
    const lastOne = spotOf(9).x
    expect(MILO_X).toBeGreaterThan(lastOne + 4)
    expect(RODS_X0).toBeGreaterThan(MILO_X + 4)
    expect(ONES_X0).toBeGreaterThan(queueOf(0).x)       // the pile waits BEHIND the run
  })

  it('a cube never overflows the column it stands in', () => {
    // ⚠️ A block wider than its column buries its neighbour, and a run the child cannot count is a
    // wrong answer the chapter caused. Measured at every frame, not assumed from one.
    for (const [vw, vh] of FRAMES) {
      const { cube } = yardUnit(vw, vh)
      const colPx = (ONES_COL / 100) * vw
      expect(cube, `${vw}×${vh}: cube ${cube}px in a ${colPx.toFixed(0)}px column`).toBeLessThan(colPx)
      expect(cube, `${vw}×${vh}: cube too small to count`).toBeGreaterThanOrEqual(12)
    }
  })

  it('the yard never stands inside the answer pad', () => {
    // ⚠️ At 640×320 a flat ground of 0.74 put the blocks at 237px and the pad's top at 230 — the
    // yard standing in the digit strip. The pad's buttons are tap targets and may not shrink, so
    // the GROUND is what yields.
    for (const vh of [320, 360, 375, 400, 620, 720, 900]) {
      const feet = groundOf(vh) * vh
      const padTop = vh - PAD_BAND(vh)
      expect(feet, `vh ${vh}: ground ${feet.toFixed(0)} vs pad top ${padTop}`).toBeLessThanOrEqual(padTop)
    }
    expect(groundOf(900)).toBe(GROUND)          // a roomy frame keeps the designed ground line
  })

  it('Milo still has a registered drawn cycle', () => {
    // ⚠️ A block has no legs, so Milo is the ONLY living thing left in this chapter — "something
    // arrives on its own legs" rests entirely on him. Without a sheet `SheetCell` silently falls
    // back to a still, and a still that travels is a sticker being dragged.
    expect(hasSheet('/assets/characters/milo_side.png')).toBe(true)
  })
})

describe('the run is one straight sequence — a setting never wraps back', () => {
  for (const op of OPS) {
    it(`${op}: demo, guided and all 10 scored rounds get DISTINCT slots`, () => {
      const used = [
        ...Array.from({ length: DEMO_SLOTS }, (_, i) => i),
        GUIDED_SLOT,
        ...Array.from({ length: 10 }, (_, r) => GUIDED_SLOT + 1 + r),
      ]
      expect(new Set(used).size).toBe(used.length)
    })

    it(`${op}: the scored rounds are indexed STRAIGHT, and the scene changes every round`, () => {
      // ⚠️ This used to demand ten DISTINCT scenes, which is what forced `farm_pond` and two indoor
      // shop counters into the run — and the whole yard standing on open water is a far worse fault
      // than a backdrop seen twice. Only nine scenes in the library hold walkable ground across the
      // band this yard occupies (asserted below), so what is required is that CONSECUTIVE rounds
      // differ, which is the actual craft rule.
      const scenes = Array.from({ length: 10 }, (_, r) => scoredSlot(op, r).scene)
      for (let r = 1; r < 10; r++) expect(scenes[r], `round ${r}`).not.toBe(scenes[r - 1])
      expect(new Set(scenes).size).toBeGreaterThanOrEqual(8)
      // straight index, never modulo: a wrapped index would replay round 1's slot near the end
      expect(scoredSlot(op, 9)).toBe(slotAt(op, GUIDED_SLOT + 10))
    })

    it(`${op}: consecutive slots never repeat a scene, and every slot has one`, () => {
      for (let i = 0; i < 13; i++) {
        expect(slotAt(op, i).scene, `slot ${i}`).toBeTruthy()
        if (i > 0) expect(slotAt(op, i).scene, `slot ${i}`).not.toBe(slotAt(op, i - 1).scene)
      }
    })

    it(`${op}: every backdrop file actually EXISTS on disk`, () => {
      for (let i = 0; i < 13; i++) {
        const { scene } = slotAt(op, i)
        expect(existsSync(join(ASSETS, 'backgrounds', scene)), `backgrounds/${scene}`).toBe(true)
      }
    })

    it(`${op}: every backdrop holds WALKABLE GROUND right across the yard`, async () => {
      // ⚠️ THE ONE THE SCREEN CAUGHT. `farm_pond.png` opened the subtraction run, and the yard
      // spans nearly the full width — so the blocks, Milo and the whole rod row stood on OPEN
      // WATER. Measured: only 27–35% of the band is walkable there, against 100% on a barnyard.
      // "Does the picture have ground in it" is not the test; the test is the pixel where the
      // blocks actually land, right across the width.
      const sharp = (await import('sharp')).default
      for (let i = 0; i < 13; i++) {
        const { scene } = slotAt(op, i)
        const { data, info } = await sharp(join(ASSETS, 'backgrounds', scene))
          .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
        for (const ry of [0.66, 0.70, 0.74]) {           // the short-frame and roomy ground lines
          const y = Math.floor(ry * info.height)
          let walk = 0, n = 0
          for (let f = 0.04; f <= 0.97; f += 0.01) {
            const p = (y * info.width + Math.floor(f * info.width)) * info.channels
            const [r, g, b] = [data[p], data[p + 1], data[p + 2]]
            n++
            // water and sky are blue-dominant; anything walkable (grass, dirt, path) never is
            if (!(b > g + 4) && (r + g + b) / 3 < 235) walk++
          }
          expect(walk / n, `${scene} at ${ry} of its height`).toBeGreaterThan(0.92)
        }
      }
    })

    it(`${op}: every round gets a DIFFERENT set of blocks from the one before it`, () => {
      // Round 10 must not look like round 1, and until the blocks carried a material only the
      // BACKDROP changed. Consecutive rounds must differ; the run must use most of the set.
      const mats = Array.from({ length: 13 }, (_, i) => slotAt(op, i).mat)
      for (let i = 1; i < 13; i++) expect(mats[i], `slot ${i}`).not.toBe(mats[i - 1])
      expect(new Set(mats).size).toBe(MATERIALS.length)
    })

    it(`${op}: every material sits inside the painted sprites' saturation/brightness band`, () => {
      // The rule `cart.png` broke, at .676/.615 against backdrops at .33–.42/.71–.85. All six
      // materials share one saturation and one brightness by construction — only the hue moves —
      // so this cannot drift one colour at a time.
      expect(MAT_SAT).toBeGreaterThanOrEqual(0.42)
      expect(MAT_SAT).toBeLessThanOrEqual(0.66)
      expect(MAT_VAL).toBeGreaterThanOrEqual(0.7)
      expect(MAT_VAL).toBeLessThanOrEqual(0.9)
    })

    it(`${op}: no set of blocks camouflages into the scene it is paired with`, async () => {
      // ⚠️ THE HAY-BALE FAULT, MADE IMPOSSIBLE. Drawn in the scenery's own warm sand the blocks were
      // dead on the palette band and completely lost in a farmyard — a manipulative is a TOOL and is
      // meant to stand out. The band is what must match; the HUE is what must not. Measured: the
      // backdrops in this run sit at 68–95° except `town_street` at 32°.
      const sharp = (await import('sharp')).default
      const hueOf = (r: number, g: number, b: number) => {
        const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m
        if (!d) return -1
        const h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4
        return (h * 60 + 360) % 360
      }
      const apart = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d) }
      for (let i = 0; i < 13; i++) {
        const { scene, mat } = slotAt(op, i)
        const { data, info } = await sharp(join(ASSETS, 'backgrounds', scene))
          .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
        // the band the yard occupies, weighted by saturation so grey paths do not dominate the mean
        let x = 0, yy = 0
        for (const ry of [0.62, 0.66, 0.70, 0.74, 0.78]) {
          const row = Math.floor(ry * info.height)
          for (let f = 0.04; f <= 0.97; f += 0.005) {
            const p = (row * info.width + Math.floor(f * info.width)) * info.channels
            const [r, g, b] = [data[p], data[p + 1], data[p + 2]]
            const h = hueOf(r, g, b)
            if (h < 0) continue
            const w = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(1, Math.max(r, g, b))
            x += Math.cos((h * Math.PI) / 180) * w
            yy += Math.sin((h * Math.PI) / 180) * w
          }
        }
        const sceneHue = ((Math.atan2(yy, x) * 180) / Math.PI + 360) % 360
        const m = MATERIALS[mat]
        expect(apart(m.hue, sceneHue), `slot ${i}: ${m.name} (${m.hue}°) on ${scene} (${sceneHue.toFixed(0)}°)`)
          .toBeGreaterThanOrEqual(45)
      }
    })

    it(`${op}: no flat-VECTOR backdrop is cast under a painted Milo`, () => {
      // pond / lake / pond_top / sky / fishing_bg are thick-outlined vector cartoons; Milo is
      // painted, and no ground line or shadow fixes a style mismatch.
      const VECTOR = /^(pond|lake|pond_top|sky|fishing_bg|River)\b/
      for (let i = 0; i < 13; i++) expect(slotAt(op, i).scene, `slot ${i}`).not.toMatch(VECTOR)
    })
  }
})
