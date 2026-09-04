'use client'
/**
 * Pace — the Intro to Calculus chapter (17–18) as a PLAYABLE GAME.
 *
 * World: PACE. Your running app. It shows two numbers that are not the same thing:
 * your AVERAGE pace for the whole run so far, and the pace it is showing you RIGHT
 * NOW. That difference is the entire chapter:
 *   • average rate of change   = average pace between two points of the run
 *   • the secant → the tangent = shrinking the window until "average" becomes "now"
 *   • the derivative           = the number the app shows at this instant
 *   • the power rule           = the rule that produces that number without measuring
 *
 * ⚠️ WHY MOST OF THIS CHAPTER IS TAPPED, NOT DRIVEN ON THE TRACE. GameShell hides the
 * instrument on any question that shows the AnswerPad, so a padded question cannot
 * also have an illustration — and, more importantly, a trace that displays the slope
 * live IS the answer, handed over before the child commits (the green-Ready-button
 * fault from chapter 4, and the rejected live-tilt balance beam in the teen band).
 * So the trace appears where the GESTURE is the idea and the number is not shown,
 * and everywhere else the answer is tapped with real misconception distractors.
 *
 *   • TAP   → AnswerPad: limits by substitution, average rate of change, and f′(a).
 *             Distractors are the actual mistakes — reading the rise alone as the
 *             rate, f(a) instead of f′(a), and dropping the −1 off the exponent.
 *   • SHRINK→ the WINDOW TRACE: the limit question. The child steps the window down
 *             (h = 2 → 1.5 → 1 → 0.5) and watches the average pace settle, then
 *             commits what it is heading for. ⚠️ The window NEVER reaches zero and
 *             the dial only takes whole numbers, so the readout can never BE the
 *             answer — the child has to take the limit, not read it.
 *   • BUILD → the RULE BUILDER: the power rule, whose answer is an expression
 *             (3x²) — a coefficient and an exponent, so it is two numbers in a
 *             template, built rather than picked.
 *
 * ZERO pickers. The old lesson's one conceptual MCQ ("as Q slides toward P, the
 * secant approaches…") is replaced by the window gesture, which asks the same thing
 * and makes the child do it instead of recognise it. (plan §5.2, #13.)
 */
import { useState, type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SlideValue, CommitBtn, Nudge, numChoices } from './parts/gameKit'
import { rint } from '@/core/rand'
import { disp } from '@/core/fmt'

const P: Palette = {
  nightTop: '#2a1a33', nightBot: '#140a1a',
  cream: '#f5eef7', creamSoft: 'rgba(245,238,247,0.82)',
  inkOnPaper: '#2a1a33', mutedOnPaper: '#8d7a96',
  gold: '#ffcf5c', goldDeep: '#c9962a',
  coral: '#ff8fb0', coralDeep: '#dd5a84', mint: '#7ae0c0',
  glass: 'rgba(44,26,54,0.6)', glassBorder: 'rgba(245,238,247,0.2)',
}

const SUP: Record<string, string> = { '2': '²', '3': '³', '4': '⁴' }
const sup = (n: number) => SUP[String(n)] ?? `^${n}`
/** Render c·x^p the way the board and the builder both show it. */
const deriv = (c: number, p: number) => (p === 0 ? disp(c) : p === 1 ? `${c === 1 ? '' : disp(c)}x` : `${c === 1 ? '' : disp(c)}x${sup(p)}`)

// The answer is a NUMBER (tapped, or dialled on the window trace) or an EXPRESSION
// built as a coefficient and an exponent.
type V = { k: 'num'; n: number } | { k: 'deriv'; c: number; p: number }

interface Task extends BaseTask {
  kind: 'limitsub' | 'avgrate' | 'window' | 'deriv' | 'inst'
  n?: number; pad?: number[]
  /** the built derivative */
  c?: number; p?: number
  /** window trace: f(x) = x², P sits at x = a, and the limit is 2a */
  a?: number
}

// ── L1 · read the app ─────────────────────────────────────────────────────────
function limitTask(): Task {
  const square = Math.random() < 0.5
  const c = rint(2, 4)
  if (square) {
    const n = c * c + 1
    return {
      kind: 'limitsub', title: 'Closing in', tone: 'a',
      badge: `lim (x→${c})  x² + 1`,
      prompt: 'What does it approach?',
      context: `A limit asks where a value is HEADING as the input closes in on ${c}. This expression has no gap or jump anywhere, so where it is heading is simply where it already is.`,
      padInstruction: 'Tap what the value approaches.',
      say: `What is the limit as x approaches ${c} of x squared plus one?`,
      work: [`Nothing breaks at x = ${c}, so put the number straight in.`, `(${c})² + 1 = ${n}.`],
      n, pad: [c * c, n + 1, 2 * c + 1],
    }
  }
  const k = rint(2, 3)
  const n = k * c
  return {
    kind: 'limitsub', title: 'Closing in', tone: 'a',
    badge: `lim (x→${c})  ${k}x`,
    prompt: 'What does it approach?',
    context: `A limit asks where a value is HEADING as the input closes in on ${c}. Nothing breaks here, so where it is heading is where it already is.`,
    padInstruction: 'Tap what the value approaches.',
    say: `What is the limit as x approaches ${c} of ${k} x?`,
    work: [`Nothing breaks at x = ${c}, so substitute.`, `${k} × ${c} = ${n}.`],
    n, pad: [n + k, n - k, k + c],
  }
}

/** ⚠️ The distractor that matters here is `y2 − y1` — the rise on its own. Calling
 *  the rise the rate is the single commonest mistake in this idea, and it must be
 *  on the pad or the question is not testing anything. */
function avgRateTask(hard: boolean): Task {
  if (!hard) {
    const x1 = rint(0, 2), x2 = x1 + rint(1, 3)
    const y1 = rint(1, 6), slope = rint(1, 4)
    const y2 = y1 + slope * (x2 - x1)
    return {
      kind: 'avgrate', title: 'Average pace', tone: 'b',
      badge: `(${x1}, ${y1}) → (${x2}, ${y2})`,
      prompt: 'What was the average pace?',
      context: `Two readings from the run: at minute ${x1} you had covered ${y1}, and at minute ${x2} you had covered ${y2}. Average pace is how much ground you covered for each minute — not how much ground you covered in total.`,
      padInstruction: 'Tap the average pace, per minute.',
      say: `From minute ${x1} at ${y1}, to minute ${x2} at ${y2}. What is the average rate of change?`,
      work: [
        'Average pace is the change in distance divided by the change in time.',
        `(${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${y2 - y1} ÷ ${x2 - x1} = ${slope}.`,
      ],
      n: slope, pad: [y2 - y1, slope + 1, slope - 1],
    }
  }
  const a = rint(1, 3), b = a + rint(1, 3)
  const n = a + b   // (b² − a²)/(b − a)
  return {
    kind: 'avgrate', title: 'Average pace', tone: 'b',
    badge: `f(x) = x²   over  [${a}, ${b}]`,
    prompt: 'What was the average pace?',
    context: `This run speeds up as it goes: after x minutes you have covered x² of ground. Between minute ${a} and minute ${b}, what was the pace on average?`,
    padInstruction: 'Tap the average pace over that stretch.',
    say: `For f of x equals x squared, what is the average rate of change from ${a} to ${b}?`,
    work: [
      `Ground covered goes from ${a * a} to ${b * b}, over ${b - a} minute${b - a === 1 ? '' : 's'}.`,
      `(${b * b} − ${a * a}) ÷ (${b} − ${a}) = ${b * b - a * a} ÷ ${b - a} = ${n}.`,
    ],
    n, pad: [b * b - a * a, n + 1, n - 1],
  }
}

// ── L2 · the rule that skips the measuring ────────────────────────────────────
function derivTask(): Task {
  const p = rint(2, 4)
  return {
    kind: 'deriv', title: 'The rule', tone: 'a',
    badge: `d/dx  x${sup(p)}`, answerLabel: '=',
    prompt: 'What is the derivative?',
    context: 'Instead of measuring the pace at every instant, one rule gives it straight from the formula: bring the exponent down in front, then knock one off the exponent.',
    instruction: 'Build the derivative, then lock it in.',
    say: `Using the power rule, what is the derivative of x to the ${p}?`,
    work: [
      'The power rule does two things, and both have to happen.',
      `Bring the ${p} down in front, and take the exponent from ${p} to ${p - 1}.`,
      `So d/dx x${sup(p)} = ${deriv(p, p - 1)}.`,
    ],
    c: p, p: p - 1,
  }
}

// ── L2/L3 · shrink the window until average becomes instant ───────────────────
/** ⚠️ The whole argument of the chapter, so it is a GESTURE and not a tap. The
 *  window bottoms out at h = 0.5, which reads 2a + 0.5 — deliberately NOT the
 *  answer, and not even settable on a whole-number dial. The child has to see where
 *  the numbers are heading. */
function windowTask(): Task {
  const a = rint(2, 5)
  const n = 2 * a
  return {
    kind: 'window', title: 'Right now', tone: 'b',
    badge: `f(x) = x²   at  x = ${a}`, showEquals: false,
    prompt: 'What pace is it showing right now?',
    context: `Average pace needs two moments to compare. The pace RIGHT NOW has only one — so take the average over a shorter and shorter window around minute ${a} and watch where the number is heading.`,
    instruction: 'Shrink the window, then set the pace it is heading for.',
    say: `For f of x equals x squared, what is the instantaneous rate at x equals ${a}?`,
    work: [
      'Each smaller window gives an average closer to the answer, but never lands on it.',
      `Here the averages run ${2 * a + 2}, ${2 * a + 1.5}, ${2 * a + 1}, ${2 * a + 0.5} — closing in on ${n}.`,
      `And the power rule agrees: f′(x) = 2x, so f′(${a}) = ${n}.`,
    ],
    a, n,
  }
}

// ── L3 · the derivative at a point ────────────────────────────────────────────
function instTask(): Task {
  if (Math.random() < 0.5) {
    const a = rint(2, 5)
    const n = 2 * a
    return {
      kind: 'inst', title: 'At that instant', tone: 'a',
      badge: `f(x) = x²    f′(${a})`,
      prompt: 'What is the pace at that instant?',
      context: `Ground covered is x² after x minutes. The power rule turns that into a pace formula, and you want the pace at the single instant minute ${a}.`,
      padInstruction: 'Tap the pace at that instant.',
      say: `For f of x equals x squared, what is f prime of ${a}?`,
      work: ['The power rule gives f′(x) = 2x.', `So f′(${a}) = 2 × ${a} = ${n}.`],
      // f(a) instead of f′(a) is the misconception — reading the distance as the pace.
      n, pad: [a * a, n + 2, n - 2],
    }
  }
  const a = rint(1, 3)
  const n = 3 * a * a
  return {
    kind: 'inst', title: 'At that instant', tone: 'a',
    badge: `f(x) = x³    f′(${a})`,
    prompt: 'What is the pace at that instant?',
    context: `This run accelerates harder: x³ of ground after x minutes. Use the power rule to get the pace formula, then read it at minute ${a}.`,
    padInstruction: 'Tap the pace at that instant.',
    say: `For f of x equals x cubed, what is f prime of ${a}?`,
    work: ['The power rule gives f′(x) = 3x².', `So f′(${a}) = 3 × ${a}² = ${n}.`],
    n, pad: [a * a * a, n + 3, 3 * a],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return Math.random() < 0.5 ? limitTask() : avgRateTask(false)
  if (d === 2) return Math.random() < 0.5 ? avgRateTask(true) : derivTask()
  const roll = Math.random()
  if (roll < 0.4) return windowTask()
  return instTask()
}

/** ⚠️ MODULE LEVEL, NOT INSIDE THE INSTRUMENT. Declared in the parent this is a new component
 *  TYPE on every render, so React unmounts and remounts the whole row each time the value
 *  changes — throwing away the button elements the child is tapping and restarting every
 *  transition on them. `disabled` becomes a prop; the palette is already module scope. */
function Part({ label, val, lo, hi, on, disabled }: { label: string; val: number; lo: number; hi: number; on: (n: number) => void; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px,0.9vw,12px)' }}>
      <span style={{ width: 'clamp(74px,8vw,110px)', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px,1vw,13px)', letterSpacing: '0.07em', color: P.mutedOnPaper, textTransform: 'uppercase' }}>{label}</span>
      <Nudge P={P} label="−" disabled={disabled} onClick={() => on(Math.max(lo, val - 1))} />
      <span style={{ minWidth: 'clamp(30px,3vw,44px)', textAlign: 'center', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(18px,2vw,28px)', color: P.cream }}>{val}</span>
      <Nudge P={P} label="+" disabled={disabled} onClick={() => on(Math.min(hi, val + 1))} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// THE WINDOW TRACE — f(x) = x² drawn as the run, P pinned at x = a, Q sliding in.
// It shows the AVERAGE over the window, never the limit, and the window stops at
// 0.5 so the readout can never be the answer.
// ══════════════════════════════════════════════════════════════════════════════
const STEPS = [2, 1.5, 1, 0.5]
const W = 260, H = 180

function WindowTrace({ task, value, setValue, disabled, reveal, onCommit, hIdx, setHIdx }: {
  task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean
  onCommit: (v: V) => void; hIdx: number; setHIdx: (i: number) => void
}) {
  const a = task.a ?? 3
  const h = STEPS[hIdx]
  const n = value.k === 'num' ? value.n : 0
  const hi = (a + 2.4) ** 2
  const sx = (x: number) => 24 + (x / (a + 2.4)) * (W - 36)
  const sy = (y: number) => H - 22 - (y / hi) * (H - 40)
  const path = Array.from({ length: 41 }, (_, i) => {
    const x = ((a + 2.4) * i) / 40
    return `${i ? 'L' : 'M'} ${sx(x).toFixed(1)} ${sy(x * x).toFixed(1)}`
  }).join(' ')
  const avg = 2 * a + h   // ((a+h)² − a²)/h
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px,1.1vw,14px)', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 'clamp(210px, 28vw, 330px)', display: 'block' }} aria-hidden>
        <rect x={0} y={0} width={W} height={H} rx={10} fill="rgba(0,0,0,0.26)" stroke={P.glassBorder} strokeWidth={1} />
        <line x1={20} y1={H - 22} x2={W - 8} y2={H - 22} stroke={P.glassBorder} strokeWidth={1} />
        <line x1={24} y1={10} x2={24} y2={H - 18} stroke={P.glassBorder} strokeWidth={1} />
        <text x={W - 10} y={H - 8} textAnchor="end" fill={P.mutedOnPaper} fontSize={8} fontFamily="var(--font-numeric)">MINUTES</text>
        <path d={path} fill="none" stroke={P.creamSoft} strokeWidth={2} />
        {/* the secant across the window */}
        <line x1={sx(a)} y1={sy(a * a)} x2={sx(a + h)} y2={sy((a + h) ** 2)} stroke={P.gold} strokeWidth={2.5}
          style={{ transition: 'all 320ms cubic-bezier(.45,.05,.25,1)' }} />
        <circle cx={sx(a)} cy={sy(a * a)} r={5} fill={P.mint} />
        <text x={sx(a)} y={sy(a * a) + 17} textAnchor="middle" fill={P.mint} fontSize={9} fontFamily="var(--font-numeric)" fontWeight={800}>NOW</text>
        <circle cx={sx(a + h)} cy={sy((a + h) ** 2)} r={4.5} fill={P.gold} style={{ transition: 'all 320ms cubic-bezier(.45,.05,.25,1)' }} />
      </svg>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1vw,14px)' }}>
        <Nudge P={P} label="−" disabled={disabled || hIdx >= STEPS.length - 1} onClick={() => setHIdx(Math.min(STEPS.length - 1, hIdx + 1))} />
        <div style={{ textAlign: 'center', minWidth: 'clamp(120px,14vw,190px)' }}>
          <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(9px,0.9vw,12px)', letterSpacing: '0.1em', color: P.mutedOnPaper }}>WINDOW {h}</div>
          <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(16px,1.9vw,26px)', color: P.gold }}>average {avg}</div>
        </div>
        <Nudge P={P} label="+" disabled={disabled || hIdx <= 0} onClick={() => setHIdx(Math.max(0, hIdx - 1))} />
      </div>

      <SlideValue P={P} value={n} setValue={(x) => setValue({ k: 'num', n: x })} min={0} max={16}
        disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'num', n: x })} commitLabel="THAT'S THE PACE ✓" />
    </div>
  )
}

// ── THE RULE BUILDER — a coefficient and an exponent, shown as the expression ──
function RuleBuilder({ value, setValue, disabled, reveal, onCommit }: {
  value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const c = value.k === 'deriv' ? value.c : 1
  const p = value.k === 'deriv' ? value.p : 1
  const col = reveal ? P.mint : P.gold
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(28px,3.6vw,50px)', fontWeight: 800, color: col, textShadow: `0 0 18px ${(reveal ? '#3fa77c' : P.goldDeep)}55` }}>
        {deriv(c, p)}
      </div>
      <Part label="in front" val={c} lo={1} hi={6} on={(n) => setValue({ k: 'deriv', c: n, p })} disabled={disabled} />
      <Part label="exponent" val={p} lo={0} hi={5} on={(n) => setValue({ k: 'deriv', c, p: n })} disabled={disabled} />
      <CommitBtn P={P} label="LOCK IN ✓" disabled={disabled} onClick={() => onCommit({ k: 'deriv', c, p })} />
    </div>
  )
}

// ── walkthrough: the window shrinking, which is the chapter's whole argument ───
const DEMO: Task = {
  kind: 'window', title: 'Right now', badge: 'f(x) = x²   at  x = 3', tone: 'b',
  prompt: '', say: '', work: [], a: 3, n: 6,
}
const DEMO_STEPS: DemoStep<V>[] = [
  { say: 'Your running app shows two different numbers, and it is worth knowing why. One is your average pace for the run. The other is the pace right now.', value: { k: 'num', n: 0 }, board: 'average vs now' },
  { say: 'Average pace is easy, because it needs two moments. Take minute three, and minute five — two minutes apart.', value: { k: 'num', n: 0 }, board: 'window = 2' },
  { say: 'Over that window the average pace works out at eight.', value: { k: 'num', n: 0 }, board: 'average = 8' },
  { say: 'Now shrink the window. Minute three to minute four and a half — and the average drops to seven.', value: { k: 'num', n: 0 }, board: 'window 1.5 → 7' },
  { say: 'Shrink it again, and it is six and a half.', value: { k: 'num', n: 0 }, board: 'window 1 → 6.5' },
  { say: 'And again. Six and a quarter.', value: { k: 'num', n: 0 }, board: 'window 0.5 → 6.25' },
  { say: 'Watch what those numbers are doing. Eight, seven, six and a half, six and a quarter — every time the window halves, they close in on six.', value: { k: 'num', n: 6 }, board: '8, 7, 6.5, 6.25 → 6' },
  { say: 'They never actually reach it, because a window of zero has nothing to average. But six is clearly where they are heading, and that is the pace at that single instant. That is the derivative.', value: { k: 'num', n: 6 }, board: "f′(3) = 6" },
]

// ══════════════════════════════════════════════════════════════════════════════
export const CONFIG: GameConfig<V, Task> = {
  chapterId: 'introCalculus',
  title: 'PACE',
  ticketLabel: 'run log',
  palette: P,
  motif: '🏃',
  makeTask,
  // The window and the rule builder keep their instruments; the three numeric
  // question kinds are tapped.
  answerPad: (t) => (t.kind === 'window' || t.kind === 'deriv' ? [] : numChoices(t.n ?? 0, t.pad ?? [])),
  // REQUIRED: V is a tagged union (docs/lessons.md — the 15–16 prod bug).
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) => (t.kind === 'deriv' ? { k: 'deriv', c: 1, p: 1 } : { k: 'num', n: 0 }),
  grade: (t, v) => (t.kind === 'deriv'
    ? v.k === 'deriv' && v.c === t.c && v.p === t.p
    : v.k === 'num' && v.n === t.n),
  revealText: (t) => (t.kind === 'deriv' ? deriv(t.c ?? 1, t.p ?? 1) : disp(t.n ?? 0)),
  glide: (t, _f, setValue, later) => later(() => setValue(
    t.kind === 'deriv' ? { k: 'deriv', c: t.c ?? 1, p: t.p ?? 1 } : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, onCommit }): ReactElement => {
    if (task.kind === 'deriv') {
      return <RuleBuilder value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
    }
    if (task.kind === 'window') {
      return <WindowHost task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
    }
    // Fallback only: every other kind ships with `pad`, so the shell renders the
    // AnswerPad and never reaches this.
    return <SlideValue P={P} value={value.k === 'num' ? value.n : 0} setValue={(n) => setValue({ k: 'num', n })}
      min={0} max={30} disabled={disabled} reveal={reveal} onCommit={(n) => onCommit({ k: 'num', n })} commitLabel="LOCK IN ✓" />
  },
  TutorialScene: ({ value, stepIndex }) => (
    <WindowTrace task={DEMO} value={value} setValue={() => {}} disabled onCommit={() => {}}
      hIdx={Math.max(0, Math.min(STEPS.length - 1, stepIndex - 1))} setHIdx={() => {}} />
  ),
  start: {
    blurb: <><strong>Your running app shows two paces</strong> — your <strong>average</strong> for the run, and the one it is showing you <strong>right now</strong>. Work out both, then find out how the second one is even possible when a single instant has nothing to average.</>,
    ticket: { title: 'Run log', badge: 'f(x) = x²', tone: 'b' },
    startLabel: 'Start the run →',
  },
  overview: {
    say: 'Here is the plan. Your average pace compares two moments of the run — how much ground, divided by how much time. But the pace showing right now has only one moment, and you cannot divide by no time at all. So we take the average over a shorter and shorter window and watch where the number is heading. That is a limit, and the number it heads for is the derivative. Let us do one together, nice and slow.',
    problem: <>What pace is the app showing at <strong>minute 3</strong>?</>,
    points: [
      <><strong>Average pace</strong> = ground covered ÷ time taken.</>,
      <>A single instant has <strong>no time to divide by</strong>.</>,
      <>So shrink the window and see where the average is <strong>heading</strong>.</>,
      <>That number is the <strong>derivative</strong>.</>,
    ],
  },
  tutorial: [{ task: DEMO, initial: { k: 'num', n: 0 }, hand: 'tap', steps: DEMO_STEPS }],
  sig: (t) => `${t.kind}:${t.badge}`,
}

/** The window index is local UI state, not part of the graded value — the child's
 *  answer is the pace they commit, never which window they happened to stop on. */
function WindowHost(p: { task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void }) {
  const [hIdx, setHIdx] = useState(0)
  return <WindowTrace {...p} hIdx={hIdx} setHIdx={setHIdx} />
}

export default function Pace(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
