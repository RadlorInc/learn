'use client'
/**
 * SequencesSeriesTeenLesson (17–18, "Field Lab") — the worked-example walkthrough
 * for the Sequences & Series module: spot the rule of a sequence (arithmetic
 * common difference / geometric common ratio), jump to the nth term, and sum a
 * run of terms. Built on TeenLessonShell (the teen equivalent of LessonScaffold):
 * a few narrated "watch" steps then a quick check. Exports the round generator +
 * SequenceWatch so the practice chapter and its re-teach reuse them. Mirrors
 * IntegersTeenLesson / FunctionToolkitTeenLesson, in teen chrome.
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
  for (const v of distractors) { if (set.size >= 4) break; if (Number.isFinite(v)) set.add(v) }
  let guard = 0
  while (set.size < 4 && guard++ < 60) set.add(answer + rint(-4, 4))
  return shuffle([...set]).map(numChoice)
}

/** Build text choices; `answer` must be one of `all`. */
function textChoices(all: string[]): Choice[] {
  return shuffle([...new Set(all)]).map((s) => ({ value: s, label: s }))
}

/** First `n` terms of an arithmetic sequence a₁, a₁+d, … */
function arithTerms(a1: number, d: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => a1 + i * d)
}
/** First `n` terms of a geometric sequence a₁, a₁·r, … */
function geoTerms(a1: number, r: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => a1 * r ** i)
}
/** Sequence preview like "2, 5, 8, 11, …" */
const seqText = (t: number[]) => `${t.map(fmtInt).join(', ')}, …`

export interface Round {
  promptText: string
  say: string
  choices: Choice[]
  answer: string | number
  /** Spoken form of the answer (for the wrong-answer read-out). */
  sayAnswer?: string
  /** Optional term plot for the re-teach (n on x, term value on y). */
  seq?: { terms: number[]; highlight?: number }
  explain: string   // re-teach line
}

/**
 * Difficulty-aware round generator:
 *   L1 next term of an arithmetic/geometric sequence + identify d or r
 *   L2 nth-term value (arithmetic aₙ = a₁+(n−1)d · geometric aₙ = a₁·r^(n−1))
 *   L3 series sums (arithmetic Sₙ = n/2·(a₁+aₙ) · small finite geometric sum)
 */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) {
    const geometric = Math.random() < 0.45
    const askRule = Math.random() < 0.5
    if (!geometric) {
      // Arithmetic.
      const a1 = rint(1, 6)
      const diff = rint(2, 5) * (Math.random() < 0.25 ? -1 : 1)
      const terms = arithTerms(a1, diff, 4)
      const next = a1 + 4 * diff
      if (askRule) {
        return {
          promptText: `${seqText(terms)}  —  what is the common difference?`,
          say: `Look at the sequence ${terms.map(spoken).join(', ')}. What is the common difference?`,
          choices: numChoices(diff, [diff + 1, diff - 1, -diff]),
          answer: diff,
          sayAnswer: spoken(diff),
          seq: { terms },
          explain: `Each term rises by the same step. ${fmtInt(terms[1])} − ${fmtInt(terms[0])} = ${fmtInt(diff)}, so the common difference is ${fmtInt(diff)}.`,
        }
      }
      return {
        promptText: `${seqText(terms)}  —  what comes next?`,
        say: `Look at the sequence ${terms.map(spoken).join(', ')}. What is the next term?`,
        choices: numChoices(next, [next + diff, next - diff, next + 1]),
        answer: next,
        sayAnswer: spoken(next),
        seq: { terms: [...terms, next], highlight: 4 },
        explain: `It is arithmetic with common difference ${fmtInt(diff)}. Add ${fmtInt(diff)} to ${fmtInt(terms[3])} to get ${fmtInt(next)}.`,
      }
    }
    // Geometric.
    const a1 = rint(1, 3)
    const r = rint(2, 3)
    const terms = geoTerms(a1, r, 4)
    const next = a1 * r ** 4
    if (askRule) {
      return {
        promptText: `${seqText(terms)}  —  what is the common ratio?`,
        say: `Look at the sequence ${terms.map(spoken).join(', ')}. What is the common ratio?`,
        choices: numChoices(r, [r + 1, r - 1, r + 2]),
        answer: r,
        sayAnswer: spoken(r),
        seq: { terms },
        explain: `Each term multiplies by the same factor. ${fmtInt(terms[1])} ÷ ${fmtInt(terms[0])} = ${fmtInt(r)}, so the common ratio is ${fmtInt(r)}.`,
      }
    }
    return {
      promptText: `${seqText(terms)}  —  what comes next?`,
      say: `Look at the sequence ${terms.map(spoken).join(', ')}. What is the next term?`,
      choices: numChoices(next, [next + terms[3], next - terms[3], terms[3] * (r + 1)]),
      answer: next,
      sayAnswer: spoken(next),
      seq: { terms: [...terms, next], highlight: 4 },
      explain: `It is geometric with common ratio ${fmtInt(r)}. Multiply ${fmtInt(terms[3])} by ${fmtInt(r)} to get ${fmtInt(next)}.`,
    }
  }

  if (d === 2) {
    const geometric = Math.random() < 0.4
    if (!geometric) {
      // nth term of an arithmetic sequence: aₙ = a₁ + (n−1)d.
      const a1 = rint(1, 6)
      const diff = rint(2, 5) * (Math.random() < 0.25 ? -1 : 1)
      const n = rint(5, 9)
      const ans = a1 + (n - 1) * diff
      const preview = arithTerms(a1, diff, 3)
      return {
        promptText: `Arithmetic: a₁ = ${fmtInt(a1)}, d = ${fmtInt(diff)}. Find a${'₀₁₂₃₄₅₆₇₈₉'[n]} (the ${n}th term).`,
        say: `An arithmetic sequence starts at ${spoken(a1)} with common difference ${spoken(diff)}. What is the ${n}th term?`,
        choices: numChoices(ans, [ans + diff, ans - diff, a1 + n * diff]),
        answer: ans,
        sayAnswer: spoken(ans),
        seq: { terms: preview },
        explain: `Use aₙ = a₁ + (n − 1)d: ${fmtInt(a1)} + (${n} − 1)·${fmtInt(diff)} = ${fmtInt(a1)} + ${fmtInt((n - 1) * diff)} = ${fmtInt(ans)}.`,
      }
    }
    // nth term of a geometric sequence: aₙ = a₁·r^(n−1) (small r, small n).
    const a1 = rint(1, 3)
    const r = 2
    const n = rint(3, 5)
    const ans = a1 * r ** (n - 1)
    const preview = geoTerms(a1, r, 3)
    return {
      promptText: `Geometric: a₁ = ${fmtInt(a1)}, r = ${fmtInt(r)}. Find a${'₀₁₂₃₄₅₆₇₈₉'[n]} (the ${n}th term).`,
      say: `A geometric sequence starts at ${spoken(a1)} with common ratio ${spoken(r)}. What is the ${n}th term?`,
      choices: numChoices(ans, [ans * r, ans / r, a1 * r ** n]),
      answer: ans,
      sayAnswer: spoken(ans),
      seq: { terms: preview },
      explain: `Use aₙ = a₁·r^(n−1): ${fmtInt(a1)}·${fmtInt(r)}^(${n} − 1) = ${fmtInt(a1)}·${fmtInt(r ** (n - 1))} = ${fmtInt(ans)}.`,
    }
  }

  // d === 3 — series sums.
  if (Math.random() < 0.6) {
    // Arithmetic sum of first n terms: Sₙ = n/2·(a₁ + aₙ).
    const a1 = rint(1, 5)
    const diff = rint(2, 4)
    const n = rint(4, 8)
    const an = a1 + (n - 1) * diff
    const ans = (n * (a1 + an)) / 2
    const preview = arithTerms(a1, diff, Math.min(n, 4))
    return {
      promptText: `Sum the first ${n} terms of ${seqText(arithTerms(a1, diff, 3))} (arithmetic).`,
      say: `Add up the first ${n} terms of the arithmetic sequence starting ${arithTerms(a1, diff, 3).map(spoken).join(', ')}. What is the sum?`,
      choices: numChoices(ans, [ans + diff, ans - a1, ans + n]),
      answer: ans,
      sayAnswer: spoken(ans),
      seq: { terms: preview },
      explain: `Sₙ = n/2·(a₁ + aₙ). The ${n}th term is ${fmtInt(an)}, so Sₙ = ${n}/2·(${fmtInt(a1)} + ${fmtInt(an)}) = ${n}/2·${fmtInt(a1 + an)} = ${fmtInt(ans)}.`,
    }
  }
  // Small finite geometric sum.
  const a1 = rint(1, 3)
  const r = 2
  const n = rint(3, 5)
  const terms = geoTerms(a1, r, n)
  const ans = terms.reduce((s, t) => s + t, 0)
  return {
    promptText: `Add the first ${n} terms of ${seqText(geoTerms(a1, r, 3))} (geometric).`,
    say: `Add up the first ${n} terms of the geometric sequence starting ${geoTerms(a1, r, 3).map(spoken).join(', ')}. What is the sum?`,
    choices: numChoices(ans, [ans + terms[n - 1], ans - a1, ans + 1]),
    answer: ans,
    sayAnswer: spoken(ans),
    seq: { terms: geoTerms(a1, r, Math.min(n, 4)) },
    explain: `Just add the terms: ${terms.map(fmtInt).join(' + ')} = ${fmtInt(ans)}. (Or Sₙ = a₁·(rⁿ − 1)/(r − 1).)`,
  }
}

// ── SequenceWatch: a narrated worked example (reused for re-teach) ──────────
// Text-forward, with an optional small CoordGrid plotting the terms as points
// (n on x, term value on y) when the round carries a `seq`.
export function SequenceWatch({
  lines, seq, onDone,
}: {
  lines: string[]; seq?: { terms: number[]; highlight?: number }; onDone: () => void
}) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const cancel = speakSeq(lines, { onDone: () => window.setTimeout(() => doneRef.current(), 1200) })
    return cancel
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const grid = seq ? seqGrid(seq) : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {grid && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <CoordGrid
            band={BAND}
            xRange={grid.xRange}
            yRange={grid.yRange}
            mode="read"
            points={grid.points}
            highlight={grid.highlight}
          />
        </div>
      )}
      <p style={{ margin: 0, maxWidth: 520, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        {lines[lines.length - 1]}
      </p>
    </div>
  )
}

/** Map a sequence's terms into CoordGrid points (n on x, term on y) + a sane range. */
function seqGrid(seq: { terms: number[]; highlight?: number }) {
  const points = seq.terms.map((t, i) => ({ x: i + 1, y: t }))
  const ys = seq.terms
  const yMin = Math.min(0, ...ys)
  const yMax = Math.max(1, ...ys)
  // Round the y-range out to a tidy multiple so the grid stays readable.
  const roundTo = (v: number, up: boolean) => {
    const s = Math.max(1, Math.ceil((yMax - yMin) / 8))
    return up ? Math.ceil(v / s) * s : Math.floor(v / s) * s
  }
  const highlight = seq.highlight != null
    ? { x: seq.highlight + 1, y: seq.terms[seq.highlight] }
    : null
  return {
    xRange: [0, seq.terms.length + 1] as [number, number],
    yRange: [roundTo(yMin, false), roundTo(yMax, true)] as [number, number],
    points,
    highlight,
  }
}

// A one-question check inside the lesson (retry allowed, no penalty).
function SequenceAsk({ prompt, say, choices, answer, onDone }: {
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

export default function SequencesSeriesTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'A sequence is a list with a rule. Find the rule and you can jump anywhere. Watch.', mood: 'happy',
      render: (d) => (
        <SequenceWatch
          lines={[
            'Take two, five, eight, eleven. Each term is three more than the one before.',
            'That constant step is the common difference. Here it is three — an arithmetic sequence.',
          ]}
          seq={{ terms: [2, 5, 8, 11] }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Some sequences multiply instead of add — and there is a formula to reach any term.', mood: 'happy',
      render: (d) => (
        <SequenceWatch
          lines={[
            'Three, six, twelve, twenty-four multiplies by two each time — the common ratio is two, a geometric sequence.',
            'For any term use a sub n. Arithmetic: a one plus n minus one times d. Geometric: a one times r to the n minus one.',
          ]}
          seq={{ terms: [3, 6, 12, 24] }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'To add up a whole run of terms, use a series sum — no adding them one by one.', mood: 'thinking',
      render: (d) => (
        <SequenceWatch
          lines={[
            'For an arithmetic series, S sub n is n over two times the first term plus the last term.',
            'So five terms of two, five, eight, eleven, fourteen is five over two times two plus fourteen — which is forty.',
          ]}
          seq={{ terms: [2, 5, 8, 11, 14] }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <SequenceAsk
          prompt="2, 5, 8, 11, … — what comes next?"
          say="Two, five, eight, eleven. What is the next term?"
          choices={[numChoice(14), numChoice(13), numChoice(15), numChoice(16)]}
          answer={14}
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Sequences & Series"
      steps={steps}
      finalSpeech={`Nice work, ${childName}. You can spot the rule, jump to any term, and sum a run. Let’s run the module.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
