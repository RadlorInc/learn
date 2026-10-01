'use client'
/**
 * The parent's side of the free trial (20261001140000): the parent picks the family's two free topics here — two topics
 * of one Grade 3–8 module, or two KG–2 stories — once, and the children see only those. After that the card offers the
 * purchase. Nothing about the trial is on the child's side (ModuleHome shows only the two). Shown only while the paywall
 * is on and the family has no paid plan.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HOLDS_SEATS } from '@/core/billing'
import { CATALOGUE, STORY_CATALOGUE } from '@/features/lessons/catalogue'
import { gradeLabel } from '@/core/chapters'
import { chooseFreeTopics, getMySubscription, myFreeTopics, type MySubscription } from '@/data/repositories/billing'
import { dcard, dbtn, dghost } from '@/features/dashboard/Helpers'
import { PAYWALL_ENABLED } from '@/features/billing/useTopicGate'

const ALL = [...STORY_CATALOGUE, ...CATALOGUE]
const GRADES = [...new Set(ALL.map(m => m.grade))]
const titleOf = (id: string) => ALL.flatMap(m => m.lessons).find(l => l.id === id)?.title ?? id
const moduleOf = (id: string) => ALL.find(m => m.lessons.some(l => l.id === id))

export function FreeTrialCard() {
  return PAYWALL_ENABLED ? <Trial /> : null
}

function Trial() {
  const [used, setUsed] = useState<string[] | null>()
  const [sub, setSub] = useState<MySubscription | null>()
  useEffect(() => { myFreeTopics().then(setUsed); getMySubscription().then(s => setSub(s ?? null)) }, [])

  // Paying, or not known yet / could not find out: say nothing rather than something wrong.
  if (used == null || sub === undefined || (sub && HOLDS_SEATS.has(sub.status))) return null
  if (used.length === 0) return <Picker onChosen={setUsed} />
  const mod = moduleOf(used[0])
  return (
    <section style={dcard}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Your free trial</h2>
      <p style={{ margin: '6px 0 8px', lineHeight: 1.5 }}>
        Your children can learn these {used.length === 1 ? 'topic' : 'two topics'}{mod && !mod.story ? ` from ${gradeLabel(mod.grade)} · ${mod.title}` : ''}:
      </p>
      <ul style={{ margin: '0 0 12px', paddingLeft: 18, lineHeight: 1.6 }}>
        {used.map(t => <li key={t}>{titleOf(t)}</li>)}
      </ul>
      <p style={{ margin: '0 0 12px', lineHeight: 1.5 }}>Want more topics? Purchase to continue with every topic, in every grade.</p>
      <Link href="/parent/plan" style={dbtn}>Purchase</Link>
    </section>
  )
}

function Picker({ onChosen }: { onChosen: (t: string[]) => void }) {
  const [grade, setGrade] = useState(3)
  const story = grade < 3
  const mods = ALL.filter(m => m.grade === grade && m.lessons.length > 0)
  const [modId, setModId] = useState<string>()
  const mod = story ? undefined : mods.find(m => m.id === modId) ?? mods[0]
  // KG–2: every story of the grade is a choice; Grades 3–8: the topics of the one module.
  const choices = story ? mods.flatMap(m => m.lessons) : mod?.lessons ?? []
  const [picked, setPicked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const toggle = (id: string) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : p.length < 2 ? [...p, id] : p)
  async function save() {
    if (!window.confirm(`Start the free trial with “${picked.map(titleOf).join('” and “')}”? These two cannot be changed later.`)) return
    setBusy(true); setNote(null)
    const out = await chooseFreeTopics(picked)
    setBusy(false)
    if (out.ok) onChosen(picked)
    else setNote(out.error ?? 'Something went wrong and nothing was saved. Try again.')
  }

  const field = { minHeight: 44, borderRadius: 10, padding: '0 10px', fontSize: 15, maxWidth: '100%' }
  return (
    <section style={dcard}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Start your free trial: choose 2 topics</h2>
      <p style={{ margin: '6px 0 12px', lineHeight: 1.5 }}>
        Pick one module and two of its topics (for KG to Grade 2, two stories). Your children will see only these two.
        They cannot be changed later. For more, you can purchase any time.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <label>Grade{' '}
          <select style={field} value={grade} onChange={e => { setGrade(Number(e.target.value)); setModId(undefined); setPicked([]) }}>
            {GRADES.map(g => <option key={g} value={g}>{gradeLabel(g)}</option>)}
          </select>
        </label>
        {!story && (
          <label>Module{' '}
            <select style={field} value={mod?.id} onChange={e => { setModId(e.target.value); setPicked([]) }}>
              {mods.map(m => <option key={m.id} value={m.id}>{m.n}. {m.title}</option>)}
            </select>
          </label>
        )}
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: '0 0 12px' }}>
        <legend style={{ fontWeight: 700, marginBottom: 6 }}>{story ? 'Stories' : 'Topics'} ({picked.length} of 2)</legend>
        {choices.map(l => (
          <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40 }}>
            <input type="checkbox" checked={picked.includes(l.id)} disabled={!picked.includes(l.id) && picked.length >= 2} onChange={() => toggle(l.id)} />
            {l.title}
          </label>
        ))}
      </fieldset>
      {note && <p role="alert" style={{ margin: '0 0 10px' }}>{note}</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={dbtn} disabled={picked.length !== 2 || busy} onClick={save}>{busy ? 'Saving…' : 'Start free trial with these 2'}</button>
        <Link href="/parent/plan" style={dghost}>Or purchase everything</Link>
      </div>
    </section>
  )
}
