'use client'
/**
 * The answer box, shaped by what the answer is: one number box, a fraction (top over bottom, with a whole-number
 * box when the topic uses mixed numbers), a clock time (hours : minutes), or a row of choices.
 * The value it reports is a plain string that `isCorrect` reads: "12", "-3.5", "1 3/4", "7:35", or a choice's index.
 *
 * ⚠️ The SHAPE must never give the answer away, so it is decided by the lesson (`signed`, `mixed`), not by the
 * problem: a "−" key that appears only when the answer is negative would tell the child the sign.
 */
import type { CSSProperties } from 'react'
import type { Answer } from './script'
import { answerInput } from './Frame'
import { INK, TEAL, ON_TEAL } from './Pictures'

export function AnswerInput({ answer, value, onChange, signed, mixed }: {
  answer: Answer; value: string; onChange: (v: string) => void; signed?: boolean; mixed?: boolean
}) {
  if (typeof answer === 'object' && 'choices' in answer) {
    return (
      <div role="radiogroup" aria-label="Your answer" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {answer.choices.map((c, i) => {
          const on = value === String(i)
          return (
            <button key={i} type="button" role="radio" aria-checked={on} onClick={() => onChange(String(i))}
              style={{ ...choice, background: on ? TEAL : '#fff', color: on ? ON_TEAL : INK }}>{c}</button>
          )
        })}
      </div>
    )
  }

  if (typeof answer === 'object' && 'time' in answer) {
    const [h = '', m = ''] = value.split(':')
    const set = (nh: string, nm: string) => onChange(nh || nm ? `${nh}:${nm}` : '')
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <input aria-label="Hours" inputMode="numeric" maxLength={2} value={h} style={{ ...answerInput, width: 80 }}
          onChange={e => set(e.target.value.replace(/\D/g, ''), m)} />
        <b style={{ fontSize: 34 }}>:</b>
        <input aria-label="Minutes" inputMode="numeric" maxLength={2} value={m} style={{ ...answerInput, width: 80 }}
          onChange={e => set(h, e.target.value.replace(/\D/g, ''))} />
      </span>
    )
  }

  if (typeof answer === 'object' && 'frac' in answer) {
    // value is "w n/d" or "n/d", with a leading "-" when the child pressed "−"; the boxes are kept apart so a
    // half-typed fraction stays where the child put it.
    const neg = value.startsWith('-')
    const m = (neg ? value.slice(1) : value).match(/^(?:(\S*) )?(\S*)\/(\S*)$/)
    const w = m?.[1] ?? '', n = m?.[2] ?? '', d = m?.[3] ?? ''
    const write = (sign: boolean, nw: string, nn: string, nd: string) =>
      onChange(nw || nn || nd ? `${sign ? '-' : ''}${mixed ? `${nw} ` : ''}${nn}/${nd}` : sign ? '-/' : '')
    const set = (nw: string, nn: string, nd: string) => write(neg, nw, nn, nd)
    const box: CSSProperties = { ...answerInput, width: 84, height: 54, fontSize: 26 }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        {signed && signKey(neg, () => write(!neg, w, n, d))}
        {mixed && <input aria-label="Whole number" inputMode="numeric" maxLength={3} value={w} style={{ ...box, height: 64 }}
          onChange={e => set(e.target.value.replace(/\D/g, ''), n, d)} />}
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <input aria-label="Top number" inputMode="numeric" maxLength={4} value={n} style={box}
            onChange={e => set(w, e.target.value.replace(/\D/g, ''), d)} />
          <i aria-hidden style={{ width: 92, height: 5, borderRadius: 3, background: INK }} />
          <input aria-label="Bottom number" inputMode="numeric" maxLength={4} value={d} style={box}
            onChange={e => set(w, n, e.target.value.replace(/\D/g, ''))} />
        </span>
      </span>
    )
  }

  const neg = value.startsWith('-')
  const digits = neg ? value.slice(1) : value
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {signed && signKey(neg, () => onChange(neg ? digits : `-${digits}`))}
      <input aria-label="Your answer" inputMode="decimal" maxLength={12} value={digits}
        style={{ ...answerInput, width: 'min(180px, 44vw)' }}
        onChange={e => {
          const v = e.target.value.replace(/[^\d.,]/g, '')
          onChange(neg ? `-${v}` : v)
        }} />
    </span>
  )
}

const signKey = (neg: boolean, flip: () => void) => (
  <button type="button" aria-label={neg ? 'Make it positive' : 'Make it negative'} aria-pressed={neg} onClick={flip}
    style={{ ...choice, minWidth: 56, padding: '8px 0', fontSize: 28, background: neg ? TEAL : '#fff', color: neg ? ON_TEAL : INK }}>−</button>
)

/** Is there enough to Check? A fraction needs both numbers, a time both boxes. */
export function ready(answer: Answer, value: string): boolean {
  if (typeof answer === 'object' && 'frac' in answer) return /\d\/\d/.test(value)
  if (typeof answer === 'object' && 'time' in answer) return /^\d+:\d+$/.test(value)
  return /\d/.test(value)
}

/** Does any problem in this set have a negative number answer / a mixed-number answer? Decides the box, per lesson. */
export const needsSign = (answers: Answer[]) =>
  answers.some(a => (typeof a === 'number' ? a < 0 : typeof a === 'object' && 'frac' in a && (a.frac[0] < 0 || (a.whole ?? 0) < 0)))
export const needsWhole = (answers: Answer[]) => answers.some(a => typeof a === 'object' && 'frac' in a && a.whole !== undefined)

const choice: CSSProperties = { minHeight: 56, padding: '10px 20px', borderRadius: 16, border: `4px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}`,
  fontWeight: 800, fontSize: 'clamp(18px, 2.2vw, 22px)', cursor: 'pointer' }
