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

/**
 * The same question for a whole list at once — the parent dashboard's scoped chapters, about a
 * dozen. ONE round trip: `entitled_chapters` asks `is_chapter_entitled` per chapter server-side, so
 * it is still the one definition, asked N times, without N requests.
 *
 * ⚠️ It used to be N parallel RPCs (12–24 per tap of a child on the dashboard — 124 of the 275 API
 * requests in one day on production, p90 684 ms). That fan-out was the thing most likely to fill
 * PostgREST's pool first under load, and every request paid the same 212 ms distance floor.
 * `null` for every chapter when the call fails, for the reason above: not found out is not refused.
 */
export async function entitledChapters(
  learnerId: string, chapters: string[],
): Promise<Record<string, boolean | null>> {
  const unknown = Object.fromEntries(chapters.map(c => [c, null]))
  if (chapters.length === 0) return unknown
  try {
    const { data, error } = await db().rpc('entitled_chapters', {
      p_learner_id: learnerId,
      p_chapters: chapters,
    })
    if (error || !data || typeof data !== 'object') return unknown
    const got = data as Record<string, unknown>
    return Object.fromEntries(chapters.map(c => [c, typeof got[c] === 'boolean' ? got[c] as boolean : null]))
  } catch {
    return unknown
  }
}
