'use client'
/**
 * JuiceBar — the Ratio & Proportion chapter as a PLAYABLE GAME.
 * World: Milo's citrus juice bar. The kid mixes two fruits to a recipe RATIO by
 * pouring the taps (TwoTaps): sometimes one tank is fixed and they pour the
 * other to match the ratio; sometimes they scale the whole recipe to a target
 * number of cups and pour BOTH. No slides, no MCQ. Shared adaptive engine
 * underneath — proportion felt as "keep the mix tasting right".
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * builds a two-to-three mango-lime mix cup by cup, then a GUIDED order
 * (config.guided) lets the kid pour a simple one-to-two mix with Milo coaching
 * (not scored), then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, TwoTaps, type Mix, pick } from './parts/gameKit'

const P: Palette = {
  nightTop: '#2a1608', nightBot: '#4a2c0e',
  cream: '#fff4e0', creamSoft: 'rgba(255,244,224,0.82)',
  inkOnPaper: '#3a2510', mutedOnPaper: '#a5885f',
  gold: '#ffa726', goldDeep: '#e07b17',
  coral: '#a4d94a', coralDeep: '#78ac2b', mint: '#5fd3a6',
  glass: 'rgba(42,22,8,0.6)', glassBorder: 'rgba(255,244,224,0.22)',
}

interface Task extends BaseTask {
  ratioA: number
  ratioB: number
  expA: number
  expB: number
  fixed?: 'a' | 'b'
  labelA: string
  labelB: string
}
const MAX = 12
const PAIRS: [string, string][] = [['Mango', 'Lime'], ['Orange', 'Soda'], ['Berry', 'Mint']]

function fillA(): Task {
  const [labelA, labelB] = pick(PAIRS)
  const [ratioA, ratioB, expA] = pick<[number, number, number]>([[1, 2, 2], [2, 3, 4], [3, 2, 6], [1, 3, 3]])
  const per = expA / ratioA
  const expB = per * ratioB
  return {
    title: `${labelA} & ${labelB}`, badge: `${ratioA} : ${ratioB}`, tone: 'a',
    prompt: `Recipe is ${labelA}:${labelB} = ${ratioA}:${ratioB}. You've poured ${expA} ${labelA}. Pour the ${labelB} to match.`,
    say: `The recipe is ${labelA} to ${labelB}, ${ratioA} to ${ratioB}. You've already poured ${expA} ${labelA}. Pour the ${labelB} to keep the mix right.`,
    ratioA, ratioB, expA, expB, fixed: 'a', labelA, labelB,
    work: [`Each part is ${per}.`, `So ${labelB} = ${expB}.`],
  }
}
function fillB(): Task {
  const [labelA, labelB] = pick(PAIRS)
  const [ratioA, ratioB, expB] = pick<[number, number, number]>([[2, 3, 6], [3, 4, 8]])
  const per = expB / ratioB
  const expA = per * ratioA
  return {
    title: `${labelA} & ${labelB}`, badge: `${ratioA} : ${ratioB}`, tone: 'b',
    prompt: `The recipe is ${labelA}:${labelB} = ${ratioA}:${ratioB}. You've poured ${expB} ${labelB}. Pour the ${labelA} to match.`,
    say: `The recipe is ${labelA} to ${labelB}, ${ratioA} to ${ratioB}. You've poured ${expB} ${labelB}. Pour the ${labelA} to match.`,
    ratioA, ratioB, expA, expB, fixed: 'b', labelA, labelB,
    work: [`Each part is ${per}.`, `So ${labelA} = ${expA}.`],
  }
}
function scaleTotal(): Task {
  const [labelA, labelB] = pick(PAIRS)
  const [ratioA, ratioB, total] = pick<[number, number, number]>([[2, 3, 10], [1, 1, 8], [3, 2, 10], [1, 3, 8]])
  const k = total / (ratioA + ratioB)
  const expA = k * ratioA
  const expB = k * ratioB
  return {
    title: `${labelA} & ${labelB}`, badge: `${ratioA} : ${ratioB}`, tone: 'a',
    prompt: `Mix ${labelA}:${labelB} ${ratioA}:${ratioB} to make ${total} cups. Pour BOTH taps.`,
    say: `Mix ${labelA} to ${labelB}, ${ratioA} to ${ratioB}, to make ${total} cups. Pour both taps.`,
    ratioA, ratioB, expA, expB, labelA, labelB,
    work: [`${total} cups over ${ratioA + ratioB} parts = ${k} per part.`, `So ${expA} and ${expB}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [fillA, fillA, fillA]
    : d === 2 ? [scaleTotal, fillB, fillA]
    : [scaleTotal, fillB, fillA]
  return pick(pool)()
}

// ── the worked example for the walkthrough (mango & lime, 2 : 3, built cup by cup)
//    and the guided order (1 : 2 — pour the lime to 2) ──
const DEMO_TASK: Task = {
  title: 'Mango & Lime', badge: '2 : 3', tone: 'a', prompt: '', say: '', work: [],
  ratioA: 2, ratioB: 3, expA: 2, expB: 3, labelA: 'Mango', labelB: 'Lime',
}
const GUIDED_TASK: Task = {
  title: 'Mango & Lime', badge: '1 : 2', tone: 'a',
  prompt: 'One Mango is in. Tap + on Lime until it shows 2, then press POUR.',
  say: 'One mango is already in, and the recipe is one to two. Tap the lime up to two, then press pour.',
  ratioA: 1, ratioB: 2, expA: 1, expB: 2, fixed: 'a', labelA: 'Mango', labelB: 'Lime',
  work: ['Each part is 1 cup.', 'So Lime = 2.'],
}

const CONFIG: GameConfig<Mix, Task> = {
  chapterId: 'ratioProportion',
  title: "MILO'S JUICE BAR",
  ticketLabel: 'recipe card',
  palette: P,
  makeTask,
  initialValue: (t) => ({ a: t.fixed === 'a' ? t.expA : 0, b: t.fixed === 'b' ? t.expB : 0 }),
  grade: (t, v) => t.fixed === 'a' ? v.b === t.expB : t.fixed === 'b' ? v.a === t.expA : (v.a === t.expA && v.b === t.expB),
  revealText: (t) => `${t.expA} : ${t.expB}`,
  glide: (t, _from, setValue) => setValue({ a: t.expA, b: t.expB }),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => (
    <TwoTaps P={palette} mix={value} setMix={setValue} max={MAX} labelA={task.labelA} labelB={task.labelB} fixed={task.fixed} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="POUR ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: { a: 0, b: 0 },
    hand: 'tap',
    steps: [
      { say: 'Welcome to the juice bar — these two taps pour the fruit, and each tap adds one cup.', value: { a: 0, b: 0 }, hand: 'tap' },
      { say: 'This recipe says two parts mango to three parts lime.', value: { a: 0, b: 0 }, hand: 'tap', board: 'mango : lime = 2 : 3' },
      { say: 'Pour the mango first — tap, that is one cup.', value: { a: 1, b: 0 }, hand: 'tap' },
      { say: 'Tap again — two cups, and the mango side is done.', value: { a: 2, b: 0 }, hand: 'tap', board: 'mango = 2' },
      { say: 'Now the lime — one cup so far.', value: { a: 2, b: 1 }, hand: 'tap' },
      { say: 'Two more taps make three cups of lime — two mango and three lime match the recipe, two to three.', value: { a: 2, b: 3 }, board: 'lime = 3  →  2 : 3 ✓' },
      { say: "When your mix is ready, press Pour. Now let's try one together.", value: { a: 2, b: 3 }, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'tap',
  },
  start: {
    blurb: <><strong style={{ color: P.cream }}>You&apos;re running the juice bar.</strong> Pour the taps so every order keeps its recipe ratio — that&apos;s what makes it taste right every time.</>,
    ticket: { title: 'Mango & lime', badge: '2 : 3', tone: 'a' },
    startLabel: 'Open the bar →',
  },
  sig: (t) => `${t.ratioA}:${t.ratioB}|${t.expA}:${t.expB}|${t.fixed ?? '-'}`,
}

export default function JuiceBar(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
