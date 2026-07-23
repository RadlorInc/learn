'use client'
/**
 * RationalFunctionsTeenLesson (17–18, "Field Lab") — the worked-example
 * walkthrough for the Rational Functions module: where a rational function
 * breaks (domain restrictions & vertical asymptotes), where it flattens
 * (horizontal asymptotes by the degree rule), and where it merely has a hole
 * (a factor that cancels top & bottom). Built on TeenLessonShell: a few
 * narrated "watch" steps then a quick check. Exports the round generator +
 * RationalWatch so the practice chapter and its re-teach reuse them. Mirrors
 * FunctionToolkitTeenLesson, in teen chrome.
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
/** Spoken integer: "negative four". */
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)

/** Build text choices from a distinct set; `answer` must be one of `all`. */
function textChoices(all: string[]): Choice[] {
  return shuffle([...new Set(all)]).map((s) => ({ value: s, label: s }))
}

export interface Round {
  promptText: string
  say: string
  choices: Choice[]
  answer: string
  /** Spoken form of the answer (for the wrong-answer read-out). */
  sayAnswer?: string
  /** Optional worked-example curve for the re-teach. */
  curve?: { fn: (x: number) => number; asymptote?: number; min: number; max: number }
  explain: string   // re-teach line
}

/**
 * Difficulty-aware round generator:
 *  L1 vertical asymptote / domain restriction of 1/(x−a) or x/(x−a)
 *  L2 horizontal asymptote by the degree rule
 *  L3 hole vs asymptote when a common factor cancels
 */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) {
    // Vertical asymptote / domain restriction of a simple rational.
    const a = rint(-4, 5)
    const withX = Math.random() < 0.5
    const num = withX ? 'x' : '1'
    const den = `x ${a >= 0 ? `− ${a}` : `+ ${Math.abs(a)}`}`
    const base = `f(x) = ${num} / (${den})`
    const askDomain = Math.random() < 0.5
    if (askDomain) {
      const ans = `x ≠ ${fmtInt(a)}`
      return {
        promptText: `What input is excluded from the domain of ${base}?`,
        say: `What input is excluded from the domain of ${num === '1' ? 'one' : 'x'} over x ${a >= 0 ? `minus ${a}` : `plus ${Math.abs(a)}`}?`,
        choices: textChoices([ans, `x ≠ ${fmtInt(-a)}`, `x ≠ 0`, 'all reals']),
        answer: ans,
        sayAnswer: `x is not equal to ${spoken(a)}`,
        curve: { fn: (x) => (withX ? x : 1) / (x - a), asymptote: a, min: -6, max: 6 },
        explain: `The denominator is zero when x = ${fmtInt(a)}, so that input is forbidden: ${ans}.`,
      }
    }
    const ans = `x = ${fmtInt(a)}`
    return {
      promptText: `Where is the vertical asymptote of ${base}?`,
      say: `Where is the vertical asymptote of ${num === '1' ? 'one' : 'x'} over x ${a >= 0 ? `minus ${a}` : `plus ${Math.abs(a)}`}?`,
      choices: textChoices([ans, `x = ${fmtInt(-a)}`, 'x = 0', 'no vertical asymptote']),
      answer: ans,
      sayAnswer: `x equals ${spoken(a)}`,
      curve: { fn: (x) => (withX ? x : 1) / (x - a), asymptote: a, min: -6, max: 6 },
      explain: `A vertical asymptote sits where the denominator is zero: x − ${fmtInt(a)} = 0, so ${ans}.`,
    }
  }

  if (d === 2) {
    // Horizontal asymptote by the degree rule.
    const roll = rint(0, 2)
    if (roll === 0) {
      // deg(num) < deg(den) → y = 0
      const p = rint(2, 6)
      const q = rint(1, 4)
      return {
        promptText: `What is the horizontal asymptote of f(x) = ${p} / (x² + ${q})?`,
        say: `What is the horizontal asymptote of ${p} over x squared plus ${q}?`,
        choices: textChoices(['y = 0', `y = ${p}`, `y = ${p}/1`, 'no horizontal asymptote']),
        answer: 'y = 0',
        sayAnswer: 'y equals zero',
        explain: `The top degree is lower than the bottom, so the outputs shrink to zero: y = 0.`,
      }
    }
    if (roll === 1) {
      // equal degrees → y = ratio of leading coefficients
      const aLead = rint(2, 6)
      const bLead = rint(2, 6)
      const ans = `y = ${aLead}/${bLead}`
      return {
        promptText: `What is the horizontal asymptote of f(x) = (${aLead}x² + 1) / (${bLead}x² − 3)?`,
        say: `What is the horizontal asymptote of ${aLead} x squared plus one over ${bLead} x squared minus three?`,
        choices: textChoices([ans, 'y = 0', 'no horizontal asymptote', `y = ${bLead}/${aLead}`]),
        answer: ans,
        sayAnswer: `y equals ${aLead} over ${bLead}`,
        explain: `Equal degrees → the asymptote is the ratio of leading coefficients: ${ans}.`,
      }
    }
    // deg(num) > deg(den) → none
    const c = rint(2, 5)
    return {
      promptText: `What is the horizontal asymptote of f(x) = (x² + ${c}) / (x + 1)?`,
      say: `What is the horizontal asymptote of x squared plus ${c} over x plus one?`,
      choices: textChoices(['no horizontal asymptote', 'y = 0', 'y = 1', `y = ${c}`]),
      answer: 'no horizontal asymptote',
      sayAnswer: 'there is no horizontal asymptote',
      explain: `The top degree is higher than the bottom, so it grows without leveling off — no horizontal asymptote.`,
    }
  }

  // d === 3 — hole vs asymptote when a common factor cancels.
  const h = rint(1, 4)          // the cancelling factor's zero → a HOLE here
  let k = rint(-3, 4)           // the remaining denominator zero → an asymptote here
  let guard = 0
  while ((k === h || k === 0) && guard++ < 20) k = rint(-3, 4)
  const base = `f(x) = (x − ${h})(x + ${Math.abs(k) === k ? k : Math.abs(k)}) / (x − ${h})`
  // Build a clean, honest expression: (x − h)(x − k?) / (x − h) → common factor is (x − h).
  const remDen = `x ${k >= 0 ? `− ${k}` : `+ ${Math.abs(k)}`}`
  const expr = `f(x) = (x − ${h})(${remDen}) / ((x − ${h})(x))`
  void base
  const askHole = Math.random() < 0.5
  if (askHole) {
    const ans = `hole at x = ${h}`
    return {
      promptText: `${expr} — the factor (x − ${h}) cancels. What happens at x = ${h}?`,
      say: `A factor cancels top and bottom. What happens at x equals ${h}?`,
      choices: textChoices([ans, `asymptote at x = ${h}`, `asymptote at x = 0`, 'nothing — it is fine']),
      answer: ans,
      sayAnswer: `there is a hole at x equals ${h}`,
      explain: `The factor (x − ${h}) cancels top and bottom, so x = ${h} is a removable hole, not an asymptote.`,
    }
  }
  const ans = `x = 0`
  return {
    promptText: `${expr} — after (x − ${h}) cancels, where is the vertical asymptote?`,
    say: `After the common factor cancels, where is the vertical asymptote?`,
    choices: textChoices([ans, `x = ${h}`, `x = ${fmtInt(-h)}`, 'no vertical asymptote']),
    answer: ans,
    sayAnswer: 'x equals zero',
    explain: `(x − ${h}) cancels → that gives a hole. The leftover denominator factor x = 0 stays, so the asymptote is ${ans}.`,
  }
}

// ── RationalWatch: a narrated worked example (reused for re-teach) ──────────
// Text-forward, with an optional small CoordGrid curve + vertical asymptote.
export function RationalWatch({
  lines, curve, onDone,
}: {
  lines: string[]; curve?: { fn: (x: number) => number; asymptote?: number; min: number; max: number }; onDone: () => void
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
        <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
          <CoordGrid
            band={BAND}
            xRange={[curve.min, curve.max]}
            yRange={[curve.min, curve.max]}
            mode="read"
            curves={[{ kind: 'curve', fn: curve.fn }]}
          />
          {curve.asymptote != null && (
            <svg
              viewBox="0 0 480 480"
              width="100%"
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none', overflow: 'visible' }}
            >
              {(() => {
                const PAD = 28, PLOT = 480 - PAD * 2
                const span = curve.max - curve.min || 1
                const ax = PAD + ((curve.asymptote - curve.min) / span) * PLOT
                return (
                  <line
                    x1={ax} y1={PAD} x2={ax} y2={480 - PAD}
                    stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" opacity={0.8}
                  />
                )
              })()}
            </svg>
          )}
        </div>
      )}
      <p style={{ margin: 0, maxWidth: 520, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        {lines[lines.length - 1]}
      </p>
    </div>
  )
}

// A one-question check inside the lesson (retry allowed, no penalty).
function RationalAsk({ prompt, say, choices, answer, onDone }: {
  prompt: string; say: string; choices: Choice[]; answer: string; onDone: () => void
}) {
  const [selected, setSelected] = React.useState<string | number | null>(null)
  const [status, setStatus] = React.useState<'idle' | 'correct' | 'wrong'>('idle')
  const spokenRef = useRef(false)
  useEffect(() => { if (!spokenRef.current) { spokenRef.current = true; speak(say) } }, []) // eslint-disable-line
  function pick(v: string | number) {
    if (status === 'correct') return
    setSelected(v)
    if (v === answer) { setStatus('correct'); window.setTimeout(onDone, 1400) }
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

export default function RationalFunctionsTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'A rational function breaks where its denominator hits zero. Watch.', mood: 'happy',
      render: (d) => (
        <RationalWatch
          lines={[
            'Take f of x equals one over x minus two.',
            'The denominator is zero at x equals two — the graph shoots off there. That vertical line is the vertical asymptote, and two is excluded from the domain.',
          ]}
          curve={{ fn: (x) => 1 / (x - 2), asymptote: 2, min: -6, max: 6 }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Far out, the graph flattens toward a horizontal asymptote. Watch.', mood: 'happy',
      render: (d) => (
        <RationalWatch
          lines={[
            'Compare the top and bottom degrees.',
            'If the top is smaller, outputs shrink to y equals zero. If the degrees match, the asymptote is the ratio of leading coefficients. If the top is bigger, there is none.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Sometimes a factor cancels — that leaves a hole, not an asymptote.', mood: 'thinking',
      render: (d) => (
        <RationalWatch
          lines={[
            'Look at x minus two times x plus one, all over x minus two.',
            'The x minus two cancels top and bottom, so at x equals two there is a removable hole — a single missing point, not a blow-up.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <RationalAsk
          prompt="Where is the vertical asymptote of f(x) = 1 / (x − 3)?"
          say="Where is the vertical asymptote of one over x minus three?"
          choices={[
            { value: 'x = 3', label: 'x = 3' },
            { value: 'x = −3', label: 'x = −3' },
            { value: 'x = 0', label: 'x = 0' },
            { value: 'y = 0', label: 'y = 0' },
          ]}
          answer="x = 3"
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Rational Functions"
      steps={steps}
      finalSpeech={`Nice work, ${childName}. You can find where a rational function breaks, flattens, or leaves a hole. Let’s probe the edges.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
