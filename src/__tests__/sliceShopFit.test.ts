/**
 * The gate for SliceShop (6–8 fractions, verb FIT IT).
 *
 * It drives [slice.ts](../features/chapters/story/slice.ts) plus the real `makeFrRound`, so it can
 * never agree with a second copy of the constants while the screen falls apart. Where it has to
 * check something only the component can express (that no scene is one TickTock's day already
 * claims), it reads the OTHER chapter's real table rather than a list retyped here.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import {
  ORDERS, DENS, MILO, MILO_ASPECT,
  askFor, onFor, densFor, pickDen, groupNFor, piecesFor, perShare, isSolved,
  makeFrRound, orderOf, friendsShown, FRIEND_NAMES, askTextFor, revealFor, missFor, denWord, denPlural, numWord,
  layoutFor, wholeSize, chromeTop,
  type Den, type FrRound,
} from '@/features/chapters/story/slice'
import { DAY } from '@/features/chapters/story/clock'
import { SHEETS } from '@/features/chapters/story/canvas/sheets'

const SIZES: Array<[number, number]> = [
  [640, 320], [667, 375], [740, 360], [812, 375], [1024, 400], [1024, 620],
  [1280, 720], [1440, 900], [1920, 1080],
]
const TIERS: Array<1 | 2 | 3> = [1, 2, 3]
const ROUNDS = Array.from({ length: 10 }, (_, i) => i)

/** A deterministic stand-in for Math.random, so a draw-dependent assertion is not a coin flip. */
const seq = (...xs: number[]) => { let i = 0; return () => xs[i++ % xs.length] }

describe('the round is well posed', () => {
  it('a fit round hands over exactly one piece; a take round is a real choice', () => {
    for (const d of TIERS) for (const round of ROUNDS) {
      const r = makeFrRound(d, round)
      const pieces = piecesFor(r)
      if (r.ask === 'fit') expect(pieces).toEqual([r.den])
      else expect(pieces.length).toBeGreaterThanOrEqual(2)
      // The answer must always be reachable, in either direction.
      expect(pieces).toContain(r.den)
    }
  })

  it('a pile always divides exactly, and stays countable by eye', () => {
    for (const d of TIERS) for (const round of ROUNDS) for (let i = 0; i < 40; i++) {
      const r = makeFrRound(d, round)
      if (r.on !== 'group') { expect(r.n).toBe(0); continue }
      expect(r.n % r.den).toBe(0)
      expect(perShare(r)).toBeGreaterThanOrEqual(1)
      expect(r.n).toBeLessThanOrEqual(12)
    }
  })

  /**
   * ⚠️ A pile only one denominator divides would offer exactly ONE handful — a take round with no
   * decision in it. That is why nine cookies is not in the table.
   */
  it('every pile size offers at least two handfuls to choose between', () => {
    for (const den of DENS) for (let i = 0; i < 60; i++) {
      const n = groupNFor(den)
      const others = DENS.filter(x => x !== den && n % x === 0)
      expect(others.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('both directions are asked, alternating, so consecutive rounds differ in gesture', () => {
    for (const round of ROUNDS) expect(askFor(round)).toBe(round % 2 === 0 ? 'fit' : 'take')
    expect(new Set(ROUNDS.map(askFor)).size).toBe(2)
  })

  /** A fraction OF a quantity is the take direction — "how many handfuls fit in the pile" is
   *  division wearing a fraction's clothes. */
  it('a pile is only ever a take round, and never appears at the gentlest tier', () => {
    for (const round of ROUNDS) {
      expect(onFor(1, round)).toBe('shape')
      for (const d of [2, 3] as const) if (onFor(d, round) === 'group') expect(askFor(round)).toBe('take')
    }
    expect(ROUNDS.some(r => onFor(2, r) === 'group')).toBe(true)
    expect(ROUNDS.some(r => onFor(2, r) === 'shape')).toBe(true)
  })
})

describe('the ladder', () => {
  /** Halves and quarters both come from halving, which a six-year-old can do with their hands; a
   *  third cannot be reached that way and is the one that has to be taught. */
  it('L1 leaves thirds out, and every later tier is a superset', () => {
    expect(densFor(1)).toEqual([2, 4])
    expect(densFor(1).every(x => densFor(2).includes(x))).toBe(true)
    expect(densFor(2)).toEqual([...DENS])
    expect(densFor(3)).toEqual([...DENS])
  })

  /**
   * ⚠️ THE ROUND BUDGET, WHICH IS WHY `pickDen` IS NOT A UNIFORM DRAW. Promotion takes 3 correct in
   * a row and mastery ends the run on a streak of 6, so a strong child gets roughly three rounds at
   * L1, ONE at L2 and TWO at L3. A uniform draw loses thirds — the only denominator L1 never shows.
   */
  it('a scarce round is spent on a denominator the child has NOT met', () => {
    expect(pickDen(2, ['2', '4'])).toBe(3)
    expect(pickDen(2, ['2'])).toBe(3)   // hardest-first among the unmet
    expect(pickDen(3, ['3', '2'])).toBe(4)
    expect(pickDen(1, ['2'])).toBe(4)   // never offers a third at L1, even when it is unmet
  })

  it('…and goes back to random once every denominator has been met', () => {
    // Deliberate-for-ever would lock the generator onto thirds and starve makeDistinct.
    const seen = new Set(Array.from({ length: 60 }, () => pickDen(3, ['2', '3', '4'])))
    expect(seen.size).toBeGreaterThan(1)
  })

  /** The closed set the mastery exit must wait for — simulated against the real generator. */
  it('a strong run covers all three denominators inside the rounds it actually gets', () => {
    // A generous reading of the budget: three L1 rounds, one L2, two L3.
    const tiers: Array<1 | 2 | 3> = [1, 1, 1, 2, 3, 3]
    const asked: string[] = []
    tiers.forEach((d, round) => {
      const r = makeFrRound(d, round, asked, seq(0.1, 0.5, 0.9))
      asked.push(String(r.den))
    })
    expect(new Set(asked)).toEqual(new Set(['2', '3', '4']))
  })
})

describe('the grader is one rule, and it is the whole payload', () => {
  const shape = (den: Den): FrRound => ({ slot: 0, den, on: 'shape', n: 0, ask: 'take', d: 2 })

  it('exactly full with the right piece', () => {
    expect(isSolved(shape(3), { den: 3, laid: 3 })).toBe(true)
    expect(isSolved(shape(3), { den: 3, laid: 2 })).toBe(false)  // a gap
    expect(isSolved(shape(3), { den: 3, laid: 4 })).toBe(false)  // overflow
  })

  /**
   * ⚠️ THE CHECK THAT MATTERS. A child asked for thirds who reaches for the HALF piece can fill the
   * whole exactly with two of them — full, and wrong. A grader that counted pieces alone would mark
   * the central misconception of this chapter correct.
   */
  it('a full whole built from the wrong piece is NOT solved', () => {
    expect(isSolved(shape(3), { den: 2, laid: 2 })).toBe(false)
    expect(isSolved(shape(2), { den: 4, laid: 4 })).toBe(false)
    expect(isSolved(shape(4), { den: 2, laid: 2 })).toBe(false)
  })

  /**
   * ⚠️ AND THE CASES WHERE THE **COUNT ALONE LOOKS RIGHT** — which is the only place a grader that
   * dropped the piece check actually differs, and the reason this test exists in a second form.
   * Mutation-testing found the first version blind to exactly this: with `got.den === r.den` removed,
   * every case above still failed for the unrelated reason that the counts did not match either, so
   * the gate reported a hole it could not see. A child asked for HALVES who lays two QUARTERS has a
   * board that is only half full and a count that matches the answer.
   */
  it('…including when the count happens to equal the answer', () => {
    expect(isSolved(shape(2), { den: 4, laid: 2 })).toBe(false)   // half-full of quarters
    expect(isSolved(shape(3), { den: 2, laid: 3 })).toBe(false)   // three halves — overflowing
    expect(isSolved(shape(4), { den: 3, laid: 4 })).toBe(false)
    // and the honest pass is still a pass
    expect(isSolved(shape(4), { den: 4, laid: 4 })).toBe(true)
  })

  it('the miss line names the SIZE relation, in the right direction', () => {
    // asked for a third, reached for the bigger half → too big, and someone would miss out
    expect(missFor(shape(3), { den: 2, laid: 2 })).toMatch(/smaller/)
    expect(missFor(shape(3), { den: 2, laid: 2 })).toMatch(/friends are waiting/)
    // asked for a half, reached for the smaller quarter → too small
    expect(missFor(shape(2), { den: 4, laid: 4 })).toMatch(/bigger/)
    // right piece, wrong count → names WHO went without, and never mentions piece size
    expect(missFor(shape(3), { den: 3, laid: 2 })).toMatch(/Squirrel/)   // the third friend
    expect(missFor(shape(3), { den: 3, laid: 0 })).toMatch(/Bunny/)      // the first
    expect(missFor(shape(3), { den: 3, laid: 5 })).toMatch(/too many/)
    for (const laid of [1, 2, 4, 5]) expect(missFor(shape(3), { den: 3, laid })).not.toMatch(/smaller piece|bigger piece/)
  })
})

describe('nothing leaks the answer', () => {
  /**
   * A fit round must not say how many pieces fit; a take round must not say how big the piece is.
   * Each is the entire question in its own direction.
   */
  it('the ask never contains its own answer', () => {
    for (const d of TIERS) for (const round of ROUNDS) for (let i = 0; i < 20; i++) {
      const r = makeFrRound(d, round)
      const t = askTextFor(r).toLowerCase()
      if (r.ask === 'fit') {
        // it must not name the count, as a numeral or as a word
        expect(t).not.toMatch(new RegExp(`\\b${numWord(r.den)}\\b`))
        expect(t).not.toMatch(new RegExp(`\\b${r.den}\\b`))
        // …nor the fraction, which would be the same thing said another way
        expect(t).not.toContain(denWord(r.den))
      } else {
        // a take round names the fraction on purpose — that IS the question — but never the count
        // of things in one share, which is what a pile round is asking for.
        if (r.on === 'group') expect(t).not.toMatch(new RegExp(`\\b${numWord(perShare(r))}\\b`))
      }
    }
  })

  it('every line Milo says opens as a sentence', () => {
    // Both the ask and the reveal open with a number WORD, and `numWord` is lower case for
    // mid-sentence use — caught on screen reading "four friends want some orange".
    for (const d of TIERS) for (const round of ROUNDS) {
      const r = makeFrRound(d, round)
      for (const line of [askTextFor(r), revealFor(r)]) expect(line[0]).toBe(line[0].toUpperCase())
    }
  })

  it('the reveal states the answer, and reads as a sentence', () => {
    for (const d of TIERS) for (const round of ROUNDS) {
      const r = makeFrRound(d, round)
      const t = revealFor(r)
      expect(t.toLowerCase()).toContain(denWord(r.den))
      if (r.on === 'group') expect(t.toLowerCase()).toContain(numWord(perShare(r)))
      // both of these open with a number WORD, and `numWord` is lower case for mid-sentence use —
      // caught on screen reading "four equal pieces fit."
      expect(t[0]).toBe(t[0].toUpperCase())
    }
  })

  it('the words for a denominator are the ones a six-year-old is taught', () => {
    expect([2, 3, 4].map(d => denWord(d as Den))).toEqual(['half', 'third', 'quarter'])
    expect([2, 3, 4].map(d => denPlural(d as Den))).toEqual(['halves', 'thirds', 'quarters'])
  })
})

describe('the day at the shop', () => {
  it('runs straight through ten orders and never wraps back onto the one it opened with', () => {
    expect(ORDERS.length).toBe(10)
    for (const round of ROUNDS) expect(orderOf(round)).toBe(ORDERS[round])
    // …and past the end it holds, rather than starting the day again.
    expect(orderOf(14)).toBe(ORDERS[ORDERS.length - 1])
  })

  it('every scene is distinct, and consecutive orders never repeat a treat', () => {
    expect(new Set(ORDERS.map(o => o.scene)).size).toBe(ORDERS.length)
    expect(new Set(ORDERS.map(o => o.treat)).size).toBe(ORDERS.length)
    expect(new Set(ORDERS.map(o => o.item)).size).toBe(ORDERS.length)
  })

  /**
   * ⚠️ READ OFF TICKTOCK'S REAL TABLE, not a list retyped here — `kitchen_oven` and `kitchen_bakery`
   * were in this chapter before TickTock's day claimed them, and two 6–8 chapters sharing a backdrop
   * is the band's own no-repeat rule broken. A hand-copied list would go stale the day either
   * chapter changes a scene, which is exactly when this check has to fire.
   */
  it('no scene is one TickTock already uses', () => {
    const taken = new Set(DAY.map(s => s.scene))
    for (const o of ORDERS) expect(taken.has(o.scene)).toBe(false)
  })

  /** A fraction of a circle and a fraction of a strip are the two representations the curriculum
   *  asks for; a child who has only ever seen the pie chart has learned the picture. */
  it('both whole shapes are used, and neither is a token appearance', () => {
    const round = ORDERS.filter(o => o.shape === 'round').length
    const bar = ORDERS.filter(o => o.shape === 'bar').length
    expect(round).toBeGreaterThanOrEqual(3)
    expect(bar).toBeGreaterThanOrEqual(3)
  })

  it('every asset an order names is on disk', () => {
    const root = join(process.cwd(), 'public', 'assets')
    for (const o of ORDERS) {
      expect(() => readFileSync(join(root, 'backgrounds', o.scene))).not.toThrow()
      expect(() => readFileSync(join(root, 'objects', `${o.item}.png`))).not.toThrow()
      if (o.topping) expect(() => readFileSync(join(root, 'objects', `${o.topping}.png`))).not.toThrow()
    }
  })

  /**
   * ⚠️ PART OF THE LIBRARY IS GREYSCALE BY DESIGN AND IT IS NOT CONFINED TO THE `pat_*` PREFIX, so
   * the NAME tells you nothing. The version of this chapter being replaced put `candy_cupcake`
   * (measured chroma 0.0) on the party table, where it drew a grey ghost. Measured here rather than
   * kept as an allow-list, so a future swap is covered too.
   */
  /**
   * ⚠️ THE CAMOUFLAGE CHECK, AND IT IS THE ONE THAT NEEDED AN INSTRUMENT RATHER THAN AN EYE.
   *
   * Measured over the band the whole occupies, FIVE of the ten treats sat inside their own scene's
   * hue with no saturation gap either — loaf Δhue 10° Δsat 0.01, orange Δhue 3°, cheese Δhue 10°,
   * wafer Δsat 0.07, cake Δsat 0.08 — because every scene here is a food shop (warm) and every treat
   * is a food (warm). Neither side can move without lying, so the separation is in BRIGHTNESS, via
   * the pool `Board` lays under the whole. This pins the property that makes the pool work: every
   * treat has to be far brighter than it.
   */
  it('every treat reads against the counter pool it sits on', () => {
    for (const o of ORDERS) {
      const v = valueOf(o.colors.base)
      expect({ treat: o.treat, value: Number(v.toFixed(2)) }).toMatchObject({ treat: o.treat })
      expect(v - POOL_VALUE).toBeGreaterThanOrEqual(0.35)
      // …and the piece a child is choosing between must read as the same food, not a second colour.
      expect(Math.abs(v - valueOf(o.colors.shaded))).toBeLessThan(0.35)
      // the outline has to be darker than the fill, or the cut lines vanish into it
      expect(valueOf(o.colors.edge)).toBeLessThan(v)
    }
  })

  /**
   * ⚠️ A BACKDROP MAY NOT BE BRIGHTER THAN WHAT STANDS ON IT.
   *
   * Milo and the six friends measure value 0.70–0.92; every backdrop the band ships measures
   * 0.70–0.86. `grocery_sweets.jpeg` came in at **0.892**, and **0.927** across the middle band
   * where the board and the friends actually sit — so the characters read as cut-outs on a blank
   * page. That is what the founder saw as "blend nahi ho raha", and it is measurable, unlike the
   * STYLE half of the same check (that one is an eye job — see the note in slice.ts).
   *
   * ⚠️ TWO SCENES ARE KNOWN-BAD AND NAMED RATHER THAN QUIETLY EXEMPTED. `party_banner` (0.921) and
   * `party_balloons` (0.972) are near-empty pale rooms — the "featureless soft gradient" backdrop
   * fault this repo has recorded once already. They belong to orders 9 and 10, which **no run has
   * ever reached** (a perfect run exits on mastery at round 6), so nobody has seen them on screen
   * yet. Listing them keeps the debt visible and still fails the moment an eleventh scene drifts.
   */
  const KNOWN_TOO_BRIGHT = ['party_banner.png', 'party_balloons.png']
  it('no scene is brighter than the characters standing in it', async () => {
    for (const o of ORDERS) {
      const v = await meanValueOf(join(process.cwd(), 'public', 'assets', 'backgrounds', o.scene))
      const report = { scene: o.scene, value: Math.round(v * 1000) / 1000 }
      if (KNOWN_TOO_BRIGHT.includes(o.scene)) {
        expect(report).toMatchObject({ scene: o.scene })   // named debt, not a silent pass
        continue
      }
      expect(report).toMatchObject({ scene: o.scene })
      expect(v).toBeLessThanOrEqual(0.87)
    }
  })

  /**
   * ⚠️ THE QUESTION NAMES FRIENDS, SO A FRIEND HAS TO BE THERE WHEN IT IS ASKED. A fit round opened
   * with `count = laid`, i.e. **zero**, so the board asked "how many friends can he give one to?"
   * over an empty counter and nobody appeared until the child had already tapped a piece — which is
   * the geometry question this chapter was rebuilt to stop asking.
   */
  /**
   * ⚠️ THE WORDS MAY ONLY NAME SOMEBODY WHO IS ON SCREEN. A take round has every friend waiting, so
   * naming the one who went without is the point; a fit round reveals them one per piece, so the
   * miss line was naming an animal who had not walked in yet.
   */
  it('a miss never names a friend who has not arrived', () => {
    const names = FRIEND_NAMES as readonly string[]
    for (const den of DENS) {
      const fit: FrRound = { slot: 0, den, on: 'shape', n: 0, ask: 'fit', d: 2 }
      const take: FrRound = { ...fit, ask: 'take' }
      for (let laid = 0; laid < den; laid++) {
        const shown = friendsShown('fit', den, laid)
        const said = missFor(fit, { den, laid })
        for (const [i, n] of names.entries()) {
          expect({ laid, name: n, named: said.includes(n), onScreen: i < shown })
            .toMatchObject({ named: said.includes(n) && i < shown })
        }
        // …and a take round still names them, because there they are standing right there
        expect(names.some(n => missFor(take, { den, laid }).includes(n))).toBe(true)
      }
    }
  })

  it('somebody is always waiting when the question is asked', () => {
    for (const den of DENS) {
      expect(friendsShown('fit', den, 0)).toBeGreaterThanOrEqual(1)   // the round opens with a customer
      expect(friendsShown('take', den, 0)).toBe(den)                  // a take round shows the whole row
      // one more arrives per piece, and the last piece serves the last arrival — nobody left over
      for (let laid = 1; laid <= den; laid++) expect(friendsShown('fit', den, laid)).toBe(laid)
    }
  })

  it('no order sells a greyscale sprite', async () => {
    for (const o of ORDERS) {
      const c = await chromaOf(join(process.cwd(), 'public', 'assets', 'objects', `${o.item}.png`))
      expect({ item: o.item, chroma: Math.round(c) }).toMatchObject({ item: o.item })
      expect(c).toBeGreaterThan(18)
    }
  })
})

describe('layout', () => {
  it('the bands stack without overlapping, at every size', () => {
    for (const [vw, vh] of SIZES) {
      const l = layoutFor(vw, vh)
      expect(l.top).toBeGreaterThanOrEqual(chromeTop(l.short))
      expect(l.bubbleTop).toBeGreaterThanOrEqual(l.top)
      expect(l.boardTop).toBeGreaterThanOrEqual(l.bubbleTop + l.bubbleH)
      // ⚠️ THE BOARD YIELDS TO THE BAR, NOT THE OTHER WAY ROUND — the bar holds the tap targets.
      expect(l.boardTop + l.boardBand).toBeLessThanOrEqual(vh - l.barH - l.barBottom)
      expect(l.boardBand).toBeGreaterThan(0)
    }
  })

  /**
   * ⚠️ THE CAST GROWS WITH THE FRAME — no flat pixel cap.
   *
   * The first cut wrote `min(vh * 0.26, 200)`, so above 770px tall Milo stopped growing and every
   * friend stopped with him at 0.62 of him: a 1600×950 window drew a 200px shopkeeper and a 124px
   * rabbit in a shop sized for the window, and the founder read it exactly as it was — "characters
   * chhote chhote hai". A share is not enough on its own either; the number that must hold is the
   * one on SCREEN, so this asserts the rendered height, at the sizes a laptop actually reports.
   */
  it('Milo and his friends scale with the frame instead of hitting a pixel cap', () => {
    for (const [vw, vh] of SIZES) {
      const l = layoutFor(vw, vh)
      // he clears his own bubble, which is the only thing above him
      expect(l.miloH).toBeLessThanOrEqual(vh - (l.bubbleTop + l.bubbleH))
      // and he is a real share of the height, not a constant — a roomy frame draws a big Milo
      expect(l.miloH / vh).toBeGreaterThan(l.short ? 0.24 : 0.34)
      expect(l.friendH).toBeGreaterThan(l.short ? 30 : 100)
    }
    // the fault itself: doubling the height must roughly double him, which a cap forbids
    const small = layoutFor(1280, 500)
    const big = layoutFor(1280, 1000)
    expect(big.miloH).toBeGreaterThan(small.miloH * 1.8)
    expect(big.friendH).toBeGreaterThan(small.friendH * 1.8)
  })

  /** ⚠️ MEASURED OFF MILO, NOT GUESSED. Two independent percentages of the width is how StoryTime
   *  once put its answer box 29px inside its own button row. */
  it('the bar starts to the right of Milo and stays on screen', () => {
    for (const [vw, vh] of SIZES) {
      const l = layoutFor(vw, vh)
      expect(l.barLeft).toBeGreaterThanOrEqual(l.miloRight)
      expect(l.barLeft + l.barW).toBeLessThanOrEqual(vw)
      expect(l.barW).toBeGreaterThan(0)
    }
  })

  it('the bubble fits its frame and its tail points at Milo', () => {
    for (const [vw, vh] of SIZES) {
      const l = layoutFor(vw, vh)
      expect(l.bubbleLeft + l.bubbleW).toBeLessThanOrEqual(vw)
      expect(l.tailPct).toBeGreaterThan(0)
      expect(l.tailPct).toBeLessThanOrEqual(40)
    }
  })

  /** ⚠️ THE BOARD AND THE FRIENDS MAY NOT OVERLAP. They are two bands of one scene measured off each
   *  other, not two percentages of the width that happen to miss on the screen they were tuned on. */
  it('the board always finishes before the friends begin', () => {
    for (const [vw, vh] of SIZES) {
      const l = layoutFor(vw, vh)
      expect(l.boardCentre + l.boardRoom / 2).toBeLessThanOrEqual(l.friendsLeft)
      expect(l.boardCentre - l.boardRoom / 2).toBeGreaterThanOrEqual(l.miloRight)
      expect(l.friendsLeft + l.friendsW).toBeLessThanOrEqual(vw)
      // and each friend gets a real slot, not a sliver, even at the widest denominator
      expect(l.friendsW / 4).toBeGreaterThan(40)
      expect(l.friendH).toBeGreaterThan(30)
    }
  })

  /** A bar treat has to read as a strip rather than a square, and still fit the frame. */
  it('a whole never runs off the side, in either shape', () => {
    for (const [vw, vh] of SIZES) {
      const l = layoutFor(vw, vh)
      for (const shape of ['round', 'bar'] as const) {
        const s = wholeSize(shape, l.wholePx, vw)
        expect(s.w).toBeLessThanOrEqual(vw)
        expect(s.h).toBeLessThanOrEqual(l.boardBand + 1)
        expect(s.w).toBeGreaterThan(60)
      }
      expect(wholeSize('bar', l.wholePx, vw).w).toBeGreaterThan(wholeSize('bar', l.wholePx, vw).h)
    }
  })

  /** He is the only thing in the chapter that travels, so the aliveness check rests entirely on him. */
  it('Milo has a registered drawn cycle, and his aspect is derived from it', () => {
    expect(SHEETS[MILO]).toBeTruthy()
    expect(MILO_ASPECT).toBe(SHEETS[MILO].cellAspect)
  })
})

describe('the source keeps the rules it claims', () => {
  const src = readFileSync(join(process.cwd(), 'src/features/chapters/story/SliceShop.tsx'), 'utf8')

  /**
   * ⚠️ A GATE THAT RE-IMPLEMENTS A RULE CANNOT SEE THE RULE BEING REMOVED. The three below are
   * things only the component can express, so they are anchored on real code — never on a comment,
   * which is how a source check once passed by matching the sentence explaining itself.
   */
  it('the closed set is declared, and the generator is told what has been asked', () => {
    expect(src).toMatch(/coverage:\s*\{\s*of:/)
    expect(src).toMatch(/makeFrRound\(\(d \|\| 1\) as 1 \| 2 \| 3, round, asked\)/)
  })

  /**
   * ⚠️ A CONTACT SHADOW IS THE CUE THAT PUTS SOMEBODY IN THE PICTURE RATHER THAN ON IT, and this
   * chapter shipped its first cut without one under anybody — which is precisely what the founder
   * saw ("characters aur background blend nahi ho rahe"). Two of them: Milo and each friend. Both
   * must sit INSIDE the travelling element or the shadow outruns the feet, so the match is anchored
   * on the render, not on the import.
   */
  it('everybody standing in the shop casts a contact shadow', () => {
    expect(src.match(/<Shadow\s/g) ?? []).toHaveLength(2)
    // and Milo stands off the frame edge, or his own shadow is drawn under the viewport and clipped
    expect(src).toMatch(/bottom:\s*miloFloor\(l\.miloH\)/)
  })

  it('the chapter owns its own miss feedback', () => {
    expect(src).toMatch(/ownsFeedback:\s*true/)
    expect(src).toMatch(/setMiss\(t\)/)   // and it is WRITTEN, not only spoken
  })

  /**
   * ⚠️ READ OFF THE ORDER TABLE, NOT A LIST RETYPED HERE. CoinShop's intro told a child to count coins
   * onto a cloth and read a price off a board months after both had been deleted — not merely stale,
   * it pointed the very first instruction a six-year-old reads at the wrong place.
   */
  it('the intro only names treats this chapter actually sells', () => {
    const intro = src.slice(src.indexOf("Milo&apos;s shop is open"), src.indexOf("First, let us learn"))
    const sold = new Set(ORDERS.map(o => o.treat))
    for (const named of intro.match(/a ([a-z]+(?: [a-z]+)?)(?=[,.])/g) ?? []) {
      expect({ named, sold: sold.has(named.slice(2)) }).toMatchObject({ sold: true })
    }
  })

  it('there is no world picker left', () => {
    expect(src).not.toContain('WorldSelect')
  })

  /** The half `POOL_VALUE` alone cannot cover: that the pool is still drawn, and still fades to
   *  nothing at its edges rather than being the fourth slab this repo has painted over a scene. */
  /**
   * ⚠️ NEVER READ STATE YOU ALSO SET INSIDE A HANDLER — the shape this repo has now shipped three
   * times (TickTock's lesson dial moving one stop for six taps, placeValue's undo removing one cube
   * for three, and this chapter's own `lay`, which was caught by PLAYING it: four quick taps on a
   * fresh round left one piece down and the child stuck on "not full yet" however fast they tapped).
   * Both handlers a burst of taps can hit go through a ref, and a new round resets during RENDER.
   */
  it('taps read a ref, not the state they set, and a new round resets during render', () => {
    expect(src).toMatch(/den !== denRef\.current/)
    expect(src).toMatch(/tryN\.current/)
    expect(src).toMatch(/seenRound\.current !== roundKey/)
    // an effect here would paint one frame of the previous round's board
    expect(src).not.toMatch(/useEffect\([^)]*setLaid\(0\)/)
  })

  /**
   * ⚠️ ONE STORY IN ALL THREE PLACES. The lesson, the re-teach and a scored round must show the same
   * thing, because a chapter that teaches "how many of these fit" and then asks "how many friends get
   * one" has handed the child two framings and left them to bridge it alone. The founder's word for
   * the version without this was that no sense was being made.
   */
  it('the friends are in the lesson, the re-teach AND the round', () => {
    // three call sites, one component
    expect((src.match(/<Friends\b/g) ?? []).length).toBeGreaterThanOrEqual(3)
    // and every one of them is fed a real count rather than being decoration
    expect(src).toMatch(/count=\{friendsShown\(data\.ask, data\.den, laid\)\}/) // the round
    expect(src).toMatch(/count=\{view\.friends\}/)                              // the lesson
    expect(src).toMatch(/count=\{data\.den\}/)                                  // the re-teach
  })

  /** The payload is taught THROUGH the friends — more of them sharing one thing means less each —
   *  rather than as a rule about numbers, which is what a six-year-old can actually see. */
  it('the lesson teaches the size relation with people, not with a rule', () => {
    expect(src).toMatch(/More friends means a SMALLER piece each/)
    expect(src).toMatch(/friends: 4/)   // the same pizza, shared further
  })

  /** A dashed hairline outline over a painted shop is a blueprint — the shapes chapter shipped that
   *  once already. Both empty boards are real surfaces. */
  /** ⚠️ A WORKING SURFACE WANTS .9+, NOT A WASH — BlockYard's recorded lesson, ignored once here: at
   *  .5 the candy-shop shelves showed through the pile tray and the pears were unreadable. */
  it('the pile tray is opaque enough to hold what is being counted', () => {
    const m = src.match(/rgba\(255,252,246,\.(\d+)\)/)
    expect(m).toBeTruthy()
    expect(Number('0.' + m![1])).toBeGreaterThanOrEqual(0.9)
  })

  it('an empty board is a plate or a tray, never a wireframe', () => {
    expect(src).not.toMatch(/strokeDasharray=\{inside \? undefined : '5 4'\}/)
    expect(src).not.toContain('>empty<')
  })

  it('the counter pool is drawn, and fades out at its own edges', () => {
    expect(src).toMatch(/radial-gradient\(ellipse[^)]*\)?[^']*rgba\(34,22,12,\.52\)/)
    expect(src).toMatch(/rgba\(34,22,12,0\)\s*78%/)
  })

  /** Speech may not be the only channel: a response that exists only as speech is silence on the
   *  many devices with no usable voice, which reads as a tap that did nothing at all. */
  it('every spoken miss is also written into the bubble', () => {
    const spoken = src.match(/speak\(t\)/g) ?? []
    expect(spoken.length).toBeGreaterThan(0)
  })

  /**
   * The lesson froze in TickTock because its visuals hung off speech events. Self-paced here.
   *
   * ⚠️ ANCHORED ON A CALL AND ON THE IMPORT, NOT ON THE BARE WORD — which is a fault this gate
   * committed on its first run: the file's long note explaining why it does NOT use `speakSteps`
   * mentions it by name, so a `not.toContain` check failed on the comment defending itself. Same
   * family as the source check that once matched the sentence explaining what it forbids.
   */
  it('the lesson and the re-teach are self-paced, not driven by speech events', () => {
    expect(src).not.toMatch(/speakSteps\s*\(/)
    expect(src).not.toMatch(/import\s*\{[^}]*\bspeakSteps\b[^}]*\}\s*from/)
    // ⚠️ THE PROPERTY IS "THE VISUALS HAVE THEIR OWN CLOCK", NOT "THERE IS A setTimeout". The loop
    // is `speakPaced` since 2026-09-04, which keeps `dwellFor` as the FLOOR for every beat and only
    // ever ADDS wait while Milo is still talking — so a device that stops delivering speech events
    // still cannot freeze the teaching, and a slow clip is no longer cut off by the next line.
    expect(src).toMatch(/speakPaced\(/)
    expect(src).toMatch(/minMs:\s*dwellFor/)
  })
})

// ─── helpers ──────────────────────────────────────────────────────────────────────────
/** The darkest the counter pool reaches, from `Board`'s own gradient (`rgba(34,22,12,.52)` over a
 *  mid-tone scene). Kept as one number here because the CSS is not importable; the source check
 *  below asserts the pool still exists at all, which is the half a constant cannot cover. */
const POOL_VALUE = 34 / 255

/** HSV value — max channel, 0..1. Brightness is the axis this chapter separates on. */
const valueOf = (hex: string) =>
  Math.max(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)) / 255

/**
 * Mean max-minus-min over the OPAQUE pixels — under about 18 is greyscale, a real sprite runs
 * 90–200. Decoded with `sharp`, which the repo already depends on for the asset pipeline; the first
 * version of this was a hand-rolled partial PNG decoder that skipped filtered scanlines, i.e. a
 * measurement that could quietly sample almost nothing and still return a confident number.
 */
/** Mean HSV value (max channel) over an image — the axis a backdrop must not out-shine its cast on. */
async function meanValueOf(file: string): Promise<number> {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const ch = info.channels
  let total = 0, count = 0
  for (let i = 0; i + ch <= data.length; i += ch * 7) {
    total += Math.max(data[i], data[i + 1], data[i + 2]) / 255
    count++
  }
  return count ? total / count : 1
}

async function chromaOf(file: string): Promise<number> {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const ch = info.channels
  let total = 0, count = 0
  for (let i = 0; i + ch <= data.length; i += ch * 7) {
    if (ch === 4 && data[i + 3] <= 128) continue
    total += Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2])
    count++
  }
  return count ? total / count : 255
}
