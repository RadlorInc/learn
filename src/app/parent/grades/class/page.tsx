'use client'

/**
 * One class, everything about it: the roster, the code children sign in with, and the set work.
 *
 * ⚠️ THE CHAPTERS TICKED ON A CLASS ARE THE TEACHER'S SYLLABUS AND NOTHING ELSE. They are what she
 * intends to teach and they are the menu her exercises are drawn from. They are NOT what her
 * students see when they open the app — that is `learners.chapter_ids`, set by the parent. Those
 * two shared one column until 2026-09-12, which meant adding a child to a class silently replaced
 * that child's whole app with the teacher's list. Do not reconnect them.
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CHAPTER_NAMES, CHAPTER_EMOJIS, chaptersForAge, type ChapterType, type AgeGroup } from '@/core/chapters'
import {
  getMyGrades, getGradeChapterIds, getMyLearners, parseRoster, addRoster,
  getGradeExercises, createExercise, setExerciseUnlocked, deleteExercise,
  type ExerciseSummary, type GradeSummary, type LearnerWithRole,
} from '@/data/repositories'

const P = {
  page: 'var(--paper)', card: 'var(--paper-soft)', edge: 'var(--card-border)',
  ink: 'var(--ink)', ink2: 'var(--ink-soft)', ink3: 'var(--ink-muted)', accent: 'var(--milo-orange)',
}
const DIFFICULTY = ['Easy', 'Medium', 'Hard'] as const

export default function ClassPage() {
  return <Suspense fallback={null}><ClassInner /></Suspense>
}

function ClassInner() {
  const router = useRouter()
  const gradeId = useSearchParams().get('g')

  const [grade, setGrade]         = useState<GradeSummary | null>(null)
  const [syllabus, setSyllabus]   = useState<ChapterType[]>([])
  const [roster, setRoster]       = useState<LearnerWithRole[]>([])
  const [exercises, setExercises] = useState<ExerciseSummary[]>([])
  const [loading, setLoading]     = useState(true)

  const [reloads, setReloads] = useState(0)
  const load = useCallback(() => setReloads(n => n + 1), [])

  useEffect(() => {
    if (!gradeId) return
    // ⚠️ `cancelled` rather than bare awaits: a teacher can switch classes while this is in flight,
    // and the slower response would otherwise land on top of the newer one.
    let cancelled = false
    Promise.all([getMyGrades(), getGradeChapterIds(gradeId), getMyLearners(), getGradeExercises(gradeId)])
      .then(([grades, chapters, learners, exs]) => {
        if (cancelled) return
        setGrade(grades.find(g => g.id === gradeId) ?? null)
        setSyllabus(chapters)
        setRoster(learners.filter(l => l.grade_id === gradeId))
        setExercises(exs)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [gradeId, reloads])

  // ⚠️ A redirect is a side effect and does not belong in render — called there it fires on every
  // render React attempts, including ones it throws away.
  useEffect(() => { if (!gradeId) router.replace('/parent/grades') }, [gradeId, router])

  if (!gradeId) return null
  if (loading)  return null
  if (!grade)   return <Shell><p style={{ color: P.ink2 }}>That class is not there any more.</p></Shell>

  return (
    <Shell>
      <button onClick={() => router.push('/parent/grades')} style={btnGhost}>← All classes</button>

      <h1 style={{ fontSize: 26, fontWeight: 900, color: P.ink, margin: '14px 0 2px' }}>{grade.name}</h1>
      <p style={{ fontSize: 14, color: P.ink3, margin: '0 0 20px' }}>
        Ages {grade.age_group} · {roster.length} {roster.length === 1 ? 'student' : 'students'} · {syllabus.length} chapters to teach
      </p>

      <JoinCode code={grade.join_code} />
      <Roster gradeId={gradeId} ageGroup={grade.age_group} roster={roster} onAdded={load} />
      <Exercises
        gradeId={gradeId} syllabus={syllabus} ageGroup={grade.age_group}
        exercises={exercises} onChanged={load}
      />
    </Shell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function JoinCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Card title="Class code">
      <p style={{ fontSize: 14, color: P.ink2, margin: '0 0 12px', lineHeight: 1.5 }}>
        Children type this with their own name the first time they sign in, then choose a password.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <code style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 28, fontWeight: 700, letterSpacing: '0.22em',
          color: P.ink, background: 'var(--paper)', border: `2px solid ${P.edge}`,
          borderRadius: 12, padding: '10px 18px',
        }}>{code}</code>
        <button onClick={() => {
          navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600) })
        }} style={btnQuiet}>{copied ? 'Copied ✓' : 'Copy'}</button>
      </div>
      {/* ⚠️ Said out loud because it is true and a teacher should know: this code is the only thing
          in front of an unclaimed child's account. */}
      <p style={{ fontSize: 12.5, color: P.ink3, margin: '12px 0 0', lineHeight: 1.5 }}>
        Anyone with this code can set the password for a child who has not signed in yet. Share it
        with your class, not publicly.
      </p>
    </Card>
  )
}

function Roster({ gradeId, ageGroup, roster, onAdded }: {
  gradeId: string; ageGroup: AgeGroup; roster: LearnerWithRole[]; onAdded: () => void
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const names = parseRoster(text)

  async function add() {
    if (!names.length) return
    setBusy(true); setNote(null)
    const { added, skipped } = await addRoster(gradeId, ageGroup, names)
    setBusy(false)
    setText('')
    setNote(added
      ? `Added ${added}${skipped ? ` · skipped ${skipped} already on the list` : ''}`
      : 'Everyone on that list is already in this class')
    onAdded()
  }

  return (
    <Card title={`Students (${roster.length})`}>
      {roster.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {roster.map(l => (
            <li key={l.id} style={{
              fontSize: 13.5, fontWeight: 700, color: P.ink, background: 'var(--paper)',
              border: `1.5px solid ${P.edge}`, borderRadius: 999, padding: '6px 13px',
            }}>{l.display_name}</li>
          ))}
        </ul>
      )}

      <label htmlFor="roster" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: P.ink2, marginBottom: 6 }}>
        Add students
      </label>
      {/* ⚠️ PASTE IS THE WHOLE FEATURE, AND IT IS DELIBERATELY NOT A FILE UPLOAD. A column copied out
          of a spreadsheet arrives here as newline-separated names, so one textarea covers "upload
          the class list" and "type them in" with no parser, no dependency and no upload surface. */}
      <textarea
        id="roster" value={text} onChange={e => { setText(e.target.value); setNote(null) }}
        rows={4} placeholder={'Paste a column from your spreadsheet, or type one name per line:\n\nAarav\nBeatriz\nChen'}
        style={{
          width: '100%', padding: '12px 14px', fontSize: 15, lineHeight: 1.5, borderRadius: 14,
          border: `2px solid ${P.edge}`, outline: 'none', boxSizing: 'border-box', resize: 'vertical',
          fontFamily: 'inherit', background: 'var(--paper)', color: P.ink,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        <button onClick={add} disabled={!names.length || busy} style={names.length && !busy ? btnPrimary : btnDisabled}>
          {busy ? 'Adding…' : names.length ? `Add ${names.length}` : 'Add'}
        </button>
        {names.length > 0 && !busy && (
          <span style={{ fontSize: 13, color: P.ink3 }}>{names.slice(0, 3).join(', ')}{names.length > 3 ? ` +${names.length - 3} more` : ''}</span>
        )}
        {note && <span style={{ fontSize: 13, fontWeight: 700, color: P.accent }}>{note}</span>}
      </div>
    </Card>
  )
}

function Exercises({ gradeId, syllabus, ageGroup, exercises, onChanged }: {
  gradeId: string; syllabus: ChapterType[]; ageGroup: AgeGroup
  exercises: ExerciseSummary[]; onChanged: () => void
}) {
  // The topics she may set are the chapters she chose to teach; if she has chosen none yet, the
  // whole band is offered rather than an empty list she cannot act on.
  const topics = syllabus.length ? syllabus : chaptersForAge(ageGroup).map(c => c.id)
  const [topic, setTopic]   = useState<ChapterType>(topics[0])
  const [count, setCount]   = useState(10)
  const [level, setLevel]   = useState<1 | 2 | 3>(1)
  const [busy, setBusy]     = useState(false)

  async function create() {
    setBusy(true)
    await createExercise(gradeId, topic, count, level)
    setBusy(false)
    onChanged()
  }

  return (
    <Card title="Exercises">
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr', marginBottom: 18 }}>
        <div>
          <label htmlFor="topic" style={fieldLabel}>Topic</label>
          <select id="topic" value={topic} onChange={e => setTopic(e.target.value as ChapterType)} style={field}>
            {topics.map(t => <option key={t} value={t}>{CHAPTER_EMOJIS[t] ?? '📘'} {CHAPTER_NAMES[t] ?? t}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 140px' }}>
            <label htmlFor="count" style={fieldLabel}>Questions</label>
            <input id="count" type="number" min={1} max={50} value={count}
                   onChange={e => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} style={field} />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label htmlFor="level" style={fieldLabel}>Difficulty</label>
            <select id="level" value={level} onChange={e => setLevel(Number(e.target.value) as 1 | 2 | 3)} style={field}>
              {DIFFICULTY.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
            </select>
          </div>
        </div>
        <button onClick={create} disabled={busy} style={busy ? btnDisabled : btnPrimary}>
          {busy ? 'Creating…' : 'Create exercise (locked)'}
        </button>
        <p style={{ fontSize: 12.5, color: P.ink3, margin: 0, lineHeight: 1.5 }}>
          New work starts locked. Children cannot see it at all until you unlock it.
        </p>
      </div>

      {exercises.length === 0
        ? <p style={{ fontSize: 14, color: P.ink3, margin: 0 }}>No exercises yet.</p>
        : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {exercises.map(ex => {
              const open = !!ex.unlocked_at
              return (
                <li key={ex.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                  padding: '12px 14px', borderRadius: 14, background: 'var(--paper)',
                  border: `2px solid ${open ? P.accent : P.edge}`,
                }}>
                  <span style={{ flex: '1 1 180px', minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: P.ink }}>
                      {CHAPTER_EMOJIS[ex.topic] ?? '📘'} {CHAPTER_NAMES[ex.topic] ?? ex.topic}
                    </span>
                    <span style={{ display: 'block', fontSize: 12.5, color: P.ink3, marginTop: 2 }}>
                      {ex.question_count} questions · {DIFFICULTY[ex.difficulty - 1]}
                      {open && ` · ${ex.doneCount} done`}
                      {open && ex.doneCount > 0 && ` · ${Math.round(100 * ex.correctSum / Math.max(1, ex.correctSum + ex.wrongSum))}% right`}
                    </span>
                  </span>
                  <button onClick={async () => { await setExerciseUnlocked(ex.id, !open); onChanged() }}
                          style={open ? btnQuiet : btnPrimary}>
                    {open ? 'Lock' : 'Unlock'}
                  </button>
                  <button onClick={async () => { await deleteExercise(ex.id); onChanged() }}
                          aria-label={`Delete ${CHAPTER_NAMES[ex.topic] ?? ex.topic} exercise`} style={btnDanger}>🗑</button>
                </li>
              )
            })}
          </ul>
        )}
    </Card>
  )
}

// ─── chrome ──────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100dvh', background: P.page, padding: '22px 18px 60px' }}>
      <div style={{ maxWidth: 660, margin: '0 auto' }}>{children}</div>
    </main>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      background: P.card, border: `1px solid ${P.edge}`, borderRadius: 18,
      padding: '18px 18px 20px', marginBottom: 16,
    }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: P.ink, margin: '0 0 12px' }}>{title}</h2>
      {children}
    </section>
  )
}

const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: P.ink2, marginBottom: 6 }
const field: React.CSSProperties = {
  width: '100%', padding: '11px 13px', fontSize: 15, fontWeight: 600, borderRadius: 12,
  border: `2px solid ${P.edge}`, outline: 'none', boxSizing: 'border-box',
  background: 'var(--paper)', color: P.ink,
}
const btnBase: React.CSSProperties = { border: 'none', borderRadius: 50, padding: '11px 20px', fontSize: 14.5, fontWeight: 800, cursor: 'pointer' }
const btnPrimary:  React.CSSProperties = { ...btnBase, background: P.accent, color: '#fff' }
const btnQuiet:    React.CSSProperties = { ...btnBase, background: 'transparent', color: P.ink2, border: `1.5px solid ${P.edge}` }
const btnDisabled: React.CSSProperties = { ...btnBase, background: 'var(--paper)', color: P.ink3, cursor: 'default' }
const btnGhost:    React.CSSProperties = { ...btnQuiet, padding: '8px 14px', fontSize: 13 }
const btnDanger:   React.CSSProperties = { ...btnBase, background: 'transparent', color: '#DC2626', border: '1.5px solid #FCA5A5', padding: '10px 13px' }
