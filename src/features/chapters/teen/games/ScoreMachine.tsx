'use client'
/**
 * ScoreMachine — the Order of Operations chapter as a PLAYABLE GAME.
 * World: an arcade pinball score machine. The kid evaluates an expression with
 * correct precedence (brackets first, then × ÷, then + −) and DIALS the score to
 * the total on a neon combo dial (SlideValue). No slides, no MCQ. Shared adaptive
 * engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * works 2 + 3 × 4 in stages on the dial (times first, then the plus), then a GUIDED
 * combo (config.guided) lets the kid dial one with Milo coaching (not scored),
 * then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, SlideValue, pick, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#0d0716', nightBot: '#1a0e2e',
  cream: '#f6ecff', creamSoft: 'rgba(246,236,255,0.82)',
  inkOnPaper: '#241633', mutedOnPaper: '#8b7aa8',
  gold: '#38e6ff', goldDeep: '#0aa6cc',
  coral: '#ff2fb0', coralDeep: '#c60d84', mint: '#5fe0b0',
  glass: 'rgba(22,10,40,0.62)', glassBorder: 'rgba(246,236,255,0.22)',
}

interface Task extends BaseTask { expr: string; answer: number }
const MIN = 0, MAX = 40

const L1: [string, number][] = [['3 + 2 × 5', 13], ['10 − 2 × 3', 4], ['4 × 2 + 1', 9], ['12 ÷ 2 + 3', 9]]
const L2: [string, number][] = [['(3 + 2) × 5', 25], ['2 × (4 + 1)', 10], ['20 − 3 × 4', 8], ['6 + 8 ÷ 2', 10]]
const L3: [string, number][] = [['3 + 4 × 2 − 1', 10], ['(6 − 2) × 3', 12], ['2³ − 4', 4], ['5 × 2 − 3 × 2', 4]]

function fromPool(pool: [string, number][]): Task {
  const [expr, answer] = pick(pool)
  return {
    title: 'Combo', badge: expr, tone: 'a',
    prompt: `Evaluate ${expr}. Dial the score to the answer.`,
    say: `Evaluate ${expr}. Remember, brackets first, then times and divide, then add and subtract. Dial the score to the answer.`,
    expr, answer,
    work: [`Brackets first, then × and ÷, then + and −.`, `${expr} = ${answer}.`],
  }
}
function comboL1(): Task { return fromPool(L1) }
function comboL2(): Task { return fromPool(L2) }
function comboL3(): Task { return fromPool(L3) }

function makeTask(d: 1 | 2 | 3): Task {
  return d === 1 ? comboL1() : d === 2 ? comboL2() : comboL3()
}

// ── the worked example for the walkthrough (2 + 3 × 4 → 14) and the guided combo (1 + 2 × 3 → 7) ──
const DEMO_TASK: Task = { title: 'Combo', badge: '2 + 3 × 4', tone: 'a', expr: '2 + 3 × 4', answer: 14, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'Combo', badge: '1 + 2 × 3', tone: 'a', expr: '1 + 2 × 3', answer: 7,
  prompt: 'Work out 1 + 2 × 3 — times first — then dial the score to it and press SET SCORE.',
  say: 'Work out one plus two times three. Do the times first, then the plus. Dial the score to your answer and set it.',
  work: ['Times before plus: 2 × 3 is 6.', '1 + 6 is 7.'],
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'orderOfOperations',
  title: 'SCORE MACHINE',
  ticketLabel: 'score card',
  palette: P,
  makeTask,
  initialValue: () => 0,
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <SlideValue P={palette} value={value} setValue={setValue} min={MIN} max={MAX} step={1} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="SET SCORE ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'drag',
    steps: [
      { say: 'This is the Score Machine. Drag the dial to slide the score up or down.', value: 0, hand: 'drag' },
      { say: 'The board reads two plus three times four.', value: 0, board: '2 + 3 × 4' },
      { say: 'It is tempting to add the two and the three first — but times always goes before plus.', value: 0, board: '× before +' },
      { say: 'So I do the times first: three times four is twelve. Watch the dial climb to twelve.', value: 12, hand: 'drag', board: '3 × 4 = 12' },
      { say: 'Now the plus: twelve plus two is fourteen. I slide up two more.', value: 14, hand: 'drag', board: '12 + 2 = 14' },
      { say: "When the score is right, press Set score. Now let's try one together.", value: 14, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'drag',
  },
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re running the Score Machine.</strong> Read each combo, work it out in the right order — brackets first, then × and ÷, then + and − — and dial the score to the total.</>, ticket: { title: 'Combo', badge: '3 + 2 × 5', tone: 'a' }, startLabel: 'Insert coin →' },
  sig: (t) => t.badge,
}

export default function ScoreMachine(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
