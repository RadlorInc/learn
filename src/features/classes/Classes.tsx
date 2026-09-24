'use client'
/**
 * A teacher's classes (founder's call, 2026-09-18): make a class (name + Grade 3–8), add students one at a time or
 * from a list of usernames — each gets a TEMPORARY password they replace at first sign-in — and choose the class's
 * modules. Each class has its own page (features/dashboard/ClassPage.tsx).
 *
 * A class is a `grades` row; a student is in one class (`learners.grade_id`). The class's modules are copied onto each
 * student's `lesson_ids` (what /modules reads), and a student added later starts with them.
 * Every teacher can give the class EXERCISES: the same questions for every student, not adaptive, level and count set
 * by the teacher (./exercise.ts). A PAID teacher's students get the modules AND the exercises; a FREE teacher's (no
 * paid row in `teacher_plans`) get the exercises only.
 */
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/data/supabase/client'
import {
  createClass, updateClass, createLearner, deleteLearner, setChildLogin, setClassLessons,
  type ClassRow,
} from '@/data/repositories'
import { GRADES, MODULES, modulesOf, hasModule } from '@/features/lessons/modules'
import { parseRoster, tempPassword, rosterCsv, type RosterRow } from '@/core/classRoster'
import { normalizeUsername } from '@/core/childLogin'
import type { AgeGroup } from '@/core/chapters'


const P = { page: 'var(--paper)', card: 'var(--paper-soft)', edge: 'var(--card-border)', ink: 'var(--ink)', ink2: 'var(--ink-soft)', ink3: 'var(--ink-muted)', accent: 'var(--milo-orange)', soft: 'var(--milo-orange-soft)' } as const
const card = { background: P.card, border: `1.5px solid ${P.edge}`, borderRadius: 16, padding: 16 } as const
const btn = { background: P.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', minHeight: 44, fontSize: 14, fontWeight: 800, cursor: 'pointer' } as const
const ghost = { ...btn, background: P.card, color: P.ink, border: `1.5px solid ${P.edge}` } as const
const input = { padding: '12px 14px', minHeight: 44, fontSize: 16, color: P.ink, background: P.page, border: `2px solid ${P.edge}`, borderRadius: 12, outline: 'none', boxSizing: 'border-box', width: '100%' } as const
const chip = (on: boolean) => ({ padding: '8px 14px', minHeight: 40, borderRadius: 50, border: '2px solid', borderColor: on ? P.accent : P.edge, background: on ? P.soft : P.card, color: P.ink, cursor: 'pointer', fontSize: 14, fontWeight: 700 }) as const

/** `learners.age_group` is a legacy band that is still required; a class child gets the band their grade sits in. */
export const bandOf = (grade: number): AgeGroup => (grade <= 5 ? '9-11' : '12-14')

export interface ClassStudent { id: string; name: string }

/* ─── the parts a class page is built from (features/dashboard/ClassPage.tsx) ───────────────────────── */

export function NewClass({ onClose, onCreated }: { onClose: () => void; onCreated: (c: ClassRow) => void }) {
  const [name, setName] = useState('')
  const [grade, setGrade] = useState(3)
  const [saving, setSaving] = useState(false)
  const ok = name.trim().length >= 1 && name.trim().length <= 60
  async function save() {
    if (!ok) return
    setSaving(true)
    const c = await createClass(name, grade)
    setSaving(false)
    if (c) onCreated(c)
  }
  return (
    <div style={{ ...card, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: P.ink }}>New class</h3>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 700, color: P.ink2 }}>
        Class name
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 5-A or Room 12" maxLength={60} autoFocus style={input} />
      </label>
      <div>
        <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: P.ink2 }}>Grade</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {GRADES.map(g => <button key={g} onClick={() => setGrade(g)} aria-pressed={grade === g} style={chip(grade === g)}>Grade {g}</button>)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={!ok || saving} style={{ ...btn, opacity: ok && !saving ? 1 : 0.5 }}>{saving ? 'Creating…' : 'Create class'}</button>
        <button onClick={onClose} style={ghost}>Cancel</button>
      </div>
    </div>
  )
}

export function Rename({ cls, onDone }: { cls: ClassRow; onDone: () => void }) {
  const [name, setName] = useState(cls.name)
  const ok = name.trim().length >= 1 && name.trim().length <= 60
  return (
    <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input value={name} onChange={e => setName(e.target.value)} maxLength={60} style={{ ...input, maxWidth: 320 }} aria-label="Class name" />
      <button disabled={!ok} onClick={async () => { if (await updateClass(cls.id, { name: name.trim() })) onDone() }} style={{ ...btn, opacity: ok ? 1 : 0.5 }}>Save</button>
    </div>
  )
}

/** Grade chips and a tick per module — what a class and a newly added child are given. `pick` holds module ids. */
export function ModuleChecklist({ grade, setGrade, pick, setPick }: {
  grade: number; setGrade: (g: number) => void; pick: Set<string>; setPick: (f: (p: Set<string>) => Set<string>) => void
}) {
  return (
    <>
      <div className="chip-scroll" aria-label="Grade">
        {GRADES.map(g => <button key={g} onClick={() => setGrade(g)} aria-pressed={grade === g} style={chip(grade === g)}>Grade {g}</button>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {modulesOf(grade).map(m => {
          const on = pick.has(m.id), soon = m.lessons.length === 0
          return (
            <label key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', minHeight: 44, borderRadius: 12, border: `2px solid ${on ? P.accent : P.edge}`, background: on ? P.soft : P.page, cursor: soon ? 'default' : 'pointer', opacity: soon ? 0.5 : 1 }}>
              <input type="checkbox" checked={on} disabled={soon} style={{ width: 20, height: 20, accentColor: 'var(--milo-orange)' }}
                onChange={e => setPick(p => { const n = new Set(p); if (e.target.checked) n.add(m.id); else n.delete(m.id); return n })} />
              <span style={{ fontSize: 14, fontWeight: 700, color: P.ink }}>Module {m.n} · {m.title}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: P.ink3 }}>{soon ? 'coming soon' : `${m.lessons.length} topics`}</span>
            </label>
          )
        })}
      </div>
    </>
  )
}

/** Tick modules (any grade, opening on the class's). Saving gives every student in the class exactly these lessons. */
export function ModulePicker({ cls, onDone }: { cls: ClassRow; onDone: () => void }) {
  const [grade, setGrade] = useState(cls.grade)
  const [pick, setPick] = useState<Set<string>>(() => new Set(
    cls.lesson_ids?.length ? MODULES.filter(m => m.lessons.length && hasModule(cls.lesson_ids, m)).map(m => m.id) : []))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function save() {
    setSaving(true); setMsg(null)
    // In teaching order; none ticked = every topic (the same meaning an empty list has for a child).
    const ids = MODULES.filter(m => pick.has(m.id)).flatMap(m => m.lessons.map(l => l.id))
    const lessonIds = ids.length ? ids : null
    const n = await setClassLessons(cls.id, lessonIds)
    setSaving(false)
    if (n === null) { setMsg('Could not save. Check your connection and try again.'); return }
    onDone()
  }

  return (
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ModuleChecklist grade={grade} setGrade={setGrade} pick={pick} setPick={setPick} />
      {msg && <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#93000A' }}>{msg}</p>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={save} disabled={saving} style={btn}>{saving ? 'Saving…' : pick.size ? `Give ${pick.size} module${pick.size === 1 ? '' : 's'} to the class` : 'Give the class every module'}</button>
        <span style={{ fontSize: 12.5, color: P.ink3 }}>Replaces what each student in this class sees. You can still change one student from their own page.</span>
      </div>
    </div>
  )
}

/* ─── adding students: one, or a list — each with a temporary password ─────────────────────────────── */

type Made = RosterRow & { password?: string; error?: string }

const loginError = (e: string) =>
  e === 'username_taken' ? 'username already used — pick another'
  : e === 'not_configured' ? 'logins are not set up on this server'
  : e === 'bad_username' ? 'not a valid username'
  : 'could not set the login'

async function addOne(row: RosterRow, cls: ClassRow): Promise<Made> {
  const learner = await createLearner(row.name, Math.floor(Math.random() * 4), bandOf(cls.grade), { classId: cls.id, lessonIds: cls.lesson_ids })
  if (!learner) return { ...row, error: 'could not add the student' }
  const password = tempPassword()
  let r = await setChildLogin(learner.id, row.username, password, true)
  if (!r.ok && r.error === 'rate_limited') {                  // a very big list: the route allows 60 a minute
    await new Promise(res => setTimeout(res, 61_000))
    r = await setChildLogin(learner.id, row.username, password, true)
  }
  if (!r.ok) {
    // No half-made student: without a login they could not sign in, and the teacher would re-upload a duplicate.
    await deleteLearner(learner.id)
    return { ...row, error: loginError(r.error) }
  }
  return { ...row, password }
}

export function AddStudents({ cls, onAdded, onDone }: { cls: ClassRow; onAdded: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<'one' | 'list'>('list')
  const [text, setText] = useState('')
  const [oneName, setOneName] = useState('')
  const [oneUser, setOneUser] = useState('')
  const [made, setMade] = useState<Made[] | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  // ⚠️ ADDING STUDENTS IS PAUSED ONCE THE CONSENT GATE IS LIVE (founder, deploy loop D1). From
  // migration 20260923120000 every new child needs a parent's granted consent, and no consent route
  // fits a school yet — so every roster add would be refused (P0C01). The signal is the same one
  // AddChildFlow uses: the consent table exists ⇒ the gate exists. Before that, adds work as they
  // always have. Any other error falls through to the form, whose per-row errors stay visible.
  const [paused, setPaused] = useState<boolean | null>(null)
  useEffect(() => {
    let live = true
    void createClient().from('parental_consents').select('id', { head: true, count: 'exact' }).limit(1)
      // paused only when the table answered; a missing table, or any other error, leaves the form
      .then(({ error }) => { if (live) setPaused(!error) })
    return () => { live = false }
  }, [])

  // The list is parsed; one student's two boxes are taken as they are — no guessing which box is which.
  const parsed = useMemo(() => {
    if (mode === 'list') return parseRoster(text)
    const username = normalizeUsername(oneUser)
    return username
      ? { rows: [{ username, name: oneName.trim().slice(0, 30) || username }], errors: [] }
      : { rows: [], errors: [{ line: 1, text: oneUser, reason: 'username must be 3–20 letters, digits, dot or underscore' }] }
  }, [mode, text, oneName, oneUser])
  const ready = parsed.rows

  async function run() {
    const out: Made[] = []
    for (let i = 0; i < ready.length; i++) {
      setProgress(`Adding ${i + 1} of ${ready.length}…`)
      out.push(await addOne(ready[i], cls))
    }
    setProgress(null)
    setMade(out)
    // Refresh the dashboard's student list now, not only on Done: the passwords stay on screen, and the class header,
    // Roster and results already count the new students if the teacher goes straight to another button.
    if (out.some(m => m.password)) onAdded()
  }

  if (paused === null) return <p style={{ marginTop: 14, fontSize: 13.5, color: P.ink3 }}>Loading…</p>
  if (paused) return (
    <div data-roster="paused" style={{ marginTop: 14, fontSize: 14, color: P.ink, background: P.card, border: `1.5px solid ${P.edge}`, borderRadius: 10, padding: '12px 14px', lineHeight: 1.5 }}>
      <p style={{ margin: 0, fontWeight: 800 }}>Adding students is paused for now.</p>
      <p style={{ margin: '6px 0 0' }}>We are still setting up how a school gives permission for a child to use Radlic. Until that is ready, new students cannot be added to a class. Students already in your class are not affected.</p>
      <button onClick={onDone} style={{ ...ghost, marginTop: 10 }}>Close</button>
    </div>
  )

  if (made) {
    const good = made.filter(m => m.password)
    const csv = rosterCsv(good.map(m => ({ name: m.name, username: m.username, password: m.password! })))
    return (
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: P.ink }}>
          {good.length} student{good.length === 1 ? '' : 's'} added{made.length > good.length ? ` · ${made.length - good.length} not added` : ''}
        </p>
        {good.length > 0 && (
          <p style={{ margin: 0, fontSize: 13.5, color: '#92400E', background: '#FFF7E6', border: '1.5px solid #F5D08A', borderRadius: 10, padding: '10px 12px', fontWeight: 600 }}>
            ⚠️ These temporary passwords are shown only now. Download or print them before you close this. Each student signs in with their username and this password, then makes their own.
          </p>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table className="home-table">
            <thead><tr><th>Name</th><th>Username</th><th>Temporary password</th></tr></thead>
            <tbody>
              {made.map(m => (
                <tr key={m.username}>
                  <td>{m.name}</td><td style={{ fontWeight: 700 }}>{m.username}</td>
                  <td style={{ fontFamily: 'ui-monospace, monospace', color: m.error ? '#B42318' : P.ink }}>{m.password ?? `✗ ${m.error}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {good.length > 0 && <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download={`${cls.name.replace(/[^\w-]+/g, '_')}-logins.csv`} style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Download list (CSV)</a>}
          {good.length > 0 && <button onClick={() => window.print()} style={ghost}>Print</button>}
          <button onClick={onDone} style={ghost}>Done</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setMode('list')} aria-pressed={mode === 'list'} style={chip(mode === 'list')}>Upload a list</button>
        <button onClick={() => setMode('one')} aria-pressed={mode === 'one'} style={chip(mode === 'one')}>One student</button>
      </div>

      {mode === 'list' ? (<>
        <p style={{ margin: 0, fontSize: 13.5, color: P.ink2, lineHeight: 1.5 }}>
          One student per line: a <strong>username</strong>, or <strong>name, username</strong>. A CSV from Excel or Google Sheets works too
          (a header row with “username” and “name”). Each student gets a temporary password.
          {' '}<a href="/legal/privacy" style={{ color: P.ink, fontWeight: 700 }}>Privacy Policy</a>
        </p>
        <label style={{ ...ghost, display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start' }}>
          Choose a CSV file
          <input type="file" accept=".csv,.txt,text/csv,text/plain" style={{ display: 'none' }}
            onChange={async e => { const f = e.target.files?.[0]; if (f) setText(await f.text()); e.target.value = '' }} />
        </label>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={7} placeholder={'Aarav Shah, aarav7\nMaya Khan, maya.k\nzoya_2'}
          style={{ ...input, fontFamily: 'ui-monospace, monospace', fontSize: 14, minHeight: 140, resize: 'vertical' }} aria-label="Student list" />
      </>) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={oneName} onChange={e => setOneName(e.target.value)} placeholder="Name (optional)" maxLength={30} style={{ ...input, flex: '1 1 180px' }} aria-label="Student name" />
          <input value={oneUser} onChange={e => setOneUser(e.target.value)} placeholder="Username" maxLength={20} autoCapitalize="none" style={{ ...input, flex: '1 1 180px' }} aria-label="Username" />
        </div>
      )}

      {(mode === 'list' ? text.trim() : oneUser.trim()) && parsed.errors.length > 0 && (
        <ul role="alert" style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#93000A', fontWeight: 600 }}>
          {parsed.errors.slice(0, 8).map(e => <li key={e.line}>{mode === 'list' ? `Line ${e.line} (“${e.text}”): ` : ''}{e.reason}</li>)}
          {parsed.errors.length > 8 && <li>…and {parsed.errors.length - 8} more</li>}
        </ul>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={run} disabled={!ready.length || !!progress} style={{ ...btn, opacity: ready.length && !progress ? 1 : 0.5 }}>
          {progress ?? `Add ${ready.length || ''} student${ready.length === 1 ? '' : 's'}`}
        </button>
        {mode === 'list' && parsed.errors.length > 0 && ready.length > 0 && <span style={{ fontSize: 12.5, color: P.ink3 }}>Lines with a problem are skipped.</span>}
      </div>
    </div>
  )
}
