'use client'
/**
 * KitchenCounter — the Rational Operations chapter as a PLAYABLE GAME.
 * World: Milo's cozy kitchen. The kid fills order slips by SHADING a 12-part
 * cutting tray (part-of-a-part fractions) or POURING a measure with a slide
 * (decimal products, fraction division). Fractions felt as "your share of the
 * tray", decimals as "how much you pour", division as "how many fit inside".
 * No slides-as-lessons, no MCQ. Shared adaptive engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * works "half of two thirds" on the twelfths tray, then a GUIDED order (config.guided)
 * lets the kid shade "half of a half" with Milo coaching (not scored), then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, BarShade, SlideValue, pick, reduce, tidy, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#2a1810', nightBot: '#40241a',
  cream: '#fff3e2', creamSoft: 'rgba(255,243,226,0.82)',
  inkOnPaper: '#3a2618', mutedOnPaper: '#9c7a5e',
  gold: '#f2a63b', goldDeep: '#d9791f',
  coral: '#e2513f', coralDeep: '#b83525', mint: '#5fd3a6',
  glass: 'rgba(42,24,16,0.6)', glassBorder: 'rgba(255,243,226,0.22)',
}

interface Task extends BaseTask {
  mech: 'bar' | 'slide'
  answer: number
  min?: number
  max?: number
  step?: number
}

// ── part-of-a-part on a 12-part tray (answer = twelfths) ──────────────────────
const BAR_PAIRS: { a: string; b: string; ans: number }[] = [
  { a: '½', b: '½', ans: 3 },
  { a: '⅓', b: '½', ans: 2 },
  { a: '½', b: '⅔', ans: 4 },
  { a: '¼', b: '⅔', ans: 2 },
  { a: '⅓', b: '¾', ans: 3 },
  { a: '⅔', b: '¾', ans: 6 },
  { a: '½', b: '⅓', ans: 2 },
]
function barPart(): Task {
  const { a, b, ans } = pick(BAR_PAIRS)
  return {
    mech: 'bar', title: 'Part of a part', badge: `${a} × ${b}`, tone: 'a',
    prompt: `A tray is ${b} of a whole. Take ${a} of it — shade your share of the 12 parts.`,
    say: `A tray is ${b} of a whole. Take ${a} of that. Shade your share of the twelve parts.`,
    answer: ans,
    work: [`${a} of ${b} means multiply: ${a} × ${b}.`, `That's ${reduce(ans, 12)} of the tray — ${ans} of the 12 parts.`],
  }
}

// ── decimal × decimal (slide 0..1) ────────────────────────────────────────────
const DEC_PAIRS: [number, number][] = [[0.5, 0.4], [0.2, 0.3], [0.5, 0.6], [0.4, 0.5]]
function decMul(): Task {
  const [a, b] = pick(DEC_PAIRS)
  const ans = tidy(a * b)
  return {
    mech: 'slide', title: 'Measure it out', badge: `${a} × ${b}`, tone: 'b',
    min: 0, max: 1, step: 0.01, answer: ans,
    prompt: `${a} × ${b} = ? Slide to the answer.`,
    say: `${a} times ${b}. Slide the measure to the answer.`,
    work: ['Multiply the decimals.', `${a} × ${b} = ${ans}.`],
  }
}

// ── fraction ÷ fraction (slide 0..6, whole answer) ────────────────────────────
const DIV_ITEMS: [string, string, number][] = [
  ['¾', '¼', 3],
  ['½', '¼', 2],
  ['⅔', '⅓', 2],
  ['1', '¼', 4],
]
function fracDiv(): Task {
  const [a, b, ans] = pick(DIV_ITEMS)
  return {
    mech: 'slide', title: 'How many fit?', badge: `${a} ÷ ${b}`, tone: 'a',
    min: 0, max: 6, step: 1, answer: ans,
    prompt: `How many ${b} fit in ${a}? ${a} ÷ ${b} = ? Slide to it.`,
    say: `How many ${b} fit inside ${a}? ${a} divided by ${b}. Slide to it.`,
    work: ['Dividing by a fraction asks how many fit inside.', `${a} ÷ ${b} = ${ans}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [barPart, barPart, barPart]
    : d === 2 ? [barPart, decMul, barPart]
    : [fracDiv, decMul, barPart]
  return pick(pool)()
}

// ── the worked example for the walkthrough (½ × ⅔ = 4 twelfths) and the guided order (½ × ½ = 3 twelfths) ──
const DEMO_TASK: Task = { mech: 'bar', title: 'Part of a part', badge: '½ × ⅔', tone: 'a', answer: 4, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  mech: 'bar', title: 'Half of a half', badge: '½ × ½', tone: 'a', answer: 3,
  prompt: 'Take half of a half tray — shade 3 of the 12 parts, then press SERVE ✓.',
  say: 'Take half of a half tray. Shade three of the twelve parts, then press serve.',
  work: ['Half of a half is a quarter.', 'A quarter of the 12 parts is 3 parts.'],
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'rationalOps',
  title: "MILO'S KITCHEN",
  ticketLabel: 'order slip',
  palette: P,
  makeTask,
  initialValue: () => 0,
  grade: (t, v) => t.mech === 'bar' ? v === t.answer : Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => t.mech === 'bar' ? reduce(t.answer, 12) : `${t.answer}`,
  glide: (t, from, setValue, later) => t.mech === 'bar' ? later(() => setValue(t.answer), 600) : glideNumber(from, t.answer, setValue, later),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => (
    task.mech === 'bar'
      ? <BarShade P={palette} count={value} setCount={setValue} segments={12} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="SERVE ✓" />
      : <SlideValue P={palette} value={value} setValue={setValue} min={task.min!} max={task.max!} step={task.step!} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="SERVE ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'tap',
    steps: [
      { say: "Welcome to Milo's kitchen! This cutting tray has twelve equal parts — tap a part to shade it, tap again to unshade.", value: 0, hand: 'tap' },
      { say: 'Here is an order: the tray is two thirds of a whole, and the order wants half of that.', value: 0, board: '½ of ⅔' },
      { say: 'First find two thirds of the tray. One third of twelve parts is four parts…', value: 4, hand: 'tap', board: '⅓ = 4/12' },
      { say: '…so two thirds is eight parts. That is the whole tray for this order.', value: 8, hand: 'tap', board: '⅔ = 8/12' },
      { say: 'Now take half of those eight parts. Half of eight is four — watch it drop.', value: 4, hand: 'tap', board: '½ × 8 = 4' },
      { say: 'Four of the twelve parts — that is four twelfths, one third of the whole.', value: 4, board: '= 4/12 = ⅓' },
      { say: "When your share is shaded, press Serve. Now let's try one together.", value: 4, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'tap',
  },
  start: {
    blurb: <><strong style={{ color: P.cream }}>You&apos;re on the line in Milo&apos;s kitchen.</strong> Shade the cutting tray or pour the measure to fill every order slip exactly right.</>,
    ticket: { title: 'Half of a half', badge: '½ × ½', tone: 'a' },
    startLabel: 'Open the kitchen →',
  },
  sig: (t) => t.badge,
}

export default function KitchenCounter(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
