'use client'
/**
 * WeatherStation — the Integers chapter as a PLAYABLE GAME.
 * World: a mountain weather station. The kid logs readings by PULLING the
 * mercury up and down a signed thermometer (ThermometerPull). Negatives are
 * felt as "below zero", comparison as "which is colder", absolute value as
 * "how far from zero". No slides, no MCQ. Shared adaptive engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * logs a reading that drops past zero, then a GUIDED order (config.guided) lets the
 * kid set a below-zero reading with Milo coaching (not scored), then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, VThermo, pick, signed, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#10233b', nightBot: '#1d3a5c',
  cream: '#eaf4ff', creamSoft: 'rgba(234,244,255,0.82)',
  inkOnPaper: '#20303f', mutedOnPaper: '#7d94a8',
  gold: '#7ec8ff', goldDeep: '#3a95e0',
  coral: '#ff7a6b', coralDeep: '#e2513f', mint: '#5fd3a6',
  glass: 'rgba(12,28,48,0.6)', glassBorder: 'rgba(234,244,255,0.22)',
}

interface Task extends BaseTask { answer: number }
const MIN = -20, MAX = 20

function setPoint(): Task {
  const t = pick([-5, -4, -3, -2, 2, 3, 4, 5])
  return {
    title: 'Set point', badge: `${t}°`, tone: t < 0 ? 'b' : 'a',
    prompt: `Pull the mercury to ${t}°.`,
    say: `Log a reading of ${signed(t)} degrees.`,
    answer: t,
    work: [`${signed(t)} sits ${Math.abs(t)} ${t < 0 ? 'below' : 'above'} zero.`, `Count ${Math.abs(t)} marks ${t < 0 ? 'down from' : 'up from'} zero and stop there.`],
  }
}
function colder(): Task {
  let a = pick([-8, -6, -5, -3, -2, 4, 6]); let b = pick([-9, -7, -4, -1, 3, 5])
  if (a === b) b = a - 1
  const ans = Math.min(a, b)
  return {
    title: 'Cold snap', badge: `${a}° vs ${b}°`, tone: 'b',
    prompt: `Which is colder — ${a}° or ${b}°? Pull to it.`,
    say: `Which is colder, ${signed(a)} or ${signed(b)} degrees? Pull the mercury to the colder one.`,
    answer: ans,
    work: [`On the thermometer, colder means lower down.`, `${signed(ans)} is below ${signed(Math.max(a, b))}, so ${signed(ans)} is colder.`],
  }
}
function afterChange(): Task {
  const s = pick([-4, -2, 1, 3, 4, 6]); const d = pick([-9, -7, -5, 5, 7])
  const ans = s + d
  const dir = d < 0 ? `drops ${Math.abs(d)}°` : `warms ${d}°`
  return {
    title: 'Overnight', badge: `${s}° ${d < 0 ? '↓' : '↑'}`, tone: d < 0 ? 'b' : 'a',
    prompt: `It's ${s}°. It ${dir}. Pull to the new reading.`,
    say: `It was ${signed(s)} degrees, then it ${dir}. Pull the mercury to the new reading.`,
    answer: ans,
    work: [`Start at ${signed(s)} and move ${Math.abs(d)} ${d < 0 ? 'down' : 'up'}.`, `${s} ${d < 0 ? '−' : '+'} ${Math.abs(d)} is ${signed(ans)}.`],
  }
}
function opposite(): Task {
  const t = pick([-8, -6, -5, 4, 5, 7, 8])
  const ans = -t
  return {
    title: 'Opposite', badge: `opp of ${t}`, tone: 'a',
    prompt: `Pull to the opposite of ${t}°.`,
    say: `Pull the mercury to the opposite of ${signed(t)} degrees.`,
    answer: ans,
    work: [`The opposite is the same distance from zero, other side.`, `The opposite of ${signed(t)} is ${signed(ans)}.`],
  }
}
function distance(): Task {
  const t = pick([-9, -8, -7, -6, 6, 7, 8])
  const ans = Math.abs(t)
  return {
    title: 'Distance', badge: `|${t}|`, tone: 'a',
    prompt: `How far is ${t}° from zero? Pull to that distance.`,
    say: `How many degrees is ${signed(t)} from zero? Pull the mercury up to that distance.`,
    answer: ans,
    work: [`Distance from zero ignores the sign — that's absolute value.`, `${signed(t)} is ${ans} away from zero, so the answer is ${ans}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [setPoint, setPoint, colder]
    : d === 2 ? [afterChange, opposite, colder]
    : [distance, opposite, afterChange]
  return pick(pool)()
}

// ── the worked example for the walkthrough (4° drops 7° → −3) and the guided order (set −5°) ──
const DEMO_TASK: Task = { title: 'Overnight', badge: '4° ↓', tone: 'b', answer: -3, prompt: '', say: '', work: [] }
const GUIDED_TASK: Task = {
  title: 'Set point', badge: '−5°', tone: 'b', answer: -5,
  prompt: 'Pull the mercury down to −5°, then press Log it.',
  say: 'Set the thermometer to minus five. Pull the mercury down below zero, then log it.',
  work: ['−5 sits 5 below zero.', 'Count 5 marks down from zero and stop.'],
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'integers',
  title: 'WEATHER STATION',
  ticketLabel: 'station log',
  palette: P,
  makeTask,
  initialValue: () => 0,
  grade: (t, v) => Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => `${t.answer}°`,
  glide: (t, from, setValue, later) => glideNumber(from, t.answer, setValue, later),
  Instrument: ({ value, setValue, disabled, reveal, palette, onCommit }) => (
    <VThermo P={palette} value={value} setValue={setValue} min={MIN} max={MAX} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="LOG IT ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: 0,
    hand: 'dragV',
    steps: [
      { say: 'This is the weather thermometer. Drag the mercury up for warmer, down for colder.', value: 0, hand: 'dragV' },
      { say: "Here's a reading: it starts at four degrees, up here above zero.", value: 4, hand: 'dragV', board: 'start: 4°' },
      { say: 'Overnight it drops seven degrees. Watch it fall — down toward zero…', value: 0, hand: 'dragV', board: '4 − 7' },
      { say: '…and keep going below zero: minus one, minus two, minus three.', value: -3, hand: 'dragV' },
      { say: 'It landed on minus three — three marks below zero. That is four minus seven.', value: -3, board: '= −3°' },
      { say: "When your reading is set, press Log it. Now let's try one together.", value: -3, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'dragV',
  },
  start: { blurb: <><strong style={{ color: P.cream }}>You&apos;re on weather-station duty.</strong> Pull the mercury up and down to log every reading — even the ones below zero.</>, ticket: { title: 'Morning reading', badge: '−3°', tone: 'b' }, startLabel: 'Open the station →' },
  sig: (t) => `${t.title}:${t.answer}`,
}

export default function WeatherStation(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
