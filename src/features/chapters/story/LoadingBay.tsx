'use client'
/**
 * Chapter (9–11) — DATA & GRAPHS (skill `dataGraphs`) — THE LOADING BAY.
 *
 * Replaces DataDeck, which was the pre-teen "Number Lab" HUD: a bar chart drawn on a neon panel,
 * answered by tapping one of N chips. See docs/story-9-11-rethink.md for the band-wide audit; the
 * two faults this file exists to fix are worth restating because both were live:
 *
 *  ① THE ANSWER WAS PRINTED ON SCREEN BEFORE THE CHILD ANSWERED. `BarChart` drew every bar's value
 *    at `opacity: revealed ? 1 : 0.5` — i.e. visible — so "How many Cats?" had its answer sitting
 *    above the bar. The chart was decoration and the numerals were both the question and the answer.
 *    Here NO numeral exists until after the commit; the quantity is only ever the goods themselves.
 *  ② NOTHING WAS ALIVE. Aliveness 0 of 4 (chapter-craft §1): nothing arrived, a tap popped a pill,
 *    Milo was a sticker bolted to the bottom-left, and one backdrop served all ten rounds.
 *
 * THE STORY — and §0a's second half, *who wants this and why*. Milo is the yard clerk at a goods
 * depot. Every round a delivery lands and the goods walk themselves into four stacks. THE STACKS ARE
 * THE CHART: a pictograph whose bars are countable units of real cargo (the curriculum's own word —
 * "bar charts & pictographs"). The foreman needs an answer to act on — which stack does the cart go
 * to, how many of a kind did we get, how many spare, how much altogether — and the correct answer
 * SENDS THE CART, which is the reward. Delete the goods and there is no question left.
 *
 * THE GESTURE, and why there are two granularities rather than one:
 *   • WHOLE-STACK questions (`most`, `total`) are answered by tapping a STACK — the unit of thought
 *     is the column. `most` takes one tap and is graded on which; `total` takes four and is graded
 *     on the sum the cart ends up holding, which is exactly "add every bar".
 *   • SINGLE-UNIT questions (`howMany`, `diff`) are answered by loading individual goods onto the
 *     cart — the unit of thought is the item, and the count is BUILT, so it cannot be guessed.
 * One control (tap the cargo, commit with Send), two readings of it. Same call TickTock makes.
 *
 * ⚠️ THE HONEST WEAK SPOT, stated rather than hidden: a `total` round is answered by tapping four
 * stacks, so a child who cannot add can still reach the right cart total by tapping all four and
 * letting the counter do it. What the round then measures is "did you gather every column", not the
 * sum. It is kept because the alternative — 10–18 individual taps — is a chore, and because the
 * counter climbing column by column is itself the thing being taught. If it needs to be un-fakeable
 * the fix is to hide the running counter until commit, which is one flag.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { Arrive, SheetCell, CRITTER_CSS, inFlowJourney } from './critters'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { rint, shuffle } from '@/core/rand'

// ─── The day: ten deliveries ────────────────────────────────────────────────────────────
/**
 * `groundY` is where a stack's FEET land, as a share of the height, and it is PER SCENE — read off
 * each painting rather than shared, which is the craft doc's oldest recurring fault. Measured on the
 * art: the yard's paved floor starts at 57%, the quay's cobbles at 38%, the siding's platform at 55%.
 *
 * ⚠️ Every good listed here was MEASURED against all three backdrops before being cast (hue OR
 * saturation separation, never neither — chapter-craft §2). `crate` is the obvious cargo for a depot
 * and it FAILS: on the siding it is 11° of hue and 0.19 of saturation away, i.e. a brown box on brown
 * ground. `pear`, `grocery_egg` and `flour_sack` fail the same way. Do not add one back without
 * re-running that measurement.
 */
export interface Bay { scene: string; label: string; groundY: number; goods: Good[] }
/**
 * `ink` is 1 / (the largest share of its own PNG the sprite's opaque pixels occupy), measured from
 * each file's alpha bounding box.
 *
 * ⚠️ WITHOUT IT THE CHART LIES. These sprites are square-padded to wildly different degrees — a
 * watermelon's ink fills 95% of its file, an apple's 57%, a basket's 40% — so drawn at one slot size
 * a melon renders nearly twice the visual weight of a basket. In a chapter whose entire question is
 * *which stack is biggest*, a column of fat melons reads taller than an equally tall column of small
 * apples, and the child is comparing the art instead of the data. Slot HEIGHT stays identical (that
 * is what keeps the bars honest); this only makes the goods fill the slots they are already given.
 * MeasureIt's SPRITE_BBOX lesson, which that chapter needed for exactly the same reason.
 */
export interface Good { src: string; name: string; plural: string; ink: number }

const G = {
  apple: { src: '/assets/objects/apple.png', name: 'apple', plural: 'apples', ink: 1.76 },
  melon: { src: '/assets/objects/watermelon.png', name: 'melon', plural: 'melons', ink: 1.06 },
  bucket: { src: '/assets/objects/bucket.png', name: 'bucket', plural: 'buckets', ink: 1.38 },
  basket: { src: '/assets/objects/basket.png', name: 'basket', plural: 'baskets', ink: 2.31 },
  pumpkin: { src: '/assets/objects/pumpkin.png', name: 'pumpkin', plural: 'pumpkins', ink: 1.06 },
  cherry: { src: '/assets/objects/cherry.png', name: 'cherry', plural: 'cherries', ink: 1.79 },
  cookie: { src: '/assets/objects/cookie.png', name: 'cookie', plural: 'cookies', ink: 1.25 },
  candy: { src: '/assets/objects/candy.png', name: 'sweet', plural: 'sweets', ink: 1.54 },
} as const

const YARD = '/assets/backgrounds/depot_yard.png'
const QUAY = '/assets/backgrounds/depot_quay.png'
const SIDING = '/assets/backgrounds/depot_siding.png'

/**
 * Ten slots, indexed STRAIGHT and never modulo — a plan read `PLAN[round % len]` is how three
 * chapters in this repo quietly re-showed the cargo they opened with. Consecutive rounds always
 * change scene, so the place moves as well as the numbers.
 */
export const DAY: Bay[] = [
  { scene: YARD, label: 'the depot yard', groundY: 0.80, goods: [G.apple, G.melon, G.bucket, G.basket] },
  { scene: QUAY, label: 'the quayside', groundY: 0.84, goods: [G.cherry, G.melon, G.bucket, G.cookie] },
  { scene: SIDING, label: 'the rail siding', groundY: 0.84, goods: [G.pumpkin, G.candy, G.bucket, G.melon] },
  { scene: YARD, label: 'the depot yard', groundY: 0.80, goods: [G.cookie, G.melon, G.bucket, G.cherry] },
  { scene: QUAY, label: 'the quayside', groundY: 0.84, goods: [G.apple, G.candy, G.bucket, G.basket] },
  { scene: SIDING, label: 'the rail siding', groundY: 0.84, goods: [G.melon, G.cherry, G.bucket, G.pumpkin] },
  { scene: YARD, label: 'the depot yard', groundY: 0.80, goods: [G.candy, G.melon, G.bucket, G.cookie] },
  { scene: QUAY, label: 'the quayside', groundY: 0.84, goods: [G.pumpkin, G.cherry, G.bucket, G.melon] },
  { scene: SIDING, label: 'the rail siding', groundY: 0.84, goods: [G.apple, G.melon, G.bucket, G.basket] },
  { scene: YARD, label: 'the depot yard', groundY: 0.80, goods: [G.cherry, G.candy, G.bucket, G.melon] },
]
export const bayAt = (round: number) => DAY[Math.min(round, DAY.length - 1)]

// ─── The question ───────────────────────────────────────────────────────────────────────
const pick = <T,>(a: readonly T[]) => a[rint(0, a.length - 1)]

export type QType = 'most' | 'howMany' | 'diff' | 'total'
export const Q_ALL: readonly QType[] = ['most', 'howMany', 'diff', 'total'] as const

export interface LbRound {
  qType: QType
  bay: Bay
  counts: number[]            // one per good — the four stacks
  /** For `howMany` / `diff`: which stack(s) the question names. */
  focus: number
  other: number
  answer: number              // for `most` this is the stack INDEX; otherwise a count
  ask: string                 // Milo's line — the question, from his own mouth
  hint: string                // the WRITTEN miss line. A beat that owns its feedback owes one.
  done: string                // what the foreman says once it is right
}

/**
 * Values are capped at 7 and kept DISTINCT. Distinct guarantees `most` has one answer; the cap keeps
 * every stack countable by eye, which is the whole point of a pictograph — a bar you cannot count is
 * a bar with a number printed on it, which is the chapter this replaces.
 */
function fourCounts(d: 1 | 2 | 3): number[] {
  const hi = d === 1 ? 5 : d === 2 ? 6 : 7
  return shuffle([1, 2, 3, 4, 5, 6, 7].slice(0, hi)).slice(0, 4)
}

export function makeRound(d: 1 | 2 | 3, round = 0, asked: readonly string[] = []): LbRound {
  const bay = bayAt(round)
  const counts = fourCounts(d)
  const pool: QType[] = d === 1 ? ['most', 'most', 'howMany'] : d === 2 ? ['most', 'howMany', 'diff'] : ['howMany', 'diff', 'total']
  // Deliberate ONLY while a gap exists, random once it closes: hardest-first for ever would lock the
  // generator onto one type and destroy the variety the coverage gate is there to protect.
  const unmet = Q_ALL.filter(q => !asked.includes(q))
  const t: QType = unmet.length ? (unmet.find(q => pool.includes(q)) ?? unmet[unmet.length - 1]) : pick(pool)

  let top = 0
  for (let i = 1; i < counts.length; i++) if (counts[i] > counts[top]) top = i

  if (t === 'most') {
    return {
      qType: 'most', bay, counts, focus: top, other: top, answer: top,
      ask: 'Which stack is the biggest? Send the cart to that one.',
      hint: 'Not that one — look for the TALLEST stack, the one with the most in it.',
      done: `The ${bay.goods[top].plural} it is.`,
    }
  }
  if (t === 'howMany') {
    const i = rint(0, 3)
    return {
      qType: 'howMany', bay, counts, focus: i, other: i, answer: counts[i],
      ask: `Load every ${bay.goods[i].name} onto the cart, then send it.`,
      hint: `Not quite — put every single ${bay.goods[i].name} on the cart, and nothing else.`,
      done: `${counts[i]} ${counts[i] === 1 ? bay.goods[i].name : bay.goods[i].plural}. Logged.`,
    }
  }
  if (t === 'diff') {
    const order = shuffle([0, 1, 2, 3])
    let a = order[0], b = order[1]
    if (counts[a] < counts[b]) { const s = a; a = b; b = s }
    return {
      qType: 'diff', bay, counts, focus: a, other: b,
      answer: counts[a] - counts[b],
      ask: `We have more ${bay.goods[a].plural} than ${bay.goods[b].plural}. Load the SPARE ones — how many more?`,
      hint: `Not quite — load only the ${bay.goods[a].plural} we have OVER and above the ${bay.goods[b].plural}.`,
      done: `${counts[a] - counts[b]} spare. Logged.`,
    }
  }
  const total = counts.reduce((s, c) => s + c, 0)
  return {
    qType: 'total', bay, counts, focus: 0, other: 0, answer: total,
    ask: 'The whole delivery goes out. Load every stack, then send the cart.',
    hint: 'Not the whole delivery yet — every stack has to go on the cart.',
    done: `${total} altogether. Logged.`,
  }
}

// ─── Layout ─────────────────────────────────────────────────────────────────────────────
/**
 * Exported so the invariant sweep drives the SAME function the scene renders from. A check that
 * re-implements this chain agrees with its own copy of the constants while the screen it is meant to
 * protect falls apart — this repo has shipped that twice.
 */
export interface BayLayout {
  unit: number            // one cargo item, px
  colGap: number
  stackLeft: (i: number) => number   // px, the stack's centre
  groundPx: number
  miloH: number
  cartH: number
  bandTop: number         // the lowest a bubble may reach without touching the tallest stack
}
export const MAX_UNITS = 7
export const CHROME_PX = 46          // the back chip's own band
const CART_SHARE = 0.20              // of the height
const MILO_SHARE = 0.30
/** How much of the width the four stacks may use, and where their centre sits. */
export const YARD_SHARE = 0.56
export const YARD_MID = 0.36
/** Centre-to-centre between columns, in units. Close enough to compare at a glance, far enough that
 *  four stacks do not read as one wall of goods. */
export const COL_STEP = 2.0
/**
 * Where the cart waits.
 *
 * ⚠️ `CART_Y` PUTS IT IN THE FOREGROUND, BELOW THE GROUND LINE, AND THAT IS LOAD-BEARING RATHER THAN
 * decorative. Parked on the ground line beside Milo it sat in the same horizontal band as his speech
 * bubble and was half-covered by it — measured at 1280×720, cart y 490–605 against bubble y 484–534.
 * That is the craft doc's own fault: two independent guesses at one gap. There is genuinely not room
 * for four stacks, a cart, Milo AND his bubble across one row at this width, so the cart moves toward
 * the viewer instead — which is what depth is for in a painted scene, and it reads as the cart
 * waiting at the front of the yard rather than being squeezed in behind.
 */
export const CART_X = 0.68
export const CART_Y = 0.97

export function bayLayout(vw: number, vh: number, groundY: number): BayLayout {
  const groundPx = Math.round(vh * groundY)
  // TWO constraints, and the unit is the smaller of them — never a flat px, which is what froze
  // SliceShop's cast at a fifth of a tall window.
  //   • VERTICAL: MAX_UNITS have to stand between the chrome and the ground.
  //   • HORIZONTAL: four columns have to fit the yard the stacks own.
  // ⚠️ An arbitrary `vw / 26` cap used to bind instead, and it made the whole chart tiny — measured
  // at 1280×720 the four stacks occupied 228px of a 1280px frame while the vertical constraint would
  // happily have allowed 57px units. A cap that is not one of the real constraints is just a guess.
  const room = Math.max(60, groundPx - CHROME_PX - Math.round(vh * 0.18))
  const yardW = vw * YARD_SHARE
  const unit = Math.max(18, Math.min(Math.round(room / MAX_UNITS), Math.round(yardW / (4 * COL_STEP))))
  const colGap = Math.round(unit * COL_STEP)
  // Four stacks centred on the yard's own middle. They own the LEFT; the cart and Milo own the
  // right, so a loaded item always travels left→right and nothing is ever dragged back through the
  // stacks the child is still counting.
  const span = colGap * 3
  const left0 = Math.round(vw * YARD_MID) - span / 2
  return {
    unit, colGap,
    stackLeft: (i: number) => left0 + i * colGap,
    groundPx,
    miloH: Math.round(vh * MILO_SHARE),
    cartH: Math.round(vh * CART_SHARE),
    bandTop: groundPx - unit * MAX_UNITS,
  }
}

// ─── A stack of goods — the bar, made of countable things ───────────────────────────────
/**
 * ⚠️ THE LANE IS RESERVED FROM EMPTY. The column is given its full height the moment it mounts, so
 * the stack beside it does not jump when the first item lands and a child part-way through counting
 * is never shuffled underneath. MarketDay learned this; MeasureIt learned it the expensive way.
 */
function Stack({ good, n, taken, unit, height, onTapUnit, onTapStack, dim, resetKey, delayBase }: {
  good: Good; n: number; taken: number; unit: number; height: number
  onTapUnit?: () => void; onTapStack?: () => void; dim?: boolean
  resetKey: string | number; delayBase: number
}) {
  const left = unit
  return (
    <div
      onClick={onTapStack}
      style={{
        position: 'relative', width: left, height, display: 'flex', flexDirection: 'column-reverse',
        alignItems: 'center', cursor: onTapStack ? 'pointer' : 'default',
        opacity: dim ? 0.55 : 1, transition: 'opacity .25s ease',
      }}>
      {/* ⚠️ FIRST in DOM order, because `column-reverse` lays children bottom-to-top — rendered last
          it drew the base plate ABOVE the stack, hanging in the air over the goods. */}
      <div style={{ width: Math.round(left * 1.2), height: Math.round(unit * 0.22), flexShrink: 0,
        borderRadius: 6,
        background: 'linear-gradient(180deg, rgba(58,44,30,.30), rgba(58,44,30,.14))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.32)' }} />
      {Array.from({ length: n }).map((_, k) => {
        const gone = k >= n - taken            // loaded items leave from the TOP of the stack
        if (gone) return <div key={k} style={{ width: left, height: unit, flexShrink: 0 }} />
        return (
          <div key={k} onClick={onTapUnit ? e => { e.stopPropagation(); onTapUnit() } : undefined}
            style={{ width: left, height: unit, flexShrink: 0, cursor: onTapUnit ? 'pointer' : 'inherit' }}>
            {/* Each item travels in on the delivery, staggered up the column so a stack builds
                rather than appearing. `resetKey` is required: React reuses these across rounds, so
                without it the arrival plays on round 1 and is silently dead for the other nine. */}
            <Arrive dist={-Math.round(unit * 9)} ms={Math.round(inFlowJourney(good.src, unit, unit * 9).ms)}
              delayMs={delayBase + k * 90} resetKey={resetKey}>
              {() => (
                <img src={good.src} alt="" draggable={false} decoding="async"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.001' }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block',
                    // Scaled so the sprite's INK fills the slot, not its square-padded file box.
                    transform: `scale(${good.ink})`,
                    filter: 'drop-shadow(0 2px 3px rgba(30,42,60,.30))' }} />
              )}
            </Arrive>
          </div>
        )
      })}
    </div>
  )
}

// ─── A loaded item, riding over to the cart ─────────────────────────────────────────────
/**
 * ⚠️ WITHOUT THIS THE GOODS VANISH, AND THE CHAPTER CONTRADICTS ITS OWN NARRATION. The demo says
 * "tap them one at a time — each one RIDES OVER to the cart", and the first build simply replaced a
 * loaded item with an empty spacer: it blinked out of the stack and a number on the cart went up.
 * That is the materialising fault running backwards, in the one gesture the chapter is built on.
 *
 * `left`/`top` transitions rather than a transform, which is the shape `Critter` already uses for a
 * travelling body; and LINEAR, because a thing being carried moves at a constant speed. Duration
 * comes from `inFlowJourney`, which falls back to CARRY_SPEED for anything with no gait of its own —
 * a bucket has no legs, so the number is stated rather than pretended to be derived.
 */
interface FlyIn { id: number; good: Good; from: { x: number; y: number }; to: { x: number; y: number }; ms: number }

function Flyer({ good, from, to, unit, ms, onDone }: {
  good: Good; from: { x: number; y: number }; to: { x: number; y: number }
  unit: number; ms: number; onDone: () => void
}) {
  const [at, setAt] = useState(from)
  const done = useRef(onDone); done.current = onDone
  useEffect(() => {
    // One frame minimum so the start position is painted before the transition is asked for —
    // otherwise the browser coalesces the two and the item simply appears at the cart.
    const go = window.setTimeout(() => setAt(to), 16)
    const end = window.setTimeout(() => done.current(), ms + 80)
    return () => { window.clearTimeout(go); window.clearTimeout(end) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div style={{ position: 'fixed', left: at.x, top: at.y, transform: 'translate(-50%,-50%)',
      width: unit, height: unit, zIndex: 36, pointerEvents: 'none',
      transition: `left ${ms}ms linear, top ${ms}ms linear` }}>
      <img src={good.src} alt="" draggable={false} decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'contain',
          transform: `scale(${good.ink})`, filter: 'drop-shadow(0 3px 5px rgba(30,42,60,.32))' }} />
    </div>
  )
}

// ─── The cart: where a loaded answer collects ───────────────────────────────────────────
function Cart({ h, count, showCount, onTapBack }: { h: number; count: number; showCount: boolean; onTapBack?: () => void }) {
  return (
    <div onClick={count > 0 ? onTapBack : undefined}
      style={{ position: 'relative', width: Math.round(h * 1.5), height: h, cursor: count > 0 ? 'pointer' : 'default' }}>
      <img src="/assets/objects/cart.png" alt="" draggable={false} decoding="async"
        onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.001' }}
        style={{ width: '100%', height: '100%', objectFit: 'contain',
          filter: 'drop-shadow(0 3px 5px rgba(30,42,60,.30))' }} />
      {/* ⚠️ BESIDE the cart, never above it. Sitting on top it rose `h * 0.34` back into the band
          Milo's speech bubble occupies and was half-covered — measured, badge y 505–564 against
          bubble y 484–534. Moving the cart down had fixed the body and left its badge behind, which
          is the same two-independent-guesses-at-one-gap fault a second time. Anchored to the cart's
          own left edge it cannot drift into anything, and it sits between the stacks and the cart,
          which is the way the eye is already travelling. */}
      {showCount && (
        <div style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translate(-8px,-50%)',
          minWidth: Math.round(h * 0.46), padding: '2px 10px', borderRadius: 999,
          background: 'var(--paper, #fdf6e8)', border: '3px solid var(--outline, #3d2516)',
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(h * 0.30),
          color: 'var(--ink, #3d2516)', textAlign: 'center', lineHeight: 1.15 }}>{count}</div>
      )}
    </div>
  )
}

// ─── Milo, and the question coming out of his own mouth ─────────────────────────────────
function Foreman({ h, line, vw }: { h: number; line: string; vw: number }) {
  return (
    <>
      <div style={{ position: 'fixed', left: Math.round(vw * 0.86), bottom: 0, zIndex: 34,
        transform: 'translateX(-50%)', pointerEvents: 'none' }}>
        {/* The contact shadow sits INSIDE the element, so it can never drift from the feet. And it is
            drawn above bottom:0 — SliceShop shipped one clipped away under the viewport. */}
        <div style={{ position: 'relative', paddingBottom: Math.round(h * 0.06) }}>
          <span aria-hidden style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
            width: '76%', height: Math.round(h * 0.11), borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(46,38,24,.30) 0%, rgba(46,38,24,0) 72%)' }} />
          <SheetCell src="/assets/characters/milo_side.png" h={h} facesLeft moving={false} breathe />
        </div>
      </div>
      {/* Anchored at his mouth, and CLAMPED below the chrome — on a short frame the scene rides high
          and an unclamped bubble opens inside the back chip. */}
      <div style={{ position: 'fixed', right: '2.5vw', bottom: Math.round(h * 0.86), zIndex: 40,
        maxWidth: Math.min(Math.round(vw * 0.46), 420), pointerEvents: 'none' }}>
        <div style={{ background: 'var(--paper, #fdf6e8)', border: '3px solid var(--outline, #3d2516)',
          borderRadius: '18px 18px 4px 18px', padding: '10px 14px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(13px,1.5vw,18px)',
          color: 'var(--ink, #3d2516)', lineHeight: 1.35, boxShadow: '0 4px 0 rgba(61,37,22,.10)' }}>
          {line}
        </div>
      </div>
    </>
  )
}

// ─── Play ───────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'

const BayPlay: React.FC<{ data: LbRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const L = bayLayout(vw, vh, data.bay.groundY)
  const perStack = data.qType === 'most' || data.qType === 'total'

  const [taken, setTaken] = useState<number[]>(() => [0, 0, 0, 0])
  const [chosen, setChosen] = useState<number | null>(null)   // `most` only
  const [miss, setMiss] = useState<string | null>(null)
  const [solved, setSolved] = useState(false)
  const [flyers, setFlyers] = useState<FlyIn[]>([])
  const erred = useRef(false)
  const done = useRef(false)
  const flyId = useRef(0)
  const takenRef = useRef(taken); takenRef.current = taken

  const cartAt = { x: Math.round(vw * CART_X), y: Math.round(vh * CART_Y - L.cartH * 0.55) }
  /** The centre of the item sitting at height `k` (0 from the bottom) in stack `i`. */
  const slotAt = (i: number, k: number) => ({
    x: L.stackLeft(i),
    y: L.groundPx - Math.round(L.unit * 0.22) - Math.round((k + 0.5) * L.unit),
  })
  const launch = useCallback((i: number, k: number, delay = 0) => {
    const good = data.bay.goods[i]
    const from = slotAt(i, k)
    const dist = Math.hypot(cartAt.x - from.x, cartAt.y - from.y)
    const ms = inFlowJourney(good.src, L.unit, dist).ms
    const id = ++flyId.current
    window.setTimeout(() => setFlyers(f => [...f, { id, good, from, to: cartAt, ms }]), delay)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, L.unit, L.groundPx, vw, vh])

  const loaded = taken.reduce((s, t) => s + t, 0)
  const key = `${data.qType}|${data.counts.join(',')}|${data.focus}`

  useEffect(() => { speak(data.ask) // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const tapUnit = useCallback((i: number) => {
    if (done.current) return
    setMiss(null)
    // Read from a ref, never from the state this handler also sets: two taps inside one React batch
    // both see the stale array otherwise. Fourth time this repo has met that shape.
    const cur = takenRef.current
    if (cur[i] >= data.counts[i]) return
    launch(i, data.counts[i] - cur[i] - 1)      // the topmost one still standing
    const next = cur.slice(); next[i] = cur[i] + 1
    takenRef.current = next; setTaken(next)
  }, [data.counts, launch])

  const tapStack = useCallback((i: number) => {
    if (done.current) return
    setMiss(null)
    if (data.qType === 'most') { setChosen(i); return }
    const cur = takenRef.current
    const next = cur.slice()
    const full = cur[i] >= data.counts[i]
    next[i] = full ? 0 : data.counts[i]                       // tap again to put it back
    // The whole column rides over, staggered, so it reads as a load rather than a jump cut.
    if (!full) for (let k = cur[i]; k < data.counts[i]; k++) launch(i, data.counts[i] - k - 1, (k - cur[i]) * 110)
    takenRef.current = next; setTaken(next)
  }, [data.qType, data.counts, launch])

  const unloadAll = useCallback(() => {
    if (done.current) return
    setMiss(null); takenRef.current = [0, 0, 0, 0]; setTaken([0, 0, 0, 0])
  }, [])

  const commit = useCallback(() => {
    if (done.current) return
    // ⚠️ THE COUNT IS NOT ENOUGH — WHERE IT CAME FROM IS PART OF THE ANSWER. Grading `diff` on the
    // total alone accepts three items lifted off the WRONG stack, and `howMany` accepts any three
    // items at all. That is SliceShop's grader hole, which only mutation testing found: a child
    // asked for halves who lays two quarters has a count that matches and an answer that does not.
    const right =
      data.qType === 'most' ? chosen === data.answer
        : data.qType === 'total' ? taken.every((t, i) => t === data.counts[i])
          : taken[data.focus] === data.answer && taken.every((t, i) => i === data.focus || t === 0)
    if (!right) {
      erred.current = true
      setMiss(data.hint)          // WRITTEN, not only spoken — speech alone is silence on most devices
      speak(data.hint)
      return
    }
    done.current = true
    setSolved(true)
    speak(data.done)
    window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 1700)
  }, [data, chosen, loaded, mode, onComplete])

  const canCommit = data.qType === 'most' ? chosen !== null : loaded > 0
  const btnH = Math.max(44, Math.round(Math.min(vw / 14, vh / 11)))

  return (
    <>
      {/* Everything is position:fixed. In a SCORED round the nearest positioned ancestor is
          SkillBeat's own content-sized wrapper, so absolute % would squash the whole yard into a
          strip across the top — a bug this repo shipped once and only saw in practice, because the
          demo renders outside SkillBeat and looks perfectly correct. */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden' }}>
        {[YARD, QUAY, SIDING].map(s => (
          <img key={s} src={s} alt="" draggable={false} decoding="async"
            onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: s === data.bay.scene ? 1 : 0, transition: 'opacity .6s ease' }} />
        ))}
      </div>

      {/* The stacks — the chart */}
      <div style={{ position: 'fixed', left: 0, top: 0, zIndex: 30, pointerEvents: 'none' }}>
        {data.bay.goods.map((g, i) => {
          const focusRound = data.qType === 'howMany' || data.qType === 'diff'
          const dim = focusRound && i !== data.focus && !(data.qType === 'diff' && i === data.other)
          return (
            <div key={g.src + i} style={{
              position: 'fixed', left: L.stackLeft(i), top: L.groundPx, transform: 'translate(-50%,-100%)',
              zIndex: 30, pointerEvents: 'auto',
              outline: chosen === i ? '4px solid var(--garden-green, #6aa84f)' : 'none',
              outlineOffset: 4, borderRadius: 8,
            }}>
              <Stack good={g} n={data.counts[i]} taken={taken[i]} unit={L.unit}
                height={L.unit * data.counts[i] + Math.round(L.unit * 0.22)}
                dim={dim} resetKey={key} delayBase={i * 260}
                onTapUnit={perStack ? undefined : () => tapUnit(i)}
                onTapStack={perStack ? () => tapStack(i) : undefined} />
            </div>
          )
        })}
      </div>

      {/* The cart. Its count is the answer being BUILT, so it is the one number allowed before the
          commit — it reports what the child has done, never what the chart says. */}
      <div style={{ position: 'fixed', left: Math.round(vw * CART_X), top: Math.round(vh * CART_Y),
        transform: 'translate(-50%,-100%)', zIndex: 32 }}>
        <Cart h={L.cartH} count={loaded} showCount={data.qType !== 'most'} onTapBack={unloadAll} />
      </div>

      {flyers.map(f => (
        <Flyer key={f.id} good={f.good} from={f.from} to={f.to} unit={L.unit} ms={f.ms}
          onDone={() => setFlyers(list => list.filter(x => x.id !== f.id))} />
      ))}

      <Foreman h={L.miloH} vw={vw} line={solved ? data.done : (miss ?? data.ask)} />

      {/* Commit */}
      <div style={{ position: 'fixed', left: '3vw', bottom: '3.5%', zIndex: 44, display: 'flex', gap: 10 }}>
        <button onClick={commit} disabled={!canCommit || solved}
          style={{ minHeight: btnH, padding: `0 ${Math.round(btnH * 0.5)}px`, borderRadius: 999, cursor: canCommit ? 'pointer' : 'default',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(btnH * 0.38),
            // ⚠️ IDENTICAL AT EVERY COUNT. A commit button that changes when the set becomes right
            // replaces the chapter with a hot/cold game — chapter 4's green Ready button, which the
            // founder caught. The only thing that varies is enabled-ness, i.e. "have you done
            // anything yet", which gives nothing away.
            background: 'var(--milo-orange, #f26b2c)', color: '#fff',
            border: '4px solid var(--outline, #3d2516)', boxShadow: '0 5px 0 rgba(61,37,22,.22)',
            opacity: canCommit && !solved ? 1 : 0.5 }}>
          Send the cart ✓
        </button>
        {loaded > 0 && !solved && (
          <button onClick={unloadAll}
            style={{ minHeight: btnH, padding: `0 ${Math.round(btnH * 0.42)}px`, borderRadius: 999, cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: Math.round(btnH * 0.32),
              background: 'var(--paper, #fdf6e8)', color: 'var(--ink, #3d2516)',
              border: '3px solid var(--outline, #3d2516)' }}>
            Put back
          </button>
        )}
      </div>

      {/* The numeral appears only AFTER the commit — the summary of work done, never the question. */}
      {solved && (
        <div style={{ position: 'fixed', left: 0, top: 0, zIndex: 41, pointerEvents: 'none' }}>
          {data.bay.goods.map((g, i) => (
            <div key={i} style={{ position: 'fixed', left: L.stackLeft(i),
              top: L.groundPx - L.unit * data.counts[i] - Math.round(L.unit * 0.9),
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(L.unit * 0.85),
              color: 'var(--ink, #3d2516)', background: 'var(--paper, #fdf6e8)',
              border: '3px solid var(--outline, #3d2516)', borderRadius: 999, padding: '0 10px',
              animation: 'k_bounceIn .35s cubic-bezier(.34,1.56,.64,1) both' }}>{data.counts[i]}</div>
          ))}
        </div>
      )}
    </>
  )
}

// ─── Demo / re-teach ────────────────────────────────────────────────────────────────────
/**
 * SELF-PACED, with `speak()` riding alongside — never `speakSteps`. TickTock's lesson hung for a
 * whole session because `speakSteps` reveals each visual from the utterance's `onstart`, and both
 * Chrome and Safari start the first line then silently drop the rest, freezing the teaching for ever
 * on a device that HAS a voice. The preview pane is mute, which is exactly what hid it.
 */
function dwellFor(line: string) { return Math.max(2200, Math.min(6200, line.length * 72)) }

const BayExplain: React.FC<{ data: LbRound; onDone: () => void }> = ({ data, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const L = bayLayout(vw, vh, data.bay.groundY)
  const [step, setStep] = useState(0)
  const [taken, setTaken] = useState<number[]>([0, 0, 0, 0])
  const doneRef = useRef(onDone); doneRef.current = onDone

  const lines = useMemo(() => {
    const g = data.bay.goods
    // ⚠️ THREE LINES EACH, ALWAYS. The runner indexes them — `i === 1` fires the visual act and
    // `step >= 1` drives the dim — so adding or dropping one silently moves the act onto the wrong
    // sentence. Reword in place; do not grow the array.
    //
    // ⚠️ AND 86 CHARACTERS IS THE CEILING, because `dwellFor` is `max(2200, min(6200, len * 72))`.
    // Past that the beat asks for more time than the cap will give, the NEXT beat's `speak()`
    // cancels the utterance in flight, and what gets cut is this line's tail — on a device with a
    // real voice only, which the mute preview pane can never show. The anchor's first draft put
    // this line at 98 and was the only string in the chapter the clamp bound on.
    //
    // The daily anchor appears here as a SIMILE ("like … goals"), never as a rename: the stacks on
    // screen are cargo and every line that names a thing names the cargo. Saying a stack is LIKE a
    // friend's goal tally is a comparison; saying it IS one would be the words contradicting the
    // picture, which is the fault this framing exists to avoid.
    if (data.qType === 'most') return [
      'A delivery just landed. Four stacks — like counting the goals four friends scored.',
      'The biggest one reaches highest — you can SEE it without counting.',
      `${g[data.answer].plural.replace(/^./, c => c.toUpperCase())} it is. The cart goes there.`,
    ]
    if (data.qType === 'howMany') return [
      `The foreman wants every ${g[data.focus].name} counted.`,
      'Tap them one at a time — each one rides over to the cart.',
      `${data.answer} of them. That is what the stack was holding.`,
    ]
    if (data.qType === 'diff') return [
      `We have more ${g[data.focus].plural} than ${g[data.other].plural} — like one friend outscoring another.`,
      'Match them up one for one, and load only the ones left over.',
      `${data.answer} spare — that is how many MORE. You cannot see that one; you subtract it.`,
    ]
    return [
      'The whole delivery goes out today.',
      'Tap each stack and it all rides onto the cart.',
      `${data.answer} altogether — every stack added up.`,
    ]
  }, [data])

  useEffect(() => {
    let alive = true
    let i = 0
    const run = () => {
      if (!alive) return
      setStep(i)
      speak(lines[i])
      if (i === 1) {
        // show the act the line just described
        if (data.qType === 'most') setTaken([0, 0, 0, 0])
        else if (data.qType === 'total') setTaken(data.counts.slice())
        else setTaken(prev => { const n = [0, 0, 0, 0]; n[data.focus] = data.answer; return n })
      }
      const t = window.setTimeout(() => {
        i++
        if (i < lines.length) run()
        else window.setTimeout(() => alive && doneRef.current(), 1200)
      }, dwellFor(lines[i]))
      timers.push(t)
    }
    const timers: number[] = []
    run()
    return () => { alive = false; timers.forEach(window.clearTimeout) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const key = `demo|${data.counts.join(',')}`
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden' }}>
        <img src={data.bay.scene} alt="" draggable={false} decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ position: 'fixed', left: 0, top: 0, zIndex: 30, pointerEvents: 'none' }}>
        {data.bay.goods.map((g, i) => (
          <div key={i} style={{ position: 'fixed', left: L.stackLeft(i), top: L.groundPx,
            transform: 'translate(-50%,-100%)', zIndex: 30 }}>
            <Stack good={g} n={data.counts[i]} taken={taken[i]} unit={L.unit}
              height={L.unit * data.counts[i] + Math.round(L.unit * 0.22)}
              dim={step >= 1 && (data.qType === 'howMany') && i !== data.focus}
              resetKey={key} delayBase={i * 260} />
          </div>
        ))}
      </div>
      <div style={{ position: 'fixed', left: Math.round(vw * CART_X), top: Math.round(vh * CART_Y),
        transform: 'translate(-50%,-100%)', zIndex: 32 }}>
        <Cart h={L.cartH} count={taken.reduce((s, t) => s + t, 0)} showCount={data.qType !== 'most'} />
      </div>
      <Foreman h={L.miloH} vw={vw} line={lines[step]} />
    </>
  )
}

// ─── Beat ───────────────────────────────────────────────────────────────────────────────
export function makeBeat(): Beat<LbRound> {
  return {
    skillId: 'dataGraphs', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d, round, asked) => makeRound((d || 1) as 1 | 2 | 3, round ?? 0, asked ?? []),
    // The MATH only. Include the scene and the same question comes back the moment the dressing
    // changes, which is what the rotating backdrop would otherwise buy.
    sig: d => `${d.qType}|${d.counts.join(',')}|${d.focus}|${d.other}`,
    // Every question type must be asked before mastery may end the run — a strong child is otherwise
    // asked ~3 at L1, ONE at L2 and TWO at L3, so `total` would simply never come up.
    coverage: { of: d => d.qType, all: Q_ALL },
    // The chapter writes its own miss line at the foreman's mouth, so the shared centred pill would
    // land on the yard and contradict it.
    ownsFeedback: true,
    // Empty → SkillBeat draws no pill. Milo's bubble is the only question region.
    prompt: () => '',
    say: d => d.ask,
    Play: ({ data, onSubmit }) => <BayPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <BayExplain data={data} onDone={onDone} />,
  }
}

// ─── The chapter ────────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'demo' | 'guided' | 'practice'

export default function LoadingBay({ onFinish, onExit }: {
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const [logged, setLogged] = useState<number[]>([])     // the cumulative arc — OUTSIDE SkillBeat
  const needsRotate = useNeedsRotate()
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)

  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])
  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return
    finished.current = true; stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 700)), [])
  const beat = useMemo(() => makeBeat(), [])

  // Deterministic, and they come out as two DIFFERENT types by construction: `asked` drives the
  // generator's unmet-first branch, so slot 0 is `most` and slot 1 is `howMany`.
  const DEMO = useMemo(() => [makeRound(1, 0, []), makeRound(1, 1, ['most'])], [])
  const GUIDED = useMemo(() => makeRound(1, 2, ['most']), [])

  // ⚠️ Below every hook. An early return above one changes the hook count when the phone turns and
  // React tears the chapter into the error boundary — this crashed a 6–8 chapter the first time.
  if (needsRotate) return <RotateGate line="Milo's yard needs a wide screen to lay the stacks out! 📦" />

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#b9a894' }}>
      <style>{CRITTER_CSS}</style>

      <button onClick={exit}
        style={{ position: 'fixed', left: 12, top: 10, zIndex: 60, padding: '7px 14px', borderRadius: 999,
          background: 'var(--paper, #fdf6e8)', border: '3px solid var(--milo-orange, #f26b2c)',
          color: 'var(--milo-orange, #f26b2c)', fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 13, cursor: 'pointer' }}>← Menu</button>

      {/* The day's manifest — the cumulative arc. It lives OUT here because anything drawn inside a
          round is rebuilt by SkillBeat every round and can never accumulate. */}
      {/* ⚠️ LEFT, under the Menu chip — NOT the right corner. SkillBeat draws its own round counter
          at right:16/top:14, and this sat at right:12/top:10 directly on top of it: measured, the
          two badges overlapped by 34 of 40px and read as one garbled number. Same class as the two
          prompt pills the 6–8 chapters shipped — the shared engine owns that corner. */}
      {phase === 'practice' && logged.length > 0 && (
        <div style={{ position: 'fixed', left: 12, top: 52, zIndex: 60, display: 'flex', gap: 4,
          background: 'rgba(253,246,232,.85)', border: '3px solid var(--outline, #3d2516)',
          borderRadius: 999, padding: '4px 10px', maxWidth: '46vw', flexWrap: 'wrap' }}>
          {logged.map((n, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 13,
              color: 'var(--ink, #3d2516)' }}>{n}</span>
          ))}
        </div>
      )}

      {phase === 'intro' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(20,14,8,.55)', padding: 20 }}>
          <div style={{ maxWidth: 520,
            background: 'var(--paper, #fdf6e8)', borderRadius: 22,
            border: '4px solid var(--outline, #3d2516)', padding: '22px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26,
              color: 'var(--ink, #3d2516)', marginBottom: 8 }}>The Loading Bay</div>
            {/* THE DAILY ANCHOR LIVES HERE, and only here plus the demo framing. This card is the one
                surface with no cargo drawn behind it (the stacks mount in `demo`), so it can name
                friends and goals without contradicting a picture. Every per-round line names the
                goods that are actually on screen — see `makeRound`.
                ⚠️ AND THE TALLY IS KEPT INSIDE WHAT THE CHAPTER CAN DRAW. `MAX_UNITS` is 7 and the
                tier the child opens on caps a stack at 5, so an anchor reading "Sam 8" would state a
                number no stack can ever reach — the teaching contradicting every round that follows
                it. Same rule the sibling Order Desk obeyed when $3,482 turned out ungeneratable. */}
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16,
              color: 'var(--ink, #3d2516)', lineHeight: 1.45, marginBottom: 18 }}>
              Goals this season: Sam 5, Alex 2, Jordan 4, Riley 3. Who scored most is something you
              SEE — how many more Sam got than Alex, you subtract. Milo&apos;s yard is the same:
              count the stacks, load the cart, send it off.
            </div>
            <button onClick={() => { unlockSpeech(); setPhase('demo') }}
              style={{ padding: '14px 34px', borderRadius: 999, border: '4px solid var(--outline, #3d2516)',
                background: 'var(--milo-orange, #f26b2c)', color: '#fff', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 19 }}>
              Start the shift ▶
            </button>
          </div>
        </div>
      )}

      {phase === 'demo' && (
        <BayExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
      )}

      {phase === 'guided' && (
        <BayPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
      )}

      {phase === 'practice' && (
        <SkillBeat beat={beat} onInterlude={interlude}
          onRound={(d: LbRound) => setLogged(l => [...l, d.counts.reduce((s, c) => s + c, 0)])}
          onComplete={(c, w, mastered) => {
            result.current.correct += c; result.current.wrong += w
            finishChapter(result.current.correct, result.current.wrong, mastered)
          }} />
      )}
    </div>
  )
}
