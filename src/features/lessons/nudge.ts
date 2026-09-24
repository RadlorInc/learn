/**
 * The soft prerequisite nudge (founder, 2026-09-24): a nudge, never a lock. Opening a topic whose previous topic in
 * the same module is below PREREQ_THRESHOLD of the way (the ladder position, `progressOf`) shows a friendly card —
 * "Practise <prev> first" or "Go to <next> anyway", both fine — before the topic starts.
 *
 * Never shown: on a module's first topic; for an ASSIGNED topic — one with a due date (the adult already decided);
 * when the previous topic is not on the child's chosen list (it is not on their map); when the child already started
 * this topic (never mid-session); more than once per topic per day.
 * ⚠️ A chosen list alone is NOT an assignment (founder, 2026-09-24): a parent who ticks a whole module in the Lessons
 * tab chose which topics the child sees, not the order — and treating the list as "assigned" switched the card off for
 * every topic in the module, live on radlic.com. Only a due date says "do this one".
 */
import type { Lesson } from './script'
import type { Module } from './modules'
import { progressOf, type Standing } from './adaptive'

/** The one config value: how far along the previous topic must be for no card. */
export const PREREQ_THRESHOLD = 0.5

export interface Nudge { prev: Lesson; progress: number }

export function nudgeFor(lesson: Lesson, module: Module, ctx: {
  /** The child's chosen topics (`learners.lesson_ids`); null/empty = no choice made. */
  lessonIds: readonly string[] | null | undefined
  /** Due date per assigned topic (`learners.lesson_due`); a topic with one is assigned. */
  due: Readonly<Record<string, string>> | null | undefined
  standingOf: (id: string) => Standing | null
  levelsOf: (id: string) => number | undefined
  /** This topic has a saved practice run: the child is part-way through it. */
  started: boolean
  shownToday: boolean
}): Nudge | null {
  const i = module.lessons.findIndex(l => l.id === lesson.id)
  const prev = i > 0 ? module.lessons[i - 1] : undefined
  if (!prev || ctx.started || ctx.shownToday) return null
  if (ctx.due?.[lesson.id]) return null
  if (ctx.lessonIds?.length && !ctx.lessonIds.includes(prev.id)) return null
  const levels = ctx.levelsOf(prev.id)
  if (!levels) return null
  const progress = progressOf(ctx.standingOf(prev.id), levels)
  return progress < PREREQ_THRESHOLD ? { prev, progress } : null
}

/**
 * The parent's line (founder, 2026-09-24, option (a)): read from progress alone, never from an event. A topic the child
 * has started (it has a progress row) while the topic before it in the module is still under PREREQ_THRESHOLD —
 * "<name> started “X” before getting far with “Y”." True whether the child saw the card or the topic was assigned: it
 * describes progress, which the notice already covers ("how it shows you progress").
 */
export function startedAhead(rows: readonly (Standing & { lesson_id: string })[], modules: readonly Module[],
  levelsOf: (id: string) => number | undefined, lessonIds?: readonly string[] | null): { lesson: Lesson; prev: Lesson }[] {
  const byId = new Map(rows.map(r => [r.lesson_id, r]))
  // As with the card: a previous topic outside the child's chosen list is not on their map, so it is never named.
  const onMap = (id: string) => !lessonIds?.length || lessonIds.includes(id)
  return modules.flatMap(m => m.lessons.flatMap((lesson, i) => {
    const prev = m.lessons[i - 1], levels = prev && levelsOf(prev.id)
    if (!prev || !levels || !byId.has(lesson.id) || !onMap(prev.id)) return []
    return progressOf(byId.get(prev.id) ?? null, levels) < PREREQ_THRESHOLD ? [{ lesson, prev }] : []
  }))
}
