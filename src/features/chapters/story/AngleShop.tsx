'use client'
/**
 * 📐 THE ANGLE SHOP — 9–11 · `anglesSymmetry`. Replaces the neon `AngleScope`.
 *
 * Slate's first week as an apprentice. Every job is either BENT to an angle or FOLDED symmetric,
 * and both are exact transforms — a rotation of `deg` IS `deg`, a mirror about an axis IS a fold —
 * which is why this chapter can be built from painted art without the art lying about the maths.
 *
 * ⚠️ EVERY RULE WORTH BREAKING IS IN THE PURE MODULE, NOT HERE. Jobs, grading, axis sets, words and
 * layout all live in `angles.ts` so the gate drives the same functions this file renders from.
 * What is left in this file is presentation — and that is exactly the half no gate can reach, so
 * the four rules it owns are marked ⚠️ where they live:
 *   1. NO DEGREE READOUT while the child is turning        (the hot/cold fault)
 *   2. the commit button is IDENTICAL at every angle        (chapter 4's green Ready button)
 *   3. the week strip holds its value back ONE round        (`onRound` fires on LOAD)
 *   4. a miss holds LONGER than a hit                       (2.6s was measured as too short)
 *
 * ⚠️ AND IT CAN NOW BE ANSWERED WITH THE HAND. Tilt your hand and the beam holds the angle you are
 * holding — your forearm IS the ramp. This is the band's strongest gesture precisely because the
 * answer is not described, it is HELD: a child who cannot yet say "obtuse" can still show you a
 * slope too shallow to get any speed on.
 *
 * ⚠️ ONE VALUE, TWO INPUTS, ONE GRADER. The hand does not answer the question — it writes the same
 * `deg` the ◀ turn ▶ steppers write, and `grade()` never learns which moved it. So the two paths
 * cannot drift apart and angles.ts's existing sweep covers both at once. WHICH control is live is
 * decided by `handDrivesAngle()` in the pure module, next to the reason it is not every round.
 *
 * See docs/storyboards/angle-shop.md for the shot list and docs/story-9-11-ar-plan.md §3.10.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { speak, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat, useChapterShell } from './StoryWorld'
import { RotateGate, useNeedsRotate } from './RotateGate'
import { SheetCell, Arrive } from './critters'
import { useViewport } from '@/shared/hooks/useViewport'
import {
  useHandInput, useHand, HandProvider, useDwell, CamView, CamGate, DwellRing, type HandSkin,
} from '@/infra/ar/HandInput'
import {
  STEP, clampDeg, trueAxes, candidateAxes, isTrueAxis, SHAPE_LINES,
  CAST, SITE_GEO, armFor, WEEK, makeRound, grade, heldCount, missFor, verdictFor, sigFor, guideShown, shopLayout,
  handDrivesAngle, snapDeg, nearestAxis,
  type Round, type AngleRound, type FoldRound, type Site, type QType, type Tier, type Layout,
} from './angles'

/**
 * The painted band's colours for the shared camera surface. ⚠️ `accentSoft` is its own field rather
 * than `${accent}66`, because this chapter colours itself from CSS variables and you cannot
 * concatenate an alpha onto `var(--milo-orange)`.
 */
const SKIN: HandSkin = {
  accent: 'var(--milo-orange)', accentSoft: 'rgba(242,107,44,.55)',
  ink: 'var(--ink)', muted: '#7a6a55', panel: 'rgba(255,252,244,.96)', line: 'rgba(61,37,22,.25)',
  onAccent: '#fff', font: 'var(--font-display)', mono: 'ui-monospace,Menlo,monospace',
}
/** The self-view's own box. Small on a short frame — the beam is what is being read, not the child. */
const CAM_W = (short: boolean) => (short ? 76 : 190)

// ─── the three sites ────────────────────────────────────────────────────────────────────
/** Every backdrop is 1376×768, matching the rest of the library exactly. */
const SCENE_W = 1376, SCENE_H = 768

interface SiteArt { scene: string; emoji: string }

const SITE: Record<Site, SiteArt> = {
  roof:    { scene: '/assets/backgrounds/ang_roof.jpeg',    emoji: '🏠' },
  bridge:  { scene: '/assets/backgrounds/ang_bridge.jpeg',  emoji: '🌉' },
  shelter: { scene: '/assets/backgrounds/ang_shelter.jpeg', emoji: '🚲' },
}

/**
 * ⚠️ THE GROUND LINE IS A SHARE OF THE *IMAGE*, AND USING IT AS A SHARE OF THE VIEWPORT FLOATS
 * EVERYTHING — on every aspect but the one you tested. `object-fit: cover` crops the backdrop the
 * moment the frame's aspect stops matching the art's 1.79, so the painted ground MOVES. RailLine
 * shipped that and the founder caught the train hanging 44px above its own rail on a wide window.
 * Map the line through the transform the backdrop is actually drawn with.
 */
function coverFit(site: Site, vw: number, vh: number, usableGround: number) {
  const cover = Math.max(vw / SCENE_W, vh / SCENE_H)
  const share = SITE_GEO[site].ground
  const natural = (vh - SCENE_H * cover) / 2 + share * SCENE_H * cover
  const groundPx = Math.min(natural, usableGround)
  // scale up if pinning the ground would otherwise leave a gap under the picture
  const s = Math.max(cover, (vh - groundPx) / ((1 - share) * SCENE_H))
  return {
    s, ox: (vw - SCENE_W * s) / 2,
    oy: Math.min(0, groundPx - share * SCENE_H * s),
    groundPx,
  }
}

// ─── layout ─────────────────────────────────────────────────────────────────────────────
interface Geo extends Layout {
  vw: number; vh: number
  groundPx: number
  fit: { s: number; ox: number; oy: number }
  /** vertex of the turning arm */
  vx: number; vy: number
  armLen: number
  slateH: number
  foremanH: number
}

function geoFor(site: Site, vw: number, vh: number): Geo {
  const L = shopLayout(vw, vh)
  const f = coverFit(site, vw, vh, L.groundY)
  const a = armFor(site, vw, vh, L, f.groundPx)
  return {
    ...L, vw, vh,
    groundPx: f.groundPx,
    fit: { s: f.s, ox: f.ox, oy: f.oy },
    vx: a.vx, vy: a.vy, armLen: a.len,
    slateH: Math.round(Math.min(L.frameH * 0.52, vh * 0.30)),
    foremanH: Math.round(Math.min(L.frameH * 0.60, vh * 0.34)),
  }
}

// ─── the turning arm ────────────────────────────────────────────────────────────────────
/**
 * The beam is code-drawn for now. ⚠️ Swapping in the painted `ang_beam.png` is ONE line — it must be
 * flat side-on with square ends, because a beam drawn in perspective stops being a beam the moment
 * you rotate it. The rotation is the maths either way; the sprite is only the material.
 */
function Beam({ len, deg, thick }: { len: number; deg: number; thick: number }) {
  return (
    <div style={{
      position: 'absolute', left: 0, bottom: -thick / 2, width: len, height: thick,
      transformOrigin: `0px ${thick / 2}px`, transform: `rotate(${-deg}deg)`,
      transition: 'transform .16s ease-out',
      background: 'linear-gradient(180deg,#a98456,#8a6a41 55%,#6f5433)',
      border: '2px solid #4a3722', borderRadius: 3,
      boxShadow: '0 2px 0 rgba(40,28,14,.35)',
    }} />
  )
}

/** The square-corner guide. A scaffold, and it RETIRES at L3 — TickTock's minute ring. */
function SetSquare({ size, dim }: { size: number; dim: boolean }) {
  return (
    <svg width={size} height={size} style={{
      position: 'absolute', left: 0, bottom: 0, opacity: dim ? 0.28 : 0.85,
      transition: 'opacity .4s ease', pointerEvents: 'none',
    }}>
      <path d={`M 0 ${size} L 0 0 L ${size} 0`} fill="none" stroke="#2E6E7E" strokeWidth={3} strokeDasharray="6 5" />
      <path d={`M 0 ${size * 0.72} L ${size * 0.28} ${size * 0.72} L ${size * 0.28} ${size}`}
        fill="none" stroke="#2E6E7E" strokeWidth={2.5} />
    </svg>
  )
}

function AngleStage({ g, deg, showDeg, guide }: {
  g: Geo; deg: number; showDeg: boolean; guide: boolean
}) {
  const thick = Math.max(9, Math.round(g.armLen * 0.055))
  const arcR = Math.round(g.armLen * 0.34)
  const rad = (deg * Math.PI) / 180
  const mid = (deg * Math.PI) / 360
  return (
    <div style={{ position: 'fixed', left: g.vx, top: g.vy, zIndex: 30, pointerEvents: 'none' }}>
      {/* the fixed arm — the reference edge the turn is measured against */}
      <div style={{
        position: 'absolute', left: 0, bottom: -thick / 2, width: g.armLen, height: thick,
        background: 'linear-gradient(180deg,#9b7a4e,#7c5f3a)', border: '2px solid #4a3722', borderRadius: 3,
      }} />
      {guide && <SetSquare size={arcR + 14} dim={false} />}
      <Beam len={g.armLen} deg={deg} thick={thick} />
      <svg width={arcR * 2 + 40} height={arcR * 2 + 40}
        style={{ position: 'absolute', left: -20, bottom: -20, overflow: 'visible' }}>
        <path
          d={`M ${20 + arcR} ${20 + arcR} m 0 0 L ${20 + arcR + arcR} ${20 + arcR}
              A ${arcR} ${arcR} 0 ${deg > 180 ? 1 : 0} 0
              ${20 + arcR + arcR * Math.cos(rad)} ${20 + arcR - arcR * Math.sin(rad)}`}
          fill="none" stroke="#B4381F" strokeWidth={3} opacity={0.9} />
      </svg>
      <div style={{
        position: 'absolute', left: -7, bottom: -7, width: 14, height: 14, borderRadius: '50%',
        background: '#4a3722',
      }} />
      {/* ⚠️ RULE 1 — the figure exists ONLY after the commit. Printed while turning, the child slides
          until the screen agrees and the chapter becomes hot/cold. */}
      {showDeg && (
        <div style={{
          position: 'absolute',
          left: (arcR + 26) * Math.cos(mid) - 18, bottom: (arcR + 26) * Math.sin(mid) - 12,
          fontFamily: 'ui-monospace,Menlo,monospace', fontWeight: 800, fontSize: Math.max(15, thick * 1.7),
          color: '#B4381F', textShadow: '0 1px 0 rgba(255,252,244,.9)', animation: 'as_pop .35s ease both',
        }}>{deg}°</div>
      )}
    </div>
  )
}

// ─── the folding panel ──────────────────────────────────────────────────────────────────
/** Exact polygon — a regular hexagon must be regular, so this is geometry, never a painted guess. */
function poly(shape: FoldRound['shape'], r: number): Array<[number, number]> {
  if (shape === 'square') { const s = r * 0.78; return [[-s, -s], [s, -s], [s, s], [-s, s]] }
  if (shape === 'rectangle') { const w = r, h = r * 0.6; return [[-w, -h], [w, -h], [w, h], [-w, h]] }
  if (shape === 'isosceles') return [[0, -r], [r * 0.74, r * 0.66], [-r * 0.74, r * 0.66]]
  const n = shape === 'equilateral' ? 3 : shape === 'pentagon' ? 5 : 6
  const out: Array<[number, number]> = []
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    out.push([r * Math.cos(a), r * Math.sin(a)])
  }
  return out
}

function FoldStage({ g, data, marked, bar, folding, showTruth }: {
  g: Geo; data: FoldRound; marked: number[]; bar: number
  /** index into `marked` currently being folded, or -1 */
  folding: number; showTruth: boolean
}) {
  const r = Math.round(Math.min(g.frameH * 0.34, g.vw * 0.13))
  const pts = poly(data.shape, r).map(p => p.join(',')).join(' ')
  const box = r * 2.4
  const truth = trueAxes(data.shape)
  const axisLine = (a: number, len: number) => {
    const rad = (a * Math.PI) / 180
    return { x1: -len * Math.cos(rad), y1: len * Math.sin(rad), x2: len * Math.cos(rad), y2: -len * Math.sin(rad) }
  }
  const foldingAxis = folding >= 0 ? marked[folding] : null
  return (
    <div style={{
      position: 'fixed', left: g.vx, top: g.groundPx - Math.round(g.frameH * 0.44),
      transform: 'translate(-50%,-50%)', zIndex: 30, pointerEvents: 'none',
    }}>
      <svg width={box} height={box} viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}>
        {/* contact shadow — it sits on the bench, it does not hover */}
        <ellipse cx={0} cy={r * 1.16} rx={r * 0.9} ry={r * 0.12} fill="rgba(30,42,60,.22)" />
        <polygon points={pts} fill="#b9c0c6" stroke="#4a5560" strokeWidth={3} strokeLinejoin="round" />
        {/* the half that swings over, while a fold plays */}
        {foldingAxis !== null && (
          <polygon points={pts} fill={isTrueAxis(data.shape, foldingAxis) ? 'rgba(75,107,58,.45)' : 'rgba(180,56,31,.35)'}
            style={{
              transformOrigin: '0px 0px',
              transform: `rotate(${-foldingAxis}deg) scaleY(-1) rotate(${foldingAxis}deg)`,
              transition: 'transform .5s ease',
            }} />
        )}
        {/* axes the child has marked — no feedback until the commit */}
        {marked.map((a, i) => {
          const l = axisLine(a, r * 1.18)
          const held = showTruth && isTrueAxis(data.shape, a)
          const failed = showTruth && !held
          return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={held ? '#4B6B3A' : failed ? '#B4381F' : '#B4381F'}
            strokeWidth={held ? 4 : 3} opacity={failed ? 0.35 : 1}
            strokeDasharray={failed ? '5 5' : undefined} />
        })}
        {/* the ones they MISSED — post-commit only, and this is the teaching */}
        {showTruth && truth.filter(t => !marked.some(m => Math.abs(m - t) < 0.01)).map((t, i) => {
          const l = axisLine(t, r * 1.18)
          return <line key={`m${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="#4A463C" strokeWidth={2} strokeDasharray="4 5" opacity={0.55} />
        })}
        {/* the sweeping bar the child is aiming */}
        {!showTruth && folding < 0 && (() => {
          const l = axisLine(bar, r * 1.32)
          return <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="#22201C" strokeWidth={3} strokeDasharray="8 6" opacity={0.8} />
        })()}
      </svg>
    </div>
  )
}

// ─── the consequence ────────────────────────────────────────────────────────────────────
/**
 * ⚠️ Code-drawn, because it has to be STEERED BY THE ANSWER — a generated rain loop plays the same
 * whichever way the child got it, and this shot is the entire reason the chapter exists.
 */
function Rain({ g, sheds }: { g: Geo; sheds: boolean }) {
  const drops = useMemo(() => Array.from({ length: 34 }, (_, i) => ({
    x: (i * 37) % 100, d: (i % 7) * 0.11, len: 12 + (i % 4) * 6,
  })), [])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 34, pointerEvents: 'none' }}>
      {drops.map((d, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${d.x}%`, top: -20, width: 2, height: d.len,
          background: 'rgba(120,160,185,.75)', borderRadius: 2,
          animation: `as_rain 1.1s linear ${d.d}s infinite`,
        }} />
      ))}
      {!sheds && (
        <div style={{
          position: 'absolute', left: g.vx - 60, top: g.vy - 26, width: 120, height: 16,
          background: 'rgba(70,120,150,.55)', borderRadius: '50%',
          animation: 'as_pool 1.6s ease-out both',
        }} />
      )}
    </div>
  )
}

// ─── the cast ───────────────────────────────────────────────────────────────────────────

/** ⚠️ The bubble is anchored to the MOUTH of whoever is speaking, and the speaker is on screen
 *  whenever the bubble is — a tail pointing at an empty corner is worse than no tail. */
function Bubble({ g, text, lead, x }: { g: Geo; text: string; lead?: string; x: number }) {
  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, top: g.bubbleTop, zIndex: 42,
      display: 'flex', justifyContent: 'center', padding: '0 3vw', pointerEvents: 'none',
    }}>
      <div style={{
        // wider on a short frame so the same words take fewer lines
        position: 'relative', maxWidth: g.short ? g.vw * 0.88 : Math.min(g.vw * 0.62, 640),
        background: 'rgba(255,252,244,.96)', border: '3px solid var(--outline)', borderRadius: 18,
        padding: g.short ? '7px 14px' : '10px 18px',
        fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: g.short ? 13 : 16, lineHeight: 1.35, color: 'var(--ink)',
        boxShadow: '0 5px 0 rgba(61,37,22,.15)',
      }}>
        {lead && <div style={{ fontWeight: 900, marginBottom: 2 }}>{lead}</div>}
        {text}
        <div style={{
          position: 'absolute', bottom: -13, left: (() => { const w = g.short ? g.vw * 0.88 : Math.min(g.vw * 0.62, 640); return Math.max(18, Math.min(x - (g.vw - w) / 2, w - 30)) })(),
          width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
          borderTop: '13px solid var(--outline)',
        }} />
      </div>
    </div>
  )
}

// ─── the week strip — the cumulative arc, OUTSIDE SkillBeat ─────────────────────────────
interface Done { day: string; label: string; ok: boolean }

function WeekStrip({ done, short }: { done: Done[]; short: boolean }) {
  if (!done.length) return null
  return (
    <div style={{
      position: 'fixed', top: 8, left: 0, right: 0, zIndex: 44,
      display: 'flex', justifyContent: 'center', gap: 5, padding: '0 90px', pointerEvents: 'none',
    }}>
      {done.map((d, i) => (
        <div key={i} title={d.day} style={{
          background: d.ok ? 'rgba(75,107,58,.92)' : 'rgba(180,56,31,.85)', color: '#fff',
          borderRadius: 6, padding: short ? '2px 6px' : '3px 9px',
          fontFamily: 'ui-monospace,Menlo,monospace', fontWeight: 700, fontSize: short ? 9 : 11,
        }}>{d.label}</div>
      ))}
    </div>
  )
}

// ─── play ───────────────────────────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
/** The instruction chip — ONE verb-led action, and it is the one place the two inputs differ. */
const hint: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)',
  background: 'rgba(255,252,244,.92)', border: '2px solid var(--outline)',
  borderRadius: 999, padding: '5px 14px', maxWidth: '46vw',
}
const HIT_MS = 3000, MISS_MS = 4600   // ⚠️ RULE 4 — a miss holds LONGER; 2.6s was measured as too short

const AngleShopPlay: React.FC<{
  data: Round; mode: Mode; onComplete: (correct: boolean) => void
}> = ({ data, mode, onComplete }) => {
  const { w: vw, h: vh } = useViewport()
  const g = geoFor(data.job_.site, vw, vh)
  const guide = guideShown(data.tier)

  const [deg, setDeg] = useState(() => data.type === 'angle' ? data.start : 90)
  const [bar, setBar] = useState(0)
  const [marked, setMarked] = useState<number[]>([])
  const [settled, setSettled] = useState(false)
  const [folding, setFolding] = useState(-1)
  const [miss, setMiss] = useState<string | null>(null)
  const done = useRef(false)
  const tapLock = useRef(0)

  // memoised, or the effects below would fire on every render off a fresh array identity
  const cands = useMemo(() => (data.type === 'fold' ? candidateAxes(data.shape) : []), [data])

  useEffect(() => { if (mode === 'guided') speak(data.ask) }, [mode, data.ask])

  // ─── the hand ─────────────────────────────────────────────────────────────────────────
  const { read, input } = useHand()
  const onCam = input === 'hand'
  /**
   * WHO OWNS THE VALUE decides which control is drawn, and it must NOT depend on `settled` — the
   * whole row is already dimmed and dead once the answer is in, and flipping the ring back into
   * three buttons at the exact moment of the verdict is a reshuffle under the child's eyes.
   * Whether the hand is LIVE is the separate, narrower question the effects below ask.
   */
  const handOwnsArm = onCam && handDrivesAngle(data)
  const handOwnsBar = onCam && data.type === 'fold'
  const armLive = handOwnsArm && !settled
  const barLive = handOwnsBar && !settled

  // ⚠️ The hand writes the SAME `deg` the steppers write. It is not a second value with a second
  // grader; below this line nothing knows which input moved it. `snapDeg` carries the hysteresis
  // that stops a still hand dithering across a 5° boundary and never arming the commit.
  const tilt = read.tilt
  /**
   * ⚠️ THE HELD-OVER-POSE GUARD NEEDS ONE MORE TURN HERE THAN IT DOES IN FACTOR LAB, and the reason
   * is worth knowing: there the dwell watches the RAW reading, which is already current the instant
   * the round opens; here it watches `deg`, which is an ECHO of the hand and lags it by a render. So
   * the guard would capture `data.start` — a value the hand has nothing to do with — the hand's own
   * angle would land a render later and read as a CHANGE, and a round would commit a pose the child
   * struck for the last question. Caught on the first drive, exactly as Factor Lab's was.
   * Not arming until the hand has written once puts the guard back on the hand's own value.
   */
  const [handSet, setHandSet] = useState(false)
  useEffect(() => {
    if (!armLive || tilt === null) return
    setDeg(cur => snapDeg(tilt, cur))
    setHandSet(true)
  }, [armLive, tilt])

  useEffect(() => {
    if (!barLive || tilt === null || !cands.length) return
    setBar(nearestAxis(cands, tilt))
  }, [barLive, tilt, cands])

  /** ⚠️ A short lock, NOT a gate on `useIsSpeaking()` — Chrome reports `speaking` for 3.2s after one
   *  spoken digit, which in a chapter wanting many taps is half a minute of dead screen. */
  const locked = () => { const t = Date.now(); if (t - tapLock.current < 160) return true; tapLock.current = t; return false }

  const turn = (d: number) => { if (settled || locked()) return; setDeg(v => clampDeg(v + d)) }
  const sweep = (d: number) => {
    if (settled || locked()) return
    setBar(b => { const i = cands.indexOf(b); return cands[(i + d + cands.length) % cands.length] ?? cands[0] })
  }
  const mark = () => {
    if (settled || locked()) return
    setMarked(m => m.includes(bar) ? m.filter(x => x !== bar) : [...m, bar])   // tap again = take it back
  }

  const commit = useCallback(() => {
    if (done.current || settled) return
    done.current = true; setSettled(true)
    const answer = data.type === 'angle' ? deg : marked
    const ok = grade(data, answer)
    if (!ok) { const line = missFor(data, answer); setMiss(line); speak(line) }
    else speak(verdictFor(data, answer))
    if (data.type === 'fold') {
      // fold each marked axis in turn, then hold
      let i = 0
      const step = () => {
        if (i >= marked.length) { setFolding(-1); window.setTimeout(() => onComplete(ok), ok ? HIT_MS : MISS_MS); return }
        setFolding(i); i++; window.setTimeout(step, 1100)
      }
      if (marked.length) step(); else window.setTimeout(() => onComplete(ok), ok ? HIT_MS : MISS_MS)
    } else {
      window.setTimeout(() => onComplete(ok), ok ? HIT_MS : MISS_MS)
    }
  }, [data, deg, marked, settled, onComplete])

  /**
   * ⚠️ Called UNCONDITIONALLY, and merely not live on the pointer path — branching above a hook
   * changes the hook count and tears the chapter into the error boundary, which this repo has
   * shipped once already. On an angle round the hand's commit is HOLDING STILL, exactly as it is in
   * Factor Lab: there is no "Fix it ✓" to press, because pressing one with the other hand is the
   * fiddliest thing you can ask of a child who is holding a pose.
   */
  const progress = useDwell(
    { value: deg, key: `${deg}`, ready: tilt !== null },
    () => commit(),
    armLive && handSet,
  )

  const sheds = data.type === 'angle' && grade(data, deg)
  const btnStyle = (primary?: boolean): React.CSSProperties => ({
    minWidth: g.btn, height: g.btn, padding: '0 14px', borderRadius: 12, cursor: 'pointer',
    border: '3px solid var(--outline)',
    background: primary ? 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))' : 'rgba(255,252,244,.94)',
    color: primary ? '#fff' : 'var(--ink)',
    fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: Math.max(14, g.btn * 0.34),
  })

  return (
    <>
      <img src={SITE[data.job_.site].scene} alt="" style={{
        position: 'fixed', left: g.fit.ox, top: g.fit.oy, width: SCENE_W * g.fit.s, height: SCENE_H * g.fit.s,
        zIndex: 0, maxWidth: 'none',
      }} />

      {data.type === 'angle'
        ? <AngleStage g={g} deg={deg} showDeg={settled} guide={guide && !settled} />
        : <FoldStage g={g} data={data} marked={marked} bar={bar} folding={folding} showTruth={settled} />}

      {settled && data.type === 'angle' && <Rain g={g} sheds={sheds} />}

      {/* Slate — at the handle while working, standing once it is fixed */}
      <div style={{ position: 'fixed', left: g.vx - g.armLen * 0.55, top: g.groundPx, zIndex: 32, transform: 'translate(-50%,-100%)' }}>
        <SheetCell src={settled ? CAST.slate : CAST.slateWork} h={g.slateH} moving={!settled} />
      </div>

      <Bubble g={g} x={g.vx - g.armLen * 0.55}
        lead={data.job_.day}
        text={settled ? (miss ?? verdictFor(data, data.type === 'angle' ? deg : marked)) : data.ask} />

      <div style={{
        position: 'fixed', left: 0, right: 0, top: g.controlTop, height: g.controlH, zIndex: 46,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: g.short ? 8 : 14,
        opacity: settled ? 0.35 : 1, pointerEvents: settled ? 'none' : 'auto', transition: 'opacity .3s ease',
      }}>
        {data.type === 'angle' ? (handOwnsArm ? (<>
          {/* ⚠️ The ring says only HOW FAR THE COMMIT HAS ARMED — never the degrees, and never
              whether they are right. Printing the figure here would be rule 1 broken by the back
              door: the child would tilt until the screen agreed. The beam IS the readout. */}
          <DwellRing progress={progress} size={g.btn + 12} skin={SKIN}>{tilt === null ? '–' : '✋'}</DwellRing>
          <span style={hint}>{tilt === null ? 'Show Milo your hand' : 'Tilt your hand — then hold it still'}</span>
        </>) : (<>
          <button style={btnStyle()} onClick={() => turn(-STEP)} aria-label="Turn down">◀ turn</button>
          {/* ⚠️ RULE 2 — identical at every angle. A commit that lights up when the answer is right
              is chapter 4's green Ready button: the child wins by watching the colour. */}
          <button style={btnStyle(true)} onClick={commit}>Fix it ✓</button>
          <button style={btnStyle()} onClick={() => turn(STEP)} aria-label="Turn up">turn ▶</button>
          {/* Camera on, but this round wants an exact figure — say so, or the hand looks broken. */}
          {onCam && <span style={hint}>This one is exact — use the turns</span>}
        </>)) : (<>
          {!handOwnsBar && <button style={btnStyle()} onClick={() => sweep(-1)} aria-label="Sweep back">◀ turn</button>}
          <button style={btnStyle()} onClick={mark}>{marked.includes(bar) ? 'Unmark' : 'Mark ✓'}</button>
          <button style={btnStyle(true)} onClick={commit}>Fold it ✓</button>
          {!handOwnsBar && <button style={btnStyle()} onClick={() => sweep(1)} aria-label="Sweep on">turn ▶</button>}
          {handOwnsBar && <span style={hint}>Lay your hand along the fold, then Mark it</span>}
        </>)}
      </div>
    </>
  )
}

// ─── demo / re-teach ────────────────────────────────────────────────────────────────────
/**
 * ⚠️ SELF-PACED, NOT `speakSteps`. That helper reveals each visual from the utterance's `onstart`,
 * so on the many devices where speech starts line one and silently drops the rest the teaching
 * freezes for ever — TickTock shipped exactly that and a founder sat on a beat with no way forward.
 */
function dwellFor(line: string) { return Math.max(2100, Math.min(6200, line.length * 70)) }

interface DemoStep { say: string; deg?: number; marked?: number[]; showDeg?: boolean; rain?: boolean }

/** ⚠️ EXPORTED so the gate can drive the same list the demo plays — SupplyRun's teaching taught the
 *  opposite of its own rule for exactly as long as this list was component-local. */
export function demoSteps(data: Round): DemoStep[] {
  if (data.type === 'angle') {
    const want = data.want
    const target = data.target ?? (want === 'acute' ? 60 : want === 'obtuse' ? 125 : 90)
    return [
      { say: `${data.job_.because}. So ${data.job_.piece} has to be ${want === 'acute' ? 'sharper' : want === 'obtuse' ? 'shallower' : 'exactly square'} than a square corner.`, deg: data.start },
      { say: `Slate reckons she can stand on anything. The rain cannot.`, deg: data.start },
      { say: `So I turn it — and I keep the square corner beside it to judge against.`, deg: Math.round((data.start + target) / 2 / STEP) * STEP },
      { say: `There. That is the one.`, deg: target },
      { say: `Now it is fixed, and only now does the number matter: ${target} degrees.`, deg: target, showDeg: true },
      { say: want === 'acute' ? `And the rain runs straight off.` : want === 'obtuse' ? `Shallow enough to sit under, steep enough to drain.` : `Flush. Square as a die.`, deg: target, showDeg: true, rain: true },
    ]
  }
  const truth = trueAxes(data.shape)
  const out: DemoStep[] = [
    { say: `${data.job_.piece} has to be symmetric, or it will not sit square in the hole.`, marked: [] },
    { say: `So I look for every line I could fold it along and have the halves match.`, marked: [] },
  ]
  truth.forEach((a, i) => out.push({ say: i === 0 ? `Here is one — fold it there and the halves land on each other.` : `And another.`, marked: truth.slice(0, i + 1) }))
  out.push({ say: `That is ${truth.length} line${truth.length === 1 ? '' : 's'} of symmetry.`, marked: truth })
  return out
}

const AngleShopExplain: React.FC<{ data: Round; onDone: () => void }> = ({ data, onDone }) => {
  const { w: vw, h: vh } = useViewport()
  const g = geoFor(data.job_.site, vw, vh)
  const steps = useMemo(() => demoSteps(data), [data])
  const [i, setI] = useState(0)
  // held in a ref so a new `onDone` identity does not restart the teaching mid-sentence
  const doneRef = useRef(onDone)
  useEffect(() => { doneRef.current = onDone }, [onDone])

  useEffect(() => {
    let cancelled = false
    let t: number | undefined
    const run = (k: number) => {
      if (cancelled) return
      if (k >= steps.length) { t = window.setTimeout(() => doneRef.current(), 1200); return }
      setI(k); speak(steps[k].say)
      t = window.setTimeout(() => run(k + 1), dwellFor(steps[k].say))
    }
    run(0)
    return () => { cancelled = true; if (t) window.clearTimeout(t); stopSpeech() }
  }, [steps])

  const s = steps[Math.min(i, steps.length - 1)]
  return (
    <>
      <img src={SITE[data.job_.site].scene} alt="" style={{
        position: 'fixed', left: g.fit.ox, top: g.fit.oy, width: SCENE_W * g.fit.s, height: SCENE_H * g.fit.s,
        zIndex: 0, maxWidth: 'none',
      }} />
      {data.type === 'angle'
        ? <AngleStage g={g} deg={s.deg ?? data.start} showDeg={!!s.showDeg} guide={guideShown(data.tier)} />
        : <FoldStage g={g} data={data} marked={s.marked ?? []} bar={0} folding={-1} showTruth={false} />}
      {s.rain && <Rain g={g} sheds />}
      <div style={{ position: 'fixed', left: g.vx - g.armLen * 0.55, top: g.groundPx, zIndex: 32, transform: 'translate(-50%,-100%)' }}>
        <SheetCell src={CAST.slateWork} h={g.slateH} moving />
      </div>
      {/* the foreman walks in for the teaching — the speaker is on screen while the bubble is */}
      <div style={{ position: 'fixed', left: g.vx + g.armLen * 0.75, top: g.groundPx, zIndex: 31, transform: 'translate(-50%,-100%)' }}>
        <Arrive dist={vw * 0.45} ms={2200} resetKey={data.job_.day}>
          {moving => <SheetCell src={CAST.foreman} h={g.foremanH} facesLeft moving={moving} />}
        </Arrive>
      </div>
      <Bubble g={g} x={g.vx + g.armLen * 0.75} lead={data.job_.day} text={s.say} />
    </>
  )
}

// ─── beat + orchestrator ────────────────────────────────────────────────────────────────
function makeBeat(onDone: (d: Round, ok: boolean) => void): Beat<Round> {
  return {
    skillId: 'anglesSymmetry',
    rounds: WEEK.length,
    /** ⚠️ Mastery must not exit before BOTH verbs have been asked. A strong child gets ~3 rounds at
     *  L1, ONE at L2 and TWO at L3 — measured on TickTock, a third of good runs missed the hard
     *  half outright without this. */
    coverage: { of: (d: Round) => d.type as QType, all: ['angle', 'fold'] },
    /** ⚠️ This chapter writes its own miss lines, so the shared centred pill (which would land on
     *  the very thing it is asking the child to look at) is suppressed. */
    ownsFeedback: true,
    sig: sigFor,
    make: (d, round, asked) => makeRound((d || 1) as Tier, round ?? 0, (asked ?? []) as QType[]),
    prompt: () => '',            // the chapter draws its own, richer, at the speaker's mouth
    say: d => d.ask,
    Play: ({ data, onSubmit }) => <PracticeRound data={data} onSubmit={onSubmit} onDone={onDone} />,
    Reteach: ({ data, onDone: d }) => <ReteachRound data={data} onDone={d} />,
  }
}

const PracticeRound: React.FC<{ data: Round; onSubmit: (ok: boolean) => void; onDone: (d: Round, ok: boolean) => void }> =
  ({ data, onSubmit, onDone }) => (
    <AngleShopPlay data={data} mode="practice" onComplete={ok => { onDone(data, ok); onSubmit(ok) }} />
  )
const ReteachRound: React.FC<{ data: Round; onDone: () => void }> = ({ data, onDone }) =>
  <AngleShopExplain data={data} onDone={onDone} />

type Phase = 'intro' | 'demo' | 'guided' | 'practice'

export default function AngleShop({ onFinish, onExit }: {
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const { h: vh } = useViewport()
  const needsRotate = useNeedsRotate()
  const [phase, setPhase] = useState<Phase>('intro')
  const [demoIdx, setDemoIdx] = useState(0)
  /**
   * Every finished round, in order — ONE source of truth.
   * ⚠️ RULE 3 — `onRound` fires when a round LOADS, so a strip that appends there prints the answer
   * to the question still on screen. RailLine shipped exactly that: round 2's strip already read
   * round 2's answer. The newest entry is therefore held back a round — and that is a DERIVED VIEW
   * (`log.slice(0, -1)`) rather than a second piece of state, so the two cannot drift.
   */
  const [log, setLog] = useState<Done[]>([])

  const marker = useMemo(() => ({ fill: '#F26B2C', ink: '#3D2516' }), [])
  const {
    hand, onCam, ready, camReady, status, error, start, stop, useTaps, useCamera, videoRef, canvasRef,
  } = useHandInput({ reads: 'tilt', marker })
  const { exit, tally } = useChapterShell(onFinish, onExit, stop)

  /**
   * ⚠️ The rotate gate is an EARLY RETURN, so turning the tablet unmounts the <video> — and a
   * MediaStream whose element has gone is a camera light left on with nothing able to reach it.
   * Stop it here; the gate's "Try the camera again" is waiting when they turn back.
   */
  useEffect(() => { if (needsRotate) stop() }, [needsRotate, stop])


  const recordDone = useCallback((d: Round, ok: boolean) => {
    setLog(list => [...list, {
      day: d.job_.day, ok,
      label: d.type === 'angle' ? '∠' : `⬡${SHAPE_LINES[(d as FoldRound).shape]}`,
    }])
  }, [])

  const beat = useMemo(() => makeBeat(recordDone), [recordDone])
  const DEMO = useMemo<Round[]>(() => [makeRound(1, 0, []), makeRound(1, 1, [])], [])
  const GUIDED = useMemo<Round>(() => makeRound(1, 2, []), [])

  // ⚠️ The early return sits BELOW every hook. Above them, turning the phone changes the hook count
  // and React tears the chapter into the error boundary — TickTock shipped that for a session.
  if (needsRotate) return <RotateGate line="The shop needs a wide bench — turn your tablet sideways." />

  const short = vh < 470
  const chip = (
    <button onClick={exit} style={{
      position: 'fixed', top: 10, left: 10, zIndex: 60, background: 'rgba(255,252,244,.92)',
      border: '3px solid var(--outline)', borderRadius: 999, padding: '5px 14px',
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)', cursor: 'pointer',
    }}>‹ Menu</button>
  )
  const banner = (text: string) => (
    <div style={{ position: 'fixed', top: 10, right: 12, zIndex: 46, pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(255,252,244,.94)', border: '3px solid var(--milo-orange)', borderRadius: 999,
        padding: '5px 18px', fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: short ? 13 : 16, color: 'var(--ink)',
      }}>{text}</div>
    </div>
  )

  const inShop = phase !== 'intro'

  return (
    <HandProvider value={hand}>
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#2a2620' }}>
      <style>{AS_CSS}</style>
      {chip}

      {phase === 'intro' && (<>
        <img src={SITE.roof.scene} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
        <div style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{
            maxWidth: 540, background: 'rgba(255,252,244,.96)', border: '4px solid var(--outline)',
            borderRadius: 22, padding: '22px 26px', textAlign: 'center', boxShadow: '0 8px 0 rgba(61,37,22,.15)',
          }}>
            <div style={{ fontSize: 34, marginBottom: 6 }}>📐 🏠 🌉 🚲</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, color: 'var(--ink)', margin: '0 0 10px' }}>The Angle Shop</h1>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, lineHeight: 1.45, color: 'var(--ink)', margin: '0 0 18px' }}>
              It is Slate&apos;s first week on the crew. Every job is either turned to an angle or folded
              so both halves match — and the foreman is watching, until he isn&apos;t.
              {onCam
                ? ' Tilt your hand at the camera and the beam holds the same slope you are holding.'
                : ' Use the turns to set each one.'}
            </p>
            {/* ⚠️ BOTH DOORS, EVERY TIME. The device's last pick decides which is the BIG button —
                never which is the only one. A parent who says no to the camera on Monday must not
                have to say it again, and a child who wants it back must not have to hunt. */}
            <button onClick={() => { unlockSpeech(); setPhase('demo'); if (onCam) start() }} style={{
              border: 'none', borderRadius: 999, padding: '12px 26px', cursor: 'pointer',
              background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff',
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, boxShadow: '0 5px 0 rgba(180,70,20,.45)',
            }}>{onCam ? 'Turn on the camera →' : 'Start the week →'}</button>
            <div>
              <button onClick={() => { unlockSpeech(); if (onCam) useTaps(); else useCamera(); setPhase('demo') }} style={{
                marginTop: 12, border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#7a6a55',
                textDecoration: 'underline',
              }}>{onCam ? 'Use the turns instead' : 'Use the camera instead'}</button>
            </div>
          </div>
        </div>
      </>)}

      {inShop && onCam && (
        <CamView videoRef={videoRef} canvasRef={canvasRef} w={CAM_W(short)} bottom={short ? 8 : 14}
          skin={SKIN} hidden={!camReady} />
      )}
      {inShop && onCam && !camReady && (
        <CamGate status={status} error={error} skin={SKIN} onRetry={start} onTaps={useTaps} onExit={exit}
          denied="Slate can set the angle from your hand, or you can use the turns instead — both work." />
      )}

      {inShop && ready && (<>

      {phase === 'demo' && (<>
        {banner(`Watch Slate · ${demoIdx + 1}/${DEMO.length}`)}
        <AngleShopExplain key={`demo${demoIdx}`} data={DEMO[demoIdx]}
          onDone={() => { if (demoIdx + 1 < DEMO.length) setDemoIdx(demoIdx + 1); else setPhase('guided') }} />
      </>)}

      {phase === 'guided' && (<>
        {banner('Your turn')}
        <AngleShopPlay key="guided" data={GUIDED} mode="guided" onComplete={() => setPhase('practice')} />
      </>)}

      {phase === 'practice' && (<>
        <WeekStrip done={log.slice(0, -1)} short={short} />
        <SkillBeat beat={beat}
          onComplete={tally} />
      </>)}

      </>)}
    </div>
    </HandProvider>
  )
}

const AS_CSS = `
@keyframes as_pop { from { transform: scale(.7); opacity: 0 } to { transform: scale(1); opacity: 1 } }
@keyframes as_rain { from { transform: translateY(0) } to { transform: translateY(110vh) } }
@keyframes as_pool { from { transform: scaleX(.2); opacity: 0 } to { transform: scaleX(1); opacity: 1 } }
@media (prefers-reduced-motion: reduce) {
  [style*="as_rain"], [style*="as_pool"], [style*="as_pop"] { animation-duration: .01ms !important; animation-iteration-count: 1 !important }
}
`
