'use client'
/**
 * The parent's lesson library: every module, narrowed by grade and search, each one added to or removed from the chosen
 * child's list (`learners.lesson_ids`). Only the parent who created the child can save — the database refuses anyone
 * else, so the buttons are disabled for a viewer rather than failing on tap.
 */
import { useState, type CSSProperties } from 'react'
import { MODULES, GRADES, hasModule, withModule, searchModule } from './modules'
import type { SaveResult } from './TopicPicker'

export interface LibraryLearner { id: string; name: string; lessonIds: string[] | null; canEdit: boolean }

export function LessonLibrary({ learners, onSave }: {
  learners: LibraryLearner[]
  onSave: (learnerId: string, ids: string[] | null) => Promise<SaveResult>
}) {
  const [grade, setGrade] = useState<number | null>(null)
  const [q, setQ] = useState('')
  const [who, setWho] = useState(learners[0]?.id ?? '')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const child = learners.find(l => l.id === who) ?? learners[0]
  const every = !child?.lessonIds?.length
  const shown = MODULES.filter(m => m.lessons.length > 0 && (grade === null || m.grade === grade))
    .map(m => ({ m, ...searchModule(m, q) })).filter(x => x.hit)

  async function save(ids: string[] | null, key: string, text: string) {
    if (!child) return
    setBusy(key); setMsg(null)
    const r = await onSave(child.id, ids)
    setBusy(null)
    setMsg(r === 'ok' ? { ok: true, text }
      : r === 'not_ready' ? { ok: false, text: 'Choosing lessons needs a database update that has not been applied yet. Nothing was saved.' }
      : { ok: false, text: `Could not save. Only the parent who added ${child.name} can change their lessons.` })
  }

  return (
    <>
      <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>Lesson library</h1>
      <p style={{ margin: '0 0 16px', color: 'var(--ink-soft)', fontSize: 14 }}>Grades {GRADES[0]}–{GRADES[GRADES.length - 1]} · {MODULES.length} modules</p>

      <div style={{ ...panel, marginBottom: 14 }}>
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search modules and topics, e.g. fractions"
          aria-label="Search lessons" style={field} />
        <div role="tablist" aria-label="Grade" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[null, ...GRADES].map(g => (
            <button key={String(g)} type="button" role="tab" aria-selected={grade === g} onClick={() => setGrade(g)}
              style={{ ...chip, background: grade === g ? 'var(--ink)' : 'var(--paper-soft)', color: grade === g ? '#fff' : 'var(--ink)' }}>
              {g === null ? 'All grades' : `Grade ${g}`}
            </button>
          ))}
        </div>
        {learners.length > 0 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 14, color: 'var(--ink-soft)' }}>
            <label htmlFor="lib-who" style={{ fontWeight: 700 }}>Adding lessons for</label>
            <select id="lib-who" value={child?.id} onChange={e => { setWho(e.target.value); setMsg(null) }} style={{ ...field, width: 'auto', minWidth: 160 }}>
              {learners.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <span>{child?.name} sees {every ? 'every topic' : `${child!.lessonIds!.length} topic${child!.lessonIds!.length === 1 ? '' : 's'}`}</span>
            {!every && child?.canEdit && (
              <button type="button" disabled={busy !== null} onClick={() => save(null, 'every', `${child.name} sees every topic again.`)} style={ghost}>Show every topic</button>
            )}
          </div>
        )}
        {child && !child.canEdit && <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Only the parent who added {child.name} can change their lessons.</div>}
        {msg && <div role="status" style={{ fontSize: 14, fontWeight: 700, color: msg.ok ? '#157347' : '#B42318' }}>{msg.ok ? '✅ ' : ''}{msg.text}</div>}
      </div>

      <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700 }}>{shown.length} module{shown.length === 1 ? '' : 's'}</p>
      {shown.length === 0 && <div style={panel}>No lessons match “{q}”.</div>}
      <div className="card-grid">
        {shown.map(({ m, topics }) => {
          const inList = !every && child ? hasModule(child.lessonIds, m) : false
          return (
            <div key={m.id} style={{ ...panel, gap: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 700 }}>Grade {m.grade} · Module {m.n}</div>
              <h3 style={{ margin: 0, fontSize: 17, color: 'var(--ink)' }}>{m.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>{m.lessons.length} topics</p>
              {topics.length > 0 && <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>Matches: {topics.slice(0, 3).join(' · ')}{topics.length > 3 ? ` +${topics.length - 3}` : ''}</p>}
              {child && (inList
                ? <button type="button" disabled={!child.canEdit || busy !== null} onClick={() => save(withModule(child.lessonIds, m, false), m.id, `Removed “${m.title}” from ${child.name}'s lessons.`)} style={{ ...ghost, alignSelf: 'flex-start' }}>
                    ✓ In {child.name}&apos;s lessons · Remove
                  </button>
                : <button type="button" disabled={!child.canEdit || busy !== null} onClick={() => save(withModule(child.lessonIds, m, true), m.id, `Added “${m.title}” to ${child.name}'s lessons.`)} style={{ ...btn, alignSelf: 'flex-start' }}>
                    {busy === m.id ? 'Adding…' : `+ Add to ${child.name}'s lessons`}
                  </button>)}
            </div>
          )
        })}
      </div>
    </>
  )
}

const panel: CSSProperties = { background: 'var(--paper-soft)', border: '1.5px solid var(--card-border)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }
const field: CSSProperties = { padding: '10px 14px', fontSize: 15, minHeight: 44, border: '2px solid var(--card-border)', borderRadius: 12, width: '100%', boxSizing: 'border-box', color: 'var(--ink)', background: '#fff' }
const btn: CSSProperties = { background: 'var(--milo-orange)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', minHeight: 44, fontSize: 14, fontWeight: 800, cursor: 'pointer' }
const ghost: CSSProperties = { ...btn, background: 'var(--paper-soft)', color: 'var(--ink)', border: '1.5px solid var(--card-border)' }
const chip: CSSProperties = { border: '1.5px solid var(--card-border)', borderRadius: 999, padding: '8px 14px', minHeight: 40, fontSize: 14, fontWeight: 800, cursor: 'pointer' }
