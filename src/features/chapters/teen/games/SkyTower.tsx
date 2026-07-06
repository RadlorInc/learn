'use client'
/**
 * SkyTower — the Signed & Rational Ops chapter as a PLAYABLE GAME.
 * World: a tower lift. The kid works the elevator, moving the car up and down a
 * signed shaft (ElevatorShaft). Floors ABOVE the ground line are positive;
 * basements BELOW it are negative — so a negative result is something you SEE:
 * the car drops below ground. Adding/subtracting = riding up/down; multiplying &
 * dividing signed numbers land it on the floor it reaches. No slides, no MCQ.
 * Shared adaptive engine underneath.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, ElevatorShaft, pick, signed, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#241f3a', nightBot: '#15122a',
  cream: '#f3efff', creamSoft: 'rgba(243,239,255,0.82)',
  inkOnPaper: '#241c3a', mutedOnPaper: '#7d759c',
  gold: '#ffcf5c', goldDeep: '#e0a534',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#4fd6a0',
  glass: 'rgba(24,18,44,0.62)', glassBorder: 'rgba(243,239,255,0.22)',
}

// `start` = the floor the car BEGINS on. For a "ride" (add/subtract) it's the
// starting floor stated in the prompt, so the kid counts from there (e.g. floor 1
// → down 3 → −2). For ×/÷ ("move to the result") there's no journey, so start at 0.
interface Task extends BaseTask { answer: number; start: number }
const MIN = -20, MAX = 20

const toneFor = (n: number): 'a' | 'b' => (n < 0 ? 'b' : 'a')

function addSub(): Task {
  const [a, b] = pick([[-3, 5], [4, -6], [-2, -3], [-7, 7], [5, -8], [2, -9], [-4, 3], [6, -4]])
  const ans = a + b
  const move = b > 0 ? `up ${b}` : `down ${-b}`
  return {
    title: 'One ride', badge: `${a} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`, tone: toneFor(ans),
    prompt: `The lift is on floor ${a}. It goes ${move} floors. Move the car to where it stops.`,
    say: `The lift is on floor ${signed(a)}. It goes ${b > 0 ? `up ${b}` : `down ${-b}`} floors. Move the car to where it stops.`,
    answer: ans, start: a,
    work: [`Start at ${a}, go ${Math.abs(b)} ${b > 0 ? 'up' : 'down'}.`, `${a} ${b > 0 ? '+' : '−'} ${Math.abs(b)} = ${ans}.`],
  }
}
function mul(): Task {
  const [a, b] = pick([[-4, 3], [-5, -2], [6, -2], [-3, 4], [2, -7], [-6, -3]])
  const ans = a * b
  return {
    title: 'Repeat ride', badge: `${a} × ${b}`, tone: toneFor(ans),
    prompt: `${a} × ${b} = ? Move the car to the floor it reaches.`,
    say: `${signed(a)} times ${signed(b)}. Move the car to the floor it reaches.`,
    answer: ans, start: 0,
    work: [`Same signs → up (positive), different signs → down (negative).`, `${a} × ${b} = ${ans}.`],
  }
}
function div(): Task {
  const [a, b] = pick([[-8, 2], [-12, -3], [-15, 3], [10, -2], [-18, -6]])
  const ans = a / b
  return {
    title: 'Split ride', badge: `${a} ÷ ${b}`, tone: toneFor(ans),
    prompt: `${a} ÷ ${b} = ? Move the car to the floor it reaches.`,
    say: `${signed(a)} divided by ${signed(b)}. Move the car to the floor it reaches.`,
    answer: ans, start: 0,
    work: [`Same signs → up (positive), different signs → down (negative).`, `${a} ÷ ${b} = ${ans}.`],
  }
}
function chain(): Task {
  const [a, b, c] = pick([[-7, 10, -5], [3, -8, 2], [-4, -4, 6]])
  const ans = a + b + c
  const expr = `${a} ${b < 0 ? '−' : '+'} ${Math.abs(b)} ${c < 0 ? '−' : '+'} ${Math.abs(c)}`
  return {
    title: 'Long ride', badge: expr, tone: toneFor(ans),
    prompt: `Ride the lift: ${expr}.`,
    say: `Ride the lift. ${signed(a)}, then ${b < 0 ? `down ${-b}` : `up ${b}`}, then ${c < 0 ? `down ${-c}` : `up ${c}`}.`,
    answer: ans, start: a,
    work: [`Work left to right.`, `${expr} = ${ans}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [addSub, addSub, addSub]
    : d === 2 ? [mul, div, addSub]
    : [div, chain, mul]
  return pick(pool)()
}

// ── the worked example for the walkthrough (2 − 5 rides down past ground → −3) and the guided order ──
const DEMO_TASK: Task = { title: 'One ride', badge: '2 − 5', tone: 'b', answer: -3, start: 2, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'One ride', badge: '1 − 3', tone: 'b', answer: -2, start: 1,
  prompt: 'The lift is on floor 1. It goes down 3 floors. Move the car to where it stops, then press GO ✓.',
  say: 'The lift is on floor one. It goes down three floors. Move the car below the ground to where it stops, then press go.',
  work: ['Start at 1, go 3 down.', '1 − 3 = −2.'],
}

// ── Animated walkthrough scene — the storyboard, in motion (ILLUSTRATED) ──────
// A cutaway tower shaft dressed in generated illustrations (Nano Banana 2): a
// faint night-skyscraper backdrop and a cartoon lift-CAR sprite. The car GLIDES
// between floors (CSS transition on its position) one floor per narrated beat,
// crosses the gold ground line into the shaded basement, and lands mint at the
// answer — like a cartoon explainer. The shaft, floor marks/labels, gold ground
// line, readout, arrows, "below" bracket + counter stay code-drawn so the math +
// motion are exact. Driven purely by the walkthrough's per-step `value` (floor).
const TOP_FLOOR = 3, BOT_FLOOR = -4
const SCENE_FLOORS = [3, 2, 1, 0, -1, -2, -3, -4]
const pctFromTop = (f: number) => ((TOP_FLOOR - f) / (TOP_FLOOR - BOT_FLOOR)) * 100
const floorLabel = (f: number) => (f === 0 ? 'G' : f < 0 ? `B${-f}` : `${f}`)
const GLIDE = 'top 880ms cubic-bezier(.45,.05,.25,1)'
const ART = '/assets/teen/objects'

function SkyTowerScene({ palette: P, value, stepIndex, frameCount, ended }: {
  palette: Palette; value: number; stepIndex: number; frameCount: number; ended: boolean
}) {
  const v = Math.max(BOT_FLOOR, Math.min(TOP_FLOOR, value))
  const groundPct = pctFromTop(0)
  const carPct = pctFromTop(v)
  const resultPhase = ended || stepIndex >= frameCount - 2   // last 2 beats: the answer
  const intro = stepIndex === 0
  const belowGround = v < 0
  const atGround = v === 0 && stepIndex > 0
  const descending = stepIndex >= 2 && !resultPhase && v < 2
  const floorsDown = 2 - v                                   // 0..5 through the ride
  const readColor = v < 0 ? P.coral : v === 0 ? P.gold : P.cream

  return (
    <div style={{ position: 'relative', width: 'clamp(232px, 42vw, 344px)', height: 'clamp(300px, 46vh, 440px)', borderRadius: 16, background: `linear-gradient(${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, overflow: 'hidden', boxShadow: '0 12px 34px rgba(0,0,0,0.42)' }}>
      <style>{'@keyframes stGroundFlash{0%,100%{opacity:.55}50%{opacity:1}}@keyframes stBob{0%,100%{transform:translateY(-1px)}50%{transform:translateY(4px)}}@keyframes stPopIn{0%{opacity:0;transform:translate(-50%,-40%) scale(.7)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}'}</style>

      {/* illustrated night-skyscraper backdrop + a soft scrim so the shaft reads clearly */}
      <img src={`${ART}/tower_shaft_bg.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(20,16,40,0.30), rgba(20,16,40,0.60))' }} />

      {/* the shaft — the coordinate space for everything below */}
      <div style={{ position: 'absolute', top: '7%', bottom: '7%', left: '31%', width: '38%', borderRadius: 9, background: 'rgba(0,0,0,0.26)', border: `1px solid ${P.glassBorder}` }}>
        {/* basement zone (below ground) — reveals darker + coral-tinted once entered */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: `${groundPct}%`, bottom: 0, background: belowGround ? 'rgba(0,0,0,0.46)' : 'rgba(0,0,0,0.32)', transition: 'background 500ms' }} />
        {belowGround && <div style={{ position: 'absolute', left: 0, right: 0, top: `${groundPct}%`, bottom: 0, background: P.coral, opacity: 0.08 }} />}

        {/* floor lines + left-edge floor labels */}
        {SCENE_FLOORS.map((f) => (
          <div key={f}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: `${pctFromTop(f)}%`, height: f === 0 ? 3 : 1, background: f === 0 ? P.gold : P.glassBorder, opacity: f === 0 ? 1 : 0.28, animation: f === 0 && atGround ? 'stGroundFlash 700ms ease 2' : undefined, boxShadow: f === 0 && atGround ? `0 0 10px ${P.gold}` : undefined }} />
            <div style={{ position: 'absolute', left: '-15%', top: `${pctFromTop(f)}%`, transform: 'translateY(-50%)', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(9px,1.1vw,12px)', fontWeight: 800, color: f === 0 ? P.gold : f < 0 ? P.coral : P.mutedOnPaper }}>{floorLabel(f)}</div>
          </div>
        ))}

        {/* the lift car — an illustrated cabin that glides between floors */}
        <img src={`${ART}/tower_lift_car.png`} alt="" style={{ position: 'absolute', left: '50%', top: `${carPct}%`, transform: 'translate(-50%,-50%)', transition: GLIDE, width: '74%', height: 'auto', zIndex: 3, filter: resultPhase ? `drop-shadow(0 0 14px ${P.mint}) drop-shadow(0 3px 9px rgba(0,0,0,0.5))` : 'drop-shadow(0 3px 9px rgba(0,0,0,0.5))' }} />

        {/* floor readout — big number, follows the car */}
        <div style={{ position: 'absolute', left: '126%', top: `${carPct}%`, transform: 'translateY(-50%)', transition: GLIDE, fontFamily: 'var(--font-numeric)', fontSize: 'clamp(26px,4.6vw,40px)', fontWeight: 800, color: readColor, whiteSpace: 'nowrap' }}>{v}</div>

        {/* moving down-arrow cue beside the car during the descent */}
        {descending && (
          <div style={{ position: 'absolute', left: '104%', top: `${carPct}%`, transform: 'translateY(-50%)', transition: GLIDE, color: P.coral, fontSize: 'clamp(16px,2.2vw,22px)', fontWeight: 800, animation: 'stBob 900ms ease-in-out infinite' }}>↓</div>
        )}

        {/* intro: up = positive (green), down = negative (coral) */}
        {intro && (
          <>
            <div style={{ position: 'absolute', left: '108%', top: '16%', color: P.mint, fontWeight: 800, fontSize: 'clamp(12px,1.5vw,15px)', whiteSpace: 'nowrap' }}>↑ up +</div>
            <div style={{ position: 'absolute', left: '108%', top: '78%', color: P.coral, fontWeight: 800, fontSize: 'clamp(12px,1.5vw,15px)', whiteSpace: 'nowrap' }}>↓ down −</div>
          </>
        )}

        {/* result: a measuring bracket from ground down to the car */}
        {resultPhase && belowGround && (
          <>
            <div style={{ position: 'absolute', left: '104%', top: `${groundPct}%`, height: `${carPct - groundPct}%`, width: 8, borderTop: `2px solid ${P.cream}`, borderBottom: `2px solid ${P.cream}`, borderRight: `2px solid ${P.cream}`, transition: GLIDE }} />
            <div style={{ position: 'absolute', left: '118%', top: `${(groundPct + carPct) / 2}%`, transform: 'translateY(-50%)', color: P.cream, fontWeight: 700, fontSize: 'clamp(11px,1.3vw,14px)', whiteSpace: 'nowrap', transition: GLIDE }}>{-v} below</div>
          </>
        )}
      </div>

      {/* counter pill — "k of 5" through the ride */}
      {descending && floorsDown >= 1 && floorsDown <= 5 && (
        <div style={{ position: 'absolute', bottom: '2.5%', left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, color: P.coral, fontWeight: 800, fontSize: 'clamp(10px,1.2vw,13px)', animation: 'stPopIn 260ms ease' }}>{floorsDown} of 5 down</div>
      )}
    </div>
  )
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'signedRationalOps',
  title: 'SKY TOWER',
  ticketLabel: 'ride log',
  palette: P,
  makeTask,
  initialValue: (t) => t.start,
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  motif: '🏢',
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <ElevatorShaft P={palette} value={value} setValue={setValue} min={MIN} max={MAX} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="GO ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'dragV',
    steps: [
      { say: 'This is the tower lift. Drag the car UP to add floors, and DOWN to subtract. Floors above the ground are positive, basements below are negative.', value: 0, hand: 'dragV' },
      { say: 'Our ride is two minus five. Let us take it one floor at a time. First, the lift starts on floor two — that is two floors ABOVE the ground.', value: 2, hand: 'dragV', board: 'start: floor 2' },
      { say: 'Now it goes DOWN five floors. We will count each one as the car drops. Down one — from floor two to floor one.', value: 1, hand: 'dragV', board: '2 − 5 …' },
      { say: 'Down two — from floor one to floor zero. That zero is the GROUND floor. So far we have gone two floors down.', value: 0, hand: 'dragV', board: '2 down so far → ground' },
      { say: 'But we still have three more floors to go. Now the car goes BELOW the ground, into the basements. Down three — into basement floor minus one.', value: -1, hand: 'dragV', board: 'below ground: −1' },
      { say: 'Keep going. Down four — the car drops to basement floor minus two.', value: -2, hand: 'dragV', board: '−2' },
      { say: 'And down five — the last floor. The car lands on basement floor minus three.', value: -3, hand: 'dragV', board: '−3' },
      { say: 'It stopped on floor minus three — three floors below the ground. That is what two minus five means.', value: -3, board: '2 − 5 = −3' },
      { say: 'When the car is in place, press go. Now let’s try one together.', value: -3, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'dragV',
  },
  TutorialScene: SkyTowerScene,
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re running the tower lift.</strong> Move the car up and down the shaft to log every ride — above the ground into the high floors, and below it into the basements.</>, ticket: { title: 'First ride', badge: '−3 + 5', tone: 'a' }, startLabel: 'Start your shift →' },
  overview: {
    say: "Here is what we are figuring out: when a lift drops further than it can climb, it goes below the ground into the basements. We will ride the car from floor two, down five floors, and land underground — that is working out two minus five and getting a negative number.",
    problem: <>Where does the lift stop? We&apos;ll ride from <strong>floor 2, then down 5 floors</strong> — and end up <strong>below the ground</strong>.</>,
    points: [
      <>Floors above the ground are <strong>positive</strong>; basements below it are <strong>negative</strong>.</>,
      <>We&apos;re working out <strong>2 − 5</strong> by dropping the car one floor at a time.</>,
      <>Watch it cross the ground floor (zero) and keep going — that&apos;s where the answer turns <strong>negative</strong>.</>,
    ],
  },
  sig: (t) => t.badge,
}

export default function SkyTower(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
