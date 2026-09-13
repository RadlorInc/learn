/**
 * The Grade 3 modules, in teaching order. Titles are the approved split in docs/new-flow/README.md.
 * A module with no lessons is not built yet; it is shown as "coming soon", never as a lock.
 */
import type { Lesson, Problem } from './script'
import { GRADE3_MODULE1, MODULE_1_TITLE } from './grade3Module1'

export interface Module { id: string; n: number; title: string; lessons: Lesson[] }

export const GRADE3_MODULES: Module[] = [
  { id: 'g3m1', n: 1, title: MODULE_1_TITLE, lessons: GRADE3_MODULE1 },
  { id: 'g3m2', n: 2, title: 'Place value through metric measurement', lessons: [] },
  { id: 'g3m3', n: 3, title: 'Multiplication and division with 0, 1, 6, 7, 8, 9', lessons: [] },
  { id: 'g3m4', n: 4, title: 'Multiplication and area', lessons: [] },
  { id: 'g3m5', n: 5, title: 'Fractions as numbers', lessons: [] },
  { id: 'g3m6', n: 6, title: 'Shapes, measuring and graphs', lessons: [] },
]

/**
 * A module's mixed practice: one problem from every topic — its last practice problem, the story one — interleaved
 * (first half and second half alternate) so the child has to work out which idea each problem needs, instead of
 * repeating the one before it.
 * ponytail: one problem per topic, fixed order. Add more per topic, or pick the child's weakest topics, when there is data.
 */
export function mixedPractice(m: Module): { problem: Problem; lesson: Lesson }[] {
  const items = m.lessons.map(lesson => ({ problem: lesson.practice[lesson.practice.length - 1].problem, lesson }))
  const half = Math.ceil(items.length / 2)
  return items.flatMap((_, i) => i < half ? [items[i], items[i + half]].filter(Boolean) : [])
}
