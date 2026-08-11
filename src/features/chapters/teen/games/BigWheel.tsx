'use client'
/**
 * BigWheel — the Unit Circle & Trig chapter (17–18) as a PLAYABLE GAME.
 *
 * World: THE BIG WHEEL. A Ferris wheel, which IS a unit circle with a pod on it:
 *   • your pod's ANGLE round the wheel is the angle
 *   • its POSITION is the coordinate — across is cosine, up is sine
 *   • the QUADRANTS are the four quarters of the ride, and which of across/up is
 *     negative depends only on which quarter you are in
 *   • a full turn is 360°, which is also 2π — the same trip, counted two ways
 *
 *   • BUILD → PartsBuilder on the template (a/b)π: a radian measure is two integers
 *             in a template, not a card to recognise.
 *   • TAP   → AnswerPad: sine and cosine at the quarter-turns, and the reference
 *             angle (how far your pod is from level, whichever quarter it is in).
 *   • RIDE  → CircleTap: step the pod round the wheel and stop it at the angle a
 *             stated position corresponds to. The gesture the chapter is named for.
 *   • SET   → two ± switches, one for across and one for up: the signs in a
 *             quarter, performed rather than recalled from a mnemonic.
 *   • PICK  → SpecPicker, ONCE: the exact coordinate pair. (√3/2, 1/2) is not
 *             buildable on integer steppers and is not a number to tap, so it is
 *             the rung-3 case (plan §3) — 1 of the band's ~10 pickers.
 *
 * The math is the old UnitCircleTrigTeenLesson.makeRound, same L1/L2/L3 ramp.
 *
 * ⚠️ THE LAW OF COSINES IS DELIBERATELY NOT HERE. The plan (§5) chose this world
 * partly because the straight-line gap between two pods really is the law of
 * cosines with the radius as both sides — a genuinely lovely fit. But the old
 * lesson never generated it and `conceptsConfirmed` does not claim it, so adding it
 * would be growing the syllabus during a port. Same call as TrainingBlock's Pascal
 * and Cold Snap's synthetic division. It is the first thing to add if this chapter
 * is ever extended.
 */
import { type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SpecPicker, PartsBuilder, CircleTap, CommitBtn, numChoices } from './parts/gameKit'
import { rint, pick } from '@/core/rand'
import { disp } from '@/core/fmt'

const P: Palette = {
  nightTop: '#1a2438', nightBot: '#080d18',
  cream: '#eef3fc', creamSoft: 'rgba(238,243,252,0.82)',
  inkOnPaper: '#1a2438', mutedOnPaper: '#8496b4',
  gold: '#ffcf6b', goldDeep: '#c9932a',
  coral: '#ff9a9a', coralDeep: '#dd5d5d', mint: '#7fdcb4',
  glass: 'rgba(26,36,56,0.62)', glassBorder: 'rgba(238,243,252,0.2)',
}


/** Exact (cos, sin) at every special angle — the old lesson's table, verbatim. */
const COORD: Record<number, string> = {
  0: '(1, 0)', 30: '(√3/2, 1/2)', 45: '(√2/2, √2/2)', 60: '(1/2, √3/2)', 90: '(0, 1)',
  120: '(−1/2, √3/2)', 135: '(−√2/2, √2/2)', 150: '(−√3/2, 1/2)', 180: '(−1, 0)',
  210: '(−√3/2, −1/2)', 225: '(−√2/2, −√2/2)', 240: '(−1/2, −√3/2)', 270: '(0, −1)',
  300: '(1/2, −√3/2)', 315: '(√2/2, −√2/2)', 330: '(√3/2, −1/2)',
}
const STOPS = Object.keys(COORD).map(Number).sort((a, b) => a - b)

/** Degrees → the (a, b) of (a/b)π, already in lowest terms. */
const RAD_PARTS: Record<number, [number, number]> = {
  45: [1, 4], 90: [1, 2], 180: [1, 1], 270: [3, 2], 360: [2, 1],
}

/** The acute angle to the horizontal — how far the pod is from level. */
function refAngle(deg: number): number {
  const a = ((deg % 360) + 360) % 360
  if (a <= 90) return a
  if (a <= 180) return 180 - a
  if (a <= 270) return a - 180
  return 360 - a
}
const quadOf = (deg: number) => (deg < 90 ? 1 : deg < 180 ? 2 : deg < 270 ? 3 : 4)
const signsOf = (q: number) => ({ cos: q === 1 || q === 4 ? 1 : -1, sin: q === 1 || q === 2 ? 1 : -1 })

type V =
  | { k: 'num'; n: number }
  | { k: 'parts'; a: number; b: number }
  | { k: 'deg'; d: number }
  | { k: 'signs'; cos: number; sin: number }
  | { k: 'pick'; id: string }

interface Task extends BaseTask {
  kind: 'rad' | 'axis' | 'ref' | 'spot' | 'signs' | 'coord'
  n?: number; pad?: number[]
  pa?: number; pb?: number
  deg?: number
  qcos?: number; qsin?: number
  correctId?: string; choices?: { id: string; label: string }[]
}

// ── L1 · the same trip, counted two ways ──────────────────────────────────────
function radTask(): Task {
  const deg = pick([45, 90, 180, 270, 360])
  const [a, b] = RAD_PARTS[deg]
  return {
    kind: 'rad', title: 'Round in π', tone: 'a',
    badge: `${deg}°`, showEquals: false,
    prompt: 'How far is that in π?',
    context: 'One full turn of the wheel is 360 degrees, and it is also 2π — the same trip round, measured two different ways. So any part of a turn can be written as a fraction of that 2π.',
    instruction: 'Build the radian measure, then lock it in.',
    say: `What is ${deg} degrees in radians?`,
    work: [
      `${deg}° out of a full 360° is ${deg}/360 of a turn.`,
      `A whole turn is 2π, so that is ${deg}/360 × 2π = ${a === b ? 'π' : `${a}/${b} π`}.`,
    ],
    pa: a, pb: b,
  }
}

/** sine or cosine at a quarter-turn, where the value is exactly 0, 1 or −1. */
function axisTask(): Task {
  const deg = pick([0, 90, 180, 270])
  const useSin = Math.random() < 0.5
  const [cx, cy] = ({ 0: [1, 0], 90: [0, 1], 180: [-1, 0], 270: [0, -1] } as Record<number, [number, number]>)[deg]
  const n = useSin ? cy : cx
  return {
    kind: 'axis', title: 'At the quarter', tone: 'b',
    badge: `${useSin ? 'sin' : 'cos'} ${deg}°`, answerLabel: '=',
    prompt: `What is ${useSin ? 'sin' : 'cos'} ${deg}°?`,
    context: `At a quarter-turn the pod sits exactly on one of the two lines through the middle, so its position is a whole number — never an awkward one. ${useSin ? 'Sine is how far UP it is' : 'Cosine is how far ACROSS it is'}, measuring from the centre of the wheel.`,
    padInstruction: `Tap how far ${useSin ? 'up' : 'across'} the pod is.`,
    say: `What is ${useSin ? 'sine' : 'cosine'} of ${deg} degrees?`,
    work: [
      `At ${deg}° the pod is at ${COORD[deg]} — across first, up second.`,
      `${useSin ? 'Sine' : 'Cosine'} is the ${useSin ? 'second' : 'first'} of those, so it is ${disp(n)}.`,
    ],
    n, pad: [-n, useSin ? cx : cy, n === 0 ? 1 : 0],
  }
}

// ── L2 · where the pod is, and how far from level ─────────────────────────────
function refTask(): Task {
  const deg = pick([120, 135, 150, 210, 225, 240, 300, 315, 330])
  const n = refAngle(deg)
  return {
    kind: 'ref', title: 'From level', tone: 'a',
    badge: `${deg}°`, answerLabel: 'reference angle =',
    prompt: 'How far from level?',
    context: 'Whichever quarter your pod has reached, there is a matching pod in the first quarter sitting at the same steepness. The reference angle is that steepness — the sharp angle between the arm and the horizontal, always somewhere between 0 and 90.',
    padInstruction: 'Tap the angle from the horizontal.',
    say: `What is the reference angle of ${deg} degrees?`,
    work: [
      `${deg}° is in quarter ${quadOf(deg)} of the ride.`,
      `Measured to the nearest horizontal line, that arm sits at ${n}°.`,
    ],
    n, pad: [deg - 180, 180 - deg, 90 - n].filter((x) => x > 0 && x < 90),
  }
}

/** The chapter's own gesture: given where the pod IS, ride the wheel to it. */
function spotTask(): Task {
  const deg = pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330])
  return {
    kind: 'spot', title: 'Find the pod', tone: 'b',
    badge: COORD[deg], showEquals: false,
    prompt: 'Which angle is that?',
    context: 'A position on the wheel is written across-first, up-second. Its signs tell you which quarter of the ride you are in, and the size of the two numbers tells you how far round that quarter — the bigger the across, the closer to level.',
    instruction: 'Ride the wheel to that pod, then stop.',
    say: `A pod sits at the point ${COORD[deg]}. What angle is it at?`,
    work: [
      `Across is ${COORD[deg].split(',')[0].slice(1)} and up is ${COORD[deg].split(', ')[1].slice(0, -1)}.`,
      `Those signs put it in quarter ${quadOf(deg)}, at a reference angle of ${refAngle(deg)}°.`,
      `That is ${deg}° round from the start.`,
    ],
    deg,
  }
}

// ── L3 · which quarter, and what that does to the signs ───────────────────────
function signsTask(): Task {
  const q = rint(1, 4)
  const s = signsOf(q)
  return {
    kind: 'signs', title: 'Quarter signs', tone: 'a',
    badge: `quarter ${q}`, showEquals: false,
    prompt: 'What are the signs there?',
    // True for every quarter — it names the RULE, never a particular outcome.
    context: 'Across and up are measured from the middle of the wheel, so each one is negative on one side of it and positive on the other. Which quarter the pod is in therefore fixes both signs, whatever the actual angle is.',
    instruction: 'Set both signs, then lock it in.',
    say: `In quarter ${q} of the ride, what are the signs of cosine and sine?`,
    work: [
      `Quarter ${q} is ${['the first', 'the second', 'the third', 'the fourth'][q - 1]} part of the way round.`,
      `There the pod is ${s.cos > 0 ? 'right' : 'left'} of the middle, so across is ${s.cos > 0 ? 'positive' : 'negative'}.`,
      `And it is ${s.sin > 0 ? 'above' : 'below'} the middle, so up is ${s.sin > 0 ? 'positive' : 'negative'}.`,
    ],
    qcos: s.cos, qsin: s.sin,
  }
}

/** ⚠️ The chapter's ONE picker. (√3/2, 1/2) is neither a number to tap nor two
 *  integers to build, which is exactly the rung-3 case in plan §3. */
function coordTask(): Task {
  const deg = pick([120, 135, 150, 210, 225, 240, 300, 315, 330])
  const ref = refAngle(deg)
  const alts = [COORD[ref], COORD[(deg + 180) % 360], COORD[(deg + 30) % 360] ?? COORD[30]]
    .filter((c, i, arr) => c && c !== COORD[deg] && arr.indexOf(c) === i)
    .slice(0, 3)
  return {
    kind: 'coord', title: 'Exactly where', tone: 'b',
    badge: `${deg}°`, showEquals: false,
    prompt: 'Where is that pod, exactly?',
    context: `The pod at ${deg}° sits at the same steepness as the one at ${ref}°, so the two numbers are the same pair — only the signs differ, and those come from the quarter it is in.`,
    instruction: 'Choose the exact position, then lock it in.',
    say: `Where exactly is the pod at ${deg} degrees?`,
    work: [
      `Its reference angle is ${ref}°, whose position is ${COORD[ref]}.`,
      `${deg}° is in quarter ${quadOf(deg)}, so across is ${signsOf(quadOf(deg)).cos > 0 ? 'positive' : 'negative'} and up is ${signsOf(quadOf(deg)).sin > 0 ? 'positive' : 'negative'}.`,
      `That gives ${COORD[deg]}.`,
    ],
    correctId: COORD[deg],
    choices: [COORD[deg], ...alts].map((c) => ({ id: c, label: c })),
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return Math.random() < 0.5 ? radTask() : axisTask()
  if (d === 2) return Math.random() < 0.55 ? spotTask() : refTask()
  return Math.random() < 0.5 ? signsTask() : coordTask()
}

// ══════════════════════════════════════════════════════════════════════════════
// THE SIGN SWITCHES — across and up, one ± each. The mnemonic performed.
// ══════════════════════════════════════════════════════════════════════════════
function SignSwitches({ value, setValue, disabled, reveal, onCommit }: {
  value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}) {
  const cos = value.k === 'signs' ? value.cos : 1
  const sin = value.k === 'signs' ? value.sin : 1
  const col = reveal ? P.mint : P.gold
  const Row = ({ label, hint, cur, on }: { label: string; hint: string; cur: number; on: (s: number) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px,1vw,13px)', letterSpacing: '0.09em', textTransform: 'uppercase', color: P.mutedOnPaper }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(9px,0.95vw,12px)', color: P.creamSoft }}>{hint}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, -1].map((s) => (
          <button key={s} type="button" disabled={disabled} onClick={() => on(s)} style={{
            minWidth: 52, minHeight: 44, borderRadius: 10,
            border: `2px solid ${cur === s ? col : P.glassBorder}`, background: cur === s ? `${col}22` : P.glass,
            color: cur === s ? col : P.creamSoft, fontFamily: 'var(--font-numeric)', fontWeight: 800,
            fontSize: 'clamp(17px,2vw,24px)', cursor: disabled ? 'default' : 'pointer',
          }}>{s > 0 ? '+' : '−'}</button>
        ))}
      </div>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px,2.6vw,32px)', fontWeight: 800, color: col }}>
        ({cos > 0 ? '+' : '−'}, {sin > 0 ? '+' : '−'})
      </div>
      <div style={{ display: 'flex', gap: 'clamp(14px,2.4vw,40px)' }}>
        <Row label="across" hint="cosine" cur={cos} on={(s) => setValue({ k: 'signs', cos: s, sin })} />
        <Row label="up" hint="sine" cur={sin} on={(s) => setValue({ k: 'signs', cos, sin: s })} />
      </div>
      <CommitBtn P={P} label="LOCK IN ✓" disabled={disabled} onClick={() => onCommit({ k: 'signs', cos, sin })} />
    </div>
  )
}

// ── walkthrough: ride to a pod, then read the signs off the quarter ───────────
const DEMO_SPOT: Task = {
  kind: 'spot', title: 'Find the pod', badge: '(1/2, √3/2)', tone: 'b',
  prompt: '', say: '', work: [], deg: 60,
}
const DEMO_SPOT_STEPS: DemoStep<V>[] = [
  { say: 'A big wheel is a circle with a pod on it, and everything in this chapter is just a way of saying where that pod has got to.', value: { k: 'deg', d: 0 }, board: 'the pod at 0°' },
  { say: 'Its position is written across first, then up — both measured from the middle of the wheel, not the ground.', value: { k: 'deg', d: 0 }, board: '(across, up)' },
  { say: 'This pod is at a half across and root three over two up. Root three over two is about nought point eight seven, so it is much higher than it is far across.', value: { k: 'deg', d: 30 }, board: '(1/2, √3/2)' },
  { say: 'Both numbers are positive, so it is still in the first quarter — up and to the right.', value: { k: 'deg', d: 45 }, board: 'both + → quarter 1' },
  { say: 'And it is well past halfway up that quarter, because up is so much bigger than across. Keep riding.', value: { k: 'deg', d: 60 }, board: 'up ≫ across → steep' },
  { say: 'There. Sixty degrees. Across a half, up root three over two — which is exactly where we were told the pod was.', value: { k: 'deg', d: 60 }, board: '60°' },
]

const DEMO_SIGNS: Task = {
  kind: 'signs', title: 'Quarter signs', badge: 'quarter 3', tone: 'a',
  prompt: '', say: '', work: [], qcos: -1, qsin: -1,
}
const DEMO_SIGNS_STEPS: DemoStep<V>[] = [
  { say: 'Now the third quarter of the ride — round the far side and heading back down.', value: { k: 'signs', cos: 1, sin: 1 }, board: 'quarter 3' },
  { say: 'Across is measured from the middle of the wheel, so anything left of the middle counts as negative.', value: { k: 'signs', cos: 1, sin: 1 }, board: 'across: left is −' },
  { say: 'In the third quarter the pod is on the left, so across is negative.', value: { k: 'signs', cos: -1, sin: 1 }, board: 'across −' },
  { say: 'Up works the same way from the middle: below it counts as negative. In the third quarter the pod is below the centre.', value: { k: 'signs', cos: -1, sin: -1 }, board: 'up −' },
  { say: 'So in the third quarter both are negative. You never have to remember that — you just have to know which side of the middle the pod is on.', value: { k: 'signs', cos: -1, sin: -1 }, board: 'quarter 3 → (−, −)' },
]

// ══════════════════════════════════════════════════════════════════════════════
const CONFIG: GameConfig<V, Task> = {
  chapterId: 'unitCircleTrig',
  title: 'THE BIG WHEEL',
  ticketLabel: 'ride log',
  palette: P,
  motif: '🎡',
  makeTask,
  answerPad: (t) => (t.kind === 'axis' || t.kind === 'ref' ? numChoices(t.n ?? 0, t.pad ?? []) : []),
  // REQUIRED: V is a tagged union (docs/lessons.md — the 15–16 prod bug).
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) =>
    t.kind === 'rad' ? { k: 'parts', a: 1, b: 1 }
      : t.kind === 'spot' ? { k: 'deg', d: 0 }
        : t.kind === 'signs' ? { k: 'signs', cos: 1, sin: 1 }
          : t.kind === 'coord' ? { k: 'pick', id: '' }
            : { k: 'num', n: 0 },
  grade: (t, v) =>
    t.kind === 'rad' ? v.k === 'parts' && v.a === t.pa && v.b === t.pb
      : t.kind === 'spot' ? v.k === 'deg' && v.d === t.deg
        : t.kind === 'signs' ? v.k === 'signs' && v.cos === t.qcos && v.sin === t.qsin
          : t.kind === 'coord' ? v.k === 'pick' && v.id === t.correctId
            : v.k === 'num' && v.n === t.n,
  revealText: (t) =>
    t.kind === 'rad' ? (t.pa === t.pb ? 'π' : `${t.pa}/${t.pb} π`)
      : t.kind === 'spot' ? `${t.deg}°`
        : t.kind === 'signs' ? `(${(t.qcos ?? 1) > 0 ? '+' : '−'}, ${(t.qsin ?? 1) > 0 ? '+' : '−'})`
          : t.kind === 'coord' ? (t.correctId ?? '')
            : String(t.n ?? 0),
  glide: (t, _f, setValue, later) => later(() => setValue(
    t.kind === 'rad' ? { k: 'parts', a: t.pa ?? 1, b: t.pb ?? 1 }
      : t.kind === 'spot' ? { k: 'deg', d: t.deg ?? 0 }
        : t.kind === 'signs' ? { k: 'signs', cos: t.qcos ?? 1, sin: t.qsin ?? 1 }
          : t.kind === 'coord' ? { k: 'pick', id: t.correctId ?? '' }
            : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }): ReactElement => {
    if (task.kind === 'coord') {
      return <SpecPicker P={palette} choices={task.choices ?? []} value={value.k === 'pick' ? value.id : ''}
        setValue={(id) => setValue({ k: 'pick', id })} correct={task.correctId} disabled={disabled} reveal={reveal}
        onCommit={(id) => onCommit({ k: 'pick', id })} commitLabel="LOCK IN ✓" prompt="which position?" />
    }
    if (task.kind === 'signs') {
      return <SignSwitches value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
    }
    if (task.kind === 'rad') {
      return <PartsBuilder P={palette} value={{ a: value.k === 'parts' ? value.a : 1, b: value.k === 'parts' ? value.b : 1 }}
        setValue={(p) => setValue({ k: 'parts', a: p.a, b: p.b })} min={1} max={8} labels={['top', 'bottom']}
        template={(a, b) => (b === 1 ? (a === 1 ? 'π' : `${a}π`) : `(${a}/${b})π`)}
        disabled={disabled} reveal={reveal} onCommit={(p) => onCommit({ k: 'parts', a: p.a, b: p.b })} commitLabel="BUILD IT ✓" />
    }
    return <CircleTap P={palette} value={value.k === 'deg' ? value.d : 0} setValue={(d) => setValue({ k: 'deg', d })}
      stops={STOPS} showCoords disabled={disabled} reveal={reveal} onCommit={(d) => onCommit({ k: 'deg', d })} />
  },
  TutorialScene: ({ task, value, palette }) =>
    task.kind === 'signs'
      ? <SignSwitches value={value} setValue={() => {}} disabled onCommit={() => {}} />
      : <CircleTap P={palette} value={value.k === 'deg' ? value.d : 0} setValue={() => {}} stops={STOPS} showCoords disabled onCommit={() => {}} />,
  start: {
    blurb: <><strong>A big wheel is a circle with a pod on it.</strong> Where that pod has got to can be said as an angle, as a fraction of π, or as a position — across and up from the middle. Learn to move between all three, and read the signs straight off the quarter of the ride.</>,
    ticket: { title: 'Ride log', badge: '(1/2, √3/2)', tone: 'b' },
    startLabel: 'Board the wheel →',
  },
  overview: {
    say: 'Here is the plan. Think of a big wheel with one pod on it. Where that pod has got to is the angle, and a full turn is three hundred and sixty degrees, which is also two pi — the same trip counted two ways. The pod\'s position is written across first, up second, both measured from the middle of the wheel. That is all cosine and sine are. And because across and up are measured from the middle, which quarter of the ride you are in decides both their signs. Let us ride one together, nice and slow.',
    problem: <>Which angle is the pod at <strong>(1/2, √3/2)</strong>?</>,
    points: [
      <>A full turn is <strong>360°</strong>, and also <strong>2π</strong>.</>,
      <>Position is <strong>across</strong> then <strong>up</strong>, from the middle.</>,
      <>Across is <strong>cosine</strong>; up is <strong>sine</strong>.</>,
      <>The <strong>quarter</strong> you are in fixes both signs.</>,
    ],
  },
  tutorial: [
    { task: DEMO_SPOT, initial: { k: 'deg', d: 0 }, hand: 'crank', steps: DEMO_SPOT_STEPS },
    { task: DEMO_SIGNS, initial: { k: 'signs', cos: 1, sin: 1 }, hand: 'tap', steps: DEMO_SIGNS_STEPS },
  ],
  sig: (t) => `${t.kind}:${t.badge}:${t.prompt}`,
}

export default function BigWheel(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
