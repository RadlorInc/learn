'use client'
/**
 * WalkHome — the Complex Numbers chapter (17–18) as a PLAYABLE GAME.
 *
 * World: THE WALK HOME. A grid of streets. A complex number is a walk — the first
 * number is blocks EAST, the second is blocks NORTH, and a minus is simply the
 * other way. That one mapping buys the whole chapter:
 *   • adding two complex numbers  = walking one leg, then the next
 *   • multiplying by i            = turning LEFT at the corner (a quarter turn)
 *   • the modulus |a + bi|        = how far you are from the start, as the crow flies
 *   • the conjugate               = the mirror walk, same east, opposite north
 *
 * ⚠️ WHY THIS CHAPTER HAS ALMOST NO TAP-A-CARD ANSWERS. The old Field Lab version
 * answered all eight questions on a ChoiceGrid, and every one of its answers was a
 * STRING — "3 + 2i", "−i", "5". But a complex number is not symbolic, it is two
 * integers in a template, so it can be BUILT rather than picked. Every question
 * here is produced: the walk on two sliders, the heading on a compass, the modulus
 * on the pad. Nothing is chosen from a list. (docs/teen-17-18-gameshell-plan.md §3)
 *
 * THREE ways to answer, gated PER QUESTION (never per chapter):
 *   • BUILD  → the WALK PAD: set blocks east + blocks north, then lock it in.
 *              Adding, subtracting, multiplying and the conjugate all land here,
 *              because all four produce a complex number.
 *   • TURN   → the COMPASS: powers of i. Start facing east, turn left n times.
 *              This is the gesture that makes i⁴ = 1 obvious instead of memorised.
 *   • TAP    → AnswerPad, for the modulus alone — the one answer that really is a
 *              single number. Its distractors are the real misconceptions
 *              (adding the two legs instead of using Pythagoras, off-by-one).
 *
 * ⚠️ The MAP is drawn only where the answer really is a position you walked to —
 * adding legs, and the mirror walk. A product is a point on the plane but it is
 * NOT a journey, so drawing a route to it would be a lie; that question shows the
 * builder and the expression, no map. (plan §5.1, seam 2.)
 *
 * The 15–16 shape: overview read-along + a code-drawn scene → a TWO-example
 * baby-step walkthrough (the walk, then the turn) → scored play. No guided round:
 * both graded gestures are worked in the walkthrough. Scene is code-drawn, no assets.
 *
 * The math mirrors the old ComplexNumbersTeenLesson.makeRound (same L1/L2/L3 ramp),
 * rewritten as STRUCTURED generators that expose the built answer instead of a
 * string. Two deliberate narrowings are marked ⚠️ below.
 */
import { useState, type ReactElement } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SlideValue, CommitBtn, Nudge, numChoices } from './parts/gameKit'
import { rint, pick } from '@/core/rand'
import { disp } from '@/core/fmt'

const P: Palette = {
  nightTop: '#1b1b3a', nightBot: '#0b0b1c',
  cream: '#f0eef8', creamSoft: 'rgba(240,238,248,0.82)',
  inkOnPaper: '#1b1b3a', mutedOnPaper: '#7b7a99',
  gold: '#ffd166', goldDeep: '#d19a1e',
  coral: '#ff8fa3', coralDeep: '#e05a76', mint: '#6ee7b7',
  glass: 'rgba(30,30,64,0.6)', glassBorder: 'rgba(240,238,248,0.2)',
}

/** Spoken integer: "negative four". */
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)

/** Format a complex number a + bi with true minus glyphs. e.g. "3 − 5i", "−2i", "4". */
function fmtComplex(a: number, b: number): string {
  if (b === 0) return disp(a)
  const iPart = b === 1 ? 'i' : b === -1 ? '−i' : `${disp(b)}i`
  if (a === 0) return iPart
  return `${disp(a)} ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? 'i' : `${Math.abs(b)}i`}`
}

/** Spoken complex number. */
function spokenComplex(a: number, b: number): string {
  if (b === 0) return spoken(a)
  const iWord = (n: number) => (Math.abs(n) === 1 ? 'i' : `${Math.abs(n)} i`)
  if (a === 0) return `${b < 0 ? 'negative ' : ''}${iWord(b)}`
  return `${spoken(a)} ${b < 0 ? 'minus' : 'plus'} ${iWord(b)}`
}

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
const supers = (n: number) => String(n).split('').map((c) => SUP[c] ?? c).join('')

/** Headings, as both a direction and the power of i that lands there.
 *  Facing east is 1 (i⁰); every LEFT turn multiplies by i. */
type Head = 0 | 1 | 2 | 3
const HEAD_VAL = ['1', 'i', '−1', '−i']
const HEAD_DIR = ['east', 'north', 'west', 'south']

// The answer is a WALK (two integers), a single NUMBER (the modulus, tapped on the
// pad), or a HEADING (the compass).
type V = { k: 'walk'; a: number; b: number } | { k: 'num'; n: number } | { k: 'turn'; q: Head }

interface Task extends BaseTask {
  kind: 'combine' | 'mult' | 'conj' | 'mod' | 'power'
  /** walk answers (combine · mult · conj) */
  ra?: number; rb?: number
  /** slider range for the walk pad — wide enough for every answer the generator draws */
  lo?: number; hi?: number
  /** draw the street map behind the builder? Only where the answer IS a place you walked to. */
  map?: boolean
  /** modulus — the single-number answer, and the misconception values behind its distractors */
  n?: number; pad?: number[]
  /** powers of i */
  q?: Head; turns?: number
}

// ── L1 · adding and subtracting legs of the walk ──────────────────────────────
function combineTask(): Task {
  const a1 = rint(-4, 6), b1 = rint(-4, 6)
  const a2 = rint(-4, 6), b2 = rint(-4, 6)
  const sub = Math.random() < 0.5
  const op = sub ? '−' : '+'
  const ra = sub ? a1 - a2 : a1 + a2
  const rb = sub ? b1 - b2 : b1 + b2
  return {
    kind: 'combine', title: sub ? 'Undo a leg' : 'Two legs', tone: 'a',
    badge: `(${fmtComplex(a1, b1)}) ${op} (${fmtComplex(a2, b2)})`,
    prompt: `Where do you finish?`,
    // Must hold for EVERY seed: all four numbers are independently signed, so this
    // cannot claim any particular direction — only what a minus MEANS.
    context: sub
      ? 'You walk the first leg, then walk the second one backwards. Taking a leg away flips it: east becomes west, north becomes south.'
      : 'Two legs of the walk home, one after the other. In each leg the first number is blocks east and the second is blocks north — a minus just means the other way.',
    instruction: 'Set where you finish, then lock it in.',
    say: `${spokenComplex(a1, b1)}, ${sub ? 'minus' : 'plus'}, ${spokenComplex(a2, b2)}. Where do you finish?`,
    work: [
      'Keep the two directions apart — east never mixes with north.',
      `East: ${disp(a1)} ${op} ${disp(a2)} = ${disp(ra)}. North: ${disp(b1)} ${op} ${disp(b2)} = ${disp(rb)}.`,
      `So you finish at ${fmtComplex(ra, rb)}.`,
    ],
    ra, rb, lo: -12, hi: 12, map: true,
  }
}

// ── L2 / L3 · multiplying ─────────────────────────────────────────────────────
/** ⚠️ NO MAP HERE, deliberately. A product lands on the plane but you did not walk
 *  to it, and drawing a route would be a picture of something that never happened.
 *  The world still does the load-bearing work: i² = −1 is two left turns, which the
 *  walkthrough has already shown on the compass. */
function multTask(hard: boolean): Task {
  // ⚠️ L3 factors narrowed from the old lesson's ±(1..4) to ±(1..3). The answer is
  // BUILT on a slider now, not picked off a list, so a rb of 32 would be a slider
  // the child has to drag halfway across the board. The sign structure — one factor
  // with a negative imaginary part, one with a negative real part, which is what L3
  // is actually testing — is unchanged.
  const a1 = hard ? rint(1, 3) : rint(1, 3)
  const b1 = hard ? -rint(1, 3) : rint(1, 3)
  const a2 = hard ? -rint(1, 3) : rint(1, 3)
  const b2 = hard ? rint(1, 3) : rint(1, 3)
  const ra = a1 * a2 - b1 * b2
  const rb = a1 * b2 + a2 * b1
  return {
    kind: 'mult', title: 'Multiply it out', tone: 'b',
    badge: `(${fmtComplex(a1, b1)})(${fmtComplex(a2, b2)})`,
    prompt: 'What is the product?',
    // True for every seed: it describes the METHOD and the one fact it turns on,
    // and makes no claim about the signs of the parts.
    context: 'Multiplying is not a walk. Expand it like brackets — and when two i terms meet, remember that i² is −1, because two left turns from east leaves you facing west.',
    instruction: 'Build the product, then lock it in.',
    say: `${spokenComplex(a1, b1)}, times, ${spokenComplex(a2, b2)}.`,
    work: [
      'Expand all four products, the same as any pair of brackets.',
      `The two i terms multiply to ${disp(b1 * b2)}i², and i² is −1, so that turns into ${disp(-b1 * b2)}.`,
      `Real part ${disp(a1)}·${disp(a2)} − ${disp(b1)}·${disp(b2)} = ${disp(ra)}; imaginary part ${disp(a1)}·${disp(b2)} + ${disp(a2)}·${disp(b1)} = ${disp(rb)}. So ${fmtComplex(ra, rb)}.`,
    ],
    ra, rb, lo: -20, hi: 20, map: false,
  }
}

// ── L2 · the modulus — the one answer that really is a single number ──────────
/** ⚠️ The degenerate pairs (3,0) and (0,4) are gone. A "walk" with one leg of zero
 *  is not a walk, its modulus is just the leg back again, and the context sentence
 *  below would be false for it. Six genuine two-leg pairs × four sign combinations
 *  is 24 distinct questions, all with whole-number answers. */
const MOD_PAIRS: [number, number][] = [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5]]
function modTask(): Task {
  const [pa, pb] = pick(MOD_PAIRS)
  const a = Math.random() < 0.5 ? pa : -pa
  const b = Math.random() < 0.5 ? pb : -pb
  const n = Math.round(Math.sqrt(a * a + b * b))
  return {
    kind: 'mod', title: 'As the crow flies', tone: 'a',
    badge: `|${fmtComplex(a, b)}|`,
    prompt: 'How far from the start?',
    context: `Your walk went ${Math.abs(a)} blocks ${a < 0 ? 'west' : 'east'} and ${Math.abs(b)} blocks ${b < 0 ? 'south' : 'north'}. Straight through the middle, ignoring the streets, how far are you from where you started?`,
    padInstruction: 'Tap the straight-line distance.',
    say: `What is the modulus of ${spokenComplex(a, b)}?`,
    work: [
      'The two legs meet at a right angle, so the straight line back is the long side of a right triangle.',
      `That is the square root of ${a * a} plus ${b * b}, which is the square root of ${a * a + b * b}.`,
      `So the distance is ${n}.`,
    ],
    // The distractors are the real mistakes: walking the streets instead of cutting
    // across (|a| + |b|), and stopping at one leg.
    n, pad: [Math.abs(a) + Math.abs(b), Math.abs(a), Math.abs(b)],
  }
}

// ── L3 · the conjugate — the mirror walk ──────────────────────────────────────
function conjTask(): Task {
  const a = rint(-6, 6)
  let b = rint(-6, 6)
  if (b === 0) b = rint(1, 6)
  return {
    kind: 'conj', title: 'Mirror walk', tone: 'b',
    badge: fmtComplex(a, b),
    answerLabel: '→',
    prompt: 'What is the conjugate?',
    // True for every seed: `a` is untouched whatever its sign, and b ≠ 0 by construction.
    context: 'The conjugate is the mirror of a walk in the east–west street: you go exactly as far east or west as before, and the same distance the opposite way north or south.',
    instruction: 'Set the mirror walk, then lock it in.',
    say: `What is the conjugate of ${spokenComplex(a, b)}?`,
    work: [
      'Only the north–south part flips. The east–west part does not move.',
      `So ${fmtComplex(a, b)} mirrors to ${fmtComplex(a, -b)}.`,
    ],
    ra: a, rb: -b, lo: -8, hi: 8, map: true,
  }
}

// ── L1 / L3 · powers of i — turning left at the corner ────────────────────────
function powerTask(hard: boolean): Task {
  const n = hard ? rint(6, 23) : rint(2, 5)
  const q = ((n % 4) + 4) % 4 as Head
  return {
    kind: 'power', title: 'Turn left', tone: 'a',
    badge: `i${supers(n)}`,
    prompt: 'Which way are you facing?',
    context: 'You set off facing east, and every multiply by i turns you left one quarter turn at the corner. Four lefts brings you back to facing east, which is why the powers of i repeat.',
    instruction: 'Turn to the heading you end on.',
    say: `You start facing east and turn left ${n} times. Which way do you end up facing?`,
    work: [
      'Every multiply by i is one left turn, and four lefts is a full circle back to east.',
      `${n} left turns is ${Math.floor(n / 4)} full ${Math.floor(n / 4) === 1 ? 'circle' : 'circles'} plus ${n % 4} more.`,
      `So i${supers(n)} lands facing ${HEAD_DIR[q]} — that is ${HEAD_VAL[q]}.`,
    ],
    q, turns: n,
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return Math.random() < 0.5 ? powerTask(false) : combineTask()
  if (d === 2) return Math.random() < 0.5 ? multTask(false) : modTask()
  const roll = Math.random()
  if (roll < 0.34) return conjTask()
  if (roll < 0.67) return powerTask(true)
  return multTask(true)
}

// ══════════════════════════════════════════════════════════════════════════════
// The street map — a code-drawn grid the walk is read off. Origin is the START,
// the dot is where the child says they finish. `legs` is only ever passed by the
// walkthrough: in scored play the map must NOT draw the journey, or it would hand
// the answer over before the child commits it.
// ══════════════════════════════════════════════════════════════════════════════
const MAP = 250
const mx = (x: number, span: number) => MAP / 2 + (x / span) * (MAP / 2 - 16)
const my = (y: number, span: number) => MAP / 2 - (y / span) * (MAP / 2 - 16)

function StreetMap({ a, b, span, legs, showLine }: {
  a: number; b: number; span: number
  /** cumulative leg endpoints, walkthrough only */
  legs?: { x: number; y: number }[]
  /** draw the straight line back to the start (the modulus) */
  showLine?: boolean
}) {
  const stepEvery = span > 9 ? 2 : 1
  const ticks: number[] = []
  for (let t = -span; t <= span; t += stepEvery) ticks.push(t)
  const px = mx(a, span), py = my(b, span)
  const path = legs && legs.length
    ? `M ${mx(0, span)} ${my(0, span)} ` + legs.map((p) => `L ${mx(p.x, span)} ${my(p.y, span)}`).join(' ')
    : ''
  return (
    <svg viewBox={`0 0 ${MAP} ${MAP}`} width="100%" style={{ maxWidth: 'clamp(180px, 26vw, 300px)', display: 'block' }} aria-hidden>
      <rect x={0} y={0} width={MAP} height={MAP} rx={12} fill="rgba(0,0,0,0.26)" stroke={P.glassBorder} strokeWidth={1} />
      {/* the streets */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={mx(t, span)} y1={10} x2={mx(t, span)} y2={MAP - 10} stroke={P.glassBorder} strokeWidth={t === 0 ? 0 : 0.8} opacity={0.5} />
          <line x1={10} y1={my(t, span)} x2={MAP - 10} y2={my(t, span)} stroke={P.glassBorder} strokeWidth={t === 0 ? 0 : 0.8} opacity={0.5} />
        </g>
      ))}
      {/* the two axes — east/west and north/south */}
      <line x1={10} y1={my(0, span)} x2={MAP - 10} y2={my(0, span)} stroke={P.gold} strokeWidth={1.6} opacity={0.7} />
      <line x1={mx(0, span)} y1={10} x2={mx(0, span)} y2={MAP - 10} stroke={P.gold} strokeWidth={1.6} opacity={0.7} />
      <text x={MAP - 12} y={my(0, span) - 6} textAnchor="end" fill={P.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)">EAST</text>
      <text x={mx(0, span) + 6} y={16} fill={P.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)">NORTH</text>

      {/* the walked route (walkthrough only) */}
      {path && <path d={path} fill="none" stroke={P.mint} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />}
      {/* straight line back to the start */}
      {showLine && (a !== 0 || b !== 0) && (
        <line x1={mx(0, span)} y1={my(0, span)} x2={px} y2={py} stroke={P.coral} strokeWidth={2} strokeDasharray="5 4" />
      )}

      {/* START */}
      <circle cx={mx(0, span)} cy={my(0, span)} r={5} fill={P.gold} />
      <text x={mx(0, span) - 8} y={my(0, span) + 16} textAnchor="end" fill={P.gold} fontSize={9} fontFamily="var(--font-numeric)" fontWeight={800}>START</text>
      {/* where you finish */}
      <g style={{ transition: 'transform 300ms cubic-bezier(.45,.05,.25,1)', transform: `translate(${px - MAP / 2}px, ${py - MAP / 2}px)`, transformOrigin: 'center' }}>
        <circle cx={MAP / 2} cy={MAP / 2} r={8} fill={P.mint} stroke={P.cream} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 8px ${P.mint})` }} />
      </g>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// WALK PAD — the instrument for every answer that IS a complex number. Two
// sliders (east, north) with ± nudges, a live a + bi readout, and the map where
// the answer really is a place. One commit for both parts.
/** ⚠️ DECLARED AT MODULE LEVEL, NOT INSIDE WalkPad. Defined in the parent it is a NEW component
 *  type on every render, so React unmounts and remounts the subtree each time — which on a native
 *  `<input type="range">` means the slider is destroyed and rebuilt mid-drag, losing the pointer
 *  capture the child is dragging with. The closed-over values become props. */
function Leg({ label, val, onSet, lo, hi, disabled, reveal }: {
  label: string; val: number; onSet: (n: number) => void
  lo: number; hi: number; disabled?: boolean; reveal?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px,0.9vw,12px)', width: '100%' }}>
      <span style={{ width: 'clamp(58px,6vw,84px)', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px,1.1vw,13px)', letterSpacing: '0.08em', color: P.mutedOnPaper, textTransform: 'uppercase' }}>{label}</span>
      <Nudge P={P} label="−" disabled={disabled} onClick={() => onSet(val - 1)} />
      <input
        type="range" min={lo} max={hi} step={1} value={val} disabled={disabled}
        onChange={(e) => onSet(Number(e.target.value))}
        aria-label={label}
        style={{ flex: 1, minWidth: 60, accentColor: reveal ? P.mint : P.gold, cursor: disabled ? 'default' : 'pointer' }}
      />
      <Nudge P={P} label="+" disabled={disabled} onClick={() => onSet(val + 1)} />
      <span style={{ width: 'clamp(30px,3vw,44px)', textAlign: 'right', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(16px,1.8vw,24px)', color: reveal ? P.mint : P.cream }}>{disp(val)}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
function WalkPad({ task, value, setValue, disabled, reveal, onCommit }: {
  task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const a = value.k === 'walk' ? value.a : 0
  const b = value.k === 'walk' ? value.b : 0
  const lo = task.lo ?? -12, hi = task.hi ?? 12
  const clamp = (n: number) => Math.max(lo, Math.min(hi, n))
  const set = (na: number, nb: number) => setValue({ k: 'walk', a: clamp(na), b: clamp(nb) })
  const span = Math.max(6, Math.abs(a), Math.abs(b), Math.abs(task.ra ?? 0), Math.abs(task.rb ?? 0))


  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.2vw,16px)', width: '100%' }}>
      {task.map && <StreetMap a={a} b={b} span={span} />}
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(24px,3.2vw,42px)', fontWeight: 800, color: reveal ? P.mint : P.gold, textShadow: `0 0 18px ${(reveal ? '#3fa77c' : P.goldDeep)}55`, letterSpacing: '0.02em' }}>
        {fmtComplex(a, b)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px,0.8vw,10px)', width: '100%', maxWidth: 'clamp(280px, 40vw, 460px)' }}>
        <Leg label="east" val={a} onSet={(n) => set(n, b)} lo={lo} hi={hi} disabled={disabled} reveal={reveal} />
        <Leg label="north" val={b} onSet={(n) => set(a, n)} lo={lo} hi={hi} disabled={disabled} reveal={reveal} />
      </div>
      <CommitBtn P={P} label="LOCK IT IN ✓" disabled={disabled} onClick={() => onCommit({ k: 'walk', a, b })} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPASS — the instrument for powers of i. Face east, turn left. The heading you
// stop on IS the value of iⁿ, so the cycle is performed rather than recalled.
// ══════════════════════════════════════════════════════════════════════════════
const C = 150
const HEAD_XY: [number, number][] = [[C / 2 + 52, C / 2], [C / 2, C / 2 - 52], [C / 2 - 52, C / 2], [C / 2, C / 2 + 52]]

function Compass({ q, setQ, disabled, reveal, correct, onCommit }: {
  q: Head; setQ: (h: Head) => void; disabled?: boolean; reveal?: boolean; correct?: Head; onCommit: (h: Head) => void
}) {
  const turn = (d: 1 | -1) => setQ((((q + d) % 4) + 4) % 4 as Head)
  const angle = -90 * q   // heading 0 = east = arrow pointing right
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.2vw,16px)', width: '100%' }}>
      <svg viewBox={`0 0 ${C} ${C}`} width="100%" style={{ maxWidth: 'clamp(170px, 22vw, 260px)', display: 'block' }}>
        <circle cx={C / 2} cy={C / 2} r={64} fill="rgba(0,0,0,0.26)" stroke={P.glassBorder} strokeWidth={1} />
        <circle cx={C / 2} cy={C / 2} r={52} fill="none" stroke={P.glassBorder} strokeWidth={0.8} strokeDasharray="3 5" />
        {HEAD_XY.map(([hx, hy], i) => {
          const on = i === q
          const right = reveal && correct === i
          const col = right ? P.mint : on ? P.gold : P.mutedOnPaper
          return (
            <g key={i} onClick={() => !disabled && setQ(i as Head)} style={{ cursor: disabled ? 'default' : 'pointer' }}>
              <circle cx={hx} cy={hy} r={15} fill={on || right ? `${col}22` : 'transparent'} stroke={col} strokeWidth={on || right ? 2 : 1} />
              <text x={hx} y={hy + 4} textAnchor="middle" fill={col} fontSize={13} fontFamily="var(--font-numeric)" fontWeight={800}>{HEAD_VAL[i]}</text>
              <text x={hx} y={hy + (i === 3 ? 30 : i === 1 ? -20 : 0) } textAnchor="middle" fill={P.mutedOnPaper} fontSize={8} fontFamily="var(--font-numeric)" letterSpacing="0.1em">
                {i === 0 || i === 2 ? '' : HEAD_DIR[i].toUpperCase()}
              </text>
            </g>
          )
        })}
        <text x={C / 2 + 72} y={C / 2 + 3} textAnchor="middle" fill={P.mutedOnPaper} fontSize={8} fontFamily="var(--font-numeric)" letterSpacing="0.1em">E</text>
        <text x={C / 2 - 72} y={C / 2 + 3} textAnchor="middle" fill={P.mutedOnPaper} fontSize={8} fontFamily="var(--font-numeric)" letterSpacing="0.1em">W</text>
        {/* the walker's arrow */}
        <g style={{ transition: 'transform 400ms cubic-bezier(.45,.05,.25,1)', transform: `rotate(${angle}deg)`, transformOrigin: `${C / 2}px ${C / 2}px` }}>
          <line x1={C / 2} y1={C / 2} x2={C / 2 + 34} y2={C / 2} stroke={reveal ? P.mint : P.cream} strokeWidth={3} strokeLinecap="round" />
          <path d={`M ${C / 2 + 34} ${C / 2 - 7} L ${C / 2 + 46} ${C / 2} L ${C / 2 + 34} ${C / 2 + 7} Z`} fill={reveal ? P.mint : P.cream} />
        </g>
        <circle cx={C / 2} cy={C / 2} r={5} fill={P.gold} />
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1vw,14px)' }}>
        <Nudge P={P} label="↺" disabled={disabled} onClick={() => turn(1)} />
        <span style={{ minWidth: 'clamp(78px,9vw,120px)', textAlign: 'center', fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(14px,1.5vw,19px)', color: reveal ? P.mint : P.cream }}>
          facing {HEAD_DIR[q]}
        </span>
        <Nudge P={P} label="↻" disabled={disabled} onClick={() => turn(-1)} />
      </div>
      <CommitBtn P={P} label="THAT WAY ✓" disabled={disabled} onClick={() => onCommit(q)} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// WALKTHROUGH — two worked examples, one per graded gesture.
//   ① the walk pad, on (2 + 3i) + (1 − i)  — legs drawn as they are walked
//   ② the compass, on i²                    — the two turns that land on −1
// The modulus question needs no rehearsal: tapping a number is not a gesture a
// child has to be taught.
// ══════════════════════════════════════════════════════════════════════════════
const DEMO_WALK: Task = {
  kind: 'combine', title: 'Two legs', badge: '(2 + 3i) + (1 − i)', tone: 'a',
  prompt: '', say: '', work: [], ra: 3, rb: 2, lo: -12, hi: 12, map: true,
}
const DEMO_WALK_STEPS: DemoStep<V>[] = [
  { say: 'You are at the corner shop, and home is a few blocks away. You walk it in two legs.', value: { k: 'walk', a: 0, b: 0 }, board: '(2 + 3i) + (1 − i)' },
  { say: 'First leg. Two blocks east.', value: { k: 'walk', a: 2, b: 0 }, board: 'east 2' },
  { say: 'Then three blocks north. Two east and three north is two plus three i.', value: { k: 'walk', a: 2, b: 3 }, board: '2 + 3i' },
  { say: 'The second leg starts wherever the first one ended. One more block east.', value: { k: 'walk', a: 3, b: 3 }, board: '+ 1 east' },
  { say: 'And one block south. South is the minus i.', value: { k: 'walk', a: 3, b: 2 }, board: '− 1 north' },
  { say: 'Look at the whole journey: three blocks east in total, and two blocks north.', value: { k: 'walk', a: 3, b: 2 }, board: '3 east, 2 north' },
  { say: 'So the two legs add to three plus two i. East only ever adds to east, and north only to north — the two directions never mix.', value: { k: 'walk', a: 3, b: 2 }, board: '(2 + 3i) + (1 − i) = 3 + 2i' },
]

const DEMO_TURN: Task = {
  kind: 'power', title: 'Turn left', badge: 'i²', tone: 'a',
  prompt: '', say: '', work: [], q: 2, turns: 2,
}
const DEMO_TURN_STEPS: DemoStep<V>[] = [
  { say: 'Now the strangest thing about i — and it turns out to be a street corner.', value: { k: 'turn', q: 0 }, board: 'facing east = 1' },
  { say: 'You set off facing east. Facing east counts as one.', value: { k: 'turn', q: 0 } },
  { say: 'Multiplying by i means turn left. One quarter turn.', value: { k: 'turn', q: 1 }, board: '× i = turn left' },
  { say: 'One left and you are facing north. That is i itself.', value: { k: 'turn', q: 1 }, board: 'i = north' },
  { say: 'Turn left again — that is multiplying by i a second time.', value: { k: 'turn', q: 2 }, board: '× i again' },
  { say: 'Now you are facing west, the exact opposite of where you set off. Opposite of one is negative one.', value: { k: 'turn', q: 2 }, board: 'west = −1' },
  { say: 'So i times i is negative one. That is the whole rule, and it is just two left turns.', value: { k: 'turn', q: 2 }, board: 'i² = −1' },
  { say: 'Two more lefts and you are facing east again. Four turns brings you home, which is why the powers of i repeat every four.', value: { k: 'turn', q: 0 }, board: 'i⁴ = 1' },
]

// ── the walkthrough scene: the same map and compass, posed ────────────────────
const spring = { type: 'spring' as const, stiffness: 120, damping: 24, mass: 0.9 }

function WalkScene({ value }: { value: V }) {
  const a = value.k === 'walk' ? value.a : 0
  const b = value.k === 'walk' ? value.b : 0
  // The route grows by remembering every corner the walk has stood on, so it is
  // derived from the VALUE, never from the step index. `stepIndex` is GLOBAL across
  // all worked examples (GameShell flattens them into one timeline), so an
  // index-based route is only correct while this example happens to be the first
  // one — it would silently draw the wrong path the moment another is prepended.
  // ⚠️ STATE, NOT A REF — this accumulates ACROSS renders and was being mutated DURING one.
  // A ref written in the render phase is not idempotent: StrictMode renders twice, and React may
  // discard a concurrent render entirely — either way the write has already happened, so the route
  // gains a duplicate corner that no re-render can take back out. This is React's sanctioned
  // "information from previous renders" pattern: setting state during the render of the SAME
  // component makes React throw this render away and immediately re-run it with the new value, so
  // a doubled or discarded render converges on the same route instead of accumulating.
  const [seen, setSeen] = useState<{ x: number; y: number }[]>([])
  const last = seen[seen.length - 1]
  if (!last || last.x !== a || last.y !== b) setSeen([...seen, { x: a, y: b }])
  const legs = seen.filter((p) => p.x !== 0 || p.y !== 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
      <StreetMap a={a} b={b} span={6} legs={legs} />
      <div style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(20px,2.6vw,34px)', color: P.gold }}>{fmtComplex(a, b)}</div>
    </div>
  )
}

function TurnScene({ value, ended }: { value: V; ended: boolean }) {
  const q = value.k === 'turn' ? value.q : 0
  const reduce = useReducedMotion()
  // ⚠️ THE ARROW IS A PLAIN CSS TRANSITION, NOT A MOTION VALUE, and that is the fix
  // for two bugs found by driving this scene. A `useMotionValue` fed to
  // `style={{ rotate }}` first got a STRING ("rotate(0deg)") and wrote
  // transform-origin with no transform at all — computed `transform: none`, the
  // arrow never turned. Passing the number instead made it turn but left it exactly
  // ONE HEADING BEHIND the narration for the whole example. Both were invisible on a
  // screenshot, because the last step lands back on east, which is where a stuck
  // arrow already points. A CSS transition has no such lag and is what the
  // interactive Compass below already uses — one way of turning an arrow, not two.
  const done = ended || q === 2
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
      <svg viewBox={`0 0 ${C} ${C}`} width="100%" style={{ maxWidth: 'clamp(170px, 22vw, 250px)', display: 'block' }} aria-hidden>
        <circle cx={C / 2} cy={C / 2} r={64} fill="rgba(0,0,0,0.26)" stroke={P.glassBorder} strokeWidth={1} />
        {HEAD_XY.map(([hx, hy], i) => {
          const on = i === q
          return (
            <g key={i}>
              <circle cx={hx} cy={hy} r={15} fill={on ? `${P.gold}22` : 'transparent'} stroke={on ? P.gold : P.mutedOnPaper} strokeWidth={on ? 2 : 1} />
              <text x={hx} y={hy + 4} textAnchor="middle" fill={on ? P.gold : P.mutedOnPaper} fontSize={13} fontFamily="var(--font-numeric)" fontWeight={800}>{HEAD_VAL[i]}</text>
            </g>
          )
        })}
        <g style={{ transition: reduce ? 'none' : 'transform 500ms cubic-bezier(.45,.05,.25,1)', transform: `rotate(${-90 * q}deg)`, transformOrigin: `${C / 2}px ${C / 2}px` }}>
          <line x1={C / 2} y1={C / 2} x2={C / 2 + 34} y2={C / 2} stroke={done ? P.mint : P.cream} strokeWidth={3} strokeLinecap="round" />
          <path d={`M ${C / 2 + 34} ${C / 2 - 7} L ${C / 2 + 46} ${C / 2} L ${C / 2 + 34} ${C / 2 + 7} Z`} fill={done ? P.mint : P.cream} />
        </g>
        <circle cx={C / 2} cy={C / 2} r={5} fill={P.gold} />
      </svg>
      <motion.div key={q} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? { duration: 0 } : spring}
        style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(16px,2vw,24px)', color: done ? P.mint : P.cream }}>
        facing {HEAD_DIR[q]} · {HEAD_VAL[q]}
      </motion.div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
const CONFIG: GameConfig<V, Task> = {
  chapterId: 'complexNumbers',
  title: 'THE WALK HOME',
  ticketLabel: 'route card',
  palette: P,
  motif: '🗺️',
  makeTask,
  // PER-TASK gating. Only the modulus is a single number, so only the modulus gets
  // the pad; everything else produces a complex number or a heading and keeps its
  // instrument. This is the whole argument of the chapter — see the header.
  answerPad: (t) => (t.kind === 'mod' ? numChoices(t.n ?? 0, t.pad ?? [], { min: 0 }) : []),
  // REQUIRED: V is a tagged union, so a bare tapped number would never match
  // `v.k === 'num'` and every padded answer would grade WRONG. That exact defect
  // shipped to production in the 15–16 band and survived a hand-drive, because a
  // wrong answer still advances. See docs/lessons.md.
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) =>
    t.kind === 'mod' ? { k: 'num', n: 0 }
      : t.kind === 'power' ? { k: 'turn', q: 0 }
        : { k: 'walk', a: 0, b: 0 },
  grade: (t, v) =>
    t.kind === 'mod' ? v.k === 'num' && v.n === t.n
      : t.kind === 'power' ? v.k === 'turn' && v.q === t.q
        : v.k === 'walk' && v.a === t.ra && v.b === t.rb,
  revealText: (t) =>
    t.kind === 'mod' ? String(t.n ?? 0)
      : t.kind === 'power' ? HEAD_VAL[t.q ?? 0]
        : fmtComplex(t.ra ?? 0, t.rb ?? 0),
  glide: (t, _from, setValue, later) => later(() => setValue(
    t.kind === 'mod' ? { k: 'num', n: t.n ?? 0 }
      : t.kind === 'power' ? { k: 'turn', q: t.q ?? 0 }
        : { k: 'walk', a: t.ra ?? 0, b: t.rb ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, onCommit }): ReactElement => {
    if (task.kind === 'power') {
      return <Compass q={value.k === 'turn' ? value.q : 0} setQ={(h) => setValue({ k: 'turn', q: h })}
        disabled={disabled} reveal={reveal} correct={task.q} onCommit={(h) => onCommit({ k: 'turn', q: h })} />
    }
    if (task.kind === 'mod') {
      // Fallback only: every mod task ships with `pad`, so GameShell renders the
      // AnswerPad and never reaches this. Kept so a future modulus task without
      // `pad` degrades to a dial rather than to nothing.
      return <SlideValue P={P} value={value.k === 'num' ? value.n : 0} setValue={(n) => setValue({ k: 'num', n })}
        min={0} max={20} disabled={disabled} reveal={reveal} onCommit={(n) => onCommit({ k: 'num', n })} commitLabel="PACE IT OUT ✓" />
    }
    return <WalkPad task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
  },
  // Branches by example, so the child watches the gesture they will be graded on.
  TutorialScene: ({ task, value, ended }) =>
    task.kind === 'power'
      ? <TurnScene value={value} ended={ended} />
      : <WalkScene value={value} />,
  start: {
    blurb: <><strong>You&apos;re walking home</strong> on a grid of streets. A complex number is just a walk — so many blocks <strong>east</strong>, so many <strong>north</strong>. Add two walks, measure how far you got, and find out what happens when you <strong>turn left at the corner</strong>.</>,
    ticket: { title: 'Route home', badge: '2 + 3i', tone: 'a' },
    startLabel: 'Set off →',
  },
  overview: {
    say: 'Here is the plan. A complex number is a walk on a grid of streets: the first number is how many blocks east, and the second is how many blocks north. Adding two of them just means walking one leg and then the next. And multiplying by i turns you left at the corner. Let us walk one out together, nice and slow.',
    problem: <>Where do you finish after <strong>2 + 3i</strong>, then <strong>1 − i</strong>?</>,
    points: [
      <>The first number is blocks <strong>east</strong>, the second is blocks <strong>north</strong>.</>,
      <>A <strong>minus</strong> just means the other way — west, or south.</>,
      <>Adding two walks is <strong>one leg, then the next</strong>.</>,
      <>Multiplying by <strong>i</strong> is a <strong>left turn</strong> at the corner.</>,
    ],
  },
  tutorial: [
    { task: DEMO_WALK, initial: { k: 'walk', a: 0, b: 0 }, hand: 'drag', steps: DEMO_WALK_STEPS },
    { task: DEMO_TURN, initial: { k: 'turn', q: 0 }, hand: 'tap', steps: DEMO_TURN_STEPS },
  ],
  // No guided round: the walkthrough works BOTH graded gestures (the walk pad and
  // the compass), so nothing scored play grades is unrehearsed. The modulus is a
  // tap, which needs no rehearsal.
  sig: (t) => `${t.kind}:${t.badge}`,
}

export default function WalkHome(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
