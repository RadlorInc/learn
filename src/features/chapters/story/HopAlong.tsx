'use client'
/**
 * Chapter (6–8) — SKIP COUNTING (`skipCounting`), rebuilt 2026-07-28. The verb is COUNT THE FAST WAY.
 *
 * ⚠️ WHAT THIS REPLACES, because the reason matters more than the code. The old chapter showed a row
 * of groups with every running total printed above them and one blank, and asked the child to tap the
 * missing number. Every question it could generate was a bare arithmetic sequence with a hole —
 * `4 · 6 · 8 · ?` — solved by adding the step to the number next to it. **You could delete every
 * animal from the screen and all thirty questions still worked**, which means the grouping (the whole
 * content of skip counting) was never taught or assessed. It measured sequence completion.
 *
 * Skip counting exists to answer ONE question — *how many altogether?* — and its content is
 * UNITISING: the leap where five stops being five things and becomes ONE FIVE, so you can count
 * one five, two fives, three fives. That is the bridge to multiplication the curriculum asks for.
 *
 * So: Milo needs a number of little ones. They are NOT in a countable row — they are in FAMILIES,
 * alive and milling, so counting by ones is not available and the only stable thing on screen is the
 * family. He hops to a family (a real ballistic hop, see `Hop` in critters.tsx) and it falls in
 * behind him; his sign goes up by the family's SIZE, not by one. There are always more families than
 * he needs, and nothing on screen says "that's enough" — deciding it is the skill (HomeTime's rule).
 *
 * ⚠️ THE SIGN SHOWS THE RUNNING TOTAL (founder's call) AND THAT IS NOT HOT/COLD, for one reason: it
 * updates only AFTER a family has landed. The decision to fetch a fourth family of five is taken
 * while the sign still reads 15, so it is a prediction and the sign merely confirms it. What must
 * never appear is a signal that the SET IS RIGHT before Ready is pressed — so the Ready button and
 * the sign are byte-identical at every count, including the exact target. (Chapter 4 shipped a Ready
 * button that turned green on the target and it quietly replaced the chapter with a colour-matching
 * game.)
 *
 * Design doc: docs/hopalong-design.md. Craft rules: docs/chapter-craft.md.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, stopSpeech, speakSteps, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, useChapterShell, type Beat } from './StoryWorld'
import { useViewport } from '@/shared/hooks/useViewport'
import { RotateGate, useNeedsRotate } from './RotateGate'
import { Hop, SheetCell, Arrive, CRITTER_CSS, hopOf, inFlowJourney } from './critters'
import { rint } from '@/core/rand'
import { useLatestRef } from '@/shared/hooks/useLatestRef'
import { SceneBg } from '@/shared/ui/SceneBg'
import { useChapterPhase } from '@/shared/hooks/useChapterPhase'

const MILO = '/assets/characters/milo_hop_side.png'

// ─── Settings ────────────────────────────────────────────────────────────────────────
/**
 * Three painted scenes, and the ground line is MEASURED in each rather than guessed: mean row colour
 * down the image, largest jump. Horizons sit at 51% / 38% / 43% and all three read as real grass at
 * 64% — sampled, because `town_park` looked like grass in a thumbnail and turned out to be pale haze
 * where the feet land, which reads as hovering (chapter-craft.md).
 *
 * ⚠️ These three are a DELIBERATE third overlap with MarketDay's Garden and StoryTime's Flower Beds
 * (founder's call). Only a handful of scenes in the library paint ground high enough for a row of
 * creatures to stand on, and a line of families walking a meadow cannot be mistaken for a grid of
 * market pens.
 */
interface Setting { id: string; label: string; bg: string; ground: number; family: string; airOk: boolean }
/**
 * ⚠️ `airOk` — CAN A HOVERING GROUP BE SEEN AGAINST THIS SCENE? A flier sits at Milo's head, ~41% of
 * the frame, and what a backdrop paints THERE decides whether the child can count them. Measured as
 * the pixel variation across that band (mean per-channel σ), not judged by eye:
 *
 *     garden_meadow 22.3  →  open sky above the horizon, a butterfly reads cleanly
 *     garden_park   45.5  →  trees and hedges
 *     garden        71.3  →  the flower bed and fence sit exactly there — a butterfly DISAPPEARS
 *
 * The founder caught the butterflies planted on the ground; lifting them then hid them in the
 * flowers instead, which is the countability rule ("a set the child cannot read is a wrong answer
 * the chapter caused") re-appearing one layer along. **So fliers are cast where the sky is** — the
 * lift was never the thing to tune. Same shape as the rule that sends a walking cast to a scene
 * with painted ground: check the pixels where the creature actually sits.
 */
const SETTINGS: Record<string, Setting> = {
  meadow: { id: 'meadow', label: 'Meadow',       bg: '/assets/backgrounds/garden_meadow.png', ground: 0.64, family: 'family', airOk: true },
  garden: { id: 'garden', label: 'Flower Patch', bg: '/assets/backgrounds/garden.png',        ground: 0.64, family: 'bunch',  airOk: false },
  park:   { id: 'park',   label: 'Park',         bg: '/assets/backgrounds/garden_park.png',   ground: 0.64, family: 'group',  airOk: false },
}

// ─── Cast ────────────────────────────────────────────────────────────────────────────
/**
 * EVERY member has a drawn cycle — a still creature standing beside a living one reads as broken
 * art, so the cast is all-or-nothing (SeesawPark's re-pick made this call and it has held since).
 * `flier` carries no contact shadow: a shadow is a contact cue and a flier touches nothing.
 */
interface Kid { img: string; one: string; many: string; flier?: boolean }
const K = {
  rabbit:    { img: '/assets/objects/rabbit_side.png',    one: 'rabbit',    many: 'rabbits' },
  chick:     { img: '/assets/objects/chick_side.png',     one: 'chick',     many: 'chicks' },
  lamb:      { img: '/assets/objects/lamb_side.png',      one: 'lamb',      many: 'lambs' },
  duckling:  { img: '/assets/objects/duckling_side.png',  one: 'duckling',  many: 'ducklings' },
  duck:      { img: '/assets/objects/duck_side.png',      one: 'duck',      many: 'ducks' },
  bee:       { img: '/assets/objects/bee_side.png',       one: 'bee',       many: 'bees',       flier: true },
  butterfly: { img: '/assets/objects/butterfly_side.png', one: 'butterfly', many: 'butterflies', flier: true },
  ladybug:   { img: '/assets/objects/ladybug_side.png',   one: 'ladybug',   many: 'ladybugs' },
  ant:       { img: '/assets/objects/ant_side.png',       one: 'ant',       many: 'ants' },
  squirrel:  { img: '/assets/objects/squirrel_side.png',  one: 'squirrel',  many: 'squirrels' },
  bird:      { img: '/assets/objects/bird_side.png',      one: 'bird',      many: 'birds' },
  firefly:   { img: '/assets/objects/firefly_side.png',   one: 'firefly',   many: 'fireflies',  flier: true },
  dragonfly: { img: '/assets/objects/dragonfly_side.png', one: 'dragonfly', many: 'dragonflies', flier: true },
} satisfies Record<string, Kid>

/**
 * ONE ORDERED RUN for the whole chapter — demo, guided and every scored round index straight into
 * it, NEVER modulo. A plan shorter than the run read as `PLAN[round % len]` is how three chapters
 * ended up showing the creature they opened with again in the last rounds; and a demo that picks out
 * of `items[]` by hand lands on the very entries the scored rounds then serve again.
 *
 * Interleaved meadow → garden → park so consecutive questions change place as well as number.
 * 13 slots = 2 demo + 1 guided + 10 scored, so no creature is ever seen twice in one run.
 */
export interface Slot { w: Setting; item: Kid }
export const RUN: Slot[] = [
  // ⚠️ EVERY FLIER IS IN THE MEADOW, and that is not a coincidence — it is the only one of the three
  // with open sky at hovering height (see `airOk`). The others take ground creatures, who stand on
  // the grass below the busy band and are perfectly readable there.
  { w: SETTINGS.meadow, item: K.butterfly },  // demo — a flier
  { w: SETTINGS.garden, item: K.ladybug },    // demo — and a walker, so the child sees both
  { w: SETTINGS.park,   item: K.squirrel },   // guided
  { w: SETTINGS.meadow, item: K.bee },        // scored 0…
  { w: SETTINGS.garden, item: K.ant },
  { w: SETTINGS.park,   item: K.bird },
  { w: SETTINGS.meadow, item: K.dragonfly },
  { w: SETTINGS.garden, item: K.chick },
  { w: SETTINGS.park,   item: K.rabbit },
  { w: SETTINGS.meadow, item: K.firefly },
  { w: SETTINGS.garden, item: K.duckling },
  { w: SETTINGS.park,   item: K.duck },
  { w: SETTINGS.meadow, item: K.lamb },
]
export const DEMO_SLOTS = 2
/** The single accessor the scored rounds use. A gate must drive THIS, not the array — reading the
 *  data cannot see how the chapter indexes it, which is how a wrapped index walked through the
 *  first version of chapterCastDistinct. */
export const scoredSlot = (round: number) => RUN[DEMO_SLOTS + 1 + round]

// ─── Round generation ────────────────────────────────────────────────────────────────
/**
 * Difficulty grows the GROUP SIZE and how many families are needed — never the numerals alone.
 * Stated as explicit (group, need) pairs rather than random ranges so the on-screen population stays
 * countable: a family of ten drawn five times over is fifty sprites, which is a pile, and a pile the
 * child cannot read is a wrong answer the chapter caused.
 *
 * ⚠️ MIXED GROUP SIZES WITHIN ONE ROUND were in the design and are deliberately NOT built: summing a
 * five-family and a ten-family is addition of unequal groups, which is a different skill wearing this
 * chapter's clothes. Skip counting is equal groups. Noted in the design doc.
 */
/**
 * ⚠️ THE QUESTION SPACE IS BOUNDED BY WHAT FITS A SMALL LANDSCAPE PHONE, and that is a real
 * constraint rather than a tuning preference. On a 640-wide frame the waiting band is ~422px, and a
 * family needs `cols × 17px` (17 being the smallest a child should have to recognise) plus a gap
 * that keeps families visibly SEPARATE. That yields a hard ceiling on how many families can be out
 * there at once:
 *
 *     group 10 (5 cols) → at most 4 families   ·   group 5 (3 cols) → at most 6   ·   group 2 → 8
 *
 * So `need` is capped per group size. The gate's separation assertion is what enforces this — add a
 * pair that does not fit and it fails rather than silently shrinking the little ones into a smear.
 * Difficulty then grows by the number of skip-count STEPS as much as by the target: counting by 2s
 * to 12 is six steps, which is harder work than counting by 10s to 30 in three.
 */
const PAIRS: Record<1 | 2 | 3, Array<[group: number, need: number]>> = {
  1: [[2, 3], [2, 4], [5, 2], [5, 3]],
  2: [[5, 3], [5, 4], [10, 2], [10, 3]],
  3: [[5, 4], [10, 3], [2, 6], [2, 5]],
}
/** Exported so the gate sweeps the REAL question space rather than a copy of it. */
export const PAIRS_FOR_TEST = PAIRS
export interface FetchRound {
  w: Setting; item: Kid
  group: number      // how many little ones in one family — the UNIT
  need: number       // families required
  target: number     // group × need, the number Milo asks for
  families: number   // how many are out there (always more than he needs)
}

export function makeFetch(slot: Slot, d: 1 | 2 | 3): FetchRound {
  const pool = PAIRS[d]
  const [group, need] = pool[rint(0, pool.length - 1)]
  // Spares are what make "when do I stop?" a real decision. One is enough for a big family — two
  // ten-families of spare is twenty extra sprites for no extra thinking.
  const spares = group >= 10 ? 1 : 2
  return { w: slot.w, item: slot.item, group, need, target: group * need, families: need + spares }
}

// ─── Layout ──────────────────────────────────────────────────────────────────────────
/**
 * Exported and used BY THE SCENE, so a gate can import the same function the pixels come from.
 * Chapter 4's sweep re-implements its own copy of this chain, which lets the check agree with itself
 * while the screen falls apart.
 */
export interface FetchLayout {
  kidPx: number; gotPx: number; miloPx: number
  cols: number; clusterW: number
  miloStart: number
  famX: (k: number) => number
  /** Where he stands once he has fetched `taken` families. */
  miloAt: (taken: number) => number
  /** Where a gathered little one stands in the crowd behind him. */
  gotSpot: (i: number, miloXPct: number) => { left: number; lift: number; scale: number }
  /**
   * How far the whole party must travel to clear the right edge, as % of viewport width — measured
   * from the TAIL of the line, so the last one out still gets fully off frame. A flat offset clears
   * whoever is furthest right and strands the rest ("let them pass by fully", chapter 2).
   */
  exitPct: (taken: number, group: number) => number
  /**
   * How high a FLYING group hovers above the ground line, px. A flier laid out on the ground line
   * reads as standing on the grass, which is what the founder caught: butterflies and dragonflies
   * planted in the lawn beside a walking Milo. Derived from Milo's own height so they sit around
   * his head at every size, rather than a constant that happens to look right on one screen.
   * Zero for anything that walks or crawls.
   */
  flyLift: number
  /** How far below the top of Milo's CELL his head actually is — his sheet's cell reserves headroom
   *  for the airborne frames, so anything anchored to the cell top floats well above him. */
  headPx: number
}
/**
 * ⚠️ THE LESSON THIS FUNCTION EXISTS TO HOLD (chapter-craft.md): a layout here is a set of
 * INVARIANTS, not a set of nice numbers. The first version guessed a per-family width and a fixed
 * trail gap, and on screen the rightmost family hung off the frame while the gathered cluster was
 * drawn straight over Milo. Both are derived now.
 *
 * The load-bearing decision: the gathered families are a HUDDLE, not a line of clusters. Five spread
 * clusters plus the families still waiting cannot both fit a landscape frame at a readable size — an
 * overlapping crowd packs the same twenty little ones into a third of the width. The grouping stays
 * visible where it is being COUNTED (the waiting families); once gathered they are simply his.
 */
export function fetchLayout(vw: number, vh: number, r: { group: number; families: number; flier?: boolean }): FetchLayout {
  const short = vh < 470
  // A family of ten is drawn 2×5 — the ten-frame shape placeValue already uses, and the only
  // arrangement in which ten reads as ten at a glance rather than as "lots".
  const cols = r.group >= 10 ? 5 : r.group >= 5 ? Math.ceil(r.group / 2) : r.group
  const rows = Math.ceil(r.group / cols)
  const miloPx = Math.round(Math.max(74, Math.min(short ? 0.30 * vh : 0.34 * vh, 170)))
  const miloW = miloPx * 0.62                                   // his cellAspect

  // Every family that will EVER be on screen has to fit the waiting band at once — that is the
  // worst case (nothing gathered yet), so size against it rather than against how many are left.
  // % of width the waiting families own. 66 rather than 58 because at 812×375 seven families of
  // five drove the sprite down onto its 17px readability floor, and a sprite that cannot shrink any
  // further eats the separation gap instead. Widen the band before lowering the floor: 17px is
  // already the smallest a child should have to recognise.
  const BAND = 70
  // ⚠️ Families must be SEPARATED, not merely non-overlapping. At 640×320 six of them came out
  // touching — one ending at 305px and the next starting at 306 — which reads as one long row and
  // quietly undoes the whole point, since the child is counting FAMILIES. So the gap is reserved in
  // the derivation and the sprite shrinks to pay for it (chapter 2's rule: a wide creature is drawn
  // smaller rather than allowed to overlap).
  const GAP = 2
  const maxClusterW = (BAND - (r.families - 1) * GAP) / r.families
  // How wide a family actually draws, from the SAME numbers <Family> lays itself out with — the
  // grid gap and the padding either side. A magic multiplier here over-estimated it by ~7%, which
  // is enough to lose the separation gap on a 667-wide frame.
  const clusterPx = (k: number) => cols * k + (cols - 1) * Math.max(2, k * 0.10) + 2 * (k * 0.16)
  const perKid = cols + (cols - 1) * 0.10 + 0.32          // clusterPx(k) ÷ k, ignoring the 2px floor
  const byWidth = (maxClusterW / 100) * vw / perKid
  const byHeight = (short ? 0.15 : 0.185) * vh / rows
  // FLOOR, not round: this size is derived from a maximum, and rounding it up can exceed that
  // maximum — which cost exactly the separation gap (1.4917% against a required 1.5%) at 640×320.
  const kidPx = Math.floor(Math.max(17, Math.min(byWidth, byHeight, 56)))
  const clusterW = clusterPx(kidPx) / vw * 100                  // one family, % of width

  // Waiting families span a band whose ends are pulled in by HALF a cluster, so the first and last
  // sit fully inside the frame instead of hanging off it.
  const x0 = 100 - 4 - clusterW / 2
  const xN = 100 - 4 - BAND + clusterW / 2
  const span = Math.max(0, x0 - xN)
  const famX = (k: number) => (r.families <= 1 ? (x0 + xN) / 2 : xN + (span * k) / (r.families - 1))
  const miloHalf = (miloW / 2 / vw) * 100
  const gotPx = Math.round(kidPx * 0.82)    // gathered ones read as further back
  const miloAt = (taken: number) => taken === 0 ? miloHalf + 2 : famX(taken - 1) - clusterW / 2 - miloHalf - 0.5
  const gotSpot = (i: number, miloXPct: number) => {
    // Two rows, overlapping — a crowd, not a queue. Derived from the sprite's own width so a wide
    // creature packs no tighter than it can be read at.
    const col = Math.floor(i / 2), back = i % 2 === 1
    const step = (kidPx * 0.62) / vw * 100
    return {
      left: miloXPct - miloHalf - 3 - col * step,
      lift: back ? kidPx * 0.30 : 0,
      scale: back ? 0.9 : 1,
    }
  }
  return {
    kidPx, gotPx,
    miloPx, cols, clusterW,
    // Derived from his OWN half-width, not picked: a flat 5% put him at left:-2px on a 1024 frame,
    // i.e. half off the screen. Every founder-visible layout fault in this repo has been a constant
    // that happened to hold at one size.
    miloStart: miloHalf + 2,
    famX,
    /**
     * He lands BESIDE a family, never on its spot — which is both what you would actually do and
     * the thing that makes his clearance from the next family structural rather than a size cap.
     * Landing on the spot put him 0.33% inside the neighbouring cluster at group 2, which the gate
     * caught and the eye would not have.
     */
    miloAt,
    gotSpot,
    exitPct: (taken, group) => {
      const tail = taken > 0 ? gotSpot(taken * group - 1, miloAt(taken)).left : miloAt(taken)
      return 100 - tail + (gotPx / 2 / vw) * 100 + 4
    },
    headPx: Math.round(miloPx * 0.16),
    // His drawn body fills ~84% of his cell, so his head tops out at 0.84 × miloPx above the ground.
    // 0.52 puts a two-row swarm's span around his head and shoulders.
    flyLift: r.flier ? Math.round(miloPx * 0.52) : 0,
  }
}

// ─── One family: a cluster of `group` little ones ────────────────────────────────────
function Family({ r, size, cols, lit, onTap, startle, walking }: {
  r: FetchRound; size: number; cols: number; lit: boolean; onTap?: () => void
  /**
   * Bumped when Milo lands next to this family. Each member reacts STAGGERED BY ITS INDEX, so the
   * reaction crosses the group as a wave — which is what reads as alive. Everything jolting at once
   * reads as a switch being flipped, and that difference is most of what separates this from a
   * screen of independent moving parts.
   */
  startle?: number
  /** Legs run while the family is actually covering ground — the cardinal rule, and it applies to
   *  the walk-off at the end of a round exactly as it applies to a journey. */
  walking?: boolean
}) {
  return (
    <button
      onClick={onTap} disabled={!onTap}
      style={{
        display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)`,
        gap: Math.max(2, Math.round(size * 0.10)),
        padding: Math.round(size * 0.16),
        border: 'none', background: 'transparent', cursor: onTap ? 'pointer' : 'default',
        // A grouping device must be part of the world: a warm translucent patch of trodden ground
        // with light on its rim, not a rounded rectangle with a blue stroke — that is a UI panel and
        // over a painted meadow it reads as a pane of glass with animals behind it.
        //
        // ⚠️ BUT A SWARM HAS NOTHING TO TREAD. Giving fliers the same patch — a dark ground colour
        // with a shadow cast BENEATH it — states that they are resting on something, which is half
        // of why the butterflies read as standing in the lawn. Theirs is a pale haze of light with
        // no shadow under it. (The fill still has to be SEEN: dropped too faint it leaves only the
        // rim, which is the empty-outline wireframe fault in a new costume.)
        borderRadius: 999,
        boxShadow: r.item.flier
          ? (lit ? `0 0 0 3px rgba(255,252,232,.95), 0 0 ${Math.round(size * 0.5)}px rgba(255,255,255,.55)`
                 : `0 0 ${Math.round(size * 0.42)}px rgba(255,255,255,.45)`)
          : (lit ? `0 0 0 3px rgba(255,248,214,.85), 0 ${Math.round(size * 0.14)}px ${Math.round(size * 0.22)}px rgba(40,54,30,.30)`
                 : `0 ${Math.round(size * 0.12)}px ${Math.round(size * 0.20)}px rgba(40,54,30,.22)`),
        backgroundColor: r.item.flier
          ? (lit ? 'rgba(255,255,255,.34)' : 'rgba(255,255,255,.24)')
          : (lit ? 'rgba(92,74,42,.30)' : 'rgba(92,74,42,.20)'),
        transition: 'box-shadow .25s ease, background-color .25s ease',
      }}>
      {Array.from({ length: r.group }).map((_, i) => (
        <span key={i} style={{ display: 'block',
          // Alternate members stand a touch further back — higher and smaller, which is what depth
          // IS in a painted scene. Kept small: a scatter a child cannot count is a wrong answer.
          transform: i % 2 ? `translateY(${-size * 0.10}px) scale(.92)` : 'none' }}>
          {/* The startle lives on its OWN wrapper. Stacking it onto the depth transform above would
              let the later one silently win — the bug that cost this codebase a day across three
              chapters — and stacking it onto SheetCell would fight its breath. */}
          <span key={startle ?? 0} style={{ display: 'block',
            animation: startle ? `ha_startle 460ms ${i * 55}ms cubic-bezier(.34,1.56,.64,1) both` : 'none' }}>
            <SheetCell src={r.item.img} h={size} moving={!!walking} breathe={!walking} delayMs={i * 180} />
          </span>
        </span>
      ))}
    </button>
  )
}

// ─── Milo's sign: the running total ──────────────────────────────────────────────────
/**
 * A painted marker, not a UI pill — warm cream, ink-brown numeral, soft shadow, the same idiom the
 * counting chapter uses. ⚠️ IDENTICAL AT EVERY COUNT, including the exact target: any change of
 * colour or weight when the set is right hands the answer over before the child commits.
 */
function Sign({ n, px }: { n: number | string; px: number }) {
  return (
    <div style={{
      minWidth: px * 1.5, padding: `${Math.round(px * 0.16)}px ${Math.round(px * 0.34)}px`,
      background: '#fdf3d8', border: '4px solid #6b4d22', borderRadius: 14,
      boxShadow: '0 4px 0 rgba(60,40,16,.35)',
      fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: px, color: '#4a3316',
      textAlign: 'center', lineHeight: 1.1,
    }}>{n}</div>
  )
}

// ─── The play surface ────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
export const FetchPlay: React.FC<{ data: FetchRound; mode: Mode; onComplete: (correct: boolean) => void }> =
({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const L = fetchLayout(vw, vh, { ...data, flier: data.item.flier })
  const [taken, setTaken] = useState(0)
  /** A journey in flight: where he set off from and where he is going. Both directions. */
  const [flight, setFlight] = useState<{ from: number; to: number } | null>(null)
  const [landPulse, setLandPulse] = useState(0)                 // bumps on each landing → startle wave
  const [returning, setReturning] = useState<number | null>(null)  // family walking back to its spot
  /** How far the crowd has to close up after his last hop, px — they keep formation, so it is the
   *  same distance for every one of them. Captured when `taken` changes. */
  const [followPx, setFollowPx] = useState(0)
  const [committed, setCommitted] = useState(false)
  const [nudge, setNudge] = useState<string | null>(null)
  const erred = useRef(false)
  const busy = useRef(false)
  const nudgeT = useRef<number | undefined>(undefined)

  const miloX = L.miloAt(taken)
  const total = taken * data.group

  /**
   * ⚠️ SPEAKING IS NOT FEEDBACK. Chrome ships no usable local voice on many machines, so a response
   * that exists only as speech is, on those devices, a tap that does nothing — the worst outcome
   * there is, worse than a wrong answer, because the child cannot tell the game is listening. This
   * chapter shipped exactly that: Ready at the wrong count spoke a line and changed nothing on
   * screen, and the founder pressed it and watched nothing happen. Everything spoken here is ALSO
   * written.
   */
  const tell = useCallback((msg: string) => {
    speak(msg)
    setNudge(msg)
    window.clearTimeout(nudgeT.current)
    nudgeT.current = window.setTimeout(() => setNudge(null), 3000)
  }, [])
  useEffect(() => () => window.clearTimeout(nudgeT.current), [])

  useEffect(() => {
    if (mode === 'guided') tell(`Milo needs ${data.target} ${data.item.many}. They come in ${data.w.family}s of ${data.group}. Tap a ${data.w.family} to fetch it!`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Fetch one more, or send one back — the SAME journey either way, which is the point. A miscount
   * is repaired by walking, not by a Back button: he hops to where he is going and the family walks
   * with him. (HomeTime settled this: "the miscount repair is a journey too, facing the other way.")
   */
  function go(next: number) {
    if (busy.current || committed) return
    if (next < 0 || next > data.families || next === taken) return
    busy.current = true
    const from = L.miloAt(taken), to = L.miloAt(next)
    const j = hopOf(MILO, L.miloPx, (to - from) / 100 * vw)
    setFlight({ from, to })
    if (next < taken) setReturning(next)          // the family that is walking home
    // Choreographed off the journey's OWN numbers, never a guessed timer — so the family falls in
    // exactly as the feet touch rather than a beat before or after.
    window.setTimeout(() => {
      setFollowPx((to - from) / 100 * vw)
      setTaken(next); setFlight(null); setLandPulse(p => p + 1)
      speak(String(next * data.group))
      busy.current = false
      window.setTimeout(() => setReturning(null), 700)
    }, j.totalMs + 40)
  }

  function ready() {
    if (busy.current || committed) return
    if (total !== data.target) {
      erred.current = true
      tell(total < data.target
        ? `Not enough yet — Milo needs ${data.target}. Fetch another ${data.w.family}!`
        : `That's too many — Milo only needs ${data.target}. Tap the ones behind him to send a ${data.w.family} back.`)
      return
    }
    setCommitted(true)
    tell(`${data.target}! Off we go!`)
    // The round ends when they have actually LEFT, off the journey's own numbers — not on a guessed
    // timer that cuts the walk-off in half.
    window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), exitMs + 260)
  }

  const short = vh < 470
  const groundTop = `${data.w.ground * 100}%`

  /**
   * THE WALK-OFF. Two rules meet here and a flat offset breaks both.
   *
   * ① MEASURE FROM THE TAIL, NOT FROM MILO. A fixed `translateX(46vw)` clears whoever is furthest
   *    right and strands everyone behind them — chapter 2 shipped exactly that and ended its rounds
   *    with half the family still standing in frame. The distance is what the LAST one in the line
   *    needs to cross the right edge, so everybody clears by construction.
   * ② IT IS A JOURNEY, SO THE LEGS MUST AGREE WITH IT. Deriving the duration from each creature's
   *    own gait (`inFlowJourney`) is what keeps one cycle carrying one stride over a distance that
   *    changes with the count; a constant 2200ms would have them skating at whatever speed the
   *    arithmetic happened to produce. Milo HOPS out, because that is his gait.
   */
  const exitPct = L.exitPct(taken, data.group)
  const exitPx = (exitPct / 100) * vw

  // His sign, as a child of whatever is carrying him — so it travels WITH him instead of staying
  // put while he hops away. Anchored to his HEAD, not to the top of his cell: the hop sheet reserves
  // headroom for the airborne frames, so a sign hung off the cell top floats a long way above him.
  const sign = (
    <div style={{ position: 'absolute', left: '50%', bottom: '100%', transform: 'translateX(-50%)',
      marginBottom: -(L.headPx), zIndex: 2 }}>
      <Sign n={total} px={short ? 20 : 28} />
    </div>
  )
  const kidExit = inFlowJourney(data.item.img, L.gotPx, exitPx)
  const miloExit = hopOf(MILO, L.miloPx, exitPx)
  const EXIT_STAGGER = 45
  const exitMs = Math.max(miloExit.totalMs, kidExit.ms + EXIT_STAGGER * Math.max(0, taken * data.group - 1))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 30, pointerEvents: 'none' }}>
      {/* ── the families still out there ── */}
      {Array.from({ length: data.families }).map((_, k) => {
        if (k < taken && k !== returning) return null      // fetched — it is at his heel now
        const next = k === taken && !committed
        // A family sent back WALKS home rather than reappearing: it starts at the crowd and travels
        // to its own patch on its own legs. `Arrive` exists for exactly this and already runs the
        // cycle for precisely the interval the body is covering ground.
        const back = k === returning
        const fromPx = back ? (L.gotSpot(0, L.miloAt(k + 1)).left - L.famX(k)) / 100 * vw : 0
        const body = (moving: boolean) => (
          <Family r={data} size={L.kidPx} cols={L.cols} lit={next && !back}
            walking={moving} onTap={next && !back ? () => go(taken + 1) : undefined} />
        )
        return (
          <div key={k} style={{
            position: 'absolute', left: `${L.famX(k)}%`, top: groundTop,
            // A swarm hovers; a herd stands. `flyLift` is 0 for anything that walks or crawls, so
            // this is the same expression either way and the two can never drift apart.
            transform: `translate(-50%, calc(-100% - ${L.flyLift}px))`,
            pointerEvents: next && !back ? 'auto' : 'none',
            opacity: next || back ? 1 : 0.72, transition: 'opacity .3s ease', zIndex: 20 + k,
          }}>
            {back
              ? <Arrive dist={fromPx} ms={620} resetKey={`back${k}`}>{body}</Arrive>
              : body(false)}
          </div>
        )
      })}

      {/* ── the ones he has: a crowd at his heel. Each keeps a stable key so React does not recycle
             one little one into another's slot, and each follows with a longer delay than the one in
             front, so the crowd RIPPLES after him instead of sliding as one board. ── */}
      {Array.from({ length: (returning != null ? returning : taken) * data.group }).map((_, i) => {
        const s = L.gotSpot(i, miloX)
        // The LAST family he took is the one that can leave next, so it is the tappable one — a
        // stack, which is the only ordering a child can predict. ⚠️ It is tappable at EVERY count,
        // never only when he has too many: an affordance that appears when the set is wrong is a
        // verdict handed over before the commit.
        const inLast = i >= (taken - 1) * data.group
        /**
         * ⚠️ EVERY MOVE THE CROWD MAKES IS A JOURNEY, AND `Arrive` IS WHAT MAKES THE LEGS AGREE
         * WITH IT. This used to be a bare `transition: left` with `moving` gated on `committed`, so
         * they slid after him with their feet parked — the engine's cardinal fault, in the one place
         * on screen where a dozen creatures do it at once. Two different journeys arrive here:
         *
         *   JUST JOINED — travels from its family's patch out on the meadow. Without this the
         *   members simply APPEAR in the crowd, which is the materialising fault the whole band was
         *   rebuilt to delete.
         *   ALREADY HIS — closes up the distance he just covered, keeping formation, staggered so
         *   the crowd ripples after him rather than sliding as one board.
         */
        const justJoined = i >= (taken - 1) * data.group
        const fromPx = justJoined
          ? (L.famX(taken - 1) - s.left) / 100 * vw
          : -followPx
        return (
          <div key={i} onClick={inLast && !committed && !busy.current ? () => go(taken - 1) : undefined}
            style={{
              position: 'absolute', left: `${s.left}%`, top: groundTop,
              transform: `translate(-50%, calc(-100% - ${s.lift + L.flyLift}px)) scale(${s.scale}) ${committed ? `translateX(${exitPct}vw)` : ''}`,
              transition: `transform ${kidExit.ms}ms ${i * EXIT_STAGGER}ms linear`,
              zIndex: 17 + (i % 2),
              pointerEvents: inLast && !committed ? 'auto' : 'none',
              cursor: inLast && !committed ? 'pointer' : 'default',
            }}>
            <Arrive dist={committed ? 0 : fromPx} ms={committed ? 0 : 620}
              delayMs={justJoined ? 0 : 120 + i * 45} resetKey={`${taken}-${i}`}>
              {moving => (
                <span key={inLast ? landPulse : 0} style={{ display: 'block',
                  animation: inLast && landPulse && !moving
                    ? `ha_startle 460ms ${(i % data.group) * 55}ms cubic-bezier(.34,1.56,.64,1) both` : 'none' }}>
                  {/* Legs run while EITHER journey is under way, and again on the walk-off at the end
                      of the round. cycleScale is what keeps one cycle carrying one stride once the
                      clamp has stretched the journey — a bare 1 is how every chapter here ended up
                      skating on its ordinary journeys. */}
                  <SheetCell src={data.item.img} h={L.gotPx}
                    moving={moving || committed} breathe={!moving && !committed}
                    delayMs={i * 140} cycleScale={committed ? kidExit.cycleScale : 1} />
                </span>
              )}
            </Arrive>
          </div>
        )
      })}

      {/* ── Milo, and his sign ── */}
      <div style={{ position: 'absolute', left: `${flight ? flight.from : miloX}%`, top: groundTop,
        transform: 'translate(-50%, -100%)', zIndex: 26 }}>
        {committed
          // He HOPS out of frame rather than sliding out on a transform. It is his gait, so it is
          // what he should leave on — and it means the exit obeys the same one-cycle-one-hop timing
          // as every other journey he makes.
          ? <Hop src={MILO} h={L.miloPx} distPx={exitPx} resetKey="exit">{sign}</Hop>
          : flight
            // He FACES the way he is going. Hopping backwards to send one home with his legs running
            // forwards is the moonwalk, and the layout can no longer guarantee direction now that the
            // journey runs both ways — so the facing is derived from it.
            ? <Hop src={MILO} h={L.miloPx} facesLeft={flight.to < flight.from}
                distPx={(flight.to - flight.from) / 100 * vw} resetKey={`${taken}-${flight.to}`}>{sign}</Hop>
            : <span style={{ display: 'block', position: 'relative' }}>
                {sign}
                <SheetCell src={MILO} h={L.miloPx} moving={false} breathe />
              </span>}
      </div>

      {/* ── what Milo just said, WRITTEN. See `tell` — a response that exists only as speech is a
             tap that does nothing on any device without a voice. ── */}
      {nudge && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: short ? 46 : 70, display: 'flex',
          justifyContent: 'center', padding: '0 12px', zIndex: 41, pointerEvents: 'none' }}>
          <div style={{ maxWidth: '78%', background: 'var(--paper)', border: '3px solid var(--milo-orange)',
            borderRadius: 18, padding: short ? '5px 12px' : '8px 18px', fontFamily: 'var(--font-display)',
            fontWeight: 800, fontSize: short ? 12 : 15, color: 'var(--ink)', textAlign: 'center',
            boxShadow: '0 4px 0 rgba(242,107,44,.25)', animation: 'ha_say 220ms ease both' }}>{nudge}</div>
        </div>
      )}

      {/* ── the ask, and the commit. Both identical at every count. ── */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: short ? 8 : 16,
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, pointerEvents: 'auto', zIndex: 40 }}>
        <div style={{ background: 'var(--paper)', border: '3px solid var(--outline)', borderRadius: 999,
          padding: short ? '6px 14px' : '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: short ? 13 : 16, color: 'var(--ink)' }}>
          Milo needs {data.target} {data.item.many}
        </div>
        <button onClick={ready} disabled={committed} style={{
          padding: short ? '8px 20px' : '12px 30px', borderRadius: 999, border: 'none',
          background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: short ? 15 : 19,
          boxShadow: '0 5px 14px rgba(242,107,44,.4)', cursor: committed ? 'default' : 'pointer',
        }}>Ready ✓</button>
      </div>
    </div>
  )
}

// ─── The demo, which IS the lesson ───────────────────────────────────────────────────
/**
 * The joke is the teaching. Milo counts the little ones one at a time — and they wander, cross behind
 * one another, and he loses his place. Then they settle into families and he gets there in four hops.
 * **That contrast is the whole chapter**, and it is the one beat a child would rewatch.
 *
 * It plays on the SAME surface as the round rather than in a modal white card over the scene, which
 * is the band-wide item every rebuilt 6–8 chapter has to carry.
 */
const Demo: React.FC<{ slot: Slot; group: number; need: number; onDone: () => void }> = ({ slot, group, need, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const r: FetchRound = { w: slot.w, item: slot.item, group, need, target: group * need, families: need }
  const L = fetchLayout(vw, vh, { ...r, flier: r.item.flier })
  const [beat, setBeat] = useState(0)          // 0 loose+counting · 1 lost · 2 grouped · 3.. hopping
  const [ones, setOnes] = useState(0)
  const [jig, setJig] = useState(0)
  const doneRef = useLatestRef(onDone)
  const total = group * need

  useEffect(() => {
    const lines: string[] = []
    const acts: Array<() => void> = []
    lines.push(`Milo has to count all the ${r.item.many}.`); acts.push(() => { setBeat(0); setOnes(0) })
    // He gets a little way in one at a time — and they keep moving.
    for (let i = 1; i <= 5; i++) { lines.push(String(i)); acts.push(() => { setOnes(i); setJig(j => j + 1) }) }
    lines.push(`Oh no — they keep moving. I've lost count!`); acts.push(() => setBeat(1))
    lines.push(`But look — they sit in ${r.w.family}s of ${group}.`); acts.push(() => { setBeat(2); setOnes(0) })
    lines.push(`So I can count the ${r.w.family}s instead — much faster!`); acts.push(() => setBeat(2))
    for (let k = 1; k <= need; k++) { lines.push(String(k * group)); acts.push(() => setBeat(2 + k)) }
    lines.push(`${total}! ${need} ${r.w.family}s of ${group} makes ${total}.`); acts.push(() => setBeat(2 + need))
    return speakSteps(lines, {
      onStep: i => acts[i]?.(),
      onDone: () => window.setTimeout(() => doneRef.current(), 1200),
      fallbackStepMs: 1150,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const groundTop = `${slot.w.ground * 100}%`
  const taken = Math.max(0, beat - 2)
  const miloX = beat < 2 ? L.miloStart : L.miloAt(taken)

  /**
   * ⚠️ HE HOPS IN THE DEMO TOO. This moved him with a `transition: left` and `moving={false}`, so in
   * the one beat that TEACHES the chapter he slid across the meadow with his feet parked — while the
   * played round, three seconds later, hopped him properly. The demo is the first thing a child
   * watches and the only part they might rewatch; it cannot be the part that skates.
   */
  const [flight, setFlight] = useState<{ from: number; to: number } | null>(null)
  /**
   * Derived during RENDER, not in an effect. Effects run after paint, so setting the flight there
   * paints him at the DESTINATION for one frame before the hop pulls him back to where he set off —
   * measured at 3ms, and the same fault `Arrive` carries its own note about. React's
   * derive-state-from-props escape hatch removes the frame entirely.
   */
  const [seen, setSeen] = useState(0)
  if (seen !== taken) {
    setSeen(taken)
    setFlight(taken === 0 ? null : { from: L.miloAt(seen), to: L.miloAt(taken) })
  }
  useEffect(() => {
    if (!flight) return
    const j = hopOf(MILO, L.miloPx, (flight.to - flight.from) / 100 * vw)
    const t = window.setTimeout(() => setFlight(null), j.totalMs + 40)
    return () => window.clearTimeout(t)
  }, [flight, L.miloPx, vw])

  const sign = (
    <div style={{ position: 'absolute', left: '50%', bottom: '100%', transform: 'translateX(-50%)',
      marginBottom: -(L.headPx), zIndex: 2 }}>
      <Sign n={beat === 1 ? '?' : beat < 2 ? ones : taken * group} px={vh < 470 ? 20 : 28} />
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 30, pointerEvents: 'none' }}>
      {beat < 2 ? (
        // LOOSE: no families, just a milling crowd — and it re-jitters as he counts, which is
        // exactly why counting by ones does not work.
        Array.from({ length: total }).map((_, i) => {
          const seed = Math.sin((i + 1) * 12.9898 + jig * 0.7) * 43758.5453
          const f = seed - Math.floor(seed)
          return (
            <div key={i} style={{
              position: 'absolute', left: `${34 + (i % 7) * 8.4 + f * 4}%`,
              top: `calc(${groundTop} - ${Math.floor(i / 7) * (L.kidPx * 0.55)}px)`,
              transform: `translate(-50%, calc(-100% - ${L.flyLift}px))`, transition: 'left 700ms ease-in-out',
              opacity: i < ones ? 0.45 : 1, zIndex: 20,
            }}>
              <SheetCell src={r.item.img} h={L.kidPx} moving={false} breathe delayMs={i * 130} />
            </div>
          )
        })
      ) : (
        Array.from({ length: need }).map((_, k) => k < taken ? null : (
          <div key={k} style={{ position: 'absolute', left: `${L.famX(k)}%`, top: groundTop,
            transform: `translate(-50%, calc(-100% - ${L.flyLift}px))`, zIndex: 20 + k }}>
            <Family r={r} size={L.kidPx} cols={L.cols} lit={k === taken} />
          </div>
        ))
      )}

      {beat >= 2 && Array.from({ length: taken * group }).map((_, i) => {
        const s = L.gotSpot(i, miloX)
        // Same two journeys as the played round — join from the family's patch, or close up behind
        // him — and the same reason they go through `Arrive`: a crowd that slides with its feet
        // parked is the fault this whole chapter was rebuilt to delete, and the demo is the first
        // thing a child watches.
        const justJoined = i >= (taken - 1) * group
        const fromPx = justJoined
          ? (L.famX(taken - 1) - s.left) / 100 * vw
          : (L.miloAt(taken - 1) - L.miloAt(taken)) / 100 * vw
        return (
          <div key={i} style={{ position: 'absolute', left: `${s.left}%`, top: groundTop,
            transform: `translate(-50%, calc(-100% - ${s.lift + L.flyLift}px)) scale(${s.scale})`,
            zIndex: 17 + (i % 2) }}>
            <Arrive dist={fromPx} ms={620} delayMs={justJoined ? 0 : 120 + i * 45} resetKey={`${taken}-${i}`}>
              {moving => <SheetCell src={r.item.img} h={L.gotPx} moving={moving} breathe={!moving} delayMs={i * 140} />}
            </Arrive>
          </div>
        )
      })}

      {/* No `transition: left` — the movement IS the hop, and a transition beside it would slide him
          there as well. His sign rides inside whatever is carrying him so it cannot lag behind. */}
      <div style={{ position: 'absolute', left: `${flight ? flight.from : miloX}%`, top: groundTop,
        transform: 'translate(-50%, -100%)', zIndex: 26 }}>
        {flight
          ? <Hop src={MILO} h={L.miloPx} facesLeft={flight.to < flight.from}
              distPx={(flight.to - flight.from) / 100 * vw} resetKey={`d${taken}`}>{sign}</Hop>
          : <span style={{ display: 'block', position: 'relative' }}>
              {sign}
              <SheetCell src={MILO} h={L.miloPx} moving={false} breathe />
            </span>}
      </div>
    </div>
  )
}

// ─── Beat ────────────────────────────────────────────────────────────────────────────
export function makeBeat(): Beat<FetchRound> {
  return {
    skillId: 'skipCounting', rounds: 10, walkEvery: 3,
    make: (d, round = 0) => makeFetch(scoredSlot(round) ?? RUN[RUN.length - 1], (d || 1) as 1 | 2 | 3),
    // The MATH only — not the rotating setting or the creature, so a question is not re-asked just
    // because the dressing changed.
    sig: d => `${d.group}|${d.need}`,
    // SkillBeat renders nothing when this is empty, and the chapter's own ask sits by the Ready
    // button. Two pills saying the same thing land on top of each other at 640×320.
    prompt: () => '',
    say: d => `Milo needs ${d.target} ${d.item.many}. They come in ${d.w.family}s of ${d.group}.`,
    Play: ({ data, onSubmit }) => <FetchPlay data={data} mode="practice" onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <Demo slot={{ w: data.w, item: data.item }} group={data.group} need={data.need} onDone={onDone} />,
  }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────────────
const HA_CSS = `
@keyframes ha_fade { from{opacity:0} to{opacity:1} }
/* The reaction to being landed next to: a small jolt up and a squash back down. Applied per member
   with a staggered delay so it crosses the family as a WAVE. */
@keyframes ha_say { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
@keyframes ha_startle {
  0%   { transform: translateY(0) scaleY(1) }
  28%  { transform: translateY(-18%) scaleY(1.06) }
  62%  { transform: translateY(0) scaleY(.94) }
  100% { transform: translateY(0) scaleY(1) }
}`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'

export default function HopAlong({ onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useChapterPhase<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  const [scene, setScene] = useState<Setting>(RUN[0].w)
  const { exit, tally } = useChapterShell(onFinish, onExit)
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => makeBeat(), [])

  // The DEMO takes the first slots off the same RUN the scored rounds index into, so it can never
  // land on a creature a scored round will serve again.
  const DEMO: Array<{ group: number; need: number }> = [{ group: 2, need: 3 }, { group: 5, need: 3 }]
  const guided = useMemo(() => makeFetch(RUN[DEMO_SLOTS], 1), [])

  const bg = phase === 'practice' ? scene : phase === 'guided' ? RUN[DEMO_SLOTS].w : RUN[Math.min(demoIdx, DEMO_SLOTS - 1)].w

  // The early return sits BELOW every hook — putting it above one changes the hook count when the
  // phone turns and React tears the chapter into the error boundary.
  if (needsRotate) return <RotateGate line="Milo's meadow is nice and wide!" />

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{HA_CSS}{CRITTER_CSS}</style>

      {/* Painted scene, crossfading between the three settings. */}
      <div style={{ position: 'absolute', inset: 0, background: '#dcecdb' }}>
        {Object.values(SETTINGS).map(s => (
          <SceneBg key={s.id} src={s.bg} priority={s.id === bg.id}
            style={{ opacity: s.id === bg.id ? 1 : 0, transition: 'opacity .6s ease' }} />
        ))}
      </div>

      <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', minHeight: 44, borderRadius: 50, background: 'var(--paper)',
          border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)',
          fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '72%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18,
            padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19,
            color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            Milo needs to gather the little ones — but they never stand still! Luckily they sit in
            equal families, so he can hop from family to family and count the fast way.
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('demo') }} style={{ padding: '14px 38px', borderRadius: 50,
            border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))',
            color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22,
            boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s go! ▶</button>
        </div>
      )}

      {phase === 'demo' && (
        <Demo key={`d${demoIdx}`} slot={RUN[demoIdx]} group={DEMO[demoIdx].group} need={DEMO[demoIdx].need}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
      )}

      {phase === 'guided' && (
        <FetchPlay key="guided" data={guided} mode="guided" onComplete={() => setPhase('practice')} />
      )}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 40, left: 0, right: 0, zIndex: 45, display: 'flex',
          justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data) => { if (data?.w) setScene(data.w as Setting) }}
            onComplete={tally} />
        </div>
      )}
    </div>
  )
}
