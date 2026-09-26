/**
 * Adaptive practice. A topic's LADDER is a list of question STYLES, easiest first — not the same question with bigger
 * numbers, but a different kind of question (picture → bare numbers → missing number → story → spot the mistake …).
 * Each style is a generator: it picks its own numbers and computes the answer and worked steps from them, so a
 * problem can never disagree with its answer and never runs out.
 *
 * The child never sees a level (math without fear: difficulty stays invisible). The rules, stated once:
 *   - right on the first try, twice in a row → one level up;
 *   - right after a miss → stay;
 *   - worked steps shown (two misses) → one level down;
 *   - right on the first try twice in a row at the TOP level → mastered.
 * Practice has no end count (founder, 2026-09-24): after every CHECKPOINT answers — and the moment a topic is mastered —
 * the child chooses Keep going or Take a break, and the run is saved so the next visit continues from exactly there.
 * The topic counts as done once mastered, or after DONE_AFTER answers across all its sessions.
 * Lesson practice, module practice and the review problem all move the same per-topic Standing with `step`.
 */
import type { Problem } from './script'

export type Rng = () => number

/** mulberry32: small, seedable, good enough to pick numbers for a child's question. */
export function rng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
/** A whole number from lo to hi, both included. */
export const int = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))
export const pick = <T>(r: Rng, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]
/** Shuffle a copy. */
export const shuffle = <T>(r: Rng, xs: readonly T[]): T[] => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
/** 12345 → "12,345" — how every number is written in a question. */
export const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 6 })

export interface Level {
  /** What kind of question this is, for authors and tests only — never shown to the child. */
  style: string
  make: (r: Rng) => Problem
  /**
   * The picture IS the data the answer is read from (a data set whose median is one of its values, a dot plot whose mode
   * is a column), so the answer may legitimately appear in it. Only for chart/table/numline pictures; the gate checks.
   */
  dataShown?: true
}

export interface Standing { level: number; streak: number; mastered: boolean }
export const FRESH: Standing = { level: 0, streak: 0, mastered: false }

/** How a problem went: right on the first try, right after a miss, or the worked steps were shown. */
export type Outcome = 'first' | 'second' | 'worked'

/** A checkpoint after every CHECKPOINT answers: Keep going (CHECKPOINT more) or Take a break. */
export const CHECKPOINT = 5
/** A topic is done once mastered, or once this many problems have been answered across all its sessions. */
export const DONE_AFTER = 12
/** How many question texts a run remembers so it does not ask them again — across sessions, since it is saved. */
export const SEEN = 40

export function step(s: Standing, levels: number, o: Outcome): Standing {
  const top = levels - 1
  const level = Math.min(s.level, top)
  if (o === 'worked') return { level: Math.max(0, level - 1), streak: 0, mastered: false }
  if (o === 'second') return { level, streak: 0, mastered: s.mastered }
  if (s.streak + 1 < 2) return { level, streak: s.streak + 1, mastered: s.mastered }
  return level === top ? { level, streak: 0, mastered: true } : { level: level + 1, streak: 0, mastered: s.mastered }
}

/**
 * ONE MASTERY RULE (N19, founder 2026-09-26: "keep the new ladder rule only, retire the legacy count rule"). A story
 * chapter is marked mastered by `step` above, exactly as a topic is: right on the first try twice in a row at the TOP
 * level. A chapter's three tiers are its ladder (CHAPTER_TIERS levels); `tier` is the tier the question was asked at.
 * A chapter answer is one attempt, so its outcome is read from the misses just before it: right with none = 'first',
 * right after a miss = 'second', a second miss in a row = 'worked' (a lone miss waits for the next answer, as a
 * topic's problem does). Only `streak` and `mastered` come back: the chapter's TIER still moves by its own
 * promote/demote rules (`core/progression.ts`), which this does not change.
 */
export const CHAPTER_TIERS = 3
export function chapterMastery(m: { streak: number; mastered: boolean }, tier: number, correct: boolean, missesBefore: number): { streak: number; mastered: boolean } {
  const o: Outcome | null = correct ? (missesBefore > 0 ? 'second' : 'first') : missesBefore > 0 ? 'worked' : null
  if (!o) return m
  const n = step({ level: tier - 1, ...m }, CHAPTER_TIERS, o)
  return { streak: n.streak, mastered: n.mastered }
}

/** Where a topic's practice starts: its saved standing, or — first time — one level up if Screen 8 went right first try. */
export const startLevel = (saved: Standing | null, turnFirstTry: boolean, levels: number): Standing =>
  saved ? { ...saved, level: Math.min(saved.level, levels - 1), streak: 0 } : { ...FRESH, level: turnFirstTry && levels > 1 ? 1 : 0 }

/** A problem at `level`, avoiding question texts the child has just seen (a generator with few numbers may repeat). */
export function draw(ladder: readonly Level[], level: number, r: Rng, recent: readonly string[] = []): Problem {
  const lv = ladder[Math.min(level, ladder.length - 1)]
  let p = lv.make(r)
  for (let i = 0; i < 20 && recent.includes(p.text); i++) p = lv.make(r)
  return p
}

/** A fresh seed per practice run, so two runs do not ask the same problems. */
export const freshSeed = () => Math.floor(Math.random() * 2 ** 31)

// ── One practice run ────────────────────────────────────────────────────────────────────────────────────────
/**
 * A topic's practice run. `current` is the problem on screen and the topic it came from: usually this topic, but once
 * per round of CHECKPOINT (the REVIEW_AT-th problem) it may be an earlier topic the child finished and has not
 * mastered — that is how a weak topic comes back. A review problem moves ITS topic's standing, never this one's.
 * `asked` counts every answer on this topic's practice, across sessions; `recent` the last SEEN question texts.
 */
export interface Run {
  standing: Standing
  asked: number
  recent: string[]
  current: { problem: Problem; from: string }
  review: { id: string; standing: Standing } | null
}
/** What is saved between sessions: the run without the standings, which are stored per topic on their own. */
export interface SavedRun { asked: number; recent: string[]; current: { problem: Problem; from: string }; review: string | null }
export const toSaved = (run: Run): SavedRun => ({ asked: run.asked, recent: run.recent, current: run.current, review: run.review?.id ?? null })
/** A saved run, with the standings as they are now (a review topic may have moved since). */
export const fromSaved = (saved: SavedRun, standing: Standing, reviewStanding: Standing | null): Run => ({
  standing,   // streak kept: a resume continues exactly where the child stopped
  asked: saved.asked, recent: saved.recent, current: saved.current,
  review: saved.review ? { id: saved.review, standing: reviewStanding ?? FRESH } : null,
})
/**
 * How far a child is with a topic, 0–1: the ladder position, mastered = 1, never started = 0 (founder, 2026-09-24).
 * On a 4-level ladder: level 0 → 0, 1 → ¼, 2 → ½, 3 → ¾, mastered → 1. Shown to a child only as a bar, never a number.
 */
export const progressOf = (s: Standing | null, levels: number): number =>
  !s ? 0 : s.mastered ? 1 : Math.min(s.level, levels - 1) / levels
/** Done: mastered, or DONE_AFTER problems answered — however many sessions that took. */
export const runDone = (run: Run): boolean => run.standing.mastered || run.asked >= DONE_AFTER
/** Why practice stops for a choice after an answer: the topic was just mastered, or a round of CHECKPOINT ended. */
export type Pause = 'mastered' | 'checkpoint' | null
export const REVIEW_AT = 2

export type LadderOf = (lessonId: string) => readonly Level[] | undefined

export function beginRun(id: string, ladder: readonly Level[], standing: Standing, r: Rng, review: Run['review']): Run {
  const problem = draw(ladder, standing.level, r)
  return { standing, asked: 0, recent: [problem.text], current: { problem, from: id }, review }
}

/**
 * After a problem: move the right standing, then draw the next problem — practice never ends by itself. `pause` says
 * whether to stop for the child's choice first. `saved` lists every standing that changed, for the caller to store.
 */
export function advance(run: Run, id: string, ladderOf: LadderOf, o: Outcome, r: Rng): { run: Run; pause: Pause; saved: [string, Standing][] } {
  const ladder = ladderOf(id)!
  let { standing, review } = run
  const saved: [string, Standing][] = []
  if (run.current.from === id) { standing = step(standing, ladder.length, o); saved.push([id, standing]) }
  else if (review) { review = { ...review, standing: step(review.standing, ladderOf(review.id)!.length, o) }; saved.push([review.id, review.standing]) }
  const asked = run.asked + 1
  const pause: Pause = standing.mastered && !run.standing.mastered ? 'mastered' : asked % CHECKPOINT === 0 ? 'checkpoint' : null
  const reviewLadder = review && !review.standing.mastered && asked % CHECKPOINT === REVIEW_AT ? ladderOf(review.id) : undefined
  const current = reviewLadder && review
    ? { problem: draw(reviewLadder, review.standing.level, r, run.recent), from: review.id }
    : { problem: draw(ladder, standing.level, r, run.recent), from: id }
  return { run: { standing, review, asked, recent: [...run.recent, current.problem.text].slice(-SEEN), current }, pause, saved }
}

/** The earlier topic to bring back: finished, laddered, not mastered — the lowest standing first, then the earliest. */
export function reviewTopic(earlier: readonly string[], done: (id: string) => boolean, standingOf: (id: string) => Standing | null, ladderOf: LadderOf): Run['review'] {
  const weak = earlier
    .filter(id => done(id) && ladderOf(id))
    .map(id => ({ id, standing: standingOf(id) ?? FRESH }))
    .filter(x => !x.standing.mastered)
  weak.sort((a, b) => a.standing.level - b.standing.level)
  return weak[0] ?? null
}

/**
 * A module's adaptive mixed practice: MODULE_PROBLEMS problems, each from the weakest topic not asked just before.
 * Weakest = played and not mastered (lowest level first); a never-played topic counts as level 3, a mastered one as 100 —
 * and every time a topic has already been asked in this run counts as two levels up, so two weak topics cannot take all
 * ten problems. ⚠️ Never-played used to count as 50: one answer saves a standing, so a child who missed everything was
 * asked the same two topics ten times and never saw the rest (driven 2026-09-17 on g3m1). Ties at random.
 */
export const MODULE_PROBLEMS = 10
export function nextModuleTopic(ids: readonly string[], standingOf: (id: string) => Standing | null, asked: readonly string[], r: Rng): string {
  const last = asked.at(-1)
  const pool = ids.length > 1 ? ids.filter(id => id !== last) : [...ids]
  const score = (id: string) => { const s = standingOf(id); return (!s ? 3 : s.mastered ? 100 : s.level) + 2 * asked.filter(x => x === id).length }
  const tie = new Map(pool.map(id => [id, r()]))
  return pool.sort((a, b) => score(a) - score(b) || tie.get(a)! - tie.get(b)!)[0]
}
