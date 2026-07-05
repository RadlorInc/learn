'use client'
/**
 * BalanceBench — the Equations & Inequalities chapter as a PLAYABLE GAME.
 * World: a market weighing bench. The kid solves for x by SLIDING x until the
 * brass beam sits level — the left pan (m·x + c) matches the right pan. When the
 * scale balances, you've solved the equation. No slides, no MCQ. Shared adaptive
 * engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * solves x + 3 = 8 on the beam — take three off both sides, slide x toward five,
 * watch the beam level — then a GUIDED order (config.guided) lets the kid balance
 * x + 1 = 4 with Milo coaching (not scored), then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, BalanceBeam, pick, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#2a1c0e', nightBot: '#3d2a15',
  cream: '#fbf3e2', creamSoft: 'rgba(251,243,226,0.82)',
  inkOnPaper: '#3a2a17', mutedOnPaper: '#9a8360',
  gold: '#e6b24d', goldDeep: '#b6832a',
  coral: '#d98a4a', coralDeep: '#b46a2e', mint: '#7fc98f',
  glass: 'rgba(58,42,23,0.55)', glassBorder: 'rgba(251,243,226,0.22)',
}

interface Task extends BaseTask { m: number; c: number; right: number; answer: number; leftExpr: string; min: number; max: number }

interface Spec { leftExpr: string; m: number; c: number; right: number; answer: number; min: number; max: number }
const L1: Spec[] = [
  { leftExpr: 'x + 3', m: 1, c: 3, right: 7, answer: 4, min: 0, max: 10 },
  { leftExpr: '2x', m: 2, c: 0, right: 10, answer: 5, min: 0, max: 10 },
  { leftExpr: 'x − 4', m: 1, c: -4, right: 1, answer: 5, min: 0, max: 12 },
]
const L2: Spec[] = [
  { leftExpr: '2x + 3', m: 2, c: 3, right: 11, answer: 4, min: 0, max: 10 },
  { leftExpr: '3x − 2', m: 3, c: -2, right: 10, answer: 4, min: 0, max: 10 },
  { leftExpr: '5x', m: 5, c: 0, right: -15, answer: -3, min: -6, max: 6 },
]
const L3: Spec[] = [
  { leftExpr: 'x/2', m: 0.5, c: 0, right: 6, answer: 12, min: 0, max: 16 },
  { leftExpr: '4x − 1', m: 4, c: -1, right: 11, answer: 3, min: 0, max: 10 },
  { leftExpr: '2x + 5', m: 2, c: 5, right: 17, answer: 6, min: 0, max: 12 },
]

function fromSpec(s: Spec): Task {
  const badge = `${s.leftExpr} = ${s.right}`
  return {
    title: 'Find x', badge, tone: s.right < 0 ? 'b' : 'a',
    prompt: `Balance the scale: ${s.leftExpr} = ${s.right}. Slide x until the beam sits level.`,
    say: `Balance the scale so that ${s.leftExpr} equals ${s.right}. Slide x until the beam sits level.`,
    m: s.m, c: s.c, right: s.right, answer: s.answer, leftExpr: s.leftExpr, min: s.min, max: s.max,
    work: [`Find the x that makes ${s.leftExpr} equal ${s.right}.`, `x = ${s.answer} makes both sides ${s.right}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool = d === 1 ? L1 : d === 2 ? L2 : L3
  return fromSpec(pick(pool))
}

// ── worked example for the walkthrough (x + 3 = 8 → 5) + guided order (x + 1 = 4 → 3) ──
const DEMO_TASK: Task = {
  title: 'Find x', badge: 'x + 3 = 8', tone: 'a',
  m: 1, c: 3, right: 8, answer: 5, leftExpr: 'x + 3', min: 0, max: 10,
  prompt: '', say: '', work: [],
}
const GUIDED_TASK: Task = {
  title: 'Find x', badge: 'x + 1 = 4', tone: 'a',
  m: 1, c: 1, right: 4, answer: 3, leftExpr: 'x + 1', min: 0, max: 10,
  prompt: 'Balance x + 1 = 4. Slide x until the beam sits level, then press Balance.',
  say: 'Balance the scale so x plus one equals four. Slide x until the beam is level, then press balance.',
  work: ['Find the x that makes x + 1 equal 4.', 'x = 3 makes both sides 4.'],
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'equationsInequalities',
  title: 'BALANCE BENCH',
  ticketLabel: 'weigh slip',
  palette: P,
  makeTask,
  initialValue: (t) => t.min,
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `x = ${t.answer}`,
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => (
    <BalanceBeam P={palette} x={value} setX={setValue} min={task.min} max={task.max} leftOf={(x) => task.m * x + task.c} right={task.right} leftExpr={task.leftExpr} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="BALANCE ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'drag',
    steps: [
      { say: "Market weighing bench! When the beam is level, the two sides are equal.", value: 0, hand: 'drag' },
      { say: "The left pan holds x plus three. It must match eight on the right.", value: 0, hand: 'drag', board: 'x + 3 = 8' },
      { say: "Right now x is zero, so the left is only three — the beam tips down on the right.", value: 0, hand: 'drag' },
      { say: "I slide x up. Watch the left pan grow and the beam start to lift.", value: 3, hand: 'drag' },
      { say: "At x equals five, the left is five plus three — that's eight. The beam sits level.", value: 5, hand: 'drag', board: '5 + 3 = 8' },
      { say: "Balanced means solved: x is five. Press balance when it's level. Now let's try one together.", value: 5, hand: 'tap', board: 'x = 5' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'drag',
  },
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re running the weighing bench.</strong> Slide x until the brass beam sits level — that&apos;s the value that solves the equation.</>, ticket: { title: 'Find x', badge: '2x + 3 = 11', tone: 'a' }, startLabel: 'Open the bench →' },
  sig: (t) => t.badge,
}

export default function BalanceBench(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
