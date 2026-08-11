'use client'
/**
 * TrainingBlock — the Sequences & Series chapter (17–18) as a PLAYABLE GAME.
 *
 * World: THE TRAINING BLOCK. A programme where each week's set is built from the
 * last one — either by ADDING a fixed number of reps (arithmetic) or MULTIPLYING
 * by a fixed factor (geometric). That is the whole chapter in one object:
 *   • next term        = next week's set
 *   • common difference / ratio = the plan itself, "+d each week" or "×r each week"
 *   • nth term         = what week n asks for
 *   • series sum       = total reps in the whole block
 *
 * Every answer is PRODUCED, nothing is picked off a list:
 *   • TAP   → AnswerPad, for the four questions whose answer is a single number
 *             (next term, nth term, both sums). Distractors are the real
 *             misconceptions — one step short, one step long, and a₁ + n·d.
 *   • SET   → the PLAN DIAL: an ＋/× switch and a size. "What is the rule?" is
 *             answered by BUILDING the rule, which forces the child to commit to
 *             which KIND of sequence it is as well as the number. Picking "3" off a
 *             list hides the commonest error in the topic — calling a ratio a
 *             difference — and the dial makes it impossible to hide.
 *
 * ⚠️ ZERO pickers, and the chapter is unchanged mathematically. The curriculum ramp
 * also names Pascal/binomial coefficients and the limit of a convergent geometric
 * series; the old lesson generated NEITHER, so neither is added here. Porting is not
 * the moment to grow the syllabus. (docs/teen-17-18-gameshell-plan.md §5.1, seam 5.)
 *
 * The math is the old SequencesSeriesTeenLesson.makeRound, same L1/L2/L3 ramp,
 * rewritten as structured generators that expose the number instead of a string.
 */
import { type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, CommitBtn, Nudge, numChoices } from './parts/gameKit'
import { rint } from '@/core/rand'
import { disp } from '@/core/fmt'

const P: Palette = {
  nightTop: '#152a2a', nightBot: '#081414',
  cream: '#eef7f4', creamSoft: 'rgba(238,247,244,0.82)',
  inkOnPaper: '#152a2a', mutedOnPaper: '#6f8f88',
  gold: '#ffd166', goldDeep: '#c9962a',
  coral: '#ff9270', coralDeep: '#dd6440', mint: '#5fe0b0',
  glass: 'rgba(20,48,46,0.6)', glassBorder: 'rgba(238,247,244,0.2)',
}

const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
const SUB = '₀₁₂₃₄₅₆₇₈₉'

const arithTerms = (a1: number, d: number, n: number) => Array.from({ length: n }, (_, i) => a1 + i * d)
const geoTerms = (a1: number, r: number, n: number) => Array.from({ length: n }, (_, i) => a1 * r ** i)
const seqText = (t: number[]) => t.map(disp).join(', ')

// The answer is a NUMBER (tapped) or the RULE itself (built on the plan dial).
type V = { k: 'num'; n: number } | { k: 'rule'; op: '+' | '×'; d: number }

interface Task extends BaseTask {
  kind: 'next' | 'rule' | 'nth' | 'sum'
  n?: number                 // the numeric answer
  pad?: number[]             // its misconception distractors
  op?: '+' | '×'; d?: number // the rule answer
  terms?: number[]           // the weeks shown on the plan card
}

/** Both plans in one sentence, true whichever way the generator went: a difference
 *  may be NEGATIVE (a deload week), so this can never say "climbs" or "adds". */
const PLAN_LINE = 'Each week of the block is built from the week before by the same move every time — either adding a fixed number of reps, or multiplying by a fixed factor.'

// ── L1 · read the block ───────────────────────────────────────────────────────
function nextTask(): Task {
  const geo = Math.random() < 0.45
  const a1 = geo ? rint(1, 3) : rint(1, 6)
  const step = geo ? rint(2, 3) : rint(2, 5) * (Math.random() < 0.25 ? -1 : 1)
  const terms = geo ? geoTerms(a1, step, 4) : arithTerms(a1, step, 4)
  const n = geo ? a1 * step ** 4 : a1 + 4 * step
  return {
    kind: 'next', title: 'Next week', tone: 'a',
    badge: `${seqText(terms)}, ?`,
    prompt: 'What is next week\'s set?',
    context: `The first four weeks of the block are on the card. ${PLAN_LINE}`,
    padInstruction: 'Tap next week\'s number of reps.',
    say: `The block goes ${terms.map(spoken).join(', ')}. What comes next?`,
    work: [
      geo ? `Each week multiplies by ${disp(step)}.` : `Each week changes by ${disp(step)}.`,
      geo ? `So ${disp(terms[3])} × ${disp(step)} = ${disp(n)}.` : `So ${disp(terms[3])} + ${disp(step)} = ${disp(n)}.`,
    ],
    n, pad: geo ? [n + terms[3], n - terms[3], terms[3] * (step + 1)] : [n + step, n - step, n + 1],
    terms,
  }
}

/** ⚠️ ANSWERED ON THE DIAL, NOT THE PAD. The single commonest error in this topic is
 *  reading a geometric ratio as a difference; a number-only answer lets a child slide
 *  past it, because "3" is "3" either way. Building `× 3` says which. */
function ruleTask(): Task {
  const geo = Math.random() < 0.45
  const a1 = geo ? rint(1, 3) : rint(1, 6)
  const step = geo ? rint(2, 3) : rint(2, 5) * (Math.random() < 0.25 ? -1 : 1)
  const terms = geo ? geoTerms(a1, step, 4) : arithTerms(a1, step, 4)
  return {
    kind: 'rule', title: 'Read the plan', tone: 'b',
    badge: seqText(terms),
    prompt: 'What is the rule?',
    context: `Four weeks of someone else's block. ${PLAN_LINE} Work out which move it is, and how big.`,
    instruction: 'Set the move and its size, then lock it in.',
    say: `The block goes ${terms.map(spoken).join(', ')}. What is the rule that builds it?`,
    work: [
      'Compare two weeks that sit next to each other. Does the gap between them stay the same, or does the number keep multiplying?',
      geo
        ? `${disp(terms[1])} ÷ ${disp(terms[0])} = ${disp(step)}, and that holds all the way along — so the move is × ${disp(step)}.`
        : `${disp(terms[1])} − ${disp(terms[0])} = ${disp(step)}, and that holds all the way along — so the move is + ${disp(step)}.`,
    ],
    op: geo ? '×' : '+', d: step, terms,
  }
}

// ── L2 · jump to any week ─────────────────────────────────────────────────────
function nthTask(): Task {
  const geo = Math.random() < 0.4
  if (!geo) {
    const a1 = rint(1, 6)
    const d = rint(2, 5) * (Math.random() < 0.25 ? -1 : 1)
    const week = rint(5, 9)
    const n = a1 + (week - 1) * d
    return {
      kind: 'nth', title: `Week ${week}`, tone: 'a',
      badge: `a₁ = ${disp(a1)},  d = ${disp(d)}`, answerLabel: `a${SUB[week]} =`,
      prompt: `What does week ${week} ask for?`,
      context: `The block starts at ${disp(a1)} reps and changes by ${disp(d)} every week. You want week ${week} without writing out all the weeks in between.`,
      padInstruction: `Tap the reps for week ${week}.`,
      say: `The block starts at ${spoken(a1)} and changes by ${spoken(d)} each week. What is week ${week}?`,
      work: [
        'Jumping to week n takes aₙ = a₁ + (n − 1)d — you make n − 1 moves, not n.',
        `${disp(a1)} + (${week} − 1) × ${disp(d)} = ${disp(a1)} + ${disp((week - 1) * d)} = ${disp(n)}.`,
      ],
      // The off-by-one (a₁ + n·d, one move too many) is the misconception this
      // question exists to catch, so it must be on the pad.
      n, pad: [a1 + week * d, n + d, n - d], terms: arithTerms(a1, d, 3),
    }
  }
  const a1 = rint(1, 3)
  const r = 2
  const week = rint(3, 5)
  const n = a1 * r ** (week - 1)
  return {
    kind: 'nth', title: `Week ${week}`, tone: 'a',
    badge: `a₁ = ${disp(a1)},  r = ${disp(r)}`, answerLabel: `a${SUB[week]} =`,
    prompt: `What does week ${week} ask for?`,
    context: `This block starts at ${disp(a1)} reps and DOUBLES every week. You want week ${week} without writing out all the weeks in between.`,
    padInstruction: `Tap the reps for week ${week}.`,
    say: `The block starts at ${spoken(a1)} and doubles each week. What is week ${week}?`,
    work: [
      'Jumping to week n takes aₙ = a₁ · r^(n − 1) — you multiply n − 1 times, not n.',
      `${disp(a1)} × ${disp(r)}^${week - 1} = ${disp(a1)} × ${disp(r ** (week - 1))} = ${disp(n)}.`,
    ],
    n, pad: [a1 * r ** week, n * r, n / r], terms: geoTerms(a1, r, 3),
  }
}

// ── L3 · total reps in the block ──────────────────────────────────────────────
function sumTask(): Task {
  if (Math.random() < 0.6) {
    const a1 = rint(1, 5)
    const d = rint(2, 4)
    const weeks = rint(4, 8)
    const an = a1 + (weeks - 1) * d
    const n = (weeks * (a1 + an)) / 2
    return {
      kind: 'sum', title: 'Whole block', tone: 'b',
      badge: `${seqText(arithTerms(a1, d, 3))}, …   (${weeks} weeks)`,
      prompt: 'How many reps in the whole block?',
      // d is drawn from 2..4 here, so "climbs" IS true for every seed of this task.
      context: `A ${weeks}-week block that starts at ${disp(a1)} reps and climbs by ${disp(d)} every week. Add up every week — how many reps is that in total?`,
      padInstruction: 'Tap the total for the block.',
      say: `A ${weeks} week block starts at ${spoken(a1)} and climbs by ${spoken(d)} each week. What is the total?`,
      work: [
        'Pair the first week with the last and they add to the same thing as the second with the second-to-last — so Sₙ = n/2 × (a₁ + aₙ).',
        `Week ${weeks} is ${disp(an)}, so the total is ${weeks}/2 × (${disp(a1)} + ${disp(an)}) = ${disp(n)}.`,
      ],
      n, pad: [n + d, n - a1, an * weeks], terms: arithTerms(a1, d, 3),
    }
  }
  const a1 = rint(1, 3)
  const r = 2
  const weeks = rint(3, 5)
  const terms = geoTerms(a1, r, weeks)
  const n = terms.reduce((s, t) => s + t, 0)
  return {
    kind: 'sum', title: 'Whole block', tone: 'b',
    badge: `${seqText(geoTerms(a1, r, 3))}, …   (${weeks} weeks)`,
    prompt: 'How many reps in the whole block?',
    context: `A ${weeks}-week block that starts at ${disp(a1)} reps and doubles every week. Add up every week — how many reps is that in total?`,
    padInstruction: 'Tap the total for the block.',
    say: `A ${weeks} week block starts at ${spoken(a1)} and doubles each week. What is the total?`,
    work: [
      'A doubling block is short enough to add straight out.',
      `${terms.map(disp).join(' + ')} = ${disp(n)}.`,
    ],
    n, pad: [n + terms[weeks - 1], n - a1, n + 1], terms: geoTerms(a1, r, Math.min(weeks, 4)),
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return Math.random() < 0.5 ? ruleTask() : nextTask()
  if (d === 2) return nthTask()
  return sumTask()
}

// ══════════════════════════════════════════════════════════════════════════════
// THE PLAN DIAL — set the move (＋ or ×) and its size, then lock it in. The little
// preview applies the rule the child has built to the first week on the card, so
// they can SEE their rule disagree with the block before they commit it.
// ══════════════════════════════════════════════════════════════════════════════
function PlanDial({ task, value, setValue, disabled, reveal, onCommit }: {
  task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const op = value.k === 'rule' ? value.op : '+'
  const d = value.k === 'rule' ? value.d : 0
  const first = task.terms?.[0] ?? 1
  const preview = op === '+' ? first + d : first * d
  const col = reveal ? P.mint : P.gold
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      {/* the block, week by week */}
      <div style={{ display: 'flex', gap: 'clamp(5px,0.7vw,10px)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {(task.terms ?? []).map((t, i) => (
          <div key={i} style={{ minWidth: 'clamp(38px,4.4vw,60px)', padding: 'clamp(5px,0.7vw,9px) clamp(6px,0.8vw,12px)', borderRadius: 10, background: P.glass, border: `1px solid ${P.glassBorder}`, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(9px,0.85vw,11px)', color: P.mutedOnPaper, letterSpacing: '0.08em' }}>WK {i + 1}</div>
            <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(16px,1.9vw,26px)', color: P.cream }}>{disp(t)}</div>
          </div>
        ))}
      </div>

      {/* the rule the child is building */}
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(24px,3.2vw,42px)', fontWeight: 800, color: col, textShadow: `0 0 18px ${(reveal ? '#3fa77c' : P.goldDeep)}55` }}>
        {op} {disp(d)} <span style={{ fontSize: '0.5em', color: P.mutedOnPaper, fontWeight: 600 }}>each week</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1vw,16px)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {(['+', '×'] as const).map((o) => (
          <button key={o} type="button" disabled={disabled} onClick={() => setValue({ k: 'rule', op: o, d })}
            style={{
              width: 'clamp(50px,5vw,68px)', height: 'clamp(44px,4.4vw,60px)', borderRadius: 12,
              border: `2px solid ${op === o ? col : P.glassBorder}`, background: op === o ? `${col}22` : P.glass,
              color: op === o ? col : P.creamSoft, fontFamily: 'var(--font-numeric)', fontWeight: 800,
              fontSize: 'clamp(20px,2.2vw,30px)', cursor: disabled ? 'default' : 'pointer',
            }}>{o === '+' ? '＋' : '×'}</button>
        ))}
        <Nudge P={P} label="−" disabled={disabled} onClick={() => setValue({ k: 'rule', op, d: Math.max(-5, d - 1) })} />
        <span style={{ minWidth: 'clamp(34px,3.4vw,50px)', textAlign: 'center', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(20px,2.2vw,30px)', color: P.cream }}>{disp(d)}</span>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => setValue({ k: 'rule', op, d: Math.min(5, d + 1) })} />
      </div>

      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px,1.1vw,15px)', color: P.mutedOnPaper }}>
        week 1 is {disp(first)} → your rule gives {disp(preview)}
      </div>

      <CommitBtn P={P} label="THAT'S THE PLAN ✓" disabled={disabled} onClick={() => onCommit({ k: 'rule', op, d })} />
    </div>
  )
}

// ── walkthrough: one worked example on the dial, the only graded gesture that is
//    not a plain tap. The pad questions need no rehearsal.
const DEMO: Task = {
  kind: 'rule', title: 'Read the plan', badge: '3, 6, 12, 24', tone: 'b',
  prompt: '', say: '', work: [], op: '×', d: 2, terms: [3, 6, 12, 24],
}
const DEMO_STEPS: DemoStep<V>[] = [
  { say: 'Here is somebody else\'s training block. Four weeks: three, six, twelve, twenty-four.', value: { k: 'rule', op: '+', d: 0 }, board: '3, 6, 12, 24' },
  { say: 'The question is what move builds it. There are only two kinds — you either add the same amount every week, or you multiply by the same amount.', value: { k: 'rule', op: '+', d: 0 }, board: 'add? or multiply?' },
  { say: 'Try adding first. Week one is three and week two is six, so that would be plus three.', value: { k: 'rule', op: '+', d: 3 }, board: '6 − 3 = 3' },
  { say: 'But check it against the next pair. Six to twelve is a jump of six, not three. So adding three is not the rule.', value: { k: 'rule', op: '+', d: 3 }, board: '12 − 6 = 6  ✗' },
  { say: 'So try multiplying instead. Three to six is times two.', value: { k: 'rule', op: '×', d: 2 }, board: '6 ÷ 3 = 2' },
  { say: 'And six to twelve is times two. And twelve to twenty-four is times two as well. It holds the whole way along.', value: { k: 'rule', op: '×', d: 2 }, board: '12 ÷ 6 = 2 ✓' },
  { say: 'So the rule is times two every week. That is a geometric block — and notice the gap between weeks kept growing, which is what tells you it was never an adding one.', value: { k: 'rule', op: '×', d: 2 }, board: 'rule: × 2' },
]

// ══════════════════════════════════════════════════════════════════════════════
const CONFIG: GameConfig<V, Task> = {
  chapterId: 'sequencesSeries',
  title: 'THE TRAINING BLOCK',
  ticketLabel: 'programme',
  palette: P,
  motif: '🏋️',
  makeTask,
  // Everything whose answer is one number is tapped; only the RULE keeps an
  // instrument, because its answer is a move AND a size.
  answerPad: (t) => (t.kind === 'rule' ? [] : numChoices(t.n ?? 0, t.pad ?? [])),
  // REQUIRED: V is a tagged union (see docs/lessons.md — the 15–16 prod bug).
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) => (t.kind === 'rule' ? { k: 'rule', op: '+', d: 0 } : { k: 'num', n: 0 }),
  grade: (t, v) => (t.kind === 'rule'
    ? v.k === 'rule' && v.op === t.op && v.d === t.d
    : v.k === 'num' && v.n === t.n),
  revealText: (t) => (t.kind === 'rule' ? `${t.op} ${disp(t.d ?? 0)}` : disp(t.n ?? 0)),
  glide: (t, _f, setValue, later) => later(() => setValue(
    t.kind === 'rule' ? { k: 'rule', op: t.op ?? '+', d: t.d ?? 0 } : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, onCommit }): ReactElement =>
    <PlanDial task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />,
  TutorialScene: ({ value }) => <PlanDial task={DEMO} value={value} setValue={() => {}} disabled onCommit={() => {}} />,
  start: {
    blurb: <><strong>Every week of a training block</strong> is built from the week before — you either <strong>add</strong> the same number of reps, or <strong>multiply</strong> by the same factor. Read the plan, jump to any week, and total up the block.</>,
    ticket: { title: 'Week 1–4', badge: '3, 6, 12, 24', tone: 'b' },
    startLabel: 'Read the programme →',
  },
  overview: {
    say: 'Here is the plan. A training block builds each week out of the week before, and there are only two ways to do it: add the same number of reps every week, or multiply by the same factor every week. Once you know which move it is, you can jump straight to any week, and you can total up the whole block. Let us read one together, nice and slow.',
    problem: <>What rule builds <strong>3, 6, 12, 24</strong>?</>,
    points: [
      <>Add the same amount each week → <strong>arithmetic</strong>.</>,
      <>Multiply by the same factor → <strong>geometric</strong>.</>,
      <>Check the move on <strong>every pair</strong>, not just the first.</>,
      <>Know the rule and you can jump to <strong>any week</strong>.</>,
    ],
  },
  tutorial: [{ task: DEMO, initial: { k: 'rule', op: '+', d: 0 }, hand: 'tap', steps: DEMO_STEPS }],
  sig: (t) => `${t.kind}:${t.badge}`,
}

export default function TrainingBlock(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
