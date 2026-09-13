'use client'
/**
 * The new-flow topic list: Grade 3 · Module 1, in teaching order. The first unfinished topic is
 * "Next up"; nothing is locked (a child may replay or jump ahead).
 */
import Link from 'next/link'
import { GRADE3_MODULE1, MODULE_1_TITLE } from './grade3Module1'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { INK, SOFT, ACCENT, GOOD, CARD, LINE, pill } from './Pictures'

export function LessonList({ learnerId, back }: { learnerId: string | null; back?: { href: string; label: string } }) {
  // Read during render: both callers mount this on the client only, after kv has hydrated.
  const done = GRADE3_MODULE1.filter(l => lessonDone(learnerId, l.id)).map(l => l.id)
  const nextUp = GRADE3_MODULE1.find(l => !done.includes(l.id))?.id

  return (
    <div style={{ minHeight: '100dvh', background: '#FCEAB6', padding: '16px 14px 32px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {back && <Link href={back.href} style={{ ...pill, alignSelf: 'flex-start', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>{back.label}</Link>}
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: SOFT }}>Grade 3 · Module 1 · {done.length} of {GRADE3_MODULE1.length} done</p>
          <h1 style={{ margin: '4px 0 0', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(24px, 4.5vw, 34px)', color: INK, lineHeight: 1.15 }}>{MODULE_1_TITLE}</h1>
        </div>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GRADE3_MODULE1.map((l, i) => {
            const isDone = done.includes(l.id), isNext = l.id === nextUp
            return (
              <li key={l.id}>
                <Link href={`/lesson?id=${l.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: INK, background: CARD, borderRadius: 16,
                  padding: '12px 16px', minHeight: 64, border: `3px solid ${isNext ? ACCENT : LINE}`,
                }}>
                  <span style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, color: '#fff', background: isDone ? GOOD : isNext ? ACCENT : '#C9B79A' }}>{isDone ? '✓' : i + 1}</span>
                  <span style={{ flex: 1 }}>
                    <b style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 19 }}>{l.title}</b>
                    <span style={{ fontSize: 14, color: SOFT }}>{l.skill}</span>
                  </span>
                  {isNext && <span style={{ flexShrink: 0, background: ACCENT, color: '#fff', borderRadius: 999, padding: '6px 14px', fontWeight: 900, fontSize: 14 }}>Next up ▶</span>}
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
