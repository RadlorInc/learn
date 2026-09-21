'use client'
/**
 * A child's Lessons tab (founder, 2026-09-21) — ONE screen where there used to be four (Lesson library, Assign lessons,
 * Choose topics, and the add-a-child module list), all of which wrote the same `learners.lesson_ids`.
 *
 * ⚠️ SAME CHOICES AS BEFORE — the founder's condition: every topic (null), or whole modules and single topics from ANY
 * grade; coming-soon modules cannot be ticked. In two parts so it stays calm: the tab shows only what the child sees,
 * and the choosing happens in a panel opened by "Change" (Save / Cancel).
 *
 * Due dates keep the storage rule: they live on a chosen list (`lesson_due`), and "every topic" has none — so adding a
 * date never narrows what the child sees, which is what Assign lessons used to do.
 */
import { useState, type CSSProperties } from 'react'
import { MODULES, GRADES, findLesson, searchModule } from '@/features/lessons/modules'
import { assignmentStatus, localDay, showDay } from '@/features/lessons/progressReport'
import { Sheet, dbtn, dghost, dcard, dlink } from './Helpers'

export type SaveResult = 'ok' | 'not_ready' | 'error'

const ORDER = MODULES.flatMap(m => m.lessons.map(l => l.id))
const h2: CSSProperties = { margin: 0, fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--ink)' }
const muted: CSSProperties = { fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700 }

/** "Aarav sees 2 whole modules and 3 single topics, from Grade 4 and 5." */
export function describe(ids: readonly string[] | null | undefined, name: string): string {
  if (!ids?.length) return `${name} sees every topic in every grade.`
  const set = new Set(ids)
  let whole = 0, singles = 0
  const grades = new Set<number>()
  for (const m of MODULES) {
    const n = m.lessons.filter(l => set.has(l.id)).length
    if (!n) continue
    grades.add(m.grade)
    if (n === m.lessons.length) whole++; else singles += n
  }
  const parts = [whole && `${whole} whole module${whole === 1 ? '' : 's'}`, singles && `${singles} single topic${singles === 1 ? '' : 's'}`].filter(Boolean)
  return `${name} sees ${parts.join(' and ')}, from Grade ${[...grades].sort((a, b) => a - b).join(' and ')}.`
}

export function LessonsTab({ name, ids, due, canEdit, isDone, onSave }: {
  name: string; ids: string[] | null; due: Record<string, string>; canEdit: boolean
  isDone: (lessonId: string) => boolean
  onSave: (ids: string[] | null, due: Record<string, string>) => Promise<SaveResult>
}) {
  const [choosing, setChoosing] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [adding, setAdding] = useState<{ id: string; day: string } | null>(null)
  const today = localDay(new Date())

  async function save(nextIds: string[] | null, nextDue: Record<string, string>, ok: string) {
    setMsg(null)
    const r = await onSave(nextIds, nextIds ? nextDue : {})
    setMsg(r === 'ok' ? { ok: true, text: ok }
      : r === 'not_ready' ? { ok: false, text: 'This needs a database update that has not been applied yet. Nothing was saved.' }
      : { ok: false, text: `Could not save. Only the parent who added ${name} can change their lessons.` })
    return r === 'ok'
  }

  const set = new Set(ids ?? [])
  const items = ids?.length ? MODULES.flatMap(m => {
    const n = m.lessons.filter(l => set.has(l.id)).length
    return n ? [{ m, n }] : []
  }) : []
  const dated = (ids ?? []).filter(id => due[id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section style={dcard} data-tour="lessons-what">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div><h2 style={h2}>What {name} sees</h2><p style={{ margin: '2px 0 0', color: 'var(--ink-soft)' }}>{describe(ids, name)}</p></div>
          {canEdit && <button type="button" style={dghost} onClick={() => { setMsg(null); setChoosing(true) }}>Change</button>}
        </div>
        {items.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.slice(0, 5).map(({ m, n }) => (
              <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '8px 12px', borderRadius: 10, background: '#fff', border: '1px solid var(--card-border)' }}>
                <b style={{ color: 'var(--ink)' }}>Grade {m.grade} · {m.title}</b>
                {n < m.lessons.length && <span style={muted}>{n} of {m.lessons.length} topics</span>}
              </li>
            ))}
            {items.length > 5 && <li><button type="button" style={dlink} onClick={() => setChoosing(true)}>+ {items.length - 5} more</button></li>}
          </ul>
        )}
        {!canEdit && <p style={{ ...muted, margin: '10px 0 0' }}>Only the parent who added {name} can change their lessons.</p>}
        {msg && <p role="status" style={{ margin: '10px 0 0', fontWeight: 800, color: msg.ok ? '#157347' : '#B42318' }}>{msg.text}</p>}
      </section>

      <section style={dcard} data-tour="lessons-due">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <h2 style={h2}>Due dates <span style={muted}>(optional)</span></h2>
          {canEdit && ids?.length ? <button type="button" style={dghost} onClick={() => setAdding({ id: ids.find(id => !due[id]) ?? ids[0], day: '' })}>+ Add</button> : null}
        </div>
        {!ids?.length ? (
          <p style={{ margin: '8px 0 0', color: 'var(--ink-soft)' }}>
            Due dates go on lessons you choose. {canEdit && <>Use <b>Change</b> above to choose {name}&apos;s lessons first.</>}
          </p>
        ) : <>
          {dated.length === 0 && !adding && <p style={{ margin: '8px 0 0', color: 'var(--ink-soft)' }}>None yet. A lesson with a date goes to the top of {name}&apos;s list.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {dated.map(id => {
              const st = assignmentStatus(isDone(id), due[id], today)
              return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 160, flex: 1 }}>
                    <b style={{ color: 'var(--ink)' }}>{findLesson(id)?.lesson.title ?? id}</b>
                    <div style={muted}>{st === 'done' ? '✓ Done' : st === 'late' ? `Was due ${showDay(due[id])}` : `Due ${showDay(due[id])}`}</div>
                  </div>
                  {canEdit && <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <label htmlFor={`due-${id}`} style={{ position: 'absolute', left: -9999 }}>Due date for {findLesson(id)?.lesson.title}</label>
                    <input id={`due-${id}`} type="date" value={due[id]} onChange={e => e.target.value && save(ids, { ...due, [id]: e.target.value }, 'Saved.')} style={field} />
                    <button type="button" style={dlink} onClick={() => { const d = { ...due }; delete d[id]; save(ids, d, 'Date removed.') }}>Remove</button>
                  </span>}
                </div>
              )
            })}
          </div>
          {adding && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 12 }}>
              <label style={{ ...muted, display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 220px' }}>Lesson
                <select value={adding.id} onChange={e => setAdding({ ...adding, id: e.target.value })} style={field}>
                  {ids.map(id => { const f = findLesson(id); return <option key={id} value={id}>{f ? `G${f.module.grade} · ${f.lesson.title}` : id}</option> })}
                </select></label>
              <label style={{ ...muted, display: 'flex', flexDirection: 'column', gap: 4 }}>Due
                <input type="date" value={adding.day} min={today} onChange={e => setAdding({ ...adding, day: e.target.value })} style={field} /></label>
              <button type="button" style={dbtn} disabled={!adding.day} onClick={async () => { if (await save(ids, { ...due, [adding.id]: adding.day }, 'Due date added.')) setAdding(null) }}>Add</button>
              <button type="button" style={dlink} onClick={() => setAdding(null)}>Cancel</button>
            </div>
          )}
        </>}
      </section>

      {choosing && <Chooser name={name} initial={ids} onClose={() => setChoosing(false)}
        onSave={async next => {
          const kept = Object.fromEntries(Object.entries(due).filter(([id]) => next?.includes(id)))
          if (await save(next, kept, `Saved. ${describe(next, name)}`)) setChoosing(false)
        }} />}
    </div>
  )
}

/** The panel behind "Change": every topic, or whole modules and single topics from any grade. */
function Chooser({ name, initial, onClose, onSave }: {
  name: string; initial: string[] | null; onClose: () => void; onSave: (ids: string[] | null) => Promise<void>
}) {
  const [every, setEvery] = useState(!initial?.length)
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(initial ?? []))
  const [grade, setGrade] = useState(() => MODULES.find(m => m.lessons.some(l => initial?.includes(l.id)))?.grade ?? GRADES[0])
  const [open, setOpen] = useState<string | null>(null)
  const [q, setQ] = useState('')   // the old library's search, kept: module and topic titles, every grade
  const [busy, setBusy] = useState(false)
  const toggle = (ids: string[], on: boolean) => setChosen(prev => { const n = new Set(prev); for (const id of ids) n[on ? "add" : "delete"](id); return n })
  const draft = every ? null : ORDER.filter(id => chosen.has(id))

  return (
    <Sheet open onClose={onClose} label={`Choose what ${name} learns`}>
      <h2 style={{ ...h2, fontSize: 22 }}>Choose what {name} learns</h2>
      <p style={{ margin: '4px 0 14px', fontWeight: 800, color: 'var(--ink)' }}>{draft && !draft.length ? `${name} can’t see any lessons yet.` : describe(draft, name)}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div><b style={{ color: 'var(--ink)' }}>Every topic</b><div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Every module in every grade, now and later.</div></div>
        <button type="button" role="switch" aria-checked={every} aria-label="Every topic" onClick={() => setEvery(!every)}
          style={{ width: 52, height: 30, borderRadius: 99, border: 0, flexShrink: 0, cursor: 'pointer', position: 'relative', background: every ? '#157347' : '#d9ccb8' }}>
          <span style={{ position: 'absolute', top: 3, left: every ? 25 : 3, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
        </button>
      </div>
      {!every && <>
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search modules and topics, e.g. fractions" aria-label="Search lessons"
          style={{ ...field, width: '100%', boxSizing: 'border-box', marginBottom: 10 }} />
        {!q.trim() && <div role="group" aria-label="Grade" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {GRADES.map(g => {
            const n = MODULES.filter(m => m.grade === g).flatMap(m => m.lessons).filter(l => chosen.has(l.id)).length
            return <button key={g} type="button" aria-pressed={g === grade} onClick={() => { setGrade(g); setOpen(null) }}
              style={{ padding: '6px 14px', minHeight: 40, borderRadius: 999, border: '2px solid', borderColor: g === grade ? 'var(--milo-orange)' : 'var(--card-border)', background: g === grade ? 'var(--milo-orange-soft)' : 'var(--paper-soft)', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: 'var(--ink)' }}>
              Grade {g}{n > 0 ? ` · ${n}` : ''}</button>
          })}
        </div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.trim() && !MODULES.some(m => searchModule(m, q).hit) && <p style={{ margin: 0, color: 'var(--ink-soft)' }}>No lessons match “{q}”.</p>}
          {MODULES.filter(m => q.trim() ? searchModule(m, q).hit : m.grade === grade).map(m => {
            const hits = q.trim() ? searchModule(m, q).topics : []
            const ids = m.lessons.map(l => l.id), on = ids.filter(id => chosen.has(id)).length, soon = !ids.length, isOpen = open === m.id || hits.length > 0
            return (
              <div key={m.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', minHeight: 44, border: '1.5px solid var(--card-border)', borderRadius: 12, background: '#fff', opacity: soon ? 0.55 : 1 }}>
                  <input id={`mod-${m.id}`} type="checkbox" disabled={soon} checked={!soon && on === ids.length}
                    ref={el => { if (el) el.indeterminate = on > 0 && on < ids.length }} onChange={e => toggle(ids, e.target.checked)} style={box} />
                  <label htmlFor={`mod-${m.id}`} style={{ flex: 1, fontWeight: 800, color: 'var(--ink)', cursor: soon ? 'default' : 'pointer' }}>{q.trim() ? `Grade ${m.grade} · ` : ''}Module {m.n} · {m.title}</label>
                  <span style={muted}>{soon ? 'coming soon' : on && on < ids.length ? `${on} of ${ids.length}` : `${ids.length} topics`}</span>
                  {!soon && <button type="button" aria-expanded={isOpen} aria-label={`${isOpen ? 'Hide' : 'Show'} topics in ${m.title}`} onClick={() => setOpen(isOpen ? null : m.id)}
                    style={{ border: 0, background: 'none', minWidth: 36, minHeight: 36, cursor: 'pointer', fontSize: 16, color: 'var(--ink-soft)' }}>{isOpen ? '▴' : '▾'}</button>}
                </div>
                {isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '6px 0 4px 34px' }}>
                    {m.lessons.map(l => (
                      <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 36, fontSize: 14.5, color: 'var(--ink)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={chosen.has(l.id)} onChange={e => toggle([l.id], e.target.checked)} style={box} />{l.title}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, position: 'sticky', bottom: -22, background: 'var(--paper-soft)', padding: '14px 0 4px', marginTop: 14, borderTop: '1px solid var(--card-border)' }}>
        <button type="button" style={dghost} onClick={onClose}>Cancel</button>
        <button type="button" style={dbtn} disabled={busy || (!!draft && !draft.length)}
          onClick={async () => { setBusy(true); await onSave(draft); setBusy(false) }}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </Sheet>
  )
}

const field: CSSProperties = { minHeight: 44, border: '1.5px solid var(--card-border)', borderRadius: 10, padding: '0 10px', background: '#fff', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }
const box: CSSProperties = { width: 20, height: 20, accentColor: 'var(--milo-orange)', flexShrink: 0 }
