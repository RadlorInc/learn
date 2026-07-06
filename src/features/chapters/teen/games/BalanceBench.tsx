'use client'
/**
 * BalanceBench — the Equations & Inequalities chapter as a PLAYABLE GAME.
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
import type { ReactNode } from 'react'
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, BalanceBeam, pick, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#101d24', nightBot: '#152a33',
  cream: '#eafaff', creamSoft: 'rgba(234,250,255,0.82)',
  inkOnPaper: '#16303a', mutedOnPaper: '#6f8f9a',
  gold: '#5fd0e6', goldDeep: '#2a9cbb',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#5fe0b0',
  glass: 'rgba(16,29,36,0.6)', glassBorder: 'rgba(234,250,255,0.22)',
}

interface Task extends BaseTask { m: number; c: number; right: number; answer: number; leftExpr: string; min: number; max: number }

interface Spec { leftExpr: string; m: number; c: number; right: number; answer: number; min: number; max: number }
const L1: Spec[] = [
  { leftExpr: 'x + 3', m: 1, c: 3, right: 7, answer: 4, min: 0, max: 10 },
  { leftExpr: '2x', m: 2, c: 0, right: 10, answer: 5, min: 0, max: 10 },
  { leftExpr: 'x − 4', m: 1, c: -4, right: 1, answer: 5, min: 0, max: 12 },
]
const L2: Spec[] = [
  { leftExpr: '2x + 3', m: 2, c: 3, right: 11, answer: 4, min: 0, max: 10 },
  { leftExpr: '3x − 2', m: 3, c: -2, right: 10, answer: 4, min: 0, max: 10 },
  { leftExpr: '5x', m: 5, c: 0, right: -15, answer: -3, min: -6, max: 6 },
]
const L3: Spec[] = [
  { leftExpr: 'x/2', m: 0.5, c: 0, right: 6, answer: 12, min: 0, max: 16 },
  { leftExpr: '4x − 1', m: 4, c: -1, right: 11, answer: 3, min: 0, max: 10 },
  { leftExpr: '2x + 5', m: 2, c: 5, right: 17, answer: 6, min: 0, max: 12 },
]

function fromSpec(s: Spec): Task {
  const badge = `${s.leftExpr} = ${s.right}`
  return {
    title: 'Find x', badge, tone: s.right < 0 ? 'b' : 'a',
    prompt: `Weigh the case: ${s.leftExpr} = ${s.right}. Work out x, set the dial, then press Weigh to check.`,
    say: `Weigh the case so that ${s.leftExpr} equals ${s.right} kilograms. Work out x, set the dial, then press weigh to check if it balances.`,
    m: s.m, c: s.c, right: s.right, answer: s.answer, leftExpr: s.leftExpr, min: s.min, max: s.max,
    work: [`Find the x that makes ${s.leftExpr} equal ${s.right}.`, `x = ${s.answer} makes both pans read ${s.right}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool = d === 1 ? L1 : d === 2 ? L2 : L3
  return fromSpec(pick(pool))
}

// ── worked example for the walkthrough (x + 3 = 8 → 5) + guided order (x + 1 = 4 → 3) ──
const DEMO_TASK: Task = {
  title: 'Find x', badge: 'x + 3 = 8', tone: 'a',
  m: 1, c: 3, right: 8, answer: 5, leftExpr: 'x + 3', min: 0, max: 10,
  prompt: '', say: '', work: [],
}
const GUIDED_TASK: Task = {
  title: 'Find x', badge: 'x + 1 = 4', tone: 'a',
  m: 1, c: 1, right: 4, answer: 3, leftExpr: 'x + 1', min: 0, max: 10,
  prompt: 'Weigh x + 1 = 4. Work out x, set the dial, then press Weigh.',
  say: 'Weigh the case so x plus one equals four. Work out x, set the dial, then press weigh to check.',
  work: ['Find the x that makes x + 1 equal 4.', 'x = 3 makes both pans read 4.'],
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
function BaggageScaleScene({ palette: P, value, stepIndex, frameCount, ended }: {
  palette: Palette; value: number; stepIndex: number; frameCount: number; ended: boolean
}) {
  const x = Math.max(0, Math.min(DEMO_ANS + 1, value))
  const left = x + DEMO_M                       // left pan weight = x + 3
  const diff = left - DEMO_RIGHT                // <0 too light, 0 balanced, >0 heavy
  const resultPhase = ended || stepIndex >= frameCount - 2   // last 2 beats: the answer
  const intro = stepIndex === 0
  const balanced = Math.abs(diff) < 1e-6
  // beam tips toward the heavier side; left too light → right pan drops (positive rotate)
  const tilt = balanced ? 0 : Math.max(-15, Math.min(15, -diff * 3))
  const beamCol = resultPhase && balanced ? P.mint : P.gold
  const caseReveal = resultPhase && balanced       // reveal x's value on the case
  const verdict = balanced ? 'Balanced ✓' : diff < 0 ? 'Too light — right pan drops' : 'Too heavy'
  const verdictCol = balanced ? P.mint : P.coral

  // a single upright pan (counter-rotates the beam so it hangs level)
  const Pan = ({ side, children }: { side: -1 | 1; children: ReactNode }) => (
    <g transform={`translate(${side * 84} 0)`}>
      {/* hanging cords */}
      <line x1={-18} y1={0} x2={0} y2={30} stroke={P.glassBorder} strokeWidth={1.4} />
      <line x1={18} y1={0} x2={0} y2={30} stroke={P.glassBorder} strokeWidth={1.4} />
      {/* the pan keeps itself upright by cancelling the beam's tilt */}
      <g transform={`rotate(${-tilt})`} style={{ transition: 'transform 620ms cubic-bezier(.45,.05,.25,1)' }}>
        <path d={`M -26 30 Q 0 44 26 30`} fill={P.glass} stroke={P.glassBorder} strokeWidth={1.4} />
        <g transform="translate(0 30)">{children}</g>
      </g>
    </g>
  )

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
          {/* the beam + its pans rotate together */}
          <g transform={`rotate(${tilt})`} style={{ transition: 'transform 620ms cubic-bezier(.45,.05,.25,1)' }}>
            <rect x={-92} y={-4} width={184} height={8} rx={4} fill={beamCol}
              style={{ transition: 'fill 500ms', filter: resultPhase && balanced ? `drop-shadow(0 0 9px ${P.mint})` : undefined }} />
            <circle cx={-84} cy={0} r={4} fill={beamCol} />
            <circle cx={84} cy={0} r={4} fill={beamCol} />
            <Pan side={-1}><Suitcase /><KnownWeights /></Pan>
            <Pan side={1}>
              <g transform="translate(0 -22)">
                <image href={`${ART}/bag_weight.png`} x={-17} y={0} width={34} height={22} preserveAspectRatio="none" />
                <text x={0} y={15} textAnchor="middle" fontFamily="var(--font-numeric)" fontWeight={800} fontSize={13} fill={P.inkOnPaper}>8</text>
              </g>
            </Pan>
          </g>
          {/* the pivot / stand (fixed) */}
          <polygon points="0,4 -15,64 15,64" fill={P.glassBorder} />
          <rect x={-34} y={64} width={68} height={7} rx={3} fill={P.glassBorder} />
        </g>
      </svg>

      {/* the running arithmetic line — the board math, echoed */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', marginBottom: '22%', fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(16px,2.4vw,24px)', color: caseReveal ? P.mint : P.cream, transition: 'color 400ms' }}>
        {caseReveal ? '5 + 3 = 8' : intro ? '' : `${x} + 3 = ${left}`}
      </div>

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

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'equationsInequalities',
  title: 'BAGGAGE SCALE',
  motif: '🧳',
  ticketLabel: 'weigh-in',
  palette: P,
  makeTask,
  initialValue: (t) => t.min,
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `x = ${t.answer}`,
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => (
    <BalanceBeam P={palette} x={value} setX={setValue} min={task.min} max={task.max} leftOf={(x) => task.m * x + task.c} right={task.right} leftExpr={task.leftExpr} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="WEIGH ✓" />
  ),
  tutorial: {
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
      { say: "Balanced means solved: the mystery case weighs five kilos. Press weigh when it's level. Now let's try one together.", value: 5, hand: 'tap', board: 'x = 5' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'drag',
  },
  TutorialScene: BaggageScaleScene,
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re running the check-in scale.</strong> Work out x — the mystery case&apos;s weight — that makes each equation balance, set the dial, then weigh it. Balanced means solved; over or under means try again.</>, ticket: { title: 'Find x', badge: '2x + 3 = 11', tone: 'a' }, startLabel: 'Step up to the scale →' },
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
