'use client'
/**
 * NightFlight — the Coordinate-Plane chapter as a PLAYABLE GAME.
 * World: a night city postal run. The kid flies the mail and DROPS each parcel
 * at its (x, y) address by tapping a four-quadrant map (PlotGrid). Plotting is
 * felt as "go across, then up/down"; reflections as flipping a sign; midpoints
 * as landing halfway. No slides, no MCQ. Shared adaptive engine underneath.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, PlotGrid, type XY, pick } from './parts/gameKit'

const P: Palette = {
  nightTop: '#0b1730', nightBot: '#1a2c52',
  cream: '#f0f4ff', creamSoft: 'rgba(240,244,255,0.82)',
  inkOnPaper: '#1c2740', mutedOnPaper: '#7c88a8',
  gold: '#ffcf5c', goldDeep: '#e0a52f',
  coral: '#ff8a5c', coralDeep: '#e2643f', mint: '#5fd3a6',
  glass: 'rgba(10,22,44,0.62)', glassBorder: 'rgba(240,244,255,0.22)',
}

interface Task extends BaseTask { answer: XY }

function plot(level: 1 | 2): Task {
  const pts: XY[] =
    level === 1
      ? [{ x: 3, y: 2 }, { x: -2, y: 3 }, { x: 4, y: -1 }, { x: 0, y: 3 }]
      : [{ x: -3, y: -2 }, { x: -4, y: 2 }, { x: 2, y: -4 }, { x: 5, y: -3 }]
  const a = pick(pts)
  return {
    title: 'Address drop', badge: `(${a.x}, ${a.y})`, tone: a.x < 0 || a.y < 0 ? 'b' : 'a',
    prompt: `Deliver the parcel to (${a.x}, ${a.y}). Tap the map.`,
    say: `Deliver the parcel to ${a.x}, ${a.y}. Tap the map.`,
    answer: a,
    work: [`Go ${a.x} across first (x), then ${a.y} up or down (y).`, `That lands at (${a.x}, ${a.y}).`],
  }
}

function transform(): Task {
  const kind = pick(['reflectX', 'reflectY', 'midpoint'] as const)

  if (kind === 'reflectX') {
    const from = pick([{ x: 3, y: 2 }, { x: -2, y: 4 }])
    const ans: XY = { x: from.x, y: -from.y }
    return {
      title: 'Mirror drop', badge: `(${ans.x}, ${ans.y})`, tone: 'b',
      prompt: `Reflect the drop (${from.x}, ${from.y}) across the x-axis, then deliver.`,
      say: `Reflect the drop ${from.x}, ${from.y} across the x-axis, then deliver it.`,
      answer: ans,
      work: [`Reflecting across the x-axis flips the sign of y.`, `(${from.x}, ${from.y}) → (${ans.x}, ${ans.y}).`],
    }
  }

  if (kind === 'reflectY') {
    const from = pick([{ x: -2, y: 4 }, { x: 3, y: -1 }])
    const ans: XY = { x: -from.x, y: from.y }
    return {
      title: 'Mirror drop', badge: `(${ans.x}, ${ans.y})`, tone: 'b',
      prompt: `Reflect the drop (${from.x}, ${from.y}) across the y-axis, then deliver.`,
      say: `Reflect the drop ${from.x}, ${from.y} across the y-axis, then deliver it.`,
      answer: ans,
      work: [`Reflecting across the y-axis flips the sign of x.`, `(${from.x}, ${from.y}) → (${ans.x}, ${ans.y}).`],
    }
  }

  // midpoint
  const pair = pick([
    { a: { x: 2, y: 2 }, b: { x: 4, y: 6 } },
    { a: { x: -2, y: 0 }, b: { x: 2, y: 4 } },
  ])
  const ans: XY = { x: (pair.a.x + pair.b.x) / 2, y: (pair.a.y + pair.b.y) / 2 }
  return {
    title: 'Halfway drop', badge: `(${ans.x}, ${ans.y})`, tone: 'a',
    prompt: `Land halfway between (${pair.a.x}, ${pair.a.y}) and (${pair.b.x}, ${pair.b.y}).`,
    say: `Land the parcel halfway between ${pair.a.x}, ${pair.a.y} and ${pair.b.x}, ${pair.b.y}.`,
    answer: ans,
    work: [`Average the x's and the y's.`, `Midpoint = (${ans.x}, ${ans.y}).`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  return d === 1 ? plot(1) : d === 2 ? plot(2) : transform()
}

// ── worked example for the walkthrough (deliver to (3, −2)) + guided order (2, 1) ──
const DEMO_TASK: Task = { title: 'Address drop', badge: '(3, −2)', tone: 'b', answer: { x: 3, y: -2 }, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'Address drop', badge: '(2, 1)', tone: 'a', answer: { x: 2, y: 1 },
  prompt: 'Deliver to (2, 1): two across, one up. Tap the map, then press Deliver.',
  say: 'Deliver to two, one. Go two across, then one up, then press deliver.',
  work: ['Go 2 across first (x), then 1 up (y).', 'That lands at (2, 1).'],
}

const CONFIG: GameConfig<XY, Task> = {
  chapterId: 'coordinatePlane',
  title: 'NIGHT-FLIGHT POSTAL',
  ticketLabel: 'delivery',
  palette: P,
  makeTask,
  initialValue: () => ({ x: 0, y: 0 }),
  grade: (t, v) => v.x === t.answer.x && v.y === t.answer.y,
  revealText: (t) => `(${t.answer.x}, ${t.answer.y})`,
  glide: (t, _from, setValue) => setValue(t.answer),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <PlotGrid P={palette} point={value} setPoint={setValue} range={6} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="DELIVER ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: { x: 0, y: 0 },
    hand: 'tap',
    steps: [
      { say: "Night-flight postal! This is the map. The middle is zero, zero — the post office.", value: { x: 0, y: 0 }, hand: 'tap' },
      { say: "Our address is three, minus two. Always go across first.", value: { x: 0, y: 0 }, hand: 'tap', board: 'address (3, −2)' },
      { say: "Fly three to the right along the middle line.", value: { x: 3, y: 0 }, hand: 'tap', board: 'across x: 3 →' },
      { say: "Now the minus two: minus means go down. Drop two below the line.", value: { x: 3, y: -2 }, hand: 'tap', board: 'down  y: −2 ↓' },
      { say: "That lands at three, minus two — three across, two down.", value: { x: 3, y: -2 }, board: '✓ (3, −2)' },
      { say: "When you're on the address, press deliver. Now let's try one together.", value: { x: 3, y: -2 }, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'tap',
  },
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re flying the night mail.</strong> Read each address, fly across then up or down, and drop the parcel right on the map.</>, ticket: { title: 'First drop', badge: '(3, 2)', tone: 'a' }, startLabel: 'Take off →' },
  sig: (t) => t.badge,
}

export default function NightFlight(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
