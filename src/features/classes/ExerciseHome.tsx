'use client'
/**
 * The home of a child whose teacher has not paid (founder, 2026-09-18): their class's exercises and nothing else — no
 * lessons, no adaptive practice. Each exercise is the same list for every child in the class (./exercise.ts), played on
 * the same practice screen as a module's, with its adaptive parts switched off.
 * "Done" is remembered on this device only — a convenience for the child, not a record the teacher reads.
 */
import { useState } from 'react'
import { ModulePractice } from '@/features/lessons/ModulePractice'
import { findModule } from '@/features/lessons/modules'
import { INK, TEAL, PAGE_BG, shell, topBar, pill } from '@/features/lessons/Pictures'
import { bubble } from '@/features/lessons/Frame'
import { exerciseItems, type Exercise } from './exercise'

const doneKey = (learnerId: string | null, id: string) => `exercise-done:${learnerId ?? 'none'}:${id}`
const isDone = (learnerId: string | null, id: string) => { try { return localStorage.getItem(doneKey(learnerId, id)) === '1' } catch { return false } }
const markDone = (learnerId: string | null, id: string) => { try { localStorage.setItem(doneKey(learnerId, id), '1') } catch { /* private mode */ } }

export function ExerciseHome({ learnerId, className, exercises, back }: {
  learnerId: string | null; className: string; exercises: Exercise[]; back?: { onClick: () => void; label: string }
}) {
  const [playing, setPlaying] = useState<number | null>(null)
  const [, redraw] = useState(0)

  if (playing !== null) {
    const ex = exercises[playing], m = findModule(ex.module)!
    const title = `Exercise ${playing + 1}`
    return <ModulePractice module={m} learnerId={learnerId} exercise={{ title, items: exerciseItems(ex) }}
      onExit={() => { markDone(learnerId, ex.id); setPlaying(null); redraw(n => n + 1) }} />
  }

  const list = exercises.filter(ex => findModule(ex.module) && exerciseItems({ ...ex, count: 1 }).length)
  return (
    <div style={{ minHeight: '100dvh', background: PAGE_BG, padding: '14px 14px 26px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ ...shell, maxWidth: 820, alignSelf: 'flex-start' }}>
        <div style={topBar}>
          <span>✏️ {className} · Exercises</span>
          {back && <button type="button" onClick={back.onClick} style={{ ...pill, minHeight: 40 }}>{back.label}</button>}
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {list.length === 0 ? (
            <p style={bubble}>Your teacher has not set any exercises yet. Check back soon!</p>
          ) : list.map(ex => {
            const m = findModule(ex.module)!, n = exercises.indexOf(ex), done = isDone(learnerId, ex.id)
            return (
              <div key={ex.id} style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', background: '#fff', border: `4px solid ${INK}`, borderRadius: 20, padding: '14px 16px' }}>
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: INK }}>Exercise {n + 1}{done ? ' ✓' : ''}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 2 }}>Grade {m.grade} · {m.title}</div>
                  <div style={{ fontSize: 15, color: '#6d4c3d', marginTop: 2 }}>{ex.count} question{ex.count === 1 ? '' : 's'} · Level {ex.level}</div>
                </div>
                <button type="button" onClick={() => setPlaying(n)}
                  style={{ minHeight: 56, padding: '10px 22px', borderRadius: 16, border: `4px solid ${INK}`, background: TEAL, color: '#fff', fontSize: 20, fontWeight: 900, cursor: 'pointer' }}>
                  {done ? 'Do again' : 'Start'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
