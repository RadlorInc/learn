'use client'
/**
 * UnitCircleTrigTeenLesson (17–18, "Field Lab") — the worked-example walkthrough
 * for Unit Circle & Trigonometry: angle ↔ radian, sine & cosine as the (x, y)
 * coordinate of a point on the unit circle, the special angles, and the signs by
 * quadrant. Built on TeenLessonShell: a few narrated "watch" steps over a small
 * unit circle, then a quick check. Exports the round generator + UnitCircleWatch
 * so the practice chapter and its re-teach reuse them. Mirrors
 * FunctionToolkitTeenLesson / IntegersTeenLesson, in teen chrome.
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
const strChoice = (s: string): Choice => ({ value: s, label: s })

/** Build text choices; `answer` must be one of `all`. */
function textChoices(all: string[]): Choice[] {
  return shuffle([...new Set(all)]).map(strChoice)
}

export interface Round {
  promptText: string
  say: string
  choices: Choice[]
  answer: string
  /** Spoken form of the answer (for the wrong-answer read-out). */
  sayAnswer?: string
  /** Optional angle (degrees) to draw on the small unit circle in the re-teach. */
  angleDeg?: number
  explain: string   // re-teach line
}

// ── reference data for the special angles ──────────────────────────────────
// coordinate string (cos, sin) per common angle, exact-value form.
const COORD: Record<number, string> = {
  0: '(1, 0)',
  30: '(√3/2, 1/2)',
  45: '(√2/2, √2/2)',
  60: '(1/2, √3/2)',
  90: '(0, 1)',
  120: '(−1/2, √3/2)',
  135: '(−√2/2, √2/2)',
  150: '(−√3/2, 1/2)',
  180: '(−1, 0)',
  210: '(−√3/2, −1/2)',
  225: '(−√2/2, −√2/2)',
  240: '(−1/2, −√3/2)',
  270: '(0, −1)',
  300: '(1/2, −√3/2)',
  315: '(√2/2, −√2/2)',
  330: '(√3/2, −1/2)',
}

const RAD: Record<number, string> = {
  0: '0', 45: 'π/4', 90: 'π/2', 135: '3π/4', 180: 'π',
  225: '5π/4', 270: '3π/2', 315: '7π/4', 360: '2π',
}

/** Reference angle (0–90) for an angle in degrees. */
function refAngle(deg: number): number {
  const a = ((deg % 360) + 360) % 360
  if (a <= 90) return a
  if (a <= 180) return 180 - a
  if (a <= 270) return a - 180
  return 360 - a
}

function spokenCoord(s: string) {
  return s
    .replace(/√3\/2/g, 'root three over two')
    .replace(/√2\/2/g, 'root two over two')
    .replace(/1\/2/g, 'one half')
    .replace(/−/g, 'negative ')
}

/** Difficulty-aware round generator: L1 deg↔rad + axis sin/cos · L2 coords + reference angle · L3 signs by quadrant + coords. */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) {
    if (Math.random() < 0.5) {
      // Degrees ↔ radians for a common angle.
      const degs = [90, 180, 270, 360, 45]
      const deg = degs[rint(0, degs.length - 1)]
      const ans = RAD[deg]
      const pool = ['π', 'π/2', 'π/4', '2π', '3π/2', '3π/4']
      return {
        promptText: `${deg}° in radians is…`,
        say: `${deg} degrees in radians is what?`,
        choices: textChoices([ans, ...pool.filter((p) => p !== ans)].slice(0, 4)),
        answer: ans,
        sayAnswer: ans.replace('π', ' pi'),
        angleDeg: deg % 360,
        explain: `A full turn is 360° = 2π, so ${deg}° = ${ans} radians.`,
      }
    }
    // sin/cos of a quadrantal angle (value 0, 1, or −1).
    const angles = [0, 90, 180, 270]
    const deg = angles[rint(0, angles.length - 1)]
    const useSin = Math.random() < 0.5
    const [cx, cy] = { 0: [1, 0], 90: [0, 1], 180: [-1, 0], 270: [0, -1] }[deg] as [number, number]
    const val = useSin ? cy : cx
    const fmt = (n: number) => (n < 0 ? '−1' : String(n))
    const ans = fmt(val)
    return {
      promptText: `${useSin ? 'sin' : 'cos'} ${deg}° = ?`,
      say: `What is ${useSin ? 'sine' : 'cosine'} of ${deg} degrees?`,
      choices: textChoices(['1', '0', '−1', '1/2']),
      answer: ans,
      sayAnswer: ans === '−1' ? 'negative one' : ans,
      angleDeg: deg,
      explain: `On the unit circle, ${useSin ? 'sine is the y-coordinate' : 'cosine is the x-coordinate'}. At ${deg}° the point is (${fmt(cx)}, ${fmt(cy)}), so ${useSin ? 'sin' : 'cos'} ${deg}° = ${ans}.`,
    }
  }

  if (d === 2) {
    if (Math.random() < 0.5) {
      // (cos θ, sin θ) at a first-quadrant special angle.
      const angs = [30, 45, 60]
      const deg = angs[rint(0, angs.length - 1)]
      const ans = COORD[deg]
      const alts = [30, 45, 60, 90].filter((a) => a !== deg).map((a) => COORD[a])
      return {
        promptText: `On the unit circle, the point at ${deg}° is…`,
        say: `On the unit circle, what point is at ${deg} degrees? Give cosine, sine.`,
        choices: textChoices([ans, ...alts].slice(0, 4)),
        answer: ans,
        sayAnswer: spokenCoord(ans),
        angleDeg: deg,
        explain: `The point is (cos θ, sin θ). At ${deg}° that is ${ans}.`,
      }
    }
    // Reference angle of an angle like 150°.
    const angs = [120, 135, 150, 210, 225, 240, 300, 315, 330]
    const deg = angs[rint(0, angs.length - 1)]
    const ans = refAngle(deg)
    const alts = new Set<number>([ans])
    for (const c of [30, 45, 60, 90, deg % 90, Math.abs(180 - deg)]) if (c > 0 && c < 90) alts.add(c)
    while (alts.size < 4) alts.add(rint(20, 80))
    return {
      promptText: `What is the reference angle of ${deg}°?`,
      say: `What is the reference angle of ${deg} degrees?`,
      choices: shuffle([...alts]).slice(0, 4).map((n) => strChoice(`${n}°`)),
      answer: `${ans}°`,
      sayAnswer: `${ans} degrees`,
      angleDeg: deg,
      explain: `The reference angle is the acute angle to the x-axis. For ${deg}° that is ${ans}°.`,
    }
  }

  // d === 3 — signs by quadrant + coordinates of a non-first-quadrant angle.
  if (Math.random() < 0.5) {
    // Signs of sin/cos in a quadrant.
    const q = rint(1, 4)
    const signs: Record<number, { sin: string; cos: string }> = {
      1: { sin: '+', cos: '+' }, 2: { sin: '+', cos: '−' },
      3: { sin: '−', cos: '−' }, 4: { sin: '−', cos: '+' },
    }
    const s = signs[q]
    const line = (a: number) => {
      const g = signs[a]
      return `In Q${a}, sine is ${g.sin} and cosine is ${g.cos}`
    }
    const ans = line(q)
    return {
      promptText: `In Quadrant ${q}, what are the signs of sine and cosine?`,
      say: `In quadrant ${q}, what are the signs of sine and cosine?`,
      choices: textChoices([1, 2, 3, 4].map(line)),
      answer: ans,
      sayAnswer: `sine ${s.sin === '+' ? 'positive' : 'negative'}, cosine ${s.cos === '+' ? 'positive' : 'negative'}`,
      angleDeg: { 1: 45, 2: 135, 3: 225, 4: 315 }[q],
      explain: `Cosine is the x-coordinate, sine is the y-coordinate. In Q${q}, x is ${s.cos} and y is ${s.sin}, so ${ans.toLowerCase()}.`,
    }
  }
  // Coordinate at a Q2/Q3/Q4 special angle.
  const angs = [120, 135, 150, 210, 225, 240, 300, 315, 330]
  const deg = angs[rint(0, angs.length - 1)]
  const ans = COORD[deg]
  const ref = refAngle(deg)
  const alts = [COORD[ref], COORD[(deg + 30) % 360] ?? COORD[30], COORD[(deg + 180) % 360] ?? COORD[0]].filter(Boolean)
  return {
    promptText: `On the unit circle, the point at ${deg}° is…`,
    say: `On the unit circle, what point is at ${deg} degrees?`,
    choices: textChoices([ans, ...alts].slice(0, 4)),
    answer: ans,
    sayAnswer: spokenCoord(ans),
    angleDeg: deg,
    explain: `${deg}° lands in a quadrant where the reference angle is ${ref}°. The point is (cos θ, sin θ) = ${ans}.`,
  }
}

// ── UnitCircleFigure: a small static unit-circle SVG (marks one angle) ──────
function UnitCircleFigure({ angleDeg }: { angleDeg?: number }) {
  const R = 78
  const cx = 100
  const cy = 100
  const has = typeof angleDeg === 'number'
  const rad = ((angleDeg ?? 0) * Math.PI) / 180
  const px = cx + R * Math.cos(rad)
  const py = cy - R * Math.sin(rad)
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={has ? `Unit circle, angle ${angleDeg} degrees` : 'Unit circle'}
      style={{ display: 'block', width: 200, maxWidth: '80%', height: 'auto', border: '1px solid var(--outline)', borderRadius: 8, background: 'var(--paper)' }}>
      <line x1={cx - R - 8} y1={cy} x2={cx + R + 8} y2={cy} stroke="var(--outline)" strokeWidth={1} />
      <line x1={cx} y1={cy - R - 8} x2={cx} y2={cy + R + 8} stroke="var(--outline)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--ink-soft)" strokeWidth={1.5} />
      {has && (
        <>
          <line x1={cx} y1={cy} x2={px} y2={py} stroke="var(--accent)" strokeWidth={2.5} />
          <line x1={px} y1={py} x2={px} y2={cy} stroke="var(--ink-muted)" strokeWidth={1} strokeDasharray="3 3" />
          <line x1={px} y1={py} x2={cx} y2={py} stroke="var(--ink-muted)" strokeWidth={1} strokeDasharray="3 3" />
          <circle cx={px} cy={py} r={4.5} fill="var(--accent)" />
        </>
      )}
    </svg>
  )
}

// ── UnitCircleWatch: a narrated worked example (reused for re-teach) ────────
export function UnitCircleWatch({
  lines, angleDeg, onDone,
}: {
  lines: string[]; angleDeg?: number; onDone: () => void
}) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const cancel = speakSeq(lines, { onDone: () => window.setTimeout(() => doneRef.current(), 1200) })
    return cancel
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      <UnitCircleFigure angleDeg={angleDeg} />
      <p style={{ margin: 0, maxWidth: 520, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        {lines[lines.length - 1]}
      </p>
    </div>
  )
}

// A one-question check inside the lesson (retry allowed, no penalty).
function UnitCircleAsk({ prompt, say, choices, answer, onDone }: {
  prompt: string; say: string; choices: Choice[]; answer: string; onDone: () => void
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

export default function UnitCircleTrigTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'The unit circle turns an angle into a coordinate. Watch.', mood: 'happy',
      render: (d) => (
        <UnitCircleWatch
          lines={[
            'Draw a circle of radius one, centred at the origin.',
            'Sweep out an angle θ from the positive x-axis. Where it meets the circle, the point is cosine θ, sine θ — cosine across, sine up.',
          ]}
          angleDeg={50}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Angles come in degrees and radians. Watch.', mood: 'happy',
      render: (d) => (
        <UnitCircleWatch
          lines={[
            'A full turn around the circle is 360 degrees, which is 2 pi radians.',
            'So 180 degrees is pi, 90 degrees is pi over two, and 45 degrees is pi over four.',
          ]}
          angleDeg={90}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'The signs follow the quadrant. Watch.', mood: 'thinking',
      render: (d) => (
        <UnitCircleWatch
          lines={[
            'Cosine is the x-coordinate and sine is the y-coordinate.',
            'In quadrant two the point is up and to the left, so sine is positive and cosine is negative.',
          ]}
          angleDeg={135}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <UnitCircleAsk
          prompt="On the unit circle, the point at 60° is…"
          say="On the unit circle, what point is at 60 degrees? Give cosine, sine."
          choices={[strChoice('(1/2, √3/2)'), strChoice('(√3/2, 1/2)'), strChoice('(√2/2, √2/2)'), strChoice('(0, 1)')]}
          answer="(1/2, √3/2)"
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Unit Circle & Trig"
      steps={steps}
      finalSpeech={`Nice work, ${childName}. You can read an angle as a point, switch between degrees and radians, and track the signs. Let’s spin the circle.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
