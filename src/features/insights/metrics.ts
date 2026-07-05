/**
 * Insights — pure metric computation (no React, no data access).
 *
 * Retention/funnel aggregation over sessions + events, plus the equivalent view
 * built from the server-side rollup. Unit-testable in isolation.
 */
import type { Learner } from '@/data/supabase/types'
import type { InsightsRollup } from '@/data/repositories'

export const DAY = 86_400_000
// Rolling window so the unpaginated fallback reads don't grow unbounded as an account accumulates history.
export const WINDOW_DAYS = 90

// NOTE: `sessions` has no created_at — it uses started_at (always set) + completed_at (nullable).
export type Sess = { learner_id: string; phase: string; correct_count: number; wrong_count: number; completed_at: string | null; started_at: string }
export type Evt = { learner_id: string; event: string; created_at: string }

const ms = (s: string) => new Date(s).getTime()
const pad2 = (n: number) => String(n).padStart(2, '0')
// Local calendar day (matches daily.ts) — bucketing by UTC shifted retention days for non-UTC users.
export const dayKey = (s: string) => { const d = new Date(s); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }

export function computeMetrics(learners: Learner[], sessions: Sess[], events: Evt[]) {
  const now = Date.now()
  const byLearner = new Map<string, number[]>()  // learner_id → session timestamps
  for (const s of sessions) {
    const t = ms(s.completed_at ?? s.started_at)
    if (!byLearner.has(s.learner_id)) byLearner.set(s.learner_id, [])
    byLearner.get(s.learner_id)!.push(t)
  }

  const per = learners.map(l => {
    const times = (byLearner.get(l.id) ?? []).sort((a, b) => a - b)
    const days = new Set(times.map(t => dayKey(new Date(t).toISOString())))
    const first = times[0] ?? null, last = times[times.length - 1] ?? null
    return {
      id: l.id, name: l.display_name, age: l.age_group ?? '3-5',
      firstMs: first, lastMs: last, activeDays: days.size, sessions: times.length,
      spanDays: first && last ? Math.round((last - first) / DAY) : 0,
      first: first ? dayKey(new Date(first).toISOString()) : '—',
      last: last ? dayKey(new Date(last).toISOString()) : '—',
    }
  })

  const played = per.filter(p => p.sessions > 0)
  const active7 = played.filter(p => p.lastMs! >= now - 7 * DAY).length
  const active30 = played.filter(p => p.lastMs! >= now - 30 * DAY).length
  const returning = played.filter(p => p.activeDays >= 2).length

  const retention = (N: number) => {
    const eligible = played.filter(p => p.firstMs! <= now - N * DAY)
    const retained = eligible.filter(p => p.lastMs! - p.firstMs! >= N * DAY)
    return { eligible: eligible.length, retained: retained.length }
  }

  const opens = events.filter(e => e.event === 'chapter_open').length
  const completes = events.filter(e => e.event === 'practice_complete').length
  const skips = events.filter(e => e.event === 'lesson_skip').length
  const dailyOpens = events.filter(e => e.event === 'daily_open').length
  const dailyCompletes = events.filter(e => e.event === 'daily_complete').length
  const practice = sessions.filter(s => s.phase === 'practice')
  const totC = practice.reduce((a, s) => a + s.correct_count, 0)
  const totW = practice.reduce((a, s) => a + s.wrong_count, 0)
  const accuracy = totC + totW > 0 ? Math.round((totC / (totC + totW)) * 100) : null

  return {
    learners: learners.length, totalSessions: sessions.length,
    active7, active30, returning,
    d1: retention(1), d7: retention(7), d30: retention(30),
    opens, completes: completes || practice.length, skips, accuracy,
    dailyOpens, dailyCompletes,
    rows: per.sort((a, b) => (b.lastMs ?? 0) - (a.lastMs ?? 0)),
  }
}

export type Metrics = ReturnType<typeof computeMetrics>

// Same metrics as computeMetrics(), but built from the server-side rollup (no raw rows). first/last/
// retention/accuracy are exact; `active_days` comes from the RPC (UTC calendar days).
export function computeMetricsFromRollup(learners: Learner[], r: InsightsRollup): Metrics {
  const now = Date.now()
  const plById = new Map(r.per_learner.map(p => [p.learner_id, p]))

  const per = learners.map(l => {
    const pl = plById.get(l.id)
    const firstMs = pl?.first_ms ?? null, lastMs = pl?.last_ms ?? null
    return {
      // Cast mirrors computeMetrics()'s (unsound-but-guarded) `number` typing; a learner with no
      // sessions is absent from per_learner, and every metric that reads firstMs/lastMs filters on
      // sessions > 0 first (or coalesces null → 0), so the runtime null is never dereferenced.
      id: l.id, name: l.display_name, age: l.age_group ?? '3-5',
      firstMs: firstMs as number, lastMs: lastMs as number,
      activeDays: pl?.active_days ?? 0, sessions: pl?.sessions ?? 0,
      spanDays: firstMs && lastMs ? Math.round((lastMs - firstMs) / DAY) : 0,
      first: firstMs ? dayKey(new Date(firstMs).toISOString()) : '—',
      last: lastMs ? dayKey(new Date(lastMs).toISOString()) : '—',
    }
  })

  const played = per.filter(p => p.sessions > 0)
  const active7 = played.filter(p => p.lastMs! >= now - 7 * DAY).length
  const active30 = played.filter(p => p.lastMs! >= now - 30 * DAY).length
  const returning = played.filter(p => p.activeDays >= 2).length
  const retention = (N: number) => {
    const eligible = played.filter(p => p.firstMs! <= now - N * DAY)
    const retained = eligible.filter(p => p.lastMs! - p.firstMs! >= N * DAY)
    return { eligible: eligible.length, retained: retained.length }
  }
  const ec = r.event_counts
  const totC = r.accuracy.correct, totW = r.accuracy.wrong

  return {
    learners: learners.length,
    totalSessions: per.reduce((a, p) => a + p.sessions, 0),
    active7, active30, returning,
    d1: retention(1), d7: retention(7), d30: retention(30),
    opens: ec.chapter_open,
    completes: ec.practice_complete || r.accuracy.practice_sessions,
    skips: ec.lesson_skip,
    accuracy: totC + totW > 0 ? Math.round((totC / (totC + totW)) * 100) : null,
    dailyOpens: ec.daily_open, dailyCompletes: ec.daily_complete,
    rows: per.sort((a, b) => (b.lastMs ?? 0) - (a.lastMs ?? 0)),
  }
}
