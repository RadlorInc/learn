'use client'
/**
 * CableCar — the Linear Relationships chapter as a PLAYABLE GAME.
 * World: a mountain cable car. The kid plans the route by SETTING the cable's
 * slope (m) and start height (b) so the line runs straight through both pylons
 * (LineSetter). Slope is felt as "how steeply the cable climbs", the start as
 * "how high it leaves the base station". No slides, no MCQ. Shared adaptive
 * engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * builds the route y = 2x + 1 dial-by-dial (start height FIRST, then the climb),
 * then a GUIDED order (config.guided) lets the kid run an easy cable with Milo
 * coaching (not scored), then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, LineSetter, type Line, pick } from './parts/gameKit'

const P: Palette = {
  nightTop: '#0f2233', nightBot: '#274a63',
  cream: '#eef6fb', creamSoft: 'rgba(238,246,251,0.82)',
  inkOnPaper: '#1c2e3a', mutedOnPaper: '#7a94a6',
  gold: '#7cc4f2', goldDeep: '#3a8fc9',
  coral: '#ff9640', coralDeep: '#e2721f', mint: '#5fd3a6',
  glass: 'rgba(14,34,52,0.6)', glassBorder: 'rgba(238,246,251,0.22)',
}

interface Task extends BaseTask { p1: [number, number]; p2: [number, number]; answer: Line }

type Spec = { p1: [number, number]; p2: [number, number]; m: number; b: number }

const L1: Spec[] = [
  { p1: [0, 1], p2: [1, 3], m: 2, b: 1 },
  { p1: [0, 0], p2: [1, 2], m: 2, b: 0 },
  { p1: [0, 2], p2: [1, 3], m: 1, b: 2 },
]
const L2: Spec[] = [
  { p1: [0, -1], p2: [2, 3], m: 2, b: -1 },
  { p1: [0, 4], p2: [1, 2], m: -2, b: 4 },
  { p1: [0, 1], p2: [2, 5], m: 2, b: 1 },
]
const L3: Spec[] = [
  { p1: [1, 1], p2: [3, 7], m: 3, b: -2 },
  { p1: [0, 3], p2: [2, -1], m: -2, b: 3 },
  { p1: [0, -2], p2: [1, 1], m: 3, b: -2 },
]

function makeFrom(s: Spec): Task {
  const { p1, p2, m, b } = s
  return {
    title: 'Two pylons',
    badge: `(${p1[0]},${p1[1]}) & (${p2[0]},${p2[1]})`,
    tone: m < 0 ? 'b' : 'a',
    prompt: `Run the cable through (${p1[0]}, ${p1[1]}) and (${p2[0]}, ${p2[1]}). Set the slope and start height so the line hits both pylons.`,
    say: `Run the cable through (${p1[0]}, ${p1[1]}) and (${p2[0]}, ${p2[1]}). Set the slope and start height so the line hits both pylons.`,
    p1, p2, answer: { m, b },
    work: [
      'Slope = change in y ÷ change in x between the points.',
      `Slope ${m}, and it crosses the centre line at ${b}.`,
    ],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool = d === 1 ? L1 : d === 2 ? L2 : L3
  return makeFrom(pick(pool))
}

// ── worked example for the walkthrough (y = 2x + 1) + guided order (y = x + 1) ──
const DEMO_TASK: Task = {
  title: 'Two pylons', badge: '(0,1) & (1,3)', tone: 'a',
  p1: [0, 1], p2: [1, 3], answer: { m: 2, b: 1 }, prompt: '', say: '', work: [],
}
const GUIDED_TASK: Task = {
  title: 'Two pylons', badge: '(0,1) & (1,2)', tone: 'a',
  p1: [0, 1], p2: [1, 2], answer: { m: 1, b: 1 },
  prompt: 'Run the cable through (0,1) and (1,2): start at 1, up 1 each step. Set it, then press Set line.',
  say: 'Set the start height to one, then a slope of one — up one for every one across. Then press set line.',
  work: ['Start height is 1; it climbs 1 for every 1 across.', 'Slope 1, start 1.'],
}

const CONFIG: GameConfig<Line, Task> = {
  chapterId: 'linearRelationships',
  title: 'CABLE CAR LINE',
  ticketLabel: 'route plan',
  palette: P,
  makeTask,
  initialValue: () => ({ m: 1, b: 0 }),
  grade: (t, v) => v.m === t.answer.m && v.b === t.answer.b,
  revealText: (t) => `slope ${t.answer.m}, start ${t.answer.b}`,
  glide: (t, _from, setValue) => setValue(t.answer),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <LineSetter P={palette} line={value} setLine={setValue} range={6} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="SET LINE ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: { m: 1, b: 0 },
    hand: 'tap',
    steps: [
      { say: "Cable car duty! Two pylons to connect: one at the base, one up the mountain.", value: { m: 1, b: 0 }, hand: 'tap' },
      { say: "First, the start height — where the cable leaves the base station. That pylon is at one.", value: { m: 1, b: 0 }, hand: 'tap', board: 'start (b) = 1' },
      { say: "So I lift the start to one. Watch the whole cable rise.", value: { m: 1, b: 1 }, hand: 'tap' },
      { say: "Now the climb, the slope. The far pylon is up two for one step across.", value: { m: 1, b: 1 }, hand: 'tap', board: 'slope (m) = 2' },
      { say: "I steepen it to a slope of two. Now the line hits both pylons.", value: { m: 2, b: 1 }, hand: 'tap', board: 'y = 2x + 1' },
      { say: "Start height first, then slope. Press set line when it fits. Now let's try one together.", value: { m: 2, b: 1 }, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'tap',
  },
  start: {
    blurb: <><strong style={{ color: P.cream }}>You&apos;re planning the cable-car route.</strong> Set the slope and start height so the cable runs straight through both pylons.</>,
    ticket: { title: 'Two pylons', badge: '(0,1) & (1,3)', tone: 'a' },
    startLabel: 'Plan the route →',
  },
  sig: (t) => t.badge,
}

export default function CableCar(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
