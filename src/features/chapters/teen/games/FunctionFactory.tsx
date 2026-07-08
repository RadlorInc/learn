'use client'
/**
 * FunctionFactory — the Algebraic Expressions chapter as a PLAYABLE GAME.
 * World: a TAXI METER. The fare follows a rule (fare = base + rate × km). The kid
 * works fares by SLIDING the meter to the cost — sometimes evaluating a rule for a
 * given km, sometimes working backwards to how far the ride was, sometimes combining
 * like per-km rates to a total rate. No slides, no MCQ. Shared adaptive engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * works 3x + 2 at x = 4 km stage by stage, then a GUIDED ride (config.guided)
 * lets the kid do x + 2 at x = 3 with Milo coaching (not scored), then the scored loop.
 */
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, SlideValue, pick, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#1c1a10', nightBot: '#282412',
  cream: '#fffdf0', creamSoft: 'rgba(255,253,240,0.82)',
  inkOnPaper: '#2a2612', mutedOnPaper: '#9a9068',
  gold: '#ffd21f', goldDeep: '#d9a800',
  coral: '#ff8a4b', coralDeep: '#e2622a', mint: '#7fd0a0',
  glass: 'rgba(28,26,16,0.62)', glassBorder: 'rgba(255,253,240,0.22)',
}

interface Task extends BaseTask { answer: number }
const MIN = -5, MAX = 30

// ── generators ────────────────────────────────────────────────────────────────
// evaluate: feed x into a rule, set the output.
function evaluate(hard = false): Task {
  const easy: [string, number, number][] = [['2x + 1', 3, 7], ['x + 5', 4, 9], ['3x', 3, 9]]
  const tough: [string, number, number][] = [['4x − 3', 5, 17], ['2(x + 3)', 4, 14]]
  const [rule, x, answer] = pick(hard ? [...easy, ...tough] : easy)
  const filled = rule.replace(/x/g, `${x}`)
  return {
    title: 'Work out the fare', badge: `${rule} where x=${x}`, tone: 'a',
    prompt: `The fare rule is ${rule}, where x is the km. For ${x} km, set the meter.`,
    say: `The fare rule is ${rule}, where x is the number of km. Work it out for ${x} km, then set the meter.`,
    answer,
    work: [`Put ${x} in place of x.`, `${filled} = ${answer}.`],
  }
}
// solve: machine already output a value; work backwards to the input x.
function solve(): Task {
  const set: [string, number, number][] = [['2x + 1', 11, 5], ['3x − 2', 10, 4], ['x + 7', 12, 5], ['4x', 20, 5]]
  const [rule, out, answer] = pick(set)
  return {
    title: 'How far?', badge: `${rule} = ${out}`, tone: 'b',
    prompt: `The fare came to ${out} with rule ${rule}. Set how many km (x) the ride was.`,
    say: `The fare came to ${out} using the rule ${rule}. Slide to how many km the ride was.`,
    answer,
    work: [`Work backwards from ${out}.`, `x = ${answer} gives ${out}.`],
  }
}
// combine: add like terms, set the resulting coefficient.
function combine(): Task {
  const set: [number, number, number][] = [[3, 2, 5], [5, -2, 3], [4, 3, 7], [6, -2, 4]]
  const [a, b, answer] = pick(set)
  const sign = b < 0 ? '−' : '+'
  return {
    title: 'Combine the rates', badge: `${a}x ${sign} ${Math.abs(b)}x`, tone: 'a',
    prompt: `Two charges per km add up: ${a}x ${sign} ${Math.abs(b)}x. Set the total rate (the number in front of x).`,
    say: `Two charges per km add up: ${a} x ${b < 0 ? 'minus' : 'plus'} ${Math.abs(b)} x. Slide to the total rate.`,
    answer,
    work: [`Add the like terms' rates.`, `${a} ${sign} ${Math.abs(b)} = ${answer}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [() => evaluate(false), () => evaluate(false), () => evaluate(false)]
    : d === 2 ? [solve, combine, () => evaluate(false)]
    : [() => evaluate(true), solve, combine]
  return pick(pool)()
}

// ── the worked example for the walkthrough (3x + 2 where x = 4) and the guided order (x + 2 where x = 3) ──
const DEMO_TASK: Task = { title: 'Work out the fare', badge: '3x + 2 where x=4', tone: 'a', answer: 14, prompt: '', say: '', work: [] }

// ── Animated walkthrough scene — the worked example, in motion ────────────────
// A code-drawn TAXI on a ROAD with km markers, plus a METER readout. The worked
// example is 3x + 2 where x = 4: a $2 flag-fall (the constant) plus $3 per km (the
// rate). As the walkthrough's `value` (the running fare) climbs, the taxi DRIVES
// forward down the road and the meter ticks up — the base shown as a fixed start
// amount, the rate×x as the accumulating part. The fare, taxi position, km readout
// and rise-bar GLIDE continuously on a Framer-Motion spring (60fps, not per-step
// CSS jumps); overdamped so the meter never overshoots past the true fare.
// Driven purely by the per-step `value` + step index. No timers.
const RATE = 3, BASE = 2, KM = 4                 // 3x + 2 at x = 4
const FARE_MAX = RATE * KM + BASE                // 14
const KM_MARKS = [0, 1, 2, 3, 4]
const ART = '/assets/teen/objects'

function TaxiMeterScene({ palette: P, value, stepIndex, frameCount, ended }: {
  palette: Palette; value: number; stepIndex: number; frameCount: number; ended: boolean
}) {
  const fare = Math.max(0, Math.min(FARE_MAX, value))
  // Below the base fare the taxi is still at the stand; above it, km covered so far.
  const driven = fare <= BASE ? 0 : (fare - BASE) / RATE            // 0..4 km (target — for markers/chips)
  const resultPhase = ended || stepIndex >= frameCount - 2          // last 2 beats: the answer
  const intro = stepIndex <= 1
  const rolling = fare > BASE && !resultPhase
  const showBase = stepIndex >= 1
  const flagFall = fare >= BASE                                     // the $2 base is "on"
  const fareColor = resultPhase ? P.mint : fare > BASE ? P.gold : P.cream

  // ── Framer Motion: the fare rides a spring (continuous 60fps, not a per-step CSS
  //    jump). The meter number, km readout, taxi position and rise-bar all derive
  //    from it so they move together. Overdamped so the number never overshoots
  //    past the true fare. Reduced-motion → snaps to the final value. ──
  const reduce = useReducedMotion()
  const fv = useMotionValue(fare)
  useEffect(() => {
    const controls = animate(fv, fare, reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 24, mass: 0.9 })
    return () => controls.stop()
  }, [fare, reduce, fv])
  const clampF = (f: number) => Math.max(0, Math.min(FARE_MAX, f))
  const fareText = useTransform(fv, (f) => `$${Math.round(clampF(f))}`)
  const drivenText = useTransform(fv, (f) => {
    const dr = clampF(f) <= BASE ? 0 : (clampF(f) - BASE) / RATE
    return `${dr % 1 === 0 ? dr.toFixed(0) : dr.toFixed(1)} km`
  })
  const risePctMV = useTransform(fv, (f) => `${(clampF(f) / FARE_MAX) * 100}%`)
  // taxi rides from the left stand (6%) to the far marker (86%)
  const taxiLeftMV = useTransform(fv, (f) => {
    const dr = clampF(f) <= BASE ? 0 : (clampF(f) - BASE) / RATE
    return `${6 + Math.max(0, Math.min(1, dr / KM)) * 80}%`
  })

  return (
    <div style={{ position: 'relative', width: 'clamp(240px, 44vw, 360px)', height: 'clamp(300px, 46vh, 440px)', borderRadius: 16, border: `1.5px solid ${P.glassBorder}`, overflow: 'hidden', boxShadow: '0 12px 34px rgba(0,0,0,0.42)', background: P.nightBot }}>
      <style>{'@keyframes tmPop{0%{opacity:0;transform:translateY(6px) scale(.85)}100%{opacity:1;transform:translateY(0) scale(1)}}@keyframes tmRoll{0%{transform:translateY(0)}50%{transform:translateY(-1.5px)}100%{transform:translateY(0)}}@keyframes tmGlow{0%,100%{box-shadow:0 0 0 rgba(0,0,0,0)}50%{box-shadow:0 0 16px var(--g)}}@keyframes tmSpin{to{transform:rotate(360deg)}}'}</style>

      {/* illustrated city-street backdrop + a soft scrim so the meter/road read clearly */}
      <img src={`${ART}/taxi_street_bg.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(9,18,34,0.30), rgba(9,18,34,0.62))' }} />

      {/* ── the METER — a dark readout panel at the top ── */}
      <div style={{ position: 'absolute', top: '6%', left: '8%', right: '8%', height: 'clamp(76px,17vh,104px)', borderRadius: 12, background: P.glass, border: `1px solid ${P.glassBorder}`, padding: '9px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 'clamp(9px,1.1vw,12px)', fontWeight: 800, letterSpacing: 1, color: P.mutedOnPaper }}>METER · fare</div>
          <motion.div style={{ fontSize: 'clamp(9px,1.05vw,11px)', fontWeight: 700, color: P.mutedOnPaper }}>{drivenText}</motion.div>
        </div>
        <motion.div style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(30px,6vw,48px)', lineHeight: 1, color: fareColor, transition: 'color 380ms', textShadow: resultPhase ? `0 0 18px ${P.mint}` : undefined }}>
          {fareText}
        </motion.div>
        {/* base + rate breakdown chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 5, minHeight: 18 }}>
          {showBase && (
            <span style={{ animation: 'tmPop 300ms ease', padding: '2px 8px', borderRadius: 999, fontSize: 'clamp(8px,1vw,11px)', fontWeight: 800, background: flagFall ? `${P.coral}22` : 'rgba(255,255,255,0.06)', color: flagFall ? P.coral : P.mutedOnPaper, border: `1px solid ${flagFall ? P.coral : P.glassBorder}` }}>
              base ${BASE}
            </span>
          )}
          {stepIndex >= 4 && (
            <span style={{ animation: 'tmPop 300ms ease', padding: '2px 8px', borderRadius: 999, fontSize: 'clamp(8px,1vw,11px)', fontWeight: 800, background: `${P.gold}22`, color: P.gold, border: `1px solid ${P.gold}` }}>
              ${RATE}/km × {(driven || KM)}
            </span>
          )}
        </div>
      </div>

      {/* ── side rise-bar: base (coral) stacked under rate (gold), climbs with the fare ── */}
      <div style={{ position: 'absolute', top: '6%', right: '2.5%', width: 'clamp(9px,1.4vw,13px)', height: 'clamp(76px,17vh,104px)', borderRadius: 999, background: 'rgba(0,0,0,0.3)', overflow: 'hidden', border: `1px solid ${P.glassBorder}` }}>
        <motion.div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: risePctMV, transition: 'background 500ms', background: `linear-gradient(${P.gold}, ${P.coral})`, borderRadius: 999 }} />
      </div>

      {/* ── the ROAD ── */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '12%', height: 'clamp(58px,13vh,82px)', background: 'rgba(0,0,0,0.34)', borderTop: `2px solid ${P.glassBorder}` }}>
        {/* dashed centre line */}
        <div style={{ position: 'absolute', top: '48%', left: '3%', right: '3%', height: 2, background: `repeating-linear-gradient(90deg, ${P.mutedOnPaper} 0 14px, transparent 14px 28px)`, opacity: 0.5 }} />

        {/* km markers along the road */}
        {KM_MARKS.map((k) => {
          const passed = driven >= k
          const isDest = k === KM
          return (
            <div key={k} style={{ position: 'absolute', left: `${6 + (k / KM) * 80}%`, bottom: 4, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: isDest ? 4 : 2, height: isDest ? 16 : 10, borderRadius: 2, background: passed ? (isDest ? P.mint : P.gold) : P.mutedOnPaper, transition: 'background 400ms', boxShadow: passed && isDest ? `0 0 8px ${P.mint}` : undefined }} />
              <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(8px,1vw,11px)', fontWeight: 800, color: passed ? (isDest ? P.mint : P.gold) : P.mutedOnPaper, transition: 'color 400ms' }}>{k}</div>
            </div>
          )
        })}

        {/* the TAXI — an illustrated cab that glides forward down the road (faces right = travel dir) */}
        <motion.div style={{ position: 'absolute', bottom: '30%', left: taxiLeftMV, x: '-50%', zIndex: 3 }}>
          <div style={{ animation: rolling ? 'tmRoll 620ms ease-in-out infinite' : undefined }}>
            <img src={`${ART}/taxi_cab.png`} alt="" style={{ display: 'block', width: 'clamp(58px,12vw,88px)', height: 'auto', filter: resultPhase ? `drop-shadow(0 0 14px ${P.mint})` : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' }} />
          </div>
        </motion.div>
      </div>

      {/* ── the rule, shown between meter and road ── */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '92%' }}>
        <div style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(17px,3.4vw,27px)', color: resultPhase ? P.mint : P.cream, transition: 'color 400ms', letterSpacing: 0.5 }}>
          {resultPhase
            ? <>3 × 4 + 2 = <span style={{ color: P.mint }}>14</span></>
            : intro
              ? <span style={{ color: P.gold }}>fare = 3x + 2</span>
              : <>3 × <span style={{ color: P.gold }}>4</span> + 2</>}
        </div>
        {!intro && !resultPhase && (
          <div style={{ marginTop: 3, fontSize: 'clamp(9px,1.2vw,12px)', fontWeight: 700, color: P.mutedOnPaper }}>
            x = 4 km · ${RATE}/km, then + ${BASE} base
          </div>
        )}
        {resultPhase && (
          <div style={{ marginTop: 4, animation: 'tmPop 380ms ease', display: 'inline-block', padding: '3px 12px', borderRadius: 999, background: `${P.mint}1f`, border: `1px solid ${P.mint}`, color: P.mint, fontWeight: 800, fontSize: 'clamp(10px,1.3vw,13px)' }}>
            the fare is $14 ✓
          </div>
        )}
      </div>
    </div>
  )
}
const GUIDED_TASK: Task = {
  title: 'Work out the fare', badge: 'x + 2 where x=3', tone: 'a', answer: 5,
  prompt: 'The fare rule is x + 2, where x is the km. For a 3 km ride, set the meter, then press SET FARE.',
  say: 'The fare rule is x plus two. For a three km ride, work out the fare, set the meter, then press set fare.',
  work: ['Put 3 in place of x.', '3 + 2 = 5.'],
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'algebraicExpressions',
  title: 'TAXI METER',
  motif: '🚕',
  ticketLabel: 'fare card',
  palette: P,
  makeTask,
  initialValue: () => 0,
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <SlideValue P={palette} value={value} setValue={setValue} min={MIN} max={MAX} step={1} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="SET FARE ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'drag',
    steps: [
      { say: "Welcome to the taxi meter! The fare follows a rule — you set the meter to how much the ride costs.", value: 0, hand: 'drag' },
      { say: 'The fare rule for this taxi is three x plus two, where x is the number of km.', value: 0, board: 'fare = 3x + 2' },
      { say: 'The little x just stands for how far the ride is — the number of km.', value: 0, board: 'x = the number of km' },
      { say: 'This ride is four km. So x is four.', value: 0, board: 'x = 4' },
      { say: 'For a four km ride, we put four in place of x — everywhere we see an x, we write a four.', value: 0, board: '3 × 4 + 2' },
      { say: 'Now we just work it out. The times comes before the plus, so do three times four first.', value: 0, board: 'do 3 × 4 first' },
      { say: 'Three times four is twelve. Watch the meter climb to twelve.', value: 12, hand: 'drag', board: '= 12 + 2' },
      { say: 'Now add the two base fare. Twelve plus two is fourteen. Watch the meter climb the last two.', value: 14, hand: 'drag', board: '= 14' },
      { say: 'So the fare for a four km ride is fourteen dollars — that is three x plus two at work.', value: 14, board: 'the fare is $14' },
      { say: "When the meter is set, press Set Fare. Now let's try one together.", value: 14, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'drag',
  },
  TutorialScene: TaxiMeterScene,
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re driving the taxi.</strong> For each ride, use the fare rule, work out the cost, and set the meter.</>, ticket: { title: 'Fare 2x + 1', badge: 'x km → ?', tone: 'a' }, startLabel: 'Start the meter →' },
  overview: {
    say: "Here is what we are figuring out: a taxi fare follows a rule with a letter in it. Our rule is three x plus two, where x is the number of km. This ride is four km, so we swap x for four and work out three times four plus two.",
    problem: <>What does the meter show? We&apos;ll use the fare rule <strong>3x + 2</strong> for a <strong>4 km ride</strong>.</>,
    points: [
      <>The <strong>x</strong> just stands for the distance — here <strong>x = 4</strong> km.</>,
      <>Swap x for 4, so we&apos;re working out <strong>3 × 4 + 2</strong>.</>,
      <>Times before plus: <strong>3 × 4 = 12</strong>, then <strong>+ 2</strong> gives the fare.</>,
    ],
  },
  sig: (t) => t.badge,
}

export default function FunctionFactory(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
