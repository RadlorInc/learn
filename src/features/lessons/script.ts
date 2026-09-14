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
  | { kind: 'eq'; text: string; lines?: string[] }
  // ── Grades 3–8 diagrams (drawn in ./Diagrams.tsx; every field is documented in docs/new-flow/AUTHORING.md) ──
  | { kind: 'bars'; bars: { parts: number; shaded: number; shade2?: number; split?: number; label?: string }[]; motion?: boolean }
  | { kind: 'tape'; rows: { label?: string; cells: { w: number; text?: string; shade?: boolean }[]; brace?: string }[]; motion?: boolean }
  | { kind: 'numline'; min: number; max: number; ticks: number; labels?: (string | null)[] | 'ends' | 'none';
      points?: { at: number; label?: string; open?: boolean }[]; jumps?: { from: number; to: number; label?: string }[];
      ray?: { from: number; dir: 'left' | 'right'; open: boolean }; motion?: boolean }
  | { kind: 'clock'; h: number; m: number; hands?: boolean; fives?: boolean }
  | { kind: 'measure'; tool: 'ruler' | 'scale' | 'jug' | 'thermometer'; min?: number; max: number; step: number; labelEvery?: number; value?: number | null; unit: string }
  | { kind: 'blocks'; hundreds: number; tens: number; ones: number; trade?: 'ones' | 'tens'; motion?: boolean }
  | { kind: 'columns'; rows: string[]; op?: '+' | '−' | '×'; carry?: string; places?: string[]; answer?: string | null; motion?: boolean }
  | { kind: 'longdiv'; divisor: string; dividend: string; quotient?: string; work?: string[] }
  | { kind: 'grid'; rows: number; cols: number; shade?: { r: number; c: number; h: number; w: number; tone?: 1 | 2 | 3 | 4 }[];
      hide?: { r: number; c: number; h: number; w: number }[]; top?: string; left?: string; split?: { col?: number; row?: number }; motion?: boolean }
  | { kind: 'area'; cols: string[]; rows: string[]; cells?: (string | null)[][]; widths?: number[]; heights?: number[]; motion?: boolean }
  | { kind: 'poly'; grid?: boolean; motion?: boolean
      shapes: { pts: [number, number][]; sides?: (string | null)[]; angles?: (string | null)[]; names?: (string | null)[]; right?: number[]; ticks?: number[]; tone?: 0 | 1 | 2 | 3 | 4; dashed?: boolean; open?: boolean }[]
      segs?: { a: [number, number]; b: [number, number]; label?: string; dashed?: boolean; arrow?: 'end' | 'both'; dots?: boolean; tone?: 1 | 2 }[]
      circles?: { c: [number, number]; r: number; label?: string; show?: 'r' | 'd' }[]
      labels?: { at: [number, number]; text: string; size?: number; tone?: 1 | 2 }[] }
  | { kind: 'angle'; deg: number; parts?: number[]; partLabels?: (string | null)[]; protractor?: boolean; label?: string; motion?: boolean }
  | { kind: 'chart'; type: 'bar' | 'picture' | 'dot' | 'hist'; labels: string[]; values: number[]; scale?: number; max?: number; unit?: string; key?: string; xLabel?: string; yLabel?: string; motion?: boolean }
  | { kind: 'plot'; points: [number, number][]; xMax: number; yMax: number; xStep?: number; yStep?: number; fit?: [[number, number], [number, number]]; xLabel?: string; yLabel?: string; motion?: boolean }
  | { kind: 'coord'; min: number; max: number; step?: number; points?: { x: number; y: number; label?: string }[];
      lines?: { a: [number, number]; b: [number, number]; extend?: boolean; dashed?: boolean; label?: string; tone?: 1 | 2 }[]; motion?: boolean }
  | { kind: 'table'; head?: string[]; rows: string[][]; rowHead?: boolean; mark?: [number, number][]; motion?: boolean }
  | { kind: 'cubes'; l: number; w: number; h: number; layers?: number; motion?: boolean }
  | { kind: 'solid'; shape: 'prism' | 'cylinder' | 'cone' | 'sphere' | 'pyramid'; labels?: { r?: string; h?: string; l?: string; w?: string } }
  | { kind: 'chips'; pos: number; neg: number; pairs?: number; motion?: boolean }
  | { kind: 'balance'; left: string; right: string }
  | { kind: 'spinner'; parts: string[]; tones?: (1 | 2 | 3 | 4)[] }

export type Op =
  | { t: 'mul'; a: number; b: number }                       // a groups of b
  | { t: 'turn'; a: number; b: number }                      // know a × b, find b × a
  | { t: 'div'; total: number; by: number; mode: 'share' | 'group' }
  | { t: 'missing'; a: number; total: number }               // a × ? = total

/**
 * What the child must give. A plain number (whole, decimal or negative), a fraction (any equal value is right —
 * 2/4 for 1/2 — unless `exact`), a clock time, or one of a few choices.
 */
export type Answer =
  | number
  | { frac: [number, number]; whole?: number; exact?: boolean }
  | { time: [number, number] }
  | { choices: string[]; correct: number }

/**
 * Either `op` (Module 1: the answer, worked steps and twin hints are derived from it) or `answer` + `steps`
 * (every later module: written in the data, and the independent answer key in the tests checks them).
 */
export interface Problem {
  text: string
  op?: Op
  answer?: Answer
  steps?: string[]
  picture: Picture        // Screen 8 / practice picture: it must not show the answer
}

export interface YourTurn extends Problem {
  prompt: string
  hint1: string
  hint2: string
  twin: Problem & { hint1?: string; hint2?: string }   // hints are required when the twin has no `op`
}

export interface Screen {
  title: string
  text: string
  pictures: Picture[]
  scene?: string          // a drawn backdrop behind the pictures (public/assets/lessons/<scene>.webp); lessonScenes.test.ts checks the file exists
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

/** The answer to a problem, whichever way it is given. */
export const solutionOf = (p: Problem): Answer => p.op ? answerOf(p.op) : p.answer!

/** The worked steps for a problem. */
export const stepsOf = (p: Problem): string[] => p.op ? workedSteps(p.op) : p.steps!

const fmtNum = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 6 })

/** How an answer is written back to the child ("Right! The answer is …"). */
export function showAnswer(a: Answer): string {
  if (typeof a === 'number') return fmtNum(a).replace('-', '−')
  if ('frac' in a) return `${a.whole ? `${a.whole} ` : ''}${a.frac[0]}/${a.frac[1]}`.replace('-', '−')
  if ('time' in a) return `${a.time[0]}:${String(a.time[1]).padStart(2, '0')}`
  return a.choices[a.correct]
}

/** A typed number: "1,250", "−3", "0.5", "3/4", "1 1/2". Null when it is not one. As [numerator, denominator]. */
export function parseRational(raw: string): [number, number] | null {
  const t = raw.trim().replace(/,/g, '').replace(/[−–]/g, '-').replace(/\s+/g, ' ')
  let m = t.match(/^(-)?(\d+) (\d+)\/(\d+)$/)
  if (m) { const w = +m[2], n = +m[3], d = +m[4]; if (!d) return null; return [(m[1] ? -1 : 1) * (w * d + n), d] }
  m = t.match(/^(-?\d+)\/(\d+)$/)
  if (m) return +m[2] ? [+m[1], +m[2]] : null
  m = t.match(/^(-?)(\d*)\.?(\d*)$/)
  if (m && (m[2] || m[3])) { const d = 10 ** m[3].length; return [(m[1] ? -1 : 1) * (Number(m[2] || 0) * d + Number(m[3] || 0)), d] }
  return null
}

/** Is what the child typed (or picked) right? Choices arrive as the index; a time as "h:mm". */
export function isCorrect(a: Answer, raw: string): boolean {
  if (raw.trim() === '') return false
  if (typeof a === 'object' && 'choices' in a) return raw === String(a.correct)
  if (typeof a === 'object' && 'time' in a) {
    const m = raw.trim().match(/^(\d{1,2}):(\d{1,2})$/)
    return !!m && +m[1] === a.time[0] && +m[2] === a.time[1]
  }
  const got = parseRational(raw)
  if (!got) return false
  if (typeof a === 'number') return Math.abs(got[0] / got[1] - a) < 1e-9
  const d = a.frac[1], n = (a.whole ?? 0) * d + a.frac[0]
  if (a.exact) {
    const t = raw.trim().replace(/\s+/g, ' ')
    return t === showAnswer(a)
  }
  return got[0] * d === n * got[1]
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
  const t = l.turn.twin
  if (t.hint1 && t.hint2) return [t.hint1, t.hint2]
  // Same shape as the doc's hints: hint 1 asks the question, hint 2 starts the count and stops ("…").
  const op = t.op!
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

export function check(l: Lesson, s: FlowState, given: string | number): FlowState {
  const p = currentProblem(l, s)
  if (!p || s.feedback === 'right') return s
  const ok = isCorrect(solutionOf(p), String(given))
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
