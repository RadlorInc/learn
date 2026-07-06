'use client'

/**
 * Class triage — the teacher's highest-value view: the grade's students grouped by
 * the ONE skill each is stuck on (their diagnostic root gap), so small-group
 * instruction is a glance away ("these 8 kids share a fractions gap → teach it once").
 *
 * A trust surface, not an engagement one: calm, plain, evidence-led, and grouped by
 * SHARED NEED — never a student-vs-student ranking (docs/ux-invariants.md #26, #23).
 * Reached from /parent/grades via ?g=<gradeId>.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/data/auth'
import { useGradeTriage } from '@/features/triage/useGradeTriage'
import { getChapter } from '@/core/chapters'
import type { TriageGroup } from '@/features/triage/groupByRootGap'

export default function TriagePage() {
  const router = useRouter()
  const [gradeId, setGradeId] = useState<string | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    ;(async () => {
      const user = await getCurrentUser()
      if (!user) { router.replace('/auth'); return }
      setAuthed(true)
      const g = new URLSearchParams(window.location.search).get('g')
      setGradeId(g)
    })()
  }, [router])

  if (authed === null) return <Splash>Loading…</Splash>
  if (!gradeId) return (
    <Splash>
      <p style={{ margin: '0 0 14px', color: '#888' }}>No grade selected.</p>
      <BackBtn onClick={() => router.push('/parent/grades')} />
    </Splash>
  )
  return <TriageBoard gradeId={gradeId} onBack={() => router.push('/parent/grades')} />
}

function TriageBoard({ gradeId, onBack }: { gradeId: string; onBack: () => void }) {
  const { state, gradeName, groups, total, checked, reload } = useGradeTriage(gradeId)

  return (
    <div style={{ minHeight: '100dvh', background: '#f7f8fa', padding: '20px 16px 60px' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <BackBtn onClick={onBack} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: '10px 0 2px' }}>
          Class triage{gradeName ? ` · ${gradeName}` : ''}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 18px', lineHeight: 1.5 }}>
          Each child grouped by the one skill they&apos;re stuck on — a ready-made plan for small-group teaching.
          {state === 'ready' && total > 0 && (
            <> <strong style={{ color: '#374151' }}>{checked}/{total}</strong> checked.</>
          )}
        </p>

        {state === 'loading' && <Card><p style={{ color: '#888', margin: 0 }}>Loading the class…</p></Card>}

        {state === 'error' && (
          <Card>
            <p style={{ color: '#DC2626', margin: '0 0 12px', fontWeight: 600 }}>Couldn&apos;t load this class.</p>
            <button onClick={reload} style={pillBtn}>↻ Retry</button>
          </Card>
        )}

        {state === 'ready' && total === 0 && (
          <Card><p style={{ color: '#888', margin: 0 }}>No children in this grade yet. Add children to it from the parent dashboard.</p></Card>
        )}

        {state === 'ready' && total > 0 && groups.map(g => <GroupCard key={g.key} g={g} />)}
      </div>
    </div>
  )
}

function GroupCard({ g }: { g: TriageGroup }) {
  const isGap = g.kind === 'gap'
  const accent = g.kind === 'gap' ? '#F26B2C' : g.kind === 'ontrack' ? '#6FBE3F' : '#9ca3af'
  const chapterName = g.chapter ? getChapter(g.chapter)?.name : undefined

  return (
    <div style={{ background: '#fff', border: '1px solid #eef0f3', borderLeft: `4px solid ${accent}`, borderRadius: 14, padding: '16px 18px', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 22 }}>{g.emoji}</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a' }}>{g.label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>
          {g.learners.length} {g.learners.length === 1 ? 'child' : 'children'}
        </span>
      </div>

      {g.skillLabel && (
        <p style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 0' }}>{g.skillLabel}</p>
      )}

      {isGap && chapterName && (
        <p style={{ fontSize: 13, color: '#374151', margin: '8px 0 0' }}>
          <strong>Focus:</strong> {g.emoji} {chapterName}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {g.learners.map(l => (
          <span key={l.learnerId} style={{ background: '#f3f4f6', borderRadius: 40, padding: '5px 12px', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            {l.name}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── small shared bits ─────────────────────────────────────────────────────────
const pillBtn: React.CSSProperties = { background: '#F26B2C', color: '#fff', border: 'none', borderRadius: 40, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }

function BackBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} style={{ background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 50, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#888', cursor: 'pointer' }}>← Grades</button>
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#fff', border: '1px solid #eef0f3', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>{children}</div>
}

function Splash({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#f7f8fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      {children}
    </div>
  )
}
