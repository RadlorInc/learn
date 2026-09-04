'use client'
import { S, N, Def, Bars, NotYet, Computed, useMetrics } from './_parts'

export default function Overview() {
  const { data, err } = useMetrics('overview')
  if (err) return <div style={S.page}><p>{err}</p></div>
  if (!data) return <div style={S.page}><p style={S.sub}>Loading…</p></div>

  const internalNote = Number(data.internal_flagged) === 0
    ? <><strong>No accounts are flagged internal yet</strong>, so nothing is currently being excluded —
        these figures still include the founder and tester accounts.</>
    : <>{data.internal_flagged} account(s) flagged internal and excluded.</>

  return (
    <div style={S.page}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <h2 style={S.h2}>Total accounts</h2>
          <Def>Parent accounts with a profile row. Denominator for the funnel. Internal excluded. {internalNote}</Def>
          <N v={data.total_accounts} />
        </div>
        <div style={S.card}>
          <h2 style={S.h2}>Total learners</h2>
          <Def>Children added by those accounts — the unit for everything on the Learning and
            Retention pages. {data.total_accounts} accounts hold {data.total_learners} learners.</Def>
          <N v={data.total_learners} />
        </div>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Daily signups — last 30 days</h2>
        <Def>Numerator: accounts created that day. No denominator (a count, not a rate).
          Day boundary: <strong>US Eastern</strong>. Today is shown in grey because it is incomplete.</Def>
        <Bars rows={data.daily_signups} incompleteKey={data.today} />
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Weekly signups — last 12 weeks</h2>
        <Def>Same numerator, bucketed by <strong>ISO week (Monday start)</strong>, US Eastern.
          The current week is partial.</Def>
        <Bars rows={data.weekly_signups} />
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Daily active learners — last 30 days</h2>
        <Def>
          Numerator: distinct learners with a <code>session_start</code> event that day —
          <strong> &ldquo;active&rdquo; means opened the app</strong>, not answered or completed
          something. That definition is used everywhere on this dashboard.
          Event time is the device&rsquo;s <code>client_ts</code>, not upload time: events queue
          offline and flush up to 9 days late, so upload time would put a child&rsquo;s play on the
          wrong day. Events older than 90 days are deleted, so this chart cannot start before {data.events_since}.
        </Def>
        <Bars rows={data.dau} incompleteKey={data.today} />
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Weekly active learners — last 12 weeks</h2>
        <Def>Same definition, ISO week (Monday), US Eastern. A learner active on three days in one
          week counts once.</Def>
        <Bars rows={data.wau} />
      </div>

      <NotYet
        title="Logins over time"
        shows="Sign-ins per day, split by method (Google / email)."
        why="auth_events has 1 row against at least 18 real logins since it was created. The write is
             fired from three scattered call sites and its failure is swallowed, so six weeks passed
             with nobody noticing. The repair is a single global auth-state listener with the write
             made observable — scheduled, not done."
        since="Not yet recording."
        meaningful="About a week after that fix ships and one login on each method has been confirmed."
      />
      <Computed at={data.computed_at} />
    </div>
  )
}
