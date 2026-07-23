'use client'
/**
 * QuadraticAnalysisTeenLesson (17–18, "Field Lab") — the worked-example
 * walkthrough for the Quadratic Analysis module: vertex form, the discriminant,
 * roots, and standard-form vertex. Built on TeenLessonShell: a few narrated
 * "watch" steps, then a quick check. Exports the round generator + QuadraticWatch
 * so the practice chapter and its re-teach reuse them. Mirrors IntegersTeenLesson
 * in structure, in the 17–18 chrome.
 */
import React, { useEffect, useRef } from 'react'
import { speak, speakSeq } from '@/infra/useMiloSpeaker'
import type { LessonStep } from '@/features/chapters/lessons/_kit'
import type { AgeBand, Choice, Pt } from '@/features/chapters/teen/types'
import TeenLessonShell from '@/features/chapters/teen/TeenLessonShell'
import CoordGrid from '@/features/chapters/teen/CoordGrid'
import ChoiceGrid from '@/features/chapters/teen/ChoiceGrid'

const BAND: AgeBand = '17-18'

// ── shared helpers (reused by the practice chapter) ────────────────────────
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
/** Pretty integer: a real minus sign for negatives. */
export const fmtInt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
/** Spoken integer: "negative four". */
export const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
/** Coordinate pair as a labelled string, e.g. "(3, −2)". */
const coord = (h: number, k: number) => `(${fmtInt(h)}, ${fmtInt(k)})`
const toChoice = (v: string): Choice => ({ value: v, label: v })
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)

/** Build a 3–4 option MCQ from distractor strings, answer always included. */
function choicesFrom(answer: string, distractors: string[]): Choice[] {
  const set = new Set<string>([answer])
  for (const v of distractors) { if (set.size >= 4) break; if (v && v !== answer) set.add(v) }
  return shuffle([...set]).map(toChoice)
}

export interface Round {
  promptText: string
  say: string
  choices: Choice[]
  answer: string
  /** optional small parabola visual for the re-teach panel */
  curve?: { a: number; b: number; c: number; vertex: Pt; roots: number[] }
  explain: string   // re-teach line
}

const disc = (a: number, b: number, c: number) => b * b - 4 * a * c

/**
 * Difficulty-aware round generator.
 *   L1 — vertex form y=(x−h)²+k: vertex, axis of symmetry, opening direction.
 *   L2 — discriminant → number of real roots; roots of a factorable quadratic.
 *   L3 — standard-form vertex via x=−b/2a; discriminant<0 → complex roots.
 */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) {
    const a = Math.random() < 0.5 ? 1 : -1
    const h = rint(-4, 4)
    const k = rint(-4, 4)
    const aStr = a === 1 ? '' : '−'
    const eqn = `y = ${aStr}(x ${h < 0 ? '+' : '−'} ${Math.abs(h)})² ${k < 0 ? '−' : '+'} ${Math.abs(k)}`
    const kind = Math.random()
    if (kind < 0.34) {
      const answer = coord(h, k)
      return {
        promptText: `In ${eqn}, what is the vertex?`,
        say: `In this vertex form parabola, what is the vertex?`,
        choices: choicesFrom(answer, [coord(-h, k), coord(h, -k), coord(k, h)]),
        answer,
        explain: `In ${eqn} the vertex is ${answer} — h flips sign, k stays.`,
      }
    }
    if (kind < 0.67) {
      const answer = `x = ${fmtInt(h)}`
      return {
        promptText: `What is the axis of symmetry of ${eqn}?`,
        say: `What is the axis of symmetry?`,
        choices: choicesFrom(answer, [`x = ${fmtInt(-h)}`, `y = ${fmtInt(k)}`, `x = ${fmtInt(k)}`]),
        answer,
        explain: `The axis of symmetry runs through the vertex: x = ${fmtInt(h)}.`,
      }
    }
    const answer = a > 0 ? 'Opens up' : 'Opens down'
    return {
      promptText: `Does ${eqn} open up or down?`,
      say: `Does this parabola open up or down?`,
      choices: [toChoice('Opens up'), toChoice('Opens down')],
      answer,
      explain: `a is ${fmtInt(a)}, so the parabola ${a > 0 ? 'opens up' : 'opens down'}.`,
    }
  }

  if (d === 2) {
    if (Math.random() < 0.5) {
      // Discriminant → number of REAL roots.
      const a = rint(1, 3)
      const b = rint(-6, 6)
      const c = rint(-4, 6)
      const D = disc(a, b, c)
      const n = D > 0 ? 2 : D === 0 ? 1 : 0
      const answer = String(n)
      const eqn = `y = ${a === 1 ? '' : a}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`
      return {
        promptText: `${eqn}: how many REAL roots? (b²−4ac = ${fmtInt(D)})`,
        say: `The discriminant is ${spoken(D)}. How many real roots?`,
        choices: [toChoice('0'), toChoice('1'), toChoice('2')],
        answer,
        explain: `b²−4ac = ${fmtInt(D)}. ${D > 0 ? 'Positive → 2 real roots.' : D === 0 ? 'Zero → 1 real root.' : 'Negative → 0 real roots.'}`,
      }
    }
    // Roots of a factorable quadratic x² − (p+q)x + pq → "p and q".
    let p = rint(1, 6)
    let q = rint(1, 6)
    let guard = 0
    while (q === p && guard++ < 20) q = rint(1, 6)
    const lo = Math.min(p, q); const hi = Math.max(p, q)
    const sum = p + q; const prod = p * q
    const eqn = `x² − ${sum}x + ${prod}`
    const answer = `${lo} and ${hi}`
    return {
      promptText: `What are the roots of ${eqn} = 0?`,
      say: `What are the roots of this quadratic?`,
      choices: choicesFrom(answer, [`${lo} and ${hi + 1}`, `−${lo} and −${hi}`, `${lo + 1} and ${hi}`]),
      answer,
      explain: `${eqn} factors as (x − ${lo})(x − ${hi}), so the roots are ${lo} and ${hi}.`,
    }
  }

  // d === 3
  if (Math.random() < 0.5) {
    // Standard-form vertex: x = −b/2a (kept integer), then y.
    const a = Math.random() < 0.5 ? 1 : -1
    const vx = rint(-3, 3)
    const b = -2 * a * vx           // so −b/2a = vx exactly
    const c = rint(-4, 4)
    const vy = a * vx * vx + b * vx + c
    const answer = coord(vx, vy)
    const aStr = a === 1 ? '' : '−'
    const eqn = `y = ${aStr}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`
    return {
      promptText: `Find the vertex of ${eqn}.`,
      say: `Use x equals negative b over 2 a to find the vertex.`,
      choices: choicesFrom(answer, [coord(-vx, vy), coord(vx, -vy), coord(vy, vx)]),
      answer,
      curve: { a, b, c, vertex: { x: vx, y: vy }, roots: [] },
      explain: `x = −b/2a = ${fmtInt(vx)}, then y = ${fmtInt(vy)}, so the vertex is ${answer}.`,
    }
  }
  // Discriminant < 0 → complex roots.
  const a = rint(1, 2)
  let b = rint(-3, 3)
  let c = rint(2, 6)
  let guard = 0
  while (disc(a, b, c) >= 0 && guard++ < 40) { b = rint(-3, 3); c = rint(2, 6) }
  const D = disc(a, b, c)
  const answer = '2 complex roots (no real roots)'
  const eqn = `${a === 1 ? '' : a}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`
  return {
    promptText: `${eqn} = 0 has b²−4ac = ${fmtInt(D)}. What are its roots?`,
    say: `The discriminant is negative. What are the roots?`,
    choices: shuffle([
      answer,
      '2 distinct real roots',
      '1 repeated real root',
      'no roots at all',
    ]).map(toChoice),
    answer,
    explain: `b²−4ac = ${fmtInt(D)} is negative, so there are 2 complex roots — no real roots.`,
  }
}

// ── QuadraticWatch: a narrated worked example (reused for re-teach) ─────────
export function QuadraticWatch({
  lines, curve, onDone,
}: {
  lines: string[]; curve?: { a: number; b: number; c: number; vertex: Pt; roots: number[] }; onDone: () => void
}) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const cancel = speakSeq(lines, { onDone: () => window.setTimeout(() => doneRef.current(), 1200) })
    return cancel
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const rootPts: Pt[] = curve ? curve.roots.map((x) => ({ x, y: 0 })) : []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {curve && (
        <div style={{ width: '100%', maxWidth: 360 }}>
          <CoordGrid
            band={BAND}
            xRange={[-10, 10]}
            yRange={[-10, 10]}
            mode="read"
            curves={[{ kind: 'curve', fn: (x: number) => curve.a * x * x + curve.b * x + curve.c }]}
            points={[curve.vertex, ...rootPts].filter((p) => Math.abs(p.x) <= 10 && Math.abs(p.y) <= 10)}
            highlight={Math.abs(curve.vertex.x) <= 10 && Math.abs(curve.vertex.y) <= 10 ? curve.vertex : null}
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
function QuadraticAsk({ prompt, say, choices, answer, onDone }: {
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
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{prompt}</p>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <ChoiceGrid band={BAND} choices={choices} selected={selected} status={status} correctValue={answer} onPick={pick} columns={choices.length === 2 ? 2 : 2} />
      </div>
    </div>
  )
}

interface Props { band?: AgeBand; childName: string; onLessonComplete: () => void }

export default function QuadraticAnalysisTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'Vertex form hands you the turning point. Watch.', mood: 'happy',
      render: (d) => (
        <QuadraticWatch
          lines={[
            'Take y equals x minus three, squared, plus two.',
            'The vertex is three, two — h flips sign, k stays as it is. The axis of symmetry is x equals three.',
          ]}
          curve={{ a: 1, b: -6, c: 11, vertex: { x: 3, y: 2 }, roots: [] }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'The discriminant counts the real roots. Watch.', mood: 'thinking',
      render: (d) => (
        <QuadraticWatch
          lines={[
            'For x squared minus five x plus six, the discriminant b squared minus four a c is one.',
            'It is positive, so there are two real roots. It factors as x minus two, times x minus three — roots two and three.',
          ]}
          curve={{ a: 1, b: -5, c: 6, vertex: { x: 2.5, y: -0.25 }, roots: [2, 3] }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Standard form? Use x equals minus b over two a.', mood: 'thinking',
      render: (d) => (
        <QuadraticWatch
          lines={[
            'For y equals x squared minus four x plus one, x of the vertex is minus b over two a, which is two.',
            'Substitute back: y is minus three. So the vertex is two, minus three.',
          ]}
          curve={{ a: 1, b: -4, c: 1, vertex: { x: 2, y: -3 }, roots: [] }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <QuadraticAsk
          prompt="What is the vertex of y = (x − 1)² − 4?"
          say="What is the vertex of y equals x minus one, squared, minus four?"
          choices={[toChoice('(1, −4)'), toChoice('(−1, −4)'), toChoice('(1, 4)'), toChoice('(−1, 4)')]}
          answer="(1, −4)"
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Quadratic Analysis"
      steps={steps}
      finalSpeech={`Nice work, ${childName}. You can read a parabola's vertex, roots, and discriminant. Let’s analyze some curves.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
