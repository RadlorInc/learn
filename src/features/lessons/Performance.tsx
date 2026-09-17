'use client'
/**
 * Performance (parent dashboard), per child: topics mastered and finished, problems answered this week, how often the
 * first try was right, where they are stuck, and how the assigned lessons stand. Numbers come from
 * ./progressReport over the account's lesson_progress and the last 30 days of point_events. No time practised
 * (founder's call, 2026-09-17).
 */
import { useEffect, useState } from 'react'
import { findLesson } from './modules'
import { buildReport, assignmentStatus, localDay, showDay, STUCK_MIN, type Report } from './progressReport'
import { getLessonRows, getRecentPoints } from '@/data/repositories/points'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { panel, ghost } from './LessonLibrary'
import { PILL } from './AssignLessons'

export interface PerformanceLearner { id: string; name: string; lessonIds: string[] | null; due: Record<string, string> }

const DAYS = 30

export function Performance({ learners, onAssign }: { learners: PerformanceLearner[]; onAssign: () => void }) {
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

  if (!child) return <><h1 style={h1}>Performance</h1><div style={panel}>Add a learner first.</div></>
  const r = report?.id === child.id ? report.r : undefined
  const today = localDay(new Date())
  const assigned = child.lessonIds ?? []
  const late = assigned.filter(id => assignmentStatus(lessonDone(child.id, id), child.due[id], today) === 'late')
  const most = r ? Math.max(1, ...r.week.map(d => d.problems)) : 1

  return (
    <>
      <h1 style={h1}>Performance</h1>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 16px' }}>
        {learners.map(l => (
          <button key={l.id} type="button" aria-pressed={l.id === child.id} onClick={() => setWho(l.id)}
            style={{ ...ghost, borderRadius: 999, background: l.id === child.id ? 'var(--milo-orange-soft)' : 'var(--paper-soft)' }}>{l.name}</button>
        ))}
      </div>

      {r === undefined ? <div style={panel}>Loading…</div>
        : r === null ? <div style={panel}>Could not load {child.name}&apos;s results. Refresh to try again.</div>
        : <>
          <div className="home-stats">
            {[
              { num: r.mastered, label: 'Topics mastered' },
              { num: r.done, label: 'Lessons finished' },
              { num: r.problemsThisWeek, label: 'Problems this week' },
              { num: r.firstTryPct === null ? '—' : `${r.firstTryPct}%`, label: `Right on the first try · last ${DAYS} days` },
            ].map(s => (
              <div key={s.label} style={card}>
                <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--ink)' }}>{s.num}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="home-two" style={{ marginTop: 14 }}>
            <section style={panel} aria-label="This week">
              <h2 style={h2}>Problems answered, last 7 days</h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
                {r.week.map(d => (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>{d.problems || ''}</span>
                    <div title={`${d.problems} on ${showDay(d.day)}`}
                      style={{ width: '100%', maxWidth: 36, height: `${Math.round(100 * d.problems / most)}%`, minHeight: 3, borderRadius: 6, background: d.problems ? 'var(--milo-orange)' : 'var(--card-border)' }} />
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 700 }}>
                      {new Date(`${d.day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section style={panel} aria-label="Needs help with">
              <h2 style={h2}>Needs help with</h2>
              {r.stuck.length === 0
                ? <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>
                    Nothing right now. A topic shows here after {STUCK_MIN} or more practice problems when fewer than half were right on the first try.
                  </p>
                : <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {r.stuck.map(s => {
                      const f = findLesson(s.lessonId)
                      return (
                        <li key={s.lessonId} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{f?.lesson.title ?? s.lessonId}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Grade {f?.module.grade} · {f?.module.title}</div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#B42318', whiteSpace: 'nowrap' }}>{s.firstTryPct}% first try · {s.problems} problems</span>
                        </li>
                      )
                    })}
                  </ul>}
            </section>
          </div>

          <section style={{ ...panel, marginTop: 14 }} aria-label="Assigned lessons">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={h2}>Assigned lessons</h2>
              <button type="button" style={ghost} onClick={onAssign}>Assign lessons →</button>
            </div>
            {assigned.length === 0
              ? <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>Nothing assigned — {child.name} sees every topic.</p>
              : <p style={{ margin: 0, fontSize: 14, color: 'var(--ink)' }}>
                  {assigned.filter(id => lessonDone(child.id, id)).length} of {assigned.length} done
                  {late.length > 0 && <span style={{ ...PILL.late, marginLeft: 8, padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>{late.length} late</span>}
                </p>}
          </section>
        </>}
    </>
  )
}

const h1 = { margin: '0 0 12px', fontSize: 28, fontWeight: 900, color: 'var(--ink)', fontFamily: 'var(--font-display)' } as const
const h2 = { margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--ink)' } as const
const card = { background: 'var(--paper-soft)', border: '1.5px solid var(--card-border)', borderRadius: 16, padding: 16 } as const
