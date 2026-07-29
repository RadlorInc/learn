/**
 * BuildingBlocks (6–8 · placeValue) — the PLACE-VALUE gate.
 *
 * The chapter it replaced shipped two faults this file exists to make impossible again:
 *   ① two of its three question types printed the numeral beside the blocks (`showNumeral: true`)
 *      while asking "how many stacks of ten?" — answerable off the digit with every block deleted;
 *   ② the bundling arrived already done, and bundling IS place value.
 *
 * And one the rebuild had to be designed against rather than fixed: **counting rods into a
 * two-window pad is transcription, not place value.** The pad tells you which digit goes where. So
 * the gate checks the thing that actually discriminates — that `make` rounds exist in quantity, and
 * that their two digits differ, so putting them on the wrong shelves is visibly a different number.
 *
 * It drives the SAME exported functions the scene renders from rather than re-implementing them.
 * A gate that reads a chapter's DATA cannot see how the chapter INDEXES it — hence `scoredSlot`.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  makeRound, answerFor, bundlePlan, slotAt, scoredSlot, GUIDED_SLOT, DEMO_SLOTS, matOf,
  MATERIALS, GROUND, groundOf, rodBudget, roomUnit, rackSpot, baySpot, queueOf,
  RACK_X0, RACK_COL, BAY_X0, BAY_COL, MILO_X, QUEUE_PER_ROW, CHUTE_MAX, chuteShown,
  POOL, trayUnit, HUE_BAND, type QKind,
} from '@/features/chapters/story/BuildingBlocks'
import { ROD_SEGMENTS, PAD_BAND, MAT_SAT, MAT_VAL, bannerBottom } from '@/features/chapters/story/yard'
import { hasSheet } from '@/features/chapters/story/critters'

const ASSETS = join(process.cwd(), 'public', 'assets')
const SRC = join(process.cwd(), 'src', 'features', 'chapters', 'story', 'BuildingBlocks.tsx')
const TIERS = [1, 2, 3] as const
const DRAWS = 600
/** Frames the chapter is expected to hold, widest to tightest. */
const FRAMES: Array<[number, number]> = [[1512, 900], [1280, 720], [1024, 620], [812, 375], [740, 360], [640, 320]]
const SLOTS = 13

const sample = (d: 1 | 2 | 3) => Array.from({ length: DRAWS }, (_, i) => makeRound(d, i % 10))

describe('the question is answerable from the shelves and nowhere else', () => {
  it('the chapter never renders a numeral for a question that is READ off the shelves', () => {
    // ⚠️ THE ORIGINAL FAULT. `showNumeral` printed "34" while asking how many tens. The only numeral
    // this chapter may show before a commit is MAKE's work order — which is the QUESTION, not the
    // answer: the blocks are the answer there.
    const src = readFileSync(SRC, 'utf8')
    // ⚠️ Strip the prose first. The header NAMES the old fault so the next reader knows what it was,
    // and a check that cannot tell code from a comment reports its own documentation as a defect.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(code, 'showNumeral is the old fault by name').not.toMatch(/showNumeral/)
    // the order is rendered under the make guard, and nowhere else
    expect(code, "the target belongs in the question pill, not a second card").not.toMatch(/WorkOrder/)
    expect(code.includes('lead={isMake && !ok ? n : undefined}'),
      'the MAKE target rides in the question pill and is hidden once solved').toBe(true)
  })

  for (const d of TIERS) {
    it(`L${d}: both places always hold something`, () => {
      // A number with no ones has no "which shelf" question in it at all.
      for (const r of sample(d)) {
        expect(r.n, `n=${r.n}`).toBeGreaterThanOrEqual(11)
        expect(r.n, `n=${r.n}`).toBeLessThanOrEqual(99)
        expect(r.n % 10, `n=${r.n}`).toBeGreaterThanOrEqual(1)
      }
    })

    it(`L${d}: a MAKE round's two digits DIFFER`, () => {
      // ⚠️ The discriminating case is 34 vs 43. If the digits match, putting them on the wrong
      // shelves produces the same number and the chapter cannot tell the two children apart.
      for (const r of sample(d)) {
        if (r.kind !== 'make') continue
        expect(Math.floor(r.n / 10), `n=${r.n}`).not.toBe(r.n % 10)
      }
    })

    it(`L${d}: every answer matches its kind, and fits its pad`, () => {
      for (const r of sample(d)) {
        expect(r.answer, `${r.kind} ${r.n}`).toBe(answerFor(r.kind, r.n))
        expect(r.answer).toBeGreaterThanOrEqual(r.digits === 1 ? 1 : 10)
        expect(r.answer).toBeLessThanOrEqual(r.digits === 1 ? 9 : 99)
        // a one-window pad cannot take a two-digit answer, and vice versa
        expect(r.digits, `${r.kind}`).toBe(r.kind === 'tens' || r.kind === 'ones' ? 1 : 2)
      }
    })

    it(`L${d}: a 'value' answer is a whole number of tens`, () => {
      // The payload question: three tens are worth THIRTY. An answer that is not a multiple of ten
      // means the generator has stopped asking about place at all.
      for (const r of sample(d)) {
        if (r.kind !== 'value') continue
        expect(r.answer % 10, `n=${r.n}`).toBe(0)
        expect(r.answer).toBe(Math.floor(r.n / 10) * 10)
      }
    })
  }
})

describe('difficulty grows the SKILL, not only the magnitude', () => {
  /**
   * ⚠️ THESE ARE ASSERTED ON THE POOL, NOT ON A SAMPLE OF IT, AND THAT IS THE POINT.
   * The first version drew 600 rounds per tier and checked the observed share — but the claim is
   * about a fixed ratio, so sampling only added noise: L2's true make-share is 3/7 = 0.4286 against
   * a 0.4 threshold, which is 1.4 SD at n=600 and **failed roughly one run in thirteen**. A gate
   * that flakes is worse than no gate, because people learn to re-run it instead of reading it.
   * Drive the ratio the chapter actually holds.
   */
  const share = (d: 1 | 2 | 3, k: QKind) => POOL[d].filter(x => x === k).length / POOL[d].length
  const meanTrades = (d: 1 | 2 | 3) => sample(d).reduce((p, r) => p + bundlePlan(r.n).trades, 0) / DRAWS

  it('MAKE is the largest share at every tier', () => {
    // It is the only type that forces the positional decision, so it may never become a garnish.
    for (const d of TIERS) {
      expect(share(d, 'make'), `L${d}`).toBeGreaterThan(0.4)
      for (const k of ['whole', 'tens', 'ones', 'value'] as QKind[]) {
        expect(share(d, 'make'), `L${d} make vs ${k}`).toBeGreaterThan(share(d, k))
      }
    }
  })

  it("the payload question ('value') appears from L2 and grows", () => {
    expect(share(1, 'value')).toBe(0)
    expect(share(2, 'value')).toBeGreaterThan(0.08)
    expect(share(3, 'value')).toBeGreaterThan(share(2, 'value'))
  })

  it('the number of trades a round demands climbs L1 < L2 < L3', () => {
    // This one IS a property of the draw (the range), so it is sampled — with a margin wide enough
    // that the sampling noise cannot reach it: the tier means are ~1.5, ~4.4 and ~6.4.
    const [t1, t2, t3] = [meanTrades(1), meanTrades(2), meanTrades(3)]
    expect(t1).toBeGreaterThan(0.9)          // it must still HAPPEN at L1 — it is half the skill
    expect(t2).toBeGreaterThan(t1 + 1)
    expect(t3).toBeGreaterThan(t2 + 1)
  })
})

describe('the ones shelf can never hold ten — which is the rule of the place', () => {
  it('a delivery of any size packs down to a legal number', () => {
    for (let n = 11; n <= 99; n++) {
      const p = bundlePlan(n)
      expect(p.trades, `n=${n}`).toBe(Math.floor(n / 10))
      expect(p.rest, `n=${n}`).toBe(n % 10)
      expect(p.rest, `n=${n}`).toBeLessThan(10)          // ⚠️ never ten in the ones place
      expect(p.trades * 10 + p.rest, `n=${n}`).toBe(n)
    }
  })

  it('no wave ever puts more than ten on the shelf', () => {
    for (let n = 11; n <= 99; n++) {
      const p = bundlePlan(n)
      expect(p.firstWave, `n=${n}`).toBeLessThanOrEqual(10)
      expect(p.firstWave + p.waiting, `n=${n}`).toBe(n)
    }
  })

  it('the waiting pile never exceeds the room the chute lays out', () => {
    // ⚠️ THE FIRST VERSION OF THIS TEST COULD NOT FAIL. It asserted
    // `min(waiting,10) - max(0, firstWave-10) <= 10` — and since `firstWave` is capped at ten the
    // second term is always zero, so it read `<=10 vs <=10`. Meanwhile a delivery of 29 really did
    // put NINETEEN cubes in the chute on screen, sprawling across the ones shelf. Assert the number
    // the scene actually RENDERS, and that every place it lays out is on the frame.
    for (let n = 11; n <= 99; n++) {
      // drive the function the SCENE draws from — not a second copy of the cap
      expect(chuteShown(bundlePlan(n).waiting), `n=${n}`).toBeLessThanOrEqual(CHUTE_MAX)
    }
    expect(CHUTE_MAX).toBe(QUEUE_PER_ROW * 2)
    for (let j = 0; j < CHUTE_MAX; j++) {
      const q = queueOf(j)
      expect(q.x, `chute ${j}`).toBeGreaterThan(2)
      expect(q.x, `chute ${j}`).toBeLessThan(97)
      // and it stays clear of the far end of the ones shelf, so a heap never reads as a row
      expect(q.lift, `chute ${j}`).toBeGreaterThan(3)
    }
  })
})

describe('a rod is honestly ten, and it is ONE thing', () => {
  it('a rod draws exactly ten segments', () => {
    expect(ROD_SEGMENTS).toBe(10)
  })

  it('a rod is EXACTLY ten cubes tall at every frame', () => {
    // ⚠️ A rod drawn at anything but ten units is a LIE INSIDE THE MANIPULATIVE — a child laying one
    // against the ones reads the wrong number off it. The unit shrinks; the rod never lies.
    for (const [vw, vh] of FRAMES) {
      const { rodH, cube } = roomUnit(vw, vh)
      expect(rodH, `${vw}×${vh}`).toBe(cube * ROD_SEGMENTS)
    }
  })

  it('the SUPPLY TRAY draws a ten that is ten of its own ones', () => {
    // ⚠️ CAUGHT ON SCREEN, NOT BY THE FIRST VERSION OF THIS GATE, WHICH ONLY CHECKED `roomUnit`.
    // The tray drew its ten at 2.4 units beside a one-cube — a ten and a one side by side is the
    // most direct comparison the chapter ever offers, so drawing them to different units is the
    // 0.55 lie in a component the gate was not looking at. Laid flat, ten units fit the band.
    for (const [vw, vh] of FRAMES) {
      const { cube } = roomUnit(vw, vh)
      const band = PAD_BAND(vh)
      const t = trayUnit(band, cube, vw)
      expect(t.cube, `${vw}×${vh}: tray unit too small to read`).toBeGreaterThanOrEqual(8)
      expect(t.cube, `${vw}×${vh}: tray unit exceeds the shelf unit`).toBeLessThanOrEqual(cube)
      // the ten in the tray is TEN of the one beside it — the comparison the child actually makes
      expect(t.rodH, `${vw}×${vh}`).toBe(t.cube * ROD_SEGMENTS)
      expect(t.rodH, `${vw}×${vh}: tray rod ${t.rodH}px`).toBeLessThan(vw * 0.34)
    }
  })

  it('a standing rod always fits the room it has', () => {
    for (const [vw, vh] of FRAMES) {
      const { rodH, cube } = roomUnit(vw, vh)
      expect(rodH + cube * 0.24, `${vw}×${vh}`).toBeLessThanOrEqual(rodBudget(vh))
    }
  })

  it('nothing standing on the bench reaches up into the prompt banner', () => {
    // On a roomy frame the banner is centred over everything, so the rods must clear it. On a short
    // frame it moves aside over the ONES shelf — where everything is one cube tall.
    for (const [vw, vh] of FRAMES) {
      const { rodH, cube } = roomUnit(vw, vh)
      const under = vh < 470 ? cube * 1.24 : rodH + cube * 0.24
      const top = groundOf(vh) * vh - under
      expect(top, `${vw}×${vh}: top ${top.toFixed(0)} vs banner ${bannerBottom(vh)}`).toBeGreaterThan(bannerBottom(vh))
    }
  })
})

describe('every place a block can stand is on the screen, and reads as its own shelf', () => {
  it('the TENS shelf is on the LEFT and the ONES shelf on the RIGHT', () => {
    // ⚠️ NOT DECORATION. A number is written tens-then-ones, and reading it off the shelves left to
    // right IS the skill this chapter teaches. Flipping these silently un-teaches it.
    expect(RACK_X0).toBeLessThan(BAY_X0)
    expect(rackSpot(8).x).toBeLessThan(MILO_X)
    expect(baySpot(0).x).toBeGreaterThan(MILO_X)
  })

  it('every spot sits inside the frame', () => {
    for (let i = 0; i < 9; i++) {          // nine tens is the most a number under 100 needs
      expect(rackSpot(i).x, `rod ${i}`).toBeGreaterThan(3)
      expect(rackSpot(i).x, `rod ${i}`).toBeLessThan(97)
    }
    for (let i = 0; i < 10; i++) {
      expect(baySpot(i).x, `one ${i}`).toBeGreaterThan(3)
      expect(baySpot(i).x, `one ${i}`).toBeLessThan(97)
    }
    for (let j = 0; j < 2 * QUEUE_PER_ROW; j++) {
      expect(queueOf(j).x, `waiting ${j}`).toBeGreaterThan(2)
      expect(queueOf(j).x, `waiting ${j}`).toBeLessThan(97)
    }
  })

  it('the two shelves and Milo do not sit on each other', () => {
    expect(MILO_X).toBeGreaterThan(rackSpot(8).x + 4)
    expect(BAY_X0).toBeGreaterThan(MILO_X + 4)
  })

  it('the waiting ones read as somewhere ELSE, not as more of the shelf', () => {
    // ⚠️ Ten placed and four waiting at one size on one baseline read as ONE row of fourteen — and
    // the argument the chapter turns on (ten fit, the eleventh does not) goes with it.
    const w = queueOf(0), one = baySpot(0)
    expect(w.scale).toBeLessThan(0.9)                  // visibly smaller
    expect(w.lift).toBeGreaterThan(one.lift + 3)       // and up in the chute — the cues agree
  })

  it('a cube never overflows the column it stands in', () => {
    for (const [vw, vh] of FRAMES) {
      const { cube, rodW } = roomUnit(vw, vh)
      expect(cube, `${vw}×${vh}: cube in a ${(BAY_COL / 100 * vw).toFixed(0)}px column`).toBeLessThan((BAY_COL / 100) * vw)
      expect(rodW, `${vw}×${vh}: rod in a ${(RACK_COL / 100 * vw).toFixed(0)}px column`).toBeLessThan((RACK_COL / 100) * vw)
      expect(cube, `${vw}×${vh}: cube too small to count`).toBeGreaterThanOrEqual(12)
    }
  })

  it('the ground never stands inside the controls, and keeps real clearance', () => {
    // The tap targets may not shrink, so the WORLD yields to them.
    // ⚠️ The first version of this asserted only `<= padTop`, which lets the bench sit flush ON the
    // controls — blocks touching the digit strip passes a check that reads as if it forbids it.
    // Mutation-testing found it: removing the yield entirely still passed. Assert the CLEARANCE the
    // code actually keeps, not merely the absence of overlap.
    const CLEAR = 14
    for (const vh of [320, 360, 375, 400, 620, 720, 900]) {
      const feet = groundOf(vh) * vh
      expect(feet, `vh ${vh}: ground ${feet.toFixed(0)} vs pad top ${vh - PAD_BAND(vh)}`)
        .toBeLessThanOrEqual(vh - PAD_BAND(vh) - CLEAR + 1e-6)     // the share is a float
    }
    expect(groundOf(900)).toBe(GROUND)          // a roomy frame keeps the designed ground line
  })

  it('Milo still has a registered drawn cycle', () => {
    // ⚠️ A block has no legs, so Milo is the only living thing in the room. Without a sheet
    // `SheetCell` silently falls back to a still, and a still that travels is a dragged sticker.
    expect(hasSheet('/assets/characters/milo_side.png')).toBe(true)
  })
})

describe('the run is one straight sequence, and the room changes across it', () => {
  it('demo, guided and all 10 scored rounds get DISTINCT slots', () => {
    const used = [
      ...Array.from({ length: DEMO_SLOTS }, (_, i) => i),
      GUIDED_SLOT,
      ...Array.from({ length: 10 }, (_, r) => GUIDED_SLOT + 1 + r),
    ]
    expect(new Set(used).size).toBe(used.length)
    expect(scoredSlot(9)).toBe(slotAt(GUIDED_SLOT + 10))    // straight index, never modulo
  })

  it('consecutive slots never repeat a scene or a set of blocks', () => {
    for (let i = 1; i < SLOTS; i++) {
      expect(slotAt(i).scene, `slot ${i}`).not.toBe(slotAt(i - 1).scene)
      expect(slotAt(i).mat, `slot ${i}`).not.toBe(slotAt(i - 1).mat)
    }
    expect(new Set(Array.from({ length: SLOTS }, (_, i) => slotAt(i).mat)).size).toBe(MATERIALS.length)
  })

  it('every backdrop exists on disk', () => {
    for (let i = 0; i < SLOTS; i++) {
      expect(existsSync(join(ASSETS, 'backgrounds', slotAt(i).scene)), slotAt(i).scene).toBe(true)
    }
  })

  it('no flat-VECTOR backdrop is cast under a painted Milo', () => {
    const VECTOR = /^(pond|lake|pond_top|sky|fishing_bg|River)\b/
    for (let i = 0; i < SLOTS; i++) expect(slotAt(i).scene, `slot ${i}`).not.toMatch(VECTOR)
  })

  it('no scene is one BlockYard already stands on', () => {
    // The two chapters share the manipulative on purpose — it is the correct one. What must differ
    // is the place, and every farm/garden/town scene with ground is already BlockYard's.
    const TAKEN = new Set(['farm_barnyard.png', 'garden_meadow.png', 'farm_orchard.png', 'garden.png',
      'town_garden.jpeg', 'garden_fence.png', 'garden_park.png', 'town_park.jpeg', 'town_street.jpeg'])
    for (let i = 0; i < SLOTS; i++) expect(TAKEN.has(slotAt(i).scene), `slot ${i}: ${slotAt(i).scene}`).toBe(false)
  })

  it('every scene has OPEN ground where the feet land — not foliage', async () => {
    // ⚠️ **THE CHECK THAT WAS MISSING, TWICE.** The walkable-ground test below only asks whether a
    // pixel is blue, so it passes water and sky and fails nothing else — and the craft doc already
    // records that it cannot tell canopy from grass. Pointed at forest backdrops it passed all four,
    // and on screen the blocks and Milo stood in a wall of shrubbery with no ground under them.
    //
    // Open ground is SMOOTH. Mean neighbour-to-neighbour brightness change along a row separates it
    // from foliage instantly: `garden_meadow` measures 1.9, the forests 15–21. Colour cannot make
    // this distinction; texture can.
    const sharp = (await import('sharp')).default
    for (let i = 0; i < SLOTS; i++) {
      const { scene } = slotAt(i)
      const { data, info } = await sharp(join(ASSETS, 'backgrounds', scene))
        .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      let worst = 0
      for (let ry = 0.66; ry <= 0.78; ry += 0.02) {       // every ground line the layout can return
        const y = Math.floor(ry * info.height)
        const v: number[] = []
        for (let f = 0.05; f <= 0.95; f += 0.004) {
          const p = (y * info.width + Math.floor(f * info.width)) * info.channels
          v.push((data[p] + data[p + 1] + data[p + 2]) / 3)
        }
        let d = 0
        for (let k = 1; k < v.length; k++) d += Math.abs(v[k] - v[k - 1])
        worst = Math.max(worst, d / (v.length - 1))
      }
      expect(worst, `${scene}: roughness ${worst.toFixed(1)} where the feet land`).toBeLessThan(4)
    }
  })

  it('every scene holds WALKABLE GROUND right across the frame', async () => {
    // ⚠️ THE CORRECTION THAT COST THIS CHAPTER A PASS. It was first built on indoor scenes picked for
    // hue and quietness — both PALETTE checks — with a flat "bench" line at 0.70 and no measurement
    // of where the painted surface actually is. `craft_gems` is a glass display case topping out at
    // 0.60, so the blocks and Milo floated inside the cabinet over the necklaces.
    // **Calling the surface a bench does not exempt it from having to exist in the picture.**
    const sharp = (await import('sharp')).default
    for (let i = 0; i < SLOTS; i++) {
      const { scene } = slotAt(i)
      const { data, info } = await sharp(join(ASSETS, 'backgrounds', scene))
        .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      for (const ry of [0.66, 0.70, 0.74]) {           // every ground line the layout can return
        const y = Math.floor(ry * info.height)
        let walk = 0, n = 0
        for (let f = 0.04; f <= 0.97; f += 0.01) {
          const p = (y * info.width + Math.floor(f * info.width)) * info.channels
          const [r, g, b] = [data[p], data[p + 1], data[p + 2]]
          n++
          // water and sky are blue-dominant; anything walkable never is
          if (!(b > g + 4) && (r + g + b) / 3 < 235) walk++
        }
        expect(walk / n, `${scene} at ${ry} of its height`).toBeGreaterThan(0.92)
      }
    }
  })
})

describe('the blocks are a tool, not scenery', () => {
  it("every material sits inside the painted sprites' saturation/brightness band", () => {
    // The rule `cart.png` broke, at .676/.615 against backdrops at .33–.42/.71–.85. All materials
    // share one saturation and one brightness by construction — only the hue moves.
    expect(MAT_SAT).toBeGreaterThanOrEqual(0.42)
    expect(MAT_SAT).toBeLessThanOrEqual(0.66)
    expect(MAT_VAL).toBeGreaterThanOrEqual(0.7)
    expect(MAT_VAL).toBeLessThanOrEqual(0.9)
  })

  it('every material sits in the band this run\'s ground leaves free', () => {
    // Measured, these scenes carry strong hues from 25° (trunks, sand) to 95° (leaf, grass), and the
    // pairing rule needs 45° of clearance — which leaves HUE_BAND and nothing else. Asserted against
    // the exported band rather than six literals, so the rule is what is checked.
    const [lo, hi] = HUE_BAND
    for (const m of MATERIALS) {
      expect(m.hue, `${m.name}`).toBeGreaterThanOrEqual(lo)
      expect(m.hue, `${m.name}`).toBeLessThanOrEqual(hi)
    }
  })

  it('the light and dark faces are DERIVED from the base, not hand-typed', () => {
    // Eighteen hand-written hex values rot one at a time; a derivation cannot.
    for (let i = 0; i < MATERIALS.length; i++) {
      const s = matOf({ scene: '', mat: i })
      expect(s.top).not.toBe(s.face)
      expect(s.face).not.toBe(s.deep)
      expect(s.grain).toBe(MATERIALS[i].grain)
    }
  })

  it('no set of blocks camouflages into the scene it is paired with', async () => {
    // ⚠️ THE HAY-BALE FAULT, MADE IMPOSSIBLE — and measured more strictly than BlockYard measures it.
    // That gate takes a saturation-weighted MEAN of the band, which on a BIMODAL scene returns a hue
    // that is not in the picture at all: `candy_counter` is cream AND mint, means ~45°, and would
    // happily accept a 160° jade sitting invisibly on 16% of the band. So every hue bucket carrying
    // more than 6% of the band is a hue the blocks must clear.
    const sharp = (await import('sharp')).default
    const hueOf = (r: number, g: number, b: number) => {
      const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m
      if (!d) return -1
      const h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4
      return (h * 60 + 360) % 360
    }
    const apart = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d) }
    const cache = new Map<string, Array<[number, number]>>()
    for (let i = 0; i < SLOTS; i++) {
      const { scene, mat } = slotAt(i)
      if (!cache.has(scene)) {
        const { data, info } = await sharp(join(ASSETS, 'backgrounds', scene))
          .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
        const hist = new Array(36).fill(0)
        for (let ry = 0.62; ry <= 0.78; ry += 0.02) {          // the band the blocks occupy
          const row = Math.floor(ry * info.height)
          for (let f = 0.04; f <= 0.97; f += 0.004) {
            const p = (row * info.width + Math.floor(f * info.width)) * info.channels
            const [r, g, b] = [data[p], data[p + 1], data[p + 2]]
            const h = hueOf(r, g, b)
            if (h < 0) continue
            const M = Math.max(r, g, b), n = Math.min(r, g, b)
            const s = (M - n) / Math.max(1, M)
            if (s < 0.08) continue                              // near-grey carries no hue to avoid
            hist[Math.floor(h / 10)] += s
          }
        }
        const tot = hist.reduce((p: number, c: number) => p + c, 0)
        cache.set(scene, hist.map((v: number, k: number) => [k * 10 + 5, v / tot] as [number, number]).filter(([, w]) => w > 0.06))
      }
      const strong = cache.get(scene)!
      expect(strong.length, `${scene} has no measurable hue`).toBeGreaterThan(0)
      const m = MATERIALS[mat]
      const worst = Math.min(...strong.map(([h]) => apart(m.hue, h)))
      expect(worst, `slot ${i}: ${m.name} (${m.hue}°) on ${scene} — nearest scene hue ${worst.toFixed(0)}° away`)
        .toBeGreaterThanOrEqual(45)
    }
  })
})
