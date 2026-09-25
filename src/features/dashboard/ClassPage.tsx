'use client'
/**
 * Everything about one class in one place (founder, 2026-09-21): Students · Lessons · Exercises · Progress · Settings.
 * Replaces the class bar that sat on top of every screen and Class Home's row of buttons; the everyday parts are tabs
 * and Rename/Delete moved to Settings, away from them. Each tab is its own URL, so the browser's Back works.
 */
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState, type CSSProperties } from 'react'
import { deleteClass, type ClassRow } from '@/data/repositories'
import { MODULES, hasModule } from '@/features/lessons/modules'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { Performance } from '@/features/lessons/Performance'
import { AddStudents, ModulePicker, Rename } from '@/features/classes/Classes'
import { Tabs } from './ChildPage'
import { dbtn, dghost, dcard } from './Helpers'

// It carries every question ladder: loaded only when the Exercises tab opens.
const ExerciseEditor = dynamic(() => import('@/features/classes/ExerciseEditor').then(m => m.ExerciseEditor), { ssr: false })

export const CLASS_TABS = [['students', 'Students'], ['lessons', 'Lessons'], ['exercises', 'Exercises'], ['progress', 'Progress'], ['settings', 'Settings']] as const
export type ClassTab = typeof CLASS_TABS[number][0]

export function ClassPage({ cls, tab, paid, students, logins, onLogin, onChanged, onStudentsAdded, onUpdate, onDeleted }: {
  cls: ClassRow; tab: ClassTab; paid: boolean
  students: { id: string; name: string; lessonIds: string[] | null; due: Record<string, string> }[]
  logins: Record<string, string> | null; onLogin: (learnerId: string) => void
  onChanged: () => void; onStudentsAdded: () => void; onUpdate: (c: ClassRow) => void; onDeleted: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const base = `/parent?class=${cls.id}`
  const chosen = MODULES.filter(m => m.lessons.length && cls.lesson_ids?.length && hasModule(cls.lesson_ids, m))

  return <>
    <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 800 }}>
      <Link href="/parent" style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>Classes</Link>
      <span style={{ color: 'var(--ink-muted)' }}> › {cls.name}</span></p>
    <h1 style={{ margin: 0, fontSize: 30, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{cls.name}</h1>
    <p style={{ margin: '2px 0 0', color: 'var(--ink-soft)', fontWeight: 700 }}>Grade {cls.grade} · {students.length} student{students.length === 1 ? '' : 's'}</p>
    <Tabs base={base} tabs={CLASS_TABS} on={tab} />

    {tab === 'students' && <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={dbtn} data-tour="add-students" onClick={() => setAdding(!adding)}>{adding ? 'Close' : '+ Add students'}</button>
      </div>
      {adding && <div style={{ ...dcard, marginBottom: 14 }}><AddStudents cls={cls} onAdded={onStudentsAdded} onDone={() => { setAdding(false); onChanged() }} /></div>}
      {students.length === 0
        ? <div style={dcard}><p style={{ margin: 0, color: 'var(--ink-soft)' }}>No students yet. Add one, or upload a list of usernames and each student gets a temporary password.</p></div>
        : <section style={dcard} data-tour="roster">
          {/* A list, not a table: it fits a phone with the button always in view. */}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{students.map((s, k) => {
            const user = logins?.[s.id]
            const done = (s.lessonIds ?? []).filter(id => lessonDone(s.id, id)).length
            return (
              <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 0', borderTop: k ? '1px solid var(--card-border)' : 0 }}>
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <Link href={`/parent?child=${s.id}`} style={{ fontWeight: 800, color: 'var(--ink)' }}>{s.name}</Link>
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700, marginTop: 2 }}>
                    {user ? `@${user}` : logins === null ? '' : <span className="home-pill" style={{ background: '#eaf5fe', color: 'var(--ink)' }}>No login</span>}
                    {` · ${done} lesson${done === 1 ? '' : 's'} done`}
                  </div>
                </div>
                <button type="button" style={small} data-tour={user ? undefined : 'new-pw'} onClick={() => onLogin(s.id)}>{user ? 'New password' : 'Set up login'}</button>
              </li>
            )
          })}</ul>
        </section>}
    </>}

    {tab === 'lessons' && (paid ? (
      <section style={dcard} data-tour="lessons-what">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div><h2 style={h2}>What {cls.name} sees</h2>
            <p style={{ margin: '2px 0 0', color: 'var(--ink-soft)' }}>{chosen.length ? `${chosen.length} module${chosen.length === 1 ? '' : 's'}. Students you add later get them too.` : 'Every topic in every grade, until you choose modules.'}</p></div>
          {!choosing && <button type="button" style={dghost} onClick={() => setChoosing(true)}>Change</button>}
        </div>
        {!choosing && chosen.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {chosen.map(m => <li key={m.id} style={{ padding: '8px 12px', borderRadius: 10, background: '#fff', border: '1px solid var(--card-border)', fontWeight: 800, color: 'var(--ink)' }}>Grade {m.grade} · {m.title}</li>)}
          </ul>
        )}
        {choosing && <ModulePicker cls={cls} onDone={() => { setChoosing(false); onChanged() }} />}
      </section>
    ) : (
      <div style={dcard}><p style={{ margin: 0, color: 'var(--ink-soft)' }}>Free plan: your students see the class exercises only. Modules for students come with the classroom plan.</p></div>
    ))}

    {tab === 'exercises' && <div data-tour="exercises"><ExerciseEditor cls={cls} students={students.map(s => ({ id: s.id, name: s.name }))} onUpdate={onUpdate} /></div>}

    {tab === 'progress' && <Performance learners={students} />}

    {tab === 'settings' && (
      <div className="card-grid">
        <section style={dcard}><h2 style={h2}>Class name</h2><Rename cls={cls} onDone={onChanged} /></section>
        <section style={dcard}>
          <h2 style={h2}>Delete this class</h2>
          <p style={{ margin: '6px 0 12px', color: 'var(--ink-soft)' }}>The students, their logins and their lessons stay — they just won’t be in a class.</p>
          {confirm
            ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={{ ...dbtn, background: '#DC2626' }} onClick={async () => { if (await deleteClass(cls.id)) onDeleted() }}>Yes, delete {cls.name}</button>
                <button type="button" style={dghost} onClick={() => setConfirm(false)}>Cancel</button></div>
            : <button type="button" style={{ ...dghost, color: '#B42318' }} onClick={() => setConfirm(true)}>Delete class</button>}
        </section>
      </div>
    )}
  </>
}

const h2: CSSProperties = { margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--ink)' }
const small: CSSProperties = { ...dghost, minHeight: 36, padding: '6px 10px' }

/** A class's card on the teacher's home. */
export function ClassCard({ cls, paid, students }: { cls: ClassRow; paid: boolean; students: number }) {
  const open = cls.exercises.filter(e => e.open !== false).length
  const mods = MODULES.filter(m => m.lessons.length && cls.lesson_ids?.length && hasModule(cls.lesson_ids, m)).length
  const dt: CSSProperties = { color: 'var(--ink-muted)', fontWeight: 800 }, dd: CSSProperties = { margin: 0, fontWeight: 700, color: 'var(--ink)' }
  return (
    <article style={dcard} data-tour={`class-${cls.id}`}>
      <h2 style={{ ...h2, fontSize: 20 }}>{cls.name}</h2>
      <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700 }}>Grade {cls.grade}</div>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', margin: '12px 0', fontSize: 14 }}>
        <dt style={dt}>Students</dt><dd style={dd}>{students}</dd>
        {paid && <><dt style={dt}>Modules</dt><dd style={dd}>{mods ? `${mods} chosen` : 'every topic'}</dd></>}
        <dt style={dt}>Exercises</dt><dd style={dd}>{cls.exercises.length ? `${cls.exercises.length}${open ? ` · ${open} open now` : ' · all locked'}` : 'none yet'}</dd>
      </dl>
      <Link href={`/parent?class=${cls.id}&tab=students`} style={dbtn}>Open {cls.name}</Link>
    </article>
  )
}
