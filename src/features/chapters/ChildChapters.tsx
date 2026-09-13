'use client'

/**
 * Which chapters this child sees — the PARENT's choice, on the parent's dashboard.
 *
 * ⚠️ THIS IS THE LIST THE CHILD ACTUALLY PLAYS, and it is deliberately a different thing from the
 * chapters a teacher ticks on a class. A teacher's list is her syllabus and stays in her account.
 * The two shared one column until 2026-09-12; if you find yourself reading `grade_chapters` here,
 * that regression is back.
 *
 * ⚠️ "I DON'T KNOW WHICH TO PICK" IS NOT A BUTTON THAT PICKS FOR YOU — IT IS THE ABSENCE OF A
 * CHOICE. Clearing the selection stores NULL, and the menu already falls through to the age band's
 * standard set when it finds one. So the door the parent needs was free: the honest control is
 * "use the standard set", which unsets rather than writing out 12 chapter ids that would then
 * silently stop tracking the band's own list as it changes.
 */

import { useState } from 'react'
import { CHAPTER_NAMES, CHAPTER_EMOJIS, chaptersForAge, type ChapterType, type AgeGroup } from '@/core/chapters'
import { setLearnerChapters } from '@/data/repositories'

export function ChildChapters({ learnerId, ageGroup, current, onSaved, tokens }: {
  learnerId: string
  ageGroup: AgeGroup
  /** What is stored today. `null` = unset, i.e. the band's standard set. */
  current: string[] | null | undefined
  onSaved: (next: string[] | null) => void
  tokens: { ink: string; ink2: string; ink3: string; edge: string; accent: string; card: string }
}) {
  const all = chaptersForAge(ageGroup).map(c => c.id)
  const [open, setOpen]   = useState(false)
  const [picked, setPick] = useState<Set<string>>(new Set(current ?? all))
  const [busy, setBusy]   = useState(false)

  // `!current?.length`, not `=== null`: before 20260912100000_classroom is applied the column does
  // not exist and the field arrives `undefined`, which crashed the whole parent dashboard.
  const usingStandard = !current?.length

  async function save(next: string[] | null) {
    setBusy(true)
    const ok = await setLearnerChapters(learnerId, next as ChapterType[] | null)
    setBusy(false)
    if (ok) { onSaved(next); setOpen(false) }
  }

  if (!open) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
        <span style={{ fontSize: 12.5, color: tokens.ink3, fontWeight: 600 }}>
          {usingStandard
            ? `Standard set for ages ${ageGroup} (${all.length} chapters)`
            : `${current!.length} of ${all.length} chapters chosen`}
        </span>
        <button onClick={() => { setPick(new Set(current ?? all)); setOpen(true) }} style={{
          background: 'none', border: 'none', padding: 0, fontSize: 12, fontWeight: 700,
          color: tokens.accent, cursor: 'pointer',
        }}>Change →</button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 10, background: tokens.card, border: `1.5px solid ${tokens.edge}`, borderRadius: 16, padding: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: tokens.ink, margin: '0 0 4px' }}>What {`they'll`} see</p>
      <p style={{ fontSize: 12.5, color: tokens.ink3, margin: '0 0 12px', lineHeight: 1.5 }}>
        Not sure? Use the standard set — it follows the age band as we add chapters.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto', marginBottom: 12 }}>
        {all.map(id => {
          const on = picked.has(id)
          return (
            <button key={id} onClick={() => setPick(p => {
              const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n
            })} style={{
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '8px 11px',
              borderRadius: 11, cursor: 'pointer', background: on ? '#FFF4D6' : 'transparent',
              border: on ? `2px solid ${tokens.accent}` : `2px solid ${tokens.edge}`,
            }}>
              <span aria-hidden style={{ fontSize: 17 }}>{CHAPTER_EMOJIS[id] ?? '📘'}</span>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: tokens.ink }}>{CHAPTER_NAMES[id] ?? id}</span>
              <span style={{ fontSize: 13, color: on ? tokens.accent : tokens.ink3 }}>{on ? '✓' : ''}</span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => save(picked.size ? [...picked] : null)} disabled={busy} style={{
          flex: '1 1 130px', padding: '11px', borderRadius: 40, border: 'none', fontSize: 14, fontWeight: 800,
          background: busy ? tokens.edge : tokens.accent, color: '#fff', cursor: busy ? 'wait' : 'pointer',
        }}>{busy ? 'Saving…' : 'Save'}</button>
        {/* Unsets rather than writing out every id — see the note at the top of this file. */}
        <button onClick={() => save(null)} disabled={busy} style={{
          flex: '1 1 130px', padding: '11px', borderRadius: 40, fontSize: 14, fontWeight: 700,
          background: 'transparent', color: tokens.ink2, border: `1.5px solid ${tokens.edge}`, cursor: 'pointer',
        }}>Use the standard set</button>
        <button onClick={() => setOpen(false)} style={{
          padding: '11px 16px', borderRadius: 40, fontSize: 14, fontWeight: 700,
          background: 'none', color: tokens.ink3, border: 'none', cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  )
}
