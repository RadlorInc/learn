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

export interface DemoRun { band: AgeGroup; done: string[]; startedAt: string }

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
    return r && typeof r.band === 'string' && Array.isArray(r.done) ? r as DemoRun : null
  } catch { return null }
}

export function startDemo(band: AgeGroup): DemoRun {
  const run: DemoRun = { band, done: [], startedAt: new Date().toISOString() }
  try { kv.set(KEY, JSON.stringify(run)) } catch { /* storage unavailable */ }
  return run
}

/** Record a finished demo chapter. Idempotent — replaying one does not spend a second slot. */
export function completeDemoChapter(chapterId: string): DemoRun | null {
  const run = readDemo()
  if (!run || run.done.includes(chapterId)) return run
  const next: DemoRun = { ...run, done: [...run.done, chapterId] }
  try { kv.set(KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  return next
}

/** The next chapter to play, or null once the demo is used up. */
export function nextDemoChapter(run: DemoRun | null): string | null {
  if (!run) return null
  return demoChapters(run.band).find(c => !run.done.includes(c)) ?? null
}

export const demoUsedUp = (run: DemoRun | null): boolean =>
  !!run && nextDemoChapter(run) === null

export function clearDemo(): void {
  try { kv.remove(KEY) } catch { /* nothing to clear */ }
}
