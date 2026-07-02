'use client'
/**
 * FunctionToolkitTeenLesson (17–18, "Field Lab") — the worked-example walkthrough
 * for the Function Toolkit module: evaluate a rule, read domain/range, transform,
 * and run functions backward (composition & inverse). Built on TeenLessonShell
 * (the teen equivalent of LessonScaffold): a few narrated "watch" steps then a
 * quick check. Exports the round generator + FunctionWatch so the practice
 * chapter and its re-teach reuse them. Mirrors IntegersTeenLesson, in teen chrome.
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

export interface Round {
  promptText: string
  say: string
  choices: Choice[]
  answer: string | number
  /** Spoken form of the answer (for the wrong-answer read-out). */
  sayAnswer?: string
  /** Optional worked-example curve for the re-teach (evaluate rounds). */
  curve?: { fn: (x: number) => number; at: number; min: number; max: number }
  explain: string   // re-teach line
}

// ── the three rules used by the L1 evaluate rounds ─────────────────────────
type Rule = { text: string; say: string; fn: (x: number) => number }
const RULES: Rule[] = [
  { text: 'f(x) = 2x + 3', say: 'f of x equals two x plus three', fn: (x) => 2 * x + 3 },
  { text: 'f(x) = 3x − 1', say: 'f of x equals three x minus one', fn: (x) => 3 * x - 1 },
  { text: 'f(x) = x² − 1', say: 'f of x equals x squared minus one', fn: (x) => x * x - 1 },
  { text: 'f(x) = x² + x', say: 'f of x equals x squared plus x', fn: (x) => x * x + x },
]

/** Difficulty-aware round generator: L1 evaluate · L2 domain/range + transforms · L3 composition & inverse. */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) {
    // Evaluate a rule at a small integer input.
    const rule = RULES[rint(0, RULES.length - 1)]
    const a = rint(-3, 5)
    const ans = rule.fn(a)
    return {
      promptText: `Given ${rule.text}, what is f(${fmtInt(a)})?`,
      say: `Given ${rule.say}. What is f of ${spoken(a)}?`,
      choices: numChoices(ans, [ans + 2, ans - 2, ans + rule.fn(1) - rule.fn(0)]),
      answer: ans,
      sayAnswer: spoken(ans),
      curve: { fn: rule.fn, at: a, min: -6, max: 6 },
      explain: `Substitute the input into the rule: ${rule.text.replace('x', `(${fmtInt(a)})`).split(' ')[0]}${rule.text.slice(rule.text.indexOf('='))} at x = ${fmtInt(a)} gives ${fmtInt(ans)}.`,
    }
  }

  if (d === 2) {
    const roll = Math.random()
    if (roll < 0.5) {
      // Identify a transformation of f.
      const kinds = [
        { g: 'g(x) = f(x) + 3', say: 'g of x equals f of x plus three', ans: 'Shift up 3',
          alts: ['Shift down 3', 'Shift right 3', 'Reflect over the x-axis'] },
        { g: 'g(x) = f(x) − 2', say: 'g of x equals f of x minus two', ans: 'Shift down 2',
          alts: ['Shift up 2', 'Shift left 2', 'Reflect over the y-axis'] },
        { g: 'g(x) = f(x − 2)', say: 'g of x equals f of x minus two, inside', ans: 'Shift right 2',
          alts: ['Shift left 2', 'Shift up 2', 'Reflect over the x-axis'] },
        { g: 'g(x) = f(x + 4)', say: 'g of x equals f of x plus four, inside', ans: 'Shift left 4',
          alts: ['Shift right 4', 'Shift down 4', 'Reflect over the y-axis'] },
        { g: 'g(x) = −f(x)', say: 'g of x equals negative f of x', ans: 'Reflect over the x-axis',
          alts: ['Reflect over the y-axis', 'Shift down 1', 'Shift up 1'] },
      ]
      const k = kinds[rint(0, kinds.length - 1)]
      return {
        promptText: `f is a graph. What does ${k.g} do to it?`,
        say: `${k.say}. What does that do to the graph of f?`,
        choices: textChoices([k.ans, ...k.alts]),
        answer: k.ans,
        sayAnswer: k.ans,
        explain: k.ans.startsWith('Reflect')
          ? `A minus in front, −f(x), flips every output's sign — a reflection over the x-axis.`
          : k.g.includes('(x') && (k.g.includes('− 2') || k.g.includes('+ 4'))
            ? `A change inside the parentheses shifts left/right — the opposite way to the sign. ${k.g} → ${k.ans}.`
            : `Adding or subtracting outside the function shifts it up or down. ${k.g} → ${k.ans}.`,
      }
    }
    // Range of a shifted/reflected square.
    const shift = rint(-3, 3)
    const flip = Math.random() < 0.35
    const base = `f(x) = ${flip ? '−' : ''}x²${shift === 0 ? '' : shift > 0 ? ` + ${shift}` : ` − ${Math.abs(shift)}`}`
    const ans = flip ? `y ≤ ${fmtInt(shift)}` : `y ≥ ${fmtInt(shift)}`
    const opp = flip ? `y ≥ ${fmtInt(shift)}` : `y ≤ ${fmtInt(shift)}`
    return {
      promptText: `What is the range of ${base}?`,
      say: `What is the range of ${flip ? 'negative ' : ''}x squared${shift === 0 ? '' : shift > 0 ? ` plus ${shift}` : ` minus ${Math.abs(shift)}`}?`,
      choices: textChoices([ans, opp, 'all real numbers', `y = ${fmtInt(shift)}`]),
      answer: ans,
      sayAnswer: ans,
      explain: flip
        ? `A downward parabola tops out at its vertex, so outputs are ${ans}.`
        : `x² is never negative, so the smallest output is at the vertex — the range is ${ans}.`,
    }
  }

  // d === 3 — composition & inverse.
  if (Math.random() < 0.5) {
    // Composition f(g(a)).
    const gAdd = rint(1, 4)
    const fMul = rint(2, 3)
    const a = rint(1, 4)
    const inner = a + gAdd            // g(a) = a + gAdd
    const ans = fMul * inner          // f(inner) = fMul·inner
    return {
      promptText: `f(x) = ${fMul}x, g(x) = x + ${gAdd}. What is f(g(${a}))?`,
      say: `f of x equals ${fMul} x. g of x equals x plus ${gAdd}. What is f of g of ${a}?`,
      choices: numChoices(ans, [ans + fMul, ans - fMul, fMul * a + gAdd]),
      answer: ans,
      sayAnswer: `${ans}`,
      explain: `Work inside-out: g(${a}) = ${a} + ${gAdd} = ${inner}, then f(${inner}) = ${fMul}·${inner} = ${ans}.`,
    }
  }
  // Inverse value: f(x) = m·x + b, find f⁻¹(y).
  const m = rint(2, 3)
  const b = rint(-3, 5)
  const x = rint(1, 5)
  const y = m * x + b               // so f⁻¹(y) = x
  return {
    promptText: `f(x) = ${m}x ${b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`}. What is f⁻¹(${fmtInt(y)})?`,
    say: `f of x equals ${m} x ${b >= 0 ? `plus ${b}` : `minus ${Math.abs(b)}`}. What is f inverse of ${spoken(y)}?`,
    choices: numChoices(x, [x + 1, x - 1, y]),
    answer: x,
    sayAnswer: `${x}`,
    explain: `f⁻¹ runs the rule backward: solve ${m}x ${b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`} = ${fmtInt(y)} → x = ${x}.`,
  }
}

// ── FunctionWatch: a narrated worked example (reused for re-teach) ──────────
// Text-forward, with an optional small CoordGrid curve when the round carries one.
export function FunctionWatch({
  lines, curve, onDone,
}: {
  lines: string[]; curve?: { fn: (x: number) => number; at: number; min: number; max: number }; onDone: () => void
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
            yRange={[curve.min, curve.max]}
            mode="read"
            curves={[{ kind: 'curve', fn: curve.fn }]}
            points={[{ x: curve.at, y: curve.fn(curve.at) }]}
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
function FunctionAsk({ prompt, say, choices, answer, onDone }: {
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

export default function FunctionToolkitTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'A function is a machine: an input goes in, one output comes out. Watch.', mood: 'happy',
      render: (d) => (
        <FunctionWatch
          lines={[
            'Take the rule f of x equals two x plus three.',
            'Feed in four: double it to eight, add three, and the output is eleven. So f of four equals eleven.',
          ]}
          curve={{ fn: (x) => 2 * x + 3, at: 4, min: -6, max: 12 }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Reshape the machine and the graph moves in step. Watch.', mood: 'happy',
      render: (d) => (
        <FunctionWatch
          lines={[
            'Adding outside, f of x plus three, lifts the whole graph up three.',
            'Changing the input, f of x minus two, slides it right two — the opposite way to the sign inside.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'You can also run a function backward, or feed one into another.', mood: 'thinking',
      render: (d) => (
        <FunctionWatch
          lines={[
            'Composition works inside-out: for f of g of three, first find g of three, then put that into f.',
            'The inverse undoes the rule: if f doubles and adds one, f inverse subtracts one and halves.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <FunctionAsk
          prompt="Given f(x) = 2x + 3, what is f(4)?"
          say="Given f of x equals two x plus three. What is f of four?"
          choices={[numChoice(11), numChoice(8), numChoice(14), numChoice(9)]}
          answer={11}
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Function Toolkit"
      steps={steps}
      finalSpeech={`Nice work, ${childName}. You can evaluate, reshape, and reverse a function. Let’s run the toolkit.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
