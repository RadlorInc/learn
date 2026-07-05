'use client'
/**
 * /insights — founder retention dashboard (NOT kid-facing). Answers the one
 * question that matters before building more content: do kids come back?
 *
 * Retention is derived from the existing `sessions` table (day-level activity);
 * the funnel (opens → completes, skips) comes from `learner_events`. Scoped by
 * RLS to the signed-in account's learners — for cross-account aggregates you'll
 * later want a service-role admin view.
 */
import { useInsights } from '@/features/insights/useInsights'

export default function InsightsPage() {
  const { state, metrics: m, reload } = useInsights()

  if (state === 'error') return <Shell><p style={S.dim}>Couldn&apos;t load insights.</p><button onClick={reload} style={S.refresh}>↻ Retry</button></Shell>
  if (state !== 'ready' || !m) return <Shell><p style={S.dim}>{state === 'no-auth' ? 'Sign in required…' : 'Loading insights…'}</p></Shell>

  return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={S.h1}>Retention insights</h1>
        <button onClick={reload} style={S.refresh}>↻ Refresh</button>
      </div>
      <p style={S.dim}>Scoped to your account&apos;s {m.learners} learner{m.learners === 1 ? '' : 's'}. The number that matters: do they come back?</p>

      {m.learners === 0 || m.totalSessions === 0 ? (
        <div style={S.empty}>No activity yet. Get a few kids playing, then this fills in. (Each finished chapter logs a session; opens/completes log events.)</div>
      ) : (
        <>
          <div style={S.cardsRow}>
            <Stat label="Learners" value={m.learners} />
            <Stat label="Active last 7d" value={m.active7} sub={`${pct(m.active7, m.learners)} of learners`} />
            <Stat label="Active last 30d" value={m.active30} sub={`${pct(m.active30, m.learners)} of learners`} />
            <Stat label="Came back ≥2 days" value={m.returning} sub={`${pct(m.returning, m.learners)} returned at all`} hot />
          </div>

          <h2 style={S.h2}>Return rate (the headline)</h2>
          <p style={S.dim}>Of learners who first played at least N days ago, how many were still active N+ days later.</p>
          <div style={S.cardsRow}>
            <Stat label="Day 1" value={frac(m.d1)} sub={`${m.d1.retained}/${m.d1.eligible} eligible`} />
            <Stat label="Day 7" value={frac(m.d7)} sub={`${m.d7.retained}/${m.d7.eligible} eligible`} hot />
            <Stat label="Day 30" value={frac(m.d30)} sub={`${m.d30.retained}/${m.d30.eligible} eligible`} />
          </div>

          <h2 style={S.h2}>Engagement funnel</h2>
          <div style={S.cardsRow}>
            <Stat label="Chapters opened" value={m.opens} />
            <Stat label="Chapters finished" value={m.completes} sub={`${pct(m.completes, m.opens)} completion`} />
            <Stat label="Opened, not finished" value={Math.max(0, m.opens - m.completes)} sub={m.opens ? `${pct(Math.max(0, m.opens - m.completes), m.opens)} of opens` : ''} />
            <Stat label="Avg accuracy" value={m.accuracy != null ? `${m.accuracy}%` : '—'} sub="practice rounds" />
          </div>

          <h2 style={S.h2}>Milo&apos;s Daily (the retention loop)</h2>
          <div style={S.cardsRow}>
            <Stat label="Daily opened" value={m.dailyOpens} />
            <Stat label="Daily finished" value={m.dailyCompletes} sub={`${pct(m.dailyCompletes, m.dailyOpens)} completion`} />
          </div>

          <h2 style={S.h2}>Per learner</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead><tr>{['Learner', 'Age', 'First seen', 'Last seen', 'Days active', 'Sessions', 'Span'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {m.rows.map(r => (
                  <tr key={r.id}>
                    <td style={S.td}>{r.name}</td>
                    <td style={S.td}>{r.age}</td>
                    <td style={S.td}>{r.first}</td>
                    <td style={S.td}>{r.last}</td>
                    <td style={S.td}>{r.activeDays}</td>
                    <td style={S.td}>{r.sessions}</td>
                    <td style={S.td}>{r.spanDays}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Shell>
  )
}


const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')
const frac = (r: { retained: number; eligible: number }) => (r.eligible > 0 ? `${Math.round((r.retained / r.eligible) * 100)}%` : '—')

function Stat({ label, value, sub, hot }: { label: string; value: number | string; sub?: string; hot?: boolean }) {
  return (
    <div style={{ ...S.card, ...(hot ? { borderColor: '#F26B2C', background: '#FFF4D6' } : {}) }}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
      {sub ? <div style={S.statSub}>{sub}</div> : null}
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div style={S.page}><div style={{ maxWidth: 920, margin: '0 auto' }}>{children}</div></div>
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: '#faf7f0', padding: '32px 20px 64px', fontFamily: 'var(--font-body, system-ui)', color: '#1a1a1a' },
  h1: { fontFamily: 'var(--font-display, system-ui)', fontSize: 28, fontWeight: 900, margin: 0 },
  h2: { fontFamily: 'var(--font-display, system-ui)', fontSize: 18, fontWeight: 800, margin: '28px 0 6px' },
  dim: { color: '#6b7280', fontSize: 14, margin: '4px 0 0' },
  empty: { marginTop: 24, padding: 24, background: '#fff', border: '2px dashed #d1d5db', borderRadius: 16, color: '#6b7280', textAlign: 'center' },
  refresh: { padding: '8px 16px', borderRadius: 999, border: '2px solid #e5e7eb', background: '#fff', fontWeight: 700, cursor: 'pointer' },
  cardsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 12 },
  card: { background: '#fff', border: '2px solid #e5e7eb', borderRadius: 16, padding: '14px 16px' },
  statLabel: { fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontFamily: 'var(--font-display, system-ui)', fontSize: 32, fontWeight: 900, lineHeight: 1.1, marginTop: 4 },
  statSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 14, background: '#fff', borderRadius: 12, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '10px 12px', background: '#f3f4f6', fontWeight: 800, fontSize: 12, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4 },
  td: { padding: '10px 12px', borderTop: '1px solid #f0f0f0' },
}
