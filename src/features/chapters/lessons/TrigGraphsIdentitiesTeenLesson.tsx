'use client'
/**
 * TrigGraphsIdentitiesTeenLesson (17–18, "Field Lab") — the worked-example
 * walkthrough for the Trig Graphs & Identities module: read amplitude and
 * period off y = A·sin(Bx), find the midline of a shifted wave, and use the
 * Pythagorean identity sin²θ + cos²θ = 1. Built on TeenLessonShell — a few
 * narrated "watch" steps then a quick check. Exports the round generator +
 * TrigGraphWatch so the practice chapter and its re-teach reuse them. Mirrors
 * IntegersTeenLesson / FunctionToolkitTeenLesson, in teen chrome.
 */
import React, { useEffect, useRef } from 'react'
import { speak, speakSeq } from '@/infra/useMiloSpeaker'
import type { LessonStep } from '@/features/chapters/lessons/_kit'
import type { AgeBand, Choice } from '@/features/chapters/teen/types'
import TeenLessonShell from '@/features/chapters/teen/TeenLessonShell'
import CoordGrid from '@/features/chapters/teen/CoordGrid'
import ChoiceGrid from '@/features/chapters/teen/ChoiceGrid'

const BAND: AgeBand = '17-18'

// ── shared helpers (reused by the practice chapter) ────────────────────────
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
/** Pretty integer: a real minus sign for negatives. */
export const fmtInt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
const numChoice = (v: number): Choice => ({ value: v, label: fmtInt(v) })
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)

/** Build 4 distinct numeric choices around a numeric answer. */
function numChoices(answer: number, distractors: number[]): Choice[] {
  const set = new Set<number>([answer])
  for (const v of distractors) { if (set.size >= 4) break; if (Number.isFinite(v)) set.add(v) }
  let guard = 0
  while (set.size < 4 && guard++ < 60) set.add(answer + rint(1, 4))
  return shuffle([...set]).map(numChoice)
}

/** Build text choices; `answer` must be one of `all`. */
function textChoices(all: string[]): Choice[] {
  return shuffle([...new Set(all)]).map((s) => ({ value: s, label: s }))
}

/** Period 2π/B as a tidy string for the common B values used here. */
function periodStr(B: number): string {
  switch (B) {
    case 1: return '2π'
    case 2: return 'π'
    case 3: return '2π/3'
    case 4: return 'π/2'
    default: return `2π/${B}`
  }
}
const periodDistractors = ['2π', 'π', 'π/2', '2π/3', 'π/4', '4π']

export interface Round {
  promptText: string
  say: string
  choices: Choice[]
  answer: string | number
  /** Spoken form of the answer (for the wrong-answer read-out). */
  sayAnswer?: string
  /** Optional worked-example wave for the re-teach. */
  curve?: { A: number; B: number; k: number }
  explain: string   // re-teach line
}

/** Difficulty-aware round generator: L1 amplitude/period/extremes · L2 midline/shift · L3 Pythagorean identity. */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) {
    // Amplitude, period, or max/min of y = A·sin(Bx).
    const A = rint(2, 5)
    const B = [1, 2, 3, 4][rint(0, 3)]
    const roll = Math.random()
    if (roll < 0.34) {
      return {
        promptText: `What is the amplitude of y = ${A}·sin(${B}x)?`,
        say: `What is the amplitude of y equals ${A} sine of ${B} x?`,
        choices: numChoices(A, [B, A * 2, A + 1]),
        answer: A,
        sayAnswer: `${A}`,
        curve: { A, B, k: 0 },
        explain: `The amplitude is the number multiplying sine — its absolute value. Here |${A}| = ${A}, so the wave reaches ${A} above and below the midline.`,
      }
    }
    if (roll < 0.67) {
      const ans = periodStr(B)
      return {
        promptText: `What is the period of y = ${A}·sin(${B}x)?`,
        say: `What is the period of y equals ${A} sine of ${B} x?`,
        choices: textChoices([ans, ...periodDistractors.filter((p) => p !== ans)].slice(0, 4)),
        answer: ans,
        sayAnswer: ans,
        curve: { A, B, k: 0 },
        explain: `Period is 2π divided by B. Here 2π / ${B} = ${ans} — one full cycle every ${ans}.`,
      }
    }
    // Max (or min) value.
    const askMax = Math.random() < 0.5
    const ans = askMax ? A : -A
    return {
      promptText: `What is the ${askMax ? 'maximum' : 'minimum'} value of y = ${A}·sin(${B}x)?`,
      say: `What is the ${askMax ? 'maximum' : 'minimum'} value of y equals ${A} sine of ${B} x?`,
      choices: numChoices(ans, [-ans, ans + 1, 0]),
      answer: ans,
      sayAnswer: askMax ? `${A}` : `negative ${A}`,
      curve: { A, B, k: 0 },
      explain: `Sine swings between −1 and 1, so ${A}·sin peaks at +${A} and bottoms at −${A}. The ${askMax ? 'maximum' : 'minimum'} is ${fmtInt(ans)}.`,
    }
  }

  if (d === 2) {
    const roll = Math.random()
    if (roll < 0.5) {
      // Midline of y = A·sin(Bx) + k.
      const A = rint(2, 4)
      const B = [1, 2][rint(0, 1)]
      const k = rint(-3, 4)
      const ans = `y = ${fmtInt(k)}`
      return {
        promptText: `What is the midline of y = ${A}·sin(${B}x) ${k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`}?`,
        say: `What is the midline of y equals ${A} sine of ${B} x ${k >= 0 ? `plus ${k}` : `minus ${Math.abs(k)}`}?`,
        choices: textChoices([ans, `y = ${fmtInt(A)}`, `y = 0`, `x = ${fmtInt(k)}`]),
        answer: ans,
        sayAnswer: `y equals ${k < 0 ? 'negative ' : ''}${Math.abs(k)}`,
        curve: { A, B, k },
        explain: `The constant added outside sine, ${fmtInt(k)}, lifts the whole wave — the midline it oscillates around is y = ${fmtInt(k)}.`,
      }
    }
    // Identify a described feature of a shifted wave.
    const A = rint(2, 4)
    const k = rint(1, 4)
    const kinds = [
      {
        prompt: `y = ${A}·sin(x) + ${k}. What is its maximum value?`,
        say: `y equals ${A} sine of x plus ${k}. What is its maximum value?`,
        ans: `${A + k}`,
        alts: [`${A}`, `${k}`, `${A - k}`],
        explain: `Max of sine part is +${A}; add the midline shift +${k}: ${A} + ${k} = ${A + k}.`,
      },
      {
        prompt: `A sine wave has midline y = ${k} and amplitude ${A}. What is its minimum value?`,
        say: `A sine wave has midline y equals ${k} and amplitude ${A}. What is its minimum value?`,
        ans: `${k - A}`,
        alts: [`${k + A}`, `${-A}`, `${k}`],
        explain: `Minimum is the midline minus the amplitude: ${k} − ${A} = ${k - A}.`,
      },
    ]
    const kk = kinds[rint(0, kinds.length - 1)]
    return {
      promptText: kk.prompt,
      say: kk.say,
      choices: textChoices([kk.ans, ...kk.alts]),
      answer: kk.ans,
      sayAnswer: kk.ans,
      explain: kk.explain,
    }
  }

  // d === 3 — Pythagorean identity & simplification.
  if (Math.random() < 0.55) {
    // Given sinθ (clean value, θ acute → cosθ positive), find cosθ.
    const cases = [
      { sin: '3/5', cos: '4/5' },
      { sin: '4/5', cos: '3/5' },
      { sin: '5/13', cos: '12/13' },
      { sin: '12/13', cos: '5/13' },
      { sin: '8/17', cos: '15/17' },
    ]
    const c = cases[rint(0, cases.length - 1)]
    const alts = cases.filter((x) => x.cos !== c.cos).map((x) => x.cos)
    return {
      promptText: `If sinθ = ${c.sin} and θ is acute, what is cosθ?`,
      say: `If sine theta equals ${c.sin} and theta is acute, what is cosine theta?`,
      choices: textChoices([c.cos, ...alts].slice(0, 4)),
      answer: c.cos,
      sayAnswer: c.cos,
      explain: `Use sin²θ + cos²θ = 1: cos²θ = 1 − (${c.sin})². Since θ is acute, cosθ is positive, giving cosθ = ${c.cos}.`,
    }
  }
  // Simplify a simple identity expression.
  const exprs = [
    { prompt: 'Simplify 1 − sin²θ.', say: 'Simplify one minus sine squared theta.', ans: 'cos²θ', alts: ['sin²θ', '1', 'tan²θ'],
      explain: 'From sin²θ + cos²θ = 1, rearranging gives 1 − sin²θ = cos²θ.' },
    { prompt: 'Simplify 1 − cos²θ.', say: 'Simplify one minus cosine squared theta.', ans: 'sin²θ', alts: ['cos²θ', '1', 'tan²θ'],
      explain: 'From sin²θ + cos²θ = 1, rearranging gives 1 − cos²θ = sin²θ.' },
    { prompt: 'Simplify sin²θ + cos²θ.', say: 'Simplify sine squared theta plus cosine squared theta.', ans: '1', alts: ['0', '2', 'sinθ·cosθ'],
      explain: 'The Pythagorean identity says sin²θ + cos²θ = 1, always.' },
  ]
  const e = exprs[rint(0, exprs.length - 1)]
  return {
    promptText: e.prompt,
    say: e.say,
    choices: textChoices([e.ans, ...e.alts]),
    answer: e.ans,
    sayAnswer: e.ans,
    explain: e.explain,
  }
}

// ── TrigGraphWatch: a narrated worked example (reused for re-teach) ─────────
// Text-forward, with a small sine-wave (via CoordGrid curve) when the round carries one.
export function TrigGraphWatch({
  lines, curve, onDone,
}: {
  lines: string[]; curve?: { A: number; B: number; k: number }; onDone: () => void
}) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const cancel = speakSeq(lines, { onDone: () => window.setTimeout(() => doneRef.current(), 1200) })
    return cancel
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const yr = curve ? Math.max(4, Math.abs(curve.A) + Math.abs(curve.k) + 1) : 4
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {curve && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <CoordGrid
            band={BAND}
            xRange={[-6, 6]}
            yRange={[-yr, yr]}
            mode="read"
            curves={[
              { kind: 'curve', fn: (x) => curve.A * Math.sin(curve.B * x) + curve.k },
            ]}
            lines={curve.k !== 0 ? [{ kind: 'line', m: 0, b: curve.k }] : []}
          />
        </div>
      )}
      <p style={{ margin: 0, maxWidth: 520, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        {lines[lines.length - 1]}
      </p>
    </div>
  )
}

// A one-question check inside the lesson (retry allowed, no penalty).
function TrigAsk({ prompt, say, choices, answer, onDone }: {
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

export default function TrigGraphsIdentitiesTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'A sine wave is set by two numbers: how tall it swings, and how fast it repeats. Watch.', mood: 'happy',
      render: (d) => (
        <TrigGraphWatch
          lines={[
            'Take y equals three sine of x.',
            'The three in front is the amplitude: the wave reaches three above and three below the middle.',
          ]}
          curve={{ A: 3, B: 1, k: 0 }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'The number inside sine controls the period — how far one full cycle takes. Watch.', mood: 'happy',
      render: (d) => (
        <TrigGraphWatch
          lines={[
            'For y equals two sine of two x, the amplitude is still two.',
            'But the two inside squeezes the wave: the period is two pi divided by two, which is pi. It repeats twice as fast.',
          ]}
          curve={{ A: 2, B: 2, k: 0 }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Add a number outside, and the whole wave lifts — plus one identity ties it all together.', mood: 'thinking',
      render: (d) => (
        <TrigGraphWatch
          lines={[
            'Adding a constant, like plus two, raises the midline to y equals two — the wave now swings around that line.',
            'And for any angle, sine squared plus cosine squared always equals one. That Pythagorean identity lets you find one from the other.',
          ]}
          curve={{ A: 2, B: 1, k: 2 }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <TrigAsk
          prompt="What is the amplitude of y = 3·sin(2x)?"
          say="What is the amplitude of y equals three sine of two x?"
          choices={[numChoice(3), numChoice(2), numChoice(6), numChoice(1)]}
          answer={3}
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Trig Graphs & Identities"
      steps={steps}
      finalSpeech={`Nice work, ${childName}. You can read amplitude and period, find the midline, and use the Pythagorean identity. Let’s read some waves.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
