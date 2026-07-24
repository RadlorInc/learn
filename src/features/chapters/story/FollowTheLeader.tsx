'use client'
/**
 * Chapter 2 — number ORDER (skill `numberOrdering`), as FOLLOW THE LEADER.
 *
 * The little ones are scattered and mother is waiting to set off. They line up SMALLEST FIRST:
 * tap the smallest and that one really travels — its drawn walk cycle running the whole way —
 * and falls in behind her. Tap the wrong one and it just wriggles where it is; it is not its turn.
 * When the last one is in place the whole family marches off together.
 *
 * WHY THIS STORY AND NOT THE STEPPING STONES IT REPLACED: numbered stones are dead props. They
 * cannot be animated, they cannot be drawn in the backdrop's own painted style without bespoke art
 * per scene, and a numbered disc on a painted pond reads as a sticker no matter how it is shaded.
 * Numbered CREATURES solve all three at once — they are already painted in the app's style, they
 * already have drawn cycles, and they are alive on screen before anything is tapped.
 *
 * AND THE FINISHED LINE IS THE ANSWER. Every other shape this chapter could take (a slide queue, a
 * boat that fills up) consumes the answers as they are given. Here the round ends with 1·2·3·4·5
 * standing in a row — for a chapter whose entire skill is ORDER, that is the picture the child
 * should be left looking at.
 *
 * The rules chapters 1 and 3 established, all still in force:
 *   • The background holds perfectly still. Nothing scrolls, nothing parallaxes.
 *   • Nothing MOVES a creature the child still has to read. Waiting little ones hold their place
 *     (cycle paused, breathing, with the odd idle hop); only the one that has just been chosen
 *     travels, and by then it has been read.
 *   • The tap causes a journey, and the journey is the reward.
 *   • The scene must not be the same at question 10 as at question 1 — hence the map strip: the
 *     ten rounds are ONE walk home, and each family that sets off advances it a stage.
 *
 * Difficulty grows the SET to order, never the arithmetic: 3 consecutive numbers → up to 5, and at
 * the top tier they stop being consecutive (2·5·9), so the child has to compare rather than recite
 * the count sequence.
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { speak, speakSteps, useIsSpeaking, stopSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import { seqLength } from '@/core/adaptive'
import { useViewport } from '@/shared/hooks/useViewport'
import { SHEETS } from './canvas/sheets'
import { useNeedsRotate, RotateGate } from './RotateGate'

const SPEAK_LOCK_MS = 600
const TRAVEL_MIN = 1100, TRAVEL_MAX = 2400   // bounds on one little one's journey into the line
const STRIDE = 0.67            // how far one cycle of the walk carries a body, in body heights
const MARCH_MS = 2800          // the whole family walking off together, fully out of frame
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const shuffle = <T,>(a: T[]): T[] => {
  const r = a.slice()
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}
const frac = (x: number) => x - Math.floor(x)
const seeded = (i: number, s: number) => frac(Math.sin((i + 1) * s) * 43758.5453)

// ─── The cast and where each of them lives ───────────────────────────────────────────
/**
 * ONE chapter, not three worlds behind a picker. Every question draws a different creature from a
 * different habitat, so no two questions in a run look alike — which is the whole reason the cast
 * exists. Split across three separate worlds a child saw one habitat per sitting and the same three
 * creatures cycling; merged, ten rounds are ten different pictures.
 */
interface Habitat {
  scenes: string[]              // still backdrops — rotated, never scrolled
  move: 'land' | 'swim' | 'air'
  /**
   * The band of the picture the family occupies, as screen-%. This is the number that decides
   * whether they look like they belong or like they are hovering: on a forest backdrop the painted
   * ground does not start until ~76%, so a line drawn at 62% puts rabbits in the tree canopy — the
   * scenes below are all open ground from just past halfway. `lineY` is where the line forms
   * (further away, smaller); `waitY0..waitY1` is the nearer band the un-chosen ones wait in. For
   * fliers and swimmers the band is simply higher — being off the ground is correct for them.
   */
  lineY: number; waitY0: number; waitY1: number
}
const HABITATS: Record<string, Habitat> = {
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
interface Kind {
  src: string; facesLeft?: boolean; scale?: number
  little: string; mother: string; home: keyof typeof HABITATS
}
/**
 * Deliberately INTERLEAVED meadow → reef → sky rather than grouped, so consecutive questions change
 * habitat as well as creature. Ten entries against ten rounds means a full run never repeats one.
 */
const CAST: Kind[] = [
  { src: '/assets/objects/rabbit_side.png', facesLeft: true, little: 'bunny', mother: 'Mummy Rabbit', home: 'meadow' },
  { src: '/assets/objects/fish_side.png', little: 'fish', mother: 'Mummy Fish', home: 'reef' },
  { src: '/assets/objects/butterfly_side.png', scale: 0.85, little: 'butterfly', mother: 'Mummy Butterfly', home: 'sky' },
  { src: '/assets/objects/squirrel_side.png', scale: 0.95, little: 'squirrel', mother: 'Mummy Squirrel', home: 'meadow' },
  { src: '/assets/objects/turtle_side.png', scale: 0.95, little: 'turtle', mother: 'Mummy Turtle', home: 'reef' },
  // A ladybug CRAWLS — chapter 1 files it under CRAWLERS, not fliers, and its sprite is drawn
  // walking on its legs. In the sky habitat it hung in mid-air looking like it was flying.
  { src: '/assets/objects/ladybug_side.png', scale: 0.8, little: 'ladybug', mother: 'Mummy Ladybug', home: 'meadow' },
  { src: '/assets/objects/ant_side.png', scale: 0.82, little: 'ant', mother: 'Mummy Ant', home: 'meadow' },
  { src: '/assets/objects/crab_side.png', scale: 0.85, little: 'crab', mother: 'Mummy Crab', home: 'reef' },
  { src: '/assets/objects/firefly_side.png', scale: 0.78, little: 'firefly', mother: 'Mummy Firefly', home: 'sky' },
  { src: '/assets/objects/shark_side.png', facesLeft: true, scale: 1.05, little: 'shark', mother: 'Mummy Shark', home: 'reef' },
]
const kindAt = (i: number) => CAST[i % CAST.length]
const homeOf = (k: Kind) => HABITATS[k.home]
const JOURNEY = { from: '\ud83d\udc3e', to: '\ud83c\udfe0' }
const INTRO = 'The little ones are going home! They line up SMALLEST first. Watch how they do it.'

/** One question: the numbers the little ones wear (in the order they happen to be standing), and
 *  WHICH little ones they are — the cast rotates every round. */
interface LineRound { scene: string; nums: number[]; castIdx: number }

// ─── Stable backdrop ─────────────────────────────────────────────────────────────────
function Background({ scene, scenes }: { scene: string; scenes: string[] }) {
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

// ─── Layout ──────────────────────────────────────────────────────────────────────────
/**
 * Two places a little one can be: WAITING (spread across the foreground, nearer the camera so it
 * is big and easy to read) or IN LINE (up on the path behind mother, further away and smaller).
 * The size difference is doing real work — the line reads as somewhere else in the scene, not as
 * a second row of the same thing.
 */
interface Spot { left: number; top: number; scale: number }
// Mother stands further right and the line packs tighter than it used to. Both exist to buy the
// waiting huddle room: the huddle must end left of the LAST place in the line (or a creature would
// travel backwards into it), so every % the line gives back is a % the huddle can spread over.
// A tighter line is also truer — animals queueing nose-to-tail overlap slightly.
const MOTHER_X = 94          // where mother stands if she fits; pulled left when she does not
const LINE_GAP = 9
const MOTHER_SCALE = 1.25

/**
 * WAITING is a huddle on the LEFT; the line forms to the RIGHT of it. That ordering is not
 * decoration — it is what makes the animation read.
 *
 * The first build spread the waiting ones across the whole width, so a creature standing to the
 * RIGHT of its line place travelled BACKWARDS into it while its legs ran forwards. Moonwalking,
 * and it looked wrong even to someone who could not say why. Every waiting spot now sits left of
 * the leftmost place in the line, so every journey is left→right — the way they face, the way
 * their feet go.
 */
/**
 * The waiting huddle's extent. Left edge is 13%, not the very edge — a wide sprite (the turtle is
 * nearly twice as wide as it is tall) hangs off the screen from anything nearer. The right edge is
 * whatever room the LINE will not need, so travel is always forwards.
 *
 * `span` is the step between neighbours; because they alternate rows, two creatures in the SAME row
 * are `2 × span` apart — that figure is what a creature has to fit inside, and it is what `useSizes`
 * caps the sprite against. Without the cap they simply overlapped and a child could not tell which
 * number belonged to which animal.
 */
function huddleGeom(n: number, motherX = MOTHER_X, edgePct = 0) {
  // Left edge holds the widest sprite fully on screen — a shark is 1.75× wider than it is tall and
  // hung off the left at a flat 13%. Same reasoning as mother on the right: measured, not guessed.
  const left = Math.max(13, edgePct + 1)
  const right = Math.min(56, motherX - LINE_GAP * n - 4)
  return { left, right, span: n <= 1 ? 0 : (right - left) / (n - 1) }
}

/**
 * Where mother can actually stand. She is drawn 1.25× and anchored on her CENTRE, so a wide sprite
 * at a fixed 94% ran off the right edge — the leader was cut in half. Her half-width is measured
 * from the sprite's own aspect and she is pulled back only as far as she needs to be, because every
 * % she keeps is a % the waiting huddle loses.
 */
function motherX(sizePx: number, aspect: number, vw: number): number {
  const halfPct = (sizePx * MOTHER_SCALE * aspect / 2) / Math.max(1, vw) * 100
  return Math.min(MOTHER_X, 97 - halfPct)
}

/**
 * How many rows the huddle needs. Neighbours alternate rows, so with `rows` rows two creatures in
 * the SAME row are `rows × span` apart — adding a row is how a tight huddle buys horizontal room
 * without shrinking anyone. Two rows normally; three when the sprite is wide and the huddle narrow
 * (five sharks on a 1024px screen), which is the only case that could not otherwise fit.
 */
function huddleRows(spanPct: number, spriteWidthPct: number): number {
  if (spanPct <= 0) return 1
  return Math.min(3, Math.max(2, Math.ceil(spriteWidthPct / spanPct)))
}
function waitSpot(i: number, n: number, w: Habitat, mx = MOTHER_X, edgePct = 0, rows = 2): Spot {
  const { left, span } = huddleGeom(n, mx, edgePct)
  const row = rows <= 1 ? 0 : i % rows
  return {
    left: n <= 1 ? 22 : left + i * span,
    // Rows rather than one line: a single row on this side of the screen would have them
    // overlapping, and a huddle is what a group of babies actually looks like anyway.
    top: w.waitY0 + (rows <= 1 ? 0 : row / (rows - 1)) * (w.waitY1 - w.waitY0) + seeded(i, 12.9898) * 2,
    scale: 1,
  }
}
function lineSpot(k: number, w: Habitat, mx = MOTHER_X): Spot {
  return { left: mx - LINE_GAP * (k + 1), top: w.lineY, scale: 0.78 }
}
const motherSpot = (w: Habitat, mx = MOTHER_X): Spot => ({ left: mx, top: w.lineY, scale: MOTHER_SCALE })

/**
 * ONE CYCLE CARRIES ONE STRIDE. The journey used to take a flat 950ms on an ease-out curve, so a
 * little one shot across and settled — far too fast to see the walk, which is the whole point of
 * having drawn one. Travel time now comes from the DISTANCE and the creature's own cadence: a
 * sheet playing `fps/frames` cycles a second, each carrying `STRIDE` body-heights, gives a natural
 * ground speed, and the duration falls out of it. A creature crossing twice the distance takes
 * twice as long, exactly as it should.
 */
function groundSpeed(src: string, h: number): number {
  const sheet = SHEETS[src]
  const cyclesPerSec = sheet ? sheet.fps / sheet.frames : 2
  return Math.max(60, cyclesPerSec * STRIDE * h)      // px per second
}
function travelMs(a: Spot, b: Spot, vw: number, vh: number, h: number, src: string): number {
  const dist = Math.hypot((b.left - a.left) / 100 * vw, (b.top - a.top) / 100 * vh)
  return Math.round(Math.min(TRAVEL_MAX, Math.max(TRAVEL_MIN, dist / groundSpeed(src, h) * 1000)))
}

/** How far the family has to travel to leave the picture COMPLETELY. Sized off the tail of the
 *  line, not off mother — a fixed offset walked her off screen while the last two were still
 *  standing there, so the round ended with half the family stranded mid-exit. */
const marchDistance = (n: number, mx = MOTHER_X) => 122 - (mx - LINE_GAP * n)

// Measured, not guessed: the prompt pill sits at top 48–50 and is ~50 tall, so its bottom lands at
// 99px. 106 leaves a few px of air under it.
const BANNER_PX = 106     // the prompt pill and its breathing room at the top
// Measured too: the strip is ~39px tall and sits 10px off the bottom, so it owns the last 49px.
// At 34 the lowest waiting creature's feet landed 15px inside it.
const STRIP_PX = 56       // the journey strip along the bottom, plus air

/**
 * Fit the two bands into the space actually available between the prompt and the journey strip.
 *
 * The habitat's own numbers are an ART DIRECTION — fish belong mid-water, fliers up high — and on a
 * roomy screen they are used untouched. On a short landscape phone they cannot be: at 640×320 the
 * prompt alone owns the top 29% of the height, so the reef's line at 46% put every fish's head
 * behind it. A flat "short" nudge could not fix that either, because it moved them the wrong way
 * for the high habitats and the right way only for the low one.
 *
 * So the constraint is stated instead: feet low enough that the HEAD clears the prompt, high enough
 * that the feet clear the strip, and the line always further back than the huddle.
 */
function fitBands(h: Habitat, vh: number, sizePx: number): Habitat {
  // The LINE's clearance is measured against MOTHER, who stands on it at 1.25× and is therefore the
  // tallest thing there. Measured against the line members' 0.78× instead, her head went behind the
  // prompt at 640×320 and only escaped notice because she happens to stand right of a centred
  // banner — horizontal luck, which is not a guarantee.
  const minLine = (BANNER_PX + sizePx * MOTHER_SCALE) / Math.max(1, vh) * 100
  const minWait = (BANNER_PX + sizePx) / Math.max(1, vh) * 100
  const maxFeet = (vh - STRIP_PX) / Math.max(1, vh) * 100
  if (h.lineY >= minLine && h.waitY0 >= minWait && h.waitY1 <= maxFeet) return h   // roomy: keep the art
  const lineY = Math.max(h.lineY, minLine)
  const waitY1 = Math.min(Math.max(h.waitY1, lineY + 6), maxFeet)
  const waitY0 = Math.min(Math.max(h.waitY0, lineY + 3, minWait), waitY1)
  return { ...h, lineY, waitY0, waitY1 }
}

// ─── A creature: sprite + its drawn cycle ────────────────────────────────────────────
/**
 * The cycle RUNS only while the creature is actually travelling. A walk cycle looping on a
 * stationary creature is skating on the spot — chapter 1 rebuilt its parade twice before that
 * lesson stuck. A waiting creature breathes instead, and now and then takes a little hop.
 */
function Critter({ src, facesLeft, at, size, move, z, durMs, cycleScale = 1, moving, facingLeft, breathe, hop, wiggle, dim, children }: {
  src: string; facesLeft?: boolean; at: Spot; size: number; move: Habitat['move']; z: number
  /**
   * How long THIS move takes. It must be stated by the caller, never inferred from `moving`:
   * deriving it meant a tapped creature got the long march duration while its legs were switched
   * off on the short one, so it walked for a second and then slid the rest of the way frozen.
   * The cycle and the travel have to be given the same number or the feet stop matching the ground.
   */
  durMs: number
  /** Play the walk cycle faster than its natural cadence. Used only for the march, which covers
   *  more ground per second than a stroll — without it the feet skate on the way out. */
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
          As a sibling it carried its own transition, so when the march stretched the creature's
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
        animation: wiggle ? 'fl_wiggle .5s ease' : hop ? 'fl_hop .55s ease' : breathe ? 'fl_breathe 3.1s ease-in-out infinite' : 'none' }}>
        <div style={{ width: '100%', height: '100%', transform: flip ? 'scaleX(-1)' : 'none',
          filter: `drop-shadow(0 3px 5px rgba(30,42,60,.28))${dim ? ' saturate(.85) brightness(.97)' : ''}` }}>
          {sheet ? (
            <span style={{ display: 'block', width: w, height: h, overflow: 'hidden', position: 'relative' }}>
              <img src={sheet.url} alt="" aria-hidden draggable={false} decoding="async" onError={() => setSheetFailed(true)}
                style={{ position: 'absolute', left: 0, top: 0, height: h, width: w * sheet.frames, maxWidth: 'none',
                  // LONGHAND, deliberately. With the `animation` shorthand beside
                  // `animationPlayState`, React warns and the play state can be reset whenever the
                  // shorthand is rewritten — which happens every time cycleScale changes, i.e. at
                  // the start of every march.
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

/** The number a little one is wearing. Floats just above it, exactly as the counting chapter puts
 *  its count above each parading creature — same idiom, so a child moving between chapters reads
 *  it the same way. Painted cream, not a white UI pill: this sits inside the picture. */
function NumberTag({ n, size, lit }: { n: number; size: number; lit: boolean }) {
  const d = Math.max(24, Math.round(size * 0.42))
  return (
    <span aria-hidden style={{ position: 'absolute', left: '50%', top: -d * 0.72, transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: d, height: d, padding: '0 6px',
      borderRadius: 999, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: d * 0.64, lineHeight: 1,
      background: lit ? 'radial-gradient(circle at 38% 30%, #e9f8d2, #bfe3a0)' : 'radial-gradient(circle at 38% 30%, #fdf4e0, #ecdcbc)',
      color: lit ? '#3f6b1e' : '#5b3f22',
      boxShadow: 'inset 0 -2px 3px rgba(90,64,34,.2), 0 2px 5px rgba(40,30,18,.32)' }}>{n}</span>
  )
}

// ─── Sizing ──────────────────────────────────────────────────────────────────────────
function useSizes(n: number) {
  const { w: vw, h: vh } = useViewport()
  const short = vh < 470
  const baby = Math.round(Math.max(short ? 62 : 78, Math.min((vw * 0.8) / n, vh * (short ? 0.30 : 0.26), 168)))
  return { baby, short, vw, vh }
}

// ─── The scene ───────────────────────────────────────────────────────────────────────
/**
 * One surface for the demo, the guided round and the scored round — they differ only in who is
 * doing the tapping, so they must not be three different pictures.
 */
type Mode = 'demo' | 'guided' | 'practice'
const LineScene: React.FC<{ data: LineRound; mode: Mode; onDone: (correct: boolean) => void }> =
({ data, mode, onDone }) => {
  const { nums } = data
  const n = nums.length
  const sorted = useMemo(() => [...nums].sort((a, b) => a - b), [nums])
  const kind = kindAt(data.castIdx)
  const world = homeOf(kind)
  const { baby: baseSize, short, vw, vh } = useSizes(n)
  // Cap the sprite to the width it actually has in the huddle. A ladybug is 1.47× wider than it is
  // tall and a turtle 1.53×, so sizing on HEIGHT alone drew them far wider than their slot and they
  // buried each other — which is exactly when a child cannot tell which number belongs to which.
  const aspect = SHEETS[kind.src]?.cellAspect ?? 1
  // Order matters and there is no circularity: mother's place is fixed from the UNCAPPED size (an
  // over-estimate, so she always fits), that fixes how much room the huddle has, and only then is
  // the sprite capped to its slot.
  const rawSize = baseSize * (kind.scale ?? 1)
  const mx = motherX(rawSize, aspect, vw)
  const edgePct = (rawSize * aspect / 2) / Math.max(1, vw) * 100
  const spanPct = huddleGeom(n, mx, edgePct).span
  // NO floor on the slot. A `Math.max(span*2, 15)` floor here was the actual reason the huddle
  // crowded: it sized sprites for 15% of the width while spacing them by less than that, so they
  // were guaranteed to overlap exactly when the huddle was tightest.
  const rows = huddleRows(spanPct, (rawSize * aspect) / Math.max(1, vw) * 100)
  const slotPx = spanPct * rows / 100 * vw
  // 40px floor. It only ever binds in one corner — five SHARKS (1.75:1, the widest sprite in the
  // cast) at tier 3 on a small short-landscape phone — and even there the hit area stays at 46px,
  // above the 44px tap-target minimum, and the number tag at its own 24px floor. A slightly bigger
  // creature sitting on top of its neighbour's NUMBER is the worse trade: the number is the question.
  const babySize = Math.round(Math.max(40, Math.min(rawSize, (slotPx / aspect) * 0.98)))
  // Bands are fitted to the room between the prompt and the strip — see fitBands.
  const band: Habitat = fitBands(world, vh, babySize)

  const [joined, setJoined] = useState<number[]>([])     // values already in line, in join order
  const joinedRef = useRef<number[]>([])                 // same list, readable synchronously mid-tap
  // value → how long ITS journey takes. Several can be under way at once, so this is a map and
  // not a single slot: the child may tap 2 while 1 is still walking.
  const [flying, setFlying] = useState<Record<number, number>>({})
  const [wiggling, setWiggling] = useState<number | null>(null)
  const [idleHop, setIdleHop] = useState<number | null>(null)
  const [marching, setMarching] = useState(false)
  const [hint, setHint] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false), wrongLock = useRef(false), tapLock = useRef(false)
  const arrived = useRef(0)
  const timers = useRef<number[]>([])
  const speaking = useIsSpeaking()
  const after = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])

  // A waiting creature takes the odd little hop. This is what keeps the scene alive without
  // moving anything the child is still reading — the hop is in place and over in half a second.
  useEffect(() => {
    if (marching) return
    const id = window.setInterval(() => {
      const waiting = nums.filter(v => !joined.includes(v))
      if (!waiting.length) return
      const pick = waiting[Math.floor(Math.random() * waiting.length)]
      setIdleHop(pick)
      window.setTimeout(() => setIdleHop(h => (h === pick ? null : h)), 600)
    }, 2600)
    return () => window.clearInterval(id)
  }, [nums, joined, marching])

  /** Send one little one into the line, then hand back when it has arrived. */
  const sendToLine = useCallback((v: number, onArrive?: () => void) => {
    // Timed from THIS creature's own journey, so the leg cycle and the ground always agree.
    // The place in the line is claimed from the REF, which updates synchronously — two quick taps
    // would otherwise read the same stale state and both walk to the same spot.
    const from = waitSpot(nums.indexOf(v), n, band, mx, edgePct, rows)
    const to = lineSpot(joinedRef.current.length, band, mx)
    const ms = travelMs(from, to, vw, vh, babySize, kind.src)
    joinedRef.current = [...joinedRef.current, v]
    setJoined(joinedRef.current)
    setFlying(f => ({ ...f, [v]: ms }))
    after(ms, () => {
      setFlying(f => { const next = { ...f }; delete next[v]; return next })
      onArrive?.()
    })
  }, [after, nums, n, band, mx, edgePct, rows, vw, vh, babySize, kind.src])

  /** Everyone is in order — mother leads them off, and THAT is the reward for the round. */
  const marchOff = useCallback(() => {
    if (done.current) return; done.current = true
    setMarching(true)
    if (mode !== 'practice') speak('Off we go! Smallest first.')
    // Ends only once they are actually gone, so the exit plays out instead of being cut off.
    after(MARCH_MS - 200, () => onDone(mode === 'practice' ? !erred.current : true))
  }, [mode, onDone, after])

  // The demo drives words and movement from ONE narration, so they can never drift apart — and
  // when audio is blocked speakSteps still paces the steps on a timer.
  const ran = useRef(false)
  useEffect(() => {
    if (mode !== 'demo') { if (mode === 'guided') speak(`Now you! Tap the smallest ${kind.little} first.`); return }
    if (ran.current) return; ran.current = true
    const lines = [
      `${kind.mother} is waiting. The smallest one goes first.`,
      ...sorted.map((v, i) => (i === 0 ? `The smallest is ${v}. Come along, ${v}!` : `Then ${v}.`)),
      'Everybody in line!',
    ]
    const cancel = speakSteps(lines, {
      onStep: (i) => {
        if (i === 0) { setHint(sorted[0]); return }
        const k = i - 1
        if (k < sorted.length) { setHint(sorted[k + 1] ?? null); sendToLine(sorted[k]) }
        else { setHint(null); marchOff() }
      },
    })
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tap(v: number) {
    // The only thing a tap waits for is Milo finishing the LAST number he said, so two numbers are
    // never spoken over each other. It deliberately does NOT wait for the previous little one to
    // reach the line — a child who has already found 2 should not be made to watch 1 walk first.
    if (mode === 'demo' || done.current || speaking || tapLock.current) return
    if (joinedRef.current.includes(v)) return
    if (v === sorted[joinedRef.current.length]) {
      tapLock.current = true
      speak(String(v))
      after(SPEAK_LOCK_MS, () => { tapLock.current = false })
      // Hold on the finished line before they leave. That row IS the answer the child just built,
      // and marching straight off would snatch it away in a third of a second.
      // Counted on ARRIVAL, not on the tap, so the march never starts over a still-walking straggler.
      sendToLine(v, () => { arrived.current += 1; if (arrived.current === n) after(1200, marchOff) })
    } else {
      if (mode === 'practice') erred.current = true
      setWiggling(v)
      if (!wrongLock.current) {
        wrongLock.current = true
        speak(`Not yet! Find the smallest ${kind.little}.`)
        after(1300, () => { wrongLock.current = false })
      }
      after(620, () => setWiggling(w => (w === v ? null : w)))
    }
  }

  // The whole family slides off together on the march — one shared offset, so the line keeps its
  // spacing and reads as a procession rather than a scatter.
  const marchDx = marching ? marchDistance(n, mx) : 0
  // The exit covers far more ground per second than a stroll, so the cycle is sped up by exactly
  // that ratio — chapter 1's lesson, and the only way feet and ground stay locked on the way out.
  const marchCycle = Math.max(1, (marchDistance(n, mx) / 100 * vw) / (MARCH_MS / 1000) / groundSpeed(kind.src, babySize))
  const mother = motherSpot(band, mx)
  const motherAt = { ...mother, left: mother.left + marchDx }

  return (
    <>
      <Critter src={kind.src} facesLeft={kind.facesLeft} at={motherAt} size={babySize} move={world.move} z={26}
        durMs={MARCH_MS} cycleScale={marchCycle} moving={marching} facingLeft={false} breathe={!marching} />

      {nums.map((v, i) => {
        const k = joined.indexOf(v)
        const inLine = k >= 0
        const base = inLine ? lineSpot(k, band, mx) : waitSpot(i, n, band, mx, edgePct, rows)
        const at = { ...base, left: base.left + (inLine ? marchDx : 0) }
        const isTravelling = flying[v] !== undefined
        return (
          <React.Fragment key={v}>
            {/* Draw order is depth, stated outright: the line sits furthest back (24), mother just
                in front of it (26), and the waiting huddle nearest — with its FRONT row (odd
                indices, lower on screen) above its back row, so no creature can bury the number of
                the one behind it. The number is the whole question. */}
            <Critter src={kind.src} facesLeft={kind.facesLeft} at={at} size={babySize} move={world.move}
              z={inLine ? 24 : 30 + (i % 2) * 2}
              durMs={marching ? MARCH_MS : (flying[v] ?? TRAVEL_MIN)}
              cycleScale={marching ? marchCycle : 1}
              moving={isTravelling || (marching && inLine)} facingLeft={false}
              breathe={!inLine && !isTravelling} hop={idleHop === v} wiggle={wiggling === v}
              dim={inLine && !marching}>
              <NumberTag n={v} size={babySize * at.scale} lit={inLine} />
            </Critter>
            {/* The hit area is a plain button over the creature — the sprite itself stays
                pointer-transparent so a tap can never be swallowed by a flipped inner wrapper. */}
            {!inLine && mode !== 'demo' && (
              <button onClick={() => tap(v)} aria-label={`${kind.little} ${v}`}
                style={{ position: 'fixed', left: `${at.left}%`, top: `${at.top}%`, transform: 'translate(-50%,-100%)',
                  zIndex: 40, width: Math.round(babySize * at.scale * 1.05), height: Math.round(babySize * at.scale * 1.15),
                  padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
                  outline: hint === v ? '4px dashed rgba(242,107,44,.75)' : 'none', outlineOffset: 4, borderRadius: 18 }} />
            )}
          </React.Fragment>
        )
      })}
    </>
  )
}

// ─── The journey strip — what makes ten rounds ONE trip ──────────────────────────────
/** Lives OUTSIDE the round: SkillBeat rebuilds the scene every round, so anything drawn inside it
 *  resets. Each family that sets off moves the walk home one stage further along. */
function MapStrip({ done, total, journey }: { done: number; total: number; journey: typeof JOURNEY }) {
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 10, transform: 'translateX(-50%)', zIndex: 46,
      display: 'flex', alignItems: 'center', gap: 7, maxWidth: '92vw',
      background: 'rgba(255,255,255,.72)', border: '3px solid var(--milo-orange)', borderRadius: 999,
      padding: '5px 12px', boxShadow: '0 3px 0 rgba(242,107,44,.22)' }}>
      <span style={{ fontSize: 17 }}>{journey.from}</span>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ position: 'relative', width: 10, height: 10, borderRadius: '50%',
          background: i < done ? 'var(--milo-orange)' : 'rgba(61,37,22,.2)', transition: 'background .4s' }}>
          {i === done - 1 && <span style={{ position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)', fontSize: 15 }}>🐴</span>}
        </span>
      ))}
      <span style={{ fontSize: 17, filter: done >= total ? 'none' : 'grayscale(.55) opacity(.75)' }}>{journey.to}</span>
    </div>
  )
}

// ─── Value generation ────────────────────────────────────────────────────────────────
function makeRound(d: 1 | 2 | 3, round: number): LineRound {
  // The cast index picks the creature AND, through its habitat, which backdrops are even eligible —
  // a fish cannot line up on a lawn. Scene advances on its own cycle so the same creature does not
  // always appear against the same picture.
  const castIdx = round % CAST.length
  const home = homeOf(kindAt(castIdx))
  const scene = home.scenes[round % home.scenes.length]
  const len = Math.min(5, seqLength(d))
  // The CEILING is part of the difficulty, not just how many there are. Without this, tier 1 drew
  // its run start from 1–8, so a three-year-old's very first question could be 7·8·9 — bigger,
  // less familiar numbers than 1·2·3, at the tier that is supposed to be the gentlest. Tier 1 now
  // never goes past 5.
  const top = d === 1 ? 5 : 10
  // A consecutive run can be recited straight off the count sequence; a scattered set (2·5·9)
  // forces a real comparison. So the top tier mostly scatters, and tier 1 never does.
  const consecutive = d === 1 ? true : d === 2 ? Math.random() < 0.5 : Math.random() < 0.25
  const nums = consecutive
    ? (() => { const s = rint(1, Math.max(1, top - len + 1)); return Array.from({ length: len }, (_, i) => s + i) })()
    : shuffle(Array.from({ length: top }, (_, i) => i + 1)).slice(0, len)
  return { scene, nums: shuffle(nums), castIdx }
}

function makeLineBeat(): Beat<LineRound> {
  return {
    skillId: 'numberOrdering', rounds: 10, reteachAfter: 3, walkEvery: 3,
    make: (d, round = 0) => makeRound((d || 1) as 1 | 2 | 3, round),
    sig: d => [...d.nums].sort((a, b) => a - b).join(','),   // dedupe on the SET, not its shuffle or the rotating scene
    prompt: () => `Line them up — smallest first!`,
    say: d => `${kindAt(d.castIdx).mother} is ready! Tap the smallest ${kindAt(d.castIdx).little} first.`,
    Play: ({ data, onSubmit }) => <LineScene data={data} mode="practice" onDone={onSubmit} />,
    Reteach: ({ data, onDone }) => <LineScene data={data} mode="demo" onDone={() => onDone()} />,
  }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────────────
const FL_CSS = `
@keyframes fl_breathe { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-2px) scale(1.015)} }
@keyframes fl_hop { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-13px)} 70%{transform:translateY(0)} }
@keyframes fl_wiggle { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-7deg)} 75%{transform:rotate(7deg)} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'
const TOTAL_ROUNDS = 10

export default function FollowTheLeader({ onFinish, onExit }: {
  world?: string     // accepted for the /story route's shared signature; the chapter is one world now
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useState<Phase>('intro')
  const [scene, setScene] = useState<string>(HABITATS.meadow.scenes[0])
  const [homeStage, setHomeStage] = useState(0)
  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)
  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])

  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return; finished.current = true
    stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])

  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])
  const beat = useMemo(() => makeLineBeat(), [])

  // The demo and the guided round deliberately use DIFFERENT habitats, so the first thing a child
  // learns is that the place changes but the rule does not.
  const DEMO_ROUND: LineRound = { scene: HABITATS.meadow.scenes[0], nums: [3, 1, 2], castIdx: 0 }
  const GUIDED_ROUND: LineRound = { scene: HABITATS.reef.scenes[0], nums: [2, 3, 1], castIdx: 1 }
  const bgScene = phase === 'practice' ? scene : phase === 'guided' ? GUIDED_ROUND.scene : DEMO_ROUND.scene
  const allScenes = useMemo(() => Object.values(HABITATS).flatMap(h => h.scenes), [])

  // Landscape-first: the family walks ACROSS the picture, which a portrait phone has no room for.
  // This early return has to sit BELOW every hook — placed above `allScenes` it changed the hook
  // count the moment the phone was turned, and React tore the chapter down into the error boundary.
  if (needsRotate) return <RotateGate line="Milo&apos;s little ones line up in landscape! 🐴" />

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '10px 24px',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{FL_CSS}</style>
      <Background scene={bgScene} scenes={allScenes} />
      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '74%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            {INTRO}
          </div>
          <button onClick={() => setPhase('demo')}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s go! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner('Watch them line up')}
        <LineScene key="demo" data={DEMO_ROUND} mode="demo" onDone={() => setPhase('guided')} /></>)}

      {phase === 'guided' && (<>{Banner('Now you! Smallest first')}
        <LineScene key="guided" data={GUIDED_ROUND} mode="guided" onDone={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (<>
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={(data, round) => { if (data?.scene) setScene(data.scene as string); setHomeStage(round) }}
            onComplete={(c, w, mastered) => { result.current.correct += c; result.current.wrong += w; finishChapter(result.current.correct, result.current.wrong, mastered) }} />
        </div>
        <MapStrip done={homeStage} total={TOTAL_ROUNDS} journey={JOURNEY} />
      </>)}
    </div>
  )
}
