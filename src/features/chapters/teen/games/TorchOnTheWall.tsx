'use client'
/**
 * TorchOnTheWall — the Conic Sections chapter (17–18) as a PLAYABLE GAME.
 *
 * World: TORCH ON THE WALL. A torch throws a cone of light. The wall cuts that
 * cone with a plane — which is not a metaphor for a conic section, it IS the
 * definition, and it is doable tonight with a phone light:
 *   • straight on          → a CIRCLE
 *   • tilted a little      → an ELLIPSE, stretched the way you tilted
 *   • tilted until one edge of the beam runs parallel to the wall → a PARABOLA
 *   • tilted past that     → a HYPERBOLA, one open branch on the wall
 *
 * So "classify this conic" stops being a card you recall and becomes something you
 * do with your hand. The TILT DIAL is the answer: the child turns the torch until
 * the wall shows the shape the equation describes, and the tilt band they land in
 * IS the classification. The plan (§5.2) had this committed on a 4-card picker
 * afterwards; the tilt alone already says which one it is, so the picker is gone
 * and the chapter's classification question has ZERO cards.
 *
 *   • BUILD → THE AIM PAD: the centre of a circle and the vertex of a parabola —
 *             two integers in a template, which is a thing to build.
 *   • TAP   → AnswerPad: the radius, and how far an ellipse reaches along its long
 *             direction (which is where the bigger denominator went).
 *   • TILT  → THE TORCH: circle · ellipse · parabola · hyperbola, performed.
 *   • PICK  → SpecPicker, ONCE: which way a parabola opens. Four directions with
 *             no number to produce; the cards are arrows, so it reads as aiming.
 *             That is 1 of the ~10 pickers budgeted for the band (plan §3).
 *
 * The math is the old ConicSectionsTeenLesson.makeRound, same L1/L2/L3 ramp. One
 * item is re-asked rather than re-worded: the ellipse's major axis was
 * "horizontal or vertical", a two-card choice; it is now HOW FAR the beam reaches
 * along that axis, which needs the same reading (find the bigger denominator) and
 * comes out as a number. Nothing was added.
 */
import { type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SpecPicker, PartsBuilder, CommitBtn, Nudge, numChoices } from './parts/gameKit'
import { rint } from '@/core/rand'

const P: Palette = {
  nightTop: '#241d12', nightBot: '#0d0a05',
  cream: '#fbf2df', creamSoft: 'rgba(251,242,223,0.82)',
  inkOnPaper: '#241d12', mutedOnPaper: '#9d8c6c',
  gold: '#ffd97a', goldDeep: '#c99a1f',
  coral: '#ff9a72', coralDeep: '#dd6234', mint: '#8fdcae',
  glass: 'rgba(36,29,18,0.62)', glassBorder: 'rgba(251,242,223,0.2)',
}

const fmt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

type Conic = 'circle' | 'ellipse' | 'parabola' | 'hyperbola'

// A built pair, a tapped or tilted number, or an aimed direction.
type V = { k: 'pair'; a: number; b: number } | { k: 'num'; n: number } | { k: 'pick'; id: string }

interface Task extends BaseTask {
  kind: 'centre' | 'radius' | 'type' | 'aim' | 'vertex' | 'reach'
  n?: number; pad?: number[]
  pa?: number; pb?: number; labels?: [string, string]
  conic?: Conic
  correctId?: string; choices?: { id: string; label: string }[]
}

// ── the torch's own geometry ──────────────────────────────────────────────────
/** The beam's half-angle. Tilt the torch this far off square to the wall and one
 *  edge of the cone runs parallel to it — the parabola case, exactly. */
const HALF_ANGLE = 30
const PARABOLA_TILT = 90 - HALF_ANGLE          // 60°
const TILT_STOPS = [0, 15, 30, 45, 60, 75]
const conicAt = (tilt: number): Conic =>
  tilt === 0 ? 'circle'
    : tilt < PARABOLA_TILT ? 'ellipse'
      : tilt === PARABOLA_TILT ? 'parabola' : 'hyperbola'
/** A canonical tilt per shape, used for the reveal glide and the walkthrough. */
const tiltFor = (c: Conic) => (c === 'circle' ? 0 : c === 'ellipse' ? 30 : c === 'parabola' ? 60 : 75)

// ── L1 · the circle the torch makes standing square on ────────────────────────
function circleEqn(h: number, k: number, r: number) {
  const hf = h === 0 ? 'x' : `(x ${h > 0 ? '−' : '+'} ${Math.abs(h)})`
  const kf = k === 0 ? 'y' : `(y ${k > 0 ? '−' : '+'} ${Math.abs(k)})`
  return `${hf}² + ${kf}² = ${r * r}`
}

function centreTask(): Task {
  const h = rint(-4, 4), k = rint(-4, 4), r = rint(2, 6)
  return {
    kind: 'centre', title: 'Where it lands', tone: 'a',
    badge: circleEqn(h, k, r), showEquals: false,
    prompt: 'Where is the middle of the patch?',
    // True whether or not h or k is 0 — a bare x² is the h = 0 case, not an exception.
    context: 'Stand square on to the wall and the light lands as a circle. The equation is built out of two squared parts, and the middle of the patch is wherever both of them collapse to nothing at once — so read off the number that would make each one vanish.',
    instruction: 'Build the middle of the patch, then lock it in.',
    say: 'Where is the centre of this circle?',
    work: [
      'A squared part is zero only when the thing inside it is zero.',
      `The x part vanishes at ${fmt(h)} and the y part vanishes at ${fmt(k)}.`,
      `So the centre is (${fmt(h)}, ${fmt(k)}) — the number inside comes out with its sign flipped.`,
    ],
    pa: h, pb: k, labels: ['across', 'up'],
  }
}

function radiusTask(): Task {
  const h = rint(-4, 4), k = rint(-4, 4), r = rint(2, 6)
  return {
    kind: 'radius', title: 'How wide', tone: 'b',
    badge: circleEqn(h, k, r), answerLabel: 'radius =',
    prompt: 'How far does it reach?',
    context: `Every point on the edge of the patch sits the same distance from the middle, and that distance is the radius. What the equation has written on the right is that distance SQUARED, so ${r * r} is not the answer — it is the answer multiplied by itself.`,
    padInstruction: 'Tap the radius.',
    say: 'What is the radius of this circle?',
    work: [
      `The right-hand side is r², so r² = ${r * r}.`,
      `The number that gives ${r * r} when multiplied by itself is ${r}.`,
    ],
    // r² is the classic "forgot to take the root" slip.
    n: r, pad: [r * r, r + 1, r - 1],
  }
}

// ── L2 · tilt the torch until the wall shows that shape ───────────────────────
const FORMS: { eqn: string; say: string; conic: Conic }[] = [
  { eqn: 'x² + y² = 25', say: 'x squared plus y squared equals twenty five', conic: 'circle' },
  { eqn: 'x²/25 + y²/25 = 1', say: 'x squared over twenty five plus y squared over twenty five equals one', conic: 'circle' },
  { eqn: 'x²/9 + y²/4 = 1', say: 'x squared over nine plus y squared over four equals one', conic: 'ellipse' },
  { eqn: 'x²/16 + y²/25 = 1', say: 'x squared over sixteen plus y squared over twenty five equals one', conic: 'ellipse' },
  { eqn: 'x²/16 − y²/9 = 1', say: 'x squared over sixteen minus y squared over nine equals one', conic: 'hyperbola' },
  { eqn: 'x² − y² = 1', say: 'x squared minus y squared equals one', conic: 'hyperbola' },
  { eqn: 'y = 2x²', say: 'y equals two x squared', conic: 'parabola' },
  { eqn: 'x = 3y²', say: 'x equals three y squared', conic: 'parabola' },
]

const WHY: Record<Conic, string> = {
  circle: 'Both squares are added and they are scaled the same, so nothing is stretched — that is a circle, and the torch is square on.',
  ellipse: 'Both squares are added but scaled differently, so one direction is stretched — that is an ellipse, and the torch is tilted.',
  parabola: 'Only ONE of the two is squared. That is a parabola, and it is the exact tilt where one edge of the beam runs parallel to the wall.',
  hyperbola: 'The two squares are subtracted, not added. A minus between them is a hyperbola — tilt past the parabola and the patch opens out.',
}

function typeTask(): Task {
  const f = pickOne(FORMS)
  return {
    kind: 'type', title: 'Tilt it', tone: 'a',
    badge: f.eqn, showEquals: false,
    prompt: 'Which shape is this?',
    context: 'A torch throws a cone of light and the wall slices straight through it, so every shape the beam can make on the wall is a slice of that cone. Read what the equation is doing with its two squared terms — added, subtracted, or only one of them there at all — and tilt the torch until the wall agrees.',
    instruction: 'Tilt the torch until the wall shows this shape, then lock it in.',
    say: `Which conic section is ${f.say}?`,
    work: [
      WHY[f.conic],
      f.conic === 'circle' ? 'So hold the torch square on to the wall.'
        : f.conic === 'ellipse' ? 'So tilt the torch part-way.'
          : f.conic === 'parabola' ? 'So tilt it to exactly the angle where the beam edge goes parallel.'
            : 'So tilt it past that angle.',
    ],
    conic: f.conic, n: tiltFor(f.conic),
  }
}

// ── L3 · aiming, the vertex, and how far the light reaches ────────────────────
/** ⚠️ The chapter's ONE picker (see the header): a direction has no number to
 *  build. The cards are arrows so it reads as pointing the torch, not as recall. */
function aimTask(): Task {
  const a = (Math.random() < 0.5 ? 1 : -1) * rint(1, 3)
  const h = rint(-3, 3), k = rint(-3, 3)
  const aStr = a === 1 ? '' : a === -1 ? '−' : fmt(a)
  const eqn = `y = ${aStr}(x ${h >= 0 ? '−' : '+'} ${Math.abs(h)})² ${k >= 0 ? '+' : '−'} ${Math.abs(k)}`
  return {
    kind: 'aim', title: 'Which way', tone: 'b',
    badge: eqn, showEquals: false,
    prompt: 'Which way does it open?',
    context: 'This is the parabola tilt, so the light opens out from a point instead of closing into a loop. The sign of the number in front of the squared bracket is what decides which way it spills — nothing else in the equation can change it.',
    instruction: 'Aim the torch, then lock it in.',
    say: 'Which way does this parabola open?',
    work: [
      `The number in front of the bracket is ${fmt(a)}.`,
      a > 0
        ? 'It is positive, so the values climb away from the vertex and it opens upward.'
        : 'It is negative, so the values fall away from the vertex and it opens downward.',
    ],
    correctId: a > 0 ? 'up' : 'down',
    choices: [
      { id: 'up', label: '↑ opens up' },
      { id: 'down', label: '↓ opens down' },
      { id: 'left', label: '← opens left' },
      { id: 'right', label: '→ opens right' },
    ],
  }
}

function vertexTask(): Task {
  const h = rint(-4, 4), k = rint(-4, 4)
  const eqn = `y = (x ${h >= 0 ? '−' : '+'} ${Math.abs(h)})² ${k >= 0 ? '+' : '−'} ${Math.abs(k)}`
  return {
    kind: 'vertex', title: 'The tip', tone: 'a',
    badge: eqn, showEquals: false,
    prompt: 'Where is the tip?',
    context: 'The tip of the beam is the one place the squared bracket contributes nothing at all — everywhere else it adds something. Find the value that empties the bracket, and whatever is left outside it is the height there.',
    instruction: 'Build the tip, then lock it in.',
    say: 'What is the vertex of this parabola?',
    work: [
      `The bracket empties at x = ${fmt(h)} — the number inside, with its sign flipped.`,
      `At that point nothing is added, so the height is just the ${fmt(k)} outside.`,
      `The tip is (${fmt(h)}, ${fmt(k)}).`,
    ],
    pa: h, pb: k, labels: ['across', 'up'],
  }
}

/** The old lesson's "is the major axis horizontal or vertical", re-asked as a
 *  number: the same reading (which denominator is bigger) with a produced answer. */
function reachTask(): Task {
  const big = rint(3, 8)
  const small = rint(1, big - 1)
  const bigX = Math.random() < 0.5
  const dx = bigX ? big * big : small * small
  const dy = bigX ? small * small : big * big
  return {
    kind: 'reach', title: 'The long way', tone: 'b',
    badge: `x²/${dx} + y²/${dy} = 1`, answerLabel: 'reaches',
    prompt: 'How far along its long direction?',
    context: 'A tilted beam is longer one way than the other. Under each squared term sits a number, and the bigger of the two belongs to the direction the patch is stretched along. That number is the reach multiplied by itself, not the reach.',
    padInstruction: 'Tap how far it reaches the long way.',
    say: `An ellipse is x squared over ${dx} plus y squared over ${dy} equals one. How far does it reach along its long direction?`,
    work: [
      `The bigger denominator is ${Math.max(dx, dy)}, and it sits under ${bigX ? 'x²' : 'y²'} — so that is the long direction.`,
      `That number is the reach squared, so the reach is ${big}.`,
    ],
    n: big, pad: [Math.max(dx, dy), small, big + 1],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return Math.random() < 0.5 ? centreTask() : radiusTask()
  if (d === 2) return Math.random() < 0.7 ? typeTask() : radiusTask()
  const roll = Math.random()
  return roll < 0.34 ? aimTask() : roll < 0.67 ? vertexTask() : reachTask()
}

// ══════════════════════════════════════════════════════════════════════════════
// THE TORCH — tilt it, and the wall shows the slice that tilt really makes. The
// SHAPE is drawn from the child's own tilt; nothing on screen says whether it is
// the shape the equation asked for.
// ══════════════════════════════════════════════════════════════════════════════
function WallPatch({ tilt, col }: { tilt: number; col: string }) {
  const c = conicAt(tilt)
  const fill = `${col}33`
  if (c === 'circle') return <ellipse cx={116} cy={62} rx={30} ry={30} fill={fill} stroke={col} strokeWidth={2} />
  if (c === 'ellipse') {
    // Stretched by how far past square the torch has been turned.
    const rx = 30 / Math.cos((tilt * Math.PI) / 180)
    return <ellipse cx={116} cy={62} rx={Math.min(rx, 74)} ry={30} fill={fill} stroke={col} strokeWidth={2} />
  }
  if (c === 'parabola') {
    return <path d="M 44 20 Q 116 128 188 20" fill={fill} stroke={col} strokeWidth={2} />
  }
  return (
    <>
      <path d="M 52 14 Q 116 62 52 110" fill="none" stroke={col} strokeWidth={2} />
      <path d="M 180 14 Q 116 62 180 110" fill="none" stroke={col} strokeWidth={2} />
    </>
  )
}

function Torch({ value, setValue, disabled, reveal, onCommit }: {
  value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const tilt = value.k === 'num' ? value.n : 0
  const i = Math.max(0, TILT_STOPS.indexOf(tilt))
  const col = reveal ? P.mint : P.gold
  const name = conicAt(tilt)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      <svg viewBox="0 0 232 124" width="100%" style={{ maxWidth: 'clamp(200px, 26vw, 320px)', display: 'block' }} aria-hidden>
        <rect x={0} y={0} width={232} height={124} rx={10} fill="rgba(0,0,0,0.3)" stroke={P.glassBorder} strokeWidth={1} />
        <WallPatch tilt={tilt} col={col} />
        {/* the torch itself, turned by the same angle */}
        <g transform={`rotate(${-tilt} 20 108)`}>
          <rect x={8} y={102} width={26} height={11} rx={3} fill={P.creamSoft} />
          <path d="M 34 100 L 52 96 L 52 119 L 34 115 Z" fill={col} opacity={0.75} />
        </g>
      </svg>

      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(19px,2.5vw,32px)', fontWeight: 800, color: col, textTransform: 'capitalize' }}>
        {name}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1vw,14px)' }}>
        <Nudge P={P} label="−" disabled={disabled || i <= 0} onClick={() => setValue({ k: 'num', n: TILT_STOPS[Math.max(0, i - 1)] })} />
        <span style={{ minWidth: 'clamp(52px,5vw,72px)', textAlign: 'center', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(16px,1.8vw,24px)', color: P.cream }}>
          {tilt}° tilt
        </span>
        <Nudge P={P} label="+" disabled={disabled || i >= TILT_STOPS.length - 1} onClick={() => setValue({ k: 'num', n: TILT_STOPS[Math.min(TILT_STOPS.length - 1, i + 1)] })} />
      </div>

      <CommitBtn P={P} label="HOLD IT ✓" disabled={disabled} onClick={() => onCommit({ k: 'num', n: tilt })} />
    </div>
  )
}

// ── the aim pad — a built pair, on the shared PartsBuilder ────────────────────
function AimPad({ task, value, setValue, disabled, reveal, onCommit }: {
  task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const a = value.k === 'pair' ? value.a : 0
  const b = value.k === 'pair' ? value.b : 0
  return (
    <PartsBuilder P={P} value={{ a, b }} setValue={(p) => setValue({ k: 'pair', a: p.a, b: p.b })}
      min={-9} max={9} labels={task.labels ?? ['across', 'up']}
      template={(x, y) => `(${fmt(x)}, ${fmt(y)})`}
      disabled={disabled} reveal={reveal} onCommit={(p) => onCommit({ k: 'pair', a: p.a, b: p.b })}
      commitLabel="AIM IT ✓" />
  )
}

// ── walkthrough: tilt the torch, then read a circle off its equation ──────────
const DEMO_TYPE: Task = {
  kind: 'type', title: 'Tilt it', badge: 'x²/9 + y²/4 = 1', tone: 'a',
  prompt: '', say: '', work: [], conic: 'ellipse', n: 30,
}
const DEMO_TYPE_STEPS: DemoStep<V>[] = [
  { say: 'Point a torch straight at a wall and the light lands as a circle. That circle is a slice through the cone of light.', value: { k: 'num', n: 0 }, board: 'square on → circle' },
  { say: 'Every other shape in this chapter is the same cone, sliced at a different angle. Nothing else changes.', value: { k: 'num', n: 0 }, board: 'one cone, many slices' },
  { say: 'Here is the equation. Two squared terms, added together — so the light closes into a loop rather than opening out.', value: { k: 'num', n: 0 }, board: 'x²/9 + y²/4 = 1' },
  { say: 'But they are divided by different numbers, nine and four. That means one direction is stretched more than the other.', value: { k: 'num', n: 15 }, board: '9 ≠ 4 → stretched' },
  { say: 'A stretched loop is an ellipse, and you get one by tilting the torch part-way. Watch the patch pull out sideways.', value: { k: 'num', n: 30 }, board: 'tilt → ellipse' },
  { say: 'Keep going and at sixty degrees one edge of the beam runs parallel to the wall — the light stops closing and you get a parabola.', value: { k: 'num', n: 60 }, board: '60° → parabola' },
  { say: 'Past that it opens right out into a hyperbola. Added is a loop, subtracted is a hyperbola, and one square on its own is a parabola.', value: { k: 'num', n: 75 }, board: 'past 60° → hyperbola' },
  { say: 'This one was added and stretched, so it is an ellipse. Back to the tilt that makes one.', value: { k: 'num', n: 30 }, board: 'ellipse ✓' },
]

const DEMO_CENTRE: Task = {
  kind: 'centre', title: 'Where it lands', badge: '(x − 2)² + (y + 3)² = 16', tone: 'a',
  prompt: '', say: '', work: [], pa: 2, pb: -3, labels: ['across', 'up'],
}
const DEMO_CENTRE_STEPS: DemoStep<V>[] = [
  { say: 'Now stand square on again, so the patch is a circle, and ask where on the wall it actually landed.', value: { k: 'pair', a: 0, b: 0 }, board: '(x − 2)² + (y + 3)² = 16' },
  { say: 'A squared thing is never negative, so each of these two parts is smallest when it is zero.', value: { k: 'pair', a: 0, b: 0 }, board: 'a square is 0 at its smallest' },
  { say: 'The first one is zero when x minus two is zero — so two across.', value: { k: 'pair', a: 2, b: 0 }, board: '(x − 2) = 0 → 2 across' },
  { say: 'The second is zero when y plus three is zero. Plus three, so that is negative three up. The sign inside always flips on the way out.', value: { k: 'pair', a: 2, b: -3 }, board: '(y + 3) = 0 → −3 up' },
  { say: 'So the middle of the patch is two across, three down. The sixteen on the right has nothing to do with where it is — that is how big it is.', value: { k: 'pair', a: 2, b: -3 }, board: 'centre (2, −3)' },
]

// ══════════════════════════════════════════════════════════════════════════════
const CONFIG: GameConfig<V, Task> = {
  chapterId: 'conicSections',
  title: 'TORCH ON THE WALL',
  ticketLabel: 'beam log',
  palette: P,
  motif: '🔦',
  makeTask,
  answerPad: (t) => (t.kind === 'radius' || t.kind === 'reach' ? numChoices(t.n ?? 0, t.pad ?? [], { min: 1 }) : []),
  // REQUIRED: V is a tagged union (docs/lessons.md — the 15–16 prod bug).
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) =>
    t.kind === 'centre' || t.kind === 'vertex' ? { k: 'pair', a: 0, b: 0 }
      : t.kind === 'aim' ? { k: 'pick', id: '' }
        : { k: 'num', n: 0 },
  grade: (t, v) =>
    t.kind === 'centre' || t.kind === 'vertex' ? v.k === 'pair' && v.a === t.pa && v.b === t.pb
      : t.kind === 'aim' ? v.k === 'pick' && v.id === t.correctId
        // Any tilt inside the band is right, because any tilt inside it really
        // does make that shape — the band IS the classification.
        : t.kind === 'type' ? v.k === 'num' && conicAt(v.n) === t.conic
          : v.k === 'num' && v.n === t.n,
  revealText: (t) =>
    t.kind === 'centre' || t.kind === 'vertex' ? `(${fmt(t.pa ?? 0)}, ${fmt(t.pb ?? 0)})`
      : t.kind === 'aim' ? (t.choices?.find((c) => c.id === t.correctId)?.label ?? '')
        : t.kind === 'type' ? (t.conic ?? '')
          : fmt(t.n ?? 0),
  glide: (t, _f, setValue, later) => later(() => setValue(
    t.kind === 'centre' || t.kind === 'vertex' ? { k: 'pair', a: t.pa ?? 0, b: t.pb ?? 0 }
      : t.kind === 'aim' ? { k: 'pick', id: t.correctId ?? '' }
        : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }): ReactElement => {
    if (task.kind === 'aim') {
      return <SpecPicker P={palette} choices={task.choices ?? []} value={value.k === 'pick' ? value.id : ''}
        setValue={(id) => setValue({ k: 'pick', id })} correct={task.correctId} disabled={disabled} reveal={reveal}
        onCommit={(id) => onCommit({ k: 'pick', id })} commitLabel="AIM IT ✓" prompt="point the torch" />
    }
    if (task.kind === 'centre' || task.kind === 'vertex') {
      return <AimPad task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
    }
    return <Torch value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
  },
  TutorialScene: ({ task, value }) =>
    task.kind === 'centre'
      ? <AimPad task={task} value={value} setValue={() => {}} disabled onCommit={() => {}} />
      : <Torch value={value} setValue={() => {}} disabled onCommit={() => {}} />,
  start: {
    blurb: <><strong>A torch, and a wall.</strong> The light comes out as a cone and the wall slices straight through it — so tilting your hand really does turn a circle into an ellipse, then a parabola, then a hyperbola. Tilt to match the equation, and read where the patch lands and how far it reaches.</>,
    ticket: { title: 'Beam log', badge: 'x²/9 + y²/4 = 1', tone: 'a' },
    startLabel: 'Switch it on →',
  },
  overview: {
    say: 'Here is the plan. A torch throws a cone of light, and the wall cuts through that cone. Hold it square on and you get a circle. Tilt it and the circle stretches into an ellipse. Tilt until one edge of the beam runs along the wall and it stops closing up — that is a parabola. Tilt past that and it opens right out into a hyperbola. All four come from one cone and one wall, and the equation tells you which tilt you are looking at. Let us do one together, nice and slow.',
    problem: <>Which shape is <strong>x²/9 + y²/4 = 1</strong>?</>,
    points: [
      <>Two squares <strong>added</strong>, scaled the same → a <strong>circle</strong>.</>,
      <>Added, scaled <strong>differently</strong> → an <strong>ellipse</strong>.</>,
      <>Only <strong>one</strong> square → a <strong>parabola</strong>.</>,
      <>Two squares <strong>subtracted</strong> → a <strong>hyperbola</strong>.</>,
    ],
  },
  tutorial: [
    { task: DEMO_TYPE, initial: { k: 'num', n: 0 }, hand: 'crank', steps: DEMO_TYPE_STEPS },
    { task: DEMO_CENTRE, initial: { k: 'pair', a: 0, b: 0 }, hand: 'tap', steps: DEMO_CENTRE_STEPS },
  ],
  sig: (t) => `${t.kind}:${t.badge}:${t.prompt}`,
}

export default function TorchOnTheWall(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
