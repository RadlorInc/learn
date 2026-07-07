'use client'
/**
 * PowerUps — the Exponents & Polynomials chapter (15–16) as a PLAYABLE GAME.
 * World: game POWER-UPS ⚡ — upgrades that MULTIPLY your stat each level. A power
 * base^n is a stat cranked up level-by-level; the exponent laws, scientific
 * notation, and "evaluate a power / polynomial" all resolve to a single NUMBER
 * you dial in.
 *
 * NON-MCQ, two production interactions (variety within the chapter):
 *   • BUILD (crank) → CrankGear: build a power base^n by cranking the stat up one
 *                     level at a time (each turn ×base). The answer is the value.
 *   • DIAL  (dial)  → SlideValue: dial the RESULT — an exponent-law exponent, a
 *                     power-of-10 exponent (scientific notation), or a computed value.
 *
 * Exactly the 12–14 shape on GameShell: overview on the chalkboard + a code-drawn
 * stat-bar scene → baby-step walkthrough → guided → scored play. Reuses the math
 * of ExponentsPolynomialsTeenLesson (product/quotient/power rules, zero/neg/sci,
 * evaluate) with STRUCTURED generators exposing a numeric answer. Assets deferred;
 * the scene is code-drawn.
 */
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, CrankGear, SlideValue } from './parts/gameKit'
import { pow } from '@/features/chapters/lessons/ExponentsRootsTeenLesson'

const P: Palette = {
  nightTop: '#241238', nightBot: '#140a24',
  cream: '#f2ecfb', creamSoft: 'rgba(242,236,251,0.82)',
  inkOnPaper: '#241238', mutedOnPaper: '#7b6a95',
  gold: '#c48bff', goldDeep: '#7c3fe0',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(40,22,66,0.6)', glassBorder: 'rgba(242,236,251,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const sup = (n: number) => pow('', n)   // superscript-only string, e.g. "²"

// The answer is always a single NUMBER: either the value of a built power (crank),
// or a dialed exponent / value (dial).
type V = { k: 'pow'; n: number } | { k: 'num'; n: number }

interface Task extends BaseTask {
  kind: 'crank' | 'dial'
  n: number                 // the numeric answer (power value OR dialed exponent/value)
  base?: number             // crank: the ×base per level ; floor: 1
  lo?: number; hi?: number  // dial range
  format?: (n: number) => string  // dial readout formatter (e.g. scientific notation)
}

// ── crank: BUILD a power base^n (each level ×base) → the value ──────────────
function crankTask(base: number, exp: number, d: 1 | 2 | 3): Task {
  const val = Math.round(Math.pow(base, exp))
  return {
    kind: 'crank', title: 'Charge the power-up', badge: `${pow(base, exp)} = ?`, tone: d === 3 ? 'b' : 'a',
    prompt: `Crank the stat up ${exp} levels — each level multiplies by ${base}. Reach ${pow(base, exp)}.`,
    say: `Build the power-up ${base} to the ${exp}. Crank it up ${exp} levels — each turn multiplies your stat by ${base}.`,
    work: [`${pow(base, exp)} means ${base} multiplied ${exp} times: ${Array.from({ length: exp }, () => base).join(' × ')} = ${val}.`],
    n: val, base,
  }
}

// ── dial: exponent-law RESULTING EXPONENT (a number) ───────────────────────
function lawTask(d: 1 | 2 | 3): Task {
  const b = pick(['x', 'y', 'a', 'n'])
  const kind = rint(0, 2)
  if (kind === 0) {
    // product rule: b^m · b^n = b^(m+n)
    const m = rint(2, 5), n = rint(2, 5), ans = m + n
    return {
      kind: 'dial', title: 'Stack two power-ups', badge: `${pow(b, m)} · ${pow(b, n)} = ${b}▢`, tone: 'a',
      prompt: `Same base, multiplied — dial the new exponent for ${pow(b, m)} · ${pow(b, n)}.`,
      say: `Stack ${b} to the ${m}, times ${b} to the ${n}. Same base multiplied — dial the exponent that adds up.`,
      work: [`Same base multiplied → ADD the exponents: ${m} + ${n} = ${ans}. So ${b} to the ${ans}.`],
      n: ans, lo: 0, hi: 14,
    }
  }
  if (kind === 1) {
    // quotient rule: b^m / b^n = b^(m-n)
    const m = rint(5, 9), n = rint(2, m - 1), ans = m - n
    return {
      kind: 'dial', title: 'Spend a power-up', badge: `${pow(b, m)} ÷ ${pow(b, n)} = ${b}▢`, tone: 'a',
      prompt: `Same base, divided — dial the new exponent for ${pow(b, m)} ÷ ${pow(b, n)}.`,
      say: `${b} to the ${m}, divided by ${b} to the ${n}. Same base divided — dial the exponent that subtracts.`,
      work: [`Same base divided → SUBTRACT the exponents: ${m} − ${n} = ${ans}. So ${b} to the ${ans}.`],
      n: ans, lo: 0, hi: 12,
    }
  }
  // power of a power: (b^m)^n = b^(mn)
  const m = rint(2, 4), n = rint(2, 4), ans = m * n
  return {
    kind: 'dial', title: 'Power of a power-up', badge: `(${pow(b, m)})${sup(n)} = ${b}▢`, tone: 'a',
    prompt: `A power raised to a power — dial the new exponent for (${pow(b, m)})${sup(n)}.`,
    say: `${b} to the ${m}, all raised to the ${n}. A power of a power — dial the exponent that multiplies.`,
    work: [`Power of a power → MULTIPLY the exponents: ${m} × ${n} = ${ans}. So ${b} to the ${ans}.`],
    n: ans, lo: 0, hi: 18,
  }
}

// ── dial (L2): zero / negative exponents + scientific notation ─────────────
function negSciTask(d: 1 | 2 | 3): Task {
  const kind = rint(0, 2)
  if (kind === 0) {
    // zero exponent → value is 1
    const b = pick([3, 5, 7, 9, 12])
    return {
      kind: 'dial', title: 'The dud power-up', badge: `${pow(b, 0)} = ?`, tone: 'a',
      prompt: `A power-up at level zero — dial its value, ${pow(b, 0)}.`,
      say: `A power-up at level zero. What is ${b} to the power zero? Dial its value.`,
      work: [`Any non-zero base to the power 0 is 1 — the exponents cancel, leaving 1.`],
      n: 1, lo: 0, hi: 6,
    }
  }
  if (kind === 1) {
    // negative exponent → dial the (negative) exponent of the reciprocal power 1/b^k
    const b = pick([2, 3, 5]), k = rint(2, 4)
    return {
      kind: 'dial', title: 'Reverse the power-up', badge: `${pow(b, -k)} = 1 / ${b}▢`, tone: d === 3 ? 'b' : 'a',
      prompt: `Rewrite ${pow(b, -k)} as one over a power — dial the exponent on the bottom.`,
      say: `${b} to the negative ${k}. Rewrite it as one over ${b} to a power — dial the exponent on the bottom.`,
      work: [`A negative exponent means reciprocal: ${b} to the negative ${k} = 1 over ${b} to the ${k}. Bottom exponent ${k}.`],
      n: k, lo: 0, hi: 8,
    }
  }
  // scientific notation → dial the power of 10
  const lead = rint(1, 9), dec = rint(1, 9), zeros = rint(2, 5)
  const plain = `${lead}${dec}${'0'.repeat(zeros - 1)}0`
  const exp = zeros + 1
  const disp = Number(plain).toLocaleString('en-US')
  return {
    kind: 'dial', title: 'Big-number power-up', badge: `${disp} = ${lead}.${dec} × 10▢`, tone: d === 3 ? 'b' : 'a',
    prompt: `Write ${disp} as ${lead}.${dec} × 10 — dial the power of ten.`,
    say: `Write ${disp} in scientific notation, ${lead} point ${dec} times ten to a power. Dial the power of ten.`,
    work: [`Move the point after the first digit: ${lead}.${dec}. It moved ${exp} places, so × 10 to the ${exp}. Power ${exp}.`],
    n: exp, lo: 0, hi: 9,
  }
}

// ── dial (L3): EVALUATE a power / simple polynomial value at a number ───────
function evalTask(d: 1 | 2 | 3): Task {
  if (Math.random() < 0.5) {
    // evaluate a power base^exp
    const base = pick([2, 3, 4, 5, 6, 10]), exp = rint(2, 3)
    const val = Math.round(Math.pow(base, exp))
    return {
      kind: 'dial', title: 'Read the stat', badge: `${pow(base, exp)} = ?`, tone: 'b',
      prompt: `Work out ${pow(base, exp)} and dial the value.`,
      say: `Work out ${base} to the ${exp}. Dial the stat value.`,
      work: [`${pow(base, exp)} = ${Array.from({ length: exp }, () => base).join(' × ')} = ${val}.`],
      n: val, lo: 0, hi: Math.max(50, val + 20),
    }
  }
  // evaluate a simple polynomial a·x² + b·x + c at a number x
  const a = rint(1, 3), b = rint(1, 4), c = rint(0, 6), x = rint(2, 4)
  const val = a * x * x + b * x + c
  const expr = `${a === 1 ? '' : a}x${sup(2)} + ${b}x${c ? ` + ${c}` : ''}`
  return {
    kind: 'dial', title: 'Score formula', badge: `${expr},  x = ${x}`, tone: 'b',
    prompt: `Your score is ${expr}. Dial it for x = ${x}.`,
    say: `Your score formula is ${a === 1 ? '' : a} x squared plus ${b} x plus ${c}. Dial the score when x is ${x}.`,
    work: [`Substitute x = ${x}: ${a}(${x})² + ${b}(${x}) + ${c} = ${a * x * x} + ${b * x} + ${c} = ${val}.`],
    n: val, lo: 0, hi: Math.max(60, val + 20),
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) {
    // L1 — product/quotient/power laws (dial the exponent) + build a power (crank)
    if (Math.random() < 0.4) {
      const base = pick([2, 3, 4, 5]), exp = rint(2, 3)
      return crankTask(base, exp, d)
    }
    return lawTask(d)
  }
  if (d === 2) return negSciTask(d)
  return evalTask(d)
}

// ── fixed worked example (walkthrough) — BUILD 2⁴ on the crank ──────────────
const DEMO_TASK: Task = crankTask(2, 4, 1)   // 2⁴ = 16
// Ten BABY steps: read the exponent, then crank up one level at a time (each a
// visible ×2 leap on the meter), count the four multiplies, and name it as 2⁴.
// One idea + one chalkboard line + one `value` beat per step; the stat value in
// `value.n` (1→2→4→8→16) drives the scene's meter/ladder/readout exactly.
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "Here's a power-up: two to the fourth. Let's charge it up together, nice and slow.", value: { k: 'pow', n: 1 }, board: '2⁴ = ?', hand: 'crank' },
  { say: 'That little four is the exponent. It tells you to multiply by two, four separate times.', value: { k: 'pow', n: 1 }, board: 'the 4 = multiply ×2, four times', hand: 'crank' },
  { say: 'Every stat starts at one, at level zero — before any power-up.', value: { k: 'pow', n: 1 }, board: 'every stat starts at 1', hand: 'crank' },
  { say: 'Crank up one level. One times two is two. The meter leaps.', value: { k: 'pow', n: 2 }, board: 'level 1:  1 × 2 = 2', hand: 'crank' },
  { say: 'Crank again, level two. Two times two is four — it doubled once more.', value: { k: 'pow', n: 4 }, board: 'level 2:  2 × 2 = 4', hand: 'crank' },
  { say: 'Level three. Four times two is eight — doubling gets big fast.', value: { k: 'pow', n: 8 }, board: 'level 3:  4 × 2 = 8', hand: 'crank' },
  { say: 'Level four, the last one. Eight times two is sixteen. The meter is full.', value: { k: 'pow', n: 16 }, board: 'level 4:  8 × 2 = 16', hand: 'crank' },
  { say: 'Look at what we did — we multiplied by two, four times over: two times two times two times two.', value: { k: 'pow', n: 16 }, board: 'that is four 2s: 2 × 2 × 2 × 2', hand: 'crank' },
  { say: 'And multiplying two by itself four times is exactly what two to the fourth means.', value: { k: 'pow', n: 16 }, board: '2 × 2 × 2 × 2 = 2⁴', hand: 'crank' },
  { say: 'So two to the fourth is sixteen. The stat is fully charged.', value: { k: 'pow', n: 16 }, board: '2⁴ = 16 · fully charged', hand: 'crank' },
]

const PU_BASE = 2
const PU_TARGET = 16
// the multiply ladder: each level's cumulative stat value (1 → 2 → 4 → 8 → 16)
const PU_LADDER = [1, 2, 4, 8, 16]
// level (# of ×base applied) implied by the current stat value
const puLevel = (v: number) => Math.max(0, Math.round(Math.log(Math.max(v, 1)) / Math.log(PU_BASE)))

/** Hand-authored SVG arcade upgrade-bench (storyboard: docs/storyboards/power-ups.md).
 *  A stylised charge tower + level ladder that ACTS OUT repeated multiplication:
 *  the power meter's fill is the stat (height = cur / 16, so each level visibly
 *  DOUBLES / leaps), a "×2" chip springs at its top on each level, the level
 *  tiles 1·2·4·8·16 light one at a time with ×2 connectors drawn between them,
 *  and the exponent readout builds 2 × 2 × … → 2ⁿ. Everything sits on the exact
 *  math mapping (fill = cur/16, level = log₂ cur); only the *stage* is art.
 *  Continuous motion: the meter fill rides a spring-driven useMotionValue so it
 *  flows and overshoots between beats. useReducedMotion → end state, no leaps. */
function StatScene({ palette, value, stepIndex, frameCount, ended }: {
  palette: Palette; value: V; stepIndex: number; frameCount: number; ended: boolean
}) {
  const p = palette
  const reduce = useReducedMotion()
  const cur = value.n
  const level = puLevel(cur)                                       // 0..4
  const solved = ended || stepIndex >= frameCount - 1 || cur >= PU_TARGET
  const climbing = stepIndex > 0 && !solved                        // a ×2 just landed
  const col = solved ? p.mint : p.goldDeep
  const glow = solved ? p.mint : p.gold

  // ── geometry ──
  const W = 340, H = 300
  const topY = 54, baseY = 258, maxH = baseY - topY                // meter travel = 204
  const meterX = 40, meterW = 62
  const ladderX = 254, tileW = 62, tileH = 26
  const targetFrac = Math.min(1, Math.max(cur / PU_TARGET, 0.055)) // fill = cur/16 (doubles each level)

  // ── continuous, spring-driven meter fill (the "leap") ──
  const mFrac = useMotionValue(reduce ? targetFrac : 0.055)
  useEffect(() => {
    const controls = animate(mFrac, targetFrac, reduce ? { duration: 0 } : { type: 'spring', stiffness: 130, damping: 13 })
    return () => controls.stop()
  }, [targetFrac, reduce, mFrac])
  const barY = useTransform(mFrac, (f) => topY + (1 - f) * maxH)
  const barH = useTransform(mFrac, (f) => f * maxH)
  const chipY = useTransform(mFrac, (f) => topY + (1 - f) * maxH - 15)

  // ladder tiles evenly spaced (levels 0..4 — you level up one at a time)
  const nodes = PU_LADDER.map((val, i) => ({ val, i, y: baseY - (i / 4) * maxH }))
  const spring = { type: 'spring' as const, stiffness: 300, damping: 18 }
  const chain = level <= 0 ? '1' : Array.from({ length: level }, () => String(PU_BASE)).join(' × ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="clamp(230px, 32vw, 360px)" height="auto" style={{ borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
        <defs>
          <linearGradient id="pu_sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a163f" />
            <stop offset="0.6" stopColor="#1b0f2c" />
            <stop offset="1" stopColor="#120a20" />
          </linearGradient>
          <radialGradient id="pu_spot" cx="0.5" cy="0.1" r="0.85">
            <stop offset="0" stopColor="#e6ccff" stopOpacity="0.22" />
            <stop offset="0.5" stopColor={p.gold} stopOpacity="0.06" />
            <stop offset="1" stopColor={p.gold} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pu_fill" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={col} stopOpacity="0.85" />
            <stop offset="1" stopColor={col} />
          </linearGradient>
        </defs>

        {/* ── arcade backdrop ── */}
        <rect x={0} y={0} width={W} height={H} fill="url(#pu_sky)" />
        {/* faint dot grid + scanline sheen, high up */}
        <g opacity={0.5}>
          {Array.from({ length: 6 }).map((_, r) => (
            <g key={`sc${r}`}>
              {Array.from({ length: 18 }).map((_, i) => (
                <circle key={i} cx={12 + i * (W / 17)} cy={10 + r * 7} r={0.9} fill={p.cream} opacity={0.12} />
              ))}
            </g>
          ))}
        </g>
        <rect x={0} y={0} width={W} height={H} fill="url(#pu_spot)" />
        {/* bench floor line */}
        <motion.line x1={16} y1={baseY} x2={W - 16} y2={baseY} stroke={p.creamSoft} strokeWidth={1.6}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.7, ease: 'easeInOut' }} />

        {/* ── exponent readout (top): 2ⁿ = value ── */}
        <motion.g key={`hd${cur}`} initial={reduce ? false : { scale: 0.8, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <text x={W / 2} y={34} textAnchor="middle" fill={p.cream} fontSize={26} fontFamily="var(--font-numeric)" fontWeight={800}>
            {pow(PU_BASE, level)} <tspan fill={p.mutedOnPaper}>=</tspan> <tspan fill={col}>{cur}</tspan>
          </text>
        </motion.g>

        {/* ── charge tower / power meter (left) ── */}
        {/* track */}
        <rect x={meterX} y={topY} width={meterW} height={maxH} rx={12} fill={p.glass} stroke={p.glassBorder} strokeWidth={1} />
        {/* notch ticks at each doubling (fill = value/16) */}
        {PU_LADDER.slice(1).map((v) => (
          <line key={`nt${v}`} x1={meterX} y1={baseY - (v / PU_TARGET) * maxH} x2={meterX + meterW} y2={baseY - (v / PU_TARGET) * maxH} stroke={p.glassBorder} strokeWidth={1} opacity={0.55} strokeDasharray="2 3" />
        ))}
        {/* the spring-driven fill — leaps taller ×2 each level */}
        <motion.rect x={meterX + 3} width={meterW - 6} rx={9} fill="url(#pu_fill)"
          style={{ y: barY, height: barH }} />
        {/* fill top sheen */}
        <motion.rect x={meterX + 3} width={meterW - 6} height={3} rx={1.5} fill={p.cream} opacity={0.5} style={{ y: barY }} />
        {/* base label */}
        <text x={meterX + meterW / 2} y={baseY + 15} textAnchor="middle" fill={p.mutedOnPaper} fontSize={10} fontFamily="var(--font-numeric)" letterSpacing="0.12em">×{PU_BASE}</text>

        {/* ── the "×2" multiplier chip riding the top of the meter as it leaps ── */}
        <motion.g style={{ y: chipY }}>
          <motion.g initial={false} animate={{ opacity: climbing ? 1 : 0, scale: climbing ? 1 : 0.5 }} transition={reduce ? { duration: 0 } : { ...spring, stiffness: 420 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <rect x={meterX + meterW + 4} y={0} width={34} height={22} rx={11} fill={p.goldDeep} stroke={glow} strokeWidth={1} />
            <text x={meterX + meterW + 4 + 17} y={15} textAnchor="middle" fill={p.cream} fontSize={13} fontFamily="var(--font-numeric)" fontWeight={800}>×{PU_BASE}</text>
          </motion.g>
        </motion.g>

        {/* ── level ladder (right): tiles 1·2·4·8·16 with ×2 connectors ── */}
        {nodes.slice(0, -1).map((nd, i) => {
          const next = nodes[i + 1]
          const on = level >= i + 1
          return (
            <g key={`cn${i}`}>
              <motion.line x1={ladderX} y1={nd.y - tileH / 2} x2={ladderX} y2={next.y + tileH / 2}
                stroke={on ? glow : p.glassBorder} strokeWidth={on ? 2 : 1} opacity={on ? 0.9 : 0.4}
                initial={{ pathLength: 0 }} animate={{ pathLength: on ? 1 : 0.001 }} transition={reduce ? { duration: 0 } : { duration: 0.4, ease: 'easeInOut' }} />
              <text x={ladderX + 10} y={(nd.y + next.y) / 2 + 4} fill={on ? glow : p.mutedOnPaper} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={700} opacity={on ? 1 : 0.5}>×{PU_BASE}</text>
            </g>
          )
        })}
        {nodes.map((nd) => {
          const lit = level >= nd.i
          const isCur = nd.i === level
          return (
            <motion.g key={`tile${nd.i}`} initial={false}
              animate={{ scale: isCur && climbing && !reduce ? [1, 1.16, 1] : 1 }} transition={reduce ? { duration: 0 } : spring}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
              <rect x={ladderX - tileW / 2} y={nd.y - tileH / 2} width={tileW} height={tileH} rx={7}
                fill={lit ? p.glass : 'transparent'} stroke={lit ? (isCur ? glow : col) : p.glassBorder} strokeWidth={lit && isCur ? 2 : 1}
                opacity={lit ? 1 : 0.45} style={lit && isCur ? { filter: `drop-shadow(0 0 6px ${glow})` } : undefined} />
              <text x={ladderX} y={nd.y + 5} textAnchor="middle" fill={lit ? p.cream : p.mutedOnPaper} fontSize={14} fontFamily="var(--font-numeric)" fontWeight={800} style={{ fontVariantNumeric: 'tabular-nums' }}>{nd.val}</text>
              <text x={ladderX - tileW / 2 - 8} y={nd.y + 4} textAnchor="end" fill={p.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)" opacity={0.7}>L{nd.i}</text>
            </motion.g>
          )
        })}
      </svg>

      {/* multiply chain (builds one ×2 factor per level) + level caption */}
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(13px, 1.5vw, 18px)', fontWeight: 700, color: p.mutedOnPaper, minHeight: '1.3em', letterSpacing: '0.02em', textAlign: 'center' }}>
        {chain}<span style={{ color: col }}> = {cur}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: solved ? p.mint : p.mutedOnPaper }}>
        {solved ? '2⁴ = 16 · charged ✓' : `level ${level} of 4 · ×${PU_BASE} each`}
      </div>
    </div>
  )
}

const numOf = (v: V) => v.n

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'exponentsPolynomials',
  title: 'POWER-UPS',
  ticketLabel: 'upgrade log',
  palette: P,
  motif: '⚡',
  makeTask,
  initialValue: (t) => (t.kind === 'crank' ? { k: 'pow', n: 1 } : { k: 'num', n: t.lo ?? 0 }),
  grade: (t, v) => numOf(v) === t.n,
  revealText: (t) => `${t.n}`,
  glide: (t, _from, setValue, later) =>
    later(() => setValue(t.kind === 'crank' ? { k: 'pow', n: t.n } : { k: 'num', n: t.n }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'crank') {
      const n = value.k === 'pow' ? value.n : 1
      return (
        <CrankGear P={palette} value={n} setValue={(x) => setValue({ k: 'pow', n: x })} base={task.base ?? 2}
          disabled={disabled} reveal={reveal} floor={1}
          onCommit={(x) => onCommit({ k: 'pow', n: x })} commitLabel="CHARGE IT ⚡" />
      )
    }
    const n = value.k === 'num' ? value.n : 0
    return (
      <SlideValue P={palette} value={n} setValue={(x) => setValue({ k: 'num', n: x })} min={task.lo ?? 0} max={task.hi ?? 20}
        disabled={disabled} reveal={reveal} format={task.format}
        onCommit={(x) => onCommit({ k: 'num', n: x })} commitLabel="SET IT ✓" />
    )
  },
  TutorialScene: ({ palette, value, stepIndex, frameCount, ended }) => (
    <StatScene palette={palette} value={value} stepIndex={stepIndex} frameCount={frameCount} ended={ended} />
  ),
  start: {
    blurb: <><strong>You&apos;re charging game power-ups.</strong> Each level <strong>multiplies</strong> your stat — that&apos;s what an <strong>exponent</strong> is. Build a power on the crank, or dial the result of an exponent rule.</>,
    ticket: { title: 'Power-up', badge: '2⁴', tone: 'a' },
    startLabel: 'Open the upgrade bench →',
  },
  overview: {
    say: 'Here is the plan. A power-up like two to the fourth multiplies your stat by two, once for each level — four levels, so two times two times two times two. Building a power means cranking it up level by level. And when you stack or spend power-ups, the exponent laws tell you the new level. Let us build one together, nice and slow.',
    problem: <>Build the power-up <strong>2⁴</strong> — crank your stat up 4 levels, ×2 each time.</>,
    points: [
      <>An <strong>exponent</strong> is how many times you multiply by the base.</>,
      <>Building <strong>base<sup>n</sup></strong> = crank <strong>n</strong> levels, ×base each level.</>,
      <>Stacking powers <strong>adds</strong> exponents; spending them <strong>subtracts</strong>.</>,
    ],
  },
  tutorial: { task: DEMO_TASK, initial: { k: 'pow', n: 1 }, hand: 'crank', steps: DEMO_STEPS },
  guided: {
    task: crankTask(3, 2, 1), // build 3² = 9
    coach: 'Your turn — I will help. Build this power-up: crank the stat up two levels, times three each level.',
    hand: 'crank',
  },
  sig: (t) => t.badge,
}

export default function PowerUps(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
