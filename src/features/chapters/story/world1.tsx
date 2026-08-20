'use client'
/**
 * The COUNTING chapter's play surfaces — the hunt-and-count scene, its demo, and the ten-round
 * adaptive practice `chapters.tsx` builds the chapter from.
 *
 * ⚠️ THIS FILE USED TO ALSO HOLD `world1`, a five-scene "Milo's Picnic Party" World with its own
 * number-recognition, matching-quantity, more/less and number-order beats. **Deleted 2026-08-20:
 * nothing imported it** — those four skills each have a real chapter of their own now (NestTree,
 * HomeTime, BigOrSmall, FollowTheLeader) — and it was actively misleading, because all four of its
 * beats declared `rounds: 1` or `rounds: 2`. The re-teach fires on the THIRD consecutive miss, so
 * every one of those beats carried a `Reteach` component that could never be shown, and a
 * difficulty that could never be promoted. The gate for that is
 * `src/__tests__/adaptiveDeepSweep.test.ts` §②, which derives its chapter list from the
 * `STORY_CHAPTERS` table so it only ever sees live chapters.
 *
 * Illustrated with hand-built SVG art (./art). See docs/story-mode-3-5.md.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { speak, speakSeq, speakAfterCurrent, useIsSpeaking } from '@/infra/useMiloSpeaker'
import { type Difficulty } from '@/core/progression'
import type { Beat } from './StoryWorld'
import { CountItem, type CountKind, COUNT_PLURAL } from './art'
import { BIOMES, type Band, type Biome, type BiomeId, type Storytelling } from './biomes'
import { useViewport } from '@/shared/hooks/useViewport'
import { rint, shuffle } from '@/core/rand'

// Fisher-Yates — an unbiased shuffle. (The old `sort(() => Math.random() - 0.5)` left
// small arrays mostly in place, so the practice nearly always opened on the pool's first
// creature — e.g. always a lamb on the farm.)
const bare: React.CSSProperties = { background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }

// Creatures are sized in px against a ~1000px-wide stage. On a tiny window they'd be
// too big; on a wide desktop, fixed px would look small. So we grow them with the
// viewport — but GENTLY (sub-linear): full proportional scaling made them look
// oversized and crowded on a real ~1900px browser. This keeps them a "medium" size at
// any width (≈ preview size at 1000px, only modestly bigger on a wide screen).
const DESIGN_W = 1000
// A pure function of the viewport, so it derives from `useViewport` (already imported and used in
// this very file) rather than owning a second, UNTHROTTLED resize listener beside it. Same numbers,
// same result — but no local state, no effect, and the measurement is rAF-throttled with an
// unchanged-size guard, which the hand-rolled pair was not.
function useScale() {
  const { w, h } = useViewport()
  const raw = w / DESIGN_W
  const damped = raw <= 1 ? raw : 1 + (raw - 1) * 0.4   // only 40% of the extra width
  const wScale = Math.max(0.85, Math.min(1.45, damped))
  // On SHORT viewports (landscape phones) shrink the creatures so they don't sprawl down
  // into the answer buttons. Tall frames (portrait / tablet / desktop) keep hFactor = 1,
  // so their look is unchanged.
  const hFactor = Math.min(1, h / 560)
  return Math.max(0.5, wScale * hFactor)
}

// Live viewport size — for layouts that must RESERVE room (objects vs. the answer buttons)
// so they never overlap on a short/landscape screen.

// ── Scene 1: COUNTING (tap each object; counts aloud; success-only) ──
interface CountData { n: number; obj: CountKind; band?: Band }

// ── In-scene counting: objects HIDE in the forest, the child hunts & counts ──
// Fireflies/butterflies are tucked into the leafy FOLIAGE BAND of the
// frozen forest (the tree-tops), not the sky or the grass path, so the child has
// to find each one and tap it. Positions are stable per round and kept clear of
// the top bar, Milo (far left), and the edges.
const frac = (x: number) => x - Math.floor(x)
const seed = (i: number, s: number) => frac(Math.sin((i + 1) * s) * 43758.5453)
// Lay objects out so they look SCATTERED across the tree — perched at many
// different heights and tilted, not parked in tidy rows. We still seat each one
// in its own grid cell (so they never pile up and each stays tappable), but then:
//   • shove it hard in Y (±0.5 cell) → every object sits at its own "branch" height
//   • stagger alternate rows sideways → columns don't line up
//   • tilt it a little → it reads as resting on a branch, not floating upright
// The window (X0..X1, Y0..Y1) is the tree-canopy band: left clears Milo, bottom
// stays above the trunks/grass so objects read as "in the leaves".
type Spot = { left: number; top: number; size: number; dur: number; rot: number; delay: number; depth: number }
// `band` is the per-biome spawn window (water low, sky high, leaves mid). Defaults
// to the forest canopy so non-biome callers keep working.
function scatter(n: number, band: Band = BIOMES.forest.band, demo = false, colsOverride?: number): Spot[] {
  // Favour WIDE layouts (landscape) and keep objects mostly in their grid cells so they
  // don't bunch up and overlap — overlapping objects made the right one hard to tap.
  // `colsOverride` lets a short/wide frame spread objects across more columns (fewer rows).
  const cols = colsOverride ?? Math.min(6, Math.max(1, Math.round(Math.sqrt(n) * 1.7)))
  const rows = Math.ceil(n / cols)
  const { x0: X0, x1: X1, y0: Y0, y1: Y1 } = band       // this biome's spawn window
  const cw = (X1 - X0) / cols, ch = (Y1 - Y0) / rows
  const base = demo ? 68 : 78                           // a touch smaller → more gaps, easier taps
  const rng = demo ? 20 : 24
  return Array.from({ length: n }, (_, i) => {
    const r = Math.floor(i / cols), c = i % cols
    const stagger = (r % 2 ? 0.14 : -0.14) * cw          // small odd/even shift so columns don't line up dead-straight
    const jx = (seed(i, 12.9898) - 0.5) * cw * 0.26 + stagger   // gentle jitter — stays well inside the cell
    const jy = (seed(i, 78.233) - 0.5) * ch * 0.45       // gentle vertical jitter (no cross-row bleed)
    const top = Math.max(Y0, Math.min(Y1, Y0 + ch * (r + 0.5) + jy))   // %
    // DEPTH (0 = near/front/low, 1 = far/back/high) read from where the object sits in
    // its band: the lower it is in the frame the NEARER it reads, so it's a touch bigger,
    // sits in front, and casts a darker contact shadow — same grounding cue RainbowTown
    // hand-tunes per object, here derived from each creature's own scattered height. (A
    // 1-row band collapses to a constant 0.5, leaving size/shadow unchanged.)
    const depth = Y1 > Y0 ? Math.max(0, Math.min(1, (Y1 - top) / (Y1 - Y0))) : 0.5
    return {
      left: Math.max(X0, Math.min(X1, X0 + cw * (c + 0.5) + jx)),   // %
      top,
      // farther/higher objects are a touch smaller (depth falloff) — adds aerial depth
      size: (base + Math.round(seed(i, 3.17) * rng)) * (1 - depth * 0.22),
      dur: 3.4 + seed(i, 5.71) * 2.4,                    // s — gentle flutter
      rot: Math.round((seed(i, 5.11) - 0.5) * 24),       // ±12° perched tilt
      delay: +(seed(i, 9.73) * 2).toFixed(2),            // s — desync the flutter
      depth,
    }
  })
}

// ── Orchard fruit hangs ON the trees ───────────────────────────────────────────────
// Apples/pears must sit on the tree CANOPIES, not float in the open central avenue of
// farm_orchard.png (the grassy gap down the middle has no trees). These anchors sit on
// the left + right tree rows (and a couple of back-row trees); fruit picks from them so
// it always reads as "in the trees". Used instead of scatter() for FRUIT only.
const FRUIT = new Set<CountKind>(['apple', 'pear'])
const ORCHARD_CANOPIES: Array<{ x: number; y: number }> = [
  { x: 15, y: 39 }, { x: 85, y: 39 }, { x: 25, y: 47 }, { x: 75, y: 47 },
  { x: 7, y: 44 }, { x: 93, y: 44 }, { x: 40, y: 57 }, { x: 60, y: 57 },
  { x: 33, y: 51 }, { x: 67, y: 51 },
]
function canopyScatter(n: number, demo = false): Spot[] {
  const base = demo ? 66 : 74
  return Array.from({ length: n }, (_, i) => {
    const a = ORCHARD_CANOPIES[i % ORCHARD_CANOPIES.length]
    const left = Math.max(4, Math.min(96, a.x + (seed(i, 12.9898) - 0.5) * 5))
    const top = Math.max(28, Math.min(64, a.y + (seed(i, 78.233) - 0.5) * 4))
    const depth = Math.max(0, Math.min(1, (64 - top) / (64 - 28)))   // higher in frame = farther
    return {
      left, top,
      size: (base + Math.round(seed(i, 3.17) * 16)) * (1 - depth * 0.18),
      dur: 3.4 + seed(i, 5.71) * 2.4,
      rot: Math.round((seed(i, 5.11) - 0.5) * 14),
      delay: +(seed(i, 9.73) * 2).toFixed(2),
      depth,
    }
  })
}
// Fruit → canopy anchors; everything else → the normal band scatter.
function spotsFor(n: number, obj: CountKind, band?: Band, demo = false, colsOverride?: number): Spot[] {
  return FRUIT.has(obj) ? canopyScatter(n, demo) : scatter(n, band, demo, colsOverride)
}

// One hidden object, perched: an outer flutter (gentle in-place bob, desynced per
// item) wrapping a static tilt, so objects look like they're resting on branches
// rather than drifting in formation. The pop+glow on "found" lives in CountItem.
// Some creatures read too small / camouflaged at the base size (their source art has
// more empty padding around the subject), so scale them up wherever they appear
// (demo + guided + practice all flow through here). Art is untouched — just display size.
const SIZE_BOOST: Partial<Record<CountKind, number>> = {
  firefly: 2.6, eagle: 1.9, fish: 2.6, shark: 2.4, turtle: 1.8, crab: 1.7, ant: 1.75, squirrel: 1.5, rabbit: 1.6, ladybug: 1.6,
  // Farm Day — bumped up so they read big enough on a wide screen (duck/bee/apple had
  // no boost before → rendered tiny).
  chick: 1.85, lamb: 1.95, duckling: 1.85, pear: 1.75, apple: 1.8, frog: 1.95, duck: 2.1, bee: 2.3, dragonfly: 2.15,
  // Space Adventure
  rocket: 1.95, star: 1.8, cloud: 1.95, planet: 1.95, comet: 2.1, satellite: 1.95, astronaut: 1.95, moonRock: 1.8, alien: 1.95,
}
// `num` (when given) shows the count number on the object once it's counted — used by
// the explanation so the child sees 1, 2, 3… land on each one. Until an object is
// counted (`on`) it BLINKS to invite a tap; tapping stops the blink. No more ✓ badge.
const PerchedItem: React.FC<{ p: Spot; obj: CountKind; on: boolean; idx: number; num?: number; cap?: number }> = ({ p, obj, on, idx, num, cap }) => {
  const scale = useScale()
  const size = Math.min(cap ?? Infinity, Math.round(p.size * (SIZE_BOOST[obj] ?? 1) * scale))
  const badge = Math.round(34 * scale)   // keep the count number proportional to the creature
  // GROUNDING CUE: a soft contact shadow cast on the ground/canopy directly BELOW each
  // creature — the "it belongs in the world, not pasted on" anchor RainbowTown adds. Unlike
  // RainbowTown's single shared ground LINE, these creatures live at many heights and most
  // fly/swim, so the shadow falls a short, depth-scaled distance under EACH one (a cast
  // shadow per object) rather than on one floor — that keeps the deliberate scattered
  // hover/perch/swim composition intact. Nearer (low, depth→0) → bigger + darker + closer;
  // farther (high, depth→1) → smaller + fainter + dropped further below.
  const shW = size * (0.62 - p.depth * 0.16)
  const shOp = Math.max(0.05, (0.24 - p.depth * 0.12) * (on ? 0.5 : 1))
  const shGap = size * (0.46 + p.depth * 0.5)   // how far below the object the shadow falls
  return (
    <span style={{ display: 'block', position: 'relative',
      animation: on ? 'fw_tap .45s cubic-bezier(.36,.07,.19,.97) both' : 'fw_blink .9s ease-in-out infinite' }}>
      {/* Soft contact shadow beneath this creature (drawn first so it sits under the art). */}
      <span aria-hidden style={{ position: 'absolute', top: `calc(50% + ${shGap}px)`, left: '50%', transform: 'translate(-50%,-50%)',
        width: shW, height: shW * 0.34, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at center, rgba(38,28,18,${shOp}) 0%, rgba(38,28,18,0) 72%)` }} />
      <span style={{ display: 'block', position: 'relative', zIndex: 1, transform: `rotate(${p.rot}deg)` }}>
        <CountItem kind={obj} on={on} size={size} variant={idx} blend />
      </span>
      {on && num != null && (
        // Centered ON the object (outer span centers; inner pops) so the number clearly
        // belongs to that object — not floating off in a far corner.
        <span aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 2, pointerEvents: 'none' }}>
          <span style={{ display: 'flex', minWidth: badge, height: badge, padding: `0 ${Math.round(7 * scale)}px`, alignItems: 'center', justifyContent: 'center',
            background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999,
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(20 * scale), color: 'var(--milo-orange)', lineHeight: 1,
            boxShadow: '0 2px 5px rgba(0,0,0,.3)', animation: 'fw_check .35s cubic-bezier(.36,.07,.19,.97) both' }}>{num}</span>
        </span>
      )}
    </span>
  )
}

// Big, prominent running-count badge (kept large so the number is easy to read).
const CountBadge: React.FC<{ value: number | string }> = ({ value }) => (
  <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 30,
    minWidth: 100, height: 100, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--paper)', border: '5px solid var(--milo-orange)', borderRadius: 999,
    fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 66, lineHeight: 1, color: 'var(--milo-orange)', boxShadow: '0 6px 0 rgba(242,107,44,.3)' }}>{value}</div>
)

// A persistent "collected" tray: one small icon of the counted object per tap, in a row just below
// the prompt — so as the child counts, the objects DON'T vanish, they gather here and the child can
// see how many they've got. Used by both the guided step and the scored practice.
const CollectTray: React.FC<{ obj: CountKind; n: number; maxCell: number; vw: number }> = ({ obj, n, maxCell, vw }) => {
  if (n <= 0) return null
  // ALWAYS a single row (never wrap). Use the big `maxCell` when few objects fit; if many wouldn't
  // fit the width, shrink the cell just enough that all n still sit in one row.
  const gap = Math.round(maxCell * 0.16)
  const avail = vw * 0.92 - 28                                   // usable width minus the box padding
  const cell = Math.max(22, Math.min(maxCell, Math.floor((avail - gap * (n - 1)) / n)))
  return (
    <div style={{
      // NOT fixed/positioned: the tray used to sit pinned at top-centre, which is exactly where the
      // parade creatures come to rest — so it covered the very things the child was counting. It now
      // lives in the bottom stack alongside the answer buttons, clear of every creature lane.
      maxWidth: '94vw', display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'center', gap,
      padding: `${Math.round(cell * 0.2)}px ${Math.round(cell * 0.34)}px`,
      background: 'rgba(255,255,255,.6)', border: '3px solid var(--milo-orange)', borderRadius: 18, boxShadow: '0 4px 0 rgba(242,107,44,.2)' }}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} style={{ display: 'block', flex: '0 0 auto', animation: 'fw_count .3s ease both' }}>
          <CountItem kind={obj} on={false} size={cell} />
        </span>
      ))}
    </div>
  )
}
// The GUIDED count — now the same come-and-go PARADE as the demo/practice, but the CHILD does
// the counting: creatures walk/fly/swim through ~2 at a time and the child taps each one to count
// it (it pops, walks off, and the next enters). The running number climbs on the pill. There's no
// "how many?" question here — that stays exclusive to the scored practice; once all N are counted
// this guided beat is done.
export const FlyingCountPlay: React.FC<{ data: CountData; onSubmit: (c: boolean) => void }> = ({ data, onSubmit }) => {
  const [stage, setStage] = useState<(Slot | null)[]>([null, null])
  const [counted, setCounted] = useState(0)
  const speaking = useIsSpeaking()              // block taps while Milo says a number, so fast taps can't skip the count
  const { w: vw, h: vh } = useViewport()
  const scale = useScale()
  const spawnedRef = useRef(0)
  const keyRef = useRef(0)
  const didInit = useRef(false)
  const done = useRef(false)

  const size = Math.max(48, Math.min(Math.round(vh * 0.3), Math.round(88 * (SIZE_BOOST[data.obj] ?? 1) * scale)))
  const bnd = data.band ?? BIOMES.forest.band
  const allCounted = counted >= data.n

  // Fill the opening one/two slots (didInit guards React strict-mode double effects).
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    setStage(() => {
      const next: (Slot | null)[] = [null, null]
      for (let s = 0 as 0 | 1; s < 2; s++) {
        if (spawnedRef.current < data.n) { next[s] = { key: keyRef.current++, slot: s, leaving: false }; spawnedRef.current++ }
      }
      return next
    })
  }, [data.n])

  function tap(slot: 0 | 1) {
    if (speaking || done.current) return
    const inst = stage[slot]
    if (!inst || inst.leaving) return
    setStage(prev => prev.map((it, i) => (i === slot && it ? { ...it, leaving: true } : it)))
    setCounted(c => { const n = c + 1; speak(String(n)); return n })
  }
  // A creature finished walking off: clear its slot and send in the next queued creature.
  function gone(slot: 0 | 1) {
    setStage(prev => {
      const next = [...prev]
      next[slot] = spawnedRef.current < data.n ? { key: keyRef.current++, slot, leaving: false } : null
      if (next[slot]) spawnedRef.current++
      return next
    })
  }
  // The 950ms is the beat between the last tap and the round being marked — long enough for a child
  // to see what they counted. ⚠️ It is CLEARED on unmount: without that, a child who counts the last
  // object and taps Menu inside the beat submits a correct answer for a round they walked out of,
  // and the session is written. The `done` ref stops it firing twice (it survives StrictMode's
  // double-invoke, which is why this is safe now that StrictMode is on); only the leak is new here.
  useEffect(() => {
    if (!allCounted || done.current) return
    done.current = true
    const t = window.setTimeout(() => onSubmit(true), 950)
    return () => window.clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCounted])

  return (
    <>
      {([0, 1] as const).map(s => {
        const inst = stage[s]
        return inst ? (
          <Parader key={inst.key} obj={data.obj} band={bnd} slot={s} size={size} leaving={inst.leaving}
            travelSecs={1.8} disabled={done.current || speaking} onTap={() => tap(s)} onGone={() => gone(s)} />
        ) : null
      })}
      {/* Collected objects — gathered along the BOTTOM, clear of the creature lanes above. */}
      <div style={{ position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 41, pointerEvents: 'none' }}>
        <CollectTray obj={data.obj} n={counted} maxCell={Math.max(40, Math.round(size * 0.42))} vw={vw} />
      </div>
    </>
  )
}
const CATCH_INTRO: Partial<Record<CountKind, string>> = {
  firefly: 'Fireflies are out!', butterfly: 'Look, butterflies!', eagle: 'Eagles in the trees!',
  chick: 'Fluffy chicks!', lamb: 'Little lambs!', duckling: 'Baby ducklings!',
  rocket: 'Rockets ready to fly!', star: 'Stars are out!', planet: 'Look, planets!', alien: 'Friendly aliens!',
}

// The opening demo, now in the SAME come-and-go PARADE as the practice: creatures walk/
// fly/swim into the scene ~2 at a time, Milo counts each one aloud (1…N, the number pops
// on the pill) and then it strolls off the far side so the next can enter — instead of all
// N piling up on the screen at once. Explanation → practice is one continuous look.
export const FlyingCountDemo: React.FC<{ to: number; obj: CountKind; band?: Band; onDone: () => void }> = ({ to, obj, band, onDone }) => {
  const [stage, setStage] = useState<(Slot | null)[]>([null, null])
  const [counted, setCounted] = useState(0)
  const { h: vh } = useViewport()
  const scale = useScale()
  const spawnedRef = useRef(0)
  const keyRef = useRef(0)
  const didInit = useRef(false)
  const timers = useRef<number[]>([])
  const stageRef = useRef<(Slot | null)[]>([null, null])
  const countedRef = useRef(0)
  const finished = useRef(false)
  stageRef.current = stage

  const size = Math.max(48, Math.min(Math.round(vh * 0.3), Math.round(88 * (SIZE_BOOST[obj] ?? 1) * scale)))
  const bnd = band ?? BIOMES.forest.band

  // A creature finished walking off: clear its slot and send in the next queued creature.
  function gone(slot: 0 | 1) {
    setStage(prev => {
      const next = [...prev]
      next[slot] = spawnedRef.current < to ? { key: keyRef.current++, slot, leaving: false } : null
      if (next[slot]) spawnedRef.current++
      return next
    })
  }

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    speak("Let's count together!")
    // Fill the opening one/two slots (same spawn machinery as the practice parade).
    setStage(() => {
      const next: (Slot | null)[] = [null, null]
      for (let s = 0 as 0 | 1; s < 2; s++) {
        if (spawnedRef.current < to) { next[s] = { key: keyRef.current++, slot: s, leaving: false }; spawnedRef.current++ }
      }
      return next
    })

    // Auto-count the paraders — the demo taps for the child. Each step marks the creature
    // that entered EARLIEST (smallest key) as "counted": it pops, walks off (→ a replacement
    // enters), the number ticks up, and the next step is scheduled. Alternating between the two
    // slots means every replacement gets ~2 cadences to walk in before it's its turn, so a
    // creature is never counted mid-entrance. If nothing has settled yet, wait briefly + retry.
    // Calm, slow pacing for the explanation (young kids) — creatures amble (TRAVEL) and there's a
    // long beat between counts. Faster than this reads as a race, not a count.
    const CADENCE = 2700
    function step() {
      if (finished.current) return
      const s = stageRef.current
      let pick: 0 | 1 | null = null
      for (const i of [0, 1] as const) {
        const it = s[i]
        if (it && !it.leaving && (pick === null || (s[pick] as Slot).key > it.key)) pick = i
      }
      if (pick === null) { timers.current.push(window.setTimeout(step, 300)); return }
      const slot = pick
      const n = countedRef.current + 1
      countedRef.current = n
      // Mark this creature counted AND stamp its number (shown floating above it via Parader).
      setStage(prev => prev.map((it, i) => (i === slot && it ? { ...it, leaving: true, num: n } : it)))
      setCounted(n)
      speak(String(n))
      if (n >= to) { finished.current = true; timers.current.push(window.setTimeout(onDone, 2200)) }
      else timers.current.push(window.setTimeout(step, CADENCE))
    }
    // Let the first (slower) creatures fully walk in before the counting starts.
    timers.current.push(window.setTimeout(step, 2000))
    return () => timers.current.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {([0, 1] as const).map(s => {
        const inst = stage[s]
        return inst ? (
          <Parader key={inst.key} obj={obj} band={bnd} slot={s} size={size} leaving={inst.leaving}
            num={inst.num} travelSecs={2.6} disabled onTap={() => {}} onGone={() => gone(s)} />
        ) : null
      })}
    </>
  )
}

// ── The PRACTICE: 10 adaptive "How many do you see?" questions ──
// Objects fly around the scene; the child counts and taps the matching number.
// Wrong is possible (unlike tap-to-collect), so the adaptive + 3-wrong-streak
// re-explanation actually fires. Re-explanation = Milo counts them out (a flying
// demo of exactly this quantity).
interface HowManyData { n: number; obj: CountKind; choices: number[]; band?: Band; biomeId?: BiomeId }
// Two steps: (1) the child taps each flying object to COUNT it — each tap grows the
// object (so none are recounted or missed) and Milo says the running count; (2) once
// every object is tapped, the number choices appear and the child picks the answer.
// ── Object-aware locomotion — how each creature moves through the scene ──────────────────
// flyers fly, swimmers swim, walkers walk, insects scuttle. Drives both WHERE a creature travels
// (its lane) and the ongoing gait it plays while on stage, so the counting scene reads like a
// living animated video rather than static sprites popping in.
type Loco = 'air' | 'ground' | 'water'
const LOCO: Partial<Record<CountKind, Loco>> = {
  // flyers
  butterfly: 'air', firefly: 'air', eagle: 'air', bee: 'air', dragonfly: 'air', pigeon: 'air',
  star: 'air', comet: 'air', satellite: 'air', cloud: 'air', planet: 'air', rocket: 'air',
  // swimmers
  fish: 'water', shark: 'water', turtle: 'water', octopus: 'water',
  // everything else walks (or crawls) on the ground — the default below (rabbit, squirrel, ant,
  // ladybug, chick, lamb, duckling, frog, duck, crab, astronaut, moonRock, alien…). The duck sprite
  // is a walking duck, so it waddles along the ground rather than swimming mid-water.
}
const locoOf = (k: CountKind): Loco => LOCO[k] ?? 'ground'
// Small ground creatures scuttle rather than plod.
const CRAWLERS = new Set<CountKind>(['ant', 'ladybug', 'crab', 'snail'])
type Gait = 'walk' | 'fly' | 'swim' | 'crawl'
const GAIT: Record<Gait, { name: string; dur: number }> = {
  walk:  { name: 'gait_walk',  dur: 0.52 },
  fly:   { name: 'gait_fly',   dur: 1.5 },
  swim:  { name: 'gait_swim',  dur: 1.7 },
  crawl: { name: 'gait_crawl', dur: 0.34 },
}
function gaitFor(obj: CountKind): Gait {
  const l = locoOf(obj)
  if (l === 'air') return 'fly'
  if (l === 'water') return 'swim'
  return CRAWLERS.has(obj) ? 'crawl' : 'walk'
}
// The vertical lane (viewport %) a creature travels along is taken from ITS OWN habitat band
// (bandFor already tunes this per biome — a forest rabbit on the grass, an eagle in the treetops, a
// crab on the seabed). Ground creatures sit near the BOTTOM of their band so they walk ON the ground
// (not float mid-scene); flyers ride the upper part of their sky band; swimmers the mid-water.
function laneFor(loco: Loco, band: Band, slot: 0 | 1): number {
  const h = Math.max(6, band.y1 - band.y0)
  const base = loco === 'ground' ? band.y1 - h * 0.20
             : loco === 'air'    ? band.y0 + h * 0.28
             :                     band.y0 + h * 0.45
  const off = slot === 0 ? -Math.min(7, h * 0.12) : Math.min(9, h * 0.15)
  return Math.max(10, Math.min(82, base + off))
}
// Side sprites are drawn facing RIGHT; a few came out of image-gen facing LEFT (verified per file) —
// flag them so the parade's direction-flip still points them the way they travel.
const BASE_FACES_LEFT = new Set<CountKind>(['shark', 'rabbit'])

// One parading creature: enters from its side moving in its gait, holds mid-scene (still moving in
// place, so it stays alive + tappable), and on tap plays a "counted" pop then walks/flies/swims off
// the far side. Slot 0 travels left→right (faces right); slot 1 travels right→left (faces left), so
// two on stage never sit on top of each other. Travel is a `left` transition on the OUTER button;
// the facing flip and the gait loop live on nested INNER spans, so none of them clobber each other.
const Parader: React.FC<{ obj: CountKind; band: Band; slot: 0 | 1; size: number; leaving: boolean; disabled: boolean; onTap: () => void; onGone: () => void; num?: number; travelSecs?: number }>
  = ({ obj, band, slot, size, leaving, disabled, onTap, onGone, num, travelSecs = 1.15 }) => {
  const loco = locoOf(obj)
  const gait = GAIT[gaitFor(obj)]
  const enterX = slot === 0 ? -16 : 116
  const restX  = slot === 0 ? 36 : 64
  const exitX  = slot === 0 ? 120 : -20
  const lane   = laneFor(loco, band, slot)
  const artDir = BASE_FACES_LEFT.has(obj) ? -1 : 1   // which way the source sprite is drawn facing
  const face   = (slot === 0 ? 1 : -1) * artDir      // display it facing its travel direction
  const [x, setX] = useState(enterX)
  // A drawn walk cycle must run EXACTLY while the body is covering ground, and stop dead while the
  // creature holds mid-scene waiting to be counted — a cycle looping in place is skating on the
  // spot, which is this parade's oldest rule.
  //
  // Ended by the `left` transition's OWN `transitionend`, never by a matching timer: the travel is
  // started from a requestAnimationFrame, and a backgrounded tab freezes rAF while still firing
  // timeouts — so a timer parks the legs of a creature that has not begun walking yet. Reading the
  // transition itself means the two cannot disagree, whatever the tab is doing.
  const [moving, setMoving] = useState(true)
  // Mount off-screen, then next frame glide to the resting spot (the CSS `left` transition = the walk-in).
  useEffect(() => { const r = requestAnimationFrame(() => setX(restX)); return () => cancelAnimationFrame(r) }, [restX])
  // On tap, continue off the far side, then despawn after the exit finishes (scaled to the travel speed).
  useEffect(() => { if (!leaving) return; setMoving(true); setX(exitX); const t = window.setTimeout(onGone, Math.round(travelSecs * 950)); return () => window.clearTimeout(t) }, [leaving, exitX, onGone, travelSecs])
  return (
    <button onClick={onTap} disabled={disabled} aria-label={obj}
      // Only the OUTER `left` transition means "covering ground" — the sprite inside runs its own
      // transform/filter transitions, and those bubble up here too.
      onTransitionEnd={e => { if (e.propertyName === 'left' && e.target === e.currentTarget) setMoving(false) }}
      style={{ ...bare, position: 'fixed', left: `${x}%`, top: `${lane}%`, transform: 'translate(-50%,-50%)', transition: `left ${travelSecs}s linear`, zIndex: 35 + slot }}>
      {/* The count number, floating ABOVE the creature (used by the explanation demo — each one is
          labelled with its number as it's counted). Direct child of the button so the gait/facing
          transforms below don't move or flip it. */}
      {num != null && (
        <span aria-hidden style={{ position: 'absolute', left: '50%', top: 0, transform: 'translate(-50%,-116%)',
          minWidth: 54, height: 54, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--paper)', border: '4px solid var(--milo-orange)', borderRadius: 999,
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 34, color: 'var(--milo-orange)',
          boxShadow: '0 4px 0 rgba(242,107,44,.3)', animation: 'fw_count .4s ease', zIndex: 2, pointerEvents: 'none' }}>{num}</span>
      )}
      {/* Soft contact shadow anchors ground/water creatures to the scene (grounded, not pasted-on).
          Sits below the sprite and travels with it, but does NOT gait-bob, so it reads as ground. */}
      {loco !== 'air' && (
        <span aria-hidden style={{ position: 'absolute', left: '50%', top: `calc(100% - ${Math.round(size * 0.18)}px)`, transform: 'translateX(-50%)',
          width: Math.round(size * 0.58), height: Math.round(size * 0.16), borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(20,14,8,0.32) 0%, rgba(20,14,8,0) 70%)', pointerEvents: 'none' }} />
      )}
      {/* `blend` = soft natural shadow only (no bright white halo), so the creature tucks INTO the
          scene instead of looking cut out. relative → paints above the contact shadow. */}
      <span style={{ position: 'relative', display: 'block', animation: leaving ? 'fw_count .4s ease both' : 'none' }}>
        <span style={{ display: 'block', transform: `scaleX(${face})` }}>
          <span style={{ display: 'block', animation: `${gait.name} ${gait.dur}s ease-in-out infinite` }}>
            <CountItem kind={obj} on={false} size={size} side blend moving={moving} />
          </span>
        </span>
      </span>
    </button>
  )
}

interface Slot { key: number; slot: 0 | 1; leaving: boolean; num?: number }

const ParadeCountPlay: React.FC<{ data: HowManyData; onSubmit: (c: boolean) => void }> = ({ data, onSubmit }) => {
  // The creatures parade through ~2 at a time, moving naturally. The child taps each to count it —
  // it pops, then walks/flies/swims off and the next one comes in. Once all N have been counted, the
  // number choices appear and the child taps how many they counted (kept as the assessment).
  //
  // ONE list rather than two fixed slots, because a counted creature keeps walking off while its
  // REPLACEMENT is already entering the same slot: waiting out the exit first meant the child
  // answered and then sat watching dead time. Within a slot both travel the SAME direction (in one
  // side, out the other), so the outgoing and the incoming never cross. Marking `leaving` in place —
  // rather than moving the entry to another array — keeps React's element identity, so the exit
  // animation runs off the existing element instead of a remount that would re-play the walk-in.
  const [crowd, setCrowd] = useState<Slot[]>([])
  const [counted, setCounted] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const speaking = useIsSpeaking()
  const { w: vw, h: vh } = useViewport()
  const scale = useScale()
  const asked = useRef(false)
  const spawnedRef = useRef(0)
  const keyRef = useRef(0)
  const didInit = useRef(false)

  const size = Math.max(48, Math.min(Math.round(vh * 0.3), Math.round(88 * (SIZE_BOOST[data.obj] ?? 1) * scale)))
  const btn = Math.max(52, Math.min(94, Math.round(Math.min(vw / 8.8, vh / 5.2))))
  const allCounted = counted >= data.n
  const paradeBand = data.band ?? BIOMES.forest.band
  const locked = picked != null || speaking

  // Fill the opening one/two slots (didInit guards React strict-mode double effects).
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    setCrowd(() => {
      const next: Slot[] = []
      for (let s = 0 as 0 | 1; s < 2; s++) {
        if (spawnedRef.current < data.n) { next.push({ key: keyRef.current++, slot: s, leaving: false }); spawnedRef.current++ }
      }
      return next
    })
  }, [data.n])

  // The already-counted guard is a REF, never the `crowd` state this handler also sets: two taps
  // inside one React batch both read the same render's `crowd`, so a state-based guard sees neither
  // as counted yet and lets the same creature through twice. Refs update synchronously.
  const countedKeys = useRef<Set<number>>(new Set())
  function tap(key: number, slot: 0 | 1) {
    if (locked || countedKeys.current.has(key)) return
    countedKeys.current.add(key)
    // Send the next one in the MOMENT this is tapped, not once it has finished walking off —
    // otherwise the child answers and then sits watching dead time. Claimed here rather than inside
    // the updater below, so the updater stays a pure function of the previous state.
    let replacement: Slot | null = null
    if (spawnedRef.current < data.n) { replacement = { key: keyRef.current++, slot, leaving: false }; spawnedRef.current++ }
    setCrowd(prev => {
      const next = prev.map(c => (c.key === key ? { ...c, leaving: true } : c))
      if (replacement) next.push(replacement)
      return next
    })
    setCounted(c => Math.min(data.n, c + 1))
  }
  const gone = (key: number) => setCrowd(prev => prev.filter(c => c.key !== key))
  function choose(v: number) { if (locked) return; setPicked(v); window.setTimeout(() => onSubmit(v === data.n), 450) }
  useEffect(() => {
    if (allCounted && !asked.current) { asked.current = true; speakAfterCurrent('So how many did you count? Tap the number!') }
  }, [allCounted])

  return (
    <>
      {/* Real <button>s, so the keyboard and screen-reader path is the same affordance as the tap. */}
      {crowd.map(c => (
        <Parader key={c.key} obj={data.obj} band={paradeBand} slot={c.slot} size={size} leaving={c.leaving}
          travelSecs={1.8} disabled={locked || c.leaving} onTap={() => tap(c.key, c.slot)} onGone={() => gone(c.key)} />
      ))}

      {/* Bottom stack: the answer choices sit ABOVE the collected-objects tray. Both live in one
          column so they can never overlap each other, and neither can sit on top of the parade —
          which is what went wrong when the tray was pinned at top-centre. */}
      <div style={{ position: 'fixed', bottom: Math.max(8, Math.round(btn * 0.18)), left: '50%', transform: 'translateX(-50%)', zIndex: 41,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(btn * 0.16), pointerEvents: 'none' }}>
        {allCounted && (
          <div style={{ display: 'flex', gap: Math.round(btn * 0.2), animation: 'fw_pop .35s ease both', pointerEvents: 'auto' }}>
            {data.choices.map(v => {
              const isPick = picked === v, ok = isPick && v === data.n
              return (
                <button key={v} onClick={() => choose(v)} disabled={picked != null || speaking} style={{
                  width: btn, height: btn, borderRadius: Math.round(btn * 0.23), fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.round(btn * 0.48), cursor: picked != null ? 'default' : 'pointer',
                  color: ok ? '#fff' : 'var(--milo-orange)', background: ok ? 'var(--garden-green)' : 'var(--paper)',
                  border: `${Math.max(3, Math.round(btn * 0.05))}px solid ${ok ? 'var(--garden-green-deep)' : 'var(--milo-orange)'}`, boxShadow: '0 6px 0 rgba(242,107,44,.3)',
                  transform: isPick ? 'translateY(-4px)' : 'none', transition: 'all .15s' }}>{v}</button>
              )
            })}
          </div>
        )}
        {/* Each tapped creature gathers here (they don't just vanish), so the child sees the count grow. */}
        <CollectTray obj={data.obj} n={counted} maxCell={Math.max(40, Math.round(size * 0.42))} vw={vw} />
      </div>
    </>
  )
}
// Re-explanation: Milo counts these objects out, 1…n, flying in the scene.
const FlyingReteach: React.FC<{ data: HowManyData; onDone: () => void }> = ({ data, onDone }) =>
  <FlyingCountDemo to={data.n} obj={data.obj} band={data.band} onDone={onDone} />

// Quantity for a round, by adaptive difficulty: easy 1–4, medium 3–7, hard 5–10.
function quantityFor(d: 1 | 2 | 3): number {
  return d === 1 ? rint(1, 4) : d === 2 ? rint(3, 7) : rint(5, 10)
}
// Big creatures look better (and stay tappable) in small numbers — cap how many ever
// appear at once. Eagles perch on the trees, so only a few; sharks are large too.
const MAX_N: Partial<Record<CountKind, number>> = {
  eagle: 4, shark: 5,
  // The new (now-bigger) creatures sit in tighter bands — cap them so a high count
  // doesn't crowd/overlap. Smaller/airborne ones (chick, star, comet…) stay uncapped.
  lamb: 6, astronaut: 6, alien: 7, duck: 7, frog: 7, rocket: 7, satellite: 7, planet: 7,
}
// Per-creature spawn band overrides so each animal appears where it naturally lives.
// Y0 = top of window, Y1 = bottom (viewport %). X0 clears Milo on the left.
function bandFor(biome: Biome, obj: CountKind): Band {
  const b = biome.band
  switch (obj) {
    // FOREST
    case 'butterfly': return { ...b, y0: 8,  y1: 50 }   // flutter high in the canopy
    case 'firefly':   return { ...b, x0: 13, x1: 72, y0: 28, y1: 66 }   // hover near mid-forest / undergrowth
    case 'rabbit':    return { ...b, x0: 18, x1: 82, y0: 60, y1: 82 }   // hop along the forest floor
    case 'eagle':     return { ...b, x0: 16, x1: 78, y0: 10, y1: 40 }   // perched up in the treetops (few of them)
    // UNDERWATER
    case 'fish':      return { ...b, x0: 12, x1: 72, y0: 14, y1: 62 }   // swim freely through the water column
    case 'turtle':    return { ...b, x0: 12, x1: 80, y0: 42, y1: 76 }   // spread across the mid-lower water
    case 'shark':     return { ...b, x0: 12, x1: 72, y0: 18, y1: 60 }   // cruise the open water column
    case 'crab':      return { ...b, x0: 12, x1: 82, y0: 62, y1: 84 }   // scatter across the seabed
    // GARDEN — on the open grass, away from the edge flower beds / bushes
    case 'squirrel':  return { ...b, x0: 16, x1: 50, y0: 50, y1: 74 }   // by the cart/rock on the left
    case 'ant':       return { ...b, x0: 30, x1: 74, y0: 58, y1: 80 }   // march on the open green grass
    case 'ladybug':   return { ...b, x0: 24, x1: 80, y0: 54, y1: 80 }   // dot the grass / low flowers
    // FARM — barnyard animals stand ON THE GRASS (low, tight band → a grounded flock,
    // never floating); orchard fruit hangs in the trees (elevated is correct); pond life
    // by/on the water; only the dragonfly truly flies.
    case 'chick':     return { ...b, y0: 52, y1: 88 }   // spread across the open grass field
    case 'lamb':      return { ...b, y0: 50, y1: 86 }   // graze across the field (taller, four legs)
    case 'duckling':  return { ...b, y0: 52, y1: 88 }   // waddle across the grass
    case 'apple':     return { ...b, y0: 18, y1: 52 }   // hang up in the orchard trees
    case 'pear':      return { ...b, y0: 20, y1: 56 }   // hang in the trees
    case 'frog':      return { ...b, y0: 64, y1: 82 }   // on lily pads at the pond edge
    case 'duck':      return { ...b, y0: 56, y1: 74 }   // float ON the water surface
    case 'dragonfly': return { ...b, y0: 26, y1: 56 }   // dart above the water (a true flyer)
    // SPACE — stars/comets/planets/satellites float high; rockets rise; the moon-surface
    // trio (astronaut/rock/alien) stands ON the moon ground.
    case 'rocket':    return { ...b, y0: 24, y1: 70 }   // rising off the launchpad
    case 'star':      return { ...b, y0: 12, y1: 48 }   // high in the sky
    case 'cloud':     return { ...b, y0: 28, y1: 58 }   // drift across the mid sky
    case 'planet':    return { ...b, y0: 14, y1: 66 }   // float across deep space
    case 'comet':     return { ...b, y0: 14, y1: 52 }   // streak high across space
    case 'satellite': return { ...b, y0: 18, y1: 60 }   // orbit through space
    case 'astronaut': return { ...b, y0: 63, y1: 84 }   // stand on the moon's surface
    case 'moonRock':  return { ...b, y0: 67, y1: 85 }   // sit on the moon ground
    case 'alien':     return { ...b, y0: 63, y1: 84 }   // stand on the surface
    default:          return b
  }
}
function howManyData(biome: Biome, obj: CountKind, d: 1 | 2 | 3): HowManyData {
  const n = Math.min(quantityFor(d), MAX_N[obj] ?? 10)
  const set = new Set<number>([n])
  while (set.size < 3) { const c = Math.min(10, Math.max(1, n + rint(-2, 2))); if (c !== n) set.add(c) }
  return { n, obj, band: bandFor(biome, obj), choices: shuffle([...set]), biomeId: biome.id }
}

// THE scored practice — ONE continuous 10-round adaptive sequence. The pedagogy is
// unbroken across all 10 rounds:
//   • difficulty ramps UP on a correct streak and DOWN when struggling (adaptive),
//   • a walk interlude plays every 3 rounds so Milo stays animated,
//   • after 3 wrong IN A ROW Milo re-explains by counting that exact quantity out.
// Background cross-fades smoothly via BiomeBackground's 1s opacity transition.
/**
 * Dev-only `?obj=<creature>` override for the practice rounds — stripped from production builds.
 * Exists so a specific creature's animation can be looked at on demand instead of replaying the
 * chapter until the shuffled plan happens to serve it up.
 */
function devForcedObj(): CountKind | null {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search).get('obj')
  return q && q in COUNT_PLURAL ? (q as CountKind) : null
}

type PlanCell = { biome: Biome; obj: CountKind }
// Every creature in the storytelling's biomes EXCEPT the two used by the opening demo +
// guided slide — kept OUT of the practice so a single session NEVER repeats a creature.
// Every other biome creature appears exactly once.
function practicePool(story: Storytelling): PlanCell[] {
  const demo = new Set<CountKind>([story.demoCount, story.demoGuide])
  const pool: PlanCell[] = []
  for (const id of story.biomes) {
    for (const obj of BIOMES[id].objects) {
      if (!demo.has(obj)) pool.push({ biome: BIOMES[id], obj })
    }
  }
  return pool
}
// Build the plan: every pool creature used ONCE, shuffled, then nudged so the same
// biome never runs two rounds in a row.
function buildPlan(story: Storytelling): PlanCell[] {
  const pool = shuffle(practicePool(story))
  for (let i = 1; i < pool.length; i++) {
    if (pool[i].biome.id === pool[i - 1].biome.id) {
      const j = pool.findIndex((c, k) => k > i && c.biome.id !== pool[i - 1].biome.id)
      if (j > -1) { const t = pool[i]; pool[i] = pool[j]; pool[j] = t }
    }
  }
  return pool
}
// THE scored practice for a storytelling — ONE continuous adaptive sequence, one round
// per pool creature (so a correctly-answered question never comes back). The pedagogy is
// unbroken across all rounds: difficulty ramps UP on a correct streak and DOWN when
// struggling; a walk interlude plays every 3 rounds; after 3 wrong IN A ROW Milo
// re-explains by counting that exact quantity out. The biome cross-fades per round.
export function makePracticeCountBeat(story: Storytelling): Beat<HowManyData> {
  const fallbackBiome = BIOMES[story.biomes[0]]
  const fallbackObj = practicePool(story)[0]?.obj ?? fallbackBiome.objects[0]
  let plan: PlanCell[] = []
  return {
    skillId: 'counting', rounds: practicePool(story).length,
    walkEvery: 3,
    make: (d, round = 0) => {
      if (round === 0) plan = buildPlan(story)
      const cell = plan[round] ?? plan[plan.length - 1] ?? { biome: fallbackBiome, obj: fallbackObj }
      // Dev-only: `?obj=rabbit` pins every round to one creature. The plan is shuffled, so without
      // this you replay the chapter until the one you want to look at happens to come up.
      const forced = devForcedObj()
      return howManyData(cell.biome, forced ?? cell.obj, d)
    },
    prompt: d => `Count the ${COUNT_PLURAL[d.obj]}!`,
    say: d => `Here come the ${COUNT_PLURAL[d.obj]}! Tap each one to count it.`,
    Play: ParadeCountPlay, Reteach: FlyingReteach,
  }
}

