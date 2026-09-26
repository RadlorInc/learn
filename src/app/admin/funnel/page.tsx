'use client'
import { S, N, Def, NotYet, Computed, useMetrics, LoadError, InvariantWarning } from '../_parts'

export default function Funnel() {
  const { data, err, rid, violations } = useMetrics('funnel')
  if (err) return <LoadError err={err} rid={rid} />
  if (!data) return <div style={S.page}><p style={S.sub}>Loading…</p></div>

  const steps = data.steps ?? []
  const first = Number(steps[0]?.n ?? 0)

  return (
    <div style={S.page}>
      <Activation />
      <InvariantWarning violations={violations} />
      <div style={S.card}>
        <h2 style={S.h2}>Funnel</h2>
        <p style={{ ...S.sub, color: '#8a1c1c' }}>
          ⚠️ This funnel and the retention table below count <code>chapter_open</code>, <code>sessions</code> and
          <code> session_start</code>, which the live lessons do not write. For the lessons, read Activation above.
        </p>
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
            <div key={s.step} style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '7px 0', borderBottom: '1px solid #f3f9ff' }}>
              <div style={{ width: 190, fontSize: 13 }}>{s.step}</div>
              <div style={{ width: 60 }}><N v={n} /></div>
              <div style={{ flex: 1, background: '#f3f9ff', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${first ? (n / first) * 100 : 0}%`, background: '#0b4fa8', height: '100%' }} />
              </div>
              <div style={{ width: 150, fontSize: 12, color: drop ? '#8a1c1c' : '#3d6fb8', textAlign: 'right' }}>
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
                      {raw === undefined ? <span style={{ color: '#bfddf6' }}>0</span>
                        : raw === null ? <span style={{ color: '#bfddf6' }} title="suppressed">—</span>
                        : <>{String(raw)} <span style={{ color: '#3d6fb8', fontSize: 11 }}>({pct}%)</span></>}
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
             had a NEGATIVE duration. Fixed and APPLIED to production on 2026-09-05; the 49 legacy
             rows are backfilled to NULL rather than left lying. No chapter has been completed since,
             so there is nothing yet to measure."
        since="2026-09-05 — the schema records it; the first row arrives with the next completed chapter."
        meaningful="After ~50 completed sessions with a real start. It will be shown as a MEDIAN with
                    an event-span caveat: the proxy ends at the last recorded event, so it
                    under-measures the tail."
      />
      <Computed at={data.computed_at} />
    </div>
  )
}

const th: React.CSSProperties = { textAlign: 'right', color: '#3d6fb8', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderBottom: '1px solid #d3e9f9' }
const td: React.CSSProperties = { padding: '6px 10px', borderBottom: '1px solid #f3f9ff' }

/**
 * Activation from the lessons (N8). Definitions are PRE-REGISTERED in
 * supabase/migrations/20260926101000_admin_activation.sql — change them there, not here.
 */
function Activation() {
  const { data, err, rid, violations } = useMetrics('activation')
  if (err) return <LoadError err={err} rid={rid} />
  if (!data) return <div style={S.card}><p style={S.sub}>Loading activation…</p></div>
  const rows = data.cohorts ?? []
  const cell = (v: number | null, of: number) => v === null
    ? <span style={{ color: '#bfddf6' }} title="suppressed: cohort below the small-cell threshold">—</span>
    : <>{v} <span style={{ color: '#3d6fb8', fontSize: 11 }}>({of ? Math.round((v / of) * 100) : 0}%)</span></>
  return (
    <>
      <InvariantWarning violations={violations} />
      <div style={S.card}>
        <h2 style={S.h2}>Activation — first 7 days, lessons</h2>
        <Def>
          Per <strong>parent account</strong>, by signup week (ISO, US Eastern). <strong>Eligible</strong> = at least 7 days
          old (younger accounts are listed as &ldquo;too new&rdquo;, not counted). <strong>Added a child</strong> = a child
          created within 7 days of signup. <strong>Activated</strong> = a child did lesson work within 7 days of signup
          (<code>lesson_progress</code> / <code>point_events</code>, no new events). It measures STARTING, not learning.
          A cohort below {data.min_cohort} eligible accounts shows —; above it, 0 is a real 0.
        </Def>
        <table style={{ borderSpacing: 0, fontSize: 13 }}>
          <thead><tr>
            <th style={{ ...th, textAlign: 'left' }}>Cohort week</th>
            <th style={th}>Eligible</th><th style={th}>Added a child</th><th style={th}>Activated</th><th style={th}>Too new</th>
          </tr></thead>
          <tbody>
            {rows.map((c: { cohort_week: string; eligible: number; too_new: number; added: number | null; activated: number | null }) => (
              <tr key={c.cohort_week}>
                <td style={td}>{c.cohort_week}</td>
                <td style={{ ...td, textAlign: 'right' }}>{c.eligible}</td>
                <td style={{ ...td, textAlign: 'right' }}>{cell(c.added, Number(c.eligible))}</td>
                <td style={{ ...td, textAlign: 'right' }}>{cell(c.activated, Number(c.eligible))}</td>
                <td style={{ ...td, textAlign: 'right' }}>{c.too_new}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p style={S.sub}>No parent accounts created in the last 12 weeks.</p>}
      </div>
    </>
  )
}
