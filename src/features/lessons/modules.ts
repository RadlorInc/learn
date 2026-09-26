/**
 * Every grade's modules, in teaching order (docs/new-flow/curriculum.md). A module with no lessons is not built
 * yet; it is shown as "coming soon", never as a lock.
 */
import type { Lesson, Problem } from './script'
import { GRADE3_MODULE1, MODULE_1_TITLE } from './grade3Module1'
import { CONTENT } from './content'
import { STORY_GRADES, chaptersForGrade, chapterKey, type ChapterType } from '@/core/chapters'

/** `story`: a KG–2 story chapter shown as a module (grade 0 = KG). Its one "lesson" is the chapter itself, id `c:<chapter>`
 *  — the same id its progress and points are recorded under — and it plays at /game, never in the lesson player. */
export interface Module { id: string; grade: number; n: number; title: string; lessons: Lesson[]; story?: ChapterType }

const TITLES: Record<number, string[]> = {
  3: [MODULE_1_TITLE, 'Place value through metric measurement', 'Multiplication and division with 0, 1, 6, 7, 8, 9',
    'Multiplication and area', 'Fractions as numbers', 'Shapes, measuring and graphs'],
  4: ['Place value for addition and subtraction', 'Place value for multiplication and division',
    'Multiplication and division of multi-digit numbers', 'Foundations for fraction operations',
    'Angle measurements and plane figures', 'Place value for decimal fractions'],
  5: ['Place value concepts for multiplication and division with whole numbers', 'Addition and subtraction with fractions',
    'Multiplication and division with fractions', 'Place value for decimal operations',
    'Addition and multiplication with area and volume', 'Foundations to geometry in the coordinate plane'],
  6: ['Ratios, rates and proportions', 'Operations with fractions and mixed numbers', 'Operations with decimals', 'Percentages',
    'Algebraic expressions and one-step equations', 'Area, surface area, volume, shapes and angles', 'Data analysis and probability'],
  7: ['Proportional relationships and percent applications', 'Operations with rational numbers',
    'Equivalent expressions, equations and inequalities', 'Geometry', 'Statistics and probability'],
  8: ['Integer exponents, scientific notation and roots', 'Linear relationships, slope and systems', 'Functions',
    'Congruence, similarity and the Pythagorean theorem', 'Volume of cylinders, cones and spheres', 'Bivariate data and scatter plots'],
}

/**
 * KG, Grade 1 and Grade 2 (founder, 2026-09-25): each story chapter is a module, so every list of modules — the child's
 * home, the parent's and teacher's Lessons tab, progress, due dates — carries them the same way it carries Grades 3–8.
 * ⚠️ The "lesson" is a stand-in with no screens or practice: anything that PLAYS a lesson must check `module.story`
 * first (the /lesson page sends it to /game; practice and class exercises skip story modules).
 */
const storyLesson = (id: ChapterType, title: string) =>
  ({ id: chapterKey(id), title, skill: '', bigIdea: '', screens: [], turn: null, won: null, twinWon: null, practice: [] }) as unknown as Lesson
const STORY_MODULES: Module[] = STORY_GRADES.flatMap(grade => chaptersForGrade(grade).map((c, i) => (
  { id: `k${grade}m${i + 1}`, grade, n: i + 1, title: c.name, lessons: [storyLesson(c.id, c.name)], story: c.id })))

/** Grades 3–8: the grades with 9-screen lessons (and ladders, practice and class exercises). */
export const LESSON_GRADES = Object.keys(TITLES).map(Number)
/** Every grade a child or an adult can pick, KG first. */
export const GRADES = [...STORY_GRADES, ...LESSON_GRADES]
export const gradeName = (g: number) => g === 0 ? 'KG' : `Grade ${g}`

/** The lesson modules, Grades 3–8 — everything here has real lessons to play. */
export const MODULES: Module[] = LESSON_GRADES.flatMap(grade => TITLES[grade].map((title, i) => {
  const id = `g${grade}m${i + 1}`
  return { id, grade, n: i + 1, title, lessons: id === 'g3m1' ? GRADE3_MODULE1 : CONTENT[id] ?? [] }
}))
/** KG–8: what the child's home and the adults' lists show, story modules first. */
export const ALL_MODULES: Module[] = [...STORY_MODULES, ...MODULES]

export const modulesOf = (grade: number) => ALL_MODULES.filter(m => m.grade === grade)

/**
 * What a child sees when their parent chose topics: each module keeps only the chosen lessons, and a module with none
 * disappears. `null`/`undefined`/empty = no choice made = every topic.
 */
export function chosenModules(lessonIds: readonly string[] | null | undefined): Module[] {
  if (!lessonIds || lessonIds.length === 0) return ALL_MODULES
  const pick = new Set(lessonIds)
  return ALL_MODULES.map(m => ({ ...m, lessons: m.lessons.filter(l => pick.has(l.id)) })).filter(m => m.lessons.length > 0)
}
/** True when every lesson of `m` is in the child's list. A child with no choice (null) has every module. */
export function hasModule(lessonIds: readonly string[] | null | undefined, m: Module): boolean {
  if (!lessonIds || lessonIds.length === 0) return true
  return m.lessons.every(l => lessonIds.includes(l.id))
}

/** Lesson search (the Change panel): a module matches on its title or any topic title, case-insensitive. Returns the matching topics too. */
export function searchModule(m: Module, q: string): { hit: boolean; topics: string[] } {
  const n = q.trim().toLowerCase()
  if (!n) return { hit: true, topics: [] }
  const topics = m.lessons.map(l => l.title).filter(t => t.toLowerCase().includes(n))
  return { hit: m.title.toLowerCase().includes(n) || topics.length > 0, topics }
}

export const findModule = (id: string | null) => ALL_MODULES.find(m => m.id === id)
export const findLesson = (id: string | null) => {
  for (const m of ALL_MODULES) { const lesson = m.lessons.find(x => x.id === id); if (lesson) return { lesson, module: m } }
  return null
}

/**
 * A module's mixed practice: one problem from every topic — its last practice problem, the story one — interleaved
 * (first half and second half alternate) so the child has to work out which idea each problem needs, instead of
 * repeating the one before it.
 * ponytail: one problem per topic, fixed order. Add more per topic, or pick the child's weakest topics, when there is data.
 */
export function mixedPractice(m: Module): { problem: Problem; lesson: Lesson }[] {
  if (m.story) return []   // a story chapter has no practice problems; it practises inside the game
  const items = m.lessons.map(lesson => ({ problem: lesson.practice[lesson.practice.length - 1].problem, lesson }))
  const half = Math.ceil(items.length / 2)
  return items.flatMap((_, i) => i < half ? [items[i], items[i + half]].filter(Boolean) : [])
}
