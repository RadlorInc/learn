'use client'
/**
 * GoingViral — the Functions: Linear & Exponential chapter (15–16) as a PLAYABLE GAME.
 * World: a video "going viral" — its VIEW COUNT growing over days. Steady posting
 * adds the same amount each day (a straight LINE); a viral hit multiplies each day
 * (a doubling CURVE).
 *
 * NON-MCQ except the classify sub-type (which is a 2-way pick, not a quiz):
 *   • EVALUATE   f(x) = views on day x  → a number DIAL (SlideValue).
 *   • SEQUENCE   continue the doubling  → a number DIAL (SlideValue).
 *   • GROWTH     the growth factor        → a number DIAL (SlideValue).
 *   • CLASSIFY   steady line vs viral curve → SpecPicker (two theme cards).
 * Exactly the 12–14 shape on GameShell: overview on the chalkboard + a code-drawn
 * views-over-days chart → baby-step walkthrough → guided → scored play. The scene
 * is code-drawn (pure CSS/SVG, no image assets).
 */
import { useEffect, useMemo, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SlideValue, SpecPicker } from './parts/gameKit'

const P: Palette = {
  nightTop: '#1a1230', nightBot: '#0d0820',
  cream: '#f2ecff', creamSoft: 'rgba(242,236,255,0.82)',
  inkOnPaper: '#1e1436', mutedOnPaper: '#7a6a9a',
  gold: '#ff5c9d', goldDeep: '#c8267a',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(30,20,54,0.6)', glassBorder: 'rgba(242,236,255,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)

// The answer is either a single number (evaluate / next term / growth factor) or a
// classification id ('curve' = exponential, 'line' = linear).
type V = { k: 'num'; n: number } | { k: 'pick'; id: string }

interface Task extends BaseTask {
  kind: 'eval' | 'sequence' | 'growth' | 'classify'
  n?: number; lo?: number; hi?: number     // numeric answer bounds
  id?: string                              // classify answer id
}

// ── L1 — evaluate a steady (linear) views model f(x) = m·x + c ────────────────
function evalTask(d: 1 | 2 | 3): Task {
  const m = rint(2, 6), c = rint(0, 20), x = rint(1, 8)
  const n = m * x + c
  const cs = c === 0 ? '' : ` + ${c}`
  return {
    kind: 'eval', title: 'Steady channel', badge: `f(x) = ${m}x${cs},  x = ${x}`, tone: 'a',
    prompt: `Dial the views on day ${x} for f(x) = ${m}x${cs}.`,
    say: `A steady channel gains views by f of x equals ${m} x${c ? ` plus ${c}` : ''}. Dial the views on day ${x}.`,
    work: [`Substitute x = ${x}: ${m}(${x})${c ? ` + ${c}` : ''} = ${m * x}${c ? ` + ${c}` : ''} = ${n} views.`],
    n, lo: 0, hi: Math.max(60, n + 20),
  }
}

// ── L3 — continue a geometric (viral / doubling) sequence ─────────────────────
function sequenceTask(d: 1 | 2 | 3): Task {
  const start = pick([1, 2, 3]), r = pick([2, 3])
  const seq = [start, start * r, start * r * r]
  const n = start * r * r * r
  return {
    kind: 'sequence', title: 'Going viral', badge: `${seq.join(', ')}, …`, tone: 'b',
    prompt: `Views are multiplying by ${r} each day: ${seq.join(', ')}. Dial the next day.`,
    say: `The views are going viral — each day multiplies by ${r}. The pattern so far is ${seq.join(', ')}. Dial what comes next.`,
    work: [`Each term multiplies by ${r}, so the next term is ${seq[2]} × ${r} = ${n}.`],
    n, lo: 0, hi: Math.max(90, n + 20),
  }
}

// ── L3 — read the growth factor (base) off a viral model y = a·bˣ ─────────────
function growthTask(d: 1 | 2 | 3): Task {
  const a = pick([1, 2, 5, 10]), b = pick([2, 3, 4])
  return {
    kind: 'growth', title: 'Growth factor', badge: `y = ${a}·${b}ˣ`, tone: 'b',
    prompt: `In the viral model y = ${a}·${b}ˣ, dial the growth factor (how many times it multiplies each day).`,
    say: `A viral model is y equals ${a} times ${b} to the x. Dial the growth factor — the number the views multiply by each day.`,
    work: [`In y = a·bˣ, the base b is the growth factor. Here b = ${b}, so the views multiply by ${b} each day.`],
    n: b, lo: 0, hi: 12,
  }
}

// ── L2 — classify: steady posting (a LINE) vs viral doubling (a CURVE) ─────────
function classifyTask(d: 1 | 2 | 3): Task {
  const viral = Math.random() < 0.5
  const id = viral ? 'curve' : 'line'
  const base = pick([2, 3]), m = pick([2, 4, 6])
  const badge = viral ? `y = ${base}ˣ` : `y = ${m}x`
  return {
    kind: 'classify', title: 'Steady or viral?', badge, tone: 'a',
    prompt: `Is ${badge} steady posting or going viral?`,
    say: viral
      ? `Look at ${base} to the x. Each day the views multiply. Is that steady posting, or going viral?`
      : `Look at ${m} x. Each day the views go up by the same amount. Is that steady posting, or going viral?`,
    work: [viral
      ? `${badge} multiplies by a fixed base each day, so it curves upward — that is going viral (exponential).`
      : `${badge} adds the same amount each day, so it is a straight line — that is steady posting (linear).`],
    id,
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return Math.random() < 0.5 ? evalTask(d) : classifyTask(d)
  if (d === 2) return Math.random() < 0.5 ? classifyTask(d) : evalTask(d)
  // L3 — growth factor + continue a geometric sequence
  return Math.random() < 0.5 ? sequenceTask(d) : growthTask(d)
}

const CLASSIFY_CHOICES = [
  { id: 'line', label: <>📈 Steady posting<br /><span style={{ fontSize: '0.7em', opacity: 0.8 }}>(a straight LINE)</span></> },
  { id: 'curve', label: <>🚀 Going viral<br /><span style={{ fontSize: '0.7em', opacity: 0.8 }}>(a doubling CURVE)</span></> },
]

// ── fixed worked example (walkthrough) — evaluate a steady views model ─────────
const DEMO_TASK: Task = {
  kind: 'eval', title: 'Steady channel', badge: 'f(x) = 3x + 4,  x = 5', tone: 'a',
  prompt: '', say: '', work: ['Substitute x = 5: 3(5) + 4 = 15 + 4 = 19 views.'],
  n: 19, lo: 0, hi: 30,
}
// Eleven BABY steps: the two-video RACE is the hook (steady line vs viral curve,
// early lead → meet at day 4 → overtake), then the algebra unfolds one move per
// step while we evaluate the steady model on day 5. Each step = one idea + one
// chalkboard line + its own scene beat (gated on stepIndex; value.n carries the
// running view count).
const DEMO_STEPS: DemoStep<V>[] = [
  { say: 'Two videos go up on the very same day. One posts steadily, one blows up. Let us see who wins.', value: { k: 'num', n: 4 }, board: 'two videos, day 0' },
  { say: 'The steady channel adds the same three views every single day. That draws a straight line: f of x equals three x plus four.', value: { k: 'num', n: 4 }, board: 'steady: f(x) = 3x + 4' },
  { say: 'The viral video doubles every day instead. That draws a curve that bends upward: y equals two to the x.', value: { k: 'num', n: 4 }, board: 'viral: y = 2ˣ' },
  { say: 'Early on, the steady line is actually ahead. Slow and steady leads in the first few days.', value: { k: 'num', n: 4 }, board: 'early days → steady leads' },
  { say: 'But the curve is catching up fast. On day four they meet — both sitting at sixteen views.', value: { k: 'num', n: 4 }, board: 'day 4 → they meet at 16' },
  { say: 'After that, the viral curve rockets past and never looks back. That is exponential growth.', value: { k: 'num', n: 4 }, board: 'viral overtakes → exponential' },
  { say: 'Now let us find the steady channel exactly. How many views does it have on day five? We evaluate f of five.', value: { k: 'num', n: 4 }, board: 'steady on day 5 → f(5)' },
  { say: 'Evaluate means swap every x for the day number. So x becomes five: three times five, plus four.', value: { k: 'num', n: 4 }, board: 'f(5) = 3(5) + 4' },
  { say: 'First the multiplying part. Three times five is fifteen.', value: { k: 'num', n: 15 }, board: '= 15 + 4' },
  { say: 'Then add the four views it started with. Fifteen plus four is nineteen.', value: { k: 'num', n: 19 }, board: '= 19' },
  { say: 'So on day five the steady channel has nineteen views. On the dial, that is nineteen.', value: { k: 'num', n: 19 }, board: 'day 5 → 19 views' },
]

// ── hand-authored SVG analytics screen (storyboard: docs/storyboards/going-viral.md)
// Two videos race on a code-drawn views-over-days chart. Steps 1–2: the steady
// LINE f(x)=3x+4 (gold) and the viral CURVE y=2ˣ (mint) DRAW IN via pathLength.
// Steps 3–5: a continuous day-SCAN sweeps across the days, a dot riding each graph
// and a live scoreboard ticking, so the curve is SEEN overtaking the line — they
// meet exactly at (day 4, 16 views), sprung in, then viral rockets past. Steps 6+:
// the race dims and an EVALUATE marker climbs the day-5 column 4 → 15 → 19 (curVal),
// landing on the steady line's endpoint. Every mark sits on the exact gx/gy mapping
// so the math stays correct; useReducedMotion collapses to each beat's end state.
function ViralScene({ palette, value, stepIndex, ended }: { palette: Palette; value: V; stepIndex: number; ended: boolean }) {
  const p = palette
  const reduce = useReducedMotion()
  const W = 320, H = 232, padL = 40, padB = 30, padT = 18, padR = 16
  const xMax = 5, yMax = 34
  const gx = (x: number) => padL + (x / xMax) * (W - padL - padR)
  const gy = (y: number) => H - padB - (Math.min(Math.max(y, 0), yMax) / yMax) * (H - padT - padB)
  const line = (x: number) => 3 * x + 4       // steady model (the demo)
  const curve = (x: number) => Math.pow(2, x) // viral model, races it — they meet at (4, 16)
  const days = [0, 1, 2, 3, 4, 5]

  const curVal = value.k === 'num' ? value.n : 4

  // Phase gating — each baby step reveals its own beat.
  const showLine = stepIndex >= 1
  const showCurve = stepIndex >= 2
  const racePhase = stepIndex >= 3 && stepIndex <= 5   // day-scan sweeps across the days
  const crossShown = stepIndex >= 4                    // (4, 16) crossover marker
  const overtake = stepIndex >= 5
  const evalPhase = stepIndex >= 6                     // evaluate f(5): marker climbs day-5 column
  const solved = ended || (evalPhase && curVal >= 19)

  // exact SVG path strings (line = straight, curve = smooth-sampled)
  const lineD = useMemo(() => days.map((x, i) => `${i ? 'L' : 'M'}${gx(x).toFixed(1)},${gy(line(x)).toFixed(1)}`).join(' '), []) // eslint-disable-line react-hooks/exhaustive-deps
  const curveD = useMemo(() => {
    const pts: string[] = []
    for (let i = 0; i <= 48; i++) { const x = (i / 48) * xMax; pts.push(`${i ? 'L' : 'M'}${gx(x).toFixed(1)},${gy(curve(x)).toFixed(1)}`) }
    return pts.join(' ')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── continuous day-scan sweep (race) — a motion value eased to the beat's day ──
  const sweep = useMotionValue(0)
  const sweepTarget = stepIndex < 3 ? 0 : stepIndex === 3 ? 2 : stepIndex === 4 ? 4 : 5
  useEffect(() => {
    const c = animate(sweep, sweepTarget, { duration: reduce ? 0 : 0.75, ease: 'easeInOut' })
    return () => c.stop()
  }, [sweepTarget, reduce, sweep])
  const scanX = useTransform(sweep, (d) => gx(d))
  const steadyY = useTransform(sweep, (d) => gy(line(d)))
  const viralY = useTransform(sweep, (d) => gy(curve(d)))
  const [sN, setSN] = useState(4)   // steady count, read off the scan
  const [vN, setVN] = useState(1)   // viral count, read off the scan
  useMotionValueEvent(sweep, 'change', (d) => { setSN(Math.round(line(d))); setVN(Math.round(curve(d))) })

  // ── continuous evaluate count — climbs 4 → 15 → 19 as value.n steps ──
  const evalMV = useMotionValue(4)
  useEffect(() => {
    const c = animate(evalMV, curVal, { duration: reduce ? 0 : 0.6, ease: [0.33, 0.02, 0.2, 1] })
    return () => c.stop()
  }, [curVal, reduce, evalMV])
  const markY = useTransform(evalMV, (v) => gy(v))
  const [disp, setDisp] = useState(4)
  useMotionValueEvent(evalMV, 'change', (v) => setDisp(Math.round(v)))

  const spring = { type: 'spring' as const, stiffness: 320, damping: 20 }
  const scoreOn = showCurve && !evalPhase
  const dayEnd = gy(line(5)) // steady endpoint on day 5 = 19

  const pill = (color: string, glow: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999,
    fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(13px, 1.5vw, 17px)',
    color, background: p.glass, border: `1.5px solid ${color}`, boxShadow: `0 0 12px ${glow}`,
    fontVariantNumeric: 'tabular-nums',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }}>
      {/* live scoreboard — the two racing counts, ticking as the scan sweeps */}
      <div style={{ display: 'flex', gap: 12, minHeight: 30, alignItems: 'center', opacity: scoreOn ? 1 : 0, transition: 'opacity 300ms' }}>
        <span style={pill(p.gold, 'rgba(255,92,157,0.35)')}>📸 {sN}</span>
        <span style={{ color: p.mutedOnPaper, fontSize: 'clamp(11px, 1.1vw, 14px)', fontFamily: 'var(--font-numeric)' }}>vs</span>
        <span style={pill(p.mint, 'rgba(92,214,172,0.4)')}>🚀 {vN}</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 'clamp(260px, 34vw, 380px)', height: 'auto', borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
        <defs>
          <linearGradient id="gv_panel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#241638" />
            <stop offset="1" stopColor="#0e0820" />
          </linearGradient>
          <radialGradient id="gv_glow" cx="0.72" cy="0.14" r="0.9">
            <stop offset="0" stopColor={p.mint} stopOpacity="0.14" />
            <stop offset="1" stopColor={p.mint} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* backdrop — analytics panel + faint screen glow */}
        <rect x={0} y={0} width={W} height={H} fill="url(#gv_panel)" />
        <rect x={0} y={0} width={W} height={H} fill="url(#gv_glow)" />

        {/* view gridlines (chalk-faint) */}
        {[8, 16, 24, 32].map((yv) => (
          <line key={`vg${yv}`} x1={padL} y1={gy(yv)} x2={W - padR} y2={gy(yv)} stroke={p.glassBorder} strokeWidth={0.6} strokeDasharray="3 4" opacity={0.25} />
        ))}
        {/* day gridlines + labels */}
        {days.map((x) => (
          <g key={x}>
            <line x1={gx(x)} y1={padT} x2={gx(x)} y2={H - padB} stroke={p.glassBorder} strokeWidth={0.75} opacity={0.16} />
            <text x={gx(x)} y={H - padB + 13} textAnchor="middle" fill={p.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)">{x}</text>
          </g>
        ))}
        {/* axes — draw on */}
        <motion.line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke={p.creamSoft} strokeWidth={1.6}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.5, ease: 'easeInOut' }} />
        <motion.line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke={p.creamSoft} strokeWidth={1.6}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.6, ease: 'easeInOut' }} />
        <text x={padL - 6} y={padT + 6} textAnchor="end" fill={p.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)">views</text>
        <text x={W - padR} y={H - padB + 22} textAnchor="end" fill={p.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)">day →</text>

        {/* ── viral curve y = 2ˣ (draws in on step 2, dims in the evaluate phase) ── */}
        {showCurve && (
          <>
            <motion.path d={curveD} fill="none" stroke={p.mint} strokeWidth={overtake ? 3 : 2.4} strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: evalPhase ? 0.28 : 0.95 }}
              transition={{ duration: reduce ? 0 : 0.7, ease: 'easeInOut' }} style={{ filter: overtake ? `drop-shadow(0 0 6px ${p.mint})` : 'none' }} />
            {!evalPhase && <text x={gx(5) - 4} y={gy(curve(5)) - 6} textAnchor="end" fill={p.mint} fontSize={10} opacity={0.9} fontFamily="var(--font-numeric)">viral 🚀</text>}
          </>
        )}

        {/* ── steady line f(x) = 3x + 4 (draws in on step 1) ── */}
        {showLine && (
          <>
            <motion.path d={lineD} fill="none" stroke={p.gold} strokeWidth={2.8} strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.6, ease: 'easeInOut' }} />
            <text x={gx(1)} y={gy(line(1)) - 8} fill={p.gold} fontSize={10} fontFamily="var(--font-numeric)">steady</text>
            {days.map((x) => (
              <motion.circle key={x} cx={gx(x)} cy={gy(line(x))} r={2.8} fill={p.gold}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={reduce ? { duration: 0 } : { ...spring, delay: 0.2 + x * 0.06 }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
            ))}
          </>
        )}

        {/* ── crossover marker — springs in where line = curve, the true (4, 16) ── */}
        {showCurve && (
          <motion.g initial={false} animate={{ opacity: crossShown ? 1 : 0, scale: crossShown ? 1 : 0.4 }}
            transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx={gx(4)} cy={gy(16)} r={5.5} fill={p.cream} stroke={p.goldDeep} strokeWidth={1.5} />
            <text x={gx(4)} y={gy(16) - 10} textAnchor="middle" fill={p.cream} fontSize={10} fontWeight={800} fontFamily="var(--font-numeric)">meet · 16</text>
          </motion.g>
        )}

        {/* ── day-scan (race) — a vertical sweep with a dot riding each graph ── */}
        {racePhase && !reduce && (
          <>
            <motion.g style={{ x: scanX }}>
              <line x1={0} y1={padT} x2={0} y2={H - padB} stroke={p.creamSoft} strokeWidth={1.2} strokeDasharray="2 4" opacity={0.5} />
            </motion.g>
            <motion.g style={{ x: scanX, y: steadyY }}>
              <circle r={4.5} fill={p.gold} stroke={p.cream} strokeWidth={1.4} />
            </motion.g>
            <motion.g style={{ x: scanX, y: viralY }}>
              <circle r={4.5} fill={p.mint} stroke={p.cream} strokeWidth={1.4} />
            </motion.g>
          </>
        )}

        {/* ── evaluate f(5): marker climbs the day-5 column 4 → 15 → 19 ── */}
        {evalPhase && (
          <>
            {/* static vertical guide up the day-5 column to the steady endpoint */}
            <line x1={gx(5)} y1={H - padB} x2={gx(5)} y2={dayEnd} stroke={p.gold} strokeWidth={1} strokeDasharray="2 3" opacity={0.4} />
            {/* horizontal guide from the views axis, riding the marker up */}
            <motion.g style={{ y: markY }}>
              <line x1={padL} y1={0} x2={gx(5)} y2={0} stroke={solved ? p.mint : p.gold} strokeWidth={1.1} strokeDasharray="2 3" opacity={0.55} />
            </motion.g>
            {/* the climbing marker + its value label */}
            <motion.g style={{ x: gx(5), y: markY }}>
              <circle r={6.5} fill={solved ? p.mint : p.gold} stroke={p.cream} strokeWidth={1.6} />
              <text x={11} y={-7} fill={solved ? p.mint : p.gold} fontSize={12} fontWeight={800} fontFamily="var(--font-numeric)">{disp}</text>
            </motion.g>
          </>
        )}
      </svg>

      {/* focus readout — the number being taught in the evaluate phase */}
      <div style={{ minHeight: 34, display: 'flex', alignItems: 'center' }}>
        {evalPhase && (
          <div key={disp} style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px, 2.4vw, 30px)', fontWeight: 800, color: solved ? p.mint : p.gold, transition: 'color 300ms' }}>
            {disp} views
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: p.mutedOnPaper }}>
        {evalPhase ? (solved ? 'day 5 · 19 views ✓' : 'day 5')
          : overtake ? 'viral wins'
            : crossShown ? 'they meet · 16'
              : showCurve ? 'steady vs viral'
                : 'the race'}
      </div>
    </div>
  )
}

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'functionsFamilies',
  title: 'GOING VIRAL',
  ticketLabel: 'post',
  palette: P,
  motif: '🚀',
  makeTask,
  initialValue: (t) => (t.kind === 'classify' ? { k: 'pick', id: '' } : { k: 'num', n: t.lo ?? 0 }),
  grade: (t, v) => (t.kind === 'classify' ? v.k === 'pick' && v.id === t.id : v.k === 'num' && v.n === t.n),
  revealText: (t) => (t.kind === 'classify' ? (t.id === 'curve' ? 'Going viral' : 'Steady posting') : `${t.n}`),
  glide: (t, _from, setValue, later) =>
    later(() => setValue(t.kind === 'classify' ? { k: 'pick', id: t.id ?? '' } : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'classify') {
      const id = value.k === 'pick' ? value.id : ''
      return <SpecPicker P={palette} choices={CLASSIFY_CHOICES} value={id} setValue={(x) => setValue({ k: 'pick', id: x })}
        correct={task.id} disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'pick', id: x })}
        commitLabel="POST IT ✓" prompt="Steady posting or going viral?" />
    }
    const n = value.k === 'num' ? value.n : 0
    const label = task.kind === 'sequence' ? 'DIAL NEXT DAY ✓' : task.kind === 'growth' ? 'SET THE FACTOR ✓' : 'COUNT THE VIEWS ✓'
    return <SlideValue P={palette} value={n} setValue={(x) => setValue({ k: 'num', n: x })} min={task.lo ?? 0} max={task.hi ?? 60}
      disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'num', n: x })} commitLabel={label} />
  },
  TutorialScene: ({ palette, value, stepIndex, ended }) => (
    <ViralScene palette={palette} value={value} stepIndex={stepIndex} ended={ended} />
  ),
  start: {
    blurb: <><strong>Your video is racking up views.</strong> A <strong>steady</strong> channel adds the same amount each day (a straight line); a <strong>viral</strong> one multiplies each day (a curve). Work out the views, or spot which is which.</>,
    ticket: { title: "Today's post", badge: 'f(x) = 3x + 4', tone: 'a' },
    startLabel: 'Check the views →',
  },
  overview: {
    say: 'Here is the plan. A video\'s views over time follow a function — a rule that gives one view count for each day. A steady channel adds the same number every day, drawing a straight line. A viral one multiplies each day, curving upward fast. To find the views on any day, we put the day number into the rule and work it out. Let us do one together, nice and slow.',
    problem: <>How many views does <strong>f(x) = 3x + 4</strong> have on <strong>day x = 5</strong>?</>,
    points: [
      <>A <strong>function</strong> gives one view count for each day <strong>x</strong>.</>,
      <>To evaluate, <strong>swap x for the day</strong>, then do the math.</>,
      <><strong>Steady</strong> adds each day (line); <strong>viral</strong> multiplies (curve).</>,
    ],
  },
  tutorial: { task: DEMO_TASK, initial: { k: 'num', n: 4 }, hand: 'drag', steps: DEMO_STEPS },
  guided: {
    task: {
      kind: 'eval', title: 'Steady channel', badge: 'f(x) = 2x + 3,  x = 4', tone: 'a', prompt: '',
      say: 'Your turn. A steady channel is f of x equals two x plus three. Dial the views on day four.',
      work: ['Substitute x = 4: 2(4) + 3 = 8 + 3 = 11 views.'], n: 11, lo: 0, hi: 25,
    },
    coach: 'Your turn — I will help. Dial the views on day four.', hand: 'drag',
  },
  sig: (t) => t.badge,
}

export default function GoingViral(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
