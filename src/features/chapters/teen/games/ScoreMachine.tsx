'use client'
/**
 * ScoreMachine (file kept; theme = EVENT BUDGET PLANNER) — the Order of Operations
 * chapter as a PLAYABLE GAME. Real-world use: totalling an event budget in the
 * right order — work out each item's cost (quantity × price, ÷) FIRST, then add and
 * subtract. The kid evaluates the expression with correct precedence and DRAGS the
 * total on a slider (SlideValue). No slides, no MCQ. Shared adaptive engine underneath.
 *
 * The QUESTION shows on the chalkboard with the PORTION that must be evaluated
 * first highlighted in a different colour + parentheses (via config.question), so
 * a kid can SEE which part goes first — e.g. 3 + (2 × 5) = "each item's cost first".
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * works 2 + 3 × 4 in stages on the slider (item cost first, then the fee), then a
 * GUIDED total (config.guided) with Milo coaching (not scored), then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, SlideValue, pick, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#1c1327', nightBot: '#2a1838',
  cream: '#f7f0ff', creamSoft: 'rgba(247,240,255,0.82)',
  inkOnPaper: '#2a1838', mutedOnPaper: '#8f7aa8',
  gold: '#ffcf5c', goldDeep: '#e0a534',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#5fd6b0',
  glass: 'rgba(28,19,39,0.62)', glassBorder: 'rgba(247,240,255,0.22)',
}

interface Task extends BaseTask { expr: string; answer: number }
const MIN = 0, MAX = 40

// Highlight colour for the "work out this part first" portion on the chalkboard.
const HL = '#ffd45e'
const SUP = /[¹²³⁴⁵⁶⁷⁸⁹⁰]/

/** Wrap the part that must be worked out FIRST in parentheses + a highlight colour,
 *  so the kid can see it (= each item's cost). Brackets → the bracketed group; else
 *  an exponent term; else the first × / ÷ and its two operands. */
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
    prompt: `Add up the budget: ${expr}. Work out × and ÷ first, then + and −. Drag to the total.`,
    say: `Add up the budget. ${expr}. Remember, brackets first, then times and divide, then add and subtract. Drag the slider to the total.`,
    expr, answer,
    work: [`Brackets first, then × and ÷ (each item's cost), then + and −.`, `${expr} = ${answer}.`],
  }
}
function comboL1(): Task { return fromPool(L1) }
function comboL2(): Task { return fromPool(L2) }
function comboL3(): Task { return fromPool(L3) }

function makeTask(d: 1 | 2 | 3): Task {
  return d === 1 ? comboL1() : d === 2 ? comboL2() : comboL3()
}

// ── Animated walkthrough scene — the receipt, in motion ───────────────────────
// A code-drawn budget receipt for the worked example 2 + 3 × 4 = 14. The scene
// ACTS OUT order of operations like a cartoon explainer, driven purely by the
// walkthrough's per-step `value` + step index (no JS animation loops — only CSS
// transitions, Safari-safe):
//   • the expression "2 + 3 × 4" prints on the receipt;
//   • the do-first portion "3 × 4" (the snacks) HIGHLIGHTS in gold with a bracket;
//   • it COLLAPSES to its value 12 — the sub-expression shrinks/fades into "$12";
//   • the "+ 2" fee combines in, and the TOTAL glides up to $14 and glows mint.
// The stage tracks `value` (0 → 12 → 14) so the running total climbs in step with
// the narration, exactly like the slider does in play.
const EB_GLIDE = 'all 760ms cubic-bezier(.45,.05,.25,1)'

function EventBudgetScene({ palette: P, value, stepIndex, frameCount, ended }: {
  palette: Palette; value: number; stepIndex: number; frameCount: number; ended: boolean
}) {
  const resultPhase = ended || stepIndex >= frameCount - 2   // last 2 beats: the answer
  // Phase of the worked example (indices match the `tutorial.steps` timeline above).
  const printed = stepIndex >= 2                 // "2 + 3 × 4" is on the receipt
  const marked = stepIndex >= 3 && value < 12    // the "3 × 4" snacks part is spotlighted
  const collapsed = value >= 12                  // snacks collapsed → $12 line item
  const combining = stepIndex >= 7               // adding the fee: 12 + 2
  const done = value >= 14 || resultPhase        // total revealed

  const totalColor = done ? P.mint : P.gold
  // line-items tick in as the sum is worked out
  const snackShown = collapsed
  const feeShown = combining || done

  // shared cell style for a boxed number on the receipt
  const cell = (bg: string, fg: string): React.CSSProperties => ({
    minWidth: 'clamp(30px,7vw,44px)', padding: '4px 8px', borderRadius: 9,
    background: bg, color: fg, fontFamily: 'var(--font-numeric)',
    fontWeight: 800, fontSize: 'clamp(20px,4vw,30px)', textAlign: 'center',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1, transition: EB_GLIDE,
  })
  const op = (c: string): React.CSSProperties => ({
    color: c, fontFamily: 'var(--font-numeric)', fontWeight: 800,
    fontSize: 'clamp(18px,3.4vw,26px)', transition: EB_GLIDE, padding: '0 1px',
  })

  return (
    <div style={{ position: 'relative', width: 'clamp(238px, 44vw, 356px)', height: 'clamp(300px, 46vh, 440px)', borderRadius: 16, background: `linear-gradient(${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, overflow: 'hidden', boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(10px,2.5vw,18px)' }}>
      <style>{'@keyframes ebPop{0%{opacity:0;transform:translateY(8px) scale(.85)}100%{opacity:1;transform:translateY(0) scale(1)}}@keyframes ebGlow{0%,100%{box-shadow:0 0 0 rgba(0,0,0,0)}50%{box-shadow:0 0 16px var(--eb-glow)}}@keyframes ebBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}'}</style>

      {/* the receipt / budget slip */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 'clamp(210px,40vw,300px)', background: P.cream, borderRadius: 12, boxShadow: '0 8px 22px rgba(0,0,0,0.4)', padding: 'clamp(12px,3vw,18px) clamp(12px,3vw,16px)', display: 'flex', flexDirection: 'column', gap: 'clamp(8px,2vh,12px)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px dashed ${P.mutedOnPaper}`, paddingBottom: 6 }}>
          <span style={{ fontSize: 'clamp(15px,2.6vw,19px)' }}>🧾</span>
          <span style={{ color: P.mutedOnPaper, fontWeight: 800, letterSpacing: 1, fontSize: 'clamp(9px,1.4vw,12px)' }}>EVENT BUDGET</span>
        </div>

        {/* the expression, printed on the slip — with the do-first portion spotlighted */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 'clamp(3px,0.8vw,6px)', minHeight: 'clamp(40px,7vh,54px)', opacity: printed ? 1 : 0.25, transition: EB_GLIDE }}>
          {/* the "$2 fee" term — dims while the snacks are being worked out first */}
          <span style={{ ...cell('transparent', combining || done ? P.mutedOnPaper : P.inkOnPaper), opacity: marked ? 0.4 : 1, textDecoration: combining || done ? 'line-through' : 'none' }}>2</span>
          <span style={op(marked ? '#c9b8dd' : P.inkOnPaper)}>+</span>

          {/* the "3 × 4" snacks portion — highlights in gold, then COLLAPSES into one $12 cell */}
          {!collapsed ? (
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 'clamp(3px,0.8vw,6px)', padding: marked ? '3px 7px' : 0, borderRadius: 11, background: marked ? 'rgba(255,207,92,0.28)' : 'transparent', boxShadow: marked ? `0 0 0 2px ${P.goldDeep}` : 'none', transition: EB_GLIDE }}>
              <span style={cell('transparent', marked ? P.goldDeep : P.inkOnPaper)}>3</span>
              <span style={op(marked ? P.goldDeep : P.inkOnPaper)}>×</span>
              <span style={cell('transparent', marked ? P.goldDeep : P.inkOnPaper)}>4</span>
              {marked && <span style={{ position: 'absolute', top: '-52%', left: 0, right: 0, textAlign: 'center', color: P.goldDeep, fontWeight: 800, fontSize: 'clamp(8px,1.3vw,11px)', whiteSpace: 'nowrap', animation: 'ebBob 1.1s ease-in-out infinite' }}>do first ↓</span>}
            </span>
          ) : (
            <span style={{ ...cell(P.gold, P.inkOnPaper), animation: 'ebPop 420ms ease' }}>12</span>
          )}
        </div>

        {/* line items — tick in as each cost is settled */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: `1px solid ${P.mutedOnPaper}55`, paddingTop: 8, minHeight: 'clamp(46px,8vh,60px)' }}>
          {snackShown && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', animation: 'ebPop 380ms ease', color: P.inkOnPaper }}>
              <span style={{ fontWeight: 700, fontSize: 'clamp(11px,1.7vw,14px)' }}>3 snacks × $4</span>
              <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(13px,2vw,17px)' }}>$12</span>
            </div>
          )}
          {feeShown && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', animation: 'ebPop 380ms ease', color: P.inkOnPaper }}>
              <span style={{ fontWeight: 700, fontSize: 'clamp(11px,1.7vw,14px)' }}>entry fee</span>
              <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(13px,2vw,17px)' }}>$2</span>
            </div>
          )}
        </div>

        {/* the running TOTAL — glides 0 → 12 → 14, glows mint when settled */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px dashed ${P.mutedOnPaper}`, paddingTop: 8 }}>
          <span style={{ color: P.mutedOnPaper, fontWeight: 800, letterSpacing: 1, fontSize: 'clamp(10px,1.6vw,13px)' }}>TOTAL</span>
          <span style={{ ['--eb-glow' as string]: P.mint, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(24px,5vw,38px)', color: totalColor, transition: EB_GLIDE, animation: done ? 'ebGlow 1.4s ease-in-out infinite' : undefined }}>
            ${Math.max(0, Math.min(14, Math.round(value)))}
          </span>
        </div>
      </div>

      {/* the maths rule, whispered under the slip */}
      <div style={{ position: 'absolute', bottom: '3%', left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, color: done ? P.mint : P.gold, fontWeight: 800, fontSize: 'clamp(9px,1.2vw,12px)', whiteSpace: 'nowrap', transition: 'color 500ms' }}>
        {done ? '× first, then + ✓' : marked || collapsed ? '× before +' : 'order of operations'}
      </div>
    </div>
  )
}

// ── the worked example for the walkthrough (2 + 3 × 4 → 14) and the guided total (1 + 2 × 3 → 7) ──
const DEMO_TASK: Task = { title: 'Budget', badge: '2 + 3 × 4', tone: 'a', expr: '2 + 3 × 4', answer: 14, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'Budget', badge: '1 + 2 × 3', tone: 'a', expr: '1 + 2 × 3', answer: 7,
  prompt: 'Work out 1 + 2 × 3 — the times first — then drag to the total and press SET TOTAL.',
  say: 'A one dollar fee, plus two items at three dollars each. Do the times first, then add. Drag the slider to the total and set it.',
  work: ['Item cost first: 2 × 3 is 6.', '1 + 6 is 7.'],
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'orderOfOperations',
  title: 'EVENT BUDGET',
  ticketLabel: 'budget',
  palette: P,
  makeTask,
  initialValue: () => 0,
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  motif: '🧾',
  question: (t) => markPortion(t.expr),
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <SlideValue P={palette} value={value} setValue={setValue} min={MIN} max={MAX} step={1} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="SET TOTAL ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'drag',
    steps: [
      { say: 'This is the budget planner. You drag the slider to set the total cost. Let us plan one together.', value: 0, hand: 'drag' },
      { say: "Here is today's budget: a two dollar entry fee, plus three snacks at four dollars each.", value: 0, board: '$2 fee + 3 snacks at $4' },
      { say: 'Written as a sum, that is two plus three times four.', value: 0, board: '2 + 3 × 4' },
      { say: 'The rule: work out each item’s cost first — that is the times part. Three snacks at four dollars each.', value: 0, board: 'do × first: 3 × 4' },
      { say: 'Why not just add left to right, two plus three? Because times comes before plus. We must total the snacks first.', value: 0, board: '× before +' },
      { say: 'So do the snacks. Three snacks times four dollars — count it up: four, eight, twelve. That is twelve dollars.', value: 12, hand: 'drag', board: '3 × 4 = 12' },
      { say: 'Watch the total climb to twelve dollars — that is all the snacks paid for.', value: 12, hand: 'drag', board: 'snacks = $12' },
      { say: 'Now the only thing left is the plus. Add the two dollar fee: twelve plus two.', value: 12, board: '12 + 2' },
      { say: 'Twelve plus two is fourteen. Slide the total up to fourteen dollars.', value: 14, hand: 'drag', board: '12 + 2 = 14' },
      { say: 'The whole budget totals fourteen dollars — snacks first, then the fee.', value: 14, board: '2 + 3 × 4 = 14' },
      { say: "When the total is right, press Set total. Now let's try one together.", value: 14, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'drag',
  },
  TutorialScene: EventBudgetScene,
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re planning the event budget.</strong> Total up each cost in the right order — brackets first, then × and ÷ (each item&apos;s cost), then + and − — and set the total.</>, ticket: { title: 'Budget', badge: '3 + 2 × 5', tone: 'a' }, startLabel: 'Plan the event →' },
  sig: (t) => t.badge,
}

export default function ScoreMachine(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
