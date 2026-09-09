/**
 * THE MISSION BRIEF (9–11 · `wordProblems`) — the pure module.
 *
 * ⚠️ EXTRACTED FROM THE COMPONENT ON THE PORT TO GameShell (2026-08-14), because it was the ONE
 * chapter in this band whose generator lived inside React — so nothing about its arithmetic, its
 * distractors or its words could be reached by a gate, and it was the only 9–11 chapter with no
 * test file at all. Moving it changed no behaviour; it made the behaviour checkable.
 *
 * ⚠️ THE DISTRACTORS ARE THE CHAPTER. A word problem is only hard because you have to decide WHICH
 * operation it is, so every wrong choice is the answer you would get by picking the wrong one —
 * `a + b` on a multiply round, `a − b` on an add round. Random near-misses would turn it into
 * arithmetic with a story stapled on.
 */
import { rint, shuffle, pick } from '@/core/rand'

export type Op = 'add' | 'sub' | 'mul' | 'div' | 'mul_sub' | 'mul_add'
export interface WpRound {
  op: Op; a: number; b: number; c: number    // c unused for one-step (kept for sig/reveal)
  story: string; equation: string; answer: number
  prompt: string; tag: string; say: string
  choices: string[]
}

// theme vocab — countable "space cargo" nouns; keep answers positive integers
const ITEMS = ['crystals', 'rovers', 'bolts', 'cells', 'samples', 'pods']

// build 3 numeric choices: correct + two plausible near/wrong-op distractors
export function choicesFor(answer: number, distractors: number[]): string[] {
  const opts = new Set<number>([answer])
  for (const d of distractors) { if (opts.size >= 3) break; if (d > 0 && d !== answer) opts.add(d) }
  let k = 1
  while (opts.size < 3) { for (const cand of [answer + k, answer - k]) { if (cand > 0 && !opts.has(cand)) { opts.add(cand); break } } k++ }
  return shuffle([...opts].slice(0, 3).map(String))
}

export function mkAdd(): WpRound {
  const it = pick(ITEMS), a = rint(21, 48), b = rint(14, 41)
  const ans = a + b
  return { op: 'add', a, b, c: 0, story: `Milo collects ${a} ${it} on Monday and ${b} more on Tuesday. How many ${it} in all?`,
    equation: `${a} + ${b} = ${ans}`, answer: ans, prompt: 'Solve the brief.', tag: 'Mission', say: `Milo collects ${a} ${it} on Monday and ${b} more on Tuesday. How many ${it} in all?`,
    choices: choicesFor(ans, [Math.abs(a - b), ans + 10, ans - 10]) }
}
export function mkSub(): WpRound {
  const it = pick(ITEMS), a = rint(45, 90), b = rint(12, a - 5)
  const ans = a - b
  return { op: 'sub', a, b, c: 0, story: `Milo starts with ${a} ${it} and uses ${b} of them. How many ${it} are left?`,
    equation: `${a} − ${b} = ${ans}`, answer: ans, prompt: 'Solve the brief.', tag: 'Mission', say: `Milo starts with ${a} ${it} and uses ${b} of them. How many ${it} are left?`,
    choices: choicesFor(ans, [a + b, ans + 1, ans - 1]) }
}
export function mkMul(): WpRound {
  const it = pick(ITEMS), a = rint(3, 9), b = rint(4, 9)
  const ans = a * b
  return { op: 'mul', a, b, c: 0, story: `Milo packs ${b} ${it} into each of ${a} crates. How many ${it} altogether?`,
    equation: `${a} × ${b} = ${ans}`, answer: ans, prompt: 'Solve the brief.', tag: 'Mission', say: `Milo packs ${b} ${it} into each of ${a} crates. How many ${it} altogether?`,
    choices: choicesFor(ans, [a + b, ans + b, ans - a]) }
}
export function mkDiv(): WpRound {
  const it = pick(ITEMS), b = rint(3, 8), q = rint(3, 8)
  const a = b * q, ans = q
  return { op: 'div', a, b, c: 0, story: `A bay holds ${a} ${it} shared equally into ${b} racks. How many ${it} per rack?`,
    equation: `${a} ÷ ${b} = ${ans}`, answer: ans, prompt: 'Solve the brief.', tag: 'Mission', say: `A bay holds ${a} ${it} shared equally into ${b} racks. How many ${it} per rack?`,
    choices: choicesFor(ans, [a - b, ans + 1, ans + 2]) }
}
export function mkMulSub(): WpRound {
  const it = pick(ITEMS), a = rint(3, 6), b = rint(4, 7), c = rint(2, a * b - 2)
  const ans = a * b - c
  return { op: 'mul_sub', a, b, c, story: `Milo has ${a} boxes of ${b} ${it}, then gives away ${c}. How many ${it} are left?`,
    equation: `${a} × ${b} − ${c} = ${ans}`, answer: ans, prompt: 'Solve the brief.', tag: 'Mission', say: `Milo has ${a} boxes of ${b} ${it}, then gives away ${c}. How many ${it} are left?`,
    choices: choicesFor(ans, [a * b, a * b + c, ans - 1]) }
}
export function mkMulAdd(): WpRound {
  const it = pick(ITEMS), a = rint(3, 6), b = rint(4, 7), c = rint(2, 9)
  const ans = a * b + c
  return { op: 'mul_add', a, b, c, story: `Milo buys ${a} packs of ${b} ${it}, then finds ${c} more. How many ${it} in total?`,
    equation: `${a} × ${b} + ${c} = ${ans}`, answer: ans, prompt: 'Solve the brief.', tag: 'Mission', say: `Milo buys ${a} packs of ${b} ${it}, then finds ${c} more. How many ${it} in total?`,
    choices: choicesFor(ans, [a * b, a + b + c, ans + 1]) }
}

/**
 * ⚠️ DOES THE STORY PRINT ITS OWN ANSWER? Measured 2026-08-20 over 60,000 draws:
 *
 *     div      16.0%   "A bay holds 25 bolts shared equally into 5 racks. How many per rack?"   → 5
 *     mul_sub   9.6%   "Milo has 3 boxes of 6 bolts, then gives away 12. How many are left?"    → 6
 *     sub       1.0%   "Milo starts with 84 rovers and uses 42 of them. How many are left?"     → 42
 *     add / mul / mul_add — 0%, they cannot
 *
 * A division whose divisor equals its quotient is a SQUARE, and "how many per rack" is then the
 * same number as "how many racks" — so a child who cannot divide reads the answer off the story and
 * taps it out of three choices. It also collapses the thing this chapter is FOR: every distractor
 * here is the answer you would get from the wrong operation, and none of that matters if "copy a
 * number you can see" wins.
 *
 * ⚠️ THE GUARD IS HERE, IN THE ONE PLACE, NOT IN THREE MAKERS. Structural constraints inside mkDiv
 * (`q !== b`) and mkMulSub would work today and would be forgotten by the seventh maker somebody
 * adds. Anything reachable through this function is checked, for ever.
 */
export const storyNamesAnswer = (r: WpRound): boolean =>
  new RegExp(`(^|[^\\d])${r.answer}([^\\d]|$)`).test(r.story)

export function makeRound(d: 1 | 2 | 3): WpRound {
  const pool = d === 1 ? [mkAdd, mkSub] : d === 2 ? [mkMul, mkDiv] : [mkMulSub, mkMulAdd]
  // At worst 16% of draws leak, so 40 tries misses by a margin nothing will ever reach; the last
  // one is returned rather than looping, because a chapter that hangs is worse than one that leaks.
  let r = pick(pool)()
  for (let i = 0; i < 40 && storyNamesAnswer(r); i++) r = pick(pool)()
  return r
}

/** Math-only dedupe key, so a re-themed noun is not "a new question". */
export const sigFor = (r: WpRound) => `${r.op}|${r.a}|${r.b}|${r.c}`

/** The worked line, spoken on a 3-wrong re-teach. Written as well as spoken. */
export function explainBeats(r: WpRound): string[] {
  return [
    r.story,
    `The words tell you which one it is. Here it is ${OP_WORD[r.op]}.`,
    `So the sum is ${r.equation.split(' = ')[0]}.`,
    `Which comes to ${r.answer}.`,
  ]
}

const OP_WORD: Record<Op, string> = {
  add: 'an add', sub: 'a take-away', mul: 'a multiply', div: 'a share out',
  mul_sub: 'a multiply and then a take-away', mul_add: 'a multiply and then an add',
}

/** ⚠️ Never names the answer — it names the DECISION, which is what the round is about. */
export function missFor(r: WpRound): string {
  return r.op === 'div' || r.op === 'mul'
    ? 'Read it again — does each one get the same, or are they all put together?'
    : 'Read it again — is this putting together, or taking away?'
}
