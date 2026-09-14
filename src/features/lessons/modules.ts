/**
 * Every grade's modules, in teaching order (docs/new-flow/curriculum.md). A module with no lessons is not built
 * yet; it is shown as "coming soon", never as a lock.
 */
import type { Lesson, Problem } from './script'
import { GRADE3_MODULE1, MODULE_1_TITLE } from './grade3Module1'
import { CONTENT } from './content'

export interface Module { id: string; grade: number; n: number; title: string; lessons: Lesson[] }

const TITLES: Record<number, string[]> = {
  3: [MODULE_1_TITLE, 'Place value through metric measurement', 'Multiplication and division with 0, 1, 6, 7, 8, 9',
    'Multiplication and area', 'Fractions as numbers', 'Shapes, measuring and graphs'],
  4: ['Place value for addition and subtraction', 'Place value for multiplication and division',
    'Multiplication and division of multi-digit numbers', 'Foundations for fraction operations',
    'Angle measurements and plane figures', 'Place value for decimal fractions'],
  5: ['Place value for multiplication and division of whole numbers', 'Addition and subtraction with fractions',
    'Multiplication and division with fractions', 'Place value for decimal operations',
    'Addition and multiplication with area and volume', 'Foundations to geometry in the coordinate plane'],
  6: ['Ratios, rates and proportions', 'Operations with fractions and mixed numbers', 'Operations with decimals', 'Percentages',
    'Algebraic expressions and one-step equations', 'Area, surface area, volume, shapes and angles', 'Data analysis and probability'],
  7: ['Proportional relationships and percent applications', 'Operations with rational numbers',
    'Equivalent expressions, equations and inequalities', 'Geometry', 'Statistics and probability'],
  8: ['Integer exponents, scientific notation and roots', 'Linear relationships, slope and systems', 'Functions',
    'Congruence, similarity and the Pythagorean theorem', 'Volume of cylinders, cones and spheres', 'Bivariate data and scatter plots'],
}

export const GRADES = Object.keys(TITLES).map(Number)

export const MODULES: Module[] = GRADES.flatMap(grade => TITLES[grade].map((title, i) => {
  const id = `g${grade}m${i + 1}`
  return { id, grade, n: i + 1, title, lessons: id === 'g3m1' ? GRADE3_MODULE1 : CONTENT[id] ?? [] }
}))

export const modulesOf = (grade: number) => MODULES.filter(m => m.grade === grade)

/**
 * What a child sees when their parent chose topics: each module keeps only the chosen lessons, and a module with none
 * disappears. `null`/`undefined`/empty = no choice made = every topic.
 */
export function chosenModules(lessonIds: readonly string[] | null | undefined): Module[] {
  if (!lessonIds || lessonIds.length === 0) return MODULES
  const pick = new Set(lessonIds)
  return MODULES.map(m => ({ ...m, lessons: m.lessons.filter(l => pick.has(l.id)) })).filter(m => m.lessons.length > 0)
}
export const findModule = (id: string | null) => MODULES.find(m => m.id === id)
export const findLesson = (id: string | null) => {
  for (const m of MODULES) { const lesson = m.lessons.find(x => x.id === id); if (lesson) return { lesson, module: m } }
  return null
}

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
