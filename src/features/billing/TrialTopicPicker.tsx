'use client'
/**
 * The free trial's topic picker (founder, 2026-10-01): where a parent chooses what a child sees — adding a child, and the
 * child's Lessons tab — while the family has not paid. Two topics of ONE module, or two KG–2 stories; once two are
 * ticked every other one is dimmed, and tapping a dimmed one offers the purchase. The family's choice is made once
 * (`choose_free_topics`); after that the picker shows it, read-only. The child's side never sees any of this.
 */
import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { HOLDS_SEATS } from '@/core/billing'
import { ALL_MODULES as MODULES, GRADES, gradeName } from '@/features/lessons/modules'
import { getMySubscription, myFreeTopics } from '@/data/repositories/billing'
import { PAYWALL_ENABLED } from '@/features/billing/useTopicGate'
import { dbtn, dghost } from '@/features/dashboard/Helpers'

export const FREE_TOPICS = 2   // the count choose_free_topics allows; the database is the one that enforces it

/** `off`: no trial (paywall off, or the family pays, or we could not find out) — the normal pickers apply.
 *  `choose`: the family has not chosen yet. `chosen`: the family's two, final. `undefined` while asking. */
export type FamilyTrial = { state: 'off' } | { state: 'choose' } | { state: 'chosen'; topics: string[] }

export function useFamilyTrial(): FamilyTrial | undefined {
  const [trial, setTrial] = useState<FamilyTrial | undefined>(() => PAYWALL_ENABLED ? undefined : { state: 'off' })
  useEffect(() => {
    if (!PAYWALL_ENABLED) return
    let live = true
    Promise.all([getMySubscription(), myFreeTopics()]).then(([sub, topics]) => {
      if (!live) return
      if (sub === undefined || topics === null || (sub && HOLDS_SEATS.has(sub.status))) setTrial({ state: 'off' })
      else setTrial(topics.length ? { state: 'chosen', topics } : { state: 'choose' })
    })
    return () => { live = false }
  }, [])
  return trial
}

const isStory = (id: string) => id.startsWith('c:')
const moduleOf = (id: string) => MODULES.find(m => m.lessons.some(l => l.id === id))

/** May `id` be ticked next to `picked`? (Mirrors choose_free_topics; the database still decides.) */
export function canAdd(picked: readonly string[], id: string): boolean {
  if (picked.includes(id)) return true
  if (picked.length >= FREE_TOPICS) return false
  if (!picked.length) return true
  if (isStory(id) !== isStory(picked[0])) return false
  return isStory(id) || moduleOf(id)?.id === moduleOf(picked[0])?.id
}

export function TrialTopicPicker({ value, onChange }: { value: string[]; onChange?: (ids: string[]) => void }) {
  const locked = !onChange
  const [grade, setGrade] = useState(() => (value[0] && moduleOf(value[0])?.grade) ?? 3)
  const [offer, setOffer] = useState(false)
  const tap = (id: string) => {
    if (locked) { if (!value.includes(id)) setOffer(true); return }
    if (value.includes(id)) onChange(value.filter(x => x !== id))
    else if (canAdd(value, id)) onChange([...value, id])
    else setOffer(true)
  }
  const mods = MODULES.filter(m => m.grade === grade && m.lessons.length > 0)

  return (
    <div>
      <p style={{ margin: '0 0 10px', lineHeight: 1.5, color: 'var(--ink)' }}>
        <b>Free trial: {value.length} of {FREE_TOPICS} topics chosen.</b>{' '}
        {locked ? 'These are your family’s free topics.' : 'Pick two topics from one module (for KG to Grade 2, two stories). They cannot be changed later.'}
      </p>
      <div role="group" aria-label="Grade" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {GRADES.map(g => {
          const n = value.filter(id => moduleOf(id)?.grade === g).length
          return <button key={g} type="button" aria-pressed={g === grade} onClick={() => setGrade(g)} style={chip(g === grade)}>{gradeName(g)}{n ? ` · ${n}` : ''}</button>
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mods.map(m => {
          const on = m.lessons.filter(l => value.includes(l.id)).length
          // A KG–2 story is a module with one "topic", itself: one row, no list to open.
          if (m.story) return <Row key={m.id} id={m.lessons[0].id} title={`${m.n}. ${m.title}`} value={value} locked={locked} onTap={tap} />
          return (
            <details key={m.id} open={on > 0} style={{ border: '1.5px solid var(--card-border)', borderRadius: 12, background: '#fff', padding: '8px 12px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 800, color: 'var(--ink)', minHeight: 32 }}>
                Module {m.n} · {m.title} <span style={{ fontWeight: 700, color: 'var(--ink-muted)', fontSize: 13 }}>{on ? `${on} chosen` : `${m.lessons.length} topics`}</span>
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
                {m.lessons.map(l => <Row key={l.id} id={l.id} title={l.title} value={value} locked={locked} onTap={tap} />)}
              </div>
            </details>
          )
        })}
      </div>
      {offer && <PurchaseOffer onClose={() => setOffer(false)} />}
    </div>
  )
}

function Row({ id, title, value, locked, onTap }: { id: string; title: string; value: string[]; locked: boolean; onTap: (id: string) => void }) {
  const on = value.includes(id), dim = locked ? !on : !canAdd(value, id)
  return (
    // Not `disabled`: a dimmed topic still answers a tap, with the purchase offer.
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 40, fontSize: 14.5, color: 'var(--ink)', cursor: 'pointer', opacity: dim ? 0.45 : 1 }}>
      <input type="checkbox" checked={on} aria-label={dim ? `${title} (needs a purchase)` : undefined}
        onChange={() => onTap(id)} style={{ width: 20, height: 20, accentColor: 'var(--milo-orange)', flexShrink: 0 }} />
      {title}
    </label>
  )
}

/** "Unlock every module" — the parent's only way past the two. Never shown to a child. */
export function PurchaseOffer({ onClose }: { onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="offer-title" onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,61,133,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--paper-soft)', borderRadius: 18, padding: 24, maxWidth: 420, width: '100%', boxSizing: 'border-box' }}>
        <h3 id="offer-title" style={{ margin: '0 0 8px', fontSize: 20, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>Unlock every module</h3>
        <p style={{ margin: '0 0 18px', lineHeight: 1.5, color: 'var(--ink)' }}>
          The free trial covers two topics. Purchase to unlock every module and every topic, in every grade, for your children.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" style={dghost} onClick={onClose}>Not now</button>
          <Link href="/parent/plan" style={dbtn}>Purchase</Link>
        </div>
      </div>
    </div>
  )
}

const chip = (on: boolean): CSSProperties => ({
  padding: '6px 14px', minHeight: 40, borderRadius: 999, border: '2px solid', borderColor: on ? 'var(--milo-orange)' : 'var(--card-border)',
  background: on ? 'var(--milo-orange-soft)' : 'var(--paper-soft)', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: 'var(--ink)',
})
