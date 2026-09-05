'use client'
import { S, N, Def, NotYet, Computed, useMetrics, LoadError } from '../_parts'

export default function Funnel() {
  const { data, err, rid } = useMetrics('funnel')
  if (err) return <LoadError err={err} rid={rid} />
  if (!data) return <div style={S.page}><p style={S.sub}>Loading…</p></div>

  const steps = data.steps ?? []
  const first = Number(steps[0]?.n ?? 0)

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h2 style={S.h2}>Funnel</h2>
        <Def>
          <strong>Every step is measured on the ACCOUNT</strong>, so all four share one denominator —
          mixing accounts and learners inside a funnel invents a drop-off out of a unit change.
          An account counts at a step if <em>any</em> of its learners did the thing.
          &ldquo;Came back another day&rdquo; = <code>session_start</code> events on two or more
          distinct US Eastern days: two sessions in one sitting is one visit.
          Absolute numbers, with the drop between steps.
        </Def>
        {steps.map((s: any, i: number) => {
          const n = Number(s.n)
          const prev = i === 0 ? null : Number(steps[i - 1].n)
          const drop = prev === null ? null : prev - n
          return (
            <div key={s.step} style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '7px 0', borderBottom: '1px solid #f0f3f7' }}>
              <div style={{ width: 190, fontSize: 13 }}>{s.step}</div>
              <div style={{ width: 60 }}><N v={n} /></div>
              <div style={{ flex: 1, background: '#eef1f6', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${first ? (n / first) * 100 : 0}%`, background: '#3d6fd1', height: '100%' }} />
              </div>
              <div style={{ width: 150, fontSize: 12, color: drop ? '#8a1c1c' : '#8b95a3', textAlign: 'right' }}>
                {drop === null ? `${first} accounts` : drop === 0 ? 'no drop' : `−${drop} lost here`}
              </div>
            </div>
          )
        })}
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Retention by signup cohort</h2>
        <Def>
          Of the learners who signed up in week N, the share active in week N, N+1, N+2, N+3.
          <strong> Not a single global retention number</strong> — with a growing population a global
          figure mostly measures how recently people joined. Cohort = the learner&rsquo;s creation
          week (ISO, Monday, US Eastern). Active = a <code>session_start</code> event that week.
          Cells below the small-cell threshold render as —.
          {' '}⚠️ Events are deleted at 90 days, so a cohort older than ~12 weeks will appear to lose
          retention it actually had.
        </Def>
        <table style={{ borderSpacing: 0, fontSize: 13 }}>
          <thead><tr>
            <th style={{ ...th, textAlign: 'left' }}>Cohort week</th>
            <th style={th}>Size</th>
            {[0, 1, 2, 3].map(o => <th key={o} style={th}>Week +{o}</th>)}
          </tr></thead>
          <tbody>
            {(data.cohorts ?? []).map((c: any) => {
              const by = new Map((c.weeks ?? []).map((w: any) => [Number(w.offset), w.n]))
              return (
                <tr key={c.cohort_week}>
                  <td style={td}>{c.cohort_week}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{c.size}</td>
                  {[0, 1, 2, 3].map(o => {
                    const raw = by.get(o) as number | null | undefined
                    const pct = raw != null && Number(c.size) > 0 ? Math.round((Number(raw) / Number(c.size)) * 100) : null
                    return <td key={o} style={{ ...td, textAlign: 'right' }}>
                      {raw === undefined ? <span style={{ color: '#c2c9d3' }}>0</span>
                        : raw === null ? <span style={{ color: '#c2c9d3' }} title="suppressed">—</span>
                        : <>{String(raw)} <span style={{ color: '#8b95a3', fontSize: 11 }}>({pct}%)</span></>}
                    </td>
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        {(data.cohorts ?? []).length === 0 && <p style={S.sub}>No cohorts in the last 12 weeks.</p>}
      </div>

      <NotYet
        title="Average session length"
        shows="Median time in a session, with the mean beside it, and the inactivity timeout stated."
        why="sessions.started_at was never a start time — the RPC never supplied it, so it took the
             column default now() at INSERT while completed_at is stamped on the client. All 49 rows
             had a NEGATIVE duration. Fixed 2026-09-05, but only sessions played AFTER that fix
             carry a real start; the 49 older rows are backfilled to NULL rather than left lying."
        since="2026-09-05, once the migration is applied."
        meaningful="After ~50 completed sessions with a real start — a few weeks at current volume.
                    It will be shown as a MEDIAN with an event-span caveat: the proxy ends at the
                    last recorded event, so it under-measures the tail."
      />
      <Computed at={data.computed_at} />
    </div>
  )
}

const th: React.CSSProperties = { textAlign: 'right', color: '#8b95a3', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderBottom: '1px solid #e3e8ef' }
const td: React.CSSProperties = { padding: '6px 10px', borderBottom: '1px solid #f0f3f7' }
