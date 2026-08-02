'use client'
/**
 * Chapter (9–11) — ROUNDING to the nearest 10 / 100 and ESTIMATING a sum (skill `rounding`) —
 * THE RAIL LINE.
 *
 * Replaces RoundingTrail, which was the pre-teen "Number Lab" HUD. See docs/story-9-11-rethink.md §2
 * for the band-wide audit. Three faults this file exists to fix, and all three were live:
 *
 *  ① NOTHING ON SCREEN WANTED A ROUNDED NUMBER, so rounding read as a rule rather than a tool. Here
 *    the rounded number is the only one you can ACT ON: a train cannot stop between stations, so
 *    "the nearest 10" is not a convention, it is the nearest place the train can actually pull in.
 *  ② IT WAS A COIN FLIP. The old line drew the two bracketing stops and asked which was nearer —
 *    50%, and the two extra chips sat outside the bracket, so a child who knew only that 47 is
 *    "in the forties" still had a two-way guess. That is the same defect the rethink doc flags in
 *    FactorLab and AngleScope. THE LINE NOW CARRIES SIX STATIONS (see STATIONS): the child must
 *    first work out which two the number falls between — which is place value — and only then which
 *    is nearer. 16.7%, and the first half of the skill is assessed instead of given.
 *  ③ ALIVENESS 0 OF 4. Nothing arrived, a tap lit a chip, `<PtMilo left={9} />` was a sticker, one
 *    backdrop served all ten rounds.
 *
 * THE STORY — §0a's second half, *who wants this and why*. Milo is the signalman. A train runs in
 * along the line with a passenger aboard who needs kilometre 47. There is no platform at 47. Milo
 * has to set the signal for a STATION, and the passenger walks the rest. Get it right and the train
 * pulls in and the passenger steps off and goes on their way; get it wrong and the signal stays up.
 *
 * ⚠️ THE TRACK IS THE NUMBER LINE, AND IT IS PAINTED INTO THE BACKDROP RATHER THAN DRAWN OVER IT.
 * All three scenes were generated with one straight track running the full width of the lower third,
 * so the axis a rounding chapter needs is part of the picture instead of a neon rule laid on top of
 * it — which is the "a solid shape over a painted scene reads as UI furniture" fault BlockYard paid
 * for three times. Only the station posts, the marker and the halfway post are drawn in code.
 *
 * THE GESTURE — one control, three questions, one grader. Every round is a list of LEGS, each of
 * which is rounded to the same place by tapping a station:
 *   • `round10`  — one leg, m = 10.  "Kilometre 47 — which halt?"
 *   • `round100` — one leg, m = 100. "The express only calls at main stations."
 *   • `estimate` — TWO legs, m = 10, and the board adds the two rounded values as they are picked.
 *     "Round each one first, then add" is therefore performed rather than recited, and it cannot be
 *     guessed: both picks have to be right for the total to be.
 * `answer` is the SUM of the rounded legs, which for a one-leg round is just the rounding — so the
 * three types share one code path and one commit check.
 *
 * ⚠️ THE MARKER IS A SCAFFOLD AND IT FADES BY TIER. At L1 the number's true position is pegged on
 * the line before the commit, so the child can SEE 47 sitting past halfway — the concrete stage.
 * From L2 it is hidden until after the commit, so the answer has to come from the digits and the
 * line confirms it rather than giving it away. Same call TickTock makes with its minute ring, and
 * the same reason: a scaffold left up for ever is never in the child's head.
 *
 * ⚠️ A WRONG ANSWER REVEALS THE HALFWAY POST, NEVER THE MARKER. The halfway post teaches the rule
 * that was missed; the marker would hand over the answer on the retry.
 *
 * ⚠️ STATED RATHER THAN HIDDEN: `round100` and `estimate` cannot be drawn at L1, so a child who
 * never leaves L1 never completes `coverage` and never gets the mastery early exit. Harmless — they
 * still finish at ten rounds, and mastery needs the top tier anyway. It is the same bounded cost
 * TickTock records.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { Arrive, SheetCell, CRITTER_CSS, inFlowJourney } from './critters'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { rint } from '@/core/rand'

// ─── The line: ten runs ─────────────────────────────────────────────────────────────────
/**
 * `trackY` is where the RAILS sit IN THE PAINTING, as a share of the IMAGE's height — read off each
 * scene rather than shared, which is the craft doc's oldest recurring fault. The train's wheels land
 * on it; the station posts stand just behind it; the marker pegs the ground just in front.
 *
 * ⚠️ A SHARE OF THE IMAGE IS NOT A SHARE OF THE VIEWPORT, AND TREATING IT AS ONE FLOATS EVERYTHING.
 * The backdrop is drawn `object-fit: cover`, so on any frame whose aspect differs from the image's
 * 1.79 the picture is cropped and the painted rail moves. Measured on a 2000×970 window: cover
 * scales the scene to 1116px tall and crops 73px off each end, putting the rail at y ≈ 820 — while
 * `trackY * vh` says 776. **The train sat 44px above the rail, in mid-air**, which is exactly what
 * the founder saw. It reads as correct at 1280×720 only because that frame's aspect happens to match
 * the art's. `railLayout` maps through the real cover transform; CoinShop's `fitFor` paid for this
 * same lesson and this chapter did not apply it.
 */
export interface Stop { scene: string; label: string; trackY: number }

/** Every rail scene is generated at this size; the cover-fit maths below depends on it. */
export const IMG_W = 1376
export const IMG_H = 768

const HALT = '/assets/backgrounds/rail_halt.png'
const JUNCTION = '/assets/backgrounds/rail_junction.png'
const COAST = '/assets/backgrounds/rail_coast.png'

/**
 * Ten slots, indexed STRAIGHT and never modulo — a plan read `PLAN[round % len]` is how three
 * chapters in this repo quietly re-showed the scene they opened with. Consecutive rounds always
 * change scene, so the place moves as well as the numbers.
 */
export const LINE: Stop[] = [
  { scene: JUNCTION, label: 'the junction', trackY: 0.785 },
  { scene: COAST, label: 'the coast line', trackY: 0.800 },
  { scene: HALT, label: 'the country halt', trackY: 0.775 },
  { scene: JUNCTION, label: 'the junction', trackY: 0.785 },
  { scene: COAST, label: 'the coast line', trackY: 0.800 },
  { scene: HALT, label: 'the country halt', trackY: 0.775 },
  { scene: JUNCTION, label: 'the junction', trackY: 0.785 },
  { scene: COAST, label: 'the coast line', trackY: 0.800 },
  { scene: HALT, label: 'the country halt', trackY: 0.775 },
  { scene: JUNCTION, label: 'the junction', trackY: 0.785 },
]
export const stopAt = (round: number) => LINE[Math.min(round, LINE.length - 1)]

// ─── The question ───────────────────────────────────────────────────────────────────────
const pick = <T,>(a: readonly T[]) => a[rint(0, a.length - 1)]
const fmt = (n: number) => n.toLocaleString('en-US')

export function roundTo(n: number, m: number): number { return Math.floor(n / m + 0.5) * m }

export type QType = 'round10' | 'round100' | 'estimate'
export const Q_ALL: readonly QType[] = ['round10', 'round100', 'estimate'] as const

export interface RlRound {
  qType: QType
  stop: Stop
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
 * ⚠️ HOW MANY STATIONS THE LINE SHOWS, AND WHY IT IS NOT TWO. Two is the bracket, and drawing the
 * bracket for the child hands over the half of rounding that is actually place value ("which ten is
 * 47 in?"), leaving a coin flip. Six is enough to make finding the bracket real work and still fits
 * a 640px frame with a readable board on every post.
 */
export const STATIONS = 6

/**
 * The six stations for one leg. Both bracketing multiples are always present, and WHERE the answer
 * sits varies with the number — pinned to the middle, a child would simply tap the middle post.
 */
export function stationsFor(n: number, m: number): number[] {
  const low = Math.floor(n / m) * m
  const before = n % 4                                  // 0..3, so the answer's index moves
  const first = Math.max(0, low - before * m)
  return Array.from({ length: STATIONS }, (_, i) => first + i * m)
}

export function makeRound(d: 1 | 2 | 3, round = 0, asked: readonly string[] = []): RlRound {
  const stop = stopAt(round)
  const pool: QType[] = d === 1 ? ['round10'] : d === 2 ? ['round10', 'round100', 'round10'] : ['round100', 'estimate', 'round10']
  // Deliberate ONLY while a gap exists, random once it closes: hardest-first for ever would lock the
  // generator onto one type and destroy the variety the coverage gate exists to protect.
  const unmet = Q_ALL.filter(q => !asked.includes(q))
  const t: QType = unmet.length ? (unmet.find(q => pool.includes(q)) ?? pool[0]) : pick(pool)

  if (t === 'estimate') {
    // ⚠️ Neither leg may already sit ON a station, for the same reason a single rounding may not:
    // "round 20 to the nearest 10" is answered by finding the board that matches the number, which
    // is reading, not rounding. The guard was on the single-leg branch only and the gate caught it.
    const leg = () => { const v = rint(11, 89); return v % 10 === 0 ? v + 1 : v }
    const a = leg(), b = leg()
    const rounded = [roundTo(a, 10), roundTo(b, 10)]
    return {
      qType: t, stop, d, legs: [a, b], m: 10, rounded,
      answer: rounded[0] + rounded[1], exact: a + b,
      ask: `Two legs today — ${a} km, then ${b} km. Round each one to a halt, and the board adds them up.`,
      done: `About ${rounded[0] + rounded[1]} km.`,
    }
  }
  const m = t === 'round100' ? 100 : 10
  // ⚠️ Never a multiple of m: "round 40 to the nearest 10" is not a question, and it would let a
  // child who has understood nothing tap the post whose board matches the number on the docket.
  let n = m === 100 ? rint(120, 980) : rint(11, d === 1 ? 89 : 189)
  if (n % m === 0) n += 1
  const answer = roundTo(n, m)
  return {
    qType: t, stop, d, legs: [n], m, rounded: [answer], answer, exact: n,
    ask: m === 100
      ? `The express only calls at main stations. Our passenger wants kilometre ${fmt(n)} — which one do I stop at?`
      : `A passenger for kilometre ${n}. There is no platform at ${n} — which halt do I stop at?`,
    done: m === 100 ? `Main station ${fmt(answer)}. Signal set.` : `The ${answer} halt. Signal set.`,
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
export function gradePicks(data: RlRound, picks: readonly (number | null)[]): { ok: boolean; badLeg: number } {
  const badLeg = data.rounded.findIndex((r, i) => picks[i] !== r)
  return { ok: badLeg < 0, badLeg }
}

/** The written miss line. Specific to WHICH mistake was made, and it never names the answer. */
export function missFor(data: RlRound, leg: number, picked: number): string {
  const n = data.legs[leg], m = data.m
  const low = Math.floor(n / m) * m, high = low + m, mid = low + m / 2
  if (picked !== low && picked !== high) {
    return `That one is further down the line — ${fmt(n)} sits between ${fmt(low)} and ${fmt(high)}.`
  }
  // ⚠️ THE EXACT-HALFWAY CASE NEEDS ITS OWN WORDING, and it is not rare: 15, 25, 250, 350 are all
  // legal draws. "15 is PAST 15" is simply false, and it is the one reading a child cannot work out
  // from the picture — the marker sits dead on the post — so it is the one that has to be STATED.
  if (n === mid) return `${fmt(n)} sits exactly ON the halfway post. When it is a dead heat we always go UP to the next one.`
  return n > mid
    ? `Look at the halfway post at ${fmt(mid)} — ${fmt(n)} is PAST it. So which way is nearer?`
    : `Look at the halfway post at ${fmt(mid)} — ${fmt(n)} has not reached it yet. So which way is nearer?`
}

// ─── Layout ─────────────────────────────────────────────────────────────────────────────
/**
 * Exported so the invariant sweep drives the SAME function the scene renders from. A check that
 * re-implements this chain agrees with its own copy of the constants while the screen it is meant to
 * protect falls apart — this repo has shipped that twice.
 */
export interface RailLayout {
  trackPx: number
  left0: number
  postGap: number
  /** Screen x of any VALUE on the line, station or not — so the marker, the halfway post and the
   *  posts themselves cannot drift apart. */
  xOf: (v: number, first: number, m: number) => number
  stationX: (i: number) => number
  /** Where the train waits before the signal is set. Exported so the demo and the played round
   *  cannot disagree about it, and so a sweep can assert it stays on screen. */
  homeX: number
  postH: number
  boardFont: number
  /** The board's own height, and the top of the band Milo's bubble can reach — exported so the
   *  sweep can assert the two never meet rather than re-deriving either. */
  boardH: number
  bubbleTop: number
  /** How far above the rail the halfway post's label sits — just clear of the train's roof, so the
   *  hint a wrong answer turns on can never be hidden by the engine standing in front of it. */
  halfStalkH: number
  miloH: number
  trainH: number
  passH: number
}
export const CHROME_PX = 46
/** The stations own the LEFT of the frame; Milo and his bubble own the right, so the train always
 *  travels left→right and never has to be dragged back through the line being read. */
export const RAIL_SHARE = 0.72
export const RAIL_MID = 0.40
export const MILO_X = 0.88
/**
 * ⚠️ THE LOCOMOTIVE IS THE BIGGER OF THE TWO, AND IT WAS NOT. Milo was 0.30 of the height and the
 * train 0.155 — so a branch-line engine stood half the height of a pony and read as a toy on a
 * shelf rather than as the thing the whole chapter is about. Founder's catch. A tank engine really
 * is taller than a pony, and both stand at much the same depth here (he is beside the track, not in
 * the far foreground), so the sizes are simply swapped in rank.
 */
const MILO_SHARE = 0.24
const TRAIN_SHARE = 0.28
/** MEASURED off the cutout's own ink box (1232 × 410), not guessed. */
export const TRAIN_ASPECT = 3.0
const PASS_SHARE = 0.155

export function railLayout(vw: number, vh: number, trackY: number): RailLayout {
  /**
   * Where the painted rail actually lands, through the backdrop's own `object-fit: cover` transform.
   * `trackY` is a share of the IMAGE; this converts it to a share of the SCREEN.
   */
  const fit = Math.max(vw / IMG_W, vh / IMG_H)
  const drawnH = IMG_H * fit
  const rawTrack = (vh - drawnH) / 2 + trackY * drawnH
  const railW = vw * RAIL_SHARE
  const postGap = railW / (STATIONS - 1)
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
  const bubbleFont = Math.max(13, Math.min(vw * 0.015, 18))
  const bubbleH = Math.round(bubbleFont * 1.35 * 3 + 24)          // three lines is the worst wrap
  const bubbleTop = vh - Math.round(vh * MILO_SHARE * 0.86) - bubbleH
  // 0.22 rather than 0.30: the widest label the chapter can draw is five characters ("1,400"), and
  // at 0.30 six of those touch on a 640px frame.
  const boardFont = Math.round(Math.max(11, Math.min(postGap * 0.22, 34)))
  const boardH = Math.round(boardFont * 1.75)
  // The first board is centred on the first station, so the span has to start at least half a board
  // in or it sits flush against the frame edge — measured at 640×320 it began at x = 1.
  const left0 = Math.max(Math.round(boardFont * 2.1 + 6), Math.round(vw * RAIL_MID - railW / 2))
  const trainH = Math.round(vh * TRAIN_SHARE)
  /** The halfway post's own label, which has to live between the boards and the train's roof. */
  const halfLabelH = Math.round(boardFont * 1.3)
  /**
   * The km marker hangs BELOW the rail, so the rail cannot sit so low that the marker leaves the
   * frame. Clamped rather than re-designed: a few pixels of float on the shortest frame is a far
   * smaller fault than an answer cue cut off by the bottom edge.
   */
  const markerH = Math.round(boardFont * 2.65)
  const trackPx = Math.round(Math.min(rawTrack, vh - markerH - 8))
  /**
   * ⚠️ THE POSTS MUST OUT-REACH THE TRAIN, or the train hides the things it is standing among. With
   * the engine at its new size it is tall enough to cover both a name board and the halfway post —
   * and the halfway post is the hint a wrong answer turns on, so losing it behind the train would
   * make the one piece of help unreadable. The stack from the rail upward is therefore:
   * train roof → the halfway label → the name boards → the chrome, each clearing the last.
   */
  const postH = Math.round(Math.max(40, Math.min(
    trackPx - CHROME_PX - boardH - 6,                              // never into the chrome
    Math.max(
      trainH + 8 + halfLabelH + 8,                                 // above the train AND the hint
      trackPx - bubbleTop,                                         // above Milo's bubble
    ),
  )))
  /**
   * ⚠️ THE WAITING TRAIN HAS TO BE ON SCREEN. Parked one gap left of the first station it came out
   * at x = −50 on a 1280 frame — so the train AND the passenger riding it were both off-frame for
   * the whole time the child was deciding, and the round's one piece of standing scenery did not
   * exist until it moved. It parks against the left edge instead.
   *
   * It then stands in front of the first post or two, and that is fine rather than a compromise:
   * the boards live ABOVE the track (measured 362–421 against the train's 453–565 at 1280×720) so
   * they never overlap, and a locomotive standing in front of a post is what a station looks like.
   */
  const homeX = Math.round(Math.max(trainH * TRAIN_ASPECT * 0.55, left0 - postGap * 0.55))
  return {
    trackPx, left0, postGap, homeX,
    xOf: (v, first, m) => left0 + ((v - first) / m) * postGap,
    stationX: (i) => left0 + i * postGap,
    postH, boardFont, boardH, bubbleTop, halfStalkH: trainH + 8,
    miloH: Math.round(vh * MILO_SHARE),
    trainH,
    passH: Math.round(vh * PASS_SHARE),
  }
}

// ─── A station: a post on the line, and the only thing that can be answered with ─────────
function StationPost({ value, x, trackPx, h, font, state, onTap }: {
  value: number; x: number; trackPx: number; h: number; font: number
  state: 'idle' | 'chosen' | 'served' | 'dim'; onTap?: () => void
}) {
  const chosen = state === 'chosen', served = state === 'served'
  return (
    <div
      onClick={onTap}
      style={{
        position: 'fixed', left: x, top: trackPx, transform: 'translate(-50%,-100%)',
        zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center',
        cursor: onTap ? 'pointer' : 'default', pointerEvents: onTap ? 'auto' : 'none',
        opacity: state === 'dim' ? 0.5 : 1, transition: 'opacity .25s ease',
        // A finger has to be able to hit it, whatever the frame does to the post.
        minWidth: 44, paddingLeft: 6, paddingRight: 6,
      }}>
      {/* The name board — a station's name here IS its kilometre. */}
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: font, lineHeight: 1.15,
        color: 'var(--ink, #3d2516)', background: served ? 'var(--garden-green, #8fbf6a)' : 'var(--paper, #fdf6e8)',
        border: `3px solid ${chosen ? 'var(--garden-green, #4f8f2f)' : 'var(--outline, #3d2516)'}`,
        boxShadow: chosen ? '0 0 0 4px rgba(79,143,47,.35), 0 3px 0 rgba(61,37,22,.18)' : '0 3px 0 rgba(61,37,22,.18)',
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
 * The halfway post — smaller than a station, and the thing a miss line points at.
 *
 * ⚠️ ITS STALK IS SIZED TO CLEAR THE TRAIN, not picked as a fraction of the station post. At a
 * fraction the label sat inside the engine's own band and the parked train covered it — measured on
 * the founder's screenshot, "halfway 550" was readable only as "fw…y 50" behind the locomotive. It
 * is the single piece of help a wrong answer turns on, so it is the one thing that may not be hidden.
 */
function HalfwayPost({ x, trackPx, h, font, value }: { x: number; trackPx: number; h: number; font: number; value: number }) {
  return (
    <div style={{
      position: 'fixed', left: x, top: trackPx, transform: 'translate(-50%,-100%)', zIndex: 29,
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
 * The marker — the kilometre the passenger actually wants, pegged on the ground IN FRONT of the
 * track so it can never collide with the posts behind it.
 */
function KmMarker({ x, trackPx, font, value }: { x: number; trackPx: number; font: number; value: number }) {
  return (
    <div style={{
      position: 'fixed', left: x, top: trackPx, transform: 'translateX(-50%)', zIndex: 35,
      display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none',
      animation: 'k_bounceIn .3s cubic-bezier(.34,1.56,.64,1) both',
    }}>
      <div style={{ width: 3, height: Math.round(font * 1.1), background: 'var(--milo-orange, #f26b2c)', borderRadius: 2 }} />
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(font * 0.86),
        color: '#fff', background: 'var(--milo-orange, #f26b2c)',
        border: '3px solid var(--outline, #3d2516)', borderRadius: 999,
        padding: `1px ${Math.round(font * 0.5)}px`, whiteSpace: 'nowrap',
        boxShadow: '0 3px 0 rgba(61,37,22,.20)',
      }}>km {fmt(value)}</div>
    </div>
  )
}

// ─── The train, and the passenger riding it ─────────────────────────────────────────────
/**
 * The train rolls at a constant speed — a body covering ground at a steady rate, which is what
 * `linear` is for; an eased roll puts most of the distance in the first third and reads as a slide.
 * Duration comes from `inFlowJourney`, which falls back to CARRY_SPEED for anything with no gait of
 * its own: a locomotive has no legs, so the number is stated rather than pretended to be derived.
 */
function Train({ x, trackPx, h, ms }: { x: number; trackPx: number; h: number; ms: number }) {
  return (
    <div style={{
      position: 'fixed', left: x, top: trackPx, transform: 'translate(-50%,-100%)',
      // 3.0 is the cutout's MEASURED aspect (1232 × 410 after cropping to its own ink box) — a
      // guessed ratio letterboxes the sprite inside its slot and the wheels stop meeting the rail.
      width: Math.round(h * TRAIN_ASPECT), height: h, zIndex: 34, pointerEvents: 'none',
      transition: `left ${ms}ms linear`,
    }}>
      <img src="/assets/objects/rail_train.png" alt="" draggable={false} decoding="async"
        onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.001' }}
        style={{
          width: '100%', height: '100%', objectFit: 'contain', display: 'block',
          filter: 'drop-shadow(0 3px 5px rgba(30,42,60,.34))',
        }} />
    </div>
  )
}

// ─── Milo the signalman, and the question out of his own mouth ──────────────────────────
function Signalman({ h, line, vw }: { h: number; line: string; vw: number }) {
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
  data: RlRound; picks: (number | null)[]; x: number; y: number; font: number
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

const RailPlay: React.FC<{ data: RlRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const L = railLayout(vw, vh, data.stop.trackY)

  const [picks, setPicks] = useState<(number | null)[]>(() => data.legs.map(() => null))
  const [miss, setMiss] = useState<string | null>(null)
  const [showHalf, setShowHalf] = useState(false)
  const [solved, setSolved] = useState(false)
  const [trainX, setTrainX] = useState(() => -vw * 0.3)
  const [dropped, setDropped] = useState(false)
  const [rollMs, setRollMs] = useState(0)
  const erred = useRef(false)
  const done = useRef(false)
  const picksRef = useRef(picks); picksRef.current = picks

  const key = `${data.qType}|${data.legs.join(',')}|${data.m}`
  // The scaffold: the true position is pegged before the commit only at the concrete tier.
  const showMarker = data.d <= 1 || solved

  const legIdx = Math.max(0, picks.findIndex(p => p == null))
  const activeLeg = picks.every(p => p != null) ? data.legs.length - 1 : legIdx
  const n = data.legs[activeLeg]
  const stations = useMemo(() => stationsFor(n, data.m), [n, data.m])
  const first = stations[0]
  const low = Math.floor(n / data.m) * data.m
  const homeX = L.homeX

  // The train rolls in from off-frame at the start of the round — the round OPENS with motion
  // rather than with a still picture and a question.
  useEffect(() => {
    setPicks(data.legs.map(() => null)); picksRef.current = data.legs.map(() => null)
    setMiss(null); setShowHalf(false); setSolved(false); setDropped(false)
    done.current = false; erred.current = false
    setRollMs(0); setTrainX(-vw * 0.3)
    const arrive = window.setTimeout(() => {
      setRollMs(inFlowJourney('', L.trainH, vw * 0.3 + homeX).ms)
      setTrainX(homeX)
    }, 60)
    speak(data.ask)
    return () => window.clearTimeout(arrive)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const tapStation = useCallback((v: number) => {
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
      setMiss(line); setShowHalf(true)      // the RULE, never the marker — that would give it away
      speak(line)
      // Clear only the leg that was wrong, so a correct first leg is not taken away from the child.
      const next = cur.slice(); next[badLeg] = null
      picksRef.current = next; setPicks(next)
      return
    }
    done.current = true
    setSolved(true)
    speak(data.done)
    // The reward: the signal drops and the train actually goes there.
    const target = L.xOf(data.rounded[data.rounded.length - 1], first, data.m)
    setRollMs(inFlowJourney('', L.trainH, Math.abs(target - homeX)).ms)
    setTrainX(target)
    window.setTimeout(() => setDropped(true), inFlowJourney('', L.trainH, Math.abs(target - homeX)).ms + 120)
    window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), 2600)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mode, onComplete, L.trainH, first, homeX])

  const canCommit = picks.every(p => p != null)
  const btnH = Math.max(44, Math.round(Math.min(vw / 14, vh / 11)))
  const served = solved ? data.rounded[data.rounded.length - 1] : null

  return (
    <>
      {/* Everything is position:fixed. In a SCORED round the nearest positioned ancestor is
          SkillBeat's own content-sized wrapper, so absolute % would squash the whole line into a
          strip across the top — a bug this repo shipped once and only saw in practice, because the
          demo renders outside SkillBeat and looks perfectly correct. */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden' }}>
        {[JUNCTION, COAST, HALT].map(s => (
          <img key={s} src={s} alt="" draggable={false} decoding="async"
            onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: s === data.stop.scene ? 1 : 0, transition: 'opacity .6s ease',
            }} />
        ))}
      </div>

      {/* The stations — the answer surface. Delete them and there is nothing to answer with. */}
      {stations.map((v, i) => (
        <StationPost key={v} value={v} x={L.stationX(i)} trackPx={L.trackPx} h={L.postH} font={L.boardFont}
          state={served === v ? 'served' : picks[activeLeg] === v ? 'chosen' : solved ? 'dim' : 'idle'}
          onTap={solved ? undefined : () => tapStation(v)} />
      ))}

      {showHalf && (
        <HalfwayPost x={L.xOf(low + data.m / 2, first, data.m)} trackPx={L.trackPx}
          h={L.halfStalkH} font={L.boardFont} value={low + data.m / 2} />
      )}
      {showMarker && (
        <KmMarker x={L.xOf(n, first, data.m)} trackPx={L.trackPx} font={L.boardFont} value={n} />
      )}

      <Train x={trainX} trackPx={L.trackPx} h={L.trainH} ms={rollMs} />

      {/* The passenger rides in on the train and leaves ON HER OWN LEGS — the one thing in a yard
          full of rolling stock that actually walks. */}
      {!dropped ? (
        <div style={{
          position: 'fixed', left: trainX - L.trainH * 0.95, top: L.trackPx,
          transform: 'translate(-50%,-100%)', zIndex: 33, pointerEvents: 'none',
          transition: `left ${rollMs}ms linear`,
        }}>
          <SheetCell src="/assets/objects/foreman_bear_side.png" h={L.passH} moving={false} breathe />
        </div>
      ) : (
        <div style={{
          position: 'fixed', left: trainX - L.trainH * 0.95, top: L.trackPx,
          transform: 'translate(-50%,-100%)', zIndex: 33, pointerEvents: 'none',
        }}>
          <Arrive dist={Math.round(vw - trainX + L.passH)} ms={inFlowJourney('/assets/objects/foreman_bear_side.png', L.passH, vw - trainX + L.passH).ms}
            leave resetKey={key}>
            {moving => (
              <SheetCell src="/assets/objects/foreman_bear_side.png" h={L.passH} moving={moving}
                cycleScale={inFlowJourney('/assets/objects/foreman_bear_side.png', L.passH, vw - trainX + L.passH).cycleScale} />
            )}
          </Arrive>
        </div>
      )}

      {/* Two legs need somewhere to add up. One leg does not, so it does not get a board. */}
      {data.legs.length > 1 && (
        <LegBoard data={data} picks={picks} x={Math.round(vw * RAIL_MID)} y={L.trackPx - L.postH - L.boardFont * 2.6}
          font={Math.round(L.boardFont * 1.15)} />
      )}

      <Signalman h={L.miloH} vw={vw} line={solved ? data.done : (miss ?? data.ask)} />

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
          Set the signal ✓
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
          position: 'fixed', left: Math.round(vw * RAIL_MID), top: CHROME_PX + 8,
          transform: 'translateX(-50%)', zIndex: 47, pointerEvents: 'none',
          background: 'var(--paper, #fdf6e8)', border: '3px solid var(--garden-green, #4f8f2f)',
          borderRadius: 12, padding: '5px 14px', fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(12px,1.5vw,17px)', color: 'var(--ink, #3d2516)',
          animation: 'k_bounceIn .35s cubic-bezier(.34,1.56,.64,1) both',
        }}>
          The run measured {fmt(data.exact)} km — your {fmt(data.answer)} was close.
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

const RailExplain: React.FC<{ data: RlRound; onDone: () => void }> = ({ data, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const L = railLayout(vw, vh, data.stop.trackY)
  const [step, setStep] = useState(0)
  const doneRef = useRef(onDone); doneRef.current = onDone

  const m = data.m
  const n = data.legs[0]
  const low = Math.floor(n / m) * m, high = low + m, mid = low + m / 2
  const answer = data.rounded[0]
  const place = m === 100 ? 'main station' : 'halt'
  /** Steps 0–2 walk the first leg; a two-leg round then moves the whole line onto the second. */
  const legShown = step >= 3 ? 1 : 0
  const shownN = data.legs[legShown]
  const shownAns = data.rounded[legShown]
  const stations = useMemo(() => stationsFor(shownN, m), [shownN, m])
  const first = stations[0]
  const shownLow = Math.floor(shownN / m) * m
  const shownMid = shownLow + m / 2

  /**
   * ⚠️ A TWO-LEG ROUND HAS TO BE TAUGHT AS TWO LEGS AND AN ADDITION. This is the RE-TEACH as well as
   * the demo, so it fires exactly when a child has got three estimates wrong — and teaching only the
   * first rounding would leave the "then add them" half, which is the entire point of the type,
   * unsaid at the one moment it is needed. Found by forcing an estimate round on screen; no gate
   * would have shown it, because both halves are individually correct.
   */
  const lines = useMemo(() => {
    const base = [
      data.legs.length > 1
        ? `Two legs to work out — ${fmt(n)} km, then ${fmt(data.legs[1])} km. Take them one at a time.`
        : `A passenger for kilometre ${fmt(n)}. But a train can only stop where there is a platform.`,
      `${fmt(n)} sits between the ${fmt(low)} ${place} and the ${fmt(high)} one. The halfway post is at ${fmt(mid)}.`,
      n === mid
        ? `${fmt(n)} is exactly ON the halfway post — a dead heat. When that happens we always go UP. So that leg is ${fmt(answer)}.`
        : n > mid
          ? `${fmt(n)} is past ${fmt(mid)}, so ${fmt(high)} is nearer. That leg is ${fmt(answer)}.`
          : `${fmt(n)} has not reached ${fmt(mid)}, so ${fmt(low)} is nearer. That leg is ${fmt(answer)}.`,
    ]
    if (data.legs.length === 1) return base
    const b = data.legs[1], rb = data.rounded[1]
    return [...base,
      `Now the second leg. ${fmt(b)} km rounds the same way — to ${fmt(rb)}.`,
      `Then add the two rounded legs: ${fmt(answer)} plus ${fmt(rb)} is about ${fmt(data.answer)} km for the whole run.`,
    ]
  }, [data, n, low, high, mid, answer, place])

  const [trainX, setTrainX] = useState(() => L.homeX)
  const [rollMs, setRollMs] = useState(0)

  useEffect(() => {
    let alive = true
    const timers: number[] = []
    let i = 0
    const run = () => {
      if (!alive) return
      setStep(i)
      speak(lines[i])
      // Derive the target from `stationsFor` here rather than from the reactive `first`, which the
      // effect captured at mount and which changes under it when the line moves to the second leg.
      if (i === 2 || (i === 4 && data.legs.length > 1)) {
        const leg = i === 2 ? 0 : 1
        const st = stationsFor(data.legs[leg], m)
        const target = L.xOf(data.rounded[leg], st[0], m)
        setRollMs(inFlowJourney('', L.trainH, Math.abs(target - L.homeX)).ms)
        setTrainX(target)
      }
      // A new leg is a new picture, so the train is PLACED back at the start rather than sliding
      // there — a placement is not a journey, and animating it would read as the train reversing.
      if (i === 3) { setRollMs(0); setTrainX(L.homeX) }
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
        <img src={data.stop.scene} alt="" draggable={false} decoding="async"
          onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      {stations.map((v, i) => (
        <StationPost key={`${legShown}:${v}`} value={v} x={L.stationX(i)} trackPx={L.trackPx} h={L.postH} font={L.boardFont}
          state={(legShown === 0 ? step >= 2 : step >= 4) && v === shownAns ? 'served' : 'idle'} />
      ))}
      {(legShown === 0 ? step >= 1 : true) && (
        <HalfwayPost x={L.xOf(shownMid, first, m)} trackPx={L.trackPx} h={L.halfStalkH} font={L.boardFont} value={shownMid} />
      )}
      <KmMarker x={L.xOf(shownN, first, m)} trackPx={L.trackPx} font={L.boardFont} value={shownN} />
      {/* The running total, so the two roundings are visibly ADDED rather than just each stated. */}
      {data.legs.length > 1 && (
        <LegBoard data={data} picks={[step >= 2 ? data.rounded[0] : null, step >= 4 ? data.rounded[1] : null]}
          x={Math.round(vw * RAIL_MID)} y={L.trackPx - L.postH - L.boardFont * 2.6}
          font={Math.round(L.boardFont * 1.15)} />
      )}
      <Train x={trainX} trackPx={L.trackPx} h={L.trainH} ms={rollMs} />
      <div style={{
        position: 'fixed', left: trainX - L.trainH * 0.95, top: L.trackPx,
        transform: 'translate(-50%,-100%)', zIndex: 33, pointerEvents: 'none',
        transition: `left ${rollMs}ms linear`,
      }}>
        <SheetCell src="/assets/objects/foreman_bear_side.png" h={L.passH} moving={false} breathe />
      </div>
      <Signalman h={L.miloH} vw={vw} line={lines[step]} />
    </>
  )
}

// ─── Beat ───────────────────────────────────────────────────────────────────────────────
export function makeBeat(): Beat<RlRound> {
  return {
    skillId: 'rounding', rounds: 10, reteachAfter: 3, walkEvery: 99,
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
    Play: ({ data, onSubmit }) => <RailPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <RailExplain data={data} onDone={onDone} />,
  }
}

// ─── The chapter ────────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'demo' | 'guided' | 'practice'

export default function RailLine({ onFinish, onExit }: {
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const [served, setServed] = useState<number[]>([])     // the cumulative arc — OUTSIDE SkillBeat
  const needsRotate = useNeedsRotate()
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)
  /**
   * ⚠️ THE RUN STRIP WAS A CHEAT SHEET, AND IT TOOK A MEASUREMENT TO SEE IT. `SkillBeat` fires
   * `onRound` when a round LOADS, not when it is answered — so pushing that round's answer straight
   * onto the strip printed the answer to the question the child was still looking at. Measured live
   * on round 2 (km 26): the strip already read "20 30" with 30 the answer they had not given yet.
   * The pending answer is held back one round, so the strip only ever shows the run SO FAR — which
   * is what it claims to be, and the last round's stop simply never joins it.
   */
  const pendingStop = useRef<number | null>(null)

  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])
  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return
    finished.current = true; stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 700)), [])
  const beat = useMemo(() => makeBeat(), [])

  // Deterministic, and the two demos come out as DIFFERENT types by construction: `asked` drives the
  // generator's unmet-first branch, so slot 0 is round10 and slot 1 is round100.
  const DEMO = useMemo(() => [makeRound(1, 0, []), makeRound(2, 1, ['round10'])], [])
  const GUIDED = useMemo(() => makeRound(1, 2, ['round10', 'round100']), [])

  // ⚠️ Below every hook. An early return above one changes the hook count when the phone turns and
  // React tears the chapter into the error boundary — this crashed a 6–8 chapter the first time.
  if (needsRotate) return <RotateGate line="Milo's line needs a wide screen — the track has to stretch right across! 🚂" />

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#9fae9a' }}>
      <style>{CRITTER_CSS}</style>

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
          background: `linear-gradient(rgba(28,34,26,.55), rgba(28,34,26,.55)), url(${JUNCTION}) center/cover`,
        }}>
          <div style={{
            maxWidth: 520, background: 'var(--paper, #fdf6e8)', border: '4px solid var(--outline, #3d2516)',
            borderRadius: 20, padding: '22px 26px', textAlign: 'center', boxShadow: '0 8px 0 rgba(61,37,22,.2)',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(22px,3.4vw,34px)', color: 'var(--ink, #3d2516)' }}>
              The Rail Line 🚂
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(14px,1.7vw,19px)', color: 'var(--ink, #3d2516)', lineHeight: 1.45 }}>
              Milo is the signalman. Passengers ask for a kilometre — but a train can only stop where
              there is a platform. Work out which station is nearest, set the signal, and the train
              pulls in.
            </p>
            <button onClick={() => { unlockSpeech(); setPhase('demo') }}
              style={{
                marginTop: 6, padding: '12px 26px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(15px,1.9vw,21px)',
                background: 'var(--milo-orange, #f26b2c)', color: '#fff',
                border: '4px solid var(--outline, #3d2516)', boxShadow: '0 5px 0 rgba(61,37,22,.22)',
              }}>Take the signal box</button>
          </div>
        </div>
      )}

      {phase === 'demo' && (
        <RailExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
      )}

      {phase === 'guided' && (
        <RailPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
      )}

      {phase === 'practice' && (
        <SkillBeat beat={beat} onInterlude={interlude}
          onRound={(data) => {
            if (pendingStop.current != null) { const v = pendingStop.current; setServed(s => [...s, v]) }
            pendingStop.current = (data as RlRound).answer
          }}
          onComplete={(c, w, mastered) => {
            result.current.correct += c; result.current.wrong += w
            finishChapter(result.current.correct, result.current.wrong, mastered)
          }} />
      )}
    </div>
  )
}
