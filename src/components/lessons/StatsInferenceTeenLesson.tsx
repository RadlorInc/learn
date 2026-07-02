'use client'
/**
 * StatsInferenceTeenLesson (17–18, "Field Lab") — the worked-example walkthrough
 * for the Statistics & Inference module: summarize a dataset (mean/median/mode),
 * measure spread (range), reason about outliers & resistance, and infer beyond a
 * sample (representative vs biased sampling, basic probability). Built on
 * TeenLessonShell: a few narrated "watch" steps then a quick check. Exports the
 * round generator + StatsWatch so the practice chapter and its re-teach reuse
 * them. Mirrors FunctionToolkitTeenLesson / IntegersTeenLesson, in teen chrome.
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
const numChoice = (v: number): Choice => ({ value: v, label: String(v) })
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0)
const meanOf = (a: number[]) => sum(a) / a.length
const medianOf = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y)
  const n = s.length
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
}
const modeOf = (a: number[]) => {
  const count = new Map<number, number>()
  for (const v of a) count.set(v, (count.get(v) ?? 0) + 1)
  let best = a[0]
  let bestC = 0
  for (const [v, c] of count) if (c > bestC) { best = v; bestC = c }
  return best
}
const round1 = (n: number) => Math.round(n * 10) / 10

/** Build 4 distinct numeric choices around a numeric answer. */
function numChoices(answer: number, distractors: number[]): Choice[] {
  const set = new Set<number>([answer])
  for (const v of distractors) { if (set.size >= 4) break; if (Number.isFinite(v)) set.add(round1(v)) }
  let guard = 0
  while (set.size < 4 && guard++ < 60) set.add(round1(answer + rint(-4, 4)))
  return shuffle([...set]).map((v) => numChoice(v))
}

/** Build text choices; `answer` must be one of `all`. */
function textChoices(all: string[]): Choice[] {
  return shuffle([...new Set(all)]).map((s) => ({ value: s, label: s }))
}

/** A small dataset with a clear mode (one value repeats). */
function makeDataset(len: number, lo: number, hi: number): number[] {
  const out: number[] = []
  for (let i = 0; i < len - 1; i++) out.push(rint(lo, hi))
  // guarantee a repeat so a mode exists
  out.push(out[rint(0, out.length - 1)])
  return shuffle(out)
}

export interface Round {
  promptText: string
  say: string
  choices: Choice[]
  answer: string | number
  /** Spoken form of the answer (for the wrong-answer read-out). */
  sayAnswer?: string
  /** Optional dataset shown in the re-teach visual. */
  data?: number[]
  explain: string   // re-teach line
}

/** Difficulty-aware round generator: L1 mean/median/mode · L2 range + outliers/resistance · L3 sampling/inference/probability. */
export function makeRound(d: 1 | 2 | 3): Round {
  if (d === 1) {
    const data = makeDataset(5, 1, 9)
    const roll = rint(0, 2)
    if (roll === 0) {
      const ans = round1(meanOf(data))
      return {
        promptText: `Data: ${data.join(', ')}. What is the mean?`,
        say: `Here is a dataset: ${data.join(', ')}. What is the mean?`,
        choices: numChoices(ans, [medianOf(data), modeOf(data), ans + 1, ans - 1]),
        answer: ans,
        sayAnswer: `${ans}`,
        data,
        explain: `Add them: ${data.join(' + ')} = ${sum(data)}, then divide by ${data.length} → mean = ${ans}.`,
      }
    }
    if (roll === 1) {
      const ans = medianOf(data)
      return {
        promptText: `Data: ${data.join(', ')}. What is the median?`,
        say: `Here is a dataset: ${data.join(', ')}. What is the median?`,
        choices: numChoices(ans, [round1(meanOf(data)), modeOf(data), ans + 1, ans - 1]),
        answer: ans,
        sayAnswer: `${ans}`,
        data,
        explain: `Sort them: ${[...data].sort((a, b) => a - b).join(', ')}. The middle value is ${ans}.`,
      }
    }
    const ans = modeOf(data)
    return {
      promptText: `Data: ${data.join(', ')}. What is the mode?`,
      say: `Here is a dataset: ${data.join(', ')}. What is the mode?`,
      choices: numChoices(ans, [round1(meanOf(data)), medianOf(data), ans + 1, ans - 1]),
      answer: ans,
      sayAnswer: `${ans}`,
      data,
      explain: `The mode is the value that appears most often — here that is ${ans}.`,
    }
  }

  if (d === 2) {
    const roll = rint(0, 2)
    if (roll === 0) {
      // Range.
      const data = makeDataset(5, 2, 18)
      const ans = Math.max(...data) - Math.min(...data)
      return {
        promptText: `Data: ${data.join(', ')}. What is the range?`,
        say: `Dataset: ${data.join(', ')}. What is the range?`,
        choices: numChoices(ans, [Math.max(...data), Math.min(...data), ans + 1, ans - 1]),
        answer: ans,
        sayAnswer: `${ans}`,
        data,
        explain: `Range is largest minus smallest: ${Math.max(...data)} − ${Math.min(...data)} = ${ans}.`,
      }
    }
    if (roll === 1) {
      // Resistance to an outlier — conceptual MCQ.
      return {
        promptText: 'One value in a dataset is a huge outlier. Which summary is more resistant to it?',
        say: 'One value in a dataset is a huge outlier. Which summary is more resistant to it, the mean or the median?',
        choices: textChoices(['The median', 'The mean', 'They are affected equally', 'The range']),
        answer: 'The median',
        sayAnswer: 'the median',
        explain: `The mean uses every value, so one extreme number pulls it hard. The median is just the middle position, so it barely moves — it is resistant.`,
      }
    }
    // Effect of adding an outlier on the mean.
    const base = makeDataset(4, 3, 7)
    const outlier = rint(30, 50)
    const before = round1(meanOf(base))
    const after = round1(meanOf([...base, outlier]))
    const up = after > before
    return {
      promptText: `Mean of ${base.join(', ')} is ${before}. Add a value of ${outlier}. The mean will…`,
      say: `The mean of ${base.join(', ')} is ${before}. Now add a value of ${outlier}. What happens to the mean?`,
      choices: textChoices([up ? 'Increase a lot' : 'Decrease a lot', 'Stay the same', up ? 'Decrease a lot' : 'Increase a lot', 'Become the median']),
      answer: up ? 'Increase a lot' : 'Decrease a lot',
      sayAnswer: up ? 'increase a lot' : 'decrease a lot',
      explain: `A far-out value drags the mean toward it. Adding ${outlier} raises the mean from ${before} to about ${after}.`,
    }
  }

  // d === 3 — sampling, inference, and basic probability.
  const roll = rint(0, 2)
  if (roll === 0) {
    // Representative vs biased sampling.
    return {
      promptText: 'To estimate a school’s average sleep, which sample is least biased?',
      say: 'To estimate the whole school’s average sleep, which sample is least biased?',
      choices: textChoices([
        'A random sample across all grades',
        'Only students in the chess club',
        'Only students who arrive late',
        'Only the teacher’s own class',
      ]),
      answer: 'A random sample across all grades',
      sayAnswer: 'a random sample across all grades',
      explain: `A sample should look like the whole group. Choosing one club or the latecomers skews it — a random sample across all grades represents everyone.`,
    }
  }
  if (roll === 1) {
    // Basic probability of a draw.
    const win = rint(2, 5)
    const rest = rint(3, 7)
    const total = win + rest
    const ans = round1(win / total)
    return {
      promptText: `A bag has ${win} red and ${rest} blue marbles. P(red) on one draw?`,
      say: `A bag has ${win} red and ${rest} blue marbles. What is the probability of drawing red?`,
      choices: textChoices([
        `${win}/${total}`,
        `${rest}/${total}`,
        `${win}/${rest}`,
        `1/${total}`,
      ]),
      answer: `${win}/${total}`,
      sayAnswer: `${win} out of ${total}`,
      explain: `Probability is favorable over total: ${win} red out of ${total} marbles = ${win}/${total} (about ${ans}).`,
    }
  }
  // Simple inference statement.
  const pct = rint(52, 68)
  return {
    promptText: `A random poll of 400 voters shows ${pct}% favor a plan. The best inference is…`,
    say: `A random poll of 400 voters shows ${pct} percent favor a plan. What is the best inference?`,
    choices: textChoices([
      'About a majority of all voters likely favor it',
      `Exactly ${pct}% of every voter favors it`,
      'The sample tells us nothing about all voters',
      'No voters oppose the plan',
    ]),
    answer: 'About a majority of all voters likely favor it',
    sayAnswer: 'about a majority of all voters likely favor it',
    explain: `A good random sample estimates the whole — not exactly, but close. ${pct}% in the sample suggests a majority of all voters probably favor it.`,
  }
}

// ── StatsWatch: a narrated worked example (reused for re-teach) ─────────────
// Text-forward, with an optional small dot-plot of a dataset when supplied.
export function StatsWatch({
  lines, data, onDone,
}: {
  lines: string[]; data?: number[]; onDone: () => void
}) {
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const cancel = speakSeq(lines, { onDone: () => window.setTimeout(() => doneRef.current(), 1200) })
    return cancel
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {data && data.length > 0 && (
        <div style={{ width: '100%', maxWidth: 340 }}>
          <DotPlot data={data} />
        </div>
      )}
      <p style={{ margin: 0, maxWidth: 520, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
        {lines[lines.length - 1]}
      </p>
    </div>
  )
}

/** A small code-drawn bar/dot plot of a dataset — one bar per value, height ∝ value. */
function DotPlot({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, height: 96, padding: '8px 4px', background: 'var(--bg-1)', border: '1px solid var(--outline)', borderRadius: 10 }}>
      {data.map((v, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 20, height: `${Math.max(6, (v / max) * 68)}px`, background: 'var(--accent)', borderRadius: '4px 4px 0 0' }} />
          <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 11, color: 'var(--ink-soft)' }}>{v}</span>
        </div>
      ))}
    </div>
  )
}

// A one-question check inside the lesson (retry allowed, no penalty).
function StatsAsk({ prompt, say, choices, answer, onDone }: {
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
        <ChoiceGrid band={BAND} choices={choices} selected={selected} status={status} correctValue={answer} onPick={pick} columns={2} mono={typeof answer === 'number'} />
      </div>
    </div>
  )
}

interface Props { band?: AgeBand; childName: string; onLessonComplete: () => void }

export default function StatsInferenceTeenLesson({ childName, onLessonComplete }: Props) {
  const steps: LessonStep[] = [
    {
      bubble: 'A dataset has a center. Three ways to find it. Watch.', mood: 'happy',
      render: (d) => (
        <StatsWatch
          lines={[
            'Take the values four, four, six, seven, and nine.',
            'The mean adds them and divides by five — that is six. The median is the middle value, six. The mode is the value that repeats, four.',
          ]}
          data={[4, 4, 6, 7, 9]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Spread tells you how scattered the data is. Watch.', mood: 'happy',
      render: (d) => (
        <StatsWatch
          lines={[
            'The range is the largest value minus the smallest — here nine minus four is five.',
            'A single far-out value, an outlier, drags the mean but barely moves the median, so the median resists outliers.',
          ]}
          data={[4, 4, 6, 7, 9]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'From a good sample you can infer about the whole.', mood: 'thinking',
      render: (d) => (
        <StatsWatch
          lines={[
            'A sample should look like the whole group — a random sample across everyone, not just one club.',
            'Then the sample’s pattern estimates the whole: if most of a random poll favors a plan, most people probably do too.',
          ]}
          onDone={d}
        />
      ),
    },
    {
      bubble: 'Your turn.', mood: 'thinking',
      render: (d) => (
        <StatsAsk
          prompt="Data: 4, 4, 6, 7, 9. What is the mean?"
          say="The dataset is four, four, six, seven, nine. What is the mean?"
          choices={[numChoice(6), numChoice(4), numChoice(5), numChoice(7)]}
          answer={6}
          onDone={d}
        />
      ),
    },
  ]
  return (
    <TeenLessonShell
      band={BAND}
      childName={childName}
      chapterTitle="Statistics & Inference"
      steps={steps}
      finalSpeech={`Nice work, ${childName}. You can summarize data, read its spread, and reason from a sample to the whole. Let’s run the module.`}
      onLessonComplete={onLessonComplete}
    />
  )
}
