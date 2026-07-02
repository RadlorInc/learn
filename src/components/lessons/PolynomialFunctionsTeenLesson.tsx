'use client'
/**
 * PolynomialFunctionsTeenLesson (17–18, "Field Lab") — the worked-example
 * walkthrough for Polynomial Functions: degree & leading term, end behavior,
 * real zeros & multiplicity, and turning points. Built on TeenLessonShell (the
 * teen equivalent of LessonScaffold): a few narrated "watch" steps then a quick
 * check. Exports the round generator + PolynomialWatch so the practice chapter
 * and its re-teach reuse them. Mirrors FunctionToolkitTeenLesson, in teen chrome.
 */
import React, { useEffect, useRef } from 'react'
import { speak, speakSeq } from '@/lib/useMiloSpeaker'
import type { LessonStep } from '@/components/lessons/_kit'
import type { AgeBand, Choice } from '@/components/teen/types'
import TeenLessonShell from '@/components/teen/TeenLessonShell'
import CoordGrid from '@/components/teen/CoordGrid'
import ChoiceGrid from '@/components/teen/ChoiceGrid'

const BAND: AgeBand = '17-18'

// ── shared helpers (reused by the practice chapter) ────────────────────────
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
/** Pretty integer: a real minus sign for negatives. */
export const fmtInt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
/** Spoken integer: "negative four". */
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
const numChoice = (v: number): Choice => ({ value: v, label: fmtInt(v) })
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)

/** Build 4 distinct numeric choices around a numeric answer. */
function numChoices(answer: number, distractors: number[]): Choice[] {
  const set = new Set<number>([answer])
  for (const v of distractors) { if (set.size >= 4) break; if (Number.isFinite(v) && v >= 0) set.add(v) }
  let guard = 0
  while (set.size < 4 && guard++ < 60) { const v = answer + rint(-2, 3); if (v >= 0) set.add(v) }
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
  /** Optional worked-example curve for the re-teach. */
  curve?: { fn: (x: number) => number; min: number; max: number }
  explain: string   // re-teach line
}

// ── end-behavior helpers ────────────────────────────────────────────────────
/** The end-behavior phrase for a polynomial of the given degree parity + leading sign. */
function endBehavior(degreeEven: boolean, positive: boolean): string {
  if (degreeEven) return positive ? 'Up on both ends' : 'Down on both ends'
  return positive ? 'Down on the left, up on the right' : 'Up on the left, down on the right'
}
const END_OPTIONS = [
  'Up on both ends',
  'Down on both ends',
  'Down on the left, up on the right',
  'Up on the left, down on the right',
]

// Sample polynomials (for the visual worked examples) by degree parity + sign.
const sampleFn = (degreeEven: boolean, positive: boolean) => {
  const s = positive ? 1 : -1
  return degreeEven ? (x: number) => s * (x * x * x * x - 4 * x * x) : (x: number) => s * (x * x * x - 3 * x)
}

/** Difficulty-aware round generator: L1 degree + even/positive end behavior · L2 four-case end behavior + max zeros · L3 factored-form zeros/multiplicity + max turning points. */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) {
    if (Math.random() < 0.5) {
      // Degree from the highest exponent.
      const deg = rint(2, 5)
      const lead = deg === 2 ? `x²` : deg === 3 ? `x³` : deg === 4 ? `x⁴` : `x⁵`
      const poly = `f(x) = 2${lead} − 5x + 1`
      return {
        promptText: `What is the degree of ${poly}?`,
        say: `What is the degree of the polynomial with highest power ${deg}?`,
        choices: numChoices(deg, [deg + 1, deg - 1, deg + 2]),
        answer: deg,
        sayAnswer: `${deg}`,
        explain: `The degree is the highest exponent: the leading term is ${lead}, so the degree is ${deg}.`,
      }
    }
    // End-behavior DIRECTION from an even degree with a positive leading coefficient.
    const positive = Math.random() < 0.5
    const ans = endBehavior(true, positive)
    const lead = positive ? '3x⁴' : '−3x⁴'
    return {
      promptText: `f(x) = ${lead} + … (degree 4). How does it behave at the ends?`,
      say: `An even-degree polynomial with leading term ${positive ? '' : 'negative '}three x to the fourth. How does it behave at the ends?`,
      choices: textChoices([ans, ...END_OPTIONS.filter((o) => o !== ans)]),
      answer: ans,
      sayAnswer: ans,
      curve: { fn: sampleFn(true, positive), min: -3, max: 3 },
      explain: `Even degree means both ends go the same way. A ${positive ? 'positive' : 'negative'} leading coefficient sends them ${positive ? 'up' : 'down'} — ${ans.toLowerCase()}.`,
    }
  }

  if (d === 2) {
    if (Math.random() < 0.55) {
      // End behavior for the four cases (odd/even × +/−).
      const degreeEven = Math.random() < 0.5
      const positive = Math.random() < 0.5
      const ans = endBehavior(degreeEven, positive)
      const lead = `${positive ? '' : '−'}${degreeEven ? '2x⁴' : '2x³'}`
      return {
        promptText: `Leading term ${lead}. What is the end behavior?`,
        say: `Leading term ${positive ? '' : 'negative '}two x to the ${degreeEven ? 'fourth' : 'third'}. What is the end behavior?`,
        choices: textChoices([ans, ...END_OPTIONS.filter((o) => o !== ans)]),
        answer: ans,
        sayAnswer: ans,
        curve: { fn: sampleFn(degreeEven, positive), min: -3, max: 3 },
        explain: degreeEven
          ? `Even degree → both ends match; ${positive ? 'positive' : 'negative'} lead → ${ans.toLowerCase()}.`
          : `Odd degree → ends split; ${positive ? 'positive' : 'negative'} lead → ${ans.toLowerCase()}.`,
      }
    }
    // Max number of real zeros of a degree-n polynomial (≤ n).
    const deg = rint(3, 6)
    return {
      promptText: `A polynomial has degree ${deg}. What is the greatest number of real zeros it can have?`,
      say: `A polynomial has degree ${deg}. What is the greatest number of real zeros it can have?`,
      choices: numChoices(deg, [deg - 1, deg + 1, deg - 2]),
      answer: deg,
      sayAnswer: `${deg}`,
      explain: `A degree-${deg} polynomial has at most ${deg} real zeros — the degree caps the count.`,
    }
  }

  // d === 3 — factored form: zeros & multiplicity, and max turning points.
  if (Math.random() < 0.55) {
    // Zeros & multiplicity from a factored form like (x−2)²(x+1).
    const r1 = rint(1, 4)                 // the doubled root value
    let r2 = rint(-4, 3)
    let guard = 0
    while (r2 === r1 && guard++ < 30) r2 = rint(-4, 3)
    const factored = `(x − ${r1})²(x ${r2 >= 0 ? `− ${r2}` : `+ ${Math.abs(r2)}`})`
    const ans = `${fmtInt(r1)} (double), ${fmtInt(r2)}`
    const alts = [
      `${fmtInt(r1)}, ${fmtInt(r2)} (double)`,
      `${fmtInt(-r1)} (double), ${fmtInt(-r2)}`,
      `${fmtInt(r1)}, ${fmtInt(r2)}`,
    ]
    return {
      promptText: `What are the zeros (and multiplicity) of f(x) = ${factored}?`,
      say: `A polynomial factors as x minus ${r1} squared, times x ${r2 >= 0 ? `minus ${r2}` : `plus ${Math.abs(r2)}`}. What are its zeros and their multiplicity?`,
      choices: textChoices([ans, ...alts]),
      answer: ans,
      sayAnswer: `${spoken(r1)}, a double root, and ${spoken(r2)}`,
      explain: `Set each factor to zero: (x − ${fmtInt(r1)})² gives ${fmtInt(r1)} with multiplicity 2 (a double root), and the other factor gives ${fmtInt(r2)}.`,
    }
  }
  // Max turning points = n − 1.
  const deg = rint(3, 6)
  const ans = deg - 1
  return {
    promptText: `A degree-${deg} polynomial has at most how many turning points?`,
    say: `A degree ${deg} polynomial has at most how many turning points?`,
    choices: numChoices(ans, [deg, ans - 1, deg + 1]),
    answer: ans,
    sayAnswer: `${ans}`,
    explain: `A degree-${deg} polynomial turns at most ${deg} − 1 = ${ans} times.`,
  }
}

// ── PolynomialWatch: a narrated worked example (reused for re-teach) ─────────
// Text-forward, with an optional small CoordGrid curve when the round carries one.
export function PolynomialWatch({
  lines, curve, onDone,
}: {
  lines: string[]; curve?: { fn: (x: number) => number; min: number; max: number }; onDone: () => void
}) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const cancel = speakSeq(lines, { onDone: () => window.setTimeout(() => doneRef.current(), 1200) })
    return cancel
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {curve && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <CoordGrid
            band={BAND}
            xRange={[curve.min, curve.max]}
            yRange={[curve.min * 3, curve.max * 3]}
            mode="read"
            curves={[{ kind: 'curve', fn: curve.fn }]}
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
function PolynomialAsk({ prompt, say, choices, answer, onDone }: {
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
      <div style={{ width: '100%', maxWidth: 380 }}>
        <ChoiceGrid band={BAND} choices={choices} selected={selected} status={status} correctValue={answer} onPick={pick} columns={choices.length === 4 ? 2 : choices.length} />
      </div>
    </div>
  )
}

interface Props { band?: AgeBand; childName: string; onLessonComplete: () => void }

export default function PolynomialFunctionsTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'The degree is the highest power — it sets the shape. Watch.', mood: 'happy',
      render: (d) => (
        <PolynomialWatch
          lines={[
            'Look at the leading term, the one with the highest power.',
            'For three x to the fourth, the degree is four — that is what decides how the curve behaves far out.',
          ]}
          curve={{ fn: sampleFn(true, true), min: -3, max: 3 }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'The ends are set by degree and leading sign. Watch.', mood: 'happy',
      render: (d) => (
        <PolynomialWatch
          lines={[
            'Even degree means both ends go the same way; odd degree means they split.',
            'A negative leading coefficient flips the ends. Here, negative and odd gives up on the left, down on the right.',
          ]}
          curve={{ fn: sampleFn(false, false), min: -3, max: 3 }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Factors give the zeros; multiplicity says how the curve meets the axis.', mood: 'thinking',
      render: (d) => (
        <PolynomialWatch
          lines={[
            'From x minus two squared, times x plus one, the zeros are two and negative one.',
            'The two is a double root, so a degree-three curve turns at most twice — degree minus one.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <PolynomialAsk
          prompt="f(x) = −3x⁴ + … (degree 4). How does it behave at the ends?"
          say="An even-degree polynomial with a negative leading coefficient. How does it behave at the ends?"
          choices={textChoices([endBehavior(true, false), ...END_OPTIONS.filter((o) => o !== endBehavior(true, false))])}
          answer={endBehavior(true, false)}
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Polynomial Functions"
      steps={steps}
      finalSpeech={`Nice work, ${childName}. You can read a polynomial's degree, end behavior, zeros, and turning points. Let's trace some curves.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
