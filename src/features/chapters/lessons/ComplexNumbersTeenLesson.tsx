'use client'
/**
 * ComplexNumbersTeenLesson (17–18, "Field Lab") — the worked-example walkthrough
 * for the Complex Numbers module: the imaginary unit i and its powers, adding &
 * subtracting, multiplying with i² = −1, and the modulus on the complex plane.
 * Built on TeenLessonShell: a few narrated "watch" steps then a quick check.
 * Exports the round generator + ComplexWatch so the practice chapter and its
 * re-teach reuse them. Mirrors FunctionToolkitTeenLesson, in teen chrome.
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
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)

/** Format a complex number a + bi with true minus glyphs. e.g. "3 − 5i", "−2i", "4". */
export function fmtComplex(a: number, b: number): string {
  if (b === 0) return fmtInt(a)
  const iPart = b === 1 ? 'i' : b === -1 ? '−i' : `${fmtInt(b)}i`
  if (a === 0) return iPart
  const sign = b < 0 ? '−' : '+'
  const mag = Math.abs(b)
  const bTerm = mag === 1 ? 'i' : `${mag}i`
  return `${fmtInt(a)} ${sign} ${bTerm}`
}

/** Spoken complex number. */
function spokenComplex(a: number, b: number): string {
  if (b === 0) return spoken(a)
  const iWord = (n: number) => (Math.abs(n) === 1 ? 'i' : `${Math.abs(n)} i`)
  if (a === 0) return `${b < 0 ? 'negative ' : ''}${iWord(b)}`
  return `${spoken(a)} ${b < 0 ? 'minus' : 'plus'} ${iWord(b)}`
}

/** Build text choices from a set (answer must be included in `all`). */
function textChoices(all: string[]): Choice[] {
  return shuffle([...new Set(all)]).map((s) => ({ value: s, label: s }))
}

/** Powers of i cycle with period 4: i⁰=1, i¹=i, i²=−1, i³=−i. */
const I_POWERS = ['1', 'i', '−1', '−i']
const iPower = (n: number) => I_POWERS[((n % 4) + 4) % 4]

export interface Round {
  promptText: string
  say: string
  choices: Choice[]
  answer: string | number
  /** Spoken form of the answer (for the wrong-answer read-out). */
  sayAnswer?: string
  /** Optional point on the complex plane for the re-teach visual. */
  plane?: { point: Pt; range: number }
  explain: string   // re-teach line
}

/** Difficulty-aware round generator: L1 powers of i + add/subtract · L2 multiply + modulus · L3 conjugate + iⁿ + harder product. */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) {
    if (Math.random() < 0.5) {
      // Power of i (small exponent 2..5).
      const n = rint(2, 5)
      const ans = iPower(n)
      return {
        promptText: `What is i${supers(n)}?`,
        say: `What is i to the power ${n}?`,
        choices: textChoices(['1', 'i', '−1', '−i']),
        answer: ans,
        sayAnswer: sayPow(ans),
        explain: `Powers of i cycle every four: i² = −1, i³ = −i, i⁴ = 1. So i${supers(n)} = ${ans}.`,
      }
    }
    // Add or subtract two complex numbers.
    const a1 = rint(-4, 6), b1 = rint(-4, 6)
    const a2 = rint(-4, 6), b2 = rint(-4, 6)
    const sub = Math.random() < 0.5
    const ra = sub ? a1 - a2 : a1 + a2
    const rb = sub ? b1 - b2 : b1 + b2
    const ans = fmtComplex(ra, rb)
    const op = sub ? '−' : '+'
    const opWord = sub ? 'minus' : 'plus'
    const distract = [
      fmtComplex(sub ? a1 + a2 : a1 - a2, rb),
      fmtComplex(ra, sub ? b1 + b2 : b1 - b2),
      fmtComplex(ra + 1, rb),
      fmtComplex(ra, rb - 1),
    ]
    return {
      promptText: `(${fmtComplex(a1, b1)}) ${op} (${fmtComplex(a2, b2)}) = ?`,
      say: `${spokenComplex(a1, b1)}, ${opWord}, ${spokenComplex(a2, b2)}.`,
      choices: guarantee(ans, textChoices([ans, ...distract]).slice(0, 4)),
      answer: ans,
      sayAnswer: spokenComplex(ra, rb),
      explain: `Add real parts and imaginary parts separately: (${fmtInt(a1)} ${op} ${fmtInt(a2)}) + (${fmtInt(b1)} ${op} ${fmtInt(b2)})i = ${ans}.`,
    }
  }

  if (d === 2) {
    if (Math.random() < 0.5) {
      // Multiply two complex numbers using i² = −1.
      const a1 = rint(1, 3), b1 = rint(1, 3)
      const a2 = rint(1, 3), b2 = rint(1, 3)
      // (a1 + b1 i)(a2 + b2 i) = (a1 a2 − b1 b2) + (a1 b2 + a2 b1) i
      const ra = a1 * a2 - b1 * b2
      const rb = a1 * b2 + a2 * b1
      const ans = fmtComplex(ra, rb)
      const foilNoI2 = fmtComplex(a1 * a2 + b1 * b2, rb) // forgot i² = −1
      const distract = [foilNoI2, fmtComplex(ra, a1 * b2 - a2 * b1), fmtComplex(ra + 1, rb), fmtComplex(ra, rb + 1)]
      return {
        promptText: `(${fmtComplex(a1, b1)})(${fmtComplex(a2, b2)}) = ?`,
        say: `${spokenComplex(a1, b1)}, times, ${spokenComplex(a2, b2)}.`,
        choices: guarantee(ans, textChoices([ans, ...distract]).slice(0, 4)),
        answer: ans,
        sayAnswer: spokenComplex(ra, rb),
        explain: `FOIL, then use i² = −1: real part ${a1}·${a2} − ${b1}·${b2} = ${fmtInt(ra)}, imaginary part ${a1}·${b2} + ${a2}·${b1} = ${fmtInt(rb)}. So ${ans}.`,
      }
    }
    // Modulus |a + bi| for a clean value (Pythagorean-ish pairs).
    const pairs: [number, number][] = [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [3, 0], [0, 4]]
    const [pa, pb] = pairs[rint(0, pairs.length - 1)]
    const a = Math.random() < 0.5 ? pa : -pa
    const b = Math.random() < 0.5 ? pb : -pb
    const ans = Math.round(Math.sqrt(a * a + b * b))
    return {
      promptText: `What is |${fmtComplex(a, b)}|?`,
      say: `What is the modulus of ${spokenComplex(a, b)}?`,
      choices: numChoices(ans, [Math.abs(a) + Math.abs(b), ans + 1, ans - 1, Math.abs(a)]),
      answer: ans,
      sayAnswer: `${ans}`,
      plane: { point: { x: a, y: b }, range: Math.max(Math.abs(a), Math.abs(b)) + 2 },
      explain: `The modulus is the distance from the origin: |a + bi| = √(a² + b²) = √(${a * a} + ${b * b}) = ${ans}.`,
    }
  }

  // d === 3 — conjugate · iⁿ for larger n · a harder product.
  const roll = Math.random()
  if (roll < 0.34) {
    // Conjugate of a + bi.
    let a = rint(-6, 6), b = rint(-6, 6)
    if (b === 0) b = rint(1, 6)
    const ans = fmtComplex(a, -b)
    const distract = [fmtComplex(-a, b), fmtComplex(-a, -b), fmtComplex(a, b), fmtComplex(b, a)]
    return {
      promptText: `What is the conjugate of ${fmtComplex(a, b)}?`,
      say: `What is the conjugate of ${spokenComplex(a, b)}?`,
      choices: guarantee(ans, textChoices([ans, ...distract]).slice(0, 4)),
      answer: ans,
      sayAnswer: spokenComplex(a, -b),
      explain: `The conjugate flips the sign of the imaginary part only: the conjugate of ${fmtComplex(a, b)} is ${ans}.`,
    }
  }
  if (roll < 0.67) {
    // Larger power of i — reduce mod 4.
    const n = rint(6, 23)
    const ans = iPower(n)
    return {
      promptText: `What is i${supers(n)}?`,
      say: `What is i to the power ${n}?`,
      choices: textChoices(['1', 'i', '−1', '−i']),
      answer: ans,
      sayAnswer: sayPow(ans),
      explain: `Reduce the exponent mod 4: ${n} ÷ 4 leaves remainder ${((n % 4) + 4) % 4}, so i${supers(n)} = i${supers(((n % 4) + 4) % 4)} = ${ans}.`,
    }
  }
  // A slightly harder product: (a + bi)(c + di) with a zero real part option.
  const a1 = rint(1, 4), b1 = rint(-4, -1)
  const a2 = rint(-4, -1), b2 = rint(1, 4)
  const ra = a1 * a2 - b1 * b2
  const rb = a1 * b2 + a2 * b1
  const ans = fmtComplex(ra, rb)
  const foilNoI2 = fmtComplex(a1 * a2 + b1 * b2, rb)
  const distract = [foilNoI2, fmtComplex(ra, a1 * b2 - a2 * b1), fmtComplex(-ra, rb), fmtComplex(ra, rb + 1)]
  return {
    promptText: `(${fmtComplex(a1, b1)})(${fmtComplex(a2, b2)}) = ?`,
    say: `${spokenComplex(a1, b1)}, times, ${spokenComplex(a2, b2)}.`,
    choices: guarantee(ans, textChoices([ans, ...distract]).slice(0, 4)),
    answer: ans,
    sayAnswer: spokenComplex(ra, rb),
    explain: `FOIL and use i² = −1: real part ${a1}·(${a2}) − (${b1})·(${b2}) = ${fmtInt(ra)}, imaginary part ${a1}·${b2} + (${a2})·(${b1}) = ${fmtInt(rb)}. So ${ans}.`,
  }
}

// ── small local helpers ────────────────────────────────────────────────────
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
const supers = (n: number) => String(n).split('').map((c) => SUP[c] ?? c).join('')
const sayPow = (label: string) => (label === '−1' ? 'negative one' : label === '−i' ? 'negative i' : label === '1' ? 'one' : 'i')
const numChoice = (v: number): Choice => ({ value: v, label: fmtInt(v) })
function numChoices(answer: number, distractors: number[]): Choice[] {
  const set = new Set<number>([answer])
  for (const v of distractors) { if (set.size >= 4) break; if (Number.isFinite(v) && v >= 0) set.add(v) }
  let guard = 0
  while (set.size < 4 && guard++ < 60) set.add(answer + rint(1, 5))
  return shuffle([...set]).map(numChoice)
}
/** Make sure the answer text is present among the choices. */
function guarantee(answer: string, choices: Choice[]): Choice[] {
  if (choices.some((c) => c.value === answer)) return choices
  return [{ value: answer, label: answer }, ...choices.slice(0, 3)]
}

// ── ComplexWatch: a narrated worked example (reused for re-teach) ───────────
// Text-forward, with an optional small complex-plane point when the round carries one.
export function ComplexWatch({
  lines, plane, onDone,
}: {
  lines: string[]; plane?: { point: Pt; range: number }; onDone: () => void
}) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const cancel = speakSeq(lines, { onDone: () => window.setTimeout(() => doneRef.current(), 1200) })
    return cancel
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const r = plane?.range ?? 6
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {plane && (
        <div style={{ width: '100%', maxWidth: 300 }}>
          <CoordGrid
            band={BAND}
            xRange={[-r, r]}
            yRange={[-r, r]}
            mode="read"
            variant="complex"
            points={[plane.point]}
            highlight={plane.point}
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
function ComplexAsk({ prompt, say, choices, answer, onDone }: {
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
        <ChoiceGrid band={BAND} choices={choices} selected={selected} status={status} correctValue={answer} onPick={pick} columns={2} mono={false} />
      </div>
    </div>
  )
}

interface Props { band?: AgeBand; childName: string; onLessonComplete: () => void }

export default function ComplexNumbersTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'When a square root goes negative, we invent a new number. Watch.', mood: 'happy',
      render: (d) => (
        <ComplexWatch
          lines={[
            'The imaginary unit i is defined so that i squared equals negative one.',
            'That means i cubed is negative i, and i to the fourth is one — the powers of i cycle every four.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Add and subtract by keeping the two parts separate. Watch.', mood: 'happy',
      render: (d) => (
        <ComplexWatch
          lines={[
            'A complex number has a real part and an imaginary part.',
            'To add two plus three i and one minus i, add the real parts and the imaginary parts: three plus two i.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Multiply with FOIL, then measure on the plane. Watch.', mood: 'thinking',
      render: (d) => (
        <ComplexWatch
          lines={[
            'Multiply like binomials, then replace i squared with negative one.',
            'On the complex plane a plus b i is the point a, b, and its modulus is its distance from the origin: the square root of three squared plus four squared is five.',
          ]}
          plane={{ point: { x: 3, y: 4 }, range: 6 }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <ComplexAsk
          prompt="(2 + 3i) + (1 − i) = ?"
          say="Two plus three i, plus, one minus i."
          choices={textChoices(['3 + 2i', '3 + 4i', '1 + 2i', '3 − 2i'])}
          answer="3 + 2i"
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Complex Numbers"
      steps={steps}
      finalSpeech={`Nice work, ${childName}. You can use i, combine complex numbers, and measure them on the plane. Let’s run the module.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
