'use client'
/**
 * Chapter (9–11) — ROUNDING to the nearest 10 / 100 and ESTIMATING a sum (skill `rounding`) —
 * THE LONG LEVEL.
 *
 * Replaces RoundingTrail, which was the pre-teen "Number Lab" HUD. See docs/story-9-11-rethink.md §2
 * for the band-wide audit. Three faults this file exists to fix, and all three were live:
 *
 *  ① NOTHING ON SCREEN WANTED A ROUNDED NUMBER, so rounding read as a rule rather than a tool. Here
 *    the rounded number is the only one you can ACT ON: you can only warp to a CHECKPOINT, so "the
 *    nearest 10" is not a convention, it is the nearest place you can actually land.
 *  ② IT WAS A COIN FLIP. The old line drew the two bracketing stops and asked which was nearer —
 *    50%, and the two extra chips sat outside the bracket, so a child who knew only that 47 is
 *    "in the forties" still had a two-way guess. That is the same defect the rethink doc flags in
 *    FactorLab and AngleScope. THE RUN NOW CARRIES SIX CHECKPOINTS (see CHECKPOINTS): the child must
 *    first work out which two the number falls between — which is place value — and only then which
 *    is nearer. 16.7%, and the first half of the skill is assessed instead of given.
 *  ③ ALIVENESS 0 OF 4. Nothing arrived, a tap lit a chip, `<PtMilo left={9} />` was a sticker, one
 *    backdrop served all ten rounds.
 *
 * THE WORLD IS A GAME LEVEL, AND THAT IS THE DAILY ANCHOR RATHER THAN A DECORATION. The band's plan
 * (docs/story-9-11-ar-plan.md §2) anchored rounding on "points needed to catch up", and the founder's
 * call was to make the whole WORLD the thing a nine-year-old actually does: play a game. The filter
 * that chose the twelve anchors — *has the child DONE this, or only watched an adult do it?* — is why
 * this beats the rail line it replaces. Almost none of this band has ridden a branch-line train.
 *
 * ⚠️ AND IT IS WARPING, NOT RESPAWNING, FOR A REASON THAT WOULD OTHERWISE BREAK THE MATHS. "You die
 * and go back to the nearest checkpoint" is FALSE and every child in this band knows it: you go back
 * to the LAST one, which is rounding DOWN. A world whose own rule contradicts the skill on every
 * round is the "an attribute question must be true of its object" fault. Warping is the version where
 * NEAREST is honestly the answer: Astro needs to reach 47, there is no pad at 47, so she warps to the
 * closest pad and runs the rest — which is the path line's sentence exactly, in a world this band
 * lives in.
 *
 * THE STORY — §0a's second half, *who wants this and why*. Milo is at the warp console. Astro is out
 * in the level and needs to reach a spot with no checkpoint on it. Milo has to pick a CHECKPOINT to
 * warp her to, and she runs the last stretch. Get it right and she warps in and runs on; get it wrong
 * and the warp does not fire.
 *
 * ⚠️ THE PATH IS THE NUMBER LINE, AND IT IS PAINTED INTO THE BACKDROP RATHER THAN DRAWN OVER IT.
 * All three scenes were generated with one straight walkway running the full width of the lower third,
 * so the axis a rounding chapter needs is part of the picture instead of a neon rule laid on top of
 * it — which is the "a solid shape over a painted scene reads as UI furniture" fault BlockYard paid
 * for three times. Only the checkpoint posts, the marker and the halfway mark are drawn in code.
 *
 * THE GESTURE — one control, three questions, one grader. Every round is a list of LEGS, each of
 * which is rounded to the same place by tapping a checkpoint:
 *   • `round10`  — one leg, m = 10.  "47 metres in — which checkpoint?"
 *   • `round100` — one leg, m = 100. "The big gates only stand every hundred."
 *   • `estimate` — TWO legs, m = 10, and the board adds the two rounded values as they are picked.
 *     "Round each one first, then add" is therefore performed rather than recited, and it cannot be
 *     guessed: both picks have to be right for the total to be.
 * `answer` is the SUM of the rounded legs, which for a one-leg round is just the rounding — so the
 * three types share one code path and one commit check.
 *
 * ⚠️⚠️ A PLAYED ROUND DRAWS NOTHING ON THE LINE BUT THE CHECKPOINTS — no distance marker, and no
 * halfway post either. Founder's call, on a screenshot where the line read "halfway 650" while the
 * bubble read 669: two numbers on screen, only one of them the question. Both marks are teaching
 * aids that were being shown at MEASURING time, and the marker was the worse of the two — pegging
 * the number's true position on the line IS the answer, drawn, so a child could read the nearer
 * checkpoint straight off it without rounding anything. The number now lives only in the words
 * (`ask`, and every `missFor` line), so placing Astro means working out where it falls.
 *
 * ⚠️ BOTH MARKS STAY IN `LevelExplain`, WHICH IS THE DEMO AND THE RE-TEACH. That is the teaching
 * surface — showing 47 sitting past halfway is exactly what it is for — and the split is
 * chapter-craft's own line: if the scene can answer the question, you are teaching, not measuring.
 * So a miss no longer reveals the halfway post; the miss line carries that rule in WORDS instead,
 * which is why `missFor` states the halfway value rather than pointing at a mark.
 *
 * ⚠️ STATED RATHER THAN HIDDEN: `round100` and `estimate` cannot be drawn at L1, so a child who
 * never leaves L1 never completes `coverage` and never gets the mastery early exit. Harmless — they
 * still finish at ten rounds, and mastery needs the top tier anyway. It is the same bounded cost
 * TickTock records.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { Arrive, SheetCell, CRITTER_CSS, inFlowJourney } from './critters'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { rint, pick } from '@/core/rand'
import {
  useHandInput, HandProvider, useHand, CamView, CamGate, type HandSkin,
} from '@/infra/ar/HandInput'
import { slideIndex, snapIndex, reachSpan } from '@/infra/ar/slide'
import { SWEEP_MAX_Y } from '@/infra/ar/sweep'
import { GotIt, ThePlan, StepBoard, CHALK_CSS, stepBoardRect } from './chalkboard'

// ─── The level: ten runs ────────────────────────────────────────────────────────────────
/**
 * `pathY` is where the WALKWAY's surface sits IN THE PAINTING, as a share of the IMAGE's height —
 * read off each scene rather than shared, which is the craft doc's oldest recurring fault. Astro's
 * feet land on it; the checkpoint posts stand just behind it; the marker pegs the ground in front.
 *
 * ⚠️ MEASURED, NOT EYEBALLED, AND NOT BY BRIGHTNESS. A walkway spanning the frame makes ONE
 * horizontal edge running across nearly every column, so the honest detector counts the COLUMNS
 * carrying a strong vertical gradient at each row. A naive brightest-jump scan finds the brightest
 * thing in frame instead — it put the sky level's path at 0.848 (the sky) and the cavern's at 0.803.
 * The real edges: meadow 0.716/0.767, cavern 0.770, sky 0.717/0.777. Feet land on the FRONT of the
 * top face, i.e. the lower edge of the walkway band.
 *
 * ⚠️ A SHARE OF THE IMAGE IS NOT A SHARE OF THE VIEWPORT, AND TREATING IT AS ONE FLOATS EVERYTHING.
 * The backdrop is drawn `object-fit: cover`, so on any frame whose aspect differs from the image's
 * 1.79 the picture is cropped and the painted walkway moves. Measured on a 2000×970 window: cover
 * scales the scene to 1116px tall and crops 73px off each end, putting the path at y ≈ 820 — while
 * `pathY * vh` says 776. **The traveller sat 44px above the path, in mid-air**, which is exactly what
 * the founder saw on the path version. It reads as correct at 1280×720 only because that frame's
 * aspect happens to match the art's. `levelLayout` maps through the real cover transform; CoinShop's
 * `fitFor` paid for this same lesson.
 */
export interface Site { scene: string; label: string; pathY: number }

/** Every level scene is generated at this size; the cover-fit maths below depends on it. */
export const IMG_W = 1376
export const IMG_H = 768

const MEADOW = '/assets/backgrounds/lvl_meadow.png'
const CAVERN = '/assets/backgrounds/lvl_cavern.png'
const SKY = '/assets/backgrounds/lvl_sky.png'

/**
 * Ten slots, indexed STRAIGHT and never modulo — a plan read `PLAN[round % len]` is how three
 * chapters in this repo quietly re-showed the scene they opened with. Consecutive rounds always
 * change scene, so the place moves as well as the numbers.
 */
export const RUN: Site[] = [
  { scene: MEADOW, label: 'the Green Flats', pathY: 0.762 },
  { scene: CAVERN, label: 'the Deep Caves', pathY: 0.775 },
  { scene: SKY, label: 'the Sky Bridge', pathY: 0.770 },
  { scene: MEADOW, label: 'the Green Flats', pathY: 0.762 },
  { scene: CAVERN, label: 'the Deep Caves', pathY: 0.775 },
  { scene: SKY, label: 'the Sky Bridge', pathY: 0.770 },
  { scene: MEADOW, label: 'the Green Flats', pathY: 0.762 },
  { scene: CAVERN, label: 'the Deep Caves', pathY: 0.775 },
  { scene: SKY, label: 'the Sky Bridge', pathY: 0.770 },
  { scene: MEADOW, label: 'the Green Flats', pathY: 0.762 },
]
export const levelAt = (round: number) => RUN[Math.min(round, RUN.length - 1)]

const fmt = (n: number) => n.toLocaleString('en-US')

export function roundTo(n: number, m: number): number { return Math.floor(n / m + 0.5) * m }

export type QType = 'round10' | 'round100' | 'estimate'
export const Q_ALL: readonly QType[] = ['round10', 'round100', 'estimate'] as const

export interface LvRound {
  qType: QType
  site: Site
  /** The tier this round was drawn at. `Play` is handed only `data`, so the fading marker scaffold
   *  has to ride ON the round rather than be read from the engine. */
  d: 1 | 2 | 3
  /** Every round is a list of legs rounded to the same place. One leg for a plain rounding, two for
   *  an estimate — which is what lets all three types share one control and one grader. */
  legs: number[]
  m: number
  /** The rounded value of each leg, in order. The commit checks the child's picks against this. */
  rounded: number[]
  /** The sum of `rounded` — for a one-leg round, simply the rounding. */
  answer: number
  /** The exact sum, shown AFTER the commit as the confirmation an estimate is checked against. */
  exact: number
  ask: string
  done: string
}

/**
 * ⚠️ HOW MANY CHECKPOINTS THE RUN SHOWS, AND WHY IT IS NOT TWO. Two is the bracket, and drawing the
 * bracket for the child hands over the half of rounding that is actually place value ("which ten is
 * 47 in?"), leaving a coin flip. Six is enough to make finding the bracket real work and still fits
 * a 640px frame with a readable board on every post.
 */
export const CHECKPOINTS = 6

/**
 * The six checks for one leg. Both bracketing multiples are always present, and WHERE the answer
 * sits varies with the number — pinned to the middle, a child would simply tap the middle post.
 */
export function checksFor(n: number, m: number): number[] {
  const low = Math.floor(n / m) * m
  const before = n % 4                                  // 0..3, so the answer's index moves
  const first = Math.max(0, low - before * m)
  return Array.from({ length: CHECKPOINTS }, (_, i) => first + i * m)
}

export function makeRound(d: 1 | 2 | 3, round = 0, asked: readonly string[] = []): LvRound {
  const site = levelAt(round)
  const pool: QType[] = d === 1 ? ['round10'] : d === 2 ? ['round10', 'round100', 'round10'] : ['round100', 'estimate', 'round10']
  // Deliberate ONLY while a gap exists, random once it closes: hardest-first for ever would lock the
  // generator onto one type and destroy the variety the coverage gate exists to protect.
  const unmet = Q_ALL.filter(q => !asked.includes(q))
  const t: QType = unmet.length ? (unmet.find(q => pool.includes(q)) ?? pool[0]) : pick(pool)

  if (t === 'estimate') {
    // ⚠️ Neither leg may already sit ON a checkpoint, for the same reason a single rounding may not:
    // "round 20 to the nearest 10" is answered by finding the board that matches the number, which
    // is reading, not rounding. The guard was on the single-leg branch only and the gate caught it.
    const leg = () => { const v = rint(11, 89); return v % 10 === 0 ? v + 1 : v }
    const a = leg(), b = leg()
    const rounded = [roundTo(a, 10), roundTo(b, 10)]
    return {
      qType: t, site, d, legs: [a, b], m: 10, rounded,
      answer: rounded[0] + rounded[1], exact: a + b,
      ask: `Two runs to clear — ${a} m, then ${b} m. Round each to a checkpoint and the board adds them.`,
      done: `About ${rounded[0] + rounded[1]} m in all.`,
    }
  }
  const m = t === 'round100' ? 100 : 10
  // ⚠️ Never a multiple of m: "round 40 to the nearest 10" is not a question, and it would let a
  // child who has understood nothing tap the post whose board matches the number on the docket.
  let n = m === 100 ? rint(120, 980) : rint(11, d === 1 ? 89 : 189)
  if (n % m === 0) n += 1
  const answer = roundTo(n, m)
  return {
    qType: t, site, d, legs: [n], m, rounded: [answer], answer, exact: n,
    ask: m === 100
      ? `The big warp gates only stand every hundred. Astro needs ${fmt(n)} m — which gate do we send her to?`
      : `Astro needs to reach ${n} m. There is no checkpoint at ${n} — which one do we warp her to?`,
    done: m === 100 ? `Gate ${fmt(answer)}. Warping her in.` : `Checkpoint ${answer}. Warping her in.`,
  }
}

/**
 * The grader. Exported so the gate drives the SAME function the commit button calls — a check that
 * re-implements this agrees with its own copy of the rule while the screen it protects rots.
 *
 * ⚠️ LEG BY LEG, NEVER ON THE TOTAL. An estimate whose two roundings are BOTH wrong can still sum to
 * the right number — 40 + 70 and 50 + 60 are both 110 — so grading the sum accepts an answer arrived
 * at by rounding both legs the wrong way. That is SliceShop's grader hole, which only mutation
 * testing found there: a total that matches with working that does not.
 */
export function gradePicks(data: LvRound, picks: readonly (number | null)[]): { ok: boolean; badLeg: number } {
  const badLeg = data.rounded.findIndex((r, i) => picks[i] !== r)
  return { ok: badLeg < 0, badLeg }
}

/** The written miss line. Specific to WHICH mistake was made, and it never names the answer. */
export function missFor(data: LvRound, leg: number, picked: number): string {
  const n = data.legs[leg], m = data.m
  const low = Math.floor(n / m) * m, high = low + m, mid = low + m / 2
  if (picked !== low && picked !== high) {
    return `That one is further along the level — ${fmt(n)} sits between ${fmt(low)} and ${fmt(high)}.`
  }
  // ⚠️ THE EXACT-HALFWAY CASE NEEDS ITS OWN WORDING, and it is not rare: 15, 25, 250, 350 are all
  // legal draws. "15 is PAST 15" is simply false, and it is the one reading a child cannot work out
  // from the picture — the marker sits dead on the post — so it is the one that has to be STATED.
  if (n === mid) return `${fmt(n)} sits exactly halfway between them. When it is a dead heat we always go UP.`
  // ⚠️ STATES the halfway value, never "look at the halfway mark" — a played round draws no mark to
  // look at (see the header), so copy that points at one sends the child hunting for nothing.
  return n > mid
    ? `Halfway between them is ${fmt(mid)} — and ${fmt(n)} is PAST it. So which way is nearer?`
    : `Halfway between them is ${fmt(mid)} — and ${fmt(n)} has not reached it. So which way is nearer?`
}

// ─── Layout ─────────────────────────────────────────────────────────────────────────────
/**
 * Exported so the invariant sweep drives the SAME function the scene renders from. A check that
 * re-implements this chain agrees with its own copy of the constants while the screen it is meant to
 * protect falls apart — this repo has shipped that twice.
 */
export interface LevelLayout {
  pathPx: number
  left0: number
  postGap: number
  /** Screen x of any VALUE on the line, checkpoint or not — so the marker, the halfway mark and the
   *  posts themselves cannot drift apart. */
  xOf: (v: number, first: number, m: number) => number
  checkX: (i: number) => number
  /** Where the runner waits before the warp is set. Exported so the demo and the played round
   *  cannot disagree about it, and so a sweep can assert it stays on screen. */
  homeX: number
  postH: number
  boardFont: number
  /** The board's own height, and the top of the band Milo's bubble can reach — exported so the
   *  sweep can assert the two never meet rather than re-deriving either. */
  boardH: number
  bubbleTop: number
  /** The bubble's own bottom edge. Exported for the same reason `bubbleTop` is: the m marker hangs
   *  below the path and must start below this, and a sweep re-deriving it would drift. */
  bubbleBottom: number
  /** How far above the path the halfway mark's label sits — just clear of the runner's roof, so the
   *  hint a wrong answer turns on can never be hidden by the engine standing in front of it. */
  halfStalkH: number
  miloH: number
  runnerH: number
}
export const CHROME_PX = 46
/** The checks own the LEFT of the frame; Milo and his bubble own the right, so the runner always
 *  travels left→right and never has to be dragged back through the line being read. */
export const PATH_SHARE = 0.72
export const PATH_MID = 0.40
export const MILO_X = 0.88
/**
 * ⚠️ THE SIZE RANK CHANGED WITH THE WORLD, AND THE OLD ASSERTION HAD TO GO WITH IT. The rail version
 * enforced `runner > Milo` because a tank engine really is taller than a pony, and it had shipped the
 * other way round (0.155 against 0.30 — an engine half the height of a pony, reading as a toy on a
 * shelf; the founder caught it). Astro is a PERSON, so there is no rank to enforce against a pony —
 * the honest invariants left are that she is big enough to read and that the posts still out-reach
 * her, which is the one that was actually load-bearing. The gate says so rather than keeping a
 * comparison that is no longer true of the objects.
 */
const MILO_SHARE = 0.24
const RUNNER_SHARE = 0.26
/** MEASURED — the astronaut's registered `cellAspect` in canvas/sheets.ts, not guessed. A person is
 *  TALLER than wide, where the engine was 3:1 the other way, so the half-width shrinks by ~6x and
 *  `homeX` can park her much closer to the first post. */
export const RUNNER_ASPECT = 0.523

/**
 * Where the path sits on the CAMERA path, as a plain share of the viewport.
 *
 * ⚠️ THE COVER-FIT MAPPING IS MEANINGLESS WITHOUT THE PAINTING, and using it anyway is the sharpest
 * version of this chapter's own recorded fault. `pathY` is a share of an IMAGE that is not rendered
 * on the camera path — the scene behind the child is their own room — so mapping through a transform
 * for a picture that is not there puts the path wherever that arithmetic happens to land. On the
 * camera path the path is DRAWN (see `PathBed`), so its position is simply chosen: low enough for the
 * line to read as ground, high enough that the m marker hanging below it stays on screen.
 */
export const CAM_PATH_Y = 0.70

/**
 * ⚠️ ONE definition each, because the layout and the components BOTH need these and two copies of a
 * number is the drift this repo keeps paying for. `markerHeight` is the marker's full stalk+pill box
 * (the clamp reserves it; `DistMarker` draws inside it), and `controlBand` is the height the commit
 * row really occupies — `bottom: 3.5%` plus its own `btnH`, which is a tap target and may not shrink.
 */
export const markerHeight = (font: number) => Math.round(font * 2.0)
export const controlBand = (vw: number, vh: number) =>
  Math.round(vh * 0.035 + Math.max(44, Math.round(Math.min(vw / 14, vh / 11))))

export function levelLayout(vw: number, vh: number, pathY: number, cam = false): LevelLayout {
  /**
   * Where the painted path actually lands, through the backdrop's own `object-fit: cover` transform.
   * `pathY` is a share of the IMAGE; this converts it to a share of the SCREEN.
   */
  const fit = Math.max(vw / IMG_W, vh / IMG_H)
  const drawnH = IMG_H * fit
  /**
   * Milo's bubble, hoisted above the path because the DRAWN path has to clear it — see below. It
   * depends only on the frame, never on the track, so moving it up costs nothing.
   */
  const bubbleFont = Math.max(13, Math.min(vw * 0.015, 18))
  const bubbleH = Math.round(bubbleFont * 1.35 * 3 + 24)          // three lines is the worst wrap
  const bubbleTop = vh - Math.round(vh * MILO_SHARE * 0.86) - bubbleH
  const bubbleBottom = bubbleTop + bubbleH
  /**
   * ⚠️ THE DRAWN PATH MUST SIT BELOW MILO'S BUBBLE, and the painted one only ever did so by accident.
   * The m marker hangs BELOW the path, so a path chosen freely puts the marker straight through the
   * bubble's bottom edge — measured at 640×320 with the path at 0.70: marker 246–275 against a bubble
   * ending at 254. On the painted path the cover-fit happens to land the path at 262 and the two miss
   * each other, which is luck rather than a rule. Stated, both paths obey the same one.
   */
  const rawTrack = cam ? Math.max(vh * CAM_PATH_Y, bubbleBottom + 4) : (vh - drawnH) / 2 + pathY * drawnH
  const wantW = vw * PATH_SHARE
  const wantGap = wantW / (CHECKPOINTS - 1)
  /**
   * ⚠️ THE NAME BOARDS MUST CLEAR MILO'S BUBBLE, AND AT 640×320 THEY DID NOT. Measured live: the
   * bubble ran 355–624 straight across the boards for "70" (371–418) and "80" (463–510) at y 155–187
   * — it covered two of the six things the child has to read and tap. Two independent guesses at one
   * gap, which is this repo's oldest recurring layout fault, and the `vh * 0.20` cap was the guess.
   *
   * The post is now long enough to lift the board above the band the bubble can occupy, derived from
   * Milo's own height and the bubble's own type scale rather than picked. It binds ONLY where it has
   * to: at 1280×720 the wanted height already clears it and nothing moves.
   */
  // 0.22 rather than 0.30: the widest label the chapter can draw is five characters ("1,400"), and
  // at 0.30 six of those touch on a 640px frame.
  const fontFor = (gap: number) => Math.round(Math.max(11, Math.min(gap * 0.22, 34)))
  /** Provisional, so `left0` has a board width to keep clear of the frame edge; re-derived from the
   *  FINAL gap below, because narrowing the line narrows the gap and the boards must not touch. */
  const wantFont = fontFor(wantGap)
  // The first board is centred on the first checkpoint, so the span has to start at least half a board
  // in or it sits flush against the frame edge — measured at 640×320 it began at x = 1.
  const runnerH = Math.round(vh * RUNNER_SHARE)
  /**
   * ⚠️⚠️ WHERE ASTRO WAITS MUST NOT BE INSIDE ANY CHECKPOINT'S CATCH ZONE, or picking her up and
   * putting her straight back down SCORES AN ANSWER THE CHILD NEVER CHOSE. Driven live and it did
   * exactly that: she waited at x 54 while the first checkpoint sat at 77 with a 64px catch either
   * side, so the grab-and-release placed her on the 20 board and graded it. A wrong answer the
   * chapter caused, which is the worst kind.
   *
   * The line's START is what gives, because nothing else can: she cannot stand further left (her own
   * half-width already puts her against the frame edge), and widening the catch or shrinking it are
   * both the wrong lever — one makes the app round for the child, the other makes the target
   * unhittable. So the first post is pushed right until its catch clears her, and the line keeps its
   * width by starting later. `pathW` does not depend on `left0`, so this is not circular.
   */
  const homeX = Math.round(runnerH * RUNNER_ASPECT * 0.55)
  const left0 = Math.max(
    Math.round(wantFont * 2.1 + 6),                        // half a board in from the frame edge
    Math.round(vw * PATH_MID - wantW / 2),
    Math.round(homeX + wantGap * CATCH_SHARE + 12),        // clear of where she waits
  )
  /**
   * ⚠️ THE LINE NARROWS RATHER THAN SHIFTING RIGHT, because the right end is not free: the boards
   * have to stay clear of Milo and his bubble, and the gate caught exactly that the moment the start
   * moved (the last board crossed 0.80 of the width). So the span is start → right limit, and the
   * gaps close up a little instead. Narrower gaps only SHRINK the catch zones, so the constraint the
   * start was moved for still holds — no second pass needed.
   */
  const pathW = Math.min(wantW, vw * 0.78 - left0)
  const postGap = pathW / (CHECKPOINTS - 1)
  const boardFont = fontFor(postGap)
  const boardH = Math.round(boardFont * 1.75)
  /** The halfway mark's own label, which has to live between the boards and the runner's roof. */
  const halfLabelH = Math.round(boardFont * 1.3)
  /**
   * The m marker hangs BELOW the path, so the path cannot sit so low that the marker is unreadable.
   * Clamped rather than re-designed: a few pixels of float on the shortest frame is a far smaller
   * fault than an answer cue that cannot be read.
   *
   * ⚠️ AND IT CLEARS THE COMMIT BUTTON, NOT THE VIEWPORT EDGE — which is what it used to do, and it
   * was measured landing ON the button: 8px at 1280×720 on the caves and 30px at 640×320, 101px
   * wide, so the pill sat on top of the control. "A reserved band is measured against the real
   * control it protects" — the bottom of the screen was never the thing the marker collides with.
   * Two halves, because either alone is worse: the marker got SHORTER (a code-drawn cue's height is
   * arbitrary, so this costs nothing and fixes the common case with no float at all), and the clamp
   * now backstops against the control band, so a frame too short for both floats the world instead
   * of burying the cue — which is the standing rule that the world yields to the tap targets.
   */
  /**
   * ⚠️ THE PAINTED PATH IS NEVER CLAMPED — IT LANDS EXACTLY WHERE THE PAINTING PUTS IT, AND THAT IS
   * THIS CHAPTER'S WHOLE SIGNATURE INVARIANT. It used to be pulled up to keep the marker (which hung
   * BELOW it) clear of the bottom, and chasing the marker onto the commit button showed what that
   * really costs: measured across the sweep, clamping against the control row floated the cast up to
   * **64px off the painted walkway** on 6 of 10 sizes — the exact fault the founder reported as "the
   * train is not on the rail", reintroduced by a fix for an 8px overlap. A clamp here is always the
   * wrong lever, because the number it protects is a CODE-DRAWN cue and the thing it moves is a
   * painting.
   *
   * ⚠️ SO THE MARKER MOVED ABOVE THE PATH INSTEAD (see `DistMarker`). Below it, there is simply no
   * room on a wide frame — cover-fit on a 2.4 aspect drops the walkway to y 695 of 800, leaving 4px
   * before the commit row, so NO marker height fits and the rail version was overlapping it by ~70px
   * there without anyone measuring. Above it there is the whole band between the path and the boards,
   * which holds only thin poles.
   */
  const pathPx = Math.round(rawTrack)
  /**
   * ⚠️ THE POSTS MUST OUT-REACH ASTRO, or she hides the things she is standing among. She is shorter
   * than the engine she replaces, so this binds less hard than it did — but she is still tall enough
   * to cover both a name board and the halfway mark, and the halfway mark is the hint a wrong answer
   * turns on, so losing it behind her would make the one piece of help unreadable. The stack from the
   * path upward is therefore: her head → the halfway label → the name boards → the chrome, each
   * clearing the last.
   */
  const postH = Math.round(Math.max(40, Math.min(
    pathPx - CHROME_PX - boardH - 6,                              // never into the chrome
    Math.max(
      runnerH + 8 + halfLabelH + 8,                                 // above the runner AND the hint
      pathPx - bubbleTop,                                         // above Milo's bubble
    ),
  )))
  /**
   * ⚠️ THE WAITING RUNNER HAS TO BE ON SCREEN. Parked one gap left of the first checkpoint it came out
   * at x = −50 on a 1280 frame — so the runner AND the player riding it were both off-frame for
   * the whole time the child was deciding, and the round's one piece of standing scenery did not
   * exist until it moved. It parks against the left edge instead.
   *
   * It then stands in front of the first post or two, and that is fine rather than a compromise:
   * the boards live ABOVE the track (measured 362–421 against the runner's 453–565 at 1280×720) so
   * they never overlap, and a runner standing in front of a post is what a checkpoint looks like.
   */

  return {
    pathPx, left0, postGap, homeX,
    xOf: (v, first, m) => left0 + ((v - first) / m) * postGap,
    checkX: (i) => left0 + i * postGap,
    postH, boardFont, boardH, bubbleTop, bubbleBottom, halfStalkH: runnerH + 8,
    miloH: Math.round(vh * MILO_SHARE),
    runnerH,
  }
}

// ─── A checkpoint: a post on the line, and the only thing that can be answered with ─────────
/**
 * ⚠️ `aim` IS NOT A VERDICT, and the distinction is the hot/cold rule. It says only that this is the
 * checkpoint UNDER THE HAND — the same thing a finger hovering over a post would say, and the same call
 * The Fundraiser makes when a column lights up beneath a carried digit. Nothing here previews whether
 * the checkpoint is the RIGHT one; that arrives with the miss line or the runner, after the commit.
 *
 * It is drawn as an ORANGE RING and never as the green `chosen` state, so "my hand is here" and "I
 * have set this" are told apart by colour AND by the lift — a child cannot mistake aiming for having
 * answered, which on a dwell surface is the difference between deciding and having decided.
 */
function CheckPost({ value, x, pathPx, h, font, state, onTap }: {
  value: number; x: number; pathPx: number; h: number; font: number
  state: 'idle' | 'aim' | 'chosen' | 'served' | 'dim'; onTap?: () => void
}) {
  const chosen = state === 'chosen', served = state === 'served', aim = state === 'aim'
  return (
    <div
      onClick={onTap}
      style={{
        position: 'fixed', left: x, top: pathPx, transform: 'translate(-50%,-100%)',
        zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center',
        cursor: onTap ? 'pointer' : 'default', pointerEvents: onTap ? 'auto' : 'none',
        opacity: state === 'dim' ? 0.5 : 1, transition: 'opacity .25s ease',
        // A finger has to be able to hit it, whatever the frame does to the post.
        minWidth: 44, paddingLeft: 6, paddingRight: 6,
      }}>
      {/* The name board — a checkpoint's name here IS its metre. */}
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: font, lineHeight: 1.15,
        color: 'var(--ink, #3d2516)', background: served ? 'var(--garden-green, #8fbf6a)' : 'var(--paper, #fdf6e8)',
        border: `3px solid ${chosen ? 'var(--garden-green, #4f8f2f)' : aim ? 'var(--milo-orange, #f26b2c)' : 'var(--outline, #3d2516)'}`,
        boxShadow: chosen ? '0 0 0 4px rgba(79,143,47,.35), 0 3px 0 rgba(61,37,22,.18)'
          : aim ? '0 0 0 5px rgba(242,107,44,.42), 0 3px 0 rgba(61,37,22,.18)'
            : '0 3px 0 rgba(61,37,22,.18)',
        borderRadius: 8, padding: `2px ${Math.round(font * 0.55)}px`, whiteSpace: 'nowrap',
        transform: chosen ? 'translateY(-3px)' : 'none', transition: 'transform .18s ease, box-shadow .18s ease',
      }}>{fmt(value)}</div>
      {/* the post itself */}
      <div style={{
        width: Math.max(4, Math.round(font * 0.22)), height: h,
        background: 'linear-gradient(90deg, #6b5136, #8a6b48 45%, #5d452e)',
        borderRadius: 2, boxShadow: '0 2px 3px rgba(30,42,60,.30)',
      }} />
    </div>
  )
}

/**
 * The halfway mark — smaller than a checkpoint, and the thing a miss line points at.
 *
 * ⚠️ ITS STALK IS SIZED TO CLEAR THE RUNNER, not picked as a fraction of the checkpoint post. At a
 * fraction the label sat inside the traveller's own band and the parked engine covered it on the rail
 * version — measured on
 * the founder's screenshot, "halfway 550" was readable only as "fw…y 50" behind the runner. It
 * is the single piece of help a wrong answer turns on, so it is the one thing that may not be hidden.
 */
function HalfwayPost({ x, pathPx, h, font, value }: { x: number; pathPx: number; h: number; font: number; value: number }) {
  return (
    <div style={{
      position: 'fixed', left: x, top: pathPx, transform: 'translate(-50%,-100%)', zIndex: 29,
      display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none',
      animation: 'k_bounceIn .32s cubic-bezier(.34,1.56,.64,1) both',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: Math.round(font * 0.72),
        color: '#7a4a12', background: 'rgba(255,238,196,.95)', border: '2px dashed #b4802e',
        borderRadius: 6, padding: '1px 7px', whiteSpace: 'nowrap',
      }}>halfway {fmt(value)}</div>
      <div style={{ width: 3, height: h, background: '#b4802e', opacity: .85, borderRadius: 2 }} />
    </div>
  )
}

/**
 * The marker — the metre Astro actually wants, pegged at the point on the path where it falls.
 *
 * ⚠️ IT STANDS ABOVE THE PATH, NOT BELOW IT, AND THAT IS A LAYOUT FIX RATHER THAN A PREFERENCE.
 * Hanging below, it had nowhere to go: on a wide frame cover-fit drops the painted walkway to within
 * 4px of the commit row, so every marker height collided with the control the child has to press —
 * measured 8px at 1280×720 and about 70px at 1920×800, and the only way to make room below was to
 * pull the path off the painting, which floats the whole cast (the fault this chapter is named for).
 * Above the path there is the entire band up to the boards, and the only things in it are the poles,
 * which are 3px wide.
 *
 * ⚠️ It cannot collide with the halfway mark, which shares this band: that one's stalk is
 * `runnerH + 8` tall, so its label sits ~190px up while this pill hugs the path. They are drawn at
 * the same x on a dead heat (55 with halfway 55) and still never meet.
 */
function DistMarker({ x, pathPx, font, value }: { x: number; pathPx: number; font: number; value: number }) {
  return (
    <div style={{
      position: 'fixed', left: x, top: pathPx, transform: 'translate(-50%,-100%)', zIndex: 35,
      display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none',
      animation: 'k_bounceIn .3s cubic-bezier(.34,1.56,.64,1) both',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(font * 0.86),
        color: '#fff', background: 'var(--milo-orange, #f26b2c)',
        border: '3px solid var(--outline, #3d2516)', borderRadius: 999,
        padding: `1px ${Math.round(font * 0.5)}px`, whiteSpace: 'nowrap',
        boxShadow: '0 3px 0 rgba(61,37,22,.20)',
      }}>{fmt(value)} m</div>
      {/* The stalk touches the path, so the pill is unmistakably pointing at a POINT rather than
          floating in the band. Short on purpose — see `markerHeight`. */}
      <div style={{ width: 3, height: Math.round(font * 0.45), background: 'var(--milo-orange, #f26b2c)', borderRadius: 2 }} />
    </div>
  )
}

/**
 * THE TARGET — the metre Astro wants, in the chrome band, for the whole round.
 *
 * ⚠️ THIS IS NOT DECORATION, IT IS WHERE THE NUMBER LIVES NOW. With the marker gone the question is
 * carried entirely by words, and on the CAMERA path Milo's bubble is not free to carry them: the hand
 * hints outrank the ask by design ("Close your fist on Astro to pick her up", "Got her. Open your
 * hand…"), so from the moment a hand enters frame the bubble stops naming the number and the round
 * becomes unanswerable. Founder's own suggestion — "top center mein bhi chalega agar number display
 * ho" — and it is the fix, not an extra.
 *
 * ⚠️ IT WEARS `DistMarker`'S PILL ON PURPOSE. The demo pegs that same orange pill on the line at the
 * number's true position, so one symbol means "the metre Astro wants" in both places — the child
 * learns it while being taught and then reads it while being measured.
 *
 * ⚠️ DEAD CENTRE, AND SIZED FROM THE ROOM ABOVE THE BOARDS RATHER THAN FROM A CSS CLAMP. Founder's
 * call — "increase the size of this and bring it to the center". A `clamp(…vw…)` cannot see what is
 * under the pill, so growing one is guesswork that eventually lands on a name board; `maxH` is the
 * gap to whatever is next down the stack, so the pill is as big as the frame actually allows and
 * cannot reach a board at any size. `pillFont` is exported for the sweep, which drives the same
 * function rather than re-deriving it.
 *
 * ⚠️ AND THE THING BELOW IT IS NOT ALWAYS THE BOARDS. On a two-leg `estimate` round `LegBoard` sits
 * between this and them, and on a short frame those two are only ~50px apart — so the ceiling is
 * crossed against whichever is higher. `PATH_MID` (0.40) is deliberately NOT used: the boards are
 * laid out from it, and this is chrome.
 */
export const PILL_TOP = 6
/**
 * ⚠️ WHICH TERM BINDS, recorded so the next person does not mistake a backstop for coverage: the
 * `vw` term binds up to ~1024 (font 29 at 640) and the 38 cap binds above it, so `maxH * 0.5` never
 * decides the size at any reachable frame. It is not inert, though — it is the term that keeps the
 * pill off the boards if anyone raises the other two, and mutation-testing proves it: drop it and
 * grow the cap and the gate's clearance check fails.
 */
export const pillFont = (vw: number, maxH: number) =>
  Math.max(15, Math.min(Math.round(vw * 0.045), Math.round(maxH * 0.5), 38))
/** The pill's drawn height, from its own font. Padding 4 + border 3, each side, at `lineHeight: 1`. */
export const pillH = (font: number) => font + 14
/** The room it has: down to whatever is next in the stack, less a 6px gap. */
export const pillCeiling = (L: LevelLayout, legs: number) => Math.max(20, Math.round(
  (legs > 1 ? L.pathPx - L.postH - L.boardFont * 2.6 : L.pathPx - L.postH) - 6 - PILL_TOP,
))

function TargetPill({ vw, value, maxH }: { vw: number; value: number; maxH: number }) {
  const font = pillFont(vw, maxH)
  return (
    <div style={{
      position: 'fixed', left: '50%', top: PILL_TOP,
      transform: 'translateX(-50%)', zIndex: 44, pointerEvents: 'none',
      display: 'flex', alignItems: 'baseline', gap: Math.round(font * 0.3),
      fontFamily: 'var(--font-display)', fontWeight: 900,
      fontSize: font, lineHeight: 1,
      color: '#fff', background: 'var(--milo-orange, #f26b2c)',
      border: '3px solid var(--outline, #3d2516)', borderRadius: 999,
      padding: `4px ${Math.round(font * 0.6)}px`, whiteSpace: 'nowrap',
      boxShadow: '0 4px 0 rgba(61,37,22,.22)',
    }}>
      <span style={{ opacity: .85, fontWeight: 800, fontSize: '.62em' }}>NEEDS</span>{fmt(value)} m
    </div>
  )
}

// ─── The camera path ────────────────────────────────────────────────────────────────────
/**
 * THE PATH, DRAWN — the number line, for the path where there is no painting to carry it.
 *
 * ⚠️ THIS DOES NOT BREAK THE "NO NEON RULE OVER A PAINTED SCENE" RULE, AND IT IS WORTH SAYING WHY,
 * because the header opens by insisting the track is painted rather than drawn. That rule is about a
 * filled shape laid over a PAINTING — painted scenes contain no hard-edged rectangles, so one reads
 * as UI furniture. The camera path has no painting: the backdrop is whatever room the child is
 * sitting in, and a chapter whose whole question is "where does this number sit on the line" cannot
 * have no line. So the axis is drawn here and NOT drawn on the painted path, where the scene supplies
 * it — the two branches are exclusive, and neither ever draws a rule over a picture.
 *
 * It is a slab with a lit top edge and flagstone joints rather than one bar, for the reason the posts
 * are posts: Astro has to look like she is standing ON something, and a single stripe is a progress
 * bar. It matches the walkway the three painted scenes carry, so the two input paths read as the
 * same world.
 */
function PathBed({ pathPx, vw }: { pathPx: number; vw: number }) {
  const h = Math.max(14, Math.round(vw * 0.014))
  return (
    <div style={{
      position: 'fixed', left: 0, top: pathPx, width: vw, height: h,
      transform: 'translateY(-100%)', zIndex: 12, pointerEvents: 'none',
    }}>
      {/* the slab, so Astro stands on ground rather than in mid-air over the room */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 2,
        background: 'linear-gradient(180deg, #9c9384 0%, #6d6558 45%, #4a4239 100%)',
      }} />
      {/* the joints between flagstones */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 ${Math.round(h * 2.6)}px, rgba(40,34,26,.5) ${Math.round(h * 2.6)}px ${Math.round(h * 2.9)}px)`,
      }} />
      {/* the lit top edge — what makes it a surface rather than a bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: Math.max(2, Math.round(h * 0.16)),
        background: 'rgba(226,220,206,.9)',
      }} />
    </div>
  )
}

/**
 * THE HAND'S OWN POINTER. ⚠️ The full-screen self-view does NOT replace it: the child's hand is drawn
 * where the camera sees it, while the reading is that position stretched through the reach band, so
 * the two are in different places on purpose. This dot is the one that means anything.
 */
function HandDot({ at, live, progress }: {
  at: { x: number; y: number }; live: boolean; progress: number
}) {
  return (
    <div style={{
      position: 'fixed', left: at.x, top: at.y, zIndex: 61, pointerEvents: 'none',
      transform: 'translate(-50%,-50%)', width: live ? 46 : 30, height: live ? 46 : 30,
      borderRadius: 999, border: `4px solid ${live ? 'var(--milo-orange, #f26b2c)' : 'rgba(255,255,255,.75)'}`,
      /* The arming ring rides ON the cursor rather than beside it, because that is where the child is
         already looking — a countdown drawn anywhere else is a thing they have to notice. */
      background: live
        ? `conic-gradient(rgba(242,107,44,.85) ${Math.round(progress * 360)}deg, rgba(255,255,255,.28) 0)`
        : 'rgba(255,255,255,.22)',
      boxShadow: '0 2px 8px rgba(0,0,0,.45)', transition: 'width .12s, height .12s',
    }} />
  )
}

/**
 * The hand's position in SCREEN pixels — both axes through the reach band, so the dot lands where the
 * chapter thinks the hand is rather than where the camera sees it.
 */
export const levelPoint = (p: { x: number; y: number }, vw: number, vh: number) =>
  ({ x: reachSpan(p.x) * vw, y: reachSpan(p.y) * vh })

/**
 * ⚠️⚠️ HOW CLOSE A RELEASE HAS TO BE TO A CHECKPOINT, AS A SHARE OF THE GAP — AND THIS ONE CONSTANT
 * DECIDES WHETHER THE CHAPTER STILL TEACHES ANYTHING.
 *
 * The Fundraiser's drop uses NEAREST-TARGET partitioning, which splits exactly at the halfway line so
 * there is nowhere to miss. **Copying that here would destroy this chapter**: the child would carry
 * Astro to where 47 actually falls, let go, and the app would snap her to 50 — i.e. the machine
 * performs the rounding and the answer is handed over, which is the one thing the whole rebuild
 * exists to prevent. Rounding is the child's decision, so the release has to land ON a checkpoint
 * they deliberately aimed at.
 *
 * So the catch is BOUNDED rather than partitioning: 0.35 of the gap either side, which forgives a
 * wobbling hand (a 128px-wide target at 1280 — the same order as The Fundraiser's 150px boxes) while
 * a release at the halfway point, 0.5 of the gap away, lands on NOTHING. That boundary is the
 * physical statement of the rule: there is no checkpoint at 47, so you cannot leave her at 47.
 */
export const CATCH_SHARE = 0.35

/**
 * WHICH CHECKPOINT A RELEASE AT THIS SCREEN-X LANDS ON, or null for a release between them.
 * Exported so the gate drives the same function the drop does, and so the aim ring while carrying
 * can never light a post the release would not actually land on.
 */
export function dropIndex(px: number, checkX: (i: number) => number, gap: number): number | null {
  let best = -1, bestD = Infinity
  for (let i = 0; i < CHECKPOINTS; i++) {
    const d = Math.abs(px - checkX(i))
    if (d < bestD) { bestD = d; best = i }
  }
  return bestD <= gap * CATCH_SHARE ? best : null
}

/**
 * IS THE HAND ON ASTRO — i.e. may this fist pick her up? Generous (most of her own drawn width either
 * side), because closing a fist moves the hand a little and a child who is plainly on her should not
 * have to be precise about it.
 *
 * ⚠️ THE POSTURE GATE IS ON THE RAW `y`, NOT THE REACHED ONE, because it is a question about where the
 * hand physically is in the picture: a hand resting on the desk is not a grab, and stretching the
 * axis first would move the line it has to clear. `slide.ts` names this reuse.
 */
export function onAstro(palm: { x: number; y: number } | null, astroX: number, runnerH: number, vw: number, vh: number): boolean {
  if (!palm || palm.y > SWEEP_MAX_Y) return false
  return Math.abs(levelPoint(palm, vw, vh).x - astroX) <= runnerH * RUNNER_ASPECT * 0.9 + 24
}

/**
 * What Milo says about the HAND, or null when there is nothing to say and the question should stand.
 *
 * ⚠️ IT IS NOT A SECOND TEXT REGION, AND THAT IS THE WHOLE POINT. Built as a chip it collided at
 * 640×320 twice over — stacked on the controls it covered the METRE MARKER (the L1 scaffold), and moved
 * to the top strip it covered four of the six NAME BOARDS (the answer surface). That frame has no
 * free band: chrome 0–46, boards 59–92, stalks, path 210, marker to 275, controls 265–309. This file
 * already says out loud that Milo's bubble is the only question region (`prompt: () => ''`), so the
 * hand's state goes THERE and an overlap stops being expressible.
 *
 * ⚠️ AND IT ONLY SPEAKS FOR THE STATES WHERE NOTHING CAN HAPPEN. That is the Supply Run's rule kept
 * honestly rather than by volume: "no hand in frame", "hand too low" and "one leg still to go" are
 * each a child doing something reasonable and seeing nothing move. When the hand is up and over a
 * checkpoint, something IS happening — the post rings and the cursor's arc fills — so replacing the
 * question with a sentence about the gesture would cost them the question to say what they can see.
 *
 * ⚠️ IT NEVER NAMES THE MEADOW UNDER THE HAND. The post already lights up, which says WHERE; a sentence
 * repeating its number is a second copy of the same cue and reads as the app agreeing with the child.
 */
export function levelAsk(
  input: 'hand' | 'tap',
  st: { hands: number; low: boolean; legsLeft: number; ofLegs: number; carrying: boolean; missed: boolean },
): string | null {
  if (input === 'tap') return null                       // a tap surface explains itself, and did
  if (st.hands === 0) return 'Hold your hand up where I can see it.'
  if (st.low) return 'Lift your hand a little — I cannot see it down there.'
  /**
   * ⚠️ A RELEASE THAT PLACED NOTHING MUST SAY SO. Opening your hand between two checkpoints is the
   * commonest thing a child will do here, and it is CORRECTLY refused — she cannot stand at 47. But
   * silence after a gesture is the "a tap that does nothing is the worst outcome there is" fault, so
   * the refusal is spoken and it names the rule rather than the answer.
   */
  if (st.missed) return 'She cannot stand between checkpoints — carry her onto one and then open your hand.'
  if (st.carrying) return 'Got her. Open your hand where you want her to stand.'
  if (st.ofLegs > 1 && st.legsLeft === 1) return 'First one set. Pick her up again for the second.'
  return 'Close your fist on Astro to pick her up.'
}

// ─── Astro, the one who has to get there ────────────────────────────────────────────────
export const ASTRO = '/assets/objects/astronaut_side.png'

/**
 * ⚠️ SHE WARPS TO THE CHECKPOINT — SHE DOES NOT RUN TO IT — AND THAT IS THE WORLD'S OWN PHYSICS,
 * NOT AN ANIMATION SHORTCUT. If she could run to the checkpoint she could run to 47, and the whole
 * argument for rounding here ("you can only land ON a checkpoint") would be a lie the screen tells
 * every round. So the commit is an instant jump between two flashes, which also sidesteps the
 * cardinal cycle rule for free: a teleport is not a journey, so there is no travel for a walk cycle
 * to disagree with. Her legs only ever run for the two moves that ARE journeys — running in at the
 * start of the round, and running the last stretch after she lands.
 *
 * ⚠️ AND A TELEPORT NEEDS A FLASH AT BOTH ENDS OR IT READS AS A BUG. `warpKey` changes on every
 * landing, which restarts the ring — an `animation` alone would fire once and never again, and this
 * repo has shipped that (a bumped React `key` destroys the subtree, so the ring is keyed, not the
 * sprite).
 */
function Runner({ h, moving, cycleScale, ring }: {
  h: number; moving: boolean; cycleScale?: number
  /** Bumped to replay the warp flash; null while she is running, where a ring would be nonsense. */
  ring?: number | null
}) {
  return (
    <div style={{ position: 'relative', height: h }}>
      {ring != null && (
        <span key={ring} aria-hidden style={{
          position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
          width: h * 0.9, height: h * 0.34, borderRadius: '50%',
          border: '3px solid rgba(122,214,255,.95)', boxShadow: '0 0 18px 6px rgba(122,214,255,.55)',
          animation: 'lv_warp .5s ease-out both', pointerEvents: 'none',
        }} />
      )}
      {/* The contact shadow rides INSIDE the travelling element, so it can never drift from her feet
          — two things that must move as one have to BE one element. */}
      <span aria-hidden style={{
        position: 'absolute', left: '50%', bottom: -2, transform: 'translateX(-50%)',
        width: h * 0.44, height: h * 0.1, borderRadius: '50%',
        background: 'rgba(30,42,60,.26)', filter: 'blur(2px)',
      }} />
      <SheetCell src={ASTRO} h={h} moving={moving} cycleScale={cycleScale} breathe={!moving} />
    </div>
  )
}

/** Keyframes for the warp flash. Kept beside the component that owns them. */
const LEVEL_CSS = `
@keyframes lv_warp {
  0%   { opacity: 0; transform: translateX(-50%) scale(.25); }
  45%  { opacity: 1; transform: translateX(-50%) scale(1.15); }
  100% { opacity: 0; transform: translateX(-50%) scale(1.6); }
}
@media (prefers-reduced-motion: reduce) { @keyframes lv_warp { from,to { opacity: 0 } } }
`

// ─── Milo the guide, and the question out of his own mouth ──────────────────────────
function Guide({ h, line, vw }: { h: number; line: string; vw: number }) {
  return (
    <>
      <div style={{
        position: 'fixed', left: Math.round(vw * MILO_X), bottom: 0, zIndex: 38,
        transform: 'translateX(-50%)', pointerEvents: 'none',
      }}>
        {/* The contact shadow sits INSIDE the element, so it can never drift from the feet, and it is
            drawn above bottom:0 — SliceShop shipped one clipped away under the viewport. */}
        <div style={{ position: 'relative', paddingBottom: Math.round(h * 0.06) }}>
          <span aria-hidden style={{
            position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
            width: '76%', height: Math.round(h * 0.11), borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(46,38,24,.30) 0%, rgba(46,38,24,0) 72%)',
          }} />
          <SheetCell src="/assets/characters/milo_side.png" h={h} facesLeft moving={false} breathe />
        </div>
      </div>
      {/* Anchored at his mouth, and CLAMPED below the chrome — on a short frame the scene rides high
          and an unclamped bubble opens inside the back chip. */}
      <div style={{
        position: 'fixed', right: '2.5vw', bottom: Math.round(h * 0.86), zIndex: 42,
        maxWidth: Math.min(Math.round(vw * 0.42), 400), pointerEvents: 'none',
      }}>
        <div style={{
          background: 'var(--paper, #fdf6e8)', border: '3px solid var(--outline, #3d2516)',
          borderRadius: '18px 18px 4px 18px', padding: '10px 14px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(13px,1.5vw,18px)',
          color: 'var(--ink, #3d2516)', lineHeight: 1.35, boxShadow: '0 4px 0 rgba(61,37,22,.10)',
        }}>{line}</div>
      </div>
    </>
  )
}

/** The running board — the child's own two roundings adding up. Their work, never the chart's. */
function LegBoard({ data, picks, x, y, font }: {
  data: LvRound; picks: (number | null)[]; x: number; y: number; font: number
}) {
  return (
    <div style={{
      position: 'fixed', left: x, top: y, transform: 'translate(-50%,-100%)', zIndex: 40,
      background: 'var(--paper, #fdf6e8)', border: '3px solid var(--outline, #3d2516)',
      borderRadius: 12, padding: `6px ${Math.round(font * 0.8)}px`, pointerEvents: 'none',
      fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: font,
      color: 'var(--ink, #3d2516)', whiteSpace: 'nowrap', boxShadow: '0 4px 0 rgba(61,37,22,.14)',
    }}>
      {data.legs.map((_, i) => (
        <span key={i}>
          {i > 0 && <span style={{ opacity: .5 }}> + </span>}
          <span style={{ opacity: picks[i] == null ? 0.32 : 1 }}>{picks[i] == null ? '—' : fmt(picks[i]!)}</span>
        </span>
      ))}
      {picks.every(p => p != null) && (
        <span> <span style={{ opacity: .5 }}>=</span> {fmt(picks.reduce((s, p) => s! + (p ?? 0), 0)!)}</span>
      )}
    </div>
  )
}

// ─── Play ───────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'

const LevelPlay: React.FC<{ data: LvRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  /**
   * ⚠️ THROUGH CONTEXT, NOT A PROP. `SkillBeat` builds the play surface itself and its beat is
   * memoised, so threading the input down would regenerate the question under a child mid-answer.
   */
  const { read, input } = useHand()
  const onCam = input === 'hand'
  const L = levelLayout(vw, vh, data.site.pathY, onCam)

  const [picks, setPicks] = useState<(number | null)[]>(() => data.legs.map(() => null))
  const [miss, setMiss] = useState<string | null>(null)
  const [solved, setSolved] = useState(false)
  const [runnerX, setRunnerX] = useState(() => -vw * 0.3)
  const [dropped, setDropped] = useState(false)
  /** Bumped on every landing so the warp ring replays; see `Runner`. */
  const [warps, setWarps] = useState(0)
  const erred = useRef(false)
  const done = useRef(false)
  const picksRef = useRef(picks); picksRef.current = picks

  const key = `${data.qType}|${data.legs.join(',')}|${data.m}`

  const legIdx = Math.max(0, picks.findIndex(p => p == null))
  const activeLeg = picks.every(p => p != null) ? data.legs.length - 1 : legIdx
  const n = data.legs[activeLeg]
  const checks = useMemo(() => checksFor(n, data.m), [n, data.m])
  const first = checks[0]
  const homeX = L.homeX

  /**
   * Her two real journeys, each sized from her OWN gait: `inFlowJourney` turns a distance into a
   * duration AND the cycle scale that keeps her legs in step with it. Taking a duration without its
   * correction is the cardinal fault this repo deleted `travelMs` to make unwritable.
   */
  const enter = useMemo(() => {
    const dist = Math.round(vw * 0.3 + homeX)
    return { dist, ...inFlowJourney(ASTRO, L.runnerH, dist) }
  }, [vw, homeX, L.runnerH])
  const runOff = useMemo(() => {
    const dist = Math.round(vw - runnerX + L.runnerH)
    return { dist, ...inFlowJourney(ASTRO, L.runnerH, dist) }
  }, [vw, runnerX, L.runnerH])

  // Astro runs in from off-frame at the start of the round — the round OPENS with motion rather than
  // with a still picture and a question. `left` is placed, never transitioned: `Arrive` owns the
  // travel (and her legs), so a transition here would be a second thing animating one movement.
  useEffect(() => {
    setPicks(data.legs.map(() => null)); picksRef.current = data.legs.map(() => null)
    setMiss(null); setSolved(false); setDropped(false)
    done.current = false; erred.current = false
    setWarps(0); setRunnerX(homeX)
    speak(data.ask)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const tapCheck = useCallback((v: number) => {
    if (done.current || solved) return
    setMiss(null)
    // Read from a ref, never from the state this handler also sets: two taps inside one React batch
    // both see the stale array otherwise. Fifth time this repo has met that shape.
    const cur = picksRef.current
    const i = cur.every(p => p != null) ? cur.length - 1 : Math.max(0, cur.findIndex(p => p == null))
    const next = cur.slice(); next[i] = v
    picksRef.current = next; setPicks(next)
  }, [solved])

  const startOver = useCallback(() => {
    if (done.current) return
    const blank = data.legs.map(() => null)
    picksRef.current = blank; setPicks(blank); setMiss(null)
  }, [data.legs])

  const commit = useCallback(() => {
    if (done.current) return
    const cur = picksRef.current
    if (cur.some(p => p == null)) return
    const { ok, badLeg } = gradePicks(data, cur)
    if (!ok) {
      erred.current = true
      const line = missFor(data, badLeg, cur[badLeg]!)
      // The rule arrives in WORDS. Nothing is revealed on the line — a mark saying 650 beside a
      // question about 669 is two numbers on screen, only one of which is being asked.
      setMiss(line)
      speak(line)
      // Clear only the leg that was wrong, so a correct first leg is not taken away from the child.
      const next = cur.slice(); next[badLeg] = null
      picksRef.current = next; setPicks(next)
      return
    }
    done.current = true
    setSolved(true)
    speak(data.done)
    /**
     * The reward: the warp fires and Astro LANDS on the checkpoint — instantly, with a flash at each
     * end. ⚠️ `rollMs` goes to 0 first so the jump carries no transition: sliding her there would be
     * the very thing the world says is impossible, and it would also be a body covering ground with
     * its legs parked, which is this repo's cardinal animation fault.
     */
    const target = L.xOf(data.rounded[data.rounded.length - 1], first, data.m)
    setWarps(w => w + 1)
    setRunnerX(target)
    // Then she RUNS the last stretch, which is a real journey and gets its legs — see `dropped`.
    window.setTimeout(() => setDropped(true), 620)
    window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 2600)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mode, onComplete, first])

  const canCommit = picks.every(p => p != null)
  // ⚠️ The SAME expression `controlBand` reserves for it. Written out twice, the reserve and the
  // control drift apart and the marker lands on the button again — which is how it got there.
  const btnH = Math.max(44, Math.round(Math.min(vw / 14, vh / 11)))
  const served = solved ? data.rounded[data.rounded.length - 1] : null

  // ─── the hand: pick her up, carry her, put her down ───────────────────────────────────
  /**
   * ⚠️ THE SLIDE-AND-DWELL IS GONE, ON THE FOUNDER'S CALL — "yeh slide ka tariqa sahi naii laga".
   * It asked the child to hover and then HOLD STILL, which is a timer wearing a gesture's clothes:
   * nothing is being carried, the commit is a stopwatch, and it needed hysteresis on top because a
   * hand parked on a boundary dithered between two checkpoints and the dwell never fired. Picking
   * Astro up and putting her down is the thing a child already does, the release is the answer with
   * no timer anywhere, and the boundary problem simply does not exist — you either put her ON a
   * checkpoint or you did not.
   */
  const handLive = onCam && !solved && !done.current

  /**
   * ⚠️ THE HELD-OVER GUARD, AND FOR A GRAB IT IS THE CLOSE-COUNT RATHER THAN THE POSE. A child whose
   * fist is still shut when the next round opens must not pick Astro straight back up — the same
   * fault the dwell had, where a parked hand answered rounds 2 and 3 by itself. `grabs` is monotone
   * within a detector session, so the round captures a baseline DURING RENDER (an effect runs after
   * paint, and the first paint has to be right) and nothing is armed until it goes up, i.e. until the
   * hand has actually opened and closed again.
   *
   * ⚠️ AND IT CLAMPS BACKWARDS. `grabs` resets to 0 when the detector restarts — one "Try the camera
   * again" or a switch to taps and back — and a baseline stranded above the counter would wedge the
   * gesture for the rest of the run. The Supply Run's sweep records this exact trap.
   */
  const graspRef = useRef({ key, base: read.grabs })
  if (graspRef.current.key !== key) graspRef.current = { key, base: read.grabs }
  if (read.grabs < graspRef.current.base) graspRef.current.base = read.grabs
  const armed = read.grabs > graspRef.current.base

  /** Her x while she is in the child's hand; null when she is standing. */
  const [carryX, setCarryX] = useState<number | null>(null)
  const carryRef = useRef<number | null>(null); carryRef.current = carryX
  const heldRef = useRef(false)
  const [missed, setMissed] = useState(false)

  /** The post a release RIGHT NOW would land on — the same function the drop uses, so the ring can
   *  never light a checkpoint the release would miss. It says WHERE, never whether it is right. */
  const aim = carryX == null ? null : dropIndex(carryX, L.checkX, L.postGap)

  /**
   * PICK HER UP · CARRY · PUT HER DOWN. The release IS the answer, which is what the founder asked
   * for — "jahan lage sahi hai wahan fist kholu aur woh mera final answer rahega".
   *
   * ⚠️ THE DANGEROUS DIRECTION IS ALREADY CONFIRMED FOR US. An accidental opening mid-carry would
   * otherwise place her — and grade — somewhere the child never chose, so it is the one edge that
   * must not fire on a single frame. `stepPinch` holds the release for RELEASE_FRAMES consecutive
   * open frames before reporting it, and rides out lost frames, so by the time `grabbing` goes false
   * here the hand really is open. That is why this can be a plain edge.
   */
  useEffect(() => {
    if (!handLive) { heldRef.current = false; return }
    const held = armed && read.grabbing
    const p = read.palm ? levelPoint(read.palm, vw, vh) : null
    /**
     * ⚠️ THE CARRY CLAMPS TO WHERE SHE MAY STAND, NOT TO THE FIRST CHECKPOINT — clamping to
     * `checkX(0)` TELEPORTED her onto the first checkpoint the instant she was picked up, so a
     * grab-and-release without moving scored that checkpoint. Driven live, twice: it is the same
     * "a wrong answer the chapter caused" as her waiting place being inside a catch zone, one layer
     * along, and fixing only one of the two leaves the other doing the damage on its own.
     */
    const span = { lo: L.homeX, hi: L.checkX(CHECKPOINTS - 1) }

    if (held && !heldRef.current) {
      // closing: she comes up only if the fist closed ON her, so the grab is aimed rather than magic
      if (onAstro(read.palm, carryRef.current ?? runnerX, L.runnerH, vw, vh) && p) {
        setMissed(false)
        setCarryX(Math.min(span.hi, Math.max(span.lo, p.x)))
      }
    } else if (held && carryRef.current != null && p) {
      setCarryX(Math.min(span.hi, Math.max(span.lo, p.x)))       // she follows the hand along the path
    } else if (!held && heldRef.current && carryRef.current != null) {
      const i = dropIndex(carryRef.current, L.checkX, L.postGap)
      setCarryX(null)
      if (i != null && checks[i] != null) { setMissed(false); tapCheck(checks[i]) }
      else setMissed(true)                                       // refused, and `levelAsk` says why
    }
    heldRef.current = held
  }, [handLive, armed, read.grabbing, read.palm, read.grabs, vw, vh, L, checks, runnerX, tapCheck])
  /**
   * ⚠️ PUTTING HER DOWN IS THE COMMIT ON THE CAMERA PATH — the founder's own words, "woh mera final
   * answer rahega". A one-leg round would otherwise need two gestures for one answer: carry her to a
   * checkpoint, then let go, then reach for a button. On a TWO-leg round this falls out correctly for
   * free, because the commit waits until every leg is filled — so she is placed twice and graded once.
   * The button stays on screen and stays live either way, so there is never nothing to press.
   *
   * A short beat before grading, so the child sees the checkpoint she landed on light up first.
   */
  useEffect(() => {
    if (!onCam || solved || done.current || !picks.every(p => p != null)) return
    const t = window.setTimeout(() => commit(), 480)
    return () => window.clearTimeout(t)
  }, [picks, onCam, solved, commit])

  /** Where the chapter thinks the hand is — the reading stretched through the reach band, which is
   *  NOT where the self-view draws their hand. See `HandDot`. */
  const at = onCam && read.palm ? levelPoint(read.palm, vw, vh) : null
  const hint = levelAsk(onCam ? 'hand' : 'tap', {
    hands: read.hands,
    low: !!read.palm && read.palm.y > SWEEP_MAX_Y,
    legsLeft: picks.filter(p => p == null).length,
    ofLegs: data.legs.length,
    carrying: carryX != null,
    missed,
  })

  return (
    <>
      {/* Everything is position:fixed. In a SCORED round the nearest positioned ancestor is
          SkillBeat's own content-sized wrapper, so absolute % would squash the whole line into a
          strip across the top — a bug this repo shipped once and only saw in practice, because the
          demo renders outside SkillBeat and looks perfectly correct. */}
      {/* ⚠️ THE PAINTED SCENE IS NOT RENDERED ON THE CAMERA PATH. It is opaque and sits above the
          full-screen self-view, so drawing it would simply hide the camera the child is answering
          with — and the track it carries is replaced by `PathBed`, which is the only reason the axis
          can move onto a picture of the child's own room at all. */}
      {!onCam ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden' }}>
          {[CAVERN, SKY, MEADOW].map(s => (
            <img key={s} src={s} alt="" draggable={false} decoding="async"
              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                opacity: s === data.site.scene ? 1 : 0, transition: 'opacity .6s ease',
              }} />
          ))}
        </div>
      ) : (
        <PathBed pathPx={L.pathPx} vw={vw} />
      )}

      {/* The checks — the answer surface. Delete them and there is nothing to answer with. */}
      {checks.map((v, i) => (
        <CheckPost key={v} value={v} x={L.checkX(i)} pathPx={L.pathPx} h={L.postH} font={L.boardFont}
          state={served === v ? 'served'
            : picks[activeLeg] === v ? 'chosen'
              : solved ? 'dim'
                : handLive && aim === i ? 'aim'
                  : 'idle'}
          onTap={solved ? undefined : () => tapCheck(v)} />
      ))}

      {/* ⚠️ Drawn even while the dwell is arming, and never a ring around the POST: the ring belongs
          to the hand, so a child whose hand has drifted off a checkpoint sees the dot leave rather than a
          post silently site counting down. */}
      {/* ⚠️ NO COUNTDOWN RING ANY MORE — there is no dwell to count. The cursor is simply LIT while
          she is in the child's hand, which is a state they can already see from the character moving
          with them; an arc filling would be promising a commit that no longer works that way. */}
      {onCam && at && <HandDot at={at} live={carryX != null} progress={0} />}

      {/* ⚠️ NOTHING IS DRAWN ON THE LINE HERE BUT THE CHECKPOINTS — no marker, no halfway post. Both
          belong to `LevelExplain`; see the header. The number lives in the words and in this pill,
          which is the only place it is guaranteed to be while a hand hint owns the bubble. Hidden on
          the commit: she has warped, so there is nothing left to aim at — and on an estimate round
          the confirmation takes this same slot. */}
      {!solved && <TargetPill vw={vw} value={n} maxH={pillCeiling(L, data.legs.length)} />}

      {/* ⚠️ ONE Astro, not a vehicle plus a rider — a running character carries herself, so the rail
          version's train + passenger collapse into a single sprite and one less thing to keep in
          step. `left` never carries a transition: her only two travels are TRANSFORMS driven by
          `Arrive` (which is what runs her legs for exactly the interval she is covering ground), and
          the warp between them is an instant jump. */}
      {/* ⚠️ `carryX` WINS OVER `runnerX` AND CARRIES NO TRANSITION — while she is in the child's
          hand she IS the cursor, and easing her toward it would put her behind their own hand by a
          few frames, which reads as lag rather than as carrying something. */}
      <div style={{
        position: 'fixed', left: carryX ?? runnerX, top: L.pathPx,
        transform: 'translate(-50%,-100%)', zIndex: 34, pointerEvents: 'none',
      }}>
        {!dropped ? (
          <Arrive dist={-enter.dist} ms={enter.ms} resetKey={key}>
            {moving => <Runner h={L.runnerH} moving={moving} cycleScale={enter.cycleScale} ring={warps || null} />}
          </Arrive>
        ) : (
          <Arrive dist={runOff.dist} ms={runOff.ms} leave resetKey={key}>
            {moving => <Runner h={L.runnerH} moving={moving} cycleScale={runOff.cycleScale} ring={null} />}
          </Arrive>
        )}
      </div>

      {/* Two legs need somewhere to add up. One leg does not, so it does not get a board. */}
      {data.legs.length > 1 && (
        <LegBoard data={data} picks={picks} x={Math.round(vw * PATH_MID)} y={L.pathPx - L.postH - L.boardFont * 2.6}
          font={Math.round(L.boardFont * 1.15)} />
      )}

      {/* ⚠️ ONE QUESTION REGION, AND THE HAND'S STATE ARRIVES IN IT. The order is the priority order:
          the verdict, then the miss, then anything blocking the gesture, then the question — so a
          child whose hand is out of frame is told that instead of re-reading a question they cannot
          currently answer, and a child whose hand is fine keeps the question. */}
      <Guide h={L.miloH} vw={vw} line={solved ? data.done : (miss ?? hint ?? data.ask)} />

      {/* Commit */}
      <div style={{ position: 'fixed', left: '3vw', bottom: '3.5%', zIndex: 46, display: 'flex', gap: 10 }}>
        <button onClick={commit} disabled={!canCommit || solved}
          style={{
            minHeight: btnH, padding: `0 ${Math.round(btnH * 0.5)}px`, borderRadius: 999,
            cursor: canCommit && !solved ? 'pointer' : 'default',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(btnH * 0.36),
            // ⚠️ IDENTICAL AT EVERY STATE. A commit button that changes when the pick becomes right
            // replaces the chapter with a hot/cold game — chapter 4's green Ready button, which the
            // founder caught. The only thing that varies is enabled-ness, i.e. "have you picked
            // anything yet", which gives nothing away.
            background: 'var(--milo-orange, #f26b2c)', color: '#fff',
            border: '4px solid var(--outline, #3d2516)', boxShadow: '0 5px 0 rgba(61,37,22,.22)',
            opacity: canCommit && !solved ? 1 : 0.5,
          }}>
          Warp her ✓
        </button>
        {picks.some(p => p != null) && !solved && (
          <button onClick={startOver}
            style={{
              minHeight: btnH, padding: `0 ${Math.round(btnH * 0.42)}px`, borderRadius: 999, cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: Math.round(btnH * 0.3),
              background: 'var(--paper, #fdf6e8)', color: 'var(--ink, #3d2516)',
              border: '3px solid var(--outline, #3d2516)',
            }}>
            Start over
          </button>
        )}
      </div>

      {/* An estimate is CONFIRMED after the commit, never before — the child's answer is the
          estimate, and the exact figure is what tells them it was close. */}
      {solved && data.qType === 'estimate' && (
        <div style={{
          position: 'fixed', left: Math.round(vw * PATH_MID), top: CHROME_PX + 8,
          transform: 'translateX(-50%)', zIndex: 47, pointerEvents: 'none',
          background: 'var(--paper, #fdf6e8)', border: '3px solid var(--garden-green, #4f8f2f)',
          borderRadius: 12, padding: '5px 14px', fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(12px,1.5vw,17px)', color: 'var(--ink, #3d2516)',
          animation: 'k_bounceIn .35s cubic-bezier(.34,1.56,.64,1) both',
        }}>
          The run measured {fmt(data.exact)} m — your {fmt(data.answer)} was close.
        </div>
      )}
    </>
  )
}

// ─── THE PLAN ───────────────────────────────────────────────────────────────────────────
/**
 * The chapter's problem and its rules, read aloud once before anything is worked, on the 12–18 band's
 * chalkboard. The BOARD is shared (`./chalkboard`); these words are not.
 *
 * ⚠️ THE THIRD POINT IS THE DEAD HEAT, AND IT IS HERE BECAUSE IT IS THE ONE READING A CHILD CANNOT
 * GET FROM THE PICTURE. 45 sits exactly on the halfway mark, so "which is nearer" has no visual
 * answer at all and the round is decided by a convention — and it is not rare, roughly one draw in
 * ten. chapter-craft's rule: find your boundary case and make sure it is TAUGHT somewhere, not only
 * graded.
 *
 * ⚠️ AND IT IS ON A CHARACTER BUDGET, MEASURED. The board caps at 92dvh with `overflow: hidden`, and
 * the first thing past the edge is the SKIP BUTTON — at 640×320 my first draft (422 chars) overflowed
 * by 15px and clipped "I've got it →" clean off, i.e. a dead control, which is the same fault this
 * repo already paid for by capping an intro card onto its own Start button. A scroll is NOT the fix
 * (it puts the button behind an undiscoverable scrollbar); shortening the words is. `PLAN_BUDGET` is
 * gated, because no check can see a clip.
 */
export const PLAN_PROBLEM = 'Astro is 47 m into the level, and the checkpoints only stand every 10. Which one do we warp her to?'
export const PLAN_POINTS = [
  'A warp can only drop her ON a checkpoint — she can never stand at 47.',
  'Find the two she sits BETWEEN, then the halfway mark between them.',
  'Past halfway, go UP. Not there yet, go DOWN. Exactly ON it, we go UP.',
]
/** Measured, not guessed: 340 fits 640×320 with the skip button whole; 422 clipped it. */
export const PLAN_BUDGET = 340

// ─── Demo / re-teach ────────────────────────────────────────────────────────────────────
/**
 * SELF-PACED, with `speak()` riding alongside — never `speakSteps`. TickTock's lesson hung for a
 * whole session because `speakSteps` reveals each visual from the utterance's `onstart`, and both
 * Chrome and Safari start the first line then silently drop the rest, freezing the teaching for ever
 * on a device that HAS a voice. The preview pane is mute, which is exactly what hid it.
 */
function dwellFor(line: string) { return Math.max(2200, Math.min(6200, line.length * 72)) }

/**
 * The quiet way out of the walkthrough, for a child who is already there.
 *
 * ⚠️ IT IS NOT A "NEXT" BUTTON, AND THE DIFFERENCE IS THE WHOLE RULE. The teaching still auto-rolls
 * — a nine-year-old presses whatever big control is offered and then meets a test nothing prepared
 * them for — so this is the SMALLEST thing on the screen and never the forward path. Same shape the
 * teen band ships as `I've got it →`.
 */

/**
 * ⚠️ `onSkip` IS OPTIONAL BECAUSE THIS COMPONENT IS THE RE-TEACH AS WELL AS THE DEMO, AND THE
 * RE-TEACH GETS NONE. A child who has just missed three in a row is exactly the one who must not be
 * handed a way past the explanation — so the chapter passes it from the `demo` phase and `beat.Reteach`
 * does not. Making it optional is what makes that a difference the call sites state rather than a flag
 * somebody has to remember to set.
 */
const LevelExplain: React.FC<{ data: LvRound; onDone: () => void; onSkip?: () => void }> = ({ data, onDone, onSkip }) => {
  const { w: vw, h: vh } = useViewport()
  const L = levelLayout(vw, vh, data.site.pathY)
  const [step, setStep] = useState(0)
  const doneRef = useRef(onDone); doneRef.current = onDone

  const m = data.m
  const n = data.legs[0]
  const low = Math.floor(n / m) * m, high = low + m, mid = low + m / 2
  const answer = data.rounded[0]
  const place = m === 100 ? 'gate' : 'checkpoint'
  /** Steps 0–2 walk the first leg; a two-leg round then moves the whole line onto the second. */
  const legShown = step >= 3 ? 1 : 0
  const shownN = data.legs[legShown]
  const shownAns = data.rounded[legShown]
  const checks = useMemo(() => checksFor(shownN, m), [shownN, m])
  const first = checks[0]
  const shownLow = Math.floor(shownN / m) * m
  const shownMid = shownLow + m / 2

  /**
   * ⚠️ A TWO-LEG ROUND HAS TO BE TAUGHT AS TWO LEGS AND AN ADDITION. This is the RE-TEACH as well as
   * the demo, so it fires exactly when a child has got three estimates wrong — and teaching only the
   * first rounding would leave the "then add them" half, which is the entire point of the type,
   * unsaid at the one moment it is needed. Found by forcing an estimate round on screen; no gate
   * would have shown it, because both halves are individually correct.
   */
  /**
   * ⚠️ LINE 0'S ONE-LEG BRANCH IS THE ONE THAT NAMES THE WORLD, AND IT IS ANSWER-FREE. It stays a
   * SIMILE whose halves are both true — the CHILD rounds a score in their head, and Milo rounds the
   * metre — and it names no checkpoint, because the reveal is step 2's job.
   *
   * ⚠️ WHERE IT ACTUALLY REACHES, counted rather than assumed: both DEMO rounds are single-leg, so
   * it plays TWICE straight after the briefing. But `estimate` rounds are always two-leg and take
   * the other branch, which carries no anchor — and this component is the RE-TEACH too, so a child
   * struggling on estimates never meets it again. That is a real gap, not a claim of coverage.
   *
   * ⚠️ DO NOT ADD, SPLIT, MERGE OR REORDER A LINE. The effect below hardcodes step indices
   * (i === 2 rolls the runner, i === 3 places it back for the second leg, i === 4 rolls it again) and
   * `legShown` flips at step >= 3, so a fourth line on a one-leg round would read `data.legs[1]`.
   * ⚠️ AND KEEP EACH RUN UNDER ~105 CHARACTERS. Milo's bubble reserves a HARD three lines
   * (`levelLayout`'s `bubbleH`), which at 640×320 is about 105 characters, and no gate can see an
   * overrun. The longest string already shipped is the dead-heat line below at 106 (reachable at
   * n = 950), with the round100 `ask` next at 100 — so the reserve is already at its edge.
   */
  const lines = useMemo(() => {
    const base = [
      data.legs.length > 1
        ? `Two runs to work out — ${fmt(n)} m, then ${fmt(data.legs[1])} m. Take them one at a time.`
        : `Astro needs ${fmt(n)} m, and there is no checkpoint there. We can only warp her to one.`,
      `${fmt(n)} sits between the ${fmt(low)} ${place} and the ${fmt(high)} one. The halfway mark is at ${fmt(mid)}.`,
      n === mid
        ? `${fmt(n)} is exactly ON the halfway mark — a dead heat. When that happens we always go UP. So that leg is ${fmt(answer)}.`
        : n > mid
          ? `${fmt(n)} is past ${fmt(mid)}, so ${fmt(high)} is nearer. That leg is ${fmt(answer)}.`
          : `${fmt(n)} has not reached ${fmt(mid)}, so ${fmt(low)} is nearer. That leg is ${fmt(answer)}.`,
    ]
    if (data.legs.length === 1) return base
    const b = data.legs[1], rb = data.rounded[1]
    return [...base,
      `Now the second leg. ${fmt(b)} m rounds the same way — to ${fmt(rb)}.`,
      `Then add the two rounded legs: ${fmt(answer)} plus ${fmt(rb)} is about ${fmt(data.answer)} m for the whole run.`,
    ]
  }, [data, n, low, high, mid, answer, place])

  /**
   * THE WRITTEN WORKING — one terse line per spoken line, on the 12–18 band's step board. The bubble
   * keeps the narration; the board keeps the maths, so the two are not two copies of one string.
   *
   * ⚠️ INDEX-ALIGNED WITH `lines`, so the same step-index guard applies: do not add, split or reorder
   * one without the other. `''` means that beat writes nothing.
   * ⚠️ AND UNDER ~22 CHARACTERS. The board is `whiteSpace: nowrap` inside `min(vw*0.44, 420)`, which
   * at 640×320 is 281px of 14px chalk — about 26 characters before it clips silently, and no gate can
   * see a clip. Plain ASCII only: `--font-chalk` is Gaegu, and an arrow glyph renders as tofu in it.
   */
  const boards = useMemo(() => {
    const base = [
      data.legs.length > 1 ? `${fmt(n)} m, then ${fmt(data.legs[1])} m` : `Needs ${fmt(n)} m`,
      `${fmt(low)} to ${fmt(high)}, half ${fmt(mid)}`,
      n === mid ? `${fmt(n)} is half: go up` : `${fmt(n)} ${n > mid ? 'past' : 'under'} ${fmt(mid)} = ${fmt(answer)}`,
    ]
    if (data.legs.length === 1) return base
    return [...base,
      `${fmt(data.legs[1])} rounds to ${fmt(data.rounded[1])}`,
      `${fmt(answer)} + ${fmt(data.rounded[1])} = ${fmt(data.answer)}`,
    ]
  }, [data, n, low, high, mid, answer, place])

  const [runnerX, setRunnerX] = useState(() => L.homeX)
  const [warps, setWarps] = useState(0)

  useEffect(() => {
    let alive = true
    const timers: number[] = []
    let i = 0
    const run = () => {
      if (!alive) return
      setStep(i)
      speak(lines[i])
      // Derive the target from `checksFor` here rather than from the reactive `first`, which the
      // effect captured at mount and which changes under it when the line moves to the second leg.
      if (i === 2 || (i === 4 && data.legs.length > 1)) {
        const leg = i === 2 ? 0 : 1
        const st = checksFor(data.legs[leg], m)
        setRunnerX(L.xOf(data.rounded[leg], st[0], m))
        setWarps(w => w + 1)          // she WARPS in the demo too, for the same reason she does in play
      }
      // A new leg is a new picture, so Astro is PLACED back at the start rather than travelling
      // there — a placement is not a journey, and animating it would read as her running backwards.
      if (i === 3) { setRunnerX(L.homeX) }
      const t = window.setTimeout(() => {
        i++
        if (i < lines.length) run()
        else window.setTimeout(() => alive && doneRef.current(), 1500)
      }, dwellFor(lines[i]))
      timers.push(t)
    }
    run()
    return () => { alive = false; timers.forEach(window.clearTimeout) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden' }}>
        <img src={data.site.scene} alt="" draggable={false} decoding="async"
          onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      {checks.map((v, i) => (
        <CheckPost key={`${legShown}:${v}`} value={v} x={L.checkX(i)} pathPx={L.pathPx} h={L.postH} font={L.boardFont}
          state={(legShown === 0 ? step >= 2 : step >= 4) && v === shownAns ? 'served' : 'idle'} />
      ))}
      {(legShown === 0 ? step >= 1 : true) && (
        <HalfwayPost x={L.xOf(shownMid, first, m)} pathPx={L.pathPx} h={L.halfStalkH} font={L.boardFont} value={shownMid} />
      )}
      <DistMarker x={L.xOf(shownN, first, m)} pathPx={L.pathPx} font={L.boardFont} value={shownN} />
      {/* ⚠️ THE WORKING GOES ON THE CHALKBOARD, AND `LegBoard` IS GONE FROM THE DEMO BECAUSE OF IT.
          Its whole job here was to show the two rounded legs adding up — which is now the board's last
          line, so the two were two surfaces saying one thing, and in this band they collide: the leg
          board hangs just above the name boards at `PATH_MID` and the step board fills the same strip.
          It stays in PLAY, where it is the child's OWN work accumulating rather than a restatement.
          ⚠️ AND IT HANGS FROM THE CHROME, NOT THE FLOOR — measured, the band below this chapter's
          painted path is 66/148/119px at 640×320 / 1024×620 / 1920×800 against a board 68/152/152px
          tall, so the Fundraiser's bottom anchor does not fit at three of five sizes and forcing it
          would cover the path, which here IS the number line. The chrome→boards strip is 84px at the
          worst size. */}
      <StepBoard lines={boards.slice(0, step + 1).filter(Boolean)} vw={vw} vh={vh}
        anchorTop={CHROME_PX + 6} />
      <div style={{
        position: 'fixed', left: runnerX, top: L.pathPx,
        transform: 'translate(-50%,-100%)', zIndex: 34, pointerEvents: 'none',
      }}>
        <Runner h={L.runnerH} moving={false} ring={warps || null} />
      </div>
      <Guide h={L.miloH} vw={vw} line={lines[step]} />
      {/* ⚠️ TOP-RIGHT, WHICH IS FREE HERE AND ONLY HERE. Milo and his bubble own the bottom right, the
          menu chip owns the top left, and the name boards start well below — and SkillBeat's own round
          counter, which owns this corner during a played round, is not drawn in the demo because the
          demo renders OUTSIDE SkillBeat. The re-teach IS inside it, and gets no chip at all, so the
          two can never want this corner at the same time. */}
      {onSkip && <GotIt onSkip={onSkip} style={{ position: 'fixed', right: 12, top: 10, zIndex: 60 }} />}
    </>
  )
}

// ─── Beat ───────────────────────────────────────────────────────────────────────────────
export function makeBeat(): Beat<LvRound> {
  return {
    skillId: 'rounding', rounds: 10,
    make: (d, round, asked) => makeRound((d || 1) as 1 | 2 | 3, round ?? 0, asked ?? []),
    // The MATH only. Include the scene and the same question comes back the moment the dressing
    // changes, which is exactly what the rotating backdrop would otherwise buy.
    sig: d => `${d.qType}|${d.legs.join(',')}|${d.m}`,
    // Every question type must be asked before mastery may end the run — a strong child is otherwise
    // asked ~3 at L1, ONE at L2 and TWO at L3, so `estimate` would simply never come up.
    coverage: { of: d => d.qType, all: Q_ALL },
    // The chapter writes its own miss line at Milo's mouth, so the shared centred pill would land on
    // the line and contradict it.
    ownsFeedback: true,
    // Empty → SkillBeat draws no pill. Milo's bubble is the only question region.
    prompt: () => '',
    say: d => d.ask,
    Play: ({ data, onSubmit }) => <LevelPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <LevelExplain data={data} onDone={onDone} />,
  }
}

// ─── The chapter ────────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'plan' | 'demo' | 'guided' | 'practice'

/** The camera panel's palette — this is a painted band, not the neon lab, so it borrows the
 *  chapter's own paper and ink rather than a dark surface. */
const SKIN: HandSkin = {
  accent: '#f26b2c', accentSoft: 'rgba(242,107,44,.5)', ink: '#3d2516', muted: '#7a6a55',
  panel: '#fdf6e8', line: 'rgba(61,37,22,.25)', onAccent: '#ffffff',
  font: 'var(--font-display)', mono: 'var(--font-display)',
}

export default function LevelRun({ onFinish, onExit }: {
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const [served, setServed] = useState<number[]>([])     // the cumulative arc — OUTSIDE SkillBeat
  const needsRotate = useNeedsRotate()
  const { w: vw } = useViewport()
  const { exit, tally } = useChapterShell(onFinish, onExit)
  /**
   * ⚠️ THE RUN STRIP WAS A CHEAT SHEET, AND IT TOOK A MEASUREMENT TO SEE IT. `SkillBeat` fires
   * `onRound` when a round LOADS, not when it is answered — so pushing that round's answer straight
   * onto the strip printed the answer to the question the child was still looking at. Measured live
   * on round 2 (km 26): the strip already read "20 30" with 30 the answer they had not given yet.
   * The pending answer is held back one round, so the strip only ever shows the run SO FAR — which
   * is what it claims to be, and the last round's site simply never joins it.
   */
  const pendingStop = useRef<number | null>(null)

  const beat = useMemo(() => makeBeat(), [])

  // Deterministic, and the two demos come out as DIFFERENT types by construction: `asked` drives the
  // generator's unmet-first branch, so slot 0 is round10 and slot 1 is round100.
  const DEMO = useMemo(() => [makeRound(1, 0, []), makeRound(2, 1, ['round10'])], [])
  const GUIDED = useMemo(() => makeRound(1, 2, ['round10', 'round100']), [])

  /** ⚠️ A WHITE crosshair, not the chapter's ink brown — it has to read against whatever room the
   *  child is sitting in. (Hidden outright in full-screen mode; see `CamView`.) */
  const marker = useMemo(() => ({ fill: '#f26b2c', ink: '#ffffff' }), [])
  /**
   * ⚠️ `pinch` RATHER THAN `slide`, WHICH IS THE WHOLE CHANGE. It reports the same `palm` position the
   * slide did, plus the two things a carry needs and a slide has no use for: whether the hand is
   * CLOSED, and a monotone count of closes for the held-over guard. Nothing in the detector layer had
   * to be written — The Fundraiser already turned this reading from a thumb-and-index pinch into a
   * whole-hand fist on the founder's earlier call, which is exactly the pose he asked for here.
   */
  const hand = useHandInput({ reads: 'pinch', marker })

  // ⚠️ Below every hook. An early return above one changes the hook count when the phone turns and
  // React tears the chapter into the error boundary — this crashed a 6–8 chapter the first time.
  if (needsRotate) return <RotateGate line="The level runs left to right — turn your screen sideways to see all of it! 🎮" />

  const onCam = hand.input === 'hand'
  /**
   * ⚠️ ONLY WHERE THE CHILD ANSWERS, not merely past the intro. `CamGate` is a full-screen panel, so
   * gating it on "not intro" drops a permission prompt over both walkthroughs — the teaching covered
   * by a dialog for a gesture that is not wanted yet.
   */
  const inWorld = phase === 'guided' || phase === 'practice'

  return (
    <HandProvider value={{ read: hand.read, input: hand.input }}>
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#9fae9a' }}>
      <style>{CRITTER_CSS}{CHALK_CSS}{LEVEL_CSS}</style>

      {/* ⚠️ MOUNTED FROM THE MOMENT THE CHILD ANSWERS AND MERELY HIDDEN UNTIL READY — the detect loop
          reads this element's own box, and an unmounted one measures 0×0. Full-screen: the hand is a
          cursor across the whole line, so the child looks at ONE place instead of glancing between
          their hand in a corner and the checkpoints in the middle. */}
      {inWorld && onCam && (
        <CamView videoRef={hand.videoRef} canvasRef={hand.canvasRef} w={vw} full
          skin={SKIN} hidden={!hand.camReady} />
      )}
      {inWorld && onCam && !hand.camReady && (
        <CamGate status={hand.status} error={hand.error} skin={SKIN}
          onTaps={hand.useTaps} onRetry={hand.useCamera} onExit={exit}
          denied="Milo can watch you pick Astro up and stand her on a checkpoint, or you can tap the checkpoint instead — both set the same answer." />
      )}

      <button onClick={exit}
        style={{
          position: 'fixed', left: 12, top: 10, zIndex: 60, padding: '7px 14px', borderRadius: 999,
          background: 'var(--paper, #fdf6e8)', border: '3px solid var(--milo-orange, #f26b2c)',
          color: 'var(--milo-orange, #f26b2c)', fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 13, cursor: 'pointer',
        }}>← Menu</button>

      {/* The run so far — the cumulative arc. It lives OUT here because anything drawn inside a round
          is rebuilt by SkillBeat every round and can never accumulate.
          ⚠️ LEFT, under the Menu chip — NOT the right corner, which SkillBeat's own round counter
          owns. LoadingBay shipped a manifest there and the two badges overlapped by 34 of 40px. */}
      {served.length > 0 && phase === 'practice' && (
        <div style={{
          position: 'fixed', left: 12, top: 46, zIndex: 55, display: 'flex', flexWrap: 'wrap',
          gap: 5, maxWidth: '38vw', pointerEvents: 'none',
        }}>
          {served.map((v, i) => (
            <span key={i} style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11,
              background: 'rgba(253,246,232,.92)', border: '2px solid var(--outline, #3d2516)',
              borderRadius: 999, padding: '1px 7px', color: 'var(--ink, #3d2516)',
            }}>{fmt(v)}</span>
          ))}
        </div>
      )}

      {phase === 'intro' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '4vw',
          background: `linear-gradient(rgba(28,34,26,.55), rgba(28,34,26,.55)), url(${CAVERN}) center/cover`,
        }}>
          <div style={{
            maxWidth: 520, background: 'var(--paper, #fdf6e8)', border: '4px solid var(--outline, #3d2516)',
            borderRadius: 20, padding: '22px 26px', textAlign: 'center', boxShadow: '0 8px 0 rgba(61,37,22,.2)',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(22px,3.4vw,34px)', color: 'var(--ink, #3d2516)' }}>
              The Long Level 🎮
            </div>
            {/* ⚠️ THE WORLD IS NOW THE ANCHOR, SO THE BRIEFING GOT SHORTER RATHER THAN LONGER — and
                that is the whole gain from the founder's world swap. The rail version had to BRIDGE
                from something daily (a scoreboard: "you are 47 points behind, you think about 50") to
                something nobody in this band has done (a branch-line train), and it carried a careful
                warning that the two are not equivalent — a scoreboard still reads 47, only the
                player's head rounds, while the rail line is a physical necessity. A game level needs
                no bridge: the daily thing and the world are the SAME thing, and the physics survives
                intact because you can only land ON a checkpoint. One paragraph instead of two, and
                nothing is being claimed that the screen does not show.
                ⚠️ It is still WARPING and not respawning — see the header. "You go back to the
                nearest checkpoint" is the one sentence here a child would know to be false. */}
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(14px,1.7vw,19px)', color: 'var(--ink, #3d2516)', lineHeight: 1.45 }}>
              Astro is deep in the level and needs to reach 47 m — but there is no checkpoint at 47,
              and a warp can only drop her ON one. Work out which checkpoint is nearest, and she runs
              the last bit herself.
              {onCam ? ' Close your fist on Astro to pick her up, carry her along the path, and open your hand on the checkpoint you pick.' : ''}
            </p>
            {/* ⚠️ BOTH DOORS, EVERY TIME — the device's last pick decides which is the BIG button,
                never which is the only one. Without the second one a child who once tapped "Tap
                instead" is on taps for ever, because `CamGate` renders only on the CAMERA path and
                nothing else in the chapter ever offers the camera back. The Fundraiser shipped
                exactly that and the founder simply never saw the camera again.
                ⚠️ And the primary button calls `useCamera()`, or the camera path opens straight onto
                "the camera did not start" — nothing else in here ever calls `start()`. */}
            <button onClick={() => { unlockSpeech(); if (onCam) hand.useCamera(); setPhase('plan') }}
              style={{
                marginTop: 6, padding: '12px 26px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(15px,1.9vw,21px)',
                background: 'var(--milo-orange, #f26b2c)', color: '#fff',
                border: '4px solid var(--outline, #3d2516)', boxShadow: '0 5px 0 rgba(61,37,22,.22)',
              }}>{onCam ? 'Turn on the camera ▶' : 'Take the warp controls'}</button>
            <div>
              <button onClick={() => { unlockSpeech(); if (onCam) hand.useTaps(); else hand.useCamera(); setPhase('plan') }}
                style={{
                  marginTop: 12, border: 'none', background: 'transparent', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#7a6a55',
                  textDecoration: 'underline',
                }}>
                {onCam ? 'Tap the checkpoints instead' : 'Pick her up with your hand and the camera'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ THE PLAN — the 12–18 band's read-along board, stating the chapter's problem and its three
          rules before anything is worked. Skipping it lands on the walkthrough, not on the questions:
          `GotIt` is the smallest thing on the screen and is never the forward path. */}
      {phase === 'plan' && (
        <ThePlan problem={PLAN_PROBLEM} points={PLAN_POINTS}
          onDone={() => setPhase('demo')} onSkip={() => setPhase('demo')} />
      )}

      {/* ⚠️ IT STILL AUTO-ROLLS — the skip is offered, never taken for the child. And it skips the
          WHOLE walkthrough rather than one beat: a per-beat "next" is a forward path wearing a
          different label, which is the thing the auto-roll exists to prevent. */}
      {phase === 'demo' && (
        <LevelExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }}
          onSkip={() => setPhase('guided')} />
      )}

      {phase === 'guided' && (
        <LevelPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
      )}

      {phase === 'practice' && (
        <SkillBeat beat={beat}
          onRound={(data) => {
            if (pendingStop.current != null) { const v = pendingStop.current; setServed(s => [...s, v]) }
            pendingStop.current = (data as LvRound).answer
          }}
          onComplete={tally} />
      )}
    </div>
    </HandProvider>
  )
}
