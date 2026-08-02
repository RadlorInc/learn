'use client'
/**
 * ResaleFlip — the Quadratic Functions in Depth chapter (17–18) as a PLAYABLE GAME.
 *
 * World: THE RESALE FLIP. You bought a pair to resell. Price them too low and you
 * make nothing per pair; price them too high and nobody buys. Profit against price
 * is a parabola, and every feature of it is a decision you would actually make:
 *   • the vertex     = the price that makes the most money
 *   • the axis       = that price, on its own
 *   • the roots      = the two break-even prices
 *   • the discriminant = whether this flip can EVER break even at all
 *   • opens up/down  = whether there is a best price or a worst one
 *
 * ⚠️ MUST NOT READ AS 15–16's THE SHOT, which is a basketball arc. Same curve,
 * different world: this one is about money, and the vertex is a decision rather
 * than a high point in the air.
 *
 *   • TAP   → AnswerPad: the axis of symmetry, and how many real roots.
 *   • BUILD → the PRICE BOARD: the vertex as (price, profit), and the two
 *             break-even prices as a pair. Both are two integers in a template,
 *             which is a thing to build rather than pick.
 *   • PICK  → SpecPicker, twice and deliberately: which way the curve turns, and
 *             what a negative discriminant means. Both are genuine classifications
 *             with no number to produce, and the curriculum's own answer-format
 *             policy asks for MCQ on the complex-root case.
 *
 * That is 2 of the ~10 pickers budgeted for the whole band
 * (docs/teen-17-18-gameshell-plan.md §3) — the plan guessed 1 for this chapter, and
 * the direction question is the second. It is honestly binary: there is no number
 * to build, and folding it into the vertex builder would change what is asked.
 *
 * The math is the old QuadraticAnalysisTeenLesson.makeRound, same L1/L2/L3 ramp.
 */
import { type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SpecPicker, CommitBtn, Nudge, numChoices } from './parts/gameKit'
import { rint } from '@/core/rand'

const P: Palette = {
  nightTop: '#2b2118', nightBot: '#130d08',
  cream: '#f8f0e6', creamSoft: 'rgba(248,240,230,0.82)',
  inkOnPaper: '#2b2118', mutedOnPaper: '#9b8874',
  gold: '#ffc861', goldDeep: '#c9902a',
  coral: '#ff9068', coralDeep: '#dd5f38', mint: '#7dd8a8',
  glass: 'rgba(46,34,24,0.62)', glassBorder: 'rgba(248,240,230,0.2)',
}

const fmt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
const disc = (a: number, b: number, c: number) => b * b - 4 * a * c

type V = { k: 'num'; n: number } | { k: 'pair'; a: number; b: number } | { k: 'pick'; id: string }

interface Task extends BaseTask {
  kind: 'axis' | 'vertex' | 'roots' | 'count' | 'turn' | 'complex'
  n?: number; pad?: number[]
  pa?: number; pb?: number                       // the built pair
  correctId?: string; choices?: { id: string; label: string }[]
  /** what the pair's two steppers are called on screen */
  labels?: [string, string]
}

// ── L1 · read the curve you already have ──────────────────────────────────────
function vertexFormEqn(a: number, h: number, k: number) {
  const aStr = a === 1 ? '' : '−'
  const hFac = h === 0 ? 'x' : `(x ${h < 0 ? '+' : '−'} ${Math.abs(h)})`
  const kPart = k === 0 ? '' : ` ${k < 0 ? '−' : '+'} ${Math.abs(k)}`
  return `y = ${aStr}${hFac}²${kPart}`
}

function l1Task(): Task {
  const a = Math.random() < 0.5 ? 1 : -1
  const h = rint(-4, 4)
  const k = rint(-4, 4)
  const eqn = vertexFormEqn(a, h, k)
  const roll = Math.random()

  if (roll < 0.34) {
    return {
      kind: 'vertex', title: 'The best price', tone: 'a',
      badge: eqn, showEquals: false,
      prompt: 'Where is the turning point?',
      // True whichever way a lands: it turns, and the turn is the vertex.
      context: 'Profit against price is written here in the form that hands you the turning point directly — the bracket carries the price it turns at, and the number outside carries the profit there.',
      instruction: 'Build the turning point, then lock it in.',
      say: 'In this vertex form parabola, what is the vertex?',
      work: [
        'In vertex form the number inside the bracket is the price, and it comes out with the OPPOSITE sign.',
        `So the price is ${fmt(h)}, and the profit outside the bracket stays as it is: ${fmt(k)}.`,
      ],
      pa: h, pb: k, labels: ['price', 'profit'],
    }
  }
  if (roll < 0.67) {
    return {
      kind: 'axis', title: 'The best price', tone: 'a',
      badge: eqn, answerLabel: 'price =',
      prompt: 'Which price is the turning point?',
      context: 'The curve is a mirror image of itself either side of one price, and that price is where it turns. It is the number in the bracket — with its sign flipped.',
      padInstruction: 'Tap the price it turns at.',
      say: 'What is the axis of symmetry?',
      work: ['The axis runs straight through the turning point.', `Inside the bracket flips sign, so the price is ${fmt(h)}.`],
      n: h, pad: [-h, k, 0],
    }
  }
  // ⚠️ A genuine binary: nothing to build, so a two-card pick (see the header).
  return {
    kind: 'turn', title: 'Which way?', tone: 'b',
    badge: eqn, showEquals: false,
    prompt: 'Best price, or worst?',
    context: 'The sign in front of the squared bracket decides which way the curve turns. One way gives a price where profit peaks; the other gives a price where it bottoms out.',
    instruction: 'Choose which way it turns, then lock it in.',
    say: 'Does this parabola open up or down?',
    work: [`The number in front is ${fmt(a)}, so the curve ${a > 0 ? 'opens upward, and the turning point is its LOWEST value' : 'opens downward, and the turning point is its HIGHEST value'}.`],
    correctId: a > 0 ? 'up' : 'down',
    choices: [
      { id: 'up', label: 'Opens up — a worst price' },
      { id: 'down', label: 'Opens down — a best price' },
    ],
  }
}

// ── L2 · break even ───────────────────────────────────────────────────────────
function countTask(): Task {
  const a = rint(1, 3), b = rint(-6, 6), c = rint(-4, 6)
  const D = disc(a, b, c)
  const n = D > 0 ? 2 : D === 0 ? 1 : 0
  const eqn = `y = ${a === 1 ? '' : a}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`
  return {
    kind: 'count', title: 'Break even?', tone: 'a',
    badge: `${eqn}     b² − 4ac = ${fmt(D)}`, answerLabel: 'break-even prices:',
    prompt: 'How many break-even prices?',
    context: `Breaking even means profit is exactly zero — the curve touching the line. The discriminant has already been worked out for you at ${fmt(D)}; its SIGN is what tells you how many times that happens.`,
    padInstruction: 'Tap how many break-even prices there are.',
    say: `The discriminant is ${spoken(D)}. How many real roots?`,
    work: [
      `b² − 4ac = ${fmt(D)}.`,
      D > 0 ? 'Positive, so the curve crosses zero twice — two break-even prices.'
        : D === 0 ? 'Exactly zero, so the curve just touches — one break-even price.'
          : 'Negative, so the curve never reaches zero — it never breaks even.',
    ],
    n, pad: [n + 1, n === 0 ? 2 : 0, n === 2 ? 1 : 2],
  }
}

function rootsTask(): Task {
  let p = rint(1, 6), q = rint(1, 6)
  let guard = 0
  while (q === p && guard++ < 20) q = rint(1, 6)
  const lo = Math.min(p, q), hi = Math.max(p, q)
  return {
    kind: 'roots', title: 'Break even', tone: 'b',
    badge: `x² − ${p + q}x + ${p * q} = 0`, showEquals: false,
    prompt: 'At which two prices?',
    context: 'Profit is zero at two prices here — one too low to make anything, one too high to sell. Find the pair of numbers that multiply to the last term and add to the middle one.',
    instruction: 'Build both break-even prices, then lock it in.',
    say: 'What are the roots of this quadratic?',
    work: [
      `You need two numbers that multiply to ${p * q} and add to ${p + q}.`,
      `That is ${lo} and ${hi}, so it factors as (x − ${lo})(x − ${hi}).`,
      `Profit is zero at ${lo} and at ${hi}.`,
    ],
    pa: lo, pb: hi, labels: ['lower', 'higher'],
  }
}

// ── L3 · harder vertex, and the flip that never works ─────────────────────────
function stdVertexTask(): Task {
  const a = Math.random() < 0.5 ? 1 : -1
  const vx = rint(-3, 3)
  const b = -2 * a * vx
  const c = rint(-4, 4)
  const vy = a * vx * vx + b * vx + c
  const aStr = a === 1 ? '' : '−'
  return {
    kind: 'vertex', title: 'The best price', tone: 'a',
    badge: `y = ${aStr}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`, showEquals: false,
    prompt: 'Where is the turning point?',
    context: 'This time the profit curve is written out flat, so the turning point is not sitting there to be read. Get the price from x = −b ÷ 2a, then put that price back in to get the profit.',
    instruction: 'Build the turning point, then lock it in.',
    say: 'Use x equals negative b over 2 a to find the vertex.',
    work: [
      `Price first: x = −b ÷ 2a = ${fmt(-b)} ÷ ${fmt(2 * a)} = ${fmt(vx)}.`,
      `Then put ${fmt(vx)} back into the equation to get the profit: ${fmt(vy)}.`,
    ],
    pa: vx, pb: vy, labels: ['price', 'profit'],
  }
}

/** ⚠️ Picker #2, and the curriculum's answer-format policy asks for MCQ here: there
 *  is no real number to build, and "no roots at all" versus "two complex roots" is
 *  exactly the distinction being tested. */
function complexTask(): Task {
  const a = rint(1, 2)
  let b = rint(-3, 3), c = rint(2, 6), guard = 0
  while (disc(a, b, c) >= 0 && guard++ < 40) { b = rint(-3, 3); c = rint(2, 6) }
  const D = disc(a, b, c)
  return {
    kind: 'complex', title: 'Never breaks even', tone: 'b',
    badge: `${a === 1 ? '' : a}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x + ${c} = 0     b² − 4ac = ${fmt(D)}`,
    showEquals: false,
    prompt: 'So what are its roots?',
    context: `The discriminant came out at ${fmt(D)}, which is below zero — so this flip never breaks even at any real price. That does not mean the equation has no solutions, though; it means the solutions are not real numbers.`,
    instruction: 'Choose what that means, then lock it in.',
    say: 'The discriminant is negative. What are the roots?',
    work: [
      `b² − 4ac = ${fmt(D)}, and a negative sits under the square root in the formula.`,
      'A negative under the root gives imaginary parts, so there are two complex roots and no real ones.',
    ],
    correctId: 'complex',
    choices: [
      { id: 'complex', label: '2 complex roots (no real ones)' },
      { id: 'two', label: '2 distinct real roots' },
      { id: 'one', label: '1 repeated real root' },
      { id: 'none', label: 'no roots at all' },
    ],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return l1Task()
  if (d === 2) return Math.random() < 0.5 ? countTask() : rootsTask()
  return Math.random() < 0.5 ? stdVertexTask() : complexTask()
}

// ══════════════════════════════════════════════════════════════════════════════
// THE PRICE BOARD — build a pair of numbers, with the profit curve drawn from the
// pair the child has set so a wrong vertex looks wrong.
// ══════════════════════════════════════════════════════════════════════════════
function PriceBoard({ task, value, setValue, disabled, reveal, onCommit }: {
  task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const a = value.k === 'pair' ? value.a : 0
  const b = value.k === 'pair' ? value.b : 0
  const [la, lb] = task.labels ?? ['first', 'second']
  const col = reveal ? P.mint : P.gold
  const Part = ({ label, val, on }: { label: string; val: number; on: (n: number) => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px,0.9vw,12px)' }}>
      <span style={{ width: 'clamp(56px,6vw,84px)', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px,1vw,13px)', letterSpacing: '0.07em', color: P.mutedOnPaper, textTransform: 'uppercase' }}>{label}</span>
      <Nudge P={P} label="−" disabled={disabled} onClick={() => on(Math.max(-12, val - 1))} />
      <span style={{ minWidth: 'clamp(32px,3.2vw,46px)', textAlign: 'center', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(18px,2vw,28px)', color: P.cream }}>{fmt(val)}</span>
      <Nudge P={P} label="+" disabled={disabled} onClick={() => on(Math.min(12, val + 1))} />
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(24px,3.2vw,44px)', fontWeight: 800, color: col, textShadow: `0 0 18px ${(reveal ? '#3fa77c' : P.goldDeep)}55` }}>
        {task.kind === 'roots' ? `${fmt(a)} and ${fmt(b)}` : `(${fmt(a)}, ${fmt(b)})`}
      </div>
      <Part label={la} val={a} on={(n) => setValue({ k: 'pair', a: n, b })} />
      <Part label={lb} val={b} on={(n) => setValue({ k: 'pair', a, b: n })} />
      <CommitBtn P={P} label="PRICE IT ✓" disabled={disabled} onClick={() => onCommit({ k: 'pair', a, b })} />
    </div>
  )
}

// ── walkthrough: vertex form, where the sign flip inside the bracket lives ────
const DEMO: Task = {
  kind: 'vertex', title: 'The best price', badge: 'y = −(x − 4)² + 9', tone: 'a',
  prompt: '', say: '', work: [], pa: 4, pb: 9, labels: ['price', 'profit'],
}
const DEMO_STEPS: DemoStep<V>[] = [
  { say: 'You bought a pair to flip. Price them too cheap and you barely make anything; price them too dear and nobody buys at all.', value: { k: 'pair', a: 0, b: 0 }, board: 'y = −(x − 4)² + 9' },
  { say: 'So profit against price is a curve with a peak, and the peak is the price you actually want.', value: { k: 'pair', a: 0, b: 0 }, board: 'peak = best price' },
  { say: 'The minus in front is what makes it peak rather than dip. Written this way, the curve hands you the peak directly.', value: { k: 'pair', a: 0, b: 0 }, board: '− in front → it peaks' },
  { say: 'The price is inside the bracket — but it comes out with its sign flipped. The bracket says x minus four, so the price is positive four.', value: { k: 'pair', a: 4, b: 0 }, board: '(x − 4) → price 4' },
  { say: 'Check that and you can see why. At a price of four the bracket is zero, the squared term vanishes, and nothing is taken away.', value: { k: 'pair', a: 4, b: 0 }, board: 'at 4 the bracket is 0' },
  { say: 'The number outside is the profit there, and that one does not flip. Plus nine means nine.', value: { k: 'pair', a: 4, b: 9 }, board: '+ 9 → profit 9' },
  { say: 'So the turning point is four, nine: charge four and you make nine, and any other price makes less. Inside the bracket flips, outside does not.', value: { k: 'pair', a: 4, b: 9 }, board: 'vertex (4, 9)' },
]

// ══════════════════════════════════════════════════════════════════════════════
const CONFIG: GameConfig<V, Task> = {
  chapterId: 'quadraticAnalysis',
  title: 'THE RESALE FLIP',
  ticketLabel: 'price sheet',
  palette: P,
  motif: '👟',
  makeTask,
  answerPad: (t) => (t.kind === 'axis' || t.kind === 'count' ? numChoices(t.n ?? 0, t.pad ?? [], { min: 0 }) : []),
  // REQUIRED: V is a tagged union (docs/lessons.md — the 15–16 prod bug).
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) =>
    t.kind === 'vertex' || t.kind === 'roots' ? { k: 'pair', a: 0, b: 0 }
      : t.kind === 'turn' || t.kind === 'complex' ? { k: 'pick', id: '' }
        : { k: 'num', n: 0 },
  grade: (t, v) =>
    t.kind === 'vertex' || t.kind === 'roots' ? v.k === 'pair' && v.a === t.pa && v.b === t.pb
      : t.kind === 'turn' || t.kind === 'complex' ? v.k === 'pick' && v.id === t.correctId
        : v.k === 'num' && v.n === t.n,
  revealText: (t) =>
    t.kind === 'vertex' ? `(${fmt(t.pa ?? 0)}, ${fmt(t.pb ?? 0)})`
      : t.kind === 'roots' ? `${fmt(t.pa ?? 0)} and ${fmt(t.pb ?? 0)}`
        : t.kind === 'turn' || t.kind === 'complex' ? (t.choices?.find((c) => c.id === t.correctId)?.label ?? '')
          : fmt(t.n ?? 0),
  glide: (t, _f, setValue, later) => later(() => setValue(
    t.kind === 'vertex' || t.kind === 'roots' ? { k: 'pair', a: t.pa ?? 0, b: t.pb ?? 0 }
      : t.kind === 'turn' || t.kind === 'complex' ? { k: 'pick', id: t.correctId ?? '' }
        : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }): ReactElement => {
    if (task.kind === 'turn' || task.kind === 'complex') {
      return <SpecPicker P={palette} choices={task.choices ?? []} value={value.k === 'pick' ? value.id : ''}
        setValue={(id) => setValue({ k: 'pick', id })} correct={task.correctId} disabled={disabled} reveal={reveal}
        onCommit={(id) => onCommit({ k: 'pick', id })} commitLabel="LOCK IN ✓" prompt="which is it?" />
    }
    return <PriceBoard task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
  },
  TutorialScene: ({ value }) => <PriceBoard task={DEMO} value={value} setValue={() => {}} disabled onCommit={() => {}} />,
  start: {
    blurb: <><strong>You bought a pair to flip.</strong> Too cheap and you make nothing; too dear and nobody buys. Profit against price is a curve — find the price that makes the most, the prices where you break even, and whether some flips can break even <strong>at all</strong>.</>,
    ticket: { title: 'Price sheet', badge: '−(x − 4)² + 9', tone: 'a' },
    startLabel: 'Set a price →',
  },
  overview: {
    say: 'Here is the plan. Profit against price is a curve, because pricing too low and pricing too high both cost you. The turning point of that curve is the price you actually want. The places it crosses zero are the prices where you just break even. And one number, the discriminant, tells you whether it ever breaks even at all. Let us read one together, nice and slow.',
    problem: <>What is the best price for <strong>y = −(x − 4)² + 9</strong>?</>,
    points: [
      <>The <strong>turning point</strong> is the price that makes the most.</>,
      <>Inside the bracket the price comes out with its <strong>sign flipped</strong>.</>,
      <>Crossing zero is <strong>breaking even</strong>.</>,
      <>A negative <strong>discriminant</strong> means it never does.</>,
    ],
  },
  tutorial: [{ task: DEMO, initial: { k: 'pair', a: 0, b: 0 }, hand: 'tap', steps: DEMO_STEPS }],
  sig: (t) => `${t.kind}:${t.badge}`,
}

export default function ResaleFlip(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
