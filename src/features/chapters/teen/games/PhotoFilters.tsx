'use client'
/**
 * PhotoFilters — the Functions, Transformations & Composition chapter (17–18) as a
 * PLAYABLE GAME.
 *
 * World: PHOTO FILTERS. A photo editor's CURVES panel, which is a real tool and is
 * literally a function drawn as a graph: slider in, adjustment out. Everything the
 * chapter teaches is something that panel does:
 *   • evaluate f(a)      = where does the slider at a land?
 *   • f(x) + k           = lift the whole curve — brighter or darker everywhere
 *   • f(x − h)           = slide the curve sideways — the same effect, h later
 *   • −f(x)              = invert the filter
 *   • range              = the brightest / darkest this filter can ever output
 *   • composition        = stack a second filter on the first
 *   • inverse            = undo
 *
 * ⚠️ THE TRANSFORMATION QUESTION IS SET, NOT PICKED, AND THAT IS THE POINT. The old
 * lesson offered "Shift right 2 / Shift left 2 / Shift up 2 / Reflect" as four cards.
 * But the misconception it is testing — that a change INSIDE the bracket moves the
 * graph the OPPOSITE way to its sign — is a thing you have to DO before you believe
 * it. So the child moves the curve on the rack's own controls, and a wrong belief
 * shows up as a curve in the wrong place instead of as a card that merely looked
 * plausible. (docs/teen-17-18-gameshell-plan.md §5.2, #1.)
 *
 *   • TAP   → AnswerPad: evaluating, composing, and the inverse — all single numbers.
 *   • SET   → the FILTER RACK: shift across, shift up, invert.
 *   • RANGE → a direction chip and a boundary, which is what "y ≥ 3" actually is.
 *
 * ZERO pickers. The math is the old FunctionToolkitTeenLesson.makeRound, same ramp.
 */
import { type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, CommitBtn, Nudge, numChoices } from './parts/gameKit'
import { rint } from '@/core/rand'

const P: Palette = {
  nightTop: '#221f2e', nightBot: '#0e0d15',
  cream: '#f2f0f7', creamSoft: 'rgba(242,240,247,0.82)',
  inkOnPaper: '#221f2e', mutedOnPaper: '#87839a',
  gold: '#ffc978', goldDeep: '#c98f2a',
  coral: '#ff8f9c', coralDeep: '#dd5a6a', mint: '#79ddc4',
  glass: 'rgba(36,32,50,0.62)', glassBorder: 'rgba(242,240,247,0.2)',
}

const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const fmt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)

type V =
  | { k: 'num'; n: number }
  | { k: 'set'; dx: number; dy: number; flip: boolean }
  | { k: 'ray'; dir: '≥' | '≤'; at: number }

interface Task extends BaseTask {
  kind: 'eval' | 'shift' | 'range' | 'chain'
  n?: number; pad?: number[]
  dx?: number; dy?: number; flip?: boolean
  dir?: '≥' | '≤'; at?: number
}

// The four filter curves the L1 questions run on.
const RULES = [
  { text: 'f(x) = 2x + 3', say: 'f of x equals two x plus three', fn: (x: number) => 2 * x + 3 },
  { text: 'f(x) = 3x − 1', say: 'f of x equals three x minus one', fn: (x: number) => 3 * x - 1 },
  { text: 'f(x) = x² − 1', say: 'f of x equals x squared minus one', fn: (x: number) => x * x - 1 },
  { text: 'f(x) = x² + x', say: 'f of x equals x squared plus x', fn: (x: number) => x * x + x },
]

// ── L1 · run one value through the filter ─────────────────────────────────────
/** The input is the SLIDER SETTING, which is why it is allowed to be negative — a
 *  real photo slider runs both ways from zero. (A "pixel of value −3" would not be
 *  true for the seeds this generator draws.) */
function evalTask(): Task {
  const rule = pickOne(RULES)
  const a = rint(-3, 5)
  const n = rule.fn(a)
  return {
    kind: 'eval', title: 'Through the filter', tone: 'a',
    badge: `${rule.text}    f(${fmt(a)})`,
    prompt: 'What comes out?',
    context: `A filter is a machine: a setting goes in, one adjustment comes out. This one's rule is on the card, and the slider is at ${fmt(a)}.`,
    padInstruction: 'Tap what the filter puts out.',
    say: `Given ${rule.say}. What is f of ${spoken(a)}?`,
    work: [
      `Put ${fmt(a)} everywhere the rule has an x, brackets and all.`,
      `That gives ${fmt(n)}.`,
    ],
    n, pad: [n + 2, n - 2, a + n],
  }
}

// ── L2 · move the curve ───────────────────────────────────────────────────────
const SHIFTS = [
  { g: 'g(x) = f(x) + 3', say: 'f of x plus three', dx: 0, dy: 3, flip: false, why: 'Adding OUTSIDE the function changes the output, so the whole curve lifts by 3.' },
  { g: 'g(x) = f(x) − 2', say: 'f of x minus two', dx: 0, dy: -2, flip: false, why: 'Subtracting OUTSIDE the function changes the output, so the whole curve drops by 2.' },
  { g: 'g(x) = f(x − 2)', say: 'f of x minus two, inside the bracket', dx: 2, dy: 0, flip: false, why: 'A change INSIDE the bracket moves the curve the opposite way to its sign: minus 2 slides it RIGHT 2, because the filter now needs a setting 2 higher to do what it used to.' },
  { g: 'g(x) = f(x + 4)', say: 'f of x plus four, inside the bracket', dx: -4, dy: 0, flip: false, why: 'A change INSIDE the bracket moves the curve the opposite way to its sign: plus 4 slides it LEFT 4.' },
  { g: 'g(x) = −f(x)', say: 'negative f of x', dx: 0, dy: 0, flip: true, why: 'A minus in front flips the sign of every output — the curve turns upside down.' },
]

function shiftTask(): Task {
  const s = pickOne(SHIFTS)
  return {
    kind: 'shift', title: 'Move the curve', tone: 'b',
    badge: s.g, showEquals: false,
    prompt: 'What does that do to the curve?',
    context: 'Your filter has a curve, and this is a second version of it. Changing the output moves the curve up or down; changing the input moves it sideways, and a minus in front turns it over.',
    instruction: 'Move the curve to match, then lock it in.',
    say: `${s.say}. What does that do to the curve of f?`,
    work: [s.why],
    dx: s.dx, dy: s.dy, flip: s.flip,
  }
}

/** The parent here is ±x² + shift, so the outputs really do stop at the turning
 *  point — true whichever way the coin lands, which is why the context says
 *  "turns around" rather than "has a lowest value". */
function rangeTask(): Task {
  const shift = rint(-3, 3)
  const flip = Math.random() < 0.35
  const base = `f(x) = ${flip ? '−' : ''}x²${shift === 0 ? '' : shift > 0 ? ` + ${shift}` : ` − ${Math.abs(shift)}`}`
  return {
    kind: 'range', title: 'How far it can go', tone: 'a',
    badge: base, showEquals: false,
    prompt: 'What outputs can it make?',
    context: 'This filter\'s curve turns around at one point and comes back, so its outputs never get past that turning point. That limit is what the range describes.',
    instruction: 'Set the limit and which side, then lock it in.',
    say: `What is the range of ${flip ? 'negative ' : ''}x squared${shift === 0 ? '' : shift > 0 ? ` plus ${shift}` : ` minus ${Math.abs(shift)}`}?`,
    work: [
      flip
        ? 'A minus in front turns the curve over, so it has a highest point and nothing above it.'
        : 'x² is never negative, so the curve has a lowest point and nothing below it.',
      `The turning point is at ${fmt(shift)}, so the outputs are y ${flip ? '≤' : '≥'} ${fmt(shift)}.`,
    ],
    dir: flip ? '≤' : '≥', at: shift,
  }
}

// ── L3 · stack them, and undo them ────────────────────────────────────────────
function chainTask(): Task {
  if (Math.random() < 0.5) {
    const gAdd = rint(1, 4), fMul = rint(2, 3), a = rint(1, 4)
    const inner = a + gAdd
    const n = fMul * inner
    return {
      kind: 'chain', title: 'Two filters', tone: 'b',
      badge: `f(x) = ${fMul}x,  g(x) = x + ${gAdd}    f(g(${a}))`,
      prompt: 'What comes out of both?',
      context: `Two filters stacked. The setting goes into g first, and whatever g puts out is what f receives — so you work it from the inside out, not left to right.`,
      padInstruction: 'Tap what comes out of the pair.',
      say: `f of x equals ${fMul} x. g of x equals x plus ${gAdd}. What is f of g of ${a}?`,
      work: [
        `Inner filter first: g(${a}) = ${a} + ${gAdd} = ${inner}.`,
        `Then that goes into f: ${fMul} × ${inner} = ${n}.`,
      ],
      // fMul·a + gAdd is the left-to-right error — applying f first.
      n, pad: [fMul * a + gAdd, n + fMul, n - fMul],
    }
  }
  const m = rint(2, 3), b = rint(-3, 5), x = rint(1, 5)
  const y = m * x + b
  return {
    kind: 'chain', title: 'Undo it', tone: 'b',
    badge: `f(x) = ${m}x ${b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`}    f⁻¹(${fmt(y)})`,
    prompt: 'What setting produced that?',
    context: `The inverse is the undo button: instead of asking what the filter puts out, it asks what setting must have gone IN to get ${fmt(y)} out.`,
    padInstruction: 'Tap the setting that produced it.',
    say: `f of x equals ${m} x ${b >= 0 ? `plus ${b}` : `minus ${Math.abs(b)}`}. What is f inverse of ${spoken(y)}?`,
    work: [
      'Run the rule backwards: undo the adding first, then undo the multiplying.',
      `${fmt(y)} ${b >= 0 ? `− ${b}` : `+ ${Math.abs(b)}`} = ${fmt(y - b)}, then ÷ ${m} = ${x}.`,
    ],
    // y itself is the "it must be the number in the bracket" slip.
    n: x, pad: [y, x + 1, x - 1],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return evalTask()
  if (d === 2) return Math.random() < 0.5 ? shiftTask() : rangeTask()
  return chainTask()
}

// ══════════════════════════════════════════════════════════════════════════════
// THE FILTER RACK — shift across, shift up, invert; the curve moves with them.
// ══════════════════════════════════════════════════════════════════════════════
const RW = 200, RG = 5   // viewbox, and the ± range the little grid covers
const rx = (x: number) => RW / 2 + (x / RG) * (RW / 2 - 12)
const ry = (y: number) => RW / 2 - (y / RG) * (RW / 2 - 12)

function FilterRack({ value, setValue, disabled, reveal, onCommit }: {
  value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const dx = value.k === 'set' ? value.dx : 0
  const dy = value.k === 'set' ? value.dy : 0
  const flip = value.k === 'set' ? value.flip : false
  const col = reveal ? P.mint : P.gold
  // The parent curve is a simple bend so a shift is unmistakable on screen.
  const parent = (x: number) => 0.35 * x * x - 2
  const g = (x: number) => (flip ? -1 : 1) * parent(x - dx) + dy
  const draw = (f: (x: number) => number) => Array.from({ length: 49 }, (_, i) => {
    const x = -RG + (2 * RG * i) / 48
    return `${i ? 'L' : 'M'} ${rx(x).toFixed(1)} ${ry(Math.max(-RG - 2, Math.min(RG + 2, f(x)))).toFixed(1)}`
  }).join(' ')

  const Ctl = ({ label, val, on }: { label: string; val: number; on: (n: number) => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(5px,0.8vw,10px)' }}>
      <span style={{ width: 'clamp(66px,7vw,96px)', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(9px,0.95vw,12px)', letterSpacing: '0.07em', color: P.mutedOnPaper, textTransform: 'uppercase' }}>{label}</span>
      <Nudge P={P} label="−" disabled={disabled} onClick={() => on(Math.max(-5, val - 1))} />
      <span style={{ minWidth: 'clamp(28px,2.8vw,40px)', textAlign: 'center', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(16px,1.8vw,25px)', color: P.cream }}>{fmt(val)}</span>
      <Nudge P={P} label="+" disabled={disabled} onClick={() => on(Math.min(5, val + 1))} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px,1.1vw,15px)', width: '100%' }}>
      <svg viewBox={`0 0 ${RW} ${RW}`} width="100%" style={{ maxWidth: 'clamp(160px, 21vw, 250px)', display: 'block' }} aria-hidden>
        <rect x={0} y={0} width={RW} height={RW} rx={10} fill="rgba(0,0,0,0.26)" stroke={P.glassBorder} strokeWidth={1} />
        {[-4, -2, 2, 4].map((t) => (
          <g key={t}>
            <line x1={rx(t)} y1={8} x2={rx(t)} y2={RW - 8} stroke={P.glassBorder} strokeWidth={0.6} opacity={0.5} />
            <line x1={8} y1={ry(t)} x2={RW - 8} y2={ry(t)} stroke={P.glassBorder} strokeWidth={0.6} opacity={0.5} />
          </g>
        ))}
        <line x1={8} y1={ry(0)} x2={RW - 8} y2={ry(0)} stroke={P.glassBorder} strokeWidth={1.2} />
        <line x1={rx(0)} y1={8} x2={rx(0)} y2={RW - 8} stroke={P.glassBorder} strokeWidth={1.2} />
        {/* the original, faint — so a shift is visible as a MOVE, not just a curve */}
        <path d={draw(parent)} fill="none" stroke={P.creamSoft} strokeWidth={1.5} opacity={0.3} strokeDasharray="4 4" />
        <path d={draw(g)} fill="none" stroke={col} strokeWidth={2.6} style={{ transition: 'd 300ms' }} />
      </svg>

      <Ctl label="across" val={dx} on={(n) => setValue({ k: 'set', dx: n, dy, flip })} />
      <Ctl label="up" val={dy} on={(n) => setValue({ k: 'set', dx, dy: n, flip })} />
      <button type="button" disabled={disabled} onClick={() => setValue({ k: 'set', dx, dy, flip: !flip })}
        style={{
          padding: 'clamp(9px,1vw,13px) clamp(14px,1.6vw,22px)', borderRadius: 10, minHeight: 44,
          border: `2px solid ${flip ? col : P.glassBorder}`, background: flip ? `${col}22` : P.glass,
          color: flip ? col : P.creamSoft, fontFamily: 'var(--font-numeric)', fontWeight: 800,
          fontSize: 'clamp(11px,1.1vw,15px)', cursor: disabled ? 'default' : 'pointer',
        }}>invert ⇅</button>
      <CommitBtn P={P} label="APPLY ✓" disabled={disabled} onClick={() => onCommit({ k: 'set', dx, dy, flip })} />
    </div>
  )
}

// ── THE RANGE LIMIT — a direction chip and a boundary ─────────────────────────
function RangeLimit({ value, setValue, disabled, reveal, onCommit }: {
  value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const dir = value.k === 'ray' ? value.dir : '≥'
  const at = value.k === 'ray' ? value.at : 0
  const col = reveal ? P.mint : P.gold
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(26px,3.4vw,46px)', fontWeight: 800, color: col, textShadow: `0 0 18px ${(reveal ? '#3fa77c' : P.goldDeep)}55` }}>
        y {dir} {fmt(at)}
      </div>
      <div style={{ display: 'flex', gap: 'clamp(8px,1vw,14px)' }}>
        {(['≥', '≤'] as const).map((dd) => (
          <button key={dd} type="button" disabled={disabled} onClick={() => setValue({ k: 'ray', dir: dd, at })}
            style={{
              width: 'clamp(64px,7vw,92px)', minHeight: 44, borderRadius: 10,
              border: `2px solid ${dir === dd ? col : P.glassBorder}`, background: dir === dd ? `${col}22` : P.glass,
              color: dir === dd ? col : P.creamSoft, fontFamily: 'var(--font-numeric)', fontWeight: 800,
              fontSize: 'clamp(13px,1.3vw,18px)', cursor: disabled ? 'default' : 'pointer',
            }}>{dd === '≥' ? 'at least' : 'at most'}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1vw,14px)' }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => setValue({ k: 'ray', dir, at: Math.max(-6, at - 1) })} />
        <span style={{ minWidth: 'clamp(30px,3vw,44px)', textAlign: 'center', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(18px,2vw,28px)', color: P.cream }}>{fmt(at)}</span>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => setValue({ k: 'ray', dir, at: Math.min(6, at + 1) })} />
      </div>
      <CommitBtn P={P} label="LOCK IN ✓" disabled={disabled} onClick={() => onCommit({ k: 'ray', dir, at })} />
    </div>
  )
}

// ── walkthrough: the inside-the-bracket shift, the one that is always believed
//    backwards until you have moved it yourself.
const DEMO: Task = {
  kind: 'shift', title: 'Move the curve', badge: 'g(x) = f(x − 2)', tone: 'b',
  prompt: '', say: '', work: [], dx: 2, dy: 0, flip: false,
}
const DEMO_STEPS: DemoStep<V>[] = [
  { say: 'This is the curves panel in a photo editor, and it is a function drawn out: the setting you feed in, and the adjustment that comes out.', value: { k: 'set', dx: 0, dy: 0, flip: false }, board: 'f(x)' },
  { say: 'The faint dotted curve is the filter we started with. We want the new one, g of x equals f of x minus two.', value: { k: 'set', dx: 0, dy: 0, flip: false }, board: 'g(x) = f(x − 2)' },
  { say: 'The minus two is inside the bracket, so it changes the input, not the output. Almost everyone shifts it left the first time.', value: { k: 'set', dx: -2, dy: 0, flip: false }, board: 'left 2 — the guess' },
  { say: 'But watch. Feed in a setting of two. Inside the bracket that becomes two minus two, which is zero — so g at two does what f used to do at zero.', value: { k: 'set', dx: -2, dy: 0, flip: false }, board: 'g(2) = f(0)' },
  { say: 'The filter now needs a setting two HIGHER to do the same thing it used to. That is a shift to the RIGHT, not the left.', value: { k: 'set', dx: 2, dy: 0, flip: false }, board: 'right 2 ✓' },
  { say: 'So a change inside the bracket always moves the curve the opposite way to its sign. Outside the bracket is the one that behaves — plus lifts it, minus drops it.', value: { k: 'set', dx: 2, dy: 0, flip: false }, board: 'inside → opposite way' },
]

// ══════════════════════════════════════════════════════════════════════════════
const CONFIG: GameConfig<V, Task> = {
  chapterId: 'functionToolkit',
  title: 'PHOTO FILTERS',
  ticketLabel: 'filter stack',
  palette: P,
  motif: '🎚️',
  makeTask,
  answerPad: (t) => (t.kind === 'eval' || t.kind === 'chain' ? numChoices(t.n ?? 0, t.pad ?? []) : []),
  // REQUIRED: V is a tagged union (docs/lessons.md — the 15–16 prod bug).
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) =>
    t.kind === 'shift' ? { k: 'set', dx: 0, dy: 0, flip: false }
      : t.kind === 'range' ? { k: 'ray', dir: '≥', at: 0 }
        : { k: 'num', n: 0 },
  grade: (t, v) =>
    t.kind === 'shift' ? v.k === 'set' && v.dx === t.dx && v.dy === t.dy && v.flip === t.flip
      : t.kind === 'range' ? v.k === 'ray' && v.dir === t.dir && v.at === t.at
        : v.k === 'num' && v.n === t.n,
  revealText: (t) =>
    t.kind === 'shift' ? `${t.flip ? 'invert' : `across ${fmt(t.dx ?? 0)}, up ${fmt(t.dy ?? 0)}`}`
      : t.kind === 'range' ? `y ${t.dir} ${fmt(t.at ?? 0)}`
        : fmt(t.n ?? 0),
  glide: (t, _f, setValue, later) => later(() => setValue(
    t.kind === 'shift' ? { k: 'set', dx: t.dx ?? 0, dy: t.dy ?? 0, flip: !!t.flip }
      : t.kind === 'range' ? { k: 'ray', dir: t.dir ?? '≥', at: t.at ?? 0 }
        : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, onCommit }): ReactElement =>
    task.kind === 'range'
      ? <RangeLimit value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
      : <FilterRack value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />,
  TutorialScene: ({ value }) => <FilterRack value={value} setValue={() => {}} disabled onCommit={() => {}} />,
  start: {
    blurb: <><strong>The curves panel in a photo editor</strong> is a function you can see: a setting goes in, an adjustment comes out. Run values through it, move the curve around, stack two filters — and work out how to undo one.</>,
    ticket: { title: 'Filter', badge: 'f(x) = 2x + 3', tone: 'a' },
    startLabel: 'Open the panel →',
  },
  overview: {
    say: 'Here is the plan. A filter is a machine: a setting goes in and one adjustment comes out, and the curve on screen is a picture of that machine. Change the output and the whole curve lifts or drops. Change the input and it slides sideways — but the opposite way to the sign, which is the part everyone gets wrong the first time. Let us move one together, nice and slow.',
    problem: <>What does <strong>g(x) = f(x − 2)</strong> do to the curve?</>,
    points: [
      <>A filter takes one setting in and gives <strong>one</strong> adjustment out.</>,
      <>Change <strong>outside</strong> the bracket → the curve moves up or down.</>,
      <>Change <strong>inside</strong> the bracket → it slides the <strong>opposite way</strong> to the sign.</>,
      <>Stacking filters is <strong>composition</strong>; undoing one is the <strong>inverse</strong>.</>,
    ],
  },
  tutorial: [{ task: DEMO, initial: { k: 'set', dx: 0, dy: 0, flip: false }, hand: 'tap', steps: DEMO_STEPS }],
  sig: (t) => `${t.kind}:${t.badge}`,
}

export default function PhotoFilters(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
