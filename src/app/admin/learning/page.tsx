'use client'
import { S, N, Def, Bars, NotYet, Computed, useMetrics, LoadError, InvariantWarning } from '../_parts'

export default function Learning() {
  const { data, err, rid, violations } = useMetrics('learning')
  if (err) return <LoadError err={err} rid={rid} />
  if (!data) return <div style={S.page}><p style={S.sub}>Loading…</p></div>
  const c = data.chapters_per_learner

  return (
    <div style={S.page}>
      <InvariantWarning violations={violations} />
      <div style={S.card}>
        <h2 style={S.h2}>Chapters completed per learner</h2>
        <Def>
          Numerator: <strong>distinct</strong> chapters with at least one completed practice session
          (a child replaying one chapter ten times has completed one).
          <strong> Two denominators, both shown</strong> — they are different numbers with the same
          name, which is how this metric usually misleads. ⚠️ The second is learners who have
          <strong>completed</strong> at least one chapter, not opened one; this panel said
          &ldquo;opened&rdquo; until 2026-09-05, which was the same mislabel one layer up.
        </Def>
        <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
          <Stat label="Mean · all learners"     v={c.mean_all}      sub={`n = ${c.n_all}`} />
          <Stat label="Median · all learners"   v={c.median_all}    sub={`n = ${c.n_all}`} />
          <Stat label="Mean · completed ≥1"        v={c.mean_engaged}  sub={`n = ${c.n_engaged}`} />
          <Stat label="Median · completed ≥1"      v={c.median_engaged} sub={`n = ${c.n_engaged}`} />
        </div>
        <p style={{ ...S.sub, marginTop: 14, marginBottom: 6 }}>
          Distribution — the shape the mean hides. Zero-activity learners are <strong>included</strong>
          in the &ldquo;all&rdquo; figures and are the leftmost bar.
        </p>
        <Bars rows={(data.chapters_histogram ?? []).map((h: any) => ({ d: String(h.done), n: Number(h.n) }))} height={90} />
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Chapters by completion rate — worst first</h2>
        <Def>
          Started = distinct learners with a <code>chapter_open</code> event for that chapter.
          Finished = distinct learners with a completed session for it. Rate = finished ÷ started.
          <strong> The top of this list is where the app is losing people.</strong> Chapters nobody
          has opened are omitted rather than shown as 0 ÷ 0.
        </Def>
        <table style={{ width: '100%', borderSpacing: 0, fontSize: 13 }}>
          <thead><tr>{['Chapter', 'Started', 'Finished', 'Rate'].map(h =>
            <th key={h} style={{ textAlign: h === 'Chapter' ? 'left' : 'right', color: '#8b95a3', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderBottom: '1px solid #e3e8ef' }}>{h}</th>)}</tr></thead>
          <tbody>
            {(data.chapter_funnel ?? []).map((r: any) => (
              <tr key={r.chapter}>
                <td style={td}>{r.chapter}</td>
                <td style={{ ...td, textAlign: 'right' }}>{r.started}</td>
                <td style={{ ...td, textAlign: 'right' }}>{r.finished}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: Number(r.rate) < 0.5 ? '#8a1c1c' : '#1d2430' }}>
                  {r.rate === null ? '—' : `${Math.round(Number(r.rate) * 100)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Where learners are in the curriculum</h2>
        <Def>Learners grouped by their age band, with the median number of chapters completed inside
          each and the share who have completed at least one. Denominator is all learners in that band.</Def>
        <table style={{ width: '100%', borderSpacing: 0, fontSize: 13 }}>
          <thead><tr>{['Band', 'Learners', 'Median chapters', 'Completed ≥1'].map(h =>
            <th key={h} style={{ textAlign: h === 'Band' ? 'left' : 'right', color: '#8b95a3', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderBottom: '1px solid #e3e8ef' }}>{h}</th>)}</tr></thead>
          <tbody>{(data.curriculum_position ?? []).map((b: any) => (
            <tr key={b.band}>
              <td style={td}>{b.band}</td>
              <td style={{ ...td, textAlign: 'right' }}>{b.learners}</td>
              <td style={{ ...td, textAlign: 'right' }}>{b.median_done}</td>
              <td style={{ ...td, textAlign: 'right' }}>{b.pct_started}%</td>
            </tr>))}</tbody>
        </table>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Placement check</h2>
        <Def>Completed vs still in progress. <strong>Starts have only been recorded since
          2026-09-05</strong> — before that a row was written only on completion, so any
          &ldquo;started&rdquo; figure covering earlier data would have been 100% by construction.</Def>
        <div style={{ display: 'flex', gap: 36 }}>
          <Stat label="Completed"   v={data.diagnostic?.completed} />
          <Stat label="In progress" v={data.diagnostic?.in_progress} />
        </div>
      </div>

      <NotYet
        title="Question-level accuracy inside a chapter"
        shows="For the worst-performing chapters, which specific question children get wrong — the wall."
        why="Nothing records a per-question answer. The complete set of event properties in production
             is action, ageGroup, at, band, chapter, correct, mastered, wrong — no question or item id
             anywhere. Chapter-level correct/wrong counts are the finest grain that exists."
        since="Not yet recording — needs an `answer` event carrying chapter + question id + correct."
        meaningful="Roughly two weeks after that event ships, once each chapter has been played enough
                    times for a per-question rate to mean anything."
      />
      <Computed at={data.computed_at} />
    </div>
  )
}

const td: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #f0f3f7' }
function Stat({ label, v, sub }: { label: string; v: any; sub?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#8b95a3', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <N v={v === null || v === undefined ? null : Number(v)} />
      {sub && <div style={{ fontSize: 11, color: '#8b95a3' }}>{sub}</div>}
    </div>
  )
}
