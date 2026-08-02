'use client'
/**
 * Chapter (9–11) — TIMES TABLES: multiplication fluency + 2-digit × 1-digit (skill `timesTables`)
 * — THE FITTING CREW.
 *
 * Replaces TimesGrid, which was the pre-teen "Number Lab" HUD. See docs/story-9-11-rethink.md §3 for
 * the band-wide audit. FOUR faults this file exists to fix, and all four were live in production:
 *
 *  ⓪ ⚠️ THE CHAPTER PRINTED ITS OWN ANSWER, AT FULL OPACITY, BEFORE THE CHILD ANSWERED. On every
 *    `fact` round the skip-count chips rendered `b, 2b, … a·b` — so `5 × 5 = ?` sat above a strip
 *    reading `5 10 15 20 25`, measured at opacity 1, and the last chip WAS the answer. On every
 *    two-digit round both partial products were on screen (`10 × 4 = 40`, `2 × 4 = 8`). "Read the
 *    last chip, tap that number" beat the whole chapter without knowing one times table, and L1 is
 *    entirely facts. Same family as the DataDeck defect the rethink doc calls the one that is not a
 *    style matter — only worse, because DataDeck's was dimmed and this was not.
 *    ⇒ THE RULE THIS FILE KEEPS: a running total may only ever be the child's OWN WORK APPEARING AS
 *    THEY DO IT. Nothing counts ahead of them. Here the count climbs one rail at a time as they lay
 *    it, and on an `order` round there is no count on screen at all until after the commit.
 *  ① DELETE-THE-ART FAILED. `prompt: '5 × 5 = ?'` over three chips — remove the entire array and
 *    all thirty questions still worked. The array was scenery.
 *  ② ALIVENESS 0 OF 4. Nothing arrived, a tap lit a chip, `<PtMilo left={9} />` was a sticker, and
 *    one `LabBackdrop` served all ten rounds.
 *  ③ THE DEMO DID NOT TEACH. Its first step set `boxValue = answer` while narrating "count up in 4s
 *    with me" — the counting it promised never happened on screen.
 *
 * THE STORY — §0a's second half, *who wants this and why*. Milo runs a fitting crew. A job comes in,
 * the units are on the truck, and the frame is empty. **You cannot count what has not been fitted
 * yet**, so the total has to be worked out before anything happens — which is what multiplication is
 * for. Get it right and the run fills exactly; get it wrong and there are gaps left in it.
 *
 * FOUR SITES, and the site changes every round (the band-wide "a world per round" item):
 *   ☀️ the solar field · 🛰️ the station apron · 💡 the sign shop · 🏷️ the print shop
 * `runOrder` interleaves them so CONSECUTIVE ROUNDS ALWAYS DIFFER and all four are used, and the run
 * is indexed STRAIGHT and never modulo — a plan read `PLAN[round % len]` is how three chapters in
 * this repo quietly re-showed the scene they opened with.
 *
 * THE GESTURE — one frame, two directions, one grader. Both are LAY IT OUT:
 *   • `order` (a × b)     — the job states the rails and how many go on each. The child works out the
 *     TOTAL and orders it on a number pad, then the delivery lays itself and either fills the frame
 *     or leaves gaps. No chips to read off; the pad has no answer in it.
 *   • `fit`   (missing factor) — the total is on the truck and the rail size is given. The child TAPS
 *     RAILS to lay them and stops when the truck is empty. **The answer is the number of rails they
 *     laid**, so it cannot be guessed and it is not picked — it is built, which is MeasureIt's rule.
 *     There are always more empty rails than the job needs and nothing says "that's enough";
 *     deciding is the skill (HomeTime's rule), and tapping a laid rail sends it back to the truck.
 *   • `split` (L3, 2-digit × 1-digit) — an `order` round whose rail is longer than ten, so the frame
 *     carries a WALKWAY after the tenth position. The tens/ones split is therefore a real thing in
 *     the picture rather than a diagram drawn over it, and the demo lays all the tens first and then
 *     all the remainders — which is the area model, performed.
 *
 * ⚠️ NARROWED DELIBERATELY, AND THE REASON IS COUNTABILITY. The old chapter drew two-digit rounds
 * with `n = rint(11, 99)`, which at n = 99 is a 90 × 9 block — **810 nodes at 12px**, i.e. a
 * manipulative nobody counts, so the printed partial products were carrying the whole question. Here
 * `per` tops out at 19 and `rows` at 5, so the largest run is 95 units and the widest rail is 19 —
 * a rail is countable one at a time (the slow correct method), a whole run is not (which is what
 * forces the split). It is the same narrowing OrderDesk made for the same reason. Both answers stay
 * inside two digits, so one two-window pad serves the chapter.
 *
 * ⚠️ THE FRAME IS POSTS AND RAILS, NOT A PANEL. A filled rounded rectangle laid over a painted scene
 * reads as UI furniture however well its colour is matched — BlockYard paid for that three times.
 * The rails are bars on posts with faint notches marking where a unit goes, and the ground under
 * them is a tint that fades out at its own edges.
 *
 * ⚠️ THE UNIT IS THE SITE'S OWN PAINTED OBJECT, NOT A COLOURED BLOCK. A gradient rectangle is what
 * you draw before you have drawn the thing; a child fitting solar panels should see solar panels.
 * Each sprite was generated against the ORIGINAL art (`apple.png`/`cookie.png` — the earliest
 * committed set, because referencing a later AI batch compounds its drift) and cropped to its own
 * INK box, so it fills its slot instead of sitting small inside a padded file. The block survives
 * only as the 404 fallback.
 *
 * ⚠️ AND THE SEPARATION IS RE-MEASURED, because a generated sprite brings its own colours and the
 * old hue table described pixels that no longer exist. Sprite against its own scene, over the band
 * the frame occupies:
 *     solar ΔHue 137° · print ΔHue 177° (ΔSat 0.49) · station ΔHue 70° · sign ΔHue 6° but ΔSat 0.46
 * i.e. the sign shop clears on SATURATION rather than hue — the same property that site always
 * relied on, and the craft doc's rule as written: hue OR saturation, never neither. `shades` stays
 * because the tapped-rail ring and the fallback block are still drawn from it.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { SheetCell, CRITTER_CSS } from './critters'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { AnswerPad, PAD_BAND, Banner, BANNER_TOP, bannerBottom } from './yard'
import { rint, shuffle } from '@/core/rand'

// ─── The four sites ─────────────────────────────────────────────────────────────────────
/** Every backdrop is generated at this size; the cover-fit maths below depends on it. */
export const IMG_W = 1376
export const IMG_H = 768

export interface Site {
  id: string
  /** how Milo names the place, mid-sentence: "over at the solar field" */
  label: string
  emoji: string
  scene: string
  /**
   * Where the FLOOR is IN THE PAINTING, as a share of the IMAGE's height — read off each scene
   * rather than shared, which is the craft doc's oldest recurring fault.
   *
   * ⚠️ A SHARE OF THE IMAGE IS NOT A SHARE OF THE VIEWPORT. The backdrop is drawn `object-fit:
   * cover`, so on any frame whose aspect differs from the image's 1.79 the picture is cropped and
   * the painted floor moves. RailLine floated its train 44px above the rail on a 2000×970 window for
   * exactly this, and CoinShop paid for the same lesson before it. `fitLayout` maps through the real
   * cover transform.
   */
  groundY: number
  /**
   * …and where that surface BEGINS, as a share of the IMAGE's height — the horizon on an outdoor
   * site, the top of the usable wall in the sign shop.
   *
   * ⚠️ WITHOUT THIS THE FRAME CLIMBS INTO THE SKY. Anchoring the foot on the ground fixes the
   * floating, and then a tall job (seven rails) simply grows upward past the horizon and reads as a
   * ladder hanging in mid-air — caught on screen at the station apron, where the top truss reached
   * y = 3 on a 720px frame.
   *
   * ⚠️ IT IS A PREFERENCE, NOT A CAP — and it was a cap, which is what made the frame a doormat.
   * `open_hills` starts its surface at 0.53, so confining the frame to it granted 194px of a 720px
   * screen and the frame was sized to a band a third of the room it had: measured, 212 of the 749px
   * of width it was given, i.e. 2.8% of the screen for the one thing the child has to count. The
   * frame stays on the surface WHEN IT FITS and borrows above it when the job needs the height,
   * which is honest — a rack standing in a field does reach over the horizon. What is still a hard
   * clamp, and what actually stops the y = 3 case, is the chrome.
   */
  topY: number
  /** The unit's hue in degrees. See the header note — measured against this scene, not picked. */
  hue: number
  /** …and its saturation, which is the axis the sign shop separates on instead of hue. */
  sat: number
  unit: string        // "panel"
  units: string       // "panels"
  /** The site's own painted unit. Generated against the original art; see `Unit`. */
  sprite: string
  rail: string        // "rail"
  rails: string       // "rails"
  /** Who wants it — said once when the site comes up, so the job is a job and not a sum. */
  job: string
}

export const SITES: Site[] = [
  {
    id: 'solar', label: 'the solar field', emoji: '☀️',
    scene: '/assets/backgrounds/open_hills.png', groundY: 0.80, topY: 0.53,
    hue: 220, sat: 0.42,
    unit: 'panel', units: 'panels', rail: 'rack', rails: 'racks',
    sprite: '/assets/objects/fit_solar.png',
    job: 'The field has to be wired up before the light goes.',
  },
  {
    id: 'station', label: 'the station apron', emoji: '🛰️',
    scene: '/assets/backgrounds/fit_station.jpeg', groundY: 0.86, topY: 0.52,
    hue: 285, sat: 0.42,
    unit: 'module', units: 'modules', rail: 'truss', rails: 'trusses',
    sprite: '/assets/objects/fit_station.png',
    job: 'The array ships out tonight, so it has to be built now.',
  },
  {
    id: 'sign', label: 'the sign shop', emoji: '💡',
    scene: '/assets/backgrounds/fit_sign.jpeg', groundY: 0.88, topY: 0.14,
    hue: 50, sat: 0.55,
    unit: 'lamp', units: 'lamps', rail: 'strip', rails: 'strips',
    sprite: '/assets/objects/fit_sign.png',
    job: 'The sign goes up on the shop front in the morning.',
  },
  /**
   * ⚠️ THIS SLOT WAS A SUBSTITUTION AND IS NOW THE WORLD THAT WAS ACTUALLY WANTED. The badge/print
   * run was asked for, generated twice and dropped — attempt 1 came back in INK OUTLINES (the
   * flat-vector family this repo rejected on the pond backdrops), attempt 2 with the outlines gone
   * but as FLAT FEATURELESS BANDS (the near-empty-gradient fault). A planting field from the library
   * stood in for it.
   *
   * ⚠️ BOTH FAILURES HAD ONE CAUSE AND IT WAS THE REFERENCE LIST. The craft doc says to reference
   * "the ORIGINAL earliest art — `pond.jpeg`, `forest_*.jpeg`" — and those two files are themselves
   * FLAT VECTOR, ink outlines and all. So the prompt asked for painted and attached a picture of the
   * thing it was trying to avoid, and the picture wins. Referencing this chapter's OWN accepted
   * scenes (`fit_station` + `fit_sign`, both verified 200 on prod first) landed it in one pass.
   *
   * It is also the better site on all three measured axes, which is why it replaced the substitution
   * rather than joining it:
   *   • value 0.552 over the band the frame occupies, against `open_orchard`'s 0.728 — and Milo is
   *     0.705, so the planting field was very slightly BRIGHTER THAN ITS OWN CAST, which is the
   *     `grocery_sweets` fault in miniature. A backdrop must sit under what stands on it.
   *   • `topY` 0.14 against 0.54 — the header above records 0.53 as the family that produced a
   *     212 × 135px frame. A tall usable wall is where a seven-rail job has room.
   *   • the floor is cool blue-grey, a hue no other site owns, so the run stops being two green
   *     fields out of four.
   * `open_orchard.png` and `fit_planting.png` both stay on disk (the orchard is BuildingBlocks'),
   * so this is a one-row revert if the founder prefers the field.
   */
  {
    id: 'print', label: 'the print shop', emoji: '🏷️',
    scene: '/assets/backgrounds/fit_print.jpeg', groundY: 0.88, topY: 0.14,
    hue: 355, sat: 0.55,
    unit: 'badge', units: 'badges', rail: 'card', rails: 'cards',
    sprite: '/assets/objects/fit_print.png',
    job: 'The badges go out with the morning post, so the run has to be full.',
  },
]

/**
 * The order the sites come up in, over `len` slots.
 *
 * ⚠️ "SHUFFLE THEM RANDOMLY" AND "CONSECUTIVE ROUNDS MUST DIFFER" ARE NOT THE SAME REQUEST, and a
 * plain shuffle satisfies only the first — it will happily deal the same site twice in a row, which
 * is the one thing the craft rule forbids, because a scene that repeats back-to-back reads as the
 * round not having changed. This deals randomly AND rejects an adjacent repeat, so the order is
 * different every run and legal every run. All four are used inside the first four slots by
 * construction.
 */
export function runOrder(len: number, pickIdx: (n: number) => number = (n) => rint(0, n - 1)): number[] {
  const out: number[] = []
  while (out.length < len) {
    // Deal a fresh permutation of all four each time round, so no site is starved over a long run.
    const bag = shuffle(SITES.map((_, i) => i))
    // If the first of the new bag repeats the last dealt, swap it with a later one rather than
    // re-rolling — re-rolling can loop, and a swap keeps every site in the bag.
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

export type QType = 'order' | 'fit' | 'split'
export const Q_ALL: readonly QType[] = ['order', 'fit', 'split'] as const

export interface FoRound {
  qType: QType
  site: Site
  /** How many rails the JOB needs. */
  rows: number
  /** How many units go on one rail. Over ten on a `split` round, which is what puts the walkway in. */
  per: number
  /** How many rails the frame DRAWS. Always more than the job needs on a `fit` round, so nothing on
   *  screen says "that's enough" — deciding is the skill. */
  railsShown: number
  /** What the child commits: the TOTAL on an order/split round, the RAIL COUNT on a fit round. */
  answer: number
  /** The total number of units either way — what the frame holds when the job is right. */
  total: number
  ask: string
  done: string
}

/** The tens part of a rail, and the remainder — the two blocks a `split` round is built from. */
export const tensOf = (per: number) => (per > 10 ? 10 : per)
export const onesOf = (per: number) => (per > 10 ? per - 10 : 0)

/**
 * ⚠️ `asked` IS NOT DECORATION. Mastery fires at the top tier on a streak of six and promotion takes
 * three per tier, so a child who answers well is asked roughly three questions at L1, ONE at L2 and
 * TWO at L3 — and `split`, the whole payload of "2-digit × 1-digit", only exists at L3. Drawn at
 * random it is missed outright a large share of the time. While a declared type is still unmet the
 * generator spends a scarce round on it; once the set is covered it goes back to random, because
 * hardest-first for ever destroys the variety the coverage gate exists to protect.
 */
export function makeRound(d: 1 | 2 | 3, round = 0, asked: readonly string[] = []): FoRound {
  const site = SITES[runOrderFor(round)]
  const pool: QType[] = d === 1 ? ['order', 'fit'] : d === 2 ? ['order', 'fit', 'order'] : ['split', 'fit', 'split']
  const unmet = pool.filter(q => !asked.includes(q))
  const qType = unmet.length ? pick(unmet) : pick(pool)

  if (qType === 'split') {
    // per 11–19 with rows 2–5: the widest rail is countable one at a time, the whole run is not,
    // and the answer stays inside two digits so one pad serves the chapter.
    const per = rint(11, 19)
    const rows = rint(2, 5)
    const total = rows * per
    return {
      qType, site, rows, per, railsShown: rows, total, answer: total,
      ask: `${rows} ${site.rails}, ${per} ${site.units} on each. How many ${site.units} do we order?`,
      done: `${rows} × ${per} = ${total}. The run is full.`,
    }
  }
  const hi = d === 1 ? 5 : 9
  const per = rint(2, hi)
  /**
   * ⚠️ A `fit` ROUND'S ROWS ARE CAPPED LOWER THAN AN ORDER ROUND'S, AND IT IS NOT TIDINESS. The
   * frame draws `rows + 1..2` rails and can only stack eight before the units stop being countable,
   * so at rows 7–9 the spares vanished — and at rows 9 the frame held FEWER rails than the answer
   * needs, i.e. the round could not be won at all. Measured: 3,357 unwinnable rounds in 60,000
   * draws, all at L2. Nothing on screen would ever have shown this; it takes several correct answers
   * to reach L2 and then a rows-8 draw. `order` and `split` keep the full range — they draw exactly
   * `rows` rails and have no spares to lose.
   */
  const rows = qType === 'fit' ? rint(2, Math.min(hi, 6)) : rint(2, hi)
  const total = rows * per
  if (qType === 'fit') {
    return {
      qType, site, rows, per,
      // Always at least one spare rail, so the frame never fills exactly when the job is done and
      // nothing on screen says "that's enough" — deciding is the skill.
      railsShown: Math.min(rows + rint(1, 2), 8),
      total, answer: rows,
      ask: `${total} ${site.units} on the truck, ${per} to a ${site.rail}. Lay them out.`,
      done: `${rows} ${site.rails} of ${per} — that is ${total}.`,
    }
  }
  return {
    qType, site, rows, per, railsShown: rows, total, answer: total,
    ask: `${rows} ${site.rails}, ${per} ${site.units} on each. How many ${site.units} do we order?`,
    done: `${rows} × ${per} = ${total}. The run is full.`,
  }
}

/**
 * The site for a given round. Built ONCE per mount so the order is stable within a run (a child who
 * looks away and back must not find the place changed) and different between runs.
 */
let RUN: number[] = runOrder(16)
export const runOrderFor = (round: number) => RUN[Math.min(round, RUN.length - 1)]
export const reshuffleRun = () => { RUN = runOrder(16) }

/** The one grader, driven by the same value the scene commits. */
export function grade(data: FoRound, committed: number): boolean {
  return committed === data.answer
}

/**
 * How many windows the number pad opens for this answer. Exported so the gate drives the SAME
 * function the pad renders from — a test that re-derives `answer < 10 ? 1 : 2` for itself cannot
 * see the rule being taken back out. See the long note at `padWindows` in FitPlay for the dead
 * button this replaced.
 */
export const padWindowsFor = (answer: number) => (answer < 10 ? 1 : 2)

/**
 * The written miss line. ⚠️ It never states the answer, and on a `fit` round it never states the
 * rail count either — that IS the answer. It names what is wrong with what they built, which is the
 * only thing that helps and the only thing that is safe to say.
 */
export function missFor(data: FoRound, committed: number): string {
  const { site } = data
  if (data.qType === 'fit') {
    const laid = committed * data.per
    if (laid < data.total) return `Not all of them are out yet — there are still ${site.units} on the truck.`
    return `That is more than came on the truck. Send a ${site.rail} back.`
  }
  if (committed < data.total) return `That leaves gaps — some ${site.rails} came up short.`
  return `That is more than the ${site.rails} will hold. Some ${site.units} have nowhere to go.`
}

// ─── Layout ─────────────────────────────────────────────────────────────────────────────
export const CHROME_PX = 46
/** Milo owns the left; the frame owns the rest, so nothing is ever laid out behind him. */
/** The shortest band the frame may be squeezed into before it is allowed to reach above the
 *  painted surface — below this the units stop being countable, which is the worse fault. */
export const MIN_BAND = 110
/**
 * The widest a single position may be drawn — DERIVED FROM MILO, not picked. A unit is 0.84 of the
 * pitch, so at the cap it stands at 60% of his own height: a rack module beside a pony, which is
 * the right way round (the craft doc's character-vs-object size rank). A fixed 76 was the second
 * reason the frame read as a doormat, and a fixed number of any value is wrong on some window —
 * at 1800×870 a 110 cap left a four-wide job at 11% of the screen.
 */
export const pitchMax = (vh: number) => Math.round(vh * MILO_SHARE * 0.6 / 0.84)
/**
 * The band the frame would LIKE, so it can draw every rail at full size. It is granted whatever
 * room exists between the chrome and the ground; `surfaceTop` is then a preference (stay on the
 * painted surface if you can), not a cap.
 *
 * ⚠️ IT WAS A CAP, AND THAT IS WHAT MADE THE FRAME A DOORMAT. `open_hills` starts its surface at
 * 0.53 and stands things on 0.80, i.e. a 194px band on a 720px screen — so `byHeight` came out at 53
 * against a `byWidth` of 187 and the frame was sized to the SHORT dimension, using 212 of the 749px
 * of width it had been given. Measured: 2.8% of the screen for the one thing the child has to count.
 * A rack standing in a field genuinely reaches above the horizon; what must never happen is that it
 * reaches into the chrome, and that clamp is separate and still hard.
 */
export const bandWanted = (railsShown: number, vh: number) =>
  Math.max(MIN_BAND, railsShown * Math.floor(pitchMax(vh) * 1.22))
/**
 * The highest the frame's top may ever reach — how far it may borrow ABOVE the painted surface,
 * expressed in the surface's own terms rather than as a viewport share.
 *
 * ⚠️ AN UNBOUNDED BORROW IS THE OTHER FAULT, AND I SHIPPED IT FOR ONE PASS. Freeing the band so a
 * three-rail job could be a decent size let a SEVEN-rail `fit` round grow to y = 160 on a 720px
 * frame at the planting field, whose horizon is 381 — four of the seven rails drawn over open sky,
 * reading as ladders hanging in mid-air. That is exactly what `topY` was written to prevent.
 * So: a frame may stand above its own surface by up to 60% of that surface's depth. Where the
 * surface is deep (the sign shop's wall runs 0.14→0.88) this never binds and the chrome is the only
 * limit; where it is a shallow strip of field it binds hard, which is the case it is for.
 */
export const topCeiling = (surfaceTop: number, groundPx: number) =>
  surfaceTop - (groundPx - surfaceTop) * 0.6
export const MILO_X = 0.085
export const MILO_SHARE = 0.22

export interface FitLayout {
  groundPx: number
  frameLeft: number
  frameTop: number
  frameW: number
  /** Pitch between unit centres, and the drawn unit inside it. */
  pitch: number
  unitPx: number
  /** The gap that stands in for the walkway after the tenth position, in px (0 when per ≤ 10). */
  walkway: number
  railPitch: number
  railW: number
  miloH: number
  /** CSS `bottom` of Milo's bubble — derived so its bottom edge clears the pad's top edge. */
  bubbleBottom: number
  miloX: number
  padBand: number
  font: number
}

/**
 * Everything is derived from the room actually available, never picked — which is the difference
 * between this file and the one it replaces, whose `size = span > 8 ? 20 : …` ladder is what made a
 * two-digit round 810 uncountable dots.
 */
export function fitLayout(vw: number, vh: number, site: Site, per: number, railsShown: number, pad: boolean): FitLayout {
  const fit = Math.max(vw / IMG_W, vh / IMG_H)
  const drawnH = IMG_H * fit
  const groundPx = Math.round((vh - drawnH) / 2 + site.groundY * drawnH)

  const padBand = pad ? PAD_BAND(vh) : Math.round(Math.max(60, Math.min(vh * 0.14, 96)))
  const miloH = Math.round(vh * MILO_SHARE)
  /**
   * ⚠️ THE PAD IS A ROW OF TAP TARGETS AND MAY NOT SHRINK, so Milo yields to it rather than the
   * other way round — the craft doc's rule that the WORLD gives way to the thing a finger has to
   * hit. His x is clamped so his box ends clear of the pad's left edge, derived from the pad's own
   * button size rather than guessed at.
   */
  const padBtn = Math.max(26, Math.min(54, Math.floor((padBand - 6) / 2.27)))
  const padW = pad ? padBtn * 10 * 1.16 : 0
  const miloX = Math.min(vw * MILO_X, (vw - padW) / 2 - miloH * 0.34)

  /**
   * ⚠️ THE FRAME STANDS ON THE PAINTED GROUND, ANCHORED BY ITS FOOT. Centred in the free band
   * instead it straddled the horizon — measured at 1280×720 the rails ran y 97–615 while the
   * painted ground line is 576, so five of seven racks hung in the SKY. That is the craft doc's
   * anchor-by-the-feet rule, and every chapter in this repo that got it wrong looked exactly like
   * this. The frame's BOTTOM sits on the ground and it grows upward into whatever room is free.
   */
  // The frame lives on the painted surface: never above where that surface starts, never into the
  // chrome, and never under the controls (whose buttons are tap targets and may not shrink, so the
  // WORLD yields — the craft doc's rule).
  const surfaceTop = (vh - drawnH) / 2 + site.topY * drawnH
  const chromeTop = bannerBottom(vh) + 10
  const foot = Math.round(Math.min(groundPx, vh - padBand - 10))
  /**
   * ⚠️ NO FLOOR ON THE BAND. `Math.max(80, foot - top)` reads as a sensible minimum and is exactly
   * the craft doc's *a size derived from a MAXIMUM can exceed that maximum*: when the painted
   * surface is shorter than the floor, the floor hands out room that is not there and the frame
   * climbs back over the horizon — measured, frameTop 140 against a surface starting at 169. If the
   * surface genuinely cannot hold the job the frame borrows from ABOVE it, which is honest and
   * visible, rather than the band silently lying about its own height.
   */
  const top = Math.round(Math.max(
    chromeTop, topCeiling(surfaceTop, groundPx),
    Math.min(surfaceTop, foot - bandWanted(railsShown, vh)),
  ))
  const bandH = foot - top
  /**
   * ⚠️ THE FRAME CLEARS MILO'S BUBBLE, NOT JUST MILO. The bubble is far wider than he is and it sits
   * at the height the lower rails occupy, so a limit derived from the sprite alone lets it lie
   * across them — and on a `fit` round those rails ARE the tap targets. RailLine paid for exactly
   * this: measured at 640×320 its bubble covered two of six answer boards. Derived from the
   * bubble's own left and max width rather than guessed at, so it binds only where it has to.
   */
  const bubbleLeft = Math.max(8, miloX - miloH * 0.2)
  const bubbleRight = bubbleLeft + Math.min(vw * 0.4, 380)
  const leftLimit = Math.round(Math.max(bubbleRight + 10, vw * 0.15))
  const frameW = Math.round(vw * 0.95 - leftLimit)

  // A walkway is worth about two thirds of a unit — enough to read as a break, cheap in width.
  const slots = per + (per > 10 ? 0.66 : 0)
  const byWidth = frameW / slots
  const byHeight = bandH / (railsShown * 1.22)
  const pitch = Math.max(6, Math.min(byWidth, byHeight, pitchMax(vh)))
  const unitPx = Math.round(pitch * 0.84)
  const railPitch = Math.floor(pitch * 1.22)
  const railW = Math.round(pitch * slots)
  const frameTop = Math.round(foot - railsShown * railPitch)
  /**
   * Centred in the WHOLE frame, pushed right only as far as Milo's bubble actually requires.
   * ⚠️ Centred in the leftover band instead, a narrow job drifted to x 735 of 1280 — right of centre,
   * with the left 60% of the picture empty and Milo 600px away from the thing he is talking about.
   * A wide job still lands on `leftLimit`, which is the case the reserve exists for.
   */
  const frameLeft = Math.round(Math.max(leftLimit, (vw - railW) / 2))

  /**
   * ⚠️ THE BUBBLE CLEARS THE PAD, AND IT DID NOT — measured live at 640×320, the pad's two digit
   * WINDOWS were drawn 108 × 33px ON TOP of Milo's speech bubble, both of them fully inside its
   * span, so the number the child was typing sat over the words telling them what to do.
   *
   * The frame has cleared the bubble horizontally since day one (`leftLimit` above) and the frame
   * clears the pad vertically (`foot`), but nothing related the BUBBLE to the PAD — the sweep
   * checked every pair containing the frame, because the frame was what anyone was thinking about.
   * The general rule now in the craft doc: cross the list of fixed layers with ITSELF rather than
   * checking the one element you had in mind against the neighbours you happened to remember.
   *
   * So it is derived here, next to the number it must clear, instead of being computed inline in
   * `Foreman` where it could drift: the bottom control band is `padBand` sitting 8px off the floor,
   * and the bubble's own bottom edge stays 8px above that. The `max` only ever lifts, so it is inert
   * wherever Milo's head was already high enough; the chrome cap still wins at the top.
   */
  const bubbleBottom = Math.min(
    Math.max(Math.round(miloH * 0.84), padBand + 16),
    vh - CHROME_PX - 88,
  )
  return {
    groundPx, frameLeft, frameTop, frameW, pitch, unitPx,
    walkway: per > 10 ? Math.round(pitch * 0.66) : 0,
    railPitch, railW, miloH, miloX: Math.round(miloX), padBand, bubbleBottom,
    font: Math.round(Math.max(12, Math.min(vw * 0.016, 20))),
  }
}

/** x of the i-th position on a rail, walkway included. */
export const slotX = (i: number, L: FitLayout) => i * L.pitch + (i >= 10 ? L.walkway : 0)

// ─── The frame: posts, rails, notches — never a panel ────────────────────────────────────
/**
 * The unit's three faces are DERIVED from one hue rather than typed out, so eighteen hand-written
 * hex values cannot rot one at a time — BlockYard's rule, and the reason its material table holds.
 */
const shades = (hue: number, sat: number) => ({
  face: `hsl(${hue} ${Math.round(sat * 100)}% 62%)`,
  lit: `hsl(${hue} ${Math.round(sat * 100)}% 74%)`,
  deep: `hsl(${hue} ${Math.round(sat * 100)}% 44%)`,
})

/**
 * One fitted unit — the site's OWN painted object.
 *
 * ⚠️ IT WAS A CODE-DRAWN GRADIENT BLOCK, AND A BLOCK IS NOT A PANEL. The craft doc's standing rule
 * is that content is real art and a coloured rectangle is the thing you reach for when you have not
 * drawn the object yet; a child fitting solar panels should see solar panels. Each sprite is
 * generated against the ORIGINAL art (`apple.png`/`cookie.png`) so the style cannot drift, cropped
 * to its own INK box so it fills its slot rather than sitting small inside a padded file, and
 * measured against its own backdrop: solar ΔHue 137° · station ΔHue 70° · planting ΔHue 56° ·
 * **sign ΔHue 6° but ΔSat 0.46**, which is the "hue OR saturation, never neither" case that site
 * was already documented as relying on.
 *
 * The gradient block stays as the 404 fallback, which is this app's convention everywhere — a
 * missing sprite must degrade to something countable, never to nothing.
 */
function Unit({ s, m, src, delayMs }: {
  s: number; m: ReturnType<typeof shades>; src: string; delayMs: number
}) {
  const [broken, setBroken] = useState(false)
  return (
    <span style={{
      // ⚠️ `display: block` is load-bearing. A <span> is inline by default, so width/height simply
      // do not apply to it — the units were in the DOM, correct in number, and measured 0 × 0.
      // Nothing errored and nothing looked broken: the frame just stayed empty.
      display: 'block',
      position: 'relative', width: s, height: s,
      ...(broken ? {
        borderRadius: Math.max(2, Math.round(s * 0.16)),
        background: `linear-gradient(160deg, ${m.lit} 0%, ${m.face} 55%, ${m.deep} 100%)`,
        boxShadow: `inset 0 ${Math.max(1, s * 0.06)}px 0 rgba(255,255,255,.35), 0 ${Math.max(1, s * 0.07)}px 0 ${m.deep}`,
      } : null),
      /**
       * ⚠️ `backwards`, NOT `both`. With `both` the unit's ONLY opacity comes from the animation's
       * end frame — so anywhere the animation does not run to completion (a backgrounded tab, a
       * dropped frame, an engine that refuses it) the piece holds the FROM state and the frame reads
       * as empty. Measured in a hidden tab: 36 units in the DOM, every one at opacity 0. The element
       * carries opacity 1 itself and the animation only borrows the run-up.
       */
      opacity: 1,
      animation: `fo_land .34s cubic-bezier(.34,1.56,.64,1) backwards`, animationDelay: `${delayMs}ms`,
    }}>
      {!broken && (
        <img
          src={src} alt="" aria-hidden draggable={false} onError={() => setBroken(true)}
          style={{
            width: '100%', height: '100%', objectFit: 'contain', display: 'block',
            // sits ON the rail, so a soft contact shadow rather than a floating drop-shadow
            filter: `drop-shadow(0 ${Math.max(1, s * 0.045)}px ${Math.max(1, s * 0.05)}px rgba(40,32,22,.30))`,
          }}
        />
      )}
    </span>
  )
}

/**
 * One rail. The bar's LENGTH is the rail's capacity and the notches mark each position — so a child
 * can count a rail one at a time (the slow correct method) while skip-counting is the fast one, and
 * neither is a number read off the screen. On a `split` round the walkway after the tenth notch is
 * what makes the tens/ones split a thing in the picture.
 *
 * ⚠️ THE RAIL IS DRAWN AT FULL LENGTH WHILE EMPTY. A lane that will fill has to be reserved from
 * empty or everything beside it jumps a whole unit when the first piece lands — MeasureIt's fix,
 * and there it was the thing being measured that jumped.
 */
function Rail({ filled, per, L, m, src, y, tapped, onTap }: {
  filled: number; per: number; L: FitLayout; m: ReturnType<typeof shades>; src: string; y: number
  tapped?: boolean; onTap?: () => void
}) {
  const barH = Math.max(3, Math.round(L.pitch * 0.14))
  return (
    <div
      onClick={onTap}
      style={{
        position: 'absolute', left: 0, top: y, width: L.railW, height: L.railPitch,
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      {/* the bar the units stand on, with a post at each end */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: Math.round(L.pitch * 0.96), height: barH,
        borderRadius: barH, background: 'rgba(58,46,34,.42)',
      }} />
      {[0, 1].map(i => (
        <span key={i} aria-hidden style={{
          position: 'absolute', top: Math.round(L.pitch * 0.86), height: Math.round(L.pitch * 0.34),
          width: barH, borderRadius: barH, background: 'rgba(58,46,34,.5)',
          left: i === 0 ? -barH : undefined, right: i === 1 ? -barH : undefined,
        }} />
      ))}
      {/* notches: where a unit goes. Faint — they mark the places, they do not draw the pieces. */}
      {Array.from({ length: per }).map((_, i) => (
        <span key={`n${i}`} aria-hidden style={{
          position: 'absolute', left: slotX(i, L) + L.pitch * 0.42, top: Math.round(L.pitch * 0.78),
          width: Math.max(1, Math.round(L.pitch * 0.05)), height: Math.round(L.pitch * 0.16),
          background: 'rgba(58,46,34,.3)', borderRadius: 2,
        }} />
      ))}
      {/**
        * ⚠️ THE UNIT'S FOOT IS THE BAR'S TOP. At `top: 0` it hung `0.12 × pitch` — a measured 13px at
        * 1280×720 — above the rail it is supposed to be resting on. Under the old gradient block that
        * read as a block with a gap under it; under a painted object it is the floating fault this
        * repo has shipped four times. Derived from the bar's OWN offset so the two cannot drift apart.
        */}
      {Array.from({ length: filled }).map((_, i) => (
        <span key={`u${i}`} style={{ position: 'absolute', left: slotX(i, L), top: Math.round(L.pitch * 0.96) - L.unitPx }}>
          <Unit s={L.unitPx} m={m} src={src} delayMs={i * 34} />
        </span>
      ))}
      {tapped && (
        <span aria-hidden style={{
          position: 'absolute', inset: `-4px ${-barH}px`, borderRadius: 10,
          boxShadow: `0 0 0 3px ${m.lit}`, pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}

/** The whole frame, plus the trodden ground under it — a tint that fades to nothing at its own
 *  edges, because trodden ground has no border and a bordered one is the slab again. */
function Frame({ data, laid, L, onTapRail }: {
  data: FoRound; laid: number[]; L: FitLayout; onTapRail?: (i: number) => void
}) {
  const m = shades(data.site.hue, data.site.sat)
  const h = data.railsShown * L.railPitch
  return (
    <div style={{ position: 'fixed', left: L.frameLeft, top: L.frameTop, width: L.railW, height: h, zIndex: 30 }}>
      <span aria-hidden style={{
        position: 'absolute', left: -L.pitch * 0.7, right: -L.pitch * 0.7, top: -L.pitch * 0.3, bottom: -L.pitch * 0.3,
        background: 'radial-gradient(ellipse at center, rgba(52,40,26,.16) 0%, rgba(52,40,26,0) 72%)',
      }} />
      {Array.from({ length: data.railsShown }).map((_, r) => (
        <Rail key={r} per={data.per} L={L} m={m} src={data.site.sprite} y={r * L.railPitch}
          filled={laid[r] ?? 0} tapped={!!onTapRail && (laid[r] ?? 0) > 0}
          onTap={onTapRail ? () => onTapRail(r) : undefined} />
      ))}
    </div>
  )
}

/** Milo, and the job in a bubble at his mouth — the speaker owns the question. */
function Foreman({ L, line, vw, vh }: { L: FitLayout; line: string; vw: number; vh: number }) {
  return (
    <>
      <div style={{ position: 'fixed', left: L.miloX, bottom: 0, zIndex: 38, transform: 'translateX(-50%)', pointerEvents: 'none' }}>
        {/* The contact shadow is INSIDE the travelling element and drawn above bottom:0 — SliceShop
            shipped one clipped away under the viewport, i.e. fixed in the DOM and absent on screen. */}
        <div style={{ position: 'relative', paddingBottom: Math.round(L.miloH * 0.06) }}>
          <span aria-hidden style={{
            position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
            width: '76%', height: Math.round(L.miloH * 0.11), borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(46,38,24,.30) 0%, rgba(46,38,24,0) 72%)',
          }} />
          <SheetCell src="/assets/characters/milo_side.png" h={L.miloH} moving={false} breathe />
        </div>
      </div>
      {/* Anchored at his mouth, CLAMPED below the chrome (on a short frame the scene rides high and
          an unclamped bubble opens inside the back chip) and LIFTED clear of the bottom control
          band — see `bubbleBottom` in fitLayout for why the last one is not optional. */}
      <div style={{
        position: 'fixed', left: Math.max(8, L.miloX - L.miloH * 0.2),
        bottom: L.bubbleBottom,
        zIndex: 42, maxWidth: Math.min(Math.round(vw * 0.4), 380), pointerEvents: 'none',
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

export const FIT_CSS = `
@keyframes fo_land { 0%{transform:translateY(-14px) scale(.72);opacity:0} 100%{transform:translateY(0) scale(1);opacity:1} }
@keyframes fo_tick { 0%{transform:scale(1)} 45%{transform:scale(1.16)} 100%{transform:scale(1)} }
`

/** The running count — the child's OWN work appearing as they do it, never ahead of them. */
function Tally({ n, L, x, y, label }: { n: number; L: FitLayout; x: number; y: number; label: string }) {
  return (
    <div key={n} style={{
      position: 'fixed', left: x, top: y, zIndex: 41, display: 'flex', alignItems: 'baseline', gap: 8,
      background: 'rgba(255,252,244,.94)', border: '3px solid var(--milo-orange)', borderRadius: 14,
      padding: '4px 12px', animation: 'fo_tick .3s ease', pointerEvents: 'none',
    }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: L.font * 1.7, color: 'var(--ink)', lineHeight: 1 }}>{n}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: L.font * 0.8, color: 'var(--ink)', opacity: .7 }}>{label}</span>
    </div>
  )
}

// ─── Play ───────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'

const FitPlay: React.FC<{ data: FoRound; mode: Mode; onComplete: (correct: boolean) => void }> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const usesPad = data.qType !== 'fit'
  /**
   * ⚠️ THE WINDOW COUNT IS DERIVED FROM THE ANSWER, AND A FIXED 2 WAS A DEAD BUTTON ON PROD.
   * `answer = rows × per` with both `rint(2, 5)` at L1, so 6 of those 16 combinations are
   * single-digit — 2×2, 2×3, 3×2, 2×4, 4×2, 3×3. About 37% of L1 `order` rounds, and since L1's
   * pool is [order, fit], roughly one run in five met one on SCORED ROUND 1. A fixed `windows={2}`
   * made all three gates (this prop, `onDigit`'s cap, `commitPad`'s guard, and `AnswerPad`'s own
   * `disabled`) demand two digits, so a child who worked out 8, tapped `8` and tapped Done got
   * NOTHING: the button sat at opacity .4 with `cursor: default` and the question stayed up. The
   * only way through was `08` — a leading zero nothing on screen teaches, asked of the band that has
   * just learned place value. Measured live on the production build before this line existed.
   * The craft doc's rule, stated the general way: derive the expected input length from the ANSWER,
   * never from the widest case; and a control that can be disabled while the child believes they
   * have answered is a dead button whatever the reason.
   * (`split` is always ≥ 22, so this only ever binds on `order`. The one-window pad does tell the
   * child the answer is a single digit — that is a real and accepted cost, it is what placeValue's
   * `digits: 1` already does for the same reason, and it is strictly better than a button that
   * refuses a correct answer.)
   */
  const padWindows = padWindowsFor(data.answer)
  const L = fitLayout(vw, vh, data.site, data.per, data.railsShown, usesPad)

  const [digits, setDigits] = useState<number[]>([])
  /** How many units are on each rail. On a `fit` round the child sets this; on an order round the
   *  delivery does, after the commit. */
  const [laid, setLaid] = useState<number[]>(() => Array(data.railsShown).fill(0))
  const [said, setSaid] = useState<string | null>(null)
  const [settled, setSettled] = useState(false)
  const erred = useRef(false)
  const done = useRef(false)
  /** ⚠️ A handler must never read the state it also sets — batched taps all see the same stale value,
   *  which this repo has now met five times (placeValue's undo, CoinShop's lay, TickTock's dial,
   *  SliceShop's piece, the parade's refill). The ref is the source of truth inside a tap. */
  const laidRef = useRef(laid)
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }
  useEffect(() => () => { timers.current.forEach(clearTimeout); stopSpeech() }, [])
  useEffect(() => { if (mode === 'guided') speak(data.ask) }, [mode, data.ask])

  const total = laid.reduce((a, b) => a + b, 0)
  const railsLaid = laid.filter(n => n > 0).length

  function finish(ok: boolean) {
    if (ok) {
      done.current = true
      setSettled(true)
      setSaid(data.done)
      speak(data.done)
      later(() => onComplete(mode === 'practice' ? !erred.current : true), 2100)
    } else {
      erred.current = true
      const line = missFor(data, usesPad ? Number(digits.join('')) : railsLaid)
      setSaid(line); speak(line)
      /**
       * ⚠️ `setSettled(false)` IS THE WHOLE RETRY. Without it the board clears and stays DEAD: the
       * rails lose their `onTap` (`usesPad || settled ? undefined : tapRail`), the commit button is
       * `disabled={settled || …}` and the pad's `live` is `!settled` — so one wrong answer left the
       * child looking at the question with no way to touch anything, for ever, on EVERY question
       * type. The chapter owns its own retry loop (`ownsFeedback`), so nothing upstream re-opens it.
       *
       * It survived because no gate can see it — the suite drives `makeRound`/`grade`/`missFor`/
       * `fitLayout`, which are pure — and because a wrong answer had never once been played. It is
       * the craft doc's *a tap that does nothing at all is the worst outcome there is*, and
       * HopAlong's unwinnable round, arrived at from a third direction.
       */
      later(() => {
        setSaid(null); setDigits([]); setSettled(false)
        setLaid(Array(data.railsShown).fill(0)); laidRef.current = Array(data.railsShown).fill(0)
      }, 2300)
    }
  }

  /** The delivery arriving: it lays what was ORDERED, which is how a wrong order shows as gaps. */
  function deliver(ordered: number) {
    let r = 0
    const step = () => {
      const next = laidRef.current.slice()
      next[r] = Math.max(0, Math.min(data.per, ordered - r * data.per))
      laidRef.current = next; setLaid(next)
      r++
      if (r < data.railsShown && ordered > r * data.per) later(step, 420)
      else later(() => finish(grade(data, ordered)), 620)
    }
    step()
  }

  function commitPad() {
    if (done.current || digits.length < padWindows) return
    const n = Number(digits.join(''))
    setSettled(true)
    deliver(n)
  }

  function tapRail(i: number) {
    if (done.current || settled) return
    const next = laidRef.current.slice()
    next[i] = next[i] > 0 ? 0 : data.per
    laidRef.current = next; setLaid(next)
  }

  return (
    <>
      <style>{FIT_CSS}{CRITTER_CSS}</style>
      <img src={data.site.scene} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      <Banner text={data.ask} vh={vh} ok={settled && done.current} />
      <Frame data={data} laid={laid} L={L} onTapRail={usesPad || settled ? undefined : tapRail} />
      {/* ⚠️ On an order round NOTHING counts until after the commit — the old chapter's whole defect
          was a total on screen while the question was open. On a fit round the count IS the child's
          own laying, one rail at a time, so it may show. */}
      {(!usesPad || settled) && total > 0 && (
        <Tally n={total} L={L} label={data.site.units} x={L.frameLeft} y={Math.max(BANNER_TOP(vh) + 44, L.frameTop - L.font * 3)} />
      )}
      <Foreman L={L} vw={vw} vh={vh} line={said ?? data.site.job} />
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 8, zIndex: 44, display: 'flex', justifyContent: 'center' }}>
        {usesPad ? (
          <AnswerPad digits={digits} live={!settled && !done.current} band={L.padBand} windows={padWindows}
            onDigit={(n) => setDigits(d => (d.length < padWindows ? [...d, n] : d))}
            onClear={() => setDigits(d => d.slice(0, -1))} onDone={commitPad} />
        ) : (
          /* Identical at every count — nothing may say the set is right before the commit. */
          <button onClick={() => { if (!done.current && !settled) { setSettled(true); later(() => finish(grade(data, railsLaid)), 260) } }}
            disabled={settled || railsLaid === 0}
            style={{
              height: Math.round(L.padBand * 0.52), padding: `0 ${Math.round(L.padBand * 0.34)}px`, borderRadius: 999, border: 'none',
              background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(L.padBand * 0.22),
              opacity: railsLaid === 0 ? .4 : 1, cursor: railsLaid === 0 ? 'default' : 'pointer',
              boxShadow: '0 4px 0 rgba(180,70,20,.45)',
            }}>Send it ✓</button>
        )}
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
function dwellFor(line: string) { return Math.max(2200, Math.min(6200, line.length * 72)) }

const FitExplain: React.FC<{ data: FoRound; onDone: () => void }> = ({ data, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const L = fitLayout(vw, vh, data.site, data.per, data.railsShown, false)
  const [laid, setLaid] = useState<number[]>(() => Array(data.railsShown).fill(0))
  const [line, setLine] = useState('')
  const [shown, setShown] = useState(0)
  const doneRef = useRef(onDone); doneRef.current = onDone

  /** The beats: a line, and what the frame looks like while it is said. */
  const beats = useMemo(() => {
    const s = data.site
    const out: Array<{ say: string; fill: number[]; tally: number }> = []
    const empty = Array(data.railsShown).fill(0)
    if (data.qType === 'split') {
      const tens = tensOf(data.per), ones = onesOf(data.per)
      out.push({ say: `${data.rows} ${s.rails}, ${data.per} ${s.units} on each. ${data.per} is a lot to count up in.`, fill: empty, tally: 0 })
      out.push({ say: `So I split every ${s.rail}: ten, and ${ones} more.`, fill: empty, tally: 0 })
      out.push({ say: `${data.rows} tens is ${data.rows * tens}.`, fill: Array(data.railsShown).fill(tens), tally: data.rows * tens })
      out.push({ say: `And ${data.rows} ${ones}s is ${data.rows * ones}.`, fill: Array(data.railsShown).fill(data.per), tally: data.total })
      out.push({ say: `${data.rows * tens} and ${data.rows * ones} is ${data.total}. That is what I order.`, fill: Array(data.railsShown).fill(data.per), tally: data.total })
      return out
    }
    out.push({ say: `${data.rows} ${s.rails}, ${data.per} ${s.units} on each. They are still on the truck, so I cannot count them.`, fill: empty, tally: 0 })
    for (let r = 0; r < data.rows; r++) {
      const f = empty.slice(); for (let i = 0; i <= r; i++) f[i] = data.per
      const n = (r + 1) * data.per
      out.push({ say: r === 0 ? `So I count up in ${data.per}s. ${data.per}…` : `${n}…`, fill: f, tally: n })
    }
    out.push({ say: `${data.rows} ${data.per}s are ${data.total}. That is what I order.`, fill: Array(data.railsShown).fill(data.per), tally: data.total })
    return out
  }, [data])

  useEffect(() => {
    let i = 0, alive = true
    const timers: number[] = []
    const run = () => {
      if (!alive || i >= beats.length) { if (alive) timers.push(window.setTimeout(() => doneRef.current(), 1200)); return }
      const b = beats[i]
      setLine(b.say); setLaid(b.fill); setShown(b.tally)
      speak(b.say)
      i++
      timers.push(window.setTimeout(run, dwellFor(b.say)))
    }
    run()
    return () => { alive = false; timers.forEach(clearTimeout); stopSpeech() }
  }, [beats])

  return (
    <>
      <style>{FIT_CSS}{CRITTER_CSS}</style>
      <img src={data.site.scene} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      <Banner text={data.ask} vh={vh} />
      <Frame data={data} laid={laid} L={L} />
      {shown > 0 && <Tally n={shown} L={L} label={data.site.units} x={L.frameLeft} y={Math.max(BANNER_TOP(vh) + 44, L.frameTop - L.font * 3)} />}
      <Foreman L={L} vw={vw} vh={vh} line={line} />
    </>
  )
}

// ─── Beat + orchestrator ────────────────────────────────────────────────────────────────
export function makeBeat(): Beat<FoRound> {
  return {
    skillId: 'timesTables', rounds: 10, reteachAfter: 3, walkEvery: 99,
    make: (d, round = 0, asked = []) => makeRound((d || 1) as 1 | 2 | 3, round + 3, asked),
    /**
     * MATH ONLY. The site rotates every round, so a signature that included it would read the
     * changed scene as variety and let the same question straight back through.
     */
    sig: d => `${d.qType}|${d.rows}x${d.per}`,
    /**
     * The closed set mastery may not exit before covering. `split` is the whole payload of
     * "2-digit × 1-digit" and lives only at L3, so without this a strong child is asked it twice at
     * best and misses it outright a large share of the time.
     * ⚠️ STATED RATHER THAN HIDDEN: a child who never leaves L1 can never draw a `split`, so they
     * never complete coverage and never get the early exit. Harmless and bounded — the run still
     * ends at ten rounds, and mastery needs the top tier anyway. Same cost TickTock records.
     */
    coverage: { of: d => d.qType, all: Q_ALL },
    /** This chapter retries IN PLACE over the frame being read and writes its own miss line, so the
     *  shared centred pill would land on the thing it is asking the child to look at. */
    ownsFeedback: true,
    prompt: () => '',
    say: d => d.ask,
    Play: ({ data, onSubmit }) => <FitPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <FitExplain data={data} onDone={onDone} />,
  }
}

type Phase = 'intro' | 'demo' | 'guided' | 'practice'

export default function FitOut({ onFinish, onExit }: {
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const { w: vw, h: vh } = useViewport()
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)
  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])
  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return; finished.current = true; stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 700)), [])
  const beat = useMemo(() => makeBeat(), [])
  /**
   * A fresh site order per run, so the places are not in the same sequence twice.
   *
   * ⚠️ IT HAS TO HAPPEN BEFORE THE DEMO AND GUIDED ROUNDS ARE BUILT, not in a mount effect. Effects
   * run after render, so the memos below read the OLD order and the scored rounds read the new one —
   * which silently breaks the one thing the run order exists to guarantee. Caught on screen: the
   * guided round and scored round 1 both came up on the sign shop, back to back.
   */
  useState(() => { reshuffleRun(); return 0 })

  /** The demo and the guided round take the FIRST slots off the same run the scored rounds index
   *  into, so no site is shown twice in a row across the join and none is wasted. */
  const DEMO = useMemo<FoRound[]>(() => {
    const a = makeRound(1, 0, []); const b = makeRound(3, 1, [])
    return [{ ...a, qType: 'order' as QType, rows: 3, per: 4, railsShown: 3, total: 12, answer: 12,
      ask: `3 ${a.site.rails}, 4 ${a.site.units} on each. How many ${a.site.units} do we order?`,
      done: `3 × 4 = 12. The run is full.` },
    { ...b, qType: 'split' as QType, rows: 3, per: 12, railsShown: 3, total: 36, answer: 36,
      ask: `3 ${b.site.rails}, 12 ${b.site.units} on each. How many ${b.site.units} do we order?`,
      done: `3 × 12 = 36. The run is full.` }]
  }, [])
  const GUIDED = useMemo<FoRound>(() => {
    const g = makeRound(1, 2, [])
    return { ...g, qType: 'fit', rows: 4, per: 5, railsShown: 7, total: 20, answer: 4,
      ask: `20 ${g.site.units} on the truck, 5 to a ${g.site.rail}. Lay them out.`,
      done: `4 ${g.site.rails} of 5 — that is 20.` }
  }, [])

  // ⚠️ The early return sits BELOW every hook. Above them, turning the phone changes the hook count
  // and React tears the chapter into the error boundary — TickTock shipped that for one session.
  if (needsRotate) return <RotateGate line="The fitting crew needs a wide site — turn your tablet sideways." />

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
        fontSize: vh < 470 ? 13 : 16, color: 'var(--ink)',
      }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#cfe0ee' }}>
      {chip}
      {phase === 'intro' && (
        <>
          <img src={SITES[0].scene} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{
              maxWidth: 520, background: 'rgba(255,252,244,.96)', border: '4px solid var(--outline)',
              borderRadius: 22, padding: '22px 26px', textAlign: 'center', boxShadow: '0 8px 0 rgba(61,37,22,.15)',
            }}>
              <div style={{ fontSize: 34, marginBottom: 6 }}>{SITES.map(s => s.emoji).join(' ')}</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, color: 'var(--ink)', margin: '0 0 10px' }}>The Fitting Crew</h1>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, lineHeight: 1.45, color: 'var(--ink)', margin: '0 0 18px' }}>
                Milo runs a fitting crew. Every job is rows of the same thing — panels, modules, lamps, trays —
                and they are all still on the truck, so you cannot count them. Work out how many, and the run fills exactly.
              </p>
              <button onClick={() => { unlockSpeech(); setPhase('demo') }} style={{
                border: 'none', borderRadius: 999, padding: '12px 26px', cursor: 'pointer',
                background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, boxShadow: '0 5px 0 rgba(180,70,20,.45)',
              }}>Start the round →</button>
            </div>
          </div>
        </>
      )}

      {phase === 'demo' && (<>
        {banner(`Watch Milo · ${demoIdx + 1}/${DEMO.length}`)}
        <FitExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
      </>)}

      {phase === 'guided' && (<>
        {banner('Your turn · lay it out')}
        <FitPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
      </>)}

      {phase === 'practice' && (
        <SkillBeat beat={beat} onInterlude={interlude}
          onComplete={(c, w, mastered) => {
            result.current.correct += c; result.current.wrong += w
            finishChapter(result.current.correct, result.current.wrong, mastered)
          }} />
      )}
    </div>
  )
}
