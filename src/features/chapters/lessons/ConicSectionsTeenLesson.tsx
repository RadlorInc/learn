'use client'
/**
 * ConicSectionsTeenLesson (17–18, "Field Lab") — the worked-example walkthrough
 * for the Conic Sections module: slice a cone into circles, ellipses, parabolas
 * and hyperbolas; read a circle's center & radius; identify a conic from its
 * equation form; and read parabola/ellipse features. Built on TeenLessonShell:
 * a few narrated "watch" steps then a quick check. Exports the round generator +
 * ConicWatch so the practice chapter and its re-teach reuse them. Mirrors
 * FunctionToolkitTeenLesson / IntegersTeenLesson, in teen chrome.
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
const numChoice = (v: number): Choice => ({ value: v, label: fmtInt(v) })
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)

/** A center-point label like "(2, −3)" — used as a STRING choice value. */
const centerLabel = (h: number, k: number) => `(${fmtInt(h)}, ${fmtInt(k)})`
const centerSpoken = (h: number, k: number) => `${spoken(h)}, ${spoken(k)}`

/** Build 4 distinct numeric choices around a numeric answer. */
function numChoices(answer: number, distractors: number[]): Choice[] {
  const set = new Set<number>([answer])
  for (const v of distractors) { if (set.size >= 4) break; if (Number.isFinite(v) && v > 0) set.add(v) }
  let guard = 0
  while (set.size < 4 && guard++ < 60) set.add(Math.max(1, answer + rint(-3, 4)))
  return shuffle([...set]).map(numChoice)
}

/** Build text/string choices; `answer` must be one of `all`. */
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
  /** Optional worked conic for the re-teach visual (a circle/ellipse). */
  conic?: { kind: 'circle' | 'ellipse'; h: number; k: number; a: number; b: number }
  explain: string   // re-teach line
}

/**
 * Difficulty-aware round generator:
 *   L1 — circle center & radius from (x−h)² + (y−k)² = r².
 *   L2 — identify the conic TYPE from the equation form.
 *   L3 — parabola direction/vertex, ellipse major-axis orientation, feature read.
 */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) {
    // Circle: center (h,k) [watch sign] and radius r.
    const h = rint(-4, 4)
    const k = rint(-4, 4)
    const r = rint(2, 6)
    const eqn = `(x ${h >= 0 ? `− ${h}` : `+ ${Math.abs(h)}`})² + (y ${k >= 0 ? `− ${k}` : `+ ${Math.abs(k)}`})² = ${r * r}`
    if (Math.random() < 0.5) {
      // Ask for the center — the sign flip is the trap.
      const ans = centerLabel(h, k)
      const alts = [
        centerLabel(-h, -k),          // forgot to flip
        centerLabel(h, -k),
        centerLabel(-h, k),
      ]
      return {
        promptText: `${eqn}. What is the center?`,
        say: `A circle has equation ${eqn.replace('²', ' squared').replace('²', ' squared')}. What is its center?`,
        choices: textChoices([ans, ...alts]),
        answer: ans,
        sayAnswer: centerSpoken(h, k),
        conic: { kind: 'circle', h, k, a: r, b: r },
        explain: `In (x − h)² + (y − k)² = r², the center is (h, k) — flip the signs inside: (${fmtInt(h)}, ${fmtInt(k)}).`,
      }
    }
    // Ask for the radius (given r² on the right).
    return {
      promptText: `${eqn}. What is the radius?`,
      say: `A circle has equation ${eqn.replace('²', ' squared').replace('²', ' squared')}. What is its radius?`,
      choices: numChoices(r, [r * r, r + 1, r - 1]),
      answer: r,
      sayAnswer: `${r}`,
      conic: { kind: 'circle', h, k, a: r, b: r },
      explain: `The right side is r², so r² = ${r * r} and the radius r = ${r}.`,
    }
  }

  if (d === 2) {
    // Identify the conic TYPE from the equation form.
    const forms = [
      { eqn: 'x² + y² = 25', say: 'x squared plus y squared equals twenty five', ans: 'Circle' },
      { eqn: 'x²/9 + y²/4 = 1', say: 'x squared over nine plus y squared over four equals one', ans: 'Ellipse' },
      { eqn: 'x²/16 − y²/9 = 1', say: 'x squared over sixteen minus y squared over nine equals one', ans: 'Hyperbola' },
      { eqn: 'x² − y² = 1', say: 'x squared minus y squared equals one', ans: 'Hyperbola' },
      { eqn: 'y = 2x²', say: 'y equals two x squared', ans: 'Parabola' },
      { eqn: 'x = 3y²', say: 'x equals three y squared', ans: 'Parabola' },
      { eqn: 'x²/25 + y²/25 = 1', say: 'x squared over twenty five plus y squared over twenty five equals one', ans: 'Circle' },
    ]
    const f = forms[rint(0, forms.length - 1)]
    return {
      promptText: `Which conic is ${f.eqn}?`,
      say: `Which conic section is ${f.say}?`,
      choices: textChoices(['Circle', 'Ellipse', 'Parabola', 'Hyperbola']),
      answer: f.ans,
      sayAnswer: f.ans,
      explain: f.ans === 'Circle'
        ? `Both squares are added with equal coefficients — that's a circle.`
        : f.ans === 'Ellipse'
          ? `Both squares are added but with different denominators — that's an ellipse.`
          : f.ans === 'Hyperbola'
            ? `The two squares are subtracted — a minus sign between them means a hyperbola.`
            : `Only one variable is squared — a single square means a parabola.`,
    }
  }

  // d === 3 — parabola direction/vertex, ellipse orientation, feature read.
  const roll = Math.random()
  if (roll < 0.34) {
    // Parabola direction from y = a(x − h)² + k.
    const a = (Math.random() < 0.5 ? 1 : -1) * rint(1, 3)
    const h = rint(-3, 3)
    const k = rint(-3, 3)
    const eqn = `y = ${a === 1 ? '' : a === -1 ? '−' : fmtInt(a)}(x ${h >= 0 ? `− ${h}` : `+ ${Math.abs(h)}`})² ${k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`}`
    const ans = a > 0 ? 'Opens up' : 'Opens down'
    return {
      promptText: `${eqn}. Which way does it open?`,
      say: `A parabola is ${eqn.replace('²', ' squared')}. Which way does it open?`,
      choices: textChoices(['Opens up', 'Opens down', 'Opens left', 'Opens right']),
      answer: ans,
      sayAnswer: ans,
      explain: `In y = a(x − h)² + k, a positive a opens up and a negative a opens down. Here a = ${fmtInt(a)}, so it ${ans.toLowerCase()}.`,
    }
  }
  if (roll < 0.67) {
    // Parabola vertex from y = a(x − h)² + k.
    const h = rint(-4, 4)
    const k = rint(-4, 4)
    const eqn = `y = (x ${h >= 0 ? `− ${h}` : `+ ${Math.abs(h)}`})² ${k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`}`
    const ans = centerLabel(h, k)
    return {
      promptText: `${eqn}. What is the vertex?`,
      say: `A parabola is ${eqn.replace('²', ' squared')}. What is its vertex?`,
      choices: textChoices([ans, centerLabel(-h, k), centerLabel(h, -k), centerLabel(-h, -k)]),
      answer: ans,
      sayAnswer: centerSpoken(h, k),
      explain: `Vertex form y = (x − h)² + k has vertex (h, k): flip the sign inside, keep k. Here (${fmtInt(h)}, ${fmtInt(k)}).`,
    }
  }
  // Ellipse major-axis orientation (bigger denominator wins).
  const bigX = Math.random() < 0.5
  const aa = rint(3, 8)          // sqrt of the larger denominator
  const bb = rint(1, aa - 1)     // sqrt of the smaller denominator
  const dxDen = bigX ? aa * aa : bb * bb
  const dyDen = bigX ? bb * bb : aa * aa
  const eqn = `x²/${dxDen} + y²/${dyDen} = 1`
  const ans = bigX ? 'Horizontal' : 'Vertical'
  return {
    promptText: `${eqn}. Is the major axis horizontal or vertical?`,
    say: `An ellipse is ${eqn.replace('²', ' squared')}. Is the major axis horizontal or vertical?`,
    choices: textChoices(['Horizontal', 'Vertical']),
    answer: ans,
    sayAnswer: ans,
    conic: { kind: 'ellipse', h: 0, k: 0, a: bigX ? aa : bb, b: bigX ? bb : aa },
    explain: `The larger denominator sits under ${bigX ? 'x²' : 'y²'} (${Math.max(dxDen, dyDen)}), so the major axis is ${ans.toLowerCase()}.`,
  }
}

// ── ConicWatch: a narrated worked example (reused for re-teach) ─────────────
// Text-forward, with an optional small conic drawn on CoordGrid.
export function ConicWatch({
  lines, conic, onDone,
}: {
  lines: string[]; conic?: { kind: 'circle' | 'ellipse'; h: number; k: number; a: number; b: number }; onDone: () => void
}) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const cancel = speakSeq(lines, { onDone: () => window.setTimeout(() => doneRef.current(), 1200) })
    return cancel
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sample the conic as an upper + lower half so CoordGrid can polyline it.
  const span = conic ? Math.max(conic.a, conic.b) + Math.max(Math.abs(conic.h), Math.abs(conic.k)) + 1 : 8
  const upper = conic ? (x: number) => {
    const t = 1 - ((x - conic.h) / conic.a) ** 2
    return t < 0 ? NaN : conic.k + conic.b * Math.sqrt(t)
  } : undefined
  const lower = conic ? (x: number) => {
    const t = 1 - ((x - conic.h) / conic.a) ** 2
    return t < 0 ? NaN : conic.k - conic.b * Math.sqrt(t)
  } : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {conic && upper && lower && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <CoordGrid
            band={BAND}
            xRange={[-span, span]}
            yRange={[-span, span]}
            mode="read"
            curves={[{ kind: 'curve', fn: upper }, { kind: 'curve', fn: lower }]}
            points={[{ x: conic.h, y: conic.k }]}
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
function ConicAsk({ prompt, say, choices, answer, onDone }: {
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
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}>{prompt}</p>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <ChoiceGrid band={BAND} choices={choices} selected={selected} status={status} correctValue={answer} onPick={pick} columns={2} />
      </div>
    </div>
  )
}

interface Props { band?: AgeBand; childName: string; onLessonComplete: () => void }

export default function ConicSectionsTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'Slice a cone at different angles and you get four curves. Watch.', mood: 'happy',
      render: (d) => (
        <ConicWatch
          lines={[
            'Cut straight across a cone and you get a circle.',
            'Tilt the cut and the circle stretches into an ellipse — one family of curves from one cone.',
          ]}
          conic={{ kind: 'ellipse', h: 0, k: 0, a: 5, b: 3 }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'A circle equation hands you its center and radius. Watch.', mood: 'thinking',
      render: (d) => (
        <ConicWatch
          lines={[
            'Take (x − 2) squared plus (y + 3) squared equals sixteen.',
            'The center is (2, negative 3) — flip the signs inside — and the radius is the square root of sixteen, four.',
          ]}
          conic={{ kind: 'circle', h: 2, k: -3, a: 4, b: 4 }}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'The equation form tells you which conic it is.', mood: 'thinking',
      render: (d) => (
        <ConicWatch
          lines={[
            'Two squares added with the same coefficient is a circle; added with different ones, an ellipse.',
            'Two squares subtracted is a hyperbola; only one variable squared is a parabola.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <ConicAsk
          prompt="(x − 2)² + (y + 3)² = 16. What is the center?"
          say="A circle is x minus two squared plus y plus three squared equals sixteen. What is its center?"
          choices={textChoices(['(2, −3)', '(−2, 3)', '(2, 3)', '(−2, −3)'])}
          answer="(2, −3)"
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Conic Sections"
      steps={steps}
      finalSpeech={`Nice work, ${childName}. You can identify a conic, read a circle, and pick out parabola and ellipse features. Let’s slice the cone.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
