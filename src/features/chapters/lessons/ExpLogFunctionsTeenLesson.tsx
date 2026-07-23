'use client'
/**
 * ExpLogFunctionsTeenLesson (17–18, "Field Lab" / math-studio) — the worked-
 * example walkthrough for the Exponential & Log module. Built on TeenLessonShell:
 * a few narrated "watch" steps, then a quick check. Exports the round generator
 * + ExpLogWatch so the practice chapter and its re-teach reuse them. Mirrors the
 * IntegersTeenLesson pattern, in the 17–18 studio chrome.
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
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)
const toChoice = (v: string | number): Choice => ({ value: v, label: String(v) })

/** Build a 4-way MCQ from a numeric answer + a bank of distractors (deduped). */
function choicesFrom(answer: number, distractors: number[]): Choice[] {
  const set = new Set<number>([answer])
  for (const v of distractors) { if (set.size >= 4) break; if (Number.isFinite(v) && v >= 0) set.add(v) }
  let guard = 0
  while (set.size < 4 && guard++ < 50) set.add(answer + rint(1, 4))
  return shuffle([...set]).map(toChoice)
}

/** Build a 4-way MCQ from a text answer + text distractors. */
function textChoices(answer: string, distractors: string[]): Choice[] {
  const set = new Set<string>([answer])
  for (const v of distractors) { if (set.size >= 4) break; set.add(v) }
  return shuffle([...set]).map(toChoice)
}

export interface Round {
  promptText: string
  say: string
  choices: Choice[]
  answer: string | number
  /** spoken label for the answer, used by the generic wrong-answer read-out */
  answerLabel: string
  explain: string   // re-teach line
}

const SUP: Record<number, string> = { 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸' }
const supFor = (n: number) => SUP[n] ?? `^${n}`
const SUB: Record<number, string> = { 2: '₂', 3: '₃', 5: '₅', 10: '₁₀' }
const subFor = (n: number) => SUB[n] ?? `_${n}`

/**
 * Difficulty-aware round generator:
 *   L1 evaluate small powers + classify growth/decay
 *   L2 exp ↔ log form + simple logs
 *   L3 solve exponentials + a log-rule identity
 * Every answer is a clean integer or a short text option; all MCQ.
 */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) {
    if (Math.random() < 0.5) {
      // classify growth vs decay from the base
      const decay = Math.random() < 0.5
      const base = decay ? '(1/2)' : String([2, 3, 5][rint(0, 2)])
      const ans = decay ? 'decay' : 'growth'
      return {
        promptText: `Is y = ${base}ˣ growth or decay?`,
        say: `Is y equals ${decay ? 'one half' : base} to the x growth or decay?`,
        choices: textChoices(ans, ['growth', 'decay']),
        answer: ans,
        answerLabel: ans,
        explain: decay
          ? `A base between 0 and 1 (here ${base}) shrinks each step, so it is decay.`
          : `A base greater than 1 (here ${base}) grows each step, so it is growth.`,
      }
    }
    // evaluate a small power
    const bases = [2, 3, 5, 10] as const
    const base = bases[rint(0, 3)]
    const exp = base === 10 ? 3 : base === 5 ? 2 : rint(2, 4)
    const ans = Math.pow(base, exp)
    return {
      promptText: `Evaluate ${base}${supFor(exp)}.`,
      say: `What is ${base} to the power of ${exp}?`,
      choices: choicesFrom(ans, [base * exp, ans + base, Math.pow(base, exp - 1), ans - base]),
      answer: ans,
      answerLabel: String(ans),
      explain: `${base}${supFor(exp)} means ${base} multiplied ${exp} times, which is ${ans}.`,
    }
  }

  if (d === 2) {
    if (Math.random() < 0.5) {
      // exp ↔ log form conversion
      const pairs = [
        { b: 2, e: 3, v: 8 },
        { b: 2, e: 4, v: 16 },
        { b: 3, e: 2, v: 9 },
        { b: 5, e: 2, v: 25 },
        { b: 10, e: 2, v: 100 },
      ]
      const p = pairs[rint(0, pairs.length - 1)]
      const ans = `log${subFor(p.b)}${p.v} = ${p.e}`
      const distractors = [
        `log${subFor(p.b)}${p.e} = ${p.v}`,
        `log${subFor(p.v)}${p.b} = ${p.e}`,
        `log${subFor(p.b)}${p.v} = ${p.b}`,
      ]
      return {
        promptText: `Rewrite ${p.b}${supFor(p.e)} = ${p.v} in log form.`,
        say: `Rewrite ${p.b} to the ${p.e} equals ${p.v} in logarithm form.`,
        choices: textChoices(ans, distractors),
        answer: ans,
        answerLabel: ans,
        explain: `${p.b}${supFor(p.e)} = ${p.v} means "${p.b} to what power is ${p.v}?" — the answer is ${p.e}, so log${subFor(p.b)}${p.v} = ${p.e}.`,
      }
    }
    // evaluate a simple log
    const logs = [
      { b: 2, v: 8, a: 3 },
      { b: 10, v: 1000, a: 3 },
      { b: 3, v: 9, a: 2 },
      { b: 2, v: 16, a: 4 },
      { b: 10, v: 100, a: 2 },
    ]
    const l = logs[rint(0, logs.length - 1)]
    return {
      promptText: `Evaluate log${subFor(l.b)}${l.v}.`,
      say: `What is log base ${l.b} of ${l.v}?`,
      choices: choicesFrom(l.a, [l.a + 1, l.a - 1, l.b, l.a + 2]),
      answer: l.a,
      answerLabel: String(l.a),
      explain: `log${subFor(l.b)}${l.v} asks "${l.b} to what power is ${l.v}?" → ${l.a}, because ${l.b}${supFor(l.a)} = ${l.v}.`,
    }
  }

  // d === 3
  if (Math.random() < 0.6) {
    // solve an exponential equation
    const eqs = [
      { b: 2, v: 16, a: 4 },
      { b: 10, v: 1000, a: 3 },
      { b: 5, v: 125, a: 3 },
      { b: 2, v: 32, a: 5 },
      { b: 3, v: 27, a: 3 },
    ]
    const e = eqs[rint(0, eqs.length - 1)]
    return {
      promptText: `Solve ${e.b}ˣ = ${e.v} for x.`,
      say: `Solve ${e.b} to the x equals ${e.v} for x.`,
      choices: choicesFrom(e.a, [e.a + 1, e.a - 1, e.v / e.b, e.a + 2]),
      answer: e.a,
      answerLabel: String(e.a),
      explain: `${e.b}ˣ = ${e.v} means log${subFor(e.b)}${e.v} = x. Since ${e.b}${supFor(e.a)} = ${e.v}, x = ${e.a}.`,
    }
  }
  // log-rule identity
  const quotient = Math.random() < 0.5
  const ans = quotient ? 'log a − log b' : 'log a + log b'
  const prompt = quotient ? 'log(a / b)' : 'log(a · b)'
  return {
    promptText: `${prompt} equals which of these?`,
    say: quotient ? 'What does log of a divided by b equal?' : 'What does log of a times b equal?',
    choices: textChoices(ans, ['log a + log b', 'log a − log b', 'log a · log b', '(log a) / (log b)']),
    answer: ans,
    answerLabel: ans,
    explain: quotient
      ? 'A quotient inside a log becomes a difference: log(a / b) = log a − log b.'
      : 'A product inside a log becomes a sum: log(a · b) = log a + log b.',
  }
}

// ── ExpLogWatch: a narrated text-forward worked example (reused for re-teach) ──
export function ExpLogWatch({ lines, onDone }: { lines: string[]; onDone: () => void }) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const cancel = speakSeq(lines, { onDone: () => window.setTimeout(() => doneRef.current(), 1200) })
    return cancel
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      <div
        style={{
          fontFamily: 'var(--font-numeric)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 30,
          fontWeight: 600,
          color: 'var(--accent)',
          minHeight: 40,
        }}
      >
        {lines[lines.length - 1]?.split('.')[0]}
      </div>
      <p style={{ margin: 0, maxWidth: 520, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        {lines[lines.length - 1]}
      </p>
    </div>
  )
}

// A one-question check inside the lesson (retry allowed, no penalty).
function ExpLogAsk({ prompt, say, choices, answer, onDone }: {
  prompt: string; say: string; choices: Choice[]; answer: string | number; onDone: () => void
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
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{prompt}</p>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <ChoiceGrid band={BAND} choices={choices} selected={selected} status={status} onPick={pick} columns={2} />
      </div>
    </div>
  )
}

interface Props { band?: AgeBand; childName: string; onLessonComplete: () => void }

export default function ExpLogFunctionsTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'Exponentials multiply by a fixed base each step. Watch.', mood: 'happy',
      render: (d) => (
        <ExpLogWatch
          lines={[
            'Start with 2 to the 3rd power.',
            '2 to the 3 means 2 × 2 × 2, which is 8. A base above 1 grows fast.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'A base between 0 and 1 shrinks — that is decay. Watch.', mood: 'thinking',
      render: (d) => (
        <ExpLogWatch
          lines={[
            'Now take one half to the x.',
            'Each step multiplies by one half, so the value halves and heads toward zero — exponential decay.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'A logarithm undoes an exponential — it finds the power.', mood: 'thinking',
      render: (d) => (
        <ExpLogWatch
          lines={[
            'log base 2 of 8 asks: 2 to what power is 8?',
            'Since 2 to the 3 is 8, log base 2 of 8 is 3. Exponential and log are inverses.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <ExpLogAsk
          prompt="Evaluate log₂16."
          say="What is log base 2 of 16?"
          choices={[toChoice(3), toChoice(4), toChoice(8), toChoice(2)]}
          answer={4}
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Exponential & Log"
      steps={steps}
      finalSpeech={`Nice work, ${childName}. You can grow, decay, and undo it with logs. Let’s run the module.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
