'use client'
/**
 * BalanceThatGrows — the Exponential & Log chapter (17–18) as a PLAYABLE GAME.
 *
 * World: THE BALANCE THAT GROWS. A phone bought on credit and paid at the minimum.
 * Two exponentials run in opposite directions on the same handset:
 *   • the DEBT multiplies up every month it is left alone
 *   • the HANDSET'S VALUE multiplies down — a base under one is decay, felt
 *   • and a LOG is the only question you ever really ask about either of them:
 *     not "how much", but WHEN. When does it double. When is it worth half.
 *
 *   • TAP  → AnswerPad: what the balance multiplies to, and how many months a
 *            given multiple takes (a log IS a number of months).
 *   • SET  → THE RATE DIAL: the base written as what it actually does to the
 *            balance each month — a percent, up or down. Growth versus decay is
 *            not picked off two cards, it falls out of which way the dial went.
 *   • READ → THE MONTH DIAL: slide the month marker to where the balance curve
 *            meets the target. ⚠️ The balance at the marker is deliberately NOT
 *            printed — printing it would let the child dial until the screen
 *            agreed, which is the hot/cold failure (docs/chapter-craft.md §1).
 *            They read the crossing, or they do the log. Both are honest.
 *   • PICK → SpecPicker ×2, and only twice: rewriting between exponential and log
 *            form, and the log laws. Both are genuinely symbolic — there is no
 *            number to produce (plan §5.2), and they are 2 of the ~10 pickers
 *            budgeted for the whole band.
 *
 * The math is the old ExpLogFunctionsTeenLesson.makeRound, same L1/L2/L3 ramp,
 * with each answer re-expressed rather than re-chosen. Nothing was added.
 */
import { type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SpecPicker, CommitBtn, Nudge, numChoices } from './parts/gameKit'

const P: Palette = {
  nightTop: '#1c1830', nightBot: '#0a0814',
  cream: '#f0ecfb', creamSoft: 'rgba(240,236,251,0.82)',
  inkOnPaper: '#1c1830', mutedOnPaper: '#8d84ad',
  gold: '#c6a6ff', goldDeep: '#7a52c9',
  coral: '#ff8fa8', coralDeep: '#dd4f6e', mint: '#77e0bd',
  glass: 'rgba(28,24,48,0.62)', glassBorder: 'rgba(240,236,251,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const SUP: Record<number, string> = { 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' }
const SUB: Record<number, string> = { 2: '₂', 3: '₃', 5: '₅', 10: '₁₀' }
const sup = (n: number) => SUP[n] ?? `^${n}`
const sub = (n: number) => SUB[n] ?? `_${n}`
const pct = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}%`

// A tapped or dialled number, or a chosen form.
type V = { k: 'num'; n: number } | { k: 'pick'; id: string }

interface Task extends BaseTask {
  kind: 'pow' | 'rate' | 'form' | 'log' | 'when' | 'law'
  n?: number; pad?: number[]
  correctId?: string; choices?: { id: string; label: string }[]
  /** when: the curve the month dial is read against */
  start?: number; base?: number; target?: number
  /** rate: how the dial is drawn (a multiplier per month) */
  mult?: number
}

// ── L1 · what the balance multiplies to ───────────────────────────────────────
function powTask(): Task {
  const base = pickOne([2, 3, 5, 10])
  const exp = base === 10 ? 3 : base === 5 ? 2 : rint(2, 4)
  const ans = base ** exp
  return {
    kind: 'pow', title: 'Left alone', tone: 'a',
    badge: `${base}${sup(exp)}`, answerLabel: '× bigger =',
    prompt: 'How many times bigger?',
    context: `Leave this balance untouched and it multiplies by ${base} every single month — the new balance, not the original one, is what gets multiplied next time. After ${exp} months it has done that ${exp} times over.`,
    padInstruction: 'Tap how many times bigger it ends up.',
    say: `A balance multiplies by ${base} every month. After ${exp} months, how many times bigger is it?`,
    work: [
      `Each month multiplies by ${base} again, so ${exp} months is ${Array(exp).fill(base).join(' × ')}.`,
      `That comes to ${ans}, so the balance ends up ${ans} times what it started at.`,
    ],
    // base × exp is the classic slip (multiplying instead of powering).
    n: ans, pad: [base * exp, base ** (exp - 1), ans + base],
  }
}

// ── L1 · growth or decay, produced rather than picked ─────────────────────────
/** ⚠️ The four bases are chosen so (b − 1) × 100 always lands on a multiple of 25,
 *  which is what makes this dial-able at all. The context describes BOTH directions
 *  so it stays true whichever base is drawn. */
const RATE_BASES: { label: string; say: string; pct: number; mult: number }[] = [
  { label: '2', say: 'two', pct: 100, mult: 2 },
  { label: '3', say: 'three', pct: 200, mult: 3 },
  { label: '(1/2)', say: 'one half', pct: -50, mult: 0.5 },
  { label: '(1/4)', say: 'one quarter', pct: -75, mult: 0.25 },
]
function rateTask(): Task {
  const b = pickOne(RATE_BASES)
  return {
    kind: 'rate', title: 'Up or down', tone: 'b',
    badge: `y = ${b.label}ˣ`, showEquals: false,
    prompt: 'What does it do each month?',
    context: 'The base is the whole story: it is what one month does to the balance. A base above one leaves you with more than you had, which is the debt climbing. A base below one leaves you with only part of it, which is what the handset itself is doing to its resale value.',
    instruction: 'Set what one month does to it, then lock it in.',
    say: `A balance multiplies by ${b.say} each month. What does that do to it?`,
    work: [
      `Multiplying by ${b.label} each month leaves you with ${b.mult >= 1 ? `${b.mult} times` : `${b.mult * 100}%`} of what you had.`,
      b.pct > 0
        ? `That is ${b.pct}% MORE than you started the month with — it grows.`
        : `That is ${Math.abs(b.pct)}% LESS than you started the month with — it decays.`,
    ],
    n: b.pct, mult: b.mult,
  }
}

// ── L2 · the two ways of writing the same fact ────────────────────────────────
function formTask(): Task {
  const p = pickOne([{ b: 2, e: 3, v: 8 }, { b: 2, e: 4, v: 16 }, { b: 3, e: 2, v: 9 }, { b: 5, e: 2, v: 25 }, { b: 10, e: 2, v: 100 }])
  return {
    kind: 'form', title: 'Same fact, twice', tone: 'a',
    badge: `${p.b}${sup(p.e)} = ${p.v}`, showEquals: false,
    prompt: 'Which is the same fact in log form?',
    context: `Written this way the sentence is "${p.e} months of multiplying by ${p.b} gets you to ${p.v} times over". A log says the very same thing starting from the other end: given the ${p.b} and the ${p.v}, how many months was it? The number that moves is the exponent — it becomes the answer.`,
    instruction: 'Choose the matching log form, then lock it in.',
    say: `Rewrite ${p.b} to the power ${p.e} equals ${p.v} in log form.`,
    work: [
      `A log asks "the base to WHAT power gives this?" — so the base stays the base.`,
      `The ${p.v} is what you reached, and the ${p.e} is the answer, so log${sub(p.b)}${p.v} = ${p.e}.`,
    ],
    correctId: 'a',
    choices: [
      { id: 'a', label: `log${sub(p.b)}${p.v} = ${p.e}` },
      { id: 'b', label: `log${sub(p.b)}${p.e} = ${p.v}` },
      { id: 'c', label: `log${sub(p.v)}${p.b} = ${p.e}` },
      { id: 'd', label: `log${sub(p.b)}${p.v} = ${p.b}` },
    ],
  }
}

// ── L2 · a log is a number of months ──────────────────────────────────────────
function logTask(): Task {
  const l = pickOne([{ b: 2, v: 8, a: 3 }, { b: 10, v: 1000, a: 3 }, { b: 3, v: 9, a: 2 }, { b: 2, v: 16, a: 4 }, { b: 10, v: 100, a: 2 }])
  return {
    kind: 'log', title: 'How long?', tone: 'b',
    badge: `log${sub(l.b)}${l.v}`, answerLabel: 'months =',
    prompt: 'How many months?',
    context: `Multiplying by ${l.b} every month, this asks how long it takes to end up ${l.v} times what you owed at the start. That is all a log ever is — the number of times you had to multiply, which here is a number of months.`,
    padInstruction: 'Tap how many months it takes.',
    say: `What is log base ${l.b} of ${l.v}?`,
    work: [
      `The question is "${l.b} to what power gives ${l.v}?"`,
      `${l.b}${sup(l.a)} = ${l.v}, so the answer is ${l.a} months.`,
    ],
    n: l.a, pad: [l.b, l.a + 1, l.a - 1],
  }
}

// ── L3 · read WHEN off the curve ──────────────────────────────────────────────
function whenTask(): Task {
  const base = pickOne([2, 3])
  const start = pickOne([25, 50, 100])
  const m = base === 2 ? rint(2, 4) : rint(2, 3)
  const target = start * base ** m
  return {
    kind: 'when', title: 'When does it hit?', tone: 'a',
    badge: `£${start} × ${base}ˣ = £${target}`, showEquals: false,
    prompt: 'After how many months?',
    context: `You owe £${start} and it multiplies by ${base} every month you leave it. The dashed line is £${target} — the point you have been warned about. The curve reaches it exactly once, and the month it does is what you want.`,
    instruction: 'Slide the month marker to where the curve meets the line, then lock it in.',
    say: `A balance of ${start} pounds multiplies by ${base} every month. After how many months does it reach ${target} pounds?`,
    work: [
      `Divide both sides by the ${start} you started with: ${base}ˣ = ${target / start}.`,
      `That is asking log base ${base} of ${target / start}, and ${base}${sup(m)} = ${target / start}.`,
      `So it takes ${m} months.`,
    ],
    n: m, start, base, target,
  }
}

// ── L3 · the log laws ─────────────────────────────────────────────────────────
function lawTask(): Task {
  const quotient = Math.random() < 0.5
  return {
    kind: 'law', title: 'Splitting a log', tone: 'b',
    badge: quotient ? 'log(a / b)' : 'log(a · b)', showEquals: false,
    prompt: 'Which one is it equal to?',
    context: 'A log counts how many times you multiplied. So multiplying two amounts together means their counts ADD, and dividing one by the other means their counts take one away from the other. The operation inside the log always comes out one step gentler.',
    instruction: 'Choose the equal form, then lock it in.',
    say: quotient ? 'What does log of a divided by b equal?' : 'What does log of a times b equal?',
    work: [
      quotient
        ? 'Dividing inside a log drops down to a subtraction outside it.'
        : 'Multiplying inside a log drops down to an addition outside it.',
      quotient ? 'So log(a / b) = log a − log b.' : 'So log(a · b) = log a + log b.',
    ],
    correctId: quotient ? 'sub' : 'add',
    choices: [
      { id: 'add', label: 'log a + log b' },
      { id: 'sub', label: 'log a − log b' },
      { id: 'mul', label: 'log a · log b' },
      { id: 'div', label: '(log a) / (log b)' },
    ],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return Math.random() < 0.5 ? powTask() : rateTask()
  if (d === 2) return Math.random() < 0.5 ? formTask() : logTask()
  return Math.random() < 0.6 ? whenTask() : lawTask()
}

// ══════════════════════════════════════════════════════════════════════════════
// THE RATE DIAL — the base, written as what one month does to the balance. The
// six months drawn beside it come from the child's own setting, so a wrong sign
// is a bar chart going the wrong way.
// ══════════════════════════════════════════════════════════════════════════════
const RATE_STOPS = [-75, -50, -25, 0, 25, 50, 100, 200]

function RateDial({ value, setValue, disabled, reveal, onCommit }: {
  value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const n = value.k === 'num' ? value.n : 0
  const i = Math.max(0, RATE_STOPS.indexOf(n))
  const col = reveal ? P.mint : P.gold
  const mult = 1 + n / 100
  const bars = Array.from({ length: 6 }, (_, m) => 100 * mult ** m)
  const top = Math.max(...bars, 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      <svg viewBox="0 0 240 120" width="100%" style={{ maxWidth: 'clamp(190px, 25vw, 300px)', display: 'block' }} aria-hidden>
        <rect x={0} y={0} width={240} height={120} rx={10} fill="rgba(0,0,0,0.26)" stroke={P.glassBorder} strokeWidth={1} />
        <line x1={16} y1={104} x2={228} y2={104} stroke={P.glassBorder} strokeWidth={1} />
        {bars.map((v, m) => {
          const h = Math.max(2, (v / top) * 82)
          return <rect key={m} x={22 + m * 34} y={104 - h} width={24} height={h} rx={3} fill={col} opacity={0.55 + m * 0.07} />
        })}
        <text x={228} y={116} textAnchor="end" fill={P.mutedOnPaper} fontSize={8} fontFamily="var(--font-numeric)">6 MONTHS →</text>
      </svg>

      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px,2.6vw,34px)', fontWeight: 800, color: col }}>
        {pct(n)} a month
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1vw,14px)' }}>
        <Nudge P={P} label="−" disabled={disabled || i <= 0} onClick={() => setValue({ k: 'num', n: RATE_STOPS[Math.max(0, i - 1)] })} />
        <span style={{ minWidth: 'clamp(56px,5vw,80px)', textAlign: 'center', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(16px,1.8vw,24px)', color: P.cream }}>
          {n > 0 ? 'grows' : n < 0 ? 'decays' : 'flat'}
        </span>
        <Nudge P={P} label="+" disabled={disabled || i >= RATE_STOPS.length - 1} onClick={() => setValue({ k: 'num', n: RATE_STOPS[Math.min(RATE_STOPS.length - 1, i + 1)] })} />
      </div>

      <CommitBtn P={P} label="LOCK IN ✓" disabled={disabled} onClick={() => onCommit({ k: 'num', n })} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// THE MONTH DIAL — the balance curve with the target drawn across it, and a
// marker the child slides. ⚠️ The balance AT the marker is not printed: see the
// header. The month is; that is their answer, not a verdict on it.
// ══════════════════════════════════════════════════════════════════════════════
const MONTH_MAX = 6

function MonthDial({ task, value, setValue, disabled, reveal, onCommit }: {
  task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const m = value.k === 'num' ? value.n : 0
  const col = reveal ? P.mint : P.gold
  const start = task.start ?? 50
  const base = task.base ?? 2
  const target = task.target ?? 400
  /** ⚠️ Scaled off the TARGET, not the six-month value. An exponential's last month
   *  dwarfs everything before it, so scaling to fit the whole curve pins the target
   *  line to the floor and the crossing — the only thing being read here — becomes
   *  unreadable. The curve runs off the top instead and is clipped. The horizon
   *  stays a fixed six months whatever the answer is, so the crossing's position
   *  never gives the month away. */
  const top = target * 1.5
  const xAt = (mo: number) => 22 + (mo / MONTH_MAX) * 198
  // Unclamped: the curve must LEAVE the box, not flatten along its top edge — a
  // saturated line reads as a balance that levels off, the opposite of the point.
  const yAt = (v: number) => 100 - (v / top) * 82
  const curve = Array.from({ length: 49 }, (_, i) => {
    const mo = (i / 48) * MONTH_MAX
    return `${i === 0 ? 'M' : 'L'} ${xAt(mo).toFixed(1)} ${yAt(start * base ** mo).toFixed(1)}`
  }).join(' ')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      <svg viewBox="0 0 240 120" width="100%" style={{ maxWidth: 'clamp(190px, 25vw, 300px)', display: 'block' }} aria-hidden>
        <defs>
          <clipPath id="btg-box"><rect x={20} y={8} width={202} height={94} /></clipPath>
        </defs>
        <rect x={0} y={0} width={240} height={120} rx={10} fill="rgba(0,0,0,0.26)" stroke={P.glassBorder} strokeWidth={1} />
        <line x1={22} y1={100} x2={220} y2={100} stroke={P.glassBorder} strokeWidth={1} />
        <line x1={22} y1={yAt(target)} x2={220} y2={yAt(target)} stroke={P.creamSoft} strokeWidth={1.2} strokeDasharray="5 4" />
        <text x={24} y={yAt(target) - 4} fill={P.mutedOnPaper} fontSize={8} fontFamily="var(--font-numeric)">£{target}</text>
        <path d={curve} fill="none" stroke={P.creamSoft} strokeWidth={2.4} clipPath="url(#btg-box)" />
        <line x1={xAt(m)} y1={14} x2={xAt(m)} y2={100} stroke={col} strokeWidth={2} />
        <circle cx={xAt(m)} cy={Math.max(10, yAt(start * base ** m))} r={4.5} fill={col} />
        <text x={220} y={116} textAnchor="end" fill={P.mutedOnPaper} fontSize={8} fontFamily="var(--font-numeric)">MONTHS →</text>
      </svg>

      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px,2.6vw,34px)', fontWeight: 800, color: col }}>
        {m} {m === 1 ? 'month' : 'months'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1vw,14px)' }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => setValue({ k: 'num', n: Math.max(0, m - 1) })} />
        <Nudge P={P} label="+" disabled={disabled} onClick={() => setValue({ k: 'num', n: Math.min(MONTH_MAX, m + 1) })} />
      </div>

      <CommitBtn P={P} label="LOCK IN ✓" disabled={disabled} onClick={() => onCommit({ k: 'num', n: m })} />
    </div>
  )
}

// ── walkthrough: the rate dial, then reading WHEN off the curve ───────────────
const DEMO_RATE: Task = {
  kind: 'rate', title: 'Up or down', badge: 'y = (1/2)ˣ', tone: 'b',
  prompt: '', say: '', work: [], n: -50, mult: 0.5,
}
const DEMO_RATE_STEPS: DemoStep<V>[] = [
  { say: 'You bought a phone on credit. Two things are now happening to it every month, and they go in opposite directions.', value: { k: 'num', n: 0 }, board: 'y = (1/2)ˣ' },
  { say: 'The base is the whole story. It is simply what one month does to the number.', value: { k: 'num', n: 0 }, board: 'base = one month' },
  { say: 'This base is a half. Multiply by a half and you are left with half of what you had.', value: { k: 'num', n: 0 }, board: '× 0.5 → half is left' },
  { say: 'Half is left, so half is gone. As a change, that is minus fifty percent every month.', value: { k: 'num', n: -50 }, board: '−50% a month' },
  { say: 'Set the dial that way and the bars fall — the handset losing its resale value, month after month. That is decay.', value: { k: 'num', n: -50 }, board: 'base < 1 → decay' },
  { say: 'A base above one would leave you with MORE than you had, and the bars would climb instead. That is the debt.', value: { k: 'num', n: -50 }, board: 'base > 1 → growth' },
]

const DEMO_WHEN: Task = {
  kind: 'when', title: 'When does it hit?', badge: '£50 × 2ˣ = £400', tone: 'a',
  prompt: '', say: '', work: [], n: 3, start: 50, base: 2, target: 400,
}
const DEMO_WHEN_STEPS: DemoStep<V>[] = [
  { say: 'Now the debt. You owe fifty pounds and it doubles every month you leave it alone.', value: { k: 'num', n: 0 }, board: '£50 × 2ˣ' },
  { say: 'The dashed line is four hundred pounds. The question is not how much — it is WHEN.', value: { k: 'num', n: 0 }, board: 'target £400' },
  { say: 'Start by taking the fifty you owed out of it. Four hundred divided by fifty is eight.', value: { k: 'num', n: 0 }, board: '2ˣ = 8' },
  { say: 'So the real question is how many doublings make eight. Two, four, eight — three of them.', value: { k: 'num', n: 3 }, board: '2 × 2 × 2 = 8' },
  { say: 'And that is a log: log base two of eight is three. The log did not ask how much, it asked how long.', value: { k: 'num', n: 3 }, board: 'log₂8 = 3' },
  { say: 'Slide the marker to month three and it lands exactly where the curve meets the line.', value: { k: 'num', n: 3 }, board: '3 months' },
]

// ══════════════════════════════════════════════════════════════════════════════
const CONFIG: GameConfig<V, Task> = {
  chapterId: 'expLogFunctions',
  title: 'THE BALANCE THAT GROWS',
  ticketLabel: 'statement',
  palette: P,
  motif: '💳',
  makeTask,
  answerPad: (t) => (t.kind === 'pow' || t.kind === 'log' ? numChoices(t.n ?? 0, t.pad ?? [], { min: 0 }) : []),
  // REQUIRED: V is a tagged union (docs/lessons.md — the 15–16 prod bug).
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) => (t.kind === 'form' || t.kind === 'law' ? { k: 'pick', id: '' } : { k: 'num', n: 0 }),
  grade: (t, v) =>
    t.kind === 'form' || t.kind === 'law'
      ? v.k === 'pick' && v.id === t.correctId
      : v.k === 'num' && v.n === t.n,
  revealText: (t) =>
    t.kind === 'form' || t.kind === 'law' ? (t.choices?.find((c) => c.id === t.correctId)?.label ?? '')
      : t.kind === 'rate' ? `${pct(t.n ?? 0)} a month`
        : t.kind === 'when' ? `${t.n} months`
          : String(t.n ?? 0),
  glide: (t, _f, setValue, later) => later(() => setValue(
    t.kind === 'form' || t.kind === 'law' ? { k: 'pick', id: t.correctId ?? '' } : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }): ReactElement => {
    if (task.kind === 'form' || task.kind === 'law') {
      return <SpecPicker P={palette} choices={task.choices ?? []} value={value.k === 'pick' ? value.id : ''}
        setValue={(id) => setValue({ k: 'pick', id })} correct={task.correctId} disabled={disabled} reveal={reveal}
        onCommit={(id) => onCommit({ k: 'pick', id })} commitLabel="LOCK IN ✓" prompt="which is it?" />
    }
    if (task.kind === 'when') {
      return <MonthDial task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
    }
    return <RateDial value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
  },
  TutorialScene: ({ task, value }) =>
    task.kind === 'when'
      ? <MonthDial task={task} value={value} setValue={() => {}} disabled onCommit={() => {}} />
      : <RateDial value={value} setValue={() => {}} disabled onCommit={() => {}} />,
  start: {
    blurb: <><strong>A phone bought on credit, paid at the minimum.</strong> The debt multiplies up every month; the handset multiplies down. Set what one month really does to a balance, work out how many times over it ends up — and answer the only question that matters: <strong>when</strong>.</>,
    ticket: { title: 'Statement', badge: '£50 × 2ˣ', tone: 'a' },
    startLabel: 'Open the statement →',
  },
  overview: {
    say: 'Here is the plan. A balance that multiplies by the same number every month is an exponential, and that number, the base, is the whole story: above one and it climbs, below one and it shrinks away. Multiply it out and you get how many times bigger it ends up. But the question you actually ask about a debt is when — when does it double, when does it hit the number you were warned about. That question is what a logarithm answers. Let us work one out together, nice and slow.',
    problem: <>How many months until <strong>£50 × 2ˣ</strong> reaches <strong>£400</strong>?</>,
    points: [
      <>The <strong>base</strong> is what one month does to the balance.</>,
      <>Above 1 it <strong>grows</strong>; below 1 it <strong>decays</strong>.</>,
      <>A <strong>log</strong> is not how much — it is <strong>how long</strong>.</>,
      <>Inside a log, <strong>×</strong> becomes <strong>+</strong> and <strong>÷</strong> becomes <strong>−</strong>.</>,
    ],
  },
  tutorial: [
    { task: DEMO_RATE, initial: { k: 'num', n: 0 }, hand: 'tap', steps: DEMO_RATE_STEPS },
    { task: DEMO_WHEN, initial: { k: 'num', n: 0 }, hand: 'tap', steps: DEMO_WHEN_STEPS },
  ],
  sig: (t) => `${t.kind}:${t.badge}:${t.prompt}`,
}

export default function BalanceThatGrows(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
