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
import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig } from './parts/GameShell'
import { Palette, BarShade, Nudge, CommitBtn, pick, reduce, tidy, glideNumber, numChoices } from './parts/gameKit'

const P: Palette = {
  nightTop: '#2a1c10', nightBot: '#3a2815',
  cream: '#fff3e2', creamSoft: 'rgba(255,243,226,0.82)',
  inkOnPaper: '#3a2815', mutedOnPaper: '#a68a63',
  gold: '#ffc65c', goldDeep: '#d99327',
  coral: '#ff8a6b', coralDeep: '#e25b3f', mint: '#7fd6a0',
  glass: 'rgba(42,28,16,0.6)', glassBorder: 'rgba(255,243,226,0.22)',
}

interface Task extends BaseTask {
  mech: 'bar' | 'slide' | 'area' | 'pieces'
  answer: number
  min?: number
  max?: number
  step?: number
  da?: number; db?: number                 // area (decimal × decimal): the two factors
  denom?: number; board?: number; piece?: number  // pieces (fraction ÷ fraction)
}

// ── part-of-a-part on a 12-part tray (answer = twelfths) ──────────────────────
// Every `b` divides the 12-part board into whole parts (so the child can shade the
// board first), and every a × b lands on a whole number of twelfths.
const BAR_PAIRS: { a: string; b: string; ans: number }[] = [
  { a: '½', b: '½', ans: 3 },
  { a: '⅓', b: '½', ans: 2 },
  { a: '½', b: '⅔', ans: 4 },
  { a: '¼', b: '⅔', ans: 2 },
  { a: '⅓', b: '¾', ans: 3 },
  { a: '⅔', b: '¾', ans: 6 },
  { a: '½', b: '⅙', ans: 1 },
  { a: '⅓', b: '¼', ans: 1 },
  { a: '½', b: '⅚', ans: 5 },
  { a: '⅓', b: '1', ans: 4 },
  { a: '¼', b: '1', ans: 3 },
]
// Fraction glyphs are for the BADGE (and the printed context). Spoken lines and plain
// story lines spell them out — TTS mangles ⅔, and a struggling reader shouldn't have to
// decode a symbol to understand the story.
const FRACW: Record<string, string> = {
  '½': 'half', '⅓': 'a third', '⅔': 'two thirds', '¼': 'a quarter',
  '¾': 'three quarters', '⅙': 'a sixth', '⅚': 'five sixths', '1': 'a whole',
}
const lenOf = (f: string) => (f === '1' ? 'a whole metre' : `${FRACW[f]} of a metre`)
function barPart(): Task {
  const { a, b, ans } = pick(BAR_PAIRS)
  return {
    mech: 'bar', title: 'Part of a part', badge: `${a} × ${b}`, tone: 'a',
    context: `The board is ${lenOf(b)} long. You need ${FRACW[a]} of it — that means one part of the board, not the whole thing.`,
    instruction: 'Look at the board with 12 equal parts. Shade the parts this cut covers, then press CUT.',
    prompt: `A board is ${b} of a metre. Take ${a} of it — mark your section of the 12 parts.`,
    say: `A board is ${lenOf(b)}. Take ${FRACW[a]} of that. Mark your section of the twelve parts.`,
    answer: ans,
    work: [`${FRACW[a]} of ${FRACW[b]} means multiply them.`, `That's ${reduce(ans, 12)} of the board — ${ans} of the 12 parts.`],
  }
}

// ── decimal × decimal — SOLVE ON a 10×10 hundredths AREA MODEL: shade `a` of the
//    columns and `b` of the rows; the OVERLAP squares ARE the product (÷100). The
//    child never dials a decimal worked out in the head — the grid computes it. ──
const DEC_PAIRS: [number, number][] = [[0.5, 0.4], [0.2, 0.3], [0.5, 0.6], [0.4, 0.5]]
function decMul(): Task {
  const [a, b] = pick(DEC_PAIRS)
  const ans = tidy(a * b)
  const ta = Math.round(a * 10), tb = Math.round(b * 10)   // the two factors in tenths
  return {
    mech: 'area', title: 'Measure it out', badge: `${a} × ${b}`, tone: 'b', answer: ans, da: a, db: b,
    context: `This cut measures ${a} × ${b} of a metre. When you multiply two numbers under 1, the piece comes out smaller than both.`,
    padInstruction: `Work out ${a} × ${b}, then tap that number.`,
    prompt: `${a} × ${b} on the metre grid: shade ${a} across and ${b} down. The overlap squares are the answer.`,
    say: `What is ${a} times ${b}? Think in tenths: ${ta} tenths times ${tb} tenths makes hundredths. Then tap your answer.`,
    work: [`${ta} tenths times ${tb} tenths is ${ta * tb} hundredths.`, `${a} × ${b} = ${ans}.`],
  }
}

// ── fraction ÷ fraction — SOLVE ON the illustration by LAYING the small pieces into
//    the board and COUNTING how many fit (¾ = ¼+¼+¼ → 3). No quotient dialled. Each
//    piece is one unit of a `denom`-part metre; the board is the first `board` units. ──
const DIV_ITEMS: { a: string; b: string; denom: number; board: number; piece: number; ans: number }[] = [
  { a: '¾', b: '¼', denom: 4, board: 3, piece: 1, ans: 3 },
  { a: '½', b: '¼', denom: 4, board: 2, piece: 1, ans: 2 },
  { a: '⅔', b: '⅓', denom: 3, board: 2, piece: 1, ans: 2 },
  { a: '1', b: '¼', denom: 4, board: 4, piece: 1, ans: 4 },
]
function fracDiv(): Task {
  const { a, b, denom, board, piece, ans } = pick(DIV_ITEMS)
  return {
    mech: 'pieces', title: 'How many fit?', badge: `${a} ÷ ${b}`, tone: 'a', answer: ans, denom, board, piece,
    context: `A board is ${lenOf(a)} long. Each piece you cut must be ${lenOf(b)}. Dividing means finding how many of those pieces fit.`,
    padInstruction: `Work out how many pieces of ${FRACW[b]} of a metre fit, then tap that number.`,
    prompt: `How many ${b} pieces cut from ${a} of a board? Lay ${b} pieces along the board — the count is the answer.`,
    say: `How many pieces of ${FRACW[b]} of a metre can you cut from ${lenOf(a)}? Count how many fit.`,
    work: ['Dividing by a fraction asks how many pieces fit.', `${FRACW[a]} divided by ${FRACW[b]} is ${ans}.`],
  }
}

// ── decimal ÷ decimal — SAME "how many pieces fit" illustration as fraction ÷: a
//    1.5 m board cut into 0.5 m pieces is "how many 0.5s fit in 1.5" → 3. The tape
//    slots are the pieces; the count IS the quotient. Values chosen to fit whole. ──
const DECDIV_ITEMS: { a: string; b: string; denom: number; board: number; piece: number; ans: number }[] = [
  { a: '1.5', b: '0.5', denom: 5, board: 3, piece: 1, ans: 3 },
  { a: '2', b: '0.5', denom: 5, board: 4, piece: 1, ans: 4 },
  { a: '2.4', b: '0.6', denom: 6, board: 4, piece: 1, ans: 4 },
  { a: '1.5', b: '0.3', denom: 6, board: 5, piece: 1, ans: 5 },
]
function decDiv(): Task {
  const { a, b, denom, board, piece, ans } = pick(DECDIV_ITEMS)
  return {
    mech: 'pieces', title: 'How many fit?', badge: `${a} ÷ ${b}`, tone: 'b', answer: ans, denom, board, piece,
    context: `A board is ${a} metres long. Each piece you cut must be ${b} metres. Dividing means finding how many of those pieces fit.`,
    padInstruction: `Work out how many ${b} m pieces fit, then tap that number.`,
    prompt: `How many ${b} m pieces fit in ${a} m? Lay them along the board — the count is the answer.`,
    say: `How many ${b} metre pieces fit in ${a} metres? Count them, then tap your answer.`,
    work: ['Dividing asks how many pieces fit.', `${a} ÷ ${b} = ${ans}.`],
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  const pool: (() => Task)[] =
    d === 1 ? [barPart, barPart, barPart]
    : d === 2 ? [barPart, decMul, barPart]
    : [fracDiv, decDiv, decMul, barPart]
  return pick(pool)()
}

// ── worked examples for the walkthrough — THREE, one per operation, each broken
//    into baby steps so the concept builds up slowly. The tutorial plays them
//    back-to-back (part-of-a-part on the board → decimal × on the tape → fraction
//    ÷ on the tape), then the guided order. ──────────────────────────────────────
const DEMO_BAR: Task = { mech: 'bar', title: 'Part of a part', badge: '½ × ⅔', tone: 'a', answer: 4, context: 'The board is ⅔ of a metre. This cut needs half of that — one part of the board, not all of it.', instruction: 'Look at the 12-part board. Shade the parts this cut covers.', prompt: '', say: '', work: [] }
const DEMO_DEC: Task = { mech: 'slide', min: 0, max: 1, step: 0.01, title: 'Measure it out', badge: '0.5 × 0.4', tone: 'b', answer: 0.2, instruction: 'Look at the tape measure. Slide it to the length.', prompt: '', say: '', work: [] }
const DEMO_DIV: Task = { mech: 'slide', min: 0, max: 6, step: 1, title: 'How many fit?', badge: '¾ ÷ ¼', tone: 'a', answer: 3, context: 'A board is ¾ of a metre long. Each piece must be ¼ of a metre. Dividing finds how many pieces fit.', instruction: 'Look at the tape. Slide it to count how many pieces fit.', prompt: '', say: '', work: [] }

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
  context: 'The board is half a metre. This cut needs half of that — one part of it, not the whole board.',
  instruction: 'Look at the 12-part board. Shade the parts this cut covers, then press CUT ✓.',
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

  // ── Framer Motion: a single spring-driven progress value the whole scene reads
  //    from, so the saw marker / tape fill / needle / readout all GLIDE at 60fps
  //    instead of jumping per narration step. Overdamped so it settles cleanly on
  //    the step's target and never overshoots. Reduced-motion → snaps. ──
  const SEG = 12
  const barMin = task.min ?? 0
  const barMax = task.max ?? 1
  const isDivT = task.badge.includes('÷')
  const clampV = (x: number) => Math.max(barMin, Math.min(barMax, x))
  const prefersReduced = useReducedMotion()
  const mv = useMotionValue(value)
  useEffect(() => {
    const controls = animate(mv, value, prefersReduced ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 24, mass: 0.9 })
    return () => controls.stop()
  }, [value, prefersReduced, mv])
  // bar: saw marker glides to the shaded edge
  const sawLeft = useTransform(mv, (x) => `${(Math.max(0, Math.min(SEG, x)) / SEG) * 100}%`)
  // slide: fill width / needle / bubble all follow the same reading
  const slidePct = useTransform(mv, (x) => `${((clampV(x) - barMin) / (barMax - barMin)) * 100}%`)
  const slideRead = useTransform(mv, (x) => {
    const vv = clampV(x)
    return isDivT ? `${Math.round(vv)}` : (vv % 1 === 0 ? vv.toFixed(0) : (Math.round(vv * 100) % 10 === 0 ? vv.toFixed(1) : vv.toFixed(2)))
  })

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

          {/* saw / pencil marker gliding to the shaded edge (spring) */}
          <motion.div style={{ position: 'absolute', top: 'clamp(-22px,-3vh,-16px)', left: sawLeft, transform: 'translateX(-50%)', fontSize: 'clamp(18px,3vw,26px)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.5))' }}>🪚</motion.div>

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
  const min = barMin
  const max = barMax
  const v = clampV(value)
  const isDiv = isDivT
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
          {/* filled portion (how far measured) glides (spring) */}
          <motion.div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: slidePct, background: resultPhase ? 'rgba(127,214,160,0.34)' : 'rgba(255,198,92,0.30)', transition: `background 500ms ${GLIDE}` }} />
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

        {/* the red marker / needle glides to the reading (spring) */}
        <motion.div style={{ position: 'absolute', top: 'clamp(-8px,-1.5vh,-6px)', bottom: 'clamp(-8px,-1.5vh,-6px)', left: slidePct, transform: 'translateX(-50%)', width: 3, background: resultPhase ? P.mint : P.coral, borderRadius: 2, boxShadow: `0 0 8px ${resultPhase ? P.mint : P.coral}`, zIndex: 3 }} />
        {/* marker value bubble rides above, number ticks as it glides (spring) */}
        <motion.div style={{ position: 'absolute', top: 'clamp(-40px,-5.5vh,-30px)', left: slidePct, transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: 999, background: P.glass, border: `1px solid ${P.glassBorder}`, color: readColor, fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(14px,2.4vw,20px)', whiteSpace: 'nowrap', zIndex: 4 }}>
          {slideRead}
        </motion.div>

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

// ── panel shell shared by the two new solve-on-the-illustration instruments ──
function benchPanel(P: Palette): React.CSSProperties {
  return { width: 'clamp(248px, 50vw, 420px)', minHeight: 'clamp(170px,26vh,240px)', boxSizing: 'border-box', borderRadius: 16, background: `linear-gradient(160deg, ${P.nightTop}, ${P.nightBot})`, border: `1.5px solid ${P.glassBorder}`, boxShadow: '0 12px 34px rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px,1.4vh,14px)', padding: 'clamp(14px,2.2vw,22px)' }
}
const benchHead = (P: Palette): React.CSSProperties => ({ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.creamSoft, textAlign: 'center' })

// ── DECIMAL × DECIMAL — a 10×10 metre grid. Shade `a` columns across and `b` rows
//    down; the OVERLAP squares are a×b (÷100). The product EMERGES from the grid. ──
function DecimalArea({ P, task, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; setValue: (v: number) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: number) => void
}) {
  const da = Math.round((task.da ?? 0) * 10)   // columns for factor a (tenths)
  const db = Math.round((task.db ?? 0) * 10)   // rows for factor b
  const [ca, setCa] = useState(0)
  const [rb, setRb] = useState(0)
  useEffect(() => { setCa(0); setRb(0) }, [task])
  useEffect(() => { if (reveal) { setCa(da); setRb(db) } }, [reveal, da, db])
  const overlap = ca * rb
  const product = tidy(overlap / 100)
  const hit = Math.abs(product - task.answer) < 1e-6
  const setAcross = (v: number) => { if (disabled) return; const n = Math.max(0, Math.min(10, v)); setCa(n); setValue(tidy(n * rb / 100)) }
  const setDown = (v: number) => { if (disabled) return; const n = Math.max(0, Math.min(10, v)); setRb(n); setValue(tidy(ca * n / 100)) }
  const cell = 'clamp(13px, 3vw, 24px)'
  const overlapCol = reveal || hit ? P.mint : P.gold
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vw,16px)', width: '100%' }}>
      <div style={benchPanel(P)}>
        <div style={benchHead(P)}>🪚 {task.badge} · 1 metre grid</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(10, ${cell})`, gap: 1.5, padding: 5, borderRadius: 8, background: 'rgba(0,0,0,0.28)', border: `2px solid ${P.glassBorder}` }}>
          {Array.from({ length: 100 }, (_, i) => {
            const c = i % 10, r = Math.floor(i / 10)
            const across = c < ca, down = r < rb, both = across && down
            const bg = both ? `linear-gradient(${overlapCol}, ${P.goldDeep})`
              : across ? 'rgba(255,198,92,0.20)'
              : down ? 'rgba(127,214,160,0.16)'
              : 'rgba(255,244,226,0.05)'
            return <div key={i} style={{ width: cell, height: cell, borderRadius: 2, background: bg, border: `1px solid ${both ? P.goldDeep : 'rgba(255,244,226,0.14)'}` }} />
          })}
        </div>
        <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(18px,3vw,30px)', lineHeight: 1, color: hit ? P.mint : P.gold }}>
          {tidy(ca / 10)} × {tidy(rb / 10)} = <span style={{ color: hit ? P.mint : P.creamSoft }}>{overlap}/100 = {product}</span>
        </div>
        <div style={{ minHeight: '1.2em', fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', color: hit ? P.mint : P.mutedOnPaper }}>{hit ? 'the overlap is the answer ✓' : 'shade a across, b down — read the overlap'}</div>
      </div>
      <div style={{ display: 'flex', gap: 'clamp(14px,3vw,30px)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Nudge P={P} label="−" disabled={disabled} onClick={() => setAcross(ca - 1)} />
          <div style={{ minWidth: 78, textAlign: 'center' }}><div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(16px,2vw,22px)', fontWeight: 800, color: P.gold }}>{tidy(ca / 10)}</div><div style={{ fontSize: 'clamp(9px,1vw,12px)', color: P.creamSoft }}>across</div></div>
          <Nudge P={P} label="+" disabled={disabled} onClick={() => setAcross(ca + 1)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Nudge P={P} label="−" disabled={disabled} onClick={() => setDown(rb - 1)} />
          <div style={{ minWidth: 78, textAlign: 'center' }}><div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(16px,2vw,22px)', fontWeight: 800, color: P.mint }}>{tidy(rb / 10)}</div><div style={{ fontSize: 'clamp(9px,1vw,12px)', color: P.creamSoft }}>down</div></div>
          <Nudge P={P} label="+" disabled={disabled} onClick={() => setDown(rb + 1)} />
        </div>
      </div>
      <CommitBtn P={P} label="CUT ✓" disabled={disabled} onClick={() => onCommit(product)} />
    </div>
  )
}

// ── FRACTION ÷ FRACTION — lay the small pieces along the board and count how many
//    fit. The board is the first `board` units of a `denom`-part metre; each piece is
//    one unit. Overshoot past the board is flagged, so the count IS the quotient. ──
function PieceTape({ P, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: number; setValue: (v: number) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: number) => void
}) {
  const denom = task.denom!, board = task.board!
  const laid = Math.max(0, Math.min(denom, Math.round(value)))
  const fits = laid === board
  const set = (v: number) => { if (!disabled) setValue(Math.max(0, Math.min(denom, v))) }
  const col = reveal || fits ? P.mint : P.gold
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.4vw,16px)', width: '100%' }}>
      <div style={benchPanel(P)}>
        <div style={benchHead(P)}>🪚 {task.badge} · lay the pieces</div>
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <div style={{ display: 'flex', width: '100%', height: 'clamp(44px,8vh,64px)', borderRadius: 8, overflow: 'hidden', border: `3px solid #7a4f1e` }}>
            {Array.from({ length: denom }, (_, i) => {
              const inBoard = i < board
              const on = i < laid
              const over = on && !inBoard
              const bg = on ? (over ? P.coral : col) : inBoard ? 'rgba(255,198,92,0.12)' : 'rgba(0,0,0,0.28)'
              return <div key={i} style={{ flex: 1, background: bg, borderRight: i < denom - 1 ? '1.5px solid #7a4f1e' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(12px,1.8vw,17px)', color: P.inkOnPaper }}>{on ? i + 1 : ''}</div>
            })}
          </div>
          {/* board bracket — marks where the board (a) ends */}
          <div style={{ position: 'absolute', left: 0, width: `${(board / denom) * 100}%`, top: 'calc(100% + 4px)', height: 8, borderLeft: `2px solid ${P.creamSoft}`, borderRight: `2px solid ${P.creamSoft}`, borderBottom: `2px solid ${P.creamSoft}` }} />
          <div style={{ position: 'absolute', left: `${(board / denom) * 50}%`, transform: 'translateX(-50%)', top: 'calc(100% + 14px)', color: P.creamSoft, fontSize: 'clamp(9px,1.1vw,12px)', fontWeight: 700, whiteSpace: 'nowrap' }}>the board = {task.badge.split('÷')[0].trim()}</div>
        </div>
        <div style={{ marginTop: 'clamp(14px,2.4vh,22px)', fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(18px,3vw,30px)', color: fits ? P.mint : laid > board ? P.coral : P.gold }}>
          {laid} {laid === 1 ? 'piece' : 'pieces'}
        </div>
        <div style={{ minHeight: '1.2em', fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)', color: fits ? P.mint : P.mutedOnPaper }}>{fits ? 'the pieces fill the board exactly ✓' : laid > board ? 'past the board — too many' : 'fill the board with pieces'}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => set(laid - 1)} />
        <div style={{ minWidth: 100, textAlign: 'center' }}><div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(20px,2.4vw,30px)', fontWeight: 800, color: reveal ? P.mint : P.gold }}>{laid}</div><div style={{ fontSize: 'clamp(10px,1.1vw,13px)', color: P.creamSoft }}>pieces</div></div>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => set(laid + 1)} />
      </div>
      <CommitBtn P={P} label="CUT ✓" disabled={disabled} onClick={() => onCommit(laid)} />
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
  glide: (t, from, setValue, later) =>
    t.mech === 'pieces' ? glideNumber(from, t.answer, setValue, later) : later(() => setValue(t.answer), 600),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => (
    task.mech === 'bar'
      ? <BarShade P={palette} count={value} setCount={setValue} segments={12} disabled={disabled} reveal={reveal} onCommit={onCommit} commitLabel="CUT ✓" />
      : task.mech === 'area'
        ? <DecimalArea P={palette} task={task} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
        : <PieceTape P={palette} task={task} value={value} setValue={setValue} disabled={disabled} reveal={reveal} onCommit={onCommit} />
  ),
  // Tap-a-number answering, per TASK. `bar` keeps its instrument: its answer is a
  // COUNT OF TWELFTHS (½ × ⅔ → 4), so bare number choices under a "½ × ⅔" badge
  // would read as wrong math. `area` and `pieces` answers ARE the badge's value.
  answerPad: (t) =>
    t.mech === 'area'
      // decimal ×: the classic misses are the decimal point one place off (0.5×0.4 → 2)
      // and adding instead of multiplying.
      ? numChoices(t.answer, [tidy(t.answer * 10), tidy((t.da ?? 0) + (t.db ?? 0))], { min: 0 })
      : t.mech === 'pieces'
        // ÷: off-by-one on the count, and counting every slot on the tape instead of
        // only the pieces that fill the board.
        ? numChoices(t.answer, [t.answer + 1, t.answer - 1, t.denom ?? 0], { min: 1 })
        : [],
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
