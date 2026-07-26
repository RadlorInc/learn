'use client'
/**
 * SkateRamp — the Triangles, Proof & Right-Triangle Trig chapter (15–16) as a
 * PLAYABLE GAME. World: a skate ramp. A ramp IS a right triangle: its steepness is
 * an angle of elevation and its sides obey SOH-CAH-TOA — the same math a builder
 * uses to keep a ramp within code.
 *
 * ⚠️ WHY THE ANGLE IS MEASURED, NOT COMPUTED.
 * This chapter used to ask a child to dial arctan(3/4) ≈ 37°. There is no way for
 * a 15-year-old to produce that number — not on the platform (no calculator) and
 * not off it. It was the "dial an answer you got somewhere else" failure with the
 * "somewhere else" missing entirely. It also asked for `sin 30° = 0.5`, a table
 * lookup with no ramp referent at all.
 *   Both are gone. An angle of elevation is now MEASURED on the PROTRACTOR: the
 * child swings the ramp until it reaches the marked height at the marked run, and
 * reads the degrees off the protractor scale. That is not hot/cold guessing (the
 * BalanceBench objection) — there is no arithmetic being bypassed, because arctan
 * cannot be reasoned to. Measuring IS the skill, so the gesture IS the answer.
 *   Trig RATIOS are now read off a fully-labelled triangle (opp 3, adj 4, hyp 5 →
 * sin θ = 3/5 = 0.6). Every number the child needs is on the screen.
 *
 * THREE ways to answer, gated PER QUESTION (never per chapter):
 *   • TAP     → AnswerPad, for every question whose answer is a single number:
 *               angle relationships (L1), the missing side of a triple, and a trig
 *               ratio read off the labelled sides. Distractors are real
 *               misconceptions — complement used for supplement, opposite/adjacent
 *               swapped, sides subtracted instead of their squares.
 *   • DRAG    → the PROTRACTOR: measure the angle of elevation. Keeps its
 *               instrument because the measurement is the skill (see above).
 *   • CARDS   → the PROOF BENCH: pick which congruence claim the givens actually
 *               support. Not a single number, so it keeps its instrument.
 *
 * No guided round: both graded gestures (protractor, proof) are worked in the
 * WALKTHROUGH, which runs two examples. Scene is code-drawn (no assets).
 */
import { useEffect, type ReactElement } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, SlideValue, StepPicker, numChoices, type SpecChoice } from './parts/gameKit'

// Steep concrete-ramp palette (dark first, safety-cone accents).
const P: Palette = {
  nightTop: '#1d2733', nightBot: '#10161e',
  cream: '#eef3f8', creamSoft: 'rgba(238,243,248,0.82)',
  inkOnPaper: '#18222e', mutedOnPaper: '#6a7889',
  gold: '#ffb648', goldDeep: '#d6841e',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(24,38,54,0.6)', glassBorder: 'rgba(238,243,248,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const shuffle = <T,>(a: T[]): T[] => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }
const D2R = Math.PI / 180
const r2 = (n: number) => Math.round(n * 100) / 100

// Pythagorean triples → clean integer sides for the "missing side" rounds.
const TRIPLES: [number, number, number][] = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25],
]
// rise/run pairs a protractor can actually resolve: both fit the board, and the
// nearest-degree reading is never ambiguous.
const RAMPS: [number, number][] = [
  [3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [9, 12], [12, 9],
]
// Ratio rounds use the 3-4-5 family ONLY, because those are the sides whose three
// ratios (0.6, 0.8, 0.75) are exact to two decimals. A 5-12-13 sine is 0.3846…,
// which would ask the child to round a number they cannot divide cleanly.
const RATIO_TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [9, 12, 15]]

/** Answer value: a number (angle°, side, ratio) OR a picked proof claim. */
type V = { k: 'num'; n: number } | { k: 'step'; id: string }

interface Task extends BaseTask {
  kind: 'pad' | 'measure' | 'proof'
  n?: number            // the correct number (pad + measure)
  pad?: number[]        // misconception values → AnswerPad distractors
  tol?: number          // measure: grading tolerance in degrees
  rise?: number; run?: number   // measure: the ramp the protractor must match
  givens?: string[]     // proof: the statements the child must compare against
  options?: SpecChoice[]
  answerId?: string
  revealShort?: string  // proof: a short reveal string for the board
}

// ── L1: angle relationships → TAP the missing angle ─────────────────────────────
// Every answer is one number, so the pad applies. Distractors are the two angle
// relationships a child mixes up: using the COMPLEMENT (90 − a) where the
// supplement was wanted, and treating a supplementary pair as if it were vertical
// (so the answer "is" the given angle).
function makeL1(): Task {
  const roll = Math.random()
  if (roll < 0.34) {
    // Supplementary. a ≠ 90, or 180 − a would equal a and the vertical-confusion
    // distractor collapses onto the answer.
    let a = rint(35, 145); while (a === 90) a = rint(35, 145)
    const x = 180 - a
    return {
      kind: 'pad', title: 'Ramp edge', badge: `${a}° + x = 180°`, tone: 'a',
      prompt: `The ramp edge and the ground make ${a}°. Find x on the same straight line.`,
      context: `The ramp edge leans off the ground at ${a}°, and x is the angle beside it on that same straight line. A straight line is worth 180° in total, and the two angles share all of it between them.`,
      padInstruction: 'Tap the size of angle x, in degrees.',
      showEquals: false,
      say: `A ramp edge meets the ground. One angle is ${a} degrees and the angle beside it, x, sits on the same straight line. Which is x?`,
      work: [`Angles on a straight line add to 180 degrees, so x is 180 minus ${a}, which is ${x} degrees.`],
      n: x, pad: [a, 90 - a],   // treated it as vertical (equal) · used the complement
    }
  }
  if (roll < 0.62) {
    // Vertical angles are equal. Same exclusion: at 90 the supplement distractor
    // equals the answer.
    let a = rint(25, 150); while (a === 90) a = rint(25, 150)
    return {
      kind: 'pad', title: 'Crossing rails', badge: `x is vertical to ${a}°`, tone: 'a',
      prompt: `Two rails cross. The angle vertical to x is ${a}°. Find x.`,
      context: `Two rails cross, and x sits directly opposite the ${a}° angle through the crossing point — not beside it. Angles facing each other across a crossing are a different relationship from angles sitting side by side.`,
      padInstruction: 'Tap the size of angle x, in degrees.',
      showEquals: false,
      say: `Two rails cross. One angle is ${a} degrees. Which is its vertical angle, x?`,
      work: [`Vertical angles are the pair opposite each other where two lines cross, and they are always equal, so x is ${a} degrees.`],
      n: a, pad: [180 - a, 90 - a],  // used the supplement · used the complement
    }
  }
  // Triangle angle sum. Keep a + b ≠ 90 so the "added instead of subtracted"
  // distractor cannot equal the answer.
  const a = rint(30, 90)
  let b = rint(30, 90)
  while (a + b >= 165 || a + b === 90) b = rint(20, 80)
  const x = 180 - a - b
  return {
    kind: 'pad', title: 'Ramp triangle', badge: `${a}° + ${b}° + x = 180°`, tone: 'a',
    prompt: `A ramp triangle has angles ${a}°, ${b}° and x°. Find x.`,
    context: `The ramp frame makes a triangle with corners of ${a}° and ${b}°, and x is the third. However a triangle is stretched, its three corners always come to 180° between them.`,
    padInstruction: 'Tap the size of angle x, in degrees.',
    showEquals: false,
    say: `The ramp forms a triangle with angles ${a} degrees, ${b} degrees and x degrees. Which is x?`,
    work: [`The three angles of a triangle add to 180 degrees, so x is 180 minus ${a} minus ${b}, which is ${x} degrees.`],
    n: x, pad: [180 - a, a + b],   // forgot the second angle · added instead of subtracting
  }
}

// ── L2: congruence — which claim do the GIVENS actually support? ────────────────
// The old options said "AAA (only proves similarity)" and "SSA (not a valid rule)",
// so the item was answerable by reading English with no geometry at all. Now every
// option names a REAL congruence rule and cites three specific parts. Exactly one
// option cites three parts that all appear in the givens list on the board; the
// others quietly cite a side or angle nobody gave you. Choosing therefore means
// comparing the claim against the triangles, which is the actual skill.
function makeL2(): Task {
  if (Math.random() < 0.5) {
    // Ramp brace: AB ≅ AD, ∠BAC ≅ ∠DAC (the INCLUDED angle), AC shared.
    const options: SpecChoice[] = shuffle([
      { id: 'sas', label: '△ABC ≅ △ADC by SAS — AB ≅ AD, ∠BAC ≅ ∠DAC, AC ≅ AC' },
      { id: 'sss', label: '△ABC ≅ △ADC by SSS — AB ≅ AD, AC ≅ AC, BC ≅ DC' },
      { id: 'asa', label: '△ABC ≅ △ADC by ASA — ∠BAC ≅ ∠DAC, AC ≅ AC, ∠ACB ≅ ∠ACD' },
    ])
    return {
      kind: 'proof', title: 'Ramp brace', badge: 'AB ≅ AD · ∠BAC ≅ ∠DAC · AC shared', tone: 'a',
      prompt: 'Which claim do the given statements actually support?',
      instruction: 'Check each claim against the givens, then pick the one they support.',
      showEquals: false,
      say: 'Two braces run from the top of the ramp. A B is congruent to A D, the angles at A are congruent, and the brace A C is shared. Three claims are on the bench. Only one of them uses parts you were actually given.',
      work: ['The givens name two sides, A B and A D, and the angle at A that sits between them, plus the shared side A C. Two sides with the angle between them is side, angle, side, so S A S is the claim the givens support.'],
      givens: ['AB ≅ AD', '∠BAC ≅ ∠DAC', 'AC ≅ AC  (shared)'],
      options, answerId: 'sas', revealShort: 'SAS ✓',
    }
  }
  // Rail joint: ∠QPR ≅ ∠SPR, PR shared (the INCLUDED side), ∠QRP ≅ ∠SRP.
  const options: SpecChoice[] = shuffle([
    { id: 'asa', label: '△PQR ≅ △PSR by ASA — ∠QPR ≅ ∠SPR, PR ≅ PR, ∠QRP ≅ ∠SRP' },
    { id: 'sas', label: '△PQR ≅ △PSR by SAS — PQ ≅ PS, ∠QPR ≅ ∠SPR, PR ≅ PR' },
    { id: 'aas', label: '△PQR ≅ △PSR by AAS — ∠QPR ≅ ∠SPR, ∠QRP ≅ ∠SRP, QR ≅ SR' },
  ])
  return {
    kind: 'proof', title: 'Rail joint', badge: '∠QPR ≅ ∠SPR · ∠QRP ≅ ∠SRP · PR shared', tone: 'a',
    prompt: 'Which claim do the given statements actually support?',
    instruction: 'Check each claim against the givens, then pick the one they support.',
    showEquals: false,
    say: 'A rail joint. The angles at P are congruent, the angles at R are congruent, and the rail P R between them is shared. Only one claim on the bench uses parts you were actually given.',
    work: ['The givens name the angle at P, the angle at R, and the rail P R that runs between those two angles. Two angles with the side between them is angle, side, angle, so A S A is the claim the givens support.'],
    givens: ['∠QPR ≅ ∠SPR', 'PR ≅ PR  (shared)', '∠QRP ≅ ∠SRP'],
    options, answerId: 'asa', revealShort: 'ASA ✓',
  }
}

// ── L3: SOH-CAH-TOA ─────────────────────────────────────────────────────────────

/** Missing side of a right triangle — TAP. The headline misconception is
 *  subtracting the LENGTHS instead of their squares (hyp − leg), which is why so
 *  many children answer 2 for a 3-4-5 triangle. */
function sideTask(): Task {
  const [p, q, h] = TRIPLES[rint(0, TRIPLES.length - 1)]
  const giveFirst = Math.random() < 0.5
  const known = giveFirst ? p : q
  const want = giveFirst ? q : p
  return {
    kind: 'pad', title: 'Ramp side', badge: `hyp ${h} m · one leg ${known} m`, tone: 'b',
    prompt: `A right-triangle ramp has hypotenuse ${h} m and one leg ${known} m. Find the other leg.`,
    context: `The ${h} m hypotenuse is the ramp's slanted face; ${known} m is one of the two sides meeting at the square corner. The squares on those two account for the square on the slanted face.`,
    padInstruction: 'Tap the length of the other leg, in metres.',
    showEquals: false,
    say: `A ramp is a right triangle with hypotenuse ${h} metres and one leg ${known} metres. How long is the other leg?`,
    work: [`Square the hypotenuse and take away the square of the known leg: ${h} squared is ${h * h}, minus ${known} squared which is ${known * known}, leaves ${want * want}. The side whose square is ${want * want} is ${want} metres.`],
    n: want,
    pad: [h - known, h + known],   // subtracted the lengths · added the lengths
  }
}

/** A trig RATIO read straight off the labelled triangle — TAP.
 *  Every side is printed on the board, so this is a division the child can do.
 *  Distractors are the opposite/adjacent/hypotenuse mix-ups, i.e. the OTHER two
 *  ratios of the same triangle plus the flipped one. */
// Names the three sides without naming which PAIR each ratio uses — the pairing is
// the question. Naming the sides is the part a child genuinely cannot guess, and it
// is what the distractors (the other two ratios of the same triangle) turn on.
const RATIO_CONTEXT =
  'θ is the angle at the foot of the ramp. The side straight across from it is the opposite, '
  + 'the straight side running along beside it is the adjacent, and the slanted face is the '
  + 'hypotenuse. Each ratio divides a different two of those three.'

function ratioTask(): Task {
  const [o, a, h] = RATIO_TRIPLES[rint(0, RATIO_TRIPLES.length - 1)]
  const sin = r2(o / h), cos = r2(a / h), tan = r2(o / a), flip = r2(a / o)
  const which = rint(0, 2)
  const sides = `opp ${o} · adj ${a} · hyp ${h}`
  if (which === 0) return {
    kind: 'pad', title: 'Ramp ratio', badge: `sin θ = ?   (${sides})`, tone: 'b',
    prompt: `The ramp has opposite ${o} m, adjacent ${a} m, hypotenuse ${h} m. Find sin θ.`,
    context: RATIO_CONTEXT,
    padInstruction: 'Tap the value of sin θ.',
    showEquals: false,
    say: `The ramp's sides are: opposite ${o} metres, adjacent ${a} metres, hypotenuse ${h} metres. What is the sine of theta?`,
    work: [`Sine is opposite over hypotenuse. That is ${o} divided by ${h}, which is ${sin.toFixed(2)}.`],
    n: sin, pad: [cos, tan],     // used adjacent (cos) · used the other leg (tan)
  }
  if (which === 1) return {
    kind: 'pad', title: 'Ramp ratio', badge: `cos θ = ?   (${sides})`, tone: 'b',
    prompt: `The ramp has opposite ${o} m, adjacent ${a} m, hypotenuse ${h} m. Find cos θ.`,
    context: RATIO_CONTEXT,
    padInstruction: 'Tap the value of cos θ.',
    showEquals: false,
    say: `The ramp's sides are: opposite ${o} metres, adjacent ${a} metres, hypotenuse ${h} metres. What is the cosine of theta?`,
    work: [`Cosine is adjacent over hypotenuse. That is ${a} divided by ${h}, which is ${cos.toFixed(2)}.`],
    n: cos, pad: [sin, tan],     // used opposite (sin) · used the other leg (tan)
  }
  return {
    kind: 'pad', title: 'Ramp ratio', badge: `tan θ = ?   (${sides})`, tone: 'b',
    prompt: `The ramp has opposite ${o} m, adjacent ${a} m, hypotenuse ${h} m. Find tan θ.`,
    context: RATIO_CONTEXT,
    padInstruction: 'Tap the value of tan θ.',
    showEquals: false,
    say: `The ramp's sides are: opposite ${o} metres, adjacent ${a} metres, hypotenuse ${h} metres. What is the tangent of theta?`,
    work: [`Tangent is opposite over adjacent. That is ${o} divided by ${a}, which is ${tan.toFixed(2)}.`],
    n: tan, pad: [sin, flip],    // used the hypotenuse (sin) · flipped the ratio
  }
}

/** MEASURE the angle of elevation on the protractor — keeps its instrument.
 *  The answer is arctan(rise/run), which no child can compute; the protractor is
 *  how it is obtained, so the gesture IS the answer and there is nothing to pad. */
function measureTask(): Task {
  const [rise, run] = RAMPS[rint(0, RAMPS.length - 1)]
  const deg = Math.round(Math.atan2(rise, run) / D2R)
  return {
    kind: 'measure', title: 'Ramp steepness', badge: `rise ${rise} m · run ${run} m`, tone: 'b',
    prompt: `Swing the ramp until it reaches ${rise} m up at ${run} m out, then read the protractor.`,
    instruction: 'Swing the ramp onto the marker, then read off the degrees.',
    showEquals: false,
    say: `This ramp rises ${rise} metres over a run of ${run} metres. Swing the ramp until its top edge hits the marker, then read the angle of elevation off the protractor.`,
    work: [`Swing the ramp until it passes through the marker at ${run} metres out and ${rise} metres up. The protractor then reads about ${deg} degrees, and that is the angle of elevation.`],
    n: deg, tol: 1, rise, run,
  }
}

function makeL3(): Task {
  const roll = Math.random()
  if (roll < 0.36) return sideTask()
  if (roll < 0.7) return measureTask()
  return ratioTask()
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return makeL1()
  if (d === 2) return makeL2()
  return makeL3()
}

// ══════════════════════════════════════════════════════════════════════════════
// THE PROTRACTOR — the instrument that MEASURES an angle of elevation.
// The ramp pivots at A. A gold marker sits at (run, rise): the height the ramp
// must reach at the given run. The readout states, in metres, how high the ramp
// currently is at that run — so the child adjusts against a real measurement, not
// a colour cue. When the edge sits on the marker, the protractor scale beside it
// reads the answer. This is a protractor used as a protractor.
// ══════════════════════════════════════════════════════════════════════════════
function ProtractorBoard({ P: p, task, deg, reveal }: {
  P: Palette; task: Task; deg: number; reveal?: boolean
}): ReactElement {
  const rise = task.rise ?? 3, run = task.run ?? 4
  const W = 340, H = 214
  const groundY = 176, Ax = 44
  const perM = Math.min(258 / run, 128 / rise)
  const Tx = Ax + run * perM, Ty = groundY - rise * perM
  const AR = 58                                  // protractor radius

  const hAtRun = run * Math.tan(deg * D2R)       // ramp height at the marked run, in metres
  const endY = Math.max(8, groundY - hAtRun * perM)
  const hit = Math.abs(hAtRun - rise) < 0.03
  const col = reveal || hit ? p.mint : p.gold

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(4px, 0.8vh, 10px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 'clamp(240px, 34vw, 380px)', height: 'auto', borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}
        role="img" aria-label={`protractor: ramp set to ${deg} degrees`}>
        <rect x={0} y={0} width={W} height={H} fill={p.nightBot} />
        <rect x={0} y={0} width={W} height={groundY} fill={p.nightTop} opacity={0.7} />

        {/* metre grid — so "3 m up, 4 m out" is countable, not asserted */}
        {Array.from({ length: Math.floor(run) + 1 }, (_, i) => (
          <line key={`vx${i}`} x1={Ax + i * perM} y1={groundY} x2={Ax + i * perM} y2={groundY - (rise + 1) * perM}
            stroke={p.glassBorder} strokeWidth={1} opacity={0.35} />
        ))}
        {Array.from({ length: Math.floor(rise) + 2 }, (_, i) => (
          <line key={`hz${i}`} x1={Ax} y1={groundY - i * perM} x2={Ax + run * perM} y2={groundY - i * perM}
            stroke={p.glassBorder} strokeWidth={1} opacity={0.35} />
        ))}

        {/* protractor face at A: scale + labelled ticks */}
        <path d={`M ${Ax + AR} ${groundY} A ${AR} ${AR} 0 0 0 ${Ax} ${groundY - AR}`} fill="none" stroke={p.creamSoft} strokeWidth={1.2} opacity={0.55} />
        {[0, 15, 30, 45, 60, 75, 90].map((t) => {
          const c = Math.cos(t * D2R), s = Math.sin(t * D2R)
          return (
            <g key={t}>
              <line x1={Ax + (AR - 7) * c} y1={groundY - (AR - 7) * s} x2={Ax + AR * c} y2={groundY - AR * s} stroke={p.creamSoft} strokeWidth={1.4} opacity={0.7} />
              <text x={Ax + (AR + 12) * c} y={groundY - (AR + 12) * s + 4} textAnchor="middle" fill={p.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)">{t}</text>
            </g>
          )
        })}
        {/* live angle wedge */}
        <path d={`M ${Ax} ${groundY} L ${Ax + AR * Math.cos(deg * D2R)} ${groundY - AR * Math.sin(deg * D2R)} A ${AR} ${AR} 0 0 1 ${Ax + AR} ${groundY} Z`}
          fill={col} opacity={0.16} />

        {/* ground */}
        <line x1={0} y1={groundY} x2={W} y2={groundY} stroke={p.creamSoft} strokeWidth={2} />

        {/* the TARGET marker: rise m up at run m out */}
        <line x1={Tx} y1={groundY} x2={Tx} y2={Ty} stroke={p.gold} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.75} />
        <line x1={Ax} y1={Ty} x2={Tx} y2={Ty} stroke={p.gold} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.75} />
        <circle cx={Tx} cy={Ty} r={6.5} fill="none" stroke={p.gold} strokeWidth={2.4} />
        <circle cx={Tx} cy={Ty} r={2.2} fill={p.gold} />
        <text x={Tx + 10} y={Ty - 6} fill={p.gold} fontSize={11} fontWeight={800} fontFamily="var(--font-numeric)">{rise} m up</text>
        <text x={(Ax + Tx) / 2} y={groundY + 16} textAnchor="middle" fill={p.creamSoft} fontSize={11} fontWeight={800} fontFamily="var(--font-numeric)">{run} m out</text>

        {/* the RAMP edge — swings with the dial */}
        <line x1={Ax} y1={groundY} x2={Tx} y2={endY} stroke={col} strokeWidth={4} strokeLinecap="round" style={{ transition: 'stroke 220ms' }} />
        <circle cx={Ax} cy={groundY} r={3.6} fill={p.cream} />

        {/* the degree reading, right where a protractor shows it */}
        <text x={Ax + (AR + 34) * Math.cos((deg / 2) * D2R)} y={groundY - (AR + 34) * Math.sin((deg / 2) * D2R) + 5}
          textAnchor="middle" fill={col} fontSize={17} fontWeight={800} fontFamily="var(--font-numeric)" style={{ transition: 'fill 220ms' }}>{deg}°</text>
      </svg>

      {/* the measurement the child adjusts against */}
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(12px, 1.35vw, 17px)', fontWeight: 800, color: col, transition: 'color 220ms', textAlign: 'center' }}>
        at {run} m out the ramp is {hAtRun.toFixed(2)} m high{hit ? ' — on the marker ✓' : ` · marker ${rise.toFixed(2)} m`}
      </div>
    </div>
  )
}

function ProtractorInstrument({ P: p, task, value, setValue, disabled, reveal, onCommit }: {
  P: Palette; task: Task; value: V; setValue: (v: V) => void; disabled?: boolean; reveal?: boolean; onCommit: (v: V) => void
}): ReactElement {
  const deg = value.k === 'num' ? value.n : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.2vw, 14px)', width: '100%' }}>
      <ProtractorBoard P={p} task={task} deg={deg} reveal={reveal} />
      <SlideValue P={p} value={deg} setValue={(x) => setValue({ k: 'num', n: x })}
        min={0} max={90} step={1} format={(m) => `${m}°`}
        disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'num', n: x })} commitLabel="READ IT OFF ✓" />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// THE PROOF BENCH — the givens, rendered. Without this panel the child would be
// comparing three claims against statements that live only in the badge; the
// claims cite specific parts, so the parts they are checked against have to be on
// screen next to them.
// ══════════════════════════════════════════════════════════════════════════════
function GivensPanel({ P: p, givens, lit = 99 }: { P: Palette; givens: string[]; lit?: number }): ReactElement {
  return (
    <div style={{ width: '100%', maxWidth: 'clamp(340px, 48vw, 600px)', borderRadius: 12, background: p.glass, border: `1px solid ${p.glassBorder}`, padding: 'clamp(9px,1.1vw,14px) clamp(12px,1.4vw,18px)' }}>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px,1vw,13px)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.creamSoft, marginBottom: 6 }}>what you are given</div>
      {givens.map((g, i) => (
        <div key={g} style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(14px,1.5vw,20px)', fontWeight: 700, lineHeight: 1.55, color: i <= lit ? p.cream : p.mutedOnPaper, opacity: i <= lit ? 1 : 0.4, transition: 'color 260ms, opacity 260ms' }}>▸ {g}</div>
      ))}
    </div>
  )
}

// The two braces as a kite: A on top, C below, B and D to the sides. Triangles
// ABC and ADC share AC. Parts light up as the walkthrough reads each given, so the
// child sees WHICH parts the givens name before comparing the claims.
function ProofScene({ palette: p, task, stepIndex, ended }: { palette: Palette; task: Task; stepIndex: number; ended: boolean }): ReactElement {
  const reduce = useReducedMotion()
  const W = 340, H = 214
  const Apt = { x: 170, y: 24 }, Cpt = { x: 170, y: 186 }
  const Bpt = { x: 44, y: 108 }, Dpt = { x: 296, y: 108 }
  const sides = stepIndex >= 1        // AB ≅ AD
  const ang = stepIndex >= 2          // the included angle at A
  const shared = stepIndex >= 3       // AC
  const done = ended || stepIndex >= 5
  const fade = { duration: reduce ? 0 : 0.4 }
  const lab = (x: number, y: number, t: string) => <text x={x} y={y} textAnchor="middle" fill={p.cream} fontSize={14} fontWeight={800} fontFamily="var(--font-numeric)">{t}</text>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(4px, 0.8vh, 10px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 'clamp(240px, 34vw, 380px)', height: 'auto', borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}
        role="img" aria-label="two ramp braces meeting at A, sharing the brace AC">
        <rect x={0} y={0} width={W} height={H} fill={p.nightBot} />
        <path d={`M ${Apt.x} ${Apt.y} L ${Bpt.x} ${Bpt.y} L ${Cpt.x} ${Cpt.y} Z`} fill={done ? p.mint : p.creamSoft} opacity={done ? 0.18 : 0.07} style={{ transition: 'fill 400ms, opacity 400ms' }} />
        <path d={`M ${Apt.x} ${Apt.y} L ${Dpt.x} ${Dpt.y} L ${Cpt.x} ${Cpt.y} Z`} fill={done ? p.mint : p.creamSoft} opacity={done ? 0.18 : 0.07} style={{ transition: 'fill 400ms, opacity 400ms' }} />

        {/* the two congruent sides AB, AD — tick-marked when the given is read */}
        {[Bpt, Dpt].map((q, i) => (
          <g key={i}>
            <motion.line x1={Apt.x} y1={Apt.y} x2={q.x} y2={q.y} stroke={sides ? p.gold : p.creamSoft} strokeWidth={sides ? 4 : 2.4} strokeLinecap="round" initial={false} animate={{ opacity: 1 }} style={{ transition: 'stroke 300ms, stroke-width 300ms' }} />
            <motion.line x1={(Apt.x + q.x) / 2 - 4} y1={(Apt.y + q.y) / 2 - 6} x2={(Apt.x + q.x) / 2 + 4} y2={(Apt.y + q.y) / 2 + 6}
              stroke={p.gold} strokeWidth={2.4} initial={false} animate={{ opacity: sides ? 1 : 0 }} transition={fade} />
          </g>
        ))}
        {/* the outer sides BC, DC — never given */}
        {[Bpt, Dpt].map((q, i) => <line key={`o${i}`} x1={q.x} y1={q.y} x2={Cpt.x} y2={Cpt.y} stroke={p.creamSoft} strokeWidth={2.4} strokeLinecap="round" opacity={0.55} />)}

        {/* the shared brace AC */}
        <motion.line x1={Apt.x} y1={Apt.y} x2={Cpt.x} y2={Cpt.y} stroke={shared ? p.coral : p.creamSoft} strokeWidth={shared ? 4 : 2.2} strokeDasharray={shared ? undefined : '5 4'} strokeLinecap="round" initial={false} animate={{ opacity: 1 }} style={{ transition: 'stroke 300ms, stroke-width 300ms' }} />

        {/* the INCLUDED angle at A, both halves */}
        <motion.g initial={false} animate={{ opacity: ang ? 1 : 0 }} transition={fade}>
          <path d={`M ${Apt.x - 26} ${Apt.y + 26} A 37 37 0 0 1 ${Apt.x} ${Apt.y + 37}`} fill="none" stroke={p.mint} strokeWidth={2.6} />
          <path d={`M ${Apt.x} ${Apt.y + 37} A 37 37 0 0 1 ${Apt.x + 26} ${Apt.y + 26}`} fill="none" stroke={p.mint} strokeWidth={2.6} />
        </motion.g>

        {lab(Apt.x, Apt.y - 7, 'A')}
        {lab(Bpt.x - 13, Bpt.y + 5, 'B')}
        {lab(Dpt.x + 13, Dpt.y + 5, 'D')}
        {lab(Cpt.x, Cpt.y + 18, 'C')}

        <motion.text x={W / 2} y={H - 6} textAnchor="middle" fill={p.mint} fontSize={14} fontWeight={800} fontFamily="var(--font-numeric)"
          initial={false} animate={{ opacity: done ? 1 : 0 }} transition={fade}>△ABC ≅ △ADC by SAS</motion.text>
      </svg>
      <GivensPanel P={p} givens={task.givens ?? []} lit={stepIndex - 1} />
    </div>
  )
}

// ── walkthrough example 1: MEASURE the angle on the protractor ──────────────────
const DEMO_MEASURE: Task = {
  kind: 'measure', title: 'Ramp steepness', badge: 'rise 3 m · run 4 m', tone: 'b',
  prompt: '', say: '', work: [], n: 37, tol: 1, rise: 3, run: 4, showEquals: false,
}
// Nine baby steps. The old script narrated "take the inverse tangent of 0.75",
// which is exactly the move the child cannot make. This one measures: lay the
// protractor on, swing the ramp, watch the height readout climb toward the marker,
// and read the degrees off the scale when it lands.
const MEASURE_STEPS: DemoStep<V>[] = [
  { say: "Here's a skate ramp, pivoting at the bottom corner. How steeply it leans is its angle of elevation.", value: { k: 'num', n: 0 }, board: 'ramp: angle of elevation' },
  { say: 'The plan says it must rise three metres by the time it is four metres out. That is the gold marker.', value: { k: 'num', n: 0 }, board: 'must reach 3 m up at 4 m out' },
  { say: 'A protractor sits on the pivot, marked from zero to ninety degrees. Whatever the ramp reaches, we can read it off here.', value: { k: 'num', n: 0 }, board: 'protractor on the pivot' },
  { say: 'Start swinging the ramp up. At twenty degrees it is only about one and a half metres high at the marker. Too shallow.', value: { k: 'num', n: 20 }, board: '20° → 1.46 m — too low' },
  { say: 'Keep going. Thirty degrees gives about two point three metres. Still under the marker.', value: { k: 'num', n: 30 }, board: '30° → 2.31 m — still low' },
  { say: 'Thirty-five degrees, and the ramp is about two point eight. Very close now.', value: { k: 'num', n: 35 }, board: '35° → 2.80 m — close' },
  { say: 'Forty degrees overshoots — three point three six, above the marker. So the answer is between thirty-five and forty.', value: { k: 'num', n: 40 }, board: '40° → 3.36 m — too high' },
  { say: 'Thirty-seven degrees. Three point zero one metres — the ramp edge sits right on the marker.', value: { k: 'num', n: 37 }, board: '37° → 3.01 m — on the marker' },
  { say: 'Now read the protractor: thirty-seven degrees. That is the angle of elevation, measured, not guessed.', value: { k: 'num', n: 37 }, board: 'angle of elevation ≈ 37°' },
]

// ── walkthrough example 2: the proof bench ─────────────────────────────────────
const DEMO_PROOF: Task = {
  kind: 'proof', title: 'Ramp brace', badge: 'AB ≅ AD · ∠BAC ≅ ∠DAC · AC shared', tone: 'a',
  prompt: '', say: '', work: [], showEquals: false,
  givens: ['AB ≅ AD', '∠BAC ≅ ∠DAC', 'AC ≅ AC  (shared)'],
  options: [
    { id: 'sas', label: '△ABC ≅ △ADC by SAS — AB ≅ AD, ∠BAC ≅ ∠DAC, AC ≅ AC' },
    { id: 'sss', label: '△ABC ≅ △ADC by SSS — AB ≅ AD, AC ≅ AC, BC ≅ DC' },
    { id: 'asa', label: '△ABC ≅ △ADC by ASA — ∠BAC ≅ ∠DAC, AC ≅ AC, ∠ACB ≅ ∠ACD' },
  ],
  answerId: 'sas', revealShort: 'SAS ✓',
}
// Seven baby steps. The point of this example is the CHECK: read what you were
// given, then test each claim against that list. That is the gesture scored play
// grades, so it happens here first.
const PROOF_STEPS: DemoStep<V>[] = [
  { say: 'Two braces run from the top of the ramp down to the deck. We want to show the two triangles they make are identical.', value: { k: 'step', id: '' }, board: 'prove △ABC ≅ △ADC' },
  { say: 'First given: brace A B is congruent to brace A D. Two matching sides — watch the tick marks appear.', value: { k: 'step', id: '' }, board: 'AB ≅ AD  (side)' },
  { say: 'Second given: the two angles at A are congruent. Notice where that angle sits — right between the two matching braces.', value: { k: 'step', id: '' }, board: '∠BAC ≅ ∠DAC  (included angle)' },
  { say: 'Third: the brace A C belongs to both triangles, so it is congruent to itself. Side, angle, side.', value: { k: 'step', id: '' }, board: 'AC ≅ AC  (shared side)' },
  { say: 'Now check the claims. The S S S claim needs B C congruent to D C — but nobody gave you that side, so you cannot use it.', value: { k: 'step', id: '' }, board: 'SSS needs BC ≅ DC — not given' },
  { say: 'The A S A claim needs the angles at C — also not on the list. Only the S A S claim uses three parts you actually have.', value: { k: 'step', id: 'sas' }, board: 'ASA needs ∠ACB ≅ ∠ACD — not given' },
  { say: 'So pick the S A S claim. Two sides with the angle between them proves the braces are identical.', value: { k: 'step', id: 'sas' }, board: '△ABC ≅ △ADC by SAS ✓' },
]

const numGrade = (t: Task, n: number) => Math.abs(n - (t.n ?? 0)) <= (t.tol ?? 0)

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'geometryProofTrig',
  title: 'SKATE RAMP',
  ticketLabel: 'ramp log',
  palette: P,
  motif: '🛹',
  makeTask,
  // PER-TASK gating. A question shows the pad when its answer is a single number
  // the child can produce from what is on the board. The protractor and the proof
  // bench keep their instruments: one because measuring IS the skill, the other
  // because "which claim do the givens support" is not a number.
  answerPad: (t) => (t.pad ? numChoices(t.n ?? 0, t.pad, { min: 0 }) : []),
  // REQUIRED: V is a tagged union, so a bare tapped number would never satisfy
  // `v.k === 'num'` and every padded question would mark correct answers WRONG,
  // silently. See src/__tests__/answerPadGrading.test.ts.
  padValue: (n) => ({ k: 'num', n }),
  initialValue: (t) => (t.kind === 'proof' ? { k: 'step', id: '' } : { k: 'num', n: 0 }),
  grade: (t, v) => (t.kind === 'proof'
    ? v.k === 'step' && v.id === t.answerId
    : v.k === 'num' && numGrade(t, v.n)),
  revealText: (t) => (t.kind === 'proof'
    ? (t.revealShort ?? '✓')
    : t.kind === 'measure' ? `${t.n}°`
      : Number.isInteger(t.n) ? `${t.n}` : (t.n ?? 0).toFixed(2)),
  glide: (t, _from, setValue, later) => later(() => setValue(
    t.kind === 'proof' ? { k: 'step', id: t.answerId ?? '' } : { k: 'num', n: t.n ?? 0 }), 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'proof') {
      const id = value.k === 'step' ? value.id : ''
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.1vw, 14px)', width: '100%' }}>
          <GivensPanel P={palette} givens={task.givens ?? []} />
          <StepPicker P={palette} choices={task.options ?? []} value={id} setValue={(x) => setValue({ k: 'step', id: x })}
            correct={task.answerId} disabled={disabled} reveal={reveal}
            onCommit={(x) => onCommit({ k: 'step', id: x })} commitLabel="THAT'S THE ONE ✓"
            prompt="which claim do the givens support?" />
        </div>
      )
    }
    // `measure` — and the fallback for any future numeric task that ships no `pad`.
    return <ProtractorInstrument P={palette} task={task} value={value} setValue={setValue}
      disabled={disabled} reveal={reveal} onCommit={onCommit} />
  },
  // Branches by example, so the child watches the gesture they will be graded on.
  TutorialScene: ({ palette, task, value, stepIndex, ended }) =>
    task.kind === 'proof'
      ? <ProofScene palette={palette} task={task} stepIndex={stepIndex} ended={ended} />
      : <ProtractorBoard P={palette} task={task} deg={value.k === 'num' ? value.n : 0} reveal={ended} />,
  start: {
    blurb: <><strong>You&apos;re inspecting a skate ramp.</strong> A ramp is a <strong>right triangle</strong> — its steepness is an <strong>angle you measure</strong>, and its sides obey <strong>SOH-CAH-TOA</strong>. Find missing angles and sides, and check which braces are provably identical.</>,
    ticket: { title: 'Ramp steepness', badge: 'rise 3 · run 4', tone: 'b' },
    startLabel: 'Inspect the ramp →',
  },
  overview: {
    say: 'Here is the plan. A skate ramp is really a right triangle. How steep it leans is its angle of elevation, and we find it by measuring: swing the ramp until it reaches the height the plan asks for, then read the degrees straight off the protractor. Later we compare two braces and decide which congruence claim the givens actually support. Let us work through both, nice and slow.',
    problem: <>A ramp must <strong>rise 3 m</strong> by <strong>4 m out</strong>. How steep is that?</>,
    points: [
      <>The <strong>marker</strong> shows the height the ramp must reach at that run.</>,
      <>Swing the ramp onto the marker, then <strong>read the protractor</strong>.</>,
      <>For a proof, a claim only counts if <strong>every part it names was given</strong>.</>,
    ],
  },
  // Two examples: the protractor, then the proof bench. Both graded gestures are
  // rehearsed here, which is why there is NO guided round.
  tutorial: [
    { task: DEMO_MEASURE, initial: { k: 'num', n: 0 }, hand: 'drag', steps: MEASURE_STEPS },
    { task: DEMO_PROOF, initial: { k: 'step', id: '' }, hand: 'tap', steps: PROOF_STEPS },
  ],
  sig: (t) => `${t.kind}:${t.badge}`,
}

export default function SkateRamp(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
