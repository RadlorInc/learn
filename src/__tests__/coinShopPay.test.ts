/**
 * CoinShop (6–8 · money) — the PAY-IT gate.
 *
 * The chapter it replaced shipped one fault this file exists to make impossible again: **every coin
 * carried its own value as a code-drawn numeral, and the answer was the sum off three chips.**
 * Replace each coin sprite with a bare numeral and all thirty questions still worked — it was
 * `5 + 1 + 1` wearing coins. So the gate checks the thing that actually discriminates: that most
 * rounds ask the child to BUILD an amount, and that a `fewest` round always has a strictly better
 * answer than the set it was generated from.
 *
 * It drives the SAME exported functions the scene renders from rather than re-implementing them.
 * ⚠️ A gate that reads a chapter's DATA cannot see how the chapter INDEXES it — hence `scoredSlot`.
 */
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  makeRound, fewestFor, digitsFor, slotAt, scoredSlot, GUIDED_SLOT, DEMO_SLOTS, RUN_LENGTH,
  POOL, KINDS, VALUES, GOODS, goodAt, COUNTER_MAX, COUNTER_X0, COUNTER_COL, counterSpot,
  MILO_X, miloHalfPct, coinPxFor, coinBudget, type QKind, type CoinValue,
} from '@/features/chapters/story/CoinShop'
import { PAD_BAND, groundOf } from '@/features/chapters/story/yard'
import { hasSheet } from '@/features/chapters/story/critters'

const ASSETS = join(process.cwd(), 'public', 'assets')
const TIERS: (1 | 2 | 3)[] = [1, 2, 3]
const DRAWS = 400
const SIZES: [number, number][] = [
  [1280, 720], [1024, 620], [1440, 900], [1512, 860], [900, 500], [640, 320], [740, 360], [812, 375],
]

/** The true minimum coin count, by exhaustive DP — so the greedy the chapter ships is CHECKED,
 *  not assumed. Greedy is optimal for 1/5/10/25 and the gate is what says so. */
function trueFewest(price: number, pool: readonly CoinValue[]): number {
  const best = new Array(price + 1).fill(Infinity)
  best[0] = 0
  for (let p = 1; p <= price; p++)
    for (const v of pool) if (v <= p) best[p] = Math.min(best[p], best[p - v] + 1)
  return best[price]
}

describe('the question is BUILD an amount, not add the numerals', () => {
  it('most rounds at every tier ask the child to build', () => {
    for (const d of TIERS) {
      const build = KINDS[d].filter(k => k !== 'read').length
      expect(build / KINDS[d].length, `tier ${d}`).toBeGreaterThan(0.6)
    }
  })

  it('`fewest` appears only where a big coin makes it a real decision', () => {
    // At L1 the pool is 1 and 5 and "fewest" is barely a choice; the 25 is what makes it one.
    expect(KINDS[1]).not.toContain('fewest')
    expect(KINDS[3]).toContain('fewest')
    expect(POOL[3]).toContain(25)
  })

  it('every price is payable from its own tier pool, inside the counter', () => {
    for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
      const r = makeRound(d, i % 10)
      expect(r.price, `tier ${d}`).toBeGreaterThanOrEqual(2)
      const need = fewestFor(r.price, POOL[d]).length
      expect(need, `tier ${d} price ${r.price} needs ${need} coins`).toBeLessThanOrEqual(COUNTER_MAX)
    }
  })

  it('a `fewest` round always has a STRICTLY better answer than the set it came from', () => {
    // Otherwise the question teaches nothing: the child lays what they would have laid anyway.
    let seen = 0
    for (let i = 0; i < DRAWS * 3; i++) {
      const r = makeRound(3, i % 10)
      if (r.kind !== 'fewest') continue
      seen++
      expect(fewestFor(r.price, POOL[3]).length, `price ${r.price}`).toBeLessThan(r.shown.length)
    }
    expect(seen, 'no fewest rounds were drawn at all').toBeGreaterThan(20)
  })

  it('`fewestFor` really is the fewest — checked against exhaustive DP', () => {
    for (const d of TIERS) for (let p = 2; p <= 99; p++) {
      expect(fewestFor(p, POOL[d]).length, `tier ${d} price ${p}`).toBe(trueFewest(p, POOL[d]))
      expect(fewestFor(p, POOL[d]).reduce((s, v) => s + v, 0), `tier ${d} price ${p} sums`).toBe(p)
    }
  })

  it('the shown coins of a READ round really do sum to its price', () => {
    for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
      const r = makeRound(d, i % 10)
      if (r.kind !== 'read') continue
      expect(r.shown.reduce((s, v) => s + v, 0), `tier ${d}`).toBe(r.price)
      expect(r.shown.length).toBeLessThanOrEqual(COUNTER_MAX)
    }
  })
})

describe('the pad can express the answer it is asking for', () => {
  /** ⚠️ CAUGHT ON SCREEN, AND IT WAS A DEAD END. A `read` round of three 1-coins asks for 3, and a
   *  pad hard-wired to two windows can never accept it — `Done` stays disabled for ever. */
  it('every round offers exactly as many windows as its price has digits', () => {
    for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
      const r = makeRound(d, i % 10)
      expect(r.digits, `tier ${d} price ${r.price}`).toBe(String(r.price).length)
      expect(digitsFor(r.price)).toBe(r.digits)
    }
  })
  it('digitsFor is right at the boundary', () => {
    expect(digitsFor(9)).toBe(1)
    expect(digitsFor(10)).toBe(2)
    expect(digitsFor(99)).toBe(2)
  })
})

describe('the run', () => {
  it('covers demo, guided and ten scored rounds without wrapping', () => {
    expect(RUN_LENGTH).toBeGreaterThanOrEqual(DEMO_SLOTS + 1 + 10)
    // scoredSlot must never hand back a slot the demo or the guided round already used
    const early = new Set([...Array(GUIDED_SLOT + 1)].map((_, i) => slotAt(i)))
    for (let r = 0; r < 10; r++) expect(early.has(scoredSlot(r)), `round ${r}`).toBe(false)
  })

  it('consecutive rounds never repeat a scene', () => {
    for (let i = 1; i < RUN_LENGTH; i++)
      expect(slotAt(i).scene, `slots ${i - 1}/${i}`).not.toBe(slotAt(i - 1).scene)
  })

  it('every scene and every good is a file that exists', () => {
    for (let i = 0; i < RUN_LENGTH; i++)
      expect(existsSync(join(ASSETS, 'backgrounds', slotAt(i).scene)), slotAt(i).scene).toBe(true)
    for (const g of GOODS) expect(existsSync(join(process.cwd(), 'public', g.img)), g.img).toBe(true)
  })

  it('ten scored rounds never show the same goods twice', () => {
    const seen = GOODS.map((_, i) => goodAt(i).img)
    expect(new Set(seen).size).toBe(GOODS.length)
    expect(GOODS.length).toBeGreaterThanOrEqual(9)
  })

  it('Milo still has a REGISTERED drawn cycle', () => {
    // Without one `SheetCell` silently falls back to a still, and a still that travels is a sticker
    // being dragged — invisible in a screenshot. He is the only living thing in this chapter.
    expect(hasSheet('/assets/characters/milo_side.png')).toBe(true)
  })

  it('every coin sprite exists', () => {
    for (const v of VALUES)
      expect(existsSync(join(ASSETS, 'objects', v === 1 ? 'coin_copper.png' : v === 5 ? 'coin_silver.png' : 'coin_gold.png')), `coin ${v}`).toBe(true)
  })
})

describe('the counter holds what it is asked to hold', () => {
  it('a full counter fits on screen and never reaches Milo', () => {
    // ⚠️ DERIVED, not a guessed gap. The first version asserted a flat 8% and passed a layout where
    // the eighth coin sat 5.8% from Milo — inside his own half-width, i.e. touching him.
    for (const [vw, vh] of SIZES) {
      const px = coinPxFor(vw, vh)
      const last = counterSpot(COUNTER_MAX - 1).x + ((px * 1.14) / 2 / vw) * 100
      expect(last, `${vw}x${vh}: last coin ${last.toFixed(1)}% vs Milo at ${MILO_X}%`)
        .toBeLessThan(MILO_X - miloHalfPct(px, vw))
    }
    expect(COUNTER_X0).toBeGreaterThan(4)
  })

  it('the coins are laid in one row, left to right, never overlapping', () => {
    for (let i = 1; i < COUNTER_MAX; i++)
      expect(counterSpot(i).x - counterSpot(i - 1).x).toBeCloseTo(COUNTER_COL, 5)
  })

  it('a coin is never too small to read, at any size', () => {
    for (const [vw, vh] of SIZES) {
      const px = coinPxFor(vw, vh)
      expect(px, `${vw}x${vh}`).toBeGreaterThanOrEqual(20)
      // and it must fit its own column, or a full counter touches
      expect(px, `${vw}x${vh} column`).toBeLessThanOrEqual((COUNTER_COL / 100) * vw)
    }
  })

  it('nothing standing on the counter reaches into the answering controls', () => {
    for (const [vw, vh] of SIZES) {
      const ground = groundOf(vh) * vh
      const padTop = vh - PAD_BAND(vh)
      expect(ground, `${vw}x${vh}: ground ${ground.toFixed(0)} vs pad ${padTop.toFixed(0)}`).toBeLessThanOrEqual(padTop)
      expect(coinBudget(vh), `${vw}x${vh}`).toBeGreaterThan(0)
    }
  })
})

describe('the ground is open, and nothing on it is camouflaged', () => {
  /** Mean neighbour-to-neighbour brightness change along a row, where the feet land. Open ground is
   *  SMOOTH; foliage is not, and colour cannot tell them apart. Same instrument as placeValue. */
  async function measure(scene: string) {
    const sharp = (await import('sharp')).default
    const { data, info } = await sharp(join(ASSETS, 'backgrounds', scene))
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let rough = 0, walk = 1
    let R = 0, G = 0, B = 0, N = 0
    for (let ry = 0.66; ry <= 0.78; ry += 0.02) {
      const y = Math.floor(ry * info.height)
      const v: number[] = []
      for (let f = 0.05; f <= 0.95; f += 0.004) {
        const p = (y * info.width + Math.floor(f * info.width)) * info.channels
        v.push((data[p] + data[p + 1] + data[p + 2]) / 3)
      }
      let d = 0
      for (let k = 1; k < v.length; k++) d += Math.abs(v[k] - v[k - 1])
      rough = Math.max(rough, d / (v.length - 1))
    }
    for (const ry of [0.66, 0.70, 0.74]) {
      const y = Math.floor(ry * info.height)
      let ok = 0, n = 0
      for (let f = 0.04; f <= 0.97; f += 0.01) {
        const p = (y * info.width + Math.floor(f * info.width)) * info.channels
        const [r, g, b] = [data[p], data[p + 1], data[p + 2]]
        n++
        if (!(b > g + 4) && (r + g + b) / 3 < 235) ok++
        if (ry === 0.70) { R += r; G += g; B += b; N++ }
      }
      walk = Math.min(walk, ok / n)
    }
    return { rough, walk, rgb: [R / N, G / N, B / N] as [number, number, number] }
  }
  const hue = (r: number, g: number, b: number) => {
    const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m
    if (!d) return null
    const h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4
    return ((h * 60) + 360) % 360
  }
  const sat = (r: number, g: number, b: number) => {
    const M = Math.max(r, g, b); return M ? (M - Math.min(r, g, b)) / M : 0
  }
  const sep = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d) }
  const scenes = () => [...new Set([...Array(RUN_LENGTH)].map((_, i) => slotAt(i).scene))]

  it('every scene holds OPEN ground where the feet land — not foliage', async () => {
    for (const s of scenes()) {
      const m = await measure(s)
      expect(m.rough, `${s}: roughness ${m.rough.toFixed(2)}`).toBeLessThan(4)
      expect(m.walk, `${s}: walkable`).toBeGreaterThan(0.92)
    }
  })

  /**
   * ⚠️ **THE CHECK THIS CHAPTER TURNS ON.** A coin set cannot change its hue — copper 18°, gold 40°,
   * silver hueless — so it owns the whole warm-earth band, which is what open ground is made of.
   * Milo (hue 30° / sat .53) is inside it too. Six backdrops were generated for this chapter and
   * FIVE collided; a golden common measured 2° from gold and a terracotta square 1° from copper.
   * Separation may be in HUE or in SATURATION — never neither.
   */
  it('Milo is never camouflaged by the ground he stands on', async () => {
    /**
     * ⚠️ **THE THRESHOLD IS DERIVED FROM TWO MEASURED POPULATIONS, NOT PICKED TO ADMIT THIS ART.**
     * Scenes that ship and demonstrably work: `garden_meadow` **46°**, `open_clearing` **45°**.
     * Scenes rejected during this chapter's art pass, all invisible: **2°, 4°, 6°, 10°, 16°**.
     * A line at 40 sits clear of both groups and would still have rejected every one of the five.
     * The two new greens are the closest survivors at **41–43°**, which is recorded rather than
     * hidden — tighten this if a founder ever says Milo is hard to pick out on them.
     */
    const MILO_HUE = 30, MILO_SAT = 0.53
    for (const s of scenes()) {
      const { rgb } = await measure(s)
      const h = hue(...rgb), sa = sat(...rgb)
      const hueOk = h == null ? true : sep(h, MILO_HUE) >= 40
      const satOk = Math.abs(sa - MILO_SAT) >= 0.22
      expect(hueOk || satOk,
        `${s}: ground hue ${h?.toFixed(0)}° sat ${sa.toFixed(2)} against Milo 30°/0.53 — separated by neither`,
      ).toBe(true)
    }
  })
})

describe('nothing says the answer before the commit', () => {
  it('no ASK line names the price or the coin count', () => {
    // The banner carries the price as its lead; the instruction must not restate it, and must never
    // say how many coins the answer takes — that is the whole of what `fewest` asks.
    const src = require('node:fs').readFileSync(
      join(process.cwd(), 'src', 'features', 'chapters', 'story', 'CoinShop.tsx'), 'utf8') as string
    const asks = src.slice(src.indexOf('export const ASK'), src.indexOf('// ─── The round'))
    expect(asks).not.toMatch(/\$\{/)          // no interpolation at all: nothing derived from the round
  })

  it('the chapter mounts a rotate gate and has no world picker', () => {
    const src = require('node:fs').readFileSync(
      join(process.cwd(), 'src', 'features', 'chapters', 'story', 'CoinShop.tsx'), 'utf8') as string
    // ⚠️ Grepping for the NAME is not enough — mutation-testing walked straight through
    // `if (false) return <RotateGate …>`, which is the same fault as a gate that reads a chapter's
    // data instead of how it indexes it. Assert the GUARD, not the import.
    expect(src).toMatch(/if\s*\(needsRotate\)\s*return\s*<RotateGate/)
    expect(src).not.toMatch(/WorldSelect/)
    // emoji belong in the UI layer only, never in the painted world
    expect(src).not.toMatch(/emoji/)
  })
})

describe('every kind is reachable, and the pools grow', () => {
  it('each tier draws every kind it declares', () => {
    for (const d of TIERS) {
      const got = new Set<QKind>()
      for (let i = 0; i < DRAWS * 2; i++) got.add(makeRound(d, i % 10).kind)
      for (const k of new Set(KINDS[d])) expect(got.has(k), `tier ${d} never drew ${k}`).toBe(true)
    }
  })
  it('the pool widens with the tier', () => {
    expect(POOL[1].length).toBeLessThan(POOL[2].length)
    expect(POOL[2].length).toBeLessThan(POOL[3].length)
    for (const d of TIERS) expect(POOL[d]).toContain(1)   // or a price could be unpayable
  })
})
