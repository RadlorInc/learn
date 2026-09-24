/**
 * The soft prerequisite nudge (founder, 2026-09-24): a nudge, never a lock. Opening a topic whose previous topic in
 * the same module is below PREREQ_THRESHOLD of the way (the ladder position, `progressOf`) shows a friendly card —
 * "Practise <prev> first" or "Go to <next> anyway", both fine — before the topic starts.
 *
 * Never shown: on a module's first topic; when a parent or teacher chose the child's topics (they already decided —
 * and a previous topic outside that list is not even on the child's map); when the child already started this topic
 * (never mid-session); more than once per topic per day.
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
  standingOf: (id: string) => Standing | null
  levelsOf: (id: string) => number | undefined
  /** This topic has a saved practice run: the child is part-way through it. */
  started: boolean
  shownToday: boolean
}): Nudge | null {
  const i = module.lessons.findIndex(l => l.id === lesson.id)
  const prev = i > 0 ? module.lessons[i - 1] : undefined
  if (!prev || ctx.started || ctx.shownToday) return null
  if (ctx.lessonIds?.length && (ctx.lessonIds.includes(lesson.id) || !ctx.lessonIds.includes(prev.id))) return null
  const levels = ctx.levelsOf(prev.id)
  if (!levels) return null
  const progress = progressOf(ctx.standingOf(prev.id), levels)
  return progress < PREREQ_THRESHOLD ? { prev, progress } : null
}
