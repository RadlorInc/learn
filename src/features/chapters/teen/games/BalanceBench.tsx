'use client'
/**
/**
 * BalanceBench — the Equations & Inequalities chapter (equations + inequalities) as a PLAYABLE GAME.
 * World: an airport check-in baggage scale. The kid finds an unknown suitcase's
 * weight by SLIDING x until the two pans balance — the left pan (m·x + c) matches
 * the right pan (the total). When the scale reads equal, you've solved the
 * equation. No slides, no MCQ. Shared adaptive engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * weighs x + 3 = 8 on the scale — lift the same weight off both pans, slide x
 * toward five, watch the pans level — then a GUIDED weigh-in (config.guided) lets
 * the kid balance x + 1 = 4 with Milo coaching (not scored), then the scored loop.
 */
import { useEffect, type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, BalanceBeam, Nudge, CommitBtn, numChoices, pick, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#101d24', nightBot: '#152a33',
  cream: '#eafaff', creamSoft: 'rgba(234,250,255,0.82)',
  inkOnPaper: '#16303a', mutedOnPaper: '#6f8f9a',
  gold: '#5fd0e6', goldDeep: '#2a9cbb',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#5fe0b0',
  glass: 'rgba(16,29,36,0.6)', glassBorder: 'rgba(234,250,255,0.22)',
}

// The four inequality relations. le/ge include the boundary (● filled dot); lt/gt
// exclude it (○ hollow dot). le/lt shade toward the low end, ge/gt toward the high.
type IneqOp = 'le' | 'lt' | 'ge' | 'gt'
const OPSYM: Record<IneqOp, string> = { le: '≤', lt: '<', ge: '≥', gt: '>' }
const OPWORD: Record<IneqOp, string> = { le: 'at most', lt: 'under', ge: 'at least', gt: 'over' }
const shadesLeft = (op: IneqOp) => op === 'le' || op === 'lt'
const isClosed = (op: IneqOp) => op === 'le' || op === 'ge'

interface Task extends BaseTask {
  m: number; c: number; right: number; answer: number; leftExpr: string; min: number; max: number
  // ── inequality tasks: the solution is a RAY (x < / ≤ / ≥ / > bound), shaded on a
  //    number line with an open/closed endpoint, instead of a single balancing x. ──
  kind?: 'ineq'; op?: IneqOp; bound?: number
}

// The solution to an inequality = a boundary + which relation. Equations use a plain
// number (x); the chapter's value is the union of the two.
type RaySol = { bound: number; op: IneqOp }
type Val = number | RaySol
const isRay = (v: Val): v is RaySol => typeof v === 'object'

/** Speech form of an expression: TTS reads bare ÷ and U+2212 unreliably (and "/" as
 *  "slash"), so the SPOKEN line uses words while the board keeps the real symbols. */
const speakExpr = (e: string) => e.replace(/÷/g, 'divided by').replace(/−/g, 'minus').replace(/\+/g, 'plus')

interface Spec { leftExpr: string; m: number; c: number; right: number; answer: number; min: number; max: number }
// Tier 1 stays on the case-plus-weights story the walkthrough actually acts out
// (things ADDED to the pan). A "take 4 kg OFF the case" spec (c < 0) is never
// modelled there, so those start at tier 2.
const L1: Spec[] = [
  { leftExpr: 'x + 3', m: 1, c: 3, right: 7, answer: 4, min: 0, max: 10 },
  { leftExpr: '2x', m: 2, c: 0, right: 10, answer: 5, min: 0, max: 10 },
  { leftExpr: '3x', m: 3, c: 0, right: 12, answer: 4, min: 0, max: 10 },
]
const L2: Spec[] = [
  { leftExpr: '2x + 3', m: 2, c: 3, right: 11, answer: 4, min: 0, max: 10 },
  { leftExpr: '3x − 2', m: 3, c: -2, right: 10, answer: 4, min: 0, max: 10 },
  { leftExpr: 'x − 4', m: 1, c: -4, right: 1, answer: 5, min: 0, max: 12 },
  // was 5x = −15 → x = −3: a suitcase cannot weigh minus three kilos, and the
  // chapter's own scale can't show it. Same "undo the ×5" idea, weighable.
  { leftExpr: '5x', m: 5, c: 0, right: 15, answer: 3, min: 0, max: 10 },
]
const L3: Spec[] = [
  { leftExpr: 'x ÷ 2', m: 0.5, c: 0, right: 6, answer: 12, min: 0, max: 16 },
  { leftExpr: '4x − 1', m: 4, c: -1, right: 11, answer: 3, min: 0, max: 10 },
  { leftExpr: '2x + 5', m: 2, c: 5, right: 17, answer: 6, min: 0, max: 12 },
]

function fromSpec(s: Spec): Task {
  const badge = `${s.leftExpr} = ${s.right}`
  return {
    title: 'Find x', badge, tone: s.right < 0 ? 'b' : 'a', answerLabel: 'x =',
    context: `A scale is level only when both sides weigh the same. Here the other side weighs ${s.right} kg.`,
    padInstruction: 'Work out what the mystery case weighs, then tap that number.',
    prompt: `Weigh the case: ${s.leftExpr} = ${s.right}. Work out x — what does the case weigh?`,
    say: `The case balances when ${speakExpr(s.leftExpr)} equals ${s.right} kilograms. Work out x. What does the case weigh, in kilograms?`,
    m: s.m, c: s.c, right: s.right, answer: s.answer, leftExpr: s.leftExpr, min: s.min, max: s.max,
    work: [`Find the x that makes ${s.leftExpr} equal ${s.right}.`, `x = ${s.answer} makes both pans read ${s.right}.`],
  }
}

// ── inequalities: solve m·x + c OP right for x → a boundary + relation. Shown as a
//    weight rule; the child shades the ray of allowed weights with an open (< >) or
//    closed (≤ ≥) endpoint. Both strict and inclusive appear so all four are taught. ──
interface IneqSpec { leftExpr: string; op: IneqOp; right: number; bound: number; min: number; max: number }
const IN2: IneqSpec[] = [
  { leftExpr: 'x + 2', op: 'le', right: 6, bound: 4, min: 0, max: 8 },   // x ≤ 4
  { leftExpr: '2x', op: 'ge', right: 6, bound: 3, min: 0, max: 8 },       // x ≥ 3
  { leftExpr: 'x + 1', op: 'lt', right: 5, bound: 4, min: 0, max: 8 },    // x < 4
  { leftExpr: '2x', op: 'gt', right: 6, bound: 3, min: 0, max: 8 },       // x > 3
]
const IN3: IneqSpec[] = [
  { leftExpr: '2x + 1', op: 'le', right: 9, bound: 4, min: 0, max: 8 },   // x ≤ 4
  { leftExpr: '3x', op: 'gt', right: 12, bound: 4, min: 0, max: 8 },      // x > 4
  { leftExpr: 'x + 5', op: 'lt', right: 8, bound: 3, min: 0, max: 8 },    // x < 3
  { leftExpr: 'x − 1', op: 'ge', right: 3, bound: 4, min: 0, max: 8 },    // x ≥ 4
]
function fromIneq(s: IneqSpec): Task {
  const badge = `${s.leftExpr} ${OPSYM[s.op]} ${s.right}`
  const dw = OPWORD[s.op]
  const edgeNote = isClosed(s.op)
    ? `${s.bound} itself is allowed, so the dot is filled.`
    : `${s.bound} is NOT allowed, so the dot is hollow.`
  return {
    title: 'Weight rule', badge, tone: 'b', showEquals: false, kind: 'ineq', op: s.op, bound: s.bound,
    m: 0, c: 0, right: s.right, answer: s.bound, leftExpr: s.leftExpr, min: s.min, max: s.max,
    context: 'Some cases do not need an exact weight — just a limit. This case is allowed a whole range of weights.',
    instruction: 'Look at the number line. Pick the symbol, set the edge weight, then shade every weight the case is allowed. Use a filled ● dot for ≤ or ≥, an open ○ dot for < or >.',
    prompt: `Solve ${badge}. Work out x, then shade every case weight that's allowed on the number line.`,
    say: `Solve: ${speakExpr(s.leftExpr)} is ${dw} ${s.right}. Work out x, then pick the symbol and set the edge weight.`,
    work: [`Solve for x: ${badge} means x ${OPSYM[s.op]} ${s.bound}.`, `${edgeNote} Shade every weight ${dw} ${s.bound}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return fromSpec(pick(L1))
  // tiers 2 & 3 mix equations and inequalities so both concepts keep coming up
  const eq = d === 2 ? L2 : L3
  const ineq = d === 2 ? IN2 : IN3
  return Math.random() < 0.5 ? fromSpec(pick(eq)) : fromIneq(pick(ineq))
}

// ── worked example for the walkthrough (x + 3 = 8 → 5) + guided order (x + 1 = 4 → 3) ──
const DEMO_TASK: Task = {
  title: 'Find x', badge: 'x + 3 = 8', tone: 'a', answerLabel: 'x =',
  m: 1, c: 3, right: 8, answer: 5, leftExpr: 'x + 3', min: 0, max: 10,
  prompt: '', say: '', work: [],
}
const GUIDED_TASK: Task = {
  title: 'Find x', badge: 'x + 1 = 4', tone: 'a', answerLabel: 'x =',
  m: 1, c: 1, right: 4, answer: 3, leftExpr: 'x + 1', min: 0, max: 10,
  context: 'A scale is level only when both sides weigh the same. Here the other side weighs 4 kg.',
  padInstruction: 'Work out what the mystery case weighs, then tap that number.',
  prompt: 'Weigh x + 1 = 4. Work out x — what does the case weigh?',
  say: 'The case balances when x plus one equals four. Work out x. What does the case weigh?',
  work: ['Find the x that makes x + 1 equal 4.', 'x = 3 makes both pans read 4.'],
}

const GUIDED_INEQ: Task = {
  title: 'Weight rule', badge: 'x + 2 \u2264 6', tone: 'b', showEquals: false, kind: 'ineq', op: 'le', bound: 4,
  m: 0, c: 0, right: 6, answer: 4, leftExpr: 'x + 2', min: 0, max: 8,
  context: 'Some cases do not need an exact weight \u2014 just a limit. This case is allowed a whole range of weights.',
  instruction: 'Look at the number line. Pick the symbol, set the edge weight, then shade every weight the case is allowed. Use a filled \u25cf dot for \u2264 or \u2265, an open \u25cb dot for < or >.',
  prompt: 'Solve x + 2 \u2264 6. Work out x, then shade every case weight that\u2019s allowed.',
  say: 'This case has a rule: x plus 2 is at most 6. Work out x, then pick the symbol and set the edge weight.',
  work: ['Solve for x: x + 2 \u2264 6 means x \u2264 4.', '4 itself is allowed, so the dot is filled. Shade every weight at most 4.'],
}

// ── Animated walkthrough scene — the storyboard, in motion ────────────────────
// A code-drawn cartoon BALANCE SCALE that acts out the worked example x + 3 = 8.
// The LEFT pan carries a SUITCASE (the unknown x) plus a stack of three known
// weights; the RIGHT pan reads the target total. As the narration slides x from 0
// toward 5, the beam ROTATES (CSS transition) toward level while the pans
// counter-rotate to stay upright. The verdict pill glides between "too light" and
// "balanced". The final beats settle the beam LEVEL, glow it mint, and reveal x on
// the suitcase. Driven purely by the walkthrough's per-step `value` (x) + index.
const DEMO_M = 3, DEMO_RIGHT = 8, DEMO_ANS = 5
const ART = '/assets/teen/objects'
const TILT_GAIN = 3, MAX_TILT = 15, ARM = 84  // beam half-span to each pan's hang point
function BaggageScaleScene({ palette: P, value: rawValue, stepIndex, frameCount, ended }: {
  palette: Palette; value: Val; stepIndex: number; frameCount: number; ended: boolean
}) {
  const value = typeof rawValue === 'number' ? rawValue : 0   // scene only plays the equation example
  const x = Math.max(0, Math.min(DEMO_ANS + 1, value))
  const left = x + DEMO_M                       // left pan weight = x + 3
  const diff = left - DEMO_RIGHT                // <0 too light, 0 balanced, >0 heavy
  const resultPhase = ended || stepIndex >= frameCount - 2   // last 2 beats: the answer
  const intro = stepIndex === 0
  const balanced = Math.abs(diff) < 1e-6
  const beamCol = resultPhase && balanced ? P.mint : P.gold
  const caseReveal = resultPhase && balanced       // reveal x's value on the case
  const verdict = balanced ? 'Balanced ✓' : diff < 0 ? 'Too light — right pan drops' : 'Too heavy'
  const verdictCol = balanced ? P.mint : P.coral

  // ── Framer Motion: x rides a spring (continuous 60fps, not a per-step CSS jump).
  //    The beam ANGLE is derived from x, so the beam tilts and the pans glide as one
  //    fluid motion; the pans ride the rotated arm ends yet stay upright (the scale
  //    hangs level). The arithmetic readout ticks with x. Overdamped → never
  //    overshoots into a heavier tilt than the step. Reduced-motion → snaps. ──
  const reduce = useReducedMotion()
  const xv = useMotionValue(x)
  useEffect(() => {
    const controls = animate(xv, x, reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 24, mass: 0.9 })
    return () => controls.stop()
  }, [x, reduce, xv])
  // beam tips toward the heavier side; left too light → right pan drops (positive rotate)
  const tiltDeg = useTransform(xv, (xVal) => Math.max(-MAX_TILT, Math.min(MAX_TILT, -((xVal + DEMO_M) - DEMO_RIGHT) * TILT_GAIN)))
  const tiltRad = useTransform(tiltDeg, (d) => (d * Math.PI) / 180)
  // each pan hangs from its arm end, which swings along the beam's rotation; the pan
  // itself stays upright, so drive its position (not a counter-rotation) from the angle.
  const panLX = useTransform(tiltRad, (a) => -ARM * Math.cos(a))
  const panLY = useTransform(tiltRad, (a) => -ARM * Math.sin(a))
  const panRX = useTransform(tiltRad, (a) => ARM * Math.cos(a))
  const panRY = useTransform(tiltRad, (a) => ARM * Math.sin(a))
  const readText = useTransform(xv, (xVal) => {
    if (caseReveal) return '5 + 3 = 8'
    if (intro) return ''
    const xr = Math.max(0, Math.round(xVal))
    return `${xr} + 3 = ${xr + DEMO_M}`
  })

  // the mystery suitcase (unknown x) — an illustrated case that grows a touch as it fills
  const Suitcase = () => {
    const w = 34, h = 26 + Math.min(x, DEMO_ANS) * 1.4
    return (
      <g transform={`translate(${-w / 2} ${-h})`} style={{ transition: 'transform 620ms' }}>
        <image href={`${ART}/bag_suitcase.png`} x={0} y={0} width={w} height={h} preserveAspectRatio="none"
          style={{ transition: 'filter 500ms', filter: caseReveal ? `hue-rotate(110deg) saturate(1.2) drop-shadow(0 0 7px ${P.mint})` : undefined }} />
        {/* code-drawn x / value label centred on the case */}
        <text x={w / 2} y={h * 0.5 + 5} textAnchor="middle" fontFamily="var(--font-numeric)" fontWeight={800}
          fontSize={14} fill={P.inkOnPaper} style={{ paintOrder: 'stroke', stroke: P.cream, strokeWidth: 3, strokeLinejoin: 'round' }}>{caseReveal ? x : 'x'}</text>
      </g>
    )
  }

  // the three known kg weights stacked on the left pan (illustrated gold blocks)
  const KnownWeights = () => (
    <g transform="translate(26 0)">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(0 ${-15 - i * 13})`}>
          <image href={`${ART}/bag_weight.png`} x={-10} y={0} width={20} height={13} preserveAspectRatio="none" />
          <text x={0} y={9.5} textAnchor="middle" fontFamily="var(--font-numeric)" fontWeight={800} fontSize={7} fill={P.inkOnPaper}>1</text>
        </g>
      ))}
    </g>
  )

  // a single upright pan that rides its arm end (glides via x/y from the beam angle)
  const Pan = ({ mx, my, children }: { mx: typeof panLX; my: typeof panLY; children: ReactNode }) => (
    <motion.g style={{ x: mx, y: my }}>
      {/* hanging cords */}
      <line x1={-18} y1={0} x2={0} y2={30} stroke={P.glassBorder} strokeWidth={1.4} />
      <line x1={18} y1={0} x2={0} y2={30} stroke={P.glassBorder} strokeWidth={1.4} />
      <path d={`M -26 30 Q 0 44 26 30`} fill={P.glass} stroke={P.glassBorder} strokeWidth={1.4} />
      <g transform="translate(0 30)">{children}</g>
    </motion.g>
  )

  return (
    <div style={{ position: 'relative', width: 'clamp(240px, 44vw, 372px)', height: 'clamp(300px, 46vh, 440px)', borderRadius: 16, background: P.nightTop, border: `1.5px solid ${P.glassBorder}`, overflow: 'hidden', boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{'@keyframes bsPop{0%{opacity:0;transform:translate(-50%,6px)}100%{opacity:1;transform:translate(-50%,0)}}@keyframes bsBob{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}@keyframes bsGlow{0%,100%{opacity:.5}50%{opacity:1}}'}</style>

      {/* illustrated airport check-in backdrop + a soft dark scrim so the scale reads clearly */}
      <img src={`${ART}/bag_checkin_bg.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${P.nightTop}cc, ${P.nightBot}dd)` }} />

      {/* equation banner across the top */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: '7%', padding: '4px 16px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(15px,2vw,20px)', color: caseReveal ? P.mint : P.cream, transition: 'color 400ms' }}>
        x + 3 = 8
      </div>

      {/* the scale */}
      <svg viewBox="0 0 240 210" style={{ position: 'relative', zIndex: 1, width: '92%', height: 'auto', marginTop: '2%' }}>
        <g transform="translate(120 74)">
          {/* the beam bar — springs about its centre pivot (Framer rotate) */}
          <motion.g style={{ rotate: tiltDeg, transformBox: 'fill-box', transformOrigin: 'center' }}>
            <rect x={-92} y={-4} width={184} height={8} rx={4} fill={beamCol}
              style={{ transition: 'fill 500ms', filter: resultPhase && balanced ? `drop-shadow(0 0 9px ${P.mint})` : undefined }} />
            <circle cx={-84} cy={0} r={4} fill={beamCol} />
            <circle cx={84} cy={0} r={4} fill={beamCol} />
          </motion.g>
          {/* the pans hang from the swinging arm ends yet stay upright (glide via x/y) */}
          <Pan mx={panLX} my={panLY}><Suitcase /><KnownWeights /></Pan>
          <Pan mx={panRX} my={panRY}>
            <g transform="translate(0 -22)">
              <image href={`${ART}/bag_weight.png`} x={-17} y={0} width={34} height={22} preserveAspectRatio="none" />
              <text x={0} y={15} textAnchor="middle" fontFamily="var(--font-numeric)" fontWeight={800} fontSize={13} fill={P.inkOnPaper}>8</text>
            </g>
          </Pan>
          {/* the pivot / stand (fixed) */}
          <polygon points="0,4 -15,64 15,64" fill={P.glassBorder} />
          <rect x={-34} y={64} width={68} height={7} rx={3} fill={P.glassBorder} />
        </g>
      </svg>

      {/* the running arithmetic line — the board math, ticks with x as it glides */}
      <motion.div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', marginBottom: '22%', fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(16px,2.4vw,24px)', color: caseReveal ? P.mint : P.cream, transition: 'color 400ms' }}>
        {readText}
      </motion.div>

      {/* verdict pill — glides between too-light and balanced */}
      {!intro && (
        <div style={{ position: 'absolute', bottom: '4%', left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', borderRadius: 999, background: P.glass, border: `1px solid ${verdictCol}`, color: verdictCol, fontWeight: 800, fontSize: 'clamp(11px,1.4vw,14px)', whiteSpace: 'nowrap', animation: 'bsPop 300ms ease', boxShadow: balanced ? `0 0 12px ${P.mint}55` : undefined }}>
          {verdict}
        </div>
      )}

      {/* intro cue: both pans must weigh the same */}
      {intro && (
        <div style={{ position: 'absolute', bottom: '4%', left: '50%', transform: 'translateX(-50%)', color: P.creamSoft, fontWeight: 700, fontSize: 'clamp(11px,1.4vw,14px)', whiteSpace: 'nowrap' }}>
          ⚖️ both pans must match
        </div>
      )}
    </div>
  )
}

// ── RAY VIZ — the number line + shaded solution ray + open/closed endpoint. Shared
//    by the interactive RayLine and the walkthrough scene, so both read identically. ──
function RayViz({ P, min, max, sol, col }: { P: Palette; min: number; max: number; sol: RaySol; col: string }) {
  const pct = (n: number) => ((n - min) / (max - min)) * 100
  const left = shadesLeft(sol.op)
  const closed = isClosed(sol.op)
  const rayLeft = left ? 0 : pct(sol.bound)
  const rayRight = left ? 100 - pct(sol.bound) : 0
  return (
    <div style={{ position: 'relative', width: '100%', height: 44 }}>
      <div style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 3, background: P.glassBorder, borderRadius: 2 }} />
      {/* shaded solution ray */}
      <div style={{ position: 'absolute', top: 18.5, left: `${rayLeft}%`, right: `${rayRight}%`, height: 6, background: col, borderRadius: 3, boxShadow: `0 0 8px ${col}`, transition: 'left 220ms, right 220ms' }} />
      {/* integer ticks + labels */}
      {Array.from({ length: max - min + 1 }, (_, i) => {
        const n = min + i
        const on = left ? (closed ? n <= sol.bound : n < sol.bound) : (closed ? n >= sol.bound : n > sol.bound)
        return (
          <div key={n} style={{ position: 'absolute', left: `${pct(n)}%`, top: 0, transform: 'translateX(-50%)', textAlign: 'center' }}>
            <div style={{ width: 2, height: 12, margin: '14px auto 0', background: on ? col : P.mutedOnPaper }} />
            <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(9px,1.1vw,12px)', fontWeight: on ? 800 : 600, color: on ? col : P.mutedOnPaper }}>{n}</div>
          </div>
        )
      })}
      {/* boundary endpoint — FILLED for ≤/≥ (edge allowed), HOLLOW for </> (edge excluded) */}
      <div style={{ position: 'absolute', left: `${pct(sol.bound)}%`, top: 14.5, transform: 'translateX(-50%)', width: 14, height: 14, borderRadius: '50%', background: closed ? col : P.nightBot, border: `2.5px solid ${closed ? P.cream : col}`, boxShadow: `0 0 8px ${col}`, transition: 'left 220ms' }} />
    </div>
  )
}

// ── RAY LINE — solve an inequality ON the illustration: shade the ray of every allowed
//    weight. The child sets the boundary and picks the relation (< ≤ ≥ >); the shaded
//    ray with its open/closed endpoint IS the solution set. ──
function RayLine({ P, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: RaySol; setValue: (v: RaySol) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: RaySol) => void
}) {
  const { min, max } = task
  const sol = reveal ? { bound: task.bound!, op: task.op! } : value
  const solved = sol.bound === task.bound && sol.op === task.op
  const col = reveal || solved ? P.mint : P.gold
  const setBound = (b: number) => { if (!disabled) setValue({ ...sol, bound: Math.max(min, Math.min(max, b)) }) }
  const setOp = (op: IneqOp) => { if (!disabled) setValue({ ...sol, op }) }
  const opChip = (op: IneqOp, label: string): React.CSSProperties => ({
    flex: '1 1 44%', padding: '8px 6px', borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 'clamp(11px,1.3vw,15px)', textAlign: 'center',
    border: `2px solid ${sol.op === op ? P.gold : P.glassBorder}`,
    background: sol.op === op ? 'rgba(95,208,230,0.16)' : 'transparent', color: sol.op === op ? P.gold : P.creamSoft,
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vw,16px)', width: '100%' }}>
      <div style={{ width: 'clamp(250px, 52vw, 430px)', minHeight: 'clamp(150px,22vh,200px)', boxSizing: 'border-box', borderRadius: 16, background: `linear-gradient(160deg, ${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(12px,2vh,20px)', padding: 'clamp(18px,2.6vw,28px)' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.creamSoft }}>🧳 {task.badge} · allowed weights</div>
        <RayViz P={P} min={min} max={max} sol={sol} col={col} />
        <div style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(16px,2.4vw,24px)', color: solved ? P.mint : P.gold }}>
          x {OPSYM[sol.op]} {sol.bound}
        </div>
      </div>
      {/* relation picker — the four inequality symbols */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: 'clamp(250px,52vw,430px)', justifyContent: 'center' }}>
        <div style={opChip('lt', '< under')} onClick={() => setOp('lt')}>&lt; under</div>
        <div style={opChip('le', '≤ at most')} onClick={() => setOp('le')}>≤ at most</div>
        <div style={opChip('ge', '≥ at least')} onClick={() => setOp('ge')}>≥ at least</div>
        <div style={opChip('gt', '> over')} onClick={() => setOp('gt')}>&gt; over</div>
      </div>
      {/* boundary nudge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => setBound(sol.bound - 1)} />
        <div style={{ minWidth: 110, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(20px,2.4vw,30px)', fontWeight: 800, color: reveal ? P.mint : P.gold }}>{sol.bound} kg</div>
          <div style={{ fontSize: 'clamp(10px,1.1vw,13px)', color: P.creamSoft }}>the edge</div>
        </div>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => setBound(sol.bound + 1)} />
      </div>
      <CommitBtn P={P} label="SET RULE ✓" disabled={disabled} onClick={() => onCommit(sol)} />
    </div>
  )
}

// ── the inequality walkthrough (x + 2 ≤ 6 → x ≤ 4), so the child is TAUGHT the ray
//    before meeting it in practice: solve to the boundary, shade the ray, and see why
//    the endpoint is filled (≤) vs hollow (<). ──
const DEMO_INEQ: Task = {
  title: 'Weight rule', badge: 'x + 2 ≤ 6', tone: 'b', showEquals: false, kind: 'ineq', op: 'le', bound: 4,
  m: 0, c: 0, right: 6, answer: 4, leftExpr: 'x + 2', min: 0, max: 8, prompt: '', say: '', work: [],
}
const INEQ_SCRIPT = {
  task: DEMO_INEQ,
  initial: { bound: 0, op: 'le' } as RaySol,
  hand: 'tap' as const,
  steps: [
    { say: "Now a different kind of rule. Sometimes a case doesn't need an exact weight — it just has a LIMIT. This case plus its two-kilo tag must weigh at most six kilos.", value: { bound: 0, op: 'le' } as RaySol, board: 'x + 2 ≤ 6' },
    { say: "Solve it just like an equation. Take two off both sides: x is at most four.", value: { bound: 4, op: 'le' } as RaySol, board: 'x ≤ 4' },
    { say: "But four isn't the only answer. Three works, two works, even zero works — every weight four or under is allowed.", value: { bound: 4, op: 'le' } as RaySol, board: 'x ≤ 4' },
    { say: "So we shade the whole line from four downward. That shaded ray is every weight the case is allowed to be.", value: { bound: 4, op: 'le' } as RaySol, board: 'shade ≤ 4' },
    { say: "The dot on four is FILLED IN, because four itself is allowed. 'At most four' includes four.", value: { bound: 4, op: 'le' } as RaySol, board: '● 4 is allowed' },
    { say: "If the rule said UNDER four instead — less than four — the dot would be HOLLOW, because four would no longer count.", value: { bound: 4, op: 'lt' } as RaySol, board: '○ x < 4' },
    { say: "Ours is 'at most', so keep it filled. Pick the symbol, set the edge, then set the rule. Now let's try one together.", value: { bound: 4, op: 'le' } as RaySol, board: 'x ≤ 4  ✓' },
  ],
}

// ── the inequality walkthrough SCENE — the number line + ray, driven by the step's
//    RaySol value, so the shading builds and the endpoint flips filled/hollow live. ──
function RayScene({ palette: P, task, value, stepIndex, frameCount, ended }: {
  palette: Palette; task: Task; value: Val; stepIndex: number; frameCount: number; ended: boolean
}) {
  const sol: RaySol = isRay(value) ? value : { bound: task.bound ?? 0, op: task.op ?? 'le' }
  const resultPhase = ended || stepIndex >= frameCount - 2
  const col = resultPhase ? P.mint : P.gold
  return (
    <div style={{ position: 'relative', width: 'clamp(240px, 44vw, 372px)', height: 'clamp(300px, 46vh, 440px)', borderRadius: 16, background: P.nightTop, border: `1.5px solid ${P.glassBorder}`, overflow: 'hidden', boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px,3.4vh,30px)', padding: 'clamp(16px,3vw,26px)' }}>
      <img src={`${ART}/bag_checkin_bg.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${P.nightTop}cc, ${P.nightBot}dd)` }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '4px 16px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(15px,2vw,20px)', color: resultPhase ? P.mint : P.cream }}>{task.badge}</div>
      <div style={{ position: 'relative', zIndex: 1, width: '86%' }}><RayViz P={P} min={task.min} max={task.max} sol={sol} col={col} /></div>
      <div style={{ position: 'relative', zIndex: 1, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(18px,2.6vw,26px)', color: col }}>x {OPSYM[sol.op]} {sol.bound}</div>
      <div style={{ position: 'relative', zIndex: 1, minHeight: 20, color: resultPhase ? P.mint : P.creamSoft, fontWeight: 700, fontSize: 'clamp(11px,1.5vw,14px)', textAlign: 'center' }}>
        {isClosed(sol.op) ? '● filled — the edge is allowed' : '○ hollow — the edge is not allowed'}
      </div>
    </div>
  )
}

// Pick the right walkthrough scene per example: balance scale for the equation, number
// line for the inequality.
function TeachScene(props: { palette: Palette; task: Task; value: Val; stepIndex: number; frameCount: number; ended: boolean }) {
  return props.task.kind === 'ineq' ? <RayScene {...props} /> : <BaggageScaleScene {...props} />
}

const CONFIG: GameConfig<Val, Task> = {
  chapterId: 'equationsInequalities',
  title: 'BAGGAGE SCALE',
  motif: '🧳',
  ticketLabel: 'weigh-in',
  palette: P,
  makeTask,
  initialValue: (t) => t.kind === 'ineq' ? { bound: t.min, op: 'le' } as RaySol : t.min,
  grade: (t, v) => t.kind === 'ineq'
    ? isRay(v) && v.bound === t.bound && v.op === t.op
    : !isRay(v) && Math.abs(v - t.answer) < 1e-6,   // a pad question submits a plain number → lands here already
  // PER-TASK pad: an equation answers with a single x → tap it. An INEQUALITY answers
  // with a whole solution RAY (relation + boundary + open/closed endpoint), which no
  // number pad can express — those keep the RayLine instrument.
  // NB the bound is `min: 0` (a case cannot weigh less than nothing), NOT the beam's
  // min/max — that slider range is narrower than the misconception answers, so it was
  // filtering every one of them out and leaving four near-identical neighbours.
  answerPad: (t) => t.kind === 'ineq' ? [] : numChoices(t.answer, [
    t.right + t.c,   // added c when they should have subtracted it (x + 3 = 8 → 11)
    t.right * t.m,   // multiplied by m when they should have divided (2x = 10 → 20)
    t.right - t.c,   // undid c but forgot to divide by m (2x + 3 = 11 → 8)
  ], { min: 0 }),
  revealText: (t) => t.kind === 'ineq' ? `x ${OPSYM[t.op!]} ${t.bound}` : `x = ${t.answer}`,
  glide: (t, from, setValue, later) => t.kind === 'ineq'
    ? later(() => setValue({ bound: t.bound!, op: t.op! } as RaySol), 500)
    : glideNumber(from as number, t.answer, setValue as (v: number) => void, later),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => (
    task.kind === 'ineq'
      ? <RayLine P={palette} task={task} value={value as RaySol} setValue={setValue as (v: RaySol) => void} disabled={disabled} reveal={reveal} onCommit={onCommit as (v: RaySol) => void} />
      : <BalanceBeam P={palette} x={value as number} setX={setValue as (v: number) => void} min={task.min} max={task.max} leftOf={(x) => task.m * x + task.c} right={task.right} leftExpr={task.leftExpr} disabled={disabled} reveal={reveal} onCommit={onCommit as (v: number) => void} commitLabel="WEIGH ✓" />
  ),
  tutorial: [{
    task: DEMO_TASK,
    initial: 0,
    hand: 'drag',
    steps: [
      { say: "Airport check-in scale! For the scale to sit level, both pans must weigh exactly the same.", value: 0, hand: 'drag' },
      { say: "The left pan holds the mystery case plus a three-kilo weight. The right pan reads eight kilos.", value: 0, hand: 'drag', board: 'x + 3 = 8' },
      { say: "So we need the left pan — the case plus three — to match eight. Let's find the case's weight one kilo at a time.", value: 0, hand: 'drag', board: 'x + 3 = 8' },
      { say: "Right now x is zero — an empty case. The left is only three kilos, so it's too light. The scale tips down on the right.", value: 0, hand: 'drag', board: '0 + 3 = 3  (too light)' },
      { say: "Let's make the case heavier. x equals one: the left pan is one plus three, that's four kilos. Still too light.", value: 1, hand: 'drag', board: '1 + 3 = 4' },
      { say: "x equals two: the left pan grows to two plus three, five kilos. Getting closer, but still under eight.", value: 2, hand: 'drag', board: '2 + 3 = 5' },
      { say: "x equals three: three plus three is six kilos. The scale is levelling out but not there yet.", value: 3, hand: 'drag', board: '3 + 3 = 6' },
      { say: "x equals four: four plus three is seven kilos. Almost balanced — just one kilo short.", value: 4, hand: 'drag', board: '4 + 3 = 7' },
      { say: "x equals five: five plus three is eight kilos. Now both pans read eight — the scale is balanced!", value: 5, hand: 'drag', board: '5 + 3 = 8  ✓' },
      { say: "Another way to see it: take three kilos off both pans and the case alone equals five. Same answer.", value: 5, hand: 'drag', board: '8 − 3 = 5' },
      { say: "Balanced means solved: the mystery case weighs five kilos. Press weigh when it's level. Next, a different kind of rule.", value: 5, hand: 'tap', board: 'x = 5' },
    ],
  }, INEQ_SCRIPT],
  // Two guided orders: the equation on the pad, then ONE inequality on the RayLine
  // — the symbol chip is a separately-graded step (default 'le'), so a child must
  // rehearse picking it unscored before it can ever cost them a mark.
  guided: [
    { task: GUIDED_TASK, coach: 'Your turn — I will help.', hand: 'drag' },
    { task: GUIDED_INEQ, coach: 'One more — a weight rule this time.', hand: 'tap' },
  ],
  TutorialScene: TeachScene,
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re running the check-in scale.</strong> Work out x — the mystery case&apos;s weight — that makes each equation balance. When a case has a weight <em>rule</em> instead, shade every weight it&apos;s allowed to be.</>, ticket: { title: 'Find x', badge: '2x + 3 = 11', tone: 'a' }, startLabel: 'Step up to the scale →' },
  overview: {
    say: "Here is what we are figuring out: a check-in scale balances only when both pans weigh the same. The left pan holds a mystery case plus a three-kilo weight, and the right pan reads eight kilos. We will find the case's weight — the x that makes x plus three equal eight — and it comes out to five.",
    problem: <>What does the mystery case weigh? We&apos;ll solve <strong>x + 3 = 8</strong> so both pans balance.</>,
    points: [
      <>The scale balances only when the two pans weigh <strong>exactly the same</strong>.</>,
      <>The left pan is <strong>x + 3</strong> (the case plus a 3&nbsp;kg weight); the right pan reads <strong>8</strong>.</>,
      <>We&apos;ll build x up one kilo at a time until it balances — <strong>x = 5</strong>.</>,
    ],
  },
  sig: (t) => t.badge,
}

export default function BalanceBench(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
