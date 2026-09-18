'use client'
/**
 * A free teacher sets their class's exercises (founder, 2026-09-18): a module, a level 1–5 and how many questions.
 * The preview shows the exact questions every child will get — the draft's seed is the one that is saved.
 * Loaded on demand from Classes.tsx: it carries every question ladder.
 */
import { useMemo, useState } from 'react'
import { updateClass, type ClassRow } from '@/data/repositories'
import { GRADES, modulesOf, findModule } from '@/features/lessons/modules'
import { exerciseItems, newExercise, LEVELS, MAX_COUNT, type Exercise } from './exercise'

const P = { page: 'var(--paper)', card: 'var(--paper-soft)', edge: 'var(--card-border)', ink: 'var(--ink)', ink2: 'var(--ink-soft)', ink3: 'var(--ink-muted)', accent: 'var(--milo-orange)', soft: 'var(--milo-orange-soft)' } as const
const btn = { background: P.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', minHeight: 44, fontSize: 14, fontWeight: 800, cursor: 'pointer' } as const
const ghost = { ...btn, background: P.card, color: P.ink, border: `1.5px solid ${P.edge}` } as const
const chip = (on: boolean) => ({ padding: '8px 14px', minHeight: 40, borderRadius: 50, border: '2px solid', borderColor: on ? P.accent : P.edge, background: on ? P.soft : P.card, color: P.ink, cursor: 'pointer', fontSize: 14, fontWeight: 700 }) as const
const LEVEL_HINT: Record<number, string> = { 1: 'simplest', 2: 'easy', 3: 'medium', 4: 'harder', 5: 'hardest' }

export function ExerciseEditor({ cls, onChanged }: { cls: ClassRow; onChanged: () => void }) {
  const [adding, setAdding] = useState(cls.exercises.length === 0)
  const [saving, setSaving] = useState(false)

  async function save(list: Exercise[]) {
    setSaving(true)
    const ok = await updateClass(cls.id, { exercises: list })
    setSaving(false)
    if (ok) { setAdding(false); onChanged() }
  }

  return (
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {cls.exercises.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cls.exercises.map((ex, n) => {
            const m = findModule(ex.module)
            return (
              <div key={ex.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${P.edge}`, background: P.page }}>
                <b style={{ color: P.ink }}>Exercise {n + 1}</b>
                <span style={{ fontSize: 14, color: P.ink2, flex: '1 1 200px' }}>{m ? `Grade ${m.grade} · Module ${m.n} · ${m.title}` : ex.module} · Level {ex.level} · {ex.count} questions</span>
                <button onClick={() => save(cls.exercises.filter(x => x.id !== ex.id))} disabled={saving} style={{ ...ghost, minHeight: 36, padding: '6px 12px', color: '#B42318' }}>Remove</button>
              </div>
            )
          })}
        </div>
      )}
      {adding
        ? <NewExercise grade={cls.grade} saving={saving} onCancel={cls.exercises.length ? () => setAdding(false) : undefined} onSave={ex => save([...cls.exercises, ex])} />
        : <button onClick={() => setAdding(true)} style={{ ...btn, alignSelf: 'flex-start' }}>+ New exercise</button>}
    </div>
  )
}

function NewExercise({ grade: startGrade, saving, onSave, onCancel }: { grade: number; saving: boolean; onSave: (ex: Exercise) => void; onCancel?: () => void }) {
  const [grade, setGrade] = useState(startGrade)
  const ready = (g: number) => modulesOf(g).filter(m => m.lessons.length)
  const [module, setModule] = useState(() => ready(startGrade)[0]?.id ?? '')
  const [level, setLevel] = useState(1)
  const [count, setCount] = useState(10)
  const [seed, setSeed] = useState(() => newExercise('', 1, 1))    // id + seed; kept so the preview IS what is saved
  const draft: Exercise = { ...seed, module, level, count: Math.max(1, Math.min(MAX_COUNT, count || 1)) }
  const preview = useMemo(() => module ? exerciseItems({ ...draft, count: Math.min(draft.count, 3) }) : [], [module, level, draft.count, seed]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, borderRadius: 14, border: `1.5px dashed ${P.edge}` }}>
      <div>
        <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: P.ink2 }}>Module</p>
        <div className="chip-scroll" aria-label="Grade">
          {GRADES.map(g => <button key={g} onClick={() => { setGrade(g); setModule(ready(g)[0]?.id ?? '') }} aria-pressed={grade === g} style={chip(grade === g)}>Grade {g}</button>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {ready(grade).map(m => (
            <button key={m.id} onClick={() => setModule(m.id)} aria-pressed={module === m.id}
              style={{ ...chip(module === m.id), borderRadius: 12, textAlign: 'left' }}>Module {m.n} · {m.title}</button>
          ))}
        </div>
      </div>
      <div>
        <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: P.ink2 }}>Level</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LEVELS.map(l => <button key={l} onClick={() => setLevel(l)} aria-pressed={level === l} style={chip(level === l)}>{l} · {LEVEL_HINT[l]}</button>)}
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: P.ink2 }}>
        Questions
        <input type="number" min={1} max={MAX_COUNT} value={count} onChange={e => setCount(Number(e.target.value))}
          style={{ width: 90, padding: '10px 12px', minHeight: 44, fontSize: 16, borderRadius: 10, border: `2px solid ${P.edge}`, background: P.page, color: P.ink }} />
        <span style={{ fontWeight: 500, color: P.ink3 }}>1–{MAX_COUNT}, the same for every student</span>
      </label>
      {preview.length > 0 && (
        <div style={{ background: P.page, border: `1.5px solid ${P.edge}`, borderRadius: 12, padding: '10px 12px' }}>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 800, color: P.ink2 }}>Your students will get (first {preview.length}):</p>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: P.ink, lineHeight: 1.5 }}>{preview.map((x, i) => <li key={i}>{x.problem.text}</li>)}</ol>
          <button onClick={() => setSeed(newExercise('', 1, 1))} style={{ ...ghost, minHeight: 36, padding: '6px 12px', marginTop: 8 }}>Different questions</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onSave(draft)} disabled={!module || saving} style={{ ...btn, opacity: module && !saving ? 1 : 0.5 }}>{saving ? 'Saving…' : 'Add exercise'}</button>
        {onCancel && <button onClick={onCancel} style={ghost}>Cancel</button>}
      </div>
    </div>
  )
}
