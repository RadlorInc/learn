'use client'
/**
 * BuildSite — the Geometry & Measurement chapter as a PLAYABLE GAME.
 * World: a construction site. The kid runs each work order by DIALLING in the
 * measurement — floor area, fence perimeter, crate volume, ramp brace length
 * (Pythagoras) and gable area — on a hi-vis SlideValue and locking it in.
 * No slides, no MCQ. Shared adaptive engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * works a 6×4 floor area, dialling the value up strip by strip, then a GUIDED order
 * (config.guided) lets the kid measure a 3×2 floor with Milo coaching (not scored),
 * then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, SlideValue, pick, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#1a1c22', nightBot: '#2b2f38',
  cream: '#fff4e2', creamSoft: 'rgba(255,244,226,0.82)',
  inkOnPaper: '#26221a', mutedOnPaper: '#8a7f6c',
  gold: '#ffb627', goldDeep: '#d98e12',
  coral: '#f5623c', coralDeep: '#c8401f', mint: '#6fd08c',
  glass: 'rgba(20,22,28,0.6)', glassBorder: 'rgba(255,244,226,0.2)',
}

interface Task extends BaseTask { answer: number }
const MIN = 0, MAX = 60

function area(d: 1 | 2 | 3): Task {
  const [w, h] = d === 1 ? pick([[4, 3], [5, 2]]) : pick([[6, 3]])
  const answer = w * h
  return {
    title: 'Floor area', badge: `area ${w}×${h}`, tone: 'a',
    prompt: `This floor is ${w} by ${h} metres. Dial the AREA.`,
    say: `This floor is ${w} by ${h} metres. Dial the area.`,
    answer,
    work: ['Area = width × height.', `${w} × ${h} = ${answer}.`],
  }
}
function perimeter(): Task {
  const [w, h] = pick([[4, 3]])
  const answer = 2 * (w + h)
  return {
    title: 'Fence line', badge: `perim ${w}×${h}`, tone: 'a',
    prompt: `Fence a yard ${w} by ${h}. Dial the PERIMETER (all the way round).`,
    say: `Fence a yard ${w} by ${h} metres. Dial the perimeter, all the way round.`,
    answer,
    work: ['Perimeter = 2 × (width + height).', `2 × (${w} + ${h}) = ${answer}.`],
  }
}
function volume(): Task {
  const [l, w, h] = Math.random() < 0.5 ? pick([[2, 3, 4]]) : pick([[3, 3, 3]])
  const answer = l * w * h
  return {
    title: 'Crate volume', badge: `vol ${l}×${w}×${h}`, tone: 'b',
    prompt: `A crate is ${l} × ${w} × ${h}. Dial the VOLUME.`,
    say: `A crate is ${l} by ${w} by ${h}. Dial the volume.`,
    answer,
    work: ['Volume = length × width × height.', `${l} × ${w} × ${h} = ${answer}.`],
  }
}
function hypotenuse(): Task {
  const [a, b] = Math.random() < 0.5 ? pick([[3, 4]]) : pick([[6, 8]])
  const answer = Math.round(Math.sqrt(a * a + b * b))
  return {
    title: 'Ramp brace', badge: `brace ${a},${b}`, tone: 'b',
    prompt: `A ramp has legs ${a} and ${b} metres. Dial the length of the sloped BRACE (the hypotenuse).`,
    say: `A ramp has legs ${a} and ${b} metres. Dial the length of the sloped brace, the hypotenuse.`,
    answer,
    work: [`Pythagoras: brace² = ${a}² + ${b}².`, `√(${a * a} + ${b * b}) = ${answer}.`],
  }
}
function triangle(): Task {
  const [base, height] = pick([[6, 4]])
  const answer = (base * height) / 2
  return {
    title: 'Gable area', badge: `tri ${base}×${height}`, tone: 'b',
    prompt: `A triangular gable has base ${base} and height ${height}. Dial its AREA.`,
    say: `A triangular gable has base ${base} and height ${height}. Dial its area.`,
    answer,
    work: ['Triangle area = ½ × base × height.', `½ × ${base} × ${height} = ${answer}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return pick([() => area(1), perimeter, () => area(1)])()
  if (d === 2) return pick([volume, hypotenuse, () => area(2)])()
  return pick([hypotenuse, volume, triangle])()
}

// ── worked example for the walkthrough (6×4 floor area → 24) + guided order (3×2 → 6) ──
const DEMO_TASK: Task = { title: 'Floor area', badge: 'area 6×4', tone: 'a', answer: 24, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'Floor area', badge: 'area 3×2', tone: 'a', answer: 6,
  prompt: 'This floor is 3 by 2 metres. Work out the area, dial it, then press Measure.',
  say: 'This floor is three by two metres. Area is length times width. Dial it, then press measure.',
  work: ['Area = width × height.', '3 × 2 = 6.'],
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'geometryMeasurement',
  title: 'BUILD SITE',
  ticketLabel: 'work order',
  palette: P,
  makeTask,
  initialValue: () => 0,
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}`,
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <SlideValue P={palette} value={value} setValue={setValue} min={MIN} max={MAX} step={1} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="MEASURE ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'drag',
    steps: [
      { say: "Welcome to the build site! Drag this dial to set a measurement.", value: 0, hand: 'drag' },
      { say: "First work order: a floor six metres by four metres. I need its area.", value: 0, hand: 'drag', board: 'floor: 6 × 4' },
      { say: "Area is length times width. Six times four.", value: 0, hand: 'drag', board: 'area = 6 × 4' },
      { say: "Six rows of four is twenty-four. Watch the dial climb — twelve…", value: 12, hand: 'drag' },
      { say: "…and on to twenty-four. That's the area, twenty-four square metres.", value: 24, hand: 'drag', board: '= 24 m²' },
      { say: "When the number is right, press measure to lock it. Now let's try one together.", value: 24, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'drag',
  },
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re running the build site.</strong> Work out each area, perimeter, volume and brace length, then dial it in and lock it.</>, ticket: { title: 'Floor area', badge: '4 × 3', tone: 'a' }, startLabel: 'Start the shift →' },
  sig: (t) => t.badge,
}

export default function BuildSite(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
