'use client'
/**
 * NightFlight — the Coordinate-Plane chapter as a PLAYABLE GAME.
 * World: a GPS delivery drone over a city map grid. The kid flies the drone and
 * DROPS each package at its (x, y) GPS coordinate by tapping a four-quadrant map
 * (PlotGrid). Plotting is felt as "fly across, then up/down"; reflections as
 * flipping a sign; midpoints as flying to the halfway point. No slides, no MCQ.
 * Shared adaptive engine underneath.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, PlotGrid, type XY, pick } from './parts/gameKit'

const P: Palette = {
  nightTop: '#0d1626', nightBot: '#121f33',
  cream: '#eaf2ff', creamSoft: 'rgba(234,242,255,0.82)',
  inkOnPaper: '#16233a', mutedOnPaper: '#6f809a',
  gold: '#5fd0e6', goldDeep: '#2a9cbb',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#5fe0b0',
  glass: 'rgba(13,22,38,0.6)', glassBorder: 'rgba(234,242,255,0.22)',
}

interface Task extends BaseTask { answer: XY }

function plot(level: 1 | 2): Task {
  const pts: XY[] =
    level === 1
      ? [{ x: 3, y: 2 }, { x: -2, y: 3 }, { x: 4, y: -1 }, { x: 0, y: 3 }]
      : [{ x: -3, y: -2 }, { x: -4, y: 2 }, { x: 2, y: -4 }, { x: 5, y: -3 }]
  const a = pick(pts)
  return {
    title: 'Drop-off', badge: `(${a.x}, ${a.y})`, tone: a.x < 0 || a.y < 0 ? 'b' : 'a',
    prompt: `Fly the drone to the drop-off at (${a.x}, ${a.y}). Tap the map.`,
    say: `Fly the drone to ${a.x}, ${a.y}. Tap the map.`,
    answer: a,
    work: [`Fly ${a.x} across first (x), then ${a.y} up or down (y).`, `That drops it at (${a.x}, ${a.y}).`],
  }
}

function transform(): Task {
  const kind = pick(['reflectX', 'reflectY', 'midpoint'] as const)

  if (kind === 'reflectX') {
    const from = pick([{ x: 3, y: 2 }, { x: -2, y: 4 }])
    const ans: XY = { x: from.x, y: -from.y }
    return {
      title: 'Mirror drop-off', badge: `(${ans.x}, ${ans.y})`, tone: 'b',
      prompt: `Reflect the drop-off (${from.x}, ${from.y}) across the x-axis, then deliver.`,
      say: `Reflect the drop-off ${from.x}, ${from.y} across the x-axis, then deliver it.`,
      answer: ans,
      work: [`Reflecting across the x-axis flips the sign of y.`, `(${from.x}, ${from.y}) → (${ans.x}, ${ans.y}).`],
    }
  }

  if (kind === 'reflectY') {
    const from = pick([{ x: -2, y: 4 }, { x: 3, y: -1 }])
    const ans: XY = { x: -from.x, y: from.y }
    return {
      title: 'Mirror drop-off', badge: `(${ans.x}, ${ans.y})`, tone: 'b',
      prompt: `Reflect the drop-off (${from.x}, ${from.y}) across the y-axis, then deliver.`,
      say: `Reflect the drop-off ${from.x}, ${from.y} across the y-axis, then deliver it.`,
      answer: ans,
      work: [`Reflecting across the y-axis flips the sign of x.`, `(${from.x}, ${from.y}) → (${ans.x}, ${ans.y}).`],
    }
  }

  // midpoint
  const pair = pick([
    { a: { x: 2, y: 2 }, b: { x: 4, y: 6 } },
    { a: { x: -2, y: 0 }, b: { x: 2, y: 4 } },
  ])
  const ans: XY = { x: (pair.a.x + pair.b.x) / 2, y: (pair.a.y + pair.b.y) / 2 }
  return {
    title: 'Halfway drop-off', badge: `(${ans.x}, ${ans.y})`, tone: 'a',
    prompt: `Fly to the halfway point between (${pair.a.x}, ${pair.a.y}) and (${pair.b.x}, ${pair.b.y}).`,
    say: `Fly the drone to the halfway point between ${pair.a.x}, ${pair.a.y} and ${pair.b.x}, ${pair.b.y}.`,
    answer: ans,
    work: [`Average the x's and the y's.`, `Midpoint = (${ans.x}, ${ans.y}).`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  return d === 1 ? plot(1) : d === 2 ? plot(2) : transform()
}

// ── Animated walkthrough scene — the storyboard, in motion ────────────────────
// A code-drawn city map with four quadrants. The drone STARTS at the origin (base),
// flies ACROSS x units first (translateX via a CSS transition, laying a horizontal
// trail + lighting the x tick), then UP/DOWN y units (translateY, vertical trail),
// and lands on the destination pin. Labels pop in with the running coordinate.
// Driven purely by the walkthrough's per-step `value` ({x,y}) + step index.
const SCENE_RANGE = 5 // grid spans −5..5 on each axis; worked example is (3, −2)
const GLIDE = 'left 760ms cubic-bezier(.45,.05,.25,1), top 760ms cubic-bezier(.45,.05,.25,1)'
const ART = '/assets/teen/objects'

function DeliveryDroneScene({ palette: P, task, value, stepIndex, frameCount, ended }: {
  palette: Palette; task: Task; value: XY; stepIndex: number; frameCount: number; ended: boolean
}) {
  const R = SCENE_RANGE
  const dest = task.answer
  const cx = Math.max(-R, Math.min(R, value.x))
  const cy = Math.max(-R, Math.min(R, value.y))
  // map a grid coordinate to a percentage inside the plot (0..100, y inverted for screen)
  const px = (x: number) => ((x + R) / (2 * R)) * 100
  const py = (y: number) => ((R - y) / (2 * R)) * 100

  const resultPhase = ended || stepIndex >= frameCount - 2 // last 2 beats: the drop-off
  const intro = stepIndex === 0
  const movedX = cx !== 0
  const movedY = cy !== 0

  const ticks = Array.from({ length: 2 * R + 1 }, (_, i) => i - R)

  return (
    <div style={{ position: 'relative', width: 'clamp(248px, 44vw, 372px)', height: 'clamp(248px, 44vw, 372px)', borderRadius: 16, background: `linear-gradient(${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, overflow: 'hidden', boxShadow: '0 12px 34px rgba(0,0,0,0.42)' }}>
      <style>{'@keyframes nfHover{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,calc(-50% - 3px))}}@keyframes nfPin{0%{opacity:0;transform:translate(-50%,-88%) scale(.6)}100%{opacity:1;transform:translate(-50%,-100%) scale(1)}}@keyframes nfPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.7)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}@keyframes nfPulse{0%,100%{opacity:.5}50%{opacity:1}}'}</style>

      {/* illustrated aerial-map backdrop — very low opacity so the grid stays readable on top */}
      <img src={`${ART}/drone_aerial_map.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.14, pointerEvents: 'none' }} />

      {/* the plot — the coordinate space for everything below (inset square) */}
      <div style={{ position: 'absolute', top: '9%', left: '11%', right: '5%', bottom: '9%' }}>
        {/* grid lines */}
        {ticks.map((t) => (
          <div key={`v${t}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${px(t)}%`, width: t === 0 ? 2 : 1, marginLeft: t === 0 ? -1 : 0, background: t === 0 ? P.glassBorder : P.glassBorder, opacity: t === 0 ? 0.9 : 0.2 }} />
        ))}
        {ticks.map((t) => (
          <div key={`h${t}`} style={{ position: 'absolute', left: 0, right: 0, top: `${py(t)}%`, height: t === 0 ? 2 : 1, marginTop: t === 0 ? -1 : 0, background: t === 0 ? P.glassBorder : P.glassBorder, opacity: t === 0 ? 0.9 : 0.2 }} />
        ))}

        {/* horizontal trail: base → x (lit as the drone flies across) */}
        {movedX && (
          <div style={{ position: 'absolute', top: `${py(0)}%`, left: `${px(Math.min(0, cx))}%`, width: `${Math.abs(px(cx) - px(0))}%`, height: 4, marginTop: -2, borderRadius: 2, background: P.gold, boxShadow: `0 0 8px ${P.gold}`, transition: 'left 760ms cubic-bezier(.45,.05,.25,1), width 760ms cubic-bezier(.45,.05,.25,1)' }} />
        )}
        {/* vertical trail: (x,0) → (x,y) (lit as the drone flies up/down) */}
        {movedY && (
          <div style={{ position: 'absolute', left: `${px(cx)}%`, top: `${py(Math.max(0, cy))}%`, height: `${Math.abs(py(cy) - py(0))}%`, width: 4, marginLeft: -2, borderRadius: 2, background: P.coral, boxShadow: `0 0 8px ${P.coral}`, transition: 'left 760ms cubic-bezier(.45,.05,.25,1), top 760ms cubic-bezier(.45,.05,.25,1), height 760ms cubic-bezier(.45,.05,.25,1)' }} />
        )}

        {/* axis tick numbers along the x-axis (0 and the destination x light up) */}
        {ticks.filter((t) => t !== 0).map((t) => {
          const lit = (Math.abs(cx) >= Math.abs(t) && Math.sign(cx) === Math.sign(t)) && !movedY
          return (
            <div key={`xn${t}`} style={{ position: 'absolute', left: `${px(t)}%`, top: `${py(0)}%`, transform: 'translate(-50%, 3px)', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(8px,1vw,11px)', fontWeight: 800, color: lit ? P.gold : P.mutedOnPaper, opacity: lit ? 1 : 0.55, transition: 'color 300ms, opacity 300ms' }}>{t}</div>
          )
        })}

        {/* destination pin — appears once the across move begins, glows at the drop-off */}
        <div style={{ position: 'absolute', left: `${px(dest.x)}%`, top: `${py(dest.y)}%`, transform: 'translate(-50%,-100%)', animation: 'nfPin 420ms ease', pointerEvents: 'none', zIndex: 2 }}>
          <img src={`${ART}/drone_dropoff_pin.png`} alt="" style={{ display: 'block', width: 'clamp(18px,2.6vw,26px)', height: 'auto', filter: resultPhase ? `drop-shadow(0 0 10px ${P.mint})` : 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))', animation: resultPhase ? undefined : 'nfPulse 1200ms ease-in-out infinite' }} />
        </div>

        {/* the drone — glides across then down; hovers in place */}
        <div style={{ position: 'absolute', left: `${px(cx)}%`, top: `${py(cy)}%`, transition: GLIDE, zIndex: 4 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-50%,-50%)', animation: 'nfHover 1400ms ease-in-out infinite' }}>
            {/* illustrated quadcopter — kept small so it never covers gridlines */}
            <img src={`${ART}/drone_quadcopter.png`} alt="" style={{ display: 'block', width: 'clamp(26px,4vw,36px)', height: 'auto', filter: resultPhase ? `drop-shadow(0 0 12px ${P.mint})` : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))', transition: 'filter 400ms' }} />
          </div>
        </div>

        {/* running coordinate label — pops beside the drone */}
        <div style={{ position: 'absolute', left: `${px(cx)}%`, top: `${py(cy)}%`, transition: GLIDE, zIndex: 5 }}>
          <div key={`${cx},${cy},${resultPhase}`} style={{ position: 'absolute', left: cx > R - 1.5 ? -14 : 20, top: cy < -R + 1.5 ? -34 : -8, transform: 'translate(-50%,-50%)', animation: 'nfPop 300ms ease', padding: '3px 9px', borderRadius: 999, background: resultPhase ? P.mint : P.glass, border: `1px solid ${resultPhase ? P.mint : P.glassBorder}`, color: resultPhase ? P.inkOnPaper : P.cream, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(12px,1.5vw,16px)', whiteSpace: 'nowrap' }}>
            ({cx}, {cy})
          </div>
        </div>
      </div>

      {/* axis captions */}
      <div style={{ position: 'absolute', bottom: '1.5%', right: '5%', color: P.gold, fontWeight: 800, fontSize: 'clamp(9px,1.1vw,12px)', opacity: 0.85 }}>x → across</div>
      <div style={{ position: 'absolute', top: '9%', left: '1.5%', color: P.coral, fontWeight: 800, fontSize: 'clamp(9px,1.1vw,12px)', opacity: 0.85, writingMode: 'vertical-rl' as const }}>y ↑ up / down</div>

      {/* intro hint: base at the centre */}
      {intro && (
        <div style={{ position: 'absolute', bottom: '2%', left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, color: P.creamSoft, fontWeight: 700, fontSize: 'clamp(10px,1.2vw,13px)', whiteSpace: 'nowrap' }}>base at (0, 0)</div>
      )}
      {/* result banner */}
      {resultPhase && (
        <div style={{ position: 'absolute', bottom: '2%', left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', borderRadius: 999, background: P.mint, color: P.inkOnPaper, fontWeight: 800, fontSize: 'clamp(10px,1.3vw,14px)', whiteSpace: 'nowrap', boxShadow: `0 0 12px ${P.mint}` }}>dropped at ({dest.x}, {dest.y}) ✓</div>
      )}
    </div>
  )
}

// ── worked example for the walkthrough (deliver to (3, −2)) + guided order (2, 1) ──
const DEMO_TASK: Task = { title: 'Drop-off', badge: '(3, −2)', tone: 'b', answer: { x: 3, y: -2 }, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'Drop-off', badge: '(2, 1)', tone: 'a', answer: { x: 2, y: 1 },
  prompt: 'Deliver to (2, 1): two across, one up. Tap the map, then press Deliver.',
  say: 'Deliver to two, one. Fly two across, then one up, then press deliver.',
  work: ['Fly 2 across first (x), then 1 up (y).', 'That drops it at (2, 1).'],
}

const CONFIG: GameConfig<XY, Task> = {
  chapterId: 'coordinatePlane',
  title: 'DELIVERY DRONE',
  ticketLabel: 'drop order',
  motif: '📍',
  palette: P,
  makeTask,
  initialValue: () => ({ x: 0, y: 0 }),
  grade: (t, v) => v.x === t.answer.x && v.y === t.answer.y,
  revealText: (t) => `(${t.answer.x}, ${t.answer.y})`,
  glide: (t, _from, setValue) => setValue(t.answer),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <PlotGrid P={palette} point={value} setPoint={setValue} range={6} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="DROP ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: { x: 0, y: 0 },
    hand: 'tap',
    steps: [
      { say: "Delivery drone! This is the city map. Every drop-off has two numbers — an across number and an up-or-down number.", value: { x: 0, y: 0 }, hand: 'tap', board: 'drop-off = (across, up/down)' },
      { say: "The two numbers are called x and y. The first one, x, is the ACROSS. The second one, y, is UP or DOWN.", value: { x: 0, y: 0 }, hand: 'tap', board: 'x = across   y = up/down' },
      { say: "Always start at the middle — zero, zero. That's the drone base, right in the centre.", value: { x: 0, y: 0 }, hand: 'tap', board: 'start at 0, 0' },
      { say: "Our drop-off is three, minus two. Let's read it one number at a time.", value: { x: 0, y: 0 }, hand: 'tap', board: 'drop-off (3, −2)' },
      { say: "First number is three — that's the across, x. A positive number means go RIGHT.", value: { x: 0, y: 0 }, hand: 'tap', board: 'across x: 3 → right' },
      { say: "So count one, to the right.", value: { x: 1, y: 0 }, hand: 'tap', board: 'right: 1' },
      { say: "Two, keep going right.", value: { x: 2, y: 0 }, hand: 'tap', board: 'right: 1, 2' },
      { say: "Three. Now we're three across, sitting on the middle line.", value: { x: 3, y: 0 }, hand: 'tap', board: 'across x: 3 ✓' },
      { say: "Second number is minus two — that's the up-or-down, y. A negative number means go DOWN.", value: { x: 3, y: 0 }, hand: 'tap', board: 'down y: −2 ↓' },
      { say: "So count one, down below the line.", value: { x: 3, y: -1 }, hand: 'tap', board: 'down: 1' },
      { say: "Two, keep going down.", value: { x: 3, y: -2 }, hand: 'tap', board: 'down: 1, 2' },
      { say: "We've landed on three, minus two — three across, two down. That's the drop-off!", value: { x: 3, y: -2 }, board: '✓ (3, −2)' },
      { say: "Drop the package right there. When you're on the drop-off, press drop. Now let's try one together.", value: { x: 3, y: -2 }, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'tap',
  },
  TutorialScene: DeliveryDroneScene,
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re piloting the delivery drone.</strong> Read each GPS drop-off, fly across then up or down, and drop the package right on the map.</>, ticket: { title: 'First drop', badge: '(3, 2)', tone: 'a' }, startLabel: 'Launch the drone →' },
  overview: {
    say: "Here is what we are figuring out: every drop-off on the map is two numbers — an across number and an up-or-down number. We will fly the drone to three, minus two: three across, then two down, so you can read a coordinate and land right on it.",
    problem: <>Where is <strong>(3, −2)</strong>? We&apos;ll fly the drone <strong>3 across, then 2 down</strong> and drop the package there.</>,
    points: [
      <>The first number is <strong>x = 3</strong> (across) — positive means go <strong>right</strong>.</>,
      <>The second number is <strong>y = −2</strong> (up/down) — negative means go <strong>down</strong>.</>,
      <>Always start from the base at <strong>(0, 0)</strong>: across first, then up or down.</>,
    ],
  },
  sig: (t) => t.badge,
}

export default function NightFlight(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
