'use client'
/**
 * ScreenDistance — the Radicals & the Pythagorean Theorem chapter (15–16) as a
 * PLAYABLE GAME. World: measuring a screen (or map) DIAGONAL — the slanted
 * corner-to-corner distance across a phone/TV screen, or the straight-line hop
 * between two points on a game map, found with the Pythagorean theorem and square
 * roots.
 *
 * NON-MCQ, two production interactions (variety within the chapter):
 *   • SIDE     → a number DIAL (SlideValue): dial a whole-number side length — a
 *                perfect-square root or an integer Pythagorean hypotenuse/leg.
 *   • RADICAL  → a RADICAL BUILDER (PartsBuilder, two steppers → a√b): construct a
 *                simplified radical / like-radical sum.
 * Exactly the 12–14 shape on GameShell: overview on the chalkboard + a code-drawn
 * right-triangle / screen scene whose diagonal draws in as a²+b²=c² is computed →
 * baby-step walkthrough → guided → scored play. Illustration assets deferred; the
 * scene is code-drawn (pure CSS/SVG).
 */
import { useEffect, useState } from 'react'
import { motion, useMotionValue, animate, useReducedMotion, useMotionValueEvent } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SlideValue, PartsBuilder } from './parts/gameKit'

const P: Palette = {
  nightTop: '#101c33', nightBot: '#0a1322',
  cream: '#eaf1fb', creamSoft: 'rgba(234,241,251,0.82)',
  inkOnPaper: '#16233d', mutedOnPaper: '#6b7a95',
  gold: '#6ad0ff', goldDeep: '#2b8fd6',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(18,34,58,0.6)', glassBorder: 'rgba(234,241,251,0.2)',
}

const RAD = '√'
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

const PERFECT_ROOTS: Array<[number, number]> = [
  [9, 3], [16, 4], [25, 5], [36, 6], [49, 7], [64, 8], [81, 9], [100, 10],
  [121, 11], [144, 12], [169, 13],
]
// Pythagorean triples → integer hypotenuse / leg.
const TRIPLES: Array<[number, number, number]> = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [20, 21, 29],
]

/** Largest square factor of n (for simplifying √n → coeff√rad). */
function simplifyRadical(n: number): { coeff: number; rad: number } {
  let coeff = 1, rad = n
  for (let k = 12; k >= 2; k--) { const sq = k * k; if (rad % sq === 0) { coeff *= k; rad = rad / sq } }
  return { coeff, rad }
}
/** Pretty radical string, e.g. "2√3", "√5", "6". */
function radStr(a: number, b: number): string {
  if (b === 1) return String(a)
  if (a === 1) return `${RAD}${b}`
  return `${a}${RAD}${b}`
}

// The answer is a whole-number side length (dial) or a simplified radical a√b (build).
type V = { k: 'len'; n: number } | { k: 'rad'; a: number; b: number }
interface Task extends BaseTask {
  kind: 'side' | 'radical'
  n?: number; lo?: number; hi?: number      // side (SlideValue)
  a?: number; b?: number                     // radical (PartsBuilder: coefficient, radicand)
}

// ── L1 — perfect-square root OR integer-hypotenuse triple → SlideValue ─────────
function sideTask(d: 1 | 2 | 3): Task {
  // hypotenuse from a triple, or a bare perfect-square root
  if (Math.random() < 0.5) {
    const [a, b, c] = pick(TRIPLES)
    return {
      kind: 'side', title: 'Screen diagonal', badge: `${a}² + ${b}² = c²`, tone: d === 3 ? 'b' : 'a',
      prompt: `A screen is ${a} by ${b}. Dial the diagonal.`,
      say: `A screen measures ${a} by ${b}. Dial its diagonal — the slanted corner-to-corner distance.`,
      work: [`c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, so c = ${RAD}${c * c} = ${c}.`],
      n: c, lo: 0, hi: Math.max(20, c + 8),
    }
  }
  const [n, r] = pick(PERFECT_ROOTS)
  return {
    kind: 'side', title: 'Square panel', badge: `side = ${RAD}${n}`, tone: 'a',
    prompt: `A square panel has area ${n}. Dial its side length.`,
    say: `A square screen has area ${n}. Dial its side length — the square root of ${n}.`,
    work: [`${r} × ${r} = ${n}, so ${RAD}${n} = ${r}.`],
    n: r, lo: 0, hi: Math.max(18, r + 6),
  }
}

// ── L2 — simplify a radical, or add LIKE radicals → PartsBuilder (a√b) ─────────
function radicalTask(d: 1 | 2 | 3): Task {
  if (Math.random() < 0.5) {
    // simplify √n → coeff√rad
    const candidates = [8, 12, 18, 20, 24, 27, 32, 45, 48, 50, 72, 75, 98]
    const n = pick(candidates)
    const { coeff, rad } = simplifyRadical(n)
    return {
      kind: 'radical', title: 'Map hop', badge: `${RAD}${n}`, tone: d === 3 ? 'b' : 'a',
      prompt: `Simplify ${RAD}${n} into a√b form.`,
      say: `The straight-line map distance is the square root of ${n}. Simplify it to a root b form.`,
      work: [`${n} = ${coeff * coeff} × ${rad}, and ${RAD}${coeff * coeff} = ${coeff}, so ${RAD}${n} = ${radStr(coeff, rad)}.`],
      a: coeff, b: rad,
    }
  }
  // add LIKE radicals p√r + q√r = (p+q)√r
  const r = pick([2, 3, 5, 6, 7])
  const p = rint(2, 5), q = rint(1, 4)
  const sum = p + q
  return {
    kind: 'radical', title: 'Combine distances', badge: `${p}${RAD}${r} + ${q}${RAD}${r}`, tone: 'a',
    prompt: `Add the like radicals ${p}${RAD}${r} + ${q}${RAD}${r}.`,
    say: `Add ${p} root ${r} plus ${q} root ${r}. They are like radicals, so combine them.`,
    work: [`${p}${RAD}${r} and ${q}${RAD}${r} are like radicals: add the numbers in front, ${p} + ${q} = ${sum}, giving ${radStr(sum, r)}.`],
    a: sum, b: r,
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return sideTask(1)
  if (d === 2) return radicalTask(2)
  // L3 — a Pythagorean side that stays integer, OR a simplified radical
  return Math.random() < 0.5 ? sideTask(3) : radicalTask(3)
}

// ── fixed worked example (walkthrough) — the 3-4-5 screen diagonal ─────────────
const DEMO_TASK: Task = {
  kind: 'side', title: 'Screen diagonal', badge: '3² + 4² = c²', tone: 'a',
  prompt: '', say: '', work: ['c² = 3² + 4² = 9 + 16 = 25, so c = √25 = 5.'],
  n: 5, lo: 0, hi: 14,
}
// The walkthrough's `stepIndex` drives the scene's PHASE (one reveal per beat) and
// its per-step `value.n` doubles as the diagonal count-up cue: n stays 0 while we
// square-and-add, then climbs to 5 as the diagonal sweeps across in the last beats.
// Twelve BABY steps — one idea + one chalkboard line + one scene beat each:
//   0 screen+legs · 1 right-angle/hypotenuse · 2 theorem · 3 square side 3 ·
//   4 fill 9 tiles · 5 square side 4 · 6 fill 16 tiles · 7 add · 8 c²=25 ·
//   9 square-root · 10 diagonal SWEEPS + length counts up · 11 solved.
const DEMO_STEPS: DemoStep<V>[] = [
  { say: "Here's a phone screen — three across and four down. We want the diagonal: the slanted corner-to-corner distance.", value: { k: 'len', n: 0 }, board: 'screen: 3 wide, 4 tall' },
  { say: 'That diagonal is the hypotenuse of a right triangle — the long side opposite the square corner.', value: { k: 'len', n: 0 }, board: 'diagonal = hypotenuse' },
  { say: 'The Pythagorean theorem ties them together: the two sides squared add up to the diagonal squared.', value: { k: 'len', n: 0 }, board: 'a² + b² = c²' },
  { say: 'Start with the first side, three. Square it — build a three-by-three square out on that side.', value: { k: 'len', n: 0 }, board: '3² = ?' },
  { say: 'A three-by-three square holds nine little tiles. So three squared is nine.', value: { k: 'len', n: 0 }, board: '3² = 9' },
  { say: 'Now the other side, four. Square it — build a four-by-four square out on that side.', value: { k: 'len', n: 0 }, board: '4² = ?' },
  { say: 'A four-by-four square holds sixteen tiles. So four squared is sixteen.', value: { k: 'len', n: 0 }, board: '4² = 16' },
  { say: 'Now add the two squares together: nine plus sixteen.', value: { k: 'len', n: 0 }, board: '9 + 16 = c²' },
  { say: 'Nine plus sixteen is twenty-five. So the diagonal squared is twenty-five.', value: { k: 'len', n: 0 }, board: 'c² = 25' },
  { say: 'To undo the square and get the diagonal itself, take the square root of both sides.', value: { k: 'len', n: 0 }, board: 'c = √25' },
  { say: 'The square root of twenty-five is five. Watch the diagonal sweep across as its length counts up.', value: { k: 'len', n: 5 }, board: 'c = √25 = 5' },
  { say: 'So the diagonal is five. On the dial, that is five.', value: { k: 'len', n: 5 }, board: 'diagonal = 5' },
]

/** Hand-authored SVG phone + right-triangle scene (storyboard:
 *  docs/storyboards/screen-distance.md) that ACTS OUT the Pythagorean build with
 *  Framer Motion. A portrait phone (bezel, notch, glowing screen) IS the 3×4
 *  rectangle whose diagonal we measure. Per narrated beat (stepIndex): the two
 *  legs DRAW in over the screen edges → a right-angle bracket springs → a 3×3
 *  square grows on the width leg and fills with 9 tiles → a 4×4 square grows on
 *  the height leg and fills with 16 tiles → they add to 25 → the diagonal SWEEPS
 *  corner-to-corner while a `useMotionValue` length COUNTS UP to 5. The math
 *  skeleton sits on the exact 3×4 mapping; only the phone is art.
 *  Reduced-motion → end state. */
function ScreenScene({ palette, value, stepIndex, ended }: { palette: Palette; value: V; stepIndex: number; ended: boolean }) {
  const p = palette
  const reduce = useReducedMotion()
  const LAST = 11
  const phase = ended ? LAST : Math.max(0, Math.min(LAST, stepIndex))

  // one reveal per beat
  const legsIn = phase >= 0        // phone + legs + side labels
  const rightAngle = phase >= 1    // square-corner bracket
  const aGrow = phase >= 3         // 3×3 outline grows
  const aTiles = phase >= 4        // 9 tiles fill
  const bGrow = phase >= 5         // 4×4 outline grows
  const bTiles = phase >= 6        // 16 tiles fill
  const adding = phase >= 7        // squares pulse together
  const sweep = phase >= 10        // diagonal draws + length counts up
  const solved = phase >= LAST

  const col = solved ? '#2fb37f' : sweep ? p.gold : p.goldDeep
  const spring = { type: 'spring' as const, stiffness: 300, damping: 20 }

  // ── continuous diagonal length count-up (0 until the sweep, then climbs to 5) ──
  const targetLen = value.k === 'len' ? value.n : 0
  const lenMV = useMotionValue(0)
  const [lenNum, setLenNum] = useState(0)
  useMotionValueEvent(lenMV, 'change', (v) => setLenNum(v))
  useEffect(() => {
    const controls = animate(lenMV, targetLen, { duration: reduce ? 0 : 0.9, ease: [0.33, 0.02, 0.2, 1] })
    return () => controls.stop()
  }, [targetLen, reduce, lenMV])
  const diagText = sweep && lenNum > 0.4 ? lenNum.toFixed(lenNum >= 4.9 ? 0 : 1) : 'c'

  // ── geometry: the screen rectangle is 3 wide (150) × 4 tall (200); right angle
  //    at the bottom-right (BR); legs = bottom (width 3) + right side (height 4);
  //    diagonal = BL → TR. Squares grow OUTWARD from each leg (a² below, b² right). ──
  const W = 460, H = 452
  const ax = 82, ay = 272          // bottom-left  (BL)
  const bx = 232                    // right x → width 150
  const cy = 72                     // top y  → height 200
  // BR = (bx, ay) right-angle corner · TR = (bx, cy) · TL = (ax, cy)
  const cellA = (bx - ax) / 3       // 50  (width leg square)
  const cellB = (ay - cy) / 4       // 50  (height leg square)
  const aOX = ax, aOY = ay + 26     // 3×3 below the bottom leg
  const bOX = bx + 30, bOY = cy     // 4×4 right of the height leg

  const readout =
    phase <= 6 ? '3² + 4² = c²'
      : phase === 7 ? '9 + 16 = c²'
        : phase <= 9 ? 'c² = 25'
          : solved ? 'c = 5' : 'c = √25'
  const caption =
    solved ? 'diagonal = 5'
      : sweep || phase === 9 ? 'take the square root…'
        : adding ? 'add the squares'
          : aGrow ? 'square each side'
            : 'a phone screen'

  // staggered unit-tile grid (Framer Motion springs)
  const tileGrid = (n: number, ox: number, oy: number, cell: number, fill: string, show: boolean) =>
    Array.from({ length: n * n }, (_, i) => {
      const r = Math.floor(i / n), c = i % n
      return (
        <motion.rect key={i} x={ox + c * cell + 1.4} y={oy + r * cell + 1.4} width={cell - 2.8} height={cell - 2.8} rx={2}
          fill={fill} stroke="rgba(255,255,255,0.22)" strokeWidth={0.6} initial={false}
          animate={{ opacity: show ? 0.9 : 0, scale: show ? 1 : 0.3 }}
          transition={reduce ? { duration: 0 } : { delay: show ? i * 0.028 : 0, type: 'spring', stiffness: 420, damping: 24 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
      )
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.2vh, 14px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 'clamp(224px, 31vw, 348px)', height: 'auto', display: 'block' }} role="img" aria-label="a phone screen with its diagonal found by the Pythagorean theorem">
        <defs>
          <linearGradient id="sd_screen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#173151" />
            <stop offset="1" stopColor="#0c1a2e" />
          </linearGradient>
          <radialGradient id="sd_glow" cx="0.42" cy="0.34" r="0.8">
            <stop offset="0" stopColor={p.gold} stopOpacity="0.16" />
            <stop offset="1" stopColor={p.gold} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── phone body (portrait) — the screen IS the 3×4 rectangle ── */}
        <rect x={ax - 20} y={cy - 34} width={(bx - ax) + 40} height={(ay - cy) + 54} rx={30}
          fill="#0c1728" stroke={p.glassBorder} strokeWidth={2} />
        <rect x={ax - 8} y={cy - 18} width={(bx - ax) + 16} height={(ay - cy) + 26} rx={16} fill="url(#sd_screen)" />
        <rect x={ax - 8} y={cy - 18} width={(bx - ax) + 16} height={(ay - cy) + 26} rx={16} fill="url(#sd_glow)" />
        {/* camera notch */}
        <rect x={(ax + bx) / 2 - 16} y={cy - 30} width={32} height={7} rx={3.5} fill="#0c1728" />
        <circle cx={(ax + bx) / 2 + 12} cy={cy - 26.5} r={1.8} fill={p.goldDeep} opacity={0.7} />

        {/* triangle fill over the screen (BR, BL, TR) */}
        <motion.polygon points={`${bx},${ay} ${ax},${ay} ${bx},${cy}`}
          fill={solved ? 'rgba(47,179,127,0.16)' : 'rgba(106,208,255,0.10)'} initial={false}
          animate={{ opacity: legsIn ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.5 }} />

        {/* ── b² square (4×4 = 16) growing right of the height leg ── */}
        <motion.g initial={false} animate={{ opacity: bGrow ? 1 : 0, scale: bGrow ? 1 : 0.4 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 20 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'left' }}>
          <rect x={bOX} y={bOY} width={4 * cellB} height={4 * cellB} fill="rgba(255,138,112,0.08)" stroke={p.coral} strokeWidth={1.4} rx={3} />
          {tileGrid(4, bOX, bOY, cellB, p.coral, bTiles)}
          <text x={bOX + 2 * cellB} y={bOY + 2 * cellB + 6} textAnchor="middle" fontFamily="var(--font-numeric)" fontSize={17} fontWeight={800}
            fill="#fff" style={{ opacity: bTiles ? 1 : 0, transition: 'opacity 260ms 240ms' }}>{bTiles ? '16' : '4²'}</text>
        </motion.g>

        {/* ── a² square (3×3 = 9) growing below the width leg ── */}
        <motion.g initial={false} animate={{ opacity: aGrow ? 1 : 0, scale: aGrow ? 1 : 0.4 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 20 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'top' }}>
          <rect x={aOX} y={aOY} width={3 * cellA} height={3 * cellA} fill="rgba(106,208,255,0.08)" stroke={p.goldDeep} strokeWidth={1.4} rx={3} />
          {tileGrid(3, aOX, aOY, cellA, p.goldDeep, aTiles)}
          <text x={aOX + 1.5 * cellA} y={aOY + 1.5 * cellA + 6} textAnchor="middle" fontFamily="var(--font-numeric)" fontSize={17} fontWeight={800}
            fill="#fff" style={{ opacity: aTiles ? 1 : 0, transition: 'opacity 260ms 240ms' }}>{aTiles ? '9' : '3²'}</text>
        </motion.g>

        {/* ── the two legs — draw in via pathLength ── */}
        <motion.line x1={bx} y1={ay} x2={ax} y2={ay} stroke={p.creamSoft} strokeWidth={3.6} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: legsIn ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeInOut' }} />
        <motion.line x1={bx} y1={ay} x2={bx} y2={cy} stroke={p.creamSoft} strokeWidth={3.6} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: legsIn ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeInOut', delay: 0.24 }} />

        {/* right-angle bracket at BR — springs in */}
        <motion.path d={`M${bx - 17},${ay} L${bx - 17},${ay - 17} L${bx},${ay - 17}`} fill="none" stroke={p.mint} strokeWidth={2} initial={false}
          animate={{ opacity: rightAngle ? 1 : 0, scale: rightAngle ? 1 : 0.4 }} transition={reduce ? { duration: 0 } : spring}
          style={{ transformBox: 'fill-box', transformOrigin: 'bottom right' }} />

        {/* adding pulse — squares breathe together as we sum them */}
        {adding && !reduce && (
          <motion.rect x={ax - 8} y={cy - 18} width={(bx - ax) + 16} height={(ay - cy) + 26} rx={16} fill="none"
            stroke={p.gold} strokeWidth={1} initial={{ opacity: 0 }} animate={{ opacity: sweep ? 0 : [0, 0.4, 0] }} transition={{ duration: 1.1, repeat: sweep ? 0 : Infinity }} />
        )}

        {/* ── diagonal (hypotenuse) BL → TR — sweeps in the final beats ── */}
        <motion.line x1={ax} y1={ay} x2={bx} y2={cy} stroke={col} strokeWidth={4.6} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: sweep ? 1 : 0, opacity: sweep ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.7, ease: 'easeInOut' }} />

        {/* side labels — spring in with the legs */}
        <motion.text x={(ax + bx) / 2} y={ay - 12} textAnchor="middle" fontFamily="var(--font-numeric)" fontSize={18} fontWeight={800} fill={p.creamSoft}
          initial={false} animate={{ opacity: legsIn ? 1 : 0, y: legsIn ? ay - 12 : ay - 4 }} transition={reduce ? { duration: 0 } : { ...spring, delay: 0.1 }}>3</motion.text>
        <motion.text x={bx - 14} y={(ay + cy) / 2 + 5} textAnchor="middle" fontFamily="var(--font-numeric)" fontSize={18} fontWeight={800} fill={p.creamSoft}
          initial={false} animate={{ opacity: legsIn ? 1 : 0 }} transition={reduce ? { duration: 0 } : { ...spring, delay: 0.28 }}>4</motion.text>

        {/* diagonal length readout — counts up as the diagonal draws */}
        <motion.text x={(ax + bx) / 2 - 14} y={(ay + cy) / 2 - 8} textAnchor="middle" fontFamily="var(--font-numeric)" fontSize={20} fontWeight={800} fill={col}
          initial={false} animate={{ opacity: sweep ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.3 }}>{diagText}</motion.text>
      </svg>

      <div key={readout} style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(18px, 2.2vw, 30px)', fontWeight: 800, color: col, transition: 'color 300ms', animation: 'sdPop 320ms ease' }}>
        {readout}
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: solved ? '#2fb37f' : p.mutedOnPaper }}>
        {caption}
      </div>
      <style>{'@keyframes sdPop{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:translateY(0)}}'}</style>
    </div>
  )
}

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'radicalsPythagorean',
  title: 'SCREEN DISTANCE',
  ticketLabel: 'measurement',
  palette: P,
  motif: '📐',
  makeTask,
  initialValue: (t) => (t.kind === 'side' ? { k: 'len', n: t.lo ?? 0 } : { k: 'rad', a: 0, b: 0 }),
  grade: (t, v) =>
    t.kind === 'side'
      ? v.k === 'len' && v.n === t.n
      : v.k === 'rad' && v.a === t.a && v.b === t.b,
  revealText: (t) => (t.kind === 'side' ? `${t.n}` : radStr(t.a ?? 0, t.b ?? 1)),
  glide: (t, _from, setValue, later) =>
    later(() => setValue(t.kind === 'side' ? { k: 'len', n: t.n ?? 0 } : { k: 'rad', a: t.a ?? 0, b: t.b ?? 1 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'side') {
      const n = value.k === 'len' ? value.n : 0
      return <SlideValue P={palette} value={n} setValue={(x) => setValue({ k: 'len', n: x })} min={task.lo ?? 0} max={task.hi ?? 20}
        disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'len', n: x })} commitLabel="MEASURE IT ✓" />
    }
    const a = value.k === 'rad' ? value.a : 0, b = value.k === 'rad' ? value.b : 0
    return <PartsBuilder P={palette} value={{ a, b }} setValue={(pr) => setValue({ k: 'rad', a: pr.a, b: pr.b })} min={0} max={12}
      template={(x, y) => (y <= 0 ? `${x}${RAD}?` : radStr(x, y))} labels={['coefficient', 'under root']}
      disabled={disabled} reveal={reveal} onCommit={(pr) => onCommit({ k: 'rad', a: pr.a, b: pr.b })} commitLabel="SET THE ROOT ✓" />
  },
  TutorialScene: ({ palette, value, stepIndex, ended }) => (
    <ScreenScene palette={palette} value={value} stepIndex={stepIndex} ended={ended} />
  ),
  start: {
    blurb: <><strong>You&apos;re measuring the diagonal.</strong> A screen&apos;s corner-to-corner distance — or a straight-line hop on a game map — never lines up with the grid. <strong>Pythagoras</strong> and a <strong>square root</strong> find it.</>,
    ticket: { title: 'Screen diagonal', badge: '3² + 4² = c²', tone: 'a' },
    startLabel: 'Start measuring →',
  },
  overview: {
    say: 'Here is the plan. The diagonal of a screen is the hypotenuse of a right triangle. The Pythagorean theorem says the two sides squared add up to the diagonal squared. We add them, then take the square root to get the diagonal. Let us measure one together, nice and slow.',
    problem: <>What&apos;s the diagonal of a <strong>3 by 4</strong> screen?</>,
    points: [
      <>The diagonal is the <strong>hypotenuse</strong> of a right triangle.</>,
      <><strong>a² + b² = c²</strong> — square each side and add them.</>,
      <>Take the <strong>square root</strong> to undo the square and get c.</>,
    ],
  },
  tutorial: { task: DEMO_TASK, initial: { k: 'len', n: 0 }, hand: 'drag', steps: DEMO_STEPS },
  guided: {
    task: {
      kind: 'side', title: 'Screen diagonal', badge: '6² + 8² = c²', tone: 'a', prompt: '',
      say: 'Your turn — I will help. A screen is six by eight. Dial the diagonal.',
      work: ['c² = 6² + 8² = 36 + 64 = 100, so c = √100 = 10.'],
      n: 10, lo: 0, hi: 18,
    },
    coach: 'Your turn — I will help. Dial this diagonal.', hand: 'drag',
  },
  sig: (t) => t.badge,
}

export default function ScreenDistance(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
