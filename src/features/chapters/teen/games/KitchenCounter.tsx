'use client'
/**
 * KitchenCounter — the Rational Operations chapter as a PLAYABLE GAME.
 * World: Milo's carpentry workshop. The kid works a cut list by MARKING a 12-part
 * board (part-of-a-part fractions) or MEASURING a length with a tape (decimal
 * products, fraction division). Fractions felt as "your section of the board",
 * decimals as "how far you measure", division as "how many pieces fit".
 * No slides-as-lessons, no MCQ. Shared adaptive engine underneath.
 *
 * Teaching is "I do → we do → you do": a step-by-step WALKTHROUGH (config.tutorial)
 * works "half of two thirds" on the twelfths board, then a GUIDED cut (config.guided)
 * lets the kid mark "half of a half" with Milo coaching (not scored), then the scored loop.
 */
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, BarShade, SlideValue, pick, reduce, tidy, glideNumber } from './parts/gameKit'

const P: Palette = {
  nightTop: '#2a1c10', nightBot: '#3a2815',
  cream: '#fff3e2', creamSoft: 'rgba(255,243,226,0.82)',
  inkOnPaper: '#3a2815', mutedOnPaper: '#a68a63',
  gold: '#ffc65c', goldDeep: '#d99327',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#7fd6a0',
  glass: 'rgba(42,28,16,0.6)', glassBorder: 'rgba(255,243,226,0.22)',
}

interface Task extends BaseTask {
  mech: 'bar' | 'slide'
  answer: number
  min?: number
  max?: number
  step?: number
}

// ── part-of-a-part on a 12-part tray (answer = twelfths) ──────────────────────
const BAR_PAIRS: { a: string; b: string; ans: number }[] = [
  { a: '½', b: '½', ans: 3 },
  { a: '⅓', b: '½', ans: 2 },
  { a: '½', b: '⅔', ans: 4 },
  { a: '¼', b: '⅔', ans: 2 },
  { a: '⅓', b: '¾', ans: 3 },
  { a: '⅔', b: '¾', ans: 6 },
  { a: '½', b: '⅓', ans: 2 },
]
function barPart(): Task {
  const { a, b, ans } = pick(BAR_PAIRS)
  return {
    mech: 'bar', title: 'Part of a part', badge: `${a} × ${b}`, tone: 'a',
    prompt: `A board is ${b} of a metre. Take ${a} of it — mark your section of the 12 parts.`,
    say: `A board is ${b} of a metre. Take ${a} of that. Mark your section of the twelve parts.`,
    answer: ans,
    work: [`${a} of ${b} means multiply: ${a} × ${b}.`, `That's ${reduce(ans, 12)} of the board — ${ans} of the 12 parts.`],
  }
}

// ── decimal × decimal (slide 0..1) ────────────────────────────────────────────
const DEC_PAIRS: [number, number][] = [[0.5, 0.4], [0.2, 0.3], [0.5, 0.6], [0.4, 0.5]]
function decMul(): Task {
  const [a, b] = pick(DEC_PAIRS)
  const ans = tidy(a * b)
  return {
    mech: 'slide', title: 'Measure it out', badge: `${a} × ${b}`, tone: 'b',
    min: 0, max: 1, step: 0.01, answer: ans,
    prompt: `${a} × ${b} = ? Slide the tape measure to the answer.`,
    say: `${a} times ${b}. Slide the tape measure to the answer.`,
    work: ['Multiply the decimals.', `${a} × ${b} = ${ans}.`],
  }
}

// ── fraction ÷ fraction (slide 0..6, whole answer) ────────────────────────────
const DIV_ITEMS: [string, string, number][] = [
  ['¾', '¼', 3],
  ['½', '¼', 2],
  ['⅔', '⅓', 2],
  ['1', '¼', 4],
]
function fracDiv(): Task {
  const [a, b, ans] = pick(DIV_ITEMS)
  return {
    mech: 'slide', title: 'How many fit?', badge: `${a} ÷ ${b}`, tone: 'a',
    min: 0, max: 6, step: 1, answer: ans,
    prompt: `How many ${b} pieces cut from ${a} of a board? ${a} ÷ ${b} = ? Slide to it.`,
    say: `How many ${b} pieces can you cut from ${a} of a board? ${a} divided by ${b}. Slide to it.`,
    work: ['Dividing by a fraction asks how many pieces fit.', `${a} ÷ ${b} = ${ans}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [barPart, barPart, barPart]
    : d === 2 ? [barPart, decMul, barPart]
    : [fracDiv, decMul, barPart]
  return pick(pool)()
}

// ── worked examples for the walkthrough — THREE, one per operation, each broken
//    into baby steps so the concept builds up slowly. The tutorial plays them
//    back-to-back (part-of-a-part on the board → decimal × on the tape → fraction
//    ÷ on the tape), then the guided order. ──────────────────────────────────────
const DEMO_BAR: Task = { mech: 'bar', title: 'Part of a part', badge: '½ × ⅔', tone: 'a', answer: 4, prompt: '', say: '', work: [] }
const DEMO_DEC: Task = { mech: 'slide', min: 0, max: 1, step: 0.01, title: 'Measure it out', badge: '0.5 × 0.4', tone: 'b', answer: 0.2, prompt: '', say: '', work: [] }
const DEMO_DIV: Task = { mech: 'slide', min: 0, max: 6, step: 1, title: 'How many fit?', badge: '¾ ÷ ¼', tone: 'a', answer: 3, prompt: '', say: '', work: [] }

// Example 1 — a FRACTION of a fraction, built up on the 12-part board.
const SCRIPT_BAR = {
  task: DEMO_BAR, initial: 0, hand: 'tap' as const,
  steps: [
    { say: 'Welcome to the cutting bench. This board is split into twelve equal parts. Tapping a part marks it.', value: 0, hand: 'tap' as const },
    { say: 'Our job says: the board is two-thirds of a metre, and we need half of that. Let us build it up slowly.', value: 0, board: 'half of ⅔' },
    { say: 'First, what is two-thirds of the board? Split the twelve parts into three equal groups. Twelve shared into three groups is four parts in each group.', value: 0, board: '12 ÷ 3 = 4 each' },
    { say: 'One third is one of those groups — four parts. Watch four parts light up.', value: 4, hand: 'tap' as const, board: '⅓ = 4/12' },
    { say: 'Two thirds is two groups. Four parts, and four more, makes eight parts.', value: 8, hand: 'tap' as const, board: '⅔ = 8/12' },
    { say: 'So the board for this cut is these eight parts. Now we take HALF of the eight.', value: 8, board: 'now: half of 8' },
    { say: 'Half means split the eight into two equal groups. Half of eight is four. Watch four marks switch off.', value: 4, hand: 'tap' as const, board: '½ × 8 = 4' },
    { say: 'Four parts stay marked. Four out of twelve parts is four-twelfths.', value: 4, board: '= 4/12' },
    { say: 'And four-twelfths is the same as one-third of a metre. That is our first cut.', value: 4, board: '= ⅓' },
  ],
}

// Example 2 — a DECIMAL times a decimal, measured on the tape.
const SCRIPT_DEC = {
  task: DEMO_DEC, initial: 0, hand: 'drag' as const,
  steps: [
    { say: 'Now the tape measure. It slides from zero to one metre. Let us work out zero-point-five times zero-point-four.', value: 0, hand: 'drag' as const, board: '0.5 × 0.4' },
    { say: 'Zero-point-four means four-tenths of a metre. Slide the tape out to zero-point-four.', value: 0.4, hand: 'drag' as const, board: '0.4 of a metre' },
    { say: 'Zero-point-five means one half. So we want half of that zero-point-four.', value: 0.4, board: 'half of 0.4' },
    { say: 'Half of zero-point-four is zero-point-two. Slide the tape back to zero-point-two.', value: 0.2, hand: 'drag' as const, board: '0.5 × 0.4 = 0.2' },
    { say: 'So zero-point-five times zero-point-four is zero-point-two. See how multiplying by less than one makes it smaller.', value: 0.2, board: '= 0.2' },
  ],
}

// Example 3 — DIVIDING by a fraction: how many small pieces fit?
const SCRIPT_DIV = {
  task: DEMO_DIV, initial: 0, hand: 'drag' as const,
  steps: [
    { say: 'Last one — dividing by a fraction. How many quarter-metre pieces can we cut from three-quarters of a board?', value: 0, hand: 'drag' as const, board: '¾ ÷ ¼' },
    { say: 'Here is the trick: three-quarters is really three quarter-pieces stuck together.', value: 0, board: '¾ = ¼ + ¼ + ¼' },
    { say: 'So count the quarter-pieces: one, two, three. Slide across to three.', value: 3, hand: 'drag' as const, board: '= 3 pieces' },
    { say: 'Three-quarters divided by one-quarter is three. Dividing asks how many fit — and three pieces fit.', value: 3, board: '¾ ÷ ¼ = 3' },
    { say: "When your cut is set, press Cut. Now let's try one together.", value: 3, hand: 'tap' as const },
  ],
}

const GUIDED_TASK: Task = {
  mech: 'bar', title: 'Half of a half', badge: '½ × ½', tone: 'a', answer: 3,
  prompt: 'Take half of a half board — mark 3 of the 12 parts, then press CUT ✓.',
  say: 'Take half of a half board. Mark three of the twelve parts, then press cut.',
  work: ['Half of a half is a quarter.', 'A quarter of the 12 parts is 3 parts.'],
}

// ── Animated walkthrough scene — the storyboard, in motion ────────────────────
// A code-drawn workbench. For a FRACTION example (mech 'bar') a wooden PLANK is
// divided into 12 equal parts by cut-lines; parts SHADE gold one group at a time
// as the steps build up (⅓ = 4, ⅔ = 8, then half back to 4). For a DECIMAL /
// DIVISION example (mech 'slide') a TAPE MEASURE with a red marker GLIDES to the
// reading. Everything moves via CSS transitions so it glides between beats.
// Driven purely by the walkthrough's per-step `value`, the `task`, and step index.
const GLIDE = 'cubic-bezier(.45,.05,.25,1)'
const ART = '/assets/teen/objects'

function CuttingBenchScene({ palette: P, task, value, stepIndex, frameCount, ended }: {
  palette: Palette; task: Task; value: number; stepIndex: number; frameCount: number; ended: boolean
}) {
  const resultPhase = ended || stepIndex >= frameCount - 2
  const box = {
    position: 'relative' as const,
    width: 'clamp(240px, 74vw, 400px)',
    height: 'clamp(272px, 44vh, 360px)',
    borderRadius: 16,
    background: `linear-gradient(${P.nightTop}, ${P.nightBot})`,
    border: `1.5px solid ${P.glassBorder}`,
    overflow: 'hidden',
    boxShadow: '0 12px 34px rgba(0,0,0,0.42)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(12px, 3vw, 22px)',
  }
  const keyframes = '@keyframes cbPop{0%{opacity:0;transform:translate(-50%,4px) scale(.8)}100%{opacity:1;transform:translate(-50%,0) scale(1)}}@keyframes cbGlow{0%,100%{opacity:.6}50%{opacity:1}}'

  // shared wood tones
  const WOOD_EDGE = '#7a4f1e'

  if (task.mech === 'bar') {
    // ── PLANK: 12 parts, shade `value` of them from the left ──────────────────
    const SEG = 12
    const shaded = Math.max(0, Math.min(SEG, Math.round(value)))
    const denom = task.badge.split('×')[1]?.trim() || '⅔'   // "½ × ⅔" → ⅔
    const boardOn = stepIndex >= 4 && stepIndex <= 5          // the "⅔ board = 8" beats
    return (
      <div style={box}>
        <style>{keyframes}</style>
        {/* workshop backdrop */}
        <img src={`${ART}/cut_workshop_bg.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${P.nightTop}cc, ${P.nightBot}cc)` }} />
        <div style={{ position: 'relative', color: P.creamSoft, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(14px,2vw,18px)', marginBottom: 'clamp(10px,2.4vh,18px)', letterSpacing: 0.3 }}>
          {task.badge}
        </div>

        {/* the plank */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <div style={{ position: 'relative', display: 'flex', width: '100%', height: 'clamp(56px,10vh,84px)', borderRadius: 8, overflow: 'hidden', border: `3px solid ${WOOD_EDGE}`, boxShadow: resultPhase ? `0 0 18px ${P.mint}` : '0 6px 16px rgba(0,0,0,0.45)', transition: `box-shadow 500ms ${GLIDE}` }}>
            {/* the plank illustration sits BEHIND the code-drawn cut-lines + shading */}
            <img src={`${ART}/cut_plank.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} />
            {Array.from({ length: SEG }).map((_, i) => {
              const on = i < shaded
              const isBoard = boardOn && i < 8
              const fill = on
                ? (resultPhase ? P.mint : P.gold)
                : isBoard ? 'rgba(255,198,92,0.16)' : 'transparent'
              return (
                <div key={i} style={{
                  flex: 1,
                  background: on ? fill : 'transparent',
                  borderRight: i < SEG - 1 ? `1.5px solid ${WOOD_EDGE}` : 'none',
                  position: 'relative',
                  zIndex: 1,
                  transition: `background 640ms ${GLIDE}`,
                }}>
                  {!on && isBoard && <div style={{ position: 'absolute', inset: 0, background: fill, transition: `background 640ms ${GLIDE}` }} />}
                </div>
              )
            })}
          </div>

          {/* saw / pencil marker gliding to the shaded edge */}
          <div style={{ position: 'absolute', top: 'clamp(-22px,-3vh,-16px)', left: `${(shaded / SEG) * 100}%`, transform: 'translateX(-50%)', transition: `left 700ms ${GLIDE}`, fontSize: 'clamp(18px,3vw,26px)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.5))' }}>🪚</div>

          {/* count readout under the plank */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'clamp(12px,3vh,20px)' }}>
            <div key={shaded} style={{ padding: '4px 16px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, color: resultPhase ? P.mint : P.gold, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(15px,2.4vw,22px)', animation: 'cbPop 300ms ease' }}>
              {shaded} / {SEG}
            </div>
          </div>
        </div>

        {/* intro / result caption */}
        <div style={{ position: 'relative', marginTop: 'clamp(12px,3vh,20px)', minHeight: 22, color: resultPhase ? P.mint : P.mutedOnPaper, fontWeight: 700, fontSize: 'clamp(11px,1.6vw,14px)', textAlign: 'center' }}>
          {resultPhase ? `${reduce(shaded, SEG)} of the board` : stepIndex === 0 ? 'a board in 12 equal parts' : `board = ${denom} of a metre`}
        </div>
      </div>
    )
  }

  // ── TAPE MEASURE (decimal ×, fraction ÷): marker glides to the reading ──────
  const min = task.min ?? 0
  const max = task.max ?? 1
  const v = Math.max(min, Math.min(max, value))
  const pct = ((v - min) / (max - min)) * 100
  const isDiv = task.badge.includes('÷')
  const readColor = resultPhase ? P.mint : P.gold
  // tick marks along the tape
  const ticks = isDiv ? max : 10   // ÷: whole units 0..max; ×: tenths 0..1
  return (
    <div style={box}>
      <style>{keyframes}</style>
      {/* workshop backdrop */}
      <img src={`${ART}/cut_workshop_bg.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${P.nightTop}cc, ${P.nightBot}cc)` }} />
      <div style={{ position: 'relative', color: P.creamSoft, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(14px,2vw,18px)', marginBottom: 'clamp(42px,7vh,56px)', letterSpacing: 0.3 }}>
        {task.badge}
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
        {/* the tape body */}
        <div style={{ position: 'relative', width: '100%', height: 'clamp(40px,7.5vh,58px)', borderRadius: 7, border: `3px solid ${WOOD_EDGE}`, boxShadow: resultPhase ? `0 0 18px ${P.mint}` : '0 6px 16px rgba(0,0,0,0.45)', transition: `box-shadow 500ms ${GLIDE}`, overflow: 'hidden' }}>
          {/* the tape-measure illustration sits BEHIND the ticks, fill, brackets + needle */}
          <img src={`${ART}/cut_tape.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} />
          {/* filled portion (how far measured) glides */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: resultPhase ? 'rgba(127,214,160,0.34)' : 'rgba(255,198,92,0.30)', transition: `width 760ms ${GLIDE}, background 500ms ${GLIDE}` }} />
          {/* tick marks */}
          {Array.from({ length: ticks + 1 }).map((_, i) => {
            const tp = (i / ticks) * 100
            const major = isDiv || i % 5 === 0
            return (
              <div key={i} style={{ position: 'absolute', left: `${tp}%`, top: 0, width: 1.5, height: major ? '46%' : '28%', background: WOOD_EDGE, opacity: 0.7 }} />
            )
          })}
          {/* division: quarter-piece brackets so you can COUNT how many fit */}
          {isDiv && Array.from({ length: max }).map((_, i) => {
            const filled = i < Math.round(v)
            return (
              <div key={`p${i}`} style={{ position: 'absolute', left: `${(i / max) * 100}%`, width: `${(1 / max) * 100}%`, top: 0, bottom: 0, borderRight: `1.5px solid ${WOOD_EDGE}`, background: filled ? (resultPhase ? 'rgba(127,214,160,0.22)' : 'rgba(255,198,92,0.20)') : 'transparent', transition: `background 640ms ${GLIDE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: filled ? readColor : 'transparent', fontWeight: 800, fontSize: 'clamp(11px,1.6vw,14px)', fontFamily: 'var(--font-numeric)' }}>
                {filled ? i + 1 : ''}
              </div>
            )
          })}
        </div>

        {/* the red marker / needle glides to the reading */}
        <div style={{ position: 'absolute', top: 'clamp(-8px,-1.5vh,-6px)', bottom: 'clamp(-8px,-1.5vh,-6px)', left: `${pct}%`, transform: 'translateX(-50%)', transition: `left 760ms ${GLIDE}`, width: 3, background: resultPhase ? P.mint : P.coral, borderRadius: 2, boxShadow: `0 0 8px ${resultPhase ? P.mint : P.coral}`, zIndex: 3 }} />
        {/* marker value bubble rides above */}
        <div style={{ position: 'absolute', top: 'clamp(-40px,-5.5vh,-30px)', left: `${pct}%`, transform: 'translateX(-50%)', transition: `left 760ms ${GLIDE}`, padding: '3px 12px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, color: readColor, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(14px,2.4vw,20px)', whiteSpace: 'nowrap', zIndex: 4 }}>
          {isDiv ? Math.round(v) : v.toFixed(v % 1 === 0 ? 0 : (Math.round(v * 100) % 10 === 0 ? 1 : 2))}
        </div>

        {/* endpoint labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'clamp(12px,3vh,18px)', color: P.mutedOnPaper, fontFamily: 'var(--font-numeric)', fontWeight: 700, fontSize: 'clamp(10px,1.4vw,13px)' }}>
          <span>{min}</span>
          <span>{isDiv ? `${max} pieces` : `${max} metre`}</span>
        </div>
      </div>

      {/* caption */}
      <div style={{ position: 'relative', marginTop: 'clamp(14px,3vh,22px)', minHeight: 22, color: resultPhase ? P.mint : P.mutedOnPaper, fontWeight: 700, fontSize: 'clamp(11px,1.6vw,14px)', textAlign: 'center' }}>
        {resultPhase ? (isDiv ? `${Math.round(v)} pieces fit` : `${task.badge} = ${v}`) : isDiv ? 'count the pieces that fit' : 'slide the tape to the reading'}
      </div>
    </div>
  )
}

const CONFIG: GameConfig<number, Task> = {
  chapterId: 'rationalOps',
  title: 'CUTTING BENCH',
  motif: '🪚',
  ticketLabel: 'cut list',
  palette: P,
  makeTask,
  initialValue: () => 0,
  grade: (t, v) => t.mech === 'bar' ? v === t.answer : Math.abs(v - t.answer) < 1e-6,
  revealText: (t) => t.mech === 'bar' ? reduce(t.answer, 12) : `${t.answer}`,
  glide: (t, from, setValue, later) => t.mech === 'bar' ? later(() => setValue(t.answer), 600) : glideNumber(from, t.answer, setValue, later),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => (
    task.mech === 'bar'
      ? <BarShade P={palette} count={value} setCount={setValue} segments={12} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="CUT ✓" />
      : <SlideValue P={palette} value={value} setValue={setValue} min={task.min!} max={task.max!} step={task.step!} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="CUT ✓" />
  ),
  tutorial: [SCRIPT_BAR, SCRIPT_DEC, SCRIPT_DIV],
  TutorialScene: CuttingBenchScene,
  guided: {
    task: GUIDED_TASK,
    coach: 'Your turn — I will help.',
    hand: 'tap',
  },
  start: {
    blurb: <><strong style={{ color: P.cream }}>You&apos;re at the bench in Milo&apos;s workshop.</strong> Mark the board or run the tape measure to make every cut on the list exactly right.</>,
    ticket: { title: 'Half of a half', badge: '½ × ½', tone: 'a' },
    startLabel: 'Step up to the bench →',
  },
  overview: {
    say: "Here is what we are figuring out: taking a part of a part. Our board is two-thirds of a metre, and we need half of that — so we will work out half of two-thirds by marking a board split into twelve equal parts.",
    problem: <>What is <strong>half of ⅔</strong>? We&apos;ll take a board that&apos;s <strong>⅔ of a metre</strong> and mark <strong>half of it</strong> on the 12-part bench.</>,
    points: [
      <>&ldquo;of&rdquo; means multiply — we&apos;re working out <strong>½ × ⅔</strong>.</>,
      <>Split the board into 12 equal parts: <strong>⅔ is 8 parts</strong>, then take half of those.</>,
      <>Half of 8 parts is <strong>4 parts</strong> — that&apos;s <strong>4/12</strong>, the same as <strong>⅓ of a metre</strong>.</>,
    ],
  },
  sig: (t) => t.badge,
}

export default function KitchenCounter(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
