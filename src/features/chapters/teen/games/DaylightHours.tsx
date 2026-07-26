'use client'
/**
 * DaylightHours — the Trig Graphs & Identities chapter (17–18) as a PLAYABLE GAME.
 *
 * World: DAYLIGHT HOURS. How long the sun is up, across one year, is a sine wave
 * you have lived inside your whole life — and every part of the equation is
 * something you have felt:
 *   • the MIDLINE is 12 hours, the day length you get at the equinoxes
 *   • the AMPLITUDE is how much your latitude swings either side of that
 *   • the PERIOD is a year — one cycle, every time
 *   • the MAXIMUM is midsummer and the MINIMUM is midwinter
 *
 *   • MATCH → CurveMatch: shape your own curve until it lies on the year you were
 *             given. This is the best gesture in the band, because the answer IS
 *             the match — there is no separate step where you state it.
 *   • TAP   → AnswerPad: the longest and shortest days, which are the midline plus
 *             and minus the swing.
 *   • PICK  → SpecPicker ×2, and only twice: the Pythagorean identity and
 *             simplifying with it. Daylight explains amplitude and period
 *             beautifully and sin²+cos²=1 not at all — that is named as a seam in
 *             plan §5.1 rather than papered over, and framed as tidying the formula
 *             before you use it. 2 of the band's ~10 pickers.
 *
 * The math is the old TrigGraphsIdentitiesTeenLesson.makeRound, same L1/L2/L3 ramp.
 *
 * ⚠️ TWO DELIBERATE NARROWINGS, both marked where they live:
 *   • the PHASE dial (h) exists in CurveMatch but is never enabled here. The old
 *     lesson generated no phase-shift task, and a fourth dial whose answer is
 *     always zero is a dial that teaches the child to ignore dials.
 *   • amplitude and midline are drawn as WHOLE hours so they are dial-able. Real
 *     day length is not, and the context says "about" rather than pretending.
 */
import { type ReactElement } from 'react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SpecPicker, CurveMatch, type Wave, numChoices } from './parts/gameKit'

const P: Palette = {
  nightTop: '#2a1e2c', nightBot: '#0f0810',
  cream: '#fdeee4', creamSoft: 'rgba(253,238,228,0.82)',
  inkOnPaper: '#2a1e2c', mutedOnPaper: '#a98a92',
  gold: '#ffb46b', goldDeep: '#c9762a',
  coral: '#ff8fa0', coralDeep: '#dd4f68', mint: '#8ad9b4',
  glass: 'rgba(42,30,44,0.62)', glassBorder: 'rgba(253,238,228,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const fmt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))

type V = { k: 'wave'; w: Wave } | { k: 'num'; n: number } | { k: 'pick'; id: string }

interface Task extends BaseTask {
  kind: 'match' | 'extreme' | 'pyth' | 'simp'
  /** match: the year to lie on top of, and which dials are live */
  target?: Wave; dials?: ('a' | 'b' | 'k')[]
  n?: number; pad?: number[]
  correctId?: string; choices?: { id: string; label: string }[]
}

/** A place's year of daylight: 12 hours at the middle, swinging `a` either side. */
const placeFor = (a: number) =>
  a <= 2 ? 'somewhere near the tropics' : a <= 4 ? 'a temperate town' : 'somewhere well up north'

// ── L1/L2 · shape the year ────────────────────────────────────────────────────
/** ⚠️ `b` is drawn from 1..2 only. Above that the drawn year contains more than two
 *  cycles and stops reading as a year at all, which would make the world false. */
function matchTask(d: 1 | 2): Task {
  const a = rint(2, 5)
  const b = d === 1 ? 1 : pickOne([1, 2])
  const k = d === 1 ? 12 : rint(10, 14)
  const dials: ('a' | 'b' | 'k')[] = d === 1 ? ['a', 'k'] : ['a', 'b', 'k']
  return {
    kind: 'match', title: 'Shape the year', tone: 'a',
    badge: d === 1
      ? `swing ${a} h · middle ${k} h`
      : `y = ${a}·sin(${b}x) ${k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`}`,
    showEquals: false,
    prompt: 'Can you match this year?',
    context: d === 1
      ? `The faint curve is a year of daylight for ${placeFor(a)}. The line it wanders around is the day length you get at the equinoxes, and the swing is how far midsummer and midwinter pull away from it.`
      : 'The faint curve is written out as a formula this time. The number in front of sine is the swing, the number multiplying x decides how many full cycles fit across the year, and the number on the end lifts the whole thing.',
    instruction: 'Set the dials until your curve lies on it, then lock it in.',
    say: d === 1
      ? 'Shape your curve until it lies on the year you have been given.'
      : `Match the curve y equals ${a} sine of ${b} x plus ${k}.`,
    work: [
      `The middle of the swing sits at ${k} hours, so that is the middle dial.`,
      `It reaches ${k + a} at the longest and ${k - a} at the shortest, which is ${a} either side — that is the swing.`,
      d === 1 ? 'One cycle across the year, so the cycles dial stays at one.' : `And it fits ${b} full ${b === 1 ? 'cycle' : 'cycles'} across, so the cycles dial goes to ${b}.`,
    ],
    target: { a, b, h: 0, k }, dials,
  }
}

// ── L1/L2 · the longest and shortest days ─────────────────────────────────────
function extremeTask(d: 1 | 2): Task {
  const a = rint(2, 5)
  const k = d === 1 ? 12 : rint(10, 14)
  const askMax = Math.random() < 0.5
  const n = askMax ? k + a : k - a
  return {
    kind: 'extreme', title: askMax ? 'Midsummer' : 'Midwinter', tone: 'b',
    badge: `y = ${a}·sin(x) ${k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`}`,
    answerLabel: 'hours =',
    prompt: `How long is the ${askMax ? 'longest' : 'shortest'} day?`,
    // True for every seed: sine is capped at ±1, whatever a and k are drawn as.
    context: `Sine never gets past 1 or below −1, however big the number in front of it is. So the swing reaches exactly ${a} hours away from the middle at its furthest, and no further — once on the long side at midsummer, once on the short side at midwinter.`,
    padInstruction: `Tap the ${askMax ? 'longest' : 'shortest'} day length.`,
    say: `A year of daylight is ${a} sine of x plus ${k}. How long is the ${askMax ? 'longest' : 'shortest'} day?`,
    work: [
      `The middle of the swing is ${k} hours.`,
      `Sine tops out at ${askMax ? '1' : '−1'}, so the furthest it gets is ${a} × ${askMax ? '1' : '−1'} = ${fmt(askMax ? a : -a)}.`,
      `${k} ${askMax ? '+' : '−'} ${a} = ${n} hours.`,
    ],
    // k alone is the "forgot the swing" slip; k∓a is the wrong end of the year.
    n, pad: [k, askMax ? k - a : k + a, a],
  }
}

// ── L3 · the seam: algebra with no daylight meaning ───────────────────────────
/** ⚠️ Picker #1. Given sinθ, cosθ is a FRACTION — not a number to tap and not two
 *  integers to build. Framed as tidying the formula before you use it (plan §5.1). */
function pythTask(): Task {
  const cases = [
    { sin: '3/5', cos: '4/5' }, { sin: '4/5', cos: '3/5' },
    { sin: '5/13', cos: '12/13' }, { sin: '12/13', cos: '5/13' },
    { sin: '8/17', cos: '15/17' },
  ]
  const c = pickOne(cases)
  const alts = cases.filter((x) => x.cos !== c.cos).map((x) => x.cos).slice(0, 3)
  return {
    kind: 'pyth', title: 'Tidy it first', tone: 'a',
    badge: `sin θ = ${c.sin},  θ acute`, showEquals: false,
    prompt: 'So what is cos θ?',
    context: 'This one is not daylight — it is the algebra you do to a daylight formula before you can use it. Sine and cosine of the same angle are always tied together by sin²θ + cos²θ = 1, so knowing one hands you the other.',
    instruction: 'Choose cos θ, then lock it in.',
    say: `If sine theta is ${c.sin} and theta is acute, what is cosine theta?`,
    work: [
      `sin²θ + cos²θ = 1, so cos²θ = 1 − (${c.sin})².`,
      `θ is acute, so cos θ is positive — take the positive root.`,
      `That gives cos θ = ${c.cos}.`,
    ],
    correctId: c.cos,
    choices: [c.cos, ...alts].map((s) => ({ id: s, label: s })),
  }
}

/** ⚠️ Picker #2, same seam. */
function simpTask(): Task {
  const e = pickOne([
    { badge: '1 − sin²θ', ans: 'cos²θ', alts: ['sin²θ', '1', 'tan²θ'], why: 'Rearranging sin²θ + cos²θ = 1 gives 1 − sin²θ = cos²θ.' },
    { badge: '1 − cos²θ', ans: 'sin²θ', alts: ['cos²θ', '1', 'tan²θ'], why: 'Rearranging sin²θ + cos²θ = 1 gives 1 − cos²θ = sin²θ.' },
    { badge: 'sin²θ + cos²θ', ans: '1', alts: ['0', '2', 'sinθ·cosθ'], why: 'That IS the identity — it comes to 1, for every angle there is.' },
  ])
  return {
    kind: 'simp', title: 'Tidy it first', tone: 'b',
    badge: e.badge, showEquals: false,
    prompt: 'What does that come to?',
    context: 'Also not daylight — this is the tidying you do so a formula is short enough to work with. One identity does all of it: sine squared plus cosine squared is always exactly 1, whatever the angle.',
    instruction: 'Choose the simplest form, then lock it in.',
    say: `Simplify ${e.badge}.`,
    work: ['Start from sin²θ + cos²θ = 1.', e.why],
    correctId: e.ans,
    choices: [e.ans, ...e.alts].map((s) => ({ id: s, label: s })),
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return Math.random() < 0.6 ? matchTask(1) : extremeTask(1)
  if (d === 2) return Math.random() < 0.55 ? matchTask(2) : extremeTask(2)
  return Math.random() < 0.5 ? pythTask() : simpTask()
}

// ── walkthrough: match a year, then read its longest day ──────────────────────
const DEMO_MATCH: Task = {
  kind: 'match', title: 'Shape the year', badge: 'swing 4 h · middle 12 h', tone: 'a',
  prompt: '', say: '', work: [], target: { a: 4, b: 1, h: 0, k: 12 }, dials: ['a', 'k'],
}
const DEMO_MATCH_STEPS: DemoStep<V>[] = [
  { say: 'The faint curve is one year of daylight — how many hours the sun is up, from January round to January.', value: { k: 'wave', w: { a: 0, b: 1, h: 0, k: 0 } }, board: 'one year of daylight' },
  { say: 'Start with the line it wanders around. Twice a year, at the equinoxes, day and night are equal — twelve hours each.', value: { k: 'wave', w: { a: 0, b: 1, h: 0, k: 12 } }, board: 'middle = 12 h' },
  { say: 'That twelve is the middle of the swing. Every year has it, wherever you are.', value: { k: 'wave', w: { a: 0, b: 1, h: 0, k: 12 } }, board: 'the same everywhere' },
  { say: 'What changes with where you live is how far the year pulls away from it. Turn the swing up and watch the summers get longer and the winters shorter.', value: { k: 'wave', w: { a: 2, b: 1, h: 0, k: 12 } }, board: 'swing = latitude' },
  { say: 'Keep going. This place reaches sixteen hours at midsummer, which is four above the middle.', value: { k: 'wave', w: { a: 4, b: 1, h: 0, k: 12 } }, board: '16 = 12 + 4 → swing 4' },
  { say: 'And it drops to eight in midwinter, four below. The swing is the same both ways — that is what makes it a sine wave and not just a wobble.', value: { k: 'wave', w: { a: 4, b: 1, h: 0, k: 12 } }, board: '8 = 12 − 4' },
  { say: 'The curve is on it. One cycle, because a year is one trip round the sun, and that is the whole shape.', value: { k: 'wave', w: { a: 4, b: 1, h: 0, k: 12 } }, board: 'swing 4 · middle 12' },
]

// ══════════════════════════════════════════════════════════════════════════════
const CONFIG: GameConfig<V, Task> = {
  chapterId: 'trigGraphsIdentities',
  title: 'DAYLIGHT HOURS',
  ticketLabel: 'almanac',
  palette: P,
  motif: '🌅',
  makeTask,
  answerPad: (t) => (t.kind === 'extreme' ? numChoices(t.n ?? 0, t.pad ?? [], { min: 0 }) : []),
  // REQUIRED: V is a tagged union (docs/lessons.md — the 15–16 prod bug).
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) =>
    t.kind === 'match' ? { k: 'wave', w: { a: 0, b: 1, h: 0, k: 0 } }
      : t.kind === 'pyth' || t.kind === 'simp' ? { k: 'pick', id: '' }
        : { k: 'num', n: 0 },
  grade: (t, v) =>
    t.kind === 'match'
      // Only the live dials are graded — a dial the child was never shown cannot
      // be wrong, and `h` is never enabled here at all (see the header).
      ? v.k === 'wave' && (t.dials ?? []).every((d) => v.w[d] === (t.target as Wave)[d])
      : t.kind === 'pyth' || t.kind === 'simp' ? v.k === 'pick' && v.id === t.correctId
        : v.k === 'num' && v.n === t.n,
  revealText: (t) =>
    t.kind === 'match' ? (t.dials ?? []).map((d) => `${d === 'a' ? 'swing' : d === 'b' ? 'cycles' : 'middle'} ${(t.target as Wave)[d]}`).join(' · ')
      : t.kind === 'pyth' || t.kind === 'simp' ? (t.correctId ?? '')
        : `${t.n} h`,
  glide: (t, _f, setValue, later) => later(() => setValue(
    t.kind === 'match' ? { k: 'wave', w: t.target as Wave }
      : t.kind === 'pyth' || t.kind === 'simp' ? { k: 'pick', id: t.correctId ?? '' }
        : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }): ReactElement => {
    if (task.kind === 'pyth' || task.kind === 'simp') {
      return <SpecPicker P={palette} choices={task.choices ?? []} value={value.k === 'pick' ? value.id : ''}
        setValue={(id) => setValue({ k: 'pick', id })} correct={task.correctId} disabled={disabled} reveal={reveal}
        onCommit={(id) => onCommit({ k: 'pick', id })} commitLabel="LOCK IN ✓" prompt="which is it?" />
    }
    const w = value.k === 'wave' ? value.w : { a: 0, b: 1, h: 0, k: 0 }
    return <CurveMatch P={palette} value={w} setValue={(nw) => setValue({ k: 'wave', w: nw })}
      target={task.target} dials={task.dials ?? ['a', 'k']} unit=" h"
      disabled={disabled} reveal={reveal} onCommit={(nw) => onCommit({ k: 'wave', w: nw })} />
  },
  TutorialScene: ({ task, value, palette }) => {
    const w = value.k === 'wave' ? value.w : { a: 0, b: 1, h: 0, k: 0 }
    return <CurveMatch P={palette} value={w} setValue={() => {}} target={task.target}
      dials={task.dials ?? ['a', 'k']} unit=" h" disabled onCommit={() => {}} />
  },
  start: {
    blurb: <><strong>How long the sun is up, across one year.</strong> Twelve hours at the equinoxes, swinging further either side the further north you go, one full cycle a year. Shape a curve until it lies on a given year — then work out its longest and shortest days.</>,
    ticket: { title: 'Almanac', badge: 'swing 4 h · middle 12 h', tone: 'a' },
    startLabel: 'Open the almanac →',
  },
  overview: {
    say: 'Here is the plan. Day length over a year is a sine wave, and you have lived inside it your whole life. It wanders around twelve hours, which is what you get at the equinoxes. How far it swings either side of that depends on how far north you are. It takes exactly one year to come back round. And the longest and shortest days are simply the middle plus and minus that swing. Let us shape one together, nice and slow.',
    problem: <>Match a year that swings <strong>4 hours</strong> around a middle of <strong>12</strong>.</>,
    points: [
      <>The <strong>middle</strong> is 12 h — the equinoxes.</>,
      <>The <strong>swing</strong> is how far your latitude pulls away from it.</>,
      <>One <strong>cycle</strong> is one year.</>,
      <>Longest and shortest = middle <strong>±</strong> swing.</>,
    ],
  },
  tutorial: [{ task: DEMO_MATCH, initial: { k: 'wave', w: { a: 0, b: 1, h: 0, k: 0 } }, hand: 'tap', steps: DEMO_MATCH_STEPS }],
  sig: (t) => `${t.kind}:${t.badge}:${t.prompt}`,
}

export default function DaylightHours(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
