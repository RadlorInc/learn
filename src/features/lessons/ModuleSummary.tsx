'use client'
/**
 * The module summary (Review 1 Q3, founder 2026-09-24): once every topic of a module the child has is done — a
 * celebration, never a grade. Topics done, the points this module earned, "You got really good at:" (the mastered
 * topics), "Let's keep practicing:" (done, not mastered — said forwards), and Practice again on every topic, which goes
 * straight into that topic's practice. No count of a total, no percentage.
 */
import Link from 'next/link'
import { useEffect, useState, type CSSProperties } from 'react'
import type { Module } from './modules'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { loadStanding } from '@/infra/storage/lessonStanding'
import { getRecentPoints } from '@/data/repositories/points'
import { INK, pill, PAGE_BG, shell, topBar, LESSON_KEYFRAMES } from './Pictures'
import { bubble, primary, idea } from './Frame'
import { C } from './sessionCopy'

/** `lessons` = the module's topics this child has (their chosen ones, or all). */
export function ModuleSummary({ module, lessons, learnerId }: { module: Module; lessons: Module['lessons']; learnerId: string | null }) {
  const done = lessons.filter(l => lessonDone(learnerId, l.id))
  const good = done.filter(l => loadStanding(learnerId, l.id)?.mastered)
  const more = done.filter(l => !good.includes(l))
  // The points this module earned, from the account's ledger — shown only once read (signed out: no line at all).
  const [points, setPoints] = useState<number | null>(null)
  useEffect(() => {
    if (!learnerId) return
    let live = true
    const ids = new Set<string>([module.id, ...module.lessons.map(l => l.id)])
    getRecentPoints(learnerId, 3650).then(rows => {
      if (live && rows) setPoints(rows.filter(r => r.lesson_id && ids.has(r.lesson_id)).reduce((n, r) => n + r.points, 0))
    })
    return () => { live = false }
  }, [learnerId, module])

  const list = (title: string, xs: Module['lessons']) => xs.length > 0 && (
    <section aria-label={title} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 'clamp(20px, 2.4vw, 24px)', fontWeight: 900, color: INK }}>{title}</h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {xs.map(l => (
          <li key={l.id} style={row}>
            <span style={{ flex: 1, minWidth: 0 }}>⭐ {l.title}</span>
            <Link href={`/lesson?id=${l.id}&practice=1`} aria-label={`${C.practiceAgain}: ${l.title}`}
              style={{ ...pill, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>{C.practiceAgain}</Link>
          </li>
        ))}
      </ul>
    </section>
  )

  return (
    <div style={{ minHeight: '100dvh', background: PAGE_BG, padding: '14px 14px 32px', display: 'flex', justifyContent: 'center' }}>
      <style>{LESSON_KEYFRAMES}</style>
      <div style={{ ...shell, maxWidth: 760, alignSelf: 'flex-start' }}>
        <div style={topBar}>
          <Link href={`/lesson?module=${module.id}`} style={{ ...pill, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>← Topics</Link>
          <span style={{ fontSize: 'clamp(15px, 3.6vw, 18px)', textAlign: 'center' }}>Grade {module.grade} · Module {module.n}</span>
          <span />
        </div>
        <main style={{ padding: 'clamp(14px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(30px, 5vw, 44px)', color: INK, lineHeight: 1.1 }}>{C.moduleComplete}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <img src="/assets/lessons/badge.webp" alt="Module badge" width={80} height={93} style={{ animation: 'lp-pop .4s ease-out' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ ...idea, textAlign: 'left' }}>{module.title}</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK }}>
                {C.topicsDone(done.length)}{points !== null && points > 0 && <> · {C.points(points)}</>}
              </p>
            </div>
          </div>
          {list(C.gotGoodAt, good)}
          {list(C.keepPractisingList, more)}
          <Link href={`/modules?grade=${module.grade}`} style={{ ...primary, alignSelf: 'flex-start' }}>{C.backToModules}</Link>
        </main>
      </div>
    </div>
  )
}

const row: CSSProperties = { ...bubble, boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 14px', fontSize: 'clamp(18px, 2.2vw, 21px)', fontWeight: 700 }
