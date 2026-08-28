'use client'
/**
 * Billing reads. The data layer is the only place that talks to Supabase.
 *
 * ⚠️⚠️ THERE IS EXACTLY ONE DEFINITION OF "MAY THIS BE RECORDED", AND IT IS IN THE DATABASE.
 * `is_chapter_entitled` is already called from three places — the `sessions` INSERT policy, the
 * `learner_progress` WITH CHECK and inside `sync_session` — precisely so that two guards cannot
 * diverge. A TypeScript copy of the same rules would be a FOURTH guard, and it would disagree
 * silently in the worst direction: letting a child into a chapter the database will then refuse to
 * save, which is a run of work thrown away with nothing on screen saying why.
 *
 * So this asks. It does not decide.
 */
import { db } from '@/data/repositories/_shared'

/**
 * `true` / `false` from the database, or **`null` when we could not find out** — a lost network, a
 * signed-out session, an RPC that errored.
 *
 * ⚠️ NULL IS NOT FALSE, AND THE CALLER MUST NOT TREAT IT AS FALSE. The verdict is a UX gate over a
 * database that already refuses the write; locking a child out of a chapter because their wifi
 * dropped is a real harm, and letting one in costs a session row that `sync_session` will reject
 * anyway. `billing_config` fails open for the same reason and the camera guard fails closed for the
 * opposite one — different failure costs, different defaults.
 */
export async function isChapterEntitled(learnerId: string, chapter: string): Promise<boolean | null> {
  try {
    const { data, error } = await db().rpc('is_chapter_entitled', {
      p_learner_id: learnerId,
      p_chapter: chapter,
    })
    if (error) return null
    return typeof data === 'boolean' ? data : null
  } catch {
    return null
  }
}

/** The same question for a handful of chapters at once — the parent dashboard's scoped list, which
 *  is about a dozen. Still one definition, asked N times; deriving the set locally is the thing
 *  §1 of docs/billing-stage-3.md forbids. */
export async function entitledChapters(
  learnerId: string, chapters: string[],
): Promise<Record<string, boolean | null>> {
  const verdicts = await Promise.all(chapters.map(c => isChapterEntitled(learnerId, c)))
  return Object.fromEntries(chapters.map((c, i) => [c, verdicts[i]]))
}
