'use client'
/**
 * The parent chooses which topics a child sees (founder's call, 2026-09-14). Every grade's modules are listed; a parent
 * ticks whole modules or single topics. "Every topic" stores null, which is also what a child with no choice gets.
 * Saved to `learners.lesson_ids` (migration 20260914120000). Only the parent who created the child can save — the
 * database refuses anyone else, and this screen says so rather than pretending.
 */
import { useState, type CSSProperties } from 'react'
import { MODULES, GRADES } from './modules'

export type SaveResult = 'ok' | 'not_ready' | 'error'

export function TopicPicker({ childName, initial, canEdit, onSave, onBack }: {
  childName: string; initial: readonly string[] | null | undefined; canEdit: boolean
  onSave: (ids: string[] | null) => Promise<SaveResult>; onBack: () => void
}) {
  const [every, setEvery] = useState(!initial || initial.length === 0)
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(initial ?? []))
  const [grade, setGrade] = useState(() => MODULES.find(m => m.lessons.some(l => initial?.includes(l.id)))?.grade ?? GRADES[0])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const toggle = (ids: string[], on: boolean) => {
    setMsg(null)
    setChosen(prev => { const next = new Set(prev); for (const id of ids) on ? next.add(id) : next.delete(id); return next })
  }
  const save = async () => {
    if (!every && chosen.size === 0) { setMsg({ ok: false, text: 'Tick at least one topic, or choose "Every topic".' }); return }
    setSaving(true); setMsg(null)
    const ids = every ? null : MODULES.flatMap(m => m.lessons.map(l => l.id)).filter(id => chosen.has(id))   // teaching order
    const r = await onSave(ids)
    setSaving(false)
    setMsg(r === 'ok' ? { ok: true, text: `Saved. ${childName} will see ${every ? 'every topic' : `${ids!.length} topic${ids!.length === 1 ? '' : 's'}`}.` }
      : r === 'not_ready' ? { ok: false, text: 'Choosing topics needs a database update that has not been applied yet. Nothing was saved.' }
      : { ok: false, text: 'Could not save. Only the parent who added this child can choose their topics.' })
  }

  const count = chosen.size
  return (
    <div style={{ minHeight: '100dvh', background: '#FFF8F0', padding: '16px 14px 40px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button type="button" onClick={onBack} style={{ ...btn, alignSelf: 'flex-start', background: '#fff', color: '#3D2516' }}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#3D2516' }}>Choose {childName}&apos;s topics</h1>
        <p style={{ margin: 0, color: '#6B5A4E', fontSize: 15 }}>Pick the topics {childName} sees on their home screen. You can change this any time.</p>

        <div role="radiogroup" aria-label="Which topics" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[[true, 'Every topic'], [false, 'Only the topics I choose']].map(([v, label]) => (
            <button key={String(v)} type="button" role="radio" aria-checked={every === v} disabled={!canEdit}
              onClick={() => { setEvery(v as boolean); setMsg(null) }}
              style={{ ...btn, background: every === v ? '#F26B2C' : '#fff', color: every === v ? '#fff' : '#3D2516' }}>{label as string}</button>
          ))}
        </div>

        {!every && <>
          <div role="tablist" aria-label="Grades" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GRADES.map(g => {
              const n = MODULES.filter(m => m.grade === g).flatMap(m => m.lessons).filter(l => chosen.has(l.id)).length
              return <button key={g} type="button" role="tab" aria-selected={g === grade} onClick={() => setGrade(g)}
                style={{ ...btn, padding: '8px 14px', background: g === grade ? '#3D2516' : '#fff', color: g === grade ? '#fff' : '#3D2516' }}>
                Grade {g}{n > 0 && <span style={{ marginLeft: 6, fontSize: 12, background: '#FFD166', color: '#3D2516', borderRadius: 999, padding: '1px 7px' }}>{n}</span>}
              </button>
            })}
          </div>

          {MODULES.filter(m => m.grade === grade).map(m => {
            const ids = m.lessons.map(l => l.id), on = ids.filter(id => chosen.has(id)).length
            return (
              <section key={m.id} style={{ background: '#fff', border: '1.5px solid #EAD9C6', borderRadius: 16, padding: 14 }}>
                {m.lessons.length === 0
                  ? <p style={{ margin: 0, fontWeight: 800, color: '#9A8877' }}>Module {m.n}: {m.title} · coming soon</p>
                  : <>
                    <label style={{ ...row, fontWeight: 900, fontSize: 16 }}>
                      <input type="checkbox" disabled={!canEdit} checked={on === ids.length} ref={el => { if (el) el.indeterminate = on > 0 && on < ids.length }}
                        onChange={e => toggle(ids, e.target.checked)} style={box} />
                      Module {m.n}: {m.title}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 4, marginTop: 8, paddingLeft: 30 }}>
                      {m.lessons.map(l => (
                        <label key={l.id} style={row}>
                          <input type="checkbox" disabled={!canEdit} checked={chosen.has(l.id)} onChange={e => toggle([l.id], e.target.checked)} style={box} />
                          {l.title}
                        </label>
                      ))}
                    </div>
                  </>}
              </section>
            )
          })}
        </>}

        {msg && <p role="status" style={{ margin: 0, padding: '10px 14px', borderRadius: 12, fontWeight: 700, background: msg.ok ? '#E2F4EB' : '#FFF1C9', color: '#3D2516' }}>{msg.text}</p>}
        {canEdit
          ? <button type="button" onClick={save} disabled={saving} style={{ ...btn, background: '#F26B2C', color: '#fff', padding: '14px', fontSize: 16 }}>
              {saving ? 'Saving…' : every ? 'Save: every topic' : `Save: ${count} topic${count === 1 ? '' : 's'}`}
            </button>
          : <p style={{ margin: 0, color: '#6B5A4E' }}>Only the parent who added {childName} can change their topics.</p>}
      </div>
    </div>
  )
}

const btn: CSSProperties = { border: '1.5px solid #EAD9C6', borderRadius: 50, padding: '10px 18px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, minHeight: 36, fontSize: 15, color: '#3D2516', cursor: 'pointer' }
const box: CSSProperties = { width: 20, height: 20, accentColor: '#F26B2C', flexShrink: 0 }
