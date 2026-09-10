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

/* The adult surface's palette, from globals.css — same tokens the other parent screens use.
   These pages previously mixed ad-hoc greys (#888 / #6b7280 / #1a1a1a / #f7f8fa) with the brand
   colours, so each one read as a slightly different product. */
const P = {
  page:   'var(--paper)',
  card:   'var(--paper-soft)',
  edge:   'var(--card-border)',
  ink:    'var(--ink)',
  ink2:   'var(--ink-soft)',
  ink3:   'var(--ink-muted)',
  accent: 'var(--milo-orange)',
} as const


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
      <p style={{ margin: '0 0 14px', color: P.ink2 }}>No grade selected.</p>
      <BackBtn onClick={() => router.push('/parent/grades')} />
    </Splash>
  )
  return <TriageBoard gradeId={gradeId} onBack={() => router.push('/parent/grades')} />
}

function TriageBoard({ gradeId, onBack }: { gradeId: string; onBack: () => void }) {
  const { state, gradeName, groups, total, checked, reload } = useGradeTriage(gradeId)

  return (
    <div style={{ minHeight: '100dvh', background: P.page, paddingBottom: 60, fontFamily: 'var(--font-body)' }}>
      <div className="adult-shell">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <BackBtn onClick={onBack} />
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 900, color: P.ink, margin: '10px 0 2px', fontFamily: 'var(--font-display)' }}>
          Class triage{gradeName ? ` · ${gradeName}` : ''}
        </h1>
        <p style={{ fontSize: 14, color: P.ink2, margin: '0 0 18px', lineHeight: 1.5 }}>
          Each child grouped by the one skill they&apos;re stuck on — a ready-made plan for small-group teaching.
          {state === 'ready' && total > 0 && (
            <> <strong style={{ color: P.ink }}>{checked}/{total}</strong> checked.</>
          )}
        </p>

        {state === 'loading' && <Card><p style={{ color: P.ink2, margin: 0 }}>Loading the class…</p></Card>}

        {state === 'error' && (
          <Card>
            <p style={{ color: '#DC2626', margin: '0 0 12px', fontWeight: 600 }}>Couldn&apos;t load this class.</p>
            <button onClick={reload} style={pillBtn}>↻ Retry</button>
          </Card>
        )}

        {state === 'ready' && total === 0 && (
          <Card><p style={{ color: P.ink2, margin: 0 }}>No children in this grade yet. Add children to it from the parent dashboard.</p></Card>
        )}

        {/* ⚠️ A GRID, NOT A COLUMN — and `marginBottom` came OFF the card when this changed, or the
            grid's own `gap` doubles it. A triage list of one card per gap-group was a single column
            at 1280px, so each card ran the full width of the page for a two-line summary. */}
        {state === 'ready' && total > 0 && (
          <div className="card-grid">
            {groups.map(g => <GroupCard key={g.key} g={g} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function GroupCard({ g }: { g: TriageGroup }) {
  const isGap = g.kind === 'gap'
  const accent = g.kind === 'gap' ? '#F26B2C' : g.kind === 'ontrack' ? '#6FBE3F' : '#9ca3af'
  const chapterName = g.chapter ? getChapter(g.chapter)?.name : undefined

  return (
    <div style={{ background: P.card, border: `1.5px solid ${P.edge}`, borderLeft: `4px solid ${accent}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(61,37,22,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 22 }}>{g.emoji}</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: P.ink }}>{g.label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>
          {g.learners.length} {g.learners.length === 1 ? 'child' : 'children'}
        </span>
      </div>

      {g.skillLabel && (
        <p style={{ fontSize: 13, color: P.ink2, margin: '6px 0 0' }}>{g.skillLabel}</p>
      )}

      {isGap && chapterName && (
        <p style={{ fontSize: 13, color: P.ink2, margin: '8px 0 0' }}>
          <strong>Focus:</strong> {g.emoji} {chapterName}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {g.learners.map(l => (
          <span key={l.learnerId} style={{ background: P.page, border: `1px solid ${P.edge}`, borderRadius: 40, padding: '5px 12px', fontSize: 13, fontWeight: 600, color: P.ink2 }}>
            {l.name}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── small shared bits ─────────────────────────────────────────────────────────
const pillBtn: React.CSSProperties = { background: P.accent, color: '#fff', border: 'none', borderRadius: 40, padding: '11px 18px', minHeight: 44, fontSize: 13, fontWeight: 700, cursor: 'pointer' }

function BackBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} style={{ background: 'none', border: `1.5px solid ${P.edge}`, borderRadius: 50, padding: '11px 14px', minHeight: 44, fontSize: 13, fontWeight: 700, color: P.ink2, cursor: 'pointer' }}>← Grades</button>
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: P.card, border: `1.5px solid ${P.edge}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(61,37,22,0.04)' }}>{children}</div>
}

function Splash({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: P.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'var(--font-body)' }}>
      {children}
    </div>
  )
}
