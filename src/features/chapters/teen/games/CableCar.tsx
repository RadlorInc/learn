'use client'
/**
 * CableCar — the Linear Relationships chapter as a PLAYABLE GAME.
 * World: a mountain cable car. The kid plans the route by SETTING the cable's
 * slope (m) and start height (b) so the line runs straight through both pylons
 * (LineSetter). Slope is felt as "how steeply the cable climbs", the start as
 * "how high it leaves the base station". No slides, no MCQ. Shared adaptive
 * engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * builds the route y = 2x + 1 dial-by-dial (start height FIRST, then the climb),
 * then a GUIDED order (config.guided) lets the kid run an easy cable with Milo
 * coaching (not scored), then the scored loop.
 */
import { useEffect, type ReactElement } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, LineSetter, numChoices, type Line } from './parts/gameKit'
import { shuffle, pick } from '@/core/rand'
import { SceneBg } from '@/shared/ui/SceneBg'

const P: Palette = {
  nightTop: '#0d2230', nightBot: '#123444',
  cream: '#eafaff', creamSoft: 'rgba(234,250,255,0.82)',
  inkOnPaper: '#16303a', mutedOnPaper: '#6f8f9a',
  gold: '#5fd0e6', goldDeep: '#2a9cbb',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#5fe0b0',
  glass: 'rgba(13,34,48,0.6)', glassBorder: 'rgba(234,250,255,0.22)',
}

// A single value type across the game: the dial tasks read {m,b}; the tap tasks
// read `pick`. `pick` is optional so the tutorial's {m,b} step literals still fit.
type LV = Line & { pick?: string }

interface Task extends BaseTask {
  kind?: Kind
  // dial tasks (build the line)
  p1?: [number, number]; p2?: [number, number]; answer?: Line
  // isFn (tap): a sensor log to judge
  rows?: { x: number; y: number }[]
  // readGraph (tap): a line the app draws, read its rule
  gline?: Line; choices?: string[]
  // shared tap answer
  answerPick?: string
}

// Each tier is a DIFFERENT linear demand, not just bigger numbers:
//   'isFn'      — TAP: is this sensor log a steady tank (one level per minute)? = function or not.
//   'rate'      — DIAL: empty tank (y = mx) — find just the fill rate (proportional).
//   'full'      — DIAL: start + rate (y = mx + b) — the intercept enters.
//   'drain'     — DIAL: a full line whose rate is NEGATIVE (draining).
//   'start'     — DIAL: told the rate; reason the start from one reading (b never shown).
//   'readGraph' — TAP: the app DRAWS a line; read its rule (graph → equation).
type Kind = 'isFn' | 'rate' | 'full' | 'drain' | 'start' | 'readGraph'

type DialSpec = { kind: 'rate' | 'full' | 'drain' | 'start'; p1: [number, number]; p2: [number, number]; m: number; b: number }
type FnSpec = { kind: 'isFn'; rows: [number, number][]; fn: boolean }
type GraphSpec = { kind: 'readGraph'; m: number; b: number }
type Spec = DialSpec | FnSpec | GraphSpec

const eqStr = (m: number, b: number): string => {
  const mp = m === 1 ? 'x' : m === -1 ? '−x' : `${m < 0 ? '−' : ''}${Math.abs(m)}x`
  return b === 0 ? `y = ${mp}` : `y = ${mp} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`
}

const L1: Spec[] = [ // is-it-a-function (concept) + pure rate (y = mx) — the foundation
  { kind: 'isFn', rows: [[0, 2], [1, 4], [2, 6], [3, 8]], fn: true },
  { kind: 'isFn', rows: [[0, 1], [2, 4], [2, 7], [3, 9]], fn: false }, // minute 2 has TWO levels
  { kind: 'isFn', rows: [[0, 0], [1, 3], [2, 6], [3, 9]], fn: true },
  { kind: 'rate', p1: [0, 0], p2: [1, 2], m: 2, b: 0 },
  { kind: 'rate', p1: [0, 0], p2: [2, 6], m: 3, b: 0 },
  { kind: 'rate', p1: [0, 0], p2: [1, 1], m: 1, b: 0 },
]
const L2: Spec[] = [ // start + rate (y = mx + b) — the intercept joins the rate
  { kind: 'full', p1: [0, 1], p2: [1, 3], m: 2, b: 1 },
  { kind: 'full', p1: [0, 2], p2: [1, 3], m: 1, b: 2 },
  { kind: 'full', p1: [0, 1], p2: [2, 5], m: 2, b: 1 },
  { kind: 'full', p1: [0, 3], p2: [1, 4], m: 1, b: 3 },
]
const L3: Spec[] = [ // read a drawn line + interpret (negative rate, reason the start)
  { kind: 'readGraph', m: 2, b: 1 },
  { kind: 'readGraph', m: -1, b: 2 },
  { kind: 'readGraph', m: 3, b: 0 },
  { kind: 'drain', p1: [0, 4], p2: [1, 2], m: -2, b: 4 },
  { kind: 'start', p1: [0, 1], p2: [2, 5], m: 2, b: 1 },
  { kind: 'start', p1: [0, 1], p2: [1, 4], m: 3, b: 1 },
]

function makeFrom(s: Spec): Task {
  if (s.kind === 'isFn') {
    const rows = s.rows.map(([x, y]) => ({ x, y }))
    const prompt = 'A sensor logged the tank over time. Is it a STEADY tank — exactly one level at each minute?'
    return {
      kind: 'isFn', title: 'Steady or glitch?', badge: 'one level per minute?', tone: 'a', showEquals: false,
      // "Glitch" is defined right here — it is named nowhere else on the board.
      context: 'A steady tank shows one water level each minute. A glitch is when one minute shows two different levels.',
      instruction: 'Look at the table. Check if any minute has two different litre readings, then tap steady or glitch.',
      prompt, say: prompt, rows, answerPick: s.fn ? 'yes' : 'no',
      work: s.fn
        ? ['Every minute has exactly ONE level — that is a function.', 'One input, one output: a steady tank.']
        : ['One minute shows TWO different levels — a steady tank cannot do that.', 'A time with two outputs is NOT a function.'],
    }
  }
  if (s.kind === 'readGraph') {
    const { m, b } = s
    const correct = eqStr(m, b)
    const set = new Set<string>([correct])
    set.add(eqStr(-m, b))                                   // wrong slope sign
    if (b !== 0) { set.add(eqStr(m, 0)); set.add(eqStr(m, -b)) } // dropped / wrong-sign intercept
    else { set.add(eqStr(m, 1)); set.add(eqStr(m, -1)) }    // spurious intercept on a y=mx line
    set.add(eqStr(m + (m > 0 ? 1 : -1), b))                 // slightly steeper
    const distract = shuffle([...set].filter((x) => x !== correct)).slice(0, 3)
    const choices = shuffle([correct, ...distract])
    const prompt = "The sensor drew the tank's fill as this line. Which rule matches it?"
    return {
      kind: 'readGraph', title: 'Read the line', badge: 'which rule fits the line?', tone: (m < 0 ? 'b' : 'a'), showEquals: false,
      context: "The sensor drew the tank's water level as a line. Each rule says where the line starts and how fast it climbs.", instruction: 'Look at the line. See where it starts and how fast it climbs, then tap the rule that matches.',
      prompt, say: prompt, gline: { m, b }, choices, answerPick: correct,
      work: [`Read the line's height at minute 0 — where it crosses the up-and-down middle line. That is the START (b = ${b}).`, `It climbs ${m} for each step right — the RATE. So ${correct}.`],
    }
  }
  // dial kinds: rate / full / drain / start
  const { p1, p2, m, b, kind } = s
  const [x1, y1] = p1, [x2, y2] = p2
  // showEquals: false on ALL four — none of these badges is an expression, so a
  // trailing "= ?" read as nonsense ("0 min → 4 L  = ?").
  const base = { kind, p1, p2, answer: { m, b }, tone: (m < 0 ? 'b' : 'a') as 'a' | 'b', showEquals: false }
  if (kind === 'rate') {
    // Answered on the AnswerPad: the start is fixed at 0, so the fill rate is the
    // ONE unknown — the prompt asks for that number, not for two dial settings.
    const prompt = `The tank starts EMPTY. After ${x2} min it reads ${y2} litres. How many litres does it fill each minute?`
    return {
      ...base, title: 'Empty start', badge: `starts empty · ${x2} min → ${y2} L`, prompt, say: prompt,
      context: `The tank starts empty. After ${x2} minutes it holds ${y2} litres. It fills the same amount every minute.`,
      padInstruction: 'Work out how many litres it fills each minute, then tap that number.',
      work: ['No starting water, so it is just rate × time — y = mx.', `Rate = ${y2} ÷ ${x2} = ${m} litres a minute; start 0.`],
    }
  }
  if (kind === 'drain') {
    const prompt = `This tank is DRAINING. It reads (${x1}, ${y1}) then (${x2}, ${y2}). Set the start level and the fill rate — the rate is negative — so the line hits both.`
    return {
      // Tier 3: prompt unrendered AND unspoken, so "going DOWN" must live on the
      // badge — it was the only signal that the rate is negative.
      ...base, title: 'Draining', badge: `going DOWN · ${x1} min → ${y1} L,  ${x2} min → ${y2} L`, prompt, say: prompt,
      context: `This tank is draining. It reads ${y1} litres at ${x1} minutes, then ${y2} litres at ${x2} minutes. The level drops every minute.`,
      instruction: 'Look at the two dials. Set the start level, then the fill rate, so the line hits both readings.',
      work: ['Draining means the rate is NEGATIVE.', `Rate = (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${m}; start ${b}.`],
    }
  }
  if (kind === 'start') {
    // Answered on the AnswerPad: the rate is GIVEN, so the start level is the ONE unknown.
    const prompt = `The tank fills ${m} litres a minute. After ${x2} min it reads ${y2} litres. How many litres did it START with?`
    return {
      // The rate is the number needed to answer, so it is stated, not hidden.
      ...base, title: 'Find the start', badge: `fills ${m} L each min · ${x2} min → ${y2} L`, prompt, say: prompt,
      context: `The tank fills ${m} litres every minute. After ${x2} minutes it holds ${y2} litres. It had some water in it before it started filling.`,
      padInstruction: 'Work out how many litres the tank started with, then tap that number.',
      work: [`The rate is given: ${m} litres a minute.`, `Start = level − rate × time = ${y2} − ${m}×${x2} = ${b}.`],
    }
  }
  const prompt = `Match the tank's fill: it reads (${x1}, ${y1}) and (${x2}, ${y2}). Set the start level and fill rate so the water level over time hits both readings.`
  return {
    ...base, title: 'Two readings', badge: `${x1} min → ${y1} L,  ${x2} min → ${y2} L`, prompt, say: prompt,
    context: `A tank fills at a steady rate. It reads ${y1} litres at ${x1} minutes, then ${y2} litres at ${x2} minutes.`,
    instruction: 'Look at the two dials. Set the start level, then the fill rate, so the line hits both readings.',
    work: ['Fill rate = change in level ÷ change in time between the readings.', `Fills ${m} litres a minute, starting at ${b}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool = d === 1 ? L1 : d === 2 ? L2 : L3
  return makeFrom(pick(pool))
}

// ── Read-only surfaces for the TAP tasks ────────────────────────────────────
/** A static line on a grid — the "graph" the child reads (no dials). */
function MiniLineGraph({ P, m, b, range = 6 }: { P: Palette; m: number; b: number; range?: number }): ReactElement {
  const S = 220, pad = 14, span = 2 * range, cell = (S - 2 * pad) / span
  const toPx = (v: number) => pad + (v + range) * cell
  const clampY = (y: number) => Math.max(-range - 2, Math.min(range + 2, y))
  return (
    <svg viewBox={`0 0 ${S} ${S}`} style={{ width: 'min(72vw, 32vh)', height: 'min(72vw, 32vh)', background: P.glass, border: `1px solid ${P.glassBorder}`, borderRadius: 12 }}>
      {Array.from({ length: span + 1 }, (_, i) => (
        <g key={i}>
          <line x1={pad + i * cell} y1={pad} x2={pad + i * cell} y2={S - pad} stroke={P.glassBorder} strokeWidth={i === range ? 1.6 : 0.5} />
          <line x1={pad} y1={pad + i * cell} x2={S - pad} y2={pad + i * cell} stroke={P.glassBorder} strokeWidth={i === range ? 1.6 : 0.5} />
        </g>
      ))}
      <line x1={toPx(-range)} y1={S - toPx(clampY(m * -range + b))} x2={toPx(range)} y2={S - toPx(clampY(m * range + b))} stroke={P.gold} strokeWidth={3} strokeLinecap="round" />
      <circle cx={toPx(0)} cy={S - toPx(clampY(b))} r={5} fill={P.gold} stroke="#fff" strokeWidth={1.4} />
    </svg>
  )
}

/** A compact time/level readings table — the "sensor log" the child judges. */
function ReadingsTable({ P, rows }: { P: Palette; rows: { x: number; y: number }[] }): ReactElement {
  const cell: React.CSSProperties = { border: `1px solid ${P.glassBorder}`, padding: '5px 12px', textAlign: 'center', fontFamily: 'var(--font-numeric)', fontSize: 16, color: P.cream, fontVariantNumeric: 'tabular-nums', minWidth: 34 }
  const head: React.CSSProperties = { ...cell, color: P.creamSoft, fontWeight: 700, background: P.glass }
  return (
    <table style={{ borderCollapse: 'collapse', background: P.glass, borderRadius: 8, overflow: 'hidden' }}>
      <tbody>
        <tr><td style={head}>min</td>{rows.map((r, i) => <td key={i} style={cell}>{r.x}</td>)}</tr>
        <tr><td style={head}>litres</td>{rows.map((r, i) => <td key={i} style={cell}>{r.y}</td>)}</tr>
      </tbody>
    </table>
  )
}

/** Tap-to-answer surface (a picture above + option buttons). Auto-commits on tap;
 *  on reveal it highlights the correct option. The non-dial answer surface. */
function TapChoices({ P, above, options, disabled, reveal, correct, onPick }: {
  P: Palette; above?: ReactElement; options: { v: string; label: string }[]
  disabled?: boolean; reveal?: boolean; correct?: string; onPick: (v: string) => void
}): ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {above}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 360 }}>
        {options.map((o) => {
          const hit = reveal && o.v === correct
          return (
            <button key={o.v} disabled={disabled} onClick={() => onPick(o.v)} style={{
              padding: '12px 18px', borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
              fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(15px, 1.9vw, 20px)',
              background: hit ? P.mint : P.glass, color: hit ? '#06231c' : P.cream,
              border: `1.5px solid ${hit ? P.mint : P.glassBorder}`, transition: 'background 160ms, border-color 160ms',
            }}>{o.label}</button>
          )
        })}
      </div>
    </div>
  )
}

// ── worked example for the walkthrough (y = 2x + 1) + guided order (y = x + 1) ──
const DEMO_TASK: Task = {
  title: 'Two readings', badge: '0 min → 1 L,  1 min → 3 L', tone: 'a', showEquals: false,
  p1: [0, 1], p2: [1, 3], answer: { m: 2, b: 1 }, prompt: '', say: '', work: [],
}
const GUIDED_TASK: Task = {
  title: 'Two readings', badge: '0 min → 1 L,  1 min → 2 L', tone: 'a', showEquals: false,
  p1: [0, 1], p2: [1, 2], answer: { m: 1, b: 1 },
  context: 'A tank fills at a steady rate, so its level makes a straight line.',
  instruction: 'Look at the two dials. Set the start level, then the fill rate, then press SET LINE ✓.',
  prompt: 'Match the tank at (0,1) and (1,2): starts at 1 litre, rises 1 litre each minute. Set it, then press Set line.',
  say: 'Set the start level to one litre, then a fill rate of one — up one litre every minute. Then press set line.',
  work: ['Starts at 1 litre; it rises 1 litre each minute.', 'Fill rate 1, start 1.'],
}

// ── Animated walkthrough scene — the storyboard, in motion ────────────────────
// A code-drawn water TANK with level markings and an inflow tap. Driven purely by
// the walkthrough's per-step `value` (the line {m,b}) + step index, it acts out
// y = 2x + 1 like a cartoon explainer: first the water fills to the START level b
// (the intercept, shown in blue), then for each "minute" it rises by m (the rate,
// shown stacked in cyan on top of the base). The level (and the litre readout)
// rise CONTINUOUSLY on a Framer-Motion spring (60fps, overdamped so the number
// never overshoots the answer). Labels pop in. No CSS layout transitions.
const ART = '/assets/teen/objects'
const TANK_MAX = 6                                   // top of the tank = 6 litres
const pctForLevel = (l: number) => (Math.max(0, Math.min(TANK_MAX, l)) / TANK_MAX) * 100

function WaterTankScene({ palette: P, value, stepIndex, frameCount, ended }: {
  palette: Palette; value: Line; stepIndex: number; frameCount: number; ended: boolean
}): ReactElement {
  const { m, b } = value
  // how many "minutes" of fill-rate have been added so far, derived from step:
  //   before the rate is set (m<2 / early steps) → 0 minutes, just the base.
  //   step 6 = 1 min, step 7 = 2 min, step 8+ = 2 min (final).
  const rateSet = m >= 2
  const minutes = !rateSet ? 0 : stepIndex >= 7 ? 2 : stepIndex >= 6 ? 1 : 0
  const hasBase = b >= 1 || stepIndex >= 3                 // base water shown from step 3
  const base = hasBase ? b : 0
  const added = minutes * m
  const level = base + added

  const resultPhase = ended || stepIndex >= frameCount - 2 // last 2 beats: the answer
  const intro = stepIndex === 0
  const filling = rateSet && minutes >= 1 && !resultPhase

  const addedPct = pctForLevel(level) - pctForLevel(base)
  const tapping = (hasBase && base > 0 && minutes === 0) || (filling)

  // ── Framer Motion: the base level and the total level each ride a spring, so
  //    the water and its litre readout rise CONTINUOUSLY (60fps) instead of a
  //    per-step CSS jump. Overdamped → the number never overshoots the answer.
  //    Reduced-motion → snaps straight to the final level. ──
  const reduce = useReducedMotion()
  const baseMv = useMotionValue(base)
  const levelMv = useMotionValue(level)
  useEffect(() => {
    const c = animate(baseMv, base, reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 24, mass: 0.9 })
    return () => c.stop()
  }, [base, reduce, baseMv])
  useEffect(() => {
    const c = animate(levelMv, level, reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 24, mass: 0.9 })
    return () => c.stop()
  }, [level, reduce, levelMv])
  const baseH = useTransform(baseMv, (x) => `${pctForLevel(x)}%`)
  const addedH = useTransform([baseMv, levelMv], ([b2, l2]: number[]) => `${Math.max(0, pctForLevel(l2) - pctForLevel(b2))}%`)
  const totalH = useTransform(levelMv, (x) => `${pctForLevel(x)}%`)
  const readNum = useTransform(levelMv, (x) => `${Math.round(x)}`)
  const readBottom = useTransform(levelMv, (x) => `calc(9% + ${pctForLevel(x) * 0.71}%)`)

  return (
    <div style={{ position: 'relative', width: 'clamp(232px, 42vw, 344px)', height: 'clamp(300px, 46vh, 440px)', borderRadius: 16, background: '#0d2233', border: `1.5px solid ${P.glassBorder}`, overflow: 'hidden', boxShadow: '0 12px 34px rgba(0,0,0,0.42)' }}>
      <style>{'@keyframes wtDrip{0%{transform:translateY(-2px) scaleY(.7);opacity:.3}60%{opacity:1}100%{transform:translateY(10px) scaleY(1);opacity:0}}@keyframes wtRipple{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}@keyframes wtPop{0%{opacity:0;transform:translate(-50%,-30%) scale(.7)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}@keyframes wtGlow{0%,100%{box-shadow:0 0 0 rgba(95,224,176,0)}50%{box-shadow:0 0 22px rgba(95,224,176,.65)}}'}</style>

      {/* illustrated pump-room backdrop + scrim so the tank reads clearly */}
      <SceneBg src={`${ART}/tank_pump_room_bg.png`} priority />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(10,26,40,0.30), rgba(10,26,40,0.60))' }} />

      {/* inflow tap (illustrated faucet) + falling drip */}
      <div style={{ position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 4 }}>
        <img src={`${ART}/tank_faucet_tap.png`} alt="" style={{ width: 'clamp(38px,7.5vw,54px)', height: 'auto', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' }} />
        {tapping && <div style={{ width: 3, height: 12, borderRadius: 2, background: P.gold, animation: 'wtDrip 620ms ease-in infinite' }} />}
      </div>

      {/* the tank — the coordinate space for the water */}
      <div style={{ position: 'absolute', top: '20%', bottom: '9%', left: '30%', width: '40%', borderRadius: '4px 4px 12px 12px', background: 'rgba(0,0,0,0.26)', border: `2px solid ${P.glassBorder}`, borderTop: `2px solid ${P.gold}`, overflow: 'hidden' }}>

        {/* litre gridlines + left-edge labels */}
        {[1, 2, 3, 4, 5].map((l) => (
          <div key={l}>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${pctForLevel(l)}%`, height: 1, background: P.glassBorder, opacity: 0.28 }} />
            <div style={{ position: 'absolute', left: '-16%', bottom: `${pctForLevel(l)}%`, transform: 'translateY(50%)', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(8px,1vw,11px)', fontWeight: 700, color: P.mutedOnPaper }}>{l}</div>
          </div>
        ))}

        {/* base water (the START level b — the intercept), blue */}
        <motion.div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: baseH, background: `linear-gradient(${P.goldDeep}, ${P.gold})`, opacity: 0.9 }}>
          {base > 0 && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, background: P.cream, opacity: 0.5, animation: filling ? undefined : 'wtRipple 2.4s ease-in-out infinite' }} />}
        </motion.div>

        {/* added water (the fill-rate stack m·x), lighter cyan, sits on the base */}
        <motion.div style={{ position: 'absolute', left: 0, right: 0, bottom: baseH, height: addedH, background: `linear-gradient(${P.mint}, ${P.gold})`, opacity: addedPct > 0 ? 0.72 : 0 }}>
          {addedPct > 0 && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, background: P.cream, opacity: 0.6, animation: 'wtRipple 2.4s ease-in-out infinite' }} />}
        </motion.div>

        {/* result glow ring at the final level */}
        {resultPhase && (
          <motion.div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: totalH, borderRadius: '0 0 10px 10px', border: `2px solid ${P.mint}`, animation: 'wtGlow 1.5s ease-in-out infinite', pointerEvents: 'none' }} />
        )}
      </div>

      {/* illustrated glass vessel — overlays the tank so the water shows through */}
      <img src={`${ART}/tank_glass_vessel.png`} alt="" style={{ position: 'absolute', top: '20%', bottom: '9%', left: '30%', width: '40%', objectFit: 'fill', zIndex: 2, pointerEvents: 'none', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))' }} />

      {/* running level readout — big number by the water line, ticks as it fills */}
      <motion.div style={{ position: 'absolute', right: '10%', bottom: readBottom, y: '50%', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(26px,4.6vw,40px)', fontWeight: 800, color: resultPhase ? P.mint : level > 0 ? P.gold : P.mutedOnPaper, whiteSpace: 'nowrap', zIndex: 3 }}>
        <motion.span>{readNum}</motion.span><span style={{ fontSize: '0.42em', fontWeight: 700, color: P.mutedOnPaper }}> L</span>
      </motion.div>

      {/* intro: the two dials of a tank */}
      {intro && (
        <>
          <div style={{ position: 'absolute', left: '6%', top: '30%', color: P.gold, fontWeight: 800, fontSize: 'clamp(11px,1.4vw,14px)', whiteSpace: 'nowrap' }}>start = b</div>
          <div style={{ position: 'absolute', left: '6%', top: '46%', color: P.mint, fontWeight: 800, fontSize: 'clamp(11px,1.4vw,14px)', whiteSpace: 'nowrap' }}>rate = m</div>
        </>
      )}

      {/* live equation tag once the rate is filling */}
      {rateSet && minutes >= 1 && (
        <div style={{ position: 'absolute', top: '4%', left: '4%', padding: '3px 10px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, color: P.cream, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(10px,1.2vw,13px)', animation: 'wtPop 260ms ease' }}>
          {b} + {m}×{minutes} = {level}
        </div>
      )}

      {/* result label pill */}
      {resultPhase && (
        <div style={{ position: 'absolute', bottom: '2.5%', left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: 999, background: P.glass, border: `1px solid ${P.mint}`, color: P.mint, fontWeight: 800, fontSize: 'clamp(10px,1.2vw,13px)', animation: 'wtPop 260ms ease' }}>
          y = {m}x + {b}  ✓
        </div>
      )}
    </div>
  )
}

const isTap = (t: Task) => t.kind === 'isFn' || t.kind === 'readGraph'

// ── Which tasks are ONE number? ──────────────────────────────────────────────
// 'rate'  — the start is fixed at 0, so the fill rate (m) is the only unknown.
// 'start' — the rate is given in the prompt, so the start level (b) is the only unknown.
// 'full' / 'drain' set BOTH m and b: two numbers, so they keep the LineSetter — the
// line running through both readings IS the answer there.
// 'isFn' / 'readGraph' answer with a STRING (steady/glitch, y = 2x + 1) on the
// purpose-built TapChoices surface — untouched.
const padAnswer = (t: Task): number | null =>
  t.kind === 'rate' ? t.answer!.m : t.kind === 'start' ? t.answer!.b : null

export const CONFIG: GameConfig<LV, Task> = {
  chapterId: 'linearRelationships',
  title: 'WATER TANK',
  motif: '💧',
  ticketLabel: 'fill log',
  palette: P,
  makeTask,
  initialValue: () => ({ m: 1, b: 0 }),
  // The pad submits a bare number, so that case is graded FIRST (V is an object here).
  grade: (t, v) =>
    typeof (v as unknown) === 'number'
      ? (v as unknown as number) === padAnswer(t)
      : (isTap(t) ? v.pick === t.answerPick : !!t.answer && v.m === t.answer.m && v.b === t.answer.b),
  answerPad: (t) => {
    const a = padAnswer(t)
    if (a === null) return []
    // Classic misses: reading the level off a single point instead of a difference,
    // and swapping the rate with the start.
    const near = t.kind === 'rate' ? [t.p2![1], t.p2![0]] : [t.answer!.m, t.p2![1]]
    return numChoices(a, near, { min: 0 })
  },
  revealText: (t) => {
    if (t.kind === 'isFn') return t.answerPick === 'yes' ? 'yes — one level each minute' : 'no — a minute had two levels'
    if (t.kind === 'readGraph') return t.answerPick as string
    if (t.kind === 'rate') return `${t.answer!.m} litres a minute`
    if (t.kind === 'start') return `starts at ${t.answer!.b} litres`
    return `fill rate ${t.answer!.m}, start ${t.answer!.b}`
  },
  glide: (t, _from, setValue) => {
    if (isTap(t)) setValue({ m: 0, b: 0, pick: t.answerPick })
    else if (t.answer) setValue({ m: t.answer.m, b: t.answer.b })
  },
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'isFn')
      return (
        <TapChoices P={palette} disabled={disabled} reveal={reveal} correct={task.answerPick}
          above={<ReadingsTable P={palette} rows={task.rows!} />}
          // NO ✓/✗ on these labels: the glyphs marked one button "right" and the
          // other "wrong", so a child could score without ever reading the table.
          options={[{ v: 'yes', label: 'Steady tank' }, { v: 'no', label: 'Sensor glitch' }]}
          onPick={(p) => onCommit({ ...value, pick: p })} />
      )
    if (task.kind === 'readGraph')
      return (
        <TapChoices P={palette} disabled={disabled} reveal={reveal} correct={task.answerPick}
          above={<MiniLineGraph P={palette} m={task.gline!.m} b={task.gline!.b} />}
          options={task.choices!.map((c) => ({ v: c, label: c }))}
          onPick={(p) => onCommit({ ...value, pick: p })} />
      )
    return (
      <LineSetter P={palette} labels={{ m: 'rate', b: 'start' }} line={{ m: value.m, b: value.b }} setLine={(l) => setValue({ ...value, m: l.m, b: l.b })}
        range={6} disabled={disabled} reveal={reveal} onCommit={(l) => onCommit({ ...value, m: l.m, b: l.b })} commitLabel="SET LINE ✓" />
    )
  },
  tutorial: {
    task: DEMO_TASK,
    initial: { m: 1, b: 0 },
    hand: 'tap',
    steps: [
      { say: "Tank duty! The water level depends on two things: where it STARTS, and how fast it FILLS. Let us find them one at a time.", value: { m: 1, b: 0 }, hand: 'tap' },
      { say: "The pattern we want is y = 2x + 1. The number on its OWN is the start. The number stuck to x is the fill rate.", value: { m: 1, b: 0 }, hand: 'tap', board: 'y = 2x + 1' },
      { say: "First the start level — the number on its own. Here it is one, so the tank begins at one litre.", value: { m: 1, b: 0 }, hand: 'tap', board: 'start (b) = 1' },
      { say: "So I lift the start to one litre. Watch the whole line rise up to begin at one.", value: { m: 1, b: 1 }, hand: 'tap', board: 'begins at 1 litre' },
      { say: "Now the fill RATE — the number with x. Here it is two, so the level rises two litres every single minute.", value: { m: 1, b: 1 }, hand: 'tap', board: 'rate (m) = 2' },
      { say: "I set the rate dial to two litres a minute. Now the line tilts up two for every step across.", value: { m: 2, b: 1 }, hand: 'tap', board: 'fill rate = 2 L a minute' },
      { say: "Let us check it. Start at one. After one minute add two: one plus two is three litres.", value: { m: 2, b: 1 }, hand: 'tap', board: '1 min: 1 + 2 = 3' },
      { say: "After two minutes add two more: one plus four is five litres. Every point sits right on the line.", value: { m: 2, b: 1 }, hand: 'tap', board: '2 min: 1 + 4 = 5' },
      { say: "That straight line IS the tank filling — start at one, up two each minute.", value: { m: 2, b: 1 }, hand: 'tap', board: 'y = 2x + 1 ✓' },
      { say: "Start level first, then fill rate. Press set line when it fits. Now let's try one together.", value: { m: 2, b: 1 }, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'tap',
  },
  TutorialScene: WaterTankScene,
  start: {
    blurb: <><strong style={{ color: P.cream }}>You&apos;re logging how the tank fills.</strong> Set the start level and fill rate so the water level over time runs straight through both readings.</>,
    ticket: { title: 'Two readings', badge: '0 min → 1 L,  1 min → 3 L', tone: 'a' },
    startLabel: 'Open the valve →',
  },
  overview: {
    say: "Here is what we are figuring out: a water tank fills at a steady rate, so its level makes a straight line over time. We will track a tank that starts at one litre and fills two litres every minute, and write that as y = 2x + 1 — the start plus the rate times the minutes.",
    problem: <>How does the tank fill? We&apos;ll set a tank that <strong>starts at 1 litre and rises 2 litres a minute</strong> — and write it as <strong>y = 2x + 1</strong>.</>,
    points: [
      <>The number on its own is the <strong>start level (b = 1)</strong> — where the water begins.</>,
      <>The number stuck to x is the <strong>fill rate (m = 2)</strong> — litres added each minute.</>,
      <>We&apos;ll check it: after 2 minutes the level is <strong>1 + 2×2 = 5 litres</strong>.</>,
    ],
  },
  sig: (t) =>
    t.kind === 'isFn' ? `fn:${t.answerPick}:${(t.rows || []).map((r) => `${r.x},${r.y}`).join(';')}`
      : t.kind === 'readGraph' ? `rg:${t.gline!.m},${t.gline!.b}`
        : t.badge,
}

export default function CableCar(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
