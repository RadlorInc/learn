'use client'
/**
 * Chapter (9–11) — DIVISION as sharing and grouping (skill `division`) — THE SUPPLY RUN.
 *
 * Replaces DivisionShare, which was the pre-teen "Number Lab" HUD. See docs/story-9-11-rethink.md §4
 * for the band-wide audit. THREE faults this file exists to fix, and all three were live:
 *
 *  ⓪ DELETE-THE-ART FAILED. `prompt: 'Share 20 nodes among 4 bays'` over three chips — remove every
 *    node from the screen and all thirty questions still work. The nodes were scenery.
 *  ① ALIVENESS 0 OF 4. Nothing arrived, a tap lit a chip, `<PtMilo left={9} />` was a sticker, and
 *    one `LabBackdrop` served all ten rounds.
 *  ② ⚠️ AND THE DEALING WAS DONE **TO** THE CHILD, NOT **BY** THEM. The old `deal()` ran a timer that
 *    walked the nodes into the bays *after* the answer was already committed, so the one physical
 *    act division consists of — hand one to each, and again, until you cannot go round — was an
 *    animation the child watched. The rethink doc names this exactly: *deal the crates yourself and
 *    stop when you cannot complete another full round; the remainder is what is physically left in
 *    your hands*, which is the one thing about division a diagram never conveys.
 *
 * THE STORY — §0a's second half, *who wants this and why*. Milo is the quartermaster on a supply
 * run. A crate comes in and it has to go out **evenly**: nobody may get more than anybody else. What
 * will not go round stays in the crate, and that has a consequence — it is short, it goes back.
 *
 * ⚠️ THE DAILY ANCHOR IS A BAG OF CANDY, AND IT LIVES ONLY IN THE EXPLANATION. The briefing card and
 * the opening beat of every `share` explanation say the job is the same as sharing candy between
 * friends — one each, round again, and what will not go round is left over. ⚠️ That beat list is the
 * RE-TEACH as well as the demo, so the anchor also fires mid-run after three wrong answers, which is
 * the right moment for it. ⚠️ And the card deliberately does NOT enumerate rounds ("one each, again,
 * again" reads as three, and 22 ÷ 4 is five) — in this chapter the number of rounds IS the answer,
 * so a worked count that stops early teaches under-dealing, which is exactly what the grader
 * refuses. It is written as a SIMILE and goes no further: every PER-ROUND string names what is drawn
 * (parcels · cells · tins · cogs), because "candy" over a picture of parcels is this repo's oldest
 * recorded fault — the words naming something that is not on screen. `ask`, `done`, `missFor`, the
 * site `job` lines and the button labels stay site-true; do not spread the anchor into them.
 * ⚠️ AND NOT INTO THE `group` BEATS EITHER. The anchor is the SHARE reading — go round, and what
 * will not go round is left in your hand. Filling a receiver to a fixed size is a different act, and
 * a candy line stretched over it would be teaching the analogy rather than the division.
 *
 * FOUR SITES, and the site changes every round (the band-wide "a world per round" item):
 *   🚚 the dispatch hall · 🔋 the charge bay · 🍱 the mess line · 🧰 the parts bench
 * `runOrder` deals them randomly AND rejects an adjacent repeat, and the run is indexed STRAIGHT and
 * never modulo — a plan read `PLAN[round % len]` is how three chapters here quietly re-showed the
 * scene they opened with.
 *
 * ⚠️ THE GESTURE IS ONE BUTTON AND IT SERVES BOTH DIRECTIONS, WHICH IS NOT A TIDINESS WIN — IT IS
 * THE MATHEMATICS. Division is read two ways and this band needs both:
 *   • `share` (partitive) — "24 parcels, 4 vans. Everyone gets the same." The receivers are given;
 *     ONE STEP hands one parcel to each of them, so a step costs `groups`.
 *   • `group` (quotitive) — "24 parcels, 4 to a van. How many vans go out?" The load is given; ONE
 *     STEP fills the next van, so a step costs `per`.
 * In both, a step takes the SAME number out of the crate and the answer is **how many steps you got**
 * — which is division as repeated subtraction, performed. So there is one `stepCost`, one grader and
 * one Deal button, and the two readings differ only in where the step lands.
 *
 * ⚠️ THE ANSWER IS BUILT, NOT PICKED. There are no chips. What the child commits is the arrangement
 * itself, so it cannot be guessed — MeasureIt's rule, and FitOut's `fit` round.
 *
 * ⚠️ AND NOTHING ON SCREEN SAYS "THAT IS ENOUGH". Dealing a step the crate cannot cover is ALLOWED:
 * it hands out what is there, so a share round visibly leaves somebody short and a group round
 * visibly leaves the last one part-filled. Blocking that tap would be the chapter doing the division
 * — the button would stop being available at exactly the moment the answer is reached, and deciding
 * when to stop IS the skill (HomeTime's rule). It is wrong, it is visible, and `↩ Take it back`
 * undoes it, because the miscount repair is a journey too.
 *
 * ⚠️ NO NUMERAL UNTIL AFTER THE COMMIT. Not a tally, not a crate count, not a per-slot count. The
 * pile and the slots ARE the question and counting them is the skill; the equation appears when the
 * answer has already been given. The old chapter printed `total ÷ groups = ?` beside the bays the
 * whole time, which is one string-substitution away from printing the answer.
 *
 * ⚠️ NARROWED DELIBERATELY, AND THE REASON IS COUNTABILITY: `stepCost × answer ≤ 24`. The old
 * chapter drew up to 40 nodes at 12px, which is a manipulative nobody counts — and a pile a child
 * cannot count is a wrong answer the chapter caused. OrderDesk and FitOut made the same narrowing
 * for the same reason.
 *
 * ⚠️ THE SEPARATION IS MEASURED, NOT PICKED. Each unit against its own scene, over the band the
 * bench occupies:
 *     parcel ΔHue 150° · cell ΔHue 120° · tin ΔHue 120° · cog ΔHue 165°
 * and every scene measures 0.36–0.53 in value against Milo's 0.705, so no backdrop is brighter than
 * what stands on it (the `grocery_sweets` fault). The scenes were generated referencing FitOut's own
 * accepted scenes rather than the craft doc's old "earliest art" list — `pond.jpeg` and
 * `forest_*.jpeg` are themselves FLAT VECTOR, so referencing them asks for painted and attaches a
 * cartoon. All four landed in one pass, zero retries.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { SheetCell, CRITTER_CSS } from './critters'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { Banner, BANNER_TOP, bannerBottom } from './yard'
import { rint, shuffle } from '@/core/rand'
import {
  useHandInput, useHand, HandProvider, CamView, CamGate, type HandSkin,
} from '@/infra/ar/HandInput'

/** The painted band's colours for the shared camera surface — see AngleShop for why alpha is a field. */
const SKIN: HandSkin = {
  accent: 'var(--milo-orange)', accentSoft: 'rgba(242,107,44,.55)',
  ink: 'var(--ink)', muted: '#7a6a55', panel: 'rgba(255,252,244,.96)', line: 'rgba(61,37,22,.25)',
  onAccent: '#fff', font: 'var(--font-display)', mono: 'ui-monospace,Menlo,monospace',
}
/**
 * The self-view's own box — the same 190/76 the other two painted AR chapters use.
 *
 * ⚠️ IT WAS SHRUNK TO 132/64 FIRST, AND MEASURING SHOWED THAT BOUGHT NOTHING. The panel is opaque
 * and drawn above the bench (`zIndex` 36 against 30), and this is the widest answer surface in the
 * band — a crate plus up to seven receivers — so at first it covered the rightmost receivers in
 * **584 of 1440 sampled draws**, worst case a 173×70px block at 740×480, in the chapter whose whole
 * question is how many each got. The obvious reading was "the panel is too big". It was not: with
 * `bottomBand` reserving the panel's height, the overlap is 0 at BOTH sizes, and the smaller panel
 * leaves the unit no bigger (27px against 28px at vh ≥ 600 — very slightly WORSE, because the wider
 * reserve lets the column search pick a better arrangement). A mutation put 190 back and the gate
 * stayed green, which is how this was caught.
 *
 * ⇒ The fix is the RESERVE, and only the reserve. Divergence from the band's shared number would
 * have been a constant to explain for ever, justified by a measurement the other change had already
 * made irrelevant.
 */
export const CAM_W = (short: boolean) => (short ? 76 : 190)
export const CAM_BOTTOM = (short: boolean) => (short ? 8 : 14)

// ─── The four sites ─────────────────────────────────────────────────────────────────────
/** Every backdrop is generated at this size; the cover-fit maths below depends on it. */
export const IMG_W = 1376
export const IMG_H = 768

export interface Site {
  id: string
  /** how Milo names the place, mid-sentence: "over at the mess line" */
  label: string
  emoji: string
  scene: string
  /**
   * Where the SURFACE things stand on is IN THE PAINTING, as a share of the IMAGE's height — read
   * off each scene with an edge detector rather than shared, which is this repo's oldest recurring
   * fault.
   *
   * ⚠️ A SHARE OF THE IMAGE IS NOT A SHARE OF THE VIEWPORT. The backdrop is drawn `object-fit:
   * cover`, so on any frame whose aspect differs from the image's 1.79 the picture is cropped and
   * the painted surface moves. RailLine floated its train 44px above the rail on a 2000×970 window
   * for exactly this; `runLayout` maps through the real cover transform.
   */
  groundY: number
  /**
   * …and where that surface BEGINS — the wall/floor join on the two floor sites, the top of the
   * usable wall on the two bench sites. A PREFERENCE, not a cap: the bench stays on the painted
   * surface when it fits and borrows above it when the job needs the room, bounded by `topCeiling`.
   */
  topY: number
  /** The unit's own hue and saturation, MEASURED off the generated sprite — used by the fallback
   *  block so a 404 still degrades to something countable in roughly the right colour. */
  hue: number
  sat: number
  /** The SCENE's own dominant hue over the band the bench occupies, measured off the generated
   *  file. ⚠️ It exists so the gate can assert the unit clears the picture it stands in — the
   *  craft doc's rule is hue OR saturation, never neither, and a unit that vanishes into its own
   *  backdrop is a manipulative the child cannot count. */
  sceneHue: number
  /** …and its VALUE over that same band. ⚠️ The craft doc's twice-paid-for rule: a backdrop must
   *  sit UNDER what stands on it. `grocery_sweets` measured 0.892 against a cast at 0.70–0.92 and
   *  turned the characters into cut-outs on a blank page; FitOut's planting field measured 0.728
   *  against Milo's 0.705 and was replaced for it. Every free painted scene in this library
   *  measures 0.71–0.96, which is why these four were generated rather than reused. */
  sceneVal: number
  unit: string        // "parcel"
  units: string       // "parcels"
  sprite: string
  /** What receives a share. */
  slot: string        // "van"
  slots: string       // "vans"
  /** Who wants it — said once when the site comes up, so the job is a job and not a sum. */
  job: string
}

export const SITES: Site[] = [
  {
    id: 'dispatch', label: 'the dispatch hall', emoji: '🚚',
    scene: '/assets/backgrounds/run_dispatch.jpeg', groundY: 0.86, topY: 0.535,
    hue: 180, sat: 0.59,
    sceneHue: 30,
    sceneVal: 0.501,
    unit: 'parcel', units: 'parcels', slot: 'van', slots: 'vans',
    sprite: '/assets/objects/run_parcel.png',
    job: 'Every van leaves at six, and they all leave with the same.',
  },
  {
    id: 'charge', label: 'the charge bay', emoji: '🔋',
    scene: '/assets/backgrounds/run_charge.jpeg', groundY: 0.86, topY: 0.616,
    hue: 60, sat: 0.60,
    sceneHue: 180,
    sceneVal: 0.513,
    unit: 'cell', units: 'cells', slot: 'rover', slots: 'rovers',
    sprite: '/assets/objects/run_cell.png',
    job: 'A rover with fewer cells than the rest comes home early.',
  },
  {
    id: 'mess', label: 'the mess line', emoji: '🍱',
    scene: '/assets/backgrounds/run_mess.jpeg', groundY: 0.71, topY: 0.04,
    hue: 0, sat: 0.44,
    sceneHue: 120,
    sceneVal: 0.533,
    unit: 'tin', units: 'tins', slot: 'tray', slots: 'trays',
    sprite: '/assets/objects/run_tin.png',
    job: 'Nobody on this crew eats less than anybody else.',
  },
  {
    id: 'parts', label: 'the parts bench', emoji: '🧰',
    scene: '/assets/backgrounds/run_parts.jpeg', groundY: 0.63, topY: 0.03,
    hue: 195, sat: 0.44,
    sceneHue: 0,
    sceneVal: 0.359,
    unit: 'cog', units: 'cogs', slot: 'kit', slots: 'kits',
    sprite: '/assets/objects/run_cog.png',
    job: 'A kit that goes out short is a job that comes back.',
  },
]

/**
 * ⚠️ "SHUFFLE THEM RANDOMLY" AND "CONSECUTIVE ROUNDS MUST DIFFER" ARE NOT THE SAME REQUEST, and a
 * plain shuffle satisfies only the first — it will happily deal the same site twice in a row, which
 * is the one thing the craft rule forbids, because a scene that repeats back-to-back reads as the
 * round not having changed. This deals randomly AND rejects an adjacent repeat.
 */
export function runOrder(len: number, pickIdx: (n: number) => number = (n) => rint(0, n - 1)): number[] {
  const out: number[] = []
  while (out.length < len) {
    const bag = shuffle(SITES.map((_, i) => i))
    if (out.length && bag[0] === out[out.length - 1]) {
      const j = 1 + pickIdx(bag.length - 1)
      ;[bag[0], bag[j]] = [bag[j], bag[0]]
    }
    for (const b of bag) { if (out.length < len) out.push(b) }
  }
  return out
}

// ─── The question ───────────────────────────────────────────────────────────────────────
const pick = <T,>(a: readonly T[]) => a[rint(0, a.length - 1)]

export type QType = 'share' | 'group'
export const Q_ALL: readonly QType[] = ['share', 'group'] as const

/** The most units a round may put on the bench, so the pile stays countable. See the header. */
export const MAX_LOAD = 24
/** The most receiving slots the bench may draw. Exported so `makeRound` and the gate read the SAME
 *  number — a test that re-types the cap cannot see the cap being changed. */
export const MAX_SLOTS = 7
/** Milo's own measured value. A backdrop brighter than this is brighter than the character
 *  standing on it, which is the fault the founder caught on `grocery_sweets`. */
export const MILO_VAL = 0.705

export interface DvRound {
  qType: QType
  site: Site
  /** The dividend — what arrives in the crate. */
  total: number
  /** How many receivers a step hands to (`share`) — this is the DIVISOR and is given. */
  groups: number
  /** How many a full receiver holds (`group`) — this is the DIVISOR and is given. */
  per: number
  /** What is left in the crate when the deal is complete. */
  rem: number
  /** How many receiving slots the bench DRAWS. On a `group` round always more than the job needs,
   *  so nothing on screen says "that's enough" — deciding is the skill. */
  slotsShown: number
  /** The number of complete STEPS — what the child builds, either way. */
  answer: number
  ask: string
  done: string
}

/**
 * What one Deal takes out of the crate. The whole chapter turns on this being ONE number:
 *   share → `groups`, because a step hands one to each receiver
 *   group → `per`,    because a step fills one receiver
 * so `answer = ⌊total / stepCost⌋` and `rem = total % stepCost` in both readings, and there is one
 * grader rather than two that can drift apart.
 */
export const stepCost = (d: Pick<DvRound, 'qType' | 'groups' | 'per'>) =>
  d.qType === 'share' ? d.groups : d.per

/** The most any one slot can hold — a share round can be over-dealt by one, which must still fit. */
export const capacityOf = (d: DvRound) => (d.qType === 'share' ? d.answer + 1 : d.per)

/**
 * ⚠️ `asked` IS NOT DECORATION. Mastery fires at the top tier on a streak of six and promotion takes
 * three per tier, so a child who answers well is asked roughly three questions at L1, ONE at L2 and
 * TWO at L3. `group` — the other whole reading of division — first exists at L2, so drawn at random
 * it is missed outright a large share of the time. While a declared type is unmet the generator
 * spends a scarce round on it; once covered it goes back to random, because hardest-first for ever
 * destroys the variety the coverage gate exists to protect.
 */
export function makeRound(d: 1 | 2 | 3, round = 0, asked: readonly string[] = []): DvRound {
  const site = SITES[runOrderFor(round)]
  const pool: QType[] = d === 1 ? ['share'] : d === 2 ? ['share', 'group'] : ['group', 'share', 'group']
  const unmet = pool.filter(q => !asked.includes(q))
  const qType = unmet.length ? pick(unmet) : pick(pool)

  // The divisor, and how many times it goes in. Capped together so the load stays countable.
  const cost = d === 1 ? rint(2, 4) : d === 2 ? rint(2, 5) : rint(3, 6)
  /**
   * ⚠️ A GROUP ROUND'S ANSWER IS CAPPED ONE BELOW THE SLOT LIMIT, AND IT IS NOT TIDINESS. The bench
   * draws `answer + 1..2` slots clamped to `MAX_SLOTS`, so at `answer === MAX_SLOTS` the spare
   * vanishes — and on a group round the number of FILLED slots *is* the answer, so a bench that
   * ends up exactly full has answered the question before it was asked. Worse, `slotCounts` then
   * has nowhere to put the remainder and the units silently stop being conserved: caught by the
   * gate at `answer = 7`, where 22 units handed out drew 21. FitOut shipped the mirror image of
   * this — a frame holding FEWER rails than the answer needed — and it was 3,357 unwinnable rounds
   * in 60,000 draws, all at a tier that takes several correct answers to reach. Nothing on screen
   * would ever have shown either.
   */
  const maxAns = (d === 1 ? 5 : d === 2 ? 6 : 7) - (qType === 'group' ? 1 : 0)
  const answer = rint(2, Math.max(2, Math.min(maxAns, Math.floor(MAX_LOAD / cost))))
  // ⚠️ L1 IS ALWAYS EXACT. A remainder is a second idea and the first tier is for the act itself —
  // hand one to each, go round again, stop. TickTock's ladder: past before to.
  const rem = d === 1 ? 0 : rint(0, cost - 1)
  const total = cost * answer + rem

  if (qType === 'share') {
    const groups = cost
    return {
      qType, site, total, groups, per: answer, rem,
      // The receivers ARE the divisor and are given, so drawing exactly `groups` of them gives
      // nothing away — the answer is how many each, not how many there are.
      slotsShown: groups, answer,
      ask: `${total} ${site.units} in, ${groups} ${site.slots} out. They all get the same.`,
      done: rem > 0
        ? `${total} shared between ${groups} is ${answer} each, and ${rem} won't go round.`
        : `${total} shared between ${groups} is ${answer} each.`,
    }
  }
  return {
    qType, site, total, groups: answer, per: cost, rem,
    // ⚠️ ALWAYS SPARE SLOTS. The count of filled slots IS the answer here, so a bench holding
    // exactly the right number would answer the question before it was asked.
    slotsShown: Math.min(answer + rint(1, 2), MAX_SLOTS), answer,
    ask: `${total} ${site.units} in, ${cost} to a ${site.slot}. Fill what you can.`,
    done: rem > 0
      ? `${total} in ${cost}s is ${answer} full ${site.slots}, and ${rem} left over.`
      : `${total} in ${cost}s is ${answer} full ${site.slots}.`,
  }
}

/**
 * The site for a given round. Built ONCE per mount so the order is stable within a run (a child who
 * looks away and back must not find the place changed) and different between runs.
 */
let RUN: number[] = runOrder(16)
export const runOrderFor = (round: number) => RUN[Math.min(round, RUN.length - 1)]
export const reshuffleRun = () => { RUN = runOrder(16) }

/**
 * The one grader, driven by the same number the scene commits: how many units have LEFT THE CRATE.
 *
 * ⚠️ IT GRADES ON `handed`, NOT ON THE STEP COUNT, AND THAT IS WHAT CATCHES A PART-DEALT ROUND.
 * A step hands out `min(stepCost, whatever is left)`, so a partial can only ever be the last one —
 * which means `handed` is either `k × stepCost` (stopped after k whole rounds) or `total` (a partial
 * went out). Only the exact full-step amount is right.
 */
export function grade(data: DvRound, handed: number): boolean {
  return handed === data.answer * stepCost(data)
}

/**
 * The written miss line. ⚠️ It never states the answer and never states the remainder — both are
 * things the child is being asked to produce. It names what is wrong with what they built, which is
 * the only thing that helps and the only thing that is safe to say.
 */
export function missFor(data: DvRound, handed: number): string {
  const { site } = data
  const full = data.answer * stepCost(data)
  if (handed > full) {
    return data.qType === 'share'
      ? `That last round did not go all the way round — some ${site.slots} have more than others.`
      : `That last ${site.slot} is not full. It cannot go out like that.`
  }
  return data.qType === 'share'
    ? `There is still enough in the crate to go round again.`
    : `There is still enough in the crate to fill another ${site.slot}.`
}

/** What the lane can be saying, in the order the checks run. */
export type LaneState = 'ready' | 'return' | 'empty'

/**
 * How wide the deal may be drawn once it carries a sentence instead of two words.
 *
 * ⚠️ EXPORTED SO THE GATE DRIVES THE SAME FUNCTION THE CONTROL IS SIZED BY. It was inlined, and the
 * row-fit check carried its own copy of `vw * 0.34` — so widening the real one back to the 0.46 that
 * overflowed left the gate perfectly green. That is this repo's own recorded fault (*a gate that
 * re-implements a rule cannot see the rule being removed*), and it was caught by mutating the
 * SOURCE after an earlier "proof" that had mutated the TEST instead, which proves nothing.
 */
export const laneMinW = (vw: number, btnH: number) => Math.min(vw * 0.34, Math.round(btnH * 12))

/**
 * THE ONE CONTROL'S LABEL, PER READING AND PER INPUT.
 *
 * ⚠️ THIS IS THE ONLY PLACE ON SCREEN THAT NAMES WHICH DIVISION IS BEING DONE, WHICH IS WHY IT
 * CANNOT BECOME ONE CONSTANT WHEN THE CAMERA COMES ON. The button already said `Deal one round ▸`
 * on a `share` round and `Fill a van ▸` on a `group` one, and this chapter's whole header insists
 * those two readings ARE the mathematics rather than a tidiness win. A round-type-blind "sweep to
 * deal" would say *deal* over a bench where a step FILLS ONE VAN — the craft doc's *adding an input
 * means re-wording every line that names a gesture*, arriving from the other direction: the wording
 * would not be wrong, it would address the wrong reading, and no single-mode check can see it.
 * The gate asserts share ≠ group in BOTH input modes.
 *
 * ⚠️ AND THE CAMERA PATH NAMES THE TAP THAT COMMITS. Undo and Send stay taps — the hand does the
 * thing that IS the maths and taps do the actions — so a child who has swept the right number of
 * times and is waiting for something to happen must be told what finishes it. FitOut shipped the
 * mirror image of this (a round built with taps while the camera was on, saying nothing) and it is
 * the dead-button fault twice over.
 */
export function dealAsk(d: Pick<DvRound, 'qType' | 'site'>, hand: boolean, state: LaneState = 'ready'): string {
  const s = d.site
  if (!hand) return d.qType === 'share' ? 'Deal one round ▸' : `Fill a ${s.slot} ▸`
  if (state === 'empty') return `The crate is empty — tap Send it out ✓`
  // ⚠️ SAID AT THE MOMENT IT APPLIES. After a sweep fires, the hand is sitting on the right and
  // pushing further right crosses nothing — FitOut's `handHint` lesson, and without it the child
  // meets silence on the only gesture they have.
  if (state === 'return') return `Bring your hand back to the left ←`
  return d.qType === 'share' ? `Sweep across: one to every ${s.slot} ▸` : `Sweep across to fill a ${s.slot} ▸`
}

// ─── Layout ─────────────────────────────────────────────────────────────────────────────
export const CHROME_PX = 46
/** The shortest band the bench may be squeezed into before it is allowed to reach above the painted
 *  surface — below this the units stop being countable, which is the worse fault. */
export const MIN_BAND = 104
export const MILO_X = 0.085
export const MILO_SHARE = 0.22
/** The bottom control row: Take it back · Deal · Send it out. Tap targets, so it never shrinks
 *  below a finger — the world yields to it, not the other way round. */
export const CTRL_BAND = (vh: number) => Math.round(Math.max(74, Math.min(vh * 0.16, 108)))
/**
 * ⚠️ THE BOTTOM IS TWO STACKS WHEN THE CAMERA IS ON, NOT ONE — the control row in the centre AND
 * the self-view in the corner, which is opaque and drawn above the bench. Reserving only for the
 * controls let the receivers run under the camera panel; measured, that happened in 41% of draws.
 * Take whichever is taller, which is Factor Lab's `BOT_BAND` arrived at from the same direction.
 * On the tap path there is no self-view at all, so the first term is the whole of it and the bench
 * is byte-identical to what shipped.
 */
export const bottomBand = (vh: number, cam: boolean) => {
  const ctrl = CTRL_BAND(vh) + 10
  if (!cam) return ctrl
  const short = vh < 470
  return Math.max(ctrl, Math.round(CAM_W(short) * 0.75 + CAM_BOTTOM(short) + 10))
}
/**
 * The widest a single unit cell may be drawn — DERIVED FROM MILO, not picked. A unit is 0.84 of the
 * pitch, so at the cap it stands at 52% of his own height, which is the right way round for a
 * parcel beside a pony (the craft doc's character-vs-object size rank). A fixed number of any value
 * is wrong on some window: FitOut's fixed 76 left a four-wide job at 11% of the screen at 1800×870.
 */
export const pitchMax = (vh: number) => Math.round(vh * MILO_SHARE * 0.52 / 0.84)
/** The band the bench would LIKE, so it can draw every row at full size. */
export const bandWanted = (rows: number, vh: number) =>
  Math.max(MIN_BAND, rows * Math.floor(pitchMax(vh) * 1.12))
/**
 * The highest the bench's top may reach — how far it may borrow ABOVE the painted surface, in that
 * surface's own terms rather than as a viewport share. FitOut shipped an unbounded borrow for one
 * pass and put four of seven rails over open sky; where the surface is deep (the mess wall runs
 * 0.04→0.71) this never binds, and where it is a shallow strip it binds hard, which is its case.
 */
export const topCeiling = (surfaceTop: number, groundPx: number) =>
  surfaceTop - (groundPx - surfaceTop) * 0.6
/**
 * How wide Milo's bubble may be. ⚠️ ONE FUNCTION, read by the layout AND by the bubble itself —
 * FitOut carries this number twice, in `fitLayout` and in `Foreman`, which is the craft doc's *two
 * places deciding one thing* waiting to drift.
 *
 * ⚠️ AND THE SHARE IS 0.34, NOT 0.40, BECAUSE THE 380 CAP ONLY EVER BINDS ON A BIG SCREEN. At
 * 1280 wide, `0.4 × vw` is 512 and the cap cuts it to 380 — 30% of the frame. At 640 nothing binds
 * and the bubble takes the full 40%, so the SMALLEST screen was handing the widest proportional
 * reserve to the words and the narrowest to the thing being counted: measured, a 29-unit job at
 * the parts bench drew 11px cogs, which is under the size this repo calls uncountable. At 0.34 the
 * cap still binds at 1280 and nothing above it changes at all.
 */
export const bubbleW = (vw: number) => Math.min(vw * 0.34, 380)

export interface RunLayout {
  groundPx: number
  /** Pitch between unit centres, and the drawn unit inside it. */
  pitch: number
  unitPx: number
  /** The crate: its box, and how its pile is stacked. */
  crateX: number; crateW: number; crateH: number; crateCols: number
  /** The receiving slots: where the row starts, one slot's box, and the step between them. */
  slotX0: number; slotW: number; slotH: number; slotStep: number; slotCols: number
  /** Both stand on this line. */
  foot: number
  benchTop: number
  miloH: number
  miloX: number
  /** CSS `bottom` of Milo's bubble — derived so its bottom edge clears the control row's top edge.
   *  ⚠️ Derived HERE, next to the number it must clear, rather than inline in `Quarter` where it
   *  could drift: FitOut shipped a pad whose digit windows were drawn on top of the bubble because
   *  the sweep checked every pair containing the frame and never bubble-against-controls. */
  bubbleBottom: number
  ctrlBand: number
  font: number
}

/** Everything is derived from the room actually available, never picked. */
export function runLayout(vw: number, vh: number, data: DvRound, cam = false): RunLayout {
  const { site } = data
  const fit = Math.max(vw / IMG_W, vh / IMG_H)
  const drawnH = IMG_H * fit
  const groundPx = Math.round((vh - drawnH) / 2 + site.groundY * drawnH)
  const surfaceTop = (vh - drawnH) / 2 + site.topY * drawnH

  const ctrlBand = CTRL_BAND(vh)
  const miloH = Math.round(vh * MILO_SHARE)
  const miloX = Math.round(vw * MILO_X)

  /** ⚠️ THE BENCH CLEARS MILO'S BUBBLE, NOT JUST MILO. The bubble is far wider than he is and sits
   *  at the height the lower rows occupy. RailLine paid for this: measured at 640×320 its bubble
   *  covered two of six answer boards. Derived from the bubble's own left and max width. */
  const bubbleLeft = Math.max(8, miloX - miloH * 0.2)
  const bubbleRight = bubbleLeft + bubbleW(vw)
  const benchLeft = Math.round(Math.max(bubbleRight + 12, vw * 0.15))
  const benchW = Math.round(vw * 0.96 - benchLeft)

  const capacity = capacityOf(data)
  const CRATE_GAP = 1.4, SLOT_GAP = 0.55
  /** The tallest arrangement any candidate below can ask for, so the band is granted the room the
   *  search might want. Using it here rather than a chosen shape is what breaks the circularity —
   *  the band decides the pitch, and the pitch is what the shape is chosen by. */
  const maxRows = Math.max(Math.ceil(data.total / 3), capacity)

  /**
   * ⚠️ NO FLOOR ON THE BAND. `Math.max(80, foot - top)` reads as a sensible minimum and is exactly
   * the craft doc's *a size derived from a MAXIMUM can exceed that maximum*: when the painted
   * surface is shorter than the floor, the floor hands out room that is not there and the bench
   * climbs back over the horizon.
   */
  const chromeTop = bannerBottom(vh) + 8
  const foot = Math.round(Math.min(groundPx, vh - bottomBand(vh, cam)))
  const top = Math.round(Math.max(
    chromeTop, topCeiling(surfaceTop, groundPx),
    Math.min(surfaceTop, foot - bandWanted(maxRows, vh)),
  ))
  const bandH = foot - top

  /**
   * ⚠️ THE COLUMN SHAPE IS SEARCHED, NOT PICKED — because any fixed one is width-bound on some site
   * and height-bound on another, and the loser is always the unit the child has to count. Measured
   * on screen at the parts bench, whose bench line sits low at 0.63 and which draws six slots: a
   * hardcoded two-column slot gave `byWidth` 36 against `byHeight` 107, so the bench was sized to
   * the SHORT dimension and drew 30px cogs with half the wall above it standing empty. That is
   * FitOut's doormat fault with the axes swapped, and the same answer applies — derive it from the
   * room actually available. Eight arrangements; take whichever leaves the biggest unit.
   */
  let shape = { slotCols: 1, crateCols: 3, pitch: 0 }
  for (let slotCols = 1; slotCols <= Math.min(2, capacity); slotCols++) {
    const slotRows = Math.ceil(capacity / slotCols)
    for (let crateCols = 3; crateCols <= 8; crateCols++) {
      const cols = crateCols + CRATE_GAP + data.slotsShown * slotCols + (data.slotsShown - 1) * SLOT_GAP
      const rows = Math.max(Math.ceil(data.total / crateCols), slotRows)
      const p = Math.min(benchW / cols, bandH / (rows * 1.12), pitchMax(vh))
      if (p > shape.pitch) shape = { slotCols, crateCols, pitch: p }
    }
  }
  const { slotCols, crateCols } = shape
  const slotRows = Math.ceil(capacity / slotCols)
  const crateRows = Math.ceil(data.total / crateCols)
  const pitch = Math.max(7, shape.pitch)
  const unitPx = Math.round(pitch * 0.84)

  const crateW = Math.round(crateCols * pitch)
  const crateH = Math.round(crateRows * pitch)
  const slotW = Math.round(slotCols * pitch)
  const slotH = Math.round(slotRows * pitch)
  const slotStep = Math.round((slotCols + SLOT_GAP) * pitch)
  const usedW = crateW + Math.round(CRATE_GAP * pitch) + (data.slotsShown - 1) * slotStep + slotW
  /** Centred in the WHOLE frame, pushed right only as far as Milo's bubble actually requires —
   *  centred in the leftover band instead, a narrow job drifts right of centre with the left of the
   *  picture empty and Milo a screen away from the thing he is talking about. */
  const crateX = Math.round(Math.max(benchLeft, (vw - usedW) / 2))
  const slotX0 = crateX + crateW + Math.round(CRATE_GAP * pitch)

  const bubbleBottom = Math.min(
    Math.max(Math.round(miloH * 0.84), ctrlBand + 16),
    vh - CHROME_PX - 88,
  )
  return {
    groundPx, pitch, unitPx,
    crateX, crateW, crateH, crateCols,
    slotX0, slotW, slotH, slotStep, slotCols,
    foot, benchTop: Math.round(foot - Math.max(crateH, slotH)),
    miloH, miloX, bubbleBottom, ctrlBand,
    font: Math.round(Math.max(12, Math.min(vw * 0.016, 20))),
  }
}

/** Where the i-th unit of a bottom-up pile sits inside its box. */
export function pileSpot(i: number, cols: number, rowsTotal: number, L: RunLayout) {
  const col = i % cols
  const row = Math.floor(i / cols)
  return { x: col * L.pitch, y: (rowsTotal - 1 - row) * L.pitch }
}

/** How many units each receiving slot holds after `handed` units have left the crate. A step lands
 *  one-per-slot when sharing and all-in-one when grouping — the only place the two readings differ. */
export function slotCounts(data: DvRound, handed: number): number[] {
  const out = Array(data.slotsShown).fill(0)
  if (data.qType === 'share') {
    for (let i = 0; i < data.slotsShown; i++) {
      out[i] = Math.floor(handed / data.groups) + (i < handed % data.groups ? 1 : 0)
    }
  } else {
    for (let i = 0; i < data.slotsShown; i++) {
      out[i] = Math.max(0, Math.min(data.per, handed - i * data.per))
    }
  }
  return out
}

// ─── The bench: crate, slots, units ─────────────────────────────────────────────────────
/** The unit's faces are DERIVED from one hue rather than typed out, so a handful of hex values
 *  cannot rot one at a time — BlockYard's rule. Only the 404 fallback uses them. */
const shades = (hue: number, sat: number) => ({
  face: `hsl(${hue} ${Math.round(sat * 100)}% 62%)`,
  lit: `hsl(${hue} ${Math.round(sat * 100)}% 74%)`,
  deep: `hsl(${hue} ${Math.round(sat * 100)}% 44%)`,
})

/**
 * One unit — the site's OWN painted object, and it FLIES from the crate to where it lands.
 *
 * The flight is one CSS keyframe reading a per-unit offset, so the travelling thing and the thing
 * that arrives are ONE element: a separate flyer positioned alongside is one duration change away
 * from desyncing, which is the shadow-outran-the-feet fault this repo has shipped once.
 */
function Unit({ s, m, src, fx, fy, delayMs }: {
  s: number; m: ReturnType<typeof shades>; src: string
  /** where it came FROM, relative to where it lands. 0/0 for a unit that has always been there. */
  fx: number; fy: number; delayMs: number
}) {
  const [broken, setBroken] = useState(false)
  const flying = fx !== 0 || fy !== 0
  return (
    <span style={{
      // ⚠️ `display: block` is load-bearing. A <span> is inline by default, so width/height simply
      // do not apply — FitOut's units were in the DOM, correct in number, and measured 0 × 0.
      display: 'block', position: 'relative', width: s, height: s,
      ...(broken ? {
        borderRadius: Math.max(2, Math.round(s * 0.18)),
        background: `linear-gradient(160deg, ${m.lit} 0%, ${m.face} 55%, ${m.deep} 100%)`,
        boxShadow: `inset 0 ${Math.max(1, s * 0.06)}px 0 rgba(255,255,255,.35), 0 ${Math.max(1, s * 0.07)}px 0 ${m.deep}`,
      } : null),
      /**
       * ⚠️ `backwards`, NOT `both`. With `both` the unit's ONLY opacity comes from the animation's
       * end frame, so anywhere the animation does not run to completion — a backgrounded tab, a
       * dropped frame, an engine that refuses it — the piece holds the FROM state and the bench
       * reads as EMPTY. Measured in a hidden tab on FitOut: 36 units in the DOM, every one at
       * opacity 0. The element carries opacity 1 itself; the animation only borrows the run-up.
       */
      opacity: 1,
      ...(flying ? {
        ['--fx' as string]: `${fx}px`, ['--fy' as string]: `${fy}px`,
        animation: 'sr_fly .42s cubic-bezier(.3,1.2,.5,1) backwards',
        animationDelay: `${delayMs}ms`,
      } : null),
    }}>
      {!broken && (
        <img
          src={src} alt="" aria-hidden draggable={false} onError={() => setBroken(true)}
          style={{
            width: '100%', height: '100%', objectFit: 'contain', display: 'block',
            filter: `drop-shadow(0 ${Math.max(1, s * 0.045)}px ${Math.max(1, s * 0.05)}px rgba(40,32,22,.32))`,
          }}
        />
      )}
    </span>
  )
}

/**
 * A pile of units in a box, stacked bottom-up. Used for the crate AND for every receiving slot, so
 * they cannot be drawn to different rules.
 *
 * ⚠️ THE BOX IS POSTS AND A BASE, NEVER A FILLED PANEL. A solid rounded rectangle over a painted
 * scene reads as UI furniture however well its colour is matched — BlockYard paid for that three
 * times, and FitOut once more. The ground under it is a tint that fades to nothing at its own
 * edges, because a trodden patch has no border.
 *
 * ⚠️ AND IT IS DRAWN AT FULL SIZE WHILE EMPTY. A lane that will fill has to be reserved from empty
 * or everything beside it jumps a whole unit when the first piece lands — MeasureIt's fix.
 */
function Pile({ n, cols, rows, w, h, x, L, m, src, from, label }: {
  n: number; cols: number; rows: number; w: number; h: number; x: number
  L: RunLayout; m: ReturnType<typeof shades>; src: string
  /** centre of the crate, so a landing unit knows where it flew from. null = no flight. */
  from: { x: number; y: number } | null
  /** ⚠️ There is deliberately no `dim` for an empty receiver. Fading the thing the child is
   *  dealing INTO is the opposite of what it needs — it must read at its clearest when empty,
   *  because that is when it is carrying the whole question. */
  label?: string
}) {
  const postW = Math.max(3, Math.round(L.pitch * 0.11))
  /**
   * ⚠️ EVERY DRAWN PART OF THE BOX IS DERIVED FROM `pitch` AND ANCHORED TO THE BASE — NEVER FROM
   * THE BOX'S OWN HEIGHT. The box is `slotRows × pitch` tall and on a SHARE round its capacity is
   * `answer + 1`, so anything drawn to the box's full height is the answer, printed as a length.
   * The ground tint was exactly that: `top: -pitch*0.15` with `bottom: -pitch*0.34` spans the whole
   * box, so an empty receiver glowed taller on a round with a bigger answer. Caught while making
   * the empty receivers visible — the leak and the invisibility are the same line.
   */
  const postH = Math.round(L.pitch * 0.62)
  return (
    <div style={{ position: 'fixed', left: x, top: L.foot - h, width: w, height: h, zIndex: 30 }}>
      <span aria-hidden style={{
        position: 'absolute', left: -L.pitch * 0.5, right: -L.pitch * 0.5,
        bottom: -L.pitch * 0.34, height: L.pitch * 1.05,
        background: 'radial-gradient(ellipse at center, rgba(48,38,26,.24) 0%, rgba(48,38,26,0) 72%)',
      }} />
      {/* The receiver: a base and a post at each end — an open-topped bin, never a filled panel.
          ⚠️ It has to READ WHILE EMPTY. At `pitch * 0.42` on a busy wooden bench the two empty kits
          were faint scratches and there was no telling where the cogs were being dealt TO. */}
      <div style={{
        position: 'absolute', left: -postW, right: -postW, bottom: -postW, height: Math.round(postW * 1.35),
        borderRadius: postW, background: 'rgba(52,40,28,.62)',
        boxShadow: '0 1px 0 rgba(255,248,236,.22)',
      }} />
      {[0, 1].map(i => (
        <span key={i} aria-hidden style={{
          position: 'absolute', bottom: -postW, height: postH, width: postW,
          borderRadius: postW, background: 'rgba(52,40,28,.58)',
          boxShadow: 'inset 1px 0 0 rgba(255,248,236,.20)',
          left: i === 0 ? -postW : undefined, right: i === 1 ? -postW : undefined,
        }} />
      ))}
      {Array.from({ length: n }).map((_, i) => {
        const p = pileSpot(i, cols, rows, L)
        return (
          <span key={i} style={{ position: 'absolute', left: p.x, top: p.y }}>
            <Unit s={L.unitPx} m={m} src={src}
              fx={from ? from.x - (x + p.x) : 0} fy={from ? from.y - (L.foot - h + p.y) : 0}
              delayMs={from ? (i % cols) * 42 : 0} />
          </span>
        )
      })}
      {label && (
        <span aria-hidden style={{
          position: 'absolute', left: 0, right: 0, bottom: -Math.round(L.pitch * 0.86), textAlign: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: Math.max(9, Math.round(L.pitch * 0.34)),
          color: 'rgba(255,250,240,.82)', textShadow: '0 1px 3px rgba(20,14,8,.9)', letterSpacing: .5,
        }}>{label}</span>
      )}
    </div>
  )
}

/** Crate + every receiving slot. */
function Bench({ data, handed, L }: { data: DvRound; handed: number; L: RunLayout }) {
  const m = shades(data.site.hue, data.site.sat)
  const counts = slotCounts(data, handed)
  const capacity = capacityOf(data)
  const crateRows = Math.ceil(data.total / L.crateCols)
  const slotRows = Math.ceil(capacity / L.slotCols)
  const left = data.total - handed
  // where a flying unit comes from: the middle of what is still in the crate
  const from = { x: L.crateX + L.crateW * 0.5 - L.unitPx * 0.5, y: L.foot - L.crateH * 0.45 }
  return (
    <>
      <Pile n={left} cols={L.crateCols} rows={crateRows} w={L.crateW} h={L.crateH} x={L.crateX}
        L={L} m={m} src={data.site.sprite} from={null} label="crate" />
      {counts.map((c, i) => (
        <Pile key={i} n={c} cols={L.slotCols} rows={slotRows} w={L.slotW} h={L.slotH}
          x={L.slotX0 + i * L.slotStep} L={L} m={m} src={data.site.sprite}
          from={from} />
      ))}
    </>
  )
}

/** Milo, and the job in a bubble at his mouth — the speaker owns the question. */
function Quarter({ L, line, vw }: { L: RunLayout; line: string; vw: number }) {
  return (
    <>
      <div style={{ position: 'fixed', left: L.miloX, bottom: 0, zIndex: 38, transform: 'translateX(-50%)', pointerEvents: 'none' }}>
        {/* The contact shadow sits INSIDE the element and above bottom:0 — SliceShop shipped one
            clipped away under the viewport, i.e. fixed in the DOM and absent on screen. */}
        <div style={{ position: 'relative', paddingBottom: Math.round(L.miloH * 0.06) }}>
          <span aria-hidden style={{
            position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
            width: '76%', height: Math.round(L.miloH * 0.11), borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(46,38,24,.30) 0%, rgba(46,38,24,0) 72%)',
          }} />
          <SheetCell src="/assets/characters/milo_side.png" h={L.miloH} moving={false} breathe />
        </div>
      </div>
      <div style={{
        position: 'fixed', left: Math.max(8, L.miloX - L.miloH * 0.2), bottom: L.bubbleBottom,
        zIndex: 42, maxWidth: Math.round(bubbleW(vw)), pointerEvents: 'none',
      }}>
        <div style={{
          background: 'var(--paper, #fdf6e8)', border: '3px solid var(--outline, #3d2516)',
          borderRadius: '18px 18px 18px 4px', padding: '9px 13px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: L.font,
          color: 'var(--ink, #3d2516)', lineHeight: 1.35, boxShadow: '0 4px 0 rgba(61,37,22,.10)',
        }}>{line}</div>
      </div>
    </>
  )
}

export const RUN_CSS = `
@keyframes sr_fly { 0%{transform:translate(var(--fx),var(--fy)) scale(.62);opacity:.5} 100%{transform:none;opacity:1} }
@keyframes sr_out { 0%{transform:translateX(0);opacity:1} 100%{transform:translateX(60vw);opacity:0} }
`

// ─── Play ───────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'

const RunPlay: React.FC<{ data: DvRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const { read, input } = useHand()
  const onCam = input === 'hand'
  const L = runLayout(vw, vh, data, onCam)
  const cost = stepCost(data)

  /** How many units have LEFT THE CRATE. The whole board is a function of this one number. */
  const [handed, setHanded] = useState(0)
  const [said, setSaid] = useState<string | null>(null)
  const [settled, setSettled] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const erred = useRef(false)
  const done = useRef(false)
  /** ⚠️ A handler must never read the state it also sets — batched taps all see the same stale
   *  value, which this repo has now met five times (placeValue's undo, CoinShop's lay, TickTock's
   *  dial, SliceShop's piece, the parade's refill). The ref is the truth inside a tap. */
  const handedRef = useRef(0)
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }
  useEffect(() => () => { timers.current.forEach(clearTimeout); stopSpeech() }, [])
  useEffect(() => { if (mode === 'guided') speak(data.ask) }, [mode, data.ask])

  function finish(ok: boolean) {
    if (ok) {
      done.current = true
      setSettled(true); setSaid(data.done); speak(data.done)
      // the reward: what was made up goes out, and the remainder stays visibly behind
      later(() => setLeaving(true), 380)
      later(() => onComplete(mode === 'practice' ? !erred.current : true), 2300)
    } else {
      erred.current = true
      const line = missFor(data, handedRef.current)
      setSaid(line); speak(line)
      /**
       * ⚠️ `setSettled(false)` IS THE WHOLE RETRY. Without it the board clears and stays DEAD: every
       * control is gated on this flag, so one wrong answer left FitOut's child looking at the
       * question with nothing responding, for ever, on every question type. It survived there
       * because no gate can see it — the suite drives pure functions — and because a wrong answer
       * had never once been played. It is the craft doc's *a tap that does nothing at all is the
       * worst outcome there is*.
       */
      later(() => {
        setSaid(null); setSettled(false); setHanded(0); handedRef.current = 0
      }, 2400)
    }
  }

  /**
   * ⚠️ A STEP THE CRATE CANNOT COVER IS STILL ALLOWED, and that is the design rather than an
   * oversight — see the header. It hands out what is there, which is visibly wrong and undoable.
   * The button only goes dead when the crate is EMPTY, where it genuinely has nothing to do and the
   * empty crate on screen says why.
   */
  function deal() {
    if (done.current || settled) return
    const left = data.total - handedRef.current
    if (left <= 0) return
    const next = handedRef.current + Math.min(cost, left)
    handedRef.current = next; setHanded(next)
  }

  /**
   * ⚠️ THE HAND FIRES THE SAME `deal()` THE BUTTON FIRES — one instrument, two inputs, one grader,
   * so `grade` never learns which moved it and the chapter's existing 52-test sweep covers both.
   *
   * ⚠️ A LOOP OVER THE GAP, NOT ONE CALL PER OBSERVED CHANGE. `setRead` is driven from a rAF
   * callback and React may coalesce two of them into one render, so a counter that advances by two
   * between renders would deal ONCE and quietly lose a sweep the child performed.
   *
   * ⚠️ THE BASELINE ADVANCES OUTSIDE THE LOOP AND UNCONDITIONALLY, WHICH IS WHAT DISCARDS A
   * SWALLOWED SWEEP RATHER THAN QUEUEING IT. `deal()` no-ops while `settled`, and a wrong answer
   * holds `settled` for 2400 ms — so if the baseline only moved when a deal actually landed, three
   * sweeps performed while Milo reads the miss line would all replay the instant the board
   * re-opened, onto a freshly reset crate, as an answer the child never built.
   *
   * ⚠️ AND IT CLAMPS BACKWARDS, because `sweeps` is monotone only within a DETECTOR session, not
   * across the chapter: `useTaps` resets the whole reading and `start()` resets the detector, so
   * "Use the number pad instead" or one "Try the camera again" drops the counter to 0. Without the
   * clamp the baseline is stranded above it and the gesture is dead for the rest of the run.
   */
  const seenSweeps = useRef(read.sweeps)
  /**
   * ⚠️ REACHING FOR A TAP CROSSES THE SWEEP LANE. Undo and Send are the two controls that stay taps,
   * and on a touch device the child reaches down to them and back — the return is rightward, which
   * is a fire. That deal would land at the exact moment they are committing. A short lock after
   * either tap costs nothing and cannot mask a real sweep, which takes longer than this anyway.
   */
  const lockUntil = useRef(0)
  useEffect(() => {
    if (read.sweeps < seenSweeps.current) { seenSweeps.current = read.sweeps; return }
    if (Date.now() >= lockUntil.current) {
      for (let i = seenSweeps.current; i < read.sweeps; i++) deal()
    }
    seenSweeps.current = read.sweeps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [read.sweeps])

  /** The repair is a journey too (HomeTime's rule): the last step goes back into the crate. */
  function undo() {
    if (done.current || settled) return
    lockUntil.current = Date.now() + 700
    const h = handedRef.current
    if (h <= 0) return
    // take back the partial if there is one, otherwise one whole step
    const back = h % cost !== 0 ? h % cost : cost
    const next = Math.max(0, h - back)
    handedRef.current = next; setHanded(next)
  }

  function send() {
    if (done.current || settled || handedRef.current === 0) return
    lockUntil.current = Date.now() + 700
    setSettled(true)
    later(() => finish(grade(data, handedRef.current)), 300)
  }

  /** What the one control is saying right now — checked in the order a child would need them. */
  const laneState: LaneState = handed >= data.total ? 'empty' : read.sweepArmed ? 'ready' : 'return'

  const btnH = Math.round(L.ctrlBand * 0.5)
  const idle = { fontFamily: 'var(--font-display)', fontWeight: 900, border: 'none', cursor: 'pointer' } as const

  return (
    <>
      <style>{RUN_CSS}{CRITTER_CSS}</style>
      <img src={data.site.scene} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      <Banner text={data.ask} vh={vh} ok={settled && done.current} />
      <div style={{ animation: leaving ? 'sr_out 1.1s ease-in forwards' : undefined }}>
        <Bench data={data} handed={handed} L={L} />
      </div>
      <Quarter L={L} vw={vw} line={said ?? data.site.job} />

      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 8, zIndex: 44, display: 'flex',
        justifyContent: 'center', alignItems: 'center', gap: Math.round(btnH * 0.28),
        /** ⚠️ THE SELF-VIEW IS A LAYER AND IT SITS ON THIS ROW'S RIGHT END. `Send it out ✓` is the
         *  rightmost control and it is the tap the camera path DEPENDS on, so the row gives the
         *  panel its corner back rather than letting an opaque box land on it. */
        padding: onCam ? `0 ${CAM_W(vh < 470) + 18}px 0 10px` : '0 10px',
        opacity: settled ? .35 : 1, pointerEvents: settled ? 'none' : 'auto', transition: 'opacity .3s',
      }}>
        <button onClick={undo} disabled={handed === 0} style={{
          ...idle, height: btnH, padding: `0 ${Math.round(btnH * 0.5)}px`, borderRadius: 999,
          background: 'rgba(255,252,244,.94)', border: '3px solid var(--outline)', color: 'var(--ink)',
          fontSize: Math.round(btnH * 0.3), opacity: handed === 0 ? .4 : 1,
          cursor: handed === 0 ? 'default' : 'pointer',
        }}>↩ Take it back</button>
        {/* The main gesture. Identical at every count — nothing may say the set is right before the
            commit, so this control looks exactly the same on the step that completes the deal.

            ⚠️ ON THE CAMERA PATH IT IS THE SAME BUTTON, WEARING A LANE, AND STAYING TAPPABLE IS THE
            WHOLE POINT. Replacing it outright — which is what FitOut does with its digit pad, and
            what the plan asked for — makes a round UNSUBMITTABLE the moment a working camera fails
            to read a child's gesture: `send()` returns early at `handed === 0` and its button is
            disabled there, `undo` likewise, `SkillBeat` has no round timeout, and `CamGate` renders
            only when the camera did not START, so a camera that works and a gesture that does not
            shows nothing at all. The only control left would be ‹ Menu. One element, two ways to
            fire it, no dead end — and `deal()` stays a single greppable call site.

            ⚠️ THE FILL IS THE ARMING BAR AND IT IS NOT A VERDICT. It says how far through a crossing
            the trigger has read the hand — the same claim `DwellRing` makes — never whether the deal
            so far is right. Nothing else on screen reacts to it. */}
        <button onClick={deal} disabled={handed >= data.total} style={{
          ...idle, position: 'relative', overflow: 'hidden',
          height: Math.round(btnH * 1.22), padding: `0 ${Math.round(btnH * 0.8)}px`, borderRadius: 999,
          /** ⚠️ The control row has to FIT: at 640×320 a 46%-wide deal plus the two taps plus the
           *  self-view's reserved corner came to 641px of a 640px frame, and the row does not wrap —
           *  an overflow on the chapter's only answer surface. `laneMinW` is exported and gated. */
          minWidth: onCam ? laneMinW(vw, btnH) : undefined,
          background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
          fontSize: Math.round(btnH * (onCam ? 0.3 : 0.4)), boxShadow: '0 5px 0 rgba(180,70,20,.45)',
          opacity: handed >= data.total ? .4 : 1, cursor: handed >= data.total ? 'default' : 'pointer',
        }}>
          {onCam && (
            <span aria-hidden style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: `${read.sweepArm * 100}%`,
              background: 'rgba(255,255,255,.30)', transition: 'width .12s linear', pointerEvents: 'none',
            }} />
          )}
          <span style={{ position: 'relative' }}>{dealAsk(data, onCam, laneState)}</span>
        </button>
        <button onClick={send} disabled={handed === 0} style={{
          ...idle, height: btnH, padding: `0 ${Math.round(btnH * 0.5)}px`, borderRadius: 999,
          background: 'rgba(255,252,244,.94)', border: '3px solid var(--outline)', color: 'var(--ink)',
          fontSize: Math.round(btnH * 0.3), opacity: handed === 0 ? .4 : 1,
          cursor: handed === 0 ? 'default' : 'pointer',
        }}>Send it out ✓</button>
      </div>
    </>
  )
}

// ─── Demo / re-teach ────────────────────────────────────────────────────────────────────
/**
 * ⚠️ SELF-PACED, NOT `speakSteps`. That helper reveals each visual from the utterance's `onstart`,
 * so on the many devices where speech starts line one and silently drops the rest the teaching
 * freezes for ever — TickTock shipped exactly that and a founder sat on a lesson beat with no way
 * forward. Dwell comes from each line's own length and `speak()` rides alongside, so the words can
 * succeed, fail or half-fail without the teaching stopping.
 */
function dwellFor(line: string) { return Math.max(2100, Math.min(6200, line.length * 70)) }

/**
 * ⚠️ THE GESTURE IS TAUGHT WHERE THE MATHS IS, BECAUSE THE RE-TEACH IS THIS SAME LIST. A sweep is
 * not self-evident the way "hold up three fingers" or "tilt your hand" are — it carries four hidden
 * rules (left→right only, it must start from the left, the return stroke does nothing, and dropping
 * your hand resets it), and `reteachAfter: 3` means a child who is failing because they cannot make
 * the gesture read gets three wrong answers and then a lesson about DIVISION. That is a motor
 * failure diagnosed and re-taught as a mathematical one.
 *
 * ⚠️ IT IS A TRAILING BEAT RATHER THAN A LONGER OPENER, and the reason is arithmetic: `dwellFor`
 * caps at 6200ms, so the share opener's ceiling is 88 characters — a 94-character draft once put
 * ALL 572 generatable openers on the clamp and the next beat's `speak()` then cut the tail off. A
 * separate beat gets its own dwell. It lands at `handed: full`, so the demo still never deals the
 * remainder.
 */
const HAND_CUE = 'Your turn: sweep your hand across to send one round out.'

/**
 * The teaching beats: a line, and what the bench looks like while it is said.
 *
 * ⚠️ EXPORTED SO THE GATE CAN DRIVE THE SAME LIST THE DEMO PLAYS. It was inline, and it shipped the
 * one fault this whole chapter exists to fix — INSIDE THE TEACHING. The "what is left over" beat
 * dealt `answer × cost + rem`, i.e. the WHOLE crate, so the trace read
 *   `[crate 0, 3, 3, 3, 3, 2, 0]  «Only 2 left — that will not fill a van, so it stays behind»`
 * — the remainder had gone INTO a van while Milo said it stayed behind. A child watching that is
 * taught the opposite of the rule. Nothing could see it: the beats were component-local, the words
 * were right, and the numbers only disagree if you read them.
 * ⇒ THE INVARIANT, now pinned: the demo NEVER hands out more than the completed deal, so the crate
 * always finishes holding exactly the remainder.
 */
export function explainBeats(data: DvRound, hand = false): Array<{ say: string; handed: number }> {
  const s = data.site
  const cost = stepCost(data)
  /** Every beat stops here. What will not go round is never dealt — it stays in the crate. */
  const full = data.answer * cost
  const out: Array<{ say: string; handed: number }> = []
  if (data.qType === 'share') {
    /** ⚠️ THE ANCHOR, AS A SIMILE, AND ONLY HERE. It names the daily thing and then names what is
     *  actually on the bench in the same breath — "candy" alone over a crate of parcels would be the
     *  words describing a picture that is not there. `handed: 0` is untouched: the gate pins that the
     *  first beat deals nothing and that no beat ever hands out the remainder.
     *  ⚠️ AND IT IS SHORT BECAUSE `dwellFor` IS `max(2100, min(6200, len * 70))` — 88 characters is
     *  the ceiling. The first draft ran to 94 and, swept across every site, cost, answer and
     *  remainder, put ALL 572 share openers on the cap where none had been before; the next beat's
     *  `speak()` then cancels the utterance in flight and the tail is what goes. The tail here is
     *  "They all get the same" — the fairness rule this whole chapter is about. */
    out.push({ say: `Like sharing candy: ${data.total} ${s.units}, ${data.groups} ${s.slots}. They all get the same.`, handed: 0 })
    out.push({ say: `So I go round: one each. That is one round.`, handed: cost })
    for (let k = 2; k <= data.answer; k++) {
      out.push({ say: k === data.answer ? `And round ${k}.` : `Round ${k}.`, handed: k * cost })
    }
    out.push({
      say: data.rem > 0
        ? `Now there are only ${data.rem} left — not enough to go round again, so they stay in the crate.`
        : `The crate is empty, and I cannot go round again.`,
      handed: full,
    })
    out.push({ say: `Count one ${s.slot}: that is ${data.answer} each.`, handed: full })
    if (hand) out.push({ say: HAND_CUE, handed: full })
    return out
  }
  out.push({ say: `${data.total} ${s.units} in the crate, and they go ${cost} to a ${s.slot}.`, handed: 0 })
  out.push({ say: `So I fill one ${s.slot}: ${cost}.`, handed: cost })
  for (let k = 2; k <= data.answer; k++) {
    out.push({ say: `Another one. That is ${k}.`, handed: k * cost })
  }
  out.push({
    say: data.rem > 0
      ? `Only ${data.rem} left — that will not fill a ${s.slot}, so it stays behind.`
      : `The crate is empty.`,
    handed: full,
  })
  out.push({ say: `Count the full ones: ${data.answer} ${s.slots} go out.`, handed: full })
  if (hand) out.push({ say: HAND_CUE, handed: full })
  return out
}

const RunExplain: React.FC<{ data: DvRound; onDone: () => void }> = ({ data, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  // the same camera reserve the played bench takes, or the demo teaches on a bench that then moves
  const { input } = useHand()
  const L = runLayout(vw, vh, data, input === 'hand')
  const [handed, setHanded] = useState(0)
  const [line, setLine] = useState('')
  const doneRef = useRef(onDone); doneRef.current = onDone

  const beats = useMemo(() => explainBeats(data, input === 'hand'), [data, input])

  useEffect(() => {
    let i = 0, alive = true
    const timers: number[] = []
    const run = () => {
      if (!alive || i >= beats.length) { if (alive) timers.push(window.setTimeout(() => doneRef.current(), 1200)); return }
      const b = beats[i]
      setLine(b.say); setHanded(b.handed); speak(b.say)
      i++
      timers.push(window.setTimeout(run, dwellFor(b.say)))
    }
    run()
    return () => { alive = false; timers.forEach(clearTimeout); stopSpeech() }
  }, [beats])

  return (
    <>
      <style>{RUN_CSS}{CRITTER_CSS}</style>
      <img src={data.site.scene} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      <Banner text={data.ask} vh={vh} />
      <Bench data={data} handed={handed} L={L} />
      <Quarter L={L} vw={vw} line={line} />
    </>
  )
}

// ─── Beat + orchestrator ────────────────────────────────────────────────────────────────
export function makeBeat(): Beat<DvRound> {
  return {
    skillId: 'division', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d, round = 0, asked = []) => makeRound((d || 1) as 1 | 2 | 3, round + 3, asked),
    /** MATH ONLY. The site rotates every round, so a signature including it would read the changed
     *  scene as variety and let the same question straight back through. */
    sig: d => `${d.qType}|${d.total}/${stepCost(d)}`,
    /**
     * The closed set mastery may not exit before covering. `group` is the OTHER whole reading of
     * division and first exists at L2, so without this a strong child is asked it once at best.
     * ⚠️ STATED RATHER THAN HIDDEN: a child who never leaves L1 can never draw a `group`, so they
     * never complete coverage and never get the early exit. Harmless and bounded — the run still
     * ends at ten rounds, and mastery needs the top tier anyway. Same cost TickTock records.
     */
    coverage: { of: d => d.qType, all: Q_ALL },
    /** This chapter retries IN PLACE over the bench being read and writes its own miss line, so the
     *  shared centred pill would land on the thing it is asking the child to look at. */
    ownsFeedback: true,
    prompt: () => '',
    say: d => d.ask,
    Play: ({ data, onSubmit }) => <RunPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <RunExplain data={data} onDone={onDone} />,
  }
}

type Phase = 'intro' | 'demo' | 'guided' | 'practice'

export default function SupplyRun({ onFinish, onExit }: {
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const { h: vh } = useViewport()
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)
  const short = vh < 470

  const marker = useMemo(() => ({ fill: '#F26B2C', ink: '#3D2516' }), [])
  const {
    hand, onCam, ready, camReady, status, error, start, stop, useTaps, useCamera, videoRef, canvasRef,
  } = useHandInput({ reads: 'sweep', marker })
  /** ⚠️ The rotate gate is an early return, so turning the tablet unmounts the <video> and the
   *  stream becomes unreachable — a camera light left on with the browser still reporting the site
   *  as using it. Stop it BEFORE that happens. */
  useEffect(() => { if (needsRotate) stop() }, [needsRotate, stop])

  const exit = useCallback(() => { stopSpeech(); stop(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit, stop])
  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return; finished.current = true; stopSpeech(); stop()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit, stop])
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 700)), [])
  const beat = useMemo(() => makeBeat(), [])
  /**
   * A fresh site order per run, so the places are not in the same sequence twice.
   * ⚠️ IT HAS TO HAPPEN BEFORE THE DEMO AND GUIDED ROUNDS ARE BUILT, not in a mount effect. Effects
   * run after render, so the memos below would read the OLD order and the scored rounds the new one
   * — which silently breaks the one thing the run order exists to guarantee. Caught on screen in
   * FitOut: the guided round and scored round 1 came up on the same site, back to back.
   */
  useState(() => { reshuffleRun(); return 0 })

  /** The demo and the guided round take the FIRST slots off the same run the scored rounds index
   *  into, so no site is shown twice in a row across the join and none is wasted. */
  const DEMO = useMemo<DvRound[]>(() => {
    const a = makeRound(1, 0, []); const b = makeRound(2, 1, [])
    return [
      { ...a, qType: 'share' as QType, total: 12, groups: 3, per: 4, rem: 0, slotsShown: 3, answer: 4,
        ask: `12 ${a.site.units} in, 3 ${a.site.slots} out. They all get the same.`,
        done: `12 shared between 3 is 4 each.` },
      { ...b, qType: 'group' as QType, total: 14, groups: 4, per: 3, rem: 2, slotsShown: 6, answer: 4,
        ask: `14 ${b.site.units} in, 3 to a ${b.site.slot}. Fill what you can.`,
        done: `14 in 3s is 4 full ${b.site.slots}, and 2 left over.` },
    ]
  }, [])
  const GUIDED = useMemo<DvRound>(() => {
    const g = makeRound(1, 2, [])
    return { ...g, qType: 'share', total: 10, groups: 2, per: 5, rem: 0, slotsShown: 2, answer: 5,
      ask: `10 ${g.site.units} in, 2 ${g.site.slots} out. They all get the same.`,
      done: `10 shared between 2 is 5 each.` }
  }, [])

  // ⚠️ The early return sits BELOW every hook. Above them, turning the phone changes the hook count
  // and React tears the chapter into the error boundary — TickTock shipped that for one session.
  if (needsRotate) return <RotateGate line="The supply run needs a wide bench — turn your tablet sideways." />

  const chip = (
    <button onClick={exit} style={{
      position: 'fixed', top: 10, left: 10, zIndex: 60, background: 'rgba(255,252,244,.92)',
      border: '3px solid var(--outline)', borderRadius: 999, padding: '5px 14px',
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)', cursor: 'pointer',
    }}>‹ Menu</button>
  )
  const banner = (text: string) => (
    <div style={{ position: 'fixed', top: 10, right: 12, zIndex: 46, display: 'flex', justifyContent: 'flex-end', pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(255,252,244,.94)', border: '3px solid var(--milo-orange)', borderRadius: 999,
        padding: '5px 18px', fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: short ? 13 : 16, color: 'var(--ink)',
      }}>{text}</div>
    </div>
  )

  const inSite = phase !== 'intro'

  return (
    <HandProvider value={hand}>
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#3a3630' }}>
      {chip}
      {phase === 'intro' && (
        <>
          <img src={SITES[0].scene} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{
              maxWidth: 520, background: 'rgba(255,252,244,.96)', border: '4px solid var(--outline)',
              borderRadius: 22, textAlign: 'center', boxShadow: '0 8px 0 rgba(61,37,22,.15)',
              /** ⚠️ TIGHTER ON A SHORT FRAME, because this card grew a SECOND BUTTON. Offering both
               *  doors every time is right, and it costs ~33px — which took the shipped copy from
               *  307px to 340px inside a 320px frame, i.e. clipped by 20. Measured live. Sixteen
               *  pixels of vertical padding is the cheapest place to find it and it is invisible;
               *  the copy shortening below is the other half. 309px, 11px of headroom. */
              padding: short ? '14px 26px' : '22px 26px',
            }}>
              <div style={{ fontSize: 34, marginBottom: 6 }}>{SITES.map(s => s.emoji).join(' ')}</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, color: 'var(--ink)', margin: '0 0 10px' }}>The Supply Run</h1>
              {/* ⚠️ ~200 CHARACTERS IS THE CEILING HERE, and it is measured: at 640×320 this card is
                  307px tall inside a 320px frame, so the anchor's first draft at 248 chars pushed it
                  to 330 and clipped both ends. There is no maxHeight and there should not be one —
                  a sibling chapter tried exactly that guard and it moved the clip off the decorative
                  top corner and onto its own Start button, i.e. onto the only forward control. Keep
                  the copy short instead. */}
              {/* ⚠️ THE CAMERA LINE REPLACES COPY, IT DOES NOT APPEND — and that is measured, not
                  cautious. The shipped tap body was EXACTLY 200 characters, i.e. already at the
                  ceiling the comment above records, and appending a sentence the way FitOut does
                  takes it to 242 — past the 248 that was measured clipping BOTH ENDS of this card.
                  FitOut gets away with an append because its card is 291px with 14px of headroom;
                  this one is the tightest in the band.
                  ⚠️ AND THE TAP COPY HAD TO SHRINK TOO, WHICH IS A REGRESSION THIS CHANGE CAUSED
                  RATHER THAN INHERITED. Offering both doors adds a second button worth ~33px, so
                  the shipped 200-character body measured 340px inside a 320px frame — clipped by
                  20. Both bodies are now ~175 and the card is 309px with 11px of headroom, measured
                  live at 640×320 on both paths. */}
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, lineHeight: 1.45, color: 'var(--ink)', margin: '0 0 18px' }}>
                {onCam
                  ? `Milo the quartermaster shares out a crate — like a bag of candy between friends. Sweep your hand across to give everyone one, and again: you stop when you cannot go round.`
                  : `Milo the quartermaster shares out a crate — like a bag of candy between friends. One each, and round again: you stop when you cannot go round. What is left stays in the crate.`}
              </p>
              {/* ⚠️ BOTH DOORS, EVERY TIME — the device's last pick decides which is the BIG button,
                  never which is the only one. */}
              <button onClick={() => { unlockSpeech(); setPhase('demo'); if (onCam) start() }} style={{
                border: 'none', borderRadius: 999, padding: '12px 26px', cursor: 'pointer',
                background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, boxShadow: '0 5px 0 rgba(180,70,20,.45)',
              }}>{onCam ? 'Turn on the camera →' : 'Start the run →'}</button>
              <div>
                <button onClick={() => { unlockSpeech(); if (onCam) useTaps(); else useCamera(); setPhase('demo') }} style={{
                  marginTop: 12, border: 'none', background: 'transparent', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#7a6a55',
                  textDecoration: 'underline',
                }}>{onCam ? 'Use the buttons instead' : 'Use the camera instead'}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {inSite && onCam && (
        <CamView videoRef={videoRef} canvasRef={canvasRef} w={CAM_W(short)} bottom={CAM_BOTTOM(short)}
          skin={SKIN} hidden={!camReady} />
      )}
      {inSite && onCam && !camReady && (
        <CamGate status={status} error={error} skin={SKIN} onRetry={start} onTaps={useTaps} onExit={exit}
          denied="Milo can watch your hand sweep the crate out, or you can tap the button — both deal the same." />
      )}

      {inSite && ready && (<>

      {phase === 'demo' && (<>
        {banner(`Watch Milo · ${demoIdx + 1}/${DEMO.length}`)}
        <RunExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
      </>)}

      {phase === 'guided' && (<>
        {banner('Your turn · deal it out')}
        <RunPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
      </>)}

      {phase === 'practice' && (
        <SkillBeat beat={beat} onInterlude={interlude}
          onComplete={(c, w, mastered) => {
            result.current.correct += c; result.current.wrong += w
            finishChapter(result.current.correct, result.current.wrong, mastered)
          }} />
      )}

      </>)}
    </div>
    </HandProvider>
  )
}
