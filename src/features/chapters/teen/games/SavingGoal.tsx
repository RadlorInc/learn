'use client'
/**
 * SavingGoal — the Linear Equations & Inequalities chapter (15–16) as a PLAYABLE
 * GAME. World: saving up toward a goal — you put money away each week and want to
 * know WHEN you can afford the thing.
 *
 * NON-MCQ, two production interactions (variety within the chapter), each themed:
 *   • EQUATION   → a BALANCE BEAM (slide x until both pans balance): "how many
 *                  weeks until saved = price?" Solving ax + b = c for x = weeks.
 *   • INEQUALITY → a number DIAL (SlideValue): "at least how many weeks/sales to
 *                  have ENOUGH?" Dial the boundary integer.
 * Exactly the 12–14 shape on GameShell: overview on the chalkboard + a code-drawn
 * savings-tracker scene → baby-step walkthrough → guided → scored play. The scene
 * is code-drawn (pure CSS/SVG); no image assets.
 *
 * Vetted math mirrors LinearEquationsInequalitiesTeenLesson (L1 one/two-step
 * equations, L2 multi-step / variables both sides, L3 inequalities w/ sign-flip and
 * |x| = a). Every equation reduces to an integer x; here we frame those x-values as
 * "weeks", which stay non-negative small integers.
 */
import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, useMotionValueEvent, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, BalanceBeam, SlideValue } from './parts/gameKit'

const P: Palette = {
  nightTop: '#132a3b', nightBot: '#0a1622',
  cream: '#eaf4fb', creamSoft: 'rgba(234,244,251,0.82)',
  inkOnPaper: '#12283a', mutedOnPaper: '#5f7d94',
  gold: '#ffd25c', goldDeep: '#d99f1e',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(18,40,58,0.6)', glassBorder: 'rgba(234,244,251,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const rnz = (lo: number, hi: number) => { let n = rint(lo, hi); while (n === 0) n = rint(lo, hi); return n }
const fmtInt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
/** Coefficient prefix on x: "2x", "−x", "x". */
const coef = (n: number) => (n === 1 ? 'x' : n === -1 ? '−x' : `${fmtInt(n)}x`)
/** A signed term joined into an expression: " + 3" / " − 3" (leading space). */
const term = (n: number) => (n < 0 ? ` − ${Math.abs(n)}` : ` + ${n}`)
/** "ax + b" as a whole expression. */
const lin = (a: number, b: number) => (b === 0 ? coef(a) : `${coef(a)}${term(b)}`)

// The answer is either an equation's x (weeks) or an inequality boundary n.
type V = { k: 'x'; x: number } | { k: 'n'; n: number }

interface Task extends BaseTask {
  kind: 'equation' | 'inequality'
  // equation (BalanceBeam):  a·x + b = c  →  x is the answer
  a?: number; b?: number; c?: number; x?: number
  // inequality (SlideValue): boundary integer is the answer
  n?: number; lo?: number; hi?: number
}

// ── EQUATIONS ──────────────────────────────────────────────────────────────────
// Every equation is a·x + b = c that reduces to an integer x = weeks (kept small,
// non-negative, so "weeks until you can afford it" reads naturally).
function equationTask(d: 1 | 2 | 3): Task {
  const a = rint(2, 6)                 // $/week saved
  const x = rint(1, 9)                 // weeks (the answer)
  const b = d === 1 ? rnz(-8, 12) : rnz(-12, 18)
  const c = a * x + b
  const expr = lin(a, b)
  return {
    kind: 'equation',
    title: 'Weeks to goal', badge: `${expr} = ${fmtInt(c)}`, tone: d === 3 ? 'b' : 'a',
    prompt: `Slide the weeks x until ${expr} balances ${fmtInt(c)}.`,
    say: `You save ${a} dollars a week${b !== 0 ? `, and you already have ${b < 0 ? `a ${Math.abs(b)} dollar shortfall` : `${b} dollars`}` : ''}. The goal costs ${spoken(c)} dollars. Slide the weeks until both sides balance.`,
    work: [
      `Saved after x weeks: ${expr}. Set it equal to the goal: ${expr} = ${fmtInt(c)}.`,
      `${b < 0 ? 'Add' : 'Subtract'} ${Math.abs(b)} from both sides: ${coef(a)} = ${fmtInt(c - b)}.`,
      `Divide both sides by ${a}: x = ${fmtInt(x)}. So ${x} weeks.`,
    ],
    a, b, c, x,
  }
}

// ── INEQUALITIES ────────────────────────────────────────────────────────────────
// Boundary problems: "at LEAST how many …". The dialed answer is the boundary
// integer. Includes a sign-flip case (dividing by a negative) at L3.
function inequalityTask(d: 1 | 2 | 3): Task {
  const roll = Math.random()
  if (d >= 3 && roll < 0.4) {
    // Sign-flip: goal minus spending. "goal − c·x ≥ 0" → x ≤ goal/c. Boundary = goal/c.
    const c = rint(2, 6)               // $/week spent
    const bnd = rint(3, 9)             // the boundary week count
    const goal = c * bnd
    return {
      kind: 'inequality',
      title: 'Spending limit', badge: `${fmtInt(goal)} − ${coef(c)} ≥ 0`, tone: 'b',
      prompt: `Dial the most weeks x you can spend $${c}/week and still not go below zero.`,
      say: `You start with ${goal} dollars and spend ${c} dollars each week. Dial the most weeks you can go before you hit zero.`,
      work: [
        `You need ${fmtInt(goal)} − ${coef(c)} ≥ 0. Subtract ${goal}: −${coef(c)} ≥ ${fmtInt(-goal)}.`,
        `Divide by −${c} — dividing by a negative FLIPS the sign: x ≤ ${bnd}.`,
        `So the most weeks is ${bnd}.`,
      ],
      n: bnd, lo: 0, hi: bnd + 8,
    }
  }
  // "At least" savings: save p/week toward a goal, how many weeks to have ≥ goal?
  const p = rint(3, 8)                 // $/week
  const bnd = rint(3, 10)              // weeks needed (boundary)
  const have = d === 1 ? 0 : rint(0, p * 2)
  const goal = p * bnd + have
  const expr = have === 0 ? coef(p) : `${coef(p)}${term(have)}`
  return {
    kind: 'inequality',
    title: 'Weeks to afford', badge: `${expr} ≥ ${fmtInt(goal)}`, tone: d === 3 ? 'b' : 'a',
    prompt: `Dial the fewest weeks x to save at least $${goal}.`,
    say: `You save ${p} dollars a week${have ? `, on top of ${have} you already have` : ''}. The goal is ${goal} dollars. Dial the fewest weeks to have at least enough.`,
    work: [
      `Saved after x weeks: ${expr}. You need it to be at least ${fmtInt(goal)}: ${expr} ≥ ${fmtInt(goal)}.`,
      have === 0
        ? `Divide by ${p}: x ≥ ${bnd}.`
        : `Subtract ${have}: ${coef(p)} ≥ ${fmtInt(goal - have)}. Divide by ${p}: x ≥ ${bnd}.`,
      `So the fewest whole weeks is ${bnd}.`,
    ],
    n: bnd, lo: 0, hi: bnd + 8,
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return equationTask(1)
  if (d === 2) return Math.random() < 0.6 ? equationTask(2) : inequalityTask(2)
  return Math.random() < 0.5 ? equationTask(3) : inequalityTask(3)
}

// ── fixed worked example (walkthrough) — a two-step equation ────────────────────
// Save $5/week, already have $3, goal is $28 → 5x + 3 = 28 → x = 5 weeks.
const DEMO_A = 5, DEMO_B = 3, DEMO_C = 28, DEMO_X = 5
const DEMO_TASK: Task = {
  kind: 'equation', title: 'Weeks to goal', badge: '5x + 3 = 28', tone: 'a',
  prompt: '', say: '',
  work: ['5x + 3 = 28. Subtract 3: 5x = 25. Divide by 5: x = 5. So 5 weeks.'],
  a: DEMO_A, b: DEMO_B, c: DEMO_C, x: DEMO_X,
}
// The walkthrough ACTS OUT the save-up: the money jar's inside is the dollar
// number line ($0 at the floor, the $28 goal at the top). `x` carries the weeks
// (0 until the "climb" beat, then 5) and the scene reads `stepIndex` to reveal
// each overlay — head start → weekly rate → equation → peel the $3 → divide into
// $5 weeks → climb → unlocked. Eleven BABY steps: ONE idea + ONE board line +
// ONE beat each; the physical save-up is the hook, then the algebra unfolds one
// inverse operation per step. (storyboard: docs/storyboards/saving-goal.md)
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "You've got your eye on a $28 skateboard. Let's work out when you can buy it.", value: { k: 'x', x: 0 }, board: 'goal = $28' },
  { say: 'Good news — you already have three dollars saved. That is your head start, sitting at the bottom of the jar.', value: { k: 'x', x: 0 }, board: 'have $3' },
  { say: 'And every week you drop in five dollars more. So your savings grow five dollars at a time.', value: { k: 'x', x: 0 }, board: '+ $5 each week' },
  { say: 'After x weeks, the weekly saving adds up to five x, and you still have that three dollars on top.', value: { k: 'x', x: 0 }, board: '5x + 3' },
  { say: 'You can afford it when your savings reach twenty-eight dollars. So five x plus three equals twenty-eight — that is the equation.', value: { k: 'x', x: 0 }, board: '5x + 3 = 28' },
  { say: 'To find x, get it on its own. First undo the plus three — take the three-dollar head start off both sides.', value: { k: 'x', x: 0 }, board: '−3 both sides' },
  { say: 'Twenty-eight minus three is twenty-five. So five x equals twenty-five — that part comes purely from weekly saving.', value: { k: 'x', x: 0 }, board: '5x = 25' },
  { say: 'Now undo the times five. Split that twenty-five into equal five-dollar weeks.', value: { k: 'x', x: 0 }, board: 'x = 25 ÷ 5' },
  { say: 'Watch the jar fill one week at a time — five, ten, fifteen, twenty, twenty-five.', value: { k: 'x', x: 5 }, board: '5, 10, 15, 20, 25' },
  { say: 'That took five weeks. So x equals five.', value: { k: 'x', x: 5 }, board: 'x = 5' },
  { say: 'Add back your three-dollar head start and the jar hits twenty-eight — skateboard unlocked. Five weeks!', value: { k: 'x', x: 5 }, board: '= 5 weeks ✓' },
]

// ── scene geometry (shared) ─────────────────────────────────────────────────
// The money jar's INSIDE is the dollar number line: J_BOT = $0, J_TOP = goal.
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

/** SavingScene — a hand-authored SVG money jar that ACTS OUT the walkthrough beat
 *  by beat with Framer Motion. The jar interior is the exact dollar scale ($0 at
 *  the floor, the $28 goal at the top); a gold savings column rides a continuous
 *  `useMotionValue` progress so it FLOWS between beats, a week-marker rides its
 *  surface, and the skateboard prize hops when the jar hits the goal. The math
 *  skeleton (fill heights, $5 week ticks, goal line) sits on the real dollar→pixel
 *  mapping. `useReducedMotion` collapses to the end state. During real play the
 *  jar marks the task as today. Storyboard: docs/storyboards/saving-goal.md */
function SavingScene({ palette, task, value, stepIndex, frameCount, ended }: {
  palette: Palette; task: Task; value: V; stepIndex: number; frameCount: number; ended: boolean
}) {
  const isDemo = task.badge === '5x + 3 = 28'
  return isDemo
    ? <DemoJar palette={palette} value={value} stepIndex={stepIndex} frameCount={frameCount} ended={ended} />
    : <LiveJar palette={palette} task={task} value={value} ended={ended} />
}

// ── the walkthrough jar (5x + 3 = 28 → x = 5 weeks) ─────────────────────────────
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
  const targetWeekly = value.k === 'x' ? Math.min(25, value.x * 5) : 0
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

      <svg viewBox={`0 0 ${S_W} ${S_H}`} width="clamp(230px, 32vw, 360px)" height="auto" style={{ borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
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

// ── the live jar (guided / scored / reveal) — marks the current task as today ──
function LiveJar({ palette, task, value, ended }: { palette: Palette; task: Task; value: V; ended: boolean }) {
  const p = palette
  const a = task.a ?? DEMO_A, b = task.b ?? DEMO_B, goal = Math.max(1, task.c ?? DEMO_C)
  const weeks = value.k === 'x' ? value.x : 0
  const saved = a * weeks + b
  const reached = saved >= goal - 1e-6
  const solved = (ended || reached) && weeks > 0
  const dY = (d: number) => J_BOT - (Math.max(0, Math.min(goal, d)) / goal) * (J_BOT - J_TOP)
  const fillTop = dY(saved)
  const gold = solved ? 'url(#lg_win)' : 'url(#lg_gold)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)', width: 'clamp(230px, 30vw, 340px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px, 1vw, 14px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: p.mutedOnPaper }}>
        <span>🎯 saving up</span><span style={{ color: p.coral, fontWeight: 800 }}>goal ${goal}</span>
      </div>
      <svg viewBox={`0 0 ${S_W} ${S_H}`} width="clamp(220px, 30vw, 340px)" height="auto" style={{ borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
        <defs>
          <linearGradient id="lg_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#173245" /><stop offset="1" stopColor="#0a1622" /></linearGradient>
          <linearGradient id="lg_gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.gold} /><stop offset="1" stopColor={p.goldDeep} /></linearGradient>
          <linearGradient id="lg_win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5cd6ac" /><stop offset="1" stopColor="#2fb37f" /></linearGradient>
          <clipPath id="lg_jar"><rect x={JX} y={J_RIM} width={JW} height={J_BOT - J_RIM} rx={12} /></clipPath>
        </defs>
        <rect x={0} y={0} width={S_W} height={S_H} fill="url(#lg_sky)" />
        <ellipse cx={JCX} cy={J_BOT} rx={JW * 0.62} ry={7} fill="#000" opacity={0.28} />
        <line x1={JCX - 40} y1={30} x2={JCX + 40} y2={30} stroke={p.glassBorder} strokeWidth={2} opacity={0.6} />
        <Skateboard x={JCX} y={20} mint={solved} />
        <g clipPath="url(#lg_jar)">
          <rect x={JX} y={fillTop} width={JW} height={J_BOT - fillTop} fill={gold} style={{ transition: 'y 300ms ease, height 300ms ease' }} />
        </g>
        <path d={`M${JX},${J_RIM} L${JX},${J_BOT} Q ${JX},${J_BOT + 10} ${JX + 12},${J_BOT + 10} L${JX + JW - 12},${J_BOT + 10} Q ${JX + JW},${J_BOT + 10} ${JX + JW},${J_BOT} L${JX + JW},${J_RIM}`} fill="none" stroke={p.creamSoft} strokeWidth={2} strokeLinecap="round" />
        <line x1={JX - 6} y1={J_RIM} x2={JX + JW + 6} y2={J_RIM} stroke={p.creamSoft} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
        <line x1={JX} y1={J_TOP} x2={JX + JW} y2={J_TOP} stroke={solved ? p.mint : p.coral} strokeWidth={2.4} />
        <text x={JX + JW + 8} y={J_TOP + 4} fill={solved ? p.mint : p.coral} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={800}>${goal}</text>
        <text x={JCX} y={(J_TOP + J_BOT) / 2} textAnchor="middle" fill={p.cream} fontSize={26} fontFamily="var(--font-numeric)" fontWeight={800} style={{ textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}>${Math.max(0, saved)}</text>
      </svg>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(12px, 1.3vw, 17px)', fontWeight: 800, color: solved ? '#2fb37f' : p.mutedOnPaper }}>
        {solved ? `reached in ${weeks} weeks ✓` : `week ${weeks}`}
      </div>
    </div>
  )
}

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'linearEquationsInequalities',
  title: 'SAVING GOAL',
  ticketLabel: 'savings plan',
  palette: P,
  motif: '🎯',
  makeTask,
  // NB: instrument only renders when value != null → initialValue must be non-null.
  initialValue: (t) => (t.kind === 'equation' ? { k: 'x', x: 0 } : { k: 'n', n: t.lo ?? 0 }),
  grade: (t, v) => (t.kind === 'equation' ? v.k === 'x' && v.x === t.x : v.k === 'n' && v.n === t.n),
  revealText: (t) => (t.kind === 'equation' ? `${fmtInt(t.x ?? 0)} weeks` : `${fmtInt(t.n ?? 0)} weeks`),
  glide: (t, _from, setValue, later) =>
    later(() => setValue(t.kind === 'equation' ? { k: 'x', x: t.x ?? 0 } : { k: 'n', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'equation') {
      const x = value.k === 'x' ? value.x : 0
      const a = task.a ?? 1, b = task.b ?? 0, c = task.c ?? 0
      return (
        <BalanceBeam
          P={palette}
          x={x}
          setX={(n) => setValue({ k: 'x', x: n })}
          min={0}
          max={(task.x ?? 6) + 6}
          leftOf={(w) => a * w + b}
          right={c}
          leftExpr={lin(a, b)}
          disabled={disabled}
          reveal={reveal}
          onCommit={(n) => onCommit({ k: 'x', x: n })}
          commitLabel="CHECK THE WEEKS ✓"
        />
      )
    }
    const n = value.k === 'n' ? value.n : 0
    return (
      <SlideValue
        P={palette}
        value={n}
        setValue={(m) => setValue({ k: 'n', n: m })}
        min={task.lo ?? 0}
        max={task.hi ?? 20}
        disabled={disabled}
        reveal={reveal}
        onCommit={(m) => onCommit({ k: 'n', n: m })}
        commitLabel="SET THE WEEKS ✓"
        format={(m) => `${m} wk`}
      />
    )
  },
  TutorialScene: ({ palette, task, value, stepIndex, frameCount, ended }) => (
    <SavingScene palette={palette} task={task} value={value} stepIndex={stepIndex} frameCount={frameCount} ended={ended} />
  ),
  start: {
    blurb: <><strong>You&apos;re saving up for something.</strong> Money goes in each week — the question is <strong>when</strong> you can afford it. That&apos;s an <strong>equation</strong> to solve, or an <strong>inequality</strong> for &ldquo;at least enough&rdquo;.</>,
    ticket: { title: 'Weeks to goal', badge: '5x + 3 = 28', tone: 'a' },
    startLabel: 'Open the savings plan →',
  },
  overview: {
    say: 'Here is the plan. When you save the same amount every week, the money you have is an expression with a letter x for the number of weeks. To find WHEN you can afford your goal, you set that equal to the price and peel it apart, one step at a time, until x is on its own. Let us do one together, nice and slow.',
    problem: <>How many weeks until <strong>5x + 3 = 28</strong>?</>,
    points: [
      <>After x weeks you have saved <strong>5x + 3</strong> dollars.</>,
      <>Set it equal to the goal, then <strong>undo</strong> each step to free x.</>,
      <><strong>Subtract the 3</strong>, then <strong>divide by 5</strong> — that&apos;s the number of weeks.</>,
    ],
  },
  tutorial: { task: DEMO_TASK, initial: { k: 'x', x: 0 }, hand: 'drag', steps: DEMO_STEPS },
  guided: {
    task: {
      kind: 'equation', title: 'Weeks to goal', badge: '4x + 2 = 18', tone: 'a',
      prompt: '', say: 'You save four dollars a week and already have two. The goal is eighteen dollars. Slide the weeks until it balances.',
      work: ['4x + 2 = 18. Subtract 2: 4x = 16. Divide by 4: x = 4. So 4 weeks.'],
      a: 4, b: 2, c: 18, x: 4,
    },
    coach: 'Your turn — I will help. Slide the weeks until the scale balances.',
    hand: 'drag',
  },
  sig: (t) => t.badge,
}

export default function SavingGoal(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
