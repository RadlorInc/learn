/**
 * CoinShop (6–8 · money) — the PAY-IT gate, now covering the market walk.
 *
 * The chapter it replaced shipped one fault this file exists to make impossible again: **every coin
 * carried its own value as a code-drawn numeral, and the answer was the sum off three chips.**
 * Replace each coin sprite with a bare numeral and all thirty questions still worked — it was
 * `5 + 1 + 1` wearing coins. So the gate checks the thing that actually discriminates: that most
 * rounds ask the child to BUILD an amount, and that a `fewest` round always has a strictly better
 * answer than the set it was generated from.
 *
 * The geometry half was rewritten with the chapter. It no longer asserts a code-drawn counter's
 * constants; it asserts the two things the market walk turns on — that a keeper strip lands back
 * inside its own painting, and that the coins and Milo are never camouflaged by the ground.
 *
 * It drives the SAME exported functions the scene renders from rather than re-implementing them.
 * ⚠️ A gate that reads a chapter's DATA cannot see how the chapter INDEXES it — hence `stallAt`.
 */
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  makeRound, fewestFor, POOL, KINDS, VALUES, pileFor, poolFor, openerFor, missFor, askFor, ASK, ASK_PILE,
  type QKind, type CoinValue,
} from '@/features/chapters/story/CoinShop'
import { numberToWords } from '@/features/chapters/lessons/_kit'
import {
  STALLS, stallAt, RUN_LENGTH, DEMO_SLOTS, GUIDED_SLOT, scoredSlot,
  SCENE_W, SCENE_H, coverFit, fitFor, groundPxFor, miloHFor, miloHalfPct,
  PURSE_MAX, CARD_BAND, cardMetrics, MILO_X, PAY_X, aOrAn,
  SHOPPERS, shopperAt, SHOPPER_X, SHOPPER_LIFT, SHOPPER_SCALE,
} from '@/features/chapters/story/market'
import { bannerBottom } from '@/features/chapters/story/yard'
import { hasSheet, aspectOf, CAST } from '@/features/chapters/story/critters'

const ASSETS = join(process.cwd(), 'public', 'assets')
const src = () => require('node:fs').readFileSync(
  join(process.cwd(), 'src', 'features', 'chapters', 'story', 'CoinShop.tsx'), 'utf8') as string
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
  /**
   * ⚠️ **EVERY ROUND IS ANSWERED BY BUILDING AN AMOUNT ON THE CARD.** A `read` rung that typed its
   * total on a number pad used to sit at every tier, and once the coins moved into the card it had
   * nowhere to draw its pile — it asked *"how much money is that?"* over an empty screen. Reading a
   * pile is back (`asPile`), but as a way of STATING the price, not as a second answering surface: the
   * gesture is still lay-coins-and-pay. This is what stops a pad drifting back in as one quiet entry.
   */
  it('every round at every tier asks the child to BUILD an amount with coins', () => {
    for (const d of TIERS) {
      expect(KINDS[d].length, `tier ${d}`).toBeGreaterThan(0)
      for (const k of KINDS[d]) expect(['pay', 'fewest'], `tier ${d}`).toContain(k)
    }
    for (const d of TIERS) for (let i = 0; i < DRAWS; i++)
      expect(['pay', 'fewest'], `tier ${d}`).toContain(makeRound(d, i % 10).kind)
  })

  it('`fewest` appears only where a big coin makes it a real decision', () => {
    // At L1 the pool is 1 and 5 and "fewest" is barely a choice; the 25 is what makes it one.
    expect(KINDS[1]).not.toContain('fewest')
    expect(KINDS[3]).toContain('fewest')
    expect(POOL[3]).toContain(25)
  })

  it('every price is payable from its own tier pool, inside the card', () => {
    for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
      const r = makeRound(d, i % 10)
      expect(r.price, `tier ${d}`).toBeGreaterThanOrEqual(2)
      const need = fewestFor(r.price, POOL[d]).length
      expect(need, `tier ${d} price ${r.price} needs ${need} coins`).toBeLessThanOrEqual(PURSE_MAX)
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

  /**
   * ⚠️ THE READ DIRECTION. The keeper states his price either as a numeral or as the pile in `shown`,
   * and the pile is the chapter's only way of asking *how much is this?* — the direction it lost when
   * the number pad went. Four things have to hold or the pile is not a question:
   */
  it('the pile a keeper holds out really IS the price', () => {
    // Otherwise the coins on screen and the amount being graded are two different numbers, and the
    // round is unwinnable for a child who reads it correctly.
    for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
      const r = makeRound(d, i % 10)
      expect(r.shown.length, `tier ${d}`).toBeGreaterThan(0)
      expect(r.shown.reduce((s, v) => s + v, 0), `tier ${d} price ${r.price}`).toBe(r.price)
    }
  })

  it('a PILE round never says its amount — not even in the miss line', () => {
    // The opener is only half of it: the line after a wrong payment is where the target most easily
    // leaks back out, and on a pile round that ends the question the child was asked.
    //
    // ⚠️ Asserted as INDEPENDENCE, not by searching the sentence for the number's name. A substring
    // check reports "seventeen" as leaking "seven" — the same trap as a regex matching `weigh` inside
    // `weight`, which this repo has already been burned by. A line that does not change when the
    // price changes cannot be naming the price, and that is exact.
    const laid: CoinValue[] = [1]                    // one penny: never the right total
    for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
      const r = makeRound(d, i % 10)
      const cheap = missFor({ ...r, price: 7 }, laid, 1)
      const dear = missFor({ ...r, price: 98 }, laid, 1)
      if (r.asPile) expect(cheap, 'the pile miss line varies with the target it must not name').toBe(dear)
      // ...and the numeral rounds MUST name it, which is what makes them the easier direction.
      else expect(cheap, 'the numeral miss line stopped naming the price').not.toBe(dear)
    }
  })

  it('a PILE round never says its amount — spoken or written', () => {
    // Naming the total is the answer handed over before the child has looked: chapter 4's green Ready
    // button in a spoken costume. The numeral rounds MUST say it, which is what makes them the easier
    // direction — so both halves are asserted here.
    for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
      const r = makeRound(d, i % 10)
      const line = openerFor(stallAt(r.slot), r)
      const words = numberToWords(r.price)
      if (r.asPile) {
        expect(line, `pile, price ${r.price}`).not.toContain(String(r.price))
        expect(line.toLowerCase(), `pile, price ${r.price}`).not.toContain(words.toLowerCase())
        expect(askFor(r), `pile ask, ${r.kind}`).toBe(ASK_PILE[r.kind])
      } else {
        expect(line, `numeral, price ${r.price}`).toContain(words)
        expect(askFor(r), `numeral ask, ${r.kind}`).toBe(ASK[r.kind])
      }
    }
  })

  it('the demo, the card and the grader agree about what is in the purse', () => {
    // ⚠️ The demo used to derive its pool from `shown.includes(25)` — a proxy for the price, not the
    // price. Changing the second demo's pile to six 5s silently dropped it to a pool with no 25, so
    // "the same thirty in only TWO coins" became three tens and **the 25, the entire payload of
    // `fewest`, vanished from the teaching** while every spoken line stayed true. Found on a
    // screenshot. One function decides it now, and nothing may reintroduce a second.
    expect(src(), 'the pool is derived from the pile again, not the price').not.toContain('includes(25)')
    expect(poolFor(30), 'the 30-in-two-coins demo cannot reach a 25').toContain(25)
    expect(fewestFor(30, poolFor(30)).length, 'the fewest demo no longer pays 30 in two').toBe(2)
    // and the purse always holds enough kinds to express the answer the round grades against
    for (const d of TIERS) for (let i = 0; i < DRAWS; i++) {
      const r = makeRound(d, i % 10)
      for (const v of fewestFor(r.price, poolFor(r.price)))
        expect(poolFor(r.price), `price ${r.price} needs a ${v} the purse does not offer`).toContain(v)
    }
  })

  it('the keeper owns the miss line, so no generic pill lands on his market', () => {
    // The chapter retries in place and only reports a round once it has been SOLVED, so SkillBeat's
    // centred cue arrived over the keeper's own "That is six. The pot is yours!" and contradicted it.
    // The gating in SkillBeat itself is asserted by tickTockClock.test.ts.
    expect(src(), 'the shared centred cue is back over the market').toMatch(/ownsFeedback: true/)
    // ...and it only opts out because it says something BETTER — written as well as spoken, since
    // speech alone is silence on the many devices with no usable voice.
    expect(src(), 'nothing writes the miss line any more').toContain('setNote(s); speak(s)')
  })

  it('the two directions ALTERNATE, so consecutive rounds differ in what is read', () => {
    // Random would clump, and a run that opens on the harder direction meets it before the guided
    // round's gesture has been done once. Round 0 is a numeral on purpose.
    expect(pileFor(0)).toBe(false)
    const dirs = Array.from({ length: 10 }, (_, i) => makeRound(2, i).asPile)
    expect(new Set(dirs).size, 'a whole run drew only one direction').toBe(2)
    for (let i = 1; i < dirs.length; i++)
      expect(dirs[i], `rounds ${i - 1} and ${i} read the same way`).not.toBe(dirs[i - 1])
  })

  it('`fewestFor` really is the fewest — checked against exhaustive DP', () => {
    for (const d of TIERS) for (let p = 2; p <= 99; p++) {
      expect(fewestFor(p, POOL[d]).length, `tier ${d} price ${p}`).toBe(trueFewest(p, POOL[d]))
      expect(fewestFor(p, POOL[d]).reduce((s, v) => s + v, 0), `tier ${d} price ${p} sums`).toBe(p)
    }
  })

})

describe('the walk', () => {
  it('covers demo, guided and ten scored rounds without running off the end', () => {
    expect(RUN_LENGTH).toBeGreaterThanOrEqual(DEMO_SLOTS + 1 + 10)
    for (let r = 0; r < 10; r++) {
      expect(scoredSlot(r), `round ${r}`).toBeGreaterThan(GUIDED_SLOT)
      expect(scoredSlot(r), `round ${r}`).toBeLessThan(RUN_LENGTH)
    }
  })

  /**
   * ⚠️ **CONSECUTIVE-DIFFER, NOT ALL-DISTINCT, AND THAT IS DELIBERATE.** Seven of the ten generated
   * stalls are usable (`hats` and `toys` carry a hard-edged blank third where Milo's post is;
   * `honey`'s ground line is 0.80 against a 0.772 cap), so thirteen slots cannot all be different
   * and the honest rule is the craft doc's own. An all-distinct gate is what once put a whole yard
   * on a pond.
   */
  it('consecutive slots never repeat a stall', () => {
    for (let i = 1; i < RUN_LENGTH; i++)
      expect(stallAt(i).key, `slots ${i - 1}/${i}`).not.toBe(stallAt(i - 1).key)
  })

  it('every stall on the walk is visited, so no keeper is built and never seen', () => {
    const walked = new Set([...Array(RUN_LENGTH)].map((_, i) => stallAt(i).key))
    expect(walked.size).toBe(STALLS.length)
  })

  it('every scene and every good is a file that exists', () => {
    for (const st of STALLS) {
      expect(existsSync(join(ASSETS, 'backgrounds', st.scene)), st.scene).toBe(true)
      expect(existsSync(join(ASSETS, 'objects', st.good)), st.good).toBe(true)
    }
  })

  /**
   * ⚠️ **THE STALLHOLDERS ARE PART OF THE PAINTING, AND THE STRIPS BESIDE THEM ARE DELIBERATELY
   * UNUSED.** They were wired up and taken out again: a character generated inside its scene has no
   * alpha, so it can only wiggle in its own rectangle — measured, 93–96% of the frame held still.
   * If a keeper ever animates again it has to be a real cutout, so this asserts the chapter is not
   * quietly reaching for the opaque strips.
   */
  it('no keeper strip is rendered', () => {
    expect(src()).not.toMatch(/keeper_/)
  })

  it('nothing but Milo is placed out on the open ground', () => {
    // ⚠️ The founder's call: stop scattering elements across the empty grass. The goods and the
    // price are in the keeper's bubble, the coins are in the card. If a second `position: fixed`
    // world element comes back, it needs a better reason than the cloth had.
    const world = src().slice(src().indexOf('function Scene({'), src().indexOf('// ─── What is said'))
    expect(world).not.toMatch(/position: 'fixed'/)
  })

  /**
   * ⚠️ **CAUGHT ON SCREEN: `candy_lollipop.png` MEASURES CHROMA 0.0.** Part of the library is
   * greyscale BY DESIGN, for the chapters that code-tint it — and it is not confined to the `pat_*`
   * prefix, so a name tells you nothing. Drawn raw it is a grey ghost on a price board. A sprite's
   * colour is a claim like its name; measure it before casting it.
   */
  it('no stall sells something drawn in greyscale', async () => {
    const sharp = (await import('sharp')).default
    for (const st of STALLS) {
      const { data, info } = await sharp(join(ASSETS, 'objects', st.good))
        .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      let chroma = 0, n = 0
      for (let p = 0; p < data.length; p += info.channels) {
        if (data[p + 3] <= 200) continue
        const [r, g, b] = [data[p], data[p + 1], data[p + 2]]
        chroma += Math.max(r, g, b) - Math.min(r, g, b); n++
      }
      expect(n, `${st.good} has no opaque pixels`).toBeGreaterThan(0)
      expect(chroma / n, `${st.good}: mean chroma ${(chroma / n).toFixed(1)}`).toBeGreaterThan(18)
    }
  })

  it('every stall names its goods with the right article', () => {
    // "Fox has a apple" was live on screen. It is spoken AND written, so it is the chapter's grammar
    // in front of a six-year-old learning to read.
    for (const st of STALLS)
      expect(aOrAn(st.one), `${st.one}`).toBe(/^[aeiou]/i.test(st.one) ? 'an' : 'a')
    expect(STALLS.some(s => aOrAn(s.one) === 'an'), 'no vowel-initial good, so this proves nothing').toBe(true)
  })

  /**
   * ⚠️ **A CREATURE WITHOUT A REGISTERED SHEET SILENTLY BECOMES A STILL, AND A STILL THAT TRAVELS IS
   * A STICKER BEING DRAGGED.** `SheetCell` falls back to a plain image, which is the right fallback
   * and completely invisible — the right creature, drawn, sliding. The shoppers are the only things
   * in this chapter that are properly animated, so this is the line between that claim and a lie.
   */
  it('every shopper has a REGISTERED drawn cycle, and they are all different', () => {
    for (const k of SHOPPERS) expect(hasSheet(k.src), k.src).toBe(true)
    expect(new Set(SHOPPERS.map(k => k.src)).size).toBe(SHOPPERS.length)
    // consecutive rounds must bring a different shopper, or the market reads as one person on a loop
    for (let i = 1; i < RUN_LENGTH; i++)
      expect(shopperAt(i).src, `slots ${i - 1}/${i}`).not.toBe(shopperAt(i - 1).src)
    // and every one of them is actually used across a run
    expect(new Set([...Array(RUN_LENGTH)].map((_, i) => shopperAt(i).src)).size).toBe(SHOPPERS.length)
  })

  /**
   * ⚠️ **A SPRITE'S FACING IS PER SPRITE, AND IT SHIPPED WRONG.** Told they all faced left, a duck
   * and a squirrel walked backwards on screen — and a script scoring ink mass in the top third
   * agreed with me, because a squirrel's bushy tail fills the top-left and outweighs its head. The
   * app's own `CAST` already records this for the creatures it carries, so the two sources are
   * pinned together here rather than both being guessed.
   */
  it('every shopper faces the way critters.tsx already says it does', () => {
    let checked = 0
    for (const k of SHOPPERS) {
      const known = CAST.find(c => c.src === k.src)
      if (!known) continue
      checked++
      expect(k.facesLeft, `${k.src}: SHOPPERS says ${k.facesLeft}, CAST says ${!!known.facesLeft}`)
        .toBe(!!known.facesLeft)
    }
    expect(checked, 'no shopper overlaps CAST, so this proves nothing').toBeGreaterThan(1)
    // and they are not all the same, which is what the blanket answer assumed
    expect(new Set(SHOPPERS.map(k => k.facesLeft)).size).toBe(2)
  })

  it('the shoppers are sized against each other, not all to one height', () => {
    // A chick drawn the height of a lamb is the craft doc's own "an ant the size of a lamb".
    expect(new Set(SHOPPERS.map(k => k.scale)).size).toBeGreaterThan(3)
    for (const k of SHOPPERS) expect(k.scale, k.src).toBeGreaterThan(0.5)
    expect(Math.max(...SHOPPERS.map(k => k.scale))).toBeGreaterThan(Math.min(...SHOPPERS.map(k => k.scale)) * 1.5)
  })

  it('Milo still has a REGISTERED drawn cycle', () => {
    // Without one `SheetCell` silently falls back to a still, and a still that travels is a sticker
    // being dragged — invisible in a screenshot. He walks in and out of every round.
    expect(hasSheet('/assets/characters/milo_side.png')).toBe(true)
  })

  it('every coin sprite exists', () => {
    for (const v of VALUES)
      expect(existsSync(join(ASSETS, 'objects', v === 1 ? 'coin_copper.png' : v === 5 ? 'coin_silver.png' : 'coin_gold.png')), `coin ${v}`).toBe(true)
  })
})

describe('the picture is one geometry', () => {
  it('every scene really is the size the cover transform assumes', async () => {
    const sharp = (await import('sharp')).default
    for (const st of STALLS) {
      const m = await sharp(join(ASSETS, 'backgrounds', st.scene)).metadata()
      expect([m.width, m.height], st.scene).toEqual([SCENE_W, SCENE_H])
    }
  })

  /**
   * ⚠️ **THE BACKDROP AND THE GROUND ARE ONE GEOMETRY.** A percentage of the viewport is not a
   * percentage of the image once the scene is cropped, so anything pinned to the painting has to go
   * through the same transform the painting is given.
   */
  it('the fit still covers the frame, and lands the scene GROUND on the ground line', () => {
    for (const st of STALLS) for (const [vw, vh] of SIZES) {
      const f = fitFor(st, vw, vh, CARD_BAND(vh))
      const tag = `${st.key} ${vw}x${vh}`
      expect(f.ox, `${tag} ox`).toBeLessThanOrEqual(0.001)
      expect(f.oy, `${tag} oy`).toBeLessThanOrEqual(0.001)
      expect(SCENE_W * f.s + f.ox, `${tag} covers right`).toBeGreaterThanOrEqual(vw - 0.01)
      expect(SCENE_H * f.s + f.oy, `${tag} covers bottom`).toBeGreaterThanOrEqual(vh - 0.01)
      // the painted grass and the line Milo stands on are the same line
      expect(f.oy + st.ground * SCENE_H * f.s, `${tag} scene ground vs groundPx`)
        .toBeCloseTo(f.groundPx, 4)
      // and it is never SMALLER than plain cover — that would letterbox the picture
      expect(f.s, `${tag} vs cover`).toBeGreaterThanOrEqual(coverFit(vw, vh).s - 1e-9)
    }
  })
})

describe('the market fits on the screen it is drawn on', () => {
  it('the ground never reaches into the answering controls, at any stall or size', () => {
    for (const st of STALLS) for (const [vw, vh] of SIZES) {
      const g = groundPxFor(st, vw, vh, CARD_BAND(vh))
      expect(g, `${st.key} ${vw}x${vh}`).toBeLessThanOrEqual(vh - CARD_BAND(vh) - 14)
      expect(g, `${st.key} ${vw}x${vh} above the banner`).toBeGreaterThan(bannerBottom(vh))
    }
  })

  it('Milo never stands with his head in the banner, and is never a speck', () => {
    for (const st of STALLS) for (const [vw, vh] of SIZES) {
      const g = groundPxFor(st, vw, vh, CARD_BAND(vh))
      const h = miloHFor(vh, g, bannerBottom(vh))
      expect(h, `${st.key} ${vw}x${vh}`).toBeGreaterThanOrEqual(74)
      expect(h, `${st.key} ${vw}x${vh} vs room`).toBeLessThanOrEqual(Math.max(74, g - bannerBottom(vh) - 8) + 0.5)
    }
  })

  it('the keeper who asks the question is still on screen, at every stall and size', () => {
    // ⚠️ He is the question region now. A bubble pinned to a mouth that has been cropped away is
    // worse than no bubble, so the mouth must land inside the frame with room for the cloud.
    for (const st of STALLS) for (const [vw, vh] of SIZES) {
      const f = fitFor(st, vw, vh, CARD_BAND(vh))
      const my = f.oy + st.say.y * f.s
      const mx = f.ox + st.say.x * f.s
      expect(my, `${st.key} ${vw}x${vh} mouth y`).toBeGreaterThan(0)
      expect(my, `${st.key} ${vw}x${vh} mouth y vs ground`).toBeLessThan(f.groundPx)
      expect(mx, `${st.key} ${vw}x${vh} mouth x`).toBeGreaterThan(0)
      // and the bubble grows RIGHT from the mouth, so it needs real room to grow into
      expect(vw - mx, `${st.key} ${vw}x${vh} room for the bubble`).toBeGreaterThan(vw * 0.35)
    }
  })

  it('a full card of coins fits the width it is given', () => {
    // One row: eight tray coins, four purse coins, back and Pay. If that overflows, the Pay button
    // leaves the screen and the round cannot be committed. Driven through the SAME function the card
    // lays itself out with.
    for (const [vw, vh] of SIZES) {
      const m = cardMetrics(vw, CARD_BAND(vh))
      expect(m.width, `${vw}x${vh}: card needs ${m.width.toFixed(0)}px`).toBeLessThan(vw - 16)
      // ⚠️ 26, not 18: a coin prints its value at 42% of its size, so a 22px disc gives a 9px
      // numeral — and the numeral is the whole affordance. Caught on screen in the tray.
      expect(m.tray, `${vw}x${vh} tray coin`).toBeGreaterThanOrEqual(26)
      expect(m.px, `${vw}x${vh} purse coin`).toBeGreaterThanOrEqual(26)
    }
  })
})

describe('the ground is open, and nothing on it is camouflaged', () => {
  /**
   * Measured at each stall's OWN ground line and across the open grass Milo actually stands on
   * (x 56–95%) — ⚠️ the shared 0.66–0.78 band placeValue uses cuts through the COUNTER on these
   * scenes and reports 8–13 roughness for pictures that are in fact clean. The band was wrong, not
   * the art; that is this doc's oldest rule broken from the inside.
   */
  async function measure(st: { scene: string; ground: number }) {
    const sharp = (await import('sharp')).default
    const { data, info } = await sharp(join(ASSETS, 'backgrounds', st.scene))
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const at = (x: number, y: number) => {
      const p = (y * info.width + x) * info.channels
      return [data[p], data[p + 1], data[p + 2]] as [number, number, number]
    }
    // ⚠️ **THE WHOLE ROW IS THE WRONG QUESTION HERE.** placeValue's version of this sweeps x 4–97%,
    // which is right for a scene that is all field — and on these it walks straight through the
    // STALL, reporting roughness 3.7–7.5 for pictures whose ground is in fact glassy. The stall is
    // meant to be there. What has to be open is the part Milo stands on, so every sample below is
    // taken over x 56–95%. Same correction, one axis along, as reading the ground line per scene.
    const X0 = 0.56, X1 = 0.95
    let rough = 0, walk = 1
    let R = 0, G = 0, B = 0, N = 0
    for (const ry of [st.ground - 0.02, st.ground, st.ground + 0.02, st.ground + 0.04]) {
      const y = Math.floor(ry * info.height)
      const v: number[] = []
      for (let f = X0; f <= X1; f += 0.004) {
        const [r, g, b] = at(Math.floor(f * info.width), y)
        v.push((r + g + b) / 3)
      }
      let d = 0
      for (let k = 1; k < v.length; k++) d += Math.abs(v[k] - v[k - 1])
      rough = Math.max(rough, d / (v.length - 1))

      let ok = 0, n = 0
      for (let f = X0; f <= X1; f += 0.01) {
        const [r, g, b] = at(Math.floor(f * info.width), y)
        n++
        if (!(b > g + 4) && (r + g + b) / 3 < 235) ok++
        R += r; G += g; B += b; N++
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

  it('every stall holds OPEN ground where the feet land — not foliage', async () => {
    for (const st of STALLS) {
      const m = await measure(st)
      expect(m.rough, `${st.key}: roughness ${m.rough.toFixed(2)}`).toBeLessThan(4)
      expect(m.walk, `${st.key}: walkable`).toBeGreaterThan(0.92)
    }
  })

  /**
   * ⚠️ **THE INSTRUMENT WAS WRONG BEFORE THE THRESHOLD WAS, AND THAT IS THE FINDING.** The previous
   * version of this check modelled Milo as one hue — the saturation-weighted MEAN of his opaque
   * pixels, 30°. He is trimodal: histogrammed, **52% of him is orange 15–30°, 17% is olive 45–60°
   * and 16% is teal 180–195°**. A mean over that returns a colour that is barely on him, which is
   * exactly the fault this repo already records for bimodal SCENES, arrived at from the sprite side.
   * So the check is against his DOMINANT cluster (centre 22°), not his mean.
   *
   * ⚠️ **AND THE THRESHOLD HAD TO BE RE-DERIVED, BECAUSE BOTH THE REFERENCE AND THE SAMPLE REGION
   * CHANGED — CARRYING THE OLD 40 OVER WOULD HAVE BEEN THE ARBITRARY CHOICE, NOT THIS.** Under THIS
   * instrument the two populations are: scenes the art pass rejected as invisible — a golden common
   * at 42° → **20**, a terracotta square at 20° → **2** — against the seven that ship, which measure
   * **39.8 (pots) · 41.6 (fish) · 42.7 (fruit) · 43.8 (cheese) · 47.6 (bread) · 51.0 (flowers) ·
   * 55.4 (sweets)**. 35 sits clear of both and still fails every rejected scene. `pots` is the
   * closest survivor at 39.8 and is written down here rather than hidden; tighten this if a founder
   * ever says Milo is hard to pick out on the pottery stall.
   */
  it('Milo is never camouflaged by the ground he stands on', async () => {
    const MILO_HUE = 22, MILO_SAT = 0.53, MIN_SEP = 35
    for (const st of STALLS) {
      const { rgb } = await measure(st)
      const h = hue(...rgb), sa = sat(...rgb)
      const hueOk = h == null ? true : sep(h, MILO_HUE) >= MIN_SEP
      const satOk = Math.abs(sa - MILO_SAT) >= 0.22
      expect(hueOk || satOk,
        `${st.key}: ground hue ${h?.toFixed(0)}° sat ${sa.toFixed(2)} against Milo 22°/0.53 — separated by neither`,
      ).toBe(true)
    }
  })

})

describe('nothing says the answer before the commit', () => {
  it('no ASK line names the price or the coin count', () => {
    // The banner carries the price as its lead; the instruction must not restate it, and must never
    // say how many coins the answer takes — that is the whole of what `fewest` asks.
    const s = src()
    const asks = s.slice(s.indexOf('export const ASK'), s.indexOf('// ─── The round'))
    expect(asks).not.toMatch(/\$\{/)          // no interpolation at all: nothing derived from the round
  })

  it('the chapter mounts a rotate gate and has no world picker', () => {
    // ⚠️ Grepping for the NAME is not enough — mutation-testing walked straight through
    // `if (false) return <RotateGate …>`, which is the same fault as a gate that reads a chapter's
    // data instead of how it indexes it. Assert the GUARD, not the import.
    expect(src()).toMatch(/if\s*\(needsRotate\)\s*return\s*<RotateGate/)
    expect(src()).not.toMatch(/WorldSelect/)
    // emoji belong in the UI layer only, never in the painted world
    expect(src()).not.toMatch(/emoji/)
  })

  it('the scene travels through Arrive, never a hand-rolled transition on a position', () => {
    // A `transition: left` beside `Arrive` is how a dozen creatures ended up sliding with their feet
    // parked in HopAlong. Milo's three legs are three journeys.
    // the quote is load-bearing: without it this pattern matches its own prose above
    expect(src()).not.toMatch(/transition:\s*['"`]\s*left/)
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
