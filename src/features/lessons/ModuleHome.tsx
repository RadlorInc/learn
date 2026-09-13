'use client'
/**
 * The child's home: the Grade 3 modules on the left, the chosen module on the right with two ways in —
 * Learn (the topic path at /lesson) and Practice (mixed problems from every topic, at /practice).
 * Laid out like the founder's SampleUI template. A module that is not built yet says "Coming soon"; nothing is locked.
 */
import Link from 'next/link'
import { useState, type CSSProperties } from 'react'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { Thing, INK, TEAL, pill, PAGE_BG, shell, topBar } from './Pictures'
import { bubble, primary } from './Frame'
import { GRADE3_MODULES, mixedPractice } from './modules'
import type { Obj } from './script'

const LANDSCAPE = '(orientation: landscape) and (min-width: 700px)'

export function ModuleHome({ learnerId, back }: { learnerId: string | null; back?: { href: string; label: string } }) {
  const [picked, setPicked] = useState(GRADE3_MODULES.find(m => m.lessons.length > 0)!.id)
  const m = GRADE3_MODULES.find(x => x.id === picked)!
  // Read during render: every caller mounts this on the client only, after kv has hydrated.
  const doneIn = (lessons: typeof m.lessons) => lessons.filter(l => lessonDone(learnerId, l.id)).length
  const done = doneIn(m.lessons)
  const firstObj = (m.lessons[0]?.screens[0].pictures.find(p => 'obj' in p) as { obj: Obj } | undefined)?.obj ?? 'cookie'

  return (
    <div style={{ minHeight: '100dvh', background: PAGE_BG, padding: '14px 14px 26px', display: 'flex', justifyContent: 'center' }}>
      <style>{`.mh-grid { display: grid; gap: 18px }
/* Portrait: the chosen module and its Learn / Practice buttons first, the list of modules under it. */
@media not all and ${LANDSCAPE} { .mh-grid nav { order: 2 } }
@media ${LANDSCAPE} { .mh-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); align-items: start } }`}</style>
      <div style={{ ...shell, maxWidth: 1180, alignSelf: 'flex-start' }}>
        <div style={topBar}>
          {back ? <Link href={back.href} style={{ ...pill, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>{back.label}</Link> : <span />}
          <span style={{ fontSize: 'clamp(16px, 3.6vw, 20px)' }}>Grade 3</span>
          <span />
        </div>

        <div className="mh-grid" style={{ padding: 'clamp(14px, 3vw, 24px)' }}>
          <nav aria-label="Modules" style={{ background: '#fff', border: `4px solid ${INK}`, borderRadius: 20, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {GRADE3_MODULES.map(x => {
              const ready = x.lessons.length > 0, on = x.id === picked, all = ready && doneIn(x.lessons) === x.lessons.length
              return (
                <button key={x.id} type="button" disabled={!ready} aria-pressed={on} onClick={() => setPicked(x.id)}
                  style={{ ...row, background: on ? TEAL : '#fff', color: on ? '#fff' : INK, ...(ready ? {} : { opacity: 0.55, boxShadow: 'none', cursor: 'default' }) }}>
                  <span style={{ ...num, background: all ? '#9cf0d8' : on ? '#fff' : '#ffd166', color: INK }}>{all ? '✓' : x.n}</span>
                  <span style={{ flex: 1 }}>{x.title}{!ready && <small style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>Coming soon</small>}</span>
                </button>
              )
            })}
          </nav>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>Module {m.n}</p>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 40px)', color: INK, lineHeight: 1.1 }}>{m.title}</h1>
            <p style={bubble}>Learn each topic with pictures first. Then practice them all mixed together.</p>

            <div style={{ ...card, background: '#9cf0d8' }}>
              <div style={{ flex: 1 }}>
                <strong style={cardTitle}>1. Learn</strong>
                {done} of {m.lessons.length} topics done
              </div>
              <span aria-hidden style={{ display: 'flex', gap: 3, '--lp-u': '18px' } as CSSProperties}><Thing obj={firstObj} /><Thing obj={firstObj} /><Thing obj={firstObj} /></span>
              <Link href="/lesson" style={primary}>{done === 0 ? 'Start learning' : done === m.lessons.length ? 'Learn again' : 'Keep learning'}</Link>
            </div>

            <div style={{ ...card, background: '#ffd166' }}>
              <div style={{ flex: 1 }}>
                <strong style={cardTitle}>2. Practice</strong>
                {mixedPractice(m).length} mixed problems
              </div>
              <span aria-hidden style={{ display: 'flex', gap: 3, '--lp-u': '18px' } as CSSProperties}><Thing obj="cookie" /><Thing obj="chair" /><Thing obj="apple" /></span>
              <Link href={`/practice?module=${m.id}`} style={{ ...primary, background: '#fff', color: INK }}>Practice</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 16,
  border: `4px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}`, fontWeight: 800, fontSize: 'clamp(17px, 2vw, 20px)', cursor: 'pointer' }
const num: CSSProperties = { width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  border: `3px solid ${INK}`, fontWeight: 900 }
const card: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', border: `4px solid ${INK}`, borderRadius: 20, padding: '14px 16px',
  fontSize: 18, fontWeight: 600, color: INK }
const cardTitle: CSSProperties = { display: 'block', fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900 }
