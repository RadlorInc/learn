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
import { Palette, LineSetter, type Line, pick } from './parts/gameKit'

const P: Palette = {
  nightTop: '#0d2230', nightBot: '#123444',
  cream: '#eafaff', creamSoft: 'rgba(234,250,255,0.82)',
  inkOnPaper: '#16303a', mutedOnPaper: '#6f8f9a',
  gold: '#5fd0e6', goldDeep: '#2a9cbb',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#5fe0b0',
  glass: 'rgba(13,34,48,0.6)', glassBorder: 'rgba(234,250,255,0.22)',
}

interface Task extends BaseTask { p1: [number, number]; p2: [number, number]; answer: Line }

type Spec = { p1: [number, number]; p2: [number, number]; m: number; b: number }

const L1: Spec[] = [
  { p1: [0, 1], p2: [1, 3], m: 2, b: 1 },
  { p1: [0, 0], p2: [1, 2], m: 2, b: 0 },
  { p1: [0, 2], p2: [1, 3], m: 1, b: 2 },
]
const L2: Spec[] = [
  { p1: [0, -1], p2: [2, 3], m: 2, b: -1 },
  { p1: [0, 4], p2: [1, 2], m: -2, b: 4 },
  { p1: [0, 1], p2: [2, 5], m: 2, b: 1 },
]
const L3: Spec[] = [
  { p1: [1, 1], p2: [3, 7], m: 3, b: -2 },
  { p1: [0, 3], p2: [2, -1], m: -2, b: 3 },
  { p1: [0, -2], p2: [1, 1], m: 3, b: -2 },
]

function makeFrom(s: Spec): Task {
  const { p1, p2, m, b } = s
  return {
    title: 'Two readings',
    badge: `(${p1[0]},${p1[1]}) & (${p2[0]},${p2[1]})`,
    tone: m < 0 ? 'b' : 'a',
    prompt: `Match the tank's fill: it reads (${p1[0]}, ${p1[1]}) and (${p2[0]}, ${p2[1]}). Set the start level and fill rate so the water level over time hits both readings.`,
    say: `Match the tank's fill: it reads (${p1[0]}, ${p1[1]}) and (${p2[0]}, ${p2[1]}). Set the start level and fill rate so the water level over time hits both readings.`,
    p1, p2, answer: { m, b },
    work: [
      'Fill rate = change in level ÷ change in time between the readings.',
      `Fills ${m} litres a minute, starting at ${b}.`,
    ],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool = d === 1 ? L1 : d === 2 ? L2 : L3
  return makeFrom(pick(pool))
}

// ── worked example for the walkthrough (y = 2x + 1) + guided order (y = x + 1) ──
const DEMO_TASK: Task = {
  title: 'Two readings', badge: '(0,1) & (1,3)', tone: 'a',
  p1: [0, 1], p2: [1, 3], answer: { m: 2, b: 1 }, prompt: '', say: '', work: [],
}
const GUIDED_TASK: Task = {
  title: 'Two readings', badge: '(0,1) & (1,2)', tone: 'a',
  p1: [0, 1], p2: [1, 2], answer: { m: 1, b: 1 },
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
      <img src={`${ART}/tank_pump_room_bg.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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

const CONFIG: GameConfig<Line, Task> = {
  chapterId: 'linearRelationships',
  title: 'WATER TANK',
  motif: '💧',
  ticketLabel: 'fill log',
  palette: P,
  makeTask,
  initialValue: () => ({ m: 1, b: 0 }),
  grade: (t, v) => v.m === t.answer.m && v.b === t.answer.b,
  revealText: (t) => `fill rate ${t.answer.m}, start ${t.answer.b}`,
  glide: (t, _from, setValue) => setValue(t.answer),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <LineSetter P={palette} line={value} setLine={setValue} range={6} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="SET LINE ✓" />
  ),
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
      { say: "I set the fill rate to two litres a minute. Now the line tilts up two for every step across.", value: { m: 2, b: 1 }, hand: 'tap', board: '+2 litres each minute' },
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
    ticket: { title: 'Two readings', badge: '(0,1) & (1,3)', tone: 'a' },
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
  sig: (t) => t.badge,
}

export default function CableCar(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
