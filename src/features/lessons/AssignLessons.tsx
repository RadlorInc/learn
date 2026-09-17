'use client'
/**
 * Assign lessons (parent dashboard): pick a child, pick topics and a due date. The child then sees ONLY the assigned
 * topics (founder's call, 2026-09-17), each showing its due date. The list is `learners.lesson_ids`, the dates
 * `learners.lesson_due`; only the parent who added the child can save — the database refuses anyone else.
 */
import { useState } from 'react'
import { MODULES, GRADES, findLesson } from './modules'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { assign as addTo, unassign, assignmentStatus, localDay, showDay } from './progressReport'
import { panel, field, btn, ghost } from './LessonLibrary'
import type { SaveResult } from './TopicPicker'

export interface AssignLearner { id: string; name: string; lessonIds: string[] | null; due: Record<string, string>; canEdit: boolean }

const ORDER = MODULES.flatMap(m => m.lessons.map(l => l.id))

export function AssignLessons({ learners, onSave }: {
  learners: AssignLearner[]
  onSave: (learnerId: string, ids: string[] | null, due: Record<string, string>) => Promise<SaveResult>
}) {
  const [who, setWho] = useState(learners[0]?.id ?? '')
  const [grade, setGrade] = useState(GRADES[0])
  const [moduleId, setModuleId] = useState(MODULES.find(m => m.grade === GRADES[0] && m.lessons.length)?.id ?? '')
  const [picked, setPicked] = useState<string[]>([])
  const [dueOn, setDueOn] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const child = learners.find(l => l.id === who) ?? learners[0]
  if (!child) return <><h1 style={h1}>Assign lessons</h1><div style={panel}>Add a learner first.</div></>
  const today = localDay(new Date())
  const modules = MODULES.filter(m => m.grade === grade && m.lessons.length > 0)
  const mod = modules.find(m => m.id === moduleId) ?? modules[0]
  const assigned = child.lessonIds ?? []

  async function save(ids: string[] | null, due: Record<string, string>, text: string) {
    setBusy(true); setMsg(null)
    const r = await onSave(child.id, ids, due)
    setBusy(false)
    if (r === 'ok') setPicked([])
    setMsg(r === 'ok' ? { ok: true, text }
      : r === 'not_ready' ? { ok: false, text: 'Assigning lessons needs a database update that has not been applied yet. Nothing was saved.' }
      : { ok: false, text: `Could not save. Only the parent who added ${child.name} can assign their lessons.` })
  }

  function assign() {
    const next = addTo(ORDER, { ids: child.lessonIds, due: child.due }, picked, dueOn)
    const n = picked.length
    save(next.ids, next.due, `Assigned ${n} lesson${n === 1 ? '' : 's'} to ${child.name}${dueOn ? `, due ${showDay(dueOn)}` : ''}.`)
  }

  function remove(id: string) {
    const next = unassign({ ids: child.lessonIds, due: child.due }, id)
    save(next.ids, next.due, next.ids ? `Removed “${findLesson(id)?.lesson.title}”.` : `${child.name} sees every topic again.`)
  }

  const counts = { done: 0, late: 0, due: 0, open: 0 }
  for (const id of assigned) counts[assignmentStatus(lessonDone(child.id, id), child.due[id], today)]++

  return (
    <>
      <h1 style={h1}>Assign lessons</h1>
      <p style={{ margin: '0 0 16px', color: 'var(--ink-soft)', fontSize: 14 }}>
        Pick lessons and a due date. {child.name} will see only the lessons you assign.
      </p>

      <div style={{ ...panel, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label htmlFor="as-who" style={label}>Learner</label>
          <select id="as-who" value={child.id} onChange={e => { setWho(e.target.value); setPicked([]); setMsg(null) }} style={{ ...field, width: 'auto', minWidth: 160 }}>
            {learners.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        {!child.canEdit && <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Only the parent who added {child.name} can assign their lessons.</div>}
        {msg && <div role="status" style={{ fontSize: 14, fontWeight: 700, color: msg.ok ? '#157347' : '#B42318' }}>{msg.ok ? '✅ ' : ''}{msg.text}</div>}
      </div>

      <div className="home-two">
        <section style={panel} aria-label="Add lessons">
          <h2 style={h2}>Add lessons</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <label style={label}>Grade
              <select value={grade} onChange={e => { const g = Number(e.target.value); setGrade(g); setModuleId(MODULES.find(m => m.grade === g && m.lessons.length)?.id ?? ''); setPicked([]) }} style={{ ...field, marginTop: 4 }}>
                {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </label>
            <label style={{ ...label, flex: 1, minWidth: 200 }}>Module
              <select value={mod?.id} onChange={e => { setModuleId(e.target.value); setPicked([]) }} style={{ ...field, marginTop: 4 }}>
                {modules.map(m => <option key={m.id} value={m.id}>{m.n}. {m.title}</option>)}
              </select>
            </label>
          </div>
          {mod && <>
            <button type="button" style={{ ...ghost, alignSelf: 'flex-start' }}
              onClick={() => setPicked(p => p.length === mod.lessons.length ? [] : mod.lessons.map(l => l.id))}>
              {picked.length === mod.lessons.length ? 'Clear' : 'Pick every topic'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mod.lessons.map((l, i) => (
                <label key={l.id} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: 'var(--ink)', minHeight: 36 }}>
                  <input type="checkbox" checked={picked.includes(l.id)} style={{ width: 20, height: 20 }}
                    onChange={e => setPicked(p => e.target.checked ? [...p, l.id] : p.filter(x => x !== l.id))} />
                  <span style={{ flex: 1 }}>{i + 1}. {l.title}</span>
                  {assigned.includes(l.id) && <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 700 }}>assigned</span>}
                </label>
              ))}
            </div>
          </>}
          <label style={label}>Due date (optional)
            <input type="date" value={dueOn} min={today} onChange={e => setDueOn(e.target.value)} style={{ ...field, marginTop: 4 }} />
          </label>
          <button type="button" style={{ ...btn, alignSelf: 'flex-start' }} disabled={!child.canEdit || busy || picked.length === 0} onClick={assign}>
            {busy ? 'Saving…' : picked.length ? `Assign ${picked.length} lesson${picked.length === 1 ? '' : 's'}` : 'Assign lessons'}
          </button>
        </section>

        <section style={panel} aria-label="Assigned lessons">
          <h2 style={h2}>{child.name}&apos;s lessons</h2>
          {assigned.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>Nothing assigned yet, so {child.name} sees every topic.</p>
          ) : <>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)', fontWeight: 700 }}>
              {counts.done} done · {counts.due + counts.open} to do{counts.late ? ` · ${counts.late} late` : ''}
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {assigned.map(id => {
                const found = findLesson(id)
                const st = assignmentStatus(lessonDone(child.id, id), child.due[id], today)
                return (
                  <li key={id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{found?.lesson.title ?? id}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Grade {found?.module.grade} · {found?.module.title}</div>
                    </div>
                    <span style={{ ...pill, ...PILL[st] }}>
                      {st === 'done' ? '✓ Done' : st === 'late' ? `Late · was due ${showDay(child.due[id])}` : st === 'due' ? `Due ${showDay(child.due[id])}` : 'No due date'}
                    </span>
                    {child.canEdit && <button type="button" disabled={busy} onClick={() => remove(id)} style={{ ...ghost, minHeight: 36, padding: '6px 10px' }}>Remove</button>}
                  </li>
                )
              })}
            </ul>
            {child.canEdit && <button type="button" disabled={busy} style={{ ...ghost, alignSelf: 'flex-start' }}
              onClick={() => save(null, {}, `${child.name} sees every topic again.`)}>Clear the list · show every topic</button>}
          </>}
        </section>
      </div>
    </>
  )
}

const h1 = { margin: '0 0 4px', fontSize: 28, fontWeight: 900, color: 'var(--ink)', fontFamily: 'var(--font-display)' } as const
const h2 = { margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--ink)' } as const
const label = { fontSize: 14, fontWeight: 700, color: 'var(--ink)', display: 'flex', flexDirection: 'column' } as const
const pill = { fontSize: 12, fontWeight: 800, borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap' } as const
export const PILL = {
  done: { background: '#d9f7e6', color: '#157347' },
  late: { background: '#FDE8E8', color: '#B42318' },
  due: { background: 'var(--milo-orange-soft)', color: 'var(--ink)' },
  open: { background: 'var(--paper)', color: 'var(--ink-soft)' },
} as const
