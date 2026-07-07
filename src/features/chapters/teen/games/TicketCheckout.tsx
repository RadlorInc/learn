'use client'
/**
 * TicketCheckout — the Expressions & Variables chapter (15–16) as a PLAYABLE GAME.
 * World: buying event tickets online, where the price is an EXPRESSION with a
 * variable (booking fee + price × tickets).
 *
 * NON-MCQ, two production interactions (variety within the chapter):
 *   • EVALUATE  → a number DIAL (SlideValue): produce the total.
 *   • SIMPLIFY  → an EXPRESSION BUILDER (two steppers → ▢x + ▢): construct the
 *                 tidied form.
 * Exactly the 12–14 shape on GameShell: overview on the chalkboard + a code-drawn
 * ticket scene → baby-step walkthrough → guided → scored play. Illustration assets
 * deferred; the scene is code-drawn.
 */
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SlideValue, PartsBuilder, type Parts } from './parts/gameKit'

const P: Palette = {
  nightTop: '#12233b', nightBot: '#0b1626',
  cream: '#eef4fb', creamSoft: 'rgba(238,244,251,0.82)',
  inkOnPaper: '#1a2740', mutedOnPaper: '#6b7a95',
  gold: '#ffcf5c', goldDeep: '#d69a1e',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(20,40,66,0.6)', glassBorder: 'rgba(238,244,251,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const rnz = (lo: number, hi: number) => { let n = rint(lo, hi); while (n === 0) n = rint(lo, hi); return n }
/** Format "ax + b" / "ax − b" (coefficient 1/−1 hide the digit). */
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
  a?: number; b?: number                     // build
}

function evalTask(d: 1 | 2 | 3): Task {
  const a = rint(2, 5), b = rnz(-6, 8), v = rint(-4, 5)
  const n = a * v + b
  return {
    kind: 'eval', title: 'Ticket order', badge: `${lin(a, b)},  x = ${v < 0 ? `(${v})` : v}`, tone: 'a',
    prompt: `Dial the total for ${lin(a, b)} when x = ${v}.`,
    say: `Work out ${a}x ${b < 0 ? 'minus' : 'plus'} ${Math.abs(b)} when x is ${spoken(v)}. Dial the total.`,
    work: [`Substitute x = ${v}: ${a}(${v}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${a * v} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${n}.`],
    n, lo: Math.min(-15, n - 10), hi: Math.max(25, n + 10),
    a, b,
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
  if (d === 1) return Math.random() < 0.5 ? evalTask(d) : buildTask(1)
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
  { say: "So the whole order comes to eleven dollars. On the dial, that's eleven.", value: { k: 'num', n: 11 }, board: 'total = $11' },
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
  const Ticket = ({ i, cx, cy, rot }: { i: number; cx: number; cy: number; rot: number }) => (
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

  // ── a receipt line-item value that springs in when its beat arrives ──
  const RowValue = ({ y, show, text, mint }: { y: number; show: boolean; text: string; mint?: boolean }) => (
    <motion.text
      x={rowR} y={y} textAnchor="end" fill={mint ? '#1f9e73' : p.inkOnPaper}
      fontSize={16} fontWeight={800} fontFamily="var(--font-numeric)"
      initial={false} animate={{ opacity: show ? 1 : 0.28, scale: show ? 1 : 0.7 }} transition={springT}
      style={{ transformBox: 'fill-box', transformOrigin: 'right center' }}
    >{show ? text : '—'}</motion.text>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="clamp(230px, 32vw, 348px)" height="auto"
        style={{ borderRadius: 14, filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.42))', display: 'block', transform: 'rotate(-0.8deg)' }}>
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
        <Ticket i={0} cx={150} cy={78} rot={-8} />
        <Ticket i={1} cx={196} cy={72} rot={7} />

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
        <RowValue y={ticketRowY} show={showTicketSub} text="$6" />
        <text x={rowL} y={feeRowY} fill={p.mutedOnPaper} fontSize={12} fontFamily="var(--font-numeric)">booking fee</text>
        <RowValue y={feeRowY} show={showFee} text="$5" />

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

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'expressionsVariables',
  title: 'TICKET CHECKOUT',
  ticketLabel: 'order',
  palette: P,
  motif: '🎟️',
  makeTask,
  initialValue: (t) => (t.kind === 'eval' ? { k: 'num', n: t.lo ?? 0 } : { k: 'lin', a: 0, b: 0 }),
  grade: (t, v) => (t.kind === 'eval' ? v.k === 'num' && v.n === t.n : v.k === 'lin' && v.a === t.a && v.b === t.b),
  revealText: (t) => (t.kind === 'eval' ? `${t.n}` : lin(t.a ?? 0, t.b ?? 0)),
  glide: (t, _from, setValue, later) => later(() => setValue(t.kind === 'eval' ? { k: 'num', n: t.n ?? 0 } : { k: 'lin', a: t.a ?? 0, b: t.b ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'eval') {
      const n = value.k === 'num' ? value.n : 0
      return <SlideValue P={palette} value={n} setValue={(x) => setValue({ k: 'num', n: x })} min={task.lo ?? -15} max={task.hi ?? 25}
        disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'num', n: x })} commitLabel="RING IT UP ✓" />
    }
    const a = value.k === 'lin' ? value.a : 0, b = value.k === 'lin' ? value.b : 0
    return <PartsBuilder P={palette} value={{ a, b }} setValue={(pr) => setValue({ k: 'lin', a: pr.a, b: pr.b })} min={-12} max={12}
      template={(x, y) => lin(x, y)} labels={['per ticket', 'fee']}
      disabled={disabled} reveal={reveal} onCommit={(pr) => onCommit({ k: 'lin', a: pr.a, b: pr.b })} commitLabel="SET THE PRICE ✓" />
  },
  TutorialScene: ({ palette, value, stepIndex, ended }) => (
    <TicketScene palette={palette} value={value} stepIndex={stepIndex} ended={ended} />
  ),
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
    ],
  },
  tutorial: { task: DEMO_TASK, initial: { k: 'num', n: 0 }, hand: 'drag', steps: DEMO_STEPS },
  guided: { task: { kind: 'eval', title: 'Ticket order', badge: '2x + 4,  x = 3', tone: 'a', prompt: '', say: 'Work out two x plus four when x is three. Dial the total.', work: ['Substitute x = 3: 2(3) + 4 = 6 + 4 = 10.'], n: 10, lo: 0, hi: 20, a: 2, b: 4 }, coach: 'Your turn — I will help. Dial this total.', hand: 'drag' },
  sig: (t) => t.badge,
}

export default function TicketCheckout(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
