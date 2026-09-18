/**
 * A free teacher's class EXERCISE (founder's call, 2026-09-18): one module, one difficulty level, a number of questions —
 * the SAME questions for every child in the class, and not adaptive (a miss does not change what comes next).
 *
 * "The same for everyone" is the seed: it is saved on the exercise when the teacher makes it, and every child's device
 * draws from `rng(seed)`, so every child gets the identical list in the identical order. Topics take turns
 * (topic 1, 2, 3 … then round again), and the level is the ladder's level — 1 the simplest kind of question, 5 the
 * hardest (see ../lessons/adaptive.ts: a harder level is a different KIND of question, not bigger numbers).
 */
import { rng, draw } from '@/features/lessons/adaptive'
import { ladderOf } from '@/features/lessons/ladders'
import { findModule } from '@/features/lessons/modules'
import type { Lesson, Problem } from '@/features/lessons/script'

/**
 * `open`: a new exercise is LOCKED (false) until the teacher opens it for the test (founder, 2026-09-18); the database
 * refuses a result for a locked one. An exercise saved before locking existed has no `open` and counts as open.
 */
export interface Exercise { id: string; module: string; level: number; count: number; seed: number; open?: boolean }
export const isOpen = (ex: Exercise) => ex.open !== false

export const LEVELS = [1, 2, 3, 4, 5] as const
export const MAX_COUNT = 50

/** The exercise's questions, identical on every device. Empty when the module has no practice yet. */
export function exerciseItems(ex: Exercise): { problem: Problem; lesson: Lesson }[] {
  const topics = (findModule(ex.module)?.lessons ?? []).filter(l => ladderOf(l.id))
  if (!topics.length) return []
  const r = rng(ex.seed)
  const count = Math.max(1, Math.min(MAX_COUNT, Math.floor(ex.count)))
  const out: { problem: Problem; lesson: Lesson }[] = []
  for (let k = 0; k < count; k++) {
    const lesson = topics[k % topics.length]
    const problem = draw(ladderOf(lesson.id)!, Math.max(0, Math.floor(ex.level) - 1), r, out.slice(-6).map(x => x.problem.text))
    out.push({ problem, lesson })
  }
  return out
}

export function newExercise(module: string, level: number, count: number): Exercise {
  const a = new Uint32Array(2)
  crypto.getRandomValues(a)
  return { id: a[0].toString(36), module, level, count, seed: a[1] >>> 1, open: false }
}

/**
 * The teacher's view of one exercise: each student's FIRST attempt is the test result (later ones are practice), and for
 * each question, how many of the students who took it got it right first time.
 */
type Outcome = 'first' | 'second' | 'worked'
export interface StudentResult { learnerId: string; done: boolean; right: number; total: number; attempts: number; at: string | null }
export interface ExerciseSummary { students: StudentResult[]; done: number; perQuestion: { right: number; of: number }[] }

export function summarize(
  exerciseId: string,
  studentIds: readonly string[],
  results: readonly { learner_id: string; exercise_id: string; outcomes: readonly Outcome[]; created_at: string }[],
): ExerciseSummary {
  const mine = results.filter(r => r.exercise_id === exerciseId).slice().sort((a, b) => a.created_at.localeCompare(b.created_at))
  const students = studentIds.map(id => {
    const tries = mine.filter(r => r.learner_id === id)
    const first = tries[0]
    return first
      ? { learnerId: id, done: true, right: first.outcomes.filter(o => o === 'first').length, total: first.outcomes.length, attempts: tries.length, at: first.created_at }
      : { learnerId: id, done: false, right: 0, total: 0, attempts: 0, at: null }
  })
  const firsts = studentIds.map(id => mine.find(r => r.learner_id === id)).filter(Boolean) as typeof mine
  const n = Math.max(0, ...firsts.map(r => r.outcomes.length))
  const perQuestion = Array.from({ length: n }, (_, i) => {
    const took = firsts.filter(r => i < r.outcomes.length)
    return { right: took.filter(r => r.outcomes[i] === 'first').length, of: took.length }
  })
  return { students, done: firsts.length, perQuestion }
}
