'use client'
/**
 * SavingGoal — the Linear Equations & Inequalities chapter (15–16) as a PLAYABLE
 * GAME. World: a money jar. You put money in each week (or take it out), and the
 * question is always WHEN — which week does the jar reach the line?
 *
 * ⚠️ ONE WORLD, ONE PICTURE. This chapter used to run TWO instruments — a balance
 * beam for equations and a savings dial for inequalities — which is a hybrid, and a
 * hybrid is the smell docs/lessons.md names: the world was chosen for the easy case.
 * Both were also compute-then-dial: the beam deliberately stays level while you set
 * x (so you cannot wiggle to the answer), which means the child solves in their head
 * and the instrument only records a number they already had. The beam and the dial
 * are both gone. The JAR is the whole chapter.
 *
 * TWO ways to answer, gated PER QUESTION (never per chapter):
 *   • TAP  → AnswerPad, for EQUATIONS, whose answer is a single number of weeks.
 *            The distractors are this skill's real method errors — dividing before
 *            undoing the constant, undoing the constant and forgetting to divide,
 *            and adding the constant instead of subtracting it — so a wrong tap
 *            names a wrong METHOD, not a slip.
 *   • RAY  → the WEEK RAY, for INEQUALITIES, whose answer is a SET of weeks, not a
 *            number: set the boundary week, then shade which side works. The
 *            direction is graded, which is where the sign flip finally lives.
 *
 * ⚠️ THE SIGN FLIP, MADE REAL. The old L3 "spending limit" was `goal − cx ≥ 0`,
 * asked as "how long until you hit zero" — which is goal ÷ c from story sense
 * alone, so the flip the task existed to teach was never exercised. Two changes:
 * (1) there is now a RESERVE you must not spend into (bus fare), so the boundary is
 * (start − reserve) ÷ rate and a plain start ÷ rate is WRONG; (2) the direction is
 * a graded step on the ray, so a child who divides by a negative and keeps the sign
 * pointing the same way is caught. The flip is also worked, one step at a time, in
 * the second walkthrough example.
 *
 * The 12–14 shape: overview read-along + the jar scene → a TWO-example baby-step
 * walkthrough (the equation jar, then the spending jar and the ray) → scored play.
 * No guided round: both graded gestures are already worked in the walkthrough.
 * Scene is code-drawn (pure CSS/SVG); no image assets.
 */
import { useEffect, useState, type ReactElement } from 'react'
import { motion, useMotionValue, useTransform, useMotionValueEvent, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, CommitBtn, Nudge, numChoices } from './parts/gameKit'
import { rint } from '@/core/rand'

const P: Palette = {
  nightTop: '#132a3b', nightBot: '#0a1622',
  cream: '#eaf4fb', creamSoft: 'rgba(234,244,251,0.82)',
  inkOnPaper: '#12283a', mutedOnPaper: '#5f7d94',
  gold: '#ffd25c', goldDeep: '#d99f1e',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(18,40,58,0.6)', glassBorder: 'rgba(234,244,251,0.2)',
}

const pick = <T,>(a: T[]): T => a[rint(0, a.length - 1)]
const fmtInt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
/** Coefficient prefix on x: "2x", "−x", "x". */
const coef = (n: number) => (n === 1 ? 'x' : n === -1 ? '−x' : `${fmtInt(n)}x`)
/** A signed term joined into an expression: " + 3" / " − 3" (leading space). */
const term = (n: number) => (n < 0 ? ` − ${Math.abs(n)}` : ` + ${n}`)
/** "ax + b" as a whole expression. */
const lin = (a: number, b: number) => (b === 0 ? coef(a) : `${coef(a)}${term(b)}`)

/** Which side of the boundary works. −1 → x ≤ n · +1 → x ≥ n · 0 → not chosen yet. */
type Dir = 0 | 1 | -1

// An equation's answer is a NUMBER of weeks (tapped on the pad). An inequality's
// answer is a SET of weeks — a boundary plus a direction — so it keeps a surface.
type V = number | { k: 'ray'; n: number; dir: Dir }

interface Task extends BaseTask {
  kind: 'equation' | 'inequality'
  // equation:  a·x + b = c  →  x is the answer, tapped
  a?: number; b?: number; c?: number; x?: number
  /** Set → this question is answered by TAPPING. Carries the misconception values
   *  that become the distractors, so a wrong tap is a wrong METHOD. */
  pad?: number[]
  // inequality: the jar story + the graded (boundary, direction) pair
  mode?: 'save' | 'spend'
  rate?: number          // dollars per week, always positive
  base?: number          // save: money already have · spend: money you start with
  limit?: number         // save: the goal · spend: the reserve you must not spend
  top?: number           // the top of the jar's dollar scale
  n?: number             // the boundary week (graded)
  dir?: 1 | -1           // the direction (graded) — where the sign flip lives
  hi?: number            // how many weeks the ray shows
}

// ── EQUATIONS — answered by tapping ────────────────────────────────────────────
// a·x + b = c, where b is a WHOLE number of weeks' saving already banked (or owed).
// That is not cosmetic: it is what makes every misconception land on a whole number
// of weeks, so a wrong tap is a wrong method rather than an obviously silly decimal
// the child can eliminate without doing any algebra.
//   L1  a small head start you already have.
//   L2  a bigger head start, bigger numbers of weeks.
//   L3  a DEBT — b is negative, so the first weeks clear what you owe before you
//       save anything. New structure, not bigger numbers.
function equationTask(d: 1 | 2 | 3): Task {
  const a = d === 1 ? rint(2, 5) : rint(2, 6)
  const x = d === 1 ? rint(2, 6) : d === 2 ? rint(2, 9) : rint(4, 9)
  const ks = d === 1 ? [1, 2] : d === 2 ? [1, 2, 3, 4] : [-2, -1]
  // x + k ≥ 2 keeps the goal a positive amount worth at least two weeks of saving.
  const k = pick(ks.filter((v) => x + v >= 2))
  const b = a * k
  const c = a * (x + k)
  const expr = lin(a, b)
  const owe = b < 0
  return {
    kind: 'equation',
    title: 'Weeks to goal', badge: `${expr} = ${fmtInt(c)}`, tone: d === 3 ? 'b' : 'a',
    context: owe
      ? `You save $${a} a week, but you owe $${Math.abs(b)} first. The goal costs $${c}.`
      : `You save $${a} a week and already have $${b}. The goal costs $${c}.`,
    padInstruction: 'Tap the number of weeks.',
    showEquals: false,
    prompt: `How many weeks until you have $${c}?`,
    say: owe
      ? `You save ${a} dollars a week, but you owe ${Math.abs(b)} dollars first. The goal costs ${c} dollars. How many weeks until you can buy it?`
      : `You save ${a} dollars a week, and you already have ${b} dollars. The goal costs ${c} dollars. How many weeks until you can buy it?`,
    work: [
      `After x weeks you have ${expr} dollars, and the goal is ${fmtInt(c)}.`,
      `Undo the ${owe ? 'debt' : 'head start'} FIRST — ${owe ? 'add' : 'subtract'} ${Math.abs(b)} on both sides: ${coef(a)} = ${fmtInt(c - b)}.`,
      `Now divide both sides by ${a}: x = ${x}. That is ${x} weeks.`,
    ],
    a, b, c, x,
    //  c/a      → divided before undoing the head start
    //  c−b      → undid the head start, then forgot to divide
    // (c+b)/a   → added the head start instead of subtracting it
    pad: [c / a, c - b, (c + b) / a],
  }
}

// ── INEQUALITIES — answered on the week ray ────────────────────────────────────
// The answer is a set of weeks: a boundary AND a direction, both graded.

/** "At least enough" — save toward a goal. No flip: x ≥ boundary. This is the
 *  CONTRAST case; without it the flip below means nothing. */
function reachTask(d: 2 | 3): Task {
  const rate = rint(3, 8)
  const n = rint(3, 9)
  const base = d === 2 ? rint(0, 6) : rint(1, 2 * rate)
  const goal = rate * n + base
  const expr = base === 0 ? coef(rate) : `${coef(rate)}${term(base)}`
  return {
    kind: 'inequality', mode: 'save',
    title: 'Weeks to afford', badge: `${expr} ≥ ${fmtInt(goal)}`, tone: d === 3 ? 'b' : 'a',
    context: base === 0
      ? `You save $${rate} a week from nothing. The goal is $${goal}.`
      : `You already have $${base} and save $${rate} more each week. The goal is $${goal}.`,
    instruction: 'Set the boundary week, then shade the weeks that reach the goal.',
    showEquals: false,
    prompt: `Which weeks get you to $${goal}?`,
    say: `You save ${rate} dollars a week${base ? `, on top of ${base} you already have` : ''}, and the goal is ${goal} dollars. Find the boundary week, then shade the weeks that work.`,
    work: [
      `After x weeks you have ${expr} dollars, and you need at least ${fmtInt(goal)}.`,
      base === 0
        ? `Divide both sides by ${rate}: x is at least ${n}.`
        : `Take the ${base} you already have off both sides: ${coef(rate)} is at least ${fmtInt(goal - base)}. Divide by ${rate}: x is at least ${n}.`,
      `Dividing by a POSITIVE keeps the direction, so week ${n} and every week after it works.`,
    ],
    rate, base, limit: goal, top: goal, n, dir: 1, hi: n + 5,
  }
}

/** L3 — the SIGN FLIP, with the story-sense shortcut closed.
 *
 *  You start with `base`, spend `rate` a week, and must keep `limit` back for the
 *  bus. base − rate·x ≥ limit. The old version had limit = 0, so "how long until
 *  the money runs out" answered it by plain division and the flip was never used.
 *  With a reserve, base ÷ rate is WRONG — you have to take the reserve off first —
 *  and then dividing by −rate turns "at least" into "at most", which is the graded
 *  direction on the ray.
 */
function limitTask(): Task {
  const rate = rint(2, 6)
  const n = rint(3, 8)
  const limit = rate * rint(1, 3)      // a whole number of weeks held back
  const base = rate * n + limit
  return {
    kind: 'inequality', mode: 'spend',
    title: 'Spending limit', badge: `${fmtInt(base)} − ${coef(rate)} ≥ ${fmtInt(limit)}`, tone: 'b',
    context: `You have $${base} and spend $${rate} a week — but $${limit} must stay in the jar for the bus.`,
    instruction: 'Set the boundary week, then shade the weeks that keep the bus money safe.',
    showEquals: false,
    prompt: `Which weeks leave at least $${limit} in the jar?`,
    say: `You have ${base} dollars and spend ${rate} dollars a week, but ${limit} dollars must stay in the jar for the bus. Find the boundary week, then shade the weeks that work.`,
    work: [
      `The bus money is not yours to spend, so take it off first: ${fmtInt(base)} minus ${fmtInt(limit)} leaves ${fmtInt(base - limit)} to spend.`,
      `In symbols: ${fmtInt(base)} − ${coef(rate)} is at least ${fmtInt(limit)}, so −${coef(rate)} is at least ${fmtInt(limit - base)}.`,
      `Dividing by NEGATIVE ${rate} flips the direction — "at least" becomes "at most": x is at most ${n}. Week ${n} leaves exactly ${fmtInt(limit)}, and every week after that dips below it.`,
    ],
    rate, base, limit, top: base, n, dir: -1, hi: n + 5,
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return equationTask(1)
  if (d === 2) return Math.random() < 0.6 ? equationTask(2) : reachTask(2)
  const r = Math.random()
  return r < 0.4 ? equationTask(3) : r < 0.7 ? limitTask() : reachTask(3)
}

// ── scene geometry (shared) ─────────────────────────────────────────────────
// The money jar's INSIDE is the dollar number line: J_BOT = $0, J_TOP = the top of
// the scale.
const S_W = 340, S_H = 300
const JX = 112, JW = 100, J_RIM = 46, J_TOP = 56, J_BOT = 250
const JCX = JX + JW / 2

/** A hand-authored vector skateboard 🛹 — the prize resting above the goal line. */
function Skateboard({ x, y, mint }: { x: number; y: number; mint: boolean }) {
  const deck = mint ? '#5cd6ac' : '#ff8a70'
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-26} y={-4} width={52} height={9} rx={4.5} fill={deck} stroke="#2a1a2e" strokeWidth={1} />
      <rect x={-24} y={-3} width={48} height={3} rx={1.5} fill="#ffffff" opacity={0.18} />
      <circle cx={-15} cy={9} r={3.4} fill="#ffd25c" stroke="#2a1a2e" strokeWidth={1} />
      <circle cx={15} cy={9} r={3.4} fill="#ffd25c" stroke="#2a1a2e" strokeWidth={1} />
      <line x1={-15} y1={5} x2={-15} y2={9} stroke="#2a1a2e" strokeWidth={1.4} />
      <line x1={15} y1={5} x2={15} y2={9} stroke="#2a1a2e" strokeWidth={1.4} />
    </g>
  )
}

// ── the walkthrough jar (5x + 3 = 28 → x = 5 weeks) ─────────────────────────────
// Save $5/week, already have $3, goal is $28 → 5x + 3 = 28 → x = 5 weeks.
const DEMO_A = 5, DEMO_B = 3, DEMO_C = 28, DEMO_X = 5
const DEMO_TASK: Task = {
  kind: 'equation', title: 'Weeks to goal', badge: '5x + 3 = 28', tone: 'a',
  prompt: '', say: '',
  work: ['5x + 3 = 28. Subtract 3: 5x = 25. Divide by 5: x = 5. So 5 weeks.'],
  a: DEMO_A, b: DEMO_B, c: DEMO_C, x: DEMO_X,
}
// Eleven BABY steps: ONE idea + ONE board line + ONE beat each; the physical
// save-up is the hook, then the algebra unfolds one inverse operation per step.
// (storyboard: docs/storyboards/saving-goal.md)
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "You've got your eye on a $28 skateboard. Let's work out when you can buy it.", value: 0, board: 'goal = $28' },
  { say: 'Good news — you already have three dollars saved. That is your head start, sitting at the bottom of the jar.', value: 0, board: 'have $3' },
  { say: 'And every week you drop in five dollars more. So your savings grow five dollars at a time.', value: 0, board: '+ $5 each week' },
  { say: 'After x weeks, the weekly saving adds up to five x, and you still have that three dollars on top.', value: 0, board: '5x + 3' },
  { say: 'You can afford it when your savings reach twenty-eight dollars. So five x plus three equals twenty-eight — that is the equation.', value: 0, board: '5x + 3 = 28' },
  { say: 'To find x, get it on its own. First undo the plus three — take the three-dollar head start off both sides.', value: 0, board: '−3 both sides' },
  { say: 'Twenty-eight minus three is twenty-five. So five x equals twenty-five — that part comes purely from weekly saving.', value: 0, board: '5x = 25' },
  { say: 'Now undo the times five. Split that twenty-five into equal five-dollar weeks.', value: 0, board: 'x = 25 ÷ 5' },
  { say: 'Watch the jar fill one week at a time — five, ten, fifteen, twenty, twenty-five.', value: 5, board: '5, 10, 15, 20, 25' },
  { say: 'That took five weeks. So x equals five.', value: 5, board: 'x = 5' },
  { say: 'Add back your three-dollar head start and the jar hits twenty-eight — skateboard unlocked. Five weeks!', value: 5, board: '= 5 weeks ✓' },
]

/** DemoJar — a hand-authored SVG money jar that ACTS OUT the walkthrough beat by
 *  beat with Framer Motion. The jar interior is the exact dollar scale ($0 at the
 *  floor, the $28 goal at the top); a gold savings column rides a continuous
 *  `useMotionValue` so it FLOWS between beats, a week-marker rides its surface, and
 *  the skateboard hops when the jar hits the goal. `useReducedMotion` collapses to
 *  the end state. */
function DemoJar({ palette, value, stepIndex, frameCount, ended }: {
  palette: Palette; value: V; stepIndex: number; frameCount: number; ended: boolean
}) {
  const p = palette
  const reduce = useReducedMotion()
  const G = 28, HEAD = 3            // goal $28, head start $3
  const dY = (d: number) => J_BOT - (d / G) * (J_BOT - J_TOP)   // dollars → pixel y

  const si = stepIndex
  const solved = ended || (frameCount > 1 && si >= frameCount - 1)
  const showHead = si >= 1
  const showCoin = si >= 2 && si < 8 && !solved
  const showBrace = si >= 5
  const showTicks = si >= 7

  // ── CONTINUOUS savings climb: motion value in DOLLARS-from-weekly-saving (0→25). ──
  const savedWeekly = useMotionValue(0)
  const targetWeekly = typeof value === 'number' ? Math.min(25, value * 5) : 0
  useEffect(() => {
    const c = animate(savedWeekly, targetWeekly, { duration: reduce ? 0 : 1.6, ease: [0.45, 0.05, 0.25, 1] })
    return () => c.stop()
  }, [targetWeekly, reduce, savedWeekly])
  const fillScale = useTransform(savedWeekly, (d) => d / 25)          // gold column scaleY (fills $3→$28)
  const markerY = useTransform(savedWeekly, (d) => dY(HEAD + d))      // week-marker rides the surface
  const [liveWeekly, setLiveWeekly] = useState(0)
  useMotionValueEvent(savedWeekly, 'change', (v) => setLiveWeekly(Math.round(v)))

  const savedTotal = (showHead ? HEAD : 0) + liveWeekly
  const weeks = Math.round(liveWeekly / 5)
  const gold = p.gold, goldDeep = p.goldDeep, mint = '#3fc78f'
  const spring = { type: 'spring' as const, stiffness: 320, damping: 18 }
  const goldTop = J_TOP, goldBase = dY(HEAD)                          // gold column spans $3 → $28

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)', width: 'clamp(232px, 40vw, 340px)' }}>
      {/* header: theme + goal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px, 1vw, 14px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: p.mutedOnPaper }}>
        <span>🎯 saving up</span><span style={{ color: p.coral, fontWeight: 800 }}>goal $28</span>
      </div>

      <svg viewBox={`0 0 ${S_W} ${S_H}`}  style={{ width: 'clamp(230px, 32vw, 360px)', height: 'auto', borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
        <defs>
          <linearGradient id="sg_sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#173245" /><stop offset="0.6" stopColor="#0f2434" /><stop offset="1" stopColor="#0a1622" />
          </linearGradient>
          <linearGradient id="sg_gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={gold} /><stop offset="1" stopColor={goldDeep} />
          </linearGradient>
          <linearGradient id="sg_goldWin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5cd6ac" /><stop offset="1" stopColor="#2fb37f" />
          </linearGradient>
          <clipPath id="sg_jar"><rect x={JX} y={J_RIM} width={JW} height={J_BOT - J_RIM} rx={12} /></clipPath>
        </defs>

        {/* backdrop + shelf the jar & prize sit on */}
        <rect x={0} y={0} width={S_W} height={S_H} fill="url(#sg_sky)" />
        <rect x={0} y={J_BOT} width={S_W} height={S_H - J_BOT} fill="#0a1622" opacity={0.5} />
        <line x1={0} y1={J_BOT} x2={S_W} y2={J_BOT} stroke={p.creamSoft} strokeWidth={1} opacity={0.35} />
        <ellipse cx={JCX} cy={J_BOT} rx={JW * 0.62} ry={7} fill="#000" opacity={0.28} />

        {/* the prize on its shelf above the goal — hops when reached */}
        <line x1={JCX - 40} y1={30} x2={JCX + 40} y2={30} stroke={p.glassBorder} strokeWidth={2} opacity={0.6} />
        <motion.g initial={false} animate={solved && !reduce ? { y: [0, -7, 0, -3, 0] } : { y: 0 }} transition={{ duration: 0.7 }}
          style={{ filter: solved ? 'drop-shadow(0 0 6px #5cd6ac)' : undefined }}>
          <Skateboard x={JCX} y={20} mint={solved} />
        </motion.g>
        {solved && !reduce && [-30, 0, 34].map((dx, i) => (
          <motion.circle key={i} cx={JCX + dx} cy={16 + (i % 2) * 8} r={1.8} fill={p.gold}
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0] }} transition={{ duration: 1.1, delay: i * 0.15, repeat: Infinity, repeatDelay: 0.5 }} />
        ))}

        {/* jar interior fills (clipped to the glass) */}
        <g clipPath="url(#sg_jar)">
          {/* head-start mint band ($0 → $3) */}
          <motion.rect x={JX} y={dY(HEAD)} width={JW} height={J_BOT - dY(HEAD)} fill={p.mint} opacity={0.85}
            initial={false} animate={{ scaleY: showHead ? 1 : 0, opacity: showHead ? 0.85 : 0 }} transition={reduce ? { duration: 0 } : spring}
            style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }} />
          {/* gold weekly column ($3 → $28), continuous scaleY off the motion value */}
          <motion.rect x={JX} y={goldTop} width={JW} height={goldBase - goldTop} fill={solved ? 'url(#sg_goldWin)' : 'url(#sg_gold)'}
            style={{ scaleY: fillScale, transformBox: 'fill-box', transformOrigin: 'bottom center' }} />
          {/* week ticks inside the brace region — draw in bottom→top when we divide */}
          {[1, 2, 3, 4, 5].map((k) => (
            <motion.line key={k} x1={JX} y1={dY(HEAD + k * 5)} x2={JX + JW} y2={dY(HEAD + k * 5)} stroke="#ffffff" strokeWidth={1} opacity={0.22}
              initial={{ pathLength: 0 }} animate={{ pathLength: showTicks ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.35, delay: showTicks ? k * 0.09 : 0 }} />
          ))}
        </g>

        {/* jar glass outline (U-shape, open mouth) — drawn on */}
        <motion.path d={`M${JX},${J_RIM} L${JX},${J_BOT} Q ${JX},${J_BOT + 10} ${JX + 12},${J_BOT + 10} L${JX + JW - 12},${J_BOT + 10} Q ${JX + JW},${J_BOT + 10} ${JX + JW},${J_BOT} L${JX + JW},${J_RIM}`}
          fill="none" stroke={p.creamSoft} strokeWidth={2} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.8, ease: 'easeInOut' }} />
        <line x1={JX - 6} y1={J_RIM} x2={JX + JW + 6} y2={J_RIM} stroke={p.creamSoft} strokeWidth={3} strokeLinecap="round" opacity={0.9} />

        {/* goal line at $28 (coral) */}
        <motion.line x1={JX} y1={J_TOP} x2={JX + JW} y2={J_TOP} stroke={solved ? p.mint : p.coral} strokeWidth={2.4}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.6, ease: 'easeInOut' }} />
        <text x={JX + JW + 8} y={J_TOP + 4} fill={solved ? p.mint : p.coral} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={800}>$28</text>

        {/* "$25 to save" brace on the right, from $3 up to $28 */}
        {showBrace && (
          <motion.g initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={reduce ? { duration: 0 } : spring}>
            <path d={`M${JX + JW + 22},${dY(HEAD)} q 5,0 5,-5 L${JX + JW + 27},${(J_TOP + dY(HEAD)) / 2 + 5} q 0,-5 5,-5 q -5,0 -5,-5 L${JX + JW + 27},${J_TOP + 5} q 0,-5 -5,-5`}
              fill="none" stroke={p.gold} strokeWidth={1.4} opacity={0.8} />
            <text x={JX + JW + 34} y={(J_TOP + dY(HEAD)) / 2 + 4} fill={p.gold} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={800}>$25</text>
            <text x={JX + JW + 34} y={(J_TOP + dY(HEAD)) / 2 + 17} fill={p.mutedOnPaper} fontSize={8.5} fontFamily="var(--font-numeric)">to save</text>
          </motion.g>
        )}

        {/* $5-a-week coin at the jar mouth */}
        {showCoin && (
          <motion.g initial={{ opacity: 0, scale: 0.4, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={reduce ? { duration: 0 } : spring}>
            <circle cx={JCX} cy={J_RIM - 12} r={11} fill="url(#sg_gold)" stroke="#8f6512" strokeWidth={1} />
            <text x={JCX} y={J_RIM - 8} textAnchor="middle" fill="#3a2708" fontSize={9} fontFamily="var(--font-numeric)" fontWeight={800}>$5</text>
            <text x={JCX + 18} y={J_RIM - 9} fill={p.gold} fontSize={9.5} fontFamily="var(--font-numeric)" fontWeight={700}>/ week</text>
          </motion.g>
        )}

        {/* the climbing week-marker rides the gold surface */}
        {si >= 7 && (
          <motion.g style={{ y: markerY }}>
            <polygon points={`${JX - 3},0 ${JX - 11},-4 ${JX - 11},4`} fill={solved ? mint : gold} />
            <text x={JX - 14} y={4} textAnchor="end" fill={solved ? mint : gold} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={800}>wk {weeks}</text>
          </motion.g>
        )}
      </svg>

      {/* live readout below the jar — the count-up + the landed result */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums' }}>
        <span key={`sv${savedTotal}`} style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, color: solved ? mint : p.cream, textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}>${savedTotal}</span>
        <span style={{ fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: p.creamSoft }}>saved</span>
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(12px, 1.3vw, 17px)', fontWeight: 800, color: solved ? mint : p.mutedOnPaper, letterSpacing: '0.04em' }}>
        {solved ? 'reached in 5 weeks ✓' : si >= 8 ? `filling up — week ${weeks}` : si >= 5 ? 'peel off the $3' : si >= 4 ? '5x + 3 = 28' : 'the plan'}
      </div>
    </div>
  )
}

// ── THE WEEK RAY — the inequality instrument ──────────────────────────────────
// An inequality's answer is a SET of weeks, so this is the one question type that
// keeps a surface: set the boundary, then shade which side works.
//
// ⚠️ THE JAR DOES NOT TRACK THE DIAL while you are answering. It shows the story —
// the money you start with, the line you must not cross, the weekly rate — and it
// only moves on the reveal. A jar that reacted live would turn solving into
// hot-and-cold nudging (find the level, never do the algebra), which is exactly why
// BalanceBench's beam stays level while the child sets x. The ray is where the
// answer is produced; the jar is why the answer is what it is.

/** The static story jar for an inequality: fill level, the line you must not cross,
 *  and the weekly arrow. `settled` drains/fills it to the boundary week — the check,
 *  shown on the reveal and on the walkthrough's landing beat. */
function StoryJar({ p, task, settled }: { p: Palette; task: Task; settled: boolean }): ReactElement {
  const top = Math.max(1, task.top ?? 1)
  const rate = task.rate ?? 0, base = task.base ?? 0, limit = task.limit ?? 0, n = task.n ?? 0
  const spend = task.mode === 'spend'
  const dY = (d: number) => J_BOT - (Math.max(0, Math.min(top, d)) / top) * (J_BOT - J_TOP)
  const level = settled ? (spend ? base - rate * n : rate * n + base) : (spend ? base : base)
  const fillTop = dY(level)
  const lineY = dY(limit)
  return (
    <svg viewBox={`0 0 ${S_W} ${S_H}`}  style={{ width: 'clamp(200px, 27vw, 300px)', height: 'auto', borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
      <defs>
        <linearGradient id="ry_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#173245" /><stop offset="1" stopColor="#0a1622" /></linearGradient>
        <linearGradient id="ry_gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.gold} /><stop offset="1" stopColor={p.goldDeep} /></linearGradient>
        <linearGradient id="ry_win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5cd6ac" /><stop offset="1" stopColor="#2fb37f" /></linearGradient>
        <clipPath id="ry_jar"><rect x={JX} y={J_RIM} width={JW} height={J_BOT - J_RIM} rx={12} /></clipPath>
      </defs>
      <rect x={0} y={0} width={S_W} height={S_H} fill="url(#ry_sky)" />
      <ellipse cx={JCX} cy={J_BOT} rx={JW * 0.62} ry={7} fill="#000" opacity={0.28} />
      <g clipPath="url(#ry_jar)">
        <rect x={JX} y={fillTop} width={JW} height={J_BOT - fillTop} fill={settled ? 'url(#ry_win)' : 'url(#ry_gold)'} style={{ transition: 'y 420ms ease, height 420ms ease' }} />
      </g>
      <path d={`M${JX},${J_RIM} L${JX},${J_BOT} Q ${JX},${J_BOT + 10} ${JX + 12},${J_BOT + 10} L${JX + JW - 12},${J_BOT + 10} Q ${JX + JW},${J_BOT + 10} ${JX + JW},${J_BOT} L${JX + JW},${J_RIM}`} fill="none" stroke={p.creamSoft} strokeWidth={2} strokeLinecap="round" />
      <line x1={JX - 6} y1={J_RIM} x2={JX + JW + 6} y2={J_RIM} stroke={p.creamSoft} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
      {/* the line you must not cross — the goal above (save) or the reserve below (spend) */}
      <line x1={JX - 6} y1={lineY} x2={JX + JW + 6} y2={lineY} stroke={p.coral} strokeWidth={2.4} strokeDasharray={spend ? '6 4' : undefined} />
      <text x={JX + JW + 10} y={lineY + 4} fill={p.coral} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={800}>${limit}</text>
      <text x={JX + JW + 10} y={lineY + 17} fill={p.mutedOnPaper} fontSize={8.5} fontFamily="var(--font-numeric)">{spend ? 'bus money' : 'goal'}</text>
      {/* the weekly move */}
      <text x={JX - 12} y={(J_TOP + J_BOT) / 2} textAnchor="end" fill={spend ? p.coral : p.mint} fontSize={13} fontFamily="var(--font-numeric)" fontWeight={800}>{spend ? '↓' : '↑'} ${rate}</text>
      <text x={JX - 12} y={(J_TOP + J_BOT) / 2 + 13} textAnchor="end" fill={p.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)">a week</text>
      <text x={JCX} y={J_BOT - 12} textAnchor="middle" fill={p.cream} fontSize={22} fontFamily="var(--font-numeric)" fontWeight={800} style={{ textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}>${Math.max(0, Math.round(level))}</text>
      {settled && <text x={JCX} y={J_RIM - 12} textAnchor="middle" fill={p.mint} fontSize={12} fontFamily="var(--font-numeric)" fontWeight={800}>after week {n}</text>}
    </svg>
  )
}

/** The week line: ticks from 0, a boundary dot, and the shaded side once chosen. */
function WeekRay({ p, n, dir, hi, reveal }: { p: Palette; n: number; dir: Dir; hi: number; reveal?: boolean }): ReactElement {
  const W = 320, H = 56, L = 22, R = W - 22, y = 28
  const xf = (w: number) => L + (w / Math.max(1, hi)) * (R - L)
  const col = reveal ? p.mint : p.gold
  const x0 = xf(n)
  return (
    <svg viewBox={`0 0 ${W} ${H}`}  style={{ width: 'clamp(240px, 34vw, 340px)', height: 'auto', display: 'block' }}>
      <text x={L} y={11} fill={p.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)" letterSpacing="0.14em">WEEKS</text>
      <line x1={L} y1={y} x2={R} y2={y} stroke={p.glassBorder} strokeWidth={2} />
      {Array.from({ length: hi + 1 }, (_, w) => (
        <g key={w}>
          <line x1={xf(w)} y1={y - 5} x2={xf(w)} y2={y + 5} stroke={p.mutedOnPaper} strokeWidth={1} />
          <text x={xf(w)} y={y + 18} textAnchor="middle" fill={p.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)">{w}</text>
        </g>
      ))}
      {dir !== 0 && (
        <line x1={x0} y1={y} x2={dir < 0 ? L : R} y2={y} stroke={col} strokeWidth={6} strokeLinecap="round" opacity={0.9}
          style={{ transition: 'x1 200ms ease, x2 200ms ease' }} />
      )}
      <circle cx={x0} cy={y} r={6.5} fill={dir === 0 ? 'none' : col} stroke={dir === 0 ? p.gold : p.cream} strokeWidth={2}
        strokeDasharray={dir === 0 ? '3 3' : undefined} style={{ transition: 'cx 200ms ease' }} />
    </svg>
  )
}

/** RayBoard — the read-only picture: story jar + week ray. Used as the instrument's
 *  display AND as the walkthrough scene, so the child watches the exact surface
 *  they will be graded on. */
function RayBoard({ P: p, task, n, dir, settled, reveal }: {
  P: Palette; task: Task; n: number; dir: Dir; settled?: boolean; reveal?: boolean
}): ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 10px)' }}>
      <StoryJar p={p} task={task} settled={!!settled} />
      <WeekRay p={p} n={n} dir={dir} hi={task.hi ?? 12} reveal={reveal} />
    </div>
  )
}

function RayLoader({ P: p, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}): ReactElement {
  const cur = typeof value === 'object' ? value : { k: 'ray' as const, n: 0, dir: 0 as Dir }
  const hi = task.hi ?? 12
  const set = (n: number, dir: Dir) => setValue({ k: 'ray', n, dir })
  const ready = cur.dir !== 0

  const chip = (d: 1 | -1, label: string) => {
    const lit = cur.dir === d || (reveal && task.dir === d)
    return (
      <button type="button" disabled={disabled} onClick={() => set(cur.n, d)}
        style={{
          flex: 1, padding: 'clamp(10px,1.2vw,14px)', borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
          fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 'clamp(12px,1.35vw,16px)',
          background: lit ? p.gold : p.glass, color: lit ? '#12283a' : p.cream,
          border: `2px solid ${lit ? p.gold : p.glassBorder}`, transition: 'background 140ms, border-color 140ms',
        }}>{label}</button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px,1.2vw,14px)', width: '100%' }}>
      <RayBoard P={p} task={task} n={cur.n} dir={cur.dir} settled={!!reveal} reveal={reveal} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Nudge P={p} label="−" disabled={disabled} onClick={() => set(Math.max(0, cur.n - 1), cur.dir)} />
        <div style={{ minWidth: 140, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(24px,2.6vw,34px)', fontWeight: 800, color: reveal ? p.mint : p.gold }}>{cur.n}</div>
          <div style={{ fontSize: 'clamp(11px,1.15vw,14px)', color: p.creamSoft }}>boundary week</div>
        </div>
        <Nudge P={p} label="+" disabled={disabled} onClick={() => set(Math.min(hi, cur.n + 1), cur.dir)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', maxWidth: 'clamp(280px,42vw,440px)' }}>
        <div style={{ fontSize: 'clamp(11px,1.1vw,14px)', color: p.creamSoft, fontWeight: 700, letterSpacing: '0.04em' }}>Which weeks work?</div>
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {chip(-1, `◀ ${cur.n} or fewer`)}
          {chip(1, `${cur.n} or more ▶`)}
        </div>
      </div>

      <CommitBtn P={p} label="SHADE IT ✓" disabled={disabled || !ready} onClick={() => onCommit(cur)} />
    </div>
  )
}

// ── worked example 2: the SIGN FLIP, on the ray ────────────────────────────────
// $28 in the jar, $4 a week going out, $8 that must stay for the bus:
// 28 − 4x ≥ 8 → −4x ≥ −20 → x ≤ 5. The walkthrough works BOTH halves the scored
// question grades — the boundary AND the direction — so no gesture is graded that
// the child has never seen. (This is why there is no guided round.)
const DEMO_RAY: Task = {
  kind: 'inequality', mode: 'spend', title: 'Spending limit', badge: '28 − 4x ≥ 8', tone: 'b',
  prompt: '', say: '', work: [],
  rate: 4, base: 28, limit: 8, top: 28, n: 5, dir: -1, hi: 10,
}
const DEMO_RAY_STEPS: DemoStep<V>[] = [
  { say: 'One more, a harder kind. The jar has twenty-eight dollars in it — but this time money is going OUT.', value: { k: 'ray', n: 0, dir: 0 }, board: 'have $28' },
  { say: 'Eight of those dollars are your bus money. That dashed line is the floor: the jar must never drop below it.', value: { k: 'ray', n: 0, dir: 0 }, board: 'keep $8 for the bus' },
  { say: 'Every week you spend four dollars. So after x weeks the jar holds twenty-eight minus four x, and that has to stay at or above eight.', value: { k: 'ray', n: 0, dir: 0 }, board: '28 − 4x ≥ 8' },
  { say: 'Take the bus money off both sides. Negative four x is at least negative twenty.', value: { k: 'ray', n: 0, dir: 0 }, board: '−4x ≥ −20' },
  { say: 'Now divide both sides by negative four. Here is the part to watch: dividing by a NEGATIVE flips the direction. At least becomes at most.', value: { k: 'ray', n: 0, dir: 0 }, board: 'x ≤ 5  (flipped)' },
  { say: 'So the boundary week is five. Set the dot on five.', value: { k: 'ray', n: 5, dir: 0 }, board: 'boundary = week 5' },
  { say: 'Check it against the jar. Five weeks of spending four dollars is twenty dollars, and the jar lands exactly on the eight-dollar bus line.', value: { k: 'ray', n: 5, dir: 0 }, board: '28 − 20 = 8 ✓' },
  { say: 'Fewer weeks leaves more in the jar, so those are fine. More weeks eats the bus money. Shade five and everything below it.', value: { k: 'ray', n: 5, dir: -1 }, board: 'shade 5 and below' },
  { say: 'Up to five weeks. That is the answer — a boundary and a direction, and the flip is what gave you the direction.', value: { k: 'ray', n: 5, dir: -1 }, board: 'x ≤ 5 ✓' },
]

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'linearEquationsInequalities',
  title: 'SAVING GOAL',
  ticketLabel: 'savings plan',
  palette: P,
  motif: '🎯',
  makeTask,
  // PER-TASK gating: a question shows the pad when its answer is a single number and
  // the instrument was never doing the solving. Equations were compute-then-dial on a
  // beam that deliberately does not react, so they get choices. Inequalities keep the
  // ray — a solution SET is not a number, and the direction is where the flip lives.
  answerPad: (t) => (t.pad ? numChoices(t.x ?? 0, t.pad, { min: 0 }) : []),
  initialValue: (t) => (t.kind === 'equation' ? 0 : { k: 'ray', n: 0, dir: 0 }),
  grade: (t, v) => t.kind === 'equation'
    ? typeof v === 'number' && v === t.x
    : typeof v === 'object' && v.n === t.n && v.dir === t.dir,
  revealText: (t) => (t.kind === 'equation'
    ? `${t.x} weeks`
    : t.dir === -1 ? `up to ${t.n} weeks` : `${t.n} weeks or more`),
  glide: (t, _from, setValue, later) =>
    later(() => setValue(t.kind === 'equation' ? (t.x ?? 0) : { k: 'ray', n: t.n ?? 0, dir: t.dir ?? 1 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) =>
    <RayLoader P={palette} task={task} value={value} setValue={setValue}
      disabled={disabled} reveal={reveal} onCommit={onCommit} />,
  // Branches by example: the equation poses on the savings jar, the inequality on the
  // ray itself — so the child watches the surface they will be graded on, not a
  // different picture.
  TutorialScene: ({ palette, task, value, stepIndex, frameCount, ended }) =>
    task.kind === 'inequality'
      ? <RayBoard P={palette} task={task} n={typeof value === 'object' ? value.n : 0}
        dir={typeof value === 'object' ? value.dir : 0} settled={stepIndex >= 6} reveal={ended} />
      : <DemoJar palette={palette} value={value} stepIndex={stepIndex} frameCount={frameCount} ended={ended} />,
  start: {
    blurb: <><strong>You&apos;re saving up for something.</strong> Money goes in each week — the question is <strong>when</strong> you can afford it. That&apos;s an <strong>equation</strong> to solve. And when money goes <strong>out</strong> instead, you shade every week that still keeps you safe.</>,
    ticket: { title: 'Weeks to goal', badge: '5x + 3 = 28', tone: 'a' },
    startLabel: 'Open the savings plan →',
  },
  overview: {
    say: 'Here is the plan. When you save the same amount every week, the money you have is an expression with a letter x for the number of weeks. To find WHEN you can afford your goal, you set that equal to the price and peel it apart, one step at a time, until x is on its own. Then we will do one where money goes out instead, and the answer is a whole stretch of weeks. Let us work them out together, nice and slow.',
    problem: <>How many weeks until <strong>5x + 3 = 28</strong>?</>,
    points: [
      <>After x weeks you have saved <strong>5x + 3</strong> dollars.</>,
      <>Set it equal to the goal, then <strong>undo</strong> each step to free x.</>,
      <><strong>Subtract the 3</strong>, then <strong>divide by 5</strong> — that&apos;s the number of weeks.</>,
      <>Divide by a <strong>negative</strong> and the direction <strong>flips</strong>.</>,
    ],
  },
  tutorial: [
    { task: DEMO_TASK, initial: 0, hand: 'drag', steps: DEMO_STEPS },
    { task: DEMO_RAY, initial: { k: 'ray', n: 0, dir: 0 }, hand: 'tap', steps: DEMO_RAY_STEPS },
  ],
  // No guided round: the walkthrough works BOTH examples (the equation, then the
  // boundary AND direction on the ray), so every gesture scored play grades has
  // already been shown. Walkthrough → straight into play.
  sig: (t) => `${t.kind}:${t.badge}`,
}

export default function SavingGoal(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
