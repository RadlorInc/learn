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
import { Palette, CommitBtn, headerChip, pick, ExprChips, parseExpr, collapseAt, correctNextIndex, type ETok } from './parts/gameKit'

const P: Palette = {
  nightTop: '#1c1327', nightBot: '#2a1838',
  cream: '#f7f0ff', creamSoft: 'rgba(247,240,255,0.82)',
  inkOnPaper: '#2a1838', mutedOnPaper: '#8f7aa8',
  gold: '#ffcf5c', goldDeep: '#e0a534',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#5fd6b0',
  glass: 'rgba(28,19,39,0.62)', glassBorder: 'rgba(247,240,255,0.22)',
}

interface Task extends BaseTask { expr: string; answer: number }

// Highlight colour for the "work out this part first" portion on the chalkboard.
const HL = '#ffd45e'
const SUP = /[¹²³⁴⁵⁶⁷⁸⁹⁰]/

/** Wrap the part that must be worked out FIRST in parentheses + a highlight colour,
 *  so the kid can see it on the reference chalkboard (= each item's cost). Brackets →
 *  the bracketed group; else an exponent term; else the first × / ÷ and its operands. */
function markPortion(expr: string): React.ReactNode {
  const open = expr.indexOf('(')
  if (open !== -1) {
    const close = expr.indexOf(')', open)
    if (close !== -1) return (<>{expr.slice(0, open)}<span style={{ color: HL }}>{expr.slice(open, close + 1)}</span>{expr.slice(close + 1)}</>)
  }
  const sup = expr.search(SUP)
  if (sup > 0) {
    let end = sup
    while (end < expr.length && SUP.test(expr[end])) end++
    return (<>{expr.slice(0, sup - 1)}<span style={{ color: HL }}>{expr.slice(sup - 1, end)}</span>{expr.slice(end)}</>)
  }
  const tokens = expr.split(' ')
  const opIdx = tokens.findIndex((t) => t === '×' || t === '÷')
  if (opIdx > 0 && opIdx < tokens.length - 1) {
    const before = tokens.slice(0, opIdx - 1).join(' ')
    const after = tokens.slice(opIdx + 2).join(' ')
    return (<>{before ? before + ' ' : ''}<span style={{ color: HL }}>{`(${tokens[opIdx - 1]} ${tokens[opIdx]} ${tokens[opIdx + 1]})`}</span>{after ? ' ' + after : ''}</>)
  }
  return expr
}

const L1: [string, number][] = [['3 + 2 × 5', 13], ['10 − 2 × 3', 4], ['4 × 2 + 1', 9], ['12 ÷ 2 + 3', 9]]
const L2: [string, number][] = [['(3 + 2) × 5', 25], ['2 × (4 + 1)', 10], ['20 − 3 × 4', 8], ['6 + 8 ÷ 2', 10]]
const L3: [string, number][] = [['3 + 4 × 2 − 1', 10], ['(6 − 2) × 3', 12], ['2³ − 4', 4], ['5 × 2 − 3 × 2', 4]]

function fromPool(pool: [string, number][]): Task {
  const [expr, answer] = pick(pool)
  return {
    title: 'Budget', badge: expr, tone: 'a',
    instruction: 'Tap × and ÷ first, then + and −.',
    prompt: `Total the budget: ${expr}. Tap an operation to work it out — × and ÷ before + and −.`,
    say: `Total the budget. ${expr}. Tap the times and divide first, then the plus and minus. Work out one step at a time.`,
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
  context: 'A $1 entry fee, plus 2 items at $3 each.', instruction: 'Tap × first, then +.',
  prompt: 'Total 1 + 2 × 3 — tap the times first, then the plus.',
  say: 'A one dollar fee, plus two items at three dollars each. Tap the times first, then the plus.',
  work: ['Item cost first: 2 × 3 is 6.', '1 + 6 is 7.'],
}

const CONFIG: GameConfig<ETok[], Task> = {
  chapterId: 'orderOfOperations',
  title: 'EVENT BUDGET',
  ticketLabel: 'budget',
  palette: P,
  makeTask,
  initialValue: (t) => parseExpr(t.expr),
  grade: (t, v) => v.length === 1 && v[0].k === 'num' && Math.abs(v[0].v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  motif: '🧾',
  question: (t) => markPortion(t.expr),
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
