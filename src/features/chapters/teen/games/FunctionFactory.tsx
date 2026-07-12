'use client'
/**
 * FunctionFactory — the Algebraic Expressions chapter as a PLAYABLE GAME where the
 * child SOLVES ON the illustration (a TAXI METER), never in the head:
 *
 *   • EVALUATE (3x + 2 where x = 4): the ride distance is DROPPED IN for x — the rule
 *     becomes 3 × 4 + 2 as tappable chips — and the child works it out one operation
 *     at a time (× before +). The meter reads the fare that EMERGES.
 *   • SOLVE / find x (2x + 1 = 11): the child dials the ride distance; the meter
 *     computes the fare live for that x; they find the distance that HITS the target.
 *   • COMBINE like rates (3x + 2x): the two per-km charges are shown as x-tiles; the
 *     child gathers them into one pile and the combined rate is the count.
 *
 * No dialing a number worked out in the head. No slides, no MCQ. Shared adaptive
 * engine underneath (branches by task.mode). The expression engine lives in gameKit.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, CommitBtn, Nudge, headerChip, pick, glideNumber, ExprChips, parseExpr, collapseAt, correctNextIndex, type ETok } from './parts/gameKit'

const P: Palette = {
  nightTop: '#1c1a10', nightBot: '#282412',
  cream: '#fffdf0', creamSoft: 'rgba(255,253,240,0.82)',
  inkOnPaper: '#2a2612', mutedOnPaper: '#9a9068',
  gold: '#ffd21f', goldDeep: '#d9a800',
  coral: '#ff8a4b', coralDeep: '#e2622a', mint: '#7fd0a0',
  glass: 'rgba(28,26,16,0.62)', glassBorder: 'rgba(255,253,240,0.22)',
}

type Mode = 'eval' | 'solve' | 'combine'
interface Task extends BaseTask {
  mode: Mode; answer: number
  rule?: string; x?: number; expr?: string; target?: number; coA?: number; coB?: number
}
// One value shape across the three modes (GameShell holds a single V): eval uses
// `toks` (the collapsing expression), solve uses `x` (the dialled distance), combine
// uses `count` (the pile of x-tiles built so far).
interface FV { toks: ETok[]; x: number; count: number }
const EV = (toks: ETok[]): FV => ({ toks, x: 4, count: 0 })

/** Drop the ride distance in for x, spaced for parseExpr: "3x" → "3 × 4", "2(x + 3)"
 *  → "2 × (4 + 3)", bare "x" → the value. */
function substitute(rule: string, x: number): string {
  return rule.replace(/(\d)\(/g, '$1 × (').replace(/(\d)x/g, (_, d) => `${d} × ${x}`).replace(/x/g, `${x}`)
}
/** Fully evaluate an expression string in the correct order → a number. */
function fullEval(expr: string): number {
  let t = parseExpr(expr)
  for (let i = 0; i < 12 && t.length > 1; i++) { const k = correctNextIndex(t); if (k < 0) break; t = collapseAt(t, k) }
  return (t[0] as { v: number }).v
}
const evalRule = (rule: string, x: number) => fullEval(substitute(rule, x))

// ── generators (math preserved) ───────────────────────────────────────────────
function evaluate(hard = false): Task {
  const easy: [string, number, number][] = [['2x + 1', 3, 7], ['x + 5', 4, 9], ['3x', 3, 9]]
  const tough: [string, number, number][] = [['4x − 3', 5, 17], ['2(x + 3)', 4, 14]]
  const [rule, x, answer] = pick(hard ? [...easy, ...tough] : easy)
  return {
    mode: 'eval', title: 'Work out the fare', badge: `${rule} where x=${x}`, tone: 'a',
    context: `A taxi ride goes ${x} km across town.`,
    instruction: 'Drop x in, then tap × and ÷ before + and −.',
    prompt: `The fare rule is ${rule}, for x = ${x} km. Drop x in and work it out.`,
    say: `The fare rule is ${rule}, where x is the km. Drop in ${x} for x, then work it out — times before plus.`,
    answer, rule, x, expr: substitute(rule, x),
    work: [`Put ${x} in place of x: ${substitute(rule, x)}.`, `Work it out in order = ${answer}.`],
  }
}
function solve(): Task {
  const set: [string, number, number][] = [['2x + 1', 11, 5], ['3x − 2', 10, 4], ['x + 7', 12, 5], ['4x', 20, 5]]
  const [rule, out, answer] = pick(set)
  return {
    mode: 'solve', title: 'How far?', badge: `${rule} = ${out}`, tone: 'b',
    context: `A taxi ride ends and the fare comes to $${out}.`,
    instruction: 'Dial the km until the meter hits the target.',
    prompt: `The fare came to $${out} with rule ${rule}. Dial the km until the meter matches.`,
    say: `The fare came to ${out} dollars using the rule ${rule}. Dial the km until the meter hits ${out}.`,
    answer, rule, target: out,
    work: [`Try distances until the fare is ${out}.`, `x = ${answer} gives ${out}.`],
  }
}
function combine(): Task {
  const set: [number, number, number][] = [[3, 2, 5], [5, -2, 3], [4, 3, 7], [6, -2, 4]]
  const [a, b, answer] = pick(set)
  const sign = b < 0 ? '−' : '+'
  return {
    mode: 'combine', title: 'Combine the rates', badge: `${a}x ${sign} ${Math.abs(b)}x`, tone: 'a',
    context: `Two charges per km: ${a} dollars and ${b < 0 ? `minus ${-b}` : b} dollars each km.`,
    instruction: 'Gather the x-tiles into one rate.',
    prompt: `Combine the per-km charges ${a}x ${sign} ${Math.abs(b)}x — gather the tiles and count the total rate.`,
    say: `Two charges per km add up: ${a} x ${b < 0 ? 'minus' : 'plus'} ${Math.abs(b)} x. Gather the tiles into one rate.`,
    answer, coA: a, coB: b,
    work: [`Combine like terms — add the counts of x.`, `${a} ${sign} ${Math.abs(b)} = ${answer}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [() => evaluate(false), () => evaluate(false), () => evaluate(false)]
    : d === 2 ? [solve, combine, () => evaluate(false)]
    : [() => evaluate(true), solve, combine]
  return pick(pool)()
}

// ── shared taxi-meter panel ───────────────────────────────────────────────────
function MeterPanel({ P, children, height }: { P: Palette; children: React.ReactNode; height?: string }) {
  return (
    <div style={{ width: 'clamp(268px, 48vw, 440px)', height, minHeight: height ? undefined : 'clamp(150px,24vh,220px)', boxSizing: 'border-box', borderRadius: 16, background: `linear-gradient(160deg, ${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px,1.4vh,14px)', padding: 'clamp(14px,2.2vw,24px)' }}>
      {children}
    </div>
  )
}
const meterHead = (P: Palette): React.CSSProperties => ({ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.creamSoft, textAlign: 'center' })

// ── EVALUATE: drop x in, tap-collapse the substituted expression → the fare ──
function EvalMachine({ P, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: FV; setValue: (v: FV) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: FV) => void
}) {
  const toks = value.toks
  const solved = toks.length === 1 && toks[0].k === 'num'
  const worked = toks.length < parseExpr(task.expr!).length
  const tap = (i: number) => { if (!disabled) setValue({ ...value, toks: collapseAt(toks, i) }) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(12px,1.6vw,20px)', width: '100%' }}>
      <MeterPanel P={P}>
        <div style={meterHead(P)}>🚕 fare = {task.rule} · x = {task.x} km</div>
        <ExprChips P={P} toks={toks} onTap={disabled ? undefined : tap} reveal={reveal} size="lg" />
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(11px,1.2vw,15px)', color: solved ? P.mint : P.creamSoft }}>{solved ? 'that is the fare ✓' : `x = ${task.x} dropped in — tap × ÷ first`}</div>
      </MeterPanel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {worked && !solved && !disabled && <button type="button" onClick={() => setValue({ ...value, toks: parseExpr(task.expr!) })} style={{ ...headerChip(P), opacity: 0.82 }}>↺ start over</button>}
        <CommitBtn P={P} label="SET FARE ✓" disabled={disabled || !solved} onClick={() => onCommit(value)} />
      </div>
    </div>
  )
}

// ── SOLVE: dial the distance; the meter computes the fare live; hit the target ──
function SolveMachine({ P, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: FV; setValue: (v: FV) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: FV) => void
}) {
  const x = value.x
  const out = evalRule(task.rule!, x)
  const hit = out === task.target
  const setX = (nx: number) => setValue({ ...value, x: Math.max(0, Math.min(12, nx)) })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(12px,1.6vw,20px)', width: '100%' }}>
      <MeterPanel P={P}>
        <div style={meterHead(P)}>🚕 rule {task.rule} · target ${task.target}</div>
        <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(34px,6.4vw,56px)', lineHeight: 1, color: reveal ? P.mint : hit ? P.mint : P.gold, textShadow: '0 0 18px rgba(0,0,0,0.4)' }}>${out}</div>
        <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(13px,1.5vw,19px)', color: P.creamSoft }}>{substitute(task.rule!, x)} = {out}</div>
        <div style={{ minHeight: '1.4em', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'clamp(11px,1.3vw,15px)', color: hit ? P.mint : P.creamSoft }}>{hit ? `matches $${task.target} ✓` : out < task.target! ? 'fare too low — go further' : 'fare too high — shorter ride'}</div>
      </MeterPanel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => setX(x - 1)} />
        <div style={{ minWidth: 130, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(24px,2.6vw,34px)', fontWeight: 800, color: reveal ? P.mint : P.gold }}>{x} km</div>
          <div style={{ fontSize: 'clamp(11px,1.15vw,14px)', color: P.creamSoft }}>ride distance (x)</div>
        </div>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => setX(x + 1)} />
      </div>
      <CommitBtn P={P} label="SET KM ✓" disabled={disabled} onClick={() => onCommit(value)} />
    </div>
  )
}

// ── COMBINE: gather the x-tiles from both charges into one rate ──
function CombineTiles({ P, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: FV; setValue: (v: FV) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: FV) => void
}) {
  const a = task.coA!, b = task.coB!
  const count = value.count
  const set = (n: number) => setValue({ ...value, count: Math.max(0, Math.min(a + Math.abs(b), n)) })
  const tile = (k: number, kind: 'a' | 'b' | 'pile') => (
    <div key={`${kind}${k}`} style={{ width: 'clamp(20px,3vw,30px)', height: 'clamp(30px,4.4vw,44px)', borderRadius: 5, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(11px,1.4vw,16px)',
      background: kind === 'b' && b < 0 ? 'transparent' : (reveal && kind === 'pile' ? 'linear-gradient(#a7e8c4,#5fb98d)' : 'linear-gradient(#ffe98a,#e0a800)'),
      color: kind === 'b' && b < 0 ? P.coral : '#3a2a08', border: `2px ${kind === 'b' && b < 0 ? 'dashed' : 'solid'} ${kind === 'b' && b < 0 ? P.coral : '#b9821f'}`,
      textDecoration: kind === 'b' && b < 0 ? 'line-through' : 'none' }}>x</div>
  )
  const row = (n: number, kind: 'a' | 'b' | 'pile') => <div style={{ display: 'flex', gap: 'clamp(3px,0.6vw,6px)', flexWrap: 'wrap', justifyContent: 'center' }}>{Array.from({ length: n }, (_, k) => tile(k, kind))}</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(12px,1.6vw,20px)', width: '100%' }}>
      <MeterPanel P={P}>
        <div style={meterHead(P)}>🚕 combine the per-km charges</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1.4vw,16px)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {row(a, 'a')}
          <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(18px,2.4vw,28px)', color: P.cream }}>{b < 0 ? '−' : '+'}</span>
          {row(Math.abs(b), 'b')}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', color: P.creamSoft }}>{b < 0 ? `${a} tiles, take ${-b} away` : `${a} tiles and ${b} more`}</div>
        <div style={{ borderTop: `1px dashed ${P.glassBorder}`, paddingTop: 'clamp(6px,1vh,10px)', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(9px,1vw,12px)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.gold }}>your combined rate</div>
          {count > 0 ? row(count, 'pile') : <div style={{ fontSize: 'clamp(10px,1.1vw,13px)', color: P.mutedOnPaper }}>gather them below</div>}
          <div style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(22px,3vw,34px)', color: reveal ? P.mint : P.gold }}>{count}x</div>
        </div>
      </MeterPanel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => set(count - 1)} />
        <div style={{ minWidth: 120, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 'clamp(11px,1.15vw,14px)', color: P.creamSoft }}>x-tiles in the pile</div>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => set(count + 1)} />
      </div>
      <CommitBtn P={P} label="SET RATE ✓" disabled={disabled || count === 0} onClick={() => onCommit(value)} />
    </div>
  )
}

// ── walkthrough scene — the eval example collapsing (teach = play) ──
function TaxiScene({ palette: P, task, value }: { palette: Palette; task: Task; value: FV; stepIndex: number; frameCount: number; ended: boolean }) {
  const toks = value.toks
  const solved = toks.length === 1 && toks[0].k === 'num'
  return (
    <MeterPanel P={P} height="clamp(300px, 46vh, 440px)">
      <div style={meterHead(P)}>🚕 fare = {task.rule} · x = {task.x} km</div>
      <ExprChips P={P} toks={toks} highlight={solved ? undefined : correctNextIndex(toks)} reveal={solved} size="lg" />
      <div style={{ minHeight: '1.4em', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'clamp(11px,1.3vw,15px)', color: solved ? P.mint : P.creamSoft }}>{solved ? 'that is the fare ✓' : `put ${task.x} in for x, then × before +`}</div>
    </MeterPanel>
  )
}

// ── worked example (3x + 2 where x = 4) as collapsing token states ──
const E0 = parseExpr('3 × 4 + 2')
const E1 = collapseAt(E0, correctNextIndex(E0))   // 12 + 2
const E2 = collapseAt(E1, correctNextIndex(E1))   // 14
const DEMO_TASK: Task = { mode: 'eval', title: 'Work out the fare', badge: '3x + 2 where x=4', tone: 'a', answer: 14, rule: '3x + 2', x: 4, expr: '3 × 4 + 2', context: 'A taxi ride goes 4 km across town.', instruction: 'Drop x in, then tap × first.', prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  mode: 'eval', title: 'Work out the fare', badge: 'x + 2 where x=3', tone: 'a', answer: 5, rule: 'x + 2', x: 3, expr: '3 + 2',
  context: 'A taxi ride goes 3 km across town.',
  instruction: 'Drop x in, then tap the +.',
  prompt: 'The fare rule is x + 2, for x = 3 km. Drop x in and work it out.',
  say: 'The fare rule is x plus two. Drop in three for x, then tap the plus.',
  work: ['Put 3 in place of x: 3 + 2.', '3 + 2 = 5.'],
}

const CONFIG: GameConfig<FV, Task> = {
  chapterId: 'algebraicExpressions',
  title: 'TAXI METER',
  motif: '🚕',
  ticketLabel: 'fare card',
  palette: P,
  makeTask,
  initialValue: (t) => t.mode === 'eval' ? { toks: parseExpr(t.expr!), x: t.x ?? 0, count: 0 } : t.mode === 'solve' ? { toks: [], x: 1, count: 0 } : { toks: [], x: 0, count: 0 },
  grade: (t, v) =>
    t.mode === 'eval' ? v.toks.length === 1 && v.toks[0].k === 'num' && Math.abs(v.toks[0].v - t.answer) < 1e-6
    : t.mode === 'solve' ? v.x === t.answer
    : v.count === t.answer,
  revealText: (t) => `${t.answer}${t.mode === 'combine' ? 'x' : ''}`,
  glide: (t, from, setValue, later) => {
    if (t.mode === 'eval') {
      const run = (toks: ETok[], delay: number) => later(() => { setValue({ toks, x: t.x ?? 0, count: 0 }); if (toks.length > 1) { const i = correctNextIndex(toks); if (i >= 0) run(collapseAt(toks, i), 800) } }, delay)
      run(parseExpr(t.expr!), 450); return
    }
    if (t.mode === 'solve') { glideNumber(from.x, t.answer, (n) => setValue({ ...from, x: n }), later); return }
    glideNumber(from.count, t.answer, (n) => setValue({ ...from, count: n }), later)
  },
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) =>
    task.mode === 'eval' ? <EvalMachine P={palette} task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
    : task.mode === 'solve' ? <SolveMachine P={palette} task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
    : <CombineTiles P={palette} task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />,
  tutorial: {
    task: DEMO_TASK,
    initial: EV(E0),
    hand: 'tap',
    steps: [
      { say: 'Welcome to the taxi meter. The fare follows a rule with a letter x in it — x is how far the ride is. This rule is three x plus two, and this ride is four km.', value: EV(E0), hand: 'tap', board: 'fare = 3x + 2, x = 4' },
      { say: 'First we drop the four in wherever we see x. So three x becomes three times four. Now it is just numbers: three times four plus two.', value: EV(E0), hand: 'tap', board: 'x = 4 → 3 × 4 + 2' },
      { say: 'Now work it out in order — times before plus. Tap the times: three times four is twelve.', value: EV(E1), hand: 'tap', board: '3 × 4 = 12' },
      { say: 'Only the plus is left. Twelve plus two.', value: EV(E1), hand: 'tap', board: '12 + 2' },
      { say: 'Tap it — twelve plus two is fourteen. One number is left, so the fare is fourteen dollars.', value: EV(E2), hand: 'tap', board: '3x + 2 = 14' },
      { say: "When the fare is worked out, set it. Now let's try one together.", value: EV(E2), hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'tap',
  },
  TutorialScene: TaxiScene,
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re driving the taxi.</strong> Drop the ride distance in for x, work the fare out on the meter, dial the distance to hit a target, or combine the per-km charges.</>, ticket: { title: 'Fare 3x + 2', badge: 'x = 4 → ?', tone: 'a' }, startLabel: 'Start the meter →' },
  overview: {
    say: "Here is what we are figuring out: a taxi fare follows a rule with a letter x in it, and x is how far the ride is. Our rule is three x plus two, and the ride is four km. We drop the four in for x, so three x becomes three times four, then we work it out in order — times before plus.",
    problem: <>What does the meter read? Fare rule <strong>3x + 2</strong> for a <strong>4 km</strong> ride.</>,
    points: [
      <>The <strong>x</strong> is the distance — here <strong>x = 4</strong> km — so drop <strong>4</strong> in for x.</>,
      <>Now it is <strong>3 × 4 + 2</strong> — tap the <strong>× first</strong>: 3 × 4 = 12.</>,
      <>Then the <strong>+</strong>: 12 + 2 — the fare that&apos;s left is <strong>$14</strong>.</>,
    ],
  },
  sig: (t) => t.badge,
}

export default function FunctionFactory(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
