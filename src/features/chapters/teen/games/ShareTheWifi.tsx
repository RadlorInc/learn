'use client'
/**
 * ShareTheWifi — the Rational Functions chapter (17–18) as a PLAYABLE GAME.
 *
 * World: SHARE THE WIFI. One connection, and everyone in the house on it. Two things
 * a rational function does are things you have actually felt:
 *   • the VERTICAL asymptote = the load the connection cannot take. Approach it and
 *     the wait time runs away to nothing-is-loading.
 *   • the HORIZONTAL asymptote = what the speed settles down to once there are
 *     plenty of devices — sometimes a real level, sometimes effectively nothing,
 *     and sometimes it never settles at all.
 *
 * ⚠️ THIS CHAPTER HAD ZERO NUMERIC ANSWERS AND NOW HAS ALMOST NOTHING ELSE. Every one
 * of the old lesson's eight answers was a STRING — "x = 4", "y = 0", "hole at x = 3".
 * All three are a number (plus, twice, a one-bit choice), so all three are BUILT:
 *   • TAP   → AnswerPad: the load that breaks it. "x = 4" is the number 4.
 *   • SET   → the LEVEL DIAL: where the speed settles, with a "never settles" switch
 *             for the case that grows without bound. A value and a flag, not a card.
 *   • MARK  → the FAULT MARKER: put the marker on the load that misbehaves and say
 *             which kind it is — a WALL you can never reach, or a GAP where the
 *             formula has nothing to say but the connection is perfectly fine.
 *
 * ZERO pickers. (docs/teen-17-18-gameshell-plan.md §3.)
 *
 * ⚠️ TWO HONEST LIMITS, both marked in place below:
 *   • the L1 break point is drawn POSITIVE, because a negative number of devices is
 *     not a thing. That loses the `x + 3 → −3` sign case the old lesson had.
 *   • a HOLE has no real wifi meaning — a wall is a capacity, but a removable
 *     discontinuity is an artefact of a shared factor. It is framed as a gap in the
 *     FORMULA rather than in the connection, which is what it actually is.
 *     (plan §5.1, seam 3.)
 */
import { type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, CommitBtn, Nudge, numChoices } from './parts/gameKit'
import { rint } from '@/core/rand'
import { disp } from '@/core/fmt'

const P: Palette = {
  nightTop: '#122036', nightBot: '#070d18',
  cream: '#e9f1fb', creamSoft: 'rgba(233,241,251,0.82)',
  inkOnPaper: '#122036', mutedOnPaper: '#7188a5',
  gold: '#7cd4ff', goldDeep: '#2a86c9',
  coral: '#ff8e8e', coralDeep: '#dd5555', mint: '#6fe3b5',
  glass: 'rgba(18,36,60,0.62)', glassBorder: 'rgba(233,241,251,0.2)',
}


// A break point (tapped), a settling level (dialled, or "never"), or a marked fault.
type V =
  | { k: 'num'; n: number }
  | { k: 'level'; n: number; never: boolean }
  | { k: 'mark'; x: number; fault: 'wall' | 'gap' }

interface Task extends BaseTask {
  kind: 'break' | 'level' | 'fault'
  n?: number; pad?: number[]
  /** level: the value it settles at, or never */
  lvl?: number; never?: boolean
  /** fault: which load misbehaves, and how */
  x?: number; fault?: 'wall' | 'gap'
}

// ── L1 · the load it cannot take ──────────────────────────────────────────────
/** ⚠️ `a` is POSITIVE by construction — see the header. A wall at −3 devices is not
 *  a thing, and a context that claimed one would be false for that seed. */
function breakTask(): Task {
  const a = rint(1, 6)
  const top = Math.random() < 0.5 ? 'x' : '1'
  return {
    kind: 'break', title: 'The wall', tone: 'a',
    badge: `f(x) = ${top} / (x − ${a})`,
    prompt: 'Which load breaks it?',
    context: 'Here x is how many devices are on the connection. The formula falls apart at exactly the load that makes the bottom of the fraction zero — you can never divide by nothing, and in the house that is the point where nothing loads at all.',
    padInstruction: 'Tap the number of devices that breaks it.',
    say: `Where is the vertical asymptote of ${top === '1' ? 'one' : 'x'} over x minus ${a}?`,
    work: [
      'A vertical asymptote sits wherever the bottom of the fraction hits zero.',
      `x − ${a} = 0 when x = ${a}, so that is the wall.`,
    ],
    // −a is the sign slip; 0 is "the bottom is x"; a+1 an off-by-one.
    n: a, pad: [-a, 0, a + 1],
  }
}

// ── L2 · what it settles down to ──────────────────────────────────────────────
/** ⚠️ In the equal-degree case the leading coefficients are drawn so the ratio is a
 *  WHOLE number (top = bottom × m). The old lesson answered with the fraction "5/3"
 *  as a string; the answer is dialled now, so the ratio has to be settable. The
 *  skill — divide the leading coefficients — is untouched, and the child still has
 *  to divide, because the top is never just written as the answer. */
function levelTask(): Task {
  const roll = rint(0, 2)
  if (roll === 0) {
    const p = rint(2, 6), q = rint(1, 4)
    return {
      kind: 'level', title: 'Settling speed', tone: 'b',
      badge: `f(x) = ${p} / (x² + ${q})`, showEquals: false,
      prompt: 'What does it settle at?',
      context: 'As more and more devices join, the bottom of this fraction grows much faster than the top does. Each device is left with a share that keeps shrinking.',
      instruction: 'Set the level it settles at, then lock it in.',
      say: `What is the horizontal asymptote of ${p} over x squared plus ${q}?`,
      work: [
        'Compare how fast the top and the bottom grow.',
        'The bottom grows faster, so the share heads to nothing: it settles at 0.',
      ],
      lvl: 0, never: false,
    }
  }
  if (roll === 1) {
    const b = rint(1, 3), m = rint(2, 4)
    const a = b * m
    return {
      kind: 'level', title: 'Settling speed', tone: 'b',
      badge: `f(x) = (${a}x² + 1) / (${b}x² − 3)`, showEquals: false,
      prompt: 'What does it settle at?',
      context: 'Top and bottom here grow at the same rate, so neither one runs away from the other. Once there are plenty of devices, the small numbers stop mattering and only the two leading terms count.',
      instruction: 'Set the level it settles at, then lock it in.',
      say: `What is the horizontal asymptote of ${a} x squared plus one over ${b} x squared minus three?`,
      work: [
        'When the degrees match, the +1 and the −3 stop mattering as x grows.',
        `What is left is ${a}x² over ${b}x², which is ${a} ÷ ${b} = ${m}.`,
      ],
      lvl: m, never: false,
    }
  }
  const c = rint(2, 5)
  return {
    kind: 'level', title: 'Settling speed', tone: 'b',
    badge: `f(x) = (x² + ${c}) / (x + 1)`, showEquals: false,
    prompt: 'What does it settle at?',
    context: 'This time the top grows faster than the bottom. The value does not creep toward a level and stay there — it keeps climbing for as long as you keep adding devices.',
    instruction: 'Set the level it settles at, then lock it in.',
    say: `What is the horizontal asymptote of x squared plus ${c} over x plus one?`,
    work: [
      'The top grows faster than the bottom, so the fraction keeps growing with it.',
      'It never levels off — there is no horizontal asymptote.',
    ],
    lvl: 0, never: true,
  }
}

// ── L3 · a wall, or just a gap in the formula ─────────────────────────────────
/** ⚠️ The seam (see the header): a WALL is a real capacity, a GAP is an artefact of a
 *  factor that cancels. The wording keeps that distinction honest instead of
 *  pretending a removable discontinuity is something the house would notice. */
function faultTask(): Task {
  const h = rint(1, 4)
  const gap = Math.random() < 0.5
  return {
    kind: 'fault', title: gap ? 'Gap or wall?' : 'Gap or wall?', tone: 'a',
    badge: `f(x) = (x − ${h})(x − 5) / ((x − ${h}) · x)`,
    prompt: gap ? `What is at x = ${h}?` : 'Where is the real wall?',
    context: `The factor (x − ${h}) sits on the top AND the bottom, so it cancels. A load that only ever appeared in a cancelled factor is a GAP — the formula has nothing to say there, but nothing actually breaks. A load still left on the bottom afterwards is a real WALL.`,
    instruction: 'Mark the load, say which kind, then lock it in.',
    say: gap
      ? `A factor cancels top and bottom. What happens at x equals ${h}?`
      : 'After the common factor cancels, where is the real vertical asymptote?',
    work: [
      `(x − ${h}) cancels, so x = ${h} is only a gap — a missing reading, not a breakdown.`,
      'The x left on the bottom does not cancel, so x = 0 is the real wall.',
      gap ? `The question asked about x = ${h}: that is a gap.` : 'So the wall is at x = 0.',
    ],
    x: gap ? h : 0, fault: gap ? 'gap' : 'wall',
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return breakTask()
  if (d === 2) return levelTask()
  return Math.random() < 0.5 ? faultTask() : levelTask()
}

// ══════════════════════════════════════════════════════════════════════════════
// THE LEVEL DIAL — where the speed settles, or a switch for "it never does".
// ══════════════════════════════════════════════════════════════════════════════
function LevelDial({ value, setValue, disabled, reveal, onCommit }: {
  value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const n = value.k === 'level' ? value.n : 0
  const never = value.k === 'level' ? value.never : false
  const col = reveal ? P.mint : P.gold
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      {/* the connection settling, drawn from the child's own answer */}
      <svg viewBox="0 0 240 130" width="100%" style={{ maxWidth: 'clamp(190px, 25vw, 300px)', display: 'block' }} aria-hidden>
        <rect x={0} y={0} width={240} height={130} rx={10} fill="rgba(0,0,0,0.26)" stroke={P.glassBorder} strokeWidth={1} />
        <line x1={26} y1={112} x2={230} y2={112} stroke={P.glassBorder} strokeWidth={1} />
        <line x1={26} y1={10} x2={26} y2={112} stroke={P.glassBorder} strokeWidth={1} />
        <text x={228} y={126} textAnchor="end" fill={P.mutedOnPaper} fontSize={8} fontFamily="var(--font-numeric)">DEVICES →</text>
        {never ? (
          <path d="M 26 108 Q 130 100 220 14" fill="none" stroke={col} strokeWidth={2.5} />
        ) : (
          <>
            <line x1={26} y1={112 - n * 11} x2={230} y2={112 - n * 11} stroke={col} strokeWidth={2} strokeDasharray="6 5" opacity={0.9} />
            <path d={`M 26 18 Q 96 ${112 - n * 11} 230 ${112 - n * 11 + 1}`} fill="none" stroke={P.creamSoft} strokeWidth={2.5} />
          </>
        )}
      </svg>

      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px,2.6vw,34px)', fontWeight: 800, color: col }}>
        {never ? 'never settles' : `settles at ${disp(n)}`}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1vw,14px)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Nudge P={P} label="−" disabled={disabled || never} onClick={() => setValue({ k: 'level', n: Math.max(0, n - 1), never })} />
        <span style={{ minWidth: 'clamp(30px,3vw,44px)', textAlign: 'center', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(18px,2vw,28px)', color: never ? P.mutedOnPaper : P.cream }}>{disp(n)}</span>
        <Nudge P={P} label="+" disabled={disabled || never} onClick={() => setValue({ k: 'level', n: Math.min(8, n + 1), never })} />
        <button type="button" disabled={disabled} onClick={() => setValue({ k: 'level', n, never: !never })}
          style={{
            padding: 'clamp(9px,1vw,13px) clamp(12px,1.4vw,20px)', borderRadius: 10, minHeight: 44,
            border: `2px solid ${never ? col : P.glassBorder}`, background: never ? `${col}22` : P.glass,
            color: never ? col : P.creamSoft, fontFamily: 'var(--font-numeric)', fontWeight: 800,
            fontSize: 'clamp(11px,1.1vw,15px)', cursor: disabled ? 'default' : 'pointer',
          }}>never settles</button>
      </div>

      <CommitBtn P={P} label="LOCK IN ✓" disabled={disabled} onClick={() => onCommit({ k: 'level', n, never })} />
    </div>
  )
}

// ── THE FAULT MARKER — which load, and which kind of fault ────────────────────
function FaultMarker({ value, setValue, disabled, reveal, onCommit }: {
  value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const x = value.k === 'mark' ? value.x : 0
  const fault = value.k === 'mark' ? value.fault : 'wall'
  const col = reveal ? P.mint : P.gold
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px,2.6vw,34px)', fontWeight: 800, color: col }}>
        {fault === 'wall' ? 'wall' : 'gap'} at x = {disp(x)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1vw,14px)' }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => setValue({ k: 'mark', x: Math.max(0, x - 1), fault })} />
        <span style={{ minWidth: 'clamp(30px,3vw,44px)', textAlign: 'center', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(18px,2vw,28px)', color: P.cream }}>{disp(x)}</span>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => setValue({ k: 'mark', x: Math.min(8, x + 1), fault })} />
      </div>
      <div style={{ display: 'flex', gap: 'clamp(8px,1vw,14px)' }}>
        {([['wall', 'WALL — nothing gets through'], ['gap', 'GAP — no reading, but fine']] as const).map(([f, label]) => (
          <button key={f} type="button" disabled={disabled} onClick={() => setValue({ k: 'mark', x, fault: f })}
            style={{
              padding: 'clamp(9px,1vw,13px) clamp(10px,1.2vw,16px)', borderRadius: 10, minHeight: 44, maxWidth: 170,
              border: `2px solid ${fault === f ? col : P.glassBorder}`, background: fault === f ? `${col}22` : P.glass,
              color: fault === f ? col : P.creamSoft, fontFamily: 'var(--font-numeric)', fontWeight: 700,
              fontSize: 'clamp(10px,1vw,13px)', lineHeight: 1.3, cursor: disabled ? 'default' : 'pointer',
            }}>{label}</button>
        ))}
      </div>
      <CommitBtn P={P} label="MARK IT ✓" disabled={disabled} onClick={() => onCommit({ k: 'mark', x, fault })} />
    </div>
  )
}

// ── walkthrough: the two built gestures, one example each ─────────────────────
const DEMO_LEVEL: Task = {
  kind: 'level', title: 'Settling speed', badge: 'f(x) = (6x² + 1) / (2x² − 3)', tone: 'b',
  prompt: '', say: '', work: [], lvl: 3, never: false,
}
const DEMO_LEVEL_STEPS: DemoStep<V>[] = [
  { say: 'Everyone in the house is on one connection. The question is what your speed settles down to once there are plenty of devices on it.', value: { k: 'level', n: 0, never: false }, board: '(6x² + 1) / (2x² − 3)' },
  { say: 'With only a few devices the small numbers still matter. But as more join, the plus one and the minus three become nothing next to the squared terms.', value: { k: 'level', n: 0, never: false }, board: 'x grows → +1, −3 stop mattering' },
  { say: 'So what is really left is six x squared over two x squared.', value: { k: 'level', n: 0, never: false }, board: '6x² / 2x²' },
  { say: 'The x squareds cancel, and six divided by two is three.', value: { k: 'level', n: 3, never: false }, board: '6 ÷ 2 = 3' },
  { say: 'So it settles at three. It never quite gets there, but it flattens out against it — and that flat line is the horizontal asymptote.', value: { k: 'level', n: 3, never: false }, board: 'settles at 3' },
]

const DEMO_FAULT: Task = {
  kind: 'fault', title: 'Gap or wall?', badge: 'f(x) = (x − 2)(x − 5) / ((x − 2) · x)', tone: 'a',
  prompt: '', say: '', work: [], x: 0, fault: 'wall',
}
const DEMO_FAULT_STEPS: DemoStep<V>[] = [
  { say: 'Now a trickier one. There are two loads here that look like they should break it — but only one of them really does.', value: { k: 'mark', x: 0, fault: 'wall' }, board: '(x−2)(x−5) / ((x−2)·x)' },
  { say: 'Look at the bottom. It is zero at two, and also at zero devices.', value: { k: 'mark', x: 2, fault: 'wall' }, board: 'bottom = 0 at x = 2 and x = 0' },
  { say: 'But the factor x minus two is on the top as well, so it cancels straight out.', value: { k: 'mark', x: 2, fault: 'gap' }, board: '(x−2) cancels' },
  { say: 'That makes two a gap, not a wall. The formula simply has no reading there — the connection itself is perfectly fine at two devices.', value: { k: 'mark', x: 2, fault: 'gap' }, board: 'x = 2 → gap' },
  { say: 'The x on the bottom has nothing to cancel with, so it stays.', value: { k: 'mark', x: 0, fault: 'wall' }, board: 'x stays on the bottom' },
  { say: 'So the real wall is at zero. A factor that cancels leaves a gap; a factor that survives leaves a wall.', value: { k: 'mark', x: 0, fault: 'wall' }, board: 'real wall: x = 0' },
]

// ══════════════════════════════════════════════════════════════════════════════
const CONFIG: GameConfig<V, Task> = {
  chapterId: 'rationalFunctions',
  title: 'SHARE THE WIFI',
  ticketLabel: 'connection log',
  palette: P,
  motif: '📶',
  makeTask,
  // Only the break point is a bare number, so only it is tapped.
  answerPad: (t) => (t.kind === 'break' ? numChoices(t.n ?? 0, t.pad ?? []) : []),
  // REQUIRED: V is a tagged union (docs/lessons.md — the 15–16 prod bug).
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) =>
    t.kind === 'level' ? { k: 'level', n: 0, never: false }
      : t.kind === 'fault' ? { k: 'mark', x: 0, fault: 'wall' }
        : { k: 'num', n: 0 },
  grade: (t, v) =>
    t.kind === 'break' ? v.k === 'num' && v.n === t.n
      : t.kind === 'level' ? v.k === 'level' && v.never === t.never && (t.never || v.n === t.lvl)
        : v.k === 'mark' && v.x === t.x && v.fault === t.fault,
  revealText: (t) =>
    t.kind === 'break' ? `x = ${disp(t.n ?? 0)}`
      : t.kind === 'level' ? (t.never ? 'never settles' : `y = ${disp(t.lvl ?? 0)}`)
        : `${t.fault} at x = ${disp(t.x ?? 0)}`,
  glide: (t, _f, setValue, later) => later(() => setValue(
    t.kind === 'break' ? { k: 'num', n: t.n ?? 0 }
      : t.kind === 'level' ? { k: 'level', n: t.lvl ?? 0, never: !!t.never }
        : { k: 'mark', x: t.x ?? 0, fault: t.fault ?? 'wall' }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, onCommit }): ReactElement =>
    task.kind === 'fault'
      ? <FaultMarker value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
      : <LevelDial value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />,
  TutorialScene: ({ task, value }) =>
    task.kind === 'fault'
      ? <FaultMarker value={value} setValue={() => {}} disabled onCommit={() => {}} />
      : <LevelDial value={value} setValue={() => {}} disabled onCommit={() => {}} />,
  start: {
    blurb: <><strong>One connection, the whole house on it.</strong> Find the load it simply cannot take, work out what the speed settles down to once everyone is on — and tell a real wall apart from a gap where the formula just has nothing to say.</>,
    ticket: { title: 'Connection', badge: '6x² / 2x²', tone: 'b' },
    startLabel: 'Check the line →',
  },
  overview: {
    say: 'Here is the plan. Everyone in the house shares one connection, and x is how many devices are on it. Two things can happen. There can be a load the connection simply cannot take — that is where the bottom of the fraction hits zero. And there is a speed it settles down to once plenty of devices have joined, which you find by seeing whether the top or the bottom grows faster. Let us work one out together, nice and slow.',
    problem: <>What does <strong>(6x² + 1) / (2x² − 3)</strong> settle at?</>,
    points: [
      <>The bottom hitting <strong>zero</strong> is a wall you can never reach.</>,
      <>Bottom grows faster → it settles at <strong>0</strong>.</>,
      <>Same growth → it settles at the <strong>ratio</strong> of the leading terms.</>,
      <>Top grows faster → it <strong>never settles</strong>.</>,
    ],
  },
  tutorial: [
    { task: DEMO_LEVEL, initial: { k: 'level', n: 0, never: false }, hand: 'tap', steps: DEMO_LEVEL_STEPS },
    { task: DEMO_FAULT, initial: { k: 'mark', x: 0, fault: 'wall' }, hand: 'tap', steps: DEMO_FAULT_STEPS },
  ],
  sig: (t) => `${t.kind}:${t.badge}:${t.prompt}`,
}

export default function ShareTheWifi(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
