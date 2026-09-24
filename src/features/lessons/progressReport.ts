/**
 * What the parent's Assign lessons and Performance screens say about a child, computed from what the account holds:
 * `lesson_progress` (done / mastered per topic) and `point_events` (one 'problem' row per practice problem answered —
 * 2 points = right on the first try, 1 = after a miss or the worked steps). Pure, so every rule here is tested.
 * No time practised: the founder chose not to show it (2026-09-17), and nothing records it.
 */

/** A date as the parent picked it, `YYYY-MM-DD`, compared as a string (same format both sides). */
export type Day = string

/** The device's local date — the day as the parent or child sees it. */
export const localDay = (d: Date): Day =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export interface Assignment { ids: string[] | null; due: Record<string, string> }

/**
 * Adds `picked` to the list in teaching order (`order`), dating each with `dueOn` — or clearing its date when `dueOn`
 * is empty, so re-assigning without a date really removes the old one.
 */
export function assign(order: readonly string[], a: Assignment, picked: readonly string[], dueOn: Day): Assignment {
  const set = new Set([...(a.ids ?? []), ...picked])
  const due = { ...a.due }
  for (const id of picked) { if (dueOn) due[id] = dueOn; else delete due[id] }
  return { ids: order.filter(id => set.has(id)), due }
}

/** ⚠️ An EMPTY list is read everywhere as "every topic", so removing the last lesson says so: ids null, no dates. */
export function unassign(a: Assignment, id: string): Assignment {
  const ids = (a.ids ?? []).filter(x => x !== id)
  const due = { ...a.due }; delete due[id]
  return ids.length ? { ids, due } : { ids: null, due: {} }
}

export type AssignmentStatus = 'done' | 'late' | 'due' | 'open'

/** done beats everything; late = past its due day and not done; due = has a date still ahead (or today); open = no date. */
export function assignmentStatus(done: boolean, due: Day | undefined, today: Day): AssignmentStatus {
  if (done) return 'done'
  if (!due) return 'open'
  return due < today ? 'late' : 'due'
}

/** "Sep 20" — short, in English, the way the rest of the adult screens write dates. */
export const showDay = (d: Day, lang: 'en' | 'es' = 'en') => new Date(`${d}T12:00:00`).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric' })

export interface PointRow { lesson_id: string | null; reason: string; points: number; created_at: string }
export interface ProgressRow { lesson_id: string; done: boolean; mastered: boolean }

export interface Report {
  /** Problems answered on each of the last 7 days, oldest first, ending today. */
  week: { day: Day; problems: number }[]
  problemsThisWeek: number
  /** Share of problems (in the rows given) right on the first try, 0–100; null when none were answered. */
  firstTryPct: number | null
  /** Topics practised at least STUCK_MIN times, not mastered, right first try under half the time — worst first. */
  stuck: { lessonId: string; problems: number; firstTryPct: number }[]
  mastered: number
  done: number
  /** Topics practised and not done yet (done = mastered, or 12 answers): real work in progress, told calmly. */
  practising: number
}

export const STUCK_MIN = 6

export function buildReport(points: readonly PointRow[], progress: readonly ProgressRow[], now: Date): Report {
  const problems = points.filter(p => p.reason === 'problem')
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (6 - i))
    const day = localDay(d)
    return { day, problems: problems.filter(p => localDay(new Date(p.created_at)) === day).length }
  })
  const pct = (xs: readonly PointRow[]) => Math.round(100 * xs.filter(p => p.points >= 2).length / xs.length)

  const byLesson = new Map<string, PointRow[]>()
  for (const p of problems) if (p.lesson_id) byLesson.set(p.lesson_id, [...(byLesson.get(p.lesson_id) ?? []), p])
  const mastered = new Set(progress.filter(r => r.mastered).map(r => r.lesson_id))
  const stuck = [...byLesson]
    .filter(([id, xs]) => xs.length >= STUCK_MIN && !mastered.has(id) && pct(xs) < 50)
    .map(([lessonId, xs]) => ({ lessonId, problems: xs.length, firstTryPct: pct(xs) }))
    .sort((a, b) => a.firstTryPct - b.firstTryPct || b.problems - a.problems)

  return {
    week,
    problemsThisWeek: week.reduce((n, d) => n + d.problems, 0),
    firstTryPct: problems.length ? pct(problems) : null,
    stuck,
    mastered: mastered.size,
    done: progress.filter(r => r.done).length,
    practising: progress.filter(r => !r.done).length,
  }
}

/**
 * The mastered topics for a parent (Review 1 Q4): grouped by module in teaching order, each with the day it was first
 * mastered — the `mastered` row of point_events (one per topic, a unique index) — or null when no such row survives
 * (the points ledger was emptied on 2026-09-17, so an older mastery has no date: say so, never guess one).
 * `other` counts mastered ids that are not a topic of any module (a legacy chapter), so the list never silently
 * disagrees with the tile's count.
 */
export interface MasteredGroup { moduleId: string; grade: number; n: number; title: string; topics: { id: string; title: string; day: Day | null }[] }
export function masteredByModule(
  progress: readonly ProgressRow[], dates: Readonly<Record<string, string>>,
  modules: readonly { id: string; grade: number; n: number; title: string; lessons: readonly { id: string; title: string }[] }[],
): { groups: MasteredGroup[]; other: number } {
  const mastered = new Set(progress.filter(r => r.mastered).map(r => r.lesson_id))
  const groups = modules
    .map(m => ({ moduleId: m.id, grade: m.grade, n: m.n, title: m.title,
      topics: m.lessons.filter(l => mastered.has(l.id)).map(l => ({ id: l.id, title: l.title, day: dates[l.id] ? localDay(new Date(dates[l.id])) : null })) }))
    .filter(g => g.topics.length > 0)
  const known = new Set(groups.flatMap(g => g.topics.map(t => t.id)))
  return { groups, other: [...mastered].filter(id => !known.has(id)).length }
}
