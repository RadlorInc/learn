'use client'
/**
 * Chapter 11 — MEASUREMENT (skill `measurement`). The verb is **MEASURE IT**.
 *
 * The child lays a repeating unit — one of Milo's blocks — end to end against the thing, and
 * decides when the run has reached the end of it. A ruler is nothing but repeated units, counted;
 * this chapter is that idea before the ruler exists.
 *
 *   🌳 Tall Forest  — blocks stack UP beside the thing   (tulip · daisy · sunflower · tree · giraffe · pine)
 *   🐛 Long Trail   — blocks lay ALONG under the thing   (fish · engine · caterpillar · train car · bus · snake)
 *
 * WHY IT IS NOT "TAP THE BIGGER ONE" (the chapter this replaces was exactly that, and so is
 * chapter 5 — one surface with a different adjective on it, the fault §0a of docs/chapter-craft.md
 * names). Three things follow from making the laying the answer:
 *   • The eyeball shortcut is gone by construction. You cannot guess "6 blocks".
 *   • It is playable with the sound OFF — the question is a picture, which matters because the
 *     whole 3–11 band still has no recorded voice.
 *   • The answer is one the child MADE. Deciding when to stop is the entire skill, exactly as in
 *     chapter 4, so there are always more blocks in the pile than the thing needs and nothing on
 *     screen says "that's enough" until they commit.
 *
 * A thing's unit count is its identity: a tulip IS 3 blocks, a pine IS 6. So the thing is drawn at
 * exactly `units × unitPx` on the measured axis and the run beside it agrees BY CONSTRUCTION —
 * the same trick as Shape House's socket being the same path as its piece. Difficulty picks which
 * thing to measure (small counts first), never a hidden scale factor.
 *
 * ⚠️ WEIGHT IS DELIBERATELY NOT A WORLD HERE. The obvious build — pile counters into the empty pan
 * until the beam levels — is hot/cold: the beam levels exactly when the count is right, so it hands
 * the answer over before the child commits (the same fault as chapter 4's green Ready button, and
 * as the tipping seesaw this file used to be). An honest version needs the beam LOCKED until Done,
 * which needs a latch that reads as intentional rather than broken. Deferred, not forgotten.
 *
 * BLEND: every sprite is drawn from its own alpha box (SQUARE-PADDED PNGs would otherwise make the
 * measurement lie — a tulip's ink fills only 87% of its file), uniformly scaled, never stretched,
 * and stands on a ground line with a contact shadow. Blocks are the greyscale `pat_block` tinted
 * per world. Wrapped by the registry row `measurement`.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, speakPaced, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import WorldSelect from './WorldSelect'
import { TintedSprite } from './TintedSprite'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { SceneBg } from '@/shared/ui/SceneBg'
import { useOnceGuard } from '@/shared/hooks/useOnceGuard'
import { useChapterPhase } from '@/shared/hooks/useChapterPhase'
import { DirectionsInline } from '@/features/chapters/directions'

// A viewport shorter than this is a landscape phone (812×375, 667×375).
export const SHORT_H = 470
/**
 * The top strip the prompt pill owns, and where the pill sits inside it — both measured on screen
 * (at 640×320 the pill runs 50→98), not guessed.
 *
 * On a short screen the pill is RAISED and the strip shrinks with it. Left at the roomy 112 it eats
 * 35% of a 320px-tall phone, and since the unit size is `band ÷ 6.6`, that is 35% off the size of
 * the blocks a three-year-old has to count — 22px each. Raised, they are 27px. The pill is centred
 * and the ← Menu button is left-aligned, so at 640 wide they clear each other by ~60px even on the
 * longest prompt in the chapter.
 */
export const PROMPT_BAND = 112
export const PROMPT_BAND_SHORT = 76
export const pillTop = (short: boolean) => (short ? 14 : 50)
// The bottom bar holding the pile / undo / done controls — measured on screen at 640×320 (the row
// runs 267→311 in a 320px frame, so 53px of bar plus a margin), not guessed. Every pixel here is a
// pixel off the unit size, and at 320px tall the unit is already only ~22px.
export const BOTTOM_BAND = 64
// The most blocks any one thing takes. Every unit size is derived from this, so the longest run
// always fits between the prompt and the controls.
export const MAX_UNITS = 6
// A single physical tap must not lay two blocks. Short enough that deliberate fast tapping works.
const TAP_LOCK_MS = 160

// ─── Things you can measure ─────────────────────────────────────────────────────────
/** A sprite plus the box its ink actually occupies inside the file, as 0–1 of the file. */
export interface Cut { img: string; wh: [number, number]; bb: [number, number, number, number] }
/** Subject width ÷ subject height, from the alpha box — the true drawn proportion. */
export const aspectOf = (c: Cut) => ((c.bb[2] - c.bb[0]) * c.wh[0]) / ((c.bb[3] - c.bb[1]) * c.wh[1])

export interface Thing extends Cut { id: string; noun: string; units: number; bg: string }

export const FOREST: Thing[] = [
  { id: 'tulip',     noun: 'tulip',       units: 3, img: '/assets/objects/flower_tulip.png',     wh: [512, 512], bb: [.205, .059, .795, .932], bg: '/assets/backgrounds/garden_meadow.png' },
  { id: 'daisy',     noun: 'daisy',       units: 3, img: '/assets/objects/flower_daisy.png',     wh: [512, 512], bb: [.156, .092, .842, .920], bg: '/assets/backgrounds/garden_park.png' },
  { id: 'sunflower', noun: 'sunflower',   units: 4, img: '/assets/objects/flower_sunflower.png', wh: [512, 512], bb: [.102, .066, .898, .934], bg: '/assets/backgrounds/town_garden.jpeg' },
  { id: 'tree',      noun: 'apple tree',  units: 4, img: '/assets/objects/tree.png',             wh: [512, 341], bb: [.205, .044, .803, .947], bg: '/assets/backgrounds/farm_orchard.png' },
  { id: 'giraffe',   noun: 'giraffe',     units: 5, img: '/assets/objects/giraffe.png',          wh: [512, 512], bb: [.174, .025, .826, .975], bg: '/assets/backgrounds/farm_barnyard.png' },
  { id: 'pine',      noun: 'pine tree',   units: 6, img: '/assets/objects/tree_3.png',           wh: [512, 512], bb: [.254, .072, .746, .947], bg: '/assets/backgrounds/forest_3.jpeg' },
]
export const TRAIL: Thing[] = [
  { id: 'fish',     noun: 'fish',         units: 3, img: '/assets/objects/fish.png',         wh: [512, 286], bb: [.252, .150, .752, .853], bg: '/assets/backgrounds/lake.jpeg' },
  { id: 'engine',   noun: 'train engine', units: 3, img: '/assets/objects/train_engine.png', wh: [512, 286], bb: [.205, .028, .812, .895], bg: '/assets/backgrounds/train_station.png' },
  { id: 'catty',    noun: 'caterpillar',  units: 4, img: '/assets/objects/caterpillar.png',  wh: [512, 286], bb: [.117, .115, .885, .902], bg: '/assets/backgrounds/forest_2.jpeg' },
  { id: 'carriage', noun: 'train car',    units: 4, img: '/assets/objects/train_car.png',    wh: [512, 286], bb: [.131, .182, .879, .951], bg: '/assets/backgrounds/train_bg.jpeg' },
  { id: 'bus',      noun: 'bus',          units: 5, img: '/assets/objects/bus.png',          wh: [512, 512], bb: [.082, .293, .926, .787], bg: '/assets/backgrounds/town_street.jpeg' },
  { id: 'snake',    noun: 'snake',        units: 6, img: '/assets/objects/snake.png',        wh: [512, 160], bb: [0, 0, 1, 1],             bg: '/assets/backgrounds/garden_meadow.png' },
]

const BLOCK: Cut = { img: '/assets/objects/pat_block.png', wh: [512, 512], bb: [.066, .059, .936, .947] }

export type Axis = 'up' | 'along'
export interface MWorld {
  id: string; label: string; emoji: string; axis: Axis
  things: Thing[]
  tint: string                       // the blocks' colour — chosen to sit apart from the scene
  word: string                       // "tall" / "long"
  milo: { src: string; emoji: string; accessory: string }
  intro: string
}
export const WORLDS: MWorld[] = [
  { id: 'forest', label: 'Tall Forest', emoji: '🌳', axis: 'up', things: FOREST, tint: '#e2643c', word: 'tall',
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '📏' },
    intro: "Milo measures things with his blocks! Stack them up beside it until you reach the very top — then count how many. Watch Milo first!" },
  { id: 'trail', label: 'Long Trail', emoji: '🐛', axis: 'along', things: TRAIL, tint: '#3f8fd8', word: 'long',
    milo: { src: '/assets/characters/milo_explorer.png', emoji: '🦊', accessory: '📐' },
    intro: "Milo measures things with his blocks! Lay them along it until you reach the very end — then count how many. Watch Milo first!" },
]
const worldById = (id: string) => WORLDS.find(w => w.id === id)
const PICK_WORLDS = WORLDS.map(w => ({ id: w.id, label: w.label, emoji: w.emoji, bgImage: w.things[0].bg }))

// ─── Layout ─────────────────────────────────────────────────────────────────────────
/**
 * The unit size, derived rather than tuned. The longest run is MAX_UNITS blocks and the thing
 * beside it is exactly as long, so both fit the band left between the prompt pill and the controls
 * by construction. Exported so the geometry sweep checks the same numbers the scene draws from,
 * instead of agreeing with a second copy of them.
 */
export function measureLayout(axis: Axis, vw: number, vh: number) {
  const short = vh < SHORT_H
  const band = short ? PROMPT_BAND_SHORT : PROMPT_BAND
  const avail = Math.max(90, vh - band - BOTTOM_BAND)
  // 'up': the run stands MAX_UNITS tall, plus headroom for the thing's own shadow.
  // 'along': the run lies flat under the thing — the deepest thing here is ~2.9 units — so the pair
  // needs ~4.6 units of height, and its WIDTH is what the screen has plenty of.
  const raw = axis === 'up'
    ? Math.min(avail / 6.6, 72)
    : Math.min(avail / 4.6, (vw * 0.62) / MAX_UNITS, 76)
  return { short, unit: Math.max(12, raw), avail, band }
}

// ─── A sprite drawn from its own ink box ────────────────────────────────────────────
/**
 * Renders `c` so its INK measures exactly `size` on the given axis. The PNGs are square-padded, so
 * drawing them by their file box would leave a tulip's tip well below the top of its frame and the
 * whole measurement would quietly be wrong.
 */
function Cutout({ c, size, on, tint }: { c: Cut; size: number; on: 'h' | 'w'; tint?: string }) {
  const [x0, y0, x1, y1] = c.bb
  const fw = x1 - x0, fh = y1 - y0
  const ar = c.wh[0] / c.wh[1]
  const imgH = on === 'h' ? size / fh : size / fw / ar     // the full image box that lands the ink at `size`
  const imgW = imgH * ar
  const boxH = on === 'h' ? size : size / aspectOf(c)
  const boxW = on === 'h' ? size * aspectOf(c) : size
  return (
    <div style={{ position: 'relative', width: boxW, height: boxH }}>
      <div style={{ position: 'absolute', left: -x0 * imgW, bottom: -(1 - y1) * imgH, width: imgW, height: imgH }}>
        {tint
          ? <TintedSprite src={c.img} size="100%" hex={tint} />
          : <img src={c.img} alt="" draggable={false} decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 3px 5px rgba(30,42,60,.26))' }} />}
      </div>
    </div>
  )
}

/**
 * OUT OF FLOW, deliberately. In flow it added its own height to the thing's column, and the run of
 * blocks — bottom-aligned against that column — stood 28px lower than the thing it was measuring.
 * A measure whose two ends do not share a ground line measures nothing.
 */
const Shadow = ({ w }: { w: number }) => (
  <div aria-hidden style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
    width: w, height: Math.max(5, w * 0.16), pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, rgba(30,42,60,.26) 0%, rgba(30,42,60,0) 72%)' }} />
)

// ─── The measuring stage ────────────────────────────────────────────────────────────
interface Laid { key: number; leaving?: boolean }

function Stage({ world, thing, laid, glow, unit, band }: {
  world: MWorld; thing: Thing; laid: Laid[]; glow: boolean; unit: number; band: number
}) {
  const up = world.axis === 'up'
  const size = thing.units * unit
  const block = (l: Laid, i: number) => (
    <div key={l.key} data-mi="block" style={{ width: unit, height: unit, display: 'grid', placeItems: 'center' }}>
      {/* The animation lives on an INNER element: a fill:both keyframe ending on translate(0) would
          otherwise clobber any positioning transform on the block itself. */}
      <div style={{ animation: `${l.leaving ? 'mi_out' : 'mi_in'} .26s cubic-bezier(.34,.9,.35,1) both`,
        animationDelay: l.leaving ? '0ms' : `${Math.min(i, 2) * 20}ms` }}>
        <Cutout c={BLOCK} size={unit} on={up ? 'h' : 'w'} tint={world.tint} />
      </div>
    </div>
  )
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: band, bottom: BOTTOM_BAND, zIndex: 30,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 3vw 4px' }}>
      <div style={{ display: 'flex', flexDirection: up ? 'row' : 'column', alignItems: up ? 'flex-end' : 'flex-start', gap: unit * 0.4 }}>
        <div data-mi="thing" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: up ? 'center' : 'flex-start' }}>
          <Cutout c={thing} size={size} on={up ? 'h' : 'w'} />
          <Shadow w={up ? size * aspectOf(thing) : size} />
        </div>
        {/* The lane the run grows into is RESERVED at full block width/height from the start. Left
            to size itself, it is zero until the first block lands and the thing being measured
            jumps a whole unit sideways or upward at that moment — and the thing is what the child
            is reading. Empty and invisible, so it gives nothing away. */}
        <div data-mi="run" style={{ display: 'flex', flexDirection: up ? 'column-reverse' : 'row', alignItems: up ? 'center' : 'flex-end',
          width: up ? unit : undefined, height: up ? undefined : unit,
          filter: glow ? 'drop-shadow(0 0 14px var(--sun-yellow))' : 'none', transition: 'filter .3s ease' }}>
          {laid.map(block)}
        </div>
      </div>
    </div>
  )
}

// ─── Controls ───────────────────────────────────────────────────────────────────────
/**
 * The pile is one big target rather than the blocks themselves — on a landscape phone a block is
 * ~21px and asking a three-year-old to hit the top one is a fine-motor test, not a measuring one.
 *
 * Nothing here changes with the count. A control that lit up at the right number would replace the
 * chapter with a hot/cold game, which is exactly what happened to chapter 4's Ready button.
 */
function Controls({ world, count, onAdd, onUndo, onDone, live }: {
  world: MWorld; count: number; onAdd: () => void; onUndo: () => void; onDone: () => void; live: boolean
}) {
  const btn = (bg: string): React.CSSProperties => ({
    border: 'none', borderRadius: 999, cursor: live ? 'pointer' : 'default',
    fontFamily: 'var(--font-display)', fontWeight: 900, color: '#fff', background: bg,
    padding: '11px 20px', fontSize: 17, boxShadow: '0 4px 12px rgba(0,0,0,.22)',
  })
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 9, zIndex: 46,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '0 10px' }}>
      <button onClick={live ? onAdd : undefined} disabled={!live} aria-label="Add block"
        style={{ ...btn(world.tint), display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', opacity: live ? 1 : .5 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 26, height: 26 }}>
          <Cutout c={BLOCK} size={24} on="h" tint="#ffffff" />
        </span>
        Add block
      </button>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--outline)', borderRadius: 999, padding: '7px 16px',
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, color: 'var(--ink)', minWidth: 50, textAlign: 'center' }}>{count}</div>
      <button onClick={live && count > 0 ? onUndo : undefined} disabled={!live || count === 0} aria-label="Remove block"
        style={{ ...btn('#8a94a3'), opacity: live && count > 0 ? 1 : .4, padding: '11px 15px', fontSize: 15 }}>↩ Remove block</button>
      <button onClick={live ? onDone : undefined} disabled={!live} aria-label="Done"
        style={{ ...btn('linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))'), opacity: live ? 1 : .5 }}>Done ✓</button>
    </div>
  )
}

// ─── Play (guided + practice) ───────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const MeasurePlay: React.FC<{
  world: MWorld; thing: Thing; mode: Mode; onRecord?: (t: Thing) => void; onComplete: (correct: boolean) => void
}> = ({ world, thing, mode, onRecord, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const { unit, band } = measureLayout(world.axis, vw, vh)
  const [laid, setLaid] = useState<Laid[]>([])
  const [glow, setGlow] = useState(false)
  const [live, setLive] = useState(true)
  const keyRef = useRef(0), lockRef = useRef(0), doneRef = useRef(false)
  const timers = useRef<number[]>([])
  const after = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }, [])
  useEffect(() => () => { timers.current.forEach(t => window.clearTimeout(t)) }, [])

  useEffect(() => {
    if (mode === 'guided') speak(`Your turn! Lay the blocks until you reach the end of the ${thing.noun}.`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const add = useCallback(() => {
    const now = Date.now()
    if (!live || now - lockRef.current < TAP_LOCK_MS) return
    lockRef.current = now
    setLaid(l => { speak(String(l.length + 1)); return [...l, { key: keyRef.current++ }] })
  }, [live])

  const undo = useCallback(() => {
    if (!live) return
    setLaid(l => {
      if (!l.length) return l
      speak(String(l.length - 1))
      after(240, () => setLaid(cur => cur.filter(x => !x.leaving)))
      return l.map((x, i) => (i === l.length - 1 ? { ...x, leaving: true } : x))
    })
  }, [live, after])

  const done = useCallback(() => {
    if (doneRef.current || !live) return
    doneRef.current = true; setLive(false)
    const n = laid.filter(l => !l.leaving).length
    if (n === thing.units) {
      setGlow(true)
      speak(`${n} blocks! The ${thing.noun} is ${n} blocks ${world.word}.`)
      onRecord?.(thing)
      after(1500, () => onComplete(true))
      return
    }
    // Wrong: SHOW the true measure rather than only saying it — lay or lift blocks one at a time up
    // to the real count, so the child watches the run reach the end of the thing.
    const steps = Math.abs(n - thing.units)
    for (let i = 0; i < steps; i++) {
      after(700 + i * 380, () => setLaid(l => (l.length < thing.units ? [...l, { key: keyRef.current++ }] : l.slice(0, -1))))
    }
    const end = 700 + steps * 380
    // Two lines, one narration: "Watch…" runs ~2.6s and the measure used to land on top of it at
    // `end + 260`. The blocks still move on their own timers above; only the words wait.
    speakPaced([
      n > thing.units ? 'Oops — that went past the end. Watch…' : 'Not quite there yet. Watch…',
      `${thing.units}. The ${thing.noun} is ${thing.units} blocks ${world.word}.`,
    ], {
      onStep: (i) => { if (i === 1) setGlow(true) },
      minMs: (_l, i) => (i === 0 ? end + 260 : 1800),
      onDone: () => onComplete(false),
    })
  }, [laid, live, thing, world.word, onComplete, onRecord, after])

  return (<>
    <Stage world={world} thing={thing} laid={laid} glow={glow} unit={unit} band={band} />
    <Controls world={world} count={laid.filter(l => !l.leaving).length} onAdd={add} onUndo={undo} onDone={done} live={live} />
  </>)
}

// ─── Milo does it (opening demo + the 3-wrong re-teach) ─────────────────────────────
const MeasureExplain: React.FC<{ world: MWorld; thing: Thing; onDone: () => void }> = ({ world, thing, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const { unit, band } = measureLayout(world.axis, vw, vh)
  const [laid, setLaid] = useState<Laid[]>([])
  const [glow, setGlow] = useState(false)
  const ran = useOnceGuard(), keyRef = useRef(0)

  useEffect(() => {
    if (ran.current) return; ran.current = true
    const end = world.axis === 'up' ? 'the very top' : 'the very end'
    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))

    /**
     * SELF-PACED on a deterministic timer, NOT on speech events. The counting steps are single
     * words, and tying single words to `end`/`error` events races the whole demo past in a couple
     * of seconds on any device without a usable voice — measured here doing exactly that, both
     * demos and the guided round arriving inside four seconds. The same rule the colour and shape
     * showcases already run on.
     */
    const LAY = 1000
    const lines = [
      `How ${world.word} is the ${thing.noun}? Let's lay Milo's blocks!`,
      ...Array.from({ length: thing.units }, (_, i) => String(i + 1)),
      `We reached ${end}! So the ${thing.noun} is ${thing.units} blocks ${world.word}.`,
    ]
    // ⚠️ The opening line ran ~3.5s with a real clip and the first count landed at 2200ms, so Milo
    // was cut off mid-sentence on the very first thing this chapter says. `speakPaced` keeps the
    // deterministic pacing the note above is about (a block a second, timer-driven, never hanging
    // on a speech event) and simply will not START the next step while he is still talking.
    const cancel = speakPaced(lines, {
      onStep: (i) => {
        if (i === 0) return
        if (i <= thing.units) { setLaid(l => [...l, { key: keyRef.current++ }]); return }
        setGlow(true)
      },
      minMs: (_l, i) => (i === 0 ? 2200 : i <= thing.units ? LAY : 300),
      onDone,
      tailMs: 1200,
    })
    return () => { cancel(); timers.forEach(t => window.clearTimeout(t)); stopSpeech() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Stage world={world} thing={thing} laid={laid} glow={glow} unit={unit} band={band} />
}

// ─── The notebook — what has been measured so far ───────────────────────────────────
/**
 * The cumulative arc, and it lives OUTSIDE SkillBeat because SkillBeat rebuilds its contents every
 * round (chapter 3 shipped without one and its tree never visibly filled).
 */
function Notebook({ rows, tint }: { rows: Thing[]; tint: string }) {
  if (!rows.length) return null
  return (
    <div style={{ position: 'fixed', right: 10, bottom: BOTTOM_BAND + 6, zIndex: 44, display: 'flex', flexDirection: 'column-reverse', gap: 4, pointerEvents: 'none' }}>
      {rows.slice(-5).map((t, i) => (
        <div key={`${t.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,252,244,.92)',
          border: '2px solid rgba(61,37,22,.18)', borderRadius: 999, padding: '2px 10px 2px 4px' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 24, height: 24 }}>
            <Cutout c={t} size={20} on="h" />
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15, color: tint }}>{t.units}</span>
        </div>
      ))}
    </div>
  )
}

function MiloHost({ milo }: { milo: MWorld['milo'] }) {
  const [step, setStep] = useState(0)
  const srcs = [milo.src, '/assets/characters/milo_idle.png']
  return (
    <div style={{ position: 'fixed', left: '7%', bottom: BOTTOM_BAND - 8, transform: 'translateX(-50%)', zIndex: 26,
      width: 'min(22vh, 190px)', height: 'min(22vh, 190px)', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', animation: 'mi_float 3.4s ease-in-out infinite' }}>
        {step >= srcs.length
          ? <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: 72, filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }}>{milo.emoji}</span>
              <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 32 }}>{milo.accessory}</span>
            </div>
          : <img src={srcs[step]} alt="Milo" draggable={false} decoding="async" loading="lazy" onError={() => setStep(s => s + 1)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 5px 8px rgba(30,42,60,.3))' }} />}
      </div>
    </div>
  )
}

function Background({ thing, things }: { thing: Thing; things: Thing[] }) {
  const srcs = Array.from(new Set(things.map(t => t.bg)))
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#dfe8d8' }}>
      {srcs.map(src => (
        <SceneBg key={src} src={src} priority={src === thing.bg}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          style={{ opacity: src === thing.bg ? 1 : 0, transition: 'opacity .6s ease' }} />
      ))}
    </div>
  )
}

// ─── Beat ───────────────────────────────────────────────────────────────────────────
/** Small counts first. A thing's size is fixed, so the tier chooses WHICH thing, never a scale. */
export function poolFor(world: MWorld, d: 1 | 2 | 3): Thing[] {
  const [lo, hi] = d === 1 ? [0, 4] : d === 2 ? [4, 5] : [5, 6]
  const p = world.things.filter(t => t.units >= lo && t.units <= hi)
  return p.length ? p : world.things
}

export function makeMeasureBeat(world: MWorld, onRecord: (t: Thing) => void): Beat<Thing> {
  return {
    skillId: 'measurement', rounds: 10, walkEvery: 3,
    make: (d, round = 0) => { const p = poolFor(world, (d || 1) as 1 | 2 | 3); return p[round % p.length] },
    // Measuring the same thing twice is not a repeated QUESTION — the child lays every block again —
    // so this only spreads the pool out; it is not load-bearing the way a tap-the-answer sig is.
    sig: t => t.id,
    prompt: t => `How ${world.word} is the ${t.noun}?`,
    say: t => `How ${world.word} is the ${t.noun}? Lay the blocks!`,
    Play: ({ data, onSubmit }) => <MeasurePlay world={world} thing={data} mode="practice" onRecord={onRecord} onComplete={onSubmit} />,
    Reteach: ({ data, onDone }) => <MeasureExplain world={world} thing={data} onDone={onDone} />,
  }
}

// ─── Orchestrator ───────────────────────────────────────────────────────────────────
const MI_CSS = `
@keyframes mi_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes mi_in  { 0%{transform:translate(46px,38px) scale(.5);opacity:0} 100%{transform:translate(0,0) scale(1);opacity:1} }
@keyframes mi_out { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(46px,38px) scale(.5);opacity:0} }
`
type Phase = 'intro' | 'demo' | 'guided' | 'practice'

export default function MeasureIt({ world: forcedWorldId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const needsRotate = useNeedsRotate()
  const { h: vh } = useViewport()
  const short = vh < SHORT_H
  const [world, setWorld] = useState<MWorld | null>(() => (forcedWorldId ? worldById(forcedWorldId) ?? null : null))
  const [phase, setPhase] = useChapterPhase<Phase>('intro', { chapter: 'measurement', phase: 'practice' })
  const [thing, setThing] = useState<Thing>(FOREST[0])
  const [demoIdx, setDemoIdx] = useState(0)
  const [book, setBook] = useState<Thing[]>([])
  const { exit, tally } = useChapterShell(onFinish, onExit)
  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])

  // The beat is memoized on the world alone, so recording a notebook row cannot regenerate the
  // round under the child mid-answer. The recorder is reached through a ref for the same reason.
  const recordRef = useRef((t: Thing) => setBook(b => [...b, t]))
  const beat = useMemo(() => (world ? makeMeasureBeat(world, t => recordRef.current(t)) : null), [world])

  // Every hook is above this line — an early return that changes the hook count on rotation tears
  // the chapter into the error boundary.
  if (needsRotate) return <RotateGate line="Measuring needs room — turn sideways! 📏" />

  if (!world || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="What shall we measure today?" worlds={PICK_WORLDS}
          onPick={id => { const w = worldById(id); if (w) { unlockSpeech(); setThing(w.things[0]); setWorld(w) } }} onExit={exit} />
      </div>
    )
  }

  // Demo and guided use the world's smallest things, so the idea lands before the counts grow.
  const demos = [world.things[0], world.things[2]]
  const guided = world.things[1]
  const shown: Thing = phase === 'practice' ? thing : phase === 'guided' ? guided : demos[demoIdx]

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: pillTop(short), left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '10px 24px',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}<DirectionsInline chapter="measurement" /></div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{MI_CSS}</style>
      <Background thing={shown} things={world.things} />
      <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', minHeight: 44, borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)',
          color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '76%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            {world.intro}
          </div>
          <button onClick={() => { unlockSpeech(); setPhase('demo') }}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))',
              color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s go! ▶</button>
        </div>
      )}

      {phase === 'demo' && (<>{Banner(`Watch Milo measure  (${demoIdx + 1}/${demos.length})`)}
        <MeasureExplain key={`demo${demoIdx}`} world={world} thing={demos[demoIdx]}
          onDone={() => { if (demoIdx + 1 < demos.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} /></>)}

      {phase === 'guided' && (<>{Banner(`Now you — how ${world.word} is the ${guided.noun}?`)}
        <MeasurePlay key="guided" world={world} thing={guided} mode="guided" onComplete={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: pillTop(short) - 2, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            onRound={data => { if (data?.id) setThing(data as Thing) }}
            onComplete={tally} />
        </div>
      )}

      <Notebook rows={book} tint={world.tint} />
      <MiloHost milo={world.milo} />
    </div>
  )
}
