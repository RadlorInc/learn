'use client'
/**
 * JuiceBar — the Ratio & Proportion chapter as a PLAYABLE GAME.
 * World: Milo's paint mixing studio. The kid mixes two paint colours to a mix
 * RATIO by adding parts with the taps (TwoTaps): sometimes one colour is fixed
 * and they add the other to match the ratio; sometimes they scale the whole mix
 * to a target number of parts and add BOTH. No slides, no MCQ. Shared adaptive
 * engine underneath — proportion felt as "keep the colour looking right".
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * builds a two-to-three blue-yellow mix part by part, then a GUIDED order
 * (config.guided) lets the kid add a simple one-to-two mix with Milo coaching
 * (not scored), then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, TwoTaps, type Mix, pick } from './parts/gameKit'

const P: Palette = {
  nightTop: '#1a1230', nightBot: '#241640',
  cream: '#fdf2ff', creamSoft: 'rgba(253,242,255,0.82)',
  inkOnPaper: '#2a1840', mutedOnPaper: '#8f7aa8',
  gold: '#ffcf5c', goldDeep: '#e0a534',
  coral: '#ff6b9d', coralDeep: '#e0417a', mint: '#5fd6c0',
  glass: 'rgba(26,18,48,0.6)', glassBorder: 'rgba(253,242,255,0.22)',
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
const PAIRS: [string, string][] = [['Blue', 'Yellow'], ['Red', 'White'], ['Crimson', 'Teal']]

function fillA(): Task {
  const [labelA, labelB] = pick(PAIRS)
  const [ratioA, ratioB, expA] = pick<[number, number, number]>([[1, 2, 2], [2, 3, 4], [3, 2, 6], [1, 3, 3]])
  const per = expA / ratioA
  const expB = per * ratioB
  return {
    title: `${labelA} & ${labelB}`, badge: `${ratioA} : ${ratioB}`, tone: 'a',
    prompt: `Mix is ${labelA}:${labelB} = ${ratioA}:${ratioB}. You've added ${expA} ${labelA}. Add the ${labelB} to match.`,
    say: `The mix is ${labelA} to ${labelB}, ${ratioA} to ${ratioB}. You've already added ${expA} ${labelA}. Add the ${labelB} to keep the colour right.`,
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
    prompt: `The mix is ${labelA}:${labelB} = ${ratioA}:${ratioB}. You've added ${expB} ${labelB}. Add the ${labelA} to match.`,
    say: `The mix is ${labelA} to ${labelB}, ${ratioA} to ${ratioB}. You've added ${expB} ${labelB}. Add the ${labelA} to match.`,
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
    prompt: `Mix ${labelA}:${labelB} ${ratioA}:${ratioB} to make ${total} parts. Add BOTH colours.`,
    say: `Mix ${labelA} to ${labelB}, ${ratioA} to ${ratioB}, to make ${total} parts. Add both colours.`,
    ratioA, ratioB, expA, expB, labelA, labelB,
    work: [`${total} parts over ${ratioA + ratioB} parts = ${k} per part.`, `So ${expA} and ${expB}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [fillA, fillA, fillA]
    : d === 2 ? [scaleTotal, fillB, fillA]
    : [scaleTotal, fillB, fillA]
  return pick(pool)()
}

// ── the worked example for the walkthrough (blue & yellow, 2 : 3, built part by part)
//    and the guided order (1 : 2 — add the yellow to 2) ──
const DEMO_TASK: Task = {
  title: 'Blue & Yellow', badge: '2 : 3', tone: 'a', prompt: '', say: '', work: [],
  ratioA: 2, ratioB: 3, expA: 2, expB: 3, labelA: 'Blue', labelB: 'Yellow',
}
const GUIDED_TASK: Task = {
  title: 'Blue & Yellow', badge: '1 : 2', tone: 'a',
  prompt: 'One Blue is in. Tap + on Yellow until it shows 2, then press MIX.',
  say: 'One blue is already in, and the mix is one to two. Tap the yellow up to two, then press mix.',
  ratioA: 1, ratioB: 2, expA: 1, expB: 2, fixed: 'a', labelA: 'Blue', labelB: 'Yellow',
  work: ['Each part is 1 scoop.', 'So Yellow = 2.'],
}

// ── Animated walkthrough scene — the storyboard, in motion ────────────────────
// A code-drawn paint studio. Two buckets (colour A + colour B) hang above a
// mixing tray. As the narration builds 2 Blue : 3 Yellow, drops FALL from each
// bucket (CSS transition on their position + opacity) and the tray fills with
// stacked colour bands — Blue portion, then Yellow portion — so the ratio is
// visible as two side-by-side stacks. The final result swatch reveals the
// mixed colour + the proportion. Driven purely by the per-step `value` (mix).
const HUE_A = '#4f7cff'   // Blue
const HUE_B = '#ffcf3d'   // Yellow
const HUE_MIX = '#5fd67a' // Blue + Yellow → green (the mixed result)
const GLIDE = '620ms cubic-bezier(.45,.05,.25,1)'

function PaintStudioScene({ palette: P, task, value, stepIndex, frameCount, ended }: {
  palette: Palette; task: Task; value: Mix; stepIndex: number; frameCount: number; ended: boolean
}) {
  const a = Math.max(0, Math.min(task.ratioA, value.a))
  const b = Math.max(0, Math.min(task.ratioB, value.b))
  const totalParts = task.ratioA + task.ratioB
  const resultPhase = ended || stepIndex >= frameCount - 2   // last 2 beats: the answer
  const intro = stepIndex === 0
  // pouring: while a bucket is actively releasing its current drop
  const pouringA = !resultPhase && a > 0 && b === 0
  const pouringB = !resultPhase && b > 0 && b < task.ratioB

  // one small cup per part-slot in each stack; filled ones show, empty are faint
  const cup = (idx: number, filled: boolean, hue: string) => (
    <div key={idx} style={{
      width: '100%', height: 'clamp(14px,3.1vh,22px)', borderRadius: 5,
      background: filled ? hue : 'rgba(255,255,255,0.05)',
      border: `1px solid ${filled ? 'rgba(255,255,255,0.35)' : P.glassBorder}`,
      boxShadow: filled ? `inset 0 -3px 6px rgba(0,0,0,0.22)` : undefined,
      opacity: filled ? 1 : 0.5, transition: `background ${GLIDE}, opacity ${GLIDE}`,
    }} />
  )

  const Bucket = ({ hue, label, count, need, pouring, side }: {
    hue: string; label: string; count: number; need: number; pouring: boolean; side: 'l' | 'r'
  }) => (
    <div style={{ position: 'absolute', top: '4%', [side === 'l' ? 'left' : 'right']: '7%', width: 'clamp(58px,15vw,84px)', textAlign: 'center' }}>
      {/* the paint bucket */}
      <div style={{
        position: 'relative', height: 'clamp(46px,9vh,64px)', borderRadius: '8px 8px 12px 12px',
        background: `linear-gradient(160deg, ${hue}, ${hue}cc)`, border: `1.5px solid rgba(255,255,255,0.4)`,
        boxShadow: pouring ? `0 0 16px ${hue}, 0 4px 10px rgba(0,0,0,0.4)` : '0 4px 10px rgba(0,0,0,0.4)',
        transition: `box-shadow ${GLIDE}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      }}>
        {/* bucket rim */}
        <div style={{ position: 'absolute', top: -4, left: '8%', right: '8%', height: 7, borderRadius: 6, background: hue, border: '1.5px solid rgba(255,255,255,0.5)' }} />
        <div style={{ marginTop: 'clamp(10px,2vh,16px)', fontFamily: 'var(--font-numeric)', fontWeight: 800, color: 'rgba(0,0,0,0.55)', fontSize: 'clamp(15px,2.6vw,22px)' }}>{count}</div>
      </div>
      <div style={{ marginTop: 5, fontWeight: 800, color: P.creamSoft, fontSize: 'clamp(9px,1.3vw,12px)', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ marginTop: 1, fontFamily: 'var(--font-numeric)', fontWeight: 800, color: hue, fontSize: 'clamp(10px,1.4vw,13px)' }}>need {need}</div>
    </div>
  )

  // a falling drop: sits at bucket-bottom when idle, glides down to the tray when pouring
  const drop = (hue: string, side: 'l' | 'r', active: boolean) => (
    <div style={{
      position: 'absolute', top: active ? '52%' : '15%', [side === 'l' ? 'left' : 'right']: '19%',
      width: 'clamp(11px,2.6vw,16px)', height: 'clamp(14px,3.2vw,20px)', borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%',
      background: hue, boxShadow: `0 0 8px ${hue}`, opacity: active ? 1 : 0,
      transition: `top ${GLIDE}, opacity 300ms`, zIndex: 4,
    }} />
  )

  return (
    <div style={{ position: 'relative', width: 'clamp(244px,44vw,356px)', height: 'clamp(300px,46vh,440px)', borderRadius: 16, background: `linear-gradient(${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, overflow: 'hidden', boxShadow: '0 12px 34px rgba(0,0,0,0.42)' }}>
      <style>{'@keyframes psPop{0%{opacity:0;transform:translate(-50%,6px) scale(.8)}100%{opacity:1;transform:translate(-50%,0) scale(1)}}@keyframes psGlow{0%,100%{box-shadow:0 0 18px var(--g),0 6px 16px rgba(0,0,0,.4)}50%{box-shadow:0 0 34px var(--g),0 6px 16px rgba(0,0,0,.4)}}'}</style>

      {/* the ratio ticket, top-centre */}
      <div style={{ position: 'absolute', top: '3%', left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, color: P.cream, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(13px,1.9vw,17px)', whiteSpace: 'nowrap', zIndex: 5 }}>
        <span style={{ color: HUE_A }}>{task.labelA}</span> : <span style={{ color: HUE_B }}>{task.labelB}</span> = {task.ratioA} : {task.ratioB}
      </div>

      {/* two paint buckets */}
      <Bucket hue={HUE_A} label={task.labelA} count={a} need={task.ratioA} pouring={pouringA} side="l" />
      <Bucket hue={HUE_B} label={task.labelB} count={b} need={task.ratioB} pouring={pouringB} side="r" />

      {/* falling drops */}
      {drop(HUE_A, 'l', pouringA)}
      {drop(HUE_B, 'r', pouringB)}

      {/* the mixing tray — two stacked colour columns sitting inside a glass */}
      <div style={{ position: 'absolute', bottom: '9%', left: '50%', transform: 'translateX(-50%)', width: 'clamp(150px,36vw,236px)', borderRadius: '8px 8px 14px 14px', background: 'rgba(0,0,0,0.28)', border: `1.5px solid ${P.glassBorder}`, padding: 'clamp(6px,1.4vh,10px)', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', gap: 'clamp(6px,1.6vw,12px)', alignItems: 'flex-end' }}>
          {/* colour A stack */}
          <div style={{ flex: task.ratioA, display: 'flex', flexDirection: 'column-reverse', gap: 3 }}>
            {Array.from({ length: task.ratioA }, (_, i) => cup(i, i < a, HUE_A))}
          </div>
          {/* colour B stack */}
          <div style={{ flex: task.ratioB, display: 'flex', flexDirection: 'column-reverse', gap: 3 }}>
            {Array.from({ length: task.ratioB }, (_, i) => cup(i, i < b, HUE_B))}
          </div>
        </div>
        {/* stack labels */}
        <div style={{ display: 'flex', gap: 'clamp(6px,1.6vw,12px)', marginTop: 5 }}>
          <div style={{ flex: task.ratioA, textAlign: 'center', fontFamily: 'var(--font-numeric)', fontWeight: 800, color: HUE_A, fontSize: 'clamp(11px,1.6vw,15px)' }}>{a}</div>
          <div style={{ flex: task.ratioB, textAlign: 'center', fontFamily: 'var(--font-numeric)', fontWeight: 800, color: HUE_B, fontSize: 'clamp(11px,1.6vw,15px)' }}>{b}</div>
        </div>
      </div>

      {/* intro cue */}
      {intro && (
        <div style={{ position: 'absolute', bottom: '2.5%', left: '50%', transform: 'translateX(-50%)', animation: 'psPop 300ms ease', color: P.creamSoft, fontWeight: 700, fontSize: 'clamp(10px,1.4vw,13px)', whiteSpace: 'nowrap', zIndex: 6 }}>each tap adds one part</div>
      )}

      {/* result: the mixed swatch + proportion, glowing */}
      {resultPhase && (
        <div style={{ position: 'absolute', bottom: '2%', left: '50%', ['--g' as string]: HUE_MIX, transform: 'translateX(-50%)', animation: 'psPop 340ms ease, psGlow 1600ms ease-in-out infinite 340ms', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 999, background: HUE_MIX, zIndex: 6 }}>
          <span style={{ width: 'clamp(14px,2.4vw,18px)', height: 'clamp(14px,2.4vw,18px)', borderRadius: '50%', background: HUE_MIX, border: '2px solid rgba(255,255,255,0.8)', boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.3)' }} />
          <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, color: 'rgba(0,0,0,0.7)', fontSize: 'clamp(12px,1.8vw,16px)', whiteSpace: 'nowrap' }}>{task.ratioA} : {task.ratioB} · {totalParts} parts ✓</span>
        </div>
      )}
    </div>
  )
}

const CONFIG: GameConfig<Mix, Task> = {
  chapterId: 'ratioProportion',
  title: 'PAINT STUDIO',
  motif: '🎨',
  ticketLabel: 'mix order',
  palette: P,
  makeTask,
  initialValue: (t) => ({ a: t.fixed === 'a' ? t.expA : 0, b: t.fixed === 'b' ? t.expB : 0 }),
  grade: (t, v) => t.fixed === 'a' ? v.b === t.expB : t.fixed === 'b' ? v.a === t.expA : (v.a === t.expA && v.b === t.expB),
  revealText: (t) => `${t.expA} : ${t.expB}`,
  glide: (t, _from, setValue) => setValue({ a: t.expA, b: t.expB }),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => (
    <TwoTaps P={palette} mix={value} setMix={setValue} max={MAX} labelA={task.labelA} labelB={task.labelB} fixed={task.fixed} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="MIX ✓" />
  ),
  tutorial: {
    task: DEMO_TASK,
    initial: { a: 0, b: 0 },
    hand: 'tap',
    steps: [
      { say: 'Welcome to the paint studio — these two taps add the paint, and each tap adds one part.', value: { a: 0, b: 0 }, hand: 'tap' },
      { say: 'Our order says mix blue and yellow, two to three.', value: { a: 0, b: 0 }, board: 'blue : yellow = 2 : 3' },
      { say: 'Two to three means: for every two parts of blue, we need three parts of yellow. Let us build it slowly.', value: { a: 0, b: 0 }, board: 'for every 2 blue → 3 yellow' },
      { say: 'Start with the blue. Tap once — that is one blue.', value: { a: 1, b: 0 }, hand: 'tap', board: 'blue: 1' },
      { say: 'Tap the blue again — two blues. That is the blue side done.', value: { a: 2, b: 0 }, hand: 'tap', board: 'blue: 2 ✓' },
      { say: 'Now the yellow. Tap once — one yellow.', value: { a: 2, b: 1 }, hand: 'tap', board: 'yellow: 1' },
      { say: 'Tap the yellow again — two yellows.', value: { a: 2, b: 2 }, hand: 'tap', board: 'yellow: 2' },
      { say: 'One more tap of yellow — three yellows. That is the yellow side done.', value: { a: 2, b: 3 }, hand: 'tap', board: 'yellow: 3 ✓' },
      { say: 'Now check it: two blue and three yellow. That matches the mix, two to three.', value: { a: 2, b: 3 }, board: '2 blue : 3 yellow = 2 : 3 ✓' },
      { say: "When your mix is ready, press Mix. Now let's try one together.", value: { a: 2, b: 3 }, hand: 'tap' },
    ],
  },
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'tap',
  },
  TutorialScene: PaintStudioScene,
  start: {
    blurb: <><strong style={{ color: P.cream }}>You&apos;re running the paint studio.</strong> Add the parts so every order keeps its mix ratio — that&apos;s what makes the colour come out right every time.</>,
    ticket: { title: 'Blue & yellow', badge: '2 : 3', tone: 'a' },
    startLabel: 'Open the studio →',
  },
  sig: (t) => `${t.ratioA}:${t.ratioB}|${t.expA}:${t.expB}|${t.fixed ?? '-'}`,
}

export default function JuiceBar(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
