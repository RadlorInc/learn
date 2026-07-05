'use client'
/**
 * GearLab — the Exponents & Roots chapter as a PLAYABLE GAME.
 * World: a lab where cranking a gear MULTIPLIES a number (powers) and roots
 * UNDO it. Powers are built by cranking ×base up to the target (value starts
 * at 1); roots are found by sliding to the number that squares back. No slides
 * of theory, no MCQ. Shared adaptive engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * builds 3² crank-by-crank, then a GUIDED order (config.guided) lets the kid build
 * 2³ with Milo coaching (not scored), then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, CrankGear, SlideValue, pick, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#1a1f28', nightBot: '#2b3340',
  cream: '#eef3f8', creamSoft: 'rgba(238,243,248,0.82)',
  inkOnPaper: '#232b34', mutedOnPaper: '#7f8b98',
  gold: '#ffc24d', goldDeep: '#e0921f',
  coral: '#37c8d8', coralDeep: '#1e9aa8', mint: '#5fd3a6',
  glass: 'rgba(18,24,34,0.6)', glassBorder: 'rgba(238,243,248,0.22)',
}

interface Task extends BaseTask { mech: 'crank' | 'slide'; answer: number; base?: number; min?: number; max?: number }

const SUPER: Record<number, string> = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' }
const sup = (e: number) => SUPER[e] ?? `^${e}`

// [base, exp] — the answer (base^exp) is computed. Squares, cubes & a few higher
// powers, spread across the difficulty tiers (bigger / less familiar = harder).
const POW: Record<1 | 2 | 3, [number, number][]> = {
  1: [[2, 2], [3, 2], [4, 2], [5, 2], [2, 3], [3, 3]],                                      // 4,9,16,25,8,27
  2: [[5, 2], [6, 2], [7, 2], [8, 2], [3, 3], [4, 3], [5, 3], [2, 4]],                       // 25…64, 27,64,125,16
  3: [[9, 2], [10, 2], [11, 2], [12, 2], [5, 3], [6, 3], [7, 3], [10, 3], [2, 5], [2, 6], [3, 4]], // 81…144, 125,216,343,1000, 32,64,81
}
// square roots: the base is the answer (0–12 slider), n = base².
const ROOT: Record<1 | 2 | 3, number[]> = {
  1: [2, 3, 4, 5, 6],       // √4 … √36
  2: [5, 6, 7, 8, 9],       // √25 … √81
  3: [8, 9, 10, 11, 12],    // √64 … √144
}

function powerCrank(d: 1 | 2 | 3): Task {
  const [base, exp] = pick(POW[d])
  const answer = Math.round(base ** exp)
  return {
    mech: 'crank', answer, base,
    title: exp === 2 ? `${base} squared` : exp === 3 ? `${base} cubed` : `${base} to the ${exp}`,
    badge: `${base}${sup(exp)}`, tone: 'a',
    prompt: `Turn the handle to build ${base}${sup(exp)} — ×${base} each turn.`,
    say: `Turn the handle ${exp} times — each turn multiplies by ${base} — to build ${base} to the power ${exp}.`,
    work: [`${base}${sup(exp)} means ${base} multiplied ${exp} times.`, `1 ×${base} … = ${answer}.`],
  }
}

function rootSlide(d: 1 | 2 | 3): Task {
  const answer = pick(ROOT[d])
  const n = answer * answer
  return {
    mech: 'slide', answer, min: 0, max: 12,
    title: `Root of ${n}`, badge: `√${n}`, tone: 'b',
    prompt: `√${n} = ? Slide to the number that squares to ${n}.`,
    say: `What is the square root of ${n}? Slide to the number that squares back to ${n}.`,
    work: [`A square root undoes a square.`, `${answer} × ${answer} = ${n}, so √${n} = ${answer}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [() => powerCrank(1), () => powerCrank(1), () => rootSlide(1)]
    : d === 2 ? [() => powerCrank(2), () => rootSlide(2), () => powerCrank(2)]
    : [() => powerCrank(3), () => rootSlide(3), () => powerCrank(3)]
  return pick(pool)()
}

// ── the worked example for the walkthrough (3² = 9) and the guided order (2³ = 8) ──
const DEMO_TASK: Task = { mech: 'crank', answer: 9, base: 3, title: '3 squared', badge: '3²', tone: 'a', prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  mech: 'crank', answer: 8, base: 2, title: '2 cubed', badge: '2³', tone: 'a',
  prompt: 'Build 2³ — turn the handle three times (×2 each turn), then press Build.',
  say: 'Build two cubed. Turn the handle three times — each turn doubles it — then press build.',
  work: ['2³ means 2 multiplied 3 times.', '1 ×2 ×2 ×2 = 8.'],
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'exponentsRoots',
  title: 'GEAR LAB',
  ticketLabel: 'build order',
  palette: P,
  makeTask,
  initialValue: (t) => (t.mech === 'crank' ? 1 : 0),
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  glide: (t, from, setValue, later) =>
    t.mech === 'crank' ? later(() => setValue(t.answer), 600) : glideNumber(from, t.answer, setValue, later),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) =>
    task.mech === 'crank'
      ? <CrankGear P={palette} value={value} setValue={setValue} base={task.base!} floor={1} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="BUILD ✓" />
      : <SlideValue P={palette} value={value} setValue={setValue} min={task.min!} max={task.max!} step={1} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="BUILD ✓" />,
  tutorial: {
    task: DEMO_TASK,
    initial: 1,
    hand: 'crank',
    steps: [
      { say: "Welcome to the Gear Lab! Let's build three squared together.", value: 1, hand: 'crank', board: '3² = ?' },
      { say: 'This gear multiplies by three, and we always start at one.', value: 1, hand: 'crank', board: 'start: 1' },
      { say: 'Turn the handle once: one times three is three.', value: 3, hand: 'crank', board: '1 × 3 = 3' },
      { say: 'Turn it again: three times three is nine.', value: 9, hand: 'crank', board: '3 × 3 = 9' },
      { say: 'Two turns — that is three to the power two. So three squared is nine.', value: 9, board: '3² = 9' },
      { say: 'Turned one too many? Just turn the handle back the other way.', value: 9, hand: 'crank' },
      { say: "When your number is built, press Build. Now let's try one together.", value: 9, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'crank',
  },
  start: {
    blurb: <><strong style={{ color: P.cream }}>You&apos;re running the Gear Lab.</strong> Crank a gear to multiply a number up into powers — and slide to find the roots that undo them.</>,
    ticket: { title: 'Two cubed', badge: '2³', tone: 'a' },
    startLabel: 'Power up →',
  },
  sig: (t) => t.badge,
}

export default function GearLab(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
