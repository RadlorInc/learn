'use client'
/**
 * SystemsMatricesTeenLesson (17-18, "Field Lab") — the worked-example walkthrough
 * for the "Where Lines Meet" module: solving 2×2 systems, matrix add / scalar,
 * the 2×2 determinant, elimination, and a matrix product entry. Built on
 * TeenLessonShell. Exports the round generator (makeRound) + SystemsWatch so the
 * practice chapter and its re-teach reuse them. Mirrors IntegersTeenLesson, in
 * teen chrome. ALL answers are MCQ via ChoiceGrid (no free typing) — solution
 * pairs like "(2, 3)" are string choices.
 */
import React, { useEffect, useRef } from 'react'
import { speak, speakSeq } from '@/lib/useMiloSpeaker'
import type { LessonStep } from '@/components/lessons/_kit'
import type { AgeBand, Choice } from '@/components/teen/types'
import TeenLessonShell from '@/components/teen/TeenLessonShell'
import ChoiceGrid from '@/components/teen/ChoiceGrid'

const BAND: AgeBand = '17-18'

// ── shared helpers (reused by the practice chapter) ────────────────────────
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
/** Pretty integer: a real minus sign for negatives. */
export const fmtInt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
/** Spoken integer: "negative four". */
export const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
const nzint = (lo: number, hi: number) => { let v = 0; while (v === 0) v = rint(lo, hi); return v }
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)

const strChoice = (v: string): Choice => ({ value: v, label: v })
const numChoice = (v: number): Choice => ({ value: v, label: fmtInt(v) })

/** Build 4 distinct numeric choices around an answer. */
function numChoices(answer: number, distractors: number[]): Choice[] {
  const set = new Set<number>([answer])
  for (const v of distractors) { if (set.size >= 4) break; if (Number.isFinite(v)) set.add(v) }
  let guard = 0
  while (set.size < 4 && guard++ < 60) set.add(answer + nzint(-4, 4))
  return shuffle([...set]).map(numChoice)
}

/** Build 4 distinct string choices around a string answer. */
function strChoices(answer: string, distractors: string[]): Choice[] {
  const set = new Set<string>([answer])
  for (const v of distractors) { if (set.size >= 4) break; if (v) set.add(v) }
  return shuffle([...set]).map(strChoice)
}

const pairStr = (x: number, y: number) => `(${fmtInt(x)}, ${fmtInt(y)})`
const matStr = (a: number, b: number, c: number, d: number) =>
  `[[${a},${b}],[${c},${d}]]`

export interface Round {
  promptText: string
  say: string
  choices: Choice[]
  answer: string | number
  answerLabel: string  // spoken form of the answer for a wrong pick
  explain: string      // re-teach line
  kind: 'solve' | 'noSolution' | 'matrixAdd' | 'scalar' | 'determinant' | 'elimination' | 'product'
}

/**
 * Difficulty-aware round generator.
 *   L1 — solve a 2×2 system (pick the (x,y)); or parallel lines → "None".
 *   L2 — matrix add / scalar multiply (result or an entry); 2×2 determinant.
 *   L3 — elimination (harder solve); one entry of a 2×2 product AB.
 * Numbers stay clean with integer solutions.
 */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) return makeL1()
  if (d === 2) return makeL2()
  return makeL3()
}

// ── L1: solve a 2×2 system, or "how many solutions?" for parallel lines ─────
function makeL1(): Round {
  if (Math.random() < 0.32) {
    // Parallel lines → no solution.
    const m = nzint(-3, 3)
    const b1 = rint(-5, 5)
    let b2 = rint(-5, 5)
    while (b2 === b1) b2 = rint(-5, 5)
    const ans = 'None'
    return {
      promptText: `Lines y = ${slope(m)} ${signTerm(b1)} and y = ${slope(m)} ${signTerm(b2)} — how many solutions?`,
      say: 'Two lines with the same slope but different intercepts. How many solutions does the system have?',
      choices: strChoices(ans, ['One', 'Infinite', 'Two']),
      answer: ans,
      answerLabel: 'none — the lines are parallel',
      explain: 'Equal slopes with different intercepts means the lines are parallel — they never meet, so there is no solution.',
      kind: 'noSolution',
    }
  }
  // Pick the integer solution FIRST, then build two consistent equations.
  const x = rint(-4, 4)
  const y = rint(-4, 4)
  const [a1, b1] = coefPair()
  let [a2, b2] = coefPair()
  // Keep the two equations independent (not multiples).
  let guard = 0
  while (a1 * b2 - a2 * b1 === 0 && guard++ < 30) { [a2, b2] = coefPair() }
  const c1 = a1 * x + b1 * y
  const c2 = a2 * x + b2 * y
  const ans = pairStr(x, y)
  const distractors = [pairStr(y, x), pairStr(-x, y), pairStr(x, -y), pairStr(x + 1, y - 1)]
    .filter((s) => s !== ans)
  return {
    promptText: `Solve:  ${lin(a1, b1, c1)}  and  ${lin(a2, b2, c2)}.  Find (x, y).`,
    say: `Solve the system: ${linSay(a1, b1, c1)}, and ${linSay(a2, b2, c2)}. Find x and y.`,
    choices: strChoices(ans, distractors),
    answer: ans,
    answerLabel: `x equals ${spoken(x)}, y equals ${spoken(y)}`,
    explain: `Substituting x = ${fmtInt(x)} and y = ${fmtInt(y)} satisfies both equations, so the solution is ${ans}.`,
    kind: 'solve',
  }
}

// ── L2: matrix add / scalar multiply / 2×2 determinant ──────────────────────
function makeL2(): Round {
  const roll = Math.random()
  if (roll < 0.4) {
    // Matrix addition → ask for the whole result matrix.
    const A = mat(-6, 6)
    const B = mat(-6, 6)
    const R: [number, number, number, number] = [A[0] + B[0], A[1] + B[1], A[2] + B[2], A[3] + B[3]]
    const ans = matStr(...R)
    const distractors = [
      matStr(A[0] - B[0], A[1] - B[1], A[2] - B[2], A[3] - B[3]),
      matStr(R[0] + 1, R[1], R[2], R[3] - 1),
      matStr(R[3], R[2], R[1], R[0]),
    ]
    return {
      promptText: `${matDisp(A)} + ${matDisp(B)} = ?`,
      say: 'Add these two matrices. Add matching entries.',
      choices: strChoices(ans, distractors),
      answer: ans,
      answerLabel: `the matrix ${matSay(R)}`,
      explain: `Matrix addition is entry-by-entry: ${matStr(...R)}.`,
      kind: 'matrixAdd',
    }
  }
  if (roll < 0.72) {
    // Scalar multiply → ask for one entry.
    const k = rint(2, 4)
    const A = mat(-5, 5)
    const idx = rint(0, 3) as 0 | 1 | 2 | 3
    const ans = k * A[idx]
    return {
      promptText: `In ${fmtInt(k)}·${matDisp(A)}, what is the ${posName(idx)} entry?`,
      say: `Multiply the matrix by ${k}. What is the ${posName(idx)} entry?`,
      choices: numChoices(ans, [A[idx], ans + k, ans - k, k + A[idx]]),
      answer: ans,
      answerLabel: `${spoken(ans)}`,
      explain: `A scalar multiplies every entry, so the ${posName(idx)} entry is ${fmtInt(k)} × ${fmtInt(A[idx])} = ${fmtInt(ans)}.`,
      kind: 'scalar',
    }
  }
  // 2×2 determinant ad − bc.
  const A = mat(-5, 5)
  const [a, b, c, dd] = A
  const ans = a * dd - b * c
  return {
    promptText: `det ${matDisp(A)} = ?`,
    say: 'Find the determinant of this two by two matrix.',
    choices: numChoices(ans, [a * dd + b * c, b * c - a * dd, a * dd, ans + 2]),
    answer: ans,
    answerLabel: `${spoken(ans)}`,
    explain: `det[[a,b],[c,d]] = ad − bc = (${fmtInt(a)})(${fmtInt(dd)}) − (${fmtInt(b)})(${fmtInt(c)}) = ${fmtInt(ans)}.`,
    kind: 'determinant',
  }
}

// ── L3: harder solve by elimination · one entry of a product AB ─────────────
function makeL3(): Round {
  if (Math.random() < 0.5) {
    // Solve a slightly harder 2×2 by elimination.
    const x = rint(-5, 5)
    const y = rint(-5, 5)
    const a1 = nzint(2, 4), b1 = nzint(2, 4)
    let a2 = nzint(2, 5), b2 = nzint(-4, 4)
    let guard = 0
    while ((b2 === 0 || a1 * b2 - a2 * b1 === 0) && guard++ < 40) b2 = nzint(-4, 4)
    const c1 = a1 * x + b1 * y
    const c2 = a2 * x + b2 * y
    const ans = pairStr(x, y)
    const distractors = [pairStr(y, x), pairStr(-x, -y), pairStr(x - 1, y + 1)].filter((s) => s !== ans)
    return {
      promptText: `Solve by elimination:  ${lin(a1, b1, c1)}  and  ${lin(a2, b2, c2)}.  (x, y)?`,
      say: `Solve this system by elimination: ${linSay(a1, b1, c1)}, and ${linSay(a2, b2, c2)}.`,
      choices: strChoices(ans, distractors),
      answer: ans,
      answerLabel: `x equals ${spoken(x)}, y equals ${spoken(y)}`,
      explain: `Scale and subtract to eliminate a variable; you get x = ${fmtInt(x)}, y = ${fmtInt(y)}, i.e. ${ans}.`,
      kind: 'elimination',
    }
  }
  // One entry of a 2×2 product AB = dot(row i of A, col j of B).
  const A = mat(-4, 4)
  const B = mat(-4, 4)
  const i = rint(0, 1) as 0 | 1
  const j = rint(0, 1) as 0 | 1
  const row: [number, number] = [A[i * 2], A[i * 2 + 1]]
  const col: [number, number] = [B[j], B[j + 2]]
  const ans = row[0] * col[0] + row[1] * col[1]
  const posLabel = i === 0 && j === 0 ? 'top-left'
    : i === 0 && j === 1 ? 'top-right'
      : i === 1 && j === 0 ? 'bottom-left' : 'bottom-right'
  return {
    promptText: `For AB with A = ${matDisp(A)}, B = ${matDisp(B)}, what is the ${posLabel} entry?`,
    say: `Multiply matrix A by matrix B. What is the ${posLabel} entry of the product?`,
    choices: numChoices(ans, [row[0] * col[0] - row[1] * col[1], ans + 2, row[0] * col[1] + row[1] * col[0], ans - 3]),
    answer: ans,
    answerLabel: `${spoken(ans)}`,
    explain: `That entry is row ${i + 1} of A dotted with column ${j + 1} of B: (${fmtInt(row[0])})(${fmtInt(col[0])}) + (${fmtInt(row[1])})(${fmtInt(col[1])}) = ${fmtInt(ans)}.`,
    kind: 'product',
  }
}

// ── little formatting helpers ───────────────────────────────────────────────
function coefPair(): [number, number] { return [nzint(-3, 3), nzint(-3, 3)] }
function mat(lo: number, hi: number): [number, number, number, number] {
  return [rint(lo, hi), rint(lo, hi), rint(lo, hi), rint(lo, hi)]
}
function posName(idx: 0 | 1 | 2 | 3): string {
  return idx === 0 ? 'top-left' : idx === 1 ? 'top-right' : idx === 2 ? 'bottom-left' : 'bottom-right'
}
function slope(m: number): string { return m === 1 ? 'x' : m === -1 ? '−x' : `${fmtInt(m)}x` }
function signTerm(b: number): string { return b === 0 ? '' : b < 0 ? `− ${Math.abs(b)}` : `+ ${b}` }
/** "ax + by = c" with signs cleaned up. */
function lin(a: number, b: number, c: number): string {
  const aPart = a === 1 ? 'x' : a === -1 ? '−x' : `${fmtInt(a)}x`
  const bPart = b === 1 ? 'y' : b === -1 ? '−y' : `${fmtInt(Math.abs(b))}y`
  const join = b < 0 ? '−' : '+'
  return `${aPart} ${join} ${bPart} = ${fmtInt(c)}`
}
function linSay(a: number, b: number, c: number): string {
  const join = b < 0 ? 'minus' : 'plus'
  return `${spoken(a)} x ${join} ${spoken(Math.abs(b))} y equals ${spoken(c)}`
}
function matDisp(m: [number, number, number, number]): string {
  return `[ ${fmtInt(m[0])} ${fmtInt(m[1])} ; ${fmtInt(m[2])} ${fmtInt(m[3])} ]`
}
function matSay(m: [number, number, number, number]): string {
  return `${fmtInt(m[0])}, ${fmtInt(m[1])}, ${fmtInt(m[2])}, ${fmtInt(m[3])}`
}

// ── SystemsWatch: a narrated worked example (reused for re-teach) ────────────
export function SystemsWatch({ lines, onDone }: { lines: string[]; onDone: () => void }) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const cancel = speakSeq(lines, { onDone: () => window.setTimeout(() => doneRef.current(), 1200) })
    return cancel
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 22, fontWeight: 700, color: 'var(--accent)', textAlign: 'center' }}>
        y = mx + b
      </div>
      <p style={{ margin: 0, maxWidth: 520, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        {lines[lines.length - 1]}
      </p>
    </div>
  )
}

// A one-question check inside the lesson (retry allowed, no penalty).
function SystemsAsk({ prompt, say, choices, answer, onDone }: {
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
        <ChoiceGrid band={BAND} choices={choices} selected={selected} status={status} onPick={pick} columns={2} />
      </div>
    </div>
  )
}

interface Props { band?: AgeBand; childName: string; onLessonComplete: () => void }

export default function SystemsMatricesTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'A system is two conditions at once. Its solution is where the two lines cross. Watch.', mood: 'happy',
      render: (d) => (
        <SystemsWatch
          lines={[
            'Take two lines, each a condition on x and y.',
            'The one point that satisfies both is where they intersect — that ordered pair is the solution.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Same slope, different intercept? They never meet.', mood: 'thinking',
      render: (d) => (
        <SystemsWatch
          lines={[
            'If two lines share a slope but have different intercepts, they are parallel.',
            'Parallel lines never cross, so the system has no solution.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Matrices bundle numbers into a grid — and det measures them.', mood: 'thinking',
      render: (d) => (
        <SystemsWatch
          lines={[
            'A two by two matrix is four numbers in a grid; you add matching entries and a scalar multiplies every entry.',
            'The determinant of [[a,b],[c,d]] is a d minus b c.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <SystemsAsk
          prompt="det [[3, 2], [1, 4]] = ?"
          say="What is the determinant of the matrix with rows three, two and one, four?"
          choices={[numChoice(10), numChoice(14), numChoice(11), numChoice(2)]}
          answer={10}
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Systems & Matrices"
      steps={steps}
      finalSpeech={`Good work, ${childName}. You can solve systems and compute with matrices. Let’s put it to work.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
