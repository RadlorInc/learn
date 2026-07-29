'use client'
/**
 * Chapter (6–8) — ADD / SUBTRACT to 100 (`additionTo100` / `subtractionTo100`) → **REGROUP IT**.
 *
 * ══ WHY THIS FILE HAS BEEN REBUILT FOUR TIMES ════════════════════════════════════════
 * ① The ORIGINAL drew base-ten blocks — and printed the numeral beside each row and `27 + 15 = ?`
 *    on a banner, with the answer as one of three chips. **Delete every block and all thirty
 *    questions still work.** ⚠️ **THE FAULT WAS THE QUESTION, NOT THE BLOCKS.** Base-ten blocks are
 *    the right manipulative for regrouping; what made them scenery was a question answerable from
 *    the digits beside them. That distinction is why this pass can bring them back.
 *    The other original fault was real too: the demo narrated "add the tens, then the ones", which
 *    has no step for a carry, while 39–50% of the rounds it generated needed one.
 * ② PASS 1 fixed the question and was a brown slab with things popping into slots — the four things
 *    that make this band's chapters work (something arrives on its own legs · the tap sends someone
 *    somewhere · Milo has a job · the scene changes) were ALL FOUR ABSENT.
 * ③ PASS 2 replaced the blocks with CREATURES and scored 4/4 on that check, and was still rejected:
 *    **aliveness and blend are two different axes.** Five faults — one drawn height for every
 *    creature, no true contact shadow, a rigid 5×2 grid, 28 things in four clusters, and `cart.png`
 *    passing the STYLE check while failing the PALETTE one (sat .676 / val .615 against backdrops at
 *    .33–.42 / .71–.85).
 * ④ PASS 3 fixed all five with pens and a one-size cast.
 *
 * ══ THIS PASS — THE BLOCKS ARE BACK, WITH EVERYTHING PASS 3 LEARNED ══════════════════
 * Founder's call: the block version, animated properly. So the mechanic, the honest question, the
 * palette discipline, the contact shadows, the two-cluster layout and Milo's job all stay; the
 * countable things are base-ten blocks again.
 *
 *   A ONE   a wooden unit cube, TRAVELLING in from off-frame — never popping into existence.
 *   A TEN   a ROD: one thing, drawn with ten visible segments so it is honestly ten without being
 *           ten things you re-count.
 *   ADD     cubes are delivered. At ten, tap → they slide together, become ONE rod, and Milo walks
 *           it up to the row. The waiting ones come in behind it.
 *   SUB     an order goes out and cubes travel off. When they run short, tap a rod — Milo fetches it
 *           and it breaks back into ten cubes that spread onto the ground.
 *
 * ⚠️ **TEN CUBES BECOMING ONE ROD IS THE LESSON.** It is a better picture of unitising than the pens
 * were: the rod still SHOWS its ten segments, so nothing is asserted — but it is one object, and it
 * is never re-counted. Concrete → abstract, in that order.
 *
 * ⚠️ **NO NUMERALS DURING THE QUESTION.** Quantities are only ever cubes and rods; the answer is
 * built on a pad by reading the yard. The equation appears AFTER the commit, as the summary of work
 * already done. Delete the blocks and there is no question at all — which is the original fault
 * failing the other way round.
 *
 * ⚠️ **DIFFICULTY GROWS THE REGROUPING, NOT THE MAGNITUDE.** L1 half the rounds regroup, L2 seven in
 * ten, L3 always.
 *
 * ⚠️ **THE HONEST COST OF GOING BACK TO BLOCKS, STATED RATHER THAN HIDDEN: a block has no legs.**
 * "Something arrives on its own legs" is now carried by MILO alone — he is the only living thing in
 * the yard. The blocks travel, which is correct for an object with no gait (`CARRY_SPEED` exists for
 * exactly this and the engine already handles it), but nothing here walks except him. That was the
 * thing the creatures bought, and it is what this pass trades away.
 *
 * ⚠️ **AND A BLOCK IS THE ONE THING THAT MAY BE A RECTANGLE.** The craft doc's rule — a filled shape
 * over a painted scene reads as UI furniture — is about SURFACES: slabs, panels, bars. A wooden cube
 * is a small object with volume, so it is drawn with a lit top face, a shaded front face and a real
 * contact shadow. Volume is what separates an object from a panel.
 *
 * Art: **zero.** Every block is code-drawn, inside the backdrops' own palette band by construction,
 * so no generated prop can drift out of it the way `cart.png` did.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { numberToWords } from '../lessons/_kit'
import { applyOp, type Op } from '../lessons/ArithmeticLesson'
import { RotateGate, useNeedsRotate } from './RotateGate'
import { useViewport } from '@/shared/hooks/useViewport'
import { Arrive, SheetCell, inFlowJourney, CRITTER_CSS, aspectOf, seeded } from './critters'

// ─── The run ──────────────────────────────────────────────────────────────────────────
// One flat list covering demo (2) → guided (1) → 10 scored rounds, indexed STRAIGHT and never
// modulo, so a setting can never wrap back onto the one the chapter opened with.
//
// ⚠️ THE SCENES ARE MEASURED, NOT PICKED BY EYE. Pass 2 opened subtraction on `farm_pond.png`, and
// the yard spans x 4–97% — so the blocks, Milo and the whole rod row stood on OPEN WATER: measured,
// only 27–35% of the band the yard occupies is walkable there. Every scene below clears 92% at
// 0.66 · 0.70 · 0.74 of the height across x 4–97%, which the gate asserts. That leaves NINE honest
// scenes for thirteen slots, so a scene recurs late in the run — the requirement is that consecutive
// rounds differ, not that all thirteen are unique.
interface Slot { scene: string; mat: number }
const BG = (n: string) => `/assets/backgrounds/${n}`
const MILO = '/assets/characters/milo_side.png'

// A DIFFERENT SET OF BLOCKS EVERY ROUND — clay · slate · teal · plum · rose · indigo. Round 10 must
// not look like round 1, and until now only the backdrop changed. See MATERIALS for why the hue is
// the thing that varies and the saturation/brightness are the things that may not.
const [CLAY, SLATE, TEAL, PLUM, ROSE, INDIGO] = [0, 1, 2, 3, 4, 5]
const ADD_RUN: Slot[] = [
  { scene: 'farm_barnyard.png', mat: CLAY }, { scene: 'garden_meadow.png', mat: SLATE },
  { scene: 'farm_orchard.png', mat: PLUM }, { scene: 'garden.png', mat: TEAL },
  { scene: 'town_garden.jpeg', mat: ROSE }, { scene: 'garden_fence.png', mat: INDIGO },
  { scene: 'garden_park.png', mat: CLAY }, { scene: 'town_park.jpeg', mat: TEAL },
  { scene: 'town_street.jpeg', mat: SLATE }, { scene: 'farm_orchard.png', mat: ROSE },
  { scene: 'garden_meadow.png', mat: INDIGO }, { scene: 'town_garden.jpeg', mat: PLUM },
  { scene: 'garden_park.png', mat: CLAY },
]
const SUB_RUN: Slot[] = [
  { scene: 'garden_meadow.png', mat: TEAL }, { scene: 'farm_barnyard.png', mat: PLUM },
  { scene: 'town_park.jpeg', mat: CLAY }, { scene: 'garden.png', mat: INDIGO },
  { scene: 'farm_orchard.png', mat: ROSE }, { scene: 'garden_park.png', mat: SLATE },
  { scene: 'garden_fence.png', mat: CLAY }, { scene: 'town_street.jpeg', mat: INDIGO },
  { scene: 'town_garden.jpeg', mat: TEAL }, { scene: 'garden_meadow.png', mat: PLUM },
  { scene: 'farm_barnyard.png', mat: ROSE }, { scene: 'town_park.jpeg', mat: SLATE },
  { scene: 'garden_fence.png', mat: TEAL },
]
const runFor = (op: Op) => (op === '+' ? ADD_RUN : SUB_RUN)
/** The single accessor every scored round goes through. A gate that reads the RUN array cannot see
 *  how the chapter INDEXES it — drive the gate through this, never through the array. */
export const slotAt = (op: Op, i: number): Slot => {
  const run = runFor(op)
  return run[Math.min(i, run.length - 1)]
}
export const DEMO_SLOTS = 2
export const GUIDED_SLOT = DEMO_SLOTS
export const scoredSlot = (op: Op, round: number) => slotAt(op, GUIDED_SLOT + 1 + round)

// ─── The question ─────────────────────────────────────────────────────────────────────
export interface ASRound { slot: number; a: number; b: number; answer: number; regroup: boolean }
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))

/** Does this pair need a ten made or broken? THE thing the chapter teaches, so it is named. */
export const needsRegroup = (op: Op, a: number, b: number) =>
  op === '+' ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10

/** How often a tier regroups. The old generator left this to chance (39–50% at every tier) and
 *  never taught it; here it IS the difficulty. */
const REGROUP_ODDS: Record<Op, [number, number, number]> = { '+': [0.5, 0.7, 1], '-': [0.5, 0.7, 1] }

/** Tens and ones drawn separately so a regroup can be forced or forbidden by construction, and the
 *  answer kept in 10..99 (a leading-zero answer has no tens digit to read off the yard). */
function draw(op: Op, d: 1 | 2 | 3, want: boolean): { a: number; b: number } | null {
  if (op === '+') {
    const aO = want ? rint(1, 9) : rint(0, 9)
    const bO = want ? rint(10 - aO, 9) : rint(0, 9 - aO)
    const [aTlo, aThi] = d === 1 ? [1, 2] : d === 2 ? [2, 4] : [3, 6]
    const aT = rint(aTlo, aThi)
    const bTmax = Math.min(d === 1 ? 0 : d === 2 ? 3 : 5, 8 - aT - (want ? 1 : 0))
    if (bTmax < (d === 1 ? 0 : 1)) return null
    const bT = rint(d === 1 ? 0 : 1, bTmax)
    return { a: aT * 10 + aO, b: bT * 10 + bO }
  }
  const aO = want ? rint(0, 8) : rint(0, 9)
  const bO = want ? rint(aO + 1, 9) : rint(0, aO)
  const [aTlo, aThi] = d === 1 ? [1, 2] : d === 2 ? [3, 5] : [5, 9]
  const aT = rint(aTlo, aThi)
  const bTmax = aT - 1 - (want ? 1 : 0)          // answer ≥ 10 ⟹ one ten must survive the borrow
  if (bTmax < (d === 1 ? 0 : 1)) return null
  const bT = rint(d === 1 ? 0 : 1, bTmax)
  return { a: aT * 10 + aO, b: bT * 10 + bO }
}

export function makeRound(op: Op, d: 1 | 2 | 3, round = 0): ASRound {
  const want = Math.random() < REGROUP_ODDS[op][d - 1]
  let a = 0, b = 0
  for (let i = 0; i < 200; i++) {
    const c = draw(op, d, want)
    // `b >= 1`: at L1 both tens and ones can legitimately draw 0, and "add nothing" is not a
    // question. Caught by the gate on its first run, not by eye.
    if (c && c.b >= 1 && needsRegroup(op, c.a, c.b) === want) { a = c.a; b = c.b; break }
  }
  if (!a) { a = op === '+' ? 27 : 52; b = op === '+' ? 15 : 17 }   // unreachable; never a crash
  return { slot: GUIDED_SLOT + 1 + round, a, b, answer: applyOp(op, a, b), regroup: needsRegroup(op, a, b) }
}

/** The beats the yard walks through. Exported so the gate drives the same machine the scene does. */
export function loadPlan(op: Op, a: number, b: number) {
  const aT = Math.floor(a / 10), aO = a % 10, bT = Math.floor(b / 10), bO = b % 10
  if (op === '+') {
    const fits = Math.min(10 - aO, bO)
    return { start: { carts: aT, onPlatform: aO, queued: 0 }, addCarts: bT, fits, spill: bO - fits, regroup: aO + bO >= 10 }
  }
  return { start: { carts: aT, onPlatform: aO, queued: 0 }, takeCarts: bT, takeOnes: bO, short: Math.max(0, bO - aO), regroup: aO < bO }
}

// ─── The yard's geometry ──────────────────────────────────────────────────────────────
/**
 * TWO CLUSTERS AND MILO BETWEEN THEM: the loose cubes (with any waiting behind them) on the left,
 * the standing rods on the right. Pass 2 had four and read as clutter.
 *
 * ⚠️ **EVERY PIECE OF THE YARD IS `position: fixed`, NOT `absolute`, AND THIS IS LOAD-BEARING.**
 * The layout is shares of the VIEWPORT — the ground line is `top: 74%` of the screen — so an
 * `absolute` element resolves against the nearest positioned ancestor instead, and in the scored
 * rounds that ancestor is `SkillBeat`'s own `position: relative` wrapper, which is content-sized.
 * Measured at 1280×720: the whole yard, Milo, the rod row and the answer pad rendered squashed into
 * a strip across the top of the frame. **Pass 2 shipped this and nobody saw it**, because the demo
 * and the guided round render OUTSIDE `SkillBeat` and look perfectly correct — the fault only
 * appears once the first scored round loads. `Critter` is `fixed` for exactly this reason.
 */
export const PAD_BAND = (vh: number) => Math.round(Math.max(92, Math.min(vh * 0.21, 150)))
export const GROUND = 0.74          // the yard floor, as a share of the height — on a ROOMY frame
/**
 * ⚠️ On a short frame the ground must come UP to clear the answer pad. At 640×320 a flat 0.74 put
 * the feet at 237px and the pad's top at 230 — the yard standing in the digit strip. The pad's band
 * is fixed (its buttons are tap targets and may not shrink), so the GROUND yields to it.
 */
export const groundOf = (vh: number) => Math.min(GROUND, (vh - PAD_BAND(vh) - 14) / vh)

/** THE LOOSE ONES — a run of cubes on the ground, left of Milo. */
export const ONES_X0 = 24, ONES_COL = 3.2
/**
 * ⚠️ A ROW OF IDENTICAL CUBES IS FINE, AND THAT IS NOT A CONTRADICTION OF THE STICKER RULE.
 * The craft doc's "evenly spaced, one baseline, one size = a row of identical stickers" is about
 * LIVING things — ten animals standing to attention is what reads as wrong. Ten identical wooden
 * cubes in a neat run is exactly what a stack of manufactured blocks looks like, so they get only a
 * hand-stacked wobble (a fraction of a degree of tilt and a hair of height) rather than the depth
 * huddle the creatures needed.
 */
export const spotOf = (i: number) => ({
  x: ONES_X0 + i * ONES_COL,
  tilt: (seeded(i, 8.233) - 0.5) * 3.4,          // degrees — stacked by hand, not by a machine
  lift: seeded(i, 12.9898) * 0.6,                // and never downward: the ground line is a floor
})
/**
 * Those that could not be placed yet, waiting behind the run. ⚠️ It must FIT: the spill runs to 8
 * (a%10 + b%10 ≤ 18), and pass 1's single line put the fourth at x = −3.6% and the eighth at −29%.
 */
export const QUEUE_X = 17, QUEUE_GAP = 3.2, QUEUE_PER_ROW = 4
/**
 * ⚠️ THE WAITING PILE MUST READ AS SOMEWHERE ELSE, NOT AS MORE OF THE ROW. Measured on screen at
 * 640×320 with 10 placed and 4 waiting: laid out at the same size on the same baseline they read as
 * ONE row of fourteen, and the whole argument for regrouping — *ten fit, the eleventh does not* —
 * disappears with it. So the pile stands further BACK: lifted, smaller, and less tidily stacked.
 * Depth is the cue, exactly as it is for a group in a painted scene.
 */
export const QUEUE_SCALE = 0.8
export const queueOf = (j: number) => {
  const col = j % QUEUE_PER_ROW, row = Math.floor(j / QUEUE_PER_ROW)
  return {
    x: QUEUE_X - col * QUEUE_GAP + row * 1.5,
    tilt: (seeded(j, 5.71) - 0.5) * 7,           // a heap, not a stack — it has not been placed yet
    lift: 3.4 + row * 3.4 + seeded(j, 2.13) * 0.8,
    scale: QUEUE_SCALE,
    row,
  }
}

/** THE ROD ROW — the tens, standing on the same ground line. Nine is the most an answer under 100
 *  can need, and one row holds them because a rod is narrow. */
export const MILO_X = 60
export const RODS_X0 = 68, RODS_COL = 3.3
export const rodSpot = (i: number) => ({ x: RODS_X0 + i * RODS_COL })
/**
 * ⚠️ **A ROD IS EXACTLY TEN CUBES TALL, AND THAT IS NOT NEGOTIABLE.**
 *
 * The first attempt drew it at 0.55 of unit scale, so it would clear the prompt on a short frame —
 * which means it stood five and a half cubes high beside the cubes it is made of. **A child can lay
 * a rod against the ones and read the wrong number off it.** That is a lie inside the manipulative,
 * which is worse than any look problem: the whole reason to use base-ten blocks is that the
 * relationship is there to be measured rather than asserted.
 *
 * So the ROD is fixed at ten units and the UNIT is derived from the room available — see `yardUnit`.
 */
export const ROD_SEGMENTS = 10
/**
 * The vertical room a standing rod has, in px. ⚠️ On a short frame the prompt banner is what eats
 * it, and the craft doc's rule is to buy height from the CHROME, never from the prose — so instead
 * of shrinking the banner, it moves aside: below a short height it sits over the LEFT of the yard,
 * where the ones are (which are one cube tall), and the rod column has the full drop from the
 * chapter chrome. Measured at 640×320: 110px of budget under a centred banner against 162 beside it,
 * which is the difference between a 10px unit and a 15px one.
 */
const CHROME_PX = 46
export const rodBudget = (vh: number) => groundOf(vh) * vh - (vh < 470 ? CHROME_PX : 84) - 8
export const ENTER_X = -12          // off-frame left, where every delivery starts

/**
 * ⚠️ THE PALETTE IS MEASURED, NOT EYEBALLED, AND IT IS A SEPARATE CHECK FROM THE STYLE.
 * `cart.png` was checked for brushwork and ink outlines, passed, and was the most saturated and the
 * darkest thing on a pale pastel farm (sat .676 / val .615). The backdrops in this run sit at
 * sat .33–.42 / val .71–.85, so every block is drawn in code inside that band — on every scene,
 * with nothing that can drift.
 */
/**
 * ⚠️ **THE HUE IS A SEPARATE DECISION FROM THE BAND, AND IT IS THE ONE THAT MAY VARY.**
 * The first pass drew the blocks in the same warm sand as the scenery and they read as HAY BALES AND
 * FENCE POSTS — measured right on the palette and completely lost in a farmyard. **A manipulative is
 * a tool, not scenery: it is meant to stand out.** The rule it must obey is the saturation/
 * brightness band — that is what `cart.png` broke, at .676/.615 against backdrops at .33–.42/.71–.85.
 * The HUE is free.
 *
 * Which is what makes a different set of blocks per round POSSIBLE rather than risky: every material
 * shares one saturation and one brightness, so all six sit in the painted sprites' own band by
 * construction, and only the hue moves. **Measured, the backdrops in this run are 68–95° (yellow-
 * green) except `town_street` at 32°** — so the gate asserts every material is at least 45° of hue
 * away from the scene it is paired with, which makes the hay-bale fault impossible to reintroduce.
 */
export const MAT_SAT = 0.46, MAT_VAL = 0.80
export interface Material { name: string; hue: number; grain: boolean }
export const MATERIALS: Material[] = [
  { name: 'clay', hue: 14, grain: false },
  { name: 'slate', hue: 214, grain: true },
  { name: 'teal', hue: 178, grain: false },
  { name: 'plum', hue: 292, grain: true },
  { name: 'rose', hue: 352, grain: false },
  { name: 'indigo', hue: 250, grain: true },
]
/** Standard HSV→RGB. The shades are DERIVED rather than typed out, so eighteen hand-written hex
 *  values cannot drift out of the band one at a time. */
function hsv(h: number, s: number, v: number): string {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60) % 6]
  return `rgb(${Math.round((r + m) * 255)},${Math.round((g + m) * 255)},${Math.round((b + m) * 255)})`
}
export const shadesOf = (m: Material) => ({
  top: hsv(m.hue, MAT_SAT - 0.1, MAT_VAL + 0.09),        // the lit face — highlights desaturate
  face: hsv(m.hue, MAT_SAT, MAT_VAL),
  deep: hsv(m.hue, MAT_SAT + 0.08, MAT_VAL - 0.13),
  seam: hsv(m.hue, MAT_SAT + 0.3, MAT_VAL - 0.42),
  rim: 'rgba(255,250,244,.5)',
  grain: m.grain,
})
export const matOf = (slot: Slot) => shadesOf(MATERIALS[slot.mat % MATERIALS.length])
type Shades = ReturnType<typeof shadesOf>
/** Soft, cool and close. A hard drop-shadow is the loudest "pasted on" tell there is. */
const SHADOW = 'radial-gradient(ellipse at center, rgba(46,38,24,.32) 0%, rgba(46,38,24,.13) 56%, rgba(46,38,24,0) 78%)'

/**
 * The unit cube's side — and every other size in the yard falls out of it, because a base-ten set
 * only means anything if all of it is drawn to ONE unit.
 *
 * Three terms bind it, and the third is the one that matters: the width of the column it stands in
 * (a cube wider than its column buries its neighbour, and a run the child cannot count is a wrong
 * answer the chapter caused), a share of the height, and **the room a TEN-cube rod needs to stand
 * up in**. The last is why the unit shrinks on a short frame rather than the rod lying about its
 * length.
 */
export function yardUnit(vw: number, vh: number) {
  const cube = Math.max(12, Math.min(40, Math.floor(Math.min(
    vh * 0.055,
    vw * 0.026,
    rodBudget(vh) / (ROD_SEGMENTS + 0.24),      // + the rod's own lit top face
  ))))
  return {
    cube,
    rodW: Math.round(cube * 0.92),
    rodH: cube * ROD_SEGMENTS,                  // exactly ten. See ROD_SEGMENTS.
    // Measured against a standing rod on screen: at 3.4 units he was a third of its height and read
    // as a toy beside it. He has to look like someone who could pick one up.
    miloH: Math.round(cube * 4.6),
  }
}

// ─── Pieces ───────────────────────────────────────────────────────────────────────────
/**
 * A REAL elliptical contact shadow. ⚠️ Pass 2 had not one — only the generic `drop-shadow` filter
 * `SheetCell` carries, which is a lighting cue and not a contact cue, so nothing on screen touched
 * the ground. It renders INSIDE whatever is travelling; outside, it lags, which is a bug this repo
 * has already shipped once.
 */
function Shadow({ w, h }: { w: number; h: number }) {
  return <span aria-hidden style={{
    position: 'absolute', left: '50%', bottom: -Math.round(h * 0.35), transform: 'translateX(-50%)',
    width: w, height: h, borderRadius: '50%', background: SHADOW, pointerEvents: 'none', zIndex: 0,
  }} />
}

/**
 * The surface mark some materials carry. ⚠️ **IT IS VERTICAL, AND THAT IS NOT A STYLE CHOICE.**
 * A rod's ten units are marked by HORIZONTAL seams, so any decorative horizontal line on a block is
 * an eleventh unit as far as a child counting it is concerned. Grain runs the other way, where it
 * cannot be mistaken for a division.
 */
function Grain({ w, h, colour }: { w: number; h: number; colour: string }) {
  return <>{[0.34, 0.66].map(f => (
    <span key={f} aria-hidden style={{ position: 'absolute', left: `${f * 100}%`, top: '18%', bottom: '14%',
      width: Math.max(1, Math.round(w * 0.045)), background: colour, opacity: 0.35, borderRadius: 99 }} />
  ))}</>
}

/** ONE. A cube with a lit top face, a shaded front and its own contact shadow — VOLUME is what
 *  stops a rectangle reading as a UI panel. */
function Cube({ s, m }: { s: number; m: Shades }) {
  const top = Math.round(s * 0.24)
  return (
    <span style={{ display: 'block', position: 'relative', width: s, height: s + top }}>
      <Shadow w={Math.round(s * 1.1)} h={Math.round(s * 0.34)} />
      <span style={{ position: 'relative', zIndex: 1, display: 'block', width: s, height: s + top }}>
        <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top + 1,
          background: m.top, borderRadius: `${s * 0.2}px ${s * 0.2}px 0 0`,
          boxShadow: `inset 0 1px 0 ${m.rim}` }} />
        <span style={{ position: 'absolute', left: 0, right: 0, top, bottom: 0, overflow: 'hidden',
          background: `linear-gradient(180deg, ${m.face} 0%, ${m.deep} 100%)`,
          borderRadius: `0 0 ${s * 0.18}px ${s * 0.18}px`,
          boxShadow: `inset -${Math.max(1, s * 0.07)}px 0 0 rgba(60,44,28,.16)` }}>
          {m.grain && <Grain w={s} h={s} colour={m.seam} />}
        </span>
      </span>
    </span>
  )
}

/**
 * TEN. One rod, standing — and it still shows its ten segments, so nothing is asserted.
 *
 * ⚠️ Pass 2 drew five creature heads above each bundle's rim so it "still read as a load". That is
 * the opposite of the lesson: a bundled ten is ONE thing, and separable bodies inside it invite
 * exactly the recount that unitising is the absence of. Segments are not bodies — they are the
 * marks on one object, which is the whole difference between a rod and ten cubes.
 */
function Rod({ w, h, m, delayMs = 0, nudge }: { w: number; h: number; m: Shades; delayMs?: number; nudge?: boolean }) {
  const top = Math.round(w * 0.24)
  return (
    // One transform per wrapper: the nudge and the settle are separate elements. Stack two on one
    // and the later silently wins — the bug that cost this codebase a day across three chapters.
    <span style={{ display: 'block', animation: nudge ? 'by_nudge 1.5s ease-in-out infinite' : undefined }}>
      <span style={{ display: 'block', position: 'relative', width: w, height: h + top,
        animation: `by_settle .45s ease ${delayMs}ms both` }}>
        <Shadow w={Math.round(w * 1.9)} h={Math.round(w * 0.6)} />
        <span style={{ position: 'relative', zIndex: 1, display: 'block', width: w, height: h + top }}>
          <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top + 1,
            background: m.top, borderRadius: `${w * 0.2}px ${w * 0.2}px 0 0`,
            boxShadow: `inset 0 1px 0 ${m.rim}` }} />
          <span style={{ position: 'absolute', left: 0, right: 0, top, bottom: 0, overflow: 'hidden',
            background: `linear-gradient(90deg, ${m.face} 0%, ${m.deep} 100%)`,
            borderRadius: `0 0 ${w * 0.18}px ${w * 0.18}px` }}>
            {Array.from({ length: ROD_SEGMENTS }).map((_, i) => (
              <span key={i} data-seg style={{ position: 'absolute', left: 0, right: 0,
                top: `${(i / ROD_SEGMENTS) * 100}%`, height: `${100 / ROD_SEGMENTS}%`,
                borderTop: i ? `1px solid ${m.seam}` : 'none' }} />
            ))}
          </span>
        </span>
      </span>
    </span>
  )
}

/** A cube standing at (or travelling to) a place on the ground, anchored by its base. */
function Travelling({ s, m, x, lift, tilt, ground, dist, ms, delayMs, resetKey, z, leave, fusing }: {
  s: number; m: Shades; x: number; lift: number; tilt: number; ground: number
  dist: number; ms: number; delayMs: number; resetKey: string; z: number
  leave?: boolean; fusing?: boolean
}) {
  return (
    <div style={{ position: 'fixed', left: `${x}%`, top: `${ground * 100 - lift}%`,
      transform: 'translate(-50%, -100%)', zIndex: z, pointerEvents: 'none' }}>
      <Arrive dist={dist} ms={ms} delayMs={delayMs} leave={leave} resetKey={resetKey}>
        {() => (
          // the hand-stacked wobble is its own element, so it can never fight the travel transform
          <span style={{ display: 'block', transform: `rotate(${tilt}deg)`, transformOrigin: '50% 100%',
            animation: fusing ? 'by_shut .4s ease forwards' : undefined }}>
            <Cube s={s} m={m} />
          </span>
        )}
      </Arrive>
    </div>
  )
}

// ─── The scene ────────────────────────────────────────────────────────────────────────
type Step = 'settle' | 'incoming' | 'stuck' | 'bundling' | 'answer'
/** Where the loose cubes are travelling IN from — the lane, the pile that was waiting, or a rod
 *  Milo has just carried back and broken open. */
type From = 'lane' | 'queue' | 'rods'
interface Yard {
  rods: number             // the tens
  ones: number             // loose cubes on the ground
  wave: number             // how many of `ones` were already here when the round opened
  waiting: number          // could not be placed yet; this is the ARGUMENT for regrouping
  leaving: number          // sent out, travelling off-frame
  from: From
  step: Step
  carry: 0 | 1 | 2         // Milo: idle · walking up the yard · walking back
  carried: boolean         // is a rod in his hands
  fusing: boolean          // the ten are sliding together into one
  key: string              // changes when a fresh delivery must travel in
}
const initYard = (p: ReturnType<typeof loadPlan>): Yard => ({
  rods: p.start.carts, ones: p.start.onPlatform, wave: p.start.onPlatform, waiting: 0, leaving: 0,
  from: 'lane', step: 'settle', carry: 0, carried: false, fusing: false, key: 'a',
})

const YARD_CSS = `
@keyframes by_nudge { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes by_settle { 0%{opacity:0;transform:translateY(-7px) scale(.9)} 60%{opacity:1} 100%{opacity:1;transform:none} }
@keyframes by_shut { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(.8)} }
@keyframes by_pop { 0%{transform:scale(.3);opacity:0} 70%{transform:scale(1.06);opacity:1} 100%{transform:scale(1);opacity:1} }
`

function Scene({ y, m, ch, rodW, rodH, miloH, vw, vh, onRun, onRod, hint }: {
  y: Yard; m: Shades; ch: number; rodW: number; rodH: number; miloH: number; vw: number; vh: number
  onRun?: () => void; onRod?: () => void; hint?: boolean
}) {
  const ground = groundOf(vh)
  const miloW = Math.round(miloH * aspectOf(MILO))
  const carryDist = ((RODS_X0 + 1 - MILO_X) / 100) * vw
  const carryJ = inFlowJourney(MILO, miloH, carryDist)
  // A block has no gait, so `inFlowJourney` falls back to CARRY_SPEED — travel and cycle are
  // separate concerns, and an object simply has no legs to run while it moves.
  const leg = (fromX: number, toX: number) => {
    const dist = ((fromX - toX) / 100) * vw
    return { dist, ms: inFlowJourney('', ch, dist).ms }
  }
  const fromXFor = (i: number) => (y.from === 'lane' ? ENTER_X : y.from === 'rods' ? RODS_X0 : queueOf(i).x)
  // While they fuse, the run closes up into a touching line — you watch ten become one length.
  const cubePct = (ch / Math.max(1, vw)) * 100
  const runX = (i: number) => (y.fusing ? ONES_X0 + i * cubePct : spotOf(i).x)

  return (
    <>
      {/* THE ROD ROW — the tens, and the only thing that persists across the whole round. */}
      {Array.from({ length: y.rods }).map((_, i) => {
        const s = rodSpot(i)
        const tappable = !!onRod
        return (
          <button key={`rod${i}`} onClick={tappable ? onRod : undefined} disabled={!tappable}
            aria-label="a rod of ten" style={{
              position: 'fixed', left: `${s.x}%`, top: `${ground * 100}%`,
              transform: 'translate(-50%,-100%)', zIndex: 12,
              border: 'none', background: 'none', padding: 0, cursor: tappable ? 'pointer' : 'default',
            }}>
            <Rod w={rodW} h={rodH} m={m} delayMs={i * 80} nudge={hint && tappable && i === y.rods - 1} />
          </button>
        )
      })}

      {/* the loose ones on the ground */}
      {Array.from({ length: y.ones }).map((_, i) => {
        const s = spotOf(i)
        const j = leg(fromXFor(i), s.x)
        return <Travelling key={`c${i}-${y.key}`} s={ch} m={m} x={runX(i)} lift={s.lift} tilt={y.fusing ? 0 : s.tilt}
          ground={ground} dist={j.dist} ms={y.step === 'settle' ? 0 : j.ms}
          delayMs={i * 110 + (i >= y.wave ? 380 : 0)} resetKey={`${y.key}-${i}`}
          z={20 + i} fusing={y.fusing} />
      })}

      {/* those that could not be placed — visibly waiting, which is the whole argument */}
      {Array.from({ length: y.waiting }).map((_, i) => {
        const s = queueOf(i)
        const j = leg(ENTER_X, s.x)
        return <Travelling key={`w${i}-${y.key}`} s={Math.round(ch * s.scale)} m={m} x={s.x} lift={s.lift} tilt={s.tilt}
          ground={ground} dist={j.dist} ms={y.step === 'settle' ? 0 : j.ms}
          delayMs={i * 110} resetKey={`${y.key}-w${i}`} z={16 - i} />
      })}

      {/* the order going out — a departure is a journey too, and it leaves the way it came in */}
      {Array.from({ length: y.leaving }).map((_, i) => {
        const s = spotOf(y.ones + i)
        const j = leg(s.x, ENTER_X)
        return <Travelling key={`x${i}-${y.key}`} s={ch} m={m} x={s.x} lift={s.lift} tilt={s.tilt}
          ground={ground} leave dist={j.dist} ms={j.ms} delayMs={i * 130}
          resetKey={`${y.key}-x${i}`} z={19 - i} />
      })}

      {/* MILO — he has a real job: he walks a finished rod up the yard, and fetches one back. The
          rod rides INSIDE his travelling element, because two things that must move as one have to
          BE one element — a sibling is one duration change away from sliding out ahead of his feet. */}
      <div style={{ position: 'fixed', left: `${MILO_X}%`, top: `${ground * 100}%`,
        transform: 'translate(-50%,-100%)', zIndex: 30, pointerEvents: 'none' }}>
        <span style={{ display: 'block', position: 'relative',
          transform: `translateX(${y.carry === 1 ? Math.round(carryDist) : 0}px)`,
          transition: y.carry ? `transform ${carryJ.ms}ms linear` : 'none' }}>
          {y.carried && (
            <span style={{ position: 'absolute', left: -Math.round(rodW * 2), bottom: 0, zIndex: 2 }}>
              <Rod w={rodW} h={rodH} m={m} />
            </span>
          )}
          <span style={{ display: 'block', position: 'relative', width: miloW, height: miloH }}>
            <Shadow w={Math.round(miloW * 0.66)} h={Math.round(miloH * 0.1)} />
            <span style={{ position: 'relative', zIndex: 1, display: 'block' }}>
              <SheetCell src={MILO} h={miloH} moving={y.carry !== 0} facesLeft={y.carry !== 1}
                breathe cycleScale={carryJ.cycleScale} />
            </span>
          </span>
        </span>
      </div>

      {/* the full run of ten is the tap target */}
      {onRun && (
        <button onClick={onRun} aria-label="trade ten ones for one rod" style={{
          position: 'fixed', left: `${ONES_X0 - 2.4}%`, width: `${9 * ONES_COL + 5}%`,
          top: `${ground * 100 + 2}%`, transform: 'translateY(-100%)',
          height: Math.round(ch * 1.9), zIndex: 34,
          border: 'none', background: 'none', cursor: 'pointer',
          animation: 'by_nudge 1.5s ease-in-out infinite',
        }} />
      )}
    </>
  )
}

// ─── Answer pad ───────────────────────────────────────────────────────────────────────
function AnswerPad({ digits, onDigit, onClear, onDone, band, live }: {
  digits: number[]; onDigit: (n: number) => void; onClear: () => void; onDone: () => void
  band: number; live: boolean
}) {
  /** Sized off ITS OWN band, never off the block unit: deriving it from the scene gave 28×28
   *  buttons on a short frame while the pad's own band had room. The thing that is TAPPED wins. */
  const w = Math.max(26, Math.min(54, Math.floor((band - 6) / 2.27)))
  const win = (i: number) => (
    <span key={i} style={{
      width: w * 1.05, height: w * 1.15, borderRadius: w * 0.2, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--paper)', border: `3px solid ${digits.length > i ? 'var(--milo-orange)' : 'var(--outline)'}`,
      fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: w * 0.78, color: 'var(--ink)',
    }}>{digits[i] ?? ''}</span>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: w * 0.12,
      pointerEvents: live ? 'auto' : 'none', opacity: live ? 1 : .3, transition: 'opacity .3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: w * 0.24 }}>
        {win(0)}{win(1)}
        <button onClick={onClear} style={{ marginLeft: w * 0.1, height: w * 0.9, padding: `0 ${w * 0.4}px`, borderRadius: w * 0.45, border: '3px solid var(--outline)', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: w * 0.4, cursor: 'pointer' }}>⌫</button>
        {/* Identical at every state — nothing may say the answer is right before the commit. */}
        <button onClick={onDone} disabled={digits.length < 2} style={{
          height: w * 1.1, padding: `0 ${w * 0.62}px`, borderRadius: w * 0.55, border: 'none',
          background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: w * 0.46,
          opacity: digits.length < 2 ? .4 : 1, cursor: digits.length < 2 ? 'default' : 'pointer',
          boxShadow: '0 4px 0 rgba(180,70,20,.45)',
        }}>Done ✓</button>
      </div>
      <div style={{ display: 'flex', gap: w * 0.14 }}>
        {Array.from({ length: 10 }).map((_, n) => (
          <button key={n} onClick={() => onDigit(n)} style={{
            width: w, height: w, borderRadius: w * 0.22, border: '3px solid var(--outline)',
            background: 'var(--paper)', fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: w * 0.5, color: 'var(--ink)', cursor: 'pointer',
          }}>{n}</button>
        ))}
      </div>
    </div>
  )
}

// ─── The round ────────────────────────────────────────────────────────────────────────
type Mode = 'demo' | 'guided' | 'practice'
/** ⚠️ On a short frame a share of the height puts the banner ON the chapter chrome: measured at
 *  640×320 it ran under the "← Menu" button and through the tally pill. The chrome sits at a FIXED
 *  12px and is ~28 tall, so below a short height the banner clears it by a fixed amount rather than
 *  by a percentage — the same reason the ground line stops being a percentage there. */
export const BANNER_TOP = (vh: number) => (vh < 470 ? 46 : Math.round(vh * 0.035))
/**
 * ⚠️ On a short frame the banner MOVES ASIDE rather than shrinking. Two things were in its way and
 * one of them may not give: measured at 640×320 a centred banner ran under the "← Menu" button and
 * through the tally pill, AND it capped the standing rods at ten 10px units. The craft doc's rule is
 * to buy height from the CHROME, never from the prose — so the prose keeps its size and sits over
 * the LEFT of the yard, where the ones are and they are one cube tall. That leaves the rod column
 * the full drop from the chapter chrome, which is a 15px unit instead of a 10px one.
 */
export const BANNER_SHORT = { left: 96, width: 'min(46vw, 660px)' }
/** The banner's bottom edge in px, measured on screen — exported so the gate can assert nothing
 *  standing in the yard reaches up into it. */
export const bannerBottom = (vh: number) => BANNER_TOP(vh) + (vh < 470 ? 78 : 62)

function Banner({ text, vh, ok }: { text: string; vh: number; ok?: boolean }) {
  const short = vh < 470
  return (
    <div style={{ position: 'fixed', top: BANNER_TOP(vh), left: 0, right: 0, zIndex: 40, display: 'flex',
      justifyContent: short ? 'flex-start' : 'center',
      paddingLeft: short ? BANNER_SHORT.left : 12, paddingRight: 12, pointerEvents: 'none' }}>
      <div style={{
        maxWidth: short ? BANNER_SHORT.width : 'min(88vw, 660px)', background: 'rgba(255,252,244,.94)',
        border: `3px solid ${ok ? 'var(--garden-green)' : 'var(--milo-orange)'}`, borderRadius: 16, padding: '7px 18px',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: `clamp(13px, ${Math.round(vh * 0.032)}px, 20px)`,
        color: ok ? 'var(--garden-green-deep)' : 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(242,107,44,.22)',
      }}>{text}</div>
    </div>
  )
}

const ASRoundView: React.FC<{ slot: Slot; op: Op; data: ASRound; mode: Mode; onComplete: (c: boolean) => void }> =
({ slot, op, data, mode, onComplete }) => {
  const { a, b, answer } = data
  const { w: vw, h: vh } = useViewport()
  const { cube, rodW, rodH, miloH } = yardUnit(vw, vh)
  const plan = useMemo(() => loadPlan(op, a, b), [op, a, b])
  const m = useMemo(() => matOf(slot), [slot])

  const [y, setY] = useState<Yard>(() => initYard(plan))
  const [digits, setDigits] = useState<number[]>([])
  const [note, setNote] = useState('')
  const [ok, setOk] = useState(false)
  const erred = useRef(false), done = useRef(false)
  const timers = useRef<number[]>([])
  const after = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])
  const say = useCallback((s: string) => { setNote(s); speak(s) }, [])

  // How long a delivery takes to travel in, and how long Milo takes to walk the yard, so the
  // question opens when things have actually ARRIVED rather than after a guessed delay.
  const inMs = useMemo(() => inFlowJourney('', cube, ((spotOf(9).x - ENTER_X) / 100) * vw).ms + 9 * 110 + 380, [cube, vw])
  const carryMs = useMemo(() => inFlowJourney(MILO, miloH, ((RODS_X0 + 1 - MILO_X) / 100) * vw).ms, [miloH, vw])

  useEffect(() => {
    setY(initYard(plan))
    setDigits([]); setNote(''); setOk(false)
    after(500, () => {
      if (op === '+') {
        const p = plan as ReturnType<typeof loadPlan> & { addCarts: number; fits: number; spill: number }
        setY(s => ({ ...s, step: 'incoming', rods: s.rods + p.addCarts, ones: s.ones + p.fits,
          waiting: p.spill, from: 'lane', key: 'b' }))
        after(inMs, () => {
          if (p.spill > 0) { setY(s => ({ ...s, step: 'stuck' })); say('Ten ones on the ground, and more still waiting. Tap them — ten ones make ONE rod.') }
          else { setY(s => ({ ...s, step: 'answer' })); say('All in. How many altogether?') }
        })
      } else {
        const p = plan as ReturnType<typeof loadPlan> & { takeCarts: number; takeOnes: number; short: number }
        const canTake = Math.min(plan.start.onPlatform, p.takeOnes)
        setY(s => ({ ...s, step: 'incoming', ones: s.ones - canTake, leaving: canTake }))
        after(1400, () => {
          setY(s => ({ ...s, leaving: 0 }))
          if (p.short > 0) { setY(s => ({ ...s, step: 'stuck' })); say('Not enough ones left. Tap a rod — Milo will fetch it and break it open.') }
          else { setY(s => ({ ...s, step: 'answer', rods: s.rods - p.takeCarts })); say('All sent. How many are left?') }
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, op])

  /** MAKE A TEN — the ten slide together, become one rod, and Milo walks it up to the row. */
  function tradeUp() {
    if (y.step !== 'stuck' || op !== '+' || y.fusing) return
    if (y.ones < 10) { say('Not ten yet — count them.'); return }   // a refusal is feedback, and it teaches
    setY(s => ({ ...s, step: 'bundling', fusing: true }))
    after(520, () => setY(s => ({ ...s, fusing: false, ones: 0, carried: true, carry: 1 })))
    after(520 + carryMs, () => setY(s => ({ ...s, carried: false, rods: s.rods + 1, carry: 2,
      ones: s.waiting, wave: 0, waiting: 0, from: 'queue', key: 'c' })))
    after(520 + carryMs * 2, () => { setY(s => ({ ...s, carry: 0, step: 'answer' }))
      say('Ten ones make ONE rod. Now — how many altogether?') })
  }

  /** BREAK A TEN — Milo fetches a rod back and it opens into ten ones on the ground. */
  function tradeDown() {
    if (y.step !== 'stuck' || op !== '-' || y.carry) return
    const p = plan as ReturnType<typeof loadPlan> & { takeCarts: number; short: number }
    setY(s => ({ ...s, step: 'bundling', carry: 1 }))
    after(carryMs, () => setY(s => ({ ...s, rods: s.rods - 1, carried: true, carry: 2 })))
    after(carryMs * 2, () => setY(s => ({ ...s, carry: 0, carried: false, ones: 10, wave: 0, from: 'rods', key: 'd' })))
    after(carryMs * 2 + 900, () => setY(s => ({ ...s, ones: s.ones - p.short, rods: s.rods - p.takeCarts, step: 'answer' })))
    after(carryMs * 2 + 1150, () => say('One rod opens back into ten ones. Now — how many are left?'))
  }

  function commit() {
    if (done.current || digits.length < 2) return
    if (digits[0] * 10 + digits[1] === answer) {
      done.current = true; setOk(true)
      setNote(`${a} ${op === '+' ? '+' : '−'} ${b} = ${answer}`)     // the equation, AFTER the work
      speak(`Yes! ${numberToWords(a)} ${op === '+' ? 'plus' : 'minus'} ${numberToWords(b)} is ${numberToWords(answer)}.`)
      after(1800, () => onComplete(mode === 'practice' ? !erred.current : true))
    } else {
      erred.current = true
      say('Not that one. Count the rods, then the ones.')
      after(1200, () => setDigits([]))
    }
  }

  const idle = op === '+' ? 'Ten ones make one rod' : 'Send the order, then count what is left'
  return (
    <>
      <Banner text={note || idle} vh={vh} ok={ok} />
      <Scene y={y} m={m} ch={cube} rodW={rodW} rodH={rodH} miloH={miloH} vw={vw} vh={vh} hint={y.step === 'stuck'}
        onRun={y.step === 'stuck' && op === '+' ? tradeUp : undefined}
        onRod={y.step === 'stuck' && op === '-' ? tradeDown : undefined} />
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: Math.round(vh * 0.02), zIndex: 36, display: 'flex', justifyContent: 'center' }}>
        <AnswerPad digits={digits} band={PAD_BAND(vh)} live={y.step === 'answer' && !ok}
          onDigit={n => setDigits(d => (d.length >= 2 ? d : [...d, n]))}
          onClear={() => setDigits(d => d.slice(0, -1))} onDone={commit} />
      </div>
    </>
  )
}

// ─── Demo / re-teach ──────────────────────────────────────────────────────────────────
/** Milo does one himself, on the SAME yard the round uses — no modal teaching card. The example
 *  ALWAYS regroups: the old demo's four examples all avoided the carry, so the case the chapter
 *  exists for was never shown. Everything spoken is also written; Chrome often has no voice. */
const ASExplain: React.FC<{ slot: Slot; op: Op; data: ASRound; onDone: () => void }> = ({ slot, op, data, onDone }) => {
  const { a, b, answer } = data
  const { w: vw, h: vh } = useViewport()
  const { cube, rodW, rodH, miloH } = yardUnit(vw, vh)
  const plan = useMemo(() => loadPlan(op, a, b), [op, a, b])
  const m = useMemo(() => matOf(slot), [slot])
  const [y, setY] = useState<Yard>(() => initYard(plan))
  const [line, setLine] = useState('')
  const [shown, setShown] = useState(false)
  const doneRef = useRef(onDone); doneRef.current = onDone
  const carryMs = useMemo(() => inFlowJourney(MILO, miloH, ((RODS_X0 + 1 - MILO_X) / 100) * vw).ms, [miloH, vw])

  useEffect(() => {
    const set = (p: Partial<Yard>) => setY(s => ({ ...s, ...p }))
    const late: number[] = []
    const soon = (ms: number, fn: () => void) => late.push(window.setTimeout(fn, ms))
    let lines: string[], steps: Array<() => void>
    if (op === '+') {
      const p = plan as ReturnType<typeof loadPlan> & { addCarts: number; fits: number; spill: number }
      lines = [
        `Milo has these blocks in the yard.`,
        `More arrive — the rods join the row, the ones go on the ground.`,
        `That is ten ones on the ground, and some still waiting.`,
        `Ten ones make ONE rod. Milo walks it up to the row.`,
        `Now the waiting ones come in. Count the rods, then the ones.`,
      ]
      steps = [
        () => set({ ...initYard(plan), step: 'incoming' }),
        () => set({ rods: plan.start.carts + p.addCarts, ones: plan.start.onPlatform + p.fits, waiting: p.spill, from: 'lane', key: 'b' }),
        () => set({ step: 'stuck' }),
        () => {
          set({ step: 'bundling', fusing: true })
          soon(520, () => set({ fusing: false, ones: 0, carried: true, carry: 1 }))
          soon(520 + carryMs, () => set({ carried: false, rods: plan.start.carts + p.addCarts + 1, carry: 2 }))
          soon(520 + carryMs * 2, () => set({ carry: 0 }))
        },
        () => { set({ ones: p.spill, wave: 0, waiting: 0, from: 'queue', key: 'c' }); setShown(true) },
      ]
    } else {
      const p = plan as ReturnType<typeof loadPlan> & { takeCarts: number; takeOnes: number; short: number }
      const canTake = Math.min(plan.start.onPlatform, p.takeOnes)
      lines = [
        `Milo has these blocks, and an order to send out.`,
        `The ones go first — and he runs out of them.`,
        `So he fetches a rod back and breaks it open into ten ones.`,
        `Now he can finish the ones, and send the rods.`,
        `Count the rods, then the ones.`,
      ]
      steps = [
        () => set({ ...initYard(plan), step: 'incoming' }),
        () => { set({ ones: plan.start.onPlatform - canTake, leaving: canTake }); soon(1400, () => set({ leaving: 0 })) },
        () => {
          set({ step: 'bundling', carry: 1 })
          soon(carryMs, () => set({ rods: plan.start.carts - 1, carried: true, carry: 2 }))
          soon(carryMs * 2, () => set({ carry: 0, carried: false, ones: 10, wave: 0, from: 'rods', key: 'd' }))
        },
        () => set({ ones: 10 - p.short, rods: plan.start.carts - 1 - p.takeCarts }),
        () => setShown(true),
      ]
    }
    const cancel = speakSteps(lines, {
      onStep: i => { steps[i]?.(); setLine(lines[i] ?? '') },
      onDone: () => soon(1400, () => doneRef.current()),
      rate: 0.85, gapMs: 700, fallbackStepMs: 2600,
    })
    return () => { cancel?.(); late.forEach(clearTimeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, op])

  return (
    <>
      <Banner text={line || 'Watch Milo trade the blocks…'} vh={vh} />
      <Scene y={y} m={m} ch={cube} rodW={rodW} rodH={rodH} miloH={miloH} vw={vw} vh={vh} />
      {shown && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: Math.round(vh * 0.05), zIndex: 36, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'var(--paper)', border: '4px solid var(--milo-orange)', borderRadius: 18, padding: '8px 22px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(cube * 1.5), color: 'var(--ink)', animation: 'by_pop .4s ease' }}>
            {a} {op === '+' ? '+' : '−'} {b} = {answer}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Beat ─────────────────────────────────────────────────────────────────────────────
function makeBeat(op: Op): Beat<ASRound> {
  return {
    skillId: op === '+' ? 'additionTo100' : 'subtractionTo100',
    rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeRound(op, (d || 1) as 1 | 2 | 3, round),
    sig: d => `${d.a}${op}${d.b}`,
    // SkillBeat renders nothing for an empty prompt — this chapter's own banner owns the pill, and
    // it must never restate the question as a sum.
    prompt: () => '',
    Play: ({ data, onSubmit }) => <ASRoundView slot={slotAt(op, data.slot)} op={op} data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <ASExplain slot={slotAt(op, data.slot)} op={op} data={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'demo' | 'guided' | 'practice'

export default function BlockYard({ op, onFinish, onExit }: {
  op: Op
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
  const [shipped, setShipped] = useState(0)
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
  const beat = useMemo(() => makeBeat(op), [op])

  // Both teaching examples REGROUP — that is the point (see ASExplain).
  const DEMO: ASRound[] = useMemo(() => (op === '+'
    ? [{ slot: 0, a: 27, b: 15, answer: 42, regroup: true }, { slot: 1, a: 38, b: 24, answer: 62, regroup: true }]
    : [{ slot: 0, a: 52, b: 17, answer: 35, regroup: true }, { slot: 1, a: 64, b: 28, answer: 36, regroup: true }]), [op])
  const GUIDED: ASRound = useMemo(() => (op === '+'
    ? { slot: GUIDED_SLOT, a: 26, b: 18, answer: 44, regroup: true }
    : { slot: GUIDED_SLOT, a: 43, b: 15, answer: 28, regroup: true }), [op])

  // Every hook is above this line — an early return that changes the hook count tears the chapter
  // into the error boundary the moment the phone is turned.
  if (needsRotate) return <RotateGate line="Turn your phone sideways to help Milo trade the blocks!" />

  const active = phase === 'practice' ? slotIdx : phase === 'guided' ? GUIDED_SLOT : DEMO[Math.min(demoIdx, DEMO.length - 1)].slot

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#dbe8ef' }}>
      <style>{CRITTER_CSS}{YARD_CSS}</style>

      {runFor(op).map((s, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === active ? 1 : 0, transition: 'opacity .6s ease' }}>
          <img src={BG(s.scene)} alt="" draggable={false} decoding="async"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}

      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
        {/* The cumulative arc, OUTSIDE SkillBeat — anything drawn inside a round resets every round. */}
        {shipped > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,252,244,.86)', border: '2px solid var(--outline)', borderRadius: 999, padding: '4px 12px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--ink-muted)' }}>done today</span>
            {Array.from({ length: Math.min(shipped, 10) }).map((_, i) => (
              // each tally mark keeps the colour of the round it came from, so the strip reads back
              // as the run the child has actually walked rather than a row of identical ticks
              <span key={i} style={{ width: 7, height: 16, borderRadius: 2,
                background: matOf(slotAt(op, GUIDED_SLOT + 1 + i)).face,
                boxShadow: `inset 0 2px 0 ${matOf(slotAt(op, GUIDED_SLOT + 1 + i)).top}, inset 0 -2px 0 rgba(60,44,28,.25)` }} />
            ))}
          </div>
        )}
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ maxWidth: '74%', background: 'rgba(255,252,244,.94)', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: `clamp(14px, ${Math.round(vh * 0.034)}px, 20px)`, color: 'var(--ink)', textAlign: 'center' }}>
            {op === '+'
              ? 'Milo works the block yard. TEN ones make ONE rod — when ten are on the ground, he trades them up. Watch him first!'
              : 'Milo works the block yard. An order goes out — and when the ones run short, he fetches a rod and breaks it open. Watch him first!'}
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('demo') }}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>
            Let&apos;s go! ▶
          </button>
        </div>
      )}

      {phase === 'demo' && (
        <ASExplain key={`demo${demoIdx}`} slot={slotAt(op, active)} op={op} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
      )}

      {phase === 'guided' && (
        <ASRoundView key="guided" slot={slotAt(op, active)} op={op} data={GUIDED} mode="guided"
          onComplete={() => { setSlotIdx(GUIDED_SLOT + 1); setPhase('practice') }} />
      )}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data) => { if (typeof data?.slot === 'number') { setSlotIdx(data.slot); setShipped(s => s + 1) } }}
            onComplete={(c, w, mastered) => { result.current.correct += c; result.current.wrong += w; finishChapter(result.current.correct, result.current.wrong, mastered) }} />
        </div>
      )}
    </div>
  )
}
