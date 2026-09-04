'use client'
/**
 * Chapter (9–11) — BIG NUMBERS & PLACE VALUE (skill `bigNumbers`) — THE FUNDRAISER.
 *
 * ⚠️ THE VERB CHANGED, ON THE FOUNDER'S CALL: THIS CHAPTER IS NOW **READ IT AND WRITE IT**, NOT
 * BUILD IT. The previous cut had the child load base-ten bundles into four bays until the columns
 * added up, and it taught the concrete side well. What it never asked for is the thing the skill is
 * actually FOR: looking at 3,482 and knowing which digit is the hundreds, and hearing "three
 * thousand four hundred and eighty-two" and writing the figures down. So the bundles, the bays, the
 * supply row and the pinch-and-drop are gone, and the answer surface is a fundraiser board the child
 * WRITES ON. Everything the bundles carried is now carried by the walkthrough, which builds the
 * number one place at a time before anything is scored.
 *
 * THE STORY — §0a's second half, *who wants this and why*. Milo runs the tally table at a school
 * fundraiser. The caretaker comes over with a figure; the board on the wall is blank, and the board
 * is what the whole school reads. Somebody has to WRITE the total up, and somebody has to be able to
 * say how many hundred-dollar notes are in it when the parent helper asks. That is the job.
 *
 * THE GESTURE — one surface, three questions, and the surface is a row of boxes with a place under
 * each of them.
 *   • `read`  — the board already shows $3,482. "Just the hundreds — what goes in that column?"
 *      ONE digit. The numeral is printed as a plain figure with NO place labels under it, because a
 *      labelled 3 | 4 | 8 | 2 answers the question for the child: counting the places IS the skill.
 *   • `value` — "the tin holds four hundred dollars — how many hundred-dollar notes is that?" The
 *      digit-value question, asked from the end where the child has to convert rather than read off.
 *   • `write` — Milo SAYS a total out loud and the board is blank. Write all of it, one place at a
 *      time, thousands first. The boxes ARE labelled here, because writing a number you have only
 *      heard is what the labels scaffold, and the child still has to decompose the words themselves.
 *
 * ⚠️ THE ANSWER IS WRITTEN, NEVER PICKED, and that is what keeps `read` honest. "How many hundreds
 * in 3,482?" over three chips is the exact fault this chapter was rebuilt to remove two sessions
 * ago — one of the chips is right and a third of children get it free. A digit the child WRITES has
 * no options on screen at all, so the floor is 1-in-10 and, more to the point, the child has to
 * produce the answer rather than recognise it.
 *
 * ⚠️ AND THE DIGITS ARE 0..9 AGAIN. The old `MAX_DIGIT = 5` was never a difficulty choice — it was
 * what nine HONEST base-ten pieces physically fit on a 1280px frame before the ones column stopped
 * being countable. Nothing is drawn as pieces now, so the ceiling has no reason to exist and the
 * chapter can finally ask about $3,482, which is the number its own intro card always used.
 *
 * ⚠️ ZERO IS DELIBERATELY IN RANGE FOR THE INNER PLACES, and L3 forces one. An empty column is the
 * placeholder, 3,042 is the number that teaches it, and it is the case a child who has only ever
 * met full numbers gets wrong.
 *
 * ⚠️ **AND THE HAND PATH IS NOW *KITNE × KAHAAN* — PINCH A DIGIT, CARRY IT, DROP IT IN ITS COLUMN.**
 * The previous cut had the child WRITE the digit in the air and a $P recognizer read it back, and the
 * founder stopped it: *"its not recognition bro"*. He was right, and the test it fails is
 * chapter-craft §5's first one — **the body has to carry the IDEA, not the NOTATION.** A sweep IS
 * repeated subtraction and a forearm IS the ramp; a nine-year-old already knows how to write a 4, so
 * doing it in the air is harder and means nothing more, and every misread is friction with no
 * learning in it. Carrying a digit to a column is the opposite: **the hand's POSITION is the place**,
 * so the same 4 dropped on the hundreds is 400 and on the tens is 40 — the child's own arm performs
 * the exact misconception the chapter exists to break, which a mouse cannot do.
 *
 * ⚠️ IT NEEDED ALMOST NO NEW DETECTION. `stepPinch` gives hold/release with the hysteresis, the
 * sustained release and the lost-frame grace already derived; only the RATIO it steps on changed.
 * `airDigit.ts` and the ink pane are deleted rather than left to rot.
 *
 * ⚠️ **THE GRAB IS A FIST AND THE COMMIT IS A 👍 — BOTH ON THE FOUNDER'S CALL ("pinch sahi naii
 * hai").** A pinch is fine-motor work asked of a nine-year-old while their whole arm crosses the
 * screen, read from the two noisiest landmarks there are; closing the whole hand is what a child
 * already does to pick something up. And the board no longer goes up by reaching back to a button:
 * a thumbs-up says *that is my answer*. ⚠️ The button is still there — see the commit effect for
 * why replacing a chapter's only commit-feeding control is how a round becomes unsubmittable.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { afterSpeech, speak, speakAfterCurrent, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { Arrive, SheetCell, CRITTER_CSS, inFlowJourney } from './critters'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { Shadow, YARD_CSS } from './yard'
import { useHandInput, HandProvider, useHand, CamView, CamGate, type HandSkin } from '@/infra/ar/HandInput'
import { rint, pick, shuffle } from '@/core/rand'
import {
  Chalkboard, GotIt, ThePlan, StepBoard, CHALK_GOLD, CHALK_CSS, chalkText,
  isShort, stepWindow, stepBoardRect,
} from './chalkboard'
import { useLatestRef } from '@/shared/hooks/useLatestRef'
import { SceneBg } from '@/shared/ui/SceneBg'
import { useChapterPhase } from '@/shared/hooks/useChapterPhase'

// ─── Numbers in words ───────────────────────────────────────────────────────────────────
const ONES_W = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS_W = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
function under100(n: number): string {
  if (n < 20) return ONES_W[n]
  const t = Math.floor(n / 10), o = n % 10
  return TENS_W[t] + (o ? '-' + ONES_W[o] : '')
}
export function numWords(n: number): string {
  if (n < 100) return under100(n)
  if (n < 1000) { const h = Math.floor(n / 100), r = n % 100; return ONES_W[h] + ' hundred' + (r ? ' and ' + under100(r) : '') }
  const th = Math.floor(n / 1000), r = n % 1000
  return ONES_W[th] + ' thousand' + (r ? (r < 100 ? ' and ' + under100(r) : ' ' + numWords(r)) : '')
}
const fmt = (n: number) => n.toLocaleString('en-US')

// ─── Places ─────────────────────────────────────────────────────────────────────────────
export const PLACES = [1000, 100, 10, 1] as const
export type Place = typeof PLACES[number]
/**
 * ⚠️ THE NAMES ARE MONEY NAMES, because the world is a fundraiser and dollar denominations ARE base
 * ten — the anchor and the material are the same object, which is the whole reason this world was
 * chosen over a warehouse. A child has stood in front of a fundraiser board; none of them has been
 * in a goods yard.
 */
const PLACE_NAME: Record<Place, { one: string; many: string; goods: string }> = {
  1000: { one: 'thousand-dollar note', many: 'thousand-dollar notes', goods: 'thousands' },
  100: { one: 'hundred-dollar note', many: 'hundred-dollar notes', goods: 'hundreds' },
  10: { one: 'ten-dollar note', many: 'ten-dollar notes', goods: 'tens' },
  1: { one: 'dollar coin', many: 'dollar coins', goods: 'ones' },
}

/**
 * ⚠️ ONE MONEY FORMAT FOR THE WHOLE CHAPTER. `fmt` has ~10 call sites, and a "$" written into some
 * strings and not others would be two formats for one chapter.
 */
const money = (n: number) => `$${fmt(n)}`
/** digits of `n`, most significant first, for the four places */
const digitsOf = (n: number): number[] => PLACES.map(p => Math.floor(n / p) % 10)

// ─── Worlds ─────────────────────────────────────────────────────────────────────────────
/**
 * A world per round, not one backdrop per chapter. ⚠️ Indexed STRAIGHT and never modulo — the 6–8
 * band shipped `PLAN[round % len]` three times and the last rounds wrapped back onto the creature
 * the chapter opened with.
 */
export interface Yard { scene: string; groundY: number; customer: string; who: string }
/**
 * ⚠️ THE CAST IS KEPT. Both of these are drawn WALK CYCLES (12 cells each, in canvas/sheets.ts), so
 * re-casting means the whole image→video→frames pipeline plus its chroma key, facing and cut-window
 * traps — real money and real risk for a gain the roles deliver for free.
 */
const CUSTOMERS = [
  { src: '/assets/objects/foreman_bear_side.png', who: 'the caretaker' },
  { src: '/assets/objects/driver_badger_side.png', who: 'the parent helper' },
]
/**
 * ⚠️ MEASURED BEFORE BEING WIRED, because a generated scene brings its own numbers.
 *   value over the band the cast stands in — hall 0.524 · playground 0.575 · gym 0.562 (graded)
 *   against a cast of 0.62–0.81 and Milo at 0.705, so no scene is brighter than what stands on it.
 *   Every board in all three is BLANK — a painted total would be the answer, printed on the wall,
 *   and this cut needs that more than the last one did: the child now WRITES on that board.
 */
const SCENES = [
  { scene: '/assets/backgrounds/fund_hall.png', groundY: 0.87 },
  { scene: '/assets/backgrounds/fund_yard.png', groundY: 0.88 },
  { scene: '/assets/backgrounds/fund_gym.png', groundY: 0.87 },
]
/** 13 slots: 2 demo + 1 guided + 10 scored. Scene and customer advance on DIFFERENT cycles, so the
 *  pairing keeps changing instead of repeating every third round. */
export const RUN: Yard[] = Array.from({ length: 13 }, (_, i) => ({
  ...SCENES[i % SCENES.length],
  customer: CUSTOMERS[i % CUSTOMERS.length].src,
  who: CUSTOMERS[i % CUSTOMERS.length].who,
}))
export const yardAt = (slot: number) => RUN[Math.min(slot, RUN.length - 1)]

// ─── The round ──────────────────────────────────────────────────────────────────────────
export type QType = 'read' | 'value' | 'write'
export const Q_ALL: readonly QType[] = ['read', 'value', 'write']

export interface OdRound {
  qType: QType
  yard: Yard
  /** the whole number the round is about */
  n: number
  /** the digits the child must write, most significant first — ONE of them on read/value */
  answer: number[]
  /** which single place a one-digit round is about, or -1 on a write */
  focus: number
  /** spoken ask, at the customer's mouth */
  ask: string
  /** whether the boxes carry their place labels — see `write` in the header */
  labelled: boolean
  /**
   * THE LOOSE DIGITS, SCRAMBLED — what the child picks up and carries into a column.
   *
   * ⚠️ **THEY ARE THIS NUMBER'S OWN DIGITS, AND ON A ONE-DIGIT ROUND THAT IS WHAT MAKES THE
   * DISTRACTORS HONEST.** Asked for the hundreds of 3,482 the tray holds 3 · 4 · 8 · 2, so every
   * wrong tile is another place of the same number — exactly the confusion the question is about —
   * rather than a digit picked out of the air.
   *
   * ⚠️ AND THEY ARE SCRAMBLED, WHICH IS THE HALF THAT KEEPS A `write` ROUND FROM BEING COPYING. Laid
   * out in order beside four columns in order, the child sorts left-to-right and never has to know
   * what a thousand is.
   */
  tray: number[]
  /** the written miss line; this chapter owns its own feedback */
  missPrefix: string
}

/**
 * ⚠️ THE LEADING DIGIT IS NEVER 0 and the inner ones may be. `hole` forces an inner zero, which is
 * the placeholder case — L3 always gets one, because a child who has only ever written full numbers
 * writes 3,42 for three thousand and forty-two and nothing earlier in the chapter catches it.
 */
function pickNumber(d: 1 | 2 | 3, hole = false): number {
  if (d === 1) {
    const digs = [rint(1, 9), rint(0, 9), rint(1, 9)]
    if (hole) digs[1] = 0
    return digs[0] * 100 + digs[1] * 10 + digs[2]
  }
  const digs = [rint(1, 9), rint(0, 9), rint(0, 9), rint(1, 9)]
  if (hole) digs[pick([1, 2])] = 0
  return digs[0] * 1000 + digs[1] * 100 + digs[2] * 10 + digs[3]
}

/** How many boxes a number needs — 3 or 4, never a leading blank. */
export const slotsFor = (n: number) => (n >= 1000 ? 4 : 3)
/** The places those boxes stand for, most significant first. */
export const placesFor = (n: number) => PLACES.slice(PLACES.length - slotsFor(n)) as readonly Place[]

/**
 * What the column at box `i` is called. ⚠️ ONE FUNCTION, because `BoardRow` prints these labels and
 * the instruction chip names the one under the hand — two copies of "which place is box 2" would
 * drift and the chip would name a different column from the one lighting up.
 *
 * A one-digit round draws a single box and it stands under the place being ASKED about, not under
 * the thousands.
 */
export function colName(q: OdRound, i: number): string {
  const places = placesFor(q.n)
  const p = q.answer.length === 1 ? places[q.focus - (PLACES.length - places.length)] : places[i]
  return PLACE_NAME[p].goods
}

/**
 * THE GRADER. ⚠️ EXPORTED AND PURE so a gate drives the SAME function the commit button calls.
 * `entered` is index-aligned to `q.answer`; an unwritten box is -1, which can never equal a digit.
 */
export function grade(q: OdRound, entered: number[]): boolean {
  return q.answer.length === entered.length && q.answer.every((d, i) => entered[i] === d)
}

/**
 * THE AMOUNT THE ROUND'S QUESTION STATES — the whole total on a `read`/`write`, and just that tin on
 * a `value`.
 *
 * ⚠️ ONE FUNCTION, THREE CALLERS (the miss line, the walkthrough's docket, the silent-device
 * fallback), because nothing is printed any more and all three now have to say the number out of the
 * round itself. A second copy would eventually print the whole total beside a question about one tin.
 */
// ⚠️ ON `qType`, NOT ON `focus` — a `read` round has a focus too, and keying on that would say
// "eighty" where the question said "three hundred and forty-three".
export const saidAmount = (q: OdRound) => (q.qType === 'value' ? q.answer[0] * PLACES[q.focus] : q.n)

/**
 * The written miss line. ⚠️ IT NEVER STATES THE ANSWER — only what the child wrote, and why it is
 * not it. A one-digit round is the strict case: the answer IS a digit, so naming the target hands
 * the whole question over after one wrong attempt.
 */
export function missFor(q: OdRound, entered: number[]): string {
  const blank = entered.findIndex(v => v < 0)
  if (blank >= 0) return `${q.missPrefix} the ${PLACE_NAME[placesFor(q.n)[blank]].goods} box is still empty.`
  // ⚠️ IT SAYS THE NUMBER AGAIN AND NEVER WHICH DIGIT. "Count the places again, from the right" was
  // written when the total was PRINTED; with nothing on screen to count along, it instructs
  // something the child cannot do.
  if (q.focus >= 0) return `${q.missPrefix} you put up ${entered[0]}. Listen again: ${numWords(saidAmount(q))}.`
  /**
   * ⚠️ A `write` ROUND MAY RESTATE ITS TOTAL, and only a write round. The child was TOLD the number —
   * it is the question, not the answer — so repeating it gives away nothing they were not already
   * asked to hold. What it must never do is say which digit goes where.
   */
  return `${q.missPrefix} that reads ${money(Number(entered.join('')))}, and I said ${numWords(q.n)}.`
}

export function makeRound(d: 1 | 2 | 3, slot: number, asked: readonly string[], force?: QType): OdRound {
  const yard = yardAt(slot)
  const pool: QType[] = d === 1 ? ['read', 'write'] : ['read', 'value', 'write']
  // deliberate while a gap exists, RANDOM once it closes — hardest-first for ever locks the
  // generator onto one kind and destroys the variety coverage was supposed to protect
  const unmet = pool.filter(q => !asked.includes(q))
  // ⚠️ `force` exists because the DEMO must be deterministic: passing `asked` to slot 1 does nothing
  // if slot 0's random pick collided, so both demos could open on the same question type.
  const qType = force ?? (unmet.length ? pick(unmet) : pick(pool))
  const n = pickNumber(d, d === 3)
  /** the digits the board is made of — the tray is these, scrambled. See `tray`. */
  const shown = digitsOf(n).slice(PLACES.length - slotsFor(n))
  const tray = shuffle(shown)

  if (qType === 'write') return {
    qType, yard, n, answer: shown, focus: -1,
    ask: `We counted the buckets — ${numWords(n)}. Put it up on the board for me.`,
    /**
     * ⚠️ **NOTHING IS PRINTED ON ANY ROUND ANY MORE — founder's call, and it retires the L1 scaffold
     * this field existed for.** L1 used to show `$709` over the columns so the first tier could teach
     * the carry with the answer visible. With the amount now SAID in words on every round type, that
     * scaffold is the one thing on screen a child can copy left-to-right without knowing what a
     * thousand is — the transcription fault the `placeValue` rebuild was stopped for, back at the
     * easiest tier. So the whole `board` field is gone rather than set to null everywhere: a field
     * that is always null is a printing surface waiting to be used again.
     */
    labelled: true, tray,
    missPrefix: 'That is not what I said —',
  }

  // a one-digit round: pick a place this number actually has something in, so the ask is never for
  // a zero the child cannot tell from a box they forgot
  const digs = digitsOf(n)
  const live = digs.map((v, i) => ({ v, i })).filter(x => x.v > 0 && PLACES[x.i] <= (n >= 1000 ? 1000 : 100))
  /**
   * ⚠️ **A `value` ROUND MAY NEVER LAND ON THE ONES.** Caught by playing the previous cut: it
   * produced *"the tin holds two dollars — how many dollar coins is that?"*, where the answer is the
   * number in the question. The whole point is converting a VALUE into a count of a bigger unit, so
   * a place worth 1 has nothing to convert.
   */
  const pool2 = qType === 'value' ? live.filter(x => PLACES[x.i] > 1) : live
  const { i: focus } = pick(pool2.length ? pool2 : live)
  const place = PLACES[focus]

  if (qType === 'read') return {
    qType, yard, n, answer: [digs[focus]], focus,
    /**
     * ⚠️ **THE TOTAL ARRIVES IN WORDS AND NOTHING IS PRINTED — founder's call, and it replaces an
     * earlier one.** This round used to print `$3,482` and ask for a place, so the work was counting
     * the places along a numeral, and the ask deliberately named no number at all ("our total is up
     * on the board"). Two things pushed it: the camera path has no painted board for that sentence
     * to point AT, and the founder wants the amount SAID so the child works out which figure to drag
     * from the words. Turning "eighty-two" into an 8 in the tens is the numeral↔words half of this
     * chapter's curriculum, and it is what the whole `write` round already rests on.
     *
     * ⚠️ **THE COST, STATED RATHER THAN HIDDEN: on the hundreds and the thousands the words name the
     * digit outright** ("FOUR hundred" → 4), so those rounds no longer make the child count places —
     * only the tens really decode. The place-counting payload now lives entirely in `write`, where
     * the board is blank from L2 and the tray is scrambled.
     *
     * ⚠️ AND THE ASK IS WRITTEN AS WELL AS SPOKEN (it renders in the customer's bubble), or a silent
     * device would have no question at all now that nothing is printed.
     */
    ask: `We raised ${numWords(n)} dollars. Just the ${PLACE_NAME[place].goods} — what goes in that column?`,
    labelled: false, tray,
    missPrefix: `Not the ${PLACE_NAME[place].goods} —`,
  }
  return {
    qType, yard, n, answer: [digs[focus]], focus,
    ask: `The ${PLACE_NAME[place].goods} tin holds ${numWords(digs[focus] * place)} dollars. How many ${PLACE_NAME[place].many} is that?`,
    // ⚠️ the tin is already named in words; printing `$400` beside it would be the answer's first
    // figure, handed over
    labelled: false, tray,
    missPrefix: 'That is not how many —',
  }
}

// ─── Layout ─────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ EXPORTED, and the scene renders from THIS — a sweep that re-implements the chain can agree with
 * its own copy of the constants while the screen falls apart (chapter-craft.md).
 */
/**
 * ⚠️ **NO FLAT PIXEL CAP ON THE CAST.** SliceShop shipped `min(vh * 0.26, 200)` and the founder's
 * words were "characters chhote chhote hai" — above a 770px window the cap froze the whole cast
 * while the scene kept growing. The share is what scales.
 */
export const PEOPLE_H = (vh: number) => Math.round(Math.max(84, Math.min(vh * 0.30, 340)))
export const SIDE_RESERVE = (vw: number, vh: number) =>
  Math.round(Math.min(vw * 0.22, Math.max(PEOPLE_H(vh) * 0.82 + 14, vw * 0.10)))

/** Short frames get a different budget, not a scaled one — see `boardLayout`. */
/** Re-exported: the definition moved to `chalkboard` with the boards that window on it. */
export { isShort, stepWindow, stepBoardRect }

/**
 * THE REACH — how much of the camera frame the board is spread across.
 *
 * ⚠️ **THE FRAME'S FULL WIDTH IS NOT REACHABLE, AND MAPPING TO IT IS SILENCE AT THE EDGES.** This is
 * `SWEEP_ARM`'s lesson stated as a constant: a child sitting at a laptop can move a pinched hand
 * comfortably through the middle of the picture and has to lean out of shot to touch either end, so
 * a column mapped to x≈0 is a column they cannot post a digit into — and the outer columns are
 * exactly where the thousands live. The middle band is stretched over the whole board instead, and
 * everything past it clamps to the nearest edge rather than going dead.
 *
 * ⚠️ AND IT APPLIES TO BOTH AXES. The tray is at the bottom of the screen and the boxes near the
 * middle; a child who has to drop their hand out of frame to reach the tray cannot pick anything up.
 */
export const REACH = 0.72
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
/**
 * The carry point in SCREEN pixels. ⚠️ EXPORTED so the gate drives the same mapping the scene does —
 * a check carrying its own copy of `REACH` cannot see the reach being narrowed to nothing.
 *
 * `nib` is already mirrored (see `nibRead`), so a hand moving right moves the digit right.
 */
export function handPoint(nib: { x: number; y: number }, vw: number, vh: number) {
  const m = (1 - REACH) / 2
  return { x: clamp01((nib.x - m) / REACH) * vw, y: clamp01((nib.y - m) / REACH) * vh }
}

/**
 * The board and the controls, derived from the room that is left.
 *
 * ⚠️ **THE BOXES NEVER SHRINK BELOW A TAP TARGET**, because they are tappable on both paths (that is
 * how a child goes back to fix the tens after filling the ones) and on the hand path they are the
 * drop targets — a column too small to drop into is a wrong answer the chapter caused.
 */
/**
 * ⚠️ **THERE IS NO WRITING PANE ANY MORE, AND DELETING IT IS MOST OF WHY THIS LAYOUT GOT SIMPLER.**
 * The ink needed a 4:3 canvas big enough to form a numeral in, which on a short landscape frame
 * computed to ZERO and had to be given its own beside-the-boxes branch, its own minimum, and the
 * camera moved into it. A carried digit needs none of that: the answer surface is the BOXES and the
 * TRAY, which both inputs already share, so the hand simply points at the same things a finger taps
 * and the self-view is free to go FULL SCREEN behind the whole board — the child looks at one place
 * instead of glancing between their hand in a corner and the columns in the middle.
 */

/**
 * How wide the customer's speech bubble is. ⚠️ EXPORTED AND SHARED WITH `Customer`, because this is
 * the number the board has to keep out of and two copies of it would drift the first time either
 * moved. The bubble's right edge is clamped 12px inside the frame, so its left edge is derivable.
 */
export const BUBBLE_W = (vw: number) => Math.min(vw * 0.52, 460)
export const bubbleLeft = (vw: number) => vw - 12 - BUBBLE_W(vw)

export function boardLayout(vw: number, vh: number, groundY: number, slots: number) {
  const short = isShort(vh)
  const groundPx = Math.round(vh * groundY)
  const side = SIDE_RESERVE(vw, vh)

  // the band above the board — on a roomy frame that is headroom over the bubble, and where the ask
  // has moved to a banner it is the banner's own height plus the docket's gap
  const bubble = short ? 74 : 104
  /**
   * The loose-digit tray, on BOTH paths.
   *
   * ⚠️ **ROOMY FRAMES GOT A MUCH TALLER TRAY BECAUSE A 62px TILE IS TOO FINE A TARGET FOR A HAND.**
   * A hand in the air is not a mouse: it drifts, so a tile sized for a fingertip is a tile a child
   * cannot pick up, which reads as the camera being broken. A short frame keeps 62: there the boxes
   * are already at their floor and the tray's height comes straight out of `availH`, so growing it
   * here would shrink the drop targets to pay for the pick-up ones.
   *
   * ⚠️ ONE CAUSE OF THAT DRIFT IS NOW GONE RATHER THAN PAID FOR — the carry point used to be the
   * thumb/index midpoint, which MOVED as the fingers closed, i.e. exactly at the instant the tile is
   * chosen. `gripPoint` reads the knuckle, which does not. The bigger tile stays: the founder asked
   * for it on top of that, and nearest-target hit-testing is the other half.
   */
  const trayH = short ? 62 : 118
  const chrome = 62                                // Menu button + the run strip
  const labelH = short ? 16 : 22

  /**
   * ⚠️ **THE BOARD LIVES LEFT OF THE BUBBLE, NOT CENTRED UNDER IT.** Centred, a four-box row at
   * 1280×720 ran 393→887 while the customer's bubble started at 808 — measured on screen, the
   * question covering the last two boxes of the answer. This is the open item the previous cut left
   * behind ("the bubble covers the columns") and centring reproduced it exactly. The bubble belongs
   * to the speaker and cannot move, so the board takes the band that is left: chapter-craft's *a
   * boundary next to another character is measured off THAT character, never guessed*.
   *
   * ⚠️ AND WHERE THAT BAND CANNOT HOLD THE BOARD, THE ASK MOVES TO A TOP BANNER INSTEAD. On a short
   * landscape frame the bubble and four boxes at the tap floor genuinely do not fit side by side.
   * Something has to give, and a question covering the answer is worse than one that is not in a
   * bubble: the speaker is still on screen and still says it aloud.
   */
  const bandRight = bubbleLeft(vw) - 12
  const availW0 = Math.max(160, vw - side * 2)

  /** the narrowest the board can be drawn: every box at the tap floor */
  const needW = 44 * slots + (slots - 1) * 10
  const askAtTop = bandRight - side < needW

  /**
   * A box, as wide as the row it is given allows — capped so four do not become billboards, floored
   * at the tap target because the boxes are BOTH tapped and dropped into, and its height capped by
   * the BAND rather than only derived from the width (the boxes may not grow into the tray).
   *
   * ⚠️ THE 44 IS A BACKSTOP THAT NEVER BINDS ON A REACHABLE SCREEN, said out loud because a
   * mutation proved it: dropping it to 20 leaves the gate green. The narrowest landscape a child
   * can be in is ~568 (the chapter is landscape-only, `RotateGate` sends portrait away), and four
   * boxes come out well clear of it there.
   * ⚠️ the roomy cap went 116 → 150 for the tray's reason: these are the DROP targets, and a hand
   * that wobbles while the fingers open needs a column it can miss the middle of and still hit.
   */
  const fit = (w: number, h: number) => {
    const bw = Math.max(44, Math.min(Math.floor((Math.max(160, w) - (slots - 1) * 10) / slots), short ? 76 : 150))
    const bh = Math.min(Math.round(bw * 1.22), Math.max(44, h - labelH))
    return { bw, bh, rowW: bw * slots + (slots - 1) * 10 }
  }

  /**
   * ⚠️ **TWO PLACEMENTS, AND THE ONE THAT DRAWS THE BIGGER DROP TARGET WINS — founder's call was
   * "boxes ko center mein rakho", and a naive centring is a bug this chapter has already shipped.**
   *
   * **B, BESIDE THE BUBBLE** is what it used to always do: centred in the strip LEFT of the customer,
   * because a row centred in the viewport at 1280×720 ran 393→887 while the bubble started at 808 —
   * the question drawn over the last two boxes of the answer. The bubble belongs to the speaker and
   * cannot move.
   *
   * **A, CENTRED AND LIFTED ABOVE THE BUBBLE** is what the founder is asking for, and it is only
   * available now that nothing is printed above the boxes: the docket used to own that band. The
   * bubble's top is derivable — it hangs at `h * 0.86` over the customer's feet — so the board takes
   * the strip between the chrome and it, and the full width is free.
   *
   * ⚠️ **THE CHOICE IS MEASURED, NOT PICKED PER SIZE.** Take whichever gives the taller box, so a
   * short landscape frame (where the band above the bubble is ~47px and would crush the boxes to
   * their 44px floor) keeps B by arithmetic rather than by a hand-written breakpoint, and a roomy
   * one gets A. Ties go to centred.
   */
  const bubbleTopY = groundPx - Math.round(PEOPLE_H(vh) * 0.86) - bubble
  const A = fit(availW0, Math.max(60, bubbleTopY - chrome - 16))
  const B = fit(bandRight - side, Math.max(120, groundPx - bubble - chrome - trayH))
  // ⚠️ WITH A TOLERANCE, or centring loses to a ONE-PIXEL taller box. Measured at 1024×620 on a
  // one-box round: beside-the-bubble came out 183 against centred's 182 and the board sat 158px off
  // centre to buy a pixel. Beating the founder's placement has to be worth something.
  const centred = askAtTop || A.bh * 1.1 >= B.bh
  const { bw: boxW, bh: boxH, rowW } = askAtTop ? fit(availW0, Math.max(120, groundPx - (short ? 104 : 126) - chrome - trayH)) : centred ? A : B

  const stackH = boxH + labelH
  // ⚠️ the banner needs its own room ABOVE the board, or the ask lands on the boxes
  const topBand = askAtTop ? (short ? 104 : 126) : bubble
  const top = centred && !askAtTop
    ? Math.max(chrome + 8, Math.round(chrome + 8 + (bubbleTopY - 16 - chrome - stackH) / 2))
    : Math.max(topBand, Math.round((groundPx - stackH) / 2))
  /**
   * ⚠️ THE SIDE RESERVE STILL BINDS WHEN THE BOARD IS CENTRED. Centring in the whole viewport put
   * the board's left edge at 136 against a 167px reserve at 1024×620, i.e. drawn straight through
   * Milo — so a centred row is still clamped inside the cast's band, and where it cannot fit there
   * it was never the placement that won.
   */
  const groupLeft = centred
    ? Math.max(side, Math.round((vw - rowW) / 2))
    : Math.round(side + (Math.max(160, bandRight - side) - rowW) / 2)

  /**
   * ⚠️ THE DOCKET NEEDS ITS OWN GAP, MEASURED FROM ITS OWN HEIGHT. Placed at `boardTop - 44` it sat
   * exactly ON the box's top edge at 1280×720 — the printed total welded onto the empty box, which
   * reads as the box already containing it. It is the thing being READ; the box is the thing being
   * written. They must not touch.
   */
  const docketH = short ? 30 : 40
  return {
    short, groundPx, side, boxW, boxH, rowW, labelH, trayH, docketH, askAtTop,
    bandRight,
    /**
     * Where the customer's speech bubble starts, vertically. ⚠️ EXPORTED SO THE GATE READS THE SAME
     * NUMBER THE PLACEMENT DID — the board may now sit ABOVE the bubble and therefore legitimately
     * cross its x-band, so "the board ends before `bubbleLeft`" stopped being the rule and "they do
     * not overlap in BOTH axes" became it. A check deriving this for itself is the re-implemented
     * rule this repo keeps paying for.
     */
    bubbleTop: bubbleTopY,
    docketTop: Math.max(6, Math.round(top) - docketH - 14),
    boardLeft: groupLeft,
    boardTop: Math.round(top),
    /** the lowest pixel anything on the board reaches — the cast's ground line must clear it */
    boardBottom: Math.round(top + stackH),
    peopleH: PEOPLE_H(vh),
    miloX: Math.round(side / 2),
    custX: Math.round(vw - side / 2),
    boxAt: (i: number) => groupLeft + i * (boxW + 10),
  }
}

// ─── Does this device have a voice? ─────────────────────────────────────────────────────
/**
 * ⚠️ **A `write` ROUND IS UNANSWERABLE ON A SILENT DEVICE, AND MOST CHROME INSTALLS ARE SILENT.**
 * The whole 3–11 band has zero recorded clips (the 605 ElevenLabs ones are teen-only), so this
 * chapter's spoken total rides on browser TTS — which Safari has and a great many Chrome
 * installations simply do not. A round whose question exists only as sound is then a blank screen
 * with no way to answer it, which is the worst state a chapter can be in.
 *
 * So a `write` round shows the total IN WORDS when there is no voice. That is not a weaker question:
 * the skill is decomposing a number NAME into digits, and the name arriving by eye instead of by ear
 * changes the channel rather than the work. It is only hidden when it can be heard.
 *
 * ⚠️ AND THE PROBE HAS TO WAIT, because `getVoices()` is EMPTY on Chrome until `voiceschanged`
 * fires — checking once at mount reports every Chrome as silent. It assumes a voice, listens, and
 * gives up after a beat: assuming silence would show the words to everyone and delete the feature.
 */
function useHasVoice(): boolean {
  const [has, setHas] = useState(true)
  useEffect(() => {
    const s = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    // ⚠️ NOTHING IS SET SYNCHRONOUSLY HERE. The state starts optimistic, so an immediate check could
    // only ever re-assert `true` — a cascading render for no information. Every path settles on the
    // subscription or on the timeout.
    const check = () => { if ((s?.getVoices() ?? []).length > 0) setHas(true) }
    s?.addEventListener?.('voiceschanged', check)
    const t = window.setTimeout(() => setHas(!!s && (s.getVoices() ?? []).length > 0), 1400)
    return () => { s?.removeEventListener?.('voiceschanged', check); window.clearTimeout(t) }
  }, [])
  return has
}

// ─── The board ──────────────────────────────────────────────────────────────────────────
/**
 * The fundraiser board: a row of boxes, one per place, with the place written under it when the
 * round says so.
 *
 * ⚠️ **THE LABELS ARE PER ROUND, NOT PER CHAPTER, AND LEAVING THEM ON WOULD DELETE THE `read`
 * QUESTION.** "How many hundreds in 3,482?" with THOUSANDS · HUNDREDS · TENS · ONES printed under
 * the digits is answerable by reading a caption — the child never counts a place. On a `write` round
 * the same labels are scaffolding for a number arriving by ear and give nothing away, because the
 * child still has to hear which part is which.
 */
/**
 * ⚠️ `over` IS THE COLUMN THE CARRIED DIGIT WOULD LAND IN, AND IT IS NOT HOT/COLD. It says WHERE,
 * never whether that is right — the same distinction the craft doc draws for the live readout on a
 * finger count. Without it a child opening their fingers has no idea which column they were over,
 * and a drop that lands somewhere they did not aim at is a wrong answer the chapter caused.
 */
function BoardRow({ q, L, entered, active, over, onPick }: {
  q: OdRound; L: ReturnType<typeof boardLayout>
  entered: number[]; active: number; over: number
  onPick?: (i: number) => void
}) {
  return (
    <div style={{ position: 'fixed', left: L.boardLeft, top: L.boardTop, zIndex: 40, display: 'flex', gap: 10 }}>
      {/* ⚠️ the label comes from `colName`, the same function the instruction chip names the column
          under the hand with — two copies would eventually name different columns */}
      {q.answer.map((_, i) => {
        const hot = i === over
        const on = hot || (over < 0 && i === active)
        const v = entered[i]
        return (
          <button key={i} onClick={onPick ? () => onPick(i) : undefined} disabled={!onPick}
            style={{
              width: L.boxW, height: L.boxH, display: 'grid', placeItems: 'center',
              background: hot ? 'rgba(255,236,214,.99)' : 'rgba(255,252,244,.97)',
              cursor: onPick ? 'pointer' : 'default',
              border: `4px solid ${on ? 'var(--milo-orange, #f26b2c)' : 'var(--outline, #3d2516)'}`,
              borderRadius: 10,
              boxShadow: hot ? '0 0 0 9px rgba(242,107,44,.3)'
                : on ? '0 0 0 5px rgba(242,107,44,.22)' : '0 4px 0 rgba(61,37,22,.18)',
              padding: 0, position: 'relative',
            }}>
            <span style={{
              fontFamily: 'var(--font-numeric, var(--font-display))', fontWeight: 900,
              fontSize: Math.round(L.boxH * 0.62), lineHeight: 1, color: 'var(--ink, #3d2516)',
            }}>{v >= 0 ? v : ''}</span>
            {/**
              * ⚠️ THE LABEL SITS ON PAPER, NOT ON THE WALL. Drawn as bare 11px ink at 0.62 opacity it
              * measured as a ghost over a painted gym — and on a `write` round these labels ARE the
              * scaffolding for a number arriving by ear, so scaffolding nobody can read is none.
              */}
            {q.labelled && (
              <span style={{ position: 'absolute', top: '100%', left: '50%', marginTop: 5,
                transform: 'translateX(-50%)', whiteSpace: 'nowrap',
                background: 'rgba(255,252,244,.94)', border: '2px solid var(--outline, #3d2516)',
                borderRadius: 999, padding: '1px 7px',
                fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: .4,
                fontSize: L.short ? 9 : 11, textTransform: 'uppercase',
                color: 'var(--ink, #3d2516)' }}>{colName(q, i)}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** The printed total a `read`/`value` round is about — a plain figure, with no places marked out. */
function Docket({ text, top, vw }: { text: string; top: number; vw: number }) {
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top, zIndex: 39, display: 'grid', placeItems: 'center',
      pointerEvents: 'none' }}>
      <div style={{ background: 'rgba(61,37,22,.9)', color: '#fdf6e8', borderRadius: 10,
        padding: '6px 18px', fontFamily: 'var(--font-numeric, var(--font-display))', fontWeight: 900,
        fontSize: `clamp(20px, ${Math.round(vw * 0.028)}px, 40px)`, letterSpacing: 1 }}>{text}</div>
    </div>
  )
}

// ─── The loose digits ───────────────────────────────────────────────────────────────────
/**
 * THE TRAY'S GEOMETRY. ⚠️ **EXPORTED, AND BOTH THE RENDER AND THE HAND'S HIT-TEST DRIVE THIS ONE
 * FUNCTION.** The tiles are tapped by a finger and dropped on by a carried digit, so where they are
 * is a fact two separate pieces of code need — and a hit-test carrying its own copy of the row's
 * arithmetic is the "gate that re-implements a rule" fault with the two halves of one feature
 * instead of a test and its source. It would drift the first time the tray moved, and the symptom
 * would be a child pinching a tile and picking up nothing.
 */
export function trayLayout(L: ReturnType<typeof boardLayout>, vw: number, vh: number, count: number) {
  const tile = Math.max(40, Math.min(L.trayH - 18, L.short ? 62 : 100))
  const gap = L.short ? 10 : 14
  const w = count * tile + Math.max(0, count - 1) * gap
  const left = Math.round((vw - w) / 2)
  const top = Math.round(vh - 10 - tile)
  return { tile, gap, w, left, top, at: (k: number) => left + k * (tile + gap) }
}

/** Which tile is under a point, or -1. Uses `trayLayout`, never its own copy of the row. */
export function tileHit(
  L: ReturnType<typeof boardLayout>, vw: number, vh: number, count: number,
  p: { x: number; y: number } | null,
): number {
  if (!p) return -1
  const T = trayLayout(L, vw, vh, count)
  // ⚠️ GENEROUS ABOVE THE ROW. The tray sits on the bottom edge with nothing under it and empty
  // floor over it, so a hand arriving a little high is aiming at a tile and nothing else.
  if (p.y < T.top - 26 || p.y > T.top + T.tile + 16) return -1
  /**
   * ⚠️ **NEAREST TILE, NOT "INSIDE A TILE" — THE GAPS BETWEEN THEM ARE NOT A PLACE TO MISS.** A
   * containment test with a few pixels of padding leaves a dead stripe between every pair, and a
   * pinched hand lands in one often enough that picking up reads as broken. Rounding to the nearest
   * pitch can never take the wrong tile: it partitions exactly at the halfway line, which is the
   * widest a tolerance may be (chapter-craft). Past the ends of the row `k` falls out of range, so
   * the rest of the screen is still nothing.
   */
  const pitch = T.tile + T.gap
  const k = Math.round((p.x - (T.left + T.tile / 2)) / pitch)
  return k >= 0 && k < count ? k : -1
}

/**
 * Which box is under a point, or -1.
 *
 * ⚠️ THE CATCH AREA IS LOOSER THAN THE BOX IS DRAWN, and vertically much looser. A pinched hand is
 * not a mouse: the carry point wanders by a few percent of the frame while the fingers open, so a
 * catch area the exact size of the box means a decisive, correct drop lands in the gap between two
 * columns and the digit goes home. The column is the thing being chosen, so the tolerance goes on
 * the axis that is NOT the choice — generous in y, and in x only as far as the halfway line between
 * neighbours, which is the widest it can be without ever making the wrong column win.
 */
export function boxHit(
  L: ReturnType<typeof boardLayout>, slots: number, p: { x: number; y: number } | null,
): number {
  if (!p) return -1
  if (p.y < L.boardTop - 60 || p.y > L.boardTop + L.boxH + 60) return -1
  // ⚠️ nearest column rather than "inside a column", for `tileHit`'s reason: the 10px gap between
  // two boxes was a stripe a decisive, correct drop could land in and go home. Rounding partitions
  // at the halfway line, so the wrong column still cannot win.
  const pitch = L.boxW + 10
  const i = Math.round((p.x - (L.boxAt(0) + L.boxW / 2)) / pitch)
  return i >= 0 && i < slots ? i : -1
}

/**
 * THE TRAY — the round's own digits, scrambled, laid out loose along the bottom.
 *
 * ⚠️ IT IS THE ANSWER SURFACE FOR **BOTH** INPUTS, which is chapter-craft §5's *one instrument, two
 * inputs, one grader*. A finger taps a tile and it goes into the lit box; a pinched hand carries the
 * same tile into whichever column it is dropped on. Both land in `put()`, so the two can never drift
 * into grading differently and one sweep covers them at once.
 *
 * ⚠️ A TILE IS CONSUMED WHEN IT IS PLACED, and that is the manipulative being honest rather than a
 * restriction. There are four digits and four columns; a digit that is up on the board is not also
 * still in the tray, and a child who has placed three can see at a glance that one is left.
 */
function Tray({ tray, used, carried, tile, gap, left, top, onTake, disabled }: {
  tray: number[]; used: number[]; carried: number | null
  tile: number; gap: number; left: number; top: number
  onTake: (k: number) => void; disabled: boolean
}) {
  return (
    <div style={{ position: 'fixed', left, top, zIndex: 55, display: 'flex', gap }}>
      {tray.map((d, k) => {
        const gone = used.includes(k) || carried === k
        return (
          <button key={k} onClick={() => onTake(k)} disabled={disabled || gone}
            style={{
              width: tile, height: tile, borderRadius: 12, padding: 0,
              cursor: disabled || gone ? 'default' : 'pointer',
              // ⚠️ a placed tile leaves its SLOT behind rather than vanishing — the row would
              // re-centre under the child's hand mid-carry, and the tile they were aiming at would
              // move out from under them
              border: `3px ${gone ? 'dashed' : 'solid'} var(--outline, #3d2516)`,
              background: gone ? 'rgba(61,37,22,.12)' : 'var(--paper, #fdf6e8)',
              opacity: disabled && !gone ? .45 : 1,
              fontFamily: 'var(--font-numeric, var(--font-display))', fontWeight: 900,
              fontSize: Math.round(tile * 0.52), color: 'var(--ink, #3d2516)',
            }}>{gone ? '' : d}</button>
        )
      })}
    </div>
  )
}

/** The digit riding under the hand, drawn where the carry point is. */
function Carried({ d, at, tile }: { d: number; at: { x: number; y: number }; tile: number }) {
  return (
    <div style={{ position: 'fixed', left: at.x, top: at.y, zIndex: 62, pointerEvents: 'none',
      transform: 'translate(-50%,-50%)', width: tile, height: tile, borderRadius: 12,
      border: '3px solid var(--milo-orange, #f26b2c)', background: 'var(--paper, #fdf6e8)',
      boxShadow: '0 6px 14px rgba(0,0,0,.35)', display: 'grid', placeItems: 'center',
      fontFamily: 'var(--font-numeric, var(--font-display))', fontWeight: 900,
      fontSize: Math.round(tile * 0.52), color: 'var(--ink, #3d2516)' }}>{d}</div>
  )
}

/**
 * THE HAND'S OWN POINTER, when it is not carrying anything.
 *
 * ⚠️ WITHOUT IT THE CHILD CANNOT AIM, AND THE FULL-SCREEN SELF-VIEW DOES NOT REPLACE IT. Their hand
 * is drawn where the camera sees it; the carry point is that reading stretched through `REACH`, so
 * the two are in different places on purpose — this dot is the one that means anything, and a child
 * reaching for the thousands with no idea where the app thinks their hand is has a gesture that
 * reads as broken.
 */
function HandDot({ at, over }: { at: { x: number; y: number }; over: boolean }) {
  return (
    <div style={{ position: 'fixed', left: at.x, top: at.y, zIndex: 61, pointerEvents: 'none',
      // ⚠️ BIG ENOUGH TO FIND ON A CAMERA PICTURE. An 18px ring over a lit room is a speck, and a
      // child who cannot see where the app thinks their hand is cannot aim at anything.
      transform: 'translate(-50%,-50%)', width: over ? 44 : 30, height: over ? 44 : 30,
      borderRadius: 999, border: '4px solid var(--milo-orange, #f26b2c)',
      background: over ? 'rgba(242,107,44,.4)' : 'rgba(255,255,255,.35)',
      boxShadow: '0 2px 8px rgba(0,0,0,.4)', transition: 'width .12s, height .12s' }} />
  )
}

/**
 * The instruction, as a pure function of the round, the input and what the hand is doing.
 *
 * ⚠️ IT CANNOT GO INPUT-BLIND, and it cannot go STATE-blind either. The Supply Run's finding: the
 * control that names which question is being asked must name the gesture the child actually has, and
 * every state a gesture can be in needs words — not just "ready".
 */
export function writeAsk(
  q: OdRound, input: 'hand' | 'tap',
  st: { full: boolean; carrying: number | null; over: number },
): string {
  /**
   * ⚠️ THE COMMIT IS NAMED PER INPUT TOO, and it is the state where getting that wrong costs most:
   * a child who has built the whole board and is told to reach for a button they were never using
   * has finished the work and cannot hand it in. On the camera path the gesture IS the commit —
   * `Put it up ✓` stays on screen as the same handler's second door, never as the only one.
   */
  if (st.full) {
    return input === 'tap'
      ? 'That is all of it — tap Put it up ✓'
      : 'That is all of it — hold a thumbs up 👍 to put it on the board'
  }
  /**
   * ⚠️ IT HAD TO READ AS A SENTENCE ON *BOTH* BOX COUNTS. Written as `…that goes${where}` with an
   * empty `where` for a single box, the chip rendered "Tap the digit that goes" — a sentence stopping
   * mid-phrase, on the round type a child meets first. Caught by driving it, not by the gate: the
   * chip's assertions checked which WORDS it used and never that it finished.
   */
  const many = q.answer.length > 1
  const where = many ? 'in the lit box' : 'in the box'
  if (input === 'tap') return `Tap the digit that goes ${where}`
  /**
   * ⚠️ EVERY STATE A GESTURE CAN BE IN NEEDS WORDS, not just "ready" — The Fitting Crew's `handHint`
   * finding. Carrying a digit over nothing is the state a child gets stuck in, because the hand is
   * doing the right thing and the screen has no reason to react; without a line saying where it has
   * to go, they open their fingers over the middle of the room and the digit goes home.
   */
  if (st.carrying !== null) {
    /**
     * ⚠️ **NAMING THE COLUMN UNDER THE HAND IS NOT HOT/COLD — it says WHERE, never whether that is
     * right**, exactly like the box lighting up. It is worth the words because it puts the place
     * NAME in front of the child at the one moment the decision is being made, and because a
     * nine-year-old cannot always map a position to a label: on a `read` round the ask has already
     * named the place, and on a `write` round the labels are printed under the boxes anyway.
     */
    return st.over >= 0
      ? `Open your hand to drop the ${st.carrying} into the ${colName(q, st.over)}`
      : many ? 'Carry it over a column, then open your hand'
             : 'Carry it over the box, then open your hand'
  }
  return many
    ? 'Close your hand on a digit, then carry it to the column it belongs in'
    : 'Close your hand on the digit that belongs in the box and carry it up'
}

// ─── The people ─────────────────────────────────────────────────────────────────────────
/** The customer: walks in on their own legs, waits while the board is written, walks off. */
function Customer({ src, h, x, vw, groundPx, leaving, resetKey, line, onArrive }: {
  src: string; h: number; x: number; vw: number; groundPx: number
  leaving: boolean; resetKey: string; line: string
  onArrive?: () => void
}) {
  /**
   * ⚠️ **THEY COME FROM OFF-FRAME, AND THEY COME FROM THE RIGHT.** A move too short to leave the
   * picture is not an arrival, it is a pop with a twitch.
   */
  const inDist = Math.round(Math.max(140, vw - x + h * 0.9))
  const jIn = inFlowJourney(src, h, inDist)
  const jOut = inFlowJourney(src, h, inDist)

  /** ⚠️ **THE BUBBLE WAITS FOR THE WALK-IN** — it renders outside the travelling element, so without
   *  this it sits at the destination with its tail on empty ground for the whole journey. */
  const [here, setHere] = useState(false)
  const arrivedRef = useLatestRef(onArrive)
  useEffect(() => {
    setHere(false)
    const t = window.setTimeout(() => { setHere(true); arrivedRef.current?.() }, jIn.ms)
    return () => window.clearTimeout(t)
  }, [resetKey, jIn.ms])
  /** ⚠️ CLAMPED INTO THE FRAME, TAIL STAYS ON THE MOUTH — centred on a customer at x=1187 it
   *  measured l963 → r1423 on a 1280px frame, i.e. 143px of the question cut off the edge. */
  const bubW = Math.min(vw * 0.52, 460)
  const half = bubW / 2 + 12
  const centre = Math.max(half, Math.min(x, vw - half))
  const shift = centre - x
  return (
    <div style={{ position: 'fixed', left: x, top: groundPx, transform: 'translate(-50%,-100%)', zIndex: 35 }}>
      {here && !leaving && line && (
        <div style={{ position: 'absolute', bottom: h * 0.86, left: shift, transform: 'translateX(-50%)',
          width: 'max-content', maxWidth: bubW, zIndex: 3,
          background: 'rgba(255,252,244,.96)', border: '3px solid var(--outline, #3d2516)', borderRadius: 16,
          padding: '8px 14px', fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 'clamp(13px,1.8vw,22px)', color: 'var(--ink, #3d2516)', lineHeight: 1.35,
          boxShadow: '0 4px 0 rgba(61,37,22,.18)' }}>
          {line}
          <span aria-hidden style={{ position: 'absolute', bottom: -10, left: `calc(50% - ${shift}px)`, marginLeft: -7,
            width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
            borderTop: '10px solid var(--outline, #3d2516)' }} />
        </div>
      )}
      <Arrive dist={inDist} ms={leaving ? jOut.ms : jIn.ms} leave={leaving} resetKey={resetKey}>
        {moving => (
          <span style={{ display: 'block', position: 'relative' }}>
            <Shadow w={Math.round(h * 0.62)} h={Math.round(h * 0.14)} />
            {/* ⚠️ FACING FOLLOWS TRAVEL, NOT THE ART. Every sprite faces RIGHT, so walking in from
                the right edge means flipped, and standing flipped is correct — the board is to
                their left. Leaving, they turn round and go back out unflipped. */}
            <SheetCell src={src} h={h} facesLeft={!leaving} moving={moving}
              cycleScale={leaving ? jOut.cycleScale : jIn.cycleScale} />
          </span>
        )}
      </Arrive>
    </div>
  )
}

/**
 * Milo at the tally table.
 *
 * ⚠️ HE DOES NOT WALK, and that was measured rather than chosen on the previous cut: walking him to
 * whichever column was being filled put him standing on that column's own label. The JOURNEY belongs
 * to the customer. A stationary character PAUSES its cycle — a cycle looping on someone standing
 * still is skating on the spot.
 */
function MiloClerk({ h, x, groundPx, busy }: { h: number; x: number; groundPx: number; busy: boolean }) {
  return (
    <div style={{ position: 'fixed', left: x, top: groundPx, transform: 'translate(-50%,-100%)',
      zIndex: 36, pointerEvents: 'none' }} data-milo>
      <span style={{ display: 'block', position: 'relative', animation: busy ? 'od_hand .42s ease' : undefined }}>
        <Shadow w={Math.round(h * 0.6)} h={Math.round(h * 0.14)} />
        <SheetCell src="/assets/characters/milo_side.png" h={h} moving={false} facesLeft={false} />
      </span>
    </div>
  )
}

// ─── Play ───────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'

export const OrderPlay: React.FC<{ data: OdRound; mode: Mode; onComplete: (correct: boolean) => void }> =
  ({ data, mode, onComplete }) => {
    const { w: vw, h: vh } = useViewport()
    const { read, input } = useHand()
    const onCam = input === 'hand'
    const slots = data.answer.length
    const L = boardLayout(vw, vh, data.yard.groundY, slots)
    const T = trayLayout(L, vw, vh, data.tray.length)
    const hasVoice = useHasVoice()

    const [entered, setEntered] = useState<number[]>(() => data.answer.map(() => -1))
    /**
     * WHICH TILE went into which box, or -1. ⚠️ IT IS A SECOND ARRAY RATHER THAN `entered` HOLDING
     * TILE INDICES, so `grade`/`missFor` keep taking plain digits and neither they nor the gate that
     * drives them had to change for a new input. It exists at all because a tray can hold the same
     * digit twice (3,4,4,2) and "which 4 has been used" is not derivable from the digits alone.
     */
    const [usedTile, setUsedTile] = useState<number[]>(() => data.answer.map(() => -1))
    const [active, setActive] = useState(0)
    /** the tile currently in the child's pinched hand, or null */
    const [carry, setCarry] = useState<number | null>(null)
    const [sent, setSent] = useState(false)
    const [miss, setMiss] = useState<string | null>(null)
    const [ready, setReady] = useState(false)
    const erred = useRef(false), done = useRef(false)
    // ⚠️ A mirror ref, because a handler must never read state it also sets: four taps inside ONE
    // React batch all saw the same stale array and only one registered. This repo has met that
    // shape five times (placeValue's undo, CoinShop's lay, TickTock's lesson dial, the parade).
    const enteredRef = useRef(entered)
    const usedRef = useRef(usedTile)
    /**
     * ⚠️ AND SO IS THE ACTIVE BOX, FOR THE SAME REASON — this is the sixth time this repo has met the
     * shape and the first cut of this file shipped it. `put()` closes over `active`, so a child
     * tapping 8-0-5-4 fast enough to land inside ONE React batch writes all four digits into box 0
     * and the other three boxes stay empty. `setActive(a => …)` being functional does not save it:
     * the STATE advances correctly and the closure the next tap runs is still the old one. Distinct
     * human taps are usually separate ticks; that is not a guarantee, which is why the rule is never
     * read state you also set inside a handler.
     */
    const activeRef = useRef(0)
    /** ⚠️ SAME RULE FOR THE CARRIED TILE — the drop handler both reads and clears it. */
    const carryRef = useRef<number | null>(null)

    // the round resets during RENDER, not in an effect — an effect runs after paint and the
    // previous round's answer is painted for one frame under the new question
    const sig = `${data.qType}|${data.n}|${data.focus}`
    const [seen, setSeen] = useState(sig)
    if (seen !== sig) {
      setSeen(sig)
      const blank = data.answer.map(() => -1)
      setEntered(blank); enteredRef.current = blank
      setUsedTile(blank.slice()); usedRef.current = blank.slice()
      setActive(0); activeRef.current = 0
      setCarry(null); carryRef.current = null
      setSent(false); setMiss(null); setReady(false)
      erred.current = false; done.current = false
    }

    /**
     * Put a digit into a box and consume the tile it came from. ⚠️ BOTH INPUTS LAND HERE — a tap
     * fills the LIT box, a hand fills the box it was dropped on, and that is the only difference
     * between them. See `Tray`.
     */
    const put = useCallback((tileIdx: number, boxIdx: number) => {
      if (done.current || sent) return
      const i = Math.max(0, Math.min(boxIdx, slots - 1))
      const next = enteredRef.current.slice()
      const tiles = usedRef.current.slice()
      // ⚠️ dropping onto a FULL box swaps: the tile already there goes back to the tray rather than
      // being destroyed, or a child who mis-drops the thousands has lost a digit they still need
      const evicted = tiles[i]
      next[i] = data.tray[tileIdx]
      tiles[i] = tileIdx
      enteredRef.current = next; usedRef.current = tiles
      activeRef.current = next.findIndex(v => v < 0) >= 0
        ? next.findIndex(v => v < 0)
        : Math.min(i + 1, slots - 1)
      setEntered(next); setUsedTile(tiles); setActive(activeRef.current)
      void evicted
    }, [slots, sent, data.tray])

    /** Take the last-placed digit back off the board. ⚠️ It frees its tile too — see `Tray`. */
    const back = useCallback(() => {
      if (done.current || sent) return
      const next = enteredRef.current.slice()
      const tiles = usedRef.current.slice()
      // step back to the last written box and lift it out — ⌫ on an empty box goes to the one before
      const a = activeRef.current
      const i = next[a] >= 0 ? a : Math.max(0, a - 1)
      next[i] = -1
      tiles[i] = -1
      enteredRef.current = next; usedRef.current = tiles
      activeRef.current = i
      setEntered(next); setUsedTile(tiles); setActive(i)
    }, [sent])

    /**
     * ⚠️ THE HELD-OVER GUARD. A pinch already closed when the round opened is not a pick-up: a tap is
     * consumed but a pose is not, so without the baseline a child still pinching from the last
     * question grabs a tile the instant the board changes. Seeded from the CURRENT reading on the
     * mount render — `useRef(0)` never fires the reset block on a fresh mount, which is the bug a
     * previous cut shipped and had to be driven to find.
     */
    const armed = useRef(read.grabs)
    if (seen !== sig) armed.current = read.grabs
    const live = onCam && read.grabs > armed.current && !sent
    const held = live && read.penDown
    /** the carry point, in SCREEN pixels — see `handPoint` for why it is not the raw frame */
    const at = onCam && read.pen ? handPoint(read.pen, vw, vh) : null
    const overBox = live ? boxHit(L, slots, at) : -1
    const overTile = live ? tileHit(L, vw, vh, data.tray.length, at) : -1

    /**
     * THE PICK-UP AND THE DROP.
     *
     * ⚠️ IN AN EFFECT ON THE *EDGE*, never derived during render. Closing and opening are events —
     * the pinch state is a level — and a render-time reaction would fire on every one of the ~30
     * frames a second the carry point moves.
     *
     * ⚠️ AND THE POINT IS READ FROM A REF, so the drop uses where the hand WAS when the fingers
     * opened rather than where the effect's closure was created.
     */
    const atRef = useLatestRef(at)
    const putRef = useLatestRef(put)
    const trayRef = useLatestRef(data.tray)
    useEffect(() => {
      if (!live) return
      if (held) {
        const k = tileHit(L, vw, vh, trayRef.current.length, atRef.current)
        // ⚠️ a tile already on the board cannot be picked up again — `usedRef` is the same list the
        // tray greys out, so what the child sees and what the hand can grab cannot disagree
        if (k >= 0 && !usedRef.current.includes(k)) { setCarry(k); carryRef.current = k }
        return
      }
      const c = carryRef.current
      if (c === null) return
      const b = boxHit(L, slots, atRef.current)
      // ⚠️ OPENING OVER NOTHING PUTS IT BACK, it does not drop it into the nearest column. A digit
      // landing somewhere the child did not aim at is a wrong answer the chapter caused, which is
      // the whole reason `stepPinch` confirms its release over three frames.
      if (b >= 0) putRef.current(c, b)
      setCarry(null); carryRef.current = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [held, live])

    const commit = useCallback(() => {
      if (done.current || sent) return
      const cur = enteredRef.current
      if (cur.some(v => v < 0)) { setMiss(missFor(data, cur)); return }
      const ok = grade(data, cur)
      if (!ok) {
        erred.current = true
        setMiss(missFor(data, cur))
        // the board re-opens: a wrong answer clears what was written AND puts every tile back, so
        // the retry starts from the same tray the round started with
        const blank = data.answer.map(() => -1)
        window.setTimeout(() => {
          setEntered(blank); enteredRef.current = blank
          setUsedTile(blank.slice()); usedRef.current = blank.slice()
          setActive(0); activeRef.current = 0; setMiss(null)
        }, 2400)
        return
      }
      done.current = true
      setSent(true)
      setMiss(null)
      window.setTimeout(() => onComplete(!erred.current), 1500)
    }, [data, sent, onComplete])

    // ⚠️ Spoken on ARRIVAL, not on mount — the customer asking before they have walked in is the
    // same fault as the bubble showing early, in the other channel.
    useEffect(() => {
      if (!ready) return
      // `speakAfterCurrent`: the customer arrives while the previous round's line may still be
      // running, and their question must not take it away mid-word.
      speakAfterCurrent(data.ask)
      return () => stopSpeech()
    }, [ready, data.ask])

    const full = entered.every(v => v >= 0)
    const line = miss ?? (sent ? 'Up it goes — thank you!' : ready ? data.ask : '')

    /**
     * 👍 PUTS THE BOARD UP — the founder's replacement for reaching back to the button once every
     * digit is in its column.
     *
     * ⚠️ **THE BUTTON STAYS, AND THE GESTURE FIRES THE SAME HANDLER.** The Supply Run's finding, and
     * this chapter is the exact case it warns about: replace the only commit-feeding control with a
     * readout and a working camera that cannot read one particular child's pose leaves them with a
     * finished board, nothing to press, no wrong answer, no re-teach and no `CamGate` (that renders
     * only when the camera failed to START). One element, two ways to fire it, no dead end.
     *
     * ⚠️ ON THE RISING EDGE, which is also the held-over-pose guard for free. `thumbsUp` is a LEVEL,
     * so a thumb still up from the previous round would commit the next board the instant its last
     * digit landed — a round graded by a hand the child had not moved. The ref outlives the round
     * reset on purpose: they have to lower it and raise it again.
     *
     * ⚠️ AND IT IS GATED ON `full`, which is the other half of the separation from the fist that
     * GRABS. Nothing is left to pick up once the board is complete, so the two poses can never both
     * be live at once.
     */
    const commitRef = useLatestRef(commit)
    const thumbWas = useRef(false)
    useEffect(() => {
      const up = onCam && read.thumbsUp
      const was = thumbWas.current
      thumbWas.current = up
      if (up && !was && full && ready && !sent) commitRef.current()
    }, [read.thumbsUp, onCam, full, ready, sent])

    return (
      <>
        {/* ⚠️ ON THE CAMERA PATH THE CHILD'S OWN ROOM IS THE BACKDROP — the full-screen self-view is
            mounted behind this by the shell, and painting the yard over it would simply hide it. */}
        {!onCam && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden' }}>
            <SceneBg src={data.yard.scene} priority />
          </div>
        )}

        {/* the figure a read/value round is about, or — on a silent device — the words a write
            round would otherwise only speak */}
        {/**
          * ⚠️ THE ASK MOVES OUT OF THE BUBBLE WHERE IT WOULD COVER THE ANSWER. See `boardLayout`:
          * on a short landscape frame the bubble and the boxes do not fit beside one another at the
          * tap floor, and a question drawn over the boxes is worse than one drawn in a banner. The
          * customer is still on screen and still says it aloud — what is lost is the tail, not the
          * speaker.
          */}
        {L.askAtTop && ready && !sent && (
          <div style={{ position: 'fixed', left: 0, right: 0, top: 8, zIndex: 41, display: 'grid',
            placeItems: 'center', padding: '0 96px', pointerEvents: 'none' }}>
            <span style={{ background: 'rgba(255,252,244,.96)', border: '3px solid var(--outline, #3d2516)',
              borderRadius: 14, padding: '6px 14px', maxWidth: '100%', textAlign: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: L.short ? 13 : 16,
              lineHeight: 1.3, color: 'var(--ink, #3d2516)' }}>{line}</span>
          </div>
        )}
        {/* ⚠️ NOTHING IS PRINTED WHILE THE CHILD WORKS — see `saidAmount`. The one exception is a
            silent device on a `write` round, where the total is otherwise ONLY spoken and the round
            would be unanswerable; a one-digit round needs no fallback, because its ask is written in
            the bubble either way. */}
        {data.qType === 'write' && !hasVoice && ready && <Docket text={numWords(data.n)} top={L.docketTop} vw={vw} />}

        <BoardRow q={data} L={L} entered={entered} active={active}
          over={carry !== null ? overBox : -1}
          onPick={sent ? undefined : (i => { activeRef.current = i; setActive(i) })} />

        {!sent && (
          <Tray tray={data.tray} used={usedTile} carried={carry}
            tile={T.tile} gap={T.gap} left={T.left} top={T.top}
            disabled={!ready}
            /** the tap path: a tile goes into the LIT box, which `BoardRow` lets the child move */
            onTake={k => put(k, activeRef.current)} />
        )}

        {/* the hand itself — where the app thinks it is, and what it is holding */}
        {live && at && carry === null && <HandDot at={at} over={overTile >= 0} />}
        {live && at && carry !== null && <Carried d={data.tray[carry]} at={at} tile={T.tile} />}

        {/* ⚠️ THE HAND OWNS THE VALUE; TAPS OWN THE ACTIONS. Taking a digit back off the board and
            putting the board up are discrete, so they stay buttons on both paths. */}
        {/**
          * ⚠️ **ONE ROW — THE TWO ACTIONS AND THE INSTRUCTION TOGETHER, INSET PAST THE CAST.** All
          * three were pinned separately first and every pair of them collided somewhere: `Put it up
          * ✓` in the frame's corner was drawn straight ON the self-view panel at 1280×720 (the
          * button you press covering the picture of your own hand — the same fault a previous cut
          * shipped with the writing pane), `↩ take it back` sat on Milo's leg, and at 640×320 the
          * chip was drawn across BOTH buttons. The taps still landed in every case, which is exactly
          * why only crossing every layer with every other finds them. (The self-view is full-screen
          * now and behind everything, so it is no longer one of the layers to keep out of.)
          *
          * ⚠️ AND THE CHIP IS THE ONE THAT GIVES. The buttons are tap targets and may not shrink;
          * the words can wrap to a second line, which on a 320px-tall frame is the only thing here
          * that has any room left to give.
          */}
        {!sent && (
          <div style={{ position: 'fixed', left: L.side + 10, right: L.side + 10,
            bottom: L.trayH + 12, zIndex: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={back} disabled={!entered.some(v => v >= 0)}
              style={{ flex: '0 0 auto',
                padding: L.short ? '8px 12px' : '9px 16px', borderRadius: 999,
                border: '3px solid var(--outline, #3d2516)',
                background: 'var(--paper, #fdf6e8)', opacity: entered.some(v => v >= 0) ? 1 : .45,
                cursor: entered.some(v => v >= 0) ? 'pointer' : 'default',
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: L.short ? 13 : 15,
                color: 'var(--ink, #3d2516)' }}>↩ take it back</button>
            {/* the instruction — input-aware AND state-aware */}
            <span style={{ flex: '1 1 auto', textAlign: 'center', pointerEvents: 'none' }}>
              {ready && (
                <span style={{ background: 'rgba(61,37,22,.88)', color: '#fdf6e8', borderRadius: 14,
                  padding: '5px 12px', display: 'inline-block',
                  fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.25,
                  fontSize: L.short ? 12 : 14 }}>
                  {writeAsk(data, onCam ? 'hand' : 'tap',
                    { full, carrying: carry === null ? null : data.tray[carry], over: overBox })}
                </span>
              )}
            </span>
            <button onClick={commit} disabled={!full || !ready}
              style={{ flex: '0 0 auto',
                padding: L.short ? '9px 14px' : '11px 20px', borderRadius: 999,
                border: '4px solid var(--outline, #3d2516)',
                background: full ? 'var(--milo-orange, #f26b2c)' : 'var(--paper, #fdf6e8)',
                color: full ? '#fff' : 'var(--ink, #3d2516)', opacity: full && ready ? 1 : .5,
                cursor: full && ready ? 'pointer' : 'default',
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: L.short ? 14 : 16,
              }}>Put it up ✓</button>
          </div>
        )}

        {/* the reveal, after the commit and never before */}
        {sent && (
          <div style={{ position: 'fixed', left: 0, right: 0, top: L.boardBottom + 10,
            zIndex: 58, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(255,252,244,.97)', border: '4px solid var(--outline, #3d2516)',
              borderRadius: 14, padding: '8px 18px', fontFamily: 'var(--font-display)', fontWeight: 900,
              fontSize: L.short ? 15 : 19, color: 'var(--ink, #3d2516)' }}>
              {data.focus >= 0
                ? `${data.answer[0]} ${data.answer[0] === 1 ? PLACE_NAME[PLACES[data.focus]].one : PLACE_NAME[PLACES[data.focus]].many} = ${money(data.answer[0] * PLACES[data.focus])}`
                : `${numWords(data.n)} = ${money(data.n)}`}
            </div>
          </div>
        )}

        <MiloClerk h={L.peopleH} x={L.miloX} groundPx={L.groundPx} busy={entered.some(v => v >= 0)} />
        <Customer src={data.yard.customer} h={L.peopleH} x={L.custX} vw={vw} groundPx={L.groundPx}
          leaving={sent} resetKey={sig} line={L.askAtTop ? '' : line} onArrive={() => setReady(true)} />
        {mode === 'guided' && !sent && ready && (
          <div style={{ position: 'fixed', left: 12, top: CHROME_BOTTOM + 7, zIndex: 60, background: 'rgba(253,246,232,.9)',
            border: '3px solid var(--outline, #3d2516)', borderRadius: 999, padding: '4px 12px',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12,
            color: 'var(--ink, #3d2516)' }}>Your turn — I will help</div>
        )}
      </>
    )
  }

// ─── Answering with the hand ────────────────────────────────────────────────────────────
/**
 * READING **E** — pinch to pick a digit up, carry it, open your fingers to put it in a column.
 *
 * ⚠️ **THE DROP CHOOSES THE COLUMN, WHICH IS THE ONLY REASON A CAMERA IS HONEST HERE.**
 * chapter-craft §5: *a pinch used as a cursor is a mouse with extra steps and a permission prompt.*
 * This passes because WHERE the hand lets go is the answer — the same 4 released over the hundreds
 * is 400 and over the tens is 40, so the child's arm performs the exact misconception the chapter
 * exists to break. If the pinch merely pressed a digit button it would not ship.
 *
 * ⚠️ AND IT DOES NOT REPLACE THE TRAY. The Supply Run's headline finding, and the most expensive
 * thing on this list: a working camera that cannot read a particular child's hand — small hands, low
 * light, a dim room — must not leave them with nothing to press. `CamGate` renders only when the
 * camera failed to START, so a camera that runs and reads badly shows nothing at all. The tray is
 * drawn on BOTH paths and both call `put()`, which stays a single greppable call site.
 */
const SKIN: HandSkin = {
  accent: '#f26b2c', accentSoft: 'rgba(242,107,44,.4)', ink: '#3d2516', muted: '#8a7461',
  panel: 'rgba(253,246,232,.96)', line: '#3d2516', onAccent: '#fff',
  font: 'var(--font-display)', mono: 'var(--font-numeric)',
}

// ─── The chalkboard ─────────────────────────────────────────────────────────────────────
/**
 * THE 12–18 BAND’S CHALKBOARD — `Chalkboard`, `GotIt`, `ThePlan` and `StepBoard` now live in
 * `./chalkboard`, shared with The Long Level, which became the second consumer. The reasoning that
 * was written here (the framed board vs the slab fault, `--font-chalk` on `:root`, the windowing, and
 * why this board hangs from the FLOOR while the rounding chapter hangs it from the chrome) moved with
 * it. THE PLAN’s words stay here, because the board is shared and the words are not.
 */
const PLAN_PROBLEM = 'The board says $3,482 — so which of those digits is the hundreds, and where would each one go if I only said the total out loud?'
const PLAN_POINTS = [
  'Where a digit SITS is what it is worth — the same 4 is 400 in one column and 40 in the next.',
  'Count the places from the RIGHT: ones, tens, hundreds, thousands.',
  'An empty column is a zero — and the zero still has to be written.',
]
/** The Menu button's own bottom edge (12 top + 41 tall), so the sheet clears it by measurement
 *  rather than by a guess — this chapter's chrome has bitten a bubble here before. */
const CHROME_BOTTOM = 51


// ─── Demo / re-teach ────────────────────────────────────────────────────────────────────
/**
 * ⚠️ SELF-PACED, with `speak()` alongside — never `speakSteps`. It reveals each visual from the
 * utterance's `onstart`, and Chrome and Safari both start the first line then silently drop the
 * rest, freezing the teaching for ever on a device that HAS a voice.
 */
function dwellFor(line: string) { return Math.max(2300, Math.min(6400, line.length * 72)) }

export const OrderExplain: React.FC<{ data: OdRound; onDone: () => void; onSkip?: () => void }> = ({ data, onDone, onSkip }) => {
  const { w: vw, h: vh } = useViewport()
  const slots = data.answer.length
  const L = boardLayout(vw, vh, data.yard.groundY, slots)
  const [step, setStep] = useState(0)
  const [entered, setEntered] = useState<number[]>(() => data.answer.map(() => -1))
  const [board, setBoard] = useState<string[]>([])
  const doneRef = useLatestRef(onDone)

  /**
   * ⚠️ BABY STEPS — ONE IDEA, ONE SPOKEN LINE, ONE BOARD LINE, ONE CHANGE ON SCREEN.
   *
   * ⚠️ EACH STEP CARRIES ITS OWN `entered`, so the scene is a pure function of the step index and
   * the two can never drift. A demo beat that narrates one arrangement while the scene shows another
   * is a fault this repo has shipped (The Supply Run's remainder went into a van while Milo said it
   * stayed behind), and it is invisible because the WORDS are right and only the numbers disagree.
   *
   * ⚠️ AND THE COLUMNS ARE COUNTED OUT LOUD, FROM THE RIGHT, ONE AT A TIME. That is the method the
   * chapter now tests and the previous cut never taught: it loaded bundles, which shows what a place
   * is WORTH and never shows how you find WHICH place a digit is in.
   */
  const beats = useMemo(() => {
    const out: { say: string; board?: string; entered: number[] }[] = []
    const places = placesFor(data.n)
    const digs = data.answer

    if (data.focus >= 0) {
      const p = PLACES[data.focus]
      const all = digitsOf(data.n).slice(PLACES.length - places.length)
      out.push({ say: data.ask, entered: [-1] })
      // ⚠️ "you count them from the RIGHT" was written against a printed numeral to run a finger
      // along. Nothing is printed now — the total arrives in words — so the same order is taught on
      // the thing that IS on screen: take the words apart from the END.
      out.push({ say: 'Every place has a name, and they run from the RIGHT — so take the words apart from the end.', entered: [-1] })
      // walk right→left, naming each place until the asked-for one is reached
      const idx = places.indexOf(p)
      for (let k = places.length - 1; k >= idx; k--) {
        const nm = PLACE_NAME[places[k]].goods
        out.push({
          say: k === places.length - 1 ? `The last one is the ones — that is the ${all[k]}.` : `Next along is the ${nm} — that is the ${all[k]}.`,
          board: `${nm}: ${all[k]}`, entered: [-1],
        })
      }
      out.push({ say: `So the ${PLACE_NAME[p].goods} is ${digs[0]}. That is what goes in the box.`, board: `${PLACE_NAME[p].goods} = ${digs[0]}`, entered: [digs[0]] })
      out.push({ say: `${digs[0]} ${digs[0] === 1 ? PLACE_NAME[p].one : PLACE_NAME[p].many} — ${money(digs[0] * p)}.`, entered: [digs[0]] })
      return out
    }

    out.push({ say: data.ask, entered: digs.map(() => -1) })
    out.push({ say: 'Nothing is written up yet, so we take the words apart, biggest part first.', entered: digs.map(() => -1) })
    const cur = digs.map(() => -1)
    for (let i = 0; i < places.length; i++) {
      const p = places[i], v = digs[i]
      cur[i] = v
      /**
       * ⚠️ A ZERO IS SAID OUT LOUD AT THE PLACE IT HAPPENS. An empty column is the whole point of a
       * placeholder, and a child who has only met full numbers writes 3,42 for three thousand and
       * forty-two. The words for that number never mention the hundreds, so the silence is exactly
       * where the mistake comes from and it has to be named.
       */
      out.push({
        say: v === 0
          ? `I never said any hundreds — so the ${PLACE_NAME[p].goods} column is a zero, and the zero still gets written.`
          : `${numWords(v * p)} — so ${v} goes in the ${PLACE_NAME[p].goods}.`,
        board: `${PLACE_NAME[p].goods}: ${v}`,
        entered: cur.slice(),
      })
    }
    out.push({ say: `Read it back: ${money(data.n)}. That is the board done.`, board: `= ${money(data.n)}`, entered: digs.slice() })
    return out
  }, [data])

  const lines = useMemo(() => beats.map(b => b.say), [beats])

  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!ready) return
    let alive = true
    const timers: number[] = []
    let i = 0
    let waiting: (() => void) | null = null
    const run = () => {
      if (!alive) return
      setStep(i)
      speak(lines[i])
      // the scene is a function of the step, never of a separate schedule
      setEntered(beats[i].entered)
      setBoard(beats.slice(0, i + 1).map(b => b.board).filter(Boolean) as string[])
      // ⚠️ THE DWELL IS A FLOOR, NOT THE WHOLE STORY. `dwellFor` caps at 6400ms and a real clip of
      // these lines runs past it, so the next step used to land mid-sentence and cancel it.
      // `afterSpeech` holds the step open until Milo stops — under a ceiling, because a walkthrough
      // that can only advance on a speech event freezes on the devices that drop those events.
      const t = window.setTimeout(() => {
        waiting = afterSpeech(() => {
          waiting = null
          if (!alive) return
          i++
          if (i < lines.length) run()
          else window.setTimeout(() => alive && doneRef.current(), 1300)
        }, 9000)
      }, dwellFor(lines[i]))
      timers.push(t)
    }
    run()
    return () => { alive = false; waiting?.(); timers.forEach(window.clearTimeout); stopSpeech() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const key = `demo|${data.n}|${data.qType}`
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden' }}>
        <SceneBg src={data.yard.scene} priority />
      </div>
      {/* the walkthrough always SHOWS what it is working from — it is teaching, not measuring */}
      <Docket text={numWords(saidAmount(data))} top={L.docketTop} vw={vw} />
      <BoardRow q={data} L={L} entered={entered} active={-1} over={-1} />
      {board.length > 0 && <StepBoard lines={board} vw={vw} vh={vh} />}
      {/* ⚠️ ONLY WHERE A SKIP IS OFFERED — the re-teach passes none, because a child who has just
          missed three in a row is exactly the one who must not be given a way past the explanation. */}
      {onSkip && ready && <GotIt onSkip={onSkip} style={{ position: 'fixed', right: 14, bottom: 12, zIndex: 60 }} />}
      <MiloClerk h={L.peopleH} x={L.miloX} groundPx={L.groundPx} busy={entered.some(v => v >= 0)} />
      <Customer src={data.yard.customer} h={L.peopleH} x={L.custX} vw={vw} groundPx={L.groundPx}
        leaving={false} resetKey={key} line={ready ? lines[step] : ''}
        onArrive={() => setReady(true)} />
    </>
  )
}

// ─── Beat ───────────────────────────────────────────────────────────────────────────────
export function makeBeat(): Beat<OdRound> {
  return {
    skillId: 'bigNumbers', rounds: 10,
    make: (d, round, asked) => makeRound((d || 1) as 1 | 2 | 3, (round ?? 0) + 3, asked ?? []),
    // MATH ONLY. Include the yard and the same question comes back the moment the scene rotates.
    sig: d => `${d.qType}|${d.n}|${d.focus}`,
    // Every question type must be asked before mastery may end the run: a strong child is otherwise
    // asked ~3 at L1, ONE at L2 and TWO at L3, so `value` would simply never come up.
    coverage: { of: d => d.qType, all: Q_ALL },
    // The customer says what is wrong, at their own mouth. The shared centred pill would land on
    // the board and contradict it.
    ownsFeedback: true,
    prompt: () => '',
    // ⚠️ NO `say`. The chapter speaks the ask itself, on the customer's ARRIVAL, and a `say` here
    // would be the same line queued a second time now that the shell waits its turn.

    Play: ({ data, onSubmit }) => <OrderPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <OrderExplain data={data} onDone={onDone} />,
  }
}

// ─── The chapter ────────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'plan' | 'demo' | 'guided' | 'practice'

export const OD_CSS = `
@keyframes od_hand { 0%,100%{transform:translateY(0)} 45%{transform:translateY(-6px)} }
`

export default function OrderDesk({ onFinish, onExit }: {
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const [phase, setPhase] = useChapterPhase<Phase>('intro', { chapter: 'bigNumbers', phase: 'practice' })
  const [demoIdx, setDemoIdx] = useState(0)
  const [shipped, setShipped] = useState<number[]>([])
  const pending = useRef<number | null>(null)      // the cumulative arc — OUTSIDE SkillBeat
  const needsRotate = useNeedsRotate()
  const { w: vw } = useViewport()
  const { exit, tally } = useChapterShell(onFinish, onExit)
  const beat = useMemo(() => makeBeat(), [])

  // ⚠️ FORCED, not nudged. The demo must OPEN on the read — counting the places from the right is
  // the method everything else rests on — and then show the write. Leaving it to `asked` meant both
  // demos could come out as the same type.
  const DEMO = useMemo(() => [makeRound(1, 0, [], 'read'), makeRound(1, 1, [], 'write')], [])
  const GUIDED = useMemo(() => makeRound(1, 2, [], 'read'), [])

  // ⚠️ a WHITE nib over a camera picture, not the chapter's ink brown — the mark has to read against
  // whatever room the child is sitting in
  const marker = useMemo(() => ({ fill: '#f26b2c', ink: '#ffffff' }), [])
  const hand = useHandInput({ reads: 'trace', marker })

  // ⚠️ Below every hook. An early return above one changes the hook count when the phone turns and
  // React tears the chapter into the error boundary.
  if (needsRotate) return <RotateGate line="The fundraiser board needs a wide screen to lay the columns out! 💰" />

  const onCam = hand.input === 'hand'
  /**
   * ⚠️ ONLY WHERE THE CHILD ANSWERS, not merely past the intro. `CamGate` is a full-screen panel, so
   * gating it on "not intro" puts a camera prompt over THE PLAN and over both walkthroughs — the
   * teaching covered by a permission dialog for a gesture that is not wanted yet.
   */
  const inWorld = phase === 'guided' || phase === 'practice'

  return (
    <HandProvider value={{ read: hand.read, input: hand.input }}>
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#a99a86' }}>
      <style>{CRITTER_CSS + YARD_CSS + CHALK_CSS + OD_CSS}</style>

      {/* ⚠️ MOUNTED FROM THE MOMENT THE CHILD ANSWERS, and merely HIDDEN until the camera is ready —
          the detect loop reads the video element's own box, and an unmounted one measures 0×0. */}
      {inWorld && onCam && (
        <CamView videoRef={hand.videoRef} canvasRef={hand.canvasRef}
          w={vw} full
          skin={SKIN} hidden={!hand.camReady} />
      )}
      {inWorld && onCam && !hand.camReady && (
        <CamGate status={hand.status} error={hand.error} skin={SKIN}
          onTaps={hand.useTaps} onRetry={hand.useCamera} onExit={exit}
          denied="Milo can watch you carry each digit to its column, or you can tap them across — both put the same number on the board." />
      )}

      <button onClick={exit}
        style={{ position: 'fixed', left: 12, top: 10, zIndex: 60, padding: '7px 14px', minHeight: 44, borderRadius: 999,
          background: 'var(--paper, #fdf6e8)', border: '3px solid var(--milo-orange, #f26b2c)',
          color: 'var(--milo-orange, #f26b2c)', fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 13, cursor: 'pointer' }}>← Menu</button>

      {/* ⚠️ LEFT, never the right corner — SkillBeat draws its own round counter at right:16/top:14
          and LoadingBay's manifest overlapped it by 34 of 40px, reading as one garbled number. */}
      {phase === 'practice' && shipped.length > 0 && (
        <div style={{ position: 'fixed', left: 12, top: CHROME_BOTTOM + 7, zIndex: 60, display: 'flex', gap: 6,
          background: 'rgba(253,246,232,.86)', border: '3px solid var(--outline, #3d2516)',
          borderRadius: 999, padding: '5px 12px', maxWidth: '34vw', flexWrap: 'wrap' }}>
          {shipped.map((n, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15,
              color: 'var(--ink, #3d2516)' }}>{fmt(n)}</span>
          ))}
        </div>
      )}

      {phase === 'intro' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(20,14,8,.55)', padding: 20 }}>
          {/* ⚠️ NO maxHeight/overflow HERE, AND THAT IS MEASURED RATHER THAN AN OVERSIGHT. A guard
              was added and then removed: A/B'd in the live DOM, the uncapped card fits unaided down
              to a 268px-tall frame, while capping it moved the first clip off the decorative top
              corner and ONTO the Start button, behind an undiscoverable scroll. */}
          <div style={{ maxWidth: 520,
            background: 'var(--paper, #fdf6e8)', borderRadius: 22,
            border: '4px solid var(--outline, #3d2516)', padding: '22px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26,
              color: 'var(--ink, #3d2516)', marginBottom: 8 }}>The Fundraiser</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16,
              color: 'var(--ink, #3d2516)', lineHeight: 1.45, marginBottom: 18 }}>
              The board shows what the whole school has raised, and you are the one writing it up.
              In $3,482 the 4 is the hundreds — where a digit sits is what it is worth. Count the
              places from the right, and when Milo calls a total across the hall, put it up.
              {onCam ? ' Close your hand on a digit to pick it up, carry it to the column it belongs in, then open your hand. Thumbs up 👍 when the board is done.' : ''}
            </div>
            {/* ⚠️ BOTH DOORS, EVERY TIME — the device's last pick decides which is the BIG button,
                never which is the only one. Without the second one a child who once tapped "Tap
                instead" is on the number pad for ever: `CamGate` only renders on the CAMERA path,
                so nothing else in the chapter ever offers the camera back. */}
            <button onClick={() => { unlockSpeech(); if (onCam) hand.useCamera(); setPhase('plan') }}
              style={{ padding: '14px 34px', borderRadius: 999, border: '4px solid var(--outline, #3d2516)',
                background: 'var(--milo-orange, #f26b2c)', color: '#fff', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 19 }}>
              {onCam ? 'Turn on the camera ▶' : 'Open the stall ▶'}
            </button>
            <div>
              <button onClick={() => { unlockSpeech(); if (onCam) hand.useTaps(); else hand.useCamera(); setPhase('plan') }}
                style={{ marginTop: 12, border: 'none', background: 'transparent', cursor: 'pointer',
                  // ⚠️ THIS IS THE WAY OUT OF CAMERA MODE, and it measured 21px tall — under WCAG
                  // 2.5.8 AA's 24px floor. An escape hatch a finger keeps missing is the "AR door
                  // that could strand a child" fault wearing a smaller costume. Height is bought in
                  // PADDING so the underlined link looks exactly the same.
                  padding: '12px 8px', minHeight: 44,
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#7a6a55',
                  textDecoration: 'underline' }}>
                {onCam ? 'Tap the digits instead' : 'Move the digits with your hand and the camera'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ IT STILL AUTO-ROLLS — the teaching is never waiting on a tap, because a nine-year-old
          presses whatever big control is offered and then meets a test nothing prepared them for.
          What the founder asked for is the teen band's QUIET way out for a child who is already
          there, so `GotIt` is the smallest thing on the screen rather than the forward path. */}
      {phase === 'plan' && <ThePlan problem={PLAN_PROBLEM} points={PLAN_POINTS} onDone={() => setPhase('demo')} onSkip={() => setPhase('demo')} />}

      {phase === 'demo' && (
        <OrderExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }}
          onSkip={() => setPhase('guided')} />
      )}

      {phase === 'guided' && (
        <OrderPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
      )}

      {phase === 'practice' && (
        <SkillBeat beat={beat}
          /**
           * ⚠️ HELD BACK ONE ROUND. `SkillBeat` fires `onRound` when a round LOADS, so appending here
           * prints the answer to the question still on screen — measured live on the previous cut:
           * the strip read "200 · 552" while the $552 round was open and unanswered. RailLine shipped
           * this exact fault and records it. The strip is the run SO FAR, which is what it claims to
           * be; the last round simply never joins it.
           */
          onRound={(d: OdRound) => setShipped(s => {
            const v = pending.current
            pending.current = d.n
            return v === null ? s : [...s, v]
          })}
          onComplete={tally} />
      )}
    </div>
    </HandProvider>
  )
}
