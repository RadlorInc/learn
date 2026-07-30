'use client'
/**
 * Chapter (6–8) — MONEY (skill `money`) as **PAY IT**, walked through a market.
 *
 * ⚠️ **WHAT WAS WRONG FIRST WAS THE QUESTION, AND WHAT WAS WRONG SECOND WAS THE GESTURE.**
 * The chapter this replaces laid out coins somebody else had chosen and asked for the total off
 * three chips, with **every coin carrying its value as a numeral** — replace each coin with a bare
 * numeral and all thirty questions still worked. It was `5 + 1 + 1` wearing coins. So the verb
 * changed: the tag names a price, the purse always holds more than it needs, nothing says *that's
 * enough*, and the child BUILDS the amount.
 *
 * Then that version was rejected twice on the LOOK, and the second diagnosis is the one that
 * matters: **three chapters in a row had the same gesture.** BlockYard calls an object and puts it
 * on the ground; placeValue calls an object and puts it on two shelves; CoinShop called a coin and
 * put it on a counter. Changing the awning, the cloth and the customer while leaving the verb
 * identical is [§0a](../../../../docs/chapter-craft.md) broken from the other side — *a new scene on
 * an old gesture reads as the old chapter.* And the band has eighteen drawn creature cycles that the
 * chapter used none of, which is precisely the weakness BlockYard's own header admits to.
 *
 * **So the chapter is a WALK now.** Seven market stalls, each a painted scene with its own animated
 * stallholder; Milo walks in from off-frame at every stall, buys one thing, counts the coins out of
 * the purse card and carries them up to the keeper, then walks off with it. The scene, the keeper and
 * the goods change every round, and the reward for a right answer is the journey rather than a number
 * turning green.
 *
 * **EVERY practice round is the same shape, by the founder's call: the keeper names the price of his
 * own goods and the child pays it out of the purse.** The price is derived from a multiset of coins
 * so it is always payable, and **L3 asks for the FEWEST coins** — the payload, because one 25 is ONE
 * object worth TWENTY-FIVE units, the same unitising `p.skipCount` and `p.placeValue2` feed into.
 *
 * ⚠️ **READING A LAID-OUT PILE IS BACK, ON THE SAME CONTROL — see `asPile`.** It first existed as a
 * `read` rung with its own number pad, and that was deleted for a real reason: the moment the coins
 * moved into the card it had **nowhere to draw its pile**, so it asked *"how much money is that?"*
 * over an empty screen, live. The answer was never to delete the direction, though — it was that the
 * pile had no home. It has one now: **the keeper spreads his coins out in his own speech bubble**,
 * where the price numeral used to sit, and says *"count my coins, then pay me the same."* Reading and
 * making are one skill from two ends, and this is TickTock's call — *one control shape, both
 * directions* — rather than a second answering surface with a second set of faults.
 *
 * ⚠️ And copying the pile coin-for-coin is DELIBERATELY allowed at the low tiers and impossible at
 * the top. Matching one-to-one is the honest entry strategy for a six-year-old (the same call
 * BigOrSmall makes for comparing by eye), and it still needs them to read each coin and know when to
 * stop. At L3 the pile lands on a `fewest` round, where the shown set is always strictly worse than
 * the answer, so the only way through is to total it and re-make it.
 *
 * Honest note: `p.money` is a LEAF in [skill-graph.md](../../../../docs/skill-graph.md) — nothing
 * stands on it. It is a life skill, not a spine node. That lowers the stakes; it does not excuse
 * addition in disguise.
 *
 * The stalls, the keeper rectangles, the per-scene ground lines and why three of the ten generated
 * scenes are not used all live in [market.ts](./market.ts). Read that before touching the geometry.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import { RotateGate, useNeedsRotate } from './RotateGate'
import { useViewport } from '@/shared/hooks/useViewport'
import { SheetCell, inFlowJourney, CRITTER_CSS, Arrive, aspectOf } from './critters'
import { Shadow, YARD_CSS, bannerBottom } from './yard'
import {
  STALLS, stallAt, RUN_LENGTH, DEMO_SLOTS, GUIDED_SLOT, scoredSlot, type Stall,
  SCENE_W, SCENE_H, fitFor, groundPxFor, miloHFor, miloHalfPct, PURSE_MAX, CARD_BAND, cardMetrics,
  aOrAn, OFF_X, MILO_X, PAY_X, MILO_ASPECT,
  SHOPPERS, shopperAt, SHOPPER_X, SHOPPER_LIFT, SHOPPER_SCALE,
} from './market'

export {
  STALLS, stallAt, RUN_LENGTH, DEMO_SLOTS, GUIDED_SLOT, scoredSlot,
  fitFor, groundPxFor, miloHFor, miloHalfPct, PURSE_MAX, CARD_BAND, cardMetrics,
  MILO_X, PAY_X,
}

const BG = (n: string) => `/assets/backgrounds/${n}`
const MILO = '/assets/characters/milo_side.png'

// ─── The coins ────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ **THE NUMERAL STAYS, AND IT IS NOT THE FAULT.** These are generic coins with no country, so a
 * six-year-old has no way to know a silver disc is worth five — the numeral is the affordance, the
 * way a ten-rod's segments are. What was wrong was letting the child answer by ADDING those numerals
 * off three chips. Here it tells you what a coin is worth and the child still has to choose which
 * coins to spend, which is the part that is money.
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

/**
 * One coin. ⚠️ `flat` draws every value at the SAME size, and it is not a shortcut — in the purse a
 * bigger disc means worth more, which is true of money and worth showing while you CHOOSE. In the
 * tray you are counting what you already laid, and there `rel` only shrinks the 1-coin: measured, a
 * 29px tray with `rel` 0.76 printed its numeral at **9px**, which is the affordance gone. Same disc,
 * same legible digit, and the size cue stays where it earns its place.
 */
export function Coin({ value, px, flat }: { value: CoinValue; px: number; flat?: boolean }) {
  const m = COIN[value]
  const s = Math.round(px * (flat ? 1 : m.rel))
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

// ─── The question ─────────────────────────────────────────────────────────────────────
export type QKind = 'pay' | 'fewest'
export interface MoneyRound {
  slot: number; kind: QKind; price: number; shown: CoinValue[]
  /**
   * How the keeper STATES his price: as a numeral, or as the pile of coins in `shown`.
   *
   * ⚠️ This is the read direction, and it is a presentation flag rather than a third question type on
   * purpose — the gesture, the grading and the card are identical either way, so a `read` kind would
   * have been a second code path for one changed sentence. What differs is only where the amount comes
   * from: a number Milo is told, or a handful he has to count.
   */
  asPile: boolean
}

/**
 * ⚠️ ALTERNATING, not random — so consecutive rounds differ in DIRECTION as well as in scene, and
 * both are practised the whole way down the run instead of in two blocks. Same reason TickTock
 * alternates read and set. Round 0 is a numeral, so the pile's first appearance is round 1: by then
 * the child has done the paying gesture twice in the demo, once in the guided round and once scored.
 */
export const pileFor = (round: number) => round % 2 === 1

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: readonly T[]) => a[rint(0, a.length - 1)]

/** The coins a tier may spend. 1 is always present, so every price is payable. */
export const POOL: Record<1 | 2 | 3, CoinValue[]> = { 1: [1, 5], 2: [1, 5, 10], 3: [1, 5, 10, 25] }
/**
 * ⚠️ The pools grow the SKILL, not only the magnitude. Both types are the same gesture — the keeper
 * names a price and the child pays it — and `fewest` adds the constraint that makes the payload
 * visible. It appears at L3 only, because that is where a 25 exists and choosing it over five 5s is
 * a real decision; at L1 the pool is 1 and 5 and "fewest" would barely be a choice.
 */
export const KINDS: Record<1 | 2 | 3, QKind[]> = {
  1: ['pay'],
  2: ['pay'],
  3: ['pay', 'pay', 'fewest'],
}
const COUNT: Record<1 | 2 | 3, [number, number]> = { 1: [2, 3], 2: [3, 4], 3: [3, 5] }

/**
 * WHICH COINS THE PURSE OFFERS FOR A PRICE — ONE renderer, and it earned that the hard way.
 *
 * ⚠️ The demo used to derive it from whether `shown` happened to contain a 25, which is a proxy for
 * the price and not the price. The moment the second demo's pile changed to six 5s it silently fell to
 * a pool with no 25 in it, so *"the same thirty in only TWO coins"* became three tens — **the 25, the
 * entire payload of `fewest`, disappeared from the teaching** while every line still read as true.
 * Caught on a screenshot, not by a gate. Two places deciding the same thing differently is the fault;
 * the purse a child is shown and the answer they are graded against must come from one function.
 */
export const poolFor = (price: number): CoinValue[] =>
  price >= 25 ? POOL[3] : price >= 10 ? POOL[2] : POOL[1]

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
 * is payable from the tier's pool within `PURSE_MAX` — a price a child cannot build is not a hard
 * question, it is a broken one.
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
    // A price of 1 is not a question, and one the card's tray cannot hold is not one either.
    if (p < 2) continue
    // ⚠️ **AND THE PAD TOPS OUT AT TWO DIGITS.** Five coins from the L3 pool reach 125, so a price
    // of 105 was reachable — and a three-digit answer is unenterable, which is a dead round. Caught
    // by the gate, one step further out than the one-digit case caught on screen.
    if (p > 99) continue
    if (fewestFor(p, pool).length > PURSE_MAX) continue
    // A `fewest` round whose greedy answer is what a child would lay down anyway teaches nothing.
    if (kind === 'fewest' && fewestFor(p, pool).length >= set.length) continue
    shown = set; price = p; break
  }
  if (!price) { shown = [5, 1]; price = 6 }
  return { slot: scoredSlot(round), kind, price, shown, asPile: pileFor(round) }
}

// ─── The market ───────────────────────────────────────────────────────────────────────
/**
 * ⚠️ **THERE IS NO KEEPER COMPONENT, AND THERE USED TO BE.** The stallholders are part of the
 * painting; the thirteen-frame strips that ship beside these scenes are deliberately unused. Why is
 * in [market.ts](./market.ts), and it is the one thing to read before adding an animated patch
 * back: a character generated inside its scene can only ever wiggle inside its own rectangle, which
 * measured out as **93–96% of the picture holding still**. Milo is the only thing that moves here.
 */
/**
 * THE KEEPER'S SPEECH BUBBLE — and it is now the chapter's ONLY question region.
 *
 * ⚠️ **THE QUESTION USED TO BE SPREAD ACROSS THREE PLACES AND NONE OF THEM WAS THE SPEAKER.** A
 * banner pinned to the top of the frame said what to do, an A-board standing on the grass carried
 * the goods and the price, and a cloth held the coins — so the stallholder, the one character with
 * something to say, said nothing, and the empty right-hand grass filled up with loose furniture.
 * The founder's call was exact: **a dialogue cloud in front of the character's mouth**, and nothing
 * scattered about.
 *
 * So this carries all of it — what is for sale, what it costs, the instruction, and every line of
 * feedback — anchored to the mouth it comes out of. `lead` keeps the price on screen while the text
 * changes, because a wrong answer must not take the question away with it.
 *
 * ⚠️ The vertical position is CLAMPED below the chrome. On a short frame the scene is scaled up to
 * bring its ground line down (see `fitFor`) and the keeper rides high — measured, three of the six
 * mouths land at or above y = 0 at 640×320. A bubble pinned to a mouth that is off-screen is worse
 * than one sitting a little low with its tail still pointing the right way.
 */
function Bubble({ st, text, price, coins, ok, vw, vh, band }: {
  st: Stall; text: string; price?: number; coins?: CoinValue[]
  ok?: boolean; vw: number; vh: number; band: number
}) {
  const { s, ox, oy } = fitFor(st, vw, vh, band)
  const mx = ox + st.say.x * s
  const my = Math.max(vh < 470 ? 44 : 58, oy + st.say.y * s)
  const tail = Math.round(Math.max(10, Math.min(vh * 0.022, 16)))
  return (
    <div style={{ position: 'fixed', left: mx + tail, top: my, zIndex: 34, pointerEvents: 'none',
      transform: 'translateY(-58%)', maxWidth: `${Math.max(38, 96 - (mx / vw) * 100)}vw` }}>
      {/* the tail, pointing back at the mouth */}
      <span aria-hidden style={{ position: 'absolute', left: -tail + 2, top: '54%',
        width: 0, height: 0, borderTop: `${tail * 0.62}px solid transparent`,
        borderBottom: `${tail * 0.62}px solid transparent`,
        borderRight: `${tail}px solid ${ok ? 'var(--garden-green)' : 'var(--milo-orange)'}` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,252,244,.96)', borderRadius: 18,
        border: `3px solid ${ok ? 'var(--garden-green)' : 'var(--milo-orange)'}`,
        padding: '7px 15px', boxShadow: '0 4px 0 rgba(61,37,22,.18)',
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: `clamp(13px, ${Math.round(vh * 0.031)}px, 20px)`,
        color: ok ? 'var(--garden-green-deep)' : 'var(--ink)' }}>
        {(price != null || coins) && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <img src={`/assets/objects/${st.good}`} alt="" draggable={false} decoding="async"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              style={{ width: `clamp(20px, ${Math.round(vh * 0.05)}px, 34px)`,
                height: `clamp(20px, ${Math.round(vh * 0.05)}px, 34px)`, objectFit: 'contain', display: 'block' }} />
            {/* ⚠️ THE PILE, WHERE THE NUMERAL WOULD HAVE BEEN — this is the read direction's only home,
                and it has to be in HIS bubble rather than out on the grass (nothing loose on the open
                ground) or in the card (that tray is the CHILD's coins, and the two must not be
                confused). Drawn FLAT so the discs are one size and every numeral stays legible; the
                floor is 22px because a coin prints its value at 42% of its size and 19px gives an
                unreadable 8px digit. */}
            {coins
              ? <span style={{ display: 'flex', alignItems: 'center', gap: Math.max(2, Math.round(vh * 0.008)) }}>
                  {coins.map((v, i) => (
                    <Coin key={`${i}-${v}`} value={v} flat
                      px={Math.max(22, Math.min(34, Math.round(vh * 0.055)))} />
                  ))}
                </span>
              : <span style={{ fontWeight: 900, lineHeight: 1, color: 'var(--ink)',
                  fontSize: `clamp(22px, ${Math.round(vh * 0.062)}px, 40px)` }}>{price}</span>}
          </span>
        )}
        <span>{text}</span>
      </div>
    </div>
  )
}

/**
 * MILO'S WALK — three legs, and each one is a separate journey rather than a position that happens
 * to change. ⚠️ A hand-rolled `transition: left` beside `Arrive` is how a dozen creatures ended up
 * sliding with their feet parked in HopAlong; `Arrive` hands its child the moving flag so the cycle
 * and the travel cannot be given different numbers.
 */
export type Leg = 0 | 1 | 2
const LEGS: { x: number; from: number; leave: boolean; facesLeft: boolean }[] = [
  { x: MILO_X, from: OFF_X, leave: false, facesLeft: true },   // in from off-frame right
  { x: PAY_X, from: MILO_X, leave: false, facesLeft: true },   // up to the stall to pay
  { x: PAY_X, from: OFF_X, leave: true, facesLeft: false },    // away with the goods
]
export const legDistPct = (leg: Leg) => Math.abs(LEGS[leg].from - LEGS[leg].x)

function Milo({ leg, groundPx, miloH, vw, resetKey }: {
  leg: Leg; groundPx: number; miloH: number; vw: number; resetKey: string
}) {
  const L = LEGS[leg]
  const dist = (legDistPct(leg) / 100) * vw
  const j = inFlowJourney(MILO, miloH, dist)
  const w = Math.round(miloH * MILO_ASPECT)
  return (
    <div style={{ position: 'fixed', left: `${L.x}%`, top: groundPx,
      transform: 'translate(-50%,-100%)', zIndex: 30, pointerEvents: 'none' }}>
      <Arrive dist={dist} ms={j.ms} leave={L.leave} resetKey={`${resetKey}-${leg}`}>
        {moving => (
          <span style={{ display: 'block', position: 'relative', width: w, height: miloH }}>
            <Shadow w={Math.round(w * 0.72)} h={Math.round(miloH * 0.1)} />
            <span style={{ position: 'relative', zIndex: 1, display: 'block' }}>
              <SheetCell src={MILO} h={miloH} moving={moving} facesLeft={L.facesLeft}
                breathe cycleScale={j.cycleScale} />
            </span>
          </span>
        )}
      </Arrive>
    </div>
  )
}

/** How long one of Milo's legs takes, so the choreography is timed off the SAME numbers the sprite
 *  is animated with rather than a duration guessed beside them. */
export const legMs = (leg: Leg, miloH: number, vw: number) =>
  inFlowJourney(MILO, miloH, (legDistPct(leg) / 100) * vw).ms

// ─── The stall's state ────────────────────────────────────────────────────────────────
interface Till {
  laid: CoinValue[]         // the coins counted out of the purse, in the order they were picked
  settled: number           // how many were already there — the rest travel in
  swept: boolean
  key: string
}
const EMPTY: Till = { laid: [], settled: 0, swept: false, key: 'a' }

/**
 * A SHOPPER — the market's own life, and the only thing on screen that is genuinely animated.
 *
 * They come in from off-frame right on their own legs, stand browsing beside Milo while the child
 * counts, and leave when he does. ⚠️ **Further back means HIGHER and SMALLER and drawn BEHIND**, all
 * three, because a child reading depth off size and a child reading it off height must get the same
 * answer. And it travels through `Arrive` like everything else here: a hand-rolled `transition:
 * left` is how a dozen creatures ended up sliding with their feet parked in HopAlong.
 */
function Shopper({ slot, groundPx, miloH, vw, vh, leaving, resetKey }: {
  slot: number; groundPx: number; miloH: number; vw: number; vh: number
  leaving: boolean; resetKey: string
}) {
  const k = shopperAt(slot)
  const h = Math.round(miloH * SHOPPER_SCALE * k.scale)
  const w = Math.round(h * aspectOf(k.src))
  const dist = ((OFF_X - SHOPPER_X) / 100) * vw
  const j = inFlowJourney(k.src, h, dist)
  return (
    <div style={{ position: 'fixed', left: `${SHOPPER_X}%`, top: groundPx - Math.round(vh * SHOPPER_LIFT),
      transform: 'translate(-50%,-100%)', zIndex: 26, pointerEvents: 'none' }}>
      {/* a beat behind Milo, so the two arrivals read as two people rather than one movement */}
      <Arrive dist={dist} ms={j.ms} delayMs={leaving ? 260 : 700} leave={leaving} resetKey={`${resetKey}-shop`}>
        {moving => (
          <span style={{ display: 'block', position: 'relative', width: w, height: h }}>
            <Shadow w={Math.round(w * 0.7)} h={Math.round(h * 0.11)} />
            <span style={{ position: 'relative', zIndex: 1, display: 'block' }}>
              {/* ⚠️ `facesLeft` on SheetCell means FLIP, and a sprite's own facing is per sprite —
                  `rabbit` faces left in its PNG and the other five face right. Shipping one blanket
                  answer put a duck and a squirrel on screen walking backwards. */}
              <SheetCell src={k.src} h={h} moving={moving} facesLeft={!leaving !== k.facesLeft}
                breathe cycleScale={j.cycleScale} />
            </span>
          </span>
        )}
      </Arrive>
    </div>
  )
}

function Scene({ st, slot, leg, vw, vh, band, resetKey }: {
  st: Stall; slot: number; leg: Leg; vw: number; vh: number; band: number; resetKey: string
}) {
  const groundPx = groundPxFor(st, vw, vh, band)
  const miloH = miloHFor(vh, groundPx, bannerBottom(vh))
  // ⚠️ Only people stand here. The stallholders are painted into their stalls, the goods and the
  // price live in the bubble, and the coins live in the card — so the open grass carries nothing but
  // the two who are actually shopping, which is what the founder was pointing at.
  return (
    <>
      <Shopper slot={slot} groundPx={groundPx} miloH={miloH} vw={vw} vh={vh}
        leaving={leg === 2} resetKey={resetKey} />
      <Milo leg={leg} groundPx={groundPx} miloH={miloH} vw={vw} resetKey={resetKey} />
    </>
  )
}

// ─── What is said, and written ────────────────────────────────────────────────────────
// Everything spoken is ALSO written — Chrome often ships no usable voice, and a response that
// exists only as speech is silence.
// ⚠️ These are the KEEPER'S words now, not a narrator's, because they come out of his mouth. The
// cloth they used to name does not exist any more either — a line that describes furniture the
// chapter has deleted is the header-comment fault in its smallest form.
/**
 * What the keeper says as Milo arrives — ONE renderer, because it is both spoken and (via `askFor`)
 * written in the bubble, and those two drifting apart is how a chapter narrates one thing while the
 * screen says another.
 *
 * ⚠️ **A PILE ROUND MUST NOT SAY THE NUMBER.** The whole question is reading the coins; naming the
 * total out loud is the answer handed over before the child has looked, which is this band's oldest
 * fault (chapter 4's green Ready button) in a spoken costume. The gate asserts it.
 */
export function openerFor(st: Stall, r: MoneyRound): string {
  const goods = `${st.who} has ${aOrAn(st.one)} ${st.one}`
  return r.asPile
    ? `${goods}. This is what it costs. ${askFor(r)}.`
    : `${goods}, ${numberToWords(r.price)}. ${askFor(r)}.`
}

/**
 * What the keeper says when the payment is wrong — the same ONE renderer as the opener, and for the
 * same reason: a miss line written inline in the component is a line no gate can reach, and the pile
 * branch is exactly where a careless edit re-reveals the answer.
 *
 * ⚠️ Naming the child's OWN total is always fair — that is their tray and they can count it. Naming
 * the TARGET is only fair when the target was already given as a numeral. The `fewest` branch may
 * name the price because by then the sum is already right, so the read has been demonstrated and
 * "in how many coins?" needs the number to mean anything.
 */
export function missFor(r: MoneyRound, laid: CoinValue[], best: number): string {
  const total = laid.reduce((s, v) => s + v, 0)
  if (total !== r.price) {
    return r.asPile
      ? `That makes ${numberToWords(total)}. Count my coins again.`
      : `That makes ${numberToWords(total)}. I asked for ${numberToWords(r.price)}.`
  }
  // ⚠️ The payload line. The sum is right and the CHOICE is not — which is the whole of what
  // "fewest" teaches: a big coin is one object worth many units.
  return `That is ${numberToWords(r.price)}, but with ${numberToWords(laid.length)} coins.`
    + ` Try bigger coins — can you do it in ${numberToWords(best)}?`
}

export const ASK: Record<QKind, string> = {
  pay: 'Count that out for me',
  fewest: 'Try again — with as FEW coins as you can',
}
/** The same two asks when the price is a PILE rather than a numeral — the read direction. */
export const ASK_PILE: Record<QKind, string> = {
  pay: 'Count my coins, then pay me the same',
  fewest: 'Count my coins — now pay me the same with as FEW as you can',
}
export const askFor = (r: MoneyRound) => (r.asPile ? ASK_PILE : ASK)[r.kind]

// ─── The round ────────────────────────────────────────────────────────────────────────
type Mode = 'demo' | 'guided' | 'practice'

const CoinRound: React.FC<{ st: Stall; data: MoneyRound; mode: Mode; onComplete: (c: boolean) => void }> =
({ st, data, mode, onComplete }) => {
  const { kind, price } = data
  const { w: vw, h: vh } = useViewport()
  // ⚠️ The band is the one the card actually needs — see CARD_BAND. Every round is a paying round.
  const band = CARD_BAND(vh)
  const groundPx = groundPxFor(st, vw, vh, band)
  const miloH = miloHFor(vh, groundPx, bannerBottom(vh))
  const pool = useMemo(() => poolFor(price), [price])
  const best = useMemo(() => fewestFor(price, pool).length, [price, pool])

  const [t, setT] = useState<Till>(EMPTY)
  const [leg, setLeg] = useState<Leg>(0)
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
    setT(EMPTY); setNote(''); setOk(false); setLive(false); setLeg(0)
    // The question opens when Milo has actually ARRIVED, timed off the same journey he walks.
    const walkIn = legMs(0, miloH, vw)
    after(walkIn, () => { setLive(true); speak(openerFor(st, data)) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price, kind, data.asPile, st.key])

  /** The reward IS the journey: he carries the coins up to the stall, then walks off with what he
   *  bought. Nothing turns green until after the commit. */
  function finish(correct: boolean) {
    done.current = true; setOk(true); setLive(false)
    after(300, () => { setT(s => ({ ...s, swept: true })); setLeg(1) })
    const toStall = 300 + legMs(1, miloH, vw)
    after(toStall + 500, () => setLeg(2))
    after(toStall + 500 + legMs(2, miloH, vw), () => onComplete(mode === 'practice' ? !erred.current && correct : true))
  }

  /** ⚠️ Reads the tray INSIDE the updater, never from the render's closure — three taps inside one
   *  React batch all see the same stale array otherwise, which is the desync that cost placeValue
   *  its undo. There is no second copy of the state to fall out of step with. */
  function lay(v: CoinValue) {
    if (!live || ok) return
    setT(s => (s.laid.length >= PURSE_MAX ? s : { ...s, laid: [...s.laid, v], settled: s.laid.length, key: s.key }))
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
        : `That is ${numberToWords(price)}. The ${st.one} is yours!`
      setNote(line); speak(`Yes! ${line}`)
      finish(true)
      return
    }
    erred.current = true
    // ⚠️ ONE renderer — see `missFor`. Written inline, the branch that must not name the target on a
    // pile round is a line no gate can reach, and that is exactly where a careless edit re-reveals it.
    say(missFor(data, t.laid, best))
  }

  return (
    <>
      <Bubble st={st} vw={vw} vh={vh} band={band} ok={ok} text={note || askFor(data)}
        price={ok || data.asPile ? undefined : price}
        coins={ok || !data.asPile ? undefined : data.shown} />
      <Scene st={st} slot={data.slot} leg={leg} vw={vw} vh={vh} band={band}
        resetKey={`${st.key}-${price}-${kind}`} />

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: Math.round(vh * 0.02), zIndex: 36,
        display: 'flex', justifyContent: 'center', padding: '0 8px' }}>
        <CoinCard pool={pool} laid={t.laid} band={band} vw={vw} live={live && !ok}
              full={t.laid.length >= PURSE_MAX} swept={t.swept}
              onLay={lay} onBack={takeBack} onPay={pay} />
      </div>
    </>
  )
}

/**
 * THE COIN CARD — the answering surface, and the only place a coin is ever drawn.
 *
 * ⚠️ **THE COINS USED TO LIVE IN THE WORLD, AND THAT WAS REJECTED TWICE.** First on a code-drawn
 * counter, then on a cloth laid on the grass; both read as furniture dropped into a painting, and
 * the second one had to be a coloured slab in the first place only because **the ground itself is
 * 22–37° off gold** and coins on grass are camouflage. The founder's call closes it: a card holds
 * all the coins and the child picks from it. One contained place, nothing loose on the ground, and
 * the contrast problem disappears because a card is paper and paper is not earth.
 *
 * ⚠️ **ONE ROW, AND THAT IS LOAD-BEARING RATHER THAN TIDY.** A two-row card needs ~150px, which on a
 * 640×320 frame pushes the ground up, which pushes the scene's scale up, which **crops the
 * stallholder's head off** — and he is the one asking the question now. `CARD_BAND` states the real
 * height so `fitFor` never has to.
 *
 * The purse still **always holds more than the price needs and nothing on it says *that's
 * enough***: the supply is unlimited, there is no running total anywhere, and `Pay ✓` is
 * byte-identical at every count. Deciding when to stop is the skill (HomeTime's rule); a total that
 * ticked up as coins went down would be chapter 4's green Ready button all over again.
 */
function CoinCard({ pool, laid, band, vw, live, full, swept, onLay, onBack, onPay }: {
  pool: CoinValue[]; laid: CoinValue[]; band: number; vw: number; live: boolean; full: boolean; swept: boolean
  onLay: (v: CoinValue) => void; onBack: () => void; onPay: () => void
}) {
  /** ⚠️ One shared measurement — see `cardMetrics`. The purse coin is the thing a child has to READ
   *  before choosing it, so it is sized off the card's own band rather than shrunk to fit a tidy
   *  tray; an early pass drew it at ~22px on a laptop and the 25 and the 5 were the same silver disc
   *  at a glance. */
  const { w, px, tray } = cardMetrics(vw, band)
  const rule = { width: 2, alignSelf: 'stretch', background: 'rgba(61,37,22,.14)', borderRadius: 2 } as const
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: w * 0.3,
      background: 'rgba(255,252,244,.95)', border: '3px solid var(--outline)', borderRadius: w * 0.42,
      padding: `${Math.round(w * 0.18)}px ${Math.round(w * 0.34)}px`,
      boxShadow: '0 5px 0 rgba(61,37,22,.18)',
      pointerEvents: live ? 'auto' : 'none', opacity: live ? 1 : .45,
      transition: 'opacity .3s ease', animation: 'cs_card .34s ease both' }}>

      {/* what has been put down — it fills as the child counts, and never states a total */}
      <div aria-label="coins you have put down" style={{ display: 'flex', alignItems: 'center',
        gap: Math.round(tray * 0.1), minWidth: PURSE_MAX * (tray + Math.round(tray * 0.1)),
        minHeight: tray }}>
        {laid.map((v, i) => (
          <span key={`${i}-${v}`} style={{ display: 'block',
            animation: swept ? `cs_sweep .5s ease ${i * 45}ms forwards` : `by_pop .26s ease both` }}>
            <Coin value={v} px={tray} flat />
          </span>
        ))}
      </div>

      <span aria-hidden style={rule} />

      {pool.map(v => (
        <button key={v} onClick={() => onLay(v)} disabled={full} aria-label={`a ${v} coin`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: w * 1.22, padding: `0 ${w * 0.2}px`, borderRadius: w * 0.24,
          border: '3px solid var(--outline)', background: 'var(--paper)',
          opacity: full ? .45 : 1, cursor: full ? 'default' : 'pointer',
        }}>
          <Coin value={v} px={px} />
        </button>
      ))}

      <button onClick={onBack} disabled={!laid.length} style={{
        height: w * 0.92, padding: `0 ${w * 0.36}px`, borderRadius: w * 0.46,
        border: '3px solid var(--outline)', background: 'var(--paper)', color: 'var(--ink)',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: w * 0.3,
        opacity: laid.length ? 1 : .45, cursor: laid.length ? 'pointer' : 'default',
      }}>↩</button>
      {/* Identical at every count — nothing may say the set is right before the commit. */}
      <button onClick={onPay} style={{
        height: w * 1.1, padding: `0 ${w * 0.56}px`, borderRadius: w * 0.55, border: 'none',
        background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: w * 0.34,
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
const CoinExplain: React.FC<{ st: Stall; data: MoneyRound; onDone: () => void }> = ({ st, data, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const band = CARD_BAND(vh)
  const [t, setT] = useState<Till>(EMPTY)
  const [leg, setLeg] = useState<Leg>(0)
  const [note, setNote] = useState('')
  const doneRef = useRef(onDone); doneRef.current = onDone

  useEffect(() => {
    const plan = fewestFor(data.price, poolFor(data.price))
    const set = data.kind === 'fewest' ? plan : data.shown
    // He is talking to Milo, so he says what it costs — he does not narrate himself in the third
    // person, which is what a bubble makes obvious and a top banner hid.
    const lines: string[] = [`${aOrAn(st.one)[0].toUpperCase()}${aOrAn(st.one).slice(1)} ${st.one} — that is ${numberToWords(data.price)}.`]
    const steps: Array<() => void> = [() => { setT({ ...EMPTY, key: 'd' }); setLeg(0) }]
    // ⚠️ Each step says the RUNNING TOTAL, not the coin's own value. Naming the coin gave a bubble
    // reading "30 · five" six times over, which is how you say what you are holding and not how you
    // count money out — you say five, ten, fifteen. The demo should model the counting.
    let run: CoinValue[] = []
    let sum = 0
    for (const v of set) {
      run = [...run, v]; sum += v
      const snap = run
      lines.push(numberToWords(sum))
      steps.push(() => setT(s => ({ ...s, laid: snap, settled: snap.length - 1 })))
    }
    lines.push(data.kind === 'fewest'
      ? `The same ${numberToWords(data.price)} — in only ${numberToWords(set.length)} coins.`
      : `That is ${numberToWords(data.price)}. Just right.`)
    steps.push(() => { setT(s => ({ ...s, swept: true })); setLeg(1) })
    const cancel = speakSteps(lines, {
      onStep: i => { steps[i]?.(); setNote(lines[i]) },
      onDone: () => window.setTimeout(() => doneRef.current(), 1200),
      fallbackStepMs: 1100,
    })
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pool = poolFor(data.price)
  return (
    <>
      {/* A demo names the total out loud, which a scored pile round must never do — here it is the
          teaching, so the pile AND the number are both given. */}
      <Bubble st={st} vw={vw} vh={vh} band={band} ok={leg !== 0}
        text={note || `${st.who}'s stall`}
        price={data.asPile ? undefined : data.price} coins={data.asPile ? data.shown : undefined} />
      <Scene st={st} slot={data.slot} leg={leg} vw={vw} vh={vh} band={band}
        resetKey={`demo-${st.key}-${data.price}`} />
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: Math.round(vh * 0.02), zIndex: 36,
        display: 'flex', justifyContent: 'center', padding: '0 8px' }}>
        {/* the same card the child will use, driven rather than tapped — so what they watch and what
            they then touch are one object, not a demonstration of a different thing */}
        <CoinCard pool={pool} laid={t.laid} band={band} vw={vw} live={false} full swept={t.swept}
          onLay={() => {}} onBack={() => {}} onPay={() => {}} />
      </div>
    </>
  )
}

// ─── Beat ─────────────────────────────────────────────────────────────────────────────
const BEAT: Beat<MoneyRound> = {
  skillId: 'money', rounds: 10, reteachAfter: 3, walkEvery: 3,
  make: (d, round = 0) => makeRound((d || 1) as 1 | 2 | 3, round),
  // The DIRECTION is part of the question: the same price named as a number and held out as a pile
  // are two things to answer, not one question asked twice.
  sig: d => `${d.price}${d.kind}${d.asPile ? 'pile' : 'num'}`,
  // ⚠️ THE KEEPER SAYS EVERYTHING HIMSELF, so SkillBeat's centred pill and its generic spoken
  // encouragement are both suppressed. This chapter retries in place with a written+spoken miss line
  // in his bubble ("That makes five. Count my coins again.") and only reports a round once it has been
  // SOLVED — so the shared cue arrived over his own "That is six. The pot is yours!" and contradicted
  // it, in the middle of the market. Same shape as TickTock; see `ownsFeedback` in StoryWorld.
  ownsFeedback: true,
  // SkillBeat renders nothing for an empty prompt — this chapter's own banner owns the pill, and it
  // must never restate the question as a second number.
  prompt: () => '',
  Play: ({ data, onSubmit }) => <CoinRound st={stallAt(data.slot)} data={data} mode="practice" onComplete={onSubmit} />,
  Reteach: ({ data, onDone }) => <CoinExplain st={stallAt(data.slot)} data={data} onDone={onDone} />,
}

const CS_CSS = `
@keyframes cs_sweep { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-18px) scale(.7)} }
@keyframes cs_card { 0%{opacity:0;transform:translateY(14px) scale(.96)} 100%{opacity:1;transform:none} }
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
  const [bought, setBought] = useState<number[]>([])
  const { w: vw, h: vh } = useViewport()
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)
  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])
  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return; finished.current = true
    stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])

  /**
   * Both teaching examples pay the SAME price — see CoinExplain.
   *
   * ⚠️ **THE SECOND ONE ALSO SHOWS THE PILE, so both directions are demonstrated before either is
   * scored.** It costs nothing: the keeper holds out thirty as six 5s while Milo pays it as one 25 and
   * one 5, which is word-for-word the lesson that example already narrates — the amount did not
   * change and the handful did. The cost, stated: the pile direction gets a DEMO but not a hands-on
   * guided round, because the one guided round is spent on the simpler numeral gesture. Its first
   * scored appearance is round 1, by which point the child has laid coins three times.
   */
  const DEMO: MoneyRound[] = useMemo(() => [
    { slot: 0, kind: 'pay', price: 30, shown: [5, 5, 5, 5, 5, 5], asPile: false },
    { slot: 1, kind: 'fewest', price: 30, shown: [5, 5, 5, 5, 5, 5], asPile: true },
  ], [])
  const GUIDED: MoneyRound = useMemo(() =>
    ({ slot: GUIDED_SLOT, kind: 'pay', price: 7, shown: [5, 1, 1], asPile: false }), [])

  // Every hook is above this line — an early return that changes the hook count tears the chapter
  // into the error boundary the moment the phone is turned.
  if (needsRotate) return <RotateGate line="Turn your phone sideways to walk Milo round the market!" />

  const active = phase === 'practice' ? slotIdx : phase === 'guided' ? GUIDED_SLOT : DEMO[Math.min(demoIdx, DEMO.length - 1)].slot

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#dfe7d4' }}>
      <style>{CRITTER_CSS}{YARD_CSS}{CS_CSS}</style>

      {/* Every scene stays mounted so a stall Milo has already visited cross-fades back rather than
          flashing in — and so the keeper strip is decoded before its round opens.
          ⚠️ Laid out by `fitFor`, NOT `object-fit: cover`: the keeper patch and the ground line are
          both placed through that transform, so the moment the backdrop uses a different one they
          come apart. One geometry for the picture and everything pinned to it. */}
      {STALLS.map(s => {
        const f = fitFor(s, vw, vh, CARD_BAND(vh))
        return (
          <div key={s.key} style={{ position: 'absolute', inset: 0, overflow: 'hidden',
            opacity: s.key === stallAt(active).key ? 1 : 0, transition: 'opacity .6s ease' }}>
            <img src={BG(s.scene)} alt="" draggable={false} decoding="async"
              style={{ position: 'absolute', left: f.ox, top: f.oy,
                width: SCENE_W * f.s, height: SCENE_H * f.s, maxWidth: 'none' }} />
          </div>
        )
      })}

      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
        {/* The cumulative arc, OUTSIDE SkillBeat — anything drawn inside a round resets every round.
            Each mark is what he bought at THAT stall, so the basket reads back as the walk he made. */}
        {bought.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,252,244,.86)', border: '2px solid var(--outline)', borderRadius: 999, padding: '4px 10px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--ink-muted)' }}>basket</span>
            {bought.slice(-10).map((slot, i) => (
              <img key={i} src={`/assets/objects/${stallAt(slot).good}`} alt="" draggable={false} decoding="async"
                onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
                style={{ width: 16, height: 16, objectFit: 'contain', display: 'block' }} />
            ))}
          </div>
        )}
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ maxWidth: '74%', background: 'rgba(255,252,244,.94)', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: `clamp(14px, ${Math.round(vh * 0.034)}px, 20px)`, color: 'var(--ink)', textAlign: 'center' }}>
            {/*
              ⚠️ This card named TWO pieces of furniture the chapter had already deleted — a board on
              every stall and a cloth for the coins (§④a moved the price into the keeper's bubble and
              the coins into the purse card). Worse than stale: it pointed the child at a board for the
              price when the price now comes out of the stallholder's mouth, so the first thing they
              were told to do was look in the wrong place. The in-round words are HIS ("Count that out
              for me"), so the intro is written to hand over to him rather than to describe scenery.
            */}
            Milo is walking round the market. At each stall the keeper will tell you what his goods
            cost — tap the coins in your purse to count out exactly that much, then pay. Watch Milo
            buy two things first!
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('demo') }}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>
            Let&apos;s shop! ▶
          </button>
        </div>
      )}

      {phase === 'demo' && (
        <CoinExplain key={`demo${demoIdx}`} st={stallAt(active)} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
      )}

      {phase === 'guided' && (
        <CoinRound key="guided" st={stallAt(active)} data={GUIDED} mode="guided"
          onComplete={() => { setSlotIdx(GUIDED_SLOT + 1); setPhase('practice') }} />
      )}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={BEAT} onInterlude={interlude}
            onRound={(data) => { if (typeof data?.slot === 'number') { setSlotIdx(data.slot); setBought(s => [...s, data.slot]) } }}
            onComplete={(c, w, mastered) => { result.current.correct += c; result.current.wrong += w; finishChapter(result.current.correct, result.current.wrong, mastered) }} />
        </div>
      )}
    </div>
  )
}
