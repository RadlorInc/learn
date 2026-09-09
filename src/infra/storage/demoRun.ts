'use client'
/**
 * The try-before-signup demo: a band, and the chapters played without an account.
 *
 * ⚠️ LOCAL ONLY, BY CONSTRUCTION AND NOT BY OVERSIGHT. There is no account to write to and no
 * learner id to key on, so nothing here reaches the server. That is the whole shape of the demo —
 * and it is also the reason `progressMerge` cannot help a demo visitor: it is server→local, and a
 * demo run never reaches the server. Adopting this into a real learner at signup is a separate
 * step, and until it exists a demo player who signs up starts from nothing on a second device.
 *
 * ⚠️ kv, NOT sessionStorage. A parent who tries two chapters on the sofa and signs up the next
 * morning is the whole point; a per-tab record would throw that away. No TTL: unlike a half-finished
 * probe, "chapters already played" does not go stale, and the cap is what ends the demo.
 */
import { kv } from '@/infra/storage/kv'
import { gradeStartPlan, type AgeGroup } from '@/core/chapters'
import { demoEligible } from '@/core/arChapters'

/** How many chapters a visitor may play before the account. */
export const DEMO_LIMIT = 2

const KEY = 'milo-demo-run'

/** What a demo chapter produced. Kept so signing up can carry the play onto the account. */
export interface DemoResult { chapter: string; correct: number; wrong: number; mastered: boolean }

/**
 * ⚠️ ONE LIST, NOT TWO. An earlier shape had `done: string[]` alongside the scores; two records of
 * the same fact drift the first time one write path forgets the other. The chapter ids are DERIVED.
 */
export interface DemoRun { band: AgeGroup; results: DemoResult[]; startedAt: string }

export const doneChapters = (run: DemoRun | null): string[] => run?.results.map(r => r.chapter) ?? []

/**
 * The chapters this band's demo offers: the start of the same `gradeStartPlan` a skipper gets, minus
 * anything that would ask for the camera.
 *
 * ⚠️⚠️ THE AR FILTER IS CURRENTLY INERT, AND THAT IS WHY IT IS SPLIT OUT. Measured 2026-08-24, no
 * band's first two chapters ask for the camera — so deleting the filter changes nothing today and
 * every test over the real bands stays green, which is exactly what an inert clause looks like from
 * outside: protection nobody has watched work. It becomes load-bearing the instant a curriculum
 * order changes, and what it prevents is a logged-out child being offered "Turn on the camera".
 *
 * So the POLICY is separated from the band lookup: `pickDemo` takes a plan, so a gate can hand it a
 * plan that DOES start with a camera chapter and watch the filter bind. Keeping the clause and
 * making it untestable would have been the worse half of both options.
 */
export const pickDemo = (plan: string[]): string[] =>
  plan.filter(demoEligible).slice(0, DEMO_LIMIT)

export function demoChapters(band: AgeGroup): string[] {
  return pickDemo(gradeStartPlan(band))
}

export function readDemo(): DemoRun | null {
  try {
    const r = JSON.parse(kv.get(KEY) || 'null')
    return r && typeof r.band === 'string' && Array.isArray(r.results) ? r as DemoRun : null
  } catch { return null }
}

export function startDemo(band: AgeGroup): DemoRun {
  const run: DemoRun = { band, results: [], startedAt: new Date().toISOString() }
  try { kv.set(KEY, JSON.stringify(run)) } catch { /* storage unavailable */ }
  return run
}

/**
 * Record a finished demo chapter. Idempotent — replaying one does not spend a second slot.
 *
 * ⚠️ THE COUNTS ARE KEPT BECAUSE THE ACCOUNT WILL WANT THEM. `scoreChapter` is pure, so signing up
 * can recompute the stars, XP and coins this run earned and write them against the new learner —
 * without re-running the store's scorer, which already ran during the demo and would double-count.
 */
export function completeDemoChapter(chapterId: string, correct = 0, wrong = 0, mastered = false): DemoRun | null {
  const run = readDemo()
  if (!run || doneChapters(run).includes(chapterId)) return run
  const next: DemoRun = { ...run, results: [...run.results, { chapter: chapterId, correct, wrong, mastered }] }
  try { kv.set(KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  return next
}

/** The next chapter to play, or null once the demo is used up. */
export function nextDemoChapter(run: DemoRun | null): string | null {
  if (!run) return null
  const done = doneChapters(run)
  return demoChapters(run.band).find(c => !done.includes(c)) ?? null
}

export const demoUsedUp = (run: DemoRun | null): boolean =>
  !!run && nextDemoChapter(run) === null

export function clearDemo(): void {
  try { kv.remove(KEY) } catch { /* nothing to clear */ }
}

/**
 * ADOPT A DEMO RUN ONTO A REAL LEARNER — the step that makes the demo worth playing.
 *
 * ⚠️⚠️ WITHOUT THIS, SIGNING UP IS A PUNISHMENT. A parent who plays two chapters and then creates an
 * account currently finds nothing: no stars, no XP, and a plan whose first step is the chapter their
 * child just finished. That is worse than never having played — they have been shown the product and
 * then had it taken away at the exact moment they committed. `progressMerge` cannot help: it is
 * server→local, and a demo run never reached the server to be merged back.
 *
 * ⚠️ PEEK-THEN-CONSUME-ON-MATCH, exactly like `pendingDiagnostic`. A band mismatch must LEAVE the run
 * stashed — a parent may add a differently-aged sibling first and the demo still belongs to the child
 * they play next. A blind one-shot read loses it silently and unrecoverably.
 *
 * ⚠️ THE PLAN IS ONLY SET WHEN NOTHING BETTER CLAIMED IT. A diagnosed plan outranks a grade-start one
 * (somebody looked), so the caller passes `claimPlan: false` when a pending diagnostic has already
 * arranged this learner's chapters. The SESSIONS are adopted either way — the child played them.
 *
 * Returns what it did, so the caller can log it and a gate can assert it.
 */
export function adoptDemoRun(
  learnerId: string,
  band: AgeGroup,
  claimPlan: boolean,
  deps: {
    enqueueSession: (p: { learnerId: string; chapter: string; phase: 'practice'; correctCount: number
      wrongCount: number; starsEarned: number; xpEarned: number; coinsEarned: number
      clientId: string; completedAt: string }) => void
    score: (correct: number, wrong: number, mastered: boolean) => { stars: number; xp: number; coins: number }
    plan: (chapters: string[]) => void
    advance: (chapter: string) => void
    newId: () => string
  },
): { adopted: number; planSet: boolean } | null {
  const run = readDemo()
  if (!run) return null
  if (run.band !== band) return null          // ⚠️ leave it stashed — the right child may come next

  for (const r of run.results) {
    const { stars, xp, coins } = deps.score(r.correct, r.wrong, r.mastered)
    deps.enqueueSession({
      learnerId, chapter: r.chapter, phase: 'practice',
      correctCount: r.correct, wrongCount: r.wrong,
      starsEarned: stars, xpEarned: xp, coinsEarned: coins,
      clientId: deps.newId(), completedAt: new Date().toISOString(),
    })
  }

  if (claimPlan) {
    deps.plan(gradeStartPlan(band))
    // ⚠️ IN ORDER. `advancePlan` only moves when the chapter IS the current step, so walking the
    // played chapters in the order they were played skips exactly what the child already did — and
    // a chapter they did NOT play cannot silently advance the pointer past it.
    for (const r of run.results) deps.advance(r.chapter)
  }

  clearDemo()                                  // consumed — never replays onto a second learner
  return { adopted: run.results.length, planSet: claimPlan }
}
