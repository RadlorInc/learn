'use client'
/**
 * FunctionFactory — the Algebraic Expressions chapter as a PLAYABLE GAME.
 * World: a machine on a factory line that eats a number input and outputs
 * another by a posted rule. The kid runs work orders by SLIDING the dial to
 * the output — sometimes evaluating a rule, sometimes working backwards to the
 * input, sometimes combining like terms to a coefficient. No slides, no MCQ.
 * Shared adaptive engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * evaluates 3x + 2 at x = 4 stage by stage, then a GUIDED order (config.guided)
 * lets the kid run x + 2 at x = 3 with Milo coaching (not scored), then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, SlideValue, pick, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#0d2926', nightBot: '#16403a',
  cream: '#eafff7', creamSoft: 'rgba(234,255,247,0.82)',
  inkOnPaper: '#1c302b', mutedOnPaper: '#77958b',
  gold: '#f5a623', goldDeep: '#c9781a',
  coral: '#ff8a4c', coralDeep: '#e05f28', mint: '#4fd6a8',
  glass: 'rgba(10,34,30,0.6)', glassBorder: 'rgba(234,255,247,0.22)',
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
    title: 'Run the rule', badge: `${rule} @ x=${x}`, tone: 'a',
    prompt: `Feed x = ${x} into ${rule}. Set the output.`,
    say: `Feed ${x} into the rule ${rule}. Slide the dial to the output.`,
    answer,
    work: [`Put ${x} in place of x.`, `${filled} = ${answer}.`],
  }
}
// solve: machine already output a value; work backwards to the input x.
function solve(): Task {
  const set: [string, number, number][] = [['2x + 1', 11, 5], ['3x − 2', 10, 4], ['x + 7', 12, 5], ['4x', 20, 5]]
  const [rule, out, answer] = pick(set)
  return {
    title: 'Back-track', badge: `${rule} = ${out}`, tone: 'b',
    prompt: `The machine output ${out} using rule ${rule}. Set the INPUT x.`,
    say: `The machine gave ${out} using the rule ${rule}. Slide to the input x.`,
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
    title: 'Combine terms', badge: `${a}x ${sign} ${Math.abs(b)}x`, tone: 'a',
    prompt: `Combine ${a}x ${sign} ${Math.abs(b)}x. Set the coefficient (the number in front of x).`,
    say: `Combine ${a} x ${b < 0 ? 'minus' : 'plus'} ${Math.abs(b)} x. Slide to the coefficient.`,
    answer,
    work: [`Add the like terms' coefficients.`, `${a} ${sign} ${Math.abs(b)} = ${answer}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [() => evaluate(false), () => evaluate(false), () => evaluate(false)]
    : d === 2 ? [solve, combine, () => evaluate(false)]
    : [() => evaluate(true), solve, combine]
  return pick(pool)()
}

// ── the worked example for the walkthrough (3x + 2 @ x = 4) and the guided order (x + 2 @ x = 3) ──
const DEMO_TASK: Task = { title: 'Run the rule', badge: '3x + 2 @ x=4', tone: 'a', answer: 14, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'Run the rule', badge: 'x + 2 @ x=3', tone: 'a', answer: 5,
  prompt: 'Feed x = 3 into x + 2. Slide the dial to the output, then press RUN.',
  say: 'Feed three into the rule x plus two. Slide the dial to the output, then press run.',
  work: ['Put 3 in place of x.', '3 + 2 = 5.'],
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'algebraicExpressions',
  title: 'FUNCTION FACTORY',
  ticketLabel: 'work order',
  palette: P,
  makeTask,
  initialValue: () => 0,
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <SlideValue P={palette} value={value} setValue={setValue} min={MIN} max={MAX} step={1} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="RUN ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'drag',
    steps: [
      { say: "Welcome to the Function Factory! Each machine changes a number by its rule — you slide the dial to set the output.", value: 0, hand: 'drag' },
      { say: 'This machine follows the rule three x plus two, and we feed it x equals four.', value: 0, hand: 'drag', board: '3x + 2,  x = 4' },
      { say: 'First, put four in place of x: three times four, plus two.', value: 0, board: '3 × 4 + 2' },
      { say: 'Multiply first: three times four is twelve. Watch the dial climb to twelve.', value: 12, hand: 'drag', board: '= 12 + 2' },
      { say: 'Now add the two: twelve plus two is fourteen.', value: 14, hand: 'drag', board: '= 14' },
      { say: 'So the machine turns four into fourteen — that is three x plus two at work.', value: 14 },
      { say: "When your output is set, press Run. Now let's try one together.", value: 14, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'drag',
  },
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re running the Function Factory.</strong> Feed each machine its number, follow the rule, and slide the dial to the output.</>, ticket: { title: 'Rule 2x + 1', badge: 'x → ?', tone: 'a' }, startLabel: 'Start the line →' },
  sig: (t) => t.badge,
}

export default function FunctionFactory(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
