'use client'
/**
 * TheReviews — the Statistics & Inference chapter (17–18) as a PLAYABLE GAME.
 *
 * World: THE REVIEWS. A star rating on a listing, which is the one statistic
 * everyone reads and almost nobody reads correctly:
 *   • the AVERAGE is a mean, and one furious one-star drags it further than any
 *     number of mild ones
 *   • the MEDIAN barely moves, which is exactly what "resistant" means
 *   • a 4.6 from 12 ratings and a 4.4 from 2,000 are not the same claim, and the
 *     difference is margin of error
 *   • and WHO BOTHERS to leave a review at all is selection bias, textbook
 *
 *   • TAP  → AnswerPad: mean, median, mode, range, the chance the next one is
 *            five stars (as a percent, so it stays decimal-clean), and how many
 *            points of slack a rating built on n reviews deserves.
 *   • SET  → THE INCOMING REVIEW: slide the star rating of the one review still
 *            to land until the listing's average reaches a stated figure. That is
 *            the outlier's pull, produced rather than described. ⚠️ The running
 *            average is NOT shown while answering — showing it would let the child
 *            slide until the screen agreed (docs/chapter-craft.md §1). It appears
 *            on the reveal, where the answer has already been given.
 *   • PICK → SpecPicker, ONCE: which set of reviews is least biased. Genuine (plan
 *            §5.2) — there is no number to produce. 1 of the ~10 band pickers.
 *
 * The math is the old StatsInferenceTeenLesson.makeRound. Two of its items were
 * conceptual four-card MCQs — "which summary resists an outlier" and "what happens
 * to the mean if you add one" — and BOTH are now carried by the incoming-review
 * slider, which makes the point by doing it instead of asking about it. The poll
 * question became the margin-of-error number, which is the same idea with an
 * answer you can produce. Nothing was added.
 */
import { type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SpecPicker, CommitBtn, Nudge, numChoices } from './parts/gameKit'
import { rint, shuffle, pick } from '@/core/rand'

const P: Palette = {
  nightTop: '#2a2312', nightBot: '#0f0c05',
  cream: '#fdf4e3', creamSoft: 'rgba(253,244,227,0.82)',
  inkOnPaper: '#2a2312', mutedOnPaper: '#a4906a',
  gold: '#ffd24a', goldDeep: '#c9971a',
  coral: '#ff977e', coralDeep: '#dd5c3c', mint: '#86dcae',
  glass: 'rgba(42,35,18,0.62)', glassBorder: 'rgba(253,244,227,0.2)',
}

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0)
const round1 = (n: number) => Math.round(n * 10) / 10
const meanOf = (a: number[]) => round1(sum(a) / a.length)
const medianOf = (a: number[]) => [...a].sort((x, y) => x - y)[(a.length - 1) / 2]
const modeOf = (a: number[]) => {
  const c = new Map<number, number>()
  for (const v of a) c.set(v, (c.get(v) ?? 0) + 1)
  let best = a[0], bestC = 0
  for (const [v, n] of c) if (n > bestC) { best = v; bestC = n }
  return best
}

// A tapped or slid number, or a chosen sample.
type V = { k: 'num'; n: number } | { k: 'pick'; id: string }

interface Task extends BaseTask {
  kind: 'mean' | 'median' | 'mode' | 'range' | 'drag' | 'chance' | 'moe' | 'bias'
  n?: number; pad?: number[]
  /** drag: the reviews already in, and the average being aimed at */
  base?: number[]; target?: number
  correctId?: string; choices?: { id: string; label: string }[]
}

/** Five star ratings with a guaranteed repeat, so a mode always exists. */
/** ⚠️ MODULE LEVEL. Declared inside its parent this is a new component TYPE on every render,
 *  so React unmounts and remounts the subtree each time — restarting its transitions and
 *  discarding the elements the child is interacting with. Closed-over values are props. */
function Bar({ v, live, col }: { v: number; live?: boolean; col: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 'clamp(16px,1.9vw,26px)', height: `${v * 13}px`, borderRadius: '4px 4px 0 0',
        background: live ? col : P.creamSoft, opacity: live ? 1 : 0.5,
        border: live ? `2px solid ${col}` : 'none',
      }} />
      <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(9px,0.95vw,12px)', color: live ? col : P.mutedOnPaper }}>{v}★</span>
    </div>
  )
}

function ratings(): number[] {
  const out = Array.from({ length: 4 }, () => rint(1, 5))
  out.push(out[rint(0, 3)])
  return shuffle(out)
}
const listOf = (a: number[]) => a.map((v) => `${v}★`).join('  ')

// ── L1 · the three middles ────────────────────────────────────────────────────
function centreTask(): Task {
  const data = ratings()
  const roll = rint(0, 2)
  const mean = meanOf(data), med = medianOf(data), mode = modeOf(data)
  if (roll === 0) {
    return {
      kind: 'mean', title: 'The star rating', tone: 'a',
      badge: listOf(data), answerLabel: 'average =',
      prompt: 'What is the average?',
      context: 'The number printed at the top of a listing is the mean: every rating added together, then shared out evenly between them. It uses all five, so all five get a say in it.',
      padInstruction: 'Tap the average rating.',
      say: `The reviews are ${data.join(', ')} stars. What is the mean?`,
      work: [
        `Add them: ${data.join(' + ')} = ${sum(data)}.`,
        `Share that between ${data.length} reviews: ${sum(data)} ÷ ${data.length} = ${mean}.`,
      ],
      // The other two middles are the real confusions here.
      n: mean, pad: [med, mode, mean + 1],
    }
  }
  if (roll === 1) {
    return {
      kind: 'median', title: 'The middle one', tone: 'b',
      badge: listOf(data), answerLabel: 'middle =',
      prompt: 'What is the median?',
      context: 'Line the reviews up worst to best and the median is simply the one standing in the middle of the queue. It does not care how bad the worst one was — only where it sits in the order.',
      padInstruction: 'Tap the middle rating.',
      say: `The reviews are ${data.join(', ')} stars. What is the median?`,
      work: [
        `In order: ${[...data].sort((a, b) => a - b).join(', ')}.`,
        `Five reviews, so the third one is the middle: ${med}.`,
      ],
      n: med, pad: [mean, mode, med + 1],
    }
  }
  return {
    kind: 'mode', title: 'Most often', tone: 'a',
    badge: listOf(data), answerLabel: 'most common =',
    prompt: 'Which rating came up most?',
    context: 'The mode is just the rating that turned up more than any other. It is the only one of the three middles that has to be a rating somebody actually gave.',
    padInstruction: 'Tap the most common rating.',
    say: `The reviews are ${data.join(', ')} stars. What is the mode?`,
    work: [
      `Count how many times each rating appears in ${data.join(', ')}.`,
      `${mode} turns up more than any other, so the mode is ${mode}.`,
    ],
    n: mode, pad: [mean, med, mode + 1],
  }
}

// ── L2 · how far apart the opinions are ───────────────────────────────────────
function rangeTask(): Task {
  const data = ratings()
  const hi = Math.max(...data), lo = Math.min(...data)
  return {
    kind: 'range', title: 'How split', tone: 'b',
    badge: listOf(data), answerLabel: 'range =',
    prompt: 'How far apart are they?',
    context: 'Two listings can share the same average and still be nothing alike — one where everybody agrees, and one where half loved it and half hated it. The range is the crudest way to tell them apart: the gap between the best review and the worst.',
    padInstruction: 'Tap the gap between best and worst.',
    say: `The reviews are ${data.join(', ')} stars. What is the range?`,
    work: [
      `The best is ${hi} and the worst is ${lo}.`,
      `Range is best minus worst: ${hi} − ${lo} = ${hi - lo}.`,
    ],
    n: hi - lo, pad: [hi, lo, hi - lo + 1],
  }
}

// ── L2 · the one review still to land ─────────────────────────────────────────
/** ⚠️ This replaces TWO conceptual MCQs from the old lesson (which summary resists
 *  an outlier, and what an outlier does to the mean). Both are now shown rather
 *  than asked: one review moves the average a long way, and the child has to work
 *  out how far. The base is drawn so the answer is always a real 1–5 rating. */
function dragTask(): Task {
  const ans = rint(1, 5)
  const base = Array.from({ length: 4 }, () => rint(1, 5))
  const target = round1((sum(base) + ans) / 5)
  return {
    kind: 'drag', title: 'One more coming', tone: 'a',
    badge: `${listOf(base)}  +  ?★`, showEquals: false,
    prompt: `Which rating lands the average on ${target.toFixed(1)}?`,
    context: `Four reviews are in and a fifth is about to land. Whatever it says, it will be shared out across all five — so a single review moves the printed average further than most people expect. Aim for ${target.toFixed(1)}.`,
    instruction: 'Set the incoming review, then lock it in.',
    say: `Four reviews are in. What must the fifth one be for the average to come out at ${target.toFixed(1)}?`,
    work: [
      `Five reviews averaging ${target.toFixed(1)} means they add up to 5 × ${target.toFixed(1)} = ${sum(base) + ans}.`,
      `The four already in add up to ${sum(base)}.`,
      `So the missing one is ${sum(base) + ans} − ${sum(base)} = ${ans} stars.`,
    ],
    n: ans, base, target,
  }
}

// ── L3 · reading beyond the reviews you can see ───────────────────────────────
function chanceTask(): Task {
  const total = pick([10, 20, 25])
  const five = rint(2, total - 2)
  return {
    kind: 'chance', title: 'The next one', tone: 'b',
    badge: `${five} of the last ${total} were 5★`, showEquals: false,
    answerLabel: 'percent =',
    prompt: 'What are the chances?',
    context: 'If the next reviewer is no different from the last few, then the share of five-star reviews already in is your best guess at the chance the next one is five-star too. Turn that share into a percentage out of a hundred.',
    padInstruction: 'Tap the percent chance.',
    say: `${five} of the last ${total} reviews were five stars. What percent chance is that?`,
    work: [
      `${five} out of ${total} is the fraction ${five}/${total}.`,
      `Out of a hundred instead: ${five} ÷ ${total} × 100 = ${(five / total) * 100}%.`,
    ],
    n: (five / total) * 100,
    pad: [total - five, five, Math.round(((total - five) / total) * 100)],
  }
}

/** The plan's "4.6 from 12 versus 4.4 from 2,000", asked as the number that makes
 *  the comparison decidable. The 1/√n rule of thumb is the standard conservative
 *  95% margin, and the counts are chosen so it always lands on a whole percent. */
function moeTask(): Task {
  const n = pick([100, 400, 2500, 10000])
  const moe = Math.round(100 / Math.sqrt(n))
  return {
    kind: 'moe', title: 'How much slack', tone: 'a',
    badge: `${n.toLocaleString('en-GB')} reviews`, answerLabel: 'give or take',
    prompt: 'How many points of slack?',
    context: 'A rating built on a handful of reviews could easily have come out differently; one built on thousands could not have moved much. The rough rule is a hundred divided by the square root of how many reviews there are, and that is how many percentage points either side you should treat as noise.',
    padInstruction: 'Tap the margin, in percentage points.',
    say: `A rating is based on ${n} reviews. Roughly what is the margin of error, in percentage points?`,
    work: [
      `The rule of thumb is 100 ÷ √n.`,
      `√${n} = ${Math.sqrt(n)}, so the margin is 100 ÷ ${Math.sqrt(n)} = ${moe} percentage points.`,
    ],
    n: moe, pad: [moe * 2, Math.round(moe / 2), moe + 1],
  }
}

/** Genuine classification — the chapter's one picker (see the header). */
function biasTask(): Task {
  return {
    kind: 'bias', title: 'Who bothered', tone: 'b',
    badge: 'which set can you trust?', showEquals: false,
    prompt: 'Which set is least biased?',
    context: 'A sample only tells you about the whole crowd if it looks like the whole crowd. The catch with reviews is that nobody is picked — people pick themselves, and the ones who felt strongly enough to type something are not a fair cross-section of everyone who walked in.',
    instruction: 'Choose the fairest set, then lock it in.',
    say: 'Which set of reviews is least biased?',
    work: [
      'Every set here except one is chosen by how the person already felt, or by someone with a stake in the answer.',
      'Only a randomly picked set of everyone who actually bought it can stand in for all of them.',
    ],
    correctId: 'random',
    choices: [
      { id: 'random', label: 'A random pick of everyone who bought it' },
      { id: 'angry', label: 'Everyone who asked for a refund' },
      { id: 'self', label: 'Everyone who chose to leave a review' },
      { id: 'asked', label: 'The customers the seller asked' },
    ],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return centreTask()
  if (d === 2) return Math.random() < 0.5 ? rangeTask() : dragTask()
  const roll = Math.random()
  return roll < 0.4 ? chanceTask() : roll < 0.75 ? moeTask() : biasTask()
}

// ══════════════════════════════════════════════════════════════════════════════
// THE INCOMING REVIEW — the four that are in, plus the one being written. The
// child sets its rating. ⚠️ The running average is deliberately absent until the
// reveal: see the header.
// ══════════════════════════════════════════════════════════════════════════════
function IncomingReview({ task, value, setValue, disabled, reveal, onCommit }: {
  task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const n = value.k === 'num' ? value.n : 1
  const base = task.base ?? []
  const col = reveal ? P.mint : P.gold
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'clamp(7px,0.9vw,13px)',
        minHeight: 82, padding: 'clamp(8px,1vw,14px)', borderRadius: 10,
        background: 'rgba(0,0,0,0.26)', border: `1px solid ${P.glassBorder}`,
      }}>
        {base.map((v, i) => <Bar key={i} v={v} col={col} />)}
        <Bar v={n} live col={col} />
      </div>

      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px,2.6vw,34px)', fontWeight: 800, color: col }}>
        {'★'.repeat(n)}<span style={{ opacity: 0.25 }}>{'★'.repeat(5 - n)}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1vw,14px)' }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => setValue({ k: 'num', n: Math.max(1, n - 1) })} />
        <span style={{ minWidth: 'clamp(30px,3vw,44px)', textAlign: 'center', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(18px,2vw,28px)', color: P.cream }}>{n}</span>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => setValue({ k: 'num', n: Math.min(5, n + 1) })} />
      </div>

      {/* Only once the answer is in: what it actually did to the printed average. */}
      {reveal && (
        <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px,1.1vw,15px)', color: P.creamSoft }}>
          average now {meanOf([...base, n]).toFixed(1)}
        </div>
      )}

      <CommitBtn P={P} label="POST IT ✓" disabled={disabled} onClick={() => onCommit({ k: 'num', n })} />
    </div>
  )
}

// ── walkthrough: the one review that moves the average ────────────────────────
const DEMO_DRAG: Task = {
  kind: 'drag', title: 'One more coming', badge: '5★  5★  4★  5★  +  ?★', tone: 'a',
  prompt: '', say: '', work: [], n: 1, base: [5, 5, 4, 5], target: 4,
}
const DEMO_DRAG_STEPS: DemoStep<V>[] = [
  { say: 'A listing has four reviews in: five, five, four, five. That is nineteen stars between them, and an average of four point seven five.', value: { k: 'num', n: 5 }, board: '5 + 5 + 4 + 5 = 19' },
  { say: 'A fifth review is being written right now. Whatever it says, the printed average is about to be shared out across five instead of four.', value: { k: 'num', n: 5 }, board: 'a fifth is coming' },
  { say: 'Say we want to know which rating would drag that average all the way down to four point zero.', value: { k: 'num', n: 5 }, board: 'target 4.0' },
  { say: 'Work backwards. Five reviews averaging four means the five of them add up to twenty.', value: { k: 'num', n: 5 }, board: '5 × 4.0 = 20' },
  { say: 'Nineteen of those twenty are already there. So the one still to come has to be a single star.', value: { k: 'num', n: 1 }, board: '20 − 19 = 1' },
  { say: 'And look what that one review did. Four happy customers, one furious one, and the number everybody reads has fallen three quarters of a star.', value: { k: 'num', n: 1 }, board: '4.75 → 4.0' },
  { say: 'Line them up in order, though, and the middle review is still a five. That is the difference between a mean and a median: one gets dragged, the other barely notices.', value: { k: 'num', n: 1 }, board: 'median stays 5' },
]

// ══════════════════════════════════════════════════════════════════════════════
export const CONFIG: GameConfig<V, Task> = {
  chapterId: 'statsInference',
  title: 'THE REVIEWS',
  ticketLabel: 'listing',
  palette: P,
  motif: '⭐',
  makeTask,
  answerPad: (t) => (t.kind === 'drag' || t.kind === 'bias' ? [] : numChoices(t.n ?? 0, t.pad ?? [], { min: 0 })),
  // REQUIRED: V is a tagged union (docs/lessons.md — the 15–16 prod bug).
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) => (t.kind === 'bias' ? { k: 'pick', id: '' } : { k: 'num', n: t.kind === 'drag' ? 1 : 0 }),
  grade: (t, v) => (t.kind === 'bias' ? v.k === 'pick' && v.id === t.correctId : v.k === 'num' && v.n === t.n),
  revealText: (t) =>
    t.kind === 'bias' ? (t.choices?.find((c) => c.id === t.correctId)?.label ?? '')
      : t.kind === 'drag' ? `${t.n}★`
        : t.kind === 'chance' || t.kind === 'moe' ? `${t.n}%`
          : String(t.n ?? 0),
  glide: (t, _f, setValue, later) => later(() => setValue(
    t.kind === 'bias' ? { k: 'pick', id: t.correctId ?? '' } : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }): ReactElement =>
    task.kind === 'bias'
      ? <SpecPicker P={palette} choices={task.choices ?? []} value={value.k === 'pick' ? value.id : ''}
        setValue={(id) => setValue({ k: 'pick', id })} correct={task.correctId} disabled={disabled} reveal={reveal}
        onCommit={(id) => onCommit({ k: 'pick', id })} commitLabel="LOCK IN ✓" prompt="which set?" />
      : <IncomingReview task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />,
  TutorialScene: ({ task, value }) =>
    <IncomingReview task={task} value={value} setValue={() => {}} disabled onCommit={() => {}} />,
  start: {
    blurb: <><strong>A star rating is one number standing in for a crowd.</strong> Work out what the crowd actually said, watch what a single furious review does to the number everyone reads — and decide how much a rating built on twelve people is really worth.</>,
    ticket: { title: 'Listing', badge: '5★ 5★ 4★ 5★', tone: 'a' },
    startLabel: 'Open the listing →',
  },
  overview: {
    say: 'Here is the plan. The number at the top of a listing is a mean — everything added up and shared out. Because it uses every review, one extreme one drags it a long way, while the middle review in the queue barely moves at all. And a rating is only as good as the reviews behind it: a few of them could easily have come out differently, thousands of them could not. Worst of all, nobody picks who reviews — people pick themselves. Let us work one out together, nice and slow.',
    problem: <>Which review drags <strong>5★ 5★ 4★ 5★</strong> down to an average of <strong>4.0</strong>?</>,
    points: [
      <>The <strong>mean</strong> uses every review, so an extreme one <strong>drags</strong> it.</>,
      <>The <strong>median</strong> is only a position, so it barely moves.</>,
      <>Fewer reviews → a <strong>wider</strong> margin of error.</>,
      <>People choose to review — that is <strong>bias</strong>, not a sample.</>,
    ],
  },
  tutorial: [{ task: DEMO_DRAG, initial: { k: 'num', n: 5 }, hand: 'tap', steps: DEMO_DRAG_STEPS }],
  sig: (t) => `${t.kind}:${t.badge}:${t.prompt}`,
}

export default function TheReviews(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
