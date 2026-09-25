'use client'
/**
 * A free teacher sets their class's exercises (founder, 2026-09-18): a module, a level 1–5 and how many questions.
 * The preview shows the exact questions every child will get — the draft's seed is the one that is saved.
 * A new exercise is LOCKED: the teacher makes it when they have time and opens it when it is test time; then reads the
 * results — each student's first attempt, and which questions the class found hard.
 * Loaded on demand from Classes.tsx: it carries every question ladder.
 */
import { useEffect, useMemo, useState } from 'react'
import { updateClass, getExerciseResults, type ClassRow, type ExerciseResult } from '@/data/repositories'
import { GRADES, modulesOf, findModule } from '@/features/lessons/modules'
import { exerciseItems, newExercise, isOpen, summarize, LEVELS, MAX_COUNT, type Exercise } from './exercise'

const P = { page: 'var(--paper)', card: 'var(--paper-soft)', edge: 'var(--card-border)', ink: 'var(--ink)', ink2: 'var(--ink-soft)', ink3: 'var(--ink-muted)', accent: 'var(--milo-orange)', soft: 'var(--milo-orange-soft)' } as const
const btn = { background: 'var(--accent-fill)', color: 'var(--on-accent-fill)', border: 'none', borderRadius: 10, padding: '10px 14px', minHeight: 44, fontSize: 14, fontWeight: 800, cursor: 'pointer' } as const
const ghost = { ...btn, background: P.card, color: P.ink, border: `1.5px solid ${P.edge}` } as const
const chip = (on: boolean) => ({ padding: '8px 14px', minHeight: 40, borderRadius: 50, border: '2px solid', borderColor: on ? P.accent : P.edge, background: on ? P.soft : P.card, color: P.ink, cursor: 'pointer', fontSize: 14, fontWeight: 700 }) as const
const LEVEL_HINT: Record<number, string> = { 1: 'simplest', 2: 'easy', 3: 'medium', 4: 'harder', 5: 'hardest' }

/** `onUpdate` hands back the class with its new exercise list — no dashboard reload, so this panel stays open. */
export function ExerciseEditor({ cls, students, onUpdate }: { cls: ClassRow; students: { id: string; name: string }[]; onUpdate: (c: ClassRow) => void }) {
  const [adding, setAdding] = useState(cls.exercises.length === 0)
  const [saving, setSaving] = useState(false)
  const [showing, setShowing] = useState<string | null>(null)             // exercise whose results are open
  const [results, setResults] = useState<ExerciseResult[] | null | 'loading'>('loading')
  const load = () => { setResults('loading'); getExerciseResults(cls.id).then(setResults) }
  useEffect(() => { getExerciseResults(cls.id).then(setResults) }, [cls.id])

  async function save(list: Exercise[]) {
    setSaving(true)
    const ok = await updateClass(cls.id, { exercises: list })
    setSaving(false)
    if (ok) { setAdding(false); onUpdate({ ...cls, exercises: list }) }
  }

  return (
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {cls.exercises.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cls.exercises.map((ex, n) => {
            const m = findModule(ex.module), open = isOpen(ex)
            const done = Array.isArray(results) ? summarize(ex.id, students.map(s => s.id), results).done : null
            const small = { ...ghost, minHeight: 36, padding: '6px 12px' }
            return (
              <div key={ex.id} style={{ padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${open ? '#86EFAC' : P.edge}`, background: P.page }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <b style={{ color: P.ink }}>Exercise {n + 1}</b>
                  <span style={{ fontSize: 12.5, fontWeight: 800, padding: '3px 10px', borderRadius: 50, background: open ? '#DCFCE7' : '#F3F9FF', color: open ? '#166534' : '#083d85' }}>{open ? '🟢 Open' : '🔒 Locked'}</span>
                  <span style={{ fontSize: 14, color: P.ink2, flex: '1 1 200px' }}>{m ? `Grade ${m.grade} · Module ${m.n} · ${m.title}` : ex.module} · Level {ex.level} · {ex.count} questions{done !== null ? ` · ${done}/${students.length} done` : ''}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  <button onClick={() => save(cls.exercises.map(x => x.id === ex.id ? { ...x, open: !open } : x))} disabled={saving}
                    style={open ? small : { ...btn, minHeight: 36, padding: '6px 12px' }}>{open ? 'Lock again' : 'Unlock for the class'}</button>
                  <button onClick={() => { setShowing(showing === ex.id ? null : ex.id); if (showing !== ex.id) load() }} style={small}>{showing === ex.id ? 'Hide results' : 'Results'}</button>
                  <button onClick={() => save(cls.exercises.filter(x => x.id !== ex.id))} disabled={saving} style={{ ...small, color: '#B42318' }}>Remove</button>
                </div>
                {showing === ex.id && <Results ex={ex} students={students} results={results} />}
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

/** One exercise's results: each student's first attempt, then how each question went across the class. */
function Results({ ex, students, results }: { ex: Exercise; students: { id: string; name: string }[]; results: ExerciseResult[] | null | 'loading' }) {
  const items = useMemo(() => exerciseItems(ex), [ex])
  if (results === 'loading') return <p style={{ margin: '10px 0 0', fontSize: 14, color: P.ink3 }}>Loading results…</p>
  if (results === null) return <p role="alert" style={{ margin: '10px 0 0', fontSize: 14, color: '#93000A', fontWeight: 600 }}>Could not load the results. Check your connection and try again.</p>
  const s = summarize(ex.id, students.map(x => x.id), results)
  const name = (id: string) => students.find(x => x.id === id)?.name ?? '—'
  const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 13, color: P.ink3 }}>A student’s <b>first</b> attempt is their result; “right” means right first time, without a hint.</p>
      <div style={{ overflowX: 'auto' }}>
        <table className="home-table">
          <thead><tr><th>Student</th><th>Right first time</th><th>Attempts</th><th>Finished</th></tr></thead>
          <tbody>
            {s.students.map(r => (
              <tr key={r.learnerId}>
                <td style={{ fontWeight: 700 }}>{name(r.learnerId)}</td>
                <td>{r.done ? `${r.right} of ${r.total}` : <span style={{ color: P.ink3 }}>not yet</span>}</td>
                <td>{r.attempts || '—'}</td>
                <td style={{ color: P.ink3 }}>{r.at ? when(r.at) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {s.perQuestion.length > 0 && (
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 800, color: P.ink2 }}>Question by question</p>
          <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {s.perQuestion.map((q, i) => {
              const pct = q.of ? Math.round((100 * q.right) / q.of) : 0
              return (
                <li key={i} style={{ fontSize: 14, color: P.ink }}>
                  <span>{items[i]?.problem.text ?? `Question ${i + 1}`}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <div style={{ flex: '0 1 180px', height: 8, borderRadius: 4, background: P.edge, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct < 50 ? '#DC2626' : '#16A34A' }} />
                    </div>
                    <span style={{ fontSize: 12.5, color: pct < 50 ? '#B42318' : P.ink3, fontWeight: 700 }}>{q.right} of {q.of} right first time</span>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
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
        <button onClick={() => onSave(draft)} disabled={!module || saving} style={{ ...btn, opacity: module && !saving ? 1 : 0.5 }}>{saving ? 'Saving…' : 'Add exercise (locked)'}</button>
        {onCancel && <button onClick={onCancel} style={ghost}>Cancel</button>}
      </div>
    </div>
  )
}
