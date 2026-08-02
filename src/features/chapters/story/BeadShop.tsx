'use client'
/**
 * Chapter 8 — PATTERNS (skill `patterns`), as ONE THING THAT GETS LONGER.
 *
 * WHAT CHANGED AND WHY. This chapter used to string a fresh pattern every round and throw the last
 * one away, then draw a SECOND, smaller necklace in the bottom-right corner to show what had been
 * won — two necklaces on screen at once, one to read and one to admire, and on a short landscape
 * frame the corner card sat on top of the tray the child had to tap. The fix is not to move the
 * card. It is that there was only ever supposed to be one string.
 *
 * So: Milo is making ONE thing, and it grows for the whole chapter. Every item the child gets right
 * is threaded onto the end of it and stays there. The question is the run of items already on the
 * string, and the answer is what comes next on that same string — which is what continuing a
 * pattern actually is. Three consequences:
 *   • the arc needs no widget: the thing being made IS the scene, and it is visibly longer at round
 *     ten than at round one
 *   • the journey is the mechanic — the tapped item travels to the empty place and becomes part of
 *     the thing, rather than a creature flying over to point at it
 *   • the tray collision is deleted rather than patched, because the card it collided with is gone
 *
 * WHAT MAY NOT CHANGE. Colour is the pattern variable, so it stays in code and never gets baked
 * into a PNG: a grayscale sprite is TINTED to the exact hex, which is what lets one sprite serve
 * every colour and stay identical to the spoken labels. And the run is read left to right, so it is
 * a deliberate straight line — nothing in it may re-order or drift.
 *
 * THE PATTERN IS ALSO A CHANT. Milo says "red, blue, red, blue…" as he goes, because at three a
 * pattern is as much a rhythm as a picture, and the two reinforce each other.
 *
 * WHEN THE PATTERN CHANGES (the adaptive tier moves AB → ABC → ABCD, or demotes) Milo starts a new
 * run on the SAME string, opening it with a few items of his own so there is always something to
 * read. A gold joint marks where the new pattern starts; everything before it shrinks and dims into
 * the tail, so the string is visibly long without the old run competing with the one being read.
 *
 * Landscape-first, wrapped by the registry / `?ch=beads`.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { speak, speakSteps, stopSpeech, unlockSpeech } from '@/infra/useMiloSpeaker'
import { SkillBeat, type Beat } from './StoryWorld'
import WorldSelect from './WorldSelect'
import FitBox from './FitBox'
import { patternUnitLen, type Difficulty } from '@/core/adaptive'
import { useViewport } from '@/shared/hooks/useViewport'
import { useNeedsRotate, RotateGate } from './RotateGate'
import { shuffle } from '@/core/rand'

/**
 * The only thing a tap waits for. Deliberately NOT `useIsSpeaking()`: a wrong tap speaks a line and
 * `speechSynthesis.speaking` stays true for over three seconds afterwards, which swallows the
 * child's retry — measured in chapter 4, and found again in this band while driving Shape House.
 * `speak()` already cancels the utterance in flight, so a quick retry simply speaks the newest line.
 */
const TAP_LOCK_MS = 260
const SHORT_H = 470


// ─── Colours (the pattern variable) ──────────────────────────────────────────────────
type BeadColor = 'red' | 'blue' | 'yellow' | 'green' | 'orange' | 'purple' | 'pink'
const BEADS: Record<BeadColor, { label: string; hex: string; deep: string }> = {
  red:    { label: 'red',    hex: '#E64545', deep: '#B5302F' },
  blue:   { label: 'blue',   hex: '#3FA3EE', deep: '#2575B8' },
  yellow: { label: 'yellow', hex: '#FFC93C', deep: '#D69A12' },
  green:  { label: 'green',  hex: '#5DB94B', deep: '#3C8B2F' },
  orange: { label: 'orange', hex: '#F2872C', deep: '#C25E13' },
  purple: { label: 'purple', hex: '#9B5FD6', deep: '#6E3CA8' },
  pink:   { label: 'pink',   hex: '#F472B6', deep: '#C13E86' },
}
const BEAD_ORDER: BeadColor[] = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink']

// ─── The three things Milo can make ──────────────────────────────────────────────────
/**
 * ONE item kind per run, because you do not thread a bead, then a button, then a gem onto the same
 * necklace — and there is only one string now. The picker is therefore a genuine choice of what to
 * make rather than a lobby in front of the chapter, which is why it survived when the shapes and
 * colours pickers were dropped.
 */
type ItemKind = 'bead' | 'flag' | 'car'
type Connector = 'string' | 'cord' | 'track'
interface Make {
  id: string; label: string; emoji: string
  kind: ItemKind; noun: string; thing: string      // "necklace" — what the growing line IS
  connector: Connector; line: number               // where the cord crosses the item box (0–1)
  src: string; bg: string; grad: string
  intro: string
}
const MAKES: Make[] = [
  { id: 'beads', label: 'A necklace', emoji: '📿', kind: 'bead', noun: 'bead', thing: 'necklace',
    connector: 'string', line: 0.5, src: '/assets/objects/pat_bead.png',
    bg: '/assets/backgrounds/bead_shop.png', grad: 'linear-gradient(#ffe9cf 0%, #fff3e2 52%, #f3dcc0 100%)',
    intro: 'Milo is making ONE long necklace today! The colours repeat, over and over. Every bead you find gets threaded on.' },
  { id: 'party', label: 'Party bunting', emoji: '🎉', kind: 'flag', noun: 'flag', thing: 'bunting',
    connector: 'cord', line: 0.08, src: '/assets/objects/pat_flag.png',
    bg: '/assets/backgrounds/party_banner.png', grad: 'linear-gradient(#e7f3ff 0%, #fff3e2 52%, #ffe2ef 100%)',
    intro: 'Milo is hanging ONE long line of bunting! The colours repeat, over and over. Every flag you find gets pegged on.' },
  { id: 'toys', label: 'A long train', emoji: '🚂', kind: 'car', noun: 'train car', thing: 'train',
    connector: 'track', line: 0.9, src: '/assets/objects/pat_car.png',
    bg: '/assets/backgrounds/train_station.png', grad: 'linear-gradient(#dff0ff 0%, #eef6ff 52%, #d7e3ec 100%)',
    intro: 'Milo is building ONE long train! The colours repeat, over and over. Every car you find gets hooked on.' },
]
const makeById = (id: string) => MAKES.find(m => m.id === id)
const PICK = MAKES.map(m => ({ id: m.id, label: m.label, emoji: m.emoji, bgImage: m.bg }))
const NO_SHADOW = new Set<ItemKind>(['flag'])   // hangs, so it never touches anything
const TOP_ALIGN = new Set<ItemKind>(['flag'])

// ─── Round shape ─────────────────────────────────────────────────────────────────────
interface PatternRound {
  unit: BeadColor[]
  /** Items Milo strings himself before the question — non-empty only when a NEW pattern starts. */
  seed: BeadColor[]
  answer: BeadColor
  choices: BeadColor[]
  answerIdx: number
  /** Strand length when this was generated. Only there to make every round's signature unique. */
  at: number
}

/** What `make` needs to know about the string so far. Held in a ref — see the orchestrator. */
interface StrandState { strand: BeadColor[]; runStart: number; unit: BeadColor[] }

function makePatternRound(s: StrandState, d: Difficulty, round: number): PatternRound {
  const len = patternUnitLen(d)
  const sameUnit = s.unit.length === len
  const unit = sameUnit ? s.unit
    : Array.from({ length: len }, (_, i) => BEAD_ORDER[((round * 3) + i) % BEAD_ORDER.length])
  // A new pattern opens with a full repeat and one item over, so there is always enough on the
  // string to READ a repeat from rather than guess at.
  const seed = sameUnit ? [] : Array.from({ length: len + 1 }, (_, i) => unit[i % len])
  const runLen = (sameUnit ? s.strand.length - s.runStart : 0) + seed.length
  const answer = unit[runLen % len]
  // The choices ARE the pattern's own colours, so the child must read the run rather than spot the
  // odd one out. A two-colour unit gets one extra so a coin-flip is never enough.
  const pool = unit.length >= 3 ? [...unit] : [...unit, BEAD_ORDER[(BEAD_ORDER.indexOf(unit[0]) + len + 1) % BEAD_ORDER.length]]
  const choices = shuffle(pool)
  return { unit, seed, answer, choices, answerIdx: choices.indexOf(answer), at: s.strand.length }
}

// ─── Backdrop ────────────────────────────────────────────────────────────────────────
function Background({ make }: { make: Make }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff3e2' }}>
      <div style={{ position: 'absolute', inset: 0, background: make.grad }} />
      <img src={make.bg} alt="" draggable={false} decoding="async"
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  )
}

// ─── One item ────────────────────────────────────────────────────────────────────────
// The grayscale sprite is tinted to the exact hex: a solid fill shaped by the sprite's alpha, with
// the grayscale art multiplied back on top so its shading darkens the colour without shifting the
// hue. Falls back to a code-drawn shape until (or unless) the art loads.
const _loaded: Record<string, boolean> = {}
function usePainted(src: string): boolean {
  const [, force] = useState(0)
  useEffect(() => {
    if (src in _loaded) return
    const img = new Image()
    img.onload = () => { _loaded[src] = true; force(n => n + 1) }
    img.onerror = () => { _loaded[src] = false; force(n => n + 1) }
    img.src = src
  }, [src])
  return _loaded[src] ?? false
}

type ItemState = 'idle' | 'glow' | 'wrong' | 'pop'
function Item({ make, color, size, state = 'idle', shadow = true, dim }: {
  make: Make; color: BeadColor; size: number; state?: ItemState; shadow?: boolean; dim?: boolean
}) {
  const { hex, deep } = BEADS[color]
  const kind = make.kind
  const lit = state === 'glow'
  const H = size * 1.18
  const painted = usePainted(make.src)
  const pos = TOP_ALIGN.has(kind) ? 'top' : 'center'
  const tintH = kind === 'flag' ? size * 1.08 : size
  const anim = state === 'wrong' ? 'bs_shake .42s ease' : state === 'pop' || lit ? 'bs_pop .45s ease' : undefined
  const glow = 'drop-shadow(0 0 12px var(--garden-green)) drop-shadow(0 0 7px var(--garden-green))'
  const mask = {
    WebkitMaskImage: `url(${make.src})`, maskImage: `url(${make.src})`,
    WebkitMaskSize: 'contain', maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    WebkitMaskPosition: pos, maskPosition: pos,
  } as const
  return (
    <div style={{ position: 'relative', width: size, height: H, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', opacity: dim ? 0.45 : 1 }}>
      {shadow && !NO_SHADOW.has(kind) && (
        <div aria-hidden style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
          width: size * 0.8, height: size * 0.24, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(38,28,18,.22) 0%, rgba(38,28,18,0) 72%)' }} />
      )}
      {painted ? (
        <div style={{ width: size, height: tintH, position: 'relative', isolation: 'isolate', animation: anim,
          filter: lit ? glow : 'drop-shadow(0 3px 4px rgba(0,0,0,.28))' }}>
          <div style={{ position: 'absolute', inset: 0, background: hex, ...mask }} />
          <img src={make.src} alt="" draggable={false} decoding="async" loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: pos, mixBlendMode: 'multiply' }} />
        </div>
      ) : kind === 'flag' ? (
        <div style={{ width: size, height: size * 1.08, position: 'relative', animation: anim,
          filter: lit ? glow : 'drop-shadow(0 3px 4px rgba(0,0,0,.28))' }}>
          <div style={{ position: 'absolute', left: 0, top: size * 0.12, width: size, height: size * 0.9,
            background: `linear-gradient(160deg, rgba(255,255,255,.55), ${hex} 38%, ${deep} 100%)`, clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
        </div>
      ) : kind === 'car' ? (
        <div style={{ width: size, height: size, position: 'relative', animation: anim, filter: lit ? glow : undefined }}>
          <div style={{ position: 'absolute', left: size * 0.06, top: size * 0.12, width: size * 0.88, height: size * 0.58, borderRadius: size * 0.16,
            background: `linear-gradient(#ffffff22, ${hex} 30%, ${deep} 100%)`, border: `${Math.max(1.5, size * 0.03)}px solid ${deep}` }} />
          <div style={{ position: 'absolute', left: size * 0.2, top: size * 0.66, width: size * 0.2, height: size * 0.2, borderRadius: '50%', background: '#3a3a3a' }} />
          <div style={{ position: 'absolute', left: size * 0.58, top: size * 0.66, width: size * 0.2, height: size * 0.2, borderRadius: '50%', background: '#3a3a3a' }} />
        </div>
      ) : (
        <div style={{ width: size, height: size, borderRadius: '50%', animation: anim,
          background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,.85), ${hex} 46%, ${deep} 100%)`,
          border: `${Math.max(1.5, size * 0.03)}px solid ${deep}`,
          boxShadow: lit ? '0 0 16px var(--garden-green), 0 0 9px var(--garden-green)' : '0 3px 5px rgba(0,0,0,.28), inset 0 -2px 4px rgba(0,0,0,.18)' }} />
      )}
    </div>
  )
}

function EmptySlot({ kind, box }: { kind: ItemKind; box: number }) {
  const dash = `${Math.max(2, box * 0.05)}px dashed var(--milo-orange)`
  if (kind === 'flag') return <div style={{ width: box, height: box * 0.9, marginTop: box * 0.12, background: 'rgba(255,255,255,.32)', border: dash, clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
  if (kind === 'car') return <div style={{ width: box * 0.88, height: box * 0.58, marginTop: box * 0.16, borderRadius: box * 0.16, border: dash, background: 'rgba(255,255,255,.32)' }} />
  return <div style={{ width: box, height: box, borderRadius: '50%', border: dash, background: 'rgba(255,255,255,.35)' }} />
}

// ─── The strand — the one thing being made ───────────────────────────────────────────
/**
 * Read left to right: the TAIL (everything before the current pattern, shrunk and dimmed so the
 * string is visibly long without competing with the run being read) · the JOINT that marks where
 * the current pattern begins · the RUN itself, full size · the empty place at the end.
 *
 * Both ends are capped so the row cannot outgrow the screen as the chapter goes on, and the whole
 * thing sits in a FitBox, so on a short landscape frame it scales rather than overflowing.
 */
const TAIL_MAX = 6
const NOMINAL = 54          // design size; FitBox scales the row to whatever the frame allows
function Strand({ make, tail, run, slotRef }: {
  make: Make; tail: BeadColor[]; run: BeadColor[]; slotRef: React.RefObject<HTMLDivElement | null>
}) {
  // Show at most a couple of repeats plus the odd one, so a long run stays readable and bounded —
  // and everything that falls off the front joins the TAIL rather than vanishing, because the tail
  // is the only thing that shows the string getting longer.
  const win = make.connector === 'track' ? 5 : 7
  const shownRun = run.slice(-win)
  const behind = [...tail, ...run.slice(0, Math.max(0, run.length - win))]
  const shownTail = behind.slice(-TAIL_MAX)
  const gap = Math.max(4, NOMINAL * 0.18)
  const lineTop = NOMINAL * make.line
  const cord = make.connector === 'cord' ? 'linear-gradient(#9c7b51,#7d5f3a)'
    : make.connector === 'track' ? 'linear-gradient(#b8bcc2,#8d9298)'
    : 'linear-gradient(#caa46a,#a07c44)'
  const cordH = make.connector === 'track' ? Math.max(4, NOMINAL * 0.1) : Math.max(3, NOMINAL * 0.06)
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap, padding: `0 ${NOMINAL * 0.4}px` }}>
      {/* The cord runs behind everything, and past both ends — it is one continuous string. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: lineTop, height: cordH, transform: 'translateY(-50%)', background: cord, borderRadius: 99, zIndex: 0 }} />
      {shownTail.map((c, i) => (
        <div key={`t${i}`} style={{ zIndex: 1, flexShrink: 0, marginTop: lineTop - NOMINAL * 0.5 * make.line }}>
          <Item make={make} color={c} size={NOMINAL * 0.5} shadow={false} dim />
        </div>
      ))}
      {tail.length > 0 && run.length <= win && (
        // The joint marks where the CURRENT pattern begins, so it is drawn only when the run start
        // is actually on screen. Once a long run has pushed its own front into the tail, everything
        // visible is one pattern and a marker would be pointing at nothing.
        <div aria-hidden style={{ zIndex: 1, flexShrink: 0, width: NOMINAL * 0.3, height: NOMINAL * 0.3, borderRadius: 5,
          marginTop: lineTop - NOMINAL * 0.15, background: 'radial-gradient(circle at 35% 30%, #fff8, #d9b25e 50%, #a87f2f)', border: '1.5px solid #8a6724' }} />
      )}
      {shownRun.map((c, i) => (
        <div key={`r${i}`} style={{ zIndex: 1, flexShrink: 0 }}><Item make={make} color={c} size={NOMINAL} /></div>
      ))}
      {/* The empty place. When the flying item lands, the strand simply gets one longer and a fresh
          empty place appears after it — there is no separate "filled" state to keep in step. */}
      <div ref={slotRef} style={{ zIndex: 1, flexShrink: 0, width: NOMINAL, height: NOMINAL * 1.18, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <EmptySlot kind={make.kind} box={NOMINAL} />
      </div>
    </div>
  )
}

// ─── The tray (the tappable choices) ─────────────────────────────────────────────────
const TRAY_YJIT: Record<number, number[]> = { 2: [2, -2], 3: [3, -2, 4], 4: [4, -2, 1, 5] }
function Tray({ make, choices, stateFor, onTap, trayRef }: {
  make: Make; choices: BeadColor[]
  stateFor: (i: number) => ItemState; onTap?: (i: number, el: HTMLElement) => void
  trayRef?: React.RefObject<HTMLDivElement | null>
}) {
  // Measured here rather than passed in, so a resize can never reach the memoized round data.
  const { w: vw, h: vh } = useViewport()
  const short = vh < SHORT_H
  const box = Math.round(Math.max(44, Math.min(vw * 0.13, vh * 0.26, 92)))
  const yjit = TRAY_YJIT[choices.length] ?? choices.map(() => 0)
  return (
    // The band is OWNED here, not applied by the caller. In the scored rounds `SkillBeat` renders
    // the play surface in its own flow under the prompt, so a tray positioned at the call site sat
    // correctly in the demo and then landed on top of the strand in practice.
    <div style={{ position: 'fixed', top: short ? '76%' : '72%', left: 0, right: 0, transform: 'translateY(-50%)',
      zIndex: 42, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
    <div ref={trayRef} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'clamp(12px,3vw,30px)',
      background: 'rgba(255,255,255,.5)', borderRadius: 26, padding: 'clamp(10px,2vh,18px) clamp(14px,3vw,28px)',
      border: '3px solid rgba(140,110,70,.5)', boxShadow: '0 5px 0 rgba(61,37,22,.1)' }}>
      {choices.map((c, i) => (
        <button key={i} onClick={onTap ? e => onTap(i, e.currentTarget) : undefined} disabled={!onTap}
          aria-label={`${BEADS[c].label} ${make.noun}`}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: onTap ? 'pointer' : 'default', lineHeight: 0,
            marginTop: yjit[i] ?? 0, opacity: stateFor(i) === 'pop' ? 0 : 1, transition: 'opacity .15s',
            transform: stateFor(i) === 'glow' ? 'scale(1.12)' : 'scale(1)' }}>
          <Item make={make} color={c} size={box} state={stateFor(i)} />
        </button>
      ))}
    </div>
    </div>
  )
}

// ─── Milo ────────────────────────────────────────────────────────────────────────────
function MiloBead({ make }: { make: Make }) {
  const [step, setStep] = useState(0)
  const { h: vh } = useViewport()
  const srcs = ['/assets/characters/milo_beads.png', '/assets/characters/milo_idle.png']
  const dim = vh < SHORT_H ? 'min(24vh, 118px)' : 'min(28vh, 230px)'
  return (
    <div style={{ position: 'fixed', left: '9%', bottom: 0, transform: 'translateX(-50%)', zIndex: 26, width: dim, height: dim }}>
      <div style={{ width: '100%', height: '100%', animation: 'bs_float 3.4s ease-in-out infinite' }}>
        {step >= srcs.length
          ? <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: 88, filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }}>🐴</span>
              <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 38 }}>{make.emoji}</span>
            </div>
          : <img src={srcs[step]} alt="Milo" draggable={false} decoding="async" loading="lazy" onError={() => setStep(s => s + 1)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.35))' }} />}
      </div>
    </div>
  )
}

// ─── Threading: the tap causes the journey, and the journey is the answer ────────────
// Returns how long the flight takes, so the round can end when the item LANDS rather than after a
// fixed delay that drifts out of step with it.
type Thread = (from: HTMLElement, color: BeadColor) => number

// ─── Round copy ──────────────────────────────────────────────────────────────────────
const promptFor = () => 'What comes next?'
/** The chant. A pattern at this age is a rhythm as much as a picture, so Milo says it out loud. */
const sayFor = (make: Make) => (d: PatternRound) => {
  const chant = d.unit.map(c => BEADS[c].label).join(', ')
  return `${chant}, ${chant}… what ${make.noun} comes next? Tap it!`
}

// ─── Play (guided + scored) ──────────────────────────────────────────────────────────
type Mode = 'guided' | 'practice'
const BeadsPlay: React.FC<{ data: PatternRound; make: Make; mode: Mode; thread: Thread; onComplete: (correct: boolean) => void }> = ({ data, make, mode, thread, onComplete }) => {
  const { choices, answer, answerIdx } = data
  const [taken, setTaken] = useState<number | null>(null)
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)
  const erred = useRef(false), done = useRef(false), tapLock = useRef(false)

  useEffect(() => {
    if (mode === 'guided') speak(`Now you! What ${make.noun} comes next? Tap it!`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tap(i: number, el: HTMLElement) {
    if (done.current || tapLock.current) return
    tapLock.current = true
    window.setTimeout(() => { tapLock.current = false }, TAP_LOCK_MS)
    if (i !== answerIdx) {
      erred.current = true
      setWrongIdx(i)
      speak(`That one is ${BEADS[choices[i]].label}. Look at the pattern again — what comes next?`)
      window.setTimeout(() => setWrongIdx(w => (w === i ? null : w)), 600)
      return
    }
    done.current = true
    setTaken(i)
    // The item leaves the tray and travels to the empty place; the round ends when it lands there.
    const ms = thread(el, answer)
    if (mode === 'guided') speak(`Yes! The ${BEADS[answer].label} one!`)
    window.setTimeout(() => onComplete(mode === 'practice' ? !erred.current : true), ms + 260)
  }

  return <Tray make={make} choices={choices} onTap={tap}
    stateFor={i => (taken === i ? 'pop' : wrongIdx === i ? 'wrong' : 'idle')} />
}

// ─── Milo shows how (opening demo + the 3-wrong re-teach) ────────────────────────────
/**
 * Milo reads the pattern aloud and points at what comes next.
 *
 * `place` is the whole subtlety, and getting it wrong put a DUPLICATE on the string. The opening
 * demo must thread its item — it is what starts the pattern off. A re-teach must NOT, because
 * `SkillBeat` only re-teaches AFTER a round was submitted, and a round is submitted when the child
 * finally gets it right — so that item is already on the string. Threading it again appends a
 * second copy and the repeat breaks: caught by reading the strand back as `RBRBBB|RBBBRBR`.
 */
const BeadsExplain: React.FC<{ data: PatternRound; make: Make; thread: Thread; place: boolean; onDone: () => void }> = ({ data, make, thread, place, onDone }) => {
  const { unit, answer, answerIdx } = data
  const [taken, setTaken] = useState<number | null>(null)
  const [glow, setGlow] = useState(false)
  const trayRef = useRef<HTMLDivElement | null>(null)
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return; ran.current = true
    const chant = unit.map(c => BEADS[c].label).join(', ')
    const cancel = speakSteps([
      `Look at the pattern. It goes ${chant}, ${chant}, over and over.`,
      `So the next ${make.noun} is ${BEADS[answer].label}. Watch it go on!`,
    ], {
      onStep: i => {
        if (i !== 1) return
        setTaken(place ? answerIdx : null)
        setGlow(true)
        const el = trayRef.current?.querySelectorAll('button')[answerIdx]
        if (el && place) thread(el as HTMLElement, answer)
      },
      onDone: () => window.setTimeout(onDone, 1400),
    })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <Tray make={make} choices={data.choices} trayRef={trayRef}
    stateFor={i => (taken === i ? 'pop' : glow && i === answerIdx ? 'glow' : 'idle')} />
}

// ─── Orchestrator ────────────────────────────────────────────────────────────────────
const BS_CSS = `
@keyframes bs_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes bs_pop { 0%{transform:scale(.3);opacity:.4} 55%{transform:scale(1.18);opacity:1} 100%{transform:scale(1)} }
@keyframes bs_shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px) rotate(-3deg)} 75%{transform:translateX(6px) rotate(3deg)} }
`

interface Flight { color: BeadColor; size: number; ms: number; from: { x: number; y: number }; to: { x: number; y: number; scale: number }; go: boolean }

type Phase = 'intro' | 'demo' | 'guided' | 'practice'
export default function BeadShop({ world: forcedId, onFinish, onExit }: {
  world?: string
  onFinish?: (correct: number, wrong: number, mastered?: boolean) => void
  onExit?: () => void
}) {
  const router = useRouter()
  const needsRotate = useNeedsRotate()
  const { w: vw, h: vh } = useViewport()
  const short = vh < SHORT_H
  const [make, setMake] = useState<Make | null>(() => (forcedId ? makeById(forcedId) ?? null : null))
  const [phase, setPhase] = useState<Phase>('intro')

  /**
   * The one string. It lives HERE, not inside SkillBeat, which rebuilds its contents every round —
   * anything mounted in there resets with them, so a thing that is supposed to grow across the
   * chapter can never grow at all. That is the lesson chapter 4 shipped and this chapter missed.
   */
  const [strand, setStrand] = useState<BeadColor[]>([])
  const [runStart, setRunStart] = useState(0)
  const [unit, setUnit] = useState<BeadColor[]>([])
  // `make` runs inside SkillBeat's useMemo, so it reads the string through a ref rather than props.
  const sRef = useRef<StrandState>({ strand: [], runStart: 0, unit: [] })
  sRef.current = { strand, runStart, unit }

  const [flight, setFlight] = useState<Flight | null>(null)
  const slotRef = useRef<HTMLDivElement | null>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const result = useRef({ correct: 0, wrong: 0 })
  const finished = useRef(false)
  const exit = useCallback(() => { stopSpeech(); (onExit ?? (() => router.push('/menu')))() }, [router, onExit])
  const finishChapter = useCallback((c: number, w: number, mastered?: boolean) => {
    if (finished.current) return; finished.current = true
    stopSpeech()
    if (onFinish) onFinish(c, w, mastered); else exit()
  }, [onFinish, exit])

  /** A new pattern begins: Milo's opening items go on the string and the joint moves behind them. */
  // The new run starts where the string currently ends, read off the ref rather than from inside the
  // strand updater — an updater has to stay pure, and React calls it twice in development.
  const openRun = useCallback((u: BeadColor[], seed: BeadColor[]) => {
    setUnit(u)
    setRunStart(sRef.current.strand.length)
    setStrand(s => [...s, ...seed])
  }, [])

  /**
   * The flight. Both ends are MEASURED — the empty place because only the strand knows where the row
   * put it, the item because only the tray knows where it sits. The duration comes from the
   * distance, so a longer reach takes longer instead of every item teleporting identically.
   */
  const thread = useCallback<Thread>((fromEl, color) => {
    const add = () => setStrand(s => [...s, color])
    const to = slotRef.current?.getBoundingClientRect()
    const from = fromEl.getBoundingClientRect()
    if (!to) { add(); return 0 }   // never leave the string one short if the slot is not mounted
    const a = { x: from.x + from.width / 2, y: from.y + from.height / 2 }
    const b = { x: to.x + to.width / 2, y: to.y + to.height / 2 }
    const ms = Math.round(Math.max(620, Math.min(Math.hypot(b.x - a.x, b.y - a.y) * 1.35, 1150)))
    setFlight({ color, size: from.width, ms, from: a, go: false, to: { ...b, scale: to.width / Math.max(1, from.width) } })
    // Two frames, so the start position is committed before the transition target replaces it.
    requestAnimationFrame(() => requestAnimationFrame(() => setFlight(f => (f ? { ...f, go: true } : f))))
    timers.current.push(window.setTimeout(() => { add(); setFlight(null) }, ms + 40))
    return ms
  }, [])

  const interlude = useCallback(() => new Promise<void>(res => window.setTimeout(res, 850)), [])

  // Deliberately does NOT depend on any size: SkillBeat memoizes the round on `[roundIdx, beat]`, so
  // a beat that changes on resize regenerates the question under the child mid-round. The tray
  // measures itself instead.
  const beat = useMemo<Beat<PatternRound> | null>(() => make && ({
    skillId: 'patterns', rounds: 10, reteachAfter: 3, walkEvery: 4,
    make: (d, round = 0) => makePatternRound(sRef.current, (d || 1) as Difficulty, round),
    // `at` is the strand length, so every round has a distinct signature and makeDistinct — which
    // would otherwise re-roll a generator that reads state and returns the same thing — never spins.
    sig: d => `${d.unit.join(',')}|${d.at}`,
    prompt: promptFor,
    say: sayFor(make),
    Play: ({ data, onSubmit }) => <BeadsPlay data={data} make={make} mode="practice" thread={thread} onComplete={onSubmit} />,
    // place=false: this round's item is already on the string (a re-teach only runs after the round
    // was submitted, and it is submitted when the child finally gets it right).
    Reteach: ({ data, onDone }) => <BeadsExplain data={data} make={make} thread={thread} place={false} onDone={onDone} />,
  }), [make, thread])

  // Landscape-first, like the rest of the 3–5 set: the strand runs wide and has nowhere to go in a
  // portrait column. Sits BELOW every hook — an early return above one makes turning the phone
  // change the hook count, which tore chapter 2 into the error boundary.
  if (needsRotate) return <RotateGate line="The Bead Shop plays in landscape! 📿" />

  if (!make || !beat) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <WorldSelect title="What shall we make today?" worlds={PICK} onPick={id => { const m = makeById(id); if (m) setMake(m) }} onExit={exit} />
      </div>
    )
  }

  // The demo opens the chapter's first pattern; the guided round continues that same one, because
  // there is only ever one string.
  const DEMO: PatternRound = (() => {
    const u: BeadColor[] = ['red', 'blue']
    const seed: BeadColor[] = ['red', 'blue', 'red', 'blue', 'red']
    const choices = ['blue', 'red', 'green'] as BeadColor[]
    return { unit: u, seed, answer: 'blue', choices, answerIdx: 0, at: 0 }
  })()
  const guidedAnswer = unit.length ? unit[(strand.length - runStart) % unit.length] : 'red'
  const GUIDED: PatternRound = { unit: unit.length ? unit : ['red', 'blue'], seed: [], answer: guidedAnswer,
    choices: ['blue', 'red', 'green'] as BeadColor[], answerIdx: (['blue', 'red', 'green'] as BeadColor[]).indexOf(guidedAnswer), at: strand.length }

  const tail = strand.slice(0, runStart)
  const run = strand.slice(runStart)

  const Banner = (text: string) => (
    <div style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{ background: 'var(--paper)', border: '3px solid var(--milo-orange)', borderRadius: 999, padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--milo-orange)', boxShadow: '0 4px 0 rgba(242,107,44,.25)', textAlign: 'center' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{BS_CSS}</style>
      <Background make={make} />

      <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 50 }}>
        <button onClick={exit} style={{ padding: '7px 14px', borderRadius: 50, background: 'var(--paper)', border: '3px solid var(--milo-orange)', color: 'var(--milo-orange)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>← Menu</button>
      </div>

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ maxWidth: '74%', background: '#fff', border: '3px solid var(--outline)', borderRadius: 18, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', textAlign: 'center', boxShadow: '0 4px 0 rgba(61,37,22,.1)' }}>
            {make.intro}
          </div>
          <button onClick={() => { unlockSpeech(); openRun(DEMO.unit, DEMO.seed); setPhase('demo') }}
            style={{ padding: '14px 38px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--milo-orange),var(--milo-orange-deep))', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, boxShadow: '0 6px 16px rgba(242,107,44,.4)' }}>Let&apos;s make it! ▶</button>
        </div>
      )}

      {/* The strand is on screen from the demo onward and never rebuilt — it only ever gets longer. */}
      {phase !== 'intro' && (
        <>
          {/* 41% on a short frame, and it is a MEASUREMENT: the prompt pill bottoms out at 93px on a
              320-tall screen, and the strand's own half-height is at most half of `availH` (32px),
              so anything above 41% puts the top of the string behind the question. */}
          <div style={{ position: 'fixed', top: short ? '41%' : '40%', left: 0, right: 0, transform: 'translateY(-50%)', zIndex: 40, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
            <FitBox availW={vw * 0.94} availH={short ? vh * 0.2 : vh * 0.28} max={2.2}>
              <Strand make={make} tail={tail} run={run} slotRef={slotRef} />
            </FitBox>
          </div>
          <MiloBead make={make} />
        </>
      )}

      {phase === 'demo' && (<>{Banner('Watch Milo read the pattern')}
        <BeadsExplain data={DEMO} make={make} thread={thread} place onDone={() => setPhase('guided')} /></>)}

      {phase === 'guided' && (<>{Banner(`Now you! Tap the ${make.noun} that comes next`)}
        <BeadsPlay key="guided" data={GUIDED} make={make} mode="guided" thread={thread}
          onComplete={() => setPhase('practice')} /></>)}

      {phase === 'practice' && (
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 45, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
          <SkillBeat beat={beat} onInterlude={interlude}
            // A round that opens a NEW pattern brings Milo's starter items with it; they go onto
            // the same string, and the joint moves in behind them.
            onRound={(data: PatternRound) => { if (data.seed.length) openRun(data.unit, data.seed) }}
            onComplete={(c, w, mastered) => { result.current.correct += c; result.current.wrong += w; finishChapter(result.current.correct, result.current.wrong, mastered) }} />
        </div>
      )}

      {/* The item in flight: positioned by its CENTRE and scaled, so one fixed-size sprite travels
          from the tray to the empty place instead of being re-rendered at a new size every frame. */}
      {flight && (
        <div aria-hidden style={{ position: 'fixed', zIndex: 55, pointerEvents: 'none', lineHeight: 0,
          width: flight.size, height: flight.size,
          left: flight.go ? flight.to.x : flight.from.x,
          top: flight.go ? flight.to.y : flight.from.y,
          transform: `translate(-50%,-50%) scale(${flight.go ? flight.to.scale : 1})`,
          transition: `left ${flight.ms}ms cubic-bezier(.34,.85,.35,1), top ${flight.ms}ms cubic-bezier(.34,.85,.35,1), transform ${flight.ms}ms cubic-bezier(.34,.85,.35,1)`,
          filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.3))' }}>
          <Item make={make} color={flight.color} size={flight.size} shadow={false} />
        </div>
      )}
    </div>
  )
}
