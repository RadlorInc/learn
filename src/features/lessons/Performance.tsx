'use client'
/**
 * Performance (parent dashboard), per child: topics mastered and finished, problems answered this week, how often the
 * first try was right, where they are stuck, and how the assigned lessons stand. Numbers come from
 * ./progressReport over the account's lesson_progress and the last 30 days of point_events. No time practised
 * (founder's call, 2026-09-17).
 */
import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { findLesson } from './modules'
import { buildReport, assignmentStatus, localDay, showDay, STUCK_MIN, type Report } from './progressReport'
import { getLessonRows, getRecentPoints } from '@/data/repositories/points'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { useT, useLang } from '@/features/dashboard/i18n'

export interface PerformanceLearner { id: string; name: string; lessonIds: string[] | null; due: Record<string, string> }

const DAYS = 30

/** One child (their Progress tab) or a class's students (a picker shows when there is more than one). */
export function Performance({ learners, lessonsHref }: { learners: PerformanceLearner[]; lessonsHref?: string }) {
  const t = useT(), lang = useLang(), loc = lang === 'es' ? 'es-US' : 'en-US'
  const [who, setWho] = useState(learners[0]?.id ?? '')
  const [report, setReport] = useState<{ id: string; r: Report | null } | null>(null)
  const child = learners.find(l => l.id === who) ?? learners[0]

  const childId = child?.id
  useEffect(() => {
    if (!childId) return
    let live = true
    Promise.all([getRecentPoints(childId, DAYS), getLessonRows(childId)]).then(([points, rows]) => {
      if (live) setReport({ id: childId, r: points && rows ? buildReport(points, rows, new Date()) : null })
    })
    return () => { live = false }
  }, [childId])

  if (!child) return <div style={panel}>{t('No students here yet.')}</div>
  const r = report?.id === child.id ? report.r : undefined
  const today = localDay(new Date())
  const assigned = child.lessonIds ?? []
  const late = assigned.filter(id => assignmentStatus(lessonDone(child.id, id), child.due[id], today) === 'late')
  const most = r ? Math.max(1, ...r.week.map(d => d.problems)) : 1

  return (
    <>
      {learners.length > 1 && <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 16px' }}>
        {learners.map(l => (
          <button key={l.id} type="button" aria-pressed={l.id === child.id} onClick={() => setWho(l.id)}
            style={{ ...ghost, borderRadius: 999, background: l.id === child.id ? 'var(--milo-orange-soft)' : 'var(--paper-soft)' }}>{l.name}</button>
        ))}
      </div>}

      {r === undefined ? <div style={panel}>{t('Loading…')}</div>
        : r === null ? <div style={panel}>{t('Could not load {name}’s results. Refresh to try again.', { name: child.name })}</div>
        : <>
          <div className="home-stats">
            {[
              { num: r.mastered, label: t('Topics mastered') },
              { num: r.done, label: t('Lessons finished') },
              { num: r.practising, label: t('Topics in progress') },
              { num: r.problemsThisWeek, label: t('Problems this week') },
              { num: r.firstTryPct === null ? '—' : `${r.firstTryPct}%`, label: t('Right on the first try · last {n} days', { n: DAYS }) },
            ].map(s => (
              <div key={s.label} style={card}>
                <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--ink)' }}>{s.num}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="home-two" style={{ marginTop: 14 }}>
            <section style={panel} aria-label={t('This week')}>
              <h2 style={h2}>{t('Problems answered, last 7 days')}</h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
                {r.week.map(d => (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>{d.problems || ''}</span>
                    <div title={t('{n} on {day}', { n: d.problems, day: showDay(d.day, lang) })}
                      style={{ width: '100%', maxWidth: 36, height: `${Math.round(100 * d.problems / most)}%`, minHeight: 3, borderRadius: 6, background: d.problems ? 'var(--milo-orange)' : 'var(--card-border)' }} />
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 700 }}>
                      {new Date(`${d.day}T12:00:00`).toLocaleDateString(loc, { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section style={panel} aria-label={t('Needs help with')}>
              <h2 style={h2}>{t('Needs help with')}</h2>
              {r.stuck.length === 0
                ? <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>
                    {t('Nothing right now. A topic shows here after {n} or more practice problems when fewer than half were right on the first try.', { n: STUCK_MIN })}
                  </p>
                : <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {r.stuck.map(s => {
                      const f = findLesson(s.lessonId)
                      return (
                        <li key={s.lessonId} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{f?.lesson.title ?? s.lessonId}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{t('Grade {g}', { g: f?.module.grade ?? '' })} · {f?.module.title}</div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#B42318', whiteSpace: 'nowrap' }}>{t('{pct}% first try · {n} problems', { pct: s.firstTryPct, n: s.problems })}</span>
                        </li>
                      )
                    })}
                  </ul>}
            </section>
          </div>

          <section style={{ ...panel, marginTop: 14 }} aria-label={t('Chosen lessons')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={h2}>{t('Chosen lessons')}</h2>
              {lessonsHref && <Link href={lessonsHref} style={ghost}>{t('Lessons')} →</Link>}
            </div>
            {assigned.length === 0
              ? <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>{t('None chosen, so {name} sees every topic.', { name: child.name })}</p>
              : <p style={{ margin: 0, fontSize: 14, color: 'var(--ink)' }}>
                  {t('{n} of {total} done', { n: assigned.filter(id => lessonDone(child.id, id)).length, total: assigned.length })}
                  {late.length > 0 && <span style={{ background: 'var(--milo-orange-soft)', color: 'var(--ink)', marginLeft: 8, padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>{t('{n} past the due date', { n: late.length })}</span>}
                </p>}
          </section>
        </>}
    </>
  )
}

const h2 = { margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--ink)' } as const
const card = { background: 'var(--paper-soft)', border: '1.5px solid var(--card-border)', borderRadius: 16, padding: 16 } as const
const panel: CSSProperties = { background: 'var(--paper-soft)', border: '1.5px solid var(--card-border)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }
const ghost: CSSProperties = { background: 'var(--paper-soft)', color: 'var(--ink)', border: '1.5px solid var(--card-border)', borderRadius: 10, padding: '10px 14px', minHeight: 44, fontSize: 14, fontWeight: 800, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }
