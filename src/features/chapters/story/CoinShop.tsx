'use client'
/**
 * Chapter (6–8) — MONEY (skill `money`) as **PAY IT**.
 *
 * ⚠️ **WHAT WAS WRONG BEFORE WAS THE QUESTION, NOT THE ANIMATION.** The old chapter laid out a
 * handful of coins somebody else had chosen and asked the child to tap the total off three number
 * chips — and **every coin carried its own value as a code-drawn numeral**. Replace each coin
 * sprite with a bare numeral and all thirty questions still work: it was `5 + 1 + 1` wearing coins.
 * That is BlockYard's fault exactly (a printed question makes the picture beside it decoration),
 * and no amount of motion fixes it. So the verb changed first and the motion followed.
 *
 * **Reading a pile is not the money skill — MAKING an amount is.** The tag names a price; the purse
 * always holds more coins than the price needs and nothing says *that's enough*; the child builds
 * the amount and commits. Delete the coins and there is no question left, which is the test the old
 * form failed.
 *   • the answer is one the child MADE, and more than one build is right (40 = 25+10+5 = 10×4)
 *   • **L3 asks for the FEWEST coins**, which is the actual payload: one 25 is ONE object worth
 *     TWENTY-FIVE units — the same unitising that `p.skipCount` and `p.placeValue2` feed into.
 *   • `read` survives as the L1 rung, because reading and making are the same skill from two ends.
 *
 * Honest note: `p.money` is a LEAF in [skill-graph.md](../../../../docs/skill-graph.md) — nothing
 * stands on it. It is a life skill, not a spine node. That lowers the stakes; it does not excuse
 * addition in disguise.
 *
 * ⚠️ **THE COINS NEVER TOUCH THE GROUND, AND THAT IS A PALETTE DECISION.** Measured, the set owns
 * the whole warm-earth band plus neutral grey — copper **18°**, gold **40°**, silver a hueless
 * **sat .09** — and open ground is made of exactly those. Milo is **hue 30° / sat .53**, inside it
 * too. Six candidate backdrops were generated and five collided (a golden common came out 2° from
 * gold, a terracotta square 1° from copper). So the four scenes are GREEN — clear of every coin and
 * of Milo — plus one warm sand that separates on SATURATION instead (.22 against his .53, the same
 * basis as shipped `beach_sand`). The coins then sit on a code-drawn COUNTER whose colour this file
 * owns outright, so contrast is guaranteed by construction rather than fought for in the backdrop.
 *
 * Art: **four new backdrops** (see RUN). Coins, Milo and every other piece already shipped.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import { RotateGate, useNeedsRotate } from './RotateGate'
import { useViewport } from '@/shared/hooks/useViewport'
import { SheetCell, inFlowJourney, CRITTER_CSS, aspectOf, Arrive } from './critters'
import { Shadow, Banner, AnswerPad, PAD_BAND, YARD_CSS, groundOf } from './yard'

const BG = (n: string) => `/assets/backgrounds/${n}`
const MILO = '/assets/characters/milo_side.png'

// ─── The coins ────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ **THE NUMERAL STAYS, AND IT IS NOT THE FAULT.** These are generic coins with no country, so a
 * six-year-old has no way to know a silver disc is worth five — the numeral is the affordance, the
 * way a ten-rod's segments are. What was wrong was letting the child answer by ADDING those numerals
 * with three chips. Here the numeral tells you what a coin is worth and the child still has to
 * choose which coins to spend, which is the part that is money.
 *
 * `rel` — a bigger coin is worth more, as in life. It is decoration, never the answer: 25 and 10
 * differ by their FACE, not by a size a child would have to measure.
 */
export const VALUES = [1, 5, 10, 25] as const
export type CoinValue = (typeof VALUES)[number]
const COIN: Record<number, { src: string; rel: number }> = {
  1: { src: '/assets/objects/coin_copper.png', rel: 0.76 },
  5: { src: '/assets/objects/coin_silver.png', rel: 0.88 },
  10: { src: '/assets/objects/coin_gold.png', rel: 1.0 },
  25: { src: '/assets/objects/coin_gold.png', rel: 1.14 },
}
const FALLBACK: Record<number, string> = { 1: '#c67a44', 5: '#c9cdd4', 10: '#e8b64a', 25: '#e8b64a' }

/** One coin, with a real elliptical contact shadow so it sits ON the counter rather than over it. */
export function Coin({ value, px }: { value: CoinValue; px: number }) {
  const m = COIN[value]
  const s = Math.round(px * m.rel)
  const [missing, setMissing] = useState(false)
  return (
    <span style={{ display: 'block', position: 'relative', width: s, height: s }}>
      <Shadow w={Math.round(s * 0.92)} h={Math.round(s * 0.24)} />
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', width: s, height: s,
        alignItems: 'center', justifyContent: 'center' }}>
        {missing
          ? <span style={{ width: '100%', height: '100%', borderRadius: '50%', background: FALLBACK[value],
              boxShadow: 'inset 0 -3px 0 rgba(60,44,28,.28), inset 0 2px 0 rgba(255,255,255,.5)' }} />
          : <img src={m.src} alt="" draggable={false} decoding="async" onError={() => setMissing(true)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />}
        <span aria-hidden style={{ position: 'absolute', fontFamily: 'var(--font-display)', fontWeight: 900,
          fontSize: Math.round(s * 0.42), color: '#3d2516', lineHeight: 1,
          textShadow: '0 1px 0 rgba(255,255,255,.7), 0 -1px 0 rgba(255,255,255,.4)' }}>{value}</span>
      </span>
    </span>
  )
}

// ─── The run ──────────────────────────────────────────────────────────────────────────
/**
 * One flat list covering demo (2) → guided (1) → 10 scored rounds, indexed STRAIGHT and never
 * modulo, so a scene can never wrap back onto the one the chapter opened with.
 *
 * ⚠️ Every fair and market backdrop already in the library FAILS the open-ground gate — bunting,
 * stalls and prize shelves run straight through the band where the feet land (`fair_sweets` measures
 * **16.7**, `balloon_fair` **23.2**, against a threshold of 4). So four were generated for this
 * chapter, measured after palette compression (which itself added up to 0.4 of roughness):
 * `market_green` 1.47 · `market_fair` 1.42 · `market_town` 1.11 · `market_courtyard` 1.00, all
 * 100% walkable.
 */
/** ⚠️ `hue` is the STALL CLOTH, and it is the chapter's per-round variety. It must clear copper
 *  18°, gold 40° and Milo 30° — which is exactly why the cloth exists rather than a bare board. */
interface Slot { scene: string; hue: number }
const RUN: Slot[] = [
  { scene: 'market_green.png', hue: 188 }, { scene: 'market_fair.png', hue: 258 },
  { scene: 'market_town.png', hue: 318 }, { scene: 'market_courtyard.png', hue: 152 },
  { scene: 'market_green.png', hue: 205 }, { scene: 'market_fair.png', hue: 282 },
  { scene: 'market_courtyard.png', hue: 338 }, { scene: 'market_town.png', hue: 168 },
  { scene: 'market_fair.png', hue: 232 }, { scene: 'market_green.png', hue: 300 },
  { scene: 'market_courtyard.png', hue: 146 }, { scene: 'market_town.png', hue: 196 },
  { scene: 'market_green.png', hue: 270 },
]
/** The single accessor every scored round goes through. ⚠️ A gate that reads the RUN array cannot
 *  see how the chapter INDEXES it — drive the gate through this, never through the array. */
export const slotAt = (i: number): Slot => RUN[Math.min(i, RUN.length - 1)]
export const DEMO_SLOTS = 2
export const GUIDED_SLOT = DEMO_SLOTS
export const scoredSlot = (round: number) => slotAt(GUIDED_SLOT + 1 + round)
export const RUN_LENGTH = RUN.length
export const hueOf = (slot: Slot) => slot.hue

// ─── The goods ────────────────────────────────────────────────────────────────────────
/** What is being bought. Reused sprites only — the goods are the reason to pay, not the question. */
export interface Good { img: string; one: string }
const G = (img: string, one: string): Good => ({ img: `/assets/objects/${img}.png`, one })
export const GOODS: Good[] = [
  G('apple', 'apple'), G('cookie', 'cookie'), G('pear', 'pear'),
  G('watermelon', 'watermelon'), G('kitchen_orange', 'orange'), G('grocery_bun', 'bun'),
  G('candy_lollipop', 'lollipop'), G('bucket', 'bucket'), G('kitchen_strawberry', 'strawberry'),
]
export const goodAt = (i: number) => GOODS[i % GOODS.length]

// ─── The question ─────────────────────────────────────────────────────────────────────
export type QKind = 'pay' | 'fewest' | 'read'
export interface MoneyRound {
  slot: number; good: number; kind: QKind; price: number; shown: CoinValue[]
  /**
   * ⚠️ **HOW MANY DIGITS THE PAD OFFERS — CAUGHT ON SCREEN, AND IT WAS A DEAD END.** A `read` round
   * of three 1-coins asks for **3**, and a pad hard-wired to two windows can never accept a
   * one-digit answer: `Done` stays disabled for ever and the round cannot be finished. The pad has
   * to be told what shape the answer is.
   */
  digits: 1 | 2
}
export const digitsFor = (price: number): 1 | 2 => (price >= 10 ? 2 : 1)

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: readonly T[]) => a[rint(0, a.length - 1)]

/** The coins a tier may spend. 1 is always present, so every price is payable. */
export const POOL: Record<1 | 2 | 3, CoinValue[]> = { 1: [1, 5], 2: [1, 5, 10], 3: [1, 5, 10, 25] }
/**
 * ⚠️ The pools grow the SKILL, not only the magnitude. `pay` is the majority at every tier because
 * it is the only type where the child chooses; `fewest` — the payload — appears at L3, where a 25
 * exists and choosing it over five 5s is a real decision.
 */
export const KINDS: Record<1 | 2 | 3, QKind[]> = {
  1: ['pay', 'pay', 'pay', 'read'],
  2: ['pay', 'pay', 'pay', 'pay', 'read'],
  3: ['pay', 'pay', 'pay', 'fewest', 'fewest', 'read'],
}
const COUNT: Record<1 | 2 | 3, [number, number]> = { 1: [2, 3], 2: [3, 4], 3: [3, 5] }

/**
 * The fewest coins that make `price` from `pool`. Greedy is optimal for 1/5/10/25 (each value
 * divides the next), which is why the pool is those and not an arbitrary set — a "fewest" question
 * whose own answer needed a search would be a worse question, not a harder one.
 */
export function fewestFor(price: number, pool: readonly CoinValue[]): CoinValue[] {
  const out: CoinValue[] = []
  let left = price
  for (const v of [...pool].sort((a, b) => b - a)) while (left >= v) { left -= v; out.push(v) }
  return out
}

/**
 * ⚠️ The price is derived from a MULTISET OF COINS, never drawn as a bare number. That guarantees it
 * is payable from the tier's pool inside the counter's capacity — a price a child cannot build is
 * not a hard question, it is a broken one.
 */
export function makeRound(d: 1 | 2 | 3, round = 0): MoneyRound {
  const pool = POOL[d]
  const kind = pick(KINDS[d])
  const [lo, hi] = COUNT[d]
  let shown: CoinValue[] = []
  let price = 0
  for (let i = 0; i < 200; i++) {
    const n = rint(lo, hi)
    const set = Array.from({ length: n }, () => pick(pool)).sort((a, b) => b - a)
    const p = set.reduce((s, v) => s + v, 0)
    // A price of 1 is not a question, and one the counter cannot hold is not one either.
    if (p < 2) continue
    // ⚠️ **AND THE PAD TOPS OUT AT TWO DIGITS.** Five coins from the L3 pool reach 125, so a price
    // of 105 was reachable — and a three-digit answer is unenterable, which is a dead round. Caught
    // by the gate, one step further out than the one-digit case caught on screen.
    if (p > 99) continue
    if (fewestFor(p, pool).length > COUNTER_MAX) continue
    // A `fewest` round whose greedy answer is what a child would lay down anyway teaches nothing.
    if (kind === 'fewest' && fewestFor(p, pool).length >= set.length) continue
    shown = set; price = p; break
  }
  if (!price) { shown = [5, 1]; price = 6 }
  return { slot: GUIDED_SLOT + 1 + round, good: round, kind, price, shown, digits: digitsFor(price) }
}

// ─── The stall ────────────────────────────────────────────────────────────────────────
/** How many coins the counter may hold. The child is never asked to count past this, and a price
 *  is rejected at generation if its fewest form will not fit. */
export const COUNTER_MAX = 8
/**
 * ⚠️ **THE COUNTER IS A SURFACE AT HIP HEIGHT, NOT A BAR ON THE FLOOR — AND THAT IS WHY THE FIRST
 * VERSION READ AS A BALANCE BEAM.** A plank lying on the ground line with a character standing
 * beside it is "coins on a table and Milo over there", which is exactly what a founder saw. A market
 * stall has a serving surface the stallholder stands BEHIND, so the counter sits `COUNTER_LIFT`
 * above the ground line, Milo's feet stay on the ground, and the cloth hangs down over his legs —
 * you see him from the hips up, which is what reads as *behind the counter*.
 */
export const COUNTER_LIFT = 0.10          // share of the viewport height above the ground line
export const counterY = (vh: number) => groundOf(vh) - COUNTER_LIFT
export const STALL_X0 = 8, STALL_W = 60   // the whole stall: posts, awning, counter
export const CUSTOMER_X = 80              // where a customer stops, clear of the stall
/**
 * ⚠️ **EVERY PIECE GETS ITS OWN LANE ACROSS THE BOARDS.** The first stall laid the coin row across
 * the whole counter, so coins sat over Milo's face and over the price tag — measured on screen, a
 * coin clipped the "30". A market stall has stock at one end, the till in the middle and the goods
 * where the customer can reach them, and saying so in three constants is what stops them colliding.
 */
export const CRATE_X = 12                 // stock, left end
export const COUNTER_X0 = 17, COUNTER_COL = 4.4   // the till: eight coins, 17 → 48%
export const GOODS_X = 64                 // what is being bought, at the customer's end
/**
 * ⚠️ **NO LIFT, AND THAT IS THE DIFFERENCE BETWEEN GROUND AND A PLANK.** BlockYard's shelves give
 * each piece a seeded upward nudge so a row reads as stacked by hand rather than by a machine — on
 * open EARTH that reads as uneven ground. Copied here it measured a coin **3.3px above the plank**,
 * and on a manufactured flat surface any gap at all is simply a coin that is not touching. The
 * organic-nudge idiom belongs on ground; a counter is flat.
 */
export const counterSpot = (i: number) => ({ x: COUNTER_X0 + i * COUNTER_COL })
/** Milo's post — BEHIND his own counter and at the customer's end of it, because that is where a
 *  stallholder stands to serve. Clear of the coin lane by construction.
 *  ⚠️ `MILO_SCALE`/`miloHalfPct` are exported so the gate DERIVES the clearance from his real width
 *  rather than checking a guessed gap — the first version asserted a flat 8% and the row reached to
 *  within 5.8% of him, which is a marginal overlap at eight coins. */
export const MILO_X = 57
/** Coins are called up from the purse, which is a CONTROL — so they come from off-frame below-left,
 *  the side the purse trays sit on. */
export const ENTER_LEFT = -10
export const MILO_SCALE = 4.4                              // Milo's height, in coins
export const miloHalfPct = (coinPx: number, vw: number) =>
  ((coinPx * MILO_SCALE * 0.586) / 2 / vw) * 100           // 0.586 is milo_side's measured cellAspect

const CHROME_PX = 46
/** The room a standing coin has. Buy height from the chrome, never from the prose. */
export const coinBudget = (vh: number) => groundOf(vh) * vh - (vh < 470 ? CHROME_PX : 84) - 8
/** ⚠️ The floor is 22, not 18: a coin carries its VALUE as a numeral at 42% of its size, so a 19px
 *  coin prints an 8px digit — unreadable, and the digit is the whole affordance. On a short frame
 *  the coin takes more of the height rather than less. */
export const coinPxFor = (vw: number, vh: number) =>
  Math.max(22, Math.min(44, Math.floor(Math.min(vh * 0.062, vw * (COUNTER_COL - 0.6) / 100, coinBudget(vh) / 3.4))))

/**
 * THE STALL. ⚠️ **FOUR ATTEMPTS, AND THE FIRST THREE WERE ALL THE SAME MISTAKE.** A palette-matched
 * slab; then a thin rail; then a rail with a lit top face and legs — which I convinced myself was
 * fixed because it now had volume. On screen it still read as a **balance beam in a field**, and the
 * founder's words were exact: *"coins on a table and Milo standing there."*
 *
 * The fault was never the plank's shading. It was that **a counter alone is not a market.** A market
 * is an awning overhead, a cloth over the boards, crates of goods behind, a stallholder BEHIND the
 * counter rather than beside it — and customers. All of that is code-drawn here, so the whole thing
 * costs no art and every colour is one this file owns.
 *
 * ⚠️ And the cloth is what solves the palette problem the backdrop could not: the coins need a
 * surface that is nowhere near copper 18°, gold 40° or hueless silver, and a market stall having a
 * coloured cloth is simply true. It changes per round, which also gives the run its variety.
 */
function Awning({ cy, coinPx, hue }: { cy: number; coinPx: number; hue: number }) {
  const h = Math.round(coinPx * 0.95)
  const scallop = Math.round(coinPx * 0.3)
  const light = `hsl(${hue} 42% 74%)`, dark = `hsl(${hue} 40% 58%)`
  return (
    <div aria-hidden style={{ position: 'fixed', left: `${STALL_X0}%`, width: `${STALL_W}%`,
      top: `${cy * 100}%`, marginTop: -Math.round(coinPx * 4.6), zIndex: 6, pointerEvents: 'none' }}>
      <div style={{ position: 'relative', height: h, borderRadius: `${coinPx * 0.4}px ${coinPx * 0.4}px 0 0`,
        background: `repeating-linear-gradient(90deg, ${light} 0 ${coinPx * 0.9}px, ${dark} ${coinPx * 0.9}px ${coinPx * 1.8}px)`,
        boxShadow: `inset 0 ${Math.round(h * 0.3)}px ${Math.round(h * 0.5)}px rgba(255,255,255,.28), 0 3px 0 rgba(40,32,24,.16)` }} />
      {/* the scalloped valance — the one shape that says "stall" before anything else does */}
      <div style={{ position: 'relative', height: scallop,
        background: `repeating-linear-gradient(90deg, ${light} 0 ${coinPx * 0.9}px, ${dark} ${coinPx * 0.9}px ${coinPx * 1.8}px)`,
        WebkitMaskImage: `radial-gradient(circle ${scallop}px at ${scallop}px 0, #000 99%, transparent 100%)`,
        WebkitMaskSize: `${scallop * 2}px 100%`, WebkitMaskRepeat: 'repeat-x',
        maskImage: `radial-gradient(circle ${scallop}px at ${scallop}px 0, #000 99%, transparent 100%)`,
        maskSize: `${scallop * 2}px 100%`, maskRepeat: 'repeat-x' }} />
    </div>
  )
}

/** A crate of goods behind the counter — a market has STOCK, and it fills the space between the
 *  awning and the boards that was reading as empty field. */
function Crate({ x, cy, coinPx, good, z }: { x: number; cy: number; coinPx: number; good: Good; z: number }) {
  const w = Math.round(coinPx * 1.5), h = Math.round(coinPx * 0.8)
  return (
    <div aria-hidden style={{ position: 'fixed', left: `${x}%`, top: `${cy * 100}%`,
      transform: 'translate(-50%,-100%)', zIndex: z, pointerEvents: 'none' }}>
      <span style={{ display: 'block', position: 'relative', width: w, height: h + Math.round(coinPx * 0.5) }}>
        {/* the goods heaped above the rim */}
        <span style={{ position: 'absolute', left: '50%', bottom: h - 2, transform: 'translateX(-50%)',
          display: 'flex', gap: 1 }}>
          {[0, 1, 2].map(i => (
            <img key={i} src={good.img} alt="" draggable={false} decoding="async"
              onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
              style={{ width: Math.round(coinPx * 0.52), height: Math.round(coinPx * 0.52),
                objectFit: 'contain', display: 'block', transform: `translateY(${i === 1 ? -3 : 0}px)` }} />
          ))}
        </span>
        <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h, borderRadius: 3,
          background: 'linear-gradient(180deg, #c39a67 0%, #a67f50 100%)',
          boxShadow: 'inset 0 2px 0 rgba(255,255,255,.3), inset 0 -3px 0 rgba(90,64,38,.3)' }}>
          {[0.34, 0.66].map(f => (
            <span key={f} style={{ position: 'absolute', left: 0, right: 0, top: `${f * 100}%`, height: 2,
              background: 'rgba(120,86,52,.5)' }} />
          ))}
        </span>
      </span>
    </div>
  )
}

/** The boards, the cloth over them, and the two posts holding the awning up. */
function Counter({ ground, cy, coinPx, vh, hue }: {
  ground: number; cy: number; coinPx: number; vh: number; hue: number
}) {
  const top = Math.max(4, Math.round(coinPx * 0.17))
  // ⚠️ Measured against the REAL viewport. The first version multiplied by a hardcoded 900, so the
  // cloth was the wrong length at every height except the one it happened to be written on.
  const drop = Math.max(10, Math.round((ground - cy) * vh))
  const postW = Math.max(5, Math.round(coinPx * 0.18))
  return (
    <div aria-hidden style={{ position: 'fixed', left: `${STALL_X0}%`, width: `${STALL_W}%`,
      top: `${cy * 100}%`, zIndex: 24, pointerEvents: 'none' }}>
      {/* posts run from the awning down past the boards to the ground */}
      {[0, 1].map(i => (
        <span key={i} style={{ position: 'absolute', left: i ? undefined : 0, right: i ? 0 : undefined,
          top: -Math.round(coinPx * 4.6), height: Math.round(coinPx * 4.6) + drop, width: postW, borderRadius: 2,
          background: 'linear-gradient(90deg, #c9a274 0%, #8d6a45 100%)' }} />
      ))}
      {/* THE CLOTH — hangs from the boards to the ground, and it is what Milo stands behind */}
      {/* ⚠️ FOLDS, not a filled rectangle — but the folds are all it takes. A first version masked a
          scalloped hem onto the cloth and **the whole cloth disappeared**, leaving a bare rail: the
          empty-outline fault this repo has already shipped once, arrived at by being clever with a
          mask. The fill has to be SEEN. A cloth pinned to boards hangs fairly straight anyway. */}
      <div style={{ position: 'absolute', left: postW, right: postW, top, height: drop, overflow: 'hidden',
        background: `linear-gradient(180deg, hsl(${hue} 34% 62%) 0%, hsl(${hue} 36% 47%) 100%)`,
        boxShadow: 'inset 0 3px 0 rgba(255,255,255,.2), 0 3px 5px rgba(40,32,24,.18)' }}>
        {[0.2, 0.44, 0.68, 0.9].map(f => (
          <span key={f} aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: `${f * 100}%`,
            width: Math.max(3, Math.round(coinPx * 0.18)),
            background: 'linear-gradient(90deg, rgba(255,255,255,.18), rgba(0,0,0,.14))' }} />
        ))}
      </div>
      {/* the boards the coins rest on — a lit top face, because volume is what makes it an object */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top,
        background: 'linear-gradient(180deg, #e0c49b 0%, #c19a6b 100%)', borderRadius: 3,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 2px 0 rgba(90,64,38,.28)' }} />
    </div>
  )
}

/**
 * A CUSTOMER. ⚠️ **THE THING THAT WAS MISSING, AND IT IS THE BAND'S OWN CAST.** BlockYard's honest
 * weakness — recorded in its own header — is that *a block has no legs, so nothing walks but Milo*.
 * This chapter repeated it exactly: a counter, some coins, and one pony. A market is PEOPLE. There
 * are eighteen drawn cycles in this band and the chapter was using none of them, so each round now
 * brings someone who wants what is on the counter, walks up on their own legs, and leaves with it.
 *
 * One size band only (the craft doc's rule) — a ladybug cannot queue honestly beside a pony.
 */
export const SHOPPERS = [
  '/assets/objects/rabbit_side.png', '/assets/objects/duck_side.png', '/assets/objects/lamb_side.png',
  '/assets/objects/squirrel_side.png', '/assets/objects/duckling_side.png', '/assets/objects/chick_side.png',
] as const
export const shopperAt = (i: number) => SHOPPERS[i % SHOPPERS.length]

function Customer({ src, ground, coinPx, vw, leaving, resetKey }: {
  src: string; ground: number; coinPx: number; vw: number; leaving: boolean; resetKey: string
}) {
  const h = Math.round(coinPx * 2.5)
  const w = Math.round(h * aspectOf(src))
  const dist = ((112 - CUSTOMER_X) / 100) * vw
  const j = inFlowJourney(src, h, dist)
  return (
    <div style={{ position: 'fixed', left: `${CUSTOMER_X}%`, top: `${ground * 100}%`,
      transform: 'translate(-50%,-100%)', zIndex: 28, pointerEvents: 'none' }}>
      <Arrive dist={dist} ms={j.ms} leave={leaving} resetKey={resetKey}>
        {(moving) => (
          <span style={{ display: 'block', position: 'relative', width: w, height: h }}>
            <Shadow w={Math.round(w * 0.72)} h={Math.round(h * 0.12)} />
            <span style={{ position: 'relative', zIndex: 1, display: 'block' }}>
              {/* he arrives from the RIGHT, so he faces LEFT walking in and RIGHT walking away */}
              <SheetCell src={src} h={h} moving={moving} facesLeft={!leaving} breathe cycleScale={j.cycleScale} />
            </span>
          </span>
        )}
      </Arrive>
    </div>
  )
}

/** The price tag on the goods — the question, stated as a thing in the world. */
function PriceTag({ good, price, cy, coinPx, paid }: {
  good: Good; price: number; cy: number; coinPx: number; paid: boolean
}) {
  const s = Math.round(coinPx * 1.5)
  return (
    // ⚠️ ON the boards at the customer's end, not floating on the grass beside the stall — the
    // first version left it hanging in open field with its shadow landing on its own price label.
    <div style={{ position: 'fixed', left: `${GOODS_X}%`, top: `${cy * 100}%`,
      transform: 'translate(-50%,-100%)', zIndex: 27, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ display: 'block', position: 'relative', width: s, height: s }}>
        <Shadow w={Math.round(s * 0.7)} h={Math.round(s * 0.16)} />
        <img src={good.img} alt="" draggable={false} decoding="async"
          onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
          style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', display: 'block',
            filter: 'drop-shadow(0 2px 3px rgba(30,42,60,.22))' }} />
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900,
        fontSize: Math.round(coinPx * 0.56), lineHeight: 1, padding: '3px 10px', borderRadius: 8,
        background: paid ? 'var(--garden-green)' : 'rgba(255,252,244,.94)',
        color: paid ? '#fff' : 'var(--ink)',
        border: `3px solid ${paid ? 'var(--garden-green-deep)' : 'var(--outline)'}`,
        boxShadow: '0 3px 0 rgba(61,37,22,.2)', transition: 'background .3s ease, color .3s ease' }}>{price}</span>
    </div>
  )
}

// ─── The counter's state ──────────────────────────────────────────────────────────────
interface Till {
  laid: CoinValue[]         // what is on the counter, in the order it was laid
  settled: number           // how many were already there — the rest travel in
  walk: 0 | 1 | 2           // Milo: at his post · walking to the coins · walking back with the goods
  swept: boolean
  key: string
}
const EMPTY: Till = { laid: [], settled: 0, walk: 0, swept: false, key: 'a' }

function Stall({ t, coinPx, vw, vh, showGoods, good, price, paid, hue, shopper, shopperGone }: {
  t: Till; coinPx: number; vw: number; vh: number
  showGoods: boolean; good: Good; price: number; paid: boolean
  hue: number; shopper: string; shopperGone: boolean
}) {
  const ground = groundOf(vh)
  const cy = counterY(vh)
  const miloH = Math.round(coinPx * MILO_SCALE)
  const miloW = Math.round(miloH * aspectOf(MILO))
  const leg = (fromX: number, toX: number) => {
    const dist = ((fromX - toX) / 100) * vw
    // A coin has no gait, so `inFlowJourney` falls back to CARRY_SPEED — an object has no legs to
    // run while it travels, and giving it a cycle would be the skating fault.
    return { dist, ms: inFlowJourney('', coinPx, dist).ms }
  }
  return (
    <>
      <Awning cy={cy} coinPx={coinPx} hue={hue} />
      {/* stock behind the boards, at both ends so the stall reads as stocked rather than bare */}
      <Crate x={CRATE_X} cy={cy} coinPx={coinPx} good={good} z={20} />

      {/* MILO — the stallholder, BEHIND his own counter. His feet are on the ground line and the
          cloth (zIndex 24) hangs in front of his legs, so you see him from the hips up. That single
          relationship is what turns "a pony beside a plank" into "a shopkeeper at a stall". */}
      <div style={{ position: 'fixed', left: `${MILO_X}%`, top: `${ground * 100}%`,
        transform: 'translate(-50%,-100%)', zIndex: 22, pointerEvents: 'none' }}>
        <span style={{ display: 'block', position: 'relative', width: miloW, height: miloH }}>
          <span style={{ position: 'relative', zIndex: 1, display: 'block' }}>
            {/* he faces his customer, and serving is a breath, not a walk — a looping walk cycle on
                someone standing still is skating on the spot */}
            <SheetCell src={MILO} h={miloH} moving={false} facesLeft={false} breathe />
          </span>
        </span>
      </div>

      <Counter ground={ground} cy={cy} coinPx={coinPx} vh={vh} hue={hue} />

      {/* THE COINS — on the boards, not on the floor */}
      {t.laid.map((v, i) => {
        const sp = counterSpot(i)
        const j = leg(ENTER_LEFT, sp.x)
        return (
          <div key={`c${i}-${t.key}`} style={{ position: 'fixed', left: `${sp.x}%`,
            top: `${cy * 100}%`, transform: 'translate(-50%,-100%)',
            zIndex: 26 + i, pointerEvents: 'none',
            animation: t.swept ? `cs_sweep .5s ease ${i * 45}ms forwards` : undefined }}>
            <Arrive dist={j.dist} ms={i < t.settled ? 0 : j.ms}
              delayMs={Math.max(0, i - t.settled) * 90} resetKey={`${t.key}-${i}`}>
              {() => <Coin value={v} px={coinPx} />}
            </Arrive>
          </div>
        )
      })}

      {showGoods && <PriceTag good={good} price={price} cy={cy} coinPx={coinPx} paid={paid} />}

      {/* THE CUSTOMER — arrives on their own legs wanting what is on the counter, and leaves with
          it. The one thing the first pass had none of. */}
      <Customer src={shopper} ground={ground} coinPx={coinPx} vw={vw}
        leaving={shopperGone} resetKey={`${t.key}-shopper`} />
    </>
  )
}

// ─── What is said, and written ────────────────────────────────────────────────────────
// Everything spoken is ALSO written — Chrome often ships no usable voice, and a response that
// exists only as speech is silence.
export const ASK: Record<QKind, string> = {
  pay: 'Put the price on the counter',
  fewest: 'Pay it again — with as FEW coins as you can',
  read: 'How much is on the counter?',
}

// ─── The round ────────────────────────────────────────────────────────────────────────
type Mode = 'demo' | 'guided' | 'practice'

const CoinRound: React.FC<{ slot: Slot; data: MoneyRound; mode: Mode; onComplete: (c: boolean) => void }> =
({ slot, data, mode, onComplete }) => {
  const { kind, price, shown, good: goodIdx, digits: windows } = data
  const { w: vw, h: vh } = useViewport()
  const coinPx = coinPxFor(vw, vh)
  const good = goodAt(goodIdx)
  const isRead = kind === 'read'
  const pool = useMemo(() => (price >= 25 ? POOL[3] : price >= 10 ? POOL[2] : POOL[1]), [price])
  const best = useMemo(() => fewestFor(price, pool).length, [price, pool])

  const [t, setT] = useState<Till>(EMPTY)
  const [digits, setDigits] = useState<number[]>([])
  const [live, setLive] = useState(false)
  const [note, setNote] = useState('')
  const [ok, setOk] = useState(false)
  const erred = useRef(false), done = useRef(false)
  const timers = useRef<number[]>([])
  const after = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])
  const say = useCallback((s: string) => { setNote(s); speak(s) }, [])

  const total = t.laid.reduce((s, v) => s + v, 0)

  useEffect(() => {
    setT(EMPTY); setDigits([]); setNote(''); setOk(false); setLive(false)
    if (isRead) {
      // a READ round arrives already laid out — the coins someone else chose
      after(400, () => setT({ laid: [...shown], settled: 0, walk: 0, swept: false, key: 'b' }))
      after(400 + shown.length * 240 + 500, () => { setLive(true); speak(ASK.read) })
    } else {
      after(400, () => { setLive(true); speak(`${good.one}, ${numberToWords(price)}. ${ASK[kind]}.`) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price, kind])

  function finish(correct: boolean) {
    done.current = true; setOk(true); setLive(false)
    // Milo fetches the coins, then walks the goods across. The reward IS the journey.
    if (!isRead) {
      after(300, () => setT(s => ({ ...s, walk: 1 })))
      after(1500, () => setT(s => ({ ...s, swept: true })))
      after(2100, () => setT(s => ({ ...s, walk: 2 })))
    }
    after(isRead ? 1500 : 3000, () => onComplete(mode === 'practice' ? !erred.current && correct : true))
  }

  /** ⚠️ Reads the counter INSIDE the updater, never from the render's closure — three taps inside
   *  one React batch all see the same stale array otherwise, which is the desync that cost
   *  placeValue its undo. There is no second copy of the state to fall out of step with. */
  function lay(v: CoinValue) {
    if (!live || ok) return
    setT(s => (s.laid.length >= COUNTER_MAX ? s : { ...s, laid: [...s.laid, v], settled: s.laid.length, key: s.key }))
  }
  /** Available at EVERY count — an undo that appears only when the set is wrong is a verdict handed
   *  over before the commit. A stack, so it is predictable without remembering an order. */
  function takeBack() {
    if (!live || ok) return
    setT(s => (s.laid.length ? { ...s, laid: s.laid.slice(0, -1), settled: s.laid.length - 1 } : s))
  }

  function pay() {
    if (done.current || !live) return
    if (total === price && (kind !== 'fewest' || t.laid.length === best)) {
      const line = kind === 'fewest'
        ? `${numberToWords(price)} in just ${numberToWords(best)} coins!`
        : `That is ${numberToWords(price)}. The ${good.one} is yours!`
      setNote(line); speak(`Yes! ${line}`)
      finish(true)
      return
    }
    erred.current = true
    if (total !== price) {
      say(`That makes ${numberToWords(total)}. The tag says ${numberToWords(price)}.`)
    } else {
      // ⚠️ The payload line. The sum is right and the CHOICE is not — which is the whole of what
      // "fewest" teaches: a big coin is one object worth many units.
      say(`That is ${numberToWords(price)}, but with ${numberToWords(t.laid.length)} coins. Try bigger coins — can you do it in ${numberToWords(best)}?`)
    }
  }

  function commitPad() {
    if (done.current || digits.length < windows) return
    const v = digits.reduce((p, c) => p * 10 + c, 0)
    if (v === price) {
      setNote(`${price} on the counter`); speak(`Yes! ${numberToWords(price)}.`)
      finish(true)
    } else {
      erred.current = true
      say('Not that one. Count the biggest coins first.')
      after(1200, () => setDigits([]))
    }
  }

  const band = PAD_BAND(vh)
  return (
    <>
      <Banner text={note || ASK[kind]} vh={vh} ok={ok} side="right"
        lead={!isRead && !ok ? price : undefined} />
      <Stall t={t} coinPx={coinPx} vw={vw} vh={vh} showGoods={!isRead} good={good} price={price} paid={ok}
        hue={slot.hue} shopper={shopperAt(goodIdx)} shopperGone={t.walk === 2} />

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: Math.round(vh * 0.02), zIndex: 36,
        display: 'flex', justifyContent: 'center' }}>
        {isRead
          ? <AnswerPad digits={digits} band={band} live={live && !ok} windows={windows}
              onDigit={d => setDigits(x => (x.length >= windows ? x : [...x, d]))}
              onClear={() => setDigits(x => x.slice(0, -1))} onDone={commitPad} />
          : <Purse pool={pool} band={band} live={live && !ok} canUndo={t.laid.length > 0}
              full={t.laid.length >= COUNTER_MAX} onLay={lay} onBack={takeBack} onPay={pay} />}
      </div>
    </>
  )
}

/**
 * THE PURSE — the answering surface. ⚠️ **IT ALWAYS HOLDS MORE THAN THE PRICE NEEDS, AND NOTHING
 * ON IT SAYS *THAT'S ENOUGH*.** Deciding when to stop is the skill (HomeTime's rule), so there is
 * no running total anywhere on screen and the Pay button is byte-identical at every count — a
 * total that updates as coins go down turns the chapter into hot/cold, which is chapter 4's green
 * Ready button exactly. The total appears only after the commit, where it confirms.
 */
function Purse({ pool, band, live, canUndo, full, onLay, onBack, onPay }: {
  pool: CoinValue[]; band: number; live: boolean; canUndo: boolean; full: boolean
  onLay: (v: CoinValue) => void; onBack: () => void; onPay: () => void
}) {
  const w = Math.max(30, Math.min(56, Math.floor((band - 10) / 1.9)))
  /** ⚠️ The purse coin is the thing a child has to READ before choosing it, so it is sized off its
   *  own band and not shrunk to fit a tidy tray — the first pass drew it at ~22px on a laptop and
   *  the 25 and the 5 were the same silver disc at a glance. */
  const px = Math.max(26, Math.round(w * 0.92))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: w * 0.24,
      pointerEvents: live ? 'auto' : 'none', opacity: live ? 1 : .3, transition: 'opacity .3s ease' }}>
      {pool.map(v => (
        <button key={v} onClick={() => onLay(v)} disabled={full} aria-label={`a ${v} coin`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: w * 1.3, padding: `0 ${w * 0.24}px`, borderRadius: w * 0.24,
          border: '3px solid var(--outline)', background: 'var(--paper)',
          opacity: full ? .45 : 1, cursor: full ? 'default' : 'pointer',
        }}>
          <Coin value={v} px={px} />
        </button>
      ))}
      <button onClick={onBack} disabled={!canUndo} style={{
        height: w * 0.95, padding: `0 ${w * 0.42}px`, borderRadius: w * 0.48,
        border: '3px solid var(--outline)', background: 'var(--paper)', color: 'var(--ink)',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: w * 0.3,
        opacity: canUndo ? 1 : .45, cursor: canUndo ? 'pointer' : 'default',
      }}>↩ back</button>
      {/* Identical at every count — nothing may say the set is right before the commit. */}
      <button onClick={onPay} style={{
        height: w * 1.15, padding: `0 ${w * 0.66}px`, borderRadius: w * 0.58, border: 'none',
        background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: w * 0.36,
        boxShadow: '0 4px 0 rgba(180,70,20,.45)', cursor: 'pointer',
      }}>Pay ✓</button>
    </div>
  )
}

// ─── Demo / re-teach ──────────────────────────────────────────────────────────────────
/**
 * ⚠️ **THE SECOND EXAMPLE IS THE LESSON AND IT LIVES HERE, WHERE IT COSTS NOTHING.** Milo pays the
 * SAME price twice — 30 as six 5s, then as one 25 and one 5 — so the child sees that the amount did
 * not change and the handful did. No amount of counting coins says that.
 */
const CoinExplain: React.FC<{ slot: Slot; data: MoneyRound; onDone: () => void }> = ({ slot, data, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const coinPx = coinPxFor(vw, vh)
  const good = goodAt(data.good)
  const [t, setT] = useState<Till>(EMPTY)
  const [note, setNote] = useState('')
  const doneRef = useRef(onDone); doneRef.current = onDone

  useEffect(() => {
    const plan = fewestFor(data.price, data.shown.includes(25) ? POOL[3] : POOL[2])
    const set = data.kind === 'fewest' ? plan : data.shown
    const lines: string[] = [`The ${good.one} costs ${numberToWords(data.price)}. Milo pays for it.`]
    const steps: Array<() => void> = [() => setT({ ...EMPTY, key: 'd' })]
    let run: CoinValue[] = []
    for (const v of set) {
      run = [...run, v]
      const snap = run
      lines.push(numberToWords(v))
      steps.push(() => setT(s => ({ ...s, laid: snap, settled: snap.length - 1 })))
    }
    lines.push(data.kind === 'fewest'
      ? `The same ${numberToWords(data.price)} — in only ${numberToWords(set.length)} coins.`
      : `That is ${numberToWords(data.price)}. Just right.`)
    steps.push(() => setT(s => ({ ...s, walk: 1 })))
    const cancel = speakSteps(lines, {
      onStep: i => { steps[i]?.(); setNote(lines[i]) },
      onDone: () => window.setTimeout(() => doneRef.current(), 1200),
      fallbackStepMs: 1100,
    })
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Banner text={note || 'Watch Milo pay'} vh={vh} side="right" lead={data.price} />
      <Stall t={t} coinPx={coinPx} vw={vw} vh={vh} showGoods good={good} price={data.price} paid={t.walk !== 0}
        hue={slot.hue} shopper={shopperAt(data.good)} shopperGone={t.walk === 2} />
    </>
  )
}

// ─── Beat ─────────────────────────────────────────────────────────────────────────────
const BEAT: Beat<MoneyRound> = {
  skillId: 'money', rounds: 10, reteachAfter: 3, walkEvery: 3,
  make: (d, round = 0) => makeRound((d || 1) as 1 | 2 | 3, round),
  sig: d => `${d.price}${d.kind}`,
  // SkillBeat renders nothing for an empty prompt — this chapter's own banner owns the pill, and it
  // must never restate the question as a second number.
  prompt: () => '',
  Play: ({ data, onSubmit }) => <CoinRound slot={slotAt(data.slot)} data={data} mode="practice" onComplete={onSubmit} />,
  Reteach: ({ data, onDone }) => <CoinExplain slot={slotAt(data.slot)} data={data} onDone={onDone} />,
}

const CS_CSS = `
@keyframes cs_sweep { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-14px) scale(.7)} }
`

// ─── Orchestrator ─────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'demo' | 'guided' | 'practice'

export default function CoinShop({ onFinish, onExit }: {
  /** kept so old `?world=` links do not 404 — there is no picker any more */
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const [slotIdx, setSlotIdx] = useState(0)
  const [bought, setBought] = useState(0)
  const { h: vh } = useViewport()
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)
  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])
  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return; finished.current = true
    stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])

  // Both teaching examples pay the SAME price — see CoinExplain.
  const DEMO: MoneyRound[] = useMemo(() => [
    { slot: 0, good: 0, kind: 'pay', price: 30, shown: [5, 5, 5, 5, 5, 5], digits: 2 },
    { slot: 1, good: 1, kind: 'fewest', price: 30, shown: [25, 5], digits: 2 },
  ], [])
  const GUIDED: MoneyRound = useMemo(() =>
    ({ slot: GUIDED_SLOT, good: 2, kind: 'pay', price: 7, shown: [5, 1, 1], digits: 1 }), [])

  // Every hook is above this line — an early return that changes the hook count tears the chapter
  // into the error boundary the moment the phone is turned.
  if (needsRotate) return <RotateGate line="Turn your phone sideways to help Milo mind the stall!" />

  const active = phase === 'practice' ? slotIdx : phase === 'guided' ? GUIDED_SLOT : DEMO[Math.min(demoIdx, DEMO.length - 1)].slot

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#dfe7d4' }}>
      <style>{CRITTER_CSS}{YARD_CSS}{CS_CSS}</style>

      {RUN.map((s, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === active ? 1 : 0, transition: 'opacity .6s ease' }}>
          <img src={BG(s.scene)} alt="" draggable={false} decoding="async"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}

      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
        {/* The cumulative arc, OUTSIDE SkillBeat — anything drawn inside a round resets every round. */}
        {bought > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,252,244,.86)', border: '2px solid var(--outline)', borderRadius: 999, padding: '4px 10px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--ink-muted)' }}>basket</span>
            {Array.from({ length: Math.min(bought, 10) }).map((_, i) => (
              // each mark is the GOODS of the round it came from, so the basket reads back as the
              // shopping the child actually did rather than a row of identical ticks
              <img key={i} src={goodAt(i).img} alt="" draggable={false} decoding="async"
                onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
                style={{ width: 16, height: 16, objectFit: 'contain', display: 'block' }} />
            ))}
          </div>
        )}
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ maxWidth: '74%', background: 'rgba(255,252,244,.94)', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: `clamp(14px, ${Math.round(vh * 0.034)}px, 20px)`, color: 'var(--ink)', textAlign: 'center' }}>
            Milo minds the stall. The tag says what a thing costs — put that much on the counter
            from your purse. Watch him pay for two things first!
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('demo') }}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>
            Let&apos;s shop! ▶
          </button>
        </div>
      )}

      {phase === 'demo' && (
        <CoinExplain key={`demo${demoIdx}`} slot={slotAt(active)} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
      )}

      {phase === 'guided' && (
        <CoinRound key="guided" slot={slotAt(active)} data={GUIDED} mode="guided"
          onComplete={() => { setSlotIdx(GUIDED_SLOT + 1); setPhase('practice') }} />
      )}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={BEAT} onInterlude={interlude}
            onRound={(data) => { if (typeof data?.slot === 'number') { setSlotIdx(data.slot); setBought(s => s + 1) } }}
            onComplete={(c, w, mastered) => { result.current.correct += c; result.current.wrong += w; finishChapter(result.current.correct, result.current.wrong, mastered) }} />
        </div>
      )}
    </div>
  )
}
