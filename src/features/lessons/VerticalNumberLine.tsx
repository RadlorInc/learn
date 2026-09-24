'use client'
/**
 * A vertical number line from −10 to 10 the child can mark (Review 1 Q7, founder 2026-09-24): up is more, down is
 * less — the way a thermometer or sea level reads — for the signed-number topics. Tap a number to put a dot on it,
 * tap again to take it off. Nothing on it is read or graded. Shown beside the scratch pad, on the topics below only.
 * Every number is a real button (keyboard, a name, and a dot + aria-pressed when marked — never colour alone).
 */
import { useState, useEffect } from 'react'
import { INK, TEAL, pill } from './Pictures'
import { C } from './sessionCopy'

/** Where the line is offered: every topic of Grade 7 Module 2, the signed numbers (founder's pick, 2026-09-24). */
export const VERTICAL_LINE_TOPICS: ReadonlySet<string> = new Set(Array.from({ length: 8 }, (_, i) => `g7m2-t${i + 1}`))
export const verticalLineFor = (topic: string | undefined) => !!topic && VERTICAL_LINE_TOPICS.has(topic)

const TOP = 10, BOTTOM = -10
/** How a child reads a number: a real minus sign, as the lessons write it. */
export const show = (n: number) => (n < 0 ? `−${-n}` : String(n))

export function VerticalNumberLine({ clearKey }: { clearKey: string | number }) {
  const [marks, setMarks] = useState<number[]>([])
  // A new problem: no marks left over.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on a prop change, as the scratch pad does
  useEffect(() => setMarks([]), [clearKey])
  const toggle = (n: number) => setMarks(m => (m.includes(n) ? m.filter(x => x !== n) : [...m, n]))
  const values = Array.from({ length: TOP - BOTTOM + 1 }, (_, i) => TOP - i)
  return (
    <div role="group" aria-label={C.numberLine} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
      <ol style={{ listStyle: 'none', margin: 0, padding: '4px 0', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* The line itself, behind the numbers. */}
        <span aria-hidden style={{ position: 'absolute', left: 21, top: 12, bottom: 12, width: 4, background: INK, borderRadius: 2 }} />
        {values.map(n => {
          const on = marks.includes(n)
          return (
            <li key={n} style={{ position: 'relative' }}>
              <button type="button" aria-pressed={on} aria-label={on ? C.unmark(show(n)) : C.mark(show(n))} onClick={() => toggle(n)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minHeight: 26, padding: 0, border: 0, background: 'transparent',
                  cursor: 'pointer', color: INK, fontWeight: n === 0 ? 900 : 700, fontSize: n === 0 ? 18 : 16, fontFamily: 'inherit' }}>
                <span aria-hidden style={{ width: 46, display: 'flex', justifyContent: 'center' }}>
                  {on
                    ? <span style={{ width: 20, height: 20, borderRadius: '50%', background: TEAL, border: `3px solid ${INK}` }} />
                    : <span style={{ width: n === 0 ? 26 : 16, height: n === 0 ? 5 : 3, background: INK, borderRadius: 2 }} />}
                </span>
                <span style={{ minWidth: 30, textAlign: 'right', ...(on ? { textDecoration: 'underline', textUnderlineOffset: 3 } : {}) }}>{show(n)}</span>
              </button>
            </li>
          )
        })}
      </ol>
      <button type="button" style={{ ...pill, fontSize: 14, padding: '6px 10px' }} disabled={marks.length === 0} onClick={() => setMarks([])}>{C.clearMarks}</button>
    </div>
  )
}
