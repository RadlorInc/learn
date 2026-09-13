/**
 * The new teaching flow: one lesson = the 9-screen "Step By Step Script" (docs/new-flow/).
 *
 *   Screens 1–7  teach, Next only, nothing to answer
 *   Screen 8     your turn: hint after 1 miss, hint after 2, then worked steps + a twin problem
 *   Screen 9     you got it (+ math word sticker)
 *   Practice     5 problems: a miss shows the big idea; a second miss shows the worked steps and
 *                offers the lesson again (Screens 1–7 are replayed only then)
 *
 * Pure data + pure transitions, so the flow is tested without a browser.
 */

export type Obj = 'cookie' | 'chair' | 'plant' | 'muffin' | 'dot' | 'sock' | 'finger' | 'straw' | 'wheel' | 'apple' | 'sticker' | 'crayon'

export type Picture =
  | { kind: 'groups'; groups: number; each: number; obj: Obj; show?: 'count' | 'running' | 'rings'; motion?: boolean }
  | { kind: 'scatter'; n: number; obj: Obj }
  | { kind: 'array'; rows: number; cols: number; obj: Obj; missing?: boolean; show?: 'rows' | 'oneRow' | 'running'; turn?: boolean; motion?: boolean }
  | { kind: 'line'; max: number; step: number; jumps: number; show?: 'count'; motion?: boolean }
  | { kind: 'share'; total: number; groups: number; state: 'start' | 'uneven' | 'deal' | 'done'; obj: Obj; motion?: boolean }
  | { kind: 'rings'; total: number; size: number; obj: Obj; state: 'start' | 'one' | 'all'; motion?: boolean }
  | { kind: 'triangle'; total: number; a: number; b: number | null; facts?: boolean }
  | { kind: 'cards'; wrong: string; right: string }
  | { kind: 'eq'; text: string }

export type Op =
  | { t: 'mul'; a: number; b: number }                       // a groups of b
  | { t: 'turn'; a: number; b: number }                      // know a × b, find b × a
  | { t: 'div'; total: number; by: number; mode: 'share' | 'group' }
  | { t: 'missing'; a: number; total: number }               // a × ? = total

export interface Problem {
  text: string
  op: Op
  picture: Picture        // interactive scratch picture on Screen 8 / practice
}

export interface YourTurn extends Problem {
  prompt: string
  hint1: string
  hint2: string
  twin: Problem
}

export interface Screen {
  title: string
  text: string
  pictures: Picture[]
}

export interface Lesson {
  id: string
  title: string
  skill: string
  bigIdea: string
  screens: Screen[]                           // exactly 7
  turn: YourTurn                              // Screen 8
  won: { text: string; sticker: string }      // Screen 9
  practice: { problem: Problem; why: string }[] // exactly 5
}

export const answerOf = (op: Op): number => {
  switch (op.t) {
    case 'mul':
    case 'turn':    return op.a * op.b
    case 'div':     return op.total / op.by
    case 'missing': return op.total / op.a
  }
}

const countBy = (step: number, n: number) => Array.from({ length: n }, (_, k) => step * (k + 1)).join(', ')

/** The worked steps shown after the last miss. Derived from the operation, so it cannot disagree with the answer. */
export function workedSteps(op: Op): string[] {
  switch (op.t) {
    case 'mul': return [
      `There are ${op.a} groups of ${op.b}.`,
      `Count by ${op.b}s, one group at a time: ${countBy(op.b, op.a)}.`,
      `So ${op.a} × ${op.b} = ${op.a * op.b}.`,
    ]
    case 'turn': return [
      `${op.a} × ${op.b} = ${op.a * op.b}.`,
      `${op.b} × ${op.a} is the same rows turned around. Nothing is added or taken away.`,
      `So ${op.b} × ${op.a} = ${op.a * op.b}.`,
    ]
    case 'div': {
      const q = op.total / op.by
      return op.mode === 'share' ? [
        `Share ${op.total} into ${op.by} equal groups, one at a time.`,
        `Each group gets ${q}, because ${op.by} groups of ${q} make ${op.total}.`,
        `So ${op.total} ÷ ${op.by} = ${q}.`,
      ] : [
        `Make groups of ${op.by} until none are left: ${countBy(op.by, q)}.`,
        `That is ${q} groups.`,
        `So ${op.total} ÷ ${op.by} = ${q}.`,
      ]
    }
    case 'missing': {
      const q = op.total / op.a
      return [
        `Think: ${op.a} groups of what make ${op.total}?`,
        `Count by ${op.a}s until you reach ${op.total}: ${countBy(op.a, q)}. That is ${q} jumps.`,
        `So the missing number is ${q}.`,
      ]
    }
  }
}

// ── The flow ───────────────────────────────────────────────────────────────────────────────────
export type Feedback = null | 'hint1' | 'hint2' | 'worked' | 'idea' | 'right'

export interface FlowState {
  mode: 'lesson' | 'turn' | 'won' | 'practice' | 'finish'
  screen: number          // 0..6 while mode === 'lesson'
  twin: boolean           // Screen 8 is showing the twin
  misses: number
  feedback: Feedback
  practice: number        // 0..4
  solo: number[]          // practice problems right on their own (no worked steps shown)
  replayFrom: number | null // practice index to return to after a replayed lesson
}

export const START: FlowState = { mode: 'lesson', screen: 0, twin: false, misses: 0, feedback: null, practice: 0, solo: [], replayFrom: null }

export function next(s: FlowState): FlowState {
  if (s.mode !== 'lesson') return s
  if (s.screen < 6) return { ...s, screen: s.screen + 1 }
  if (s.replayFrom !== null) return { ...s, mode: 'practice', practice: s.replayFrom, replayFrom: null, misses: 0, feedback: null }
  return { ...s, mode: 'turn' }
}

export const currentProblem = (l: Lesson, s: FlowState): Problem | null =>
  s.mode === 'turn' ? (s.twin ? l.turn.twin : l.turn)
  : s.mode === 'practice' ? l.practice[s.practice].problem
  : null

export function check(l: Lesson, s: FlowState, value: number): FlowState {
  const p = currentProblem(l, s)
  if (!p || s.feedback === 'right') return s
  const ok = value === answerOf(p.op)
  if (s.mode === 'turn') {
    if (ok) return { ...s, mode: 'won', misses: 0, feedback: null }
    const misses = s.misses + 1
    return { ...s, misses, feedback: misses === 1 ? 'hint1' : misses === 2 ? 'hint2' : 'worked' }
  }
  if (ok) return { ...s, feedback: 'right', solo: s.misses < 2 && !s.solo.includes(s.practice) ? [...s.solo, s.practice] : s.solo }
  const misses = s.misses + 1
  return { ...s, misses, feedback: misses === 1 ? 'idea' : 'worked' }
}

/** After the worked steps on Screen 8: the new twin (or, if the twin was also missed, on to practice). */
export const afterWorked = (s: FlowState): FlowState =>
  s.twin ? toPractice(s) : { ...s, twin: true, misses: 0, feedback: null }

export const toPractice = (s: FlowState): FlowState => ({ ...s, mode: 'practice', practice: 0, misses: 0, feedback: null })

export const nextPractice = (s: FlowState): FlowState =>
  s.practice >= 4 ? { ...s, mode: 'finish', misses: 0, feedback: null }
  : { ...s, practice: s.practice + 1, misses: 0, feedback: null }

export const replayLesson = (s: FlowState): FlowState =>
  ({ ...s, mode: 'lesson', screen: 0, misses: 0, feedback: null, replayFrom: s.practice })
