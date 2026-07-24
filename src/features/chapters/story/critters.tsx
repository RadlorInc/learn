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
import React, { useState } from 'react'
import { SHEETS } from './canvas/sheets'

export const STRIDE = 0.67                      // how far one cycle carries a body, in body heights
export const TRAVEL_MIN = 1100, TRAVEL_MAX = 2400   // bounds on one creature's journey

const frac = (x: number) => x - Math.floor(x)
export const seeded = (i: number, s: number) => frac(Math.sin((i + 1) * s) * 43758.5453)
export const shuffle = <T,>(a: T[]): T[] => {
  const r = a.slice()
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}

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
      {scenes.map(s => (
        <img key={s} src={s} alt="" draggable={false} decoding="async"
          onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: s === scene ? 1 : 0, transition: 'opacity .6s ease' }} />
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
export function clusterSpot(k: number, w: Habitat, anchor: number, colPct: number, minLeft: number): Spot {
  const col = Math.floor(k / 2), row = k % 2
  return {
    // Grows LEFTWARD from the leader, so the first to arrive stands right beside the character it
    // came to and the group extends back from there — which is how a group actually collects round
    // someone. Filling from a fixed left edge instead left the first two arrivals standing a
    // quarter of the screen away from Milo, gathered with nobody.
    left: Math.max(anchor - col * colPct - row * colPct * 0.5, minLeft),
    top: w.lineY + row * 3.5,
    // Smaller than the waiting huddle: this group stands further back. The size difference is
    // doing real work — it reads as somewhere else in the scene, not a second row of the same thing.
    scale: 0.8,
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
export function fitBands(h: Habitat, vh: number, sizePx: number, leadScale = 1.25): Habitat {
  const minLine = (BANNER_PX + sizePx * leadScale) / Math.max(1, vh) * 100
  const minWait = (BANNER_PX + sizePx) / Math.max(1, vh) * 100
  const maxFeet = (vh - STRIP_PX) / Math.max(1, vh) * 100
  if (h.lineY >= minLine && h.waitY0 >= minWait && h.waitY1 <= maxFeet) return h   // roomy: keep the art
  const lineY = Math.max(h.lineY, minLine)
  const waitY1 = Math.min(Math.max(h.waitY1, lineY + 6), maxFeet)
  const waitY0 = Math.min(Math.max(h.waitY0, lineY + 3, minWait), waitY1)
  return { ...h, lineY, waitY0, waitY1 }
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
export function travelMs(a: Spot, b: Spot, vw: number, vh: number, h: number, src: string): number {
  const dist = Math.hypot((b.left - a.left) / 100 * vw, (b.top - a.top) / 100 * vh)
  return Math.round(Math.min(TRAVEL_MAX, Math.max(TRAVEL_MIN, dist / groundSpeed(src, h) * 1000)))
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
  const h = Math.round(size * at.scale)
  const w = Math.round(h * (sheet?.cellAspect ?? 1))
  // The art's own facing, flipped to whichever way this creature is currently pointing.
  const flip = (facesLeft ? !facingLeft : facingLeft)
  return (
    <div style={{ position: 'fixed', left: `${at.left}%`, top: `${at.top}%`, transform: 'translate(-50%,-100%)',
      zIndex: z, width: w, height: h, pointerEvents: 'none',
      // LINEAR, not eased: a walking creature travels at a constant speed. An ease-out curve puts
      // most of the distance in the first third, which is what made it read as a slide.
      transition: `left ${durMs}ms linear, top ${durMs}ms linear, width ${durMs}ms linear, height ${durMs}ms linear` }}>
      {/* The contact shadow is a CHILD of the creature, not a sibling positioned alongside it.
          As a sibling it carried its own transition, so when a march stretched the creature's
          travel to 2800ms the shadow still ran at 950ms and slid out ahead of the feet. Parented,
          it cannot drift — there is only one thing moving. */}
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
            <span style={{ display: 'block', width: w, height: h, overflow: 'hidden', position: 'relative' }}>
              <img src={sheet.url} alt="" aria-hidden draggable={false} decoding="async" onError={() => setSheetFailed(true)}
                style={{ position: 'absolute', left: 0, top: 0, height: h, width: w * sheet.frames, maxWidth: 'none',
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
      {children}
    </div>
  )
}

export const CRITTER_CSS = `
@keyframes ci_breathe { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-2px) scale(1.015)} }
@keyframes ci_hop { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-13px)} 70%{transform:translateY(0)} }
@keyframes ci_wiggle { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-7deg)} 75%{transform:rotate(7deg)} }
`
