'use client'
/**
 * The shared creature-journey kit for the 3–5 story chapters.
 *
 * Every rule in here was paid for by a founder catching a fault on a screenshot, most of them
 * twice — learned in chapter 1, forgotten, re-learned in chapter 2. They live in ONE place now so
 * the next chapter inherits them instead of copying the code and drifting away from the fixes:
 *
 *   • A walk cycle and the travel it belongs to must be given the SAME number (`travelMs`).
 *   • A creature's shadow is a CHILD of the creature, never a sibling with its own transition.
 *   • Travel eases LINEAR — a walking creature moves at a constant speed.
 *   • A stationary creature PAUSES its cycle and breathes; a loop in place is skating on the spot.
 *   • Layout is a set of INVARIANTS derived from the sprite's own aspect, not tuned constants.
 *
 * Moved out of FollowTheLeader.tsx verbatim — see the git history there for the bug each comment
 * is describing.
 */
import React, { useState, useEffect, useRef } from 'react'
import { SHEETS } from './canvas/sheets'
import { shuffle } from '@/core/rand'
import { useLatestRef } from '@/shared/hooks/useLatestRef'
import { SceneBg } from '@/shared/ui/SceneBg'

export const STRIDE = 0.85                      // how far one cycle carries a body, in body heights
// 3600, not the old 2400. The ceiling is what decides how hard a creature has to hurry: the cycle
// is scaled to whatever speed the clamp imposes, so a tighter ceiling buys a shorter wait at the
// price of whirling legs. 3600 is the point where the WORST reachable journey — the smallest sprite
// a chapter produces (45px) crossing the longest distance one asks for (~75% of the width) — still
// cycles no faster than ~0.34s. Most journeys are far shorter and never reach it at all.
export const TRAVEL_MIN = 1100, TRAVEL_MAX = 3600   // bounds on one creature's journey

const frac = (x: number) => x - Math.floor(x)
export const seeded = (i: number, s: number) => frac(Math.sin((i + 1) * s) * 43758.5453)

// ─── Habitats: where the picture will actually hold a creature ───────────────────────
/**
 * `lineY` / `waitY0..waitY1` are the bands of the picture a creature may stand in, as screen-%.
 * They are the numbers that decide whether a creature looks like it belongs or like it is
 * hovering: on a forest backdrop the painted ground does not start until ~76%, so a band at 62%
 * puts rabbits in the tree canopy. Every scene below is open ground from just past halfway. For
 * fliers and swimmers the band is simply higher — being off the ground is correct for them.
 */
export interface Habitat {
  scenes: string[]              // still backdrops — rotated, never scrolled
  move: 'land' | 'swim' | 'air'
  lineY: number; waitY0: number; waitY1: number
}
export const HABITATS: Record<string, Habitat> = {
  meadow: {
    scenes: ['/assets/backgrounds/farm_barnyard.png', '/assets/backgrounds/garden.png', '/assets/backgrounds/garden_meadow.png'],
    move: 'land', lineY: 72, waitY0: 82, waitY1: 92,
  },
  reef: {
    scenes: ['/assets/backgrounds/reef_open.png', '/assets/backgrounds/reef_sand.png', '/assets/backgrounds/reef_deep.png'],
    move: 'swim', lineY: 46, waitY0: 64, waitY1: 76,
  },
  sky: {
    scenes: ['/assets/backgrounds/garden_park.png', '/assets/backgrounds/garden_fence.png', '/assets/backgrounds/town_park.jpeg'],
    move: 'air', lineY: 40, waitY0: 56, waitY1: 68,
  },
}

/** A little one, its mother, and the habitat it belongs in. `scale` keeps relative sizes sane — a
 *  ladybug drawn the same height as a rabbit is its own kind of "doesn't belong". */
export interface Kind {
  src: string; facesLeft?: boolean; scale?: number
  little: string; plural: string; mother: string; home: keyof typeof HABITATS
}
/**
 * Deliberately INTERLEAVED meadow → reef → sky rather than grouped, so consecutive questions change
 * habitat as well as creature. Ten entries against ten rounds means a full run never repeats one.
 * A creature's locomotion comes from chapter 1's own classification — the ladybug is a CRAWLER, and
 * hovering it in the sky band read as wrong the moment it was on screen.
 */
export const CAST: Kind[] = [
  { src: '/assets/objects/rabbit_side.png', facesLeft: true, little: 'bunny', plural: 'bunnies', mother: 'Mummy Rabbit', home: 'meadow' },
  { src: '/assets/objects/fish_side.png', little: 'fish', plural: 'fish', mother: 'Mummy Fish', home: 'reef' },
  { src: '/assets/objects/butterfly_side.png', scale: 0.85, little: 'butterfly', plural: 'butterflies', mother: 'Mummy Butterfly', home: 'sky' },
  { src: '/assets/objects/squirrel_side.png', scale: 0.95, little: 'squirrel', plural: 'squirrels', mother: 'Mummy Squirrel', home: 'meadow' },
  { src: '/assets/objects/turtle_side.png', scale: 0.95, little: 'turtle', plural: 'turtles', mother: 'Mummy Turtle', home: 'reef' },
  { src: '/assets/objects/ladybug_side.png', scale: 0.8, little: 'ladybug', plural: 'ladybugs', mother: 'Mummy Ladybug', home: 'meadow' },
  { src: '/assets/objects/ant_side.png', scale: 0.82, little: 'ant', plural: 'ants', mother: 'Mummy Ant', home: 'meadow' },
  { src: '/assets/objects/crab_side.png', scale: 0.85, little: 'crab', plural: 'crabs', mother: 'Mummy Crab', home: 'reef' },
  { src: '/assets/objects/firefly_side.png', scale: 0.78, little: 'firefly', plural: 'fireflies', mother: 'Mummy Firefly', home: 'sky' },
  { src: '/assets/objects/shark_side.png', facesLeft: true, scale: 1.05, little: 'shark', plural: 'sharks', mother: 'Mummy Shark', home: 'reef' },
]
export const kindAt = (i: number) => CAST[i % CAST.length]
export const homeOf = (k: Kind) => HABITATS[k.home]
export const aspectOf = (src: string) => SHEETS[src]?.cellAspect ?? 1

// ─── Stable backdrop ─────────────────────────────────────────────────────────────────
// Deliberately motionless. Nothing scrolls, nothing parallaxes: all the movement in these
// chapters belongs to the creatures.
export function Background({ scene, scenes }: { scene: string; scenes: string[] }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#9ccf7e' }}>
      {/* ⚠️ EVERY SCENE IN THE RUN IS MOUNTED AT ONCE so the cross-fade has something to fade TO —
          which is three 250–580 KB backdrops on a chapter that rotates three. Through `SceneBg` they are
          AVIF at the displayed width instead of full-size PNG (measured: 583 KB → 108 KB at w=1280),
          and only the one on screen is fetched eagerly. */}
      {scenes.map(s => (
        <SceneBg key={s} src={s} priority={s === scene}
          onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
          style={{ opacity: s === scene ? 1 : 0, transition: 'opacity .6s ease' }} />
      ))}
    </div>
  )
}

// ─── Where a creature stands ─────────────────────────────────────────────────────────
export interface Spot { left: number; top: number; scale: number }

/**
 * The waiting huddle's extent, in screen-%. Left edge holds the widest sprite fully on screen — a
 * shark is 1.75× wider than it is tall and hung off the left at a flat 13%, so the edge is measured
 * from the sprite, not guessed. The right edge is whatever room the destination will not need, so
 * every journey runs left→right — the way they face, the way their feet go. Spread the huddle over
 * the whole width instead and a creature standing right of its destination travels BACKWARDS while
 * its legs run forwards, which is moonwalking and looks wrong long before you can name it.
 *
 * `span` is the step between neighbours; because they alternate rows, two creatures in the SAME row
 * are `rows × span` apart — that is the figure a sprite has to fit inside.
 */
export function huddleGeom(n: number, rightPct: number, edgePct = 0) {
  const left = Math.max(13, edgePct + 1)
  const right = Math.min(56, rightPct)
  return { left, right, span: n <= 1 ? 0 : (right - left) / (n - 1) }
}

/**
 * How many rows the huddle needs. Adding a row is how a tight huddle buys horizontal room without
 * shrinking anyone (five sharks on a 1024px screen is the only case that needs a third).
 */
export function huddleRows(spanPct: number, spriteWidthPct: number): number {
  if (spanPct <= 0) return 1
  return Math.min(3, Math.max(2, Math.ceil(spriteWidthPct / spanPct)))
}

export function waitSpot(i: number, n: number, w: Habitat, rightPct: number, edgePct = 0, rows = 2): Spot {
  const { left, span } = huddleGeom(n, rightPct, edgePct)
  const row = rows <= 1 ? 0 : i % rows
  return {
    left: n <= 1 ? 22 : left + i * span,
    // Rows rather than one line: a single row on this side of the screen would have them
    // overlapping, and a huddle is what a group of babies actually looks like anyway.
    //
    // The organic jitter is SUBTRACTED, never added. Added, it pushed feet up to 2% BELOW waitY1 —
    // which fitBands has just finished proving is the lowest a foot may go — and at 640×320 that
    // put the bottom-right of the huddle 5px behind chapter 4's Ready button. Nudging upward keeps
    // waitY1 a true floor, so the band fit means what it says.
    top: w.waitY0 + (rows <= 1 ? 0 : row / (rows - 1)) * (w.waitY1 - w.waitY0) - seeded(i, 12.9898) * 2,
    scale: 1,
  }
}

/**
 * Chapter 4's gather band, in screen-%. Lives here rather than in the chapter so the invariant
 * sweep in src/__tests__ measures the REAL numbers — a check that mirrors its own copy of the
 * constants passes happily while the screen it is meant to protect falls apart.
 */
export const GATHER_LEFT = 62        // the gather band's LEFT limit — it never reaches the huddle
export const GATHER_COL = 5.4        // % between columns; two rows, so a column holds two

/**
 * How small the gathered set is drawn. It stands further back than the waiting huddle, and the size
 * difference is doing real work — it reads as somewhere else in the scene rather than a second row
 * of the same thing.
 *
 * ⚠️ AND THE CAP IS PER SPECIES, BECAUSE THE COLUMN PITCH IS A CONSTANT AND THE CAST IS NOT.
 * `GATHER_COL` steps a flat 5.4% of the width per column, which reads as an even huddle in the
 * source and is even for exactly one creature. Spacing is what is LEFT AFTER THE BODIES, and the
 * cast's aspects run 0.805 (rabbit) to 1.746 (shark) — so at a flat 0.8 the share of each body still
 * showing ran from 74% (rabbit, a readable huddle) to 26% (shark, a heap). Measured live at
 * 1280×720: FIVE gathered fish read as three, in the one place the child has to count what they
 * have chosen. Same fault as chapter 2's line behind mother, one file along.
 *
 * ⚠️ Calibrated on the RABBIT, not on zero. A gathered group overlaps on purpose — that is what a
 * huddle is, and the rabbit's is the picture that was approved — so the rule is *nobody is buried
 * deeper than the rabbit*, which leaves the good case untouched by construction. A no-overlap rule
 * would have moved it. Pulling the SCALE back rather than widening the pitch is forced: measured,
 * the gather band leaves ~6.3% per column for four columns, so there is no room to spread into.
 */
export const CLUSTER_SCALE = 0.8
const CLUSTER_ASPECT = 0.805         // the rabbit's, from SHEETS — the approved picture
export const clusterScale = (src: string) => CLUSTER_SCALE * Math.min(1, CLUSTER_ASPECT / aspectOf(src))
export const HUDDLE_RIGHT = GATHER_LEFT - 6   // huddle ends here → every journey runs left→right
export const LEAD_X = 92             // where the leader stands if the sprite fits
export const LEAD_SCALE = 1.3

/**
 * A compact group standing beside the leader — chapter 4's gathered set. Fixed SLOTS laid out in
 * two rows back from `anchor`, never a row that re-packs: a creature already standing there must not
 * shuffle sideways because another one arrived. Movement without a journey is exactly what these
 * chapters are built to avoid, and a child counting a group cannot count it while it rearranges.
 * The row offset is half a column so the two rows interleave instead of stacking.
 */
export function clusterSpot(k: number, w: Habitat, anchor: number, colPct: number, minLeft: number, src: string): Spot {
  const col = Math.floor(k / 2), row = k % 2
  return {
    // Grows LEFTWARD from the leader, so the first to arrive stands right beside the character it
    // came to and the group extends back from there — which is how a group actually collects round
    // someone. Filling from a fixed left edge instead left the first two arrivals standing a
    // quarter of the screen away from Milo, gathered with nobody.
    left: Math.max(anchor - col * colPct - row * colPct * 0.5, minLeft),
    top: w.lineY + row * 3.5,
    // Per species — see clusterScale. `src` is REQUIRED rather than defaulted: a default is exactly
    // what lets a caller restore the flat 0.8 while everything still type-checks and stays green.
    scale: clusterScale(src),
  }
}

/**
 * Where the biggest character (mother, or Milo) can actually stand. Anchored on its CENTRE, so a
 * wide sprite at a fixed right-hand % simply ran off the edge and the leader was cut in half. Its
 * half-width is measured from the sprite's own aspect and it is pulled back only as far as it needs
 * to be, because every % it keeps is a % the waiting huddle loses.
 */
export function leadX(maxPct: number, sizePx: number, aspect: number, scale: number, vw: number): number {
  const halfPct = (sizePx * scale * aspect / 2) / Math.max(1, vw) * 100
  return Math.min(maxPct, 97 - halfPct)
}

// Measured, not guessed. The prompt pill sits at top 48–50 and is ~50 tall, so its bottom lands at
// 99px; 106 leaves a few px of air under it.
export const BANNER_PX = 106
// The bottom band. Chapter 2's map strip is ~39px tall 10px off the bottom (49); chapter 4's Ready
// button is 47px tall 10px off the bottom (57), so 56 left the reserve ONE PIXEL short of the
// button it exists to protect — measured live at 640×320, feet at 264 against a button top of 263.
// It only escaped notice because the creature that low happened not to be over the button.
export const STRIP_PX = 64

/**
 * Fit the two bands into the space actually available between the prompt and the bottom strip.
 *
 * The habitat's own numbers are an ART DIRECTION — fish belong mid-water, fliers up high — and on a
 * roomy screen they are used untouched. On a short landscape phone they cannot be: at 640×320 the
 * prompt alone owns the top 29% of the height, so the reef's line at 46% put every fish's head
 * behind it. A flat "short" nudge cannot fix that either, because it moves them the wrong way for
 * the high habitats and the right way only for the low one. So the constraint is stated instead.
 *
 * `leadScale` is the biggest thing standing on the far band (mother at 1.25×, Milo at his own
 * scale) — clearance has to be measured against THAT, not against the smaller creatures beside it.
 */
export function fitBands(h: Habitat, vh: number, sizePx: number, leadScale = 1.25, topPx = 0): Habitat {
  const minLine = (BANNER_PX + sizePx * leadScale) / Math.max(1, vh) * 100
  // `topPx` only lifts the WAITING band: it is what the chapter draws above a little one's head
  // (chapter 2's number tag). The leader carries no tag, and her own scale already dominates.
  const minWait = (BANNER_PX + topPx + sizePx) / Math.max(1, vh) * 100
  const maxFeet = (vh - STRIP_PX) / Math.max(1, vh) * 100
  if (h.lineY >= minLine && h.waitY0 >= minWait && h.waitY1 <= maxFeet) return h   // roomy: keep the art
  const lineY = Math.max(h.lineY, minLine)
  const waitY1 = Math.min(Math.max(h.waitY1, lineY + 6), maxFeet)
  const waitY0 = Math.min(Math.max(h.waitY0, lineY + 3, minWait), waitY1)
  return { ...h, lineY, waitY0, waitY1 }
}

/**
 * How far apart two rows must sit, as a fraction of sprite height, before they read as two rows
 * rather than one pile. Below this the near row simply covers the far one.
 */
export const ROW_SEP = 0.55

/**
 * The organic upward nudge applied to a standing spot, in screen-%. Shared, because any clamp that
 * protects a boundary has to BUDGET for it: `spreadBand` raised the far row to exactly the
 * head-clearance limit and the jitter then lifted it 2% further, straight behind the prompt. A
 * clamp that ignores a nudge applied after it is not a clamp.
 */
export const BAND_JITTER = 2

/**
 * The largest sprite that still lets `rows` SEPARATED rows fit between the prompt and the bottom
 * strip. Counting chapters need this: `fitBands` guarantees heads clear the prompt and feet clear
 * the strip, but it says nothing about the rows being distinguishable from each other, so on a
 * short screen it happily returns a band of a few pixels and both rows land on the same line.
 */
export function maxSizeForRows(vh: number, rows: number, topPx = 0): number {
  // BAND_JITTER is subtracted because `spreadBand` reserves it at the top of the band, and a clamp
  // that ignores a nudge applied after it is not a clamp. Without this the cap said a sprite fitted
  // and spreadBand then could not find it the room — measured on chapter 2's bunny at 640x320, rows
  // 47.6px apart against the 52.8px they needed.
  // ⚠️ `topPx` IS WHATEVER THE CHAPTER DRAWS ABOVE THE HEAD, and leaving it at 0 when there is
  // something there is how chapter 2's numbers ended up behind the prompt pill: BANNER_PX reserves
  // room for the SPRITE, and a number tag floats above it, OUTSIDE that box. Anything a chapter
  // hangs over a creature has to be declared here or the band it is given cannot hold it.
  const usable = Math.max(1, vh - BANNER_PX - topPx - STRIP_PX - vh * BAND_JITTER / 100)
  // FLOORED: every caller rounds the size it finally draws, and a cap a rounding step can
  // exceed is not a cap — 92.6 rounded to 93 left chapter 2's rows 0.6px short of ROW_SEP.
  return Math.floor(usable / (1 + ROW_SEP * Math.max(0, rows - 1)))
}

/**
 * Widen a standing band until `rows` rows are genuinely separated, pulling the FAR edge up (never
 * the near edge down — feet must stay clear of the bottom strip). Clamped by head clearance, so it
 * can only take room that is actually there.
 *
 * On a roomy screen the band already satisfies this and is returned untouched, which keeps each
 * habitat's art direction intact — fish mid-water, fliers high — exactly as fitBands intends.
 */
export function spreadBand(b: Habitat, vh: number, size: number, rows: number, topPx = 0): Habitat {
  if (rows <= 1) return b
  const needPct = (size * ROW_SEP * (rows - 1)) / Math.max(1, vh) * 100
  if (b.waitY1 - b.waitY0 >= needPct) return b
  const headroomPct = (BANNER_PX + topPx + size) / Math.max(1, vh) * 100 + BAND_JITTER
  // Pulling the FAR edge up is the first move, because feet must stay clear of the bottom strip.
  // But a habitat whose art direction holds the band high — fish mid-water, fliers up in the sky —
  // can run out of headroom before the rows are separated, and then the near row simply covers the
  // far one. Measured on chapter 2 at 640x320: the reef sat 36.8px apart against 52.8px needed
  // while 26% of the frame below it stood empty. So when the far edge has given all it can, the
  // NEAR edge takes the rest — down to `maxFeet`, which is the floor fitBands already enforces.
  // Art direction is worth keeping right up to the point where a number cannot be read.
  const waitY0 = Math.max(b.waitY1 - needPct, headroomPct)
  if (b.waitY1 - waitY0 >= needPct) return { ...b, waitY0 }
  const maxFeet = (vh - STRIP_PX) / Math.max(1, vh) * 100
  return { ...b, waitY0, waitY1: Math.min(maxFeet, waitY0 + needPct) }
}

// ─── Timing: one cycle carries one stride ────────────────────────────────────────────
/**
 * A sheet playing `fps/frames` cycles a second, each carrying `STRIDE` body-heights, gives a real
 * ground speed. Travel time then falls out of the DISTANCE, so a creature crossing twice as far
 * takes twice as long — which is what makes it read as walking rather than being placed. A flat
 * duration on an ease-out curve had them shoot across and settle, far too fast to see the walk
 * that was drawn for them.
 */
export function groundSpeed(src: string, h: number): number {
  const sheet = SHEETS[src]
  const cyclesPerSec = sheet ? sheet.fps / sheet.frames : 2
  return Math.max(60, cyclesPerSec * STRIDE * h)      // px per second
}
/**
 * How fast a thing with NO gait of its own travels, in px/sec — an apple carried on, a balloon
 * drifting in. A creature's speed is derived from its cycle so the feet cannot skate; an object has
 * no feet, so the number is simply stated here rather than pretended to be derived from something.
 */
export const CARRY_SPEED = 620
export const hasSheet = (src: string) => !!SHEETS[src]
/**
 * A journey: how long it takes, AND how much the walk cycle has to be scaled to match it.
 *
 * THE SECOND HALF IS NOT OPTIONAL, and leaving it out is how every chapter ended up skating. The
 * duration is derived from the creature's own gait — and then CLAMPED, and the clamp is not a rare
 * edge case: measured across the cast, a journey of 60% of the screen wants 5–10 SECONDS at a
 * natural walking pace, so every long journey was pinned to TRAVEL_MAX and the body then covered
 * ground at 2–4× the speed its legs were running at. That is the "one cycle carries one stride"
 * invariant this whole engine is built on, silently thrown away by a `Math.min`.
 *
 * So the clamp now returns its own correction: if the body is forced to move faster than the gait,
 * the cycle is sped up by exactly that ratio (and slowed, when TRAVEL_MIN stretches a short hop).
 * Callers must pass `cycleScale` straight through to Critter — the same treatment the march has
 * always had, now applied to every journey rather than only the showy one.
 */
export interface Journey { ms: number; cycleScale: number }
export function journeyOf(a: Spot, b: Spot, vw: number, vh: number, h: number, src: string): Journey {
  const dist = Math.hypot((b.left - a.left) / 100 * vw, (b.top - a.top) / 100 * vh)
  const natural = dist / groundSpeed(src, h) * 1000
  const ms = Math.round(Math.min(TRAVEL_MAX, Math.max(TRAVEL_MIN, natural)))
  return { ms, cycleScale: Math.max(0.4, natural / ms) }
}
// There is deliberately NO duration-only helper. `travelMs` used to be one, and every caller that
// reached for it got a clamped duration with no way to know the clamp had happened — which is the
// entire bug above. Returning the pair is what makes the correct thing the only thing.

/**
 * The same journey, for something laid out IN FLOW rather than at screen percentages: it travels a
 * stated number of px instead of between two spots. Exported so a chapter can time its own
 * choreography (when to open the question) off the SAME numbers the sprite is animated with, rather
 * than guessing a duration that then disagrees with what is on screen.
 */
export function inFlowJourney(src: string, h: number, distPx: number): Journey {
  const speed = SHEETS[src] ? groundSpeed(src, h) : CARRY_SPEED
  const natural = Math.abs(distPx) / speed * 1000
  const ms = Math.round(Math.min(TRAVEL_MAX, Math.max(240, natural)))
  return { ms, cycleScale: Math.max(0.4, natural / ms) }
}

/**
 * Travel for an IN-FLOW element: it starts off (or ends up) `dist` px from its slot and moves there
 * at a constant speed. `transform` never touches layout, so the slot is reserved from the moment the
 * thing mounts — the row does not reflow around it as it arrives, and a group already being counted
 * cannot shuffle sideways underneath the child.
 *
 * The child is a FUNCTION of whether the thing is currently moving, because a drawn cycle must run
 * during the travel and stop dead at both ends. Handing the flag down is what stops a sprite walking
 * on the spot through its stagger delay, or sliding the last leg with its legs already parked —
 * which is the same "cycle and travel given different numbers" fault, one layer in.
 */
export function Arrive({ dist, ms, delayMs = 0, leave = false, resetKey, children }: {
  dist: number; ms: number; delayMs?: number
  /** Travel OUT to `dist` instead of in from it. A departure is a journey too. */
  leave?: boolean
  /** Changes per round where the element is REUSED across rounds — without it the travel plays
   *  once and is silently dead every round after (see chapter-craft.md). */
  resetKey?: string | number
  children: (moving: boolean) => React.ReactNode
}) {
  const [phase, setPhase] = useState<0 | 1 | 2>(ms <= 0 ? 2 : 0)   // waiting · travelling · done
  /**
   * The journey's identity. When it changes — a group whose travel is switched on when its turn
   * comes, or a creature that has landed and is now being sent back out — `phase` belongs to the
   * PREVIOUS journey for one render, and effects run after paint. At phase 2 a freshly-set `leave`
   * reads as "already gone", so the element is painted one frame lurching toward the exit before
   * the effect resets it. Resetting during render (React's own derive-state-from-props escape
   * hatch) means there is no such frame.
   */
  const sig = `${resetKey}|${leave}|${dist}|${ms}|${delayMs}`
  const [seen, setSeen] = useState(sig)
  if (seen !== sig) { setSeen(sig); setPhase(ms <= 0 ? 2 : 0) }
  useEffect(() => {
    if (ms <= 0) { setPhase(2); return }
    setPhase(0)
    // One frame minimum, so the start state is painted before the transition is asked for.
    const go = window.setTimeout(() => setPhase(1), Math.max(delayMs, 16))
    const land = window.setTimeout(() => setPhase(2), delayMs + ms)
    return () => { window.clearTimeout(go); window.clearTimeout(land) }
  }, [resetKey, leave, ms, delayMs])
  const away = leave ? phase >= 1 : phase === 0
  return (
    <span style={{ display: 'block', transform: away ? `translateX(${dist}px)` : 'translateX(0)',
      // NO transition while waiting at the start position — phase 0 is a PLACEMENT, not a journey.
      // Without this, a caller that switches travel on later (a group that walks in only when its
      // turn comes, so `ms` goes 0 → n) animates the element OUT to its start point and back, which
      // is a slide in the wrong direction followed by the real one.
      transition: phase === 0 ? 'none' : `transform ${ms}ms linear` }}>
      {children(phase === 1)}
    </span>
  )
}

// ─── A HOP: a discrete ballistic jump, which is not a journey ────────────────────────
/**
 * How far one hop carries the body, in body heights. A stride is 0.85 (STRIDE); a jump covers more
 * ground than a step, which is most of why it reads as a jump rather than a bouncy walk.
 */
export const HOP_STRIDE = 1.5

/**
 * WHY THIS EXISTS AT ALL, given `journeyOf` and `Critter` are right there: a walk and a hop are
 * different in kind, not in degree, and three of the engine's assumptions break.
 *
 *  1. A WALK'S BODY MOVES AT A CONSTANT SPEED. A hopper is stationary while it gathers itself and
 *     only travels once it is off the ground. Hand a hop to `Critter` and it slides along the
 *     ground while crouched — the skating fault in a new costume.
 *  2. A WALK'S CYCLE RUNS EXACTLY WHILE THE BODY COVERS GROUND, which is the invariant `Arrive`'s
 *     `moving` flag exists to enforce. For a hop the cycle runs the WHOLE time — the crouch is
 *     animation too — while the translation happens only over the airborne part. So the two cannot
 *     share one flag here, and that is precisely why `Arrive` cannot be bent to do this.
 *  3. THE VERTICAL IS ALREADY DRAWN. A generated hop carries its arc inside the frames (Milo's feet
 *     lift 0 → 47 → 0 px in a 256px cell). Adding a CSS arc on top makes him rise twice.
 *
 * The happy consequence of (3): the CONTAINER never leaves the ground — only the pixels inside it
 * do — so a contact shadow sitting at the container's bottom stays on the ground by construction
 * while travelling horizontally with him. No shadow/feet desync is possible here.
 *
 * Timing is locked the same way a walk's is: one cycle carries one hop. The sheet's own
 * `frames / fps` IS the hop duration, so the legs and the ground can never disagree.
 */
export interface HopJourney {
  /** How many separate jumps this journey takes. */
  hops: number
  /** One jump, ms — the sheet's own cycle length. */
  cycleMs: number
  /** hops × cycleMs. Choreograph off this, never off a guess. */
  totalMs: number
  /** Ground covered per jump, px (signed — negative travels left). */
  dxPx: number
  /** Of one cycle: gathering on the ground, then airborne. They sum to cycleMs. */
  holdMs: number
  airMs: number
}
export function hopOf(src: string, h: number, distPx: number): HopJourney {
  const sheet = SHEETS[src]
  const cycleMs = sheet ? (sheet.frames / sheet.fps) * 1000 : 700
  const hops = Math.max(1, Math.round(Math.abs(distPx) / Math.max(1, HOP_STRIDE * h)))
  const holdMs = Math.round(cycleMs * (sheet?.groundShare ?? 0.4))
  return { hops, cycleMs, totalMs: hops * cycleMs, dxPx: distPx / hops, holdMs, airMs: cycleMs - holdMs }
}

/**
 * Travels `distPx` in whole jumps, landing on each one. `onLand(i)` fires as each jump lands, so a
 * chapter can reveal something exactly when the feet touch rather than on a guessed timer.
 *
 * State machine rather than one long CSS animation, deliberately: this mirrors `Arrive`'s shape
 * (phase + timeouts), and a generated keyframes string per (hop count × distance) would be the kind
 * of clever that this codebase has repeatedly had to debug at 3am.
 */
export function Hop({ src, h, facesLeft, distPx, delayMs = 0, resetKey, onLand, onDone, children }: {
  src: string; h: number; facesLeft?: boolean
  distPx: number; delayMs?: number
  /** Changes per round where the element is REUSED — without it the hop plays once and is silently
   *  dead every round after, which is invisible to a single check (see chapter-craft.md). */
  resetKey?: string | number
  onLand?: (index: number) => void
  onDone?: () => void
  /**
   * Anything that must travel WITH him — a sign over his head, a label, a held object. It renders
   * inside the moving element, positioned against the sprite's own box, because two things that
   * must move as one should BE one element: left outside, they are one duration change away from
   * drifting apart, which is the shadow-outran-the-feet bug this repo has already shipped once.
   */
  children?: React.ReactNode
}) {
  const j = hopOf(src, h, distPx)
  const [landed, setLanded] = useState(0)          // jumps completed
  const [going, setGoing] = useState(false)
  const land = useLatestRef(onLand)
  const done = useLatestRef(onDone)

  // Reset during RENDER, not in an effect: effects run after paint, so a re-hop would be painted
  // one frame at the previous journey's end offset before being pulled back. Same reason as Arrive.
  const sig = `${resetKey}|${distPx}|${j.hops}`
  const [seen, setSeen] = useState(sig)
  if (seen !== sig) { setSeen(sig); setLanded(0); setGoing(false) }

  useEffect(() => {
    setLanded(0); setGoing(false)
    const timers: number[] = []
    // One frame minimum before the first transition is asked for, so the start state is painted at
    // x=0 rather than the browser coalescing it into the target and skipping the move entirely.
    const t0 = Math.max(delayMs, 16)
    timers.push(window.setTimeout(() => setGoing(true), t0))
    for (let i = 1; i <= j.hops; i++) {
      // The TARGET advances at the START of jump i, so its hold+flight fills that cycle...
      timers.push(window.setTimeout(() => setLanded(i), t0 + (i - 1) * j.cycleMs))
      // ...and the landing is reported at its END, which is when the feet actually touch.
      timers.push(window.setTimeout(() => land.current?.(i - 1), t0 + i * j.cycleMs))
    }
    timers.push(window.setTimeout(() => { setGoing(false); done.current?.() }, t0 + j.totalMs + 16))
    return () => timers.forEach(window.clearTimeout)
  }, [sig, delayMs, j.hops, j.cycleMs, j.totalMs])

  // The translation holds through the crouch and then runs at constant speed — real ballistics, and
  // the reason a hopper does not skate. `landed` steps one jump at a time, so each leg is its own
  // linear transition rather than one long slide across the whole distance.
  const x = landed * j.dxPx
  return (
    <span style={{ display: 'block', width: Math.round(h * (SHEETS[src]?.cellAspect ?? 1)), height: h,
      transform: `translateX(${x}px)`,
      transitionProperty: 'transform',
      transitionDuration: `${j.airMs}ms`,
      transitionDelay: `${j.holdMs}ms`,
      transitionTimingFunction: 'linear' }}>
      <span style={{ display: 'block', position: 'relative' }}>
        {children}
        {/* The cycle runs for the WHOLE journey — the crouch is animation too. This is the one place
            the engine's "legs run exactly while the body covers ground" rule does NOT apply. */}
        <SheetCell src={src} h={h} facesLeft={facesLeft} moving={going} breathe={!going} />
      </span>
    </span>
  )
}

// ─── A creature: sprite + its drawn cycle ────────────────────────────────────────────
/**
 * The cycle RUNS only while the creature is actually travelling. A walk cycle looping on a
 * stationary creature is skating on the spot — chapter 1 rebuilt its parade twice before that
 * lesson stuck. A waiting creature breathes instead, and now and then takes a little hop.
 */
export function Critter({ src, facesLeft, at, size, move, z, durMs, cycleScale = 1, moving, facingLeft, breathe, hop, wiggle, dim, children }: {
  src: string; facesLeft?: boolean; at: Spot; size: number; move: Habitat['move']; z: number
  /**
   * How long THIS move takes. It must be stated by the caller, never inferred from `moving`:
   * deriving it meant a tapped creature got the long march duration while its legs were switched
   * off on the short one, so it walked for a second and then slid the rest of the way frozen.
   * The cycle and the travel have to be given the same number or the feet stop matching the ground.
   */
  durMs: number
  /** Play the walk cycle faster than its natural cadence. Used only for a march or an exit, which
   *  covers more ground per second than a stroll — without it the feet skate on the way out. */
  cycleScale?: number
  moving?: boolean; facingLeft?: boolean; breathe?: boolean; hop?: boolean; wiggle?: boolean; dim?: boolean
  children?: React.ReactNode
}) {
  const [sheetFailed, setSheetFailed] = useState(false)
  const sheet = sheetFailed ? undefined : SHEETS[src]
  const aspect = sheet?.cellAspect ?? 1
  const h = Math.round(size * at.scale)
  const w = Math.round(h * aspect)
  // The art's own facing, flipped to whichever way this creature is currently pointing.
  const flip = (facesLeft ? !facingLeft : facingLeft)
  /**
   * ⚠️⚠️ THE JOURNEY IS A `transform`. IT USED TO BE `left`, `top`, `width` AND `height`, AND ALL
   * FOUR OF THOSE ARE LAYOUT PROPERTIES — so every frame of every journey relaid out the document,
   * once per travelling creature. Measured with Chrome's own counters (CDP Performance.getMetrics)
   * on seven creatures travelling for two seconds — which is exactly what HomeTime puts on screen:
   *
   *     left/top/width/height   121 layout passes, 11.4 ms of layout
   *     transform                 0 layout passes,  0.0 ms
   *
   * A transform is composited: no layout, no paint, off the main thread. This is the single
   * cheapest frame-rate win available in the 3–11 band, because `Critter` is the one component
   * every chapter in it draws several of at once.
   *
   * ⚠️ AND THE POSITION STAYS A PERCENTAGE, NOT `translate(Xvw, Yvh)`. The two read as equivalent
   * and are not the moment any ancestor carries CSS `zoom`: a fixed element's percentage offsets
   * are scaled by the zoom and viewport units are not — measured at the time, they diverged by up
   * to 576px at zoom 1.45. `/game` DID wrap every chapter in `.game-zoom { zoom: … }`; that wrapper
   * has since been deleted (it was dead — every chapter `createPortal`s to document.body, so it
   * never had a child to scale), so nothing zooms these today. The percentage form is kept anyway
   * because it costs nothing and is the one that stays correct if a zoomed ancestor ever returns:
   * `translate(X%, Y%)` on a mover the size of the containing block IS `left: X%`, at any zoom.
   *
   * Proven, not asserted: 2,772 rendered rects (sprite · sheet cell · contact shadow · number sign)
   * across 63 creature/spot/size combinations × 4 viewports × 3 zoom levels, before and after —
   * see the `critterlab` sweep in this commit's history.
   */
  const glide = `transform ${durMs}ms linear`
  /**
   * The sprite is authored at its BASE size and scaled, so a depth change (huddle 1.0 → cluster 0.8)
   * still tweens smoothly but does it on the compositor instead of resizing a box every frame.
   * `transform-origin: 50% 100%` is THE FEET: scaling about the bottom centre is what keeps a
   * creature standing exactly on its ground line at every scale, which is the invariant every
   * layout sweep in `src/__tests__` is built on.
   */
  /**
   * ⚠️ THE BASE IS TODAY'S BOX DIVIDED BY THE SCALE, NOT `size` — so `scale()` exactly undoes the
   * division and the rendered box is `w × h` to the pixel. Authoring it as `size × size*aspect`
   * looks equivalent and is not: `w` and `h` are each ROUNDED (`round(round(size*scale)*aspect)`),
   * and re-deriving them through a different rounding chain moved the visible creature by up to
   * 2.2px and its 12-cell strip by 26px. Measured across the whole sweep, before and after — this
   * form is 0.0px on all 2,772 rects.
   */
  const s = Math.max(at.scale, 0.05)     // never divide by a zero scale
  const baseH = h / s
  const baseW = w / s
  return (
    // The stage: a fixed box the size of the containing block, so the mover's percentages mean the
    // same thing `left`/`top` used to. It paints nothing and swallows nothing.
    <div style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', zIndex: z, pointerEvents: 'none' }}>
      {/* LINEAR, not eased: a walking creature travels at a constant speed. An ease-out curve puts
          most of the distance in the first third, which is what made it read as a slide. */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
        transform: `translate(${at.left}%, ${at.top}%)`, transition: glide }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: baseW, height: baseH,
          transformOrigin: '50% 100%', transform: `translate(-50%,-100%) scale(${s})`, transition: glide }}>
          {/* The contact shadow is a CHILD of the creature, not a sibling positioned alongside it.
              As a sibling it carried its own transition, so when a march stretched the creature's
              travel to 2800ms the shadow still ran at 950ms and slid out ahead of the feet. Parented,
              it cannot drift — there is only one thing moving.
              ⚠️ IT SCALES WITH THE CREATURE, AND SO DOES EVERYTHING ELSE INSIDE THIS BOX — that
              uniformity is the point. Moving the travel onto a `scale()` put the hop, the breathe
              and the drop-shadow filter inside the scaled subtree, so their pixel values follow
              depth whether anyone intends it or not; the first cut then divided THIS one back out
              to keep it fixed, which left the shadow saying "depth does not affect me" while the hop
              said it does. Either rule is defensible, both together is not. Everything scales:
              a nearer creature gets a bigger hop and a bigger shadow, which is the depth cue
              chapter-craft already asks for (nearer is lower AND bigger). Founder's call. */}
          {move === 'land' && (
            <span aria-hidden style={{ position: 'absolute', left: '50%', bottom: '-3%', transform: 'translateX(-50%)',
              zIndex: 0, width: '78%', height: size * 0.17, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at center, rgba(46,38,24,.3) 0%, rgba(46,38,24,0) 72%)' }} />
          )}
          {/* Every effect gets its own wrapper. Stack two transforms on one element and the later one
              silently wins — the bug that cost this codebase a day across three chapters. */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%',
            animation: wiggle ? 'ci_wiggle .5s ease' : hop ? 'ci_hop .55s ease' : breathe ? 'ci_breathe 3.1s ease-in-out infinite' : 'none' }}>
            <div style={{ width: '100%', height: '100%', transform: flip ? 'scaleX(-1)' : 'none',
              filter: `drop-shadow(0 3px 5px rgba(30,42,60,.28))${dim ? ' saturate(.85) brightness(.97)' : ''}` }}>
              {sheet ? (
                <span style={{ display: 'block', width: baseW, height: baseH, overflow: 'hidden', position: 'relative' }}>
                  <img src={sheet.url} alt="" aria-hidden draggable={false} decoding="async" onError={() => setSheetFailed(true)}
                    style={{ position: 'absolute', left: 0, top: 0, height: baseH, width: baseW * sheet.frames, maxWidth: 'none',
                      // LONGHAND, deliberately. With the `animation` shorthand beside
                      // `animationPlayState`, React warns and the play state can be reset whenever the
                      // shorthand is rewritten — which happens every time cycleScale changes.
                      animationName: 'ci-walk',
                      animationDuration: `${(sheet.frames / sheet.fps / cycleScale).toFixed(3)}s`,
                      animationTimingFunction: `steps(${sheet.frames})`,
                      animationIterationCount: 'infinite',
                      animationPlayState: moving ? 'running' : 'paused' }} />
                </span>
              ) : (
                <img src={src} alt="" draggable={false} decoding="async" loading="lazy"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.001' }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>
          </div>
        </div>
        {/**
          * ⚠️ THE NUMBER MARKER SITS OUTSIDE THE SCALED BOX, ON PURPOSE. Every caller anchors it the
          * same way — `position:absolute; left:50%; top:-d*0.72; translateX(-50%)` — but two of the
          * three size it off the BASE size and one off `size * at.scale`, so folding it into a
          * scaled box would silently resize the digits a child is reading. This wrapper is
          * zero-sized and sits exactly on the creature's anchor, then lifts by the creature's real
          * height: `left: 50%` of a zero-width box is 0, so the marker's own `translateX(-50%)`
          * still centres it on the anchor, and `top` still measures from the creature's crown.
          */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0,
          transform: `translateY(${-h}px)`, transition: glide }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * An IN-FLOW living sprite, for the chapters that lay their creatures out in a grid or a row rather
 * than at absolute screen positions (a balance pan, a tray of treats, a group of ten).
 *
 * `Critter` cannot serve those: it is `position: fixed` and drives itself off screen percentages.
 * This is the same sheet mechanism sized to whatever cell it is dropped into.
 *
 * ⚠️ IT ARRIVES, THEN IT STOPS. A creature standing in a balance pan with its legs pumping is
 * skating on the spot — the rule the parade learned and every chapter since has had to be re-told.
 * So the cycle runs ONLY during the walk-in and is `paused` the moment it lands, after which the
 * creature is kept alive by a breath rather than by a lie. The walk-in DURATION is derived from the
 * sprite's own gait through `groundSpeed`, so one cycle still carries one stride and the feet never
 * outrun the body.
 *
 * A sprite with no sheet still travels — an apple carried on, a balloon drifting over — it simply
 * has no legs to run while it does. Travel and cycle are separate concerns: `walkIn` decides whether
 * the thing moves, the sheet decides whether anything about it is alive while it moves.
 */
export function SheetSprite({ src, h, facesLeft, delayMs = 0, walkIn = true, breathe = true, fromX, leave = false, resetKey }: {
  src: string; h: number; facesLeft?: boolean
  /** Stagger, so a group files in instead of marching in lockstep. */
  delayMs?: number
  walkIn?: boolean; breathe?: boolean
  /**
   * Where the journey starts, in px from the slot — signed, so a positive value brings it in from
   * the RIGHT. Defaults to 1.6 body-heights to the left: a step onto a pan or a tray. Pass a real
   * off-frame distance when the thing is meant to come in from outside the picture.
   */
  fromX?: number
  /** Travel OUT to `fromX` instead of in from it, and stay gone. */
  leave?: boolean
  /**
   * ⚠️ REQUIRED WHEREVER THE ELEMENT SURVIVES A ROUND, and leaving it out is a silent failure.
   * React reconciles these sprites across rounds — same component, same position, same key — so the
   * element is REUSED and its arrival state survives from the last round. Without a resetKey the
   * walk-in plays on the very first round and never again, which looks perfectly fine the one time
   * anybody checks it. Pass something that changes per round (the question itself will do).
   */
  resetKey?: string | number
}) {
  const dist = fromX ?? -h * 1.6
  // The cycle and the travel are given the SAME number, and the clamp reports its own correction —
  // exactly as a screen-percentage journey does. Without the second half a long arrival covers
  // ground faster than the legs claim, which is the skating fault this engine exists to prevent.
  const { ms, cycleScale } = inFlowJourney(src, h, dist)
  return (
    <Arrive dist={walkIn ? dist : 0} ms={walkIn ? ms : 0} delayMs={delayMs} leave={leave} resetKey={resetKey}>
      {moving => <SheetCell src={src} h={h} facesLeft={facesLeft} moving={moving}
        breathe={breathe && !leave} delayMs={delayMs} cycleScale={cycleScale} />}
    </Arrive>
  )
}

/**
 * Just the drawn creature, at a given size — no travel of its own. Split out of `SheetSprite`
 * because a chapter that puts something UNDER the sprite (a contact shadow, a name tag) has to
 * travel the pair as ONE element: a shadow positioned alongside its subject is one duration change
 * away from sliding out ahead of the feet, which is a bug this repo has already shipped once. Those
 * callers wrap `Arrive` around the whole group themselves and drop this inside it.
 */
export function SheetCell({ src, h, facesLeft, moving = false, breathe = true, delayMs = 0, cycleScale = 1 }: {
  src: string; h: number; facesLeft?: boolean
  /** Is the body covering ground right now? The legs run only then. */
  moving?: boolean
  breathe?: boolean; delayMs?: number; cycleScale?: number
}) {
  const [failed, setFailed] = useState(false)
  const sheet = failed ? undefined : SHEETS[src]
  const w = Math.round(h * (sheet?.cellAspect ?? 1))
  return (
    // One transform per wrapper: the breath and the facing flip are separate elements. Stack two on
    // one and the later silently wins — the bug that cost this codebase a day across three chapters.
    <span style={{ display: 'block', width: w, height: h,
      // It breathes only once it has stopped. A creature that is walking does not also bob.
      animation: !moving && breathe ? `ci_breathe 3.1s ease-in-out ${delayMs}ms infinite` : 'none' }}>
      <span style={{ display: 'block', width: '100%', height: '100%',
        transform: facesLeft ? 'scaleX(-1)' : 'none',
        filter: 'drop-shadow(0 2px 3px rgba(30,42,60,.26))' }}>
        {sheet ? (
          <span style={{ display: 'block', width: w, height: h, overflow: 'hidden', position: 'relative' }}>
            <img src={sheet.url} alt="" aria-hidden draggable={false} decoding="async" onError={() => setFailed(true)}
              style={{ position: 'absolute', left: 0, top: 0, height: h, width: w * sheet.frames, maxWidth: 'none',
                // Longhand beside animationPlayState — the shorthand resets the play state when
                // rewritten, and this one is rewritten the moment the creature lands.
                animationName: 'ci-walk',
                animationDuration: `${(sheet.frames / sheet.fps / cycleScale).toFixed(3)}s`,
                animationTimingFunction: `steps(${sheet.frames})`,
                animationIterationCount: 'infinite',
                // Runs ONLY while the body is actually covering ground: parked through the stagger
                // delay (it is standing still) and parked on arrival (it has stopped).
                animationPlayState: moving ? 'running' : 'paused' }} />
          </span>
        ) : (
          <img src={src} alt="" draggable={false} decoding="async" loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.001' }}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        )}
      </span>
    </span>
  )
}

export const CRITTER_CSS = `
@keyframes ci_breathe { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-2px) scale(1.015)} }
@keyframes ci_hop { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-13px)} 70%{transform:translateY(0)} }
@keyframes ci_wiggle { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-7deg)} 75%{transform:rotate(7deg)} }
`
