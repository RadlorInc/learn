'use client'
/**
 * FrogPond — the Signed & Rational Ops chapter as a PLAYABLE GAME.
 * World: a lily-pond expedition. The kid logs field notes by SLIDING a frog
 * along a signed number-line log (SlideValue). Adding/subtracting is felt as
 * the frog jumping forward/back; multiplying & dividing signed numbers land it
 * on the result. No slides, no MCQ. Shared adaptive engine underneath.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, SlideValue, pick, signed, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#0d2b21', nightBot: '#123f30',
  cream: '#eafff4', creamSoft: 'rgba(234,255,244,0.82)',
  inkOnPaper: '#1c3329', mutedOnPaper: '#6f907f',
  gold: '#ffd873', goldDeep: '#e0a83a',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#4fd6a0',
  glass: 'rgba(9,40,30,0.6)', glassBorder: 'rgba(234,255,244,0.22)',
}

interface Task extends BaseTask { answer: number }
const MIN = -20, MAX = 20

const toneFor = (n: number): 'a' | 'b' => (n < 0 ? 'b' : 'a')

function addSub(): Task {
  const [a, b] = pick([[-3, 5], [4, -6], [-2, -3], [-7, 7], [5, -8], [2, -9], [-4, 3], [6, -4]])
  const ans = a + b
  const move = b > 0 ? `forward ${b}` : `back ${-b}`
  return {
    title: 'First jump', badge: `${a} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`, tone: toneFor(ans),
    prompt: `The frog is at ${a}. It jumps ${move}. Slide it to where it lands.`,
    say: `The frog sits at ${signed(a)}. It jumps ${b > 0 ? `forward ${b}` : `back ${-b}`}. Slide it to where it lands.`,
    answer: ans,
    work: [`Start at ${a}, move ${Math.abs(b)} ${b > 0 ? 'right' : 'left'}.`, `${a} ${b > 0 ? '+' : '−'} ${Math.abs(b)} = ${ans}.`],
  }
}
function mul(): Task {
  const [a, b] = pick([[-4, 3], [-5, -2], [6, -2], [-3, 4], [2, -7], [-6, -3]])
  const ans = a * b
  return {
    title: 'Leap group', badge: `${a} × ${b}`, tone: toneFor(ans),
    prompt: `${a} × ${b} = ? Slide the frog to the result.`,
    say: `${signed(a)} times ${signed(b)}. Slide the frog to the result.`,
    answer: ans,
    work: [`Same signs → positive, different signs → negative.`, `${a} × ${b} = ${ans}.`],
  }
}
function div(): Task {
  const [a, b] = pick([[-8, 2], [-12, -3], [-15, 3], [10, -2], [-18, -6]])
  const ans = a / b
  return {
    title: 'Share out', badge: `${a} ÷ ${b}`, tone: toneFor(ans),
    prompt: `${a} ÷ ${b} = ? Slide the frog to the result.`,
    say: `${signed(a)} divided by ${signed(b)}. Slide the frog to the result.`,
    answer: ans,
    work: [`Same signs → positive, different signs → negative.`, `${a} ÷ ${b} = ${ans}.`],
  }
}
function chain(): Task {
  const [a, b, c] = pick([[-7, 10, -5], [3, -8, 2], [-4, -4, 6]])
  const ans = a + b + c
  const expr = `${a} ${b < 0 ? '−' : '+'} ${Math.abs(b)} ${c < 0 ? '−' : '+'} ${Math.abs(c)}`
  return {
    title: 'Long hop', badge: expr, tone: toneFor(ans),
    prompt: `Slide the frog: ${expr}.`,
    say: `Slide the frog. ${signed(a)}, then ${b < 0 ? `back ${-b}` : `forward ${b}`}, then ${c < 0 ? `back ${-c}` : `forward ${c}`}.`,
    answer: ans,
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

// ── the worked example for the walkthrough (2 − 5 hops left past zero → −3) and the guided order ──
const DEMO_TASK: Task = { title: 'First jump', badge: '2 − 5', tone: 'b', answer: -3, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'First jump', badge: '1 − 3', tone: 'b', answer: -2,
  prompt: 'The frog is at 1. It hops back 3. Slide it to where it lands, then press JUMP ✓.',
  say: 'The frog sits at one. It hops back three. Slide it past zero to where it lands, then press jump.',
  work: ['Start at 1, move 3 left.', '1 − 3 = −2.'],
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'signedRationalOps',
  title: 'FROG POND',
  ticketLabel: 'field notes',
  palette: P,
  makeTask,
  initialValue: () => 0,
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <SlideValue P={palette} value={value} setValue={setValue} min={MIN} max={MAX} step={1} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="JUMP ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'drag',
    steps: [
      { say: 'This is the frog’s number-line log. Drag the frog right to add, left to subtract.', value: 0, hand: 'drag' },
      { say: 'Here’s a jump: the frog starts at two, just right of zero.', value: 2, hand: 'drag', board: 'start: 2' },
      { say: 'It hops back five. Watch it slide left — toward zero…', value: 0, hand: 'drag', board: '2 − 5' },
      { say: '…and keep going past zero: minus one, minus two, minus three.', value: -3, hand: 'drag' },
      { say: 'It landed on minus three — three hops left of zero. That is two minus five.', value: -3, board: '= −3' },
      { say: 'When the frog is in place, press jump. Now let’s try one together.', value: -3, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'drag',
  },
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re on a lily-pond expedition.</strong> Slide the frog along the log to log every jump — forward, back, and past zero into the negatives.</>, ticket: { title: 'First jump', badge: '−3 + 5', tone: 'a' }, startLabel: 'Start the expedition →' },
  sig: (t) => t.badge,
}

export default function FrogPond(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
