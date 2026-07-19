'use client'
/**
 * ScoreMachine (file kept; theme = EVENT BUDGET) — the Order of Operations chapter as
 * a PLAYABLE GAME where the child SOLVES ON the illustration: the budget expression is
 * a row of tappable chips, and the child TAPS an operation to work it out. The
 * illustration does the arithmetic and COLLAPSES that piece — 3 × 4 becomes 12 —
 * until one number is left. That number IS the total. Nothing is worked out in the
 * head and dialed: the answer emerges from doing the steps in the right order.
 *
 * Precedence is TAUGHT by the mechanic, not a rule to recall: an op inside brackets
 * (or a × next to a number that isn't ready) can't fire until its neighbours are
 * plain numbers, so brackets collapse first; and if the child taps + before ×, the
 * board faithfully computes the wrong total — the mistake is visible, then reteaches.
 *
 * No slides, no MCQ. Shared adaptive engine underneath. The expression engine
 * (parseExpr / collapseAt / correctNextIndex / ExprChips) lives in gameKit.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, CommitBtn, headerChip, pick, numChoices, ExprChips, parseExpr, collapseAt, correctNextIndex, evaluable, type ETok } from './parts/gameKit'

const P: Palette = {
  nightTop: '#1c1327', nightBot: '#2a1838',
  cream: '#f7f0ff', creamSoft: 'rgba(247,240,255,0.82)',
  inkOnPaper: '#2a1838', mutedOnPaper: '#8f7aa8',
  gold: '#ffcf5c', goldDeep: '#e0a534',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#5fd6b0',
  glass: 'rgba(28,19,39,0.62)', glassBorder: 'rgba(247,240,255,0.22)',
}

interface Task extends BaseTask { expr: string; answer: number }

// NOTE: the board deliberately shows the BARE expression. It used to render
// "3 + 2 × 5" as "3 + (2 × 5)" — inserting brackets that were never in the
// expression. Deciding what to do first IS the skill this chapter teaches, so
// marking it hands over the answer and makes the left-to-right distractor (25)
// unreachable. `config.question` only receives the task, not the reveal state,
// so there is no way to show the mark on reveal only — hence no mark at all.

// ── the two order-of-operations misconceptions, computed from the expression itself
//    so the WRONG-ORDER value is always on the answer pad. ──
/** Collapse repeatedly at the LEFTMOST workable spot = strict left-to-right, ignoring
 *  that × and ÷ come first: "2 + 3 × 4" → 5 × 4 → 20 (the classic wrong total). */
function ltrValue(expr: string): number | null {
  let toks = parseExpr(expr)
  for (let guard = 0; toks.length > 1 && guard < 20; guard++) {
    const idx = [...evaluable(toks)]
    if (!idx.length) return null
    toks = collapseAt(toks, Math.min(...idx))
  }
  const t = toks[0]
  return t?.k === 'num' ? t.v : null
}
/** Same expression with the brackets thrown away, then done correctly:
 *  "(3 + 2) × 5" → "3 + 2 × 5" → 13. */
function noBracketValue(expr: string): number | null {
  if (!expr.includes('(')) return null
  let toks = parseExpr(expr.replace(/[()]/g, ''))
  for (let guard = 0; toks.length > 1 && guard < 20; guard++) {
    const i = correctNextIndex(toks)
    if (i < 0) return null
    toks = collapseAt(toks, i)
  }
  const t = toks[0]
  return t?.k === 'num' ? t.v : null
}
function padFor(t: Task): number[] {
  const near = [ltrValue(t.expr), noBracketValue(t.expr)].filter((n): n is number => n !== null)
  return numChoices(t.answer, near, { min: 0, count: 4 })
}

const L1: [string, number][] =[['3 + 2 × 5', 13], ['10 − 2 × 3', 4], ['4 × 2 + 1', 9], ['12 ÷ 2 + 3', 9]]
const L2: [string, number][] = [['(3 + 2) × 5', 25], ['2 × (4 + 1)', 10], ['20 − 3 × 4', 8], ['6 + 8 ÷ 2', 10]]
// `2³ − 4` was dropped from this tier: nothing in this chapter ever teaches exponents,
// AND its precedence trap is empty — the power evaluates first in ANY order, so the
// wrong-order value equals the answer and the pad degrades to ±1 noise. Replaced with
// a two-precedence expression whose left-to-right value (15) is a real misconception.
const L3: [string, number][] = [['3 + 4 × 2 − 1', 10], ['(6 − 2) × 3', 12], ['12 ÷ 4 + 2 × 3', 9], ['5 × 2 − 3 × 2', 4]]

function fromPool(pool: [string, number][]): Task {
  const [expr, answer] = pick(pool)
  return {
    title: 'Budget', badge: expr, tone: 'a',
    context: 'One line of the event budget — a fee plus items that each cost the same.',
    padInstruction: 'Work out × and ÷ first, then tap your total.',
    prompt: `Total the budget: ${expr}. Tap an operation to work it out — × and ÷ before + and −.`,
    say: `Total the budget. ${expr}. Work out the times and divide first, then the plus and minus. Then tap your total.`,
    expr, answer,
    work: [`Brackets first, then × and ÷ (each item's cost), then + and −.`, `${expr} = ${answer}.`],
  }
}
function makeTask(d: 1 | 2 | 3): Task {
  return d === 1 ? fromPool(L1) : d === 2 ? fromPool(L2) : fromPool(L3)
}

// ── the interactive: tap an operation → the illustration works it out & collapses.
//    When one number is left, LOCK IN it in. A quiet "start over" re-lays the slip so
//    a child can re-plan the order before committing. ──
function BudgetSlip({ P, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: ETok[]; setValue: (v: ETok[]) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: ETok[]) => void
}) {
  const solved = value.length === 1 && value[0].k === 'num'
  const original = parseExpr(task.expr)
  const worked = value.length < original.length          // at least one step done
  const tap = (i: number) => { if (!disabled) setValue(collapseAt(value, i)) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(12px,1.6vw,20px)', width: '100%' }}>
      {/* the budget slip — the tappable working */}
      <div style={{ width: 'clamp(268px, 48vw, 440px)', minHeight: 'clamp(120px,20vh,180px)', boxSizing: 'border-box', borderRadius: 16, background: `linear-gradient(160deg, ${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px,1.4vh,14px)', padding: 'clamp(16px,2.4vw,26px)' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: P.creamSoft }}>{solved ? 'total' : 'work it out'}</div>
        <ExprChips P={P} toks={value} onTap={disabled ? undefined : tap} reveal={reveal} size="lg" />
        {!solved && <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(11px,1.2vw,15px)', color: P.creamSoft }}>tap an operation to work it out</div>}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {worked && !solved && !disabled && (
          <button type="button" onClick={() => setValue(parseExpr(task.expr))} style={{ ...headerChip(P), opacity: 0.82 }}>↺ start over</button>
        )}
        <CommitBtn P={P} label="LOCK IN ✓" disabled={disabled || !solved} onClick={() => onCommit(value)} />
      </div>
    </div>
  )
}

// ── the walkthrough scene — the SAME slip, collapsing step by step, the next step
//    to do spotlighted in gold. Teach = play. ──
function BudgetScene({ palette: P, value }: { palette: Palette; task: Task; value: ETok[]; stepIndex: number; frameCount: number; ended: boolean }) {
  const solved = value.length === 1 && value[0].k === 'num'
  return (
    <div style={{ width: 'clamp(240px, 46vw, 400px)', height: 'clamp(300px, 46vh, 440px)', boxSizing: 'border-box', borderRadius: 16, background: `linear-gradient(160deg, ${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(12px,2vh,20px)', padding: 'clamp(16px,2.4vw,26px)' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: P.gold }}>🧾 event budget</div>
      <ExprChips P={P} toks={value} highlight={solved ? undefined : correctNextIndex(value)} reveal={solved} size="lg" />
      <div style={{ minHeight: '1.4em', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'clamp(11px,1.3vw,15px)', color: solved ? P.mint : P.creamSoft, textAlign: 'center' }}>
        {solved ? 'that is the total ✓' : '× and ÷ before + and −'}
      </div>
    </div>
  )
}

// ── the worked example (2 + 3 × 4 → 14) as collapsing token states ──
const D0 = parseExpr('2 + 3 × 4')                 // 2 + 3 × 4
const D1 = collapseAt(D0, correctNextIndex(D0))   // 2 + 12
const D2 = collapseAt(D1, correctNextIndex(D1))   // 14
const DEMO_TASK: Task = { title: 'Budget', badge: '2 + 3 × 4', tone: 'a', context: 'A $2 entry fee, plus 3 snacks at $4 each.', instruction: 'Tap × first, then +.', expr: '2 + 3 × 4', answer: 14, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'Budget', badge: '1 + 2 × 3', tone: 'a', expr: '1 + 2 × 3', answer: 7,
  context: 'A $1 entry fee, plus 2 items at $3 each.',
  padInstruction: 'Work out × first, then tap your total.',
  prompt: 'Total 1 + 2 × 3 — tap the times first, then the plus.',
  say: 'A one dollar fee, plus two items at three dollars each. Work out the times first, then tap your total.',
  work: ['Item cost first: 2 × 3 is 6.', '1 + 6 is 7.'],
}

const CONFIG: GameConfig<ETok[], Task> = {
  chapterId: 'orderOfOperations',
  title: 'EVENT BUDGET',
  ticketLabel: 'budget',
  palette: P,
  makeTask,
  initialValue: (t) => parseExpr(t.expr),
  answerPad: padFor,
  // The pad hands GameShell a raw number; the chips hand it ETok[]. Grade both.
  grade: (t, v) => typeof (v as unknown) === 'number'
    ? (v as unknown as number) === t.answer
    : v.length === 1 && v[0].k === 'num' && Math.abs(v[0].v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  motif: '🧾',
  // On a wrong answer: re-lay the slip and collapse it in the CORRECT order, step by
  // step, so the child sees the right sequence land on the answer.
  glide: (t, _from, setValue, later) => {
    const run = (toks: ETok[], delay: number) => later(() => {
      setValue(toks)
      if (toks.length > 1) { const idx = correctNextIndex(toks); if (idx >= 0) run(collapseAt(toks, idx), 850) }
    }, delay)
    run(parseExpr(t.expr), 450)
  },
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => (
    <BudgetSlip P={palette} task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: D0,
    hand: 'tap',
    steps: [
      { say: 'This is the budget slip. Every part is a cost. You tap an operation to work it out — but the rule is: do times and divide before plus and minus.', value: D0, hand: 'tap', board: 'total: 2 + 3 × 4' },
      { say: 'Here the snacks are three times four. Times comes first, so we work that out before the plus.', value: D0, hand: 'tap', board: 'do × first' },
      { say: 'Tap the times. Three times four is twelve — watch it fold into a single twelve.', value: D1, hand: 'tap', board: '3 × 4 = 12' },
      { say: 'Now only the plus is left. Two plus twelve.', value: D1, hand: 'tap', board: '2 + 12' },
      { say: 'Tap it — two plus twelve is fourteen. One number is left, so that is the total.', value: D2, hand: 'tap', board: '2 + 3 × 4 = 14' },
      { say: "When one number is left, lock it in. Now let's try one together.", value: D2, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'tap',
  },
  TutorialScene: BudgetScene,
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re totalling the event budget.</strong> Tap each cost to work it out — times and divide first (each item&apos;s cost), then plus and minus — until one number is left.</>, ticket: { title: 'Budget', badge: '3 + 2 × 5', tone: 'a' }, startLabel: 'Plan the event →' },
  overview: {
    say: "Here is what we are figuring out: an event budget has to be totalled in the right order. We have a two dollar entry fee plus three snacks at four dollars each — written as two plus three times four. We tap the snacks first, because times comes before plus, then add the fee — one step at a time until a single total is left.",
    problem: <>Total the budget <strong>2 + 3 × 4</strong> — a <strong>$2 fee</strong> plus <strong>3 snacks at $4 each</strong>.</>,
    points: [
      <>Tap the <strong>× first</strong> — each item&apos;s cost: <strong>3 × 4 = 12</strong> of snacks.</>,
      <>Then tap the <strong>+</strong>: <strong>2 + 12</strong> — the plus comes <strong>after</strong> the times.</>,
      <>One number is left — <strong>14</strong> — and that is the whole budget.</>,
    ],
  },
  sig: (t) => t.badge,
}

export default function ScoreMachine(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
