'use client'
/**
 * IntroCalculusTeenLesson (17–18, "Field Lab") — the worked-example walkthrough
 * for the Intro to Calculus module: limits by substitution, average rate of
 * change, the secant → tangent idea, and the derivative via the power rule.
 * Built on TeenLessonShell: a few narrated "watch" steps then a quick check.
 * Exports the round generator + CalcWatch so the practice chapter and its
 * re-teach reuse them. Mirrors FunctionToolkitTeenLesson, in teen chrome.
 */
import React, { useEffect, useRef } from 'react'
import { speak, speakSeq } from '@/infra/useMiloSpeaker'
import type { LessonStep } from '@/features/chapters/lessons/_kit'
import type { AgeBand, Choice } from '@/features/chapters/teen/types'
import TeenLessonShell from '@/features/chapters/teen/TeenLessonShell'
import ChoiceGrid from '@/features/chapters/teen/ChoiceGrid'

const BAND: AgeBand = '17-18'

// ── shared helpers (reused by the practice chapter) ────────────────────────
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
/** Pretty integer: a real minus sign for negatives. */
export const fmtInt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
/** Spoken integer: "negative four". */
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
const numChoice = (v: number): Choice => ({ value: v, label: fmtInt(v) })
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)

/** Build up to 4 distinct numeric choices around a numeric answer. */
function numChoices(answer: number, distractors: number[]): Choice[] {
  const set = new Set<number>([answer])
  for (const v of distractors) { if (set.size >= 4) break; if (Number.isFinite(v)) set.add(v) }
  let guard = 0
  while (set.size < 4 && guard++ < 60) set.add(answer + rint(-4, 4))
  return shuffle([...set]).map(numChoice)
}

/** Build text choices; `answer` must be one of `all`. */
function textChoices(all: string[]): Choice[] {
  return shuffle([...new Set(all)]).map((s) => ({ value: s, label: s }))
}

export interface Round {
  promptText: string
  say: string
  choices: Choice[]
  answer: string | number
  /** Spoken form of the answer (for the wrong-answer read-out). */
  sayAnswer?: string
  explain: string   // re-teach line
}

/** Difficulty-aware round generator: L1 limit-by-sub + avg rate · L2 avg rate of x² + power rule · L3 instantaneous rate + secant→tangent. */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) {
    if (Math.random() < 0.5) {
      // Evaluate a simple limit by substitution.
      if (Math.random() < 0.5) {
        // lim x→c of x² + 1
        const c = rint(2, 4)
        const ans = c * c + 1
        return {
          promptText: `Evaluate: lim (x→${c}) of x² + 1`,
          say: `What is the limit as x approaches ${c} of x squared plus one?`,
          choices: numChoices(ans, [c * c, ans + 1, 2 * c + 1]),
          answer: ans,
          sayAnswer: `${ans}`,
          explain: `This function is continuous, so substitute directly: (${c})² + 1 = ${ans}.`,
        }
      }
      // lim x→c of k·x
      const c = rint(2, 4)
      const k = rint(2, 3)
      const ans = k * c
      return {
        promptText: `Evaluate: lim (x→${c}) of ${k}x`,
        say: `What is the limit as x approaches ${c} of ${k} x?`,
        choices: numChoices(ans, [ans + k, ans - k, k + c]),
        answer: ans,
        sayAnswer: `${ans}`,
        explain: `Substitute the value in: ${k}·${c} = ${ans}.`,
      }
    }
    // Average rate of change between two given points: (y2 − y1)/(x2 − x1).
    const x1 = rint(0, 2)
    const x2 = x1 + rint(1, 3)
    const y1 = rint(1, 6)
    const slope = rint(1, 4)
    const y2 = y1 + slope * (x2 - x1)
    const ans = slope
    return {
      promptText: `Average rate of change from (${x1}, ${y1}) to (${x2}, ${y2})?`,
      say: `What is the average rate of change from the point ${x1}, ${y1} to ${x2}, ${y2}?`,
      choices: numChoices(ans, [ans + 1, ans - 1, y2 - y1]),
      answer: ans,
      sayAnswer: `${ans}`,
      explain: `Rate = change in y over change in x = (${y2} − ${y1}) / (${x2} − ${x1}) = ${y2 - y1}/${x2 - x1} = ${ans}.`,
    }
  }

  if (d === 2) {
    if (Math.random() < 0.5) {
      // Average rate of f(x)=x² over [a,b] = (b²−a²)/(b−a) = a+b.
      const a = rint(1, 3)
      const b = a + rint(1, 3)
      const ans = a + b   // (b²−a²)/(b−a) = a+b
      return {
        promptText: `f(x) = x². Average rate of change over [${a}, ${b}]?`,
        say: `For f of x equals x squared, what is the average rate of change over the interval from ${a} to ${b}?`,
        choices: numChoices(ans, [ans + 1, ans - 1, b * b - a * a]),
        answer: ans,
        sayAnswer: `${ans}`,
        explain: `(f(${b}) − f(${a}))/(${b} − ${a}) = (${b * b} − ${a * a})/${b - a} = ${b * b - a * a}/${b - a} = ${ans}.`,
      }
    }
    // Derivative via the power rule, as a string MCQ. d/dx xⁿ = n·xⁿ⁻¹.
    const n = rint(2, 4)
    const ans = n === 1 ? '1' : n === 2 ? '2x' : `${n}x${sup(n - 1)}`
    const wrong = [
      `x${sup(n - 1)}`,
      `${n}x${sup(n)}`,
      n === 2 ? 'x' : `${n - 1}x${sup(n - 1)}`,
    ]
    return {
      promptText: `Use the power rule: d/dx of x${sup(n)} = ?`,
      say: `Using the power rule, what is the derivative of x to the ${n}?`,
      choices: textChoices([ans, ...wrong]),
      answer: ans,
      sayAnswer: ans,
      explain: `Power rule: bring the exponent down and subtract one — d/dx xⁿ = n·xⁿ⁻¹, so d/dx x${sup(n)} = ${ans}.`,
    }
  }

  // d === 3 — instantaneous rate (derivative value at a point) + the limit idea.
  const roll = Math.random()
  if (roll < 0.4) {
    // The limit idea: secant slope → tangent slope.
    const ans = 'The tangent slope (the derivative)'
    return {
      promptText: 'As Q slides toward P on a curve, the slope of the secant line PQ approaches…',
      say: 'As the point Q slides toward P on a curve, what does the slope of the secant line P Q approach?',
      choices: textChoices([
        ans,
        'The average of the two points',
        'Zero',
        'The slope of the x-axis',
      ]),
      answer: ans,
      sayAnswer: 'the tangent slope, which is the derivative',
      explain: 'As Q → P the secant PQ becomes the tangent at P. Its slope is the instantaneous rate — the derivative at P.',
    }
  }
  if (roll < 0.7) {
    // f(x)=x² → f′(x)=2x → f′(a).
    const a = rint(2, 5)
    const ans = 2 * a
    return {
      promptText: `f(x) = x². Find the instantaneous rate f′(${a}).`,
      say: `For f of x equals x squared, what is the instantaneous rate f prime of ${a}?`,
      choices: numChoices(ans, [a * a, ans + 2, ans - 2]),
      answer: ans,
      sayAnswer: `${ans}`,
      explain: `f′(x) = 2x by the power rule, so f′(${a}) = 2·${a} = ${ans}.`,
    }
  }
  // f(x)=x³ → f′(x)=3x² → f′(a).
  const a = rint(1, 3)
  const ans = 3 * a * a
  return {
    promptText: `f(x) = x³. Find the instantaneous rate f′(${a}).`,
    say: `For f of x equals x cubed, what is the instantaneous rate f prime of ${a}?`,
    choices: numChoices(ans, [a * a * a, ans + 3, 3 * a]),
    answer: ans,
    sayAnswer: `${ans}`,
    explain: `f′(x) = 3x² by the power rule, so f′(${a}) = 3·${a}² = ${ans}.`,
  }
}

/** Unicode superscript for a small exponent (0–9). */
function sup(n: number): string {
  const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' }
  return String(n).split('').map((ch) => map[ch] ?? ch).join('')
}

// ── SecantTangent: a lightweight inline secant→tangent visual (SVG) ─────────
// Plots y = x² with a fixed point P; a driver `t` (0→1) slides Q toward P, and
// the secant line PQ rotates toward the tangent. Used by the Explore sim (live,
// slider-driven) and by CalcWatch (auto-animated for the re-teach).
function SecantTangent({ t, px = 2 }: { t: number; px?: number }) {
  // World window.
  const XLO = -1, XHI = 4, YLO = -1, YHI = 10
  const VW = 320, VH = 300, pad = 26
  const plotW = VW - pad * 2, plotH = VH - pad * 2
  const sx = (x: number) => pad + ((x - XLO) / (XHI - XLO)) * plotW
  const sy = (y: number) => pad + (1 - (y - YLO) / (YHI - YLO)) * plotH
  const f = (x: number) => x * x

  // Q slides from an offset toward P as t: 0 → 1.
  const h = 1.6 * (1 - t) + 0.001
  const qx = px + h
  const py = f(px), qy = f(qx)
  const secSlope = (qy - py) / (qx - px)     // → 2·px as h → 0
  const tanSlope = 2 * px

  // Sampled parabola polyline.
  const pts: string[] = []
  for (let i = 0; i <= 80; i++) {
    const x = XLO + (i / 80) * (XHI - XLO)
    pts.push(`${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`)
  }

  // Extend the secant across the window for a clean line.
  const lineAt = (x: number) => py + secSlope * (x - px)

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block', maxWidth: VW, fontFamily: 'var(--font-numeric)' }} role="img" aria-label="Secant line approaching the tangent on a parabola">
      {/* axes */}
      <line x1={pad} y1={sy(0)} x2={VW - pad} y2={sy(0)} stroke="var(--ink-soft)" strokeWidth={1.5} />
      <line x1={sx(0)} y1={pad} x2={sx(0)} y2={VH - pad} stroke="var(--ink-soft)" strokeWidth={1.5} />
      {/* parabola */}
      <polyline points={pts.join(' ')} fill="none" stroke="var(--ink-soft)" strokeWidth={2} strokeLinejoin="round" opacity={0.85} />
      {/* tangent at P (faint reference) */}
      <line x1={sx(XLO)} y1={sy(py + tanSlope * (XLO - px))} x2={sx(XHI)} y2={sy(py + tanSlope * (XHI - px))} stroke="var(--garden-green)" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
      {/* secant PQ */}
      <line x1={sx(XLO)} y1={sy(lineAt(XLO))} x2={sx(XHI)} y2={sy(lineAt(XHI))} stroke="var(--accent)" strokeWidth={2} />
      {/* P and Q */}
      <circle cx={sx(px)} cy={sy(py)} r={5} fill="var(--accent)" stroke="var(--paper)" strokeWidth={1.5} />
      <text x={sx(px) - 8} y={sy(py) + 16} textAnchor="end" fontSize={12} fontWeight={700} fill="var(--accent)">P</text>
      <circle cx={sx(qx)} cy={sy(qy)} r={5} fill="var(--note-amber)" stroke="var(--paper)" strokeWidth={1.5} />
      <text x={sx(qx) + 8} y={sy(qy) - 6} textAnchor="start" fontSize={12} fontWeight={700} fill="var(--note-amber)">Q</text>
    </svg>
  )
}

/** Exported so the Explore step can drive it with a live slider. */
export { SecantTangent }

// Helper the Explore step uses to display the closing slope numbers.
export function secantSlopeInfo(t: number, px = 2) {
  const h = 1.6 * (1 - t) + 0.001
  const secSlope = (h + 2 * px)       // (f(px+h)-f(px))/h = 2px + h
  return { h, secSlope, tanSlope: 2 * px }
}

// ── CalcWatch: a narrated worked example (reused for re-teach) ──────────────
// Auto-animates the secant sliding toward the tangent while the lines speak.
export function CalcWatch({ lines, onDone }: { lines: string[]; onDone: () => void }) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const [t, setT] = React.useState(0)
  useEffect(() => {
    const start = Date.now()
    const id = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 3200)
      setT(p)
      if (p >= 1) window.clearInterval(id)
    }, 40)
    return () => window.clearInterval(id)
  }, [])
  useEffect(() => {
    const cancel = speakSeq(lines, { onDone: () => window.setTimeout(() => doneRef.current(), 1200) })
    return cancel
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 300 }}>
        <SecantTangent t={t} />
      </div>
      <p style={{ margin: 0, maxWidth: 520, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        {lines[lines.length - 1]}
      </p>
    </div>
  )
}

// A one-question check inside the lesson (retry allowed, no penalty).
function CalcAsk({ prompt, say, choices, answer, onDone }: {
  prompt: string; say: string; choices: Choice[]; answer: string | number; onDone: () => void
}) {
  const [selected, setSelected] = React.useState<string | number | null>(null)
  const [status, setStatus] = React.useState<'idle' | 'correct' | 'wrong'>('idle')
  const spokenRef = useRef(false)
  useEffect(() => { if (!spokenRef.current) { spokenRef.current = true; speak(say) } }, []) // eslint-disable-line
  function pick(v: string | number) {
    if (status === 'correct') return
    setSelected(v)
    if (v === answer) { setStatus('correct'); speak('Yes — that’s it.'); window.setTimeout(onDone, 1400) }
    else { setStatus('wrong'); speak('Not quite — take another look.'); window.setTimeout(() => { setSelected(null); setStatus('idle') }, 1200) }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}>{prompt}</p>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <ChoiceGrid band={BAND} choices={choices} selected={selected} status={status} correctValue={answer} onPick={pick} columns={2} />
      </div>
    </div>
  )
}

interface Props { band?: AgeBand; childName: string; onLessonComplete: () => void }

export default function IntroCalculusTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'A limit asks where a function is heading. Watch.', mood: 'happy',
      render: (d) => (
        <CalcWatch
          lines={[
            'The limit of x squared plus one as x approaches two asks: what value do the outputs head toward?',
            'This function is smooth, so we substitute directly: two squared plus one is five. The limit is five.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Average rate of change is rise over run between two points. Watch.', mood: 'happy',
      render: (d) => (
        <CalcWatch
          lines={[
            'Between two points on a curve, draw the secant line — its slope is the average rate of change.',
            'For x squared from one to three, that is nine minus one over three minus one — a slope of four.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Slide the second point in and the secant becomes the tangent. Watch.', mood: 'thinking',
      render: (d) => (
        <CalcWatch
          lines={[
            'Now slide Q toward P. The secant line PQ swings until it just touches the curve at P.',
            'That limiting slope is the instantaneous rate — the derivative. By the power rule, the derivative of x squared is two x.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <CalcAsk
          prompt="f(x) = x². What is the instantaneous rate f′(3)?"
          say="For f of x equals x squared, what is the instantaneous rate f prime of three?"
          choices={[numChoice(6), numChoice(9), numChoice(3), numChoice(12)]}
          answer={6}
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Intro to Calculus"
      steps={steps}
      finalSpeech={`Nice work, ${childName}. You can take a limit, find an average rate, and zoom in to the instantaneous rate — the derivative. Let’s run the module.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
