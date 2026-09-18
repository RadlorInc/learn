'use client'
/**
 * The home of a child whose teacher has not paid (founder, 2026-09-18): their class's exercises and nothing else — no
 * lessons, no adaptive practice. Each exercise is the same list for every child in the class (./exercise.ts), played on
 * the same practice screen as a module's, with its adaptive parts switched off.
 * A LOCKED exercise shows but cannot be started: the teacher opens it when it is time for the test.
 * A finished attempt is sent to the teacher (`exercise_results`); if that fails (offline), it waits on this device and
 * is sent the next time this screen opens. "Done ✓" is remembered on this device too.
 */
import { useEffect, useState } from 'react'
import { saveExerciseResult, type ExerciseOutcome } from '@/data/repositories'
import { ModulePractice } from '@/features/lessons/ModulePractice'
import { findModule } from '@/features/lessons/modules'
import { INK, TEAL, PAGE_BG, shell, topBar, pill } from '@/features/lessons/Pictures'
import { bubble } from '@/features/lessons/Frame'
import { exerciseItems, isOpen, type Exercise } from './exercise'

const doneKey = (learnerId: string | null, id: string) => `exercise-done:${learnerId ?? 'none'}:${id}`
const isDone = (learnerId: string | null, id: string) => { try { return localStorage.getItem(doneKey(learnerId, id)) === '1' } catch { return false } }
const markDone = (learnerId: string | null, id: string) => { try { localStorage.setItem(doneKey(learnerId, id), '1') } catch { /* private mode */ } }

/** Results that could not be sent yet, oldest first. */
type Pending = { learnerId: string; classId: string; exerciseId: string; outcomes: ExerciseOutcome[] }
const PENDING = 'exercise-results-pending'
const readPending = (): Pending[] => { try { return JSON.parse(localStorage.getItem(PENDING) ?? '[]') } catch { return [] } }
const writePending = (p: Pending[]) => { try { localStorage.setItem(PENDING, JSON.stringify(p)) } catch { /* private mode */ } }
async function flushPending(): Promise<number> {
  const left: Pending[] = []
  // Only a failure that might pass later is kept; a refusal (locked again, deleted) is dropped rather than retried forever.
  for (const p of readPending()) if ((await saveExerciseResult(p.learnerId, p.classId, p.exerciseId, p.outcomes)) === 'failed') left.push(p)
  writePending(left)
  return left.length
}

export function ExerciseHome({ learnerId, classId, className, exercises, back }: {
  learnerId: string | null; classId: string | null; className: string; exercises: Exercise[]; back?: { onClick: () => void; label: string }
}) {
  // The exercise itself, not its place in the list: the list refreshes while a child plays, and a teacher may reorder it.
  const [playing, setPlaying] = useState<{ ex: Exercise; n: number } | null>(null)
  const [, redraw] = useState(0)
  const [unsent, setUnsent] = useState(0)
  useEffect(() => { flushPending().then(setUnsent) }, [])

  async function send(ex: Exercise, outcomes: ExerciseOutcome[]) {
    if (!learnerId || !classId) return                     // a preview with no child: nothing to send
    writePending([...readPending(), { learnerId, classId, exerciseId: ex.id, outcomes }])
    setUnsent(await flushPending())
  }

  if (playing) {
    const { ex } = playing, m = findModule(ex.module)!
    const title = `Exercise ${playing.n + 1}`
    return <ModulePractice module={m} learnerId={learnerId} exercise={{ title, items: exerciseItems(ex), onFinish: o => { void send(ex, o) } }}
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
          {unsent > 0 && <p role="status" style={{ ...bubble, fontSize: 16, background: '#fff1c9' }}>Your answers will be sent to your teacher when you are back online.</p>}
          {list.length === 0 ? (
            <p style={bubble}>Your teacher has not set any exercises yet. Check back soon!</p>
          ) : list.map(ex => {
            const m = findModule(ex.module)!, n = exercises.indexOf(ex), done = isDone(learnerId, ex.id), open = isOpen(ex)
            return (
              <div key={ex.id} style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', background: '#fff', border: `4px solid ${INK}`, borderRadius: 20, padding: '14px 16px' }}>
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: INK }}>Exercise {n + 1}{done ? ' ✓' : ''}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 2 }}>Grade {m.grade} · {m.title}</div>
                  <div style={{ fontSize: 15, color: '#6d4c3d', marginTop: 2 }}>{ex.count} question{ex.count === 1 ? '' : 's'} · Level {ex.level}</div>
                  {!open && <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginTop: 4 }}>🔒 Your teacher will open this one.</div>}
                </div>
                {open && (
                  <button type="button" onClick={() => setPlaying({ ex, n })}
                    style={{ minHeight: 56, padding: '10px 22px', borderRadius: 16, border: `4px solid ${INK}`, background: TEAL, color: '#fff', fontSize: 20, fontWeight: 900, cursor: 'pointer' }}>
                    {done ? 'Do again' : 'Start'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
