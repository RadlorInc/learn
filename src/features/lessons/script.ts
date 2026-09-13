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
  // `max` only on a teaching screen: a scratch line (Screen 8 / practice) is always scratchLineMax(step) long,
  // so no data entry can make its last tick sit on the answer.
  | { kind: 'line'; max?: number; step: number; jumps: number; show?: 'count'; motion?: boolean }
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
  scene?: 'table'         // a drawn backdrop behind the pictures (public/assets/lessons/<scene>.webp)
}

export interface Lesson {
  id: string
  title: string
  skill: string
  bigIdea: string
  screens: Screen[]                           // exactly 7
  turn: YourTurn                              // Screen 8
  won: { text: string; sticker: string }      // Screen 9
  twinWon: { text: string; sticker: string }  // Screen 9 when the child solved the TWIN (only the twin's numbers)
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
        `Think: ${op.a} × what number makes ${op.total}?`,
        `Count by ${op.a}s until you reach ${op.total}: ${countBy(op.a, q)}. That is ${q} jumps.`,
        `So the missing number is ${q}.`,
      ]
    }
  }
}

/** A scratch number line always has 12 jumps, so its last ticks never sit on (or just past) the answer. */
export const scratchLineMax = (step: number) => step * 12

/** Screen 8 hints. The approved doc writes hints for the first problem only; the twin's are derived
 *  from its own operation so they can never name the first problem's numbers. */
export function hintsFor(l: Lesson, s: FlowState): [string, string] {
  if (!s.twin) return [l.turn.hint1, l.turn.hint2]
  // Same shape as the doc's hints: hint 1 asks the question, hint 2 starts the count and stops ("…").
  const op = l.turn.twin.op
  // Start the count, but stop before it could reach the answer: with 2 groups the second number IS the answer.
  const start = (step: number, groups: number) => groups > 2 ? `${step}, ${step * 2} …` : `${step} …`
  switch (op.t) {
    case 'mul':  return ['How many groups are there? How many are in each group?', `There are ${op.a} groups of ${op.b}. Count by ${op.b}s: ${start(op.b, op.a)}`]
    case 'turn': return ['Turn the rows around. Were any added or taken away?', `${op.b} × ${op.a} is the same rows as ${op.a} × ${op.b}, turned around.`]
    case 'div':  return op.mode === 'share'
      ? ['Give one to each group. Then go round again until none are left.', `Share ${op.total} into ${op.by} equal groups. How many does each group get?`]
      : [`Make a group of ${op.by}. Keep going until none are left.`, `Count by ${op.by}s until you reach ${op.total}: ${start(op.by, op.total / op.by)} How many groups?`]
    case 'missing': return [`${op.a} × what number makes ${op.total}?`, `Count by ${op.a}s until you reach ${op.total}. How many jumps did you make?`]
  }
}

/** Screen 9 after a twin that was missed 3 times: the child did not get it, so it must not say so. */
export const KEEP_GOING = {
  title: "Let's keep practicing",
  text: 'You watched how it works, step by step. The practice problems will help it stick.',
}

/** What Screen 9 shows: the first problem solved, the twin solved, or the twin missed three times. */
export function wonFor(l: Lesson, s: FlowState): { title: string; text: string; sticker: string; helped: boolean } {
  if (!s.twin) return { title: 'You got it', ...l.won, helped: false }
  if (s.misses >= 3) return { ...KEEP_GOING, sticker: l.twinWon.sticker, helped: true }
  return { title: 'You got it', ...l.twinWon, helped: false }
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
  if (s.replayFrom !== null) return { ...s, mode: 'practice', practice: s.replayFrom, replayFrom: null, misses: 2, feedback: null }
  return { ...s, mode: 'turn' }
}

/** Back one screen on Screens 2–8. From Screen 8, twin and misses are kept, so Next returns to the same problem, not a fresh first try. */
export const back = (s: FlowState): FlowState =>
  s.mode === 'turn' ? { ...s, mode: 'lesson', screen: 6, feedback: null }
  : s.mode === 'lesson' && s.screen > 0 ? { ...s, screen: s.screen - 1 }
  : s

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

/** After the worked steps on Screen 8: the new twin — or, if the twin was also missed, Screen 9 (its
 *  "keep practicing" version: `misses` stays at 3 so wonFor knows the child did not solve it). */
export const afterWorked = (s: FlowState): FlowState =>
  s.twin ? { ...s, mode: 'won', feedback: null } : { ...s, twin: true, misses: 0, feedback: null }

export const toPractice = (s: FlowState): FlowState => ({ ...s, mode: 'practice', practice: 0, misses: 0, feedback: null })

export const nextPractice = (s: FlowState): FlowState =>
  s.practice >= 4 ? { ...s, mode: 'finish', misses: 0, feedback: null }
  : { ...s, practice: s.practice + 1, misses: 0, feedback: null }

export const replayLesson = (s: FlowState): FlowState =>
  ({ ...s, mode: 'lesson', screen: 0, misses: 0, feedback: null, replayFrom: s.practice })
