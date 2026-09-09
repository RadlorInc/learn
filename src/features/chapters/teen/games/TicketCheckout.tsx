'use client'
/**
 * TicketCheckout — the Expressions & Variables chapter (15–16) as a PLAYABLE GAME.
 * World: buying event tickets online, where the price is an EXPRESSION with a
 * variable (booking fee + price × tickets).
 *
 * TWO ways to answer, gated PER QUESTION (never per chapter):
 *   • TAP    → AnswerPad. EVALUATE asks for the order total — a single number, and
 *              the dial was never doing the solving: the child worked out 3(2)+5 in
 *              their head and then slid to 11. It now taps. The distractors are the
 *              three real expression misconceptions — reading `ax` as `a + x`,
 *              collapsing `ax + b` into `(a+b)x`, and dropping the booking fee — so
 *              a wrong tap names a wrong METHOD, not a slipped finger.
 *   • BUILD  → SIMPLIFY keeps its EXPRESSION BUILDER (two steppers → ▢x + ▢),
 *              because its answer is not a single number: it is a coefficient AND a
 *              constant, and choosing them separately is the skill (x-terms join
 *              x-terms, numbers join numbers). A pad would hide exactly that.
 *
 * Exactly the 12–14 shape on GameShell: overview on the chalkboard + a code-drawn
 * ticket scene → a TWO-example baby-step walkthrough (the checkout, then the price
 * builder) → scored play. No guided round: both graded gestures are worked in the
 * walkthrough. Illustration assets deferred; the scenes are code-drawn.
 */
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SlideValue, PartsBuilder, numChoices } from './parts/gameKit'
import { rint } from '@/core/rand'

const P: Palette = {
  nightTop: '#12233b', nightBot: '#0b1626',
  cream: '#eef4fb', creamSoft: 'rgba(238,244,251,0.82)',
  inkOnPaper: '#1a2740', mutedOnPaper: '#6b7a95',
  gold: '#ffcf5c', goldDeep: '#d69a1e',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(20,40,66,0.6)', glassBorder: 'rgba(238,244,251,0.2)',
}

const rnz = (lo: number, hi: number) => { let n = rint(lo, hi); while (n === 0) n = rint(lo, hi); return n }
/** Format "ax + b" / "ax − b" (coefficient 1/−1 hide the digit). */
/** ⚠️ MODULE LEVEL. Inside its parent this is a new component TYPE every render, so React
 *  remounts it — and both of these are `motion` elements with a spring in flight, so the
 *  animation restarts from its initial state on every render instead of continuing. */
function Ticket({ i, cx, cy, rot, showTickets, reduce, spring, p }: {
  i: number; cx: number; cy: number; rot: number; showTickets: boolean; reduce: boolean | null
  spring: { type: 'spring'; stiffness: number; damping: number }; p: Palette
}) {
  return (
    <motion.g
      initial={false}
      animate={{ opacity: showTickets ? 1 : 0, x: showTickets ? cx : cx - 46, y: cy, rotate: showTickets ? rot : rot - 10 }}
      transition={reduce ? { duration: 0 } : { ...spring, delay: showTickets ? i * 0.08 : 0 }}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    >
      <g transform="translate(-40 -26)">
        <rect x={0} y={0} width={80} height={52} rx={7} fill="#fff" stroke={p.goldDeep} strokeWidth={1.4} />
        <rect x={0} y={0} width={80} height={52} rx={7} fill={p.gold} opacity={0.14} />
        {/* perforation between stub and body */}
        <line x1={54} y1={4} x2={54} y2={48} stroke={p.goldDeep} strokeWidth={1} strokeDasharray="2 3" opacity={0.7} />
        <circle cx={54} cy={0} r={2.4} fill={p.cream} stroke={p.goldDeep} strokeWidth={0.8} />
        <circle cx={54} cy={52} r={2.4} fill={p.cream} stroke={p.goldDeep} strokeWidth={0.8} />
        <text x={26} y={22} textAnchor="middle" fill={p.mutedOnPaper} fontSize={7} fontFamily="var(--font-numeric)" letterSpacing="0.1em">ADMIT ONE</text>
        <text x={26} y={40} textAnchor="middle" fill={p.inkOnPaper} fontSize={15} fontWeight={800} fontFamily="var(--font-numeric)">$3</text>
        <text x={67} y={30} textAnchor="middle" fill={p.goldDeep} fontSize={9} fontWeight={700} fontFamily="var(--font-numeric)">🎟️</text>
      </g>
    </motion.g>
  )
}

/** ⚠️ MODULE LEVEL. Inside its parent this is a new component TYPE every render, so React
 *  remounts it — and both of these are `motion` elements with a spring in flight, so the
 *  animation restarts from its initial state on every render instead of continuing. */
function RowValue({ y, show, text, mint, rowR, p, springT }: {
  y: number; show: boolean; text: string; mint?: boolean; rowR: number; p: Palette
  springT: { duration: number } | { type: 'spring'; stiffness: number; damping: number }
}) {
  return (
    <motion.text
      x={rowR} y={y} textAnchor="end" fill={mint ? '#1f9e73' : p.inkOnPaper}
      fontSize={16} fontWeight={800} fontFamily="var(--font-numeric)"
      initial={false} animate={{ opacity: show ? 1 : 0.28, scale: show ? 1 : 0.7 }} transition={springT}
      style={{ transformBox: 'fill-box', transformOrigin: 'right center' }}
    >{show ? text : '—'}</motion.text>
  )
}

function lin(a: number, b: number): string {
  const t = a === 1 ? 'x' : a === -1 ? '−x' : a < 0 ? `−${Math.abs(a)}x` : `${a}x`
  if (b === 0) return t
  return b < 0 ? `${t} − ${Math.abs(b)}` : `${t} + ${b}`
}
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)

// The answer is either a single number (evaluate) or a linear expression (build).
type V = { k: 'num'; n: number } | { k: 'lin'; a: number; b: number }
interface Task extends BaseTask {
  kind: 'eval' | 'build'
  n?: number; lo?: number; hi?: number      // eval
  a?: number; b?: number                     // build (and the eval task's own a, b)
  /** Set → this question is answered by TAPPING a choice instead of dialling. Carries
   *  the misconception values that become the distractors, so a wrong tap is a wrong
   *  METHOD (`ax` read as `a + x`, `ax + b` collapsed to `(a+b)x`, the fee dropped),
   *  not a slip of the finger. */
  pad?: number[]
  /** Walkthrough only — the ordered source terms the price-builder scene lays out as
   *  chips (`2x`, `+3`, `4x`, `+1`) before they gather into the two slots. */
  srcTerms?: { v: number; isX: boolean }[]
}

function evalTask(): Task {
  // Ticket count and booking fee stay non-negative — you cannot buy −4 tickets, and a
  // negative fee is not a fee. (Substituting a negative x is exercised in the 12–14
  // band and in Leaderboard; here it would make the story lie.)
  //
  // x ≥ 2, NOT 1: at x = 1 the "collapse ax + b into (a+b)x" distractor equals the
  // answer ((a+b)·1 = a·1 + b), so numChoices would silently drop the misconception
  // this question exists to catch. One ticket is a degenerate order anyway.
  const a = rint(2, 5), b = rint(1, 8)
  let v = rint(2, 6)
  // (a, x) = (2, 2) is the single pair where a + x = a·x, which would likewise
  // collapse the "`ax` means `a + x`" distractor onto the answer.
  while (a === 2 && v === 2) v = rint(2, 6)
  const n = a * v + b
  return {
    kind: 'eval', title: 'Ticket order', badge: `${lin(a, b)},  x = ${v}`, tone: 'a',
    prompt: `What is ${lin(a, b)} when x = ${v}?`,
    context: `Tickets are ${a} each and the order carries a ${b} booking fee. Someone is buying ${v} of them — the ticket part grows with how many you buy, but the fee is charged once however big the order.`,
    padInstruction: 'Tap the total cost of the order.',
    answerLabel: 'total',
    say: `Work out ${a}x plus ${b} when x is ${spoken(v)}. Which total is right?`,
    work: [`Substitute x = ${v}: ${a}(${v}) + ${b} = ${a * v} + ${b} = ${n}.`],
    n, lo: Math.min(-15, n - 10), hi: Math.max(25, n + 10),
    a, b,
    // collapsed ax + b → (a+b)x · read ax as a + x · dropped the booking fee
    pad: [(a + b) * v, a + v + b, a * v],
  }
}

function buildTask(d: 1 | 2 | 3): Task {
  if (d >= 3 || Math.random() < 0.5) {
    // combine like terms: a·x + c + b2·x + e
    const a = rint(2, 6), b2 = rint(1, 5), c = rnz(-7, 9), e = rnz(-7, 9)
    const coef = a + b2, con = c + e
    return {
      kind: 'build', title: 'Tidy the price', badge: `${a}x ${c < 0 ? '−' : '+'} ${Math.abs(c)} + ${b2}x ${e < 0 ? '−' : '+'} ${Math.abs(e)}`, tone: d === 3 ? 'b' : 'a',
      prompt: 'Build the tidied price.',
      say: `Combine like terms: ${a}x ${c < 0 ? 'minus' : 'plus'} ${Math.abs(c)} plus ${b2}x ${e < 0 ? 'minus' : 'plus'} ${Math.abs(e)}. Build it.`,
      work: [`Add the x-terms: ${a}x + ${b2}x = ${coef}x. Add the constants: ${c} + ${e} = ${con}. So ${lin(coef, con)}.`],
      a: coef, b: con,
    }
  }
  // distribute a(x + c)
  const a = rint(2, 6), c = rnz(-6, 7)
  return {
    kind: 'build', title: 'Tidy the price', badge: `${a}(x ${c < 0 ? '−' : '+'} ${Math.abs(c)})`, tone: 'a',
    prompt: 'Build the expanded price.',
    say: `Expand ${a} times the quantity x ${c < 0 ? 'minus' : 'plus'} ${Math.abs(c)}. Build it.`,
    work: [`Multiply ${a} into both terms: ${a}·x = ${a}x and ${a}·(${c}) = ${a * c}. So ${lin(a, a * c)}.`],
    a, b: a * c,
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return Math.random() < 0.5 ? evalTask() : buildTask(1)
  return buildTask(d)
}

// ── fixed worked example (walkthrough) — evaluate a ticket total ────────────────
const DEMO_TASK: Task = {
  kind: 'eval', title: 'Ticket order', badge: '3x + 5,  x = 2', tone: 'a',
  prompt: '', say: '', work: ['Substitute x = 2: 3(2) + 5 = 6 + 5 = 11.'],
  n: 11, lo: 0, hi: 20, a: 3, b: 5,
}
// The walkthrough acts out a CHECKOUT: the price expression 3x + 5 is set up, the
// order (x = 2 tickets) fans in, then we substitute and the running total counts
// up 0 → 6 → 11. `value.n` carries the amount currently on the total readout so the
// scene glides between beats; `stepIndex` gates which parts of the order appear.
//   n schedule: 0 while setting up → 6 once the tickets cost is worked out → 11 when
//   the fee is added.  Eleven BABY steps: hook (expression → the letter → the order
//   → the two prices), then substitute, then add it up one move per step.
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "Here's a ticket order. The price is written as an expression: three x plus five.", value: { k: 'num', n: 0 }, board: '3x + 5' },
  { say: "That letter x isn't a mystery — it just stands for the number of tickets you buy.", value: { k: 'num', n: 0 }, board: 'x = tickets' },
  { say: "Today you're buying two tickets. So for this order, x is two.", value: { k: 'num', n: 0 }, board: 'x = 2' },
  { say: 'The three in front of the x is the price of one ticket: three dollars each.', value: { k: 'num', n: 0 }, board: '3 = $ per ticket' },
  { say: 'The plus five is a booking fee — added once, no matter how many tickets.', value: { k: 'num', n: 0 }, board: '+ 5 = booking fee' },
  { say: 'To find the total, we swap the x for its value. Put two where the x was: three times two, plus five.', value: { k: 'num', n: 0 }, board: '3(2) + 5' },
  { say: 'Work out the ticket part first: three times two is six. Six dollars of tickets.', value: { k: 'num', n: 6 }, board: '3 × 2 = 6' },
  { say: 'Now the order reads six plus five.', value: { k: 'num', n: 6 }, board: '6 + 5' },
  { say: 'Add the five-dollar booking fee on top.', value: { k: 'num', n: 6 }, board: 'add the $5 fee' },
  { say: 'Six plus five is eleven.', value: { k: 'num', n: 11 }, board: '= 11' },
  { say: 'So the whole order comes to eleven dollars. Eleven is the total.', value: { k: 'num', n: 11 }, board: 'total = $11' },
]

// ── worked example 2: the PRICE BUILDER, on the gesture the checkout never showed ──
// Scored play grades `build` on two steppers (▢x + ▢), and the old walkthrough
// stopped at the checkout total — so a child was graded on a gesture nobody had
// demonstrated, and on the idea behind it (x-terms join x-terms, plain numbers join
// plain numbers) with no worked instance. Eight baby steps: name the four parts,
// sort them into the two kinds, join each kind, set each slot, read the tidy price.
const DEMO_BUILD: Task = {
  kind: 'build', title: 'Tidy the price', badge: '2x + 3 + 4x + 1', tone: 'a',
  prompt: '', say: '', work: [],
  a: 6, b: 4,
  srcTerms: [{ v: 2, isX: true }, { v: 3, isX: false }, { v: 4, isX: true }, { v: 1, isX: false }],
}
const DEMO_BUILD_STEPS: DemoStep<V>[] = [
  { say: 'Same shop, a messier price. This one was written out in four pieces, and we want it tidy.', value: { k: 'lin', a: 0, b: 0 }, board: '2x + 3 + 4x + 1' },
  { say: 'Two of the pieces carry an x. Two x and four x — those are ticket pieces, priced per ticket.', value: { k: 'lin', a: 0, b: 0 }, board: 'x pieces: 2x, 4x' },
  { say: 'The other two are plain numbers. Three and one — those are fees, paid once.', value: { k: 'lin', a: 0, b: 0 }, board: 'plain: 3, 1' },
  { say: 'Only pieces of the same kind can join. Ticket pieces join ticket pieces, fees join fees.', value: { k: 'lin', a: 0, b: 0 }, board: 'same kind joins' },
  { say: 'Join the ticket pieces first. Two x and four x make six x.', value: { k: 'lin', a: 0, b: 0 }, board: '2x + 4x = 6x' },
  { say: 'So the per-ticket slot is six. Set it to six.', value: { k: 'lin', a: 6, b: 0 }, board: 'per ticket = 6' },
  { say: 'Now the fees. Three and one make four.', value: { k: 'lin', a: 6, b: 0 }, board: '3 + 1 = 4' },
  { say: 'Set the fee slot to four. Six x plus four — the same price, written tidily.', value: { k: 'lin', a: 6, b: 4 }, board: '6x + 4' },
]

// ── hand-authored SVG checkout scene (storyboard: docs/storyboards/ticket-checkout.md)
// A tilted checkout window: title bar + the load-bearing price-formula strip
// (3·[x] + 5, the variable in a pill that flips x→2 on substitution), two tickets
// that fan in when the order is set, a receipt with exact line-item dollars, and a
// TOTAL that COUNTS UP continuously (0 → 6 → 11) via a useMotionValue driven off
// value.n. `stepIndex` gates which parts of the order have appeared; on `ended` the
// whole paid order holds. Everything numeric is code-drawn and exact.
function TicketScene({ palette, value, stepIndex, ended }: {
  palette: Palette; value: V; stepIndex: number; ended: boolean
}) {
  const p = palette
  const reduce = useReducedMotion()
  const W = 340, H = 320

  const n = value.k === 'num' ? value.n : 0
  const solved = ended || n >= 11
  const spring = { type: 'spring' as const, stiffness: 300, damping: 20 }
  const springT = reduce ? { duration: 0 } : spring

  // ── CONTINUOUS total count-up: a motion value animated toward value.n so the
  //    total glides between beats (0 → 6 → 11) instead of snapping. ──
  const total = useMotionValue(0)
  useEffect(() => {
    const c = animate(total, n, { duration: reduce ? 0 : 0.9, ease: [0.22, 0.61, 0.36, 1] })
    return () => c.stop()
  }, [n, reduce, total])
  const totalText = useTransform(total, (v) => `$${Math.round(v)}`)

  const step = ended ? 99 : stepIndex
  const showTickets = step >= 2
  const highlightPer = step === 3
  const highlightFee = step === 4
  const showFee = step >= 4
  const substituted = step >= 5
  const showTicketSub = step >= 6
  const totalCol = solved ? '#1f9e73' : p.goldDeep

  // formula strip geometry (left-aligned tokens on a fixed baseline)
  const fy = 128                 // formula baseline
  const fx = 96                  // left edge of "3"
  const pillX = fx + 20, pillW = 26, pillCX = pillX + pillW / 2

  // receipt row geometry
  const rowL = 40, rowR = 300
  const ticketRowY = 196, feeRowY = 226, totalRowY = 286

  // ── a single admission ticket (fans in from the left with a spring) ──

  // ── a receipt line-item value that springs in when its beat arrives ──

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} 
        style={{ width: 'clamp(230px, 32vw, 348px)', height: 'auto', borderRadius: 14, filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.42))', display: 'block', transform: 'rotate(-0.8deg)' }}>
        <defs>
          <linearGradient id="tc_paper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor={p.cream} />
          </linearGradient>
          <linearGradient id="tc_shim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#5cd6ac" stopOpacity="0" />
            <stop offset="0.5" stopColor="#5cd6ac" stopOpacity="0.28" />
            <stop offset="1" stopColor="#5cd6ac" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ── checkout window card ── */}
        <rect x={8} y={8} width={W - 16} height={H - 16} rx={16} fill="url(#tc_paper)" stroke={p.glassBorder} strokeWidth={1} />
        {/* title bar */}
        <line x1={8} y1={40} x2={W - 8} y2={40} stroke={p.mutedOnPaper} strokeWidth={0.8} strokeDasharray="2 4" opacity={0.5} />
        {[22, 34, 46].map((cx, i) => (
          <circle key={i} cx={cx} cy={24} r={4} fill={[p.coralDeep, p.gold, p.mint][i]} opacity={0.85} />
        ))}
        <text x={W / 2} y={28} textAnchor="middle" fill={p.mutedOnPaper} fontSize={11} fontFamily="var(--font-numeric)" letterSpacing="0.22em">🎟️ CHECKOUT</text>

        {/* ── the acted-out order: two tickets fan in ── */}
        <Ticket i={0} cx={150} cy={78} rot={-8} showTickets={showTickets} reduce={reduce} spring={spring} p={p} />
        <Ticket i={1} cx={196} cy={72} rot={7} showTickets={showTickets} reduce={reduce} spring={spring} p={p} />

        {/* ── price-formula strip (load-bearing math skeleton) ── */}
        <motion.line x1={fx - 8} y1={fy + 12} x2={W - 40} y2={fy + 12} stroke={p.mutedOnPaper} strokeWidth={0.8} strokeDasharray="2 4" opacity={0.4}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.6, ease: 'easeInOut' }} />
        <text x={44} y={fy} fill={p.mutedOnPaper} fontSize={11} fontFamily="var(--font-numeric)" letterSpacing="0.1em">price =</text>
        {/* "3" — highlights as the per-ticket price */}
        <motion.rect x={fx - 4} y={fy - 15} width={16} height={20} rx={4} fill={p.gold}
          initial={false} animate={{ opacity: highlightPer ? 0.32 : 0 }} transition={springT} />
        <text x={fx} y={fy} fill={p.inkOnPaper} fontSize={20} fontWeight={800} fontFamily="var(--font-numeric)">3</text>
        {/* the variable pill — flips x → 2 on substitution */}
        <rect x={pillX} y={fy - 17} width={pillW} height={24} rx={6} fill={substituted ? p.gold : 'none'} opacity={substituted ? 0.9 : 1}
          stroke={substituted ? p.goldDeep : p.mutedOnPaper} strokeWidth={1.4} strokeDasharray={substituted ? '0' : '3 3'} />
        <motion.text x={pillCX} y={fy} textAnchor="middle" fill={substituted ? p.inkOnPaper : p.goldDeep}
          fontSize={substituted ? 18 : 19} fontWeight={800} fontFamily="var(--font-numeric)"
          initial={false} animate={{ scale: substituted ? [1.3, 1] : 1 }} transition={springT}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>{substituted ? '2' : 'x'}</motion.text>
        {/* "+ 5" — highlights as the booking fee */}
        <motion.rect x={pillX + pillW + 18} y={fy - 15} width={22} height={20} rx={4} fill={p.mint}
          initial={false} animate={{ opacity: highlightFee ? 0.3 : 0 }} transition={springT} />
        <text x={pillX + pillW + 8} y={fy} fill={p.inkOnPaper} fontSize={20} fontWeight={800} fontFamily="var(--font-numeric)">+ 5</text>

        {/* ── receipt line items ── */}
        <text x={rowL} y={ticketRowY} fill={p.mutedOnPaper} fontSize={12} fontFamily="var(--font-numeric)">2 tickets × $3</text>
        <RowValue y={ticketRowY} show={showTicketSub} text="$6" rowR={rowR} p={p} springT={springT} />
        <text x={rowL} y={feeRowY} fill={p.mutedOnPaper} fontSize={12} fontFamily="var(--font-numeric)">booking fee</text>
        <RowValue y={feeRowY} show={showFee} text="$5" rowR={rowR} p={p} springT={springT} />

        {/* rule above the total */}
        <line x1={rowL} y1={totalRowY - 26} x2={rowR} y2={totalRowY - 26} stroke={p.mutedOnPaper} strokeWidth={1} opacity={0.5} />

        {/* ── TOTAL: the continuous count-up ── */}
        <text x={rowL} y={totalRowY} fill={p.inkOnPaper} fontSize={14} fontWeight={800} fontFamily="var(--font-numeric)" letterSpacing="0.12em">TOTAL</text>
        <motion.text x={rowR} y={totalRowY} textAnchor="end" fill={totalCol} fontSize={34} fontWeight={800} fontFamily="var(--font-numeric)"
          animate={{ scale: solved && !reduce ? [1, 1.12, 1] : 1 }} transition={{ duration: 0.5 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'right center' }}>{totalText}</motion.text>

        {/* paid shimmer sweep over the card once settled */}
        {solved && !reduce && (
          <motion.rect x={8} y={8} width={W - 16} height={H - 16} rx={16} fill="url(#tc_shim)"
            initial={{ opacity: 0, x: -W }} animate={{ opacity: [0, 1, 0], x: [-W, W] }} transition={{ duration: 0.9, ease: 'easeInOut' }} />
        )}
      </svg>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: p.mutedOnPaper }}>
        {solved ? 'total ✓' : substituted ? 'adding it up' : 'checkout'}
      </div>
    </div>
  )
}

// ── the PRICE BUILDER board — the walkthrough stage for `build` ────────────────
// Poses on the instrument the child will actually be graded on: the same two slots
// PartsBuilder gives them (▢x + ▢), with the source terms above as chips. Ticket
// pieces are gold, fees are mint, so "same kind joins same kind" is a colour you can
// see before it is a rule you are told. The slots read straight off `value`, so the
// walkthrough's steps fill them exactly as a child's taps would.
function TidyBoard({ P, task, value, stepIndex, ended }: {
  P: Palette; task: Task; value: V; stepIndex: number; ended: boolean
}) {
  const a = value.k === 'lin' ? value.a : 0
  const b = value.k === 'lin' ? value.b : 0
  const step = ended ? 99 : stepIndex
  const terms = task.srcTerms ?? []
  // Highlight exactly the kind the current step is TALKING about (step 3 names both).
  const litX = step === 1 || (step >= 3 && step <= 5)   // ticket pieces named / joined
  const litC = step === 2 || step === 3 || step >= 6    // fees named / joined
  const done = step >= 7

  const chip = (t: { v: number; isX: boolean }, i: number) => {
    const lit = t.isX ? litX : litC
    const col = t.isX ? P.gold : P.mint
    return (
      <div key={i} style={{
        padding: 'clamp(6px,0.9vh,10px) clamp(9px,1.2vw,14px)', borderRadius: 10,
        fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(15px,2vw,22px)',
        background: lit ? col : P.glass, color: lit ? P.nightBot : P.cream,
        border: `2px solid ${lit ? col : P.glassBorder}`,
        transform: lit ? 'translateY(-3px)' : 'none',
        transition: 'background 220ms, color 220ms, border-color 220ms, transform 220ms',
      }}>{t.isX ? `${t.v}x` : `${t.v}`}</div>
    )
  }

  const slot = (label: string, val: number, suffix: string, col: string, filled: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        minWidth: 'clamp(56px,7vw,84px)', padding: 'clamp(6px,1vh,10px) clamp(8px,1vw,12px)', borderRadius: 12,
        fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(20px,2.8vw,32px)', textAlign: 'center',
        background: filled ? col : 'transparent', color: filled ? P.nightBot : P.mutedOnPaper,
        border: `2px ${filled ? 'solid' : 'dashed'} ${filled ? col : P.glassBorder}`,
        transition: 'background 260ms, color 260ms, border-color 260ms',
      }}>{filled ? `${val}${suffix}` : '▢'}</div>
      <div style={{ fontSize: 'clamp(9px,1vw,12px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: P.creamSoft }}>{label}</div>
    </div>
  )

  return (
    <div style={{
      width: 'clamp(268px, 44vw, 380px)', boxSizing: 'border-box', borderRadius: 16,
      background: `linear-gradient(160deg, ${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`,
      boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 'clamp(10px,1.8vh,18px)', padding: 'clamp(14px,2.4vh,22px) clamp(12px,1.8vw,20px)',
    }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: P.creamSoft }}>price builder</div>

      <div style={{ display: 'flex', gap: 'clamp(5px,0.8vw,9px)', flexWrap: 'wrap', justifyContent: 'center' }}>{terms.map(chip)}</div>

      <div style={{ fontSize: 'clamp(10px,1.1vw,13px)', color: P.creamSoft, minHeight: '1.3em', textAlign: 'center' }}>
        {done ? 'same price, tidied' : litX && !litC ? 'ticket pieces — priced per ticket' : litC && !litX ? 'fees — paid once' : 'sort them by kind'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1.2vw,14px)' }}>
        {slot('per ticket', a, 'x', P.gold, a !== 0)}
        <div style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(18px,2.2vw,26px)', color: P.creamSoft }}>+</div>
        {slot('fee', b, '', P.mint, b !== 0)}
      </div>

      <div style={{
        fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(20px,2.8vw,32px)',
        color: done ? P.mint : 'transparent', transition: 'color 300ms', minHeight: '1.2em',
      }}>{lin(a, b)}</div>
    </div>
  )
}

export const CONFIG: GameConfig<V, Task> = {
  chapterId: 'expressionsVariables',
  title: 'TICKET CHECKOUT',
  ticketLabel: 'order',
  palette: P,
  motif: '🎟️',
  makeTask,
  // PER-TASK gating, the same rule the 12–14 band uses: a question shows the pad when
  // the instrument was never doing the solving. EVALUATE was compute-then-dial, so it
  // taps; SIMPLIFY keeps the builder because its answer is a coefficient AND a
  // constant — two decisions, not one number, and separating them IS the skill.
  answerPad: (t) => (t.pad ? numChoices(t.n ?? 0, t.pad) : []),
  initialValue: (t) => (t.kind === 'eval' ? { k: 'num', n: t.lo ?? 0 } : { k: 'lin', a: 0, b: 0 }),
  // REQUIRED: V is a tagged union, so a bare tapped number would never match
  // `v.k === 'num'` and every padded answer would grade wrong (it did, in prod,
  // on Leaderboard — a wrong answer still advances, so the flow looks fine).
  padValue: (n) => ({ k: 'num' as const, n }),
  grade: (t, v) => (t.kind === 'eval' ? v.k === 'num' && v.n === t.n : v.k === 'lin' && v.a === t.a && v.b === t.b),
  revealText: (t) => (t.kind === 'eval' ? `${t.n}` : lin(t.a ?? 0, t.b ?? 0)),
  glide: (t, _from, setValue, later) => later(() => setValue(t.kind === 'eval' ? { k: 'num', n: t.n ?? 0 } : { k: 'lin', a: t.a ?? 0, b: t.b ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'eval') {
      // Fallback only: every `eval` task ships with `pad`, so GameShell renders the
      // AnswerPad and never reaches this. Kept so a future eval task without `pad`
      // degrades to the dial rather than to nothing.
      const n = value.k === 'num' ? value.n : 0
      return <SlideValue P={palette} value={n} setValue={(x) => setValue({ k: 'num', n: x })} min={task.lo ?? -15} max={task.hi ?? 25}
        disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'num', n: x })} commitLabel="RING IT UP ✓" />
    }
    const a = value.k === 'lin' ? value.a : 0, b = value.k === 'lin' ? value.b : 0
    return <PartsBuilder P={palette} value={{ a, b }} setValue={(pr) => setValue({ k: 'lin', a: pr.a, b: pr.b })} min={-12} max={12}
      template={(x, y) => lin(x, y)} labels={['per ticket', 'fee']}
      disabled={disabled} reveal={reveal} onCommit={(pr) => onCommit({ k: 'lin', a: pr.a, b: pr.b })} commitLabel="SET THE PRICE ✓" />
  },
  // Branches by example: the checkout example poses on the ticket window, the tidying
  // example on the price builder itself — so the child watches the gesture they will
  // be graded on, not a different picture.
  TutorialScene: ({ palette, task, value, stepIndex, ended }) =>
    task.kind === 'build'
      ? <TidyBoard P={palette} task={task} value={value} stepIndex={stepIndex} ended={ended} />
      : <TicketScene palette={palette} value={value} stepIndex={stepIndex} ended={ended} />,
  start: {
    blurb: <><strong>You&apos;re checking out event tickets.</strong> The price is an <strong>expression</strong> — a booking fee plus a price per ticket. Work out the total, or tidy the formula.</>,
    ticket: { title: 'Ticket price', badge: '3x + 5', tone: 'a' },
    startLabel: 'Open the checkout →',
  },
  overview: {
    say: 'Here is the plan. A ticket price can be written as one expression with a letter in it, like three x plus five, where x is how many tickets. To get the total, we put the number of tickets in place of x and work it out. Let us do one together, nice and slow.',
    problem: <>What&apos;s the total for <strong>3x + 5</strong> when you buy <strong>x = 2</strong> tickets?</>,
    points: [
      <>The letter <strong>x</strong> stands for a number — here, how many tickets.</>,
      <>To evaluate, <strong>swap x for its value</strong>, then do the math.</>,
      <>3 × 2 is the ticket part; <strong>+ 5</strong> is the booking fee.</>,
      <>To tidy a long price, <strong>join the x-parts</strong>, then join the plain numbers.</>,
    ],
  },
  tutorial: [
    { task: DEMO_TASK, initial: { k: 'num', n: 0 }, hand: 'tap', steps: DEMO_STEPS },
    { task: DEMO_BUILD, initial: { k: 'lin', a: 0, b: 0 }, hand: 'tap', steps: DEMO_BUILD_STEPS },
  ],
  // No guided round: the walkthrough works BOTH examples (the checkout total, then
  // the price builder), so every gesture scored play grades has already been shown.
  sig: (t) => t.badge,
}

export default function TicketCheckout(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
